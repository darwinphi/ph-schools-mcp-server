# PH Schools MCP Server

Local `stdio` MCP server for querying and analyzing the Philippine schools masterlist dataset.

## What This Server Provides

Tools:

1. `search_schools`
2. `get_school_by_beis_id`
3. `list_regions`
4. `list_divisions`
5. `dataset_stats`

## Install and Run

```bash
npm install
npm start
```

### CLI (published package)

```bash
# Start MCP server over stdio
npx -y @darwinphi/ph-schools-mcp-server

# Sync canonical dataset once to a chosen path
npx -y @darwinphi/ph-schools-mcp-server sync-data --tag v1.0.0 --output "$HOME/.ph-schools/data.json"
```

## Dataset Configuration

This server is hybrid by default:

- If local dataset file exists, it uses that file immediately.
- If local dataset file is missing, it auto-downloads from the canonical dataset URL and caches locally.

Default canonical URL (pinned tag `v1.0.0`):

`https://raw.githubusercontent.com/darwinphi/ph-schools-dataset/v1.0.0/schools_masterlist_2020_2021.json`

Runtime env vars:

- `PH_SCHOOLS_DATA_PATH`: preferred local JSON file path (used directly if present; auto-synced to this path if missing)
- `PH_SCHOOLS_DATA_URL`: override download URL for `sync-data`
- `PH_SCHOOLS_DATA_TAG`: canonical tag for `sync-data` when URL is not provided

## VS Code MCP Config (Copy/Paste)

Set `.vscode/mcp.json`:

```json
{
  "servers": {
    "phSchools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@darwinphi/ph-schools-mcp-server"],
      "env": {
        "PH_SCHOOLS_DATA_PATH": "/Users/your-user/.ph-schools/data.json"
      }
    }
  }
}
```

If `PH_SCHOOLS_DATA_PATH` file is missing, the server automatically downloads from canonical source and writes to that path.

## Claude Desktop Config (Copy/Paste)

Update Claude config:

```json
{
  "mcpServers": {
    "ph-schools": {
      "command": "npx",
      "args": ["-y", "@darwinphi/ph-schools-mcp-server"],
      "env": {
        "PH_SCHOOLS_DATA_PATH": "/Users/your-user/.ph-schools/data.json"
      }
    }
  }
}
```

If `PH_SCHOOLS_DATA_PATH` file is missing, the server automatically downloads from canonical source and writes to that path.

Typical macOS config file:

`~/Library/Application Support/Claude/claude_desktop_config.json`

## Test Commands

```bash
npm test
npm run test:package
```

## Example Prompts

- `Run dataset_stats and summarize key insights.`
- `List all divisions in Region I using list_divisions.`
- `Search schools in region "Region I" and division "Ilocos Norte".`
- `Get school by BEIS ID 100001 using get_school_by_beis_id.`
- `Search schools with query "High School".`

## Publishing and Release Flow

One-time npm setup (Trusted Publishing):

1. On npmjs.com, open package `@darwinphi/ph-schools-mcp-server` → Settings → Trusted publishers.
2. Add GitHub Actions trusted publisher with:
   - Owner/User: `darwinphi`
   - Repository: `ph-schools-mcp-server`
   - Workflow filename: `release.yml`
3. Do not use `NPM_TOKEN`; release workflow uses OIDC (`id-token: write`).

Manual release flow (v1):

1. Update pinned dataset tag in `src/constants.js`.
2. Update versions in `package.json` and `server.json`.
3. Run:

```bash
npm ci
npm test
npm run test:package
```

4. Trigger GitHub Actions workflow `Release MCP Server` with matching `version` and `dataset_tag`.
5. Workflow publishes npm package, then publishes MCP Registry metadata.

For metadata-only updates, use workflow `Publish MCP Registry Metadata`.

## License and Data Provenance

- Code license: ISC ([LICENSE](./LICENSE)).
- Dataset source: `darwinphi/ph-schools-dataset` (canonical repository backed by gov.ph source data).
- Use of dataset remains subject to source terms and applicable policies.
