---
tags: [modozaint-v2, agentes, runtimes, skills, apps]
updated: 2026-09-01
tipo: registro-operativo
status: draft-operativo
---

# Registro operativo de agentes y runtimes

Este archivo organiza el sistema sin convertir una aplicación o un modelo en fuente de verdad. La
función vive en `70_AGENTES/<NOMBRE>/00_ENTRAR.md`; la disponibilidad concreta de una app o modelo se
verifica en el selector o instalación antes de usarla.

## Regla de selección

1. El **agente** define el problema, el alcance y la salida.
2. La **skill/app** aporta la capacidad necesaria.
3. El **modelo** se elige por el tipo de trabajo, no por costumbre.
4. El **workflow/SOP** fija la secuencia repetible.
5. El **servicio** conserva el estado vivo: GitHub, Shopify, Hostinger, n8n, Supabase u otro.
6. El **conocimiento** aporta identidad, evidencia y decisiones; no se copia entero al prompt.

## Mapa inicial

| Agente | Función | App/runtime recomendado | Modelo inicial | Escalado |
|---|---|---|---|---|
| ORQUESTADOR | Coordinar, enrutar, verificar y cerrar | Codex con acceso al checkout | OpenAI de alta capacidad | Claude para síntesis estratégica larga |
| Xiomara | Público, posicionamiento, tesis de marca | Claude para síntesis de contexto | Claude equilibrado | Claude de máxima capacidad |
| MODOZAINT | Narrativa, autoridad y distribución | Content OS + Claude para estrategia; Codex para leer/escribir V2 | Claude equilibrado | Claude de máxima capacidad |
| Contenido | Guiones y piezas | Content OS como sistema de planificación; Claude para piezas con contexto | Claude equilibrado | Claude de máxima capacidad |
| Copy | Captions, CTA y variantes | ChatGPT/Codex para iteración corta | OpenAI rápido/equilibrado | Claude si exige voz de marca extensa |
| Juanjo | Edición, montaje y especificación visual | ChatGPT/Codex para instrucciones; herramienta de edición para ejecutar | OpenAI rápido/equilibrado | Claude para análisis de pieza compleja |
| Video | Destilar fuentes externas en aprendizaje | Claude para transcripciones y síntesis | Claude equilibrado | Modelo de máxima capacidad solo si cruza fuentes |
| Dermatinta | Operar el laboratorio ecommerce | Content OS para contenido/métricas; Codex para repo/documentos; Shopify solo conectado | Claude para criterio; OpenAI para estado | ORQUESTADOR revisa cambios de riesgo |
| Kaizen | Costear, cotizar y operar taller | Codex para archivos; hoja financiera como fuente viva | OpenAI equilibrado | Claude para reconstruir precedentes |
| Hoy | Elegir una acción concreta | Codex/ChatGPT | OpenAI rápido/equilibrado | OpenAI de alta capacidad si hay conflicto |

## Qué significa “mejor”

- **Codex:** mejor cuando hay que inspeccionar el repositorio, editar archivos, verificar Git o
  ejecutar pruebas reproducibles.
- **Claude:** mejor cuando hay que sostener contexto largo, sintetizar identidad, investigar una
  decisión o cerrar una pieza estratégica.
- **ChatGPT/OpenAI:** mejor para coordinación con herramientas disponibles, entrevistas cortas,
  reescrituras y estados operativos.
- **Herramientas especializadas:** se activan por tarea, no se convierten en agentes. Ejemplos:
  edición de video, navegador, Shopify, hojas, generación de imágenes o documentos.

## Criterio de activación

- Un agente por defecto; varios solo si las salidas son independientes y el handoff está escrito.
- Contexto mínimo: entrada común, estado del agente y una fuente de dominio.
- No abrir todos los agentes para una tarea de MODOZAINT.
- No construir un sistema multiagente nuevo mientras el flujo manual no tenga una repetición probada.
- No publicar ni gastar desde un agente.
- Un modelo distinto es una hipótesis hasta medir calidad, coste y tiempo en tareas comparables.

## Estado

La matriz es una asignación inicial, no una evaluación definitiva. La disponibilidad de modelos,
conectores y límites debe verificarse en la app concreta antes de configurar cada agente.
