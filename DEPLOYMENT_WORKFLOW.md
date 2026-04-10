# Deployment Workflow

This document describes how to deploy `@darwinphi/ph-schools-mcp-server` using GitHub Actions, npm Trusted Publishing, and MCP Registry publication.

## Prerequisites

1. GitHub repository: `darwinphi/ph-schools-mcp-server`
2. npm package exists: `@darwinphi/ph-schools-mcp-server`
3. npm Trusted Publisher configured for:
   - Owner: `darwinphi`
   - Repository: `ph-schools-mcp-server`
   - Workflow filename: `cd.yml`
4. GitHub workflow files exist:
   - `.github/workflows/ci.yml`
   - `.github/workflows/cd.yml`
   - `.github/workflows/publish-registry.yml`

## Release Types

- Patch/minor/major release:
  - Publish npm package
  - Publish MCP Registry metadata
  - Use `Release MCP Server` workflow
- Metadata-only update:
  - Publish MCP Registry metadata only
  - Use `Publish MCP Registry Metadata` workflow

## Standard Release Workflow

1. Update data/version metadata in repository:
   - Update pinned dataset tag in `src/constants.js` if needed
   - Bump package version with npm:

```bash
npm version patch   # or: npm version minor / npm version major
```

   - Sync `server.json` version to match `package.json`

2. Validate locally:

```bash
npm ci
npm test
npm run test:package
npm run release:verify -- --version <new_version> --dataset-tag <dataset_tag>
```

3. Push changes and tags:

```bash
git push
git push --tags
```

4. Create GitHub Release notes from the tag:

```bash
gh release create v<new_version> --generate-notes --title "v<new_version>"
```

Example:

```bash
gh release create v1.0.2 --generate-notes --title "v1.0.2"
```

5. Push commit and tag (`v<new_version>`). Tag push triggers GitHub Actions workflow `CD Release`.

6. Confirm workflow success:
   - npm publish step succeeded
   - MCP Registry publish step succeeded

7. Verify published package:

```bash
npx --yes --package @darwinphi/ph-schools-mcp-server@<new_version> -- ph-schools-mcp-server --help
```

## Metadata-Only Publish Workflow

Use this when `server.json` changed but npm package release is not needed.

1. Update `server.json` and push to `main`.
2. Trigger `Publish MCP Registry Metadata` workflow.
3. Confirm run succeeds.

## Rollback / Recovery

If a release fails:

1. Identify failing step from Actions logs.
2. Fix issue in repo.
3. Re-run workflow for same version only if package was not published.
4. If npm version already published, bump to a new version and re-run release.

## Notes

- Do not use long-lived `NPM_TOKEN` for normal releases; rely on npm Trusted Publishing (OIDC).
- `npm start` is for local repo development.
- MCP clients (VS Code/Claude) should use config-based startup (`mcp.json` / client config).
