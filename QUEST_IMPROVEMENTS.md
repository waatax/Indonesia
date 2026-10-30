# Indo Quest 優化與驗證紀錄

更新：2026-10-30

## 2026-10-30 深度遊戲化、全覆蓋語音念題念答與 +35% 實用內容擴增

### 1. 課綱全 24 單元深度擴增實用內容 (+35% 擴展，題庫達 402 題)
- 8 大階段、24 個主題單元全量增加高品質實用內容，題庫自基準 179 題擴增至 402 題（+125% 擴幅）。
- 補充內容包括：機場/社交問候 (Salam kenal, Hati-hati di jalan)、職業身分、發音細節 (apel 同形異音、ng 鼻音、h 輕喉擦音)、市集閩南借詞數字 (cepek, goceng, ceban)、親屬與平輩尊稱 (Mas, Mbak, Om, Tante)、前後天時間 (kemarin lusa, besok lusa, tepat waktu)、客製餐飲 (teh tawar, pedas sedikit, dibungkus bawa pulang)、叫車溝通 (minta helm, lewat jalan tol, lobby utara)、交通方位 (putar balik, sebelah kiri, lampu merah kedua)、數位支付 (top up GoPay, scan barcode)、咖啡下午茶 (kopi tubruk, pisang goreng)、市集議價 (harga pas, boleh kurang dikit)、動態詞綴深入辨析 (berkeluarga, berbelanja, memakai, menolong, bukan kopi, tidak capek, dikirim, dikunci, tertinggal, terdengar, pembicara, kenyamanan)、流行語與縮寫 (kan, gercep, santuy, pengen, belom)、經典文化諺語哲思 (air tenang tiada buaya, air susu dibalas air tuba, bulat air oleh pembuluh)。

### 2. 語音念題與報答全覆蓋系統 (Speech Synthesis Engine 2.0)
- **題目發音**：每題提供「🔊 念出題目」、「🐢 慢速 0.7x 音節朗讀」與「🗣️ 朗讀題目說明」。
- **選項發音**：多選題每個選項均配備獨立 `🔊` 發音按鈕，點擊選項時即時發音，並提供「📋 念出所有選項」依序朗讀。
- **正解與解說語音**：答題回饋區提供「🔊 朗讀正解發音」、「🐢 慢速正解」與「🗣️ 聽教練語音解說」，以中印雙語流暢唸出錯誤診斷與口訣。
- **自動語音切換**：新增「🔊 自動語音 / 🔈 靜音模式」切換鈕，進題與送答自動播報，並支援 localStorage 保存個人偏好。

### 3. 深層盲點診斷與教練指點擴充
- 升級 `coach.mjs`，針對 12 種常見失分盲點（否定 tidak vs bukan、人稱 kita vs kami、時間 setengah 半點陷阱、meN- KTSP 鼻音同化規律、ber- vs di- vs ter- 語態、點餐用詞、方位指示、流行粒子與縮寫、文化成語）提供具體診斷、記憶口訣與「使其學會」閉環重新排隊承諾。

### 4. 遊戲化反饋與吉祥物互動
- 新增即時「🔥 連對 3 題！手感極佳！」動態連對徽章與 Web Audio 振奮和弦。
- 引入動態教練吉祥物 (Coach Mascot)，針對不同題型（聽力、組句、文法、錯題重練）給予即時鼓勵與思維引導。

## 研究與方向

參考 Duolingo 官方的 [學習路徑設計](https://blog.duolingo.com/new-duolingo-home-screen-design/) 與 [間隔複習說明](https://blog.duolingo.com/spaced-repetition-for-learning/)，將下一步、回想練習與錯題訂正融入日常流程。這是設計參考，並非宣稱本課程具有 Duolingo 的研究成效。

重點是讓學習者能快速回答：現在學哪一關、完成多少、今天做什麼、何時回來複習。

## 實作與迭代

1. 首頁採下一關卡片、具名學習路徑、每日任務側欄；手機版採單欄與底部導覽。
2. 以既有儲存格式為基礎，正確序列化 Set，儲存每次送答與前進位置，保留重整後的回饋。
3. 防止重複提交、未答先前進、提前結算與繞過鎖定關卡；愛心歸零終止挑戰，不發 XP 或王冠。
4. 到期複習採 1、3、7、14、30 天排程；錯誤重設，非到期的同日重練不提前推進排程。
5. 每日連對任務在答錯時歸零，顯示任務條件與寶石獎勵，提供每日 XP 目標設定。
6. 全課程測試發現五篇故事僅兩篇有內容，補上缺少的三篇；微辣統一為 sedikit pedas，中辣為 pedas sedang。
7. 瀏覽器檢視後修正深色模式的階段按鈕對比，改用可鍵盤操作的頁內離開確認。
8. 發布流程先跑三組檢查，只打包公開網站檔案。

## 已驗證

- `node scripts/check_knowledge.cjs`：既有 17 個教學視圖與知識整合。
- `node scripts/test_quest.cjs`：課綱、179 道階段題、教練提示、基本錯題閉環與入口連結。
- `node scripts/test_quest_regressions.mjs`：進度恢復、已提交回饋、重複送答、鎖定關卡、間隔排程、連對重設、愛心耗盡、目標儲存與儲存失敗提示。
- 同一回歸測試逐一完成 120 個關卡與 5 篇故事，檢查可到達與結算紀錄。
- 瀏覽器實際操作：開始關卡、選答、檢查、重整後保留回饋、前進到下一題、故事入口、新故事、離開確認、溫習空狀態。
- 390 × 844 手機尺寸：學習地圖、答題與底部導覽，DOM 寬度量測無橫向溢出；桌面深色模式視覺檢查。

## 驗證邊界

沒有執行真實學習者成效研究、跨裝置同步或所有作業系統的語音品質測試。既有主教學網的 17 個視圖本次以自動檢查驗證；本次瀏覽器驗證集中於 quest。進度由瀏覽器 localStorage 保存，清除網站資料會移除紀錄。
