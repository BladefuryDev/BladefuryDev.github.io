// =============================
// Global State
// =============================
let gameData = null;
const defaultTitleSubtext = [
    "This is a Sample Text!", "Leon is a nice* Foxxo", "OCON^8: Detection of F.O.B. installation within Anville Plains",
    "Updating Anville Guild with new OCON intel...", "Roy is a 🦆", "OCON^1: Unauthorized hammock installation near Eterna Forest.",
    "Anville Guild reporting: A flood of paper planes over Nimbasa Village.", "OCON^2: Berries mysteriously disappearing from Midnight Forest.",
    "Warning: Friendly pillow fight detected at 040* shoreline of Crystal Lake!", "OCON^1: Someone built a sandcastle too close to the docks at Anville Town. Destruction by traffic wake imminent.",
];
let activeTitleSubtext = [...defaultTitleSubtext];
let currentTextIndex = -1;
const availableThemes = {};


// =============================
// App Initialization
// =============================
window.addEventListener("load", () => {
    runIntroAnimation().then(() => {
        // This block runs after the intro is complete and all elements are cleaned up.
        console.log("Intro complete. Initializing main application.");
        
        loadDataFromCookie();
        setupThemeSystem();
        setupFileUpload();
        setupEventListeners();
        setupSettingsModal();
        setupNavigation();
        setupServiceWorker();

        // Start the text crawl now that the app is fully visible and ready.
        typeText("ATLAS - Central - Authentication order recieved. Initializing assets...", "logo-subtext", 1500).then(() => {
            setInterval(cycleSubtext, 10000);
        });
    });
});

// =============================
// Intro Animation
// =============================
function runIntroAnimation() {
    return new Promise(resolve => {
        const introLogoContainer = document.getElementById('intro-logo-container');
        const introBg = document.getElementById('intro-bg');
        const logo = document.getElementById('intro-logo');
        const navbar = document.getElementById('navbar');
        const navItems = document.querySelectorAll('.nav-item');
        const mainContent = document.getElementById('main-content');
        let resolved = false;

        // This function cleans up the intro elements and resolves the promise.
        const cleanupAndResolve = () => {
            if (resolved) return;
            resolved = true;
            
            clearTimeout(fallbackTimeout);
            if (introLogoContainer) introLogoContainer.remove();
            if (introBg) introBg.remove();
            
            if(mainContent) {
                mainContent.classList.remove('opacity-0');
                mainContent.classList.add('main-content-enter');
            }
            document.body.style.overflow = ''; 
            resolve();
        };
        
        const fallbackTimeout = setTimeout(cleanupAndResolve, 3500);

        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (introBg) introBg.classList.add('fade-in');
        }, 100);

        setTimeout(() => {
            if (navbar) {
                navbar.classList.add('slide-in');
                navbar.classList.remove('opacity-0');
            }
        }, 500);

        setTimeout(() => {
            if (navItems) {
                navItems.forEach((item, index) => {
                    setTimeout(() => {
                        if(item) {
                            item.classList.remove('opacity-0');
                            item.classList.add('fade-in-nav');
                        }
                    }, index * 100);
                });
            }
        }, 1000);
        
        setTimeout(() => {
            if (logo) logo.classList.add('shrink-fade');
        }, 2500);

        setTimeout(() => {
            if (introLogoContainer) {
                introLogoContainer.classList.add('fade-out');
                introLogoContainer.addEventListener('transitionend', cleanupAndResolve, { once: true });
            } else {
                cleanupAndResolve();
            }
            if (introBg) introBg.classList.add('fade-out');
        }, 3000);
    });
}


