# Worker 152: Host-Config Text Content Boundary

## Goal

- Status: complete
- Objective: refine the renderer-independent host-config boundary for primitive text/children decisions and detached instance creation so complete-work and DOM adapter workers do not invent incompatible APIs
- Completion: goal tool marked complete after implementation and verification; time used 290 seconds

## Summary

Implemented a narrow host-config boundary refinement without changing existing
renderer hook signatures:

- Added `HostTextContentDecision` so future begin/complete-work code can use a
  typed renderer-owned decision instead of inventing local booleans.
- Added `DetachedHostChild` plus conversions to/from `HostChild` so detached
  initial child assembly can be expressed distinctly from mounted mutation
  operations while preserving opaque host values.
- Added default `HostCreation` helpers:
  `text_content_decision`, `detached_host_creation_mode`, and
  `append_detached_initial_child`.
- Added `InitialChildrenFinalization::requires_commit_mount` for the existing
  initial-child finalization primitive.
- Added focused host-config tests proving mutation-only hosts pass this
  detached creation boundary and no-capability hosts fail closed through the
  existing tree-update diagnostics/capability errors.

No reconciler root commit/work-loop files, JS packages, hydration, resources,
forms, singletons, or event APIs were touched.

## Changed Files

- `crates/fast-react-host-config/src/lib.rs`
- `worker-progress/worker-152-host-config-text-content-boundary.md`

`crates/fast-react-test-renderer/src/lib.rs` did not require changes because
the new trait methods have default implementations and existing hook
signatures were preserved.

## Evidence Gathered

- `WORKER_BRIEF.md` identifies React 19.2.6 as the compatibility target and
  points to the local reference clone.
- Worker 132 says complete work should create detached host instances/text,
  append terminal host children through host-config, and avoid commit or DOM
  mutation concerns.
- Worker 134 says DOM mutation adapters should consume generic
  `should_set_text_content`, `create_instance`, `create_text_instance`,
  `append_initial_child`, and `finalize_initial_children` hooks rather than
  inventing a render path.
- Worker 110 keeps DOM-specific primitive text, `dangerouslySetInnerHTML`,
  namespace, and text write rules in the DOM adapter, with the reconciler
  owning only whether child reconciliation is skipped.
- React 19.2.6 reference source uses `shouldSetTextContent` during HostComponent
  begin work, `createInstance` and `appendAllChildren` during complete work,
  `appendInitialChild` only for disconnected initial children, and
  `finalizeInitialChildren` as the commit-mount follow-up decision.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

All commands passed.

## Risks Or Blockers

- The new helpers intentionally wrap the existing hooks instead of replacing
  them. That avoids churn for current renderers, but future complete-work code
  must choose these typed helpers consistently to get the intended boundary.
- `detached_host_creation_mode` uses the existing mutation/persistence tree
  update validation. It does not add a new creation capability, which keeps the
  capability model small but means hosts still declare tree update support via
  `HostCapabilitySet`.

## Recommended Next Tasks

- Have the complete-work worker call `text_content_decision` and
  `append_detached_initial_child` rather than introducing reconciler-local
  duplicates.
- Keep DOM adapter text-content behavior behind `should_set_text_content`; the
  new host-config enum is a boundary decision, not a DOM text rules engine.
