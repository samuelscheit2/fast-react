# worker-012-host-config-traits

## Objective

Implement the first renderer-independent host-config trait skeleton in Rust,
based on the accepted capability-grouped renderer boundary. Keep the skeleton
renderer-independent, explicit about unsupported capabilities, and scoped to
`crates/fast-react-host-config/**` plus this progress file.

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-010-initial-scaffold.md`

Other local sources inspected:

- `crates/fast-react-host-config/Cargo.toml`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `Cargo.toml`
- `worker-progress/README.md`

Representative commands run:

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '261,520p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '1,260p' worker-progress/worker-010-initial-scaffold.md`
- `rg --files -g '!ORCHESTRATOR.md' crates/fast-react-host-config worker-progress`
- `rg "HostConfig|fast-react-host-config|UnimplementedReactBehavior|unimplemented_behavior|Host" crates -g '*.rs'`
- `cargo test -p fast-react-host-config --all-features`
- `cargo fmt --all --check`
- `cargo fmt -p fast-react-host-config`
- `cargo test --workspace --all-features`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `git diff -- crates/fast-react-host-config/src/lib.rs`
- `git status --short`

Delegated checks:

- Spawned one nested read-only explorer subagent to test whether the
  capability-grouped skeleton could stay renderer-independent while preserving
  current dependent placeholder crates without out-of-scope edits. The explorer
  confirmed the approach is viable if the existing `HostConfig` shim remains
  source-compatible, capability absence uses structured errors, opaque host
  types get no unnecessary bounds, and `supports_mutation()` is bridged to the
  new capability set to avoid two unrelated sources of truth.

Did not read `ORCHESTRATOR.md`.

## Files changed

- `crates/fast-react-host-config/src/lib.rs`
- `worker-progress/worker-012-host-config-traits.md`

## Host-config implementation summary

- Replaced the placeholder-only host-config crate body with a renderer-neutral
  trait skeleton centered on opaque associated host types.
- Added `HostCapability`, `HostCapabilitySet`, `UnsupportedHostCapability`,
  `HostResult<T>`, `HostTreeUpdateMode`, and `HostTreeUpdateModeError`.
- Added canonical trait groups:
  - `HostTypes`
  - `HostIdentityAndContext`
  - `HostCreation`
  - `HostCommit`
  - `HostScheduling`
  - `MutationHost`
  - `PersistenceHost`
  - `HydrationHost`
  - `PortalHost`
  - `ResourceHost`
  - `SingletonHost`
  - `ViewTransitionHost`
  - `DiagnosticsHost`
- Added aggregate marker traits `MutationRenderer` and `PersistenceRenderer`
  for future monomorphized reconciler paths.
- Kept the existing scaffold `HostConfig` trait source-compatible for
  `fast-react-reconciler` and `fast-react-test-renderer`, then added
  `host_capabilities()` and `require_host_capability()` defaults that derive
  mutation capability from `supports_mutation()`.
- Added tests for explicit unsupported capability errors, mutation/persistence
  exclusivity, legacy capability bridging, and separate mutation trait bounds.
- Did not implement DOM, React Native, hydration, persistence, concrete
  renderer behavior, or reconciler behavior.

## Verification results

- `cargo fmt --all --check`
  - First run failed only on formatting in `crates/fast-react-host-config/src/lib.rs`.
  - Ran `cargo fmt -p fast-react-host-config`.
  - Re-ran `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-host-config --all-features`: passed.
  - 7 unit tests passed.
  - Doc tests passed.
- `cargo test --workspace --all-features`: passed.
  - 15 Rust unit tests passed across the workspace.
  - Doc tests passed for all five crates.
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`: passed.

Cargo generated transient root `Cargo.lock` and `target/` artifacts during
verification. `Cargo.lock` is outside this worker's write scope and was removed
after verification; `target/` remains an ignored build artifact.

## Deviations from worker-008 recommendation, if any

- No material deviation from worker-008's capability-grouped recommendation.
- The legacy scaffold `HostConfig` trait remains temporarily because current
  placeholder crates outside this worker's write scope import and implement it.
  This is an additive compatibility bridge, not the canonical new boundary.
- Hydration, persistence, resources, singletons, view transitions, and
  diagnostics are represented as trait surfaces and capability flags only.
  Their behavior remains unimplemented by design.

## Risks and root causes

- API stability risk: the exact Rust trait signatures may need breaking changes
  once real fiber, update payload, and renderer adapters exist. Root cause:
  this worker defines the first skeleton before a reconciler caller exists.
- Coverage risk: tests prove the skeleton compiles and capability absence is
  explicit, but they do not prove React host semantics. Root cause: DOM/native
  and reconciler behavior are intentionally out of scope.
- Compatibility risk: `HostConfig` and the canonical trait groups coexist for
  now. Root cause: dependent scaffold crates are outside this worker's write
  scope. Mitigation: the legacy mutation flag is bridged to `HostCapabilitySet`
  and tested.
- Maintainability review: capability traits avoid a monolithic host interface
  and avoid fake no-op methods for unsupported renderer modes.
- Performance review: aggregate marker traits preserve a path to generic,
  monomorphized mutation and persistence renderers rather than requiring dynamic
  dispatch in hot paths.
- Security review: DOM-sensitive behavior such as resources, singletons, event
  priority, hydration traversal, and view transitions remains renderer-owned and
  unimplemented in this crate.

## Proposed follow-up implementation tasks

1. Migrate `fast-react-reconciler` and `fast-react-test-renderer` from the
   legacy `HostConfig` shim to the canonical `HostTypes` and capability traits.
2. Add a minimal in-memory mutation test renderer that implements only the
   canonical mutation path and fails unsupported modes through
   `UnsupportedHostCapability`.
3. Add a capability matrix once a reconciler root exists: mutation-only,
   persistence-only, no tree update mode, conflicting tree update modes, and
   unsupported hydration/resource/singleton paths.
4. Revisit scheduling/event-priority associated types after the lane scheduler
   model lands so the host boundary reports priority without exposing lanes.
5. Revisit hydration and persistence trait details when fiber state for
   dehydrated Suspense/Activity boundaries and persistent child sets exists.

## Completion checklist

- [x] Read required files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Modified only `crates/fast-react-host-config/**` and this progress file.
- [x] Implemented a capability-grouped host-config trait skeleton.
- [x] Kept host handles opaque through associated types.
- [x] Made unsupported capabilities structured and explicit.
- [x] Preserved current dependent placeholder crate builds without
      out-of-scope edits.
- [x] Did not implement DOM behavior.
- [x] Did not implement React Native behavior.
- [x] Did not implement hydration behavior.
- [x] Did not implement persistence behavior.
- [x] Did not implement reconciler behavior.
- [x] Used a nested subagent to test the implementation hypothesis and
      summarized the result.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test -p fast-react-host-config --all-features`.
- [x] Ran `cargo test --workspace --all-features`.
- [x] Reviewed quality, maintainability, performance, and security
      implications.

## Handoff summary

`fast-react-host-config` now exposes the first renderer-independent host-config
trait skeleton. The canonical API uses opaque associated host types and
capability-grouped traits, while unsupported capabilities report structured
errors. The old scaffold `HostConfig` trait remains as a compatibility bridge
for current placeholder crates and maps `supports_mutation()` into the new
capability set.

Verification is green for formatting, the host-config package tests, full
workspace tests, and host-config clippy with warnings denied.