// =============================
// Navigation Logic
// =============================
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    const pages = {
        '#dungeons': document.getElementById('dungeons-page'),
        '#overworld': document.getElementById('overworld-page'),
    };
    const pageOrder = ['#dungeons', '#overworld'];
    const defaultPage = '#dungeons';
    let currentPageHash = null;
    let isAnimating = false;

    function showPage(hash, isInitialLoad = false) {
        if (isAnimating) return;

        const targetHash = hash || defaultPage;
        if (targetHash === currentPageHash && !isInitialLoad) return;

        const currentPageEl = pages[currentPageHash];
        const targetPageEl = pages[targetHash];

        if (!targetPageEl) {
            if (window.location.hash !== defaultPage) {
                window.location.hash = defaultPage;
            }
            return;
        }

        navLinks.forEach(link => {
            link.classList.remove('nav-link-active');
            if (link.getAttribute('href') === targetHash) {
                link.classList.add('nav-link-active');
            }
        });

        if (isInitialLoad || !currentPageEl) {
            Object.values(pages).forEach(p => { if(p) p.classList.add('hidden')});
            if(targetPageEl) targetPageEl.classList.remove('hidden');
            currentPageHash = targetHash;
            return;
        }

        isAnimating = true;
        const currentIndex = pageOrder.indexOf(currentPageHash);
        const targetIndex = pageOrder.indexOf(targetHash);
        let outClass, inClass;

        if (targetIndex > currentIndex) {
            outClass = 'slide-out-to-left';
            inClass = 'slide-in-from-right';
        } else {
            outClass = 'slide-out-to-right';
            inClass = 'slide-in-from-left';
        }

        if(targetPageEl) targetPageEl.classList.remove('hidden');
        const onAnimationEnd = (event) => {
            if (event.target !== currentPageEl) return;
            currentPageEl.removeEventListener('animationend', onAnimationEnd);
            currentPageEl.classList.add('hidden');
            currentPageEl.classList.remove(outClass);
            targetPageEl.classList.remove(inClass);
            isAnimating = false;
            currentPageHash = targetHash;
        };

        if(currentPageEl) {
            currentPageEl.addEventListener('animationend', onAnimationEnd);
            requestAnimationFrame(() => {
                currentPageEl.classList.add(outClass);
                if(targetPageEl) targetPageEl.classList.add(inClass);
            });
        }
    }

    window.addEventListener('hashchange', () => showPage(window.location.hash, false));
    showPage(window.location.hash || defaultPage, true);
}


// =============================
// Data Handling & Processing
// =============================
function processGameData(jsonString, fileName) {
    const fileLabel = document.getElementById("load-file-ident");
    try {
        gameData = JSON.parse(jsonString);
        console.log("Successfully parsed game data:", gameData);

        // Update UI elements with new data
        updateDiagnostics(gameData);
        updateTitle(gameData.meta?.customTitleName || "Tome Tales Management Panel");
        activeTitleSubtext = gameData.meta?.textCrawl && gameData.meta.textCrawl.length > 0 ? gameData.meta.textCrawl : [...defaultTitleSubtext];
        currentTextIndex = -1;
        populateLocationDropdowns();
        populateOverworldDropdowns();

        // Save loaded data to a cookie for persistence
        const cookieData = { fileName, content: jsonString };
        const stringToEncode = JSON.stringify(cookieData);
        const encodedData = btoa(unescape(encodeURIComponent(stringToEncode)));
        setCookie("savedJsonFile", encodedData, 7);
        if(fileLabel) fileLabel.textContent = `✅ ${fileName} loaded!`;

    } catch (error) {
        console.error("Error parsing JSON file:", error);
        if(fileLabel) fileLabel.textContent = "⚠️ Error parsing file.";
        gameData = null;
    }
}

function setupFileUpload() {
    const loadButton = document.getElementById("load-file-button");
    const fileInput = document.getElementById("file-loader");
    const fileLabel = document.getElementById("load-file-ident");

    if (loadButton && fileInput && fileLabel) {
        loadButton.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                fileLabel.textContent = `ℹ️ ${file.name} loading...`;
                if (file.name.endsWith('.json')) {
                    const reader = new FileReader();
                    reader.onload = (e) => processGameData(e.target.result, file.name);
                    reader.readAsText(file);
                } else {
                    fileLabel.textContent = "⚠️ Please select a .json file.";
                }
            }
        });
    }
}

