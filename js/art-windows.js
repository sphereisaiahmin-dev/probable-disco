import { artWindowConfig } from "./art/windows-config.js";
import { workWindowConfig } from "./work/windows-config.js";
import { musicWindowConfig } from "./music/windows-config.js";
import { createSceneInstance } from "./art/scene-registry.js";

const configIndex = new Map();

const windowConfigSets = {
    art: prepareConfigs("art", artWindowConfig),
    work: prepareConfigs("work", workWindowConfig),
    music: prepareConfigs("music", musicWindowConfig)
};

const layerRegistry = new Map();
const initialisedLayers = new WeakSet();
const windowStates = new Map();
const activeSceneStates = new Map();
const embedPreviewCache = new Map();

let zIndexSeed = 10;
let listenersAttached = false;

const WINDOW_MIN_WIDTH = 240;
const WINDOW_MIN_HEIGHT = 160;
const ACTIVE_MIN_WIDTH = 480;
const ACTIVE_MIN_HEIGHT = 340;
const WINDOW_EDGE_GUTTER = 32;

bootstrapLayers();

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        bootstrapLayers();
        revealLayer(document.documentElement.dataset.page ?? null, { immediate: true });
    });
} else {
    requestAnimationFrame(() => {
        revealLayer(document.documentElement.dataset.page ?? null, { immediate: true });
    });
}

document.addEventListener("shell:navigation", (event) => {
    const targetId = event?.detail?.pageId;
    requestAnimationFrame(() => {
        bootstrapLayers();
        revealLayer(targetId);
    });
});

document.addEventListener("shell:navigate-intent", (event) => {
    const currentPage = document.documentElement.dataset.page;
    const targetId = event?.detail?.targetId;
    if (!currentPage || currentPage === targetId) {
        return;
    }
    dismissLayer(currentPage);
});

function prepareConfigs(layerKey, entries) {
    if (!Array.isArray(entries)) {
        return [];
    }

    return entries.map((entry, index) => {
        const type = entry.type || (layerKey === "art" ? "scene" : "embed");
        const slug = entry.id || `${layerKey}-${index + 1}`;
        const uid = `${layerKey}:${slug}`;
        const config = {
            ...entry,
            id: slug,
            uid,
            layerKey,
            order: index,
            type
        };
        configIndex.set(uid, config);
        return config;
    });
}

function bootstrapLayers() {
    Object.entries(windowConfigSets).forEach(([layerKey, configs]) => {
        const selector = getLayerSelector(layerKey);
        if (!selector) {
            return;
        }
        document.querySelectorAll(selector).forEach((layer) => {
            connectLayer(layerKey, layer, configs);
        });
    });
}

function getLayerSelector(layerKey) {
    if (layerKey === "art") {
        return '[data-window-layer="art"], [data-art-window-layer]';
    }
    return `[data-window-layer="${layerKey}"]`;
}

function connectLayer(layerKey, layer, configs) {
    const existingState = layerRegistry.get(layerKey);
    if (initialisedLayers.has(layer)) {
        if (existingState) {
            existingState.layer = layer;
            existingState.windows = existingState.windows.filter((node) => node.isConnected);
        } else {
            layerRegistry.set(layerKey, {
                layer,
                windows: Array.from(layer.querySelectorAll(".art-window")),
                isRevealed: Boolean(layer.querySelector(".art-window.is-visible")),
                isAnimating: false
            });
        }
        return;
    }

    initialisedLayers.add(layer);
    layer.dataset.windowLayer = layerKey;

    const windows = configs.map((config) => {
        const windowElement = createWindowElement(config);
        layer.appendChild(windowElement);
        return windowElement;
    });

    layerRegistry.set(layerKey, {
        layer,
        windows,
        isRevealed: false,
        isAnimating: false
    });

    attachGlobalListeners();
}

function attachGlobalListeners() {
    if (listenersAttached) {
        return;
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeydown);
    listenersAttached = true;
}

