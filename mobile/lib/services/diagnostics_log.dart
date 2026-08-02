import 'package:flutter/foundation.dart';

class DiagnosticsEntry {
  DiagnosticsEntry(this.tag, this.message) : at = DateTime.now();

  final String tag;
  final String message;
  final DateTime at;

  String get clock =>
      '${at.hour.toString().padLeft(2, '0')}:'
      '${at.minute.toString().padLeft(2, '0')}:'
      '${at.second.toString().padLeft(2, '0')}';

  @override
  String toString() => '[$clock] $tag: $message';
}

/// In-memory ring buffer of recent failures.
///
/// Release builds have no attached console, so this is the only way a user can
/// report what actually went wrong on their device.
class DiagnosticsLog extends ChangeNotifier {
  DiagnosticsLog._();
  static final DiagnosticsLog instance = DiagnosticsLog._();

  static const _maxEntries = 40;
  final _entries = <DiagnosticsEntry>[];

  List<DiagnosticsEntry> get entries => List.unmodifiable(_entries.reversed);

  void record(String tag, Object error, {StackTrace? stack}) {
    final message = '${error.runtimeType}: $error';
    debugPrint('[$tag] $message');
    if (stack != null && kDebugMode) debugPrint(stack.toString());
    _entries.add(DiagnosticsEntry(tag, message));
    if (_entries.length > _maxEntries) _entries.removeAt(0);
    notifyListeners();
  }

  void note(String tag, String message) {
    debugPrint('[$tag] $message');
    _entries.add(DiagnosticsEntry(tag, message));
    if (_entries.length > _maxEntries) _entries.removeAt(0);
    notifyListeners();
  }

  void clear() {
    _entries.clear();
    notifyListeners();
  }

  String asText() => entries.map((e) => e.toString()).join('\n');
}
