// coach.mjs
// Indonesian pedagogical feedback, error diagnosis, and coach explanations.

export function answerText(it) {
  if (!it) return '';
  if (it.type === 'match') {
    return (it.pairs || []).map(p => `${p[0]} ＝ ${p[1]}`).join('； ');
  }
  if (it.type === 'build') {
    return String(it.answer ?? '');
  }
  if (it.type === 'listen') {
    return `${it.answer}${it.audio && it.audio !== it.answer ? ` (原文: ${it.audio})` : ''}`;
  }
  if (it.type === 'input') {
    return String(it.answer ?? '');
  }
  return String(it.answer ?? '');
}

// Clean text for speech synthesis narration
export function spokenAnswer(it) {
  if (!it) return '';
  if (it.type === 'match') {
    return (it.pairs || []).map(p => `${p[0]}，意思為：${p[1]}`).join('。');
  }
  if (it.audio) {
    return it.audio;
  }
  let raw = String(it.answer ?? '');
  // Clean parenthetical notes and slashes for natural speech
  raw = raw.replace(/\([^)]*\)/g, '').replace(/（[^）]*）/g, '').trim();
  if (raw.includes('/')) raw = raw.split('/')[0].trim();
  return raw;
}

// Generates targeted diagnosis based on user's wrong answer and exercise characteristics
export function correctionTip(it, value) {
  if (!it) return '請再看一次正確答案，遮住答案自己複誦一次！';

  const valStr = String(value ?? '').toLowerCase().trim();
  const ansStr = String(it.answer ?? '').toLowerCase().trim();
  let specificDiagnosis = '';

  // 1. Negation: tidak vs bukan
  if (
    it.id?.includes('tidak-vs-bukan') ||
    it.why?.includes('tidak') ||
    it.why?.includes('bukan') ||
    (it.answer && (ansStr.includes('tidak') || ansStr.includes('bukan')))
  ) {
    if (valStr.includes('tidak') && ansStr.includes('bukan')) {
      specificDiagnosis = '🔍 盲點診斷：你選了 tidak，但空格後面是「名詞或身分」！印尼語鐵律：否定名詞只能用 bukan，否定動詞與形容詞才用 tidak。口訣：否定名詞找 bukan，動態形容交給 tidak！';
    } else if (valStr.includes('bukan') && ansStr.includes('tidak')) {
      specificDiagnosis = '🔍 盲點診斷：你選了 bukan，但空格後面是「動詞或形容詞」！印尼語規定：bukan 絕不能用來直接否定動詞或形容詞。口訣：否定名詞找 bukan，動態形容交給 tidak！';
    } else if (!specificDiagnosis) {
      specificDiagnosis = '🔍 盲點診斷：留意印尼語否定體系！bukan 專門否定名詞與身分歸屬，tidak 專門否定動詞與形容詞。';
    }
  }

  // 2. Pronouns: kita vs kami & polite terms
  if (
    it.id?.includes('kita-vs-kami') ||
    it.why?.includes('kita') ||
    it.why?.includes('kami') ||
    (it.answer && (ansStr.includes('kita') || ansStr.includes('kami')))
  ) {
    if (valStr.includes('kita')) {
      specificDiagnosis = '🔍 盲點診斷：Kita 是「包含聽話者（大家一起）」的我們；本題情境排除聽話者，必須用 Kami！口訣：Ki-ta 是一體的，Ka-mi 不帶你！';
    } else if (valStr.includes('kami')) {
      specificDiagnosis = '🔍 盲點診斷：Kami 排除聽話者；若要邀約對方大家一起出發，必須用包含性的 Kita！口訣：Ki-ta 是一體的，Ka-mi 不帶你！';
    }
  }
  if (!specificDiagnosis && (it.id?.includes('bapak') || it.why?.includes('尊稱') || it.why?.includes('人稱代名詞'))) {
    specificDiagnosis = '🔍 盲點診斷：注意印尼人際尊稱文化！對陌生長輩男性稱 Pak/Bapak，女性稱 Bu/Ibu；年輕平輩服務員稱 Mas (男) 或 Mbak/Kak (女) 最親切得體。';
  }

  // 3. Time: Setengah & Days
  if (
    it.id?.includes('setengah') ||
    it.prompt?.includes('半') ||
    it.why?.includes('setengah') ||
    it.hint?.includes('setengah') ||
    valStr.includes('setengah')
  ) {
    specificDiagnosis = '🔍 盲點診斷：注意印尼時間陷阱！Jam setengah delapan 字面是「差半小時就八點」，代表 7:30，千萬不要誤算成 8:30 喔！口訣：Setengah X 代表 X 點前 30 分鐘！';
  }

  // 4. Affix meN- nasal assimilation
  if (it.why?.includes('KTSP') || it.why?.includes('鼻音') || it.id?.includes('men-')) {
    specificDiagnosis = '🔍 盲點診斷：留意 K, T, S, P 四大清輔音同化規則！遇及物前綴 meN- 時首音會脫落（K->meng, T->men, S->meny, P->mem）。例如 tulis -> menulis, pakai -> memakai。濁音 B, D, G 則不脫落！';
  }

  // 5. Affix Aspect: ber- vs di- vs ter-
  if (!specificDiagnosis && (it.id?.includes('ber-') || it.id?.includes('di-') || it.id?.includes('ter-'))) {
    if (it.id?.includes('ber-')) {
      specificDiagnosis = '🔍 盲點診斷：前綴 ber- 表示狀態、自發從事該活動或擁有某物（不及物，後面不直接接賓語）。例如 bermain (玩耍)、bermobil (開車)。';
    } else if (it.id?.includes('di-')) {
      specificDiagnosis = '🔍 盲點診斷：前綴 di- 是被動語態的標誌，主語通常是承受動作的物件。例如 buku dibaca (書被閱讀)。';
    } else if (it.id?.includes('ter-')) {
      specificDiagnosis = '🔍 盲點診斷：前綴 ter- 核心有兩大功能：1. 無意、不由自主的意外狀態（terjatuh 跌倒）；2. 形容詞最高級（terbaik 最好）。';
    }
  }

  // 6. Food & Dining terms
  if (!specificDiagnosis && (it.id?.includes('bungkus') || it.why?.includes('點餐') || it.why?.includes('外帶'))) {
    specificDiagnosis = '🔍 盲點診斷：印尼點餐關鍵詞：Dibungkus 是打包外帶，Makan di sini 是內用；Teh tawar 是無糖淡茶，Teh manis 是含糖甜茶。';
  }

  // 7. Navigation directions
  if (!specificDiagnosis && (it.id?.includes('lurus') || it.id?.includes('kanan') || it.id?.includes('kiri') || it.why?.includes('方位'))) {
    specificDiagnosis = '🔍 盲點診斷：方位三劍客：Lurus (直走)、Kanan (右轉)、Kiri (左轉)；Putar balik 是迴轉，Di seberang jalan 是在馬路正對面。';
  }

  // 8. Bahasa Gaul particles & acronyms
  if (!specificDiagnosis && (it.id?.includes('particle') || it.why?.includes('語氣助詞') || it.id?.includes('slang') || it.why?.includes('縮寫'))) {
    if (it.why?.includes('dong') || valStr.includes('dong')) {
      specificDiagnosis = '🔍 盲點診斷：Dong 讓請求變得親切軟化，或表達理所當然；Kok 表達驚訝反問「怎麼會」；Sih 帶有探問好奇情緒；Deh 促成決定勸誘。';
    } else if (it.why?.includes('mager') || it.why?.includes('bucin') || it.why?.includes('gercep')) {
      specificDiagnosis = '🔍 盲點診斷：印尼網路流行縮寫：mager (malas gerak 懶得動)、bucin (budak cinta 戀愛腦)、gercep (gerak cepat 動作超快神速)、gpp (gak apa-apa 沒事)。';
    }
  }

  // 9. Cultural proverbs (Peribahasa)
  if (!specificDiagnosis && (it.id?.startsWith('u8') || it.why?.includes('俗諺') || it.why?.includes('成語'))) {
    specificDiagnosis = '🔍 盲點診斷：印尼俗諺 (Peribahasa) 重在象徵寓意：觀察自然萬物比喻做人道理。請對照字面隱喻與深層哲理！';
  }

  // Base coach tip by question type
  let baseTip = '';
  if (it.type === 'match') {
    baseTip = '先將每個印尼單字與中文念過一次，找出有把握的字詞配對。答錯的字卡會再次練習！';
  } else if (it.type === 'build') {
    baseTip = '注意印尼語修飾詞後置 (D-M 法則) 與 SVO 主謂賓順序，對照上方正確詞序後朗讀一次。本題已重新排入隊列末尾！';
  } else if (it.type === 'input') {
    baseTip = `比對你的拼寫「${String(value ?? '')}」與正解，留意字母拼讀、前綴鼻音同化與字尾截斷。本題已重新排入隊列末尾，過關前會再次出現讓你征服！`;
  } else if (it.type === 'listen') {
    baseTip = '點擊上方慢速烏龜按鈕重聽發音，對照正解音節，抓住關鍵發音特徵！本題已重新排入隊列末尾。';
  } else {
    baseTip = '先閱讀題目解析找出線索，比較正解與其他選項的差別。本題已排入隊列末尾，過關前必須再次答對！';
  }

  const parts = [];
  if (specificDiagnosis) parts.push(specificDiagnosis);
  if (it.why) parts.push(`💡 教練指點：${it.why}`);
  if (it.hint) parts.push(`🔑 解題提示：${it.hint}`);
  parts.push(baseTip);

  return parts.join('\n');
}
