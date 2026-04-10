const { loadStoreFromFile, DatasetLoadError } = require('./dataset');
const { createPhSchoolsMcpServer, connectServer } = require('./mcp-server');
const packageJson = require('../package.json');

async function startServer(options = {}) {
  const { store } = loadStoreFromFile(options.dataPath);

  if (store.duplicateBeisIds.length > 0) {
    console.error(
      `[ph-schools] Warning: detected ${store.duplicateBeisIds.length} duplicate BEIS School ID values. Last record wins.`
    );
  }

  const server = createPhSchoolsMcpServer({
    store,
    version: packageJson.version,
  });

  await connectServer(server);
}

function formatStartupError(error) {
  if (error instanceof DatasetLoadError) {
    return [error.message, error.hint].filter(Boolean).join('\n');
  }

  return error && error.message ? error.message : String(error);
}

async function runServerFromCli() {
  try {
    await startServer();
  } catch (error) {
    console.error('MCP server failed to start.');
    console.error(formatStartupError(error));
    process.exit(1);
  }
}

if (require.main === module) {
  runServerFromCli();
}

module.exports = {
  startServer,
  runServerFromCli,
  formatStartupError,
};
