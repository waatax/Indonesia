const fs = require('fs');
const path = require('path');

// 1. Read existing data.json to preserve cities_guide, scenarios_mastery, etc.
const dataJsonPath = path.join(__dirname, '..', 'data.json');
let existingData = {};
try {
  existingData = JSON.parse(fs.readFileSync(dataJsonPath, 'utf8'));
} catch (e) {
  console.error('Could not read existing data.json:', e);
}

const curriculum = existingData.curriculum || {};

// =========================================================================
// 1. EXPANDED 16 GRAMMAR MODULES (BIPA A1 - C2 STANDARD)
// =========================================================================
const grammar_modules = [
  {
    id: "g_svo",
    title: "1. 核心語序：SVO 與無時態標記系統",
    badge: "BIPA A1 · 核心基礎",
    level: "A1",
    description: "印尼語被譽為最易入門的現代語言之一：動詞沒有過去式、現在式或未來式的屈折變化，無陰陽性與單複數動詞變化！語序與現代中文高度一致。",
    rules: [
      "基本語序為 SVO：主詞 (Subjek) + 動詞 (Verba) + 受詞 (Objek)。",
      "表達時間時態僅需在句中加上「時間副詞」或「時態標記詞」：kemarin (昨天)、tadi (剛才)、sekarang (現在)、besok (明天)、nanti (稍後)、sudah/telah (已經)、sedang/lagi (正在)、belum (還沒)、akan (將要)。"
    ],
    examples: [
      { id_sent: "Saya makan nasi goreng.", zh_sent: "我吃炒飯。(常態/現在)", breakdown: "Saya(我) + makan(吃) + nasi goreng(炒飯)" },
      { id_sent: "Kemarin saya sudah makan nasi goreng.", zh_sent: "昨天我已經吃過炒飯了。(過去已完成)", breakdown: "Kemarin(昨天) + saya(我) + sudah(已) + makan(吃)..." },
      { id_sent: "Besok malam saya akan makan bersama teman.", zh_sent: "明天晚上我將和朋友一起吃飯。(未來規劃)", breakdown: "Besok malam(明晚) + saya(我) + akan(將) + makan(吃)..." }
    ],
    tips: "💡 提示：在口語中，sudah 經常縮讀為 udah，sedang 常用 lagi 替代，語意更接地氣！"
  },
  {
    id: "g_pronouns",
    title: "2. 人稱代名詞與印尼尊卑禮貌稱謂陣列",
    badge: "BIPA A1 · 社交關鍵",
    level: "A1",
    description: "印尼社會極度重視人際距離、長幼尊卑與社交親疏。選對稱謂能迅速拉近心理距離，展現最高級別的文化教養。",
    table: [
      { type: "第一人稱單數 (我)", formal: "Saya (正式/通用禮貌)", informal: "Aku (熟人/親暱/戀人)", slang: "Gue / Gua (雅加達年輕流行口語)" },
      { type: "第二人稱單數 (你/您)", formal: "Anda (正式敬稱) / Bapak (男長輩) / Ibu (女長輩)", informal: "Kamu (同輩/晚輩) / Kakak (平輩/稍長者)", slang: "Lu / Elu (雅加達同輩口語)" },
      { type: "第三人稱單數 (他/她)", formal: "Beliau (尊稱德高望重者/長官/老師)", informal: "Dia (通用他/她，不分性別)", slang: "Doi (口語心儀對象/男女友)" },
      { type: "第一人稱複數 (我們)", formal: "Kita (包含聽者：我們大家) / Kami (排除聽者：我們這方)", informal: "Kita-kita", slang: "Kita semua" },
      { type: "第二/三人稱複數", formal: "Kalian (你們) / Mereka (他們)", informal: "Kalian / Mereka", slang: "Kalian semua" }
    ],
    tips: "⚠️ 重要禁忌：在印尼面對初次見面的年長者、官員或店員長輩，切勿直呼 Kamu 或 Anda！宜使用 Bapak (稱男性) 或 Ibu (稱女性)；年輕店員稱 Mas (男) 或 Mbak (女) 最受歡迎。"
  },
  {
    id: "g_negation",
    title: "3. 否定詞四大家族徹底辨析：Tidak, Bukan, Belum, Jangan",
    badge: "BIPA A1 · 精準表達",
    level: "A1",
    description: "印尼語的否定詞分工極其嚴格，若誤用會造成明顯的文法錯誤：",
    rules: [
      "Tidak (口語常作 Nggak / Gak)：專門否定「動詞」或「形容詞」。",
      "Bukan：專門否定「名詞」或「代名詞」（相當於中文的「不是...」）。",
      "Belum (口語 Belom)：表示「尚未 / 還沒」（暗示未來可能或即將發生）。",
      "Jangan：表示「不要 / 請勿」（祈使句、禁止命令）。"
    ],
    examples: [
      { id_sent: "Saya tidak suka kopi manis.", zh_sent: "我不喜歡甜咖啡。(否定動詞 suka)", tag: "Tidak" },
      { id_sent: "Ini bukan paspor saya.", zh_sent: "這不是我的護照。(否定名詞 paspor)", tag: "Bukan" },
      { id_sent: "Kereta belum berangkat.", zh_sent: "火車還沒出發。(表示尚未發生)", tag: "Belum" },
      { id_sent: "Jangan merokok di sini!", zh_sent: "請勿在此吸菸！(祈使禁令)", tag: "Jangan" }
    ]
  },
  {
    id: "g_5w1h",
    title: "4. 疑問詞矩陣：5W1H 實戰問句架構",
    badge: "BIPA A1 · 溝通必備",
    level: "A1",
    description: "掌握 7 大核心疑問詞與衍生搭配，能輕鬆發起日常 90% 的生活問句：",
    items: [
      { id_word: "Apa", zh_word: "什麼", example: "Apa ini?", example_zh: "這是什麼？" },
      { id_word: "Siapa", zh_word: "誰", example: "Siapa nama Anda?", example_zh: "請問您的大名？" },
      { id_word: "Di mana / Ke mana / Dari mana", zh_word: "在哪裡 / 去哪裡 / 從哪來", example: "Mau ke mana?", example_zh: "你要去哪裡？(印尼最經典日常問候)" },
      { id_word: "Kapan", zh_word: "何時 / 什麼時候", example: "Kapan kita mulai rapat?", example_zh: "我們幾點開始會議？" },
      { id_word: "Mengapa / Kenapa", zh_word: "為什麼 (正式 / 口語)", example: "Kenapa harganya naik?", example_zh: "為什麼價格上漲了？" },
      { id_word: "Bagaimana / Gimana", zh_word: "如何 / 怎樣", example: "Bagaimana caranya bayar QRIS?", example_zh: "要如何使用 QRIS 掃碼付款？" },
      { id_word: "Berapa", zh_word: "多少 (價格/數量/時間)", example: "Berapa harganya ini, Pak?", example_zh: "老闆，這個多少錢？" }
    ]
  },
  {
    id: "g_dm_rule",
    title: "5. 修飾後置原則 (Hukum D-M) 與 Yang 關聯詞引導",
    badge: "BIPA A2 · 句型中樞",
    level: "A2",
    description: "印尼語名詞片語遵循「Diterangkan (被修飾詞/中心語) + Menerangkan (修飾語)」規則，剛好與中文思維完全相反！",
    rules: [
      "中文先說修飾語再說中心詞（如「紅色的車」），印尼語先說中心詞再說修飾語：Mobil merah (Mobil 車 + merah 紅)。",
      "國家名與專有名詞後置：Kopi Indonesia (印尼咖啡), Bahasa Indonesia (印尼語)。",
      "Yang 關聯詞 (相當於中文的「...的」或英文 which/that/who)：用於強調特定特徵或引導長子句。例如：Kopi yang manis (那杯甜的咖啡), Orang yang berdiri di sana (站在那邊的那個人)。"
    ],
    examples: [
      { id_sent: "Saya mencari hotel yang murah dan bersih.", zh_sent: "我在尋找便宜又乾淨的飯店。", breakdown: "Hotel (D:飯店) + yang murah dan bersih (M:便宜且乾淨的)" },
      { id_sent: "Nasi goreng pedas ini sangat enak.", zh_sent: "這份辣炒飯非常好吃。", breakdown: "Nasi goreng (D:炒飯) + pedas (M:辣) + ini (這)" }
    ]
  },
  {
    id: "g_men_nasal",
    title: "6. 主動詞綴 meN- 鼻音同化與 K/P/T/S 脫落全攻略",
    badge: "BIPA A2-B1 · 詞綴核心",
    level: "A2-B1",
    description: "meN- 前綴用於構成及物主動動詞。其字首會依據字根 (Kata Dasar) 的第一個字母產生鼻音同化與脫落現象，是印尼語最著名的拼讀規律！",
    rules: [
      "K-P-T-S 脫落規律：字根為單子音開頭且為 K、P、T、S 時，字首子音脫落並被同化為鼻音：",
      "• K -> meng- (kirim 寄 -> mengirim 寄送；beli -> membeli 不脫落因為是 B)",
      "• P -> mem- (pakai 用 -> memakai 使用；pinjam -> meminjam 借)",
      "• T -> men- (tulis 寫 -> menulis 寫作；tolong -> menolong 幫助)",
      "• S -> meny- (sapu 掃 -> menyapu 打掃；sewa -> menyewa 租賃)",
      "例外不脫落：若字首為外來語雙子音（如 kritik -> mengkritik, proses -> memproses），字母不脫落。"
    ],
    examples: [
      { id_sent: "Dia sedang menulis surat bisnis.", zh_sent: "他正在寫一封商業信函。(tulis -> menulis)", tag: "T -> men-" },
      { id_sent: "Ibu membeli sayur segar di pasar.", zh_sent: "媽媽在市場購買新鮮蔬菜。(beli -> membeli)", tag: "B -> mem-" },
      { id_sent: "Kami menyewa kamar di pusat kota.", zh_sent: "我們在市中心租了一間房間。(sewa -> menyewa)", tag: "S -> meny-" }
    ]
  },
  {
    id: "g_passive_voice",
    title: "7. 被動態雙軌系統：di- 被動態 vs. 人稱前置被動態",
    badge: "BIPA B1 · 語法精髓",
    level: "B1",
    description: "印尼語極度偏好被動態，新聞、正式文件與禮貌口語中被動句佔比超過 50%。被動結構有兩大不同軌道：",
    rules: [
      "軌道 1：第三人稱被動句（主詞 + di-動詞 + oleh + 施事者）。例如：Buku ini dibaca oleh Budi (這本書被 Budi 閱讀)。",
      "軌道 2：第一/第二人稱被動句（主詞 + 人稱代名詞 + 動詞原形，絕對不可加 di-！）。例如：Buku ini sudah saya baca (這本書已被我讀過了，不可說 dibaca oleh saya)。",
      "禮貌與客觀效果：被動句能淡化施事者，使語氣更委婉謙和。"
    ],
    examples: [
      { id_sent: "Kamar ini sudah dibersihkan oleh petugas.", zh_sent: "這間房間已經由清潔人員打掃乾淨了。(第三人稱被動)", tag: "di- + oleh" },
      { id_sent: "Kopi ini sudah saya minum tadi pagi.", zh_sent: "這杯咖啡我今天早上已經喝過了。(第一人稱前置被動)", tag: "saya + 動詞原形" }
    ]
  },
  {
    id: "g_ber_affix",
    title: "8. ber- 前綴全解：自身動作、持有關係與狀態動詞",
    badge: "BIPA A2-B1 · 狀態動詞",
    level: "A2-B1",
    description: "ber- 前綴主要構成「不及物動詞」，強調主體自身的狀態、具有某物、或從事某種活動，後方不直接接直接受詞。",
    rules: [
      "1. 表示「具有 / 穿著」：ber- + 名詞（bersepatu 穿著鞋子、bermobil 開車/擁有汽車、berbaju 穿衣服）。",
      "2. 表示「從事自身動作/活動」：berjalan (走路)、berlari (跑步)、berenang (游泳)、berbicara (講話)。",
      "3. 拼寫變體：遇到 r 開頭或倒數第二音節含 -er- 時，ber- 變成 be-（如 kerja -> bekerja, renang -> berenang）；特別不規則：belajar (學)。"
    ],
    examples: [
      { id_sent: "Mereka sedang berbicara tentang rencana liburan.", zh_sent: "他們正在談論度假計劃。(bicara -> berbicara)", tag: "ber- 動詞" },
      { id_sent: "Pria yang berbaju hitam itu adalah manajer kami.", zh_sent: "那位穿黑色衣服的男士是我們的經理。(baju -> berbaju)", tag: "持有/穿著" }
    ]
  },
  {
    id: "g_conjunctions",
    title: "9. 連詞與複句結構：因果、條件、轉折與讓步",
    badge: "BIPA B1-B2 · 長句組織",
    level: "B1-B2",
    description: "要流利表達複雜想法與商務談判，必須靈活運用複句連接詞 (Kata Hubung)：",
    rules: [
      "並列與轉折：dan (和)、atau (或者)、tetapi / tapi (但是)、sedangkan (而/反之)、melainkan (而是-用於否定句後)。",
      "因果關係：karena / sebab (因為)、sehingga / maka (所以/導致)。",
      "條件與時間：jika / kalau / apabila (如果/假若)、ketika / saat (當...之時)、setelah (在...之後)、sebelum (在...之前)。",
      "讓步與目的：walaupun / meskipun (雖然/儘管)、supaya / agar (為了/以便)。"
    ],
    examples: [
      { id_sent: "Saya ingin pergi ke kantor, tetapi hujan turun sangat deras.", zh_sent: "我想去辦公室，但是雨下得太大了。", breakdown: "Tetapi 轉折連詞" },
      { id_sent: "Belajarlah dengan rajin agar kamu bisa lulus ujian.", zh_sent: "勤奮學習，以便你能順利通過考試。", breakdown: "Agar 目的連詞" }
    ]
  },
  {
    id: "g_kan_i_suffixes",
    title: "10. 使役與方位尾綴：-kan (使役/移轉) vs. -i (方位/受體)",
    badge: "BIPA B2 · 進階動詞",
    level: "B2",
    description: "-kan 與 -i 是印尼語動詞後綴雙雄，能將形容詞或名詞轉變為使役動詞或處所動詞：",
    rules: [
      "1. -kan (使役 Causative / 為他人 Benefactive)：令某人/物產生某種狀態，或把某物移交給對方。",
      "• bersih (乾淨) -> membersihkan (使之變乾淨 / 清潔)",
      "• beli (買) -> membelikan (為某人購買：Saya membelikan ibu bunga)",
      "2. -i (方位處所 Locative / 動作重複 Repetitive)：動作直接作用於某處所或受體目標。",
      "• dekat (近) -> mendekati (走近/靠近某人事物)",
      "• masuk (進) -> memasuki (進入某處：Memasuki gedung)"
    ],
    examples: [
      { id_sent: "Tolong ambilkan saya segelas air putih.", zh_sent: "請幫我拿一杯開水來。(ambilkan = 幫我拿)", tag: "-kan 為他人" },
      { id_sent: "Jangan mendekati area berbahaya itu.", zh_sent: "請勿靠近那個危險區域。(mendekati = 接近目標)", tag: "-i 方位指向" }
    ]
  },
  {
    id: "g_confixes",
    title: "11. 環綴家族：ke-...-an (抽象名詞/非意圖受害) 與 peN-...-an (動作過程)",
    badge: "BIPA B2 · 構詞巔峰",
    level: "B2",
    description: "環綴 (Konfiks) 同時在字根前後加上詞綴，是書面語與學術商務報告的核心骨幹：",
    rules: [
      "1. ke-...-an (抽象名詞)：indah (美) -> keindahan (美麗事物/美感)；bersih (淨) -> kebersihan (清潔衛生)。",
      "2. ke-...-an (意外遭受被動態)：hujan (雨) -> kehujanan (淋到雨了)；tinggal (落) -> ketinggalan (被遺忘落下了)。",
      "3. peN-...-an (動作執行過程名詞)：bayar (付) -> pembayaran (付款流程)；kembang (展) -> perkembangan (發展進程)。"
    ],
    examples: [
      { id_sent: "Proses pembayaran dapat dilakukan via transfer bank.", zh_sent: "付款流程可透過銀行轉帳進行。(bayar -> pembayaran)", tag: "peN-...-an 流程" },
      { id_sent: "Aduh, saya kehujanan di jalan tadi sore.", zh_sent: "哎呀，我傍晚在路上淋到雨了。(hujan -> kehujanan)", tag: "ke-...-an 遭遇" }
    ]
  },
  {
    id: "g_ter_affix",
    title: "12. ter- 綴多重功能：非故意動作 (Accidental)、完成態與最高級 (Superlative)",
    badge: "BIPA B1-B2 · 巧用前綴",
    level: "B1-B2",
    description: "ter- 前綴用途極廣，依搭配詞性產生三大經典含義：",
    rules: [
      "1. 非意圖/無心之過 (Accidental)：tidur (睡) -> tertidur (不小心睡著了)；jatuh (摔) -> terjatuh (意外摔倒)。",
      "2. 最高級 (Superlative)：ter- + 形容詞 = 最...。besar (大) -> terbesar (最大的)；baik (好) -> terbaik (最好的)。",
      "3. 能力可行態：baca (讀) -> terbaca (看得清/讀得懂)；beli (買) -> terbeli (買得起)。"
    ],
    examples: [
      { id_sent: "Indonesia adalah negara kepulauan terbesar di dunia.", zh_sent: "印尼是全球最大的群島國家。(besar -> terbesar)", tag: "最高級" },
      { id_sent: "Maaf, saya tertidur di kereta tadi.", zh_sent: "抱歉，我剛剛在火車上不小心睡著了。(tidur -> tertidur)", tag: "非刻意" }
    ]
  },
  {
    id: "g_reduplication",
    title: "13. 重疊詞 (Reduplikasi) 系統架構：複數、反覆與情態比喻",
    badge: "BIPA B1 · 語義色彩",
    level: "B1",
    description: "重疊詞是南島語系的靈魂，印尼語透過詞彙重疊傳達多元的語法功能：",
    rules: [
      "1. 完全重疊表示複數或各式各樣：anak (小孩) -> anak-anak (孩子們)；buku (書) -> buku-buku (各式書籍)。若已有數量詞（如 banyak 許多，lima 五本），則名詞不可重疊！",
      "2. 詞根重疊 + ber- 表示持續或休閒動作：jalan -> berjalan-jalan (散步閒晃)；main -> bermain-main (嬉戲玩耍)。",
      "3. 擬態像似名詞：kupu-kupu (蝴蝶)、mata-mata (間諜)、kura-kura (烏龜)。",
      "4. 變音重疊：bolak-balik (來來回回)、sayur-mayur (各式蔬菜)。"
    ],
    examples: [
      { id_sent: "Ayo kita jalan-jalan di tepi pantai sore ini.", zh_sent: "我們今天傍晚去海邊散步晃晃吧！", tag: "休閒漫遊" },
      { id_sent: "Buku-buku ini harus dikembalikan ke perpustakaan.", zh_sent: "這些書必須歸還給圖書館。", tag: "複數書籍" }
    ]
  },
  {
    id: "g_modals",
    title: "14. 情態助動詞辨析：Bisa / Boleh / Harus / Wajib / Mau / Akan",
    badge: "BIPA A2 · 意志與許可",
    level: "A2",
    description: "情態動詞表達能力、請求、義務與未來意願，需精確區分：",
    rules: [
      "Bisa (能力/可以) vs Boleh (許可/准許)：Bisa berenang (會游泳)；Bolehkah saya masuk? (我可以進來嗎？-請求允許)。",
      "Harus (必須/應該) vs Wajib (法定義務) vs Perlu (需要)：Kamu harus istirahat (你該休息了)；Wajib memakai helm (法律規定必須戴安全帽)。",
      "Mau (想要/意願) vs Akan (未來將要)：Saya mau makan (我想吃)；Hujan akan turun (快要下雨了)。"
    ],
    examples: [
      { id_sent: "Apakah saya boleh meminjam pulpen Anda sebentar?", zh_sent: "請問我可以借用一下您的原子筆嗎？(禮貌請求許可)", tag: "Boleh" },
      { id_sent: "Semua pengendara motor wajib mematuhi rambu lalu lintas.", zh_sent: "所有機車騎士均有義務遵守交通標誌。(法定義務)", tag: "Wajib" }
    ]
  },
  {
    id: "g_baku_vs_gaul",
    title: "15. 正式語 (Bahasa Baku) 與印尼口語 (Bahasa Gaul / Jaksel) 轉換體系",
    badge: "BIPA B2-C1 · 語體自如",
    level: "B2-C1",
    description: "印尼語有著鮮明的雙層語言體系 (Diglossia)。在電視新聞或公文中使用正式語 (Baku)，在街頭、社群與朋友聚會時使用潮流口語 (Gaul)：",
    rules: [
      "1. meN- 脫落：membeli -> beli；melihat -> liat；memikirkan -> mikir.",
      "2. 尾綴 -kan / -i 轉化為 -in：membetulkan -> benerin；membersihkan -> bersihin；memikirkan -> mikirin.",
      "3. 常用單字縮略矩陣：tidak -> nggak/gak；sudah -> udah；saja -> aja；sangat -> banget；sedang -> lagi；bagaimana -> gimana."
    ],
    examples: [
      { id_sent: "Baku: Saya sedang memikirkan masalah itu.", zh_sent: "正式：我正在思考那個問題。", tag: "Baku" },
      { id_sent: "Gaul: Gue lagi mikirin masalah itu nih.", zh_sent: "口語：我現在正在想那件事啦。(Jaksel 潮語)", tag: "Gaul" }
    ]
  },
  {
    id: "g_particles",
    title: "16. 語氣助詞情感色彩圖解：sih, dong, deh, kok, lho, ya, kan",
    badge: "BIPA C1 · 靈魂精準度",
    level: "C1",
    description: "語氣助詞 (Partikel Tutur) 是印尼人說話時最迷人的情感調味劑，掌握它們是跨入母語者境界的標誌：",
    rules: [
      "• sih：表達探究、好奇、委婉反駁或加重疑問。「Ada apa sih? (到底怎麼了啦？)」",
      "• dong：表達理所當然、自信要求或撒嬌央求。「Bantu aku dong! (幫我一下嘛！)」",
      "• deh：表達妥協接受、最終確定或建議。「Pilih yang ini aja deh. (那就選這個吧！)」",
      "• kok：表達驚訝困惑、反常質疑（相當於「怎麼會...」）。「Kok mahal banget? (怎麼會這麼貴？)」",
      "• lho / loh：表達提醒對方注意驚訝訊息。「Dia sudah pulang lho! (他已經回家了喔！)」",
      "• kan：表達確認共識（相當於「對吧 / 不是嗎」）。「Kamu sudah tahu kan? (你已經知道了對吧？)」"
    ],
    examples: [
      { id_sent: "Kok kamu belum siap-siap sih? Kita kan harus buru-buru!", zh_sent: "你怎麼會還沒準備好啦？我們不是得趕時間嗎！", tag: "助詞連發" },
      { id_sent: "Boleh minta diskon sedikit dong, Mbak!", zh_sent: "美女店員，就算便宜一點點給我嘛！", tag: "撒嬌議價" }
    ]
  }
];

