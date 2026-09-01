# Importaciones de agentes para Buzz

Estos archivos son snapshots individuales para importar desde Buzz Desktop.

## Orden de importacion

1. `xiomara.agent.json`
2. `modozaint.agent.json`
3. `contenido.agent.json`
4. `copy.agent.json`
5. `juanjo.agent.json`
6. `video.agent.json`
7. `dermatinta.agent.json`
8. `kaizen.agent.json`
9. `hoy.agent.json`

## Configuracion

- Claude Code usa el alias `sonnet`, compatible con la suscripcion Claude Pro.
- Codex usa `gpt-5.4-mini`, disponible para tareas de iteracion y estado con ChatGPT Plus.
- No se usan modelos Fable, API keys ni variables de entorno.
- Importa un archivo por vez y confirma la previsualizacion antes del siguiente.
- Estos archivos no incluyen `ORQUESTADOR` ni `CLAUDE PRINCIPAL` para evitar duplicarlos.
- Despues de importar, anade los agentes a los equipos y canales definidos en V2.

La funcion canonica de cada agente permanece en `70_AGENTES/<AGENTE>/00_ENTRAR.md`.
El snapshot es una configuracion de Buzz, no una segunda fuente de verdad.
