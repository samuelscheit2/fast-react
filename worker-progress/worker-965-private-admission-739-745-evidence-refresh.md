# Worker 965: Private Admission 739-745 Evidence Refresh

## Status

- Complete.
- Worktree:
  `/Users/user/Developer/Developer/fast-react-worker-965-private-admission-739-745-evidence-refresh`
  on branch `worker/965-private-admission-739-745-evidence-refresh`.

## Summary

- Refreshed the Worker 740 native loader evidence slice to the current
  `freezeNativeRootBridgeRequestShape` source layout without changing the
  accepted worker-thread teardown tokens or blockers.
- Refreshed the Worker 741 `react-dom/client` evidence to the current
  `definePrivateSymbolOnlyFacadeGate` helper shape, preserving the unsupported
  public `hydrateRoot` placeholder, non-enumerable private hydrateRoot symbol,
  and blocked public hydration evidence.
- Narrowed the Worker 745 sibling-text identity Rust evidence slice to the
  dedicated sibling-text function and made the mutation test replace exactly
  one blocker token in that slice.
- No source capability files were changed; this is a conformance evidence/test
  repair only.

## Changed Files

- `tests/conformance/src/private-admission-739-745-gate.mjs`
- `tests/conformance/test/private-admission-739-745-gate.test.mjs`
- `worker-progress/worker-965-private-admission-739-745-evidence-refresh.md`

## Commands Run

- `pwd && git status --short --branch` - passed.
- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and Worker
  739-745 progress reports.
- Initial `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - failed with the expected stale Worker 740/741 evidence and brittle Worker
  745 mutation targeting failures.
- `node --input-type=module -e "<evaluate private admission 739-745 gate>"` -
  confirmed stale token violations before the fix and no violations after the
  fix.
- `node --check tests/conformance/src/private-admission-739-745-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed, 7 tests.
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs --test-name-pattern "gate recognizes accepted private evidence|rejects removing Worker 745"`
  - passed.
- `node --test tests/conformance/test/private-admission-737-738-gate.test.mjs tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed, 16 tests.
- `npm run check:package-surface` - passed; npm printed the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- Final `node --check tests/conformance/src/private-admission-739-745-gate.mjs && node --check tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed.
- Final `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed, 7 tests.
- `git diff --check` - passed.
- `git status --short` - showed only the two conformance files and this
  progress file changed.

## Evidence Gathered

- `bindings/node/index.cjs` now places the Worker 740 transport teardown mirror
  before `nativeRootBridgeWorkerThreadTeardownExecutablePreflight` and later
  constructs `nativeRootBridgeRequestShape` through
  `freezeNativeRootBridgeRequestShape`. The accepted 524/1524 rows and
  `nativeAddonLoaded`, `nativeExecution`, `rendererExecution`,
  `reconcilerExecution`, `publicNativeCompatibility`, and `reactBehaviorError`
  blockers are still present.
- `packages/react-dom/client.js` now attaches private symbol-only facade gates
  through `definePrivateSymbolOnlyFacadeGate`, with public `hydrateRoot` still
  created by `createUnsupportedFunction` and exported as the placeholder.
- `crates/fast-react-test-renderer/src/lib.rs` contains multiple
  `broad_multichild_identity_available: false` tokens. The Worker 745 evidence
  and mutation test are now scoped to the dedicated
  `describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary`
  function, so adjacent multi-child gates cannot mask removal of the intended
  sibling-text blocker.

## Risks Or Blockers

- Worker 910 remains unaccepted in this baseline and was not used as accepted
  evidence.
- Public/native/root/hydration/test-renderer/package compatibility remains
  blocked; no runtime capability, source implementation, package export, or
  public behavior was changed.
- The conformance gate still relies on static source-token evidence. Future
  source reshaping should refresh slices with equivalent or stronger blockers.

## Recommended Next Tasks

- Keep private-admission source-token gates current as accepted source moves.
- Preserve the scoped mutation helper pattern for future ledger tests where a
  blocker token can appear in adjacent evidence rows.
