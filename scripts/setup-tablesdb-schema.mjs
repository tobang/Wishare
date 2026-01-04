#!/usr/bin/env node
/**
 * Script to set up TablesDB schema with missing columns and relationship
 *
 * Usage:
 *   node scripts/setup-tablesdb-schema.mjs
 *
 * Reads configuration from .env file in project root.
 */

import * as sdk from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client, TablesDB, RelationshipType, RelationMutate, IndexType } = sdk;

// Load .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
} catch {
  // .env file not found, rely on environment variables
}

// Configuration - defaults to local Appwrite instance
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT || '694ab35e00384ed4a1a5';
const API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = 'wishare';
const WISHES_TABLE = 'wishes';
const WISHLISTS_TABLE = 'wishlists';

if (!API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY environment variable is required');
  console.error('');
  console.error('Get your API key from the Appwrite Console:');
  console.error('  Project Settings → API Keys → Create API Key');
  console.error('  Required scopes: databases.read, databases.write');
  console.error('');
  console.error('Usage:');
  console.error(
    '  APPWRITE_API_KEY=<your-key> node scripts/setup-tablesdb-schema.mjs',
  );
  process.exit(1);
}

// Initialize client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const tablesDB = new TablesDB(client);

async function getExistingColumns(tableId) {
  try {
    const result = await tablesDB.listColumns({
      databaseId: DATABASE_ID,
      tableId: tableId,
    });
    return result.columns.map((col) => col.key);
  } catch (error) {
    console.error(`  Failed to get columns for ${tableId}:`, error.message);
    return [];
  }
}

async function createStringColumn(
  tableId,
  key,
  size,
  required,
  defaultValue = null,
) {
  try {
    await tablesDB.createStringColumn({
      databaseId: DATABASE_ID,
      tableId: tableId,
      key: key,
      size: size,
      required: required,
      default: defaultValue,
      array: false,
      encrypt: false,
    });
    console.log(`  ✅ Created string column: ${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ⏭️  Column ${key} already exists`);
    } else {
      console.error(`  ❌ Failed to create ${key}:`, error.message);
    }
  }
}

async function createRelationship() {
  try {
    await tablesDB.createRelationshipColumn({
      databaseId: DATABASE_ID,
      tableId: WISHLISTS_TABLE,
      relatedTableId: WISHES_TABLE,
      type: RelationshipType.OneToMany,
      twoWay: true,
      key: 'wishes',
      twoWayKey: 'wishlist',
      onDelete: RelationMutate.Cascade,
    });
    console.log(
      `  ✅ Created relationship: wishlists.wishes <-> wishes.wishlist`,
    );
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ⏭️  Relationship already exists`);
    } else {
      console.error(`  ❌ Failed to create relationship:`, error.message);
      throw error;
    }
  }
}

async function createIndex(tableId, key, columns, type = 'key') {
  try {
    await tablesDB.createIndex({
      databaseId: DATABASE_ID,
      tableId: tableId,
      key: key,
      type: type === 'unique' ? IndexType.Unique : IndexType.Key,
      columns: columns,
      orders: columns.map(() => 'ASC'),
    });
    console.log(`  ✅ Created index: ${key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ⏭️  Index ${key} already exists`);
    } else {
      console.error(`  ❌ Failed to create index ${key}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Setting up TablesDB Schema');
  console.log('============================');
  console.log(`  Endpoint: ${ENDPOINT}`);
  console.log(`  Project: ${PROJECT_ID}`);
  console.log(`  Database: ${DATABASE_ID}`);
  console.log('');

  // Step 1: Check existing columns on wishes table
  console.log('📋 Checking existing columns on wishes table...');
  const wishesColumns = await getExistingColumns(WISHES_TABLE);
  console.log(`  Found columns: ${wishesColumns.join(', ') || '(none)'}`);
  console.log('');

  // Step 2: Add missing columns to wishes table
  console.log('🔧 Adding missing columns to wishes table...');

  if (!wishesColumns.includes('title')) {
    await createStringColumn(WISHES_TABLE, 'title', 255, true);
  } else {
    console.log('  ⏭️  title already exists');
  }

  if (!wishesColumns.includes('description')) {
    await createStringColumn(WISHES_TABLE, 'description', 2000, false);
  } else {
    console.log('  ⏭️  description already exists');
  }

  if (!wishesColumns.includes('uid')) {
    await createStringColumn(WISHES_TABLE, 'uid', 255, true);
  } else {
    console.log('  ⏭️  uid already exists');
  }

  if (!wishesColumns.includes('url')) {
    await createStringColumn(WISHES_TABLE, 'url', 1000, false);
  } else {
    console.log('  ⏭️  url already exists');
  }

  if (!wishesColumns.includes('image')) {
    await createStringColumn(WISHES_TABLE, 'image', 5000, false);
  } else {
    console.log('  ⏭️  image already exists');
  }
  console.log('');

  // Step 3: Create the relationship
  console.log('🔗 Creating relationship between wishlists and wishes...');
  await createRelationship();
  console.log('');

  // Step 4: Create indexes
  console.log('📇 Creating indexes...');
  await createIndex(WISHES_TABLE, 'uid_idx', ['uid']);
  await createIndex(WISHES_TABLE, 'wishlist_idx', ['wishlist']);
  console.log('');

  console.log('✅ Schema setup complete!');
  console.log('');
  console.log('Your TablesDB now has:');
  console.log(
    '  • wishes table with: title, description, uid, url, image, price, priority, quantity, wishlist',
  );
  console.log(
    '  • wishlists table with: title, description, uid, priority, visibility, wishes',
  );
  console.log(
    '  • One-to-many relationship: wishlists.wishes <-> wishes.wishlist',
  );
}

main().catch((error) => {
  console.error('');
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
