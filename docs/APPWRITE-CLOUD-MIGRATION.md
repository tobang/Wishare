# Appwrite Local to Cloud Migration Guide (CLI/SDK)

This guide explains how to migrate your local Appwrite project to Appwrite Cloud using the **Appwrite CLI** and **SDK**.

## Prerequisites

1. **Appwrite CLI installed** - Install via npm: `npm install -g appwrite-cli`
2. An Appwrite Cloud account at [cloud.appwrite.io](https://cloud.appwrite.io)
3. Your local Appwrite instance running

## Method 1: Using the Appwrite CLI (Recommended)

The CLI provides `pull` and `push` commands to sync your project configuration between instances.

### Step 1: Pull Configuration from Local Instance

First, configure the CLI to point to your **local** Appwrite instance:

```bash
# Login to your local Appwrite instance
appwrite login

# Or configure non-interactively
appwrite client \
    --endpoint http://localhost/v1 \
    --project-id <LOCAL_PROJECT_ID>
```

Initialize and pull your local project configuration:

```bash
# Initialize the project (creates appwrite.config.json)
appwrite init project

# Pull all resources from your local instance
appwrite pull all
```

Or pull specific resources:

```bash
# Pull databases and tables (collections)
appwrite pull tables

# Pull functions
appwrite pull functions

# Pull storage buckets
appwrite pull buckets

# Pull teams
appwrite pull teams
```

### Step 2: Configure CLI for Cloud

Now switch the CLI to point to **Appwrite Cloud**:

```bash
# Login to Appwrite Cloud
appwrite login

# Or configure non-interactively with API key
appwrite client \
    --endpoint https://cloud.appwrite.io/v1 \
    --project-id <CLOUD_PROJECT_ID> \
    --key <YOUR_API_KEY>
```

### Step 3: Push Configuration to Cloud

Push your local configuration to Appwrite Cloud:

```bash
# Push all resources
appwrite push all --all --force

# Or push specific resources
appwrite push tables --all --force
appwrite push functions --all --force
appwrite push buckets --all --force
appwrite push teams --all --force
```

### What the CLI Migrates

| Resource         | Pull Command              | Push Command              |
| ---------------- | ------------------------- | ------------------------- |
| Databases/Tables | `appwrite pull tables`    | `appwrite push tables`    |
| Functions        | `appwrite pull functions` | `appwrite push functions` |
| Buckets          | `appwrite pull buckets`   | `appwrite push buckets`   |
| Teams            | `appwrite pull teams`     | `appwrite push teams`     |

> **Note:** The CLI migrates **schema and configuration only**, not the actual data (documents, files, users).

---

## Method 2: Using the SDK (Programmatic Migration)

For migrating actual data (documents, files, users), use the Appwrite SDK to programmatically export and import.

### Step 1: Create a Migration Script

Create a Node.js script to export data from your local instance:

```javascript
// migrate.js
const sdk = require('node-appwrite');

// Source: Local Appwrite
const localClient = new sdk.Client().setEndpoint('http://localhost/v1').setProject('<LOCAL_PROJECT_ID>').setKey('<LOCAL_API_KEY>');

// Destination: Appwrite Cloud
const cloudClient = new sdk.Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('<CLOUD_PROJECT_ID>').setKey('<CLOUD_API_KEY>');

const localDatabases = new sdk.Databases(localClient);
const cloudDatabases = new sdk.Databases(cloudClient);

async function migrateDocuments(databaseId, collectionId) {
  let offset = 0;
  const limit = 100;

  while (true) {
    // Fetch documents from local
    const response = await localDatabases.listDocuments(databaseId, collectionId, [sdk.Query.limit(limit), sdk.Query.offset(offset)]);

    if (response.documents.length === 0) break;

    // Create documents in Cloud
    for (const doc of response.documents) {
      const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = doc;

      try {
        await cloudDatabases.createDocument(
          databaseId,
          collectionId,
          $id, // Keep the same document ID
          data,
          $permissions,
        );
        console.log(`Migrated document: ${$id}`);
      } catch (error) {
        console.error(`Failed to migrate ${$id}:`, error.message);
      }
    }

    offset += limit;
  }
}

// Run migration
migrateDocuments('<DATABASE_ID>', '<COLLECTION_ID>');
```

### Step 2: Migrate Storage Files

```javascript
const localStorage = new sdk.Storage(localClient);
const cloudStorage = new sdk.Storage(cloudClient);
const fs = require('fs');
const path = require('path');

async function migrateFiles(bucketId) {
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await localStorage.listFiles(bucketId, [sdk.Query.limit(limit), sdk.Query.offset(offset)]);

    if (response.files.length === 0) break;

    for (const file of response.files) {
      try {
        // Download from local
        const fileData = await localStorage.getFileDownload(bucketId, file.$id);
        const tempPath = path.join('/tmp', file.name);
        fs.writeFileSync(tempPath, Buffer.from(fileData));

        // Upload to Cloud
        await cloudStorage.createFile(bucketId, file.$id, sdk.InputFile.fromPath(tempPath, file.name), file.$permissions);

        console.log(`Migrated file: ${file.name}`);
        fs.unlinkSync(tempPath);
      } catch (error) {
        console.error(`Failed to migrate file ${file.$id}:`, error.message);
      }
    }

    offset += limit;
  }
}
```

### Step 3: Migrate Users

```javascript
const localUsers = new sdk.Users(localClient);
const cloudUsers = new sdk.Users(cloudClient);

async function migrateUsers() {
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await localUsers.list([sdk.Query.limit(limit), sdk.Query.offset(offset)]);

    if (response.users.length === 0) break;

    for (const user of response.users) {
      try {
        // Note: Password hashes cannot be migrated directly
        // Users will need to reset their passwords
        await cloudUsers.create(
          user.$id,
          user.email,
          undefined, // Phone
          undefined, // Password - cannot migrate hash
          user.name,
        );
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Failed to migrate user ${user.$id}:`, error.message);
      }
    }

    offset += limit;
  }
}
```

---

## CI/CD Integration

For automated deployments, use the CLI in non-interactive mode:

```bash
# Set up CI/CD environment
appwrite client \
    --endpoint https://cloud.appwrite.io/v1 \
    --project-id $APPWRITE_PROJECT_ID \
    --key $APPWRITE_API_KEY

