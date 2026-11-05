# Guía creativa del agente de contenido

Léela completa antes de escribir o producir cualquier pieza: Reel, historia, carrusel o post. Lee también `REFERENCIAS.md` (competencia, cuentas de referencia, ganchos que funcionan e ideas para el Radar). Estos dos archivos son la fuente viva: cada ajuste que pide Carlos se escribe aquí, y todos los agentes los leen al inicio de cada corrida. Vale para todas las marcas. Los datos propios de cada marca (oferta, precios, personajes, voces, colores) están en `marcas/<marca>/marca.json` y en su página de Notion.

## 1. Para qué existe cada pieza

Cada pieza debe acercar a un cliente. Para Cocinas La Flora, eso es lograr que una persona escriba **COCINA** por WhatsApp. Antes de producir, define en una línea a quién le habla la pieza y qué debe hacer después de verla.

| Etapa | Objetivo | Formato principal | Cierre |
|---|---|---|---|
| Atraer | Llegar a quien no nos sigue | Reel (gancho fuerte en el primer segundo) | «Síguenos para más» o la pregunta del día |
| Conectar | Que nos sienta cercanos | Historias diarias y personajes | Encuesta, pregunta o «responde esta historia» |
| Convertir | Que escriba hoy | Carrusel con precio, modalidades y pasos | «Escríbenos COCINA» con el código |

Reparte la semana así: unas 4 piezas de atraer, 3 de conectar y 2 de convertir. Ninguna pieza sale sin el CTA de la marca y su código.

## 2. A quién le hablamos (Cocinas La Flora)

- La emprendedora o el emprendedor que cocina en casa y ya no le alcanza el espacio: postres, almuerzos, comida rápida, saludable.
- El restaurante que quiere expandirse o bajar costos fijos con una segunda cocina solo para domicilios.
- La marca virtual o el menú nuevo que se quiere probar sin arriesgar todo el capital.
- Catering, eventos y repostería por encargo.

**Objeciones que hay que responder:** «Lo voy a pensar», «Es caro, en mi casa no pago arriendo», «¿Y si no vendo lo suficiente?», «¿Cuánto pago de servicios?».

**Propuesta de valor: «Cocina oculta, apoyo visible.»** El apoyo se ve en: flexibilidad, entender la necesidad de cada cliente y ajustarnos a ella, arranque rápido, poca burocracia y papeleo, y costos bajos frente a un local. Cada pieza de conectar o convertir debe mostrar al menos uno de estos apoyos, no solo el espacio.

**Argumentos oficiales** (solo estos; las cifras salen de Notion): desde $1.300.000 al mes solo el espacio, contrato desde 6 meses, sin depósito, cocina 100 % privada, **2 o más puntos de gas, agua y electricidad: nos ajustamos a tu necesidad** (nunca escribas «2 puntos de gas» a secas), tres modalidades (solo espacio, con equipos u opción de compra de los equipos), servicios de unos $350.000 al mes en promedio, ubicación en La Flora · Chipichape, norte de Cali.

## 3. La imagen tiene que decir lo mismo que el texto

**Solo cocinas industriales.** Cocinas La Flora arrienda cocinas industriales para restaurantes y emprendedores. Nunca uses fotos de cocinas de casa o residenciales (alacenas de madera, islas de mármol, electrodomésticos domésticos), ni siquiera cuando el tema es «cocinas en casa». Si se muestra una cocina, debe ser profesional: acero inoxidable, campanas industriales, fogones y ollas de restaurante. Cuando el tema es la casa, muestra la comida o la cocina industrial, que es la solución.

Regla de oro: si la pieza habla de postres, se ven postres. Si habla de hamburguesas, se ve una hamburguesa. Si habla de costos, se ve a Chef Andrés con la libreta o una infografía. Si habla de la cocina, se ven fotos reales de la cocina.

Busca la imagen en este orden:

1. **Fotos reales** de las cocinas en `marcas/<marca>/assets/reales/` (retocadas el 5 nov a partir de las fotos de Carlos). Son la prueba más fuerte: úsalas al menos en 1 de cada 3 piezas y márcalas con `foto_real: true`. Lista y uso en `fotos_reales` de marca.json: módulo vacío (`modulo_cocina_frente`, `modulo_cocina_puerta`, `modulo_cocina_vertical`, `modulo_entrada_vertical`, `modulo_vacio_equipado`), en operación (`linea_caliente_campana`, `linea_caliente_despacho`, `cuarto_frio`, `zona_lavado`). Las verticales sirven de foto principal en historias; las horizontales, en posts, carruseles y galerías. Describe solo lo que se ve en la foto; no inventes equipos. Si Carlos envía fotos nuevas, retócalas igual: luz, balance de blancos, nitidez y limpieza de desorden (botellas, garrafas, notas); nunca agregues ni quites equipos ni cambies el espacio.
   También sirve el material propio del Banco de material en Notion.
