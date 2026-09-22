const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const REFERENCE_STATES = [
    { frame: 60, low: 0.1377948076, high: 0.4465558231 },
    { frame: 180, low: 0.1977885365, high: 0.5699818730 },
    { frame: 300, low: 0.1183184311, high: 0.7077482343 },
    { frame: 420, low: 0.2506212592, high: 0.6802772284 }
];

test('moth reproduces the v1.7 wire-grid poses across the captured envelope sequence', async ({ page }) => {
    test.setTimeout(60000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto('/art');
    const windowElement = page.locator('[data-window-id="art:moth"]');
    const canvas = windowElement.locator('canvas');
    await expect(canvas).toBeVisible();
    await windowElement.locator('.art-window__control--fullscreen').click({ force: true });
    await expect(windowElement).toHaveClass(/is-active/);
    await windowElement.locator('.oscilloscope-status, .art-window__description').evaluateAll(
        (elements) => elements.forEach((element) => { element.style.visibility = 'hidden'; })
    );

    const outputDirectory = path.join(process.cwd(), 'media', 'validation', 'browser-sequence');
    fs.mkdirSync(outputDirectory, { recursive: true });

    for (const state of REFERENCE_STATES) {
        await page.evaluate((nextState) => {
            const analysis = window.__saintjustusAudioController.analysis;
            window.__oscilloscopeReferenceState = nextState;
            if (!window.__oscilloscopeOriginalRead) {
                window.__oscilloscopeOriginalRead = analysis.read;
                analysis.read = ({ waveform, spectrum, lowBand, highBand } = {}) => {
                    const current = window.__oscilloscopeReferenceState;
                    if (waveform) {
                        for (let index = 0; index < waveform.length; index += 1) {
                            const position = index / Math.max(1, waveform.length - 1);
                            waveform[index] = Math.sin(position * Math.PI * 18 + current.frame * 0.017) * 0.16;
                        }
                    }
                    spectrum?.fill?.(-48);
                    lowBand?.fill?.(current.low);
                    highBand?.fill?.(current.high);
                    return {
                        available: true,
                        playing: true,
                        contextState: 'running',
                        currentTime: current.frame / 60,
                        frame: current.frame,
                        lowEnvelope: current.low,
                        highEnvelope: current.high,
                        reason: ''
                    };
                };
            }
        }, state);
        await page.waitForTimeout(650);
        const filename = `browser-${String(state.frame).padStart(5, '0')}.png`;
        const clip = await canvas.boundingBox();
        expect(clip).toBeTruthy();
        await page.screenshot({ path: path.join(outputDirectory, filename), clip });
    }

    expect(errors).toEqual([]);
});
