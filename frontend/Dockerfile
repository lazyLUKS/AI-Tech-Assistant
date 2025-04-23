# frontend/Dockerfile

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# If using yarn:
# COPY package.json yarn.lock ./
# If using pnpm:
# COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install
# If using yarn:
# RUN yarn install
# If using pnpm:
# RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Set the build-time environment variable for the API URL
# This gets baked into the static files during build
# It should point to the backend service name and port within Docker network
ARG NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
# The NEXT_PUBLIC_API_URL will be inherited from the build stage ARG/ENV

# Copy built assets from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port Next.js runs on
EXPOSE 3000

# Command to run the production server
# Uses the output standalone server from Next.js build
CMD ["node", "server.js"]
