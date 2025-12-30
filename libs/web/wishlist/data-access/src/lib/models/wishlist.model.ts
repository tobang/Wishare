import { Models } from 'appwrite';
import { WishFlat } from './wish.model';

/**
 * Data fields for a Wishlist stored in Appwrite TablesDB
 */
export interface WishlistData {
  readonly title: string;
  readonly description: string;
  readonly visibility: 'draft' | 'published' | 'archived';
  readonly priority: number;
  readonly uid: string;
}

/**
 * A Wishlist row from Appwrite TablesDB.
 * In the new TablesDB API, user data is nested under the `data` property.
 */
export interface Wishlist extends Models.Row {
  readonly data: WishlistData;
}

/**
 * Flattened Wishlist for UI convenience - combines Row metadata with data fields
 */
export interface WishlistFlat extends Models.Row, WishlistData {}

export type WishlistUi = WishlistFlat & {
  wishes?: Models.RowList<WishFlat>;
};

/**
 * Helper to flatten a Wishlist row for easier access in templates.
 * Handles both TablesDB format (data nested under 'data') and direct format.
 */
export function flattenWishlist(row: Wishlist): WishlistFlat {
  // TablesDB may return data at top level or nested under 'data'
  const data = row.data ?? (row as unknown as WishlistData);
  return {
    ...row,
    ...data,
  } as WishlistFlat;
}