2. **Personajes de la marca** (`personajes` en marca.json, modo o lámina `personaje`): para explicar, preguntar u objetar.
3. **Galerías de stock libres de regalías:** `orshot_search_stock_media` con `orientation: "vertical"` y 1 a 3 palabras en inglés (`dessert`, `burger`, `home kitchen cooking`, `food delivery`). Mira las miniaturas y elige la foto que muestre el tema con más claridad, luz cálida y espacio libre para el texto. Luego `orshot_use_stock_media` con su `ref` te da una URL permanente. Es gratis, de uso comercial y no exige atribución. Para video de stock: `vidiq_generate_broll` (1 crédito; la atribución al autor va en el caption). Antes de buscar, revisa si ya hay fotos del tema en `marcas/<marca>/assets/stock/`.
4. **Infografía o motion graphic** del kit cuando el mensaje es una cifra, una comparación o un proceso.

Nunca uses fotos o videos de otras cuentas de redes. Nunca uses una foto de stock que muestre un local con marca, un logo ajeno o una persona presentada como cliente.

## 4. Diseño v2 «foodie vibrante» (aprobado por Carlos el 5 nov 2026)

Carlos rechazó el diseño anterior por plano, oscuro, cargado y difuso, con fotos poco apetitosas y el CTA a 3/4 de la página. Ahora es obligatorio:

- **Claro y luminoso.** Fondo crema claro (`luz`). Nunca oscurezcas las fotos ni pongas velos negros encima.
- **Fotos nítidas y apetitosas.** Usa fotos de alta resolución (mínimo 1200 px de ancho), bien iluminadas y con color. No uses en portadas las fotos oscuras del banco (`imagenes_oscuras_no_usar_en_portada` en marca.json) ni fotos de baja resolución que se vean borrosas.
- **Historia y post:** la lámina por defecto (sin `tipo`) ya aplica este diseño: foto arriba con esquinas redondeadas, sticker amarillo, titular grande en Archivo negra sobre fondo claro, la palabra clave resaltada con marcador amarillo y el CTA **abajo**, en un bloque tomate con letra de palo grande: «Escríbenos COCINA · WhatsApp 320 770 9238». No repitas el CTA dentro de `texto`.
- **Protagonista por tema:** comida cuando se habla de producto o pedidos; cocina industrial cuando se habla del espacio; Chef Andrés cuando se habla de cifras o costos.
- **Carrusel:** la portada usa el mismo diseño (sin CTA, con «Desliza →»); las láminas de texto alternan fondos claros (crema, salvia y durazno) y el cierre es claro, con beneficios y el CTA abajo.
- **Rota el fondo** (`variante`): claro (por defecto), `oscuro` (negativo, carbón con resaltado amarillo), `acento` (tomate), `salvia` y `durazno`. Nunca dos piezas seguidas con la misma variante. En la semana: unas 3 claras, 2 oscuras, 1 tomate y 1 salvia o durazno. Las láminas de texto del carrusel también aceptan `variante: "oscuro"`.
- **Herramientas de la lámina v2:** `alto` (alto de la foto), `foto_real` (sello «FOTO REAL»), `galeria` (2 a 4 fotos en cuadrícula), `lista` (hasta 3 puntos «Título|detalle» en tarjetas blancas), `sticker` y `sticker2`.
- **Piezas de referencia aprobadas por Carlos (5 nov 2026).** Antes de diseñar, abre el JSON en `piezas/cocinas-la-flora/` y la imagen en `publicaciones/cocinas-la-flora/` del ejemplo más parecido, y parte de él:
  - Historias con foto de stock por tema: CLF-H26 (cocina industrial), CLF-H27 (persona en cocina profesional, sticker «Nuevo»), CLF-H28 (ollas industriales), CLF-H29 (hamburguesa).
  - Historia con personaje: CLF-H30 (Chef Andrés con libreta para hablar de cifras, con `foco`).
  - Carruseles: CLF-C01 (portada con foto, cifras en `dato`, láminas de texto con tintes que alternan, cierre «Cocina oculta, apoyo visible») y CLF-C05 (educativo).
  - Variantes de fondo: `piezas/_demos/DEMO-V01.json`.
- **Fotos reales: 5 estilos (5 nov 2026).** Carlos rechazó las primeras piezas con fotos reales (foto arriba y texto abajo, todas iguales). Con fotos reales usa estos estilos y no repitas el mismo dos veces seguidas. Están en prueba hasta que Carlos los apruebe:
  - `anotada` (CLF-H31, lámina 2 de CLF-C06): foto grande con 3 o 4 puntos numerados que señalan lo que se ve (campana, 2 o más puntos de gas, lavaplatos, cocina privada). Ubica cada punto sobre el objeto real; si la etiqueta choca con otra, usa `lado: "izq"`.
  - `presenta` (CLF-H32, lámina 3 de CLF-C06): foto real a sangre y Chef Andrés recortado (sin fondo) con globo arriba. Lleva Etiqueta IA.
  - `encuesta` (CLF-H33): dos tarjetas A/B con foto real para que respondan la historia. Elige fotos limpias, sin estanterías cargadas.
  - `collage` (CLF-P01): 2 polaroids grandes y ligeramente giradas sobre tomate (3 en historia). Que ninguna tape el pie de foto de la otra.
  - `inmersiva` (portada de CLF-C06): foto a sangre con un bloque amarillo de titular y chip negro de lugar. Ideal para portadas.
  - Reel con fotos reales: CLF-R01 (4 escenas de 2 a 3 s con tarjeta blanca arriba, Chef Andrés con el precio y cierre; las escenas se sincronizan con lo que dice la voz).
