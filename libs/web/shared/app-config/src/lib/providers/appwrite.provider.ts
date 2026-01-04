import { inject, InjectionToken } from '@angular/core';
import { Account, Client, Functions, Storage, TablesDB } from 'appwrite';
import { APP_CONFIG } from './../app-config.token';

export const APPWRITE = new InjectionToken<{
  tablesDb: TablesDB;
  account: Account;
  functions: Functions;
  storage: Storage;
}>('appwrite account instance', {
  providedIn: 'root',

  factory: () => {
    const env = inject(APP_CONFIG);
    const client = new Client();
    const tablesDb = new TablesDB(client);
    const account = new Account(client);
    const functions = new Functions(client);
    const storage = new Storage(client);
    client.setEndpoint(env.appwriteEndpoint);
    client.setProject(env.appwriteProject);
    return { tablesDb, account, functions, storage };
  },
});
