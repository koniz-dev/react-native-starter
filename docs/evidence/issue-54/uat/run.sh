#!/usr/bin/env bash
# usage: run.sh <label>  — starts mock + Metro, runs the UAT flow, stops them.
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
set -uo pipefail
SP=/private/tmp/claude-501/-Users-nguyenanhkiet-Playground-react-native-starter/af240f43-5faf-4dd2-b463-4799602502e7/scratchpad
ROOT=/Users/nguyenanhkiet/Playground/react-native-starter
L="$1"; OUT="$SP/i54/out/$L"; mkdir -p "$OUT"
node "$ROOT/scripts/e2e/mock-api.js" 9999 >"$OUT/mock-api.log" 2>&1 & MOCK=$!
( cd "$ROOT" && EXPO_PUBLIC_USE_DEMO_BACKENDS=true EXPO_PUBLIC_API_URL=http://localhost:9999 exec npx expo start --port 8081 --clear >"$OUT/metro.log" 2>&1 ) & METRO=$!
for _ in $(seq 1 90); do curl -s localhost:8081/status | grep -q running && break; sleep 2; done
curl -s -o /dev/null --max-time 600 "http://localhost:8081/index.bundle?platform=android&dev=true&minify=false"
adb shell settings put global window_animation_scale 0; adb shell settings put global transition_animation_scale 0; adb shell settings put global animator_duration_scale 0; adb shell settings put secure anr_show_background 0
adb reverse tcp:8081 tcp:8081 >/dev/null; adb reverse tcp:9999 tcp:9999 >/dev/null
export MAESTRO_DRIVER_STARTUP_TIMEOUT=180000
"$SP/maestro.sh" test -e APP_ID=host.exp.exponent -e APP_URL=exp://127.0.0.1:8081 -e MOCK_API_URL=http://localhost:9999 \
  --test-output-dir "$OUT/maestro" "$SP/i54/flows/${FLOW:-handled-failures}.yaml" >"$OUT/maestro.log" 2>&1
echo "maestro exit $?" | tee -a "$OUT/maestro.log"
pkill -P $METRO; kill $METRO $MOCK 2>/dev/null; pkill -f "expo start --port 8081"; true
