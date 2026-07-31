import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_secure_storage.dart';

/// Persists the Supabase session in encrypted platform storage (Android Keystore).
///
/// On first run after upgrade, migrates any session previously stored in
/// SharedPreferences and deletes the plaintext copy.
class SecureSessionLocalStorage extends LocalStorage {
  SecureSessionLocalStorage({required this.persistSessionKey})
      : _secure = AppSecureStorage.instance;

  final String persistSessionKey;
  final FlutterSecureStorage _secure;

  @override
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(persistSessionKey);
    if (legacy == null || legacy.isEmpty) return;

    final existing = await _secure.read(key: persistSessionKey);
    if (existing == null || existing.isEmpty) {
      await _secure.write(key: persistSessionKey, value: legacy);
    }
    await prefs.remove(persistSessionKey);
  }

  @override
  Future<bool> hasAccessToken() async {
    final value = await _secure.read(key: persistSessionKey);
    return value != null && value.isNotEmpty;
  }

  @override
  Future<String?> accessToken() => _secure.read(key: persistSessionKey);

  @override
  Future<void> removePersistedSession() async {
    await _secure.delete(key: persistSessionKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(persistSessionKey);
  }

  @override
  Future<void> persistSession(String persistSessionString) async {
    await _secure.write(key: persistSessionKey, value: persistSessionString);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(persistSessionKey);
  }
}

/// Stores PKCE verifier/state in encrypted storage instead of SharedPreferences.
class SecureGotrueAsyncStorage extends GotrueAsyncStorage {
  SecureGotrueAsyncStorage() : _secure = AppSecureStorage.instance;

  final FlutterSecureStorage _secure;
  static const _prefix = 'sb-pkce-';

  String _key(String key) => '$_prefix$key';

  @override
  Future<String?> getItem({required String key}) =>
      _secure.read(key: _key(key));

  @override
  Future<void> setItem({required String key, required String value}) =>
      _secure.write(key: _key(key), value: value);

  @override
  Future<void> removeItem({required String key}) =>
      _secure.delete(key: _key(key));
}
