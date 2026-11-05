#!/usr/bin/env node
// Estudio de contenido · renderizador gratuito de piezas para redes.
// Uso: node kit/render.js piezas/<marca>/<CODIGO>.json
// Genera las piezas en publicaciones/<marca>/<codigo>/ y escribe manifest.json con las URLs públicas.
//
// Formatos: carrusel · post · historia (imágenes) y reel (video 9:16).
// Láminas estáticas: portada (foto) · claro · dato · barras · vs · pasos · checklist · cita · cta
// Escenas de Reel: foto o video propio con texto, o motion graphic (campo "modo"):
//   kinetic · contador · barras · vs · pasos · checklist · llama (mascota de marca que habla)
// Subtítulos quemados opcionales ("subtitulos") sincronizados con una voz en off.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const REPO_RAW = 'https://raw.githubusercontent.com/casaroca02/estudio-contenido/main';
const FONTS = path.join(__dirname, 'node_modules', '@fontsource');
const FPS = 30;

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

// Palabras animadas una por una, respetando *acentos* y saltos de línea
function kineticWords(s = '', start = 0, step = 0.16) {
  const out = []; let i = 0;
  String(s).split(/(\*[^*]+\*|\n)/).forEach(seg => {
    if (!seg) return;
    if (seg === '\n') { out.push('<br>'); return; }
    const acc = seg.startsWith('*') && seg.endsWith('*');
    const txt = acc ? seg.slice(1, -1) : seg;
    txt.split(/(\s+)/).forEach(w => {
      if (!w) return;
      if (/^\s+$/.test(w)) { out.push(' '); return; }
      const inner = acc ? `<em>${esc(w)}</em>` : esc(w);
      out.push(`<span class="a-word" style="animation-delay:${(start + i * step).toFixed(2)}s">${inner}</span>`);
      i++;
    });
  });
  return { html: out.join(''), end: start + i * step };
}

