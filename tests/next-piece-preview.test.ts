// Tests for the next-piece preview accessible labeling enhancement.
//
// Covers acceptance criterion: the next-piece preview renders with a labeled
// heading ("Next"), consistent cell sizing, and is announced as a region for
// assistive tech.

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { enhanceNextPiecePreview } from '../src/components/NextPiece/NextPiece';

function loadIndex(): JSDOM {
  const html = readFileSync(resolve(__dirname, '..', 'index.html'), 'utf-8');
  return new JSDOM(html);
}

describe('Next-piece preview accessibility', () => {
  it('exposes a "Next" heading and labels the region against it', () => {
    const dom = loadIndex();
    const result = enhanceNextPiecePreview({ document: dom.window.document });

    expect(result.region).not.toBeNull();
    expect(result.heading).not.toBeNull();
    expect(result.canvas).not.toBeNull();
    expect(result.headingId).toBeTruthy();

    expect(result.region!.getAttribute('role')).toBe('region');
    expect(result.region!.getAttribute('aria-labelledby')).toBe(result.headingId);

    const headingText = (result.heading!.textContent ?? '').trim().toLowerCase();
    expect(headingText).toContain('next');
  });

  it('points the preview canvas at the same label and applies preview class', () => {
    const dom = loadIndex();
    const result = enhanceNextPiecePreview({ document: dom.window.document });

    expect(result.canvas!.getAttribute('role')).toBe('img');
    expect(result.canvas!.getAttribute('aria-labelledby')).toBe(result.headingId);
    expect(result.canvas!.classList.contains('preview-next__canvas')).toBe(true);
  });

  it('uses only generic terminology — no proprietary brand names', () => {
    const dom = loadIndex();
    enhanceNextPiecePreview({ document: dom.window.document });
    const region = dom.window.document.querySelector('aside.rail-right')!;
    const html = region.outerHTML;
    const forbidden = /tetr\.?io|tetris/i;
    expect(forbidden.test(html)).toBe(false);
  });

  it('is idempotent — second call leaves the heading id stable', () => {
    const dom = loadIndex();
    const a = enhanceNextPiecePreview({ document: dom.window.document });
    const b = enhanceNextPiecePreview({ document: dom.window.document });
    expect(a.headingId).toBe(b.headingId);
  });
});
