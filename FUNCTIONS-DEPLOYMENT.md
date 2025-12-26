# Appwrite Functions - Quick Deployment Guide

## Prerequisites

✅ Appwrite running locally (see `APPWRITE-LOCAL-SETUP.md`)  
✅ Appwrite CLI installed  
✅ Logged into Appwrite CLI  

---

## Install Appwrite CLI

```bash
# Using npm
npm install -g appwrite-cli

# Using homebrew (Mac)
brew install appwrite

# Verify installation
appwrite --version
```

---

## Login to Appwrite

```bash
# Login
appwrite login

# You'll be asked to provide:
# - Endpoint: http://localhost/v1
# - Email: your-email@example.com
# - Password: your-password

# Verify login
appwrite account get
```

---

## Deploy Function

### Method 1: Quick Deploy (Recommended)

```bash
cd /Users/torbenbang/git/wishare

# Initialize project (first time only)
appwrite init project --project wishare

# Install function dependencies
cd functions/scrapeMetaTags
npm install
cd ../..

# Deploy using appwrite.json config
appwrite deploy function

# Select "scrapeMetaTags" when prompted
```

### Method 2: Manual Deploy via Console

1. **Open Console**: http://localhost
2. **Navigate**: Go to **Functions** in sidebar
3. **Create Function**:
   - Click **Create Function**
   - Name: `Scrape Meta Tags`
   - Function ID: `scrapeMetaTags`
   - Runtime: Select **Node.js 21.0**
   - Execute: Select **Any**
   - Timeout: `30` seconds
4. **Deploy Code**:
   - Go to **Deployments** tab
   - Click **Create Deployment**
   - Upload folder: Select `functions/scrapeMetaTags`
   - Entrypoint: `src/main.js`
   - Activate: ✅ Check this box
   - Click **Deploy**

### Method 3: Using CLI Commands

```bash
# Create function
appwrite functions create \
  --functionId scrapeMetaTags \
  --name "Scrape Meta Tags" \
  --runtime "node-21.0" \
  --execute "any" \
  --timeout 30 \
  --enabled true \
  --logging true

# Deploy code
cd functions/scrapeMetaTags
npm install

appwrite functions createDeployment \
  --functionId scrapeMetaTags \
  --activate true \
  --entrypoint "src/main.js" \
  --code .
```

---

## Test Function

### Test via Console

1. Go to **Functions** → **scrapeMetaTags**
2. Click **Execute** tab
3. Click **Execute Now**
4. Enter test data:
```json
{
  "url": "https://github.com"
}
```
5. Click **Execute**
6. Check response in **Executions** tab

### Test via CLI

```bash
# Execute function
appwrite functions createExecution \
  --functionId scrapeMetaTags \
  --body '{"url":"https://github.com"}' \
  --async false

# View execution logs
appwrite functions listExecutions --functionId scrapeMetaTags --limit 1
```

### Test via cURL

```bash
# Get your API key from Appwrite Console → Settings → API Keys
# Create a new key with "functions.write" scope

curl -X POST http://localhost/v1/functions/scrapeMetaTags/executions \
  -H "Content-Type: application/json" \
  -H "X-Appwrite-Project: wishare" \
  -H "X-Appwrite-Key: YOUR_API_KEY" \
  -d '{"data":"{\"url\":\"https://github.com\"}"}'
```

---

## Verify Deployment

### Check Function Status

```bash
# List all functions
appwrite functions list

# Get specific function details
appwrite functions get --functionId scrapeMetaTags

# List deployments
appwrite functions listDeployments --functionId scrapeMetaTags
```

### Expected Output

```
┌─────────────────────┬────────────────────┐
│ ID                  │ scrapeMetaTags     │
│ Name                │ Scrape Meta Tags   │
│ Status              │ enabled            │
│ Runtime             │ node-21.0          │
│ Deployments         │ 1                  │
│ Active Deployment   │ xxxxx              │
└─────────────────────┴────────────────────┘
```

---

## Update Function

### Update Code

```bash
# Make changes to functions/scrapeMetaTags/src/main.js

# Create new deployment
cd functions/scrapeMetaTags
appwrite functions createDeployment \
  --functionId scrapeMetaTags \
  --activate true \
  --entrypoint "src/main.js" \
  --code .
```

