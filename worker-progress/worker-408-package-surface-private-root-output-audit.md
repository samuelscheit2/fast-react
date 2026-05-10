# Worker 408 - Package Surface Private Root Output Audit

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before report writing.
- Active goal status from `get_goal`: `active`.
- Active goal objective:
  `Refresh the package-surface guard after accepted private root-output facades so private files remain non-public and public export keys stay React-shaped.`

## Summary

Refreshed the package-surface guard for the accepted private root-output
facades that live behind public react-test-renderer objects/functions.

The guard now:

- Checks public runtime module own string keys, including non-enumerable
  placeholder metadata, so hidden string exports cannot drift outside the
  React-shaped public key sets.
- Snapshots the accepted private react-test-renderer root-output facade symbols:
  root request bridge, private toJSON serialization facade, private toTree host
  output metadata, and private TestInstance wrapper record.
- Requires those private facades to remain `Symbol.for(...)` properties that
  are non-enumerable, non-configurable, non-writable, and absent from public
  string keys.

No package `exports` maps were widened and no private gates were exposed as
public package exports.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-408-package-surface-private-root-output-audit.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: workers 165, 348, and
  378.
- Requested reports 391, 392, 393, and 395 were not present in this checkout.
- Inspected current package surface guard, package surface snapshot, and
  import-entrypoint smoke test.
- Inspected current package files under `packages/react`, `packages/react-dom`,
  `packages/react-test-renderer`, `packages/scheduler`, and `bindings/node`.
- Confirmed the accepted react-test-renderer private facades are symbol
  properties on public objects/functions, not public string exports:
  `fast.react_test_renderer.root_request_bridge`,
  `fast.react_test_renderer.private_tojson_serialization_facade`,
  `fast.react_test_renderer.private_totree_host_output_metadata`, and
  `fast.react_test_renderer.private_test_instance_wrapper_record`.

## Commands Run

```sh
create_goal
get_goal
git status --short
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-165-package-surface-guard.md
sed -n '<ranges>' worker-progress/worker-348-react-dom-test-utils-act-gate-after-passive-sync.md
sed -n '<ranges>' worker-progress/worker-378-package-surface-private-root-execution-audit.md
rg --files worker-progress
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs
rg -n '<private/root-output patterns>' packages/react packages/react-dom packages/react-test-renderer tests/smoke
rg -n 'Symbol|defineProperty|exports|module.exports' packages/react packages/react-dom packages/react-test-renderer packages/scheduler bindings/node
node -e '<inspect react-test-renderer public/private symbol keys>'
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check --workspace @fast-react/react-test-renderer
npm run check --workspace @fast-react/react-dom
git diff --check
git diff --stat
get_goal
```

## Verification Results

Passed:

```sh
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check --workspace @fast-react/react-test-renderer
npm run check --workspace @fast-react/react-dom
git diff --check
```

`@fast-react/react-dom` package check passed 37 node tests plus the entrypoint
smoke. npm printed the existing `minimum-release-age` warning during npm
commands; it did not affect results.

## Risks Or Blockers

- No blockers remain.
- The new symbol snapshot is intentionally strict. Future accepted private
  runtime facades on public objects/functions must update the snapshot and
  explain why they remain non-public.
- This guard verifies package/public runtime surface shape. It does not prove
  public root compatibility or public serialization behavior.

## Recommended Next Tasks

1. Keep private root-output gates behind symbols or private files, never public
   package export keys.
2. Refresh this audit after workers 391, 392, 393, or 395 land if they add
   more package-level runtime facades or new private files.

## Nested Agents

- No nested agents or explorer subagents were used.
