# Worker 162: Benchmark Manifest Gate

You are worker 162 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-162-benchmark-manifest-gate.md`.

Objective: add the first benchmark manifest/result schema gate that fails
closed for unsupported compatibility claims and keeps all timing data
diagnostic until conformance gates are green.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-137-conformance-benchmark-refresh.md`
- `worker-progress/worker-146-performance-gate-refresh.md`
- `tests/conformance/README.md`
- Root `package.json`

Write scope:
- New benchmark manifest/schema files under `tests/benchmarks/` or
  `tests/performance/`
- Any package script needed to run the gate
- Focused JS gate tests
- `worker-progress/worker-162-benchmark-manifest-gate.md`

Do not touch Rust reconciler/core code, DOM implementation, scheduler package
source, or conformance oracle JSON unless a manifest explicitly references it.
You are not alone in the codebase.

Implementation requirements:
- Define status vocabulary for compatibility status and timing status.
- Add a checker that rejects missing scenarios, green timing without green
  compatibility, and unknown scenario statuses.
- Add initial blocked manifests for root/test-renderer/DOM scenarios.
- Keep the command deterministic and lightweight.

Verification:
- Focused benchmark gate command
- `npm run check:js`
- `git diff --check`