### Update Configuration

```bash
# Update function settings
appwrite functions update \
  --functionId scrapeMetaTags \
  --timeout 60 \
  --enabled true
```

---

## Environment Variables

### Set Variables via Console

1. Go to **Functions** → **scrapeMetaTags**
2. Click **Settings** tab
3. Scroll to **Variables**
4. Add variables as needed (Appwrite provides defaults)

### Set Variables via CLI

```bash
# Add environment variable
appwrite functions updateVariable \
  --functionId scrapeMetaTags \
  --key MY_VARIABLE \
  --value "my-value"
```

---

## Monitoring & Logs

### View Recent Executions

```bash
# List recent executions
appwrite functions listExecutions \
  --functionId scrapeMetaTags \
  --limit 10

# Get specific execution
appwrite functions getExecution \
  --functionId scrapeMetaTags \
  --executionId EXECUTION_ID
```

### View Logs in Console

1. Go to **Functions** → **scrapeMetaTags**
2. Click **Executions** tab
3. Click on any execution to see:
   - Request data
   - Response data
   - Logs
   - Execution time
   - Status

---

## Troubleshooting

### Function Not Deploying

**Problem**: Deployment fails with "Invalid entrypoint"

**Solution**:
```bash
# Verify file exists
ls functions/scrapeMetaTags/src/main.js

# Check package.json type
grep '"type"' functions/scrapeMetaTags/package.json
# Should show: "type": "module"
```

### Function Times Out

**Problem**: Execution times out after 30 seconds

**Solution**:
```bash
# Increase timeout
appwrite functions update \
  --functionId scrapeMetaTags \
  --timeout 60
```

### Dependencies Not Found

**Problem**: "Cannot find module 'undici'"

**Solution**:
```bash
# Install dependencies before deploying
cd functions/scrapeMetaTags
npm install

# Then deploy
cd ../..
appwrite deploy function
```

### Permission Denied

**Problem**: "Execution failed: Permission denied"

**Solution**:
```bash
# Update execute permissions
appwrite functions update \
  --functionId scrapeMetaTags \
  --execute "any"

# Or set specific roles
appwrite functions update \
  --functionId scrapeMetaTags \
  --execute "users" "guests"
```

---

## Integration with Angular App

Once deployed, update your Angular service:

```typescript
// libs/web/wish/data-access/src/lib/services/scraper.service.ts
import { Injectable, inject } from '@angular/core';
import { Functions } from 'appwrite';
import { APPWRITE } from '@wishare/web/shared/app-config';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ScraperService {
  private functions = new Functions(inject(APPWRITE).client);

  scrapeUrl(url: string) {
    return from(
      this.functions.createExecution(
        'scrapeMetaTags',
        JSON.stringify({ url })
      )
    ).pipe(
      map(execution => JSON.parse(execution.responseBody))
    );
  }
}
```

---

## Production Deployment

For production deployment to Appwrite Cloud:

```bash
# Login to cloud
appwrite login --endpoint https://cloud.appwrite.io/v1

# Deploy to cloud project
appwrite deploy function --project YOUR_CLOUD_PROJECT_ID
```

---

## Quick Commands Reference

```bash
# Deploy function
appwrite deploy function

# Test function
appwrite functions createExecution \
  --functionId scrapeMetaTags \
  --body '{"url":"https://example.com"}'

# View logs
appwrite functions listExecutions --functionId scrapeMetaTags

# Update function
appwrite functions update --functionId scrapeMetaTags --timeout 60

# Delete function
appwrite functions delete --functionId scrapeMetaTags
```

---

## Next Steps

1. ✅ Install Appwrite CLI
2. ✅ Login to Appwrite
3. ✅ Deploy function
4. ✅ Test with sample URL
5. ✅ Integrate into Angular app
6. 📌 Monitor executions
7. 📌 Set up error alerting (optional)

---

## Support

- **Appwrite Functions Docs**: https://appwrite.io/docs/functions
- **Appwrite CLI Docs**: https://appwrite.io/docs/command-line
- **Discord Community**: https://appwrite.io/discord
- **GitHub Issues**: https://github.com/appwrite/appwrite/issues

---

**Ready to deploy?** Run `appwrite deploy function` and you're live! 🚀
