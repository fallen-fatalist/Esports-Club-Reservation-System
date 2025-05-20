# ----------- Stage 1: Build Stage -----------
FROM node:18 AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production=false  # Install all deps (including dev)

# Copy source files
COPY . .

# Optionally run build if it's a React/Vite/Next/etc. frontend
# RUN npm run build

# ----------- Stage 2: Production Stage -----------
FROM node:18-slim

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built source from builder
COPY --from=builder /app .

EXPOSE 3000

CMD ["npm", "start"]
