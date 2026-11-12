FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @radar-ia/contracts build && pnpm --filter @radar-ia/api prisma:generate && pnpm --filter @radar-ia/api build
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app /app
CMD ["sh","-c","pnpm --filter @radar-ia/api prisma:migrate && pnpm --filter @radar-ia/api start"]
