# Worker 692 - Offscreen Hidden Update Reveal Lane

## Goal

- Status after setup: active
- Final status: complete
- Objective: add private Rust evidence that updates queued while an Offscreen
  subtree is hidden are deferred and then revealed through the expected
  lane/commit metadata without opening public Offscreen compatibility

## Summary

- Added complete-work evidence that a visible-to-hidden Offscreen transition
  with hidden child update lanes uses the private
  `DeferHiddenSubtreeUntilOffscreenLane` intent, keeps subtree bubbling and host
  mutation blocked, and rejects reveal metadata for a hide transition.
- Added root-commit evidence that a hidden HostRoot update callback is hidden
  before commit, becomes `DeferredHidden` during commit, retains
  `Default | Offscreen` update lanes, and is tied to hidden-to-visible Offscreen
  reveal commit metadata.
- Kept all new proof behind private Rust test/canary surfaces; no public
  Offscreen compatibility was opened.

## Changed Files

- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-692-offscreen-hidden-update-reveal-lane.md`

## Evidence

- `complete_offscreen_hidden_update_defers_subtree_until_offscreen_lane`
  records a hidden subtree update deferred until the Offscreen lane and verifies
  public compatibility remains blocked.
- `root_commit_offscreen_hidden_update_is_deferred_then_revealed_with_lane_metadata`
  verifies hidden callback metadata before commit, deferred callback metadata
  after commit, `Default | Offscreen` retained update lanes, matching callback
  lane commit diagnostics, and hidden-to-visible reveal handoff metadata.
- No managed subagents were used.

## Verification

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features complete_offscreen_hidden_update_defers_subtree_until_offscreen_lane -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit_offscreen_hidden_update_is_deferred_then_revealed_with_lane_metadata -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features offscreen -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features complete_work -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`
- `cargo fmt --all --check`
- `rg -n '^(<<<<<<<|=======|>>>>>>>)' crates/fast-react-reconciler/src/complete_work.rs crates/fast-react-reconciler/src/root_commit.rs worker-progress/worker-692-offscreen-hidden-update-reveal-lane.md`
- `git diff --check`

## Risks Or Blockers

- None known. This is private evidence only and does not execute Offscreen host
  visibility mutations, passive visibility effects, or public callback paths.

## Recommended Next Tasks

- Continue with adjacent private commit evidence only after host visibility and
  passive reveal queues have explicit compatibility gates.
