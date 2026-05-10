# Worker 174: Ref Token Lifecycle

## Goal

- Status: complete
- Objective: strengthen host token/ref lifecycle tests and records for future ref detach/attach commit phases without implementing ref callbacks or public instance lookup

## Progress

- 2026-05-10: Goal created and confirmed with `get_goal`.

## Summary

Strengthened the reconciler host token store around future ref lifecycle use
without adding ref callbacks, public-instance lookup, DOM node maps, commit
traversal, or JS package changes.

The implementation now makes token metadata reads and token invalidation
phase/target scoped, matching validation. A caller that asks for metadata or
invalidation through the wrong phase or wrong target gets
`WrongPhase`/`WrongTarget`, and the active token is left valid for its original
scope. This closes the gap where scoped lookup arguments were accepted but not
checked outside `validate`.

The tests now cover:

- commit-phase instance tokens reserved for future ref attach/public-instance
  lookup
- deletion-phase instance tokens reserved for future ref detach/deleted
  instance cleanup
- deletion-phase text tokens without treating text as a public ref target
- stale tokens after invalidation
- wrong phase and wrong target for validate, metadata, and invalidation
- wrong root, wrong fiber, `NONE`, and missing token IDs
- opaque metadata that exposes root/phase/target/generation/active state only

## Context Read

- `WORKER_BRIEF.md`
- `worker-progress/worker-051-dom-host-token-boundary.md`
  - The prompt named `worker-progress/worker-051-host-token-boundary.md`, but
    that file is absent in this checkout.
- `worker-progress/worker-066-dom-ref-callback-oracle.md`
- `worker-progress/worker-139-passive-ref-refresh.md`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- Focused host token definitions in `crates/fast-react-host-config/src/lib.rs`
- Focused test-renderer token validation context in
  `crates/fast-react-test-renderer/src/lib.rs`

## Changed Files

- `crates/fast-react-reconciler/src/host_tokens.rs`
- `worker-progress/worker-174-ref-token-lifecycle.md`

No changes were made to `crates/fast-react-reconciler/src/test_support.rs`.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,220p' worker-progress/worker-051-host-token-boundary.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,220p' worker-progress/worker-066-dom-ref-callback-oracle.md
sed -n '1,520p' worker-progress/worker-139-passive-ref-refresh.md
sed -n '1,620p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,620p' crates/fast-react-reconciler/src/test_support.rs
sed -n '580,720p' crates/fast-react-host-config/src/lib.rs
sed -n '740,980p' crates/fast-react-host-config/src/lib.rs
sed -n '340,410p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1028,1084p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1468,1558p' crates/fast-react-test-renderer/src/lib.rs
rg --files worker-progress
rg "HostFiberTokenPhase|HostFiberTokenTarget|HostFiberTokenViolation|HostFiberTokenStore|host_tokens" -n crates/fast-react-reconciler crates/fast-react-host-config crates/fast-react-test-renderer
git status --short --untracked-files=all
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features host_tokens
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
git diff -- crates/fast-react-reconciler/src/host_tokens.rs
```

## Verification

- `cargo fmt --all --check`: passed
- `cargo test -p fast-react-reconciler --all-features host_tokens`: passed,
  7 tests
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`:
  passed
- `git diff --check`: passed

## Evidence Gathered

- `HostFiberTokenPhase` currently has creation, hydration, commit, and deletion
  phases; there is no separate public ref phase in `fast-react-host-config`.
- Future ref attach can be represented by commit-phase instance token validity,
  and future ref detach/deleted cleanup can be represented by deletion-phase
  instance token validity until a real ref/public-instance boundary lands.
- Existing token records were already opaque: they store root id, fiber id,
  phase, target, generation, and active state only.
- Before this worker, `validate` checked phase/target but `metadata` and
  `invalidate` ignored the phase/target arguments after token lookup.

## Delegated Checks

No nested agents or explorers were used.

## Risks Or Blockers

- This is still a host token store hardening slice only. It does not implement
  commit traversal, ref callback execution, object refs, public instance
  lookup, DOM node maps, or deleted-subtree cleanup.
- The host-config API does not currently expose a distinct ref token phase.
  This worker intentionally keeps future ref attach/detach represented by
  existing commit/deletion instance token scopes.

## Recommended Next Tasks

1. Wire commit traversal to issue commit/deletion instance tokens at the actual
   host operation sites.
2. Add the fake ref store and operation-log tests after mutation/layout commit
   phases can switch `root.current`.
3. Keep DOM node maps and public instance lookup renderer-specific and behind
   token validation.
