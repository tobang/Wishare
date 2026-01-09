# Appwrite Functions Troubleshooting Guide

This document outlines common issues when running Appwrite Functions locally and how to resolve them.

## Common Error: "fetch failed" in Function Execution

### Symptoms

- Function execution returns status `failed` with error `fetch failed`
- Logs show `Using endpoint: http://localhost/v1`
- Response body is empty or shows `{"success":false,"error":"fetch failed"}`

### Root Cause

The function runtime container cannot reach the Appwrite API because:

1. Docker networks are not properly connected
2. The `APPWRITE_FUNCTION_API_ENDPOINT` points to `localhost` which isn't accessible from inside containers

---

## Troubleshooting Commands

### 1. Check Docker Network Configuration

```bash
# List all Docker networks
docker network ls | grep appwrite

# Check what networks a container is on
docker inspect openruntimes-executor --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool

docker inspect appwrite --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool

docker inspect appwrite-worker-builds --format '{{json .NetworkSettings.Networks}}' | python3 -m json.tool
```

### 2. Check Container Status

```bash
# List all Appwrite-related containers
docker ps --format "{{.Names}} {{.Status}}" | grep -E "appwrite|openruntimes"

# Check for executor container specifically
docker ps -a --format "{{.Names}} {{.Status}}" | grep -i exec
```

### 3. Check Function Execution Logs

```bash
# List recent function executions
appwrite functions list-executions --function-id <function-id>

# Check build worker logs for deployment errors
docker logs appwrite-worker-builds --tail 50 2>&1 | grep -A 20 "<deployment-id>"

# Check executor logs
docker logs openruntimes-executor --tail 100 2>&1 | tail -50

# Check for errors in executor
docker logs openruntimes-executor 2>&1 | grep -i "error\|failed\|exception" | tail -20
```

### 4. Check Function Environment Variables

```bash
# List function variables
appwrite functions list-variables --function-id <function-id>

# Create a new environment variable
appwrite functions create-variable --function-id <function-id> --key APPWRITE_ENDPOINT --value "http://appwrite/v1"
```

---

## Fixes

### Fix 1: Connect Docker Networks

The executor runs on the `runtimes` network, but Appwrite services run on the `appwrite` network. They need to be able to communicate.

```bash
# Connect executor to appwrite network (allows builds to work)
docker network connect appwrite openruntimes-executor

# Connect appwrite to runtimes network (allows function code to reach API)
docker network connect runtimes appwrite
```

### Fix 2: Set Correct Endpoint Environment Variable

Functions need to reach the Appwrite API using the Docker hostname `appwrite`, not `localhost`.

```bash
# Create the APPWRITE_ENDPOINT variable for the function
appwrite functions create-variable \
  --function-id reorderItems \
  --key APPWRITE_ENDPOINT \
  --value "http://appwrite/v1"
```

### Fix 3: Force Redeploy Function

After setting environment variables, force a new deployment:

```bash
appwrite push functions --function-id <function-id> --force
```

---

## Function Code Best Practice

In your function code, use a fallback pattern for the endpoint:

```javascript
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // Priority: Custom env var > Appwrite's default > Fallback to internal hostname
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'http://appwrite/v1';

  log(`Using endpoint: ${endpoint}`);

  const client = new Client().setEndpoint(endpoint).setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID).setKey(req.headers['x-appwrite-key']);

  // ... rest of function
};
```

---

## Making Network Connections Permanent

The `docker network connect` commands are temporary and will be lost when containers restart. To make them permanent, you have two options:

### Option A: Create a startup script

Create a script that runs after Appwrite starts:

```bash
#!/bin/bash
# scripts/connect-appwrite-networks.sh

# Wait for containers to be ready
sleep 10

# Connect networks
docker network connect appwrite openruntimes-executor 2>/dev/null || true
docker network connect runtimes appwrite 2>/dev/null || true

echo "Networks connected"
```

### Option B: Modify docker-compose.yml

In your Appwrite installation directory (`~/appwrite/appwrite/`), modify the `docker-compose.yml` to add network configurations to the relevant services.

---

## Quick Diagnostic Checklist

1. ☐ Is the executor container running? (`docker ps | grep executor`)
2. ☐ Is the executor on the `appwrite` network? (`docker network connect appwrite openruntimes-executor`)
3. ☐ Is appwrite on the `runtimes` network? (`docker network connect runtimes appwrite`)
4. ☐ Does the function have `APPWRITE_ENDPOINT` variable set? (`appwrite functions list-variables`)
5. ☐ Has the function been redeployed after setting variables? (`appwrite push functions --force`)
6. ☐ Check execution logs for the endpoint being used

---

## SDK Version Compatibility

Ensure your function's SDK version matches your Appwrite server version:

| Appwrite Version | node-appwrite Version |
| ---------------- | --------------------- |
| 1.8.x            | ^14.1.0               |
| 1.6.x            | ^14.0.0               |

Check your Appwrite version:

```bash
docker ps --format "{{.Image}}" | grep appwrite/appwrite | head -1
```

Update function's `package.json`:

```json
{
  "dependencies": {
    "node-appwrite": "^14.1.0"
  }
}
```