function css(m, W, H) {
  const c = m.colores;
  const tall = H > 1500;
  return `${fontFaces()}
  html,body{margin:0;background:transparent}
  *{box-sizing:border-box}
  .s{width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:"Inter Tight";color:${c.fondo_claro};background:${c.fondo_oscuro}}
  .bg{position:absolute;inset:0;background-size:cover;background-position:center}
  .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.86) 0%,rgba(15,13,12,.45) 45%,rgba(15,13,12,.25) 65%,rgba(15,13,12,.85) 100%)}
  .scrim2{position:absolute;inset:0;background:rgba(15,13,12,.72)}
  .lab{position:absolute;left:84px;top:${tall ? 230 : 96}px;font:400 30px "DM Mono";letter-spacing:4px;color:${c.acento}}
  h1{margin:0;font:900 var(--fs,112px)/1.0 Archivo;letter-spacing:-2px}
  h1 em,h2 em,.big em,.q em{font-family:"Instrument Serif";font-style:italic;font-weight:400;color:${c.resalte}}
  .claro h1 em,.claro h2 em,.claro .big em,.claro .q em{color:${c.acento_texto}}
  .acento h1 em,.acento h2 em{color:${c.fondo_claro}}
  h2{margin:0;font:800 var(--fs,72px)/1.05 Archivo;letter-spacing:-1px}
  p{margin:0;font:500 44px/1.3 "Inter Tight"}
  .top{position:absolute;left:84px;right:84px;top:${tall ? 300 : 170}px}
  .bottom{position:absolute;left:84px;right:84px;bottom:${tall ? 420 : 110}px}
  .mid{position:absolute;left:84px;right:84px;top:${tall ? 700 : 470}px}
  .pg{position:absolute;right:84px;bottom:${tall ? 360 : 60}px;font:400 28px "DM Mono";opacity:.8}
  .claro{background:${c.fondo_claro};color:${c.fondo_oscuro}}
  .claro .lab{color:${c.acento_texto}}
  .acento{background:${c.acento};color:${c.fondo_oscuro}}
  .acento .lab{color:${c.fondo_oscuro}}
  .big{font:900 230px/0.95 Archivo;letter-spacing:-6px;color:${c.acento}}
  .bar{width:140px;height:14px;background:${c.acento};margin-bottom:36px}
  .acento .bar{background:${c.fondo_oscuro}}
  .btn{display:inline-block;background:${c.fondo_oscuro};color:${c.fondo_claro};font:700 50px "Inter Tight";padding:26px 48px;border-radius:70px}
  .center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:34px;padding:0 70px}
  .marca{font:800 66px Archivo}.marca em{font-family:"Instrument Serif";font-style:italic;font-weight:400;color:inherit}
  .mono{font:400 32px "DM Mono"}
  .cod{font:400 28px "DM Mono";letter-spacing:3px;opacity:.75}
  .llama{width:120px;height:170px}
  /* Infografías */
  .rows{display:flex;flex-direction:column;gap:${tall ? 54 : 40}px}
  .rl{font:700 40px "Inter Tight";margin-bottom:14px}
  .track{height:${tall ? 96 : 82}px;border-radius:18px;background:rgba(127,117,105,.16);overflow:hidden}
  .fill{height:100%;border-radius:18px;display:flex;align-items:center;justify-content:flex-end;padding:0 28px;font:900 46px Archivo;color:${c.fondo_claro};background:#6E655B;min-width:230px}
  .fill.hi{background:${c.acento};color:${c.fondo_oscuro}}
  .vs{display:grid;grid-template-columns:1fr 1fr;gap:28px}
  .col{border-radius:28px;padding:44px 36px;min-height:${tall ? 820 : 640}px}
  .col.a{background:${c.arena};color:${c.fondo_oscuro}}
  .col.b{background:${c.fondo_oscuro};color:${c.fondo_claro}}
  .claro .col.b{background:${c.fondo_oscuro}}
  .s:not(.claro):not(.acento) .col.a{background:#2A2522;color:${c.fondo_claro}}
  .s:not(.claro):not(.acento) .col.b{background:${c.acento};color:${c.fondo_oscuro}}
  .col h3{margin:0 0 30px;font:900 52px/1 Archivo}
  .col .it{display:flex;gap:16px;font:500 40px/1.25 "Inter Tight";margin-bottom:26px}
  .col .ic{font:700 36px "Inter Tight";flex:none;width:40px}
  .col.a .ic{color:#9A8F83}.col.b .ic{color:${c.acento}}
  .s:not(.claro):not(.acento) .col.b .ic{color:${c.fondo_oscuro}}
  .step{display:flex;gap:34px;align-items:flex-start;margin-bottom:${tall ? 60 : 44}px}
  .num{font:400 76px/1 "DM Mono";color:${c.acento};flex:none;width:110px}
  .claro .num{color:${c.acento_texto}}
  .acento .num{color:${c.fondo_oscuro}}
  .stx{font:700 54px/1.2 "Inter Tight";padding-top:8px}
  .stx small{display:block;font:500 38px/1.3 "Inter Tight";opacity:.75;margin-top:8px}
  .chk{display:flex;gap:30px;align-items:center;margin-bottom:${tall ? 54 : 44}px;font:700 56px/1.2 "Inter Tight"}
  .tick{flex:none;width:78px;height:78px;border-radius:50%;background:${c.acento};color:${c.fondo_oscuro};display:flex;align-items:center;justify-content:center;font:900 44px Archivo}
  .acento .tick{background:${c.fondo_oscuro};color:${c.acento}}
  .qm{font:400 300px/0.6 "Instrument Serif";color:${c.acento};height:150px}
  .q{font:800 64px/1.15 Archivo;letter-spacing:-1px}
  .qa{font:400 32px "DM Mono";margin-top:44px;opacity:.8}
  .nota{font:400 28px/1.4 "DM Mono";opacity:.75}
  /* Motion graphics (se controlan cuadro a cuadro con seek(t)) */
  .a-up,.a-word,.a-pop,.a-grow,.a-fade,.a-left,.a-right,.a-zoom,.a-bob,.a-talk,.a-glow{animation-play-state:paused!important;animation-fill-mode:both}
  .a-up{animation:kUp .6s cubic-bezier(.2,.8,.2,1) both}
  .a-word{display:inline-block;animation:kWord .45s cubic-bezier(.2,.9,.25,1.2) both}
  .a-pop{animation:kPop .55s cubic-bezier(.2,.9,.3,1.3) both}
  .a-fade{animation:kFade .5s ease both}
  .a-left{animation:kLeft .65s cubic-bezier(.2,.8,.2,1) both}
  .a-right{animation:kRight .65s cubic-bezier(.2,.8,.2,1) both}
  .a-grow{animation:kGrow 1.1s cubic-bezier(.25,.8,.25,1) both}
  .a-zoom{animation:kZoom 12s linear both}
  .a-bob{animation:kBob 1.2s ease-in-out infinite alternate}
  .a-talk{transform-origin:50% 0;animation:kTalk .22s ease-in-out infinite alternate}
  .a-glow{animation:kGlow 6s ease-in-out infinite alternate}
  @keyframes kUp{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
  @keyframes kWord{from{opacity:0;transform:translateY(40px) scale(.9)}to{opacity:1;transform:none}}
  @keyframes kPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
  @keyframes kFade{from{opacity:0}to{opacity:1}}
  @keyframes kLeft{from{opacity:0;transform:translateX(-120px)}to{opacity:1;transform:none}}
  @keyframes kRight{from{opacity:0;transform:translateX(120px)}to{opacity:1;transform:none}}
  @keyframes kGrow{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
  @keyframes kZoom{from{transform:scale(1)}to{transform:scale(1.18)}}
  @keyframes kBob{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-26px) rotate(2deg)}}
  @keyframes kTalk{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
  @keyframes kGlow{from{transform:translate(-120px,-60px) scale(1)}to{transform:translate(160px,120px) scale(1.25)}}
  .glow{position:absolute;width:900px;height:900px;border-radius:50%;left:90px;top:${tall ? 520 : 200}px;background:radial-gradient(circle,rgba(255,91,53,.34) 0%,rgba(255,91,53,0) 65%)}
  .claro .glow{background:radial-gradient(circle,rgba(255,91,53,.18) 0%,rgba(255,91,53,0) 65%)}
  .acento .glow{background:radial-gradient(circle,rgba(255,216,77,.45) 0%,rgba(255,216,77,0) 65%)}
  .bubble{position:absolute;left:70px;right:70px;top:300px;background:${c.fondo_claro};color:${c.fondo_oscuro};border-radius:44px;padding:56px 56px}
  .bubble:after{content:"";position:absolute;left:50%;bottom:-46px;margin-left:-40px;border:40px solid transparent;border-top-color:${c.fondo_claro};border-bottom:0}
  .bubble h2 em{color:${c.acento_texto}}
  .mascota{position:absolute;left:50%;margin-left:-180px;bottom:690px;width:360px;height:514px}
  .pj{position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:${W - 60}px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 9%);mask-image:linear-gradient(180deg,transparent 0,#000 9%)}
  .pj img{width:100%;display:block}
  .pjesc{position:absolute;inset:0;background-size:cover;background-position:center top}
  .pjscrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.80) 0%,rgba(15,13,12,.35) 34%,rgba(15,13,12,0) 55%)}
  .globo{position:absolute;left:70px;right:70px;top:${tall ? 300 : 150}px;background:${c.fondo_oscuro};color:${c.fondo_claro};border-radius:44px;padding:50px 54px}
  .globo:after{content:"";position:absolute;left:58%;bottom:-44px;border:44px solid transparent;border-top-color:${c.fondo_oscuro};border-bottom:0}
  .globo.abajo{top:auto;bottom:${tall ? 640 : 120}px}
  .globo.abajo:after{bottom:auto;top:-44px;border:44px solid transparent;border-bottom-color:${c.fondo_oscuro};border-top:0}
  .pjblur{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(40px) brightness(.55)}
  .pjancho{position:absolute;left:0;right:0;top:${tall ? 400 : 200}px}
  .pjancho img{width:100%;display:block}
  .globo h2 em{color:${c.resalte}}
  .globo .quien{font:400 28px "DM Mono";letter-spacing:3px;color:${c.acento};margin-bottom:18px;display:flex;align-items:center;gap:16px}
  .ondas{display:inline-flex;gap:6px;align-items:center;height:30px}
  .ondas i{display:block;width:6px;height:30px;border-radius:3px;background:${c.acento};transform-origin:50% 50%}
  .a-onda{animation:kOnda .5s ease-in-out infinite alternate;animation-play-state:paused!important;animation-fill-mode:both}
  .a-resp{animation:kResp 2.6s ease-in-out infinite alternate;animation-play-state:paused!important;animation-fill-mode:both}
  @keyframes kOnda{from{transform:scaleY(.2)}to{transform:scaleY(1)}}
  @keyframes kResp{from{transform:translateX(-50%) translateY(0) scale(1)}to{transform:translateX(-50%) translateY(-12px) scale(1.012)}}
  .fade-baja{position:absolute;left:0;right:0;bottom:0;height:${tall ? 900 : 620}px;background:linear-gradient(180deg,rgba(15,13,12,0) 0%,rgba(15,13,12,.55) 100%)}
  .limpia{position:absolute;left:64px;right:64px;bottom:${tall ? 400 : 90}px;background:${c.fondo_claro};color:${c.fondo_oscuro};border-radius:32px;padding:40px 46px}
  .limpia .et{font:400 26px "DM Mono";letter-spacing:4px;color:${c.acento_texto};margin-bottom:14px}
  .limpia h2{font-size:var(--fs,64px)}
  .limpia h2 em{color:${c.acento_texto}}
  .limpia p{font-size:36px;margin-top:14px;opacity:.85}
  .sub{position:absolute;left:70px;right:70px;bottom:520px;display:flex;justify-content:center}
  .sub span{background:${c.fondo_oscuro};color:${c.fondo_claro};font:800 58px/1.18 Archivo;padding:18px 30px;border-radius:20px;text-align:center;box-shadow:0 0 0 6px ${c.acento}}
  `;
}

