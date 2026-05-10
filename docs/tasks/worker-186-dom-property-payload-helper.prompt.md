# Worker 186: DOM Property Payload Helper

You are worker 186 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-186-dom-property-payload-helper.md`.

Objective: add a private React DOM property payload helper for ordinary host
attributes and focused tests, without mutating DOM nodes, wiring public roots,
events, controlled inputs, hydration, resources, forms, or style/
`dangerouslySetInnerHTML` behavior.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-061-dom-attribute-property-oracle.md`
- `worker-progress/worker-062-dom-style-dangerous-html-oracle.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `worker-progress/worker-134-dom-mutation-refresh.md`
- Current private `packages/react-dom/src/**` helpers.
- React reference DOM property/diff code as needed.

Write scope:
- New private files under `packages/react-dom/src/` for DOM property payload
  classification/diff helpers.
- Focused JS tests under `tests/smoke/` or `tests/conformance/src/` if that
  matches existing local patterns.
- `worker-progress/worker-186-dom-property-payload-helper.md`

Do not touch public `react-dom` exports, `react-dom/client`, root markers,
event/listener files, hydration files, resource/form APIs, Rust crates,
React package files, scheduler files, or the DOM namespace helper worker's
files if they already exist. You are not alone in the codebase; do not revert
other workers' changes, and adapt if concurrent private DOM helper files exist.

Implementation requirements:
- Provide a small private helper that computes deterministic update payload
  entries from old props and new props for ordinary attribute/property cases.
- Cover at least `className`, `htmlFor`, `id`, `title`, `role`, `tabIndex`,
  `data-*`, `aria-*`, custom lowercase attributes, boolean removals, and
  removed props.
- Treat event-like props, `children`, `ref`, `key`, controlled input/select/
  textarea props, resources/singletons, `style`, and `dangerouslySetInnerHTML`
  as explicit non-payload or unsupported entries rather than silently claiming
  behavior.
- Keep the helper data-only: do not call `setAttribute`, assign DOM
  properties, attach listeners, update latest-props maps, or mutate real nodes.
- Add focused tests for insertion order, update/removal payloads, ignored
  special props, and explicit unsupported entries.
- Keep compatibility claims false; this is infrastructure for a future DOM
  host update path, not a public React DOM render claim.

Verification:
- `npm run check:js`
- Focused property payload tests you add or update
- `git diff --check`
