# MongoDB Atlas Setup Guide

## Credentials Configured

- **Username**: smamidigump
- **Password**: Rippling@1234
- **Database**: atlas_household_cfo

## Important Notes

### Password URL Encoding

MongoDB connection strings require URL encoding for special characters. Your password `Rippling@1234` needs to be encoded:

- `@` becomes `%40`
- Encoded password: `Rippling%401234`

### Connection String Format

For MongoDB Atlas, your connection string should be:
```
mongodb+srv://smamidigump:Rippling%401234@cluster.mongodb.net/?retryWrites=true&w=majority
```

Replace `cluster.mongodb.net` with your actual cluster URL from MongoDB Atlas.

## Getting Your Cluster URL

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Login with username: `smamidigump`
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string
6. Replace `<password>` with `Rippling%401234` (URL-encoded)

## Full Connection String Example

```
mongodb+srv://smamidigump:Rippling%401234@cluster0.xxxxx.mongodb.net/atlas_household_cfo?retryWrites=true&w=majority
```

## Environment Variable Setup

Your `.env.local` file should contain:

```env
MONGODB_URI=mongodb+srv://smamidigump:Rippling%401234@YOUR_CLUSTER_URL.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=atlas_household_cfo
```

## IP Whitelist in MongoDB Atlas

Make sure to whitelist your IP address (or use 0.0.0.0/0 for development):

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. For local development, use "Allow Access from Anywhere" (0.0.0.0/0)
4. For production, use specific IP addresses

## Database User Permissions

Ensure your user `smamidigump` has:
- **Read and write** permissions on the database
- Access to create collections and indexes

## Vector Search Index Setup

After connecting, set up Vector Search indexes in MongoDB Atlas:

1. Go to "Atlas Search" tab
2. Create indexes as described in `lib/vector-index-setup.ts`:
   - `transactions_vector_index` on `transactions` collection
   - `insights_vector_index` on `insights` collection
   - `chat_messages_vector_index` on `chat_messages` collection

## Testing Connection

Test your connection:

```bash
# Using MongoDB Compass or MongoDB Shell
mongosh "mongodb+srv://smamidigump:Rippling%401234@cluster.mongodb.net/atlas_household_cfo"
```

Or test from the application:

```bash
docker-compose up --build
# Check logs for connection errors
docker-compose logs app
```

## Troubleshooting

### Connection Errors

**Error: Authentication failed**
- Verify username and password are correct
- Ensure password is URL-encoded (`@` → `%40`)
- Check user exists in MongoDB Atlas

**Error: IP not whitelisted**
- Add your IP address in MongoDB Atlas Network Access
- For Docker, you may need to whitelist Docker network IPs

**Error: Timeout**
- Check firewall settings
- Verify cluster is running in MongoDB Atlas
- Ensure cluster URL is correct

### URL Encoding Reference

Special characters that need encoding:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- ` ` (space) → `%20`

### Quick URL Encode Command

```bash
# Using Python
python3 -c "import urllib.parse; print(urllib.parse.quote('Rippling@1234'))"
# Output: Rippling%401234
```

## Security Notes

⚠️ **Important for Production:**

1. Never commit `.env.local` to git (already in .gitignore)
2. Use environment-specific credentials
3. Rotate passwords regularly
4. Use MongoDB Atlas IP whitelisting
5. Enable MongoDB Atlas authentication
6. Use MongoDB Atlas encryption at rest
7. Monitor access logs

## Next Steps

1. ✅ Credentials configured in `.env.local`
2. ⏭️ Get your cluster URL from MongoDB Atlas
3. ⏭️ Update `MONGODB_URI` in `.env.local` with full cluster URL
4. ⏭️ Whitelist your IP address in MongoDB Atlas
5. ⏭️ Create Vector Search indexes
6. ⏭️ Run `docker-compose up --build`