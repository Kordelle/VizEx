import type { DQRule, RuleResult } from '../types.js';

export function evaluateRule(rule: DQRule, input: string): RuleResult {
  if (!rule.pattern) {
    return { ruleId: rule.id, status: 'error', explanation: 'Rule pattern is empty' };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(rule.pattern, 'g');
  } catch (e) {
    return { ruleId: rule.id, status: 'error', explanation: (e as Error).message };
  }

  switch (rule.condition) {
    case 'must-match': {
      const matches = regex.test(input);
      return matches
        ? { ruleId: rule.id, status: 'pass' }
        : { ruleId: rule.id, status: 'fail', explanation: 'Pattern did not match any substring' };
    }

    case 'must-not-match': {
      const matches = regex.test(input);
      return !matches
        ? { ruleId: rule.id, status: 'pass' }
        : { ruleId: rule.id, status: 'fail', explanation: 'Pattern matched when it must not' };
    }

    case 'match-count-equals': {
      // Count non-overlapping matches via exec loop
      let count = 0;
      let m: RegExpExecArray | null;
      regex.lastIndex = 0;
      while ((m = regex.exec(input)) !== null) {
        if (m[0].length === 0) { regex.lastIndex++; continue; }
        count++;
      }
      const expected = rule.expectedCount ?? 0;
      return count === expected
        ? { ruleId: rule.id, status: 'pass', matchCount: count }
        : {
            ruleId: rule.id,
            status: 'fail',
            explanation: `Expected ${expected} match(es), found ${count}`,
            matchCount: count,
          };
    }
  }
}
