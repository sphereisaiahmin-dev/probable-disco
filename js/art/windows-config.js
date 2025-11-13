export const artWindowConfig = [
    {
        id: "webcam-particles",
        title: "particle portrait",
        tags: ["webcam", "glsl", "instanced"],
        sceneId: "webcam-particles",
        initialPosition: { x: 160, y: 180 },
        initialSize: { width: 520, height: 360 },
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(80,120,255,0.25))",
        hint: "use camera"
    },
    {
        id: "test-art",
        title: "test art",
        tags: ["prototype", "canvas"],
        sceneId: "test-art",
        initialPosition: { x: 360, y: 280 },
        initialSize: { width: 360, height: 240 },
        previewGradient: "linear-gradient(135deg, rgba(32,96,192,0.35), rgba(255,255,255,0.08))",
        hint: "launch scene"
    }
];
