# ----------- Stage 1: Build Stage -----------
FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
# RUN npm run build  # Uncomment if you have a build step

# ----------- Stage 2: Production Stage -----------
FROM node:18-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "start"]
