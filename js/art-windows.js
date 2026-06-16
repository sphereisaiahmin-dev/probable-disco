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
const mountedSceneStates = new Map();
const embedPreviewCache = new Map();
const runtimePreviewCache = new Map();
const tagColorAssignments = new Map();

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
const WINDOW_REVEAL_DELAY = 200;
const VIDEO_DEFAULT_RATE = 1;
const VIDEO_HOVER_RATE = 1.5;
const DEFAULT_MEDIA_ASPECT_RATIO = 16 / 9;

const placementCache = new Map();
const floatingWindows = new Set();
const floatingStates = new WeakMap();
let floatingAnimationFrame = null;

bootstrapLayers();

const INITIAL_REVEAL_DELAY = 500;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        bootstrapLayers();
        window.setTimeout(() => {
            revealLayer(document.documentElement.dataset.page ?? null);
        }, INITIAL_REVEAL_DELAY);
    });
} else {
    window.setTimeout(() => {
        revealLayer(document.documentElement.dataset.page ?? null);
    }, INITIAL_REVEAL_DELAY);
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
        const mediaItems = normaliseMediaItems(entry.mediaItems || entry.media);
        const type = entry.type || (mediaItems.length ? "media" : layerKey === "art" ? "scene" : "embed");
        const slug = entry.id || `${layerKey}-${index + 1}`;
        const uid = `${layerKey}:${slug}`;
        const config = {
            ...entry,
            id: slug,
            uid,
            layerKey,
            order: index,
            type,
            mediaItems
        };
        configIndex.set(uid, config);
        return config;
    });
}

function normaliseMediaItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map((item) => {
            if (!item) {
                return null;
            }

            const rawItem = typeof item === "string" ? { src: item } : item;
            const src = `${rawItem.src || rawItem.url || ""}`.trim();
            if (!src) {
                return null;
            }

            const type = normaliseMediaType(rawItem.type || inferMediaType(src));
            if (!type) {
                return null;
            }

            return {
                ...rawItem,
                src,
                type,
                alt: `${rawItem.alt || rawItem.title || rawItem.label || ""}`.trim()
            };
        })
        .filter(Boolean);
}

function normaliseMediaType(type) {
    const key = `${type || ""}`.trim().toLowerCase();
    if (key === "image" || key === "video") {
        return key;
    }
    if (key === "embed" || key === "iframe" || key === "youtube") {
        return "embed";
    }
    return null;
}

function inferMediaType(src) {
    if (isYouTubeUrl(src)) {
        return "embed";
    }

    const path = `${src}`.split(/[?#]/)[0].toLowerCase();
    if (/\.(jpe?g|png|gif|webp|avif)$/.test(path)) {
        return "image";
    }
    if (/\.(mp4|webm|mov|m4v)$/.test(path)) {
        return "video";
    }
    return "video";
}

function hasMediaItems(config) {
    return Array.isArray(config?.mediaItems) && config.mediaItems.length > 0;
}

function isYouTubeUrl(src) {
    let url;
    try {
        url = new URL(src);
    } catch (error) {
        return false;
    }

    const host = url.hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com";
}

function normaliseYouTubeEmbedUrl(src) {
    let url;
    try {
        url = new URL(src);
    } catch (error) {
        return src;
    }

    const host = url.hostname.replace(/^www\./, "");
    let videoId = "";
    if (host === "youtu.be") {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else {
        const pathParts = url.pathname.split("/").filter(Boolean);
        if (pathParts[0] === "embed" && pathParts[1]) {
            videoId = pathParts[1];
        } else if (pathParts[0] === "shorts" && pathParts[1]) {
            videoId = pathParts[1];
        } else {
            videoId = url.searchParams.get("v") || "";
        }
    }

    if (!videoId) {
        return src;
    }

    const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
    const start = getYouTubeStartTime(url);
    if (start > 0) {
        embedUrl.searchParams.set("start", start.toString());
    }
    embedUrl.searchParams.set("rel", "0");
    embedUrl.searchParams.set("modestbranding", "1");
    embedUrl.searchParams.set("playsinline", "1");
    return embedUrl.toString();
}

function getYouTubeStartTime(url) {
    const raw = url.searchParams.get("t") || url.searchParams.get("start") || "";
    if (!raw) {
        return 0;
    }

    if (/^\d+$/.test(raw)) {
        return Number(raw);
    }

    const hours = /(\d+)h/.exec(raw)?.[1] || 0;
    const minutes = /(\d+)m/.exec(raw)?.[1] || 0;
    const seconds = /(\d+)s/.exec(raw)?.[1] || 0;
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
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
        syncMediaPlacement(windowElement, config);
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
            syncMediaPlacement(hydrated, config);
            return hydrated;
        }
        const windowElement = createWindowElement(config);
        layer.appendChild(windowElement);
        syncMediaPlacement(windowElement, config);
        return windowElement;
    });
}

