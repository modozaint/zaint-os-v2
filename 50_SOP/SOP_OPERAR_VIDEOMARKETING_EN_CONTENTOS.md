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
4. Clasificar la idea en Brújula con pilar y nivel antes de analizarla. La
   Brújula productiva vive en
   `https://dermatinta-content-os.vercel.app/estrategia?marca=modozaint`.
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

## Ejecución verificable

- La Brújula se desplegó en producción con el commit `673ffa2` del repositorio
  productivo y el despliegue Vercel `56k8j6vgnHodhRc5ZY3NPaDTDUf5` en estado
  `Ready`.
- Se registró una segunda idea, firmada por Santiago, sin publicar ni
  sincronizar redes: `¿Cómo paso de una idea real a un guion sin que la IA
  invente mi historia?`.
- Clasificación confirmada en interfaz: pilar `Sistemas de contenido`, nivel
  `Nutrición (33%)`, tipo `Reel`, estado `idea`.
- La acción `Analizar` no se ejecutó: el endpoint puede invocar Claude con la
  clave configurada y consumir API. Requiere autorización expresa antes de
  generar brief, hooks y guion.
