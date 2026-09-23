export const MOTH_RENDER_CONSTANTS = Object.freeze({
    response: 1.78,
    waveformDepth: 1.34,
    rotation: 0.35,
    trail: 2.4,
    glow: 1.2
});

// Deliberately fixed rather than exposed as a style control. Optical flow is
// part of the v1.7 composition's identity, and weakening it made the projected
// grid read as a designed insect instead of a noisy, moving wire surface.
export const OSCILLOSCOPE_OPTICAL_FLOW_SCALE = 16;

export const QUALITY_TIERS = Object.freeze([
    Object.freeze({ name: "low", resolution: 256, waveformSamples: 512 }),
    Object.freeze({ name: "medium", resolution: 512, waveformSamples: 1024 }),
    Object.freeze({ name: "high", resolution: 768, waveformSamples: 2048 })
]);

export function computeSquareViewport(width, height) {
    const safeWidth = Math.max(1, Math.floor(Number(width) || 0));
    const safeHeight = Math.max(1, Math.floor(Number(height) || 0));
    const size = Math.max(1, Math.min(safeWidth, safeHeight));
    return {
        x: Math.floor((safeWidth - size) / 2),
        y: Math.floor((safeHeight - size) / 2),
        size
    };
}

export function resampleWaveform(source, target) {
    if (!target?.length) {
        return target;
    }
    if (!source?.length) {
        target.fill(0);
        return target;
    }

    const sourceLast = source.length - 1;
    const targetLast = Math.max(1, target.length - 1);
    for (let index = 0; index < target.length; index += 1) {
        const position = (index / targetLast) * sourceLast;
        const lower = Math.floor(position);
        const upper = Math.min(sourceLast, lower + 1);
        const mix = position - lower;
        target[index] = source[lower] * (1 - mix) + source[upper] * mix;
    }
    return target;
}

export function createAdaptiveQualityController({ startTier = 1 } = {}) {
    let tier = Math.min(QUALITY_TIERS.length - 1, Math.max(0, startTier));
    let samples = [];
    let slowSince = null;
    let fastSince = null;
    let lastChange = -Infinity;
    let consecutiveLongFrames = 0;

    function median(values) {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    }

    function record(frameTime, nowSeconds) {
        const duration = Math.max(0, Number(frameTime) || 0);
        const now = Math.max(0, Number(nowSeconds) || 0);
        samples.push(duration);
        if (samples.length > 120) samples.shift();

        const sampleMedian = median(samples);
        consecutiveLongFrames = duration > 40 ? consecutiveLongFrames + 1 : 0;
        const hasLongFrameBurst = consecutiveLongFrames >= 3;
        const isSlow = sampleMedian > 22 || hasLongFrameBurst;
        const isFast = samples.length >= 60 && sampleMedian < 12;

        if (isSlow) {
            slowSince ??= now;
            fastSince = null;
        } else if (isFast) {
            fastSince ??= now;
            slowSince = null;
        } else {
            slowSince = null;
            fastSince = null;
        }

        let changed = false;
        if (tier > 0 && (hasLongFrameBurst || (slowSince !== null && now - slowSince >= 2))) {
            tier -= 1;
            changed = true;
        } else if (
            tier < QUALITY_TIERS.length - 1 &&
            fastSince !== null &&
            now - fastSince >= 5 &&
            now - lastChange >= 10
        ) {
            tier += 1;
            changed = true;
        }

        if (changed) {
            samples = [];
            slowSince = null;
            fastSince = null;
            consecutiveLongFrames = 0;
            lastChange = now;
        }

        return { changed, tier, quality: QUALITY_TIERS[tier], median: sampleMedian };
    }

    return {
        record,
        get tier() {
            return tier;
        },
        get quality() {
            return QUALITY_TIERS[tier];
        }
    };
}
