# Fast React Master Progress

Last updated: 2026-05-09

## Current State

- Repository initialized locally on branch `main`.
- Initial scaffold and first placeholder implementation slices are merged.
- Orchestrator instructions loaded from `ORCHESTRATOR.md`.
- Worker-facing role contract added in `WORKER_BRIEF.md` so workers do not read orchestrator-only instructions.
- Current npm compatibility target checked on 2026-05-09:
  - `react` 19.2.6
  - `react-dom` 19.2.6
  - `@types/react` 19.2.14

## Active Milestone

M0: Orchestration Foundation.

## Decisions

- Use `MASTER_PLAN.md` for project plan and task dependencies.
- Use `MASTER_PROGRESS.md` for project-wide progress and decisions.
- Use `worker-progress/<worker-id>.md` for each worker's progress.
- Workers should read `WORKER_BRIEF.md`, not `ORCHESTRATOR.md`.
- Top-level workers are real Codex subprocesses launched in tmux.
- Top-level tmux workers may spawn managed Codex subagents/explorers internally when useful. Those nested agents do not count against the 30 top-level tmux worker limit and may push the aggregate agent/process count above 30.
- Do not start implementation before architecture, conformance, and scaffold hypotheses have been tested by separate workers.
- Worker runner requests `gpt-5.5` with `model_reasoning_effort="xhigh"` and uses the local yolo-equivalent Codex flag.
- Accepted architecture direction from worker-001: Rust should own renderer-agnostic React semantics behind arena/generational handles, use a capability-grouped host-config boundary, and expose a JS-compatible package facade through N-API first. WASM and third-party `react-reconciler` compatibility are deferred until conformance evidence justifies them.
- Accepted conformance direction from worker-002: React 19.2.6 compatibility must be proven by generated inventories and black-box dual-run oracle scenarios, not export names alone. Benchmarks must link to green conformance scenario IDs before they count.
- Accepted scaffold direction from worker-003: create a Cargo workspace with `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, `fast-react-test-renderer`, and `fast-react-napi`; use npm workspaces for `packages/react`, `bindings/node`, and tests; defer `react-dom`, browser WASM, and standalone scheduler crates until conformance evidence justifies them.
- Accepted renderer boundary direction from worker-008: Fast React should use opaque host handles and explicit capability traits. Mutation mode is the first implementation target, while persistence and hydration must be designed up front; DOM resources, singletons, events, and security-sensitive behavior stay in DOM adapters, not the core.
- Accepted binding direction from worker-006: use Node-API through napi-rs behind a JS-owned React compatibility facade, support Node 22+, start conservatively with N-API 8 unless evidence requires newer APIs, avoid postinstall binary downloads, and benchmark native-boundary overhead before moving hot public APIs into Rust.
- Accepted benchmark direction from worker-009: benchmarks must be admitted only through a manifest tied to green conformance scenario IDs, with pinned React 19.2.6 baselines, native-boundary overhead diagnostics, profiler artifacts, and no headline speed claims for semantically incomplete paths.
- Accepted upstream-test direction from worker-005: upstream React tests should seed and trace scenarios, but not be used as a drop-in suite. Fast React needs adapters for React's Jest harness contracts, feature gates, Scheduler mocks, noop renderer behavior, and source-only internals.
- Accepted scheduler/fiber direction from worker-007: model lane bitsets, root lane bookkeeping, Scheduler heaps, double-buffered fiber arenas, circular/rebased update queues, and flags/subtreeFlags commit traversal directly. Flat priority enums, FIFO queues, or a global effect list are root-cause mismatches.
- Accepted API inventory direction from worker-004: inventory package subpaths, runtime exports, type declarations, and environment conditions from pinned tarballs and isolated probes. `@types/react-dom@19.2.3` needs an explicit target decision before TypeScript compatibility claims include `react-dom`.
- Accepted scaffold implementation from worker-010: root Cargo/npm workspaces, placeholder Rust crates, placeholder React/native packages, conformance/smoke placeholders, and CI skeleton are merged. Real React behavior remains explicitly unimplemented and gated by future conformance-backed workers.
- Accepted conformance inventory tooling from worker-013: the conformance workspace now has deterministic pinned target metadata and tests that explicitly keep all real conformance claims false until tarball/runtime/type inventory generation exists.
- Accepted native loader boundary from worker-015: native loading remains loudly unavailable, but CJS/ESM loader metadata now exposes future platform package names, Node `>=22.0.0`, N-API floor 8, and native-specific Rust boundary errors without adding N-API dependencies.
- Accepted host-config trait skeleton from worker-012: `fast-react-host-config` now exposes opaque host types, explicit capability sets and errors, capability-grouped host traits, and a temporary legacy `HostConfig` bridge for current scaffold crates.
- Accepted core element model primitives from worker-011: `fast-react-core` now records compatibility targets, React 19.2.6 symbol tags, normalized key/ref/owner slots, placeholder element records, and typed loud-unimplemented JS conformance gaps.
- Accepted React entrypoint placeholders from worker-014: `@fast-react/react` now has inventory-aligned default and `react-server` placeholder surfaces, structured unimplemented errors, hidden scaffold metadata, and package-surface smoke tests.
- Accepted root lockfile sync from worker-016: `package-lock.json` now records `bindings/node` Node engine metadata as `>=22.0.0`; `npm ci --ignore-scripts --dry-run` passes.
- Accepted reconciler host-boundary migration from worker-019: `fast-react-reconciler` now exposes a canonical `MutationRenderer`-bounded placeholder entry point, validates mutation tree-update capability failures explicitly, keeps the legacy render placeholder only as a compatibility shim, and no longer imports the legacy `HostConfig` shim in implementation code.
- Accepted canonical mutation test renderer from worker-018: `fast-react-test-renderer` now implements the canonical host-config traits with opaque handles, in-memory container/instance/text storage, mutation operations, single-parent move behavior, snapshots, and explicit unsupported capability errors without depending on the legacy `HostConfig` shim or reconciler placeholder.
- Accepted element-object conformance probes from worker-020: React 19.2.6 element object behavior is documented from real tarball probes, including JS property descriptors, key/ref semantics, dev/prod and `react-server` differences, warning behavior, and a layer plan that keeps final public object construction in the JS facade until an oracle proves conformance.
- Accepted runtime inventory generation from worker-017: the conformance workspace now generates and checks a deterministic React 19.2.6 runtime/package inventory from exact npm metadata and integrity-verified tarballs, with runtime export probes, condition-resolution evidence, no temp path leaks, and explicit false Fast React behavior conformance claims.
- Accepted structured host operation errors from worker-022: `HostResult<T>` now carries a top-level `HostError`, unsupported capabilities remain inspectable as a distinct variant, the in-memory test renderer returns structured operation errors for invalid handles, missing insert/remove targets, cross-renderer handles, and impossible self/cycle mutations, and failed insert/remove paths preserve the existing tree.
- Accepted element-object oracle from worker-021: the conformance workspace now has a deterministic React 19.2.6 element-object oracle covering 22 scenarios across default and `react-server` development/production modes, with checked Fast React observations recorded only as known mismatches or unsupported placeholders and all compatibility claims kept false.

## Worker Roster

| Worker | Status | Assignment | Progress File |
| --- | --- | --- | --- |
| worker-001-architecture | merged | Test Rust core and renderer-boundary architecture hypotheses | `worker-progress/worker-001-architecture.md` |
| worker-002-conformance | merged | Design React 19.2.6 compatibility inventory and test strategy | `worker-progress/worker-002-conformance.md` |
| worker-003-scaffold | merged | Propose Cargo workspace, JS package scaffold, and worktree task split | `worker-progress/worker-003-scaffold.md` |
| worker-004-api-inventory | merged | Build exact public API, runtime export, subpath, and type inventory | `worker-progress/worker-004-api-inventory.md` |
| worker-005-upstream-tests | merged | Assess upstream React 19.2.6 test reuse and harness requirements | `worker-progress/worker-005-upstream-tests.md` |
| worker-006-binding-strategy | merged | Design JS-to-Rust binding and package artifact strategy | `worker-progress/worker-006-binding-strategy.md` |
| worker-007-scheduler-fiber | merged | Investigate scheduler, lanes, fiber, update queue, and effect semantics | `worker-progress/worker-007-scheduler-fiber.md` |
| worker-008-renderer-host-config | merged | Define renderer host-config boundary across DOM, native, hydration, and portals | `worker-progress/worker-008-renderer-host-config.md` |
| worker-009-benchmark-strategy | merged | Design conformance-gated benchmark and profiling strategy | `worker-progress/worker-009-benchmark-strategy.md` |
| worker-010-initial-scaffold | merged | Implement initial Cargo/npm workspace, placeholder crates/packages, smoke checks, and CI skeleton | `worker-progress/worker-010-initial-scaffold.md` |
| worker-011-core-element-model | merged | Implement first Rust core element/model primitives | `worker-progress/worker-011-core-element-model.md` |
| worker-012-host-config-traits | merged | Implement first capability-grouped host-config trait skeleton | `worker-progress/worker-012-host-config-traits.md` |
| worker-013-conformance-inventory-tooling | merged | Implement initial conformance inventory tooling placeholder | `worker-progress/worker-013-conformance-inventory-tooling.md` |
| worker-014-react-entrypoint-placeholders | merged | Improve React package placeholders and smoke tests from API inventory | `worker-progress/worker-014-react-entrypoint-placeholders.md` |
| worker-015-native-loader-boundary | merged | Improve native loader and Rust N-API boundary placeholders | `worker-progress/worker-015-native-loader-boundary.md` |
| worker-016-root-lockfile-sync | merged | Synchronize root `package-lock.json` after package metadata changes | `worker-progress/worker-016-root-lockfile-sync.md` |
| worker-017-runtime-inventory-generation | merged | Generate deterministic React 19.2.6 runtime/package inventory artifacts | `worker-progress/worker-017-runtime-inventory-generation.md` |
| worker-018-test-renderer-mutation-host | merged | Implement minimal canonical mutation test renderer | `worker-progress/worker-018-test-renderer-mutation-host.md` |
| worker-019-reconciler-host-boundary-migration | merged | Move reconciler placeholder API toward canonical host trait bounds | `worker-progress/worker-019-reconciler-host-boundary-migration.md` |
| worker-020-element-object-conformance-probes | merged | Probe React 19.2.6 element object behavior and plan safe implementation | `worker-progress/worker-020-element-object-conformance-probes.md` |
| worker-021-element-object-oracle | merged | Implement deterministic element-object conformance oracle and Fast React mismatch reporting | `worker-progress/worker-021-element-object-oracle.md` |
| worker-022-host-operation-errors | merged | Add structured host operation errors for invalid test-renderer operations | `worker-progress/worker-022-host-operation-errors.md` |
| worker-023-js-element-factory | running in tmux worktree; nested subagents allowed | Implement conformance-backed JS element factory behavior from the checked oracle | `../fast-react-worker-023-js-element-factory/worker-progress/worker-023-js-element-factory.md` |

## Next Actions

1. Monitor worker 023 and audit/merge it after it regenerates the element-object oracle and updates comparison statuses without claiming full compatibility.
2. Keep follow-up package behavior work paused until worker 023 no longer has a moving Fast React target.

## Risks And Open Questions

- React internals and public behavior are large; compatibility must be prioritized by user-visible semantics.
- Native bindings may constrain memory ownership, scheduler integration, and async behavior.
- Upstream React tests may not be reusable without a compatibility layer.
- A faster implementation can become meaningless if benchmarked before semantic parity is defined.

## Evidence Log

- 2026-05-09: `npm view react version` returned `19.2.6`.
- 2026-05-09: `npm view react-dom version` returned `19.2.6`.
- 2026-05-09: `npm view @types/react version` returned `19.2.14`.
- 2026-05-09: `tmux -V` returned `tmux 3.6a`.
- 2026-05-09: `codex --version` returned `codex-cli 0.0.0`.
- 2026-05-09: `cargo --version` returned `cargo 1.95.0`.
- 2026-05-09: `rustc --version` returned `rustc 1.95.0`.
- 2026-05-09: Initial tmux worker launch failed before doing work because `codex exec` rejected `--search`. Relaunch will omit `--search`.
- 2026-05-09: Second tmux worker launch failed before doing work because this `codex exec` build rejected `-a`. Runner now uses `--dangerously-bypass-approvals-and-sandbox` instead.
- 2026-05-09: `ORCHESTRATOR.md` was updated to move model/yolo guidance into a general guideline section. Worker brief now carries only worker-safe assumption-checking guidance.
- 2026-05-09: Relaunched workers 001, 002, and 003 in tmux with corrected worker prompts and runner flags.
- 2026-05-09: tmux worker 001 hit a Codex CLI usage-limit failure before writing `worker-progress/worker-001-architecture.md`.
- 2026-05-09: tmux workers 002 and 003 were briefly reassigned to managed subagents after CLI usage-limit failures. This violated the real-tmux-worker orchestration requirement. Those managed agents were shut down, and their generated reports were moved to `worker-progress/quarantine/` and excluded from canonical progress.
- 2026-05-09: Next valid step is to relaunch 001, 002, and 003 as real Codex processes in tmux only. Any quarantined managed-subagent content must be independently audited or regenerated by tmux workers before it can count.
- 2026-05-09: Worker relaunch plan changed to one Git worktree per worker: `../fast-react-worker-001-architecture`, `../fast-react-worker-002-conformance`, and `../fast-react-worker-003-scaffold`.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` processes inside tmux, using `script` to provide a TTY and capture logs.
- 2026-05-09: Stopped tmux workers 001, 002, and 003 after observing managed internal explorer/subagent use inside their tmux Codex sessions. No canonical worker reports had been written.
- 2026-05-09: Updated `WORKER_BRIEF.md`, task prompts, prompt template, and `scripts/run-worker.sh` to explicitly forbid managed Codex subagents/explorers inside worker sessions. Independent hypothesis tests must be requested in reports and launched by the orchestrator as separate tmux workers.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` tmux processes with the explicit managed-subagent prohibition included in both worker files and the launcher prompt.
- 2026-05-09: Policy corrected: top-level workers still launch as real tmux Codex processes, but workers may spawn managed internal subagents/explorers for their own hypothesis testing. Those nested agents do not count against the 30 top-level tmux worker cap.
- 2026-05-09: Clarified that worker-internal nested agents may push the aggregate agent/process count above 30; the limit applies only to orchestrator-launched top-level tmux workers.
- 2026-05-09: Cleanup policy clarified: regenerable artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need removal merely because they exist; remove or document them only when stale, ambiguous, or polluting scoped status.
- 2026-05-09: Stopped the three workers before accepting reports written under the superseded managed-subagent prohibition.
- 2026-05-09: Relaunched workers 001, 002, and 003 as real `codex --yolo` tmux processes with nested managed subagents allowed.
- 2026-05-09: Added six more non-overlapping research workers: public API inventory, upstream test reuse, binding strategy, scheduler/fiber model, renderer host config, and benchmark strategy.
- 2026-05-09: Accepted and merged worker-001 architecture report in commit `b5a0da1`. Closed the worker-001 tmux session after merge.
- 2026-05-09: Accepted and merged worker-002 conformance report in commit `a468c5f`. Closed the worker-002 tmux session after merge.
- 2026-05-09: Accepted and merged worker-003 scaffold report in commit `93dfe83`. Closed the worker-003 tmux session after merge.
- 2026-05-09: Queued worker-010 to implement the accepted initial scaffold after workers 001-003 were merged.
- 2026-05-09: Accepted and merged worker-008 renderer host-config report in commit `b49abb1`. Closed the worker-008 tmux session after merge.
- 2026-05-09: Accepted and merged worker-006 binding strategy report in commit `0417428`. Closed the worker-006 tmux session after merge.
- 2026-05-09: Accepted and merged worker-009 benchmark strategy report in commit `0c154d5`. Closed the worker-009 tmux session after merge.
- 2026-05-09: Accepted and merged worker-005 upstream test reuse report in commit `cc825bf`. Closed the worker-005 tmux session after merge.
- 2026-05-09: Accepted and merged worker-007 scheduler/fiber report in commit `b63b8c7`. Closed the worker-007 tmux session after merge.
- 2026-05-09: Accepted and merged worker-004 API inventory report in commit `772447d`. Closed the worker-004 tmux session after merge.
- 2026-05-09: Accepted and merged worker-010 initial scaffold implementation in commit `33e1990`. Closed the worker-010 tmux session after merge.
- 2026-05-09: Verified merged scaffold on `main` with `npm run check`, `cargo test --workspace --all-features`, and `node tests/smoke/import-entrypoints.mjs`. Removed generated `Cargo.lock` and `target/` afterward.
- 2026-05-09: Queued workers 011-015 as disjoint scaffold follow-up implementation tasks: core model, host-config traits, conformance inventory tooling, React entrypoint placeholders, and native loader boundary.
- 2026-05-09: Accepted and merged worker-013 conformance inventory tooling in commit `d990db5`. Closed the worker-013 tmux session after merge.
- 2026-05-09: Accepted and merged worker-015 native loader boundary in commit `09e6b3f`. Closed the worker-015 tmux session after merge.
- 2026-05-09: Checked `npm ci --ignore-scripts --dry-run` on main after worker-015; it passes. `package-lock.json` metadata still needs sync for the changed native package engine, so worker-016 is pending.
- 2026-05-09: Accepted and merged worker-012 host-config trait skeleton in commit `52d0763`. Closed the worker-012 tmux session after merge.
- 2026-05-09: Accepted and merged worker-011 core element model primitives in commit `24bcd4c`. Closed the worker-011 tmux session after merge.
- 2026-05-09: Verified merged Rust crates on `main` with `cargo test --workspace --all-features`.
- 2026-05-09: Accepted and merged worker-014 React entrypoint placeholders in commit `d929916`. Closed the worker-014 tmux session after merge.
- 2026-05-09: Verified merged JS/native/Rust checks on `main` with `npm run check`.
- 2026-05-09: Accepted and merged worker-016 root lockfile sync in commit `8489b58`. Closed the worker-016 tmux session after merge.
- 2026-05-09: Queued workers 017-020 as the next disjoint tranche: generated runtime inventory, canonical mutation test renderer, reconciler host-boundary migration, and element object conformance probes.
- 2026-05-09: Launched workers 017-020 as real `codex --yolo` tmux processes in disjoint worktrees.
- 2026-05-09: Accepted and merged worker-019 reconciler host-boundary migration in commit `54d2ab1`. Closed the worker-019 tmux session after merge.
- 2026-05-09: Verified merged reconciler host-boundary migration on `main` with `cargo test --workspace --all-features`; 33 unit tests and 1 compile-fail doctest passed.
- 2026-05-09: Accepted and merged worker-018 canonical mutation test renderer in commit `1212991`. Closed the worker-018 tmux session after merge.
- 2026-05-09: Verified merged canonical mutation test renderer on `main` with `cargo test --workspace --all-features`; 42 unit tests and 1 compile-fail doctest passed.
- 2026-05-09: Accepted and merged worker-020 element-object conformance probe report in commit `9d08299`. Closed the worker-020 tmux session after merge. No source tests were run because the task changed only the progress report.
- 2026-05-09: Accepted and merged worker-017 runtime inventory generation in commit `49804ae`. Closed the worker-017 tmux session after merge.
- 2026-05-09: Verified merged runtime inventory generation on `main` with `npm run check:js`; verified the merged Rust crates with `cargo test --workspace --all-features`.
- 2026-05-09: Pruned merged Fast React worker worktrees 001-020 after confirming no scoped uncommitted source changes remained. A regenerable untracked `Cargo.lock` in worker-018 was discarded as part of removing the accepted worker worktree.
- 2026-05-09: Queued workers 021-022 as the next non-overlapping tranche: element-object conformance oracle and structured host operation errors.
- 2026-05-09: Launched workers 021-022 as real `codex --yolo` tmux processes in disjoint worktrees.
- 2026-05-09: Accepted and merged worker-022 structured host operation errors in commit `4ee4c4a`. Closed the worker-022 tmux session after merge. Verified post-rebase with `cargo fmt --all --check`, `cargo test --workspace --all-features`, `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`, and `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`. Regenerable root `Cargo.lock` files remain untracked where Cargo produced them.
- 2026-05-09: Accepted and merged worker-021 deterministic element-object oracle in commit `d62d912`. Closed the worker-021 tmux session after merge. Verified post-rebase with `npm test --workspace @fast-react/conformance`, `npm run check:js`, element oracle regeneration byte-compare, and the temp/local path leak guard.
- 2026-05-09: Verified merged `main` after workers 021 and 022 with `npm run check:js`, `cargo fmt --all --check`, `cargo test --workspace --all-features`, `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`, and `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`. Root `Cargo.lock` remains an untracked regenerable artifact.
- 2026-05-09: Queued worker-023 to implement the first JS element factory behavior from the checked element-object oracle, with write scope limited to `packages/react/**`, `tests/smoke/**`, `tests/conformance/**`, and its worker report.
- 2026-05-09: Launched worker-023 as a real `codex --yolo` tmux process in `../fast-react-worker-023-js-element-factory`.
