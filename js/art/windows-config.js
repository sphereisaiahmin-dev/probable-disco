export const artWindowConfig = [
    {
        id: "Identify",
        title: "Identify",
        tags: ["three.js", "drift"],
        sceneId: "camdepth",
        initialPosition: { x: 140, y: 160 },
        initialSize: { width: 280, height: 180 },
        previewGradient: "linear-gradient(135deg, rgba(96,160,255,0.35), rgba(255,64,64,0.15))",
        hint: "tap to expand"
    },
    {
        id: "planetary",
        title: "planetary",
        tags: ["webgl", "pulse"],
        sceneId: "pulseField",
        initialPosition: { x: 460, y: 80 },
        initialSize: { width: 300, height: 200 },
        previewGradient: "linear-gradient(135deg, rgba(64,255,160,0.25), rgba(255,255,255,0.08))",
        hint: "launch scene"
    },
    {
        id: "dark-sky",
        title: "dark sky",
        tags: ["shader", "slow"],
        sceneId: "pulseField",
        initialPosition: { x: 720, y: 260 },
        initialSize: { width: 260, height: 170 },
        previewGradient: "linear-gradient(135deg, rgba(255,64,128,0.25), rgba(64,96,255,0.18))",
        hint: "full view"
    }
];
