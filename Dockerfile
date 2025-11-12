# Etapa 1: Build y optimización
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifestos de dependencias
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Instalar dependencias de build con --legacy-peer-deps
RUN \
if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
else npm install --legacy-peer-deps; fi

# Copiar el resto del código fuente
COPY . .

# Compilar Next.js en modo standalone
RUN npm run build

# Quitar dependencias de desarrollo para reducir peso
RUN npm prune --production --legacy-peer-deps

# Etapa 2: Runtime ultra-ligero
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copiar artefactos del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Usuario seguro
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
USER nodejs

EXPOSE 3000
CMD ["node", "server.js"]