function fileUrl(m, rel) { return 'file://' + path.join(ROOT, 'marcas', m.slug, rel); }

function llamaSvg(color) {
  return `<svg class="llama" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 C60 30 90 45 90 88 C90 118 72 140 50 140 C28 140 10 118 10 88 C10 62 28 52 34 30 C40 50 44 56 50 62 C56 46 54 20 50 0 Z" fill="${color}"/></svg>`;
}

// Mascota de marca: la llama del logo con ojos y boca que "habla"
function mascotaSvg(m) {
  const c = m.colores;
  return `<div class="mascota a-bob"><svg viewBox="0 0 100 140" width="360" height="514" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0 C60 30 90 45 90 88 C90 118 72 140 50 140 C28 140 10 118 10 88 C10 62 28 52 34 30 C40 50 44 56 50 62 C56 46 54 20 50 0 Z" fill="${c.acento}"/>
    <path d="M50 52 C56 70 74 78 74 100 C74 118 63 128 50 128 C37 128 26 118 26 100 C26 86 36 80 40 70 C44 80 47 84 50 86 Z" fill="${c.resalte}" opacity=".9"/>
    <circle cx="40" cy="96" r="5.5" fill="${c.fondo_oscuro}"/><circle cx="60" cy="96" r="5.5" fill="${c.fondo_oscuro}"/>
    <circle cx="41.6" cy="94.4" r="1.6" fill="#fff"/><circle cx="61.6" cy="94.4" r="1.6" fill="#fff"/>
    <g transform="translate(50 108)"><ellipse class="a-talk" cx="0" cy="0" rx="8" ry="6" fill="${c.fondo_oscuro}"/></g>
  </svg></div>`;
}

