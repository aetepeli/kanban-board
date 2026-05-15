// ─────────────────────────────────────────────────────────────────────────────
// test/jest.setup.ts
// Her test dosyasından önce otomatik çalışır.
// jest.config.ts'de setupFilesAfterFramework'e eklenir.
// ─────────────────────────────────────────────────────────────────────────────

import { resetFixtures } from './test/helpers/fixtures';

// Her testten önce fixture counter'ını sıfırla
// _uuidCounter paralel testlerde collision'a neden olabilir
beforeEach(() => {
  jest.resetAllMocks();
  resetFixtures();
});

afterEach(() => {
  jest.restoreAllMocks();
});
