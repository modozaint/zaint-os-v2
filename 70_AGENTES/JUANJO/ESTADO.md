---
agente: juanjo
updated: 2026-08-28
---

# Juanjo · Estado

> Se sobreescribe entero. Máx. 40 líneas. Nunca crece.

**Última corrida:** 2026-08-28 (segunda, misma jornada) — **peritaje completo del pack de edición
que Santiago acabó de bajar.** *«Todo está descargado pero no instalado, todo es para usar y
exprimir al máximo.»*

## Lo que quedó hecho
- **`CONTENIDO/CATALOGO_RECURSOS_EDICION.md`** — 4.856 archivos revisados con ffprobe, con veredicto
  por carpeta y un kit de arranque de 30 archivos.
- **`CONTENIDO/MANUAL_EDICION.md`** — el oficio, los números y las reglas de montaje.
- **34+ íconos convertidos** a WebM con alfa en `PRESETS EDICION/_KIT ZAINT/iconos/`
  (`Bag_In`: 5,15 MB → 345 KB, transparencia intacta). Script reanudable: `_KIT ZAINT/convertir-alfa.sh`.
- 🔒 **`PRESETS EDICION/` excluido de git.** Iban a entrar 9,91 GB al repo en el próximo `git add -A`.

## Lo que encontré (verificado, no inferido)
- **9,91 GB · 4.856 archivos · 33 carpetas.** El problema no es que falte: es que sobra.
- 🔴 **978 duplicados exactos = 1,45 GB.** `3D Assets/` (946 MB) es copia de dos archivos de `3D/`.
- 🔴 **~1 GB no sirve para video:** 627 `.xmp` (Lightroom), 80 `.icc` (impresión), 34 `.ffx` (After Effects).
- ⭐ **Lo mejor: 61 íconos animados con transparencia real** (pares `_In` de 2 s y `-Loop` de 4 s).
- ⭐ **1.915 SFX**, y entre ellos **4 sets afinados por nota** (12 notas cada uno) para que las
  listas suban medio tono por ítem.
- ⚠️ **Green screen ≠ transparencia.** La pirámide de oro (779 MB) y el carro son croma, no alfa.
- ⚠️ **Framerates mezclados** (25, 29,97 y 30). El proyecto va a 30.
- 🔴 **Las 12 «escenas de películas» están a 1168×480** y son material de terceros: bajan el alcance
  por contenido no original.

## Lo que quedó a medias
1. 🔴 **El estilo sigue sin decidir** (`MANUAL_EDICION` §1: tres estéticas escritas, ninguna probada).
   Se cierra montando un video, no escribiendo otro documento.
2. 🟡 **Faltan de convertir** los 5 clips 2D, los 10 logos de redes y las 3 líneas animadas.
3. 🟡 **La limpieza de 1,45 GB está propuesta, no ejecutada** — es material comprado, la tijera es de Santiago.
4. ⏸️ **Ningún video montado todavía.** Sin eso, esto sigue siendo preparación.