function createWindowElement(config) {
    const windowElement = document.createElement("article");
    windowElement.className = "art-window";
    windowElement.dataset.windowId = config.uid;
    windowElement.dataset.windowLayer = config.layerKey;

    applyInitialPlacement(windowElement, config);
    bringToFront(windowElement);

    const header = document.createElement("header");
    header.className = "art-window__header";

    const title = document.createElement("h2");
    title.className = "art-window__title";
    title.textContent = config.title;
    header.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "art-window__controls";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "art-window__control";
    closeButton.textContent = "close";
    closeButton.setAttribute("aria-label", `close ${config.title}`);
    closeButton.hidden = true;

    closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        closeWindow(windowElement, config.uid);
    });

    controls.appendChild(closeButton);
    header.appendChild(controls);

    const viewport = document.createElement("div");
    viewport.className = "art-window__viewport";

    const preview = document.createElement("div");
    preview.className = "art-window__preview";
    if (config.previewGradient) {
        preview.style.background = config.previewGradient;
    }
    viewport.appendChild(preview);

    if (config.hint) {
        const hint = document.createElement("span");
        hint.className = "art-window__hint";
        hint.textContent = config.hint;
        viewport.appendChild(hint);
    }

    if (config.type === "embed") {
        hydrateEmbedPreview(config, preview);
    }

    const resizeHandle = document.createElement("button");
    resizeHandle.type = "button";
    resizeHandle.className = "art-window__resize-handle";
    resizeHandle.setAttribute("aria-label", `resize ${config.title} window`);
    viewport.appendChild(resizeHandle);

    windowElement.appendChild(header);
    windowElement.appendChild(viewport);

    enableDragging(windowElement, header);
    enableResizing(windowElement, resizeHandle);

    windowElement.addEventListener("click", () => {
        if (windowElement.classList.contains("is-active")) {
            return;
        }

        if (windowElement.dataset.dragWasActive === "1") {
            delete windowElement.dataset.dragWasActive;
            return;
        }

        if (windowElement.dataset.resizeWasActive === "1") {
            delete windowElement.dataset.resizeWasActive;
            return;
        }

        openWindow(windowElement, config.uid);
    });

    windowElement.addEventListener("pointerdown", () => {
        bringToFront(windowElement);
    });

    return windowElement;
}

function hydrateEmbedPreview(config, preview) {
    if (!preview) {
        return;
    }

    if (config.thumbnail) {
        preview.style.backgroundImage = `url(${config.thumbnail})`;
        preview.classList.add("has-image");
        return;
    }

    if (!config.embedUrl) {
        return;
    }

    const cacheKey = config.embedUrl;
    if (!embedPreviewCache.has(cacheKey)) {
        embedPreviewCache.set(
            cacheKey,
            fetch(`https://noembed.com/embed?url=${encodeURIComponent(cacheKey)}`)
                .then((response) => (response.ok ? response.json() : null))
                .then((payload) => payload?.thumbnail_url || null)
                .catch(() => null)
        );
    }

    embedPreviewCache.get(cacheKey)?.then((thumbnailUrl) => {
        if (!thumbnailUrl || !preview.isConnected) {
            return;
        }
        preview.style.backgroundImage = `url(${thumbnailUrl})`;
        preview.classList.add("has-image");
    });
}

function applyInitialPlacement(windowElement, config) {
    const { initialPosition, initialSize } = config;
    if (initialPosition) {
        windowElement.style.left = `${initialPosition.x}px`;
        windowElement.style.top = `${initialPosition.y}px`;
    } else {
        const padding = 48;
        windowElement.style.left = `${padding + Math.random() * (window.innerWidth - padding * 2)}px`;
        windowElement.style.top = `${padding + Math.random() * (window.innerHeight - padding * 2)}px`;
    }

    if (initialSize) {
        const width = Math.max(initialSize.width, WINDOW_MIN_WIDTH);
        const height = Math.max(initialSize.height, WINDOW_MIN_HEIGHT);
        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;
    } else {
        windowElement.style.width = `${WINDOW_MIN_WIDTH}px`;
        windowElement.style.height = `${WINDOW_MIN_HEIGHT}px`;
    }
}

function bringToFront(windowElement) {
    zIndexSeed += 1;
    windowElement.style.zIndex = zIndexSeed.toString();
}

