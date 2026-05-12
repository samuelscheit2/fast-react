# Worker 1239 - Test Renderer Local Status Currentness

## Summary

Repaired the react-test-renderer serialization oracle/local status drift:
`packages/react-test-renderer` is now recorded as `placeholder-present`, matching
the inspected workspace placeholder package while keeping Fast React comparison
and public compatibility claims false.

Added fail-closed validation in the checked oracle reader and local serialization
gate so stale oracle/source status is reported as a violation when it diverges
from the current package-root inspection. The gate now rejects an oracle that
still says `not-present-in-workspace` while the placeholder package is present,
rejects `placeholder-present` if placeholder markers are removed, and rejects
local status records that claim Fast React comparison or compatibility.

Audit repair: serialization public-claim detection now also rejects
`oracle.evidenceClaims.fastReactComparedToReactTestRenderer = true`, matching
the error-surface gate's claim source coverage. Local status validation now
treats `compatibilityClaimed` as an explicit false field alongside
`behaviorCompatibilityClaimed`.

Hardened source-owned blocker inputs by freezing local status, public
unblocking requirements, private requirement rows, and serialization scenario
admissions. Tests assert mutation attempts throw and public blocker output
remains the accepted blocked surface.

## Changed Files

- `tests/conformance/src/react-test-renderer-serialization-targets.mjs`
- `tests/conformance/src/react-test-renderer-serialization-oracle.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json`
- `worker-progress/worker-1239-test-renderer-local-status-currentness.md`

## Commands Run

```sh
node --check tests/conformance/src/react-test-renderer-serialization-targets.mjs
node --check tests/conformance/src/react-test-renderer-serialization-oracle.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`: passed, 12 tests.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: passed, 31 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`: passed, 43 tests.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed.
- npm printed the existing `minimum-release-age` config warning during npm commands; it did not affect results.

## Evidence Gathered

- The local package inspection reports the workspace JS react-test-renderer
  facade as present and placeholder-backed.
- The checked oracle and source-owned target record now both use
  `status: "placeholder-present"` with false `comparedToReactTestRenderer` and
  false `behaviorCompatibilityClaimed` plus false `compatibilityClaimed`.
- Hostile tests now cover:
  - stale oracle `not-present-in-workspace` with the placeholder package present;
  - stale `placeholder-present` after placeholder markers are removed;
  - local Fast React comparison or compatibility claims;
  - evidence-level Fast React comparison claims;
  - mutation attempts against frozen status/admission/blocker source records.
- Public `toJSON`, `toTree`, TestInstance wrappers, JS facade routing, native
  bridge execution, and broad public renderer compatibility remain blocked.

## Audit And Review Notes

- No nested agents were spawned.
- Scope stayed within the serialization oracle/local gate and the worker report.
- The checked oracle reader now throws on source/status drift before returning a
  parsed checked artifact.
- Source audit blockers were addressed without reverting the prior
  `3eab522f` fix.

## Risks Or Blockers

- The local status is intentionally only `placeholder-present`; it is not a
  public compatibility claim.
- If a future worker replaces the placeholder with a real package facade, the
  source status and checked oracle must be updated together or this gate will
  fail closed.

## Recommended Next Tasks

- Keep public react-test-renderer compatibility blocked until public
  serialization, TestInstance wrappers, native bridge routing, and broad renderer
  compatibility are intentionally implemented and accepted.
