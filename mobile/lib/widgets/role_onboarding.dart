import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../services/onboarding_service.dart';
import '../state/auth_controller.dart';

/// Bump to force RoleOnboardingHost to re-check (e.g. Settings → Replay tour).
final roleOnboardingReplayTick = ValueNotifier<int>(0);

/// Shows customer/provider onboarding once per role after sign-in.
/// Cards only — no spotlight rings or highlight overlays.
class RoleOnboardingHost extends StatefulWidget {
  const RoleOnboardingHost({super.key, required this.child});

  final Widget child;

  @override
  State<RoleOnboardingHost> createState() => _RoleOnboardingHostState();
}

class _RoleOnboardingHostState extends State<RoleOnboardingHost> {
  String? _checkedForUser;
  var _open = false;
  var _step = 0;
  List<OnboardingStep> _steps = const [];
  String _role = 'customer';

  OnboardingStep get _current => _steps[_step];

  @override
  void initState() {
    super.initState();
    roleOnboardingReplayTick.addListener(_onReplayRequested);
  }

  @override
  void dispose() {
    roleOnboardingReplayTick.removeListener(_onReplayRequested);
    super.dispose();
  }

  void _onReplayRequested() {
    _checkedForUser = null;
    final profile = context.read<AuthController>().profile;
    final role = profile?.role;
    if (role == 'customer' || role == 'provider') {
      _maybeShow(role!, force: true);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthController>();
    final profile = auth.profile;
    if (!auth.isSignedIn || profile == null) {
      _checkedForUser = null;
      if (_open) setState(() => _open = false);
      return;
    }
    final role = profile.role;
    if (role != 'customer' && role != 'provider') return;
    final key = '${profile.id}:$role';
    if (_checkedForUser == key) return;
    _checkedForUser = key;
    _maybeShow(role);
  }

  Future<void> _maybeShow(String role, {bool force = false}) async {
    if (!force) {
      final seen = await OnboardingService.instance.hasSeenRoleOnboarding(role);
      if (!mounted || seen) return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 450));
    if (!mounted) return;
    setState(() {
      _role = role;
      _steps = role == 'provider' ? providerOnboardingSteps : customerOnboardingSteps;
      _step = 0;
      _open = true;
    });
  }

  Future<void> _finish() async {
    await OnboardingService.instance.markRoleOnboardingSeen(_role);
    if (!mounted) return;
    setState(() => _open = false);
  }

  void _next() {
    if (_step >= _steps.length - 1) {
      _finish();
      return;
    }
    setState(() => _step += 1);
  }

  IconData _iconFor(IconDataRef ref) => switch (ref) {
        IconDataRef.home => Icons.home_rounded,
        IconDataRef.showcase => Icons.grid_view_rounded,
        IconDataRef.browse => Icons.search_rounded,
        IconDataRef.account => Icons.person_rounded,
        IconDataRef.saved => Icons.favorite_rounded,
        IconDataRef.alerts => Icons.notifications_rounded,
        IconDataRef.profile => Icons.badge_outlined,
        IconDataRef.done => Icons.check_circle_rounded,
        IconDataRef.store => Icons.storefront_rounded,
      };

  @override
  Widget build(BuildContext context) {
    // Keep coach card clear of the bottom nav (~68).
    const navClearance = 76.0;
    final last = _step >= _steps.length - 1;
    final continueLabel = last
        ? (_role == 'provider' ? 'Finish' : 'Start')
        : 'Continue';

    return Stack(
      children: [
        widget.child,
        if (_open && _steps.isNotEmpty)
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, navClearance),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: SizedBox(
                    height: MediaQuery.sizeOf(context).height * 0.42,
                    width: double.infinity,
                    child: Material(
                      color: const Color(0xF2171B22),
                      elevation: 12,
                      shadowColor: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(AppConfig.colorGold).withValues(alpha: 0.3),
                          ),
                        ),
                        child: Column(
                          children: [
                            Expanded(
                              child: SingleChildScrollView(
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 36,
                                        height: 36,
                                        decoration: BoxDecoration(
                                          color: const Color(AppConfig.colorGold)
                                              .withValues(alpha: 0.14),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          _iconFor(_current.icon),
                                          size: 20,
                                          color: const Color(AppConfig.colorGold),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          _role == 'provider'
                                              ? 'Provider tour'
                                              : 'Customer tour',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.35,
                                            color: const Color(AppConfig.colorGold)
                                                .withValues(alpha: 0.9),
                                          ),
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: _finish,
                                        style: TextButton.styleFrom(
                                          visualDensity: VisualDensity.compact,
                                          foregroundColor: const Color(0xFFB9AE96),
                                        ),
                                        child: const Text('Skip'),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: List.generate(_steps.length, (i) {
                                      final active = i <= _step;
                                      return Expanded(
                                        child: Container(
                                          height: 3,
                                          margin: EdgeInsets.only(
                                            right: i == _steps.length - 1 ? 0 : 3,
                                          ),
                                          decoration: BoxDecoration(
                                            color: active
                                                ? const Color(AppConfig.colorGold)
                                                : const Color(0xFF2A313A),
                                            borderRadius: BorderRadius.circular(99),
                                          ),
                                        ),
                                      );
                                    }),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _current.title,
                                    style: GoogleFonts.barlowCondensed(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFFF7F0E4),
                                      height: 1.15,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    _current.description,
                                    style: const TextStyle(
                                      color: Color(0xFFB9AE96),
                                      height: 1.4,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                  if (_current.bullets.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    ..._current.bullets.map(
                                      (b) => Padding(
                                        padding: const EdgeInsets.only(bottom: 4),
                                        child: Row(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Padding(
                                              padding: EdgeInsets.only(top: 2),
                                              child: Icon(
                                                Icons.check_circle_outline,
                                                size: 14,
                                                color: Color(AppConfig.colorGold),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Expanded(
                                              child: Text(
                                                b,
                                                style: const TextStyle(
                                                  color: Color(0xFFD8C9A8),
                                                  height: 1.3,
                                                  fontSize: 12.5,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          // Always pinned — was easy to miss when scrolled under long copy.
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                            child: Row(
                              children: [
                                Text(
                                  '${_step + 1} / ${_steps.length}',
                                  style: const TextStyle(
                                    color: Color(0xFF8A8274),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                                const Spacer(),
                                FilledButton(
                                  onPressed: _next,
                                  style: FilledButton.styleFrom(
                                    minimumSize: const Size(0, 44),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                      vertical: 12,
                                    ),
                                    side: BorderSide.none,
                                    overlayColor:
                                        const Color(AppConfig.colorNight).withValues(alpha: 0.14),
                                  ),
                                  child: Text(continueLabel),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

Future<void> replayRoleOnboarding(BuildContext context) async {
  final profile = context.read<AuthController>().profile;
  final role = profile?.role;
  if (role != 'customer' && role != 'provider') return;
  await OnboardingService.instance.resetRoleOnboarding(role!);
  roleOnboardingReplayTick.value++;
}
