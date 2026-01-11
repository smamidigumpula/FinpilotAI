#!/bin/bash

# Quick start script for Docker

set -e

echo "🚀 FinpilotAI - Docker Setup"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file not found!"
    echo "Creating from .env.local.example..."
    
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from example"
        echo "⚠️  Please edit .env.local with your actual credentials before continuing!"
        echo ""
        read -p "Press Enter after you've edited .env.local, or Ctrl+C to cancel..."
    else
        echo "❌ .env.local.example not found. Please create .env.local manually."
        exit 1
    fi
fi

# Ask user for setup type
echo ""
echo "Choose setup type:"
echo "1) Production mode (with MongoDB Atlas or local MongoDB)"
echo "2) Development mode (with hot-reload)"
echo "3) Local MongoDB mode (everything local)"
echo ""
read -p "Enter choice [1-3] (default: 1): " choice
choice=${choice:-1}

case $choice in
    1)
        echo "🔨 Building and starting production containers..."
        docker-compose up --build
        ;;
    2)
        echo "🔨 Building and starting development containers..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    3)
        echo "🔨 Building and starting with local MongoDB..."
        docker-compose -f docker-compose.local.yml up --build
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac