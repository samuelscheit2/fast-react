# worker-069-scheduler-native-entry-oracle

## Objective

Add deterministic `scheduler@0.27.0` native entrypoint behavior oracle files for
the published native condition/file surface, export shape, descriptor behavior,
loading behavior, unsupported runtime behavior, and relationship to the default
scheduler entrypoint.

Write scope honored: only scheduler native-entry conformance files and this
report were changed.

## Progress

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Inspected the continuation state with `git status --short`; the previous run
  had three untracked scoped source files:
  - `tests/conformance/src/scheduler-native-entry-oracle.mjs`
  - `tests/conformance/src/scheduler-native-entry-probe-runner.mjs`
  - `tests/conformance/src/scheduler-native-entry-targets.mjs`
- Preserved those partial edits and added the missing native-entry generator,
  print/generate CLIs, checked test, and this progress report.
- Spawned two nested explorer agents for independent hypothesis checks:
  - published `scheduler@0.27.0` native file/runtime behavior from exact package
    artifacts;
  - existing scheduler conformance oracle patterns and gaps in the partial
    native-entry files.
- Generated the checked oracle from the exact `scheduler@0.27.0` npm tarball
  with integrity and shasum checks pinned in
  `tests/conformance/src/scheduler-native-entry-targets.mjs`.
- Added a checked oracle test that validates schema, target metadata, tarball
  file list, package metadata, evidence/conformance claims, per-mode scenario
  coverage, normalized path shape, export descriptors, unsupported native helper
  throwers, direct native CJS loading, and the print CLI.

## Oracle Coverage

The oracle covers:

- package metadata and native physical file resolution for `index.native.js`
  and both native CJS files;
- `NODE_ENV`-dependent native wrapper loading;
- native export key order, own key order, descriptors, function names/lengths,
  constants, and absence of `unstable_NoPriority`;
- fallback native runtime scheduling, request-paint/should-yield interaction,
  cancellation tombstones, and explicit `Not implemented.` throwers;
- `nativeRuntimeScheduler` constant and operation delegation;
- direct native CJS require behavior, including the guarded development CJS
  file under production `NODE_ENV`;
- the relationship between the native entrypoint and default scheduler root
  entrypoint.

## Intentional Gaps

- No Fast React scheduler behavior is compared or implemented; this is
  oracle-only.
- The probes run in isolated Node child processes with controlled globals, not
  inside a real React Native host runtime.
- Timing evidence avoids wall-clock latency claims and records deterministic
  logical values/task fields only.

## Changed Files

- `tests/conformance/src/scheduler-native-entry-oracle-generator.mjs`
- `tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `tests/conformance/src/scheduler-native-entry-probe-runner.mjs`
- `tests/conformance/src/scheduler-native-entry-targets.mjs`
- `tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-native-entry-oracle.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json`
- `worker-progress/worker-069-scheduler-native-entry-oracle.md`

## Verification Log

- `git status --short` showed only untracked files under the assigned
  scheduler-native-entry prefix plus this progress report.
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
  passed: 12 tests, 0 failures.
- `node tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs >
  <temp>/scheduler-native-entry-regenerated.json && cmp -s
  <temp>/scheduler-native-entry-regenerated.json
  tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json` passed
  with byte-for-byte match.
- `npm test --workspace @fast-react/conformance` passed: 133 tests, 0
  failures.

## Quality Review

- Maintainability: native-entry target constants, generator, probe runner,
  checked oracle helpers, and CLI wrappers follow the existing scheduler
  root/variant oracle split.
- Determinism: probe output omits generated timestamps, normalizes loaded module
  paths under `node_modules/scheduler`, normalizes error path fragments, and the
  test rejects local/temp path leaks.
- Performance: generator network/tarball work is explicit and opt-in; checked
  tests read the committed artifact and run quickly.
- Security: package evidence is fetched from npm metadata for the exact pinned
  version, checks `dist.integrity` and `dist.shasum`, verifies tarball bytes,
  avoids lifecycle scripts, and probes in throwaway directories.

## Risks Or Follow-Ups

- The oracle should be refreshed if the project target moves away from
  `scheduler@0.27.0`.
- A future implementation worker still needs to compare Fast React scheduler
  native entrypoint behavior against this oracle before claiming compatibility.
