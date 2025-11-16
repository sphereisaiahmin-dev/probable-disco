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

const WINDOW_MIN_WIDTH = 180;
const WINDOW_MIN_HEIGHT = 120;
const WINDOW_DEFAULT_WIDTH = 220;
const WINDOW_DEFAULT_HEIGHT = 150;
const ACTIVE_MIN_WIDTH = 480;
const ACTIVE_MIN_HEIGHT = 340;
const WINDOW_EDGE_GUTTER = 24;
const EMBED_FALLBACK_TIMEOUT = 6000;

const placementCache = new Map();
const floatingWindows = new Set();
const floatingStates = new WeakMap();
let floatingAnimationFrame = null;

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
        return '[data-art-window-layer], [data-window-layer="art"]:not(.art-window)';
    }
    return `[data-window-layer="${layerKey}"]:not(.art-window)`;
}

function connectLayer(layerKey, layer, configs) {
    const existingState = layerRegistry.get(layerKey);
    const existingWindows = Array.from(layer.querySelectorAll(".art-window"));
    const hasHydratedWindows = existingWindows.length > 0;
    const layerMarkedHydrated = layer.dataset.windowsHydrated === "1";

    if (initialisedLayers.has(layer) || layerMarkedHydrated || hasHydratedWindows) {
        const windows = reconcileExistingWindows(layer, configs, existingWindows);
        initialisedLayers.add(layer);
        layer.dataset.windowLayer = layerKey;
        layer.dataset.windowsHydrated = "1";

        if (existingState) {
            existingState.layer = layer;
            existingState.windows = windows;
            existingState.isRevealed = existingState.isRevealed || windows.some((node) => node.classList.contains("is-visible"));
        } else {
            layerRegistry.set(layerKey, {
                layer,
                windows,
                isRevealed: windows.some((node) => node.classList.contains("is-visible")),
                isAnimating: false
            });
        }

        attachGlobalListeners();
        return;
    }

    initialisedLayers.add(layer);
    layer.dataset.windowLayer = layerKey;
    layer.dataset.windowsHydrated = "1";

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

function reconcileExistingWindows(layer, configs, existingWindows) {
    const windowsById = new Map();

    existingWindows.forEach((node) => {
        const configId = node.dataset.windowId;
        if (!configId || windowsById.has(configId)) {
            node.remove();
            return;
        }
        windowsById.set(configId, node);
    });

    return configs.map((config) => {
        const hydrated = windowsById.get(config.uid);
        if (hydrated) {
            return hydrated;
        }
        const windowElement = createWindowElement(config);
        layer.appendChild(windowElement);
        return windowElement;
    });
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

    registerFloatingWindow(windowElement);

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
    const size = getInitialWindowSize(config);
    windowElement.style.width = `${size.width}px`;
    windowElement.style.height = `${size.height}px`;

    const position = getInitialWindowPosition(config, size);
    windowElement.style.left = `${position.x}px`;
    windowElement.style.top = `${position.y}px`;
}

function bringToFront(windowElement) {
    zIndexSeed += 1;
    windowElement.style.zIndex = zIndexSeed.toString();
}

function getInitialWindowSize(config) {
    const { initialSize } = config;
    const preferredWidth = initialSize?.width ?? WINDOW_DEFAULT_WIDTH;
    const preferredHeight = initialSize?.height ?? WINDOW_DEFAULT_HEIGHT;
    const maxWidth = Math.max(window.innerWidth - WINDOW_EDGE_GUTTER * 2, WINDOW_MIN_WIDTH);
    const maxHeight = Math.max(window.innerHeight - WINDOW_EDGE_GUTTER * 3, WINDOW_MIN_HEIGHT);

    return {
        width: clamp(preferredWidth, WINDOW_MIN_WIDTH, maxWidth),
        height: clamp(preferredHeight, WINDOW_MIN_HEIGHT, maxHeight)
    };
}

function getInitialWindowPosition(config, size) {
    const layerKey = config.layerKey || "art";
    const state = ensurePlacementState(layerKey);
    const bounds = state.bounds;
    const { initialPosition } = config;
    if (initialPosition) {
        const hinted = clampToBounds(initialPosition, size, bounds);
        if (!hasCollision(hinted, size, state.occupied)) {
            state.occupied.push({ ...hinted, width: size.width, height: size.height });
            return hinted;
        }
    }

    return findPlacementSlot(state, size);
}

function ensurePlacementState(layerKey) {
    const signature = getPlacementSignature();
    const totalWindows = windowConfigSets[layerKey]?.length ?? 0;
    let state = placementCache.get(layerKey);

    if (!state || state.signature !== signature || state.expectedWindows !== totalWindows) {
        const bounds = getCanvasBounds();
        state = {
            signature,
            expectedWindows: totalWindows,
            bounds,
            positions: generatePlacementPositions(totalWindows, bounds),
            occupied: [],
            cursor: 0
        };
        placementCache.set(layerKey, state);
    }

    return state;
}

function getPlacementSignature() {
    const headerOffset = Math.round(getHeaderOffset());
    return `${window.innerWidth}x${window.innerHeight}x${headerOffset}`;
}

function getCanvasBounds() {
    const gutter = WINDOW_EDGE_GUTTER;
    const headerOffset = getHeaderOffset();
    const top = Math.max(headerOffset + gutter, gutter);
    const left = gutter;
    const width = Math.max(window.innerWidth - gutter * 2, WINDOW_MIN_WIDTH);
    const height = Math.max(window.innerHeight - top - gutter - getAudioPlayerClearance(false), WINDOW_MIN_HEIGHT);
    return { left, top, width, height };
}

function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    if (!header) {
        return 0;
    }
    const rect = header.getBoundingClientRect();
    return rect?.bottom ?? header.offsetHeight ?? 0;
}