function loadDataFromCookie() {
    const savedJsonFile = getCookie("savedJsonFile");
    if (savedJsonFile) {
        console.log("Found saved file in cookie, loading data...");
        try {
            const decodedString = decodeURIComponent(escape(atob(savedJsonFile)));
            const cookieData = JSON.parse(decodedString);
            if (cookieData.content && cookieData.fileName) {
                const fileLabel = document.getElementById("load-file-ident");
                if(fileLabel) fileLabel.textContent = `ℹ️ Loading ${cookieData.fileName} from memory...`;
                processGameData(cookieData.content, cookieData.fileName);
            }
        } catch (e) {
            console.error("Failed to load data from cookie:", e);
            setCookie("savedJsonFile", "", -1);
        }
    }
}


// =============================
// UI Population & Updates
// =============================
function updateDiagnostics(data) {
    const updateCount = (id, count, name) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = `${count} - ${name}`;
            el.classList.toggle("text-tertiary", count === 0);
            el.classList.toggle("text-main", count > 0);
        }
    };

    updateCount("places-count", data.locations?.length || 0, "Places");
    updateCount("enemies-count", data.enemies?.length || 0, "Enemies");
    updateCount("loot-boxes-count", data.loot_boxes?.length || 0, "Loot Boxes");
    updateCount("quests-count", data.quests?.length || 0, "Quest Assets");
    
    const allItems = new Set();
    data.enemies?.forEach(e => e.loot_table?.forEach(item => allItems.add(item)));
    data.loot_boxes?.forEach(lb => lb.contents?.forEach(item => allItems.add(item)));
    updateCount("items-count", allItems.size, "Items");
}

function updateTitle(newTitle) {
    document.title = newTitle;
    const mainTitleEl = document.getElementById("main-title");
    if (mainTitleEl) mainTitleEl.textContent = newTitle;
}

function populateLocationDropdowns() {
    const selects = [
        document.getElementById("environment-select"),
        document.getElementById("mission-area-dropdown"),
        document.getElementById("job-destination-select")
    ];

    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = ''; // Clear existing options
        if (!gameData || !gameData.locations || gameData.locations.length === 0) {
            select.innerHTML = '<option value="none">-- No locations found --</option>';
            return;
        }
        gameData.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            select.appendChild(option);
        });
    });
}

function populateOverworldDropdowns() {
    const populateSelect = (selectId, dataArray, nameField = 'name') => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        if (!gameData || !dataArray || dataArray.length === 0) {
            select.innerHTML = `<option value="none">-- No data found --</option>`;
            return;
        }
        dataArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[nameField];
            select.appendChild(option);
        });
    };

    populateSelect("loot-box-select", gameData?.loot_boxes);
    populateSelect("job-client-select", gameData?.quest_givers);
    populateSelect("job-mission-type-select", gameData?.mission_types);
    populateSelect("job-hostile-faction-select", gameData?.factions);
}


// =============================
// Output Stack Logic
// =============================
function addCardWithFormattedText(standardText, discordText = null, stackId) {
    const stack = document.getElementById(stackId);
    if (!stack) {
        console.error(`Output stack with id "${stackId}" not found.`);
        return;
    }
    const placeholder = document.getElementById(`${stackId.replace('-stack', '')}-placeholder`);

    if (placeholder) placeholder.style.display = 'none';

    const template = document.getElementById('output-card-template');
    if (!template) return;

    const newCard = template.firstElementChild.cloneNode(true);
    
    newCard.dataset.standardText = standardText;
    newCard.dataset.discordText = discordText || '';

    const textarea = newCard.querySelector('.output-textarea');
    const timestampLabel = newCard.querySelector('.timestamp');
    const copyBtn = newCard.querySelector('.copy-btn');
    const discordToggleBtn = newCard.querySelector('.discord-copy-btn');
    
    textarea.value = standardText;
    newCard.dataset.viewMode = 'standard';
    timestampLabel.textContent = new Date().toLocaleString();
    copyBtn.onclick = () => copyTextToClipboard(textarea.value);

    if (discordText) {
        discordToggleBtn.style.display = 'inline-block';
        discordToggleBtn.textContent = 'Discord';
        discordToggleBtn.onclick = () => {
            if (newCard.dataset.viewMode === 'standard') {
                textarea.value = newCard.dataset.discordText;
                discordToggleBtn.textContent = 'Normal';
                newCard.dataset.viewMode = 'discord';
            } else {
                textarea.value = newCard.dataset.standardText;
                discordToggleBtn.textContent = 'Discord';
                newCard.dataset.viewMode = 'standard';
            }
            adjustTextareaHeight(textarea);
        };
    } else {
        discordToggleBtn.style.display = 'none';
    }
    
    stack.prepend(newCard);
    adjustTextareaHeight(textarea);
}

