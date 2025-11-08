const THREE_MODULE_URL = "https://unpkg.com/three@0.160.0/build/three.module.js";

export function createRotatingCubeScene() {
    let renderer;
    let scene;
    let camera;
    let cube;
    let clock;
    let three;

    async function mount({ canvas, container }) {
        if (!canvas) {
            throw new Error("rotatingCube scene requires a canvas element");
        }

        three = await import(THREE_MODULE_URL);
        const {
            WebGLRenderer,
            PerspectiveCamera,
            Scene,
            Color,
            AmbientLight,
            DirectionalLight,
            BoxGeometry,
            MeshStandardMaterial,
            Mesh,
            Clock,
            Vector3
        } = three;

        renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        const { width, height } = getViewportSize(container);
        renderer.setSize(width, height, false);

        scene = new Scene();
        scene.background = null;

        camera = new PerspectiveCamera(45, width / height, 0.1, 50);
        camera.position.set(2.4, 1.8, 3.6);
        camera.lookAt(new Vector3(0, 0, 0));

        clock = new Clock();

        const geometry = new BoxGeometry(1.1, 1.1, 1.1, 24, 24, 24);
        const material = new MeshStandardMaterial({
            color: 0x4fa6ff,
            roughness: 0.35,
            metalness: 0.25,
            emissive: new Color(0x0c1020),
            wireframe: false
        });
        cube = new Mesh(geometry, material);
        scene.add(cube);

        const ambient = new AmbientLight(0xffffff, 0.8);
        scene.add(ambient);

        const directional = new DirectionalLight(0xffffff, 1.35);
        directional.position.set(3.5, 4.2, 2.5);
        scene.add(directional);

        renderer.setAnimationLoop(render);
    }

    function render() {
        if (!renderer || !scene || !camera || !cube || !clock) {
            return;
        }

        const elapsed = clock.getElapsedTime();
        cube.rotation.x = elapsed * 0.45;
        cube.rotation.y = elapsed * 0.32;
        cube.position.y = Math.sin(elapsed * 0.6) * 0.2;

        renderer.render(scene, camera);
    }

    function resize(width, height) {
        if (!renderer || !camera) {
            return;
        }

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    function unmount() {
        if (renderer) {
            renderer.setAnimationLoop(null);
            renderer.dispose();
            renderer = null;
        }

        if (scene && cube) {
            cube.geometry.dispose();
            cube.material.dispose();
        }

        scene = null;
        camera = null;
        cube = null;
        clock = null;
        three = null;
    }

    return {
        mount,
        resize,
        unmount
    };
}

function getViewportSize(container) {
    if (!container) {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    const rect = container.getBoundingClientRect();
    return {
        width: Math.max(Math.floor(rect.width), 1),
        height: Math.max(Math.floor(rect.height), 1)
    };
}
