# Worker 776: hydrateRoot Recoverable-Error Preflight

## Summary

- Added a private hydration-boundary recoverable-error preflight record for
  text mismatch metadata.
- Wired the `react-dom/client.hydrateRoot` private facade preflight to attach
  that recoverable-error preflight evidence beside its existing marker/listener
  preflight evidence.
- The new record accepts only the same boundary-owned recoverable-error
  metadata and accepted private metadata snapshot, rejects stale or tampered
  metadata, and remains diagnostic-only.
- Public `hydrateRoot` and public root execution remain blocked: no public root
  object, native/reconciler execution, DOM mutation, event replay, recoverable
  queueing, callback invocation, or compatibility claim was enabled.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-776-hydrateroot-recoverable-error-preflight.md`

## Commands Run

- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs --test-name-pattern "recoverable|hydrateRoot|public hydrateRoot"`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot facade preflight|hydrateRoot|public facade"`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot facade preflight|public facade"`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Hydration-boundary conformance now proves accepted recoverable-error metadata
  can be preflighted without invoking `onRecoverableError`.
- The preflight validates the original `hydrateRoot` options object when
  provided, consumes the boundary-owned accepted metadata row, and exposes
  counts for recoverable rows, queued rows, and would-queue rows.
- Negative tests reject stale cloned metadata and tampered recoverable-error
  rows before any callback or mutation path can run.
- Root bridge/facade tests prove the private hydrateRoot preflight record now
  carries the recoverable-error preflight, keeps callback counts at zero, and
  keeps public compatibility flags false.
- Package surface and import smoke checks passed without public export or
  runtime facade surface changes.

## Risks Or Blockers

- No blockers found.
- The new preflight intentionally requires at least one recorded text mismatch
  recoverable-error row; no-mismatch hydration records remain outside this
  diagnostic evidence path.
- The preflight does not replace the existing private callback invocation gate;
  it records metadata only and does not mutate the source frozen metadata.

## Recommended Next Tasks

- Keep public `hydrateRoot` blocked until real hydration root construction,
  hydratable target claiming, text patching, recoverable error queueing,
  callback timing, event replay, and DOM mutation are proven together.
- If future native hydration handoff records are added, route them through a
  separate private gate rather than promoting this metadata preflight.
