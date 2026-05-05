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
