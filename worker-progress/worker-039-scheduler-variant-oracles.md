# worker-039-scheduler-variant-oracles

## Objective

Add deterministic scheduler variant and deep-import inventory/oracle files for
`scheduler@0.27.0`.

Write scope honored: only scheduler variant conformance files and this report
were changed.

## Summary

Added a checked, deterministic oracle for `scheduler@0.27.0` variant entrypoints
and physical deep imports. The oracle fetches exact npm metadata, verifies the
published tarball integrity and shasum recorded by worker 034, extracts it into
a temporary `node_modules` tree, and probes isolated Node child processes in
development and production modes.

The oracle covers:

- package metadata: no `exports`, no explicit `main`, no `type`, no runtime
  dependencies, no engines, and exposed `scheduler/package.json`;
- physical resolution for `scheduler/index.js`, `scheduler/index.native.js`,
  `scheduler/unstable_mock(.js)`, `scheduler/unstable_post_task(.js)`, and all
  shipped `scheduler/cjs/*` files;
- `scheduler/unstable_mock` deterministic helper behavior, including virtual
  time, logs, priority context, priority ordering, delayed work, continuations,
  paint yielding, expired work, cancellation tombstones, and reset behavior;
- `scheduler/unstable_post_task` plain Node failure and controlled shim behavior
  for priority mapping, cancellation, deadline yielding, continuations with and
  without `scheduler.yield`, and no-op paint/frame APIs;
- `scheduler/index.native.js` fallback behavior and
  `nativeRuntimeScheduler` delegation shape;
- direct deep CJS require behavior, including environment-sensitive
  `scheduler-unstable_post_task.development.js` behavior.

No scheduler package implementation was added.

## Compatibility Gate Recommendation

First-milestone compatibility gates:

- `scheduler/package.json` and package root shape. Consumers can inspect package
  metadata, and the package has no exports map, explicit main, type, runtime
  dependencies, or engines.
- `scheduler/unstable_mock`. It is a real public subpath and is needed before
  upstream React-style scheduler tests can be reused deterministically.
- Root physical JavaScript entry-file importability. The absence of an exports
  map means `index.js`, `index.native.js`, `unstable_mock.js`, and
  `unstable_post_task.js` are physically importable; a first scaffold should
  not accidentally block those paths.

Documented gaps for the first milestone:

- `scheduler/unstable_post_task` behavior. It depends on browser Task
  Scheduling API globals and should wait for a controlled browser-like harness
  before behavior compatibility is claimed.
- `scheduler/index.native.js` behavior. The oracle documents fallback and native
  delegation shape, but DOM-focused scheduler work can defer implementation.
- Exact `scheduler/cjs/*` behavior parity. All shipped CJS files are physically
  resolvable because there is no exports map; broad deep-CJS behavior parity
  should follow root and mock behavior.

## Changed Files

- `tests/conformance/src/scheduler-variant-targets.mjs`
- `tests/conformance/src/scheduler-variant-probe-runner.mjs`
- `tests/conformance/src/scheduler-variant-oracle.mjs`
- `tests/conformance/src/scheduler-variant-oracle-generator.mjs`
- `tests/conformance/scripts/generate-scheduler-variant-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-variant-oracle.mjs`
- `tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json`
- `worker-progress/worker-039-scheduler-variant-oracles.md`

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md`
- `sed -n '260,520p' worker-progress/worker-034-scheduler-package-inventory.md`
- `sed -n '1,220p' worker-progress/worker-033-react-dom-inventory.md`
- `rg --files tests/conformance | sort`
- `git status --short`
- `sed -n '1,240p' tests/conformance/src/scheduler-variant-oracle.mjs`
- `sed -n '1,1040p' tests/conformance/src/scheduler-variant-probe-runner.mjs`
- `sed -n '1,240p' tests/conformance/src/scheduler-variant-targets.mjs`
- `sed -n '1,260p' tests/conformance/src/wrapper-object-oracle-generator.mjs`
- `sed -n '260,620p' tests/conformance/src/wrapper-object-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/runtime-inventory-generator.mjs`
- `sed -n '1,260p' tests/conformance/test/wrapper-object-oracle.test.mjs`
- `cat tests/conformance/package.json`
- `sed -n '1,220p' tests/conformance/test/runtime-inventory.test.mjs`
- `sed -n '1,180p' tests/conformance/src/runtime-inventory.mjs`
- `sed -n '1,220p' tests/conformance/src/inventory-targets.mjs`
- `node scripts/generate-scheduler-variant-oracle.mjs --write`
- `node scripts/print-scheduler-variant-oracle.mjs --format=markdown`
- `node -e "<oracle shape summary>"`
- `wc -c tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json`
- `node - <<'NODE' ... <post-task/native/mock oracle inspection> ... NODE`
- `node - <<'NODE' ... <resolution/native fallback inspection> ... NODE`
- `node --test test/scheduler-variant-oracle.test.mjs`
- `node scripts/print-scheduler-variant-oracle.mjs --format=markdown | sed -n '14,24p'`
- `tmpfile=$(mktemp); node scripts/generate-scheduler-variant-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" oracles/scheduler-0.27.0-variant-oracle.json; status=$?; rm -f "$tmpfile"; exit $status`
  - Failed before comparison because the shell treated `status` as a read-only
    variable.
