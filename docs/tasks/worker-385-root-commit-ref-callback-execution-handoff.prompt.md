# Worker 385: Root Commit Ref Callback Execution Handoff

Objective: connect root-commit ref attach/detach metadata to a private
callback-ref execution handoff record that proves attach, cleanup-return
detach, and changed-ref ordering without invoking public roots.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 174, 245, 340, 371, and 377 if
present.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`,
`crates/fast-react-reconciler/src/host_tokens.rs`,
`packages/react-dom/src/client/ref-callback-gate.js`, focused Rust/JS tests,
and `worker-progress/worker-385-root-commit-ref-callback-execution-handoff.md`.

Keep object refs, public root error routing, and public React DOM ref
compatibility blocked.

Verification: run `cargo fmt --all --check`, focused `root_commit` ref tests,
`node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs`, relevant
React DOM package tests, and `git diff --check`.
