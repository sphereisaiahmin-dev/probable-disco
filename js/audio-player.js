(function () {
    const TRACKS = [
        {
            id: "sj-001",
            title: "21questions 149bpm",
            artist: "saintjustus",
            src: encodeURI("21questions 149bpm_BEAT @thx4cmn (L+T+J).mp3")
        }
    ];

    const STORAGE_KEY = "saintjustus.audioPlayer.state";

    function createButton(icon, label) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "audio-player__control";
        button.setAttribute("aria-label", label);
        button.innerHTML = `<span aria-hidden="true">${icon}</span>`;
        return button;
    }

    function restoreState() {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            console.warn("audio player: failed to restore state", error);
            return null;
        }
    }

    function persistState(state) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn("audio player: failed to persist state", error);
        }
    }

    function clampIndex(index) {
        if (index < 0) return TRACKS.length - 1;
        if (index >= TRACKS.length) return 0;
        return index;
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!TRACKS.length) {
            return;
        }

        const savedState = restoreState();
        let currentIndex = clampIndex(savedState?.index ?? 0);

        const audio = new Audio();
        audio.preload = "metadata";

        const footer = document.createElement("footer");
        footer.className = "audio-player";
        footer.setAttribute("role", "region");
        footer.setAttribute("aria-label", "saintjustus audio player");
        footer.innerHTML = `
            <div class="audio-player__cluster">
                <div class="audio-player__ticker" aria-live="polite" aria-atomic="true">
                    <span class="audio-player__ticker-text" data-role="ticker">${TRACKS[currentIndex].id}</span>
                </div>
                <p class="audio-player__meta">
                    <span class="audio-player__meta-artist">${TRACKS[currentIndex].artist}</span>
                    <span class="audio-player__meta-title">${TRACKS[currentIndex].title}</span>
                </p>
            </div>
        `;

        const controls = document.createElement("div");
        controls.className = "audio-player__controls";

        const prevButton = createButton("&#9664;&#9664;", "previous track");
        const playButton = createButton("&#9654;", "play");
        const nextButton = createButton("&#9654;&#9654;", "next track");

        controls.append(prevButton, playButton, nextButton);
        footer.appendChild(controls);

        document.body.appendChild(footer);

        const ticker = footer.querySelector('[data-role="ticker"]');
        const metaArtist = footer.querySelector('.audio-player__meta-artist');
        const metaTitle = footer.querySelector('.audio-player__meta-title');

        function updateTrackDetails(resetTime = true) {
            const track = TRACKS[currentIndex];
            ticker.textContent = track.id;
            metaArtist.textContent = track.artist;
            metaTitle.textContent = track.title;
            audio.src = track.src;
            if (resetTime) {
                persistState({
                    index: currentIndex,
                    time: 0,
                    paused: true
                });
            }
        }

        function updatePlayButton() {
            const isPaused = audio.paused;
            playButton.innerHTML = `<span aria-hidden="true">${isPaused ? "&#9654;" : "&#10073;&#10073;"}</span>`;
            playButton.setAttribute("aria-label", isPaused ? "play" : "pause");
            footer.classList.toggle("is-playing", !isPaused);
        }

        function queueStateSave() {
            persistState({
                index: currentIndex,
                time: audio.currentTime,
                paused: audio.paused
            });
        }

        function playCurrentTrack() {
            audio
                .play()
                .then(() => {
                    updatePlayButton();
                })
                .catch(() => {
                    // Autoplay restrictions may prevent playback; ensure UI is synced.
                    updatePlayButton();
                });
        }

        function pauseTrack() {
            audio.pause();
            updatePlayButton();
            queueStateSave();
        }

        prevButton.addEventListener("click", () => {
            currentIndex = clampIndex(currentIndex - 1);
            updateTrackDetails();
            playCurrentTrack();
        });

        nextButton.addEventListener("click", () => {
            currentIndex = clampIndex(currentIndex + 1);
            updateTrackDetails();
            playCurrentTrack();
        });

        playButton.addEventListener("click", () => {
            if (audio.paused) {
                playCurrentTrack();
            } else {
                pauseTrack();
            }
        });

        audio.addEventListener("play", updatePlayButton);
        audio.addEventListener("pause", updatePlayButton);
        audio.addEventListener("ended", () => {
            currentIndex = clampIndex(currentIndex + 1);
            updateTrackDetails();
            playCurrentTrack();
        });

        audio.addEventListener("timeupdate", () => {
            queueStateSave();
        });

        audio.addEventListener("loadedmetadata", () => {
            if (savedState && !Number.isNaN(savedState.time)) {
                const clampedTime = Math.max(0, Math.min(savedState.time, audio.duration || savedState.time));
                audio.currentTime = clampedTime;
            }
            if (savedState && savedState.paused === false) {
                playCurrentTrack();
            }
            updatePlayButton();
            queueStateSave();
        });

        updateTrackDetails(false);

        window.addEventListener("beforeunload", queueStateSave);
    });
})();
