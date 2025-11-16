export const workWindowConfig = [
    {
        id: "blare-db",
        title: "blare.db",
        tags: ["youtube", "performance"],
        type: "embed",
        embedUrl: "https://www.youtube.com/embed/BXqkB73kWzo?si=rFhJPPzajxmOFdQG&rel=0&modestbranding=1&playsinline=1",
        initialPosition: { x: 160, y: 160 },
        initialSize: { width: 520, height: 320 },
        hint: "watch blare.db",
        allow:
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen",
        embedErrorMessage: "video blocked — open on youtube",
        previewGradient: "linear-gradient(135deg, rgba(80,80,80,0.25), rgba(255,255,255,0.1))"
    },
    {
        id: "console-toolkit",
        title: "console toolkit",
        tags: ["youtube", "prototype"],
        type: "embed",
        embedUrl: "https://www.youtube.com/embed/djV11Xbc914?rel=0&modestbranding=1&playsinline=1",
        initialPosition: { x: 360, y: 260 },
        initialSize: { width: 480, height: 300 },
        hint: "stream walkthrough",
        thumbnail: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        embedErrorMessage: "video blocked — open on youtube",
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(0,0,0,0.25))"
    },
    {
        id: "browser-instrument",
        title: "browser instrument",
        tags: ["code sandbox", "live build"],
        type: "embed",
        embedUrl: "https://codesandbox.io/embed/new?fontsize=14&hidenavigation=1&theme=dark",
        initialPosition: { x: 220, y: 320 },
        initialSize: { width: 520, height: 360 },
        hint: "open tool",
        allow: "clipboard-write; fullscreen; geolocation",
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(64,128,255,0.18))"
    }
];
