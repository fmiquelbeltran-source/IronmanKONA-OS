# KONA OS 2030 · v4 gratuita · importación de actividades

## Novedad: actividades de Intervals.icu (fuente utilizada por Domestique)

La versión v4 incorpora el apartado **Garmin / Strava**. Puedes importar un CSV de actividades de tu cuenta personal Intervals.icu. Reconoce actividades de running, ciclismo, natación, fuerza y movilidad, junto con duración, distancia, frecuencia cardíaca, potencia y carga cuando aparezcan en el archivo.

**No es una sincronización automática** y **no conecta directamente con la aplicación Windows Domestique**. Los datos se leen solamente del CSV que eliges. Domestique está especializado en ciclismo y consume datos de Intervals.icu. Por ello se recomienda empezar por esta fuente multideporte. Intervals.icu puede limitar qué datos permite obtener por API de Garmin y Strava; no prometemos que estén todos. Hay que respetar sus condiciones y exportar solo datos propios autorizados.

### Pasos de actualización de v3 a v4

1. **Antes de actualizar**: entra en Kona OS > Ajustes > Descargar copia JSON. Guarda la copia en un lugar privado, fuera de GitHub.
2. Descomprime el ZIP de esta entrega.
3. Sube el contenido de la carpeta `KonaOS2030-free-v4` a la **raíz** del repositorio público de GitHub Pages, reemplazando los archivos de v3 (y añadiendo `activity-import.js`). Haz commit.
4. Recarga la página después de que GitHub Pages publique la actualización. Si persiste la versión antigua, fuerza la recarga o cierra/reabre la pestaña.
5. Abre en Kona OS el nuevo apartado **Garmin / Strava**.
6. Desde tu cuenta Intervals.icu, descarga un CSV de tus actividades (si tu cuenta o interfaz permite la exportación). En Kona OS selecciona **Importar CSV de actividades** y elige ese archivo.
7. Comprueba las actividades y pulsa **Vincular** cuando una actividad coincida con una única sesión programada del mismo deporte y fecha. La vinculación es optativa y no modifica la descripción original de tu plan.
8. El informe de los domingos incluirá las actividades importadas, marcando cuáles están vinculadas. No debe sumar dos veces actividades importadas que ya se hayan vinculado.

### Limitaciones y seguridad

- Cero coste, ninguna API y ninguna clave. **No introduzcas ni compartas claves API de Intervals.icu, Garmin o Strava.**
- La importación no reescribe ni sustituye los registros ya existentes; añade actividades únicas por ID.
- Los datos viven en el almacenamiento local del navegador y pueden perderse si lo borras; utiliza copias JSON periódicas.
- Los números de duración del CSV se interpretan como segundos para las columnas `moving_time`, `elapsed_time` o `duration` (o texto HH:MM:SS), como en el formato API de Intervals.icu.
- La API de Intervals.icu restringe el acceso a datos de Strava y el 9 de octubre de 2026 anunció posibles restricciones futuras para Garmin. La exportación disponible depende de tu cuenta y origen.
- Esta fase **no funciona en segundo plano, no importa automáticamente mientras no abres Kona OS, ni sincroniza entre varios dispositivos**. Un puente local con permisos explícitos sería el siguiente proyecto.

# KONA OS 2030 · v3 gratuita

**Cero pagos, sin necesidad de Supabase ni OpenAI API.** Esta versión funciona en GitHub Pages y mantiene la clave de almacenamiento original `konaos2030_v1`, por lo que conserva los registros actuales del mismo navegador y dirección web. Antes de actualizar, entra en **Ajustes → Descargar copia JSON**.

## Publicación en tu GitHub

Repositorio: `fmiquelbeltran-source/IronmanKONA-OS`. Sube **todos los archivos de este ZIP descomprimido directamente a la raíz** del repositorio (no subas la carpeta ni el ZIP sin descomprimir). Usa `Add file → Upload files → Commit changes`. GitHub Pages seguirá publicado en `https://fmiquelbeltran-source.github.io/IronmanKONA-OS/`.

## Qué hace la web gratis

- **Plan semanal**: consulta y edita cada sesión, marca realizada/omitida y registra minutos, FC, vatios, RPE, hidratos, notas.
- **Diario**: horas de sueño, fatiga, HRV y síntomas.
- **Estadísticas**: volumen previsto/real por semana, adherencia, minutos por deporte, RPE. Todos los cálculos son locales.
- **Revisión domingo**: conclusiones por reglas, solo válidas para progresión con ≥70 % sesiones informadas; insuficiente recuperación documentada impide aumentar automáticamente las cargas.
- **ChatGPT**: botón «Copiar informe para ChatGPT». Pega el informe en **esta conversación**, revisamos tus datos y preparo un plan en un bloque JSON. En «Importar propuesta JSON» lo pegas, compruebas la vista previa y apruebas el cambio. El código comprueba tipo/día/duración/disponibilidad y no sobrescribe semanas con datos ya registrados.
- **Copias de seguridad**: exporta JSON cada domingo; restaura desde Ajustes en otro navegador.

## Limitaciones importantes

- **No hay conexión automática entre esta página y ChatGPT.** Debes copiar el informe, pegarlo en el chat y volver a pegar el JSON propuesto. ChatGPT Plus no proporciona API gratuita para integrar una IA sin interacción.
- **No hay revisión desatendida con la web cerrada.** Puedes añadir un recordatorio dominical desde ChatGPT; la página calcula al abrirla.
- Los datos **no se sincronizan entre dispositivos** ni se guardan en GitHub. El navegador usa localStorage. La navegación privada, borrar datos del navegador o cambiar dispositivo puede perderlos sin un JSON de respaldo.
- El repositorio público contiene código, no registros personales. **No subas el archivo JSON de respaldo, claves privadas ni datos médicos al repositorio público**. Si pegas el informe en ChatGPT, estás decidiendo compartir su contenido en esta conversación.
- Esta herramienta no sustituye valoración de medicina deportiva, entrenadores cualificados o dietista deportivo. No entrenes con molestias nasales que reaparezcan y consulta si persisten.

**Versión:** 3.0 gratuita · octubre 2026.
