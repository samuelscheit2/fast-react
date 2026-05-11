# Worker 848: React DOM Nested Facade Native Handoff

## Summary

- Extended the private React DOM client public-facade nested host-output update
  diagnostic to mirror its nested `root.render` update request through the
  existing inert native root bridge handoff.
- Added request-bound validation before exposing nested native handoff metadata:
  the create/render admission, latest update record, native environment mirror,
  native payload identity, and active nested fake-DOM host-output state must all
  match.
- Kept the path private and diagnostic-only: public root execution, native
  execution, reconciler execution, browser DOM compatibility, hydration,
  refs/events, and compatibility claims remain blocked.
- Added positive and fail-closed package coverage plus conformance assertions for
  the new nested native update handoff metadata.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-848-react-dom-nested-facade-native-handoff.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Reviewed accepted Worker 843 report and confirmed top-level public-facade
  update/unmount native handoff metadata was already present.
- Confirmed nested public-facade host-output update diagnostics had fake-DOM
  update handoff evidence but no native update-request mirror.
- Added durable metadata fields on the nested diagnostic:
  `nativeHandoffId`, `nativeHandoffStatus`, `nativeRequestKind`,
  `nativeRequestRecord`, and `nativeUpdateRequestMirrored`.
- Added validation functions that reject non-canonical native handoff metadata,
  stale update records, foreign native records, cloned/tampered handoff objects,
  and mismatched active nested fake-DOM host output.
- Audit follow-up: revalidated live fake-DOM output after the native handoff
  factory returns, including text node content, container/parent/child text
  content, full parent/child attribute payload state, style payload state, and
  latest-props pointers.
- Added negative coverage where a factory creates the canonical handoff, mutates
  text, child attributes, child style properties, or parent attributes, returns
  the handoff, and the nested update fails closed.
- Second audit follow-up: snapshot the exact active fake-DOM host output before
  invoking the private native handoff factory, then require the post-factory
  live output to match with no extra attributes, own properties, styles, or child
  nodes on the container, parent host, child host, or text node.
- Strengthened topology validation from first-child identity to exact
  container/parent/child/text child counts, so extra siblings at any level fail
  closed before diagnostic metadata is exposed.
- Added negative coverage for extra child and parent attributes, extra child own
  properties, extra style state, and extra topology siblings.
- Third audit follow-up: fixed the remaining container-level validation gap by
  snapshotting and revalidating the container attributes, own properties, style
  state, text content, and child topology with the same exact node snapshot used
  for nested host nodes.
- Added negative coverage for factories that mutate container attributes,
  container own properties, or container style state after creating the
  canonical native handoff.
- Fourth audit follow-up: added an explicit fake-DOM listener registration
  snapshot for container, parent, child, and text nodes so in-place mutations of
  `__registrations` or `__removals` arrays fail validation before a diagnostic
  can report `listenerInstallation: false`.
- Added negative coverage for factory-time listener installation on the
  container, parent host, child host, and text node after canonical native
  handoff creation.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Verification

- Focused package test passed: 66 tests.
- Focused conformance blocked-gate test passed: 36 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 195 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- The new `nativeHandoffRecordFactory` and `nativeHandoffRecord` options are
  private diagnostic hooks used to prove fail-closed metadata validation; they do
  not expose or enable public React DOM behavior.
- This remains metadata-only. The native request is mirrored but not executed,
  and no reconciler scheduling, browser DOM compatibility, hydration, refs, or
  event compatibility is claimed.

## Recommended Next Tasks

- Keep any real native/Rust execution or public compatibility work behind
  separate gates that prove scheduling, commit, cleanup, and public behavior.
