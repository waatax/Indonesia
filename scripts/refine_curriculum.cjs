// Narrow, repeatable corrections to existing content. No generated filler lessons.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'data.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const c = data.curriculum;
c.alphabet_module.overview.description = '印尼語使用 26 個拉丁字母，不用聲調區分詞義。拼寫與發音有規律，但 e 的讀音、重音與部分字尾實現仍需連同詞彙和示範音學習。';
c.alphabet_module.overview.tips[0] = '重音常出現在倒數第二音節附近，但受詞彙、語句與地區口音影響；不要把單一重音規則當作所有詞的唯一讀法。';
function walk(value) {
  if (typeof value === 'string') return value
    .replaceAll('K 在字尾時聲帶快速閉合不送氣 (Glottal stop /ʔ/)', 'K 在字尾常實現為喉塞音 /ʔ/，也可能是不釋放的 /k/，依詞彙及口音而異')
    .replaceAll('但在音節結尾時，聲帶瞬間緊閉阻斷氣流，不爆破不噴氣。', '在詞尾常讀作喉塞音 /ʔ/，部分詞或口音保留不釋放的 /k/；避免額外加母音。')
    .replaceAll('字首/字中發「ㄎ/ㄍ」；字尾是「喉塞音」，聲帶迅速關閉不送氣', '字首/字中通常為 /k/；詞尾常為 /ʔ/ 或不釋放的 /k/，依詞彙與口音而異')
    .replaceAll('BIPA A1-C2', '本站 A1–C2 學習路線');
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, walk(v)]));
  return value;
}
c.meta.version = '4.1.0';
c.meta.level_note = 'A1–C2 是本站教學標籤，非 BIPA 官方 1–7 級的直接換算；詞彙排序不構成官方詞頻或能力認證。';
fs.writeFileSync(file, JSON.stringify(walk(data), null, 2) + '\n');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('26 字母、C/J/R/K 關鍵音、雙母音與倒數第二音節重音原則。', '26 字母、C/J/R/K 關鍵音、雙母音與常見重音模式。')
  .replace('印尼語使用 26 個拉丁字母，無聲調，重音普遍在倒數第二音節。', '印尼語使用 26 個拉丁字母，不用聲調區分詞義；重音與部分讀音有詞彙和地域差異。')
  .replaceAll('字尾 K 為喉塞音 /ʔ/', '字尾 K 常見 /ʔ/ 或不釋放的 /k/')
  .replace('字尾 K 為喉塞不送氣', '字尾 K 常為喉塞或不釋放的 /k/')
  .replace('動詞原形永遠不變！靠時間詞表達狀態：', '動詞不依人稱與時態變位，但可透過詞綴改變語態或功能。時間與體貌可由下列詞語表達：')
  .replace('BIPA A1-C2 全分級字典引擎', '本站 A1–C2 分級字典')
  .replace('嚴格對標國際權威 BIPA 標準與真實語料庫！依詞頻科學劃分', '依本站教學用途提供詞彙學習階梯（非官方詞頻排名或 BIPA 等級換算）：')
  .replace('Top 1,000 (A1-A2)', '基礎 1,000 (A1–A2)')
  .replace('Top 3,000 (B1)', '延伸 3,000 (B1)')
  .replace('Top 5,000 (B2)', '進階 5,000 (B2)')
  .replace('Top 10,000 (C1-C2)', '擴充 10,000 (C1–C2)')
  .replace('BIPA 1-2 (A1-A2)', '本站 A1–A2 路線')
  .replace('width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no', 'width=device-width, initial-scale=1.0');
fs.writeFileSync(htmlPath, html);
console.log('Updated existing phonetics, grammar, level claims and viewport scaling.');
