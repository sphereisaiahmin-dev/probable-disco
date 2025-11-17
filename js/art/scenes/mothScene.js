const MOTH_SCRIPT_URL = "/moth/js/patch.js";
const PATCH_ID = "aT0pK2";
const AUDIO_ANALYZER_OP_ID = "jh3bkljmu";
const AUDIO_OUTPUT_OP_ID = "po29fcheo";
const AUDIO_PLAYER_OP_ID = "o2ic2lisc";
const MAX_PIXEL_RATIO = 2;

let mothRuntimePromise = null;

function ensureMothRuntime() {
    if (window.CABLES?.exportedPatches?.[PATCH_ID]) {
        return Promise.resolve();
    }

    if (!mothRuntimePromise) {
        mothRuntimePromise = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-moth-runtime="1"]');
            if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", () => reject(new Error("moth scene: failed to load bundle")), {
                    once: true
                });
                return;
            }

            const script = document.createElement("script");
            script.src = MOTH_SCRIPT_URL;
            script.async = true;
            script.dataset.mothRuntime = "1";
            script.addEventListener("load", resolve, { once: true });
            script.addEventListener(
                "error",
                () => reject(new Error("moth scene: failed to load bundle")),
                { once: true }
            );
            document.head.appendChild(script);
        }).then(() => waitForCablesRuntime());
    }

    return mothRuntimePromise.then(() => waitForExportedPatch());
}

function waitForCablesRuntime() {
    if (window.CABLES?.Patch) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        document.addEventListener(
            "CABLES.jsLoaded",
            () => {
                resolve();
            },
            { once: true }
        );
    });
}

function waitForExportedPatch() {
    if (window.CABLES?.exportedPatches?.[PATCH_ID]) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            if (window.CABLES?.exportedPatches?.[PATCH_ID]) {
                resolve();
                return;
            }
            attempts += 1;
            if (attempts > 40) {
                reject(new Error("moth scene: exported patch unavailable"));
                return;
            }
            window.setTimeout(check, 50);
        };
        check();
    });
}

function waitForAudioController() {
    const existing = window.__saintjustusAudioController;
    if (existing?.ready) {
        return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
        document.addEventListener(
            "saintjustus:audiocontrollerready",
            (event) => {
                const controller = event?.detail?.controller || window.__saintjustusAudioController;
                if (controller?.ready) {
                    resolve(controller);
                }
            },
            { once: true }
        );
    });
}

function clampSize(value) {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.max(1, Math.floor(value));
}

function applyCanvasSize(canvas, width, height) {
    if (!canvas) {
        return;
    }

    const nextWidth = clampSize(width);
    const nextHeight = clampSize(height);
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

    canvas.width = Math.max(1, Math.round(nextWidth * ratio));
    canvas.height = Math.max(1, Math.round(nextHeight * ratio));
    canvas.style.width = `${nextWidth}px`;
    canvas.style.height = `${nextHeight}px`;
}

function setPortValue(op, name, value) {
    if (!op || typeof op.getPort !== "function") {
        return false;
    }

    const port = op.getPort(name) || op.getPort(name?.toLowerCase?.(), true);
    if (!port) {
        return false;
    }

    if (typeof port.setValue === "function") {
        port.setValue(value);
        return true;
    }

    if (typeof port.set === "function") {
        port.set(value);
        return true;
    }

    return false;
}

function disableInternalAudio(patch) {
    try {
        const outputOp = patch.getOpById?.(AUDIO_OUTPUT_OP_ID);
        if (outputOp) {
            setPortValue(outputOp, "Mute", 1);
            setPortValue(outputOp, "Volume", 0);
        }

        const bufferPlayer = patch.getOpById?.(AUDIO_PLAYER_OP_ID);
        if (bufferPlayer) {
            setPortValue(bufferPlayer, "Loop", 0);
        }
    } catch (error) {
        console.warn("moth scene: failed to mute internal audio", error);
    }
}