function clearOutputStack(stackId) {
    const stack = document.getElementById(stackId);
    if (!stack) {
        console.error(`Output stack with id "${stackId}" not found.`);
        return;
    }

    const placeholder = document.getElementById(`${stackId.replace('-stack', '')}-placeholder`);
    const cards = stack.querySelectorAll('.output-card-bg');
    cards.forEach(card => card.remove());

    if (placeholder) placeholder.style.display = 'block';
}


// =============================
// Generator Functions
// =============================
function generateEncounter() {
    if (!gameData) return showNotification("Please load a data file first.", "error");
    
    const locationId = document.getElementById('environment-select').value;
    const includeHazards = document.getElementById('hazards').checked;
    const includeBerries = document.getElementById('berries').checked;
    const includeLootBoxes = document.getElementById('loot-boxes').checked;
    const location = gameData.locations.find(l => l.id === locationId);
    if (!location) return showNotification("Selected location not found.", "error");

    let output = `ENCOUNTER: ${location.name}\n--------------------\n${location.description}\n`;

    if (includeHazards) {
        output += `\nHAZARDS: ${location.environmental_hazards || 'None reported in this area.'}`;
    }
    if (includeBerries) {
        output += `\nBERRIES: ${location.berries?.length ? `You find ${location.berries.join(', ')} growing nearby.` : 'No berries are found in this area.'}`;
    }
    if (includeLootBoxes) {
        if (location.loot_boxes?.length && gameData.loot_boxes) {
            const lootBoxNames = location.loot_boxes.map(boxId => gameData.loot_boxes.find(lb => lb.id === boxId)?.name || boxId).join(', ');
            output += `\nLOOT BOXES: You spot a ${lootBoxNames}.`;
        } else {
            output += `\nLOOT BOXES: No loot boxes are found here.`;
        }
    }
    
    addCardWithFormattedText(output.trim(), null, 'output-stack');
}

function generateEnemies() {
    if (!gameData) return showNotification("Please load a data file first.", "error");

    const locationId = document.getElementById('mission-area-dropdown').value;
    const numFoes = parseInt(document.getElementById('num-foes').value, 10);
    const includeBosses = document.getElementById('include-bosses').checked;
    const bossChance = parseInt(document.getElementById('boss-spawn-slider').value, 10);
    const location = gameData.locations.find(l => l.id === locationId);
    if (!location) return showNotification("Selected mission area not found.", "error");
    
    const spawnedEnemies = [];
    for (let i = 0; i < numFoes; i++) {
        let enemyPool = location.enemy_types || [];
        let chosenEnemyId;

        if (includeBosses && Math.random() * 100 < bossChance) {
            chosenEnemyId = location.boss_types?.[Math.floor(Math.random() * location.boss_types.length)] || enemyPool[Math.floor(Math.random() * enemyPool.length)];
        } else {
            if (enemyPool.length > 0) chosenEnemyId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
        }
        
        if (chosenEnemyId) {
            const enemyData = gameData.enemies.find(e => e.id === chosenEnemyId);
            if (enemyData) spawnedEnemies.push(enemyData);
        }
    }
    
    let standardOutput = `SPAWNING ${spawnedEnemies.length} FOE(S) IN: ${location.name}\n--------------------\n`;
    let discordOutput = spawnedEnemies.length > 0 ? '' : null;

    if (spawnedEnemies.length > 0) {
        spawnedEnemies.forEach(enemy => {
            const bossTag = enemy.is_boss ? '(BOSS)' : '';
            const discordBossTag = enemy.is_boss ? ' (BOSS)' : '';
            standardOutput += `${enemy.name} ${bossTag}\n`;
            discordOutput += `**${enemy.name}${discordBossTag}**\n`;

            if (enemy.attacks?.length) {
                enemy.attacks.forEach(attack => {
                    standardOutput += `  > ${attack}\n`;
                    discordOutput += `> ${attack}\n`;
                });
            }
            if (enemy.loot_table?.length) {
                const loot = enemy.loot_table.join(', ');
                standardOutput += `  Loot: ${loot}\n`;
                discordOutput += `-# ${loot}\n`;
            }
            standardOutput += '\n';
            discordOutput += '\n';
        });
    } else {
        standardOutput += `No valid enemies could be spawned for this location.\n`;
    }

    addCardWithFormattedText(standardOutput.trim(), discordOutput?.trim(), 'output-stack');
}

