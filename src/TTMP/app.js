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
    setupThemeSystem();
    runIntroAnimation().then(() => {
        console.log("Intro complete. Initializing main application.");
        
        loadDataFromStorage();
        setupFileUpload();
        setupEventListeners();
        setupNumberInputWheel();
        setupSettingsModal();
        setupFileEditorModal();
        setupAssetPickerModal();
        setupThemeEditorModal();
        setupNavigation();
        setupServiceWorker();

        typeText("ATLAS - Central - Authentication order recieved. Initializing assets...", "logo-subtext", 1500).then(() => {
            setInterval(cycleSubtext, 10000);
        });
    });
});

// --- PWA Installation Logic ---
let deferredPrompt;
const installSection = document.getElementById('pwa-install-section');
const installButton = document.getElementById('install-pwa-button');

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('App is already installed.');
} else {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installSection) installSection.classList.remove('hidden');
  });

  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') console.log('User accepted PWA installation');
      else console.log('User dismissed PWA installation');
      deferredPrompt = null;
      if (installSection) installSection.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installSection) installSection.classList.add('hidden');
    deferredPrompt = null;
    console.log('PWA was installed');
  });
}


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

        const cleanupAndResolve = () => {
            if (resolved) return;
            resolved = true;
            
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

        setTimeout(() => { if (navbar) navbar.classList.remove('opacity-0'); }, 500);
        setTimeout(() => {
            if (navItems) navItems.forEach((item, index) => setTimeout(() => item.classList.remove('opacity-0'), index * 100));
        }, 1000);
        setTimeout(() => { if (logo) logo.classList.add('shrink-fade'); }, 2500);
        setTimeout(() => {
            if (introLogoContainer) {
                introLogoContainer.classList.add('fade-out');
                introLogoContainer.addEventListener('animationend', cleanupAndResolve, { once: true });
            } else {
                cleanupAndResolve();
            }
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
    let currentPageHash = null; // Keep track of the current page

    function showPage(newHash, isInitialLoad = false) {
        const targetHash = Object.keys(pages).includes(newHash) ? newHash : defaultPage;
        const oldPageHash = currentPageHash;
        
        if (targetHash === oldPageHash && !isInitialLoad) return;

        const oldPage = pages[oldPageHash];
        const newPage = pages[targetHash];

        // Update active link style
        navLinks.forEach(link => {
            link.classList.toggle('nav-link-active', link.getAttribute('href') === targetHash);
        });

        // On initial load, just show the page without animation
        if (isInitialLoad || !oldPage) {
            Object.values(pages).forEach(p => { 
                if(p) p.classList.add('hidden');
            });
            if(newPage) newPage.classList.remove('hidden');
            currentPageHash = targetHash;
            return;
        }

        const oldIndex = pageOrder.indexOf(oldPageHash);
        const newIndex = pageOrder.indexOf(targetHash);

        let oldPageAnimation, newPageAnimation;

        // Determine animation direction based on page order
        if (newIndex > oldIndex) {
            // Sliding left (e.g., Dungeons to Overworld)
            oldPageAnimation = 'slide-out-to-left';
            newPageAnimation = 'slide-in-from-right';
        } else {
            // Sliding right (e.g., Overworld to Dungeons)
            oldPageAnimation = 'slide-out-to-right';
            newPageAnimation = 'slide-in-from-left';
        }

        // Prepare new page and start animations
        newPage.classList.remove('hidden');
        oldPage.classList.add(oldPageAnimation);
        newPage.classList.add(newPageAnimation);

        // Clean up classes after animations complete
        oldPage.addEventListener('animationend', function handler() {
            oldPage.classList.add('hidden');
            oldPage.classList.remove(oldPageAnimation);
            oldPage.removeEventListener('animationend', handler);
        });

        newPage.addEventListener('animationend', function handler() {
            newPage.classList.remove(newPageAnimation);
            newPage.removeEventListener('animationend', handler);
        });

        currentPageHash = targetHash;
    }

    // Set initial page on load
    const initialHash = window.location.hash || defaultPage;
    showPage(initialHash, true);

    // Handle subsequent navigation
    window.addEventListener('hashchange', () => showPage(window.location.hash));
}



// =============================
// Data Handling & Processing
// =============================
function processGameData(jsonString, fileName) {
    const fileLabel = document.getElementById("load-file-ident");
    try {
        gameData = JSON.parse(jsonString);
        console.log("Successfully parsed game data:", gameData);

        updateDiagnostics(gameData);
        updateTitle(gameData.meta?.customTitleName || "Tome Tales Management Panel");
        activeTitleSubtext = gameData.meta?.textCrawl?.length ? gameData.meta.textCrawl : [...defaultTitleSubtext];
        currentTextIndex = -1;
        populateLocationDropdowns();
        populateOverworldDropdowns();

        const dataToStore = { fileName, content: jsonString };
        localStorage.setItem("savedJsonFile", JSON.stringify(dataToStore));
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

function loadDataFromStorage() {
    const savedJsonDataString = localStorage.getItem("savedJsonFile");
    if (savedJsonDataString) {
        console.log("Found saved file in localStorage, loading data...");
        try {
            const savedJsonData = JSON.parse(savedJsonDataString);
            if (savedJsonData.content && savedJsonData.fileName) {
                processGameData(savedJsonData.content, savedJsonData.fileName);
            }
        } catch (e) {
            console.error("Failed to load data from localStorage:", e);
            localStorage.removeItem("savedJsonFile");
        }
    }
}

async function loadSampleFileAndOpenEditor() {
    const fileLabel = document.getElementById("load-file-ident");
    if (fileLabel) fileLabel.textContent = `ℹ️ sample_data.json loading...`;
    try {
        const response = await fetch('./samples/sample_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonString = await response.text();
        processGameData(jsonString, 'sample_data.json');

        const editFileButton = document.getElementById('edit-file-button');
        if (editFileButton) {
            editFileButton.click();
        } else {
            console.error("Edit button not found, cannot open editor.");
            showNotification("Sample loaded, but failed to open editor.", "error");
        }
    } catch (error) {
        console.error("Could not load sample file:", error);
        if (fileLabel) fileLabel.textContent = `⚠️ Error loading sample.`;
        showNotification("Error loading sample file.", "error");
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
            el.classList.toggle("text-dim", count === 0);
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

function populateDropdown(selectId, dataArray, nameField = 'name', idField = 'id') {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    if (!gameData || !dataArray || dataArray.length === 0) {
        select.innerHTML = `<option value="none">-- No data --</option>`;
        return;
    }
    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item[idField];
        option.textContent = item[nameField];
        select.appendChild(option);
    });
}

function populateLocationDropdowns() {
    populateDropdown("environment-select", gameData?.locations);
    populateDropdown("mission-area-dropdown", gameData?.locations);
    populateDropdown("job-destination-select", gameData?.locations);
}

function populateOverworldDropdowns() {
    populateDropdown("loot-box-select", gameData?.loot_boxes);
    populateDropdown("job-client-select", gameData?.quest_givers);
    populateDropdown("job-mission-type-select", gameData?.mission_types);
    populateDropdown("job-hostile-faction-select", gameData?.factions);
}



// =============================
// Output Stack Logic
// =============================
function addCardWithFormattedText(standardText, discordText = null, stackId) {
    const stack = document.getElementById(stackId);
    if (!stack) return;
    const placeholder = document.getElementById(`${stackId.replace('-stack', '')}-placeholder`);
    if (placeholder) placeholder.style.display = 'none';

    const template = document.getElementById('output-card-template');
    if (!template) return;

    const newCard = template.firstElementChild.cloneNode(true);
    
    newCard.dataset.standardText = standardText;
    newCard.dataset.discordText = discordText || '';

    const textarea = newCard.querySelector('textarea');
    const timestampLabel = newCard.querySelector('.timestamp-text'); // Corrected class
    const copyBtn = newCard.querySelector('.copy-btn');
    const discordToggleBtn = newCard.querySelector('.discord-copy-btn');
    
    textarea.value = standardText;
    if (timestampLabel) timestampLabel.textContent = new Date().toLocaleTimeString(); // Check if element exists
    copyBtn.onclick = () => copyTextToClipboard(textarea.value);

    if (discordText) {
        discordToggleBtn.style.display = 'inline-block';
        discordToggleBtn.onclick = () => {
            const isStandardView = discordToggleBtn.textContent === 'Discord';
            textarea.value = isStandardView ? newCard.dataset.discordText : newCard.dataset.standardText;
            discordToggleBtn.textContent = isStandardView ? 'Normal' : 'Discord';
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
    if (!stack) return;
    const placeholder = document.getElementById(`${stackId.replace('-stack', '')}-placeholder`);
    stack.querySelectorAll('.output-card-bg').forEach(card => card.remove());
    if (placeholder) placeholder.style.display = 'block';
}

// =============================
// Helper Functions
// =============================
/**
 * Parses a loot item string to extract its name and quantity.
 * Handles formats like "x5 Item", "Item x5", "10k Bp", and "Item".
 * @param {string} itemString - The string from the loot table.
 * @returns {{name: string, quantity: number}}
 */
function parseLootItem(itemString) {
    const str = itemString.trim();

    // Pattern: "x5 Item Name"
    let match = str.match(/^x(\d+)\s+(.+)/i);
    if (match) {
        return { name: match[2].trim(), quantity: parseInt(match[1], 10) };
    }

    // Pattern: "Item Name x5"
    match = str.match(/(.+?)\s+x(\d+)$/i);
    if (match) {
        return { name: match[1].trim(), quantity: parseInt(match[2], 10) };
    }

    // Pattern: "10k Bp" or "100K Bp"
    match = str.match(/^(\d+)k\s+Bp$/i);
    if (match) {
        return { name: 'Bp', quantity: parseInt(match[1], 10) * 1000 };
    }

    // Default: "Item Name" (no quantity specified)
    return { name: str, quantity: 1 };
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
        // Get a random item string from the loot box contents
        const randomItemString = lootBox.contents[Math.floor(Math.random() * lootBox.contents.length)];
        
        // Parse the string to get the item name and quantity
        const parsedItem = parseLootItem(randomItemString);

        // Add the parsed quantity to the results
        results[parsedItem.name] = (results[parsedItem.name] || 0) + parsedItem.quantity;
    }

    let standardOutput = `Opened ${quantity} x ${lootBox.name}\n--------------------\nReceived:\n`;
    let discordOutput = `Opened **${quantity}x ${lootBox.name}** and found:\n`;

    if (Object.keys(results).length === 0 && quantity > 0) {
         standardOutput += "Nothing of value.";
         discordOutput += "Nothing of value.";
    } else {
        for (const [item, count] of Object.entries(results)) {
            standardOutput += `  - ${item} (x${count})\n`;
            discordOutput += `  - ${item} (x${count})\n`;
        }
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
    document.getElementById('new-file-button')?.addEventListener('click', loadSampleFileAndOpenEditor);
    document.getElementById('encounter-execute-button')?.addEventListener('click', generateEncounter);
    document.getElementById('enemy-execute-button')?.addEventListener('click', generateEnemies);
    document.getElementById('loot-box-execute-button')?.addEventListener('click', openLootBoxes);
    document.getElementById('job-builder-execute-button')?.addEventListener('click', generateJob);

    document.getElementById('clear-dungeons-output-button')?.addEventListener('click', () => clearOutputStack('output-stack'));
    document.getElementById('clear-overworld-output-button')?.addEventListener('click', () => clearOutputStack('overworld-output-stack'));

    const includeBossesToggle = document.getElementById('include-bosses');
    const bossSlider = document.getElementById('boss-spawn-slider');
    const bossChanceLabel = document.getElementById('boss-spawn-chance-label');
    if(includeBossesToggle && bossSlider && bossChanceLabel) {
        includeBossesToggle.addEventListener('change', () => bossSlider.disabled = !includeBossesToggle.checked);
        bossSlider.addEventListener('input', () => bossChanceLabel.textContent = `${bossSlider.value}%`);
    }
    
    const rewardTierSlider = document.getElementById('job-reward-tier');
    const rewardTierLabel = document.getElementById('job-reward-tier-label');
    if(rewardTierSlider && rewardTierLabel) {
        rewardTierSlider.addEventListener('input', () => rewardTierLabel.textContent = `Tier ${rewardTierSlider.value}`);
    }
}

function setupNumberInputWheel() {
    const numberInputs = document.querySelectorAll('input[type="number"]');

    numberInputs.forEach(input => {
        input.addEventListener('wheel', event => {
            // Prevent default page scroll
            event.preventDefault();

            // Determine increment or decrement
            const step = event.deltaY < 0 ? 1 : -1;

            // Get current value and constraints
            const min = input.min === '' ? -Infinity : parseInt(input.min, 10);
            const max = input.max === '' ? Infinity : parseInt(input.max, 10);
            let currentValue = parseInt(input.value, 10);

            // If value is not a number, default to 0 or min if it's set
            if (isNaN(currentValue)) {
                currentValue = min !== -Infinity ? min : 0;
            }

            // Calculate new value and clamp it
            const newValue = Math.max(min, Math.min(max, currentValue + step));

            // Update if value has changed
            if (newValue !== currentValue) {
                input.value = newValue;
                // Trigger input event for other scripts to pick up the change
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, { passive: false });
    });
}


// =============================
// Settings Modal Logic
// =============================
const defaultTheme = {
    "name": "Dark (Default)",
    "author": "TTMP",
    "colors": {
        "bgPrimary": "#1f2937", "bgSecondary": "#111827", "bgTertiary": "#4b5563", "bgInteractive": "#6b7280",
        "bgInteractiveHover": "#e5e7eb", "bgOutputCard": "#4b5563", "bgOutputTextarea": "#f3f4f6",
        "bgModalOverlay": "rgba(0, 0, 0, 0.5)", "textPrimary": "#ffffff", "textSecondary": "#9ca3af",
        "textTertiary": "#6b7280", "textAccent": "#000000", "textLink": "#ffffff", "accentPrimary": "#3b82f6",
        "textOutputTextarea": "#000000",
        "accentPrimaryHover": "#93c5fd", "accentSecondary": "#22c55e", "accentSecondaryHover": "#86efac",
        "accentTertiary": "#ca8a04", "accentTertiaryHover": "#fde047", "accentDiscord": "#6366f1",
        "accentDiscordHover": "#818cf8", "border": "#374151", "ringPrimary": "#93c5fd", "ringDiscord": "#a5b4fc",
        "sliderThumb": "#60a5fa", "toggleBg": "#4b5563", "toggleBgChecked": "#22c55e", "toggleFg": "#ffffff"
    }
};

const lightTheme = {
  "name": "Light",
  "author": "Gemini",
  "colors": {
    "bgPrimary": "#e5e7eb",
    "bgSecondary": "#ffffff",
    "bgTertiary": "#9ca3af",
    "bgInteractive": "#d1d5db",
    "bgInteractiveHover": "#9ca3af",
    "bgOutputCard": "#d1d5db",
    "bgOutputTextarea": "#ffffff",
    "bgModalOverlay": "rgba(0, 0, 0, 0.4)",
    "textPrimary": "#111827",
    "textSecondary": "#4b5563",
    "textTertiary": "#6b7280",
    "textAccent": "#ffffff",
    "textOutputTextarea": "#111827",
    "textLink": "#111827",
    "accentPrimary": "#3b82f6",
    "accentPrimaryHover": "#60a5fa",
    "accentSecondary": "#22c55e",
    "accentSecondaryHover": "#86efac",
    "accentTertiary": "#ca8a04",
    "accentTertiaryHover": "#fde047",
    "accentDiscord": "#6366f1",
    "accentDiscordHover": "#818cf8",
    "border": "#9ca3af",
    "ringPrimary": "#3b82f6",
    "ringDiscord": "#6366f1",
    "sliderThumb": "#3b82f6",
    "toggleBg": "#d1d5db",
    "toggleBgChecked": "#22c55e",
    "toggleFg": "#ffffff"
  }
};

function setupSettingsModal() {
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const settingsPanel = document.getElementById('settings-modal-panel');
    const closeButton = document.getElementById('settings-close-button');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-button');

    if (!settingsButton || !settingsModal || !settingsPanel || !closeButton) return;

    const openModal = () => {
        // Load saved API key when modal opens
        if (apiKeyInput) {
            apiKeyInput.value = localStorage.getItem('userApiKey') || '';
        }
        settingsModal.classList.remove('hidden');
        settingsModal.classList.remove('modal-animate-fade-out');
        settingsPanel.classList.remove('modal-panel-animate-out');
        settingsModal.classList.add('modal-animate-fade-in');
        settingsPanel.classList.add('modal-panel-animate-in');
    };
    
    const closeModal = () => {
        settingsModal.classList.remove('modal-animate-fade-in');
        settingsPanel.classList.remove('modal-panel-animate-in');
        settingsModal.classList.add('modal-animate-fade-out');
        settingsPanel.classList.add('modal-panel-animate-out');
        setTimeout(() => settingsModal.classList.add('hidden'), 200);
    };

    settingsButton.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    closeButton.addEventListener('click', closeModal);
    settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) closeModal(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !settingsModal.classList.contains('hidden')) closeModal(); });

    // Save API key
    if (saveApiKeyButton && apiKeyInput) {
        saveApiKeyButton.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (apiKey) {
                localStorage.setItem('userApiKey', apiKey);
                showNotification('API Key saved!', 'success');
            } else {
                localStorage.removeItem('userApiKey');
                showNotification('API Key removed.', 'info');
            }
        });
    }
}

function applyTheme(theme) {
    if (!theme || !theme.colors) {
        console.error("Invalid theme object provided.");
        return;
    }
    const root = document.documentElement;
    // Correctly map theme color names to CSS variable names
    for (const [key, value] of Object.entries(theme.colors)) {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVarName, value);
    }
    
    // Update the custom dropdown button text instead of a select element
    const selectedThemeNameEl = document.getElementById('selected-theme-name');
    if (selectedThemeNameEl) {
        selectedThemeNameEl.textContent = theme.name;
    }
    console.log(`Theme "${theme.name}" applied.`);
}

function registerTheme(theme) {
    if (!theme || !theme.name || !theme.colors) return;
    availableThemes[theme.name] = theme;
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect && !themeSelect.querySelector(`option[value="${theme.name}"]`)) {
        const option = document.createElement('option');
        option.value = theme.name;
        option.textContent = theme.name;
        themeSelect.appendChild(option);
    }
}

function populateThemeDropdown() {
    const themeOptionsContainer = document.getElementById('theme-options');
    if (!themeOptionsContainer) return;

    themeOptionsContainer.innerHTML = ''; // Clear existing options

    const userThemeNames = (JSON.parse(localStorage.getItem("userThemes")) || []).map(t => t.name);

    Object.values(availableThemes).forEach(theme => {
        const isUserTheme = userThemeNames.includes(theme.name);
        // Built-in themes should not be deletable
        const isDefaultTheme = theme.name === defaultTheme.name || theme.name === lightTheme.name;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'theme-option-item text-main cursor-pointer p-2 flex justify-between items-center';
        optionDiv.dataset.themeName = theme.name;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = theme.name;
        optionDiv.appendChild(nameSpan);

        // Add a delete button only for user-uploaded themes
        if (isUserTheme && !isDefaultTheme) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times;'; // A simple 'X' character
            deleteBtn.className = 'delete-theme-btn btn btn-danger rounded-full w-6 h-6 flex items-center justify-center text-base leading-none';
            deleteBtn.title = `Delete ${theme.name}`;
            deleteBtn.dataset.themeName = theme.name;
            
            deleteBtn.onclick = (e) => {
                e.stopPropagation(); // Prevent the click from also applying the theme
                deleteTheme(theme.name);
            };
            optionDiv.appendChild(deleteBtn);
        }
        
        // Event listener to apply the theme when an option is clicked
        optionDiv.addEventListener('click', () => {
            const themeToApply = availableThemes[theme.name];
            if (themeToApply) {
                applyTheme(themeToApply);
                localStorage.setItem("lastSelectedTheme", theme.name);
                showNotification(`Theme set to ${theme.name}`, 'info');
                // Hide the dropdown after selection
                document.getElementById('theme-options').classList.add('hidden');
                document.getElementById('theme-chevron').classList.remove('rotate-180');
            }
        });

        themeOptionsContainer.appendChild(optionDiv);
    });
}

function deleteTheme(themeName) {
    // 1. Remove the theme from localStorage
    let userThemes = JSON.parse(localStorage.getItem("userThemes")) || [];
    userThemes = userThemes.filter(t => t.name !== themeName);
    localStorage.setItem("userThemes", JSON.stringify(userThemes));

    // 2. Remove the theme from the runtime `availableThemes` object
    delete availableThemes[themeName];

    // 3. Check if the deleted theme was the currently active one
    const lastSelected = localStorage.getItem("lastSelectedTheme");
    if (lastSelected === themeName) {
        // If so, revert to the default theme
        localStorage.setItem("lastSelectedTheme", defaultTheme.name);
        applyTheme(defaultTheme);
    }

    // 4. Repopulate the dropdown to reflect the deletion
    populateThemeDropdown();

    showNotification(`Theme "${themeName}" deleted.`, 'info');
}

function setupThemeSystem() {
    // 1. Register built-in themes by adding them to the availableThemes object.
    availableThemes[defaultTheme.name] = defaultTheme;
    availableThemes[lightTheme.name] = lightTheme;

    // 2. Load user-uploaded themes from storage.
    try {
        const userThemes = JSON.parse(localStorage.getItem("userThemes"));
        if (Array.isArray(userThemes)) {
            // Add user themes to the availableThemes object.
            userThemes.forEach(theme => {
                if (theme && theme.name) {
                    availableThemes[theme.name] = theme;
                }
            });
        }
    } catch (e) {
        console.error("Failed to load user themes from localStorage:", e);
        localStorage.removeItem("userThemes"); // Clear corrupted data.
    }

    // 3. Populate the new custom dropdown UI
    populateThemeDropdown();

    // 4. Load and apply the last-selected theme.
    try {
        const lastSelectedThemeName = localStorage.getItem("lastSelectedTheme");
        const themeToApply = availableThemes[lastSelectedThemeName] || defaultTheme;
        applyTheme(themeToApply);
    } catch (e) {
        console.error("Failed to load last selected theme, using default:", e);
        applyTheme(defaultTheme);
    }

    // 5. Set up event listeners for theme controls.
    setupThemeControls();
}

function exportCurrentTheme() {
    const lastSelectedThemeName = localStorage.getItem("lastSelectedTheme") || defaultTheme.name;
    const themeToExport = availableThemes[lastSelectedThemeName] || defaultTheme;

    if (!themeToExport) {
        showNotification("Could not find current theme to export.", "error");
        return;
    }

    // Construct filename as requested: TTMP-Theme-THEMENAME.json
    const fileName = `TTMP-Theme-${themeToExport.name}.json`;

    const jsonString = JSON.stringify(themeToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setupThemeControls() {
    const exportButton = document.getElementById('export-theme-button');
    const uploadButton = document.getElementById('upload-theme-button');
    const themeInput = document.getElementById('theme-loader');
    
    // Custom dropdown elements
    const dropdownButton = document.getElementById('theme-select-button');
    const themeOptions = document.getElementById('theme-options');
    const themeChevron = document.getElementById('theme-chevron');

    if (exportButton) exportButton.addEventListener('click', exportCurrentTheme);
    
    if (uploadButton && themeInput) {
        uploadButton.addEventListener('click', () => themeInput.click());
        themeInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const newTheme = JSON.parse(e.target.result);
                        if (newTheme.name && newTheme.colors) {
                            let userThemes = JSON.parse(localStorage.getItem("userThemes")) || [];
                            userThemes = userThemes.filter(t => t.name !== newTheme.name);
                            userThemes.push(newTheme);
                            localStorage.setItem("userThemes", JSON.stringify(userThemes));

                            availableThemes[newTheme.name] = newTheme; // Add to runtime object
                            populateThemeDropdown(); // Re-draw the dropdown
                            applyTheme(newTheme);
                            localStorage.setItem("lastSelectedTheme", newTheme.name);
                            showNotification(`Theme "${newTheme.name}" loaded and saved!`, 'success');
                        } else {
                            showNotification("Invalid theme file.", 'error');
                        }
                    } catch (error) {
                        showNotification("Error parsing theme file.", 'error');
                    }
                };
                reader.readAsText(file);
            } else if (file) {
                showNotification("Please select a valid .json theme file.", 'error');
            }
            themeInput.value = '';
        });
    }

    // Logic for custom dropdown interactivity
    if (dropdownButton && themeOptions && themeChevron) {
        // Toggle dropdown visibility on button click
        dropdownButton.addEventListener('click', () => {
            const isHidden = themeOptions.classList.toggle('hidden');
            themeChevron.classList.toggle('rotate-180', !isHidden);
        });

        // Close dropdown if clicking anywhere else on the page
        window.addEventListener('click', (e) => {
            const container = document.getElementById('theme-dropdown-container');
            if (container && !container.contains(e.target)) {
                themeOptions.classList.add('hidden');
                themeChevron.classList.remove('rotate-180');
            }
        });
    }
}

