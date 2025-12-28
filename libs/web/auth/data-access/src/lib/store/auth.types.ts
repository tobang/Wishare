import { Models } from 'appwrite';
import { StreamState } from '@wishare/web/shared/utils';

/**
 * Result of a successful login or registration
 */
export interface LoginResult {
  session: Models.Session | null;
  account: Models.User<{ guest?: boolean }> | null;
}

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
  loginState: StreamState<LoginResult>;
  registerState: StreamState<LoginResult>;
  logoutState: StreamState<void>;
}

/**
 * Actions for authentication state management
 */
export interface AuthActions {
  fetchAccount: void;
  updateAuthState: Partial<AuthStateModel>;
  resetLoginState: void;
  resetRegisterState: void;
  resetLogoutState: void;
}
