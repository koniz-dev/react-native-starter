#!/usr/bin/env bash
# Runs the Maestro flows in .maestro/ against Expo Go on a booted Android
# emulator or iOS simulator (npm run test:e2e:android / test:e2e:ios).
#
# It starts the e2e mock API (scripts/e2e/mock-api.js) and Metro with
# EXPO_PUBLIC_API_URL pointing at it, runs the flows, then the dark-mode flow
# with the device in dark mode, and stops everything. Output:
# e2e-results/<platform>/ (gitignored).
#
# Your own backend or mock instead (docs/testing.md#your-backend-or-mock):
#   E2E_API_URL        the app's API URL (default: the e2e mock)
#   E2E_AUTH_API_URL   the auth URL (default: E2E_API_URL)
#   E2E_BACKEND_CMD    a command that starts it (e.g. "node scripts/my-mock.js"),
#                      run in the background and stopped at the end
# Signed-in flows (subflows/sign-in.yaml) sign in with MAESTRO_E2E_USERNAME
# and MAESTRO_E2E_PASSWORD, a test account; flows get API_URL and
# AUTH_API_URL to reach the backend.
# On Android, the ports of localhost URLs are forwarded with adb reverse.
#
# Needs: the Maestro CLI (`maestro` on PATH, or MAESTRO=/path/to/maestro) and
# a booted device with Expo Go. See docs/testing.md#end-to-end-flows-maestro.
set -euo pipefail

PLATFORM="${1:?usage: run.sh android|ios}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MAESTRO="${MAESTRO:-maestro}"
METRO_PORT="${METRO_PORT:-8081}"
MOCK_PORT="${MOCK_PORT:-9999}"
OUT="$ROOT/e2e-results/$PLATFORM"
# Slow emulators need longer than Maestro's default to start its driver.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-180000}"

case "$PLATFORM" in
  android) APP_ID=host.exp.exponent ;;
  ios) APP_ID=host.exp.Exponent ;;
  *) echo "usage: run.sh android|ios" >&2; exit 2 ;;
esac
APP_ID="${E2E_APP_ID:-$APP_ID}"
APP_URL="${E2E_APP_URL:-exp://127.0.0.1:$METRO_PORT}"

# @demo remove-block-start
# The signed-in flows use the demo account, served by the e2e mock.
export MAESTRO_E2E_USERNAME="${MAESTRO_E2E_USERNAME:-emilys}"
export MAESTRO_E2E_PASSWORD="${MAESTRO_E2E_PASSWORD:-emilyspass}"
# @demo remove-block-end
command -v "$MAESTRO" >/dev/null || { echo "Maestro CLI not found (set MAESTRO=...)" >&2; exit 1; }
if [ "$PLATFORM" = android ]; then
  adb get-state >/dev/null 2>&1 || { echo "No Android device/emulator connected" >&2; exit 1; }
else
  xcrun simctl list devices booted | grep -q Booted || { echo "No booted iOS simulator" >&2; exit 1; }
fi

rm -rf "$OUT"
mkdir -p "$OUT"
PIDS=()
kill_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do kill_tree "$child"; done
  kill "$1" 2>/dev/null || true
}
cleanup() {
  # Back to the appearance the device had before the run (unset if it
  # stopped before that was read: nothing changed it yet).
  if [ -n "${WAS_MODE:-}" ]; then set_dark_mode "$WAS_MODE" || true; fi
  # (An empty array is "unbound" to macOS's bash 3.2 under set -u.)
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do kill_tree "$pid"; done
}
trap cleanup EXIT

# yes or no (or, on Android, the device's own mode, such as auto).
set_dark_mode() {
  if [ "$PLATFORM" = android ]; then
    adb shell cmd uimode night "$1" >/dev/null
  else
    xcrun simctl ui booted appearance "$([ "$1" = yes ] && echo dark || echo light)"
  fi
}
# The device's mode now, to restore at the end: Android's night mode (yes,
# no, auto, ...), or yes/no from the simulator's appearance.
current_mode() {
  if [ "$PLATFORM" = android ]; then
    { adb shell cmd uimode night 2>/dev/null || true; } | tr -d '\r' | sed -n 's/^Night mode: //p'
  else
    [ "$(xcrun simctl ui booted appearance 2>/dev/null)" = dark ] && echo yes || echo no
  fi
}
WAS_MODE="$(current_mode)"
# Unreadable: assume light, the mode the flows start in.
WAS_MODE="${WAS_MODE:-no}"

# A server already on either port (your own `npm start`, an earlier run) would
# answer the readiness checks below in place of this run's, without the e2e
# URLs: stop here instead.
for port in "$METRO_PORT" "$MOCK_PORT"; do
  if curl -s -o /dev/null --max-time 2 "http://localhost:$port/"; then
    echo "Port $port is already in use; stop that server, or set METRO_PORT/MOCK_PORT for other ports" >&2
    exit 1
  fi
done

node "$ROOT/scripts/e2e/mock-api.js" "$MOCK_PORT" >"$OUT/mock-api.log" 2>&1 &
MOCK_PID=$!
PIDS+=("$MOCK_PID")
MOCK_API_URL="http://127.0.0.1:$MOCK_PORT"
# Ready once this mock (not another server on the port) answers /__mode.
for _ in $(seq 1 20); do
  curl -s "$MOCK_API_URL/__mode" | grep -q '"mode"' && break
  kill -0 "$MOCK_PID" 2>/dev/null || break
  sleep 0.5
done
kill -0 "$MOCK_PID" 2>/dev/null && curl -s "$MOCK_API_URL/__mode" | grep -q '"mode"' ||
  { echo "The e2e mock did not start on port $MOCK_PORT (see $OUT/mock-api.log; set MOCK_PORT for another port)" >&2; exit 1; }
