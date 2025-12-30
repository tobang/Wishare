import type { Models } from 'appwrite';

/**
 * Credentials for login with email and password
 */
export type LoginCredentials = {
  email: string;
  password: string;
};

/**
 * Credentials for registration with email, name, and password
 */
export type RegisterCredentials = {
  email: string;
  name: string;
  password: string;
};

/**
 * Result of a successful login or registration
 */
export type LoginResult = {
  account: Models.User<{ guest?: boolean }> | null;
};

/**
 * State model for authentication
 */
export type AuthStateModel = {
  account:
    | Models.User<{
        guest?: boolean;
      }>
    | null
    | undefined;
};

/**
 * Actions for authentication state management.
 * Includes both UI actions (for triggering effects) and internal state actions.
 */
export type AuthActions = {
  // UI Actions - trigger effects
  loginWithCredentials: LoginCredentials;
  registerWithCredentials: RegisterCredentials;
  logout: void;
  loginWithGoogle: void;
  loginError: void;

  // State Actions - update store state
  fetchAccount: void;
  setAccount: AuthStateModel['account'];
};
