# Worker 226: Ref Attach/Detach Commit Metadata

Objective: add deterministic, data-only ref attach/detach metadata to the
private commit path using accepted host token lifecycle primitives, without
calling JS refs, exposing public instances, mutating DOM/native output, running
layout effects, or changing public renderer behavior.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 066, 139, 174, 187, 193, and 197.
- Inspect `crates/fast-react-reconciler/src/root_commit.rs`,
  `host_tokens.rs`, `host_nodes.rs`, and core fiber/ref-related types.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/root_commit.rs`.
- Secondary: `crates/fast-react-reconciler/src/host_tokens.rs` tests/accessors
  only if required.
- Report: `worker-progress/worker-226-ref-attach-detach-commit-metadata.md`.
- Do not edit DOM component-tree maps, public React ref objects, test-renderer,
  or master docs.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
