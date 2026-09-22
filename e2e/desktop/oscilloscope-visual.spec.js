const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

async function measureFrameTimes(page, sampleCount = 60) {
    return page.evaluate(async (count) => {
        const durations = [];
        let previous = 0;
        await new Promise((resolve) => {
            const sample = (timestamp) => {
                if (previous) durations.push(timestamp - previous);
                previous = timestamp;
                if (durations.length > 0 && durations.length % 20 === 0) {
                    document.dispatchEvent(new Event('pointermove'));
                }
                if (durations.length >= count) resolve();
                else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
        });
        durations.sort((a, b) => a - b);
        return {
            median: durations[Math.floor(durations.length / 2)],
            p95: durations[Math.floor(durations.length * 0.95)]
        };
    }, sampleCount);
}

test('moth renders real audio at desktop size and holds an interactive frame rate', async ({ page }) => {
    test.setTimeout(90000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/art');
    const baselinePerformance = await measureFrameTimes(page, 20);
    const windowElement = page.locator('[data-window-id="art:moth"]');
    await expect(windowElement).toBeVisible();
    await expect(windowElement.locator('.oscilloscope-controls')).toHaveCount(0);

    const fullscreenButton = windowElement.locator('.art-window__control--fullscreen');
    await fullscreenButton.click({ force: true });
    await expect(windowElement).toHaveClass(/is-active/);
    await expect.poll(() => windowElement.evaluate((element) => {
        const canvas = element.querySelector('canvas');
        const content = element.querySelector('.art-window__content');
        if (!canvas || !content) return false;
        return Math.abs(canvas.getBoundingClientRect().width - content.getBoundingClientRect().width) < 2;
    })).toBe(true);
    await fullscreenButton.click({ force: true });
    await expect(windowElement).not.toHaveClass(/is-active/);
    await expect(windowElement.locator('.oscilloscope-controls')).toHaveCount(0);

    const player = page.getByRole('region', { name: 'saintjustus audio player' });
    await player.getByRole('button', { name: 'play' }).click();
    await expect.poll(
        () => page.evaluate(() => window.__saintjustusAudioController.analysis.available),
        { timeout: 10000 }
    ).toBe(true);
    await page.waitForTimeout(2500);

    const performance = await measureFrameTimes(page, 30);
    await expect(windowElement).not.toHaveClass(/is-active/);

    const outputDirectory = path.join(process.cwd(), 'media', 'validation');
    fs.mkdirSync(outputDirectory, { recursive: true });
    await page.screenshot({ path: path.join(outputDirectory, 'moth-browser.png') });

    console.log(`moth frame timing: ${JSON.stringify({ baselinePerformance, performance })}`);

    expect(performance.median).toBeLessThanOrEqual(Math.max(25, baselinePerformance.median * 1.35));
    expect(performance.p95).toBeLessThanOrEqual(Math.max(42, baselinePerformance.p95 * 1.5));
    expect(errors).toEqual([]);
});
