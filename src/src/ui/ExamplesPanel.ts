import { dispatch } from '../state.js';
import { EXAMPLE_CATEGORIES } from '../examples/examples.js';

export function initExamplesPanel(): void {
  const container = document.getElementById('examples-panel');
  if (!container) return;

  container.innerHTML = `
    <details class="examples-details" open>
      <summary class="examples-summary">
        <span>📖 Example Patterns</span>
        <span class="examples-count">${EXAMPLE_CATEGORIES.reduce((n, c) => n + c.examples.length, 0)} patterns</span>
      </summary>
      <div class="examples-body">
        ${EXAMPLE_CATEGORIES.map(cat => `
          <div class="example-category">
            <div class="example-category-label">${escHtml(cat.label)}</div>
            ${cat.examples.map(ex => `
              <div class="example-entry" data-id="${ex.id}">
                <div class="example-label">${escHtml(ex.label)}</div>
                <div class="example-desc">${escHtml(ex.description)}</div>
                <div class="example-actions">
                  <button class="btn-sm btn-use-pattern" data-pattern="${escAttr(ex.pattern)}" title="Load pattern: ${escAttr(ex.pattern)}">↗ Pattern</button>
                  <button class="btn-sm btn-use-sample" data-sample="${escAttr(ex.sampleText)}" title="Load sample text">↗ Sample</button>
                </div>
              </div>`).join('')}
          </div>`).join('')}
      </div>
    </details>`;

  // Wire pattern buttons
  container.querySelectorAll<HTMLButtonElement>('.btn-use-pattern').forEach(btn => {
    btn.addEventListener('click', () => {
      const pattern = btn.dataset['pattern'] ?? '';
      dispatch({ type: 'PATTERN_CHANGE', payload: { raw: pattern } });
      // Also update the visible input
      const input = document.getElementById('pattern-input') as HTMLInputElement | null;
      if (input) { input.value = pattern; input.dispatchEvent(new Event('input')); }
    });
  });

  // Wire sample buttons
  container.querySelectorAll<HTMLButtonElement>('.btn-use-sample').forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset['sample'] ?? '';
      dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: sample } });
      // Also update the visible textarea
      const textarea = document.getElementById('raw-input') as HTMLTextAreaElement | null;
      if (textarea) { textarea.value = sample; textarea.dispatchEvent(new Event('input')); }
    });
  });
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
