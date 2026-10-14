plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}
android {
  namespace = "com.konaos.healthbridge"
  compileSdk = 35
  defaultConfig {
    applicationId = "com.konaos.healthbridge"
    minSdk = 28
    targetSdk = 35
    versionCode = 1
    versionName = "8.0"
  }
  compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
  kotlinOptions { jvmTarget = "17" }
}
dependencies {
  implementation("androidx.activity:activity-ktx:1.9.3")
  implementation("androidx.health.connect:connect-client:1.1.0")
  implementation("androidx.work:work-runtime-ktx:2.10.0")
  implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
