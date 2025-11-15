const IFRAME_SRC = "https://cables.gl/view/F2tLE2";
const IFRAME_ALLOW = "autoplay; camera; microphone";

export function createAsciiScene() {
    let container;
    let iframe;

    return {
        async mount({ container: mountPoint, canvas }) {
            container = mountPoint;
            if (!container) {
                throw new Error("ascii scene requires a container element");
            }

            if (canvas?.parentElement === container) {
                canvas.remove();
            }

            iframe = document.createElement("iframe");
            iframe.className = "art-window__iframe";
            iframe.src = IFRAME_SRC;
            iframe.allow = IFRAME_ALLOW;
            iframe.setAttribute("title", "ASCII scene from cables.gl");
            iframe.setAttribute("frameborder", "0");
            iframe.setAttribute("allowfullscreen", "true");
            iframe.loading = "lazy";
            iframe.referrerPolicy = "no-referrer";

            console.info("[ascii] embedding remote scene", { src: IFRAME_SRC });

            iframe.addEventListener("load", handleIframeLoad);
            container.appendChild(iframe);
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
            if (iframe) {
                iframe.removeEventListener("load", handleIframeLoad);
                iframe.remove();
                iframe = null;
            }

            container = null;
        }
    };

    function handleIframeLoad() {
        console.info("[ascii] iframe scene connected and ready");
    }
}
