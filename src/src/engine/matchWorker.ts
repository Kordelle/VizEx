/**
 * matchWorker.ts — Web Worker entry point
 *
 * Receives: { id: number; pattern: RegexPattern; rawInput: string }
 * Posts:    { id: number; html: string; spans: MatchSpan[]; truncated: boolean;
 *             totalMatchCount: number; durationMs: number; error: string | null }
 *
 * Running in a worker keeps the UI thread free for scroll/input during heavy
 * regex evaluation on large inputs (500+ CSV rows, etc.).
 */

import { resolveMatches } from './resolveMatches.js';
import { buildHighlightSpans } from './buildHighlightSpans.js';
import type { RegexPattern, MatchSpan } from '../types.js';
import { isPatternError } from '../types.js';

export interface WorkerRequest {
  id: number;
  pattern: RegexPattern;
  rawInput: string;
}

export interface WorkerResponse {
  id: number;
  html: string;
  spans: MatchSpan[];
  truncated: boolean;
  totalMatchCount: number;
  durationMs: number;
  error: string | null;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, pattern, rawInput } = e.data;

  const result = resolveMatches(pattern, rawInput);

  if (isPatternError(result)) {
    const response: WorkerResponse = {
      id,
      html: '',
      spans: [],
      truncated: false,
      totalMatchCount: 0,
      durationMs: 0,
      error: result.message,
    };
    self.postMessage(response);
    return;
  }

  const html = buildHighlightSpans(rawInput, result.spans);

  const response: WorkerResponse = {
    id,
    html,
    spans: result.spans,
    truncated: result.truncated ?? false,
    totalMatchCount: result.totalMatchCount,
    durationMs: result.durationMs,
    error: null,
  };
  self.postMessage(response);
};
