/**
 * Example Vest validation suite for Wish form
 */

import { staticSuite, test, enforce } from 'vest';

export type WishFormModel = {
  title: string;
  description: string;
  url: string;
  price: number;
  quantity: number;
};

export const wishValidationSuite = staticSuite((data: WishFormModel) => {
  test('title', 'Title is required', () => {
    enforce(data.title).isNotBlank();
  });

  test('title', 'Title must be at least 2 characters', () => {
    enforce(data.title).longerThanOrEquals(2);
  });

  test('title', 'Title must be less than 255 characters', () => {
    enforce(data.title).shorterThanOrEquals(255);
  });

  test('description', 'Description must be less than 2000 characters', () => {
    if (data.description) {
      enforce(data.description).shorterThanOrEquals(2000);
    }
  });

  test('url', 'URL format is invalid', () => {
    if (data.url) {
      enforce(data.url).matches(
        /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
      );
    }
  });

  test('price', 'Price must be 0 or greater', () => {
    enforce(data.price).greaterThanOrEquals(0);
  });

  test('price', 'Price must be less than 1,000,000', () => {
    enforce(data.price).lessThan(1000000);
  });

  test('quantity', 'Quantity must be at least 1', () => {
    enforce(data.quantity).greaterThanOrEquals(1);
  });

  test('quantity', 'Quantity must be less than 1000', () => {
    enforce(data.quantity).lessThan(1000);
  });
});
