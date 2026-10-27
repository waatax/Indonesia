/**
 * build_quest_course.js
 * Generates the complete Duolingo-style course structure and question bank
 * for Indonesian (Indo Quest) from data.json and data_vocab_10k.json.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dataJsonPath = path.join(rootDir, 'data.json');
const vocab10kPath = path.join(rootDir, 'data_vocab_10k.json');
const questDir = path.join(rootDir, 'quest');
const courseDir = path.join(questDir, 'course');

if (!fs.existsSync(courseDir)) {
  fs.mkdirSync(courseDir, { recursive: true });
}

const rawData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8')).curriculum;
const rawVocab = JSON.parse(fs.readFileSync(vocab10kPath, 'utf8'));

console.log('Ingesting curriculum and vocabulary...');

// Helper functions
const clean = s => String(s || '').trim();
const hash = s => {
  let h = 2166136261;
  for (const c of String(s)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
function shuffle(list, seed = 'seed') {
  const arr = [...list];
  let x = hash(seed) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    const j = x % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 8 Stages Specification
const SECTIONS = [
  {
    id: 's1',
    no: 1,
    title: '第一步：開口打招呼與字母發音',
    level: 'Pre-A1 (BIPA 1 入門)',
    color: 'green',
    icon: '👋',
    units: [
      { id: 'u1-1', title: '初次相遇：日常問候與道別', icon: '🌱', color: 'green' },
      { id: 'u1-2', title: '認識你真好：自我介紹與名字', icon: '🙋', color: 'teal' },
      { id: 'u1-3', title: '字母發音與神奇母音', icon: '🔤', color: 'sky' }
    ]
  },
  {
    id: 's2',
    no: 2,
    title: '生活日常：數字、時間與人稱代名詞',
    level: 'A1 (BIPA 1 基礎)',
    color: 'sky',
    icon: '🔢',
    units: [
      { id: 'u2-1', title: '印尼數字 1–100 與算錢計價', icon: '🪙', color: 'sky' },
      { id: 'u2-2', title: '人稱代名詞與禮貌尊稱', icon: '👥', color: 'blue' },
      { id: 'u2-3', title: '時間、星期與日常作息', icon: '⏰', color: 'indigo' }
    ]
  },
  {
    id: 's3',
    no: 3,
    title: '街頭實戰：印尼小吃、點餐與移動問路',
    level: 'A1–A2 (BIPA 2 生活)',
    color: 'orange',
    icon: '🍛',
    units: [
      { id: 'u3-1', title: '街頭美食：印尼炒飯與特色熱飲', icon: '🍽️', color: 'orange' },
      { id: 'u3-2', title: 'Gojek 摩托叫車與交通對話', icon: '🛵', color: 'gold' },
      { id: 'u3-3', title: '城市導航：問路與空間方位', icon: '🧭', color: 'pink' }
    ]
  },
  {
    id: 's4',
    no: 4,
    title: '當代生活：QRIS 支付、咖啡社交與殺價',
    level: 'A2 (BIPA 2 進階)',
    color: 'pink',
    icon: '📱',
    units: [
      { id: 'u4-1', title: '無現金社會：QRIS 掃碼與拆帳', icon: '💳', color: 'pink' },
      { id: 'u4-2', title: '咖啡館社交 (Nongkrong) 與棕櫚糖拿鐵', icon: '☕', color: 'violet' },
      { id: 'u4-3', title: '傳統市場與超商實用殺價', icon: '🛍️', color: 'orange' }
    ]
  },
  {
    id: 's5',
    no: 5,
    title: '核心詞綴 I：狀態動詞 ber- 與主動及物 meN-',
    level: 'B1 (BIPA 3 構詞基底)',
    color: 'violet',
    icon: '🧱',
    units: [
      { id: 'u5-1', title: '狀態與自發動詞：ber- 前綴', icon: '🧩', color: 'violet' },
      { id: 'u5-2', title: '及物動詞之王：meN- 六大鼻音同化', icon: '🌊', color: 'indigo' },
      { id: 'u5-3', title: '否定雙雄對決：tidak vs bukan 徹底搞懂', icon: '❌', color: 'red' }
    ]
  },
  {
    id: 's6',
    no: 6,
    title: '核心詞綴 II：被動 di-、意外 ter- 與名詞化',
    level: 'B1–B2 (BIPA 4 精熟)',
    color: 'teal',
    icon: '⚙️',
    units: [
      { id: 'u6-1', title: '自然客觀敘事：di- 被動語態', icon: '🔄', color: 'teal' },
      { id: 'u6-2', title: '無心插柳：ter- 意外態與最高級', icon: '⚡', color: 'blue' },
      { id: 'u6-3', title: '字根變身名詞：peN-、-an 與 ke-...-an', icon: '📦', color: 'green' }
    ]
  },
  {
    id: 's7',
    no: 7,
    title: '雅加達流行口語 (Bahasa Gaul) 與語氣助詞',
    level: 'B2 (BIPA 5 在地社交)',
    color: 'gold',
    icon: '🔥',
    units: [
      { id: 'u7-1', title: '道地口語靈魂：sih, dong, kok, deh, nih, tuh', icon: '💬', color: 'gold' },
      { id: 'u7-2', title: '年輕人縮寫密碼：wkwk, otw, mager, gpp', icon: '😎', color: 'orange' },
      { id: 'u7-3', title: 'Baku 正式書面 vs Gaul 街頭口語無痛切換', icon: '🔄', color: 'pink' }
    ]
  },
  {
    id: 's8',
    no: 8,
    title: '文化俗諺 (Peribahasa) 與深度跨文化表達',
    level: 'C1–C2 (BIPA 6 卓越)',
    color: 'blue',
    icon: '🌴',
    units: [
      { id: 'u8-1', title: '印尼處世哲學：經典成語與俗諺 I', icon: '📜', color: 'blue' },
      { id: 'u8-2', title: '自然與動物智慧：經典成語與俗諺 II', icon: '🐅', color: 'teal' },
      { id: 'u8-3', title: '雙城記與文化思維：雅加達 vs 泗水深入對比', icon: '🏙️', color: 'indigo' }
    ]
  }
];

// Build manifest
const manifestSections = SECTIONS.map(s => {
  return {
    id: s.id,
    no: s.no,
    title: s.title,
    level: s.level,
    color: s.color,
    icon: s.icon,
    units: s.units.map(u => ({
      id: u.id,
      title: u.title,
      icon: u.icon,
      color: u.color,
      level: s.level,
      nodes: [
        { id: `${u.id}:word`, kind: 'word', title: '核心單字與發音', icon: '🔤', size: 8 },
        { id: `${u.id}:listen`, kind: 'listen', title: '聽力與語音辨識', icon: '👂', size: 8 },
        { id: `${u.id}:build`, kind: 'build', title: '積木組句與句型', icon: '🧱', size: 8 },
        { id: `${u.id}:drill`, kind: 'drill', title: '實戰應用訓練', icon: '🎯', size: 8 },
        { id: `${u.id}:boss`, kind: 'boss', title: '單元通關挑戰', icon: '🏆', size: 10 }
      ]
    }))
  };
});

const indexManifest = {
  version: '2026-10-27.indo.v1',
  language: 'id',
  targetLangName: 'Bahasa Indonesia',
  sections: manifestSections,
  branches: [],
  stories: [
    { id: 'story-01', title: '叫車初體驗：司機在哪裡？', icon: '🛵', level: 'A1', section: 's3' },
    { id: 'story-02', title: '小吃攤點餐：少冰微辣！', icon: '🍜', level: 'A1', section: 's3' },
    { id: 'story-03', title: '咖啡店工作：WiFi 與插座', icon: '☕', level: 'A2', section: 's4' },
    { id: 'story-04', title: '結帳實戰：QRIS 掃碼拆帳', icon: '💳', level: 'A2', section: 's4' },
    { id: 'story-05', title: '辦公室社交：週末打算做什麼？', icon: '💼', level: 'B1', section: 's7' }
  ]
};

fs.writeFileSync(path.join(courseDir, 'index.json'), JSON.stringify(indexManifest, null, 2), 'utf8');
console.log('Saved index.json');

// Helper to partition pools cleanly into unit nodes
function buildUnitNodes(uid, itemsObj, pool) {
  const wordPool = pool.filter(id => itemsObj[id]?.kind === 'word');
  const listenPool = pool.filter(id => itemsObj[id]?.type === 'listen' || itemsObj[id]?.kind === 'talk');
  const buildPool = pool.filter(id => itemsObj[id]?.type === 'build' || itemsObj[id]?.kind === 'drill');
  const allScored = pool.filter(id => itemsObj[id]);

  const pWord = wordPool.length >= 4 ? wordPool : allScored.slice(0, 8);
  const pListen = listenPool.length >= 4 ? listenPool : allScored.slice(0, 8);
  const pBuild = buildPool.length >= 4 ? buildPool : allScored.slice(0, 8);
  const pDrill = allScored.slice(0, 8);
  const pBoss = allScored;

  return {
    [`${uid}:word`]: pWord,
    [`${uid}:listen`]: pListen,
    [`${uid}:build`]: pBuild,
    [`${uid}:drill`]: pDrill,
    [`${uid}:boss`]: pBoss
  };
}

// -------------------------------------------------------------
// STAGE 1 (Pre-A1)
// -------------------------------------------------------------
const s1Items = {};
const s1Units = {};

// S1 Unit 1
const u11Pool = [];
const greetings = [
  { id: 'selamat-pagi', id_text: 'Selamat pagi', zh_text: '早安 (清晨到上午 11:00)', hint: 'Pagi 是「早上」', why: 'Selamat pagi 是標準早安問候語。' },
  { id: 'selamat-siang', id_text: 'Selamat siang', zh_text: '午安 (上午 11:00 到下午 15:00)', hint: 'Siang 是「中午/白天」', why: 'Selamat siang 用於中午至午後陽光最強的時段。' },
  { id: 'selamat-sore', id_text: 'Selamat sore', zh_text: '傍晚安 (下午 15:00 到天黑前 18:30)', hint: 'Sore 是「傍晚/下午」', why: 'Selamat sore 用於下班放學、太陽即將西下的黃昏。' },
  { id: 'selamat-malam', id_text: 'Selamat malam', zh_text: '晚安 (天黑 18:30 以後)', hint: 'Malam 是「夜晚」', why: 'Selamat malam 是晚上見面或離別時的問候。' },
  { id: 'apa-kabar', id_text: 'Apa kabar?', zh_text: '你好嗎？最近好嗎？', hint: 'Apa(什麼) + kabar(消息/近況)', why: 'Apa kabar? 字面是「有什麼消息？」，是印尼人最溫暖的寒暄。' },
  { id: 'kabar-baik', id_text: 'Kabar baik', zh_text: '很好、我很好', hint: 'Baik 是「好」', why: '回答 Apa kabar? 最常見的標準回覆就是 Kabar baik（近況很好）。' },
  { id: 'terima-kasih', id_text: 'Terima kasih', zh_text: '謝謝你', hint: 'Terima(接受) + kasih(愛/給予)', why: 'Terima kasih 字面是「接納愛意」，表達真誠的感謝。' },
  { id: 'sama-sama', id_text: 'Sama-sama', zh_text: '不客氣、彼此彼此', hint: 'Sama 是「一樣/相同」', why: '對方說 Terima kasih 後，回敬 Sama-sama 表示不用客氣。' },
  { id: 'sampai-jumpa', id_text: 'Sampai jumpa', zh_text: '再見、下次見', hint: 'Sampai(直到) + jumpa(碰面)', why: 'Sampai jumpa 是優雅正式的道別語。' },
  { id: 'dadah', id_text: 'Dadah!', zh_text: '掰掰！（親友道別）', hint: '揮手道別的輕鬆口語', why: 'Dadah 是日常與同儕道別最輕鬆的說法。' }
];

greetings.forEach((g, idx) => {
  const others = greetings.filter(x => x.id !== g.id);
  const falseZhs = shuffle(others.map(x => x.zh_text), g.id + 'c').slice(0, 3);
  const choiceId = `u1-1:c:${idx}`;
  s1Items[choiceId] = {
    id: choiceId,
    kind: 'word',
    type: 'choice',
    prompt: `「${g.id_text}」是什麼意思？`,
    audio: g.id_text,
    answer: g.zh_text,
    options: shuffle([g.zh_text, ...falseZhs], g.id + 'opt'),
    hint: g.hint,
    why: g.why,
    level: 1
  };
  u11Pool.push(choiceId);

  const falseIds = shuffle(others.map(x => x.id_text), g.id + 'l').slice(0, 3);
  const listenId = `u1-1:l:${idx}`;
  s1Items[listenId] = {
    id: listenId,
    kind: 'talk',
    type: 'listen',
    prompt: '聽一聽語音，選出聽到的印尼文問候語：',
    audio: g.id_text,
    answer: g.id_text,
    options: shuffle([g.id_text, ...falseIds], g.id + 'lopt'),
    hint: `意思是：${g.zh_text}`,
    why: `${g.id_text} 意思為「${g.zh_text}」。`,
    level: 1
  };
  u11Pool.push(listenId);

  const words = g.id_text.replace(/[?!]/g, '').split(' ');
  if (words.length >= 2) {
    const buildId = `u1-1:b:${idx}`;
    s1Items[buildId] = {
      id: buildId,
      kind: 'drill',
      type: 'build',
      prompt: `請組裝出印尼文：「${g.zh_text}」`,
      audio: g.id_text,
      tokens: shuffle([...words, 'makan', 'bukan'], g.id + 'b'),
      answer: words.join(' '),
      hint: g.hint,
      why: `${g.id_text}：${g.why}`,
      level: 1
    };
    u11Pool.push(buildId);
  }
});

s1Items['u1-1:match:1'] = {
  id: 'u1-1:match:1',
  kind: 'word',
  type: 'match',
  prompt: '點選配對印尼文問候語與中文意思：',
  audio: 'Selamat pagi, Terima kasih, Sama-sama, Sampai jumpa',
  pairs: [
    ['Selamat pagi', '早安'],
    ['Terima kasih', '謝謝你'],
    ['Sama-sama', '不客氣'],
    ['Sampai jumpa', '再見']
  ],
  answer: 'matched',
  hint: 'Pagi 是早上，Terima kasih 是感謝。',
  why: '基礎問候掌握良好！',
  level: 1
};
u11Pool.push('u1-1:match:1');

// S1 Unit 2
const u12Pool = [];
const intros = [
  { id: 'nama-saya', id_text: 'Nama saya Budi.', zh_text: '我的名字叫 Budi。', words: ['Nama', 'saya', 'Budi'], hint: 'Nama(名字) + saya(我)', why: '印尼語中修飾詞後置：Nama saya 是「我的名字」。' },
  { id: 'siapa-nama-anda', id_text: 'Siapa nama Anda?', zh_text: '請問您叫什麼名字？', words: ['Siapa', 'nama', 'Anda'], hint: '問人名用 Siapa (誰)，不能用 Apa！', why: '在印尼語中，問人的姓名必須用「Siapa」(誰)，問「Siapa nama Anda?」。' },
  { id: 'saya-berasal', id_text: 'Saya berasal dari Taiwan.', zh_text: '我來自台灣。', words: ['Saya', 'berasal', 'dari', 'Taiwan'], hint: 'berasal dari(來自) + Taiwan(台灣)', why: 'berasal 表示起源或產自何處，dari 是介名詞「從/來自」。' },
  { id: 'senang-berkenalan', id_text: 'Senang berkenalan dengan Anda.', zh_text: '很高興認識您。', words: ['Senang', 'berkenalan', 'dengan', 'Anda'], hint: 'Senang(高興) + berkenalan(結識)', why: '初次見面結尾禮貌句：Senang berkenalan dengan Anda.' },
  { id: 'saya-tinggal', id_text: 'Saya tinggal di Taipei.', zh_text: '我住在台北。', words: ['Saya', 'tinggal', 'di', 'Taipei'], hint: 'tinggal(居住) + di(在)', why: 'di 表示「在...地點」，tinggal 表示居住。' }
];

intros.forEach((item, idx) => {
  const bid = `u1-2:b:${idx}`;
  s1Items[bid] = {
    id: bid,
    kind: 'build',
    type: 'build',
    prompt: `請組裝印尼文：「${item.zh_text}」`,
    audio: item.id_text,
    tokens: shuffle([...item.words, 'makan', 'bukan'], item.id),
    answer: item.words.join(' '),
    hint: item.hint,
    why: item.why,
    level: 1
  };
  u12Pool.push(bid);

  const cid = `u1-2:c:${idx}`;
  s1Items[cid] = {
    id: cid,
    kind: 'word',
    type: 'choice',
    prompt: `請問「${item.id_text}」中文是什麼意思？`,
    audio: item.id_text,
    answer: item.zh_text,
    options: shuffle([item.zh_text, '我今天很忙碌。', '這道菜非常好吃。', '請問廁所在哪裡？'], item.id + 'c'),
    hint: item.hint,
    why: item.why,
    level: 1
  };
  u12Pool.push(cid);
});

s1Items['u1-2:input:1'] = {
  id: 'u1-2:input:1',
  kind: 'drill',
  type: 'input',
  prompt: `請填空：詢問對方名字要用「___ nama Anda?」（提示：印尼語問人名用「誰」）`,
  audio: 'Siapa nama Anda?',
  answer: 'Siapa',
  alternatives: ['siapa'],
  hint: 'Siapa = 誰。不能用 Apa 喔！',
  why: '印尼語習慣：姓名屬於人的身分，因此問姓名必用 Siapa。',
  level: 2
};
u12Pool.push('u1-2:input:1');

// S1 Unit 3
const u13Pool = [];
const alphabetFacts = [
  { id: 'c-sound', prompt: '印尼文字母「C」的發音接近中文的什麼發音？', answer: '注音 ㄐ / ㄔ (如 ch in chair)', options: ['注音 ㄐ / ㄔ (如 ch in chair)', '英文的 K (如 cat)', '英文的 S (如 city)', '英文的 G (如 good)'], hint: '例如 Cokelat 讀成 /chokelat/，Cinta 讀成 /chinta/', why: '印尼語字母 C 永遠發 /tʃ/ (注音 ㄐ 或 ㄔ 的音)，絕不發 /k/ 或 /s/！' },
  { id: 'r-trill', prompt: '印尼文字母「R」在標準印尼語中通常如何發音？', answer: '舌尖顫音（彈舌音）', options: ['舌尖顫音（彈舌音）', '美式捲舌音 (如 car)', '法語小舌音', '不發音'], hint: '在印尼街頭常聽到靈魂滾動的 rrrrrr！', why: '印尼語的 R 為齒齦顫音（Trill），舌尖在牙齦後方振動產生彈舌。' },
  { id: 'k-coda', prompt: '印尼文字母「K」出現在「字尾」（如 tidak, baik）時，發音規律為何？', answer: '喉塞音（只做出口形但聲帶迅速緊閉截斷，不噴氣）', options: ['喉塞音（只做出口形但聲帶迅速緊閉截斷，不噴氣）', '大聲用力噴氣發 /kʰ/', '發成 S 的音', '完全跟前面的母音連音'], hint: '聽聽 tidak，結尾不是「卡」，而是收住氣息', why: '字尾 K 在印尼語中為入聲閉塞音 [ʔ]，氣流在聲門處迅速閉合截斷。' },
  { id: 'sy-sound', prompt: '印尼語外來語字母組合「SY」（如 syarat, syukur）發音為：', answer: '類似中文「詩/西」(/ʃ/)', options: ['類似中文「詩/西」(/ʃ/)', 'S + Y 兩個分開讀', '發成 Z 的音', '不發音'], hint: '多來自阿拉伯借詞', why: 'SY 代表無聲齒齦後擦音 /ʃ/，發音如同 English 的 "sh"。' }
];

alphabetFacts.forEach((af, idx) => {
  const cid = `u1-3:c:${idx}`;
  s1Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: af.prompt,
    audio: 'Bahasa Indonesia',
    answer: af.answer,
    options: af.options,
    hint: af.hint,
    why: af.why,
    level: 1
  };
  u13Pool.push(cid);
});

s1Items['u1-3:match:1'] = {
  id: 'u1-3:match:1',
  kind: 'word',
  type: 'match',
  prompt: '將印尼文字母發音特點與範例單字配對：',
  audio: 'Cinta, Tidak, Rumah, Makan siang',
  pairs: [
    ['C 永遠發 /ch/', 'Cinta (愛)'],
    ['字尾 K 喉塞截斷', 'Tidak (不)'],
    ['R 舌尖彈舌', 'Rumah (家)'],
    ['NG 鼻音軟顎', 'Makan siang (午餐)']
  ],
  answer: 'matched',
  hint: 'Cinta 發成 chin-ta，Tidak 字尾收氣不噴氣。',
  why: '精準掌握印尼語四大發音王牌規則！',
  level: 1
};
u13Pool.push('u1-3:match:1');

s1Units['u1-1'] = { guide: { title: '問候與打招呼指南', content: '印尼人以友善熱情聞名。問候語按照陽光與時段劃分：Selamat pagi (早上到11:00)、Selamat siang (11:00-15:00)、Selamat sore (15:00-18:30)、Selamat malam (天黑以後)。回答近況一律回答 Kabar baik (我很好)！' }, nodes: buildUnitNodes('u1-1', s1Items, u11Pool) };
s1Units['u1-2'] = { guide: { title: '自我介紹與姓名句型指南', content: '在印尼語中，修飾詞永遠放在名詞「後方」(D-M 法則)。例如 Nama (名字) + saya (我) = Nama saya (我的名字)。問別人名字用 Siapa (誰)，不能用 Apa！' }, nodes: buildUnitNodes('u1-2', s1Items, u12Pool) };
s1Units['u1-3'] = { guide: { title: '印尼字母發音黃金法則', content: '印尼語採拉丁字母，是拼讀一體的語種。重點注意：1. 字母 C 永遠發 /ch/（如 Cokelat）；2. 字母 R 是彈舌音；3. 字尾 K 是喉塞音，聲帶截斷不噴氣（如 Tidak）。' }, nodes: buildUnitNodes('u1-3', s1Items, u13Pool) };

fs.writeFileSync(path.join(courseDir, 's1.json'), JSON.stringify({ id: 's1', items: s1Items, units: s1Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 2 (A1): Numbers, Pronouns, Time
// -------------------------------------------------------------
const s2Items = {};
const s2Units = {};
const u21Pool = [];

const numbers = [
  ['satu', '1 (一)'], ['dua', '2 (二)'], ['tiga', '3 (三)'], ['empat', '4 (四)'], ['lima', '5 (五)'],
  ['enam', '6 (六)'], ['tujuh', '7 (七)'], ['delapan', '8 (八)'], ['sembilan', '9 (九)'], ['sepuluh', '10 (十)'],
  ['sebelas', '11 (十一)'], ['dua puluh', '20 (二十)'], ['seratus', '100 (一百)'], ['seribu', '1,000 (一千)'],
  ['sepuluh ribu', '10,000 (一萬)'], ['satu juta', '1,000,000 (一百萬)']
];

numbers.forEach(([numWord, numZh], idx) => {
  const cid = `u2-1:c:${idx}`;
  const others = numbers.filter(x => x[0] !== numWord);
  const falseZhs = shuffle(others.map(x => x[1]), numWord + 'c').slice(0, 3);
  s2Items[cid] = {
    id: cid,
    kind: 'word',
    type: 'choice',
    prompt: `印尼文數字「${numWord}」代表：`,
    audio: numWord,
    answer: numZh,
    options: shuffle([numZh, ...falseZhs], numWord + 'opt'),
    hint: `聽發音，這是印尼數字基礎計數。`,
    why: `${numWord} 就是數字 ${numZh}。在印尼買東西必用！`,
    level: 1
  };
  u21Pool.push(cid);

  const lid = `u2-1:l:${idx}`;
  s2Items[lid] = {
    id: lid,
    kind: 'talk',
    type: 'listen',
    prompt: `聽聽數字語音，選出聽到的印尼數字：`,
    audio: numWord,
    answer: numWord,
    options: shuffle([numWord, ...shuffle(others.map(x => x[0]), numWord + 'lo').slice(0, 3)], numWord + 'lopt'),
    hint: `代表中文的 ${numZh}`,
    why: `聽音辨數：${numWord} = ${numZh}`,
    level: 1
  };
  u21Pool.push(lid);
});

s2Items['u2-1:match:1'] = {
  id: 'u2-1:match:1',
  kind: 'word',
  type: 'match',
  prompt: '配對印尼數字與中文數字：',
  audio: 'satu, lima, sepuluh, seratus',
  pairs: [
    ['satu', '1 (一)'],
    ['lima', '5 (五)'],
    ['sepuluh', '10 (十)'],
    ['seratus', '100 (一百)']
  ],
  answer: 'matched',
  hint: 'Satu 是 1，Lima 是 5，Sepuluh 是 10。',
  why: '數字計算精確！',
  level: 1
};
u21Pool.push('u2-1:match:1');

// S2 Unit 2: Pronouns
const u22Pool = [];
const pronounRules = [
  { id: 'kita-vs-kami', prompt: '向沒被邀請的對方說「我們要去吃飯了」，該用哪一個「我們」？', answer: 'Kami (排除聽話者)', options: ['Kami (排除聽話者)', 'Kita (包含聽話者)', 'Mereka (他們)', 'Kalian (你們)'], hint: 'Kami 排除對方，Kita 包含對方。口訣：Ki-ta 是一體的！', why: '印尼語嚴格區分 Kita（包含對方）與 Kami（排除對方）。' },
  { id: 'bapak-ibu', prompt: '在計程車上稱呼男性司機大哥或長輩先生，最適當禮貌的尊稱是：', answer: 'Pak / Bapak', options: ['Pak / Bapak', 'Mas', 'Kakak', 'Kamu'], hint: 'Bapak 原意是父親，廣泛尊稱年長或成年男性。', why: 'Bapak (簡稱 Pak) 是最普遍、最受尊重的成年男性稱謂。' },
  { id: 'mbak-kak', prompt: '在雅加達稱呼平輩服務人員或年輕女性，親切且最常用的稱呼是：', answer: 'Mbak 或 Kak', options: ['Mbak 或 Kak', 'Ibu', 'Bibi', 'Anda'], hint: 'Kak 是跨性別中性親切稱謂。', why: '年輕平輩可用 Mbak 或 Kakak (Kak) 親切稱呼。' },
  { id: 'saya-vs-aku', prompt: '正式場合、職場會議或對陌生人說「我」，必須使用：', answer: 'Saya (正式客氣)', options: ['Saya (正式客氣)', 'Aku (親暱熟人)', 'Gue (雅加達俚語)', 'Kita'], hint: 'Saya 是標準禮貌的「我」。', why: '初學者與職場對話一律使用 Saya 最安全合宜。' }
];

pronounRules.forEach((p, idx) => {
  const cid = `u2-2:c:${idx}`;
  s2Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: p.prompt,
    audio: 'Bapak dan Ibu',
    answer: p.answer,
    options: p.options,
    hint: p.hint,
    why: p.why,
    level: 2
  };
  u22Pool.push(cid);
});

// Build with pronouns
const pronounSentences = [
  { id: 'mereka-makan', id_text: 'Mereka makan bersama di restoran.', zh_text: '他們在餐廳一起吃飯。', words: ['Mereka', 'makan', 'bersama', 'di', 'restoran'], hint: 'Mereka = 他們, bersama = 一起', why: '標準代名詞主詞句型。' },
  { id: 'kita-pergi', id_text: 'Kita pergi sekarang ya.', zh_text: '我們現在出發吧（大家一起走）。', words: ['Kita', 'pergi', 'sekarang', 'ya'], hint: 'Kita = 大家一起的我們, pergi = 出發', why: '邀約大家一起出發用 Kita。' }
];

pronounSentences.forEach((ps, idx) => {
  const bid = `u2-2:b:${idx}`;
  s2Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝代名詞句型：「${ps.zh_text}」`,
    audio: ps.id_text,
    tokens: shuffle([...ps.words, 'kami', 'tidur'], ps.id),
    answer: ps.words.join(' '),
    hint: ps.hint,
    why: ps.why,
    level: 2
  };
  u22Pool.push(bid);
});

// S2 Unit 3: Time
const u23Pool = [];
const timeItems = [
  { id: 'jam-berapa', id_text: 'Jam berapa sekarang?', zh_text: '現在幾點鐘？', words: ['Jam', 'berapa', 'sekarang'], hint: 'Jam(鐘/點) + berapa(多少) + sekarang(現在)', why: '問時間標準句：Jam berapa sekarang?' },
  { id: 'jam-tujuh', id_text: 'Sekarang jam tujuh pagi.', zh_text: '現在是早上七點。', words: ['Sekarang', 'jam', 'tujuh', 'pagi'], hint: '七點 = jam tujuh, 早上 = pagi', why: '印尼時間：先說鐘點 Jam X，再加時段 pagi/siang/sore/malam。' },
  { id: 'setengah-delapan', id_text: 'Sekarang jam setengah delapan.', zh_text: '現在是七點半（差半小時就八點）。', words: ['Sekarang', 'jam', 'setengah', 'delapan'], hint: '注意！Setengah delapan 是 7:30，不是 8:30！', why: '印尼時間大陷阱：Setengah delapan 是「差半小時就八點」，也就是 7:30！' },
  { id: 'hari-senin', id_text: 'Hari ini hari Senin.', zh_text: '今天是星期一。', words: ['Hari', 'ini', 'hari', 'Senin'], hint: 'Hari = 日子/天, Senin = 星期一', why: '星期一到日：Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu。' }
];

timeItems.forEach((t, idx) => {
  const bid = `u2-3:b:${idx}`;
  s2Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝印尼文：「${t.zh_text}」`,
    audio: t.id_text,
    tokens: shuffle([...t.words, 'kemarin', 'besok'], t.id),
    answer: t.words.join(' '),
    hint: t.hint,
    why: t.why,
    level: 2
  };
  u23Pool.push(bid);

  const cid = `u2-3:c:${idx}`;
  s2Items[cid] = {
    id: cid,
    kind: 'talk',
    type: 'choice',
    prompt: `「${t.id_text}」是什麼意思？`,
    audio: t.id_text,
    answer: t.zh_text,
    options: shuffle([t.zh_text, '明天下午見面嗎？', '我們幾點去吃午餐？', '火車已經抵達了嗎？'], t.id + 'c'),
    hint: t.hint,
    why: t.why,
    level: 2
  };
  u23Pool.push(cid);
});

s2Units['u2-1'] = { guide: { title: '印尼數字與貨幣面額指南', content: '印尼盾 (Rupiah) 面額大，萬位數常用 Ribu (千)，例如 Rp 10.000 (sepuluh ribu)。百萬是 Juta。熟練 1 到 10 就能延伸組出所有大數字！' }, nodes: buildUnitNodes('u2-1', s2Items, u21Pool) };
s2Units['u2-2'] = { guide: { title: '人稱代名詞與禮貌社交稱謂', content: '印尼語嚴格區分 Kita (包含聽者大家一起) 與 Kami (排除聽者的我們)。初次見面稱成年男性為 Pak / Bapak，女性為 Bu / Ibu，平輩同儕一律稱呼親切的 Kak！' }, nodes: buildUnitNodes('u2-2', s2Items, u22Pool) };
s2Units['u2-3'] = { guide: { title: '時間表達與半點陷阱 (Setengah)', content: '注意印尼語表達半點的特殊邏輯：Jam setengah delapan 字面是「半個八點」，實際意思是「差半小時就八點」，也就是台灣習慣說的 7:30！' }, nodes: buildUnitNodes('u2-3', s2Items, u23Pool) };

fs.writeFileSync(path.join(courseDir, 's2.json'), JSON.stringify({ id: 's2', items: s2Items, units: s2Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 3 (A1-A2): Food, Gojek & Navigation
// -------------------------------------------------------------
const s3Items = {};
const s3Units = {};

// S3 Food
const foods = [
  { id: 'nasi-goreng', id_text: 'Saya mau pesan nasi goreng spesial satu.', zh_text: '我要點一份特製印尼炒飯。', words: ['Saya', 'mau', 'pesan', 'nasi', 'goreng', 'spesial', 'satu'], hint: 'mau(要) + pesan(點餐)', why: '在餐廳點餐必備金句：Saya mau pesan ...' },
  { id: 'pedas-sedang', id_text: 'Tolong buat pedas sedang ya.', zh_text: '請幫我做中辣喔。', words: ['Tolong', 'buat', 'pedas', 'sedang', 'ya'], hint: 'pedas(辣) + sedang(中等)', why: '印尼辣椒狠辣，不吃辣一定要說 Tidak pedas 或 pedas sedang。' },
  { id: 'es-teh-manis', id_text: 'Minta es teh manis satu gelas.', zh_text: '請給我一杯甜冰茶。', words: ['Minta', 'es', 'teh', 'manis', 'satu', 'gelas'], hint: 'Es teh manis 是印尼的國民救命甜飲料。', why: '印尼最受歡迎解辣飲品，點餐必喊！' },
  { id: 'berapa-harganya', id_text: 'Berapa harganya semuanya?', zh_text: '全部總共多少錢？', words: ['Berapa', 'harganya', 'semuanya'], hint: 'Berapa(多少) + harganya(價錢) + semuanya(全部)', why: '結帳買單必用語。' },
  { id: 'ayam-bakar', id_text: 'Saya mau coba ayam bakar khas Solo.', zh_text: '我想嚐嚐梭羅特色的烤雞。', words: ['Saya', 'mau', 'coba', 'ayam', 'bakar', 'khas', 'Solo'], hint: 'ayam bakar = 烤雞, khas = 特色', why: '印尼各地方烤雞甜醬香氣十足。' }
];

const u31Pool = [];
foods.forEach((f, idx) => {
  const bid = `u3-1:b:${idx}`;
  s3Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝點餐印尼文：「${f.zh_text}」`,
    audio: f.id_text,
    tokens: shuffle([...f.words, 'tidur', 'mobil'], f.id),
    answer: f.words.join(' '),
    hint: f.hint,
    why: f.why,
    level: 2
  };
  u31Pool.push(bid);

  const cid = `u3-1:c:${idx}`;
  s3Items[cid] = {
    id: cid,
    kind: 'word',
    type: 'choice',
    prompt: `「${f.id_text}」在印尼餐廳點餐的意思是？`,
    audio: f.id_text,
    answer: f.zh_text,
    options: shuffle([f.zh_text, '請問有洗手間嗎？', '這裡可以刷信用卡嗎？', '車票在哪裡買？'], f.id + 'c'),
    hint: f.hint,
    why: f.why,
    level: 2
  };
  u31Pool.push(cid);

  const lid = `u3-1:l:${idx}`;
  s3Items[lid] = {
    id: lid,
    kind: 'talk',
    type: 'listen',
    prompt: '聽一聽服務員或客人的點餐語音，選出正確意思：',
    audio: f.id_text,
    answer: f.zh_text,
    options: shuffle([f.zh_text, '我要外帶三個便當。', '桌上有空的座位嗎？', '請問有熱水嗎？'], f.id + 'l'),
    hint: f.hint,
    why: `${f.id_text} 意思為：${f.zh_text}`,
    level: 2
  };
  u31Pool.push(lid);
});

s3Items['u3-1:match:1'] = {
  id: 'u3-1:match:1',
  kind: 'word',
  type: 'match',
  prompt: '將印尼道地美食與中文名稱配對：',
  audio: 'Nasi goreng, Sate ayam, Rendang, Es teh manis',
  pairs: [
    ['Nasi goreng', '印尼炒飯'],
    ['Sate ayam', '雞肉沙嗲'],
    ['Rendang', '巴東燉牛肉'],
    ['Es teh manis', '甜冰茶']
  ],
  answer: 'matched',
  hint: 'Sate 是沙嗲烤肉，Rendang 是世界第一美味燉牛肉。',
  why: '美食達人認證通過！',
  level: 1
};
u31Pool.push('u3-1:match:1');

// S3 Gojek
const u32Pool = [];
const gojekChat = [
  { id: 'sesuai-titik', id_text: 'Penjemputan sesuai titik ya Kak?', zh_text: '上車點依照地圖定位點對嗎？', words: ['Penjemputan', 'sesuai', 'titik', 'ya', 'Kak'], hint: 'titik 是地圖定位點，sesuai 是符合/依照。', why: '叫 Gojek/Grab 司機傳訊第一句百分之九十是這句！' },
  { id: 'otw-keluar', id_text: 'Saya sudah di depan lobi, otw keluar.', zh_text: '我已經在大廳門口了，正在走出去。', words: ['Saya', 'sudah', 'di', 'depan', 'lobi', 'otw', 'keluar'], hint: 'otw = On The Way (在路上了)', why: '印尼年輕人傳訊超愛用 otw！' },
  { id: 'helm-hitam', id_text: 'Saya pakai jaket hijau dan helm hitam.', zh_text: '我穿綠色外套、戴黑色安全帽。', words: ['Saya', 'pakai', 'jaket', 'hijau', 'dan', 'helm', 'hitam'], hint: 'hijau(綠色), hitam(黑色)', why: '司機描述自身特徵方便認車。' },
  { id: 'plat-nomor', id_text: 'Plat nomor motor saya B 1234 XYZ.', zh_text: '我的機車車牌號碼是 B 1234 XYZ。', words: ['Plat', 'nomor', 'motor', 'saya', 'B', '1234', 'XYZ'], hint: 'plat nomor = 車牌號碼', why: '確認車牌防上錯車。' }
];

gojekChat.forEach((g, idx) => {
  const bid = `u3-2:b:${idx}`;
  s3Items[bid] = {
    id: bid,
    kind: 'talk',
    type: 'build',
    prompt: `請組裝叫車對話：「${g.zh_text}」`,
    audio: g.id_text,
    tokens: shuffle([...g.words, 'kopi', 'tidak'], g.id),
    answer: g.words.join(' '),
    hint: g.hint,
    why: g.why,
    level: 2
  };
  u32Pool.push(bid);

  const cid = `u3-2:c:${idx}`;
  s3Items[cid] = {
    id: cid,
    kind: 'talk',
    type: 'choice',
    prompt: `司機傳來「${g.id_text}」，意思是：`,
    audio: g.id_text,
    answer: g.zh_text,
    options: shuffle([g.zh_text, '路上大塞車要遲到了。', '請問可以取消訂單嗎？', '我要先去加油。'], g.id + 'c'),
    hint: g.hint,
    why: g.why,
    level: 2
  };
  u32Pool.push(cid);
});

// S3 Directions
const u33Pool = [];
const directions = [
  { id: 'di-mana-toilet', id_text: 'Di mana toilet?', zh_text: '洗手間在哪裡？', words: ['Di', 'mana', 'toilet'], hint: 'Di mana = 在哪裡', why: '問地點最核心句型：Di mana + 名詞。' },
  { id: 'jalan-lurus', id_text: 'Jalan lurus lalu belok kanan.', zh_text: '直走然後右轉。', words: ['Jalan', 'lurus', 'lalu', 'belok', 'kanan'], hint: 'lurus(直), belok kanan(右轉)', why: '問路指示必學：lurus (直行), kanan (右), kiri (左)。' },
  { id: 'dekat-stasiun', id_text: 'Lokasinya dekat stasiun MRT.', zh_text: '位置就在捷運站附近。', words: ['Lokasinya', 'dekat', 'stasiun', 'MRT'], hint: 'dekat(靠近/附近)', why: 'dekat 表示距離近，jauh 表示遠。' }
];

directions.forEach((d, idx) => {
  const bid = `u3-3:b:${idx}`;
  s3Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝方位印尼文：「${d.zh_text}」`,
    audio: d.id_text,
    tokens: shuffle([...d.words, 'kiri', 'jauh'], d.id),
    answer: d.words.join(' '),
    hint: d.hint,
    why: d.why,
    level: 2
  };
  u33Pool.push(bid);

  const cid = `u3-3:c:${idx}`;
  s3Items[cid] = {
    id: cid,
    kind: 'word',
    type: 'choice',
    prompt: `問路回答「${d.id_text}」是什麼意思？`,
    audio: d.id_text,
    answer: d.zh_text,
    options: shuffle([d.zh_text, '公車已經滿座了。', '今天營業時間結束了。', '車票已經賣光了。'], d.id + 'c'),
    hint: d.hint,
    why: d.why,
    level: 2
  };
  u33Pool.push(cid);
});

s3Units['u3-1'] = { guide: { title: '印尼餐廳點餐與調味客製', content: '印尼料理香料豐富、辣椒生猛。點餐關鍵句是 Saya mau pesan...（我要點...）。想要不辣務必交代 Tidak pedas 或 Jangan pedas，飲料推薦點一杯 Es teh manis (甜冰茶) 解暑！' }, nodes: buildUnitNodes('u3-1', s3Items, u31Pool) };
s3Units['u3-2'] = { guide: { title: 'Gojek / Grab 叫車通訊實戰', content: '在印尼搭摩托車或叫車，司機在 App 內傳訊第一句通常是 Penjemputan sesuai titik ya, Kak?（上車點照地圖定位嗎？）。回答 Iya Pak, saya tunggu di depan... 即可順暢上車！' }, nodes: buildUnitNodes('u3-2', s3Items, u32Pool) };
s3Units['u3-3'] = { guide: { title: '問路指引與方位空間語法', content: '問地點句型：Di mana + 地點？指引方向的三大方向詞：Lurus (直走)、Kanan (向右)、Kiri (向左)。表示距離：Dekat (近)、Jauh (遠)。' }, nodes: buildUnitNodes('u3-3', s3Items, u33Pool) };

fs.writeFileSync(path.join(courseDir, 's3.json'), JSON.stringify({ id: 's3', items: s3Items, units: s3Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 4 (A2): QRIS, Coffee & Market Bargaining
// -------------------------------------------------------------
const s4Items = {};
const s4Units = {};

const modernLife = [
  { id: 'bayar-qris', id_text: 'Bisa bayar pakai QRIS nggak?', zh_text: '可以用 QRIS 條碼支付嗎？', words: ['Bisa', 'bayar', 'pakai', 'QRIS', 'nggak'], hint: 'nggak 是雅加達口語的不/嗎', why: '印尼全國統一 QR code 電子支付標準叫做 QRIS。' },
  { id: 'split-bill', id_text: 'Mau split bill dong, Mas.', zh_text: '小哥，我們想要分開結帳（各付各的）。', words: ['Mau', 'split', 'bill', 'dong', 'Mas'], hint: 'split bill 是年輕人直接用的借詞，dong 是親切語氣助詞。', why: '雅加達聚餐拆帳必備用語。' },
  { id: 'kopi-susu-aren', id_text: 'Es kopi susu aren satu, less sugar ya.', zh_text: '一杯冰棕櫚糖拿鐵，少糖微糖。', words: ['Es', 'kopi', 'susu', 'aren', 'satu', 'less', 'sugar', 'ya'], hint: 'Gula aren 是印尼靈魂棕櫚糖。', why: '印尼年輕人文青咖啡館天天喝的國民特調。' },
  { id: 'ada-colokan', id_text: 'Ada colokan dan WiFi gratis di sini?', zh_text: '這裡有插座跟免費 WiFi 嗎？', words: ['Ada', 'colokan', 'dan', 'WiFi', 'gratis', 'di', 'sini'], hint: 'colokan = 插座，gratis = 免費', why: '在咖啡廳遠端工作/讀書 nongkrong 的必備問句。' },
  { id: 'bisa-kurang', id_text: 'Bisa kurang sedikit harganya, Bu?', zh_text: '老闆娘，價格可以算便宜一點點嗎？', words: ['Bisa', 'kurang', 'sedikit', 'harganya', 'Bu'], hint: 'kurang = 減少/便宜', why: '傳統市場殺價最客氣有效的問法。' },
  { id: 'keranjang-kuning', id_text: 'Checkout sekarang di keranjang kuning ya!', zh_text: '現在立刻在黃色購物車下單結帳吧！', words: ['Checkout', 'sekarang', 'di', 'keranjang', 'kuning', 'ya'], hint: 'TikTok Shop 招牌名詞：keranjang kuning (黃色小黃車)。', why: '印尼直播帶貨狂潮最常聽到的口頭禪。' }
];

const u41Pool = [];
const u42Pool = [];
const u43Pool = [];

modernLife.forEach((m, idx) => {
  const bid = `u4:b:${idx}`;
  s4Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝印尼文：「${m.zh_text}」`,
    audio: m.id_text,
    tokens: shuffle([...m.words, 'mahal', 'tidur'], m.id),
    answer: m.words.join(' '),
    hint: m.hint,
    why: m.why,
    level: 2
  };

  const cid = `u4:c:${idx}`;
  s4Items[cid] = {
    id: cid,
    kind: 'talk',
    type: 'choice',
    prompt: `「${m.id_text}」的意思是？`,
    audio: m.id_text,
    answer: m.zh_text,
    options: shuffle([m.zh_text, '我想退換這件衣服。', '現在立刻就要出發了。', '包裹已經寄到了嗎？'], m.id + 'c'),
    hint: m.hint,
    why: m.why,
    level: 2
  };

  const lid = `u4:l:${idx}`;
  s4Items[lid] = {
    id: lid,
    kind: 'talk',
    type: 'listen',
    prompt: '聽一聽生活語音，選出正確的意思：',
    audio: m.id_text,
    answer: m.zh_text,
    options: shuffle([m.zh_text, '請問有洗手間嗎？', '火車票還能預訂嗎？', '要加多少印尼盾？'], m.id + 'l'),
    hint: m.hint,
    why: `${m.id_text} 意思是：${m.zh_text}`,
    level: 2
  };

  if (idx < 2) { u41Pool.push(bid, cid, lid); }
  else if (idx < 4) { u42Pool.push(bid, cid, lid); }
  else { u43Pool.push(bid, cid, lid); }
});

s4Items['u4:match:1'] = {
  id: 'u4:match:1',
  kind: 'word',
  type: 'match',
  prompt: '配對現代印尼生活關鍵詞：',
  audio: 'QRIS, Kopi susu aren, Colokan, Bisa kurang',
  pairs: [
    ['QRIS', '印尼統一行動支付'],
    ['Kopi susu aren', '棕櫚糖拿鐵'],
    ['Colokan', '電器插座'],
    ['Bisa kurang', '可以算便宜點嗎']
  ],
  answer: 'matched',
  hint: 'QRIS 是電子支付，Colokan 是找插座必備詞。',
  why: '現代生活詞彙完美掌握！',
  level: 2
};
u41Pool.push('u4:match:1');
u42Pool.push('u4:match:1');
u43Pool.push('u4:match:1');

s4Units['u4-1'] = { guide: { title: 'QRIS 無現金支付與拆帳', content: 'QRIS (發音像 Kris) 是印尼全國行動支付標竿，各類小吃店攤販皆支援。問店員：Bisa bayar pakai QRIS? 即可掃碼。' }, nodes: buildUnitNodes('u4-1', s4Items, u41Pool) };
s4Units['u4-2'] = { guide: { title: '咖啡社交文化 (Nongkrong)', content: '印尼的「Nongkrong」文化指三五好友在咖啡館喝茶聊天放鬆。最熱門飲料是 Es kopi susu aren（棕櫚糖拿鐵）。要插座問：Ada colokan?' }, nodes: buildUnitNodes('u4-2', s4Items, u42Pool) };
s4Units['u4-3'] = { guide: { title: '市場議價社交藝術', content: '在傳統市場或觀光市集，殺價要帶著微笑。問 Bisa kurang sedikit?（可以減一點嗎？）或 Kalau beli dua berapa?（買兩個算多少？）。' }, nodes: buildUnitNodes('u4-3', s4Items, u43Pool) };

fs.writeFileSync(path.join(courseDir, 's4.json'), JSON.stringify({ id: 's4', items: s4Items, units: s4Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 5 (B1): Affix I (ber-, meN-, tidak vs bukan)
// -------------------------------------------------------------
const s5Items = {};
const s5Units = {};
const u51Pool = [];
const u52Pool = [];
const u53Pool = [];

const affix1Questions = [
  // ber-
  {
    unit: 'u5-1',
    id: 'ber-function',
    prompt: '字根「main」(玩) 加上前綴「ber-」變成「bermain」，主要功能是？',
    audio: 'Anak-anak sedang bermain di taman.',
    answer: '形成不及物動詞（從事該活動/進行中）',
    options: ['形成不及物動詞（從事該活動/進行中）', '形成名詞工具', '形成被動態', '形成最高級形容詞'],
    hint: 'ber- 常用於表達狀態、擁有或自發動作，不接直接受詞。',
    why: 'ber- 核心功能即為不及物動詞化：main (玩) -> bermain (在玩耍)。'
  },
  {
    unit: 'u5-1',
    id: 'ber-ajar',
    prompt: '字根「ajar」(教導) 加上前綴「ber-」變成「學習」，拼寫會發生什麼特殊變化？',
    audio: 'Saya belajar bahasa Indonesia setiap hari.',
    answer: 'belajar (r 變成 l 的特殊同化音)',
    options: ['belajar (r 變成 l 的特殊同化音)', 'berajar', 'beajar', 'mengajar'],
    hint: '注意：不是 berajar 喔！它是極少數 r 轉 l 的同化字。',
    why: 'ajar + ber- 產生異化作用變成 belajar，表示主動「學習」。'
  },
  {
    unit: 'u5-1',
    id: 'ber-mobil',
    prompt: '名詞「mobil」(汽車) 加上前綴「ber-」變成「bermobil」，其引申意思是？',
    answer: '擁有汽車、開著汽車出行',
    options: ['擁有汽車、開著汽車出行', '製造汽車的人', '洗車場', '被車子撞到'],
    hint: 'ber- 加名詞常表示「擁有」或「使用該工具」。',
    why: 'ber- + 名詞 = 擁有某物，例如 bermobil (有車/開車)、bersepeda (騎自行車)。'
  },

  // meN-
  {
    unit: 'u5-2',
    id: 'men-nasal-t',
    prompt: '字根「tulis」(寫) 加上主動及物前綴「meN-」時，因首字母為 T，鼻音同化後會變成？',
    audio: 'Dia menulis surat cinta.',
    answer: 'menulis (T 脫落被 N 取代)',
    options: ['menulis (T 脫落被 N 取代)', 'mentulis', 'memtulis', 'mengtulis'],
    hint: 'K, T, S, P 四大易脫落清輔音口訣：T 遇 meN- 變成 men-！',
    why: '口訣 KTSP 遇 meN- 皆同化脫落：tulis -> me + n + ulis = menulis。'
  },
  {
    unit: 'u5-2',
    id: 'men-nasal-b',
    prompt: '字根「beli」(買) 首字母為濁音 B，加上主動及物前綴「meN-」後會變成？',
    audio: 'Ibu membeli sayur di pasar.',
    answer: 'membeli (B 不脫落，前綴為 mem-)',
    options: ['membeli (B 不脫落，前綴為 mem-)', 'memeli', 'menbeli', 'mengbeli'],
    hint: 'B 是雙唇濁音，搭配雙唇鼻音 m，字母保留不脫落。',
    why: '濁輔音 B 不脫落：beli -> membeli。'
  },
  {
    unit: 'u5-2',
    id: 'men-nasal-k',
    prompt: '字根「kirim」(寄送) 首字母為清音 K，加上主動及物前綴「meN-」後會變成？',
    audio: 'Saya mengirim paket lewat kurir.',
    answer: 'mengirim (K 脫落被 ng 取代)',
    options: ['mengirim (K 脫落被 ng 取代)', 'menkirim', 'memkirim', 'mengkirim'],
    hint: 'KTSP 規則：K 脫落，變成 meng-！',
    why: 'kirim -> me + ng + irim = mengirim。'
  },

  // tidak vs bukan
  {
    unit: 'u5-3',
    id: 'tidak-vs-bukan-1',
    prompt: '句子：「Dia ___ dokter.」(他不是醫生)，空格應填入：',
    audio: 'Dia bukan dokter, dia guru.',
    answer: 'bukan (因為 dokter 是名詞身分)',
    options: ['bukan (因為 dokter 是名詞身分)', 'tidak', 'jangan', 'belum'],
    hint: 'Dokter 是職業名詞。否定名詞必用 bukan！',
    why: '否定金律：bukan 否定名詞/代名詞；tidak 否定動詞與形容詞。'
  },
  {
    unit: 'u5-3',
    id: 'tidak-vs-bukan-2',
    prompt: '句子：「Saya ___ suka makanan pedas.」(我不喜歡辣的食物)，空格應填入：',
    audio: 'Saya tidak suka makanan pedas.',
    answer: 'tidak (因為 suka 是動詞/形容詞)',
    options: ['tidak (因為 suka 是動詞/形容詞)', 'bukan', 'jangan', 'tiada'],
    hint: 'Suka 是喜歡 (動詞)。否定動詞用 tidak！',
    why: 'Suka 為動詞，否定必須用 tidak suka，不能用 bukan suka。'
  },
  {
    unit: 'u5-3',
    id: 'tidak-vs-bukan-3',
    prompt: '句子：「Rumah ini ___ mahal.」(這棟房子不貴)，空格應填入：',
    audio: 'Rumah ini tidak mahal sama sekali.',
    answer: 'tidak (因為 mahal 是形容詞)',
    options: ['tidak (因為 mahal 是形容詞)', 'bukan', 'jangan', 'tiada'],
    hint: 'Mahal 是昂貴 (形容詞)。否定形容詞用 tidak！',
    why: '形容詞否定必用 tidak。'
  }
];

affix1Questions.forEach((q, idx) => {
  const cid = `u5:c:${idx}`;
  s5Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: q.prompt,
    audio: q.audio,
    answer: q.answer,
    options: q.options,
    hint: q.hint,
    why: q.why,
    level: 3
  };
  if (q.unit === 'u5-1') u51Pool.push(cid);
  else if (q.unit === 'u5-2') u52Pool.push(cid);
  else u53Pool.push(cid);
});

// Build items for Stage 5
const affixSentences = [
  { unit: 'u5-1', id: 's5-b1', id_text: 'Mereka sedang bekerja di kantor.', zh_text: '他們正在辦公室工作。', words: ['Mereka', 'sedang', 'bekerja', 'di', 'kantor'], hint: 'bekerja 是 kerja 加 ber- 形成的不及物動詞。', why: 'ber- + kerja -> bekerja。' },
  { unit: 'u5-2', id: 's5-b2', id_text: 'Ibu sedang memasak nasi di dapur.', zh_text: '媽媽正在廚房煮飯。', words: ['Ibu', 'sedang', 'memasak', 'nasi', 'di', 'dapur'], hint: 'masak 首字母 m，直接加 me- 成為 memasak。', why: '及物動詞 memasak 接受詞 nasi。' },
  { unit: 'u5-3', id: 's5-b3', id_text: 'Ini bukan tas saya.', zh_text: '這不是我的包包。', words: ['Ini', 'bukan', 'tas', 'saya'], hint: 'tas 是名詞，否定必須用 bukan！', why: 'bukan + 名詞否定。' }
];

affixSentences.forEach((as, idx) => {
  const bid = `u5:b:${idx}`;
  s5Items[bid] = {
    id: bid,
    kind: 'drill',
    type: 'build',
    prompt: `請組裝句型：「${as.zh_text}」`,
    audio: as.id_text,
    tokens: shuffle([...as.words, 'tidak', 'tidur'], as.id),
    answer: as.words.join(' '),
    hint: as.hint,
    why: as.why,
    level: 3
  };
  if (as.unit === 'u5-1') u51Pool.push(bid);
  else if (as.unit === 'u5-2') u52Pool.push(bid);
  else u53Pool.push(bid);
});

s5Units['u5-1'] = { guide: { title: '前綴 ber- 的狀態動詞魔法', content: 'ber- 表示處於某種狀態、從事某動作或「擁有某物」。例如：bermain (玩耍)、belajar (學習)、bekerja (工作)、bermobil (開著車)。' }, nodes: buildUnitNodes('u5-1', s5Items, u51Pool) };
s5Units['u5-2'] = { guide: { title: '及物動詞 meN- 六大鼻音同化', content: 'meN- 是接直接受詞的主動及物標誌。注意 KTSP 四字根首音脫落同化：K->meng-, T->men-, S->meny-, P->mem-。例如 tulis -> menulis, sapu -> menyapu。' }, nodes: buildUnitNodes('u5-2', s5Items, u52Pool) };
s5Units['u5-3'] = { guide: { title: '否定雙雄：tidak 與 bukan 終極分辨', content: '記住終極鐵律：bukan 只能否定「名詞」與「身分」（如 Bukan dokter, Bukan saya）；tidak 否定「動詞」與「形容詞」（如 Tidak suka, Tidak mahal）。' }, nodes: buildUnitNodes('u5-3', s5Items, u53Pool) };

fs.writeFileSync(path.join(courseDir, 's5.json'), JSON.stringify({ id: 's5', items: s5Items, units: s5Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 6 (B1-B2): Affix II (di-, ter-, nominalizers)
// -------------------------------------------------------------
const s6Items = {};
const s6Units = {};
const u61Pool = [];
const u62Pool = [];
const u63Pool = [];

const affix2Questions = [
  {
    unit: 'u6-1',
    id: 'di-passive',
    prompt: '主動句「Budi membaca buku itu」(Budi 讀了那本書)，改為被動句應為：',
    audio: 'Buku itu dibaca oleh Budi.',
    answer: 'Buku itu dibaca oleh Budi.',
    options: ['Buku itu dibaca oleh Budi.', 'Buku itu membacakan Budi.', 'Budi dibaca oleh buku.', 'Buku itu terbaca Budi.'],
    hint: '被動前綴是 di-，受詞提到句首作主詞。oleh 是「由/被」。',
    why: '被動句骨架：受詞 + di-動詞 + (oleh) + 行為者。'
  },
  {
    unit: 'u6-1',
    id: 'di-dimakan',
    prompt: '句子：「Nasi goreng ini sudah ___ oleh adik.」(這盤炒飯已經被弟弟吃掉了)，空格應填入：',
    audio: 'Nasi goreng ini sudah dimakan oleh adik.',
    answer: 'dimakan (被吃)',
    options: ['dimakan (被吃)', 'memakan', 'makanan', 'termakan'],
    hint: '被動語態：makan 加上 di- 前綴。',
    why: '炒飯是被吃的對象，使用被動態 dimakan。'
  },
  {
    unit: 'u6-2',
    id: 'ter-accidental',
    prompt: '「tidur」(睡覺) 加上前綴「ter-」變成「tertidur」，通常傳達何種語意？',
    audio: 'Kemarin malam saya tertidur di sofa.',
    answer: '意外、無意識地睡著了',
    options: ['意外、無意識地睡著了', '故意去睡覺', '命令別人睡覺', '睡很久的意思'],
    hint: 'ter- 核心語義常表達「無心、不由自主、非蓄意」的狀態。',
    why: 'tertidur 表達不知不覺睡著了（如看電視時睡著），與主動的 tidur 截然不同。'
  },
  {
    unit: 'u6-2',
    id: 'ter-superlative',
    prompt: '形容詞「besar」(大) 加上前綴「ter-」變成「terbesar」，意思是：',
    audio: 'Ini adalah gedung terbesar di Jakarta.',
    answer: '最大的 (最高級)',
    options: ['最大的 (最高級)', '突然變大', '比較大', '很不大的意思'],
    hint: 'ter- 除了意外態，加在形容詞前方就是「最高級」！',
    why: 'ter- + 形容詞 = 最高級（例如 terbaik 最好、tercantik 最漂亮）。'
  },
  {
    unit: 'u6-3',
    id: 'pe-agent',
    prompt: '字根「tulis」(寫) 加上名詞化前綴「peN-」變成「penulis」，意思是：',
    audio: 'Dia adalah penulis novel terkenal.',
    answer: '作家、作者 (寫書寫作的人)',
    options: ['作家、作者 (寫書寫作的人)', '書局、文具店', '文章、筆記', '寫字的動作'],
    hint: 'peN- 表示執行該動作的人（施事者）或工具。',
    why: 'peN- + 字根表示從事該行為的人：tulis -> penulis (作者)。'
  },
  {
    unit: 'u6-3',
    id: 'an-result',
    prompt: '字根「makan」(吃) 加上尾綴「-an」變成「makanan」，意思是：',
    audio: 'Makanan khas Padang sangat lezat.',
    answer: '食物 (吃的產物/名詞)',
    options: ['食物 (吃的產物/名詞)', '餐廳', '廚師', '正在吃'],
    hint: '尾綴 -an 最常表示該動作產生的具體事物或集合體。',
    why: 'makan (吃) + -an -> makanan (食物)。同理 minum (喝) -> minuman (飲料)。'
  },
  {
    unit: 'u6-3',
    id: 'ke-an-state',
    prompt: '字根「sehat」(健康/形容詞) 加上環綴「ke-...-an」變成「kesehatan」，意思是：',
    audio: 'Kesehatan adalah hal yang paling penting.',
    answer: '健康 (抽象名詞/健康狀況)',
    options: ['健康 (抽象名詞/健康狀況)', '生病了', '變得更健康', '醫生'],
    hint: 'ke-...-an 將形容詞昇華為「抽象概念或名詞」。',
    why: 'ke-...-an 是構成抽象名詞的最高頻環綴：sehat -> kesehatan (健康)。'
  }
];

affix2Questions.forEach((q, idx) => {
  const cid = `u6:c:${idx}`;
  s6Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: q.prompt,
    audio: q.audio,
    answer: q.answer,
    options: q.options,
    hint: q.hint,
    why: q.why,
    level: 3
  };
  if (q.unit === 'u6-1') u61Pool.push(cid);
  else if (q.unit === 'u6-2') u62Pool.push(cid);
  else u63Pool.push(cid);
});

s6Items['u6:match:1'] = {
  id: 'u6:match:1',
  kind: 'word',
  type: 'match',
  prompt: '配對印尼語構詞詞綴與功能：',
  audio: 'dimakan, terbaik, penulis, kesehatan',
  pairs: [
    ['di- + 字根', '被動語態 (被做)'],
    ['ter- + 形容詞', '最高級 (最...)'],
    ['peN- + 字根', '人物/施事者 (做的人)'],
    ['ke-...-an', '抽象名詞 (狀況/性質)']
  ],
  answer: 'matched',
  hint: 'di- 是被動，ter- 是最高級，peN- 是人。',
  why: '印尼詞綴體系全通！',
  level: 3
};
u61Pool.push('u6:match:1');
u62Pool.push('u6:match:1');
u63Pool.push('u6:match:1');

s6Units['u6-1'] = { guide: { title: '被動語態 di- 的自然敘事', content: '印尼人在客觀陳述事情時極愛用被動語態 di-。結構為：受事名詞 + di-動詞 + oleh + 施事者。例如：Kopi ini diminum oleh saya.' }, nodes: buildUnitNodes('u6-1', s6Items, u61Pool) };
s6Units['u6-2'] = { guide: { title: '意外態與最高級 ter-', content: 'ter- 有兩大威力：1. 無意或意外狀態（terjatuh 跌倒、tertinggal 遺落）；2. 最高級形容詞（terbaik 最好、terbesar 最大）。' }, nodes: buildUnitNodes('u6-2', s6Items, u62Pool) };
s6Units['u6-3'] = { guide: { title: '名詞積木：peN-, -an 與 ke-...-an', content: 'peN- 代表從事該職業的人；-an 代表動作成果或具體物件；ke-...-an 代表抽象概念或所處環境狀態。' }, nodes: buildUnitNodes('u6-3', s6Items, u63Pool) };

fs.writeFileSync(path.join(courseDir, 's6.json'), JSON.stringify({ id: 's6', items: s6Items, units: s6Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 7 (B2): Bahasa Gaul
// -------------------------------------------------------------
const s7Items = {};
const s7Units = {};
const u71Pool = [];
const u72Pool = [];
const u73Pool = [];

const gaulQuestions = [
  {
    unit: 'u7-1',
    id: 'dong-particle',
    prompt: '句末加上語氣助詞「dong」（如：Tolong bantu dong!），傳達的語氣是：',
    audio: 'Bisa minta tolong dong!',
    answer: '親近友善的拜託、撒嬌或「當然囉/理所當然」',
    options: ['親近友善的拜託、撒嬌或「當然囉/理所當然」', '憤怒嚴肅的斥責', '疑惑反問', '正式書面陳述'],
    hint: 'Dong 讓請求變得親切軟化，或表達自信肯定。',
    why: 'Dong 是印尼社交最討喜的粒子，能迅速拉近人際距離。'
  },
  {
    unit: 'u7-1',
    id: 'sih-particle',
    prompt: '對話中說「Kamu kenapa sih?」，其中的「sih」語氣通常表示：',
    audio: 'Kamu kenapa sih hari ini?',
    answer: '疑惑、微探究或「到底怎麼了嘛」的情緒',
    options: ['疑惑、微探究或「到底怎麼了嘛」的情緒', '堅決命令', '宣告放棄', '道別用語'],
    hint: 'Sih 常用在疑問句加深好奇或微抱怨口吻。',
    why: 'Sih 具有探問、求證與微妙情感色彩。'
  },
  {
    unit: 'u7-1',
    id: 'kok-particle',
    prompt: '句子開頭用「Kok...」（如：Kok kamu belum datang?），意思是：',
    audio: 'Kok kamu belum sampai sekarang?',
    answer: '怎麼會.../為什麼（帶著訝異或不解）',
    options: ['怎麼會.../為什麼（帶著訝異或不解）', '如果...的話', '謝謝你', '恭喜你'],
    hint: 'Kok 是 Kenapa (為什麼) 的超高頻口語替代詞。',
    why: 'Kok 代表帶著驚訝好奇的「怎麼會這樣？」。'
  },
  {
    unit: 'u7-2',
    id: 'mager-slang',
    prompt: '印尼年輕人常說「Lagi mager nih.」，其中「mager」是哪兩個字的縮寫？',
    audio: 'Aduh lagi mager banget nih.',
    answer: 'Males gerak (懶得動、不想動)',
    options: ['Males gerak (懶得動、不想動)', 'Makan burger', 'Malam gemerlap', 'Mau gereja'],
    hint: 'Males = 懶惰，Gerak = 移動。',
    why: 'Mager = Malas gerak，是印尼年輕世代最經典的網路流行縮寫！'
  },
  {
    unit: 'u7-2',
    id: 'gpp-slang',
    prompt: '在 WhatsApp 簡訊聊天時，對方回覆「gpp」，意思相當於中文的：',
    audio: 'Gak apa-apa santai aja.',
    answer: '沒關係、沒事 (Gak apa-apa)',
    options: ['沒關係、沒事 (Gak apa-apa)', '快點來', '很高興', '不贊成'],
    hint: 'G (gak) + P (apa) + P (apa)',
    why: 'Gpp = Gak apa-apa (沒事啦/不打緊)，訊息回覆頻率極高。'
  },
  {
    unit: 'u7-3',
    id: 'baku-vs-gaul',
    prompt: '正式書面語（Bahasa Baku）的「Tidak apa-apa」，在雅加達口語最地道的說法是：',
    audio: 'Gak apa-apa kok, tenang saja.',
    answer: 'Gak apa-apa / Gpp',
    options: ['Gak apa-apa / Gpp', 'Bukan apa-apa', 'Tiada apa', 'Jangan apa'],
    hint: '雅加達口語將 tidak 口語化為 gak 或 enggak。',
    why: 'Tidak -> gak 是現代印尼口語的最顯著特徵。'
  },
  {
    unit: 'u7-3',
    id: 'baku-bisa',
    prompt: '書面語「Sudah」(已經)，在印尼街頭年輕人口中通常簡化說成：',
    audio: 'Udah selesai dari tadi.',
    answer: 'Udah',
    options: ['Udah', 'Sudahan', 'Adah', 'Telahan'],
    hint: 'Sudah -> Udah (省去字首 S)。',
    why: 'Sudah -> udah, Tidak -> gak 是印尼日常口語兩大基石。'
  }
];

gaulQuestions.forEach((q, idx) => {
  const cid = `u7:c:${idx}`;
  s7Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: q.prompt,
    audio: q.audio,
    answer: q.answer,
    options: q.options,
    hint: q.hint,
    why: q.why,
    level: 3
  };
  if (q.unit === 'u7-1') u71Pool.push(cid);
  else if (q.unit === 'u7-2') u72Pool.push(cid);
  else u73Pool.push(cid);
});

s7Items['u7:match:1'] = {
  id: 'u7:match:1',
  kind: 'word',
  type: 'match',
  prompt: '配對印尼社群縮寫與真諦：',
  audio: 'mager, gpp, otw, bucin',
  pairs: [
    ['mager', '懶得動 (malas gerak)'],
    ['gpp', '沒關係 (gak apa-apa)'],
    ['otw', '在路上了 (on the way)'],
    ['bucin', '戀愛腦 (budak cinta)']
  ],
  answer: 'matched',
  hint: 'Bucin 是戀愛奴隸，mager 是懶惰移動。',
  why: '雅加達潮人認證通過！',
  level: 3
};
u71Pool.push('u7:match:1');
u72Pool.push('u7:match:1');
u73Pool.push('u7:match:1');

s7Units['u7-1'] = { guide: { title: '語氣助詞大師班：dong, sih, kok, deh', content: '語氣助詞是印尼會話的靈魂。Dong (親切請求/當然)、Sih (探問/到底)、Kok (訝異反問為何)、Deh (勸誘/好啦就這樣)。' }, nodes: buildUnitNodes('u7-1', s7Items, u71Pool) };
s7Units['u7-2'] = { guide: { title: '印尼 TikTok 與 WhatsApp 流行縮寫', content: '掌握當代縮寫：mager (懶得動)、gabut (發呆無聊)、bucin (戀愛腦)、kepo (八卦好管閒事)、gpp (沒事)。' }, nodes: buildUnitNodes('u7-2', s7Items, u72Pool) };
s7Units['u7-3'] = { guide: { title: '正式語體 (Baku) 與街頭語體 (Gaul) 互轉', content: 'Tidak 轉為 Gak、Sudah 轉為 Udah、Bisa 轉為 Bisa dong、動詞前綴 meN- 常在口語中自然脫落。懂得切換才算真正精通印尼語！' }, nodes: buildUnitNodes('u7-3', s7Items, u73Pool) };

fs.writeFileSync(path.join(courseDir, 's7.json'), JSON.stringify({ id: 's7', items: s7Items, units: s7Units }, null, 2), 'utf8');

// -------------------------------------------------------------
// STAGE 8 (C1-C2): Peribahasa & Deep Culture
// -------------------------------------------------------------
const s8Items = {};
const s8Units = {};
const u81Pool = [];
const u82Pool = [];
const u83Pool = [];

const proverbs = [
  {
    unit: 'u8-1',
    id: 'ada-gula',
    id_text: 'Ada gula ada semut.',
    zh_literal: '有糖的地方就有螞蟻。',
    zh_meaning: '有利益或繁榮的地方，自然會吸引人聚集追求。',
    hint: 'Gula 是糖，Semut 是螞蟻。',
    why: '比喻繁華發達之地或有利可圖之處，四方之人都會趨之若鶩。'
  },
  {
    unit: 'u8-1',
    id: 'berakit-rakit',
    id_text: 'Berakit-rakit ke hulu, berenang-renang ke tepian.',
    zh_literal: '划竹筏到上游，游水到岸邊。',
    zh_meaning: '先苦後甘，先經歷艱難困苦，方能收穫成功的甘甜。',
    hint: '經典後半句：Bersakit-sakit dahulu, bersenang-senang kemudian.',
    why: '印尼家喻戶曉勉勵學子與奮鬥者的名言，相當於「苦盡甘來」。'
  },
  {
    unit: 'u8-2',
    id: 'menyelam-air',
    id_text: 'Sambil menyelam minum air.',
    zh_literal: '一邊潛水一邊喝水。',
    zh_meaning: '一舉兩得、事半功倍、一石二鳥。',
    hint: 'Menyelam 是潛水，minum air 是喝水。',
    why: '比喻在做一件事的同時，順便把另一件有利的事也完成了。'
  },
  {
    unit: 'u8-2',
    id: 'air-tenang',
    id_text: 'Air tenang menghanyutkan.',
    zh_literal: '平靜的水流往往最深沉、能把人沖走。',
    zh_meaning: '大智若愚，看似沈默內斂的人，往往胸藏淵博智慧或不可忽視的力量。',
    hint: 'Tenang = 平靜，Menghanyutkan = 沖走。',
    why: '警惕不要因外表平靜少言而輕視他人深厚的實力。'
  },
  {
    unit: 'u8-3',
    id: 'lain-ladang',
    id_text: 'Lain ladang lain belalang, lain lubuk lain ikannya.',
    zh_literal: '不同田地有不同蚱蜢，不同水潭有不同魚類。',
    zh_meaning: '入境隨俗，各地風俗習慣各有不同，應給予尊重。',
    hint: '相當於中文的「十里不同風，百里不同俗」。',
    why: '印尼萬島之國各族群文化相異，此句是尊重多元文化的至理名言。'
  }
];

proverbs.forEach((p, idx) => {
  const cid = `u8:c:${idx}`;
  s8Items[cid] = {
    id: cid,
    kind: 'grammar',
    type: 'choice',
    prompt: `印尼經典成語「${p.id_text}」寓意為何？`,
    audio: p.id_text,
    answer: p.zh_meaning,
    options: shuffle([
      p.zh_meaning,
      '貪小便宜最後得不償失。',
      '時間就是金錢一去不復返。',
      '千里之行始於足下。'
    ], p.id + 'c'),
    hint: `字面意思：${p.zh_literal}`,
    why: `${p.id_text}（${p.zh_literal}）：${p.why}`,
    level: 4
  };
  if (p.unit === 'u8-1') u81Pool.push(cid);
  else if (p.unit === 'u8-2') u82Pool.push(cid);
  else u83Pool.push(cid);

  const bid = `u8:b:${idx}`;
  const words = p.id_text.replace(/[.,]/g, '').split(' ');
  if (words.length <= 6) {
    s8Items[bid] = {
      id: bid,
      kind: 'drill',
      type: 'build',
      prompt: `請組裝印尼成語：「${p.zh_literal}」`,
      audio: p.id_text,
      tokens: shuffle([...words, 'makan', 'tidak'], p.id + 'b'),
      answer: words.join(' '),
      hint: p.hint,
      why: p.why,
      level: 4
    };
    if (p.unit === 'u8-1') u81Pool.push(bid);
    else if (p.unit === 'u8-2') u82Pool.push(bid);
    else u83Pool.push(bid);
  }
});

s8Items['u8:match:1'] = {
  id: 'u8:match:1',
  kind: 'word',
  type: 'match',
  prompt: '配對印尼諺語與對應寓意：',
  audio: 'Ada gula ada semut, Berakit-rakit ke hulu, Sambil menyelam minum air, Lain ladang lain belalang',
  pairs: [
    ['Ada gula ada semut', '有利益自然吸引人聚'],
    ['Berakit-rakit', '先苦後甘，苦盡甘來'],
    ['Sambil menyelam', '一舉兩得，事半功倍'],
    ['Lain ladang', '入境隨俗，尊重多元']
  ],
  answer: 'matched',
  hint: 'Semut 是螞蟻，Menyelam 是潛水。',
  why: '文化哲理深沉圓滿！',
  level: 4
};
u81Pool.push('u8:match:1');
u82Pool.push('u8:match:1');
u83Pool.push('u8:match:1');

s8Units['u8-1'] = { guide: { title: '印尼處世哲學與成語俗諺', content: '印尼俗諺 (Peribahasa) 深具南洋海島人際和諧與處世智慧。例如「Ada gula ada semut」(有糖有蟻) 與「Berakit-rakit」(苦盡甘來)。' }, nodes: buildUnitNodes('u8-1', s8Items, u81Pool) };
s8Units['u8-2'] = { guide: { title: '自然萬物與河流的智慧', content: '從水流觀察人性的諺語：Air tenang menghanyutkan (靜水流深，大智若愚)；Sambil menyelam minum air (一舉兩得)。' }, nodes: buildUnitNodes('u8-2', s8Items, u82Pool) };
s8Units['u8-3'] = { guide: { title: '雙城記：雅加達與泗水的文化對比', content: '雅加達節奏快速、流行語交織；泗水民風豪爽直率 (Arek Suroboyo)，兩地語言在禮貌度與詞彙使用上各有迷人風貌。' }, nodes: buildUnitNodes('u8-3', s8Items, u83Pool) };

fs.writeFileSync(path.join(courseDir, 's8.json'), JSON.stringify({ id: 's8', items: s8Items, units: s8Units }, null, 2), 'utf8');

console.log('=== All 8 Stages and Course Files Built Successfully ===');
