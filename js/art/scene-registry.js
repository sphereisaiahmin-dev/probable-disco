import { createRotatingCubeScene } from "./scenes/rotatingCube.js";
import { createPulseFieldScene } from "./scenes/pulseField.js";


const registry = {
    rotatingCube: createRotatingCubeScene,
    pulseField: createPulseFieldScene
};

export function createSceneInstance(sceneId) {
    const factory = registry[sceneId];
    if (!factory) {
        throw new Error(`unknown scene: ${sceneId}`);
    }

    const instance = factory();
    if (typeof instance.mount !== "function") {
        throw new Error(`scene ${sceneId} is missing a mount() method`);
    }

    return instance;
}