function syncMediaPlacement(windowElement, config) {
    if (!windowElement || !hasMediaItems(config)) {
        return;
    }

    const state = ensureWindowState(config.uid);
    applyMediaSelectionPlacement(windowElement, state);
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
    if (hasMediaItems(config)) {
        windowElement.classList.add("has-media-carousel");
    }
    windowElement.dataset.windowId = config.uid;
    windowElement.dataset.windowLayer = config.layerKey;
    applyInitialPlacement(windowElement, config);
    bringToFront(windowElement);

    const header = document.createElement("header");
    header.className = "art-window__header";

    const heading = document.createElement("div");
    heading.className = "art-window__heading";

    const title = document.createElement("h2");
    title.className = "art-window__title";
    title.textContent = config.title;
    heading.appendChild(title);

    const descriptionText = (config.description || "").trim();

    const tags = createTagList(config.tags);
    if (tags) {
        heading.appendChild(tags);
    }

    const controls = document.createElement("div");
    controls.className = "art-window__controls";
    controls.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
    });

    let descriptionToggle = null;
    if (descriptionText) {
        descriptionToggle = document.createElement("button");
        descriptionToggle.type = "button";
        descriptionToggle.className = "art-window__control art-window__control--description";
        descriptionToggle.textContent = "…";
        descriptionToggle.setAttribute("aria-label", `toggle description for ${config.title}`);
        controls.appendChild(descriptionToggle);
    }

    if (hasMediaItems(config) && config.mediaItems.length > 1) {
        controls.appendChild(createHeaderMediaControl(config, windowElement, -1));
        controls.appendChild(createHeaderMediaControl(config, windowElement, 1));
    }

    const fullscreenButton = document.createElement("button");
    fullscreenButton.type = "button";
    fullscreenButton.className = "art-window__control art-window__control--fullscreen";
    fullscreenButton.textContent = "□";
    fullscreenButton.setAttribute("aria-label", `toggle fullscreen for ${config.title}`);
    fullscreenButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleWindowFullscreen(windowElement, config.uid);
    });
    controls.appendChild(fullscreenButton);

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "art-window__control art-window__control--close";
    closeButton.textContent = "×";
    closeButton.setAttribute("aria-label", `close ${config.title}`);
    closeButton.addEventListener("click", (event) => {
        event.stopPropagation();
        temporarilyCloseWindow(windowElement, config.uid);
    });

    controls.appendChild(closeButton);
    header.appendChild(heading);
    header.appendChild(controls);

    const viewport = document.createElement("div");
    viewport.className = "art-window__viewport";

    const preview = document.createElement("div");
    preview.className = "art-window__preview";
    if (config.previewGradient) {
        preview.style.background = config.previewGradient;
    }
    viewport.appendChild(preview);

    const contentHost = document.createElement("div");
    contentHost.className = "art-window__content";
    viewport.appendChild(contentHost);

    const runtimePreviewApplied = applyRuntimePreview(config, preview);

    const state = ensureWindowState(config.uid);
    state.viewportHost = viewport;
    state.viewport = contentHost;
    state.previewElement = preview;
    initialiseLivePreview(windowElement, state);

    if (config.hint) {
        const hint = document.createElement("span");
        hint.className = "art-window__hint";
        hint.textContent = config.hint;
        viewport.appendChild(hint);
    }

    const mediaControls = createMediaControls(config, windowElement);
    if (mediaControls) {
        viewport.appendChild(mediaControls);
    }

    if (config.type === "embed" && !runtimePreviewApplied) {
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
    setupDescriptionTooltip(windowElement, descriptionText, descriptionToggle);

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

function createHeaderMediaControl(config, windowElement, direction) {
    const isPrevious = direction < 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `art-window__control art-window__control--media-${isPrevious ? "previous" : "next"}`;
    button.textContent = isPrevious ? "<" : ">";
    button.setAttribute("aria-label", `${isPrevious ? "previous" : "next"} media in ${config.title}`);
    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        cycleWindowMedia(windowElement, config.uid, direction);
    });
    return button;
}

function createMediaControls(config, windowElement) {
    if (!hasMediaItems(config) || config.mediaItems.length < 2) {
        return null;
    }

    const controls = document.createElement("div");
    controls.className = "art-window__carousel";
    controls.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
    });

    const actions = [
        { direction: -1, label: "previous", text: "<", className: "art-window__carousel-button--previous" },
        { direction: 1, label: "next", text: ">", className: "art-window__carousel-button--next" }
    ];

    actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `art-window__carousel-button ${action.className}`;
        button.textContent = action.text;
        button.setAttribute("aria-label", `${action.label} media in ${config.title}`);
        button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            cycleWindowMedia(windowElement, config.uid, action.direction);
        });
        controls.appendChild(button);
    });

    return controls;
}

