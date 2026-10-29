// sound.mjs
// Indonesian speech synthesis (Web Speech API) and pure Web Audio SFX.
// Supports bilingual smart narration (Indonesian id-ID & Traditional Chinese zh-TW),
// option pronunciation, slow rate playback, and zero-dependency Web Audio sound cues.

let rate = 0.95, effects = true, generation = 0, current = null, ctx = null;

export function configure(opts = {}) {
  if (typeof opts.rate === 'number') rate = opts.rate;
  if (typeof opts.sound === 'boolean') effects = opts.sound;
}

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : null);

export function voice(lang = 'id') {
  const s = synth();
  if (!s || !s.getVoices) return null;
  const vs = s.getVoices() || [];
  if (lang === 'zh') {
    return (
      vs.find(v => /^zh[-_]TW/i.test(v.lang)) ||
      vs.find(v => /^zh[-_]HK/i.test(v.lang)) ||
      vs.find(v => /^zh/i.test(v.lang)) ||
      null
    );
  }
  // Indonesian primary matching with Malay fallback
  return (
    vs.find(v => /^id[-_]ID/i.test(v.lang) && /natural|neural|google|indonesia|damayanti|andika/i.test(v.name)) ||
    vs.find(v => /^id[-_]ID/i.test(v.lang)) ||
    vs.find(v => /^id/i.test(v.lang)) ||
    vs.find(v => /^ms[-_]MY/i.test(v.lang)) ||
    null
  );
}

export function canSpeak() {
  return typeof window !== 'undefined' && !!(synth() && window.SpeechSynthesisUtterance);
}

export function stop() {
  generation++;
  try {
    synth()?.cancel();
  } catch {}
  if (current) {
    try {
      current.pause();
    } catch {}
    current = null;
  }
}

// Speaks single-language string
export function speak(text, { slow = false, lang = 'id' } = {}) {
  stop();
  const g = generation;
  return new Promise(resolve => {
    if (!text || !canSpeak()) return resolve('unavailable');
    const s = synth();
    const u = new SpeechSynthesisUtterance(text);
    const v = voice(lang);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = lang === 'zh' ? 'zh-TW' : 'id-ID';
    }
    u.rate = slow ? Math.max(0.6, rate - 0.28) : rate;
    u.pitch = 1.0;

    u.onend = () => resolve(g === generation ? 'ok' : 'stopped');
    u.onerror = () => resolve(g === generation ? 'error' : 'stopped');

    try {
      s.speak(u);
    } catch {
      resolve('error');
    }
  });
}

export function play({ text, slow = false }) {
  return speak(text, { slow, lang: 'id' });
}

// Quick pronunciation for choice options or word tiles
export function pronounceOption(text) {
  if (!text) return;
  const isChineseOnly = /^[\u4e00-\u9fa5\s，。！？、…0-9A-Za-z()（）]+$/.test(text) && /[\u4e00-\u9fa5]/.test(text);
  const lang = isChineseOnly ? 'zh' : 'id';
  return speak(text, { slow: false, lang });
}

// Bilingual narration: splits text into Indonesian and Chinese segments and reads each with its native voice!
export async function narrate(text, { slow = false } = {}) {
  stop();
  if (!text) return 'unavailable';
  const g = generation;

  // Split by language scripts (Chinese vs Latin/Others)
  const chunks = String(text).match(/[\u4e00-\u9fa5]+|[^\u4e00-\u9fa5]+/g) || [];
  for (const chunk of chunks) {
    if (generation !== g) return 'stopped';
    const trimmed = chunk.trim();
    if (!trimmed || /^[:\-.,!?;:()（）/]+$/.test(trimmed)) continue;

    const isZh = /[\u4e00-\u9fa5]/.test(trimmed);
    const res = await new Promise(resolve => {
      const s = synth();
      if (!s) return resolve('unavailable');
      const u = new SpeechSynthesisUtterance(trimmed);
      const v = voice(isZh ? 'zh' : 'id');
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else {
        u.lang = isZh ? 'zh-TW' : 'id-ID';
      }
      u.rate = slow ? Math.max(0.65, rate - 0.25) : rate;
      u.onend = () => resolve(generation === g ? 'ok' : 'stopped');
      u.onerror = () => resolve(generation === g ? 'error' : 'stopped');
      try {
        s.speak(u);
      } catch {
        resolve('error');
      }
    });

    if (res !== 'ok') return res;
  }
  return 'ok';
}

// Pure Web Audio synthesized sound effects
export function sfx(kind) {
  if (!effects || typeof window === 'undefined') return;
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const notes = {
      correct: [[660, 0], [880, 0.09]],
      wrong: [[220, 0], [180, 0.12]],
      done: [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.3]],
      tap: [[440, 0]],
      combo: [[784, 0], [988, 0.07], [1175, 0.14]],
      levelUp: [[440, 0], [554, 0.08], [659, 0.16], [880, 0.24]]
    }[kind] || [];

    const t0 = ctx.currentTime;
    for (const [f, at] of notes) {
      const o = ctx.createOscillator();
      const gain = ctx.createGain();
      o.type = kind === 'wrong' ? 'triangle' : 'sine';
      o.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(kind === 'tap' ? 0.04 : 0.12, t0 + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.18);
      o.connect(gain).connect(ctx.destination);
      o.start(t0 + at);
      o.stop(t0 + at + 0.22);
    }
  } catch {}
}
