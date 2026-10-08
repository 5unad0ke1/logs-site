import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    // 記事は別リポジトリ(logs-content)。content/ に clone して読み込む
    base: './content/posts',
    // camera-shake/index.mdx → camera-shake
    generateId: ({ entry }) => entry.replace(/\/index\.mdx?$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      /** OGP / RSS 用。省略時は本文の冒頭から生成 */
      description: z.string().optional(),
      /** OGP 画像 */
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
