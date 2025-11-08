const VERTEX_SHADER = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform float time;

float noise(vec2 uv) {
    return fract(sin(dot(uv, vec2(127.1, 311.7))) * 43758.5453123);
}

float smoothNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec2 centered = uv - 0.5;
    centered.x *= resolution.x / resolution.y;

    float radius = length(centered) * 2.0;
    float pulse = sin(time * 0.7 + radius * 4.0);
    float grain = smoothNoise(uv * 6.0 + time * 0.2);
    float halo = smoothstep(1.2, 0.1, radius + pulse * 0.1);

    vec3 color = mix(vec3(0.05, 0.1, 0.2), vec3(0.45, 0.9, 0.65), halo);
    color += grain * 0.08;
    color += vec3(0.2, 0.1, 0.3) * smoothstep(0.6, 0.0, radius + pulse * 0.25);

    gl_FragColor = vec4(color, 1.0);
}
`;

export function createPulseFieldScene() {
    let gl;
    let program;
    let positionBuffer;
    let positionLocation;
    let timeLocation;
    let resolutionLocation;
    let animationFrame;
    let startTime = 0;

    function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("pulseField scene requires a canvas element");
        }

        gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
        if (!gl) {
            throw new Error("webgl not supported");
        }

        program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        gl.useProgram(program);

        positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        );

        positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        timeLocation = gl.getUniformLocation(program, "time");
        resolutionLocation = gl.getUniformLocation(program, "resolution");

        resizeCanvas(canvas, container);
        startTime = performance.now();
        render();
    }

    function render() {
        if (!gl) {
            return;
        }

        const elapsed = (performance.now() - startTime) / 1000;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(timeLocation, elapsed);
        gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationFrame = requestAnimationFrame(render);
    }

    function resize(width, height) {
        if (!gl) {
            return;
        }

        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = gl.canvas;
        const displayWidth = Math.max(Math.floor(width * pixelRatio), 1);
        const displayHeight = Math.max(Math.floor(height * pixelRatio), 1);

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    function unmount() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }

        if (gl) {
            if (positionBuffer) {
                gl.deleteBuffer(positionBuffer);
            }
            if (program) {
                gl.deleteProgram(program);
            }
        }

        gl = null;
        program = null;
        positionBuffer = null;
        positionLocation = null;
        timeLocation = null;
        resolutionLocation = null;
    }

    return {
        mount,
        resize,
        unmount
    };
}

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteProgram(program);
        throw new Error(`program failed to link: ${info}`);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`shader failed to compile: ${info}`);
    }

    return shader;
}

function resizeCanvas(canvas, container) {
    const rect = container ? container.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(Math.floor(rect.width * pixelRatio), 1);
    canvas.height = Math.max(Math.floor(rect.height * pixelRatio), 1);
    canvas.style.width = `${Math.max(rect.width, 1)}px`;
    canvas.style.height = `${Math.max(rect.height, 1)}px`;
}
