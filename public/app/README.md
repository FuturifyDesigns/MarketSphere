# Android APK hosting
#
# 1. Build:  flutter build apk --release
# 2. Copy:   build/app/outputs/flutter-apk/app-release.apk → this folder as market-sphere.apk
# 3. Bump:   mobile/pubspec.yaml version (e.g. 1.0.1+2) AND version.json "version" + "build"
# 4. Deploy the site so /app/version.json and /app/market-sphere.apk are public
#
# The app checks version.json on launch and prompts when "build" is higher than the
# installed build number.
