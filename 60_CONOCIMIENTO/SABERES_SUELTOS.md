---
tags: [migracion, rescate, saberes, deuda-de-conocimiento]
creado: 2026-08-29
---

# Saberes sueltos — lo que solo vivía en un comentario, un plan viejo o una conversación

> **Qué es esto.** Cosas que se aprendieron pagándolas, y que hoy **no están donde alguien las
> buscaría.** Viven en el comentario de un script, en un plan de hace tres semanas o en el
> transcript de un chat que se pierde.
>
> **Cada una lleva: qué es · dónde vive hoy · qué costó no saberla.** La lista está abierta:
> quien encuentre otra, la añade.

**14 saberes.** Los 7 que el plan ya tenía identificados, más 7 encontrados al ejecutarlo.

---

## Despliegue y publicación

### 1. Vercel bloquea los commits de otro autor — y un deploy bloqueado no falla ni avisa

**Qué es.** Los despliegues cuyo autor de commit no pertenece al equipo de Vercel quedan
`BLOCKED`. **No producen un error**: el celular simplemente sigue mostrando la versión de ayer.

**Dónde vive hoy.** Un comentario en `_LABS/videojuego-vida/publicar.sh` (líneas 11-12), y el
script fuerza el autor correcto en su línea 64.

**Qué costó.** Un día. **Cinco deploys seguidos quedaron bloqueados el 14-ago y nadie lo notó.**

**Cómo se comprueba:** el registro de despliegues del proveedor (`gh api repos/<owner>/<repo>/deployments`
y su `state`). **Un código HTTP de la URL no prueba nada** — y un 307 en una ruta con login es
correcto, es el middleware mandando a la pantalla de entrar.

---

### 2. 🔴 Un script de despliegue que copia archivos falla EN SILENCIO — dos veces, por dos causas

**Qué es.** El mismo `publicar.sh` copia del vault a un repo aparte. Falló dos veces seguidas y
**las dos veces el build local pasaba**, porque el archivo que faltaba sí estaba en local.

1. Copiaba con `ls app/*.ts* app/**/*.ts*`. **En bash sin `globstar`, `**` se comporta como `*`** —
   un solo nivel. Los archivos de subcarpetas nunca viajaron.
2. Al arreglarlo se pasó a `git ls-files`, que **solo lista lo ya versionado.** Un archivo recién
   creado tampoco viajó. **El archivo más nuevo es justo el que más falta hace.**

**La forma que funciona:** `git ls-files --cached --others --exclude-standard`.

**Dónde vive hoy.** El comentario del script y una entrada de `_USO_LOG.md` del 26-ago.

**La lección general, que vale para cualquier script de despliegue:** un glob que no cubre
profundidad y una lista que no cubre lo nuevo **fallan sin ruido**, y **lo que lo caza no es el
build local —que pasa— sino mirar el estado del deploy en el proveedor.**

---

### 3. El VPS tiene cambios aplicados a mano encima del último commit

**Qué es.** Producción no es igual al repositorio. **Un `git pull` puede romper lo que está
corriendo.**

**Dónde vive hoy.** `planes/leadhunter-icp-desde-archivo-2026-08-28.md:78` (verificado el 23-ago).

**Qué costaría no saberlo.** Tumbar producción con un comando que parece inofensivo.

---

### 4. El repo de LeadHunter se publica con `git subtree push`

**Qué es.** La app vive dentro del vault pero se despliega desde su propio repositorio:

```
git subtree push --prefix=_LABS/nexum-leadhunter/app \
  https://github.com/modozaint/nexum-leadhunter.git main
```

**Dónde vive hoy.** `_LABS/nexum-leadhunter/app/DEPLOY.md:68`.

---

## Bases de datos y claves

### 5. 🔴 `SUPABASE_SERVICE_KEY` del FounderOS **no** es una clave de servicio

**Qué es.** La variable se llama `SUPABASE_SERVICE_KEY` pero **contiene una clave
`sb_publishable_…`, que es la pública.** Con las políticas de fila activas, esa clave **no ve los
datos** y las escrituras fallan con `42501` / HTTP 401.

**Dónde vive hoy.** `planes/la-casa-founderos-2026-08-26.md:79`.

**Qué costó. Dos reportes falsos de «no hay datos».** El nombre de la variable miente, y nadie
mira el valor.

---

### 6. ⭐ Una consulta vacía con clave pública **no prueba** que la tabla esté vacía

**Qué es.** La lección general de la anterior, y la más transferible de todas: con las políticas de
fila activas, **una consulta sin permiso devuelve una lista vacía, no un error.** Es
indistinguible de «no hay nada».

**Dónde vive hoy.** El mismo plan de agosto.

**Cómo se distingue:** intentar una **escritura**. Si devuelve 401 / `42501`, no es que esté vacía:
es que no se está viendo. Un vacío se investiga hasta encontrar la causa —el punto 3 del estándar
de verificación— y este es el caso que lo originó.

---

## El cuadro de turnos

### 7. El cuadro se lee, no se deduce — y cambia todos los meses

**Qué es.** Lo arma su jefa inmediata en un Excel. **No hay ciclo fijo ni patrón predecible.**

**Dónde vive hoy.** `KNOWLEDGE_PACKS/FOUNDER/PATRON_TURNOS.md:17`.

---

### 8. Los posturnos no salen del cuadro: se deducen del día siguiente a una noche

