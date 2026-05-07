import './styles/main.css';
import './styles/palette.css';
import { subscribe } from './state.js';
import { initRegexInputPanel } from './ui/RegexInputPanel.js';
import { initDataPane } from './ui/DataPane.js';
import { initDQRulesPanel } from './ui/DQRulesPanel.js';
import { initExamplesPanel } from './ui/ExamplesPanel.js';
import { initRegexQuickRef } from './ui/RegexQuickRef.js';
import { initInputStatsPanel } from './ui/InputStatsPanel.js';

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

// ─── Init UI Panels ───────────────────────────────────────────────────────────
initRegexInputPanel();
initDataPane();
initDQRulesPanel();
initExamplesPanel();
initRegexQuickRef();
initInputStatsPanel();

// ─── Global state subscription (panels subscribe internally) ──────────────────
// Exported for panels to call — each panel also subscribes directly in its init.
export { subscribe };
