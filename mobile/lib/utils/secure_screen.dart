import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

/// Blocks screenshots / recent-apps previews while mounted (auth / PII screens).
class SecureScreen extends StatefulWidget {
  const SecureScreen({super.key, required this.child});

  final Widget child;

  static const _channel = MethodChannel('com.marketspheregroup.market_sphere/security');

  static Future<void> setEnabled(bool enabled) async {
    try {
      await _channel.invokeMethod<void>('setSecureFlag', {'enabled': enabled});
    } catch (_) {
      // Platform channel unavailable (tests / unsupported platform).
    }
  }

  @override
  State<SecureScreen> createState() => _SecureScreenState();
}

class _SecureScreenState extends State<SecureScreen> {
  @override
  void initState() {
    super.initState();
    SecureScreen.setEnabled(true);
  }

  @override
  void dispose() {
    SecureScreen.setEnabled(false);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
