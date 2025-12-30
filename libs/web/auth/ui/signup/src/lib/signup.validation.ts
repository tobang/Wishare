import { staticSuite, test, enforce } from 'vest';

export type SignupFormModel = {
  email: string;
  password: string;
  passwordConfirm: string;
};

export const signupValidationSuite = staticSuite((data: SignupFormModel) => {
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

  test('password', 'Password must be at least 6 characters', () => {
    if (data.password) {
      enforce(data.password).longerThanOrEquals(6);
    }
  });

  test('passwordConfirm', 'Password confirmation is required', () => {
    enforce(data.passwordConfirm).isNotBlank();
  });

  test('passwordConfirm', 'Passwords must match', () => {
    enforce(data.passwordConfirm).equals(data.password);
  });
});
