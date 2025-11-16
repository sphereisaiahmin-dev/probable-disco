const SHELL_HEADER = 'saintjustus-shell';
const pageRoot = document.querySelector('[data-page-root]');
const bootstrapEl = document.querySelector('[data-page-bootstrap]');

if (pageRoot && bootstrapEl) {
    const bootstrapData = safeParse(bootstrapEl.textContent);
    bootstrapEl.remove();

    initShell(bootstrapData);
}

function safeParse(payload) {
    if (!payload) {
        return null;
    }
    try {
        return JSON.parse(payload);
    } catch (error) {
        console.error('app shell: failed to parse bootstrap payload', error);
        return null;
    }
}

function initShell(initialPage) {
    const moduleCache = new Map();
    const pageCache = new Map();
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const itempropMeta = document.querySelector('meta[itemprop="description"]');
    const windowPages = new Set(['art', 'work', 'music']);
    let activePath = normalisePath(window.location.pathname);
    let isNavigating = false;

    if (initialPage) {
        const currentFragment = pageRoot.querySelector('[data-page-fragment]');
        if (currentFragment) {
            pageCache.set(activePath, {
                payload: initialPage,
                node: currentFragment
            });
            applyPageMeta(initialPage);
            updateNavState(initialPage.id);
            window.history.replaceState({ path: initialPage.route }, '', window.location.pathname);
        }
    }

    if (initialPage?.id === 'home') {
        requestAnimationFrame(() => {
            animateHomeNavEntrance();
        });
    }

    async function navigateTo(url, { replace = false } = {}) {
        if (isNavigating) {
            return;
        }

        const target = new URL(url, window.location.origin);
        if (target.origin !== window.location.origin) {
            window.location.href = target.toString();
            return;
        }

        const nextPath = normalisePath(target.pathname);
        if (nextPath === activePath) {
            return;
        }

        isNavigating = true;
        try {
            let pageEntry = pageCache.get(nextPath);
            if (!pageEntry) {
                const payload = await requestPage(target);
                if (!payload) {
                    window.location.href = target.toString();
                    return;
                }
                const node = createFragment(payload.content);
                if (!node) {
                    window.location.href = target.toString();
                    return;
                }
                pageEntry = { payload, node };
                pageCache.set(nextPath, pageEntry);
                await loadModules(payload.modules);
            }

            await loadModules(pageEntry.payload.modules);
            mountPage(pageEntry, nextPath, { replaceState: replace, url: target });
        } catch (error) {
            console.error('app shell: navigation failed', error);
            window.location.href = target.toString();
        } finally {
            isNavigating = false;
        }
    }

    function mountPage(entry, path, { replaceState, url }) {
        unmountActivePage();
        clearPageRoot();
        pageRoot.appendChild(entry.node);
        activePath = path;
        const payload = entry.payload;
        applyPageMeta(payload);
        updateNavState(payload.id);
        updateHistory(url, payload, replaceState);
        window.__saintjustusAudioController?.hydrate?.({ pageId: payload.id });
        document.dispatchEvent(new CustomEvent('shell:navigation', { detail: { pageId: payload.id, route: payload.route } }));
        if (payload.id === 'home') {
            requestAnimationFrame(() => {
                animateHomeNavEntrance();
            });
        }
    }

    function unmountActivePage() {
        const currentEntry = pageCache.get(activePath);
        if (currentEntry?.node?.isConnected) {
            currentEntry.node.remove();
        }
    }

    function clearPageRoot() {
        while (pageRoot.firstChild) {
            pageRoot.removeChild(pageRoot.firstChild);
        }
    }

    function updateHistory(url, payload, replaceState) {
        const state = { path: payload.route };
        if (replaceState) {
            window.history.replaceState(state, '', `${url.pathname}${url.search}`);
        } else {
            window.history.pushState(state, '', `${url.pathname}${url.search}`);
        }
    }

    function applyPageMeta(payload) {
        if (payload.title) {
            document.title = payload.title;
            document.documentElement.dataset.page = payload.id;
            document.body?.setAttribute('data-route', payload.route);
        }
        if (payload.description) {
            if (descriptionMeta) {
                descriptionMeta.setAttribute('content', payload.description);
            }
            if (itempropMeta) {
                itempropMeta.setAttribute('content', payload.description);
            }
        }
    }

    function updateNavState(pageId) {
        const navLinks = document.querySelectorAll('[data-nav-link]');
        navLinks.forEach((link) => {
            if (link.dataset.navLink === pageId) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    async function loadModules(modules) {
        if (!Array.isArray(modules) || modules.length === 0) {
            return;
        }
        await Promise.all(
            modules.map((src) => {
                if (!moduleCache.has(src)) {
                    moduleCache.set(src, import(src));
                }
                return moduleCache.get(src);
            })
        );
    }

    async function requestPage(targetUrl) {
        const response = await fetch(`${targetUrl.pathname}${targetUrl.search}`, {
            headers: {
                'X-Requested-With': SHELL_HEADER,
                Accept: 'application/json'
            }
        });
        if (!response.ok) {
            return null;
        }
        const payload = await response.json();
        if (payload && payload.page) {
            return payload.page;
        }
        return null;
    }

    function createFragment(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        const fragmentNode = template.content.querySelector('[data-page-fragment]');
        const element = fragmentNode ? fragmentNode : template.content.firstElementChild;
        return element ? element : null;
    }

    function normalisePath(pathname) {
        if (!pathname) {
            return '/';
        }
        if (pathname.length > 1 && pathname.endsWith('/')) {
            return pathname.slice(0, -1);
        }
        return pathname;
    }

    function resolvePageIdFromPath(pathname) {
        const normalised = normalisePath(pathname);
        if (normalised === '/') {
            return 'home';
        }
        if (normalised === '/art') {
            return 'art';
        }
        if (normalised === '/work') {
            return 'work';
        }
        if (normalised === '/music') {
            return 'music';
        }
        return null;
    }

    function dispatchNavigationIntent(targetId) {
        document.dispatchEvent(new CustomEvent('shell:navigate-intent', { detail: { targetId } }));
        if (document.documentElement.dataset.page === 'home' && targetId && windowPages.has(targetId)) {
            animateHomeNavExit(targetId);
        }
    }

    function animateHomeNavExit(targetId) {
        if (!targetId) {
            return;
        }
        const navContainer = document.querySelector('.nav-links');
        if (!navContainer) {
            return;
        }
        const navLinks = Array.from(navContainer.querySelectorAll('[data-nav-link]'));
        if (!navLinks.length) {
            return;
        }
        const targetIndex = navLinks.findIndex((link) => link.dataset.navLink === targetId);
        if (targetIndex === -1) {
            return;
        }
        const maxDistance = Math.max(...navLinks.map((_, index) => Math.abs(index - targetIndex)));
        navLinks.forEach((link, index) => {
            const distance = Math.abs(index - targetIndex);
            const delay = (maxDistance - distance) * 90;
            link.style.setProperty('--nav-transition-delay', `${delay}ms`);
            link.classList.remove('nav-link--fade-in');
            link.classList.add('nav-link--fade-out');
        });
    }

    function animateHomeNavEntrance() {
        const navContainer = document.querySelector('.nav-links');
        if (!navContainer) {
            return;
        }
        const navLinks = Array.from(navContainer.querySelectorAll('[data-nav-link]'));
        if (!navLinks.length) {
            return;
        }
        navLinks.forEach((link, index) => {
            link.classList.remove('nav-link--fade-out');
            link.classList.remove('nav-link--fade-in');
            link.style.setProperty('--nav-transition-delay', `${index * 90}ms`);
            requestAnimationFrame(() => {
                link.classList.add('nav-link--fade-in');
            });
        });
    }

    document.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }
        const anchor = event.target.closest('a');
        if (
            !anchor ||
            (anchor.target && anchor.target !== '_self') ||
            anchor.hasAttribute('download') ||
            anchor.getAttribute('rel') === 'external'
        ) {
            return;
        }
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) {
            return;
        }
        let url;
        try {
            url = new URL(anchor.href, window.location.origin);
        } catch (error) {
            return;
        }
        if (url.origin !== window.location.origin) {
            return;
        }
        event.preventDefault();
        const targetPageId = anchor.dataset.navLink || resolvePageIdFromPath(url.pathname);
        dispatchNavigationIntent(targetPageId);
        navigateTo(`${url.pathname}${url.search}`);
    });

    window.addEventListener('popstate', (event) => {
        const nextPath = normalisePath(window.location.pathname);
        if (nextPath === activePath) {
            return;
        }
        const cached = pageCache.get(nextPath);
        if (cached) {
            mountPage(cached, nextPath, { replaceState: true, url: new URL(window.location.href) });
            return;
        }
        navigateTo(window.location.href, { replace: true });
    });
}
