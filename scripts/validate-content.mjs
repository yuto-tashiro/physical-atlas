#!/usr/bin/env node
/**
 * コンテンツの相互参照を検査する。
 *
 *   npm run validate
 *
 * frontmatter の「形」は Astro の Content Collections（src/content.config.ts）が
 * ビルド時に検証する。このスクリプトが見るのは、そこでは検出できない
 * 「存在しない id を参照していないか」という参照整合性のほう。
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parse } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const CONTENT = join(ROOT, 'src/content');

const COLLECTIONS = ['people', 'concepts', 'works', 'events', 'topics', 'routes'];

/** どのフィールドが、どのコレクションの id を指しているか */
const REFS = {
  people: {
    works: 'works',
    concepts: 'concepts',
    'relatedPeople[].id': 'people',
  },
  concepts: {
    originators: 'people',
    relatedPeople: 'people',
    relatedConcepts: 'concepts',
    works: 'works',
  },
  works: {
    author: 'people',
    coAuthors: 'people',
    concepts: 'concepts',
  },
  events: {
    people: 'people',
    concepts: 'concepts',
    works: 'works',
  },
  topics: {
    people: 'people',
    concepts: 'concepts',
  },
};

const STEP_KIND_TO_COLLECTION = {
  person: 'people',
  concept: 'concepts',
  work: 'works',
  event: 'events',
};

async function loadCollection(name) {
  const dir = join(CONTENT, name);
  let files;
  try {
    files = (await readdir(dir)).filter((f) => /\.(md|mdx)$/.test(f));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (file) => {
      const path = join(dir, file);
      const raw = await readFile(path, 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) {
        return { id: file.replace(/\.mdx?$/, ''), path, data: null, error: 'frontmatter が見つかりません' };
      }
      try {
        return { id: file.replace(/\.mdx?$/, ''), path, data: parse(m[1]) ?? {} };
      } catch (e) {
        return { id: file.replace(/\.mdx?$/, ''), path, data: null, error: `YAML の解析に失敗: ${e.message}` };
      }
    }),
  );
}

const toArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

const errors = [];
const warnings = [];

const store = {};
for (const name of COLLECTIONS) store[name] = await loadCollection(name);

const ids = Object.fromEntries(
  COLLECTIONS.map((name) => [name, new Set(store[name].map((e) => e.id))]),
);

const rel = (p) => relative(ROOT, p);

/** 近い id を提案する（打ち間違い対策） */
function suggest(value, pool) {
  const v = String(value).toLowerCase();
  const hits = [...pool].filter((id) => id.includes(v) || v.includes(id));
  return hits.length > 0 ? `　もしかして: ${hits.slice(0, 3).join(', ')}` : '';
}

for (const name of COLLECTIONS) {
  for (const entry of store[name]) {
    if (entry.error) {
      errors.push(`${rel(entry.path)}: ${entry.error}`);
      continue;
    }
    const d = entry.data;

    // --- 参照整合性 ---
    for (const [field, target] of Object.entries(REFS[name] ?? {})) {
      if (field.endsWith('[].id')) {
        const key = field.slice(0, -5);
        for (const item of toArray(d[key])) {
          const value = item?.id;
          if (value && !ids[target].has(value)) {
            errors.push(`${rel(entry.path)}: ${key}[].id "${value}" は ${target} に存在しません。${suggest(value, ids[target])}`);
          }
        }
      } else {
        for (const value of toArray(d[field])) {
          if (value && !ids[target].has(value)) {
            errors.push(`${rel(entry.path)}: ${field} "${value}" は ${target} に存在しません。${suggest(value, ids[target])}`);
          }
        }
      }
    }

    if (name === 'routes') {
      for (const [i, step] of toArray(d.steps).entries()) {
        const target = STEP_KIND_TO_COLLECTION[step?.kind];
        if (!target) continue; // kind: note は id を持たなくてよい
        if (!step.id) {
          errors.push(`${rel(entry.path)}: steps[${i}] の kind が "${step.kind}" なのに id がありません`);
        } else if (!ids[target].has(step.id)) {
          errors.push(`${rel(entry.path)}: steps[${i}].id "${step.id}" は ${target} に存在しません。${suggest(step.id, ids[target])}`);
        }
      }
    }

    // --- 編集方針の検査 ---
    if (d.reviewStatus === 'reviewed' && !d.lastReviewed) {
      errors.push(`${rel(entry.path)}: reviewStatus が reviewed なら lastReviewed（検証日）が必要です`);
    }
    if (name !== 'routes' && toArray(d.sources).length === 0) {
      warnings.push(`${rel(entry.path)}: sources が空です。出典を1件以上書いてください`);
    }
    if (name === 'people') {
      const summary = String(d.summary ?? '');
      if (summary.length > 260) {
        warnings.push(`${rel(entry.path)}: summary が長すぎます（${summary.length}字）。100〜200字が目安です`);
      }
    }
  }
}

/* --- 孤立チェック：どこからも参照されていない概念・著作を知らせる --- */
const referenced = { concepts: new Set(), works: new Set(), people: new Set() };
for (const name of COLLECTIONS) {
  for (const entry of store[name]) {
    const d = entry.data;
    if (!d) continue;
    for (const [field, target] of Object.entries(REFS[name] ?? {})) {
      const key = field.endsWith('[].id') ? field.slice(0, -5) : field;
      for (const item of toArray(d[key])) {
        const value = field.endsWith('[].id') ? item?.id : item;
        if (value && referenced[target]) referenced[target].add(value);
      }
    }
    for (const step of toArray(d.steps)) {
      const target = STEP_KIND_TO_COLLECTION[step?.kind];
      if (target && step.id && referenced[target]) referenced[target].add(step.id);
    }
  }
}
for (const target of ['concepts', 'works']) {
  for (const id of ids[target]) {
    if (!referenced[target].has(id)) {
      warnings.push(`src/content/${target}/${id}.md: どこからも参照されていません（人物や概念のページから繋げると見つけてもらいやすくなります）`);
    }
  }
}

/* --- 出力 --- */
const total = COLLECTIONS.reduce((n, c) => n + store[c].length, 0);
console.log(`\n検査対象: ${total}件`);
for (const c of COLLECTIONS) console.log(`  ${c.padEnd(10)} ${store[c].length}`);

if (warnings.length > 0) {
  console.log(`\n警告 ${warnings.length}件`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length > 0) {
  console.error(`\nエラー ${errors.length}件`);
  for (const e of errors) console.error(`  ✕ ${e}`);
  console.error('');
  process.exit(1);
}

console.log('\n✓ 参照整合性に問題はありません\n');
