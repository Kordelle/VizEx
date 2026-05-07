import { dispatch, subscribe, setPatternError } from '../state.js';
import { resolveMatches } from '../engine/resolveMatches.js';
import { buildViewportSpans } from '../engine/buildHighlightSpans.js';
import { isPatternError } from '../types.js';
import type { MatchSpan } from '../types.js';

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// rAF-throttled callback — at most one repaint per frame
function rafThrottle(fn: () => void): () => void {
  let pending = false;
  return () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; fn(); });
  };
}

/** Load text into the raw-input div and fire state update */
function loadText(rawInput: HTMLDivElement, text: string): void {
  rawInput.textContent = text;
  dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: text } });
}

export function initDataPane(): void {
  const rawInput       = document.getElementById('raw-input')            as HTMLDivElement;
  const highlightLayer = document.getElementById('highlight-layer')      as HTMLDivElement;
  const truncWarning   = document.getElementById('truncation-warning')   as HTMLDivElement;
  const noMatches      = document.getElementById('no-matches-indicator') as HTMLDivElement;
  const matchCount     = document.getElementById('match-count')          as HTMLSpanElement | null;
  const timingReadout  = document.getElementById('timing-readout')       as HTMLSpanElement | null;
  const fileUpload     = document.getElementById('file-upload')          as HTMLInputElement | null;
  const btnClear       = document.getElementById('btn-clear')            as HTMLButtonElement | null;

  if (!rawInput || !highlightLayer) return;

  // ── Render cache ──────────────────────────────────────────────────────────
  let cachedInput   = '';
  let cachedPattern = '';
  let cachedFlags   = '';
  let cachedSpans: MatchSpan[] = [];

  const LINE_H = 13 * 1.5; // 13px font × 1.5 line-height

  function repaintHighlights(): void {
    highlightLayer.innerHTML = buildViewportSpans(
      cachedInput,
      cachedSpans,
      rawInput.scrollTop,
      rawInput.clientHeight,
      LINE_H
    );
    highlightLayer.scrollTop  = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;
  }

  const repaintThrottled = rafThrottle(repaintHighlights);

  // ── Scroll sync ───────────────────────────────────────────────────────────
  rawInput.addEventListener('scroll', () => {
    highlightLayer.scrollTop  = rawInput.scrollTop;
    highlightLayer.scrollLeft = rawInput.scrollLeft;
    repaintThrottled();
  });

  // ── Input → dispatch (debounced 300ms) ────────────────────────────────────
  const handleInputChange = debounce((value: string) => {
    dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: value } });
  }, 300);

  rawInput.addEventListener('input', () => {
    handleInputChange(rawInput.textContent ?? '');
  });

  // Strip rich HTML on paste
  rawInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    // Insert at cursor position; execCommand is deprecated but still widely supported
    // for this use case. We dispatch INPUT_CHANGE explicitly because execCommand
    // does not reliably fire the 'input' event in modern browsers.
    document.execCommand('insertText', false, text);
    dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: rawInput.textContent ?? '' } });
  });

  // ── File upload ───────────────────────────────────────────────────────────
  fileUpload?.addEventListener('change', () => {
    const file = fileUpload.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string ?? '';
      loadText(rawInput, text);
      // Reset the input so the same file can be re-loaded
      fileUpload.value = '';
    };
    reader.readAsText(file);
  });

  // ── Clear button ──────────────────────────────────────────────────────────
  btnClear?.addEventListener('click', () => {
    loadText(rawInput, '');
  });

  // ── State change → re-run engine → update highlights ─────────────────────
  subscribe((state) => {
    const input    = state.rawInput;
    const pattern  = state.pattern;
    const flagsKey = `${pattern.flags.caseInsensitive}|${pattern.flags.multiline}|${pattern.flags.dotAll}`;

    // No pattern — clear everything
    if (!pattern.raw) {
      const changed = cachedInput !== input || cachedPattern !== '' || cachedSpans.length > 0;
      cachedInput = input; cachedPattern = ''; cachedFlags = flagsKey; cachedSpans = [];
      if (changed) repaintHighlights();
      setPatternError(null);
      if (noMatches) noMatches.textContent = '';
      if (truncWarning) truncWarning.hidden = true;
      if (matchCount) matchCount.textContent = '';
      if (timingReadout) timingReadout.textContent = '';
      return;
    }

    // Cache hit — same input + pattern + flags → skip engine + repaint
    if (input === cachedInput && pattern.raw === cachedPattern && flagsKey === cachedFlags) {
      return;
    }

    const result = resolveMatches(pattern, input);

    if (isPatternError(result)) {
      cachedInput = input; cachedPattern = pattern.raw; cachedFlags = flagsKey; cachedSpans = [];
      repaintHighlights();
      setPatternError(result.message);
      if (noMatches) noMatches.textContent = '';
      if (truncWarning) truncWarning.hidden = true;
      if (matchCount) matchCount.textContent = '';
      if (timingReadout) timingReadout.textContent = '';
      return;
    }

    setPatternError(null);
    cachedInput   = input;
    cachedPattern = pattern.raw;
    cachedFlags   = flagsKey;
    cachedSpans   = result.spans;

    repaintHighlights();

    if (noMatches) {
      noMatches.textContent = (input && result.spans.length === 0) ? 'No matches found' : '';
    }

    if (matchCount) {
      const n = result.totalMatchCount;
      matchCount.textContent = n > 0 ? `${n.toLocaleString()} match${n === 1 ? '' : 'es'}` : '';
    }

    if (timingReadout) {
      timingReadout.textContent = result.durationMs >= 1 ? `${result.durationMs.toFixed(1)} ms` : '';
    }

    if (truncWarning) {
      if (result.truncated) {
        truncWarning.textContent = `⚠ Showing first 2,000 of ${result.totalMatchCount.toLocaleString()} matches — refine your pattern to see more.`;
        truncWarning.hidden = false;
      } else {
        truncWarning.hidden = true;
      }
    }
  });
}