// =============================
// Theme Editor Modal Logic
// =============================
function setupThemeEditorModal() {
    const openButton = document.getElementById('create-theme-button');
    const modal = document.getElementById('theme-editor-modal');
    const panel = document.getElementById('theme-editor-modal-panel');
    const closeButton = document.getElementById('theme-editor-close-button');
    const cancelButton = document.getElementById('theme-editor-cancel-button');
    const saveButton = document.getElementById('theme-editor-save-button');
    const colorsContainer = document.getElementById('theme-editor-colors');
    const themeNameInput = document.getElementById('theme-editor-name');
    const themeAuthorInput = document.getElementById('theme-editor-author');
    const previewArea = document.getElementById('theme-editor-preview-area');

    if (!openButton || !modal || !panel || !closeButton || !saveButton || !colorsContainer || !previewArea) return;

    let activeEditingTheme = {};
    let originalThemeBeforeEdit = {};

    const openModal = () => {
        const lastSelectedThemeName = localStorage.getItem("lastSelectedTheme") || defaultTheme.name;
        const baseTheme = availableThemes[lastSelectedThemeName] || defaultTheme;

        originalThemeBeforeEdit = JSON.parse(JSON.stringify(baseTheme));
        activeEditingTheme = JSON.parse(JSON.stringify(baseTheme));

        // Populate form fields with the data of the theme being edited
        themeNameInput.value = activeEditingTheme.name || '';
        themeAuthorInput.value = activeEditingTheme.author || '';

        populateEditor(activeEditingTheme, previewArea);
        applyThemeToPreview(activeEditingTheme, previewArea);

        modal.classList.remove('hidden');
        modal.classList.remove('modal-animate-fade-out');
        panel.classList.remove('modal-panel-animate-out');
        modal.classList.add('modal-animate-fade-in');
        panel.classList.add('modal-panel-animate-in');
    };

    const closeModal = () => {
        modal.classList.remove('modal-animate-fade-in');
        panel.classList.remove('modal-panel-animate-in');
        modal.classList.add('modal-animate-fade-out');
        panel.classList.add('modal-panel-animate-out');
        setTimeout(() => modal.classList.add('hidden'), 200);

        // Restore the original theme from before the editor was opened
        applyTheme(originalThemeBeforeEdit);
        // Clear inline styles from the preview area
        previewArea.removeAttribute('style');
        previewArea.style.backgroundColor = 'var(--color-bg-primary)';
    };

    const populateEditor = (theme, previewEl) => {
        colorsContainer.innerHTML = '';
        colorsContainer.className = 'flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 gap-y-3';
        for (const key of Object.keys(defaultTheme.colors)) {
            if (!theme.colors.hasOwnProperty(key)) continue;
            const value = theme.colors[key];

            const colorItem = document.createElement('div');
            colorItem.className = 'flex flex-col space-y-1';

            const labelText = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const label = `<label class="text-dim text-xs sm:text-sm mb-1 truncate" title="${labelText}">${labelText}</label>`;

            const inputWrapper = document.createElement('div');
            inputWrapper.className = 'flex items-center gap-2 p-1 rounded-lg input-bg border modal-border';

            const colorPicker = document.createElement('input');
            colorPicker.type = 'color';
            colorPicker.value = value;
            colorPicker.className = 'w-6 h-6 sm:w-8 sm:h-8 p-0 border-none rounded cursor-pointer bg-transparent';

            const hexInput = document.createElement('input');
            hexInput.type = 'text';
            hexInput.value = value;
            hexInput.className = 'flex-grow bg-transparent text-main text-xs sm:text-sm focus:outline-none font-mono';
            hexInput.setAttribute('aria-label', `${labelText} hex value`);

            colorPicker.addEventListener('input', (e) => {
                hexInput.value = e.target.value;
                activeEditingTheme.colors[key] = e.target.value;
                applyThemeToPreview(activeEditingTheme, previewEl);
            });
            hexInput.addEventListener('change', (e) => {
                let val = e.target.value.toLowerCase();
                if (!val.startsWith('#')) val = '#' + val;

                if (/^#([0-9a-f]{3}){1,2}$/i.test(val)) {
                     if (val.length === 4) {
                        val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
                    }
                    colorPicker.value = val;
                    hexInput.value = val;
                    activeEditingTheme.colors[key] = val;
                    applyThemeToPreview(activeEditingTheme, previewEl);
                } else {
                    hexInput.value = activeEditingTheme.colors[key];
                }
            });

            inputWrapper.appendChild(colorPicker);
            inputWrapper.appendChild(hexInput);
            colorItem.innerHTML = label;
            colorItem.appendChild(inputWrapper);
            colorsContainer.appendChild(colorItem);
        }
    };

    const saveTheme = () => {
        const newName = themeNameInput.value.trim();
        const newAuthor = themeAuthorInput.value.trim();

        if (!newName) {
            return showNotification("Theme name is required.", "error");
        }
        if (availableThemes[newName] && availableThemes[newName].author !== 'TTMP' && availableThemes[newName].author !== 'Gemini') {
             return showNotification(`A custom theme named "${newName}" already exists.`, "error");
        }

        activeEditingTheme.name = newName;
        activeEditingTheme.author = newAuthor || "Unknown";

        let userThemes = JSON.parse(localStorage.getItem("userThemes")) || [];
        userThemes = userThemes.filter(t => t.name !== newName);
        userThemes.push(activeEditingTheme);
        localStorage.setItem("userThemes", JSON.stringify(userThemes));

        availableThemes[newName] = activeEditingTheme;
        localStorage.setItem("lastSelectedTheme", newName);
        populateThemeDropdown();
        applyTheme(activeEditingTheme);

        showNotification(`Theme "${newName}" saved and applied!`, "success");
        modal.classList.remove('modal-animate-fade-in');
        panel.classList.remove('modal-panel-animate-in');
        modal.classList.add('modal-animate-fade-out');
        panel.classList.add('modal-panel-animate-out');
        setTimeout(() => modal.classList.add('hidden'), 200);
    };

    openButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveTheme);
}

