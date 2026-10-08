// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { postMeta } from './src/plugins/post-meta';
import { figureNumber } from './src/plugins/figure-number';
import { lineBreaks } from './src/plugins/line-breaks';
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
      // postMeta は改行を <br> にする前の本文で読了時間・抜粋を作るので先に置く
      mdastPlugins: [postMeta(), figureNumber(), lineBreaks()],
    }),
    shikiConfig: {
      // ライト / ダークの両方の色を CSS 変数で出し、prose.css で切り替える
      themes: {
        light: 'github-light-default',
        dark: 'github-dark-default',
      },
      defaultColor: false,
      transformers: [codeFrame()],
    },
  },
});
