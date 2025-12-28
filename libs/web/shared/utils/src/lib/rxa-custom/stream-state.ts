import {
  map,
  startWith,
  catchError,
  of,
  Observable,
  OperatorFunction,
} from 'rxjs';

/**
 * Represents the state of an async stream operation.
 * Used to track loading, success, and error states.
 */
export interface StreamState<T> {
  isLoading: boolean;
  hasError: boolean;
  error?: unknown;
  hasValue: boolean;
  value: T | null;
}

/**
 * Creates an initial StreamState with isLoading set to true.
 */
export const initialStreamState = <T>(): StreamState<T> => ({
  isLoading: true,
  hasError: false,
  hasValue: false,
  value: null,
});

/**
 * Creates a success StreamState with the given value.
 */
export const successStreamState = <T>(value: T): StreamState<T> => ({
  isLoading: false,
  hasError: false,
  hasValue: true,
  value,
});

/**
 * Creates an error StreamState with the given error.
 */
export const errorStreamState = <T>(error: unknown): StreamState<T> => ({
  isLoading: false,
  hasError: true,
  error,
  hasValue: false,
  value: null,
});

/**
 * Creates a reset/idle StreamState (not loading, no value, no error).
 * Use this to reset state back to its initial idle condition.
 */
export const resetStreamState = <T>(): StreamState<T> => ({
  isLoading: false,
  hasError: false,
  hasValue: false,
  value: null,
});

/**
 * RxJS operator that transforms a stream into a StreamState stream.
 * Emits loading state first, then success or error state.
 *
 * @example
 * ```typescript
 * this.http.get('/api/data').pipe(
 *   toState()
 * ).subscribe(state => {
 *   if (state.isLoading) { ... }
 *   if (state.hasValue) { ... }
 *   if (state.hasError) { ... }
 * });
 * ```
 */
export function toState<T>(): OperatorFunction<T, StreamState<T>> {
  return (source: Observable<T>): Observable<StreamState<T>> =>
    source.pipe(
      map((value) => successStreamState(value)),
      startWith(initialStreamState<T>()),
      catchError((error) => of(errorStreamState<T>(error))),
    );
}
