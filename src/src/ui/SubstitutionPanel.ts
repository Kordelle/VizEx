import { subscribe } from '../state.js';
import type { AppState } from '../state.js';

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOutput(state: AppState, replacement: string): string {
  if (!state.pattern.raw) {
    return '<span class="sub-placeholder">Enter a pattern to see substitution output.</span>';
  }
  if (state.patternErrorMessage) {
    return '<span class="sub-error">Pattern error — no substitution.</span>';
  }
  if (!state.rawInput) {
    return '<span class="sub-placeholder">Paste input data to see substitution output.</span>';
  }

  let flags = 'g';
  if (state.pattern.flags.caseInsensitive) flags += 'i';
  if (state.pattern.flags.multiline) flags += 'm';
  if (state.pattern.flags.dotAll) flags += 's';
  if (state.pattern.flags.unicode) flags += 'u';

  let result: string;
  try {
    const re = new RegExp(state.pattern.raw, flags);
    result = state.rawInput.replace(re, replacement);
  } catch {
    return '<span class="sub-error">Invalid pattern or replacement.</span>';
  }

  return `<pre class="sub-result">${escHtml(result)}</pre>`;
}

export function initSubstitutionPanel(): void {
  const subInput  = document.getElementById('sub-input')  as HTMLInputElement | null;
  const subOutput = document.getElementById('sub-output') as HTMLDivElement | null;
  const btnCopy   = document.getElementById('btn-sub-copy') as HTMLButtonElement | null;

  if (!subInput || !subOutput) return;

  let currentState: AppState | null = null;
  let currentReplacement = '';

  function render(): void {
    if (!currentState) return;
    subOutput!.innerHTML = buildOutput(currentState, currentReplacement);
  }

  const handleReplacementInput = debounce((value: string) => {
    currentReplacement = value;
    render();
  }, 150);

  subInput.addEventListener('input', () => {
    handleReplacementInput(subInput.value);
  });

  btnCopy?.addEventListener('click', () => {
    if (!currentState?.rawInput) return;
    let flags = 'g';
    if (currentState.pattern.flags.caseInsensitive) flags += 'i';
    if (currentState.pattern.flags.multiline) flags += 'm';
    if (currentState.pattern.flags.dotAll) flags += 's';
    if (currentState.pattern.flags.unicode) flags += 'u';
    let text = currentState.rawInput;
    try {
      const re = new RegExp(currentState.pattern.raw, flags);
      text = currentState.rawInput.replace(re, currentReplacement);
    } catch { /* leave as raw */ }
    navigator.clipboard.writeText(text).then(() => {
      const prev = btnCopy.textContent ?? '';
      btnCopy.textContent = '✓ Copied!';
      setTimeout(() => { btnCopy.textContent = prev; }, 1500);
    });
  });

  subscribe((state: AppState) => {
    currentState = state;
    render();
  });
}
