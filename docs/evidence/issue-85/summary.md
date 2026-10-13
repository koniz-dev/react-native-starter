# Issue 85: UI and tests (main c17af85; devices on 5268598)

| # | Criterion | Evidence | Result |
|---|-----------|----------|--------|
| 1 | Listed surviving mutants killed | `mutants-rerun.log` (the audit's own mutate.js on c17af85's tree): 22 of 25 killed. Not killed: M60 is equivalent (it edits the React key, the first match); M03 (the tabs' iOS back title) can't be seen in Jest, which doesn't render native-stack headers; M12 (`tab-explore` testID) is caught by the e2e flows that tap it | PASS |
| 2 | Profile logs unknown errors; link roles; Showcase title; wrapping buttons; interpolate own keys; start/end styles; one translatable announcement; labeled indicator | tests in `tests-before-after.txt` (9 fail before); web smoke (`web/smoke.log`): example links are buttons, Showcase sets the tab title "Component showcase" | PASS |
| 3 | Gates, CI, e2e | `gates.log` (466 tests); CI green on 5268598; iOS 7/7 + dark (`ios/`); Android Expo Go 7/7 + dark (`android-expo-go/`, run 38427230189); native debug 7/7 + dark (`android-native-debug/`, run 38427235192); web smoke passed (`web/`). Screenshots reviewed | PASS |
