You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private react-test-renderer TestInstance query bridge preflight that ties
accepted Rust `findAll`/`findBy*` diagnostics to the CJS development private
wrapper without exposing public `.root` or TestInstance query methods.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- relevant focused conformance tests
- `worker-progress/worker-515-test-renderer-live-query-bridge-preflight.md`

Constraints:
- No public `.root`, `find*`, or `findBy*` compatibility.
- No native addon/Rust execution from JS unless already accepted private
  diagnostics are used as records.
- Preserve toTree/toJSON and act private gates.

Verification:
- Run focused Rust test-renderer query tests.
- Run create-routing and serialization local conformance tests.
- Run `cargo test -p fast-react-test-renderer --all-features`.
- Run react-test-renderer workspace check and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
