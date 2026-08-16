# DIAL gateway-web production image.
# Build context = repo root: docker build -f docker/gateway-web.Dockerfile .
# Deploy-agnostic: no host assumptions, all config via env at run time.

FROM node:20.18-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=1
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM deps AS build
# Placeholders only: real values are injected at run time, never baked into layers.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DIAL_INTEGRATION_MODE=fixture
RUN pnpm --filter @dial/design-tokens build \
    && pnpm --filter @dial/gateway-web build

FROM node:20.18-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -g 10001 -S dial && adduser -u 10001 -S dial -G dial
WORKDIR /app

COPY --from=build --chown=dial:dial /repo/apps/gateway-web/.next/standalone ./
COPY --from=build --chown=dial:dial /repo/apps/gateway-web/.next/static ./apps/gateway-web/.next/static
# /api/openapi reads this at run time, so file tracing does not pick it up.
COPY --from=build --chown=dial:dial /repo/docs/integrations/openapi-gateway.json ./docs/integrations/openapi-gateway.json

USER dial
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health/live" || exit 1

CMD ["node", "apps/gateway-web/server.js"]
