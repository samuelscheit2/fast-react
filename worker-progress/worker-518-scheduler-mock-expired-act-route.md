# Worker 518: Scheduler Mock Expired Act Route

## Goal

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- Goal tool status: active
- Goal objective: Add private Scheduler mock expired-work act-route diagnostics that build on workers 469 and 482, proving expired mock Scheduler metadata can be recognized by the private react-test-renderer act scheduler gate without running public Scheduler flush behavior.
- `get_goal` was available and returned the same active objective.

## Summary

- Added a private top-level `scheduler/unstable_mock` diagnostic wrapper that preserves the public mock Scheduler export keys and function shapes while recording frozen expired-work metadata from a shadow schedule/cancel ledger.
- Added CJS-development-only react-test-renderer act scheduler diagnostics that validate and route accepted expired mock Scheduler metadata without invoking public Scheduler flush helpers, draining expired mock work, or touching public act queues.
- Preserved accepted mock continuation/yield/paint diagnostics by delegating the existing private diagnostic methods through the wrapped mock Scheduler diagnostics object.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-518-scheduler-mock-expired-act-route.md`

## Commands

- `node --check packages/scheduler/unstable_mock.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`

## Evidence

- Scheduler mock oracle passed 18/18 tests, including the new no-flush expired-work metadata diagnostic for development and production mock entrypoints.
- React-test-renderer act oracle passed 13/13 tests, including CJS-development routing of accepted expired-work metadata with public Scheduler callbacks still pending and uninvoked.
- React-test-renderer create-routing gate passed 13/13 tests with the new worker 518 CJS-development act scheduler gate metadata recognized.
- Scheduler and react-test-renderer workspace checks both passed the import-entrypoint/package-surface smoke inventory.
- `git diff --check` passed.

## Risks

- The top-level mock Scheduler now wraps CJS mock exports to add private metadata. Focused oracle coverage verifies public keys, helper descriptors, and behavior remain accepted, but any future direct identity checks between top-level and CJS helper functions would need to account for the wrapper.
- The no-flush expired-work metadata is intentionally diagnostic and shadow-ledger based. It is not a public Scheduler compatibility claim and does not replace the existing private drain diagnostics from worker 469.

## Next Tasks

- Keep the route CJS-development scoped unless a future accepted gate needs the same metadata in index or production test-renderer facades.
- If public Scheduler flush behavior later opens, add a separate compatibility gate that compares this metadata route against real flush execution without weakening the no-flush diagnostic.

## Delegation

- No nested agents were used.
