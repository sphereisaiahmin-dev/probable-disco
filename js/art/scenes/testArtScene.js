const MAX_PIXEL_RATIO = 2;

function clampSize(value) {
    return Math.max(1, Math.floor(value || 0));
}

function getPixelRatio() {
    return Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
}

export function createTestArtScene() {
    let canvasElement;
    let containerElement;
    let context;
    let animationFrameId;
    let lastSize = { width: 0, height: 0 };
    let startTime = 0;

    const renderFrame = (timestamp) => {
        if (!context || !canvasElement) {
            return;
        }

        const elapsed = (timestamp - startTime) / 1000;
        paintScene(context, lastSize, elapsed);
        animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("test art scene requires a canvas element");
        }

        canvasElement = canvas;
        containerElement = container ?? canvas.parentElement ?? document.body;
        context = canvasElement.getContext("2d", { alpha: true });

        if (!context) {
            throw new Error("2d context unavailable for test art scene");
        }

        const { width, height } = containerElement.getBoundingClientRect();
        applySize(width, height);
        startTime = performance.now();
        animationFrameId = window.requestAnimationFrame(renderFrame);
        return Promise.resolve();
    }

    function resize(width, height) {
        applySize(width, height);
    }

    function unmount() {
        if (animationFrameId) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        context = null;
        canvasElement = null;
        containerElement = null;
    }

    function applySize(width, height) {
        if (!canvasElement || !context) {
            return;
        }

        const nextWidth = clampSize(width);
        const nextHeight = clampSize(height);
        lastSize = { width: nextWidth, height: nextHeight };

        const pixelRatio = getPixelRatio();
        canvasElement.width = Math.max(1, Math.round(nextWidth * pixelRatio));
        canvasElement.height = Math.max(1, Math.round(nextHeight * pixelRatio));
        canvasElement.style.width = `${nextWidth}px`;
        canvasElement.style.height = `${nextHeight}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    return {
        mount,
        resize,
        unmount
    };
}

function paintScene(context, size, elapsed) {
    const width = Math.max(size.width, 1);
    const height = Math.max(size.height, 1);

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(12, 22, 36, 0.95)");
    gradient.addColorStop(0.5, "rgba(18, 60, 96, 0.8)");
    gradient.addColorStop(1, "rgba(180, 220, 255, 0.12)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const stripeHeight = 18;
    for (let y = 0; y < height; y += stripeHeight) {
        const strength = 0.02 + 0.06 * Math.abs(Math.sin(elapsed * 0.8 + y * 0.05));
        context.fillStyle = `rgba(255,255,255,${strength.toFixed(3)})`;
        context.fillRect(0, y, width, 1);
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;

    for (let i = 0; i < 4; i += 1) {
        const t = elapsed * (0.4 + i * 0.1);
        const wobble = Math.sin(t) * 0.2;
        const radius = maxRadius * (0.4 + i * 0.2);
        const horizontalScale = 1 + wobble * 0.3;
        const verticalScale = 1 - wobble * 0.25;

        context.save();
        context.translate(centerX, centerY + Math.sin(t * 1.4) * 10);
        context.scale(horizontalScale, verticalScale);
        context.beginPath();
        context.strokeStyle = `rgba(255,255,255,${0.15 + i * 0.1})`;
        context.lineWidth = 2 + i * 0.6;
        context.globalCompositeOperation = "lighter";
        context.ellipse(0, 0, radius, radius * 0.8, 0, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }

    const nodeCount = 6;
    for (let i = 0; i < nodeCount; i += 1) {
        const angle = (Math.PI * 2 * i) / nodeCount + elapsed * 0.7;
        const orbitRadius = maxRadius * (0.5 + 0.1 * Math.sin(elapsed * 0.6 + i));
        const x = centerX + Math.cos(angle) * orbitRadius;
        const y = centerY + Math.sin(angle) * orbitRadius * 0.7;
        const pulse = 3 + 2 * Math.sin(elapsed * 1.8 + i);

        context.beginPath();
        context.fillStyle = `rgba(255,255,255,${0.3 + 0.2 * Math.sin(elapsed + i)})`;
        context.shadowColor = "rgba(80,160,255,0.4)";
        context.shadowBlur = 20;
        context.arc(x, y, Math.max(1.5, pulse), 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
    }

    context.globalCompositeOperation = "source-over";
}
