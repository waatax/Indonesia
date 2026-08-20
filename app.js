document.addEventListener('DOMContentLoaded', async () => {
    // 獲取 DOM 元素
    const mapContainer = document.querySelector('.city-nodes');
    const moduleGrid = document.querySelector('.module-grid');
    const flashcard = document.querySelector('.flashcard');
    const idText = document.querySelector('.id-text');
    const zhText = document.querySelector('.zh-text');
    let currentFlashcardIndex = 0;
    let flashcardsData = [];

    // === 0. Fetch data.json ===
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        // 渲染地圖節點
        renderMapNodes(data.curriculum.cities);
        
        // 渲染生活實戰模組
        renderModules(data.curriculum.cities);
        
        // 初始化盲聽字庫
        flashcardsData = data.curriculum.flashcards.words;
        updateFlashcard();
        
    } catch (error) {
        console.error('Failed to load data.json:', error);
    }

    // === 1. 視圖切換與 Haptic 觸覺微震動回饋 ===
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            if (navigator.vibrate) navigator.vibrate(15);
        });
    });

    // === 2. 盲聽字庫音效控制與卡片脈衝響應 (SpeechSynthesis) ===
    const audioButtons = document.querySelectorAll('.ctrl-btn');
    
    function playAudio(text, rate) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = rate;
            window.speechSynthesis.speak(utterance);
            
            return new Promise(resolve => {
                utterance.onend = resolve;
                utterance.onerror = resolve;
            });
        } else {
            return new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    audioButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (flashcardsData.length === 0) return;
            
            const btnTarget = e.currentTarget;
            const originalIcon = btnTarget.innerHTML;
            const isFast = btnTarget.classList.contains('primary');
            const rate = isFast ? 1.2 : 0.75;
            
            if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
            
            btnTarget.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 播放中...`;
            flashcard.classList.add('playing');
            idText.style.color = 'var(--accent)';

            const currentWord = flashcardsData[currentFlashcardIndex].id_word;
            await playAudio(currentWord, rate);

            btnTarget.innerHTML = originalIcon;
            flashcard.classList.remove('playing');
            idText.style.color = 'var(--text-main)';
            
            // 切換下一張字卡
            currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardsData.length;
            setTimeout(updateFlashcard, 300);
        });
    });

    function updateFlashcard() {
        if (flashcardsData.length > 0) {
            const word = flashcardsData[currentFlashcardIndex];
            idText.textContent = word.id_word;
            zhText.textContent = word.zh_word;
        }
    }

    // === 3. 遊戲化地圖互動邏輯 ===
    function renderMapNodes(citiesData) {
        if (!mapContainer) return;
        
        const nodes = [
            { id: 'taipei', icon: 'fa-location-dot', name: 'A1 新手村', desc: '基礎問候與字母', locked: false },
            { id: 'jakarta', icon: 'fa-building', name: citiesData.jakarta.name, desc: citiesData.jakarta.description, locked: false },
            { id: 'surabaya', icon: 'fa-ship', name: citiesData.surabaya.name, desc: citiesData.surabaya.description, locked: true }
        ];

        mapContainer.innerHTML = '';
        nodes.forEach((node, index) => {
            const nodeDiv = document.createElement('div');
            nodeDiv.className = `node ${node.locked ? 'locked' : 'unlocked'}`;
            nodeDiv.setAttribute('data-city', node.id);
            nodeDiv.innerHTML = `
                <div class="pin"><i class="fa-solid ${node.icon}"></i></div>
                <span class="label">${node.name}<br><small>${node.desc}</small></span>
            `;
            
            nodeDiv.addEventListener('click', () => {
                if (node.locked) {
                    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                    const pin = nodeDiv.querySelector('.pin');
                    pin.style.transform = 'translateX(-10px)';
                    setTimeout(() => pin.style.transform = 'translateX(10px)', 100);
                    setTimeout(() => pin.style.transform = 'translateX(0)', 200);
                } else {
                    if (navigator.vibrate) navigator.vibrate(25);
                    
                    // 自動切換到「生活實戰」視圖
                    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
                    document.getElementById('module-view').classList.add('active');
                    
                    // 更新導覽列狀態
                    document.querySelectorAll('.nav-btn').forEach(b => {
                        b.classList.remove('active');
                        if (b.getAttribute('data-target') === 'module-view') {
                            b.classList.add('active');
                        }
                    });
                }
            });

            mapContainer.appendChild(nodeDiv);

            if (index < nodes.length - 1) {
                const pathDiv = document.createElement('div');
                pathDiv.className = `path ${nodes[index+1].locked ? 'locked' : 'active'}`;
                mapContainer.appendChild(pathDiv);
            }
        });
    }

    // === 渲染模組卡片 ===
    function renderModules(citiesData) {
        if (!moduleGrid) return;
        
        const allModules = [
            ...(citiesData.jakarta?.modules || []),
            ...(citiesData.surabaya?.modules || [])
        ];
        
        const displayModules = allModules.slice(0, 3);
        const images = [
            'assets/coffee_shop_illustration_1787210903184.jpg',
            'assets/surabaya_illustration_1787210917170.jpg',
            ''
        ];
        
        moduleGrid.innerHTML = '';
        displayModules.forEach((mod, idx) => {
            const card = document.createElement('div');
            card.className = 'module-card';
            
            const zhTextPreview = mod.dialogue?.[0]?.zh_text || mod.dialogue_baku?.[0]?.zh_text || '挑戰全新的印尼語情境！';
            
            if (images[idx]) {
                card.innerHTML = `
                    <img src="${images[idx]}" class="module-card-img" alt="Module Image">
                    <div class="module-card-content">
                        <h3>${mod.title}</h3>
                        <p>${zhTextPreview}</p>
                        <button class="action-btn start-lesson-btn" data-mod-id="${mod.id}">進入實境</button>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="module-card-content" style="justify-content: center; text-align: center;">
                        <i class="fa-brands fa-tiktok" style="font-size: 4rem; color: var(--text-main); margin-bottom: 1rem;"></i>
                        <h3>${mod.title}</h3>
                        <p>${zhTextPreview}</p>
                        <button class="action-btn start-lesson-btn" style="background: var(--accent); box-shadow: 0 4px 0 #005bb5;" data-mod-id="${mod.id}">解鎖彩蛋</button>
                    </div>
                `;
            }
            moduleGrid.appendChild(card);
        });

        // 綁定「進入實境」按鈕事件
        const startBtns = document.querySelectorAll('.start-lesson-btn');
        startBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modId = e.currentTarget.getAttribute('data-mod-id');
                const selectedMod = displayModules.find(m => m.id === modId);
                if (selectedMod) {
                    openLesson(selectedMod);
                }
            });
        });
    }

    // === 開啟實境教學畫面 (Lesson View) ===
    function openLesson(mod) {
        if (navigator.vibrate) navigator.vibrate(20);
        
        // 切換視圖
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('lesson-view').classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        // 渲染標題
        document.getElementById('lesson-title').textContent = mod.title;
        
        // 渲染對話
        const contentDiv = document.getElementById('lesson-content');
        contentDiv.innerHTML = '';
        
        // 取出對話陣列 (處理 baku/gaul 分支)
        let dialogues = mod.dialogue || mod.dialogue_gaul || mod.dialogue_baku || [];
        
        dialogues.forEach((line, index) => {
            // 簡單判斷說話者來決定泡泡在左邊或右邊 (User = 右, 其他 = 左)
            const isRight = line.speaker.toLowerCase().includes('user') || line.speaker === 'A' || index % 2 !== 0;
            const alignClass = isRight ? 'right' : 'left';
            
            const wrapper = document.createElement('div');
            wrapper.className = `chat-bubble-wrapper ${alignClass}`;
            
            let notesHtml = line.slang_notes ? `<span class="chat-notes">${line.slang_notes}</span>` : '';
            
            wrapper.innerHTML = `
                <span class="speaker-name">${line.speaker}</span>
                <div class="chat-bubble">
                    <div class="chat-id">${line.id_text}</div>
                    <div class="chat-zh">${line.zh_text}</div>
                    ${notesHtml}
                    <button class="chat-audio-btn" data-text="${line.id_text}"><i class="fa-solid fa-volume-high"></i> 播放語音</button>
                </div>
            `;
            
            contentDiv.appendChild(wrapper);
        });

        // 綁定對話內語音按鈕
        const chatAudioBtns = document.querySelectorAll('.chat-audio-btn');
        chatAudioBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const text = e.currentTarget.getAttribute('data-text');
                const icon = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 播放中`;
                await playAudio(text, 1.0);
                e.currentTarget.innerHTML = icon;
            });
        });
    }

    // === 返回按鈕 ===
    document.getElementById('back-to-modules').addEventListener('click', () => {
        if (navigator.vibrate) navigator.vibrate(10);
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('module-view').classList.add('active');
        
        // 恢復 Nav 狀態
        document.querySelectorAll('.nav-btn').forEach(b => {
            if(b.getAttribute('data-target') === 'module-view') b.classList.add('active');
        });
    });

    // === 4. 全局設定: 暗色/亮色模式切換 ===
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlEl.setAttribute('data-theme', newTheme);
        
        themeToggleBtn.innerHTML = newTheme === 'dark' 
            ? '<i class="fa-solid fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
            
        if (navigator.vibrate) navigator.vibrate(10);
    });

    // === 5. 全局設定: 字體大小縮放 ===
    const fontIncBtn = document.getElementById('font-increase');
    const fontDecBtn = document.getElementById('font-decrease');
    
    const sizes = ['small', 'normal', 'large'];
    let currentSizeIndex = 1;

    fontIncBtn.addEventListener('click', () => {
        if (currentSizeIndex < sizes.length - 1) {
            currentSizeIndex++;
            htmlEl.setAttribute('data-font-size', sizes[currentSizeIndex]);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });

    fontDecBtn.addEventListener('click', () => {
        if (currentSizeIndex > 0) {
            currentSizeIndex--;
            htmlEl.setAttribute('data-font-size', sizes[currentSizeIndex]);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    });
});
