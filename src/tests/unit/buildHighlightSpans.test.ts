import { describe, it, expect } from 'vitest';
import { buildHighlightSpans } from '../../src/engine/buildHighlightSpans.js';
import type { MatchSpan } from '../../src/types.js';

function span(start: number, end: number, text: string, groupIndex = 0): MatchSpan {
  return { start, end, text, groupIndex, overlappingAlternatives: [] };
}

describe('buildHighlightSpans', () => {
  it('wraps a single match in a mark element', () => {
    const html = buildHighlightSpans('hello world', [span(0, 5, 'hello')]);
    expect(html).toContain('<mark');
    expect(html).toContain('hello');
    expect(html).toContain('world');
  });

  it('uses data-group attribute from the span groupIndex', () => {
    const html = buildHighlightSpans('test', [span(0, 4, 'test', 2)]);
    expect(html).toContain('data-group="2"');
  });

  it('HTML-escapes < in text segments', () => {
    const html = buildHighlightSpans('<div>', []);
    expect(html).toContain('&lt;div&gt;');
    expect(html).not.toContain('<div>');
  });

  it('HTML-escapes > in text segments', () => {
    const html = buildHighlightSpans('a>b', []);
    expect(html).toContain('a&gt;b');
  });

  it('HTML-escapes & in text segments', () => {
    const html = buildHighlightSpans('a&b', []);
    expect(html).toContain('a&amp;b');
  });

  it('HTML-escapes special characters inside matched spans', () => {
    const html = buildHighlightSpans('<b>', [span(0, 3, '<b>')]);
    expect(html).toContain('&lt;b&gt;');
    expect(html).not.toContain('<b>');
  });

  it('returns HTML-escaped plain text when no matches', () => {
    const html = buildHighlightSpans('no match here', []);
    expect(html).toBe('no match here');
  });

  it('handles empty input string', () => {
    const html = buildHighlightSpans('', []);
    expect(html).toBe('');
  });

  it('handles multiple matches with correct segment ordering', () => {
    const html = buildHighlightSpans('abc def ghi', [span(0, 3, 'abc'), span(8, 11, 'ghi')]);
    const abcIdx = html.indexOf('abc');
    const defIdx = html.indexOf(' def ');
    const ghiIdx = html.indexOf('ghi');
    expect(abcIdx).toBeLessThan(defIdx);
    expect(defIdx).toBeLessThan(ghiIdx);
  });

  it('adds tooltip title for overlapping alternatives', () => {
    const spanWithOverlap: MatchSpan = {
      start: 0, end: 3, text: 'abc', groupIndex: 0,
      overlappingAlternatives: [{ start: 1, end: 4, text: 'bcd' }],
    };
    const html = buildHighlightSpans('abcd', [spanWithOverlap]);
    expect(html).toContain('title=');
    expect(html).toContain('bcd');
  });

  it('assigns data-group="0" for full match group', () => {
    const html = buildHighlightSpans('hello', [span(0, 5, 'hello', 0)]);
    expect(html).toContain('data-group="0"');
  });

  it('does not produce XSS from <script> in input', () => {
    const html = buildHighlightSpans('<script>alert(1)</script>', []);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
