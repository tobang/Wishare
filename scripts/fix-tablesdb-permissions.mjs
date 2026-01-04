#!/usr/bin/env node

/**
 * Script to fix TablesDB table-level permissions for wishlists and wishes tables.
 *
 * The 401 Unauthorized error occurs because TablesDB requires table-level permissions
 * to be set before authenticated users can create rows.
 *
 * Usage:
 *   APPWRITE_API_KEY=your-api-key node scripts/fix-tablesdb-permissions.mjs
 *
 * To get an API key:
 *   1. Open Appwrite Console: http://localhost
 *   2. Go to Project Settings → API Keys
 *   3. Create a new key with scopes: databases.read, databases.write
 */

const API_KEY = process.env.APPWRITE_API_KEY;
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'http://localhost/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '694ab35e00384ed4a1a5';
const DATABASE_ID = 'wishare';

const TABLES = ['wishlists', 'wishes'];

// Permissions to set at table level
// This allows any authenticated user to create/read/update/delete
const PERMISSIONS = [
  'create("users")',
  'read("users")',
  'update("users")',
  'delete("users")',
];

async function updateTablePermissions(tableId) {
  console.log(`\n📋 Updating permissions for table: ${tableId}`);

  // First, get the current table configuration
  const getResponse = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${tableId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
    },
  );

  if (!getResponse.ok) {
    const error = await getResponse.text();
    throw new Error(`Failed to get table ${tableId}: ${error}`);
  }

  const table = await getResponse.json();
  console.log(
    `   Current permissions: ${JSON.stringify(table.$permissions || [])}`,
  );

  // Update the table with new permissions
  const updateResponse = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${tableId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': API_KEY,
      },
      body: JSON.stringify({
        name: table.name,
        permissions: PERMISSIONS,
        documentSecurity: true, // Enable row-level security
        enabled: true,
      }),
    },
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    throw new Error(`Failed to update table ${tableId}: ${error}`);
  }

  const updatedTable = await updateResponse.json();
  console.log(
    `   ✅ Updated permissions: ${JSON.stringify(updatedTable.$permissions)}`,
  );
  return updatedTable;
}

async function main() {
  console.log('🔧 TablesDB Permissions Fix Script');
  console.log('===================================');
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Database: ${DATABASE_ID}`);

  if (!API_KEY) {
    console.error(
      '\n❌ Error: APPWRITE_API_KEY environment variable is required',
    );
    console.log('\nTo get an API key:');
    console.log('  1. Open Appwrite Console: http://localhost');
    console.log('  2. Go to Project Settings → API Keys');
    console.log(
      '  3. Create a new key with scopes: databases.read, databases.write',
    );
    console.log('\nThen run:');
    console.log(
      '  APPWRITE_API_KEY=your-key node scripts/fix-tablesdb-permissions.mjs',
    );
    process.exit(1);
  }

  try {
    for (const tableId of TABLES) {
      await updateTablePermissions(tableId);
    }

    console.log('\n✅ All table permissions updated successfully!');
    console.log('\nNow authenticated users can:');
    console.log('  - Create rows in wishlists and wishes tables');
    console.log(
      '  - Read/Update/Delete their own rows (with row-level permissions)',
    );
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