function openLootBoxes() {
    if (!gameData) return showNotification("Please load a data file first.", "error");

    const lootBoxId = document.getElementById('loot-box-select').value;
    const quantity = parseInt(document.getElementById('loot-box-quantity').value, 10);
    const lootBox = gameData.loot_boxes.find(lb => lb.id === lootBoxId);
    if (!lootBox) return showNotification("Selected loot box not found.", "error");

    if (!lootBox.contents?.length) {
        return addCardWithFormattedText(`The ${lootBox.name} is empty.`, null, 'overworld-output-stack');
    }

    const results = {};
    for (let i = 0; i < quantity; i++) {
        const randomItem = lootBox.contents[Math.floor(Math.random() * lootBox.contents.length)];
        results[randomItem] = (results[randomItem] || 0) + 1;
    }

    let standardOutput = `OPENED ${quantity} x ${lootBox.name}\n--------------------\nYou received:\n`;
    let discordOutput = `Opened **${quantity}x ${lootBox.name}** and found:\n`;

    for (const [item, count] of Object.entries(results)) {
        standardOutput += `  - ${item} (x${count})\n`;
        discordOutput += `  - ${item} (x${count})\n`;
    }

    addCardWithFormattedText(standardOutput.trim(), discordOutput.trim(), 'overworld-output-stack');
}

function generateJob() {
    if (!gameData) return showNotification("Please load a data file first.", "error");

    const clientId = document.getElementById('job-client-select').value;
    const missionTypeId = document.getElementById('job-mission-type-select').value;
    const destinationId = document.getElementById('job-destination-select').value;
    const factionId = document.getElementById('job-hostile-faction-select').value;
    const rewardTier = parseInt(document.getElementById('job-reward-tier').value, 10);

    const client = gameData.quest_givers.find(qg => qg.id === clientId);
    const missionType = gameData.mission_types.find(mt => mt.id === missionTypeId);
    const destination = gameData.locations.find(l => l.id === destinationId);
    const faction = gameData.factions.find(f => f.id === factionId);

    if (!client || !missionType || !faction || !destination) {
        return showNotification("Please ensure a client, mission type, destination, and faction are selected.", "error");
    }

    const description = missionType.template
        .replace('[CLIENT]', client.name)
        .replace('[DESTINATION]', destination.name)
        .replace('[FACTION]', faction.name)
        .replace('[REWARD_TIER]', `Tier ${rewardTier}`);

    let standardOutput = `JOB POSTING\n--------------------\nCLIENT: ${client.name}\nMISSION: ${missionType.name}\nDESTINATION: ${destination.name}\nTHREAT: ${faction.name}\nREWARD TIER: ${rewardTier}\n\nDETAILS:\n${description}`;
    let discordOutput = `**JOB POSTING: ${missionType.name}**\n> **Client:** ${client.name}\n> **Destination:** ${destination.name}\n> **Threat:** ${faction.name}\n> **Reward:** Tier ${rewardTier}\n\n*${description}*`;

    addCardWithFormattedText(standardOutput, discordOutput, 'overworld-output-stack');
}


