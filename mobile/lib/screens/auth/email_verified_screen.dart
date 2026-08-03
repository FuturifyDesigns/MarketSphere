import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config.dart';

/// Shown after the user opens the email confirmation deep link from the Android app.
/// Website `/auth/verify` is unchanged.
class EmailVerifiedScreen extends StatelessWidget {
  const EmailVerifiedScreen({super.key, this.success = true, this.errorMessage});

  final bool success;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: const Color(AppConfig.colorNight),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(28, 40, 28, 32),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: success
                        ? const Color(AppConfig.colorGold).withValues(alpha: 0.16)
                        : const Color(0xFF3A1F1F),
                    border: Border.all(
                      color: success
                          ? const Color(AppConfig.colorGold).withValues(alpha: 0.45)
                          : const Color(0xFF8A4545),
                    ),
                  ),
                  child: Icon(
                    success ? Icons.mark_email_read_rounded : Icons.error_outline_rounded,
                    size: 40,
                    color: success
                        ? const Color(AppConfig.colorGold)
                        : const Color(0xFFE08A8A),
                  ),
                ),
                const SizedBox(height: 28),
                Text(
                  success ? 'You’re verified' : 'Verification failed',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.barlowCondensed(
                    fontSize: 34,
                    fontWeight: FontWeight.w700,
                    color: const Color(AppConfig.colorText),
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  success
                      ? 'Your email has been confirmed.\nReturn to the Market Sphere app and sign in.'
                      : (errorMessage?.trim().isNotEmpty == true
                          ? errorMessage!.trim()
                          : 'This confirmation link is invalid or has expired.'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(AppConfig.colorTextSecondary),
                    height: 1.5,
                    fontSize: 16,
                  ),
                ),
                const Spacer(flex: 2),
                Text(
                  success ? 'You can close this screen.' : 'Close this screen and try again from the app.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: const Color(AppConfig.colorMuted).withValues(alpha: 0.9),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
