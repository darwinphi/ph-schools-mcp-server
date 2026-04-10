const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createStore } = require('../src/store');

const fixturePath = path.join(__dirname, 'fixtures', 'schools-fixture.json');
const fixtureRecords = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

module.exports = [
  {
    name: 'search_schools supports case-insensitive region + sector filters',
    run: async () => {
      const store = createStore(fixtureRecords);
      const result = store.searchSchools({
        region: ' region i ',
        sector: 'public',
        limit: 10,
      });

      assert.equal(result.count, 2);
      assert.equal(result.items[0].region, 'Region I');
    },
  },
  {
    name: 'search_schools query matches names and respects limit cap',
    run: async () => {
      const store = createStore(fixtureRecords);
      const result = store.searchSchools({ query: 'national high', limit: 1 });

      assert.equal(result.count, 1);
      assert.equal(result.limit, 1);
      assert.match(result.items[0].school_name, /National High School/i);
    },
  },
  {
    name: 'get_school_by_beis_id returns last record on duplicate id',
    run: async () => {
      const store = createStore(fixtureRecords);

      const row = store.getSchoolByBeisId('100002');

      assert.ok(row);
      assert.equal(row['School Name'], 'Bacarra NHS Duplicate');
      assert.equal(store.duplicateBeisIds.length, 1);
    },
  },
  {
    name: 'list_divisions can filter by region with normalized input',
    run: async () => {
      const store = createStore(fixtureRecords);
      const result = store.listDivisions(' region iii ');

      assert.equal(result.count, 1);
      assert.deepEqual(result.items, ['Bulacan']);
    },
  },
  {
    name: 'dataset_stats includes duplicate BEIS counter',
    run: async () => {
      const store = createStore(fixtureRecords);
      const stats = store.datasetStats();

      assert.equal(stats.total_schools, 4);
      assert.equal(stats.duplicate_beis_school_ids, 1);
      assert.equal(stats.sector_breakdown.Public, 3);
    },
  },
];
