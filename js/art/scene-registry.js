import { createTestArtScene } from "./scenes/testArtScene.js";
import { createWebcamImpressionsScene } from "./scenes/webcamImpressionsScene.js";

const registry = {
    "test-art": createTestArtScene,
    "webcam-impressions": createWebcamImpressionsScene
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
