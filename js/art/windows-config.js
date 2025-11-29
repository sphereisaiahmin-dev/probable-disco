import { getSceneMetadata } from "./scene-registry.js";

const asciiScene = getSceneMetadata("ascii");
const impressionsScene = getSceneMetadata("webcam-impressions");
const testArtScene = getSceneMetadata("test-art");

export const artWindowConfig = [
    {
        id: "ascii",
        title: "ASCII",
        tags: asciiScene.tags,
        description: asciiScene.description,
        sceneId: "ascii",
        initialPosition: { x: 220, y: 120 },
        initialSize: { width: 480, height: 320 },
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(80,80,80,0.35))",
        hint: "launch stream",
        useCanvas: false
    },
    {
        id: "webcam-impressions",
        title: "impressions",
        tags: impressionsScene.tags,
        description: impressionsScene.description,
        sceneId: "webcam-impressions",
        initialPosition: { x: 160, y: 180 },
        initialSize: { width: 520, height: 360 },
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(80,120,255,0.25))",
        hint: "allow camera",
        useCanvas: false
    },
    {
        id: "test-art",
        title: "test art",
        tags: testArtScene.tags,
        description: testArtScene.description,
        sceneId: "test-art",
        initialPosition: { x: 360, y: 280 },
        initialSize: { width: 360, height: 240 },
        previewGradient: "linear-gradient(135deg, rgba(32,96,192,0.35), rgba(255,255,255,0.08))",
        hint: "launch scene"
    }
];
