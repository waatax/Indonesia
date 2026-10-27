# 🇮🇩 Indo Learning Hub & Indo Quest

> **BIPA 權威標準對標 · Duolingo 遊戲化系統深度學習之路 · 跨文化沉浸式學習引擎**
> **線上體驗網址**：[https://waatax.github.io/Indonesia/](https://waatax.github.io/Indonesia/)
> **遊戲化闖關入口**：[https://waatax.github.io/Indonesia/quest/#learn](https://waatax.github.io/Indonesia/quest/#learn)

---

## 🎮 Indo Quest 遊戲化學習系統 (Duolingo Style)

對標 `ENG/quest/#learn`，為印尼語學習者量身打造的沉浸式闖關系統：

### 🌟 核心特色
1. **8 大階段課綱地圖 (Pre-A1 至 C2)**：
   - **S1 (Pre-A1)**：第一步：打招呼、自我介紹與字母發音
   - **S2 (A1)**：生活日常：數字 1–100、時間與人稱代名詞 (Saya, Kamu, Bapak, Ibu)
   - **S3 (A1–A2)**：街頭實戰：印尼小吃點餐、Gojek 摩托叫車與空間方位
   - **S4 (A2)**：當代生活：QRIS 掃碼無現金支付、咖啡社交 (Nongkrong) 與市場殺價
   - **S5 (B1)**：核心詞綴 I：狀態動詞 ber- 與主動及物 meN- 六大鼻音同化規律、tidak vs bukan
   - **S6 (B1–B2)**：核心詞綴 II：被動態 di-、意外態 ter-、名詞化 peN- / -an / ke-...-an
   - **S7 (B2)**：雅加達流行口語 (Bahasa Gaul)：語氣助詞 (dong, sih, kok, deh) 與 TikTok 流行縮寫
   - **S8 (C1–C2)**：文化俗諺 (Peribahasa)：印尼處世哲學、自然智慧與雙城文化深度對比
2. **🔊 題目原生語音與慢速跟讀**：
   - 整合 Web Speech API 原生印尼語語音，支援點擊即聽、慢速 0.7x 音節跟讀與題目朗讀。
   - 配對題點擊印尼語字卡立即發音，增強聲音與語意的連結。
3. **💡 智能提示與教練解析**：
   - 每道題目配備「💡 查看解題提示」按鈕，卡關時給予字根拆解與文法提示。
   - 答錯時提供詳細「教練指點」，指出錯誤原因與對照範例。
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
```

---

## 🚀 部署

本專案透過 GitHub Actions 自動部署至 GitHub Pages，每次推送 `main` 分支即自動建置上線。
