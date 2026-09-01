# Primeros Pasos

5 pasos para tener el sistema funcionando. Sin saltearse ninguno.

---

## Paso 1 — Instalá Node.js

Descargá la versión LTS desde [nodejs.org](https://nodejs.org).

Verificar que quedó bien:
```bash
node --version
```
Tiene que mostrar algo como `v22.x.x`.

---

## Paso 2 — Instalá Claude Code

```bash
npm install -g @anthropic/claude-code
```

Verificar:
```bash
claude --version
```

---

## Paso 3 — Activá el plan Pro en claude.ai

Claude Code necesita una cuenta con plan Pro o Max ($20/mes o $100/mes).

Entrar a [claude.ai](https://claude.ai) y activar el plan.

---

## Paso 4 — Abrí la terminal y navegá a esta carpeta

```bash
cd ruta/a/content-os-plantilla
```

En Mac podés arrastrar la carpeta a la terminal después de escribir `cd ` (con espacio).

---

## Paso 5 — Iniciá Claude Code y ejecutá `/iniciar`

```bash
claude
```

Una vez dentro:
```
/iniciar
```

Claude te guía el resto: configura tu marca, te ayuda a obtener las API keys, y te explica cómo correr el dashboard.

---

## Si algo no funciona

Decile a Claude exactamente qué error ves. Él diagnóstica y resuelve.
