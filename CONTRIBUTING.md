# コンテンツの追加・編集ガイド

このサイトのコンテンツはすべて `src/content/` 以下の Markdown ファイルである。
1ファイル追加して push すれば公開される。

```text
調べる
  ↓
src/content/<種類>/<id>.md を追加（templates/ をコピー）
  ↓
npm run validate      ← 参照の壊れ・出典の欠落を検査
  ↓
npm run dev           ← 見た目を確認
  ↓
git commit && git push
  ↓
Cloudflare が自動ビルド → 公開
```

---

## 1. どのコレクションに書くか

| 種類 | ディレクトリ | 何を書くか |
|---|---|---|
| 人物 | `src/content/people/` | 哲学者・科学者・医学者 |
| 概念 | `src/content/concepts/` | アフォーダンス、身体図式などの概念 |
| 著作 | `src/content/works/` | 一次文献 |
| 研究・出来事 | `src/content/events/` | 実験、発見、論争。通史ページの年表に並ぶ |
| テーマ | `src/content/topics/` | 「身体はいかに動くのか」といった問い |
| 思想ルート | `src/content/routes/` | 系譜の連なり（Connections ページに表示） |

**ファイル名がそのまま ID と URL になる。** 英小文字・数字・ハイフンのみを使う。

---

## 2. ID を繋ぐ

コンテンツ同士は ID の文字列で参照する。存在しない ID を書くと `npm run validate` が
「もしかして: ...」付きで教えてくれる。

```yaml
# src/content/people/bergson.md
works: [matter-and-memory]        # → src/content/works/matter-and-memory.md
concepts: [affordance]            # → src/content/concepts/affordance.md
relatedPeople:
  - id: gibson
    relation: conceptual_parallel
    confidence: medium
```

### 関係は片側だけ書けばよい

ベルクソンのページに「ギブソンと概念的並行」と書けば、
**ギブソンのページにも逆向きのリンクが自動で現れる。**
同じ関係を両方のファイルに書く必要はない。

同様に、

- 著作の `author` を書けば、その人物ページの「代表的な著作」に出る
- 概念の `originators` / `relatedPeople` を書けば、その人物ページの「重要概念」に出る
- テーマや思想ルートに ID を並べれば、人物・概念ページの「ここから辿る」に出る

---

## 3. 三つの必須ルール

### ルール1：関係の種類と確度を必ず書く

思想同士の関係を単純な「影響関係」に潰さない。

| `relation` | 意味 |
|---|---|
| `direct_influence` | 歴史的に直接読まれ、受け継がれた |
| `response_to` | この人物の問題設定に応答している |
| `criticism` | 批判的に取り上げている |
| `conceptual_parallel` | **直接の影響関係ではなく、似た問題を扱っている** |
| `scientific_extension` | 哲学的な問いを実証科学へ展開した |
| `reinterpretation` | 別の文脈で読み直している |
| `contrast` | 立場が対照的である |

`confidence` は `high` / `medium` / `low`。
史料的裏づけが弱い、あるいは研究上決着していない関係には `medium` 以下を付ける。

> 迷ったら `conceptual_parallel` + `confidence: medium` にして、`note` に理由を書く。
> 「アリストテレスからギブソンまで一直線につながる」という単純化を防ぐのがこの仕組みの目的である。

### ルール2：概念には現在の位置づけを書く

| `evidenceStatus` | 意味 |
|---|---|
| `philosophical` | 実証というより、問いの立て方を与える概念 |
| `established` | 再現性のある実証的裏づけがある |
| `developing` | 有望だが決着していない研究領域 |
| `contested` | 広く知られているが、実証的支持をめぐって論争がある |

`established` 以外を選んだときは、`evidenceNote` に何が争点かを一行で書く。

とくに注意が必要な領域：社会的プライミング（パワーポーズ、顔面フィードバック）、
ミラーニューロンの機能的意義、ソマティック・マーカー仮説、自由エネルギー原理、腸脳相関。
いずれも「確立した知見」ではない。

### ルール3：出典と検証ステータスを書く

```yaml
sources:
  - type: primary          # primary / secondary / translation / reference / paper
    title: 知覚の現象学
    author: モーリス・メルロ＝ポンティ
    year: 1945
  - type: translation
    title: 知覚の現象学
    author: 中島盛夫訳
    publisher: 法政大学出版局
    year: 1974
reviewStatus: researched   # draft / researched / reviewed
lastReviewed: 2026-09-10   # reviewed のときは必須
```

| `reviewStatus` | 意味 |
|---|---|
| `draft` | 下書き。要約の域を出ていない |
| `researched` | 資料に基づいて書いたが、人手による最終確認は未了 |
| `reviewed` | **原典に当たって確認済み。** `lastReviewed` が必須 |

`reviewed` 以外のページには、その旨の注記が自動で表示される。
AIが生成した文章をそのまま `reviewed` にしない。

---

## 4. テンプレート

`templates/` をコピーして使う。

```bash
cp templates/person.md src/content/people/nishida-kitaro.md
```

---

## 5. AIに追加を頼むときの書き方

Claude Code / Codex に依頼する場合、次のように具体的に指定する。

```text
西田幾多郎について人物ページを追加して。

身体論として重要なのは「行為的直観」——知ることと行うことを
分けない立場。

既存の people スキーマに従うこと。
関連人物は merleau-ponty（conceptual_parallel, medium）、
yuasa-yasuo（direct_influence, high）、ichikawa-hiroshi（direct_influence, high）。

代表著作として『善の研究』を works にも追加。
concepts には shinjin-ichinyo を紐づける。

sources には一次資料と信頼できる二次資料を記録。
reviewStatus は researched にすること（reviewed にはしない）。

最後に npm run validate を通すこと。
```

依頼のポイント：

- **`reviewStatus` を明示する**。指定しないと `draft` になる
- **関係の `relation` と `confidence` を指定する**。判断を委ねない
- **`npm run validate` を通させる**。ID の打ち間違いはここで止まる

---

## 6. よくあるエラー

| エラー | 原因と対処 |
|---|---|
| `... は works に存在しません` | ID の打ち間違い、またはファイル未作成。ファイル名（拡張子なし）と一致させる |
| `steps[3] の kind が "person" なのに id がありません` | routes のステップに ID が抜けている。文字列だけ置きたいなら `kind: note` + `label:` を使う |
| `reviewStatus が reviewed なら lastReviewed が必要です` | 検証日を `YYYY-MM-DD` で書く |
| ビルドが frontmatter で落ちる | `src/content.config.ts` のスキーマ違反。エラーにフィールド名が出る |
| ⚠ `sources が空です` | 警告（ビルドは通る）。出典を1件以上書く |
| ⚠ `どこからも参照されていません` | 警告。人物や概念のページから繋ぐと見つけてもらいやすい |

---

## 7. 語彙を増やす

時代・分野・テーマ・関係の種類を追加したいときは2箇所を触る。

1. `src/content.config.ts` の `ERAS` / `FIELDS` / `THEMES` / `RELATION_TYPES` に値を足す
2. `src/lib/vocab.ts` に日本語ラベルを足す

これだけで、絞り込みフィルタにも通史ページにも自動で反映される。