# Push all resources with force flag
appwrite push all --all --force
```

### GitHub Actions Example

```yaml
# .github/workflows/deploy-appwrite.yml
name: Deploy to Appwrite Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Appwrite CLI
        run: npm install -g appwrite-cli

      - name: Configure Appwrite CLI
        run: |
          appwrite client \
            --endpoint https://cloud.appwrite.io/v1 \
            --project-id ${{ secrets.APPWRITE_PROJECT_ID }} \
            --key ${{ secrets.APPWRITE_API_KEY }}

      - name: Deploy to Cloud
        run: appwrite push all --all --force
```

---

## Important Considerations

### What CLI Push/Pull Does NOT Migrate

- ❌ **Documents/Data** - Only schema is migrated
- ❌ **Files** - Only bucket configuration, not actual files
- ❌ **Users** - User accounts are not migrated
- ❌ **Sessions** - All sessions are instance-specific

### For Full Data Migration

Use the SDK-based approach above, or use the Console-based migration if your local instance is publicly accessible.

### Timestamps

⚠️ When using SDK migration, `$createdAt` and `$updatedAt` timestamps will be reset to the migration date.

### Passwords

⚠️ User passwords cannot be directly migrated. Users will need to use "Forgot Password" or you'll need to set temporary passwords.

---

## Post-Migration Checklist

- [ ] Push database schema using CLI
- [ ] Push functions using CLI
- [ ] Push bucket configurations using CLI
- [ ] Run SDK script to migrate documents
- [ ] Run SDK script to migrate files
- [ ] Notify users to reset passwords (if migrating users)
- [ ] Update application endpoint to Cloud URL
- [ ] Generate new API keys for production
- [ ] Reconfigure OAuth providers with Cloud callback URLs
- [ ] Update environment variables:
  ```
  APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
  APPWRITE_PROJECT_ID=<your-cloud-project-id>
  ```

---

## CLI Command Reference

| Command                                 | Description                      |
| --------------------------------------- | -------------------------------- |
| `appwrite login`                        | Authenticate with Appwrite       |
| `appwrite client --endpoint <url>`      | Set API endpoint                 |
| `appwrite init project`                 | Initialize project configuration |
| `appwrite pull tables`                  | Pull database/collection schema  |
| `appwrite pull functions`               | Pull function configurations     |
| `appwrite pull buckets`                 | Pull bucket configurations       |
| `appwrite push tables --all --force`    | Push all tables                  |
| `appwrite push functions --all --force` | Push all functions               |
| `appwrite push all --all --force`       | Push everything                  |

---

## Resources

- [Appwrite CLI Documentation](https://appwrite.io/docs/tooling/command-line/commands)
- [Appwrite Node.js SDK](https://appwrite.io/docs/sdks#server)
- [Appwrite Cloud Console](https://cloud.appwrite.io)
