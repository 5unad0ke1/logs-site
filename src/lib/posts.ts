import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 公開記事を新しい順に。draft は dev でのみ含める */
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

/** prev = 1つ古い記事、next = 1つ新しい記事 */
export function getAdjacent(posts: Post[], id: string) {
  const index = posts.findIndex((post) => post.id === id);
  return {
    prev: index >= 0 ? posts[index + 1] : undefined,
    next: index > 0 ? posts[index - 1] : undefined,
  };
}

export function postUrl(post: Post): string {
  return `/log/${post.id}/`;
}
