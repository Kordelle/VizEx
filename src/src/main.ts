import './styles/main.css';
import './styles/palette.css';
import { subscribe } from './state.js';
import { initRegexInputPanel } from './ui/RegexInputPanel.js';
import { initDataPane } from './ui/DataPane.js';
import { initDQRulesPanel } from './ui/DQRulesPanel.js';

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
let isDark = false;
themeToggle?.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.dataset['theme'] = isDark ? 'dark' : '';
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
});

// ─── Init UI Panels ───────────────────────────────────────────────────────────
initRegexInputPanel();
initDataPane();
initDQRulesPanel();

// ─── Global state subscription (panels subscribe internally) ──────────────────
// Exported for panels to call — each panel also subscribes directly in its init.
export { subscribe };
