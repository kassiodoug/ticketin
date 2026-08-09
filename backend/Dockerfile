# Build
FROM node:22-alpine AS builder

WORKDIR /

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production
FROM node:22-alpine AS runner

WORKDIR /

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /dist ./dist

EXPOSE 3333

CMD ["npm", "start"]
