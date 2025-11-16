export const workWindowConfig = [
    {
        id: "systems-lab",
        title: "systems lab",
        tags: ["vimeo", "research"],
        type: "embed",
        embedUrl: "https://player.vimeo.com/video/76979871?h=8272103f6a&title=0&byline=0&portrait=0",
        initialPosition: { x: 160, y: 160 },
        initialSize: { width: 520, height: 320 },
        hint: "watch process",
        allow: "autoplay; fullscreen; picture-in-picture",
        previewGradient: "linear-gradient(135deg, rgba(80,80,80,0.25), rgba(255,255,255,0.1))"
    },
    {
        id: "console-toolkit",
        title: "console toolkit",
        tags: ["youtube", "prototype"],
        type: "embed",
        embedUrl: "https://www.youtube-nocookie.com/embed/djV11Xbc914?autoplay=0&modestbranding=1",
        initialPosition: { x: 360, y: 260 },
        initialSize: { width: 480, height: 300 },
        hint: "stream walkthrough",
        thumbnail: "https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=1200&q=80",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
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
