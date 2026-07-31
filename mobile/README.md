# Market Sphere Group — Android app

Native Flutter app using the same Supabase backend as the website.

## Google sign-in (in-app)

The app uses **native Google Sign-In** (account picker inside the app). It does **not** open the website.

### Required setup

1. In `mobile/.env` set:
   ```
   SUPABASE_URL=https://….supabase.co
   SUPABASE_ANON_KEY=…
   GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```
   Use the **Web** client ID from Google Cloud (same one configured in Supabase → Auth → Google).

2. In Google Cloud Console → Credentials, create an **Android** OAuth client
   (same project as the Web client above):
   - Application type: **Android**
   - Package name: `com.marketspheregroup.market_sphere`
   - SHA-1 (debug keystore):
     `52:D3:10:FB:DE:D2:B4:68:24:04:98:91:BD:C2:49:90:37:FD:B2:22`

   Without this Android client, Google often reports the sign-in as “canceled”
   even when you did not cancel.

   Get / refresh the SHA-1 later with:
   ```bat
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -alias androiddebugkey -keystore %USERPROFILE%\.android\debug.keystore -storepass android -keypass android
   ```

3. In Supabase → Authentication → Providers → Google, add that Web client ID under **Authorized Client IDs** (if not already).

## Role requirement

Before Google signup (website + app), users must choose Customer or Provider.

## Optional deep link (browser OAuth fallback)

If you ever use browser OAuth again, add this to Supabase → Auth → URL Configuration → Redirect URLs:

`com.marketspheregroup.market_sphere://login-callback/`

## Run (debug)

Config is injected via dart-define (`.env` is **not** packaged as a Flutter asset):

```bat
cd mobile
flutter pub get
flutter run --dart-define-from-file=.env
```

## Build (release)

Preferred (obfuscated + dart-define):

```bat
cd mobile
scripts\build-release.bat
```

Or manually:

```bat
flutter build apk --release --obfuscate --split-debug-info=build/symbols --dart-define-from-file=.env
```

Local-only APK without an upload keystore:

```bat
set ALLOW_DEBUG_SIGNING=1
scripts\build-release.bat
```

(or `flutter build apk --release …` with Gradle property `-PallowDebugSigning=true` via `ORG_GRADLE_PROJECT_allowDebugSigning=true`)

Archive `build/symbols` privately — needed to decode crash stacks.

## App security (standard hardening)

Applied in this project:

- **HTTPS only** — cleartext blocked in manifest + network security config (system CAs)
- **No backup of auth data** — `allowBackup=false` + backup / data-extraction exclude rules
- **Encrypted session storage** — Supabase JWT + PKCE in `flutter_secure_storage` (Android Keystore), migrated off SharedPreferences
- **No `.env` asset in release** — use `--dart-define-from-file=.env`
- **R8 minify + shrink** on release + **Dart `--obfuscate`** via release script
- **Release signing required** — fails without `android/key.properties` unless `-PallowDebugSigning=true`
- **Screenshot blocking** — `FLAG_SECURE` on login, register, and edit-profile
- **Logout hygiene** — contact phones/emails stripped from offline caches (favourites IDs kept)
- **Deep links** — host/scheme allowlist + UUID checks; App Links limited to `/showcase`, `/providers`, `/provider`
- **Role allowlist** — client only accepts `customer` / `provider` (server still enforces)

### Play Store signing (required before publishing)

1. Generate an upload keystore (keep it offline / backed up):
   ```bat
   "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Copy `android/key.properties.example` → `android/key.properties` and fill in paths/passwords.
3. Add the **upload keystore SHA-1 / SHA-256** to Google Android OAuth + `public/.well-known/assetlinks.json` before relying on App Links / Google on Play builds.

Server-side RLS, Auth redirect allowlists, and Storage policies remain the real API control — the anon key in the binary is expected for Supabase.
