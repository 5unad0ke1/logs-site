import type { ShikiTransformer } from '@shikijs/types';

const PLAIN_LANGS = new Set(['plaintext', 'text', 'txt', 'plain']);

/**
 * コードブロックを「ファイル名 + copy ボタン」のヘッダ付きの枠で包む。
 * ```cs title="ShakeHandle.cs" のように title を指定する。無ければ言語名を出す。
 */
export function codeFrame(): ShikiTransformer {
  return {
    name: 'code-frame',
    pre(node) {
      // 背景色は枠側(--c-code-bg)で持つので、テーマの背景を外す
      const style = String(node.properties.style ?? '');
      node.properties.style = style
        .split(';')
        .filter((rule) => !/^\s*background(-color)?\s*:/.test(rule))
        .join(';');
    },
    root(root) {
      const pre = root.children[0];
      if (!pre || pre.type !== 'element' || pre.tagName !== 'pre') return;

      const raw = (this.options.meta?.__raw as string | undefined) ?? '';
      const title = /title=(["'])(.*?)\1/.exec(raw)?.[2];
      const lang = this.options.lang ?? '';
      const label = title ?? (PLAIN_LANGS.has(lang) ? '' : lang);

      return {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { class: 'code-frame' },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { class: 'code-frame__head' },
                children: [
                  {
                    type: 'element',
                    tagName: 'span',
                    properties: { class: 'code-frame__title' },
                    children: [{ type: 'text', value: label }],
                  },
                  {
                    type: 'element',
                    tagName: 'button',
                    properties: {
                      type: 'button',
                      class: 'code-frame__copy',
                      'data-copy': '',
                      'aria-label': 'コードをコピー',
                    },
                    children: [{ type: 'text', value: 'copy' }],
                  },
                ],
              },
              pre,
            ],
          },
        ],
      };
    },
  };
}