- `tmpfile=$(mktemp); node scripts/generate-scheduler-variant-oracle.mjs > "$tmpfile"; cmp -s "$tmpfile" oracles/scheduler-0.27.0-variant-oracle.json; rc=$?; rm -f "$tmpfile"; exit $rc`
- `npm test --workspace @fast-react/conformance`
- `rg -n "<local-temp-path leak patterns>" tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json worker-progress/worker-039-scheduler-variant-oracles.md`
- `rg -n "[ \t]+$" tests/conformance/oracles/scheduler-0.27.0-variant-oracle.json worker-progress/worker-039-scheduler-variant-oracles.md tests/conformance/src/scheduler-variant-*.mjs tests/conformance/scripts/generate-scheduler-variant-oracle.mjs tests/conformance/scripts/print-scheduler-variant-oracle.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `node --check tests/conformance/src/scheduler-variant-oracle-generator.mjs && node --check tests/conformance/src/scheduler-variant-oracle.mjs && node --check tests/conformance/src/scheduler-variant-probe-runner.mjs && node --check tests/conformance/src/scheduler-variant-targets.mjs && node --check tests/conformance/scripts/generate-scheduler-variant-oracle.mjs && node --check tests/conformance/scripts/print-scheduler-variant-oracle.mjs && node --check tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `git status --short`

## Evidence Gathered

- The generator verifies `scheduler@0.27.0` registry metadata against worker
  034's pinned integrity and shasum before extracting package contents.
- The checked oracle records all 15 shipped tarball files and exact package
  metadata relevant to Node resolution.
- `require.resolve` probes show every targeted physical root and CJS subpath is
  resolvable because the package has no exports map.
- `scheduler/unstable_mock` probes confirm the deterministic helper surface and
  virtual scheduling behavior required by upstream-style tests.
- `scheduler/unstable_post_task` probes confirm plain Node throws
  `ReferenceError: window is not defined`, while a controlled Task Scheduling
  API shim exposes root-like exports and browser priority mapping.
- Native probes confirm fallback scheduling/task shape, explicit
  `Not implemented.` throwers, paint yielding, and native runtime delegation for
  constants, schedule/cancel, priority, yield, paint, and time APIs.
- Deep CJS probes show direct imports are physically resolvable. Most load; the
  post-task CJS files vary by file and `NODE_ENV`, so the oracle records require
  behavior separately from resolution.
- The regenerated oracle byte-compared equal to the checked artifact.
- `npm test --workspace @fast-react/conformance` passed with 91 tests.
- The oracle/report local path leak check and scoped trailing whitespace check
  returned no matches.
- Node syntax checks passed for all scheduler variant source, script, and test
  files.

## Delegated Checks

No nested agents were spawned. The worker brief allows them, but the continuation
instruction for this run explicitly said not to spawn nested agents and to finish
from the accepted worker 033/034 reports and local repo patterns.

## Risks Or Blockers

- The post-task shim is a controlled Node-side probe, not a real browser
  conformance harness. Browser timing and integration behavior remains a gap.
- Native variant behavior is documented but not implemented. It should stay a
  documented gap until React Native-style consumers become an active milestone.
- Broad direct `scheduler/cjs/*` behavior compatibility can increase package
  maintenance cost. The first implementation should gate importability and then
  expand exact behavior only after root and mock scheduler behavior are green.
- This oracle does not compare Fast React to scheduler because no scheduler
  implementation was in scope.

## Recommended Next Tasks

- Implement the scheduler package scaffold without blocking the physical
  root-entry files or `scheduler/package.json`.
- Add root scheduler behavior oracles if worker 038 is not already accepted,
  then implement heap/timer/continuation/priority behavior against those
  oracles.
- Implement `scheduler/unstable_mock` as a first-milestone behavior gate before
  enabling upstream React-style tests that alias the scheduler package.
- Add a browser-like post-task harness before claiming
  `scheduler/unstable_post_task` behavior compatibility.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The oracle is generated from exact package artifacts and records claims
  explicitly. Compatibility claims remain false because this worker did not
  implement or compare a Fast React scheduler package.
- Probes normalize paths to `node_modules/...` or error messages without local
  temp paths.

Maintainability:

- Variant target data, probing, generation, printing, and tests are separated in
  the same style as existing conformance oracles.
- Gate recommendations live in `scheduler-variant-targets.mjs` so reports and
  tests share the same source.

Performance:

- The generator does bounded package fetch/extract work and uses one child
  process per scenario and mode. Runtime tests read the checked artifact and do
  not regenerate it.

Security:

- No lifecycle scripts are run. The package code executes only inside temporary
  probe projects with pinned tarball integrity verification.
- The post-task and native probes install minimal controlled globals inside
  isolated child processes so global mutation does not leak across tests.
