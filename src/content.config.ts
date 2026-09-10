import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------ *
 * 共通の語彙（ここを増やせば、そのまま各ページの絞り込みにも反映される）
 * ------------------------------------------------------------------ */

export const ERAS = [
  'ancient',        // 古代
  'medieval',       // 中世〜ルネサンス
  'early-modern',   // 16〜18世紀
  'c19',            // 19世紀
  'early-c20',      // 20世紀前半
  'late-c20',       // 20世紀後半
  'contemporary',   // 現代（1990s〜）
] as const;

export const FIELDS = [
  'philosophy',
  'medicine',
  'physiology',
  'psychology',
  'neuroscience',
  'cognitive-science',
  'movement-science',
  'sociology',
  'biology',
] as const;

export const THEMES = [
  'body',
  'mind',
  'perception',
  'action',
  'emotion',
  'self',
  'tool',
  'environment',
  'society',
  'life',
] as const;

export const REGIONS = ['west', 'east-asia', 'south-asia', 'islamicate'] as const;

/**
 * 思想同士の関係。単純な「影響関係」に潰さないための語彙。
 * 「歴史的に直接影響した」のか「後から見ると似た問題を扱っている」のかを混同しない。
 */
export const RELATION_TYPES = [
  'direct_influence',    // 直接影響
  'response_to',         // 応答・継承
  'criticism',           // 批判
  'conceptual_parallel', // 概念的並行（直接影響ではない）
  'scientific_extension',// 科学的展開
  'reinterpretation',    // 再解釈
  'contrast',            // 対照
] as const;

export const REVIEW_STATUS = ['draft', 'researched', 'reviewed'] as const;

/* ------------------------------------------------------------------ *
 * 部品スキーマ
 * ------------------------------------------------------------------ */

const source = z.object({
  type: z.enum(['primary', 'secondary', 'translation', 'reference', 'paper']),
  title: z.string(),
  author: z.string().optional(),
  year: z.union([z.number(), z.string()]).optional(),
  publisher: z.string().optional(),
  url: z.url().optional(),
  note: z.string().optional(),
});

const personLink = z.object({
  id: z.string(),
  relation: z.enum(RELATION_TYPES),
  confidence: z.enum(['high', 'medium', 'low']).default('medium'),
  note: z.string().optional(),
});

/** 全コンテンツ共通の来歴メタデータ。AI生成をそのまま事実として出さないための装置。 */
const provenance = {
  sources: z.array(source).default([]),
  reviewStatus: z.enum(REVIEW_STATUS).default('draft'),
  lastReviewed: z.string().optional(),
};

/* ------------------------------------------------------------------ *
 * コレクション
 * ------------------------------------------------------------------ */

const people = defineCollection({
  loader: glob({ base: './src/content/people', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    nameJa: z.string(),
    nameEn: z.string(),
    nameOriginal: z.string().optional(),
    /** 生年。紀元前は負の数（例: プラトン -427） */
    birth: z.number().optional(),
    death: z.number().optional(),
    /** 生没年を自由記述したいとき（「前2〜前1世紀」など） */
    lifespanLabel: z.string().optional(),
    era: z.enum(ERAS),
    region: z.enum(REGIONS).default('west'),
    country: z.string().optional(),
    fields: z.array(z.enum(FIELDS)).min(1),
    themes: z.array(z.enum(THEMES)).default([]),
    keywords: z.array(z.string()).default([]),
    /** 「30秒で分かる身体論」100〜200字 */
    summary: z.string(),
    /** 人物カードの一行メッセージ（一人物・一メッセージ） */
    headline: z.string(),
    works: z.array(z.string()).default([]),
    concepts: z.array(z.string()).default([]),
    relatedPeople: z.array(personLink).default([]),
    /** 現代科学との接続を一行で（例: "William James → Interoception"） */
    modernLinks: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    ...provenance,
  }),
});

const concepts = defineCollection({
  loader: glob({ base: './src/content/concepts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    titleJa: z.string(),
    titleEn: z.string(),
    titleOriginal: z.string().optional(),
    /** 「一言でいうと」80〜150字 */
    oneLiner: z.string(),
    fields: z.array(z.enum(FIELDS)).default([]),
    themes: z.array(z.enum(THEMES)).default([]),
    /** 概念が立ち上がったおおよその年（タイムライン用） */
    year: z.number().optional(),
    yearLabel: z.string().optional(),
    /** 最初に提唱・発展させた人物 */
    originators: z.array(z.string()).default([]),
    relatedPeople: z.array(z.string()).default([]),
    relatedConcepts: z.array(z.string()).default([]),
    works: z.array(z.string()).default([]),
    /** 現代研究における確からしさ。誇大宣伝と確立した知見を混同しないため。 */
    evidenceStatus: z
      .enum(['established', 'developing', 'contested', 'philosophical'])
      .default('philosophical'),
    evidenceNote: z.string().optional(),
    featured: z.boolean().default(false),
    ...provenance,
  }),
});

const works = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    titleJa: z.string(),
    titleEn: z.string().optional(),
    titleOriginal: z.string().optional(),
    author: z.string(),
    coAuthors: z.array(z.string()).default([]),
    year: z.number(),
    yearLabel: z.string().optional(),
    fields: z.array(z.enum(FIELDS)).default([]),
    summary: z.string(),
    /** 身体論として重要な箇所 */
    keyPassages: z.array(z.string()).default([]),
    /** 読むべき章 */
    readingGuide: z.array(z.string()).default([]),
    concepts: z.array(z.string()).default([]),
    translations: z
      .array(
        z.object({
          title: z.string(),
          translator: z.string().optional(),
          publisher: z.string().optional(),
          year: z.union([z.number(), z.string()]).optional(),
          note: z.string().optional(),
        }),
      )
      .default([]),
    ...provenance,
  }),
});

/** 科学的発見・実験。思想史と同じタイムライン上に並べるための独立コレクション。 */
const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    year: z.number(),
    yearLabel: z.string().optional(),
    era: z.enum(ERAS),
    kind: z.enum(['discovery', 'experiment', 'publication', 'method', 'controversy']),
    summary: z.string(),
    people: z.array(z.string()).default([]),
    concepts: z.array(z.string()).default([]),
    works: z.array(z.string()).default([]),
    ...provenance,
  }),
});

const topics = defineCollection({
  loader: glob({ base: './src/content/topics', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string(),
    question: z.string(),
    summary: z.string(),
    people: z.array(z.string()).default([]),
    concepts: z.array(z.string()).default([]),
    order: z.number().default(100),
    ...provenance,
  }),
});

/** 主要な思想ルート（Home / Connections で系譜として表示する） */
const routes = defineCollection({
  loader: glob({ base: './src/content/routes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string(),
    summary: z.string(),
    order: z.number().default(100),
    steps: z
      .array(
        z.object({
          kind: z.enum(['person', 'concept', 'work', 'event', 'note']),
          id: z.string().optional(),
          label: z.string().optional(),
          note: z.string().optional(),
          /** 直前のステップとの関係 */
          relation: z.enum(RELATION_TYPES).optional(),
        }),
      )
      .min(2),
    ...provenance,
  }),
});

export const collections = { people, concepts, works, events, topics, routes };
