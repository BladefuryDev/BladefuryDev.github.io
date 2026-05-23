// Handles shared functionality across the site like navbar loading,
// page transitions, image gallery modal, and theme management.

// 1. Theme Controller IIFE - Run immediately on script evaluation to prevent flashes
(function() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    let activeTheme = savedTheme;
    if (savedTheme === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(activeTheme);
})();

document.addEventListener('DOMContentLoaded', function() {

    // --- THEME MANAGEMENT ---
    let currentTheme = localStorage.getItem('theme') || 'system';

    const applyTheme = (theme) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        root.classList.add(activeTheme);
        currentTheme = theme;
        localStorage.setItem('theme', theme);
        updateThemeToggleUI(theme);
    };

    const updateThemeToggleUI = (theme) => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        
        const icon = btn.querySelector('.theme-toggle-icon');
        const label = btn.querySelector('.theme-toggle-label');
        
        let iconHtml = '';
        let labelText = '';
        
        if (theme === 'light') {
            // Sun Icon
            iconHtml = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>`;
            labelText = 'Light';
        } else if (theme === 'dark') {
            // Moon Icon
            iconHtml = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`;
            labelText = 'Dark';
        } else {
            // CPU/System Icon
            iconHtml = `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
            labelText = 'System';
        }
        
        if (icon) icon.innerHTML = iconHtml;
        if (label) label.textContent = labelText;
    };

    const initThemeToggle = () => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        
        // Initial draw
        updateThemeToggleUI(currentTheme);
        
        btn.addEventListener('click', () => {
            let nextTheme = 'system';
            if (currentTheme === 'system') {
                nextTheme = 'light';
            } else if (currentTheme === 'light') {
                nextTheme = 'dark';
            } else {
                nextTheme = 'system';
            }
            applyTheme(nextTheme);
        });
    };

    // Watch OS preference shifts
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (currentTheme === 'system') {
            const nextTheme = e.matches ? 'dark' : 'light';
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(nextTheme);
        }
    });

    // --- TERMINAL SIMULATOR ---
    const initTerminal = () => {
        const termInput = document.getElementById('terminal-input-field');
        const termOutput = document.getElementById('terminal-output');
        const termForm = document.getElementById('terminal-form');
        const termShortcuts = document.querySelectorAll('[data-term-btn]');
        
        if (!termInput || !termOutput || !termForm) return;

        // Command definitions
        const commands = {
            help: () => `Available commands:<br>
  <span class="text-[--color-primary-light]">about</span>     - Learn more about who I am<br>
  <span class="text-[--color-primary-light]">projects</span>  - List highlighted projects with links<br>
  <span class="text-[--color-primary-light]">skills</span>    - Display technical skill breakdown<br>
  <span class="text-[--color-primary-light]">contact</span>   - Get in touch with me<br>
  <span class="text-[--color-primary-light]">clear</span>     - Clear the screen`,
            
            about: () => `<span class="text-[--color-primary-light] font-bold">[ Developer Profile: Hexfury ]</span><br>
------------------------------------<br>
ROLE:   Game Developer & Web Designer<br>
BIO:    I started with Lua scripting for game modules and software QA testing,<br>
        expanded into assembling and repairing PC hardware systems,<br>
        and now build custom, responsive web interfaces.<br>
------------------------------------<br>
Use '<span class="text-[--color-primary-light]">projects</span>' or '<span class="text-[--color-primary-light]">skills</span>' to view more details.`,
            
            projects: () => `<span class="text-[--color-primary-light] font-bold">[ Highlighted Projects ]</span><br>
------------------------------------<br>
1. <a href="src/Pages/StarfallLegacy.html" class="underline text-[--color-primary-light] hover:text-[--color-text]">Starfall Legacy</a><br>
   - Sci-fi PMD collaborative writing project.<br>
2. <a href="https://www.roblox.com/games/6647962258/Aeronautica" target="_blank" rel="noopener noreferrer" class="underline text-[--color-primary-light] hover:text-[--color-text]">Aeronautica</a><br>
   - Open-world flight simulator on Roblox (LUA scripting & admin tools).<br>
3. <a href="src/TTMP/index.html" class="underline text-[--color-primary-light] hover:text-[--color-text]">TTMP 2</a><br>
   - RPG management tool utilizing Lua (Fengari VM) and Tailwind CSS.<br>
4. <a href="src/Pages/STOEndeavourHelper.html" class="underline text-[--color-primary-light] hover:text-[--color-text]">Star Trek Online Endeavor Helper</a><br>
   - Practical companion guide utility for daily STO tasks.<br>
------------------------------------<br>
Select a link or visit the Projects page for full listings.`,
            
            skills: () => `<span class="text-[--color-primary-light] font-bold">[ Core Technical Skills ]</span><br>
------------------------------------<br>
LUA GAME DEV       <span class="text-[--color-primary-light]">[██████████░░] 85%</span><br>
WEB FRONTEND       <span class="text-[--color-primary-light]">[████████░░░░] 70%</span><br>
QA / DEBUGGING     <span class="text-[--color-primary-light]">[██████████░░] 85%</span><br>
PC HARDWARE        <span class="text-[--color-primary-light]">[███████████░] 90%</span><br>
DIGITAL ART        <span class="text-[--color-primary-light]">[███████░░░░░] 60%</span><br>
VIDEO PRODUCTION   <span class="text-[--color-primary-light]">[████████░░░░] 70%</span><br>
------------------------------------`,
            
            contact: () => `<span class="text-[--color-primary-light] font-bold">[ Contact Information ]</span><br>
------------------------------------<br>
YOUTUBE:  <a href="https://www.youtube.com/@Hexfury" target="_blank" rel="noopener noreferrer" class="underline hover:text-[--color-primary-light]">youtube.com/@Hexfury</a><br>
EMAIL:    <a href="mailto:christopher.bdf@gmail.com" class="underline hover:text-[--color-primary-light]">christopher.bdf@gmail.com</a><br>
GITHUB:   <a href="https://github.com/BladefuryDev" target="_blank" rel="noopener noreferrer" class="underline hover:text-[--color-primary-light]">github.com/BladefuryDev</a><br>
------------------------------------`
        };

        const typeHTML = (element, htmlText, durationMs = 1000) => {
            const tokens = [];
            let i = 0;
            while (i < htmlText.length) {
                if (htmlText[i] === '<') {
                    let tag = '';
                    while (i < htmlText.length && htmlText[i] !== '>') {
                        tag += htmlText[i];
                        i++;
                    }
                    if (i < htmlText.length) {
                        tag += '>';
                        i++;
                    }
                    tokens.push({ type: 'tag', value: tag });
                } else if (htmlText[i] === '&') {
                    let entity = '';
                    while (i < htmlText.length && htmlText[i] !== ';') {
                        entity += htmlText[i];
                        i++;
                    }
                    if (i < htmlText.length) {
                        entity += ';';
                        i++;
                    }
                    tokens.push({ type: 'char', value: entity });
                } else {
                    tokens.push({ type: 'char', value: htmlText[i] });
                    i++;
                }
            }

            if (tokens.length === 0) return;

            const charCount = tokens.filter(t => t.type === 'char').length;
            const totalTokens = tokens.length;
            const delay = charCount > 0 ? durationMs / charCount : 10;

            let currentTokenIndex = 0;
            element.innerHTML = '';

            const typeNext = () => {
                if (currentTokenIndex >= totalTokens) {
                    termOutput.scrollTop = termOutput.scrollHeight;
                    return;
                }

                const token = tokens[currentTokenIndex];
                currentTokenIndex++;

                if (token.type === 'tag') {
                    element.innerHTML += token.value;
                    typeNext();
                } else {
                    element.innerHTML += token.value;
                    termOutput.scrollTop = termOutput.scrollHeight;
                    setTimeout(typeNext, delay);
                }
            };

            typeNext();
        };

        const printLine = (text, isInput = false) => {
            const line = document.createElement('div');
            line.className = isInput ? 'text-[--color-text]' : 'text-[--color-text-muted] leading-relaxed';
            termOutput.appendChild(line);
            
            if (isInput) {
                line.innerHTML = text;
                termOutput.scrollTop = termOutput.scrollHeight;
            } else {
                typeHTML(line, text, 1000);
            }
        };

        const executeCommand = (cmdText) => {
            const trimmed = cmdText.trim().toLowerCase();
            printLine(`guest@hexfury-os:~$ ${cmdText}`, true);

            if (trimmed === '') return;

            if (trimmed === 'clear') {
                termOutput.innerHTML = '';
                return;
            }

            if (commands[trimmed]) {
                printLine(commands[trimmed]());
            } else {
                printLine(`Command not found: <span class="text-red-400">${cmdText}</span>. Type '<span class="text-[--color-primary-light]">help</span>' for options.`);
            }
        };

        const simulateCommand = (cmdText) => {
            termInput.disabled = true;
            termInput.value = '';
            
            let index = 0;
            const typeInterval = setInterval(() => {
                if (index < cmdText.length) {
                    termInput.value += cmdText[index];
                    index++;
                } else {
                    clearInterval(typeInterval);
                    termInput.disabled = false;
                    executeCommand(cmdText);
                    termInput.value = '';
                    termInput.focus();
                }
            }, 55);
        };

        // Form submit handler
        termForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = termInput.value;
            executeCommand(val);
            termInput.value = '';
        });

        // Click handlers for terminal shortcut tags
        termShortcuts.forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.getAttribute('data-term-btn');
                simulateCommand(cmd);
            });
        });

        // Print initial boot messages
        printLine(`<span class="text-emerald-400">> Loading profile components... Done.</span>`);
        printLine(`<span class="text-emerald-400">> Establishing server link... Connected.</span>`);
        printLine(`System active. Type '<span class="text-[--color-primary-light]">help</span>' or select shortcut buttons below to interact.<br>`);
    };


    // --- COMPONENT LOADERS ---

    /**
     * Fetches an HTML component and injects it into a placeholder element.
     * @param {string} componentPath - The path to the HTML component file.
     * @param {string} placeholderId - The ID of the element to inject the component into.
     * @param {() => void} [callback] - Optional callback to run after injection.
     */
    const loadComponent = (componentPath, placeholderId, callback) => {
        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok for ${componentPath}`);
                }
                return response.text();
            })
            .then(data => {
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) {
                    placeholder.innerHTML = data;
                    if (callback) {
                        callback();
                    }
                }
            })
            .catch(error => {
                console.error(`Error loading component from ${componentPath}:`, error);
            });
    };

    /**
     * Handles the slide-in animation for the page content.
     */
    const initPageTransition = () => {
        const pageContainer = document.getElementById('page-container');
        if (pageContainer) {
            // Set initial state for slide-in.
            pageContainer.style.transform = 'translateY(15px)';
            pageContainer.style.opacity = '0';

            setTimeout(() => {
                pageContainer.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                pageContainer.style.transform = 'translateY(0)';
                pageContainer.style.opacity = '1';
            }, 60);
        }
    };

    /**
     * Adds slide-out animations to all internal links to create a page transition effect.
     */
    const initLinkTransitions = () => {
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) return;

        document.body.addEventListener('click', e => {
            // Support view transition api if supported instead of manual timeout
            const link = e.target.closest('a');
            if (!link || !link.href) return;

            // Let the browser handle new tabs, external links, and same-page hash links
            if (link.target === '_blank' || link.protocol !== window.location.protocol || link.host !== window.location.host || link.pathname === window.location.pathname) {
                return;
            }

            // If View Transitions API is supported, let the browser animate it natively
            if (document.startViewTransition) {
                return; 
            }

            e.preventDefault();
            pageContainer.classList.add('page-is-exiting');
            setTimeout(() => { window.location.href = link.href; }, 200); // Match CSS animation duration
        });
    };

    const initImageModal = () => {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image-content');
        const tooltip = document.getElementById('image-tooltip');
        const imageContainers = document.querySelectorAll('.gallery-image-container');
        
        const btnTab = document.getElementById('modal-btn-tab');
        const btnDownload = document.getElementById('modal-btn-download');
        const btnClose = document.getElementById('modal-btn-close');

        if (!modal || !modalImage || !tooltip || imageContainers.length === 0) return;

        imageContainers.forEach(container => {
            const img = container.querySelector('img');
            if (!img) return;

            // Modal click listener
            container.addEventListener('click', () => {
                modalImage.src = img.src;
                if (btnTab) btnTab.href = img.src;
                if (btnDownload) btnDownload.href = img.src;
                modal.classList.add('is-visible');
            });

            // Tooltip hover listeners
            container.addEventListener('mouseenter', (e) => {
                const altText = img.getAttribute('alt');
                if (altText) {
                    tooltip.textContent = altText;
                    tooltip.style.left = `${e.pageX + 15}px`;
                    tooltip.style.top = `${e.pageY + 15}px`;
                    tooltip.classList.add('is-visible');
                }
            });

            container.addEventListener('mouseleave', () => {
                tooltip.classList.remove('is-visible');
            });

            container.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.pageX + 15}px`;
                tooltip.style.top = `${e.pageY + 15}px`;
            });
        });

        // Close modal listener (explicit close button)
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.classList.remove('is-visible');
            });
        }

        // Backdrop click to close (only if clicked outside the container)
        modal.addEventListener('click', (e) => {
            if (!e.target.closest('#image-modal-container')) {
                modal.classList.remove('is-visible');
            }
        });
    };

    /**
     * Finds the active navigation link based on the current URL and applies a style to it.
     * Listens for hash changes to update the active link.
     */
    const initActiveNav = () => {
        const setActiveLink = () => {
            const currentPathname = window.location.pathname;
            const currentHash = window.location.hash;
            const navLinks = document.querySelectorAll('nav ul a');

            let bestMatch = null;
            let hasExactMatch = false;

            navLinks.forEach(link => {
                const linkUrl = new URL(link.href);
                if (linkUrl.pathname === currentPathname && linkUrl.hash === currentHash) {
                    bestMatch = link;
                    hasExactMatch = true;
                }
            });

            if (!hasExactMatch) {
                navLinks.forEach(link => {
                    const linkUrl = new URL(link.href);
                    if (linkUrl.pathname === currentPathname && !linkUrl.hash) {
                        bestMatch = link;
                    }
                });
            }

            navLinks.forEach(link => link.classList.remove('active-nav-link'));
            if (bestMatch) {
                bestMatch.classList.add('active-nav-link');
            }
        };

        setActiveLink();
        window.addEventListener('hashchange', setActiveLink);
    };

    /**
     * Resets page state when navigating back/forward using browser history (bfcache).
     */
    const initBfcacheFix = () => {
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                const pageContainer = document.getElementById('page-container');
                if (pageContainer && pageContainer.classList.contains('page-is-exiting')) {
                    pageContainer.classList.remove('page-is-exiting');
                }
            }
        });
    };

    // Determine the relative path to the root of the repository
    const isSrcFolder = /\/src\/[^/]+$/i.test(window.location.pathname) || /\/src\/$/i.test(window.location.pathname);
    const basePath = isSrcFolder ? '../' : './';

    // Adjust navbar links to be relative to the current page depth
    const adjustNavbarLinks = (basePath) => {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
                link.setAttribute('href', basePath + href.substring(1));
            }
        });
    };

    // Initialize all site functionality
    loadComponent(`${basePath}assets/htmlAssets/navbar.html`, 'navbar-placeholder', () => {
        adjustNavbarLinks(basePath);
        initActiveNav();
        initThemeToggle();
    });
    loadComponent(`${basePath}assets/htmlAssets/footer.html`, 'footer-placeholder');
    
    initPageTransition();
    initImageModal();
    initLinkTransitions();
    initBfcacheFix();
    initTerminal(); // Auto-runs if terminal elements exist
});