// engine.mjs
// Indonesia Quest core game engine. Pure logic: state machine, SRS, streaks, hearts, and mastery queue.

export const KEY = 'indonesia-quest-game-v1';
export const DAY = 86400000;
export const GOALS = { casual: 10, regular: 20, serious: 30, intense: 50 };
export const XP = {
  lesson: 10,
  replay: 5,
  perfect: 5,
  boss: 25,
  story: 15,
  review: 10,
  practice: 5
};
export const REVIEW_DAYS = [1, 3, 7, 14, 30];
export const FREEZE_COST = 80;
export const MAX_FREEZES = 2;
export const QUEST_GEMS = 10;
export const QUEST_BONUS = 20;
export const CROWN_GEMS = 15;
export const BADGE_GEMS = 25;
export const LESSON_SIZE = 8;
export const BOSS_SIZE = 10;
export const HEARTS = 3;

const SCORED = new Set(['choice', 'listen', 'build', 'input', 'match']);
export const isScored = it => SCORED.has(it?.type);

// Normalize text for forgiving comparison
export const normalize = s =>
  String(s ?? '')
    .normalize('NFKC')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase()
    .replace(/[.,!?;:"()\[\]…—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function accepts(item, value) {
  if (!item) return false;
  if (item.type === 'match') return value === 'matched';
  if (item.type === 'choice' || item.type === 'listen') return value === item.answer;
  return [item.answer, ...(item.alternatives || [])].some(a => normalize(a) === normalize(value));
}

export function localDay(time = Date.now()) {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const dayNum = s => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
};

const dayStr = n => {
  const d = new Date(n * DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

export function streakOf(days, frozen, now) {
  const active = new Set(days);
  const cover = new Set(frozen);
  let n = dayNum(localDay(now));
  let count = 0;
  if (!active.has(dayStr(n))) n--; // today is still open
  while (active.has(dayStr(n)) || cover.has(dayStr(n))) {
    if (active.has(dayStr(n))) count++;
    n--;
  }
  return count;
}

const hash = s => {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export function shuffle(list, seed = 'seed') {
  const arr = [...list];
  let x = hash(seed) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Course registry
export function createCourse(index) {
  const sections = new Map();
  const units = new Map();
  const nodes = new Map();
  const items = new Map();
  const files = new Set();
  const guides = new Map();
  const stories = new Map();
  const vocab = new Map();

  for (const s of index.sections || []) {
    sections.set(s.id, s);
    (s.units || []).forEach((u, ui) => {
      units.set(u.id, { ...u, section: s.id, order: ui });
      (u.nodes || []).forEach((n, ni) => {
        nodes.set(n.id, { ...n, unit: u.id, section: s.id, order: ni, pool: null });
      });
    });
  }

  for (const st of index.stories || []) {
    stories.set(st.id, { ...st, steps: null });
  }

  const course = {
    index,
    sections,
    units,
    nodes,
    items,
    guides,
    stories,
    vocab,
    section: id => sections.get(id),
    loaded: id => files.has(id),
    item: id => items.get(id),
    register(file) {
      if (file.stories) {
        for (const [sid, st] of Object.entries(file.stories)) {
          stories.set(sid, { ...stories.get(sid), ...st });
          for (const step of st.steps || []) {
            items.set(step.id, { ...step, f: 'stories', story: sid });
          }
        }
        files.add('stories');
        return;
      }
      if (file.sets) {
        for (const set of file.sets) {
          vocab.set(set.id, set);
        }
        files.add('vocab');
        return;
      }
      for (const [id, it] of Object.entries(file.items || {})) {
        items.set(id, { ...it, f: file.id });
      }
      for (const [uid, u] of Object.entries(file.units || {})) {
        if (u.guide) guides.set(uid, u.guide);
        for (const [nid, pool] of Object.entries(u.nodes || {})) {
          if (nodes.has(nid)) nodes.get(nid).pool = pool;
        }
      }
      files.add(file.id);
    },
    path(sectionId) {
      const s = sections.get(sectionId);
      if (!s) return [];
      return (s.units || []).flatMap(u => (u.nodes || []).map(n => n.id));
    },
    unitOfNode: id => nodes.get(id)?.unit
  };

  return course;
}

// Daily Quests Definition
export const QUEST_POOL = [
  { id: 'xp', label: '獲得每日經驗值', icon: '⚡', target: goal => goal },
  { id: 'lessons', label: '完成 2 次闖關練習', icon: '📚', target: () => 2 },
  { id: 'listen', label: '完成 3 題印尼語聽力', icon: '👂', target: () => 3 },
  { id: 'combo', label: '達成 5 連對不中斷', icon: '🔥', target: () => 5 }
];

export const BADGES = [
  { id: 'first-step', title: '印尼啟程', desc: '完成第一堂印尼語闖關練習', icon: '🌱', test: s => s.stats.lessons >= 1 },
  { id: 'streak-3', title: '小試身手', desc: '連續學習達到 3 天', icon: '🔥', test: (s, ctx) => ctx.streak >= 3 },
  { id: 'streak-7', title: 'Menyala Abangku 🔥', desc: '連續學習達到 7 天，雅加達最炸火焰', icon: '⚡', test: (s, ctx) => ctx.streak >= 7 },
  { id: 'perfect-master', title: '完美通關', desc: '獲得 3 次零失誤完美過關', icon: '⭐', test: s => s.stats.perfect >= 3 },
  { id: 'crown-collector', title: '金色王冠', desc: '成功通過第一個單元魔王挑戰獲得金冠', icon: '👑', test: s => Object.keys(s.crowns || {}).length >= 1 },
  { id: 'vocab-explorer', title: '萬字探索者', desc: '學習累積超過 30 個單字與句型', icon: '📖', test: s => Object.keys(s.items || {}).length >= 30 }
];

const fresh = now => ({
  schema: 1,
  created: now,
  profile: {
    goal: 'regular',
    sound: true,
    autoplay: true,
    rate: 0.95
  },
  nodes: {},
  crowns: {},
  review: {},
  items: {},
  mistakes: [],
  xp: { total: 0, days: {} },
  days: [],
  frozen: [],
  freezes: 1, // Start with 1 free freeze card!
  gems: 50,  // Start with 50 welcome gems!
  quests: null,
  achievements: {},
  stories: {},
  stats: {
    lessons: 0,
    perfect: 0,
    combo: 0,
    listen: 0,
    remediated: 0
  },
  session: null
});

export function createGame({ storage, now = () => Date.now(), course }) {
  let state = fresh(now());
  let warning = '';
  let pending = [];

  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...fresh(now()), ...parsed };
    }
  } catch {
    warning = '無法讀取本機紀錄，已開啟新進度。';
  }

  function save() {
    try {
      if (storage) {
        storage.setItem(KEY, JSON.stringify(state));
      }
    } catch {
      warning = '無法儲存：請確認瀏覽器支援 LocalStorage。';
    }
  }

  const today = () => localDay(now());
  const goalXp = () => GOALS[state.profile?.goal] || GOALS.regular;

  function applyFreezes() {
    const last = state.days.at(-1);
    if (!last) return false;
    let changed = false;
    const yesterday = dayNum(today()) - 1;
    for (let n = dayNum(last) + 1; n <= yesterday; n++) {
      const d = dayStr(n);
      if (state.frozen.includes(d)) continue;
      if (state.freezes > 0) {
        state.freezes--;
        state.frozen.push(d);
        changed = true;
      } else break;
    }
    if (changed) state.frozen.sort();
    return changed;
  }

  function ensureQuests() {
    const day = today();
    if (state.quests?.day === day) return;
    const picks = shuffle(QUEST_POOL.slice(1), 'quest' + day).slice(0, 2);
    state.quests = {
      day,
      bonus: false,
      list: [QUEST_POOL[0], ...picks].map(q => ({
        id: q.id,
        target: q.target(goalXp()),
        n: 0,
        done: false
      }))
    };
  }

  function bumpQuest(id, by = 1) {
    ensureQuests();
    const q = state.quests.list.find(x => x.id === id);
    if (!q || q.done) return;
    q.n = Math.min(q.target, q.n + by);
    if (q.n >= q.target) {
      q.done = true;
      state.gems += QUEST_GEMS;
      pending.push({ type: 'quest', id });
    }
    if (!state.quests.bonus && state.quests.list.every(x => x.done)) {
      state.quests.bonus = true;
      state.gems += QUEST_BONUS;
      pending.push({ type: 'chest' });
    }
  }

  const streak = () => streakOf(state.days, state.frozen, now());
  const nodeDone = id => !!(state.nodes[id]?.n);

  function sectionUnlocked(secId) {
    const s = course.section(secId);
    if (!s) return false;
    if (s.no <= 2) return true; // first 2 sections unlocked by default
    const prevSec = course.index.sections.find(x => x.no === s.no - 1);
    if (!prevSec) return true;
    const prevNodes = course.path(prevSec.id).filter(id => course.nodes.get(id)?.kind !== 'boss');
    return prevNodes.length > 0 && prevNodes.some(id => nodeDone(id));
  }

  function nodeStatus(nodeId) {
    const n = course.nodes.get(nodeId);
    if (!n) return 'locked';
    const done = state.nodes[nodeId];
    if (n.kind === 'boss') {
      if (state.crowns[n.unit]) return 'crowned';
      const u = course.units.get(n.unit);
      if (!u) return 'available';
      const unitLessons = (u.nodes || []).filter(x => x.kind !== 'boss');
      return unitLessons.every(x => nodeDone(x.id)) ? 'available' : (done?.n ? 'done' : 'locked');
    }
    if (done?.n) return 'done';
    if (!sectionUnlocked(n.section)) return 'locked';
    const path = course.path(n.section).filter(id => course.nodes.get(id)?.kind !== 'boss');
    const idx = path.indexOf(nodeId);
    return idx <= 0 || nodeDone(path[idx - 1]) ? 'available' : 'locked';
  }

  function checkBadges() {
    const ctx = { streak: streak() };
    for (const b of BADGES) {
      if (!state.achievements[b.id] && b.test(state, ctx)) {
        state.achievements[b.id] = now();
        state.gems += BADGE_GEMS;
        pending.push({ type: 'badge', id: b.id });
      }
    }
  }

  applyFreezes();
  ensureQuests();

  // Session composition
  function composeLesson(nodeId) {
    const n = course.nodes.get(nodeId);
    if (!n?.pool || !n.pool.length) return null;
    const pool = [...n.pool];
    const isBoss = n.kind === 'boss';
    const count = isBoss ? BOSS_SIZE : Math.min(LESSON_SIZE, pool.length);
    const chosen = shuffle(pool, nodeId + Date.now()).slice(0, count);
    return {
      nodeId,
      mode: isBoss ? 'boss' : 'lesson',
      queue: chosen,
      originalCount: chosen.length,
      current: 0,
      hearts: isBoss ? HEARTS : null,
      maxHearts: isBoss ? HEARTS : null,
      mistakes: new Set(),
      remediated: new Set(),
      streak: 0,
      xpEarned: 0
    };
  }

  function composePractice(type = 'mistakes') {
    let pool = [];
    if (type === 'mistakes') {
      pool = [...state.mistakes];
    }
    if (!pool.length) {
      // Fallback to random learned items
      pool = Object.keys(state.items);
    }
    if (!pool.length) {
      // Fallback to S1 items
      const s1 = course.section('s1');
      const firstNode = s1?.units?.[0]?.nodes?.[0];
      if (firstNode?.pool) pool = [...firstNode.pool];
    }
    const chosen = shuffle(pool, 'practice' + Date.now()).slice(0, 8);
    return {
      mode: 'practice',
      queue: chosen,
      originalCount: chosen.length,
      current: 0,
      hearts: null,
      mistakes: new Set(),
      remediated: new Set(),
      streak: 0,
      xpEarned: 0
    };
  }

  function composeStory(storyId) {
    const st = course.stories.get(storyId);
    if (!st || !st.steps) return null;
    return {
      mode: 'story',
      storyId,
      queue: st.steps.map(s => s.id),
      originalCount: st.steps.length,
      current: 0,
      hearts: null,
      mistakes: new Set(),
      remediated: new Set(),
      streak: 0,
      xpEarned: 0
    };
  }

  const game = {
    state,
    streak,
    today,
    goalXp,
    nodeStatus,
    sectionUnlocked,
    drainPending: () => {
      const p = pending;
      pending = [];
      return p;
    },
    save,

    // Buy Shop Items
    buy(item) {
      if (item === 'freeze') {
        if (state.gems >= FREEZE_COST && state.freezes < MAX_FREEZES) {
          state.gems -= FREEZE_COST;
          state.freezes++;
          save();
          return true;
        }
      }
      return false;
    },

    // Session lifecycle
    startLesson(nodeId) {
      state.session = composeLesson(nodeId);
      save();
      return state.session;
    },
    startPractice(type) {
      state.session = composePractice(type);
      save();
      return state.session;
    },
    startStory(storyId) {
      state.session = composeStory(storyId);
      save();
      return state.session;
    },
    currentSession() {
      return state.session;
    },
    currentItem() {
      const s = state.session;
      if (!s || s.current >= s.queue.length) return null;
      return course.item(s.queue[s.current]);
    },

    // Submit answer with "使其學會" mastery queue
    submit(value) {
      const s = state.session;
      if (!s) return null;
      const itemId = s.queue[s.current];
      const item = course.item(itemId);
      if (!item) return null;

      const ok = accepts(item, value);
      const isRemediating = s.mistakes.has(itemId);

      // Record to global item statistics
      const rec = (state.items[itemId] ||= { s: 0, c: 0, m: 0, at: 0 });
      rec.s++;
      rec.at = now();

      if (ok) {
        rec.c++;
        s.streak++;
        bumpQuest('combo', 1);
        if (item.type === 'listen') bumpQuest('listen', 1);

        if (isRemediating) {
          s.remediated.add(itemId);
          state.stats.remediated++;
        }

        // Remove from mistake notebook if solved successfully
        const mIdx = state.mistakes.indexOf(itemId);
        if (mIdx >= 0) state.mistakes.splice(mIdx, 1);

        return {
          correct: true,
          item,
          remediated: isRemediating,
          streak: s.streak
        };
      } else {
        rec.m++;
        s.streak = 0;
        s.mistakes.add(itemId);

        // Add to permanent mistake notebook
        if (!state.mistakes.includes(itemId)) {
          state.mistakes.push(itemId);
        }

        if (s.hearts !== null) {
          s.hearts = Math.max(0, s.hearts - 1);
        }

        // === MASTERY LOOP: ENQUEUE MISSED ITEM TO THE END ===
        s.queue.push(itemId);

        return {
          correct: false,
          item,
          hearts: s.hearts,
          heartsLeft: s.hearts !== null ? s.hearts : null
        };
      }
    },

    next() {
      const s = state.session;
      if (!s) return null;
      s.current++;
      if (s.current >= s.queue.length) {
        return this.finishSession();
      }
      return { done: false, item: this.currentItem() };
    },

    finishSession() {
      const s = state.session;
      if (!s) return null;

      const t = today();
      if (!state.days.includes(t)) {
        state.days.push(t);
        state.days.sort();
      }

      let xpEarned = s.mode === 'boss' ? XP.boss : s.mode === 'story' ? XP.story : XP.lesson;
      if (s.mistakes.size === 0) {
        xpEarned += XP.perfect;
        state.stats.perfect++;
      }

      state.xp.total += xpEarned;
      state.xp.days[t] = (state.xp.days[t] || 0) + xpEarned;
      state.stats.lessons++;

      bumpQuest('xp', xpEarned);
      bumpQuest('lessons', 1);

      // Node and Crown updates
      if (s.nodeId) {
        const nodeRec = (state.nodes[s.nodeId] ||= { n: 0, at: 0, best: 0 });
        nodeRec.n++;
        nodeRec.at = now();
        const n = course.nodes.get(s.nodeId);
        if (n?.kind === 'boss') {
          state.crowns[n.unit] = now();
          state.gems += CROWN_GEMS;
        }
      }

      if (s.storyId) {
        state.stories[s.storyId] = now();
      }

      checkBadges();
      save();

      const summary = {
        done: true,
        xpEarned,
        mistakesCount: s.mistakes.size,
        remediatedCount: s.remediated.size,
        totalItems: s.originalCount,
        accuracy: Math.round(((s.originalCount - s.mistakes.size) / Math.max(1, s.originalCount)) * 100),
        streak: streak()
      };

      state.session = null;
      save();
      return summary;
    },

    cancelSession() {
      state.session = null;
      save();
    }
  };

  return game;
}
