import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { render } from 'astro:content';
import { site } from '../config/site';
import { getPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((post) => !post.data.draft);
  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: await Promise.all(
      posts.map(async (post) => ({
        title: post.data.title,
        pubDate: post.data.date,
        // 本文の無い外部記事は抜粋が空になるので、その場合は出さない
        description:
          (post.data.description ??
            (await render(post)).remarkPluginFrontmatter.excerpt) ||
          undefined,
        // 外部記事は Zenn などの URL をそのまま
        link: postUrl(post),
        categories: post.data.tags,
      })),
    ),
    customData: '<language>ja</language>',
  });
}
