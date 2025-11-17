import { createAsciiScene } from "./scenes/asciiScene.js";
import { createTestArtScene } from "./scenes/testArtScene.js";
import { createWebcamImpressionsScene } from "./scenes/webcamImpressionsScene.js";
import { createMothScene } from "./scenes/mothScene.js";

const registry = {
    "ascii": createAsciiScene,
    "test-art": createTestArtScene,
    "webcam-impressions": createWebcamImpressionsScene,
    "moth": createMothScene
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
