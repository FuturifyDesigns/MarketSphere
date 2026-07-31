import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Shared encrypted storage options (Android Keystore / AES-GCM).
class AppSecureStorage {
  AppSecureStorage._();

  static const androidOptions = AndroidOptions(
    // Keep session if Keystore briefly fails; avoid wiping auth on glitches.
    resetOnError: false,
    migrateOnAlgorithmChange: true,
  );

  static const instance = FlutterSecureStorage(aOptions: androidOptions);
}
