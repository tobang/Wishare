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
  /** @deprecated Use wishlist relationship instead */
  readonly wlid?: string;
  /** Relationship to parent wishlist (two-way key from wishlists.wishes) */
  readonly wishlist?: string;
  readonly url?: string;
  readonly price: number;
  readonly files?: string[];
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
 */
export function flattenWish(row: Wish): WishFlat {
  // TablesDB may return data at top level or nested under 'data'
  const data = row.data ?? (row as unknown as WishData);
  return {
    ...row,
    ...data,
  } as WishFlat;
}
