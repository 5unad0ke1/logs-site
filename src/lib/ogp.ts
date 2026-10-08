import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface Ogp {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

/**
 * 取得した OGP は記事リポジトリ(content/)に保存してコミットしておき、
 * 以降のビルドではネットワークに出ない。取り直したいときは該当 URL の項目({ … } ごと)を消す。
 */
const CACHE_FILE = path.join(process.cwd(), 'content', '.cache', 'ogp.json');

let cache: Promise<Record<string, Ogp>> | undefined;
const inflight = new Map<string, Promise<Ogp>>();
let saving: Promise<void> = Promise.resolve();

async function readCache(): Promise<Record<string, Ogp>> {
  let text: string;
  try {
    text = await readFile(CACHE_FILE, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
  try {
    return JSON.parse(text) as Record<string, Ogp>;
  } catch (error) {
    // 黙って {} にすると全 URL を取り直し、次の保存で取得できなかった分が消えるので止める
    throw new Error(
      `[ogp] ${CACHE_FILE} が JSON として読めません。手で編集した箇所を確認してください: ${String(error)}`,
    );
  }
}

function loadCache() {
  cache ??= readCache();
  return cache;
}

/** 書き込みは1本の Promise に直列化し、一時ファイル経由で置き換えて途中状態を残さない */
function saveCache(entries: Record<string, Ogp>) {
  // 前の保存が失敗していても、次の保存は実行する
  saving = saving
    .catch(() => {})
    .then(async () => {
      const sorted = Object.fromEntries(
        Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
      );
      const tmp = `${CACHE_FILE}.tmp`;
      await mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await writeFile(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
      await rename(tmp, CACHE_FILE);
    });
  return saving;
}

/** Content-Type か <meta charset> から文字コードを決める。不明なら UTF-8 */
function decodeHtml(bytes: Uint8Array, contentType: string | null): string {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1];
  // <meta> は ASCII で書かれているので、先頭だけ latin1 で読んで探す
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
  const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1];
  const label = fromHeader ?? fromMeta ?? 'utf-8';
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
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

/** 表示用のホスト名。URL として解釈できなければそのまま返す */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** url はキャッシュのキー、finalUrl はリダイレクト後の URL(相対パスの解決に使う) */
function parseOgp(html: string, url: string, finalUrl: string): Ogp {
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
      (titleTag ? decodeEntities(titleTag.trim()) : hostOf(url)),
    description: meta.get('og:description') ?? meta.get('description'),
    image: image ? new URL(image, finalUrl).href : undefined,
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
  const bytes = new Uint8Array(await res.arrayBuffer());
  return parseOgp(
    decodeHtml(bytes, res.headers.get('content-type')),
    url,
    res.url || url,
  );
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
        await saveCache(entries).catch((error: unknown) => {
          console.warn(`[ogp] キャッシュの保存に失敗: ${String(error)}`);
        });
        return ogp;
      })
      .catch((error: unknown) => {
        console.warn(`[ogp] ${url} の取得に失敗: ${String(error)}`);
        return { url, title: hostOf(url) };
      });
    inflight.set(url, pending);
  }
  return pending;
}
