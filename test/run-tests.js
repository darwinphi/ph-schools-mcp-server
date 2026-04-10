const path = require('node:path');

const suites = {
  unit: [
    './store.test.js',
    './dataset-load.test.js',
    './sync.test.js',
  ],
  integration: ['./mcp.integration.test.js'],
};

function getSuiteName() {
  const idx = process.argv.indexOf('--suite');
  if (idx === -1) return 'all';
  return process.argv[idx + 1] || 'all';
}

function resolveFiles(suiteName) {
  if (suiteName === 'all') {
    return [...suites.unit, ...suites.integration];
  }

  const files = suites[suiteName];
  if (!files) {
    throw new Error(`Unknown suite: ${suiteName}`);
  }

  return files;
}

async function run() {
  const suiteName = getSuiteName();
  const files = resolveFiles(suiteName);

  let total = 0;
  let failed = 0;

  for (const relFile of files) {
    const abs = path.join(__dirname, relFile);
    const testCases = require(abs);

    for (const testCase of testCases) {
      total += 1;
      const label = `${path.basename(relFile)} :: ${testCase.name}`;

      try {
        await testCase.run();
        process.stdout.write(`PASS ${label}\n`);
      } catch (error) {
        failed += 1;
        process.stderr.write(`FAIL ${label}\n`);
        process.stderr.write(`${error.stack || error.message}\n`);
      }
    }
  }

  process.stdout.write(`\nCompleted ${total} tests. Failed: ${failed}.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