// =========================================================================
// 2. PERIBAHASA & UNGKAPAN POPULER (52 CLASSIC & MODERN IDIOMS)
// =========================================================================
const peribahasa_list = [
  {
    id: "pb_01",
    id_phrase: "Ada gula ada semut",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "人為財死，鳥為食亡 / 哪裡有好處，人就往哪裡聚",
    literal_zh: "有糖的地方就有螞蟻",
    origin_culture: "印尼群島盛產棕櫚糖與蔗糖，螞蟻聞糖而至。比喻有利益、財富或就業機會的地方，自然會吸引大量人群前來聚集。",
    dialogue_example: "Di kawasan industri baru itu banyak sekali pedagang, ya wajarlah, ada gula ada semut."
  },
  {
    id: "pb_02",
    id_phrase: "Air tenang menghanyutkan",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "大智若愚 / 靜水流深 / 深藏不露的人不可小覷",
    literal_zh: "平靜流淌的水反而能將人沖走沖溺",
    origin_culture: "源於熱帶河川生態。水面看似平緩無波，水底其實暗流湧動。告誡人不可被沉默寡言的外表迷惑，沉穩之人往往內涵深厚。",
    dialogue_example: "Jangan remehkan Budi yang pendiam itu. Air tenang menghanyutkan, nilainya selalu ranking satu!"
  },
  {
    id: "pb_03",
    id_phrase: "Besar pasak daripada tiang",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "入不敷出 / 開銷大於收入 / 揮霍無度",
    literal_zh: "榫木木樁比承重梁柱還要粗大",
    origin_culture: "出自傳統高腳屋建築工法。若釘子木樁比支柱還粗，房屋結構必會開裂崩塌。比喻生活支出超過收入，財務必生危機。",
    dialogue_example: "Kalau terus belanja barang mewah, hidupmu bisa besar pasak daripada tiang."
  },
  {
    id: "pb_04",
    id_phrase: "Sambil menyelam minum air",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "一舉兩得 / 一石二鳥 / 同時達成兩項收穫",
    literal_zh: "一邊潛水一邊喝水",
    origin_culture: "極具南洋海洋特色的生動比喻。潛水時順便暢飲甘泉，形容在進行某項工作時，順便將另一件事一併漂亮完成。",
    dialogue_example: "Saya pergi dinas ke Bali sambil liburan akhir pekan, sekalian sambil menyelam minum air."
  },
  {
    id: "pb_05",
    id_phrase: "Tong kosong nyaring bunyinya",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "半瓶水響叮噹 / 沒有真才實學的人叫得最大聲",
    literal_zh: "空桶敲起來聲音最響亮",
    origin_culture: "金屬桶或竹筒內無裝物時，敲擊產生的回音格外刺耳喧囂。比喻才疏學淺、肚裡無墨水的人，往往最愛大放厥詞吹噓自誇。",
    dialogue_example: "Orang yang suka membual itu biasanya tong kosong nyaring bunyinya."
  },
  {
    id: "pb_06",
    id_phrase: "Di mana bumi dipijak, di situ langit dijunjung",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "入境隨俗 / 尊重當地法律、文化與傳統習俗",
    literal_zh: "腳踩在哪片土地上，就在那裡頂戴尊崇那片天空",
    origin_culture: "印尼憲法精神與多民族國家立國核心。告誡旅人或移民，無論走到哪座島嶼，都要心懷謙卑，尊重當地部族規範與信仰習慣。",
    dialogue_example: "Saat berkunjung ke desa adat Toraja, ingatlah: di mana bumi dipijak, di situ langit dijunjung."
  },
  {
    id: "pb_07",
    id_phrase: "Bagai anjing dengan kucing",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "水火不容 / 冤家路窄 / 見面就吵架",
    literal_zh: "就像狗和貓一樣",
    origin_culture: "普世動物觀察。形容兄弟姐妹或同事性格嚴重不合，只要同處一室便會唇槍舌劍爭吵不斷。",
    dialogue_example: "Kedua saudara itu selalu bertengkar setiap hari bagai anjing dengan kucing."
  },
  {
    id: "pb_08",
    id_phrase: "Nasi sudah menjadi bubur",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "生米已煮成熟飯 / 木已成舟 / 悔恨於事無補",
    literal_zh: "白米飯已經熬成了稀粥",
    origin_culture: "源於印尼家庭飲食。一旦把飯煮成稀粥便無法還原。告誡人不必沉溺於過往的遺憾自責，不如思考如何配著鹹蛋把這碗粥吃得美味。",
    dialogue_example: "Sudahlah jangan disesali lagi, nasi sudah menjadi bubur, mari cari solusinya sekarang."
  },
  {
    id: "pb_09",
    id_phrase: "Sedikit-sedikit, lama-lama menjadi bukit",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "積少成多 / 聚沙成塔 / 滴水穿石",
    literal_zh: "一點一滴積累，日久天長也能堆成一座小山丘",
    origin_culture: "勤儉蓄財與語言學習的最高心法。每天背誦十個印尼單字，一年下來便能掌握三千單字！",
    dialogue_example: "Tabung uangmu seribu rupiah setiap hari, sedikit-sedikit lama-lama menjadi bukit."
  },
  {
    id: "pb_10",
    id_phrase: "Tak ada gading yang tak retak",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "人無完人，金無足赤 / 世事難臻絕對完美",
    literal_zh: "沒有任何一根珍貴象牙是毫無微小裂紋的",
    origin_culture: "自古蘇門答臘野象產出的象牙即為無價之寶，但若細察必有天然紋理。勸慰人們應寬容對待他人的小缺點與自身的不足。",
    dialogue_example: "Maafkan jika acara ini ada kekurangan, karena tak ada gading yang tak retak."
  },
  {
    id: "pb_11",
    id_phrase: "Sepandai-pandai tupai melompat, sekali waktu jatuh juga",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "智者千慮，必有一失 / 天網恢恢，疏而不漏",
    literal_zh: "松鼠再擅長跳躍穿梭於樹梢，總有一次會失足跌落地面",
    origin_culture: "熱帶雨林松鼠敏捷異常，但偶有失足。告誡技術純熟者不可傲慢自負，同時也指作惡者手法再高明終會露出馬腳。",
    dialogue_example: "Koruptor itu akhirnya tertangkap polisi, sepandai-pandai tupai melompat, sekali waktu jatuh juga."
  },
  {
    id: "pb_12",
    id_phrase: "Air beriak tanda tak dalam",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "浮躁喧囂說明底蘊淺薄 / 半調子最愛炫耀",
    literal_zh: "水面上泛起層層水波，說明水深很淺",
    origin_culture: "與「靜水流深」相對應。淺灘水流湍急喧鬧，深淵無聲無息。形容人若稍有一點小成就不斷宣傳，多半功力尚淺。",
    dialogue_example: "Dia banyak bicara tentang hal yang tak dipahaminya, persis air beriak tanda tak dalam."
  },
  {
    id: "pb_13",
    id_phrase: "Gajah di pelupuk mata tak tampak, kuman di seberang lautan tampak",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "嚴以律人，寬以待己 / 看到別人眼中的木屑，看不到自己眼中的梁木",
    literal_zh: "眼皮底下的大象視而不見，隔著汪洋大海的細菌卻看得一清二楚",
    origin_culture: "極具張力的南洋視覺諷刺。批評那些對自己的巨大過錯裝聾作啞，卻死咬他人細微小過失不放的偽善心態。",
    dialogue_example: "Kritiklah diri sendiri dulu sebelum menyalahkan orang lain, jangan gajah di pelupuk mata tak tampak."
  },
  {
    id: "pb_14",
    id_phrase: "Lain ladang lain belalang, lain lubuk lain ikannya",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "十里不同風，百里不同俗 / 各處鄉村各處例",
    literal_zh: "一塊農田有一種蚱蜢，一個水塘有一種游魚",
    origin_culture: "印尼由 17,000 座島嶼構成，爪哇文化講究含蓄，巴塔克人講究直爽。此句強調各地風俗法令截然不同，需因地制宜。",
    dialogue_example: "Aturan kerja di sini berbeda dengan kantormu dulu, lain ladang lain belalang."
  },
  {
    id: "pb_15",
    id_phrase: "Bagai air di daun talas",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "立場搖擺不定 / 牆頭草隨風倒 / 沒有主見",
    literal_zh: "就像落在芋頭葉片上的水珠",
    origin_culture: "芋頭葉片表面有疏水絨毛，水滴在上面滾來滾去無處依附。形容毫無定見、人云亦云的投機者。",
    dialogue_example: "Pendiriannya tidak teguh, selalu berubah-ubah bagai air di daun talas."
  },
  {
    id: "pb_16",
    id_phrase: "Menepuk air di dulang, terpercik muka sendiri",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "搬起石頭砸自己的腳 / 家醜外揚反自取其辱",
    literal_zh: "大力拍打淺盤裡的水，水花反倒濺了自己一臉",
    origin_culture: "在托盤淺盆中拍水必會反噬自身。告誡人勿在公眾面前揭露家人或朋友的隱私醜事，最後蒙羞的往往是自己。",
    dialogue_example: "Menjelek-jelekkan keluarga sendiri di media sosial itu sama saja menepuk air di dulang."
  },
  {
    id: "pb_17",
    id_phrase: "Malu bertanya sesat di jalan",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "不恥下問免入歧途 / 勤開口少走冤枉路",
    literal_zh: "若是害羞不敢問路，就會在路上迷失方向",
    origin_culture: "印尼人極其熱情友善，迷路時只需客氣稱一聲 Permisi Pak，對方定會傾囊指引。鼓勵學習者敢於開口詢問。",
    dialogue_example: "Kalau bingung dengan tugas kantor, tanyalah senior, jangan sampai malu bertanya sesat di jalan."
  },
  {
    id: "pb_18",
    id_phrase: "Sekali merengkuh dayung, dua tiga pulau terlampaui",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "事半功倍 / 划一次槳渡過兩三座島",
    literal_zh: "用力划動一次船槳，一連掠過兩三座小島嶼",
    origin_culture: "典型群島航海民族的智慧名言。比喻做一件事情同時帶來多重意想不到的豐碩回報。",
    dialogue_example: "Belajar bahasa Indonesia sambil traveling, sekali merengkuh dayung dua tiga pulau terlampaui."
  },
  // Modern Cultural Idioms (Ungkapan Gaul & Sehari-hari)
  {
    id: "pb_19",
    id_phrase: "Banting tulang",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "辛勤賣命打拚 / 汗流浹背苦幹",
    literal_zh: "摔碎骨頭",
    origin_culture: "形容為扶養一家老小，不惜付出全身勞力在烈日下揮汗奮鬥。",
    dialogue_example: "Ayah banting tulang siang malam demi menyekolahkan anak-anaknya."
  },
  {
    id: "pb_20",
    id_phrase: "Cuci mata",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "逛街看熱鬧 / 養眼放鬆 / 兜風休閒",
    literal_zh: "洗眼睛",
    origin_culture: "工作一整天盯著螢幕，週末去雅加達的大商場或海灘散步看看帥哥美女、琳瑯滿目的櫥窗。",
    dialogue_example: "Lagi penat nih, yuk jalan-jalan ke mall Grand Indonesia buat cuci mata!"
  },
  {
    id: "pb_21",
    id_phrase: "Buah tangan",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "伴手禮 / 旅遊土特產紀念品",
    literal_zh: "手結出的果實",
    origin_culture: "印尼社交禮節極其重視伴手禮，出遠門回來必帶當地的餅乾糕點（如 Lapis Legit 或 Pia）分送給親友同事。",
    dialogue_example: "Jangan lupa bawa buah tangan khas Bali ya saat pulang nanti."
  },
  {
    id: "pb_22",
    id_phrase: "Kambing hitam",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "替罪羔羊 / 代罪受過者",
    literal_zh: "黑色的山羊",
    origin_culture: "比喻事情搞砸或出現虧損時，被無辜推上風口浪尖背黑鍋的人。",
    dialogue_example: "Dia dijadikan kambing hitam atas kegagalan proyek perusahaan tersebut."
  },
  {
    id: "pb_23",
    id_phrase: "Kaki lima (Pedagang Kaki Lima - PKL)",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "路邊攤小吃 / 五腳基攤販",
    literal_zh: "五隻腳（兩隻人腳 + 三輪車架的三隻腳）",
    origin_culture: "源於英國萊佛士時期規定騎樓走廊需留五英尺寬 (Five feet way)，後引申為推著推車在騎樓擺攤的國民小吃攤。",
    dialogue_example: "Makan di pedagang kaki lima rasanya lebih otentik dan harganya murah."
  },
  {
    id: "pb_24",
    id_phrase: "Meja hijau",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "法庭 / 法院審判席",
    literal_zh: "綠色的桌子",
    origin_culture: "荷蘭殖民時代法官開庭時桌面上鋪著一塊深綠色厚呢絨布，因此法庭至今在報章上常被代稱為 Meja hijau。",
    dialogue_example: "Kasus sengketa tanah itu akhirnya dibawa ke meja hijau."
  },
  {
    id: "pb_25",
    id_phrase: "Jago merah",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "大火 / 火災 / 烈焰祝融",
    literal_zh: "紅色的鬥雞勇士",
    origin_culture: "南洋鬥雞風氣盛行，紅公雞英勇暴烈。印尼新聞中每逢火災必用 Si Jago Merah 代指吞噬一切的洶湧烈火。",
    dialogue_example: "Pasar tradisional itu ludes terbakar diamuk si jago merah semalam."
  },
  {
    id: "pb_26",
    id_phrase: "Makan angin",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "兜風吹風 / 外出散心散步",
    literal_zh: "吃風",
    origin_culture: "騎著機車在雅加達傍晚吹涼風，或是散步享受戶外空氣。",
    dialogue_example: "Malam minggu ayo kita naik motor keliling kota makan angin."
  },
  {
    id: "pb_27",
    id_phrase: "Kutu buku",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "書呆子 / 書蟲 / 熱愛讀書之人",
    literal_zh: "寄宿在書本裡的蟲子",
    origin_culture: "形容整日泡在圖書館或書房，對讀書極度著迷的學霸。",
    dialogue_example: "Sejak kecil dia kutu buku, tak heran pengetahuannya sangat luas."
  },
  {
    id: "pb_28",
    id_phrase: "Panjang tangan",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "手腳不乾淨 / 有偷竊惡習",
    literal_zh: "手很長",
    origin_culture: "形容喜歡順手牽羊、趁人不備偷竊他人財物的人。",
    dialogue_example: "Hati-hati dengan orang itu, dia terkenal panjang tangan."
  },
  {
    id: "pb_29",
    id_phrase: "Rendah hati",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "謙恭有禮 / 虛懷若谷 / 不驕不躁",
    literal_zh: "心放得很低",
    origin_culture: "印尼最推崇的國民美德，無論多麼富貴顯赫，心態始終維持在水平面之下謙和待人。",
    dialogue_example: "Meskipun sudah sukses jadi direktur, dia tetap rendah hati kepada semua orang."
  },
  {
    id: "pb_30",
    id_phrase: "Besar kepala",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "自高自大 / 趾高氣揚 / 目中無人",
    literal_zh: "頭變大了",
    origin_culture: "被誇獎幾句就飄飄然，自以為天下第一。與 rendah hati 形成強烈對比。",
    dialogue_example: "Jangan cepat besar kepala hanya karena dipuji bos sekali saja."
  },
  {
    id: "pb_31",
    id_phrase: "Bermuka dua",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "雙面人 / 兩面三刀 / 當面一套背後一套",
    literal_zh: "有兩張臉孔",
    origin_culture: "形容在眼前奉承討好，轉過身立刻在背後中傷造謠的不誠信之人。",
    dialogue_example: "Sulit percaya padanya karena dia suka bermuka dua di depan teman."
  },
  {
    id: "pb_32",
    id_phrase: "Mata keranjang",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "好色之徒 / 色瞇瞇的男人 / 狂蜂浪蝶",
    literal_zh: "像竹籃一樣的眼睛（見什麼都想裝進去）",
    origin_culture: "形容男性眼神飄忽不定，看見稍微漂亮的女生就垂涎三尺打歪主意。",
    dialogue_example: "Jauhi cowok itu, dia terkenal mata keranjang dan tidak setia."
  },
  {
    id: "pb_33",
    id_phrase: "Gigit jari",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "徒勞無功 / 大失所望 / 滿盤皆空",
    literal_zh: "咬著手指頭髮呆",
    origin_culture: "原本滿心期待能夠大賺一筆或獲得回報，結果落得一場空，只能失望地咬著手指興嘆。",
    dialogue_example: "Tiket konser habis dalam 1 menit, banyak penonton terpaksa gigit jari."
  },
  {
    id: "pb_34",
    id_phrase: "Gulung tikar",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "破產倒閉 / 歇業關門",
    literal_zh: "捲起地上的草蓆走人",
    origin_culture: "早期夜市或露天小吃攤擺攤用草蓆，生意若徹底垮台只能捲起草蓆打包收工回家。現多指商業公司破產宣告。",
    dialogue_example: "Akibat krisis ekonomi berkepanjangan, toko swalayan itu akhirnya gulung tikar."
  },
  {
    id: "pb_35",
    id_phrase: "Bicara empat mata",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "私下密談 / 面對面促膝長談",
    literal_zh: "四隻眼睛對視著談話",
    origin_culture: "指只有兩個人的閉門會面，不許任何第三者在場旁聽，通常用於商務機密或感情交心。",
    dialogue_example: "Bos ingin bicara empat mata dengan manajer keuangan besok pagi."
  },
  {
    id: "pb_36",
    id_phrase: "Naik daun",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "走紅 / 人氣爆棚 / 聲名大噪",
    literal_zh: "爬上葉子頂端",
    origin_culture: "形容藝人、歌手或網紅最近在社群媒體上爆紅，事業處於蒸蒸日上的黃金時期。",
    dialogue_example: "Grup musik indie itu sedang naik daun di kalangan anak muda Jakarta."
  },
  {
    id: "pb_37",
    id_phrase: "Tutup mulut",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "守口如瓶 / 保守秘密 / 封口不語",
    literal_zh: "把嘴巴閉緊",
    origin_culture: "指絕對不對外透露任何內幕消息或機密情資。",
    dialogue_example: "Dia disogok uang agar tutup mulut soal kasus penipuan itu."
  },
  {
    id: "pb_38",
    id_phrase: "Lapang dada",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "心胸寬廣 / 豁達大度 / 欣然接納批評或失敗",
    literal_zh: "胸膛很寬廣開闊",
    origin_culture: "指在競賽落敗或遭遇挫折時，毫無怨尤、坦蕩豁達地接受現實並祝賀對手。",
    dialogue_example: "Kandidat tersebut menerima hasil pemilu dengan lapang dada."
  },
  {
    id: "pb_39",
    id_phrase: "Cari muka",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "討好諂媚 / 拍馬屁爭表現",
    literal_zh: "到處找面子爭光彩",
    origin_culture: "形容在主管或老師面前刻意裝勤快表現，只為了博得好感而非真心付出。",
    dialogue_example: "Dia suka lembur cuma kalau ada bos, dasar tukang cari muka!"
  },
  {
    id: "pb_40",
    id_phrase: "Akal bulus",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "狡黠奸計 / 卑劣伎倆 / 陰險套路",
    literal_zh: "像水獺一樣狡詐的智謀",
    origin_culture: "南洋水獺機敏狡詐，此語專指為了個人私利而設計損人利己的卑劣手段。",
    dialogue_example: "Jangan terpengaruh oleh akal bulus sales nakal yang menawarkan investasi bodong."
  },
  {
    id: "pb_41",
    id_phrase: "Gelar tikar",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "就地鋪蓆野餐 / 隨處露天小聚",
    literal_zh: "展開竹蓆草蓆",
    origin_culture: "印尼著名的 Lesehan 文化，在路邊或公園鋪上一張蓆子，大家盤腿而坐喝茶暢聊。",
    dialogue_example: "Malam ini kita gelar tikar di depan Monas sambil minum kopi jahe hangat."
  },
  {
    id: "pb_42",
    id_phrase: "Bintang lapangan",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "球場之星 / 風雲人物 / 全場焦點",
    literal_zh: "球場草地上的耀眼明星",
    origin_culture: "形容羽球或足球場上技壓群雄、球風精湛的最佳球員。",
    dialogue_example: "Pemain muda bulu tangkis itu menjadi bintang lapangan di turnamen Indonesia Open."
  },
  {
    id: "pb_43",
    id_phrase: "Murah senyum",
    category: "humility",
    category_zh: "謙遜待人接物",
    zh_meaning: "親切近人 / 笑容可掬",
    literal_zh: "微笑很便宜（不吝惜給出笑容）",
    origin_culture: "印尼被評為全球微笑指數最高的國家之一，形容待人親和自然熱情。",
    dialogue_example: "Pelayan di kafe itu sangat murah senyum sehingga pengunjung merasa nyaman."
  },
  {
    id: "pb_44",
    id_phrase: "Tebal muka",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "厚顏無恥 / 臉皮厚不怕丟臉",
    literal_zh: "臉皮很厚",
    origin_culture: "形容毫無羞恥心，即使被當面拆穿謊言依然面不改色。",
    dialogue_example: "Dia tebal muka sekali meminjam uang lagi padahal utang lamanya belum lunas."
  },
  {
    id: "pb_45",
    id_phrase: "Bunga desa",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "村花 / 鄉村第一大美女",
    literal_zh: "村莊裡綻放的花朵",
    origin_culture: "形容鄉村小鎮裡最引人注目、純潔美麗的未婚姑娘。",
    dialogue_example: "Gadis yang ramah dan anggun itu dijuluki bunga desa di kampungnya."
  },
  {
    id: "pb_46",
    id_phrase: "Ringan tangan",
    category: "wisdom",
    category_zh: "人生處世智慧",
    zh_meaning: "熱心助人 / 樂於行善 (或指愛動手打人，視語境而定)",
    literal_zh: "手很輕巧不沉重",
    origin_culture: "在正向語境中指看見鄰舍有難立刻上前幫忙搭把手的好心人。",
    dialogue_example: "Budi sangat ringan tangan, selalu siap menolong tetangga yang sedang renovasi rumah."
  },
  {
    id: "pb_47",
    id_phrase: "Mati kutu",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "束手無策 / 動彈不得 / 毫無還手之力",
    literal_zh: "跳蚤蝨子都死光了",
    origin_culture: "形容平時囂張跋扈的人突然遭遇鐵證如山的質問，瞬間啞口無言無計可施。",
    dialogue_example: "Saat bukti kebohongannya diungkap polisi, koruptor itu langsung mati kutu."
  },
  {
    id: "pb_48",
    id_phrase: "Angkat kaki",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "收拾包袱離開 / 走人出走",
    literal_zh: "抬起腳邁步",
    origin_culture: "指從某處住所或職位離開，不再留戀。",
    dialogue_example: "Karena perselisihan dengan pemilik kos, dia memutuskan angkat kaki kemarin."
  },
  {
    id: "pb_49",
    id_phrase: "Ketinggalan zaman",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "落伍過時 / 跟不上時代步伐",
    literal_zh: "被時代遠遠拋在後面",
    origin_culture: "指觀念保守老舊或不使用現代智慧型手機行動支付的人事物。",
    dialogue_example: "Kalau tidak belajar teknologi kecerdasan buatan, kita bisa ketinggalan zaman."
  },
  {
    id: "pb_50",
    id_phrase: "Hancur lebur",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "粉身碎骨 / 徹底破碎瓦解 / 肝腸寸斷",
    literal_zh: "粉碎並熔化殆盡",
    origin_culture: "常用於形容深愛之人背叛後的悲痛心靈，或被強大力量徹底摧毀的物體。",
    dialogue_example: "Hatinya hancur lebur saat mengetahui kenyataan pahit tersebut."
  },
  {
    id: "pb_51",
    id_phrase: "Keras kepala",
    category: "conduct",
    category_zh: "言行謹慎警世",
    zh_meaning: "死腦筋 / 頑固不化 / 冥頑不靈",
    literal_zh: "頭硬得像石頭",
    origin_culture: "形容無論旁人如何苦口婆心規勸，依然堅持自己錯誤立場的死板性格。",
    dialogue_example: "Jangan terlalu keras kepala, dengarkanlah saran dari dokter spesialis."
  },
  {
    id: "pb_52",
    id_phrase: "Banting harga",
    category: "idioms",
    category_zh: "當代高頻文化片語",
    zh_meaning: "跳樓大拍賣 / 瘋狂削價競爭",
    literal_zh: "把價格狠狠砸在地上",
    origin_culture: "在電商雙 11 或開齋節前夕，商家為衝高營業額大幅砍價降價促銷。",
    dialogue_example: "Banyak toko online banting harga menjelang perayaan Hari Raya Idul Fitri."
  }
];

