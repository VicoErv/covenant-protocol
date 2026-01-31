# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
# Install dependencies with legacy peer deps due to wagmi/rainbowkit conflicts
RUN npm install --legacy-peer-deps

ARG VITE_API_URL
ARG VITE_BUILDER_ENGINE_ADDRESS
ARG VITE_COVENANT_JOIN_ADDRESS

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BUILDER_ENGINE_ADDRESS=$VITE_BUILDER_ENGINE_ADDRESS
ENV VITE_COVENANT_JOIN_ADDRESS=$VITE_COVENANT_JOIN_ADDRESS

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