function generatePlacementPositions(total, bounds) {
    if (!total) {
        return [];
    }

    const safeWidth = WINDOW_DEFAULT_WIDTH + WINDOW_EDGE_GUTTER;
    const columns = Math.max(1, Math.floor(bounds.width / safeWidth));
    const rows = Math.max(1, Math.ceil(total / columns));
    const columnWidth = bounds.width / columns;
    const rowHeight = bounds.height / rows;
    const positions = [];

    for (let index = 0; index < total; index += 1) {
        const row = Math.floor(index / columns);
        const column = index % columns;
        const jitterX = ((index % 3) - 1) * 4;
        const jitterY = ((index % 2) - 0.5) * 6;
        const x = bounds.left + column * columnWidth + (columnWidth - WINDOW_DEFAULT_WIDTH) / 2 + jitterX;
        const y = bounds.top + row * rowHeight + (rowHeight - WINDOW_DEFAULT_HEIGHT) / 2 + jitterY;
        positions.push({ x, y });
    }

    return positions;
}

function findPlacementSlot(state, size) {
    const { positions, occupied, bounds } = state;
    for (let offset = 0; offset < positions.length; offset += 1) {
        const index = (state.cursor + offset) % positions.length;
        const candidate = clampToBounds(positions[index], size, bounds);
        if (!hasCollision(candidate, size, occupied)) {
            state.cursor = (index + 1) % positions.length;
            const rect = { ...candidate, width: size.width, height: size.height };
            occupied.push(rect);
            return candidate;
        }
    }

    for (let attempt = 0; attempt < 16; attempt += 1) {
        const randomCandidate = clampToBounds(
            {
                x: bounds.left + Math.random() * Math.max(bounds.width - size.width, 1),
                y: bounds.top + Math.random() * Math.max(bounds.height - size.height, 1)
            },
            size,
            bounds
        );
        if (!hasCollision(randomCandidate, size, occupied)) {
            const rect = { ...randomCandidate, width: size.width, height: size.height };
            occupied.push(rect);
            return randomCandidate;
        }
    }

    return clampToBounds({ x: bounds.left, y: bounds.top }, size, bounds);
}

function clampToBounds(position, size, bounds) {
    const maxX = bounds.left + Math.max(bounds.width - size.width, 0);
    const maxY = bounds.top + Math.max(bounds.height - size.height, 0);
    return {
        x: clamp(position.x, bounds.left, maxX),
        y: clamp(position.y, bounds.top, maxY)
    };
}

function hasCollision(position, size, occupied) {
    const buffer = 12;
    const left = position.x - buffer;
    const top = position.y - buffer;
    const right = position.x + size.width + buffer;
    const bottom = position.y + size.height + buffer;

    return occupied.some((rect) => {
        const rectLeft = rect.x - buffer;
        const rectTop = rect.y - buffer;
        const rectRight = rect.x + rect.width + buffer;
        const rectBottom = rect.y + rect.height + buffer;
        return left < rectRight && right > rectLeft && top < rectBottom && bottom > rectTop;
    });
}

function registerFloatingWindow(windowElement) {
    if (floatingWindows.has(windowElement)) {
        return;
    }

    if (!windowElement.isConnected) {
        requestAnimationFrame(() => {
            registerFloatingWindow(windowElement);
        });
        return;
    }

    floatingWindows.add(windowElement);
    floatingStates.set(windowElement, {
        amplitudeX: 3 + Math.random() * 6,
        amplitudeY: 2 + Math.random() * 5,
        speed: 0.00035 + Math.random() * 0.00025,
        phase: Math.random() * Math.PI * 2
    });
    ensureFloatingAnimation();
}

