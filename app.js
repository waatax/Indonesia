/**
 * Indo Learning Hub - Core Application Logic (v3.0)
 * BIPA-compliant, Viet-inspired Dual-Language Audio & Interactive Learning Engine
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================================================
    // 0. Audio Engine (Multi-Tier Bilingual Speech Synthesis)
    // ==========================================================================
    class AudioEngine {
        constructor() {
            this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
            this.voices = [];
            this.currentSequenceTimer = null;
            this.isPlayingSequence = false;
            this.speechRate = 1.0;
            this.activeKey = null;
            this.listeners = new Set();

            if (this.synth) {
                this.initVoices();
                if (typeof window !== 'undefined' && 'onvoiceschanged' in this.synth) {
                    this.synth.onvoiceschanged = () => this.initVoices();
                }
            }
        }

        initVoices() {
            if (!this.synth) return;
            this.voices = this.synth.getVoices() || [];
        }

        getVoice(langCode) {
            if (this.voices.length === 0 && this.synth) {
                this.voices = this.synth.getVoices() || [];
            }
            if (langCode.startsWith('zh')) {
                return this.voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-HK') || v.lang.includes('zh') || v.lang.includes('cmn')) || null;
            }
            if (langCode.startsWith('id')) {
                return this.voices.find(v => v.lang.includes('id') || v.name.toLowerCase().includes('indonesia') || v.name.toLowerCase().includes('indonesian')) || null;
            }
            return null;
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyState(state) {
            this.listeners.forEach(fn => fn(state));
        }

        /**
         * Cleans Indonesian text for clean pronunciation
         */
        cleanIndoText(text) {
            if (!text) return '';
            let cleaned = String(text);
            cleaned = cleaned.replace(/\([^)]*\)/g, ' ');
            cleaned = cleaned.replace(/（[^）]*）/g, ' ');
            cleaned = cleaned.replace(/[\u4e00-\u9fa5]/g, ' ');
            cleaned = cleaned.replace(/[，。！？；：（）「」『』、《》“”‘’…—]/g, ' ');
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            return cleaned;
        }

        /**
         * Single language speech (Indonesian or Chinese)
         */
        speak(rawText, options = {}) {
            return new Promise((resolve) => {
                if (!this.synth || !rawText) {
                    resolve();
                    return;
                }

                try {
                    if (this.synth.paused) this.synth.resume();
                    this.synth.cancel();
                } catch (e) {}

                const lang = options.lang || 'id'; // 'id' | 'zh'
                const targetLang = lang === 'zh' ? 'zh-TW' : 'id-ID';
                const textToSpeak = lang === 'id' ? this.cleanIndoText(rawText) : rawText.trim();
                if (!textToSpeak) {
                    resolve();
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = targetLang;
                utterance.rate = options.rate || this.speechRate;
                utterance.pitch = lang === 'zh' ? 1.05 : 1.0;

                const voice = this.getVoice(targetLang);
                if (voice) {
                    utterance.voice = voice;
                }

                this.activeKey = options.key || rawText;
                this.notifyState({ isPlaying: true, activeKey: this.activeKey });

                if (options.onStart) options.onStart();

                utterance.onend = () => {
                    this.notifyState({ isPlaying: false, activeKey: null });
                    if (options.onEnd) options.onEnd();
                    resolve();
                };

                utterance.onerror = (e) => {
                    this.notifyState({ isPlaying: false, activeKey: null });
                    if (options.onEnd) options.onEnd();
                    resolve();
                };

                this.synth.speak(utterance);
                if (navigator.vibrate) navigator.vibrate(10);
            });
        }

        /**
         * Bilingual Dual-Language speech ("中+印" 雙語播放機制)
         * Speaks Chinese translation first, pauses naturally (350ms), then speaks Indonesian!
         */
        async speakBilingual(idText, zhText, options = {}) {
            if (!idText || !zhText) {
                if (idText) await this.speak(idText, { ...options, lang: 'id' });
                return;
            }

            this.stop();
            this.isPlayingSequence = true;

            // 1. Speak Chinese Translation
            await this.speak(zhText, {
                lang: 'zh',
                rate: options.rate || this.speechRate,
                key: options.key ? `${options.key}_zh` : null
            });

            if (!this.isPlayingSequence) return;

            // Natural conversational gap between languages
            await new Promise(r => {
                this.currentSequenceTimer = setTimeout(r, 350);
            });

            if (!this.isPlayingSequence) return;

            // 2. Speak Authentic Indonesian
            await this.speak(idText, {
                lang: 'id',
                rate: options.rate || this.speechRate,
                key: options.key ? `${options.key}_id` : null,
                onEnd: options.onEnd
            });

            this.isPlayingSequence = false;
        }

        /**
         * Stop all audio and active timers immediately
         */
        stop() {
            this.isPlayingSequence = false;
            if (this.currentSequenceTimer) {
                clearTimeout(this.currentSequenceTimer);
                this.currentSequenceTimer = null;
            }
            if (this.synth) {
                try {
                    this.synth.cancel();
                } catch (e) {}
            }
            this.notifyState({ isPlaying: false, activeKey: null });
        }
    }

    const audioEngine = new AudioEngine();

    // ==========================================================================
    // 1. User Stats & Gamification Engine
    // ==========================================================================
    let userStats = {
        points: 50,
        streak: 1,
        lastVisit: new Date().toDateString(),
        masteredWords: [],
        completedLessons: [],
        quizScore: 0
    };

    try {
        const savedStats = localStorage.getItem('indo_hub_user_stats');
        if (savedStats) {
            const parsed = JSON.parse(savedStats);
            userStats = { ...userStats, ...parsed };
            const today = new Date().toDateString();
            if (userStats.lastVisit !== today) {
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                if (userStats.lastVisit === yesterday) {
                    userStats.streak += 1;
                }
                userStats.lastVisit = today;
                saveStats();
            }
        }
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }

    function saveStats() {
        try {
            localStorage.setItem('indo_hub_user_stats', JSON.stringify(userStats));
        } catch (e) {}
        updateStatsUI();
    }

    function updateStatsUI() {
        const streakEl = document.getElementById('streak-count');
        const pointsEl = document.getElementById('user-points');
        const statWordsEl = document.getElementById('stat-words-mastered');
        const statLessonsEl = document.getElementById('stat-lessons-completed');
        const statQuizEl = document.getElementById('stat-quiz-score');

        if (streakEl) streakEl.textContent = userStats.streak;
        if (pointsEl) pointsEl.textContent = userStats.points;
        if (statWordsEl) statWordsEl.textContent = userStats.masteredWords.length;
        if (statLessonsEl) statLessonsEl.textContent = userStats.completedLessons.length;
        if (statQuizEl) statQuizEl.textContent = userStats.quizScore;
    }

    function addPoints(pts) {
        userStats.points += pts;
        saveStats();
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    }

    // ==========================================================================
    // 2. Fetch Data & Initialize All Modules
    // ==========================================================================
    let curriculumData = null;

    try {
        const response = await fetch('data.json');
        const json = await response.json();
        curriculumData = json.curriculum;

        initNavigation();
        initAlphabetModule(curriculumData.alphabet_module);
        initPronounCalculator(curriculumData.pronoun_calculator);
        initGrammarModule(curriculumData.grammar_modules);
        initNumbersModule(curriculumData.numbers_module);
        initFlashcardModule(curriculumData.vocab_categories);
        initSituationalModule(curriculumData.situational_modules);
        initShadowingModule(curriculumData.shadowing_phrases);
        initAffixAndGaulModule(curriculumData.affix_system, curriculumData.gaul_module);
        initSentencePuzzleModule(curriculumData.sentence_puzzles);
        initDictionaryModal(curriculumData);
        initHeaderControls();
        updateStatsUI();

    } catch (err) {
        console.error('Failed to load curriculum data:', err);
    }

    // ==========================================================================
    // 3. Navigation & Routing
    // ==========================================================================
    function initNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const views = document.querySelectorAll('.view');

        function switchView(targetId) {
            audioEngine.stop();
            navBtns.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
            });
            views.forEach(view => {
                view.classList.toggle('active', view.id === targetId);
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (navigator.vibrate) navigator.vibrate(10);
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                switchView(btn.getAttribute('data-target'));
            });
        });

        document.querySelectorAll('.stage-card').forEach(card => {
            card.addEventListener('click', () => {
                const targetView = card.getAttribute('data-nav');
                if (targetView) switchView(targetView);
            });
        });

        document.querySelector('.logo-area')?.addEventListener('click', () => {
            switchView('map-view');
        });
    }

    // ==========================================================================
    // 4. Alphabet & Phonetics Module
    // ==========================================
    function initAlphabetModule(alphaModule) {
        if (!alphaModule) return;

        const alphabetContainer = document.getElementById('alphabet-grid-container');
        if (alphabetContainer && alphaModule.letters) {
            alphabetContainer.innerHTML = '';
            alphaModule.letters.forEach(item => {
                const card = document.createElement('div');
                card.className = 'letter-card';
                card.innerHTML = `
                    <div class="letter-title">${item.letter}</div>
                    <div class="letter-ipa">${item.ipa}</div>
                    <div class="letter-word">${item.example}</div>
                    <div class="letter-zh">${item.zh}</div>
                    ${item.note ? `<div class="letter-note">${item.note}</div>` : ''}
                `;
                card.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.example, `${item.letter}，${item.zh}`);
                });
                alphabetContainer.appendChild(card);
            });
        }

        const digraphsContainer = document.getElementById('digraphs-grid-container');
        if (digraphsContainer && alphaModule.digraphs) {
            digraphsContainer.innerHTML = '';
            alphaModule.digraphs.forEach(item => {
                const card = document.createElement('div');
                card.className = 'digraph-card';
                card.innerHTML = `
                    <div class="digraph-top">
                        <span class="digraph-combo">${item.combo}</span>
                        <span class="letter-ipa">${item.ipa}</span>
                    </div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.05rem;">${item.example} (${item.zh})</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">${item.note}</div>
                `;
                card.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.example, item.zh);
                });
                digraphsContainer.appendChild(card);
            });

            if (alphaModule.diphthongs) {
                alphaModule.diphthongs.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'digraph-card';
                    card.innerHTML = `
                        <div class="digraph-top">
                            <span class="digraph-combo">${item.combo}</span>
                            <span style="font-size: 0.8rem; background: var(--accent-light); color: var(--accent); padding: 0.1rem 0.5rem; border-radius: 4px;">雙母音</span>
                        </div>
                        <div style="font-weight: 700; color: var(--text-main); font-size: 1.05rem;">${item.example} (${item.zh})</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">${item.note}</div>
                    `;
                    card.addEventListener('click', () => {
                        audioEngine.speakBilingual(item.example, item.zh);
                    });
                    digraphsContainer.appendChild(card);
                });
            }
        }
    }

    // ==========================================================================
    // 5. Pronoun & Social Kinship Calculator (Viet-inspired)
    // ==========================================================================
    function initPronounCalculator(calcData) {
        if (!calcData || !calcData.scenarios) return;

        const tabsContainer = document.getElementById('pronoun-tabs-container');
        const youPronounEl = document.getElementById('calc-you-pronoun');
        const youDescEl = document.getElementById('calc-you-desc');
        const mePronounEl = document.getElementById('calc-me-pronoun');
        const meDescEl = document.getElementById('calc-me-desc');
        const sampleIdEl = document.getElementById('calc-sample-id');
        const sampleZhEl = document.getElementById('calc-sample-zh');
        const playBilingualBtn = document.getElementById('play-calc-bilingual-btn');
        const playIdBtn = document.getElementById('play-calc-id-btn');

        let currentScenario = calcData.scenarios[0];

        function renderScenarioUI(sc) {
            currentScenario = sc;
            youPronounEl.textContent = sc.youPronoun;
            youDescEl.textContent = sc.youDescZh;
            mePronounEl.textContent = sc.myPronoun;
            meDescEl.textContent = sc.myDescZh;
            sampleIdEl.textContent = sc.sampleId;
            sampleZhEl.textContent = sc.sampleZh;
        }

        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            calcData.scenarios.forEach((sc, idx) => {
                const btn = document.createElement('button');
                btn.className = `pronoun-tab-btn ${idx === 0 ? 'active' : ''}`;
                btn.textContent = sc.category;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.pronoun-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderScenarioUI(sc);
                });
                tabsContainer.appendChild(btn);
            });
        }

        playBilingualBtn?.addEventListener('click', () => {
            if (currentScenario) {
                audioEngine.speakBilingual(currentScenario.sampleId, currentScenario.sampleZh);
            }
        });

        playIdBtn?.addEventListener('click', () => {
            if (currentScenario) {
                audioEngine.speak(currentScenario.sampleId, { lang: 'id' });
            }
        });

        renderScenarioUI(calcData.scenarios[0]);
    }

    // ==========================================================================
    // 6. Grammar Modules
    // ==========================================================================
    function initGrammarModule(grammarList) {
        const container = document.getElementById('grammar-modules-container');
        if (!container || !grammarList) return;

        container.innerHTML = '';
        grammarList.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'grammar-card';

            let bodyHtml = '';

            if (mod.rules) {
                bodyHtml += `
                    <ul class="grammar-rules-list">
                        ${mod.rules.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                `;
            }

            if (mod.table) {
                bodyHtml += `
                    <table class="pronoun-table">
                        <thead>
                            <tr>
                                <th>人稱類型</th>
                                <th>正式/通用 (Baku)</th>
                                <th>親近/熟人</th>
                                <th>雅加達口語 (Gaul)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mod.table.map(t => `
                                <tr>
                                    <td><strong>${t.type}</strong></td>
                                    <td>${t.formal}</td>
                                    <td>${t.informal}</td>
                                    <td><span style="color: var(--accent); font-weight: 700;">${t.slang}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${mod.tips ? `<div style="margin-top: 0.8rem; font-size: 0.9rem; color: var(--text-muted);">${mod.tips}</div>` : ''}
                `;
            }

            if (mod.examples) {
                bodyHtml += `
                    <h4 style="font-size: 1rem; font-weight: 700; margin: 1rem 0 0.5rem;">範例示範 (點擊中+印雙語朗讀)：</h4>
                    <div class="examples-grid">
                        ${mod.examples.map(ex => `
                            <div class="example-card" onclick="window.indoSpeakBilingual('${ex.id_sent.replace(/'/g, "\\'")}', '${ex.zh_sent.replace(/'/g, "\\'")}')">
                                <div>
                                    <div class="ex-id">${ex.id_sent}</div>
                                    <div class="ex-zh">${ex.zh_sent}</div>
                                    ${ex.breakdown ? `<div class="ex-breakdown">${ex.breakdown}</div>` : ''}
                                </div>
                                <button class="icon-action-btn" style="width: 32px; height: 32px;"><i class="fa-solid fa-volume-high"></i></button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            if (mod.items) {
                bodyHtml += `
                    <div class="examples-grid">
                        ${mod.items.map(item => `
                            <div class="example-card" onclick="window.indoSpeakBilingual('${item.example.replace(/'/g, "\\'")}', '${item.example_zh.replace(/'/g, "\\'")}')">
                                <div>
                                    <div class="ex-id" style="color: var(--primary); font-size: 1.15rem;">${item.id_word} (${item.zh_word})</div>
                                    <div class="ex-id" style="font-size: 0.95rem; margin-top: 0.2rem;">${item.example}</div>
                                    <div class="ex-zh">${item.example_zh}</div>
                                </div>
                                <button class="icon-action-btn" style="width: 32px; height: 32px;"><i class="fa-solid fa-volume-high"></i></button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="grammar-header">
                    <h3 class="grammar-title">${mod.title}</h3>
                    <span class="grammar-badge">${mod.badge}</span>
                </div>
                <div class="grammar-desc">${mod.description}</div>
                ${bodyHtml}
            `;
            container.appendChild(card);
        });
    }

    // Global helper for HTML onclick attributes
    window.indoSpeakBilingual = (idText, zhText) => {
        audioEngine.speakBilingual(idText, zhText);
    };

    // ==========================================================================
    // 7. Numbers & Rupiah Converter
    // ==========================================
    function numberToIndonesian(num) {
        if (num === 0) return 'nol';
        const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
        
        function convertHundreds(n) {
            let str = '';
            if (n >= 100) {
                const h = Math.floor(n / 100);
                str += (h === 1 ? 'seratus' : ones[h] + ' ratus') + ' ';
                n %= 100;
            }
            if (n >= 20) {
                const t = Math.floor(n / 10);
                str += ones[t] + ' puluh ';
                n %= 10;
                if (n > 0) str += ones[n] + ' ';
            } else if (n >= 12) {
                str += ones[n - 10] + ' belas ';
            } else if (n === 11) {
                str += 'sebelas ';
            } else if (n === 10) {
                str += 'sepuluh ';
            } else if (n > 0) {
                str += ones[n] + ' ';
            }
            return str.trim();
        }

        if (num < 1000) return convertHundreds(num);

        let result = '';
        if (num >= 1000000000) {
            const b = Math.floor(num / 1000000000);
            result += convertHundreds(b) + ' miliar ';
            num %= 1000000000;
        }
        if (num >= 1000000) {
            const m = Math.floor(num / 1000000);
            result += (m === 1 ? 'satu juta' : convertHundreds(m) + ' juta') + ' ';
            num %= 1000000;
        }
        if (num >= 1000) {
            const k = Math.floor(num / 1000);
            result += (k === 1 ? 'seribu' : convertHundreds(k) + ' ribu') + ' ';
            num %= 1000;
        }
        if (num > 0) {
            result += convertHundreds(num);
        }
        return result.trim();
    }

    function initNumbersModule(numModule) {
        if (!numModule) return;

        const inputEl = document.getElementById('rupiah-input');
        const convertBtn = document.getElementById('convert-rupiah-btn');
        const resultIdEl = document.getElementById('rupiah-id-text');
        const resultZhEl = document.getElementById('rupiah-zh-text');
        const playRupiahBtn = document.getElementById('play-rupiah-btn');

        function updateRupiah() {
            const val = parseInt(inputEl.value, 10);
            if (isNaN(val) || val < 0) {
                resultIdEl.textContent = 'Silakan masukkan angka positif.';
                resultZhEl.textContent = '請輸入大於等於 0 的數字。';
                return;
            }
            const words = numberToIndonesian(val);
            const formattedWords = words.charAt(0).toUpperCase() + words.slice(1) + ' rupiah';
            const approxNT = Math.round(val / 500);
            resultIdEl.textContent = formattedWords;
            resultZhEl.textContent = `${val.toLocaleString()} 印尼盾 (約 NT$ ${approxNT.toLocaleString()})`;
        }

        convertBtn?.addEventListener('click', updateRupiah);
        inputEl?.addEventListener('input', updateRupiah);
        playRupiahBtn?.addEventListener('click', () => {
            audioEngine.speakBilingual(resultIdEl.textContent, resultZhEl.textContent);
        });

        const unitsContainer = document.getElementById('num-units-container');
        if (unitsContainer && numModule.units) {
            unitsContainer.innerHTML = '';
            const allNums = [...numModule.units, ...(numModule.teens_and_tens || [])];
            allNums.forEach(item => {
                const pill = document.createElement('div');
                pill.className = 'num-pill';
                pill.innerHTML = `<strong>${item.id_word}</strong> <span>${item.zh_word}</span>`;
                pill.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.id_word, item.zh_word);
                });
                unitsContainer.appendChild(pill);
            });
        }

        const timeContainer = document.getElementById('time-calendar-container');
        if (timeContainer && numModule.time_calendar) {
            timeContainer.innerHTML = '';
            const allTimes = [
                ...(numModule.time_calendar.days || []),
                ...(numModule.time_calendar.relative_time || [])
            ];
            allTimes.forEach(item => {
                const pill = document.createElement('div');
                pill.className = 'num-pill';
                pill.innerHTML = `<strong>${item.id_word}</strong> <span>${item.zh_word}</span>`;
                pill.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.id_word, item.zh_word);
                });
                timeContainer.appendChild(pill);
            });
        }
    }

    // ==========================================================================
    // 8. 3D Flashcards & Vocab Module
    // ==========================================
    function initFlashcardModule(categories) {
        if (!categories || categories.length === 0) return;

        let currentCatIndex = 0;
        let currentCardIndex = 0;
        let currentWords = categories[0].words || [];

        const catFiltersContainer = document.getElementById('vocab-category-filters');
        const flashcard3d = document.getElementById('main-flashcard');
        const cardCatTag = document.getElementById('card-cat-tag');
        const cardWordId = document.getElementById('card-word-id');
        const cardWordZh = document.getElementById('card-word-zh');
        const cardExId = document.getElementById('card-ex-id');
        const cardExZh = document.getElementById('card-ex-zh');
        const cardIndexIndicator = document.getElementById('card-index-indicator');
        const vocabTableContainer = document.getElementById('vocab-table-container');
        const vocabCountBadge = document.getElementById('vocab-count-badge');

        if (catFiltersContainer) {
            catFiltersContainer.innerHTML = '';
            categories.forEach((cat, idx) => {
                const btn = document.createElement('button');
                btn.className = `cat-filter-btn ${idx === 0 ? 'active' : ''}`;
                btn.innerHTML = `<i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name}`;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentCatIndex = idx;
                    currentWords = categories[idx].words || [];
                    currentCardIndex = 0;
                    updateCardUI();
                    renderVocabTable();
                });
                catFiltersContainer.appendChild(btn);
            });
        }

        function updateCardUI() {
            if (currentWords.length === 0) return;
            const w = currentWords[currentCardIndex];
            flashcard3d.classList.remove('flipped');
            cardCatTag.textContent = categories[currentCatIndex].name.split(' (')[0];
            cardWordId.textContent = w.id_word;
            cardWordZh.textContent = w.zh_word;
            cardExId.textContent = w.example || '';
            cardExZh.textContent = w.example_zh || '';
            cardIndexIndicator.textContent = `${currentCardIndex + 1} / ${currentWords.length}`;

            const masterBtn = document.getElementById('card-master-btn');
            const isMastered = userStats.masteredWords.includes(w.id_word);
            if (masterBtn) {
                masterBtn.innerHTML = isMastered 
                    ? `<i class="fa-solid fa-check-double"></i> 已掌握 (+5 XP)`
                    : `<i class="fa-solid fa-check"></i> 標記已掌握`;
            }
        }

        function renderVocabTable() {
            if (!vocabTableContainer) return;
            vocabTableContainer.innerHTML = '';
            vocabCountBadge.textContent = `${currentWords.length} 個單字`;

            currentWords.forEach(w => {
                const row = document.createElement('div');
                row.className = 'vocab-list-row';
                row.innerHTML = `
                    <div>
                        <strong style="color: var(--text-main); font-size: 1rem;">${w.id_word}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${w.zh_word}</div>
                    </div>
                    <button class="icon-action-btn" style="width: 32px; height: 32px;"><i class="fa-solid fa-volume-high"></i></button>
                `;
                row.addEventListener('click', () => {
                    audioEngine.speakBilingual(w.id_word, w.zh_word);
                });
                vocabTableContainer.appendChild(row);
            });
        }

        flashcard3d?.addEventListener('click', (e) => {
            if (e.target.closest('.card-audio-btn')) return;
            flashcard3d.classList.toggle('flipped');
            if (navigator.vibrate) navigator.vibrate(10);
        });

        document.getElementById('card-flip-btn')?.addEventListener('click', () => {
            flashcard3d.classList.toggle('flipped');
        });

        document.getElementById('card-play-audio-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentWords.length > 0) {
                audioEngine.speak(currentWords[currentCardIndex].id_word, { lang: 'id' });
            }
        });

        document.getElementById('card-play-bilingual-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentWords.length > 0) {
                const w = currentWords[currentCardIndex];
                audioEngine.speakBilingual(w.id_word, w.zh_word);
            }
        });

        document.getElementById('card-play-ex-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentWords.length > 0 && currentWords[currentCardIndex].example) {
                const w = currentWords[currentCardIndex];
                audioEngine.speakBilingual(w.example, w.example_zh);
            }
        });

        document.getElementById('card-next-btn')?.addEventListener('click', () => {
            currentCardIndex = (currentCardIndex + 1) % currentWords.length;
            updateCardUI();
        });

        document.getElementById('card-prev-btn')?.addEventListener('click', () => {
            currentCardIndex = (currentCardIndex - 1 + currentWords.length) % currentWords.length;
            updateCardUI();
        });

        document.getElementById('card-shuffle-btn')?.addEventListener('click', () => {
            currentWords.sort(() => Math.random() - 0.5);
            currentCardIndex = 0;
            updateCardUI();
            renderVocabTable();
            if (navigator.vibrate) navigator.vibrate(15);
        });

        document.getElementById('card-master-btn')?.addEventListener('click', () => {
            if (currentWords.length === 0) return;
            const word = currentWords[currentCardIndex].id_word;
            if (!userStats.masteredWords.includes(word)) {
                userStats.masteredWords.push(word);
                addPoints(5);
            }
            updateCardUI();
        });

        updateCardUI();
        renderVocabTable();
    }

    // ==========================================================================
    // 9. 10 Situational Modules & Dialogue Player (Viet-inspired Architecture)
    // ==========================================================================
    function initSituationalModule(modules) {
        if (!modules || modules.length === 0) return;

        const gridContainer = document.getElementById('situational-grid-container');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        modules.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'module-card';
            card.innerHTML = `
                <img src="${mod.image || 'assets/indo_hero_illustration_1787210889692.jpg'}" class="module-card-img" alt="${mod.title}">
                <div class="module-card-content">
                    <span class="module-loc-tag"><i class="fa-solid fa-location-dot"></i> ${mod.location || '印尼生活實境'}</span>
                    <h3>${mod.title}</h3>
                    <p>${mod.subtitle}</p>
                    <button class="action-btn start-lesson-btn" data-mod-id="${mod.id}"><i class="fa-solid fa-play"></i> 進入實境</button>
                </div>
            `;
            gridContainer.appendChild(card);
        });

        document.querySelectorAll('.start-lesson-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modId = e.currentTarget.getAttribute('data-mod-id');
                const selectedMod = modules.find(m => m.id === modId);
                if (selectedMod) {
                    openLesson(selectedMod);
                }
            });
        });

        function openLesson(mod) {
            audioEngine.stop();
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('lesson-view').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            document.getElementById('current-lesson-title').textContent = mod.title;
            document.getElementById('current-lesson-loc').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${mod.location || '印尼生活實境'}`;
            document.getElementById('culture-tip-content').textContent = mod.culture_tip || '注意印尼當地的社交禮貌與習慣。';

            // Support dialogue sections (e.g. Dialogue 1 Standard vs Dialogue 2 Gaul)
            const sections = mod.dialogueSections && mod.dialogueSections.length > 0 
                ? mod.dialogueSections 
                : [{ id: 'd1', title: '標準情境會話', dialogue: mod.dialogue || [] }];

            let activeSection = sections[0];
            let isPlayingFull = false;
            let isPlayingMode = null; // 'bilingual' | 'id-only'
            let activeLineIndex = null;
            let isTranslationHidden = false;
            let fullPlayTimer = null;

            const tabsContainer = document.getElementById('dialogue-sections-tab-bar');
            const chatContainer = document.getElementById('dialogue-bubbles-container');
            const playBilingualBtn = document.getElementById('play-dialogue-bilingual-btn');
            const playIdBtn = document.getElementById('play-dialogue-id-btn');
            const toggleTransBtn = document.getElementById('toggle-dialogue-trans-btn');

            // Render section tabs
            if (tabsContainer) {
                tabsContainer.innerHTML = '';
                if (sections.length > 1) {
                    sections.forEach((sec, sIdx) => {
                        const tabBtn = document.createElement('button');
                        tabBtn.className = `dialogue-sec-tab-btn ${sIdx === 0 ? 'active' : ''}`;
                        tabBtn.innerHTML = `<span>${sIdx === 0 ? '💬' : '🌟'}</span> <span>${sec.title}</span>`;
                        tabBtn.addEventListener('click', () => {
                            audioEngine.stop();
                            stopFullPlay();
                            document.querySelectorAll('.dialogue-sec-tab-btn').forEach(b => b.classList.remove('active'));
                            tabBtn.classList.add('active');
                            activeSection = sec;
                            renderDialogueBubbles();
                        });
                        tabsContainer.appendChild(tabBtn);
                    });
                }
            }

            function renderDialogueBubbles() {
                chatContainer.innerHTML = '';
                const lines = activeSection.dialogue || [];
                lines.forEach((line, idx) => {
                    const isUser = line.speaker.toLowerCase().includes('saya') || idx % 2 !== 0;
                    const wrapper = document.createElement('div');
                    wrapper.className = `chat-bubble-wrapper ${isUser ? 'right' : 'left'} ${isTranslationHidden ? 'hide-translation' : ''}`;
                    wrapper.id = `chat-line-${idx}`;
                    wrapper.innerHTML = `
                        <span class="speaker-name">${line.speaker}</span>
                        <div class="chat-bubble">
                            <div class="chat-id">${line.id_text}</div>
                            <div class="chat-zh">${line.zh_text}</div>
                            <div class="chat-bubble-actions">
                                <button class="chat-play-btn" data-type="bilingual" data-idx="${idx}"><i class="fa-solid fa-language"></i> 中+印 雙語</button>
                                <button class="chat-play-btn" data-type="id" data-idx="${idx}"><i class="fa-solid fa-play"></i> 純印尼語</button>
                            </div>
                        </div>
                    `;
                    chatContainer.appendChild(wrapper);
                });

                // Single line triggers
                chatContainer.querySelectorAll('.chat-play-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        stopFullPlay();
                        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
                        const type = e.currentTarget.getAttribute('data-type');
                        const line = lines[idx];

                        highlightLine(idx);
                        if (type === 'bilingual') {
                            audioEngine.speakBilingual(line.id_text, line.zh_text, {
                                onEnd: () => highlightLine(null)
                            });
                        } else {
                            audioEngine.speak(line.id_text, {
                                lang: 'id',
                                onEnd: () => highlightLine(null)
                            });
                        }
                    });
                });
            }

            function highlightLine(idx) {
                activeLineIndex = idx;
                document.querySelectorAll('.chat-bubble-wrapper').forEach((el, i) => {
                    const isTarget = (i === idx);
                    el.classList.toggle('line-highlight', isTarget);
                    if (isTarget) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }

            function stopFullPlay() {
                isPlayingFull = false;
                isPlayingMode = null;
                highlightLine(null);
                if (fullPlayTimer) clearTimeout(fullPlayTimer);
                audioEngine.stop();
                playBilingualBtn.classList.remove('playing');
                playBilingualBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>中+印 雙語播放 (+20 XP)</span>`;
                playIdBtn.classList.remove('playing');
                playIdBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>純印尼語朗讀</span>`;
            }

            async function playLineInSequence(lineIdx, mode) {
                const lines = activeSection.dialogue || [];
                if (!isPlayingFull || lineIdx >= lines.length) {
                    stopFullPlay();
                    if (lineIdx >= lines.length) {
                        addPoints(20);
                        if (!userStats.completedLessons.includes(mod.id)) {
                            userStats.completedLessons.push(mod.id);
                            saveStats();
                        }
                    }
                    return;
                }

                highlightLine(lineIdx);
                const line = lines[lineIdx];

                if (mode === 'bilingual') {
                    await audioEngine.speakBilingual(line.id_text, line.zh_text);
                } else {
                    await audioEngine.speak(line.id_text, { lang: 'id' });
                }

                if (!isPlayingFull) return;

                fullPlayTimer = setTimeout(() => {
                    if (isPlayingFull) {
                        playLineInSequence(lineIdx + 1, mode);
                    }
                }, 750);
            }

            // Play Bilingual Full
            playBilingualBtn.onclick = () => {
                if (isPlayingFull && isPlayingMode === 'bilingual') {
                    stopFullPlay();
                } else {
                    stopFullPlay();
                    isPlayingFull = true;
                    isPlayingMode = 'bilingual';
                    playBilingualBtn.classList.add('playing');
                    playBilingualBtn.innerHTML = `<i class="fa-solid fa-pause"></i> <span>暫停播放</span>`;
                    playLineInSequence(0, 'bilingual');
                }
            };

            // Play Indonesian Full
            playIdBtn.onclick = () => {
                if (isPlayingFull && isPlayingMode === 'id-only') {
                    stopFullPlay();
                } else {
                    stopFullPlay();
                    isPlayingFull = true;
                    isPlayingMode = 'id-only';
                    playIdBtn.classList.add('playing');
                    playIdBtn.innerHTML = `<i class="fa-solid fa-pause"></i> <span>暫停朗讀</span>`;
                    playLineInSequence(0, 'id-only');
                }
            };

            // Toggle Translation Visibility (Audio-first blur mode)
            toggleTransBtn.onclick = () => {
                isTranslationHidden = !isTranslationHidden;
                toggleTransBtn.innerHTML = isTranslationHidden 
                    ? `<i class="fa-solid fa-eye"></i> <span>顯示中文翻譯</span>`
                    : `<i class="fa-solid fa-eye-slash"></i> <span>隱藏中文翻譯 (聽力模式)</span>`;
                document.querySelectorAll('.chat-bubble-wrapper').forEach(wrapper => {
                    wrapper.classList.toggle('hide-translation', isTranslationHidden);
                });
            };

            // Populate Role-play Quiz
            const quizContainer = document.getElementById('lesson-roleplay-card');
            const questionEl = document.getElementById('roleplay-question');
            const optionsContainer = document.getElementById('roleplay-options-container');
            const feedbackEl = document.getElementById('roleplay-feedback');

            if (mod.interactive_quiz) {
                quizContainer.style.display = 'block';
                feedbackEl.style.display = 'none';
                questionEl.textContent = mod.interactive_quiz.question;
                optionsContainer.innerHTML = '';

                mod.interactive_quiz.options.forEach((opt, optIdx) => {
                    const optBtn = document.createElement('button');
                    optBtn.className = 'quiz-option-btn';
                    optBtn.textContent = `${String.fromCharCode(65 + optIdx)}. ${opt.text}`;
                    optBtn.addEventListener('click', () => {
                        optionsContainer.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('correct', 'wrong'));
                        
                        if (opt.correct) {
                            optBtn.classList.add('correct');
                            feedbackEl.className = 'roleplay-feedback';
                            feedbackEl.style.background = 'var(--success-light)';
                            feedbackEl.style.color = 'var(--success)';
                            feedbackEl.style.display = 'block';
                            feedbackEl.innerHTML = `🎉 <strong>太棒了！</strong> ${opt.feedback}`;
                            
                            if (!userStats.completedLessons.includes(mod.id)) {
                                userStats.completedLessons.push(mod.id);
                                addPoints(20);
                            }
                        } else {
                            optBtn.classList.add('wrong');
                            feedbackEl.className = 'roleplay-feedback';
                            feedbackEl.style.background = 'var(--primary-light)';
                            feedbackEl.style.color = 'var(--primary)';
                            feedbackEl.style.display = 'block';
                            feedbackEl.innerHTML = `💡 <strong>再試一次：</strong> ${opt.feedback}`;
                        }
                    });
                    optionsContainer.appendChild(optBtn);
                });
            } else {
                quizContainer.style.display = 'none';
            }

            renderDialogueBubbles();
        }

        document.getElementById('back-to-modules-btn')?.addEventListener('click', () => {
            audioEngine.stop();
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('module-view').classList.add('active');
        });
    }

    // ==========================================================================
    // 10. Shadowing Engine & Voice Recognition Evaluator (Web Speech API)
    // ==========================================================================
    function initShadowingModule(phrases) {
        if (!phrases || phrases.length === 0) return;

        let currentIdx = 0;
        let isListening = false;
        let recognition = null;

        const categoryEl = document.getElementById('shadowing-category');
        const targetIdEl = document.getElementById('shadowing-target-id');
        const targetZhEl = document.getElementById('shadowing-target-zh');
        const tipEl = document.getElementById('shadowing-phonetic-tip');
        const indicatorEl = document.getElementById('shadowing-index-indicator');
        const playBilingualBtn = document.getElementById('shadowing-play-bilingual-btn');
        const playSlowBtn = document.getElementById('shadowing-play-slow-btn');
        const recordBtn = document.getElementById('mic-record-btn');
        const statusText = document.getElementById('mic-status-text');
        const transcriptBox = document.getElementById('transcript-box');
        const transcriptText = document.getElementById('transcript-text');
        const resultBox = document.getElementById('accuracy-result-box');
        const scoreNum = document.getElementById('accuracy-score-num');
        const scoreFill = document.getElementById('score-bar-fill');
        const feedbackMsg = document.getElementById('score-feedback-msg');

        // Init Web Speech Recognition
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRec) {
            recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'id-ID';

            recognition.onresult = (event) => {
                let current = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    current += event.results[i][0].transcript;
                }
                transcriptBox.style.display = 'block';
                transcriptText.textContent = current;

                if (event.results[0].isFinal) {
                    evaluateSpeech(current);
                    stopListening();
                }
            };

            recognition.onerror = (event) => {
                stopListening();
                statusText.textContent = `語音辨識提示: ${event.error === 'not-allowed' ? '請允許麥克風權限' : event.error}`;
            };

            recognition.onend = () => {
                stopListening();
            };
        }

        function calculateSimilarity(str1, str2) {
            const clean1 = str1.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
            const clean2 = str2.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
            if (clean1.length === 0 || clean2.length === 0) return 0;

            let matches = 0;
            clean1.forEach(word => {
                if (clean2.includes(word)) matches++;
            });
            const ratio = (matches / Math.max(clean1.length, clean2.length)) * 100;
            return Math.min(100, Math.round(ratio + (clean1[0] === clean2[0] ? 15 : 0)));
        }

        function evaluateSpeech(userVoiceText) {
            const currentP = phrases[currentIdx];
            const similarity = calculateSimilarity(userVoiceText, currentP.id_text);
            const score = Math.max(50, Math.min(100, similarity));

            resultBox.style.display = 'block';
            scoreNum.textContent = `${score}%`;
            scoreFill.style.width = `${score}%`;

            if (score >= 80) {
                scoreNum.style.color = 'var(--success)';
                scoreFill.style.background = 'var(--success)';
                feedbackMsg.innerHTML = `🎉 <strong>太炸了大哥！</strong> 發音非常標準流利！(+15 XP)`;
                addPoints(15);
            } else {
                scoreNum.style.color = 'var(--warning)';
                scoreFill.style.background = 'var(--warning)';
                feedbackMsg.innerHTML = `💡 <strong>很棒的嘗試！</strong> 建議多聽兩次慢速示範再跟讀一次喔！`;
            }
        }

        function startListening() {
            if (!recognition) {
                alert('您的瀏覽器不支援 SpeechRecognition 語音辨識，請使用 Chrome、Edge 或 Safari。');
                return;
            }
            audioEngine.stop();
            isListening = true;
            recordBtn.classList.add('recording');
            statusText.textContent = '🎙️ 正在聆聽中... 請大聲說出印尼語句子！';
            resultBox.style.display = 'none';
            transcriptBox.style.display = 'none';
            try {
                recognition.start();
            } catch (e) {}
        }

        function stopListening() {
            isListening = false;
            recordBtn.classList.remove('recording');
            statusText.textContent = '點擊麥克風開始錄音跟讀...';
            if (recognition) {
                try { recognition.stop(); } catch (e) {}
            }
        }

        function renderShadowingUI() {
            const p = phrases[currentIdx];
            categoryEl.textContent = p.category;
            targetIdEl.textContent = p.id_text;
            targetZhEl.textContent = p.zh_text;
            tipEl.textContent = `💡 ${p.phonetic_tip}`;
            indicatorEl.textContent = `${currentIdx + 1} / ${phrases.length}`;
            resultBox.style.display = 'none';
            transcriptBox.style.display = 'none';
            statusText.textContent = '點擊麥克風開始錄音跟讀...';
        }

        recordBtn?.addEventListener('click', () => {
            if (isListening) stopListening();
            else startListening();
        });

        playBilingualBtn?.addEventListener('click', () => {
            const p = phrases[currentIdx];
            audioEngine.speakBilingual(p.id_text, p.zh_text);
        });

        playSlowBtn?.addEventListener('click', () => {
            const p = phrases[currentIdx];
            audioEngine.speak(p.id_text, { lang: 'id', rate: 0.75 });
        });

        document.getElementById('shadowing-next-btn')?.addEventListener('click', () => {
            stopListening();
            currentIdx = (currentIdx + 1) % phrases.length;
            renderShadowingUI();
        });

        document.getElementById('shadowing-prev-btn')?.addEventListener('click', () => {
            stopListening();
            currentIdx = (currentIdx - 1 + phrases.length) % phrases.length;
            renderShadowingUI();
        });

        renderShadowingUI();
    }

    // ==========================================================================
    // 11. Affixes & Bahasa Gaul Module
    // ==========================================
    function initAffixAndGaulModule(affixSys, gaulMod) {
        if (affixSys) {
            const rootContainer = document.getElementById('root-buttons-container');
            const derivContainer = document.getElementById('affix-derivations-container');
            const nasalContainer = document.getElementById('nasal-rules-container');

            if (rootContainer && affixSys.roots) {
                rootContainer.innerHTML = '';
                affixSys.roots.forEach((item, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `root-btn ${idx === 0 ? 'active' : ''}`;
                    btn.textContent = `${item.root} (${item.meaning.split(' (')[0]})`;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.root-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderDerivations(item);
                    });
                    rootContainer.appendChild(btn);
                });

                function renderDerivations(rootObj) {
                    if (!derivContainer) return;
                    derivContainer.innerHTML = '';
                    rootObj.derivations.forEach(d => {
                        const card = document.createElement('div');
                        card.className = 'deriv-card';
                        card.innerHTML = `
                            <span class="deriv-affix">+ ${d.affix}</span>
                            <div class="deriv-word">${d.word}</div>
                            <span class="deriv-pos">${d.pos}</span>
                            <div class="deriv-meaning">${d.explanation}</div>
                            <div class="deriv-example">${d.example}</div>
                        `;
                        card.addEventListener('click', () => {
                            audioEngine.speakBilingual(d.word, d.explanation);
                        });
                        derivContainer.appendChild(card);
                    });
                }
                renderDerivations(affixSys.roots[0]);
            }

            if (nasalContainer && affixSys.nasal_rules) {
                nasalContainer.innerHTML = '';
                affixSys.nasal_rules.forEach(r => {
                    const pill = document.createElement('div');
                    pill.className = 'rule-pill';
                    pill.innerHTML = `<strong>${r.letter}:</strong> ${r.rule}`;
                    nasalContainer.appendChild(pill);
                });
            }
        }

        if (gaulMod) {
            const gaulTableContainer = document.getElementById('gaul-table-container');
            if (gaulTableContainer && gaulMod.baku_vs_gaul) {
                gaulTableContainer.innerHTML = '';
                gaulMod.baku_vs_gaul.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'gaul-card';
                    card.innerHTML = `
                        <div class="gaul-baku">正式: ${item.baku}</div>
                        <div class="gaul-word">${item.gaul}</div>
                        <div class="gaul-zh">${item.zh}</div>
                    `;
                    card.addEventListener('click', () => {
                        audioEngine.speakBilingual(item.gaul.split(' / ')[0], item.zh);
                    });
                    gaulTableContainer.appendChild(card);
                });
            }

            const particlesContainer = document.getElementById('particles-container');
            if (particlesContainer && gaulMod.particles) {
                particlesContainer.innerHTML = '';
                gaulMod.particles.forEach(p => {
                    const div = document.createElement('div');
                    div.className = 'particle-item';
                    div.innerHTML = `
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">${p.particle}</div>
                        <div style="font-size: 0.88rem; color: var(--text-main); margin: 0.2rem 0;">${p.usage}</div>
                        <div style="font-size: 0.8rem; color: var(--accent); cursor: pointer;" onclick="window.indoSpeakBilingual('${p.example.replace(/'/g, "\\'")}', '${p.usage.replace(/'/g, "\\'")}')"><i class="fa-solid fa-volume-high"></i> ${p.example}</div>
                    `;
                    particlesContainer.appendChild(div);
                });
            }

            const chatSlangContainer = document.getElementById('chat-slang-container');
            if (chatSlangContainer && gaulMod.chat_slang) {
                chatSlangContainer.innerHTML = '';
                gaulMod.chat_slang.forEach(s => {
                    const div = document.createElement('div');
                    div.className = 'chat-slang-item';
                    div.innerHTML = `
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">${s.slang}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${s.full}</div>
                        <div style="font-size: 0.9rem; font-weight: 600;">${s.zh}</div>
                    `;
                    chatSlangContainer.appendChild(div);
                });
            }
        }
    }

    // ==========================================================================
    // 12. Sentence Puzzle Game
    // ==========================================
    function initSentencePuzzleModule(puzzles) {
        if (!puzzles || puzzles.length === 0) return;

        let currentPuzzleIdx = 0;
        let selectedWords = [];

        const badgeEl = document.getElementById('puzzle-badge');
        const promptEl = document.getElementById('puzzle-target-zh');
        const slotEl = document.getElementById('puzzle-answer-slot');
        const poolEl = document.getElementById('puzzle-word-pool');
        const feedbackEl = document.getElementById('puzzle-feedback');
        const clearBtn = document.getElementById('puzzle-clear-btn');
        const checkBtn = document.getElementById('puzzle-check-btn');
        const nextBtn = document.getElementById('puzzle-next-btn');
        const progressFill = document.getElementById('puzzle-progress-fill');

        function loadPuzzle() {
            const p = puzzles[currentPuzzleIdx];
            selectedWords = [];
            feedbackEl.style.display = 'none';
            nextBtn.style.display = 'none';
            checkBtn.style.display = 'inline-flex';
            badgeEl.textContent = `挑戰第 ${currentPuzzleIdx + 1} 題 / 共 ${puzzles.length} 題`;
            promptEl.textContent = p.target_zh;
            progressFill.style.width = `${((currentPuzzleIdx + 1) / puzzles.length) * 100}%`;

            renderSlotsAndPool(p);
        }

        function renderSlotsAndPool(p) {
            slotEl.innerHTML = '';
            if (selectedWords.length === 0) {
                slotEl.innerHTML = '<span class="slot-placeholder">點擊下方詞塊放入這裡...</span>';
            } else {
                selectedWords.forEach((word, idx) => {
                    const block = document.createElement('button');
                    block.className = 'word-block';
                    block.textContent = word;
                    block.addEventListener('click', () => {
                        selectedWords.splice(idx, 1);
                        renderSlotsAndPool(p);
                    });
                    slotEl.appendChild(block);
                });
            }

            poolEl.innerHTML = '';
            p.options.forEach((optWord) => {
                const isUsed = selectedWords.includes(optWord);
                const block = document.createElement('button');
                block.className = `word-block ${isUsed ? 'used' : ''}`;
                block.textContent = optWord;
                block.addEventListener('click', () => {
                    if (!isUsed) {
                        selectedWords.push(optWord);
                        renderSlotsAndPool(p);
                        if (navigator.vibrate) navigator.vibrate(8);
                    }
                });
                poolEl.appendChild(block);
            });
        }

        clearBtn?.addEventListener('click', () => {
            selectedWords = [];
            feedbackEl.style.display = 'none';
            renderSlotsAndPool(puzzles[currentPuzzleIdx]);
        });

        checkBtn?.addEventListener('click', () => {
            const p = puzzles[currentPuzzleIdx];
            const isMatch = JSON.stringify(selectedWords) === JSON.stringify(p.correct_order);

            feedbackEl.style.display = 'block';
            if (isMatch) {
                const assembledSentence = selectedWords.join(' ');
                feedbackEl.style.background = 'var(--success-light)';
                feedbackEl.style.color = 'var(--success)';
                feedbackEl.innerHTML = `🎉 <strong>答對了！恭喜！</strong> (+10 分)<br><small style="color: var(--text-main); font-size: 1.1rem; font-weight: 800; cursor: pointer;" onclick="window.indoSpeakBilingual('${assembledSentence.replace(/'/g, "\\'")}', '${p.target_zh.replace(/'/g, "\\'")}')"><i class="fa-solid fa-volume-high"></i> ${assembledSentence}</small>`;
                audioEngine.speakBilingual(assembledSentence, p.target_zh);
                checkBtn.style.display = 'none';
                nextBtn.style.display = 'inline-flex';
                
                userStats.quizScore += 10;
                addPoints(10);
            } else {
                feedbackEl.style.background = 'var(--primary-light)';
                feedbackEl.style.color = 'var(--primary)';
                feedbackEl.innerHTML = `❌ <strong>語序有誤，再調整看看喔！</strong>`;
                if (navigator.vibrate) navigator.vibrate([40, 40]);
            }
        });

        nextBtn?.addEventListener('click', () => {
            currentPuzzleIdx = (currentPuzzleIdx + 1) % puzzles.length;
            loadPuzzle();
        });

        loadPuzzle();
    }

    // ==========================================================================
    // 13. Instant Dictionary Search Modal
    // ==========================================
    function initDictionaryModal(data) {
        const modalEl = document.getElementById('dict-modal');
        const openBtn = document.getElementById('open-dict-btn');
        const closeBtn = document.getElementById('close-dict-btn');
        const searchInput = document.getElementById('dict-search-input');
        const resultsContainer = document.getElementById('dict-results-container');

        if (!modalEl || !searchInput) return;

        const searchIndex = [];

        data.vocab_categories?.forEach(cat => {
            cat.words?.forEach(w => {
                searchIndex.push({
                    id_text: w.id_word,
                    zh_text: w.zh_word,
                    type: cat.name.split(' (')[0]
                });
            });
        });

        data.grammar_modules?.forEach(mod => {
            mod.examples?.forEach(ex => {
                searchIndex.push({ id_text: ex.id_sent, zh_text: ex.zh_sent, type: '語法例句' });
            });
            mod.items?.forEach(item => {
                searchIndex.push({ id_text: item.id_word, zh_text: item.zh_word, type: '疑問詞' });
            });
        });

        data.gaul_module?.baku_vs_gaul?.forEach(g => {
            searchIndex.push({ id_text: g.gaul, zh_text: `${g.zh} (正式: ${g.baku})`, type: 'Gaul 口語' });
        });

        openBtn?.addEventListener('click', () => {
            modalEl.classList.add('active');
            searchInput.value = '';
            searchInput.focus();
            resultsContainer.innerHTML = '<p class="search-empty">請在上方輸入關鍵字開始檢索...</p>';
        });

        closeBtn?.addEventListener('click', () => {
            modalEl.classList.remove('active');
        });

        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) modalEl.classList.remove('active');
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                resultsContainer.innerHTML = '<p class="search-empty">請在上方輸入關鍵字開始檢索...</p>';
                return;
            }

            const matches = searchIndex.filter(item => 
                item.id_text.toLowerCase().includes(query) || 
                item.zh_text.toLowerCase().includes(query)
            ).slice(0, 15);

            if (matches.length === 0) {
                resultsContainer.innerHTML = '<p class="search-empty">找不到相關單字或例句...</p>';
                return;
            }

            resultsContainer.innerHTML = '';
            matches.forEach(item => {
                const row = document.createElement('div');
                row.className = 'dict-result-row';
                row.innerHTML = `
                    <div>
                        <strong style="font-size: 1rem; color: var(--text-main);">${item.id_text}</strong>
                        <span style="font-size: 0.75rem; background: var(--accent-light); color: var(--accent); padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.4rem;">${item.type}</span>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">${item.zh_text}</div>
                    </div>
                    <button class="icon-action-btn" style="width: 32px; height: 32px;"><i class="fa-solid fa-volume-high"></i></button>
                `;
                row.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.id_text, item.zh_text);
                });
                resultsContainer.appendChild(row);
            });
        });
    }

    // ==========================================================================
    // 14. Header Controls (Theme, Font, Speed)
    // ==========================================
    function initHeaderControls() {
        const themeBtn = document.getElementById('theme-toggle');
        const fontIncBtn = document.getElementById('font-increase');
        const fontDecBtn = document.getElementById('font-decrease');
        const speedBtn = document.getElementById('speed-toggle-btn');
        const htmlEl = document.documentElement;

        themeBtn?.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            themeBtn.innerHTML = newTheme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            if (navigator.vibrate) navigator.vibrate(10);
        });

        const fontSizes = ['small', 'normal', 'large'];
        let fontIdx = 1;
        fontIncBtn?.addEventListener('click', () => {
            if (fontIdx < fontSizes.length - 1) {
                fontIdx++;
                htmlEl.setAttribute('data-font-size', fontSizes[fontIdx]);
                if (navigator.vibrate) navigator.vibrate(8);
            }
        });
        fontDecBtn?.addEventListener('click', () => {
            if (fontIdx > 0) {
                fontIdx--;
                htmlEl.setAttribute('data-font-size', fontSizes[fontIdx]);
                if (navigator.vibrate) navigator.vibrate(8);
            }
        });

        const speeds = [0.75, 1.0, 1.2];
        const speedLabels = ['0.75x 慢速', '1.0x 標準', '1.2x 極速'];
        let speedIdx = 1;
        speedBtn?.addEventListener('click', () => {
            speedIdx = (speedIdx + 1) % speeds.length;
            audioEngine.speechRate = speeds[speedIdx];
            speedBtn.querySelector('.speed-label').textContent = speedLabels[speedIdx];
            if (navigator.vibrate) navigator.vibrate(10);
        });
    }
});
