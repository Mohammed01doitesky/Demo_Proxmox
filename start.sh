#!/bin/bash

echo "🚀 Starting Proximox Dashboard with MCP Server..."

# Start MCP server in background
echo "🔧 Starting MCP server..."
cd /app/mcp
node index.js &
MCP_PID=$!

# Wait a moment for MCP server to initialize
sleep 2

# Start Next.js application
echo "🌐 Starting Next.js dashboard..."
cd /app
bun start &
NEXTJS_PID=$!

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $MCP_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for any process to exit
wait