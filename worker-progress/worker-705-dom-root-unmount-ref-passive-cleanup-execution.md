# Worker 705: DOM Root Unmount Ref/Passive Cleanup Execution

## Goal

- Status from `get_goal` before completion: `active`
- Objective: add private React DOM root-unmount evidence that consumes accepted ref cleanup and passive destroy ordering metadata for fake-DOM cleanup, while public root unmount and passive behavior remain blocked

## Summary

- Added a private `react-dom/client` facade `root.unmount` evidence path that opt-in consumes callback-ref cleanup-return execution under the existing ref callback gate.
- Added private passive deleted-subtree ref/passive/host cleanup ordering metadata to the test-utils act gate, and consumed it from the React DOM root bridge only when `privatePassiveDestroy.consumeRefCleanupExecution` is requested.
- Kept public root unmount, public ref compatibility, public passive callback execution, scheduler-driven passive execution, and compatibility claims blocked.
- Preserved the worker-674 metadata-only ref/passive path by keeping passive ordering consumption false unless the new worker-705 opt-in path is used.
- Added package and conformance coverage for the new private root-unmount ref cleanup plus passive ordering evidence.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/test-utils-act-gate.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-705-dom-root-unmount-ref-passive-cleanup-execution.md`

## Evidence Gathered

- The new root bridge diagnostic records accepted private ref cleanup execution and accepted private passive destroy ordering metadata before fake-DOM host cleanup.
- New accepted capabilities include `root-unmount-ref-cleanup-execution`, `root-unmount-passive-destroy-ordering-metadata`, and `ref-cleanup-passive-destroy-before-host-cleanup-order`.
- New blocked capabilities keep `public-root-unmount`, `public-ref-compatibility`, `passive-effect-execution`, and `compatibility-claims` blocked.
- The strict path records `privateRefCleanupExecution: true`, while public `refEffects`, `passiveEffects`, `publicRootExecution`, `publicRootUnmounted`, and `compatibilityClaimed` remain false.
- The passive ordering evidence carries both the root-bridge status and the source test-utils deleted-subtree ordering status.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/src/test-utils-act-gate.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.mjs`
- `node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "root\\.unmount.*ref"`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`

## Delegation

- Used nested explorer `/root/conformance_map` read-only to map the root facade and ref-callback conformance files that needed worker-705 admission and focused verification coverage.

## Risks Or Blockers

- No public unmount, public passive drain, public ref callback behavior, or compatibility claim is opened by this change.
- The implementation remains metadata/test-control evidence only and should not be promoted to public compatibility until scheduler-driven passive execution and public root unmount semantics are implemented.

## Recommended Next Tasks

- Continue toward a real public root unmount path only after public root execution, ref cleanup semantics, and passive effect flushing are available together.
- Keep worker-674 and worker-705 evidence separate in future admissions so metadata-only passive evidence is not mistaken for executed public passive behavior.
