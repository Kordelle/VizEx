import type { RuleSet } from '../types.js';

const STORAGE_KEY = 'dq-visualizer:rule-sets';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export const RuleSetStorage = {
  load(): RuleSet[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as RuleSet[];
    } catch {
      return [];
    }
  },

  save(sets: RuleSet[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    } catch (e) {
      throw new StorageError('Unable to save — storage full or unavailable.');
    }
  },

  upsert(set: RuleSet): RuleSet[] {
    const current = RuleSetStorage.load();
    const idx = current.findIndex(s => s.id === set.id);
    if (idx >= 0) {
      current[idx] = set;
    } else {
      current.push(set);
    }
    RuleSetStorage.save(current);
    return current;
  },

  remove(id: string): RuleSet[] {
    const updated = RuleSetStorage.load().filter(s => s.id !== id);
    RuleSetStorage.save(updated);
    return updated;
  },
};