function ensureWindowState(configId) {
    if (!windowStates.has(configId)) {
        const config = configIndex.get(configId);
        if (!config) {
            throw new Error(`missing configuration for window ${configId}`);
        }

        const state = {
            config,
            instance: config.type === "scene" ? createSceneInstance(config.sceneId) : null,
            canvas: null,
            iframe: null,
            viewport: null,
            mounted: false,
            errorElement: null,
            resizePending: false,
            mountPromise: null
        };

        windowStates.set(configId, state);
    }

    return windowStates.get(configId);
}

function openWindow(windowElement, configId) {
    bringToFront(windowElement);
    const existingActive = document.querySelector(".art-window.is-active");
    if (existingActive && existingActive !== windowElement) {
        const activeId = existingActive.dataset.windowId;
        if (activeId) {
            closeWindow(existingActive, activeId);
        }
    }

    const config = configIndex.get(configId);
    if (!config) {
        return;
    }

    const state = ensureWindowState(configId);
    const viewport = windowElement.querySelector(".art-window__viewport");
    if (!viewport) {
        return;
    }

    const closeButton = windowElement.querySelector(".art-window__control");
    if (closeButton) {
        closeButton.hidden = false;
    }

    state.viewport = viewport;

    if (config.type === "scene" && !state.canvas && config.useCanvas !== false) {
        state.canvas = document.createElement("canvas");
        state.canvas.className = "art-window__canvas";
        viewport.appendChild(state.canvas);
    }

    if (state.errorElement) {
        state.errorElement.hidden = true;
    }

    storeWindowOrigin(windowElement);
    windowElement.classList.add("is-active");
    document.body.classList.add("art-window-active");
    applyExpandedPlacement(windowElement, config);

    if (config.type === "scene") {
        mountScene(state, windowElement, configId);
    } else {
        mountEmbed(state, viewport);
    }
}

function mountScene(state, windowElement, configId) {
    const context = { canvas: state.canvas ?? null, container: state.viewport, config: state.config };
    const mountPromise = Promise.resolve(state.instance.mount(context));
    state.mountPromise = mountPromise;

    mountPromise
        .then(() => {
            if (!windowElement.classList.contains("is-active")) {
                state.mounted = false;
                activeSceneStates.delete(configId);
                state.mountPromise = null;
                return;
            }
            state.mounted = true;
            activeSceneStates.set(configId, state);
            resizeScene(state);
            state.mountPromise = null;
        })
        .catch((error) => {
            console.error(`failed to mount scene ${state.config.sceneId}`, error);
            showError(state.viewport, state, "failed to start scene");
            state.mounted = false;
            activeSceneStates.delete(configId);
            state.mountPromise = null;
        });
}

function mountEmbed(state, viewport) {
    if (!viewport) {
        return;
    }

    if (!state.config.embedUrl) {
        showError(viewport, state, "embed unavailable");
        return;
    }

    if (!state.iframe) {
        const iframe = document.createElement("iframe");
        iframe.className = "art-window__iframe";
        iframe.src = state.config.embedUrl;
        iframe.loading = "lazy";
        iframe.title = state.config.title || "embedded window";
        iframe.allowFullscreen = state.config.allowFullscreen !== false;
        iframe.setAttribute(
            "allow",
            state.config.allow || "autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
        );
        iframe.referrerPolicy = state.config.referrerPolicy || "no-referrer";
        iframe.addEventListener("error", () => {
            showError(viewport, state, "failed to load embed");
        });
        state.iframe = iframe;
    }

    if (!state.iframe.isConnected) {
        viewport.appendChild(state.iframe);
    }

    state.mounted = true;
}

function closeWindow(windowElement, configId) {
    if (!windowElement.classList.contains("is-active")) {
        return;
    }

    windowElement.classList.remove("is-active");
    restoreWindowOrigin(windowElement);

    const state = windowStates.get(configId);
    if (state && state.mounted) {
        if (state.config.type === "scene") {
            try {
                state.instance.unmount?.();
            } catch (error) {
                console.error(`failed to unmount scene ${state.config.sceneId}`, error);
            }
            state.mounted = false;
            activeSceneStates.delete(configId);
            state.mountPromise = null;
        } else if (state.config.type === "embed" && state.iframe) {
            try {
                state.iframe.src = state.config.embedUrl;
            } catch {
                // ignore reset errors
            }
            state.iframe.remove();
            state.mounted = false;
        }
    }

    if (state) {
        state.resizePending = false;
    }

    const viewport = windowElement.querySelector(".art-window__viewport");
    if (viewport && state?.errorElement) {
        state.errorElement.hidden = true;
    }

    const closeButton = windowElement.querySelector(".art-window__control");
    if (closeButton) {
        closeButton.hidden = true;
    }

    syncBodyActiveState();
}

