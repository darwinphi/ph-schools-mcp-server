import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { syncDataset } = require('../src/sync.js');

async function main() {
  const result = await syncDataset();
  console.log(`Downloaded dataset from: ${result.dataUrl}`);
  console.log(`Pinned dataset tag: ${result.tag}`);
  console.log(`Saved ${result.recordCount} records to: ${result.outputPath}`);
}

main().catch((error) => {
  console.error('sync-data failed:', error.message);
  process.exit(1);
});
