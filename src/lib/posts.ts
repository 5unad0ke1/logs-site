import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 外部サービスの出典名。ここに無いドメインはホスト名の先頭から作る */
const SOURCES: Record<string, string> = {
  'zenn.dev': 'zenn',
  'qiita.com': 'qiita',
  'note.com': 'note',
};

/** 公開記事を新しい順に(外部記事を含む)。draft は dev でのみ含める */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection(
    'posts',
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return posts.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
}

/** Zenn など外部に置いた記事か(サイト内にページを作らない) */
export function isExternal(post: Post): boolean {
  return post.data.externalUrl !== undefined;
}

/** サイト内にページを持つ記事だけ(記事ページ・前後記事用) */
export function localPosts(posts: Post[]): Post[] {
  return posts.filter((post) => !isExternal(post));
}

/** prev = 1つ古い記事、next = 1つ新しい記事 */
export function getAdjacent(posts: Post[], id: string) {
  const index = posts.findIndex((post) => post.id === id);
  return {
    prev: index >= 0 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}

export function postUrl(post: Post): string {
  return post.data.externalUrl ?? `/log/${post.id}/`;
}

/**
 * 一覧の「• log」「• zenn」の部分。外部記事は対応表(SOURCES)を優先し、
 * 無ければホスト名の先頭から作る(www.docswell.com → docswell)
 */
export function sourceLabel(post: Post): string {
  if (!post.data.externalUrl) return 'log';
  const host = new URL(post.data.externalUrl).hostname.replace(/^www\./, '');
  // externalUrl は http(s) に限定しているが、念のため空にはしない
  return SOURCES[host] ?? (host.split('.')[0] || 'link');
}
