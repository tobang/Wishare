import { inject, InjectionToken } from '@angular/core';
import { Account, Client, Databases } from 'appwrite';
import { APP_CONFIG } from './../app-config.token';

export const APPWRITE = new InjectionToken<{
  databases: Databases;
  account: Account;
}>('appwrite account instance', {
  providedIn: 'root',

  factory: () => {
    const env = inject(APP_CONFIG);
    const client = new Client();
    const databases = new Databases(client);
    const account = new Account(client);
    client.setEndpoint(env.appwriteEndpoint);
    client.setProject(env.appwriteProject);
    return { databases, account };
  },
});
