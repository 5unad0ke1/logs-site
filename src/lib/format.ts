const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 2026/08/18 形式(日本時間)。時刻付き(+09:00 など)の日付でも日付がずれない */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/** 図・動画のキャプション「fig.2 — キャプション」 */
export function figLabel(num?: string, caption?: string): string {
  return [num && `fig.${num}`, caption].filter(Boolean).join(' — ');
}
