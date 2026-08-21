const fs = require('fs');
const path = require('path');

const curriculumData = {
  curriculum: {
    meta: {
      title: "Indo Learning Hub - 從零基礎到日常會話 (BIPA 標準 x Viet 專案深度對標)",
      description: "遵循 BIPA 標準與 TUFS 語言模組，融合雅加達/泗水雙城方言、中印雙語朗讀、人稱稱謂計算器與智能跟讀評分系統",
      version: "3.2.0"
    },
    
    // ==========================================
    // 0. 字母與發音 (Alfabet & Fonetik)
    // ==========================================
    alphabet_module: {
      overview: {
        title: "印尼語字母與發音特點 (Alfabet Bahasa Indonesia)",
        description: "印尼語使用 26 個拉丁字母，基本上「怎麼寫就怎麼唸」，沒有複雜的拼寫陷阱，且沒有聲調！",
        tips: [
          "重音原則：絕大多數印尼語單字的重音落在「倒數第二個音節」 (Penultimate syllable)，例如：sa-ya, ma-kan, be-la-jar。",
          "無聲調：不像中文或越南文有四聲六調，音調平穩自然即可。",
          "拼讀規則：以子音+母音為基礎拼讀，看到字母即可直讀。"
        ]
      },
      letters: [
        { letter: "A", name: "a", ipa: "/a/", example: "Ada", zh: "有 / 存在", note: "發音如中文「啊」" },
        { letter: "B", name: "be", ipa: "/b/", example: "Buku", zh: "書本", note: "雙唇爆破音，如「ㄅ」" },
        { letter: "C", name: "ce", ipa: "/tʃ/", example: "Cinta", zh: "愛", note: "⚠️ 特別注意！發音如「七/吃」(ch)，絕不發 /k/ 或 /s/" },
        { letter: "D", name: "de", ipa: "/d/", example: "Dan", zh: "和 / 與", note: "舌尖齒齦音，如「ㄉ」" },
        { letter: "E (pepet)", name: "e", ipa: "/ə/", example: "Empat", zh: "四", note: "弱讀音，發音如英文 'ago' 的 a 或中文輕聲「ㄜ」" },
        { letter: "E (taling)", name: "e", ipa: "/e/", example: "Bebek", zh: "鴨子", note: "清晰強音，發音如中文注音「ㄝ」" },
        { letter: "F", name: "ef", ipa: "/f/", example: "Foto", zh: "照片", note: "外來語常見，發音如「ㄈ」" },
        { letter: "G", name: "ge", ipa: "/ɡ/", example: "Gula", zh: "糖", note: "硬顎濁音，永遠發「ㄍ」，不發 /dʒ/" },
        { letter: "H", name: "ha", ipa: "/h/", example: "Hari", zh: "日子 / 天", note: "微弱氣音，在字尾也要輕輕送氣，如 Rumah" },
        { letter: "I", name: "i", ipa: "/i/", example: "Ibu", zh: "母親 / 女士", note: "發音如中文「一」" },
        { letter: "J", name: "je", ipa: "/dʒ/", example: "Jalan", zh: "道路 / 走", note: "發音如中文「ㄐ/ㄓ」，如英文 'jump'" },
        { letter: "K", name: "ka", ipa: "/k/", example: "Kopi", zh: "咖啡", note: "⚠️ 字首/字中發「ㄎ/ㄍ」；在字尾是「喉塞音」，聲帶迅速關閉不送氣，如 Tidak (發音類似 Ti-da')" },
        { letter: "L", name: "el", ipa: "/l/", example: "Lima", zh: "五", note: "舌尖抵上齒齦，發音如「ㄌ」" },
        { letter: "M", name: "em", ipa: "/m/", example: "Makan", zh: "吃", note: "雙唇鼻音，發音如「ㄇ」" },
        { letter: "N", name: "en", ipa: "/n/", example: "Nama", zh: "名字", note: "齒齦鼻音，發音如「ㄋ」" },
        { letter: "O", name: "o", ipa: "/o/", example: "Orang", zh: "人", note: "圓唇音，發音如「ㄛ」" },
        { letter: "P", name: "pe", ipa: "/p/", example: "Pagi", zh: "早上", note: "雙唇清爆破音，發音如「ㄆ/ㄅ」" },
        { letter: "Q", name: "ki", ipa: "/k/", example: "Quran", zh: "可蘭經", note: "多用於阿拉伯語借詞" },
        { letter: "R", name: "er", ipa: "/r/", example: "Rendang", zh: "巴東牛肉", note: "⚠️ 舌尖彈舌顫音 (Trill)。若初學者彈不出來，可先發清晰的「ㄌ/ㄦ」過渡" },
        { letter: "S", name: "es", ipa: "/s/", example: "Satu", zh: "一", note: "齒齦清擦音，發音如「ㄙ」" },
        { letter: "T", name: "te", ipa: "/t/", example: "Terima", zh: "接受", note: "不送氣或微送氣，發音如「ㄊ/ㄉ」" },
        { letter: "U", name: "u", ipa: "/u/", example: "Uang", zh: "錢", note: "圓唇高母音，發音如「ㄨ」" },
        { letter: "V", name: "fe", ipa: "/v/~/f/", example: "Video", zh: "影片", note: "外來語借詞" },
        { letter: "W", name: "we", ipa: "/w/", example: "Waktu", zh: "時間", note: "半母音，發音如「ㄨ」" },
        { letter: "X", name: "eks", ipa: "/ks/", example: "X-ray", zh: "X光", note: "外來語專用" },
        { letter: "Y", name: "ye", ipa: "/j/", example: "Yang", zh: "那...的(關聯詞)", note: "半母音，發音如「ㄧ」" },
        { letter: "Z", name: "zet", ipa: "/z/", example: "Zaman", zh: "時代", note: "舌齒濁擦音，發音如「ㄗ」" }
      ],
      digraphs: [
        { combo: "NG", ipa: "/ŋ/", example: "Nasi Goreng", zh: "炒飯", note: "後鼻音，如中文「昂/英」的字尾鼻音" },
        { combo: "NY", ipa: "/ɲ/", example: "Nyaman", zh: "舒服 / 愜意", note: "硬顎鼻音，發音類似「捏/娘」的鼻化音" },
        { combo: "SY", ipa: "/ʃ/", example: "Syukur", zh: "感恩 / 感謝", note: "清顎齦擦音，發音如中文「詩/西」(sh)" },
        { combo: "KH", ipa: "/x/", example: "Khusus", zh: "特別 / 專用", note: "清軟顎擦音，喉嚨後部輕摩擦出氣" }
      ],
      diphthongs: [
        { combo: "AI", example: "Pakai", zh: "使用 / 穿", note: "發音為 /aj/，滑向 i" },
        { combo: "AU", example: "Mau", zh: "想要", note: "發音為 /aw/，滑向 u" },
        { combo: "OI", example: "Amboi", zh: "哎呀(感嘆詞)", note: "發音為 /oj/" }
      ]
    },

    // ==========================================
    // 1. 人稱稱謂與社交計算器 (Pronoun & Social Kinship Matrix)
    // ==========================================
    pronoun_calculator: {
      title: "印尼語人稱稱謂與社交關係計算器 (Kalkulator Sapaan)",
      description: "印尼社會極度重視長幼尊卑與社交親疏。稱呼對了，好感度瞬間倍增！請選擇您的性別與對象關係：",
      scenarios: [
        {
          id: "elder_male",
          category: "長輩男性 (Bapak / Pak)",
          targetRelation: "中年/長輩男性、上司、老師、官員、司機長輩",
          targetGender: "male",
          youPronoun: "Bapak / Pak",
          youDescZh: "先生 / 父親輩尊稱",
          myPronoun: "Saya",
          myDescZh: "我 (正式禮貌)",
          sampleId: "Selamat pagi Bapak. Ada yang bisa saya bantu?",
          sampleZh: "先生早安。有什麼我可以協助您的嗎？"
        },
        {
          id: "elder_female",
          category: "長輩女性 (Ibu / Bu)",
          targetRelation: "中年/長輩女性、主管、老師、長輩老闆娘",
          targetGender: "female",
          youPronoun: "Ibu / Bu",
          youDescZh: "女士 / 母親輩尊稱",
          myPronoun: "Saya",
          myDescZh: "我 (正式禮貌)",
          sampleId: "Permisi Ibu, baju batik ini harganya berapa ya?",
          sampleZh: "不好意思女士，這件蠟染衣服多少錢呢？"
        },
        {
          id: "younger_peer_male",
          category: "年輕男性平輩/店員 (Mas / Kak)",
          targetRelation: "年輕男店員、年輕外送司機、平輩或稍長男生",
          targetGender: "male",
          youPronoun: "Mas / Kakak (Kak)",
          youDescZh: "小哥 (爪哇尊稱) / 帥哥 (通用)",
          myPronoun: "Saya / Aku",
          myDescZh: "我 (禮貌 / 親切)",
          sampleId: "Mas, minta es kopi susu aren satu ya!",
          sampleZh: "小哥，請給我一杯冰棕櫚糖拿鐵！"
        },
        {
          id: "younger_peer_female",
          category: "年輕女性平輩/店員 (Mbak / Kak)",
          targetRelation: "年輕女店員、超商收銀員、平輩或稍長女生",
          targetGender: "female",
          youPronoun: "Mbak / Kakak (Kak)",
          youDescZh: "小姐 (爪哇尊稱) / 美女 (通用)",
          myPronoun: "Saya / Aku",
          myDescZh: "我 (禮貌 / 親切)",
          sampleId: "Mbak, saya mau bayar pakai QRIS ya.",
          sampleZh: "小姐，我要用 QRIS 掃碼付款喔。"
        },
        {
          id: "close_friends_slang",
          category: "同輩熟人與死黨 (Gue & Lu - 雅加達口語)",
          targetRelation: "年輕朋友、同齡死黨、休閒聚會",
          targetGender: "any",
          youPronoun: "Lu / Elu",
          youDescZh: "你 (同輩口語)",
          myPronoun: "Gue / Gua",
          myDescZh: "我 (雅加達年輕人必用)",
          sampleId: "Lu lagi di mana? Nongkrong bareng yuk!",
          sampleZh: "你在哪裡啊？一起去咖啡廳混聚會啦！"
        },
        {
          id: "younger_child",
          category: "年幼晚輩與弟妹 (Adik / Dek)",
          targetRelation: "年齡明顯小於自己的人、小朋友、學生",
          targetGender: "any",
          youPronoun: "Adik / Dek",
          youDescZh: "小弟/小妹",
          myPronoun: "Kakak (Kak) / Saya",
          myDescZh: "哥/姐 (我)",
          sampleId: "Halo Dek, mau jajan es krim apa?",
          sampleZh: "哈囉小朋友，想吃什麼口味的冰淇淋呢？"
        }
      ]
    },

    // ==========================================
    // 2. 核心語法與句型 (Tata Bahasa Inti)
    // ==========================================
    grammar_modules: [
      {
        id: "g_svo",
        title: "1. 核心語序：SVO 與無時態變化",
        badge: "最簡單語言",
        description: "印尼語被譽為世界上最好入門的語言之一：動詞沒有過去式、現在式或未來式的形態變化，也沒有單複數與陰陽性！",
        rules: [
          "基本語序與中文完全一致：主詞 (S) + 動詞 (V) + 受詞 (O)。",
          "時間表示法只需在句中加上時間副詞（如 kemarin 昨天、sekarang 現在、besok 明天、sudah 已經、akan 將要）。"
        ],
        examples: [
          { id_sent: "Saya makan nasi goreng.", zh_sent: "我吃炒飯。(現在/常態)", breakdown: "Saya(我) + makan(吃) + nasi goreng(炒飯)" },
          { id_sent: "Kemarin saya makan nasi goreng.", zh_sent: "昨天我吃了炒飯。(過去)", breakdown: "Kemarin(昨天) + saya(我) + makan(吃)..." },
          { id_sent: "Besok saya akan makan nasi goreng.", zh_sent: "明天我將會吃炒飯。(未來)", breakdown: "Besok(明天) + saya(我) + akan(將) + makan(吃)..." }
        ]
      },
      {
        id: "g_pronouns",
        title: "2. 人稱代名詞與禮貌稱謂體系",
        badge: "社交核心",
        description: "印尼人非常注重人際距離與長幼尊卑，選擇合適的代名詞與稱謂能瞬間建立親切感。",
        table: [
          { type: "第一人稱 (我)", formal: "Saya (正式/通用)", informal: "Aku (熟人/親暱)", slang: "Gue / Gua (雅加達流行口語)" },
          { type: "第二人稱 (你/您)", formal: "Anda (正式敬稱) / Bapak (稱男長輩) / Ibu (稱女長輩)", informal: "Kamu (同輩/晚輩) / Kakak/Kak (稱平輩或稍長者)", slang: "Lu / Elu (雅加達口語)" },
          { type: "第三人稱 (他/她)", formal: "Beliau (尊稱長者/長官)", informal: "Dia (通用他/她，不分男女)", slang: "Dia / Doi (口語對象/男女友)" },
          { type: "第一人稱複數 (我們)", formal: "Kita (包含聽話者：我們大家) / Kami (排除聽話者：我們這方)", informal: "Kita-kita", slang: "Kita" },
          { type: "第二/三人稱複數", formal: "Kalian (你們) / Mereka (他們)", informal: "Kalian / Mereka", slang: "Kalian / Mereka" }
        ],
        tips: "💡 實用小秘訣：在餐廳、商店或路上搭話時，稱呼年輕男生可用 **Mas** 或 **Kak**；年輕女生可用 **Mbak** 或 **Kak**；年長長輩用 **Bapak (Pak)** / **Ibu (Bu)**，極度禮貌討喜！"
      },
      {
        id: "g_negation",
        title: "3. 兩大否定詞辨析：Tidak vs Bukan",
        badge: "初學者必修",
        description: "印尼語的「不/不是」有嚴格分工，弄錯會顯得不自然：",
        rules: [
          "**Tidak (口語常說 Nggak / Gak)**：用於否定「動詞」或「形容詞」。",
          "**Bukan**：用於否定「名詞」或「代名詞」（相當於「不是...」）。",
          "**Belum**：表示「還沒」（尚未發生，但未來可能發生）。",
          "**Jangan**：表示「不要/請勿」（祈使禁令句）。"
        ],
        examples: [
          { id_sent: "Saya tidak suka pedas.", zh_sent: "我不喜歡吃辣。(否定動詞 suka)", tag: "Tidak" },
          { id_sent: "Ini bukan kopi saya.", zh_sent: "這不是我的咖啡。(否定名詞 kopi)", tag: "Bukan" },
          { id_sent: "Saya belum makan.", zh_sent: "我還沒吃飯。(表示尚未)", tag: "Belum" },
          { id_sent: "Jangan lupa!", zh_sent: "不要忘記！(祈使禁止)", tag: "Jangan" }
        ]
      },
      {
        id: "g_5w1h",
        title: "4. 疑問詞矩陣 (5W1H 實戰指南)",
        badge: "對話必備",
        description: "掌握 7 大核心疑問詞，就能發起並回答日常生活中 90% 的問句：",
        items: [
          { id_word: "Apa", zh_word: "什麼", example: "Apa ini?", example_zh: "這是什麼？" },
          { id_word: "Siapa", zh_word: "誰", example: "Siapa nama Anda?", example_zh: "您的名字是什麼？" },
          { id_word: "Di mana", zh_word: "在哪裡", example: "Di mana toilet?", example_zh: "洗手間在哪裡？" },
          { id_word: "Ke mana", zh_word: "去哪裡", example: "Mau ke mana?", example_zh: "要去哪裡？(印尼最常用問候語)" },
          { id_word: "Dari mana", zh_word: "從哪裡來", example: "Anda dari mana?", example_zh: "您來自哪裡？" },
          { id_word: "Kapan", zh_word: "什麼時候", example: "Kapan kita berangkat?", example_zh: "我們什麼時候出發？" },
          { id_word: "Kenapa / Mengapa", zh_word: "為什麼", example: "Kenapa terlambat?", example_zh: "為什麼遲到了？" },
          { id_word: "Bagaimana", zh_word: "如何 / 怎樣", example: "Bagaimana caranya?", example_zh: "這要怎麼弄？" },
          { id_word: "Berapa", zh_word: "多少 (數量/價格)", example: "Berapa harganya?", example_zh: "多少錢？" }
        ]
      },
      {
        id: "g_dm_rule",
        title: "5. 修飾後置原則 (Hukum D-M) 與 Yang 關聯詞",
        badge: "語法精髓",
        description: "印尼語修飾語永遠放「被修飾詞的後面」(Diterangkan-Menerangkan)，剛好與中文相反！",
        rules: [
          "中文是「大房子」，印尼語是「房子 + 大」：**Rumah besar** (Rumah 房子 + Besar 大)。",
          "中文是「印尼炒飯」，印尼語是「炒飯 + 印尼」：**Nasi goreng Indonesia**。",
          "使用 **Yang**（相當於中文的「...的」或英文 'which/that'）來強調特定特徵或連接長修飾句：**Kopi yang manis** (甜的咖啡)、**Mobil yang merah** (紅色的車)。"
        ],
        examples: [
          { id_sent: "Saya mau teh yang dingin.", zh_sent: "我要冰的茶。(Teh 茶 + yang 的 + dingin 冰)", breakdown: "Teh (D) + Dingin (M)" },
          { id_sent: "Orang yang baik hati.", zh_sent: "心地善良的人。", breakdown: "Orang (人) + yang (的) + baik hati (好心)" }
        ]
      }
    ],

    // ==========================================
    // 3. 數字、時間與金錢系統 (Angka, Waktu & Uang)
    // ==========================================
    numbers_module: {
      units: [
        { id_word: "Nol", zh_word: "0 (零)" },
        { id_word: "Satu", zh_word: "1 (一)" },
        { id_word: "Dua", zh_word: "2 (二)" },
        { id_word: "Tiga", zh_word: "3 (三)" },
        { id_word: "Empat", zh_word: "4 (四)" },
        { id_word: "Lima", zh_word: "5 (五)" },
        { id_word: "Enam", zh_word: "6 (六)" },
        { id_word: "Tujuh", zh_word: "7 (七)" },
        { id_word: "Delapan", zh_word: "8 (八)" },
        { id_word: "Sembilan", zh_word: "9 (九)" },
        { id_word: "Sepuluh", zh_word: "10 (十)" }
      ],
      teens_and_tens: [
        { id_word: "Sebelas", zh_word: "11 (十一)" },
        { id_word: "Dua belas", zh_word: "12 (十二)" },
        { id_word: "Tiga belas", zh_word: "13 (十三)" },
        { id_word: "Dua puluh", zh_word: "20 (二十)" },
        { id_word: "Dua puluh lima", zh_word: "25 (二十五)" },
        { id_word: "Tiga puluh", zh_word: "30 (三十)" },
        { id_word: "Seratus", zh_word: "100 (一百)" },
        { id_word: "Dua ratus", zh_word: "200 (兩百)" },
        { id_word: "Seribu", zh_word: "1,000 (一千)" },
        { id_word: "Sepuluh ribu", zh_word: "10,000 (一萬)" },
        { id_word: "Seratus ribu", zh_word: "100,000 (十萬)" },
        { id_word: "Satu juta", zh_word: "1,000,000 (一百萬)" }
      ],
      money_tips: [
        { sample: "Rp 15.000", spoken: "Lima belas ribu rupiah", note: "生活常講 15k (Lima belas ribu)" },
        { sample: "Rp 50.000", spoken: "Lima puluh ribu rupiah", note: "藍色鈔票" },
        { sample: "Rp 100.000", spoken: "Seratus ribu rupiah", note: "最大面額紅色鈔票" }
      ],
      time_calendar: {
        days: [
          { id_word: "Senin", zh_word: "星期一" },
          { id_word: "Selasa", zh_word: "星期二" },
          { id_word: "Rabu", zh_word: "星期三" },
          { id_word: "Kamis", zh_word: "星期四" },
          { id_word: "Jumat", zh_word: "星期五" },
          { id_word: "Sabtu", zh_word: "星期六" },
          { id_word: "Minggu", zh_word: "星期日" }
        ],
        relative_time: [
          { id_word: "Hari ini", zh_word: "今天" },
          { id_word: "Besok", zh_word: "明天" },
          { id_word: "Kemarin", zh_word: "昨天" },
          { id_word: "Lusa", zh_word: "後天" },
          { id_word: "Nanti", zh_word: "等一下 / 稍後" },
          { id_word: "Sekarang", zh_word: "現在" },
          { id_word: "Pagi", zh_word: "早上 (06:00-11:00)" },
          { id_word: "Siang", zh_word: "中午/白晝 (11:00-15:00)" },
          { id_word: "Sore", zh_word: "下午/傍晚 (15:00-18:00)" },
          { id_word: "Malam", zh_word: "晚上 (18:00以後)" }
        ]
      }
    },

    // ==========================================
    // 4. 核心主題單字庫 (Kosakata Inti - 8 大分類 200+ 單字)
    // ==========================================
    vocab_categories: [
      {
        id: "food_drink",
        name: "美食與餐飲 (Makanan & Minuman)",
        icon: "fa-utensils",
        words: [
          { id_word: "Nasi putih", zh_word: "白飯", example: "Minta nasi putih satu porsi.", example_zh: "請給我一份白飯。" },
          { id_word: "Nasi goreng", zh_word: "印尼炒飯", example: "Nasi goreng spesial pedas.", example_zh: "特製大辣炒飯。" },
          { id_word: "Mie goreng", zh_word: "炒麵", example: "Mie goreng dengan telur.", example_zh: "加蛋的炒麵。" },
          { id_word: "Ayam goreng", zh_word: "炸雞", example: "Ayam goreng kremes enak.", example_zh: "酥脆炸雞很好吃。" },
          { id_word: "Ayam bakar", zh_word: "烤雞", example: "Saya mau pesan ayam bakar.", example_zh: "我要點烤雞。" },
          { id_word: "Sate ayam", zh_word: "雞肉沙嗲", example: "Sate ayam bumbu kacang.", example_zh: "花生醬雞肉沙嗲。" },
          { id_word: "Rendang", zh_word: "巴東燉牛肉", example: "Rendang daging sapi khas Padang.", example_zh: "道地巴東風味牛肉。" },
          { id_word: "Bakso", zh_word: "肉丸湯麵", example: "Bakso sapi kuah hangat.", example_zh: "熱騰騰的牛肉丸湯。" },
          { id_word: "Soto ayam", zh_word: "黃薑雞湯", example: "Soto ayam pakai jeruk nipis.", example_zh: "加檸檬汁的薑黃雞湯。" },
          { id_word: "Gado-gado", zh_word: "印尼花生醬溫沙拉", example: "Gado-gado tanpa cabai.", example_zh: "不加辣椒的溫沙拉。" },
          { id_word: "Tempe", zh_word: "天貝 (發酵黃豆餅)", example: "Tempe goreng renyah.", example_zh: "酥脆炸天貝。" },
          { id_word: "Tahu", zh_word: "豆腐", example: "Tahu isi sayur.", example_zh: "蔬菜鑲豆腐。" },
          { id_word: "Sambal", zh_word: "辣椒醬", example: "Sambal dipisah ya, Kak.", example_zh: "辣椒醬幫我另外放喔。" },
          { id_word: "Air putih", zh_word: "白開水/礦泉水", example: "Minta air putih dingin.", example_zh: "請給我冰開水。" },
          { id_word: "Kopi susu", zh_word: "牛奶咖啡", example: "Es kopi susu aren satu.", example_zh: "一杯冰棕櫚糖拿鐵。" },
          { id_word: "Teh manis", zh_word: "甜茶", example: "Es teh manis hangat / dingin.", example_zh: "熱甜茶 / 冰甜茶。" },
          { id_word: "Teh tawar", zh_word: "無糖茶", example: "Saya mau es teh tawar.", example_zh: "我要冰無糖茶。" },
          { id_word: "Jus alpukat", zh_word: "酪梨汁(常加巧克力醬)", example: "Jus alpukat tanpa gula.", example_zh: "酪梨汁不要加糖。" },
          { id_word: "Pedas", zh_word: "辣的", example: "Jangan terlalu pedas.", example_zh: "不要太辣。" },
          { id_word: "Manis", zh_word: "甜的", example: "Kurang manis (less sugar).", example_zh: "微糖/少糖。" },
          { id_word: "Enak", zh_word: "好吃的", example: "Makanan ini sangat enak!", example_zh: "這道菜非常好吃！" },
          { id_word: "Kenyang", zh_word: "飽的", example: "Saya sudah kenyang.", example_zh: "我已經吃飽了。" }
        ]
      },
      {
        id: "transport_location",
        name: "交通與方向 (Transportasi & Lokasi)",
        icon: "fa-motorcycle",
        words: [
          { id_word: "Mobil", zh_word: "汽車", example: "Pesan mobil GrabCar.", example_zh: "叫一輛 GrabCar 汽車。" },
          { id_word: "Motor", zh_word: "機車", example: "Naik motor Gojek cepat.", example_zh: "搭 Gojek 機車很快。" },
          { id_word: "Kereta api / MRT", zh_word: "火車 / 捷運", example: "Stasiun MRT Bundaran HI.", example_zh: "HI 圓環捷運站。" },
          { id_word: "Pesawat", zh_word: "飛機", example: "Bandara Soekarno-Hatta.", example_zh: "蘇加諾-哈達機場。" },
          { id_word: "Jalan", zh_word: "道路 / 走路", example: "Jalan kaki ke stasiun.", example_zh: "走路去車站。" },
          { id_word: "Macet", zh_word: "塞車", example: "Jakarta macet sekali hari ini.", example_zh: "今天雅加達非常塞車。" },
          { id_word: "Kanan", zh_word: "右邊", example: "Belok kanan di depan.", example_zh: "在前方右轉。" },
          { id_word: "Kiri", zh_word: "左邊", example: "Belok kiri setelah lampu merah.", example_zh: "過了紅綠燈後左轉。" },
          { id_word: "Lurus", zh_word: "直走", example: "Jalan lurus terus saja.", example_zh: "一直直走就可以了。" },
          { id_word: "Berhenti", zh_word: "停下", example: "Berhenti di sini saja, Pak.", example_zh: "司機先生，停在這裡就可以。" },
          { id_word: "Depan", zh_word: "前面", example: "Saya tunggu di depan lobi.", example_zh: "我在大廳前面等。" },
          { id_word: "Belakang", zh_word: "後面", example: "Di belakang gedung.", example_zh: "在大樓後面。" },
          { id_word: "Dekat", zh_word: "靠近 / 近", example: "Sangat dekat dari sini.", example_zh: "離這裡非常近。" },
          { id_word: "Jauh", zh_word: "遙遠 / 遠", example: "Apakah masih jauh?", example_zh: "還很遠嗎？" },
          { id_word: "Tersesat", zh_word: "迷路", example: "Maaf, saya tersesat.", example_zh: "抱歉，我迷路了。" },
          { id_word: "Titik jemput", zh_word: "接送上車點", example: "Sesuai titik jemput di aplikasi.", example_zh: "照 App 上的定位點。" }
        ]
      },
      {
        id: "daily_shopping",
        name: "生活與購物 (Belanja & Sehari-hari)",
        icon: "fa-bag-shopping",
        words: [
          { id_word: "Beli", zh_word: "買", example: "Saya mau beli ini.", example_zh: "我要買這個。" },
          { id_word: "Harga", zh_word: "價格", example: "Berapa harganya?", example_zh: "價格是多少？" },
          { id_word: "Mahal", zh_word: "昂貴", example: "Terlalu mahal, bisa kurang?", example_zh: "太貴了，可以算便宜點嗎？" },
          { id_word: "Murah", zh_word: "便宜", example: "Harganya sangat murah.", example_zh: "價格非常便宜。" },
          { id_word: "Diskon", zh_word: "打折 / 折扣", example: "Apakah ada diskon?", example_zh: "有打折嗎？" },
          { id_word: "Bayar", zh_word: "付錢", example: "Mau bayar pakai apa?", example_zh: "想用什麼方式付款？" },
          { id_word: "Tunai", zh_word: "現金", example: "Bayar pakai uang tunai.", example_zh: "用現金付款。" },
          { id_word: "QRIS", zh_word: "印尼統一條碼支付", example: "Bisa bayar pakai QRIS?", example_zh: "可以用 QRIS 掃碼支付嗎？" },
          { id_word: "Struk / Bon", zh_word: "收據 / 帳單", example: "Minta struk pembayarannya.", example_zh: "請給我收據。" },
          { id_word: "Kantong plastik", zh_word: "塑膠袋", example: "Tidak usah pakai kantong plastik.", example_zh: "不用塑膠袋。" },
          { id_word: "Buka", zh_word: "營業 / 開門", example: "Jam berapa toko buka?", example_zh: "商店幾點開門？" },
          { id_word: "Tutup", zh_word: "打烊 / 關門", example: "Sudah tutup sekarang.", example_zh: "現在已經打烊了。" },
          { id_word: "Pulsa", zh_word: "手機通話餘額/網路加值", example: "Mau isi pulsa Rp 50.000.", example_zh: "要儲值 5 萬印尼盾話費。" }
        ]
      },
      {
        id: "daily_verbs",
        name: "高頻日常動詞 (Kata Kerja Sehari-hari)",
        icon: "fa-person-walking",
        words: [
          { id_word: "Makan", zh_word: "吃", example: "Sudah makan belum?", example_zh: "你吃飽了嗎？" },
          { id_word: "Minum", zh_word: "喝", example: "Minum air banyak-banyak.", example_zh: "多喝水。" },
          { id_word: "Tidur", zh_word: "睡覺", example: "Saya mau tidur sekarang.", example_zh: "我現在要去睡覺了。" },
          { id_word: "Bangun", zh_word: "起床 / 醒來", example: "Bangun jam 6 pagi.", example_zh: "早上 6 點起床。" },
          { id_word: "Mandi", zh_word: "洗澡", example: "Mandi dulu ya.", example_zh: "先去洗澡喔。" },
          { id_word: "Pergi", zh_word: "去", example: "Mau pergi ke mana?", example_zh: "要去哪裡？" },
          { id_word: "Datang", zh_word: "來 / 到達", example: "Dia baru saja datang.", example_zh: "他剛剛才到。" },
          { id_word: "Pulang", zh_word: "回家", example: "Ayo kita pulang.", example_zh: "我們回家吧。" },
          { id_word: "Kerja", zh_word: "工作", example: "Kerja di kantor.", example_zh: "在辦公室工作。" },
          { id_word: "Belajar", zh_word: "學習", example: "Belajar Bahasa Indonesia.", example_zh: "學習印尼語。" },
          { id_word: "Tahu", zh_word: "知道", example: "Saya tidak tahu.", example_zh: "我不知道。" },
          { id_word: "Mengerti", zh_word: "理解 / 明白", example: "Apakah Anda mengerti?", example_zh: "您明白了嗎？" },
          { id_word: "Tolong / Bantu", zh_word: "幫忙", example: "Bisa tolong bantu saya?", example_zh: "可以請您幫幫我嗎？" },
          { id_word: "Cari", zh_word: "尋找", example: "Lagi cari apa?", example_zh: "正在找什麼？" },
          { id_word: "Tunggu", zh_word: "等候", example: "Tunggu sebentar ya.", example_zh: "請稍等一下喔。" }
        ]
      },
      {
        id: "adjectives_states",
        name: "常用形容詞與感受 (Kata Sifat & Perasaan)",
        icon: "fa-face-smile",
        words: [
          { id_word: "Bagus", zh_word: "棒 / 好", example: "Bagus sekali!", example_zh: "太棒了！" },
          { id_word: "Cantik", zh_word: "美麗 / 漂亮", example: "Pemandangan yang cantik.", example_zh: "美麗的風景。" },
          { id_word: "Ganteng / Tampan", zh_word: "帥氣", example: "Cowok itu sangat ganteng.", example_zh: "那個男生好帥。" },
          { id_word: "Panas", zh_word: "熱", example: "Cuaca hari ini panas banget.", example_zh: "今天天氣超級熱。" },
          { id_word: "Dingin", zh_word: "冷 / 冰", example: "AC-nya terlalu dingin.", example_zh: "冷氣太冷了。" },
          { id_word: "Capek / Lelah", zh_word: "累 / 疲倦", example: "Saya capek sekali hari ini.", example_zh: "我今天好累。" },
          { id_word: "Senang", zh_word: "開心 / 高興", example: "Senang bertemu dengan Anda.", example_zh: "很高興遇見您。" },
          { id_word: "Bersih", zh_word: "乾淨", example: "Kamarnya sangat bersih.", example_zh: "房間非常乾淨。" },
          { id_word: "Kotor", zh_word: "骯髒", example: "Jangan duduk di tempat kotor.", example_zh: "不要坐在髒的地方。" },
          { id_word: "Cepat", zh_word: "快速", example: "Internetnya cepat sekali.", example_zh: "網路速度非常快。" },
          { id_word: "Pelan-pelan", zh_word: "慢一點 / 慢慢來", example: "Bicara pelan-pelan saja.", example_zh: "慢慢說就可以了。" }
        ]
      },
      {
        id: "health_emergency",
        name: "醫療健康與應急 (Kesehatan & Darurat)",
        icon: "fa-kit-medical",
        words: [
          { id_word: "Sakit", zh_word: "生病 / 痛", example: "Saya sakit kepala.", example_zh: "我頭痛。" },
          { id_word: "Masuk angin", zh_word: "著涼 / 脹氣 (印尼國民概念)", example: "Minum Tolak Angin kalau masuk angin.", example_zh: "著涼時喝 Tolak Angin 草本包。" },
          { id_word: "Demam", zh_word: "發燒", example: "Badan saya terasa demam.", example_zh: "我身體覺得在發燒。" },
          { id_word: "Batuk", zh_word: "咳嗽", example: "Ada obat batuk?", example_zh: "有止咳藥嗎？" },
          { id_word: "Obat", zh_word: "藥", example: "Minum obat setelah makan.", example_zh: "飯後服藥。" },
          { id_word: "Rumah sakit", zh_word: "醫院", example: "Di mana rumah sakit terdekat?", example_zh: "最近的醫院在哪裡？" },
          { id_word: "Apotek", zh_word: "藥局", example: "Cari apotek 24 jam.", example_zh: "找 24 小時藥局。" },
          { id_word: "Dokter", zh_word: "醫生", example: "Mau periksa ke dokter.", example_zh: "想去看醫生檢查。" },
          { id_word: "Tolong!", zh_word: "救命 / 求救！", example: "Tolong! Ada pencuri!", example_zh: "救命！有小偷！" },
          { id_word: "Hilang", zh_word: "遺失 / 不見", example: "Dompet saya hilang.", example_zh: "我的錢包不見了。" },
          { id_word: "Polisi", zh_word: "警察", example: "Laporkan ke kantor polisi.", example_zh: "去警察局報案。" }
        ]
      },
      {
        id: "social_manners",
        name: "社交與禮貌用語 (Tata Krama & Sosial)",
        icon: "fa-hands-clapping",
        words: [
          { id_word: "Selamat pagi", zh_word: "早安", example: "Selamat pagi semuanya!", example_zh: "大家早安！" },
          { id_word: "Selamat siang", zh_word: "午安 (11:00-15:00)", example: "Selamat siang, Pak.", example_zh: "先生午安。" },
          { id_word: "Selamat sore", zh_word: "傍晚好 (15:00-18:00)", example: "Selamat sore teman-teman.", example_zh: "朋友們傍晚好。" },
          { id_word: "Selamat malam", zh_word: "晚安", example: "Selamat malam, selamat beristirahat.", example_zh: "晚安，祝好好休息。" },
          { id_word: "Terima kasih", zh_word: "謝謝", example: "Terima kasih banyak!", example_zh: "非常感謝！" },
          { id_word: "Sama-sama", zh_word: "不客氣", example: "Sama-sama, kembali.", example_zh: "不客氣。" },
          { id_word: "Maaf", zh_word: "對不起 / 抱歉", example: "Maaf merepotkan Anda.", example_zh: "抱歉麻煩您了。" },
          { id_word: "Permisi", zh_word: "借過 / 打擾一下", example: "Permisi, numpang tanya.", example_zh: "不好意思，請問一下。" },
          { id_word: "Sampai jumpa", zh_word: "再見 / 下次見", example: "Sampai jumpa lagi besok!", example_zh: "明天再見！" },
          { id_word: "Hati-hati", zh_word: "小心 / 保重", example: "Hati-hati di jalan ya.", example_zh: "路上小心喔。" }
        ]
      },
      {
        id: "gaul_slang_words",
        name: "TikTok 迷因與潮流口語 (Bahasa Gaul & Tren)",
        icon: "fa-fire",
        words: [
          { id_word: "Menyala Abangku 🔥", zh_word: "太炸了大哥！(極致讚嘆)", example: "Penampilanmu hari ini menyala abangku!", example_zh: "你今天的表現太炸了大哥！" },
          { id_word: "Tetap Ilmu Padi 🌾", zh_word: "保持低調謙遜 (越有實力越低調)", example: "Selalu rendah hati, tetap ilmu padi.", example_zh: "永遠謙遜，稻穗越飽滿越低頭。" },
          { id_word: "Bucin", zh_word: "戀愛腦 (Budak Cinta)", example: "Dia bucin banget sama pacarnya.", example_zh: "他對另一半超級戀愛腦。" },
          { id_word: "Mager", zh_word: "懶得動 (Malas Gerak)", example: "Lagi mager mau keluar rumah.", example_zh: "現在超懶得踏出家門。" },
          { id_word: "Gabut", zh_word: "閒到發慌 (Gaji Buta)", example: "Lagi gabut nih, jalan-jalan yuk!", example_zh: "現在閒得沒事做，去晃晃吧！" },
          { id_word: "Salting", zh_word: "小鹿亂撞不知所措 (Salah Tingkah)", example: "Dia bikin aku salting terus.", example_zh: "他搞得我一直小鹿亂撞超害羞。" },
          { id_word: "Kepo", zh_word: "八卦 / 愛管閒事", example: "Jangan kepo deh!", example_zh: "別那麼八卦管閒事啦！" },
          { id_word: "Curhat", zh_word: "訴苦 / 吐露心聲 (Curahan Hati)", example: "Mau curhat sebentar boleh?", example_zh: "可以跟你吐吐苦水一下嗎？" },
          { id_word: "Nongkrong", zh_word: "聚會泡咖啡廳閒聊", example: "Yuk kita nongkrong di kafe!", example_zh: "走，我們去咖啡廳混聚會！" },
          { id_word: "Mantap", zh_word: "給力 / 讚 / 絕了", example: "Rasanya mantap jiwa!", example_zh: "味道簡直絕了！" }
        ]
      }
    ],

    // ==========================================
    // 5. 10 大現代實戰情境會話 (全部配備雙對話分支：標準實況 + 潮流在地口語)
    // ==========================================
    situational_modules: [
      {
        id: "sit_01_coffee",
        title: "1. 咖啡廳點餐與數位遊民 (Kafe & Nongkrong)",
        subtitle: "點一杯道地的棕櫚糖拿鐵，並使用 QRIS 掃碼結帳",
        location: "雅加達南部 (Jaksel) 文青咖啡廳",
        icon: "fa-mug-hot",
        image: "assets/coffee_shop_illustration_1787210903184.jpg",
        culture_tip: "印尼的「Nongkrong」（泡咖啡廳社交閒聊）是當代青年文化的精髓。最暢銷的國民飲品是 **Es Kopi Susu Aren**（加了椰糖/棕櫚糖的濃醇冰拿鐵）。",
        dialogueSections: [
          {
            id: "d1",
            title: "標準點餐會話 (Standard Order)",
            dialogue: [
              { speaker: "Barista", id_text: "Halo Kak! Mau pesan apa hari ini?", zh_text: "哈囉您好！今天想喝點什麼呢？" },
              { speaker: "Saya", id_text: "Halo, saya mau pesan Es Kopi Susu Aren satu ya.", zh_text: "你好，我要點一杯冰棕櫚糖拿鐵。" },
              { speaker: "Barista", id_text: "Mau less sugar atau normal, Kak? Ada ukuran reguler dan large.", zh_text: "要少糖還是正常甜？有中杯和大杯喔。" },
              { speaker: "Saya", id_text: "Less sugar ya, ukuran reguler saja. Ada stopkontak dan WiFi?", zh_text: "少糖，中杯就好。請問這裡有插座和 WiFi 嗎？" },
              { speaker: "Barista", id_text: "Ada, password WiFi-nya tertulis di struk ya. Totalnya Rp 22.000.", zh_text: "有的，WiFi 密碼寫在收據上喔。總共是兩萬兩千印尼盾。" },
              { speaker: "Saya", id_text: "Bisa bayar pakai QRIS?", zh_text: "可以用 QRIS 掃碼付款嗎？" },
              { speaker: "Barista", id_text: "Bisa banget Kak, silakan scan barcode di sini ya.", zh_text: "完全可以，請在這邊掃描條碼。" }
            ]
          },
          {
            id: "d2",
            title: "Jaksel 潮流聚會口語 (Nongkrong Gaul)",
            dialogue: [
              { speaker: "Teman", id_text: "Bro, nongkrong di sini asyik banget ya, estetik parah!", zh_text: "兄弟，在這裡聚會混超讚的，裝潢拍照也太美了吧！" },
              { speaker: "Saya", id_text: "Iya nih, kopinya juga enak banget, gak terlalu manis.", zh_text: "對啊，咖啡也超級好喝，而且不會太甜。" },
              { speaker: "Teman", id_text: "Lu mau split bill atau gue yang bayarin dulu?", zh_text: "你要各自分開拆帳，還是我先幫你代付？" },
              { speaker: "Saya", id_text: "Gue transfer pakai QRIS sekarang aja deh, biar praktis.", zh_text: "我現在直接用 QRIS 轉帳給你吧，比較方便省事。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "當店員問你 'Mau less sugar atau normal, Kak?' 你如果想要微糖/少糖，應該怎麼回答？",
          options: [
            { text: "Less sugar ya, Kak.", correct: true, feedback: "答對了！印尼咖啡廳普遍聽懂 less sugar 或 kurang manis。" },
            { text: "Saya tidak mau kopi.", correct: false, feedback: "這是「我不想要咖啡」的意思喔。" },
            { text: "Berapa harganya?", correct: false, feedback: "這是問「多少錢」喔。" }
          ]
        }
      },
      {
        id: "sit_02_gojek",
        title: "2. Gojek / Grab 叫車與外送 (Naik Ojek Online)",
        subtitle: "與機車/汽車司機在 App 內精準溝通上車點",
        location: "雅加達市區 MRT 站外",
        icon: "fa-motorcycle",
        image: "assets/indo_hero_illustration_1787210889692.jpg",
        culture_tip: "印尼塞車嚴重，摩的 (Ojek) 是最高效的出行神器。司機接單後常會傳訊確認：**'Sesuai titik ya, Kak?'**（按照 App 定位點嗎？）",
        dialogueSections: [
          {
            id: "d1",
            title: "摩的定位接送 (Ojek Pickup)",
            dialogue: [
              { speaker: "Driver (Chat)", id_text: "Sore Kak, penjemputan sesuai titik di aplikasi ya?", zh_text: "您好，接送地點是照 App 上的定位點嗎？" },
              { speaker: "Saya (Chat)", id_text: "Iya Pak, saya pakai baju hitam di depan pintu lobi stasiun MRT.", zh_text: "是的司機大哥，我穿黑色衣服，在 MRT 站大廳門口前面。" },
              { speaker: "Driver (Chat)", id_text: "Baik Kak, otw (on the way) ke sana, sekitar 3 menit lagi sampai.", zh_text: "好的，正在趕過去路上，大約 3 分鐘後抵達。" },
              { speaker: "Saya", id_text: "Pak Budi ya? Plat B 1234 XYZ?", zh_text: "請問是 Budi 司機嗎？車牌 B 1234 XYZ？" },
              { speaker: "Driver", id_text: "Betul Kak, ini helmnya. Mau lewat jalan tol atau jalan biasa?", zh_text: "沒錯就是我，這是給您的安全帽。要走高速公路還是走一般道路？" },
              { speaker: "Saya", id_text: "Jalan biasa saja Pak, yang penting cepat dan aman.", zh_text: "走一般道路就可以了大哥，快又安全最重要。" }
            ]
          },
          {
            id: "d2",
            title: "汽車 GrabCar 塞車應變",
            dialogue: [
              { speaker: "Driver", id_text: "Siang Kak, jalanan depan lagi macet parah nih karena ada proyek.", zh_text: "午安，前面那條路因為有工程現在塞車超級嚴重。" },
              { speaker: "Saya", id_text: "Waduh, kira-kira bisa lewat jalan pintas nggak Pak?", zh_text: "哎呀，司機大哥請問大概能走小路捷徑嗎？" },
              { speaker: "Driver", id_text: "Bisa Kak, kita lewat jalan tikus ya biar gak kena macet.", zh_text: "可以的，我們鑽巷弄小路走，避開大塞車喔。" },
              { speaker: "Saya", id_text: "Siap Pak, terima kasih banyak ya.", zh_text: "沒問題司機大哥，非常感謝您。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "當司機在 App 內傳訊 'Sesuai titik ya, Kak?'，最道地的確認回覆是什麼？",
          options: [
            { text: "Iya Pak, sesuai titik ya.", correct: true, feedback: "完美！表示確認照 App 上的圖釘定位點等車。" },
            { text: "Saya mau bayar tunai.", correct: false, feedback: "這是「我要付現金」的意思。" },
            { text: "Bukan, saya tidak tahu.", correct: false, feedback: "這樣司機會不知道該去哪裡接你喔。" }
          ]
        }
      },
      {
        id: "sit_03_restaurant",
        title: "3. 餐廳點餐與辣度定制 (Makan di Restoran / Warung)",
        subtitle: "點選道地炒飯、沙嗲，並客製化調整辣椒醬",
        location: "泗水美食街 / Padang 餐廳",
        icon: "fa-bowl-rice",
        image: "assets/surabaya_illustration_1787210917170.jpg",
        culture_tip: "印尼料理無辣不歡，如果不擅長吃辣，務必學會說 **'Sambal dipisah'**（辣椒分開放）或 **'Jangan pedas'**（不要辣）！",
        dialogueSections: [
          {
            id: "d1",
            title: "標準點餐與結帳 (Pesan Makanan & Bon)",
            dialogue: [
              { speaker: "Pelayan", id_text: "Selamat siang! Silakan duduk, ini menunya.", zh_text: "午安！請坐，這是菜單。" },
              { speaker: "Saya", id_text: "Saya mau pesan Nasi Goreng Spesial satu, dan Sate Ayam 10 tusuk.", zh_text: "我要點一份特製炒飯，以及 10 串雞肉沙嗲。" },
              { speaker: "Pelayan", id_text: "Nasi gorengnya mau pedas atau sedang?", zh_text: "炒飯要大辣還是中辣？" },
              { speaker: "Saya", id_text: "Tidak terlalu pedas ya, tolong sambalnya dipisah saja.", zh_text: "不要太辣喔，請把辣椒醬另外放就可以了。" },
              { speaker: "Pelayan", id_text: "Minumnya mau apa Kak?", zh_text: "飲料想要喝什麼呢？" },
              { speaker: "Saya", id_text: "Es teh manis satu dan air mineral satu.", zh_text: "一杯冰甜茶和一瓶礦泉水。" },
              { speaker: "Saya", id_text: "Mas, minta bon / struknya ya, mau bayar.", zh_text: "服務生，麻煩請給我帳單，我要買單了。" }
            ]
          },
          {
            id: "d2",
            title: "泗水黑牛肉湯小吃攤 (Rawon Surabaya)",
            dialogue: [
              { speaker: "Penjual", id_text: "Makan di sini atau dibungkus, Mas?", zh_text: "小哥，要在這裡吃還是外帶包走？" },
              { speaker: "Saya", id_text: "Makan di sini Cak. Minta Rawon daging satu sama telur asin ya.", zh_text: "大哥，在這裡吃。請給我一碗黑牛肉湯配一顆鹹蛋。" },
              { speaker: "Penjual", id_text: "Pakai kerupuk udang sama sambal terasi?", zh_text: "要加蝦餅和特製蝦醬辣醬嗎？" },
              { speaker: "Saya", id_text: "Pakai Cak, kuahnya tolong yang panas ya!", zh_text: "要的的大哥，湯頭麻煩要熱騰騰的喔！" }
            ]
          }
        ],
        interactive_quiz: {
          question: "如果你不想讓整盤炒飯被辣椒炒進去，希望辣椒醬另外裝在小碟子裡，該怎麼說？",
          options: [
            { text: "Tolong sambalnya dipisah ya.", correct: true, feedback: "太棒了！'dipisah' (被分開) 是最實用道地的點餐神句！" },
            { text: "Saya mau sambal banyak.", correct: false, feedback: "這是「我要很多辣椒醬」的意思，會超級辣喔！" },
            { text: "Minta nasi putih lagi.", correct: false, feedback: "這是「再要一碗白飯」的意思。" }
          ]
        }
      },
      {
        id: "sit_04_hotel",
        title: "4. 飯店入住與詢問服務 (Check-in Hotel)",
        subtitle: "辦理飯店入住手續、詢問早餐時間與設施",
        location: "峇里島度假飯店大廳",
        icon: "fa-hotel",
        image: "assets/indo_hero_illustration_1787210889692.jpg",
        culture_tip: "在印尼辦理入住時，通常需要提供護照登記並可能需要少量押金 (Deposit)。早餐 (Sarapan) 時間通常是清晨 06:00 到 10:00。",
        dialogueSections: [
          {
            id: "d1",
            title: "飯店櫃檯入住 (Standard Check-in)",
            dialogue: [
              { speaker: "Resepsionis", id_text: "Selamat sore, selamat datang di Hotel Grand Bali. Ada yang bisa dibantu?", zh_text: "傍晚好，歡迎光臨峇里島大飯店。有什麼我可以協助您的嗎？" },
              { speaker: "Saya", id_text: "Selamat sore. Saya mau check-in, sudah pesan atas nama David.", zh_text: "傍晚好。我要辦理入住，已經用 David 的名字預約了。" },
              { speaker: "Resepsionis", id_text: "Boleh saya pinjam paspor Anda untuk verifikasi?", zh_text: "可以借看一下您的護照進行身份驗證嗎？" },
              { speaker: "Saya", id_text: "Ini paspor saya.", zh_text: "這是我的護照。" },
              { speaker: "Resepsionis", id_text: "Baik, kamar Anda di lantai 5 nomor 508. Ini kunci kartunya.", zh_text: "好的，您的房間在 5 樓 508 號。這是您的房卡。" },
              { speaker: "Saya", id_text: "Jam berapa sarapan pagi dan di mana restorannya?", zh_text: "請問早餐是幾點？餐廳在哪裡呢？" },
              { speaker: "Resepsionis", id_text: "Sarapan dari jam 6 sampai jam 10 pagi di restoran lantai 1 dekat kolam renang.", zh_text: "早餐從早上 6 點到 10 點，在 1 樓泳池旁的餐廳。" }
            ]
          },
          {
            id: "d2",
            title: "峇里島別墅租車與延後退房",
            dialogue: [
              { speaker: "Saya", id_text: "Bli, apakah di sini bisa bantu sewa motor matic untuk 3 hari?", zh_text: "大哥，請問這裡能幫忙租 3 天的自排機車嗎？" },
              { speaker: "Staff Villa", id_text: "Bisa Kak, harganya Rp 75.000 per hari sudah termasuk 2 helm.", zh_text: "可以的，一天七萬五印尼盾，已經包含兩頂安全帽。" },
              { speaker: "Saya", id_text: "Sama mau tanya, apakah besok bisa late check-out jam 2 siang?", zh_text: "另外想請問，明天可以延後到下午兩點退房嗎？" },
              { speaker: "Staff Villa", id_text: "Bisa Kak, khusus untuk Kakak gratis late check-out ya.", zh_text: "可以的，特別為您免費延後退房喔。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "詢問櫃檯人員「早餐是幾點？」的正確印尼語是？",
          options: [
            { text: "Jam berapa sarapan pagi?", correct: true, feedback: "正確！Jam berapa = 幾點，sarapan pagi = 早餐。" },
            { text: "Di mana toilet?", correct: false, feedback: "這是問廁所在哪裡。" },
            { text: "Berapa nomor kamar saya?", correct: false, feedback: "這是問「我的房號是多少？」。" }
          ]
        }
      },
      {
        id: "sit_05_minimarket",
        title: "5. 便利店購物與電話儲值 (Belanja di Indomaret / Alfamart)",
        subtitle: "在印尼街頭最常見的便利店買日用品與儲值手機網路",
        location: "Indomaret / Alfamart 門市",
        icon: "fa-store",
        image: "assets/coffee_shop_illustration_1787210903184.jpg",
        culture_tip: "Indomaret 和 Alfamart 是印尼隨處可見的便利店超商，除了買零食，大家最常去那裡加值手機通話費與網路流量 (Isi Pulsa / Paket Data)。",
        dialogueSections: [
          {
            id: "d1",
            title: "超商加值話費與結帳",
            dialogue: [
              { speaker: "Kasir", id_text: "Selamat siang, selamat belanja di Indomaret!", zh_text: "午安，歡迎光臨 Indomaret！" },
              { speaker: "Saya", id_text: "Mbak, saya mau isi pulsa Telkomsel Rp 50.000.", zh_text: "小姐，我要儲值 Telkomsel 電信 5 萬印尼盾話費。" },
              { speaker: "Kasir", id_text: "Boleh sebutkan nomor HP-nya, Kak?", zh_text: "可以麻煩報一下您的手機號碼嗎？" },
              { speaker: "Saya", id_text: "Kosong delapan satu dua, tiga empat lima enam...", zh_text: "0812-3456..." },
              { speaker: "Kasir", id_text: "Mau pakai kantong plastik atau tas sendiri?", zh_text: "需要買塑膠袋還是用自己的袋子呢？" },
              { speaker: "Saya", id_text: "Pakai tas sendiri saja, tidak usah plastik.", zh_text: "用我自己的袋子就好，不用塑膠袋。" },
              { speaker: "Kasir", id_text: "Ada kartu member-nya, Kak?", zh_text: "請問有會員卡嗎？" },
              { speaker: "Saya", id_text: "Tidak ada. Bayar pakai QRIS ya.", zh_text: "沒有。用 QRIS 掃碼付款喔。" }
            ]
          },
          {
            id: "d2",
            title: "買零食飲料與詢問微波加熱",
            dialogue: [
              { speaker: "Saya", id_text: "Mas, roti ini bisa tolong dipanaskan di microwave?", zh_text: "小哥，這個麵包可以麻煩幫我在微波爐加熱一下嗎？" },
              { speaker: "Kasir", id_text: "Bisa Kak, tunggu 1 menit ya. Mau tambah air mineral dingin sekalian?", zh_text: "可以的，請等一分鐘喔。要順便加一瓶冰礦泉水嗎？" },
              { speaker: "Saya", id_text: "Boleh Mas, air mineral ukuran 600ml satu ya.", zh_text: "好啊，給我一瓶 600ml 的冰礦泉水。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "當店員問你 'Ada kartu member-nya, Kak?' 如果你沒有會員卡，應該說什麼？",
          options: [
            { text: "Tidak ada.", correct: true, feedback: "沒錯！'Tidak ada' = 沒有。" },
            { text: "Saya mau makan.", correct: false, feedback: "這是「我要吃」的意思。" },
            { text: "Bukan saya.", correct: false, feedback: "這是「不是我」的意思。" }
          ]
        }
      },
      {
        id: "sit_06_kenalan",
        title: "6. 自我介紹與結交新朋友 (Berkenalan & Ngobrol)",
        subtitle: "破冰開場、介紹名字、來自哪裡以及在印尼的日常",
        location: "青年旅館交誼廳 / 聚會活動",
        icon: "fa-user-group",
        image: "assets/indo_hero_illustration_1787210889692.jpg",
        culture_tip: "印尼人非常熱情好客 (Ramah)，認識新朋友時常會關心你的家鄉、工作或甚至婚姻狀態。回應時保持微笑即可！",
        dialogueSections: [
          {
            id: "d1",
            title: "破冰認識與交換聯絡方式",
            dialogue: [
              { speaker: "Rian", id_text: "Halo! Kenalkan, nama saya Rian. Siapa nama Anda?", zh_text: "哈囉！認識一下，我叫 Rian。請問你叫什麼名字？" },
              { speaker: "Saya", id_text: "Halo Rian, saya David. Senang bertemu denganmu!", zh_text: "哈囉 Rian，我是 David。很高興認識你！" },
              { speaker: "Rian", id_text: "David dari mana asalnya? Sudah berapa lama di Indonesia?", zh_text: "David 你來自哪裡呢？在印尼待了多久呀？" },
              { speaker: "Saya", id_text: "Saya dari Taiwan. Saya baru satu bulan di Jakarta untuk belajar dan jalan-jalan.", zh_text: "我來自台灣。我才剛在雅加達待了一個月，來學習和旅遊。" },
              { speaker: "Rian", id_text: "Wah keren! Bahasa Indonesia kamu sudah lancar banget!", zh_text: "哇太酷了！你的印尼語已經講得超流利了！" },
              { speaker: "Saya", id_text: "Terima kasih, masih belajar pelan-pelan kok. Minta nomor WhatsApp kamu dong.", zh_text: "謝謝誇獎，我還在慢慢學習中啦。給我你的 WhatsApp 號碼吧！" }
            ]
          },
          {
            id: "d2",
            title: "青年旅館聊旅遊與興趣",
            dialogue: [
              { speaker: "Sari", id_text: "Hai David! Besok rencananya mau jalan-jalan ke mana?", zh_text: "嗨 David！明天計畫要去哪裡玩呀？" },
              { speaker: "Saya", id_text: "Saya mau ke Kota Tua dan Monas. Katanya di sana seru banget ya?", zh_text: "我想去老城區 (Kota Tua) 和國家紀念碑 (Monas)。聽說那裡很有趣對吧？" },
              { speaker: "Sari", id_text: "Iya seru banget, banyak spot foto vintage dan kuliner enak!", zh_text: "對啊超好玩的，有很多復古拍照景點和好吃的美食！" }
            ]
          }
        ],
        interactive_quiz: {
          question: "回答自己來自台灣的標準句型是什麼？",
          options: [
            { text: "Saya dari Taiwan.", correct: true, feedback: "Bingo！Saya dari... = 我來自..." },
            { text: "Saya mau ke Taiwan.", correct: false, feedback: "這是「我要去台灣」的意思。" },
            { text: "Nama saya Taiwan.", correct: false, feedback: "這是「我的名字是台灣」的意思。" }
          ]
        }
      },
      {
        id: "sit_07_market_bargain",
        title: "7. 傳統市集與手作工藝殺價 (Nawar di Pasar)",
        subtitle: "在傳統市場與店家親切殺價、買到實惠紀念品",
        location: "日惹 Malioboro 大街 / 峇里島烏布市集",
        icon: "fa-tag",
        image: "assets/surabaya_illustration_1787210917170.jpg",
        culture_tip: "在傳統觀光市集，標價往往包含討價還價的空間。殺價時面帶微笑、態度親切，稱呼店家 'Bude / Ibu / Mas'，更容易獲得友情價！",
        dialogueSections: [
          {
            id: "d1",
            title: "市集討價還價實戰",
            dialogue: [
              { speaker: "Saya", id_text: "Permisi Bu, baju batik ini harganya berapa ya?", zh_text: "不好意思老闆娘，這件蠟染 Batik 衣服多少錢呢？" },
              { speaker: "Penjual", id_text: "Yang ini harganya Rp 150.000, bahannya katun halus, Mas.", zh_text: "這件十五萬印尼盾，材質是高級純棉喔小哥。" },
              { speaker: "Saya", id_text: "Wah, agak mahal ya Bu. Boleh kurang nggak?", zh_text: "哇，有點貴耶老闆娘。可以算便宜一點嗎？" },
              { speaker: "Penjual", id_text: "Mau tawar berapa, Mas?", zh_text: "那小哥你想出多少呢？" },
              { speaker: "Saya", id_text: "Kalau Rp 100.000 boleh nggak? Saya ambil dua deh.", zh_text: "如果一件算十萬可以嗎？那我直接拿兩件！" },
              { speaker: "Penjual", id_text: "Ya sudah boleh deh khusus buat Mas. Bungkus dua ya!", zh_text: "好啦好啦，專門優惠給小哥你。幫你包兩件喔！" }
            ]
          },
          {
            id: "d2",
            title: "批發多件優惠與水果市集",
            dialogue: [
              { speaker: "Saya", id_text: "Pak, mangga harum manis ini sekilo berapa?", zh_text: "老闆，這個甜芒果一公斤多少錢？" },
              { speaker: "Penjual", id_text: "Sekilo Rp 25.000 Mas, manis banget kayak gula!", zh_text: "一公斤兩萬五印尼盾小哥，甜得像糖一樣！" },
              { speaker: "Saya", id_text: "Kalau saya beli 3 kilo, bisa dapat Rp 60.000 gak Pak?", zh_text: "如果我買 3 公斤，算我六萬印尼盾可以嗎老闆？" },
              { speaker: "Penjual", id_text: "Boleh Mas, saya pilihin yang paling matang dan manis ya!", zh_text: "可以的小哥，我幫你挑最熟最甜的喔！" }
            ]
          }
        ],
        interactive_quiz: {
          question: "殺價時最常用且禮貌的詢問「可以算便宜點嗎？」是哪一句？",
          options: [
            { text: "Boleh kurang nggak?", correct: true, feedback: "答對了！'Boleh kurang nggak?' 或 'Bisa diskon?' 都是殺價神句！" },
            { text: "Saya tidak mau beli.", correct: false, feedback: "這是「我不想買」的意思。" },
            { text: "Ini sangat murah.", correct: false, feedback: "說很便宜老闆就不會給你降價啦！" }
          ]
        }
      },
      {
        id: "sit_08_pharmacy",
        title: "8. 藥局買藥與身體不適求助 (Di Apotek / Klinik)",
        subtitle: "向藥師清楚描述頭痛、發燒、拉肚子與著涼症狀",
        location: "Guardian / Kimia Farma 藥局",
        icon: "fa-pills",
        image: "assets/coffee_shop_illustration_1787210903184.jpg",
        culture_tip: "在印尼如果覺得吹冷氣著涼、腹脹疲倦，當地人稱之為 **'Masuk angin'**（風進到體內），最經典的草本成藥是 **Tolak Angin**。",
        dialogueSections: [
          {
            id: "d1",
            title: "藥局諮詢與症狀描述",
            dialogue: [
              { speaker: "Apoteker", id_text: "Selamat pagi, ada keluhan apa yang bisa saya bantu?", zh_text: "早安，身體有哪裡不舒服我可以為您推薦藥品嗎？" },
              { speaker: "Saya", id_text: "Kepala saya pusing dan badan terasa demam sejak semalam.", zh_text: "我從昨晚開始頭很暈，而且身體感覺在發燒。" },
              { speaker: "Apoteker", id_text: "Apakah ada sakit perut atau diare juga?", zh_text: "肚子會痛或者有拉肚子腹瀉的症狀嗎？" },
              { speaker: "Saya", id_text: "Sedikit masuk angin dan mual.", zh_text: "有點著涼反胃噁心。" },
              { speaker: "Apoteker", id_text: "Ini obat Paracetamol untuk demam dan pusing, diminum 3 kali sehari setelah makan ya.", zh_text: "這是退燒止痛的普拿疼 (Paracetamol)，一天吃三次，飯後服用喔。" },
              { speaker: "Saya", id_text: "Baik, terima kasih banyak ya Dok.", zh_text: "好的，非常感謝您。" }
            ]
          },
          {
            id: "d2",
            title: "購買國民神藥 Tolak Angin",
            dialogue: [
              { speaker: "Saya", id_text: "Mbak, ada Tolak Angin cair yang kemasan kotak?", zh_text: "小姐，有盒裝的 Tolak Angin 草本液體包嗎？" },
              { speaker: "Apoteker", id_text: "Ada Kak, mau yang original atau rasa mint?", zh_text: "有的，要原味還是薄荷口味？" },
              { speaker: "Saya", id_text: "Yang original satu kotak ya. Sama minyak kayu putih satu botol kecil.", zh_text: "原味的一盒。另外還要一小瓶白樹油 (Minyak Kayu Putih)。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "如果要告訴藥師「我頭痛發燒」，應該怎麼說？",
          options: [
            { text: "Saya sakit kepala dan demam.", correct: true, feedback: "精準表達！Sakit kepala = 頭痛，demam = 發燒。" },
            { text: "Saya lapar dan haus.", correct: false, feedback: "這是「我又餓又渴」的意思。" },
            { text: "Saya mau jalan-jalan.", correct: false, feedback: "這是「我想去散步旅遊」的意思。" }
          ]
        }
      },
      {
        id: "sit_09_housing",
        title: "9. 租屋住宿與設備故障報修 (Sewa Kos & Masalah)",
        subtitle: "與房東/管理員溝通房租、水電與冷氣維修",
        location: "雅加達雅房公寓 (Kos-kosan)",
        icon: "fa-house-chimney",
        image: "assets/indo_hero_illustration_1787210889692.jpg",
        culture_tip: "印尼的單身套房/雅房通稱為 **Kos / Kos-kosan**。租屋時需詢問是否包含水電 (Listrik & Air) 以及 WiFi 與冷氣 (AC)。",
        dialogueSections: [
          {
            id: "d1",
            title: "冷氣故障報修",
            dialogue: [
              { speaker: "Saya", id_text: "Permisi Pak, AC di kamar 203 sepertinya rusak, tidak dingin sama sekali.", zh_text: "不好意思房東先生，203 號房的冷氣好像壞掉了，完全不會冷。" },
              { speaker: "Bapak Kos", id_text: "Oh ya? Kapan mulai tidak dingin, Mas?", zh_text: "是喔？從什麼時候開始不冷的呢小哥？" },
              { speaker: "Saya", id_text: "Mulai tadi malam, cuma keluar angin biasa dan bocor air sedikit.", zh_text: "從昨晚開始，只吹出普通風，而且還稍微有點漏水。" },
              { speaker: "Bapak Kos", id_text: "Baik Mas, nanti siang saya panggilkan tukang servis AC untuk cek ya.", zh_text: "好的小哥，今天下午我會叫冷氣維修師傅過來檢查修繕喔。" },
              { speaker: "Saya", id_text: "Terima kasih banyak atas bantuannya, Pak!", zh_text: "非常感謝房東先生的幫忙！" }
            ]
          },
          {
            id: "d2",
            title: "詢問房租包含項目與繳費",
            dialogue: [
              { speaker: "Saya", id_text: "Pak, uang sewa kos bulan ini sudah termasuk listrik dan air?", zh_text: "房東先生，這個月的房租已經包含水電費了嗎？" },
              { speaker: "Bapak Kos", id_text: "Sudah termasuk air dan WiFi Mas, kalau listrik pakai token pulsa sendiri ya.", zh_text: "已經包含水費和 WiFi 了小哥，電費是用獨立儲值電卡喔。" },
              { speaker: "Saya", id_text: "Baik Pak, saya transfer uang sewanya via BCA ya.", zh_text: "好的房東先生，我透過 BCA 銀行轉帳房租給您喔。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "表達「冷氣壞了，完全不冷」的道地句子是？",
          options: [
            { text: "AC rusak, tidak dingin sama sekali.", correct: true, feedback: "非常正確！Rusak = 損壞，tidak dingin = 不冷。" },
            { text: "AC sangat dingin.", correct: false, feedback: "這是「冷氣超冷」的意思。" },
            { text: "Kamar sangat bersih.", correct: false, feedback: "這是「房間很乾淨」的意思。" }
          ]
        }
      },
      {
        id: "sit_10_immigration",
        title: "10. 機場入境海關與緊急應變 (Imigrasi & Situasi Darurat)",
        subtitle: "回答海關移民官問話，並在遺失物品時求助",
        location: "雅加達蘇加諾-哈達國際機場海關",
        icon: "fa-passport",
        image: "assets/indo_hero_illustration_1787210889692.jpg",
        culture_tip: "入境印尼海關時，保持從容自信，主動遞交護照 (Paspor) 與電子簽證/電子海關申報單 (e-CD QR Code)。",
        dialogueSections: [
          {
            id: "d1",
            title: "海關入境審查",
            dialogue: [
              { speaker: "Petugas Imigrasi", id_text: "Selamat siang. Paspor dan boarding pass, silakan.", zh_text: "午安。請出示您的護照與登機證。" },
              { speaker: "Saya", id_text: "Selamat siang. Ini paspor dan dokumen saya.", zh_text: "午安。這是我的護照和相關文件。" },
              { speaker: "Petugas Imigrasi", id_text: "Apa tujuan kunjungan Anda ke Indonesia?", zh_text: "您來印尼的訪問目的是什麼？" },
              { speaker: "Saya", id_text: "Untuk liburan dan jalan-jalan.", zh_text: "為了度假和觀光旅遊。" },
              { speaker: "Petugas Imigrasi", id_text: "Berapa lama Anda akan tinggal di Indonesia?", zh_text: "您預計在印尼停留多久？" },
              { speaker: "Saya", id_text: "Kira-kira dua minggu di Jakarta dan Bali.", zh_text: "大約在雅加達和峇里島待兩週。" },
              { speaker: "Petugas Imigrasi", id_text: "Baik, selamat menikmati liburan di Indonesia!", zh_text: "好的，祝您在印尼度假愉快！" }
            ]
          },
          {
            id: "d2",
            title: "遺失錢包報警求助 (Situasi Darurat)",
            dialogue: [
              { speaker: "Saya", id_text: "Pak Polisi, tolong saya! Dompet saya sepertinya tertinggal di taksi.", zh_text: "警察先生，請幫幫我！我的錢包好像忘在計程車上了。" },
              { speaker: "Polisi", id_text: "Tenang Mas, apakah ingat nomor plat mobil atau nama perusahaannya?", zh_text: "別緊張小哥，您記得車牌號碼或是計程車公司名稱嗎？" },
              { speaker: "Saya", id_text: "Saya naik Bluebird dari bandara, ini struk pembayarannya.", zh_text: "我是搭乘從機場出發的 Bluebird 計程車，這是收據。" },
              { speaker: "Polisi", id_text: "Bagus sekali ada struknya, mari saya bantu hubungi call center taksi.", zh_text: "太好了有收據，我來幫您聯絡計程車客服中心找回。" }
            ]
          }
        ],
        interactive_quiz: {
          question: "當海關問你 'Apa tujuan kunjungan Anda?'（你的入境目的是什麼？），觀光客最標準的回答是？",
          options: [
            { text: "Untuk liburan dan jalan-jalan.", correct: true, feedback: "正確無誤！Liburan = 度假，jalan-jalan = 旅遊觀光。" },
            { text: "Saya mau beli mobil.", correct: false, feedback: "這是「我要買車」的意思。" },
            { text: "Saya tidak punya paspor.", correct: false, feedback: "這是「我沒有護照」，會被海關扣留喔！" }
          ]
        }
      }
    ],

    // ==========================================
    // 6. 智能跟讀庫 (Shadowing Phrases - 12 組精選核心句子)
    // ==========================================
    shadowing_phrases: [
      {
        id: "sh_01",
        category: "生活打招呼",
        id_text: "Selamat pagi! Apa kabar?",
        zh_text: "早安！你好嗎？",
        phonetic_tip: "注意 pagi 重音在 pa-，kabar 的 r 輕輕彈舌。"
      },
      {
        id: "sh_02",
        category: "咖啡廳點餐",
        id_text: "Saya mau pesan es kopi susu aren satu, less sugar ya.",
        zh_text: "我要點一杯冰棕櫚糖拿鐵，少糖喔。",
        phonetic_tip: "aren 發音為 a-ren，less sugar 是印尼咖啡廳通用語。"
      },
      {
        id: "sh_03",
        category: "叫車溝通",
        id_text: "Penjemputan sesuai titik di depan lobi ya, Pak.",
        zh_text: "接送地點照大廳前面定位點喔，司機大哥。",
        phonetic_tip: "titik 字尾 k 是喉塞音，短促乾脆不噴氣。"
      },
      {
        id: "sh_04",
        category: "市集殺價",
        id_text: "Harganya agak mahal Bu, boleh kurang sedikit nggak?",
        zh_text: "價格有點貴耶老闆娘，可以稍微算便宜點嗎？",
        phonetic_tip: "nggak 讀作 /nggak/，是印尼最常用的口語「不/嗎」。"
      },
      {
        id: "sh_05",
        category: "餐廳客製",
        id_text: "Tolong sambalnya dipisah, jangan terlalu pedas.",
        zh_text: "請把辣椒醬另外放，不要太辣。",
        phonetic_tip: "dipisah 重音在 pi-，pedas 重音在 pe-。"
      },
      {
        id: "sh_06",
        category: "社交結交",
        id_text: "Senang bertemu denganmu! Saya dari Taiwan.",
        zh_text: "很高興遇見你！我來自台灣。",
        phonetic_tip: "denganmu 的 ng 是鼻音，mu 輕聲結尾。"
      },
      {
        id: "sh_07",
        category: "超商結帳",
        id_text: "Saya mau isi pulsa Telkomsel dan bayar pakai QRIS.",
        zh_text: "我要儲值 Telkomsel 話費並用 QRIS 掃碼付款。",
        phonetic_tip: "QRIS 在印尼讀作 /kris/。"
      },
      {
        id: "sh_08",
        category: "飯店入住",
        id_text: "Jam berapa sarapan pagi dan di mana restorannya?",
        zh_text: "請問早餐是幾點？餐廳在哪裡呢？",
        phonetic_tip: "sarapan pagi 表示早餐，restoran 重音在 -to-。"
      },
      {
        id: "sh_09",
        category: "TikTok 流行語",
        id_text: "Penampilanmu hari ini menyala abangku!",
        zh_text: "你今天的表現太炸了大哥！🔥",
        phonetic_tip: "menyala 讀作 me-nya-la，ny 是硬顎鼻音。"
      },
      {
        id: "sh_10",
        category: "謙遜俗諺",
        id_text: "Selalu rendah hati dan tetap ilmu padi.",
        zh_text: "永遠謙遜，稻穗越飽滿越低頭。🌾",
        phonetic_tip: "rendah hati = 謙遜，padi = 稻穀。"
      }
    ],

    // ==========================================
    // 7. 詞綴積木與可視化 (Imbuhan Visualizer)
    // ==========================================
    affix_system: {
      introduction: "詞綴 (Imbuhan) 是印尼語進階的核心積木！透過給字根加上前綴、後綴或雙綴，就能衍生出主動、被動、名詞或動作狀態。",
      roots: [
        {
          root: "Tulis",
          meaning: "寫 (基礎字根)",
          derivations: [
            { affix: "meN-", word: "menulis", pos: "動詞 (主動)", explanation: "寫作 / 正在寫字", example: "Saya sedang menulis surat. (我正在寫信。)" },
            { affix: "di-", word: "ditulis", pos: "動詞 (被動)", explanation: "被寫下", example: "Buku ini ditulis oleh Budi. (這本書是 Budi 寫的。)" },
            { affix: "peN-", word: "penulis", pos: "名詞 (人/職位)", explanation: "作家 / 作者", example: "Dia penulis terkenal. (他是知名作家。)" },
            { affix: "-an", word: "tulisan", pos: "名詞 (結果/產物)", explanation: "筆跡 / 文章作品", example: "Tulisannya sangat rapi. (他的字跡非常工整。)" }
          ]
        },
        {
          root: "Ajar",
          meaning: "教 / 學 (基礎字根)",
          derivations: [
            { affix: "ber-", word: "belajar", pos: "動詞 (自身狀態)", explanation: "學習", example: "Kita belajar Bahasa Indonesia. (我們學習印尼語。)" },
            { affix: "meN-", word: "mengajar", pos: "動詞 (施加動作)", explanation: "教授 / 教導別人", example: "Ibu guru mengajar di kelas. (老師在班上教學。)" },
            { affix: "peN-", word: "pelajar", pos: "名詞 (學生)", explanation: "學生 / 學習者", example: "Saya seorang pelajar. (我是一名學生。)" },
            { affix: "peN- ... -an", word: "pelajaran", pos: "名詞 (課程/教訓)", explanation: "課程 / 學課", example: "Pelajaran hari ini sangat menarik. (今天的課程很有趣。)" }
          ]
        },
        {
          root: "Beli",
          meaning: "買 (基礎字根)",
          derivations: [
            { affix: "meN-", word: "membeli", pos: "動詞 (主動購買)", explanation: "購買", example: "Ibu membeli buah di pasar. (媽媽在市場買水果。)" },
            { affix: "di-", word: "dibeli", pos: "動詞 (被動被買)", explanation: "被買走", example: "Barang ini sudah dibeli orang. (這件物品已經被人買走了。)" },
            { affix: "peN-", word: "pembeli", pos: "名詞 (買方/顧客)", explanation: "顧客 / 買家", example: "Ada banyak pembeli di toko. (店裡有很多顧客。)" }
          ]
        },
        {
          root: "Jalan",
          meaning: "走 / 道路 (基礎字根)",
          derivations: [
            { affix: "ber-", word: "berjalan", pos: "動詞 (行走)", explanation: "走路 / 進行", example: "Saya berjalan kaki setiap pagi. (我每天早上走路。)" },
            { affix: "jalan-jalan", word: "jalan-jalan", pos: "動詞 (重疊詞)", explanation: "散步 / 觀光閒逛", example: "Ayo kita jalan-jalan di mall! (我們去商場逛逛吧！)" },
            { affix: "peN- ... -an", word: "perjalanan", pos: "名詞 (旅程)", explanation: "旅途 / 旅程", example: "Selamat menikmati perjalanan! (祝享受旅途愉快！)" }
          ]
        }
      ],
      nasal_rules: [
        { letter: "K -> ng", rule: "字根開頭為 K，前綴 meN- 變成 meng- 且 K 脫落 (如 kirim -> mengirim 寄送)" },
        { letter: "P -> m", rule: "字根開頭為 P，前綴 meN- 變成 mem- 且 P 脫落 (如 pakai -> memakai 使用)" },
        { letter: "T -> n", rule: "字根開頭為 T，前綴 meN- 變成 men- 且 T 脫落 (如 tolong -> menolong 幫助)" },
        { letter: "S -> ny", rule: "字根開頭為 S，前綴 meN- 變成 meny- 且 S 脫落 (如 sapu -> menyapu 掃地)" }
      ]
    },

    // ==========================================
    // 8. 現代口語轉換與語氣助詞 (Baku vs Gaul & Partikel)
    // ==========================================
    gaul_module: {
      baku_vs_gaul: [
        { baku: "Saya", gaul: "Gue / Gua", zh: "我 (同輩/年輕人口語)" },
        { baku: "Kamu / Anda", gaul: "Lu / Elu", zh: "你 (同輩口語)" },
        { baku: "Tidak / Bukan", gaul: "Nggak / Gak", zh: "不 / 不是" },
        { baku: "Sudah", gaul: "Udah", zh: "已經" },
        { baku: "Belum", gaul: "Belom", zh: "還沒" },
        { baku: "Sangat / Sekali", gaul: "Banget", zh: "超級 / 非常 (放在詞後，如 enak banget)" },
        { baku: "Hanya / Saja", gaul: "Cuma / Aja", zh: "只有 / ...就好" },
        { baku: "Bagaimana", gaul: "Gimana", zh: "如何 / 怎樣" },
        { baku: "Kenapa / Mengapa", gaul: "Kenapa", zh: "為什麼" },
        { baku: "Sedang", gaul: "Lagi", zh: "正在 (如 lagi makan 正在吃)" },
        { baku: "Bisa", gaul: "Bisa", zh: "可以 / 會" },
        { baku: "Benarkah?", gaul: "Beneran?", zh: "真的假的？" }
      ],
      particles: [
        { particle: "deh", usage: "表示確定、妥協或無奈建議", example: "Beli yang ini aja deh. (那就買這個吧！)" },
        { particle: "dong", usage: "表示理所當然、撒嬌請求或強調", example: "Bantu aku dong! (幫我一下啦！)" },
        { particle: "kok", usage: "表示困惑驚訝（怎麼會...）或反駁", example: "Kok mahal banget? (怎麼會這麼貴？)" },
        { particle: "sih", usage: "表達疑問語氣加重或好奇", example: "Ada apa sih? (到底發生什麼事了？)" },
        { particle: "nih / tuh", usage: "指近處 (nih 這裡/這個) 或遠處 (tuh 那裡/那個)", example: "Ini kopi buat kamu nih. (這是給你的咖啡喔。)" }
      ],
      chat_slang: [
        { slang: "wkwkwk / xixixi", full: "Tertawa online", zh: "哈哈哈哈 (印尼專屬網民魔性笑聲)" },
        { slang: "gpp", full: "Gak apa-apa", zh: "沒事 / 沒關係" },
        { slang: "otw", full: "On the way", zh: "在路上了 / 快到了" },
        { slang: "bgt", full: "Banget", zh: "非常 / 超級" },
        { slang: "yoi / yo", full: "Iya betul", zh: "對啊 / 沒錯" },
        { slang: "kuy", full: "Yuk (倒著拼)", zh: "走吧 / 來去" },
        { slang: "mantul", full: "Mantap betul", zh: "太給力了 / 絕絕子" },
        { slang: "santuy", full: "Santai", zh: "放輕鬆 / 慢活" }
      ]
    },

    // ==========================================
    // 9. 句型重組拼圖測驗庫 (Sentence Puzzles)
    // ==========================================
    sentence_puzzles: [
      {
        id: "puz_1",
        target_zh: "我正在喝冰咖啡。",
        correct_order: ["Saya", "sedang", "minum", "kopi", "dingin"],
        options: ["Saya", "minum", "kopi", "sedang", "dingin", "teh", "kamu"]
      },
      {
        id: "puz_2",
        target_zh: "這個炒飯非常好吃！",
        correct_order: ["Nasi", "goreng", "ini", "sangat", "enak"],
        options: ["Nasi", "ini", "goreng", "sangat", "enak", "mahal", "tidak"]
      },
      {
        id: "puz_3",
        target_zh: "請問洗手間在哪裡？",
        correct_order: ["Permisi", "di mana", "toilet"],
        options: ["Permisi", "toilet", "di mana", "siapa", "kapan"]
      },
      {
        id: "puz_4",
        target_zh: "這不是我的書。",
        correct_order: ["Ini", "bukan", "buku", "saya"],
        options: ["Ini", "buku", "bukan", "saya", "tidak", "mereka"]
      },
      {
        id: "puz_5",
        target_zh: "明天我們一起去峇里島。",
        correct_order: ["Besok", "kita", "pergi", "ke", "Bali"],
        options: ["Besok", "pergi", "kita", "ke", "Bali", "kemarin", "dari"]
      }
    ]
  }
};

// Write formatted JSON to data.json
fs.writeFileSync(
  path.join(__dirname, '..', 'data.json'),
  JSON.stringify(curriculumData, null, 2),
  'utf-8'
);

console.log('Successfully generated full dual-dialogue dataset in data.json!');
