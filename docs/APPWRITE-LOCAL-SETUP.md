# Running Appwrite Locally - Complete Setup Guide

## Prerequisites

✅ Docker installed and running
✅ Docker Compose installed
✅ At least 2GB of free RAM
✅ Ports 80 and 443 available

---

## Quick Start (Recommended Method)

### 1. Install Appwrite

Run the Appwrite installation script:

```bash
# Create a directory for Appwrite
mkdir -p ~/appwrite
cd ~/appwrite

# Run the installation command
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.6
```

**During installation, you'll be asked:**

- HTTP Port: Press Enter for default (80)
- HTTPS Port: Press Enter for default (443)
- Hostname: Enter `localhost` or your local IP
- Setup SSL: Choose No for local development

### 2. Start Appwrite

```bash
cd ~/appwrite/appwrite
docker compose up -d
```

### 3. Access Appwrite Console

Open your browser and go to:

```
http://localhost
```

You should see the Appwrite console login/signup page.

---

## Initial Setup in Appwrite Console

### 1. Create an Account

1. Open http://localhost
2. Click "Sign Up"
3. Create your admin account:
   - Name: Your name
   - Email: your-email@example.com
   - Password: Create a secure password

### 2. Create a Project

1. Click "Create Project"
2. Enter project details:
   - **Name**: `wishare`
   - **Project ID**: `wishare` (must match your environment config)
3. Click "Create"

### 3. Add a Web Platform

1. In your project, go to **Settings** → **Platforms**
2. Click **Add Platform** → **Web App**
3. Enter:
   - **Name**: `Wishare Web`
   - **Hostname**: `localhost`
4. Click **Add**

### 4. Get Your Project ID

1. Go to **Settings** → **General**
2. Copy the **Project ID** (should be "wishare")
3. Verify it matches `environment.ts`:

```typescript
appwriteProject: 'wishare';
```

### 5. Create Database

1. Go to **Databases** in the left menu
2. Click **Create Database**
3. Enter:
   - **Database ID**: `wishare`
   - **Name**: `Wishare Database`
4. Click **Create**

### 6. Create Collections

You need to create the following collections:

#### Collection: `wishlists`

1. Click **Create Collection**
2. **Collection ID**: `wishlists`
3. **Name**: `Wishlists`
4. Click **Create**
5. Go to **Attributes** tab
6. Add these attributes:

| Attribute   | Type   | Size | Required |
| ----------- | ------ | ---- | -------- |
| title       | String | 255  | Yes      |
| uid         | String | 255  | Yes      |
| description | String | 1000 | No       |

7. Create an Index:
   - Go to **Indexes** tab
   - Click **Create Index**
   - Type: **Key**
   - Attribute: `uid`
   - Order: ASC

8. Set Permissions:
   - Go to **Settings** tab
   - Under **Permissions**, add:
     - **Create**: Any authenticated user
     - **Read**: Document owner
     - **Update**: Document owner
     - **Delete**: Document owner

#### Collection: `wishes`

1. Click **Create Collection**
2. **Collection ID**: `wishes`
3. **Name**: `Wishes`
4. Click **Create**
5. Add attributes:

| Attribute   | Type   | Size | Required |
| ----------- | ------ | ---- | -------- |
| title       | String | 255  | Yes      |
| url         | String | 1000 | No       |
| description | String | 2000 | No       |
| price       | String | 50   | No       |
| image       | String | 1000 | No       |

6. The `wishlist` attribute is created automatically via the two-way relationship from wishlists.

7. Set Permissions (same as wishlists)

### 7. Enable OAuth (Optional - for Google Sign-In)

1. Go to **Auth** → **Settings**
2. Scroll to **OAuth2 Providers**
3. Enable **Google**:
   - You'll need Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
   - Enter **Client ID** and **Client Secret**
   - Redirect URL: `http://localhost/v1/account/sessions/oauth2/callback/google/redirect`

---

## Verify Configuration

Check your Angular app configuration matches:

**File**: `apps/wishare/src/environments/environment.ts`

```typescript
export const environment: AppConfig = {
  production: false,
  appwriteDatabase: 'wishare', // ✓ Database ID
  appwriteProject: 'wishare', // ✓ Project ID
  appwriteEndpoint: 'http://localhost/v1', // ✓ Endpoint
};
```

---

## Testing the Setup

### 1. Check Appwrite is Running

```bash
# Check all containers are running
docker ps

# You should see containers like:
# - appwrite
# - appwrite-mariadb
# - appwrite-redis
# - appwrite-worker-*
```

### 2. Test the API

```bash
# Test health endpoint
curl http://localhost/v1/health/version

# Should return Appwrite version info
```

### 3. Run Your Angular App

```bash
cd /Users/torbenbang/git/wishare
nx serve wishare
```

Then open http://localhost:4200 and try to:

- Sign up for an account
- Log in
- Create a wishlist