function storeWindowOrigin(windowElement) {
    windowElement.dataset.originLeft = windowElement.style.left;
    windowElement.dataset.originTop = windowElement.style.top;
    windowElement.dataset.originWidth = windowElement.style.width;
    windowElement.dataset.originHeight = windowElement.style.height;
}

function restoreWindowOrigin(windowElement) {
    windowElement.style.left = windowElement.dataset.originLeft ?? windowElement.style.left;
    windowElement.style.top = windowElement.dataset.originTop ?? windowElement.style.top;
    windowElement.style.width = windowElement.dataset.originWidth ?? windowElement.style.width;
    windowElement.style.height = windowElement.dataset.originHeight ?? windowElement.style.height;
}

function applyExpandedPlacement(windowElement, config) {
    const { width, height } = getExpandedSize(windowElement, config);
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;

    const centered = getCenteredPosition(width, height);
    windowElement.style.left = `${centered.x}px`;
    windowElement.style.top = `${centered.y}px`;

    const clamped = clampPosition(windowElement, centered.x, centered.y);
    windowElement.style.left = `${clamped.x}px`;
    windowElement.style.top = `${clamped.y}px`;

    windowElement.dataset.expandedWidth = Math.round(width).toString();
    windowElement.dataset.expandedHeight = Math.round(height).toString();
}

function getExpandedSize(windowElement, config) {
    const storedWidth = Number.parseFloat(windowElement.dataset.expandedWidth ?? "");
    const storedHeight = Number.parseFloat(windowElement.dataset.expandedHeight ?? "");
    const baseWidth = Math.max(config?.initialSize?.width ?? WINDOW_MIN_WIDTH, ACTIVE_MIN_WIDTH);
    const baseHeight = Math.max(config?.initialSize?.height ?? WINDOW_MIN_HEIGHT, ACTIVE_MIN_HEIGHT);
    const preferredWidth = Number.isFinite(storedWidth) ? storedWidth : baseWidth;
    const preferredHeight = Number.isFinite(storedHeight) ? storedHeight : baseHeight;
    const availableWidth = Math.max(window.innerWidth - WINDOW_EDGE_GUTTER * 2, WINDOW_MIN_WIDTH);
    const availableHeight = Math.max(window.innerHeight - getAudioPlayerClearance(), WINDOW_MIN_HEIGHT);
    const minWidth = Math.max(Math.min(ACTIVE_MIN_WIDTH, availableWidth), WINDOW_MIN_WIDTH);
    const minHeight = Math.max(Math.min(ACTIVE_MIN_HEIGHT, availableHeight), WINDOW_MIN_HEIGHT);

    return {
        width: clamp(preferredWidth, minWidth, availableWidth),
        height: clamp(preferredHeight, minHeight, availableHeight)
    };
}

function getCenteredPosition(width, height) {
    const gutter = WINDOW_EDGE_GUTTER;
    const clearance = getAudioPlayerClearance();
    const maxX = Math.max(window.innerWidth - width - gutter, gutter);
    const maxY = Math.max(window.innerHeight - height - clearance, gutter);
    const centerX = (window.innerWidth - width) / 2;
    const verticalSpace = window.innerHeight - clearance;
    const centerY = (verticalSpace - height) / 2;

    return {
        x: clamp(centerX, gutter, maxX),
        y: clamp(centerY, gutter, maxY)
    };
}

function resizeScene(state) {
    if (!state || !state.viewport || !state.instance || typeof state.instance.resize !== "function") {
        return;
    }

    const rect = state.viewport.getBoundingClientRect();
    state.instance.resize(rect.width, rect.height);
}

