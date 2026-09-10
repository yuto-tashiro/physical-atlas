/** 表示用ラベル。語彙を増やしたらここに日本語名を足す。 */

export const eraLabel: Record<string, string> = {
  ancient: '古代',
  medieval: '中世〜ルネサンス',
  'early-modern': '16〜18世紀',
  c19: '19世紀',
  'early-c20': '20世紀前半',
  'late-c20': '20世紀後半',
  contemporary: '現代',
};

export const eraSubtitle: Record<string, string> = {
  ancient: '魂・生命・身体',
  medieval: '観察される身体',
  'early-modern': '機械としての身体と心身問題',
  c19: '生きた身体と、感じる身体の科学',
  'early-c20': '身体図式と現象学',
  'late-c20': '環境・社会・行為のなかの身体',
  contemporary: '内側から感じ、予測する身体',
};

export const eraOrder = [
  'ancient',
  'medieval',
  'early-modern',
  'c19',
  'early-c20',
  'late-c20',
  'contemporary',
];

export const fieldLabel: Record<string, string> = {
  philosophy: '哲学',
  medicine: '医学',
  physiology: '生理学',
  psychology: '心理学',
  neuroscience: '神経科学',
  'cognitive-science': '認知科学',
  'movement-science': '運動科学',
  sociology: '社会学・人類学',
  biology: '生物学',
};

export const themeLabel: Record<string, string> = {
  body: '身体',
  mind: '心',
  perception: '知覚',
  action: '行為',
  emotion: '感情',
  self: '自己',
  tool: '道具',
  environment: '環境',
  society: '社会',
  life: '生命',
};

export const regionLabel: Record<string, string> = {
  west: '西洋',
  'east-asia': '東アジア',
  'south-asia': '南アジア',
  islamicate: 'イスラーム圏',
};

export const relationLabel: Record<string, string> = {
  direct_influence: '直接影響',
  response_to: '応答・継承',
  criticism: '批判',
  conceptual_parallel: '概念的並行',
  scientific_extension: '科学的展開',
  reinterpretation: '再解釈',
  contrast: '対照',
};

/** 関係の向きの説明。矢印の意味を取り違えないように併記する。 */
export const relationHint: Record<string, string> = {
  direct_influence: '歴史的に直接読まれ、受け継がれた',
  response_to: 'この人物の問題設定に応答している',
  criticism: '批判的に取り上げている',
  conceptual_parallel: '直接の影響関係ではなく、似た問題を扱っている',
  scientific_extension: '哲学的な問いを実証科学へ展開した',
  reinterpretation: '別の文脈で読み直している',
  contrast: '立場が対照的である',
};

export const reviewLabel: Record<string, string> = {
  draft: '下書き',
  researched: '調査済み・未検証',
  reviewed: '検証済み',
};

export const evidenceLabel: Record<string, string> = {
  established: '確立した知見',
  developing: '進展中',
  contested: '論争中',
  philosophical: '哲学的概念',
};

export const evidenceHint: Record<string, string> = {
  established: '再現性のある実証的裏づけがある',
  developing: '有望だが決着していない研究領域',
  contested: '広く知られているが、実証的支持をめぐって論争がある',
  philosophical: '実証というより、問いの立て方を与える概念',
};

export const kindLabel: Record<string, string> = {
  discovery: '発見',
  experiment: '実験',
  publication: '刊行',
  method: '方法',
  controversy: '論争',
};

/** 生没年の表示（負の数は紀元前） */
export function formatYear(y?: number): string {
  if (y === undefined) return '';
  return y < 0 ? `前${Math.abs(y)}` : String(y);
}

export function formatLifespan(
  birth?: number,
  death?: number,
  label?: string,
): string {
  if (label) return label;
  if (birth === undefined && death === undefined) return '';
  const b = formatYear(birth);
  const d = death === undefined ? '' : formatYear(death);
  if (birth !== undefined && death === undefined) return `${b}–`;
  return `${b}–${d}`;
}
