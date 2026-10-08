export interface NavItem {
  key: string;
  label: string;
  href: string;
  external?: boolean;
}

const author = '砂時計';
const titleSuffix = '/log';

export const site = {
  title: `${author}${titleSuffix}`,
  /** ロゴでアクセント色にする部分 */
  titleSuffix,
  url: 'https://logs.sunadokei.dev',
  description: '砂時計 (5unad0ke1) の開発ログ。',
  author,
  alias: '5unad0ke1',
  bio: '静かにゲームを作っていたりします。\n神出鬼没なので何処かで会うかもしれませんね。',
  copyright: 'sunadokei',
  accent: '#FF772D',
  social: {
    x: 'https://x.com/5unad0ke1',
    xHandle: '@5unad0ke1',
    github: 'https://github.com/5unad0ke1',
    links: 'https://links.sunadokei.dev',
  },
} as const;

/** フッター・メニューに出す © 表記(ビルドした年) */
export const copyrightText = `© ${new Date().getFullYear()} ${site.copyright}`;

export const nav: NavItem[] = [
  { key: 'log', label: 'log', href: '/' },
  { key: 'about', label: 'about', href: '/log/about/' },
  { key: 'links', label: 'links', href: site.social.links, external: true },
  { key: 'github', label: 'github', href: site.social.github, external: true },
  { key: 'twitter', label: 'twitter', href: site.social.x, external: true },
  { key: 'rss', label: 'rss', href: '/rss.xml' },
];

/** そのリンク先が今いるページそのものか(aria-current="page" 用) */
export function isCurrentPage(href: string, pathname: string): boolean {
  const normalize = (p: string) => p.replace(/\/?$/, '/');
  return !href.startsWith('http') && normalize(href) === normalize(pathname);
}

/** ナビの現在地(表示用)。about 記事だけは about、それ以外のホーム・記事は log。 */
export function currentNavKey(pathname: string): string | undefined {
  if (pathname === '/log/about/' || pathname === '/log/about') return 'about';
  if (pathname === '/' || pathname.startsWith('/log/')) return 'log';
  return undefined;
}
