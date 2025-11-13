const TEXTURE_MODES = {
    ascii: 0,
    webcam: 1,
    paper: 2
};

const DEFAULTS = {
    particleCount: 14000,
    motion: 0.8,
    textureMode: TEXTURE_MODES.ascii
};

const MASK_SIZE = 256;
const POSITION_REFRESH_INTERVAL = 240; // ms

export function createWebcamParticlesScene() {
    let canvas;
    let container;
    let gl;
    let program;
    let vao;
    let positionBuffer;
    let seedBuffer;
    let videoTexture;
    let asciiTexture;
    let paperTexture;

    let animationFrameId = null;
    let segmentationFrameId = null;

    let uiPanel;
    let statusEl;

    let video;
    let videoStream;
    let videoCanvas;
    let videoCtx;
    let maskCanvas;
    let maskCtx;
    let simulatedVideoSource = null;
    let latestMaskData = null;
    let lastTargetRefresh = 0;

    let segmentation;

    let particleCount = DEFAULTS.particleCount;
    let motionIntensity = DEFAULTS.motion;
    let textureMode = DEFAULTS.textureMode;

    let width = 1;
    let height = 1;
    let dpr = window.devicePixelRatio || 1;

    let currentPositions = new Float32Array(particleCount * 2);
    let targetPositions = new Float32Array(particleCount * 2);
    let particleSeeds = new Float32Array(particleCount * 2);

    let lastTime = performance.now();

    const uniforms = {};

    return {
        async mount(context) {
            canvas = context.canvas;
            container = context.container;
            if (!canvas || !container) {
                throw new Error("scene requires a canvas and container");
            }

            gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
            if (!gl) {
                throw new Error("webgl2 is not available");
            }

            setupUi(container);
            createStatusElement(container);
            initOffscreenCanvases();
            initGlResources();

            await setupVideo();
            await setupSegmentation();

            resize(context.container.clientWidth, context.container.clientHeight);
            resetParticles();

            startSegmentationLoop();
            startRenderLoop();
        },

        resize(newWidth, newHeight) {
            width = Math.max(1, Math.floor(newWidth));
            height = Math.max(1, Math.floor(newHeight));
            dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            if (gl) {
                gl.viewport(0, 0, canvas.width, canvas.height);
                if (uniforms.resolution) {
                    gl.useProgram(program);
                    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
                }
                if (uniforms.pointSize) {
                    gl.uniform1f(uniforms.pointSize, Math.max(1.5 * dpr, Math.min(canvas.width, canvas.height) * 0.01));
                }
            }
        },

        unmount() {
            cancelAnimationFrame(animationFrameId);
            cancelAnimationFrame(segmentationFrameId);
            animationFrameId = null;
            segmentationFrameId = null;

            if (segmentation && segmentation.close) {
                segmentation.close();
            }
            segmentation = null;

            if (videoStream) {
                videoStream.getTracks().forEach((track) => track.stop());
            }
            if (simulatedVideoSource) {
                simulatedVideoSource.stop();
            }
            videoStream = null;
            video = null;

            if (uiPanel?.parentElement) {
                uiPanel.parentElement.removeChild(uiPanel);
            }
            if (statusEl?.parentElement) {
                statusEl.parentElement.removeChild(statusEl);
            }

            if (gl) {
                gl.deleteBuffer(positionBuffer);
                gl.deleteBuffer(seedBuffer);
                gl.deleteVertexArray(vao);
                gl.deleteProgram(program);
                gl.deleteTexture(videoTexture);
                gl.deleteTexture(asciiTexture);
                gl.deleteTexture(paperTexture);
            }

            latestMaskData = null;
        }
    };

    function setupUi(parent) {
        uiPanel = document.createElement("form");
        uiPanel.className = "art-scene-panel";
        uiPanel.setAttribute("aria-label", "webcam particle controls");
        uiPanel.addEventListener("submit", (event) => event.preventDefault());

        const textureGroup = document.createElement("label");
        textureGroup.className = "art-scene-panel__group";
        const textureLabel = document.createElement("span");
        textureLabel.className = "art-scene-panel__label";
        textureLabel.textContent = "texture";
        const textureSelect = document.createElement("select");
        textureSelect.className = "art-scene-panel__select";
        textureSelect.innerHTML = `
            <option value="ascii">ascii</option>
            <option value="webcam">webcam</option>
            <option value="paper">paper impressionist</option>
        `;
        textureSelect.value = getTextureKey(textureMode);
        textureSelect.addEventListener("input", (event) => {
            const key = event.target.value;
            textureMode = TEXTURE_MODES[key] ?? TEXTURE_MODES.ascii;
            updateTextureMode();
        });
        textureGroup.appendChild(textureLabel);
        textureGroup.appendChild(textureSelect);

        const countGroup = createSliderGroup({
            label: "particles",
            min: 1200,
            max: 48000,
            step: 200,
            value: particleCount,
            formatter: formatCount,
            onInput(value) {
                particleCount = value;
                resizeParticleBuffers();
            }
        });

        const motionGroup = createSliderGroup({
            label: "motion",
            min: 0,
            max: 150,
            step: 1,
            value: motionIntensity * 100,
            formatter: (value) => `${Math.round(value)}%`,
            onInput(value) {
                motionIntensity = value / 100;
                updateMotionUniform();
            }
        });

        uiPanel.appendChild(textureGroup);
        uiPanel.appendChild(countGroup.element);
        uiPanel.appendChild(motionGroup.element);
        parent.appendChild(uiPanel);
    }

    function createSliderGroup({ label, min, max, step, value, formatter, onInput }) {
        const wrapper = document.createElement("label");
        wrapper.className = "art-scene-panel__group";
        const labelSpan = document.createElement("span");
        labelSpan.className = "art-scene-panel__label";
        labelSpan.textContent = label;
        const valueSpan = document.createElement("span");
        valueSpan.className = "art-scene-panel__value";
        valueSpan.textContent = formatter(value);
        const row = document.createElement("div");
        row.className = "art-scene-panel__row";
        row.appendChild(labelSpan);
        row.appendChild(valueSpan);
        const input = document.createElement("input");
        input.type = "range";
        input.className = "art-scene-panel__slider";
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        input.addEventListener("input", (event) => {
            const nextValue = Number(event.target.value);
            valueSpan.textContent = formatter(nextValue);
            onInput(nextValue);
        });

        wrapper.appendChild(row);
        wrapper.appendChild(input);

        return { element: wrapper, input, valueSpan };
    }

    function formatCount(value) {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
        }
        return String(value);
    }

    function getTextureKey(mode) {
        const entries = Object.entries(TEXTURE_MODES);
        const entry = entries.find(([, value]) => value === mode);
        return entry ? entry[0] : "ascii";
    }

    function createStatusElement(parent) {
        statusEl = document.createElement("p");
        statusEl.className = "art-scene-panel__status";
        statusEl.setAttribute("role", "status");
        statusEl.setAttribute("aria-live", "polite");
        statusEl.textContent = "initializing webcam…";
        parent.appendChild(statusEl);
    }

    function initOffscreenCanvases() {
        videoCanvas = document.createElement("canvas");
        videoCanvas.width = 640;
        videoCanvas.height = 480;
        videoCtx = videoCanvas.getContext("2d", { willReadFrequently: true });

        maskCanvas = document.createElement("canvas");
        maskCanvas.width = MASK_SIZE;
        maskCanvas.height = MASK_SIZE;
        maskCtx = maskCanvas.getContext("2d");
    }

    async function setupVideo() {
        video = document.createElement("video");
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        const streamResult = await acquireVideoStream();
        videoStream = streamResult.stream;
        simulatedVideoSource = streamResult.controller;

        video.srcObject = videoStream;
        try {
            await video.play();
        } catch (error) {
            console.warn("video play failed, retrying", error);
            await new Promise((resolve) => setTimeout(resolve, 50));
            await video.play().catch((playError) => {
                console.error("unable to start video", playError);
            });
        }
        videoCanvas.width = video.videoWidth || 640;
        videoCanvas.height = video.videoHeight || 480;
        if (!streamResult.simulated) {
            statusEl.textContent = "loading segmentation…";
        }
    }

    async function acquireVideoStream() {
        if (navigator.mediaDevices?.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
                return { stream, simulated: false, controller: null };
            } catch (error) {
                console.warn("failed to access webcam, falling back to simulation", error);
                statusEl.textContent = "webcam unavailable, simulating feed";
            }
        } else {
            console.warn("mediaDevices API is unavailable, using simulated feed");
            statusEl.textContent = "webcam unsupported, simulating feed";
        }

        const controller = createSimulatedVideoSource();
        return { stream: controller.stream, simulated: true, controller };
    }

    async function setupSegmentation() {
        try {
            const module = await import("https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js");
            const SelfieSegmentation = module.SelfieSegmentation;
            segmentation = new SelfieSegmentation({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
            });
            segmentation.setOptions({ modelSelection: 1 });
            segmentation.onResults(handleSegmentationResults);
            statusEl.textContent = "move into frame to reveal particles";
        } catch (error) {
            console.error("failed to load mediapipe", error);
            statusEl.textContent = "segmentation unavailable";
        }
    }

    function createSimulatedVideoSource() {
        const width = 640;
        const height = 480;
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const ctx = sourceCanvas.getContext("2d");
        const bubbles = new Array(12).fill(null).map(() => ({
            x: Math.random(),
            y: Math.random(),
            radius: 0.15 + Math.random() * 0.2,
            speed: 0.05 + Math.random() * 0.15
        }));
        let animationFrame = null;

        const draw = (now) => {
            animationFrame = requestAnimationFrame(draw);
            const time = now / 1000;
            ctx.fillStyle = "#030712";
            ctx.fillRect(0, 0, width, height);

            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "rgba(35,99,188,0.65)");
            gradient.addColorStop(1, "rgba(9,9,20,0.35)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.translate(width / 2, height / 2);
            ctx.rotate(Math.sin(time * 0.2) * 0.1);
            ctx.scale(1.2 + Math.sin(time * 0.3) * 0.1, 1.2 + Math.cos(time * 0.3) * 0.1);
            ctx.fillStyle = "rgba(255,255,255,0.08)";
            ctx.beginPath();
            ctx.ellipse(0, 0, width * 0.3, height * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            bubbles.forEach((bubble, index) => {
                const phase = time * bubble.speed + index * 0.35;
                const x = (Math.sin(phase) * 0.4 + 0.5) * width;
                const y = (Math.cos(phase * 0.8) * 0.3 + 0.5) * height;
                const radius = bubble.radius * Math.min(width, height);
                const alpha = 0.2 + ((Math.sin(phase * 2) + 1) / 2) * 0.5;
                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        animationFrame = requestAnimationFrame(draw);
        const stream = sourceCanvas.captureStream(30);

        return {
            stream,
            stop() {
                cancelAnimationFrame(animationFrame);
            }
        };
    }

    function handleSegmentationResults(results) {
        if (!maskCtx || !results?.segmentationMask) {
            return;
        }
        maskCtx.save();
        maskCtx.clearRect(0, 0, MASK_SIZE, MASK_SIZE);
        maskCtx.drawImage(results.segmentationMask, 0, 0, MASK_SIZE, MASK_SIZE);
        maskCtx.restore();
        latestMaskData = maskCtx.getImageData(0, 0, MASK_SIZE, MASK_SIZE).data;
    }

    function startSegmentationLoop() {
        if (!segmentation) {
            return;
        }
        const pump = async () => {
            if (!segmentation || !video) {
                return;
            }
            if (video.readyState >= video.HAVE_CURRENT_DATA) {
                try {
                    await segmentation.send({ image: video });
                } catch (error) {
                    console.error("segmentation error", error);
                }
            }
            segmentationFrameId = requestAnimationFrame(pump);
        };
        pump();
    }

    function startRenderLoop() {
        const render = (now) => {
            animationFrameId = requestAnimationFrame(render);
            const delta = Math.min(0.1, (now - lastTime) / 1000);
            lastTime = now;
            drawVideoToTexture();
            maybeRefreshTargets(now);
            updateParticles(delta);
            drawScene(now / 1000);
        };
        render(performance.now());
    }

    function drawVideoToTexture() {
        if (!gl || !video || !videoCtx) {
            return;
        }
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
            videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
            gl.bindTexture(gl.TEXTURE_2D, videoTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoCanvas);
        }
    }

    function maybeRefreshTargets(now) {
        if (!latestMaskData) {
            return;
        }
        if (now - lastTargetRefresh < POSITION_REFRESH_INTERVAL) {
            return;
        }
        assignTargetsFromMask(latestMaskData, MASK_SIZE, MASK_SIZE);
        lastTargetRefresh = now;
    }

    function assignTargetsFromMask(maskData, maskWidth, maskHeight) {
        const available = [];
        for (let y = 0; y < maskHeight; y += 2) {
            for (let x = 0; x < maskWidth; x += 2) {
                const index = (y * maskWidth + x) * 4;
                const alpha = maskData[index];
                if (alpha > 96) {
                    available.push(x);
                    available.push(y);
                }
            }
        }
        if (available.length < 2) {
            return;
        }
        const totalSamples = available.length / 2;
        for (let i = 0; i < particleCount; i += 1) {
            const pick = ((i + Math.floor(Math.random() * totalSamples)) % totalSamples) * 2;
            const px = available[pick];
            const py = available[pick + 1];
            const nx = (px / maskWidth) * 2 - 1;
            const ny = 1 - (py / maskHeight) * 2;
            targetPositions[i * 2] = nx;
            targetPositions[i * 2 + 1] = ny;
        }
    }

    function resetParticles() {
        currentPositions = new Float32Array(particleCount * 2);
        targetPositions = new Float32Array(particleCount * 2);
        particleSeeds = new Float32Array(particleCount * 2);
        for (let i = 0; i < particleCount; i += 1) {
            const idx = i * 2;
            currentPositions[idx] = Math.random() * 2 - 1;
            currentPositions[idx + 1] = Math.random() * 2 - 1;
            targetPositions[idx] = currentPositions[idx];
            targetPositions[idx + 1] = currentPositions[idx + 1];
            particleSeeds[idx] = Math.random();
            particleSeeds[idx + 1] = Math.random();
        }
        updatePositionBuffer();
        updateSeedBuffer();
    }

    function resizeParticleBuffers() {
        resetParticles();
    }

    function initGlResources() {
        const vertexSource = `#version 300 es
        precision highp float;
        layout(location = 0) in vec2 aPosition;
        layout(location = 1) in vec2 aSeed;

        uniform vec2 uResolution;
        uniform float uTime;
        uniform float uMotion;
        uniform float uPointSize;

        out vec2 vUv;
        out vec2 vSeed;
        out float vPulse;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
            vec2 wiggle = vec2(
                sin(uTime * 0.7 + aSeed.x * 12.0),
                cos(uTime * 0.6 + aSeed.y * 10.0)
            ) * 0.04 * uMotion;

            vec2 finalPos = aPosition + wiggle;
            gl_Position = vec4(finalPos, 0.0, 1.0);
            gl_PointSize = uPointSize * (0.65 + hash(aSeed * 3.1));
            vUv = finalPos * 0.5 + 0.5;
            vSeed = aSeed;
            vPulse = hash(aSeed * 11.5);
        }`;

        const fragmentSource = `#version 300 es
        precision highp float;
        uniform sampler2D uVideoTexture;
        uniform sampler2D uAsciiTexture;
        uniform sampler2D uPaperTexture;
        uniform int uTextureMode;
        uniform float uMotion;
        in vec2 vUv;
        in vec2 vSeed;
        in float vPulse;
        out vec4 fragColor;

        float circle(vec2 uv, float radius) {
            float dist = length(uv - 0.5);
            return smoothstep(radius, radius - 0.2, dist);
        }

        vec3 applyAscii(vec2 uv, vec3 base) {
            float glyph = texture(uAsciiTexture, uv).r;
            vec3 ink = mix(vec3(0.1), base, 0.6);
            return mix(ink, vec3(1.0), glyph * 0.85);
        }

        vec3 applyWebcam(vec2 sampleUv) {
            vec3 webcamColor = texture(uVideoTexture, sampleUv).rgb;
            return mix(vec3(0.05), webcamColor, 0.95);
        }

        vec3 applyPaper(vec2 uv, vec3 sampleColor) {
            vec4 paper = texture(uPaperTexture, uv);
            return sampleColor * (0.7 + paper.rgb * 0.5);
        }

        void main() {
            vec2 localUv = gl_PointCoord;
            float alpha = circle(localUv, 0.65);
            if (alpha <= 0.01) {
                discard;
            }
            vec3 color;
            if (uTextureMode == 0) {
                color = applyAscii(localUv, vec3(0.85));
            } else if (uTextureMode == 1) {
                color = applyWebcam(vUv);
            } else {
                color = applyPaper(localUv, applyWebcam(vUv));
            }
            float pulse = smoothstep(0.2, 0.8, abs(sin(vPulse * 3.14 + uMotion * 2.0)));
            float beam = smoothstep(0.4, 0.0, abs(localUv.x - 0.5)) * 0.25;
            float network = max(pulse * 0.35, beam);
            fragColor = vec4(color + network, alpha * 0.85);
        }`;

        program = createProgram(vertexSource, fragmentSource);
        gl.useProgram(program);

        uniforms.resolution = gl.getUniformLocation(program, "uResolution");
        uniforms.time = gl.getUniformLocation(program, "uTime");
        uniforms.motion = gl.getUniformLocation(program, "uMotion");
        uniforms.pointSize = gl.getUniformLocation(program, "uPointSize");
        uniforms.textureMode = gl.getUniformLocation(program, "uTextureMode");

        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleCount * 2 * 4, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(0, 1);

        seedBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleCount * 2 * 4, gl.STREAM_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(1, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);

        videoTexture = createTexture(gl.LINEAR, gl.LINEAR);
        asciiTexture = createAsciiTexture();
        paperTexture = createPaperTexture();

        gl.useProgram(program);
        gl.uniform1i(gl.getUniformLocation(program, "uVideoTexture"), 0);
        gl.uniform1i(gl.getUniformLocation(program, "uAsciiTexture"), 1);
        gl.uniform1i(gl.getUniformLocation(program, "uPaperTexture"), 2);
        updateTextureMode();
        updateMotionUniform();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }

    function updateTextureMode() {
        if (gl && program && uniforms.textureMode) {
            gl.useProgram(program);
            gl.uniform1i(uniforms.textureMode, textureMode);
        }
    }

    function updateMotionUniform() {
        if (gl && program && uniforms.motion) {
            gl.useProgram(program);
            gl.uniform1f(uniforms.motion, motionIntensity);
        }
    }

    function updatePositionBuffer() {
        if (!gl || !positionBuffer) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, currentPositions, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    function updateSeedBuffer() {
        if (!gl || !seedBuffer) {
            return;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleSeeds, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    function updateParticles(deltaTime) {
        if (!currentPositions || !targetPositions) {
            return;
        }
        const smoothing = Math.min(1, deltaTime * (2 + motionIntensity * 4));
        for (let i = 0; i < particleCount; i += 1) {
            const idx = i * 2;
            const tx = targetPositions[idx];
            const ty = targetPositions[idx + 1];
            currentPositions[idx] += (tx - currentPositions[idx]) * smoothing;
            currentPositions[idx + 1] += (ty - currentPositions[idx + 1]) * smoothing;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, currentPositions);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    function drawScene(time) {
        if (!gl) {
            return;
        }
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, asciiTexture);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, paperTexture);
        gl.uniform1f(uniforms.time, time);
        gl.uniform1f(uniforms.pointSize, Math.max(1.5 * dpr, Math.min(canvas.width, canvas.height) * 0.01));
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArraysInstanced(gl.POINTS, 0, 1, particleCount);
        gl.bindVertexArray(null);
    }

    function createProgram(vertexSource, fragmentSource) {
        const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`program link failed: ${info}`);
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return program;
    }

    function compileShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`shader compile failed: ${info}`);
        }
        return shader;
    }

    function createTexture(minFilter = gl.LINEAR, magFilter = gl.LINEAR) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 0])
        );
        return texture;
    }

    function createAsciiTexture() {
        const size = 128;
        const asciiCanvas = document.createElement("canvas");
        asciiCanvas.width = size;
        asciiCanvas.height = size;
        const ctx = asciiCanvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 32px 'Share Tech Mono', monospace";
        const chars = ["#", "&", ";", "*", "@", "/", "?", "+"];
        for (let y = 0; y < 4; y += 1) {
            for (let x = 0; x < 4; x += 1) {
                const char = chars[(x + y * 4) % chars.length];
                ctx.save();
                ctx.translate((x + 0.5) * (size / 4), (y + 0.5) * (size / 4));
                ctx.rotate(((x + y) % 4) * 0.2);
                ctx.fillText(char, 0, 0);
                ctx.restore();
            }
        }
        const texture = createTexture(gl.NEAREST, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asciiCanvas);
        return texture;
    }

    function createPaperTexture() {
        const size = 64;
        const paperCanvas = document.createElement("canvas");
        paperCanvas.width = size;
        paperCanvas.height = size;
        const ctx = paperCanvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, "rgba(255,255,255,0.4)");
        gradient.addColorStop(1, "rgba(200,200,200,0.1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 400; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const w = Math.random() * 6 + 2;
            const h = Math.random() * 6 + 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`;
            ctx.fillRect(x, y, w, h);
        }
        const texture = createTexture(gl.LINEAR, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paperCanvas);
        return texture;
    }
}
