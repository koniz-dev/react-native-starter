title='Weekly E2E (Android) run failed'
number="$(gh issue list --state open --search "\"$title\" in:title" --json number,title \
  --jq "map(select(.title == \"$title\")) | .[0].number // empty")"
if [ -n "$number" ]; then
  gh issue comment "$number" --body "Failed again: $RUN_URL"
else
  gh issue create --title "$title" --body "The weekly Maestro run on an Android emulator failed: $RUN_URL

Its Maestro results are attached to the run. Fix the cause, then dispatch the E2E (Android) workflow and close this issue when it passes."
fi
