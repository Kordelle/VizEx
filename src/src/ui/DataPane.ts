import { dispatch, subscribe, setPatternError } from '../state.js';
import { buildHighlightSpans } from '../engine/buildHighlightSpans.js';
import type { WorkerRequest, WorkerResponse } from '../engine/matchWorker.js';

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

  // ── Web Worker setup ────────────────────────────────────────────────────────
  const worker = new Worker(
    new URL('../engine/matchWorker.ts', import.meta.url),
    { type: 'module' }
  );

  let latestJobId = 0;

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    const { id, html, error, truncated, totalMatchCount } = e.data;

    // Drop stale results from superseded jobs
    if (id !== latestJobId) return;

    if (error !== null) {
      applyHighlights('', rawInput.scrollTop, rawInput.scrollLeft);
      setPatternError(error);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      if (truncationWarning) truncationWarning.hidden = true;
      return;
    }

    setPatternError(null);
    applyHighlights(html, rawInput.scrollTop, rawInput.scrollLeft);

    const inputText = rawInput.textContent ?? '';
    if (noMatchesIndicator) {
      noMatchesIndicator.textContent = (inputText && e.data.spans.length === 0)
        ? 'No matches found'
        : '';
    }

    if (truncationWarning) {
      if (truncated) {
        truncationWarning.textContent =
          `⚠ Showing first 2,000 of ${totalMatchCount.toLocaleString()} matches — refine your pattern to see more.`;
        truncationWarning.hidden = false;
      } else {
        truncationWarning.hidden = true;
      }
    }
  };

  function applyHighlights(html: string, scrollTop: number, scrollLeft: number): void {
    highlightLayer.innerHTML = html;
    highlightLayer.scrollTop = scrollTop;
    highlightLayer.scrollLeft = scrollLeft;
  }

  function postJob(inputText: string): void {
    const state = getLatestState();
    if (!state) return;

    if (perfWarning) {
      perfWarning.hidden = inputText.length <= 50_000;
    }

    if (!state.pattern.raw) {
      applyHighlights(buildHighlightSpans(inputText, []), rawInput.scrollTop, rawInput.scrollLeft);
      setPatternError(null);
      if (noMatchesIndicator) noMatchesIndicator.textContent = '';
      if (truncationWarning) truncationWarning.hidden = true;
      return;
    }

    const id = ++latestJobId;
    const req: WorkerRequest = { id, pattern: state.pattern, rawInput: inputText };
    worker.postMessage(req);
  }

  // ── Scroll sync ─────────────────────────────────────────────────────────────
  rawInput.addEventListener('scroll', () => {
    highlightLayer.scrollTop = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;
  });

  // ── Input → state dispatch ───────────────────────────────────────────────────
  const handleInputChange = debounce((value: string) => {
    dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: value } });
  }, 150);

  rawInput.addEventListener('input', () => {
    const text = rawInput.textContent ?? '';
    handleInputChange(text);
  });

  // Prevent pasting rich HTML — keep plaintext only (fallback for browsers that
  // don't fully honour contenteditable="plaintext-only")
  rawInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  });

  // ── State subscription → post worker job ────────────────────────────────────
  let cachedState: ReturnType<typeof import('../state.js').getState> | null = null;

  function getLatestState() { return cachedState; }

  subscribe((state) => {
    cachedState = state;
    postJob(state.rawInput);
  });
}