function handleResize() {
    document.querySelectorAll(".art-window").forEach((windowElement) => {
        const left = parseFloat(windowElement.style.left ?? "");
        const top = parseFloat(windowElement.style.top ?? "");
        if (Number.isNaN(left) || Number.isNaN(top)) {
            return;
        }

        const clamped = clampPosition(windowElement, left, top);
        windowElement.style.left = `${clamped.x}px`;
        windowElement.style.top = `${clamped.y}px`;
    });

    activeSceneStates.forEach((state) => {
        resizeScene(state);
    });
}

function handleKeydown(event) {
    if (event.key !== "Escape") {
        return;
    }

    const activeWindow = document.querySelector(".art-window.is-active");
    if (activeWindow) {
        const configId = activeWindow.dataset.windowId;
        if (configId) {
            closeWindow(activeWindow, configId);
        }
    }
}

function syncBodyActiveState() {
    const hasActive = document.querySelector(".art-window.is-active");
    document.body.classList.toggle("art-window-active", Boolean(hasActive));
}

function enableDragging(windowElement, handle) {
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;
    let hasMoved = false;

    handle.addEventListener("pointerdown", (event) => {
        if (windowElement.classList.contains("is-active")) {
            return;
        }

        pointerId = event.pointerId;
        offsetX = event.clientX - windowElement.getBoundingClientRect().left;
        offsetY = event.clientY - windowElement.getBoundingClientRect().top;
        hasMoved = false;
        handle.setPointerCapture(pointerId);
    });

    handle.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId || windowElement.classList.contains("is-active")) {
            return;
        }

        const x = event.clientX - offsetX;
        const y = event.clientY - offsetY;
        const clamped = clampPosition(windowElement, x, y);
        windowElement.style.left = `${clamped.x}px`;
        windowElement.style.top = `${clamped.y}px`;
        hasMoved = true;
    });

    const endDrag = (event) => {
        if (pointerId !== event.pointerId) {
            return;
        }

        handle.releasePointerCapture(pointerId);
        pointerId = null;

        if (hasMoved) {
            windowElement.dataset.dragWasActive = "1";
            requestAnimationFrame(() => {
                delete windowElement.dataset.dragWasActive;
            });
        }
    };

    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function clampPosition(windowElement, x, y) {
    const rect = windowElement.getBoundingClientRect();
    const gutter = WINDOW_EDGE_GUTTER;
    const clearance = windowElement.classList.contains("is-active")
        ? Math.max(getAudioPlayerClearance(), gutter * 2)
        : gutter;
    const maxX = Math.max(window.innerWidth - rect.width - gutter, gutter);
    const maxY = Math.max(window.innerHeight - rect.height - clearance, gutter);

    return {
        x: clamp(x, gutter, maxX),
        y: clamp(y, gutter, maxY)
    };
}

function getAudioPlayerClearance() {
    const player = document.querySelector(".audio-player");
    if (!player) {
        return WINDOW_EDGE_GUTTER * 2;
    }

    const { height } = player.getBoundingClientRect();
    if (!height) {
        return WINDOW_EDGE_GUTTER * 2;
    }

    return Math.max(height + WINDOW_EDGE_GUTTER, WINDOW_EDGE_GUTTER * 2);
}

function notifySceneResize(windowElement) {
    const configId = windowElement.dataset.windowId;
    if (!configId) {
        return;
    }

    const state = windowStates.get(configId);
    if (!state || !state.mounted || state.config.type !== "scene") {
        return;
    }

    if (state.resizePending) {
        return;
    }

    state.resizePending = true;
    requestAnimationFrame(() => {
        state.resizePending = false;
        resizeScene(state);
    });
}

