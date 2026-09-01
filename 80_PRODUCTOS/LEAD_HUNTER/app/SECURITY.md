# Seguridad — estado y checklist antes de vender/instalar en un cliente

> Auditado el 2026-07-30. Esto no es un documento teórico: cada punto de acá
> se verificó en vivo contra el servidor real (`leads.modozaint.online`).

## Lo que ya está resuelto

| Capa | Qué se hizo | Verificado |
|---|---|---|
| Servidor (SSH) | Solo login por clave. `PasswordAuthentication no` forzado con prioridad sobre el archivo de cloud-init que lo reactivaba (`sshd_config.d/00-hardening.conf`). `PermitRootLogin prohibit-password`. | Con clave conecta; forzando password da "Permission denied" sin pedir clave. |
| Servidor (firewall) | `ufw` activo: solo 22 (SSH), 80 y 443 abiertos. Todo lo demás, cerrado. | `ufw status` → 3 reglas, nada más. |
| Servidor (fuerza bruta) | `fail2ban` en el jail de SSH, con el nombre de unidad correcto (`ssh.service`, no `sshd.service` — el filtro por defecto en Ubuntu 24.04 apunta al nombre viejo y por eso venía sin efecto). | `journalmatch` corregido y confirmado contra el journal real. |
| Red (contenedor) | El puerto 3000 de la app **no se publica al host**: solo es alcanzable dentro de la red interna de Docker, a través de Traefik. Nadie llega directo, sin pasar por HTTPS + la contraseña. | `ports:` ausente en `docker-compose.yml`; `ss -tlnp` no muestra el 3000 hacia afuera. |
| Transporte | HTTPS con certificado real (Let's Encrypt vía Traefik). HTTP redirige a HTTPS. | Certificado válido, `curl` sin `-k` funciona. |
| Acceso a la app | Basic Auth (usuario + contraseña) para personas; token Bearer separado (`CRON_SECRET`) para n8n. Comparación en **tiempo constante** (no en `===`), para no filtrar la contraseña por temporización. | `proxy.ts`. |
| Datos en tránsito/reposo | `.env.local` con los secretos: permisos `600`, fuera de git (`.gitignore`), nunca se sube al repo (verificado con `git ls-tree`). | — |
| Cabeceras HTTP | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. | `next.config.ts`. |
| Contenedor | Corre como usuario `node` (uid 1000), no como root. | `Dockerfile` + `docker exec whoami`. |
| Dependencias | Next actualizado a la última versión de la serie 16 (16.2.12). | `npm audit`. |

## Lo que queda como advertencia consciente (no es un bug, es un límite de diseño)

**No hay autenticación por persona dentro de la app.** El login "¿Quién sos?"
(Santiago / Comercial 1 / Comercial 2) es solo de **interfaz** — no verifica
nada contra el servidor. Cualquiera que tenga la contraseña compartida de la
app puede, técnicamente, llamar a cualquier endpoint directo (incluida una
búsqueda que gasta el presupuesto de Apify) sin pasar por el rol "comercial"
que oculta esa pantalla.

**Por qué esto está bien para el desafío y para un primer cliente pequeño:**
la contraseña la conocen 2-3 personas de un mismo equipo de confianza. El
control de roles es para que nadie se equivoque de pantalla, no para
protegerse entre compañeros.

**Cuándo esto deja de estar bien:** si un cliente quiere que un empleado
comercial NO PUEDA gastar presupuesto ni tocar la configuración, aunque sepa
la contraseña de la app. Eso requiere autenticación real por persona (cuentas
individuales con su propio hash de contraseña, no solo un nombre elegido de
una lista) — es un desarrollo aparte, no una tarde de ajustes. Anótalo como
plus vendible ("multiusuario con permisos reales") si Nexum lo pregunta, no
como algo ya incluido.

## Checklist para instalar esto en OTRO cliente (nunca reusar el mismo VPS/secretos)

1. **VPS propio** por cliente (o al menos contenedor y volumen propios — nunca
   comparten `_datos.json`: los leads de un cliente no deben poder verse
   desde el panel de otro).
2. **`APP_PASSWORD` y `CRON_SECRET` nuevos**, generados con
   `openssl rand -hex 24` — nunca copiar los de otra instalación.
3. **Dominio propio** del cliente (o subdominio suyo), certificado propio.
4. Revisar que **`MODO_DEV` no esté puesto** en la instalación del cliente
   (así no ve la pantalla de "Clientes" ni notas de desarrollador — ver
   commit del bloque A).
5. Las claves de Unipile/Cal.com/Apify/Anthropic son **del cliente**, no las
   tuyas — así el gasto y el límite de cuenta de LinkedIn son suyos.
6. Repetir el hardening de SSH/firewall/fail2ban de este documento en el VPS
   nuevo (no es automático: es específico de cada servidor).

## Pendiente si se quiere ir más allá (no bloqueante para la entrega del 15-ago)

- Rotar `APP_PASSWORD`/`CRON_SECRET` con cierta cadencia (hoy son fijos).
- Sacar `PermitRootLogin` del todo (crear un usuario con `sudo` en vez de
  operar como root) — más robusto, pero implica migrar todos los scripts de
  despliegue que hoy asumen `root@`.
- Autenticación real por persona (ver arriba).
