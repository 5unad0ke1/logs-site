# sunadokei/log — Astro 実装・設計計画書

- 作成日: 2026-10-07(同日、確認事項の回答を反映)
- 本番 URL: https://logs.sunadokei.dev(GitHub Pages。2026-10-08 に Vercel から変更)
- 元デザイン: `sunadokei blog.html`(Claude Design のバンドル。4画面を抽出して [`docs/design-ref/`](design-ref/) に配置済み)
  - [home.html](design-ref/home.html) … PC ホーム(1280px、レスポンシブ挙動とメニュー開閉ロジックも含む)
  - [article.html](design-ref/article.html) … PC 記事ページ(記事内コンポーネント一式の見本)
  - [mobile-home.html](design-ref/mobile-home.html) / [mobile-menu.html](design-ref/mobile-menu.html) … 390px の静的モック

---

## 0. 決定事項

| 項目       | 決定                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ロゴ表記   | **砂時計/log** に統一(PC・スマホ・メニューすべて)                                                                                                                     |
| works      | **初期リリースでは扱わない**。ナビ・一覧から外す(スキーマ拡張で後から戻せる形にはしておく)                                                                            |
| about      | **自己紹介用の記事**(`/log/about/`)へ飛ばす。`/about` は `/log/about/` へリダイレクト                                                                                 |
| Portfolio  | **没**。チップ・ナビから削除                                                                                                                                          |
| 外部リンク | X: https://x.com/5unad0ke1 / GitHub: https://github.com/5unad0ke1 / Links: https://links.sunadokei.dev                                                                |
| デプロイ   | **GitHub Pages**(`5unad0ke1/logs-site` の Actions でビルド・公開)、本番 URL https://logs.sunadokei.dev。記事データは別リポジトリに分離する(下記「9. リポジトリ分離」) |

これにより、ナビは `log / about / links ↗ / rss`、プロフィールのチップは `X / GitHub / Links ↗`、フッターは `links ↗ / github / x / rss` になる。

---

## 1. デザインの読み解き

### 1.1 全体像

ダークトーン + 等幅フォントの「ターミナル風」個人ブログ。左サイドバー(ロゴ + ナビ)と本文カラムの2カラム構成で、760px 以下ではサイドバーが上部バー + 全画面メニューに切り替わる。

| 画面           | 構成                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| ホーム         | サイドバー / プロフィール(名前・a.k.a.・自己紹介・SNSチップ)/ 記事一覧 / フッター                                         |
| 記事           | サイドバー / パンくず `~/log/<slug>` / 日付 / タイトル / 読了時間・タグ / 本文 / 前後記事 / 目次(左サイドバー) / フッター |
| スマホ         | 上部バー(ロゴ + ハンバーガー)/ 縦1カラム                                                                                  |
| スマホメニュー | 全画面ダイアログ。大きな等幅ナビ + 下部に github / x / ©                                                                  |

### 1.2 デザイントークン(元HTMLのインライン値から抽出)

**カラー**

| トークン            | 値        | 用途                                                |
| ------------------- | --------- | --------------------------------------------------- |
| `--c-bg`            | `#100F0D` | 背景                                                |
| `--c-surface`       | `#1A1815` | ホバー背景・インラインコード・画像プレースホルダ    |
| `--c-code-bg`       | `#161411` | コードブロック背景                                  |
| `--c-border`        | `#2C2924` | 罫線全般                                            |
| `--c-border-hover`  | `#6B655B` | チップ・カードのホバー枠                            |
| `--c-border-dashed` | `#4A453D` | 画像プレースホルダの破線                            |
| `--c-text`          | `#ECE7DE` | 基本文字色                                          |
| `--c-text-body`     | `#D9D3C8` | 記事本文・自己紹介                                  |
| `--c-text-muted`    | `#A39C90` | メタ情報・非アクティブナビ                          |
| `--c-text-hover`    | `#FFFFFF` | リンクホバー                                        |
| `--c-accent`        | `#FF772D` | アクセント(候補: `#FFB000` / `#5CC8FF` / `#B8F25C`) |

コードハイライト色は Material Theme 系(keyword `#C792EA` / type `#FFCB6B` / function `#82AAFF`)。

**フォント**

- 本文: `Zen Kaku Gothic New`(400 / 500 / 700)
- UI・見出しの一部・メタ情報: `JetBrains Mono`(400 / 500 / 700)

**タイポグラフィ**

