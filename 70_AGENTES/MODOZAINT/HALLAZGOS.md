---
agente: MODOZAINT
updated: 2026-08-21
abiertos: 3
---
# Hallazgos · Agente MODOZAINT

> **Lo aprendido que todavía NO es aprendizaje consolidado.** Primera vez que aparece → entra aquí.
> **Si se repite → sube al módulo 08 del Knowledge Pack y se BORRA de este archivo.**
> Un hallazgo no puede estar en los dos sitios: esa fue la contradicción que se arregló el 21-jul.

---

### H-01 · «Listo para publicar» envejece a «no se publicó» en 24 horas
**1ª vez · 2026-08-21**

El capítulo 1 de keyboard rugs se cerró el 20-ago en el `_USO_LOG` como *«video montado 43,2s listo
para publicar»* y `ESTADO.md` se escribió el 21-ago diciendo *«Instagram: solo 5 posts»*. **Los dos
eran ciertos cuando se escribieron.** El video se publicó el **20-ago 18:45** —entre una cosa y la
otra— y hoy es el mejor post de Instagram de la marca: **1.122 de alcance contra 331 del segundo, y
el único con comentarios.**

**El costo real:** el mejor resultado de la semana estuvo sin medir un día entero, y el capítulo 2
—que su CTA prometía— no se había empezado.

**Qué hacer distinto:** cuando una corrida encuentre una pieza registrada como *«listo para
publicar»*, **verificarla contra la base antes de creerle al log**. Una línea de `_USO_LOG` es una
foto del momento en que se escribió, nunca del estado de hoy. *(Es la regla 2 aplicada al propio
registro: el log también es un documento, no un sistema vivo.)*

---

### H-02 · Un entregable que solo vive en el chat no existe la sesión siguiente
**1ª vez · 2026-08-21**

El diseño de los **7 capítulos** de la serie se hizo el 20-ago y **no quedó en ningún archivo**: el
propio log lo dice —*«vive todavía solo en el chat»*, porque Supabase estuvo caído toda la sesión—.
Confirmado hoy: no está en `BRANDS/MODOZAINT/` ni en la tabla `piezas` del Content OS.

**Por qué duele más de lo que parece:** el capítulo 1 **sí se publicó**, y con un CTA que promete
continuidad (*«el más comentado lo hago primero»*). O sea: **la promesa pública sobrevivió y el mapa
para cumplirla no.**

**Qué hacer distinto:** si un conector se cae y el destino previsto del entregable era ese conector,
**el entregable baja a un `.md` del vault en la misma sesión**. Un conector caído no es excusa para
no escribir: es la razón para escribir. *(Reconstruido hoy en
`BRANDS/MODOZAINT/SERIE_KEYBOARD_RUGS.md`.)*

---

### H-03 · Desde el vault se lee la base del Content OS, pero no se llama a ninguna API
**1ª vez · 2026-08-21**

Verificado hoy: la `SUPABASE_SERVICE_KEY` del `.env.local` **funciona** (se leyeron marcas, posts,
métricas y conexiones), pero **`INSTAGRAM_ACCESS_TOKEN` está vencido** (*«Cannot parse access
token»*) y **`TIKTOK_CLIENT_KEY/SECRET` no están en el archivo** — viven solo en Vercel. El token de
TikTok expiró el 21-ago 14:34 UTC y **no se puede refrescar desde acá**.

**Las tres consecuencias operativas, y la tercera es la cara:**
1. Las métricas de TikTok se leen **como las dejó la última sincronización** (20-ago 14:38), nunca
   frescas → siempre hay que declarar su antigüedad.
2. Nada publicado después de esa hora aparece, y eso se confunde con «no se publicó».
3. 🔴 **Los comentarios no se pueden leer, y el Content OS tampoco los guarda** (no hay tabla de
   comentarios). El sistema **elige el CTA con datos de comentarios** —la pregunta binaria rinde
   12,8×— pero **no puede leer las respuestas que ese CTA genera.** El bucle está abierto: solo
   Santiago cierra esa vuelta, a mano, desde el teléfono.
