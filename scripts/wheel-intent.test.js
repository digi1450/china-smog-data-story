import test from 'node:test';
import assert from 'node:assert/strict';
import { createWheelIntent } from '../js/wheel-intent.js';

function transitions(trace) {
  const intent = createWheelIntent();
  let readyAt = 0, count = 0;
  for (const [time, delta] of trace) {
    const move = intent.sample(delta, time);
    if (time < readyAt) { intent.consume(); continue; }
    if (move) { count++; readyAt = time + 740; intent.consume(); }
  }
  return count;
}

test('one long decaying trackpad swipe does not advance again after animation', () => {
  assert.equal(transitions(Array.from({length:170}, (_, i) => [i * 16, 120 * .96 ** i])), 1);
});
test('continued deliberate mouse notches can advance without waiting for silence', () => {
  assert.equal(transitions(Array.from({length:20}, (_, i) => [i * 120, 100])), 3);
});
test('a new swipe after a pause responds immediately', () => {
  const intent = createWheelIntent();
  for (let i = 0; i < 60; i++) intent.sample(100 * .94 ** i, i * 16);
  assert.equal(intent.sample(20, 1300), true);
});
test('renewed pressure and direction reversal recover from a tail', () => {
  const intent = createWheelIntent();
  for (let i = 0; i < 80; i++) intent.sample(100 * .96 ** i, i * 16);
  assert.equal(intent.sample(80, 1280), true);
  intent.consume();
  assert.equal(intent.sample(-30, 1296), true);
});
test('subpixel noise cannot change a scene', () => {
  const intent = createWheelIntent();
  for (let i = 0; i < 100; i++) assert.equal(intent.sample(.2, i * 16), false);
});

