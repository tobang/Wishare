import { inject, Injectable } from '@angular/core';
import { catchError, defer, from, map, Observable, throwError } from 'rxjs';
import { ExecutionMethod, Functions } from 'appwrite';
import { APPWRITE } from '@wishare/web/shared/app-config';

/**
 * Scraped metadata from a URL
 */
export type ScrapedMetadata = {
  url: string;
  title: string;
  description: string;
  image: string;
  imageEncoded: string;
  price: string;
  author: string;
  siteName: string;
  type: string;
  favicon: string;
};

/**
 * Response from the scrapeMetaTags function
 */
type ScrapeResponse = {
  success: boolean;
  payload?: ScrapedMetadata;
  message?: string;
};

@Injectable({
  providedIn: 'root',
})
export class ScrapeService {
  private readonly appwrite: { functions: Functions } = inject(APPWRITE);

  /**
   * Scrapes meta tags from the given URL using the Appwrite scrapeMetaTags function
   * @param url The URL to scrape
   * @returns Observable with the scraped metadata
   */
  scrapeUrl(url: string): Observable<ScrapedMetadata> {
    return defer(() =>
      from(
        this.appwrite.functions.createExecution({
          functionId: 'scrapeMetaTags',
          body: JSON.stringify({ url }),
          async: false,
          method: ExecutionMethod.POST,
        }),
      ),
    ).pipe(
      map((execution) => {
        const response: ScrapeResponse = JSON.parse(execution.responseBody);
        if (!response.success || !response.payload) {
          throw new Error(response.message || 'Failed to scrape URL');
        }
        return response.payload;
      }),
      catchError((error) => {
        console.error('ScrapeService error:', error);
        return throwError(
          () => new Error(error.message || 'Failed to scrape URL'),
        );
      }),
    );
  }
}
