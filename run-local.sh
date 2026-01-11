#!/bin/bash

# Quick start script to run the app locally

echo "🚀 FinpilotAI - Local Development Setup"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo ""
    echo "Creating .env.local from template..."
    
    # Create basic .env.local with MongoDB credentials
    cat > .env.local << 'EOF'
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://smamidigump:Rippling%401234@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=FinpilotAI

# VoyageAI API Key (Update with your actual key)
VOYAGE_API_KEY=your_voyage_api_key_here

# JWT Secret
JWT_SECRET=finpilot-ai-secret-key-$(date +%s)

# Next.js Application URL
NEXTAUTH_URL=http://localhost:3000

# Thesys API Key (if needed)
THESYS_API_KEY=your_thesys_api_key_here
EOF
    
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Update .env.local with:"
    echo "   1. Your MongoDB Atlas cluster URL (replace cluster.mongodb.net)"
    echo "   2. Your VoyageAI API key"
    echo ""
    read -p "Press Enter to continue after updating .env.local, or Ctrl+C to cancel..."
fi

# Start the development server
echo ""
echo "🚀 Starting development server..."
echo "📱 Application will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev