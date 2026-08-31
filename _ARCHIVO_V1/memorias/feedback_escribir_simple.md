---
name: feedback-escribir-simple
description: "Santiago dijo el 2026-08-26 que no entiende respuestas cargadas de tablas y detalle tecnico. La respuesta va corta y en su idioma."
metadata:
  node_type: memory
  type: feedback
---

**Textual, 2026-08-26:** *«no entiendo bien esas cosas que me dice»*, despues de una respuesta con
cinco tablas, nombres de columnas de Postgres, scopes de OAuth y fechas de expiracion de tokens.

**Que hacer distinto:**

- **Primero la conclusion en una frase**, en sus palabras. Despues, si hace falta, el detalle.
- **Una tabla por respuesta como maximo**, y solo si compara cosas que el va a decidir.
- **El detalle tecnico va al plan en `planes/`, no al chat.** El plan lo lee un agente; el chat lo
  lee el. Son dos publicos distintos y confundirlos es lo que produjo la queja.
- Nada de nombres de columnas, scopes, hashes ni jerga de base de datos en la respuesta \u2014 salvo que
  el pregunte por eso.
- Cuando le levante un riesgo y el lo descarte, **se cierra y no se vuelve a mencionar**. Paso el
  2026-08-26 con lo que grabo Victor: su respuesta fue que las diferencias de estilo son a
  proposito, *«esas cositas minimas que se cambian son lo que hace que se sientan como nosotros»*.

**Why:** el trabajo de MARCOS es que Santiago gaste lo minimo leyendo y escribiendo. Una respuesta
que hay que descifrar traslada el trabajo de vuelta a el, que es exactamente lo contrario del
encargo del 2026-08-23: *«no gastar tanto como solo yo escribiendo o hablando»*.

**How to apply:** al cerrar una respuesta, preguntarse si un no-programador la entiende de una
pasada. Si no, sobra la mitad. Relacionado: [[feedback-rol-planeador]],
[[feedback-chats-especializados]], [[user_santiago]].
