#!/usr/bin/env node
// Estudio de contenido · renderizador gratuito de piezas para redes.
// Uso: node kit/render.js piezas/CLF-016.json
// Genera las piezas en publicaciones/<marca>/<codigo>/ y escribe manifest.json con las URLs públicas.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const REPO_RAW = 'https://raw.githubusercontent.com/casaroca02/estudio-contenido/main';
const FONTS = path.join(__dirname, 'node_modules', '@fontsource');

function fontFaces() {
  const f = (fam, dir, file, weight, style) =>
    `@font-face{font-family:"${fam}";font-weight:${weight};font-style:${style};src:url(file://${path.join(FONTS, dir, 'files', file)})}`;
  return [
    f('Archivo', 'archivo', 'archivo-latin-900-normal.woff2', 900, 'normal'),
    f('Archivo', 'archivo', 'archivo-latin-800-normal.woff2', 800, 'normal'),
    f('Instrument Serif', 'instrument-serif', 'instrument-serif-latin-400-italic.woff2', 400, 'italic'),
    f('Inter Tight', 'inter-tight', 'inter-tight-latin-500-normal.woff2', 500, 'normal'),
    f('Inter Tight', 'inter-tight', 'inter-tight-latin-700-normal.woff2', 700, 'normal'),
    f('DM Mono', 'dm-mono', 'dm-mono-latin-400-normal.woff2', 400, 'normal'),
  ].join('\n');
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// *palabra* en el texto se convierte en la palabra de acento (serif itálica)
const rich = (s = '') => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

function css(m, W, H) {
  const c = m.colores;
  return `${fontFaces()}
  html,body{margin:0;background:transparent}
  .s{width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:"Inter Tight";color:${c.fondo_claro}}
  .bg{position:absolute;inset:0;background-size:cover;background-position:center}
  .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.86) 0%,rgba(15,13,12,.45) 45%,rgba(15,13,12,.25) 65%,rgba(15,13,12,.85) 100%)}
  .lab{position:absolute;left:84px;top:${H > 1500 ? 230 : 96}px;font:400 30px "DM Mono";letter-spacing:4px;color:${c.acento}}
  h1{margin:0;font:900 var(--fs,112px)/1.0 Archivo;letter-spacing:-2px}
  h1 em,h2 em,.big em{font-family:"Instrument Serif";font-style:italic;font-weight:400;color:${c.resalte}}
  .claro h1 em,.claro h2 em,.claro .big em{color:${c.acento_texto}}
  h2{margin:0;font:800 72px/1.05 Archivo;letter-spacing:-1px}
  p{margin:0;font:500 44px/1.3 "Inter Tight"}
  .top{position:absolute;left:84px;right:84px;top:${H > 1500 ? 300 : 170}px}
  .bottom{position:absolute;left:84px;right:84px;bottom:${H > 1500 ? 420 : 110}px}
  .pg{position:absolute;right:84px;bottom:${H > 1500 ? 360 : 60}px;font:400 28px "DM Mono";opacity:.8}
  .claro{background:${c.fondo_claro};color:${c.fondo_oscuro}}
  .claro .lab{color:${c.acento_texto}}
  .acento{background:${c.acento};color:${c.fondo_oscuro}}
  .big{font:900 230px/0.95 Archivo;letter-spacing:-6px;color:${c.acento}}
  .claro .big{color:${c.acento}}
  .bar{width:140px;height:14px;background:${c.acento};margin-bottom:36px}
  .btn{display:inline-block;background:${c.fondo_oscuro};color:${c.fondo_claro};font:700 50px "Inter Tight";padding:26px 48px;border-radius:70px}
  .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:34px;padding:0 70px}
  .marca{font:800 66px Archivo}.marca em{font-family:"Instrument Serif";font-style:italic;font-weight:400;color:inherit}
  .mono{font:400 32px "DM Mono"}
  .cod{font:400 28px "DM Mono";letter-spacing:3px;opacity:.75}
  .llama{width:120px;height:170px}
  `;
}

function fileUrl(m, rel) { return 'file://' + path.join(ROOT, 'marcas', m.slug, rel); }

function llamaSvg(color) {
  return `<svg class="llama" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 C60 30 90 45 90 88 C90 118 72 140 50 140 C28 140 10 118 10 88 C10 62 28 52 34 30 C40 50 44 56 50 62 C56 46 54 20 50 0 Z" fill="${color}"/></svg>`;
}

function ctaBody(m, spec) {
  return `<div class="s acento"><div class="center">${llamaSvg(m.colores.fondo_oscuro)}
    <div class="marca">${m.marca_html}</div>
    <h1 style="--fs:${spec.cta_fs || 140}px">${rich(spec.cta || m.cta).replace(' ', '<br>')}</h1>
    <div class="btn">${esc(m.cta_boton)}</div>
    <div class="mono">${esc(m.cta_web)}</div>
    <div class="cod">Código ${esc(spec.codigo)}</div></div></div>`;
}

// Lámina: tipo portada (foto), claro (texto sobre crema), dato (cifra grande), cta
function laminaBody(m, l, i, n, H) {
  const pg = `<div class="pg">${i + 1}/${n}</div>`;
  if (l.tipo === 'cta') return ctaBody(m, l);
  if (l.tipo === 'dato') {
    return `<div class="s claro"><div class="lab">${esc(m.etiqueta)}</div>
      <div class="top"><div class="big">${rich(l.dato)}</div><div style="height:30px"></div><h2>${rich(l.titulo)}</h2></div>
      <div class="bottom"><p>${rich(l.texto)}</p></div>${pg}</div>`;
  }
  if (l.tipo === 'claro') {
    return `<div class="s claro"><div class="lab">${esc(m.etiqueta)}</div>
      <div class="top"><div class="bar"></div><h2 style="font-size:${l.fs || 84}px">${rich(l.titulo)}</h2></div>
      <div class="bottom"><p>${rich(l.texto)}</p></div>${pg}</div>`;
  }
  // portada con foto
  const img = l.imagen || m.imagenes[i % m.imagenes.length];
  return `<div class="s"><div class="bg" style="background-image:url(${fileUrl(m, img)})"></div><div class="scrim"></div>
    <div class="lab">${esc(m.etiqueta)}</div>
    <div class="top"><h1 style="--fs:${l.fs || 112}px">${rich(l.titulo)}</h1></div>
    <div class="bottom"><p>${rich(l.texto || '')}</p></div>${n > 1 ? pg : ''}</div>`;
}

// Capa de texto transparente para una escena de Reel
function escenaOverlay(m, e) {
  return `<div class="s" style="background:transparent"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.82) 0%,rgba(15,13,12,.55) 38%,rgba(15,13,12,0) 62%)"></div><div class="lab">${esc(m.etiqueta)}</div>
    <div class="top">${e.barra ? '<div class="bar"></div>' : ''}<h1 style="--fs:${e.fs || 118}px">${rich(e.titulo)}</h1>
    ${e.texto ? `<div style="height:40px"></div><p style="color:${m.colores.resalte};font-weight:700">${rich(e.texto)}</p>` : ''}</div></div>`;
}

async function shoot(browser, html, W, H, out, transparent) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  // Se escribe a un archivo local para que las fuentes y las fotos (file://) carguen
  const tmp = path.join(__dirname, `_tmp_${process.pid}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${html.css}</style></head><body>${html.body}</body></html>`);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  fs.unlinkSync(tmp);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out, omitBackground: !!transparent, type: out.endsWith('.png') ? 'png' : 'jpeg', quality: out.endsWith('.png') ? undefined : 88 });
  await page.close();
}

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }

