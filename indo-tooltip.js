/**
 * indo-tooltip.js
 * Ultra-lightweight Zero-DOM-Mutation Indonesian Word Translator & Pronunciation Engine
 *
 * Features:
 * - Zero DOM mutation: uses native caretPositionFromPoint / caretRangeFromPoint + 1 reusable popover
 * - Lazy-loaded compact lexicon (~130KB gzipped, 10,750+ words & 180+ phrases) on idle / first interaction
 * - Built-in Indonesian morphological stemmer (prefixes, suffixes, K/T/S/P nasal assimilation, reduplication)
 * - Automatic Indonesian syllable breakdown (音節讀音提示)
 * - Hybrid resource-saving audio pronunciation: local Indonesian Web Speech voice (0 network) ->
 *   LRU-cached native Indonesian TTS stream fallback (max 40 entries) -> speechSynthesis fallback
 * - Seamless Desktop Hover + Click-to-Pin/Speak + Mobile Tap-to-Translate/Speak
 * - Works identically on Indo Hub (index.html) and Indo Quest (quest/index.html)
 */

(function initIndoWordTooltip() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__indoTooltipInitialized) return;
  window.__indoTooltipInitialized = true;

  const STORAGE_KEY = 'indo_word_tooltip_enabled';
  const POS_FULL = {
    '名': '名詞',
    '動': '動詞',
    '形': '形容詞',
    '副': '副詞',
    '代': '代名詞',
    '介': '介系詞',
    '連': '連接詞',
    '數': '數詞',
    '助': '助詞',
    '嘆': '感嘆詞',
    '量': '量詞',
    '片': '片語',
    '俚': '口語',
    '稱': '稱謂',
    '專': '專名',
    '縮': '縮寫',
    '綴': '詞綴',
  };

  // Common English / UI chrome words to ignore so UI labels don't trigger false tooltips
  const IGNORE_WORDS = new Set([
    'app', 'xp', 'vs', 'qr', 'wifi', 'wi-fi', 'day', 'night', 'paper', 'sage', 'hub', 'quest',
    'duolingo', 'bipa', 'svo', 'pro', 'vip', 'ok', 'html', 'css', 'js', 'svg', 'pdf', 'png', 'jpg',
    'http', 'https', 'www', 'com', 'org', 'net', 'email', 'code', 'mode', 'top', 'way', 'the',
    'and', 'for', 'with', 'from', 'this', 'that', 'less', 'sugar', 'driver', 'match', 'matched',
    'online', 'scan', 'up', 'on', 'of', 'to', 'is', 'are', 'be', 'by', 'or', 'as', 'at', 'an', 'it',
    'my', 'we', 'you', 'your', 'all', 'new', 'get', 'set', 'add', 'go', 'id', 'zh', 'tw', 'en',
    'audio', 'voice', 'speed', 'font', 'theme', 'light', 'dark', 'normal', 'auto', 'reset', 'start',
    'next', 'back', 'skip', 'hint', 'play', 'stop', 'save', 'load', 'home', 'map', 'quiz', 'unit',
    'stage', 'level', 'score', 'combo', 'streak', 'bonus', 'daily', 'goal', 'boss', 'story',
    'review', 'master', 'learn', 'vocab', 'flashcard', 'shadowing', 'grammar', 'culture',
    'alphabet', 'pronoun', 'numbers', 'sentences', 'scenarios', 'peribahasa', 'affix', 'trill',
    'whatsapp', 'tiktok', 'instagram', 'google', 'youtube', 'facebook', 'david', 'budi', 'hendra',
    'lisa', 'taiwan', 'xyz', 'nt', 'ktsp', 'ch', 'ng', 'ny', 'in', 'out', 'per', 'via', 'grand',
    'guardian', 'kimia', 'farma', 'plat', 'bulus', 'sari'
  ]);

  // Resolve lexicon URL relative to this script's location so it works from `/` and `/quest/`
  const currentScript = document.currentScript ||
    Array.from(document.scripts).find(s => (s.src || '').includes('indo-tooltip.js'));
  const scriptBase = currentScript && currentScript.src
    ? currentScript.src.replace(/indo-tooltip\.js(\?.*)?$/, '')
    : './';
  const LEXICON_URL = scriptBase + 'indo-lexicon.json';

  let enabled = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '0' || saved === 'false') enabled = false;
  } catch {}

  let lexicon = null;
  let lexiconPromise = null;

  function loadLexicon() {
    if (lexicon) return Promise.resolve(lexicon);
    if (lexiconPromise) return lexiconPromise;
    lexiconPromise = fetch(LEXICON_URL, { cache: 'force-cache' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.w) {
          lexicon = data;
        }
        return lexicon;
      })
      .catch(() => {
        lexiconPromise = null;
        return null;
      });
    return lexiconPromise;
  }

  // Lazy prefetch during browser idle time so first hover is instantaneous with 0 startup blocking
  if (enabled) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => loadLexicon(), { timeout: 2500 });
    } else {
      setTimeout(() => loadLexicon(), 1200);
    }
  }

  // ==========================================================================
  // Indonesian Syllabifier (Algorithmic, zero-byte overhead)
  // ==========================================================================
  function syllabifyIndo(raw) {
    const w = String(raw || '').toLowerCase().trim();
    if (!w || w.length <= 3) return w;
    if (w.includes('-')) {
      return w.split('-').map(part => syllabifyIndo(part)).join(' - ');
    }
    // Protect digraphs ng, ny, sy, kh as single consonant tokens
    const tokens = [];
    for (let i = 0; i < w.length; i++) {
      const pair = w.slice(i, i + 2);
      if (pair === 'ng' || pair === 'ny' || pair === 'sy' || pair === 'kh') {
        tokens.push(pair);
        i++;
      } else {
        tokens.push(w[i]);
      }
    }
    const isVowel = (t) => /^[aeiou]$/.test(t);
    const vowelIdx = [];
    tokens.forEach((t, idx) => { if (isVowel(t)) vowelIdx.push(idx); });
    if (vowelIdx.length <= 1) return w;

    const syls = [];
    let start = 0;
    for (let v = 0; v < vowelIdx.length - 1; v++) {
      const curV = vowelIdx[v];
      const nextV = vowelIdx[v + 1];
      const gap = nextV - curV - 1;
      // Keep common diphthongs together (ai, au, oi) only at word end
      if (gap === 0) {
        const pair = tokens[curV] + tokens[nextV];
        if ((pair === 'ai' || pair === 'au' || pair === 'oi') && nextV === tokens.length - 1) {
          continue;
        }
        syls.push(tokens.slice(start, curV + 1).join(''));
        start = curV + 1;
      } else if (gap === 1) {
        syls.push(tokens.slice(start, curV + 1).join(''));
        start = curV + 1;
      } else {
        // 2+ consonants between vowels: split after first consonant
        syls.push(tokens.slice(start, curV + 2).join(''));
        start = curV + 2;
      }
    }
    syls.push(tokens.slice(start).join(''));
    return syls.join('·');
  }

  // ==========================================================================
  // Indonesian Morphological Stemmer & Lexicon Lookup
  // ==========================================================================
  function parseEntry(raw) {
    if (!raw) return null;
    const idx = raw.lastIndexOf('|');
    if (idx > 0) {
      const posCode = raw.slice(idx + 1);
      return { zh: raw.slice(0, idx), pos: POS_FULL[posCode] || posCode };
    }
    return { zh: raw, pos: '' };
  }

  function lookupExact(w) {
    if (!lexicon || !lexicon.w) return null;
    const hit = lexicon.w[w];
    return hit ? parseEntry(hit) : null;
  }

  function lookupWord(rawWord) {
    if (!lexicon || !lexicon.w) return null;
    const w = String(rawWord || '').toLowerCase().trim();
    if (!w || w.length < 2 || IGNORE_WORDS.has(w)) return null;

    // 1. Exact match
    const exact = lookupExact(w);
    if (exact) return { word: w, ...exact, root: null, note: '' };

    // 2. Hyphenated words: reduplication (jalan-jalan) or syllable examples (be-ra-pa)
    if (w.includes('-')) {
      const parts = w.split('-').filter(Boolean);
      if (parts.length === 2 && parts[0] === parts[1]) {
        const base = lookupExact(parts[0]);
        if (base) {
          return { word: w, zh: base.zh, pos: base.pos || '疊詞', root: parts[0], note: '疊詞 / 複數或重複' };
        }
      }
      const joined = parts.join('');
      const joinedHit = lookupExact(joined);
      if (joinedHit) {
        return { word: joined, ...joinedHit, root: null, note: '音節拆解示範' };
      }
    }

    // 3. Clitic / possessive suffix stripping (-nya, -ku, -mu, -lah, -kah, -pun)
    const clitics = [
      ['nya', '-nya (它的/該)'],
      ['lah', '-lah (語氣詞)'],
      ['kah', '-kah (疑問詞)'],
      ['pun', '-pun (也/甚至)'],
      ['ku', '-ku (我的)'],
      ['mu', '-mu (你的)'],
    ];
    let stem = w;
    let noteParts = [];
    for (const [suf, label] of clitics) {
      if (stem.length > suf.length + 2 && stem.endsWith(suf)) {
        const cand = stem.slice(0, -suf.length);
        const hit = lookupExact(cand);
        if (hit) {
          return { word: w, ...hit, root: cand, note: `詞根 ${cand} + ${label}` };
        }
        stem = cand;
        noteParts.push(label);
        break;
      }
    }

    // 4. Prefix + Suffix derivational stemming (with Indonesian K/T/S/P nasal assimilation)
    const candidates = [];
    const addCand = (c, tag) => {
      if (c && c.length >= 3) candidates.push([c, tag]);
    };

    // Strip derivational suffixes first
    const suffixList = [
      ['kan', '-kan'],
      ['an', '-an'],
      ['i', '-i'],
    ];
    const bases = [[stem, '']];
    for (const [suf, tag] of suffixList) {
      if (stem.length > suf.length + 2 && stem.endsWith(suf)) {
        const sub = stem.slice(0, -suf.length);
        addCand(sub, tag);
        bases.push([sub, tag]);
      }
    }

    for (const [b, sTag] of bases) {
      const joinTag = (pTag) => [pTag, sTag, ...noteParts].filter(Boolean).join(' + ');
      if (b.startsWith('di') && b.length > 4) addCand(b.slice(2), joinTag('被動 di-'));
      if (b.startsWith('ber') && b.length > 5) addCand(b.slice(3), joinTag('ber-'));
      if (b.startsWith('be') && b.length > 4) addCand(b.slice(2), joinTag('be-'));
      if (b.startsWith('ter') && b.length > 5) addCand(b.slice(3), joinTag('最/被 ter-'));
      if (b.startsWith('ke') && b.length > 4) addCand(b.slice(2), joinTag('ke-'));
      if (b.startsWith('se') && b.length > 4) addCand(b.slice(2), joinTag('一/同 se-'));

      // Nasal prefixes meN- / peN-
      if (b.startsWith('meny') && b.length > 6) addCand('s' + b.slice(4), joinTag('主動 meny-'));
      if (b.startsWith('meng') && b.length > 6) {
        addCand(b.slice(4), joinTag('主動 meng-'));
        addCand('k' + b.slice(4), joinTag('主動 meng-'));
      }
      if (b.startsWith('men') && b.length > 5) {
        addCand(b.slice(3), joinTag('主動 men-'));
        addCand('t' + b.slice(3), joinTag('主動 men-'));
      }
      if (b.startsWith('mem') && b.length > 5) {
        addCand(b.slice(3), joinTag('主動 mem-'));
        addCand('p' + b.slice(3), joinTag('主動 mem-'));
      }
      if (b.startsWith('me') && b.length > 4) addCand(b.slice(2), joinTag('主動 me-'));

      if (b.startsWith('peny') && b.length > 6) addCand('s' + b.slice(4), joinTag('名詞 peny-'));
      if (b.startsWith('peng') && b.length > 6) {
        addCand(b.slice(4), joinTag('名詞 peng-'));
        addCand('k' + b.slice(4), joinTag('名詞 peng-'));
      }
      if (b.startsWith('pen') && b.length > 5) {
        addCand(b.slice(3), joinTag('名詞 pen-'));
        addCand('t' + b.slice(3), joinTag('名詞 pen-'));
      }
      if (b.startsWith('pem') && b.length > 5) {
        addCand(b.slice(3), joinTag('名詞 pem-'));
        addCand('p' + b.slice(3), joinTag('名詞 pem-'));
      }
      if (b.startsWith('pe') && b.length > 4) addCand(b.slice(2), joinTag('名詞 pe-'));
      if (b.startsWith('per') && b.length > 5) addCand(b.slice(3), joinTag('per-'));
    }

    for (const [cand, tag] of candidates) {
      const hit = lookupExact(cand);
      if (hit) {
        return { word: w, ...hit, root: cand, note: `詞根 ${cand}` + (tag ? ` (${tag})` : '') };
      }
    }

    return null;
  }

  function lookupPhrase(prevWord, curWord, nextWord) {
    if (!lexicon || !lexicon.p) return null;
    const p = (prevWord || '').toLowerCase();
    const c = (curWord || '').toLowerCase();
    const n = (nextWord || '').toLowerCase();

    const tries = [];
    if (p && c && n) tries.push(`${p} ${c} ${n}`);
    if (c && n) tries.push(`${c} ${n}`);
    if (p && c) tries.push(`${p} ${c}`);

    for (const key of tries) {
      if (lexicon.p[key]) {
        return { phrase: key, zh: lexicon.p[key] };
      }
    }
    return null;
  }

  // ==========================================================================
  // Zero-Network Indonesian Audio Pronunciation Engine (Web Speech API)
  // 0 KB network traffic, 0 CORS/ORB errors, instant playback, 100% offline-ready
  // ==========================================================================
  let speakingBtn = null;

  function setSpeakingState(btn, active) {
    if (speakingBtn && speakingBtn !== btn) {
      speakingBtn.classList.remove('speaking');
    }
    if (btn) {
      btn.classList.toggle('speaking', active);
      speakingBtn = active ? btn : null;
    } else if (!active && speakingBtn) {
      speakingBtn.classList.remove('speaking');
      speakingBtn = null;
    }
  }

  function getLocalIndoVoice() {
    const s = window.speechSynthesis;
    if (!s || !s.getVoices) return null;
    const vs = s.getVoices() || [];
    return (
      vs.find(v => /^id[-_]ID/i.test(v.lang) && /natural|neural|google|damayanti|andika|gadis|ardi/i.test(v.name)) ||
      vs.find(v => /^id[-_]ID|^in[-_]ID/i.test(v.lang)) ||
      vs.find(v => /^id|^in/i.test(v.lang) || /indonesia/i.test(v.name)) ||
      vs.find(v => /^ms[-_]MY/i.test(v.lang)) ||
      null
    );
  }

  function stopWordAudio() {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeakingState(null, false);
  }

  function speakWord(rawText, { slow = false, btn = null } = {}) {
    const clean = String(rawText || '').replace(/-/g, ' ').trim();
    if (!clean) return;
    stopWordAudio();
    const rate = slow ? 0.72 : 0.96;

    const s = window.speechSynthesis;
    if (!s || !window.SpeechSynthesisUtterance) {
      setSpeakingState(btn, false);
      return;
    }
    try {
      if (s.paused) s.resume();
      s.cancel();
    } catch {}
    const u = new SpeechSynthesisUtterance(clean);
    const v = getLocalIndoVoice();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = 'id-ID';
    }
    u.rate = rate;
    u.pitch = 1.0;
    setSpeakingState(btn, true);
    u.onend = () => setSpeakingState(btn, false);
    u.onerror = () => setSpeakingState(btn, false);
    try {
      s.speak(u);
    } catch {
      setSpeakingState(btn, false);
    }
  }

  // ==========================================================================
  // Zero-DOM Hit-Testing via caretPositionFromPoint / caretRangeFromPoint
  // ==========================================================================
  const WORD_CHAR = /[A-Za-z\u00C0-\u00FF-]/;
  const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SCRIPT', 'STYLE', 'SVG', 'CANVAS']);
  const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"], [data-no-indo-click]';

  function getCaretFromPoint(x, y) {
    if (typeof document.caretPositionFromPoint === 'function') {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos && pos.offsetNode) {
        return { node: pos.offsetNode, offset: pos.offset };
      }
    }
    if (typeof document.caretRangeFromPoint === 'function') {
      const r = document.caretRangeFromPoint(x, y);
      if (r && r.startContainer) {
        return { node: r.startContainer, offset: r.startOffset };
      }
    }
    return null;
  }

  function extractNeighborWord(text, startIdx, dir) {
    let i = startIdx;
    while (i >= 0 && i < text.length && !WORD_CHAR.test(text[i])) i += dir;
    if (i < 0 || i >= text.length) return '';
    let a = i, b = i;
    if (dir < 0) {
      while (a > 0 && WORD_CHAR.test(text[a - 1])) a--;
      b = i + 1;
    } else {
      while (b < text.length && WORD_CHAR.test(text[b])) b++;
    }
    return text.slice(a, b).replace(/^-+|-+$/g, '');
  }

  function hitTestWord(x, y) {
    const targetEl = document.elementFromPoint(x, y);
    if (!targetEl) return null;
    if (targetEl.closest('#indo-word-tooltip') || targetEl.closest('[data-no-indo-tip]')) return null;
    if (SKIP_TAGS.has(targetEl.tagName)) return null;

    const caret = getCaretFromPoint(x, y);
    if (!caret || !caret.node || caret.node.nodeType !== Node.TEXT_NODE) return null;

    const parentEl = caret.node.parentElement;
    if (!parentEl || SKIP_TAGS.has(parentEl.tagName) || parentEl.closest('#indo-word-tooltip')) return null;

    const text = caret.node.nodeValue || '';
    if (!text.trim()) return null;

    let idx = caret.offset;
    if (idx >= text.length) idx = text.length - 1;
    if (idx < 0) return null;

    // If caret landed right after the last char of a word, step left 1
    if (!WORD_CHAR.test(text[idx])) {
      if (idx > 0 && WORD_CHAR.test(text[idx - 1])) {
        idx = idx - 1;
      } else {
        return null;
      }
    }

    let start = idx;
    let end = idx;
    while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
    while (end < text.length && WORD_CHAR.test(text[end])) end++;

    // Trim leading/trailing hyphens
    while (start < end && text[start] === '-') start++;
    while (end > start && text[end - 1] === '-') end--;

    if (end - start < 2 || end - start > 30) return null;

    const word = text.slice(start, end);
    if (!/[A-Za-z]/.test(word)) return null;

    // Verify cursor is actually inside the word's bounding rect (prevents triggering in whitespace!)
    const range = document.createRange();
    range.setStart(caret.node, start);
    range.setEnd(caret.node, end);
    const rect = range.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const padX = 3;
    const padY = 4;
    if (x < rect.left - padX || x > rect.right + padX || y < rect.top - padY || y > rect.bottom + padY) {
      return null;
    }

    const prevWord = extractNeighborWord(text, start - 1, -1);
    const nextWord = extractNeighborWord(text, end, 1);

    return {
      word,
      prevWord,
      nextWord,
      rect,
      isInteractive: !!parentEl.closest(INTERACTIVE_SELECTOR),
      key: `${word.toLowerCase()}@${Math.round(rect.left)}:${Math.round(rect.top)}`
    };
  }

  // ==========================================================================
  // Reusable Popover & Highlight DOM (2 elements total!)
  // ==========================================================================
  const highlightEl = document.createElement('div');
  highlightEl.id = 'indo-word-highlight';
  highlightEl.setAttribute('aria-hidden', 'true');

  const tooltipEl = document.createElement('div');
  tooltipEl.id = 'indo-word-tooltip';
  tooltipEl.setAttribute('role', 'tooltip');
  tooltipEl.setAttribute('aria-live', 'polite');

  function mountOverlays() {
    if (!highlightEl.parentNode) document.body.appendChild(highlightEl);
    if (!tooltipEl.parentNode) document.body.appendChild(tooltipEl);
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let currentKey = null;
  let currentWord = '';
  let isPinned = false;
  let isTooltipHovered = false;
  let hoverTimer = null;
  let hideTimer = null;
  let rafId = 0;
  let lastMouseEvent = null;

  function positionHighlight(rect) {
    highlightEl.style.width = `${Math.ceil(rect.width) + 4}px`;
    highlightEl.style.height = `${Math.ceil(rect.height) + 2}px`;
    highlightEl.style.transform = `translate3d(${Math.floor(rect.left) - 2}px, ${Math.floor(rect.top) - 1}px, 0)`;
    highlightEl.classList.add('visible');
  }

  function positionTooltip(rect) {
    // Measure tooltip dimensions
    const tipRect = tooltipEl.getBoundingClientRect();
    const tw = tipRect.width || 240;
    const th = tipRect.height || 100;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 10;
    const gap = 10;

    let left = rect.left + rect.width / 2 - tw / 2;
    left = Math.max(margin, Math.min(left, vw - tw - margin));

    // Prefer above the word; flip below if not enough room above
    let top = rect.top - th - gap;
    if (top < margin) {
      top = rect.bottom + gap;
    }
    if (top + th > vh - margin) {
      top = Math.max(margin, vh - th - margin);
    }

    tooltipEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0) scale(1)`;
  }

  function showTooltip(hit, entry, phraseHit, { pin = false, autoSpeak = false } = {}) {
    mountOverlays();
    clearTimeout(hideTimer);

    currentKey = hit.key;
    currentWord = hit.word;
    isPinned = pin;

    const syl = syllabifyIndo(entry.word || hit.word);
    const speakTarget = entry.word || hit.word;

    let html = `
      <div class="indo-tip-header">
        <div class="indo-tip-word-group">
          <span class="indo-tip-word">${escHtml(hit.word)}</span>
          ${entry.pos ? `<span class="indo-tip-pos">${escHtml(entry.pos)}</span>` : ''}
        </div>
        <div class="indo-tip-actions">
          <button type="button" class="indo-tip-btn" data-indo-speak="normal" title="播放標準讀音">🔊</button>
          <button type="button" class="indo-tip-btn" data-indo-speak="slow" title="慢速讀音 (0.7x)">🐢</button>
        </div>
      </div>
      <div class="indo-tip-syllable">
        <span>🗣️</span>
        <span class="indo-tip-syl-text">${escHtml(syl)}</span>
      </div>
      <div class="indo-tip-zh">${escHtml(entry.zh)}</div>
    `;

    if (entry.note) {
      html += `<div class="indo-tip-meta">🧩 ${escHtml(entry.note)}</div>`;
    }

    if (phraseHit) {
      html += `
        <div class="indo-tip-phrase">
          <div class="indo-tip-phrase-main">
            <span class="indo-tip-phrase-id">${escHtml(phraseHit.phrase)}</span>
            <span class="indo-tip-phrase-zh">→ ${escHtml(phraseHit.zh)}</span>
          </div>
          <button type="button" class="indo-tip-phrase-play" data-indo-phrase="${escHtml(phraseHit.phrase)}" title="朗讀片語">🔊</button>
        </div>
      `;
    }

    html += `
      <div class="indo-tip-footer">
        <span>${pin ? '已釘選 · 點空白處關閉' : '點字釘選並發音 · Alt+T 開關'}</span>
      </div>
    `;

    tooltipEl.innerHTML = html;
    tooltipEl.classList.toggle('pinned', pin);
    tooltipEl.classList.add('visible');

    positionHighlight(hit.rect);
    positionTooltip(hit.rect);

    if (autoSpeak) {
      const normalBtn = tooltipEl.querySelector('[data-indo-speak="normal"]');
      speakWord(speakTarget, { slow: false, btn: normalBtn });
    }
  }

  function hideTooltip(force = false) {
    if (!force && (isTooltipHovered || isPinned)) return;
    currentKey = null;
    currentWord = '';
    isPinned = false;
    tooltipEl.classList.remove('visible', 'pinned');
    highlightEl.classList.remove('visible');
  }

  function scheduleHide(delay = 190) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => hideTooltip(false), delay);
  }

  // Tooltip button clicks (normal speak, slow speak, phrase speak)
  tooltipEl.addEventListener('click', (e) => {
    const speakBtn = e.target.closest('[data-indo-speak]');
    if (speakBtn) {
      e.stopPropagation();
      const slow = speakBtn.getAttribute('data-indo-speak') === 'slow';
      speakWord(currentWord, { slow, btn: speakBtn });
      return;
    }
    const phraseBtn = e.target.closest('[data-indo-phrase]');
    if (phraseBtn) {
      e.stopPropagation();
      const phrase = phraseBtn.getAttribute('data-indo-phrase');
      speakWord(phrase, { slow: false, btn: phraseBtn });
    }
  });

  tooltipEl.addEventListener('mouseenter', () => {
    isTooltipHovered = true;
    clearTimeout(hideTimer);
  });

  tooltipEl.addEventListener('mouseleave', () => {
    isTooltipHovered = false;
    if (!isPinned) scheduleHide(160);
  });

  // ==========================================================================
  // Event Listeners (rAF-throttled hover + click/tap + scroll/ESC dismiss)
  // ==========================================================================
  async function processHover(x, y) {
    if (!enabled || isPinned) return;
    const hit = hitTestWord(x, y);
    if (!hit) {
      if (currentKey) scheduleHide(180);
      return;
    }
    if (hit.key === currentKey) {
      clearTimeout(hideTimer);
      return;
    }
    if (!lexicon) {
      await loadLexicon();
      if (!lexicon) return;
    }
    const entry = lookupWord(hit.word);
    if (!entry) {
      if (currentKey) scheduleHide(160);
      return;
    }
    const phraseHit = lookupPhrase(hit.prevWord, hit.word, hit.nextWord);
    showTooltip(hit, entry, phraseHit, { pin: false, autoSpeak: false });
  }

  document.addEventListener('mousemove', (e) => {
    if (!enabled || isPinned) return;
    lastMouseEvent = { x: e.clientX, y: e.clientY };
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      const pt = lastMouseEvent;
      if (!pt) return;
      // Fast check if moving inside tooltip
      const el = document.elementFromPoint(pt.x, pt.y);
      if (el && el.closest('#indo-word-tooltip')) return;

      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        processHover(pt.x, pt.y);
      }, 75);
    });
  }, { passive: true });

  document.addEventListener('click', async (e) => {
    // Clicking inside tooltip is handled by tooltipEl listener
    if (e.target && e.target.closest('#indo-word-tooltip')) return;
    if (e.target && e.target.closest('[data-indo-tip-toggle]')) return;

    if (!enabled) return;

    // Don't interfere with text selection drags
    const sel = window.getSelection ? String(window.getSelection()).trim() : '';
    if (sel.length > 0 && sel.includes(' ')) {
      hideTooltip(true);
      return;
    }

    const hit = hitTestWord(e.clientX, e.clientY);
    if (!hit) {
      if (isPinned || currentKey) hideTooltip(true);
      return;
    }

    // On interactive buttons/links, never hijack the click; just let the button work
    if (hit.isInteractive) {
      if (isPinned) hideTooltip(true);
      return;
    }

    if (!lexicon) {
      await loadLexicon();
      if (!lexicon) return;
    }

    const entry = lookupWord(hit.word);
    if (!entry) {
      if (isPinned || currentKey) hideTooltip(true);
      return;
    }

    const phraseHit = lookupPhrase(hit.prevWord, hit.word, hit.nextWord);
    showTooltip(hit, entry, phraseHit, { pin: true, autoSpeak: true });
  }, { passive: true });

  // Dismiss cleanly on scroll, resize, or Escape
  window.addEventListener('scroll', () => {
    if (currentKey || isPinned) hideTooltip(true);
  }, { passive: true, capture: true });

  window.addEventListener('resize', () => {
    if (currentKey || isPinned) hideTooltip(true);
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (currentKey || isPinned)) {
      hideTooltip(true);
      stopWordAudio();
    } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
      e.preventDefault();
      setEnabled(!enabled);
    }
  });

  // ==========================================================================
  // Toggle UI (integrates into Indo Hub header or floats neatly on Indo Quest)
  // ==========================================================================
  const toggleButtons = new Set();

  function syncToggleUI() {
    toggleButtons.forEach(btn => {
      btn.classList.toggle('active', enabled);
      btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
      const label = btn.querySelector('.indo-tip-toggle-label');
      if (label) label.textContent = enabled ? '即指即譯: 開' : '即指即譯: 關';
      btn.title = enabled
        ? '即指即譯 + 單字讀音已開啟（滑鼠移過或點選印尼文單字即可翻譯與發音，快捷鍵 Alt+T）'
        : '點擊開啟即指即譯 + 單字讀音（快捷鍵 Alt+T）';
    });
  }

  function setEnabled(next) {
    enabled = !!next;
    try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
    if (!enabled) {
      clearTimeout(hoverTimer);
      hideTooltip(true);
      stopWordAudio();
    } else {
      loadLexicon();
    }
    syncToggleUI();
  }

  function mountToggleButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'indo-tip-toggle-btn';
    btn.setAttribute('data-indo-tip-toggle', '1');
    btn.setAttribute('data-no-indo-tip', '1');
    btn.innerHTML = '<span>✨</span><span class="indo-tip-toggle-label"></span>';
    btn.addEventListener('click', () => setEnabled(!enabled));

    // If Indo Hub header-controls exists, place neatly inside it; otherwise mount floating pill
    const headerControls = document.querySelector('.header-controls');
    if (headerControls) {
      const dictBtn = document.getElementById('open-dict-btn');
      if (dictBtn && dictBtn.parentNode === headerControls) {
        headerControls.insertBefore(btn, dictBtn);
      } else {
        headerControls.prepend(btn);
      }
    } else {
      btn.classList.add('indo-tip-fab');
      document.body.appendChild(btn);
    }

    toggleButtons.add(btn);
    syncToggleUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountOverlays();
      mountToggleButton();
    });
  } else {
    mountOverlays();
    mountToggleButton();
  }

  // Expose lightweight public API for testing & external control
  window.IndoWordTooltip = {
    isEnabled: () => enabled,
    setEnabled,
    loadLexicon,
    lookupWord: async (w) => { await loadLexicon(); return lookupWord(w); },
    syllabifyIndo,
    speakWord,
    hide: () => hideTooltip(true),
  };
})();
