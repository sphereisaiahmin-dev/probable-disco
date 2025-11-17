import { createMothPatch } from "../../../moth/index.js";

const MAX_PIXEL_RATIO = 2;

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

    async function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("moth scene requires a canvas element");
        }

        canvasElement = canvas;
        containerElement = container ?? canvas.parentElement ?? document.body;

        const rect = containerElement.getBoundingClientRect();
        applySize(rect.width, rect.height);

        patchInstance = await createMothPatch(canvasElement);
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
