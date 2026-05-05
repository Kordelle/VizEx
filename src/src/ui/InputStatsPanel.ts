import { subscribe } from '../state.js';

export function initInputStatsPanel(): void {
  const container = document.getElementById('input-stats-panel');
  if (!container) return;

  container.innerHTML = `
    <div class="stats-panel">
      <div class="stats-panel-header">
        <span class="stats-panel-title">Input Statistics</span>
      </div>
      <div class="stats-panel-body">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value" id="stat-lines">—</span>
            <span class="stat-label">Lines</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-chars">—</span>
            <span class="stat-label">Characters</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-nonempty">—</span>
            <span class="stat-label">Non-empty rows</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-matched">—</span>
            <span class="stat-label">Matched rows</span>
          </div>
        </div>
        <div class="stats-match-bar-wrap" id="stats-match-bar-wrap" hidden>
          <div class="stats-match-bar-track">
            <div class="stats-match-bar-fill" id="stats-match-bar-fill"></div>
          </div>
          <span class="stats-match-pct" id="stats-match-pct"></span>
        </div>
      </div>
    </div>`;

  const statLines    = document.getElementById('stat-lines')!;
  const statChars    = document.getElementById('stat-chars')!;
  const statNonempty = document.getElementById('stat-nonempty')!;
  const statMatched  = document.getElementById('stat-matched')!;
  const barWrap      = document.getElementById('stats-match-bar-wrap')!;
  const barFill      = document.getElementById('stats-match-bar-fill')!;
  const barPct       = document.getElementById('stats-match-pct')!;

  subscribe((state) => {
    const input   = state.rawInput;
    const pattern = state.pattern;

    if (!input) {
      statLines.textContent    = '—';
      statChars.textContent    = '—';
      statNonempty.textContent = '—';
      statMatched.textContent  = '—';
      barWrap.hidden = true;
      return;
    }

    const lines    = input.split('\n');
    const total    = lines.length;
    const nonempty = lines.filter(l => l.trim().length > 0).length;

    statLines.textContent    = total.toLocaleString();
    statChars.textContent    = input.length.toLocaleString();
    statNonempty.textContent = nonempty.toLocaleString();

    // Count matched rows (lines that contain at least one match)
    if (pattern.raw) {
      let regex: RegExp;
      try {
        let flags = '';
        if (pattern.flags.caseInsensitive) flags += 'i';
        if (pattern.flags.multiline) flags += 'm';
        if (pattern.flags.dotAll) flags += 's';
        regex = new RegExp(pattern.raw, flags);
      } catch {
        statMatched.textContent = '—';
        barWrap.hidden = true;
        return;
      }

      const matchedRows = lines.filter(l => regex.test(l)).length;
      const pct = nonempty > 0 ? Math.round((matchedRows / nonempty) * 100) : 0;

      statMatched.textContent = matchedRows.toLocaleString();
      barFill.style.width = `${pct}%`;
      // Colour: green ≥80%, amber 40–79%, red <40%
      barFill.className = 'stats-match-bar-fill ' + (pct >= 80 ? 'bar-good' : pct >= 40 ? 'bar-warn' : 'bar-bad');
      barPct.textContent = `${pct}% of non-empty rows`;
      barWrap.hidden = false;
    } else {
      statMatched.textContent = '—';
      barWrap.hidden = true;
    }
  });
}
