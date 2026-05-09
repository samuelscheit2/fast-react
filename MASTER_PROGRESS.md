# Fast React Master Progress

Last updated: 2026-05-10

## Current State

- Branch: `main`.
- Scaffold, package placeholders, conformance harness, and initial React facade
  behavior slices are merged.
- Active milestone: M4-M8 closure toward a minimal end-to-end
  root render/update/unmount path.
- Local React reference source clone:
  `/Users/user/Developer/Developer/react-reference` at `facebook/react`
  `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Report-only implementation planning workers 104-117 are merged; their tmux
  sessions and worktrees are closed.
- Core source workers 047, 075, and 076 are merged; root lane bookkeeping,
  event priority, fiber flags, and hook effect flags are now in
  `fast-react-core`.

## Durable Decisions

- Workers read `WORKER_BRIEF.md`, not `ORCHESTRATOR.md`.
- Workers must set `create_goal` first and record `get_goal`
  evidence.
- Top-level workers are real tmux Codex processes; preferred launch is
  interactive TUI wrapped by `script -q -F`.
- Worker-internal nested agents are allowed and do not count against the
  30-top-level-worker cap.
- Use the React source clone for readable internals research; use npm
  tarball/runtime oracles for published behavior claims.
- Regenerable `node_modules/`, `target/`, and root `Cargo.lock` do not need
  cleanup merely because they exist.
- Keep `ORCHESTRATOR.md`, `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md` compact. Detailed history lives in git log and
  `worker-progress/*.md`.

## Accepted Direction Summary

- Rust core should own renderer-agnostic React semantics using explicit lanes,
  fibers, update queues, hooks/effects, and root scheduling state.
- Host config boundaries use opaque host handles/tokens and explicit capability
  groups. DOM/native/security/resource behavior belongs in renderer adapters.
- JS facades provide React-compatible packages while native/Rust internals grow
  behind conformance gates.
- Existing direct React facade behavior has conformance coverage for elements,
  refs, children helpers, memo/lazy, forwardRef, context object creation, and
  component class basics.
- React DOM, test renderer, scheduler, and root render work are currently driven
  by oracles plus merged implementation plans before larger source slices are
  accepted.

## Current Worker Snapshot

Top-level tmux worker count should stay at or below 30. Current live count: 13.

Ready for audit/merge based on latest pane checks:

- React DOM/client root and DOM behavior oracles: 046, 049, 060, 064, 088, 089.
- React DOM root export implementation: 054.
- React test renderer and React `act` oracles: 083, 084, 085, 086, 087, 097.

Use live `tmux capture-pane` and worktree status as the source of truth before
accepting any worker; this snapshot is only a routing aid.

## Recent Merge Batches

- Merged report-only root planning workers 077, 079, 080, 091, 092, 093, 094,
  095, 098, 099, 100, 101, 102, and 103.
- Queued implementation-planning workers 104-117 to decompose the first root
  render milestone into conflict-safe slices.
- Merged report-only implementation planning workers 104-117 and closed their
  accepted tmux sessions/worktrees.
- Merged core source workers 047, 075, and 076; verified with
  `cargo fmt --all --check`, `cargo test -p fast-react-core --all-features`,
  and `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`.
- Added and documented the local React reference source clone.

## Next Actions

1. Audit React DOM/client root workers 046, 049, 054, 060, 064, 088, and 089
   with their targeted Node tests.
2. Audit React test renderer and React `act` workers 083, 084, 085, 086, 087,
   and 097 with targeted conformance checks.
3. Launch the next conflict-safe implementation workers from the merged
   104-117 plans once prerequisite source/oracle slices are accepted.
4. After each accepted batch, update this file with only the durable delta and
   prune obsolete status lines.

## Verification Notes

- Report-only merges require scoped status, path-leak scan, trailing/conflict
  scan, and `git diff --check`.
- Oracle merges require targeted `node --test` coverage plus conformance
  workspace checks when a tranche lands.
- Rust source merges require `cargo fmt --all --check`, targeted tests, and
  clippy for touched crates.