function ctaBody(m, spec) {
  return `<div class="s acento"><div class="center">${llamaSvg(m.colores.fondo_oscuro)}
    <div class="marca">${m.marca_html}</div>
    <h1 style="--fs:${spec.cta_fs || 140}px">${rich(spec.cta || m.cta).replace(' ', '<br>')}</h1>
    <div class="btn">${esc(m.cta_boton)}</div>
    <div class="mono">${esc(m.cta_web)}</div>
    <div class="cod">Código ${esc(spec.codigo)}</div></div></div>`;
}

// ---------- Piezas de infografía (sirven en estático y en movimiento) ----------
// anim = false → estático; anim = número → segundo de inicio de las animaciones
function A(anim, cls, delay) { return anim === false ? '' : ` ${cls}" style="animation-delay:${(anim + delay).toFixed(2)}s`; }
function cnt(anim, l, txt, delay) {
  // Cifra que cuenta desde 0 si se da "valor" numérico
  if (anim === false || l.valor === undefined) return esc(txt);
  const dec = l.decimales ?? (String(l.valor).includes('.') ? String(l.valor).split('.')[1].length : 0);
  return `<span class="cnt" data-to="${l.valor}" data-dec="${dec}" data-start="${anim + delay}" data-dur="1.2" data-pre="${esc(l.prefijo || '')}" data-suf="${esc(l.sufijo || '')}">${esc(txt)}</span>`;
}

function headBlock(l, anim, fs = 76) {
  const t = anim === false ? rich(l.titulo) : kineticWords(l.titulo, anim, 0.12).html;
  return `<div class="bar${anim === false ? '' : ' a-left" style="animation-delay:' + anim + 's'}"></div><h2 style="--fs:${l.fs || fs}px">${t}</h2>`;
}

