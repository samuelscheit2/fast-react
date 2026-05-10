# Private Root Output Gate

Last reviewed: 2026-05-10.

This note tracks the currently accepted private React DOM root-output pipeline.
It is a diagnostic pipeline only. It does not admit public
`react-dom/client.createRoot`, public `root.render`, public `root.unmount`,
hydration, portal mounting, browser DOM compatibility, or React DOM root
compatibility claims.

## Source Of Truth

- Gate implementation:
  `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- Focused gate CLIs:
  `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  and
  `npm run root-public-facade:conformance --workspace @fast-react/conformance`
- Root bridge smoke:
  `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- Focused tests:
  `node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
  and
  `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`

## Current Counts

The root-render E2E gate currently reports:

- Public admitted scenario-mode rows: 0
- Public blocked scenario-mode rows: 20
- Private bridge request rows compared: 18
- Private bridge request rows blocked: 2
- Private host-output diagnostic rows admitted: 16
- Private host-output diagnostic rows blocked: 4
- Portal root-render prerequisite rows accepted: 4
- Portal root-render rows blocked: 5

The public facade blocked gate currently reports:

- Accepted client-root oracle scenario-mode rows checked: 44
- Accepted root-render oracle scenario-mode rows checked: 20
- Blocked public facade rows: 12
- Blocked private bridge rows: 8
- Root-render private host-output diagnostic rows admitted: 16
- Root-render private host-output diagnostic rows blocked: 4
- Root-render portal rows blocked: 5

## Private Bridge Rows

`root-render-private-bridge-dual-run-gate-1` admits only inert private request
metadata for these scenarios, in both default Node probe modes:

- `create-root-no-render`
- `initial-host-render`
- `update-host-render`
- `replace-host-tree`
- `render-null-clears-container`
- `root-unmount`
- `double-unmount`
- `render-after-unmount`
- `flush-sync-cross-root-render`

`development-warning-boundaries` remains blocked in the private bridge request
layer because warning rows are public facade diagnostics, not private request
metadata evidence.

Private bridge rows must keep these boundaries closed: native execution,
reconciler execution, DOM mutation, marker writes, listener installation,
hydration, event dispatch, and compatibility claims.

## Private Host-Output Rows

`root-render-private-host-output-diagnostic-gate-1` admits private fake-DOM
host-output diagnostics for these scenarios, in both default Node probe modes:

- `create-root-no-render`
- `initial-host-render`
- `update-host-render`
- `replace-host-tree`
- `render-null-clears-container`
- `root-unmount`
- `double-unmount`
- `render-after-unmount`

These rows are admitted only as private fake-DOM diagnostics. Accepted evidence
includes explicit createRoot marker/listener apply and revert records,
HostComponent/HostText fake-DOM creation, property and text update handoffs,
latest-props publication, root-child replacement/clearing, component-tree
metadata detach, unmount cleanup, double-unmount no-op behavior, and the stale
render-after-unmount guard.

The private host-output layer still blocks:

- `flush-sync-cross-root-render`, pending private cross-root flush/scheduling
  evidence in this gate.
- `development-warning-boundaries`, pending private warning-boundary evidence in
  this gate.

Private host-output rows must not be treated as public root evidence. They keep
public root objects, native/Rust root bridge execution, generic reconciler
execution, hydration, event dispatch, ref effects where not explicitly covered,
browser DOM compatibility, and compatibility claims blocked.

## Public Rows That Stay Blocked

`react-dom-root-public-facade-blocked-gate-1` keeps these public boundary rows
blocked:

- `public-create-root`
- `public-hydrate-root`
- `public-hydration`
- `public-root-render`
- `public-root-unmount`
- `public-create-root-render-initial`
- `public-create-root-render-update`
- `public-create-root-unmount-call`
- `public-portal-root-render`
- `public-dom-mutation`
- `public-listener-setup`
- `public-compatibility-claim`

Portal evidence is tracked separately. CreatePortal object shape and reconciler
fail-closed diagnostics are prerequisites, but public portal root rendering,
portal mounting, portal listener setup, portal DOM mutation, and portal
compatibility remain blocked.

## Update Rule

When future workers admit a new private root-output row, update this document
and add or refresh executable smoke/gate coverage in the same change. A private
row admission should always name the admitted scenario ids, the blocked public
surfaces that remain closed, and the focused command that proves both.
