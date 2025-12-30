import { Models, Query, TablesDB } from 'appwrite';
import {
  combineLatest,
  defer,
  EMPTY,
  from,
  map,
  Observable,
  switchMap,
} from 'rxjs';

/**
 * Helper to flatten a TablesDB row - spreads the nested `data` property to the top level
 */
function flattenRow<T extends Models.Row>(row: Models.Row): T {
  const { data, ...rest } = row as Models.Row & {
    data?: Record<string, unknown>;
  };
  return {
    ...rest,
    ...data,
  } as T;
}

/**
 * Left join operator for Appwrite TablesDB.
 * Joins data from a related table based on a key field.
 *
 * @template TSource - The source row type
 * @template TJoined - The joined row type
 * @template TJoinKey - The key name for the joined data
 *
 * @param tablesDb - The TablesDB instance
 * @param databaseId - The database ID
 * @param key - The key field on source rows (e.g., '$id')
 * @param field - The field on joined table to match against (e.g., 'wlid')
 * @param tableId - The table ID to join from (also used as the key name)
 */
export const leftJoin = <
  TSource extends Models.Row,
  TJoined extends Models.Row,
  TJoinKey extends string,
>(
  tablesDb: TablesDB,
  databaseId: string,
  key: keyof TSource,
  field: string,
  tableId: TJoinKey,
) => {
  return (
    source$: Observable<TSource[]>,
  ): Observable<(TSource & { [K in TJoinKey]?: Models.RowList<TJoined> })[]> =>
    // Use defer so variable is not shared for all observers
    defer(() => {
      // Operator state
      let tableData: TSource[];

      return source$.pipe(
        switchMap((data) => {
          tableData = data;
          const reads$ = [] as Observable<Models.RowList<Models.Row>>[];
          // Loop the source table data
          for (const row of tableData) {
            // Check that we have the property on the row
            const keyValue = row[key];
            if (keyValue) {
              // Setup the query
              const queries = [Query.equal(field, keyValue as string)];
              reads$.push(
                from(tablesDb.listRows({ databaseId, tableId, queries })),
              );
            } else {
              reads$.push(EMPTY);
            }
          }
          return combineLatest(reads$);
        }),
        map((joins) =>
          tableData.map((v, i) => {
            const joinResult = joins[i];
            // Flatten the joined rows' data property
            const flattenedRows = joinResult
              ? {
                  ...joinResult,
                  rows: joinResult.rows.map((r) => flattenRow<TJoined>(r)),
                }
              : undefined;
            return {
              ...v,
              [tableId]: flattenedRows,
            } as TSource & { [K in TJoinKey]?: Models.RowList<TJoined> };
          }),
        ),
      );
    });
};
