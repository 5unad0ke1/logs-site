/** 2026/08/18 形式。frontmatter の日付は UTC 0時なので UTC で読む */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '/');
}

/** <time datetime> 用の 2026-08-18 形式 */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
