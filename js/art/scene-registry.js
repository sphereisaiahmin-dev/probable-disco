import { createAsciiScene } from "./scenes/asciiScene.js";
import { createWebcamImpressionsScene } from "./scenes/webcamImpressionsScene.js";

const registry = {
    ascii: {
        factory: createAsciiScene,
        tags: ["webcam", "instance", "mediapipe"],
        description: "live webcam stream rendered through mediapipe into ascii shapes to show the capture pipeline"
    },
    "webcam-impressions": {
        factory: createWebcamImpressionsScene,
        tags: ["webcam", "instance", "3d"],
        description: "impressionistic 3d capture of the webcam feed to explore motion and depth"
    }
};

export function createSceneInstance(sceneId) {
    const factory = registry[sceneId]?.factory;
    if (!factory) {
        throw new Error(`unknown scene: ${sceneId}`);
    }

    const instance = factory();
    if (typeof instance.mount !== "function") {
        throw new Error(`scene ${sceneId} is missing a mount() method`);
    }

    return instance;
}

export function getSceneMetadata(sceneId) {
    const entry = registry[sceneId];
    if (!entry) {
        return { tags: [], description: "" };
    }

    return {
        tags: normaliseTags(entry.tags),
        description: entry.description ?? ""
    };
}

function normaliseTags(tags) {
    if (!Array.isArray(tags)) {
        return [];
    }

    return tags
        .map((tag) => `${tag}`.trim())
        .filter(Boolean)
        .slice(0, 3);
}
