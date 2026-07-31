import 'package:flutter/material.dart';

Route<T> fadeSlideRoute<T extends Object?>(Widget page) {
  return PageRouteBuilder<T>(
    transitionDuration: const Duration(milliseconds: 420),
    reverseTransitionDuration: const Duration(milliseconds: 320),
    pageBuilder: (context, animation, secondaryAnimation) => page,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curved,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.06, 0.02),
            end: Offset.zero,
          ).animate(curved),
          child: child,
        ),
      );
    },
  );
}

Future<T?> pushFade<T>(BuildContext context, Widget page) {
  return Navigator.of(context).push<T>(fadeSlideRoute(page));
}

Future<T?> pushReplacementFade<T extends Object?, TO extends Object?>(
  BuildContext context,
  Widget page,
) {
  return Navigator.of(context).pushReplacement<T, TO>(fadeSlideRoute(page));
}

void pushAndRemoveFade(BuildContext context, Widget page) {
  Navigator.of(context).pushAndRemoveUntil(fadeSlideRoute(page), (_) => false);
}
