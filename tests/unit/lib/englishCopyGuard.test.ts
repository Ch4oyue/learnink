import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

// Narrow regression guards for the four reviewed mixed-language defects.
// These inspect source strings; they do not exercise authenticated routes.
describe('reviewed English-copy regressions', () => {
  const cases = [
    ['src/pages/learning/Modules.tsx', 'No modules available yet', 'No modules yet yang tersedia saat ini'],
    ['src/pages/dashboard/DashboardRequestMaterial.tsx', 'New Material Request', 'Material Requests Baru'],
    ['src/pages/dashboard/DashboardRequests.tsx', 'New Material Request', 'Material Requests Baru'],
    ['src/components/features/module/ModuleEditor.tsx', '"Saving..." : "Save"', '"Saving..." : "Simpan"'],
  ];
  for (const [path, wanted, previous] of cases) {
    test(path, () => {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain(wanted);
      expect(source).not.toContain(previous);
    });
  }
});
