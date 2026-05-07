import './styles/main.css';
import './styles/palette.css';
import { subscribe, dispatch } from './state.js';
import { initRegexInputPanel } from './ui/RegexInputPanel.js';
import { initDataPane } from './ui/DataPane.js';
import { initDQRulesPanel } from './ui/DQRulesPanel.js';
import { initExamplesPanel } from './ui/ExamplesPanel.js';
import { initRegexQuickRef } from './ui/RegexQuickRef.js';
import { initInputStatsPanel } from './ui/InputStatsPanel.js';
import { initMatchDetailsPanel } from './ui/MatchDetailsPanel.js';

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

// ─── Permalink (URL hash encode/decode) ──────────────────────────────────────
interface PermalinkPayload {
  p: string;   // pattern raw
  i: boolean;  // caseInsensitive
  m: boolean;  // multiline
  s: boolean;  // dotAll
  u: boolean;  // unicode
  d: string;   // raw input data
}

function encodePermalink(payload: PermalinkPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodePermalink(hash: string): PermalinkPayload | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash)))) as PermalinkPayload;
  } catch {
    return null;
  }
}

// On load: restore state from hash if present
const rawHash = window.location.hash.slice(1);
if (rawHash) {
  const payload = decodePermalink(rawHash);
  if (payload) {
    // Defer until after panels init so subscribers are ready
    window.addEventListener('DOMContentLoaded', () => {
      const patternInput = document.getElementById('pattern-input') as HTMLInputElement | null;
      const rawInputDiv = document.getElementById('raw-input') as HTMLDivElement | null;
      if (patternInput) {
        patternInput.value = payload.p;
        dispatch({ type: 'PATTERN_CHANGE', payload: { raw: payload.p } });
      }
      if (payload.i) dispatch({ type: 'FLAGS_TOGGLE', payload: { flag: 'caseInsensitive' } });
      if (payload.m) dispatch({ type: 'FLAGS_TOGGLE', payload: { flag: 'multiline' } });
      if (payload.s) dispatch({ type: 'FLAGS_TOGGLE', payload: { flag: 'dotAll' } });
      if (payload.u) dispatch({ type: 'FLAGS_TOGGLE', payload: { flag: 'unicode' } });
      if (rawInputDiv && payload.d) {
        rawInputDiv.textContent = payload.d;
        dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: payload.d } });
      }
    }, { once: true });
  }
}

// On state change: update URL hash (debounced)
let hashTimer: ReturnType<typeof setTimeout>;
subscribe((state) => {
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    const payload: PermalinkPayload = {
      p: state.pattern.raw,
      i: state.pattern.flags.caseInsensitive,
      m: state.pattern.flags.multiline,
      s: state.pattern.flags.dotAll,
      u: state.pattern.flags.unicode,
      d: state.rawInput,
    };
    const encoded = encodePermalink(payload);
    history.replaceState(null, '', `#${encoded}`);
  }, 500);
});

// Copy link button
const btnCopyLink = document.getElementById('btn-copy-link') as HTMLButtonElement | null;
btnCopyLink?.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const prev = btnCopyLink.textContent ?? '';
    btnCopyLink.textContent = '✓ Copied!';
    setTimeout(() => { btnCopyLink.textContent = prev; }, 1500);
  });
});

// ─── Init UI Panels ───────────────────────────────────────────────────────────
initRegexInputPanel();
initDataPane();
initDQRulesPanel();
initExamplesPanel();
initRegexQuickRef();
initInputStatsPanel();
initMatchDetailsPanel();

// ─── Global state subscription (panels subscribe internally) ──────────────────
export { subscribe };
