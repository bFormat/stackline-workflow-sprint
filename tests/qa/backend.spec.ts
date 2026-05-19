// Backend / build-pipeline QA spec.
//
// This is a static GitHub Pages game — there is no runtime backend. This
// spec verifies the only "data layer" surfaces that exist:
//   (a) the deterministic seeded engine reducer (the closest thing to a
//       persistence/PRNG contract this app exposes);
//   (b) the absence of fetch / XHR / localStorage / service-worker call
//       sites in the source tree — i.e., no client-data layer to test.
//
// If a client-data layer is ever introduced, extend this spec with its
// read/write contract tests.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInitialState, reduce } from '../../src/engine';

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

describe('Backend QA — deterministic engine "data contract"', () => {
  it('seeded START produces a stable initial piece kind', () => {
    const a = reduce(createInitialState(123), { type: 'START' });
    const b = reduce(createInitialState(123), { type: 'START' });
    expect(a.current?.kind).toBe(b.current?.kind);
    expect(a.queue).toEqual(b.queue);
  });

  it('different seeds diverge — PRNG is actually being seeded', () => {
    const seedsA = reduce(createInitialState(1), { type: 'START' }).queue.join(',');
    const seedsB = reduce(createInitialState(99999), { type: 'START' }).queue.join(',');
    // Same 7-bag set, but the shuffled order should differ for distinct seeds.
    expect(seedsA).not.toBe(seedsB);
  });

  it('score/lines/level invariants hold after RESTART', () => {
    let s = reduce(createInitialState(7), { type: 'START' });
    s = { ...s, score: 999, lines: 42, level: 7 };
    s = reduce(s, { type: 'RESTART' });
    expect(s.score).toBe(0);
    expect(s.lines).toBe(0);
    expect(s.level).toBe(1);
  });
});

describe('Backend QA — no runtime server / client-data surfaces', () => {
  const repoRoot = resolve(__dirname, '..', '..');
  const sources = walk(join(repoRoot, 'src'));

  it('no source file calls fetch(), XMLHttpRequest, WebSocket, or navigator.sendBeacon', () => {
    const offenders: string[] = [];
    for (const file of sources) {
      const txt = readFileSync(file, 'utf-8');
      if (/\bfetch\s*\(/.test(txt)) offenders.push(`${file}: fetch()`);
      if (/XMLHttpRequest/.test(txt)) offenders.push(`${file}: XMLHttpRequest`);
      if (/\bnew WebSocket\b/.test(txt)) offenders.push(`${file}: WebSocket`);
      if (/sendBeacon/.test(txt)) offenders.push(`${file}: sendBeacon`);
    }
    expect(offenders).toEqual([]);
  });

  it('no source file uses localStorage / sessionStorage / IndexedDB / service workers', () => {
    const offenders: string[] = [];
    for (const file of sources) {
      const txt = readFileSync(file, 'utf-8');
      if (/\blocalStorage\b/.test(txt)) offenders.push(`${file}: localStorage`);
      if (/\bsessionStorage\b/.test(txt)) offenders.push(`${file}: sessionStorage`);
      if (/\bindexedDB\b/.test(txt)) offenders.push(`${file}: indexedDB`);
      if (/serviceWorker/.test(txt)) offenders.push(`${file}: serviceWorker`);
    }
    expect(offenders).toEqual([]);
  });

  it('package.json declares no runtime dependencies (devDependencies only)', () => {
    const repoRoot = resolve(__dirname, '..', '..');
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
    expect(pkg.dependencies ?? {}).toEqual({});
  });
});
