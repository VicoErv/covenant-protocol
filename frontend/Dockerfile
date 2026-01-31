# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
# Install dependencies with legacy peer deps due to wagmi/rainbowkit conflicts
RUN npm install --legacy-peer-deps

COPY . .
# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
