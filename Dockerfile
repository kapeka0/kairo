FROM node:22-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS migrator
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["sh", "-c", "pnpm db:migrate"]

FROM base AS builder
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL
ARG NEXT_PUBLIC_ETH_HTTP_BLOCKBOOK_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL=$NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL
ENV NEXT_PUBLIC_ETH_HTTP_BLOCKBOOK_URL=$NEXT_PUBLIC_ETH_HTTP_BLOCKBOOK_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
