const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const z = require('zod/v4');
const { MAX_LIMIT } = require('./store');

function asTextContent(value) {
  return [{ type: 'text', text: JSON.stringify(value, null, 2) }];
}

function createPhSchoolsMcpServer({ store, version }) {
  const server = new McpServer({
    name: 'ph-schools-mcp-server',
    version,
  });

  server.registerTool(
    'search_schools',
    {
      description:
        'Search PH schools by optional query fields (name, region, division, municipality, barangay, sector).',
      inputSchema: {
        query: z.string().optional().describe('Free text match against school name and street address.'),
        region: z.string().optional().describe('Region name (e.g., Region I).'),
        division: z.string().optional().describe('Division name (e.g., Ilocos Norte).'),
        municipality: z.string().optional().describe('Municipality name.'),
        barangay: z.string().optional().describe('Barangay name.'),
        sector: z.string().optional().describe('Public or Private.'),
        limit: z.number().int().positive().max(MAX_LIMIT).optional().describe('Max results (default 20, max 100).'),
      },
    },
    async (args) => {
      const result = store.searchSchools(args);

      return {
        structuredContent: result,
        content: asTextContent(result),
      };
    }
  );

  server.registerTool(
    'get_school_by_beis_id',
    {
      description: 'Get one school record by BEIS School ID.',
      inputSchema: {
        beis_school_id: z.string().describe('BEIS School ID, e.g., 100001'),
      },
    },
    async ({ beis_school_id }) => {
      const row = store.getSchoolByBeisId(beis_school_id);

      if (!row) {
        const error = {
          found: false,
          beis_school_id,
          message: `No school found for BEIS School ID ${beis_school_id}.`,
        };

        return {
          isError: true,
          structuredContent: error,
          content: asTextContent(error),
        };
      }

      const result = {
        found: true,
        item: row,
      };

      return {
        structuredContent: result,
        content: asTextContent(result),
      };
    }
  );

  server.registerTool(
    'list_regions',
    {
      description: 'List all unique regions in the dataset.',
      inputSchema: {},
    },
    async () => {
      const result = store.listRegions();

      return {
        structuredContent: result,
        content: asTextContent(result),
      };
    }
  );

  server.registerTool(
    'list_divisions',
    {
      description: 'List divisions, optionally filtered by region.',
      inputSchema: {
        region: z.string().optional().describe('Region filter, e.g., Region I'),
      },
    },
    async ({ region }) => {
      const result = store.listDivisions(region);

      return {
        structuredContent: result,
        content: asTextContent(result),
      };
    }
  );

  server.registerTool(
    'dataset_stats',
    {
      description: 'Return basic dataset stats and top-level breakdowns.',
      inputSchema: {},
    },
    async () => {
      const result = store.datasetStats();

      return {
        structuredContent: result,
        content: asTextContent(result),
      };
    }
  );

  return server;
}

async function connectServer(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

module.exports = {
  createPhSchoolsMcpServer,
  connectServer,
};
