# Worker 951 - Native Cleanup Hook Worker Thread Currentness

## Summary

Hardened the private Rust cleanup-generation currentness canary so cleanup
handoff rows are bound to deterministic source row IDs, lifecycle row identity,
cleanup-hook worker-thread/environment identity, cleanup generation, root/value
handle identity, and consumed reentry guard status before acceptance.

This remains private/test-only evidence. It does not load native addons, run
Node worker-thread teardown, execute `napi_add_env_cleanup_hook`, invoke
renderer or reconciler output, change package exports, or claim public native
compatibility.

Audit follow-up: fixed the source-consumption gap where caller-shaped
cleanup-hook evidence IDs could mint a distinct cleanup-generation replay key
before later currentness validation rejected them. Canonical cleanup-hook role
detection now includes the source-owned evidence row ID, and cleanup-generation
source consumption rejects noncanonical root/value evidence IDs before inserting
the replay key.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added canonical cleanup-hook evidence row ID constants.
  - Included cleanup-hook worker-thread/environment and cleanup evidence row IDs
    in the cleanup-generation consumption key.
  - Included lifecycle row IDs, cleanup handoff row IDs, and cleanup evidence
    row IDs in the currentness reentry guard key.
  - Marks accepted currentness rows with the consumed reentry guard status.
  - Rejects source-record ID smuggling for cleanup handoff rows, executor row
    links, and lifecycle consumer rows.
  - Added focused regression coverage for those source-record smuggling paths.
  - Audit follow-up: rejects forged cleanup-hook evidence IDs before
    cleanup-generation source consumption/replay-key insertion and proves the
    canonical preflight can still consume afterward.
- `worker-progress/worker-951-native-cleanup-hook-worker-thread-currentness.md`
  - Worker handoff report.

## Evidence

- Positive currentness now reports
  `cleanup-generation-currentness-reentry-guard-consumed` on accepted root and
  value canary rows.
- The cleanup generation consumer replay key now includes cleanup-hook source
  worker-thread id, cleanup-hook source environment id, and root/value cleanup
  hook evidence/source row IDs in addition to executor generation, source
  environment, root handle/root id, value handle, and current cleanup
  generations.
- The currentness reentry guard key now includes lifecycle consumer row id,
  root/value cleanup handoff row ids, root/value cleanup-hook evidence row ids,
  worker-thread/environment identity, lifecycle transition, active root state,
  and root/value handle/current cleanup generations.
- New regression:
  `native_root_bridge_cleanup_generation_currentness_canary_rejects_source_record_identity_smuggling`
  rejects forged cleanup handoff IDs, forged executor-row links, and forged
  lifecycle consumer row IDs as caller-built metadata before reentry guard
  consumption.
- Audit regression:
  `native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer_rejects_forged_cleanup_evidence_ids_before_replay_key`
  rejects caller-shaped root/value cleanup-hook evidence IDs as stale/foreign
  before cleanup-generation source rows are consumed, then confirms the
  canonical preflight consumes and replays normally on the same gate.

## Commands Run

- `get_goal`
- `pwd && git status --short --branch`
- `rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/*821*' -g 'worker-progress/*892*' -g 'worker-progress/*908*' -g 'worker-progress/*923*' -g 'worker-progress/*924*' -g 'worker-progress/*940*'`
- `sed -n ... WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-{821,892,908,923,924,940}-*.md`
- `rg -n "CleanupGenerationCurrentness|cleanup_generation_currentness|cleanup_generation|Reentry|reentry|worker_thread|worker_environment|lifecycle|public native|package" crates/fast-react-napi/src/lib.rs`
- `cargo fmt --all` - passed.
- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness -- --nocapture` - initial run caught a missing test import; rerun passed, 9 tests.
- `cargo fmt --all --check` - passed.
- `cargo test -p fast-react-napi --all-features cleanup -- --nocapture` - passed, 22 tests.
- `cargo test -p fast-react-napi --all-features` - passed, 76 unit tests and 0 doctests.
- `cargo check -p fast-react-napi --all-features` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.
- Audit follow-up:
  - `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer -- --nocapture` - passed, 5 tests.
  - `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness -- --nocapture` - passed, 9 tests.
  - `cargo test -p fast-react-napi --all-features cleanup -- --nocapture` - passed, 23 tests.
  - `cargo test -p fast-react-napi --all-features` - passed, 77 unit tests and 0 doctests.
  - `cargo check -p fast-react-napi --all-features` - passed.
  - `cargo fmt --all --check` - passed.

## Blockers Preserved

- Native addon loading remains blocked.
- N-API cleanup-hook execution remains blocked.
- Node worker-thread teardown execution remains blocked.
- Renderer and reconciler output remain blocked.
- Package exports and public native compatibility remain blocked.
- JS package files were not changed, so package-surface/import smoke checks were
  not required for this worker.

## Risks Or Blockers

- No blockers.
- This remains Rust `#[cfg(test)]` private currentness evidence and does not
  prove real N-API cleanup hook execution or Node worker-thread teardown.
- `crates/fast-react-napi/src/lib.rs` remains a high-overlap native lifecycle
  file; merge conflict risk with adjacent cleanup/currentness workers is
  possible.

## Recommended Next Tasks

- Keep future real cleanup-hook work behind the same source-owned row ID,
  worker-thread/environment, lifecycle, generation, and reentry guard checks.
- If a later worker admits real N-API cleanup hooks, replace private diagnostic
  identity tokens with addon-owned hook function/argument/environment evidence
  without weakening the replay and source-record smuggling checks.
