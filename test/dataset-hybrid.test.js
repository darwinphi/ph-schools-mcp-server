const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadStoreForServer } = require('../src/dataset');

module.exports = [
  {
    name: 'loadStoreForServer falls back to sync when local file is missing',
    run: async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-schools-hybrid-'));
      const dataPath = path.join(dir, 'data.json');

      let syncCalled = false;
      const syncImpl = async ({ outputPath }) => {
        syncCalled = true;
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
          outputPath,
          JSON.stringify([
            {
              Region: 'Region I',
              Division: 'Ilocos Norte',
              District: 'Bacarra I',
              'BEIS School ID': '100001',
              'School Name': 'Apaleng-Libtong ES',
              'Street Address': 'Brgy. 21, Libtong',
              Municipality: 'BACARRA',
              Barangay: 'LIBTONG',
              Sector: 'Public',
              'Modified Curricural Offering Classification': 'Purely ES'
            }
          ])
        );

        return {
          tag: 'v-test',
          dataUrl: 'https://example.test/data.json',
          outputPath,
          recordCount: 1,
        };
      };

      const result = await loadStoreForServer({
        filePath: dataPath,
        syncImpl,
      });

      assert.equal(syncCalled, true);
      assert.equal(result.source, 'synced');
      assert.equal(result.syncResult.recordCount, 1);
      assert.equal(result.store.datasetStats().total_schools, 1);
    },
  },
  {
    name: 'loadStoreForServer uses local file when available',
    run: async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-schools-hybrid-'));
      const dataPath = path.join(dir, 'data.json');
      fs.writeFileSync(
        dataPath,
        JSON.stringify([
          {
            Region: 'Region III',
            Division: 'Bulacan',
            District: 'Meycauayan',
            'BEIS School ID': '200001',
            'School Name': 'Saint Mary College',
            'Street Address': 'Meycauayan, Bulacan',
            Municipality: 'MEYCAUAYAN',
            Barangay: 'SALUYSOY',
            Sector: 'Private',
            'Modified Curricural Offering Classification': 'Complete JHS'
          }
        ])
      );

      let syncCalled = false;
      const syncImpl = async () => {
        syncCalled = true;
        throw new Error('should not be called');
      };

      const result = await loadStoreForServer({
        filePath: dataPath,
        syncImpl,
      });

      assert.equal(syncCalled, false);
      assert.equal(result.source, 'local');
      assert.equal(result.store.datasetStats().total_schools, 1);
    },
  },
];