// =============================
// Event Listeners Setup
// =============================
function setupEventListeners() {
    // Execute buttons
    document.getElementById('encounter-execute-button').addEventListener('click', generateEncounter);
    document.getElementById('enemy-execute-button').addEventListener('click', generateEnemies);
    document.getElementById('loot-box-execute-button').addEventListener('click', openLootBoxes);
    document.getElementById('job-builder-execute-button').addEventListener('click', generateJob);

    // Clear Output buttons
    document.getElementById('clear-dungeons-output-button').addEventListener('click', () => clearOutputStack('output-stack'));
    document.getElementById('clear-overworld-output-button').addEventListener('click', () => clearOutputStack('overworld-output-stack'));

    // Boss spawn controls
    const includeBossesToggle = document.getElementById('include-bosses');
    const bossSlider = document.getElementById('boss-spawn-slider');
    const bossChanceLabel = document.getElementById('boss-spawn-chance-label');
    includeBossesToggle.addEventListener('change', () => bossSlider.disabled = !includeBossesToggle.checked);
    bossSlider.addEventListener('input', () => bossChanceLabel.textContent = `${bossSlider.value}%`);
    
    // Number input scroll wheels
    const setupInputWheel = (inputId) => {
        const input = document.getElementById(inputId);
        input.addEventListener('wheel', (event) => {
            event.preventDefault();
            let value = parseInt(input.value, 10);
            const min = parseInt(input.min, 10);
            const max = parseInt(input.max, 10);
            if (event.deltaY < 0) { // scroll up
                if (value < max) input.value = value + 1;
            } else { // scroll down
                if (value > min) input.value = value - 1;
            }
        });
    };
    setupInputWheel('num-foes');
    setupInputWheel('loot-box-quantity');

    // Reward Tier Slider
    const rewardTierSlider = document.getElementById('job-reward-tier');
    const rewardTierLabel = document.getElementById('job-reward-tier-label');
    rewardTierSlider.addEventListener('input', () => rewardTierLabel.textContent = `Tier ${rewardTierSlider.value}`);
}


// =============================
// Settings Modal & Theme Logic
// =============================
const defaultTheme = {
    "name": "Dark (Default)",
    "author": "TTMP",
    "colors": {
        "bgPrimary": "#1f2937", "bgSecondary": "#111827", "bgTertiary": "#4b5563", "bgInteractive": "#6b7280",
        "bgInteractiveHover": "#e5e7eb", "bgOutputCard": "#4b5563", "bgOutputTextarea": "#f3f4f6",
        "bgModalOverlay": "rgba(0, 0, 0, 0.5)", "textPrimary": "#ffffff", "textSecondary": "#9ca3af",
        "textTertiary": "#6b7280", "textAccent": "#000000", "textLink": "#ffffff", "accentPrimary": "#3b82f6",
        "accentPrimaryHover": "#93c5fd", "accentSecondary": "#22c55e", "accentSecondaryHover": "#86efac",
        "accentTertiary": "#ca8a04", "accentTertiaryHover": "#fde047", "accentDiscord": "#6366f1",
        "accentDiscordHover": "#818cf8", "border": "#374151", "ringPrimary": "#93c5fd", "ringDiscord": "#a5b4fc",
        "sliderThumb": "#60a5fa", "toggleBg": "#4b5563", "toggleBgChecked": "#22c55e", "toggleFg": "#ffffff"
    }
};

