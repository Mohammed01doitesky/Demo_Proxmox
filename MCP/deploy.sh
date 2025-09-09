#!/bin/bash

# Deploy MCP Proxmox Server with Docker
echo "🚀 Deploying MCP Proxmox Server with Docker..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your Proxmox credentials before running again."
    exit 1
fi

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker-compose down

# Build and start the container
echo "🏗️  Building and starting MCP server..."
docker-compose up -d --build

# Check if container is running
if [ $? -eq 0 ]; then
    echo "✅ MCP Proxmox Server deployed successfully!"
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "📋 To check logs:"
    echo "   docker-compose logs -f mcp-proxmox-server"
    echo ""
    echo "🔧 To test the server:"
    echo "   docker exec -i mcp-proxmox-server node index.js"
    echo ""
    echo "⚙️  Update your dashboard .env.local with:"
    echo "   MCP_SERVER_COMMAND=docker"
    echo "   MCP_SERVER_ARGS=exec -i mcp-proxmox-server node index.js"
else
    echo "❌ Failed to deploy MCP server"
    exit 1
fi