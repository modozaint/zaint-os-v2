---
name: estandar-verificacion-loop
description: "El estándar que Santiago pidió (2026-08-02) — no reportar nada como hecho sin comprobarlo contra el sistema vivo, con la salida a la vista."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 312dc5ae-ce6a-4053-b924-ecef3ad1534c
  modified: 2026-08-03T17:32:00.019Z
---

Santiago pidió trabajar "con loops y estándares: que no me devuelvas una solución hasta que no se cumplan esos estándares". Salió de un día concreto en el que le afirmé tres cosas que eran falsas.

**Why:** las tres fallaron por la misma causa — **inferí el estado desde un artefacto en vez de consultarlo donde vive**:
- Dije "el Módulo 3 no está cableado" tras buscar en UN archivo (`motor/sync`); estaba hecho en `/api/motor/seguimiento`, con su commit `971fc51 seguimiento REAL`.
- Dije "desplegado y vivo" leyendo la salida del build; el servidor seguía en un commit viejo porque estaba parado en otra rama.
- Dije que el flujo de contacto de n8n estaba inactivo por el `active:false` del JSON del repo; en n8n real estaba publicado.

Además, tres fallas distintas se disfrazaron del mismo mensaje inocuo ("no se encontraron perfiles"): actor de Apify bloqueado por plan gratis, código sin desplegar, y potencial fallo del análisis. Un vacío sin investigar cuesta horas.

**How to apply — los cinco:**
1. **La verdad está en el sistema vivo, no en el archivo.** Repo ≠ servidor · build ≠ desplegado · JSON del repo ≠ n8n · doc ≠ producción. Antes de afirmar un estado, consultarlo donde vive.
2. **Nada se reporta hecho sin una comprobación que pudiera haber fallado**, y la comprobación va con su salida a la vista. Si no la puedo correr, decirlo explícitamente en vez de inferir.
3. **Vacío no es éxito.** Un resultado en cero se investiga hasta encontrar la causa antes de aceptarlo como "no hay datos".
4. **Un solo comando bloqueante por mensaje.** El `git checkout main` se perdió entre párrafos y costó dos rondas completas.
5. **"Terminado" = está en manos de alguien, o corriendo solo.** Ni "el código funciona" ni "el HTML está listo" ([[patron-ultimo-5-por-ciento]]).

**Cierre del loop:** cada entrega termina con el chequeo del paso 2 pegado en la respuesta. Si el chequeo no se puede correr, la entrega se marca como **no verificada**, no como hecha.