function infoBody(m, l, H, anim) {
  const tall = H > 1500;
  const nota = l.nota || l.texto ? `<div class="bottom"><p class="nota${A(anim, 'a-fade', 2.2)}">${rich(l.nota || l.texto)}</p></div>` : '';
  if (l.tipo === 'barras' || l.modo === 'barras') {
    const max = Math.max(...l.items.map(x => Number(x.valor) || 0), 1);
    const rows = l.items.map((x, j) => {
      const pct = Math.max(22, Math.round(100 * (Number(x.valor) || 0) / max));
      return `<div><div class="rl${A(anim, 'a-fade', 0.5 + j * 0.35)}">${rich(x.label)}</div>
        <div class="track"><div class="fill${x.destacado ? ' hi' : ''}${anim === false ? '' : ' a-grow'}" style="width:${pct}%${anim === false ? '' : ';animation-delay:' + (anim + 0.6 + j * 0.35).toFixed(2) + 's'}">${cnt(anim, x, x.texto_valor || x.valor, 0.6 + j * 0.35)}</div></div></div>`;
    }).join('');
    return `<div class="top">${headBlock(l, anim)}</div><div class="mid" style="top:${tall ? 720 : 480}px"><div class="rows">${rows}</div></div>${nota}`;
  }
  if (l.tipo === 'vs' || l.modo === 'vs') {
    const col = (k, side, d) => `<div class="col ${k}${A(anim, side === 'a' ? 'a-left' : 'a-right', d)}"><h3>${rich(l[side === 'a' ? 'izq' : 'der'].titulo)}</h3>
      ${l[side === 'a' ? 'izq' : 'der'].items.map((x, j) => `<div class="it${A(anim, 'a-fade', d + 0.3 + j * 0.25)}"><span class="ic">${side === 'a' ? '✕' : '✓'}</span><span>${rich(x)}</span></div>`).join('')}</div>`;
    return `<div class="top">${headBlock(l, anim, 70)}</div><div class="mid" style="top:${tall ? 640 : 430}px"><div class="vs">${col('a', 'a', 0.5)}${col('b', 'b', 1.0)}</div></div>`;
  }
  if (l.tipo === 'pasos' || l.modo === 'pasos') {
    const st = l.items.map((x, j) => {
      const [t, sub] = String(x).split('|');
      return `<div class="step${A(anim, 'a-up', 0.6 + j * 0.45)}"><div class="num">${String(j + 1).padStart(2, '0')}</div><div class="stx">${rich(t)}${sub ? `<small>${rich(sub)}</small>` : ''}</div></div>`;
    }).join('');
    return `<div class="top">${headBlock(l, anim)}</div><div class="mid" style="top:${tall ? 680 : 450}px">${st}</div>${nota}`;
  }
  if (l.tipo === 'checklist' || l.modo === 'checklist') {
    const it = l.items.map((x, j) => `<div class="chk${A(anim, 'a-up', 0.6 + j * 0.35)}"><div class="tick">✓</div><div>${rich(x)}</div></div>`).join('');
    return `<div class="top">${headBlock(l, anim)}</div><div class="mid" style="top:${tall ? 680 : 450}px">${it}</div>${nota}`;
  }
  if (l.tipo === 'cita' || l.modo === 'cita') {
    return `<div class="mid" style="top:${tall ? 520 : 260}px"><div class="qm${A(anim, 'a-pop', 0)}">“</div>
      <div class="q">${anim === false ? rich(l.texto) : kineticWords(l.texto, anim + 0.3, 0.09).html}</div>
      <div class="qa${A(anim, 'a-fade', 1.6)}">${esc(l.autor || '')}</div></div>`;
  }
  return null;
}

function fondoClase(l, def) {
  const f = l.fondo || def;
  return f === 'claro' ? 'claro' : f === 'acento' ? 'acento' : '';
}

// Lámina estática
function laminaBody(m, l, i, n, H) {
  const pg = n > 1 ? `<div class="pg">${i + 1}/${n}</div>` : '';
  const lab = `<div class="lab">${esc(m.etiqueta)}</div>`;
  if (l.tipo === 'cta') return ctaBody(m, l);
  const info = infoBody(m, l, H, false);
  if (info) return `<div class="s ${fondoClase(l, 'claro')}">${lab}${info}${pg}</div>`;
  if (l.tipo === 'foto') {
    const img = l.imagen || m.imagenes[i % m.imagenes.length];
    return `<div class="s"><div class="bg" style="background-image:url(${fileUrl(m, img)})"></div>${limpiaCard(m, l, false)}${pg}</div>`;
  }
  if (l.tipo === 'personaje') {
    const r = personajeBody(m, l, H, false);
    return `<div class="s ${r.cls}">${r.html}${lab}${pg}</div>`;
  }
  if (l.tipo === 'dato') {
    return `<div class="s ${fondoClase(l, 'claro')}">${lab}
      <div class="top"><div class="big">${rich(l.dato)}</div><div style="height:30px"></div><h2>${rich(l.titulo)}</h2></div>
      <div class="bottom"><p>${rich(l.texto)}</p></div>${pg}</div>`;
  }
  if (l.tipo === 'claro') {
    return `<div class="s ${fondoClase(l, 'claro')}">${lab}
      <div class="top"><div class="bar"></div><h2 style="--fs:${l.fs || 84}px">${rich(l.titulo)}</h2></div>
      <div class="bottom"><p>${rich(l.texto)}</p></div>${pg}</div>`;
  }
  // portada con foto
  const img = l.imagen || m.imagenes[i % m.imagenes.length];
  return `<div class="s"><div class="bg" style="background-image:url(${fileUrl(m, img)})"></div><div class="scrim"></div>
    ${lab}
    <div class="top"><h1 style="--fs:${l.fs || 112}px">${rich(l.titulo)}</h1></div>
    <div class="bottom"><p>${rich(l.texto || '')}</p></div>${pg}</div>`;
}

