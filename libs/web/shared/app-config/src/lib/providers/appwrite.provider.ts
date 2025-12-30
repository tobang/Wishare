import { inject, InjectionToken } from '@angular/core';
import { Account, Client, TablesDB } from 'appwrite';
import { APP_CONFIG } from './../app-config.token';

export const APPWRITE = new InjectionToken<{
  tablesDb: TablesDB;
  account: Account;
}>('appwrite account instance', {
  providedIn: 'root',

  factory: () => {
    const env = inject(APP_CONFIG);
    const client = new Client();
    const tablesDb = new TablesDB(client);
    const account = new Account(client);
    client.setEndpoint(env.appwriteEndpoint);
    client.setProject(env.appwriteProject);
    return { tablesDb, account };
  },
});
