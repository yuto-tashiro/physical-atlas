# 身体の哲学と科学 アトラス（Body Atlas）

身体をめぐる人類の思考の系譜を、哲学史・医学史・神経科学史を横断して辿るWebサイト。

- **技術構成**：Astro（Content Collections）+ Markdown + Cloudflare Workers（静的アセット配信）
- **コンテンツ**：すべて `src/content/` 以下の Markdown。CMSは使っていない
- **公開フロー**：Markdown を追加して push すれば、Cloudflare が自動でビルドし公開する

コンテンツの追加方法は **[CONTRIBUTING.md](./CONTRIBUTING.md)** を参照。

---

## セットアップ

```bash
npm install
npm run dev        # http://localhost:4321
```

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバ |
| `npm run validate` | frontmatter の相互参照を検査（存在しないIDの参照、出典の欠落など） |
| `npm run build` | validate → 静的ビルド（`dist/`） |
| `npm run preview` | ビルド結果をローカルで確認 |
| `npm run deploy` | ビルドして Cloudflare Workers へ手動デプロイ |

`npm run build` は必ず `validate` を先に走らせる。参照が壊れているとビルドは失敗する。

---

## ディレクトリ構成

```text
src/
├── content.config.ts     # コレクションのスキーマ定義（ここが唯一の仕様）
├── content/
│   ├── people/           # 人物
│   ├── concepts/         # 概念
│   ├── works/            # 著作
│   ├── events/           # 科学的発見・実験・論争
│   ├── topics/           # テーマ（問い）
│   └── routes/           # 思想ルート（系譜の連なり）
├── components/           # カード・チェーン・出典リストなど
├── layouts/Base.astro    # 共通レイアウト
├── lib/
│   ├── atlas.ts          # 全コレクションの読み込みと逆リンクの構築
│   └── vocab.ts          # 表示ラベル（時代・分野・関係の種類など）
├── pages/                # ルーティング
└── styles/global.css     # デザイントークンと共通スタイル

templates/                # 新規ページのひな形
scripts/validate-content.mjs
wrangler.jsonc            # Cloudflare Workers 設定
```

ファイル名がそのまま URL の ID になる。`src/content/people/spinoza.md` → `/people/spinoza`。

---

## Cloudflare への公開

### 初回：GitHub 連携で自動デプロイ（推奨）

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create** → **Import a repository**
2. このリポジトリを選択
3. ビルド設定
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Build output directory: `dist`
4. 保存すると、`main` への push で本番デプロイ、PR ごとにプレビューURLが発行される

`wrangler.jsonc` が Worker 名（`body-atlas`）と静的アセットの配信設定を持っているので、
ダッシュボード側で追加の設定は基本的に不要。

### 手動デプロイ

```bash
npx wrangler login
npm run deploy
```

### 公開URLの設定

`astro.config.mjs` の `site` はサイトマップと canonical URL に使われる。
カスタムドメインを設定したら、環境変数 `SITE_URL` を設定するか既定値を書き換える。

```bash
SITE_URL=https://your-domain.example npm run build
```

---

## 編集方針（重要）

このサイトには、内容そのものと同じくらい重要な三つの方針がある。詳しくは `/about` ページに記載。

1. **直接影響と概念的並行を区別する** — 関係には `relation` と `confidence` を必ず付ける
2. **確立した知見と論争中の主張を混ぜない** — 概念には `evidenceStatus` を必ず付ける
3. **出典を追跡可能にする** — `sources` と `reviewStatus` を必ず埋める

AIの助けを借りて書いた文章を、そのまま学術的事実として公開しない。
`reviewStatus: reviewed` は、人手で原典に当たって確認したページにだけ付ける。
