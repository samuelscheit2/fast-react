# Worker 598: Root Callback Visible Invocation Gate

## Goal

- Status: active
- Objective: Add a private root-callback invocation gate that can invoke accepted visible callbacks in deterministic commit order without exposing public callback compatibility.
- Goal tool: `create_goal` and `get_goal` were available and used before research or edits.

## Progress

- Added a private HostRoot visible-callback invocation-after-commit canary that consumes accepted queued callback order snapshots.
- The gate validates the accepted queue-order snapshot against the committed visible callback snapshot before invoking the existing test-control callback drain.
- Rejections are recorded for stale committed callback order, hidden/deferred callbacks, and wrong-root callback handles before any test-control invocation.
- Public JS callback behavior, root error callback behavior, and hidden callback invocation remain blocked.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_callbacks -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features callback_order -- --nocapture`
- `git diff --check`
- Result: all passed.

## Notes

- Commit: included in the current worker branch HEAD.
- No nested subagents were used.
