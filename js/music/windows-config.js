export const musicWindowConfig = [
    {
        id: "resonant-field",
        title: "resonant field",
        tags: ["bandcamp", "release"],
        type: "embed",
        embedUrl: "https://bandcamp.com/EmbeddedPlayer/album=2147493511/size=large/bgcol=000000/linkcol=ffffff/artwork=small/transparent=true/",
        thumbnail: "https://f4.bcbits.com/img/a0736724811_16.jpg",
        initialPosition: { x: 360, y: 280 },
        initialSize: { width: 460, height: 360 },
        hint: "support on bandcamp",
        allow: "autoplay; fullscreen"
    },
    {
        id: "motion-playlist",
        title: "motion playlist",
        tags: ["spotify", "curation"],
        type: "embed",
        embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator",
        initialPosition: { x: 160, y: 360 },
        initialSize: { width: 480, height: 320 },
        hint: "stream the rotation",
        allow: "autoplay; clipboard-write; encrypted-media",
        previewGradient: "linear-gradient(135deg, rgba(18,18,18,0.95), rgba(30,215,96,0.22))"
    }
];
