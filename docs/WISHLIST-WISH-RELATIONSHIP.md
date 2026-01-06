# Wishlist-Wish One-to-Many Relationship

This document describes the database relationship between Wishlists and Wishes in the Appwrite database.

## Overview

A one-to-many relationship has been established between the `wishlists` and `wishes` tables:

- **One Wishlist** can have **many Wishes**
- **One Wish** can only belong to **one Wishlist**

## Relationship Configuration

The relationship is configured in `appwrite.json` with the following properties:

| Property   | Value       | Description                                |
| ---------- | ----------- | ------------------------------------------ |
| Type       | `oneToMany` | One wishlist to many wishes                |
| Two-way    | `true`      | Visible from both sides                    |
| Parent Key | `wishes`    | Field on wishlist pointing to wishes       |
| Child Key  | `wishlist`  | Field on wish pointing back to wishlist    |
| On Delete  | `cascade`   | Deleting a wishlist deletes all its wishes |

## Schema Changes

### Wishlists Table

Added a relationship attribute:

```json
{
  "key": "wishes",
  "type": "relationship",
  "relatedCollection": "wishes",
  "relationType": "oneToMany",
  "twoWay": true,
  "twoWayKey": "wishlist",
  "onDelete": "cascade",
  "side": "parent"
}
```

### Wishes Table

- The `wlid` field is now **optional** (kept for backward compatibility)
- A new `wishlist` relationship field is automatically created as the two-way key

## Model Changes

### WishlistData Interface

```typescript
interface WishlistData {
  // ... existing fields
  readonly wishes?: WishFlat[]; // One-to-many relationship
}
```

### WishData Interface

```typescript
interface WishData {
  // ... existing fields
  /** @deprecated Use wishlist relationship instead */
  readonly wlid?: string;
  readonly wishlist?: string | Record<string, unknown>;
}
```

## Service Changes

### BoardService

The `BoardService` has been updated to use the relationship:

1. **`getBoard()`**: Now uses `Query.select(['*', 'wishes.*'])` to load wishes with wishlists in a single query, with fallback to wlid-based grouping for backward compatibility.

2. **`getWishes()`**: Queries by both `wishlist` relationship and `wlid` for backward compatibility:

   ```typescript
   Query.or([Query.equal('wishlist', wishlistId), Query.equal('wlid', wishlistId)]);
   ```

3. **`createWish()`**: Sets both `wishlist` and `wlid` fields for backward compatibility during migration.

4. **`deleteWishlist()`**: No longer needs to manually delete wishes - the cascade delete behavior handles this automatically.

## Benefits

1. **Automatic Cascade Delete**: When a wishlist is deleted, all associated wishes are automatically deleted.
2. **Simpler Queries**: Wishes can be loaded with wishlists in a single query using relationship selection.
3. **Data Integrity**: The database enforces the relationship, preventing orphaned wishes.
4. **Reduced Redundancy**: No need for manual wlid maintenance.

## Migration Notes

### Backward Compatibility

The code maintains backward compatibility:

- Existing wishes with `wlid` field will continue to work
- New wishes set both `wishlist` and `wlid` fields
- Queries check both fields

### Deploying the Schema

1. Run the deploy script:

   ```bash
   ./scripts/deploy-appwrite-schema.sh
   ```

2. Or manually in Appwrite Console:
   - Navigate to **TablesDB** → **wishlists** → **Columns**
   - Create a **Relationship** attribute with the settings above

### Data Migration

Existing wishes will need their `wishlist` field populated:

1. Query all wishes that have `wlid` but no `wishlist`
2. Update each wish to set `wishlist` = `wlid`

Example migration script:

```javascript
const wishes = await tablesDb.listRows({
  databaseId: 'wishare',
  tableId: 'wishes',
  queries: [Query.isNull('wishlist'), Query.limit(100)],
});

for (const wish of wishes.rows) {
  if (wish.wlid) {
    await tablesDb.updateRow({
      databaseId: 'wishare',
      tableId: 'wishes',
      rowId: wish.$id,
      data: { wishlist: wish.wlid },
    });
  }
}
```

## Testing

After deployment, verify:

1. Creating a wish properly links it to the wishlist
2. Deleting a wishlist removes all its wishes
3. Loading a wishlist includes its wishes via the relationship
4. Existing wishes with only `wlid` still appear correctly
