# Worker 789: Native Private Subpath Blocklist Refresh

Goal objective: refresh native private subpath blocklist smoke coverage for
cleanup, teardown, preflight, private diagnostic, and root-bridge names without
adding package exports, files, native addon loading paths, worker execution,
renderer/reconciler execution, or public native compatibility.

Started: 2026-05-11

## Summary

Expanded the `@fast-react/native` installed-package smoke blocklist in
`tests/smoke/import-entrypoints.mjs`. The blocklist now covers direct and
`src/` private naming variants for:

- worker-thread teardown;
- worker-thread teardown executable preflight;
- cleanup-hook preflight;
- executable preflight;
- diagnostics/private diagnostics;
- native/root/private root-bridge variants.

The native probe now verifies every blocked native subpath fails through both
CommonJS `require()` and dynamic ESM `import()` with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. The public native package export map and
package-surface snapshot expectations were not changed.

## Changed Files

- `tests/smoke/import-entrypoints.mjs`
  - Added `nativeBlockedDirectFiles` for the expanded private native subpath
    names.
  - Reused `packageFileSubpaths()` so extensionless and file-extension probes
    stay in sync.
  - Added native-only dynamic `import()` rejection coverage for the blocked
    native subpaths.
- `worker-progress/worker-789-native-private-subpath-blocklist-refresh.md`
  - Recorded scope, verification, evidence, risks, and handoff notes.

## Commands Run

- `get_goal`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n ... tests/smoke/import-entrypoints.mjs`
- `rg -n "native|blocked|private|diagnostic|preflight|teardown|cleanup|root-bridge" tests/smoke/import-entrypoints.mjs`
- `find bindings/node -maxdepth 3 -type f | sort`
- `sed -n '1,220p' bindings/node/package.json`
- `sed -n '1,260p' worker-progress/worker-764-native-worker-thread-teardown-executable-preflight.md`
- `sed -n '1,260p' worker-progress/worker-771-native-cleanup-hook-preflight.md`
- `node --check tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `git diff --check`

## Evidence Gathered

- `bindings/node/package.json` still exports only `.` and `./package.json`.
- `find bindings/node -maxdepth 3 -type f | sort` showed the native package
  still contains only `README.md`, `index.cjs`, `index.mjs`, `package.json`,
  and its existing tests; no private files or addon paths were added.
- Worker 764 and Worker 771 reports confirm the worker-thread teardown
  executable preflight and cleanup-hook preflight remain private/inert evidence
  and must not imply real Node worker-thread or N-API cleanup-hook execution.
- `node tests/smoke/import-entrypoints.mjs` passed after the new native
  `require()` and dynamic `import()` blocked-subpath probes.
- `npm run check:package-surface` passed, proving package-surface snapshots did
  not need changes.

## Verification

Passed:

- `node --check tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface`
- `git diff --check`

`npm` printed the existing unknown `minimum-release-age` config warning during
`check:package-surface`; it did not affect the result.

## Risks Or Blockers

- This worker intentionally changes only smoke coverage. It does not add
  native files, package exports, real addon loading, worker-thread execution,
  N-API cleanup-hook execution, renderer/reconciler execution, or public native
  compatibility.
- Overlap risk: other workers editing `tests/smoke/import-entrypoints.mjs` may
  need to merge around the native blocked-subpath section and native package
  probe loop.

## Recommended Next Tasks

- Keep future native private diagnostic names in `nativeBlockedDirectFiles` as
  inert blocklist probes unless and until public native compatibility is
  intentionally admitted.
- If real native addon loading is introduced later, add separate package-surface
  and runtime checks rather than weakening these private subpath guards.
