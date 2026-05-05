import { dispatch, subscribe, getState, setRuleResults, setSavedRuleSets, setRulesFromSet, setStorageError } from '../state.js';
import { evaluateRule } from '../engine/evaluateRule.js';
import { RuleSetStorage, StorageError } from '../storage/ruleSetStorage.js';
import type { DQRule, RuleSet } from '../types.js';

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
  const rulesList = document.getElementById('dq-rules-list') as HTMLDivElement;
  const ruleCount = document.getElementById('rule-count') as HTMLSpanElement;
  const addForm = document.getElementById('add-rule-form') as HTMLFormElement;
  const ruleNameInput = document.getElementById('rule-name') as HTMLInputElement;
  const rulePatternInput = document.getElementById('rule-pattern') as HTMLInputElement;
  const ruleConditionSelect = document.getElementById('rule-condition') as HTMLSelectElement;
  const ruleExpectedCount = document.getElementById('rule-expected-count') as HTMLInputElement;
  const savedSetsList = document.getElementById('saved-sets-list') as HTMLDivElement;
  const rulesetNameInput = document.getElementById('ruleset-name') as HTMLInputElement;
  const btnSaveRuleset = document.getElementById('btn-save-ruleset') as HTMLButtonElement;
  const storageErrorDiv = document.getElementById('storage-error') as HTMLDivElement;

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

  // Save rule set
  btnSaveRuleset?.addEventListener('click', () => {
    const name = rulesetNameInput.value.trim();
    if (!name) return;
    const state = getState();
    const set: RuleSet = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [...state.rules],
    };
    try {
      const updated = RuleSetStorage.upsert(set);
      setSavedRuleSets(updated);
      setStorageError(null);
      rulesetNameInput.value = '';
    } catch (e) {
      if (e instanceof StorageError) {
        setStorageError(e.message);
      }
    }
  });

  // Load initial saved sets from storage
  try {
    setSavedRuleSets(RuleSetStorage.load());
  } catch {
    setSavedRuleSets([]);
  }

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

    // Render saved sets
    if (savedSetsList) {
      if (state.savedRuleSets.length === 0) {
        savedSetsList.innerHTML = '<div style="font-size:11px;color:var(--text-muted)">No saved rule sets.</div>';
      } else {
        savedSetsList.innerHTML = state.savedRuleSets.map(set => `
          <div class="saved-set-item" role="listitem">
            <span class="saved-set-name" title="${set.name}">${set.name}</span>
            <span class="saved-set-count">${set.rules.length} rule${set.rules.length !== 1 ? 's' : ''}</span>
            <button class="btn-sm btn-load-set" data-set-id="${set.id}" aria-label="Load ${set.name}">Load</button>
            <button class="btn-sm btn-delete-set danger" data-set-id="${set.id}" aria-label="Delete ${set.name}">✕</button>
          </div>`).join('');

        // Wire load buttons
        savedSetsList.querySelectorAll<HTMLButtonElement>('.btn-load-set').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset['setId'];
            if (!id) return;
            const set = state.savedRuleSets.find(s => s.id === id);
            if (!set) return;
            const hasRules = getState().rules.length > 0;
            if (hasRules && !confirm(`Replace current ${getState().rules.length} rule(s) with "${set.name}"?`)) return;
            setRulesFromSet(set.rules);
          });
        });

        // Wire delete set buttons
        savedSetsList.querySelectorAll<HTMLButtonElement>('.btn-delete-set').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset['setId'];
            if (!id) return;
            try {
              const updated = RuleSetStorage.remove(id);
              setSavedRuleSets(updated);
              setStorageError(null);
            } catch (e) {
              if (e instanceof StorageError) setStorageError(e.message);
            }
          });
        });
      }
    }

    // Show storage error
    if (storageErrorDiv) {
      storageErrorDiv.textContent = state.storageError ?? '';
    }
  });
}
