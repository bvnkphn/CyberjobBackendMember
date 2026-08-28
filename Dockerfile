FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM build AS migrate
WORKDIR /app/apps/api
CMD ["../../node_modules/.bin/prisma", "migrate", "deploy"]

FROM build AS production-deps
RUN npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
USER node
EXPOSE 3003
CMD ["node", "dist/main"]
