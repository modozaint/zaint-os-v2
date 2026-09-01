# FounderOS · Mi Vida

El sistema personal de Santiago Giraldo: hábitos, el plan del día, las cuentas de
ZAINT y el dinero personal, en un solo tablero.

PWA en Next.js 15 + Supabase. Se usa igual en el celular que en el computador.

## Qué hace

| Pestaña | Qué responde |
|---|---|
| **Hoy** | Qué cabe hoy según el turno, y los hábitos del día |
| **Tareas** | El backlog completo, ordenado por cercanía a la venta |
| **Dinero** | Bolsillos, presupuesto (antes/después) y el diagnóstico |
| **Áreas** | Nivel y XP por área de la vida |
| **Ajustes** | Hábitos, áreas, horario y sesión |

## Ideas que sostienen el diseño

- **El día no se planea, se calcula.** El turno define la capacidad real y la app
  toma del backlog lo que quepa, empezando por lo más cerca de vender.
- **Tiempo de reloj ≠ capacidad.** Un posturno tiene 8 h de reloj libres y 0 de
  cabeza. Las dos cosas se muestran por separado.
- **Máximo 2 cuentas activas**, y el candado vive en la base de datos: uno que se
  esquiva recargando la página no es un candado.
- **El dinero personal y el de negocio no comparten ni una llave foránea**, así
  que no se pueden sumar por accidente.

## Correrlo

```bash
npm install
npm run dev
```

Necesita un proyecto de Supabase con las migraciones de `supabase/` aplicadas en
orden. Variables (opcionales, hay valores por defecto):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Seguridad

Autenticación con Supabase y RLS por usuario en todas las tablas. La clave
publicable está diseñada para ser pública: el candado real es RLS, y cada
consulta viaja con el token del usuario.

<!-- Desplegado desde github.com/modozaint/founderos -->
