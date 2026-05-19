// Next-piece preview accessibility & clarity enhancements.
//
// The existing markup already includes a "Next" heading and a canvas — this
// module wires them together with a labeled region role and ensures the
// preview canvas has a consistent, accessible name. Generic naming only — no
// proprietary brand references.

import '../../styles/preview-next.css';

export interface NextPieceEnhanceOptions {
  /** Document to operate on (defaults to global document). */
  document?: Document;
  /** Selector for the rail/aside that contains the next preview. */
  railSelector?: string;
  /** Selector for the heading element inside the rail. */
  headingSelector?: string;
  /** Selector for the canvas inside the rail. */
  canvasSelector?: string;
}

export interface NextPieceEnhanceResult {
  region: HTMLElement | null;
  heading: HTMLElement | null;
  canvas: HTMLCanvasElement | null;
  headingId: string | null;
}

/**
 * Decorate the existing next-piece preview area so it announces itself as a
 * labeled region. Idempotent — safe to call multiple times.
 */
export function enhanceNextPiecePreview(
  options: NextPieceEnhanceOptions = {},
): NextPieceEnhanceResult {
  const doc = options.document ?? document;
  const railSelector = options.railSelector ?? 'aside.rail-right';
  const headingSelector = options.headingSelector ?? '.rail-title';
  const canvasSelector = options.canvasSelector ?? 'canvas';

  const rail = doc.querySelector<HTMLElement>(railSelector);
  if (!rail) {
    return { region: null, heading: null, canvas: null, headingId: null };
  }

  const heading = rail.querySelector<HTMLElement>(headingSelector);
  const canvas = rail.querySelector<HTMLCanvasElement>(canvasSelector);

  let headingId: string | null = null;
  if (heading) {
    if (!heading.id) {
      heading.id = 'next-piece-heading';
    }
    headingId = heading.id;
    // Make sure the visible label clearly says "Next" without proprietary
    // branding; preserve existing text when it already does.
    const text = (heading.textContent ?? '').trim().toLowerCase();
    if (!text.includes('next')) {
      heading.textContent = 'Next';
    }
  }

  rail.setAttribute('role', 'region');
  rail.classList.add('preview-next');
  if (headingId) {
    rail.setAttribute('aria-labelledby', headingId);
  } else {
    rail.setAttribute('aria-label', 'Next pieces');
  }

  if (canvas) {
    canvas.classList.add('preview-next__canvas');
    canvas.setAttribute('role', 'img');
    if (headingId) {
      canvas.setAttribute('aria-labelledby', headingId);
    }
    // Preserve existing aria-label as a fallback description.
    if (!canvas.getAttribute('aria-label')) {
      canvas.setAttribute('aria-label', 'Upcoming pieces preview');
    }
  }

  return { region: rail, heading, canvas, headingId };
}
