# Instalar Kona OS v8 — Google Health + Strava

## Paso 0: proteger tus entrenamientos

Antes de subir nada, en Kona OS actual abre **Ajustes → Descargar copia JSON** y guarda el archivo de forma privada. No lo subas a GitHub. La nueva versión conserva el almacenamiento local de Kona OS y el historial Domestique antiguo, pero deja de consultar su puente.

## Paso 1: actualizar tu web pública

1. Descomprime el ZIP y sube **los archivos y carpetas de la raíz** a `https://github.com/fmiquelbeltran-source/IronmanKONA-OS` (`main`). Cuando exista un archivo con el mismo nombre, reemplázalo.
2. **Importante:** sustituye expresamente `.github/workflows/kona-sync.yml` por el del paquete. Así desactivas el cron antiguo de Intervals.icu. No necesitas borrar tus archivos previos: `domestique-bridge.js` puede quedarse sin uso, porque `app.js` v8 ya no lo importa. No ejecutes el antiguo puente Windows.
3. Espera a que Github Pages publique y recarga la web. La pantalla **Google Health / Strava** aparecerá. La web seguirá funcionando sin conexión de nube, pero sin datos nuevos automáticos hasta los pasos posteriores.

## Paso 2: crear la base de datos privada (Supabase Free)

1. Ve a `https://supabase.com/dashboard` → organización `SOMA` → New project → nombre **Kona OS 2030** y región europea. Comprueba que el coste indicado sea 0 € antes de confirmar. No uses el proyecto SOMA antiguo si pertenece a otra aplicación.
2. En el proyecto: SQL Editor → New query → pega el contenido completo de `supabase/schema.sql` → Run. Crea las tablas `kona_profiles`, `kona_activities` y `kona_wellness`, con reglas RLS para que solo tu cuenta vea tus datos.
3. Ve a Project Settings → API Keys, copia solamente la **publishable** (o clave pública/anon), y el Project URL. No copies `service_role` o claves secretas.
4. En tu web Kona OS → **Ajustes y nube**, guarda URL y clave pública, crea una cuenta Supabase o inicia sesión. Confirma el correo si el proyecto lo exige. Puedes guardar tu planificación si quieres. Es la cuenta que usarás también en el móvil.
5. Prueba el botón **Actualizar salud y entrenamientos**. Antes de conectar Android, mostrará cero datos; es normal.

## Paso 3: conectar Strava con Salud Conectada

Ya tienes **Google Health vinculada con Salud Conectada**.

1. Abre Strava Android → **Tú → Ajustes → Gestionar aplicaciones y dispositivos → Salud Conectada**.
2. Concede a Strava permiso para **escribir ejercicios** en Salud Conectada.
3. En los ajustes de Android, busca Salud Conectada → Permisos de aplicaciones y comprueba las fuentes conectadas. Revisa que en Datos y acceso existan tus registros de sueño/HRV.
4. **No hace falta** conectar por API de desarrollador Strava ni pagar suscripción. Solo ciertas actividades con GPS de Strava llevan resúmenes a Salud Conectada. Strava/Google Health pueden crear duplicados si configuras flujos redundantes; en ese caso evita grabar simultáneamente la misma sesión en las dos aplicaciones.

## Paso 4: obtener el APK del conector Android

El ZIP contiene el proyecto fuente `android/KonaHealthBridge/`, **no un APK ya compilado**.

1. Tras subir el proyecto al repositorio de GitHub, ve a **Actions → Kona OS - compilar conector Android → Run workflow**.
2. Al finalizar correctamente, abre la ejecución y descarga el artefacto **KonaHealthBridge-Android-debug**, que contiene `app-debug.apk`.
3. Instálalo en tu Android solo si reconoces el repositorio y confías en el código. Android puede pedir permitir temporalmente instalaciones desde el navegador o gestor de archivos. Revoca ese permiso cuando termines.
4. Abre **Kona Health Bridge**. Introduce la misma URL Supabase y la misma clave *pública* de la web, entra con tu usuario y contraseña de Supabase.
5. Pulsa **Autorizar datos en Salud Conectada** y concede lectura a sueño, HRV, FC en reposo, ejercicio, distancia y lectura en segundo plano si está disponible.
6. Pulsa **Sincronizar ahora**, espera al resultado y comprueba en la web **Google Health / Strava → Actualizar desde nube**.
7. Si todo va bien, pulsa **Activar sincronización periódica**. Android organizará ejecuciones aproximadamente cada 30 minutos, sujetas a permisos, batería, red y retrasos del sistema.

## Cómo saber si está funcionando

Una actividad realizada en Strava debería aparecer primero en Salud Conectada, luego en Supabase a través de Kona Health Bridge, y finalmente en Kona OS. Los datos de sueño/HRV deben figurar en el panel de recuperación. Si una actividad **no existe en Salud Conectada**, este conector no puede inventarla ni recuperarla de Strava por sí mismo.

## Privacidad y desconexión

- Elimina la app Kona Health Bridge o utiliza su botón **Desvincular** para borrar la sesión del móvil. Revoca permisos desde Salud Conectada.
- Los datos enviados a Supabase permanecen allí hasta que tú los borres o elimines el proyecto; desinstalar el conector **no borra por sí solo** la base de datos.
- No compartas públicamente credenciales, archivos de sesión ni tu respaldo JSON. El GitHub público solo guarda código.
- Para desactivar el antiguo servicio de Windows, cierra el puente y quita su autoarranque si lo habías activado; no es necesario desinstalar Domestique si quieres seguir utilizándolo por separado.

## Qué queda sin verificar

El conector nativo y su build de GitHub Actions necesitan primera prueba real. El funcionamiento completo de sincronización automática, incluido el permiso de segundo plano en tu Android, no debe considerarse activado hasta comprobarlo en tu teléfono.
