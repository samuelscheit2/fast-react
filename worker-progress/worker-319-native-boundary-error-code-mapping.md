# Worker 319: Native Boundary Error Code Mapping

Goal status: active
Goal objective: Tighten native boundary error-code mapping for root bridge
validation failures. Add deterministic Rust and JS placeholder evidence for
wrong environment, stale handles, wrong lifecycle order, and unsupported native
execution without changing package load behavior.

Started: 2026-05-10

## Summary

Added a native-boundary classification layer for private root bridge validation
failures. Wrong bridge environments, stale or retired handles, and wrong root
lifecycle ordering now map to deterministic boundary error codes while
retaining the source validation code for evidence. Unsupported native execution
still uses the existing native-export placeholder path and is kept distinct
from root bridge validation failures.

The JS native package remains a no-load placeholder. It now carries frozen
manifest/load-plan evidence for the same boundary codes and no native execution,
without adding platform package loading, native addon loading, lifecycle
scripts, or new top-level JS exports.

## Goal Setup Evidence

- `create_goal` was called first for this worker objective before research,
  file reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the
  objective recorded above.
- A later `get_goal` call before this report still returned status `active` for
  the same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added native boundary error kinds for root bridge wrong environment, stale
    handles, wrong lifecycle order, and generic private validation failure.
  - Added source validation code retention on `NativeBoundaryError`.
  - Added private mapping from `NativeRootBridgeRequestError` and
    `BridgeHandleTableError` into the native boundary family.
  - Added Rust tests proving wrong environment, stale handle, wrong lifecycle
    order, unsupported native execution, and non-React-behavior classification.
- `bindings/node/index.cjs`
  - Added frozen manifest evidence for native boundary error code mapping.
  - Added load-plan/error metadata proving native execution remains false.
  - Kept `loadNativeBinding()` throwing the existing unavailable placeholder
    error without requiring native artifacts.
- `bindings/node/test/native-no-load-guard.test.cjs`
  - Added assertions for frozen error-code mapping evidence, root bridge
    validation scenarios, and unsupported native execution metadata under the
    existing no-load guard.
- `worker-progress/worker-319-native-boundary-error-code-mapping.md`
  - Recorded goal state, evidence, verification, risks, and follow-up tasks.

## Commands Run

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg --files worker-progress | rg '(166|281|319|native|package|smoke)'`
- `sed`/`rg` inspection of workers 166, 190, 256, 269, and 281 context.
- `sed`/`rg` inspection of `crates/fast-react-napi/src/lib.rs`,
  `crates/fast-react-napi/src/handle_table.rs`, `bindings/node/index.cjs`,
  `bindings/node/index.mjs`, and native package smoke tests.
- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-no-load-guard.test.cjs`
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features native_root_bridge_boundary`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `node bindings/node/test/native-loader.test.cjs && node bindings/node/test/native-loader-esm.test.mjs`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `npm run check --workspace @fast-react/native`
- `npm run check:js`
- `git add --intent-to-add worker-progress/worker-319-native-boundary-error-code-mapping.md && git diff --check; rc=$?; git reset -- worker-progress/worker-319-native-boundary-error-code-mapping.md >/dev/null; exit $rc`

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed first-action goal policy, write scope,
  verification commands, progress report requirements, subagent policy, and no
  `ORCHESTRATOR.md` access.
- `MASTER_PLAN.md`: confirmed worker 319 is scoped to native boundary error
  code mapping in the active queue.
- `MASTER_PROGRESS.md`: confirmed workers 166 and 281 are accepted foundations
  for the private handle table and root bridge validation layer.
- Worker 166 report: confirmed deterministic environment-local handles,
  wrong-environment rejection, stale generation detection, wrong-kind checks,
  and no N-API/package wiring.
- Worker 281 report: confirmed the private root bridge validator enforces
  create/render/unmount sequencing and reports wrong environment, stale
  handles, and invalid lifecycle order without native execution.
- Worker 256 report: confirmed the native root request shape and the prior
  recommendation to map private request errors into the native boundary family.
- Worker 269 report: confirmed JS-side request handoff records must remain
  inert and no native artifacts should be loaded.
- Native package smoke tests confirmed no-load behavior is guarded against
  `.node`, optional platform packages, child process, or network module loads.
- An extra clippy pass initially caught that storing boundary metadata inside
  `NativeBoundaryError` made the `Result` error value too large. The final
  implementation derives metadata on access and the final clippy pass passed.

## Verification

- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-no-load-guard.test.cjs`: passed.
- `cargo test -p fast-react-napi --all-features native_root_bridge_boundary`:
  passed, 2 focused tests.
- `node bindings/node/test/native-no-load-guard.test.cjs`: passed.
- `node bindings/node/test/native-loader.test.cjs && node bindings/node/test/native-loader-esm.test.mjs`: passed.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 29 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed after shrinking `NativeBoundaryError`.
- `npm run check --workspace @fast-react/native`: passed. npm printed the
  existing `minimum-release-age` warning.
- `npm run check:js`: passed, including package surface guard, import smoke,
  benchmark gates, workspace checks, native package checks, and 559 conformance
  tests. npm printed the existing `minimum-release-age` warnings.
- Report-inclusive `git diff --check`: passed with this progress report added
  via intent-to-add, then unstaged.

## Risks Or Blockers

- The root bridge mapping remains private and diagnostic. It does not prove
  real N-API exports, JS value rooting, scheduler transport, reconciler root
  integration, or native execution.
- JS manifest evidence is placeholder metadata only. Future native loading
  work must keep package-load behavior guarded until real optional artifacts
  and N-API lifetime rules are intentionally introduced.
- Generic private validation failures map to a catch-all native boundary code;
  future native exports may want narrower codes once more failure modes become
  externally observable.

## Recommended Next Tasks

- Reuse this mapping when a future worker introduces an actual native request
  transport, without exposing React behavior errors as native boundary errors.
- Add native execution tests only in a worker explicitly scoped to enabling
  N-API dependencies and platform artifacts.
- Reconcile JS handoff scenario metadata with this Rust mapping if future root
  bridge validators add more source error codes.

## Delegation

No nested agents were spawned for this task.
