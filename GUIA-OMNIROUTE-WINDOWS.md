# Guía OmniRoute en Windows — ahorrar cuota semanal de Claude

**Objetivo:** usar Claude Code con modelos gratuitos (Gemini, OpenRouter, Groq) para tareas rutinarias y reservar la suscripción de Claude para el trabajo de alto valor.

**Tiempo estimado:** 45–60 minutos la primera vez.

---

## Reglas (no negociables)

1. **No conecte su cuenta de Claude a OmniRoute** (ni por OAuth ni rotando varias cuentas). Las condiciones de Anthropic restringen el uso de la suscripción en herramientas de terceros. Riesgo: suspensión de la cuenta.
2. **No envíe información confidencial de la compañía** a modelos gratuitos. Varios planes gratuitos usan los datos para entrenar.
3. **Limite OmniRoute a su PC** (paso 3). Por defecto queda abierto a toda la red local sin contraseña de API.

---

## Paso 1 — Instalar Node.js

Abra **PowerShell** (tecla Windows → escriba "PowerShell" → Enter):

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierre y vuelva a abrir PowerShell. Verifique:

```powershell
node -v
```

Debe mostrar v22.22 o superior (v24.x es correcto).

## Paso 2 — Instalar Claude Code y OmniRoute

```powershell
npm install -g @anthropic-ai/claude-code
npm install -g omniroute
```

La instalación de OmniRoute tarda 2–5 minutos. Las advertencias amarillas ("npm warn") son normales.

Verifique:

```powershell
claude --version
omniroute --version
```

Si npm muestra un aviso sobre "lifecycle scripts" bloqueados, permita los paquetes que indique el mensaje y repita la instalación.

## Paso 3 — Restringir OmniRoute a su PC (seguridad)

Ejecute una sola vez:

```powershell
setx OMNIROUTE_SERVER_HOST 127.0.0.1
```

Cierre y vuelva a abrir PowerShell.

## Paso 4 — Arrancar OmniRoute

```powershell
omniroute
```

Deje esa ventana abierta mientras trabaja. Abra en el navegador: **http://localhost:20128**

- Contraseña inicial: `CHANGEME`
- **Cámbiela de inmediato** en la configuración del panel.

## Paso 5 — Obtener claves gratuitas (3 proveedores)

| Proveedor | Dónde obtener la clave | Para qué sirve |
|---|---|---|
| Google Gemini (AI Studio) | aistudio.google.com/apikey | Principal: buena calidad, contexto largo |
| Groq | console.groq.com/keys | Respuestas muy rápidas, tareas cortas |
| OpenRouter | openrouter.ai/keys | Respaldo: acceso a modelos `:free` (DeepSeek, Qwen, etc.) |

Todas requieren solo registro con correo o Google. No ingrese tarjeta.

## Paso 6 — Conectar los proveedores en OmniRoute

En el panel (http://localhost:20128):

1. Menú **Providers** → busque el proveedor → **Add** → pegue la clave.
2. Pulse **Test** para confirmar que responde.
3. Repita para los tres.
4. Revise **Dashboard → Free tiers** para ver la cuota gratuita disponible.

## Paso 7 — Abrir Claude Code con un modelo gratuito

En una **segunda** ventana de PowerShell, ubicado en la carpeta de su proyecto:

```powershell
omniroute run claude --model <proveedor>/<modelo>
```

Copie el identificador exacto del modelo desde el panel (sección Models o Providers). Ejemplo de formato: `gemini/gemini-2.5-flash`. Verifique el nombre en su panel; los modelos disponibles cambian.

Para ver los modelos desde la terminal:

```powershell
omniroute models
```

## Paso 8 — Uso diario

| Ventana | Comando | Consume cuota de Claude |
|---|---|---|
| Trabajo rutinario | `omniroute run claude --model <modelo-gratuito>` | No |
| Trabajo estratégico | `claude` (normal) | Sí |

### Qué tarea enviar a cada uno

| Tarea | Modelo |
|---|---|
| Borradores, variaciones de copys, hashtags, resúmenes | Gratuito (Gemini / Groq) |
| Reformatear, traducir, ordenar archivos, tareas repetitivas | Gratuito |
| Estrategia, análisis financiero, decisiones, revisión final | Claude |
| Información confidencial de la compañía | Claude (nunca gratuito) |

---

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `omniroute` no se reconoce como comando | Cierre y vuelva a abrir PowerShell; si persiste, reinstale Node.js |
| Error de puerto en uso | Ya hay un OmniRoute abierto; use esa ventana o ejecute `omniroute stop` |
| El modelo no responde o da error 429 | Se agotó la cuota gratuita de ese proveedor; cambie de modelo |
| Diagnóstico general | `omniroute doctor` |

## Escenarios esperados

| Escenario | Resultado |
|---|---|
| Optimista | 50–70 % del trabajo pasa a modelos gratuitos; la cuota de Claude rinde 2–3 veces más |
| Base | 30–40 % del trabajo se desvía; termina la semana sin bloquearse |
| Pesimista | Los modelos gratuitos no alcanzan la calidad requerida y vuelve a Claude para casi todo |
