import { staticSuite, test, enforce } from 'vest';

export type EmailLoginFormModel = {
  email: string;
  password: string;
};

export const emailLoginValidationSuite = staticSuite(
  (data: EmailLoginFormModel) => {
    test('email', 'Email is required', () => {
      enforce(data.email).isNotBlank();
    });

    test('email', 'Email format is invalid', () => {
      if (data.email) {
        enforce(data.email).matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      }
    });

    test('password', 'Password is required', () => {
      enforce(data.password).isNotBlank();
    });
  },
);
