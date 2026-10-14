# KONA OS 2030 · Road to Kona

Aplicación web privada de seguimiento de entrenamiento de larga distancia: plan semanal, registro de entrenamientos, estado de recuperación, evaluación, orientaciones nutricionales y revisión dominical.

## 1. Publicar en GitHub Pages (sin instalar nada)

1. Descomprime `KonaOS2030.zip` en tu ordenador.
2. En [github.com](https://github.com) crea un repositorio nuevo, por ejemplo `kona-os-2030`.
3. Sube **el contenido de la carpeta `KonaOS2030` directamente a la raíz** del repositorio (index.html, app.js, data.js, cloud.js, styles.css, assets/, supabase/...). No subas la carpeta contenedora como una única subcarpeta.
4. En el repositorio, abre **Settings → Pages** y, en *Build and deployment*, selecciona **Deploy from a branch**, `main`, `/ (root)`, y guarda. Es la ruta más sencilla. Si subes también `.github/workflows/pages.yml`, puedes elegir **GitHub Actions** como alternativa en la misma pantalla.
5. Cuando GitHub termine de publicar, encontrarás la web en una URL parecida a `https://TUUSUARIO.github.io/kona-os-2030/`.
6. Abre la web en el móvil y añádela a la pantalla de inicio (menú del navegador → Añadir a pantalla de inicio / Instalar aplicación).

No hace falta `npm`, Node, Vite ni desplegar un servidor para usar el modo local. Los enlaces `./` funcionan bajo una subruta de GitHub Pages.

### Cómo trabajar cada día

- **Plan semanal:** semanas iniciales del 2 al 29 de noviembre de 2026. Entra en cada sesión para cambiar objetivos, marcarla como *Completada* o *Omitida*, y anotar minutos reales, FC, potencia, RPE, hidratos y sensaciones.
- **Diario y recuperación:** introduce horas de sueño, fatiga, FC reposo, HRV opcional, síntomas y notas.
- **Nutrición:** orientaciones por tipo de jornada, calculadas a partir del peso de referencia y duración prevista. No son una prescripción individual completa.
- **Evaluaciones:** guarda VO₂máx, VT1, VT2, FTP, biomecánica u otras pruebas.
- **Domingo:** abre **Revisión domingo**, entra en la semana que termina, registra como completadas u omitidas al menos el 70 % de las sesiones, pulsa **Guardar conclusiones** y **Crear próxima semana**. El modo local aplica reglas de progresión conservadoras. Si la siguiente semana ya está planificada, pedirá confirmación para sustituirla. **Nunca** sobrescribirá una semana que ya tenga entrenamientos registrados.
- **Ajustes:** exporta periódicamente el archivo JSON para guardar una copia de seguridad y cambiar de navegador/dispositivo sin perder datos.

**Importante:** GitHub Pages es solo alojamiento web. En modo local los registros se guardan en `localStorage` de *ese navegador y dispositivo*. No se envían por sí solos a ChatGPT, no están en GitHub y no se sincronizan entre dispositivos.

## 2. Sincronización privada entre dispositivos (opcional)

Si quieres guardar el perfil de manera privada y compartir los mismos registros entre móvil y ordenador:

1. Crea o elige un **proyecto personal apropiado de Supabase**. Si ya utilizas Supabase para otra aplicación, no modifiques sus tablas sin revisar antes los posibles efectos. Este paquete no realiza ningún cambio remoto por sí solo.
2. En Supabase abre **SQL Editor** y ejecuta el archivo `supabase/schema.sql` **una vez**. Crea `kona_profiles`, habilita RLS y restringe lectura y escritura al propietario autenticado.
3. En **Project Settings → API Keys** (la ubicación puede variar), copia **Project URL** y **publishable key**; la `anon` antigua también sirve en configuraciones compatibles. **Nunca** uses `service_role`, `secret key` ni OpenAI API key en el navegador.
4. En Supabase **Authentication**, habilita el acceso con email y contraseña. Si hay confirmación de correo, verifica tu dirección.
5. En la web entra en **Ajustes y nube**, introduce URL/clave pública, crea cuenta o inicia sesión y pulsa **Subir mis datos** para iniciar la copia.
6. En el segundo dispositivo inicia sesión con las mismas credenciales y pulsa **Recuperar desde la nube** antes de editar; la primera recuperación **sustituye** los datos locales del dispositivo. Después de iniciar sesión, los cambios futuros se guardarán localmente y se intentará sincronizarlos automáticamente con la nube.

**Limitación de versión 1:** la sincronización utiliza un único documento JSON por usuario (last-write-wins), no fusiona cambios paralelos. No edites desde dos dispositivos al mismo tiempo; exporta una copia antes de importar o recuperar. Las sesiones son privadas mediante RLS, pero el **código fuente de una web alojada en un repositorio público es público**. Nunca subas credenciales secretas a GitHub.

## 3. Entrenador IA dentro de la web (opcional)

El modo local ya puede resumir entrenamientos y crear la próxima semana aplicando reglas, sin coste de API. Para que una **IA independiente** de esta conversación analice los registros y proponga un plan dentro de la web:

1. Configura Supabase, la tabla y el inicio de sesión según el apartado anterior.
2. Desde el panel Supabase Edge Functions o Supabase CLI, crea y despliega una función **`kona-coach`** usando el archivo `supabase/functions/kona-coach/index.ts`. Activa **Verify JWT** para la función. Comprueba que tu plataforma admita secretos como `SUPABASE_URL` y `SUPABASE_ANON_KEY` (o adapta a tu configuración).
3. En los **secrets del servidor Edge Functions**, configura `OPENAI_API_KEY` con tu clave personal de la API y, opcionalmente, `OPENAI_MODEL` (predeterminado: `gpt-4.1-mini`) y `ALLOWED_ORIGIN` igual al origen real de tu web, por ejemplo `https://TUUSUARIO.github.io`. No introduzcas estos secretos en HTML, JS, GitHub ni en la web.
4. Vuelve a la web, inicia sesión, registra la semana, abre Revisión domingo y pulsa **Revisar y planificar con entrenador IA**.
5. La IA devolverá el análisis y las sesiones sugeridas. El sistema comprueba duración, disciplinas, fechas, carga máxima, progresión semanal y síntomas. **Se muestra una vista previa y solo se guarda tras tu confirmación.**

La **suscripción ChatGPT Plus no cubre los costes de OpenAI API**, que se facturan por separado. La disponibilidad de modelos/precios puede cambiar. Este paquete se ha preparado para que la clave sea exclusivamente de servidor. La integración es opcional; no se ha desplegado ni conectado a ninguna cuenta real en esta entrega.

## 4. Lo que significa 'cada domingo'

**Ya incluido:** puedes analizar una semana y crear/ajustar la siguiente directamente en la web con un botón, con un recordatorio visible cuando la abras en domingo. El análisis por IA es opcional y se ejecuta bajo petición desde la web.

**No incluido todavía:** un proceso 100 % desatendido que se ejecute solo a una hora exacta el domingo, aunque no abras la web; un bot que lea lo que ChatGPT ha dicho en esta conversación; conexión automática a Garmin, Strava o TrainingPeaks; descarga de historial de dispositivos. Esas funciones requerirían servicios/credenciales/sincronizadores adicionales y autorización explícita.

## 5. Datos, seguridad y responsabilidad

- Los tiempos iniciales de noviembre son una **propuesta flexible** para reincorporación tras septoplastia, no una autorización médica independiente ni garantía de seguridad. Ante presión nasal persistente, sangrado o síntomas importantes, suspende el entrenamiento y solicita valoración médica.
- El sistema no genera tests máximos en el primer bloque y utiliza progresiones prudentes. Las sugerencias por reglas/IA no sustituyen a un entrenador cualificado, médico del deporte o dietista-nutricionista deportivo.
- La alimentación se muestra en rangos orientativos. La personalización de un menú completo requiere preferencias, alergias/intolerancias, valoración nutricional y seguimiento.
- La clasificación para Kona 2030 depende de la evolución deportiva y del reglamento/calendario de IRONMAN para ese año, todavía no definido. No se garantiza plaza.
- Todo el código de la interfaz es estático, sin dependencias de compilación ni frameworks remotos; la fuente de Google Fonts es opcional y utiliza fuentes del sistema cuando no está disponible.

## Estructura

```
index.html                     Entrada web
styles.css                     Diseño responsive
app.js                         Pantallas, interacciones y formularios
data.js                        Plan inicial, motor local y nutrición
cloud.js                       Integración REST Supabase opcional
manifest.webmanifest           Instalación en el móvil
sw.js                          Caché y funcionamiento tras primera carga
assets/icon.svg                Icono
supabase/schema.sql            Tabla + políticas privadas
supabase/functions/kona-coach/index.ts  IA segura de servidor
.github/workflows/pages.yml    Alternativa despliegue GitHub Actions
```

Versión inicial **1.0.0** · 13/10/2026.
