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
        audio.defaultPlaybackRate = 1;
        if ("preservesPitch" in audio) {
            audio.preservesPitch = false;
        }
        if ("mozPreservesPitch" in audio) {
            audio.mozPreservesPitch = false;
        }
        if ("webkitPreservesPitch" in audio) {
            audio.webkitPreservesPitch = false;
        }

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

        let dspIdCounter = 0;

        function createDspControl(labelText, role, { min, max, step, value, ariaLabel }) {
            dspIdCounter += 1;
            const group = document.createElement("div");
            group.className = "audio-player__dsp-group";

            const inputId = `dsp-${role}-${dspIdCounter}`;

            const label = document.createElement("label");
            label.className = "audio-player__dsp-label";
            label.setAttribute("for", inputId);
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "range";
            input.id = inputId;
            input.className = "audio-player__slider";
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = value;
            input.setAttribute("aria-label", ariaLabel);
            input.dataset.role = role;

            const valueDisplay = document.createElement("span");
            valueDisplay.className = "audio-player__dsp-value";
            valueDisplay.dataset.role = `${role}-value`;

            group.append(label, input, valueDisplay);

            return { group, input, valueDisplay };
        }

        const dspModule = document.createElement("div");
        dspModule.className = "audio-player__dsp";
        dspModule.setAttribute("role", "group");
        dspModule.setAttribute("aria-label", "audio shaping controls");

        const rateControl = createDspControl("rate", "rate", {
            min: "0.5",
            max: "1.5",
            step: "0.01",
            value: "1",
            ariaLabel: "adjust playback speed and pitch"
        });

        const filterControl = createDspControl("filter", "filter", {
            min: "-1",
            max: "1",
            step: "0.01",
            value: "0",
            ariaLabel: "sweep between low pass and high pass"
        });

        dspModule.append(rateControl.group, filterControl.group);

        const transport = document.createElement("div");
        transport.className = "audio-player__transport";
        transport.append(dspModule, controls);

        footer.append(timeline, transport);

        document.body.appendChild(footer);

        const ticker = footer.querySelector('[data-role="ticker"]');
        const metaId = footer.querySelector('[data-role="meta-id"]');
        const visualizerBars = Array.from(footer.querySelectorAll('[data-role="visualizer-bar"]'));

        return {
            audio,
            footer,
            ticker,
            metaId,
            prevButton,
            playButton,
            nextButton,
            visualizerBars,
            seekInput,
            timeCurrent,
            timeDuration,
            dspModule,
            rateControl,
            filterControl,
            transport
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
            prevButton,
            playButton,
            nextButton,
            visualizerBars,
            seekInput,
            timeCurrent,
            timeDuration,
            dspModule,
            rateControl,
            filterControl,
            transport
        } = createPlayerShell();

        const rateSlider = rateControl.input;
        const rateValue = rateControl.valueDisplay;
        const filterSlider = filterControl.input;
        const filterValue = filterControl.valueDisplay;

        const RATE_DEFAULT = 1;
        const FILTER_DEFAULT = 0;

        function setPlaybackRate(rate) {
            const nextRate = Number.isFinite(rate) && rate > 0 ? rate : RATE_DEFAULT;
            audio.playbackRate = nextRate;
            audio.defaultPlaybackRate = nextRate;

            if ("preservesPitch" in audio) {
                audio.preservesPitch = false;
            }
            if ("mozPreservesPitch" in audio) {
                audio.mozPreservesPitch = false;
            }
            if ("webkitPreservesPitch" in audio) {
                audio.webkitPreservesPitch = false;
            }

            return nextRate;
        }

        function resetDspParameters() {
            rateSlider.value = String(RATE_DEFAULT);
            const appliedRate = setPlaybackRate(RATE_DEFAULT);
            updateRateDisplay(appliedRate);

            filterSlider.value = String(FILTER_DEFAULT);
            applyFilterValue(FILTER_DEFAULT);
        }

        let tracks = [];
        let currentIndex = 0;
        const history = [];
        let audioContext = null;
        let analyser = null;
        let mediaSource = null;
        let nativeLowPass = null;
        let nativeHighPass = null;
        let toneSource = null;
        let toneLowPass = null;
        let toneHighPass = null;
        let toneAnalyser = null;
        let isToneGraphReady = false;
        let dataArray = null;
        let animationFrameId = null;
        let isVisualizerRunning = false;
        let pendingSeekTime = null;
        let resumeAfterMetadata = false;
        let isSeeking = false;
        const toneLibrary = window.Tone || null;

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

        const VISUALIZER_BASE_LEVEL = 0.08;

        const frequencyFormatter = new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
        });

        function formatFrequency(value) {
            if (!Number.isFinite(value) || value < 0) {
                return "-- hz";
            }

            return `${frequencyFormatter.format(Math.round(value))} hz`;
        }

        const rateFormatter = new Intl.NumberFormat("en-US", {
            maximumSignificantDigits: 3,
            minimumSignificantDigits: 1
        });

        function updateRateDisplay(rate) {
            if (!Number.isFinite(rate) || rate <= 0) {
                rateValue.textContent = "--";
                return;
            }

            rateValue.textContent = `${rateFormatter.format(rate)}x`;
        }

        function computeFilterFrequencies(value) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue) || Math.abs(numericValue) < 0.01) {
                return {
                    mode: "open",
                    lowPass: 20000,
                    highPass: 20
                };
            }

            if (numericValue < 0) {
                const intensity = Math.min(1, Math.abs(numericValue));
                const lowPass = 20000 - intensity * (20000 - 500);
                return {
                    mode: "lowpass",
                    lowPass,
                    highPass: 20
                };
            }

            const intensity = Math.min(1, numericValue);
            const highPass = 20 + intensity * (1000 - 20);
            return {
                mode: "highpass",
                lowPass: 20000,
                highPass
            };
        }

        function updateFilterDisplay(settings) {
            if (!settings) {
                filterValue.textContent = "--";
                return;
            }

            if (settings.mode === "open") {
                filterValue.textContent = formatFrequency(0);
                return;
            }

            if (settings.mode === "lowpass") {
                filterValue.textContent = formatFrequency(settings.lowPass);
                return;
            }

            filterValue.textContent = formatFrequency(settings.highPass);
        }

        function setLowPassFrequency(value) {
            if (isToneGraphReady && toneLowPass) {
                toneLowPass.frequency.value = value;
            } else if (nativeLowPass) {
                nativeLowPass.frequency.value = value;
            }
        }

        function setHighPassFrequency(value) {
            if (isToneGraphReady && toneHighPass) {
                toneHighPass.frequency.value = value;
            } else if (nativeHighPass) {
                nativeHighPass.frequency.value = value;
            }
        }

        function applyFilterValue(value) {
            const settings = computeFilterFrequencies(value);
            if (!settings) {
                return;
            }

            setLowPassFrequency(settings.lowPass);
            setHighPassFrequency(settings.highPass);
            updateFilterDisplay(settings);
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

        function ensureToneGraph() {
            if (!toneLibrary) {
                return false;
            }

            if (isToneGraphReady) {
                return true;
            }

            try {
                const context = typeof toneLibrary.getContext === "function" ? toneLibrary.getContext() : toneLibrary.context;
                audioContext = context && context.rawContext ? context.rawContext : context;

                toneSource = new toneLibrary.MediaElementSource(audio);
                toneLowPass = new toneLibrary.Filter({
                    type: "lowpass",
                    frequency: 20000,
                    rolloff: -24,
                    Q: 1.5
                });
                toneHighPass = new toneLibrary.Filter({
                    type: "highpass",
                    frequency: 20,
                    rolloff: -12,
                    Q: 1.5
                });
                toneAnalyser = new toneLibrary.Analyser("waveform", 256);

                toneSource.connect(toneLowPass);
                toneLowPass.connect(toneHighPass);
                toneHighPass.connect(toneAnalyser);
                toneHighPass.connect(toneLibrary.Destination);

                applyFilterValue(filterSlider.value);

                isToneGraphReady = true;
            } catch (error) {
                console.warn("audio player: tone.js graph setup failed", error);
                if (toneSource && typeof toneSource.dispose === "function") {
                    toneSource.dispose();
                }
                if (toneLowPass && typeof toneLowPass.dispose === "function") {
                    toneLowPass.dispose();
                }
                if (toneHighPass && typeof toneHighPass.dispose === "function") {
                    toneHighPass.dispose();
                }
                if (toneAnalyser && typeof toneAnalyser.dispose === "function") {
                    toneAnalyser.dispose();
                }

                toneSource = null;
                toneLowPass = null;
                toneHighPass = null;
                toneAnalyser = null;
                isToneGraphReady = false;
            }

            return isToneGraphReady;
        }

        function ensureNativeGraph() {
            if (analyser) {
                return true;
            }

            const Context = window.AudioContext || window.webkitAudioContext;
            if (!Context) {
                return false;
            }

            if (!audioContext) {
                audioContext = new Context();
            }

            if (!mediaSource) {
                mediaSource = audioContext.createMediaElementSource(audio);
            }

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            nativeLowPass = audioContext.createBiquadFilter();
            nativeLowPass.type = "lowpass";
            nativeLowPass.frequency.value = 20000;
            nativeLowPass.Q.value = 1.5;

            nativeHighPass = audioContext.createBiquadFilter();
            nativeHighPass.type = "highpass";
            nativeHighPass.frequency.value = 20;
            nativeHighPass.Q.value = 1.5;

            mediaSource.connect(nativeLowPass);
            nativeLowPass.connect(nativeHighPass);
            nativeHighPass.connect(analyser);
            analyser.connect(audioContext.destination);

            applyFilterValue(filterSlider.value);

            return true;
        }

        function ensureAudioContext() {
            if (toneLibrary && ensureToneGraph()) {
                return;
            }

            ensureNativeGraph();
        }

        function renderVisualizer() {
            if (!visualizerBars.length) {
                return;
            }

            if (isToneGraphReady && toneAnalyser) {
                const values = toneAnalyser.getValue();
                const segmentLength = Math.floor(values.length / visualizerBars.length) || 1;

                visualizerBars.forEach((bar, index) => {
                    const start = index * segmentLength;
                    const end = Math.min(start + segmentLength, values.length);
                    let sum = 0;
                    for (let i = start; i < end; i += 1) {
                        sum += Math.abs(values[i]);
                    }
                    const average = sum / (end - start || 1);
                    const level = Math.max(VISUALIZER_BASE_LEVEL, Math.min(1, average));
                    bar.style.setProperty("--level", level.toFixed(3));
                });
            } else if (analyser && dataArray instanceof Uint8Array) {
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
                    const level = Math.max(VISUALIZER_BASE_LEVEL, average / 255);
                    bar.style.setProperty("--level", level.toFixed(3));
                });
            }

            if (!isVisualizerRunning) {
                animationFrameId = null;
                return;
            }

            animationFrameId = requestAnimationFrame(renderVisualizer);
        }

        function startVisualizer() {
            if (isVisualizerRunning) {
                return;
            }

            ensureAudioContext();

            if (audioContext && typeof audioContext.resume === "function" && audioContext.state === "suspended") {
                audioContext.resume().catch(() => {});
            }

            isVisualizerRunning = true;
            animationFrameId = requestAnimationFrame(renderVisualizer);
        }

        function stopVisualizer() {
            isVisualizerRunning = false;

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            visualizerBars.forEach((bar) => {
                bar.style.setProperty("--level", VISUALIZER_BASE_LEVEL.toFixed(3));
            });
        }

        function updateTrackDetails({ resetTime = true } = {}) {
            const track = tracks[currentIndex];
            if (!track) {
                return;
            }

            const displayTitle = getDisplayTitle(track);
            ticker.textContent = displayTitle || track.title || track.id;
            metaId.textContent = track.id || displayTitle || "--";
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

            if (toneLibrary && typeof toneLibrary.start === "function") {
                toneLibrary.start().catch(() => {});
            }

            if (audioContext && typeof audioContext.resume === "function" && audioContext.state === "suspended") {
                audioContext.resume().catch(() => {});
            }

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
            resetDspParameters();
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
            resetDspParameters();
            updateTrackDetails({ resetTime: true });

            if (autoplay) {
                playCurrentTrack();
            } else {
                updatePlayButton();
            }
        }

        resetDspParameters();

        rateSlider.addEventListener("input", (event) => {
            const rate = Number(event.target.value);
            if (Number.isNaN(rate) || rate <= 0) {
                return;
            }

            const appliedRate = setPlaybackRate(rate);
            updateRateDisplay(appliedRate);
        });

        filterSlider.addEventListener("input", (event) => {
            const value = Number(event.target.value);
            if (Number.isNaN(value)) {
                return;
            }

            ensureAudioContext();
            applyFilterValue(value);
        });

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
