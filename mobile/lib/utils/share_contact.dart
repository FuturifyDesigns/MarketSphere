import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../models/models.dart';
import 'helpers.dart';

String listingWebUrl(ShowcaseListing listing) {
  final slug = listing.columnSlug ?? 'listing';
  final base = AppConfig.siteUrl.endsWith('/')
      ? AppConfig.siteUrl.substring(0, AppConfig.siteUrl.length - 1)
      : AppConfig.siteUrl;
  return '$base/showcase/$slug/${listing.id}';
}

String listingAppDeepLink(ShowcaseListing listing) {
  return 'com.marketspheregroup.market_sphere://listing/${listing.id}';
}

String providerWebUrl(ProviderItem provider) {
  final base = AppConfig.siteUrl.endsWith('/')
      ? AppConfig.siteUrl.substring(0, AppConfig.siteUrl.length - 1)
      : AppConfig.siteUrl;
  return '$base/providers/${provider.id}';
}

String providerAppDeepLink(ProviderItem provider) {
  return 'com.marketspheregroup.market_sphere://provider/${provider.id}';
}

String listingEnquiryMessage({
  required String title,
  String? columnTitle,
  String? location,
  String? price,
  String? dealType,
  String? summary,
  String? description,
  String? listingUrl,
}) {
  final lines = <String>[
    'Hello Market Sphere Group,',
    '',
    'I am interested in this showcase listing:',
    '',
    'Title: $title',
  ];
  if (columnTitle != null && columnTitle.isNotEmpty) lines.add('Column: $columnTitle');
  if (dealType != null) lines.add('Deal type: ${dealTypeLabel(dealType)}');
  if (location != null && location.isNotEmpty) lines.add('Location: $location');
  if (price != null && price.isNotEmpty) lines.add('Price: $price');
  if (listingUrl != null && listingUrl.isNotEmpty) lines.add('Link: $listingUrl');
  if (summary != null && summary.trim().isNotEmpty) {
    lines.addAll(['', 'Summary:', summary.trim()]);
  }
  if (description != null && description.trim().isNotEmpty) {
    lines.addAll(['', 'Full description:', description.trim()]);
  }
  lines.addAll(['', 'Please contact me with more details.', '']);
  return lines.join('\n');
}

Future<void> launchMailto({
  required String email,
  required String subject,
  required String body,
}) async {
  final uri = Uri(
    scheme: 'mailto',
    path: email,
    queryParameters: {
      'subject': subject,
      'body': body,
    },
  );
  await launchUrl(uri);
}

Future<void> launchWhatsApp({
  required String phone,
  required String message,
}) async {
  final digits = phone.replaceAll(RegExp(r'\D'), '');
  final uri = Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(message)}');
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<void> launchTel(String phone) async {
  final digits = phone.replaceAll(RegExp(r'[^\d+]'), '');
  await launchUrl(Uri(scheme: 'tel', path: digits));
}

Future<void> shareListing(ShowcaseListing listing) async {
  final url = listingWebUrl(listing);
  final text = [
    listing.title,
    if (listing.priceLabel != null) listing.priceLabel!,
    if (listing.location != null) listing.location!,
    '',
    'View on Market Sphere Group:',
    url,
    '',
    'Prefer the app? Open: ${listingAppDeepLink(listing)}',
  ].join('\n');
  await SharePlus.instance.share(ShareParams(text: text, subject: listing.title));
}

Future<void> shareProvider(ProviderItem provider) async {
  final url = providerWebUrl(provider);
  final text = [
    provider.businessName,
    if (provider.location != null) provider.location!,
    '',
    'Verified on Market Sphere Group:',
    url,
  ].join('\n');
  await SharePlus.instance.share(ShareParams(text: text, subject: provider.businessName));
}
