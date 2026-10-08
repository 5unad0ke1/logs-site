export interface NavItem {
  key: string;
  label: string;
  href: string;
  external?: boolean;
}

export const site = {
  title: '砂時計/log',
  url: 'https://logs.sunadokei.dev',
  description: '砂時計 (5unad0ke1) の開発ログ。',
  author: '砂時計',
  alias: '5unad0ke1',
  bio: '静かにゲームを作っていたりします。\n神出鬼没なので何処かで会うかもしれませんね。',
  copyright: 'sunadokei',
  accent: '#FF772D',
  social: {
    x: 'https://x.com/5unad0ke1',
    github: 'https://github.com/5unad0ke1',
    links: 'https://links.sunadokei.dev',
  },
} as const;

export const nav: NavItem[] = [
  { key: 'log', label: 'log', href: '/' },
  { key: 'about', label: 'about', href: '/log/about/' },
  { key: 'links', label: 'links', href: site.social.links, external: true },
  { key: 'github', label: 'github', href: site.social.github, external: true },
  { key: 'x', label: 'x', href: site.social.x, external: true },
  { key: 'rss', label: 'rss', href: '/rss.xml' },
];

/** ナビの現在地。about 記事だけは about、それ以外のホーム・記事は log。 */
export function currentNavKey(pathname: string): string | undefined {
  if (pathname.startsWith('/log/about')) return 'about';
  if (pathname === '/' || pathname.startsWith('/log/')) return 'log';
  return undefined;
}
