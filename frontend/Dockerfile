# Build
FROM node:22-alpine AS builder

WORKDIR /

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Production
FROM node:22-alpine AS runner

WORKDIR /

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /.next ./.next
# COPY --from=builder /src/app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
