# Worker 314: Hydration Marker Parser Root Bridge Integration

## Goal Tool State

- `create_goal` succeeded as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Integrate the private
  hydration marker parser with the root bridge hydration boundary gate so
  `hydrateRoot` requests can record accepted marker evidence without marking
  containers, installing listeners, or mutating DOM.
- A final `get_goal` before this report still showed the same objective with
  status `active`.

## Summary

- Added a private root bridge `hydrateRoot` request record that delegates to the
  existing hydration boundary gate and marker parser.
- Unsupported `hydrateRoot` request records now carry deterministic accepted
  marker evidence, parser diagnostics, marker/listener guard snapshots, and the
  private hydration boundary record.
- Root bridge admission accepts the private hydrate request only as record-only
  metadata; native handoff remains fail-closed for hydrate requests.
- Public `react-dom/client.hydrateRoot` remains an unsupported placeholder.
- No container marking, listener installation, DOM mutation, event replay,
  hydratable cursor mutation, root scheduling, or hydrated commit work was
  added.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-314-hydration-marker-parser-root-bridge-integration.md`

`packages/react-dom/src/client/hydration-marker-parser.js` was inspected and
verified but did not require code changes.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Inspected worker reports 169, 246, and 275. Worker 310 was not present in
  this worktree.
- Confirmed the existing parser is read-only and deterministic over
  `childNodes`, comment data, and template attributes.
- Confirmed the hydration boundary gate already records unsupported
  `hydrateRoot` diagnostics without root creation or side effects.
- Confirmed the root bridge previously modeled only create/render/unmount
  private records, so the new hydrate request path is private and record-only.
- Verified private hydrate bridge records keep marker evidence tied to the
  underlying hydration boundary record and hidden payloads.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
find worker-progress -maxdepth 1 -type f \( -name '*169*' -o -name '*246*' -o -name '*275*' -o -name '*310*' \) -print | sort
sed -n '1,260p' worker-progress/worker-169-hydration-boundary-skeleton.md
sed -n '1,260p' worker-progress/worker-246-hydration-container-marker-parser.md
sed -n '1,260p' worker-progress/worker-275-hydration-marker-root-bridge-gate.md
find worker-progress -maxdepth 1 -type f -name '*310*' -print | sort
git status --short
sed -n '1,420p' packages/react-dom/src/client/hydration-marker-parser.js
sed -n '1,760p' packages/react-dom/src/client/root-bridge.js
sed -n '1,520p' packages/react-dom/src/client/hydration-boundary-gate.js
sed -n '1,420p' packages/react-dom/test/hydration-boundary.test.js
sed -n '1,620p' tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
rg -n "hydrateRoot|recordUnsupportedHydrateRoot|HydrationBoundary|hydration" packages/react-dom/src packages/react-dom/test tests/conformance/test tests/conformance/src
node --check packages/react-dom/src/client/hydration-marker-parser.js
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/hydration-boundary.test.js
node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test packages/react-dom/test/hydration-boundary.test.js
node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
npm run check:js
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-314-hydration-marker-parser-root-bridge-integration.md; rc=$?; if [ "$rc" -eq 1 ]; then exit 0; else exit "$rc"; fi
get_goal
```

## Verification

- `node --check` passed for:
  - `packages/react-dom/src/client/hydration-marker-parser.js`
  - `packages/react-dom/src/client/hydration-boundary-gate.js`
  - `packages/react-dom/src/client/root-bridge.js`
  - `packages/react-dom/test/hydration-boundary.test.js`
  - `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 3
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 7 tests.
- `node --test tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`:
  passed, 8 tests.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 3 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed, 7 tests.
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`:
  passed, 10 tests.
- `npm run check:js`: passed, including package surface, smoke entrypoints,
  benchmark gates, package checks, native loader checks, and 560 conformance
  tests. npm emitted the existing `minimum-release-age` warning.
- `git diff --check`: passed.
- `git diff --check --no-index /dev/null worker-progress/worker-314-hydration-marker-parser-root-bridge-integration.md`:
  passed for the new untracked progress file after normalizing the expected
  no-index diff exit code.

## Risks Or Blockers

- The new private hydrate request is diagnostic-only. It does not create a
  hydration root, consume markers into dehydrated boundaries, schedule work,
  mutate DOM, replay events, or call into native/Rust.
- Root bridge native handoff intentionally rejects hydrate records until real
  hydration root construction and scheduling exist.
- Marker evidence remains tied to the accepted React DOM 19.2.6 marker
  snapshot; target updates should refresh the oracle, parser classification,
  boundary gate, and root bridge tests together.

## Recommended Next Tasks

- Add real hydration root construction only after reconciler hydration state,
  initial hydration scheduling, and hydratable cursor ownership are designed.
- Keep event replay blocked until dehydrated root/boundary ownership exists
  without DOM mutation.
- Extend hydrate request metadata toward native/Rust handoff only after a
  record-only request can be replaced by a real fail-closed execution boundary.

## Nested Agents

- None spawned.
