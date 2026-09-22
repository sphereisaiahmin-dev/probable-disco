import {
    MOTH_RENDER_CONSTANTS,
    OSCILLOSCOPE_OPTICAL_FLOW_SCALE,
    computeSquareViewport,
    createAdaptiveQualityController,
    resampleWaveform
} from "./oscilloscopeCore.mjs";

const ANALYSIS_SIZE = 4096;

const VERTEX_SHADER = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
    vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    vUv = position;
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}`;

const BASE_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uWaveform;
uniform float uTime;
uniform float uLow;
uniform float uHigh;
uniform float uResponse;
uniform float uDepth;
uniform float uRotation;

float waveform(float x) {
    return texture(uWaveform, vec2(fract(x), 0.5)).r;
}

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float line(float distanceValue, float width) {
    return 1.0 - smoothstep(width, width + fwidth(distanceValue) * 1.5, abs(distanceValue));
}

vec2 rotate2d(vec2 point, float angle) {
    float cosine = cos(angle);
    float sine = sin(angle);
    return mat2(cosine, -sine, sine, cosine) * point;
}

void main() {
    vec2 p = vUv * 2.0 - 1.0;
    p.y += 0.10;
    p = rotate2d(p, -radians(uRotation) * uTime);
    float perspective = 1.0 / max(0.72, 1.04 + p.y * 0.12);

    float lowDrive = max(0.0, uLow * uResponse);
    float highDrive = max(0.0, (uHigh - 0.2) * uResponse);
    float audioEnergy = clamp(lowDrive * 3.8 + highDrive * 1.25, 0.0, 1.65);
    float fold = smoothstep(0.115, 0.235, lowDrive);
    p *= perspective * (0.75 + fold * 1.30);
    float transientMotion = sin(uTime * 4.2 + lowDrive * 27.0 + highDrive * 9.0);
    float projectedAngle = mix(0.035, 1.34, fold) + transientMotion * (0.025 + audioEnergy * 0.075);
    float baseAngle = 1.5707963268 - projectedAngle;
    float rows = mix(7.0, 21.0, clamp(lowDrive * 4.6, 0.0, 1.0));

    float wireField = 0.0;
    float fieldMask = 0.0;
    float noiseColor = 0.0;
    for (int layerIndex = 0; layerIndex < 5; layerIndex++) {
        float layer = float(layerIndex) - 2.0;
        if (abs(layer) > 0.1) continue;
        float layerAngle = baseAngle + layer * (0.020 + highDrive * 0.055);
        vec2 origin = vec2(0.0, mix(-0.22, -0.10, fold) + layer * 0.004);
        vec2 reflected = vec2(abs(p.x), p.y) - origin;
        vec2 sheet = rotate2d(reflected, layerAngle);

        float longitudinal = clamp(sheet.x / 0.74, 0.0, 1.0);
        float audioSample = waveform(longitudinal + layer * 0.003);
        float waveformDisplacement = audioSample * uDepth * (0.055 + audioEnergy * 0.095);
        float cellNoise = hash21(vec2(floor(longitudinal * 50.0), floor((sheet.y + 0.5) * rows)) + layer * 19.0);
        float noisyDisplacement = (cellNoise - 0.5) * highDrive * 0.045;
        sheet.y -= waveformDisplacement + noisyDisplacement;

        float halfWidth = 0.018 + sheet.x * mix(0.43, 0.29, fold);
        halfWidth += highDrive * sheet.x * 0.09;
        float mask = step(0.012, sheet.x) * step(sheet.x, 0.74) * step(abs(sheet.y), halfWidth);
        float rowCoordinate = sheet.y / max(0.025, halfWidth * 2.0) + 0.5;
        float columnCoordinate = longitudinal * 50.0 + audioSample * uDepth * 0.34;
        float columns = line(fract(columnCoordinate) - 0.5, 0.035);
        float rowLines = line(fract(rowCoordinate * rows + noisyDisplacement * rows) - 0.5, 0.020);
        float majorRails = line(fract(longitudinal * 10.0) - 0.5, 0.055) * 0.82;
        float boundary = line(abs(sheet.y) - halfWidth, 0.006);
        boundary += line(sheet.x - 0.74, 0.006) * step(abs(sheet.y), halfWidth);
        float dropout = mix(0.56, 1.0, smoothstep(0.16, 0.72, cellNoise + highDrive * 0.24));
        float layerWeight = 1.0;
        float linework = max(max(columns, rowLines), majorRails);
        float grid = mask * smoothstep(0.38, 0.76, linework) * dropout;
        grid += smoothstep(0.32, 0.78, boundary) * step(0.0, sheet.x) * step(sheet.x, 0.75) * 0.72;
        wireField = max(wireField, grid * layerWeight);
        wireField += grid * 0.015;
        fieldMask = max(fieldMask, mask);
        noiseColor = max(noiseColor, cellNoise * grid);
    }

    float pixelNoise = hash21(floor((p + 1.0) * 150.0) + floor(uTime * 23.0));
    float sparks = step(0.992 - highDrive * 0.006, pixelNoise) * fieldMask * highDrive;
    float intensity = wireField * (0.55 + audioEnergy * 0.72) + sparks * 0.42;

    vec3 warmWhite = vec3(0.9, 0.87912, 0.8217);
    vec3 savedWire = vec3(clamp(0.72 + lowDrive * 1.45, 0.0, 1.0), 0.50685, 0.195);
    vec3 magenta = vec3(0.96, 0.08, 0.78);
    vec3 wire = mix(savedWire, warmWhite, 0.78);
    wire = mix(wire, magenta, clamp(highDrive * (0.10 + noiseColor * 0.18), 0.0, 0.30));
    fragColor = vec4(wire * intensity, clamp(intensity, 0.0, 1.0));
}`;