function enableResizing(windowElement, handle) {
    let pointerId = null;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;

    handle.addEventListener("pointerdown", (event) => {
        if (pointerId !== null) {
            return;
        }

        pointerId = event.pointerId;
        const rect = windowElement.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startX = event.clientX;
        startY = event.clientY;
        event.preventDefault();
        event.stopPropagation();
        bringToFront(windowElement);
        handle.setPointerCapture(pointerId);
    });

    handle.addEventListener("pointermove", (event) => {
        if (pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        const isActive = windowElement.classList.contains("is-active");
        const minWidth = isActive ? ACTIVE_MIN_WIDTH : WINDOW_MIN_WIDTH;
        const minHeight = isActive ? ACTIVE_MIN_HEIGHT : WINDOW_MIN_HEIGHT;
        const clearance = isActive ? getAudioPlayerClearance() : WINDOW_EDGE_GUTTER * 2;
        const availableWidth = Math.max(window.innerWidth - WINDOW_EDGE_GUTTER * 2, WINDOW_MIN_WIDTH);
        const availableHeight = Math.max(window.innerHeight - clearance, WINDOW_MIN_HEIGHT);
        const widthLowerBound = Math.min(Math.max(minWidth, WINDOW_MIN_WIDTH), availableWidth);
        const heightLowerBound = Math.min(Math.max(minHeight, WINDOW_MIN_HEIGHT), availableHeight);
        const width = clamp(startWidth + deltaX, widthLowerBound, availableWidth);
        const height = clamp(startHeight + deltaY, heightLowerBound, availableHeight);

        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;

        const currentLeft = parseFloat(windowElement.style.left ?? "");
        const currentTop = parseFloat(windowElement.style.top ?? "");
        if (!Number.isNaN(currentLeft) && !Number.isNaN(currentTop)) {
            const clamped = clampPosition(windowElement, currentLeft, currentTop);
            windowElement.style.left = `${clamped.x}px`;
            windowElement.style.top = `${clamped.y}px`;
        }

        notifySceneResize(windowElement);
    });

    const endResize = (event) => {
        if (pointerId !== event.pointerId) {
            return;
        }

        handle.releasePointerCapture(pointerId);
        pointerId = null;
        windowElement.dataset.resizeWasActive = "1";
        requestAnimationFrame(() => {
            delete windowElement.dataset.resizeWasActive;
        });

        const rect = windowElement.getBoundingClientRect();
        if (windowElement.classList.contains("is-active")) {
            windowElement.dataset.expandedWidth = Math.round(rect.width).toString();
            windowElement.dataset.expandedHeight = Math.round(rect.height).toString();
        }

        notifySceneResize(windowElement);
    };

    handle.addEventListener("pointerup", endResize);
    handle.addEventListener("pointercancel", endResize);
}

function showError(viewport, state, message) {
    if (!viewport) {
        return;
    }

    if (!state.errorElement) {
        const error = document.createElement("div");
        error.className = "art-window__error";
        error.textContent = message;
        viewport.appendChild(error);
        state.errorElement = error;
    } else {
        state.errorElement.textContent = message;
        state.errorElement.hidden = false;
    }
}

function revealLayer(layerKey, { immediate = false } = {}) {
    if (!layerKey) {
        return;
    }

    const state = layerRegistry.get(layerKey);
    if (!state || !state.windows.length) {
        return;
    }

    if (state.isAnimating) {
        return;
    }

    const hiddenWindows = state.windows.filter((windowEl) => !windowEl.classList.contains("is-visible"));
    if (!hiddenWindows.length) {
        return;
    }

    state.isAnimating = true;
    const delayUnit = immediate ? 0 : 110;

    state.windows.forEach((windowEl, index) => {
        const delay = delayUnit * index;
        windowEl.style.setProperty("--window-transition-delay", `${delay}ms`);
        setTimeout(() => {
            windowEl.classList.add("is-visible");
            if (index === state.windows.length - 1) {
                finishLayerAnimation(state);
            }
        }, delay);
    });
}

function dismissLayer(layerKey) {
    if (!layerKey) {
        return;
    }

    const state = layerRegistry.get(layerKey);
    if (!state || !state.windows.length) {
        return;
    }

    if (state.isAnimating) {
        return;
    }

    const visibleWindows = state.windows.filter((windowEl) => windowEl.classList.contains("is-visible"));
    if (!visibleWindows.length) {
        return;
    }

    state.isAnimating = true;
    const reversed = [...state.windows].reverse();

    reversed.forEach((windowEl, index) => {
        const delay = 90 * index;
        windowEl.style.setProperty("--window-transition-delay", `${delay}ms`);
        setTimeout(() => {
            windowEl.classList.remove("is-visible");
            if (index === reversed.length - 1) {
                finishLayerAnimation(state);
            }
        }, delay);
    });
}

function finishLayerAnimation(state) {
    state.isAnimating = false;
}