export function createMothScene() {
    let canvasElement = null;
    let containerElement = null;
    let patchInstance = null;
    let unsubscribeAnalyser = null;
    let queuedAudioNode = null;
    let isUnmounted = false;

    function resize(width, height) {
        applyCanvasSize(canvasElement, width, height);
    }

    async function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("moth scene requires a canvas element");
        }

        canvasElement = canvas;
        containerElement = container ?? canvas.parentElement ?? document.body;
        const bounds = containerElement.getBoundingClientRect();
        applyCanvasSize(canvasElement, bounds.width, bounds.height);
        isUnmounted = false;

        const audioControllerPromise = waitForAudioController().catch(() => null);
        await ensureMothRuntime();
        if (isUnmounted) {
            return;
        }

        await waitForExportedPatch();
        if (isUnmounted) {
            return;
        }

        patchInstance = await instantiatePatch(canvasElement);
        if (isUnmounted) {
            patchInstance?.dispose?.();
            patchInstance = null;
            return;
        }

        audioControllerPromise
            .then((controller) => {
                if (!controller || isUnmounted) {
                    return;
                }
                attachAudioBridge(controller);
            })
            .catch(() => {});
    }

    function attachAudioBridge(controller) {
        if (!controller) {
            return;
        }

        if (typeof controller.getAnalyserNode === "function") {
            const analyserNode = controller.getAnalyserNode();
            if (analyserNode) {
                routeAudioNode(analyserNode);
            }
        }

        if (typeof controller.onAnalyserReady === "function") {
            unsubscribeAnalyser = controller.onAnalyserReady(({ analyserNode }) => {
                if (!isUnmounted) {
                    routeAudioNode(analyserNode);
                }
            });
        }
    }

    function routeAudioNode(node) {
        if (!node || isUnmounted) {
            return;
        }

        if (!patchInstance) {
            queuedAudioNode = node;
            return;
        }

        const analyserOp = patchInstance.getOpById?.(AUDIO_ANALYZER_OP_ID);
        if (!analyserOp) {
            queuedAudioNode = node;
            return;
        }

        const success = setPortValue(analyserOp, "Audio In", node);
        if (success) {
            queuedAudioNode = null;
        } else {
            queuedAudioNode = node;
        }
    }

    async function instantiatePatch(canvas) {
        return new Promise((resolve, reject) => {
            const exportedPatch = window.CABLES?.exportedPatches?.[PATCH_ID];
            if (!exportedPatch) {
                reject(new Error("moth scene: exported patch missing"));
                return;
            }

            try {
                const instance = new window.CABLES.Patch({
                    patch: exportedPatch,
                    prefixAssetPath: "moth/",
                    assetPath: "assets/",
                    jsPath: "js/",
                    glCanvas: canvas,
                    glCanvasResizeToWindow: false,
                    silent: true,
                    onPatchLoaded: () => {
                        disableInternalAudio(instance);
                        if (queuedAudioNode) {
                            routeAudioNode(queuedAudioNode);
                        }
                    },
                    onFinishedLoading: () => {
                        resolve(instance);
                    },
                    onError: (initiator, error) => {
                        console.error("moth scene: cables error", initiator, error);
                    },
                    canvas: { alpha: true, premultipliedAlpha: true }
                });

                instance.cgl?.setAutoResize?.("none");
            } catch (error) {
                reject(error);
            }
        });
    }

    function unmount() {
        isUnmounted = true;
        queuedAudioNode = null;

        if (typeof unsubscribeAnalyser === "function") {
            unsubscribeAnalyser();
            unsubscribeAnalyser = null;
        }

        if (patchInstance) {
            try {
                patchInstance.pause?.();
                patchInstance.dispose?.();
            } catch (error) {
                console.error("moth scene: failed to dispose patch", error);
            }
            patchInstance = null;
        }

        canvasElement = null;
        containerElement = null;
    }

    return {
        mount,
        resize,
        unmount
    };
}