// Tarjeta limpia sobre foto: la foto manda, el texto va corto en una tarjeta crema
function limpiaCard(m, l, anim) {
  const t = anim === false ? rich(l.titulo) : kineticWords(l.titulo, anim + 0.3, 0.12).html;
  return `<div class="fade-baja"></div><div class="limpia${anim === false ? '' : ' a-up" style="animation-delay:' + anim + 's'}">
    <div class="et">${esc(l.etiqueta || m.etiqueta)}</div><h2 style="--fs:${l.fs || 64}px">${t}</h2>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}</div>`;
}

// Personaje de marca (Chef Andrés, la emprendedora) con globo de diálogo
function personajeBody(m, e, H, anim) {
  const pj = (m.personajes || {})[e.personaje];
  if (!pj) throw new Error('personaje desconocido: ' + e.personaje);
  const pose = pj.poses[e.pose] || Object.values(pj.poses)[0];
  if (!fs.existsSync(path.join(ROOT, 'marcas', m.slug, pose.archivo))) throw new Error('falta la imagen del personaje: ' + pose.archivo);
  const t = anim === false ? rich(e.titulo) : kineticWords(e.titulo, anim + 0.5, 0.13).html;
  const ondas = anim === false ? '' : `<span class="ondas">${[0, .12, .24, .08, .18].map(d => `<i class="a-onda" style="animation-delay:${d}s"></i>`).join('')}</span>`;
  const abajo = pose.tipo === 'escena' || pose.tipo === 'ancho';
  const globo = `<div class="globo${abajo ? ' abajo' : ''}${anim === false ? '' : ' a-pop" style="animation-delay:' + (anim + 0.2) + 's'}"><div class="quien">${esc((pj.nombre || '').toUpperCase())}${ondas}</div>
    <h2 style="--fs:${e.fs || 70}px">${t}</h2>${e.texto ? `<p style="margin-top:22px;font-size:40px;color:${m.colores.arena}">${rich(e.texto)}</p>` : ''}</div>`;
  if (pose.tipo === 'ancho') {
    const u = fileUrl(m, pose.archivo);
    return { cls: '', html: `<div class="pjblur" style="background-image:url(${u})"></div><div class="pjancho${anim === false ? '' : ' a-fade'}"><img src="${u}"></div>${globo}` };
  }
  if (pose.tipo === 'escena') {
    return { cls: '', html: `<div class="pjesc${anim === false ? '' : ' a-zoom'}" style="background-image:url(${fileUrl(m, pose.archivo)})"></div><div class="pjscrim"></div>${globo}` };
  }
  return { cls: 'claro', html: `<div class="pj${anim === false ? '' : ' a-resp'}"><img src="${fileUrl(m, pose.archivo)}"></div>${globo}` };
}

// Escena de motion graphic (Reel)
function motionBody(m, e, H) {
  const lab = `<div class="lab a-fade" style="animation-delay:0s">${esc(m.etiqueta)}</div>`;
  const bgImg = e.imagen ? `<div class="bg a-zoom" style="background-image:url(${fileUrl(m, e.imagen)})"></div><div class="scrim2"></div>` : '';
  const glow = `<div class="glow a-glow"></div>`;
  const def = e.modo === 'llama' ? 'oscuro' : (e.modo === 'kinetic' || e.modo === 'contador') ? 'oscuro' : 'claro';
  const cls = e.imagen ? '' : fondoClase(e, def);
  let inner;
  if (e.modo === 'kinetic') {
    const k = kineticWords(e.titulo, 0.2, 0.16);
    inner = `<div class="top" style="top:${H > 1500 ? 520 : 300}px"><h1 style="--fs:${e.fs || 130}px">${k.html}</h1>
      ${e.texto ? `<div style="height:50px"></div><p class="a-up" style="animation-delay:${(k.end + 0.2).toFixed(2)}s;color:${cls ? 'inherit' : m.colores.resalte};font-weight:700">${rich(e.texto)}</p>` : ''}</div>`;
  } else if (e.modo === 'contador') {
    const txt = `${e.prefijo || ''}${e.valor}${e.sufijo || ''}`;
    inner = `<div class="top" style="top:${H > 1500 ? 470 : 260}px">
      ${e.antes ? `<h2 class="a-up" style="animation-delay:.1s;--fs:64px">${rich(e.antes)}</h2><div style="height:20px"></div>` : ''}
      <div class="big a-pop" style="animation-delay:.3s;font-size:${e.fs || 250}px">${cnt(0, e, txt, 0.3)}</div>
      <div style="height:40px"></div><h2 class="a-up" style="animation-delay:1.4s">${rich(e.titulo || '')}</h2>
      ${e.texto ? `<div style="height:30px"></div><p class="a-up" style="animation-delay:1.8s">${rich(e.texto)}</p>` : ''}</div>`;
  } else if (e.modo === 'personaje') {
    const r = personajeBody(m, e, H, 0);
    return `<div class="s ${r.cls}">${r.html}<div class="lab a-fade" style="animation-delay:0s">${esc(m.etiqueta)}</div></div>`;
  } else if (e.modo === 'llama') {
    const k = kineticWords(e.titulo, 0.5, 0.14);
    inner = `<div class="bubble a-pop" style="animation-delay:.2s"><h2 style="--fs:${e.fs || 74}px">${k.html}</h2>
      ${e.texto ? `<p class="a-fade" style="animation-delay:${(k.end + 0.2).toFixed(2)}s;margin-top:24px;font-size:40px">${rich(e.texto)}</p>` : ''}</div>${mascotaSvg(m)}`;
  } else {
    inner = infoBody(m, e, H, 0.1);
    if (!inner) throw new Error('modo de escena desconocido: ' + e.modo);
  }
  return `<div class="s ${cls}">${bgImg}${glow}${lab}${inner}</div>`;
}

