import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Reads config from `--dart-define` / `--dart-define-from-file` first,
/// then falls back to `mobile/.env` (local debug). Prefer dart-define for
/// release builds so keys are not shipped as a named Flutter asset.
class EnvConfig {
  EnvConfig._();

  static String _fromDefine(String key) {
    switch (key) {
      case 'SUPABASE_URL':
        return const String.fromEnvironment('SUPABASE_URL', defaultValue: '');
      case 'SUPABASE_ANON_KEY':
        return const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');
      case 'GOOGLE_WEB_CLIENT_ID':
        return const String.fromEnvironment('GOOGLE_WEB_CLIENT_ID', defaultValue: '');
      default:
        return '';
    }
  }

  static String get(String key) {
    final fromDefine = _fromDefine(key).trim();
    if (fromDefine.isNotEmpty) return fromDefine;
    return dotenv.env[key]?.trim() ?? '';
  }

  static String get supabaseUrl => get('SUPABASE_URL');
  static String get supabaseAnonKey => get('SUPABASE_ANON_KEY');
  static String get googleWebClientId => get('GOOGLE_WEB_CLIENT_ID');
}
