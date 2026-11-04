# Estudio de contenido

Kit gratuito para producir piezas de redes sociales (carruseles, historias, posts y Reels) con la identidad de cada marca, y alojarlas en un enlace público que Metricool pueda tomar.

## Cómo funciona

1. Cada marca vive en `marcas/<marca>/` con su `marca.json` (colores, textos de cierre, fotos y videos propios) y su carpeta `assets/`.
2. Cada pieza se describe en un archivo `piezas/<marca>/<CÓDIGO>.json`.
3. `node kit/render.js piezas/<marca>/<CÓDIGO>.json` genera los archivos en `publicaciones/<marca>/<CÓDIGO>/` y un `manifest.json` con sus URLs públicas.
4. Se hace commit y push a `main`. Las URLs `https://raw.githubusercontent.com/casaroca02/estudio-contenido/main/...` sirven como `media` en Metricool.

Preparación (una vez por sesión): `cd kit && npm install`. Requiere Node, Playwright con Chromium y ffmpeg.

## Formatos de pieza

Texto con `*palabra*` = palabra de acento (serif itálica). `\n` = salto de línea.

**Carrusel** (1080 × 1350; se agrega solo una lámina final de cierre con el código):

```json
{"marca":"cocinas-la-flora","codigo":"CLF-C01","tipo":"carrusel","laminas":[
  {"titulo":"Local a la calle vs. cocina *oculta*","texto":"Lo que pagas el primer mes →","imagen":"assets/img/wok.webp"},
  {"tipo":"dato","dato":"$1,3 M","titulo":"Tu cocina, desde","texto":"Solo el espacio."},
  {"tipo":"claro","titulo":"Qué *incluye*","texto":"2 puntos de gas, agua y electricidad."}
]}
```

Tipos de lámina: sin `tipo` = portada con foto; `dato` = cifra grande; `claro` = título y texto sobre crema; `cta` = cierre.

**Historia** (1080 × 1920) y **post** (1080 × 1350): `{"tipo":"historia","lamina":{"titulo":"…","texto":"…","imagen":"assets/img/…"}}`.

**Reel** (1080 × 1920, unos 14 s): `{"tipo":"reel","escenas":[{"titulo":"…","texto":"…","imagen":"assets/img/…","segundos":3.5}, …]}`. Cada escena admite `imagen` o `video` (con `desde`, segundo de inicio). Se agrega solo el cierre con el código. Opcional: `"musica":"marcas/<marca>/assets/audio/<archivo>"` (solo música con licencia comercial).

## Reglas

- Solo material propio de la marca o con licencia comercial. Nunca videos o fotos de otras cuentas.
- Este repositorio es público: no subir datos personales, contratos ni información privada.
