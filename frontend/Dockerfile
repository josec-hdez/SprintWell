# Frontend service — Vite build served as static files by nginx.
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# The API base URL is baked at build time (Vite inlines VITE_* into the bundle);
# it must be the URL the BROWSER uses to reach the backend.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
