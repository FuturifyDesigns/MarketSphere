import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../state/auth_controller.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/page_transitions.dart';
import '../../utils/secure_screen.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../shell/main_shell.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  var _obscure = true;
  var _loading = false;
  var _googlePhase = GoogleSignInPhase.idle;
  String? _formError;

  bool get _googleBusy => _googlePhase != GoogleSignInPhase.idle;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _formError = null;
    });
    final err = await context.read<AuthController>().signIn(
          email: _email.text,
          password: _password.text,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) {
      setState(() => _formError = err);
      showErrorPopup(context, err);
      return;
    }
    showSuccessPopup(context, 'Signed in successfully');
    pushAndRemoveFade(context, const MainShell());
  }

  Future<void> _google() async {
    setState(() => _formError = null);
    final err = await context.read<AuthController>().signInWithGoogle(
          onPhase: (phase) {
            if (!mounted) return;
            setState(() => _googlePhase = phase);
          },
        );
    if (!mounted) return;
    setState(() => _googlePhase = GoogleSignInPhase.idle);
    if (err != null) {
      setState(() => _formError = err);
      showErrorPopup(context, err);
      if (err.toLowerCase().contains('sign up first')) {
        pushFade(context, const RegisterScreen());
      }
      return;
    }
    showSuccessPopup(context, 'Signed in with Google');
    pushAndRemoveFade(context, const MainShell());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final scheme = Theme.of(context).colorScheme;
    if (auth.isSignedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        pushAndRemoveFade(context, const MainShell());
      });
    }

    return SecureScreen(
      child: Scaffold(
      appBar: const BrandAppBar(title: 'Sign in', subtitle: 'Access your dashboard'),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            children: [
              Container(
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1A1408), Color(0xFF171B22)],
                  ),
                  border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.22)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Welcome back',
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: Color(0xFFF7F0E4)),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Access your dashboard, saved providers, and account settings in one place.',
                      style: TextStyle(color: Color(0xFFB9AE96), height: 1.45),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _PerkPill(label: 'Verified providers'),
                        const SizedBox(width: 8),
                        _PerkPill(label: 'Role-based access'),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: scheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GoogleAuthButton(
                      loading: _googlePhase == GoogleSignInPhase.exchanging,
                      onPressed: _googleBusy ? null : _google,
                    ),
                    const SizedBox(height: 10),
                    const AuthHintText(
                      'Existing accounts only. If you have not signed up yet, create an account and choose Customer or Provider first.',
                    ),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(child: Divider(color: scheme.outlineVariant)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('or', style: TextStyle(color: scheme.onSurfaceVariant)),
                        ),
                        Expanded(child: Divider(color: scheme.outlineVariant)),
                      ],
                    ),
                    const SizedBox(height: 18),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        hintText: 'you@example.com',
                        helperText: 'Use a valid email you can access for confirmations.',
                      ),
                      validator: validateEmail,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        helperText: 'Enter the password for your website account.',
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                      validator: (v) => validatePassword(v, login: true),
                    ),
                    if (_formError != null) ...[
                      const SizedBox(height: 10),
                      Text(_formError!, style: const TextStyle(color: Color(0xFFFF8A80))),
                    ],
                    const SizedBox(height: 18),
                    FilledButton(
                      onPressed: _loading || _googleBusy ? null : _submit,
                      child: Text(_loading ? 'Signing in…' : 'Sign in'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => pushReplacementFade(context, const RegisterScreen()),
                      child: const Text('Need an account? Create one'),
                    ),
                  ],
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

class _PerkPill extends StatelessWidget {
  const _PerkPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0x22C9A24B),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0x44C9A24B)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: Color(0xFFE8D5A0),
        ),
      ),
    );
  }
}
