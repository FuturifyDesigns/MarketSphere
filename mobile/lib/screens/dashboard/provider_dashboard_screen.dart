import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/share_contact.dart';
import '../../widgets/auth_widgets.dart';
import '../../widgets/brand_app_bar.dart';
import '../../widgets/common.dart';

/// Provider dashboard hub — Profile / Services / Inbox (same functions as website).
class ProviderDashboardScreen extends StatefulWidget {
  const ProviderDashboardScreen({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  State<ProviderDashboardScreen> createState() => _ProviderDashboardScreenState();
}

class _ProviderDashboardScreenState extends State<ProviderDashboardScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  OwnedProvider? _provider;
  List<EnquiryItem> _enquiries = const [];
  List<ServiceCategory> _categories = const [];
  var _loading = true;
  var _saving = false;
  var _mediaBusy = false;
  String? _error;

  final _businessName = TextEditingController();
  final _description = TextEditingController();
  final _location = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _serviceTitle = TextEditingController();
  final _serviceDescription = TextEditingController();
  String? _serviceCategoryId;
  final _profileFormKey = GlobalKey<FormState>();
  final _serviceFormKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this, initialIndex: widget.initialTab.clamp(0, 2));
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _businessName.dispose();
    _description.dispose();
    _location.dispose();
    _email.dispose();
    _phone.dispose();
    _serviceTitle.dispose();
    _serviceDescription.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final repo = context.read<DataRepository>();
    try {
      final results = await Future.wait([
        repo.fetchOwnedProvider(),
        repo.fetchServiceCategories(),
      ]);
      final provider = results[0] as OwnedProvider?;
      final categories = results[1] as List<ServiceCategory>;
      List<EnquiryItem> enquiries = const [];
      if (provider != null) {
        enquiries = await repo.fetchProviderEnquiries(provider.id);
      }
      if (!mounted) return;
      _applyProvider(provider);
      setState(() {
        _provider = provider;
        _categories = categories;
        _enquiries = enquiries;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load provider dashboard.';
      });
    }
  }

  void _applyProvider(OwnedProvider? provider) {
    _businessName.text = provider?.businessName ?? '';
    _description.text = provider?.description ?? '';
    _location.text = provider?.location ?? '';
    _email.text = provider?.contactEmail ?? '';
    final phone = provider?.contactPhone ?? '';
    _phone.text = phone.replaceFirst(RegExp(r'^\+267\s*'), '');
  }

  Future<void> _saveProfile() async {
    if (!_profileFormKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final result = await context.read<DataRepository>().saveOwnedProviderProfile(
          businessName: _businessName.text,
          description: _description.text,
          location: _location.text,
          contactEmail: _email.text,
          contactPhone: _phone.text.isEmpty ? null : formatPhone('+267', _phone.text),
        );
    if (!mounted) return;
    setState(() => _saving = false);
    if (result.error != null) {
      showErrorPopup(context, result.error!);
      return;
    }
    setState(() => _provider = result.provider);
    _applyProvider(result.provider);
    showSuccessPopup(context, 'Business profile saved');
  }

  Future<XFile?> _pickImage({required int maxWidth, required int quality}) {
    return ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: maxWidth.toDouble(),
      imageQuality: quality,
    );
  }

  Future<void> _runMedia(
    Future<({OwnedProvider? provider, String? error})> Function() action, {
    required String success,
  }) async {
    if (_provider == null) {
      showErrorPopup(context, 'Save your business profile first, then add photos.');
      return;
    }
    setState(() => _mediaBusy = true);
    final result = await action();
    if (!mounted) return;
    setState(() => _mediaBusy = false);
    if (result.error != null) {
      showErrorPopup(context, result.error!);
      return;
    }
    setState(() => _provider = result.provider);
    _applyProvider(result.provider);
    showSuccessPopup(context, success);
  }

  Future<void> _uploadLogo() async {
    final file = await _pickImage(maxWidth: 768, quality: 88);
    if (file == null || !mounted) return;
    final repo = context.read<DataRepository>();
    await _runMedia(() => repo.uploadOwnedProviderLogo(file.path), success: 'Logo updated');
  }

  Future<void> _uploadCover() async {
    final file = await _pickImage(maxWidth: 1920, quality: 90);
    if (file == null || !mounted) return;
    final repo = context.read<DataRepository>();
    await _runMedia(() => repo.uploadOwnedProviderCover(file.path), success: 'Cover photo updated');
  }

  Future<void> _uploadGallery() async {
    final file = await _pickImage(maxWidth: 1920, quality: 90);
    if (file == null || !mounted) return;
    final repo = context.read<DataRepository>();
    await _runMedia(() => repo.addOwnedProviderGalleryImage(file.path), success: 'Gallery photo added');
  }

  Future<void> _removeLogo() async {
    final repo = context.read<DataRepository>();
    await _runMedia(repo.removeOwnedProviderLogo, success: 'Logo removed');
  }

  Future<void> _removeCover() async {
    final repo = context.read<DataRepository>();
    await _runMedia(repo.removeOwnedProviderCover, success: 'Cover photo removed');
  }

  Future<void> _removeGallery(String url) async {
    final repo = context.read<DataRepository>();
    await _runMedia(
      () => repo.removeOwnedProviderGalleryImage(url),
      success: 'Gallery photo removed',
    );
  }

  Future<void> _addService() async {
    if (!_serviceFormKey.currentState!.validate()) return;
    final provider = _provider;
    if (provider == null) {
      showErrorPopup(
        context,
        'Save a complete business profile on the Profile tab before adding services.',
      );
      return;
    }

    setState(() => _saving = true);
    final result = await context.read<DataRepository>().addOwnedProviderService(
          providerId: provider.id,
          title: _serviceTitle.text,
          description: _serviceDescription.text,
          categoryId: _serviceCategoryId,
        );
    if (!mounted) return;
    setState(() => _saving = false);
    if (result.error != null) {
      showErrorPopup(context, result.error!);
      return;
    }
    final service = result.service!;
    setState(() {
      _provider = provider.copyWith(services: [...provider.services, service]);
      _serviceTitle.clear();
      _serviceDescription.clear();
      _serviceCategoryId = null;
    });
    showSuccessPopup(context, 'Service added');
  }

  Future<void> _deleteService(OwnedProviderService service) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove service?'),
        content: Text('Remove “${service.title}” from your listing?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Remove')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final err = await context.read<DataRepository>().deleteOwnedProviderService(service.id);
    if (!mounted) return;
    if (err != null) {
      showErrorPopup(context, err);
      return;
    }
    setState(() {
      _provider = _provider?.copyWith(
        services: _provider!.services.where((s) => s.id != service.id).toList(),
      );
    });
  }

  Future<void> _setEnquiryStatus(EnquiryItem item, String status) async {
    final err = await context.read<DataRepository>().updateEnquiryStatus(
          enquiryId: item.id,
          status: status,
        );
    if (!mounted) return;
    if (err != null) {
      showErrorPopup(context, err);
      return;
    }
    setState(() {
      _enquiries = _enquiries
          .map((e) => e.id == item.id
              ? EnquiryItem(
                  id: e.id,
                  customerId: e.customerId,
                  providerId: e.providerId,
                  subject: e.subject,
                  message: e.message,
                  status: status,
                  createdAt: e.createdAt,
                  providerBusinessName: e.providerBusinessName,
                  customerName: e.customerName,
                  customerEmail: e.customerEmail,
                )
              : e)
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final newCount = _enquiries.where((e) => e.isNew).length;

    return Scaffold(
      appBar: BrandAppBar(
        title: 'Provider dashboard',
        subtitle: _provider?.businessName ?? 'Manage your Market Sphere listing',
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)))
          : _error != null
              ? LiveEmptyState(
                  title: 'Dashboard unavailable',
                  body: _error!,
                  actionLabel: 'Retry',
                  onAction: _load,
                  icon: Icons.cloud_off_rounded,
                )
              : Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 10),
                      child: Row(
                        children: [
                          _StatPill(
                            label: 'Services',
                            value: '${_provider?.services.length ?? 0}',
                          ),
                          const SizedBox(width: 8),
                          _StatPill(
                            label: 'New messages',
                            value: '$newCount',
                          ),
                          const SizedBox(width: 8),
                          _StatPill(
                            label: 'Status',
                            value: enquiryStatusLabel(_provider?.status ?? 'not_created'),
                          ),
                        ],
                      ),
                    ),
                    TabBar(
                      controller: _tabs,
                      labelColor: const Color(AppConfig.colorGold),
                      unselectedLabelColor: scheme.onSurfaceVariant,
                      indicatorColor: const Color(AppConfig.colorGold),
                      tabs: [
                        const Tab(text: 'Profile'),
                        const Tab(text: 'Services'),
                        Tab(text: newCount > 0 ? 'Inbox ($newCount)' : 'Inbox'),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        controller: _tabs,
                        children: [
                          _profileTab(scheme),
                          _servicesTab(scheme),
                          _inboxTab(scheme),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _profileTab(ColorScheme scheme) {
    final provider = _provider;
    final gallery = provider?.galleryUrls ?? const <String>[];

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text(
          'Photos & branding',
          style: TextStyle(fontWeight: FontWeight.w800, color: scheme.onSurface, fontSize: 16),
        ),
        const SizedBox(height: 6),
        Text(
          'Upload your logo, cover, and gallery — same storage as the website (up to 6 gallery photos).',
          style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
        ),
        const SizedBox(height: 14),
        _mediaCard(
          scheme: scheme,
          title: 'Logo',
          subtitle: 'Square mark shown on your provider card',
          url: provider?.logoUrl,
          height: 120,
          onUpload: _mediaBusy ? null : _uploadLogo,
          onRemove: (provider?.logoUrl != null && !_mediaBusy) ? _removeLogo : null,
        ),
        const SizedBox(height: 12),
        _mediaCard(
          scheme: scheme,
          title: 'Cover photo',
          subtitle: 'Wide banner at the top of your profile',
          url: provider?.coverUrl,
          height: 150,
          onUpload: _mediaBusy ? null : _uploadCover,
          onRemove: (provider?.coverUrl != null && !_mediaBusy) ? _removeCover : null,
        ),
        const SizedBox(height: 12),
        Text('Gallery', style: TextStyle(fontWeight: FontWeight.w700, color: scheme.onSurface)),
        const SizedBox(height: 8),
        SizedBox(
          height: 108,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              ...gallery.map(
                (url) => Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: SizedBox(
                          width: 108,
                          height: 108,
                          child: AppNetworkImage(url: url, fit: BoxFit.cover),
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Material(
                          color: Colors.black54,
                          shape: const CircleBorder(),
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: _mediaBusy ? null : () => _removeGallery(url),
                            child: const Padding(
                              padding: EdgeInsets.all(4),
                              child: Icon(Icons.close_rounded, size: 16, color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (gallery.length < 6)
                OutlinedButton(
                  onPressed: _mediaBusy ? null : _uploadGallery,
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(108, 108),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _mediaBusy
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate_outlined),
                            SizedBox(height: 6),
                            Text('Add', style: TextStyle(fontSize: 12)),
                          ],
                        ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'Business details',
          style: TextStyle(fontWeight: FontWeight.w800, color: scheme.onSurface, fontSize: 16),
        ),
        const SizedBox(height: 6),
        Text(
          'Same listing fields as the website provider dashboard.',
          style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4),
        ),
        const SizedBox(height: 16),
        Form(
          key: _profileFormKey,
          child: Column(
            children: [
              TextFormField(
                controller: _businessName,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Business name'),
                validator: (v) => validateMeaningfulText(
                  v,
                  fieldLabel: 'Business name',
                  optional: false,
                  minLength: 2,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _description,
                minLines: 4,
                maxLines: 7,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Description'),
                validator: (v) => validateMeaningfulText(
                  v,
                  fieldLabel: 'Description',
                  optional: false,
                  minLength: 20,
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _location,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Location'),
                validator: (v) => validateMeaningfulText(v, fieldLabel: 'Location'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Contact email'),
                validator: validateOptionalEmail,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Phone', prefixText: '+267 '),
                validator: validatePhoneLocalOptional,
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: _saving ? null : _saveProfile,
                child: Text(_saving ? 'Saving…' : 'Save business profile'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _mediaCard({
    required ColorScheme scheme,
    required String title,
    required String subtitle,
    required String? url,
    required double height,
    required VoidCallback? onUpload,
    required VoidCallback? onRemove,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.65)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12.5)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: height,
              width: double.infinity,
              child: url != null && url.isNotEmpty
                  ? AppNetworkImage(url: url, fit: BoxFit.cover)
                  : ColoredBox(
                      color: const Color(0xFF1A1F27),
                      child: Center(
                        child: Icon(Icons.image_outlined, color: scheme.onSurfaceVariant),
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              FilledButton.tonal(
                onPressed: onUpload,
                child: Text(url == null || url.isEmpty ? 'Upload' : 'Replace'),
              ),
              if (onRemove != null) ...[
                const SizedBox(width: 8),
                TextButton(onPressed: onRemove, child: const Text('Remove')),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _servicesTab(ColorScheme scheme) {
    final services = _provider?.services ?? const <OwnedProviderService>[];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Text(
          'Your services',
          style: TextStyle(fontWeight: FontWeight.w800, color: scheme.onSurface, fontSize: 16),
        ),
        const SizedBox(height: 10),
        if (services.isEmpty)
          Text('No services yet. Add one below.', style: TextStyle(color: scheme.onSurfaceVariant))
        else
          ...services.map(
            (service) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: scheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.65)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(service.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                        if (service.categoryName != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            service.categoryName!,
                            style: const TextStyle(color: Color(AppConfig.colorGold), fontSize: 12),
                          ),
                        ],
                        if (service.description != null) ...[
                          const SizedBox(height: 6),
                          Text(service.description!, style: TextStyle(color: scheme.onSurfaceVariant)),
                        ],
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _deleteService(service),
                    icon: const Icon(Icons.delete_outline_rounded),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 18),
        const Text('Add service', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
        const SizedBox(height: 12),
        Form(
          key: _serviceFormKey,
          child: Column(
            children: [
              TextFormField(
                controller: _serviceTitle,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Service title'),
                validator: (v) => validateMeaningfulText(
                  v,
                  fieldLabel: 'Service title',
                  optional: false,
                  minLength: 2,
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                // ignore: deprecated_member_use
                value: _serviceCategoryId,
                decoration: const InputDecoration(labelText: 'Category (optional)'),
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('No category')),
                  ..._categories.map(
                    (c) => DropdownMenuItem<String?>(value: c.id, child: Text(c.name)),
                  ),
                ],
                onChanged: (v) => setState(() => _serviceCategoryId = v),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _serviceDescription,
                minLines: 2,
                maxLines: 4,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: const InputDecoration(labelText: 'Description (optional)'),
                validator: (v) => validateMeaningfulText(v, fieldLabel: 'Description'),
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _saving ? null : _addService,
                child: Text(_saving ? 'Adding…' : 'Add service'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _inboxTab(ColorScheme scheme) {
    final dateFmt = DateFormat.yMMMd().add_jm();
    if (_provider == null) {
      return const LiveEmptyState(
        title: 'Create your business profile first',
        body: 'Save your profile tab, then enquiries from customers will appear here.',
        icon: Icons.inbox_outlined,
      );
    }
    if (_enquiries.isEmpty) {
      return const LiveEmptyState(
        title: 'Inbox is empty',
        body: 'When customers send enquiries from the app or website, they land here.',
        icon: Icons.inbox_outlined,
      );
    }
    return RefreshIndicator(
      color: const Color(AppConfig.colorGold),
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        itemCount: _enquiries.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = _enquiries[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: item.isNew
                    ? const Color(AppConfig.colorGold).withValues(alpha: 0.55)
                    : scheme.outlineVariant.withValues(alpha: 0.65),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(item.subject, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    ),
                    StatusChip(
                      label: enquiryStatusLabel(item.status),
                      tone: item.isNew ? ChipTone.gold : ChipTone.muted,
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  item.customerName?.trim().isNotEmpty == true
                      ? item.customerName!
                      : (item.customerEmail ?? 'Customer'),
                  style: const TextStyle(color: Color(AppConfig.colorGold), fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(item.message, style: TextStyle(color: scheme.onSurfaceVariant, height: 1.4)),
                const SizedBox(height: 8),
                Text(
                  dateFmt.format(item.createdAt.toLocal()),
                  style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (item.customerEmail != null)
                      OutlinedButton.icon(
                        onPressed: () => launchMailto(
                          email: item.customerEmail!,
                          subject: 'Re: ${item.subject}',
                          body: 'Hi ${item.customerName ?? ''},\n\n',
                        ),
                        icon: const Icon(Icons.reply_rounded, size: 18),
                        label: const Text('Reply by email'),
                      ),
                    if (item.isNew)
                      FilledButton.tonal(
                        onPressed: () => _setEnquiryStatus(item, 'read'),
                        child: const Text('Mark read'),
                      ),
                    if (item.status != 'replied')
                      FilledButton(
                        onPressed: () => _setEnquiryStatus(item, 'replied'),
                        child: const Text('Mark replied'),
                      ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(AppConfig.colorGold).withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(AppConfig.colorGold).withValues(alpha: 0.28)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Color(AppConfig.colorMuted), fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
