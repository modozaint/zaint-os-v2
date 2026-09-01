---
tags: [modozaint-v2, capcut, media, activos, qa]
updated: 2026-09-01
tipo: sop
status: operativo-inicial
---

# SOP: auditar la biblioteca de CapCut

## Objetivo

Convertir una biblioteca aproximada de 20 GB en un inventario reutilizable para MODOZAINT,
Dermatinta y House of Kaizen sin borrar, mover ni sobrescribir material original.

## Fases reversibles

1. Registrar ruta raíz, tamaño, extensión, fecha y hash opcional por archivo.
2. Separar proyectos editables, videos fuente, audio, tipografías, imágenes, overlays, exports y
   duplicados probables.
3. Crear miniaturas o proxies solo en una carpeta de trabajo, nunca junto al original.
4. Muestrear por categoría y etiquetar uso potencial, marca, derechos, calidad y estado.
5. Crear un catálogo de “reutilizar”, “revisar”, “archivar” y “no usar”.
6. Hacer que Juanjo pruebe un lote pequeño en una pieza real.

## Reglas

- No borrar ni renombrar originales durante la auditoría.
- No asumir que un recurso tiene licencia comercial por estar guardado localmente.
- No subir la biblioteca completa a un servicio externo sin revisar privacidad, derechos y tamaño.
- No cargar los 20 GB a un agente: el agente recibe un índice y los archivos seleccionados.
- El catálogo debe conservar ruta original y motivo de clasificación.

## Salida mínima

- `inventario.csv` o equivalente con ruta, tipo, tamaño, fecha y estado.
- `catalogo_activos.md` con los mejores recursos por uso.
- `muestra_qa.md` con piezas probadas, problema encontrado y decisión.
- lista de licencias o dudas de derechos.

## Criterio de terminado

Juanjo puede encontrar y reutilizar un activo en menos de cinco minutos sin abrir toda la biblioteca,
y una pieza de prueba mejora en tiempo, claridad o calidad frente al flujo anterior.
