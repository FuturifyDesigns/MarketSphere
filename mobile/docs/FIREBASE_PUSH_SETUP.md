# Firebase Cloud Messaging setup (Market Sphere Android)

Project: `market-sphere-group-d4ff9`  
Package: `com.marketspheregroup.market_sphere`

## Already done in the repo

- `mobile/android/app/google-services.json` (from your download)
- Google Services Gradle plugin (`settings.gradle.kts` + `app/build.gradle.kts`)
- Flutter packages: `firebase_core`, `firebase_messaging`
- `lib/firebase_options.dart` + FCM token registration in `PushService`
- Edge Function stub: `supabase/functions/push-on-notification`

## Server side (done on MarketSphere / `creaxptcrptygvmtioub`)

- Secret `FCM_SERVICE_ACCOUNT_JSON` set
- Edge Function `push-on-notification` deployed (`--no-verify-jwt`)
- DB trigger `trg_push_on_notification` on `public.notifications` INSERT → `net.http_post` to the function
- Migration mirror: `supabase/migrations/20260802162200_push_on_notification_trigger.sql`

Helper (if you ever need to rotate the key): `scripts/finish-fcm-push.ps1`

## What you do on the phone

```bat
cd mobile
flutter pub get
flutter run --dart-define-from-file=.env
```

Sign in on a **physical Android device**. In debug logs you should see:

`[push] FCM token registered (... chars)`

In Supabase → Table Editor → `device_tokens`, the token must **not** start with `local-`.

Then:

1. Publish a showcase listing (after broadcast SQL is applied), **or**
2. Send a provider enquiry from a customer account
3. Force-stop the Market Sphere app on the phone
4. Confirm a system notification still arrives

## Notes

- Finish the Firebase console wizard (**Next / Continue**) if still open — Gradle pieces are already in-repo.
- SHA-1 for Google Sign-In is separate from FCM.
- `google-services.json` is fine to commit. Never commit `*firebase-adminsdk*.json`.
- If you pasted a Supabase personal access token in chat, revoke it: https://supabase.com/dashboard/account/tokens
