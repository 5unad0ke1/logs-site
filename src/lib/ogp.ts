import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Ogp {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

/**
 * 取得した OGP は記事リポジトリ(content/)に保存してコミットしておき、
 * 以降のビルドではネットワークに出ない。取り直したいときは該当 URL の行を消す。
 */
const CACHE_FILE = path.join(process.cwd(), 'content', '.cache', 'ogp.json');

let cache: Promise<Record<string, Ogp>> | undefined;
const inflight = new Map<string, Promise<Ogp>>();

function loadCache() {
  cache ??= readFile(CACHE_FILE, 'utf8')
    .then((text) => JSON.parse(text) as Record<string, Ogp>)
    .catch(() => ({}));
  return cache;
}

async function saveCache(entries: Record<string, Ogp>) {
  const sorted = Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
  await mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseOgp(html: string, url: string): Ogp {
  const meta = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(
      tag,
    );
    const value = content?.[1] ?? content?.[2];
    if (key && value && !meta.has(key.toLowerCase())) {
      meta.set(key.toLowerCase(), decodeEntities(value.trim()));
    }
  }
  const titleTag = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1];
  const image = meta.get('og:image') ?? meta.get('twitter:image');
  return {
    url,
    title:
      meta.get('og:title') ??
      meta.get('twitter:title') ??
      (titleTag ? decodeEntities(titleTag.trim()) : new URL(url).hostname),
    description: meta.get('og:description') ?? meta.get('description'),
    image: image ? new URL(image, url).href : undefined,
  };
}

async function fetchOgp(url: string): Promise<Ogp> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; sunadokei-log-ogp/1.0)',
      accept: 'text/html',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseOgp(await res.text(), url);
}

/** URL の OGP を返す。取得に失敗したらドメイン名だけの情報を返す(キャッシュはしない) */
export async function getOgp(url: string): Promise<Ogp> {
  const entries = await loadCache();
  const cached = entries[url];
  if (cached) return cached;

  let pending = inflight.get(url);
  if (!pending) {
    pending = fetchOgp(url)
      .then(async (ogp) => {
        entries[url] = ogp;
        await saveCache(entries);
        return ogp;
      })
      .catch((error: unknown) => {
        console.warn(`[ogp] ${url} の取得に失敗: ${String(error)}`);
        return { url, title: new URL(url).hostname };
      });
    inflight.set(url, pending);
  }
  return pending;
}
