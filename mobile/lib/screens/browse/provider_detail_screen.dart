import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config.dart';
import '../../models/models.dart';
import '../../services/data_repository.dart';
import '../../state/auth_controller.dart';
import '../../state/engagement_controller.dart';
import '../../utils/app_feedback.dart';
import '../../utils/helpers.dart';
import '../../utils/share_contact.dart';
import '../../widgets/auth_gate.dart';
import '../../widgets/common.dart';
import '../../widgets/trust_widgets.dart';
import '../dashboard/send_enquiry_sheet.dart';

class ProviderDetailScreen extends StatefulWidget {
  const ProviderDetailScreen({super.key, required this.providerId});

  final String providerId;

  @override
  State<ProviderDetailScreen> createState() => _ProviderDetailScreenState();
}

class _ProviderDetailScreenState extends State<ProviderDetailScreen> {
  Future<ProviderItem?>? _future;
  Future<List<ProviderReview>>? _reviewsFuture;
  var _rating = 5;
  final _reviewBody = TextEditingController();
  var _savingReview = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
    _reviewsFuture ??= context.read<DataRepository>().fetchProviderReviews(widget.providerId);
  }

  @override
  void dispose() {
    _reviewBody.dispose();
    super.dispose();
  }

  Future<ProviderItem?> _load() async {
    final repo = context.read<DataRepository>();
    final engagement = context.read<EngagementController>();
    final provider = await repo.fetchProvider(widget.providerId);
    if (provider != null) {
      await engagement.recordProviderView(provider);
    }
    return provider;
  }

  Future<void> _toggleFavourite(ProviderItem provider) async {
    final auth = context.read<AuthController>();
    if (!auth.isSignedIn || auth.profile == null) {
      await showSignUpGate(context);
      return;
    }
    final wasSaved = context.read<EngagementController>().isProviderSaved(provider.id);
    final err = await context.read<EngagementController>().toggleProviderFavourite(
          auth.profile!.id,
          provider,
        );
    if (!mounted) return;
    if (err != null) {
      showErrorPopup(context, err);
    } else {
      showSuccessPopup(
        context,
        wasSaved ? 'Removed from favourites' : 'Saved to favourites',
      );
    }
  }

  Future<void> _submitReview(ProviderItem provider) async {
    final auth = context.read<AuthController>();
    if (!auth.isSignedIn || auth.profile == null) {
      await showSignUpGate(context);
      return;
    }
    setState(() => _savingReview = true);
    final err = await context.read<DataRepository>().upsertProviderReview(
          providerId: provider.id,
          customerId: auth.profile!.id,
          rating: _rating,
          body: sanitizeReviewBody(_reviewBody.text),
        );
    if (!mounted) return;
    setState(() {
      _savingReview = false;
      _reviewsFuture = context.read<DataRepository>().fetchProviderReviews(widget.providerId);
      _future = _load();
    });
    if (err != null) {
      showErrorPopup(context, err);
    } else {
      showSuccessPopup(context, 'Thanks — your review is live.');
      _reviewBody.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final engagement = context.watch<EngagementController>();
    final auth = context.watch<AuthController>();

    return Scaffold(
      body: FutureBuilder<ProviderItem?>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold)));
          }
          final provider = snapshot.data;
          if (provider == null) {
            return Scaffold(
              appBar: AppBar(),
              body: const Center(child: Text('Provider not found')),
            );
          }

          final saved = engagement.isProviderSaved(provider.id);

          return CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                expandedHeight: 260,
                backgroundColor: scheme.surface,
                actions: [
                  IconButton(
                    tooltip: saved ? 'Remove favourite' : 'Save',
                    onPressed: () => _toggleFavourite(provider),
                    icon: Icon(saved ? Icons.favorite_rounded : Icons.favorite_border_rounded),
                  ),
                  IconButton(
                    tooltip: 'Share',
                    onPressed: () => shareProvider(provider),
                    icon: const Icon(Icons.ios_share_rounded),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      AppNetworkImage(url: provider.imageUrl),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0xCC0E1116)],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        provider.businessName,
                        style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700, height: 1.15),
                      ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          const VerifiedBadge(),
                          if (provider.isMsApproved) const MsApprovedStamp(),
                        ],
                      ),
                      if (provider.averageRating != null) ...[
                        const SizedBox(height: 12),
                        RatingStars(
                          rating: provider.averageRating!,
                          count: provider.reviewCount,
                        ),
                      ],
                      if (provider.location != null) ...[
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Icon(Icons.place_outlined, size: 18, color: scheme.onSurfaceVariant),
                            const SizedBox(width: 6),
                            Expanded(child: Text(provider.location!)),
                          ],
                        ),
                      ],
                      if (provider.description != null) ...[
                        const SizedBox(height: 18),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: scheme.surface,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.7)),
                          ),
                          child: Text(provider.description!, style: const TextStyle(height: 1.5)),
                        ),
                      ],
                      const SizedBox(height: 22),
                      if (auth.isSignedIn && auth.profile?.isProvider != true && auth.profile?.isAdmin != true) ...[
                        FilledButton.icon(
                          onPressed: () => showSendEnquirySheet(
                            context,
                            providerId: provider.id,
                            providerName: provider.businessName,
                          ),
                          icon: const Icon(Icons.mail_outline_rounded),
                          label: const Text('Send enquiry'),
                        ),
                        const SizedBox(height: 10),
                      ],
                      if (provider.contactEmail != null)
                        FilledButton.tonalIcon(
                          onPressed: () => launchMailto(
                            email: provider.contactEmail!,
                            subject: 'Enquiry via Market Sphere Group',
                            body:
                                'Hello ${provider.businessName},\n\nI found you on the Market Sphere Group app.\n${providerWebUrl(provider)}\n',
                          ),
                          icon: const Icon(Icons.alternate_email_rounded),
                          label: const Text('Email provider'),
                        ),
                      if (provider.contactPhone != null) ...[
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: () => launchTel(provider.contactPhone!),
                          icon: const Icon(Icons.phone_outlined),
                          label: Text('Call ${provider.contactPhone}'),
                        ),
                        const SizedBox(height: 10),
                        OutlinedButton.icon(
                          onPressed: () => launchWhatsApp(
                            phone: provider.contactPhone!,
                            message:
                                'Hi ${provider.businessName}, I found you on Market Sphere Group.\n${providerWebUrl(provider)}',
                          ),
                          icon: const Icon(Icons.chat_outlined),
                          label: const Text('WhatsApp'),
                        ),
                      ],
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: () => shareProvider(provider),
                        icon: const Icon(Icons.share_rounded),
                        label: const Text('Share provider'),
                      ),
                      const SizedBox(height: 28),
                      const Text(
                        'Ratings & reviews',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Help others trust Market Sphere as the official channel.',
                        style: TextStyle(color: scheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 12),
                      InteractiveStarPicker(
                        value: _rating,
                        onChanged: (v) => setState(() => _rating = v),
                      ),
                      TextField(
                        controller: _reviewBody,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          hintText: 'Share your experience (optional)',
                        ),
                      ),
                      const SizedBox(height: 10),
                      FilledButton(
                        onPressed: _savingReview ? null : () => _submitReview(provider),
                        child: Text(_savingReview ? 'Saving…' : 'Submit review'),
                      ),
                      const SizedBox(height: 18),
                      FutureBuilder<List<ProviderReview>>(
                        future: _reviewsFuture,
                        builder: (context, reviewSnap) {
                          final reviews = reviewSnap.data ?? const <ProviderReview>[];
                          if (reviewSnap.connectionState != ConnectionState.done) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12),
                              child: Center(child: CircularProgressIndicator(color: Color(AppConfig.colorGold))),
                            );
                          }
                          if (reviews.isEmpty) {
                            return Text(
                              'No reviews yet — be the first.',
                              style: TextStyle(color: scheme.onSurfaceVariant),
                            );
                          }
                          return Column(
                            children: reviews
                                .map(
                                  (r) => Container(
                                    width: double.infinity,
                                    margin: const EdgeInsets.only(bottom: 12),
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: scheme.surface,
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.6)),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                r.customerName ?? 'Member',
                                                style: const TextStyle(fontWeight: FontWeight.w700),
                                              ),
                                            ),
                                            RatingStars(rating: r.rating.toDouble(), showValue: false, size: 16),
                                          ],
                                        ),
                                        if (r.body != null && r.body!.trim().isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Text(r.body!, style: const TextStyle(height: 1.4)),
                                        ],
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          );
                        },
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
