# Worker 1232 - Public Render Capability Rejection

## Summary

- Added narrow hostile coverage for public `react-dom/client.createRoot(...).render(...)` inputs that remain outside the accepted fake-DOM `div` text/number plus optional `id` lifecycle.
- Verified fresh-root and post-accepted-render rejections for event/listener props, refs, broader browser DOM shapes, hydration-adjacent props/options, resource/form/controlled-input inputs, and function components.
- Added adapter-spy evidence that rejected public render inputs throw before the private facade adapter root `render` method is called.
- No source behavior changes were needed.

## Changed Files

- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `worker-progress/worker-1232-public-render-capability-rejection.md`

## Evidence

- Unsupported public render inputs are rejected on a fresh root with no container children, no root marker, no listener marker, no listener registrations, no mutations, no callback invocation, and no ref mutation.
- Unsupported public render inputs after an accepted render preserve the previous fake-DOM host node, `innerHTML`, raw `getAttribute("id")`, latest props object, and mutation logs.
- The mocked private adapter receives exactly one `root.render` call for the accepted minimal `div` render and zero calls for rejected hostile inputs.
- `hydrateRoot` options and callbacks remain blocked with callback count `0` and untouched containers.

## Verification

- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass
- `npm --prefix tests/conformance run root-public-facade:conformance` - pass
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass
- `npm --prefix packages/react-dom run check` - pass
- `git diff --check` - pass

## Risks Or Blockers

- Residual risk is limited to duplication between the package test and smoke hostile-case matrices. The conformance rows intentionally remain narrow blocker ledger evidence and do not claim public React DOM compatibility.

## Recommended Next Tasks

- If public root support expands beyond the minimal fake-DOM path, add source-level admission for each new capability with matching negative tests that prove unrelated public surfaces remain blocked.