// Helper function to apply theme edit colors to the preview element
function applyThemeToPreview(theme, previewElement) {
    if (!theme || !theme.colors || !previewElement) return;
    const root = previewElement.style;
    for (const [key, value] of Object.entries(theme.colors)) {
        const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.setProperty(cssVarName, value);
    }
}

// =============================
// File Editor Modal Logic
// =============================
function setupFileEditorModal() {
    const editFileButton = document.getElementById('edit-file-button');
    const fileEditorModal = document.getElementById('file-editor-modal');
    const fileEditorPanel = document.getElementById('file-editor-modal-panel');
    const closeButton = document.getElementById('file-editor-close-button');
    const saveButton = document.getElementById('file-editor-save-button');
    const saveAsButton = document.getElementById('file-editor-save-as-button');
    const visualEditorContainer = document.getElementById('visual-editor-container');

    if (!editFileButton || !fileEditorModal || !fileEditorPanel || !closeButton || !saveButton || !visualEditorContainer) return;

    const openModal = () => {
        if (!gameData) return showNotification("Please load a file before editing.", "error");
        const savedFile = JSON.parse(localStorage.getItem('savedJsonFile') || '{}');
        document.getElementById('file-editor-filename').textContent = savedFile.fileName || "Editing current data";
        renderVisualEditor();
        fileEditorModal.classList.remove('hidden');
        fileEditorModal.classList.remove('modal-animate-fade-out');
        fileEditorPanel.classList.remove('modal-panel-animate-out');
        fileEditorModal.classList.add('modal-animate-fade-in');
        fileEditorPanel.classList.add('modal-panel-animate-in');
    };

    const closeModal = () => {
        fileEditorModal.classList.remove('modal-animate-fade-in');
        fileEditorPanel.classList.remove('modal-panel-animate-in');
        fileEditorModal.classList.add('modal-animate-fade-out');
        fileEditorPanel.classList.add('modal-panel-animate-out');
        setTimeout(() => fileEditorModal.classList.add('hidden'), 200);
    };

    const saveAndClose = () => {
        const currentFilename = (JSON.parse(localStorage.getItem('savedJsonFile') || '{}')).fileName || 'edited_data.json';
        processGameData(JSON.stringify(gameData, null, 2), currentFilename);
        showNotification("File saved successfully!", "success");
        closeModal();
    };

    const saveAs = () => {
        const jsonString = JSON.stringify(gameData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (JSON.parse(localStorage.getItem('savedJsonFile') || '{}')).fileName || 'new_file.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    editFileButton.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    saveButton.addEventListener('click', saveAndClose);
    saveAsButton.addEventListener('click', saveAs);
    visualEditorContainer.addEventListener('input', handleEditorChange);
    visualEditorContainer.addEventListener('click', handleEditorClick);
}

function renderVisualEditor() {
    const container = document.getElementById('visual-editor-container');
    if (!container || !gameData) return;
    container.innerHTML = ''; 

    const sectionOrder = ['meta', 'locations', 'enemies', 'loot_boxes', 'quests', 'mission_types', 'factions', 'quest_givers'];
    
    sectionOrder.filter(key => gameData.hasOwnProperty(key)).forEach(sectionKey => {
        const sectionData = gameData[sectionKey];
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'card-nested-bg rounded-lg p-2 sm:p-4';
        
        let title = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/_/g, ' ');
        let headerHTML = `<div class="flex justify-between items-center mb-2 sm:mb-4"><h3 class="text-lg sm:text-xl font-bold card-title">${title}</h3>`;
        if (Array.isArray(sectionData)) {
            headerHTML += `<button class="btn btn-sm btn-secondary text-on-accent-hover" data-action="add-asset" data-section="${sectionKey}">+ Add</button>`;
        }
        headerHTML += `</div>`;
        sectionWrapper.innerHTML = headerHTML;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'space-y-4';
        if (Array.isArray(sectionData)) {
            sectionData.forEach((item, index) => contentWrapper.appendChild(createAssetCard(item, sectionKey, index)));
            if (sectionData.length === 0) contentWrapper.innerHTML = `<p class="text-dim text-center py-4">No items. Click "+ Add" to create one.</p>`;
        } else if (typeof sectionData === 'object' && sectionData !== null) {
            contentWrapper.appendChild(createAssetCard(sectionData, sectionKey, -1));
        }
        sectionWrapper.appendChild(contentWrapper);
        container.appendChild(sectionWrapper);
    });
}

function createAssetCard(itemData, sectionKey, index) {
    const card = document.createElement('div');
    card.className = 'relative card-bg p-2 sm:p-4 rounded-lg shadow-inner';
    if (index !== -1) {
        card.innerHTML = `<button class="absolute top-2 right-2 btn btn-danger btn-compact flex items-center justify-center w-6 h-6 leading-none text-xl" data-action="delete-asset" data-section="${sectionKey}" data-index="${index}" aria-label="Remove item">&minus;</button>`;
    }

    const formGrid = document.createElement('div');
    formGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2 sm:gap-y-3 pr-6 sm:pr-8';
    
    Object.keys(itemData).forEach(key => {
        if (key === 'id') return;
        formGrid.appendChild(createFieldInput(itemData[key], sectionKey, index, key));
    });
    
    card.appendChild(formGrid);
    return card;
}

function createFieldInput(value, sectionKey, index, key) {
    const fieldWrapper = document.createElement('div');
    const label = `<label class="block text-sm font-medium text-dim mb-1 capitalize">${key.replace(/_/g, ' ')}</label>`;
    const baseAttributes = `class="w-full rounded-md p-1 sm:p-2 text-sm input-bg input-text border modal-border" data-section="${sectionKey}" data-index="${index}" data-key="${key}"`;

    const linkableArrayKeys = { enemy_types: 'enemies', boss_types: 'enemies', loot_boxes: 'loot_boxes' };

    if (key === 'textCrawl' && sectionKey === 'meta') {
        fieldWrapper.className = 'md:col-span-2';
        fieldWrapper.innerHTML = label + createTextCrawlEditor(value, sectionKey, index, key);
    } else if (linkableArrayKeys[key] && Array.isArray(value)) {
        fieldWrapper.className = 'md:col-span-2';
        fieldWrapper.innerHTML = label + createLinkableArrayEditor(value, sectionKey, index, key, linkableArrayKeys[key]);
    } else if (typeof value === 'boolean') {
        fieldWrapper.className = 'flex items-center space-x-2 pt-4 sm:pt-6';
        const input = `<input type="checkbox" class="h-5 w-5 rounded text-blue-500 bg-gray-600 border-gray-500 focus:ring-blue-400" ${baseAttributes.replace('class="', 'class=" ')} ${value ? 'checked' : ''}>`;
        fieldWrapper.innerHTML = input + label;
    } else if (Array.isArray(value)) {
        let input;
        if (value.length > 0 && typeof value[0] === 'object') {
            input = `<textarea ${baseAttributes} rows="3" readonly>${JSON.stringify(value, null, 2)}</textarea><p class="text-xs text-dim mt-1">Complex arrays are read-only.</p>`;
        } else {
            input = `<textarea ${baseAttributes} rows="2" placeholder="Comma-separated values">${value.join(', ')}</textarea>`;
        }
        fieldWrapper.innerHTML = label + input;
    } else {
        const input = (typeof value === 'string' && value.length > 60)
            ? `<textarea ${baseAttributes} rows="2" sm:rows="3">${value}</textarea>`
            : `<input type="text" ${baseAttributes} value="${value}">`;
        fieldWrapper.innerHTML = label + input;
    }
    
    return fieldWrapper;
}

function createTextCrawlEditor(textArray, sectionKey, index, key) {
    const container = document.createElement('div');
    container.className = 'output-stack-bg p-2 rounded-md space-y-2';

    textArray.forEach((text, textIndex) => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'flex items-center gap-2';
        itemWrapper.innerHTML = `
            <input type="text" value="${text}" 
                   class="flex-grow rounded-md p-1 sm:p-2 text-sm input-bg input-text border modal-border"
                   data-section="${sectionKey}" data-index="${index}" data-key="${key}" data-text-index="${textIndex}">
            <button class="btn btn-danger w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 flex items-center justify-center"
                    data-action="delete-text-crawl" data-section="${sectionKey}" data-index="${index}" data-key="${key}" data-text-index="${textIndex}">&times;</button>
        `;
        container.appendChild(itemWrapper);
    });

    const addButton = document.createElement('button');
    addButton.className = 'btn btn-sm btn-secondary text-on-accent-hover mt-2 text-xs sm:text-sm';
    addButton.textContent = '+ Add Line';
    addButton.dataset.action = 'add-text-crawl';
    addButton.dataset.section = sectionKey;
    addButton.dataset.index = index;
    addButton.dataset.key = key;
    container.appendChild(addButton);

    return container.outerHTML;
}


