import type { MatchResult, MatchSpan, OverlapInfo, PatternError, RegexPattern } from '../types.js';

const SOFT_CAP = 50_000;
const MATCH_CAP = 2_000;

function buildFlagsString(pattern: RegexPattern): string {
  let f = 'g'; // always global
  if (pattern.flags.caseInsensitive) f += 'i';
  if (pattern.flags.multiline) f += 'm';
  if (pattern.flags.dotAll) f += 's';
  if (pattern.flags.unicode) f += 'u';
  return f;
}

export function resolveMatches(pattern: RegexPattern, input: string): MatchResult | PatternError {
  // Empty pattern — return empty result immediately
  if (!pattern.raw) {
    return { spans: [], totalMatchCount: 0, hasOverlaps: false, durationMs: 0, overSoftCap: input.length > SOFT_CAP };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern.raw, buildFlagsString(pattern));
  } catch (e) {
    return { message: (e as Error).message, raw: pattern.raw };
  }

  const t0 = performance.now();
  const overSoftCap = input.length > SOFT_CAP;

  // Collect all raw matches via exec loop
  const rawMatches: Array<{ start: number; end: number; text: string; groupIndex: number }> = [];
  let m: RegExpExecArray | null;

  // Reset lastIndex to avoid stale state
  regex.lastIndex = 0;

  while ((m = regex.exec(input)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;

    if (m[0].length === 0) {
      // Zero-length match — advance to avoid infinite loop
      regex.lastIndex = start + 1;
      continue;
    }

    // Add full match (group 0)
    rawMatches.push({ start, end, text: m[0], groupIndex: 0 });

    // Add capture groups (1–N)
    for (let g = 1; g < m.length; g++) {
      if (m[g] !== undefined) {
        rawMatches.push({ start, end, text: m[g], groupIndex: g });
      }
    }
  }

  // Greedy non-overlapping pass over group-0 matches
  const group0 = rawMatches.filter(r => r.groupIndex === 0);
  const totalMatchCount = group0.length;
  const truncated = group0.length > MATCH_CAP;
  const cappedGroup0 = truncated ? group0.slice(0, MATCH_CAP) : group0;

  const acceptedSpans: MatchSpan[] = [];
  let prevEnd = -1;

  for (const match of cappedGroup0) {
    if (match.start < prevEnd) {
      // Overlapping — store as alternative on the last accepted span
      if (acceptedSpans.length > 0) {
        const overlap: OverlapInfo = { start: match.start, end: match.end, text: match.text };
        acceptedSpans[acceptedSpans.length - 1].overlappingAlternatives.push(overlap);
      }
    } else {
      const span: MatchSpan = {
        start: match.start,
        end: match.end,
        text: match.text,
        groupIndex: 0,
        overlappingAlternatives: [],
      };
      acceptedSpans.push(span);
      prevEnd = match.end;
    }
  }

  const hasOverlaps = acceptedSpans.some(s => s.overlappingAlternatives.length > 0);

  return {
    spans: acceptedSpans,
    totalMatchCount,
    hasOverlaps,
    durationMs: performance.now() - t0,
    overSoftCap,
    truncated: truncated || undefined,
  };
}
