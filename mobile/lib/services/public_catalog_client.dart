import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'env_config.dart';

/// Public catalog reads over plain HTTPS using the anon key.
///
/// Intentionally bypasses [Supabase.instance.client]: that client reads the
/// session from FlutterSecureStorage / holds the GoTrue lock on every request.
/// On Android both can hang at cold start, so Home would sit forever while a
/// later connection test (auth already idle, session cached) succeeds.
class PublicCatalogClient {
  PublicCatalogClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  static const _timeout = Duration(seconds: 12);

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = EnvConfig.supabaseUrl.replaceAll(RegExp(r'/$'), '');
    return Uri.parse('$base/rest/v1/$path').replace(queryParameters: query);
  }

  Map<String, String> get _headers {
    final key = EnvConfig.supabaseAnonKey;
    return {
      'apikey': key,
      'Authorization': 'Bearer $key',
      'Accept': 'application/json',
    };
  }

  Future<List<Map<String, dynamic>>> getRows(
    String table, {
    required String select,
    Map<String, String> filters = const {},
    String? order,
    int? limit,
  }) async {
    final query = <String, String>{
      'select': select,
      ...filters,
      if (order != null && order.isNotEmpty) 'order': order,
      if (limit != null) 'limit': '$limit',
    };
    final response = await _client
        .get(_uri(table, query), headers: _headers)
        .timeout(_timeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw PublicCatalogException(
        'HTTP ${response.statusCode}',
        response.body.length > 240 ? '${response.body.substring(0, 240)}…' : response.body,
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List) {
      throw PublicCatalogException('Unexpected payload', decoded.runtimeType.toString());
    }
    return decoded
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
}

class PublicCatalogException implements Exception {
  PublicCatalogException(this.code, this.detail);

  final String code;
  final String detail;

  @override
  String toString() => '$code · $detail';
}
