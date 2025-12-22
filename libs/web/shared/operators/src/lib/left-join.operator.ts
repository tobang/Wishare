import { Databases, Models, Query } from 'appwrite';
import {
  combineLatest,
  defer,
  EMPTY,
  from,
  map,
  Observable,
  switchMap
} from 'rxjs';

export const leftJoin = <T extends Record<string, unknown>>(
  databases: Databases,
  databaseId: string,
  key: string,
  field: string,
  collection: string
) => {
  return (source$: Observable<T[]>) =>
    // Use defer so variable is not shared for all observers
    defer(() => {
      // Operator state
      let collectionData: T[];

      return source$.pipe(
        switchMap((data) => {
          collectionData = data as T[];
          const reads$ = [] as Observable<
            Models.DocumentList<Models.Document>
          >[];
          // Loop the source collection data
          for (const doc of collectionData) {
            // Check that we have the property on the doc
            if (doc[key]) {
              // Setup the query
              const queries = [Query.equal(field, doc[key] as string)];
              reads$.push(
                from(databases.listDocuments(databaseId, collection, queries))
              );
            } else {
              reads$.push(EMPTY);
            }
          }
          return combineLatest(reads$);
        }),
        map((joins) =>
          collectionData.map((v, i) => ({
            ...v,
            [collection]: joins[i] || null,
          }))
        )
      );
    });
};
