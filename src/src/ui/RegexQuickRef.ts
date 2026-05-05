import { dispatch } from '../state.js';

interface TokenGroup {
  label: string;
  tokens: { display: string; insert: string; title: string }[];
}

const TOKEN_GROUPS: TokenGroup[] = [
  {
    label: 'Character classes',
    tokens: [
      { display: '\\d', insert: '\\d',   title: 'Any digit [0-9]' },
      { display: '\\w', insert: '\\w',   title: 'Word char [a-zA-Z0-9_]' },
      { display: '\\s', insert: '\\s',   title: 'Whitespace' },
      { display: '\\D', insert: '\\D',   title: 'Non-digit' },
      { display: '\\W', insert: '\\W',   title: 'Non-word char' },
      { display: '\\S', insert: '\\S',   title: 'Non-whitespace' },
      { display: '.',   insert: '.',     title: 'Any character except newline' },
    ],
  },
  {
    label: 'Anchors',
    tokens: [
      { display: '^',   insert: '^',     title: 'Start of line' },
      { display: '$',   insert: '$',     title: 'End of line' },
      { display: '\\b', insert: '\\b',   title: 'Word boundary' },
      { display: '\\B', insert: '\\B',   title: 'Non-word boundary' },
    ],
  },
  {
    label: 'Quantifiers',
    tokens: [
      { display: '*',     insert: '*',     title: 'Zero or more' },
      { display: '+',     insert: '+',     title: 'One or more' },
      { display: '?',     insert: '?',     title: 'Zero or one (optional)' },
      { display: '*?',    insert: '*?',    title: 'Zero or more (lazy)' },
      { display: '+?',    insert: '+?',    title: 'One or more (lazy)' },
      { display: '{n}',   insert: '{n}',   title: 'Exactly n times' },
      { display: '{n,m}', insert: '{n,m}', title: 'Between n and m times' },
    ],
  },
  {
    label: 'Groups',
    tokens: [
      { display: '(...)',    insert: '()',    title: 'Capturing group' },
      { display: '(?:...)', insert: '(?:)', title: 'Non-capturing group' },
      { display: '(?=...)', insert: '(?=)', title: 'Positive lookahead' },
      { display: '(?!...)', insert: '(?!)', title: 'Negative lookahead' },
      { display: '(?<=...)', insert: '(?<=)', title: 'Positive lookbehind' },
      { display: '(?<!...)', insert: '(?<!)', title: 'Negative lookbehind' },
    ],
  },
  {
    label: 'Sets & ranges',
    tokens: [
      { display: '[abc]',  insert: '[]',    title: 'Character set — matches a, b, or c' },
      { display: '[^abc]', insert: '[^]',   title: 'Negated set — matches anything except a, b, c' },
      { display: '[a-z]',  insert: '[a-z]', title: 'Lowercase range' },
      { display: '[A-Z]',  insert: '[A-Z]', title: 'Uppercase range' },
      { display: '[0-9]',  insert: '[0-9]', title: 'Digit range' },
    ],
  },
];

export function initRegexQuickRef(): void {
  const container = document.getElementById('regex-quick-ref');
  if (!container) return;

  const details = document.createElement('details');
  details.className = 'qref-details';

  const summary = document.createElement('summary');
  summary.className = 'qref-summary';
  summary.textContent = 'Regex Quick Reference';
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'qref-body';

  for (const group of TOKEN_GROUPS) {
    const section = document.createElement('div');
    section.className = 'qref-section';

    const label = document.createElement('span');
    label.className = 'qref-section-label';
    label.textContent = group.label;
    section.appendChild(label);

    const chips = document.createElement('div');
    chips.className = 'qref-chips';

    for (const token of group.tokens) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qref-chip';
      chip.textContent = token.display;
      chip.title = token.title;
      chip.addEventListener('click', () => insertToken(token.insert));
      chips.appendChild(chip);
    }

    section.appendChild(chips);
    body.appendChild(section);
  }

  details.appendChild(body);
  container.appendChild(details);
}

function insertToken(token: string): void {
  const input = document.getElementById('pattern-input') as HTMLInputElement | null;
  if (!input) return;

  // Try to insert at cursor position for regular inputs, or append for contenteditable
  if ('value' in input) {
    const start = input.selectionStart ?? input.value.length;
    const end   = input.selectionEnd   ?? input.value.length;
    const before = input.value.slice(0, start);
    const after  = input.value.slice(end);
    input.value = before + token + after;
    const cursor = start + token.length;
    input.setSelectionRange(cursor, cursor);
    input.focus();
  } else {
    // contenteditable
    const el = input as unknown as HTMLElement;
    el.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(token));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      el.textContent = (el.textContent ?? '') + token;
    }
  }

  // Fire native input event so RegexInputPanel's listener picks it up
  input.dispatchEvent(new Event('input', { bubbles: true }));

  // Also sync state directly
  const rawValue = ('value' in input)
    ? (input as HTMLInputElement).value
    : (input as unknown as HTMLElement).textContent ?? '';
  dispatch({ type: 'PATTERN_CHANGE', payload: { raw: rawValue } });
}
