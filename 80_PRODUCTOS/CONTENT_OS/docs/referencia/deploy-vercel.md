# Deploy en Vercel — Guía Paso a Paso

Cómo publicar tu Content OS en internet en menos de 10 minutos.

---

## Requisitos

- Cuenta en [github.com](https://github.com) (gratis)
- Cuenta en [vercel.com](https://vercel.com) (gratis)
- El dashboard funcionando localmente

---

## Paso 1 — Subir el código a GitHub

Si todavía no tenés el dashboard en un repositorio:

```bash
cd ruta/a/content-os-plantilla/dashboard
git init
git add .
git commit -m "Initial commit"
```

Crear repositorio nuevo en GitHub (privado recomendado) y seguir las instrucciones de "push existing repository".

---

## Paso 2 — Conectar con Vercel

1. Ir a [vercel.com](https://vercel.com) → "Add New Project"
2. Conectar tu cuenta de GitHub si no lo hiciste
3. Seleccionar el repositorio del dashboard
4. Vercel detecta automáticamente que es un proyecto Next.js

---

## Paso 3 — Configurar variables de entorno

Antes de hacer el deploy, cargar todas las variables de entorno en Vercel:

1. En la pantalla de configuración del proyecto → "Environment Variables"
2. Agregar cada variable de `dashboard/.env.local`:
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `INSTAGRAM_ACCESS_TOKEN`
   - `INSTAGRAM_USER_ID`
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DASHBOARD_PASSWORD` ← la contraseña de login del equipo (inventá una y compartila con tus socios)
   - (más las opcionales que tengas)

---

## Paso 4 — Deploy

Hacer clic en "Deploy". Vercel construye y publica el dashboard en ~2 minutos.

Una vez listo, obtenés una URL tipo `tu-proyecto.vercel.app`.

---

## Paso 5 — Verificar que funciona

1. Abrir la URL en el navegador
2. El dashboard tiene que cargar (puede mostrar estados vacíos si las APIs no están configuradas)
3. Ir a `/settings` para verificar el estado de cada módulo

---

## Paso 6 — (Opcional) Dominio propio

En Vercel → Settings → Domains → agregar tu dominio.

Seguir las instrucciones para configurar los registros DNS en tu proveedor de dominios.

---

## Actualizaciones futuras

Cada vez que hagas cambios en el código y los pushees a GitHub, Vercel hace un re-deploy automático.

```bash
git add .
git commit -m "descripción del cambio"
git push
```

---

## Notas importantes

- El token de Instagram expira cada 60 días. Renovarlo y actualizar la variable de entorno en Vercel → Settings → Environment Variables.
- La carpeta `data/` (cache local) no se usa en producción — en Vercel el cache va a `/tmp/`, que es efímero pero funciona.
- El plan gratuito de Vercel es suficiente para uso personal.
