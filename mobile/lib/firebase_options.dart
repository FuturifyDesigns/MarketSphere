// File generated for Market Sphere Android FCM.
// ignore_for_file: lines_longer_than_80_chars

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for Market Sphere Group Android.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web Firebase is not configured for this app.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
        throw UnsupportedError('Only Android Firebase is configured for this app.');
      default:
        throw UnsupportedError('Unsupported platform for Firebase.');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBOHCs6-qijz-J0gcsewW9ZUFlHIykyy7Q',
    appId: '1:623975399645:android:b235a23e212da685969b34',
    messagingSenderId: '623975399645',
    projectId: 'market-sphere-group-d4ff9',
    storageBucket: 'market-sphere-group-d4ff9.firebasestorage.app',
  );
}