const FLOW_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uCurrent;
uniform sampler2D uPrevious;
uniform vec2 uTexel;
uniform float uFlowScale;

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    float gradientX = 0.0;
    float gradientY = 0.0;
    float temporal = 0.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * uTexel * 2.0;
            float spatial = luminance(texture(uCurrent, vUv + offset).rgb);
            float prior = luminance(texture(uPrevious, vUv + offset).rgb);
            float gaussian = exp(-0.32 * float(x * x + y * y));
            gradientX += spatial * float(x) * gaussian;
            gradientY += spatial * float(y) * gaussian;
            temporal += (spatial - prior) * gaussian;
        }
    }
    vec2 gradient = vec2(gradientX, gradientY);
    vec2 flow = -temporal * gradient / (dot(gradient, gradient) + 0.0008);
    flow *= uFlowScale;
    float magnitude = smoothstep(0.001, 0.20, length(flow));
    vec2 encodedDirection = clamp(flow, vec2(-1.0), vec2(1.0)) * 0.5 + 0.5;
    fragColor = vec4(encodedDirection, magnitude, magnitude);
}`;

const GRID_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPosition;
uniform vec2 uOffset;
void main() {
    gl_Position = vec4(aPosition + uOffset, 0.0, 1.0);
}`;

const GRID_FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float uLow;
uniform float uHigh;
uniform float uOpacity;
void main() {
    float transient = clamp((uHigh - 0.42) * 0.14, 0.0, 0.035);
    vec3 warmWhite = vec3(0.94, 0.925, 0.89);
    vec3 color = warmWhite + vec3(transient, 0.0, -transient);
    float energy = 0.78 + clamp(uLow * 0.9, 0.0, 0.25);
    fragColor = vec4(color * uOpacity * energy, uOpacity);
}`;

/*
 * Optical-flow stage derived from Thomas Diewald's MIT-licensed optical-flow
 * work (2016), as ported to TouchDesigner by David Braun. The WebGL2 shader
 * below retains the prior/current-image gradient approach and attribution.
 */
const FEEDBACK_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uCurrent;
uniform sampler2D uPrevious;
uniform sampler2D uFlow;
uniform vec2 uTexel;
uniform float uLow;
uniform float uHigh;
uniform float uTrail;
uniform float uGlow;

vec3 sampleMirror(sampler2D image, vec2 uv) {
    vec2 mirrored = abs(fract(uv * 0.5 + 0.5) * 2.0 - 1.0);
    return texture(image, mirrored).rgb;
}

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 flowPalette(vec2 flow) {
    float phase = atan(flow.y, flow.x);
    return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
}

vec3 sampleBloom(sampler2D image, vec2 uv, vec2 texel) {
    vec3 bloom = texture(image, uv).rgb * 0.18;
    bloom += texture(image, uv + vec2(texel.x * 3.0, 0.0)).rgb * 0.11;
    bloom += texture(image, uv - vec2(texel.x * 3.0, 0.0)).rgb * 0.11;
    bloom += texture(image, uv + vec2(0.0, texel.y * 3.0)).rgb * 0.11;
    bloom += texture(image, uv - vec2(0.0, texel.y * 3.0)).rgb * 0.11;
    bloom += texture(image, uv + vec2(texel.x * 7.0, texel.y * 7.0)).rgb * 0.095;
    bloom += texture(image, uv + vec2(-texel.x * 7.0, texel.y * 7.0)).rgb * 0.095;
    bloom += texture(image, uv + vec2(texel.x * 7.0, -texel.y * 7.0)).rgb * 0.095;
    bloom += texture(image, uv - vec2(texel.x * 7.0, texel.y * 7.0)).rgb * 0.095;
    return bloom;
}

void main() {
    vec3 current = texture(uCurrent, vUv).rgb;
    current = max(current, texture(uCurrent, vec2(1.0 - vUv.x, vUv.y)).rgb);

    // A faint x-axis reflection complements the strong bilateral fold without
    // turning the lower half into a second opaque copy of the wireframe.
    vec3 xReflection = texture(uCurrent, vec2(vUv.x, 1.0 - vUv.y)).rgb;
    xReflection = max(xReflection, texture(uCurrent, vec2(1.0 - vUv.x, 1.0 - vUv.y)).rgb);
    current = max(current, xReflection * 0.16);

    // Fold a second bilateral copy toward the upper and lower edges. The
    // diagonal vertical offset turns the mirrored wire rows into the hard
    // chevrons visible in the TouchDesigner feedback rather than a flat flip.
    vec2 centered = vUv * 2.0 - 1.0;
    float verticalEdge = smoothstep(0.34, 0.58, abs(centered.y));
    verticalEdge *= 1.0 - smoothstep(0.88, 1.0, abs(centered.y));
    float foldedY = clamp((abs(centered.y) - 0.34) * 0.72 + abs(centered.x) * 0.26, 0.0, 0.48);
    vec2 chevronUv = vec2(0.5 + abs(centered.x) * 0.48, 0.5 + sign(centered.y) * foldedY);
    vec3 chevron = texture(uCurrent, chevronUv).rgb;
    chevron = max(chevron, texture(uCurrent, vec2(1.0 - chevronUv.x, chevronUv.y)).rgb);
    current = max(current, chevron * verticalEdge * 0.82);

    vec2 flowVector = vec2(0.0);
    float flowMagnitude = 0.0;
    float flowWeight = 0.0;
    for (int flowY = -1; flowY <= 1; flowY++) {
        for (int flowX = -1; flowX <= 1; flowX++) {
            float weight = flowX == 0 && flowY == 0 ? 2.0 : 1.0;
            vec4 encodedFlow = texture(uFlow, vUv + vec2(float(flowX), float(flowY)) * uTexel * 3.0);
            flowVector += (encodedFlow.rg * 2.0 - 1.0) * encodedFlow.b * weight;
            flowMagnitude += encodedFlow.b * weight;
            flowWeight += weight;
        }
    }
    flowVector /= flowWeight;
    flowMagnitude /= flowWeight;
    float trailAmount = clamp(uTrail / 2.4, 0.0, 1.0);
    vec2 advectedUv = vUv - flowVector * uTexel * mix(18.0, 110.0, trailAmount);

    vec3 previousBlur = vec3(0.0);
    float hanning[7] = float[](0.036, 0.125, 0.213, 0.252, 0.213, 0.125, 0.036);
    for (int tap = -3; tap <= 3; tap++) {
        float weight = hanning[tap + 3];
        vec2 offset = vec2(float(tap) * uTexel.x * 2.0, float(tap) * uTexel.y * 2.0);
        previousBlur += sampleMirror(uPrevious, advectedUv + offset).rgb * weight;
    }
    previousBlur = max(previousBlur - mix(0.19, 0.008, trailAmount), 0.0);

    // Channel-separated advection supplies a very narrow primary-color edge;
    // the retained image remains overwhelmingly monochrome.
    vec2 chromaOffset = normalize(flowVector + vec2(0.0001)) * uTexel * mix(1.5, 5.5, trailAmount);
    vec3 redTrail = sampleMirror(uPrevious, advectedUv + chromaOffset);
    vec3 blueTrail = sampleMirror(uPrevious, advectedUv - chromaOffset);
    vec3 primaryTrail = vec3(redTrail.r, previousBlur.g, blueTrail.b);
    previousBlur = mix(vec3(luminance(previousBlur)), primaryTrail, 0.085);

    vec3 glow = sampleBloom(uCurrent, vUv, uTexel);
    glow = max(glow - vec3(0.012), 0.0);

    float persistence = mix(0.48, 0.992, trailAmount) + min(uLow * 0.02, 0.006);
    vec3 color = max(current, previousBlur * persistence);
    color += glow * max(uGlow, 0.0) * (0.22 + uHigh * 0.10);
    color += flowPalette(flowVector) * flowMagnitude * (0.012 + uHigh * 0.014);

    color = max(color - (0.98 + uLow * 0.08 - 1.0) * 0.05, 0.0);
    color = pow(color, vec3(1.0 / max(0.35, 1.74 - uLow * 0.55)));
    color = (color - 0.5) * 1.94 + 0.5;
    float gray = luminance(color);
    color = mix(vec3(gray), color, 0.18) * 1.24;
    color = 1.0 - exp(-max(color, 0.0) * 0.42);

    color = pow(max(color, 0.0), vec3(1.0 / 1.3));
    color = (color - 0.5) * 1.2 + 0.5;
    fragColor = vec4(max(color, 0.0), 1.0);
}`;

