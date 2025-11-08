(function () {
    const STORAGE_KEY = "saintjustus.audioPlayer.state";
    const TRACKS_ENDPOINT = "/api/tracks";

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

    function getRandomIndex(tracks, excludeIndex = null) {
        if (!tracks.length) {
            return 0;
        }

        if (tracks.length === 1) {
            return 0;
        }

        let index = Math.floor(Math.random() * tracks.length);
        if (excludeIndex === null) {
            return index;
        }

        while (index === excludeIndex) {
            index = Math.floor(Math.random() * tracks.length);
        }

        return index;
    }

    async function fetchTracks() {
        try {
            const response = await fetch(TRACKS_ENDPOINT, { headers: { Accept: "application/json" } });
            if (!response.ok) {
                throw new Error(`request failed with status ${response.status}`);
            }

            const payload = await response.json();
            if (Array.isArray(payload)) {
                return payload;
            }

            if (payload && Array.isArray(payload.tracks)) {
                return payload.tracks;
            }

            return [];
        } catch (error) {
            console.error("audio player: failed to load tracks", error);
            return [];
        }
    }

    function createPlayerShell() {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.crossOrigin = "anonymous";

        const footer = document.createElement("footer");
        footer.className = "audio-player";
        footer.setAttribute("role", "region");
        footer.setAttribute("aria-label", "saintjustus audio player");
        footer.innerHTML = `
            <div class="audio-player__cluster">
                <div class="audio-player__ticker" aria-live="polite" aria-atomic="true">
                    <span class="audio-player__ticker-text" data-role="ticker">loading audio feed…</span>
                </div>
                <div class="audio-player__visualizer" aria-hidden="true">
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--r" data-role="visualizer-bar"></span>
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--g" data-role="visualizer-bar"></span>
                    <span class="audio-player__visualizer-bar audio-player__visualizer-bar--b" data-role="visualizer-bar"></span>
                </div>
                <p class="audio-player__meta">
                    <span class="audio-player__meta-id" data-role="meta-id">stj ---</span>
                    <span class="audio-player__meta-artist" data-role="meta-artist">saintjustus</span>
                </p>
            </div>
        `;

        const controls = document.createElement("div");
        controls.className = "audio-player__controls";

        const prevButton = createButton("&#9664;&#9664;", "previous track");
        const playButton = createButton("&#9654;", "play");
        const nextButton = createButton("&#9654;&#9654;", "next track");

        prevButton.disabled = true;
        playButton.disabled = true;
        nextButton.disabled = true;

        controls.append(prevButton, playButton, nextButton);

        const timeline = document.createElement("div");
        timeline.className = "audio-player__timeline";

        const timeCurrent = document.createElement("span");
        timeCurrent.className = "audio-player__time audio-player__time--current";
        timeCurrent.textContent = "0:00";

        const seekInput = document.createElement("input");
        seekInput.type = "range";
        seekInput.className = "audio-player__seek";
        seekInput.min = "0";
        seekInput.max = "0";
        seekInput.step = "0.01";
        seekInput.value = "0";
        seekInput.disabled = true;
        seekInput.setAttribute("aria-label", "seek through track");

        const timeDuration = document.createElement("span");
        timeDuration.className = "audio-player__time audio-player__time--duration";
        timeDuration.textContent = "--:--";

        timeline.append(timeCurrent, seekInput, timeDuration);

        footer.append(timeline, controls);

        document.body.appendChild(footer);

        const ticker = footer.querySelector('[data-role="ticker"]');
        const metaId = footer.querySelector('[data-role="meta-id"]');
        const metaArtist = footer.querySelector('[data-role="meta-artist"]');
        const visualizerBars = Array.from(footer.querySelectorAll('[data-role="visualizer-bar"]'));

        return {
            audio,
            footer,
            ticker,
            metaId,
            metaArtist,
            prevButton,
            playButton,
            nextButton,
            visualizerBars,
            seekInput,
            timeCurrent,
            timeDuration
        };
    }

    document.addEventListener("DOMContentLoaded", async () => {
        setupCanvasEventForwarding();

        const isLanding = Boolean(document.querySelector(".landing"));
        const savedState = isLanding ? null : restoreState();
        const {
            audio,
            footer,
            ticker,
            metaId,
            metaArtist,
            prevButton,
            playButton,
            nextButton,
            visualizerBars,
            seekInput,
            timeCurrent,
            timeDuration
        } = createPlayerShell();

        let tracks = [];
        let currentIndex = 0;
        const history = [];
        let audioContext = null;
        let analyser = null;
        let mediaSource = null;
        let dataArray = null;
        let animationFrameId = null;
        let pendingSeekTime = null;
        let resumeAfterMetadata = false;
        let isSeeking = false;

        function formatTime(value) {
            if (!Number.isFinite(value) || value < 0) {
                return "--:--";
            }

            const totalSeconds = Math.floor(value);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${String(seconds).padStart(2, "0")}`;
        }

        function getDisplayTitle(track) {
            if (!track) {
                return "";
            }

            const source = track.filename || track.title || track.id;
            if (!source) {
                return "";
            }

            return source
                .replace(/\.[^/.]+$/, "")
                .replace(/[-_]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        function resetSeekState() {
            seekInput.value = "0";
            seekInput.max = "0";
            seekInput.disabled = true;
            timeCurrent.textContent = formatTime(0);
            timeDuration.textContent = "--:--";
        }

        function updateSeekFromPlayback() {
            if (isSeeking) {
                return;
            }

            const { currentTime, duration } = audio;
            if (Number.isFinite(duration)) {
                seekInput.max = String(duration);
                seekInput.disabled = false;
                timeDuration.textContent = formatTime(duration);
            }

            if (Number.isFinite(currentTime)) {
                seekInput.value = String(currentTime);
                timeCurrent.textContent = formatTime(currentTime);
            }
        }

        function applySeek(time) {
            if (!Number.isFinite(time)) {
                return;
            }

            const { duration } = audio;
            const clampedTime = Math.max(0, Number.isFinite(duration) ? Math.min(time, duration) : time);
            pendingSeekTime = clampedTime;

            if (audio.readyState >= 1) {
                audio.currentTime = clampedTime;
            }

            timeCurrent.textContent = formatTime(clampedTime);
        }

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

        function updateTrackDetails({ resetTime = true } = {}) {
            const track = tracks[currentIndex];
            if (!track) {
                return;
            }

            const displayTitle = getDisplayTitle(track);
            ticker.textContent = displayTitle || track.title || track.id;
            metaId.textContent = track.id;
            metaArtist.textContent = track.artist;
            audio.src = track.cdnSrc || track.src;
            resetSeekState();

            if (resetTime) {
                pendingSeekTime = null;
            } else if (typeof pendingSeekTime === "number" && !Number.isNaN(pendingSeekTime)) {
                seekInput.value = String(Math.max(0, pendingSeekTime));
                timeCurrent.textContent = formatTime(pendingSeekTime);
            }

            if (!isLanding) {
                persistState({
                    trackId: track.id,
                    time: resetTime ? 0 : typeof pendingSeekTime === "number" ? pendingSeekTime : 0,
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
            if (isLanding) {
                return;
            }

            const track = tracks[currentIndex];
            if (!track) {
                return;
            }

            persistState({
                trackId: track.id,
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
                    queueStateSave();
                })
                .catch(() => {
                    updatePlayButton();
                });
        }

        function pauseTrack() {
            audio.pause();
            updatePlayButton();
            queueStateSave();
            stopVisualizer();
        }

        function selectNextRandomTrack(autoplay = false) {
            if (!tracks.length) {
                return;
            }

            if (tracks.length > 1) {
                history.push(currentIndex);
                currentIndex = getRandomIndex(tracks, currentIndex);
                prevButton.disabled = false;
            }

            pendingSeekTime = null;
            updateTrackDetails({ resetTime: true });

            if (autoplay) {
                playCurrentTrack();
            } else {
                updatePlayButton();
            }
        }

        function selectPreviousTrack(autoplay = false) {
            if (!tracks.length || !history.length) {
                return;
            }

            currentIndex = history.pop();
            prevButton.disabled = history.length === 0;
            pendingSeekTime = null;
            updateTrackDetails({ resetTime: true });

            if (autoplay) {
                playCurrentTrack();
            } else {
                updatePlayButton();
            }
        }

        prevButton.addEventListener("click", () => {
            selectPreviousTrack(true);
        });

        nextButton.addEventListener("click", () => {
            selectNextRandomTrack(true);
        });

        playButton.addEventListener("click", () => {
            if (audio.paused) {
                playCurrentTrack();
            } else {
                pauseTrack();
            }
        });

        seekInput.addEventListener("pointerdown", () => {
            isSeeking = true;
        });

        seekInput.addEventListener("pointerup", () => {
            isSeeking = false;
        });

        seekInput.addEventListener("pointercancel", () => {
            isSeeking = false;
        });

        seekInput.addEventListener("keydown", () => {
            isSeeking = true;
        });

        seekInput.addEventListener("keyup", () => {
            isSeeking = false;
        });

        seekInput.addEventListener("blur", () => {
            isSeeking = false;
        });

        seekInput.addEventListener("input", (event) => {
            const targetTime = Number(event.target.value);
            if (Number.isNaN(targetTime)) {
                return;
            }

            applySeek(targetTime);
        });

        seekInput.addEventListener("change", (event) => {
            const targetTime = Number(event.target.value);
            if (Number.isNaN(targetTime)) {
                return;
            }

            applySeek(targetTime);
            isSeeking = false;
            queueStateSave();
        });

        audio.addEventListener("play", updatePlayButton);
        audio.addEventListener("pause", updatePlayButton);

        audio.addEventListener("ended", () => {
            selectNextRandomTrack(true);
        });

        audio.addEventListener("timeupdate", () => {
            updateSeekFromPlayback();
            queueStateSave();
        });

        audio.addEventListener("durationchange", () => {
            updateSeekFromPlayback();
        });

        audio.addEventListener("loadedmetadata", () => {
            if (typeof pendingSeekTime === "number" && !Number.isNaN(pendingSeekTime)) {
                const clampedTime = Math.max(0, Math.min(pendingSeekTime, audio.duration || pendingSeekTime));
                audio.currentTime = clampedTime;
            }

            if (resumeAfterMetadata) {
                playCurrentTrack();
            } else {
                updatePlayButton();
            }

            updateSeekFromPlayback();
            queueStateSave();
            pendingSeekTime = null;
            resumeAfterMetadata = false;
        });

        window.addEventListener("beforeunload", queueStateSave);

        tracks = await fetchTracks();

        if (!tracks.length) {
            ticker.textContent = "audio feed offline";
            return;
        }

        playButton.disabled = false;
        nextButton.disabled = tracks.length <= 1;
        prevButton.disabled = true;

        const idLookup = new Map(tracks.map((track, index) => [track.id, index]));

        if (savedState && savedState.trackId && idLookup.has(savedState.trackId)) {
            currentIndex = idLookup.get(savedState.trackId);
            if (typeof savedState.time === "number") {
                pendingSeekTime = savedState.time;
            }
            resumeAfterMetadata = savedState.paused === false;
            updateTrackDetails({ resetTime: false });
        } else {
            currentIndex = getRandomIndex(tracks, null);
            updateTrackDetails({ resetTime: true });
            updatePlayButton();
        }

        if (!resumeAfterMetadata) {
            updatePlayButton();
        }
    });
})();
