# PH Schools MCP Server

A standalone MCP server (stdio) that exposes tools for querying the Philippine schools dataset.

## Dataset

By default, the server reads `./data.json`.

### Sync from Canonical GitHub Repo

The server can sync the latest dataset from your canonical repo:

```bash
npm run sync-data
```

Defaults:

- Source URL: `https://raw.githubusercontent.com/darwinphi/ph-schools-dataset/main/schools_masterlist_2020_2021.json`
- Output file: `./data.json`

Optional overrides:

```bash
PH_SCHOOLS_DATA_URL="https://raw.githubusercontent.com/darwinphi/ph-schools-dataset/main/schools_masterlist_2020_2021.json" \
PH_SCHOOLS_DATA_PATH="/absolute/path/to/data.json" \
npm run sync-data
```

You can also set only runtime dataset path when starting the server:

```bash
PH_SCHOOLS_DATA_PATH=/absolute/path/to/schools.json npm start
```

## Tools

1. `search_schools`
2. `get_school_by_beis_id`
3. `list_regions`
4. `list_divisions`
5. `dataset_stats`

## Run

```bash
npm install
npm start
```

## Quick Local Check

```bash
npm test
```

## MCP Client Config Example

Use this command in your MCP client config:

```json
{
  "mcpServers": {
    "ph-schools": {
      "command": "node",
      "args": ["/Users/dar.manalo/Code/ph-schools-mcp-server/src/server.js"]
    }
  }
}
```
