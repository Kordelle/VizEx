import { subscribe } from '../state.js';
import type { AppState } from '../state.js';
import type { MatchSpan } from '../types.js';

const MAX_DISPLAY = 200;

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function buildDetailsHTML(state: AppState): string {
  const result = state.matchResult;

  if (!state.pattern.raw) {
    return '<p class="mdet-empty">Enter a pattern to see match details.</p>';
  }

  if (state.patternErrorMessage) {
    return `<p class="mdet-empty mdet-error">Pattern error — no matches.</p>`;
  }

  if (!result || result.spans.length === 0) {
    if (state.rawInput) {
      return '<p class="mdet-empty">No matches found.</p>';
    }
    return '<p class="mdet-empty">Paste input data to see match details.</p>';
  }

  // Only full-match spans (groupIndex === 0) are shown as rows;
  // capture groups for the same match are nested inside.
  const fullMatches = result.spans.filter(s => s.groupIndex === 0);
  const displayed = fullMatches.slice(0, MAX_DISPLAY);
  const overLimit = fullMatches.length > MAX_DISPLAY;

  // Build a map from start offset → capture group spans for quick lookup
  // (groupIndex > 0 and same parent range)
  const groupMap = new Map<number, MatchSpan[]>();
  result.spans.filter(s => s.groupIndex > 0).forEach(s => {
    if (!groupMap.has(s.start)) groupMap.set(s.start, []);
    groupMap.get(s.start)!.push(s);
  });

  const rows = displayed.map((span, i) => {
    const groups = groupMap.get(span.start) ?? [];
    const groupRows = groups.map(g =>
      `<tr class="mdet-group-row">
        <td class="mdet-idx">Group ${g.groupIndex}</td>
        <td class="mdet-val"><code>${truncate(escHtml(g.text))}</code></td>
        <td class="mdet-pos">${g.start}–${g.end}</td>
        <td class="mdet-len">${g.end - g.start}</td>
      </tr>`
    ).join('');

    return `<tr class="mdet-match-row">
      <td class="mdet-idx">#${i + 1}</td>
      <td class="mdet-val"><code>${truncate(escHtml(span.text))}</code></td>
      <td class="mdet-pos">${span.start}–${span.end}</td>
      <td class="mdet-len">${span.end - span.start}</td>
    </tr>${groupRows}`;
  }).join('');

  const overflow = overLimit
    ? `<p class="mdet-overflow">Showing first ${MAX_DISPLAY} of ${result.totalMatchCount.toLocaleString()} matches.</p>`
    : '';

  return `
    <table class="mdet-table" aria-label="Match details">
      <thead>
        <tr>
          <th>#</th>
          <th>Match</th>
          <th>Position</th>
          <th>Length</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${overflow}`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initMatchDetailsPanel(): void {
  const container = document.getElementById('match-details-panel') as HTMLDivElement | null;
  if (!container) return;

  subscribe((state: AppState) => {
    container.innerHTML = buildDetailsHTML(state);
  });
}
