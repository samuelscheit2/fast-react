# Worker 216: DOM Event Listener Priority Wrapper

Objective: wire the private React DOM root listener shell to deterministic
event-priority wrapper records for supported discrete/continuous/default event
names, without SimpleEventPlugin extraction, event dispatch queues, DOM node
maps, hydration replay, controlled restore, or public root behavior changes.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 041, 048, 065, 089, 141, 170, and 171.
- Inspect `packages/react-dom/src/events/**` and root listener guard files.

## Write Scope

- Primary: `packages/react-dom/src/events/**`.
- Secondary: focused event listener/priority tests only.
- Report: `worker-progress/worker-216-dom-event-listener-priority-wrapper.md`.
- Do not edit root bridge, component-tree maps, mutation adapter, Rust crates,
  or master docs.

## Verification

- `node --check` for touched JS files.
- Focused event-priority/root-listener tests.
- `npm run check:js`
- `git diff --check`
