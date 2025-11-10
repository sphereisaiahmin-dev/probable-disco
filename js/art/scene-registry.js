import { createImpressionScene } from "./scenes/impression.js";
import { createHelloWorldScene } from "./scenes/helloWorld.js";

const registry = {
    impression: createImpressionScene,
    "hello-world": createHelloWorldScene
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
