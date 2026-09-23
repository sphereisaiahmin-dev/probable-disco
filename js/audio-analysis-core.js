(function attachAudioAnalysisCore(root, factory) {
    const api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.SaintJustusAudioAnalysis = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAudioAnalysisCore() {
    "use strict";

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function computeRms(values) {
        if (!values || values.length === 0) {
            return 0;
        }

        let sum = 0;
        for (let index = 0; index < values.length; index += 1) {
            const value = Number(values[index]) || 0;
            sum += value * value;
        }
        return Math.sqrt(sum / values.length);
    }

    function createEnvelopeFollower({ windowSeconds = 1, smoothingSeconds = 0.1 } = {}) {
        const capacity = 512;
        const times = new Float64Array(capacity);
        const energies = new Float64Array(capacity);
        let head = 0;
        let count = 0;
        let sum = 0;
        let smoothed = 0;
        let lastTime = null;

        function reset() {
            head = 0;
            count = 0;
            sum = 0;
            smoothed = 0;
            lastTime = null;
        }

        function update(rms, timeSeconds) {
            const now = Number.isFinite(timeSeconds) ? timeSeconds : 0;
            const energy = Math.max(0, Number(rms) || 0) ** 2;
            if (count === capacity) {
                sum -= energies[head];
                head = (head + 1) % capacity;
                count -= 1;
            }
            const insertIndex = (head + count) % capacity;
            times[insertIndex] = now;
            energies[insertIndex] = energy;
            count += 1;
            sum += energy;

            const cutoff = now - Math.max(0.01, windowSeconds);
            while (count > 1 && times[head] < cutoff) {
                sum -= energies[head];
                head = (head + 1) % capacity;
                count -= 1;
            }

            const windowRms = Math.sqrt(Math.max(0, sum / Math.max(1, count)));
            const delta = lastTime === null ? 1 / 60 : clamp(now - lastTime, 1 / 240, 0.25);
            const smoothing = Math.max(0.001, smoothingSeconds);
            const coefficient = 1 - Math.exp(-delta / smoothing);
            smoothed += (windowRms - smoothed) * coefficient;
            lastTime = now;
            return smoothed;
        }

        return {
            reset,
            update,
            get value() {
                return smoothed;
            }
        };
    }

    function mapLowEnvelope(value) {
        return clamp((Number(value) || 0) * 2, 0, 0.5);
    }

    function mapHighEnvelope(value) {
        return clamp(0.2 + (Number(value) || 0) * 1.6, 0.2, 1);
    }

    return {
        clamp,
        computeRms,
        createEnvelopeFollower,
        mapLowEnvelope,
        mapHighEnvelope
    };
});
