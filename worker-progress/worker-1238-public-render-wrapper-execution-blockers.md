# Worker 1238 - public render wrapper execution blockers

## Summary

- Extended the public `createRoot().render` rejection matrix to include
  unsupported memo, forwardRef, and lazy component wrapper element types.
- Hardened the existing unsupported function component case so its body
  increments a counter and must remain uncalled.
- Added fresh-root and post-accepted minimal `div` coverage through the package
  symbol facade gate and private bridge smoke harness.
- Confirmed rejected wrapper cases do not reach the private adapter render
  handoff, mutate refs, invoke lazy loaders, install listeners, mutate fake DOM,
  or change the preserved post-accepted fake DOM state.

## Changed files

- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-1238-public-render-wrapper-execution-blockers.md`

## Commands run

- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass
- `npm --prefix tests/conformance run root-public-facade:conformance` - pass
- `npm --prefix tests/conformance run root-render-e2e:conformance` - pass
- `npm --prefix packages/react-dom run check` - pass
- `git diff --check` - pass

## Evidence gathered

- The package spy test reports only the accepted minimal `div` render reaching
  private `adapter.root.render`; all unsupported wrapper labels reject with
  `FAST_REACT_UNIMPLEMENTED` and `createRoot().render`.
- The smoke harness preserves the accepted host node, `innerHTML`, raw
  `getAttribute("id")`, latest props object, and mutation log after each
  post-accepted wrapper rejection.
- Wrapper hostile counters remain zero:
  function component body, memo wrapped function body, forwardRef render, and
  lazy loader. The forwardRef ref remains `null`, and the lazy loader error is
  never thrown because the loader is never called.
- Conformance capability rows now include all four component wrapper blocker
  labels and explicit zero-execution fields while compatibility flags remain
  false.

## Audit, review, or nested-agent findings

- No nested agents used.
- Runtime source already rejects non-string/non-`div` element types before the
  private handoff, so no runtime changes were necessary.

## Risks or blockers

- Residual risk is limited to static conformance rows not executing the hostile
  wrapper bodies themselves; package and smoke tests provide the executable
  coverage for those counters.
- No blockers remain.

## Recommended next tasks

- When broader public component rendering is intentionally opened, convert these
  fail-closed wrapper cases into explicit admission tests before enabling the
  corresponding compatibility claim.