- **Una idea por pieza o por lámina.**
- El titular lleva máximo 7 palabras y 2 líneas, más 1 línea de apoyo si hace falta. Si necesitas más texto, divídelo en otra lámina o llévalo al caption.
- En video con foto de stock, usa el tipo `capas`: la foto ocupa todo el fondo y el texto va en una tarjeta blanca. En Reels con foto, la tarjeta va arriba para no chocar con los subtítulos.
- Una sola palabra resaltada por titular (`*palabra*` = marcador amarillo). Sin serif itálica en los titulares: debe leerse de un vistazo. Sin emojis en los titulares.
- Deja aire: es preferible un titular más corto a uno más pequeño.
- El texto importante va entre los 230 y los 1580 px de alto de un 9:16.
- Varía el tipo de lámina: no hagas dos láminas seguidas con el mismo diseño.

## 5. Cómo se produce cada formato

| Formato | Cuándo | Cómo |
|---|---|---|
| Reel con fotos o video de stock | Tema concreto (postres, almuerzos, domicilios) | Tipo `capas` del kit (tarjetas transparentes) + `vidiq_compose`. Las escenas son imágenes con la `fuente` de stock y `kenBurns`; las capas van como `overlays` de imagen a pantalla completa; el `cierre.jpg` es la última escena; se suman la voz y la música. Detalle en el README. |
| Reel infográfico o motion | Cifras, comparaciones, procesos | Tipo `reel` con escenas `modo` (contador, barras, vs, pasos, checklist, kinetic). |
| Reel con personajes | Objeciones y preguntas | Escenas `modo: "personaje"`: la emprendedora pregunta y Chef Andrés responde. Si el diálogo tiene dos voces, el README explica cómo mezclarlas. |
| Reel con material propio | Mostrar las cocinas | Tipo `reel` con `imagen` o `video` del banco. |
| Historia | Todos los días, de 2 a 3 | Una idea por historia: pregunta, dato, checklist, personaje o foto limpia (lámina `foto`). Si va con foto de stock: `capas` de una escena de 5 a 6 s + `vidiq_compose`, sin voz y con música suave. |
| Carrusel | Martes y jueves | Portada (lámina `foto` con material propio o `personaje`) → problema → dato o barras → vs → pasos → cierre. Entre 5 y 7 láminas. |
| Post | Ocasional | Lámina `foto` o `personaje` con el mensaje central. |

**Fotos de stock en piezas estáticas:** escribe las URLs en la cola (`cola/<código>.txt`, ver README, «Traer imágenes»), haz push y espera a que lleguen al repositorio (alrededor de 1 minuto). Luego úsalas en la lámina `foto` o como `imagen` en cualquier formato. Las fotos quedan guardadas en `marcas/<marca>/assets/stock/<tema>/` para reutilizarlas, sin repetir la misma foto dos días seguidos.

## 6. Personajes

- **Chef Andrés**, el mentor. Explica, da los datos oficiales y cierra con «Cocina oculta, apoyo visible.». Tutea, con algún toque caleño ocasional y sin caricatura. Su voz es la masculina de `audio.voces`.
- **La emprendedora**, el espejo del cliente. No tiene nombre, plantea el problema y hace las preguntas. Nunca da cifras ni se presenta como clienta real. Su voz es la femenina de `audio.voces`.
- Los dos son contenido generado con IA: marca Etiqueta IA y decláralo al publicar.
- Si falta la imagen de una pose en `marcas/<marca>/assets/personajes/`, usa la mascota (`modo: "llama"`) y anótalo en Notas QA.

## 7. Voz, texto y audio

- Habla de tú, con empatía primero y oferta después: «Si estás cocinando en tu casa…», «Yo sé lo que es…».
- Gancho en el primer segundo: una pregunta que filtra («¿Vendes postres desde casa?») o un dato que sorprende.
- Escribe las cifras en letras en los guiones de voz. Usa frases cortas.
- Usa voces colombianas cálidas, sin acento regional marcado. Alterna la voz masculina y la femenina según `audio.voces.regla`.
- Usa música del banco, rotada. Mezcla la voz por encima con `duckTo` de la música.

## 8. Lista de control antes de producir

1. ¿A quién le habla y qué debe hacer después de verla?
2. ¿La imagen muestra exactamente el tema, es nítida y luminosa, y si aparece una cocina, es industrial?
3. ¿El titular tiene 7 palabras o menos y una sola idea?
4. ¿Las cifras y condiciones son las oficiales de Notion?
5. ¿Tiene el CTA abajo y legible, el código y la etiqueta IA si aplica?
6. ¿Es distinta de las últimas 10 piezas en gancho, formato y foto?
