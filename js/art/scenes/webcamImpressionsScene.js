const IFRAME_SRC = "https://cables.gl/view/MN9302";
const IFRAME_ALLOW = "autoplay; camera; microphone";

export function createWebcamImpressionsScene() {
    let container;
    let iframe;
    let permissionStatus;

    return {
        async mount({ container: mountPoint, canvas }) {
            container = mountPoint;
            if (!container) {
                throw new Error("impressions scene requires a container element");
            }

            if (canvas?.parentElement === container) {
                canvas.remove();
            }

            iframe = document.createElement("iframe");
            iframe.className = "art-window__iframe";
            iframe.src = IFRAME_SRC;
            iframe.allow = IFRAME_ALLOW;
            iframe.setAttribute("title", "cables.gl webcam impressions");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowfullscreen", "true");
            iframe.loading = "lazy";
            iframe.referrerPolicy = "no-referrer";

            console.info("[impressions] embedding remote scene", { src: IFRAME_SRC });

            iframe.addEventListener("load", handleIframeLoad);
            container.appendChild(iframe);

            logWebcamPermissionState();
        },

        resize(width, height) {
            if (!iframe) {
                return;
            }

            const nextWidth = Math.max(1, Math.floor(width));
            const nextHeight = Math.max(1, Math.floor(height));
            iframe.style.width = `${nextWidth}px`;
            iframe.style.height = `${nextHeight}px`;
        },

        unmount() {
            if (permissionStatus) {
                permissionStatus.onchange = null;
                permissionStatus = null;
            }

            if (iframe) {
                iframe.removeEventListener("load", handleIframeLoad);
                iframe.remove();
                iframe = null;
            }

            container = null;
        }
    };

    function handleIframeLoad() {
        console.info("[impressions] iframe scene connected and ready");
    }

    async function logWebcamPermissionState() {
        const permissions = navigator.permissions;
        if (!permissions?.query) {
            console.info("[impressions] permissions API unavailable; relying on iframe prompt");
            return;
        }

        try {
            permissionStatus = await permissions.query({ name: "camera" });
            console.info(`[impressions] webcam permission state: ${permissionStatus.state}`);
            permissionStatus.onchange = () => {
                console.info(`[impressions] webcam permission changed: ${permissionStatus.state}`);
            };
        } catch (error) {
            console.warn("[impressions] unable to determine webcam permission state", error);
        }
    }
}
