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
  .bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(1.12) contrast(1.04)}
  .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,13,12,.86) 0%,rgba(15,13,12,.45) 45%,rgba(15,13,12,.25) 65%,rgba(15,13,12,.85) 100%)}
  .scrim2{position:absolute;inset:0;background:rgba(15,13,12,.72)}
  .lab{position:absolute;left:84px;top:${tall ? 230 : 96}px;font:400 30px "DM Mono";letter-spacing:4px;color:${c.acento}}
  h1{margin:0;font:900 var(--fs,112px)/1.0 Archivo;letter-spacing:-2px}
  h1 em,h2 em,.big em,.q em{font-style:normal;font-weight:inherit;font-family:inherit;color:${c.resalte}}
  .claro h1 em,.claro h2 em,.claro .q em,.luz h1 em,.luz h2 em,.globo h2 em,.bubble h2 em,.limpia h2 em,.tcard h2 em{color:inherit;background:linear-gradient(180deg,transparent 56%,${c.resalte} 56%,${c.resalte} 92%,transparent 92%);padding:0 6px;margin:0 -6px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
  .claro .big em{color:inherit}
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
  .bubble{position:absolute;left:70px;right:70px;top:300px;box-shadow:0 20px 50px rgba(15,13,12,.14);background:#fff;color:${c.fondo_oscuro};border-radius:44px;padding:56px 56px}
  .bubble:after{content:"";position:absolute;left:50%;bottom:-46px;margin-left:-40px;border:40px solid transparent;border-top-color:#fff;border-bottom:0}
  .mascota{position:absolute;left:50%;margin-left:-180px;bottom:690px;width:360px;height:514px}
  .pj{position:absolute;left:50%;transform:translateX(-50%);bottom:0;width:${W - 60}px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 9%);mask-image:linear-gradient(180deg,transparent 0,#000 9%)}
  .pj img{width:100%;display:block}
  .pjesc{position:absolute;inset:0;background-size:cover;background-position:center top}
  .pjscrim{display:none}
  .globo{position:absolute;left:70px;right:70px;top:${tall ? 300 : 150}px;background:#fff;color:${c.fondo_oscuro};border-radius:44px;padding:50px 54px;box-shadow:0 20px 50px rgba(15,13,12,.18)}
  .globo:after{content:"";position:absolute;left:58%;bottom:-44px;border:44px solid transparent;border-top-color:#fff;border-bottom:0}
  .globo.abajo{top:auto;bottom:${tall ? 640 : 120}px}
  .globo.abajo:after{bottom:auto;top:-44px;border:44px solid transparent;border-bottom-color:#fff;border-top:0}
  .pjblur{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(40px) brightness(.55)}
  .pjancho{position:absolute;left:0;right:0;top:${tall ? 400 : 200}px}
  .pjancho img{width:100%;display:block}
  .globo .quien{font:700 28px "Inter Tight";letter-spacing:3px;color:${c.acento_texto};margin-bottom:18px;display:flex;align-items:center;gap:16px}
  .ondas{display:inline-flex;gap:6px;align-items:center;height:30px}
  .ondas i{display:block;width:6px;height:30px;border-radius:3px;background:${c.acento};transform-origin:50% 50%}
  .a-onda{animation:kOnda .5s ease-in-out infinite alternate;animation-play-state:paused!important;animation-fill-mode:both}
  .a-resp{animation:kResp 2.6s ease-in-out infinite alternate;animation-play-state:paused!important;animation-fill-mode:both}
  @keyframes kOnda{from{transform:scaleY(.2)}to{transform:scaleY(1)}}
  @keyframes kResp{from{transform:translateX(-50%) translateY(0) scale(1)}to{transform:translateX(-50%) translateY(-12px) scale(1.012)}}
  .fade-baja{position:absolute;left:0;right:0;bottom:0;height:${tall ? 900 : 620}px;background:linear-gradient(180deg,rgba(15,13,12,0) 0%,rgba(15,13,12,.16) 100%)}
  .limpia{position:absolute;left:64px;right:64px;bottom:${tall ? 400 : 90}px;box-shadow:0 20px 50px rgba(15,13,12,.22);background:#fff;color:${c.fondo_oscuro};border-radius:32px;padding:40px 46px}
  .limpia .et{font:700 26px "Inter Tight";letter-spacing:4px;color:${c.acento_texto};margin-bottom:14px}
  .limpia h2{font-size:var(--fs,64px)}
  .limpia p{font-size:36px;margin-top:14px;opacity:.85}
  /* Diseño v2 «foodie vibrante»: claro, foto nítida arriba, mensaje grande y CTA abajo */
  .luz{background:${c.luz || '#FFF9F1'};color:${c.fondo_oscuro}}
  .ffoto{position:absolute;left:40px;right:40px;top:40px;height:${tall ? 1000 : 700}px;border-radius:48px;background-size:cover;background-position:center;filter:saturate(1.15) contrast(1.05) brightness(1.03)}
  .sticker{position:absolute;left:84px;top:${tall ? 1004 : 706}px;background:${c.resalte};color:${c.fondo_oscuro};font:800 30px/1 Archivo;letter-spacing:2px;text-transform:uppercase;padding:16px 28px;border-radius:40px;transform:rotate(-3deg);box-shadow:0 10px 30px rgba(15,13,12,.18)}
  .sticker.b{left:auto;right:84px;background:${c.durazno};transform:rotate(3deg)}
  .chipreal{position:absolute;right:76px;top:${tall ? 230 : 72}px;background:#fff;color:${c.fondo_oscuro};font:800 26px/1 Archivo;letter-spacing:2px;padding:14px 22px;border-radius:30px;box-shadow:0 8px 24px rgba(15,13,12,.18)}
  .gal{position:absolute;left:40px;right:40px;display:grid;gap:14px}
  .gal div{border-radius:28px;background-size:cover;background-position:center;filter:saturate(1.08) contrast(1.04)}
  .gal .w2{grid-column:span 2}
  .lista{margin-top:${tall ? 30 : 22}px;display:flex;flex-direction:column;gap:${tall ? 16 : 12}px}
  .lista div{background:#fff;border-radius:24px;padding:${tall ? '22px 28px' : '16px 24px'};font:700 ${tall ? 36 : 30}px/1.2 "Inter Tight";display:flex;gap:18px;align-items:center;color:${c.fondo_oscuro}}
  .lista b{font:900 ${tall ? 40 : 32}px Archivo;color:${c.acento_texto};min-width:${tall ? 56 : 46}px}
  .lista small{display:block;font:500 ${tall ? 30 : 25}px "Inter Tight";color:#5A5048;margin-top:4px}
  /* Estilos con fotos reales (5 nov): anotada, encuesta, collage, inmersiva, presenta */
  .fullfoto{position:absolute;left:0;right:0;top:0;background-size:cover;background-position:center;filter:saturate(1.08) contrast(1.03)}
  .pin{position:absolute;display:flex;align-items:center;gap:12px;transform:translate(-32px,-32px)}
  .pin.izq{flex-direction:row-reverse;transform:translate(calc(-100% + 32px),-32px)}
  .pin b{flex:none;width:64px;height:64px;border-radius:50%;background:${c.acento};color:#fff;font:900 32px/64px Archivo;text-align:center;box-shadow:0 0 0 6px rgba(255,255,255,.85),0 8px 20px rgba(15,13,12,.3)}
  .pin span{background:#fff;color:${c.fondo_oscuro};font:800 30px/1 "Inter Tight";padding:14px 20px;border-radius:16px;box-shadow:0 8px 20px rgba(15,13,12,.2);white-space:nowrap}
  .opcion{position:absolute;left:52px;right:52px;border-radius:40px;overflow:hidden;background-size:cover;background-position:center;box-shadow:0 18px 40px rgba(15,13,12,.18)}
  .opcion .letra{position:absolute;left:28px;top:28px;width:104px;height:104px;border-radius:50%;background:${c.resalte};color:${c.fondo_oscuro};font:900 60px/104px Archivo;text-align:center}
  .opcion .rot{position:absolute;left:0;right:0;bottom:0;background:#fff;padding:22px 34px;font:800 44px/1.1 Archivo;color:${c.fondo_oscuro}}
  .opcion .rot small{display:block;font:600 30px "Inter Tight";color:#5A5048;margin-top:6px}
  .polaroid{position:absolute;background:#fff;padding:18px 18px 70px;box-shadow:0 20px 45px rgba(15,13,12,.28)}
  .polaroid div{background-size:cover;background-position:center}
  .polaroid p{position:absolute;left:0;right:0;bottom:18px;text-align:center;font:700 30px "Inter Tight";color:${c.fondo_oscuro}}
  .bloque{position:absolute;left:56px;max-width:${W - 140}px;background:${c.resalte};color:${c.fondo_oscuro};padding:34px 42px;border-radius:28px;box-shadow:0 18px 40px rgba(15,13,12,.25)}
  .bloque h1{font:900 var(--fs,${tall ? 92 : 78}px)/1.02 Archivo;letter-spacing:-2px}
  .bloque h1 em{color:${c.acento_texto};background:none}
  .bloque p{margin-top:16px;font:600 ${tall ? 38 : 32}px/1.25 "Inter Tight"}
  .chipnegro{position:absolute;background:${c.fondo_oscuro};color:#fff;font:800 28px/1 Archivo;letter-spacing:2px;padding:16px 24px;border-radius:30px}
  .presenta-pj{position:absolute;bottom:0;filter:drop-shadow(0 20px 40px rgba(15,13,12,.35))}
  .fhead{position:absolute;left:76px;right:76px;top:${tall ? 1112 : 790}px}
  .fhead h1{font:900 var(--fs,${tall ? 88 : 74}px)/1.04 Archivo;letter-spacing:-2px}
  .fhead p{margin-top:${tall ? 26 : 20}px;font:500 ${tall ? 40 : 34}px/1.3 "Inter Tight";color:#4A423C}
  /* Variantes de fondo v2: oscuro (negativo), acento (tomate), salvia, durazno */
  .luz.v-oscuro{background:${c.fondo_oscuro};color:${c.fondo_claro}}
  .luz.v-oscuro .fhead p{color:#D9CFC2}
  .luz.v-oscuro h1 em{background:none;color:${c.resalte}}
  .luz.v-oscuro .pg{color:#D9CFC2!important}
  .luz.v-acento{background:${c.acento};color:#fff}
  .luz.v-acento .fhead p{color:#FFF1EA}
  .luz.v-acento h1 em{color:${c.fondo_oscuro}}
  .luz.v-acento .fcta{background:${c.fondo_oscuro};box-shadow:0 18px 40px rgba(15,13,12,.35)}
  .luz.v-acento .sticker{background:#fff}
  .luz.v-acento .desliza{color:#fff}
  .luz.v-salvia{background:#DDE6D3}
  .luz.v-durazno{background:#FFE1CF}
  .luz.v-oscuro .desliza{color:${c.resalte}}
  .fhead .desliza{display:inline-block;margin-top:${tall ? 30 : 24}px;font:700 34px "Inter Tight";color:${c.acento_texto}}
  .fcta{position:absolute;left:52px;right:52px;bottom:var(--cb,${tall ? 250 : 46}px);background:${c.acento};color:#fff;border-radius:40px;padding:${tall ? '34px 40px' : '26px 36px'};display:flex;align-items:center;gap:30px;box-shadow:0 18px 40px rgba(194,58,22,.28)}
  .fcta .ico{flex:none;width:${tall ? 104 : 88}px;height:${tall ? 104 : 88}px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center}
  .fcta .l1{font:900 ${tall ? 60 : 52}px/1.02 Archivo;letter-spacing:-1px}
  .fcta .l2{font:700 ${tall ? 42 : 36}px/1.2 "Inter Tight";margin-top:8px}
  .pills{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
  .pill{background:#fff;border-radius:40px;padding:16px 28px;font:700 34px "Inter Tight";box-shadow:0 8px 24px rgba(15,13,12,.08)}
  .pill:nth-child(2){background:${c.salvia}}.pill:nth-child(3){background:${c.durazno}}
  .tcard{position:absolute;left:64px;right:64px;top:300px;background:#fff;color:${c.fondo_oscuro};border-radius:36px;padding:44px 48px;box-shadow:0 20px 50px rgba(15,13,12,.22)}
  .tcard h2{font:900 var(--fs,76px)/1.04 Archivo;letter-spacing:-1.5px}
  .tcard p{margin-top:16px;font:600 38px/1.25 "Inter Tight";color:#4A423C}
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

// Icono genérico de chat (no usamos logos de terceros)
function chatIco(m) {
  return `<div class="ico"><svg width="56" height="56" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6 2 11c0 2.4 1 4.6 2.8 6.2L4 22l5-2.3c1 .3 2 .4 3 .4 5.5 0 10-4 10-9S17.5 2 12 2z" fill="${m.colores.acento}"/><path d="M8.6 7.6c.3-.3.8-.3 1 .1l.8 1.6c.1.3.1.6-.1.8l-.5.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.5c.2-.2.5-.2.8-.1l1.6.8c.4.2.4.7.1 1l-.7.8c-.5.5-1.3.6-2 .3-2.3-1-4.1-2.8-5.1-5.1-.3-.7-.2-1.5.3-2z" fill="#fff"/></svg></div>`;
}
// Bloque de llamada a la acción: siempre abajo, letra de palo grande y legible
function ctaBloque(m, spec, bottom) {
  return `<div class="fcta"${bottom ? ` style="--cb:${bottom}px"` : ''}>${chatIco(m)}<div><div class="l1">${esc(spec.cta || m.cta)}</div><div class="l2">${esc(m.cta_boton)}</div></div></div>`;
}
// Cierre: fondo claro, marca arriba, beneficios al centro, CTA abajo
function ctaBody(m, spec, video) {
  const H = spec._H || 1920, tall = H > 1500;
  const bottom = tall ? (video ? 380 : 250) : 46;
  const titulo = spec.cta_titulo || m.cta_titulo || 'Tu cocina *privada* en el norte de Cali';
  const puntos = (m.cta_puntos || []).map(x => `<span class="pill">${esc(x)}</span>`).join('');
  const v = spec.variante && spec.variante !== 'claro' ? ` v-${spec.variante}` : '';
  return `<div class="s luz${v}">
    <div style="position:absolute;left:0;right:0;top:${tall ? 260 : 110}px;display:flex;flex-direction:column;align-items:center;gap:${tall ? 22 : 14}px">${llamaSvg(spec.variante === 'acento' ? '#fff' : m.colores.acento)}<div class="marca">${m.marca_html}</div></div>
    <div style="position:absolute;left:76px;right:76px;top:${tall ? 640 : 420}px;text-align:center"><h1 style="--fs:${spec.cta_fs || (tall ? 96 : 80)}px;font-weight:900">${rich(titulo)}</h1>
      <div class="pills" style="margin-top:${tall ? 50 : 36}px">${puntos}</div></div>
    <div style="position:absolute;left:0;right:0;bottom:${bottom + (tall ? 200 : 168)}px;text-align:center" class="mono">${esc(m.cta_web)}<div class="cod" style="margin-top:10px">Código ${esc(spec.codigo)}</div></div>
    ${ctaBloque(m, spec, bottom)}</div>`;
}
// Diseño v2 «foodie vibrante»: foto nítida arriba, titular grande en fondo claro, CTA abajo
function foodieBody(m, l, i, n, H, fmt) {
  const img = l.imagen || m.imagenes[i % m.imagenes.length];
  const pg = n > 1 ? `<div class="pg" style="color:#4A423C">${i + 1}/${n}</div>` : '';
  const conCta = fmt !== 'carrusel' && l.cta !== false;
  const st = `<div class="sticker">${esc(l.sticker || m.sticker || 'Norte de Cali')}</div>${l.sticker2 ? `<div class="sticker b">${esc(l.sticker2)}</div>` : ''}`;
  const desliza = fmt === 'carrusel' && i === 0 ? `<div class="desliza">Desliza →</div>` : '';
  const recorte = l.recorte ? `background-color:${l.fondo_foto || m.colores.durazno};background-size:auto 96%;background-position:center bottom;background-repeat:no-repeat;` : '';
  const v = l.variante && l.variante !== 'claro' ? ` v-${l.variante}` : '';
  const tall = H > 1500, alto = l.alto || (tall ? 1000 : 700);
  const pos = l.alto ? `<style>.ffoto{height:${alto}px}.sticker{top:${40 + alto - 36}px}.fhead{top:${40 + alto + 72}px}</style>` : '';
  const chip = l.foto_real ? `<div class="chipreal"><svg width="26" height="22" viewBox="0 0 24 20" style="vertical-align:-3px;margin-right:8px"><path d="M8 1h8l2 3h3a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h3z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="11" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>FOTO REAL</div>` : '';
  const lista = l.lista ? `<div class="lista">${l.lista.map((x, k) => { const [t, sub] = String(x).split('|'); return `<div><b>${String(k + 1).padStart(2, '0')}</b><span>${rich(t)}${sub ? `<small>${rich(sub)}</small>` : ''}</span></div>`; }).join('')}</div>` : '';
  if (l.galeria) {
    const g = l.galeria, gh = l.alto || (tall ? 1000 : 700);
    const filas = Math.ceil(g.filter((x, k) => !(g.length % 2 && k === g.length - 1)).length / 2) + (g.length % 2 ? 1 : 0);
    const celdas = g.map((x, k) => `<div${g.length % 2 && k === g.length - 1 ? ' class="w2"' : ''} style="background-image:url(${fileUrl(m, x)})"></div>`).join('');
    return `<div class="s luz${v}">${pos}<div class="gal" style="top:40px;height:${gh}px;grid-template-columns:1fr 1fr;grid-template-rows:repeat(${filas},1fr)">${celdas}</div>${chip}${st}
    <div class="fhead"><h1${l.fs ? ` style="--fs:${l.fs}px"` : ''}>${rich(l.titulo)}</h1>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}${lista}${desliza}</div>
    ${conCta ? ctaBloque(m, l) : ''}${conCta ? '' : pg}</div>`;
  }
  return `<div class="s luz${v}">${pos}<div class="ffoto" style="background-image:url(${fileUrl(m, img)});${recorte}${l.foco ? 'background-position:' + l.foco : ''}"></div>${chip}${st}
    <div class="fhead"><h1${l.fs ? ` style="--fs:${l.fs}px"` : ''}>${rich(l.titulo)}</h1>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}${lista}${desliza}</div>
    ${conCta ? ctaBloque(m, l) : ''}${conCta ? '' : pg}</div>`;
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

function pinsHtml(l) {
  return (l.puntos || []).map((p, k) => `<div class="pin${p.lado === 'izq' ? ' izq' : ''}" style="left:${p.x}%;top:${p.y}%"><b>${k + 1}</b><span>${esc(p.texto)}</span></div>`).join('');
}
const camSvg = `<svg width="26" height="22" viewBox="0 0 24 20" style="vertical-align:-3px;margin-right:8px"><path d="M8 1h8l2 3h3a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h3z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="11" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>`;
// Estilos con fotos reales
function realBody(m, l, i, n, H, fmt) {
  const tall = H > 1500, W = 1080;
  const conCta = fmt !== 'carrusel' && l.cta !== false;
  const v = l.variante && l.variante !== 'claro' ? ` v-${l.variante}` : '';
  const pg = n > 1 ? `<div class="pg" style="color:${l.variante === 'oscuro' ? '#D9CFC2' : '#4A423C'}">${i + 1}/${n}</div>` : '';
  const real = l.foto_real !== false ? `<div class="chipreal">${camSvg}FOTO REAL</div>` : '';
  const cta = conCta ? ctaBloque(m, l) : pg;
  const u = x => fileUrl(m, x);
  if (l.tipo === 'anotada') {
    const alto = l.alto || (tall ? 1120 : 780);
    return `<div class="s luz${v}"><div class="fullfoto" style="height:${alto}px;background-image:url(${u(l.imagen)});${l.foco ? 'background-position:' + l.foco : ''}"><div style="position:absolute;inset:0">${pinsHtml(l)}</div></div>${real}
      <div class="fhead" style="top:${alto + (tall ? 50 : 34)}px"><h1${l.fs ? ` style="--fs:${l.fs}px"` : ''}>${rich(l.titulo)}</h1>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}</div>${cta}</div>`;
  }
  if (l.tipo === 'encuesta') {
    const top = tall ? 400 : 250, hh = tall ? 470 : 330, gap = 24;
    const op = (o, k) => `<div class="opcion" style="top:${top + k * (hh + gap)}px;height:${hh}px;background-image:url(${u(o.imagen)})"><div class="letra">${'AB'[k]}</div><div class="rot">${rich(o.titulo)}${o.texto ? `<small>${rich(o.texto)}</small>` : ''}</div></div>`;
    return `<div class="s luz${v}"><div class="fhead" style="top:${tall ? 225 : 80}px"><h1 style="--fs:${l.fs || (tall ? 84 : 66)}px">${rich(l.titulo)}</h1></div>
      ${l.opciones.map(op).join('')}<div style="position:absolute;left:0;right:0;top:${top + 2 * hh + gap + 22}px;text-align:center;font:700 ${tall ? 36 : 30}px 'Inter Tight'">${rich(l.texto || 'Responde esta historia con A o B')}</div>${cta}</div>`;
  }
  if (l.tipo === 'collage') {
    const fotos = l.fotos || [];
    const pos = tall ? [[70, 520, 560, -6], [470, 640, 540, 5], [170, 1040, 600, -2]] : [[40, 280, 560, -5], [470, 640, 540, 4], [0, 0, 0, 0]];
    const pol = fotos.slice(0, tall ? 3 : 2).map((f, k) => { const [x, y, w, r] = pos[k]; const hh = Math.round(w * 0.72); return `<div class="polaroid" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><div style="width:${w}px;height:${hh}px;background-image:url(${u(f.imagen)})"></div><p>${esc(f.texto || '')}</p></div>`; }).join('');
    return `<div class="s luz${v || ' v-acento'}"><div class="fhead" style="top:${tall ? 225 : 80}px"><h1 style="--fs:${l.fs || (tall ? 90 : 72)}px">${rich(l.titulo)}</h1>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}</div>${pol}${cta}</div>`;
  }
  if (l.tipo === 'inmersiva') {
    const bottom = conCta ? (tall ? 470 : 230) : (tall ? 300 : 130);
    return `<div class="s luz"><div class="fullfoto" style="bottom:0;background-image:url(${u(l.imagen)});${l.foco ? 'background-position:' + l.foco : ''}"></div>${real}
      ${l.etiqueta ? `<div class="chipnegro" style="left:56px;top:${tall ? 230 : 72}px">${esc(l.etiqueta)}</div>` : ''}
      <div class="bloque" style="bottom:${bottom}px"><h1${l.fs ? ` style="--fs:${l.fs}px"` : ''}>${rich(l.titulo)}</h1>${l.texto ? `<p>${rich(l.texto)}</p>` : ''}${fmt === 'carrusel' && i === 0 ? `<p style="font-weight:800;color:${m.colores.acento_texto}">Desliza →</p>` : ''}</div>${cta}</div>`;
  }
  if (l.tipo === 'presenta') {
    const pj = (m.personajes || {})[l.personaje] || {}; const pose = (pj.poses || {})[l.pose] || {};
    const arch = l.recorte || pose.recorte || pose.archivo;
    const hpj = l.alto_personaje || (tall ? 1180 : 860);
    const globo = `<div class="globo" style="top:${tall ? 230 : 70}px"><div class="quien">${esc((pj.nombre || '').toUpperCase())}</div><h2 style="--fs:${l.fs || (tall ? 66 : 56)}px">${rich(l.titulo)}</h2>${l.texto ? `<p style="margin-top:18px;font-size:${tall ? 38 : 32}px;color:#4A423C">${rich(l.texto)}</p>` : ''}</div>`;
    return `<div class="s luz"><div class="fullfoto" style="bottom:0;background-image:url(${u(l.imagen)});${l.foco ? 'background-position:' + l.foco : ''}"></div>
      <img class="presenta-pj" src="${u(arch)}" style="height:${hpj}px;${l.lado === 'izq' ? 'left:-20px' : 'right:-30px'}">${globo}${cta}</div>`;
  }
  return null;
}
// Lámina estática
function laminaBody(m, l, i, n, H, fmt) {
  if (['anotada', 'encuesta', 'collage', 'inmersiva', 'presenta'].includes(l.tipo)) return realBody(m, l, i, n, H, fmt);
  const pg = n > 1 ? `<div class="pg">${i + 1}/${n}</div>` : '';
  const lab = `<div class="lab">${esc(m.etiqueta)}</div>`;
  if (l.tipo === 'cta') return ctaBody(m, Object.assign({ _H: H }, l));
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
  // Láminas de texto: bloque agrupado y centrado, fondos claros que alternan (luz, salvia, durazno)
  const tinte = ['#FFF9F1', '#EEF3E8', '#FFEADF'][i % 3];
  const oscura = l.variante === 'oscuro' || l.fondo === 'oscuro';
  const cb = (inner) => `<div class="s ${oscura ? '' : 'claro'}" style="${oscura ? '' : 'background:' + (l.fondo ? '' : tinte)}">${lab}<div style="position:absolute;left:84px;right:84px;top:${H > 1500 ? 300 : 170}px;bottom:${H > 1500 ? 420 : 130}px;display:flex;flex-direction:column;justify-content:center">${inner}</div>${pg}</div>`;
  if (l.tipo === 'dato') {
    return cb(`<div class="big">${rich(l.dato)}</div><div style="height:24px"></div><h2 style="--fs:${l.fs || 76}px">${rich(l.titulo)}</h2><div style="height:40px"></div><p style="font-size:44px;color:${oscura ? '#D9CFC2' : '#4A423C'}">${rich(l.texto)}</p>`);
  }
  if (l.tipo === 'claro') {
    return cb(`<div class="bar"></div><h2 style="--fs:${l.fs || 92}px;font-weight:900">${rich(l.titulo)}</h2><div style="height:44px"></div><p style="font-size:46px;color:${oscura ? '#D9CFC2' : '#4A423C'}">${rich(l.texto)}</p>`);
  }
  // portada (por defecto): diseño v2 foodie vibrante
  return foodieBody(m, l, i, n, H, fmt);
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
    <h2 style="--fs:${e.fs || 70}px">${t}</h2>${e.texto ? `<p style="margin-top:22px;font-size:40px;color:#4A423C">${rich(e.texto)}</p>` : ''}</div>`;
  if (pose.tipo === 'ancho') {
    const u = fileUrl(m, pose.archivo);
    return { cls: 'claro', html: `<div class="pjancho${anim === false ? '' : ' a-fade'}"><img src="${u}"></div>${globo}` };
  }
  if (pose.tipo === 'escena') {
    return { cls: '', html: `<div class="pjesc${anim === false ? '' : ' a-zoom'}" style="background-image:url(${fileUrl(m, pose.archivo)})"></div><div class="pjscrim"></div>${globo}` };
  }
  return { cls: 'claro', html: `<div class="pj${anim === false ? '' : ' a-resp'}" style="${pose.recorte ? '-webkit-mask-image:none;mask-image:none;width:' + (H > 1500 ? 860 : 700) + 'px' : ''}"><img src="${fileUrl(m, pose.recorte || pose.archivo)}"></div>${globo}` };
}

// Escena de motion graphic (Reel)
function motionBody(m, e, H) {
  const lab = `<div class="lab a-fade" style="animation-delay:0s">${esc(m.etiqueta)}</div>`;
  const bgImg = e.imagen && e.modo !== 'foto' ? `<div class="bg a-zoom" style="background-image:url(${fileUrl(m, e.imagen)})"></div><div class="scrim2" style="background:rgba(255,249,241,.82)"></div>` : '';
  const glow = `<div class="glow a-glow"></div>`;
  const def = 'claro';
  const cls = e.imagen && e.modo !== 'foto' ? 'claro' : fondoClase(e, def);
  let inner;
  if (e.modo === 'kinetic') {
    const k = kineticWords(e.titulo, 0.2, 0.16);
    inner = `<div class="top" style="top:${e.top || (H > 1500 ? 520 : 300)}px"><h1 style="--fs:${e.fs || 130}px">${k.html}</h1>
      ${e.texto ? `<div style="height:50px"></div><p class="a-up" style="animation-delay:${(k.end + 0.2).toFixed(2)}s;color:${cls ? 'inherit' : m.colores.resalte};font-weight:700">${rich(e.texto)}</p>` : ''}</div>`;
  } else if (e.modo === 'contador') {
    const txt = `${e.prefijo || ''}${e.valor}${e.sufijo || ''}`;
    inner = `<div class="top" style="top:${H > 1500 ? 470 : 260}px">
      ${e.antes ? `<h2 class="a-up" style="animation-delay:.1s;--fs:64px">${rich(e.antes)}</h2><div style="height:20px"></div>` : ''}
      <div class="big a-pop" style="animation-delay:.3s;font-size:${e.fs || 250}px">${cnt(0, e, txt, 0.3)}</div>
      <div style="height:40px"></div><h2 class="a-up" style="animation-delay:1.4s">${rich(e.titulo || '')}</h2>
      ${e.texto ? `<div style="height:30px"></div><p class="a-up" style="animation-delay:1.8s">${rich(e.texto)}</p>` : ''}</div>`;
  } else if (e.modo === 'foto') {
    // Foto real luminosa en tarjeta, con zoom suave y puntos que aparecen en secuencia (motion graphic, 5 nov)
    const k = kineticWords(e.titulo, 0.1, 0.12);
    const ft = e.foto_top || 600, fh = e.foto_alto || 940;
    const pins = (e.puntos || []).map((p, j) => `<div class="pin${p.lado === 'izq' ? ' izq' : ''}" style="left:${p.x}%;top:${p.y}%"><b class="a-pop" style="animation-delay:${(1.1 + j * 0.55).toFixed(2)}s">${j + 1}</b><span class="a-fade" style="animation-delay:${(1.3 + j * 0.55).toFixed(2)}s">${esc(p.texto)}</span></div>`).join('');
    inner = `<div class="top" style="top:${H > 1500 ? 300 : 120}px"><h1 style="--fs:${e.fs || 96}px">${k.html}</h1></div>
      <div class="a-up" style="animation-delay:.25s;position:absolute;left:60px;right:60px;top:${ft}px;height:${fh}px;border-radius:44px;overflow:hidden;box-shadow:0 30px 70px rgba(15,13,12,.25)">
        <div class="a-zoom" style="position:absolute;inset:0;background:url(${fileUrl(m, e.imagen)}) center/cover;${e.foco ? 'background-position:' + e.foco + ';' : ''}filter:brightness(1.1) contrast(1.06) saturate(1.15)"></div>
        <div style="position:absolute;inset:0">${pins}</div>
        <div class="chipreal a-fade" style="animation-delay:.6s;top:28px;right:28px">${camSvg}FOTO REAL</div></div>
      ${e.texto ? `<p class="a-up" style="position:absolute;left:84px;right:84px;top:${ft + fh + 50}px;animation-delay:${(1.2 + (e.puntos || []).length * 0.55).toFixed(2)}s;font:700 44px/1.25 'Inter Tight'">${rich(e.texto)}</p>` : ''}`;
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
  // Foto real pequeña y luminosa debajo del contenido (llena el espacio inferior en motion graphics)
  const mini = e.mini ? `<div class="a-up" style="animation-delay:${e.mini_delay || 0.9}s;position:absolute;left:60px;right:60px;top:${e.mini_top || 1100}px;height:${e.mini_alto || 560}px;border-radius:40px;overflow:hidden;box-shadow:0 26px 60px rgba(15,13,12,.22)"><div class="a-zoom" style="position:absolute;inset:0;background:url(${fileUrl(m, e.mini)}) center/cover;filter:brightness(1.1) contrast(1.06) saturate(1.15)"></div><div class="chipreal" style="top:24px;right:24px">${camSvg}FOTO REAL</div></div>` : '';
  return `<div class="s ${cls}">${bgImg}${glow}${lab}${inner}${mini}</div>`;
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
      await shoot(browser, { css: css(m, W, H), body: laminaBody(m, l, i, laminas.length, H, tipo) }, W, H, out);
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
    await shoot(browser, { css: css(m, W, H), body: ctaBody(m, Object.assign({ _H: H }, spec), true) }, W, H, cta);
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
      const ovBody = `<div class="s" style="background:transparent"><div class="tcard"><h2 style="--fs:${e.fs || 76}px">${rich(e.titulo)}</h2>${e.texto ? `<p>${rich(e.texto)}</p>` : ''}</div></div>`;
      await shoot(browser, { css: css(m, W, H), body: ovBody }, W, H, ov, true);
      const frames = Math.round(dur * FPS);
      const dark = 'eq=brightness=0.02:contrast=1.04:saturation=1.15';
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
    await shoot(browser, { css: css(m, W, H), body: ctaBody(m, Object.assign({ _H: H }, spec), true) }, W, H, ctaPng);
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
    // Música: ruta local o nombre de una pista de audio.musica_libre (marca.json). Se repite su tramo de loop
    // hasta cubrir el video, con fundido de entrada y salida. Gratis: no usa créditos de ninguna app.
    const lib = [...((m.audio || {}).musica_real || []), ...((m.audio || {}).musica_libre || [])].find(x => x.nombre === spec.musica);
    const music = lib ? path.join(ROOT, 'marcas', m.slug, lib.archivo) : spec.musica ? path.join(ROOT, spec.musica) : null;
    if (music && fs.existsSync(music)) {
      const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim();
      const ls = lib && lib.loop ? lib.loop.start : 0, le = lib && lib.loop ? lib.loop.end : null;
      const vol = spec.volumen_musica || (lib && lib.volumen) || 0.6;
      const ini = spec.musica_inicio != null ? spec.musica_inicio : (lib && lib.inicio) || 0;
      const loopF = !le ? `[1:a]atrim=start=${ini},asetpts=N/SR/TB,apad,` : le ? `[1:a]asplit=2[m0][m1];[m0]atrim=0:${le},asetpts=N/SR/TB[a0];[m1]atrim=${ls}:${le},asetpts=N/SR/TB,aloop=loop=-1:size=2e9[a1];[a0][a1]concat=n=2:v=0:a=1[mm];[mm]`
        : '';
      const fade = `atrim=0:${dur},afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, dur - 1.5)}:d=1.5,volume=${vol}[a]`;
      ff(['-i', video, '-i', music, '-filter_complex', (le ? loopF + fade : loopF + fade), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', String(dur), '-movflags', '+faststart', out]);
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
