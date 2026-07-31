import 'package:shared_preferences/shared_preferences.dart';

/// Mirrors website role onboarding flags (per device).
class OnboardingService {
  OnboardingService._();
  static final OnboardingService instance = OnboardingService._();

  static const _customerKey = 'marketsphere-customer-onboarding-seen';
  static const _providerKey = 'marketsphere-provider-onboarding-seen';

  Future<bool> hasSeenRoleOnboarding(String role) async {
    final prefs = await SharedPreferences.getInstance();
    if (role == 'provider') return prefs.getBool(_providerKey) == true;
    if (role == 'customer') return prefs.getBool(_customerKey) == true;
    return true;
  }

  Future<void> markRoleOnboardingSeen(String role) async {
    final prefs = await SharedPreferences.getInstance();
    if (role == 'provider') {
      await prefs.setBool(_providerKey, true);
    } else if (role == 'customer') {
      await prefs.setBool(_customerKey, true);
    }
  }

  Future<void> resetRoleOnboarding(String role) async {
    final prefs = await SharedPreferences.getInstance();
    if (role == 'provider') {
      await prefs.remove(_providerKey);
    } else if (role == 'customer') {
      await prefs.remove(_customerKey);
    }
  }
}

class OnboardingStep {
  const OnboardingStep({
    required this.title,
    required this.description,
    required this.icon,
    this.bullets = const [],
  });

  final String title;
  final String description;
  final IconDataRef icon;
  final List<String> bullets;
}

/// Avoid importing Flutter Material in the service file for icons.
enum IconDataRef {
  home,
  showcase,
  browse,
  account,
  saved,
  alerts,
  profile,
  done,
  store,
}

const customerOnboardingSteps = [
  OnboardingStep(
    title: 'Your home feed',
    description: 'Discover showcase listings and verified providers updated live from Market Sphere Group.',
    icon: IconDataRef.home,
    bullets: [
      'Pull down to refresh the latest opportunities',
      'Open Saved and Alerts from the top icons',
    ],
  ),
  OnboardingStep(
    title: 'Showcase',
    description: 'Browse featured deals and opportunities. Open any card for details and contact options.',
    icon: IconDataRef.showcase,
  ),
  OnboardingStep(
    title: 'Browse providers',
    description: 'Find professionals across Botswana. Heart providers to save them for later.',
    icon: IconDataRef.browse,
  ),
  OnboardingStep(
    title: 'Saved & alerts',
    description: 'Keep favourites offline and turn on listing alerts so you never miss a change.',
    icon: IconDataRef.saved,
  ),
  OnboardingStep(
    title: 'Your account',
    description: 'Update your profile, review settings, and see that you are signed in as a Customer.',
    icon: IconDataRef.account,
  ),
  OnboardingStep(
    title: 'You are all set!',
    description: 'Start browsing, save providers you like, and enquire when you are ready.',
    icon: IconDataRef.done,
  ),
];

const providerOnboardingSteps = [
  OnboardingStep(
    title: 'Welcome, provider',
    description: 'You are signed in as a Provider. Use the app to stay visible and reach customers on the go.',
    icon: IconDataRef.store,
  ),
  OnboardingStep(
    title: 'Showcase & Browse',
    description: 'See how customers discover listings and providers — this is what your public presence feeds.',
    icon: IconDataRef.showcase,
  ),
  OnboardingStep(
    title: 'Keep your profile ready',
    description: 'Complete your business profile on the website dashboard. The app syncs the same account.',
    icon: IconDataRef.profile,
    bullets: [
      'Logo, cover, and gallery build trust',
      'Clear services help customers enquire',
    ],
  ),
  OnboardingStep(
    title: 'Alerts on the go',
    description: 'Watch notifications for account updates and stay responsive to customer interest.',
    icon: IconDataRef.alerts,
  ),
  OnboardingStep(
    title: 'Ready to grow!',
    description: 'Finish your website listing, then use the app to browse the network and manage your presence.',
    icon: IconDataRef.done,
  ),
];
