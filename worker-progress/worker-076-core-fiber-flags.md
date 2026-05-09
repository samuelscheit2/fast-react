# worker-076-core-fiber-flags

## Objective

Implement core fiber flags and hook effect flags as renderer-agnostic Rust
bitsets.

## Goal Setup

- `create_goal` was called for this exact worker objective before research,
  file reads, implementation audit, or verification in this continuation.
- `get_goal` was called immediately after goal setup. Active goal status:
  `active`. Active goal objective: `Implement core fiber flags and hook effect
  flags as renderer-agnostic Rust bitsets.`

## Summary

- Added `FiberFlags(u32)` as a transparent combinable bitset in
  `fast-react-core`, matching React 19.2.6 `ReactFiberFlags.js` constants,
  aliases, host/static masks, and commit phase masks.
- Added `HookEffectFlags(u8)` as a transparent combinable bitset matching React
  19.2.6 `ReactHookEffectTags.js`.
- Exported both bitsets and their valid-bit masks from `fast-react-core`.
- Preserved renderer independence: these modules contain no fiber topology,
  root state, update queues, commit traversal, host handles, JS callbacks, or
  renderer APIs.

No breaking changes were needed. The change is additive and keeps later fibers,
roots, update queues, hook effect rings, and commit traversal out of scope.

## Exact Coverage

Fiber flag constants covered:

- `NoFlags`, `PerformedWork`, `Placement`, `Update`, `Cloned`,
  `ChildDeletion`, `ContentReset`, `Callback`, `DidCapture`,
  `ForceClientRender`, `Ref`, `Snapshot`, `Passive`, `Hydrating`,
  `Visibility`, and `StoreConsistency`.
- Non-commit flags: `Incomplete`, `ShouldCapture`,
  `ForceUpdateForLegacySuspense`, `DidPropagateContext`, `NeedsPropagation`,
  and `Forked`.
- Static/dev flags: `SnapshotStatic`, `LayoutStatic`, `RefStatic`,
  `PassiveStatic`, `MaySuspendCommit`, `ViewTransitionNamedStatic`,
  `ViewTransitionStatic`, `PlacementDEV`, `MountLayoutDev`, and
  `MountPassiveDev`.

Fiber flag aliases covered:

- `Hydrate = Callback`
- `ScheduleRetry = StoreConsistency`
- `ShouldSuspendCommit = Visibility`
- `ViewTransitionNamedMount = ShouldSuspendCommit`
- `DidDefer = ContentReset`
- `FormReset = Snapshot`
- `AffectedParentLayout = ContentReset`
- `RefStatic = LayoutStatic`
- `ViewTransitionNamedStatic = SnapshotStatic | MaySuspendCommit`

Masks covered:

- `LifecycleEffectMask`
- `HostEffectMask`
- `StaticMask`
- `BeforeMutationMask`
- `BeforeAndAfterMutationTransitionMask`
- `MutationMask`
- `LayoutMask`
- `PassiveMask`
- `PassiveTransitionMask`

React feature policy for masks:

- `enableCreateEventHandleAPI = false`
- `enableUseEffectEventHook = true`
- Therefore the active `BeforeMutationMask` is `Snapshot | Update`.
- Alternate before-mutation mask constants for the create-event-handle and
  minimal branches are exposed for future feature-policy changes, but the
  canonical active mask follows the React 19.2.6 OSS defaults.

Hook effect flags covered:

- `NoFlags`
- `HasEffect`
- `Insertion`
- `Layout`
- `Passive`
- Phase helpers for `HasEffect | Insertion`, `HasEffect | Layout`, and
  `HasEffect | Passive`.

Focused tests cover exact bits, aliases, active and alternate mask membership,
empty flags, unknown-bit rejection/truncation, static/host filtering, phase
filtering, and bitwise `|`, `&`, `^`, `!`, and set-difference behavior.

## Source Evidence

