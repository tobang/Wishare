import { Models } from 'appwrite';

export interface Wish extends Models.Document {
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
