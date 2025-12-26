# Migrating appwrite.json from nx-wishare to Wishare

## Overview

I've successfully migrated your Appwrite database schema from the old `nx-wishare` project to the new workspace. The configuration includes:

- ✅ **Database**: wishare
- ✅ **Collections**: wishes, wishlists
- ✅ **Attributes**: All fields preserved
- ✅ **Indexes**: Optimized for performance
- ✅ **Functions**: scrapeMetaTags (modernized)

---

## What Was Migrated

### Database Structure

```
wishare (database)
├── wishes (collection)
│   ├── Attributes: title, description, uid, wlid, url, price, priority, quantity, image
│   └── Indexes: wlid_idx, uid_idx, priority_wlid_idx
└── wishlists (collection)
    ├── Attributes: title, description, uid, priority, visibility
    └── Indexes: uid_idx, priority_uid_idx
```

### Changes Made from Old Schema

#### **wishes** Collection

**Added:**
- ✅ `image` attribute (string, 5000 chars) - For storing base64 images

**Updated:**
- ✅ `description` size: 255 → 2000 (more space for details)
- ✅ `url` size: Added explicit 1000 char limit
- ✅ `price`: Now optional (not required) with reasonable max (999999.99)
- ✅ `priority`: Now optional with default value of 1
- ✅ `quantity`: Now optional with default value of 1

**Indexes:**
- ✅ Renamed for clarity: `userid` → `uid_idx`, `wlid` → `wlid_idx`
- ✅ `priority_wlid_idx`: Ensures unique priority per wishlist

#### **wishlists** Collection

**Updated:**
- ✅ `description` size: 255 → 1000 (more space)
- ✅ `priority`: Now optional with default value of 1
- ✅ `visibility`: Now optional with default "draft"

**Indexes:**
- ✅ `uid_idx`: Fast lookups by user ID
- ✅ `priority_uid_idx`: Ensures unique priority per user

---

## Deployment Methods

### Method 1: Using Appwrite CLI (Recommended)

#### Prerequisites

```bash
# Install Appwrite CLI
npm install -g appwrite-cli

# Login to your local Appwrite
appwrite login
# Endpoint: http://localhost/v1
# Email: your-email@example.com
# Password: your-password
```

#### Initialize Project

```bash
cd /Users/torbenbang/git/wishare

# Initialize (first time only)
appwrite init project
# Select: Use current directory
# Project ID: wishare
```

#### Deploy Schema

```bash
# Deploy database and collections
appwrite deploy collection

# Verify deployment
appwrite databases list
appwrite databases listCollections --databaseId wishare
```

---

### Method 2: Using Deployment Script

I've created an automated script for you:

```bash
cd /Users/torbenbang/git/wishare

# Run the deployment script
./scripts/deploy-appwrite-schema.sh
```

The script will:
1. ✅ Check if Appwrite CLI is installed
2. ✅ Verify you're logged in
3. ✅ Show what will be deployed
4. ✅ Ask for confirmation
5. ✅ Deploy the schema
6. ✅ Verify deployment

---

### Method 3: Manual Setup via Console

If you prefer to set up manually through the Appwrite Console:

#### Step 1: Create Database

1. Open http://localhost
2. Go to **Databases**
3. Click **Create Database**
4. Enter:
   - Database ID: `wishare`
   - Name: `Wishare Database`

#### Step 2: Create "wishes" Collection

1. Click **Create Collection**
2. Enter:
   - Collection ID: `wishes`
   - Name: `Wishes`
3. Enable **Document Security**
4. Click **Create**

**Add Attributes:**

| Key | Type | Size | Required | Default |
|-----|------|------|----------|---------|
| title | String | 255 | Yes | - |
| description | String | 2000 | No | - |
| uid | String | 255 | Yes | - |
| wlid | String | 255 | Yes | - |
| url | String | 1000 | No | - |
| price | Double | - | No | - |
| priority | Integer | - | No | 1 |
| quantity | Integer | - | No | 1 |
| image | String | 5000 | No | - |

**Add Indexes:**

| Key | Type | Attributes | Order |
|-----|------|------------|-------|
| wlid_idx | Key | wlid | ASC |
| uid_idx | Key | uid | ASC |
| priority_wlid_idx | Unique | priority, wlid | ASC, ASC |

#### Step 3: Create "wishlists" Collection

1. Click **Create Collection**
2. Enter:
   - Collection ID: `wishlists`
   - Name: `Wishlists`
3. Enable **Document Security**

**Add Attributes:**

