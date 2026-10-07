import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config/site';
import { excerpt } from '../lib/excerpt';
import { getPosts, postUrl } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = (await getPosts()).filter((post) => !post.data.draft);
  return rss({
    title: site.title,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description ?? excerpt(post.body),
      link: postUrl(post),
      categories: post.data.tags,
    })),
    customData: '<language>ja</language>',
  });
}
