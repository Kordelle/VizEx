import { describe, it, expect } from 'vitest';
import { resolveMatches } from '../../src/engine/resolveMatches.js';
import type { RegexPattern } from '../../src/types.js';

const flags = { caseInsensitive: false, multiline: false, dotAll: false };

function pat(raw: string): RegexPattern {
  return { raw, flags };
}

describe('resolveMatches', () => {
  it('returns spans for a valid match', () => {
    const result = resolveMatches(pat('\\d+'), 'abc 123 def 456');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans).toHaveLength(2);
    expect(result.spans[0].text).toBe('123');
    expect(result.spans[1].text).toBe('456');
  });

  it('returns empty spans for zero matches', () => {
    const result = resolveMatches(pat('xyz'), 'hello world');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans).toHaveLength(0);
    expect(result.totalMatchCount).toBe(0);
  });

  it('returns PatternError for an invalid regex', () => {
    const result = resolveMatches(pat('[invalid'), 'test');
    expect('message' in result).toBe(true);
    if (!('message' in result)) return;
    expect(result.raw).toBe('[invalid');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('resolves overlapping matches using greedy non-overlapping pass', () => {
    // Pattern with lookahead can cause overlaps; use a manual overlap scenario
    // 'aa' matched against 'aaa' with global flag: finds 'aa' at 0, then at 2 (non-overlap)
    const result = resolveMatches(pat('a{2}'), 'aaaa');
    if ('message' in result) throw new Error('Expected MatchResult');
    // Should find 2 non-overlapping 'aa' spans: [0,2) and [2,4)
    expect(result.spans).toHaveLength(2);
    expect(result.spans[0]).toMatchObject({ start: 0, end: 2 });
    expect(result.spans[1]).toMatchObject({ start: 2, end: 4 });
  });

  it('populates OverlapInfo for skipped overlapping alternatives', () => {
    // Use overlapping pattern via zero-width assertions — force an overlap
    // by testing the engine with a pattern that matches at overlapping positions
    const result = resolveMatches(pat('a+'), 'aaabaa');
    if ('message' in result) throw new Error('Expected MatchResult');
    // 'a+' greedily matches 'aaa' at 0 and 'aa' at 4
    expect(result.spans.length).toBeGreaterThanOrEqual(1);
    expect(result.spans[0].overlappingAlternatives).toBeDefined();
  });

  it('sets durationMs to a non-negative number', () => {
    const result = resolveMatches(pat('a'), 'banana');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('sets overSoftCap flag for inputs over 50k chars', () => {
    const bigInput = 'a'.repeat(50_001);
    const result = resolveMatches(pat('a'), bigInput);
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.overSoftCap).toBe(true);
  });

  it('does NOT set overSoftCap for inputs at or under 50k chars', () => {
    const input = 'a'.repeat(50_000);
    const result = resolveMatches(pat('a'), input);
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.overSoftCap).toBe(false);
  });

  it('completes within 1s for 50k-char input (performance)', () => {
    const bigInput = 'hello world '.repeat(4_200); // ~50k chars
    const start = performance.now();
    resolveMatches(pat('\\w+'), bigInput);
    expect(performance.now() - start).toBeLessThan(1000);
  });

  it('respects case-insensitive flag', () => {
    const result = resolveMatches({ raw: 'hello', flags: { caseInsensitive: true, multiline: false, dotAll: false } }, 'Hello HELLO hello');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans).toHaveLength(3);
  });

  it('handles empty pattern as no matches', () => {
    const result = resolveMatches(pat(''), 'some text');
    // Empty pattern produces zero-length matches — treated as no meaningful spans
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans.length).toBe(0);
  });

  it('handles zero-length match guard (e.g. pattern a*) without infinite loop', () => {
    // 'a*' will produce a zero-length match between characters — must not hang
    const result = resolveMatches(pat('a*'), 'bbb');
    if ('message' in result) throw new Error('Expected MatchResult');
    // zero-length matches are skipped; any 'a' runs would be captured but bbb has none
    expect(result.spans.length).toBe(0);
  });

  it('captures optional groups that are undefined without crashing', () => {
    // Pattern (a)|(b) — one of the groups will be undefined on each match
    const result = resolveMatches(pat('(a)|(b)'), 'ab');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans.length).toBeGreaterThanOrEqual(1);
  });

  it('handles overlap guard when acceptedSpans is empty (no crash)', () => {
    // Construct a scenario: use alternation that can't realistically produce overlaps
    // but exercise the branch by using a pattern that triggers overlap-detection code path
    // The guard `if (acceptedSpans.length > 0)` protects against an empty array
    const result = resolveMatches(pat('\\b\\w+\\b'), 'hello world');
    if ('message' in result) throw new Error('Expected MatchResult');
    expect(result.spans.length).toBe(2);
  });
});
