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

## Example Prompts

Use these in VS Code Copilot Chat (or any MCP client chat) after connecting this server.

### General

- `List all available tools in the phSchools MCP server.`
- `Run dataset_stats and summarize key insights.`
- `Show sector breakdown (Public vs Private).`
- `Which regions have the highest school counts?`

### Region and Division Queries

- `Run list_regions and return all regions alphabetically.`
- `List all divisions in Region I using list_divisions.`
- `Compare number of divisions between Region I and Region III.`

### School Search

- `Search schools with query "Central School".`
- `Find schools matching "National High School".`
- `Search schools in region "Region I" and division "Ilocos Norte".`
- `Search schools in municipality "BACARRA".`
- `Search schools in barangay "LIBTONG".`
- `Search schools with sector "Public" in region "Region I" limit 50.`

### School Level Keywords

- `Search schools with query "Elementary".`
- `Search schools with query "High School".`
- `Search schools with query "College".`

Note: level terms are currently keyword-based via `query` and not a dedicated `school_level` filter.

### BEIS Lookup

- `Get school by BEIS ID 100001 using get_school_by_beis_id.`
- `Lookup BEIS ID 100002 and show full record.`
- `Check if BEIS ID 999999 exists.`

### Analysis

- `Find top 10 municipalities with the most schools.`
- `Find top 10 divisions with the most schools.`
- `Compare Public vs Private counts per region.`
- `Identify possible duplicate school names across different divisions.`
