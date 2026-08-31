---
name: project-leadhunter-v1
description: LeadHunter v1 es el primer producto terminado de ZAINT (16-ago-2026); dónde vive, qué lo cierra y la lección de los bloqueos de LinkedIn.
metadata:
  type: project
---

**LeadHunter v1 — primer producto TERMINADO de ZAINT**, cerrado el 16 de agosto de 2026.
Prospección en LinkedIn de punta a punta: extrae, juzga con IA, escribe, conversa y agenda.

**Dónde vive cada cosa:**
- Ficha del producto: `SOLUCIONES_IA/PRODUCTOS/leadhunter-v1.md`
- Criterio de «terminado» (4 puertas): `SOLUCIONES_IA/PRODUCTOS/README.md`
- Código: `_LABS/nexum-leadhunter/app/` — **ahí manda, la ficha no lo copia**
- Producción: `leads.modozaint.online` + 6 flujos de n8n

**La carpeta `PRODUCTOS/` es nueva y tiene una regla:** guarda solo lo que ya está
construido y se puede vender hoy. `BANCO_SOLUCIONES/` es lo que se PUEDE construir. La
puerta que las separa es «produjo un resultado real con alguien de afuera».

**Lo que lo cierra:** Daniel Martínez, CEO y cofundador de The Mente Digital (agencia de
Medellín, 32 personas), contactado **en frío por el sistema**. Respondió «Hablemos».
Reunión el viernes 21-ago 14:00. El mensaje que consiguió esa respuesta lo escribió el
sistema, no Santiago.

**La lección más cara — la cuenta de LinkedIn es infraestructura, no un detalle.** Se
bloqueó 3 veces en 10 días (11, 13, 15-ago). **No fue el volumen** (3-6/día contra ~100
semanales de tope): fue la forma. `TOPE_POR_CICLO=5` existía pero el bucle mandaba las
cinco seguidas — salieron 5 invitaciones en 2 segundos. **Un tope sin pausa no es un tope.**
Cuatro candados puestos el 16-ago: 1 por ciclo · lo vencido +6h se reprograma · pausa de
90s medida en disco · al caerse el servicio el envío se frena solo y al volver NO arranca
solo.

**Esto va en la venta, no se esconde:** diagnóstico de la cuenta del cliente antes de
firmar, calentamiento declarado de 2 semanas, y no reconectar más de una vez por semana.
