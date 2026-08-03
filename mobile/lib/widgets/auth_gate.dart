import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../state/auth_controller.dart';
import '../utils/app_feedback.dart';
import '../utils/page_transitions.dart';

/// Opens [page] only when signed in. Guests see a signup prompt instead.
Future<void> openIfSignedIn(BuildContext context, Widget page) async {
  final auth = context.read<AuthController>();
  if (!auth.isAuthenticated) {
    if (auth.isSignedIn && auth.profile == null) {
      await auth.refreshProfile();
    }
    if (!context.mounted) return;
    if (!auth.isAuthenticated) {
      await showSignUpGate(context);
      return;
    }
  }
  if (auth.profile?.isBanned == true) {
    showErrorPopup(context, 'This account is restricted.');
    return;
  }
  await pushFade(context, page);
}

/// Opens a cached listing/provider (recently viewed / offline). No sign-in gate.
Future<void> openCachedDetail(BuildContext context, Widget page) async {
  final auth = context.read<AuthController>();
  if (auth.profile?.isBanned == true) {
    showErrorPopup(context, 'This account is restricted.');
    return;
  }
  await pushFade(context, page);
}

Future<void> showSignUpGate(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const SignUpGateSheet(),
  );
}

class SignUpGateSheet extends StatelessWidget {
  const SignUpGateSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
      padding: EdgeInsets.fromLTRB(22, 18, 22, 18 + bottom),
      decoration: BoxDecoration(
        color: const Color(0xFF171B22),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.35)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.45),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: const Color(AppConfig.colorMuted).withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 18),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(AppConfig.colorGold).withValues(alpha: 0.16),
              border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.4)),
            ),
            child: const Icon(Icons.lock_outline_rounded, color: Color(AppConfig.colorGold), size: 28),
          ),
          const SizedBox(height: 16),
          Text(
            'Sign up to continue',
            textAlign: TextAlign.center,
            style: GoogleFonts.barlowCondensed(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: const Color(AppConfig.colorText),
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Create a free account to save favourites, send enquiries, and contact providers.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(AppConfig.colorTextSecondary),
              height: 1.45,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 22),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              pushFade(context, const RegisterScreen());
            },
            child: const Text('Create free account'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () {
              Navigator.of(context).pop();
              pushFade(context, const LoginScreen());
            },
            child: const Text('I already have an account'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Keep browsing'),
          ),
        ],
      ),
    );
  }
}
