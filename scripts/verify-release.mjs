import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const packageJsonPath = path.join(root, 'package.json');
const serverJsonPath = path.join(root, 'server.json');
const constantsPath = path.join(root, 'src', 'constants.js');

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function fail(message) {
  console.error(`release verification failed: ${message}`);
  process.exit(1);
}

const expectedVersion = parseArg('--version');
const expectedDatasetTag = parseArg('--dataset-tag');

if (!expectedVersion) {
  fail('missing --version argument');
}

if (!expectedDatasetTag) {
  fail('missing --dataset-tag argument');
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const serverJson = JSON.parse(fs.readFileSync(serverJsonPath, 'utf-8'));
const constantsSource = fs.readFileSync(constantsPath, 'utf-8');

if (packageJson.version !== expectedVersion) {
  fail(`package.json version ${packageJson.version} does not match expected ${expectedVersion}`);
}

if (serverJson.version !== expectedVersion) {
  fail(`server.json version ${serverJson.version} does not match expected ${expectedVersion}`);
}

if (!constantsSource.includes(`DEFAULT_DATASET_TAG = '${expectedDatasetTag}'`)) {
  fail(`src/constants.js is not pinned to dataset tag ${expectedDatasetTag}`);
}

if (packageJson.mcpName !== serverJson.name) {
  fail(`package.json mcpName (${packageJson.mcpName}) does not match server.json name (${serverJson.name})`);
}

console.log(`Release metadata verified for version ${expectedVersion} and dataset tag ${expectedDatasetTag}.`);
