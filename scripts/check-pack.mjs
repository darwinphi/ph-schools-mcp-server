import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const raw = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  encoding: 'utf-8',
  cwd: process.cwd(),
});

const parsed = JSON.parse(raw);
assert(Array.isArray(parsed) && parsed.length > 0, 'npm pack --dry-run returned no package metadata.');

const pack = parsed[0];
const files = (pack.files || []).map((entry) => entry.path);

const forbiddenPrefixes = ['.vscode/', '.github/', 'test/', 'node_modules/'];
for (const prefix of forbiddenPrefixes) {
  const found = files.find((file) => file.startsWith(prefix));
  assert(!found, `Forbidden file included in package: ${found}`);
}

assert(!files.includes('data.json'), 'data.json should not be published in npm package.');

const requiredFiles = [
  'README.md',
  'LICENSE',
  'server.json',
  'src/cli.js',
  'src/server.js',
  'src/mcp-server.js',
  'src/sync.js',
  'src/constants.js',
  'src/dataset.js',
  'src/store.js',
];

for (const required of requiredFiles) {
  assert(files.includes(required), `Missing required published file: ${required}`);
}

console.log(`Package check passed for ${pack.name}@${pack.version}`);
console.log(`Package contains ${files.length} files and excludes local-only artifacts.`);
console.log(`Tarball filename: ${pack.filename || path.basename('package.tgz')}`);
