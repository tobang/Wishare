import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  Field,
  SchemaPath,
  SchemaPathTree,
  form,
} from '@angular/forms/signals';

import { TranslocoModule, TRANSLOCO_SCOPE } from '@jsverse/transloco';
import {
  TuiButton,
  TuiTextfield,
  TuiLabel,
  TuiIcon,
  TuiInput,
  TuiLoader,
} from '@taiga-ui/core';
import { scopeLoader } from 'scoped-translations';

import { vestValidation } from '@wishare/web/shared/validators';
import { FieldErrorComponent } from '@wishare/web/shared/utils';
import { ScrapeService, ScrapedMetadata } from '@wishare/web/shared/services';
import { urlValidationSuite, UrlFormModel } from './url-type.validation';

@Component({
  selector: 'wishare-url-type',
  standalone: true,
  imports: [
    CommonModule,
    Field,
    TuiButton,
    FieldErrorComponent,
    TuiTextfield,
    TuiInput,
    TuiLabel,
    TuiIcon,
    TuiLoader,
    TranslocoModule,
  ],
  providers: [
    {
      provide: TRANSLOCO_SCOPE,
      useValue: {
        scope: 'wishurl',
        loader: scopeLoader((lang: string, root: string) => {
          return import(`./i18n/${lang}.json`);
        }),
      },
    },
  ],
  templateUrl: './url-type.component.html',
  styleUrls: ['./url-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UrlTypeComponent {
  private readonly scrapeService = inject(ScrapeService);

  /** Emits scraped metadata when URL is successfully scraped */
  readonly getMetadata = output<ScrapedMetadata>();

  /** Loading state */
  readonly loading = signal(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  private readonly model = signal<UrlFormModel>({
    url: '',
  });

  readonly frmUrl = form(
    this.model,
    (path: SchemaPath<UrlFormModel> & SchemaPathTree<UrlFormModel>) => {
      vestValidation(path, urlValidationSuite);
    },
  );

  submitUrl() {
    if (!this.frmUrl().valid()) {
      return;
    }
    const { url } = this.frmUrl().value();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.scrapeService.scrapeUrl(url).subscribe({
      next: (metadata) => {
        this.loading.set(false);
        this.getMetadata.emit(metadata);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.message || 'Failed to fetch details from URL',
        );
      },
    });
  }
}
