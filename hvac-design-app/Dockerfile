FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
# For monorepos, we often need the workspace root files
COPY pnpm-lock.yaml* pnpm-workspace.yaml* package.json ./
COPY hvac-design-app/package.json ./hvac-design-app/
COPY hvac-design-app/pnpm-lock.yaml* ./hvac-design-app/

RUN mkdir -p node_modules hvac-design-app/node_modules

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f hvac-design-app/pnpm-lock.yaml ]; then cd hvac-design-app && corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/hvac-design-app/node_modules ./hvac-design-app/node_modules
COPY . .

WORKDIR /app/hvac-design-app

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f ../pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs


# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone mode in a monorepo structure traces from the root
# The standalone folder is created inside the app directory
COPY --from=builder --chown=nextjs:nodejs /app/hvac-design-app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/hvac-design-app/.next/static ./hvac-design-app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/hvac-design-app/public ./hvac-design-app/public

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Standalone mode in a monorepo structure has server.js in the app folder
CMD ["node", "hvac-design-app/server.js"]