- Required worker evidence:
  - `worker-progress/worker-007-scheduler-fiber.md`
  - `worker-progress/worker-030-core-lane-model.md`
  - `worker-progress/worker-071-core-fiber-flags-effect-plan.md`
  - `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- Direct React 19.2.6 source files checked from the `v19.2.6` tag:
  - `packages/react-reconciler/src/ReactFiberFlags.js`
  - `packages/react-reconciler/src/ReactHookEffectTags.js`
  - `packages/shared/ReactFeatureFlags.js`

Nested-agent hypothesis check:

- Spawned read-only explorer `019e0ee9-beaf-7bd0-8591-02c87cbad6b0` in this
  continuation to independently compare the scoped bitsets against the merged
  plan and React 19.2.6 source. The first `wait_agent` timed out after 60
  seconds; the later completion notification reported no mismatches. It
  independently confirmed the exact fiber flag constants, aliases, masks, hook
  effect tag bits, and the React 19.2.6 OSS before-mutation feature-policy
  branch used here.

## Changed Files

- `crates/fast-react-core/src/fiber_flags.rs`
- `crates/fast-react-core/src/hook_effect_flags.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-076-core-fiber-flags.md`

## Verification

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-core --all-features` passed: 33 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
  passed.
- `git diff --check` passed.
- `git diff --no-index --check -- /dev/null <new-file>` produced no whitespace
  errors for each untracked scoped new file. The command returns `1` for
  ordinary no-index differences, so it was wrapped to accept return codes
  `0..=1`.

## Completion Audit

- Objective: satisfied by adding renderer-agnostic `FiberFlags(u32)` and
  `HookEffectFlags(u8)` bitsets and exporting them from `fast-react-core`.
- Write scope: satisfied. Current scoped changes are only
  `crates/fast-react-core/src/fiber_flags.rs`,
  `crates/fast-react-core/src/hook_effect_flags.rs`,
  `crates/fast-react-core/src/lib.rs`, and this report. The untracked root
  `Cargo.lock` is a regenerable Cargo artifact and is documented under risks.
- React-style combinable bitsets: satisfied by transparent newtypes plus
  `BitOr`, `BitAnd`, `BitXor`, `Sub`, `Not`, and assign variants.
- Required masks: satisfied by exact-value tests for host effect, static,
  before-mutation, before/after mutation transition, mutation, layout,
  passive, passive transition, and hook phase masks.
- Focused tests: satisfied by unit tests for exact bits, aliases, empty flags,
  constructors, mask membership, phase filtering, and bitwise operations.
- Out-of-scope guardrail: satisfied. No fibers, roots, update queues, hook
  effect rings, reconciler traversal, host handles, or renderer behavior were
  implemented.
- Required verification commands: satisfied; all four required commands passed
  on the final source state, with additional no-index whitespace checks for
  untracked new files.
- Progress report: satisfied by this file, including exact coverage and
  intentionally deferred flags/work.

## Commands Run

