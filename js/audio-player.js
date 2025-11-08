(function () {
    const TRACKS = [
        {
            id: "stj 001",
            title: "21questions 149bpm",
            artist: "saintjustus",
            src: encodeURI("audio/21questions 149bpm_BEAT @thx4cmn (L+T+J).mp3")
        }
    ];

    function setupCanvasEventForwarding() {
        const canvas = document.getElementById("glcanvas");
        if (!canvas) {
            return;
        }

        const pointerEvents = ["pointermove", "pointerdown", "pointerup", "pointercancel", "pointerover", "pointerout"];
        const mouseEvents = ["mousemove", "mousedown", "mouseup"];

        const forward = (type) => (event) => {
            if (event.target === canvas) {
                return;
            }

            let forwardedEvent;
            try {
                if (event instanceof PointerEvent && window.PointerEvent) {
                    forwardedEvent = new PointerEvent(type, {
                        bubbles: true,
                        cancelable: false,
                        pointerId: event.pointerId,
                        width: event.width,
                        height: event.height,
                        pressure: event.pressure,
                        tangentialPressure: event.tangentialPressure,
                        tiltX: event.tiltX,
                        tiltY: event.tiltY,
                        twist: event.twist,
                        pointerType: event.pointerType,
                        isPrimary: event.isPrimary,
                        clientX: event.clientX,
                        clientY: event.clientY,
                        screenX: event.screenX,
                        screenY: event.screenY,
                        buttons: event.buttons,
                        ctrlKey: event.ctrlKey,
                        shiftKey: event.shiftKey,
                        altKey: event.altKey,
                        metaKey: event.metaKey
                    });
                } else if (event instanceof MouseEvent) {
                    forwardedEvent = new MouseEvent(type, {
                        bubbles: true,
                        cancelable: false,
                        clientX: event.clientX,
                        clientY: event.clientY,
                        screenX: event.screenX,
                        screenY: event.screenY,
                        buttons: event.buttons,
                        ctrlKey: event.ctrlKey,
                        shiftKey: event.shiftKey,
                        altKey: event.altKey,
                        metaKey: event.metaKey
                    });
                } else {
                    forwardedEvent = new Event(type, { bubbles: true, cancelable: false });
                }
            } catch (error) {
                forwardedEvent = new Event(type, { bubbles: true, cancelable: false });
            }

            canvas.dispatchEvent(forwardedEvent);
        };

        pointerEvents.forEach((type) => {
            document.addEventListener(type, forward(type), { passive: true });
        });

        mouseEvents.forEach((type) => {
            document.addEventListener(type, forward(type), { passive: true });
        });
    }

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
        setupCanvasEventForwarding();

        if (!TRACKS.length) {
            return;
        }

        const savedState = restoreState();
        let currentIndex = clampIndex(savedState?.index ?? 0);

        const audio = new Audio();
        audio.preload = "metadata";

        let audioContext = null;
        let analyser = null;
        let mediaSource = null;
        let dataArray = null;
        let animationFrameId = null;

        const footer = document.createElement("footer");
        footer.className = "audio-player";
        footer.setAttribute("role", "region");
        footer.setAttribute("aria-label", "saintjustus audio player");
        footer.innerHTML = `
            <div class="audio-player__cluster">
                <div class="audio-player__ticker" aria-live="polite" aria-atomic="true">
                    <span class="audio-player__ticker-text" data-role="ticker">${TRACKS[currentIndex].title}</span>
                </div>
                <div class="audio-player__visualizer" aria-hidden="true">
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--r" data-role="visualizer-bar"></span>
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--g" data-role="visualizer-bar"></span>
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--b" data-role="visualizer-bar"></span>
                </div>
                <p class="audio-player__meta">
                    <span class="audio-player__meta-id">${TRACKS[currentIndex].id}</span>
                    <span class="audio-player__meta-artist">${TRACKS[currentIndex].artist}</span>
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
        const metaId = footer.querySelector('.audio-player__meta-id');
        const metaArtist = footer.querySelector('.audio-player__meta-artist');
        const visualizerBars = Array.from(footer.querySelectorAll('[data-role="visualizer-bar"]'));

        function ensureAudioContext() {
            if (audioContext) {
                return;
            }

            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) {
                return;
            }

            audioContext = new Context();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            mediaSource = audioContext.createMediaElementSource(audio);
            mediaSource.connect(analyser);
            analyser.connect(audioContext.destination);
        }

        function renderVisualizer() {
            if (!analyser || !visualizerBars.length) {
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            const segmentLength = Math.floor(dataArray.length / visualizerBars.length) || 1;

            visualizerBars.forEach((bar, index) => {
                const start = index * segmentLength;
                const end = Math.min(start + segmentLength, dataArray.length);
                let sum = 0;
                for (let i = start; i < end; i += 1) {
                    sum += dataArray[i];
                }
                const average = sum / (end - start || 1);
                const level = Math.max(0.08, average / 255);
                bar.style.setProperty("--level", level.toFixed(3));
            });

            animationFrameId = requestAnimationFrame(renderVisualizer);
        }

        function startVisualizer() {
            if (!audioContext || !analyser) {
                return;
            }

            if (audioContext.state === "suspended") {
                audioContext.resume().catch(() => {});
            }

            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(renderVisualizer);
            }
        }

        function stopVisualizer() {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            visualizerBars.forEach((bar) => {
                bar.style.setProperty("--level", "0.08");
            });
        }

        function updateTrackDetails(resetTime = true) {
            const track = TRACKS[currentIndex];
            ticker.textContent = track.title;
            metaId.textContent = track.id;
            metaArtist.textContent = track.artist;
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
            ensureAudioContext();
            audio
                .play()
                .then(() => {
                    startVisualizer();
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
            stopVisualizer();
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

        audio.addEventListener("pause", () => {
            stopVisualizer();
        });

        updateTrackDetails(false);

        window.addEventListener("beforeunload", queueStateSave);
    });
})();
