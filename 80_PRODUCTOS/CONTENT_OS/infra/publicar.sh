#!/usr/bin/env bash
# =============================================================================
# Publica el Content OS: del vault al repo de despliegue, y de ahi Vercel solo.
#
# POR QUE EXISTE ESTE ARCHIVO. Es el gemelo de _LABS/videojuego-vida/publicar.sh
# y existe por la misma razon: el codigo vive dentro del vault (que es un repo)
# y se despliega desde OTRO repo (`modozaint/dermatinta-content-os`), para no
# darle a Vercel acceso a los 1.300 archivos del vault — estrategia, ICP,
# historia del founder, finanzas.
#
# 🔴 NACIO EL 2026-08-28 PORQUE ESE DIA SE ROMPIO EL DESPLIEGUE. Hasta entonces
#    `dashboard/` era un repo anidado con su propio `.git` y bastaba con hacer
#    push ahi. Al unificar todo en `modozaint/zaint-os` ese `.git` se saco del
#    arbol (git no deja que una carpeta sea repo propio y este versionada en el
#    padre a la vez), y el Content OS se quedo sin via para publicar. Esto es la
#    via nueva.
#
# ⚠️ EL COMMIT VA FIRMADO COMO modozaint A PROPOSITO.
#    Vercel Hobby BLOQUEA los despliegues cuyo autor no pertenece al team. Un
#    deploy bloqueado no falla ni avisa: el celular sigue mostrando la version
#    de ayer y nadie se entera. Ya paso con el FounderOS el 14-ago, cinco veces
#    seguidas.
#
# Uso:  ./publicar.sh "mensaje del commit"
# =============================================================================
set -e

MENSAJE="${1:?Falta el mensaje del commit: ./publicar.sh \"que cambio\"}"
FUENTE="$(cd "$(dirname "$0")/dashboard" && pwd)"
CLON="$HOME/.zaint/content-os-repo"
RAMA="main"

if [ ! -d "$CLON/.git" ]; then
  mkdir -p "$(dirname "$CLON")"
  git clone https://github.com/modozaint/dermatinta-content-os.git "$CLON"
fi

git -C "$CLON" checkout -q "$RAMA"
git -C "$CLON" pull -q --ff-only

# Que copiar: TODO lo que el vault versiona de dashboard/, a cualquier
# profundidad, mas lo que el repo de despliegue ya tenia.
#
# 🔴 NO SE USA UN GLOB, y en el FounderOS costo dos deploys rotos el mismo dia:
#    en bash sin `globstar`, `app/**/*.ts*` se comporta como UN SOLO NIVEL, asi
#    que los archivos anidados no viajaban y el build fallaba importando algo
#    que en el clon no existia — mientras aqui todo compilaba.
#    `git ls-files` no tiene ese problema. Y va con `--others` porque sin eso
#    solo lista lo YA versionado: un archivo recien creado y sin commit —que es
#    justo el que mas falta hace— se quedaba atras. `--exclude-standard`
#    respeta el .gitignore, asi que node_modules, .next y .env.local no viajan.
ARCHIVOS=$(git -C "$FUENTE" ls-files --cached --others --exclude-standard \
           | grep -vE '^(\.env)')

for f in $(git -C "$CLON" ls-files) $ARCHIVOS; do
  [ -f "$FUENTE/$f" ] || continue
  mkdir -p "$CLON/$(dirname "$f")"
  cp "$FUENTE/$f" "$CLON/$f"
done

cd "$CLON"
if [ -z "$(git status --porcelain)" ]; then
  echo "Nada que publicar: el repo ya esta igual que el vault."
  exit 0
fi

git add -A
git -c user.name=modozaint \
    -c user.email=297497107+modozaint@users.noreply.github.com \
    commit -q -m "$MENSAJE"
git push -q origin "$RAMA"

echo "Publicado. Vercel lo esta construyendo:"
echo "  https://dermatinta-content-os.vercel.app  (queda en vivo en ~1 minuto)"
echo
echo "Comprueba que quedo en vivo antes de darlo por hecho:"
echo "  curl -s -o /dev/null -w '%{http_code}\\n' https://dermatinta-content-os.vercel.app"
