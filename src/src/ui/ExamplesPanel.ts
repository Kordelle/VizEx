import { dispatch } from '../state.js';
import { EXAMPLE_CATEGORIES } from '../examples/examples.js';

const TOTAL = EXAMPLE_CATEGORIES.reduce((n, c) => n + c.examples.length, 0);

export function initExamplesPanel(): void {
  const container = document.getElementById('examples-panel');
  if (!container) return;

  container.innerHTML = `
    <details class="examples-details" open>
      <summary class="examples-summary">
        <span>📖 Example Patterns</span>
        <span class="examples-count examples-count-badge">${TOTAL} patterns</span>
      </summary>
      <div class="examples-search-wrap">
        <input
          type="search"
          id="examples-search"
          class="examples-search"
          placeholder="Filter patterns…"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <div class="examples-body" id="examples-body">
        ${renderCategories('')}
      </div>
    </details>`;

  wireButtons(container);

  const searchInput = container.querySelector<HTMLInputElement>('#examples-search');
  const body = container.querySelector<HTMLDivElement>('#examples-body');
  const badge = container.querySelector<HTMLSpanElement>('.examples-count-badge');

  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (body) body.innerHTML = renderCategories(q);
    wireButtons(container);
    if (badge) {
      const visible = container.querySelectorAll('.example-entry').length;
      badge.textContent = q ? `${visible} / ${TOTAL} patterns` : `${TOTAL} patterns`;
    }
  });
}

function renderCategories(q: string): string {
  return EXAMPLE_CATEGORIES.map(cat => {
    const entries = cat.examples.filter(ex =>
      !q ||
      ex.label.toLowerCase().includes(q) ||
      ex.description.toLowerCase().includes(q) ||
      ex.pattern.toLowerCase().includes(q)
    );
    if (!entries.length) return '';
    return `
      <div class="example-category">
        <div class="example-category-label">${escHtml(cat.label)}</div>
        ${entries.map(ex => `
          <div class="example-entry" data-id="${ex.id}">
            <div class="example-label">${escHtml(ex.label)}</div>
            <div class="example-desc">${escHtml(ex.description)}</div>
            <div class="example-actions">
              <button class="btn-sm btn-use-pattern" data-pattern="${escAttr(ex.pattern)}" title="Load pattern: ${escAttr(ex.pattern)}">↗ Pattern</button>
              <button class="btn-sm btn-use-sample" data-sample="${escAttr(ex.sampleText)}" title="Load sample text">↗ Sample</button>
            </div>
          </div>`).join('')}
      </div>`;
  }).join('');
}

function wireButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.btn-use-pattern').forEach(btn => {
    btn.addEventListener('click', () => {
      const pattern = btn.dataset['pattern'] ?? '';
      dispatch({ type: 'PATTERN_CHANGE', payload: { raw: pattern } });
      const input = document.getElementById('pattern-input') as HTMLInputElement | null;
      if (input) { input.value = pattern; input.dispatchEvent(new Event('input')); }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-use-sample').forEach(btn => {
    btn.addEventListener('click', () => {
      const sample = btn.dataset['sample'] ?? '';
      dispatch({ type: 'INPUT_CHANGE', payload: { rawInput: sample } });
      const inputDiv = document.getElementById('raw-input') as HTMLDivElement | null;
      if (inputDiv) { inputDiv.textContent = sample; inputDiv.dispatchEvent(new Event('input')); }
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
