const scriptPromises = new Map();

function loadPatchScript(patchId, scriptUrl) {
    if (window.CABLES?.exportedPatches?.[patchId]) {
        return Promise.resolve();
    }

    if (scriptPromises.has(patchId)) {
        return scriptPromises.get(patchId);
    }

    const promise = new Promise((resolve, reject) => {
        const handleLoad = () => {
            if (window.CABLES?.exportedPatches?.[patchId]) {
                resolve();
            } else {
                scriptPromises.delete(patchId);
                reject(new Error(`Cables patch ${patchId} did not register`));
            }
        };

        const handleError = () => {
            scriptPromises.delete(patchId);
            reject(new Error(`failed to load Cables patch script: ${scriptUrl}`));
        };

        const existing = document.querySelector(`script[data-cables-scene="${patchId}"]`);
        if (existing) {
            existing.addEventListener("load", handleLoad, { once: true });
            existing.addEventListener("error", handleError, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.dataset.cablesScene = patchId;
        script.addEventListener("load", handleLoad, { once: true });
        script.addEventListener("error", handleError, { once: true });
        document.head.appendChild(script);
    });

    scriptPromises.set(patchId, promise);
    return promise;
}

export function createCablesScene({ patchId, scriptUrl, assetPath = "", jsPath = "", sceneId }) {
    if (!patchId || !scriptUrl) {
        throw new Error("createCablesScene requires a patchId and scriptUrl");
    }

    const sceneLabel = sceneId ?? patchId;

    return function createSceneInstance() {
        let canvasElement;
        let containerElement;
        let patchInstance;
        let resizeObserver;

        async function mount({ canvas, container }) {
            canvasElement = canvas;
            containerElement = container ?? canvas?.parentElement ?? document.body;

            if (!canvasElement) {
                throw new Error(`${sceneLabel} scene requires a canvas element`);
            }

            await loadPatchScript(patchId, scriptUrl);

            const exportedPatch = window.CABLES?.exportedPatches?.[patchId];
            if (!exportedPatch) {
                throw new Error(`${sceneLabel} patch was not registered`);
            }

            const assignedId = canvasElement.id || `cables-${patchId}-${Date.now()}`;
            canvasElement.id = assignedId;

            const size = getContainerSize(containerElement);
            patchInstance = await instantiatePatch({
                exportedPatch,
                canvas: canvasElement,
                container: containerElement,
                assetPath,
                jsPath,
                sceneLabel,
                size
            });

            if (typeof ResizeObserver !== "undefined") {
                resizeObserver = new ResizeObserver(() => {
                    if (!patchInstance) {
                        return;
                    }
                    const nextSize = getContainerSize(containerElement);
                    applySize(patchInstance, nextSize.width, nextSize.height);
                });
                resizeObserver.observe(containerElement);
            }
        }

        function resize(width, height) {
            if (!patchInstance) {
                return;
            }
            applySize(patchInstance, width, height);
        }

        function unmount() {
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }

            if (patchInstance) {
                try {
                    patchInstance.dispose?.();
                } catch (error) {
                    console.error(`failed to dispose ${sceneLabel} patch`, error);
                }

                if (window.CABLES?.patch === patchInstance) {
                    delete window.CABLES.patch;
                }
            }

            patchInstance = null;
            canvasElement = null;
            containerElement = null;
        }

        return {
            mount,
            resize,
            unmount
        };
    };
}

function instantiatePatch({ exportedPatch, canvas, container, assetPath, jsPath, sceneLabel, size }) {
    const initialSize = size ?? { width: window.innerWidth, height: window.innerHeight };
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    return new Promise((resolve, reject) => {
        let settled = false;
        let createdPatch;

        const handleReject = (error) => {
            if (!settled) {
                settled = true;
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        };

        const handleResolve = (instance) => {
            if (!settled) {
                settled = true;
                resolve(instance);
            }
        };

        const config = {
            patch: exportedPatch,
            glCanvas: canvas,
            glCanvasId: canvas.id,
            glCanvasResizeToWindow: false,
            glCanvasResizeToParent: false,
            containerElement: container,
            prefixAssetPath: "",
            assetPath,
            jsPath,
            canvas: { alpha: true, premultipliedAlpha: true },
            onError: (initiator, ...args) => {
                console.error(`[${sceneLabel}] ${initiator}`, ...args);
                handleReject(new Error(`${sceneLabel} patch error`));
            },
            onPatchLoaded: (instance) => {
                createdPatch = instance ?? createdPatch;
            },
            onFinishedLoading: (instance) => {
                const patch = instance ?? createdPatch ?? window.CABLES?.patch;
                if (!patch) {
                    handleReject(new Error(`${sceneLabel} patch failed to initialise`));
                    return;
                }
                if (patch.cgl?.cgCanvas) {
                    patch.cgl.cgCanvas.pixelDensity = pixelRatio;
                }
                applySize(patch, initialSize.width, initialSize.height);
                handleResolve(patch);
            }
        };

        try {
            createdPatch = new window.CABLES.Patch(config);
        } catch (error) {
            handleReject(error);
        }
    });
}

function applySize(patch, width, height) {
    const w = Math.max(Math.floor(width), 1);
    const h = Math.max(Math.floor(height), 1);

    if (patch?.cgl?.setSize) {
        patch.cgl.setSize(w, h);
    }

    if (patch?.cgl?.updateSize) {
        patch.cgl.updateSize();
    }
}

function getContainerSize(element) {
    if (!element) {
        return { width: window.innerWidth, height: window.innerHeight };
    }

    const rect = element.getBoundingClientRect();
    return {
        width: Math.max(rect.width, 1),
        height: Math.max(rect.height, 1)
    };
}

export { applySize, getContainerSize };
