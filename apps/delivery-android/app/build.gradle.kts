plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "zw.co.dial.delivery"
    compileSdk = 35

    defaultConfig {
        applicationId = "zw.co.dial.delivery"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.2.0"
        manifestPlaceholders["usesCleartext"] = "false"
        buildConfigField("boolean", "DIAL_GATEWAY_URL_CONFIGURED", "true")
    }

    flavorDimensions += "gateway"
    productFlavors {
        create("local") {
            dimension = "gateway"
            manifestPlaceholders["usesCleartext"] = "true"
            buildConfigField("String", "DIAL_GATEWAY_BASE_URL", "\"http://10.0.2.2:3000\"")
            buildConfigField("boolean", "DIAL_GATEWAY_URL_CONFIGURED", "true")
        }
        create("staging") {
            dimension = "gateway"
            val url = ((project.findProperty("dial.gateway.baseUrl") as String?)?.trim()
                ?: System.getenv("DIAL_GATEWAY_BASE_URL")?.trim().orEmpty())
            buildConfigField("String", "DIAL_GATEWAY_BASE_URL", "\"$url\"")
            buildConfigField("boolean", "DIAL_GATEWAY_URL_CONFIGURED", if (url.isNotBlank()) "true" else "false")
        }
        create("prod") {
            dimension = "gateway"
            val url = System.getenv("DIAL_GATEWAY_BASE_URL")?.trim().orEmpty()
            buildConfigField("String", "DIAL_GATEWAY_BASE_URL", "\"$url\"")
            buildConfigField("boolean", "DIAL_GATEWAY_URL_CONFIGURED", if (url.isNotBlank()) "true" else "false")
        }
    }

    signingConfigs {
        create("releaseVault") {
            val store = System.getenv("DIAL_ANDROID_KEYSTORE")?.trim().orEmpty()
            if (store.isNotBlank()) {
                storeFile = file(store)
                storePassword = System.getenv("DIAL_ANDROID_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("DIAL_ANDROID_KEY_ALIAS")
                keyPassword = System.getenv("DIAL_ANDROID_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            val cfg = signingConfigs.getByName("releaseVault")
            if (cfg.storeFile != null) signingConfig = cfg
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(project(":core:network"))
    implementation(project(":core:maps"))
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
