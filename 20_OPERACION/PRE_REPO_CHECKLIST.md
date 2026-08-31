---
tags: [migracion, higiene, seguridad, datos-personales]
creado: 2026-08-29
estado: BARRIDO — ningún archivo fue tocado. Cero valores de secretos o datos personales en este documento
fuente: planes/preparacion-modozaint-v2-2026-08-29.md §4 Ola 4
---

# Checklist pre-repositorio — datos de terceros

> **Regla de este documento: ni un valor.** Cada fila dice **archivo, tipo de dato, riesgo,
> recomendación** — nunca el correo, el teléfono o el nombre completo en sí. Quien necesite el
> valor real abre el archivo señalado.
>
> **Alcance:** solo archivos que `git ls-files` ya trackea. Nada que esté ignorado se revisó para
> esta lista (no hace falta: ya no puede llegar al repo).

---

## 1. Lo más serio — un prospecto real, identificado por nombre completo

| Archivo(s) | Tipo de dato | Riesgo | Recomendación |
|---|---|---|---|
| `SOLUCIONES_IA/PRODUCTOS/leadhunter-v1.md` · `BRANDS/MODOZAINT/PIEZA_LEADHUNTER_prospeccion-en-frio.md` · `BRANDS/MODOZAINT/YAPPING_LEADHUNTER.md` · `BRANDS/MODOZAINT/ANILLO_2_founders_reales.md` · `BRANDS/MODOZAINT/DECISION_ICP_Y_ARRANQUE_2026-08-28.md` · `BRANDS/MODOZAINT/ENTREVISTA_ICP_DEFINITIVA.md` · `05_CURRENT_PRIORITIES.md` · `_USO_LOG.md` | 🔴 **Nombre y apellido completos de un prospecto real** (CEO y cofundador de una agencia de Medellín), su cargo, el nombre de su empresa, la fecha del contacto en frío, y el resultado de la reunión agendada | **Alto si el repo se hiciera público.** Es un caso de negocio real de un tercero identificable, usado como prueba de éxito de LeadHunter — repetido en **8 archivos trackeados** | Mantener el repo privado (ya lo está). Si algún día se comparte este caso hacia afuera (una demo, un pitch), pedir autorización explícita a esa persona o anonimizarlo primero — no asumir que "ya salió una vez" lo autoriza para todo uso |

---

## 2. Contactos de proveedores y clientes reales, identificables por su correo

| Archivo(s) | Tipo de dato | Riesgo | Recomendación |
|---|---|---|---|
| `BRANDS/DERMATINTA/PRODUCTO_PROPIO_maquilas.md` · `_HANDOFFS/2026-07-21-2320-handoff.md` | 🟡 **Dos correos personales** (nombre+apellido en el usuario del correo) de contactos de fabricantes/maquilas contactados para el producto propio de Dermatinta | Medio. Son personas reales de empresas proveedoras, no clientes finales — pero siguen siendo datos de un tercero identificable fuera de una tienda o un formulario público | Repo privado cubre el riesgo inmediato. Si se necesita citar la investigación de maquilas hacia afuera, sustituir el correo por el nombre de la empresa proveedora, sin el contacto individual |
| `BRANDS/DERMATINTA/14_DERMATINTA_BU.md` | 🟢 Un correo de PQR de un proveedor (`grupomsm.co`) | Bajo — es un buzón corporativo de atención, no una persona | Ninguna acción necesaria |
| `_ARCHIVO/seguimiento-ecommerce-2026-08-23/scripts/calcom-cancelar-julio.mjs` · `_LABS/nexum-leadhunter/app/scripts/calcom-cancelar-julio.mjs` (mismo archivo en dos ubicaciones) | 🟡 **Un correo personal** (nombre+apellido en el usuario) de alguien con quien se agendó y canceló una cita real por Cal.com | Medio — es una persona real, identificable, en un script de prueba que quedó trackeado | Si el script ya cumplió su función (cancelar una cita puntual de julio), es candidato a limpiar el valor hardcodeado y dejarlo como variable o ejemplo — **no se tocó, queda para que Santiago decida** |
| `_USO_LOG.md` (línea 128) | 🟡 Un correo de alguien mencionado en el log de una sesión, sin contexto claro de quién es | Bajo-medio — `_USO_LOG.md` es historial de trabajo, no algo que se publique tal cual, pero está trackeado | Ninguna acción — es exactamente el tipo de dato que el `_USO_LOG` acumula por diseño. Si el log se resume/reconstruye en el V2 (ya está marcado `REBUILD` en el inventario), es el momento natural de dejar esto fuera |

