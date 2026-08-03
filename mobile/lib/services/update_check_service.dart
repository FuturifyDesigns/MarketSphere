import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../utils/app_feedback.dart';

class AppReleaseInfo {
  const AppReleaseInfo({
    required this.version,
    required this.build,
    required this.apkUrl,
    this.notes = '',
    this.force = false,
  });

  final String version;
  final int build;
  final String apkUrl;
  final String notes;
  final bool force;

  factory AppReleaseInfo.fromJson(Map<String, dynamic> json) {
    final buildRaw = json['build'];
    final build = buildRaw is int
        ? buildRaw
        : int.tryParse('$buildRaw') ?? 0;
    return AppReleaseInfo(
      version: (json['version'] as String?)?.trim().isNotEmpty == true
          ? (json['version'] as String).trim()
          : '0.0.0',
      build: build,
      apkUrl: (json['apkUrl'] as String?)?.trim().isNotEmpty == true
          ? (json['apkUrl'] as String).trim()
          : AppConfig.appApkUrl,
      notes: (json['notes'] as String?)?.trim() ?? '',
      force: json['force'] == true,
    );
  }
}

/// Checks /app/version.json and prompts when a newer sideloaded APK is available.
class UpdateCheckService {
  UpdateCheckService._();
  static final UpdateCheckService instance = UpdateCheckService._();

  static const _snoozeKey = 'app_update_snooze_until_ms';
  static const _snoozeDuration = Duration(hours: 24);

  var _promptOpen = false;
  var _checkedThisSession = false;

  /// Soft check after the UI is up (does not block startup).
  Future<void> checkAfterLaunch(BuildContext context) async {
    if (_checkedThisSession) return;
    _checkedThisSession = true;
    await Future<void>.delayed(const Duration(seconds: 2));
    if (!context.mounted) return;
    await checkAndPrompt(context, interactive: false);
  }

  /// Manual “Check for updates” from Settings / About.
  Future<void> checkAndPrompt(
    BuildContext context, {
    required bool interactive,
  }) async {
    try {
      final remote = await _fetchRemote();
      final local = await PackageInfo.fromPlatform();
      final localBuild = int.tryParse(local.buildNumber) ?? 0;

      if (remote.build <= localBuild) {
        if (interactive && context.mounted) {
          showSuccessPopup(
            context,
            'You’re on the latest version (${local.version}).',
          );
        }
        return;
      }

      if (!remote.force && !interactive) {
        final snoozed = await _isSnoozed();
        if (snoozed) return;
      }

      if (!context.mounted) return;
      await _showPrompt(context, remote, localVersion: local.version);
    } catch (e) {
      if (kDebugMode) debugPrint('[update] check failed: $e');
      if (interactive && context.mounted) {
        showErrorPopup(
          context,
          'Could not check for updates. Check your connection and try again.',
        );
      }
    }
  }

  Future<AppReleaseInfo> _fetchRemote() async {
    final response = await http
        .get(
          Uri.parse(AppConfig.appVersionUrl),
          headers: const {'Accept': 'application/json', 'Cache-Control': 'no-cache'},
        )
        .timeout(const Duration(seconds: 10));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError('HTTP ${response.statusCode}');
    }
    final decoded = jsonDecode(response.body);
    if (decoded is! Map) throw StateError('Invalid version payload');
    return AppReleaseInfo.fromJson(Map<String, dynamic>.from(decoded));
  }

  Future<bool> _isSnoozed() async {
    final prefs = await SharedPreferences.getInstance();
    final until = prefs.getInt(_snoozeKey) ?? 0;
    return until > DateTime.now().millisecondsSinceEpoch;
  }

  Future<void> _rememberLater() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(
      _snoozeKey,
      DateTime.now().add(_snoozeDuration).millisecondsSinceEpoch,
    );
  }

  Future<void> _showPrompt(
    BuildContext context,
    AppReleaseInfo remote, {
    required String localVersion,
  }) async {
    if (_promptOpen || !context.mounted) return;
    _promptOpen = true;

    final scheme = Theme.of(context).colorScheme;
    try {
      await showDialog<void>(
        context: context,
        barrierDismissible: !remote.force,
        builder: (dialogContext) {
          return AlertDialog(
            backgroundColor: scheme.surface,
            title: const Text('Update available'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Version ${remote.version} is ready '
                  '(you have $localVersion).',
                  style: TextStyle(color: scheme.onSurface, height: 1.4),
                ),
                if (remote.notes.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    remote.notes,
                    style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
                  ),
                ],
                const SizedBox(height: 10),
                Text(
                  'Download and install the new APK. Keep the same signing key '
                  'so your data stays on this phone.',
                  style: TextStyle(
                    color: scheme.onSurfaceVariant,
                    fontSize: 13,
                    height: 1.35,
                  ),
                ),
              ],
            ),
            actions: [
              if (!remote.force)
                TextButton(
                  onPressed: () async {
                    await _rememberLater();
                    if (dialogContext.mounted) Navigator.of(dialogContext).pop();
                  },
                  child: const Text('Later'),
                ),
              FilledButton(
                onPressed: () async {
                  final uri = Uri.tryParse(remote.apkUrl);
                  if (uri != null) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                  if (dialogContext.mounted) Navigator.of(dialogContext).pop();
                },
                child: const Text('Update'),
              ),
            ],
          );
        },
      );
    } finally {
      _promptOpen = false;
    }
  }
}
