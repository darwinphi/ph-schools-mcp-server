const fs = require('fs');
const path = require('path');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const z = require('zod/v4');

const DATA_PATH = process.env.PH_SCHOOLS_DATA_PATH || path.join(process.cwd(), 'data.json');
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalize(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function parseDataset(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const records = JSON.parse(raw);

  if (!Array.isArray(records)) {
    throw new Error('Dataset must be a JSON array of school records.');
  }

  return records;
}

function buildIndex(records) {
  const byBeisId = new Map();
  const regions = new Set();
  const divisionsByRegion = new Map();

  for (const row of records) {
    const beisId = String(row['BEIS School ID'] || '').trim();
    const region = String(row.Region || '').trim();
    const division = String(row.Division || '').trim();

    if (beisId) byBeisId.set(beisId, row);
    if (region) regions.add(region);

    if (region && division) {
      if (!divisionsByRegion.has(region)) {
        divisionsByRegion.set(region, new Set());
      }
      divisionsByRegion.get(region).add(division);
    }
  }

  return {
    byBeisId,
    regions: Array.from(regions).sort((a, b) => a.localeCompare(b)),
    divisionsByRegion,
  };
}

function toSchoolSummary(row) {
  return {
    beis_school_id: row['BEIS School ID'] || null,
    school_name: row['School Name'] || null,
    region: row.Region || null,
    division: row.Division || null,
    district: row.District || null,
    municipality: row.Municipality || null,
    barangay: row.Barangay || null,
    sector: row.Sector || null,
    curriculum_classification: row['Modified Curricural Offering Classification'] || null,
  };
}

function boundedLimit(limit) {
  const safe = Number(limit || DEFAULT_LIMIT);
  if (!Number.isFinite(safe) || safe <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(safe), MAX_LIMIT);
}

const records = parseDataset(DATA_PATH);
const index = buildIndex(records);

const server = new McpServer({
  name: 'ph-schools-mcp-server',
  version: '1.0.0',
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
  async ({ query, region, division, municipality, barangay, sector, limit }) => {
    const q = normalize(query);
    const regionNorm = normalize(region);
    const divisionNorm = normalize(division);
    const municipalityNorm = normalize(municipality);
    const barangayNorm = normalize(barangay);
    const sectorNorm = normalize(sector);
    const safeLimit = boundedLimit(limit);

    const matches = [];

    for (const row of records) {
      const schoolName = normalize(row['School Name']);
      const streetAddress = normalize(row['Street Address']);
      const rowRegion = normalize(row.Region);
      const rowDivision = normalize(row.Division);
      const rowMunicipality = normalize(row.Municipality);
      const rowBarangay = normalize(row.Barangay);
      const rowSector = normalize(row.Sector);

      const textMatch = !q || schoolName.includes(q) || streetAddress.includes(q);
      const regionMatch = !regionNorm || rowRegion === regionNorm;
      const divisionMatch = !divisionNorm || rowDivision === divisionNorm;
      const municipalityMatch = !municipalityNorm || rowMunicipality === municipalityNorm;
      const barangayMatch = !barangayNorm || rowBarangay === barangayNorm;
      const sectorMatch = !sectorNorm || rowSector === sectorNorm;

      if (textMatch && regionMatch && divisionMatch && municipalityMatch && barangayMatch && sectorMatch) {
        matches.push(toSchoolSummary(row));
        if (matches.length >= safeLimit) break;
      }
    }

    return {
      structuredContent: {
        count: matches.length,
        limit: safeLimit,
        items: matches,
      },
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              count: matches.length,
              limit: safeLimit,
              items: matches,
            },
            null,
            2
          ),
        },
      ],
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
    const key = String(beis_school_id || '').trim();
    const row = index.byBeisId.get(key);

    if (!row) {
      return {
        isError: true,
        structuredContent: {
          found: false,
          beis_school_id: key,
          message: `No school found for BEIS School ID ${key}.`,
        },
        content: [
          {
            type: 'text',
            text: `No school found for BEIS School ID ${key}.`,
          },
        ],
      };
    }

    return {
      structuredContent: {
        found: true,
        item: row,
      },
      content: [
        {
          type: 'text',
          text: JSON.stringify({ found: true, item: row }, null, 2),
        },
      ],
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
    const result = {
      count: index.regions.length,
      items: index.regions,
    };

    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
    const regionNorm = normalize(region);

    let divisions;
    if (!regionNorm) {
      const all = new Set();
      for (const divisionSet of index.divisionsByRegion.values()) {
        for (const division of divisionSet) all.add(division);
      }
      divisions = Array.from(all).sort((a, b) => a.localeCompare(b));
    } else {
      const matchedRegion = index.regions.find((r) => normalize(r) === regionNorm);
      const set = matchedRegion ? index.divisionsByRegion.get(matchedRegion) : null;
      divisions = set ? Array.from(set).sort((a, b) => a.localeCompare(b)) : [];
    }

    const result = {
      region: region || null,
      count: divisions.length,
      items: divisions,
    };

    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
    const byRegion = {};
    const bySector = {};

    for (const row of records) {
      const region = String(row.Region || 'Unknown').trim() || 'Unknown';
      const sector = String(row.Sector || 'Unknown').trim() || 'Unknown';

      byRegion[region] = (byRegion[region] || 0) + 1;
      bySector[sector] = (bySector[sector] || 0) + 1;
    }

    const result = {
      total_schools: records.length,
      unique_regions: index.regions.length,
      region_breakdown: byRegion,
      sector_breakdown: bySector,
    };

    return {
      structuredContent: result,
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed to start:', error);
  process.exit(1);
});
