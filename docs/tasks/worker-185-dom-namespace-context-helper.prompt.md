# Worker 185: DOM Namespace Context Helper

You are worker 185 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-185-dom-namespace-context-helper.md`.

Objective: add a private React DOM owner-document and namespace context helper
for future DOM host creation, with focused tests for HTML/SVG/MathML namespace
transitions, without wiring public roots, mutation commit, hydration, events,
resources, forms, or attributes.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `worker-progress/worker-061-dom-attribute-property-oracle.md`
- `worker-progress/worker-063-dom-namespace-svg-oracle.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- Current private `packages/react-dom/src/**` helpers.
- React reference DOM namespace/context code as needed.

Write scope:
- New private files under `packages/react-dom/src/` for DOM namespace and
  owner-document helpers.
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/` if that
  matches existing local patterns.
- `worker-progress/worker-185-dom-namespace-context-helper.md`

Do not touch public `react-dom` exports, `react-dom/client`, root markers,
event/listener files, hydration files, resource/form APIs, Rust crates,
React package files, or scheduler files. You are not alone in the codebase;
do not revert other workers' changes, and adapt if concurrent private DOM
helper files already exist.

Implementation requirements:
- Model a small private host context object that carries an owner document and
  current namespace.
- Provide helpers for deriving the child namespace from parent namespace and
  tag name, including SVG, MathML, and SVG `foreignObject` returning to HTML.
- Provide a creation helper that chooses `createElement` versus
  `createElementNS` from the context and returns the created node.
- Keep the helper data-only and side-effect-light: no attributes, listeners,
  root markers, container mutation, hydration, resources, forms, or public API
  behavior.
- Add focused tests using a fake document object that records which creation
  path was used, so the tests do not require a browser or jsdom.
- Keep compatibility claims false; this is infrastructure for future DOM host
  creation, not a public React DOM render claim.

Verification:
- `npm run check:js`
- Focused namespace helper tests you add or update
- `git diff --check`
