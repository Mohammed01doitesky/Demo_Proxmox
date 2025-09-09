FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY index.js ./
COPY .env ./

# Create a non-root user
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001

# Change ownership of the app directory
RUN chown -R mcpuser:mcpuser /app
USER mcpuser

# Expose port for potential HTTP transport (if needed later)
EXPOSE 3001

# Run the MCP server
CMD ["node", "index.js"]