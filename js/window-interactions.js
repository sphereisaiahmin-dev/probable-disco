export const COMPACT_WINDOW_QUERY =
    "(max-width: 640px), (pointer: coarse) and (max-width: 900px), (max-height: 500px) and (max-width: 900px)";

export const SWIPE_DIRECTION_LOCK_DISTANCE = 10;
export const SWIPE_MIN_DISTANCE = 40;
export const SWIPE_MIN_VELOCITY = 0.28;

export function isCompactWindowLayout() {
    return Boolean(window.matchMedia?.(COMPACT_WINDOW_QUERY).matches);
}

export function classifySwipeGesture({ deltaX, deltaY, elapsedMs }) {
    const distanceX = Math.abs(Number(deltaX) || 0);
    const distanceY = Math.abs(Number(deltaY) || 0);
    const elapsed = Math.max(Number(elapsedMs) || 0, 1);

    if (Math.max(distanceX, distanceY) < SWIPE_DIRECTION_LOCK_DISTANCE) {
        return { axis: null, direction: 0, accepted: false };
    }

    if (distanceY > distanceX) {
        return { axis: "vertical", direction: 0, accepted: false };
    }

    const velocity = distanceX / elapsed;
    const accepted = distanceX >= SWIPE_MIN_DISTANCE || velocity >= SWIPE_MIN_VELOCITY;
    return {
        axis: "horizontal",
        direction: accepted ? (deltaX < 0 ? 1 : -1) : 0,
        accepted
    };
}

export function shouldUseSidewaysWindow({ compact, viewportWidth, viewportHeight, aspectRatio }) {
    return Boolean(
        compact &&
            viewportHeight > viewportWidth &&
            Number.isFinite(aspectRatio) &&
            aspectRatio > 1
    );
}
