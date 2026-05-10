# Worker 378 - Package Surface Private Root Execution Audit

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before report writing.
- Active goal status from `get_goal`: `active`.
- Active goal objective:
  `audit package-surface guards after the new private root/host-output gates and harden snapshots so private implementation files remain non-public unless explicitly intended.`

## Summary

Audited the package-surface guard after the accepted private root, host-output,
React DOM, react-test-renderer, and native gates.

The guard now snapshots the current non-public implementation file inventory
for each guarded package and fails closed if those files become public resolver
targets without an explicit snapshot update. The inventory covers the current
React private helpers and the React DOM private root/host-output implementation
files under `src/**`, including `root-bridge.js`, `root-markers.js`,
component-tree, DOM host mutation/property/text helpers, event listener paths,
resource/form gates, portal helper, flush-sync guard, and test-utils act gate.

No package `package.json` files were changed, and no public exports were
widened.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-378-package-surface-private-root-execution-audit.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: workers 165, 321,
  346, and 352.
- Worker reports 367, 368, 369, and 376 were not present in this checkout.
- Read additional current private root/host-output package reports where they
  affected the audit: workers 333, 334, 335, 337, 338, 339, 340, 342, 343, 344,
  and 345.
- Inspected `tests/smoke/package-surface-guard.mjs`,
  `tests/smoke/package-surface-snapshot.json`, package `package.json` files,
  and current package file inventories under `packages/*` and `bindings/node`.
- Confirmed current guarded package directories remain `react`, `react-dom`,
  `react-test-renderer`, and `scheduler`, with native handled separately.
- Confirmed `react-test-renderer` and `scheduler` no-exports packages still
  treat every resolver file as public physical surface.

## Implementation Notes

- Extended resolver-file discovery to include `.cjs` and `.mjs` in addition to
  `.js`, `.json`, and `.node`.
- Added a `privateImplementationFiles` snapshot field for guarded packages.
- Added guard logic that derives private implementation files by listing
  resolver-like files, subtracting public resolver files, and ignoring
  package-local `test/` fixtures.
- The guard verifies the private snapshot is sorted, unique, exists on disk,
  and remains absent from public resolver files.

## Commands Run

```sh
create_goal
get_goal
pwd
ls
git status --short
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-{165,321,346,352,367,368,369,376}*'
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-165-package-surface-guard.md
sed -n '<ranges>' worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md
sed -n '<ranges>' worker-progress/worker-346-package-surface-new-private-gates-audit.md
sed -n '<ranges>' worker-progress/worker-352-root-render-e2e-private-admissions-after-host-output.md
sed -n '<ranges>' worker-progress/worker-333-test-renderer-tojson-host-output-private-path.md
sed -n '<ranges>' worker-progress/worker-334-test-renderer-testinstance-private-query-path.md
sed -n '<ranges>' worker-progress/worker-335-test-renderer-act-scheduler-flush-private-path.md
sed -n '<ranges>' worker-progress/worker-337-react-dom-root-private-create-render-admission.md
sed -n '<ranges>' worker-progress/worker-338-dom-mutation-latest-props-commit-handoff.md
sed -n '<ranges>' worker-progress/worker-339-dom-event-plugin-target-dispatch-path.md
sed -n '<ranges>' worker-progress/worker-340-dom-ref-callback-private-invocation-gate.md
sed -n '<ranges>' worker-progress/worker-342-dom-portal-private-commit-boundary.md
sed -n '<ranges>' worker-progress/worker-343-resource-hint-private-dispatcher-dom-adapter-gate.md
sed -n '<ranges>' worker-progress/worker-344-controlled-input-private-wrapper-metadata-gate.md
sed -n '<ranges>' worker-progress/worker-345-native-root-bridge-real-handle-admission-preflight.md
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' packages/react/package.json packages/react-dom/package.json packages/react-test-renderer/package.json packages/scheduler/package.json bindings/node/package.json
rg --files packages bindings/node
node -e '<derive private implementation file inventory>'
node --check tests/smoke/package-surface-guard.mjs
npm run check:package-surface
npm run check:js
git add -N worker-progress/worker-378-package-surface-private-root-execution-audit.md
git diff --check
git diff --stat
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs`: passed.
- `npm run check:package-surface`: passed with
  `package surface snapshot guard passed`.
- `npm run check:js`: passed, including package-surface, import-entrypoint
  smoke, benchmark gates, workspace checks, native loader checks, and 586
  conformance tests.
- `git diff --check`: passed with the new worker report included via
  intent-to-add.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- No blockers remain.
- The new private implementation inventory is intentionally strict. Future
  accepted public exposure of one of these files must update both the public
  resolver snapshot and the private implementation inventory in the same
  change with rationale.
- Package-local `test/` fixtures are intentionally ignored for exports-map
  packages, but no-exports packages still expose physical resolver files and
  remain guarded by their public resolver file snapshots.

## Recommended Next Tasks

1. Keep new package-private implementation files represented in
   `privateImplementationFiles` in the same change that introduces them.
2. If workers 367, 368, 369, or 376 later add package JS/native files, rerun
   this audit after those reports and changes are present.

## Delegated Checks

- Spawned read-only explorer `package_surface_guard_gap_audit` to inspect guard
  blind spots and package inventories. It did not return findings before the
  direct audit, implementation, and verification were complete, so it was
  closed and did not affect conclusions.
