const MOTH_PATCH_ID = "aT0pK2";
const MOTH_SCRIPT_SRC = "moth/js/patch.js";

let bundlePromise = null;

function waitForCablesRuntime() {
    if (window.CABLES && typeof window.CABLES.Patch === "function") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        document.addEventListener(
            "CABLES.jsLoaded",
            () => resolve(),
            { once: true }
        );
    });
}

function ensurePatchBundle() {
    if (window.CABLES?.exportedPatches?.[MOTH_PATCH_ID]) {
        return Promise.resolve();
    }

    if (!bundlePromise) {
        bundlePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector("script[data-moth-patch-bundle]");
            if (existing) {
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = MOTH_SCRIPT_SRC;
            script.async = true;
            script.dataset.mothPatchBundle = "1";
            script.addEventListener("load", () => resolve());
            script.addEventListener("error", (error) => {
                bundlePromise = null;
                reject(error);
            });
            document.head.appendChild(script);
        });
    }

    return bundlePromise;
}

export async function createMothPatch(canvas, { onError, onPatchLoaded, onFinishedLoading } = {}) {
    if (!canvas) {
        throw new Error("createMothPatch requires a canvas element");
    }

    await waitForCablesRuntime();
    await ensurePatchBundle();

    const patchData = window.CABLES?.exportedPatches?.[MOTH_PATCH_ID];
    if (!patchData) {
        throw new Error("moth patch data unavailable");
    }

    const patch = new window.CABLES.Patch({
        patch: patchData,
        prefixAssetPath: "moth/",
        assetPath: "assets/",
        jsPath: "js/",
        glCanvas: canvas,
        glCanvasResizeToWindow: false,
        onError: onError ?? logPatchError,
        onPatchLoaded,
        onFinishedLoading,
        canvas: { alpha: true, premultipliedAlpha: true }
    });

    return patch;
}

function logPatchError(initiator, ...args) {
    const label = `[moth] ${initiator}`;
    if (window.CABLES?.logErrorConsole) {
        window.CABLES.logErrorConsole(label, ...args);
    } else {
        console.error(label, ...args);
    }
}
