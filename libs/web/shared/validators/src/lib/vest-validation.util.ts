import { signal } from '@angular/core';
import type {
  FieldTree,
  SchemaPath,
  SchemaPathRules,
  SchemaPathTree,
  ValidationError,
} from '@angular/forms/signals';
import { validateTree } from '@angular/forms/signals';
import type { StaticSuite, SuiteResult } from 'vest';

/**
 * Navigate from a FieldTree to a nested field using dot-notation path
 */
function getFieldFromPath(
  rootField: FieldTree<unknown>,
  fieldName: string,
): FieldTree<unknown> | null {
  const parts = fieldName.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = rootField;

  for (const part of parts) {
    const next = current[part];
    if (next === undefined) {
      return null;
    }
    current = next;
  }

  return current as FieldTree<unknown>;
}

/**
 * Converts Vest validation errors to Angular signal form errors
 */
function mapVestErrorsToFormErrors<T>(
  allErrors: Record<string, string[]>,
  field: FieldTree<T>,
): ValidationError.WithOptionalField[] {
  const errors: ValidationError.WithOptionalField[] = [];

  for (const [fieldName, messages] of Object.entries(allErrors)) {
    const targetField = getFieldFromPath(field, fieldName);

    if (targetField && messages.length > 0) {
      for (const message of messages) {
        errors.push({
          kind: 'vest',
          message,
          fieldTree: targetField,
        });
      }
    }
  }

  return errors;
}

/**
 * Helper to find the changed field between two objects.
 * Returns the path if exactly one leaf field changed, otherwise undefined.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getChangedField(prev: any, curr: any, path = ''): string | undefined {
  if (prev === curr) return undefined;

  if (
    typeof prev !== 'object' ||
    prev === null ||
    typeof curr !== 'object' ||
    curr === null
  ) {
    return path;
  }

  // Iterate over keys from both objects without creating intermediate arrays/sets
  const prevKeys = Object.keys(prev);
  const currKeys = Object.keys(curr);

  let changedField: string | undefined = undefined;

  // Check keys from prev object
  for (const key of prevKeys) {
    const prevVal = prev[key];
    const currVal = curr[key];

    if (prevVal !== currVal) {
      const currentPath = path ? `${path}.${key}` : key;
      const nestedChange = getChangedField(prevVal, currVal, currentPath);

      if (nestedChange) {
        if (changedField !== undefined) {
          // More than one change found - early return
          return undefined;
        }
        changedField = nestedChange;
      }
    }
  }

  // Check keys that exist only in curr (new keys)
  for (const key of currKeys) {
    if (!(key in prev)) {
      const currentPath = path ? `${path}.${key}` : key;
      // New key added - this is a change
      if (changedField !== undefined) {
        // More than one change found - early return
        return undefined;
      }
      changedField = currentPath;
    }
  }

  return changedField;
}

/**
 * Binds Vest validation (including async tests) to a form path.
 * This function sets up both synchronous and asynchronous validation
 * to properly handle Vest suites that contain async tests.
 *
 * @param path - The schema path to bind validation to
 * @param suite - A Vest validation suite function that takes form data and returns a SuiteRunResult
 *
 * @example
 * ```typescript
 * import { vestValidation } from './shared/vest-validation.util';
 * import { myValidationSuite } from './my-form.validation';
 *
 * // Suite with async tests:
 * const myValidationSuite = staticSuite((data: MyModel) => {
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 *
 *   test('email', 'Email is already in use', async ({ signal }) => {
 *     await lastValueFrom(
 *       checkEmailAvailability(data.email).pipe(
 *         takeUntil(fromEvent(signal, 'abort'))
 *       )
 *     ).then((available) => {
 *       if (!available) return Promise.reject();
 *     });
 *   });
 * });
 *
 * const myForm = form(myModel, (schemaPath) => {
 *   vestValidation(schemaPath, myValidationSuite);
 * });
 * ```
 */
export function vestValidation<T>(
  path: SchemaPath<T> & SchemaPathTree<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  suite: StaticSuite<string, string, (data: T, ...args: any[]) => void>,
): void {
  let previousData: T | undefined = undefined;
  let allErrors: Record<string, string[]> = {};
  let currentResult: SuiteResult<string, string> | null = null;
  let currentChangedField: string | undefined = undefined;

  const asyncChange = signal(0);

  validateTree(
    path as SchemaPath<T, SchemaPathRules.Supported>,
    ({ value, fieldTree }) => {
      const data = value();
      asyncChange(); // Subscribe to async updates

      if (data !== previousData) {
        currentChangedField = previousData
          ? getChangedField(previousData, data)
          : undefined;
        previousData = data;

        const result = suite(data, currentChangedField);
        currentResult = result;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result as any).done((finalResult: any) => {
          if (currentResult === result) {
            currentResult = finalResult;
            // Defer update to avoid NG0600 (writing to signal in computed)
            setTimeout(() => {
              asyncChange.update((n) => n + 1);
            }, 0);
          }
        });
      }

      if (currentResult) {
        const newErrors = currentResult.getErrors();

        // Create a new merged object
        const merged = { ...allErrors };

        if (currentChangedField) {
          // Clear errors for the changed field (and nested)
          Object.keys(merged).forEach((key) => {
            if (
              key === currentChangedField ||
              key.startsWith(currentChangedField + '.')
            ) {
              delete merged[key];
            }
          });
        } else {
          // If no changed field (full validation), clear everything
          if (currentChangedField === undefined) {
            for (const key in merged) delete merged[key];
          }
        }

        // Add new errors
        Object.assign(merged, newErrors);

        // Update state
        allErrors = merged;

        return mapVestErrorsToFormErrors(allErrors, fieldTree);
      }

      return [];
    },
  );
}
