# LeadHunter en el VPS

> El sistema corre solo, sin depender de la máquina de Santiago.
> Servidor: Hostinger KVM 1, Ubuntu 24.04, IP `2.25.92.88`
> (hostname `srv1868334.hstgr.cloud`).

## Cómo está armado

El VPS vino con **n8n en Docker detrás de Traefik**. Traefik es quien escucha
en los puertos 80/443 y emite los certificados HTTPS solo (resolver
`mytlschallenge`). Por eso el LeadHunter **no usa nginx ni certbot**: entra como
un contenedor más en la misma red (`n8n_default`) y Traefik lo publica.

```
Internet ──▶ Traefik ──┬──▶ n8n         (n8n.srv1868334.hstgr.cloud)
                       └──▶ leadhunter  (leads.modozaint.online)
```

Ventaja lateral: n8n puede llamar a la app por su nombre interno
(`http://leadhunter:3000`) sin salir a internet — más rápido y sin depender del
certificado.

| Cosa | Dónde |
|---|---|
| Código | `/docker/leadhunter` (clon de `modozaint/nexum-leadhunter`, privado) |
| Claves | `/docker/leadhunter/.env.local` (nunca en git) |
| Host público | `/docker/leadhunter/.env` → `LEADHUNTER_HOST` |
| Datos (leads) | volumen Docker `leadhunter_datos`, montado en `/datos` |
| n8n | `/docker/n8n` |

## Las llaves

`proxy.ts` protege la app con **una puerta y dos llaves**:

- `APP_PASSWORD` → contraseña del navegador (usuario `zaint`).
- `CRON_SECRET` → token para n8n (`Authorization: Bearer <token>`).

Ambas se generaron en el servidor y viven en `.env.local`. Para verlas:

```bash
ssh root@2.25.92.88 "grep -E 'APP_PASSWORD|CRON_SECRET' /docker/leadhunter/.env.local"
```

> Sin `APP_PASSWORD` la app queda abierta. En el VPS nunca se deja vacía:
> cualquiera que encuentre la URL podría lanzar extracciones que se pagan con
> la tarjeta (Apify + Anthropic).

## Operación diaria

```bash
# Ver el estado
docker ps

# Logs en vivo
cd /docker/leadhunter && docker compose logs -f

# Reiniciar
cd /docker/leadhunter && docker compose restart

# Publicar cambios (después de un push a GitHub)
cd /docker/leadhunter && git pull && docker compose up -d --build
```

Desde la máquina de Santiago, publicar cambios al repo:

```bash
cd "C:\DEPARTAMENTO MODOZAINT"
git subtree push --prefix=_LABS/nexum-leadhunter/app https://github.com/modozaint/nexum-leadhunter.git main
```

## Conectar n8n

1. En n8n: **Import from File** → `n8n/leadhunter-setter.json`.
2. En el nodo *Motor sync*, poner el `CRON_SECRET` real en la cabecera.
3. **Test workflow**: debe devolver `{"ok":true,...}`. Si da 401, el token está mal.
4. Activar.

El flujo llama a `http://leadhunter:3000/api/motor/sync` cada 15 minutos: lee los
mensajes nuevos de LinkedIn (Unipile), los responde con el setter y agenda en
Cal.com cuando el lead acepta.

> El segundo flujo —**contacto** con cadencia, que invita de a un lead por vez
> con esperas irregulares— llama a **`/api/motor/contactar`** (no a
> `/api/contactar/real`, que es la ruta de simulación). Es el endpoint que tiene
> la cadencia, el freno de mano y el tope por ciclo.
>
> Los flujos viven en `n8n/`. Traen el token de ejemplo
> `CAMBIAR_POR_TU_CRON_SECRET`: hay que reemplazarlo por el `CRON_SECRET` real al
> importarlos, y **activarlos a mano** (vienen con `active: false`).
>
> | Archivo | Cada | Qué hace |
> |---|---|---|
> | `leadhunter-contacto.json` | 20 min | Manda las solicitudes con su nota |
> | `leadhunter-conversacion.json` | 15 min | Detecta quién aceptó, conversa y agenda |
> | `leadhunter-seguimiento.json` | 4 h | Insiste con quien no contestó |
> | `leadhunter-recordatorio.json` | 15 min | Avisa al lead antes de la reunión |
> | `leadhunter-avisos.json` | 15 min | Avisa **a vos** por Telegram: lead trabado o LinkedIn caído |
> | `leadhunter-setter.json` | — | ⚠️ **No activar.** Hace lo mismo que `conversacion`; con los dos encendidos, cada respuesta se procesa dos veces |
>
> **Importar por consola** (el JSON necesita su `id`, si no falla con
> `NOT NULL constraint failed`):
> ```bash
> docker cp flujo.json n8n-n8n-1:/tmp/f.json
> docker exec n8n-n8n-1 n8n import:workflow --input=/tmp/f.json
> docker exec n8n-n8n-1 n8n update:workflow --id=<id> --active=true
> cd /docker/n8n && docker compose restart n8n   # sin esto no toma el cambio
> ```
>
> ⚠️ La cadencia NO se ajusta en los nodos de n8n: se configura desde la app, en
> **In the loop → Cadencia**. n8n solo pregunta "¿toca?"; la app decide a quién y
> cuándo. Así el cliente puede cambiarla sin tocar un flujo.

## Cambiar el dominio

Cuando el dominio propio propague, apuntar un registro **A** a `2.25.92.88` y:

```bash
cd /docker/leadhunter
nano .env          # LEADHUNTER_HOST=leads.tudominio.com
docker compose up -d
```

Traefik pide el certificado nuevo solo. El hostname viejo deja de responder,
así que conviene avisar si alguien lo tenía guardado.

## Notas del servidor

- **Swap de 2 GB añadido**: con 3.8 GB de RAM, compilar Next.js se quedaba corto.
- Los datos viven en el volumen `leadhunter_datos`. Respaldo manual:
  `docker run --rm -v leadhunter_datos:/d -v /root:/b alpine tar czf /b/datos.tgz /d`
- Hostinger hace backups semanales del VPS.
- **El VPS NO caduca: se renueva y se cobra.** Verificado contra la API de Hostinger el 31-jul-2026: KVM 1, plan mensual, **renovación automática activa**, próximo cobro **30-ago-2026**, ~$57.900 COP/mes. Es un gasto recurrente de negocio, no una fecha de vencimiento.