async function main() {
  const specPath = process.argv[2];
  if (!specPath) { console.error('Uso: node kit/render.js <pieza.json>'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'marcas', spec.marca, 'marca.json'), 'utf8'));
  const outDir = path.join(ROOT, 'publicaciones', spec.marca, spec.codigo);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const files = [];
  const tipo = spec.tipo;

  if (tipo === 'carrusel' || tipo === 'post' || tipo === 'historia') {
    const W = 1080, H = tipo === 'historia' ? 1920 : 1350;
    let laminas = tipo === 'carrusel' ? spec.laminas.slice() : [spec.lamina || spec];
    if (tipo === 'carrusel' && spec.cierre !== false) laminas.push({ tipo: 'cta', codigo: spec.codigo });
    for (let i = 0; i < laminas.length; i++) {
      const l = Object.assign({ codigo: spec.codigo }, laminas[i]);
      const out = path.join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
      await shoot(browser, { css: css(m, W, H), body: laminaBody(m, l, i, laminas.length, H) }, W, H, out);
      files.push(out);
    }
  } else if (tipo === 'reel') {
    const W = 1080, H = 1920, FPS = 30;
    const parts = [];
    const escenas = spec.escenas;
    for (let i = 0; i < escenas.length; i++) {
      const e = escenas[i];
      const dur = e.segundos || 3.5;
      const ov = path.join(outDir, `_ov${i}.png`);
      await shoot(browser, { css: css(m, W, H), body: escenaOverlay(m, e) }, W, H, ov, true);
      const part = path.join(outDir, `_p${i}.mp4`);
      const frames = Math.round(dur * FPS);
      const dark = 'eq=brightness=-0.22:saturation=1.05';
      if (e.video) {
        ff(['-ss', String(e.desde || 0), '-t', String(dur), '-i', path.join(ROOT, 'marcas', m.slug, e.video), '-loop', '1', '-t', String(dur), '-i', ov,
          '-filter_complex', `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},${dark},fps=${FPS}[b];[1:v]format=rgba,fade=t=in:st=0.15:d=0.35:alpha=1[t];[b][t]overlay=0:0,format=yuv420p[v]`,
          '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-t', String(dur), part]);
      } else {
        const img = path.join(ROOT, 'marcas', m.slug, e.imagen || m.imagenes[i % m.imagenes.length]);
        const dir = i % 2 === 0 ? `x='iw/2-(iw/zoom/2)'` : `x='(iw-iw/zoom)*on/${frames}'`;
        ff(['-loop', '1', '-i', img, '-loop', '1', '-t', String(dur), '-i', ov,
          '-filter_complex', `[0:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='1+0.10*on/${frames}':${dir}:y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},${dark}[b];[1:v]format=rgba,fade=t=in:st=0.15:d=0.35:alpha=1[t];[b][t]overlay=0:0,format=yuv420p[v]`,
          '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-t', String(dur), part]);
      }
      parts.push(part);
    }
    // Cierre CTA
    const ctaPng = path.join(outDir, `_cta.jpg`);
    await shoot(browser, { css: css(m, W, H), body: ctaBody(m, spec) }, W, H, ctaPng);
    const ctaPart = path.join(outDir, `_pcta.mp4`);
    const cd = spec.cta_segundos || 3.5, cf = Math.round(cd * FPS);
    ff(['-loop', '1', '-i', ctaPng, '-filter_complex', `[0:v]scale=${W * 2}:${H * 2},zoompan=z='1+0.04*on/${cf}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${cf}:s=${W}x${H}:fps=${FPS},format=yuv420p[v]`,
      '-map', '[v]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-t', String(cd), ctaPart]);
    parts.push(ctaPart);
    const list = path.join(outDir, '_list.txt');
    fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
    const out = path.join(outDir, 'reel.mp4');
    const music = spec.musica ? path.join(ROOT, spec.musica) : null;
    if (music && fs.existsSync(music)) {
      ff(['-f', 'concat', '-safe', '0', '-i', list, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out]);
    } else {
      ff(['-f', 'concat', '-safe', '0', '-i', list, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out]);
    }
    // portada
    const cover = path.join(outDir, 'portada.jpg');
    ff(['-ss', '1.2', '-i', out, '-frames:v', '1', '-q:v', '3', cover]);
    for (const f of fs.readdirSync(outDir)) if (f.startsWith('_')) fs.unlinkSync(path.join(outDir, f));
    files.push(out, cover);
  } else {
    throw new Error('tipo desconocido: ' + tipo);
  }
  await browser.close();
  const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
  const manifest = { codigo: spec.codigo, marca: spec.marca, tipo, archivos: files.map(f => `${REPO_RAW}/${rel(f)}`) };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
