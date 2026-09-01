#!/usr/bin/env bash
# =============================================================================
# Publica la app: del vault al repo propio, y de ahi Vercel la despliega sola.
#
# POR QUE EXISTE ESTE ARCHIVO. La app vive dentro del vault (que es un repo) y
# se despliega desde OTRO repo propio (`modozaint/founderos`), para no darle a
# Vercel acceso a los 800 archivos del vault. Como no se puede anidar un repo
# dentro de otro sin romper el de arriba, la copia se hace contra un clon
# aparte. Hacerlo a mano cada vez es donde se pierden los cambios.
#
# ⚠️ EL COMMIT VA FIRMADO CON modozaint@gmail.com A PROPOSITO.
#    Vercel BLOQUEA los despliegues cuyo autor no pertenece al team: el 14-ago
#    cinco deploys seguidos quedaron en BLOCKED por venir de kayzenlanas@gmail.com
#    y nadie lo noto, porque un deploy bloqueado no falla ni avisa — el celular
#    simplemente sigue mostrando la version de ayer.
#
# Uso:  ./publicar.sh "mensaje del commit"
# =============================================================================
set -e

MENSAJE="${1:?Falta el mensaje del commit: ./publicar.sh \"que cambio\"}"
FUENTE="$(cd "$(dirname "$0")" && pwd)"
CLON="$HOME/.zaint/founderos-repo"

if [ ! -d "$CLON/.git" ]; then
  mkdir -p "$(dirname "$CLON")"
  git clone https://github.com/modozaint/founderos.git "$CLON"
fi

git -C "$CLON" checkout -q master
git -C "$CLON" pull -q --ff-only

# Que copiar: TODO lo que el vault versiona de esta carpeta, a cualquier
# profundidad, mas lo que el repo de la app ya tenia.
#
# 🔴 POR QUE NO SE USA UN GLOB, y costo un deploy fallido el 2026-08-26: antes
# decia `ls app/*.ts* app/**/*.ts*`, y en bash sin `globstar` el `**` se
# comporta como `*` — o sea UN SOLO NIVEL. `app/casa/motor.tsx` se copiaba y
# `app/casa/habitaciones/cuarto.ts` NO. El build de Vercel fallo importando un
# archivo que en el clon no existia, y aqui todo compilaba porque aqui si
# estaba. Un deploy fallido no avisa: el telefono sigue mostrando lo de ayer.
#
# `git ls-files` no tiene profundidad ni glob. Y va con `--others`:
#
# 🔴 SEGUNDA VEZ, MISMO DIA (2026-08-26): sin `--others` solo lista lo YA
# VERSIONADO, asi que `app/casa/habitaciones/oficina.ts` —recien creado, aun
# sin commit— tampoco viajo. El archivo mas nuevo es justo el que mas falta
# hace, y es el que se quedaba. `--exclude-standard` respeta el .gitignore,
# asi que node_modules y .next siguen fuera.
ARCHIVOS=$(git -C "$FUENTE" ls-files --cached --others --exclude-standard            | grep -vE '^(referencias/|\.env)')
for f in $(git -C "$CLON" ls-files) publicar.sh $ARCHIVOS; do
  [ -f "$FUENTE/$f" ] || continue
  mkdir -p "$CLON/$(dirname "$f")"
  cp "$FUENTE/$f" "$CLON/$f"
done

cd "$CLON"
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  echo "Nada que publicar: el repo ya esta igual que el vault."
  exit 0
fi

git add -A
git -c user.name=modozaint -c user.email=modozaint@gmail.com commit -q -m "$MENSAJE"
git push -q origin master

echo "Publicado. Vercel lo esta construyendo:"
echo "  https://vercel.com/dermatinta-team/founderos"
echo "  https://founderos-six.vercel.app  (queda en vivo en ~1 minuto)"
