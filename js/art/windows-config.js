import { getSceneMetadata } from "./scene-registry.js";

const asciiScene = getSceneMetadata("ascii");
const impressionsScene = getSceneMetadata("webcam-impressions");
const mothScene = getSceneMetadata("moth");

export const artWindowConfig = [
    {
        id: "moth",
        title: "moth",
        tags: mothScene.tags,
        description: mothScene.description,
        sceneId: "moth",
        initialPosition: { x: 120, y: 96 },
        initialSize: { width: 560, height: 560 },
        previewGradient: "radial-gradient(circle, rgba(255,129,50,0.28), rgba(5,5,5,0.96) 62%)",
        useCanvas: true
    },
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
        useCanvas: false,
        requiresExplicitPlayback: true
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
        useCanvas: false,
        requiresExplicitPlayback: true
    }
];
