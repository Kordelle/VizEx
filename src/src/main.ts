import './styles/main.css';
import './styles/palette.css';
import { inject } from '@vercel/analytics';
import { subscribe } from './state.js';
import { initRegexInputPanel } from './ui/RegexInputPanel.js';
import { initDataPane } from './ui/DataPane.js';
import { initDQRulesPanel } from './ui/DQRulesPanel.js';
import { initExamplesPanel } from './ui/ExamplesPanel.js';
import { initRegexQuickRef } from './ui/RegexQuickRef.js';
import { initInputStatsPanel } from './ui/InputStatsPanel.js';
import { initMatchDetailsPanel } from './ui/MatchDetailsPanel.js';
import { initSubstitutionPanel } from './ui/SubstitutionPanel.js';

// ─── Vercel Analytics ─────────────────────────────────────────────────────────
inject();

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
let isDark = false;
themeToggle?.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.dataset['theme'] = isDark ? 'dark' : '';
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
});

// ─── Export Button ────────────────────────────────────────────────────────────
const btnExport = document.getElementById('btn-export') as HTMLButtonElement | null;
btnExport?.addEventListener('click', () => {
  const rawInput = document.getElementById('raw-input') as HTMLDivElement | null;
  const text = rawInput?.textContent ?? '';
  if (!text.trim()) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vizex-export-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Clear stale permalink hashes from prior versions ────────────────────────
if (window.location.hash) {
  history.replaceState(null, '', window.location.pathname);
}

// ─── Cursor Position Readout ─────────────────────────────────────────────────
const cursorPos = document.getElementById('cursor-pos') as HTMLSpanElement | null;
const rawInputEl = document.getElementById('raw-input') as HTMLDivElement | null;

function updateCursorPos(): void {
  if (!cursorPos || !rawInputEl) return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0).cloneRange();
  range.setStart(rawInputEl, 0);
  const text = range.toString();
  const lines = text.split('\n');
  const ln = lines.length;
  const col = (lines[lines.length - 1]?.length ?? 0) + 1;
  cursorPos.textContent = `Ln ${ln}, Col ${col}`;
}

rawInputEl?.addEventListener('click', updateCursorPos);
rawInputEl?.addEventListener('keyup', updateCursorPos);
document.addEventListener('selectionchange', () => {
  if (document.activeElement === rawInputEl) updateCursorPos();
});

// ─── Match Navigation ─────────────────────────────────────────────────────────
const btnPrev = document.getElementById('btn-match-prev') as HTMLButtonElement | null;
const btnNext = document.getElementById('btn-match-next') as HTMLButtonElement | null;
let activeMatchIndex = -1;

function navigateToMatch(index: number): void {
  if (!rawInputEl) return;
  // Get current match spans from state
  const spans = (window as unknown as { __vizexMatchSpans?: { start: number; end: number }[] }).__vizexMatchSpans;
  if (!spans || spans.length === 0) return;

  const clamped = Math.max(0, Math.min(index, spans.length - 1));
  activeMatchIndex = clamped;

  const span = spans[clamped];

  // Place caret at match start using TreeWalker to find text node offset
  const walker = document.createTreeWalker(rawInputEl, NodeFilter.SHOW_TEXT);
  let remaining = span.start;
  let node: Text | null = null;
  let nodeOffset = 0;

  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (remaining <= n.length) {
      node = n;
      nodeOffset = remaining;
      break;
    }
    remaining -= n.length;
  }

  if (node) {
    const range = document.createRange();
    range.setStart(node, nodeOffset);
    range.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    rawInputEl.focus();
    updateCursorPos();
  }

  // Update button states
  if (btnPrev) btnPrev.disabled = activeMatchIndex <= 0;
  if (btnNext) btnNext.disabled = !spans || activeMatchIndex >= spans.length - 1;
}

btnPrev?.addEventListener('click', () => navigateToMatch(activeMatchIndex - 1));
btnNext?.addEventListener('click', () => navigateToMatch(activeMatchIndex + 1));

// Keep __vizexMatchSpans in sync with state
subscribe((state) => {
  const spans = state.matchResult?.spans.filter(s => s.groupIndex === 0) ?? [];
  (window as unknown as { __vizexMatchSpans?: unknown[] }).__vizexMatchSpans = spans;
  activeMatchIndex = spans.length > 0 ? Math.min(activeMatchIndex, spans.length - 1) : -1;
  if (btnPrev) btnPrev.disabled = spans.length === 0 || activeMatchIndex <= 0;
  if (btnNext) btnNext.disabled = spans.length === 0;
});

// ─── Init UI Panels ───────────────────────────────────────────────────────────
initRegexInputPanel();
initDataPane();
initDQRulesPanel();
initExamplesPanel();
initRegexQuickRef();
initInputStatsPanel();
initMatchDetailsPanel();
initSubstitutionPanel();

// ─── Global state subscription (panels subscribe internally) ──────────────────
export { subscribe };
