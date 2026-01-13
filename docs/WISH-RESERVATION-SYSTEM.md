# Wish Reservation System

This document describes the wish reservation feature that allows users to reserve wishes from wishlists they don't own.

## Business Rules

1. **Ownership**: Each wish has an owner (identified by the `uid` field)
2. **Reservation**: Other users can reserve wishes from published wishlists
3. **Owner Restriction**: Owners cannot reserve their own wishes
4. **Privacy**: Owners do not see reservation status or buttons on their own wishes (surprise gift scenario)
5. **Exclusive Reservation**: A wish can only be reserved by one user at a time

## Database Schema Changes

Added two new fields to the `wishes` table:

| Field        | Type                | Description                                 |
| ------------ | ------------------- | ------------------------------------------- |
| `reservedBy` | string (nullable)   | User ID of the person who reserved the wish |
| `reservedAt` | datetime (nullable) | Timestamp when the wish was reserved        |

An index was added on `reservedBy` for efficient querying.

## Model Updates

The `WishData` interface in `libs/web/wishlist/data-access/src/lib/models/wish.model.ts` was updated to include:

```typescript
/**
 * User ID of the person who reserved this wish.
 * Null or undefined if not reserved.
 */
readonly reservedBy?: string | null;

/**
 * Timestamp when the wish was reserved.
 * Null or undefined if not reserved.
 */
readonly reservedAt?: string | null;
```

## Service Layer

The `BoardService` (`libs/web/board/data-access/src/lib/services/board.service.ts`) includes new methods:

### `reserveWish(wishId: string): Observable<WishFlat>`

Reserves a wish for the current user.

- Validates that the user is not the owner
- Validates that the wish is not already reserved
- Updates `reservedBy` and `reservedAt` fields

### `unreserveWish(wishId: string): Observable<WishFlat>`

Cancels a reservation made by the current user.

- Validates that the wish is reserved by the current user
- Clears `reservedBy` and `reservedAt` fields

### Helper Methods

- `isWishOwner(wish: WishFlat): boolean` - Checks if current user owns the wish
- `isReservedByCurrentUser(wish: WishFlat): boolean` - Checks if current user has reserved the wish

## Store Updates

The `WishlistDetailsStore` (`libs/web/wishlist/feature/details/src/lib/details/store/wishlist-details.store.ts`) was updated with:

### New Actions

- `reserveWish: string` - Action to reserve a wish
- `unreserveWish: string` - Action to unreserve a wish
- `resetReserveState: void` - Reset reservation state
- `resetUnreserveState: void` - Reset unreservation state

### New State

- `reserveState: StreamState<WishFlat>` - Tracks reservation operation status
- `unreserveState: StreamState<WishFlat>` - Tracks unreservation operation status

## UI Components

### WishCardComponent Updates

The wish card (`libs/web/wish/ui/card/src/lib/card/card.ts`) now accepts:

**Inputs:**

- `isOwner: boolean` - Whether the current user owns this wish
- `isReservedByMe: boolean` - Whether the current user has reserved this wish

**Outputs:**

- `reserve: EventEmitter<string>` - Emits wish ID when user wants to reserve
- `unreserve: EventEmitter<string>` - Emits wish ID when user wants to unreserve

### Visual States

For **non-owners**:

- Available wish: Shows "Reserve" button
- Reserved by me: Shows "Cancel Reservation" button and a green badge
- Reserved by someone else: Shows a gray badge with lock icon and "Someone is getting this!" message

For **owners**:

- No reservation UI is shown (keeps the gift a surprise)

## Usage Example

```html
<wishare-wish-card [wish]="wish" [isOwner]="isWishOwner(wish)" [isReservedByMe]="isReservedByCurrentUser(wish)" (reserve)="onReserveWish($event)" (unreserve)="onUnreserveWish($event)"></wishare-wish-card>
```

## Deployment

After making these changes, deploy the schema updates to Appwrite:

```bash
./scripts/deploy-appwrite-schema.sh
```

This will add the new `reservedBy` and `reservedAt` columns and the `reservedBy_idx` index to the wishes table.
