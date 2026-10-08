import type { MdastContent } from 'satteri';
import { defineMdastPlugin } from 'satteri';

/**
 * 段落中の1回の改行を、そのまま改行(<br>)として表示する。
 * Markdown の標準では1回の改行は「同じ段落の続き」でスペース扱いになるが、
 * Zenn / Qiita と同じく、書いた通りに改行されるようにする(remark-breaks 相当)。
 * 段落を分けたいときは、これまで通り空行を入れる。
 */
export function lineBreaks() {
  return defineMdastPlugin({
    name: 'line-breaks',
    text(node, ctx) {
      if (!node.value.includes('\n')) return;
      const parts: MdastContent[] = [];
      node.value.split('\n').forEach((line, index) => {
        if (index > 0) parts.push({ type: 'break' });
        if (line) parts.push({ type: 'text', value: line });
      });
      ctx.replaceNode(node, parts);
    },
  });
}
