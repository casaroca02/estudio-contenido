# Plan SEO de cocinaslaflora.com (vivo)

Lo lee el **Agente SEO** cada semana, junto con `../GUIA.md` (reglas de marca). Carlos aprobó el 5 nov 2026 que el agente edite y publique la web de forma automática.

## Meta
Ser el primer resultado en Google (orgánico y Google Maps) en Cali para las búsquedas de arriendo de cocinas.

## Palabras clave (prioridad)
| # | Búsqueda | Página destino |
|---|---|---|
| 1 | alquiler de cocinas Cali / arriendo cocina Cali | / |
| 2 | cocina oculta Cali / cocinas ocultas Cali | / |
| 3 | dark kitchen Cali / ghost kitchen Cali | /dark-kitchen-cali/ |
| 4 | cocina industrial en arriendo Cali | /cocina-industrial-arriendo-cali/ |
| 5 | local para comida a domicilio Cali / cocina para domicilios Cali | /cocina-para-domicilios-cali/ |
| 6 | cuánto cuesta arrendar una cocina en Cali | /cuanto-cuesta-arrendar-una-cocina-cali/ |
| 7 | qué es una cocina oculta | /que-es-una-cocina-oculta/ |
| 8 | cocina para emprender comida Cali / cocina para postres Cali / cocina para catering Cali | una página por nicho |
| 9 | cocina en arriendo Chipichape / norte de Cali / La Flora | / y /ubicacion-norte-de-cali/ |

## Reglas que no se rompen
- Solo datos oficiales (GUIA.md sección 2): desde $1.300.000/mes solo el espacio, servicios ~$350.000, contrato desde 6 meses, 3 modalidades, 100 % privada, «2 o más puntos de gas: nos ajustamos a tu necesidad». Nunca «sin depósito». Nunca inventar cifras, clientes ni testimonios.
- No mostrar a los clientes actuales (Turk House, Caramela, El Chingón) en la web.
- Dirección exacta: solo en el Perfil de Empresa de Google, salvo que Carlos autorice ponerla en la web (pendiente).
- Solo fotos de cocinas industriales (las reales primero). Nunca cocinas de casa.
- Cada página nueva: título único (≤ 60 caracteres), meta descripción (≤ 155), un H1, texto útil de 600–1.000 palabras con preguntas reales, enlace al inicio y botón de WhatsApp, FAQ con schema FAQPage, misma cabecera y pie de la web, y entrada en `sitemap.xml`.
- Un cambio grande por semana como máximo; nunca romper la página principal. Antes de publicar, revisar con Playwright que la página carga y se ve bien en móvil.

## Backlog (el agente toma el primero pendiente)
- [x] 5 nov: corregir «2 puntos de gas» y quitar la foto de cocina de casa.
- [ ] Crear /que-es-una-cocina-oculta/ (explica el término: mucha gente en Cali no lo entiende).
- [ ] Crear /cuanto-cuesta-arrendar-una-cocina-cali/ (precio, servicios, comparación con un local de referencia $5,3 M).
- [ ] Crear /cocina-para-domicilios-cali/.
- [ ] Crear /dark-kitchen-cali/.
- [ ] Crear /cocina-industrial-arriendo-cali/.
- [ ] Páginas por nicho: postres, almuerzos, catering y eventos, marcas virtuales.
- [ ] Mejorar el schema LocalBusiness (geo, horario 8:00–22:00, areaServed Cali y Yumbo) cuando Carlos autorice la dirección.
- [ ] Optimizar peso de videos e imágenes (Core Web Vitals).

## Pendientes de Carlos
- Conectar Cloudflare Pages al repositorio (carpeta `web/`) para que cada commit se publique solo.
- Google Search Console: verificar el dominio (Cloudflare lo hace con un clic) y enviar el sitemap.
- Pasar los códigos de Google Analytics 4 y del Pixel de Meta.
