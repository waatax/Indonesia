/**
 * Indo Learning Hub - Core Application Logic (v4.0)
 * BIPA-compliant, Dual-Language Audio & Interactive Learning Engine
 * Specially optimized for Beginners (小白), PC (FullHD/4K) & Mobile Portrait
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
            this.audioCache = new Map();
            this.currentAudio = null;
            this.preferNativeVoice = true; // 預設優先啟用原生印尼語音源，確保全平台百分之百真人道地發音

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
                return this.voices.find(v => {
                    const l = (v.lang || '').toLowerCase();
                    return l.includes('zh-tw') || l.includes('zh-hk') || l.includes('zh') || l.includes('cmn');
                }) || null;
            }
            if (langCode.startsWith('id') || langCode.startsWith('in')) {
                let voice = this.voices.find(v => {
                    const l = (v.lang || '').toLowerCase();
                    const n = (v.name || '').toLowerCase();
                    return l === 'id-id' || l === 'in-id' || l.startsWith('id_') || l.startsWith('in_') || n.includes('indonesia') || n.includes('indonesian');
                });
                if (!voice) {
                    voice = this.voices.find(v => {
                        const l = (v.lang || '').toLowerCase();
                        return l.startsWith('id') || l.startsWith('in');
                    });
                }
                if (!voice) {
                    voice = this.voices.find(v => (v.lang || '').toLowerCase().startsWith('ms'));
                }
                return voice || null;
            }
            return null;
        }

        hasIndonesianVoice() {
            return !!this.getVoice('id');
        }

        subscribe(listener) {
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        notifyState(state) {
            this.listeners.forEach(fn => fn(state));
        }

        /**
         * Cleans Indonesian text for clean pronunciation (過濾中文字、括號、特殊符號)
         */
        cleanIndoText(text) {
            if (!text) return '';
            let cleaned = String(text);
            cleaned = cleaned.replace(/\([^)]*\)/g, ' ');
            cleaned = cleaned.replace(/（[^）]*）/g, ' ');
            cleaned = cleaned.replace(/\[[^\]]*\]/g, ' ');
            cleaned = cleaned.replace(/【[^】]*】/g, ' ');
            cleaned = cleaned.replace(/[\u4e00-\u9fa5]/g, ' ');
            cleaned = cleaned.replace(/[，。！？；：（）「」『』、《》“”‘’…—\/]/g, ' ');
            cleaned = cleaned.replace(/\s+/g, ' ').trim();
            return cleaned;
        }

        stopCurrentAudio() {
            if (this.currentAudio) {
                try {
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio.onended = null;
                    this.currentAudio.onerror = null;
                } catch (e) {}
                this.currentAudio = null;
            }
        }

        /**
         * Plays authentic Indonesian audio via high-fidelity native audio stream
         * Google TTS native Indonesian endpoint - guarantees natural native pronunciation on ANY platform
         */
        speakOnlineAudio(cleanText, options = {}) {
            return new Promise((resolve) => {
                if (!cleanText) { resolve(); return; }

                this.stopCurrentAudio();
                if (this.synth) {
                    try { this.synth.cancel(); } catch (e) {}
                }

                // Chunk to 180 chars max for clean TTS URL
                const textChunk = cleanText.length > 180 ? cleanText.substring(0, 180) : cleanText;
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=${encodeURIComponent(textChunk)}`;

                let audio = this.audioCache.get(url);
                if (!audio) {
                    audio = new Audio(url);
                    this.audioCache.set(url, audio);
                }

                this.currentAudio = audio;
                try {
                    audio.currentTime = 0;
                } catch (e) {}

                audio.playbackRate = options.rate || this.speechRate;

                this.activeKey = options.key || cleanText;
                this.notifyState({ isPlaying: true, activeKey: this.activeKey });
                if (options.onStart) options.onStart();

                let isResolved = false;
                const finish = () => {
                    if (isResolved) return;
                    isResolved = true;
                    this.currentAudio = null;
                    this.notifyState({ isPlaying: false, activeKey: null });
                    if (options.onEnd) options.onEnd();
                    resolve();
                };

                audio.onended = finish;
                audio.onerror = (err) => {
                    console.warn('Native audio stream error, falling back to Web Speech API:', err);
                    this.speakWithSynth(cleanText, options).then(finish);
                };

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn('Audio play restricted or failed, falling back to Web Speech API:', err);
                        this.speakWithSynth(cleanText, options).then(finish);
                    });
                }
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            });
        }

        /**
         * Speaks using browser SpeechSynthesis (Local fallback)
         */
        speakWithSynth(rawText, options = {}) {
            return new Promise((resolve) => {
                if (!this.synth || !rawText) {
                    resolve();
                    return;
                }

                try {
                    if (this.synth.paused) this.synth.resume();
                    this.synth.cancel();
                } catch (e) {}

                const lang = options.lang || 'id';
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

                utterance.onerror = () => {
                    this.notifyState({ isPlaying: false, activeKey: null });
                    if (options.onEnd) options.onEnd();
                    resolve();
                };

                this.synth.speak(utterance);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
            });
        }

        /**
         * Universal Speak entry point
         * Intelligently selects between High-Fidelity Native Audio Stream and local SpeechSynthesis
         */
        speak(rawText, options = {}) {
            if (!rawText) return Promise.resolve();

            const lang = options.lang || 'id';

            // 中文朗讀一律採用 Web Speech API 中文音色
            if (lang === 'zh') {
                return this.speakWithSynth(rawText, options);
            }

            // 印尼文朗讀：
            // 優先使用高清晰印尼原生語音流，確保所有設備（包含無印尼語音包的 Windows/Android）發音極度標準道地
            const cleanText = this.cleanIndoText(rawText);
            if (!cleanText) return Promise.resolve();

            if (this.preferNativeVoice || !this.hasIndonesianVoice()) {
                return this.speakOnlineAudio(cleanText, options);
            } else {
                return this.speakWithSynth(cleanText, options);
            }
        }

        /**
         * Bilingual Dual-Language speech ("中+印" 雙語播放機制)
         * 先朗讀中文翻譯，自然微停頓 (350ms)，再以印尼原生真人發音朗讀印尼語！
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
            this.stopCurrentAudio();
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
        initBeginnerOnboarding();
        initSurvivalPhrases();
        initScenariosMasteryModule(curriculumData.scenarios_mastery);
        initCitiesExplorer(curriculumData.cities_guide);
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
        initVocab10kEngine();
        initPeribahasaModule(curriculumData.peribahasa_list);
        initEverydaySentencesModule(curriculumData.everyday_sentences);
        initDictionaryModal(curriculumData);
        initWordInspectionPopover();
        initHeaderControls();

        updateStatsUI();
    } catch (err) {
        console.error('Failed to load curriculum data:', err);
    }

    // ==========================================================================
    // 3. Navigation & Routing (Dual-Synced: Top Header Nav & Mobile Bottom Nav)
    // ==========================================================================
    function initNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn[data-target]');
        const drawerItemBtns = document.querySelectorAll('.drawer-item-btn');
        const views = document.querySelectorAll('.view');
        const moreDrawerModal = document.getElementById('more-modules-modal');
        const mobileMoreBtn = document.getElementById('mobile-more-btn');
        const closeMoreDrawerBtn = document.getElementById('close-more-modules-btn');

        function switchView(targetId) {
            if (!targetId) return;
            audioEngine.stop();

            // Hide popovers & modals
            document.getElementById('word-inspect-popover')?.style.setProperty('display', 'none');
            moreDrawerModal?.classList.remove('active');

            navBtns.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
            });
            mobileNavBtns.forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
            });
            views.forEach(view => {
                view.classList.toggle('active', view.id === targetId);
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (navigator.vibrate) navigator.vibrate(10);
        }

        // Global export for inline onclick
        window.indoSwitchView = switchView;

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.getAttribute('data-target')));
        });

        mobileNavBtns.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.getAttribute('data-target')));
        });

        drawerItemBtns.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.getAttribute('data-target')));
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

        // Mobile More Drawer
        mobileMoreBtn?.addEventListener('click', () => {
            moreDrawerModal?.classList.add('active');
        });
        closeMoreDrawerBtn?.addEventListener('click', () => {
            moreDrawerModal?.classList.remove('active');
        });
        moreDrawerModal?.addEventListener('click', (e) => {
            if (e.target === moreDrawerModal) moreDrawerModal.classList.remove('active');
        });
    }

    // ==========================================================================
    // 3.1. Beginner Onboarding Modal Logic
    // ==========================================================================
    function initBeginnerOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        const openBtn = document.getElementById('open-onboarding-btn');
        const closeBtn = document.getElementById('close-onboarding-btn');
        const startBtn = document.getElementById('start-learning-journey-btn');

        openBtn?.addEventListener('click', () => {
            modal?.classList.add('active');
        });
        closeBtn?.addEventListener('click', () => {
            modal?.classList.remove('active');
        });
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
        startBtn?.addEventListener('click', () => {
            modal?.classList.remove('active');
            window.indoSwitchView('alphabet-view');
            addPoints(10);
        });
    }

    // ==========================================================================
    // 3.2. Top 10 Survival Phrases Quick Bar
    // ==========================================================================
    function initSurvivalPhrases() {
        const container = document.getElementById('survival-chips-list');
        if (!container) return;

        const survivalList = [
            { id: "Terima kasih", zh: "謝謝" },
            { id: "Sama-sama", zh: "不客氣" },
            { id: "Selamat pagi", zh: "早安" },
            { id: "Permisi", zh: "借過/打擾一下" },
            { id: "Berapa harganya?", zh: "這個多少錢？" },
            { id: "Tolong!", zh: "救命/請幫忙" },
            { id: "Bisa bahasa Inggris?", zh: "會講英文嗎？" },
            { id: "Mau ini satu ya", zh: "我要這個一份" },
            { id: "Di mana toilet?", zh: "洗手間在哪？" },
            { id: "Sampai jumpa!", zh: "再見！" }
        ];

        container.innerHTML = '';
        survivalList.forEach(item => {
            const chip = document.createElement('button');
            chip.className = 'survival-chip';
            chip.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span>${item.id}</span> <span class="chip-zh">${item.zh}</span>`;
            chip.addEventListener('click', () => {
                audioEngine.speakBilingual(item.id, item.zh);
                addPoints(2);
            });
            container.appendChild(chip);
        });
    }

    // ==========================================================================
    // 3.5. 10 Major Cities & Islands Explorer (Peta 10 Kota Nusantara)
    // ==========================================================================
    function initCitiesExplorer(cities) {
        if (!cities || cities.length === 0) return;

        const tabsContainer = document.getElementById('cities-nav-tabs');
        const displayContainer = document.getElementById('city-detail-display');
        if (!tabsContainer || !displayContainer) return;

        let activeCity = cities[0];

        function renderCityDetail(city) {
            displayContainer.innerHTML = `
                <div class="jp-city-card">
                    <div class="jp-city-hero">
                        <div class="jp-city-img-wrapper">
                            <img src="${city.image}" class="jp-city-cover-img" alt="${city.name_zh}">
                            <div class="jp-city-badge-float">
                                <span class="jp-badge-tag"><i class="fa-solid fa-location-dot"></i> ${city.name_id}</span>
                            </div>
                        </div>

                        <div class="jp-city-header-body">
                            <div class="jp-city-title-row">
                                <div>
                                    <h3 class="jp-city-title">${city.name_zh} <span class="jp-city-subtitle">${city.name_id}</span></h3>
                                    <div class="jp-city-tagline"><i class="fa-solid fa-feather-pointed" style="color: var(--primary);"></i> ${city.tagline}</div>
                                </div>
                            </div>

                            <div class="jp-city-metrics-grid">
                                <div class="jp-metric-item">
                                    <span class="jp-metric-label"><i class="fa-solid fa-users"></i> 常住人口 (WIKI)</span>
                                    <strong class="jp-metric-val">${city.population}</strong>
                                </div>
                                <div class="jp-metric-item">
                                    <span class="jp-metric-label"><i class="fa-solid fa-landmark"></i> 行政區劃</span>
                                    <strong class="jp-metric-val">${city.province}</strong>
                                </div>
                            </div>

                            <div class="jp-geo-snippet">
                                <i class="fa-solid fa-compass" style="color: var(--accent); margin-right: 0.35rem;"></i>
                                <span><strong>地理氣候：</strong>${city.geography}</span>
                            </div>
                        </div>
                    </div>

                    <div class="jp-city-section">
                        <h4 class="jp-sec-title"><i class="fa-solid fa-book-open"></i> 地理人文與歷史脈絡 (Sejarah & Budaya)</h4>
                        <p class="jp-text-lead">${city.history_culture}</p>
                    </div>

                    <div class="jp-city-section">
                        <h4 class="jp-sec-title"><i class="fa-solid fa-map-location-dot"></i> 在地著名景點與地標景觀 (Destinasi Wisata Terkenal)</h4>
                        <div class="jp-destinations-grid">
                            ${city.destinations.map((dest, i) => `
                                <div class="jp-dest-card">
                                    <div class="jp-dest-num">0${i + 1}</div>
                                    <div class="jp-dest-content">
                                        <h5>${dest.name}</h5>
                                        <p>${dest.desc}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="jp-two-col-grid">
                        <div class="jp-food-card">
                            <h4 class="jp-sec-title" style="color: #e76f51;"><i class="fa-solid fa-utensils"></i> 在地必吃代表美食 (Kuliner Khas)</h4>
                            <p class="jp-food-list">${city.specialty_food}</p>
                        </div>
                        <div class="jp-funfact-card">
                            <h4 class="jp-sec-title" style="color: #2a9d8f;"><i class="fa-solid fa-lightbulb"></i> Wiki 趣味冷知識 (Tahukah Anda?)</h4>
                            <p class="jp-funfact-text">${city.fun_fact}</p>
                        </div>
                    </div>

                    <div class="jp-city-section" style="margin-bottom: 0;">
                        <h4 class="jp-sec-title"><i class="fa-solid fa-comments"></i> 在地常用方言社交金句 (點擊直接發音)</h4>
                        <div class="jp-phrases-container">
                            ${city.dialects_and_phrases.map(p => `
                                <div class="jp-phrase-row" data-phrase="${p.phrase}" data-zh="${p.zh}">
                                    <div class="jp-phrase-left">
                                        <button class="jp-phrase-speaker-btn" title="點擊發音"><i class="fa-solid fa-volume-high"></i></button>
                                        <div>
                                            <div class="jp-phrase-id">${p.phrase}</div>
                                            <div class="jp-phrase-zh">${p.zh}</div>
                                        </div>
                                    </div>
                                    <span class="jp-listen-tag">中+印雙語 <i class="fa-solid fa-headphones"></i></span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            displayContainer.querySelectorAll('.jp-phrase-row').forEach(row => {
                row.addEventListener('click', () => {
                    const phrase = row.getAttribute('data-phrase');
                    const zh = row.getAttribute('data-zh');
                    audioEngine.speakBilingual(phrase, zh);
                });
            });
        }

        tabsContainer.innerHTML = '';
        cities.forEach((city, idx) => {
            const btn = document.createElement('button');
            btn.className = `city-tab-btn ${idx === 0 ? 'active' : ''}`;
            btn.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${city.name_zh}</span> <small style="opacity: 0.75; font-size: 0.75rem; margin-left: 0.15rem;">${city.name_id.split(' ')[0]}</small>`;
            btn.addEventListener('click', () => {
                tabsContainer.querySelectorAll('.city-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCity = city;
                renderCityDetail(city);
                if (navigator.vibrate) navigator.vibrate(10);
            });
            tabsContainer.appendChild(btn);
        });

        renderCityDetail(activeCity);
    }

    // ==========================================================================
    // 4. Alphabet & Phonetics Module (With Sound Discrimination Quiz)
    // ==========================================================================
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
            'stress': document.getElementById('alpha-sec-stress'),
            'quiz': document.getElementById('alpha-sec-quiz')
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

                if (targetSub === 'quiz') {
                    loadSoundQuiz();
                }

                if (navigator.vibrate) navigator.vibrate(10);
            });
        });

        // 2. Render 26 Letters
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

                card.querySelector('.letter-title').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.name || item.letter, { lang: 'id' });
                });

                card.querySelector('.letter-word-badge').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });

                card.querySelector('.play-word-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id' });
                });

                card.querySelector('.play-bilingual-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speakBilingual(item.example, `${item.letter}，${item.zh}`);
                });

                card.querySelector('.play-slow-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(item.example, { lang: 'id', rate: 0.75 });
                });

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
                `;
                card.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.example, `${item.combo}，${item.zh}`);
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
                `;
                card.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.example, `${item.combo}，${item.zh}`);
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

        // 7. Stress Rules
        const stressContainer = document.getElementById('stress-rules-container');
        if (stressContainer && alphaModule.syllable_patterns) {
            stressContainer.innerHTML = `
                <div class="stress-rules-grid">
                    ${alphaModule.syllable_patterns.map(p => `
                        <div class="stress-card" onclick="window.indoSpeakWord('${p.example}')">
                            <span class="stress-badge">${p.type}</span>
                            <div class="stress-word"><i class="fa-solid fa-volume-high" style="color: var(--accent); margin-right: 0.3rem;"></i>${p.example}</div>
                            <div class="stress-breakdown">${p.breakdown} (${p.zh})</div>
                            <div class="stress-rule-text">${p.rule}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // 8. Sound Discrimination Quiz Engine
        const quizPlayBtn = document.getElementById('sound-quiz-play-btn');
        const quizOptionsContainer = document.getElementById('sound-quiz-options-container');
        const quizFeedbackEl = document.getElementById('sound-quiz-feedback');
        const quizNextBtn = document.getElementById('sound-quiz-next-btn');

        const soundQuestions = [
            {
                audio: "Cinta",
                correct: "Cinta (愛 - 字母 C 發 /tʃ/ 吃)",
                options: ["Cinta (愛 - 字母 C 發 /tʃ/ 吃)", "Sinta (女子名 - 字母 S 發 /s/)", "Kinta (地名 - 字母 K 發 /k/)", "Tinta (墨水)"],
                tip: "記住：印尼語字母 C 永遠讀作 /tʃ/（吃/七），絕不發 /k/ 或 /s/！"
            },
            {
                audio: "Bebek",
                correct: "Bebek (鴨子 - E taling 發清晰 /e/)",
                options: ["Bebek (鴨子 - E taling 發清晰 /e/)", "Bapak (先生 - A 發 /a/)", "Empat (四 - E pepet 發弱讀 /ə/)", "Besar (大)"],
                tip: "Bebek 的 E 是清晰強音 /e/（如英文 bed），字尾 K 為喉塞音。"
            },
            {
                audio: "Tidak",
                correct: "Tidak (不是/沒有 - 字尾 K 為喉塞音 /ʔ/)",
                options: ["Tidak (不是/沒有 - 字尾 K 為喉塞音 /ʔ/)", "Tidur (睡覺)", "Titik (點)", "Tiga (三)"],
                tip: "Tidak 結尾的 K 聲帶快速關閉不送氣，讀成 Ti-da'。"
            },
            {
                audio: "Rendang",
                correct: "Rendang (仁當牛肉 - 字母 R 舌尖彈舌)",
                options: ["Rendang (仁當牛肉 - 字母 R 舌尖彈舌)", "Lendang (不存在的單字)", "Gendang (印尼鼓)", "Renang (游泳)"],
                tip: "字母 R 在印尼語中為齒齦顫音 (Trill)，初學者可先以清脆「ㄌ」過渡。"
            }
        ];

        let currentSoundQIdx = 0;

        function loadSoundQuiz() {
            const q = soundQuestions[currentSoundQIdx % soundQuestions.length];
            quizFeedbackEl.style.display = 'none';
            quizNextBtn.style.display = 'none';
            quizOptionsContainer.innerHTML = '';

            q.options.forEach((opt, idx) => {
                const btn = document.createElement('button');
                btn.className = 'sound-opt-btn';
                btn.innerHTML = `<strong>${String.fromCharCode(65 + idx)}. ${opt.split(' (')[0]}</strong><span>(${opt.split(' (')[1] || ''}</span>`;
                btn.addEventListener('click', () => {
                    quizOptionsContainer.querySelectorAll('.sound-opt-btn').forEach(b => b.disabled = true);
                    if (opt === q.correct) {
                        btn.classList.add('correct');
                        quizFeedbackEl.className = 'sound-quiz-feedback';
                        quizFeedbackEl.style.background = 'var(--success-light)';
                        quizFeedbackEl.style.color = 'var(--success)';
                        quizFeedbackEl.innerHTML = `🎉 <strong>聽力太準了！(+10 XP)</strong> 💡 ${q.tip}`;
                        addPoints(10);
                    } else {
                        btn.classList.add('wrong');
                        quizFeedbackEl.className = 'sound-quiz-feedback';
                        quizFeedbackEl.style.background = 'var(--primary-light)';
                        quizFeedbackEl.style.color = 'var(--primary)';
                        quizFeedbackEl.innerHTML = `💡 <strong>再聽一次正確發音：</strong> 正確是「${q.correct}」。${q.tip}`;
                    }
                    quizFeedbackEl.style.display = 'block';
                    quizNextBtn.style.display = 'inline-flex';
                });
                quizOptionsContainer.appendChild(btn);
            });

            quizPlayBtn.onclick = () => {
                audioEngine.speak(q.audio, { lang: 'id' });
            };

            // Auto play audio once
            setTimeout(() => {
                audioEngine.speak(q.audio, { lang: 'id' });
            }, 300);
        }

        quizNextBtn?.addEventListener('click', () => {
            currentSoundQIdx++;
            loadSoundQuiz();
        });
    }

    // ==========================================================================
    // 5. Pronoun & Kinship Calculator (With Interactive Decision Matrix)
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

        // Interactive Kinship Decision Matrix
        const genderSel = document.getElementById('matrix-gender-select');
        const ageSel = document.getElementById('matrix-age-select');
        const contextSel = document.getElementById('matrix-context-select');
        const youValEl = document.getElementById('matrix-you-val');
        const youHintEl = document.getElementById('matrix-you-hint');
        const meValEl = document.getElementById('matrix-me-val');
        const meHintEl = document.getElementById('matrix-me-hint');
        const matrixSampleId = document.getElementById('matrix-sample-id');
        const matrixSampleZh = document.getElementById('matrix-sample-zh');
        const matrixPlayBtn = document.getElementById('matrix-play-btn');

        function updateMatrixCalculation() {
            const g = genderSel?.value || 'male';
            const a = ageSel?.value || 'peer';
            const c = contextSel?.value || 'daily';

            let you = "Mas";
            let youHint = "平輩男性大哥 (爪哇與全印尼通用)";
            let me = "Saya";
            let meHint = "我 (正式禮貌通用)";
            let sId = "Mas, mau pesan kopi satu ya.";
            let sZh = "大哥，我想點一杯咖啡。";

            if (a === 'elder') {
                if (g === 'male') {
                    you = "Bapak / Pak";
                    youHint = "先生 / 父親輩尊稱 (尊敬長輩必備)";
                    sId = "Selamat pagi Pak. Ada yang bisa saya bantu?";
                    sZh = "先生早安。有什麼我可以協助您的嗎？";
                } else {
                    you = "Ibu / Bu";
                    youHint = "女士 / 母親輩尊稱 (尊敬女性長輩)";
                    sId = "Permisi Bu, boleh tanya jalan ke Monas?";
                    sZh = "不好意思女士，請問去民族紀念碑怎麼走？";
                }
                me = "Saya";
                meHint = "我 (面對長輩切勿自稱 Aku 或 Gua)";
            } else if (a === 'peer') {
                if (c === 'formal') {
                    you = g === 'male' ? "Bapak" : "Ibu";
                    youHint = "商務正式場合稱呼對方";
                    me = "Saya";
                    sId = "Senang bertemu dengan Anda.";
                    sZh = "很高興能與您相會。";
                } else if (c === 'slang') {
                    you = "Lu / Bro";
                    youHint = "雅加達年輕人熟人私聊稱謂";
                    me = "Gua";
                    meHint = "我 (雅加達潮流口語)";
                    sId = "Lu lagi di mana, Bro? Gua otw nih.";
                    sZh = "兄弟你在哪？我正在路上了喔。";
                } else {
                    you = g === 'male' ? "Mas / Kakak" : "Mbak / Kakak";
                    youHint = g === 'male' ? "大哥/帥哥 (服務生/店員常用)" : "大姐/小姐 (店員常用)";
                    sId = `${you.split(' / ')[0]}, minta bonnya ya.`;
                    sZh = `${g === 'male' ? '大哥' : '大姐'}，請幫我結帳。`;
                }
            } else {
                // Younger
                you = "Adik / Dek";
                youHint = "晚輩 / 孩童稱謂";
                me = "Kakak";
                meHint = "哥哥/姊姊自稱";
                sId = "Halo Dek, mau makan apa?";
                sZh = "小朋友好，想吃什麼呀？";
            }

            if (youValEl) youValEl.textContent = you;
            if (youHintEl) youHintEl.textContent = youHint;
            if (meValEl) meValEl.textContent = me;
            if (meHintEl) meHintEl.textContent = meHint;
            if (matrixSampleId) matrixSampleId.textContent = sId;
            if (matrixSampleZh) matrixSampleZh.textContent = sZh;
        }

        genderSel?.addEventListener('change', updateMatrixCalculation);
        ageSel?.addEventListener('change', updateMatrixCalculation);
        contextSel?.addEventListener('change', updateMatrixCalculation);
        matrixPlayBtn?.addEventListener('click', () => {
            if (matrixSampleId && matrixSampleZh) {
                audioEngine.speakBilingual(matrixSampleId.textContent, matrixSampleZh.textContent);
            }
        });

        updateMatrixCalculation();
    }

    // ==========================================================================
    // 6. Grammar Module (With D-M Builder & Tidak vs Bukan Tester)
    // ==========================================================================
    function initGrammarModule(grammarList) {
        const container = document.getElementById('grammar-modules-container');
        if (!container || !grammarList) return;

        // 1. D-M Dynamic Builder
        const dmSamplesContainer = document.getElementById('dm-samples-pills');
        const dmVisualizerContainer = document.getElementById('dm-visualizer-box');

        const dmList = [
            { id: "Nasi Goreng", noun: "Nasi", nounZh: "飯 (核心名詞 D)", mod: "Goreng", modZh: "炒 (後置修飾 M)", zh: "炒飯" },
            { id: "Mobil Merah", noun: "Mobil", nounZh: "車 (核心名詞 D)", mod: "Merah", modZh: "紅色的 (後置修飾 M)", zh: "紅色的車" },
            { id: "Rumah Besar", noun: "Rumah", nounZh: "房子 (核心名詞 D)", mod: "Besar", modZh: "大 (後置修飾 M)", zh: "大房子" },
            { id: "Kopi Panas", noun: "Kopi", nounZh: "咖啡 (核心名詞 D)", mod: "Panas", modZh: "熱的 (後置修飾 M)", zh: "熱咖啡" },
            { id: "Baju Baru", noun: "Baju", nounZh: "衣服 (核心名詞 D)", mod: "Baru", modZh: "新 (後置修飾 M)", zh: "新衣服" }
        ];

        function renderDmItem(item) {
            dmVisualizerContainer.innerHTML = `
                <div class="dm-blocks-row">
                    <div class="dm-block-item" style="border-color: var(--primary);">
                        <div class="dm-block-role" style="color: var(--primary);">D (Diterangkan 被修飾核心)</div>
                        <div class="dm-block-word">${item.noun}</div>
                        <div class="dm-block-meaning">${item.nounZh}</div>
                    </div>
                    <div class="dm-arrow">+</div>
                    <div class="dm-block-item" style="border-color: var(--accent);">
                        <div class="dm-block-role" style="color: var(--accent);">M (Menerangkan 後置修飾)</div>
                        <div class="dm-block-word">${item.mod}</div>
                        <div class="dm-block-meaning">${item.modZh}</div>
                    </div>
                    <div class="dm-arrow">=</div>
                    <div class="dm-block-item" style="border-color: var(--success); background: var(--success-light);">
                        <div class="dm-block-role" style="color: var(--success);">印尼語合成詞</div>
                        <div class="dm-block-word">${item.id}</div>
                        <div class="dm-block-meaning">中文意：<strong>${item.zh}</strong></div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="action-btn small play-dm-audio-btn"><i class="fa-solid fa-volume-high"></i> 中+印雙語朗讀</button>
                </div>
            `;
            dmVisualizerContainer.querySelector('.play-dm-audio-btn')?.addEventListener('click', () => {
                audioEngine.speakBilingual(item.id, item.zh);
            });
        }

        if (dmSamplesContainer) {
            dmSamplesContainer.innerHTML = '';
            dmList.forEach((item, idx) => {
                const btn = document.createElement('button');
                btn.className = `dm-sample-btn ${idx === 0 ? 'active' : ''}`;
                btn.textContent = `${item.id} (${item.zh})`;
                btn.addEventListener('click', () => {
                    dmSamplesContainer.querySelectorAll('.dm-sample-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderDmItem(item);
                    if (navigator.vibrate) navigator.vibrate(10);
                });
                dmSamplesContainer.appendChild(btn);
            });
            renderDmItem(dmList[0]);
        }

        // 2. Tidak vs Bukan Tester
        const tbContainer = document.getElementById('tb-quiz-container');
        if (tbContainer) {
            const tbQuestions = [
                { sent: "Saya ___ lapar.", answer: "tidak", zh: "我（不）餓。 [lapar 為形容詞]", tip: "lapar (餓) 是形容詞，否定必須用 Tidak！" },
                { sent: "Ini ___ buku saya.", answer: "bukan", zh: "這（不是）我的書。 [buku 為名詞]", tip: "buku (書) 是名詞/物品，否定必須用 Bukan！" },
                { sent: "Dia ___ dokter.", answer: "bukan", zh: "他（不是）醫生。 [dokter 為身分名詞]", tip: "dokter (醫生) 是身份名詞，否定必須用 Bukan！" },
                { sent: "Mereka ___ mau makan.", answer: "tidak", zh: "他們（不）想吃。 [mau 為助動詞]", tip: "mau (想要) 是動詞，否定必須用 Tidak！" }
            ];

            tbContainer.innerHTML = '';
            tbQuestions.forEach(q => {
                const card = document.createElement('div');
                card.className = 'tb-quiz-item';
                card.innerHTML = `
                    <div class="tb-prompt">${q.sent}</div>
                    <div class="tb-prompt-zh">${q.zh}</div>
                    <div class="tb-btns-row">
                        <button class="tb-btn" data-choice="tidak">Tidak</button>
                        <button class="tb-btn" data-choice="bukan">Bukan</button>
                    </div>
                `;

                card.querySelectorAll('.tb-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const choice = btn.getAttribute('data-choice');
                        card.querySelectorAll('.tb-btn').forEach(b => b.classList.remove('correct', 'wrong'));
                        if (choice === q.answer) {
                            btn.classList.add('correct');
                            addPoints(5);
                        } else {
                            btn.classList.add('wrong');
                        }
                    });
                });

                tbContainer.appendChild(card);
            });
        }

        // 3. Grammar Accordion
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
                            <div class="example-card" data-ex-id="${ex.id_sent.replace(/"/g, '&quot;')}" data-ex-zh="${ex.zh_sent.replace(/"/g, '&quot;')}">
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

            card.innerHTML = `
                <div class="grammar-header">
                    <h3 class="grammar-title">${mod.title}</h3>
                    <span class="grammar-badge">${mod.badge}</span>
                </div>
                <div class="grammar-desc">${mod.description}</div>
                ${bodyHtml}
            `;

            card.querySelectorAll('.example-card').forEach(exCard => {
                exCard.addEventListener('click', () => {
                    const idSent = exCard.getAttribute('data-ex-id');
                    const zhSent = exCard.getAttribute('data-ex-zh');
                    audioEngine.speakBilingual(idSent, zhSent);
                });
            });

            container.appendChild(card);
        });
    }

    // Global helper for HTML onclick attributes
    window.indoSpeakBilingual = (idText, zhText) => {
        audioEngine.speakBilingual(idText, zhText);
    };

    window.indoSpeakWord = (word) => {
        audioEngine.speak(word, { lang: 'id' });
    };

    // ==========================================================================
    // 7. Numbers, Rupiah & Time System
    // ==========================================================================
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

        // Banknotes Visual Guide
        const banknotesContainer = document.getElementById('banknotes-grid-container');
        if (banknotesContainer) {
            const banknotes = [
                { val: 100000, label: "100.000 Rp", words: "Seratus ribu rupiah", cls: "banknote-100k", approx: "約 NT$ 200 (紅色大鈔)" },
                { val: 50000, label: "50.000 Rp", words: "Lima puluh ribu rupiah", cls: "banknote-50k", approx: "約 NT$ 100 (藍色大鈔)" },
                { val: 20000, label: "20.000 Rp", words: "Dua puluh ribu rupiah", cls: "banknote-20k", approx: "約 NT$ 40 (綠色紙鈔)" },
                { val: 10000, label: "10.000 Rp", words: "Sepuluh ribu rupiah", cls: "banknote-10k", approx: "約 NT$ 20 (紫色紙鈔)" },
                { val: 5000, label: "5.000 Rp", words: "Lima ribu rupiah", cls: "banknote-5k", approx: "約 NT$ 10 (棕黃小鈔)" },
                { val: 2000, label: "2.000 Rp", words: "Dua ribu rupiah", cls: "banknote-2k", approx: "約 NT$ 4 (灰色小鈔)" }
            ];

            banknotesContainer.innerHTML = '';
            banknotes.forEach(b => {
                const item = document.createElement('div');
                item.className = `banknote-item ${b.cls}`;
                item.innerHTML = `
                    <div class="banknote-amount">${b.label}</div>
                    <div class="banknote-words">${b.words}</div>
                    <span class="banknote-approx">${b.approx}</span>
                `;
                item.addEventListener('click', () => {
                    if (inputEl) {
                        inputEl.value = b.val;
                        updateRupiah();
                    }
                    audioEngine.speakBilingual(b.words, `${b.label}，${b.approx}`);
                    addPoints(2);
                });
                banknotesContainer.appendChild(item);
            });
        }

        // 4-Part Day Time Visualizer
        const clockContainer = document.getElementById('clock-segments-container');
        if (clockContainer) {
            const timeSegments = [
                { id: "Selamat Pagi", zh: "早安 (05:00 - 11:00)", icon: "🌅", desc: "清晨到接近正午" },
                { id: "Selamat Siang", zh: "午安 (11:00 - 15:00)", icon: "☀️", desc: "烈日正午到午後" },
                { id: "Selamat Sore", zh: "傍晚好 (15:00 - 18:30)", icon: "🌇", desc: "午後下班到日落" },
                { id: "Selamat Malam", zh: "晚安 (18:30 以後)", icon: "🌙", desc: "天黑入夜之後" }
            ];

            clockContainer.innerHTML = '';
            timeSegments.forEach(seg => {
                const card = document.createElement('div');
                card.className = 'time-segment-card';
                card.innerHTML = `
                    <div class="time-segment-icon">${seg.icon}</div>
                    <div class="time-segment-name">${seg.id}</div>
                    <div class="time-segment-hours">${seg.desc}</div>
                    <div class="time-segment-zh">${seg.zh}</div>
                `;
                card.addEventListener('click', () => {
                    audioEngine.speakBilingual(seg.id, seg.zh);
                });
                clockContainer.appendChild(card);
            });
        }

        // Numbers & Days Pills
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
    // 8. 3D Flashcards & Vocab Module (Keyboard Shortcuts & Swipe Gestures)
    // ==========================================================================
    function initFlashcardModule(categories) {
        if (!categories || categories.length === 0) return;

        let currentCatIndex = 0;
        let currentCardIndex = 0;
        let currentWords = categories[0].words || [];
        let currentMode = 'flip';

        let isAutoPlaying = false;
        let autoPlayTimer = null;
        let autoPlayWordIndex = 0;

        let quizWord = null;
        let quizCorrectIndex = 0;
        let quizTotalAnswered = 0;
        let quizTotalCorrect = 0;

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
        const cardSyllableId = document.getElementById('card-syllable-id');
        const cardWordZh = document.getElementById('card-word-zh');
        const cardExId = document.getElementById('card-ex-id');
        const cardExZh = document.getElementById('card-ex-zh');
        const cardIndexIndicator = document.getElementById('card-index-indicator');
        const vocabTableContainer = document.getElementById('vocab-table-container');
        const vocabCountBadge = document.getElementById('vocab-count-badge');

        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode');

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

        function createSyllables(word) {
            if (!word) return '';
            const parts = word.split(' ');
            return parts.map(p => {
                return p.replace(/([aeiouy])([^aeiouy\s]+)([aeiouy])/gi, '$1-$2$3');
            }).join(' · ');
        }

        function updateCardUI() {
            if (currentWords.length === 0) return;
            const w = currentWords[currentCardIndex];
            flashcard3d.classList.remove('flipped');
            cardCatTag.textContent = categories[currentCatIndex].name.split(' (')[0];
            cardWordId.textContent = w.id_word;
            if (cardSyllableId) cardSyllableId.textContent = w.syllables || createSyllables(w.id_word);
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

        function nextCard() {
            currentCardIndex = (currentCardIndex + 1) % currentWords.length;
            updateCardUI();
        }

        function prevCard() {
            currentCardIndex = (currentCardIndex - 1 + currentWords.length) % currentWords.length;
            updateCardUI();
        }

        document.getElementById('card-next-btn')?.addEventListener('click', nextCard);
        document.getElementById('card-prev-btn')?.addEventListener('click', prevCard);

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

        // Touch Swipe Navigation for Mobile Phones
        let touchStartX = 0;
        let touchEndX = 0;
        flashcard3d?.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        flashcard3d?.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 45) {
                if (diff < 0) nextCard();
                else prevCard();
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }, { passive: true });

        // PC Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // Only trigger if no input/modal is focused
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

            if (document.getElementById('flashcard-view')?.classList.contains('active')) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    flashcard3d?.classList.toggle('flipped');
                } else if (e.code === 'ArrowRight') {
                    e.preventDefault();
                    nextCard();
                } else if (e.code === 'ArrowLeft') {
                    e.preventDefault();
                    prevCard();
                } else if (e.code === 'KeyM') {
                    e.preventDefault();
                    document.getElementById('card-master-btn')?.click();
                } else if (e.code === 'KeyS') {
                    e.preventDefault();
                    document.getElementById('card-shuffle-btn')?.click();
                }
            }
        });

        // Mode 2: Active Recall Quiz
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

            const randIdx = Math.floor(Math.random() * currentWords.length);
            quizWord = currentWords[randIdx];
            recallWordIdEl.textContent = quizWord.id_word;

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

        function handleQuizAnswer(selectedIdx) {
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

        // Mode 3: Continuous Auto-Play
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
                        addPoints(15);
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

        // Mode 4: Table View
        function renderVocabTable() {
            if (!vocabTableContainer) return;
            if (vocabCountBadge) vocabCountBadge.textContent = `${currentWords.length} 個單字`;

            vocabTableContainer.innerHTML = `
                <table class="vocab-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>印尼文 (Indonesian)</th>
                            <th>中文釋義 (Chinese)</th>
                            <th>情境例句</th>
                            <th>發音</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentWords.map((w, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong style="color: var(--primary);">${w.id_word}</strong></td>
                                <td>${w.zh_word}</td>
                                <td>
                                    <div style="font-size: 0.85rem;">${w.example || '-'}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">${w.example_zh || ''}</div>
                                </td>
                                <td>
                                    <button class="icon-action-btn table-play-btn" data-word="${w.id_word}" data-zh="${w.zh_word}">
                                        <i class="fa-solid fa-volume-high"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            vocabTableContainer.querySelectorAll('.table-play-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idText = btn.getAttribute('data-word');
                    const zhText = btn.getAttribute('data-zh');
                    audioEngine.speakBilingual(idText, zhText);
                });
            });
        }

        document.getElementById('play-all-table-btn')?.addEventListener('click', () => {
            document.querySelector('.vocab-mode-btn[data-mode="autoplay"]')?.click();
        });

        updateCardUI();
    }

    // ==========================================================================
    // 9. Situational Modules & Lesson Detail (With Tap-to-Inspect & Nav)
    // ==========================================================================
    function initSituationalModule(modules) {
        if (!modules || modules.length === 0) return;

        let activeCategory = 'all';
        let currentLessonIndex = 0;
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
                    const idx = modules.findIndex(m => m.id === modId);
                    if (idx !== -1) {
                        currentLessonIndex = idx;
                        openLesson(modules[idx]);
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

            const sections = mod.dialogueSections && mod.dialogueSections.length > 0 
                ? mod.dialogueSections 
                : [{ id: 'd1', title: '標準情境會話', dialogue: mod.dialogue || [] }];

            let activeSection = sections[0];
            let isPlayingFull = false;
            let isPlayingMode = null;
            let isTranslationHidden = false;
            let fullPlayTimer = null;

            const tabsContainer = document.getElementById('dialogue-sections-tab-bar');
            const chatContainer = document.getElementById('dialogue-bubbles-container');
            const playBilingualBtn = document.getElementById('play-dialogue-bilingual-btn');
            const playIdBtn = document.getElementById('play-dialogue-id-btn');
            const toggleTransBtn = document.getElementById('toggle-dialogue-trans-btn');

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

            function wrapWordsInSpans(text) {
                if (!text) return '';
                return text.split(' ').map(w => {
                    const clean = w.replace(/[^a-zA-Z0-9-]/g, '');
                    return `<span class="inspectable-word" data-word="${clean}">${w}</span>`;
                }).join(' ');
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
                            <div class="chat-id">${wrapWordsInSpans(line.id_text)}</div>
                            <div class="chat-zh">${line.zh_text}</div>
                            <div class="chat-bubble-actions">
                                <button class="chat-play-btn" data-type="bilingual" data-idx="${idx}"><i class="fa-solid fa-language"></i> 雙語</button>
                                <button class="chat-play-btn" data-type="id" data-idx="${idx}"><i class="fa-solid fa-play"></i> 印尼音</button>
                                <button class="chat-play-btn" data-type="slow" data-idx="${idx}"><i class="fa-solid fa-turtle"></i> 0.75x 慢速</button>
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
                        } else if (type === 'slow') {
                            audioEngine.speak(line.id_text, {
                                lang: 'id',
                                rate: 0.75,
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

                // Inspectable word click
                chatContainer.querySelectorAll('.inspectable-word').forEach(span => {
                    span.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const word = span.getAttribute('data-word');
                        window.showWordInspectPopover(word, e.clientX, e.clientY);
                    });
                });
            }

            function highlightLine(idx) {
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
                playBilingualBtn?.classList.remove('playing');
                if (playBilingualBtn) playBilingualBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>中+印 雙語播放 (+20 XP)</span>`;
                playIdBtn?.classList.remove('playing');
                if (playIdBtn) playIdBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>純印尼語朗讀</span>`;
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

            if (playBilingualBtn) {
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
            }

            if (playIdBtn) {
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
            }

            if (toggleTransBtn) {
                toggleTransBtn.onclick = () => {
                    isTranslationHidden = !isTranslationHidden;
                    toggleTransBtn.innerHTML = isTranslationHidden 
                        ? `<i class="fa-solid fa-eye"></i> <span>顯示中文翻譯</span>`
                        : `<i class="fa-solid fa-eye-slash"></i> <span>隱藏中文翻譯 (聽力模式)</span>`;
                    document.querySelectorAll('.chat-bubble-wrapper').forEach(wrapper => {
                        wrapper.classList.toggle('hide-translation', isTranslationHidden);
                    });
                };
            }

            // Roleplay Quiz
            const quizContainer = document.getElementById('lesson-roleplay-card');
            const questionEl = document.getElementById('roleplay-question');
            const optionsContainer = document.getElementById('roleplay-options-container');
            const feedbackEl = document.getElementById('roleplay-feedback');

            if (mod.interactive_quiz && quizContainer) {
                quizContainer.style.display = 'block';
                if (feedbackEl) feedbackEl.style.display = 'none';
                if (questionEl) questionEl.textContent = mod.interactive_quiz.question;
                if (optionsContainer) optionsContainer.innerHTML = '';

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
                    optionsContainer?.appendChild(optBtn);
                });
            } else if (quizContainer) {
                quizContainer.style.display = 'none';
            }

            renderDialogueBubbles();
        }

        // Lesson Prev / Next Navigation
        document.getElementById('lesson-prev-btn')?.addEventListener('click', () => {
            if (modules.length > 0) {
                currentLessonIndex = (currentLessonIndex - 1 + modules.length) % modules.length;
                openLesson(modules[currentLessonIndex]);
            }
        });

        document.getElementById('lesson-next-btn')?.addEventListener('click', () => {
            if (modules.length > 0) {
                currentLessonIndex = (currentLessonIndex + 1) % modules.length;
                openLesson(modules[currentLessonIndex]);
            }
        });

        document.getElementById('back-to-modules-btn')?.addEventListener('click', () => {
            audioEngine.stop();
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('module-view').classList.add('active');
        });
    }

    // ==========================================================================
    // 9.5. Word Inspection Popover
    // ==========================================================================
    function initWordInspectionPopover() {
        const popover = document.getElementById('word-inspect-popover');
        const wordText = document.getElementById('popover-word-text');
        const zhText = document.getElementById('popover-zh-text');
        const playBtn = document.getElementById('popover-play-btn');
        const dictBtn = document.getElementById('popover-dict-btn');
        const closeBtn = document.getElementById('popover-close-btn');

        let currentInspectedWord = '';

        window.showWordInspectPopover = (rawWord, x, y) => {
            if (!rawWord || !popover) return;
            currentInspectedWord = rawWord;
            wordText.textContent = rawWord;

            // Search in vocab or dict
            let foundZh = "點擊聽標準發音";
            if (curriculumData && curriculumData.vocab_categories) {
                const allW = curriculumData.vocab_categories.flatMap(c => c.words || []);
                const match = allW.find(w => w.id_word.toLowerCase().includes(rawWord.toLowerCase()));
                if (match) {
                    foundZh = match.zh_word;
                }
            }
            zhText.textContent = foundZh;

            // Positioning
            const popoverWidth = 240;
            const popoverHeight = 120;
            let posX = Math.min(window.innerWidth - popoverWidth - 20, Math.max(20, x - 100));
            let posY = Math.min(window.innerHeight - popoverHeight - 20, Math.max(20, y + 20));

            popover.style.left = `${posX}px`;
            popover.style.top = `${posY}px`;
            popover.style.display = 'block';

            audioEngine.speak(rawWord, { lang: 'id' });
        };

        playBtn?.addEventListener('click', () => {
            if (currentInspectedWord) {
                audioEngine.speak(currentInspectedWord, { lang: 'id' });
            }
        });

        dictBtn?.addEventListener('click', () => {
            popover.style.display = 'none';
            document.getElementById('open-dict-btn')?.click();
            const searchInput = document.getElementById('dict-search-input');
            if (searchInput) {
                searchInput.value = currentInspectedWord;
                searchInput.dispatchEvent(new Event('input'));
            }
        });

        closeBtn?.addEventListener('click', () => {
            popover.style.display = 'none';
        });

        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !e.target.classList.contains('inspectable-word')) {
                popover.style.display = 'none';
            }
        });
    }

    // ==========================================================================
    // 10. Shadowing Engine & Self-Rating Evaluator
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
                alert('您的環境暫不支援語音辨識，請直接點擊下方「手動標記跟讀流利度」按鈕獲取經驗值！');
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

        // Self-rating fallback buttons
        document.querySelectorAll('.self-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const score = parseInt(btn.getAttribute('data-score'), 10);
                resultBox.style.display = 'block';
                scoreNum.textContent = `${score}%`;
                scoreFill.style.width = `${score}%`;
                if (score >= 80) {
                    scoreNum.style.color = 'var(--success)';
                    scoreFill.style.background = 'var(--success)';
                    feedbackMsg.innerHTML = `🎉 <strong>自我評定良好！</strong> 繼續保持！(+15 XP)`;
                    addPoints(15);
                } else {
                    scoreNum.style.color = 'var(--warning)';
                    scoreFill.style.background = 'var(--warning)';
                    feedbackMsg.innerHTML = `💪 <strong>熟能生巧！</strong> 多聽幾次慢速示範！(+5 XP)`;
                    addPoints(5);
                }
            });
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
    // 11. Affixes & Bahasa Gaul Module (With Interactive Affix Builder)
    // ==========================================================================
    function initAffixAndGaulModule(affixSys, gaulMod) {
        if (affixSys) {
            // Interactive Affix Dynamic Puzzle Builder
            const prefixChips = document.querySelectorAll('#affix-prefix-group .affix-chip');
            const rootChips = document.querySelectorAll('#affix-root-group .affix-chip');
            const suffixChips = document.querySelectorAll('#affix-suffix-group .affix-chip');
            const resWordEl = document.getElementById('puzzle-res-word');
            const resZhEl = document.getElementById('puzzle-res-zh');
            const resPlayBtn = document.getElementById('puzzle-res-play-btn');

            let activePrefix = 'meN-';
            let activeRoot = 'tulis';
            let activeSuffix = 'none';

            const affixCombinations = {
                'none+tulis+none': { word: 'Tulis', zh: '寫（基礎字根 Kata Dasar）' },
                'meN-+tulis+none': { word: 'Menulis', zh: '寫 / 著述（主動及物動詞）' },
                'meN-+tulis+-kan': { word: 'Menuliskan', zh: '為...寫下 / 記錄（使役與代受詞動詞）' },
                'di-+tulis+none': { word: 'Ditulis', zh: '被寫下（被動動詞）' },
                'di-+tulis+-kan': { word: 'Dituliskan', zh: '被記錄於 / 被寫給...（被動態）' },
                'peN-+tulis+none': { word: 'Penulis', zh: '作家 / 作者 / 筆者（人物名詞）' },
                'peN-+tulis+-an': { word: 'Penulisan', zh: '書寫過程 / 寫作手法（名詞）' },
                'none+tulis+-an': { word: 'Tulisan', zh: '文章 / 筆跡 / 書法（結果名詞）' },
                'none+tulis+-kan': { word: 'Tuliskan', zh: '請寫下 / 請記錄（祈使動詞）' },
                
                'none+ajar+none': { word: 'Ajar', zh: '教 / 學（基礎字根 Kata Dasar）' },
                'meN-+ajar+none': { word: 'Mengajar', zh: '教導 / 授課（主動動詞）' },
                'meN-+ajar+-kan': { word: 'Mengajarkan', zh: '傳授某門學問（使役動詞）' },
                'di-+ajar+none': { word: 'Diajar', zh: '被教導 / 受教（被動動詞）' },
                'di-+ajar+-kan': { word: 'Diajarkan', zh: '被傳授 / 被講授（被動態）' },
                'peN-+ajar+none': { word: 'Pengajar', zh: '教師 / 講師 / 教練（人物名詞）' },
                'peN-+ajar+-an': { word: 'Pengajaran', zh: '教學法 / 教導過程（抽象名詞）' },
                'none+ajar+-an': { word: 'Pelajaran / Ajaran', zh: '課程 / 教訓 / 教義（名詞）' },
                'none+ajar+-kan': { word: 'Ajarkan', zh: '請傳授給我（祈使動詞）' },

                'none+beli+none': { word: 'Beli', zh: '買（基礎字根 Kata Dasar）' },
                'meN-+beli+none': { word: 'Membeli', zh: '購買（主動及物動詞）' },
                'meN-+beli+-kan': { word: 'Membelikan', zh: '替...買東西 / 購置（受益動詞）' },
                'di-+beli+none': { word: 'Dibeli', zh: '被買走 / 被採購（被動動詞）' },
                'di-+beli+-kan': { word: 'Dibelikan', zh: '被買來送給...（被動態）' },
                'peN-+beli+none': { word: 'Pembeli', zh: '買家 / 顧客 / 消費者（人物名詞）' },
                'peN-+beli+-an': { word: 'Pembelian', zh: '採購活動 / 購買行為（名詞）' },
                'none+beli+-an': { word: 'Belian / Pembelian', zh: '買來的物品 / 採購（名詞）' },
                'none+beli+-kan': { word: 'Belikan', zh: '請幫我買...（祈使動詞）' },

                'none+makan+none': { word: 'Makan', zh: '吃（基礎字根 Kata Dasar）' },
                'meN-+makan+none': { word: 'Memakan', zh: '吞食 / 吃掉 / 耗費時間（主動動詞）' },
                'meN-+makan+-kan': { word: 'Memakankan', zh: '餵食 / 供食給...（使役動詞）' },
                'di-+makan+none': { word: 'Dimakan', zh: '被吃掉（被動動詞）' },
                'di-+makan+-kan': { word: 'Dimakankan', zh: '被拿去餵養（被動態）' },
                'peN-+makan+none': { word: 'Pemakan', zh: '食用者 / 愛吃者（如肉食/素食者）' },
                'peN-+makan+-an': { word: 'Pemakanan', zh: '飲食營養攝取（名詞）' },
                'none+makan+-an': { word: 'Makanan', zh: '食物 / 餐點 / 美食（結果名詞）' },
                'none+makan+-kan': { word: 'Makankan', zh: '拿去餵吧（祈使動詞）' }
            };

            function updateAffixPuzzle() {
                const key = `${activePrefix}+${activeRoot}+${activeSuffix}`;
                const matched = affixCombinations[key] || {
                    word: `${activePrefix === 'none' ? '' : activePrefix.replace('N-', 'n-')}${activeRoot}${activeSuffix === 'none' ? '' : activeSuffix.replace('-', '')}`,
                    zh: `衍生詞形 (${activeRoot})`
                };
                if (resWordEl) resWordEl.textContent = matched.word;
                if (resZhEl) resZhEl.textContent = matched.zh;
            }

            prefixChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    prefixChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    activePrefix = chip.getAttribute('data-val');
                    updateAffixPuzzle();
                });
            });

            rootChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    rootChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    activeRoot = chip.getAttribute('data-val');
                    updateAffixPuzzle();
                });
            });

            suffixChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    suffixChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    activeSuffix = chip.getAttribute('data-val');
                    updateAffixPuzzle();
                });
            });

            resPlayBtn?.addEventListener('click', () => {
                if (resWordEl && resZhEl) {
                    audioEngine.speakBilingual(resWordEl.textContent, resZhEl.textContent);
                }
            });

            updateAffixPuzzle();

            // Root buttons & derivations
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
    // 12. Culture & Survival Module
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
    // 13. Phonetics Lab & Trill R Workout (With 0.5x Slow Motion)
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
                    <div style="display: flex; gap: 0.4rem; margin-top: 1rem; flex-wrap: wrap;">
                        <button class="action-btn small trill-drill-slow-btn" style="background: var(--accent);"><i class="fa-solid fa-turtle"></i> 0.5x 慢速</button>
                        <button class="action-btn small trill-drill-btn"><i class="fa-solid fa-volume-high"></i> 1.0x 標準</button>
                    </div>
                `;
                card.querySelector('.trill-drill-slow-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(step.audio_drill, { lang: 'id', rate: 0.5 });
                });
                card.querySelector('.trill-drill-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    audioEngine.speak(step.audio_drill, { lang: 'id', rate: 1.0 });
                });
                card.addEventListener('click', () => {
                    audioEngine.speak(step.audio_drill, { lang: 'id' });
                });
                trillStepsContainer.appendChild(card);
            });
        }
    }

    // ==========================================================================
    // 14. Sentence Puzzle Game Lab (With Color Grammatical Tags)
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
                        audioEngine.speak(optWord, { lang: 'id' });
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
                feedbackEl.innerHTML = `
                    🎉 <strong>答對了！恭喜！</strong> (+10 XP)<br>
                    <div class="puzzle-res-speaker" style="margin-top: 0.4rem; color: var(--text-main); font-size: 1.1rem; font-weight: 800; cursor: pointer;">
                        <i class="fa-solid fa-volume-high"></i> ${assembledSentence}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">
                        💡 語法解析：${p.grammar_tip || 'SVO 標準主謂賓語序'}
                    </div>
                `;
                feedbackEl.querySelector('.puzzle-res-speaker')?.addEventListener('click', () => {
                    audioEngine.speakBilingual(assembledSentence, p.target_zh);
                });
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
    // 15. Instant Dictionary Search Modal (With Global Shortcut '/')
    // ==========================================================================
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

        // '/' shortcut to open search
        window.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                openBtn?.click();
            } else if (e.key === 'Escape' && modalEl.classList.contains('active')) {
                modalEl.classList.remove('active');
            }
        });

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                resultsContainer.innerHTML = '<p class="search-empty">請在上方輸入關鍵字開始檢索...</p>';
                return;
            }

            let matches = searchIndex.filter(item => 
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
                            zh_text: `${w.zh_word} [${w.pos}, ${w.level}]`,
                            type: `10K 詞庫 (Tier ${w.tier})`
                        });
                        if (vocab10kMatches.length >= 15) break;
                    }
                }
                matches = matches.concat(vocab10kMatches);
            }

            matches = matches.slice(0, 25);

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
    // 16. Header Controls (Theme, Font, Speed)
    // ==========================================================================
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

        // 頂部真人語音測試按鈕
        const audioTestBtn = document.getElementById('audio-test-btn');
        audioTestBtn?.addEventListener('click', () => {
            audioEngine.speak('Halo, selamat belajar bahasa Indonesia! Semua kosakata, peribahasa, dan percakapan siap didengarkan.', { lang: 'id' });
            if (navigator.vibrate) navigator.vibrate(15);
        });
    }

    // ==========================================================================
    // 7x7. 7 大生活與商務核心情境深度特訓 (Scenarios Mastery Module)
    // ==========================================================================
    function initScenariosMasteryModule(scenariosData) {
        if (!scenariosData || !scenariosData.length) return;

        let activeScenarioIndex = 0;
        let activeMode = 'cheat'; // 'cheat' | 'lesson' | 'dialogue' | 'flashcards' | 'tools' | 'quiz'
        let currentCardIndex = 0;
        let isCardFlipped = false;
        let isDialoguePlaying = false;
        let dialogueCancelToken = { cancelled: false };
        let scenarioSpeed = 1.0;
        let isBilingualEnabled = true;

        // Local storage key for mastered flashcards
        const STORAGE_KEY = 'indo_scenarios_mastered_cards_v1';
        let masteredCards = {};
        try {
            masteredCards = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            masteredCards = {};
        }

        // DOM elements
        const pillNav = document.getElementById('scenarios-pill-nav');
        const heroBanner = document.getElementById('scenario-hero-banner');
        const heroIcon = document.getElementById('scenario-hero-icon');
        const heroTag = document.getElementById('scenario-hero-tag');
        const heroIdTitle = document.getElementById('scenario-hero-id-title');
        const heroTitle = document.getElementById('scenario-hero-title');
        const heroSummary = document.getElementById('scenario-hero-summary');

        const modeTabs = document.querySelectorAll('.scenario-mode-tab');
        const panels = {
            cheat: document.getElementById('scenario-panel-cheat'),
            lesson: document.getElementById('scenario-panel-lesson'),
            dialogue: document.getElementById('scenario-panel-dialogue'),
            flashcards: document.getElementById('scenario-panel-flashcards'),
            tools: document.getElementById('scenario-panel-tools'),
            quiz: document.getElementById('scenario-panel-quiz')
        };

        const totalCardsEl = document.getElementById('scenarios-total-cards');
        const masteredCardsEl = document.getElementById('scenarios-mastered-cards');
        const speedBtn = document.getElementById('scenario-speed-btn');
        const speedLabel = document.getElementById('scenario-speed-label');
        const bilingualBtn = document.getElementById('scenario-bilingual-btn');
        const bilingualLabel = document.getElementById('scenario-bilingual-label');

        // Global jump handler for external buttons / banner links
        window.indoJumpScenario = (scenarioId, targetMode = 'cheat') => {
            const idx = scenariosData.findIndex(s => s.id === scenarioId);
            if (idx !== -1) {
                activeScenarioIndex = idx;
                activeMode = targetMode;
                currentCardIndex = 0;
                isCardFlipped = false;
                renderAll();
            }
            if (window.indoSwitchView) {
                window.indoSwitchView('scenarios-view');
            }
        };

        // Speed toggle in Scenarios view
        speedBtn?.addEventListener('click', () => {
            if (scenarioSpeed === 1.0) {
                scenarioSpeed = 0.8;
                speedLabel.textContent = '0.8x 慢速';
            } else if (scenarioSpeed === 0.8) {
                scenarioSpeed = 1.2;
                speedLabel.textContent = '1.2x 挑戰';
            } else {
                scenarioSpeed = 1.0;
                speedLabel.textContent = '1.0x 標準';
            }
            if (navigator.vibrate) navigator.vibrate(15);
        });

        // Bilingual toggle in Scenarios view
        bilingualBtn?.addEventListener('click', () => {
            isBilingualEnabled = !isBilingualEnabled;
            bilingualBtn.classList.toggle('active', isBilingualEnabled);
            bilingualLabel.textContent = isBilingualEnabled ? '中+印 雙語' : '純印尼語';
            if (navigator.vibrate) navigator.vibrate(15);
        });

        function updateMasteredCount() {
            let totalMastered = 0;
            let totalAvailable = 0;
            scenariosData.forEach(s => {
                totalAvailable += (s.flashcards || []).length;
                (s.flashcards || []).forEach(c => {
                    const key = `${s.id}_${c.id_word}`;
                    if (masteredCards[key]) totalMastered++;
                });
            });
            if (totalCardsEl) totalCardsEl.textContent = totalAvailable;
            if (masteredCardsEl) masteredCardsEl.textContent = totalMastered;
        }

        // Render Pill Navigation
        function renderPillNav() {
            if (!pillNav) return;
            pillNav.innerHTML = '';
            scenariosData.forEach((s, idx) => {
                const btn = document.createElement('button');
                btn.className = `scenario-pill-btn ${idx === activeScenarioIndex ? 'active' : ''}`;
                btn.innerHTML = `<i class="${s.icon}"></i> <span>${idx + 1}. ${s.title}</span>`;
                btn.addEventListener('click', () => {
                    if (activeScenarioIndex !== idx) {
                        activeScenarioIndex = idx;
                        currentCardIndex = 0;
                        isCardFlipped = false;
                        stopDialoguePlayback();
                        renderAll();
                        if (navigator.vibrate) navigator.vibrate(10);
                    }
                });
                pillNav.appendChild(btn);
            });
        }

        // Render Mode Tabs
        modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.getAttribute('data-mode');
                if (activeMode !== mode) {
                    activeMode = mode;
                    stopDialoguePlayback();
                    modeTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === mode));
                    Object.keys(panels).forEach(k => {
                        if (panels[k]) {
                            panels[k].style.display = k === mode ? 'block' : 'none';
                            panels[k].classList.toggle('active', k === mode);
                        }
                    });
                    if (navigator.vibrate) navigator.vibrate(10);
                }
            });
        });

        function renderHero() {
            const cur = scenariosData[activeScenarioIndex];
            if (!cur) return;
            if (heroBanner) heroBanner.style.setProperty('--scenario-theme', cur.theme_color || '#1D3557');
            if (heroIcon) heroIcon.innerHTML = `<i class="${cur.icon}"></i>`;
            if (heroTag) heroTag.textContent = cur.tag || '專題特訓';
            if (heroIdTitle) heroIdTitle.textContent = cur.title_id || '';
            if (heroTitle) heroTitle.textContent = `${activeScenarioIndex + 1}. ${cur.title}`;
            if (heroSummary) heroSummary.textContent = cur.summary || '';
        }

        // Mode 1: Fast Cheat Sheet
        const cheatGrid = document.getElementById('scenario-cheat-grid');
        const playAllCheatBtn = document.getElementById('scenario-play-all-cheat-btn');

        function renderCheatSheet() {
            if (!cheatGrid) return;
            const cur = scenariosData[activeScenarioIndex];
            const items = cur.fast_cheat_sheet || [];
            cheatGrid.innerHTML = '';

            items.forEach((item, idx) => {
                const card = document.createElement('div');
                card.className = 'cheat-phrase-card';
                card.innerHTML = `
                    <div class="cheat-card-top">
                        <span class="cheat-phrase-num">#${idx + 1}</span>
                        <div class="cheat-audio-btns">
                            <button class="icon-action-btn small" title="正常語速朗讀" data-action="normal"><i class="fa-solid fa-volume-high"></i></button>
                            <button class="icon-action-btn small" title="慢速朗讀 (0.8x)" data-action="slow"><i class="fa-solid fa-gauge"></i></button>
                            <button class="icon-action-btn small" title="雙語中印朗讀" data-action="bilingual"><i class="fa-solid fa-language"></i></button>
                        </div>
                    </div>
                    <div class="cheat-phrase-id">${item.id}</div>
                    <div class="cheat-phrase-syllable"><i class="fa-regular fa-comment-dots"></i> ${item.syllable || item.id}</div>
                    <div class="cheat-phrase-zh">${item.zh}</div>
                    <div class="cheat-phrase-breakdown"><i class="fa-solid fa-puzzle-piece"></i> ${item.breakdown || ''}</div>
                `;

                const normalBtn = card.querySelector('[data-action="normal"]');
                const slowBtn = card.querySelector('[data-action="slow"]');
                const biBtn = card.querySelector('[data-action="bilingual"]');

                normalBtn?.addEventListener('click', () => {
                    highlightActiveCard(card);
                    audioEngine.speak(item.audio_id || item.id, { lang: 'id', rate: scenarioSpeed });
                });
                slowBtn?.addEventListener('click', () => {
                    highlightActiveCard(card);
                    audioEngine.speak(item.audio_id || item.id, { lang: 'id', rate: 0.75 });
                });
                biBtn?.addEventListener('click', () => {
                    highlightActiveCard(card);
                    audioEngine.speakBilingual(item.audio_id || item.id, item.zh, { rate: scenarioSpeed });
                });

                cheatGrid.appendChild(card);
            });
        }

        function highlightActiveCard(el) {
            document.querySelectorAll('.cheat-phrase-card.playing').forEach(c => c.classList.remove('playing'));
            el.classList.add('playing');
            setTimeout(() => el.classList.remove('playing'), 2500);
        }

        playAllCheatBtn?.addEventListener('click', async () => {
            const cur = scenariosData[activeScenarioIndex];
            const items = cur.fast_cheat_sheet || [];
            if (!items.length) return;
            playAllCheatBtn.disabled = true;
            playAllCheatBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在連續播放...';

            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const cards = cheatGrid.querySelectorAll('.cheat-phrase-card');
                if (cards[i]) highlightActiveCard(cards[i]);
                if (isBilingualEnabled) {
                    await audioEngine.speakBilingual(it.audio_id || it.id, it.zh, { rate: scenarioSpeed });
                } else {
                    await audioEngine.speak(it.audio_id || it.id, { lang: 'id', rate: scenarioSpeed });
                }
                await new Promise(r => setTimeout(r, 600));
            }

            playAllCheatBtn.disabled = false;
            playAllCheatBtn.innerHTML = '<i class="fa-solid fa-headphones"></i> 連續聽讀所有金句';
        });

        // Mode 2: Deep Lessons
        const lessonsContainer = document.getElementById('scenario-lessons-container');
        function renderLessons() {
            if (!lessonsContainer) return;
            const cur = scenariosData[activeScenarioIndex];
            const lessons = cur.deep_lessons || [];
            lessonsContainer.innerHTML = '';

            lessons.forEach((l, idx) => {
                const box = document.createElement('div');
                box.className = 'deep-lesson-card';
                box.innerHTML = `
                    <div class="lesson-card-header">
                        <span class="lesson-num-badge"><i class="fa-solid fa-book-bookmark"></i> 單元 ${idx + 1}</span>
                        <h4>${l.topic}</h4>
                    </div>
                    <div class="lesson-card-body">
                        <p>${l.content.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
                lessonsContainer.appendChild(box);
            });
        }

        // Mode 3: Dialogue Role-Play
        const dialogueSelector = document.getElementById('scenario-dialogue-selector');
        const activeDialTitle = document.getElementById('active-dialogue-title');
        const activeDialDesc = document.getElementById('active-dialogue-desc');
        const dialogueBubbles = document.getElementById('scenario-dialogue-bubbles');
        const playFullDialogueBtn = document.getElementById('play-full-dialogue-btn');
        const stopDialogueBtn = document.getElementById('stop-dialogue-btn');
        let currentDialogueIndex = 0;

        function renderDialogue() {
            const cur = scenariosData[activeScenarioIndex];
            const dialogues = cur.dialogues || [];
            if (!dialogues.length) return;

            if (currentDialogueIndex >= dialogues.length) currentDialogueIndex = 0;

            if (dialogueSelector) {
                dialogueSelector.innerHTML = '';
                dialogues.forEach((d, idx) => {
                    const btn = document.createElement('button');
                    btn.className = `dialogue-tab-btn ${idx === currentDialogueIndex ? 'active' : ''}`;
                    btn.innerHTML = `<i class="fa-solid fa-comments"></i> <span>對話 ${idx + 1}</span>`;
                    btn.addEventListener('click', () => {
                        currentDialogueIndex = idx;
                        stopDialoguePlayback();
                        renderDialogue();
                    });
                    dialogueSelector.appendChild(btn);
                });
            }

            const activeD = dialogues[currentDialogueIndex];
            if (activeDialTitle) activeDialTitle.textContent = activeD.title;
            if (activeDialDesc) activeDialDesc.textContent = activeD.context;

            if (dialogueBubbles) {
                dialogueBubbles.innerHTML = '';
                activeD.lines.forEach((line, lineIdx) => {
                    const isLeft = lineIdx % 2 === 0;
                    const bubble = document.createElement('div');
                    bubble.className = `dialogue-bubble-row ${isLeft ? 'left' : 'right'}`;
                    bubble.id = `scenario-bubble-${lineIdx}`;
                    bubble.innerHTML = `
                        <div class="speaker-avatar" title="${line.role || line.speaker}">
                            ${line.speaker.slice(0, 2)}
                        </div>
                        <div class="bubble-content-wrap">
                            <div class="speaker-meta">
                                <strong class="speaker-name">${line.speaker}</strong>
                                <span class="speaker-role-tag">${line.role || ''}</span>
                            </div>
                            <div class="bubble-box">
                                <div class="bubble-id-text">${line.id_text}</div>
                                <div class="bubble-zh-text">${line.zh_text}</div>
                                <div class="bubble-audio-actions">
                                    <button class="bubble-audio-btn" title="聽朗讀"><i class="fa-solid fa-volume-high"></i></button>
                                    <button class="bubble-audio-btn slow" title="慢速朗讀"><i class="fa-solid fa-gauge"></i> 0.8x</button>
                                    <button class="bubble-audio-btn bilingual" title="中+印雙語"><i class="fa-solid fa-language"></i> 雙語</button>
                                </div>
                            </div>
                        </div>
                    `;

                    bubble.querySelector('.bubble-audio-btn:not(.slow):not(.bilingual)')?.addEventListener('click', () => {
                        highlightBubble(bubble);
                        audioEngine.speak(line.id_text, { lang: 'id', rate: scenarioSpeed });
                    });
                    bubble.querySelector('.bubble-audio-btn.slow')?.addEventListener('click', () => {
                        highlightBubble(bubble);
                        audioEngine.speak(line.id_text, { lang: 'id', rate: 0.75 });
                    });
                    bubble.querySelector('.bubble-audio-btn.bilingual')?.addEventListener('click', () => {
                        highlightBubble(bubble);
                        audioEngine.speakBilingual(line.id_text, line.zh_text, { rate: scenarioSpeed });
                    });

                    dialogueBubbles.appendChild(bubble);
                });
            }
        }

        function highlightBubble(b) {
            document.querySelectorAll('.dialogue-bubble-row.active-speaking').forEach(el => el.classList.remove('active-speaking'));
            b.classList.add('active-speaking');
            setTimeout(() => b.classList.remove('active-speaking'), 3500);
        }

        function stopDialoguePlayback() {
            if (isDialoguePlaying) {
                dialogueCancelToken.cancelled = true;
                audioEngine.stop();
                isDialoguePlaying = false;
                if (playFullDialogueBtn) playFullDialogueBtn.style.display = 'inline-flex';
                if (stopDialogueBtn) stopDialogueBtn.style.display = 'none';
                document.querySelectorAll('.dialogue-bubble-row.active-speaking').forEach(el => el.classList.remove('active-speaking'));
            }
        }

        playFullDialogueBtn?.addEventListener('click', async () => {
            const cur = scenariosData[activeScenarioIndex];
            const d = cur.dialogues?.[currentDialogueIndex];
            if (!d || !d.lines.length) return;

            stopDialoguePlayback();
            isDialoguePlaying = true;
            dialogueCancelToken = { cancelled: false };

            playFullDialogueBtn.style.display = 'none';
            if (stopDialogueBtn) stopDialogueBtn.style.display = 'inline-flex';

            for (let i = 0; i < d.lines.length; i++) {
                if (dialogueCancelToken.cancelled) break;
                const bubble = document.getElementById(`scenario-bubble-${i}`);
                if (bubble) {
                    highlightBubble(bubble);
                    bubble.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }

                const line = d.lines[i];
                if (isBilingualEnabled) {
                    await audioEngine.speakBilingual(line.id_text, line.zh_text, { rate: scenarioSpeed });
                } else {
                    await audioEngine.speak(line.id_text, { lang: 'id', rate: scenarioSpeed });
                }

                if (dialogueCancelToken.cancelled) break;
                await new Promise(r => setTimeout(r, 700));
            }

            stopDialoguePlayback();
        });

        stopDialogueBtn?.addEventListener('click', stopDialoguePlayback);

        // Mode 4: Specialized 3D Flashcards
        const flashcardEl = document.getElementById('scenario-flashcard-element');
        const cardCounter = document.getElementById('scenario-card-counter');
        const cardMasteredStatus = document.getElementById('scenario-card-mastered-status');
        const deckProgress = document.getElementById('scenario-deck-progress');
        const scCardTag = document.getElementById('sc-card-tag');
        const scCardId = document.getElementById('sc-card-id');
        const scCardSyllable = document.getElementById('sc-card-syllable');
        const scCardZh = document.getElementById('sc-card-zh');
        const scCardExId = document.getElementById('sc-card-ex-id');
        const scCardExZh = document.getElementById('sc-card-ex-zh');
        const scCardTip = document.getElementById('sc-card-tip');

        const scCardPlayAudio = document.getElementById('sc-card-play-audio');
        const scCardPlaySlow = document.getElementById('sc-card-play-slow');
        const scCardPlayBi = document.getElementById('sc-card-play-bilingual');
        const scCardPlayEx = document.getElementById('sc-card-play-ex');

        const scCardPrev = document.getElementById('sc-card-prev-btn');
        const scCardNext = document.getElementById('sc-card-next-btn');
        const scCardFlip = document.getElementById('sc-card-flip-btn');
        const scCardMaster = document.getElementById('sc-card-master-btn');
        const scCardShuffle = document.getElementById('sc-card-shuffle-btn');
        const scCardReset = document.getElementById('sc-card-reset-progress-btn');

        function renderFlashcard() {
            const cur = scenariosData[activeScenarioIndex];
            const cards = cur.flashcards || [];
            if (!cards.length) return;

            if (currentCardIndex < 0) currentCardIndex = cards.length - 1;
            if (currentCardIndex >= cards.length) currentCardIndex = 0;

            const c = cards[currentCardIndex];
            const cardKey = `${cur.id}_${c.id_word}`;
            const isMastered = !!masteredCards[cardKey];

            if (cardCounter) cardCounter.textContent = `${currentCardIndex + 1} / ${cards.length}`;
            if (deckProgress) deckProgress.style.width = `${((currentCardIndex + 1) / cards.length) * 100}%`;

            if (cardMasteredStatus) {
                cardMasteredStatus.textContent = isMastered ? '已掌握 ✅' : '記憶中 🧠';
                cardMasteredStatus.className = `mastered-tag ${isMastered ? 'mastered' : ''}`;
            }

            if (scCardMaster) {
                scCardMaster.innerHTML = isMastered ? '<i class="fa-solid fa-check-double"></i> 取消掌握' : '<i class="fa-solid fa-check"></i> 標記已掌握';
            }

            if (scCardTag) scCardTag.textContent = cur.title;
            if (scCardId) scCardId.textContent = c.id_word;
            if (scCardSyllable) scCardSyllable.textContent = c.syllable || c.id_word;
            if (scCardZh) scCardZh.textContent = c.zh_word;
            if (scCardExId) scCardExId.textContent = c.example || '';
            if (scCardExZh) scCardExZh.textContent = c.example_zh || '';
            if (scCardTip) scCardTip.textContent = c.tip || '點擊例句即可發音';

            // Reset flip state
            isCardFlipped = false;
            flashcardEl?.classList.remove('flipped');
        }

        flashcardEl?.addEventListener('click', (e) => {
            // Prevent flipping if clicked on audio button
            if (e.target.closest('button')) return;
            isCardFlipped = !isCardFlipped;
            flashcardEl.classList.toggle('flipped', isCardFlipped);
            if (navigator.vibrate) navigator.vibrate(10);
        });

        scCardFlip?.addEventListener('click', () => {
            isCardFlipped = !isCardFlipped;
            flashcardEl?.classList.toggle('flipped', isCardFlipped);
            if (navigator.vibrate) navigator.vibrate(10);
        });

        scCardNext?.addEventListener('click', () => {
            const cards = scenariosData[activeScenarioIndex].flashcards || [];
            currentCardIndex = (currentCardIndex + 1) % cards.length;
            renderFlashcard();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        scCardPrev?.addEventListener('click', () => {
            const cards = scenariosData[activeScenarioIndex].flashcards || [];
            currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
            renderFlashcard();
            if (navigator.vibrate) navigator.vibrate(10);
        });

        scCardShuffle?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            if (cur.flashcards) {
                cur.flashcards.sort(() => Math.random() - 0.5);
                currentCardIndex = 0;
                renderFlashcard();
                if (navigator.vibrate) navigator.vibrate(20);
            }
        });

        scCardMaster?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            const c = cur.flashcards[currentCardIndex];
            const cardKey = `${cur.id}_${c.id_word}`;
            if (masteredCards[cardKey]) {
                delete masteredCards[cardKey];
            } else {
                masteredCards[cardKey] = true;
                addPoints(10);
            }
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(masteredCards));
            } catch (e) {}
            updateMasteredCount();
            renderFlashcard();
        });

        scCardReset?.addEventListener('click', () => {
            if (confirm('確定要重置本主題的字卡掌握進度嗎？')) {
                const cur = scenariosData[activeScenarioIndex];
                (cur.flashcards || []).forEach(c => {
                    delete masteredCards[`${cur.id}_${c.id_word}`];
                });
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(masteredCards));
                } catch (e) {}
                updateMasteredCount();
                renderFlashcard();
            }
        });

        // Audio handlers for flashcard
        scCardPlayAudio?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            const c = cur.flashcards[currentCardIndex];
            if (c) audioEngine.speak(c.id_word, { lang: 'id', rate: scenarioSpeed });
        });

        scCardPlaySlow?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            const c = cur.flashcards[currentCardIndex];
            if (c) audioEngine.speak(c.id_word, { lang: 'id', rate: 0.75 });
        });

        scCardPlayBi?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            const c = cur.flashcards[currentCardIndex];
            if (c) audioEngine.speakBilingual(c.id_word, c.zh_word, { rate: scenarioSpeed });
        });

        scCardPlayEx?.addEventListener('click', () => {
            const cur = scenariosData[activeScenarioIndex];
            const c = cur.flashcards[currentCardIndex];
            if (c && c.example) audioEngine.speakBilingual(c.example, c.example_zh || c.example, { rate: scenarioSpeed });
        });

        // Mode 5: Interactive Tools
        const toolsContainer = document.getElementById('scenario-tools-container');

        function renderTools() {
            if (!toolsContainer) return;
            const cur = scenariosData[activeScenarioIndex];
            toolsContainer.innerHTML = '';

            if (cur.id === 'dates_and_duration') {
                // Stay Duration Sentence Builder
                const box = document.createElement('div');
                box.className = 'interactive-tool-box';
                box.innerHTML = `
                    <div class="tool-title-row">
                        <div class="tool-icon"><i class="fa-solid fa-plane-arrival"></i></div>
                        <div>
                            <h4>印尼居留時間句型速配器 (Stay Duration Sentence Builder)</h4>
                            <p>海關入境或與當地朋友聊天，選擇停留時間與目的，一鍵生成道地印尼句型並發音！</p>
                        </div>
                    </div>
                    <div class="tool-controls-grid">
                        <div class="tool-select-group">
                            <label>停留長度 (Durasi)：</label>
                            <select id="tool-duration-select" class="form-select">
                                <option value="tiga hari" data-zh="三天">3 天 (3 hari)</option>
                                <option value="satu minggu" data-zh="一週" selected>1 週 (1 minggu)</option>
                                <option value="dua minggu" data-zh="兩週">2 週 (2 minggu)</option>
                                <option value="satu bulan" data-zh="一個月">1 個月 (1 bulan)</option>
                                <option value="enam bulan" data-zh="半年">6 個月 (6 bulan)</option>
                                <option value="satu tahun" data-zh="一年">1 年 (1 tahun)</option>
                            </select>
                        </div>
                        <div class="tool-select-group">
                            <label>造訪目的 (Tujuan)：</label>
                            <select id="tool-purpose-select" class="form-select">
                                <option value="untuk wisata" data-zh="觀光旅遊" selected>觀光旅遊 (Wisata)</option>
                                <option value="untuk bisnis dan rapat" data-zh="商務會面與開會">商務會面 (Bisnis)</option>
                                <option value="untuk belajar bahasa Indonesia" data-zh="學習印尼語">語言學習 (Belajar)</option>
                                <option value="untuk mengunjungi teman" data-zh="拜訪朋友">探親訪友 (Kunjungan)</option>
                            </select>
                        </div>
                    </div>
                    <div class="tool-result-box">
                        <div class="tool-result-id" id="tool-duration-id-result">Saya akan tinggal di Indonesia selama satu minggu untuk wisata.</div>
                        <div class="tool-result-zh" id="tool-duration-zh-result">我將在印尼停留一週進行觀光旅遊。</div>
                        <div class="tool-result-actions">
                            <button class="action-btn primary small" id="tool-duration-play-btn"><i class="fa-solid fa-volume-high"></i> 播放發音</button>
                            <button class="action-btn secondary small" id="tool-duration-bi-btn"><i class="fa-solid fa-language"></i> 雙語朗讀</button>
                        </div>
                    </div>
                `;

                toolsContainer.appendChild(box);

                const durSelect = box.querySelector('#tool-duration-select');
                const purpSelect = box.querySelector('#tool-purpose-select');
                const idResult = box.querySelector('#tool-duration-id-result');
                const zhResult = box.querySelector('#tool-duration-zh-result');
                const playBtn = box.querySelector('#tool-duration-play-btn');
                const biBtn = box.querySelector('#tool-duration-bi-btn');

                function updateDurationSentence() {
                    const durVal = durSelect.value;
                    const durZh = durSelect.options[durSelect.selectedIndex].getAttribute('data-zh');
                    const purpVal = purpSelect.value;
                    const purpZh = purpSelect.options[durSelect.selectedIndex].getAttribute('data-zh');

                    const idText = `Saya akan tinggal di Indonesia selama ${durVal} ${purpVal}.`;
                    const zhText = `我將在印尼停留${durZh}進行${purpZh}。`;

                    idResult.textContent = idText;
                    zhResult.textContent = zhText;
                }

                durSelect.addEventListener('change', updateDurationSentence);
                purpSelect.addEventListener('change', updateDurationSentence);

                playBtn.addEventListener('click', () => {
                    audioEngine.speak(idResult.textContent, { lang: 'id', rate: scenarioSpeed });
                });
                biBtn.addEventListener('click', () => {
                    audioEngine.speakBilingual(idResult.textContent, zhResult.textContent, { rate: scenarioSpeed });
                });
            } else if (cur.id === 'pricing_and_bargaining') {
                // Bargaining Simulator
                const box = document.createElement('div');
                box.className = 'interactive-tool-box';
                box.innerHTML = `
                    <div class="tool-title-row">
                        <div class="tool-icon"><i class="fa-solid fa-handshake"></i></div>
                        <div>
                            <h4>傳統市場殺價實戰模擬器 (Bargaining Simulator)</h4>
                            <p>選擇心儀紀念品與攤商開價，選擇你的還價策略，即刻查看老闆心理反應與道地應答！</p>
                        </div>
                    </div>
                    <div class="tool-controls-grid">
                        <div class="tool-select-group">
                            <label>選購商品：</label>
                            <select id="tool-bargain-item" class="form-select">
                                <option value="Kemeja Batik" data-price="150000" selected>蠟染短袖襯衫 (開價 Rp 150.000)</option>
                                <option value="Kopi Luwak" data-price="200000">麝香貓咖啡豆 (開價 Rp 200.000)</option>
                                <option value="Tas Rotan Bali" data-price="120000">峇里島手工藤編包 (開價 Rp 120.000)</option>
                                <option value="Mangga Harum Manis 2kg" data-price="70000">香甜芒果 2 公斤 (開價 Rp 70.000)</option>
                            </select>
                        </div>
                        <div class="tool-select-group">
                            <label>殺價談判話術策略：</label>
                            <select id="tool-bargain-strategy" class="form-select">
                                <option value="soft" selected>溫和撒嬌型：Mahal banget, boleh kurang dikit dong ya?</option>
                                <option value="bulk">以量制價型：Kalau saya ambil dua buah, dapat diskon berapa?</option>
                                <option value="direct">直搗底價型：Pak, harga pasnya berapa?</option>
                            </select>
                        </div>
                    </div>
                    <div class="tool-result-box" id="tool-bargain-result-panel">
                        <div class="tool-result-id" id="tool-bargain-id-resp">Boleh deh Mas, buat penglaris saya kasih seratus dua puluh ribu ya (Rp 120.000)!</div>
                        <div class="tool-result-zh" id="tool-bargain-zh-resp">老闆笑著說：好啦看在開市好彩頭，算你十二萬盾成交！</div>
                        <div class="tool-result-actions">
                            <button class="action-btn primary small" id="tool-bargain-play-btn"><i class="fa-solid fa-volume-high"></i> 播放老闆回應發音</button>
                        </div>
                    </div>
                `;

                toolsContainer.appendChild(box);

                const itemSelect = box.querySelector('#tool-bargain-item');
                const stratSelect = box.querySelector('#tool-bargain-strategy');
                const idResp = box.querySelector('#tool-bargain-id-resp');
                const zhResp = box.querySelector('#tool-bargain-zh-resp');
                const playBtn = box.querySelector('#tool-bargain-play-btn');

                function updateBargainSimulator() {
                    const price = parseInt(itemSelect.options[itemSelect.selectedIndex].getAttribute('data-price'));
                    const strat = stratSelect.value;
                    let finalPrice = Math.round(price * 0.8 / 5000) * 5000;

                    if (strat === 'soft') {
                        idResp.textContent = `Aduh Mas, belum dapat untung. Tapi pasnya Rp ${finalPrice.toLocaleString('id-ID')} ya!`;
                        zhResp.textContent = `老闆笑道：哎呀這利潤很薄啦，不過底價算你 Rp ${finalPrice.toLocaleString('id-ID')} 成交！`;
                    } else if (strat === 'bulk') {
                        const doublePrice = Math.round(price * 1.5 / 5000) * 5000;
                        idResp.textContent = `Kalau ambil dua, saya kasih harga spesial Rp ${doublePrice.toLocaleString('id-ID')} saja!`;
                        zhResp.textContent = `老闆爽快答應：拿兩個算你批發特惠價 Rp ${doublePrice.toLocaleString('id-ID')}！`;
                    } else {
                        idResp.textContent = `Harga pasnya Rp ${finalPrice.toLocaleString('id-ID')}, ini sudah paling murah se-pasar!`;
                        zhResp.textContent = `老闆誠懇說：底價就是 Rp ${finalPrice.toLocaleString('id-ID')}，這已經是全市場最划算了！`;
                    }
                }

                itemSelect.addEventListener('change', updateBargainSimulator);
                stratSelect.addEventListener('change', updateBargainSimulator);

                playBtn.addEventListener('click', () => {
                    audioEngine.speak(idResp.textContent, { lang: 'id', rate: scenarioSpeed });
                });
            } else if (cur.id === 'numbers_and_currency') {
                // Rupiah converter
                const box = document.createElement('div');
                box.className = 'interactive-tool-box';
                box.innerHTML = `
                    <div class="tool-title-row">
                        <div class="tool-icon"><i class="fa-solid fa-coins"></i></div>
                        <div>
                            <h4>印尼盾 (Rupiah) 即時發音換算器</h4>
                            <p>輸入任意印尼盾金額，即刻生成大寫讀法音節，並點擊播放聽標準印尼發音：</p>
                        </div>
                    </div>
                    <div class="tool-input-wrap">
                        <span class="currency-prefix">Rp</span>
                        <input type="number" id="sc-tool-rupiah-input" value="75000" min="0" step="5000" class="form-input">
                        <button class="action-btn primary small" id="sc-tool-rupiah-convert-btn"><i class="fa-solid fa-wand-magic-sparkles"></i> 轉換讀音</button>
                    </div>
                    <div class="tool-result-box">
                        <div class="tool-result-id" id="sc-tool-rupiah-id">Tujuh puluh lima ribu rupiah</div>
                        <div class="tool-result-zh" id="sc-tool-rupiah-zh">七萬五千印尼盾 (約 NT$ 150)</div>
                        <div class="tool-result-actions">
                            <button class="action-btn primary small" id="sc-tool-rupiah-play-btn"><i class="fa-solid fa-volume-high"></i> 播放讀音</button>
                            <button class="action-btn secondary small" id="sc-tool-rupiah-bi-btn"><i class="fa-solid fa-language"></i> 雙語朗讀</button>
                        </div>
                    </div>
                `;

                toolsContainer.appendChild(box);

                const input = box.querySelector('#sc-tool-rupiah-input');
                const btn = box.querySelector('#sc-tool-rupiah-convert-btn');
                const idEl = box.querySelector('#sc-tool-rupiah-id');
                const zhEl = box.querySelector('#sc-tool-rupiah-zh');
                const playBtn = box.querySelector('#sc-tool-rupiah-play-btn');
                const biBtn = box.querySelector('#sc-tool-rupiah-bi-btn');

                function convertNumToWords(num) {
                    const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
                    if (num === 0) return 'nol';
                    if (num < 10) return units[num];
                    if (num === 10) return 'sepuluh';
                    if (num === 11) return 'sebelas';
                    if (num < 20) return units[num - 10] + ' belas';
                    if (num < 100) return units[Math.floor(num / 10)] + ' puluh' + (num % 10 ? ' ' + units[num % 10] : '');
                    if (num < 200) return 'seratus' + (num % 100 ? ' ' + convertNumToWords(num % 100) : '');
                    if (num < 1000) return units[Math.floor(num / 100)] + ' ratus' + (num % 100 ? ' ' + convertNumToWords(num % 100) : '');
                    if (num < 2000) return 'seribu' + (num % 1000 ? ' ' + convertNumToWords(num % 1000) : '');
                    if (num < 1000000) return convertNumToWords(Math.floor(num / 1000)) + ' ribu' + (num % 1000 ? ' ' + convertNumToWords(num % 1000) : '');
                    if (num < 1000000000) return convertNumToWords(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 ? ' ' + convertNumToWords(num % 1000000) : '');
                    return 'banyak sekali';
                }

                function doConvert() {
                    const val = parseInt(input.value) || 0;
                    const words = convertNumToWords(val) + ' rupiah';
                    const nt = Math.round(val / 500);
                    idEl.textContent = words.charAt(0).toUpperCase() + words.slice(1);
                    zhEl.textContent = `${val.toLocaleString('zh-TW')} 印尼盾 (約 NT$ ${nt.toLocaleString('zh-TW')})`;
                }

                btn.addEventListener('click', doConvert);
                input.addEventListener('input', doConvert);

                playBtn.addEventListener('click', () => {
                    audioEngine.speak(idEl.textContent, { lang: 'id', rate: scenarioSpeed });
                });
                biBtn.addEventListener('click', () => {
                    audioEngine.speakBilingual(idEl.textContent, zhEl.textContent, { rate: scenarioSpeed });
                });
            } else {
                // Generic cultural facts tool
                const box = document.createElement('div');
                box.className = 'interactive-tool-box';
                box.innerHTML = `
                    <div class="tool-title-row">
                        <div class="tool-icon"><i class="fa-solid fa-lightbulb"></i></div>
                        <div>
                            <h4>${cur.title} 核心關鍵小叮嚀</h4>
                            <p>掌握本主題的精髓要訣，讓您的印尼語溝通如同當地人般自然！</p>
                        </div>
                    </div>
                    <div class="tool-tips-list">
                        ${(cur.deep_lessons || []).map((l, i) => `
                            <div class="tip-row-item">
                                <strong><i class="fa-solid fa-check" style="color: var(--success);"></i> ${l.topic}</strong>
                                <p>${l.content}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
                toolsContainer.appendChild(box);
            }
        }

        // Mode 6: Quiz
        const quizBox = document.getElementById('scenario-quiz-box');
        const qNum = document.getElementById('sc-quiz-num');
        const qText = document.getElementById('sc-quiz-question');
        const qOptions = document.getElementById('sc-quiz-options');
        const qFeedback = document.getElementById('sc-quiz-feedback');
        const qNextBtn = document.getElementById('sc-quiz-next-btn');
        let currentQuizIdx = 0;
        let isQuizAnswered = false;

        function renderQuiz() {
            const cur = scenariosData[activeScenarioIndex];
            const quizList = cur.quiz_items || [];
            if (!quizList.length) return;

            if (currentQuizIdx >= quizList.length) currentQuizIdx = 0;
            const q = quizList[currentQuizIdx];
            isQuizAnswered = false;

            if (qNum) qNum.textContent = `題目 ${currentQuizIdx + 1} / ${quizList.length}`;
            if (qText) qText.textContent = q.q;

            if (qFeedback) qFeedback.style.display = 'none';
            if (qNextBtn) qNextBtn.style.display = 'none';

            if (qOptions) {
                qOptions.innerHTML = '';
                q.options.forEach((opt, optIdx) => {
                    const btn = document.createElement('button');
                    btn.className = 'quiz-option-btn';
                    btn.innerHTML = `<span class="opt-letter">${String.fromCharCode(65 + optIdx)}</span> <span>${opt}</span>`;

                    btn.addEventListener('click', () => {
                        if (isQuizAnswered) return;
                        isQuizAnswered = true;

                        const isCorrect = optIdx === q.answer;
                        btn.classList.add(isCorrect ? 'correct' : 'wrong');

                        if (!isCorrect) {
                            const correctBtn = qOptions.children[q.answer];
                            if (correctBtn) correctBtn.classList.add('correct');
                        }

                        if (qFeedback) {
                            qFeedback.style.display = 'block';
                            qFeedback.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'wrong'}`;
                            qFeedback.innerHTML = `
                                <strong>${isCorrect ? '🎉 答對了！+20 XP' : '💡 再接再厲！'}</strong>
                                <p>${q.explanation || ''}</p>
                            `;
                        }

                        if (isCorrect) {
                            addPoints(20);
                        }

                        if (qNextBtn) {
                            qNextBtn.style.display = 'inline-flex';
                            qNextBtn.textContent = currentQuizIdx < quizList.length - 1 ? '下一題' : '重新測驗';
                        }
                    });

                    qOptions.appendChild(btn);
                });
            }
        }

        qNextBtn?.addEventListener('click', () => {
            const quizList = scenariosData[activeScenarioIndex].quiz_items || [];
            currentQuizIdx = (currentQuizIdx + 1) % quizList.length;
            renderQuiz();
        });

        // Master Render Function
        function renderAll() {
            renderPillNav();
            renderHero();
            renderCheatSheet();
            renderLessons();
            renderDialogue();
            renderFlashcard();
            renderTools();
            renderQuiz();
            updateMasteredCount();
        }

        // Initialize!
        renderAll();
    }


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
        displayContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary); margin-bottom: 1rem;"></i>
                <p>正在載入 10,000 詞權威分級字庫數據，請稍候...</p>
            </div>
        `;

        try {
            const res = await fetch('data_vocab_10k.json');
            vocab10kList = await res.json();
            window.allVocab10k = vocab10kList;
        } catch (e) {
            console.error('Failed to load data_vocab_10k.json:', e);
            displayContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--primary); grid-column: 1 / -1;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>無法讀取 10,000 詞庫數據，請重新整理頁面。</p>
                </div>
            `;
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
                    ? `(第 ${currentPage} / ${totalPages} 頁 · 顯示 ${startIdx + 1}-${endIdx} 詞)`
                    : `(無匹配詞彙)`;
            }

            // Render items
            if (pageItems.length === 0) {
                displayContainer.className = 'vocab-cards-grid';
                displayContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); grid-column: 1 / -1; background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-magnifying-glass" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 0.8rem;"></i>
                        <h4 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 0.5rem;">未找到符合篩選條件的單字</h4>
                        <p style="font-size: 0.9rem;">請嘗試調整詞性篩選、更換分級階梯或清除關鍵字搜尋。</p>
                    </div>
                `;
            } else if (viewMode === 'card') {
                displayContainer.className = 'vocab-cards-grid';
                displayContainer.innerHTML = pageItems.map(item => {
                    const isMastered = userStats.masteredWords.includes(item.id_word);
                    return `
                        <div class="vocab-card" data-id="${item.id}" data-word="${escapeHtml(item.id_word)}">
                            <div class="vocab-card-top">
                                <div>
                                    <div class="vocab-card-word">${escapeHtml(item.id_word)}</div>
                                    <div class="vocab-card-syllables">${escapeHtml(item.syllables || '')}</div>
                                </div>
                                <div class="vocab-card-actions">
                                    <button class="vocab-audio-btn play-id-btn" title="朗讀印尼語"><i class="fa-solid fa-volume-high"></i></button>
                                    <button class="vocab-audio-btn play-bi-btn" title="中印雙語朗讀"><i class="fa-solid fa-language"></i></button>
                                </div>
                            </div>
                            <div class="vocab-card-badges">
                                <span class="tag-pos">${escapeHtml(item.pos)}</span>
                                <span class="tag-tier">Tier ${item.tier}</span>
                                <span class="tag-level">${escapeHtml(item.level)}</span>
                            </div>
                            <div class="vocab-card-zh">${escapeHtml(item.zh_word)}</div>
                            ${item.example ? `
                            <div class="vocab-card-example">
                                <div class="ex-id-text">
                                    <span>${escapeHtml(item.example)}</span>
                                    <button class="vocab-audio-btn play-ex-btn" style="width: 24px; height: 24px; font-size: 0.65rem;" title="朗讀例句"><i class="fa-solid fa-volume-high"></i></button>
                                </div>
                                <div class="ex-zh-text">${escapeHtml(item.example_zh || '')}</div>
                            </div>` : ''}
                            <div class="vocab-card-footer">
                                <button class="master-toggle-btn ${isMastered ? 'mastered' : ''}" data-word="${escapeHtml(item.id_word)}">
                                    <i class="fa-${isMastered ? 'solid' : 'regular'} fa-circle-check"></i> ${isMastered ? '已掌握' : '標記掌握 (+5 XP)'}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                // Table mode
                displayContainer.className = 'vocab-table-container';
                displayContainer.innerHTML = `
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
                                ${pageItems.map(item => {
                                    const isMastered = userStats.masteredWords.includes(item.id_word);
                                    return `
                                        <tr data-word="${escapeHtml(item.id_word)}">
                                            <td style="color: var(--text-muted); font-size: 0.8rem;">${item.id}</td>
                                            <td><strong style="color: var(--text-main); font-size: 1.05rem;">${escapeHtml(item.id_word)}</strong></td>
                                            <td style="color: var(--text-muted); font-size: 0.85rem;">${escapeHtml(item.syllables || '')}</td>
                                            <td><span class="tag-pos">${escapeHtml(item.pos)}</span></td>
                                            <td><strong style="color: var(--text-main);">${escapeHtml(item.zh_word)}</strong></td>
                                            <td><span class="tag-tier" style="margin-right: 0.2rem;">T${item.tier}</span><span class="tag-level">${escapeHtml(item.level)}</span></td>
                                            <td style="font-size: 0.82rem; max-width: 280px;">
                                                ${item.example ? `<div>${escapeHtml(item.example)}</div><div style="color: var(--text-muted);">${escapeHtml(item.example_zh || '')}</div>` : '-'}
                                            </td>
                                            <td style="text-align: center; white-space: nowrap;">
                                                <button class="vocab-audio-btn play-id-btn" style="display: inline-flex;" title="朗讀印尼語"><i class="fa-solid fa-volume-high"></i></button>
                                                <button class="vocab-audio-btn play-bi-btn" style="display: inline-flex; margin-left: 0.25rem;" title="中印雙語"><i class="fa-solid fa-language"></i></button>
                                            </td>
                                            <td style="text-align: center;">
                                                <button class="master-toggle-btn ${isMastered ? 'mastered' : ''}" style="padding: 0.25rem 0.5rem;" data-word="${escapeHtml(item.id_word)}">
                                                    <i class="fa-${isMastered ? 'solid' : 'regular'} fa-circle-check"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
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
                topPaginationEl.innerHTML = `
                    <button class="page-btn quick-prev" ${currentPage <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                    <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin: 0 0.5rem;">${currentPage} / ${totalPages}</span>
                    <button class="page-btn quick-next" ${currentPage >= totalPages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
                `;

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
                pageBtnsHtml += `<button class="page-btn nav-first" ${currentPage <= 1 ? 'disabled' : ''} title="第一頁"><i class="fa-solid fa-angles-left"></i></button>`;
                pageBtnsHtml += `<button class="page-btn nav-prev" ${currentPage <= 1 ? 'disabled' : ''} title="上一頁"><i class="fa-solid fa-chevron-left"></i> 上一頁</button>`;

                // Page numbers window (show 5 nearby pages)
                const startP = Math.max(1, currentPage - 2);
                const endP = Math.min(totalPages, currentPage + 2);

                if (startP > 1) {
                    pageBtnsHtml += `<button class="page-btn num-btn" data-page="1">1</button>`;
                    if (startP > 2) pageBtnsHtml += `<span style="color: var(--text-muted); padding: 0 0.2rem;">...</span>`;
                }

                for (let p = startP; p <= endP; p++) {
                    pageBtnsHtml += `<button class="page-btn num-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
                }

                if (endP < totalPages) {
                    if (endP < totalPages - 1) pageBtnsHtml += `<span style="color: var(--text-muted); padding: 0 0.2rem;">...</span>`;
                    pageBtnsHtml += `<button class="page-btn num-btn" data-page="${totalPages}">${totalPages}</button>`;
                }

                // Next & Last
                pageBtnsHtml += `<button class="page-btn nav-next" ${currentPage >= totalPages ? 'disabled' : ''} title="下一頁">下一頁 <i class="fa-solid fa-chevron-right"></i></button>`;
                pageBtnsHtml += `<button class="page-btn nav-last" ${currentPage >= totalPages ? 'disabled' : ''} title="最末頁"><i class="fa-solid fa-angles-right"></i></button>`;

                // Quick page jump selector
                pageBtnsHtml += `
                    <div style="display: flex; align-items: center; gap: 0.35rem; margin-left: 0.8rem;">
                        <span style="font-size: 0.82rem; color: var(--text-muted);">跳轉:</span>
                        <select class="page-jump-select" style="padding: 0.35rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--surface); color: var(--text-main); font-size: 0.82rem; font-weight: 700;">
                            ${Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || p % 5 === 0 || Math.abs(p - currentPage) <= 2).map(p => `
                                <option value="${p}" ${p === currentPage ? 'selected' : ''}>第 ${p} 頁</option>
                            `).join('')}
                        </select>
                    </div>
                `;

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

            if (fcTierTag) fcTierTag.textContent = `Top ${item.tier === 1 ? '1,000' : item.tier === 2 ? '3,000' : item.tier === 3 ? '5,000' : '10,000'} · ${item.level}`;
            if (fcWordId) fcWordId.textContent = item.id_word;
            if (fcSyllable) fcSyllable.textContent = item.syllables || '';
            if (fcPos) fcPos.textContent = item.pos;
            if (fcWordZh) fcWordZh.textContent = item.zh_word;
            if (fcExId) fcExId.textContent = item.example || '';
            if (fcExZh) fcExZh.textContent = item.example_zh || '';
            if (fcIndicator) fcIndicator.textContent = `${fcIndex + 1} / ${fcDeck.length}`;

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
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-quote-left" style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--text-muted);"></i>
                        <p>找不到符合篩選條件的成語或片語。</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map((item, idx) => {
                const catLabel = catNameMap[item.category] || '文化片語';
                return `
                    <div class="peribahasa-card" data-idx="${idx}">
                        <div>
                            <div class="peribahasa-header">
                                <span class="peribahasa-cat-tag">${catLabel}</span>
                                <div class="peribahasa-actions">
                                    <button class="icon-action-btn play-peri-btn" title="朗讀成語印尼文"><i class="fa-solid fa-volume-high"></i></button>
                                    <button class="icon-action-btn play-peri-bi-btn" title="中印雙語朗讀"><i class="fa-solid fa-language"></i></button>
                                </div>
                            </div>
                            <div class="peribahasa-id-phrase">"${escapeHtml(item.phrase)}"</div>
                            <div class="peribahasa-zh-meaning">【涵義】${escapeHtml(item.meaning_zh)}</div>
                            <div class="peribahasa-literal-box">
                                <strong><i class="fa-solid fa-seedling"></i> 字面直譯：</strong>${escapeHtml(item.literal_meaning)}
                            </div>
                            <div class="peribahasa-culture-box">
                                <strong><i class="fa-solid fa-feather-pointed"></i> 文化典故與用法：</strong>${escapeHtml(item.cultural_note)}
                            </div>
                            ${item.example ? `
                            <div class="peribahasa-dialogue-box" data-speak-example="${escapeHtml(item.example)}" title="點擊聆聽對話例句">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                    <div>
                                        <div style="font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;"><i class="fa-solid fa-comments" style="color: var(--secondary); margin-right: 0.35rem;"></i>${escapeHtml(item.example)}</div>
                                        <div style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(item.example_zh || '')}</div>
                                    </div>
                                    <button class="vocab-audio-btn play-peri-ex-btn" title="朗讀示範會話" style="width: 28px; height: 28px; font-size: 0.75rem; flex-shrink: 0;"><i class="fa-solid fa-volume-high"></i></button>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>
                `;
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
                const exBox = card.querySelector('.peribahasa-dialogue-box');
                const exBtn = card.querySelector('.play-peri-ex-btn');
                if (exBtn && item.example) {
                    exBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        audioEngine.speakBilingual(item.example, item.example_zh || '');
                    });
                }
                if (exBox && item.example) {
                    exBox.addEventListener('click', (e) => {
                        if (e.target.closest('button')) return;
                        audioEngine.speakBilingual(item.example, item.example_zh || '');
                    });
                }
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
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: var(--surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
                        <i class="fa-solid fa-comment-dots" style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--text-muted);"></i>
                        <p>該分類暫無語句。</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = filtered.map((item, idx) => {
                const catLabel = catNameMap[item.category] || '日常生活';
                return `
                    <div class="sentence-item-card" data-idx="${idx}" data-speak-id="${escapeHtml(item.id_sent)}" title="點擊卡片直接朗讀">
                        <div>
                            <span class="sentence-card-cat">${catLabel}</span>
                            <div class="sentence-id-text">${escapeHtml(item.id_sent)}</div>
                            <div class="sentence-zh-text">${escapeHtml(item.zh_sent)}</div>
                            ${item.breakdown ? `
                            <div class="sentence-breakdown-box">
                                <strong><i class="fa-solid fa-cubes"></i> 文法解析：</strong>${escapeHtml(item.breakdown)}
                            </div>` : ''}
                            ${item.tip ? `
                            <div class="sentence-tip-pill">
                                <i class="fa-solid fa-circle-info"></i> <span>${escapeHtml(item.tip)}</span>
                            </div>` : ''}
                        </div>
                        <div class="sentence-card-actions">
                            <button class="action-btn small play-sent-btn"><i class="fa-solid fa-volume-high"></i> 印</button>
                            <button class="action-btn small secondary play-sent-bi-btn"><i class="fa-solid fa-language"></i> 雙語</button>
                        </div>
                    </div>
                `;
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

    // ==========================================================================
    // 全站點擊單字/片語/會話 即時發音委託 (Universal Click-to-Speak Delegation)
    // 確保整個學習系統中每一個單字、成語、例句、會話氣泡均可點擊即時發音！
    // ==========================================================================
    document.addEventListener('click', (e) => {
        // 1. Explicit data-speak attributes
        const speakBtn = e.target.closest('[data-speak]');
        if (speakBtn) {
            const text = speakBtn.getAttribute('data-speak');
            const lang = speakBtn.getAttribute('data-speak-lang') || 'id';
            const rate = parseFloat(speakBtn.getAttribute('data-speak-rate')) || audioEngine.speechRate;
            audioEngine.speak(text, { lang, rate });
            return;
        }

        // 2. Explicit data-speak-bi attributes
        const speakBiBtn = e.target.closest('[data-speak-bi]');
        if (speakBiBtn) {
            const idText = speakBiBtn.getAttribute('data-speak-bi');
            const zhText = speakBiBtn.getAttribute('data-speak-zh') || '';
            audioEngine.speakBilingual(idText, zhText);
            return;
        }

        // 3. Any Indonesian text element anywhere on the page
        const indoTextEl = e.target.closest([
            '.card-word-id', '.cheat-phrase-id', '.bubble-id-text', '.result-id', '.num-pill', '.banknote-id',
            '.vocab-card-word', '.vocab-word-id', '.ex-id', '.ex-id-text', '.peribahasa-id-phrase', '.sentence-id-text',
            '.jp-phrase-id', '.deriv-word', '.gaul-word', '.card-word-large', '.baku-text', '.gaul-text',
            '.vocab-data-table td:nth-child(2)', '.vocab-data-table td:nth-child(7)',
            '.pronoun-table td:nth-child(2)', '.pronoun-table td:nth-child(3)', '.pronoun-table td:nth-child(4)',
            '.letter-card', '.diphthong-card', '.quiz-opt-letter', '[data-speak-id]', '[data-word]'
        ].join(', '));

        if (indoTextEl && !e.target.closest('button, input, select, textarea, a')) {
            const rawText = indoTextEl.getAttribute('data-speak-id') || 
                            indoTextEl.getAttribute('data-word') || 
                            indoTextEl.textContent.trim();
            const text = audioEngine.cleanIndoText(rawText);
            if (text && text.length > 0 && text.length < 300) {
                indoTextEl.classList.add('audio-pulse-speaking');
                setTimeout(() => indoTextEl.classList.remove('audio-pulse-speaking'), 1200);
                audioEngine.speak(text, { lang: 'id' });
            }
        }
    });
});
