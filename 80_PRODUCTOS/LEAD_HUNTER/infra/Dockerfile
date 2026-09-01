# LeadHunter en el VPS. Se construye dentro del servidor y queda detrás de
# Traefik (el mismo que ya sirve a n8n), que le pone el HTTPS solo.
FROM node:22-alpine

WORKDIR /app

# Dependencias primero: si no cambia package-lock, Docker reusa esta capa y el
# rebuild baja de minutos a segundos.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Los datos viven en un volumen, no dentro de la imagen (ver lib/store.ts).
ENV DATOS_DIR=/datos
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# No correr como root: si algún día una dependencia tiene un fallo de
# ejecución remota, que el proceso comprometido no sea root dentro del
# contenedor. La imagen node:*-alpine ya trae el usuario "node" (uid 1000).
# El volumen /datos se monta en tiempo de ejecución (no existe en el build),
# así que su dueño se corrige una vez en el host — ver DEPLOY.md.
RUN chown -R node:node /app
USER node

CMD ["npm", "run", "start"]