function createTagList(rawTags) {
    const tags = normaliseTags(rawTags);
    if (!tags.length) {
        return null;
    }

    const list = document.createElement("div");
    list.className = "art-window__tags";

    tags.forEach((tag) => {
        const item = document.createElement("span");
        item.className = `art-window__tag ${getTagColorClass(tag)}`;
        item.textContent = tag;
        list.appendChild(item);
    });

    return list;
}

function normaliseTags(tags) {
    if (!Array.isArray(tags)) {
        return [];
    }

    return tags
        .map((tag) => `${tag}`.trim())
        .filter(Boolean)
        .slice(0, 3);
}

function getTagColorClass(tag) {
    const key = `${tag}`.trim().toLowerCase();
    const palette = ["red", "green", "blue"];

    if (!tagColorAssignments.has(key)) {
        const nextIndex = tagColorAssignments.size % palette.length;
        tagColorAssignments.set(key, palette[nextIndex]);
    }

    const color = tagColorAssignments.get(key) ?? palette[0];
    return `art-window__tag--${color}`;
}

function setupDescriptionTooltip(windowElement, description, toggleButton) {
    const text = (description || "").trim();
    if (!text) {
        return;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "art-window__tooltip";
    tooltip.textContent = text;
    tooltip.setAttribute("role", "status");
    tooltip.hidden = true;
    windowElement.appendChild(tooltip);

    let pinned = false;
    let hoverTimeout = null;

    const showTooltip = () => {
        tooltip.hidden = false;
        tooltip.dataset.visible = "1";
    };

    const hideTooltip = (force = false) => {
        if (hoverTimeout !== null) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        if (pinned && !force) {
            return;
        }
        tooltip.dataset.visible = "0";
        tooltip.hidden = true;
    };

    const queueTooltip = () => {
        if (pinned) {
            return;
        }
        if (hoverTimeout !== null) {
            return;
        }
        hoverTimeout = window.setTimeout(() => {
            hoverTimeout = null;
            showTooltip();
        }, 2000);
    };

    const togglePinned = () => {
        pinned = !pinned;
        toggleButton?.classList.toggle("is-active", pinned);
        if (pinned) {
            if (hoverTimeout !== null) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            showTooltip();
            return;
        }
        hideTooltip(true);
    };

    if (toggleButton) {
        toggleButton.addEventListener("click", (event) => {
            event.stopPropagation();
            togglePinned();
        });
    }

    windowElement.addEventListener("pointerenter", queueTooltip);
    windowElement.addEventListener("pointerleave", hideTooltip);
    windowElement.addEventListener("focusin", queueTooltip);
    windowElement.addEventListener("focusout", hideTooltip);
    windowElement.addEventListener("pointerdown", hideTooltip);
}

function hydrateEmbedPreview(config, preview) {
    if (!preview) {
        return;
    }

    if (applyRuntimePreview(config, preview)) {
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

function initialiseLivePreview(windowElement, state) {
    if (!windowElement || !state || state.previewInitialised) {
        return;
    }

    if (!state.viewport && state.viewportHost) {
        const host = state.viewportHost.querySelector(".art-window__content");
        state.viewport = host || state.viewportHost;
    }

    if (state.config.type === "scene") {
        if (state.config.useCanvas !== false && !state.canvas) {
            state.canvas = document.createElement("canvas");
            state.canvas.className = "art-window__canvas";
            state.viewport?.appendChild(state.canvas);
        }
        mountScene(state, windowElement, state.config.uid, { allowInactive: true });
    } else if (hasMediaItems(state.config)) {
        attachMediaPreview(windowElement, state);
    } else if (state.config.videoSrc) {
        attachVideoPreview(windowElement, state);
    } else if (state.config.type === "embed") {
        mountEmbed(state);
    }

    state.previewInitialised = true;
}

function attachVideoPreview(windowElement, state) {
    if (!state?.viewport || state.videoElement || !state.config.videoSrc) {
        return;
    }

    const video = document.createElement("video");
    video.className = "art-window__video";
    video.src = state.config.videoSrc;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";
    video.controls = false;
    video.playbackRate = VIDEO_DEFAULT_RATE;
    if (state.config.poster) {
        video.poster = state.config.poster;
    }

    video.addEventListener(
        "loadeddata",
        () => {
            ensureVideoPlayback(state);
            markPreviewLive(state.previewElement);
        },
        { once: true }
    );
    video.addEventListener("error", () => {
        showError(state.viewportHost, state, "video unavailable");
    });

    state.viewport.appendChild(video);
    state.videoElement = video;
    setupVideoHoverPlayback(windowElement, state);
}

function attachMediaPreview(windowElement, state) {
    if (!state?.viewport || state.mediaElement || !hasMediaItems(state.config)) {
        return;
    }

    renderSelectedMedia(windowElement, state);
}

function renderSelectedMedia(windowElement, state) {
    if (!state?.viewport || !hasMediaItems(state.config)) {
        return;
    }

    const mediaItem = getSelectedMediaItem(state);
    if (!mediaItem) {
        showError(state.viewportHost, state, "media unavailable");
        return;
    }

    teardownMediaElement(state);
    if (state.errorElement) {
        state.errorElement.hidden = true;
    }

    const mediaElement =
        mediaItem.type === "image"
            ? createMediaImageElement(windowElement, state, mediaItem)
            : mediaItem.type === "embed"
            ? createMediaEmbedElement(windowElement, state, mediaItem)
            : createMediaVideoElement(windowElement, state, mediaItem);

    mediaElement.dataset.mediaIndex = state.mediaIndex.toString();
    state.viewport.appendChild(mediaElement);
    state.mediaElement = mediaElement;
    state.mounted = true;
    applyMediaSelectionPlacement(windowElement, state);
}

function createMediaVideoElement(windowElement, state, mediaItem) {
    const video = document.createElement("video");
    video.className = "art-window__media art-window__media--video";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = "auto";
    video.controls = false;
    video.playbackRate = VIDEO_DEFAULT_RATE;
    if (mediaItem.poster) {
        video.poster = mediaItem.poster;
    }

    video.addEventListener(
        "loadedmetadata",
        () => {
            recordMediaDimensions(state, mediaItem, video.videoWidth, video.videoHeight);
            applyMediaSelectionPlacement(windowElement, state);
        },
        { once: true }
    );
    video.addEventListener(
        "loadeddata",
        () => {
            ensureMediaPlayback(state);
            markPreviewLive(state.previewElement);
        },
        { once: true }
    );
    video.addEventListener("error", () => {
        showError(state.viewportHost, state, "media unavailable");
    });
    video.src = mediaItem.src;

    return video;
}

function createMediaImageElement(windowElement, state, mediaItem) {
    const image = document.createElement("img");
    image.className = "art-window__media art-window__media--image";
    image.alt = mediaItem.alt || state.config.title || "portfolio media";
    image.decoding = "async";
    image.loading = "lazy";
    image.addEventListener(
        "load",
        () => {
            recordMediaDimensions(state, mediaItem, image.naturalWidth, image.naturalHeight);
            markPreviewLive(state.previewElement);
            applyMediaSelectionPlacement(windowElement, state);
        },
        { once: true }
    );
    image.addEventListener("error", () => {
        showError(state.viewportHost, state, "media unavailable");
    });
    image.src = mediaItem.src;

    return image;
}

function createMediaEmbedElement(windowElement, state, mediaItem) {
    const iframe = document.createElement("iframe");
    iframe.className = "art-window__media art-window__media--embed";
    iframe.src = mediaItem.embedUrl || normaliseYouTubeEmbedUrl(mediaItem.src);
    iframe.loading = "lazy";
    iframe.title = mediaItem.title || mediaItem.alt || state.config.title || "embedded media";
    iframe.allowFullscreen = mediaItem.allowFullscreen !== false;
    iframe.setAttribute(
        "allow",
        mediaItem.allow ||
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    );
    iframe.referrerPolicy = mediaItem.referrerPolicy || "strict-origin-when-cross-origin";
    iframe.addEventListener(
        "load",
        () => {
            markPreviewLive(state.previewElement);
            applyMediaSelectionPlacement(windowElement, state);
        },
        { once: true }
    );
    iframe.addEventListener("error", () => {
        showError(state.viewportHost, state, "embed unavailable");
    });

    return iframe;
}

function teardownMediaElement(state) {
    const mediaElement = state?.mediaElement;
    if (!mediaElement) {
        return;
    }

    if (mediaElement.tagName === "VIDEO") {
        mediaElement.pause();
        mediaElement.removeAttribute("src");
        if (typeof mediaElement.load === "function") {
            mediaElement.load();
        }
    }

    mediaElement.remove();
    state.mediaElement = null;
}

function getSelectedMediaItem(state) {
    if (!hasMediaItems(state?.config)) {
        return null;
    }

    const items = state.config.mediaItems;
    const index = clamp(Math.round(state.mediaIndex || 0), 0, items.length - 1);
    state.mediaIndex = index;
    return items[index] || null;
}

function cycleWindowMedia(windowElement, configId, direction) {
    const state = ensureWindowState(configId);
    if (!windowElement || !state || !hasMediaItems(state.config) || state.config.mediaItems.length < 2) {
        return;
    }

    const total = state.config.mediaItems.length;
    state.mediaIndex = (state.mediaIndex + direction + total) % total;
    renderSelectedMedia(windowElement, state);
}

function recordMediaDimensions(state, mediaItem, width, height) {
    const nextWidth = Number(width);
    const nextHeight = Number(height);
    if (!state || !mediaItem?.src || nextWidth <= 0 || nextHeight <= 0) {
        return;
    }

    state.mediaDimensions.set(mediaItem.src, {
        width: nextWidth,
        height: nextHeight
    });
}

function ensureMediaPlayback(state) {
    const mediaElement = state?.mediaElement;
    if (!mediaElement || mediaElement.tagName !== "VIDEO") {
        return;
    }

    mediaElement.playbackRate = VIDEO_DEFAULT_RATE;
    const playPromise = mediaElement.play();
    if (playPromise?.catch) {
        playPromise.catch(() => {
            /* autoplay restrictions */
        });
    }
}

function markPreviewLive(preview) {
    if (!preview) {
        return;
    }
    preview.classList.add("is-live");
}

function setupVideoHoverPlayback(windowElement, state) {
    if (!windowElement || !state?.videoElement || state.videoHoverAttached) {
        return;
    }

    const video = state.videoElement;
    const ensurePlay = () => {
        const result = video.play();
        if (result?.catch) {
            result.catch(() => {
                /* ignore autoplay blocking */
            });
        }
    };

    const handleEnter = () => {
        video.playbackRate = VIDEO_HOVER_RATE;
        ensurePlay();
    };

    const handleLeave = () => {
        video.playbackRate = VIDEO_DEFAULT_RATE;
    };

    windowElement.addEventListener("pointerenter", handleEnter);
    windowElement.addEventListener("pointerleave", handleLeave);
    ensurePlay();

    video.addEventListener(
        "play",
        () => {
            markPreviewLive(state.previewElement);
        },
        { once: true }
    );

    state.videoHoverCleanup = () => {
        windowElement.removeEventListener("pointerenter", handleEnter);
        windowElement.removeEventListener("pointerleave", handleLeave);
    };
    state.videoHoverAttached = true;
}

function ensureVideoPlayback(state) {
    const video = state?.videoElement;
    if (!video) {
        return;
    }

    video.playbackRate = VIDEO_DEFAULT_RATE;
    const playPromise = video.play();
    if (playPromise?.catch) {
        playPromise.catch(() => {
            /* autoplay restrictions */
        });
    }
}

function applyRuntimePreview(config, preview) {
    if (!config || config.layerKey !== "art" || !preview) {
        return false;
    }

    const runtimePreview = runtimePreviewCache.get(config.uid);
    if (!runtimePreview) {
        return false;
    }

    preview.style.backgroundImage = `url(${runtimePreview})`;
    preview.classList.add("has-image", "has-runtime-thumbnail");
    return true;
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
    if (initialPosition && !usesRandomPlacement(layerKey)) {
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
            positions: generatePlacementPositions(totalWindows, bounds, layerKey),
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

function generatePlacementPositions(total, bounds, layerKey) {
    if (!total) {
        return [];
    }

    if (usesRandomPlacement(layerKey)) {
        const widthRange = Math.max(bounds.width - WINDOW_DEFAULT_WIDTH, 1);
        const heightRange = Math.max(bounds.height - WINDOW_DEFAULT_HEIGHT, 1);
        return Array.from({ length: total }, () => ({
            x: bounds.left + Math.random() * widthRange,
            y: bounds.top + Math.random() * heightRange
        }));
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

function usesRandomPlacement(layerKey) {
    return layerKey === "art";
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

    const baseSpeed = 0.00025 + Math.random() * 0.00035;
    floatingWindows.add(windowElement);
    floatingStates.set(windowElement, {
        amplitudeX: 3 + Math.random() * 6,
        amplitudeY: 2 + Math.random() * 5,
        speedX: baseSpeed + Math.random() * 0.0002,
        speedY: baseSpeed * (1.15 + Math.random() * 0.5),
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2
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

            const offsetX = Math.sin(timestamp * state.speedX + state.phaseX) * state.amplitudeX;
            const offsetY = Math.cos(timestamp * state.speedY + state.phaseY) * state.amplitudeY;
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
            videoElement: null,
            mediaElement: null,
            mediaIndex: 0,
            mediaDimensions: new Map(),
            viewport: null,
            viewportHost: null,
            mounted: false,
            errorElement: null,
            resizePending: false,
            mountPromise: null,
            embedTimeoutId: null,
            previewInitialised: false,
            previewElement: null,
            videoHoverCleanup: null,
            videoHoverAttached: false,
            reopenTimeoutId: null,
            shouldRestoreContent: false
        };

        windowStates.set(configId, state);
    }

    return windowStates.get(configId);
}

function toggleWindowFullscreen(windowElement, configId) {
    if (!windowElement || !configId) {
        return;
    }

    if (windowElement.classList.contains("is-active")) {
        closeWindow(windowElement, configId);
        return;
    }

    openWindow(windowElement, configId);
}

function prepareWindowContent(windowElement, state) {
    const viewport = windowElement.querySelector(".art-window__viewport");
    if (!viewport) {
        return false;
    }

    const contentHost = viewport.querySelector(".art-window__content");
    const previewElement = viewport.querySelector(".art-window__preview");

    if (!state.viewportHost) {
        state.viewportHost = viewport;
    }
    if (!state.viewport && contentHost) {
        state.viewport = contentHost;
    }
    if (!state.previewElement && previewElement) {
        state.previewElement = previewElement;
    }

    initialiseLivePreview(windowElement, state);

    if (state.config.type === "scene" && !state.canvas && state.config.useCanvas !== false) {
        state.canvas = document.createElement("canvas");
        state.canvas.className = "art-window__canvas";
        state.viewport?.appendChild(state.canvas);
    }

    if (state.errorElement) {
        state.errorElement.hidden = true;
    }

    return true;
}

function mountWindowContent(windowElement, state, { allowInactive = false } = {}) {
    if (!state) {
        return;
    }

    if (state.config.type === "scene") {
        mountScene(state, windowElement, state.config.uid, { allowInactive });
    } else if (hasMediaItems(state.config)) {
        ensureMediaPlayback(state);
        applyMediaSelectionPlacement(windowElement, state);
    } else if (state.config.videoSrc) {
        ensureVideoPlayback(state);
    } else {
        mountEmbed(state);
    }
}

function temporarilyCloseWindow(windowElement, configId) {
    const state = ensureWindowState(configId);
    if (!state || !windowElement) {
        return;
    }

    if (state.reopenTimeoutId !== null) {
        clearTimeout(state.reopenTimeoutId);
        state.reopenTimeoutId = null;
    }

    state.shouldRestoreContent = windowElement.classList.contains("is-active");

    closeWindow(windowElement, configId);
    teardownWindowContent(windowElement, state);
    windowElement.classList.remove("is-visible");
    windowElement.hidden = true;

    state.reopenTimeoutId = window.setTimeout(() => {
        state.reopenTimeoutId = null;
        if (!windowElement.isConnected) {
            return;
        }

        windowElement.hidden = false;
        requestAnimationFrame(() => {
            windowElement.classList.add("is-visible");
            restoreWindowContent(windowElement, state);
        });
    }, 10000);
}

function restoreWindowContent(windowElement, state) {
    if (!windowElement || !state) {
        return;
    }

    if (!prepareWindowContent(windowElement, state)) {
        return;
    }

    if (state.shouldRestoreContent) {
        state.shouldRestoreContent = false;
        mountWindowContent(windowElement, state, { allowInactive: true });
        return;
    }

    if (hasMediaItems(state.config)) {
        ensureMediaPlayback(state);
    } else if (state.config.videoSrc) {
        ensureVideoPlayback(state);
    }
}

function teardownWindowContent(windowElement, state) {
    if (!state) {
        return;
    }

    if (state.embedTimeoutId !== null) {
        clearTimeout(state.embedTimeoutId);
        state.embedTimeoutId = null;
    }

    if (state.config.type === "scene" && state.mounted) {
        try {
            state.instance?.unmount?.();
        } catch (error) {
            console.error(`failed to unmount scene ${state.config.sceneId}`, error);
        }
        state.mounted = false;
        mountedSceneStates.delete(state.config.uid);
    }

    if (state.mountPromise) {
        state.mountPromise = null;
    }

    if (state.videoHoverCleanup) {
        state.videoHoverCleanup();
        state.videoHoverCleanup = null;
        state.videoHoverAttached = false;
    }

    teardownMediaElement(state);

    if (state.videoElement) {
        state.videoElement.pause();
        state.videoElement.removeAttribute("src");
        if (typeof state.videoElement.load === "function") {
            state.videoElement.load();
        }
        state.videoElement.remove();
        state.videoElement = null;
    }

    if (state.iframe) {
        state.iframe.remove();
        state.iframe = null;
    }

    if (state.canvas) {
        state.canvas.remove();
        state.canvas = null;
    }

    state.previewInitialised = false;
    state.mounted = false;

    if (!windowElement.classList.contains("is-active")) {
        syncBodyActiveState();
    }
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
    if (state.reopenTimeoutId !== null) {
        clearTimeout(state.reopenTimeoutId);
        state.reopenTimeoutId = null;
    }
    if (!prepareWindowContent(windowElement, state)) {
        return;
    }

    storeWindowOrigin(windowElement);
    windowElement.classList.add("is-active");
    document.body.classList.add("art-window-active");
    applyExpandedPlacement(windowElement, config);

    mountWindowContent(windowElement, state);
}

function mountScene(state, windowElement, configId, { allowInactive = false } = {}) {
    if (!state || !state.instance) {
        return;
    }

    if (state.mounted) {
        mountedSceneStates.set(configId, state);
        markPreviewLive(state.previewElement);
        return;
    }

    if (state.mountPromise) {
        return;
    }

    const context = { canvas: state.canvas ?? null, container: state.viewport, config: state.config };
    const mountPromise = Promise.resolve(state.instance.mount(context));
    state.mountPromise = mountPromise;

    mountPromise
        .then(() => {
            if (!allowInactive && !windowElement.classList.contains("is-active")) {
                try {
                    state.instance.unmount?.();
                } catch (error) {
                    console.error(`failed to unmount inactive scene ${state.config.sceneId}`, error);
                }
                state.mounted = false;
                mountedSceneStates.delete(configId);
                state.mountPromise = null;
                return;
            }
            state.mounted = true;
            mountedSceneStates.set(configId, state);
            resizeScene(state);
            markPreviewLive(state.previewElement);
            state.mountPromise = null;
        })
        .catch((error) => {
            console.error(`failed to mount scene ${state.config.sceneId}`, error);
            showError(state.viewportHost, state, "failed to start scene");
            state.mounted = false;
            mountedSceneStates.delete(configId);
            state.mountPromise = null;
        });
}

function mountEmbed(state) {
    const viewport = state.viewportHost || state.viewport;
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
            markPreviewLive(state.previewElement);
        });
        state.iframe = iframe;
    }

    if (!state.iframe.isConnected) {
        (state.viewport || viewport).appendChild(state.iframe);
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

    const state = windowStates.get(configId);
    if (state) {
        captureRuntimePreview(windowElement, state);
    }

    windowElement.classList.remove("is-active");
    restoreWindowOrigin(windowElement);

    if (state && hasMediaItems(state.config)) {
        applyMediaSelectionPlacement(windowElement, state);
    }

    if (state && state.mounted && state.config.type === "scene") {
        mountedSceneStates.set(configId, state);
        resizeScene(state);
    }

    if (state && hasMediaItems(state.config)) {
        ensureMediaPlayback(state);
    }

    if (state?.videoElement) {
        ensureVideoPlayback(state);
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

    syncBodyActiveState();
}

function captureRuntimePreview(windowElement, state) {
    if (!state || state.config.layerKey !== "art" || state.config.type !== "scene") {
        return;
    }

    const canvas = state.canvas;
    if (!canvas || typeof canvas.toDataURL !== "function" || canvas.width === 0 || canvas.height === 0) {
        return;
    }

    let dataUrl = null;
    try {
        dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    } catch (error) {
        console.warn("failed to capture art window preview", error);
        return;
    }

    if (!dataUrl) {
        return;
    }

    runtimePreviewCache.set(state.config.uid, dataUrl);
    const preview = windowElement.querySelector(".art-window__preview");
    if (preview) {
        preview.style.backgroundImage = `url(${dataUrl})`;
        preview.classList.add("has-image", "has-runtime-thumbnail");
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

function applyExpandedPlacement(windowElement, config) {
    if (hasMediaItems(config)) {
        applyMediaSelectionPlacement(windowElement, ensureWindowState(config.uid));
        return;
    }

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

function applyMediaSelectionPlacement(windowElement, state) {
    if (!windowElement || !state || !hasMediaItems(state.config)) {
        return;
    }

    if (!windowElement.isConnected) {
        requestAnimationFrame(() => {
            applyMediaSelectionPlacement(windowElement, state);
        });
        return;
    }

    const aspectRatio = getSelectedMediaAspectRatio(state);
    if (windowElement.classList.contains("is-active")) {
        applyMediaAspectFitPlacement(windowElement, aspectRatio);
        return;
    }

    applyPreviewMediaPlacement(windowElement, aspectRatio);
}

function getSelectedMediaAspectRatio(state) {
    const mediaItem = getSelectedMediaItem(state);
    const dimensions = mediaItem?.src ? state.mediaDimensions.get(mediaItem.src) : null;
    if (dimensions?.width > 0 && dimensions?.height > 0) {
        return dimensions.width / dimensions.height;
    }

    return parseAspectRatio(mediaItem?.aspectRatio || mediaItem?.ratio) || DEFAULT_MEDIA_ASPECT_RATIO;
}

function parseAspectRatio(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }

    const raw = `${value || ""}`.trim();
    if (!raw) {
        return null;
    }

    if (raw.includes("/")) {
        const [width, height] = raw.split("/").map((part) => Number(part.trim()));
        if (width > 0 && height > 0) {
            return width / height;
        }
    }

    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function applyMediaAspectFitPlacement(windowElement, aspectRatio) {
    const safeAspectRatio = aspectRatio > 0 ? aspectRatio : DEFAULT_MEDIA_ASPECT_RATIO;
    const gutter = WINDOW_EDGE_GUTTER;
    const bottomClearance = getAudioPlayerClearance(false);
    const header = windowElement.querySelector(".art-window__header");
    const headerRect = header?.getBoundingClientRect();
    const headerHeight = Math.max(headerRect?.height || header?.offsetHeight || 0, 0);
    const availableWidth = Math.max(window.innerWidth - gutter * 2, WINDOW_MIN_WIDTH);
    const availableWindowHeight = Math.max(window.innerHeight - bottomClearance - gutter * 2, WINDOW_MIN_HEIGHT);
    const availableViewportHeight = Math.max(availableWindowHeight - headerHeight, WINDOW_MIN_HEIGHT);

    let viewportWidth = availableWidth;
    let viewportHeight = viewportWidth / safeAspectRatio;

    if (viewportHeight > availableViewportHeight) {
        viewportHeight = availableViewportHeight;
        viewportWidth = viewportHeight * safeAspectRatio;
    }

    viewportWidth = clamp(viewportWidth, WINDOW_MIN_WIDTH, availableWidth);

    const width = Math.round(viewportWidth);
    const height = Math.round(viewportHeight + headerHeight);
    const maxLeft = Math.max(window.innerWidth - width - gutter, 0);
    const maxTop = Math.max(window.innerHeight - bottomClearance - height - gutter, 0);
    const left = clamp((window.innerWidth - width) / 2, Math.min(gutter, maxLeft), maxLeft);
    const top = clamp(gutter + (availableWindowHeight - height) / 2, Math.min(gutter, maxTop), maxTop);

    windowElement.style.left = `${left}px`;
    windowElement.style.top = `${top}px`;
    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;

    windowElement.dataset.expandedWidth = width.toString();
    windowElement.dataset.expandedHeight = height.toString();
}

function applyPreviewMediaPlacement(windowElement, aspectRatio) {
    const safeAspectRatio = aspectRatio > 0 ? aspectRatio : DEFAULT_MEDIA_ASPECT_RATIO;
    const gutter = WINDOW_EDGE_GUTTER;
    const rect = windowElement.getBoundingClientRect();
    const header = windowElement.querySelector(".art-window__header");
    const headerRect = header?.getBoundingClientRect();
    const headerHeight = Math.max(headerRect?.height || header?.offsetHeight || 0, 0);
    const bottomClearance = Math.max(getAudioPlayerClearance(), gutter * 2);
    const availableWidth = Math.max(window.innerWidth - gutter * 2, WINDOW_MIN_WIDTH);
    const availableHeight = Math.max(window.innerHeight - bottomClearance, WINDOW_MIN_HEIGHT);
    const currentWidth = parseFloat(windowElement.style.width ?? "") || rect.width || WINDOW_DEFAULT_WIDTH;

    let viewportWidth = clamp(currentWidth, WINDOW_MIN_WIDTH, availableWidth);
    let viewportHeight = viewportWidth / safeAspectRatio;
    const availableViewportHeight = Math.max(availableHeight - headerHeight, WINDOW_MIN_HEIGHT);

    if (viewportHeight > availableViewportHeight) {
        viewportHeight = availableViewportHeight;
        viewportWidth = viewportHeight * safeAspectRatio;
    }

    viewportWidth = clamp(viewportWidth, WINDOW_MIN_WIDTH, availableWidth);
    const width = Math.round(viewportWidth);
    const height = Math.round(clamp(viewportHeight + headerHeight, WINDOW_MIN_HEIGHT, availableHeight));

    windowElement.style.width = `${width}px`;
    windowElement.style.height = `${height}px`;

    const currentLeft = parseFloat(windowElement.style.left ?? "");
    const currentTop = parseFloat(windowElement.style.top ?? "");
    const nextLeft = Number.isNaN(currentLeft) ? rect.left : currentLeft;
    const nextTop = Number.isNaN(currentTop) ? rect.top : currentTop;
    const clamped = clampPosition(windowElement, nextLeft, nextTop);
    windowElement.style.left = `${clamped.x}px`;
    windowElement.style.top = `${clamped.y}px`;
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

    mountedSceneStates.forEach((state) => {
        resizeScene(state);
    });
}

function handleKeydown(event) {
    const activeWindow = document.querySelector(".art-window.is-active");
    if (!activeWindow) {
        return;
    }

    if (event.key === "Escape") {
        const configId = activeWindow.dataset.windowId;
        if (configId) {
            closeWindow(activeWindow, configId);
        }
        return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
    }

    const configId = activeWindow.dataset.windowId;
    const state = configId ? windowStates.get(configId) : null;
    if (!state || !hasMediaItems(state.config)) {
        return;
    }

    event.preventDefault();
    cycleWindowMedia(activeWindow, configId, event.key === "ArrowLeft" ? -1 : 1);
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
    const delayUnit = immediate ? 0 : WINDOW_REVEAL_DELAY;

    hiddenWindows.forEach((windowEl, index) => {
        const delay = delayUnit * index;
        windowEl.style.setProperty("--window-transition-delay", `${delay}ms`);
        setTimeout(() => {
            windowEl.classList.add("is-visible");
            if (index === hiddenWindows.length - 1) {
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
