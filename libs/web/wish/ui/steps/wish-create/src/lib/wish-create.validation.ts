/**
 * Vest validation suite for Create Wish form
 */
import { staticSuite, test, enforce } from 'vest';

export type CreateWishFormModel = {
  title: string;
  description: string;
  url: string;
  price: string;
  quantity: string;
};

export const createWishValidationSuite = staticSuite(
  (data: CreateWishFormModel) => {
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

    test('url', 'Please enter a valid URL', () => {
      if (data.url) {
        enforce(data.url).matches(
          /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i,
        );
      }
    });

    test('url', 'URL must be less than 1000 characters', () => {
      if (data.url) {
        enforce(data.url).shorterThanOrEquals(1000);
      }
    });

    test('price', 'Price must be a positive number', () => {
      if (data.price) {
        const price = parseFloat(data.price);
        enforce(price).isNumeric().greaterThanOrEquals(0);
      }
    });

    test('price', 'Price cannot exceed 999,999.99', () => {
      if (data.price) {
        const price = parseFloat(data.price);
        enforce(price).lessThanOrEquals(999999.99);
      }
    });

    test('quantity', 'Quantity must be at least 1', () => {
      if (data.quantity) {
        const quantity = parseInt(data.quantity, 10);
        enforce(quantity).isNumeric().greaterThanOrEquals(1);
      }
    });

    test('quantity', 'Quantity cannot exceed 999', () => {
      if (data.quantity) {
        const quantity = parseInt(data.quantity, 10);
        enforce(quantity).lessThanOrEquals(999);
      }
    });
  },
);
