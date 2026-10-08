import type { PluginFactoryContext } from 'satteri';
import { defineMdastPlugin } from 'satteri';
import type {} from '@astrojs/markdown-satteri';

const CJK = /[぀-ヿ㐀-鿿豈-﫿ｦ-ﾟ]/g;
const WORD = /[A-Za-z0-9]+/g;

/** 和文は 500字/分、英数字は 200語/分。コードブロックは数えない */
function minutesFor(text: string): number {
  const cjk = text.match(CJK)?.length ?? 0;
  const words = text.replace(CJK, ' ').match(WORD)?.length ?? 0;
  return Math.max(1, Math.ceil(cjk / 500 + words / 200));
}

/** 読了時間(分)を frontmatter.minutes に入れる */
export function readingTime() {
  // 文書ごとに集計をやり直すため、ファクトリで毎回新しい状態を作る
  return (_ctx: PluginFactoryContext) => {
    let text = '';
    return defineMdastPlugin({
      name: 'reading-time',
      text(node) {
        // ノードをまたいで単語がつながらないよう区切る(和文の字数には影響しない)
        text += ` ${node.value}`;
      },
      inlineCode(node) {
        text += ` ${node.value} `;
      },
      after(_root, ctx) {
        const frontmatter = ctx.data.astro?.frontmatter;
        if (frontmatter) frontmatter.minutes = minutesFor(text);
      },
    });
  };
}
