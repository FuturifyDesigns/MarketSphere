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
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));
    _fade = CurvedAnimation(parent: _controller, curve: const Interval(0, 0.6, curve: Curves.easeOut));
    _scale = Tween(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.7, curve: Curves.easeOutBack)),
    );
    _controller.forward();
    unawaited(_boot());
  }

  Future<void> _boot() async {
    final auth = context.read<AuthController>();
    await Future.wait([
      Future<void>.delayed(const Duration(milliseconds: 1400)),
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
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: const Alignment(0, -0.2),
                      radius: 1.1,
                      colors: [
                        Color.lerp(const Color(0xFF1A1408), const Color(0xFF3A2A10), _fade.value * 0.5)!,
                        const Color(AppConfig.colorNight),
                      ],
                    ),
                  ),
                ),
                Center(
                  child: FadeTransition(
                    opacity: _fade,
                    child: ScaleTransition(
                      scale: _scale,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.asset('assets/branding/logo-512.png', width: 148, height: 148),
                          const SizedBox(height: 22),
                          const Text(
                            'MARKET SPHERE GROUP',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(AppConfig.colorGold),
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 2.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            AppConfig.tagline,
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Color(0xFFD8C9A8), fontSize: 13),
                          ),
                        ],
                      ),
                    ),
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
