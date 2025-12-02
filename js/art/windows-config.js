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
    },
    {
        id: "everything-you-own",
        title: "everything you own",
        tags: ["click me", "design"],
        description: "embedded cables.gl window for everything you own",
        type: "embed",
        embedUrl: "https://cables.gl/view/dakzc4",
        allow: "autoplay; camera; microphone",
        initialPosition: { x: 280, y: 200 },
        initialSize: { width: 540, height: 360 },
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(64,192,255,0.25))",
        hint: "open cables view"
    }
];
