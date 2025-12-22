import { Models } from 'appwrite';
import { Wish } from './wish.model';

export interface Wishlist extends Models.Document {
  readonly title: string;
  readonly description: string;
  readonly visibility: 'draft' | 'published' | 'archived';
  readonly priority: number;
  readonly uid: string;
}

export type WishlistUi = Wishlist & {
  wishes?: Models.DocumentList<Wish>;
};
