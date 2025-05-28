# Build stage
FROM node:20-alpine AS build

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

# Create a placeholder .env file with dummy values for build time
RUN echo "AWS_REGION=us-east-1" > .env && \
    echo "AWS_ACCESS_KEY_ID=placeholder" >> .env && \
    echo "AWS_SECRET_ACCESS_KEY=placeholder" >> .env && \
    echo "S3_BUCKET_NAME=placeholder" >> .env && \
    echo "AWS_S3_ENDPOINT=https://placeholder.example.com" >> .env

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

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Command to run the application
CMD ["node", "build/index.js"]