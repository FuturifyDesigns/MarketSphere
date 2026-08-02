import 'dart:async';
import 'dart:io';

import 'package:http/http.dart';
import 'package:http/io_client.dart';

/// Fails slow Supabase requests instead of letting them hang forever.
///
/// Android keeps sockets open on captive portals and dead data connections, so
/// without this a query can never complete and the UI spins indefinitely. The
/// connect timeout also caps the case where TCP to an unreachable address (for
/// example an IPv6 route that black-holes) would otherwise wait for the OS.
class TimeoutHttpClient extends BaseClient {
  TimeoutHttpClient({
    this.timeout = const Duration(seconds: 12),
    Duration connectTimeout = const Duration(seconds: 8),
  }) : _inner = IOClient(
          HttpClient()
            ..connectionTimeout = connectTimeout
            ..idleTimeout = const Duration(seconds: 15),
        );

  final Client _inner;
  final Duration timeout;

  @override
  Future<StreamedResponse> send(BaseRequest request) {
    return _inner.send(request).timeout(
      timeout,
      onTimeout: () {
        throw TimeoutException(
          'No response from ${request.url.host} in ${timeout.inSeconds}s',
          timeout,
        );
      },
    );
  }

  @override
  void close() {
    _inner.close();
    super.close();
  }
}
