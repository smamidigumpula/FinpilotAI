# MongoDB Credentials Configuration

## ✅ Credentials Configured

- **Username**: `smamidigump`
- **Password**: `Rippling@1234`
- **Database**: `atlas_household_cfo`

## 🔐 Password URL Encoding

MongoDB connection strings require URL encoding. Your password has been automatically encoded:

- Original: `Rippling@1234`
- Encoded: `Rippling%401234` (the `@` symbol becomes `%40`)

## 📝 Creating .env.local File

You have three options:

### Option 1: Use the Setup Script (Easiest)

```bash
./setup-env.sh
```

This script will:
- Create `.env.local` with your MongoDB credentials
- Prompt for your MongoDB Atlas cluster URL
- Prompt for VoyageAI API key
- Generate a secure JWT secret

### Option 2: Manual Creation

Copy the template and update it:

```bash
cp env.local.template .env.local
```

Then edit `.env.local` and update:
- `MONGODB_URI` with your full cluster URL
- `VOYAGE_API_KEY` with your API key

### Option 3: Quick Create (One-liner)

```bash
cat > .env.local << 'EOF'
MONGODB_URI=mongodb+srv://smamidigump:Rippling%401234@YOUR_CLUSTER_URL.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=atlas_household_cfo
VOYAGE_API_KEY=your_voyage_api_key_here
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
EOF
```

Replace `YOUR_CLUSTER_URL` with your actual MongoDB Atlas cluster URL.

## 🔗 Getting Your MongoDB Atlas Cluster URL

1. Login to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Username: `smamidigump`
3. Click on your cluster
4. Click "Connect"
5. Choose "Connect your application"
6. Copy the connection string
7. It will look like: `mongodb+srv://smamidigump:<password>@cluster0.xxxxx.mongodb.net/...`
8. Replace `<password>` with `Rippling%401234` (URL-encoded)

## ✅ Example .env.local File

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://smamidigump:Rippling%401234@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=atlas_household_cfo

# VoyageAI
VOYAGE_API_KEY=your_actual_voyage_api_key_here

# JWT Secret
JWT_SECRET=generated-secret-key-here

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 After Setup

Once `.env.local` is created:

1. **Whitelist your IP** in MongoDB Atlas:
   - Network Access → Add IP Address
   - For local dev: `0.0.0.0/0` (Allow from anywhere)
   - For production: Use specific IPs

2. **Create Vector Search indexes** (see `MONGODB_SETUP.md`)

3. **Start the application**:
   ```bash
   docker-compose up --build
   ```

## 🔍 Verify Connection

Test your MongoDB connection:

```bash
# Using MongoDB Compass
mongodb+srv://smamidigump:Rippling%401234@cluster0.xxxxx.mongodb.net/atlas_household_cfo

# Or from Docker container
docker-compose exec app node -e "require('./lib/mongodb').getDb().then(db => console.log('Connected!', db.databaseName)).catch(e => console.error('Error:', e))"
```

## ⚠️ Security Notes

- ✅ `.env.local` is in `.gitignore` (won't be committed)
- ✅ Password is URL-encoded in connection string
- ⚠️ Never share or commit credentials
- ⚠️ Use different credentials for production
- ⚠️ Rotate passwords regularly

## 📚 More Information

- See `MONGODB_SETUP.md` for detailed MongoDB setup
- See `QUICKSTART.md` for quick start guide
- See `DOCKER.md` for Docker-specific setup