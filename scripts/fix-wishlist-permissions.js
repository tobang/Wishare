#!/usr/bin/env node

/**
 * Migration script to fix document-level permissions on existing wishlists
 *
 * Problem: Existing wishlist documents were created before proper document-level
 * permissions were set (Permission.update, Permission.delete for the user).
 *
 * Solution: This script uses the Appwrite Server SDK to update each wishlist
 * document's permissions to include read, update, and delete for the owner.
 *
 * Usage:
 *   1. Install dependencies: npm install node-appwrite
 *   2. Set environment variables or update the config below
 *   3. Run: node scripts/fix-wishlist-permissions.mjs
 */

import * as sdk from 'node-appwrite';

// Configuration - update these values or set via environment variables
const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'http://localhost/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || '694ab35e00384ed4a1a5',
  apiKey: process.env.APPWRITE_API_KEY, // Required - get from Appwrite Console
  databaseId: process.env.APPWRITE_DATABASE_ID || 'wishare',
  collectionId: 'wishlists',
};

async function main() {
  // Validate API key
  if (!config.apiKey) {
    console.error(
      '❌ Error: APPWRITE_API_KEY environment variable is required',
    );
    console.log('\nTo get an API key:');
    console.log('1. Go to Appwrite Console → Project Settings → API Keys');
    console.log('2. Create a new key with the following scopes:');
    console.log('   - databases.read');
    console.log('   - databases.write');
    console.log(
      '3. Run: APPWRITE_API_KEY=your-key-here node scripts/fix-wishlist-permissions.js',
    );
    process.exit(1);
  }

  console.log('🔧 Wishlist Permissions Migration Script');
  console.log('=========================================');
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Project: ${config.projectId}`);
  console.log(`Database: ${config.databaseId}`);
  console.log(`Collection: ${config.collectionId}`);
  console.log('');

  // Initialize Appwrite client
  const client = new sdk.Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  const databases = new sdk.Databases(client);

  try {
    // Fetch all wishlists
    console.log('📋 Fetching all wishlists...');

    let allDocuments = [];
    let offset = 0;
    const limit = 100;

    // Paginate through all documents
    while (true) {
      const response = await databases.listDocuments(
        config.databaseId,
        config.collectionId,
        [sdk.Query.limit(limit), sdk.Query.offset(offset)],
      );

      allDocuments = allDocuments.concat(response.documents);

      if (response.documents.length < limit) {
        break;
      }
      offset += limit;
    }

    console.log(`Found ${allDocuments.length} wishlists to process`);
    console.log('');

    // Process each document
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of allDocuments) {
      const docId = doc.$id;
      const uid = doc.uid; // The user ID who owns this wishlist
      const currentPermissions = doc.$permissions || [];

      // Check if permissions are already correct
      const hasUpdatePerm = currentPermissions.some(
        (p) => p.includes('update') && p.includes(`user:${uid}`),
      );
      const hasDeletePerm = currentPermissions.some(
        (p) => p.includes('delete') && p.includes(`user:${uid}`),
      );

      if (hasUpdatePerm && hasDeletePerm) {
        console.log(
          `⏭️  Skipping ${docId} (${doc.name || 'Unnamed'}) - permissions already correct`,
        );
        skipped++;
        continue;
      }

      // Build correct permissions
      const newPermissions = [
        sdk.Permission.read(sdk.Role.user(uid)),
        sdk.Permission.update(sdk.Role.user(uid)),
        sdk.Permission.delete(sdk.Role.user(uid)),
      ];

      try {
        await databases.updateDocument(
          config.databaseId,
          config.collectionId,
          docId,
          {}, // No data changes, just permissions
          newPermissions,
        );

        console.log(
          `✅ Updated ${docId} (${doc.name || 'Unnamed'}) - owner: ${uid}`,
        );
        updated++;
      } catch (err) {
        console.error(`❌ Failed to update ${docId}: ${err.message}`);
        errors++;
      }
    }

    // Summary
    console.log('');
    console.log('=========================================');
    console.log('📊 Migration Summary');
    console.log('=========================================');
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total: ${allDocuments.length}`);

    if (errors === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log(
        '\n⚠️  Migration completed with errors. Please review above.',
      );
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    if (err.code === 401) {
      console.log(
        '\n💡 Hint: Your API key may be invalid or lack the required scopes.',
      );
    }
    process.exit(1);
  }
}

main();
