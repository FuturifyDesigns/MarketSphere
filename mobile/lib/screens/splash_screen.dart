import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../state/auth_controller.dart';
import '../utils/page_transitions.dart';
import 'auth/welcome_screen.dart';
import 'shell/main_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _logoFade;
  late final Animation<double> _logoScale;
  late final Animation<double> _textFade;
  late final Animation<Offset> _textSlide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400));
    _logoFade = CurvedAnimation(parent: _controller, curve: const Interval(0, 0.45, curve: Curves.easeOut));
    _logoScale = Tween(begin: 0.82, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.55, curve: Curves.easeOutCubic)),
    );
    _textFade = CurvedAnimation(parent: _controller, curve: const Interval(0.35, 0.85, curve: Curves.easeOut));
    _textSlide = Tween(begin: const Offset(0, 0.18), end: Offset.zero).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.35, 0.9, curve: Curves.easeOutCubic)),
    );
    _controller.forward();
    unawaited(_boot());
  }

  Future<void> _boot() async {
    final auth = context.read<AuthController>();
    await Future.wait([
      Future<void>.delayed(const Duration(milliseconds: 1600)),
      Future(() async {
        final deadline = DateTime.now().add(const Duration(seconds: 8));
        while (!auth.ready && DateTime.now().isBefore(deadline)) {
          await Future<void>.delayed(const Duration(milliseconds: 40));
        }
      }),
    ]);
    if (!mounted) return;
    // If auth never became ready, still leave splash (guest home).
    final next = auth.ready && auth.isSignedIn ? const MainShell() : const WelcomeScreen();
    pushAndRemoveFade(context, next);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        systemNavigationBarColor: Color(AppConfig.colorNight),
      ),
      child: Scaffold(
        backgroundColor: const Color(AppConfig.colorNight),
        body: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Stack(
              fit: StackFit.expand,
              children: [
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment(0, -0.15),
                      radius: 1.05,
                      colors: [
                        Color(0xFF16110A),
                        Color(AppConfig.colorNight),
                      ],
                    ),
                  ),
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FadeTransition(
                        opacity: _logoFade,
                        child: ScaleTransition(
                          scale: _logoScale,
                          child: Container(
                            width: 112,
                            height: 112,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(AppConfig.colorGold).withValues(alpha: 0.22 * _logoFade.value),
                                  blurRadius: 36,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/branding/splash_logo.png',
                                width: 112,
                                height: 112,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      FadeTransition(
                        opacity: _textFade,
                        child: SlideTransition(
                          position: _textSlide,
                          child: Column(
                            children: [
                              const Text(
                                'MARKET SPHERE',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFFFAF6EC),
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 3.2,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Container(
                                width: 42,
                                height: 2,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(2),
                                  color: const Color(AppConfig.colorGold),
                                ),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                AppConfig.tagline,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFFD8C9A8),
                                  fontSize: 13,
                                  letterSpacing: 0.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
