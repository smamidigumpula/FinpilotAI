# Docker Setup Guide

This guide explains how to containerize and run the Atlas Household CFO application using Docker.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- Docker version 20.10+ and Docker Compose version 2.0+

## Quick Start

### Option 1: Using MongoDB Atlas (Recommended)

If you're using MongoDB Atlas (cloud), you only need to containerize the app:

1. **Create `.env.local` file** with your credentials:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=atlas_household_cfo
VOYAGE_API_KEY=your_voyage_api_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
```

2. **Build and run the app:**
```bash
docker-compose up --build
```

This will start the app on http://localhost:3000

### Option 2: Using Local MongoDB

If you want to run MongoDB locally in Docker:

1. **Update `.env.local`** to use local MongoDB:
```bash
MONGODB_URI=mongodb://admin:password@mongo:27017/atlas_household_cfo?authSource=admin
MONGODB_DB=atlas_household_cfo
VOYAGE_API_KEY=your_voyage_api_key
JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=http://localhost:3000
MONGO_USERNAME=admin
MONGO_PASSWORD=password
```

2. **Run with local MongoDB:**
```bash
docker-compose up --build
```

## Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This mounts your local code and enables hot-reload for development.

## Docker Commands

### Build the image
```bash
docker-compose build
```

### Start containers
```bash
docker-compose up -d
```

### Stop containers
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f app
```

### Execute commands in container
```bash
docker-compose exec app sh
```

### Clean up (remove volumes)
```bash
docker-compose down -v
```

## Production Build

For production, the Dockerfile uses a multi-stage build:

1. **Dependencies stage**: Installs npm packages
2. **Builder stage**: Builds the Next.js application
3. **Runner stage**: Creates minimal production image

The production image uses Next.js standalone output for optimal size.

## Environment Variables

All environment variables should be set in `.env.local`:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `MONGODB_DB` | Database name | Yes |
| `VOYAGE_API_KEY` | VoyageAI API key | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |

## Troubleshooting

### Port already in use
If port 3000 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead of 3000
```

### MongoDB connection issues

**With MongoDB Atlas:**
- Ensure your IP is whitelisted in Atlas
- Check connection string format
- Verify credentials

**With Local MongoDB:**
- Check MongoDB container is running: `docker-compose ps`
- View MongoDB logs: `docker-compose logs mongo`
- Verify connection string uses `mongo` as hostname (container name)

### Build failures
- Clear Docker cache: `docker-compose build --no-cache`
- Check Docker has enough resources (CPU/Memory)
- Verify Node.js version compatibility

### Hot-reload not working (dev mode)
- Ensure volumes are mounted correctly
- Check file permissions
- Restart containers: `docker-compose restart`

## MongoDB Vector Search with Local MongoDB

If using local MongoDB, you'll need to set up Vector Search manually:

1. **Install MongoDB Atlas Search** or use MongoDB 7.0+ with vector search support
2. **Create vector search indexes** as described in `SETUP.md`
3. **Restart MongoDB container** after index creation

Note: Vector Search is more easily configured with MongoDB Atlas. For local development, you might want to use Atlas even in Docker.

## Docker Compose Files

- `docker-compose.yml` - Production setup
- `docker-compose.dev.yml` - Development setup with hot-reload

## Dockerfile Files

- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development image with all tools

## Network

All services run on the `app-network` bridge network, allowing them to communicate using service names as hostnames.

## Volumes

- `mongo-data`: Persistent storage for MongoDB data (local MongoDB only)

## Health Checks

You can add health checks to `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Example: Complete Local Setup

```bash
# 1. Clone and navigate
cd FinpilotAI

# 2. Create .env.local
cat > .env.local << EOF
MONGODB_URI=mongodb://admin:password@mongo:27017/atlas_household_cfo?authSource=admin
MONGODB_DB=atlas_household_cfo
VOYAGE_API_KEY=your_key_here
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
MONGO_USERNAME=admin
MONGO_PASSWORD=password
EOF

# 3. Start containers
docker-compose up --build

# 4. Access application
open http://localhost:3000
```

## Stopping Everything

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v

# Stop and remove everything including images
docker-compose down --rmi all -v
```