| Key | Type | Size | Required | Default | Elements |
|-----|------|------|----------|---------|----------|
| title | String | 255 | Yes | - | - |
| description | String | 1000 | No | - | - |
| uid | String | 255 | Yes | - | - |
| priority | Integer | - | No | 1 | - |
| visibility | Enum | - | No | draft | draft, published, archived |

**Add Indexes:**

| Key | Type | Attributes | Order |
|-----|------|------------|-------|
| uid_idx | Key | uid | ASC |
| priority_uid_idx | Unique | priority, uid | ASC, ASC |

---

## Permissions Setup

For both collections, you'll want to set up permissions:

### Recommended Permissions

**wishes collection:**
```
Create: Any authenticated user
Read: User who created the document (owner)
Update: User who created the document (owner)
Delete: User who created the document (owner)
```

**wishlists collection:**
```
Create: Any authenticated user
Read: User who created the document (owner)
Update: User who created the document (owner)
Delete: User who created the document (owner)
```

### Setting Permissions via Console

1. Go to collection **Settings** tab
2. Click **Permissions**
3. Add permission rules:
   - **Role**: `user:{{userId}}`
   - **Permissions**: Create, Read, Update, Delete

### Setting Permissions via CLI

```bash
# This will be handled automatically when deploying with appwrite.json
# if you add permissions to the JSON file
```

---

## Verification

After deployment, verify everything is set up correctly:

```bash
# List databases
appwrite databases list

# List collections
appwrite databases listCollections --databaseId wishare

# Get collection details
appwrite databases getCollection \
  --databaseId wishare \
  --collectionId wishes

appwrite databases getCollection \
  --databaseId wishare \
  --collectionId wishlists
```

**Or via Console:**

1. Open http://localhost
2. Go to **Databases** → **wishare**
3. You should see:
   - ✅ wishes collection with 9 attributes, 3 indexes
   - ✅ wishlists collection with 5 attributes, 2 indexes

---

## Testing the Setup

### Create a Test Document

```bash
# Create a test wishlist
appwrite databases createDocument \
  --databaseId wishare \
  --collectionId wishlists \
  --documentId unique() \
  --data '{
    "title": "My Test Wishlist",
    "description": "Testing the migration",
    "uid": "test-user-123",
    "priority": 1,
    "visibility": "draft"
  }'
```

### Query Documents

```bash
# List all wishlists
appwrite databases listDocuments \
  --databaseId wishare \
  --collectionId wishlists
```

---

## Troubleshooting

### Error: "Collection already exists"

If you get this error, the collection already exists. You can:

**Option 1**: Delete and recreate
```bash
# Delete collection
appwrite databases deleteCollection \
  --databaseId wishare \
  --collectionId wishes

# Then deploy again
appwrite deploy collection
```

**Option 2**: Update instead of create
The CLI should automatically update if the collection exists.

### Error: "Database not found"

Create the database first:

```bash
# Create database
appwrite databases create \
  --databaseId wishare \
  --name "Wishare Database"

# Then deploy collections
appwrite deploy collection
```

### CLI Not Authenticated

```bash
# Login again
appwrite login
# Endpoint: http://localhost/v1
# Email: your-email@example.com
# Password: your-password
```

---

## What's Next?

After deploying the schema:

1. ✅ **Test in Console**: Create some test documents
2. ✅ **Update Your App**: Make sure your Angular app connects properly
3. ✅ **Deploy Functions**: Deploy the scrapeMetaTags function
4. ✅ **Set Up Auth**: Configure authentication and user permissions
5. ✅ **Import Data**: If you have existing data, import it

---

## Files Created/Updated

- ✅ `appwrite.json` - Complete database schema configuration
- ✅ `scripts/deploy-appwrite-schema.sh` - Automated deployment script
- ✅ `APPWRITE-SCHEMA-MIGRATION.md` - This migration guide

---

## Summary

**Status**: ✅ **Ready to Deploy**

Your Appwrite schema has been successfully migrated with:
- ✅ 1 Database (wishare)
- ✅ 2 Collections (wishes, wishlists)
- ✅ 14 Attributes total
- ✅ 5 Indexes for performance
- ✅ 1 Function (scrapeMetaTags)
- ✅ Deployment automation ready

**To deploy now:**
```bash
cd /Users/torbenbang/git/wishare
./scripts/deploy-appwrite-schema.sh
```

Or manually:
```bash
appwrite login
appwrite deploy collection
```

Your database schema will be fully set up and ready to use! 🚀