// Script de control de tiempo: seek(t) fija cada animación y cada contador en el segundo t
const SEEK_JS = `window.seek=function(t){
  document.getAnimations().forEach(function(a){a.currentTime=t*1000});
  document.querySelectorAll('.cnt').forEach(function(el){
    var s=+el.dataset.start,d=+el.dataset.dur,to=+el.dataset.to,dec=+el.dataset.dec;
    var p=Math.min(1,Math.max(0,(t-s)/d));p=1-Math.pow(1-p,3);
    var v=(to*p).toFixed(dec).replace('.',',');
    if(dec===0){v=Math.round(to*p).toLocaleString('es-CO')}
    el.textContent=el.dataset.pre+v+el.dataset.suf;
  });
};`;

async function openPage(browser, html, W, H) {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  // Se escribe a un archivo local para que las fuentes y las fotos (file://) carguen
  const tmp = path.join(__dirname, `_tmp_${process.pid}_${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmp, `<!doctype html><html><head><meta charset="utf-8"><style>${html.css}</style><script>${SEEK_JS}</script></head><body>${html.body}</body></html>`);
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  fs.unlinkSync(tmp);
  await page.waitForTimeout(200);
  return page;
}

async function shoot(browser, html, W, H, out, transparent) {
  const page = await openPage(browser, html, W, H);
  await page.screenshot({ path: out, omitBackground: !!transparent, type: out.endsWith('.png') ? 'png' : 'jpeg', quality: out.endsWith('.png') ? undefined : 88 });
  await page.close();
}

// Graba una escena animada cuadro a cuadro y la convierte en mp4
async function recordMotion(browser, html, W, H, dur, out) {
  const page = await openPage(browser, html, W, H);
  const dir = out + '_frames';
  fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(dur * FPS);
  for (let f = 0; f < n; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    await page.screenshot({ path: path.join(dir, `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 86 });
  }
  await page.close();
  ff(['-framerate', String(FPS), '-i', path.join(dir, '%05d.jpg'), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', out]);
  fs.rmSync(dir, { recursive: true, force: true });
}

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }

