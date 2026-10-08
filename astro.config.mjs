// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { readingTime } from './src/plugins/reading-time';
import { figureNumber } from './src/plugins/figure-number';
import { codeFrame } from './src/plugins/code-frame';
import { site } from './src/config/site';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  integrations: [mdx(), sitemap()],
  redirects: {
    '/about': '/log/about/',
  },
  markdown: {
    processor: satteri({
      mdastPlugins: [readingTime(), figureNumber()],
    }),
    shikiConfig: {
      theme: 'material-theme-darker',
      transformers: [codeFrame()],
    },
  },
});
