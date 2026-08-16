# DIAL worker image (worker-temporal / worker-queues).
# Build context = repo root:
#   docker build -f docker/worker.Dockerfile --build-arg WORKER=worker-temporal .
# Workers run TypeScript sources through tsx, matching `pnpm start` in each app.

FROM node:20.18-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=1
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile

FROM node:20.18-alpine AS runner
ARG WORKER=worker-queues
ENV NODE_ENV=production \
    DIAL_WORKER=${WORKER}
RUN corepack enable \
    && addgroup -g 10001 -S dial \
    && adduser -u 10001 -S dial -G dial
WORKDIR /repo

COPY --from=deps --chown=dial:dial /repo /repo

USER dial

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "process.exit(0)"

# Fail-closed secret checks live in @dial/shared workerSecrets; the container only
# selects which worker entrypoint runs.
CMD ["sh", "-c", "pnpm --filter @dial/${DIAL_WORKER} start"]