---

## 3. Un cliente de negocio (no una persona), citado varias veces

| Archivo(s) | Tipo de dato | Riesgo | Recomendación |
|---|---|---|---|
| `_LABS/nexum-leadhunter/ESTANDARES-ENTREGA.md` · `_LABS/nexum-leadhunter/app/lib/calidad-mensaje.ts` · `_ARCHIVO/seguimiento-ecommerce-2026-08-23/lib/calidad-mensaje.ts` · `_USO_LOG.md` | 🟢 El correo de contacto de una barbería, cliente piloto de Nexum | Bajo — es el correo de negocio de un cliente conocido y ya referenciado por su nombre comercial en varios documentos del vault; no es una persona privada | Ninguna acción necesaria mientras el repo sea privado |

---

## 4. Personas reales, pero con datos que ellas mismas hicieron públicos

| Archivo(s) | Tipo de dato | Riesgo | Recomendación |
|---|---|---|---|
| `BRANDS/MODOZAINT/ANILLO_2_founders_reales.md` · `BRANDS/MODOZAINT/BUYER_PERSONAS_v1.md` · `BRANDS/MODOZAINT/AUDIENCIA_REAL_verificada_2026-08-28.md` (comentarios citados) | 🟡 **Nombres y usuarios reales** de dos founders (con seguidores, facturación aproximada y marcas que dirigen) y de varios comentaristas de TikTok (Brayan, Eli, Ferro — citados por su usuario público) | Medio — todo es información que esas personas ya publicaron en sus propias cuentas o comentarios públicos, pero está **compilada y analizada** en un documento del vault, lo cual es un uso distinto al que ellas dieron a su propio dato | Repo privado es la protección correcta hoy. Si se usa este material en una pieza pública (un video, un caso de estudio), sería razonable avisarles o mantenerlo genérico — no citarlos por nombre sin que lo sepan |

---

## 5. Correos y alias que **no** son riesgo de terceros

| Qué son | Por qué no cuentan |
|---|---|
| Los correos de marca propia (`dermatinta@…`, `kayzenlanas@…`, `modozaint@…`, `santiagojg0909@…`, `nexum.404@…`, `thementedigital@…`) repetidos en más de 30 archivos (contratos, `.sql`, `publicar.sh`, políticas de tienda, `_USO_LOG.md`) | Son cuentas del propio Santiago o de sus marcas — el mismo tipo de dato que `CLAUDE.md` ya documenta en abierto (ej. *«publicar.sh firma con modozaint@gmail.com a propósito»*). No son terceros |
| El alias `297497107+modozaint@users.noreply.github.com` | Es el correo `noreply` que GitHub genera para el propio usuario `modozaint` — no expone nada |
| `tu@correo.com` (FounderOS) y `nombrecliente.contentos@gmail.com` (plantilla archivada) | Placeholders literales dentro de un formulario o una plantilla, nunca fueron datos reales |
| El patrón que coincidió dentro de `HOJA_RODAJE_ESTRATEGIA_01.pdf` | Falso positivo: es contenido binario del PDF que por casualidad matchea el patrón de un correo. No hay ningún correo ahí |
| Los "teléfonos" encontrados en los `.svg` del logo y en `dt-footer.liquid` | Falsos positivos (coordenadas de trazos vectoriales) o el número de ejemplo genérico `+57 300 123 4567` que ya trae el footer de la tienda — no es un número real |

---

## 6. Los dos pendientes concretos (§4.4.b del plan)

### `_LABS/nexum-leadhunter/app/_datos.json` — ¿tiene datos personales? ¿está ignorado?

**Las dos respuestas: sí y sí.**

- **Sí tiene datos personales.** Son **42 leads** con nombre, cargo, empresa, ubicación, URL de
  perfil de LinkedIn y el mensaje de contacto — exactamente el tipo de dato que el riesgo de esta
  ola busca. También trae los 3 clientes de la agencia (nombre del negocio, oferta, canal) y 3
  usuarios internos del sistema.
