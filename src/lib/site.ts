/**
 * 全站集中配置：改这里即可统一更新站名、简介、社交链接、SEO 默认值。
 */
export const SITE = {
  /** 站点名（导航 / SEO / RSS 标题） */
  title: 'LHXXY',
  /** 作者名（首页、文章署名、OG） */
  author: 'LHXXY',
  /** 首页一句话简介 */
  tagline: '写代码，也写点别的。',
  /** 默认 SEO 描述 */
  description:
    'LHXXY 的个人技术博客 —— 关于前端工程、交互动效、设计与工程实践的记录。',
  /** 站点根地址（用于 sitemap / RSS / OG 绝对路径，务必与域名一致） */
  url: 'https://lhxxy.top',
  locale: 'zh-CN',
  lang: 'zh-CN',
  timeZone: 'Asia/Shanghai',
  /** 社交链接：留空字符串即不渲染对应图标 */
  social: {
    github: 'https://github.com/lhxxy',
    twitter: 'https://x.com/lhxxy',
    email: 'hi@lhxxy.top',
    rss: '/rss.xml',
  },
} as const;
