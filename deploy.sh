#!/bin/bash

# Deploy Proximox Dashboard with Traefik and Ollama
echo "🚀 Deploying Proximox Dashboard Stack (Dashboard + Traefik + Ollama)..."

# Check if .env.local exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your credentials before running again."
    exit 1
fi

# Create required directories
echo "📁 Creating required directories..."
mkdir -p ./logs
mkdir -p ./letsencrypt
chmod 600 ./letsencrypt

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "⬇️  Pulling latest images..."
docker-compose pull

# Build and start all services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if containers are running
if [ $? -eq 0 ]; then
    echo "✅ Proximox Dashboard Stack deployed successfully!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "🌐 Services accessible at:"
    echo "   - Dashboard: https://dashboard.localhost (or http://localhost if no domain)"
    echo "   - Traefik Dashboard: http://localhost:8080"
    echo "   - Ollama API: https://ollama.localhost (or http://localhost:11434)"
    echo ""
    echo "📋 Useful commands:"
    echo "   - Check logs: docker-compose logs -f [service-name]"
    echo "   - Access dashboard shell: docker exec -it proximox-dashboard /bin/bash"
    echo "   - Pull Ollama model: docker exec -it ollama ollama pull llama2"
    echo "   - Check Ollama models: docker exec -it ollama ollama list"
    echo ""
    echo "⚙️  To use custom domain, set DOMAIN in .env.local and restart services"
else
    echo "❌ Failed to deploy Proximox Dashboard Stack"
    exit 1
fi