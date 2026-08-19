import { defineCollection, z } from 'astro:content';

/**
 * 博客文章集合。
 * 每篇文章是 src/content/blog/ 下的一篇 Markdown。
 * frontmatter 示例：
 * ---
 * title: 文章标题
 * description: 摘要（用于列表卡片与 OG）
 * pubDate: 2024-01-15
 * updatedDate: 2024-02-01
 * category: 前端
 * tags: [Astro, GSAP]
 * cover: /cover.webp
 * draft: false
 * ---
 */
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
