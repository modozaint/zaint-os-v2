---
tags: [modozaint-v2, content-os, adquisicion, contenido, integracion]
updated: 2026-09-01
tipo: contrato-operativo
status: draft-operativo
---

# Contrato operativo del Content OS

## Propósito

Content OS es el sistema operativo de contenido y adquisición: captura datos de redes, conserva
historial, ayuda a planificar piezas, permite analizar resultados y convierte aprendizaje en la
próxima acción. No reemplaza al orquestador ni se convierte en la memoria completa del negocio.

## Marcas y salidas

| Marca | Objetivo de adquisición | Conversión que se mide |
|---|---|---|
| MODOZAINT | Autoridad, comunidad y conversaciones B2B para Zagencia | DM, diagnóstico, propuesta, cierre |
| Dermatinta | Descubrimiento, confianza y ventas ecommerce | Sesión, checkout, venta, reseña, recompra |
| House of Kaizen | Comunidad de tufting y demanda de piezas/insumos | Comentario, DM, lista, preventa, pedido |

Las marcas comparten aprendizaje de sistema, pero no mezclan identidad, audiencia, métricas ni
clientes. Una pieza siempre tiene `marca`, `autor`, `objetivo`, `estado` y fuente verificable.

## Cadena del sistema

```text
idea o señal real
  -> Content OS: registrar, enriquecer, planificar
  -> agentes: público -> guion -> copy -> edición
  -> Santiago: aprobar y publicar
  -> redes: métricas y conversaciones
  -> Content OS: medir y aprender
  -> ORQUESTADOR: elegir siguiente acción
```

LeadHunter es un sistema paralelo de adquisición B2B. Puede recibir una tesis, segmento, oferta y
prueba desde MODOZAINT, pero no debe inventarlas ni publicar contenido por el Content OS.

## Responsabilidad por capa

- **Content OS:** datos de contenido, calendario, piezas, métricas, referentes y chat contextual.
- **Xiomara:** decide público, posicionamiento y ángulo.
- **Contenido:** transforma el ángulo en guion.
- **Copy:** escribe caption y CTA.
- **Juanjo:** especifica montaje y edición.
- **MODOZAINT:** convierte hechos y resultados en capítulos del documental.
- **Dermatinta/Kaizen:** operan cada marca sin invadir otra identidad.
- **ORQUESTADOR:** enruta, verifica y decide la siguiente acción.
- **Santiago:** aprueba publicaciones, gasto y contacto comercial sensible.

## Modelo de datos mínimo

Cada pieza debe conservar, como mínimo:

- marca;
- autor original;
- objetivo del embudo;
- público/persona;
- estado: idea, analizada, agendada, producida, publicada, medida;
- fuente de la idea;
- fecha de publicación, si existe;
- métricas con fecha y plataforma;
- resultado de negocio, si existe;
- aprendizaje o decisión que cambió.

## Métricas que importan

- **MODOZAINT:** conversaciones B2B calificadas, diagnósticos, propuestas y cierres; alcance es
  señal auxiliar, no ingreso.
- **Dermatinta:** sesiones, add-to-cart, checkout, ventas, margen, reseñas y recompra.
- **House of Kaizen:** comentarios con intención, DMs, solicitudes de catálogo/lista, preventas y
  pedidos con margen.
- **Sistema:** tiempo de idea a publicación, piezas publicadas, aprendizaje aplicado y errores
  repetidos.

## Principios de operación

1. Una fuente mínima por tarea; no cargar el vault completo al chat.
2. Una idea no se duplica en otra tabla o agente.
3. El sistema propone y prepara; Santiago publica y aprueba contacto o gasto.
4. Un resultado no se declara hasta verificarse en la plataforma o sistema vivo.
5. Las API keys y tokens viven en `.env.local` o el secreto del proveedor, nunca en Git ni en prompts.
6. La iteración del sistema se justifica por una fricción observada, no por agregar funciones.
