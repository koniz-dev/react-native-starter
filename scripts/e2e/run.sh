#!/usr/bin/env bash
# Runs the Maestro flows in .maestro/ against Expo Go on a booted Android
# emulator or iOS simulator (npm run test:e2e:android / test:e2e:ios).
#
# It starts the e2e mock API (scripts/e2e/mock-api.js) and Metro with
# EXPO_PUBLIC_API_URL pointing at it (auth keeps the DummyJSON demo backend),
# runs the flows, then the dark-mode flow with the device in dark mode, and
# stops everything. Output: e2e-results/<platform>/ (gitignored).
#
# Needs: the Maestro CLI (`maestro` on PATH, or MAESTRO=/path/to/maestro),
# a booted device with Expo Go, and network access for the demo sign-in.
# No accounts. See docs/testing.md#end-to-end-flows-maestro.
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
  set_dark_mode no || true
  for pid in "${PIDS[@]}"; do kill_tree "$pid"; done
}
trap cleanup EXIT

set_dark_mode() {
  if [ "$PLATFORM" = android ]; then
    adb shell cmd uimode night "$1" >/dev/null
  else
    xcrun simctl ui booted appearance "$([ "$1" = yes ] && echo dark || echo light)"
  fi
}

node "$ROOT/scripts/e2e/mock-api.js" "$MOCK_PORT" >"$OUT/mock-api.log" 2>&1 &
PIDS+=($!)

(
  cd "$ROOT"
  EXPO_PUBLIC_USE_DEMO_BACKENDS=true \
    EXPO_PUBLIC_API_URL="http://localhost:$MOCK_PORT" \
    npx expo start --port "$METRO_PORT" --clear >"$OUT/metro.log" 2>&1
) &
PIDS+=($!)

for _ in $(seq 1 90); do
  curl -s "http://localhost:$METRO_PORT/status" | grep -q running && break
  sleep 2
done
curl -s "http://localhost:$METRO_PORT/status" | grep -q running || { echo "Metro did not start (see $OUT/metro.log)" >&2; exit 1; }

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
  adb reverse "tcp:$MOCK_PORT" "tcp:$MOCK_PORT" >/dev/null
fi

set_dark_mode no
COMMON=(-e "APP_ID=$APP_ID" -e "APP_URL=$APP_URL" -e "MOCK_API_URL=http://localhost:$MOCK_PORT")

status=0
"$MAESTRO" test "${COMMON[@]}" --format junit --output "$OUT/report.xml" \
  --test-output-dir "$OUT/maestro" "$ROOT/.maestro" | tee "$OUT/maestro.log" || status=$?

set_dark_mode yes
"$MAESTRO" test "${COMMON[@]}" --test-output-dir "$OUT/maestro-dark" \
  "$ROOT/.maestro/dark-mode.yaml" | tee "$OUT/maestro-dark.log" || status=$?

exit "$status"