// Divide el guion de la voz en bloques cortos con tiempos proporcionales a su largo
function subtitleChunks(sub) {
  const words = String(sub.texto).replace(/\s+/g, ' ').trim().split(' ');
  const chunks = []; let cur = [];
  for (const w of words) {
    cur.push(w);
    const len = cur.join(' ').length;
    if (len >= (sub.max_caracteres || 22) || /[.,;:?!]$/.test(w)) { chunks.push(cur.join(' ')); cur = []; }
  }
  if (cur.length) chunks.push(cur.join(' '));
  const total = chunks.reduce((a, c) => a + c.length, 0);
  let t = sub.inicio || 0; const dur = sub.duracion;
  return chunks.map(c => { const d = dur * c.length / total; const r = { texto: c, a: t, b: t + d }; t += d; return r; });
}

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
  } else if (tipo === 'capas') {
    // Capas transparentes para montar en vidiq_compose sobre fotos o videos de stock
    const W = 1080, H = 1920;
    spec._escenas = [];
    for (let i = 0; i < spec.escenas.length; i++) {
      const e = spec.escenas[i];
      const out = path.join(outDir, `capa_${String(i + 1).padStart(2, '0')}.png`);
      await shoot(browser, { css: css(m, W, H), body: `<div class="s" style="background:transparent">${limpiaCard(m, e, false)}</div>` }, W, H, out, true);
      files.push(out);
      spec._escenas.push({ segundos: e.segundos || 3.5, fuente: e.fuente || null, capa: out });
    }
    const cta = path.join(outDir, 'cierre.jpg');
    await shoot(browser, { css: css(m, W, H), body: ctaBody(m, spec) }, W, H, cta);
    files.push(cta);
    spec._escenas.push({ segundos: spec.cta_segundos || 3, fuente: 'cierre', capa: null });
  } else if (tipo === 'reel') {
    const W = 1080, H = 1920;
    const parts = [];
    const escenas = spec.escenas;
    for (let i = 0; i < escenas.length; i++) {
      const e = escenas[i];
      const part = path.join(outDir, `_p${i}.mp4`);
      if (e.modo) {
        await recordMotion(browser, { css: css(m, W, H), body: motionBody(m, e, H) }, W, H, e.segundos || 4, part);
        parts.push(part);
        continue;
      }
      const dur = e.segundos || 3.5;
      const ov = path.join(outDir, `_ov${i}.png`);
      const ovBody = `<div class="s" style="background:transparent"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.82) 0%,rgba(15,13,12,.55) 38%,rgba(15,13,12,0) 62%)"></div><div class="lab">${esc(m.etiqueta)}</div>
        <div class="top">${e.barra ? '<div class="bar"></div>' : ''}<h1 style="--fs:${e.fs || 118}px">${rich(e.titulo)}</h1>
        ${e.texto ? `<div style="height:40px"></div><p style="color:${m.colores.resalte};font-weight:700">${rich(e.texto)}</p>` : ''}</div></div>`;
      await shoot(browser, { css: css(m, W, H), body: ovBody }, W, H, ov, true);
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
    // Normaliza las partes (mismo códec, fps y tamaño) y une
    const norm = parts.map((p, k) => { const q = path.join(outDir, `_n${k}.mp4`); ff(['-i', p, '-vf', `scale=${W}:${H},fps=${FPS},format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-an', q]); return q; });
    const list = path.join(outDir, '_list.txt');
    fs.writeFileSync(list, norm.map(p => `file '${p}'`).join('\n'));
    let video = path.join(outDir, '_video.mp4');
    ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
    // Subtítulos quemados (para Reels con voz en off)
    if (spec.subtitulos && spec.subtitulos.texto && spec.subtitulos.duracion) {
      const ch = subtitleChunks(spec.subtitulos);
      const inputs = [], filt = []; let last = '[0:v]';
      for (let k = 0; k < ch.length; k++) {
        const png = path.join(outDir, `_s${k}.png`);
        await shoot(browser, { css: css(m, W, H), body: `<div class="s" style="background:transparent"><div class="sub"><span>${esc(ch[k].texto)}</span></div></div>` }, W, H, png, true);
        inputs.push('-i', png);
        filt.push(`${last}[${k + 1}:v]overlay=0:0:enable='between(t,${ch[k].a.toFixed(2)},${ch[k].b.toFixed(2)})'[v${k}]`);
        last = `[v${k}]`;
      }
      const subbed = path.join(outDir, '_video_sub.mp4');
      ff(['-i', video, ...inputs, '-filter_complex', filt.join(';'), '-map', last, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', subbed]);
      video = subbed;
    }
    const out = path.join(outDir, 'reel.mp4');
    const music = spec.musica ? path.join(ROOT, spec.musica) : null;
    if (music && fs.existsSync(music)) {
      ff(['-i', video, '-i', music, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out]);
    } else {
      ff(['-i', video, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', out]);
    }
    // portada
    const cover = path.join(outDir, 'portada.jpg');
    ff(['-ss', String(spec.portada_segundo || 1.2), '-i', out, '-frames:v', '1', '-q:v', '3', cover]);
    for (const f of fs.readdirSync(outDir)) if (f.startsWith('_')) fs.rmSync(path.join(outDir, f), { recursive: true, force: true });
    files.push(out, cover);
    const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
    spec._duracion = Math.round(dur * 10) / 10;
  } else {
    throw new Error('tipo desconocido: ' + tipo);
  }
  await browser.close();
  const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
  const manifest = { codigo: spec.codigo, marca: spec.marca, tipo, archivos: files.map(f => `${REPO_RAW}/${rel(f)}`) };
  if (spec._duracion) manifest.duracion_segundos = spec._duracion;
  if (spec._escenas) {
    manifest.escenas = spec._escenas.map(x => ({ segundos: x.segundos, fuente: x.fuente === 'cierre' ? `${REPO_RAW}/${rel(path.join(outDir, 'cierre.jpg'))}` : x.fuente, capa: x.capa ? `${REPO_RAW}/${rel(x.capa)}` : null }));
    manifest.duracion_segundos = spec._escenas.reduce((a, x) => a + x.segundos, 0);
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
