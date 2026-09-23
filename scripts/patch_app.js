const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

// 1. Add initialization calls around line 290
const oldInitTarget = `        initSentencePuzzleModule(curriculumData.sentence_puzzles);
        initDictionaryModal(curriculumData);`;

const newInitReplacement = `        initSentencePuzzleModule(curriculumData.sentence_puzzles);
        initVocab10kEngine();
        initPeribahasaModule(curriculumData.peribahasa_list);
        initEverydaySentencesModule(curriculumData.everyday_sentences);
        initDictionaryModal(curriculumData);`;

if (!appJs.includes(oldInitTarget)) {
    console.error('Target for init injection not found!');
    process.exit(1);
}
appJs = appJs.replace(oldInitTarget, newInitReplacement);

// 2. Enhance initDictionaryModal to also search window.allVocab10k
const oldDictSearchTarget = `            const matches = searchIndex.filter(item => 
                item.id_text.toLowerCase().includes(query) || 
                item.zh_text.toLowerCase().includes(query)
            ).slice(0, 15);`;

const newDictSearchReplacement = `            let matches = searchIndex.filter(item => 
                item.id_text.toLowerCase().includes(query) || 
                item.zh_text.toLowerCase().includes(query)
            );

            // Also search 10k Vocab dataset if loaded
            if (window.allVocab10k && window.allVocab10k.length) {
                const vocab10kMatches = [];
                for (const w of window.allVocab10k) {
                    if (w.id_word.toLowerCase().includes(query) || w.zh_word.toLowerCase().includes(query)) {
                        vocab10kMatches.push({
                            id_text: w.id_word,
                            zh_text: \`\${w.zh_word} [\${w.pos}, \${w.level}]\`,
                            type: \`10K 詞庫 (Tier \${w.tier})\`
                        });
                        if (vocab10kMatches.length >= 15) break;
                    }
                }
                matches = matches.concat(vocab10kMatches);
            }

            matches = matches.slice(0, 25);`;

if (!appJs.includes(oldDictSearchTarget)) {
    console.error('Target for dict search injection not found!');
    process.exit(1);
}
appJs = appJs.replace(oldDictSearchTarget, newDictSearchReplacement);

