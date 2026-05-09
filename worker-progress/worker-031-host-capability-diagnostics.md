# worker-031-host-capability-diagnostics

## Objective

Improve `fast-react-host-config` host capability diagnostics and tests so
renderer capability sets are stable, inspectable, and harder to misuse before
the reconciler depends on them.

Write scope:

- `crates/fast-react-host-config/**`
- `worker-progress/worker-031-host-capability-diagnostics.md`

## Required sources read

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Did not read `ORCHESTRATOR.md`.

## Implementation plan and decisions

- Keep the existing capability bitset storage compact, but stop making raw
  bits the only full introspection path.
- Add a crate-owned ordered capability catalog because `HostCapability` is
  `#[non_exhaustive]` and downstream renderers cannot safely enumerate it.
- Add stable capability-set iteration and display/debug output based on
  capability names, not bit positions.
- Add unknown-bit validation for compact bit round trips so serialized or
  copied capability sets cannot silently carry undefined flags.
- Preserve exact tree update mode semantics:
  - zero mutation/persistence strategies is `Missing`
  - both strategies is `Conflicting`
  - exactly mutation or exactly persistence is valid
  - unrelated capabilities do not affect the result
- Add renderer-scoped tree update mode diagnostics without changing the
  existing low-level `tree_update_mode()` result.
- Keep the work additive. No hydration, persistence behavior, resources,
  scheduler, renderer, or reconciler behavior was implemented.

## Implementation summary

- Added `HostCapability::ALL`, `HostCapability::all()`, and
  `HostCapability::iter()` as the canonical capability order.
- Added `HostCapabilitySet::ALL`, `all()`, `from_bits()`, `is_empty()`,
  `len()`, `iter()`, `IntoIterator`, and `TryFrom<u16>`.
- Added `HostCapabilitySetIter`.
- Added `Display` and custom `Debug` for `HostCapabilitySet`, rendering stable
  capability names in canonical order.
- Added `UnknownHostCapabilityBits` for rejected compact bitsets.
- Added `HostTreeUpdateMode::as_str()` and `Display`.
- Added `HostTreeUpdateModeDiagnostic` and
  `HostCapabilitySet::validate_tree_update_mode(renderer_name)`.
- Added default `validate_tree_update_mode()` helpers on both
  `HostIdentityAndContext` and the temporary legacy `HostConfig` bridge.
- Expanded host-config unit tests from 8 to 13 tests.

## Tests added or expanded

- All defined capability variants, display names, and bit positions are covered.
- Capability names are unique.
- `HostCapability::ALL` and `HostCapability::iter()` match the canonical order.
- `HostCapabilitySet::iter()` and `IntoIterator` return supported capabilities
  in stable canonical order regardless of insertion order.
- `HostCapabilitySet` display/debug strings are stable and name-based.
- Unknown compact bits are rejected with an inspectable error.
- Unsupported capability errors preserve renderer name and capability with an
  exact display string.
- Tree update mode validation covers missing, conflicting, mutation-only,
  persistence-only, and unrelated-capability combinations.
- Tree update mode display strings are stable.
- Tree update mode diagnostics include renderer name, the full supported
  capability set, and exact missing/conflicting variants.
- Canonical and legacy host traits expose the new tree update mode validation
  helpers.

## Delegated checks

- Spawned one read-only nested explorer to inspect the current host capability
  API and test gaps. It confirmed:
  - `HostCapabilitySet` only exposed `empty`, `with`, `supports`, raw `bits`,
    `require`, and `tree_update_mode`.
  - no stable iterator/list/display diagnostic existed for the non-exhaustive
    capability enum.
  - `tree_update_mode()` already distinguished missing vs conflicting, but
    tests omitted persistence-only and unrelated-capability coverage.
  - raw bits were the practical root-cause misuse risk because downstream
    diagnostics would otherwise depend on bit layout.
- Used that result to add a canonical ordered catalog, name-based set
  diagnostics, unknown-bit validation, and broader tree update tests.

## Commands run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg --files crates/fast-react-host-config worker-progress`
- `find crates/fast-react-host-config -maxdepth 3 -type f -print`
- `sed -n '1,260p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '261,620p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '621,1120p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1121,1400p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,220p' crates/fast-react-host-config/Cargo.toml`
- `sed -n '1,240p' worker-progress/worker-012-host-config-traits.md`
- `sed -n '1,260p' worker-progress/worker-022-host-operation-errors.md`
- `rg -n "HostCapability|HostCapabilitySet|bits\\(" crates -g '*.rs'`
- `sed -n '1,220p' worker-progress/README.md`
- `cargo fmt --all`
- `cargo test -p fast-react-host-config --all-features`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `git diff -- crates/fast-react-host-config/src/lib.rs`
- `git status --short --untracked-files=all`
- `cargo fmt --all --check`
- `git diff --check -- crates/fast-react-host-config worker-progress/worker-031-host-capability-diagnostics.md`

## Verification results

- `cargo test -p fast-react-host-config --all-features`: passed.
  - 13 unit tests passed.
  - 0 doc tests.
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check -- crates/fast-react-host-config worker-progress/worker-031-host-capability-diagnostics.md`: passed.

Cargo generated an untracked root `Cargo.lock` during verification. It is a
regenerable artifact outside this worker's write scope and is not part of the
scoped source diff.

## Files changed

- `crates/fast-react-host-config/src/lib.rs`
- `worker-progress/worker-031-host-capability-diagnostics.md`

## Review

- Quality: capability diagnostics are now centralized in the host-config crate
  instead of forcing renderers or the reconciler to derive names from bit
  positions.
- Maintainability: the canonical capability order gives future renderers one
  supported enumeration path despite `HostCapability` being non-exhaustive.
- Performance: iteration is over a fixed 12-capability array and only used for
  diagnostics or validation; hot host operations still use the compact bitset.
- Security: no DOM, native, filesystem, network, hydration, resource,
  singleton, scheduler, or renderer behavior was added. Opaque host handles and
  renderer internals remain unexposed.

## Risks and follow-up tasks

- Capability declarations and trait implementations are still separate Rust
  contracts; this crate cannot reflect whether a renderer that declares a
  capability actually implements the corresponding trait. Future reconciler
  entry points should combine trait bounds with `validate_tree_update_mode()`.
- Raw `bits()` remains available for compact storage compatibility. Diagnostics
  should prefer `iter()` and `Display`; unknown bits are now rejected on
  `from_bits()`/`TryFrom<u16>`.
- Future workers should update reconciler capability checks to use
  `validate_tree_update_mode()` when that crate is in scope.

## Completion checklist

- [x] Read required files first.
- [x] Avoided `ORCHESTRATOR.md`.
- [x] Stayed within the assigned write scope for source/report edits.
- [x] Used a nested subagent to test the capability-diagnostics hypothesis.
- [x] Added stable capability introspection for `HostCapabilitySet`.
- [x] Kept mutation-vs-persistence validation exact.
- [x] Added tests for all defined capability bits.
- [x] Added tests for stable ordering.
- [x] Added tests for display strings.
- [x] Added tests for unsupported-capability errors.
- [x] Added tests for tree update mode diagnostics.
- [x] Did not implement hydration, persistence, resources, scheduler, or
      renderer behavior.
- [x] Ran `cargo test -p fast-react-host-config --all-features`.
- [x] Ran `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`.
- [x] Ran final `cargo fmt --all --check`.
