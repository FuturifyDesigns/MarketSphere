# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Play Core (deferred components / split install stubs used by Flutter)
-dontwarn com.google.android.play.core.**

# Gson / JSON used by plugins
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# flutter_secure_storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Google Sign-In / Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
