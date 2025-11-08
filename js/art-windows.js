import { artWindowConfig } from "./art/windows-config.js";
import { createSceneInstance } from "./art/scene-registry.js";

const layer = document.querySelector("[data-art-window-layer]");
const sceneStates = new Map();
const activeScenes = new Map();
let zIndexSeed = 10;

if (layer) {
    init();
}

function init() {
    artWindowConfig.forEach((config) => {
        const windowElement = createWindowElement(config);
        layer.appendChild(windowElement);
    });

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeydown);
}

function createWindowElement(config) {
    const windowElement = document.createElement("article");
    windowElement.className = "art-window";
    windowElement.dataset.windowId = config.id;

    applyInitialPlacement(windowElement, config);
    bringToFront(windowElement);

    const header = document.createElement("header");
    header.className = "art-window__header";

    const title = document.createElement("h2");
    title.className = "art-window__title";
    title.textContent = config.title;
    header.appendChild(title);

    if (Array.isArray(config.tags) && config.tags.length) {
        const meta = document.createElement("div");
        meta.className = "art-window__meta";
        config.tags.forEach((tag) => {
            const badge = document.createElement("span");
            badge.textContent = tag;
            meta.appendChild(badge);
        });
        header.appendChild(meta);
    }

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
        closeWindow(windowElement, config.id);
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

    windowElement.appendChild(header);
    windowElement.appendChild(viewport);

    enableDragging(windowElement, header);

    windowElement.addEventListener("click", () => {
        if (windowElement.classList.contains("is-active")) {
            return;
        }

        if (windowElement.dataset.dragWasActive === "1") {
            delete windowElement.dataset.dragWasActive;
            return;
        }

        openWindow(windowElement, config.id);
    });

    windowElement.addEventListener("pointerdown", () => {
        bringToFront(windowElement);
    });

    return windowElement;
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
        windowElement.style.width = `${initialSize.width}px`;
        windowElement.style.height = `${initialSize.height}px`;
    }
}

function bringToFront(windowElement) {
    zIndexSeed += 1;
    windowElement.style.zIndex = zIndexSeed.toString();
}

function ensureSceneState(configId) {
    if (!sceneStates.has(configId)) {
        const config = artWindowConfig.find((entry) => entry.id === configId);
        if (!config) {
            throw new Error(`missing configuration for window ${configId}`);
        }

        const state = {
            config,
            instance: createSceneInstance(config.sceneId),
            canvas: null,
            viewport: null,
            mounted: false,
            errorElement: null
        };

        sceneStates.set(configId, state);
    }

    return sceneStates.get(configId);
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
    const state = ensureSceneState(configId);
    const viewport = windowElement.querySelector(".art-window__viewport");
    if (!viewport) {
        return;
    }

    const closeButton = windowElement.querySelector(".art-window__control");
    if (closeButton) {
        closeButton.hidden = false;
    }

    state.viewport = viewport;

    if (!state.canvas) {
        state.canvas = document.createElement("canvas");
        state.canvas.className = "art-window__canvas";
        viewport.appendChild(state.canvas);
    }

    if (state.errorElement) {
        state.errorElement.hidden = true;
    }

    storeWindowOrigin(windowElement);
    windowElement.classList.add("is-active");
    windowElement.style.left = "";
    windowElement.style.top = "";
    windowElement.style.width = "";
    windowElement.style.height = "";

    const context = { canvas: state.canvas, container: viewport, config: state.config };

    const mountPromise = Promise.resolve(state.instance.mount(context));
    state.mountPromise = mountPromise;

    mountPromise
        .then(() => {
            if (!windowElement.classList.contains("is-active")) {
                state.mounted = false;
                activeScenes.delete(configId);
                state.mountPromise = null;
                return;
            }
            state.mounted = true;
            activeScenes.set(configId, state);
            resizeScene(state);
            state.mountPromise = null;
        })
        .catch((error) => {
            console.error(`failed to mount scene ${state.config.sceneId}`, error);
            showError(viewport, state, "failed to start scene");
            state.mounted = false;
            activeScenes.delete(configId);
            state.mountPromise = null;
        });
}

function closeWindow(windowElement, configId) {
    if (!windowElement.classList.contains("is-active")) {
        return;
    }

    windowElement.classList.remove("is-active");
    restoreWindowOrigin(windowElement);

    const state = sceneStates.get(configId);
    if (state && state.mounted) {
        try {
            state.instance.unmount?.();
        } catch (error) {
            console.error(`failed to unmount scene ${state.config.sceneId}`, error);
        }
        state.mounted = false;
        activeScenes.delete(configId);
        state.mountPromise = null;
    }

    const viewport = windowElement.querySelector(".art-window__viewport");
    if (viewport && state?.errorElement) {
        state.errorElement.hidden = true;
    }

    const closeButton = windowElement.querySelector(".art-window__control");
    if (closeButton) {
        closeButton.hidden = true;
    }
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

function resizeScene(state) {
    if (!state || !state.viewport || !state.instance || typeof state.instance.resize !== "function") {
        return;
    }

    const rect = state.viewport.getBoundingClientRect();
    state.instance.resize(rect.width, rect.height);
}

function handleResize() {
    activeScenes.forEach((state) => {
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

function clampPosition(windowElement, x, y) {
    const rect = windowElement.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    return {
        x: Math.min(Math.max(x, 16), Math.max(maxX, 16)),
        y: Math.min(Math.max(y, 16), Math.max(maxY, 16))
    };
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
