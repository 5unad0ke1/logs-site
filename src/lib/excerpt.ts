/** MDX 本文からメタ description 用のプレーンテキスト抜粋を作る(簡易) */
export function excerpt(body: string | undefined, length = 120): string {
  if (!body) return '';
  const text = body
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/[`*_>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
