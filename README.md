# KONA OS 2030 · v5 GRATUITA · sincronización local Domestique

La versión 5 mantiene todas las secciones de Kona OS v4 e incorpora lectura automática de actividades y métricas de recuperación obtenidas de tu Domestique local, **sin claves ni suscripciones**. No hay conexión directa con la API de Garmin, Strava ni Intervals.icu. Domestique es una aplicación de terceros que puede cambiar sus endpoints; si los cambia, tendremos que actualizar el puente.

## PASO 0: copia de seguridad

Antes de actualizar entra en la web actual > **Ajustes → Descargar copia JSON** y guárdala fuera de GitHub. La v5 mantiene `konaos2030_v1` como clave local, por lo que debería conservar tus datos en el mismo navegador/dominio. La copia te protege si hay cualquier problema.

## PASO 1: actualizar la web en GitHub

1. Descarga **KonaOS2030_Web_v5.zip** y descomprímelo.
2. Entra en `https://github.com/fmiquelbeltran-source/IronmanKONA-OS`.
3. Sube **los archivos de dentro del ZIP** a la raíz de la rama `main` y reemplaza los antiguos. No subas el ZIP sin descomprimir.
4. Confirma el commit y espera al despliegue de GitHub Pages.
5. Abre `https://fmiquelbeltran-source.github.io/IronmanKONA-OS/` y recarga a fondo con Ctrl+F5 si sigue saliendo la versión anterior.
6. Abre «Garmin / Strava»: arriba verás el nuevo panel **Domestique → KONA OS**. Estará esperando al puente de Windows hasta completar el paso 2.

## PASO 2: iniciar el puente local en Windows

1. Descarga **KonaOS2030_Puente_Windows_v1.zip** y descomprímelo en una carpeta estable del PC, por ejemplo `Documentos\KonaOS-Puente`.
2. Abre Domestique y comprueba que cargue las actividades de Intervals.icu.
3. Haz doble clic en `INICIAR_PUENTE.bat`. Requiere **Python 3**, que es gratuito. Si Windows dice que no encuentra Python, instálalo desde `https://www.python.org/downloads/windows/` y vuelve a abrir el `.bat`.
4. Debe aparecer el texto «Escuchando solo en http://127.0.0.1:23571/health» y permanecer abierta la consola. Puedes comprobarlo en el navegador en `http://127.0.0.1:23571/health` (muestra **solo** el estado del puente, nunca tus actividades).
5. Abre Kona OS desde el **mismo ordenador** en Chrome/Edge y entra en **Garmin / Strava**. Pulsa «Sincronizar ahora» o espera un momento. Si el navegador pide permiso para acceso a dispositivos en la red local, autorízalo para tu propia página de Kona OS.
6. Verifica que haya actividades. **Vincular** una actividad a una sesión planificada es opcional y siempre manual para evitar asignaciones erróneas.
7. Si quieres que el puente se inicie con Windows, usa `ACTIVAR_INICIO_AUTOMATICO.bat` **después de decidir dónde guardar la carpeta definitivamente**. Para desactivarlo, `DESACTIVAR_INICIO_AUTOMATICO.bat`. No hace falta permisos de administrador. Domestique también tiene que estar abierto y sincronizado.

## Qué ocurre automáticamente

- Con Kona OS abierta en el PC y el puente en ejecución, la web consulta Domestique al iniciar y cada **cinco minutos** mientras la pestaña está abierta. Al volver a una pestaña que estaba oculta, puede actualizarse.
- La web guarda localmente las nuevas actividades de los deportes reconocidos y un histórico limitado de métricas de recuperación, sin sobreescribir registros hechos manualmente.
- Las actividades se deduplican por identificador de Intervals.icu/Domestique cuando está disponible. Una misma sesión con identificadores distintos (p. ej. archivo FIT manual y sincronización de Intervals) puede necesitar revisión manual.
- Una actividad **no completa automáticamente** la sesión de tu plan: para evitar errores, debes pulsar **Vincular** cuando haya una única coincidencia del deporte y la fecha.
- Las métricas disponibles de recuperación (sueño, FC reposo, HRV, CTL/ATL/TSB) se incluyen como datos *informativos* en el informe de ChatGPT. La revisión local y las progresiones de entrenamiento siguen necesitando validar las sesiones y las sensaciones.

## Qué NO es automático (ni gratuito de forma desatendida)

- Con el **PC apagado**, Domestique cerrado o Kona OS cerrada, **no existe sincronización** ni servicio en segundo plano de la web.
- Si abres la web desde el móvil, **no tendrá acceso directo a Domestique** de tu ordenador. Puedes conservar los datos mediante exportaciones/importaciones JSON o, en otra fase, utilizar un servicio de sincronización en nube con consentimiento y acceso privado.
- El análisis deportivo personalizado con ChatGPT sigue siendo **manual**: el domingo, en «Revisión domingo», pulsa «Copiar informe para ChatGPT», pégalo en nuestra conversación y aprueba en la web la propuesta JSON que generemos. ChatGPT Plus no incluye una API gratis para hacer ese trabajo automáticamente dentro de la web.
- Domestique prioriza ciclismo y, en algunas versiones, su endpoint de actividad sólo ofrece el historial **reciente**. El puente prueba también el archivo de actividades, pero quizá falten entrenamientos antiguos o datos limitados por las APIs originales. La importación CSV manual de la v4 continúa disponible.

## Seguridad

- El puente **solo escucha en 127.0.0.1**, utiliza peticiones **de lectura** a Domestique, nunca solicita ni lee sus archivos `.env`, ni contraseñas, ni tokens de Garmin/Strava/Intervals.icu.
- **Solo autoriza** como origen web `https://fmiquelbeltran-source.github.io`, la dirección de tu Kona OS. No admite otros orígenes ni permite escrituras. Se prueba con requests simuladas.
- Sólo transmite del puente al navegador métricas deportivas permitidas: **no envía coordenadas GPS, credenciales o datos de cuenta**. El navegador guarda la información en localStorage.
- La web es pública como código de GitHub Pages, pero tus registros **no se publican** ni se suben al repositorio. No publiques las copias JSON personales en GitHub.
- Windows puede pedir permiso de acceso a la red local desde Chrome/Edge. Si no conecta aunque `http://127.0.0.1:23571/health` funcione, prueba con Chrome/Edge desde el propio ordenador, recarga la web y comprueba permisos del navegador o extensiones de privacidad.
- Evita modificar el código para exponer el puerto `23571` en la red doméstica o Internet.

## Pruebas

```bash
python -m unittest discover -s tests -p test_bridge.py -v
node tests/test_domestique.mjs
```

Pruebas realizadas con un servidor Domestique simulado: control de origen y Host, sanitización de credenciales, conectividad, normalización y deduplicación, historial de recuperación. **La conexión end-to-end a tu Domestique real solo puede verificarse en tu Windows**. La prueba visual con navegador no pudo completarse en el entorno de creación por una restricción local de navegación; no se afirma que ya esté validada en tu ordenador.

## Coste

GitHub Pages + Domestique + el puente Python + esta versión local de Kona OS: **0 €**.