function createLinkableArrayEditor(idArray, sectionKey, index, key, sourceSectionKey) {
    const container = document.createElement('div');
    container.className = 'output-stack-bg p-2 rounded-md space-y-2';

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'flex flex-wrap gap-2';

    idArray.forEach(id => {
        const sourceItem = gameData[sourceSectionKey]?.find(item => item.id === id);
        const name = sourceItem ? sourceItem.name : `[${id}]`;
        const tag = document.createElement('div');
        tag.className = 'btn-primary text-on-accent text-xs sm:text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1 sm:gap-2';
        tag.innerHTML = `<span>${name}</span><button data-action="remove-linked-asset" data-section="${sectionKey}" data-index="${index}" data-key="${key}" data-asset-id="${id}" class="text-on-accent hover:opacity-75">&times;</button>`;
        itemsContainer.appendChild(tag);
    });

    const addButton = document.createElement('button');
    addButton.className = 'btn btn-secondary text-on-accent-hover w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-lg';
    addButton.textContent = '+';
    addButton.dataset.action = 'open-asset-picker';
    addButton.dataset.section = sectionKey;
    addButton.dataset.index = index;
    addButton.dataset.key = key;
    addButton.dataset.source = sourceSectionKey;
    itemsContainer.appendChild(addButton);
    
    container.appendChild(itemsContainer);
    return container.outerHTML;
}

