import 'package:flutter/material.dart';

import '../config.dart';

enum AppPopupKind { success, error, info }

/// Floating in-app popup for actions and errors.
void showAppPopup(
  BuildContext context,
  String message, {
  AppPopupKind kind = AppPopupKind.info,
  Duration duration = const Duration(seconds: 3),
}) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;

  final (Color bg, Color fg, IconData icon) = switch (kind) {
    AppPopupKind.success => (
        const Color(0xFF1A2A1F),
        const Color(0xFFD7F0DC),
        Icons.check_circle_rounded,
      ),
    AppPopupKind.error => (
        const Color(0xFF2A1818),
        const Color(0xFFFFC9C4),
        Icons.error_outline_rounded,
      ),
    AppPopupKind.info => (
        const Color(0xFF1A1812),
        const Color(AppConfig.colorGoldLight),
        Icons.info_outline_rounded,
      ),
  };

  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        duration: duration,
        backgroundColor: bg,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 18),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: fg.withValues(alpha: 0.22)),
        ),
        content: Row(
          children: [
            Icon(icon, color: fg, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: TextStyle(
                  color: fg,
                  fontWeight: FontWeight.w600,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    );
}

void showSuccessPopup(BuildContext context, String message) =>
    showAppPopup(context, message, kind: AppPopupKind.success);

void showErrorPopup(BuildContext context, String message) =>
    showAppPopup(context, message, kind: AppPopupKind.error, duration: const Duration(seconds: 4));

void showInfoPopup(BuildContext context, String message) =>
    showAppPopup(context, message, kind: AppPopupKind.info);
