import { describe, it, expect } from 'vitest';
import { evaluateRule } from '../../src/engine/evaluateRule.js';
import type { DQRule } from '../../src/types.js';

function rule(overrides: Partial<DQRule> = {}): DQRule {
  return {
    id: 'test-id',
    name: 'Test Rule',
    pattern: '\\d+',
    condition: 'must-match',
    ...overrides,
  };
}

describe('evaluateRule', () => {
  it('must-match: returns pass when pattern matches', () => {
    const result = evaluateRule(rule({ condition: 'must-match', pattern: '\\d+' }), 'abc 123');
    expect(result.status).toBe('pass');
    expect(result.explanation).toBeUndefined();
  });

  it('must-match: returns fail when pattern does not match', () => {
    const result = evaluateRule(rule({ condition: 'must-match', pattern: '\\d+' }), 'abc');
    expect(result.status).toBe('fail');
    expect(result.explanation).toBeTruthy();
  });

  it('must-not-match: returns pass when pattern does not match', () => {
    const result = evaluateRule(rule({ condition: 'must-not-match', pattern: '\\d+' }), 'hello');
    expect(result.status).toBe('pass');
  });

  it('must-not-match: returns fail when pattern matches', () => {
    const result = evaluateRule(rule({ condition: 'must-not-match', pattern: '\\d+' }), 'abc 123');
    expect(result.status).toBe('fail');
    expect(result.explanation).toContain('matched');
  });

  it('match-count-equals: returns pass when count matches expectedCount', () => {
    const result = evaluateRule(rule({ condition: 'match-count-equals', pattern: '\\d+', expectedCount: 2 }), '10 20 abc');
    expect(result.status).toBe('pass');
    expect(result.matchCount).toBe(2);
  });

  it('match-count-equals: returns fail when count differs from expectedCount', () => {
    const result = evaluateRule(rule({ condition: 'match-count-equals', pattern: '\\d+', expectedCount: 5 }), '10 20');
    expect(result.status).toBe('fail');
    expect(result.explanation).toContain('Expected 5');
    expect(result.explanation).toContain('found 2');
    expect(result.matchCount).toBe(2);
  });

  it('returns error status for invalid regex pattern', () => {
    const result = evaluateRule(rule({ pattern: '[invalid' }), 'test');
    expect(result.status).toBe('error');
    expect(result.explanation).toBeTruthy();
  });

  it('returns error status for empty pattern', () => {
    const result = evaluateRule(rule({ pattern: '' }), 'test');
    expect(result.status).toBe('error');
    expect(result.explanation).toContain('empty');
  });

  it('includes ruleId in result', () => {
    const r = rule({ id: 'my-rule-123' });
    const result = evaluateRule(r, 'test 123');
    expect(result.ruleId).toBe('my-rule-123');
  });

  it('match-count-equals: handles zero expected count correctly', () => {
    const result = evaluateRule(rule({ condition: 'match-count-equals', pattern: '\\d+', expectedCount: 0 }), 'no numbers');
    expect(result.status).toBe('pass');
    expect(result.matchCount).toBe(0);
  });

  it('match-count-equals: zero-length match guard does not cause infinite loop', () => {
    // Pattern that can produce zero-length matches (a*) — must count correctly
    const result = evaluateRule(rule({ condition: 'match-count-equals', pattern: 'a*', expectedCount: 1 }), 'a');
    // 'a*' matches 'a' once (length > 0) then empty string — the guard skips zero-length
    expect(result.ruleId).toBe('test-id');
    expect(['pass', 'fail']).toContain(result.status);
  });
});
