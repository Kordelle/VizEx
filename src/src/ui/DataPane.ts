import { dispatch, subscribe, setPatternError } from '../state.js';
import { resolveMatches } from '../engine/resolveMatches.js';
import { buildHighlightSpans } from '../engine/buildHighlightSpans.js';
import { isPatternError } from '../types.js';

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function initDataPane(): void {
  const rawInput = document.getElementById('raw-input') as HTMLTextAreaElement;
  const highlightLayer = document.getElementById('highlight-layer') as HTMLDivElement;
  const perfWarning = document.getElementById('perf-warning') as HTMLDivElement;
  const noMatchesIndicator = document.getElementById('no-matches-indicator') as HTMLDivElement;

  if (!rawInput || !highlightLayer) return;

  // Sync scroll between textarea and highlight layer
  rawInput.addEventListener('scroll', () => {
    highlightLayer.scrollTop = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;
  });

  const handleInputChange = debounce((value: string) => {
    dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: value } });
  }, 150);

  rawInput.addEventListener('input', () => {
    handleInputChange(rawInput.value);
  });

  // Re-render highlights on every state change
  subscribe((state) => {
    const input = state.rawInput;
    const pattern = state.pattern;

    // Show/hide perf warning
    if (perfWarning) {
      perfWarning.hidden = input.length <= 50_000;
    }

    // Empty pattern — clear highlights
    if (!pattern.raw) {
      highlightLayer.innerHTML = buildHighlightSpans(input, []);
      highlightLayer.scrollTop = rawInput.scrollTop;
      highlightLayer.scrollLeft = rawInput.scrollLeft;
      setPatternError(null);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      return;
    }

    const result = resolveMatches(pattern, input);

    if (isPatternError(result)) {
      highlightLayer.innerHTML = buildHighlightSpans(input, []);
      highlightLayer.scrollTop = rawInput.scrollTop;
      highlightLayer.scrollLeft = rawInput.scrollLeft;
      setPatternError(result.message);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      return;
    }

    setPatternError(null);
    highlightLayer.innerHTML = buildHighlightSpans(input, result.spans);
    // Re-sync scroll after innerHTML reset (replaces DOM, resets scrollTop to 0)
    highlightLayer.scrollTop = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;

    if (noMatchesIndicator) {
      noMatchesIndicator.textContent = (input && result.spans.length === 0)
        ? 'No matches found'
        : '';
    }
  });
}
