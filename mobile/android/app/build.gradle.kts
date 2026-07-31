import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// Local APKs: omit key.properties and pass -PallowDebugSigning=true.
// Play / shared release builds must use android/key.properties + upload keystore.
val allowDebugSigning =
    (project.findProperty("allowDebugSigning") as String?)?.equals("true", ignoreCase = true) == true

android {
    namespace = "com.marketspheregroup.market_sphere"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.marketspheregroup.market_sphere"
        minSdk = 24
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            signingConfig = when {
                keystorePropertiesFile.exists() -> signingConfigs.getByName("release")
                allowDebugSigning -> {
                    logger.warn(
                        "Release is signed with the DEBUG keystore (-PallowDebugSigning=true). " +
                            "Do not upload this APK to Play Store.",
                    )
                    signingConfigs.getByName("debug")
                }
                else -> throw GradleException(
                    "Missing android/key.properties for release signing. " +
                        "Copy key.properties.example → key.properties, or pass " +
                        "-PallowDebugSigning=true for a local-only APK.",
                )
            }
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}

flutter {
    source = "../.."
}
