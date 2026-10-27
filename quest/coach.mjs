// coach.mjs
// Indonesian pedagogical feedback and correction tips to ensure mastery.

export function answerText(it) {
  if (!it) return '';
  if (it.type === 'match') {
    return (it.pairs || []).map(p => `${p[0]} ＝ ${p[1]}`).join('； ');
  }
  if (it.type === 'build') {
    return String(it.answer ?? '');
  }
  if (it.type === 'listen') {
    return `${it.answer}${it.audio ? ` (朗讀: ${it.audio})` : ''}`;
  }
  if (it.type === 'input') {
    return String(it.answer ?? '');
  }
  return String(it.answer ?? '');
}

export function correctionTip(it, value) {
  if (!it) return '請再看一次正確答案，遮住答案自己複誦一次！';

  // Specific coach tips based on exercise type and item hints
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

  if (it.why) {
    return `${baseTip}\n💡 教練指點：${it.why}`;
  }
  if (it.hint) {
    return `${baseTip}\n💡 提點：${it.hint}`;
  }
  return baseTip;
}
