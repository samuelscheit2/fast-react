# Worker 1200 - Repair Public Unmount Smoke

## Summary

- Updated the private root-bridge shell smoke to match the accepted Worker 1194
  public minimal lifecycle slice.
- The smoke now asserts repeat public `root.render(<div id="app">again</div>)`
  updates the same fake-DOM host node and returns `undefined`.
- The smoke now asserts rendered-root public `root.unmount()` returns
  `undefined`, clears fake-DOM output, and keeps root-marker/listener side
  effects absent.
- Render-after-unmount and repeated unmount remain fail-closed with
  `FAST_REACT_UNIMPLEMENTED`.

## Changed Files

- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `worker-progress/worker-1200-repair-unmount-smoke-minimal.md`

## Checks

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node tests/smoke/react-dom-private-root-bridge-shell.mjs` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix packages/react-dom run check` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-public-facade:conformance` - passed
- `git diff --check` - passed

## Risks

- This is a smoke repair only. It does not broaden browser DOM, event,
  hydration, Scheduler, ref, portal, resource/form, controlled-input, or broad
  public React DOM compatibility claims.
