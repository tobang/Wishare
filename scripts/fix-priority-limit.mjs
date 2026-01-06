#!/usr/bin/env node
/**
 * Script to fix priority attribute limits in TablesDB
 *
 * Usage:
 *   node scripts/fix-priority-limit.mjs
 *
 * Reads configuration from .env file in project root.
 */

import * as sdk from 'node-appwrite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client, TablesDB } = sdk;

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

// Configuration
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT || '694ab35e00384ed4a1a5';
const API_KEY = process.env.APPWRITE_API_KEY;

const DATABASE_ID = 'wishare';
const WISHES_TABLE = 'wishes';
const WISHLISTS_TABLE = 'wishlists';

if (!API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY environment variable is required');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new TablesDB(client);

// Moderate range to test
const MIN_INT = 0;
const MAX_INT = 2000000000;

async function updatePriorityAttribute(tableId) {
  console.log(`🔧 Updating 'priority' attribute for table '${tableId}'...`);
  try {
    // Try updateIntegerColumn (older API usually takes object)
    await databases.updateIntegerColumn({
      databaseId: DATABASE_ID,
      tableId: tableId,
      key: 'priority',
      required: false,
      min: MIN_INT,
      max: MAX_INT,
      default: 0,
      xdefault: 0, // Attempt to fix "Missing required parameter: xdefault"
    });
    console.log(
      `  ✅ Updated 'priority' for ${tableId} to range [${MIN_INT}, ${MAX_INT}]`,
    );
  } catch (error) {
    console.log(
      `  ⚠️  updateIntegerColumn failed: ${error.message} (code: ${error.code})`,
    );
    console.log('      Trying updateIntegerAttribute (v2)...');
    try {
      await databases.updateIntegerAttribute(
        DATABASE_ID,
        tableId,
        'priority',
        false,
        MIN_INT,
        MAX_INT,
        0,
      );
      console.log(`  ✅ Updated 'priority' for ${tableId} (via attribute API)`);
    } catch (err2) {
      if (err2.code === 404) {
        console.log(`  ➕ Attribute 'priority' not found, creating it...`);
        try {
          await databases.createIntegerAttribute(
            DATABASE_ID,
            tableId,
            'priority',
            false,
            MIN_INT,
            MAX_INT,
            0,
          );
          console.log(`  ✅ Created 'priority' for ${tableId}`);
        } catch (createErr) {
          // Fallback for older API if createIntegerAttribute doesn't exist
          await databases.createIntegerColumn({
            databaseId: DATABASE_ID,
            tableId: tableId,
            key: 'priority',
            required: false,
            min: MIN_INT,
            max: MAX_INT,
            default: 0,
          });
          console.log(
            `  ✅ Created 'priority' for ${tableId} (via column API)`,
          );
        }
      } else {
        console.error(
          `  ❌ Failed to update 'priority' for ${tableId}:`,
          err2.message,
        );
      }
    }
  }
}

async function main() {
  console.log('🚀 Fixing Priority Limits');
  console.log('=========================');

  await updatePriorityAttribute(WISHES_TABLE);
  await updatePriorityAttribute(WISHLISTS_TABLE);

  console.log('');
  console.log('✨ All done!');
}

main().catch(console.error);
