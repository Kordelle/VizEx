import { subscribe } from '../state.js';

function buildStatsHTML(
  linesVal: string,
  charsVal: string,
  nonemptyVal: string,
  matchedVal: string,
  barVisible: boolean,
  barPct: number,
  barClass: string,
  barLabel: string,
): string {
  return `
    <div class="stats-panel">
      <div class="stats-panel-header">
        <span class="stats-panel-title">Input Statistics</span>
      </div>
      <div class="stats-panel-body">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">${linesVal}</span>
            <span class="stat-label">Lines</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${charsVal}</span>
            <span class="stat-label">Characters</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${nonemptyVal}</span>
            <span class="stat-label">Non-empty rows</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">${matchedVal}</span>
            <span class="stat-label">Matched rows</span>
          </div>
        </div>
        ${barVisible ? `
        <div class="stats-match-bar-wrap">
          <div class="stats-match-bar-track">
            <div class="stats-match-bar-fill ${barClass}" style="width:${barPct}%"></div>
          </div>
          <span class="stats-match-pct">${barLabel}</span>
        </div>` : ''}
      </div>
    </div>`;
}

export function initInputStatsPanel(): void {
  const container = document.getElementById('input-stats-panel');
  if (!container) return;

  // Render initial empty state
  container.innerHTML = buildStatsHTML('—', '—', '—', '—', false, 0, '', '');

  subscribe((state) => {
    const input   = state.rawInput;
    const pattern = state.pattern;

    if (!input) {
      container.innerHTML = buildStatsHTML('—', '—', '—', '—', false, 0, '', '');
      return;
    }

    const lines    = input.split('\n');
    const total    = lines.length;
    const nonempty = lines.filter(l => l.trim().length > 0).length;

    if (!pattern.raw) {
      container.innerHTML = buildStatsHTML(
        total.toLocaleString(),
        input.length.toLocaleString(),
        nonempty.toLocaleString(),
        '—',
        false, 0, '', '',
      );
      return;
    }

    let regex: RegExp;
    try {
      let flags = '';
      if (pattern.flags.caseInsensitive) flags += 'i';
      if (pattern.flags.multiline) flags += 'm';
      if (pattern.flags.dotAll) flags += 's';
      regex = new RegExp(pattern.raw, flags);
    } catch {
      container.innerHTML = buildStatsHTML(
        total.toLocaleString(),
        input.length.toLocaleString(),
        nonempty.toLocaleString(),
        '—',
        false, 0, '', '',
      );
      return;
    }

    const matchedRows = lines.filter(l => regex.test(l)).length;
    const pct = nonempty > 0 ? Math.round((matchedRows / nonempty) * 100) : 0;
    const barClass = pct >= 80 ? 'bar-good' : pct >= 40 ? 'bar-warn' : 'bar-bad';

    container.innerHTML = buildStatsHTML(
      total.toLocaleString(),
      input.length.toLocaleString(),
      nonempty.toLocaleString(),
      matchedRows.toLocaleString(),
      true,
      pct,
      barClass,
      `${pct}% of non-empty rows`,
    );
  });
}
