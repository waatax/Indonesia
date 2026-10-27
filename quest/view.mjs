// view.mjs
// Duolingo-style UI for Indo Quest: Learn trail, interactive sessions, coach, speech, and practice.

import {
  createCourse,
  createGame,
  isScored,
  XP,
  BADGES,
  HEARTS,
  normalize,
  localDay,
  streakOf
} from './engine.mjs';
import { QUEST_POOL, GOALS } from './engine.mjs';
import * as sound from './sound.mjs';
import { answerText, correctionTip } from './coach.mjs';

const root = document.querySelector('#game');
let storage;
try {
  storage = globalThis.localStorage;
} catch {}

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let course, game;
const ui = {
  tab: 'learn',
  sectionId: 's1',
  sessionResult: null,
  activeFeedback: null,
  selectedChoice: null,
  placedTokens: [],
  inputVal: '',
  matchSelected: null,
  matchedPairs: new Set(),
  showHint: false,
  activeGuide: null,
  confirmExit: false,
  notice: ''
};

// Data fetcher
async function fetchJson(path) {
  const res = await fetch(`${path}?v=20261027-journey`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

async function boot() {
  try {
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;width:100%;font-weight:700;color:var(--green);gap:16px;">
        <div style="font-size:48px;animation:spin 1s infinite linear;">🇮🇩</div>
        <p style="font-size:18px;">正在載入印尼語闖關世界...</p>
      </div>
      <style>@keyframes spin { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }</style>
    `;

    const indexData = await fetchJson('course/index.json');
    course = createCourse(indexData);
    game = createGame({ storage, course });

    // Pre-load all 8 sections, stories and vocab
    const loads = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 'stories', 'vocab'].map(name =>
      fetchJson(`course/${name}.json`)
        .then(data => course.register(data))
    );
    await Promise.all(loads);

    ui.activeFeedback = game.currentSession()?.feedback || null;
    const nextNode = [...course.nodes.values()].find(n => game.nodeStatus(n.id) === 'available' && n.kind !== 'boss');
    ui.sectionId = nextNode?.section || 's1';
    readRoute();
    window.addEventListener('hashchange', () => { readRoute(); render(); });
    // Initial render
    render();
    bindEvents();
    bindKeyboard();
  } catch (err) {
    console.error('Boot error:', err);
    root.innerHTML = `
      <div style="padding:40px;text-align:center;">
        <h2>載入失敗</h2>
        <p style="color:var(--red);margin:16px 0;">${esc(err.message)}</p>
        <button class="action-btn check" onclick="location.reload()">重新整理</button>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// Render Orchestrator
// -------------------------------------------------------------
function render() {
  const focusKey = document.activeElement?.closest('[data-choice], [data-token], [data-tray-index], [data-match-idx], [data-act], [data-nav]');
  const focusAttr = focusKey && [...focusKey.attributes].find(a => a.name.startsWith('data-'));
  renderContent();
  if (focusAttr) [...root.querySelectorAll(`[${focusAttr.name}]`)].find(el => el.getAttribute(focusAttr.name) === focusAttr.value)?.focus({ preventScroll: true });
}

function readRoute() {
  const tab = location.hash.slice(1);
  if (['learn', 'practice', 'stories', 'library', 'profile'].includes(tab)) ui.tab = tab;
}

function renderContent() {
  const session = game.currentSession();
  if (ui.sessionResult) {
    root.innerHTML = renderSummary(ui.sessionResult);
    return;
  }
  if (session) {
    root.innerHTML = renderLesson(session);
    return;
  }

  root.innerHTML = `
    <div class="quest-layout">
      ${renderRail()}
      <main class="quest-main" id="main-content">
        ${renderTopBar()}
        ${game.warning ? `<p class="storage-warning" role="status">${esc(game.warning)}</p>` : ''}
        ${ui.notice ? `<p class="storage-warning" role="status">${esc(ui.notice)}</p>` : ''}
        ${
          ui.tab === 'learn'
            ? renderLearn()
            : ui.tab === 'practice'
            ? renderPractice()
            : ui.tab === 'stories'
            ? renderStories()
            : ui.tab === 'library'
            ? renderLibrary()
            : renderProfile()
        }
      </main>
      ${renderBottomBar()}
      ${renderGuideModal()}
    </div>
  `;
}

// -------------------------------------------------------------
// Desktop Left Rail
// -------------------------------------------------------------
function renderRail() {
  const tabs = [
    { id: 'learn', label: '學習地圖', icon: '🗺️' },
    { id: 'practice', label: '溫習訂正', icon: '🎯' },
    { id: 'stories', label: '情境故事', icon: '💬' },
    { id: 'library', label: '文法詞典', icon: '📖' },
    { id: 'profile', label: '個人成就', icon: '👤' }
  ];

  return `
    <aside class="quest-rail">
      <div class="quest-brand">
        <span class="quest-logo-icon">🇮🇩</span>
        <div>
          <h1 class="quest-brand-title">Indo Quest</h1>
          <span class="quest-brand-sub">遊戲化印尼語闖關</span>
        </div>
      </div>
      <nav class="quest-nav">
        ${tabs
          .map(
            t => `
          <button class="quest-nav-btn ${ui.tab === t.id ? 'active' : ''}" data-nav="${t.id}" ${ui.tab === t.id ? 'aria-current="page"' : ''}>
            <span class="quest-nav-icon">${t.icon}</span>
            <span>${esc(t.label)}</span>
          </button>
        `
          )
          .join('')}
      </nav>
      <div class="quest-rail-footer">
        <div class="quest-stat-pill streak">
          <span>🔥 連勝天數</span>
          <span>${game.streak()} 天</span>
        </div>
        <div class="quest-stat-pill gems">
          <span>💎 累積寶石</span>
          <span>${game.state.gems}</span>
        </div>
        <div class="quest-stat-pill freeze">
          <span>❄️ 凍結保護卡</span>
          <span>${game.state.freezes} 張</span>
        </div>
      </div>
    </aside>
  `;
}

// Mobile Bottom Navigation Bar
function renderBottomBar() {
  const tabs = [
    { id: 'learn', label: '地圖', icon: '🗺️' },
    { id: 'practice', label: '溫習', icon: '🎯' },
    { id: 'stories', label: '故事', icon: '💬' },
    { id: 'library', label: '詞典', icon: '📖' },
    { id: 'profile', label: '個人', icon: '👤' }
  ];

  return `
    <nav class="quest-bottom-bar">
      ${tabs
        .map(
          t => `
        <button class="mobile-nav-btn ${ui.tab === t.id ? 'active' : ''}" data-nav="${t.id}" ${ui.tab === t.id ? 'aria-current="page"' : ''}>
          <span class="mobile-nav-icon">${t.icon}</span>
          <span>${esc(t.label)}</span>
        </button>
      `
        )
        .join('')}
    </nav>
  `;
}

// Top Bar with streak, gems, hearts, and hub link
function renderTopBar() {
  return `
    <div class="quest-top-bar">
      <div class="quest-badges-group">
        <span class="badge-item streak" title="連勝天數">🔥 ${game.streak()}</span>
        <span class="badge-item gems" title="寶石數量">💎 ${game.state.gems}</span>
        <span class="badge-item" title="累積經驗值">⚡ ${game.state.xp.total} XP</span>
      </div>
      <a href="../" class="back-to-hub-btn" title="返回印尼語學習大廳">
        <span>🏛️ 回主教學網</span>
      </a>
    </div>
  `;
}

// -------------------------------------------------------------
// Learn Tab (The Winding Map Trail)
// -------------------------------------------------------------
function renderLearn() {
  const currentSec = course.section(ui.sectionId) || course.index.sections[0];
  const allSections = course.index.sections;
  const nodes = currentSec.units.flatMap(u => u.nodes);
  const completed = nodes.filter(n => ['done', 'crowned'].includes(game.nodeStatus(n.id))).length;
  const next = nodes.find(n => game.nodeStatus(n.id) === 'available' && n.kind !== 'boss') || nodes.find(n => game.nodeStatus(n.id) === 'available');
  const todayXp = game.state.xp.days[game.today()] || 0;

  return `
    <div class="journey-heading"><div><p class="eyebrow">BAHASA INDONESIA · 你的印尼語冒險</p><h2>Selamat datang! <span>今天也進步一點。</span></h2></div><span class="journey-stamp">🇮🇩 中文 × 印尼語</span></div>
    <div class="learning-grid"><div class="learning-path">
    <section class="next-lesson-card">
      <div class="travel-mark" aria-hidden="true">🏝️</div>
      <div><p class="eyebrow">${next ? '準備好了嗎？下一站是' : '這個階段已完成'}</p><h3>${next ? esc(next.title) : '做得好！重溫或探索下一階段'}</h3><p>約 3 分鐘 · 聽、選、組句，開口更有自信</p></div>
      ${next ? `<button class="action-btn check" data-node="${next.id}">開始學習 →</button>` : '<button class="action-btn check" data-nav="practice">溫習一下 →</button>'}
    </section>
    <div class="section-banner ${currentSec.color}">
      <p class="section-banner-eyebrow">第 ${currentSec.no} 階段 · ${esc(currentSec.level)}</p>
      <h2 class="section-banner-title">${esc(currentSec.title)}</h2>
      <p class="section-banner-sub">已完成 ${completed} / ${nodes.length} 關 · 一般練習不限愛心，魔王挑戰 3 顆愛心</p>
      <progress class="section-progress" value="${completed}" max="${nodes.length}" aria-label="階段完成進度"></progress>
      <div class="section-switcher">
        ${allSections
          .map(
            s => `
          <button class="section-chip ${s.id === currentSec.id ? 'active' : ''}" data-select-section="${s.id}" aria-pressed="${s.id === currentSec.id}">
            第 ${s.no} 階 · ${esc(s.level.split(' ')[0])}
          </button>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="trail-container">
      ${(currentSec.units || [])
        .map((u, uIdx) => {
          return `
          <div class="unit-card">
            <div class="unit-header">
              <div class="unit-header-info">
                <span class="unit-header-icon">${u.icon || '🌱'}</span>
                <span class="unit-header-title">${esc(u.title)}</span>
              </div>
              <button class="unit-guide-btn" data-guide="${u.id}">
                <span>📘 單元手冊</span>
              </button>
            </div>
            ${(u.nodes || [])
              .map((n, nIdx) => {
                const status = game.nodeStatus(n.id);
                const posClass = `pos-${(nIdx * 2 + uIdx) % 6}`;
                const isBoss = n.kind === 'boss';
                const icon = status === 'crowned' ? '👑' : status === 'done' ? '✓' : n.icon || '⭐';

                return `
                <div class="node-row ${posClass} ${n.id === next?.id ? 'next-node' : ''}">
                  <button class="node-btn ${status} ${isBoss ? 'boss' : ''}" 
                          data-node="${n.id}" 
                          ${status === 'locked' ? 'disabled' : ''} 
                          aria-label="${esc(n.title)}：${({ locked: '尚未解鎖', available: '可以開始', done: '已完成', crowned: '已獲王冠' })[status]}" title="${esc(n.title)}">
                    ${icon}
                    ${status === 'crowned' ? '<span class="node-crown-tag">👑</span>' : ''}
                  </button>
                  <span class="node-label">${esc(n.title)}<small>${n.id === next?.id ? '從這裡開始' : status === 'locked' ? '完成前面的練習解鎖' : status === 'done' || status === 'crowned' ? '已完成 · 可以重溫' : isBoss ? '綜合挑戰 · 3 顆愛心' : '準備出發'}</small></span>
                </div>
              `;
              })
              .join('')}
          </div>
        `;
        })
        .join('')}
    </div>
    <p class="path-note">課程階段為內容導引，完成闖關不等同取得 CEFR 或 BIPA 能力認證。</p>
    </div><aside class="daily-panel" aria-label="每日學習進度">
      <section class="dashboard-card"><p class="eyebrow">SEDIKIT DEMI SEDIKIT</p><h3>每天一小步 🌱</h3><p>把印尼語變成日常。今天先完成一個小目標。</p><div class="daily-xp"><strong>${todayXp}</strong><span>/ ${game.goalXp()} XP</span><span>${todayXp >= game.goalXp() ? '✓ 達標' : '今日目標'}</span></div><progress value="${Math.min(todayXp, game.goalXp())}" max="${game.goalXp()}" aria-label="每日經驗值目標"></progress><label class="goal-label" for="daily-goal">我的每日目標</label><select id="daily-goal">${Object.entries(GOALS).map(([key, xp]) => `<option value="${key}" ${game.state.profile.goal === key ? 'selected' : ''}>${({ casual: '輕鬆學', regular: '穩定學', serious: '認真學', intense: '挑戰自己' })[key]} · ${xp} XP</option>`).join('')}</select></section>
      <section class="dashboard-card"><h3>今日任務 ✨</h3><p>每項完成獲得 10 💎，全部完成再加 20 💎。</p><div class="daily-quests">${game.state.quests.list.map(q => { const def = QUEST_POOL.find(x => x.id === q.id); return `<div class="daily-quest"><span>${q.done ? '✅' : def.icon}</span><div><strong>${esc(def.label)}</strong><progress value="${q.n}" max="${q.target}" aria-label="${esc(def.label)}"></progress></div><small>${q.n}/${q.target}</small></div>`; }).join('')}</div></section>
      <section class="dashboard-card review-nudge"><h3>讓記憶更牢固 🎯</h3><p>${game.dueItems().length} 題到期複習 · ${game.state.mistakes.length} 題待訂正</p><button class="unit-guide-btn" data-nav="practice">前往溫習 →</button></section>
    </aside></div>
  `;
}

// -------------------------------------------------------------
// Interactive Lesson Screen
// -------------------------------------------------------------
function renderLesson(session) {
  const item = game.currentItem();
  if (!item) return `<div class="session-overlay"><p>載入題目中...</p></div>`;

  const total = session.queue.length;
  const current = session.current;
  const progressPercent = Math.min(100, Math.round((current / Math.max(1, total)) * 100));
  const isRemediating = session.mistakes.has(session.queue[current]);

  const kindNames = {
    word: '🔤 單字辨析',
    talk: '💬 實用會話',
    grammar: '📐 文法核心',
    drill: '🎯 實戰應用',
    boss: '🏆 魔王挑戰'
  };

  return `
    <div class="session-overlay">
      <header class="session-header">
        <button class="session-close-btn" data-act="cancel-session" title="離開本次闖關">✕</button>
        <div class="session-progress-bar" role="progressbar" aria-label="本次練習進度" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
          <div class="session-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        ${
          session.hearts !== null
            ? `
          <div class="session-hearts">
            ${'❤️'.repeat(session.hearts)}${'🖤'.repeat(Math.max(0, session.maxHearts - session.hearts))}
          </div>
        `
            : ''
        }
      </header>

      <div class="session-card">
        <p class="question-counter">第 ${current + 1} / ${total} 題${total > session.originalCount ? ` · 含 ${total - session.originalCount} 次錯題重練` : ''}</p>
        <div class="session-kind-pill ${isRemediating ? 'remediated' : ''}">
          <span>${isRemediating ? '🔄 再次挑戰：征服這道題！' : kindNames[item.kind] || '✨ 闖關題'}</span>
        </div>

        <h2 class="session-prompt">${esc(item.prompt || '')}</h2>

        ${
          item.audio
            ? `
          <div class="audio-action-row">
            <button class="audio-btn" data-say="${esc(item.audio)}">
              <span>🔊 聽印尼語發音</span>
            </button>
            <button class="slow-audio-btn" data-say-slow="${esc(item.audio)}" title="慢速 0.7x 清楚朗讀">
              <span>🐢 慢速</span>
            </button>
          </div>
        `
            : ''
        }

        ${
          item.hint
            ? `
          <button class="hint-toggle-btn" data-act="toggle-hint">
            <span>💡 ${ui.showHint ? '收合提點' : '查看解題提示'}</span>
          </button>
          ${ui.showHint ? `<div class="hint-box">💡 <strong>提示：</strong>${esc(item.hint)}</div>` : ''}
        `
            : ''
        }

        ${renderItemInput(item)}
      </div>

      ${renderFeedbackSheet()}
      ${ui.confirmExit ? `<div class="exit-backdrop"><section class="dashboard-card exit-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-title"><h3 id="exit-title">先休息一下嗎？</h3><p>留在練習可繼續答題；離開會結束本次練習，已答過的錯題會留在訂正本。</p><button class="action-btn check" data-act="keep-learning">繼續練習</button><button class="unit-guide-btn" data-act="confirm-exit">結束這次練習</button></section></div>` : ''}
    </div>
  `;
}

// Render dynamic question inputs
function renderItemInput(item) {
  // 1. Multiple Choice / Listening
  if (item.type === 'choice' || item.type === 'listen') {
    const options = item.options || [];
    return `
      <div class="choice-grid">
        ${options
          .map((opt, i) => {
            const isSelected = ui.selectedChoice === opt;
            const hotkey = i + 1;
            return `
            <button class="choice-btn ${isSelected ? 'selected' : ''}" data-choice="${esc(opt)}" aria-pressed="${isSelected}" ${ui.activeFeedback ? 'disabled' : ''}>
              <span>${esc(opt)}</span>
              <span class="choice-hotkey">${hotkey}</span>
            </button>
          `;
          })
          .join('')}
      </div>
    `;
  }

  // 2. Sentence Building (Word Bank)
  if (item.type === 'build') {
    const tokens = item.tokens || [];
    return `
      <div class="build-container">
        <div class="tray-box">
          ${ui.placedTokens
            .map(
              (tok, idx) => `
            <button class="word-tile tray-tile" data-tray-index="${idx}">
              ${esc(tok)}
            </button>
          `
            )
            .join('')}
        </div>
        <div class="word-bank-box">
          ${tokens
            .map((tok, idx) => {
              const placedCount = ui.placedTokens.filter(x => x === tok).length;
              const totalInTokens = tokens.slice(0, idx + 1).filter(x => x === tok).length;
              const isPlaced = placedCount >= totalInTokens;
              return `
              <button class="word-tile ${isPlaced ? 'placed' : ''}" data-token="${esc(tok)}">
                ${esc(tok)}
              </button>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  // 3. 4-Pairs Match
  if (item.type === 'match') {
    const pairs = item.pairs || [];
    // Flatten and shuffle left/right
    if (!item._flat) {
      const lefts = pairs.map(p => ({ text: p[0], side: 'left', match: p[1] }));
      const rights = pairs.map(p => ({ text: p[1], side: 'right', match: p[0] }));
      item._flat = [...lefts, ...rights].sort(() => Math.random() - 0.5);
    }
    return `
      <div class="match-grid">
        ${item._flat
          .map((card, idx) => {
            const isMatched = ui.matchedPairs.has(card.text);
            const isSelected = ui.matchSelected?.text === card.text;
            return `
            <button class="match-tile ${isMatched ? 'matched' : ''} ${isSelected ? 'selected' : ''}" 
                    data-match-idx="${idx}"
                    ${isMatched ? 'disabled' : ''}>
              ${esc(card.text)}
            </button>
          `;
          })
          .join('')}
      </div>
    `;
  }

  // 4. Text Input Cloze / Dictation
  if (item.type === 'input') {
    return `
      <div class="input-box-wrap">
        <input type="text" class="quest-input" id="quest-text-input" 
               placeholder="請輸入印尼文字詞..." 
               value="${esc(ui.inputVal)}" aria-label="印尼語答案" lang="id" ${ui.activeFeedback ? 'disabled' : ''} autocomplete="off" />
      </div>
    `;
  }

  return `<p>未知題型</p>`;
}

// Render Instant Bottom Feedback Sheet
function renderFeedbackSheet() {
  if (!ui.activeFeedback) {
    const canCheck = hasSelectedAnswer();
    return `
      <footer class="session-footer">
        <div class="session-footer-inner">
          <span class="keyboard-tip">選擇答案後檢查 · Enter 繼續</span><button class="action-btn check ${canCheck ? '' : 'disabled'}" data-act="submit-answer" ${canCheck ? '' : 'disabled'}>
            檢查答案
          </button>
        </div>
      </footer>
    `;
  }

  const fb = ui.activeFeedback;
  if (fb.correct) {
    return `
      <div class="feedback-sheet correct" role="status" aria-live="polite">
        <div class="feedback-content">
          <div class="feedback-info">
            <h3 class="feedback-title">🎉 ${fb.remediated ? '征服成功！' : '太棒了！Bagus sekali!'}</h3>
            <p class="feedback-text">${esc(answerText(fb.item))}</p>
            ${fb.item.why ? `<p style="font-size:13px;color:#15803d;margin-top:2px;">💡 ${esc(fb.item.why)}</p>` : ''}
          </div>
          <button class="action-btn continue" data-act="next-question">
            繼續前進 →
          </button>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="feedback-sheet wrong" role="status" aria-live="polite">
        <div class="feedback-content">
          <div class="feedback-info">
            <h3 class="feedback-title">❌ 正確答案是：</h3>
            <p class="feedback-text" style="font-weight:800;color:var(--red-d);">${esc(answerText(fb.item))}</p>
            <p style="font-size:13px;color:#991b1b;margin-top:4px;white-space:pre-line;">${esc(correctionTip(fb.item, getCurrentAnswerValue()))}</p>
          </div>
          <button class="action-btn continue wrong" data-act="next-question">
            我記住了，繼續 →
          </button>
        </div>
      </div>
    `;
  }
}

function hasSelectedAnswer() {
  const item = game.currentItem();
  if (!item) return false;
  if (item.type === 'choice' || item.type === 'listen') return !!ui.selectedChoice;
  if (item.type === 'build') return ui.placedTokens.length > 0;
  if (item.type === 'input') return (ui.inputVal || '').trim().length > 0;
  if (item.type === 'match') return ui.matchedPairs.size >= (item.pairs || []).length * 2;
  return true;
}

function getCurrentAnswerValue() {
  const item = game.currentItem();
  if (!item) return '';
  if (item.type === 'choice' || item.type === 'listen') return ui.selectedChoice;
  if (item.type === 'build') return ui.placedTokens.join(' ');
  if (item.type === 'input') return ui.inputVal.trim();
  if (item.type === 'match') return 'matched';
  return '';
}

// -------------------------------------------------------------
// Summary Screen (Celebration & Results)
// -------------------------------------------------------------
function renderSummary(res) {
  const colors = ['#2fb36b', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6', '#ef4444'];
  const confetti = Array.from({ length: 28 }, (_, i) => {
    const left = Math.round(Math.random() * 96) + '%';
    const delay = (Math.random() * 1.5).toFixed(2) + 's';
    const color = colors[i % colors.length];
    const size = Math.round(Math.random() * 6 + 8) + 'px';
    return `<div class="confetti-piece" style="left:${left};background:${color};width:${size};height:${size};animation-delay:${delay};"></div>`;
  }).join('');

  return `
    <div class="session-overlay">
      <div class="confetti-container">${confetti}</div>
      <div class="summary-container">
        <div class="celebration-icon">${res.failed ? '🌱' : '🏆'}</div>
        <h2 class="celebration-title">${res.failed ? '休息一下，再挑戰！' : '單元闖關完成！'}</h2>
        <p class="celebration-sub">${res.failed ? '愛心用完了，這次不計通關。到溫習頁訂正錯題後再來試試。' : 'Luar biasa! 每天一小步，印尼語大進步！'}</p>

        <div class="summary-stats-grid">
          <div class="summary-stat-box">
            <span class="summary-stat-val" style="color:var(--gold-d);">+${res.xpEarned}</span>
            <span class="summary-stat-label">獲得經驗值 (XP)</span>
          </div>
          <div class="summary-stat-box">
            <span class="summary-stat-val" style="color:var(--green);">${res.accuracy}%</span>
            <span class="summary-stat-label">首發答對率</span>
          </div>
          <div class="summary-stat-box">
            <span class="summary-stat-val" style="color:var(--orange);">🔥 ${res.streak}</span>
            <span class="summary-stat-label">連續學習天數</span>
          </div>
          <div class="summary-stat-box">
            <span class="summary-stat-val" style="color:var(--teal);">🔄 ${res.remediatedCount}</span>
            <span class="summary-stat-label">閉環攻克錯題</span>
          </div>
        </div>

        <button class="action-btn check" style="width:100%;" data-act="finish-summary">
          繼續學習之路 →
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Practice Tab
// -------------------------------------------------------------
function renderPractice() {
  const mistakeCount = game.state.mistakes.length;
  return `
    <div style="width:100%;max-width:680px;padding:20px 0;">
      <h2 style="font-size:26px;font-weight:900;margin-bottom:8px;">🎯 溫習與錯題強化</h2>
      <p style="color:var(--ink-secondary);margin-bottom:24px;">答對後安排於 1、3、7、14、30 天後複習；答錯會重新安排，慢慢把記憶練穩。</p>
      <section class="dashboard-card due-review"><div><h3>🗓️ 到期複習</h3><p>${game.dueItems().length ? `今天有 ${game.dueItems().length} 題等你回想。` : '目前沒有到期題目，先闖關學點新內容吧！'}</p></div><button class="action-btn check" data-act="practice-due" ${game.dueItems().length ? '' : 'disabled'}>開始複習</button></section>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="padding:24px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);box-shadow:0 4px 0 var(--line-d);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:18px;font-weight:800;color:var(--ink);">📖 錯題訂正本</h3>
            <p style="font-size:14px;color:var(--ink-secondary);margin-top:4px;">
              ${mistakeCount > 0 ? `目前累積有 <strong>${mistakeCount}</strong> 道待加強題目。` : '目前沒有待訂正題目，可以繼續闖關或做閃電複習。'}
            </p>
          </div>
          <button class="action-btn check" data-act="practice-mistakes" ${mistakeCount === 0 ? 'disabled' : ''}>
            立即訂正
          </button>
        </div>

        <div style="padding:24px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);box-shadow:0 4px 0 var(--line-d);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <h3 style="font-size:18px;font-weight:800;color:var(--ink);">⚡ 閃電複習 (8題)</h3>
            <p style="font-size:14px;color:var(--ink-secondary);margin-top:4px;">
              隨機抽取已學過字詞與聽力題型，維持最佳語感。
            </p>
          </div>
          <button class="action-btn check" data-act="practice-random">
            開始速刷
          </button>
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Stories Tab
// -------------------------------------------------------------
function renderStories() {
  const stories = course.index.stories || [];
  return `
    <div style="width:100%;max-width:680px;padding:20px 0;">
      <h2 style="font-size:26px;font-weight:900;margin-bottom:8px;">💬 實境生活對話故事</h2>
      <p style="color:var(--ink-secondary);margin-bottom:24px;">沉浸在印尼年輕人與街頭的真實日常對話中，邊聽邊闖關。</p>

      <div style="display:flex;flex-direction:column;gap:16px;">
        ${stories
          .map(st => {
            const isDone = !!game.state.stories[st.id];
            return `
            <div style="padding:20px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);box-shadow:0 4px 0 var(--line-d);display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:16px;">
                <span style="font-size:36px;">${st.icon}</span>
                <div>
                  <h3 style="font-size:17px;font-weight:800;color:var(--ink);">${esc(st.title)}</h3>
                  <span style="font-size:12px;font-weight:700;color:var(--green);">${esc(st.level)} · 沉浸互動</span>
                </div>
              </div>
              <button class="action-btn check" data-story="${st.id}">
                ${isDone ? '重溫故事' : '開始故事 →'}
              </button>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Library Tab
// -------------------------------------------------------------
function renderLibrary() {
  return `
    <div style="width:100%;max-width:680px;padding:20px 0;">
      <h2 style="font-size:26px;font-weight:900;margin-bottom:8px;">📖 課綱語法與詞彙速查庫</h2>
      <p style="color:var(--ink-secondary);margin-bottom:24px;">隨身攜帶的印尼語核心句型與構詞積木備忘錄。</p>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <details style="padding:16px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);" open>
          <summary style="font-weight:800;font-size:16px;cursor:pointer;">🧱 核心否定法則：tidak vs bukan</summary>
          <div style="margin-top:12px;font-size:14px;line-height:1.6;color:var(--ink-secondary);">
            <p><strong>1. Bukan (不是)：</strong>只能否定「名詞」與「人身身分」。例：<em>Dia bukan dokter. (他不是醫生)</em></p>
            <p><strong>2. Tidak (不)：</strong>否定「動詞」與「形容詞」。例：<em>Saya tidak mau makan pedas. (我不想吃辣)</em></p>
          </div>
        </details>

        <details style="padding:16px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);">
          <summary style="font-weight:800;font-size:16px;cursor:pointer;">🌊 核心及物前綴：meN- 六大鼻音同化</summary>
          <div style="margin-top:12px;font-size:14px;line-height:1.6;color:var(--ink-secondary);">
            <p>遇到 <strong>K, T, S, P</strong> 首字母時，字首脫落同化：</p>
            <ul style="margin-left:20px;margin-top:6px;">
              <li><strong>T</strong> -> men- (tulis -> menulis)</li>
              <li><strong>K</strong> -> meng- (kirim -> mengirim)</li>
              <li><strong>S</strong> -> meny- (sapu -> menyapu)</li>
              <li><strong>P</strong> -> mem- (pakai -> memakai)</li>
            </ul>
          </div>
        </details>

        <details style="padding:16px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);">
          <summary style="font-weight:800;font-size:16px;cursor:pointer;">🔥 雅加達流行口語助詞 (Gaul)</summary>
          <div style="margin-top:12px;font-size:14px;line-height:1.6;color:var(--ink-secondary);">
            <p><strong>dong：</strong>親切請求或「理所當然」 (Bisa dong!)</p>
            <p><strong>sih：</strong>探問或微抱怨 (Kamu kenapa sih?)</p>
            <p><strong>kok：</strong>驚訝的反問 (Kok kamu belum sampai?)</p>
            <p><strong>mager：</strong>懶得動 (malas gerak)</p>
            <p><strong>gpp：</strong>沒關係 (gak apa-apa)</p>
          </div>
        </details>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Profile Tab
// -------------------------------------------------------------
function renderProfile() {
  const st = game.state;
  return `
    <div style="width:100%;max-width:680px;padding:20px 0;">
      <h2 style="font-size:26px;font-weight:900;margin-bottom:8px;">👤 個人檔案與徽章</h2>
      <p style="color:var(--ink-secondary);margin-bottom:24px;">檢視你的印尼語闖關戰績與道具商店。</p>

      <!-- Shop -->
      <div style="padding:20px;border-radius:var(--radius);background:var(--card);border:2px solid var(--line);box-shadow:0 4px 0 var(--line-d);margin-bottom:24px;">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">🏪 寶石商店</h3>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line);">
          <div>
            <div style="font-weight:700;">❄️ 連勝凍結卡 (Streak Freeze)</div>
            <div style="font-size:13px;color:var(--muted);">錯過打卡時自動保全連勝，最多儲存 2 張。（目前持有：${st.freezes} 張）</div>
          </div>
          <button class="action-btn check ${st.gems >= 80 && st.freezes < 2 ? '' : 'disabled'}" data-act="buy-freeze">
            80 💎 兌換
          </button>
        </div>
      </div>

      <!-- Badges -->
      <h3 style="font-size:18px;font-weight:800;margin-bottom:12px;">🏆 成就勳章</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${BADGES.map(b => {
          const unlocked = !!st.achievements[b.id];
          return `
            <div style="padding:16px;border-radius:var(--radius-sm);background:var(--card);border:2px solid ${unlocked ? 'var(--gold)' : 'var(--line)'};opacity:${unlocked ? '1' : '0.45'};">
              <div style="font-size:32px;margin-bottom:6px;">${b.icon}</div>
              <div style="font-weight:800;font-size:15px;color:var(--ink);">${esc(b.title)}</div>
              <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">${esc(b.desc)}</div>
              ${unlocked ? '<div style="font-size:11px;font-weight:800;color:var(--gold-d);margin-top:6px;">✓ 已解鎖</div>' : '<div style="font-size:11px;color:var(--muted);margin-top:6px;">尚未達成</div>'}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Guide Modal
// -------------------------------------------------------------
function renderGuideModal() {
  if (!ui.activeGuide) return '';
  const g = ui.activeGuide;
  return `
    <div class="session-overlay" style="background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:20px;">
      <div role="dialog" aria-modal="true" aria-label="單元學習手冊" style="background:var(--card);width:100%;max-width:540px;max-height:85dvh;overflow:auto;border-radius:var(--radius);padding:24px;border:2px solid var(--line);box-shadow:0 8px 30px rgba(0,0,0,0.2);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <h3 style="font-size:20px;font-weight:800;">📘 ${esc(g.title)}</h3>
          <button style="background:none;border:none;font-size:20px;cursor:pointer;" data-act="close-guide">✕</button>
        </div>
        <p style="font-size:15px;line-height:1.6;color:var(--ink-secondary);">${esc(g.content)}</p>
        <button class="action-btn check" style="width:100%;margin-top:24px;" data-act="close-guide">我知道了</button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Event Handling
// -------------------------------------------------------------
function bindEvents() {
  root.addEventListener('click', e => {
    // Nav tabs
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      ui.tab = navBtn.dataset.nav;
      history.replaceState(null, '', `#${ui.tab}`);
      sound.sfx('tap');
      render();
      return;
    }

    // Section switcher
    const secBtn = e.target.closest('[data-select-section]');
    if (secBtn) {
      ui.sectionId = secBtn.dataset.selectSection;
      sound.sfx('tap');
      render();
      return;
    }

    // Unit Guide
    const guideBtn = e.target.closest('[data-guide]');
    if (guideBtn) {
      const uid = guideBtn.dataset.guide;
      ui.activeGuide = course.guides.get(uid) || { title: '學習指引', content: '跟著闖關節點一步步掌握印尼文！' };
      sound.sfx('tap');
      render();
      return;
    }
    if (e.target.closest('[data-act="close-guide"]')) {
      ui.activeGuide = null;
      render();
      return;
    }

    // Start Lesson Node
    const nodeBtn = e.target.closest('[data-node]');
    if (nodeBtn && !nodeBtn.disabled) {
      const nodeId = nodeBtn.dataset.node;
      sound.sfx('tap');
      startLesson(nodeId);
      return;
    }

    // Audio Play
    const sayBtn = e.target.closest('[data-say]');
    if (sayBtn) {
      sound.play({ text: sayBtn.dataset.say });
      return;
    }
    const saySlowBtn = e.target.closest('[data-say-slow]');
    if (saySlowBtn) {
      sound.play({ text: saySlowBtn.dataset.saySlow, slow: true });
      return;
    }

    // Toggle Hint
    if (e.target.closest('[data-act="toggle-hint"]')) {
      ui.showHint = !ui.showHint;
      sound.sfx('tap');
      render();
      return;
    }

    // Choice Selection
    const choiceBtn = e.target.closest('[data-choice]');
    if (choiceBtn && !ui.activeFeedback) {
      ui.selectedChoice = choiceBtn.dataset.choice;
      sound.sfx('tap');
      render();
      return;
    }

    // Word Bank Tokens (Sentence Building)
    const tokenBtn = e.target.closest('[data-token]');
    if (tokenBtn && !ui.activeFeedback && !tokenBtn.classList.contains('placed')) {
      ui.placedTokens.push(tokenBtn.dataset.token);
      sound.sfx('tap');
      render();
      return;
    }
    const trayBtn = e.target.closest('[data-tray-index]');
    if (trayBtn && !ui.activeFeedback) {
      const idx = Number(trayBtn.dataset.trayIndex);
      ui.placedTokens.splice(idx, 1);
      sound.sfx('tap');
      render();
      return;
    }

    // Match Pairs
    const matchTile = e.target.closest('[data-match-idx]');
    if (matchTile && !ui.activeFeedback && !matchTile.classList.contains('matched')) {
      handleMatchClick(Number(matchTile.dataset.matchIdx), matchTile);
      return;
    }

    // Submit Answer
    if (e.target.closest('[data-act="submit-answer"]') && !ui.activeFeedback) {
      handleSubmitAnswer();
      return;
    }

    // Next Question
    if (e.target.closest('[data-act="next-question"]')) {
      handleNextQuestion();
      return;
    }

    // Cancel Session
    if (e.target.closest('[data-act="cancel-session"]')) {
      ui.confirmExit = true;
      render();
      root.querySelector('[data-act="keep-learning"]')?.focus();
      return;
    }
    if (e.target.closest('[data-act="keep-learning"]')) {
      ui.confirmExit = false; render(); return;
    }
    if (e.target.closest('[data-act="confirm-exit"]')) {
      ui.confirmExit = false; game.cancelSession(); sound.stop(); resetSessionUI(); render();
      return;
    }

    // Finish Summary
    if (e.target.closest('[data-act="finish-summary"]')) {
      if (ui.sessionResult?.failed) ui.tab = 'practice';
      ui.sessionResult = null;
      render();
      return;
    }

    // Practice buttons
    if (e.target.closest('[data-act="practice-due"]')) {
      if (!game.startPractice('due')) return;
      resetSessionUI(); render(); return;
    }
    if (e.target.closest('[data-act="practice-mistakes"]')) {
      sound.sfx('tap');
      game.startPractice('mistakes');
      resetSessionUI();
      render();
      return;
    }
    if (e.target.closest('[data-act="practice-random"]')) {
      sound.sfx('tap');
      game.startPractice('random');
      resetSessionUI();
      render();
      return;
    }

    // Story buttons
    const storyBtn = e.target.closest('[data-story]');
    if (storyBtn) {
      const sid = storyBtn.dataset.story;
      sound.sfx('tap');
      game.startStory(sid);
      resetSessionUI();
      render();
      return;
    }

    // Shop Buy Freeze
    if (e.target.closest('[data-act="buy-freeze"]')) {
      if (game.buy('freeze')) {
        sound.sfx('combo');
        ui.notice = '🎉 成功購買連勝凍結卡！';
        render();
      }
      return;
    }
  });

  // Text input listener
  root.addEventListener('change', e => {
    if (e.target.id === 'daily-goal') { game.setGoal(e.target.value); render(); }
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'quest-text-input') {
      ui.inputVal = e.target.value;
      const checkBtn = root.querySelector('[data-act="submit-answer"]');
      if (checkBtn) {
        checkBtn.disabled = !ui.inputVal.trim();
        if (ui.inputVal.trim().length > 0) {
          checkBtn.classList.remove('disabled');
        } else {
          checkBtn.classList.add('disabled');
        }
      }
    }
  });
}

function handleMatchClick(idx, tileEl) {
  const item = game.currentItem();
  if (!item || !item._flat) return;
  const card = item._flat[idx];

  // If Indonesian card is clicked, pronounce it immediately to aid auditory learning
  if (card.side === 'left' || !/[\u4e00-\u9fa5]/.test(card.text)) {
    sound.play({ text: card.text });
  }

  if (!ui.matchSelected) {
    ui.matchSelected = card;
    sound.sfx('tap');
    render();
  } else {
    // Second click
    if (ui.matchSelected.text === card.text) {
      // Clicked same tile to deselect
      ui.matchSelected = null;
      render();
      return;
    }

    const first = ui.matchSelected;
    const isPair = first.match === card.text;

    if (isPair) {
      sound.sfx('combo');
      ui.matchedPairs.add(first.text);
      ui.matchedPairs.add(card.text);
      ui.matchSelected = null;
      render();

      // Check if all pairs are matched
      if (ui.matchedPairs.size >= item.pairs.length * 2) {
        handleSubmitAnswer();
      }
    } else {
      sound.sfx('wrong');
      tileEl.classList.add('shake');
      setTimeout(() => {
        ui.matchSelected = null;
        render();
      }, 400);
    }
  }
}

function startLesson(nodeId) {
  game.startLesson(nodeId);
  resetSessionUI();
  render();

  // Auto-speak audio for initial item
  const item = game.currentItem();
  if (item?.audio) {
    sound.play({ text: item.audio });
  }
}

function resetSessionUI() {
  ui.activeFeedback = null;
  ui.selectedChoice = null;
  ui.placedTokens = [];
  ui.inputVal = '';
  ui.matchSelected = null;
  ui.matchedPairs = new Set();
  ui.showHint = false;
}

function handleSubmitAnswer() {
  if (ui.activeFeedback || ui.confirmExit || !hasSelectedAnswer()) return;
  const val = getCurrentAnswerValue();
  const res = game.submit(val);
  if (!res) return;

  ui.activeFeedback = res;
  if (res.correct) {
    sound.sfx(res.remediated ? 'combo' : 'correct');
    try { navigator.vibrate?.(25); } catch {}
  } else {
    sound.sfx('wrong');
    try { navigator.vibrate?.([40, 60, 40]); } catch {}
  }
  render();
}

function handleNextQuestion() {
  if (ui.confirmExit) return;
  ui.activeFeedback = null;
  ui.selectedChoice = null;
  ui.placedTokens = [];
  ui.inputVal = '';
  ui.matchSelected = null;
  ui.matchedPairs = new Set();
  ui.showHint = false;

  const nextState = game.next();
  if (nextState?.done) {
    ui.sessionResult = nextState;
    sound.sfx('done');
    render();
  } else {
    render();
    const item = game.currentItem();
    if (item?.audio) {
      sound.play({ text: item.audio });
    }
  }
}

// -------------------------------------------------------------
// Keyboard Hotkeys
// -------------------------------------------------------------
function bindKeyboard() {
  window.addEventListener('keydown', e => {
    if (ui.activeGuide || ui.confirmExit) {
      if (e.key === 'Escape') { ui.activeGuide = null; ui.confirmExit = false; render(); }
      if (e.key === 'Tab') {
        const buttons = [...root.querySelectorAll('[role="dialog"] button')];
        if (!buttons.includes(document.activeElement) || (!e.shiftKey && document.activeElement === buttons.at(-1))) { e.preventDefault(); buttons[0]?.focus(); }
        else if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
      }
      return;
    }
    if (e.isComposing || e.repeat) return;
    if (e.target.closest('button, select, a') && e.key === 'Enter') return;
    const session = game.currentSession();
    if (!session) return;

    // Next question on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      if (ui.activeFeedback) {
        handleNextQuestion();
      } else if (hasSelectedAnswer()) {
        handleSubmitAnswer();
      }
      return;
    }

    // Number keys for multiple choice (1, 2, 3, 4)
    if (!ui.activeFeedback && (e.key >= '1' && e.key <= '4')) {
      const item = game.currentItem();
      if (item?.type === 'choice' || item?.type === 'listen') {
        const idx = Number(e.key) - 1;
        if (item.options && item.options[idx]) {
          ui.selectedChoice = item.options[idx];
          sound.sfx('tap');
          render();
        }
      }
    }
  });
}

// Run boot on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
