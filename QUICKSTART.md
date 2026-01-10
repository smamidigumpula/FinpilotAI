# Quick Start Guide - Docker

Get the application running locally in minutes!

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- MongoDB Atlas account (recommended) or use local MongoDB
- VoyageAI API key

## Option 1: Using MongoDB Atlas (Recommended - 3 minutes)

1. **Get your MongoDB Atlas connection string**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster (free tier works)
   - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`

2. **Get your VoyageAI API key**
   - Go to [VoyageAI](https://www.voyageai.com/)
   - Sign up and get your API key

3. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Edit `.env.local`** with your credentials:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
   MONGODB_DB=atlas_household_cfo
   VOYAGE_API_KEY=your_voyage_api_key_here
   JWT_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   ```

5. **Start the application**
   ```bash
   ./run-docker.sh
   # Or manually:
   docker-compose up --build
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

That's it! 🎉

## Option 2: Using Local MongoDB (5 minutes)

If you want everything to run locally in Docker:

1. **Create environment file**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`**:
   ```env
   MONGODB_URI=mongodb://admin:password@mongo:27017/atlas_household_cfo?authSource=admin
   MONGODB_DB=atlas_household_cfo
   VOYAGE_API_KEY=your_voyage_api_key_here
   JWT_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Start with local MongoDB**
   ```bash
   docker-compose -f docker-compose.local.yml up --build
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## Option 3: Development Mode (with hot-reload)

For development with automatic code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Using Makefile Commands

For convenience, you can use the Makefile:

```bash
# Build images
make build

# Start containers
make up

# Start development mode
make dev

# View logs
make logs

# Stop containers
make down

# Clean everything
make clean

# Show help
make help
```

## First Steps After Starting

1. **Login**: Use any email address (e.g., `demo@example.com`)
2. **Upload Data**: Go to "Upload Data" tab
   - Create an account
   - Upload CSV transactions or enter manually
3. **Ask Questions**: Use the Chat Assistant
   - "How can I reduce my expenses?"
   - "Show me my complete financial picture"
   - "What are my highest interest rates?"

## Seed Sample Data (Optional)

To populate the database with sample data:

```bash
# In a new terminal
docker-compose exec app npx tsx scripts/seed-data.ts
```

Or if running locally (not in Docker):
```bash
npm install -g tsx
tsx scripts/seed-data.ts
```

## Troubleshooting

### Port 3000 already in use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Can't connect to MongoDB
- **Atlas**: Check your IP is whitelisted
- **Local**: Ensure MongoDB container is running: `docker-compose ps`

### Build errors
Clear Docker cache and rebuild:
```bash
docker-compose build --no-cache
```

### View logs
```bash
docker-compose logs -f app
```

## Next Steps

- Read [SETUP.md](./SETUP.md) for detailed setup instructions
- Read [DOCKER.md](./DOCKER.md) for Docker-specific details
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system

## Need Help?

- Check the logs: `docker-compose logs -f`
- Verify environment variables: `docker-compose exec app env`
- Check container status: `docker-compose ps`