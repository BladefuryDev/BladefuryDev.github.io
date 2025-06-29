// Handles shared functionality across the site like navbar loading,
// page transitions, and the image gallery modal.

document.addEventListener('DOMContentLoaded', function() {

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
            // The 'opacity: 0' is already set via inline style in the HTML.
            pageContainer.style.transform = 'translateX(50px)';

            // Use a short timeout to allow the browser to render the initial state
            // before applying the transition.
            setTimeout(() => {
                pageContainer.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
                pageContainer.style.transform = 'translateX(0)';
                pageContainer.style.opacity = '1';
            }, 50);
        }
    };

    /**
     * Adds slide-out animations to all internal links to create a page transition effect.
     */
    const initLinkTransitions = () => {
        const pageContainer = document.getElementById('page-container');
        if (!pageContainer) return;

        document.body.addEventListener('click', e => {
            const link = e.target.closest('a');

            if (!link || !link.href) return;

            // Let the browser handle new tabs, external links, and same-page hash links
            if (link.target === '_blank' || link.protocol !== window.location.protocol || link.host !== window.location.host || link.pathname === window.location.pathname) {
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
        const imageContainers = document.querySelectorAll('.gallery-image-container');

        if (!modal || !modalImage || imageContainers.length === 0) return;

        imageContainers.forEach(container => {
            container.addEventListener('click', () => {
                const img = container.querySelector('img');
                if (img) {
                    modalImage.src = img.src;
                    modal.classList.add('is-visible');
                }
            });
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('is-visible');
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

            // First pass: look for an exact match (pathname + hash)
            navLinks.forEach(link => {
                const linkUrl = new URL(link.href);
                if (linkUrl.pathname === currentPathname && linkUrl.hash === currentHash) {
                    bestMatch = link;
                    hasExactMatch = true;
                }
            });

            // Second pass: if no exact match, find the best partial match (pathname only)
            if (!hasExactMatch) {
                navLinks.forEach(link => {
                    const linkUrl = new URL(link.href);
                    if (linkUrl.pathname === currentPathname && !linkUrl.hash) {
                        bestMatch = link;
                    }
                });
            }

            // Clear existing active classes and apply to the best match
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
     * If a page is restored from the cache, its exit animation class might still be present,
     * leaving the page blank. This removes the class to make the content visible again.
     */
    const initBfcacheFix = () => {
        window.addEventListener('pageshow', (event) => {
            // event.persisted is true if the page is being restored from the back-forward cache.
            if (event.persisted) {
                const pageContainer = document.getElementById('page-container');
                // If the page was exiting when it was cached, the animation will still be applied.
                // We remove the class to make the content visible again, restoring its initial state.
                if (pageContainer && pageContainer.classList.contains('page-is-exiting')) {
                    pageContainer.classList.remove('page-is-exiting');
                }
            }
        });
    };

    // Initialize all site functionality
    loadComponent('/assets/htmlAssets/navbar.html', 'navbar-placeholder', initActiveNav);
    loadComponent('/assets/htmlAssets/footer.html', 'footer-placeholder');
    initPageTransition();
    initImageModal();
    initLinkTransitions();
    initBfcacheFix();
});