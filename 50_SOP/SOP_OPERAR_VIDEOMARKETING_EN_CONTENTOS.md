---
tipo: sop
estado: operativo_parcial
owner: Contenido
reviewer: ORQUESTADOR
updated: 2026-09-05
fuente_app: https://dermatinta-content-os.vercel.app
---

# SOP: Operar Videomarketing en ContentOS

## Objetivo

Convertir una idea real de MODOZAINT en una pieza trazable sin duplicarla en
Markdown ni publicar nada por accidente.

## Entrada mínima de Santiago

```text
MODOZAINT - [idea en una frase].
Lo que es verdad acá: [hecho, proceso o historia propia].
Tengo para mostrar: [pantalla / grabación / producto / proceso / nada].
```

## Flujo operativo

1. Entrar a ContentOS con la sesión del equipo y seleccionar `Santiago` como
   firma de autor.
2. Abrir `Plan` con `marca=modozaint` y confirmar que el selector dice
   `MODOZAINT`.
3. Anotar la frase en el Banco de ideas. Eso crea una fila `pieza` en estado
   `idea`; no se crea un archivo ni una tabla paralela.
4. Tras desplegar la Brújula, clasificar la idea con pilar y nivel antes de
   analizarla. Mientras `/estrategia` responda `404` en producción, esta
   clasificación es un bloqueo visible, no un dato que se inventa.
5. Antes de generar ficha o guion, Contenido valida el hecho propio y el
   material disponible. Si falta evidencia, escribe `[VERIFICAR: ...]` o se
   detiene.
6. Analizar actualiza la misma `pieza` con brief, hooks y guion. No se genera
   una segunda pieza para la misma idea.
7. Rodaje registra el material real; Plan mueve la misma pieza entre
   `idea -> guionizada -> grabada -> editada -> publicada`.
8. Publicar, programar y sincronizar redes requieren autorización explícita de
   Santiago. Luego de publicar, Instagram aporta métricas; TikTok se registra
   manualmente mientras no tenga API conectada.
9. Contenido registra el aprendizaje verificable en el módulo 08 del pack de
   MODOZAINT. ORQUESTADOR revisa que la evidencia exista antes de cerrar.

## Paradas obligatorias

- No hay firma `Santiago` o la app no puede guardar: detener y registrar el
  error exacto.
- La idea no tiene hecho propio ni recurso disponible: no generar guion.
- La Brújula no está desplegada: guardar la idea, pero no declarar pilar/nivel
  como confirmados.
- No hay autorización de publicación: la pieza no pasa a `publicada`.

## Prueba inicial

- Fecha: 2026-09-05.
- Pieza: `fae13d79-a6b5-43d9-a70f-549a5eb729d4`.
- Idea: `Estoy construyendo ContentOS para convertir una idea real en un video
  sin depender de la inspiración.`
- Marca: MODOZAINT. Autor: Santiago. Tipo: Reel. Estado: `idea`.
- Evidencia: aparece en el Pipeline de producción como IDEA, con acción
  `Analizar`; no se publicó ni se sincronizó ninguna red.

## Pendiente técnico

La producción actual no incluye `/estrategia`: responde `404`. El cambio local
que integra la Brújula está en el commit `cba2981`; falta vincular el checkout
al proyecto Vercel existente y desplegarlo antes de cerrar la clasificación por
pilar/nivel y el SOP como completamente operativo.
