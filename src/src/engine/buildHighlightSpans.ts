import type { MatchSpan } from '../types.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHighlightSpans(input: string, spans: MatchSpan[]): string {
  if (!input) return '';
  if (!spans.length) return escapeHtml(input);

  const parts: string[] = [];
  let cursor = 0;

  for (const span of spans) {
    // Text before this match
    if (span.start > cursor) {
      parts.push(escapeHtml(input.slice(cursor, span.start)));
    }

    // Build tooltip for overlapping alternatives
    let title = '';
    if (span.overlappingAlternatives.length > 0) {
      const alts = span.overlappingAlternatives.map(o => escapeHtml(o.text)).join(', ');
      title = ` title="Overlapping alternatives: ${alts}"`;
    }

    parts.push(
      `<mark data-group="${span.groupIndex}"${title}>${escapeHtml(span.text)}</mark>`
    );

    cursor = span.end;
  }

  // Remaining text after last match
  if (cursor < input.length) {
    parts.push(escapeHtml(input.slice(cursor)));
  }

  return parts.join('');
}

/**
 * Viewport-aware render: only emit real <mark> elements for spans whose
 * character offsets fall within the visible scroll window.
 * Off-screen spans are emitted as plain text so the layout stays identical.
 *
 * @param input     Full raw text
 * @param spans     All resolved spans
 * @param scrollTop Current scrollTop of the container (px)
 * @param clientH   Visible height of the container (px)
 * @param lineH     Approximate line height in px (defaults to 19.5 = 13px * 1.5)
 */
export function buildViewportSpans(
  input: string,
  spans: MatchSpan[],
  scrollTop: number,
  clientH: number,
  lineH = 19.5
): string {
  if (!input) return '';
  if (!spans.length) return escapeHtml(input);

  // Convert scroll window to approximate char offset range.
  // We work line-by-line: each line is ~lineH px tall.
  const firstVisLine = Math.max(0, Math.floor(scrollTop / lineH) - 2);        // 2-line buffer
  const lastVisLine  = Math.ceil((scrollTop + clientH) / lineH) + 2;

  // Build a char-offset-to-line-index map lazily: find newline positions
  const newlines: number[] = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '\n') newlines.push(i);
  }

  const firstVisChar = firstVisLine === 0 ? 0 : (newlines[firstVisLine - 1] ?? 0) + 1;
  const lastVisChar  = newlines[lastVisLine] ?? input.length;

  const parts: string[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      parts.push(escapeHtml(input.slice(cursor, span.start)));
    }

    // Only render a real <mark> if the span overlaps the visible window
    const visible = span.end >= firstVisChar && span.start <= lastVisChar;

    if (visible) {
      let title = '';
      if (span.overlappingAlternatives.length > 0) {
        const alts = span.overlappingAlternatives.map(o => escapeHtml(o.text)).join(', ');
        title = ` title="Overlapping alternatives: ${alts}"`;
      }
      parts.push(
        `<mark data-group="${span.groupIndex}"${title}>${escapeHtml(span.text)}</mark>`
      );
    } else {
      // Off-screen — plain text keeps layout identical
      parts.push(escapeHtml(span.text));
    }

    cursor = span.end;
  }

  if (cursor < input.length) {
    parts.push(escapeHtml(input.slice(cursor)));
  }

  return parts.join('');
}

