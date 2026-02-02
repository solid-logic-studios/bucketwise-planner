import type { CsvImportMapping } from '../../../api/types.js';

export interface CsvImportPreset {
  id: string;
  name: string;
  mapping: CsvImportMapping;
}

const STORAGE_KEY = 'csvImportPresets';

export class CsvImportPresetStore {
  static load(): CsvImportPreset[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CsvImportPreset[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((preset) => preset?.id && preset?.name && preset?.mapping);
    } catch {
      return [];
    }
  }

  static save(presets: CsvImportPreset[]): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  }

  static add(preset: CsvImportPreset): CsvImportPreset[] {
    const existing = this.load();
    const next = [preset, ...existing.filter((item) => item.id !== preset.id)];
    this.save(next);
    return next;
  }
}
