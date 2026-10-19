/* 課綱補充：所有頁面共用可存取的知識卡與形成性評量。 */
(() => {
  'use strict';
  const pages = [
    ['map','🧭','課綱導航','A1–C2','依先備知識選擇學習路線，不以累積點擊判定程度。',[
      ['A1 → A2','Saya tidak makan. → Buku yang saya baca.','先建立主詞、述語與否定，再學後置修飾、yang 和主被動。'],
      ['B1 → B2','tulis → menulis / ditulis / penulis / tulisan','先辨識詞根與詞性，再比較 -kan、-i、ke-an 與 peN-an 的功能。'],
      ['C1 → C2','Saya tidak tahu. → Aku nggak tahu.','先辨識語體與對象，再解讀文學、諺語與隱含態度。']],'能辨識詞根後，下一步最適合做什麼？',['比較衍生詞的詞性與句中功能','只背最長的單字'],'詞綴會改變詞性、語態或論元關係；用完整例句檢查。'],
    ['alphabet','🔤','拼寫與發音','A1','辨識母音、字母組合與音節，不把中文近似音當成精確發音。',[
      ['字母組合','ng /ŋ/：dengan；ny /ɲ/：nyanyi','ng 與 ny 各代表一個子音；不要拆成 n 加 g 或 n 加 y。'],
      ['母音 e','empat /ə/；meja /e/','e 的讀音不能只由拼寫確定；連同詞義與示範音一起記。'],
      ['子音對照','cari：c /tʃ/；jalan：j /dʒ/','c 與 j 的差異包含聲帶振動。重音與字尾 k 的實現有地域差異，避免套用絕對規則。']],'nyanyi 中的 ny 應如何處理？',['作為一個鼻音 /ɲ/','分開讀 n 和 y'],'ny 是二合字母；先慢讀 nya，再接 nyi。'],
    ['pronoun','👥','稱謂與人稱','A1–A2','依關係選稱謂，分清包含與排除聽者的「我們」。',[
      ['包含聽者','Kita belajar bersama.｜我們一起學。','kita 包含對方；適合邀請對方一起行動。'],
      ['排除聽者','Kami dari Taiwan.｜我們來自臺灣。','kami 不包含聽者；由團體代表向外人介紹。'],
      ['稱呼選擇','Permisi, Pak/Bu.｜不好意思，先生／女士。','saya 較中性；aku 多用於熟人。Anda 並非所有場合最自然，亦可使用稱謂或姓名。']],'向新同學邀請「我們一起學」用哪一個？',['kita','kami'],'邀請包含聽者，選 kita。'],
    ['grammar','🧩','句法與否定','A1–A2','用述語種類判斷否定，並理解名詞修飾順序。',[
      ['動詞／形容詞否定','Saya tidak minum kopi.｜我不喝咖啡。','tidak 通常否定動詞或形容詞：tidak mahal（不貴）。'],
      ['名詞身分否定','Dia bukan dokter.｜他／她不是醫生。','名詞述語通常用 bukan；belum 表尚未，jangan 表禁止。'],
      ['D–M 與 yang','rumah besar；rumah yang saya sewa','中心名詞在前；yang 引入修飾成分：「我租的房子」。不要照中文順序逐字排。']],'「他不是老師」如何表達？',['Dia bukan guru.','Dia tidak guru.'],'guru 是名詞身分，使用 bukan。'],
    ['numbers','🕒','數字、金額與時間','A1–A2','在交易前讀出完整金額，區分鐘時間與持續長度。',[
      ['位值','15：lima belas；50：lima puluh','belas 是十幾；puluh 是幾十。150：seratus lima puluh。'],
      ['金額','Rp25.000：dua puluh lima ribu rupiah','此處點號分千位；不要把 25.000 當成二十五盾。先確認總額再付款。'],
      ['時刻與長度','pukul tiga：三點；tiga jam：三小時','setengah tiga 是 02:30，指「朝向三點的一半」；正式約時間可用 pukul dua tiga puluh。']],'setengah tiga 是幾點？',['02:30','03:30'],'印尼語的半點指向下一個整點。'],
    ['flashcard','🗂️','主動提取與間隔複習','A1–B2','先回想再翻面，用例句檢驗能否運用。',[
      ['詞義 → 句子','beli → Saya membeli buku.','不只認得「買」；說出誰買了什麼，連同搭配一起學。'],
      ['相似詞對比','meminjam：借入；meminjamkan：借給','以人物與物件記憶：Saya meminjam buku dari Rina.（我向 Rina 借書。）'],
      ['複習流程','今天 → 明天 → 第 3 天 → 第 7 天','這是建議排程；答錯就縮短間隔，能換情境造句才延長。']],'翻面前最有助於記憶的動作？',['先回想詞義並造句','立刻看答案'],'主動提取能暴露真正忘記的內容，再針對錯誤複習。'],
    ['module','💬','會話結構與溝通修復','A1–B1','從招呼、請求到確認，完成一個交際任務。',[
      ['開啟話題','Permisi, boleh saya bertanya?｜不好意思，可以請教嗎？','先引起注意，再提出需求；避免只背孤立問句。'],
      ['澄清與修復','Bisa diulangi lebih pelan?｜可以慢一點再說一次嗎？','不理解時先請對方重說，不用假裝聽懂。'],
      ['確認與結束','Jadi, kita bertemu pukul dua?｜所以我們兩點見？','重述時間、地點與人數，再用 Terima kasih 結束。']],'聽不清楚時應說？',['Bisa diulangi lebih pelan?','Saya sudah mengerti.'],'前者請求慢速重說；後者表示已理解。'],
    ['lesson','🗣️','實境課的四技能任務','A1–B2','把本課會話轉成自己的任務，完成聽、讀、說、寫。',[
      ['聽與讀','先聽一輪 → 記人物、目的與關鍵數字 → 對照逐字稿','先抓大意，再檢查細節。第二輪遮住中文，辨認語塊。'],
      ['說與互動','替換本課的一個地點、一個時間、一個需求','沿用本課句型進行角色交換，再加入澄清問題。'],
      ['寫與回顧','用本課內容寫一則 2–3 句的確認訊息','檢查稱謂、語體、時間與否定；與課文不同的資料也要說得通。']],'完成跟讀後，如何確認能獨立運用？',['替換資訊並交換角色','只重播同一段'],'替換與角色互換可檢查是否理解句型功能。'],
    ['shadowing','🎧','影子跟讀與可理解度','A1–C1','先理解語塊，再同步跟讀；評分只作練習回饋。',[
      ['理解 → 分塊','Bisa / diulangi / lebih pelan?','先知道句意；依意群切分，不要每個字都停頓。'],
      ['慢速 → 原速','0.75× 聽辨 → 1× 跟讀 → 自己重述','加速屬延伸練習；能在自然速度清楚表達比追求極速更重要。'],
      ['錄音自查','檢查母音、字尾、ng/ny 與語句節奏','語音辨識受裝置、環境及口音影響，分數不是正式語言檢定。']],'跟讀前的第一步？',['理解句意並劃分語塊','直接用最高速模仿'],'理解能幫助語塊與節奏形成穩定連結。'],
    ['affix','🧱','詞根、詞綴與語體','A2–C1','用詞族圖辨認詞性，再比較主被動與語體。',[
      ['詞族','tulis → menulis（寫）／ditulis（被寫）／penulis（作者）／tulisan（文字、作品）','詞根相同不代表可以互換；penulis 是人物名詞，tulisan 是結果名詞。'],
      ['鼻音同化','meN- + tulis → menulis；+ sapu → menyapu；+ kirim → mengirim','常見單子音開頭的 p/t/k/s 會脫落；子音群與借詞有例外，例如 memproses。'],
      ['功能與語體','membacakan buku untuk adik；menanami kebun dengan bunga','-kan、-i 要連同動詞搭配學；口語 -in 並非可對所有詞機械替換。di rumah 分寫，ditulis 連寫。']],'「在家」正確拼寫是？',['di rumah','dirumah'],'位置介詞 di 與後面的名詞分開；被動前綴 di- 則連寫。'],
    ['culture','🌏','文化、地區與得體表達','A2–C2','分辨標準語、地方語與社交習慣，避免把單一經驗當全國規則。',[
      ['雅加達語體','Saya tidak tahu. → Aku nggak tahu.','後者是常見非正式說法；工作信件以正式形式為優先。'],
      ['泗水與爪哇語','matur nuwun：爪哇語「謝謝」；terima kasih：印尼語','地方語不是「錯的印尼語」。先使用印尼語，確認對方習慣後再切換。'],
      ['文化語用','Maaf, apakah boleh saya …?｜不好意思，我可以……嗎？','宗教、飲食與家庭習慣因人而異；不確定時禮貌詢問。緊急資源請另查當地官方資訊。']],'matur nuwun 應標示為？',['爪哇語表達','全印尼通用的正式印尼語'],'辨識語言來源可避免在不適合的對象或場合直接套用。'],
    ['phonetics-lab','👄','彈舌練習與發音辨識','A1–B1','以清楚可辨為目標，分辨 r 與 l，再逐步練習舌尖動作。',[
      ['發音位置','r：舌尖靠近上齒齦；l：氣流由舌側通過','保持下顎放鬆；不要靠喉嚨摩擦硬擠出 r。'],
      ['短時練習','ra–ri–ru → rasa → Saya suka rasa ini.','每次短練後休息；不要因持續用力造成不適。'],
      ['辨音回饋','rasa（味道）／拉長的 l 音模仿','中文近似音只是暫時提示，並非等值音標；用示範音與自己的錄音比較。']],'r 練習的主要部位是？',['舌尖與上齒齦附近','喉嚨用力摩擦'],'印尼語 r 常由舌尖彈動實現，避免喉部過度用力。'],
    ['quiz','🧠','句型診斷與錯誤修正','A1–B2','先找述語與核心語序，再檢查修飾及語體。',[
      ['核心語序','Saya / membaca / buku.｜我讀書。','先定位主詞、動詞與受詞，再加入時間、地點；不是所有句子都有動詞。'],
      ['名詞述語','Dia guru.｜他／她是老師。','一般名詞述語可不加 adalah；不要硬套英語 be 動詞規則。'],
      ['訂正順序','述語類型 → tidak/bukan → 修飾順序 → 語境','每次記下錯因並另造一句，不只記住答案的位置。']],'Dia guru. 是否一定要補 adalah？',['不需要，名詞可直接作述語','一定需要'],'一般身分介紹可以直接使用名詞述語。'],
    ['scenarios','📱','現代生活任務與禮貌','A2–B2','能在叫車、付款、咖啡廳、網購等情境提出需求並確認結果。',[
      ['叫車與位置','Saya di depan pintu masuk.｜我在入口前。','用可辨認地標確認接送點；otw 是聊天縮寫，不宜用於正式通知。'],
      ['付款與拆帳','Bisa bayar pakai QRIS?；Bisa bayar terpisah?','詢問是否接受付款方式、是否可分開結帳；不要預設所有店家都支援。'],
      ['點餐與網購','Kopinya jangan terlalu manis, ya.；Apakah barangnya masih tersedia?','清楚說甜度與庫存需求，再確認價格、數量及配送資訊。']],'要詢問「可以分開結帳嗎？」應說？',['Bisa bayar terpisah?','Saya di depan pintu masuk.'],'terpisah 表分開；第二句只是在描述位置。'],
    ['vocab-10k','📚','詞彙深度與搭配','A1–C2','分清詞形、義項、搭配與語域，字數不等於熟練度。',[
      ['一詞多義','bisa：能夠；亦可指毒液','Saya bisa berenang.（我會游泳。）用上下文選義，不能只背第一個翻譯。'],
      ['搭配記憶','mengambil foto：拍照；naik kereta：搭火車','以「動詞＋名詞」保存語塊；不能把中文的動詞逐字替換。'],
      ['詞族辨析','ajar → belajar（學習）／mengajar（教）／pelajar（學生）','構詞有慣用形式；不要把所有詞根套用同一規則。每詞補一個自己的例句。']],'學會 mengambil foto 時最好記成？',['整個「拍照」搭配','只記 mengambil 的單一中文義'],'搭配能幫助在新情境中自然使用詞彙。'],
    ['peribahasa','🌾','諺語的比喻與語境','B2–C2','由字面圖像推到寓意，再判斷是否適合當下對話。',[
      ['圖像 → 寓意','Bagai air di daun talas.｜像芋葉上的水。','比喻立場不定、缺乏定性；不能只按字面描述水。'],
      ['行為 → 態度','Air beriak tanda tak dalam.｜水淺才起波紋。','常用來批評知識不深卻愛炫耀；當面使用可能冒犯。'],
      ['謙遜與語域','Seperti ilmu padi, kian berisi kian merunduk.','稻穗越飽滿越低垂，比喻越有學識越謙虛。現代迷因與傳統諺語應分開辨認。']],'Air beriak tanda tak dalam 常含哪種態度？',['批評淺薄而炫耀','單純讚美口才'],'使用諺語要理解評價方向與人際關係。'],
    ['sentences','✍️','常用句與語體轉換','A1–C1','把固定句改成自己的表達，維持同一段對話的語體一致。',[
      ['請求協助','Bisa bantu saya?｜可以幫我嗎？','更完整可說：Maaf, bisa bantu saya mencari alamat ini?（可以幫我找這個地址嗎？）'],
      ['正式 → 非正式','Saya tidak mengerti. → Aku nggak ngerti.','後者多用於熟人；正式信件保留 saya、tidak 與完整詞形。'],
      ['聊天縮寫解碼','gpp → nggak apa-apa；bgt → banget；otw → on the way','先讀懂完整形式，再使用縮寫；wkwkwk 為笑聲，並非正式詞彙。']],'正式訊息中較合適的是？',['Saya tidak mengerti.','Aku nggak ngerti.'],'前者較中性正式；後者是非正式語體。']
  ];
  const extensions = {
    grammar: [
      ['位置與移動','di rumah（在家）／ke rumah（往家）／dari rumah（從家）','介詞後接位置名詞；di、ke、dari 分寫。ke- 作為詞綴時則連寫，例如 kedua。'],
      ['疑問與時間標記','Siapa namamu?；Kapan kamu berangkat?；Saya sudah makan.','siapa 問人、apa 問事物、kapan 問時間、di mana 問位置、mengapa 問原因、bagaimana 問方式。sudah/sedang/akan 不使動詞變位。'],
      ['主動 → 被動','Rina membaca buku itu. → Buku itu dibaca oleh Rina.','受詞成為被動句主語，動詞改為 di-；代詞施事另有常用結構：Buku itu saya baca.'],
      ['因果、條件與讓步','Saya tinggal di rumah karena hujan.；Kalau hujan, saya tidak pergi.','karena 引原因；kalau/jika 引條件；meskipun 引讓步，tetapi 表轉折。先分清「因為」與「如果」，再連接完整子句。'],
      ['重疊詞','buku-buku（書籍）；jalan-jalan（散步、逛逛）','重疊不一定只表複數，也可形成活動或特殊詞義；有數量詞時通常說 dua buku，不必加重疊。'],
      ['能力、許可與義務','Saya bisa berenang.；Boleh saya masuk?；Saya harus pergi.','bisa：能、會；boleh：可以、獲准；harus：必須。mau 側重意願，akan 側重將來，不宜完全互換。']
    ],
    affix: [
      ['ber- 與 ter-','bersepeda（騎腳踏車）；terbuka（開著的）；tertinggi（最高的）','ber- 常表活動或具有；ter- 可表狀態、非意圖或最高級，須依詞義與上下文辨認。'],
      ['ke-an 與 peN-an','keindahan（美麗這個性質）；kehujanan（淋雨）；penulisan（寫作過程）','ke-an 可構成抽象名詞，也可表遭受狀態。peN-an 常表過程／行為；不是任意詞根都能自由組合。'],
      ['人物與結果','ajar → pengajar（教師）／pelajaran（課、學習內容）','peN- 常形成施事名詞，-an 可形成結果名詞；pelajaran 屬慣用詞族，需整詞學習。'],
      ['語氣助詞','Kok mahal?（怎麼這麼貴？）；Bantu aku, dong.（幫我一下嘛。）','kok 可帶驚訝或質疑；dong 加強請求；sih、deh 的作用隨語調及上下文改變，不宜固定成單一中文詞。']
    ],
    peribahasa: [
      ['C2 文化詮釋任務','比較「稻穗低垂」與中文「滿招損，謙受益」。','先寫共同價值，再寫語用差異；以 80–120 字解釋在勸友、演講與批評情境中使用的效果，勿聲稱人人持有同一價值觀。']
    ],
    sentences: [
      ['C1 語體改寫任務','Aku nggak bisa datang besok. → Mohon maaf, saya tidak dapat hadir besok.','前者：我明天來不了。後者：很抱歉，我明天無法出席。除了詞彙，也調整開場、理由與補救安排。']
    ]
  };
  pages.forEach(page => { if (extensions[page[0]]) page[5].push(...extensions[page[0]]); });
  const diagrams = {
    map: ['學習路線（本站分級）', ['A1 基礎句','A2 修飾／語態','B1 詞族','B2 複雜構詞','C1 語體','C2 文化詮釋']],
    grammar: ['否定選擇圖', ['先看述語','動詞／形容詞 → tidak','名詞身分 → bukan','尚未 → belum','禁止 → jangan']],
    affix: ['tulis 詞族圖', ['tulis 字根','menulis 寫','ditulis 被寫','penulis 作者','tulisan 文字／作品']],
    numbers: ['半點時間軸', ['02:00 dua','02:15 dua lewat lima belas','02:30 setengah tiga','02:45 tiga kurang lima belas','03:00 tiga']]
  };
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount() {
    pages.forEach(([id, icon, title, level, goal, rows, question, options, explanation]) => {
      const view = document.getElementById(`${id}-view`);
      if (!view) return;
      const panel = document.createElement('details');
      panel.className = 'knowledge-panel';
      panel.open = true;
      panel.innerHTML = `<summary><span aria-hidden="true">${icon}</span> ${escape(title)} <small>${level} · 課綱知識補給</small></summary>
        <div class="knowledge-body"><p><strong>學習目標：</strong>${escape(goal)}</p>
        <ol class="knowledge-flow" aria-label="本頁學習順序">${rows.slice(0,3).map(([topic],i) => `<li><span>${i+1}</span>${escape(topic)}</li>`).join('')}</ol>
        <div class="knowledge-table-wrap" tabindex="0" role="region" aria-label="${escape(title)}例句對照表"><table><caption>觀念 → 例句／步驟 → 使用提醒</caption><thead><tr><th scope="col">知識點</th><th scope="col">印尼語例句／學習步驟</th><th scope="col">中文解說與易錯點</th></tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${escape(cell)}</th>`:`<td${i===1?' class="knowledge-example"':''}>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <fieldset class="knowledge-check"><legend>✦ 不看解說，檢查是否掌握</legend><p>${escape(question)}</p>${options.map((option,i)=>`<button type="button" data-answer="${i}">${escape(option)}</button>`).join('')}<p class="knowledge-feedback" role="status" aria-live="polite"></p></fieldset>
        <p class="knowledge-task"><strong>✎ 遷移練習：</strong>選上表一個例子，換成自己的資料或情境，說出或寫下完整答案；回到解說核對理由。</p>
        <details class="knowledge-review"><summary>↻ 答錯後怎麼做？</summary><ol><li>檢查：說出自己混淆的兩個概念。</li><li>修正計畫：選表中相關規則，寫一句判斷理由。</li><li>實作：另造一句，遮住解說再回答。</li><li>複查：明天與第 7 天再提取；若仍答錯，回到先備頁面練習。</li></ol></details>
        <p class="knowledge-source">依本站 IndoCore.MD 編寫；A1–C2 為本站學習路線，非 BIPA 官方等級換算或認證。延伸教材：<a href="https://bipa.kemendikdasmen.go.id/belajar.php" target="_blank" rel="noopener noreferrer">BIPA 官方教材（1–7 級）</a>。</p></div>`;
      const buttons = [...panel.querySelectorAll('[data-answer]')];
      if (diagrams[id]) {
        const [label, nodes] = diagrams[id];
        const figure = document.createElement('figure');
        figure.className = 'knowledge-diagram';
        figure.innerHTML = `<figcaption>${escape(label)}</figcaption><svg viewBox="0 0 640 ${nodes.length*60}" role="img" aria-label="${escape(label+'：'+nodes.join('；'))}">${nodes.map((node,i)=>`<g><rect x="20" y="${i*60+5}" width="600" height="42" rx="10"/><text x="320" y="${i*60+32}" text-anchor="middle">${escape(node)}</text>${i<nodes.length-1?`<path d="M320 ${i*60+47}v18m-5-5 5 5 5-5"/>`:''}</g>`).join('')}</svg><p>${escape(nodes.join(' → '))}</p>`;
        panel.querySelector('.knowledge-table-wrap').before(figure);
      }
      // Alternate answer order without relying on global quiz state.
      if (pages.findIndex(page => page[0] === id) % 2) buttons[1].before(buttons[0]);
      buttons.forEach(button => button.addEventListener('click', () => {
        const correct = button.dataset.answer === '0';
        panel.querySelector('.knowledge-feedback').textContent = `${correct?'✓ 答對了':'↻ 再想想'}：${explanation}`;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      }));
      const heading = view.querySelector('.section-header, .view-header, h2');
      if (heading) (heading.closest('.section-header, .view-header') || heading).after(panel);
      else view.prepend(panel);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
