---
id: TASK_2026_09_03_CONTENT_OS_MODOZAINT
owner: ORQUESTADOR
reviewer: Santiago
status: partial
class: S2
created: 2026-09-03
updated: 2026-09-03
---

# Resultado esperado

Operar ContentOS solo para MODOZAINT: dejar la pieza final de presentacion
agendada para hoy con su ficha de contenido y preparar la captura de metricas
de TikTok sin publicar ni borrar datos historicos.

## Fuentes minimas

- `CLAUDE.md`
- `00_NORTE/AGENT_ROUTER.md`
- `50_SOP/TAREA_Y_HANDOFF.md`
- `80_PRODUCTOS/CONTENT_OS/app/lib/marcas.ts`
- `80_PRODUCTOS/CONTENT_OS/app/lib/tiktokClient.ts`
- Video final: `C:\Users\Zaint}\AppData\Local\CapCut\Videos\0903(1)\0903(1).mp4`

## Rutas excluidas por defecto

- `C:\DEPARTAMENTO MODOZAINT/**` (V1) salvo consulta de lectura puntual.
- Credenciales, `.env*`, tokens, datos de terceros y archivos de video binarios.
- Publicacion externa en Instagram o TikTok.

## Entregable

- ContentOS con MODOZAINT como unica marca operativa y unica candidata a sync de Instagram/TikTok.
- Una pieza `editada` de MODOZAINT con `fecha_objetivo=2026-09-03`, guion/ficha y referencia al video final.
- Ruta de OAuth TikTok limitada a MODOZAINT, sin conectar ni sincronizar hasta autorizacion de Santiago.

## Limites y presupuesto

- No borrar filas historicas, credenciales ni metricas de Dermatinta o House of Kaizen.
- No desplegar, publicar, ni iniciar OAuth TikTok sin autorizacion expresa.
- No inventar ni reconstruir el guion: se guarda el texto exacto aprobado por Santiago.

## Criterio de terminado

- La aplicacion muestra MODOZAINT como unica marca operativa.
- La sincronizacion de Instagram solo considera MODOZAINT aun si permanecen variables antiguas.
- TikTok solo ofrece conectar MODOZAINT y conserva sus metricas separadas de Instagram.
- La ficha existe en ContentOS con fecha de hoy y se puede abrir por URL.

## Evidencia de cierre

- Diff de configuracion y build que compile con las variables de produccion.
- URL de la ficha de rodaje y fila visible en Plan/Calendario.
- Captura o respuesta de la API que confirme la conexion TikTok de MODOZAINT, cuando se autorice.

## Bloqueo actual

- Produccion requiere inicio de sesion del equipo; no se pidio ni se manipulo la contrasena.
- Falta recibir o localizar el texto exacto del guion de ChatGPT para no inventar la ficha.
- El checkout no tiene `.env.local`; el build compila pero no puede recolectar paginas que leen Supabase.

## Siguiente responsable

Santiago: iniciar sesion en ContentOS como Santiago y pegar o indicar la ruta del guion exacto.
ORQUESTADOR: crear la pieza, asignar fecha y verificar el registro; luego preparar OAuth TikTok de MODOZAINT si Santiago lo autoriza.
