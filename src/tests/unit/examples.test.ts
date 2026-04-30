import { describe, it, expect } from 'vitest';
import { ALL_EXAMPLES, EXAMPLE_CATEGORIES } from '../../src/examples/examples.js';

describe('examples data', () => {
  it('ALL_EXAMPLES is a non-empty array', () => {
    expect(ALL_EXAMPLES.length).toBeGreaterThan(0);
  });

  it('every example has a non-empty id, label, pattern, and sampleText', () => {
    for (const ex of ALL_EXAMPLES) {
      expect(ex.id, `${ex.id} missing id`).toBeTruthy();
      expect(ex.label, `${ex.id} missing label`).toBeTruthy();
      expect(ex.pattern, `${ex.id} missing pattern`).toBeTruthy();
      expect(ex.sampleText, `${ex.id} missing sampleText`).toBeTruthy();
    }
  });

  it('every pattern is a valid regex (compiles without throwing)', () => {
    for (const ex of ALL_EXAMPLES) {
      expect(() => new RegExp(ex.pattern, 'g'), `${ex.id} pattern invalid`).not.toThrow();
    }
  });

  it('every sampleText produces at least one match against its pattern', () => {
    for (const ex of ALL_EXAMPLES) {
      const re = new RegExp(ex.pattern, 'g');
      const hasMatch = re.test(ex.sampleText);
      expect(hasMatch, `${ex.id}: pattern /${ex.pattern}/ did not match sampleText "${ex.sampleText}"`).toBe(true);
    }
  });

  it('no duplicate id values across all examples', () => {
    const ids = ALL_EXAMPLES.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('EXAMPLE_CATEGORIES is non-empty', () => {
    expect(EXAMPLE_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('every category has a label and at least one example', () => {
    for (const cat of EXAMPLE_CATEGORIES) {
      expect(cat.label, 'category missing label').toBeTruthy();
      expect(cat.examples.length, `category "${cat.label}" has no examples`).toBeGreaterThan(0);
    }
  });

  it('has at least 5 categories', () => {
    expect(EXAMPLE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  it('has at least 3 examples per category', () => {
    for (const cat of EXAMPLE_CATEGORIES) {
      expect(cat.examples.length, `category "${cat.label}" has fewer than 3 examples`).toBeGreaterThanOrEqual(3);
    }
  });

  it('every example in ALL_EXAMPLES appears in a category', () => {
    const flatFromCategories = EXAMPLE_CATEGORIES.flatMap(c => c.examples).map(e => e.id);
    const flatSet = new Set(flatFromCategories);
    for (const ex of ALL_EXAMPLES) {
      expect(flatSet.has(ex.id), `${ex.id} is in ALL_EXAMPLES but not in any category`).toBe(true);
    }
  });
});