function ensureFloatingAnimation() {
    if (floatingAnimationFrame !== null) {
        return;
    }

    const update = (timestamp) => {
        floatingWindows.forEach((windowElement) => {
            if (!windowElement.isConnected) {
                floatingWindows.delete(windowElement);
                floatingStates.delete(windowElement);
                return;
            }

            const state = floatingStates.get(windowElement);
            if (!state) {
                return;
            }

            const shouldPause =
                windowElement.classList.contains("is-active") ||
                windowElement.dataset.dragging === "1" ||
                windowElement.dataset.resizing === "1";

            if (shouldPause) {
                windowElement.style.setProperty("--window-float-x", "0px");
                windowElement.style.setProperty("--window-float-y", "0px");
                return;
            }

            const offsetX = Math.sin(timestamp * state.speed + state.phase) * state.amplitudeX;
            const offsetY = Math.cos(timestamp * state.speed * 1.18 + state.phase) * state.amplitudeY;
            windowElement.style.setProperty("--window-float-x", `${offsetX.toFixed(2)}px`);
            windowElement.style.setProperty("--window-float-y", `${offsetY.toFixed(2)}px`);
        });

        floatingAnimationFrame = requestAnimationFrame(update);
    };

    floatingAnimationFrame = requestAnimationFrame(update);
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
            mountPromise: null,
            embedTimeoutId: null
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
            state.config.allow ||
                "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.referrerPolicy = state.config.referrerPolicy || "strict-origin-when-cross-origin";
        iframe.addEventListener("error", () => {
            showError(viewport, state, "failed to load embed");
        });
        iframe.addEventListener("load", () => {
            iframe.dataset.embedLoaded = "1";
            if (state.errorElement) {
                state.errorElement.hidden = true;
            }
            if (state.embedTimeoutId !== null) {
                clearTimeout(state.embedTimeoutId);
                state.embedTimeoutId = null;
            }
        });
        state.iframe = iframe;
    }

    if (!state.iframe.isConnected) {
        viewport.appendChild(state.iframe);
    }

    if (state.embedTimeoutId === null) {
        state.embedTimeoutId = window.setTimeout(() => {
            state.embedTimeoutId = null;
            if (!state.iframe || state.iframe.dataset.embedLoaded === "1") {
                return;
            }
            const fallbackMessage = state.config.embedErrorMessage || "embed blocked — open in a new tab";
            showError(viewport, state, fallbackMessage);
        }, EMBED_FALLBACK_TIMEOUT);
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
            delete state.iframe.dataset.embedLoaded;
            state.iframe.remove();
            state.mounted = false;
        }
    }

    if (state) {
        state.resizePending = false;
        if (state.embedTimeoutId !== null) {
            clearTimeout(state.embedTimeoutId);
            state.embedTimeoutId = null;
        }
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
    const bottomClearance = getAudioPlayerClearance(false);
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight - bottomClearance, ACTIVE_MIN_HEIGHT);

    windowElement.style.left = "0px";
    windowElement.style.top = "0px";
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;

    windowElement.dataset.expandedWidth = Math.round(width).toString();
    windowElement.dataset.expandedHeight = Math.round(height).toString();
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
        if (windowElement.classList.contains("is-active")) {
            const configId = windowElement.dataset.windowId;
            const config = configId ? configIndex.get(configId) : null;
            if (config) {
                applyExpandedPlacement(windowElement, config);
            }
            return;
        }

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
        windowElement.dataset.dragging = "1";
        windowElement.classList.add("is-interacting");
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
        delete windowElement.dataset.dragging;
        if (windowElement.dataset.resizing !== "1") {
            windowElement.classList.remove("is-interacting");
        }

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
    if (windowElement.classList.contains("is-active")) {
        const clearance = getAudioPlayerClearance(false);
        const maxX = Math.max(window.innerWidth - rect.width, 0);
        const maxY = Math.max(window.innerHeight - rect.height - clearance, 0);
        return {
            x: clamp(x, 0, maxX),
            y: clamp(y, 0, maxY)
        };
    }

    const gutter = WINDOW_EDGE_GUTTER;
    const bottomClearance = Math.max(getAudioPlayerClearance(), gutter * 2);
    const maxX = Math.max(window.innerWidth - rect.width - gutter, gutter);
    const maxY = Math.max(window.innerHeight - rect.height - bottomClearance, gutter);

    return {
        x: clamp(x, gutter, maxX),
        y: clamp(y, gutter, maxY)
    };
}

function getAudioPlayerClearance(includeFallback = true) {
    const player = document.querySelector(".audio-player");
    if (!player) {
        return includeFallback ? WINDOW_EDGE_GUTTER * 2 : 0;
    }

    const { height } = player.getBoundingClientRect();
    if (!height) {
        return includeFallback ? WINDOW_EDGE_GUTTER * 2 : 0;
    }

    const measured = height + WINDOW_EDGE_GUTTER;
    return includeFallback ? Math.max(measured, WINDOW_EDGE_GUTTER * 2) : measured;
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
        windowElement.dataset.resizing = "1";
        windowElement.classList.add("is-interacting");
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
        const clearance = isActive ? getAudioPlayerClearance(false) : WINDOW_EDGE_GUTTER * 2;
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
        delete windowElement.dataset.resizing;
        if (windowElement.dataset.dragging !== "1") {
            windowElement.classList.remove("is-interacting");
        }
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