// 3. New modules code to insert before Universal Click-to-Speak Delegation
const modulesCode = `
    // ==========================================================================
    // 19. 萬字高頻核心字庫引擎 (10,000 Graded Vocab Engine)
    // ==========================================================================
    async function initVocab10kEngine() {
        const displayContainer = document.getElementById('vocab-items-display-container');
        const countEl = document.getElementById('vocab-filtered-count');
        const pageInfoEl = document.getElementById('vocab-page-info');
        const topPaginationEl = document.getElementById('vocab-top-pagination');
        const bottomPaginationEl = document.getElementById('vocab-bottom-pagination');
        const searchInput = document.getElementById('vocab-10k-search-input');
        const clearSearchBtn = document.getElementById('vocab-10k-clear-search-btn');
        const cardModeBtn = document.getElementById('btn-vocab-card-mode');
        const tableModeBtn = document.getElementById('btn-vocab-table-mode');
        const tierCards = document.querySelectorAll('#vocab-10k-view .tier-card');
        const posChips = document.querySelectorAll('#vocab-pos-chips .pos-chip');
        const openFcBtn = document.getElementById('open-10k-flashcard-mode-btn');

        if (!displayContainer) return;

        let vocab10kList = [];
        let currentTier = '1000'; // '1000' | '3000' | '5000' | '10000'
        let currentPos = 'all';
        let searchQuery = '';
        let currentPage = 1;
        const pageSize = 50;
        let viewMode = 'card'; // 'card' | 'table'

        // Show loading state
        displayContainer.innerHTML = \`
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p>正在載入 10,000 詞權威分級字庫數據，請稍候...</p>
            </div>
        \`;

        try {
            const res = await fetch('data_vocab_10k.json');
            vocab10kList = await res.json();
            window.allVocab10k = vocab10kList;
        } catch (e) {
            console.error('Failed to load data_vocab_10k.json:', e);
            displayContainer.innerHTML = \`
                <div style="text-align: center; padding: 3rem 1rem; color: var(--primary); grid-column: 1 / -1;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>無法讀取 10,000 詞庫數據，請重新整理頁面。</p>
                </div>
            \`;
            return;
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function getFilteredWords() {
            return vocab10kList.filter(item => {
                // Tier filter
                if (currentTier === '1000' && item.tier > 1) return false;
                if (currentTier === '3000' && item.tier > 2) return false;
                if (currentTier === '5000' && item.tier > 3) return false;
                // tier '10000' includes all 10,000 words

                // POS filter
                if (currentPos !== 'all' && (!item.pos || !item.pos.includes(currentPos))) {
                    return false;
                }

                // Search query filter
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchWord = item.id_word && item.id_word.toLowerCase().includes(q);
                    const matchZh = item.zh_word && item.zh_word.toLowerCase().includes(q);
                    const matchEx = item.example && item.example.toLowerCase().includes(q);
                    const matchExZh = item.example_zh && item.example_zh.toLowerCase().includes(q);
                    if (!matchWord && !matchZh && !matchEx && !matchExZh) return false;
                }

                return true;
            });
        }

        function renderVocabView() {
            const filtered = getFilteredWords();
            const totalCount = filtered.length;
            const totalPages = Math.ceil(totalCount / pageSize) || 1;

            if (currentPage > totalPages) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;

            if (countEl) countEl.textContent = totalCount.toLocaleString();

            const startIdx = (currentPage - 1) * pageSize;
            const endIdx = Math.min(startIdx + pageSize, totalCount);
            const pageItems = filtered.slice(startIdx, endIdx);

            if (pageInfoEl) {
                pageInfoEl.textContent = totalCount > 0 
                    ? \`(第 \${currentPage} / \${totalPages} 頁 · 顯示 \${startIdx + 1}-\${endIdx} 詞)\`
                    : \`(無匹配詞彙)\`;
            }

            // Render items
            if (pageItems.length === 0) {
                displayContainer.className = 'vocab-cards-grid';
                displayContainer.innerHTML = \`
                    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); grid-column: 1 / -1; background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 0.8rem;"></i>
                        <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">未找到符合篩選條件的單字</h4>
                        <p style="font-size: 0.9rem;">請嘗試調整詞性篩選、更換分級階梯或清除關鍵字搜尋。</p>
                    </div>
                \`;
            } else if (viewMode === 'card') {
                displayContainer.className = 'vocab-cards-grid';
                displayContainer.innerHTML = pageItems.map(item => {
                    const isMastered = userStats.masteredWords.includes(item.id_word);
                    return \`
                        <div class="vocab-card" data-id="\${item.id}" data-word="\${escapeHtml(item.id_word)}">
                            <div class="vocab-card-top">
                                <div>
                                    <div class="vocab-card-word">\${escapeHtml(item.id_word)}</div>
                                    <div class="vocab-card-syllables">\${escapeHtml(item.syllables || '')}</div>
                                </div>
                                <div class="vocab-card-actions">
                                    <button class="vocab-audio-btn play-id-btn" title="朗讀印尼語"><i class="fa-solid fa-volume-high"></i></button>
                                    <button class="vocab-audio-btn play-bi-btn" title="中印雙語朗讀"><i class="fa-solid fa-language"></i></button>
                                </div>
                            </div>
                            <div class="vocab-card-badges">
                                <span class="tag-pos">\${escapeHtml(item.pos)}</span>
                                <span class="tag-tier">Tier \${item.tier}</span>
                                <span class="tag-level">\${escapeHtml(item.level)}</span>
                            </div>
                            <div class="vocab-card-zh">\${escapeHtml(item.zh_word)}</div>
                            \${item.example ? \`
                            <div class="vocab-card-example">
                                <div class="ex-id-text">
                                    <span>\${escapeHtml(item.example)}</span>
                                    <button class="vocab-audio-btn play-ex-btn" style="width: 24px; height: 24px; font-size: 0.65rem;" title="朗讀例句"><i class="fa-solid fa-volume-high"></i></button>
                                </div>
                                <div class="ex-zh-text">\${escapeHtml(item.example_zh || '')}</div>
                            </div>\` : ''}
                            <div class="vocab-card-footer">
                                <button class="master-toggle-btn \${isMastered ? 'mastered' : ''}" data-word="\${escapeHtml(item.id_word)}">
                                    <i class="fa-\${isMastered ? 'solid' : 'regular'} fa-circle-check"></i> \${isMastered ? '已掌握' : '標記掌握 (+5 XP)'}
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            } else {
                // Table mode
                displayContainer.className = 'vocab-table-container';
                displayContainer.innerHTML = \`
                    <div class="vocab-table-wrap">
                        <table class="vocab-data-table">
                            <thead>
                                <tr>
                                    <th style="width: 50px;">#</th>
                                    <th>印尼語單字</th>
                                    <th>音節切分</th>
                                    <th>詞性</th>
                                    <th>中文釋義</th>
                                    <th>分級</th>
                                    <th>精選例句</th>
                                    <th style="text-align: center;">發音</th>
                                    <th style="text-align: center;">掌握</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${pageItems.map(item => {
                                    const isMastered = userStats.masteredWords.includes(item.id_word);
                                    return \`
                                        <tr data-word="\${escapeHtml(item.id_word)}">
                                            <td style="color: var(--text-muted); font-size: 0.8rem;">\${item.id}</td>
                                            <td><strong style="color: var(--text-main); font-size: 1.05rem;">\${escapeHtml(item.id_word)}</strong></td>
                                            <td style="color: var(--text-muted); font-size: 0.85rem;">\${escapeHtml(item.syllables || '')}</td>
                                            <td><span class="tag-pos">\${escapeHtml(item.pos)}</span></td>
                                            <td><strong style="color: var(--text-main);">\${escapeHtml(item.zh_word)}</strong></td>
                                            <td><span class="tag-tier" style="margin-right: 0.2rem;">T\${item.tier}</span><span class="tag-level">\${escapeHtml(item.level)}</span></td>
                                            <td style="font-size: 0.82rem; max-width: 280px;">
                                                \${item.example ? \`<div>\${escapeHtml(item.example)}</div><div style="color: var(--text-muted);">\${escapeHtml(item.example_zh || '')}</div>\` : '-'}
                                            </td>
                                            <td style="text-align: center; white-space: nowrap;">
                                                <button class="vocab-audio-btn play-id-btn" style="display: inline-flex;" title="朗讀印尼語"><i class="fa-solid fa-volume-high"></i></button>
                                                <button class="vocab-audio-btn play-bi-btn" style="display: inline-flex; margin-left: 0.25rem;" title="中印雙語"><i class="fa-solid fa-language"></i></button>
                                            </td>
                                            <td style="text-align: center;">
                                                <button class="master-toggle-btn \${isMastered ? 'mastered' : ''}" style="padding: 0.25rem 0.5rem;" data-word="\${escapeHtml(item.id_word)}">
                                                    <i class="fa-\${isMastered ? 'solid' : 'regular'} fa-circle-check"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    \`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                \`;
            }

            // Bind item click & action events
            attachItemActionEvents(pageItems);

            // Render pagination controls
            renderPagination(totalPages);
        }

        function attachItemActionEvents(pageItems) {
            const itemMap = new Map();
            pageItems.forEach(it => itemMap.set(it.id_word, it));

            displayContainer.querySelectorAll('.play-id-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('[data-word]');
                    const wordKey = card?.getAttribute('data-word');
                    const it = itemMap.get(wordKey);
                    if (it) audioEngine.speak(it.id_word, { lang: 'id' });
                });
            });

            displayContainer.querySelectorAll('.play-bi-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('[data-word]');
                    const wordKey = card?.getAttribute('data-word');
                    const it = itemMap.get(wordKey);
                    if (it) audioEngine.speakBilingual(it.id_word, it.zh_word);
                });
            });

            displayContainer.querySelectorAll('.play-ex-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const card = btn.closest('[data-word]');
                    const wordKey = card?.getAttribute('data-word');
                    const it = itemMap.get(wordKey);
                    if (it && it.example) audioEngine.speak(it.example, { lang: 'id' });
                });
            });

            displayContainer.querySelectorAll('.master-toggle-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const wordKey = btn.getAttribute('data-word');
                    if (!wordKey) return;

                    const idx = userStats.masteredWords.indexOf(wordKey);
                    if (idx > -1) {
                        userStats.masteredWords.splice(idx, 1);
                        btn.classList.remove('mastered');
                        btn.innerHTML = '<i class="fa-regular fa-circle-check"></i> 標記掌握 (+5 XP)';
                    } else {
                        userStats.masteredWords.push(wordKey);
                        btn.classList.add('mastered');
                        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> 已掌握';
                        addPoints(5);
                    }
                    saveStats();
                    updateStatsUI();
                });
            });
        }

        function renderPagination(totalPages) {
            // 1. Top Quick Pagination
            if (topPaginationEl) {
                topPaginationEl.innerHTML = \`
                    <button class="page-btn quick-prev" \${currentPage <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin: 0 0.5rem;">\${currentPage} / \${totalPages}</span>
                    <button class="page-btn quick-next" \${currentPage >= totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                \`;

                topPaginationEl.querySelector('.quick-prev')?.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderVocabView();
                        window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                    }
                });

                topPaginationEl.querySelector('.quick-next')?.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderVocabView();
                        window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                    }
                });
            }

            // 2. Bottom Full Pagination
            if (bottomPaginationEl) {
                if (totalPages <= 1) {
                    bottomPaginationEl.innerHTML = '';
                    return;
                }

                let pageBtnsHtml = '';
                // First & Prev
                pageBtnsHtml += \`<button class="page-btn nav-first" \${currentPage <= 1 ? 'disabled' : ''} title="第一頁"><i class="fa-solid fa-angles-left"></i></button>\`;
                pageBtnsHtml += \`<button class="page-btn nav-prev" \${currentPage <= 1 ? 'disabled' : ''} title="上一頁"><i class="fa-solid fa-chevron-left"></i> 上一頁</button>\`;

                // Page numbers window (show 5 nearby pages)
                const startP = Math.max(1, currentPage - 2);
                const endP = Math.min(totalPages, currentPage + 2);

                if (startP > 1) {
                    pageBtnsHtml += \`<button class="page-btn num-btn" data-page="1">1</button>\`;
                    if (startP > 2) pageBtnsHtml += \`<span style="color: var(--text-muted); padding: 0 0.2rem;">...</span>\`;
                }

                for (let p = startP; p <= endP; p++) {
                    pageBtnsHtml += \`<button class="page-btn num-btn \${p === currentPage ? 'active' : ''}" data-page="\${p}">\${p}</button>\`;
                }

                if (endP < totalPages) {
                    if (endP < totalPages - 1) pageBtnsHtml += \`<span style="color: var(--text-muted); padding: 0 0.2rem;">...</span>\`;
                    pageBtnsHtml += \`<button class="page-btn num-btn" data-page="\${totalPages}">\${totalPages}</button>\`;
                }

                // Next & Last
                pageBtnsHtml += \`<button class="page-btn nav-next" \${currentPage >= totalPages ? 'disabled' : ''} title="下一頁">下一頁 <i class="fa-solid fa-chevron-right"></i></button>\`;
                pageBtnsHtml += \`<button class="page-btn nav-last" \${currentPage >= totalPages ? 'disabled' : ''} title="最末頁"><i class="fa-solid fa-angles-right"></i></button>\`;

                // Quick page jump selector
                pageBtnsHtml += \`
                    <div style="display: flex; align-items: center; gap: 0.35rem; margin-left: 0.8rem;">
                        <span style="font-size: 0.82rem; color: var(--text-muted);">跳轉:</span>
                        <select class="page-jump-select" style="padding: 0.35rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--surface); color: var(--text-main); font-size: 0.82rem; font-weight: 700;">
                            \${Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || p % 5 === 0 || Math.abs(p - currentPage) <= 2).map(p => \`
                                <option value="\${p}" \${p === currentPage ? 'selected' : ''}>第 \${p} 頁</option>
                            \`).join('')}
                        </select>
                    </div>
                \`;

                bottomPaginationEl.innerHTML = pageBtnsHtml;

                // Bind pagination buttons
                bottomPaginationEl.querySelector('.nav-first')?.addEventListener('click', () => {
                    currentPage = 1;
                    renderVocabView();
                    window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                });

                bottomPaginationEl.querySelector('.nav-prev')?.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderVocabView();
                        window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                    }
                });

                bottomPaginationEl.querySelector('.nav-next')?.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderVocabView();
                        window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                    }
                });

                bottomPaginationEl.querySelector('.nav-last')?.addEventListener('click', () => {
                    currentPage = totalPages;
                    renderVocabView();
                    window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                });

                bottomPaginationEl.querySelectorAll('.num-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        currentPage = parseInt(btn.getAttribute('data-page'), 10);
                        renderVocabView();
                        window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                    });
                });

                bottomPaginationEl.querySelector('.page-jump-select')?.addEventListener('change', (e) => {
                    currentPage = parseInt(e.target.value, 10);
                    renderVocabView();
                    window.scrollTo({ top: displayContainer.offsetTop - 120, behavior: 'smooth' });
                });
            }
        }

        // Tier cards click handler
        tierCards.forEach(card => {
            card.addEventListener('click', () => {
                tierCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                currentTier = card.getAttribute('data-tier') || '1000';
                currentPage = 1;
                renderVocabView();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });

        // POS chips click handler
        posChips.forEach(chip => {
            chip.addEventListener('click', () => {
                posChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentPos = chip.getAttribute('data-pos') || 'all';
                currentPage = 1;
                renderVocabView();
                if (navigator.vibrate) navigator.vibrate(8);
            });
        });

        // Search input debounce handler
        let searchTimer = null;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchQuery = e.target.value.trim();
                currentPage = 1;
                renderVocabView();
            }, 180);
        });

        clearSearchBtn?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            currentPage = 1;
            renderVocabView();
        });

        // View mode toggle
        cardModeBtn?.addEventListener('click', () => {
            cardModeBtn.classList.add('active');
            tableModeBtn.classList.remove('active');
            viewMode = 'card';
            renderVocabView();
        });

        tableModeBtn?.addEventListener('click', () => {
            tableModeBtn.classList.add('active');
            cardModeBtn.classList.remove('active');
            viewMode = 'table';
            renderVocabView();
        });

        // Flashcard Modal Logic
        const fcModal = document.getElementById('flashcard-10k-modal');
        const closeFcBtn = document.getElementById('close-10k-flashcard-btn');
        const fcCard = document.getElementById('fc10k-card');
        const fcTierTag = document.getElementById('fc10k-tier-tag');
        const fcWordId = document.getElementById('fc10k-word-id');
        const fcSyllable = document.getElementById('fc10k-syllable');
        const fcPos = document.getElementById('fc10k-pos');
        const fcWordZh = document.getElementById('fc10k-word-zh');
        const fcExId = document.getElementById('fc10k-ex-id');
        const fcExZh = document.getElementById('fc10k-ex-zh');
        const fcPlayAudioBtn = document.getElementById('fc10k-play-audio-btn');
        const fcPlayBiBtn = document.getElementById('fc10k-play-bi-btn');
        const fcPlayExBtn = document.getElementById('fc10k-play-ex-btn');
        const fcPrevBtn = document.getElementById('fc10k-prev-btn');
        const fcNextBtn = document.getElementById('fc10k-next-btn');
        const fcFlipBtn = document.getElementById('fc10k-flip-btn');
        const fcMasterBtn = document.getElementById('fc10k-master-btn');
        const fcShuffleBtn = document.getElementById('fc10k-shuffle-btn');
        const fcIndicator = document.getElementById('fc10k-card-indicator');
        const fcTierPills = document.querySelectorAll('#flashcard-10k-modal .tier-pill-btn');

        let fcDeck = [];
        let fcIndex = 0;
        let isCardFlipped = false;
        let fcTier = '1000';

        function buildFcDeck() {
            fcDeck = vocab10kList.filter(item => {
                if (fcTier === '1000') return item.tier === 1;
                if (fcTier === '3000') return item.tier === 2;
                if (fcTier === '5000') return item.tier === 3;
                if (fcTier === '10000') return item.tier === 4;
                return true;
            });
            if (fcDeck.length === 0) fcDeck = vocab10kList.slice(0, 1000);
            fcIndex = 0;
        }

        function renderFcCard() {
            if (!fcDeck.length) return;
            const item = fcDeck[fcIndex];
            isCardFlipped = false;
            fcCard?.classList.remove('flipped');

            if (fcTierTag) fcTierTag.textContent = \`Top \${item.tier === 1 ? '1,000' : item.tier === 2 ? '3,000' : item.tier === 3 ? '5,000' : '10,000'} · \${item.level}\`;
            if (fcWordId) fcWordId.textContent = item.id_word;
            if (fcSyllable) fcSyllable.textContent = item.syllables || '';
            if (fcPos) fcPos.textContent = item.pos;
            if (fcWordZh) fcWordZh.textContent = item.zh_word;
            if (fcExId) fcExId.textContent = item.example || '';
            if (fcExZh) fcExZh.textContent = item.example_zh || '';
            if (fcIndicator) fcIndicator.textContent = \`\${fcIndex + 1} / \${fcDeck.length}\`;

            const isMastered = userStats.masteredWords.includes(item.id_word);
            if (fcMasterBtn) {
                fcMasterBtn.classList.toggle('mastered', isMastered);
                fcMasterBtn.innerHTML = isMastered 
                    ? '<i class="fa-solid fa-check"></i> 已掌握' 
                    : '<i class="fa-regular fa-circle-check"></i> 標記已掌握 (+5 XP)';
            }
        }

        openFcBtn?.addEventListener('click', () => {
            fcTier = currentTier === 'all' ? '1000' : currentTier;
            fcTierPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-tier') === fcTier));
            buildFcDeck();
            renderFcCard();
            fcModal?.classList.add('active');
        });

        closeFcBtn?.addEventListener('click', () => {
            fcModal?.classList.remove('active');
        });

        fcModal?.addEventListener('click', (e) => {
            if (e.target === fcModal) fcModal.classList.remove('active');
        });

        fcTierPills.forEach(p => {
            p.addEventListener('click', () => {
                fcTierPills.forEach(x => x.classList.remove('active'));
                p.classList.add('active');
                fcTier = p.getAttribute('data-tier') || '1000';
                buildFcDeck();
                renderFcCard();
            });
        });

        function toggleFcFlip() {
            isCardFlipped = !isCardFlipped;
            fcCard?.classList.toggle('flipped', isCardFlipped);
            if (navigator.vibrate) navigator.vibrate(10);
        }

        fcCard?.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            toggleFcFlip();
        });

        fcFlipBtn?.addEventListener('click', toggleFcFlip);

        fcPrevBtn?.addEventListener('click', () => {
            if (!fcDeck.length) return;
            fcIndex = (fcIndex - 1 + fcDeck.length) % fcDeck.length;
            renderFcCard();
        });

        fcNextBtn?.addEventListener('click', () => {
            if (!fcDeck.length) return;
            fcIndex = (fcIndex + 1) % fcDeck.length;
            renderFcCard();
        });

        fcShuffleBtn?.addEventListener('click', () => {
            for (let i = fcDeck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [fcDeck[i], fcDeck[j]] = [fcDeck[j], fcDeck[i]];
            }
            fcIndex = 0;
            renderFcCard();
            if (navigator.vibrate) navigator.vibrate(20);
        });

        fcMasterBtn?.addEventListener('click', () => {
            if (!fcDeck.length) return;
            const item = fcDeck[fcIndex];
            const idx = userStats.masteredWords.indexOf(item.id_word);
            if (idx > -1) {
                userStats.masteredWords.splice(idx, 1);
            } else {
                userStats.masteredWords.push(item.id_word);
                addPoints(5);
            }
            saveStats();
            updateStatsUI();
            renderFcCard();
        });

        fcPlayAudioBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!fcDeck.length) return;
            audioEngine.speak(fcDeck[fcIndex].id_word, { lang: 'id' });
        });

        fcPlayBiBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!fcDeck.length) return;
            const item = fcDeck[fcIndex];
            audioEngine.speakBilingual(item.id_word, item.zh_word);
        });

        fcPlayExBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!fcDeck.length) return;
            const item = fcDeck[fcIndex];
            if (item.example) audioEngine.speak(item.example, { lang: 'id' });
        });

        // Initial render
        renderVocabView();
    }

    // ==========================================================================
    // 20. 印尼成語俗諺與經典文化片語 (Peribahasa & Ungkapan Module)
    // ==========================================================================
    function initPeribahasaModule(peribahasaList) {
        const container = document.getElementById('peribahasa-cards-container');
        const tabBtns = document.querySelectorAll('#peribahasa-cat-tabs .category-tab-btn');
        const searchInput = document.getElementById('peribahasa-search-input');

        if (!container || !peribahasaList || !peribahasaList.length) return;

        let activeCat = 'all';
        let searchQuery = '';

        const catNameMap = {
            wisdom: '處世人生智慧',
            conduct: '言行謹慎警世',
            humility: '謙遜待人接物',
            idioms: '當代高頻文化片語'
        };

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderPeribahasa() {
            const filtered = peribahasaList.filter(item => {
                if (activeCat !== 'all' && item.category !== activeCat) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    const matchPhrase = item.phrase && item.phrase.toLowerCase().includes(q);
                    const matchLiteral = item.literal_meaning && item.literal_meaning.toLowerCase().includes(q);
                    const matchZh = item.meaning_zh && item.meaning_zh.toLowerCase().includes(q);
                    const matchNote = item.cultural_note && item.cultural_note.toLowerCase().includes(q);
                    if (!matchPhrase && !matchLiteral && !matchZh && !matchNote) return false;
                }
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = \`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-quote-left" style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--text-muted);"></i>
                        <p>找不到符合篩選條件的成語或片語。</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filtered.map((item, idx) => {
                const catLabel = catNameMap[item.category] || '文化片語';
                return \`
                    <div class="peribahasa-card" data-idx="\${idx}">
                        <div>
                            <div class="peribahasa-header">
                                <span class="peribahasa-cat-tag">\${catLabel}</span>
                                <div class="peribahasa-actions">
                                    <button class="icon-action-btn play-peri-btn" title="朗讀成語印尼文"><i class="fa-solid fa-volume-high"></i></button>
                                    <button class="icon-action-btn play-peri-bi-btn" title="中印雙語朗讀"><i class="fa-solid fa-language"></i></button>
                                </div>
                            </div>
                            <div class="peribahasa-id-phrase">"\${escapeHtml(item.phrase)}"</div>
                            <div class="peribahasa-zh-meaning">【涵義】\${escapeHtml(item.meaning_zh)}</div>
                            <div class="peribahasa-literal-box">
                                <strong><i class="fa-solid fa-seedling"></i> 字面直譯：</strong>\${escapeHtml(item.literal_meaning)}
                            </div>
                            <div class="peribahasa-culture-box">
                                <strong><i class="fa-solid fa-feather-pointed"></i> 文化典故與用法：</strong>\${escapeHtml(item.cultural_note)}
                            </div>
                            \${item.example ? \`
                            <div class="peribahasa-dialogue-box">
                                <div style="font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;">\${escapeHtml(item.example)}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem;">\${escapeHtml(item.example_zh || '')}</div>
                            </div>\` : ''}
                        </div>
                    </div>
                \`;
            }).join('');

            // Bind audio
            container.querySelectorAll('.peribahasa-card').forEach((card, i) => {
                const item = filtered[i];
                card.querySelector('.play-peri-btn')?.addEventListener('click', () => {
                    audioEngine.speak(item.phrase, { lang: 'id' });
                });
                card.querySelector('.play-peri-bi-btn')?.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.phrase, item.meaning_zh);
                });
            });
        }

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCat = btn.getAttribute('data-cat') || 'all';
                renderPeribahasa();
                if (navigator.vibrate) navigator.vibrate(8);
            });
        });

        let searchTimer = null;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchQuery = e.target.value.trim();
                renderPeribahasa();
            }, 180);
        });

        renderPeribahasa();
    }

    // ==========================================================================
    // 21. 日常生活與商務高頻必備語句庫 (Everyday Functional Sentences)
    // ==========================================================================
    function initEverydaySentencesModule(sentencesList) {
        const container = document.getElementById('sentences-list-container');
        const catBtns = document.querySelectorAll('#sentence-categories-bar .sentence-cat-btn');

        if (!container || !sentencesList || !sentencesList.length) return;

        let activeCat = 'all';

        const catNameMap = {
            greeting: '問候打招呼',
            thanks_apology: '道謝與道歉',
            directions: '交通與方向',
            restaurant: '餐廳飲食客製',
            shopping: '購物議價支付',
            social: '社交聚會閒聊',
            polite_decline: '委婉拒絕觀點',
            workplace: '商務辦公遠距',
            emergency: '醫療健康急救',
            digital_life: '數位生活外送'
        };

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderSentences() {
            const filtered = sentencesList.filter(item => {
                if (activeCat !== 'all' && item.category !== activeCat) return false;
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = \`
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-comment-dots" style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--text-muted);"></i>
                        <p>該分類暫無語句。</p>
                    </div>
                \`;
                return;
            }

            container.innerHTML = filtered.map((item, idx) => {
                const catLabel = catNameMap[item.category] || '日常生活';
                return \`
                    <div class="sentence-item-card" data-idx="\${idx}">
                        <div>
                            <span class="sentence-card-cat">\${catLabel}</span>
                            <div class="sentence-id-text">\${escapeHtml(item.id_sent)}</div>
                            <div class="sentence-zh-text">\${escapeHtml(item.zh_sent)}</div>
                            \${item.breakdown ? \`
                            <div class="sentence-breakdown-box">
                                <strong><i class="fa-solid fa-cubes"></i> 文法解析：</strong>\${escapeHtml(item.breakdown)}
                            </div>\` : ''}
                            \${item.tip ? \`
                            <div class="sentence-tip-pill">
                                <i class="fa-solid fa-circle-info"></i> <span>\${escapeHtml(item.tip)}</span>
                            </div>\` : ''}
                        </div>
                        <div class="sentence-card-actions">
                            <button class="action-btn small play-sent-btn"><i class="fa-solid fa-volume-high"></i> 印</button>
                            <button class="action-btn small secondary play-sent-bi-btn"><i class="fa-solid fa-language"></i> 雙語</button>
                        </div>
                    </div>
                \`;
            }).join('');

            // Bind audio
            container.querySelectorAll('.sentence-item-card').forEach((card, i) => {
                const item = filtered[i];
                card.querySelector('.play-sent-btn')?.addEventListener('click', () => {
                    audioEngine.speak(item.id_sent, { lang: 'id' });
                });
                card.querySelector('.play-sent-bi-btn')?.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.id_sent, item.zh_sent);
                });
            });
        }

        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                catBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCat = btn.getAttribute('data-cat') || 'all';
                renderSentences();
                if (navigator.vibrate) navigator.vibrate(8);
            });
        });

        renderSentences();
    }
`;

const universalSpeakTarget = `    // ==========================================================================
    // 全站點擊單字/句子即時發音委託 (Universal Click-to-Speak Delegation)
    // ==========================================================================`;

if (!appJs.includes(universalSpeakTarget)) {
    console.error('Universal speak target not found!');
    process.exit(1);
}

appJs = appJs.replace(universalSpeakTarget, modulesCode + '\n' + universalSpeakTarget);

fs.writeFileSync(appPath, appJs, 'utf8');
console.log('Successfully patched app.js with Vocab 10k Engine, Peribahasa, Everyday Sentences, and Dictionary Search!');
