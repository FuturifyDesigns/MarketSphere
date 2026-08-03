import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config.dart';
import '../../services/update_check_service.dart';
import '../../utils/page_transitions.dart';
import '../shell/main_shell.dart';
import 'login_screen.dart';
import 'register_screen.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> with TickerProviderStateMixin {
  late final AnimationController _intro;
  late final AnimationController _pulse;
  late final AnimationController _orbit;

  @override
  void initState() {
    super.initState();
    _intro = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..forward();
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat(reverse: true);
    _orbit = AnimationController(vsync: this, duration: const Duration(seconds: 10))..repeat();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      unawaited(UpdateCheckService.instance.checkAfterLaunch(context));
    });
  }

  @override
  void dispose() {
    _intro.dispose();
    _pulse.dispose();
    _orbit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fade = CurvedAnimation(parent: _intro, curve: const Interval(0, 0.55, curve: Curves.easeOut));
    final slide = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero).animate(
      CurvedAnimation(parent: _intro, curve: const Interval(0.15, 0.8, curve: Curves.easeOutCubic)),
    );
    final buttons = CurvedAnimation(parent: _intro, curve: const Interval(0.45, 1, curve: Curves.easeOut));

    return Scaffold(
      body: AnimatedBuilder(
        animation: Listenable.merge([_intro, _pulse, _orbit]),
        builder: (context, _) {
          return Stack(
            fit: StackFit.expand,
            children: [
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF120E08), Color(AppConfig.colorNight), Color(0xFF1C160C)],
                  ),
                ),
              ),
              ...List.generate(3, (i) {
                final t = (_orbit.value + i / 3) % 1;
                final angle = t * math.pi * 2;
                return Positioned(
                  left: MediaQuery.sizeOf(context).width * 0.5 + math.cos(angle) * (90.0 + i * 28) - 18,
                  top: MediaQuery.sizeOf(context).height * 0.28 + math.sin(angle) * (48.0 + i * 16) - 18,
                  child: Opacity(
                    opacity: 0.18 + (_pulse.value * 0.12),
                    child: Container(
                      width: 28 + i * 8.0,
                      height: 28 + i * 8.0,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.45)),
                      ),
                    ),
                  ),
                );
              }),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                  child: Column(
                    children: [
                      const Spacer(flex: 2),
                      FadeTransition(
                        opacity: fade,
                        child: ScaleTransition(
                          scale: Tween(begin: 0.86, end: 1.0).animate(
                            CurvedAnimation(parent: _intro, curve: Curves.easeOutBack),
                          ),
                          child: Container(
                            width: 132,
                            height: 132,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Color.fromRGBO(201, 162, 75, 0.22 + _pulse.value * 0.25),
                                  blurRadius: 28 + _pulse.value * 18,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Image.asset('assets/branding/logo-512.png'),
                          ),
                        ),
                      ),
                      const SizedBox(height: 22),
                      SlideTransition(
                        position: slide,
                        child: FadeTransition(
                          opacity: fade,
                          child: Column(
                            children: [
                              Text(
                                'Market Sphere Group',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.barlowCondensed(
                                  color: const Color(AppConfig.colorGold),
                                  fontSize: 36,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.4,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                AppConfig.tagline,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.barlow(color: const Color(0xFFD8C9A8), fontSize: 15),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Browse listings, find providers, and manage your account — same live data as the website.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.barlow(
                                  color: const Color(0xFFB9AE96),
                                  fontSize: 14,
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(flex: 3),
                      FadeTransition(
                        opacity: buttons,
                        child: SlideTransition(
                          position: Tween<Offset>(begin: const Offset(0, 0.18), end: Offset.zero).animate(buttons),
                          child: Column(
                            children: [
                              FilledButton(
                                onPressed: () => pushFade(context, const LoginScreen()),
                                child: const Text('Sign in'),
                              ),
                              const SizedBox(height: 12),
                              OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(AppConfig.colorGoldLight),
                                  side: const BorderSide(color: Color(0x55C9A24B)),
                                ),
                                onPressed: () => pushFade(context, const RegisterScreen()),
                                child: const Text('Create account'),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () => pushAndRemoveFade(context, const MainShell()),
                                child: Text(
                                  'Browse without signing in',
                                  style: GoogleFonts.barlow(
                                    color: const Color(0xFF9C8F78),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