function handleEditorChange(event) {
    const target = event.target;
    const { section, index, key, textIndex } = target.dataset;
    if (!section || !key) return;

    let value = target.type === 'checkbox' ? target.checked : target.value;
    const dataObject = index === '-1' ? gameData[section] : gameData[section][index];

    if (textIndex !== undefined) {
        dataObject[key][parseInt(textIndex, 10)] = value;
    } else {
        const originalValue = dataObject[key];
        if (typeof originalValue === 'number') value = Number(value) || 0;
        else if (Array.isArray(originalValue) && !(originalValue.length > 0 && typeof originalValue[0] === 'object')) {
            value = value.split(',').map(s => s.trim()).filter(Boolean);
        }
        dataObject[key] = value;
    }
}

function handleEditorClick(event) {
    const button = event.target.closest('button');
    if (!button || !button.dataset.action) return;

    const { action, section, index, key, assetId, source, textIndex } = button.dataset;
    const dataObject = index === '-1' ? gameData[section] : gameData[section][index];

    if (action === 'delete-asset') {
        if (gameData[section]?.[index]) {
            gameData[section].splice(index, 1);
            renderVisualEditor();
        }
    } else if (action === 'add-asset') {
        const baseSchemas = {
            locations: { id: '', name: 'New Location', description: '', environmental_hazards: '', enemy_types: [], boss_types: [], berries: [], loot_boxes: [] },
            enemies: { id: '', name: 'New Enemy', is_boss: false, attacks: [], loot_table: [] },
            loot_boxes: { id: '', name: 'New Loot Box', contents: [] },
            quests: { name: 'New Quest', description: '', objectives: [] },
            mission_types: { id: '', name: 'New Mission Type', template: '' },
            factions: { id: '', name: 'New Faction' },
            quest_givers: { id: '', name: 'New Quest Giver' }
        };
        let newObject = baseSchemas[section] ? { ...baseSchemas[section] } : { name: "New Item" };
        if (newObject.hasOwnProperty('id')) newObject.id = `new_${section.slice(0, -1)}_${Date.now()}`;
        if (gameData[section]) {
            gameData[section].push(newObject);
            renderVisualEditor();
        }
    } else if (action === 'open-asset-picker') {
        openAssetPickerModal(section, index, key, source);
    } else if (action === 'add-linked-asset') {
        const targetArray = dataObject?.[key];
        if (targetArray && !targetArray.includes(assetId)) {
            targetArray.push(assetId);
            renderVisualEditor();
        }
    } else if (action === 'remove-linked-asset') {
        const targetArray = dataObject?.[key];
        const itemIndex = targetArray.indexOf(assetId);
        if (itemIndex > -1) {
            targetArray.splice(itemIndex, 1);
            renderVisualEditor();
        }
    } else if (action === 'add-text-crawl') {
        dataObject[key].push("New line");
        renderVisualEditor();
    } else if (action === 'delete-text-crawl') {
        dataObject[key].splice(parseInt(textIndex, 10), 1);
        renderVisualEditor();
    }
}


