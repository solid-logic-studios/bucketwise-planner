# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json

# Install all workspace dependencies (incl. dev) for build
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY frontend ./frontend

# Set Vite environment variables for production build
# These get baked into the JavaScript bundle at build time
# For Docker deployments, use relative paths so nginx can proxy
ENV VITE_API_BASE=/api
ENV VITE_AUTH_BASE=/auth

RUN pnpm --filter frontend build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
