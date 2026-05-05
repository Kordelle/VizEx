import { EXAMPLE_CATEGORIES } from './src/examples/examples.js';

function escAttr(s) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const html = EXAMPLE_CATEGORIES.map(cat =>
  cat.examples.map(ex =>
    `<button data-pattern="${escAttr(ex.pattern)}" data-sample="${escAttr(ex.sampleText)}">${escHtml(ex.label)}</button>`
  ).join('')
).join('');

// Check no raw < or > remain in attribute values
const attrRe = /data-(?:pattern|sample)="([^"]*)"/g;
let m, bad = [];
while ((m = attrRe.exec(html)) !== null) {
  if (m[1].includes('<') || m[1].includes('>')) bad.push(m[1].slice(0,60));
}
if (bad.length) { console.error('BAD attrs:', bad); process.exit(1); }

const total = EXAMPLE_CATEGORIES.reduce((n,c) => n + c.examples.length, 0);
console.log(`All ${total} examples render clean HTML`);
console.log(`Categories: ${EXAMPLE_CATEGORIES.map(c => c.label).join(', ')}`);
EXAMPLE_CATEGORIES.forEach(cat => {
  console.log(`  ${cat.label}: ${cat.examples.length} examples`);
});
