# LeadHunter

Busca profesionales en LinkedIn por rubro y ubicación, analiza cada perfil con
IA y genera un mensaje de contacto personalizado listo para copiar.

Herramienta de demostración para **Nexus Reach** (empresa ficticia, agencia de
servicios de IA). No es producto de ningún cliente real.

---

## Cómo correr

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

Las credenciales van en `.env.local` (ya creado, fuera del repo — `.gitignore`
cubre `.env*`):

```
APIFY_TOKEN=apify_api_...
ANTHROPIC_API_KEY=sk-ant-...
```

Ambas se leen **solo en el servidor**: todo el acceso a Apify y a Claude ocurre
en los route handlers de `app/api/`, así que las claves nunca llegan al navegador.

---

## Las 3 secciones

| Sección      | Qué hace                                                                            |
| ------------ | ----------------------------------------------------------------------------------- |
| **Búsqueda** | Rubro, cargos, estado/ciudad de EE.UU., cantidad. Muestra el coste estimado en vivo. |
| **Leads**    | Kanban de 4 columnas con drag & drop. Click en una tarjeta abre el panel de detalle. |
| **Ajustes**  | Tu nombre, tu oferta y el idioma de los mensajes. Alimenta a la IA.                  |

Al buscar, los leads entran automáticamente a **Nuevos** y la app salta a Leads.

---

## Actores de Apify y coste

Precios leídos de `pricingInfos` en la API de Apify el 2026-07-19:

| Actor                                | Evento                            | Precio                 |
| ------------------------------------ | --------------------------------- | ---------------------- |
| `harvestapi/linkedin-profile-search` | página de búsqueda (~10 perfiles) | **$0,10**              |
| `harvestapi/linkedin-profile-search` | perfil completo (modo `Full`)     | **$0,004**             |
| `harvestapi/linkedin-profile-posts`  | post                              | **$0,002** ($2 / 1.000) |

La fórmula está en `lib/costo.ts` y es la que alimenta la nota bajo el slider.
Una búsqueda de 20 leads sale ~$0,32.

**Protección de gasto:**

- Tope duro de 50 resultados (`LIMITE_DURO` en `lib/apify.ts`), aplicado también
  en el servidor por si alguien manda otro valor a la API.
- `maxItems` va al actor, así que el límite se aplica **antes** de gastar.
- El scraper de posts corre con `maxPosts: 1` — un post por perfil, nunca más.
- Si Apify devuelve error de límite de plan, la UI muestra *"Límite del plan
  gratuito de Apify alcanzado; se renueva el día 1"* en vez de romperse.

> La cuenta actual está en plan **FREE** (~$5 de crédito mensual, se renueva el
> día 1). Alcanza para unas 15 búsquedas de 20 leads.

### Dónde se verificó el schema

Los nombres de campo **no** salen de la página pública ni de memoria: se leyeron
del `inputSchema` del último build vía `GET /v2/acts/{actor}/builds`.
`buildSearchInput()` y `buildPostsInput()` en `lib/apify.ts` llevan el
comentario con la fecha.

---

## Dónde se cambian nombre / empresa / idioma

Tres lugares, en orden de conveniencia:

1. **En la app** → sección **Ajustes**. Es lo que persiste en el estado del servidor.
2. **Los valores por defecto** → `AJUSTES_DEFAULT` en `lib/types.ts`.
3. **Las reglas del mensaje** (tono, prohibiciones, estructura, largo) →
   `systemPrompt()` en `lib/claude.ts`.

El modelo se cambia en una línea: `MODELO` en `lib/claude.ts`
(hoy `claude-sonnet-5`).

---

## Reglas del mensaje

Se aplican **dos veces**, a propósito: el prompt las pide y un sanitizador
determinístico (`sanitizarMensaje`) las fuerza después. El mensaje es lo que se
ve en cámara, así que no queda librado al modelo.

- Idioma según Ajustes (inglés por defecto).
- Tono de fundador, humano y directo.
- Sin emojis, sin guiones largos (`—`), sin `¿` ni `¡`.
- Sin fórmulas vacías tipo *"I hope this message finds you well"*.
- Estructura: saludo por nombre → línea específica del perfil (idealmente
  referenciando su último post) → cómo ayuda Nexus Reach → cierre con pregunta
  abierta.
- Firmado con tu nombre. Máximo ~90 palabras.

---

## Arquitectura

