# Worker 532: Native Package Surface Guard Refresh

Goal status: active
Goal objective: Refresh native package surface guards after accepted N-API
batched JSON and teardown diagnostics so JS loaders stay deterministic without
requiring a native addon.

Started: 2026-05-10

## Summary

Refreshed the `@fast-react/native` placeholder loader and package-surface
guards for the accepted batched JSON and cross-environment teardown
diagnostics.

The top-level native package export list, package exports map, load plan, and
placeholder load behavior are unchanged. The accepted teardown diagnostics now
appear as a frozen nested gate under `nativeRootBridgeRequestShape`, alongside
the existing batched JSON parser gate. All new rows carry explicit false flags
for native addon loading, native execution, renderer execution, reconciler
execution, and React behavior errors.

No `.node` addon, platform package, child process, network module, N-API call,
renderer work, reconciler work, scheduling, commit, or public native root
behavior was added.

## Goal Setup Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the objective
  recorded above.
- A later `get_goal` before this report again returned status `active` for the
  same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `bindings/node/index.cjs`
  - Added a frozen nested cross-environment teardown diagnostic gate mirroring
    the accepted Rust handle-table rows.
  - Preserved the existing top-level native export list and fail-closed
    `loadNativeBinding()` behavior.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS snapshot/assertion coverage for the teardown gate, row fields,
    stale/wrong-environment error rows, frozen metadata, and no-execution flags.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM coverage proving the same nested teardown gate is visible through
    the existing `nativeRootBridgeRequestShape` export and remains inert.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Asserted the teardown gate is present without attempting addon/platform
    loading.
- `tests/smoke/package-surface-guard.mjs`
  - Added native surface guard checks for deterministic batched JSON runtime
    rows and teardown rows without broadening public native exports.
- `tests/smoke/import-entrypoints.mjs`
  - Added temporary `node_modules` package-probe checks for the same batched
    JSON and teardown diagnostics through package resolution.
- `worker-progress/worker-532-native-package-surface-guard-refresh.md`
  - Recorded goal evidence, implementation notes, verification, risks, and
    handoff details.

## Commands Run

- `create_goal`
- `get_goal`
- `sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md`
- `sed -n '<ranges>' docs/tasks/worker-532-native-package-surface-guard-refresh.prompt.md`
- `sed -n '<ranges>' worker-progress/worker-495-native-batched-json-transport-gate.md`
- `sed -n '<ranges>' worker-progress/worker-496-native-cross-environment-teardown-gate.md`
- `sed -n '<ranges>' worker-progress/worker-468-native-handle-table-sequence-teardown-gate.md`
- `sed -n '<ranges>' bindings/node/index.cjs bindings/node/index.mjs bindings/node/package.json bindings/node/test/*.cjs bindings/node/test/*.mjs`
- `sed -n '<ranges>' tests/smoke/package-surface-guard.mjs tests/smoke/import-entrypoints.mjs`
- `sed -n '<ranges>' crates/fast-react-napi/src/lib.rs crates/fast-react-napi/src/handle_table.rs`
- `rg -n '<native/batched/teardown/package-surface patterns>' ...`
- `find bindings/node -maxdepth 4 -type f | sort`
- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git add --intent-to-add worker-progress/worker-532-native-package-surface-guard-refresh.md`
- `git diff --check`
- Supporting inspection commands: `git status --short`, `git diff --stat`,
  `git diff`, `wc -l`, `nl`, `list_agents`, and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, no
  orchestrator takeover, verification, and handoff requirements.
- `MASTER_PLAN.md`: confirmed worker 532 is scoped to native package surface
  guard refresh.
- `MASTER_PROGRESS.md`: confirmed workers 495 and 496 were accepted and remain
  private native diagnostics with public compatibility blocked.
- Worker 495 report: confirmed batched JSON diagnostics were mirrored in the
  placeholder JS loader without loading a native addon.
- Worker 496 report: confirmed cross-environment teardown diagnostics were
  accepted in Rust and remain inert private handle-table evidence.
- Worker 468 report: confirmed stale handles after teardown and slot reuse are
  already accepted private sequence guarantees.
- Current `crates/fast-react-napi/src/lib.rs` and `handle_table.rs`: confirmed
  the accepted teardown status string, synthetic environment ids, row ids,
  stale/wrong-environment error codes, generation values, and no-execution gate
  flags.
- Current `bindings/node` tests: confirmed the package remains a placeholder
  with no platform package load path, install-time build/download script, or
  native addon dependency.

## Verification

Passed:

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node --check bindings/node/test/native-no-load-guard.test.cjs`
- `node --check tests/smoke/package-surface-guard.mjs`
- `node --check tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace @fast-react/native`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`

`npm` printed the existing `minimum-release-age` warning during npm commands;
it did not affect results.

Rust files were not changed, so `cargo test -p fast-react-napi --all-features`
was not required for this worker.

## Risks Or Blockers

- The teardown rows in the JS loader are an inert mirror of accepted Rust
  diagnostics. They do not prove real N-API cleanup hooks, JS value rooting, or
  native addon invocation.
- The nested `nativeRootBridgeRequestShape` diagnostic object is publicly
  readable, as before. The top-level package surface and native load behavior
  remain unchanged.
- Future native transport/teardown work should keep any additional diagnostics
  deterministic and paired with package-surface/import-smoke checks.

## Recommended Next Tasks

- Reuse the nested teardown and batched JSON diagnostics when real N-API
  transport invocation is intentionally introduced.
- Keep public native/root compatibility blocked until native loading, cleanup
  hooks, scheduling, commit, renderer output, and public package behavior are
  admitted together.
- If worker-thread teardown diagnostics land, add them as a separate inert
  nested gate with matching no-addon package-surface coverage.

## Delegation

Spawned read-only explorer `native_surface_guard_audit` to cross-check likely
guard touchpoints. It did not return a usable final answer before the direct
implementation and verification were complete, so it was closed and did not
affect the conclusions.
