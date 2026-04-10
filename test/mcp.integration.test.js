const assert = require('node:assert/strict');
const path = require('node:path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

module.exports = [
  {
    name: 'stdio server exposes and executes all public tools',
    run: async () => {
      const fixturePath = path.join(__dirname, 'fixtures', 'schools-fixture.json');
      const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [cliPath, 'start'],
        env: {
          PH_SCHOOLS_DATA_PATH: fixturePath,
        },
        stderr: 'pipe',
      });

      const client = new Client({ name: 'integration-test-client', version: '1.0.0' });

      try {
        await client.connect(transport);

        const tools = await client.listTools();
        const toolNames = tools.tools.map((tool) => tool.name).sort();

        assert.deepEqual(toolNames, [
          'dataset_stats',
          'get_school_by_beis_id',
          'list_divisions',
          'list_regions',
          'search_schools',
        ]);

        const searchResult = await client.callTool({
          name: 'search_schools',
          arguments: { query: 'bacarra', limit: 2 },
        });
        assert.equal(searchResult.isError, undefined);
        assert.equal(searchResult.structuredContent.count > 0, true);

        const beisResult = await client.callTool({
          name: 'get_school_by_beis_id',
          arguments: { beis_school_id: '100001' },
        });
        assert.equal(beisResult.structuredContent.found, true);

        const regionsResult = await client.callTool({
          name: 'list_regions',
          arguments: {},
        });
        assert.equal(regionsResult.structuredContent.count, 2);

        const divisionsResult = await client.callTool({
          name: 'list_divisions',
          arguments: { region: 'Region I' },
        });
        assert.equal(divisionsResult.structuredContent.count, 1);

        const statsResult = await client.callTool({
          name: 'dataset_stats',
          arguments: {},
        });
        assert.equal(statsResult.structuredContent.total_schools, 4);
      } finally {
        await client.close();
      }
    },
  },
];
