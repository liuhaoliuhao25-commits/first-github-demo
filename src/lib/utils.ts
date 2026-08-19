/**
 * 站内通用工具函数。
 */

/** 中文长日期：2024 年 1 月 15 日 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** 紧凑日期：2024.01.15（用于卡片与刊头） */
export function formatDateCompact(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })
    .format(date)
    .replace(/\//g, '.');
}

/** ISO 8601（用于 <time datetime> 与 sitemap） */
export function formatISO(date: Date): string {
  return date.toISOString();
}

/**
 * 阅读时长（分钟）。
 * 中文按 400 字/分钟，英文按 200 词/分钟，向上取整，最少 1 分钟。
 */
export function readingMinutes(text: string): number {
  const cjk = (
    text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/g) || []
  ).length;
  const rest = text.replace(
    /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u30ff\uac00-\ud7af]/g,
    ' ',
  );
  const words = (rest.match(/[A-Za-z0-9_]+/g) || []).length;
  const minutes = Math.ceil(cjk / 400 + words / 200);
  return Math.max(1, minutes);
}

/** 文章 slug 生成（备用，未直接依赖 content collections 时使用） */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-');
}
