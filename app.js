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
        initCultureModule(curriculumData.culture_survival_module);
        initPhoneticsLabModule(curriculumData.phonetics_lab_module);
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

        // 1. Sub-navigation tabs switching
        const subNavButtons = document.querySelectorAll('.alphabet-sub-nav .sub-nav-btn');
        const subSections = {
            'all': document.getElementById('alpha-sec-all'),
            'vowels': document.getElementById('alpha-sec-vowels'),
            'consonants': document.getElementById('alpha-sec-consonants'),
            'digraphs': document.getElementById('alpha-sec-digraphs'),
            'syllables': document.getElementById('alpha-sec-syllables'),
            'stress': document.getElementById('alpha-sec-stress')
        };
        const quickTips = document.getElementById('alphabet-quick-tips');

        subNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                subNavButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetSub = btn.getAttribute('data-sub');

                Object.keys(subSections).forEach(k => {
                    if (subSections[k]) {
                        subSections[k].style.display = (k === targetSub) ? 'block' : 'none';
                    }
                });

                if (quickTips) {
                    quickTips.style.display = (targetSub === 'all' || targetSub === 'consonants') ? 'grid' : 'none';
                }

                if (navigator.vibrate) navigator.vibrate(10);
            });
        });

        // 2. Render 26 Letters with dedicated Indonesian Word Audio Triggers
        const alphabetContainer = document.getElementById('alphabet-grid-container');
        if (alphabetContainer && alphaModule.letters) {
            alphabetContainer.innerHTML = '';
            alphaModule.letters.forEach(item => {
                const card = document.createElement('div');
                card.className = 'letter-card';
                card.innerHTML = `
                    <div class="letter-card-top">
                        <div class="letter-title" title="點擊聽字母名 (${item.name})">${item.letter}</div>
                        <div class="letter-ipa">${item.ipa}</div>
                    </div>
                    <div class="letter-word-badge" title="點擊聽單字「${item.example}」印尼語發音">
                        <i class="fa-solid fa-volume-high"></i> <span class="letter-word">${item.example}</span>
                    </div>
                    <div class="letter-zh">${item.zh}</div>
                    ${item.note ? `<div class="letter-note">${item.note}</div>` : ''}
                    <div class="letter-card-actions">
                        <button class="letter-btn primary-btn play-word-btn" title="聽單字印尼文"><i class="fa-solid fa-volume-high"></i> 印尼音</button>
                        <button class="letter-btn play-bilingual-btn" title="中+印雙語"><i class="fa-solid fa-language"></i> 雙語</button>
                        <button class="letter-btn play-slow-btn" title="0.75x 慢速"><i class="fa-solid fa-turtle"></i> 慢速</button>
                    </div>
                `;

                // Title: speak letter name
                card.querySelector('.letter-title').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.name || item.letter, { lang: 'id' });
                });

                // Badge: speak pure Indonesian word
                card.querySelector('.letter-word-badge').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });

                // Play Word Button (Indonesian)
                card.querySelector('.play-word-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });

                // Bilingual Button
                card.querySelector('.play-bilingual-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speakBilingual(item.example, `${item.letter}，${item.zh}`);
                });

                // Slow Speed Button
                card.querySelector('.play-slow-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id', rate: 0.75 });
                });

                // Card background click
                card.addEventListener('click', () => {
                    audioEngine.speak(item.example, { lang: 'id' });
                });

                alphabetContainer.appendChild(card);
            });
        }

        // 3. Render Vowels Detail & Minimal Pairs
        const vowelsContainer = document.getElementById('vowels-detail-container');
        const minimalPairsContainer = document.getElementById('minimal-pairs-container');

        if (vowelsContainer && alphaModule.vowels_detail && alphaModule.vowels_detail.items) {
            vowelsContainer.innerHTML = '';
            alphaModule.vowels_detail.items.forEach(v => {
                const card = document.createElement('div');
                card.className = 'vowel-card';
                card.innerHTML = `
                    <div class="vowel-header">
                        <span class="vowel-symbol">${v.vowel}</span>
                        <span class="letter-ipa">${v.ipa}</span>
                    </div>
                    <div class="vowel-desc">${v.desc}</div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent); margin-bottom: 0.4rem;"><i class="fa-solid fa-volume-high"></i> 點擊單字聽印尼語發音：</div>
                    <div class="vowel-ex-list">
                        ${v.examples.map(ex => `<span class="vowel-ex-pill" data-word="${ex.id}" data-zh="${ex.zh}"><i class="fa-solid fa-volume-high"></i> ${ex.id} (${ex.zh})</span>`).join('')}
                    </div>
                `;
                card.querySelectorAll('.vowel-ex-pill').forEach(pill => {
                    pill.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const word = pill.getAttribute('data-word');
                        audioEngine.speak(word, { lang: 'id' });
                    });
                });
                vowelsContainer.appendChild(card);
            });
        }

        if (minimalPairsContainer && alphaModule.vowels_detail && alphaModule.vowels_detail.minimal_pairs) {
            minimalPairsContainer.innerHTML = '';
            alphaModule.vowels_detail.minimal_pairs.forEach(pair => {
                const card = document.createElement('div');
                card.className = 'minimal-pair-card';
                card.innerHTML = `
                    <div class="pair-row pair-1" title="點擊聽印尼語發音">
                        <strong><i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${pair.word1}</strong>
                        <span style="color: var(--text-muted);">${pair.meaning1}</span>
                    </div>
                    <div class="pair-row pair-2" title="點擊聽印尼語發音">
                        <strong><i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${pair.word2}</strong>
                        <span style="color: var(--text-muted);">${pair.meaning2}</span>
                    </div>
                    <div class="pair-tip"><i class="fa-solid fa-lightbulb"></i> ${pair.tip}</div>
                `;
                card.querySelector('.pair-1').addEventListener('click', () => {
                    const cleanWord = pair.word1.split(' (')[0];
                    audioEngine.speak(cleanWord, { lang: 'id' });
                });
                card.querySelector('.pair-2').addEventListener('click', () => {
                    const cleanWord = pair.word2.split(' (')[0];
                    audioEngine.speak(cleanWord, { lang: 'id' });
                });
                minimalPairsContainer.appendChild(card);
            });
        }

        // 4. Render Key Consonants
        const consonantsContainer = document.getElementById('key-consonants-container');
        if (consonantsContainer && alphaModule.key_consonants) {
            consonantsContainer.innerHTML = '';
            alphaModule.key_consonants.forEach(c => {
                const card = document.createElement('div');
                card.className = 'key-consonant-card';
                card.innerHTML = `
                    <div class="consonant-top">
                        <div class="consonant-badge">${c.combo}</div>
                        <div>
                            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);">${c.title}</h4>
                            <span class="letter-ipa">${c.ipa}</span>
                        </div>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">${c.desc}</p>
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent); margin-bottom: 0.5rem;"><i class="fa-solid fa-volume-high"></i> 示範單字 (點擊聽印尼文發音)：</div>
                    <div class="vowel-ex-list">
                        ${c.examples.map(ex => `<span class="vowel-ex-pill" data-word="${ex.id}" data-zh="${ex.zh}"><i class="fa-solid fa-volume-high"></i> ${ex.id} (${ex.zh})</span>`).join('')}
                    </div>
                `;
                card.querySelectorAll('.vowel-ex-pill').forEach(pill => {
                    pill.addEventListener('click', () => {
                        const word = pill.getAttribute('data-word');
                        audioEngine.speak(word, { lang: 'id' });
                    });
                });
                consonantsContainer.appendChild(card);
            });
        }

        // 5. Render Digraphs & Diphthongs
        const digraphsContainer = document.getElementById('digraphs-grid-container');
        const diphthongsContainer = document.getElementById('diphthongs-grid-container');

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
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.05rem; cursor: pointer;" class="digraph-word-target">
                        <i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${item.example} (${item.zh})
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">${item.note}</div>
                    <div class="letter-card-actions" style="margin-top: 0.8rem;">
                        <button class="letter-btn primary-btn play-digraph-id"><i class="fa-solid fa-volume-high"></i> 印尼音</button>
                        <button class="letter-btn play-digraph-bi"><i class="fa-solid fa-language"></i> 雙語</button>
                    </div>
                `;
                card.querySelector('.play-digraph-id').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                card.querySelector('.play-digraph-bi').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speakBilingual(item.example, `${item.combo}，${item.zh}`);
                });
                card.querySelector('.digraph-word-target').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                card.addEventListener('click', () => {
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                digraphsContainer.appendChild(card);
            });
        }

        if (diphthongsContainer && alphaModule.diphthongs) {
            diphthongsContainer.innerHTML = '';
            alphaModule.diphthongs.forEach(item => {
                const card = document.createElement('div');
                card.className = 'digraph-card';
                card.innerHTML = `
                    <div class="digraph-top">
                        <span class="digraph-combo">${item.combo}</span>
                        <span style="font-size: 0.8rem; background: var(--accent-light); color: var(--accent); padding: 0.1rem 0.5rem; border-radius: 4px;">雙母音</span>
                    </div>
                    <div style="font-weight: 700; color: var(--text-main); font-size: 1.05rem; cursor: pointer;" class="diphthong-word-target">
                        <i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${item.example} (${item.zh})
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">${item.note}</div>
                    <div class="letter-card-actions" style="margin-top: 0.8rem;">
                        <button class="letter-btn primary-btn play-diph-id"><i class="fa-solid fa-volume-high"></i> 印尼音</button>
                        <button class="letter-btn play-diph-bi"><i class="fa-solid fa-language"></i> 雙語</button>
                    </div>
                `;
                card.querySelector('.play-diph-id').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                card.querySelector('.play-diph-bi').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speakBilingual(item.example, `${item.combo}，${item.zh}`);
                });
                card.querySelector('.diphthong-word-target').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                card.addEventListener('click', () => {
                    audioEngine.speak(item.example, { lang: 'id' });
                });
                diphthongsContainer.appendChild(card);
            });
        }

        // 6. Render Syllable Matrix
        const syllableContainer = document.getElementById('syllable-matrix-container');
        if (syllableContainer && alphaModule.syllable_matrix) {
            syllableContainer.innerHTML = '';
            alphaModule.syllable_matrix.forEach(row => {
                const rowEl = document.createElement('div');
                rowEl.className = 'syllable-row';
                rowEl.innerHTML = `
                    <span class="syllable-consonant-tag">${row.consonant}</span>
                    <div class="syllable-pills-list">
                        ${row.syllables.map((syl, sIdx) => `
                            <button class="syllable-btn" data-syl="${syl}" data-ex="${row.examples[sIdx]}" title="聽音節與單字「${row.examples[sIdx]}」">
                                <i class="fa-solid fa-volume-high" style="font-size: 0.75rem; color: var(--accent); margin-right: 0.2rem;"></i><strong>${syl}</strong> <small style="color: var(--text-muted); font-size: 0.75rem;">(${row.examples[sIdx]})</small>
                            </button>
                        `).join('')}
                    </div>
                `;
                rowEl.querySelectorAll('.syllable-btn').forEach(sBtn => {
                    sBtn.addEventListener('click', () => {
                        const syl = sBtn.getAttribute('data-syl');
                        const ex = sBtn.getAttribute('data-ex');
                        audioEngine.speak(`${syl}... ${ex}`, { lang: 'id' });
                    });
                });
                syllableContainer.appendChild(rowEl);
            });
        }

        // 7. Render Stress Rules with Clickable Example Words
        const stressContainer = document.getElementById('stress-rules-container');
        if (stressContainer && alphaModule.syllable_patterns) {
            stressContainer.innerHTML = `
                <div class="tip-card highlight-box" style="margin-bottom: 1.5rem;">
                    <div class="tip-icon"><i class="fa-solid fa-music"></i></div>
                    <div>
                        <strong>倒數第二音節重音原則 (Penultimate Syllable Stress)</strong>
                        <p>印尼語的重音非常規律，絕大多數單字的重音落在「倒數第二個音節」上。點擊下列示範單字聆聽標準重音發音：</p>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.6rem;">
                            <button class="action-btn small" onclick="window.indoSpeakWord('saya')"><i class="fa-solid fa-volume-high"></i> sa-YA (我)</button>
                            <button class="action-btn small" onclick="window.indoSpeakWord('makan')"><i class="fa-solid fa-volume-high"></i> ma-KAN (吃)</button>
                            <button class="action-btn small" onclick="window.indoSpeakWord('belajar')"><i class="fa-solid fa-volume-high"></i> be-LA-jar (學習)</button>
                            <button class="action-btn small" onclick="window.indoSpeakWord('Indonesia')"><i class="fa-solid fa-volume-high"></i> In-do-NE-sia (印尼)</button>
                        </div>
                    </div>
                </div>
                <div style="background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                    <h4 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 1rem;"><i class="fa-solid fa-list-check"></i> 常見 6 大音節拼讀結構模式 (點擊單字聽讀音)：</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
                        ${alphaModule.syllable_patterns.patterns.map(p => `
                            <div style="background: var(--background); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                                    <strong style="color: var(--primary); font-size: 1.1rem;">${p.pattern}</strong>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">${p.desc}</span>
                                </div>
                                <div style="font-size: 0.88rem; color: var(--text-main); font-weight: 600; cursor: pointer;" onclick="window.indoSpeakWord('${p.example.split(' ')[0]}')">
                                    <i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.25rem;"></i>例詞：${p.example}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Global helper for single Indonesian word speech
    window.indoSpeakWord = (word) => {
        if (word) {
            audioEngine.speak(word, { lang: 'id' });
        }
    };

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
    // 8. 3D Flashcards & Vocab Module (4 Study Modes: Flip, Quiz, Auto-Play, Table)
    // ==========================================================================
    function initFlashcardModule(categories) {
        if (!categories || categories.length === 0) return;

        let currentCatIndex = 0;
        let currentCardIndex = 0;
        let currentWords = categories[0].words || [];
        let currentMode = 'flip'; // 'flip' | 'quiz' | 'autoplay' | 'table'

        // Auto-play state
        let isAutoPlaying = false;
        let autoPlayTimer = null;
        let autoPlayWordIndex = 0;

        // Quiz state
        let quizWord = null;
        let quizCorrectIndex = 0;
        let quizTotalAnswered = 0;
        let quizTotalCorrect = 0;

        // UI Elements
        const modeButtons = document.querySelectorAll('.vocab-mode-btn');
        const modeContainers = {
            'flip': document.getElementById('mode-flip-container'),
            'quiz': document.getElementById('mode-quiz-container'),
            'autoplay': document.getElementById('mode-autoplay-container'),
            'table': document.getElementById('mode-table-container')
        };

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

        // Mode Switching
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode');

                // Stop auto-play when switching out
                if (currentMode !== 'autoplay' && isAutoPlaying) {
                    stopAutoPlay();
                }

                Object.keys(modeContainers).forEach(m => {
                    if (modeContainers[m]) {
                        modeContainers[m].style.display = (m === currentMode) ? 'block' : 'none';
                    }
                });

                if (currentMode === 'quiz') {
                    loadQuizQuestion();
                } else if (currentMode === 'table') {
                    renderVocabTable();
                } else if (currentMode === 'autoplay') {
                    updateAutoPlayUIReady();
                }

                if (navigator.vibrate) navigator.vibrate(10);
            });
        });

        // Render Category Filter Pills
        if (catFiltersContainer) {
            catFiltersContainer.innerHTML = '';
            categories.forEach((cat, idx) => {
                const btn = document.createElement('button');
                btn.className = `cat-filter-btn ${idx === 0 ? 'active' : ''}`;
                btn.innerHTML = `<i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name} (${cat.words ? cat.words.length : 0})`;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentCatIndex = idx;
                    currentWords = categories[idx].words || [];
                    currentCardIndex = 0;
                    autoPlayWordIndex = 0;

                    if (isAutoPlaying) {
                        stopAutoPlay();
                    }

                    updateCardUI();
                    renderVocabTable();
                    if (currentMode === 'quiz') loadQuizQuestion();
                    if (currentMode === 'autoplay') updateAutoPlayUIReady();
                });
                catFiltersContainer.appendChild(btn);
            });
        }

        // ================= Mode 1: 3D Flip Card Logic =================
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

        // ================= Mode 2: Active Recall Quiz Logic =================
        const recallCatEl = document.getElementById('recall-quiz-cat');
        const recallAccuracyEl = document.getElementById('recall-accuracy');
        const recallWordIdEl = document.getElementById('recall-word-id');
        const recallListenBtn = document.getElementById('recall-listen-btn');
        const recallOptionsGrid = document.getElementById('recall-options-grid');
        const recallFeedbackEl = document.getElementById('recall-feedback');
        const recallNextBtn = document.getElementById('recall-next-btn');

        function loadQuizQuestion() {
            if (currentWords.length === 0) return;
            recallCatEl.textContent = categories[currentCatIndex].name.split(' (')[0];
            recallFeedbackEl.style.display = 'none';
            recallNextBtn.style.display = 'none';

            // Pick a word
            const randIdx = Math.floor(Math.random() * currentWords.length);
            quizWord = currentWords[randIdx];
            recallWordIdEl.textContent = quizWord.id_word;

            // Pick 3 distractors from all categories
            const allWords = categories.flatMap(c => c.words || []).filter(w => w.zh_word !== quizWord.zh_word);
            const distractors = [];
            while (distractors.length < 3 && allWords.length > 0) {
                const d = allWords[Math.floor(Math.random() * allWords.length)];
                if (!distractors.includes(d.zh_word)) {
                    distractors.push(d.zh_word);
                }
            }

            const options = [...distractors, quizWord.zh_word].sort(() => Math.random() - 0.5);
            quizCorrectIndex = options.indexOf(quizWord.zh_word);

            recallOptionsGrid.innerHTML = '';
            options.forEach((optZh, oIdx) => {
                const optBtn = document.createElement('button');
                optBtn.className = 'recall-opt-btn';
                optBtn.textContent = `${String.fromCharCode(65 + oIdx)}. ${optZh}`;
                optBtn.addEventListener('click', () => {
                    handleQuizAnswer(oIdx, optBtn);
                });
                recallOptionsGrid.appendChild(optBtn);
            });
        }

        function handleQuizAnswer(selectedIdx, btnEl) {
            quizTotalAnswered++;
            const isCorrect = (selectedIdx === quizCorrectIndex);

            recallOptionsGrid.querySelectorAll('.recall-opt-btn').forEach((b, idx) => {
                b.disabled = true;
                if (idx === quizCorrectIndex) b.classList.add('correct');
                else if (idx === selectedIdx && !isCorrect) b.classList.add('wrong');
            });

            if (isCorrect) {
                quizTotalCorrect++;
                addPoints(10);
                recallFeedbackEl.className = 'recall-feedback success';
                recallFeedbackEl.innerHTML = `🎉 <strong>答對了！(+10 XP)</strong> ${quizWord.id_word} = ${quizWord.zh_word}`;
            } else {
                recallFeedbackEl.className = 'recall-feedback error';
                recallFeedbackEl.innerHTML = `💡 <strong>記住了喔：</strong> ${quizWord.id_word} 的意思是「${quizWord.zh_word}」`;
            }

            recallFeedbackEl.style.display = 'block';
            recallNextBtn.style.display = 'inline-flex';

            const accRate = Math.round((quizTotalCorrect / quizTotalAnswered) * 100);
            recallAccuracyEl.textContent = `${accRate}% (${quizTotalCorrect}/${quizTotalAnswered})`;

            // Audio confirmation
            audioEngine.speakBilingual(quizWord.id_word, quizWord.zh_word);
        }

        recallListenBtn?.addEventListener('click', () => {
            if (quizWord) {
                audioEngine.speak(quizWord.id_word, { lang: 'id' });
            }
        });

        recallNextBtn?.addEventListener('click', () => {
            loadQuizQuestion();
        });

        // ================= Mode 3: Continuous Auto-Play Logic =================
        const autoplayToggleBtn = document.getElementById('autoplay-toggle-btn');
        const autoplayModeSelect = document.getElementById('autoplay-mode-select');
        const autoplayIntervalSelect = document.getElementById('autoplay-interval-select');
        const autoplayCurrentId = document.getElementById('autoplay-current-id');
        const autoplayCurrentZh = document.getElementById('autoplay-current-zh');
        const autoplayProgressFill = document.getElementById('autoplay-progress-fill');

        function updateAutoPlayUIReady() {
            if (currentWords.length > 0) {
                const w = currentWords[autoPlayWordIndex % currentWords.length];
                autoplayCurrentId.textContent = w.id_word;
                autoplayCurrentZh.textContent = w.zh_word;
                const progressPct = Math.round(((autoPlayWordIndex + 1) / currentWords.length) * 100);
                autoplayProgressFill.style.width = `${progressPct}%`;
            }
        }

        function stopAutoPlay() {
            isAutoPlaying = false;
            if (autoPlayTimer) clearTimeout(autoPlayTimer);
            audioEngine.stop();
            if (autoplayToggleBtn) {
                autoplayToggleBtn.classList.remove('playing');
                autoplayToggleBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>開始自動連續播放</span>`;
            }
        }

        async function stepAutoPlay() {
            if (!isAutoPlaying || currentWords.length === 0) return;

            const w = currentWords[autoPlayWordIndex];
            autoplayCurrentId.textContent = w.id_word;
            autoplayCurrentZh.textContent = w.zh_word;
            const progressPct = Math.round(((autoPlayWordIndex + 1) / currentWords.length) * 100);
            autoplayProgressFill.style.width = `${progressPct}%`;

            const playMode = autoplayModeSelect ? autoplayModeSelect.value : 'bilingual';
            const intervalMs = autoplayIntervalSelect ? parseInt(autoplayIntervalSelect.value, 10) : 2500;

            if (playMode === 'bilingual') {
                await audioEngine.speakBilingual(w.id_word, w.zh_word);
            } else {
                await audioEngine.speak(w.id_word, { lang: 'id' });
            }

            if (!isAutoPlaying) return;

            autoPlayTimer = setTimeout(() => {
                if (isAutoPlaying) {
                    autoPlayWordIndex = (autoPlayWordIndex + 1) % currentWords.length;
                    if (autoPlayWordIndex === 0) {
                        addPoints(15); // Bonus for finishing a full category
                    }
                    stepAutoPlay();
                }
            }, intervalMs);
        }

        autoplayToggleBtn?.addEventListener('click', () => {
            if (isAutoPlaying) {
                stopAutoPlay();
            } else {
                isAutoPlaying = true;
                autoplayToggleBtn.classList.add('playing');
                autoplayToggleBtn.innerHTML = `<i class="fa-solid fa-pause"></i> <span>暫停連續播放</span>`;
                stepAutoPlay();
            }
        });

        // ================= Mode 4: Table View Logic =================
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
                    <div style="display: flex; gap: 0.4rem;">
                        <button class="icon-action-btn bilingual-btn" title="中+印 雙語"><i class="fa-solid fa-language"></i></button>
                        <button class="icon-action-btn id-btn" title="純印尼語"><i class="fa-solid fa-volume-high"></i></button>
                    </div>
                `;
                row.querySelector('.bilingual-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speakBilingual(w.id_word, w.zh_word);
                });
                row.querySelector('.id-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(w.id_word, { lang: 'id' });
                });
                row.addEventListener('click', () => {
                    audioEngine.speakBilingual(w.id_word, w.zh_word);
                });
                vocabTableContainer.appendChild(row);
            });
        }

        document.getElementById('play-all-table-btn')?.addEventListener('click', () => {
            // Switch to autoplay mode
            document.querySelector('.vocab-mode-btn[data-mode="autoplay"]')?.click();
            autoPlayWordIndex = 0;
            if (!isAutoPlaying) {
                autoplayToggleBtn?.click();
            }
        });

        updateCardUI();
        renderVocabTable();
    }

    // ==========================================================================
    // 9. 30 Situational Modules & Dialogue Player (8 Category Filter Tabs)
    // ==========================================================================
    function initSituationalModule(modules) {
        if (!modules || modules.length === 0) return;

        let activeCategory = 'all';
        const gridContainer = document.getElementById('situational-grid-container');
        const categoryTabs = document.querySelectorAll('.situational-category-tabs .sit-cat-btn');

        function renderModulesGrid() {
            if (!gridContainer) return;
            gridContainer.innerHTML = '';

            const filteredModules = (activeCategory === 'all')
                ? modules
                : modules.filter(m => m.category === activeCategory);

            filteredModules.forEach(mod => {
                const card = document.createElement('div');
                card.className = 'module-card';
                card.innerHTML = `
                    <img src="${mod.image || 'assets/indo_hero_illustration_1787210889692.jpg'}" onerror="this.src='assets/indo_hero_illustration_1787210889692.jpg'" loading="lazy" class="module-card-img" alt="${mod.title}">
                    <div class="module-card-content">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                            <span class="module-loc-tag"><i class="fa-solid fa-location-dot"></i> ${mod.location || '印尼生活實境'}</span>
                            <span class="badge-pill" style="font-size: 0.72rem;">${mod.category ? mod.category.toUpperCase() : 'SITUASI'}</span>
                        </div>
                        <h3>${mod.title}</h3>
                        <p>${mod.subtitle}</p>
                        <button class="action-btn start-lesson-btn" data-mod-id="${mod.id}"><i class="fa-solid fa-play"></i> 進入實境</button>
                    </div>
                `;
                gridContainer.appendChild(card);
            });

            gridContainer.querySelectorAll('.start-lesson-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modId = e.currentTarget.getAttribute('data-mod-id');
                    const selectedMod = modules.find(m => m.id === modId);
                    if (selectedMod) {
                        openLesson(selectedMod);
                    }
                });
            });
        }

        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeCategory = tab.getAttribute('data-cat');
                renderModulesGrid();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });

        renderModulesGrid();

        function openLesson(mod) {
            audioEngine.stop();
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('lesson-view').classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            const heroImg = document.getElementById('current-lesson-img');
            if (heroImg) {
                heroImg.src = mod.image || 'assets/indo_hero_illustration_1787210889692.jpg';
                heroImg.onerror = function() {
                    this.src = 'assets/indo_hero_illustration_1787210889692.jpg';
                };
            }
            const subtitleEl = document.getElementById('current-lesson-subtitle');
            if (subtitleEl) subtitleEl.textContent = mod.subtitle || '體驗印尼現代生活情境與在地道地交流。';
            const catBadgeEl = document.getElementById('current-lesson-cat-badge');
            if (catBadgeEl) catBadgeEl.textContent = mod.category ? mod.category.toUpperCase() : 'SITUASI';

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
    // 11. Affixes & Bahasa Gaul Module (8 Roots & Interactive Gaul Decoder)
    // ==========================================================================
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
                    btn.textContent = `${item.root} (${item.root_zh || item.root})`;
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.root-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        renderDerivations(item);
                        if (navigator.vibrate) navigator.vibrate(10);
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
                            <span class="deriv-affix">${d.type || '+ 衍生詞綴'}</span>
                            <div class="deriv-word"><i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${d.word}</div>
                            <div class="deriv-meaning">${d.meaning}</div>
                            <div class="deriv-example" style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                                <div><strong>例句：</strong>${d.example}</div>
                                <div style="color: var(--text-light); font-size: 0.8rem;">${d.example_zh || ''}</div>
                            </div>
                        `;
                        card.addEventListener('click', () => {
                            audioEngine.speakBilingual(d.word, `${d.word}，${d.meaning}`);
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
                    pill.innerHTML = `
                        <div style="font-weight: 800; color: var(--primary); font-size: 1rem;">${r.prefix || r.rule}</div>
                        <div style="font-size: 0.88rem; color: var(--text-main); margin: 0.2rem 0;">${r.desc || r.rule}</div>
                        <div style="font-size: 0.8rem; color: var(--accent);"><i class="fa-solid fa-volume-high"></i> 例：${r.example}</div>
                    `;
                    pill.addEventListener('click', () => {
                        const cleanWord = r.example.split(' -> ')[1] || r.example;
                        audioEngine.speak(cleanWord.split(' (')[0], { lang: 'id' });
                    });
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
                        <div class="gaul-baku">正式 (Baku): ${item.baku}</div>
                        <div class="gaul-word"><i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${item.gaul}</div>
                        <div class="gaul-zh">${item.zh}</div>
                    `;
                    card.addEventListener('click', () => {
                        const cleanGaul = item.gaul.split(' / ')[0].split(' (')[0].replace('🔥', '').replace('🌾', '').trim();
                        audioEngine.speakBilingual(cleanGaul, item.zh);
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
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">${p.part || p.particle}</div>
                        <div style="font-size: 0.88rem; color: var(--text-main); margin: 0.2rem 0;">${p.usage}</div>
                        <div style="font-size: 0.8rem; color: var(--accent); cursor: pointer;"><i class="fa-solid fa-volume-high"></i> ${p.example}</div>
                    `;
                    div.addEventListener('click', () => {
                        audioEngine.speakBilingual(p.example, p.usage);
                    });
                    particlesContainer.appendChild(div);
                });
            }

            const chatSlangContainer = document.getElementById('chat-slang-container');
            const chatList = gaulMod.chat_abbreviations || gaulMod.chat_slang;
            if (chatSlangContainer && chatList) {
                chatSlangContainer.innerHTML = '';
                chatList.forEach(s => {
                    const div = document.createElement('div');
                    div.className = 'chat-slang-item';
                    div.innerHTML = `
                        <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">${s.abbr || s.slang}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${s.full}</div>
                        <div style="font-size: 0.9rem; font-weight: 600;">${s.zh}</div>
                    `;
                    div.addEventListener('click', () => {
                        audioEngine.speakBilingual(s.full, s.zh);
                    });
                    chatSlangContainer.appendChild(div);
                });
            }

            // Interactive Gaul Decoder
            const decoderContainer = document.getElementById('decoder-samples-container');
            if (decoderContainer && gaulMod.decoder_samples) {
                decoderContainer.innerHTML = '';
                gaulMod.decoder_samples.forEach(sample => {
                    const card = document.createElement('div');
                    card.className = 'decoder-card';
                    card.innerHTML = `
                        <div class="decoder-bubble-raw">
                            <i class="fa-brands fa-whatsapp"></i> <span>"${sample.chat_raw}"</span>
                        </div>
                        <div class="decoder-bubble-baku">
                            <strong style="color: var(--primary);">標準語 (Baku)：</strong>${sample.baku_id}
                        </div>
                        <div class="decoder-zh">
                            <strong>中文解析：</strong>${sample.zh}
                        </div>
                        <div style="margin-top: 0.6rem;">
                            <button class="action-btn small play-decoder-btn"><i class="fa-solid fa-volume-high"></i> 播放解析</button>
                        </div>
                    `;
                    card.querySelector('.play-decoder-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        audioEngine.speakBilingual(sample.baku_id, sample.zh);
                    });
                    card.addEventListener('click', () => {
                        audioEngine.speakBilingual(sample.baku_id, sample.zh);
                    });
                    decoderContainer.appendChild(card);
                });
            }
        }
    }

    // ==========================================================================
    // 12. Culture & Survival Guide Module
    // ==========================================================================
    function initCultureModule(cultureData) {
        if (!cultureData) return;

        const rulesContainer = document.getElementById('culture-rules-container');
        const hotlinesContainer = document.getElementById('emergency-hotlines-container');
        const phrasesContainer = document.getElementById('emergency-phrases-container');

        if (rulesContainer && cultureData.cultural_rules) {
            rulesContainer.innerHTML = '';
            cultureData.cultural_rules.forEach(rule => {
                const card = document.createElement('div');
                card.className = 'culture-rule-card';
                card.innerHTML = `
                    <div class="culture-rule-icon"><i class="fa-solid ${rule.icon}"></i></div>
                    <div class="culture-rule-body">
                        <h4>${rule.title}</h4>
                        <p>${rule.desc}</p>
                    </div>
                `;
                rulesContainer.appendChild(card);
            });
        }

        if (hotlinesContainer && cultureData.emergency_contacts) {
            hotlinesContainer.innerHTML = '';
            cultureData.emergency_contacts.forEach(contact => {
                const card = document.createElement('div');
                card.className = 'emergency-hotline-card';
                card.innerHTML = `
                    <i class="fa-solid ${contact.icon}" style="font-size: 1.8rem; color: var(--primary);"></i>
                    <div class="hotline-num">${contact.num}</div>
                    <strong style="font-size: 0.95rem; color: var(--text-main);">${contact.name}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">${contact.tip}</div>
                `;
                hotlinesContainer.appendChild(card);
            });
        }

        if (phrasesContainer && cultureData.emergency_phrases) {
            phrasesContainer.innerHTML = '';
            cultureData.emergency_phrases.forEach(phrase => {
                const card = document.createElement('div');
                card.className = 'emergency-phrase-card';
                card.innerHTML = `
                    <div>
                        <strong style="font-size: 1.05rem; color: var(--primary);"><i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.4rem;"></i>${phrase.id}</strong>
                        <div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.2rem;">${phrase.zh}</div>
                    </div>
                    <button class="action-btn small" style="background: var(--primary); flex-shrink: 0;"><i class="fa-solid fa-volume-high"></i> 呼救發音</button>
                `;
                card.addEventListener('click', () => {
                    audioEngine.speak(phrase.id, { lang: 'id' });
                });
                phrasesContainer.appendChild(card);
            });
        }
    }

    // ==========================================================================
    // 13. Phonetics Lab & Trill R Workout Module
    // ==========================================================================
    function initPhoneticsLabModule(phoneticsData) {
        if (!phoneticsData) return;

        const trillStepsContainer = document.getElementById('trill-steps-container');
        if (trillStepsContainer && phoneticsData.trill_r_steps) {
            trillStepsContainer.innerHTML = '';
            phoneticsData.trill_r_steps.forEach(step => {
                const card = document.createElement('div');
                card.className = 'trill-step-card';
                card.innerHTML = `
                    <div>
                        <div class="trill-step-title">${step.step}</div>
                        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">${step.desc}</p>
                    </div>
                    <button class="action-btn small trill-drill-btn"><i class="fa-solid fa-volume-high"></i> 聽示範 (${step.audio_drill.split('...')[0]})</button>
                `;
                card.querySelector('.trill-drill-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(step.audio_drill, { lang: 'id' });
                });
                card.addEventListener('click', () => {
                    audioEngine.speak(step.audio_drill, { lang: 'id' });
                });
                trillStepsContainer.appendChild(card);
            });
        }
    }

    // ==========================================================================
    // 14. Sentence Puzzle Game Lab
    // ==========================================================================
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
            badgeEl.textContent = `挑戰第 ${currentPuzzleIdx + 1} 題 / 共 ${puzzles.length} 題 (${p.category || '句型實戰'})`;
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
            const poolOptions = p.scrambled || p.options || p.correct_order;
            poolOptions.forEach((optWord) => {
                const countInSelected = selectedWords.filter(w => w === optWord).length;
                const countInPool = poolOptions.filter(w => w === optWord).length;
                const isUsed = countInSelected >= countInPool;

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
                feedbackEl.innerHTML = `🎉 <strong>答對了！恭喜！</strong> (+10 XP)<br><small style="color: var(--text-main); font-size: 1.1rem; font-weight: 800; cursor: pointer;" onclick="window.indoSpeakBilingual('${assembledSentence.replace(/'/g, "\\'")}', '${p.target_zh.replace(/'/g, "\\'")}')"><i class="fa-solid fa-volume-high"></i> ${assembledSentence}</small>`;
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
