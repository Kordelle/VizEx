import { dispatch, subscribe, setRuleResults } from '../state.js';
import { evaluateRule } from '../engine/evaluateRule.js';
import type { DQRule } from '../types.js';

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function renderBadge(status: 'pass' | 'fail' | 'error'): string {
  const labels: Record<string, string> = { pass: 'Pass', fail: 'Fail', error: 'Error' };
  return `<span class="badge badge-${status}" aria-label="${labels[status]}">${labels[status]}</span>`;
}

function conditionLabel(rule: DQRule): string {
  if (rule.condition === 'must-match') return 'must match';
  if (rule.condition === 'must-not-match') return 'must not match';
  return `count = ${rule.expectedCount ?? 0}`;
}

export function initDQRulesPanel(): void {
  const rulesList           = document.getElementById('dq-rules-list')       as HTMLDivElement;
  const ruleCount           = document.getElementById('rule-count')          as HTMLSpanElement;
  const addForm             = document.getElementById('add-rule-form')        as HTMLFormElement;
  const ruleNameInput       = document.getElementById('rule-name')            as HTMLInputElement;
  const rulePatternInput    = document.getElementById('rule-pattern')         as HTMLInputElement;
  const ruleConditionSelect = document.getElementById('rule-condition')       as HTMLSelectElement;
  const ruleExpectedCount   = document.getElementById('rule-expected-count')  as HTMLInputElement;

  // Show/hide expectedCount input based on condition
  ruleConditionSelect?.addEventListener('change', () => {
    ruleExpectedCount.style.display = ruleConditionSelect.value === 'match-count-equals' ? 'block' : 'none';
  });

  // Add rule form submit
  addForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = ruleNameInput.value.trim();
    const pattern = rulePatternInput.value;
    const condition = ruleConditionSelect.value as DQRule['condition'];
    if (!name) return;

    const rule: DQRule = {
      id: generateId(),
      name,
      pattern,
      condition,
      expectedCount: condition === 'match-count-equals' ? parseInt(ruleExpectedCount.value, 10) || 0 : undefined,
    };
    dispatch({ type: 'RULE_ADD', payload: { rule } });
    addForm.reset();
    ruleExpectedCount.style.display = 'none';
  });

  // Subscribe to state for re-rendering
  subscribe((state) => {
    // Evaluate all rules
    const results = state.rules.map(r => evaluateRule(r, state.rawInput));
    setRuleResults(results);

    // Render rule list
    if (rulesList) {
      if (state.rules.length === 0) {
        rulesList.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:8px">No rules defined yet.</div>';
      } else {
        rulesList.innerHTML = state.rules.map((rule, idx) => {
          const result = results[idx];
          const explanation = result.explanation ? ` title="${result.explanation.replace(/"/g, '&quot;')}"` : '';
          return `
            <div class="dq-rule-item" role="listitem" data-rule-id="${rule.id}">
              <div class="dq-rule-row">
                <span class="dq-rule-name" title="${rule.name}">${rule.name}</span>
                <span${explanation}>${renderBadge(result.status)}</span>
              </div>
              <div class="dq-rule-condition">${rule.condition === 'must-match' ? '/' : ''}${rule.pattern}${rule.condition === 'must-match' ? '/' : ''} — ${conditionLabel(rule)}</div>
              <div class="dq-rule-actions">
                <button class="btn-sm btn-delete danger" data-rule-id="${rule.id}" aria-label="Delete rule ${rule.name}">Delete</button>
              </div>
            </div>`;
        }).join('');

        // Wire delete buttons
        rulesList.querySelectorAll<HTMLButtonElement>('.btn-delete').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset['ruleId'];
            if (id) dispatch({ type: 'RULE_DELETE', payload: { ruleId: id } });
          });
        });
      }

      if (ruleCount) ruleCount.textContent = state.rules.length ? `(${state.rules.length})` : '';
    }
  });
}
