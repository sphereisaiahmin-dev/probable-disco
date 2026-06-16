export const workWindowConfig = [
    {
        id: "blare-db",
        title: "blare.db/bodyrave",
        tags: ["live", "experience", "av"],
        description: "blare.db/bodyrave window hosts live documentation and bodyrave visual pieces",
        type: "media",
        mediaItems: [
            {
                type: "youtube",
                src: "https://www.youtube.com/watch?v=BXqkB73kWzo&t=1s",
                title: "blare.db",
                aspectRatio: "16/9"
            },
            {
                type: "youtube",
                src: "https://www.youtube.com/watch?v=RioNTwwQgWc",
                title: "bodyrave",
                aspectRatio: "16/9"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/blaredb-cyber.mp4",
                title: "blaredb cyber"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/blaredb-recap.mp4",
                title: "blaredb recap"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/bodyrave-indoorad.mp4",
                title: "bodyrave indoor ad"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/bodyrave-outdoor.mp4",
                title: "bodyrave outdoor"
            },
            {
                type: "image",
                src: "https://stjaudio.b-cdn.net/video/posterblare.db.jpg",
                alt: "posterblare.db artwork"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/strobe-bodyrave.mp4",
                title: "strobe bodyrave",
                strobeWarning: true,
                warningText: "strobe warning: continue?"
            }
        ],
        initialPosition: { x: 160, y: 160 },
        initialSize: { width: 520, height: 320 },
        hint: "view blare.db/bodyrave",
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
    },
    {
        id: "thx4cmn-com",
        title: "thx4cmn.com",
        tags: ["web development", "design"],
        description: "embedded thx4cmn.com portfolio build",
        type: "embed",
        embedUrl: "https://www.thx4cmn.com/",
        initialPosition: { x: 220, y: 320 },
        initialSize: { width: 540, height: 360 },
        hint: "open thx4cmn.com",
        allow: "fullscreen",
        previewGradient: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(64,128,255,0.18))"
    }
];
