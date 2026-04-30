// ─── Regex Pattern & Flags ────────────────────────────────────────────────────

export interface RegexFlags {
  caseInsensitive: boolean; // i flag
  multiline: boolean;       // m flag — ^ and $ match per line
  dotAll: boolean;          // s flag — . matches \n
}

export interface RegexPattern {
  raw: string;       // Raw pattern string as typed by the user
  flags: RegexFlags; // Active flag toggles
}

// ─── Match Results ────────────────────────────────────────────────────────────

export interface OverlapInfo {
  start: number;
  end: number;
  text: string;
}

export interface MatchSpan {
  start: number;                          // Character index (inclusive)
  end: number;                            // Character index (exclusive)
  groupIndex: number;                     // 0 = full match, 1–N = capture group
  text: string;                           // Matched substring
  overlappingAlternatives: OverlapInfo[];
}

export interface MatchResult {
  spans: MatchSpan[];       // Non-overlapping highlighted spans, in index order
  totalMatchCount: number;  // Count of all matches (including skipped overlaps)
  hasOverlaps: boolean;     // True if any overlapping matches were resolved
  durationMs: number;       // Evaluation time in milliseconds
  overSoftCap: boolean;     // True if input exceeded 50k chars
}

// ─── Pattern Error ────────────────────────────────────────────────────────────

export interface PatternError {
  message: string; // Human-readable error from browser's RegExp engine
  raw: string;     // The pattern string that caused the error
}

export function isPatternError(result: MatchResult | PatternError): result is PatternError {
  return 'message' in result && 'raw' in result;
}

// ─── DQ Rules ─────────────────────────────────────────────────────────────────

export type DQRuleCondition =
  | 'must-match'
  | 'must-not-match'
  | 'match-count-equals';

export interface DQRule {
  id: string;                   // UUID, generated on creation
  name: string;                 // User-provided label (non-empty, max 100 chars)
  pattern: string;              // Regex pattern string
  condition: DQRuleCondition;   // Match condition type
  expectedCount?: number;       // Required when condition === 'match-count-equals'
}

export interface RuleResult {
  ruleId: string;
  status: 'pass' | 'fail' | 'error';
  explanation?: string;  // Required on 'fail' and 'error'; absent on 'pass'
  matchCount?: number;   // Actual match count (for match-count-equals condition)
}

// ─── Rule Sets ────────────────────────────────────────────────────────────────

export interface RuleSet {
  id: string;        // UUID, generated on creation
  name: string;      // User-provided name (non-empty, max 100 chars)
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  rules: DQRule[];   // Ordered list; order preserved on load
}

// ─── App State Actions ────────────────────────────────────────────────────────

export type AppAction =
  | { type: 'PATTERN_CHANGE'; payload: { raw: string } }
  | { type: 'FLAGS_TOGGLE'; payload: { flag: keyof RegexFlags } }
  | { type: 'INPUT_CHANGE'; payload: { rawInput: string } }
  | { type: 'RULE_ADD'; payload: { rule: DQRule } }
  | { type: 'RULE_EDIT'; payload: { rule: DQRule } }
  | { type: 'RULE_DELETE'; payload: { ruleId: string } }
  | { type: 'RULESET_SAVE'; payload: { name: string } }
  | { type: 'RULESET_LOAD'; payload: { ruleSetId: string } }
  | { type: 'RULESET_DELETE'; payload: { ruleSetId: string } };
