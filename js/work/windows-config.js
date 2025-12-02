export const workWindowConfig = [
    {
        id: "blare-db",
        title: "blare.db",
        tags: ["live", "experience", "av"],
        description: "blare.db window hosts the live av set that anchors the project portfolio",
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
        id: "crsvr",
        title: "crsvr",
        tags: ["video", "installation"],
        description: "documentation of the crsvr installation captured for quick preview",
        type: "embed",
        videoSrc: "https://stjaudio.b-cdn.net/video/minimarquenort.mp4",
        initialPosition: { x: 360, y: 260 },
        initialSize: { width: 520, height: 320 },
        hint: "preview crsvr",
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(0,0,0,0.25))"
    }
];
