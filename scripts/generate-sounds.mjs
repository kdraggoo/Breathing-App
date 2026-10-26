// Generates the app's sound effects as 16-bit mono WAVs in assets/sounds/.
// Everything is synthesized here (no third-party audio), so the output is
// deterministic and free to ship. Run: node scripts/generate-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// Seeded PRNG so regenerated files are byte-identical.
function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// Smooth attack/release envelope (0..1) at time t of a sound lasting `dur`.
function envelope(t, dur, attack, release) {
  if (t < attack) return Math.sin((t / attack) * (Math.PI / 2)) ** 2;
  if (t > dur - release) return Math.sin(((dur - t) / release) * (Math.PI / 2)) ** 2;
  return 1;
}

// Soft bell: a sine partial plus a quieter octave, with exponential decay.
function bell(out, start, freq, dur, gain) {
  const s0 = Math.floor(start * RATE);
  for (let i = 0; i < dur * RATE && s0 + i < out.length; i++) {
    const t = i / RATE;
    const decay = Math.exp(-t * 3.2) * Math.min(1, t / 0.01);
    out[s0 + i] +=
      gain * decay * (Math.sin(2 * Math.PI * freq * t) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t));
  }
}

// Breath-in cue: two rising bell notes.
function inhale() {
  const out = new Float32Array(Math.floor(2.2 * RATE));
  bell(out, 0, 523.25, 2.2, 0.32); // C5
  bell(out, 0.35, 659.25, 1.85, 0.28); // E5
  return out;
}

// Blow-out cue: a gentle wind gust (filtered noise whose brightness falls).
function exhale() {
  const dur = 4;
  const out = new Float32Array(dur * RATE);
  const rand = rng(7);
  let low = 0;
  let band = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    const cutoff = 900 - 600 * (t / dur);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / RATE);
    low += a * (rand() * 2 - 1 - low);
    band += 0.02 * (low - band); // remove some rumble
    const gust = 0.75 + 0.25 * Math.sin(2 * Math.PI * 0.6 * t);
    out[i] = (low - band) * 2.4 * gust * envelope(t, dur, 0.6, 1.6);
  }
  return out;
}

// Session finished: a little rising arpeggio.
function done() {
  const out = new Float32Array(Math.floor(2.6 * RATE));
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => bell(out, i * 0.16, f, 2.6 - i * 0.16, 0.22));
  return out;
}

mkdirSync(outDir, { recursive: true });
for (const [name, make] of Object.entries({ inhale, exhale, done })) {
  writeFileSync(join(outDir, `${name}.wav`), encodeWav(make()));
  console.log(`wrote assets/sounds/${name}.wav`);
}