| 要素            | PC                                      | スマホ                |
| --------------- | --------------------------------------- | --------------------- |
| ホーム h1(mono) | 40px / lh 1.3 / 700                     | 32px                  |
| 記事 h1         | 34px / lh 1.5 / 700                     | 要決定(28px 目安)     |
| 記事 h2         | 22px / lh 1.5、先頭に accent 色の `## ` | 同                    |
| 記事本文        | 16.5px / lh 1.95                        | 同(必要なら 15.5px)   |
| 一覧タイトル    | 16.5px / 500 / lh 1.6                   | 15.5px                |
| メタ(mono)      | 12–14px                                 | 12–13px               |
| ナビ(mono)      | 14px                                    | メニュー内 28px / 500 |

**レイアウト**

- ホーム: `max-width: 1120px`、左右 padding 24px、サイドバーと本文の gap 64px、本文 `max-width: 820px`
- 記事: ~~`max-width: 1320px`、記事カラム 720px、目次は右カラム~~ → **ホームと同じ枠(1120px / 本文 820px)に統一し、目次は左サイドバーのナビの下へ移動**(2026-10-07 変更。本文幅が狭く想定外の改行が起きやすかったため)
- ブレークポイント: **760px**(サイドバー + 目次 ⇔ 上部バー)
- フッターは本文カラムの幅に合わせ、ページが短いときは画面下端に置く(shell を `min-height: 100dvh`、main を flex にして `margin-top: auto`)
- 角丸なし・影なし・1px 罫線で区切るフラットな設計
- タップ領域は 44px 以上を確保(ボタン 44×44、ナビ padding 12–14px)

**インタラクション**

- `.row:hover` / `.navlink:hover` → 背景 `--c-surface`
- `.chip:hover` / `.card:hover` → 枠 `--c-border-hover`
- `a:hover` → `#FFFFFF`、目次項目ホバー → `--c-text`
- ナビの現在地は `> log` のように `>` プレフィクス + accent 色 + 背景 `--c-surface`(非アクティブは2スペースでインデントを揃える。`white-space: pre`)
- 外部リンクには `↗`

### 1.3 記事内コンポーネント(article.html の見本)

1. **見出し h2** … `## ` プレフィクス、目次と連動する id
2. **画像(figure)** … 本文幅いっぱい + `fig.N — キャプション`(mono 12px)
3. **インラインコード** … mono 14px、`--c-surface` 背景 + 1px 枠
4. **コードブロック** … ヘッダにファイル名と `copy` ボタン、背景 `--c-code-bg`
5. **リンクカード(OGP)** … タイトル / 説明(2行で切る)/ ドメイン + 右に 160px のサムネイル
6. **動画** … クリックまでサムネイルのみ表示(軽量化)、accent 色の丸い再生ボタン
7. **ノート** … 1px 枠、`> note` ラベル(accent)、15px 本文
8. **前後記事ナビ** … `← prev`(古い記事)/ `next →`(新しい記事)の2カード
9. **目次** … 左サイドバー(ナビの下)、`contents` 見出し、現在位置を accent の左ボーダーで表示

### 1.4 デザイン上の不整合・未定義(→ 8章の確認事項へ)

- ロゴ表記が PC サイドバーは「砂時計/log」、スマホは「sunadokei/log」→ **「砂時計/log」に統一(決定)**
- サイドバーの `/log` だけ accent ではなく `rgb(255,119,45)` 直書き(= `#FF772D`)。実装では accent に統一する
- スマホ版の自己紹介はプレースホルダ。PC 版の文面を採用する
- スマホの記事ページ・404 のデザインは未提供
- 記事一覧に `works` 種別(TierA.I.M.)が混在し、アイコンがグレーの4マス → **初期リリースでは扱わない(決定)**

---

## 2. 技術選定

