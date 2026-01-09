import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // For local Docker: use APPWRITE_ENDPOINT override or the internal docker network
  // The default APPWRITE_FUNCTION_API_ENDPOINT may not be reachable from inside the executor container
  const endpoint =
    process.env.APPWRITE_ENDPOINT ||
    process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
    'http://appwrite/v1';

  log(`Using endpoint: ${endpoint}`);

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key']);

  const databases = new Databases(client);

  try {
    const { databaseId, tableId, updates } = JSON.parse(req.body);

    if (!updates || updates.length === 0) {
      return res.json({ success: true });
    }

    log(`Reordering ${updates.length} items in ${tableId}`);

    // 1. Generate temp base to avoid collisions
    // Use a value much larger than any reasonable priority to avoid collision with existing user items
    // and random enough to avoid collision with other reorders happening (though locking would be better, this is decent)
    const tempBase =
      5000000 + (Date.now() % 10000) + Math.floor(Math.random() * 5000);

    // 2. Phase 1: Move to temp priority (Sequential)
    // This moves items "out of the way" so we can slot them into their final positions without unique constraint errors
    for (const [index, update] of updates.entries()) {
      await databases.updateDocument(databaseId, tableId, update.id, {
        priority: tempBase + index,
      });
    }

    // 3. Phase 2: Move to final priority (Sequential, sorted by target priority)
    // We sort first to ensure we fill spots in order, though strict order doesn't strictly matter
    // as long as the target spots are free (which they should be after Phase 1, assuming no other user is messing with these exact items)
    const sortedUpdates = [...updates].sort((a, b) => a.priority - b.priority);
    for (const update of sortedUpdates) {
      await databases.updateDocument(databaseId, tableId, update.id, {
        priority: update.priority,
      });
    }

    log('Reorder completed successfully');
    return res.json({ success: true });
  } catch (err) {
    error('Reorder failed: ' + err.message);
    // Return 500 so the client knows it failed
    return res.json({ success: false, error: err.message }, 500);
  }
};