// =============================
// Asset Picker Modal
// =============================
function setupAssetPickerModal() {
    const modal = document.getElementById('asset-picker-modal');
    const panel = document.getElementById('asset-picker-modal-panel');
    const closeButton = document.getElementById('asset-picker-close-button');
    const searchInput = document.getElementById('asset-picker-search');
    const listContainer = document.getElementById('asset-picker-list');

    if (!modal || !panel || !closeButton || !searchInput || !listContainer) return;

    const closeModal = () => {
        modal.classList.remove('modal-animate-fade-in');
        panel.classList.remove('modal-panel-animate-in');
        modal.classList.add('modal-animate-fade-out');
        panel.classList.add('modal-panel-animate-out');
        setTimeout(() => modal.classList.add('hidden'), 200);
    };
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    searchInput.addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = listContainer.querySelectorAll('.asset-picker-item');
        items.forEach(item => {
            const name = item.dataset.name.toLowerCase();
            item.style.display = name.includes(searchTerm) ? '' : 'none';
        });
    });

    listContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action="add-linked-asset"]');
        if (button) {
            const { assetId, targetSection, targetIndex, targetKey } = button.dataset;
            const targetArray = gameData[targetSection]?.[targetIndex]?.[targetKey];
            if (targetArray && !targetArray.includes(assetId)) {
                targetArray.push(assetId);
                renderVisualEditor();
                button.disabled = true;
                button.textContent = '✓';
                showNotification('Asset added!', 'success');
            } else if (targetArray.includes(assetId)) {
                showNotification('Asset already in list.', 'info');
            }
        }
    });
}

