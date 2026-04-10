FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prettier.config.js ./
COPY src ./src
COPY src-profile-api ./src-profile-api
COPY data ./data
COPY public ./public
COPY scripts ./scripts

RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm build:cloud

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/src-profile-api ./src-profile-api
COPY --from=builder /app/deploy ./deploy
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000 4200

CMD ["node", "scripts/start-cloud.mjs"]
