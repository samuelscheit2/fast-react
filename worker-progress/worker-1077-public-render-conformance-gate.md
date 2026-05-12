# Worker 1077 - Public Render Conformance Gate

## Scope

- Tightened the public React DOM root facade blocked gate with an explicit `ReactDOMClient.createRoot(container).render(React.createElement("div", null, "text"))` probe.
- Kept the probe fail-closed while public `createRoot` remains unsupported: the expected boundary is still a `FAST_REACT_UNIMPLEMENTED` throw before `root.render` is attempted.
- Added a controlled DOM shim snapshot for the public render probe and require it to stay empty: no child nodes, no text content, no DOM mutation log, no listener registrations, and no root marker writes.

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`

## Verification

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-public-facade:conformance`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-render-e2e:conformance`

All focused checks passed.

## Risks

- The gate intentionally still rejects any public `createRoot` object creation or public render execution until a later worker admits public root rendering with matching DOM mutation/listener/root marker behavior.
