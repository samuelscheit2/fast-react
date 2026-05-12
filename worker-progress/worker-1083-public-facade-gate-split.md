# Worker 1083: Public Facade Gate Split

## Summary

- Extracted the React DOM root public-facade blocked gate into
  `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`.
- Moved the public facade constants, blocked rows, private 503-533 promotion
  rejection rows, run/evaluate/format functions, boundary inspectors,
  validators, lifecycle operation attempts, controlled DOM shim, and required
  local helper copies into the new module.
- Kept `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
  as the compatibility surface by re-exporting the public-facade names while
  retaining the root-render E2E gate implementation.
- Preserved the root-render gate's private promotion metadata use by importing
  the public-facade 503-533 gate id and rows from the extracted module.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `worker-progress/worker-1083-public-facade-gate-split.md`

## Verification

```sh
source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs
source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-public-facade:conformance
source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-render-e2e:conformance
git diff --check
```

## Results

- Focused public-facade/root-render test command passed: 52 tests.
- `root-public-facade:conformance` passed.
- `root-render-e2e:conformance` passed.
- `git diff --check` passed.
- npm printed the existing `minimum-release-age` warning during conformance
  scripts.
