---
tags: [zaint, sistema, sop, verificacion, migracion]
creado: 2026-08-29
estado: NUEVO — nace en la preparación de MODOZAINT V2, no modifica nada existente
fuente: planes/preparacion-modozaint-v2-2026-08-29.md §4 Ola 3 · _MIGRACION/MODOZAINT_SOP_INVENTORY.md §2.2 · Protección P1 de SISTEMA/PROTECCIONES.md
---

# Verificar contra el sistema vivo

> **Qué responde:** *antes de escribir un número, un estado o una fecha, ¿lo estoy leyendo del
> sistema real o lo estoy repitiendo de un documento?*
> **Quién lo usa:** cualquier agente, cada vez que va a afirmar precio, inventario, estado de
> despliegue, contenido cargado o cualquier dato que un sistema externo pueda contradecir.
> **De dónde sale:** es el error #1 registrado del sistema — existe como Protección P1 desde el
> 2026-08-23, pero **sin procedimiento**. Este documento es ese procedimiento.

---

## El resultado que produce

Un dato que se escribe **solo después de haberlo leído del sistema que lo posee**, con la lectura
a la vista (el comando, la consulta o la captura) — no reconstruido desde un documento que lo
mencionó antes.

**El patrón que este SOP existe para cortar:** un dato falso es *coherente consigo mismo*. Por eso
no se detecta releyendo el vault ni razonando sobre él — **solo preguntándole al sistema vivo.**
Cuanto más se repite un dato falso entre documentos, más convincente parece, y más caro sale
corregirlo — el caso del rating fabricado tocó siete documentos antes de que alguien lo verificara
contra la tienda real.

---

## Restricciones

- **Una respuesta vacía no es evidencia de que algo no existe.** Puede ser: la clave usada no
  tiene permiso para verlo (RLS, un token de storefront en vez de admin), la ruta consultada no es
  la correcta, o el filtro de la consulta está mal. Antes de escribir «no hay nada», se confirma
  con una segunda vía.
- **Un documento que otro documento cita no es el sistema vivo.** Es un documento citando a otro.
  La cadena de siete documentos repitiendo el 4,7/5 es exactamente ese patrón.
- **El dato se corrige donde vive, no solo donde se usó.** Si un número falso se propagó a varios
  documentos, se corrige en todos — no solo en el que se estaba editando cuando se descubrió
  (regla vigente desde julio, con evidencia de que sin ella el dato falso sobrevive en los que no
  se tocaron).
- **Verificar dos veces antes de tocar configuración**, no después. La corrección apresurada de un
  diagnóstico equivocado (editar `.gitignore` para «arreglar» un respaldo que en realidad sí
  existía) es más cara que confirmar el diagnóstico un minuto más.

---

## Los cuatro casos reales que lo justifican

### 1 · El rating 4,7/5 fabricado (corregido 2026-07-21)

Un rating que **nunca fue real** —venía con el tema de Shopify comprado— se documentó como dato
verificado en al menos siete lugares del vault, incluyendo un plan que lo daba «por ya real».
Se descubrió al mirar la tienda en vivo, no releyendo los documentos: no había ninguna reseña
detrás del número. Eliminado de la tienda el 2026-07-20; los documentos, corregidos después.

### 2 · «El Content OS sigue sin commit ni push» (corregido 2026-08-23)

El tablero (`05_CURRENT_PRIORITIES.md`) declaraba el Content OS «construido y probado, pero SIN
desplegar». **Falso en las tres cosas:** había commit (`39a8079`, 21-ago), había push, y
`dermatinta-content-os.vercel.app` respondía HTTP 200. La causa del diagnóstico equivocado, que
casi provoca un daño mayor: se verificó `_LABS/content-os-nexum/.git`, pero el repo real vive un
nivel más abajo, en `dashboard/.git` — y `git remote -v` desde la carpeta padre devolvía los
remotos del *vault*, reforzando la conclusión falsa. Se estuvo a punto de editar el `.gitignore`
del vault para «arreglar» un respaldo que sí existía.

### 3 · «Septiembre está sin cargar, 0 de 30 días» (corregido 2026-08-26)

