#!/bin/bash

# Setup environment file with MongoDB credentials

echo "🔧 Setting up .env.local file..."
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "❌ Aborted. Keeping existing .env.local"
        exit 0
    fi
fi

# MongoDB credentials
MONGO_USER="smamidigump"
MONGO_PASS="Rippling@1234"
# URL-encode the password (@ becomes %40)
MONGO_PASS_ENCODED="Rippling%401234"

# Prompt for cluster URL
echo "Enter your MongoDB Atlas cluster URL (e.g., cluster0.xxxxx.mongodb.net):"
read -p "Cluster URL: " CLUSTER_URL

if [ -z "$CLUSTER_URL" ]; then
    echo "⚠️  Using default cluster.mongodb.net"
    CLUSTER_URL="cluster.mongodb.net"
fi

# Prompt for VoyageAI API key
echo ""
echo "Enter your VoyageAI API key (or press Enter to skip):"
read -p "VoyageAI API Key: " VOYAGE_KEY

if [ -z "$VOYAGE_KEY" ]; then
    VOYAGE_KEY="your_voyage_api_key_here"
    echo "⚠️  VoyageAI API key not set. Update it in .env.local later."
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "atlas-household-cfo-secret-key-$(date +%s)")

# Create .env.local
cat > .env.local << EOF
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://${MONGO_USER}:${MONGO_PASS_ENCODED}@${CLUSTER_URL}/?retryWrites=true&w=majority
MONGODB_DB=atlas_household_cfo

# VoyageAI API Key
VOYAGE_API_KEY=${VOYAGE_KEY}

# JWT Secret (generated)
JWT_SECRET=${JWT_SECRET}

# Next.js Application URL
NEXTAUTH_URL=http://localhost:3000

# Thesys API Key (if needed)
THESYS_API_KEY=your_thesys_api_key_here
EOF

echo ""
echo "✅ .env.local file created successfully!"
echo ""
echo "📋 Configuration:"
echo "   MongoDB User: ${MONGO_USER}"
echo "   MongoDB Cluster: ${CLUSTER_URL}"
echo "   Database: atlas_household_cfo"
echo "   VoyageAI Key: ${VOYAGE_KEY}"
echo ""
echo "⚠️  Next steps:"
echo "   1. Verify your MongoDB Atlas cluster URL is correct"
echo "   2. Whitelist your IP address in MongoDB Atlas"
echo "   3. Create Vector Search indexes (see MONGODB_SETUP.md)"
echo "   4. Run: docker-compose up --build"
echo ""