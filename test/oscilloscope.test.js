const test = require('node:test');
const assert = require('node:assert/strict');

const analysisCore = require('../js/audio-analysis-core.js');

let sceneCore;
test.before(async () => {
    sceneCore = await import('../js/art/scenes/oscilloscopeCore.mjs');
});

test('audio analysis computes rms without mutating its input', () => {
    const samples = new Float32Array([1, -1, 1, -1]);
    assert.equal(analysisCore.computeRms(samples), 1);
    assert.deepEqual(Array.from(samples), [1, -1, 1, -1]);
});

test('audio analysis envelope follows a one-second energy window and resets', () => {
    const follower = analysisCore.createEnvelopeFollower({ windowSeconds: 1, smoothingSeconds: 0.1 });
    const attack = follower.update(1, 0);
    const sustained = follower.update(1, 0.1);
    assert.ok(attack > 0 && attack < 1);
    assert.ok(sustained > attack);
    follower.update(0, 1.2);
    assert.ok(follower.value < sustained);
    follower.reset();
    assert.equal(follower.value, 0);
});

test('touchdesigner envelope mappings stay within saved ranges', () => {
    assert.equal(analysisCore.mapLowEnvelope(-1), 0);
    assert.equal(analysisCore.mapLowEnvelope(1), 0.5);
    assert.equal(analysisCore.mapHighEnvelope(-1), 0.2);
    assert.equal(analysisCore.mapHighEnvelope(1), 1);
});

test('moth render values are fixed and expose no parameter controls', () => {
    assert.deepEqual(sceneCore.MOTH_RENDER_CONSTANTS, {
        response: 1.78,
        waveformDepth: 1.34,
        rotation: 0.35,
        trail: 2.4,
        glow: 1.2
    });
    assert.equal(sceneCore.OSCILLOSCOPE_OPTICAL_FLOW_SCALE, 16);
    assert.equal('OSCILLOSCOPE_DEFAULTS' in sceneCore, false);
    assert.equal('OSCILLOSCOPE_CONTROLS' in sceneCore, false);
    assert.equal('clampParameter' in sceneCore, false);
});

test('oscilloscope preserves a centered square viewport', () => {
    assert.deepEqual(sceneCore.computeSquareViewport(800, 600), { x: 100, y: 0, size: 600 });
    assert.deepEqual(sceneCore.computeSquareViewport(300, 700), { x: 0, y: 200, size: 300 });
});

test('waveform resampling preserves endpoints and interpolates', () => {
    const target = new Float32Array(5);
    sceneCore.resampleWaveform(new Float32Array([-1, 1]), target);
    assert.deepEqual(Array.from(target), [-1, -0.5, 0, 0.5, 1]);
});

test('adaptive quality demotes on sustained slow frames and promotes after recovery', () => {
    const controller = sceneCore.createAdaptiveQualityController();
    let result;
    for (let index = 0; index < 130; index += 1) {
        result = controller.record(30, index * 0.02);
    }
    assert.equal(controller.quality.name, 'low');
    for (let index = 0; index < 700; index += 1) {
        result = controller.record(8, 12 + index * 0.01);
    }
    assert.equal(result.quality.name, 'medium');
});
