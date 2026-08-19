# LHXXY · 个人技术博客

日式极简 + 杂志排版的个人技术博客，基于 **Astro 5**（静态站点生成器）+ **GSAP / ScrollTrigger**（动效）+ **Lenis**（平滑滚动）。

- 全站静态输出，无服务器，可部署到 Cloudflare Pages / GitHub Pages
- 首页 hero 叙事 + 沉浸式滚动（pin / scrub）
- 博客列表 + 分类 / 标签静态页 + 单篇文章（目录、代码高亮、阅读时长、进度条、返回顶部）
- 暗色模式（CSS 变量平滑过渡）、玻璃拟态导航、渐变光晕 + 噪点纹理、中式印章签名彩蛋
- SEO：sitemap、RSS、OG 标签；`prefers-reduced-motion` 优雅降级

---

## 环境要求

- **Node.js 20+**（推荐 LTS），安装后自带 npm

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（热更新预览）
npm run dev

# 3. 构建静态产物（输出到 dist/）
npm run build

# 4. 本地预览构建结果
npm run preview
```

> 首次 `npm run dev` 会生成 `.astro/` 类型缓存，属正常现象（已被 gitignore）。

---

## 目录结构

```
lhxxy.top/
├── astro.config.mjs          # 站点配置（site、sitemap、代码高亮）
├── package.json
├── public/                   # 静态资源（原样拷贝）
│   ├── favicon.svg
│   ├── avatar.svg            # 头像占位，替换成你的照片
│   ├── og.svg                # 默认分享图（建议换成 1200×630 PNG）
│   └── robots.txt
└── src/
    ├── content/
    │   ├── config.ts         # 文章 frontmatter 校验
    │   └── blog/*.md         # 文章（Markdown）
    ├── components/           # 导航 / 页脚 / 印章 / 目录 / 进度条等
    ├── layouts/Base.astro    # 全局布局（字体 / SEO / 主题 / 动效初始化）
    ├── pages/                # 路由（index / blog / about / links / rss）
    ├── styles/global.css     # 设计系统（色彩变量 / 字阶 / 组件样式）
    └── lib/                  # site.ts（站点信息）、utils.ts（工具）
```

---

## 写文章

在 `src/content/blog/` 下新建 `.md` 文件，文件名即文章 slug（URL 的一部分）。frontmatter 示例：

```md
---
title: 文章标题
description: 一句话摘要（用于列表卡片与 OG）
pubDate: 2024-01-15
updatedDate: 2024-02-01   # 可选
category: 前端            # 会自动生成 /blog/category/前端/
tags: [Astro, GSAP]       # 会自动生成 /blog/tag/Astro/ 等
cover: /cover.webp        # 可选，分享图
draft: false              # true 则构建时不发布
---

正文使用标准 Markdown 语法。
```

- **代码高亮**：Shiki 内置，用 ```` ```ts ```` 围栏即可
- **目录**：正文里的 `##`、`###` 标题自动生成目录与锚点
- **阅读时长**：按中文字数自动计算

分类与标签无需预先注册，新增文章后 `getStaticPaths` 会自动生成对应的静态筛选页。

---

## 个性化

| 改什么 | 改哪里 |
| --- | --- |
| 站名 / 一句话简介 / 社交链接 | `src/lib/site.ts` |
| 品牌色 / 暗色 / 字体 / 字号 | `src/styles/global.css` 顶部的 `:root` 与 `[data-theme='dark']` |
| 头像 | 替换 `public/avatar.svg`（或换成图片并改 `index.astro` / `about.astro` 里的 `src`） |
| 分享图 | 替换 `public/og.svg`（建议 1200×630 的 PNG） |
| 中式印章文字 / 颜色 | `src/components/Seal.astro` |
| 首页 hero 文案 / 理念句 | `src/pages/index.astro` |
| 友链列表 | `src/pages/links.astro` 顶部的 `friends` 数组 |
| 域名 | `astro.config.mjs` 的 `site` + `src/lib/site.ts` 的 `url` |

---

## 部署

完整步骤（Cloudflare Pages + 绑定 `lhxxy.top` + DNS 解析）见 **[docs/DEPLOY.md](./docs/DEPLOY.md)**。
