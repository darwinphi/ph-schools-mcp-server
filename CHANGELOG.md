# Changelog

All notable changes to this project will be documented in this file.

## [1.0.3] - 2026-04-11

### Changed

- Pinned canonical dataset tag from `v1.0.0` to `v1.0.1`.
- Refreshed bundled `data.json` from canonical tag `v1.0.1`.

## [1.0.2] - 2026-04-10

### Added

- Hybrid dataset loading on server startup:
  - Use local dataset file when present.
  - Auto-sync from canonical source when dataset file is missing.
- Hybrid behavior tests (`dataset-hybrid.test.js`).
- README clarification sections for:
  - when to use `mcp.json`
  - when to use `npx`
  - when to use `npm install` and `npm start`
  - usage scenarios for VS Code and Claude Desktop

### Changed

- Startup logs now indicate whether dataset source is local or auto-synced canonical.

## [1.0.1] - 2026-04-10

### Added

- Trusted publishing-ready release workflow and docs.
- MCP Registry publication workflow integration.
- Publish hardening (`files` allowlist, `.npmignore`, package checks).
- CLI executable command support for npm distribution.

## [1.0.0] - 2026-04-10

### Added

- Initial public MCP server release for PH schools dataset.
- Core tools:
  - `search_schools`
  - `get_school_by_beis_id`
  - `list_regions`
  - `list_divisions`
  - `dataset_stats`
- Dataset sync command and basic docs.
