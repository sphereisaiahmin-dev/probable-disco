export const musicWindowConfig = [
    {
        id: "lowlight-radio",
        title: "lowlight radio",
        tags: ["soundcloud", "live"],
        type: "embed",
        embedUrl: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1203819218&color=%23ff5500&inverse=false&auto_play=false&show_user=true",
        initialPosition: { x: 200, y: 150 },
        initialSize: { width: 520, height: 300 },
        hint: "listen in",
        allow: "autoplay"
    },
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
        allow: "autoplay; clipboard-write; encrypted-media"
    }
];