- `create_goal` tool for the worker objective
- `get_goal` tool to confirm active status and objective
- `pwd && rg --files | sort | sed -n '1,160p'`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '261,620p' MASTER_PLAN.md`
- `sed -n '621,980p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '261,620p' MASTER_PROGRESS.md`
- `sed -n '621,980p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '261,360p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '1,260p' worker-progress/worker-030-core-lane-model.md`
- `sed -n '1,300p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '301,620p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '621,760p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '1,300p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `sed -n '301,620p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `sed -n '621,920p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `wc -l WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-030-core-lane-model.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `git status --short --untracked-files=all`
- `rg --files crates/fast-react-core worker-progress`
- `sed -n '1,260p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,760p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,220p' crates/fast-react-core/Cargo.toml`
- `sed -n '1,420p' crates/fast-react-core/src/fiber_flags.rs`
- `sed -n '421,860p' crates/fast-react-core/src/fiber_flags.rs`
- `sed -n '1,360p' crates/fast-react-core/src/hook_effect_flags.rs`
- `git diff -- crates/fast-react-core/src/lib.rs crates/fast-react-core/src/fiber_flags.rs crates/fast-react-core/src/hook_effect_flags.rs`
- `git ls-files crates/fast-react-core/src/fiber_flags.rs crates/fast-react-core/src/hook_effect_flags.rs worker-progress/worker-076-core-fiber-flags.md Cargo.lock`
- `find <temp-dir> -path '*ReactFiberFlags.js' -print`
- `find <temp-dir> -path '*ReactHookEffectTags.js' -print`
- `rg -n "ReactFiberFlags|ReactHookEffectTags|enableUseEffectEventHook|enableCreateEventHandleAPI" -S .`
- `curl -L --fail --silent <react-19.2.6-ReactFiberFlags-url> | sed -n '1,260p'`
- `curl -L --fail --silent <react-19.2.6-ReactHookEffectTags-url> | sed -n '1,160p'`
- `curl -L --fail --silent <react-19.2.6-ReactFeatureFlags-url> | rg -n "enableCreateEventHandleAPI|enableUseEffectEventHook|enableViewTransition|enableComponentPerformanceTrack"`
- `sed -n '1,260p' <react-19.2.6-source>/ReactFiberFlags.js`
- `sed -n '1,120p' <react-19.2.6-source>/ReactHookEffectTags.js`
- `rg -n "enableCreateEventHandleAPI|enableUseEffectEventHook" <react-19.2.6-source>/ReactFeatureFlags.js`
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `spawn_agent` read-only explorer for flag/mask verification.
- `wait_agent` for the nested explorer, timed out after 60 seconds.
- `git diff --check`
- `git diff --no-index --check -- /dev/null crates/fast-react-core/src/fiber_flags.rs`
- `git diff --no-index --check -- /dev/null crates/fast-react-core/src/hook_effect_flags.rs`
- `git diff --no-index --check -- /dev/null worker-progress/worker-076-core-fiber-flags.md`
- Final audit `git status`, `git diff --stat`, `rg`, and `sed` checks over
  the scoped files and report.

## Intentionally Deferred

- No React 19.2.6 `ReactFiberFlags.js` flag constants are intentionally
  omitted.
- Fiber mode flags, lane/root bookkeeping, fiber topology, subtree flag
  bubbling, deletion arrays, hook effect rings, update queues, roots,
  reconciler commit traversal, passive flushing, refs, callbacks, host
  mutation data flow, and renderer behavior are intentionally deferred to the
  later implementation slices identified by workers 071 and 072.
- Dynamic build-time feature switching is intentionally deferred. This slice
  encodes the React 19.2.6 OSS feature policy as constants and exposes
  alternate before-mutation masks for future policy changes.

## Quality Review

- Quality: the flags are modeled as transparent bitsets with exact-value tests,
  so later fibers can combine and filter flags without enum rewrites.
- Maintainability: React naming is preserved, aliases are explicit, and
  feature-policy-dependent masks are tested directly.
- Performance: all helpers are allocation-free bit operations over `u32` or
  `u8` newtypes.
- Security: this change introduces no unsafe code, host pointers, JS callback
  execution, file I/O, networking in library code, or renderer-owned values.

## Risks Or Blockers

- Commit-order conformance cannot be proven until fiber topology, hook effect
  rings, update queues, and reconciler commit traversal exist.
- Future DOM/events work may need to revise the explicit feature policy if Fast
  React targets a different React feature-flag build.
- Root `Cargo.lock` is an untracked regenerable artifact produced by Cargo and
  left in place per worker cleanup policy.

## Recommended Next Tasks

1. Implement core fiber topology with `flags`, `subtreeFlags`, `deletions`,
   `lanes`, `childLanes`, and alternates.
2. Implement the per-fiber hook effect ring using `HookEffectFlags`.
3. Add complete-work bubbling helpers that preserve static flags on bailouts.
4. Add reconciler commit traversal only after the fiber data model can store
   the canonical masks from this slice.
