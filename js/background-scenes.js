const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const stack = document.querySelector("[data-canvas-stack]");
if (!stack) {
    exportEvent(null);
} else {
    initialize();
}

function exportEvent(canvas) {
    // Notify listeners (like the audio player) even if no canvas exists so they can noop gracefully.
    document.dispatchEvent(
        new CustomEvent("backgroundcanvaschange", { detail: { canvas }, bubbles: false })
    );
}

function initialize() {
    const canvases = new Map();
    stack.querySelectorAll("[data-background-canvas]").forEach((canvas) => {
        const mode = canvas.dataset.backgroundCanvas;
        if (!mode) {
            return;
        }
        canvases.set(mode, canvas);
        canvas.addEventListener(
            "touchmove",
            (event) => {
                event.preventDefault();
            },
            { passive: false }
        );
    });

    if (!canvases.size) {
        exportEvent(null);
        return;
    }

    let activeTheme = normalizeTheme(document.body.dataset.theme);
    let runtimeReady = Boolean(window.CABLES && typeof window.CABLES.Patch === "function");
    let darkPatch = null;
    let lightPatch = null;
    let lightPatchPromise = null;

    updateCanvasState(activeTheme);

    if (!runtimeReady) {
        document.addEventListener(
            "CABLES.jsLoaded",
            () => {
                runtimeReady = true;
                instantiateDarkPatch();
                ensureLightPatch();
                applyTheme(activeTheme);
            },
            { once: true }
        );
    } else {
        instantiateDarkPatch();
        ensureLightPatch();
        applyTheme(activeTheme);
    }

    document.addEventListener("themechange", (event) => {
        const theme = normalizeTheme(event.detail?.theme);
        if (theme === activeTheme) {
            return;
        }
        activeTheme = theme;
        updateCanvasState(activeTheme);
        applyTheme(activeTheme);
    });

    window.addEventListener("storage", (event) => {
        if (event.key !== "saintjustus.theme") {
            return;
        }
        const theme = normalizeTheme(event.newValue);
        if (!theme || theme === activeTheme) {
            return;
        }
        activeTheme = theme;
        updateCanvasState(activeTheme);
        applyTheme(activeTheme);
    });

    function normalizeTheme(theme) {
        return theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
    }

    function updateCanvasState(theme) {
        canvases.forEach((canvas, mode) => {
            const isActive = mode === theme;
            canvas.classList.toggle("is-active", isActive);
            if (isActive) {
                canvas.removeAttribute("aria-hidden");
                canvas.tabIndex = 0;
            } else {
                canvas.setAttribute("aria-hidden", "true");
                canvas.tabIndex = -1;
            }
        });
        exportEvent(canvases.get(theme) ?? null);
    }

    function instantiateDarkPatch() {
        if (darkPatch || !runtimeReady) {
            return;
        }
        const canvas = canvases.get(THEME_DARK);
        if (!canvas) {
            return;
        }
        try {
            darkPatch = new window.CABLES.Patch({
                patch: window.CABLES.exportedPatch,
                prefixAssetPath: "",
                assetPath: "assets/",
                jsPath: "js/",
                glCanvas: canvas,
                glCanvasResizeToWindow: true,
                onError: logError("dark"),
                canvas: { alpha: true, premultipliedAlpha: true }
            });
        } catch (error) {
            console.error("background scenes: failed to start dark patch", error);
        }
    }

    function ensureLightPatch() {
        if (lightPatch || lightPatchPromise || !runtimeReady) {
            return lightPatchPromise;
        }
        const canvas = canvases.get(THEME_LIGHT);
        if (!canvas) {
            return null;
        }
        lightPatchPromise = new Promise((resolve, reject) => {
            try {
                const patch = new window.CABLES.Patch({
                    patchFile: "lightmode/js/browser_home_page.json",
                    prefixAssetPath: "lightmode/",
                    assetPath: "assets/",
                    jsPath: "lightmode/js/",
                    glCanvas: canvas,
                    glCanvasResizeToWindow: true,
                    onError: logError("light"),
                    onFinishedLoading: () => resolve(patch),
                    canvas: { alpha: true, premultipliedAlpha: true }
                });
                lightPatch = patch;
            } catch (error) {
                console.error("background scenes: failed to start light patch", error);
                lightPatchPromise = null;
                reject(error);
                return;
            }
        });
        lightPatchPromise.then((patch) => {
            if (activeTheme !== THEME_LIGHT) {
                patch?.pause?.();
            }
        });
        return lightPatchPromise;
    }

    function applyTheme(theme) {
        if (!runtimeReady) {
            return;
        }
        if (theme === THEME_LIGHT) {
            const promise = ensureLightPatch();
            if (promise) {
                promise
                    .then((patch) => {
                        patch?.resume?.();
                        darkPatch?.pause?.();
                        exportEvent(canvases.get(THEME_LIGHT) ?? null);
                    })
                    .catch((error) => {
                        console.error("background scenes: failed to activate light patch", error);
                    });
            }
        } else {
            darkPatch?.resume?.();
            lightPatch?.pause?.();
            exportEvent(canvases.get(THEME_DARK) ?? null);
        }
    }

    function logError(mode) {
        return function handleError(initiator, ...args) {
            const label = `[${mode} patch] ${initiator}`;
            if (window.CABLES && typeof window.CABLES.logErrorConsole === "function") {
                window.CABLES.logErrorConsole(label, ...args);
            } else {
                console.error(label, ...args);
            }
        };
    }
}
