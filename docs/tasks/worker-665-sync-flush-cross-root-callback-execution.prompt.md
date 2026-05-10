# Worker 665: Sync Flush Cross Root Callback Execution

Objective: advance private sync flush execution to drain accepted visible callbacks for two roots after matching commits, proving cross-root order without opening public callback compatibility.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-reconciler/src/sync_flush.rs`, `crates/fast-react-reconciler/src/root_updates.rs`, `crates/fast-react-reconciler/src/root_scheduler.rs`, focused Rust tests, and `worker-progress/worker-665-sync-flush-cross-root-callback-execution.md`.

Keep separate from passive effects, act queues, Scheduler mock JS, and React DOM root facade work.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler sync_flush callback root_updates root_scheduler -- --nocapture`, and `git diff --check`.