- **Sí está ignorado.** `_LABS/nexum-leadhunter/app/.gitignore` lo excluye por nombre
  (`_datos.json`) y `git ls-files` confirma que **nunca ha estado trackeado.** No hay commit del
  que rescatarlo ni riesgo de que salga en un push.

**No hace falta ninguna acción.** El diseño ya es correcto — los datos operativos de leads viven
fuera del repositorio.

### Las capturas de `ESTADISTICAS ZAINT/` — ¿ya están destiladas?

**Sí, completamente — y son cinco imágenes, no seis.**

`ESTADISTICAS ZAINT/_MANIFIESTO.md` (ya existente, del 28-ago) identifica cada una de las cinco
capturas, confirma que son el panel de TikTok de @modozaint, y declara textualmente que
`AUDIENCIA_REAL_verificada_2026-08-28.md` transcribe exactamente esos mismos números y es la
fuente única para citarlos. Revisada una de las cinco directamente: es un pantallazo limpio del
panel de Estadísticas de TikTok — sin notificaciones, sin datos de terceros visibles en la barra
del teléfono.

⚠️ **Nota aparte, no es de datos personales:** el inventario de migración y el mapa del sistema
dicen "6 capturas" — el conteo correcto, verificado con `find` y confirmado por el propio
`_MANIFIESTO.md`, es **5 imágenes .jpeg + el manifiesto en `.md`** (6 archivos en la carpeta, 5 de
ellos capturas). Es la clase de número que `SOP_VERIFICAR_CONTRA_EL_SISTEMA_VIVO.md` pide corregir
donde se repite — queda anotado aquí, no se editó el documento original de la auditoría.

**Se puede archivar cuando alguien lo decida** (el inventario ya las marcaba `DELETE_CANDIDATE`,
condicionado exactamente a esta verificación) — **archivar no es esta fase** (§6 del plan: nada se
borra ni se mueve aquí).

---

## 7. Las tres comprobaciones de secretos — repetidas hoy, no solo copiadas de la auditoría

**1 · `.env` trackeados:** `git ls-files | grep -iE "\.env($|\.[^e])"` (excluyendo `.example`) →
**cero resultados.** Ningún `.env` real está en el repositorio.

**2 · Historial de git limpio:** `git log --all --diff-filter=A --name-only` filtrado por
`\.env|\.pem$|\.key$|credentials\.json$` (excluyendo `.example`) sobre **379 commits** →
**cero resultados.** Nunca se añadió un archivo de secretos, ni siquiera en un commit posterior
revertido.

**3 · Los `.env.example` sin valores reales:** los cuatro `.env*.example` trackeados
(`content-os-nexum/dashboard`, `nexum-leadhunter/app`, `videojuego-vida`, y uno archivado en
`_ARCHIVO/`) se revisaron línea por línea. Ninguno trae una clave real. Las únicas dos líneas con
valor son intencionalmente públicas por diseño: la URL de un proyecto Supabase y su
`ANON_KEY`/`sb_publishable_…` truncada — ambas son la clave que Next.js expone al navegador a
propósito (prefijo `NEXT_PUBLIC_`), protegida por RLS, no por secreto.

---

## Resumen — qué queda pendiente de decidir

| # | Qué | ¿Bloquea el repo privado? | ¿Bloquearía un repo público? |
|---|---|---|---|
| 1 | El caso de Daniel Martínez / The Mente Digital, repetido en 8 archivos | No | 🔴 Sí — pedir autorización o anonimizar antes |
| 2 | Los dos correos de contactos de maquilas | No | 🟡 Revisar |
| 3 | El correo cancelado de Cal.com, en dos copias del mismo script | No | 🟡 Limpiar si el script ya no se usa |
| 4 | Founders y comentaristas citados por nombre en el análisis de audiencia | No | 🟡 Avisar si se usa en una pieza pública |
| 5 | `_datos.json` de LeadHunter | No — ya está bien diseñado | No — nunca llega al repo |
| 6 | Las capturas de `ESTADISTICAS ZAINT/` | No | 🟢 Ya destiladas, se pueden archivar cuando se decida |

**La recomendación que ya estaba en la auditoría se sostiene, verificada:** el repositorio debe
**seguir privado.** No por las claves — esas están limpias — sino porque el vault nombra personas
reales identificables, y ningún archivo de los de arriba está preparado para salir a la luz tal
como está escrito hoy.
