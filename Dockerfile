# Stage 1: Build React frontend 
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci --legacy-peer-deps

COPY client/ ./
RUN npm run build

#  Stage 2: Node backend + serve built frontend 
FROM node:20-alpine AS backend

WORKDIR /app

# Copy server deps and install (production only)
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy server source
COPY server/ ./

# Copy built React app into server's public folder
COPY --from=frontend-builder /app/client/dist ./public

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000


CMD ["node", "server.js"]