En el FounderOS, las lecturas contra Supabase se hacían con la variable `SUPABASE_SERVICE_KEY` del
`.env.local` — **pero esa variable, pese al nombre, contenía la clave pública** (`sb_publishable_…`),
no la de servicio. Con RLS activo (correctamente encendido), esa clave no ve los datos de
Santiago: toda consulta volvía vacía, y la vacía se leyó como «no hay nada cargado». Los días de
septiembre sí estaban ahí. **Una consulta vacía con clave pública no prueba que la tabla esté
vacía — prueba que esa clave no puede verla.**

### 4 · El material grabado que no existía (corregido 2026-08-21)

Un molde de contenido (`MOLDE_TINTA_QUE_SE_APAGA.md` §8) se escribió el 20-ago **hablando en
pasado** de tres finales «ya grabados», y construyó sobre ese supuesto una matriz de 11 piezas
montables. Se verificó contra el sistema vivo correcto para este caso — **no una base de datos,
el propio disco**: `CONTENIDO/video-assets/` solo tenía SVG y PNG, cero video. Y contra
`PLAN_CONTENIDO_V2_TOFU_MOFU.md` §1, que declaraba que ni los 14 hooks grabados de julio
sobrevivían. Nada estaba grabado. La matriz siguió siendo válida como plan de rodaje, nunca más
como inventario.

---

## Con qué credencial se consulta cada sistema, y qué significa una respuesta vacía

Esto es lo que hoy nadie tenía escrito. Sale de los cuatro casos de arriba más el estado
verificado el 2026-08-29.

| Sistema | Con qué se consulta | Qué significa una respuesta vacía |
|---|---|---|
| **Shopify (tienda Dermatinta)** | Sesión de Admin (o el conector MCP de Shopify, que opera con esos permisos) | **Vacía = vacía**, si se consultó desde Admin. ⚠️ Si algún día se consulta con un token de Storefront (público), un producto sin publicar o una colección oculta puede volver vacía sin estar realmente vacía — es la misma trampa que la clave pública de Supabase, con otro nombre |
| **Supabase — Content OS** (`Dermatinta Labs`) | `SUPABASE_SERVICE_KEY` en `dashboard/.env.local` — **verificado con prefijo `sb_secret_…`, la de servicio real** | Vacía = vacía. Bypasea RLS. Si un día una tabla nueva tiene RLS y la consulta la hace el cliente del navegador (con la `anon key`), aplica la misma alerta que en el caso 3 |
| **Supabase — FounderOS** (`modozaint's Project`) | ⚠️ **La variable se llama `SUPABASE_SERVICE_KEY` pero contiene la clave pública** (`sb_publishable_…`). No hay clave de servicio real cargada hoy | **Una respuesta vacía NO prueba nada.** RLS esconde los datos de Santiago a esa clave por diseño. Para confirmar de verdad: preguntarle a Santiago directamente, o leer con la sesión autenticada del navegador — nunca con esa variable |
| **Git / GitHub** (cualquier repo: vault, `dermatinta-content-os`, `founderos`, `nexum-leadhunter`) | Ninguna credencial — es el filesystem local + `git log`/`git remote -v`/`git status` | Vacío = vacío, **con una condición**: correr el comando **en el repo correcto**. Un repo puede vivir un nivel más abajo de donde se asume (caso 2) — confirmar con `git rev-parse --show-toplevel` antes de leer nada |
| **Vercel** (despliegues de las tres apps) | Sin credencial para el chequeo básico: `curl` a la URL pública y leer el código HTTP | Un 200 no basta por sí solo. **Un deploy bloqueado no falla ni avisa** — Vercel bloquea commits de autor ajeno al equipo (por eso `publicar.sh` firma como `modozaint@gmail.com`) y el sitio sigue mostrando la versión de ayer sin ningún error visible. Confirmar que el commit servido es el esperado, no solo que el sitio responde |

---

## Cómo se aplica

**El criterio, no la coreografía:** antes de escribir un número, un estado o una fecha que un
sistema externo podría contradecir, el agente puede citar **de dónde lo leyó** — el comando que
corrió, la fila que vio, la captura que miró. Si la única fuente es «lo dice un documento del
vault», eso no es el sistema vivo: es, como mucho, el punto de partida para ir a verificarlo.

**Cuando el resultado es vacío o inesperado, la restricción manda:** se prueba una segunda vía
(otra credencial, otra ruta, preguntarle a Santiago) antes de escribir la conclusión — nunca se
declara «no existe» sobre la base de una sola consulta que pudo estar mirando el lugar
equivocado.
