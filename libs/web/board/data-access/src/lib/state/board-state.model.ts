import { Wishlist } from "@wishare/web/wishlist/data-access";
import { Models } from "appwrite";


export interface BoardStateModel {
  wishLists: (Wishlist & {
    [x: string]: Models.DocumentList<Models.Document>;
  })[];
}

