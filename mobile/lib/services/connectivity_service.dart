import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Tracks online/offline with light debouncing for efficient cache use.
class ConnectivityService extends ChangeNotifier {
  ConnectivityService._();
  static final ConnectivityService instance = ConnectivityService._();

  final _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _sub;
  var _online = true;
  var _ready = false;
  DateTime? _lastOnlineAt;
  Timer? _debounce;

  bool get isOnline => _online;
  bool get isOffline => !_online;
  bool get ready => _ready;
  DateTime? get lastOnlineAt => _lastOnlineAt;

  Future<void> init() async {
    if (_ready) return;
    try {
      final results = await _connectivity.checkConnectivity();
      _apply(results, notify: false);
    } catch (_) {
      _online = true; // fail open so first launch still tries network
    }
    _sub = _connectivity.onConnectivityChanged.listen((results) {
      _debounce?.cancel();
      _debounce = Timer(const Duration(milliseconds: 350), () => _apply(results));
    });
    _ready = true;
    notifyListeners();
  }

  Future<bool> refresh() async {
    try {
      final results = await _connectivity.checkConnectivity();
      _apply(results);
    } catch (_) {}
    return _online;
  }

  void _apply(List<ConnectivityResult> results, {bool notify = true}) {
    final next = results.any((r) => r != ConnectivityResult.none);
    final changed = next != _online;
    _online = next;
    if (_online) _lastOnlineAt = DateTime.now();
    if (notify && (changed || !_ready)) notifyListeners();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _sub?.cancel();
    super.dispose();
  }
}