**Qué es.** El PDF **no los marca**. Un posturno es el día después de una noche: se sale a las 7 de
la mañana y es día protegido.

**Dónde vive hoy.** `planes/founderos-rendimiento-y-cuarto-2026-08-26.md:171-172`.

**Qué costaría no saberlo.** La app le exigiría sus hábitos completos a alguien que acaba de salir
de doce horas de noche.

---

### 9. La transcripción del cuadro se verifica contra sus tres totales de horas

**Qué es.** El PDF trae los totales por tipo de jornada. **Si la transcripción es correcta, cuadran
exactos** — y si no, hay un turno mal leído:

```
mañana (6 U + 3 CF1) × 12   = 108 h    (PDF: 108)
noche  (4 N)         × 12   =  48 h    (PDF:  48)
admón. (2 A)         ×  8,1 =  16,2 h  (PDF: 16,2)
TOTAL                       = 172,2 h  (PDF: 172)
```

**Dónde vive hoy.** `planes/founderos-rendimiento-y-cuarto-2026-08-26.md:218-221`.

**Por qué importa:** se repite cada mes, y es la única forma de saber que se leyó bien **sin volver
a mirar el PDF**.

---

## Trampas del entorno de trabajo

### 10. 🔴 Correr `npm run build` con el servidor de desarrollo encendido rompe los estilos

**Qué es.** Comparten la carpeta `.next`. El CSS servido queda en **9 bytes** y las páginas salen
sin estilos. **No hay error**: solo se ve mal.

**Dónde vive hoy. En ninguna parte del proyecto** — solo en `_USO_LOG.md`, y pasó **tres veces en
un mismo día**.

**Qué hacer:** matar el servidor, borrar `.next`, y recién ahí construir.

**Y el daño colateral que lo hace peor:** el primer screenshot de «antes» que se tomó para comparar
un cambio **salió sin estilos por esta causa**, así que la comparación no servía y hubo que
rehacerla.

---

### 11. Node no carga `.env.local` por su cuenta

**Qué es.** Un script suelto de Node **no ve** las variables de `.env.local` — eso lo hace el
framework, no el runtime. **29 llamadas a una API fallaron** con «no se pudo resolver el método de
autenticación» por esto.

**Dónde vive hoy.** `_USO_LOG.md`, agosto.

**Qué hacer:** leer el archivo y asignar a `process.env` explícitamente antes de usar la variable.

---

### 12. Un botón deshabilitado mata los enlaces que tiene adentro

**Qué es.** Un `<button disabled>` que envuelve un `<a>` **hace el enlace inalcanzable**: sale del
árbol de accesibilidad y no recibe el clic. El enlace se ve bien y no funciona.

**Dónde vive hoy.** `_USO_LOG.md` — se descubrió porque las piezas del calendario del Content OS no
abrían su ficha.

---

### 13. En un elemento posicionado en porcentaje, el alto también escala

**Qué es.** Un elemento cuyo tamaño es un porcentaje del contenedor crece cuando el contenedor
crece — **y hay que dividir por los dos ejes, no solo por uno.**

**Qué costó.** Dos veces el mismo bug, en ejes distintos: el personaje del FounderOS salió **3 veces
más grande** cuando el mundo se hizo más ancho, y **el doble de alto** cuando además se hizo más
alto. **Ninguna de las dos la caza el compilador: se ven mirando.**

**Dónde vive hoy.** Un comentario en `_LABS/videojuego-vida/app/globals.css` y `_USO_LOG.md`.

---

### 14. ⭐ Las etiquetas que se pisan no se arreglan a ojo — se miden

**Qué es.** En dos semanas, **seis veces** una etiqueta quedó encima de otra cosa (una lámpara, el
personaje, otras etiquetas). Cada vez se corrigió moviéndola a ojo, y cada vez volvió a fallar.

**Lo que sí funcionó:** escribir una comprobación que **compara el rectángulo de cada etiqueta
contra los demás en el DOM** y devuelve el número de choques. Dio los huecos válidos en un segundo,
y llevó los choques a cero.

**Dónde vive hoy.** `_USO_LOG.md`, entradas del 26 al 28 de agosto.

**La lección, que es la del proyecto entero:** cuando un error se repite, **el arreglo no es otra
corrección — es un mecanismo que lo mida.** Es exactamente el criterio de `PROTECCIONES.md`: *si la
regla no lo paró, hace falta un mecanismo, no otra regla.*

---

## Dónde debería vivir cada uno

Ninguno de estos catorce tiene casa. **Esta es la propuesta, y no se ejecuta en esta ola** — la
Ola 1 solo rescata:

| Saberes | Casa propuesta |
|---|---|
| 1, 2, 3, 4 — despliegue | Un `DESPLIEGUE.md` en `SISTEMA/`, o el SOP de despliegue |
| 5, 6 — claves y políticas de fila | El mismo, o una nota junto a cada `.env.local.example` |
| 7, 8, 9 — el cuadro | `KNOWLEDGE_PACKS/FOUNDER/PATRON_TURNOS.md`, que ya tiene el 7 |
| 10, 11, 12, 13, 14 — trampas del entorno | Un `TRAMPAS.md` en `SISTEMA/`, o el `CLAUDE.md` de cada app |

⚠️ **Mover cualquiera de estos exige tocar un archivo existente, y esta ola no lo permite.** Queda
como decisión.
