#!/bin/bash

# Simple deployment without Traefik for direct access
echo "🚀 Deploying Proximox Dashboard (Simple Mode - Direct Access)..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Please create one with your configuration."
    exit 1
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p ./logs

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.simple.yml down
docker-compose down 2>/dev/null || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.simple.yml up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check container status
if [ $? -eq 0 ]; then
    echo "✅ Proximox Dashboard deployed successfully!"
    echo ""
    echo "📊 Container status:"
    docker-compose -f docker-compose.simple.yml ps
    echo ""
    echo "🌐 Dashboard accessible at:"
    echo "   - http://localhost (port 80)"
    echo "   - http://localhost:3000"
    echo "   - http://your-server-ip (port 80)"
    echo ""
    echo "🔍 Health check:"
    echo "   curl http://localhost/api/health"
    echo ""
    echo "📋 Useful commands:"
    echo "   - Check logs: docker-compose -f docker-compose.simple.yml logs -f"
    echo "   - Stop services: docker-compose -f docker-compose.simple.yml down"
else
    echo "❌ Failed to deploy Proximox Dashboard"
    exit 1
fi