// =========================================================================
// 3. EVERYDAY SENTENCES (128 FUNCTIONAL SENTENCES ACROSS 10 DIMENSIONS)
// =========================================================================
const everyday_sentences = [
  // 1. 問候與日常搭話 (Greetings & Icebreakers)
  {
    id: "es_01",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Selamat pagi! Bagaimana kabar Anda hari ini?",
    zh_text: "早安！您今天過得好嗎？",
    breakdown: "Selamat(祝平安) + pagi(早上) + Bagaimana kabar(近況如何) + Anda(您) + hari ini(今天)",
    tip: "印尼最標準、最禮貌的晨間問候。"
  },
  {
    id: "es_02",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Halo Kak! Mau ke mana nih?",
    zh_text: "哈囉帥哥/美女！這是要去哪裡呀？",
    breakdown: "Halo + Kak(平輩尊稱) + Mau ke mana(去哪) + nih(口語助詞)",
    tip: "印尼最具人情味的招呼語，並非查探隱私，相當於中文「吃飽沒」。"
  },
  {
    id: "es_03",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Sudah lama tidak bertemu ya, makin sukses aja!",
    zh_text: "好久不見了耶，越來越成功事業發達喔！",
    breakdown: "Sudah lama(已經很久) + tidak bertemu(沒見面) + makin sukses(越發成功)",
    tip: "巧遇老朋友時極致好人緣的開場白！"
  },
  {
    id: "es_04",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Kenalkan, nama saya Kevin, saya berasal dari Taiwan.",
    zh_text: "自我介紹一下，我叫 Kevin，我來自台灣。",
    breakdown: "Kenalkan(請認識一下) + nama saya(我的名字) + berasal dari(來自於)",
    tip: "社交見面時落落大方的標準自我介紹句式。"
  },
  {
    id: "es_05",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Senang sekali bisa berkenalan dengan Anda sekalian.",
    zh_text: "非常榮幸能夠認識各位大家！",
    breakdown: "Senang sekali(非常高興) + bisa berkenalan(能相識) + dengan Anda sekalian(與各位)",
    tip: "正式商務聚會致詞或見面時的體面禮儀句。"
  },
  {
    id: "es_06",
    category: "greeting",
    category_zh: "問候打招呼",
    id_text: "Lagi sibuk apa sekarang? Tetap semangat ya!",
    zh_text: "最近都在忙些什麼呢？要繼續加油保持活力喔！",
    breakdown: "Lagi sibuk apa(正在忙啥) + sekarang(現在) + Tetap semangat(保持元氣奮鬥)",
    tip: "Tetap semangat 是印尼人最愛相互打氣的國民正能量短句。"
  },

  // 2. 道謝、道歉與應對 (Thanks & Apologies)
  {
    id: "es_07",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Terima kasih banyak atas segala bantuan dan kebaikan Anda.",
    zh_text: "非常感謝您給予的一切幫助與善意關照。",
    breakdown: "Terima kasih banyak(萬分感謝) + atas segala bantuan(為了所有援助) + dan kebaikan(與善意)",
    tip: "向長輩、上司或房東表達深度謝意時最莊重的句型。"
  },
  {
    id: "es_08",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Sama-sama, dengan senang hati!",
    zh_text: "不客氣，這是我非常樂意效勞的！",
    breakdown: "Sama-sama(不客氣) + dengan senang hati(帶著愉快的心情/我的榮幸)",
    tip: "回答 Terima kasih 時，比單純的 Sama-sama 更加熱情溫暖。"
  },
  {
    id: "es_09",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Maaf merepotkan Anda, saya benar-benar tidak enak hati.",
    zh_text: "抱歉給您添麻煩了，我心裡真的過意不去。",
    breakdown: "Maaf(抱歉) + merepotkan(添麻煩) + tidak enak hati(心裡過意不去)",
    tip: "麻煩他人幫忙搬行李或指路時的極致客氣句式。"
  },
  {
    id: "es_10",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Gak apa-apa kok, santai aja!",
    zh_text: "沒關係的啦，放輕鬆別介意！",
    breakdown: "Gak apa-apa(沒什麼) + kok(安撫助詞) + santai aja(放輕鬆即可)",
    tip: "同輩朋友向你道歉時最道地自在的安撫回應。"
  },
  {
    id: "es_11",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Permisi Bapak, numpang tanya sebentar boleh?",
    zh_text: "不好意思先生，借問一下可以嗎？",
    breakdown: "Permisi(借過/打擾) + numpang tanya(順便借問) + sebentar boleh(稍微一下可否)",
    tip: "在街頭或公共場合開口問路搭訕的第一黃金禮貌句！"
  },
  {
    id: "es_12",
    category: "thanks_apology",
    category_zh: "道謝與道歉",
    id_text: "Mohon maaf lahir dan batin.",
    zh_text: "祈求寬恕身心一切過犯與不周之處。(開齋節最高祝福)",
    breakdown: "Mohon maaf(祈求原諒) + lahir(身外言語) + dan batin(內心所思)",
    tip: "印尼最盛大的開齋節 (Lebaran) 期間全民必說的寬恕與祝福金句。"
  },

  // 3. 詢問方向與交通問路 (Directions & Travel)
  {
    id: "es_13",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Permisi, stasiun MRT terdekat ada di sebelah mana ya?",
    zh_text: "不好意思，請問最近的捷運 MRT 站在哪個方向呢？",
    breakdown: "stasiun MRT(捷運站) + terdekat(最近的) + di sebelah mana(在哪個方位)",
    tip: "在雅加達市區尋找現代軌道交通的神句。"
  },
  {
    id: "es_14",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Jalan lurus terus sekitar dua ratus meter, lalu belok kanan di perempatan.",
    zh_text: "一直直走大約兩百公尺，然後在十字路口右轉。",
    breakdown: "Jalan lurus(直走) + sekitar 200m(約兩百米) + lalu(然後) + belok kanan(右轉) + di perempatan(十字路口)",
    tip: "掌握 lurus (直走)、belok kiri (左轉)、belok kanan (右轉)。"
  },
  {
    id: "es_15",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Pak sopir, tolong berhenti di depan lobi hotel ya.",
    zh_text: "司機大哥，請在飯店大廳前面停車喔。",
    breakdown: "Pak sopir(司機先生) + tolong berhenti(請停下) + di depan lobi hotel(在飯店大廳前)",
    tip: "搭乘 Bluebird 計程車或 GrabCar 抵達目的地時告知停靠點。"
  },
  {
    id: "es_16",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Apakah jalanan ke bandara sedang macet parah hari ini?",
    zh_text: "今天前往機場的道路現在塞車非常嚴重嗎？",
    breakdown: "jalanan ke bandara(去機場的路) + sedang macet parah(正塞得一塌糊塗)",
    tip: "雅加達與峇里島塞車時段必備句，可評估是否需改搭機場快鐵。"
  },
  {
    id: "es_17",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Kira-kira berapa menit lagi kita sampai di tujuan?",
    zh_text: "我們大約還要幾分鐘才會抵達目的地呢？",
    breakdown: "Kira-kira(大概) + berapa menit lagi(還差幾分鐘) + sampai di tujuan(抵達目的地)",
    tip: "向司機確認剩餘行車時間的客氣問法。"
  },
  {
    id: "es_18",
    category: "directions",
    category_zh: "交通與方向",
    id_text: "Saya tersesat nih, bisa tunjukkan jalannya di Google Maps?",
    zh_text: "我迷路了，可以在 Google 地圖上指給我看方向嗎？",
    breakdown: "Saya tersesat(我迷路了) + tunjukkan jalannya(展示路線)",
    tip: "遇到熱心路人時直接遞出手機地圖指認最直觀有效。"
  },

  // 4. 餐廳點餐與飲食喜好 (Dining & Taste Preferences)
  {
    id: "es_19",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Mas, minta menunya dong. Ada rekomendasi makanan yang paling enak di sini?",
    zh_text: "服務生小哥，麻煩給我菜單！這裡有最推薦好吃的特色菜嗎？",
    breakdown: "minta menunya dong(請給菜單嘛) + Ada rekomendasi(有推薦嗎) + paling enak(最美味)",
    tip: "入座後點餐最俐落順口的問候方式。"
  },
  {
    id: "es_20",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Saya pesan Nasi Goreng Spesial satu, tolong sambalnya dipisah ya!",
    zh_text: "我要點一份特製炒飯，辣椒醬請另外裝小碟子放喔！",
    breakdown: "pesan(點餐) + sambalnya dipisah(辣椒醬被分開放)",
    tip: "不習慣吃超大辣的華人旅客在印尼點餐最重要的「保命金句」！"
  },
  {
    id: "es_21",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Minta es teh manis satu, tapi gulanya sedikit saja ya (less sugar).",
    zh_text: "請給我一杯冰甜茶，但是糖加一點點就好 (少糖微糖)。",
    breakdown: "es teh manis(冰甜茶) + gulanya sedikit saja(糖一點點就好)",
    tip: "印尼預設甜茶非常甜，想喝清爽少糖務必交代 gulanya sedikit saja。"
  },
  {
    id: "es_22",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Makanan ini rasanya luar biasa mantap, gurih dan renyah!",
    zh_text: "這道料理的味道簡直太讚了，鮮香又香脆！",
    breakdown: "rasanya luar biasa(味道非凡) + mantap(讚絕了) + gurih(鮮醇濃郁) + renyah(酥脆)",
    tip: "Gurih 是印尼菜特有的「椰漿與香料交織的濃郁香氣」，誇獎主廚最佳單字。"
  },
  {
    id: "es_23",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Mas, minta bon pembayarannya ya. Bisa split bill nggak?",
    zh_text: "小哥，麻煩結帳單喔。可以各自分開拆帳算嗎？",
    breakdown: "minta bon(要帳單) + split bill(分開拆帳) + nggak(可以嗎)",
    tip: "聚會用餐完畢後向店員索取帳單與拆帳的標準口語。"
  },
  {
    id: "es_24",
    category: "restaurant",
    category_zh: "餐廳飲食與客製",
    id_text: "Saya ada alergi kacang dan seafood, tolong jangan dimasukkan ya.",
    zh_text: "我對花生與海鮮過敏，請千萬不要放進去喔。",
    breakdown: "alergi kacang(花生過敏) + seafood(海鮮) + jangan dimasukkan(請勿放入)",
    tip: "印尼沙嗲與溫沙拉常用花生醬 (Bumbu kacang)，過敏者務必事前告知。"
  },

  // 5. 商店購物與結帳議價 (Shopping & Payment)
  {
    id: "es_25",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Baju batik ini bagus banget, harganya berapa ya Bu?",
    zh_text: "這件蠟染花布衣服好漂亮，請問價格是多少呢老闆娘？",
    breakdown: "Baju batik(蠟染衣服) + bagus banget(美極了) + harganya berapa(價格多少)",
    tip: "逛市場時先稱讚商品再詢價，老闆心情好容易給折扣。"
  },
  {
    id: "es_26",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Aduh agak mahal ya, boleh kurang sedikit dong? Buat penglaris nih!",
    zh_text: "哎呀有點小貴耶，可以算便宜一點點嘛？當作開市好彩頭啦！",
    breakdown: "agak mahal(稍微貴) + boleh kurang sedikit(能便宜點嗎) + penglaris(開市好運成交)",
    tip: "Penglaris 是印尼攤販深信「早市第一筆生意順利開張會帶來全天好運」的神秘文化心法！"
  },
  {
    id: "es_27",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Kalau saya ambil dua potong, dapat harga pas berapa?",
    zh_text: "如果我一次拿兩件，底價能算多少？",
    breakdown: "ambil dua potong(拿兩件) + harga pas(不二價底價)",
    tip: "以量制價時探詢老闆最終底價 (harga pas) 的乾脆問法。"
  },
  {
    id: "es_28",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Di sini bisa bayar pakai QRIS, kartu kredit, atau cuma uang tunai?",
    zh_text: "這裡可以刷 QRIS 掃碼、信用卡，還是只能用現金？",
    breakdown: "QRIS(統一條碼) + kartu kredit(信用卡) + cuma uang tunai(只有現金)",
    tip: "印尼目前近乎全民普及 QRIS 掃碼，但路邊傳統小攤有時仍偏好現金。"
  },
  {
    id: "es_29",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Tidak usah pakai kantong plastik Kak, saya bawa tas belanja sendiri.",
    zh_text: "不用套塑膠袋喔美女，我自己有帶環保購物袋。",
    breakdown: "tidak usah(不用) + kantong plastik(塑膠袋) + tas belanja sendiri(自己的購物袋)",
    tip: "印尼許多城市（如雅加達、峇里島）已全面禁用一次性塑膠袋。"
  },
  {
    id: "es_30",
    category: "shopping",
    category_zh: "購物議價與支付",
    id_text: "Apakah barang ini ada garansi resmi dan bisa ditukar kalau rusak?",
    zh_text: "這件商品有原廠官方保固嗎？如果壞了可以換貨嗎？",
    breakdown: "garansi resmi(官方保固) + bisa ditukar(可以調換) + kalau rusak(如果損壞)",
    tip: "購買手機充電線、家電或電子產品時的必備售後保障句。"
  },

  // 6. 社交聚會與交友聊天 (Socializing & Friendship)
  {
    id: "es_31",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Nanti malam ada waktu luang nggak? Nongkrong bareng di kafe yuk!",
    zh_text: "今晚有空閒時間嗎？一起去咖啡廳聚會混聊喝咖啡啦！",
    breakdown: "waktu luang(空閒時間) + nongkrong bareng(一起混聚會) + yuk(走吧語氣詞)",
    tip: "邀約印尼年輕朋友最受歡迎、最接地氣的日常約法。"
  },
  {
    id: "es_32",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Boleh minta kontak WhatsApp atau akun Instagram kamu?",
    zh_text: "可以跟你互加個 WhatsApp 聯絡方式或 Instagram 帳號嗎？",
    breakdown: "minta kontak(要聯絡方式) + akun Instagram(IG 帳號)",
    tip: "WhatsApp (WA) 與 Instagram (IG) 是印尼人最核心的日常社交工具。"
  },
  {
    id: "es_33",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Wah, gaya berpakaianmu hari ini estetik dan keren banget!",
    zh_text: "哇，你今天的穿搭風格也太有美感、太帥太好看了吧！",
    breakdown: "gaya berpakaian(穿衣風格) + estetik(文青美學) + keren banget(超級酷帥)",
    tip: "稱讚對方的穿搭拍照，能瞬間引發對方的熱情共鳴！"
  },
  {
    id: "es_34",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Santai aja, anggap saja seperti di rumah sendiri ya.",
    zh_text: "放輕鬆別客氣，就把這裡當成自己家一樣自在喔。",
    breakdown: "anggap saja(就當作) + seperti di rumah sendiri(像在自己家裡)",
    tip: "印尼主人招待朋友到家裡做客時展現最高待客熱忱的溫馨語句。"
  },
  {
    id: "es_35",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Kamu aslinya orang mana? Sudah berapa lama tinggal di Jakarta?",
    zh_text: "你老家原本是哪裡人呢？已經在雅加達住多久了？",
    breakdown: "aslinya orang mana(老家哪人) + sudah berapa lama tinggal(住多久了)",
    tip: "雅加達大多是外島或各省前來打拚的漂鳥移民，此話非常容易開啟話題。"
  },
  {
    id: "es_36",
    category: "social",
    category_zh: "社交聚會與休閒",
    id_text: "Kapan-kapan mampir ke tempatku ya, kita ngobrol santai sambil ngopi!",
    zh_text: "改天順道來我這坐坐喔，我們邊喝咖啡邊悠哉聊天！",
    breakdown: "Kapan-kapan(改天/有空時) + mampir(順道造訪) + ngobrol santai(悠哉閒聊) + ngopi(喝咖啡)",
    tip: "Ngopi (喝咖啡) 是印尼動詞化的經典口語，代表社交聚會的代名詞。"
  },

  // 7. 委婉拒絕與表達看法 (Polite Declines & Opinions)
  {
    id: "es_37",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Terima kasih banyak atas undangannya, tapi maaf sekali saya sudah ada janji lain.",
    zh_text: "非常感謝您的盛情邀約，但真的很抱歉我已經有其他約定在先了。",
    breakdown: "undangannya(邀約) + tapi maaf sekali(但極抱歉) + janji lain(其他約會/約定)",
    tip: "印尼文化極度講究面子，拒絕時務必先由衷道謝再委婉說明撞期。"
  },
  {
    id: "es_38",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Menurut pendapat saya pribadi, solusi ini mungkin sedikit berisiko.",
    zh_text: "依據我個人的看法，這個解決方案可能稍嫌冒險了些。",
    breakdown: "Menurut pendapat saya(依我之見) + pribadi(個人) + sedikit berisiko(有點風險)",
    tip: "會議上提出反對意見時，加上 pribadi 與 mungkin 能維持和諧氛圍。"
  },
  {
    id: "es_39",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Saya kurang setuju dengan ide tersebut, bagaimana kalau kita pertimbangkan opsi lain?",
    zh_text: "我對那個想法稍持保留意見，要不要考慮看看其他替代選項呢？",
    breakdown: "kurang setuju(不太贊同) + pertimbangkan opsi lain(考慮其他選項)",
    tip: "用 kurang setuju (不太同意) 替代 tidak setuju，更具外交修養。"
  },
  {
    id: "es_40",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Aduh maaf ya, untuk saat ini saya sepertinya belum bisa bantu.",
    zh_text: "哎呀不好意思喔，就目前而言我好像還沒辦法幫上忙呢。",
    breakdown: "untuk saat ini(就目前) + sepertinya belum bisa bantu(貌似尚無法相助)",
    tip: "委婉推辭借錢或額外勞務請求的柔性防禦話術。"
  },
  {
    id: "es_41",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Boleh saya pikir-pikir dulu semalam ya? Besok saya kabari keputusannya.",
    zh_text: "我可以先考慮琢磨一晚嗎？明天我再通知您決定結果。",
    breakdown: "pikir-pikir dulu(先多想想) + semalam(一晚) + besok saya kabari(明天我通知告知)",
    tip: "不想當場衝動簽約或答應要求時的最佳緩衝拖延妙法。"
  },
  {
    id: "es_42",
    category: "polite_decline",
    category_zh: "委婉拒絕與觀點",
    id_text: "Wah menarik sekali, tapi sayang anggaran kami saat ini sedang terbatas.",
    zh_text: "哇企劃非常吸引人，但可惜我們目前這期預算相當吃緊有限。",
    breakdown: "menarik sekali(非常吸引人) + sayang(可惜) + anggaran terbatas(預算受限)",
    tip: "商務採購砍價或拒絕推銷的標準體面托詞。"
  },

  // 8. 辦公職場與遠距溝通 (Office & Remote Work)
  {
    id: "es_43",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Selamat siang Pak, saya ingin mengkonfirmasi jadwal rapat kerja untuk besok pagi.",
    zh_text: "經理午安，我想確認一下明天早上的工作會議行程時段。",
    breakdown: "mengkonfirmasi(確認) + jadwal rapat kerja(工作會議日程) + besok pagi(明早)",
    tip: "職場中向上司或客戶確認開會時間的標準公務對話。"
  },
  {
    id: "es_44",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Laporan kemajuan proyek sudah saya kirimkan via email, mohon dicek ya.",
    zh_text: "專案進度報告我已經透過電子郵件寄出，麻煩您查閱過目喔。",
    breakdown: "Laporan kemajuan proyek(專案進度報告) + sudah saya kirimkan(已被我寄出) + mohon dicek(請查核)",
    tip: "被動句式 sudah saya kirimkan 與 mohon dicek 是印尼公文寫作常客。"
  },
  {
    id: "es_45",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Suara Anda agak putus-putus nih, bisa tolong ulangi kalimat terakhir?",
    zh_text: "您的聲音聽起來稍微斷斷續續的耶，可以麻煩重複最後一句話嗎？",
    breakdown: "Suara(聲音) + agak putus-putus(有點斷斷續續) + ulangi kalimat terakhir(重複最後一句話)",
    tip: "線上 Zoom 或 Google Meet 開會連線不穩時最實用的溝通救星句。"
  },
  {
    id: "es_46",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Batas waktu pengumpulan tugas ini adalah hari Jumat pukul lima sore.",
    zh_text: "這項任務提交的最後截止期限是本週五下午五點整。",
    breakdown: "Batas waktu pengumpulan(提交截止日) + pukul lima sore(下午五點整)",
    tip: "Batas waktu 或 Deadline 是職場交辦任務的核心明確界限。"
  },
  {
    id: "es_47",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Mari kita cari solusi win-win yang saling menguntungkan kedua belah pihak.",
    zh_text: "讓我們共同找尋互利雙贏、對雙方皆大歡喜的折衷解方吧！",
    breakdown: "solusi win-win(雙贏方案) + saling menguntungkan(彼此獲利互惠) + kedua belah pihak(雙方)",
    tip: "合約談判或化解商務分歧時展現最高誠意的高格局發言。"
  },
  {
    id: "es_48",
    category: "workplace",
    category_zh: "商務辦公與遠距",
    id_text: "Terima kasih atas kerja sama tim yang luar biasa solid dalam proyek ini!",
    zh_text: "非常感謝團隊在這次專案中展現出如此超凡團結的默契合作！",
    breakdown: "kerja sama tim(團隊合作) + luar biasa solid(格外堅實團結)",
    tip: "專案大功告成後在團隊大群組激勵士氣的暖心結語。"
  },

  // 9. 醫療就診與緊急求助 (Health & Emergency)
  {
    id: "es_49",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Dokter, kepala saya pusing sekali dan badan terasa demam sejak semalam.",
    zh_text: "醫生，我頭痛得非常厲害，而且從昨晚開始身體一直覺得在發燒。",
    breakdown: "kepala saya pusing(我頭暈痛) + badan terasa demam(身體感覺發燒) + sejak semalam(昨晚起)",
    tip: "向診所或醫院急診室主治醫師陳述病狀的標準精確句。"
  },
  {
    id: "es_50",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Tolong saya! Ada pencuri yang mengambil tas saya di halte bus!",
    zh_text: "救命啊！有小偷在公車候車亭搶走了我的包包！",
    breakdown: "Tolong saya(救命幫我) + pencuri(小偷) + mengambil tas(拿走包包) + halte bus(公車站)",
    tip: "在公共危難情況下呼救時最有力短促的高頻用語。"
  },
  {
    id: "es_51",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Apakah ada apotek 24 jam terdekat dari sini? Saya butuh obat masuk angin.",
    zh_text: "這附近有 24 小時營業的藥局嗎？我急需要著涼感冒脹氣藥 (Tolak Angin)。",
    breakdown: "apotek 24 jam(24小時藥局) + butuh obat masuk angin(需要著涼藥草藥)",
    tip: "Masuk angin 是印尼特有的「受涼脹氣無力感」，找藥局必備句。"
  },
  {
    id: "es_52",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Pak Polisi, saya ingin membuat laporan kehilangan paspor dan dompet.",
    zh_text: "警察先生，我想辦理報案遺失護照與錢包的警方證明報案單。",
    breakdown: "membuat laporan kehilangan(製作遺失報告報案單) + paspor dan dompet(護照與皮夾)",
    tip: "護照遺失若需補辦旅行證件，必須出示警局開立的 Surat Kehilangan。"
  },
  {
    id: "es_53",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Tolong panggilkan mobil ambulans segera, ada orang pingsan di sini!",
    zh_text: "請快點幫忙叫救護車過來，這裡有人昏倒失去知覺了！",
    breakdown: "panggilkan ambulans(叫救護車) + segera(立即火速) + orang pingsan(昏倒的人)",
    tip: "面臨生命垂危路見不平時緊急呼救之救命句。"
  },
  {
    id: "es_54",
    category: "emergency",
    category_zh: "醫療健康與應急",
    id_text: "Bagaimana aturan minum obat ini, diminum sebelum atau sesudah makan?",
    zh_text: "這款藥物的服用規則是怎樣？是在飯前吃還是飯後吃呢？",
    breakdown: "aturan minum obat(吃藥規則) + sebelum(之前) + atau sesudah makan(或飯後)",
    tip: "在藥局拿藥時向藥劑師核對用藥安全的最關鍵問句。"
  },

  // 10. 數位網購、外送與社群 (Digital Life & Apps)
  {
    id: "es_55",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Driver Gojek sudah sampai di titik penjemputan, yuk kita keluar sekarang.",
    zh_text: "Gojek 司機已經抵達預約接送上車點了，我們現在快步走出去吧。",
    breakdown: "Driver Gojek(司機) + sudah sampai(已到達) + titik penjemputan(接駁圖釘點)",
    tip: "跟同行夥伴核對出行狀態時最道地的用詞。"
  },
  {
    id: "es_56",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Tolong titipkan paket belanja online saya di pos satpam depan perumahan ya.",
    zh_text: "麻煩把我的網購包裹寄放在社區住宅大門口的警衛警衛室喔。",
    breakdown: "titipkan paket(寄放包裹) + pos satpam(警衛警衛室) + depan perumahan(住宅區前)",
    tip: "出門在外接送外送包裹時在通訊軟體傳給快遞員的神句。"
  },
  {
    id: "es_57",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Jangan lupa klaim voucher gratis ongkir sebelum checkout di Tokopedia!",
    zh_text: "在 Tokopedia 結帳下單前，別忘了先領取免運費優惠折價券喔！",
    breakdown: "klaim voucher(領取折價券) + gratis ongkir(免運費) + sebelum checkout(結帳前)",
    tip: "印尼電商蝦皮與 Tokopedia 網購族每天掛在嘴邊的省錢口訣。"
  },
  {
    id: "es_58",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Baterai HP saya tinggal lima persen, ada yang bawa power bank dan kabel charger?",
    zh_text: "我手機電量只剩下百分之五了，有人帶行動電源和充電線嗎？",
    breakdown: "Baterai HP tinggal 5%(手機電量剩5%) + bawa power bank(帶行充) + kabel charger(充電線)",
    tip: "在外手機沒電危機時向身旁同行好友呼救的必備句。"
  },
  {
    id: "es_59",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Kirim bukti transfer pembayaran via WhatsApp ya, biar langsung diproses.",
    zh_text: "請把銀行轉帳匯款明細截圖透過 WhatsApp 傳給我喔，好讓訂單能直接開始處理。",
    breakdown: "bukti transfer(轉帳收據/明細) + via WhatsApp + biar langsung diproses(以便立即處理)",
    tip: "印尼個人網購或訂房時，賣家最常交代的一句確認款項步驟。"
  },
  {
    id: "es_60",
    category: "digital_life",
    category_zh: "數位生活與外送",
    id_text: "Konten video TikTok terbarumu fyp parah, viral banget di mana-mana!",
    zh_text: "你最新拍的那部 TikTok 短影片大爆紅上了首頁，到處都被瘋狂轉發傳閱耶！",
    breakdown: "fyp parah(瘋狂上For You Page推薦) + viral banget(超級病毒式瘋傳)",
    tip: "年輕世代自媒體社群交流時最酷炫的稱讚金句。"
  }
];

// Merge into existing curriculum
curriculum.grammar_modules = grammar_modules;
curriculum.peribahasa_list = peribahasa_list;
curriculum.everyday_sentences = everyday_sentences;

// Update metadata
if (!curriculum.meta) curriculum.meta = {};
curriculum.meta.version = "4.0.0";
curriculum.meta.title = "Indo Learning Hub - 頂級印尼語自學旗艦系統 (BIPA A1-C2 全面覆蓋)";
curriculum.meta.features_count = {
  grammar_modules: grammar_modules.length,
  peribahasa: peribahasa_list.length,
  everyday_sentences: everyday_sentences.length,
  situational_modules: curriculum.situational_modules?.length || 30,
  cities_guide: curriculum.cities_guide?.length || 10,
  scenarios_mastery: curriculum.scenarios_mastery?.length || 7
};

// Write updated data.json
fs.writeFileSync(dataJsonPath, JSON.stringify(existingData, null, 2), 'utf8');
console.log('✅ Successfully updated data.json with 16 grammar modules, 52 peribahasa, and 60+ everyday sentences!');
