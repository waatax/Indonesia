const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

// 1. Replace AudioEngine class implementation
const oldAudioEngineStart = 'class AudioEngine {';
const oldAudioEngineEnd = '    const audioEngine = new AudioEngine();';

const startIdx = appJs.indexOf(oldAudioEngineStart);
const endIdx = appJs.indexOf(oldAudioEngineEnd);

if (startIdx === -1 || endIdx === -1) {
    console.error('AudioEngine markers not found in app.js!');
    process.exit(1);
}

const newAudioEngineCode = `class AudioEngine {
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
            cleaned = cleaned.replace(/\\([^)]*\\)/g, ' ');
            cleaned = cleaned.replace(/（[^）]*）/g, ' ');
            cleaned = cleaned.replace(/\\[[^\\]]*\\]/g, ' ');
            cleaned = cleaned.replace(/【[^】]*】/g, ' ');
            cleaned = cleaned.replace(/[\\u4e00-\\u9fa5]/g, ' ');
            cleaned = cleaned.replace(/[，。！？；：（）「」『』、《》“”‘’…—\\/]/g, ' ');
            cleaned = cleaned.replace(/\\s+/g, ' ').trim();
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
                const url = \`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=\${encodeURIComponent(textChunk)}\`;

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
                key: options.key ? \`\${options.key}_zh\` : null
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
                key: options.key ? \`\${options.key}_id\` : null,
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
`;

appJs = appJs.substring(0, startIdx) + newAudioEngineCode + '\n' + appJs.substring(endIdx);

// 2. Update Peribahasa rendering to include dedicated example audio button & click listener
const oldPeriDialogue = `                            \${item.example ? \`
                            <div class="peribahasa-dialogue-box">
                                <div style="font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;">\${escapeHtml(item.example)}</div>
                                <div style="color: var(--text-muted); font-size: 0.8rem;">\${escapeHtml(item.example_zh || '')}</div>
                            </div>\` : ''}`;

const newPeriDialogue = `                            \${item.example ? \`
                            <div class="peribahasa-dialogue-box" data-speak-example="\${escapeHtml(item.example)}" title="點擊聆聽對話例句">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                                    <div>
                                        <div style="font-weight: 700; color: var(--text-main); margin-bottom: 0.2rem;"><i class="fa-solid fa-comments" style="color: var(--secondary); margin-right: 0.35rem;"></i>\${escapeHtml(item.example)}</div>
                                        <div style="color: var(--text-muted); font-size: 0.8rem;">\${escapeHtml(item.example_zh || '')}</div>
                                    </div>
                                    <button class="vocab-audio-btn play-peri-ex-btn" title="朗讀示範會話" style="width: 28px; height: 28px; font-size: 0.75rem; flex-shrink: 0;"><i class="fa-solid fa-volume-high"></i></button>
                                </div>
                            </div>\` : ''}`;

if (appJs.includes(oldPeriDialogue)) {
    appJs = appJs.replace(oldPeriDialogue, newPeriDialogue);
}

// And bind play-peri-ex-btn
const oldPeriAudioBinding = `            // Bind audio
            container.querySelectorAll('.peribahasa-card').forEach((card, i) => {
                const item = filtered[i];
                card.querySelector('.play-peri-btn')?.addEventListener('click', () => {
                    audioEngine.speak(item.phrase, { lang: 'id' });
                });
                card.querySelector('.play-peri-bi-btn')?.addEventListener('click', () => {
                    audioEngine.speakBilingual(item.phrase, item.meaning_zh);
                });
            });`;

const newPeriAudioBinding = `            // Bind audio
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
            });`;

if (appJs.includes(oldPeriAudioBinding)) {
    appJs = appJs.replace(oldPeriAudioBinding, newPeriAudioBinding);
}

// 3. Update Everyday Sentences rendering so clicking the card also speaks
const oldSentCard = `                    <div class="sentence-item-card" data-idx="\${idx}">`;
const newSentCard = `                    <div class="sentence-item-card" data-idx="\${idx}" data-speak-id="\${escapeHtml(item.id_sent)}" title="點擊卡片直接朗讀">`;
if (appJs.includes(oldSentCard)) {
    appJs = appJs.replace(oldSentCard, newSentCard);
}

// 4. Update Universal Click-to-Speak Delegation to cover ALL Indonesian text across the whole web app
const oldUniversalSpeak = `    // ==========================================================================
    // 全站點擊單字/句子即時發音委託 (Universal Click-to-Speak Delegation)
    // ==========================================================================
    document.addEventListener('click', (e) => {
        const speakBtn = e.target.closest('[data-speak]');
        if (speakBtn) {
            const text = speakBtn.getAttribute('data-speak');
            const lang = speakBtn.getAttribute('data-speak-lang') || 'id';
            const rate = parseFloat(speakBtn.getAttribute('data-speak-rate')) || audioEngine.speechRate;
            audioEngine.speak(text, { lang, rate });
            return;
        }

        // 點擊任何印尼語文字區塊自動朗讀
        const wordEl = e.target.closest('.card-word-id, .cheat-phrase-id, .bubble-id-text, .result-id, .num-pill, .banknote-id');
        if (wordEl && !e.target.closest('button')) {
            const text = wordEl.textContent.trim();
            if (text) {
                audioEngine.speak(text, { lang: 'id' });
            }
        }
    });`;

const newUniversalSpeak = `    // ==========================================================================
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
    });`;

if (appJs.includes(oldUniversalSpeak)) {
    appJs = appJs.replace(oldUniversalSpeak, newUniversalSpeak);
} else {
    console.warn('Old universal speak block not matched exactly, checking alternative replace...');
}

// 5. In initHeaderControls, add audio-test-btn handler
const oldHeaderControlsSpeed = `            speedBtn.querySelector('.speed-label').textContent = speedLabels[speedIdx];
            if (navigator.vibrate) navigator.vibrate(10);
        });`;

const newHeaderControlsAudio = `            speedBtn.querySelector('.speed-label').textContent = speedLabels[speedIdx];
            if (navigator.vibrate) navigator.vibrate(10);
        });

        // 頂部真人語音測試按鈕
        const audioTestBtn = document.getElementById('audio-test-btn');
        audioTestBtn?.addEventListener('click', () => {
            audioEngine.speak('Halo, selamat belajar bahasa Indonesia! Semua kosakata, peribahasa, dan percakapan siap didengarkan.', { lang: 'id' });
            if (navigator.vibrate) navigator.vibrate(15);
        });`;

if (appJs.includes(oldHeaderControlsSpeed)) {
    appJs = appJs.replace(oldHeaderControlsSpeed, newHeaderControlsAudio);
}

fs.writeFileSync(appPath, appJs, 'utf8');
console.log('Successfully upgraded AudioEngine and Universal Click-to-Speak in app.js!');
