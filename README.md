# 🇮🇩 Indo Learning Hub & Indo Quest

> **BIPA 權威標準對標 · Duolingo 遊戲化系統深度學習之路 · 跨文化沉浸式學習引擎**
> **線上體驗網址**：[https://waatax.github.io/Indonesia/](https://waatax.github.io/Indonesia/)
> **遊戲化闖關入口**：[https://waatax.github.io/Indonesia/quest/#learn](https://waatax.github.io/Indonesia/quest/#learn)

---

## 🎮 Indo Quest 遊戲化學習系統 (Duolingo Style)

對標 `ENG/quest/#learn`，為印尼語學習者量身打造的沉浸式闖關系統：

### 🌟 核心特色
1. **8 大階段課綱地圖 (Pre-A1 至 C2 · 24 個主題單元全量擴充)**：
   - **S1 (Pre-A1)**：第一步：打招呼、自我介紹與字母發音
   - **S2 (A1)**：生活日常：數字 1–100、時間與人稱代名詞 (Saya, Kamu, Bapak, Ibu)
   - **S3 (A1–A2)**：街頭實戰：印尼小吃點餐、Gojek 摩托叫車與空間方位
   - **S4 (A2)**：當代生活：QRIS 掃碼無現金支付、咖啡社交 (Nongkrong) 與市場殺價
   - **S5 (B1)**：核心詞綴 I：狀態動詞 ber- 與主動及物 meN- 六大鼻音同化規律、tidak vs bukan 徹底搞懂
   - **S6 (B1–B2)**：核心詞綴 II：被動態 di-、意外態 ter-、名詞化 peN- / -an / ke-...-an
   - **S7 (B2)**：雅加達流行口語 (Bahasa Gaul)：語氣助詞 (dong, sih, kok, deh, nih, tuh) 與 TikTok / WA 流行縮寫 (mager, gpp, bucin, gabut, baper)
   - **S8 (C1–C2)**：文化俗諺 (Peribahasa)：印尼處世哲學、自然河流智慧、Gotong Royong 與雙城文化深度對比
   - *（全 24 單元擴增 +10%~+66% 實用內容，題庫自 179 題擴增至 298 題原創題庫）*
2. **🔊 題目與選項全覆蓋語音 (Pronunciation for Questions, Options & Answers)**：
   - **選項即時發音**：多選題每個選項均配備獨立 `🔊` 發音按鈕，點擊選項時即時唸出標準發音，選前先聽，培養敏銳語感。
   - **組句聽覺輔助**：組字題 (Word Bank) 點選詞磚時立即發音，托盤更提供「🔊 朗讀組好的句子」供學習者自我校正。
   - **題目朗讀雙模式**：支援「🔊 聽印尼語發音」、「🐢 慢速 0.7x 音節朗讀」與「🗣️ 朗讀題目說明」。
   - **正解與解說語音**：答題回饋區提供「🔊 朗讀正解發音」與「🗣️ 聽教練解說」語音引導，答錯時自動唸出正解加深印象。
3. **💡 智能提示與深層盲點診斷 (Deep Error Diagnosis & Pedagogical Hints)**：
   - 每道題目配備「💡 查看解題提示」按鈕，卡關時給予字根拆解與語法線索。
   - 答錯時提供精準盲點診斷：智能分析 `tidak` vs `bukan`、`kita` vs `kami`、`setengah` 半點邏輯陷阱、KTSP 鼻音同化規律，並提供好記的記憶口訣。
4. **🔄 閉環機制：「使其學會」(Mastery Loop)**：
   - 答錯題目不會被跳過，而是自動重排至該關卡隊列末尾。
   - 學習者必須在該單元結尾重新理解並正確答出，達成閉環訂正方可通關！
5. **🔥 成癮性激勵機制**：
   - **連勝火焰 (Streak)**：每日打卡累積天數，結合「連勝凍結卡 (Streak Freeze)」防止中斷。
   - **愛心機制 (Hearts)**：魔王挑戰限制 3 顆愛心，考驗綜合實戰。
   - **寶石商店 (Gems Shop)**：累積寶石兌換道具，解鎖各項榮譽勳章。

---

## 🧪 自動化測試與確效

```bash
# 驗證原 17 個教學頁面與知識卡
node scripts/check_knowledge.cjs

# 驗證 Indo Quest 遊戲化架構、題目音訊、提示與狀態機
node scripts/test_quest.cjs

# 驗證進度恢復、重複送答、愛心、間隔複習與完整課程通路
node scripts/test_quest_regressions.mjs
```

---

## 🚀 部署

本專案透過 GitHub Actions 自動部署至 GitHub Pages，每次推送 `main` 分支即自動建置上線。

發布前會執行三組檢查，通過後僅上傳網站使用的 HTML、JavaScript、CSS、資料與 assets/quest 檔案。

### 2026-10-28 學習體驗更新

- 首頁加入下一關、具名關卡、階段進度、每日 XP 目標與任務面板。
- 到期複習按 1、3、7、14、30 天排程；重複答對尚未到期的題目不會提早延長間隔。
- 重新整理可恢復題目位置、錯題與已提交的回饋；魔王愛心歸零不授予通關或王冠。
- 補齊咖啡店、QRIS 結帳、辦公室社交三篇故事，五篇故事皆有可完成的題目。
- 手機安全區、深色模式、鍵盤焦點、減少動畫與離開確認已改善。

進度儲存在目前瀏覽器，不跨裝置同步；語音取決於裝置可用的語音引擎。課程階段為內容導引，並非 CEFR 或 BIPA 能力認證。

設計依據與驗證範圍見 [優化驗證紀錄](QUEST_IMPROVEMENTS.md)。
