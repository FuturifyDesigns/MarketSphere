import 'dart:async';

import 'package:http/http.dart';

/// Fails slow Supabase requests instead of letting them hang forever.
///
/// Android keeps sockets open on captive portals / dead data connections, so
/// without this a query can never complete and the UI spins indefinitely.
class TimeoutHttpClient extends BaseClient {
  TimeoutHttpClient({Client? inner, this.timeout = const Duration(seconds: 12)})
      : _inner = inner ?? Client();

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
