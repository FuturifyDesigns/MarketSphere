@echo off
setlocal
cd /d "%~dp0.."

if not exist ".env" (
  echo Missing mobile\.env — create it with SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_WEB_CLIENT_ID.
  exit /b 1
)

set FLUTTER=flutter
if exist "C:\Users\Leonm\dev\flutter\bin\flutter.bat" set FLUTTER=C:\Users\Leonm\dev\flutter\bin\flutter.bat
if exist "C:\Users\Leonm\Downloads\flutter\bin\flutter.bat" set FLUTTER=C:\Users\Leonm\Downloads\flutter\bin\flutter.bat

if /I "%ALLOW_DEBUG_SIGNING%"=="1" (
  set ORG_GRADLE_PROJECT_allowDebugSigning=true
  echo Note: ALLOW_DEBUG_SIGNING=1 — release APK will use the DEBUG keystore.
)

echo Building release APK with dart-define + Dart obfuscation...
"%FLUTTER%" build apk --release ^
  --obfuscate ^
  --split-debug-info=build/symbols ^
  --dart-define-from-file=.env

if errorlevel 1 (
  echo.
  echo If signing failed, either:
  echo   1^) Create android\key.properties from key.properties.example, or
  echo   2^) For local-only APK: set ALLOW_DEBUG_SIGNING=1 and re-run.
  exit /b 1
)

echo.
echo APK: build\app\outputs\flutter-apk\app-release.apk
echo Keep build\symbols private ^(needed to de-obfuscate crash stacks^).
endlocal
