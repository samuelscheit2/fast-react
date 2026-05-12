Worker 1097 progress

- Created isolated worktree from main at b99841e3.
- Extracted the private host-output diagnostic gate, fake-DOM harness, host-output validation, and shared cross-root host-output helpers into `tests/conformance/src/react-dom-root-render-e2e-private-host-output-gate.mjs`.
- Kept `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs` as the compatibility import/re-export surface.
- Verification passing so far:
  - `node --check` for the aggregator and new host-output module.
  - `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`.
  - `npm --prefix tests/conformance run root-render-e2e:conformance`.
  - `npm --prefix tests/conformance run root-public-facade:conformance`.
