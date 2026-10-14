# Kona Health Bridge (Android)

Proyecto fuente Kotlin para compilar con Gradle / Android Studio. Usa AndroidX Health Connect 1.1.0 y WorkManager. Sin secretos embebidos.

La forma más sencilla de generar un APK de pruebas sin instalar Android Studio es el GitHub Action de la raíz: `Kona OS - compilar conector Android`.

**Estado: código fuente no compilado en este entorno** (no dispone del SDK Android). El primer APK requiere comprobar la compilación en GitHub Actions y probar permisos con datos reales.

El conector lee 14 días de datos de Salud Conectada, deduplica actividades recibidas por Strava y otras fuentes, y solo sube datos cuando el usuario autoriza explícitamente la sesión Supabase y los permisos de lectura.
