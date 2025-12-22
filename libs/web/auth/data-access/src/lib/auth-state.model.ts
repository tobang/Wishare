import { Models } from 'appwrite';

export interface AuthStateModel {
  account: Models.Account<{
    guest?: boolean;
  }> | null;
  session: Models.Session | null;
}
