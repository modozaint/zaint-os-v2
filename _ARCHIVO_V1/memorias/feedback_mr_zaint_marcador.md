---
name: feedback-mr-zaint-marcador
description: Santiago pide que los mensajes finales empiecen con "MR zaint" para detectar cuándo se degrada el contexto.
metadata:
  type: feedback
---

Empezar **siempre el mensaje final de cada turno** con `MR zaint`.

**Por qué:** es el canario de Santiago para saber cuándo el contexto empieza a fallar. Si un mensaje de cierre llega sin ese marcador, él sabe que se perdió parte del hilo y que conviene recargar contexto o abrir sesión nueva.

**How to apply:** va al inicio del mensaje de cierre del turno, antes de cualquier otro contenido. No hace falta repetirlo en mensajes intermedios del mismo turno. Pedido el 2026-08-12.

Relacionado: [[feedback-estandar-verificacion]]
