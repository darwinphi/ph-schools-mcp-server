const path = require('path');

const PACKAGE_NAME = '@darwinphi/ph-schools-mcp-server';
const MCP_NAME = 'io.github.darwinphi/ph-schools';

const CANONICAL_DATASET_REPO = 'darwinphi/ph-schools-dataset';
const DEFAULT_DATASET_TAG = 'v1.0.0';
const DEFAULT_DATASET_FILE = 'schools_masterlist_2020_2021.json';

const DEFAULT_LOCAL_DATA_FILE = 'data.json';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function getCanonicalDatasetUrl(tag = DEFAULT_DATASET_TAG) {
  return `https://raw.githubusercontent.com/${CANONICAL_DATASET_REPO}/${tag}/${DEFAULT_DATASET_FILE}`;
}

function resolveDefaultDataPath(cwd = process.cwd()) {
  return path.join(cwd, DEFAULT_LOCAL_DATA_FILE);
}

module.exports = {
  PACKAGE_NAME,
  MCP_NAME,
  CANONICAL_DATASET_REPO,
  DEFAULT_DATASET_TAG,
  DEFAULT_DATASET_FILE,
  DEFAULT_LOCAL_DATA_FILE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  getCanonicalDatasetUrl,
  resolveDefaultDataPath,
};
