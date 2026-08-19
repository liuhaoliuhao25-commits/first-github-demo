---
title: 用 Astro + GSAP 打造杂志质感的个人站
description: 从岛屿架构、动效系统到排版细节，拆解这个博客在技术与设计上的取舍。
pubDate: 2024-02-08
updatedDate: 2024-02-20
category: 前端
tags: [Astro, GSAP, 动效, 设计]
---

一个「有质感」的个人站，从来不是靠堆砌特效堆出来的。这篇记录这个博客在构建时的几个关键取舍：如何用 Astro 做到内容优先，如何用 GSAP 做克制的动效，以及如何让排版自己会说话。

## 岛屿架构：默认零 JavaScript

Astro 的核心理念是 **Islands（岛屿）架构**——页面的绝大部分是纯静态 HTML，只有需要交互的「岛屿」才会水合（hydrate）JavaScript。

在这个博客里，导航、页脚、正文、卡片全部是静态 HTML，只有三个地方真正需要脚本：

1. 主题切换（暗色模式）
2. 滚动动效（GSAP + ScrollTrigger）
3. 目录高亮、进度条等轻量增强

这意味着首屏几乎不下载任何框架代码，性能天然地好。

## 动效系统：用 GSAP 做克制的事

动效的技术栈是 GSAP + ScrollTrigger。核心原则只有一条——**动效服务于内容，而非炫技**。

### 滚动淡入

进入视口的元素做一次「淡入 + 轻微上移」，只触发一次：

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

gsap.utils.toArray('[data-reveal]').forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 28,
    duration: 0.9,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 88%',
      once: true,
    },
  });
});
```

### 沉浸式滚动

首页的理念区用了 `pin` + `scrub`，让三句话随着滚动逐行浮现，形成一种「被慢慢揭示」的阅读节奏：

```js
gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: 'top top',
    end: '+=180%',
    pin: sticky,
    scrub: 0.6,
  },
});
```

### 响应式与无障碍

用 `gsap.matchMedia()` 区分桌面与移动端——移动端关掉重特效，只保留轻量淡入；同时尊重 `prefers-reduced-motion`，用户偏好减少动效时完全不加载 GSAP：

```js
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) return; // 优雅降级，内容由 CSS 保持可见
```

## 排版系统：中衬 + 西无

这套视觉最微妙的地方在字体混排。中文字符使用带书卷气的衬线体（Noto Serif SC），而英文与数字使用无衬线的 Inter，形成「中衬 + 西无」的对比质感：

```css
:root {
  --font-mix: 'Inter', 'Noto Serif SC', 'Songti SC', serif;
}

body {
  font-family: var(--font-mix);
  font-size: 17px;
  line-height: 1.85;
}
```

西文字符会优先命中 Inter，中文字符自动回落到 Noto Serif SC——一行代码都不用写，混排就自然成立了。

## 暗色模式

暗色模式不是简单地「反色」，而是重新定义一套暖灰的深色纸感。切换时通过 CSS 变量过渡，平滑而不生硬：

```css
:root {
  --bg: #faf9f7;
  --text: #1a1a1a;
}

[data-theme='dark'] {
  --bg: #0f0f10;
  --text: #e8e6e1;
}

body {
  transition: background-color 0.35s, color 0.35s;
}
```

## 小结

所谓「顶级个人站的精致感」，拆到底不过是三件事：内容优先的架构、恰到好处的动效、以及经得起细看的排版。工具是次要的，取舍才是重点。
