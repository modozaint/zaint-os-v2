---
tags: [modozaint-v2, zagencia, ofertas, servicios-ia]
updated: 2026-09-01
tipo: arquitectura-de-ofertas
status: framework-draft
---

# Arquitectura de ofertas de Zagencia

Zagencia es la agencia/línea comercial de IA bajo MODOZAINT. Este documento organiza familias de
oferta; no aprueba todavía precios, claims, segmentos ni una oferta final.

## Jerarquía

```text
MODOZAINT  = marca personal, autoridad, contenido y entrada comercial
└── Zagencia = agencia de IA y soluciones para negocios
    ├── Diagnóstico y diseño
    ├── Implementaciones
    ├── Automatizaciones
    ├── Soluciones personalizadas
    └── Optimización y acompañamiento
```

## Líneas candidatas

| Línea | Qué compra el cliente | Alcance esperado | Riesgo a controlar |
|---|---|---|---|
| Diagnóstico y diseño | Claridad sobre dónde aplicar IA | Auditoría, mapa de procesos y plan priorizado | Que se vuelva consultoría abstracta sin ejecución |
| Implementación | Un sistema definido funcionando | Configuración, integración, pruebas y entrega | Alcance, accesos, datos y soporte posterior |
| Automatización | Eliminar una tarea repetitiva | Workflow acotado con entradas, salidas y métricas | Automatizar un problema que aún no está validado |
| Personalizada | Resolver una operación particular | Descubrimiento, diseño y construcción bajo alcance | Convertirse en desarrollo infinito a medida |
| Optimización | Mejorar un sistema existente | Mantenimiento, iteración y medición | Cobrar recurrencia sin resultado observable |

## Regla de diseño

Cada oferta debe describir una transformación operativa, no una tecnología:

- problema observable;
- cliente específico;
- entrada y salida;
- entregables;
- exclusiones;
- tiempo de implementación;
- accesos y responsabilidades;
- métrica antes/después;
- precio y forma de soporte, cuando se aprueben.

## Relación con los laboratorios

- **Dermatinta:** prueba adquisición, atención, conversión, ecommerce y recompra.
- **House of Kaizen:** prueba cotización, seguimiento, pedidos y operación artesanal.
- Una capacidad entra a Zagencia cuando resuelve un problema real y puede explicarse de forma
  reutilizable; no solo porque se construyó una vez.

## Qué no se hará todavía

- No publicar una página de servicios definitiva.
- No fijar precios sin definir alcance y economía de entrega.
- No prometer agentes autónomos o resultados de ventas sin evidencia.
- No construir un SaaS completo antes de vender y repetir una implementación.
- No abrir todas las líneas a la vez: se elegirá una línea inicial y se mantendrán las demás como
  candidatas.

## Siguiente trabajo

1. Auditar las capacidades existentes de LeadHunter, n8n y los flujos de Nexum.
2. Clasificar cada capacidad como agente, skill, workflow, servicio o activo comercial.
3. Elegir un problema común entre Dermatinta y House of Kaizen.
4. Crear una demostración mínima y medirla.
5. Redactar la primera oferta de Zagencia solo después de esa evidencia.
