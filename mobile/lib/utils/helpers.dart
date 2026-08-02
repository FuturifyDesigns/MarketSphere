import 'dart:async';
import 'dart:io';

import '../config.dart';
import '../services/data_repository.dart';

const dealTypeLabels = <String, String>{
  'sale': 'For sale',
  'rent': 'For rent',
  'sale_rent': 'For sale & rent',
  'opportunity': 'Opportunity',
  'project': 'Project',
  'service': 'Service',
  'other': 'Listing',
};

String dealTypeLabel(String dealType) => dealTypeLabels[dealType] ?? 'Listing';

String availabilityLabel(String dealType, bool available) {
  if (available) {
    return switch (dealType) {
      'opportunity' || 'project' => 'Open',
      _ => 'Available',
    };
  }
  return switch (dealType) {
    'sale' => 'Sold',
    'rent' => 'Rented',
    'opportunity' => 'Closed',
    'project' => 'Completed',
    _ => 'Unavailable',
  };
}

String? validateEmail(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return 'Email is required';
  if (v.length > 254) return 'Email is too long';
  final ok = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v);
  if (!ok) return 'Enter a valid email address';
  return null;
}

String? validatePassword(String? value, {bool login = false}) {
  final password = value ?? '';
  if (password.isEmpty) return 'Password is required';
  if (login) return null;
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password is too long';
  if (!RegExp(r'[A-Za-z]').hasMatch(password)) return 'Include at least one letter';
  if (!RegExp(r'\d').hasMatch(password)) return 'Include at least one number';
  final mixed = RegExp(r'[A-Z]').hasMatch(password) && RegExp(r'[a-z]').hasMatch(password);
  final symbol = RegExp(r'[^A-Za-z0-9]').hasMatch(password);
  if (!mixed && !symbol) {
    return 'Choose a stronger password — add mixed case or a symbol';
  }
  return null;
}

String? validateFullName(String? value) {
  final v = (value ?? '').trim();
  if (v.length < 2) return 'Enter your full name';
  if (v.length > 100) return 'Name is too long';
  if (RegExp(r'\d').hasMatch(v)) return 'Name cannot include numbers';
  if (!RegExp(r'\p{L}', unicode: true).hasMatch(v)) {
    return 'Name needs real text — not just symbols or punctuation';
  }
  return null;
}

String? validateMeaningfulText(String? value, {String fieldLabel = 'This field', bool optional = true, int? minLength}) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return optional ? null : '$fieldLabel is required';
  if (minLength != null && v.length < minLength) {
    return '$fieldLabel must be at least $minLength characters';
  }
  if (RegExp(r'^-?\d+(\.\d+)?$').hasMatch(v.replaceAll(RegExp(r'\s'), ''))) {
    return '$fieldLabel cannot be only numbers';
  }
  if (!RegExp(r'\p{L}', unicode: true).hasMatch(v)) {
    return '$fieldLabel needs real text — not just symbols or punctuation';
  }
  return null;
}

String? validateEnquirySubject(String? value) {
  final v = (value ?? '').trim();
  if (v.length < 3) return 'Subject must be at least 3 characters';
  if (v.length > 120) return 'Subject is too long';
  return validateMeaningfulText(v, fieldLabel: 'Subject', optional: false);
}

String? validateEnquiryMessage(String? value) {
  final v = (value ?? '').trim();
  if (v.length < 10) return 'Message must be at least 10 characters';
  if (v.length > 2000) return 'Message is too long';
  return validateMeaningfulText(v, fieldLabel: 'Message', optional: false);
}

String enquiryStatusLabel(String status) {
  return switch (status) {
    'new' => 'New',
    'read' => 'Read',
    'replied' => 'Replied',
    'closed' => 'Closed',
    _ => status.replaceAll('_', ' '),
  };
}

String? validatePhoneLocalOptional(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return null;
  if (RegExp(r'[A-Za-z]').hasMatch(v)) return 'Phone number should only contain digits';
  final digits = v.replaceAll(RegExp(r'\D'), '');
  if (digits.length < 7 || digits.length > 12) return 'Enter a valid phone number';
  return null;
}

String? validateConfirmPassword(String? value, String password) {
  if ((value ?? '').isEmpty) return 'Please confirm your password';
  if (value != password) return 'Passwords do not match';
  return null;
}

String formatPhone(String countryCode, String local) {
  final digits = local.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '';
  final normalized = digits.startsWith('0') ? digits.substring(1) : digits;
  return '$countryCode $normalized';
}

String showcaseColumnCoverUrl(String slug) {
  final clean = slug.trim();
  if (clean.isEmpty) return '${AppConfig.siteUrl}showcase/real-estate.webp';
  return '${AppConfig.siteUrl}showcase/$clean.webp';
}

final _uuidRe = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);

bool isUuid(String? value) {
  final v = value?.trim() ?? '';
  return _uuidRe.hasMatch(v);
}

/// Human-readable reason a feed failed, so empty screens are never silent.
String describeLoadError(Object? error) {
  if (error == null) return 'Check your connection and try again.';
  final raw = error is DataFetchException ? error.detail : error.toString();

  if (error is TimeoutException || raw.contains('TimeoutException')) {
    return 'Your phone reached no answer from our servers.\n\n'
        'This is usually mobile data or Wi-Fi that is connected but not passing '
        'traffic. Try another network, then run Settings → Connection test.';
  }
  if (error is SocketException || raw.contains('SocketException')) {
    return 'No internet connection on this phone.\n\n'
        'Turn Wi-Fi or mobile data back on and pull down to refresh.';
  }

  final trimmed = raw.length > 200 ? '${raw.substring(0, 200)}…' : raw;
  return 'Check your connection and try again.\n\n$trimmed';
}

String? sanitizePreferredArea(String? value) {
  final v = (value ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
  if (v.isEmpty) return null;
  if (v.length > 80) return v.substring(0, 80);
  if (RegExp(r'[<>{}$]').hasMatch(v)) return null;
  if (!RegExp(r'\p{L}', unicode: true).hasMatch(v)) return null;
  return v;
}

String? sanitizeReviewBody(String? value) {
  var v = (value ?? '').trim();
  if (v.isEmpty) return null;
  v = v.replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F]'), '');
  if (v.length > 1000) v = v.substring(0, 1000);
  if (!RegExp(r'\p{L}', unicode: true).hasMatch(v)) return null;
  return v;
}

String? validateReviewRating(int rating) {
  if (rating < 1 || rating > 5) return 'Choose a rating from 1 to 5 stars';
  return null;
}

/// Never show raw backend/exception text in the UI.
String friendlyError(Object? error, {String fallback = 'Something went wrong. Please try again.'}) {
  final s = (error ?? '').toString().toLowerCase();
  if (s.isEmpty) return fallback;
  if (s.contains('socket') ||
      s.contains('network') ||
      s.contains('failed host') ||
      s.contains('timed out') ||
      s.contains('connection')) {
    return 'You’re offline or the network is unstable. Try again when connected.';
  }
  if (s.contains('jwt') || s.contains('session') || s.contains('not authenticated') || s.contains('401')) {
    return 'Please sign in again.';
  }
  if (s.contains('permission') || s.contains('row-level') || s.contains('42501') || s.contains('403')) {
    return 'You don’t have permission for that action.';
  }
  if (s.contains('unique') || s.contains('duplicate')) {
    return 'That’s already saved.';
  }
  if (s.contains('banned')) {
    return 'This account is restricted.';
  }
  return fallback;
}
