/**
 * Example Vest validation suite for Wishlist form
 */

import { staticSuite, test, enforce } from 'vest';

export interface WishlistFormModel {
  title: string;
  description: string;
  visibility: 'draft' | 'published' | 'archived';
}

export const wishlistValidationSuite = staticSuite((data: WishlistFormModel) => {
  test('title', 'Title is required', () => {
    enforce(data.title).isNotBlank();
  });

  test('title', 'Title must be at least 3 characters', () => {
    enforce(data.title).longerThanOrEquals(3);
  });

  test('title', 'Title must be less than 100 characters', () => {
    enforce(data.title).shorterThanOrEquals(100);
  });

  test('description', 'Description must be less than 500 characters', () => {
    if (data.description) {
      enforce(data.description).shorterThanOrEquals(500);
    }
  });

  test('visibility', 'Visibility must be a valid option', () => {
    enforce(data.visibility).isInside(['draft', 'published', 'archived']);
  });
});
