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
  let specificDiagnosis = '';

  // 1. Negation: tidak vs bukan
  if (
    it.id?.includes('tidak-vs-bukan') ||
    it.why?.includes('tidak') ||
    it.why?.includes('bukan') ||
    (it.answer && (String(it.answer).toLowerCase().includes('tidak') || String(it.answer).toLowerCase().includes('bukan')))
  ) {
    if (valStr.includes('tidak') && String(it.answer).toLowerCase().includes('bukan')) {
      specificDiagnosis = '🔍 盲點診斷：你選了 tidak，但空格後面是「名詞或身分」！印尼語鐵律：否定名詞只能用 bukan，否定動詞與形容詞才用 tidak。';
    } else if (valStr.includes('bukan') && String(it.answer).toLowerCase().includes('tidak')) {
      specificDiagnosis = '🔍 盲點診斷：你選了 bukan，但空格後面是「動詞或形容詞」！印尼語規定：bukan 絕不能用來直接否定動詞或形容詞。';
    }
  }

  // 2. Pronouns: kita vs kami
  if (
    it.id?.includes('kita-vs-kami') ||
    it.why?.includes('kita') ||
    it.why?.includes('kami') ||
    (it.answer && (String(it.answer).toLowerCase().includes('kita') || String(it.answer).toLowerCase().includes('kami')))
  ) {
    if (valStr.includes('kita')) {
      specificDiagnosis = '🔍 盲點診斷：Kita 是「包含聽話者（大家一起）」的我們；本題情境排除聽話者，必須用 Kami！口訣：Ki-ta 是一體的，Ka-mi 不帶你！';
    } else if (valStr.includes('kami')) {
      specificDiagnosis = '🔍 盲點診斷：Kami 排除聽話者；若要邀約對方大家一起出發，必須用包含性的 Kita！口訣：Ki-ta 是一體的，Ka-mi 不帶你！';
    }
  }

  // 3. Time: Setengah
  if (
    it.id?.includes('setengah') ||
    it.prompt?.includes('半') ||
    it.why?.includes('setengah') ||
    it.hint?.includes('setengah') ||
    valStr.includes('setengah')
  ) {
    specificDiagnosis = '🔍 盲點診斷：注意印尼時間陷阱！Jam setengah delapan 字面是「差半小時就八點」，代表 7:30，千萬不要誤算成 8:30 喔！';
  }

  // 4. Affix meN- nasal assimilation
  if (it.why?.includes('KTSP') || it.why?.includes('鼻音') || it.id?.includes('men-')) {
    specificDiagnosis = '🔍 盲點診斷：留意 K, T, S, P 四大清輔音同化規則！遇及物前綴 meN- 時首音會脫落（tulis -> me + n + ulis = menulis）。';
  }

  // Base coach tip by question type
  let baseTip = '';
  if (it.type === 'match') {
    baseTip = '先將每個印尼單字與中文念過一次，找出有把握的字詞配對。答錯的字卡會再次練習！';
  } else if (it.type === 'build') {
    baseTip = '注意印尼語修飾詞後置 (D-M 法則) 與 SVO 主謂賓順序，對照上方正確詞序後朗讀一次。本題已重新排入隊列！';
  } else if (it.type === 'input') {
    baseTip = `比對你的拼寫「${String(value ?? '')}」與正解，留意字母拼讀、前綴鼻音同化與字尾截斷。本題會再次出現讓你征服！`;
  } else if (it.type === 'listen') {
    baseTip = '點擊上方慢速烏龜按鈕重聽發音，對照正解音節，抓住關鍵發音特徵！本題已重新排入隊列。';
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
