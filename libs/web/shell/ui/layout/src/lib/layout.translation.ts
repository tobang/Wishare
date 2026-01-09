import { TRANSLOCO_SCOPE } from '@jsverse/transloco';
import { scopeLoader } from 'scoped-translations';

export const LayoutTranslationProvider = {
  provide: TRANSLOCO_SCOPE,
  useValue: {
    scope: 'navbar',
    loader: scopeLoader(
      (lang: string, root: string) => import(`./i18n/${lang}.json`),
    ),
  },
};