| 項目             | 採用                                                                                     | 理由                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| フレームワーク   | **Astro 7**(`npm create astro@latest`、TypeScript strict、Zod 4)                         | 静的出力、Markdown/MDX が一級市民                                           |
| 出力             | `output: 'static'`                                                                       | ブログなので SSR 不要                                                       |
| コンテンツ       | **Content Collections(Content Layer / `glob()` loader)**                                 | 型付き frontmatter、`render()` で headings 取得                             |
| 記事の書式       | **MDX**(`@astrojs/mdx`)                                                                  | リンクカード・動画・ノート等をコンポーネントで書ける。普通の `.md` も併用可 |
| スタイル         | **素の CSS + CSS カスタムプロパティ**(グローバル tokens + コンポーネント scoped)         | 元デザインがシンプルでトークン化しやすい。Tailwind は不要                   |
| フォント         | **Fontsource**(`@fontsource/zen-kaku-gothic-new`, `@fontsource/jetbrains-mono`)          | セルフホスト。和文は unicode-range でサブセット分割済み                     |
| コードハイライト | **Astro 組み込み Shiki** + 自作 rehype プラグイン(ファイル名ヘッダ・copy ボタンの枠付け) | 依存を増やさずデザイン通りに作れる                                          |
| 画像             | `astro:assets` の `<Image>`                                                              | WebP 化・サイズ最適化・CLS 防止                                             |
| RSS              | `@astrojs/rss`                                                                           | ナビ・フッターに `rss` がある                                               |
| サイトマップ     | `@astrojs/sitemap`                                                                       | SEO                                                                         |
| クライアント JS  | フレームワーク無し(素の `<script>`)                                                      | 必要なのはメニュー開閉・コピー・目次ハイライト・動画の遅延読み込みのみ      |

> 代替案メモ: コードブロックは `astro-expressive-code` を使えばファイル名・コピーが標準装備だが、見た目をデザインに寄せる上書きの手間が大きいので不採用。

---

## 3. ディレクトリ構成

```
logs-site/
├─ astro.config.mjs
├─ src/
│  ├─ content.config.ts          # コレクション定義(zod スキーマ)
│  ├─ content/
│  │  └─ posts/
│  │     ├─ about/
│  │     │  └─ index.mdx         # 自己紹介記事(nav の about のリンク先)
│  │     └─ camera-shake/
│  │        ├─ index.mdx         # slug = ディレクトリ名
│  │        └─ fig1.png          # 記事画像は記事と同じ場所に置く
│  ├─ config/
│  │  └─ site.ts                 # サイト名・ナビ・SNS URL・アクセント色
│  ├─ layouts/
│  │  ├─ BaseLayout.astro        # <head>、フォント、サイドバー/上部バー/メニュー、フッター
│  │  └─ PostLayout.astro        # 記事ヘッダ、本文、前後記事、目次
│  ├─ components/
│  │  ├─ HourglassIcon.astro     # 砂時計 SVG(サイズ・色を props で)
│  │  ├─ Logo.astro
│  │  ├─ SideNav.astro           # PC サイドバー
│  │  ├─ MobileBar.astro         # スマホ上部バー
│  │  ├─ MobileMenu.astro        # <dialog> の全画面メニュー
│  │  ├─ Footer.astro
│  │  ├─ Profile.astro           # ホームのプロフィール + チップ
│  │  ├─ PostList.astro / PostRow.astro
│  │  ├─ Toc.astro
│  │  └─ PrevNext.astro
│  ├─ components/mdx/            # 記事内で使うコンポーネント
│  │  ├─ Figure.astro
│  │  ├─ LinkCard.astro
│  │  ├─ Video.astro
│  │  └─ Note.astro
│  ├─ lib/
│  │  ├─ posts.ts                # 一覧取得・ソート・draft 除外・前後記事
│  │  ├─ ogp.ts                  # ビルド時 OGP 取得 + キャッシュ
│  │  └─ format.ts               # 日付 2026/08/18 形式など
│  ├─ plugins/
│  │  ├─ reading-time.ts         # 和文対応の読了時間を frontmatter に注入(Sätteri mdast)
│  │  ├─ figure-number.ts        # <Figure>/<Video> に fig 番号を振る(Sätteri mdast)
│  │  └─ code-frame.ts           # <pre> をファイル名ヘッダ + copy 付きの枠で包む(Shiki transformer)
│  ├─ styles/
│  │  ├─ tokens.css              # 1.2 のトークン
│  │  ├─ global.css              # リセット・基本要素・フォーカスリング
│  │  └─ prose.css               # 記事本文(p, h2, h3, code, ul, blockquote …)
│  └─ pages/
│     ├─ index.astro             # ホーム
│     ├─ log/[slug].astro        # 記事
│     ├─ rss.xml.ts
│     └─ 404.astro
├─ public/
│  └─ favicon.svg                # 砂時計アイコン
└─ docs/
   ├─ PLAN.md                    # この文書
   └─ design-ref/                # 元デザインの抽出 HTML
```

---

## 4. データ設計

