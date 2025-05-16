# ---------- Stage 1: Build ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ---------- Stage 2: Serve ----------
FROM node:18-slim		

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built React app from builder stage
COPY --from=builder /app/build ./build

EXPOSE 3000

# Serve the static React app
CMD ["serve", "-s", "build", "-l", "3000"]