function setupSettingsModal() {
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const modalPanel = document.getElementById('settings-modal-panel');
    const closeButton = document.getElementById('settings-close-button');

    if (!settingsButton || !settingsModal || !modalPanel || !closeButton) return;

    const openModal = () => {
        settingsModal.classList.remove('hidden');
        settingsModal.classList.remove('modal-animate-fade-out');
        modalPanel.classList.remove('modal-panel-animate-out');
        settingsModal.classList.add('modal-animate-fade-in');
        modalPanel.classList.add('modal-panel-animate-in');
    };

    const closeModal = () => {
        settingsModal.classList.remove('modal-animate-fade-in');
        modalPanel.classList.remove('modal-panel-animate-in');
        settingsModal.classList.add('modal-animate-fade-out');
        modalPanel.classList.add('modal-panel-animate-out');

        modalPanel.addEventListener('animationend', () => {
            settingsModal.classList.add('hidden');
        }, { once: true });
    };

    settingsButton.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    closeButton.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) closeModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !settingsModal.classList.contains('hidden')) closeModal();
    });
}

function applyTheme(theme) {
    if (!theme || !theme.colors) {
        console.error("Invalid theme object provided.");
        return;
    }
    const root = document.documentElement;
    const colorMap = {
        bgPrimary: '--color-bg-primary', bgSecondary: '--color-bg-secondary', bgTertiary: '--color-bg-tertiary',
        bgInteractive: '--color-bg-interactive', bgInteractiveHover: '--color-bg-interactive-hover', bgOutputCard: '--color-bg-output-card',
        bgOutputTextarea: '--color-bg-output-textarea', bgModalOverlay: '--color-bg-modal-overlay', textPrimary: '--color-text-primary',
        textSecondary: '--color-text-secondary', textTertiary: '--color-text-tertiary', textAccent: '--color-text-accent',
        textLink: '--color-text-link', accentPrimary: '--color-accent-primary', accentPrimaryHover: '--color-accent-primary-hover',
        accentSecondary: '--color-accent-secondary', accentSecondaryHover: '--color-accent-secondary-hover', accentTertiary: '--color-accent-tertiary',
        accentTertiaryHover: '--color-accent-tertiary-hover', accentDiscord: '--color-accent-discord', accentDiscordHover: '--color-accent-discord-hover',
        border: '--color-border', ringPrimary: '--color-ring-primary', ringDiscord: '--color-ring-discord',
        sliderThumb: '--color-slider-thumb', toggleBg: '--color-toggle-bg', toggleBgChecked: '--color-toggle-bg-checked',
        toggleFg: '--color-toggle-fg'
    };
    for (const key in theme.colors) {
        if (colorMap[key]) {
            root.style.setProperty(colorMap[key], theme.colors[key]);
        }
    }
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = theme.name;
    }
    console.log(`Theme "${theme.name}" applied.`);
}

function registerTheme(theme) {
    if (!theme || !theme.name || !theme.colors) return;
    availableThemes[theme.name] = theme;

    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        let existingOption = themeSelect.querySelector(`option[value="${theme.name}"]`);
        if (!existingOption) {
            const option = document.createElement('option');
            option.value = theme.name;
            option.textContent = theme.name;
            themeSelect.appendChild(option);
        }
    }
}

function setupThemeSystem() {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.innerHTML = ''; // Clear out any hardcoded options
    }

    registerTheme(defaultTheme);
    const savedThemeJSON = getCookie("savedTheme");
    if (savedThemeJSON) {
        try {
            const savedTheme = JSON.parse(savedThemeJSON);
            registerTheme(savedTheme);
            applyTheme(savedTheme);
        } catch (e) {
            console.error("Failed to load theme from cookie:", e);
            applyTheme(defaultTheme);
        }
    } else {
        applyTheme(defaultTheme);
    }
    setupThemeControls();
}

