# iOS build preflight: unsupported Xcode evidence

Date: 2026-10-03  
Host toolchain: Xcode 16.4 (build 16F6), Swift tools 6.1  
Target: iPhone 16 Pro simulator (`iPhone17,1`), iOS 18.6  
App dependencies: Expo 57.0.26, React Native 0.86.3

## Procedure

1. Copied the managed project to a temporary directory, excluding `.git` and
   `node_modules`; linked the existing dependency tree only for the temporary
   native build.
2. Ran `npx expo prebuild --platform ios --no-install`.
3. Ran `pod install` in the temporary `ios` directory.
4. Ran `xcodebuild` using the generated workspace and the simulator destination.

Prebuild and CocoaPods passed. `xcodebuild` failed before an application bundle
could be installed:

```
[ExpoModulesJSI] Detected: prebuilt RN
[ExpoModulesJSI] Building framework slice for iphonesimulator...
xcodebuild: error: Could not resolve package dependencies:
  package 'apple' is using Swift tools version 6.2.0 but the installed version is 6.1.0
** BUILD FAILED **
```

## Conclusion

The iOS simulator itself is available, but Xcode 16.4 is below Expo SDK 57's
documented Xcode 26.4+ requirement. No native runtime or secure-storage claim is
made from this result. Upgrade Xcode, regenerate the temporary native project,
and rerun the build before attempting iOS UAT.
