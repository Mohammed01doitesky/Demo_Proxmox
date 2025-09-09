FROM oven/bun:1-alpine

WORKDIR /app

# Install required packages
RUN apk add --no-cache bash curl

# Copy package files for dashboard
COPY package.json ./
COPY bun.lock ./

# Install dashboard dependencies
RUN bun install

# Copy MCP server files
COPY ./MCP/package.json ./mcp/
COPY ./MCP/index.js ./mcp/
COPY ./MCP/.env ./mcp/

# Install MCP server dependencies
WORKDIR /app/mcp
RUN bun install

# Back to main app directory
WORKDIR /app

# Copy dashboard source code
COPY . .

# Build the Next.js application with placeholder values
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_buildtime_placeholder
ENV CLERK_SECRET_KEY=sk_test_buildtime_placeholder  
ENV AUTH_CLERK_JWT_ISSUER_DOMAIN=https://buildtime.clerk.accounts.dev
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
RUN bun run build

# Create startup script
COPY start.sh ./
RUN chmod +x ./start.sh

# Expose ports
EXPOSE 3000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Start both services
CMD ["./start.sh"]