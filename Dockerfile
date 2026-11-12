# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# La app usa /api por defecto y nginx lo proxya al backend, evitando CORS.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---------- Runtime ----------
FROM nginx:1.29-alpine

# Upstream del backend para el proxy /api. En Railway configurarlo como variable
# del servicio con la URL del backend (ej. https://backend.up.railway.app).
ENV API_UPSTREAM=http://host.docker.internal:8080

# Railway inyecta su propio PORT; este default mantiene el 80 en Docker local.
ENV PORT=80

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://127.0.0.1:${PORT}/ || exit 1
