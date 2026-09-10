import { getCollection, type CollectionEntry } from 'astro:content';
import { eraOrder } from './vocab';

export type Person = CollectionEntry<'people'>;
export type Concept = CollectionEntry<'concepts'>;
export type Work = CollectionEntry<'works'>;
export type Ev = CollectionEntry<'events'>;
export type Topic = CollectionEntry<'topics'>;
export type Route = CollectionEntry<'routes'>;

export type Atlas = Awaited<ReturnType<typeof loadAtlas>>;

const byYear = (a: { data: { birth?: number; year?: number } }, b: typeof a) => {
  const av = a.data.birth ?? a.data.year ?? 0;
  const bv = b.data.birth ?? b.data.year ?? 0;
  return av - bv;
};

let cache: Awaited<ReturnType<typeof build>> | null = null;

async function build() {
  const [people, concepts, works, events, topics, routes] = await Promise.all([
    getCollection('people'),
    getCollection('concepts'),
    getCollection('works'),
    getCollection('events'),
    getCollection('topics'),
    getCollection('routes'),
  ]);

  people.sort(byYear);
  works.sort((a, b) => a.data.year - b.data.year);
  events.sort((a, b) => a.data.year - b.data.year);
  concepts.sort((a, b) => (a.data.year ?? 9999) - (b.data.year ?? 9999));
  topics.sort((a, b) => a.data.order - b.data.order);
  routes.sort((a, b) => a.data.order - b.data.order);

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const conceptsById = new Map(concepts.map((c) => [c.id, c]));
  const worksById = new Map(works.map((w) => [w.id, w]));
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const topicsById = new Map(topics.map((t) => [t.id, t]));

  /* --- 逆リンク。片側に書けば両側に出る（編集の手間を半分にする） --- */

  /** その人物を「関連人物」として挙げている他の人物 */
  const inboundPeople = new Map<string, { from: Person; relation: string; note?: string; confidence: string }[]>();
  for (const p of people) {
    for (const link of p.data.relatedPeople) {
      if (!peopleById.has(link.id)) continue;
      const list = inboundPeople.get(link.id) ?? [];
      list.push({ from: p, relation: link.relation, note: link.note, confidence: link.confidence });
      inboundPeople.set(link.id, list);
    }
  }

  /** 概念 → その概念に関係する人物 */
  const conceptPeople = new Map<string, Person[]>();
  const addConceptPerson = (cid: string, p: Person) => {
    if (!conceptsById.has(cid)) return;
    const list = conceptPeople.get(cid) ?? [];
    if (!list.some((x) => x.id === p.id)) list.push(p);
    conceptPeople.set(cid, list);
  };
  for (const p of people) for (const cid of p.data.concepts) addConceptPerson(cid, p);
  for (const c of concepts) {
    for (const pid of [...c.data.originators, ...c.data.relatedPeople]) {
      const p = peopleById.get(pid);
      if (p) addConceptPerson(c.id, p);
    }
  }
  for (const [, list] of conceptPeople) list.sort(byYear);

  /** 人物 → その人物に結びつく概念（人物側・概念側どちらの記述でも拾う） */
  const personConcepts = new Map<string, Concept[]>();
  const addPersonConcept = (pid: string, c: Concept) => {
    if (!peopleById.has(pid)) return;
    const list = personConcepts.get(pid) ?? [];
    if (!list.some((x) => x.id === c.id)) list.push(c);
    personConcepts.set(pid, list);
  };
  for (const c of concepts) {
    for (const pid of [...c.data.originators, ...c.data.relatedPeople]) addPersonConcept(pid, c);
  }
  for (const p of people) {
    for (const cid of p.data.concepts) {
      const c = conceptsById.get(cid);
      if (c) addPersonConcept(p.id, c);
    }
  }

  /** 人物 → 著作（人物側 works と、著作側 author の両方から） */
  const personWorks = new Map<string, Work[]>();
  const addPersonWork = (pid: string, w: Work) => {
    if (!peopleById.has(pid)) return;
    const list = personWorks.get(pid) ?? [];
    if (!list.some((x) => x.id === w.id)) list.push(w);
    personWorks.set(pid, list);
  };
  for (const w of works) {
    addPersonWork(w.data.author, w);
    for (const co of w.data.coAuthors) addPersonWork(co, w);
  }
  for (const p of people) {
    for (const wid of p.data.works) {
      const w = worksById.get(wid);
      if (w) addPersonWork(p.id, w);
    }
  }
  for (const [, list] of personWorks) list.sort((a, b) => a.data.year - b.data.year);

  /** 概念 → 著作 / 出来事 */
  const conceptWorks = new Map<string, Work[]>();
  for (const w of works) {
    for (const cid of w.data.concepts) {
      if (!conceptsById.has(cid)) continue;
      const list = conceptWorks.get(cid) ?? [];
      list.push(w);
      conceptWorks.set(cid, list);
    }
  }
  const conceptEvents = new Map<string, Ev[]>();
  const personEvents = new Map<string, Ev[]>();
  for (const e of events) {
    for (const cid of e.data.concepts) {
      if (!conceptsById.has(cid)) continue;
      conceptEvents.set(cid, [...(conceptEvents.get(cid) ?? []), e]);
    }
    for (const pid of e.data.people) {
      if (!peopleById.has(pid)) continue;
      personEvents.set(pid, [...(personEvents.get(pid) ?? []), e]);
    }
  }

  /** 人物・概念 → それを扱うテーマ */
  const personTopics = new Map<string, Topic[]>();
  const conceptTopics = new Map<string, Topic[]>();
  for (const t of topics) {
    for (const pid of t.data.people) {
      if (peopleById.has(pid)) personTopics.set(pid, [...(personTopics.get(pid) ?? []), t]);
    }
    for (const cid of t.data.concepts) {
      if (conceptsById.has(cid)) conceptTopics.set(cid, [...(conceptTopics.get(cid) ?? []), t]);
    }
  }

  /** 人物・概念 → それが登場する思想ルート */
  const personRoutes = new Map<string, Route[]>();
  const conceptRoutes = new Map<string, Route[]>();
  for (const r of routes) {
    for (const s of r.data.steps) {
      if (!s.id) continue;
      if (s.kind === 'person' && peopleById.has(s.id)) {
        const l = personRoutes.get(s.id) ?? [];
        if (!l.includes(r)) l.push(r);
        personRoutes.set(s.id, l);
      }
      if (s.kind === 'concept' && conceptsById.has(s.id)) {
        const l = conceptRoutes.get(s.id) ?? [];
        if (!l.includes(r)) l.push(r);
        conceptRoutes.set(s.id, l);
      }
    }
  }

  const peopleByEra = eraOrder
    .map((era) => ({ era, people: people.filter((p) => p.data.era === era) }))
    .filter((g) => g.people.length > 0);

  return {
    people, concepts, works, events, topics, routes,
    peopleById, conceptsById, worksById, eventsById, topicsById,
    inboundPeople, conceptPeople, personConcepts, personWorks,
    conceptWorks, conceptEvents, personEvents,
    personTopics, conceptTopics, personRoutes, conceptRoutes,
    peopleByEra,
  };
}

export async function loadAtlas() {
  if (!cache) cache = await build();
  return cache;
}

/** ルートのステップを実体に解決する（存在しないidは label だけのノートとして扱う） */
export function resolveStep(atlas: Atlas, step: Route['data']['steps'][number]) {
  const { kind, id } = step;
  if (kind === 'person' && id) {
    const p = atlas.peopleById.get(id);
    if (p) return { href: `/people/${p.id}`, label: step.label ?? p.data.nameJa, kind };
  }
  if (kind === 'concept' && id) {
    const c = atlas.conceptsById.get(id);
    if (c) return { href: `/concepts/${c.id}`, label: step.label ?? c.data.titleJa, kind };
  }
  if (kind === 'work' && id) {
    const w = atlas.worksById.get(id);
    if (w) return { href: `/works/${w.id}`, label: step.label ?? w.data.titleJa, kind };
  }
  if (kind === 'event' && id) {
    const e = atlas.eventsById.get(id);
    if (e) return { href: `/history#event-${e.id}`, label: step.label ?? e.data.title, kind };
  }
  return { href: null, label: step.label ?? id ?? '', kind: 'note' as const };
}
