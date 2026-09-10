---
# ファイル名（拡張子なし）が ID・URL になる：src/content/people/spinoza.md → /people/spinoza
nameJa: 日本語名
nameEn: English Name
nameOriginal: 原語表記（任意）
birth: 1900          # 紀元前は負の数（例: -384）
death: 1980          # 存命なら省略
# lifespanLabel: 前427頃–前347   # 生没年を自由記述したいとき（birth/death より優先）
era: early-c20       # ancient / medieval / early-modern / c19 / early-c20 / late-c20 / contemporary
region: west         # west / east-asia / south-asia / islamicate
country: 国・地域
fields: [philosophy] # philosophy / medicine / physiology / psychology / neuroscience /
                     # cognitive-science / movement-science / sociology / biology
themes: [body, mind] # body / mind / perception / action / emotion / self / tool / environment / society / life
keywords: [keyword-1, keyword-2]

# 人物カードに出る一行。一人物・一メッセージ。
headline: この人物の身体論を一文で。

# 「30秒で分かる身体論」100〜200字。
summary: >
  何を問い、何をどう考えたのかを、100〜200字で。
  誇張せず、後世の解釈と本人の主張を混ぜない。

works: []            # 著作の ID（src/content/works/*.md）
concepts: []         # 概念の ID（src/content/concepts/*.md）

relatedPeople:
  - id: other-person
    relation: conceptual_parallel  # direct_influence / response_to / criticism /
                                   # conceptual_parallel / scientific_extension /
                                   # reinterpretation / contrast
    confidence: medium             # high / medium / low
    note: なぜその関係と言えるのか、あるいはどこまでは言えないのか。

modernLinks:
  - Person → 概念 → 現代の研究領域

featured: false      # true にするとトップページに出る

sources:
  - type: primary    # primary / secondary / translation / reference / paper
    title: 原典タイトル
    author: 著者
    year: 1900
  - type: reference
    title: Stanford Encyclopedia of Philosophy
    url: https://plato.stanford.edu/

reviewStatus: draft  # draft / researched / reviewed
# lastReviewed: 2026-09-10   # reviewed のときは必須
---

## 身体について何を考えたか

本文。具体的な議論・症例・実験に触れると読み応えが出る。

## なぜ重要なのか

思想史のなかでの位置づけ。

## 現代との接続

現代の研究とどう繋がるか。ここで誇張しないこと。
論争中の主張は「論争中である」と書く。
