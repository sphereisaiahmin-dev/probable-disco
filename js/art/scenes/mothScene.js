import { createMothPatch } from "../../../moth/index.js";

const MAX_PIXEL_RATIO = 2;
const AUDIO_UNLOCK_EVENTS = ["pointerdown", "touchstart", "keydown"];

function clampSize(value) {
    if (!Number.isFinite(value)) {
        return 1;
    }
    return Math.max(1, Math.floor(value));
}

function getPixelRatio() {
    return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
}

export function createMothScene() {
    let canvasElement = null;
    let containerElement = null;
    let patchInstance = null;
    let touchListener = null;
    let audioUnlockCleanup = null;

    async function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("moth scene requires a canvas element");
        }

        canvasElement = canvas;
        containerElement = container ?? canvas.parentElement ?? document.body;

        const rect = containerElement.getBoundingClientRect();
        applySize(rect.width, rect.height);

        patchInstance = await createMothPatch(canvasElement);
        audioUnlockCleanup = ensureAudioActivation(containerElement);
        touchListener = (event) => {
            event.preventDefault();
        };
        canvasElement.addEventListener("touchmove", touchListener, { passive: false });
    }

    function resize(width, height) {
        applySize(width, height);
    }

    function unmount() {
        if (touchListener && canvasElement) {
            canvasElement.removeEventListener("touchmove", touchListener);
            touchListener = null;
        }

        if (patchInstance) {
            patchInstance.pause?.();
            patchInstance.destroy?.();
            patchInstance = null;
        }

        if (audioUnlockCleanup) {
            audioUnlockCleanup();
            audioUnlockCleanup = null;
        }

        canvasElement = null;
        containerElement = null;
    }

    function applySize(width, height) {
        if (!canvasElement) {
            return;
        }

        const nextWidth = clampSize(width);
        const nextHeight = clampSize(height);
        const pixelRatio = getPixelRatio();

        canvasElement.width = Math.max(1, Math.round(nextWidth * pixelRatio));
        canvasElement.height = Math.max(1, Math.round(nextHeight * pixelRatio));
        canvasElement.style.width = `${nextWidth}px`;
        canvasElement.style.height = `${nextHeight}px`;
    }

    return {
        mount,
        resize,
        unmount
    };
}

function ensureAudioActivation(container) {
    if (areAudioContextsRunning() || typeof document === "undefined") {
        return null;
    }

    const doc = container?.ownerDocument || document;
    if (!doc) {
        return null;
    }

    let disposed = false;
    const listenerOptions = { capture: true };

    const handleGesture = () => {
        resumeAudioContexts().then((ready) => {
            if (ready) {
                cleanup();
            }
        });
    };

    const cleanup = () => {
        if (disposed) {
            return;
        }
        disposed = true;
        AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
            doc.removeEventListener(eventName, handleGesture, listenerOptions.capture);
        });
    };

    AUDIO_UNLOCK_EVENTS.forEach((eventName) => {
        doc.addEventListener(eventName, handleGesture, listenerOptions);
    });

    handleGesture();

    return cleanup;
}

function resumeAudioContexts() {
    const contexts = getAudioContexts();
    const resumePromises = contexts
        .filter((context) => context.state === "suspended" && typeof context.resume === "function")
        .map((context) => {
            try {
                const result = context.resume();
                if (result?.catch) {
                    result.catch(() => {});
                }
                return result;
            } catch (error) {
                return Promise.resolve();
            }
        });

    if (typeof window !== "undefined" && typeof window.Tone?.start === "function") {
        const toneStart = window.Tone.start();
        toneStart?.catch?.(() => {});
    }

    if (resumePromises.length === 0) {
        return Promise.resolve(areAudioContextsRunning());
    }

    return Promise.allSettled(resumePromises).then(() => areAudioContextsRunning());
}

function getAudioContexts() {
    if (typeof window === "undefined") {
        return [];
    }

    const contexts = [];
    if (window.audioContext && typeof window.audioContext.state === "string") {
        contexts.push(window.audioContext);
    }

    if (window.Tone?.context && typeof window.Tone.context.state === "string") {
        contexts.push(window.Tone.context);
    }

    return contexts;
}

function areAudioContextsRunning(contexts = getAudioContexts()) {
    if (contexts.length === 0) {
        return true;
    }

    return contexts.every((context) => context.state === "running" || context.state === "closed");
}
