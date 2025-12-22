export const availableLangs = ['da', 'en'];

export const scopeLoader = (importer: any, root = 'i18n') => {
  return availableLangs.reduce((acc: any, lang) => {
    acc[lang] = () => importer(lang, root);
    return acc;
  }, {});
};