function openAssetPickerModal(section, index, key, sourceSectionKey) {
    const modal = document.getElementById('asset-picker-modal');
    const panel = document.getElementById('asset-picker-modal-panel');
    const title = document.getElementById('asset-picker-title');
    const listContainer = document.getElementById('asset-picker-list');
    const searchInput = document.getElementById('asset-picker-search');

    if (!gameData || !gameData[sourceSectionKey]) return showNotification('Source data not found.', 'error');

    title.textContent = `Select ${sourceSectionKey.replace(/_/g, ' ')}`;
    listContainer.innerHTML = '';
    searchInput.value = '';

    let sourceArray = gameData[sourceSectionKey];
    const targetArray = gameData[section][index][key];

    // Filter for bosses if the key is 'boss_types'
    if (key === 'boss_types') {
        sourceArray = sourceArray.filter(enemy => enemy.is_boss === true);
        title.textContent = 'Select Boss'; // Update the title for clarity
    }

    sourceArray.forEach(item => {
        const isAlreadyAdded = targetArray.includes(item.id);
        const itemCard = document.createElement('div');
        itemCard.className = 'asset-picker-item flex justify-between items-center card-nested-bg p-1 sm:p-2 rounded-md';
        itemCard.dataset.name = item.name;
        
        itemCard.innerHTML = `
            <span class="text-main text-sm sm:text-base">${item.name}</span>
            <button 
                class="btn btn-secondary btn-compact w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-base sm:text-lg disabled:opacity-50"
                data-action="add-linked-asset"
                data-asset-id="${item.id}"
                data-target-section="${section}"
                data-target-index="${index}"
                data-target-key="${key}"
                ${isAlreadyAdded ? 'disabled' : ''}
            >
                ${isAlreadyAdded ? '✓' : '+'}
            </button>
        `;
        listContainer.appendChild(itemCard);
    });

    modal.classList.remove('hidden');
    modal.classList.remove('modal-animate-fade-out');
    panel.classList.remove('modal-panel-animate-out');
    modal.classList.add('modal-animate-fade-in');
    panel.classList.add('modal-panel-animate-in');
}


