import type { AppAction, DQRule, MatchResult, RegexFlags, RegexPattern, RuleResult, RuleSet } from './types.js';

// ─── App State Shape ──────────────────────────────────────────────────────────

export interface AppState {
  pattern: RegexPattern;
  rawInput: string;
  rules: DQRule[];
  ruleResults: RuleResult[];
  savedRuleSets: RuleSet[];
  storageError: string | null;
  patternErrorMessage: string | null;
  matchResult: MatchResult | null;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialFlags: RegexFlags = {
  caseInsensitive: false,
  multiline: false,
  dotAll: false,
  unicode: false,
};

const initialState: AppState = {
  pattern: { raw: '', flags: { ...initialFlags } },
  rawInput: '',
  rules: [],
  ruleResults: [],
  savedRuleSets: [],
  storageError: null,
  patternErrorMessage: null,
  matchResult: null,
};

// ─── State Manager ────────────────────────────────────────────────────────────

type Listener = (state: AppState) => void;

let state: AppState = { ...initialState, pattern: { ...initialState.pattern, flags: { ...initialFlags } } };
const listeners = new Set<Listener>();

export function getState(): Readonly<AppState> {
  return state;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener(state);
}

function setState(partial: Partial<AppState>): void {
  state = { ...state, ...partial };
  notify();
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export function dispatch(action: AppAction): void {
  switch (action.type) {
    case 'PATTERN_CHANGE':
      setState({ pattern: { ...state.pattern, raw: action.payload.raw } });
      break;

    case 'FLAGS_TOGGLE': {
      const flag = action.payload.flag;
      setState({
        pattern: {
          ...state.pattern,
          flags: { ...state.pattern.flags, [flag]: !state.pattern.flags[flag] },
        },
      });
      break;
    }

    case 'INPUT_CHANGE':
      setState({ rawInput: action.payload.rawInput });
      break;

    case 'RULE_ADD':
      setState({ rules: [...state.rules, action.payload.rule] });
      break;

    case 'RULE_EDIT':
      setState({ rules: state.rules.map(r => r.id === action.payload.rule.id ? action.payload.rule : r) });
      break;

    case 'RULE_DELETE':
      setState({ rules: state.rules.filter(r => r.id !== action.payload.ruleId) });
      break;

    case 'RULESET_SAVE':
      // Handled by DQRulesPanel + RuleSetStorage — state update comes via RULESET_LOAD
      break;

    case 'RULESET_LOAD':
      // Handled by DQRulesPanel which calls setState directly after loading
      break;

    case 'RULESET_DELETE':
      // Handled by DQRulesPanel + RuleSetStorage
      break;
  }
}

/** Direct state setters for use by UI modules after async/storage operations */
export function setRuleResults(results: RuleResult[]): void {
  setState({ ruleResults: results });
}

export function setSavedRuleSets(sets: RuleSet[]): void {
  setState({ savedRuleSets: sets });
}

export function setRulesFromSet(rules: DQRule[]): void {
  setState({ rules: [...rules] });
}

export function setStorageError(error: string | null): void {
  setState({ storageError: error });
}

export function setPatternError(message: string | null): void {
  if (state.patternErrorMessage === message) return;
  setState({ patternErrorMessage: message });
}

export function setMatchResult(result: MatchResult | null): void {
  setState({ matchResult: result });
}
