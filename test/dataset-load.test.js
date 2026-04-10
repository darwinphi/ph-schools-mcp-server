const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadDatasetFromFile, DatasetLoadError } = require('../src/dataset');

module.exports = [
  {
    name: 'loadDatasetFromFile throws actionable error for missing file',
    run: async () => {
      const missingPath = path.join(os.tmpdir(), `missing-${Date.now()}.json`);

      assert.throws(
        () => loadDatasetFromFile(missingPath),
        (error) => {
          assert.ok(error instanceof DatasetLoadError);
          assert.equal(error.code, 'DATASET_NOT_FOUND');
          assert.match(error.hint, /sync-data/);
          return true;
        }
      );
    },
  },
  {
    name: 'loadDatasetFromFile throws actionable error for malformed JSON',
    run: async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-schools-'));
      const filePath = path.join(dir, 'broken.json');
      fs.writeFileSync(filePath, '{broken', 'utf-8');

      assert.throws(
        () => loadDatasetFromFile(filePath),
        (error) => {
          assert.ok(error instanceof DatasetLoadError);
          assert.equal(error.code, 'DATASET_INVALID_JSON');
          assert.match(error.hint, /Original error/);
          return true;
        }
      );
    },
  },
  {
    name: 'loadDatasetFromFile throws actionable error for non-array payload',
    run: async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-schools-'));
      const filePath = path.join(dir, 'object.json');
      fs.writeFileSync(filePath, '{"hello":"world"}', 'utf-8');

      assert.throws(
        () => loadDatasetFromFile(filePath),
        (error) => {
          assert.ok(error instanceof DatasetLoadError);
          assert.equal(error.code, 'DATASET_INVALID_SHAPE');
          return true;
        }
      );
    },
  },
];
