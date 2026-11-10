# Production image for the GamersMatrix API (NestJS + Prisma).
# Multi-stage: build with dev deps, run with prod deps only.

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
# Copy workspace manifests only — maximizes Docker layer caching.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
# Web package is needed so npm install succeeds inside workspaces context; skip if not wanted.
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace @gamersmatrix/api --include-workspace-root=false

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
WORKDIR /app/apps/api
COPY apps/api/ .
RUN npx prisma generate \
  && npx nest build

# ---------- runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
  PORT=3001
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build --chown=app:app /app/node_modules /app/node_modules
COPY --from=build \
  --chown=app:app \
  /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build --chown=app:app /app/apps/api/dist /app/apps/api/dist
WORKDIR /app/apps/api
# prisma + package.json at runtime for `prisma migrate deploy` from the image.
COPY apps/api/prisma ./prisma
COPY apps/api/package.json ./package.json

USER app
EXPOSE 3001

# Graceful shutdown: SIGTERM propagates to node (enableShutdownHooks in main.ts).
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
