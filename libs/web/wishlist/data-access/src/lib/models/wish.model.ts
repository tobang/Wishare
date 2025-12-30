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
  readonly wlid: string;
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
 * Helper to flatten a Wish row for easier access in templates
 */
export function flattenWish(row: Wish): WishFlat {
  return {
    ...row,
    ...row.data,
  } as WishFlat;
}
