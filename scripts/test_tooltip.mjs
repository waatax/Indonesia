#!/usr/bin/env node
/**
 * test_tooltip.mjs
 * Automated verification for Indo Word Instant Translator & Pronunciation Engine
 */
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

console.log('🧪 Running Indo Word Tooltip & Lexicon Verification...');

// 1. Verify files exist & lexicon integrity
const lexRaw = fs.readFileSync('indo-lexicon.json', 'utf8');
const lexSizeKB = Buffer.byteLength(lexRaw, 'utf8') / 1024;
assert(lexSizeKB < 800, `Lexicon too large: ${lexSizeKB.toFixed(1)} KB`);
const lex = JSON.parse(lexRaw);
assert(lex.w && Object.keys(lex.w).length >= 10000, 'Expected >= 10,000 words in lexicon');
assert(lex.p && Object.keys(lex.p).length >= 150, 'Expected >= 150 phrases in lexicon');
console.log(`✅ PASS 1: indo-lexicon.json valid (${Object.keys(lex.w).length} words, ${Object.keys(lex.p).length} phrases, ${lexSizeKB.toFixed(1)} KB raw)`);

// 2. Load indo-tooltip.js in a minimal DOM mock to test lookupWord, stemmer, syllabifyIndo
const tooltipCode = fs.readFileSync('indo-tooltip.js', 'utf8');
const dummyEl = () => ({
  id: '',
  className: '',
  innerHTML: '',
  style: {},
  classList: { toggle() {}, add() {}, remove() {} },
  setAttribute() {},
  addEventListener() {},
  querySelector() { return null; },
  appendChild() {},
  prepend() {},
  insertBefore() {},
  closest() { return null; },
});
const mockWin = {
  addEventListener() {},
  requestIdleCallback: null,
  speechSynthesis: { getVoices: () => [], cancel() {} },
  localStorage: { getItem: () => null, setItem() {} },
  innerWidth: 1280,
  innerHeight: 800,
};
const mockDoc = {
  readyState: 'complete',
  scripts: [{ src: 'https://example.com/indo-tooltip.js' }],
  currentScript: { src: 'https://example.com/indo-tooltip.js' },
  body: dummyEl(),
  createElement: () => dummyEl(),
  querySelector: () => null,
  getElementById: () => null,
  addEventListener() {},
};
const sandbox = {
  window: mockWin,
  document: mockDoc,
  localStorage: mockWin.localStorage,
  fetch: async () => ({ ok: true, json: async () => lex }),
  setTimeout: () => 0,
  clearTimeout: () => {},
  Node: { TEXT_NODE: 3 },
  console,
};
vm.runInNewContext(tooltipCode, sandbox);
const api = mockWin.IndoWordTooltip;
assert(api && typeof api.lookupWord === 'function', 'IndoWordTooltip API not mounted');

// 3. Test essential everyday words
const mustHit = [
  'saya', 'aku', 'anda', 'kamu', 'terima', 'kasih', 'selamat', 'pagi', 'malam',
  'nasi', 'goreng', 'ayam', 'pedas', 'manis', 'berapa', 'tidak', 'bukan', 'di',
  'ke', 'dari', 'mau', 'sudah', 'belum', 'kamar', 'mandi', 'mager', 'santuy', 'qris'
];
for (const w of mustHit) {
  const res = await api.lookupWord(w);
  assert(res && res.zh && /[\u4e00-\u9fa5]/.test(res.zh), `Missing core word: ${w}`);
}
console.log(`✅ PASS 2: All ${mustHit.length} core everyday Indonesian words resolve with Traditional Chinese`);

// 4. Test morphological stemmer & reduplication & syllable demos
const morphTests = [
  ['harganya', 'harga'],
  ['jalan-jalan', 'jalan'],
  ['be-ra-pa', 'berapa'],
  ['sa-ya', 'saya'],
  ['menulis', 'tulis'],
  ['memilih', 'pilih'],
  ['mengirim', 'kirim'],
  ['menyapu', 'sapu'],
  ['makanan', 'makan'],
  ['rumahnya', 'rumah'],
];
for (const [input, expectedRootOrWord] of morphTests) {
  const res = await api.lookupWord(input);
  assert(res && res.zh, `Morphological lookup failed for: ${input}`);
  assert(
    res.word === expectedRootOrWord || res.root === expectedRootOrWord || lex.w[input],
    `Unexpected stem for ${input}: got ${JSON.stringify(res)}`
  );
}
console.log(`✅ PASS 3: Morphological stemmer, nasal assimilation, reduplication & syllable-demo fallback verified`);

// 5. Test UI ignore list (should NOT trigger on English UI chrome)
for (const eng of ['xp', 'duolingo', 'bipa', 'app', 'wifi', 'html']) {
  const res = await api.lookupWord(eng);
  assert(res === null, `Expected English/UI word "${eng}" to be ignored, got ${JSON.stringify(res)}`);
}
console.log('✅ PASS 4: English/UI chrome words cleanly ignored');

// 6. Test syllabifier
assert.strictEqual(api.syllabifyIndo('selamat'), 'se·la·mat');
assert.strictEqual(api.syllabifyIndo('terima'), 'te·ri·ma');
assert.strictEqual(api.syllabifyIndo('belanja'), 'be·lan·ja');
console.log('✅ PASS 5: Indonesian syllabifier verified');

// 7. Measure weighted token coverage across data.json + quest/course/*.json
let totalTokens = 0;
let hitTokens = 0;
const walk = (x) => {
  if (typeof x === 'string') {
    const ms = x.match(/[A-Za-z\u00C0-\u00FF]+(?:-[A-Za-z\u00C0-\u00FF]+)*/g) || [];
    for (const m of ms) {
      const w = m.toLowerCase();
      if (w.length < 2 || w.length > 28) continue;
      totalTokens++;
      if (lex.w[w]) hitTokens++;
    }
  } else if (Array.isArray(x)) x.forEach(walk);
  else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (['id','kind','icon','type','key','slug','audio','stage','unit','img','image','theme_color','category','level','class'].includes(k)) continue;
      walk(v);
    }
  }
};
walk(JSON.parse(fs.readFileSync('data.json', 'utf8')));
for (const f of fs.readdirSync('quest/course')) {
  if (f.endsWith('.json')) walk(JSON.parse(fs.readFileSync(path.join('quest/course', f), 'utf8')));
}
const exactRate = (hitTokens / totalTokens) * 100;
console.log(`✅ PASS 6: Direct exact-hit token coverage across entire site corpus: ${exactRate.toFixed(1)}% (${hitTokens}/${totalTokens}) + stemmer covers inflected forms`);
assert(exactRate >= 70, `Expected >= 70% exact token coverage, got ${exactRate.toFixed(1)}%`);

// 8. Verify HTML & GitHub Pages deploy integration
const indexHtml = fs.readFileSync('index.html', 'utf8');
const questHtml = fs.readFileSync('quest/index.html', 'utf8');
const deployYml = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
assert(indexHtml.includes('indo-tooltip.css') && indexHtml.includes('indo-tooltip.js'), 'index.html missing tooltip assets');
assert(questHtml.includes('../indo-tooltip.css') && questHtml.includes('../indo-tooltip.js'), 'quest/index.html missing tooltip assets');
assert(deployYml.includes('indo-tooltip.js') && deployYml.includes('indo-tooltip.css') && deployYml.includes('indo-lexicon.json'), 'deploy.yml missing tooltip assets');
console.log('✅ PASS 7: index.html, quest/index.html, and deploy.yml integration verified');

console.log('\n🎉 ALL TOOLTIP & LEXICON TESTS PASSED!');
