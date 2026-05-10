You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private React DOM client facade update diagnostic that routes a
public-shaped `root.render(nextElement)` through the accepted fake-DOM
host-output update bridge without opening public root compatibility.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-511-react-dom-facade-update-host-output.md`

Constraints:
- Private symbol-only adapter path only.
- Do not schedule real roots, run Rust/native from JS, mutate browser DOM,
  hydrate, dispatch events, or invoke refs/callbacks.
- Keep public `createRoot`, `hydrateRoot`, `render`, and `unmount` blocked.

Verification:
- Run syntax checks.
- Run private root bridge package tests.
- Run root bridge/mutation smoke checks if relevant.
- Run public facade blocked-gate conformance and React DOM workspace check.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