### 4.1 posts コレクションのスキーマ

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      description: z.string().optional(), // OGP / RSS 用。無ければ冒頭から生成
      cover: image().optional(), // OGP 画像
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
```

- **slug** = 記事ディレクトリ名(例: `camera-shake` → `/log/camera-shake/`、パンくず `~/log/camera-shake`)
- **works を復活させる場合**は `category: z.enum(['log','works'])` と `externalUrl` を追加する(一覧行のアイコン切替もその時に実装)
- **draft** は本番ビルドで除外、`astro dev` では表示
- **読了時間** は remark プラグインで計算(和文 500字/分 + 英単語 200語/分、コードブロック除外)し `remarkPluginFrontmatter.minutes` から取得

### 4.2 サイト設定

```ts
// src/config/site.ts
export const site = {
  title: '砂時計/log',
  url: 'https://logs.sunadokei.dev',
  author: '砂時計',
  alias: '5unad0ke1',
  bio: '静かにゲームを作っていたりします。\n神出鬼没なので何処かで会うかもしれませんね。',
  accent: '#FF772D',
  nav: [
    { label: 'log', href: '/' },
    { label: 'about', href: '/log/about/' },
    { label: 'links', href: 'https://links.sunadokei.dev', external: true },
    { label: 'rss', href: '/rss.xml' },
  ],
  social: {
    x: 'https://x.com/5unad0ke1',
    github: 'https://github.com/5unad0ke1',
    links: 'https://links.sunadokei.dev',
  },
};
```

---

## 5. ページ・コンポーネント設計

### 5.1 BaseLayout

- `<html lang="ja">`、`<meta name="viewport">`、title / description / OGP / Twitter Card / canonical / RSS の `<link rel="alternate">`
- `--c-accent` は `site.accent` から `:root` に注入(1か所で色替え可能に)
- PC: CSS Grid で `[sidebar 180px+] [main]`、760px 以下は sidebar 非表示 + MobileBar 表示
  - 元デザインの「flex-wrap + flex-basis」方式は中間幅で意図しない折り返しが起きやすいので、**Grid + 明示的なメディアクエリ**で同じ見た目を再現する
- ナビの現在地判定は `Astro.url.pathname` で行う(`/log/about/` なら about、それ以外の `/`・`/log/*` は log)。現在地の項目には `>` プレフィクスと `aria-current="page"` を付ける

### 5.2 MobileMenu

- ネイティブ `<dialog>` + `showModal()` を使う(`aria-modal`、Esc で閉じる、背景の inert 化をブラウザに任せる)
- 開いている間は `html:has(dialog[open]) { overflow: hidden }` でスクロールロック
- ハンバーガーに `aria-expanded` を同期、閉じたらフォーカスを開くボタンへ戻す
- メニュー内リンクのクリックでも閉じる

### 5.3 ホーム(`/`)

- Profile: h1「砂時計」(mono)、`a.k.a. 5unad0ke1`、自己紹介(改行保持)、チップ(X / GitHub / Links ↗)
- PostList: `date` 降順。各行は accent の砂時計アイコン + タイトル / `YYYY/MM/DD • log`
- about 記事も通常の記事として一覧・前後記事に含める(外したい場合は frontmatter に `unlisted` を足して除外する)
- 当面はページネーション無し(記事数が増えたら年別見出し or ページ分割を検討)

### 5.4 記事(`/log/[slug]/`)

- ヘッダ: パンくず `~/log/<slug>`(ホームへのリンク)→ `<time datetime>` → h1 → 砂時計アイコン + `N min` と `#tag #tag`
- 本文: `prose.css` でスタイル。h2 は CSS の `::before` で `## ` を付ける(コピー時に混ざらないよう `content` で)
- 目次: `render()` の `headings` から depth 2(必要なら 3 も字下げ)を生成。スクロール位置から現在位置をハイライト。左サイドバーに置くため 760px 以下(サイドバー非表示)では出ない
- 前後記事: draft を除いた日付順で、prev = 1つ古い記事、next = 1つ新しい記事。片方しか無い場合は1枚だけ表示
- スマホ版はデザイン未提供のため、ホームのスマホ版の余白・文字サイズの縮め方に合わせて作る

### 5.5 記事内コンポーネント(MDX)

| コンポーネント | 書き方(案)                                                                 | 実装メモ                                                                                                                                |
| -------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| コードブロック | ` ```cs title="ShakeHandle.cs" `                                           | Shiki(`material-theme-darker` 系)+ rehype で枠化。背景だけ `--c-code-bg` に上書き。copy はクリップボード API、押下後 `copied` 表示      |
| Figure         | `<Figure src={img} alt="…" caption="3層構成の図" />`                       | `astro:assets` の `<Image>`。`fig.N` の番号は記事内の出現順で自動採番                                                                   |
| LinkCard       | `<LinkCard url="https://…" />`                                             | ビルド時に OGP を取得し `.cache/ogp.json` にキャッシュ。取得失敗時は URL とドメインだけのカードにフォールバック。説明は `line-clamp: 2` |
| Video          | `<Video youtube="ID" caption="…" />` / `<Video src="/x.mp4" poster={…} />` | クリックまで iframe/video を生成しない(lite-youtube 方式)。YouTube は `youtube-nocookie.com`                                            |
| Note           | `<Note>…</Note>`                                                           | `> note` ラベル付きの枠                                                                                                                 |

> 将来: 素の `.md` でも書けるよう、URL だけの段落 → LinkCard への自動変換(remark)や `:::note` 記法(remark-directive)を追加できる構成にしておく。

### 5.6 その他ページ

- `/rss.xml`: 全公開記事(title / date / description / link)
- `/about`: `astro.config.mjs` の `redirects` で `/log/about/` へ
- `404`: サイドバー付きで `> 404 not found` 程度の簡素なもの

---

## 6. 非機能要件

- **パフォーマンス**: Lighthouse(モバイル)Performance 95+ を目標。JS は数 KB の素スクリプトのみ。和文フォントは `font-display: swap`、使うウェイトだけ読み込む
- **アクセシビリティ**: コントラストは現行配色で AA を満たす(muted `#A39C90` on `#100F0D` ≈ 7:1)。元デザインに無い `:focus-visible` のアウトライン(accent 2px)を追加。装飾 SVG は `aria-hidden`
- **SEO**: canonical、OGP、sitemap、記事ごとの description
- **CSS 方針**: 元デザインのインラインスタイルは全てクラス + トークンに置き換える。Astro の scoped CSS はグローバルクラスより詳細度が高くなるため、**共通ユーティリティは作らず、スタイルは原則コンポーネント内に閉じる**(過去に scoped CSS がグローバル utility を上書きして詰まった事例あり)

---

## 7. 実装ステップ

各フェーズ完了時に、ブラウザで元デザイン(`docs/design-ref/`)と 1280px / 390px で見比べて確認する。

| #   | フェーズ             | 内容                                                                                                                                                                                                                                           | 完了条件                                                                            |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 0   | セットアップ         | `npm create astro@latest`(minimal, TS strict)、`site: 'https://logs.sunadokei.dev'`、MDX / sitemap / rss 追加、Fontsource 導入、`.gitignore`、Prettier                                                                                         | `npm run dev` / `npm run build` が通る                                              |
| 1   | 基盤                 | `tokens.css` / `global.css`、`site.ts`、BaseLayout、SideNav、MobileBar、MobileMenu、Footer                                                                                                                                                     | 空ページで PC・スマホのガワがデザインと一致。メニューが開閉でき Esc で閉じる        |
| 2   | ホーム               | content.config.ts、ダミー記事4件(デザインの一覧から works を除いたもの)、Profile、PostList                                                                                                                                                     | home.html / mobile-home.html と見た目が一致                                         |
| 3   | 記事ページ           | `[slug].astro`、PostLayout、prose.css、読了時間、Toc(ハイライト付き)、PrevNext                                                                                                                                                                 | article.html の見出し・本文・目次・前後記事が一致                                   |
| 4   | 記事内コンポーネント | コードブロック枠 + copy、Figure、LinkCard(OGP キャッシュ)、Video、Note                                                                                                                                                                         | サンプル記事 `camera-shake` で全コンポーネントが表示される                          |
| 5   | 周辺機能             | RSS、OGP/meta、sitemap、favicon、about 記事 + `/about` リダイレクト、404、draft 除外                                                                                                                                                           | `/rss.xml` が妥当、各ページの meta が出る                                           |
| 6   | 仕上げ・検証         | フォーカススタイル、Lighthouse、実機スマホ確認、リンク切れチェック                                                                                                                                                                             | 6章の目標値を満たす                                                                 |
| 7   | デプロイ             | GitHub Actions(`withastro/action` + `actions/deploy-pages`)でビルド・公開。記事リポジトリを `content/` にチェックアウトしてからビルド。Pages の Custom domain に `logs.sunadokei.dev` を設定し、DNS に `logs` → `5unad0ke1.github.io` の CNAME | https://logs.sunadokei.dev で表示され、記事リポジトリへの push でも再デプロイされる |

---

## 7.5 実装メモ(フェーズ1〜5 実施時に判明したこと)

- **Astro 7 の Markdown 処理系は Sätteri(Rust 製)が既定**。remark/rehype プラグインはそのままでは使えないため、読了時間・図番号は `satteri` の `defineMdastPlugin` で書いた(`markdown.processor: satteri({ mdastPlugins })`)。MDX も同じ processor を継承する
  - Sätteri では MDX JSX ノードの `attributes` を `setProperty` で書き換えられない → `replaceNode` で差し替える
  - 文書ごとの状態(文字数・図番号カウンタ)はプラグインをファクトリ関数にして持たせる
- **コードブロック枠**は rehype ではなく Shiki の transformer(`markdown.shikiConfig.transformers`)で実装。Astro は `codeToHast` の結果の最初の子を使うので、`root` フックで `div.code-frame` に包める。`title="..."` は `this.options.meta.__raw` から読む
- Zod 4 なので `z` は `astro/zod` から import
- OGP キャッシュは `.cache/ogp.json`(リポジトリにコミットする想定)。取り直すときは該当 URL を消す
- MDX 用コンポーネント(Figure / LinkCard / Video / Note)は `<Content components={...}>` で渡しているので、記事側での import は不要(画像の import だけ必要)

---

## 8. 未決事項

- ~~ロゴ表記~~ / ~~works~~ / ~~about~~ / ~~リンク先~~ / ~~デプロイ先~~ → 0章で決定
- **アクセント色**: `#FF772D` 固定で進める(色替えは `site.ts` の1か所で可能)
- **記事の書式**: MDX で進める
- **その他**: アクセス解析(Cloudflare Web Analytics / GA など)・コメント・タグ別一覧は初期リリースでは作らない

---

## 9. リポジトリ分離(記事データ / ブログシステム)

2026-10-08 決定。yucchiy/blogv4(システム)+ yucchiy/blog.yucchiy.com(記事)とほぼ同じ形で、**公開(GitHub Pages)は記事リポジトリ側の Actions が担う**。記事の push で即デプロイさせるため。

```
5unad0ke1/logs-site     ← ブログシステム(public)。.github/workflows/ci.yml
└─ content/             ← .gitignore。logs-content の clone
5unad0ke1/logs-content  ← 記事データ(public)。GitHub Pages の公開元
├─ posts/<slug>/index.mdx + 画像
├─ .cache/ogp.json      ← リンクカードの OGP キャッシュ
└─ .github/workflows/deploy.yml
```

- **logs-content の deploy.yml**: 起点は「記事の push」「logs-site からの `repository_dispatch`(`system-updated`)」「手動」。logs-site の `main` を `system/` に、自分自身を `system/content/` に checkout してビルドし、`actions/deploy-pages` で公開する(yucchiy 方式と違い、コピー用スクリプトは不要)
- **logs-site の ci.yml**: PR と push で format / check / build を確認。`main` への push では、ビルド成功後に logs-content へ `repository_dispatch` を送り、システムの変更もすぐ本番に反映する
  - 送信には logs-content の **Contents: Read and write** を持つ Fine-grained PAT が必要。logs-site の Secrets に `CONTENT_DISPATCH_TOKEN` として登録する(未設定なら警告だけ出してスキップ)
- **ローカル開発**: `npm run dev` / `build` / `check` の前に `scripts/fetch-content.mjs` が走り、`content/` が無ければ logs-content を clone する。記事は `content/` の中で書いてコミット・push する
- **注意**: デプロイは logs-site の `main` を使う。開発中の `develop` の内容は `main` にマージするまで本番に出ない
- **記事とシステムの約束事**: frontmatter スキーマと MDX コンポーネント(Figure / LinkCard / Video / Note)。logs-content の README にまとめた

### 公開までの手作業

1. GitHub に `5unad0ke1/logs-content`(public)を作り、ローカルの `content/` を push
2. logs-content の Settings → Pages → Source を **GitHub Actions** にする
3. 同じく Pages → Custom domain に `logs.sunadokei.dev` を設定し、DNS に `logs` → `5unad0ke1.github.io` の CNAME を追加。反映後 Enforce HTTPS を有効化
4. logs-site の `develop` を `main` にマージ
5. (任意)Fine-grained PAT を作り、logs-site の Secrets に `CONTENT_DISPATCH_TOKEN` を登録
