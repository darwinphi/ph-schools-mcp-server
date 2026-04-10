const fs = require('fs');
const path = require('path');
const { PACKAGE_NAME, resolveDefaultDataPath } = require('./constants');
const { createStore } = require('./store');

class DatasetLoadError extends Error {
  constructor(message, { code, hint } = {}) {
    super(message);
    this.name = 'DatasetLoadError';
    this.code = code;
    this.hint = hint;
  }
}

function buildDatasetHint(filePath) {
  const absolutePath = path.resolve(filePath);

  return [
    `Set PH_SCHOOLS_DATA_PATH to a valid JSON file path, or sync data first:`,
    `  npx -y ${PACKAGE_NAME} sync-data --output "${absolutePath}"`,
  ].join('\n');
}

function parseDataset(raw, filePath) {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new DatasetLoadError(`Dataset JSON is invalid at ${filePath}.`, {
      code: 'DATASET_INVALID_JSON',
      hint: `${buildDatasetHint(filePath)}\nOriginal error: ${error.message}`,
    });
  }

  if (!Array.isArray(parsed)) {
    throw new DatasetLoadError(`Dataset payload must be a JSON array at ${filePath}.`, {
      code: 'DATASET_INVALID_SHAPE',
      hint: buildDatasetHint(filePath),
    });
  }

  return parsed;
}

function resolveDataPath(explicitPath) {
  if (explicitPath) return explicitPath;
  if (process.env.PH_SCHOOLS_DATA_PATH) return process.env.PH_SCHOOLS_DATA_PATH;
  return resolveDefaultDataPath();
}

function loadDatasetFromFile(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new DatasetLoadError(`Dataset file not found: ${resolvedPath}`, {
      code: 'DATASET_NOT_FOUND',
      hint: buildDatasetHint(resolvedPath),
    });
  }

  let raw;
  try {
    raw = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (error) {
    throw new DatasetLoadError(`Unable to read dataset file: ${resolvedPath}`, {
      code: 'DATASET_READ_ERROR',
      hint: `${buildDatasetHint(resolvedPath)}\nOriginal error: ${error.message}`,
    });
  }

  return parseDataset(raw, resolvedPath);
}

function loadStoreFromFile(filePath) {
  const resolvedPath = resolveDataPath(filePath);
  const records = loadDatasetFromFile(resolvedPath);
  const store = createStore(records);

  return {
    store,
    dataPath: path.resolve(resolvedPath),
  };
}

module.exports = {
  DatasetLoadError,
  parseDataset,
  resolveDataPath,
  loadDatasetFromFile,
  loadStoreFromFile,
};
