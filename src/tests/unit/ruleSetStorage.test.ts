import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RuleSetStorage } from '../../src/storage/ruleSetStorage.js';
import type { DQRule, RuleSet } from '../../src/types.js';

function makeRuleSet(name: string, rules: DQRule[] = []): RuleSet {
  return {
    id: `id-${name}`,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules,
  };
}

describe('RuleSetStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('load returns [] when storage key is absent', () => {
    expect(RuleSetStorage.load()).toEqual([]);
  });

  it('save and load round-trip preserves data', () => {
    const sets = [makeRuleSet('Alpha'), makeRuleSet('Beta')];
    RuleSetStorage.save(sets);
    expect(RuleSetStorage.load()).toEqual(sets);
  });

  it('upsert adds a new rule set', () => {
    const set = makeRuleSet('Test');
    RuleSetStorage.upsert(set);
    const loaded = RuleSetStorage.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Test');
  });

  it('upsert replaces existing rule set with same id', () => {
    const original = makeRuleSet('Original');
    RuleSetStorage.upsert(original);
    const updated = { ...original, name: 'Updated' };
    RuleSetStorage.upsert(updated);
    const loaded = RuleSetStorage.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Updated');
  });

  it('remove deletes rule set by id', () => {
    RuleSetStorage.upsert(makeRuleSet('ToKeep'));
    const toDelete = makeRuleSet('ToDelete');
    RuleSetStorage.upsert(toDelete);
    RuleSetStorage.remove(toDelete.id);
    const loaded = RuleSetStorage.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('ToKeep');
  });

  it('remove is a no-op for non-existent id', () => {
    RuleSetStorage.upsert(makeRuleSet('Stays'));
    RuleSetStorage.remove('non-existent-id');
    expect(RuleSetStorage.load()).toHaveLength(1);
  });

  it('load returns [] for corrupted JSON', () => {
    localStorage.setItem('dq-visualizer:rule-sets', '{invalid json}');
    expect(RuleSetStorage.load()).toEqual([]);
  });

  it('upsert returns the updated array', () => {
    const result = RuleSetStorage.upsert(makeRuleSet('One'));
    expect(result).toHaveLength(1);
  });

  it('remove returns the updated array', () => {
    const set = makeRuleSet('Delete Me');
    RuleSetStorage.upsert(set);
    const result = RuleSetStorage.remove(set.id);
    expect(result).toHaveLength(0);
  });
});
