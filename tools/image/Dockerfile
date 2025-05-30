# Build stage
FROM node:20-alpine AS build

ENV NODE_ENV=production
ENV PORT=3000

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of the source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules

# Expose the port the app will run on
EXPOSE 3000

# Application settings
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# AWS/S3 Configuration - these can be overridden at runtime
ENV AWS_REGION=""
ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV S3_BUCKET_NAME=""
ENV AWS_S3_ENDPOINT=""

# Base path for reverse proxy deployment (e.g., '/chemboard' for path-based routing)
ENV BASE_PATH=""

# Command to run the application
CMD ["node", "build/index.js"]
