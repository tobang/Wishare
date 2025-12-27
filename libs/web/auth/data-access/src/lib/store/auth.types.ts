import { Models } from 'appwrite';

/**
 * State model for authentication
 */
export interface AuthStateModel {
  account:
    | Models.User<{
        guest?: boolean;
      }>
    | null
    | undefined;
  session: Models.Session | null;
}

/**
 * Actions for authentication state management
 */
export interface AuthActions {
  fetchAccount: void;
  updateAuthState: Partial<AuthStateModel>;
}
