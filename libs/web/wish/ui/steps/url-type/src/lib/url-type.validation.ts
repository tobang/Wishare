import { staticSuite, test, enforce } from 'vest';

export interface UrlFormModel {
  url: string;
}

const urlReg =
  /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

export const urlValidationSuite = staticSuite((data: UrlFormModel) => {
  test('url', 'URL is required', () => {
    enforce(data.url).isNotBlank();
  });

  test('url', 'URL format is invalid', () => {
    if (data.url) {
      enforce(data.url).matches(urlReg);
    }
  });
});
