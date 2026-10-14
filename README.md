# KONA OS 2030 — v8 · Google Health + Strava, sin Domestique

Este paquete sustituye el sistema de entrada de datos de Domestique por **Google Health y Strava a través de Salud Conectada (Health Connect) en Android**. Incluye una web compatible con GitHub Pages y un proyecto Android independiente para construir el conector que lee datos autorizados de Salud Conectada y los envía a Supabase.

## Estado probado y pendientes

**Código web v8 comprobado:** no llama al puente de Domestique; conserva la clave de almacenamiento `konaos2030_v1`, fichas, gráficas e informes; deduplica actividades al fusionar entrenamiento legado y Health Connect; integra sueño/HRV/FC en reposo en la revisión dominical; usa tablas privadas de Supabase con RLS. La automatización antigua de Intervals.icu queda **desactivada** mediante `.github/workflows/kona-sync.yml` (sobrescribir este archivo, no solo subir los nuevos).

**Pendiente de probar en un móvil real:** el proyecto Kotlin para Android. Aquí no hay SDK Android instalado y no hemos compilado un APK; incluye el workflow `.github/workflows/android-apk.yml` que intentará generar `app-debug.apk` en GitHub Actions. Hasta que la compilación, los permisos y la primera carga real se verifiquen, **no hay sincronización automática activa**.

**Supabase:** no existe todavía un proyecto nuevo llamado Kona OS 2030 en la organización SOMA. La creación y activación son necesarias. No publiques nunca tu contraseña, JWT, refresh token ni `service_role`.

## Qué datos son posibles

- **Google Health → Salud Conectada:** sueño (horas), HRV (rMSSD) y frecuencia cardíaca en reposo, cuando constan allí y autorizas la lectura.
- **Strava → Salud Conectada:** sesiones con GPS, duración y distancia cuando Strava las escribe. No promete potencia, TSS, intervalos, frecuencia cardíaca por segundo ni todas las modalidades.
- **Kona OS:** ficha individual, estadísticas, revisión dominical, subida y descarga de tus resúmenes con autenticación privada.

Los permisos son de **solo lectura** en Salud Conectada. Los registros se almacenan únicamente en tu cuenta privada Supabase, no en el repositorio GitHub. En tu móvil se guarda la sesión con cifrado Android. Puedes revocar permisos en ajustes de Salud Conectada y desvincular la aplicación.

## Instalación

Sigue `INSTALAR_V8.md` en orden. La actualización de la web es independiente de la instalación del conector Android.

## Uso gratuito

La web, Health Connect y la compilación de prueba se basan en herramientas gratuitas (sujetas a sus límites). Supabase permite un plan gratuito, pero debes comprobar el precio al crear el proyecto. No usamos API de Strava, ya que su registro de aplicación de desarrollador exige suscripción. No usamos OpenAI API.

## Limitaciones de Android

Sincronización en segundo plano programada cada 30 minutos, **no garantizada en un minuto exacto**; requiere permitir el acceso en segundo plano y que el dispositivo sea compatible. Google Health y Strava pueden tardar en escribir datos en Salud Conectada. El conector también permite forzar una sincronización manual para probar. Un APK debug compilado por GitHub Actions es de prueba y no reemplaza una app Android publicada y auditada.
