#!/usr/bin/env node

const { startServer } = require('./server');
const { syncDataset } = require('./sync');
const {
  DEFAULT_DATASET_TAG,
  PACKAGE_NAME,
  getCanonicalDatasetUrl,
} = require('./constants');
const packageJson = require('../package.json');

function printHelp() {
  const lines = [
    'PH Schools MCP Server',
    '',
    `Usage: ${PACKAGE_NAME} [command] [options]`,
    '',
    'Commands:',
    '  start              Start MCP stdio server (default command)',
    '  sync-data          Download canonical dataset to local file',
    '  --help, -h         Show this help',
    '  --version, -v      Show package version',
    '',
    'sync-data options:',
    `  --tag <tag>        Canonical dataset tag (default: ${DEFAULT_DATASET_TAG})`,
    '  --url <url>        Override dataset URL',
    '  --output <path>    Output file path (default: ./data.json)',
    '  --timeout-ms <n>   Download timeout in milliseconds',
    '',
    'Examples:',
    `  npx -y ${PACKAGE_NAME}`,
    `  npx -y ${PACKAGE_NAME} sync-data --tag ${DEFAULT_DATASET_TAG} --output ./data.json`,
    '',
    `Default canonical URL: ${getCanonicalDatasetUrl(DEFAULT_DATASET_TAG)}`,
  ];

  process.stdout.write(`${lines.join('\n')}\n`);
}

function parseArgs(argv) {
  const positional = [];
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = argv[i + 1];

    if (next && !next.startsWith('--')) {
      options[key] = next;
      i += 1;
    } else {
      options[key] = true;
    }
  }

  return { positional, options };
}

function normalizeCommand(value) {
  if (!value) return 'start';
  return value;
}

async function run() {
  const argv = process.argv.slice(2);

  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }

  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`${packageJson.version}\n`);
    return;
  }

  const { positional, options } = parseArgs(argv);
  const command = normalizeCommand(positional[0]);

  if (command === 'start') {
    const dataPath = options['data-path'];
    await startServer({ dataPath });
    return;
  }

  if (command === 'sync-data') {
    const result = await syncDataset({
      tag: options.tag,
      dataUrl: options.url,
      outputPath: options.output,
      timeoutMs: options['timeout-ms'],
    });

    process.stdout.write(`Downloaded dataset from: ${result.dataUrl}\n`);
    process.stdout.write(`Pinned dataset tag: ${result.tag}\n`);
    process.stdout.write(`Saved ${result.recordCount} records to: ${result.outputPath}\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

run().catch((error) => {
  const details = [];
  if (error && error.message) details.push(error.message);
  if (error && error.hint) details.push(error.hint);

  process.stderr.write(`${details.join('\n') || String(error)}\n`);
  process.exit(1);
});
