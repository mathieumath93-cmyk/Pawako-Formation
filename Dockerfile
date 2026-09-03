# Stage 1: Build application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Vite frontend and bundled Express server
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled server and static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Ensure persistent storage directories exist
RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
