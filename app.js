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
                    console.log(`[模組加載] 正在載入 ${node.id}...`);
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
                        <button class="action-btn">挑戰任務</button>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="module-card-content" style="justify-content: center; text-align: center;">
                        <i class="fa-brands fa-tiktok" style="font-size: 4rem; color: var(--text-main); margin-bottom: 1rem;"></i>
                        <h3>${mod.title}</h3>
                        <p>${zhTextPreview}</p>
                        <button class="action-btn" style="background: var(--accent); box-shadow: 0 4px 0 #005bb5;">解鎖彩蛋</button>
                    </div>
                `;
            }
            moduleGrid.appendChild(card);
        });
    }

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
