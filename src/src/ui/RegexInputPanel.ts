import { dispatch, subscribe } from '../state.js';
import type { AppState } from '../state.js';

function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number): (...args: T) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function initRegexInputPanel(): void {
  const patternInput = document.getElementById('pattern-input') as HTMLInputElement;
  const patternError = document.getElementById('pattern-error') as HTMLDivElement;
  const flagBtns = document.querySelectorAll<HTMLButtonElement>('.flag-btn');

  if (!patternInput || !patternError) return;

  // Debounced pattern change
  const handlePatternInput = debounce((value: string) => {
    dispatch({ type: 'PATTERN_CHANGE', payload: { raw: value } });
  }, 150);

  patternInput.addEventListener('input', () => {
    handlePatternInput(patternInput.value);
  });

  // Flag toggle buttons
  flagBtns.forEach(btn => {
    const flag = btn.dataset['flag'] as 'caseInsensitive' | 'multiline' | 'dotAll' | undefined;
    if (!flag) return;

    const flagMap: Record<string, 'caseInsensitive' | 'multiline' | 'dotAll'> = {
      i: 'caseInsensitive',
      m: 'multiline',
      s: 'dotAll',
    };
    const stateFlag = flagMap[flag];
    if (!stateFlag) return;

    btn.addEventListener('click', () => {
      dispatch({ type: 'FLAGS_TOGGLE', payload: { flag: stateFlag } });
    });
  });

  // Subscribe to state to show pattern error and update flag button states
  subscribe((state: AppState) => {
    // Update flag button active states
    flagBtns.forEach(btn => {
      const flagKey = btn.dataset['flag'];
      const flagMap: Record<string, keyof typeof state.pattern.flags> = {
        i: 'caseInsensitive',
        m: 'multiline',
        s: 'dotAll',
      };
      if (!flagKey) return;
      const stateKey = flagMap[flagKey];
      const isActive = state.pattern.flags[stateKey];
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    // Show/clear pattern error (set by DataPane after resolveMatches)
    if (state.patternErrorMessage) {
      patternInput.classList.add('error');
      patternError.textContent = `⚠ ${state.patternErrorMessage}`;
    } else {
      patternInput.classList.remove('error');
      patternError.textContent = '';
    }
  });
}