API_URL="${E2E_API_URL:-$MOCK_API_URL}"
AUTH_API_URL="${E2E_AUTH_API_URL:-$API_URL}"
APP_ENV=(EXPO_PUBLIC_API_URL="$API_URL" EXPO_PUBLIC_AUTH_API_URL="$AUTH_API_URL")

# Whether a URL is this run's mock: localhost or 127.0.0.1 on MOCK_PORT.
is_mock_url() {
  local authority="${1#http://}"
  authority="${authority%%/*}"
  case "$authority" in
    "localhost:$MOCK_PORT" | "127.0.0.1:$MOCK_PORT") return 0 ;;
  esac
  return 1
}

if [ -n "${E2E_BACKEND_CMD:-}" ]; then
  # A server already answering there (an earlier run's) would pass the
  # readiness check below in place of the one this run starts.
  for url in "$API_URL" "$AUTH_API_URL"; do
    # This run's e2e mock (the default for a URL you didn't set) answers too.
    is_mock_url "$url" && continue
    if curl -s -o /dev/null --max-time 2 "$url"; then
      echo "$url already answers; stop that server before E2E_BACKEND_CMD starts yours" >&2
      exit 1
    fi
  done
  (cd "$ROOT" && exec bash -c "$E2E_BACKEND_CMD") >"$OUT/backend.log" 2>&1 &
  BACKEND_PID=$!
  PIDS+=("$BACKEND_PID")
  # Ready once both URLs answer anything over HTTP.
  for url in "$API_URL" "$AUTH_API_URL"; do
    for _ in $(seq 1 30); do
      curl -s -o /dev/null "$url" && break
      kill -0 "$BACKEND_PID" 2>/dev/null || break
      sleep 1
    done
    curl -s -o /dev/null "$url" || { echo "The backend at $url did not start (see $OUT/backend.log)" >&2; exit 1; }
  done
fi

(
  cd "$ROOT"
  env "${APP_ENV[@]}" npx expo start --port "$METRO_PORT" --clear >"$OUT/metro.log" 2>&1
) &
METRO_PID=$!
PIDS+=("$METRO_PID")

# Ready once Metro answers, and it is this run's Metro (still running).
for _ in $(seq 1 90); do
  curl -s "http://localhost:$METRO_PORT/status" | grep -q running && break
  kill -0 "$METRO_PID" 2>/dev/null || break
  sleep 2
done
kill -0 "$METRO_PID" 2>/dev/null && curl -s "http://localhost:$METRO_PORT/status" | grep -q running ||
  { echo "Metro did not start on port $METRO_PORT (see $OUT/metro.log; set METRO_PORT for another port)" >&2; exit 1; }

# Build the bundle once before Maestro starts its driver: on a slow machine,
# the first bundle and the driver's startup compete for CPU.
echo "Bundling for $PLATFORM..."
curl -s -o /dev/null --max-time 600 \
  "http://localhost:$METRO_PORT/index.bundle?platform=$PLATFORM&dev=true&minify=false" || true

if [ "$PLATFORM" = android ]; then
  # Test-device settings: no system animations, and no "isn't responding"
  # dialogs for background apps (a busy emulator shows them for the
  # launcher, covering the app under test).
  adb shell settings put global window_animation_scale 0
  adb shell settings put global transition_animation_scale 0
  adb shell settings put global animator_duration_scale 0
  adb shell settings put secure anr_show_background 0
  adb reverse "tcp:$METRO_PORT" "tcp:$METRO_PORT" >/dev/null
  for url in "$MOCK_API_URL" "$API_URL" "$AUTH_API_URL"; do
    if [[ "$url" =~ ^https?://(localhost|127\.0\.0\.1):([0-9]+) ]]; then
      adb reverse "tcp:${BASH_REMATCH[2]}" "tcp:${BASH_REMATCH[2]}" >/dev/null
    fi
  done
fi

# API_URL and AUTH_API_URL let a flow reach your backend (e.g. to seed data).
COMMON=(-e "APP_ID=$APP_ID" -e "APP_URL=$APP_URL" -e "MOCK_API_URL=$MOCK_API_URL"
  -e "API_URL=$API_URL" -e "AUTH_API_URL=$AUTH_API_URL")

# The numbered flows, then the dark-mode flow; $1 names the attempt's output
# (maestro, report.xml, maestro-dark; with a -retry suffix the second time).
run_flows() {
  local suffix="$1" result=0
  set_dark_mode no
  "$MAESTRO" test "${COMMON[@]}" --exclude-tags dark --format junit \
    --output "$OUT/report$suffix.xml" --test-output-dir "$OUT/maestro$suffix" \
    "$ROOT/.maestro" | tee "$OUT/maestro$suffix.log" || result=$?
  set_dark_mode yes
  "$MAESTRO" test "${COMMON[@]}" --test-output-dir "$OUT/maestro-dark$suffix" \
    "$ROOT/.maestro/dark-mode.yaml" | tee "$OUT/maestro-dark$suffix.log" || result=$?
  return "$result"
}

status=0
run_flows "" || status=$?
# The iOS simulator and its XCTest driver fail a flow now and then on a busy
# machine: a tap that never arrives, a driver that becomes unreachable
# (#127). On iOS, run everything once more (the flows stop at the first
# failure, so the later ones haven't run); a real failure fails both times.
if [ "$status" -ne 0 ] && [ "$PLATFORM" = ios ]; then
  echo "E2E RETRY: a flow failed (see $OUT/maestro.log); running the flows once more." >&2
  status=0
  run_flows -retry || status=$?
fi

exit "$status"
