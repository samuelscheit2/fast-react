# worker-013-conformance-inventory-tooling

## Objective

Implement the first conformance inventory tooling inside `tests/conformance`.
The tooling must describe the pinned React 19.2.6 package targets and provide a
deterministic placeholder for future tarball, runtime, and type inventory
generation without claiming real conformance.

Write scope honored: only `tests/conformance/**` and this worker progress file
were changed. `ORCHESTRATOR.md` was not read.

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-010-initial-scaffold.md`

Implementation and inspection commands:

```sh
rg --files tests/conformance worker-progress | sort
sed -n '1,220p' tests/conformance/package.json
sed -n '1,260p' tests/conformance/README.md
sed -n '1,220p' package.json
find tests/conformance -maxdepth 3 -type f -print | sort
node tests/conformance/scripts/print-inventory.mjs --format=json
npm run inventory:placeholder --workspace @fast-react/conformance
npm run inventory:placeholder:markdown --workspace @fast-react/conformance
git diff -- tests/conformance/package.json tests/conformance/README.md tests/conformance/src/inventory-targets.mjs tests/conformance/scripts/print-inventory.mjs tests/conformance/test/inventory-placeholder.test.mjs tests/conformance/inventory/react-19.2.6-target-placeholder.json
git status --short
```

Required verification commands:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check
```

Delegated check:

- Spawned nested managed subagent `019e0dba-8be3-7a22-8932-f05ebd54c38c`
  for read-only inspection of the conformance package and worker-002,
  worker-004, and worker-010 recommendations. It confirmed the same root
  constraints: keep this first tool deterministic, avoid network/install/root
  manifest changes, track `react`, `react-dom`, `@types/react`, and auxiliary
  `@types/react-dom`/`scheduler` targets, and do not execute React packages or
  imply conformance.

## Files changed

- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/inventory/react-19.2.6-target-placeholder.json`
- `tests/conformance/scripts/print-inventory.mjs`
- `tests/conformance/src/inventory-targets.mjs`
- `tests/conformance/test/inventory-placeholder.test.mjs`
- `worker-progress/worker-013-conformance-inventory-tooling.md`

## Inventory tooling implementation summary

- Added a deterministic inventory model in
  `tests/conformance/src/inventory-targets.mjs`.
- Added the accepted compatibility targets:
  - `react@19.2.6`
  - `react-dom@19.2.6`
  - `@types/react@19.2.14`
- Added supporting targets without promoting them to official compatibility
  targets:
  - `@types/react-dom@19.2.3`, marked as requiring a project target decision.
  - `scheduler@0.27.0`, marked as a React DOM runtime dependency to track.
- Added future inventory stages for npm metadata, tarball file lists, export
  maps, default Node runtime probes, `react-server` runtime probes, and type
  declaration parsing. Every stage is explicitly marked `not-generated`.
- Added explicit conformance claim flags, all set to `false`, for behavior
  comparison, tarball downloads, runtime probing, declaration parsing, and Fast
  React versus React comparison.
- Added a checked-in stable placeholder artifact at
  `tests/conformance/inventory/react-19.2.6-target-placeholder.json`.
- Added `tests/conformance/scripts/print-inventory.mjs`, which prints the
  placeholder as JSON or Markdown using only Node built-ins.
- Replaced the one-line conformance placeholder test with Node `node:test`
  coverage that verifies exact artifact stability, target versions/subpaths,
  explicit non-conformance flags, future-stage reference integrity, and CLI
  output.
- Updated the conformance README to document the target description, commands,
  and planned future inventory/harness stages.

## Verification results

- `npm test --workspace @fast-react/conformance`: passed.
  - 5 Node tests passed.
- `npm run test:conformance`: passed.
  - Delegated to the conformance workspace test and passed the same 5 tests.
- `npm run check`: passed.
  - `cargo fmt --all --check` passed.
  - `cargo clippy --workspace --all-targets --all-features -- -D warnings`
    passed.
  - JS smoke checks passed for `@fast-react/react` and `@fast-react/native`.

Notes:

- npm printed warnings about unknown local `minimum-release-age` config. This is
  local npm configuration noise already seen by earlier workers and did not
  affect the commands.
- `npm run check` generated an untracked `Cargo.lock`; it was removed after
  verification because it is outside this worker's write scope.

## Deviations from worker-002 or worker-004 recommendations, if any

- No deviation from the recommended direction. This worker intentionally
  implements only the first deterministic placeholder and does not implement the
  full worker-002 dual-run oracle harness.
- No live tarball metadata generation was added yet. Worker-002 and worker-004
  recommend future tarball-based inventory automation, but this assignment asked
  for a deterministic placeholder that describes the target package set without
  claiming generated inventory.
- `@types/react-dom@19.2.3` is tracked as a supporting target rather than an
  accepted compatibility target because worker-004 explicitly called out that
  the project still needs a target decision for React DOM declarations.
- `scheduler@0.27.0` is tracked as a supporting target because worker-002 and
  worker-004 identify it as relevant through `react-dom`, not because Fast
  React currently exposes a scheduler-compatible package.

## Risks and root causes

- Real conformance is still unimplemented. Root cause: the project does not yet
  have the dual-run oracle harness, runtime package aliases, adapters, or Fast
  React behavior implementation. Mitigation: all conformance claim flags are
  false and future stages are `not-generated`.
- Target metadata may need updating when the compatibility target changes. Root
  cause: this placeholder is intentionally checked in and static. Mitigation:
  exact versions are tested, and future inventory automation should regenerate
  this from tarball metadata.
- The placeholder lists public subpaths but does not prove export shape,
  descriptors, thrown entrypoint behavior, runtime/type divergence, or condition
  resolution. Root cause: those require isolated probes and TypeScript parsing,
  which are future stages. Mitigation: the model names those stages explicitly.
- Future runtime probes need process isolation and timeouts. Root cause:
  worker-004 observed browser/static React DOM bundles can leave Node handles
  active. Mitigation: this placeholder executes no React package code.
- Security risk is low for this change because no third-party code is fetched
  or executed. Future tarball work must treat tarball contents as untrusted and
  avoid lifecycle scripts or repository mutation.
- Performance risk is low for this change because tests are small, local, and
  use only Node built-ins.
- Maintainability risk is controlled by byte-stable fixture tests and a target
  stage-reference integrity test.

## Proposed follow-up implementation tasks

1. Add a generator that resolves exact npm metadata and tarball integrity for
   the target packages into a temporary directory.
2. Add tarball file-list inventory generation without `npm install` or
   lifecycle scripts.
3. Parse package export maps into stable subpath and condition rows.
4. Add isolated Node runtime probes for default Node and `react-server`
   conditions, with per-subpath timeouts and explicit child-process shutdown.
5. Add TypeScript compiler API declaration inventory for `@types/react` and the
   eventual React DOM declaration target decision.
6. Add package-resolution conformance tests for exported and intentionally
   non-exported subpaths.
7. Build the future black-box dual-run oracle harness only after the inventory
   generator can describe the package surface deterministically.

## Completion checklist

- [x] Read required project and worker progress files first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Changed only `tests/conformance/**` and this worker progress file.
- [x] Did not modify root manifests or lockfiles.
- [x] Added no dependencies.
- [x] Did not implement the full dual-run oracle harness.
- [x] Described pinned `react@19.2.6` target.
- [x] Described pinned `react-dom@19.2.6` target.
- [x] Described pinned `@types/react@19.2.14` target.
- [x] Tracked `@types/react-dom@19.2.3` as a supporting decision target.
- [x] Tracked `scheduler@0.27.0` as a supporting runtime dependency target.
- [x] Added deterministic placeholder JSON artifact.
- [x] Added CLI output for JSON and Markdown placeholder formats.
- [x] Added tests that prevent accidental conformance claims.
- [x] Ran `npm test --workspace @fast-react/conformance`.
- [x] Ran `npm run test:conformance`.
- [x] Ran `npm run check`.
- [x] Used and summarized a nested subagent check.
- [x] Reviewed quality, maintainability, performance, and security implications.

## Handoff summary

The conformance workspace now has the first inventory tooling layer: a stable,
tested target description for the React 19.2.6 compatibility package set. It is
deliberately not a real inventory generator and not a conformance harness. The
checked-in artifact and tests make that boundary explicit, so future workers can
replace the `not-generated` stages with tarball, runtime, and type inventory
generation without accidentally promoting placeholder data to conformance
evidence.
