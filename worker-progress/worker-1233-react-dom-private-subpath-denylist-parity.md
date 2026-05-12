# Worker 1233 - React DOM Private Subpath Denylist Parity

## Scope

- Hardened installed-package deep-import denial checks for React DOM private implementation files.
- Kept the change limited to smoke/package-surface guards and this progress note.

## Changes

- Added the missing React DOM snapshot-private direct files to `reactDomPrivateDirectFiles`:
  - `src/client/dom-property-operations.js`
  - `src/client/hydrate-root-source-ledger.js`
  - `src/resource-form-internals-contracts.js`
  - `src/shared/form-actions.js`
- Added a sorted/unique assertion and a parity assertion that the React DOM denylist matches `package-surface-snapshot.json`.
- Extended the React DOM installed-package blocked subpath probe so dynamic `import()` must also reject with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Added exact private public-file guard entries for `hydrate-root-source-ledger.js` and `resource-form-internals-contracts.js`.

## Verification

- Passed: `node tests/smoke/import-entrypoints.mjs`
- Passed: `node tests/smoke/package-surface-guard.mjs`
- Passed: `npm run test:smoke`
- Passed: `git diff --check`

## Risk

- Narrow guard-only change. No public React DOM key/export snapshot changes intended.
