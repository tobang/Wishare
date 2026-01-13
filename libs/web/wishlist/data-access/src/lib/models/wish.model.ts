import { Models } from 'appwrite';

/**
 * Data fields for a Wish stored in Appwrite TablesDB
 */
export interface WishData {
  readonly title: string;
  readonly description?: string;
  readonly quantity: number;
  readonly priority: number;
  readonly uid: string;
  /**
   * Two-way relationship to parent wishlist.
   * This is the child side of the one-to-many relationship.
   * Contains the wishlist ID or the full wishlist object when loaded via query selection.
   */
  readonly wishlists?: string | Record<string, unknown>;
  readonly url?: string;
  readonly price: number;
  readonly files?: string[];
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
}

/**
 * A Wish row from Appwrite TablesDB.
 * In the new TablesDB API, user data is nested under the `data` property.
 */
export interface Wish extends Models.Row {
  readonly data: WishData;
}

/**
 * Flattened Wish for UI convenience - combines Row metadata with data fields
 */
export interface WishFlat extends Models.Row, WishData {}

/**
 * Helper to flatten a Wish row for easier access in templates.
 * Handles both TablesDB format (data nested under 'data') and direct format.
 * Accepts Models.Row to avoid type casts at call sites.
 */
export function flattenWish(row: Models.Row): WishFlat {
  const wishRow = row as Wish;
  // TablesDB may return data at top level or nested under 'data'
  const data = wishRow.data ?? (row as unknown as WishData);
  return {
    ...row,
    ...data,
  } as WishFlat;
}
