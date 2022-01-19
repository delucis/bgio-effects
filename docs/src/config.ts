import AstroConfig from '../astro.config.mjs';

export const SITE = {
  title: '📤 bgio-effects',
  description: 'Documentation for the bgio-effects npm package.',
  defaultLanguage: 'en_US',
};

export const OPEN_GRAPH = {
  image: {
    src: AstroConfig.buildOptions.site + 'default-og-image.jpg',
    alt: 'the text “bgio-effects” glows over a swirl of blurry colours',
  },
  twitter: 'swithinbank',
};

export const GITHUB_REPO = 'https://github.com/delucis/bgio-effects';
export const NPM_PAGE = 'https://www.npmjs.com/package/bgio-effects';

// Base URL for the "Edit this page" link on each page.
export const GITHUB_EDIT_URL = `${GITHUB_REPO}/blob/latest/docs/`;

// Config for the site navigation menu.
export const SIDEBAR = [
  { text: 'Setup', header: true },
  { text: 'Introduction', link: '' },
  { text: 'Tutorial', link: 'tutorial' },

  { text: 'Game Plugin', header: true },
  { text: 'Configuration', link: 'plugin/config' },
  { text: 'Sequencing effects', link: 'plugin/sequencing' },

  { text: 'Client', header: true },
  { text: 'Plain JS', link: 'client/plain-js' },
  { text: 'React', link: 'client/react' },
  { text: 'Notes', link: 'client/notes' },
];
