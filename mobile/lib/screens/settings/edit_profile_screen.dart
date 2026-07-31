import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../state/auth_controller.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/secure_screen.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  var _saving = false;
  var _uploading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final profile = context.read<AuthController>().profile;
    _name.text = profile?.fullName ?? '';
    final phone = profile?.phone ?? '';
    _phone.text = phone.replaceFirst(RegExp(r'^\+267\s*'), '');
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 1024);
    if (file == null || !mounted) return;
    setState(() {
      _uploading = true;
      _error = null;
    });
    final err = await context.read<AuthController>().uploadAvatar(file.path);
    if (!mounted) return;
    setState(() => _uploading = false);
    if (err != null) {
      setState(() => _error = err);
      showErrorPopup(context, err);
      return;
    }
    showSuccessPopup(context, 'Profile photo updated');
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final phone = formatPhone('+267', _phone.text);
    final err = await context.read<AuthController>().updateProfile(
          fullName: _name.text,
          phone: phone,
        );
    if (!mounted) return;
    setState(() => _saving = false);
    if (err != null) {
      setState(() => _error = err);
      showErrorPopup(context, err);
      return;
    }
    showSuccessPopup(context, 'Profile saved');
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<AuthController>().profile;

    return SecureScreen(
      child: Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 16, 22, 32),
          children: [
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: const Color(AppConfig.colorSand),
                    backgroundImage: profile?.avatarUrl != null ? NetworkImage(profile!.avatarUrl!) : null,
                    child: profile?.avatarUrl == null
                        ? const Icon(Icons.person, size: 42, color: Color(AppConfig.colorNight))
                        : null,
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Material(
                      color: const Color(AppConfig.colorGold),
                      shape: const CircleBorder(),
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: _uploading ? null : _pickAvatar,
                        child: Padding(
                          padding: const EdgeInsets.all(8),
                          child: _uploading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                                )
                              : const Icon(Icons.camera_alt_outlined, size: 18, color: Color(AppConfig.colorNight)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Same profile details as the website account card.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(AppConfig.colorMuted), fontSize: 13),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Full name'),
              validator: validateFullName,
            ),
            const SizedBox(height: 14),
            TextFormField(
              initialValue: profile?.email ?? '',
              enabled: false,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone', prefixText: '+267 '),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Color(0xFFB3261E))),
            ],
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _saving || _uploading ? null : _save,
              child: Text(_saving ? 'Saving…' : 'Save changes'),
            ),
          ],
        ),
      ),
    ),
    );
  }
}
