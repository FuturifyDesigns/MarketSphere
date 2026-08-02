import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config.dart';
import '../../services/connectivity_service.dart';
import '../../services/env_config.dart';
import '../../widgets/brand_app_bar.dart';

class _Check {
  _Check(this.label, this.ok, this.detail, this.ms);

  final String label;
  final bool ok;
  final String detail;
  final int ms;
}

/// On-device check of the Supabase connection, so a blank feed can be explained.
class ConnectionTestScreen extends StatefulWidget {
  const ConnectionTestScreen({super.key});

  @override
  State<ConnectionTestScreen> createState() => _ConnectionTestScreenState();
}

class _ConnectionTestScreenState extends State<ConnectionTestScreen> {
  var _running = false;
  List<_Check> _results = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _run());
  }

  Future<_Check> _time(String label, Future<String> Function() run) async {
    final sw = Stopwatch()..start();
    try {
      final detail = await run().timeout(const Duration(seconds: 12));
      sw.stop();
      return _Check(label, true, detail, sw.elapsedMilliseconds);
    } catch (e) {
      sw.stop();
      return _Check(label, false, _describe(e), sw.elapsedMilliseconds);
    }
  }

  String _describe(Object e) {
    if (e is TimeoutException) return 'Timed out — request never answered';
    if (e is SocketException) {
      return 'Network unreachable: ${e.osError?.message ?? e.message}';
    }
    if (e is HandshakeException) return 'TLS handshake failed';
    if (e is PostgrestException) {
      return [e.code, e.message].whereType<String>().join(' · ');
    }
    if (e is AuthException) return e.message;
    return e.toString();
  }

  Future<void> _run() async {
    setState(() {
      _running = true;
      _results = [];
    });

    final url = EnvConfig.supabaseUrl;
    final host = Uri.tryParse(url)?.host ?? '';
    final client = Supabase.instance.client;

    final checks = <_Check>[
      _Check(
        'Config',
        url.isNotEmpty && EnvConfig.supabaseAnonKey.isNotEmpty,
        url.isEmpty ? 'SUPABASE_URL missing' : host,
        0,
      ),
      _Check(
        'Connectivity',
        ConnectivityService.instance.isOnline,
        ConnectivityService.instance.isOnline ? 'Device reports online' : 'Device reports offline',
        0,
      ),
      await _time('DNS lookup', () async {
        final records = await InternetAddress.lookup(host);
        return records.map((r) => r.address).take(2).join(', ');
      }),
      await _time('HTTPS reachability', () async {
        final socket = await SecureSocket.connect(host, 443);
        socket.destroy();
        return 'TLS connection established';
      }),
      await _time('Session', () async {
        final session = client.auth.currentSession;
        if (session == null) return 'Guest (no saved login)';
        await client.auth.getUser();
        return 'Signed in as ${client.auth.currentUser?.email ?? 'user'}';
      }),
      await _time('Read listings', () async {
        final rows = await client
            .from('showcase_listings')
            .select('id')
            .eq('status', 'published')
            .limit(5);
        return '${(rows as List).length} published row(s) returned';
      }),
      await _time('Read providers', () async {
        final rows = await client
            .from('providers')
            .select('id')
            .eq('status', 'approved')
            .limit(5);
        return '${(rows as List).length} approved row(s) returned';
      }),
    ];

    if (!mounted) return;
    setState(() {
      _results = checks;
      _running = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: const BrandAppBar(
        title: 'Connection test',
        subtitle: 'Check the link to Market Sphere servers',
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          if (_running)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold))),
            ),
          for (final r in _results)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: (r.ok ? Colors.green : Colors.redAccent).withValues(alpha: 0.45),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    r.ok ? Icons.check_circle_rounded : Icons.error_rounded,
                    color: r.ok ? Colors.green : Colors.redAccent,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          r.ms > 0 ? '${r.label} · ${r.ms} ms' : r.label,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        SelectableText(
                          r.detail,
                          style: TextStyle(color: scheme.onSurfaceVariant, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _running ? null : _run,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Run again'),
          ),
        ],
      ),
    );
  }
}
