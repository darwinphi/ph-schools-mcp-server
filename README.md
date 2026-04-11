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

Use `npm start` only when running from this repo manually.

## Which Setup to Use

- VS Code MCP (`.vscode/mcp.json`): enough for normal usage. If status is `Running`, VS Code already started the server.
- Claude Desktop (`claude_desktop_config.json`): enough for normal usage. Restart Claude after config changes.
- `npx -y @darwinphi/ph-schools-mcp-server ...`: one-off CLI usage without cloning repo.
- `npm install && npm start`: local development/maintenance in this repository.

## Usage Scenarios

1. `mcp.json` configured, no manual `npx`: works for chat tool calls (`dataset_stats`, `search_schools`, etc.).
2. Manual `npx -y @darwinphi/ph-schools-mcp-server`, no MCP client config: server process starts, but chat clients won't use it automatically.
3. `mcp.json` configured plus manual `npx` start: usually unnecessary; let the MCP client manage start/stop.
4. One-off commands without MCP chat: use `npx ... --help` or `npx ... sync-data ...`.

Without MCP client config, automatic VS Code/Claude tool-calling will not work.

## When to Use `mcp.json`

Use `mcp.json` for normal day-to-day MCP usage in VS Code (or equivalent client config in Claude Desktop).

Use it for:

1. Automatic server startup and lifecycle management by the MCP client
2. MCP tool usage directly from chat prompts (`dataset_stats`, `search_schools`, etc.)
3. Team/project-level shared MCP setup in a workspace

If MCP status shows `Running`, the client already started the server; manual `npm start` or manual `npx` start is usually unnecessary.

## When to Use `npx`

Use `npx` from a terminal when you need one-off CLI actions without cloning or developing this repo.

Use it for:

1. Sanity check that the published package runs: `npx -y @darwinphi/ph-schools-mcp-server --help`
2. Manual dataset download/update: `npx -y @darwinphi/ph-schools-mcp-server sync-data --tag v1.0.1 --output "$HOME/.ph-schools/data.json"`
3. Manual debug startup outside client-managed MCP lifecycle: `npx -y @darwinphi/ph-schools-mcp-server`

Do not use `npx` start as a replacement for VS Code/Claude MCP config. In normal usage, let the MCP client manage server startup from its config.

## When to Use `npm install` and `npm start`

Use these when working from this repository (developer/maintainer workflow), not for normal client usage.

Use them for:

1. Local development while editing source files in this repo
2. Running tests before commits/releases
3. Debugging local unpublished changes

Typical local workflow:

```bash
npm install
npm test
npm start
```

If your VS Code/Claude MCP config is already working, you usually do not need to run `npm start` manually.

### CLI (published package)

```bash
# Start MCP server over stdio
npx -y @darwinphi/ph-schools-mcp-server

# Sync canonical dataset once to a chosen path
npx -y @darwinphi/ph-schools-mcp-server sync-data --tag v1.0.1 --output "$HOME/.ph-schools/data.json"
```

### Quick Verify

```bash
npx -y @darwinphi/ph-schools-mcp-server --help
npx -y @darwinphi/ph-schools-mcp-server sync-data --tag v1.0.1 --output "$HOME/.ph-schools/data.json"
```

## Dataset Configuration

This server is hybrid by default:

- If local dataset file exists, it uses that file immediately.
- If local dataset file is missing, it auto-downloads from the canonical dataset URL and caches locally.

Default canonical URL (pinned tag `v1.0.1`):

`https://raw.githubusercontent.com/darwinphi/ph-schools-dataset/v1.0.1/schools_masterlist_2020_2021.json`

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

Alternative if `npx` is unreliable in your shell: install globally and use `"command": "ph-schools-mcp-server"`.

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
   - Workflow filename: `cd.yml`
3. Do not use `NPM_TOKEN`; release workflow uses OIDC (`id-token: write`).

Manual release flow (v1):

1. Update pinned dataset tag in `src/constants.js`.
2. Bump package version:

```bash
npm version patch   # or minor / major
```

What `npm version patch` does:
- Updates `package.json` version (e.g., `1.0.1` -> `1.0.2`)
- Updates `package-lock.json` version fields
- Creates a git commit
- Creates a git tag (e.g., `v1.0.2`)

3. Sync `server.json` version to match `package.json`.
4. Run:

```bash
npm ci
npm test
npm run test:package
```

5. Push commit and tags:

```bash
git push
git push --tags
```

6. Create GitHub Release notes from the tag:

```bash
gh release create v<new_version> --generate-notes --title "v<new_version>"
```

Example:

```bash
gh release create v1.0.2 --generate-notes --title "v1.0.2"
```

7. Push commit and tags. Tag pushes (`v*`) automatically trigger `CD Release` workflow.
8. Workflow publishes npm package, then publishes MCP Registry metadata.

For metadata-only updates, use workflow `Publish MCP Registry Metadata`.

## License and Data Provenance

- Code license: ISC ([LICENSE](./LICENSE)).
- Dataset source: `darwinphi/ph-schools-dataset` (canonical repository backed by gov.ph source data).
- Use of dataset remains subject to source terms and applicable policies.