function exportSampleTheme() {
    const jsonString = JSON.stringify(defaultTheme, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_theme.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setupThemeControls() {
    const exportButton = document.getElementById('export-theme-button');
    const uploadButton = document.getElementById('upload-theme-button');
    const themeInput = document.getElementById('theme-loader');
    const themeSelect = document.getElementById('theme-select');

    if (exportButton) {
        exportButton.addEventListener('click', exportSampleTheme);
    }

    if (uploadButton && themeInput) {
        uploadButton.addEventListener('click', () => themeInput.click());
        themeInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const theme = JSON.parse(e.target.result);
                        if (theme.name && theme.colors) {
                            registerTheme(theme);
                            applyTheme(theme);
                            setCookie("savedTheme", JSON.stringify(theme), 365);
                            showNotification(`Theme "${theme.name}" loaded successfully!`, 'success');
                        } else {
                            showNotification("Invalid theme file. Missing 'name' or 'colors' property.", 'error');
                        }
                    } catch (error) {
                        console.error("Error parsing theme file:", error);
                        showNotification("Error parsing theme file. Please check format.", 'error');
                    }
                };
                reader.readAsText(file);
            } else if (file) {
                showNotification("Please select a valid .json theme file.", 'error');
            }
            themeInput.value = '';
        });
    }
    
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            const selectedThemeName = themeSelect.value;
            const themeToApply = availableThemes[selectedThemeName];
            if (themeToApply) {
                applyTheme(themeToApply);
                setCookie("savedTheme", JSON.stringify(themeToApply), 365);
                showNotification(`Theme set to ${selectedThemeName}`, 'info');
            }
        });
    }
}


// =============================
// Core Utility Functions
// =============================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.textContent = message;

    // Basic styling, assuming you'll use a framework or custom CSS for looks
    notif.style.position = 'fixed';
    notif.style.bottom = '20px';
    notif.style.right = '20px';
    notif.style.padding = '10px 20px';
    notif.style.borderRadius = '5px';
    notif.style.color = 'white';
    notif.style.zIndex = '1000';
    notif.className = 'animate-fade-in-out'; // Use animation class

    switch (type) {
        case 'success':
            notif.style.backgroundColor = '#22c55e'; // green-500
            break;
        case 'error':
            notif.style.backgroundColor = '#ef4444'; // red-500
            break;
        default: // info
            notif.style.backgroundColor = '#3b82f6'; // blue-500
            break;
    }

    container.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 4500); // Should match animation duration
}

function typeText(text, elementId, duration) {
    return new Promise((resolve) => {
        const element = document.getElementById(elementId);
        if (!element) return resolve();

        let startTime = null;
        const totalDuration = duration || 1000;

        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / totalDuration, 1);
            const charCount = Math.floor(progress * text.length);
            
            // Avoid unnecessary DOM updates
            if (element.textContent.length !== charCount) {
                element.textContent = text.substring(0, charCount);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(animate);
    });
}

function untypeText(elementId, duration) {
    return new Promise((resolve) => {
        const element = document.getElementById(elementId);
        if (!element) return resolve();
        
        const text = element.textContent || "";
        if (text.length === 0) return resolve();
        
        let startTime = null;
        const totalDuration = duration || 1000;

        function animate(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / totalDuration, 1);
            const charCount = text.length - Math.floor(progress * text.length);

            // Avoid unnecessary DOM updates
            if (element.textContent.length !== charCount) {
                 element.textContent = text.substring(0, charCount);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = "\u00A0"; // Non-breaking space
                resolve();
            }
        }
        requestAnimationFrame(animate);
    });
}

function cycleSubtext() {
    const subtextElement = document.getElementById("logo-subtext");
    if (!subtextElement || activeTitleSubtext.length === 0) return;

    let newIndex = Math.floor(Math.random() * activeTitleSubtext.length);
    while (newIndex === currentTextIndex) {
        newIndex = Math.floor(Math.random() * activeTitleSubtext.length);
    }
    currentTextIndex = newIndex;
    const newText = activeTitleSubtext[currentTextIndex];

    untypeText("logo-subtext", 1000).then(() => {
        typeText(newText, "logo-subtext", 1000);
    });
}

function copyTextToClipboard(text) {
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
    showNotification("Copied to clipboard!", "success");
}

function adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}


// =============================
// Service Worker Registration
// =============================
function setupServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("/ttmp/service-worker.js") // Use absolute path for registration
            .then((registration) => console.log("[SW] Registered:", registration.scope))
            .catch((error) => console.error("[SW] Registration failed:", error));
    }
}
