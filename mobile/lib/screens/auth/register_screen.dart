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
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _role;
  var _consent = false;
  var _obscure = true;
  var _loading = false;
  var _googlePhase = GoogleSignInPhase.idle;
  String? _formError;

  bool get _googleBusy => _googlePhase != GoogleSignInPhase.idle;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_role == null) {
      const msg = 'Choose Customer or Provider before creating your account.';
      setState(() => _formError = msg);
      showErrorPopup(context, msg);
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    if (!_consent) {
      const msg = 'Please accept the privacy policy to continue.';
      setState(() => _formError = msg);
      showErrorPopup(context, msg);
      return;
    }
    setState(() {
      _loading = true;
      _formError = null;
    });
    final phone = formatPhone('+267', _phone.text);
    final err = await context.read<AuthController>().signUp(
          fullName: _name.text,
          email: _email.text,
          password: _password.text,
          role: _role!,
          phone: phone.isEmpty ? null : phone,
        );
    if (!mounted) return;
    setState(() => _loading = false);
    if (err != null) {
      setState(() => _formError = err);
      showErrorPopup(context, err);
      if (err.toLowerCase().contains('sign in instead')) {
        pushReplacementFade(context, const LoginScreen());
      }
      return;
    }
    if (context.read<AuthController>().isSignedIn) {
      showSuccessPopup(context, 'Account created');
      pushAndRemoveFade(context, const MainShell());
      return;
    }
    showInfoPopup(context, 'Check your email to confirm your account');
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Check your email'),
        content: const Text('We sent a confirmation link. After verifying, sign in.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
    if (!mounted) return;
    pushReplacementFade(context, const LoginScreen());
  }

  Future<void> _google() async {
    if (_role == null) {
      const msg = 'Choose Customer or Provider before continuing with Google.';
      setState(() => _formError = msg);
      showErrorPopup(context, msg);
      return;
    }
    if (!_consent) {
      const msg = 'Please accept the privacy policy to continue with Google.';
      setState(() => _formError = msg);
      showErrorPopup(context, msg);
      return;
    }
    setState(() => _formError = null);
    final err = await context.read<AuthController>().signInWithGoogle(
          role: _role!,
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
      if (err.toLowerCase().contains('sign in instead')) {
        pushReplacementFade(context, const LoginScreen());
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
      appBar: const BrandAppBar(title: 'Create account', subtitle: 'Join the network'),
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
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Join Market Sphere',
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: Color(0xFFF7F0E4)),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Choose your role, then create the same account you will use on both the website and app.',
                      style: TextStyle(color: Color(0xFFB9AE96), height: 1.45),
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
                    RolePicker(
                      value: _role,
                      onChanged: (role) => setState(() {
                        _role = role;
                        _formError = null;
                      }),
                    ),
                    if (_role == null) ...[
                      const SizedBox(height: 10),
                      const AuthHintText(
                        'Select Customer or Provider first — required for Google and email signup.',
                      ),
                    ],
                    const SizedBox(height: 18),
                    GoogleAuthButton(
                      loading: _googlePhase == GoogleSignInPhase.exchanging,
                      onPressed: (_role == null || _googleBusy) ? null : _google,
                    ),
                    const SizedBox(height: 10),
                    const AuthHintText(
                      'New Google accounts use the role above. Already registered? Sign in instead.',
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
                      controller: _name,
                      textCapitalization: TextCapitalization.words,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: const InputDecoration(
                        labelText: 'Full name',
                        hintText: 'Your real name',
                        helperText: 'Use your real name — letters only, 2–100 characters.',
                      ),
                      validator: validateFullName,
                    ),
                    const SizedBox(height: 14),
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
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: const InputDecoration(
                        labelText: 'Phone (optional)',
                        prefixText: '+267 ',
                        helperText: 'Enter your mobile number without the country code.',
                      ),
                      validator: validatePhoneLocalOptional,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        helperText: 'At least 8 characters with a letter, number, and mixed case for a strong password.',
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                        ),
                      ),
                      validator: validatePassword,
                    ),
                    if (_password.text.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      PasswordChecklist(password: _password.text),
                    ],
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _confirm,
                      obscureText: true,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: const InputDecoration(
                        labelText: 'Confirm password',
                        helperText: 'Re-enter the same password to confirm.',
                      ),
                      validator: (v) => validateConfirmPassword(v, _password.text),
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _consent,
                      onChanged: (v) => setState(() => _consent = v ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      title: Text(
                        'I agree to the Privacy Policy and Terms of Service',
                        style: TextStyle(fontSize: 14, color: scheme.onSurface),
                      ),
                    ),
                    if (_formError != null) ...[
                      Text(_formError!, style: const TextStyle(color: Color(0xFFFF8A80))),
                      const SizedBox(height: 8),
                    ],
                    FilledButton(
                      onPressed: _loading || _googleBusy ? null : _submit,
                      child: Text(_loading ? 'Creating…' : 'Create account'),
                    ),
                    TextButton(
                      onPressed: () => pushReplacementFade(context, const LoginScreen()),
                      child: const Text('Already have an account? Sign in'),
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