---

## Common Issues & Solutions

### Issue: Port 80 Already in Use

**Solution 1**: Change Appwrite port

```bash
cd ~/appwrite/appwrite
nano .env

# Change:
_APP_HTTP_PORT=8080
_APP_HTTPS_PORT=8443

# Restart:
docker compose down
docker compose up -d
```

Then update your Angular config:

```typescript
appwriteEndpoint: 'http://localhost:8080/v1',
```

**Solution 2**: Stop the conflicting service

```bash
# Find what's using port 80
sudo lsof -i :80

# On Mac, it's often Apache:
sudo apachectl stop
```

### Issue: Docker Compose Not Found

```bash
# Install Docker Compose
brew install docker-compose
```

### Issue: Cannot Connect to Appwrite

1. Check Appwrite is running:

```bash
docker ps | grep appwrite
```

2. Check logs:

```bash
cd ~/appwrite/appwrite
docker compose logs -f appwrite
```

3. Verify endpoint in browser:

```
http://localhost/v1/health/version
```

### Issue: CORS Errors in Browser

1. Make sure you added `localhost` as a platform in Appwrite Console
2. Go to **Settings** → **Platforms**
3. Verify hostname is exactly `localhost` (not `http://localhost`)

---

## Useful Docker Commands

```bash
# Start Appwrite
cd ~/appwrite/appwrite
docker compose up -d

# Stop Appwrite
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f appwrite

# Restart Appwrite
docker compose restart

# Stop and remove all containers (careful!)
docker compose down -v

# Update Appwrite to latest version
docker compose pull
docker compose up -d --force-recreate
```

---

## Development Workflow

### Starting Your Development Session

```bash
# 1. Start Appwrite (if not already running)
cd ~/appwrite/appwrite
docker compose up -d

# 2. Verify it's running
curl http://localhost/v1/health/version

# 3. Start your Angular app
cd /Users/torbenbang/git/wishare
nx serve wishare

# 4. Open in browser
# http://localhost:4200
```

### Stopping Everything

```bash
# Stop Angular app
# Press Ctrl+C in the terminal running nx serve

# Stop Appwrite (optional, can keep it running)
cd ~/appwrite/appwrite
docker compose down
```

---

## Environment Variables Reference

Your app uses these settings from `environment.ts`:

| Variable           | Value                 | Description              |
| ------------------ | --------------------- | ------------------------ |
| `appwriteEndpoint` | `http://localhost/v1` | Appwrite API endpoint    |
| `appwriteProject`  | `wishare`             | Project ID from console  |
| `appwriteDatabase` | `wishare`             | Database ID from console |

---

## Alternative: Using Appwrite Cloud

If you prefer not to run Appwrite locally:

1. Sign up at https://cloud.appwrite.io
2. Create a project named "wishare"
3. Create database and collections as described above
4. Update your environment:

```typescript
export const environment: AppConfig = {
  production: false,
  appwriteDatabase: 'wishare',
  appwriteProject: 'your-project-id-from-cloud',
  appwriteEndpoint: 'https://cloud.appwrite.io/v1',
};
```

---

## Quick Reference Commands

```bash
# Install Appwrite
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.6

# Start
cd ~/appwrite/appwrite && docker compose up -d

# Stop
cd ~/appwrite/appwrite && docker compose down

# View logs
cd ~/appwrite/appwrite && docker compose logs -f

# Check status
docker ps | grep appwrite

# Test API
curl http://localhost/v1/health/version

# Access console
open http://localhost
```

---

## Next Steps

After Appwrite is running:

1. ✅ Access console at http://localhost
2. ✅ Create admin account
3. ✅ Create project "wishare"
4. ✅ Create database "wishare"
5. ✅ Create collections (wishlists, wishes)
6. ✅ Add localhost platform
7. ✅ Run your Angular app: `nx serve wishare`
8. ✅ Test signup/login functionality

---

## Support Resources

- **Appwrite Docs**: https://appwrite.io/docs
- **Community Discord**: https://appwrite.io/discord
- **GitHub Issues**: https://github.com/appwrite/appwrite/issues
- **Installation Guide**: https://appwrite.io/docs/installation

---

## Summary

To get started quickly:

```bash
# 1. Install Appwrite
mkdir -p ~/appwrite && cd ~/appwrite
docker run -it --rm \
    --volume /var/run/docker.sock:/var/run/docker.sock \
    --volume "$(pwd)"/appwrite:/usr/src/code/appwrite:rw \
    --entrypoint="install" \
    appwrite/appwrite:1.6

# 2. Start Appwrite
cd ~/appwrite/appwrite
docker compose up -d

# 3. Setup via web console
open http://localhost

# 4. Run your app
cd /Users/torbenbang/git/wishare
nx serve wishare
```

That's it! Your Wishare app should now connect to your local Appwrite instance. 🚀