// =============================
// Core Utility Functions
// =============================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const notif = document.createElement('div');
    notif.textContent = message;
    notif.className = 'px-4 py-2 rounded-md text-white shadow-lg animate-fade-in-out';
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    notif.classList.add(colors[type] || colors.info);
    container.appendChild(notif);
    setTimeout(() => notif.remove(), 4500);
}

function typeText(text, elementId, duration) {
    return new Promise((resolve) => {
        const element = document.getElementById(elementId);
        if (!element) return resolve();
        let i = 0;
        element.textContent = "";
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, duration / text.length);
    });
}

function cycleSubtext() {
    const subtextElement = document.getElementById("logo-subtext");
    if (!subtextElement || activeTitleSubtext.length === 0) return;

    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * activeTitleSubtext.length);
    } while (newIndex === currentTextIndex && activeTitleSubtext.length > 1);

    currentTextIndex = newIndex;
    const newText = activeTitleSubtext[currentTextIndex];

    const fadeDuration = 500; // 0.5 seconds

    // Set transition for opacity for the fade-out
    subtextElement.style.transition = `opacity ${fadeDuration / 1000}s ease-out`;
    // Fade out
    subtextElement.style.opacity = 0;

    // After fade out, change text and make it visible before typing
    setTimeout(() => {
        // Remove the transition to make the opacity change instant
        subtextElement.style.transition = 'none';
        // Make the element fully visible
        subtextElement.style.opacity = 1;
        // Start the typing animation on the now-visible element
        typeText(newText, "logo-subtext", 1000);
    }, fadeDuration);
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification("Copied to clipboard!", "success");
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showNotification("Failed to copy.", "error");
    });
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
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax; Secure";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
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
            .register("./service-worker.js")
            .then(reg => console.log("[SW] Registered:", reg.scope))
            .catch(err => console.error("[SW] Registration failed:", err));
    }
}
