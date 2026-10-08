/** MDX 本文からメタ description 用のプレーンテキスト抜粋を作る(簡易) */
export function excerpt(body: string | undefined, length = 120): string {
  if (!body) return '';
  const text = body
    // MDX の import / export(複数行にまたがるものも含め、文の終わりまで)
    .replace(/^import\s[\s\S]*?['"][^'"\n]*['"];?[ \t]*$/gm, '')
    .replace(/^export\s[\s\S]*?(?:;[ \t]*$|(?=\n\s*\n))/gm, '')
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