```
app/
  page.tsx                     shell cliente con las 3 secciones
  api/search/route.ts          Apify búsqueda -> posts -> IA
  api/leads/route.ts           GET del tablero
  api/leads/[id]/route.ts      PATCH estado / nota
  api/leads/[id]/regenerar/    POST regenera solo el mensaje
  api/ajustes/route.ts         GET / PATCH
lib/
  apify.ts     buildSearchInput(), mapeo de perfiles, posts
  claude.ts    análisis IA, mensaje, sanitizador
  store.ts     Map en memoria del servidor (sin base de datos)
  costo.ts     precios reales y estimación
  us-states.ts los 50 estados
scripts/
  verify.mjs   verificación E2E headless
```

**Sin persistencia, a propósito.** El tablero vive en un `Map` colgado de
`globalThis` (para sobrevivir al hot-reload). Reiniciar el server lo vacía: es
una demo y así el video no se complica.

---

## Fondo de partículas (solo en Búsqueda)

`components/FondoParticulas.tsx`. Canvas propio, sin librería ni CDN.

**Para subir o bajar la presencia hay una sola perilla:** la constante
`INTENSIDAD` arriba del archivo.

| Valor | Cómo se ve |
| ----- | ---------- |
| `0.6` | Discreto. Se pierde al comprimir para video. |
| `1.0` | **Actual.** Calibrado para YouTube. |
| `1.3` | Agresivo, empieza a competir con el formulario. |

Está calibrado para video a propósito: VP9/H.264 arrasan con las líneas finas
de bajo contraste sobre fondo plano, así que pesan más el **grosor de línea**
(piso de 1,4px) y el **contraste** que la cantidad de partículas. Verificado
re-encodeando una captura a H.264 4,5 Mbps 1080p — la constelación sobrevive.

### Repulsión del cursor

Las partículas se apartan al pasar el mouse y **vuelven solas** con retorno
elástico. No es el `grab` de particles.js (donde se pegan al cursor con
líneas): acá el cursor abre un vacío de ~100px de radio que se cierra al
retirarlo. Las del frente reaccionan más que las del fondo, así que refuerza
el paralaje en vez de romperlo.

Perillas en `FondoParticulas.tsx`. **Para apagarla: `REPULSION_RADIO = 0`.**

```ts
const REPULSION_RADIO  = 260;   // alcance alrededor del cursor
const REPULSION_FUERZA = 9;     // cuánto empuja
const RETORNO          = 0.05;  // velocidad de vuelta
const AMORTIGUACION    = 0.85;  // frena el rebote
```

⚠️ El radio del vacío **no** es `FUERZA / RETORNO`. La fuerza cae con `caida²`
a medida que la partícula se aleja, así que se auto-limita. Sale de resolver
`(1 - ox/RADIO)² · FUERZA = ox · RETORNO` — con estos valores, ~83px teóricos
y ~100px medidos.

No aplica con `prefers-reduced-motion` ni en touch (sin hover). El contenedor
es `pointer-events-none`, así que el fondo nunca bloquea el formulario: el
tracking escucha en `window` y convierte a coordenadas del canvas.

Respeta `prefers-reduced-motion` (dibuja un cuadro estático) y se pausa cuando
la pestaña no está visible. 120 FPS a 1920x1080.

```bash
node scripts/test-repulsion.mjs   # mide el vacío, el retorno y que no bloquee
```

---

## Verificación

```bash
node scripts/verify.mjs   # requiere el server corriendo y al menos 1 lead
```

Corre headless y deja capturas en `/tmp/lh-shots`. No abre ningún navegador.

---

## Notas de implementación

Tres cosas que costaron y conviene no re-descubrir:

1. **Sonnet 5 corre thinking adaptativo si omitís el campo `thinking`.** El
   razonamiento consume el mismo presupuesto que `max_tokens`, y eso truncaba el
   JSON a mitad de camino (`Unterminated string in JSON`). Va explícito en
   `disabled`: es extracción estructurada, no lo necesita, y bajó la latencia de
   59s a ~31s por búsqueda de 3.
2. **En el actor de posts, `linkedinUrl` es la URL del post, no la del perfil.**
   Cruzar por ahí no matchea nunca. Se cruza por el slug del autor
   (`slugDePerfil`), que es lo único estable entre los dos actores.
3. **`location` del perfil es un objeto**, no un string: el texto bueno está en
   `location.linkedinText`. Y el puesto actual viene en `currentPosition[0]`,
   no en `experience`.

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · `@anthropic-ai/sdk`
(Claude Sonnet 5) · lucide-react · motion

> El prompt original pedía Next 15, pero `create-next-app@latest` instala 16
> (con Tailwind v4, que usa `@theme` en CSS en vez de `tailwind.config.js`).
> Los tokens de la paleta LinkedIn están en `app/globals.css`.