const FINAL_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uImage;
uniform vec2 uTexel;

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec3 color = texture(uImage, vUv).rgb;
    float center = luminance(color);
    float neighbours = 0.0;
    neighbours += luminance(texture(uImage, vUv + vec2(uTexel.x, 0.0)).rgb);
    neighbours += luminance(texture(uImage, vUv - vec2(uTexel.x, 0.0)).rgb);
    neighbours += luminance(texture(uImage, vUv + vec2(0.0, uTexel.y)).rgb);
    neighbours += luminance(texture(uImage, vUv - vec2(0.0, uTexel.y)).rgb);
    float edge = max(0.0, center * 4.0 - neighbours);
    vec3 edgeColor = vec3(0.95, 0.935, 0.9) * edge * 2.45;
    float gray = luminance(color);
    vec3 composite = max(mix(vec3(gray), color, 0.2), edgeColor);
    float scan = step(0.5465995, fract(vUv.y / 0.003));
    composite *= mix(0.82, 1.0, scan);
    fragColor = vec4(composite, 1.0);
}`;

export function createOscilloscopeScene() {
    let canvas;
    let container;
    let gl;
    let resources = null;
    let frameId = null;
    let mounted = false;
    let contextLost = false;
    let hidden = false;
    let lastTimestamp = 0;
    let elapsed = 0;
    let displaySize = { width: 1, height: 1 };
    let analysisUnsubscribe = null;
    let statusElement = null;
    let exportButton = null;
    let qualityController = createAdaptiveQualityController();
    let waveformSource = new Float32Array(ANALYSIS_SIZE);
    let spectrum = new Float32Array(ANALYSIS_SIZE / 2);
    let lowBand = new Float32Array(ANALYSIS_SIZE);
    let highBand = new Float32Array(ANALYSIS_SIZE);
    let waveformUpload = new Float32Array(qualityController.quality.waveformSamples);
    let gridPoints = new Float32Array(50 * 21 * 2);
    let gridVertices = new Float32Array(8200);

    function mount({ canvas: canvasElement, container: containerElement }) {
        if (!(canvasElement instanceof HTMLCanvasElement)) {
            throw new Error("oscilloscope scene requires a canvas element");
        }

        canvas = canvasElement;
        container = containerElement || canvas.parentElement;
        qualityController = createAdaptiveQualityController();
        mounted = true;
        hidden = document.hidden;
        contextLost = false;
        lastTimestamp = 0;
        elapsed = 0;
        waveformSource = new Float32Array(ANALYSIS_SIZE);
        spectrum = new Float32Array(ANALYSIS_SIZE / 2);
        lowBand = new Float32Array(ANALYSIS_SIZE);
        highBand = new Float32Array(ANALYSIS_SIZE);
        gridPoints = new Float32Array(50 * 21 * 2);
        gridVertices = new Float32Array(8200);

        gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
        });
        if (!gl) {
            throw new Error("webgl2 is required for oscilloscope");
        }

        canvas.addEventListener("webglcontextlost", handleContextLost);
        canvas.addEventListener("webglcontextrestored", handleContextRestored);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        buildOverlay();
        initialiseResources();
        const bounds = container.getBoundingClientRect();
        resize(bounds.width, bounds.height);
        connectAnalysis();
        scheduleFrame();
        return Promise.resolve();
    }

    function scheduleFrame() {
        if (!mounted || hidden || contextLost || frameId !== null) return;
        frameId = requestAnimationFrame(renderFrame);
    }

    function initialiseResources() {
        destroyResources();
        const quality = qualityController.quality;
        const extension = gl.getExtension("EXT_color_buffer_float");
        const targetFormat = extension && quality.name === "high"
            ? { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT, label: "rgba16f" }
            : { internalFormat: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, label: "rgba8" };

        const geometryVao = gl.createVertexArray();
        const geometryBuffer = gl.createBuffer();
        gl.bindVertexArray(geometryVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, geometryBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        resources = {
            vao: gl.createVertexArray(),
            geometryVao,
            geometryBuffer,
            baseProgram: createProgram(GRID_FRAGMENT_SHADER, GRID_VERTEX_SHADER),
            flowProgram: createProgram(FLOW_SHADER),
            feedbackProgram: createProgram(FEEDBACK_SHADER),
            finalProgram: createProgram(FINAL_SHADER),
            waveformTexture: createWaveformTexture(quality.waveformSamples),
            baseTarget: createRenderTarget(quality.resolution, targetFormat, { mipmapped: true }),
            flowTarget: createRenderTarget(Math.max(128, Math.floor(quality.resolution / 2)), {
                internalFormat: gl.RGBA8,
                format: gl.RGBA,
                type: gl.UNSIGNED_BYTE,
                label: "rgba8"
            }),
            feedbackTargets: [
                createRenderTarget(quality.resolution, targetFormat),
                createRenderTarget(quality.resolution, targetFormat)
            ],
            feedbackIndex: 0,
            resolution: quality.resolution,
            format: targetFormat.label
        };
        waveformUpload = new Float32Array(quality.waveformSamples);
        clearFeedback();
        updateStatus();
    }

    function createShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(shader) || "unknown shader error";
            gl.deleteShader(shader);
            throw new Error(message);
        }
        return shader;
    }

    function createProgram(fragmentSource, vertexSource = VERTEX_SHADER) {
        const vertex = createShader(gl.VERTEX_SHADER, vertexSource);
        const fragment = createShader(gl.FRAGMENT_SHADER, fragmentSource);
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const message = gl.getProgramInfoLog(program) || "unknown program link error";
            gl.deleteProgram(program);
            throw new Error(message);
        }
        return program;
    }

    function createWaveformTexture(samples) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, samples, 1, 0, gl.RED, gl.FLOAT, null);
        return texture;
    }

    function createRenderTarget(size, descriptor, { mipmapped = false } = {}) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            descriptor.internalFormat,
            size,
            size,
            0,
            descriptor.format,
            descriptor.type,
            null
        );
        if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            gl.deleteFramebuffer(framebuffer);
            gl.deleteTexture(texture);
            throw new Error(`oscilloscope framebuffer ${descriptor.label} is incomplete`);
        }
        return { texture, framebuffer };
    }

    function clearFeedback() {
        if (!resources) return;
        gl.clearColor(0, 0, 0, 1);
        for (const target of [resources.baseTarget, resources.flowTarget, ...resources.feedbackTargets]) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
            gl.viewport(0, 0, resources.resolution, resources.resolution);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function renderFrame(timestamp) {
        frameId = null;
        if (!mounted || hidden || contextLost || !resources) return;

        const frameTime = lastTimestamp ? Math.min(100, timestamp - lastTimestamp) : 16.667;
        if (lastTimestamp) elapsed += frameTime / 1000;
        lastTimestamp = timestamp;

        const analysis = getAnalysis();
        const snapshot = analysis?.read({ waveform: waveformSource, spectrum, lowBand, highBand });
        const low = snapshot?.lowEnvelope || 0;
        const high = snapshot?.highEnvelope || 0.2;
        resampleWaveform(waveformSource, waveformUpload);
        gl.bindTexture(gl.TEXTURE_2D, resources.waveformTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, waveformUpload.length, 1, gl.RED, gl.FLOAT, waveformUpload);

        renderBase(low, high, snapshot?.currentTime);
        renderFlow();
        renderFeedback(low, high);
        renderFinal();

        const qualityResult = qualityController.record(frameTime, timestamp / 1000);
        if (qualityResult.changed) {
            initialiseResources();
        }

        if (!snapshot?.available) updateStatus(snapshot?.reason || "start the audio player");
        else updateStatus();
        scheduleFrame();
    }

    function renderBase(low, high, mediaTime) {
        const sceneTime = Number.isFinite(mediaTime) ? mediaTime : elapsed;
        const vertexCount = buildGridVertices(low, high, sceneTime);
        gl.bindVertexArray(resources.geometryVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, resources.geometryBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, gridVertices.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
        gl.bindFramebuffer(gl.FRAMEBUFFER, resources.baseTarget.framebuffer);
        gl.viewport(0, 0, resources.resolution, resources.resolution);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(resources.baseProgram);
        uniform1f(resources.baseProgram, "uLow", low);
        uniform1f(resources.baseProgram, "uHigh", high);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        const pixel = 2 / resources.resolution;
        const passes = [
            [0, 0, 1],
            [pixel, 0, 0.14],
            [-pixel, 0, 0.14],
            [0, pixel, 0.14],
            [0, -pixel, 0.14]
        ];
        for (const [offsetX, offsetY, opacity] of passes) {
            uniform2f(resources.baseProgram, "uOffset", offsetX, offsetY);
            uniform1f(resources.baseProgram, "uOpacity", opacity);
            gl.drawArrays(gl.LINES, 0, vertexCount);
        }
        gl.disable(gl.BLEND);
        gl.bindVertexArray(resources.vao);
        gl.bindTexture(gl.TEXTURE_2D, resources.baseTarget.texture);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    function buildGridVertices(low, high, sceneTime) {
        const columns = 50;
        const wingColumns = columns / 2;
        const lowDrive = Math.max(0, low * MOTH_RENDER_CONSTANTS.response);
        const highDrive = Math.max(0, (high - 0.2) * MOTH_RENDER_CONSTANTS.response);
        const rowDrive = Math.min(1, lowDrive * 2.8);
        const rows = Math.max(7, Math.min(21, Math.round(7 + rowDrive * 14)));
        const foldInput = Math.min(1, Math.max(0, (lowDrive - 0.14) / 0.34));
        const fold = foldInput * foldInput * (3 - 2 * foldInput);
        const energy = Math.min(1.8, lowDrive * 4.2 + highDrive * 1.45);
        const cameraAngle = sceneTime * MOTH_RENDER_CONSTANTS.rotation * Math.PI / 180;
        const flap = 0.20 + fold * 0.72
            + Math.sin(sceneTime * 4.7 + lowDrive * 31 + highDrive * 11) * (0.10 + energy * 0.18);
        const cosY = Math.cos(flap);
        const sinY = Math.sin(flap);
        const cosX = Math.cos(cameraAngle + highDrive * 0.22);
        const sinX = Math.sin(cameraAngle + highDrive * 0.22);
        const cosZ = Math.cos(cameraAngle);
        const sinZ = Math.sin(cameraAngle);
        const pointCount = columns * rows;

        for (let row = 0; row < rows; row += 1) {
            const v = row / Math.max(1, rows - 1);
            for (let column = 0; column < columns; column += 1) {
                const isLeftWing = column < wingColumns;
                const side = isLeftWing ? -1 : 1;
                const wingColumn = isLeftWing ? wingColumns - 1 - column : column - wingColumns;
                const u = wingColumn / (wingColumns - 1);
                const pointIndex = row * columns + column;
                const waveformIndex = Math.min(
                    waveformUpload.length - 1,
                    Math.round((pointIndex / Math.max(1, pointCount - 1)) * (waveformUpload.length - 1))
                );
                const wave = waveformUpload[waveformIndex] || 0;
                const seededNoise = Math.sin((column + 1) * 12.9898 + (row + 1) * 78.233 + sceneTime * 2.1);
                const verticalProfile = (v - 0.5) * (0.16 + u * 0.92);
                const wingLift = u * (0.15 + fold * 0.56)
                    + Math.sin(sceneTime * 4.2 + side * 0.8) * u * (0.025 + energy * 0.06);
                let x = side * (0.045 + u * 1.18);
                let y = verticalProfile + wingLift - 0.18;
                let z = Math.sin(u * Math.PI) * (0.08 + fold * 0.16);
                const edgeWeight = Math.pow(Math.abs(u - 0.5) * 2, 1.65);
                const edgeDistortion = Math.sin(v * 19 + sceneTime * 2.3 + seededNoise * 2.2)
                    * highDrive * edgeWeight * 0.12;
                x += side * wave * MOTH_RENDER_CONSTANTS.waveformDepth * (0.22 + energy * 0.52);
                y += wave * MOTH_RENDER_CONSTANTS.waveformDepth * (0.20 + highDrive * 0.52) + edgeDistortion;
                z += wave * MOTH_RENDER_CONSTANTS.waveformDepth * (1.58 + highDrive * 1.95);
                z += edgeDistortion * (1.4 + energy);
                z += seededNoise * highDrive * 0.18;

                const rotatedX = side * (Math.abs(x) * cosY + z * sinY);
                let rotatedZ = -Math.abs(x) * sinY + z * cosY;
                const rotatedY = y * cosX - rotatedZ * sinX;
                rotatedZ = y * sinX + rotatedZ * cosX;
                const finalX = rotatedX * cosZ - rotatedY * sinZ;
                const finalY = rotatedX * sinZ + rotatedY * cosZ;
                const foldScale = 1.0 - fold * 0.34;
                const perspective = 1.42 * foldScale * 2.41421356 * 0.729 / Math.max(2.8, 5 - rotatedZ);
                const outputIndex = pointIndex * 2;
                gridPoints[outputIndex] = Math.tanh((finalX * perspective) / 0.82) * 0.82;
                gridPoints[outputIndex + 1] = Math.tanh((finalY * perspective) / 0.82) * 0.82;
            }
        }

        let cursor = 0;
        const appendPoint = (pointIndex) => {
            const source = pointIndex * 2;
            gridVertices[cursor] = gridPoints[source];
            gridVertices[cursor + 1] = gridPoints[source + 1];
            cursor += 2;
        };
        for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns - 1; column += 1) {
                if (column === wingColumns - 1) continue;
                appendPoint(row * columns + column);
                appendPoint(row * columns + column + 1);
            }
        }
        for (let column = 0; column < columns; column += 1) {
            for (let row = 0; row < rows - 1; row += 1) {
                appendPoint(row * columns + column);
                appendPoint((row + 1) * columns + column);
            }
        }
        return cursor / 2;
    }

    function renderFlow() {
        const previous = resources.feedbackTargets[resources.feedbackIndex];
        const flowResolution = Math.max(128, Math.floor(resources.resolution / 2));
        gl.bindFramebuffer(gl.FRAMEBUFFER, resources.flowTarget.framebuffer);
        gl.viewport(0, 0, flowResolution, flowResolution);
        gl.useProgram(resources.flowProgram);
        bindTexture(resources.flowProgram, "uCurrent", resources.baseTarget.texture, 0);
        bindTexture(resources.flowProgram, "uPrevious", previous.texture, 1);
        uniform2f(resources.flowProgram, "uTexel", 1 / resources.resolution, 1 / resources.resolution);
        uniform1f(resources.flowProgram, "uFlowScale", OSCILLOSCOPE_OPTICAL_FLOW_SCALE);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function renderFeedback(low, high) {
        const previous = resources.feedbackTargets[resources.feedbackIndex];
        const nextIndex = 1 - resources.feedbackIndex;
        const next = resources.feedbackTargets[nextIndex];
        gl.bindFramebuffer(gl.FRAMEBUFFER, next.framebuffer);
        gl.viewport(0, 0, resources.resolution, resources.resolution);
        gl.useProgram(resources.feedbackProgram);
        bindTexture(resources.feedbackProgram, "uCurrent", resources.baseTarget.texture, 0);
        bindTexture(resources.feedbackProgram, "uPrevious", previous.texture, 1);
        bindTexture(resources.feedbackProgram, "uFlow", resources.flowTarget.texture, 2);
        uniform2f(resources.feedbackProgram, "uTexel", 1 / resources.resolution, 1 / resources.resolution);
        uniform1f(resources.feedbackProgram, "uLow", low);
        uniform1f(resources.feedbackProgram, "uHigh", high);
        uniform1f(resources.feedbackProgram, "uTrail", MOTH_RENDER_CONSTANTS.trail);
        uniform1f(resources.feedbackProgram, "uGlow", MOTH_RENDER_CONSTANTS.glow);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        resources.feedbackIndex = nextIndex;
    }

    function renderFinal() {
        const viewport = computeSquareViewport(canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(viewport.x, viewport.y, viewport.size, viewport.size);
        gl.useProgram(resources.finalProgram);
        bindTexture(resources.finalProgram, "uImage", resources.feedbackTargets[resources.feedbackIndex].texture, 0);
        uniform2f(resources.finalProgram, "uTexel", 1 / resources.resolution, 1 / resources.resolution);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function bindTexture(program, name, texture, unit) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(gl.getUniformLocation(program, name), unit);
    }

    function uniform1f(program, name, value) {
        gl.uniform1f(gl.getUniformLocation(program, name), value);
    }

    function uniform2f(program, name, x, y) {
        gl.uniform2f(gl.getUniformLocation(program, name), x, y);
    }

    function getAnalysis() {
        return window.__saintjustusAudioController?.analysis || null;
    }

    function connectAnalysis() {
        analysisUnsubscribe?.();
        analysisUnsubscribe = getAnalysis()?.subscribe((event) => {
            if (event.type === "seek" || event.type === "trackchange") clearFeedback();
            if (event.type === "unavailable") updateStatus("audio analysis unavailable");
        }) || null;
    }

    function buildOverlay() {
        exportButton = document.createElement("button");
        exportButton.type = "button";
        exportButton.className = "moth-export";
        exportButton.textContent = "export";
        exportButton.setAttribute("aria-label", "export moth as saint-audio.png");
        exportButton.addEventListener("pointerdown", (event) => event.stopPropagation());
        exportButton.addEventListener("click", exportSnapshot);

        statusElement = document.createElement("div");
        statusElement.className = "art-scene-panel__status oscilloscope-status";
        statusElement.setAttribute("role", "status");
        statusElement.setAttribute("aria-live", "polite");
        container.append(statusElement, exportButton);
    }

    function exportSnapshot(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!canvas || !gl || !resources) return;
        renderFinal();
        gl.finish();
        const snapshot = document.createElement("canvas");
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        const context = snapshot.getContext("2d", { alpha: false });
        context.drawImage(canvas, 0, 0);
        snapshot.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = "saint-audio.png";
            link.href = url;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        }, "image/png");
    }

    function updateStatus(override) {
        if (!statusElement) return;
        const message = override || `${qualityController.quality.name} · ${resources?.format || "restoring"}`;
        if (statusElement.textContent !== message) statusElement.textContent = message;
    }

    function resize(width, height) {
        if (!canvas) return;
        displaySize = {
            width: Math.max(1, Math.floor(width || 0)),
            height: Math.max(1, Math.floor(height || 0))
        };
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(displaySize.width * pixelRatio));
        canvas.height = Math.max(1, Math.round(displaySize.height * pixelRatio));
        canvas.style.width = `${displaySize.width}px`;
        canvas.style.height = `${displaySize.height}px`;
    }

    function handleVisibilityChange() {
        hidden = document.hidden;
        lastTimestamp = 0;
        if (hidden) {
            if (frameId !== null) cancelAnimationFrame(frameId);
            frameId = null;
            return;
        }
        clearFeedback();
        scheduleFrame();
    }

    function handleContextLost(event) {
        event.preventDefault();
        contextLost = true;
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
        resources = null;
        updateStatus("webgl context lost · waiting to restore");
    }

    function handleContextRestored() {
        contextLost = false;
        initialiseResources();
        lastTimestamp = 0;
        updateStatus("webgl restored");
        scheduleFrame();
    }

    function destroyResources() {
        if (!gl || !resources || contextLost) {
            resources = null;
            return;
        }
        [resources.baseProgram, resources.flowProgram, resources.feedbackProgram, resources.finalProgram].forEach((program) =>
            gl.deleteProgram(program)
        );
        gl.deleteVertexArray(resources.vao);
        gl.deleteVertexArray(resources.geometryVao);
        gl.deleteBuffer(resources.geometryBuffer);
        gl.deleteTexture(resources.waveformTexture);
        [resources.baseTarget, resources.flowTarget, ...resources.feedbackTargets].forEach((target) => {
            gl.deleteFramebuffer(target.framebuffer);
            gl.deleteTexture(target.texture);
        });
        resources = null;
    }

    function unmount() {
        mounted = false;
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
        analysisUnsubscribe?.();
        analysisUnsubscribe = null;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        canvas?.removeEventListener("webglcontextlost", handleContextLost);
        canvas?.removeEventListener("webglcontextrestored", handleContextRestored);
        destroyResources();
        statusElement?.remove();
        exportButton?.remove();
        statusElement = null;
        exportButton = null;
        waveformSource = new Float32Array(0);
        spectrum = new Float32Array(0);
        lowBand = new Float32Array(0);
        highBand = new Float32Array(0);
        waveformUpload = new Float32Array(0);
        gridPoints = new Float32Array(0);
        gridVertices = new Float32Array(0);
        gl = null;
        canvas = null;
        container = null;
    }

    return { mount, resize, unmount };
}
