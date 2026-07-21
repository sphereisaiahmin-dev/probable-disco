export const workWindowConfig = [
    {
        id: "blare-db",
        title: "design:live",
        description: "live documentation and visual work from blare.db and bodyrave",
        type: "media",
        mediaItems: [
            {
                type: "youtube",
                src: "https://www.youtube.com/watch?v=BXqkB73kWzo&t=1s",
                title: "blare.db",
                tags: ["live", "experience", "av"],
                description: "blare.db live set documentation",
                aspectRatio: "16/9"
            },
            {
                type: "youtube",
                src: "https://www.youtube.com/watch?v=RioNTwwQgWc",
                title: "bodyrave",
                tags: ["live", "experience", "av"],
                description: "bodyrave live visual documentation",
                aspectRatio: "16/9"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/blaredb-cyber.mp4",
                title: "blaredb cyber",
                tags: ["marketing", "video creation", "av"],
                description: "blare.db cyber promotional video"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/blaredb-recap.mp4",
                title: "blaredb recap",
                tags: ["live", "recap", "video"],
                description: "blare.db event recap"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/bodyrave-indoorad.mp4",
                title: "bodyrave indoor ad",
                tags: ["marketing", "video creation", "indoor"],
                description: "bodyrave indoor campaign video"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/bodyrave-outdoor.mp4",
                title: "bodyrave outdoor",
                tags: ["marketing", "video creation", "outdoor"],
                description: "bodyrave outdoor campaign video"
            },
            {
                type: "image",
                src: "https://stjaudio.b-cdn.net/video/posterblare.db.jpg",
                title: "blare.db poster",
                alt: "blare.db event poster",
                tags: ["graphic design", "poster", "marketing"],
                description: "blare.db event poster"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/strobe-bodyrave.mp4",
                title: "strobe bodyrave",
                tags: ["live", "visuals", "strobe"],
                description: "bodyrave strobe visual",
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
        id: "design-marketing",
        title: "design:marketing",
        description: "selected marketing, installation, and video work",
        type: "media",
        mediaItems: [
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/minimarquenort.mp4",
                title: "crsvr",
                tags: ["video", "installation"],
                description: "documentation of the crsvr installation captured for quick preview"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/bibiportfolio.mov",
                title: "bibistar",
                tags: ["marketing", "video creation"],
                description: "bibistar marketing video portfolio piece"
            },
            {
                type: "video",
                src: "https://stjaudio.b-cdn.net/video/whocaresbrandadfinal4.3.mov",
                title: "whocares",
                tags: ["marketing", "video creation"],
                description: "whocares marketing video portfolio piece"
            }
        ],
        initialPosition: { x: 360, y: 260 },
        initialSize: { width: 520, height: 320 },
        hint: "view design:marketing",
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
