# Quick Start Guide - Wishare Development

## Prerequisites Check

```bash
# Check if Docker is running
docker --version
docker compose version

# Check if ports are available
lsof -i :80    # Should be empty
lsof -i :4200  # Should be empty
```

---

## Step 1: Install & Start Appwrite (One-Time Setup)

```bash
# Install Appwrite
mkdir -p ~/appwrite && cd ~/appwrite
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.6

# Start Appwrite
cd ~/appwrite/appwrite
docker compose up -d

# Verify it's running
curl http://localhost/v1/health/version
```

---

## Step 2: Configure Appwrite (One-Time Setup)

1. **Open Console**: http://localhost
2. **Create Account**: Sign up with your email
3. **Create Project**:
   - Name: `wishare`
   - ID: `wishare`
4. **Add Platform** (Settings → Platforms → Add Platform → Web):
   - Name: `Wishare Web`
   - Hostname: `localhost`
5. **Create Database**:
   - ID: `wishare`
   - Name: `Wishare Database`
6. **Create Collections**:
   
   **Collection: wishlists**
   - ID: `wishlists`
   - Attributes: `title` (string, 255), `uid` (string, 255), `description` (string, 1000)
   - Index: `uid` (ASC)
   
   **Collection: wishes**
   - ID: `wishes`
   - Attributes: `title` (string, 255), `wlid` (string, 255), `url` (string, 1000), `description` (string, 2000)
   - Index: `wlid` (ASC)

---

## Step 3: Start Development

```bash
# Navigate to project
cd /Users/torbenbang/git/wishare

# Start dev server
nx serve wishare

# Open in browser
# http://localhost:4200
```

---

## Daily Workflow

### Starting Your Day

```bash
# 1. Start Appwrite (if not running)
cd ~/appwrite/appwrite && docker compose up -d

# 2. Start Angular app
cd /Users/torbenbang/git/wishare && nx serve wishare
```

### Ending Your Day

```bash
# Stop Angular (Ctrl+C in terminal)

# Stop Appwrite (optional, can leave running)
cd ~/appwrite/appwrite && docker compose down
```

---

## Useful Commands

```bash
# Run tests
nx test wishare

# Run linting
nx lint wishare

# Build for production
nx build wishare

# Check Appwrite status
docker ps | grep appwrite

# View Appwrite logs
cd ~/appwrite/appwrite && docker compose logs -f
```

---

## Troubleshooting

### Port 80 in use?
```bash
# Find what's using it
sudo lsof -i :80

# On Mac, often Apache:
sudo apachectl stop
```

### Appwrite not responding?
```bash
# Check containers
docker ps

# Restart Appwrite
cd ~/appwrite/appwrite
docker compose restart
```

### CORS errors?
- Verify `localhost` is added as a platform in Appwrite Console
- Make sure hostname is exactly `localhost` (no protocol)

---

## Documentation

- 📘 **Full Appwrite Setup**: See `APPWRITE-LOCAL-SETUP.md`
- 📗 **Migration Status**: See `MIGRATION-STATUS.md`
- 📕 **Appwrite API Analysis**: See `APPWRITE-API-ANALYSIS.md`
- 📙 **Deprecation Fixes**: See `DEPRECATION-FIXES.md`

---

## Quick Links

- 🌐 Appwrite Console: http://localhost
- 🚀 Angular App: http://localhost:4200
- 📚 Appwrite Docs: https://appwrite.io/docs
- 💬 Need Help?: https://appwrite.io/discord
