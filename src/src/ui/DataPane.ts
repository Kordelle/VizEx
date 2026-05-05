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
  const rawInput = document.getElementById('raw-input') as HTMLDivElement;
  const highlightLayer = document.getElementById('highlight-layer') as HTMLDivElement;
  const perfWarning = document.getElementById('perf-warning') as HTMLDivElement;
  const truncationWarning = document.getElementById('truncation-warning') as HTMLDivElement;
  const noMatchesIndicator = document.getElementById('no-matches-indicator') as HTMLDivElement;

  if (!rawInput || !highlightLayer) return;

  // Scroll sync — keep highlight layer position locked to input
  rawInput.addEventListener('scroll', () => {
    highlightLayer.scrollTop = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;
  });

  // Input → dispatch state change (debounced)
  const handleInputChange = debounce((value: string) => {
    dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: value } });
  }, 150);

  rawInput.addEventListener('input', () => {
    handleInputChange(rawInput.textContent ?? '');
  });

  // Strip rich HTML on paste — keep plain text only
  rawInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  });

  // State change → re-run engine → update highlights
  subscribe((state) => {
    const input = state.rawInput;
    const pattern = state.pattern;

    if (perfWarning) perfWarning.hidden = input.length <= 50_000;

    // No pattern — clear everything
    if (!pattern.raw) {
      highlightLayer.innerHTML = buildHighlightSpans(input, []);
      highlightLayer.scrollTop = rawInput.scrollTop;
      setPatternError(null);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      if (truncationWarning) truncationWarning.hidden = true;
      return;
    }

    const result = resolveMatches(pattern, input);

    if (isPatternError(result)) {
      highlightLayer.innerHTML = buildHighlightSpans(input, []);
      highlightLayer.scrollTop = rawInput.scrollTop;
      setPatternError(result.message);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      if (truncationWarning) truncationWarning.hidden = true;
      return;
    }

    setPatternError(null);
    highlightLayer.innerHTML = buildHighlightSpans(input, result.spans);
    highlightLayer.scrollTop = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;

    if (noMatchesIndicator) {
      noMatchesIndicator.textContent = (input && result.spans.length === 0) ? 'No matches found' : '';
    }

    if (truncationWarning) {
      if (result.truncated) {
        truncationWarning.textContent = `⚠ Showing first 2,000 of ${result.totalMatchCount.toLocaleString()} matches — refine your pattern to see more.`;
        truncationWarning.hidden = false;
      } else {
        truncationWarning.hidden = true;
      }
    }
  });
}
