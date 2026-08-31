---
tags: [modozaint-v2, agentes, buzz]
updated: 2026-08-29
tipo: guia
---

# Cómo usar los agentes en Buzz

## ORQUESTADOR

1. Abre la actualización del agente existente en Buzz.
2. Usa `70_AGENTES/ORQUESTADOR/00_ENTRAR.md` como instrucciones.
3. Configura el modelo inicial indicado en `70_AGENTES/ORQUESTADOR/MODELOS.md` si está disponible
   en la instalación actual.
4. El propietario revisa y guarda el borrador. Un borrador no significa que el cambio ya se aplicó.
5. Ejecuta los casos de `70_AGENTES/ORQUESTADOR/EVALS.md`.

## Los nueve agentes portables

Cada subcarpeta tiene una única puerta: `70_AGENTES/<AGENTE>/00_ENTRAR.md`. Ese archivo es una
instrucción revisable e independiente del proveedor. No abras un segundo agente en Buzz hasta que
ORQUESTADOR haya pasado sus evaluaciones.

Al abrir cada agente después:

- usa el nombre y oficio del portable;
- pega únicamente su archivo, no todos;
- asigna el modelo por `70_AGENTES/MODELOS.md` y por los resultados medidos;
- invítalo solo a los canales donde su sección "Cuándo hablo" sea pertinente.

La identidad, los precios y el estado vivo no se pegan en la instrucción: se consultan mediante el
router.
