# Worker 998 - Rust HostText Commit Currentness

## Summary

- Added source-currentness to private HostText update payload records and
  required it before applying HostText commit execution canaries.
- Split HostText text-record mutation into a preflight step and a consume step
  so stale text records, missing/caller-shaped currentness, cross-sibling
  currentness, and replay fail before a second fake host call.
- Hardened the private HostText commit execution request by revalidating
  root-token, finished-work/current identity, commit/request order, mutation
  apply record identity, HostText tag/state/update flags, and public blocker
  shape before payload consumption.
- Kept public React DOM, react-test-renderer, native renderer, package, public
  root rendering, and broad renderer compatibility claims blocked.

## Changed Files

- `crates/fast-react-reconciler/src/host_nodes.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-998-rust-host-text-commit-currentness.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and accepted reports for Workers
  948, 954, 973, 980, 985, 991, and 997.
- Worker 991 already covered root replacement with stable previous/trailing
  HostText sibling topology, so this worker focused on the narrower HostText
  update execution gap after a root commit handoff.
- The positive canary now records applied HostText update currentness with the
  source handle, root, current fiber, token, phase, and text target before
  accepting the private execution.
- Negative canaries reject tampered finished-work request identity, missing
  source currentness, cross-sibling currentness, stale host tokens, wrong-root
  host text handles, unchanged payloads, and replay/double-consume before
  additional host calls.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features host_text_update_commit_execution -- --nocapture
cargo test -p fast-react-reconciler --all-features host_work_root_replacement -- --nocapture
cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture
cargo test -p fast-react-reconciler --all-features root_work_loop -- --nocapture
cargo test -p fast-react-reconciler --all-features host_work -- --nocapture
cargo test -p fast-react-reconciler --all-features
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
git diff --cached --check
```

## Verification Results

- Focused HostText commit execution filter: passed, 7 tests.
- `host_work_root_replacement`: passed, 22 tests.
- `root_commit`: passed, 108 tests.
- `root_work_loop`: passed, 119 tests.
- `host_work`: passed, 91 tests.
- Full `fast-react-reconciler`: passed, 886 unit tests plus 1 doctest.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- Formatting plus unstaged and staged whitespace diff checks passed.

## Risks Or Blockers

- No blockers.
- This remains private Rust `RecordingHost`/host-node-store evidence only. It
  does not claim public React DOM, react-test-renderer, native, package,
  public root rendering, text mutation compatibility, or broad renderer
  compatibility.
- The new request tamper helper is test-only and exists only to assert the
  fail-closed HostText execution gate.

## Recommended Next Tasks

- If future root-work-loop or sync-flush paths consume this HostText execution
  request directly, keep the request and payload currentness preflight before
  any host call.
- Add separate private evidence before widening to public renderer text
  mutation behavior or keyed/multi-level HostText update compatibility.
