# Estudio de contenido

Kit gratuito para producir piezas de redes sociales (carruseles, historias, posts y Reels con motion graphics) con la identidad de cada marca, y alojarlas en un enlace público que Metricool pueda tomar.

## Cómo funciona

1. Cada marca vive en `marcas/<marca>/` con su `marca.json` (colores, textos de cierre, fotos, videos, voz, música y mascota) y su carpeta `assets/`.
2. Cada pieza se describe en un archivo `piezas/<marca>/<CÓDIGO>.json`.
3. `node kit/render.js piezas/<marca>/<CÓDIGO>.json` genera los archivos en `publicaciones/<marca>/<CÓDIGO>/` y un `manifest.json` con sus URLs públicas (en Reels incluye `duracion_segundos`).
4. Se hace commit y push a `main`. Las URLs `https://raw.githubusercontent.com/casaroca02/estudio-contenido/main/...` sirven como `media` en Metricool.
5. Reels con voz y música: postproducción con `vidiq_compose` (ver abajo). El kit produce el video mudo con subtítulos; vidIQ le pone la voz y la música.

Preparación (una vez por sesión): `cd kit && npm install`. Requiere Node, Playwright con Chromium y ffmpeg. Un Reel con motion graphics tarda unos 50 s en renderizar.

Ejemplos que funcionan: `piezas/_demos/DEMO-C01.json` (carrusel infográfico) y `piezas/_demos/DEMO-M01.json` (Reel en motion graphics con mascota y subtítulos).

## Formatos de pieza

Texto con `*palabra*` = palabra de acento (serif itálica). `\n` = salto de línea. `fondo`: `claro`, `oscuro` o `acento`.

### Carrusel (1080 × 1350), post (1080 × 1350) e historia (1080 × 1920)

Carrusel: `{"tipo":"carrusel","laminas":[…]}` (se agrega solo la lámina final con el código). Post e historia: `{"tipo":"post","lamina":{…}}`.

| Tipo de lámina | Campos | Uso |
|---|---|---|
| sin `tipo` (portada) | `titulo`, `texto`, `imagen` | Foto de fondo con titular |
| `dato` | `dato`, `titulo`, `texto` | Una cifra grande |
| `claro` | `titulo`, `texto` | Idea en texto |
| `barras` | `titulo`, `items:[{label, valor, texto_valor, destacado}]`, `nota` | Comparación de cifras |
| `vs` | `titulo`, `izq:{titulo, items[]}`, `der:{titulo, items[]}` | Antes/después, opción A vs B |
| `pasos` | `titulo`, `items:["Paso|detalle", …]`, `nota` | Cómo funciona, proceso |
| `checklist` | `titulo`, `items[]`, `nota` | Qué incluye, requisitos |
| `cita` | `texto`, `autor` | Solo testimonios reales y autorizados |

### Reel (1080 × 1920)

`{"tipo":"reel","escenas":[…],"subtitulos":{…},"musica":"…"}`. Se agrega solo el cierre con el CTA y el código.

Escena con foto o video propio: `{"titulo","texto","imagen" o "video" (+ "desde"),"segundos"}`.

Escena de motion graphic: lleva `modo` (y `segundos`, por defecto 4):

| `modo` | Campos | Efecto |
|---|---|---|
| `kinetic` | `titulo`, `texto`, `imagen` opcional | Tipografía cinética palabra por palabra |
| `contador` | `antes`, `valor` (número), `prefijo`, `sufijo`, `titulo`, `texto` | Cifra que cuenta desde 0 |
| `barras` | igual que la lámina; cada item con `valor`, `prefijo`, `sufijo` | Barras que crecen con cifras que cuentan |
| `vs`, `pasos`, `checklist`, `cita` | igual que la lámina | Entradas animadas en secuencia |
| `llama` | `titulo`, `texto` | La mascota de la marca habla en un globo |

`subtitulos` (para Reels con voz en off): `{"texto": "<guion exacto de la voz>", "inicio": 0.3, "duracion": <segundos de la voz>}`. Quedan quemados en el video, a salvo de la interfaz de Instagram.

`musica` (opcional, archivo local con licencia): `"marcas/<marca>/assets/audio/<archivo>"`. Normalmente la música se pone en la postproducción.

## Postproducción de audio (voz + música)

1. Voz en off: ElevenLabs `creative_generate_speech` (modelo `eleven_v4`, 1 toma) con la voz de `audio.voces` que indique `audio.voces.regla` (masculina = mentor; femenina = historia del emprendedor), y la `direccion` al inicio del guion. La URL `content_url` sirve directo en `vidiq_compose` (caduca en unas 2 horas: mezclar enseguida). Si ElevenLabs está ocupado, reintentar 1 vez a los 2 minutos; si sigue, `vidiq_voiceover_generate` con `respaldo_vidiq`. Guion de 25–35 palabras para un Reel de 14–18 s.
2. Render del kit con `subtitulos` = el guion exacto y la duración real de la voz.
3. `vidiq_compose`: `format: "vertical"`, una escena `video` con la URL raw del `reel.mp4` y `duration` = `duracion_segundos` del manifest; `voiceover.audioUrl` = URL de la voz (`startAtSeconds` 0.3); `music.audioUrl` = una pista de `audio.musica` con los valores de `audio.mezcla`.
4. La URL que devuelve vidIQ caduca en 12 horas: se programa en Metricool en la misma corrida (Metricool la copia a su servidor).

## Reglas

- Solo material propio de la marca, generado por nuestras herramientas o con licencia comercial. Nunca videos, fotos ni música de otras cuentas.
- Nunca cifras, testimonios ni clientes inventados. Las cifras salen de la página de la marca en Notion.
- La voz sintética y la mascota son contenido generado con IA: se declara en Metricool (isAiGenerated / isAigc).
- Este repositorio es público: no subir datos personales, contratos ni información privada.
