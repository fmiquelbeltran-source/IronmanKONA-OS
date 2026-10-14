# KONA OS 2030 · v6 — Análisis de actividades (GRATIS)

**Novedad:** ficha individual al pulsar cualquier entrenamiento importado; gráficas por deporte; comparativas descriptivas con sesiones anteriores; resumen de entrenamiento importado por disciplina dentro de la revisión dominical. Sigue conectado al puente local de Domestique de la versión 5, sin suscripciones ni API de pago.

## Actualización de v5 a v6 (sin perder registros)

1. **OBLIGATORIO por seguridad:** en tu Kona OS actual, entra en **Ajustes → Descargar copia JSON** y guarda la copia de forma privada en tu ordenador. No la subas a GitHub.
2. Descomprime `KonaOS2030_Web_v6.zip` y sube **los archivos que hay dentro** a la raíz de tu repositorio `fmiquelbeltran-source/IronmanKONA-OS`, sustituyendo los antiguos. No subas la carpeta contenedora.
3. Espera al despliegue de GitHub Pages. Abre `https://fmiquelbeltran-source.github.io/IronmanKONA-OS/` y recarga con `Ctrl+Shift+R`. Si hay una PWA instalada, ciérrala y vuelve a abrirla para permitir la actualización del service worker.
4. Mantén Domestique y el puente local encendidos como en la v5. **No necesitas reinstalar el puente** para consultar fecha, disciplina, distancia, tiempo, FC media, vatios y carga que ya obtenías antes.
5. En **Garmin / Strava**, pulsa en el nombre de un entrenamiento o en **Detalles ↗**. Se abrirá una ficha. En **Estadísticas**, baja a «Tu laboratorio de rendimiento» para elegir deporte y ver gráficas. En **Revisión domingo**, consulta el nuevo resumen por disciplina.

## Puente opcional v6

El ZIP adicional `KonaOS2030_Puente_Windows_v6_OPCIONAL.zip` contiene el mismo puente probado de la versión 5, con una lista ampliada de campos **que se consultan únicamente si Domestique los ofrece** (cadencia, potencia normalizada, desnivel acumulado, FC máxima). Puedes sustituir la carpeta de tu puente por el nuevo, con el puente anterior cerrado. Es **opcional**; la web v6 funciona con el puente v5.

### Qué se ve en cada ficha

- Fecha, tipo, nombre y fuente de la actividad.
- Duración, distancia, frecuencia cardíaca media, ritmo de natación o carrera, velocidad de bici, potencia y carga cuando están presentes.
- Potencia normalizada, cadencia, FC máxima, desnivel si llegan a través del conector actualizado.
- Comparación **descriptiva**, no clínica ni causal, con la última actividad de la misma disciplina, e historial con enlaces a las fichas.
- Gráficas de **métricas medias por entrenamiento**, y volumen detectado por semanas. No se representan series segundo a segundo ni se atribuye valor FTP/VO₂máx que no haya sido medido.
- Resumen por disciplina en **Revisión domingo**, distinguiendo horas planificadas, horas detectadas y sesiones vinculadas para no contar dos veces.

**Aclaraciones:** el ritmo calculado con minutos redondeados es una aproximación. Si el origen no entrega vatios, TSS, cadencia u otro dato, la ficha mostrará «Sin datos» (no inventa valores). Para comparar mejoras, deben considerarse desnivel, intensidad, fatiga y tiempo.

## Privacidad y limitaciones

La app sigue utilizando exactamente la **misma clave local `konaos2030_v1`**; conserva los datos del navegador para el mismo dominio. Al exportar una copia JSON también incluyes el histórico importado, por lo que el archivo es privado. El código publicado en GitHub es público, pero **tus entrenamientos no se publican**.

El puente solo escucha en `127.0.0.1`, acepta únicamente la dirección de origen de tu Kona OS y hace peticiones de lectura. No se añaden claves API ni llamadas de pago. Los datos se actualizan mientras tengas el PC, Domestique, el puente y Kona OS abiertos. El domingo todavía necesitarás pulsar «Copiar informe para ChatGPT», pegar el texto en la conversación y aprobar el plan que te devuelva.

No cambies los nombres de los archivos de JS. No elimines tus datos del navegador antes de crear la copia JSON.

## Pruebas

- `node tests/test_domestique.mjs`
- `node tests/test_activity_v6.mjs`
- `python -m unittest discover -s tests -p test_bridge.py -v`
- `node --check app.js` y equivalentes para los módulos nuevos

Tests de unidad realizados con actividades simuladas, incluidos datos ausentes y repetidos. **La comprobación visual end-to-end en un navegador real está pendiente** porque el navegador de pruebas de este entorno ha bloqueado la navegación local (`ERR_BLOCKED_BY_ADMINISTRATOR`). Verifica primero en tu web la ficha de la salida del 12 de septiembre.

**Coste de uso de este sistema: 0 €**, dentro de los límites gratuitos de GitHub Pages y los programas que ya utilizas.
