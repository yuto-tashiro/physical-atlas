---
title: ルート名
titleEn: English Name
summary: この系譜が何を辿るのかを1〜2文で。
order: 100

steps:
  - kind: person       # person / concept / work / event / note
    id: person-id
  - kind: concept
    id: concept-id
    relation: direct_influence   # 直前のステップとの関係（省略時は矢印のみ）
  - kind: person
    id: another-person
    relation: conceptual_parallel
    note: 直接の影響ではなく、似た問題を扱っているという注記。
  - kind: note         # 実体を持たない中間ラベル。id は不要
    label: organism–environment

reviewStatus: draft
---
