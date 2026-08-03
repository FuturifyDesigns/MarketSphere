# Android APK hosting

1. Build: `flutter build apk --release` in `mobile/`
2. Copy: `mobile/build/app/outputs/flutter-apk/app-release.apk` → `public/app/market-sphere.apk`
3. Bump: `mobile/pubspec.yaml` version **and** `version.json` `version` + `build`
4. Deploy the site so these are public:
   - https://marketspheregroup.com/app
   - https://marketspheregroup.com/app/market-sphere.apk
   - https://marketspheregroup.com/app/version.json

The app checks `version.json` on launch and prompts when `build` is higher than the installed build number.
