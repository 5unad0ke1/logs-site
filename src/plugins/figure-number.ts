import type { MdxJsxFlowElement, MdxJsxTextElement } from 'satteri';
import type { MdastVisitorContext, PluginFactoryContext } from 'satteri';
import { defineMdastPlugin } from 'satteri';

const NUMBERED = new Set(['Figure', 'Video']);

/** MDX の <Figure> / <Video> に出現順で num="1", "2", … を付ける(fig.N 表記用) */
export function figureNumber() {
  return (_ctx: PluginFactoryContext) => {
    let count = 0;
    const visit = (
      node: Readonly<MdxJsxFlowElement | MdxJsxTextElement>,
      ctx: MdastVisitorContext,
    ) => {
      if (!node.name || !NUMBERED.has(node.name)) return;
      if (node.attributes.some((a) => 'name' in a && a.name === 'num')) return;
      count += 1;
      // Sätteri は JSX ノードの attributes を setProperty で書き換えられないので、
      // 属性を足したノードで丸ごと差し替える
      ctx.replaceNode(node, {
        ...node,
        attributes: [
          ...node.attributes,
          { type: 'mdxJsxAttribute', name: 'num', value: String(count) },
        ],
      } as MdxJsxFlowElement | MdxJsxTextElement);
    };
    return defineMdastPlugin({
      name: 'figure-number',
      mdxJsxFlowElement: visit,
      mdxJsxTextElement: visit,
    });
  };
}
