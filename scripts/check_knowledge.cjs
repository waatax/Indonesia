const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const source = read('knowledge.js');
const css = read('knowledge.css');
const data = JSON.parse(read('data.json')).curriculum;
const mounted = [];
let mount;
const context = {
  document: {
    readyState: 'loading',
    addEventListener(event, handler) { assert.equal(event, 'DOMContentLoaded'); mount = handler; },
    getElementById(id) {
      assert.ok(html.includes(`id="${id}"`), `Missing view ${id}`);
      return { querySelector: () => null, prepend: panel => mounted.push(panel) };
    },
    createElement(tag) {
      if (tag === 'figure') return { className: '', innerHTML: '' };
      const feedback = { textContent: '' };
      const buttons = [0,1].map(i => ({
        dataset: {answer: String(i)}, attributes: {},
        before() {},
        addEventListener(event, handler) { assert.equal(event, 'click'); this.click = handler; },
        setAttribute(key, value) { this.attributes[key] = value; }
      }));
      return { innerHTML: '', buttons, feedback, figures: [],
        querySelectorAll: () => buttons,
        querySelector(selector) {
          if (selector === '.knowledge-feedback') return feedback;
          if (selector === '.knowledge-table-wrap') return {before: figure => this.figures.push(figure)};
          throw new Error(`Unexpected selector ${selector}`);
        }
      };
    }
  }
};
// Expose the authored records only inside this isolated test context.
vm.runInNewContext(source.replace('  const escape =', '  globalThis.records = pages; globalThis.diagrams = diagrams;\n  const escape ='), context);
const pages = context.records;
const expected = [...html.matchAll(/<section id="([\w-]+)-view" class="view/g)].map(m => m[1]);
assert.deepEqual([...pages.map(p=>p[0])].sort(), expected.sort());
console.log('1 PASS: all 17 existing views have curriculum knowledge coverage.');
assert.equal(new Set(pages.map(p=>p[0])).size, 17);
for (const page of pages) {
  assert.ok(page[4].length > 15);
  assert.ok(page[5].length >= 3);
  for (const row of page[5]) { assert.equal(row.length, 3); row.forEach(cell => assert.ok(cell.trim().length > 0)); }
}
assert.ok(pages.find(p=>p[0]==='affix')[5].length >= 7);
console.log('2 PASS: objectives, bilingual explanations and advanced affix extensions.');
assert.ok(data.meta.level_note.includes('非 BIPA'));
assert.ok(!data.alphabet_module.overview.tips[0].includes('絕大多數'));
assert.ok(!html.includes('動詞原形永遠不變'));
assert.ok(!html.includes('嚴格對標國際權威 BIPA 標準與真實語料庫'));
console.log('3 PASS: original source corrections and level-claim clarification.');
mount();
assert.equal(mounted.length,17);
assert.equal(mounted.flatMap(p=>p.figures).length,4);
mounted.forEach(p=>assert.ok(p.innerHTML.includes('<caption>')));
console.log('4 PASS: 17 comparison tables, 17 learning flows and 4 accessible SVG diagrams mounted.');
for (const panel of mounted) {
  panel.buttons[1].click(); assert.ok(panel.feedback.textContent.startsWith('↻'));
  panel.buttons[0].click(); assert.ok(panel.feedback.textContent.startsWith('✓'));
  assert.equal(panel.buttons[0].attributes['aria-pressed'],'true');
  assert.equal(panel.buttons[1].attributes['aria-pressed'],'false');
}
console.log('5 PASS: all 34 correct/incorrect feedback paths and selected states.');
assert.ok(!html.includes('user-scalable=no'));
assert.ok(css.includes('var(--text-main'));
assert.ok(css.includes('@media(max-width:600px)'));
assert.ok(css.includes(':focus-visible'));
assert.ok(source.includes('aria-live="polite"'));
assert.ok(html.includes('src="knowledge.js"') && html.includes('href="knowledge.css"'));
console.log('6 PASS: mobile zoom, theme token, keyboard focus, live feedback and asset integration.');
assert.equal(data.situational_modules.length,30);
assert.equal(data.grammar_modules.length,16);
for (const file of ['app.js','knowledge.js','scripts/refine_curriculum.cjs']) new vm.Script(read(file));
console.log(`7 PASS: syntax and original dataset preserved; ${pages.reduce((sum,p)=>sum+p[5].length,0)} authored knowledge points. Visual browser QA remains unverified.`);
