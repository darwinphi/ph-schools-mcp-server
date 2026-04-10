const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { syncDataset } = require('../src/sync');

module.exports = [
  {
    name: 'syncDataset writes file on valid array payload',
    run: async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-schools-sync-'));
      const outputPath = path.join(dir, 'data.json');

      const result = await syncDataset({
        outputPath,
        downloadImpl: async () => '[{"BEIS School ID":"1"}]',
      });

      assert.equal(result.recordCount, 1);
      assert.equal(fs.existsSync(outputPath), true);
    },
  },
  {
    name: 'syncDataset fails on download errors',
    run: async () => {
      await assert.rejects(
        () =>
          syncDataset({
            dataUrl: 'https://example.invalid/dataset.json',
            downloadImpl: async () => {
              throw new Error('connect ECONNREFUSED');
            },
          }),
        /Unable to download dataset/
      );
    },
  },
  {
    name: 'syncDataset fails on non-array payload',
    run: async () => {
      await assert.rejects(
        () =>
          syncDataset({
            downloadImpl: async () => '{"not":"array"}',
          }),
        /not a JSON array/
      );
    },
  },
];
