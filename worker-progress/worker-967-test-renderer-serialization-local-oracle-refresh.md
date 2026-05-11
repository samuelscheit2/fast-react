# Worker 967 - Test Renderer Serialization Local Oracle Refresh

## Goal Evidence

- `get_goal` returned the active worker objective for
  `worker/967-test-renderer-serialization-local-oracle-refresh`.
- Two explorer subagents inspected the serialization source scanner and
  package-root create execution/admission paths before the repair.

## Summary

- Refreshed the serialization/local static gate so it looks for the current
  source-owned update operation check instead of the stale literal
  `operation === "update"` shape.
- Updated the local serialization fixtures and negatives to require current
  source-owned private root lifecycle execution evidence. Omitted, cloned,
  stale-root, and public/native compatibility-claim evidence still rejects.
- Restored package-root private create/update execution source records and
  bridge admission consumption so package-root serialization currentness can
  use the same source-owned evidence as the CJS paths without opening public
  serialization, TestInstance, native, or package compatibility.
- Tightened the package-root create/update bridge consumers after audit:
  minimal caller-shaped handoffs no longer produce host output, request/root
  fields are required, lifecycle and host-output metadata must be present, and
  update queue/root work-loop/host text evidence is no longer defaulted.
- Extended the package-root create/update compatibility blocker matrix after
  follow-up audit so public route/root/renderer behavior and package/JS
  compatibility claims must be explicitly false and hostile claims reject
  before host output is produced.
- Strengthened the local oracle negatives after regression audit: stale
  lifecycle currentness now uses the same root lineage instead of a foreign
  root, and the package-root claim matrix proves accepted baselines before
  mutating each public/root/package claim.
- Repaired the 727/728 private-admission integration gate after the current
  unmount serialization contract changed: current unmount identity evidence is
  now recognized only with source-owned lifecycle evidence, and the stale
  lifecycle-free acceptance shape is a forbidden source token.
- Hardened serialization-local JS source evidence after audit by parsing each
  package-root/CJS `toJSON` and `toTree` facade gate object outside comments
  and strings. Block comments, string spoofing, forged anchors, and per-file
  false-to-true public/native drifts now fail closed.
- Tightened package-root create execution after audit: top-level create result
  wrapper public/native/package claims reject, and create host-output handoff
  consumption now requires nested create-route admission evidence instead of
  caller-shaped acceptance flags.
- Applied the follow-up package-root execution audit repair: top-level
  public/native/package claims now reject for every root execution result
  wrapper, including lifecycle-only update and unmount results with no nested
  host-output or cleanup evidence.
- Applied the additional audit repair for serialization-local source evidence:
  lifecycle WeakSet and validator tokens must appear outside JS comments and
  strings in every package/CJS entrypoint, and block-comment-only lifecycle
  spoofing now fails the finished-work identity checks.
- Hardened the source-token scanner against regex-literal spoofing as well as
  comments, strings, and templates, so lifecycle source evidence cannot be
  reintroduced with `/token/u` style regex literals.
- Generalized package-root native bridge compatibility claim rejection so
  adjacent public/native/package aliases such as `nativeExecutionAvailable`,
  `nativeBridgeLoadingAvailable`, and `publicToJSONAvailable` reject on
  top-level wrappers, create handoffs, create-route admissions, and update
  admission diagnostics.
- Extended the same compatibility claim rejection to hidden/non-enumerable own
  properties and accessor descriptors, including symbol descriptions that match
  public/native/package aliases.
- Strengthened private diagnostics readiness and error-surface lifecycle gates
  so update/unmount route diagnostics require parsed source-owned lifecycle
  evidence instead of spoofable raw token presence.
- Hardened the remaining ToJSON host-output diagnostic source evidence so the
  serializer identifier must be source-owned outside block comments, strings,
  templates, and regex literals across every package/CJS entrypoint.
- Tightened that ToJSON serializer evidence again after audit so it requires a
  real `serializePrivateToJSONHostOutputDiagnostic` function declaration whose
  body consumes validator and lifecycle evidence; standalone const/alias spoofs
  no longer satisfy readiness.
- Repaired proxy-laundered adjacent compatibility alias rejection by directly
  probing blocked public/native/package aliases such as
  `packageSerializationAvailable`, even when a proxy hides them from `ownKeys`
  while exposing them through `Object.hasOwn` and property access.
- Extended the proxy alias repair to probes that hide the alias from
  `Object.hasOwn` too, while still exposing it through `in` and property access.
- Removed loose update-route host-output aliases from native admission
  consumption; update admissions now require the same canonical
  `hostTextUpdateMetadata` shape that the consumed admission builder reads.
- Updated the adjacent create-routing expectation because package-root update
  admission is now preserved instead of being dropped.
- Repaired the follow-up ToJSON host-output source evidence audit so the
  serializer body itself calls the expected validator/lifecycle evidence
  functions with the expected arguments. A renamed-real-uses plus dead function
  declaration spoof now fails closed.
- Repaired the returned ToJSON facade path audit: the local gate now extracts
  the top-level `return freezeRecord({ ... })` object from
  `createPrivateToJSONSerializationFacade` and proves the returned object
  methods call the intended `serializePrivateToJSONHostOutputDiagnostic`
  binding with the root request and lifecycle evidence. Renamed real returned
  facade uses plus dummy nested object methods with valid-looking serializer
  calls now fail closed.

## Changed Files

- `packages/react-test-renderer/index.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/src/private-admission-727-728-gate.mjs`
- `tests/conformance/test/private-admission-727-728-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-967-test-renderer-serialization-local-oracle-refresh.md`

## Verification

Passed:

```sh
node --check packages/react-test-renderer/index.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/src/private-admission-727-728-gate.mjs
node --check tests/conformance/test/private-admission-727-728-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
node --test tests/conformance/test/private-admission-727-728-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-754-766-gate.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
git diff --check
git diff --cached --check
```

Focused results:

- Serialization local gate: 26 tests passed, including hostile temp-workspace
  source-drift tests for comment/string spoofing, lifecycle token block-comment
  and regex-literal spoofing, ToJSON serializer block/string/template/regex
  and standalone const alias spoofing, renamed real ToJSON serializer uses plus
  dead function declaration spoofing, renamed real returned-facade uses plus
  nested dummy facade-method spoofing, error-surface lifecycle spoofing, and
  forged JS gate anchors.
- Create-routing gate: 41 tests passed, including minimal caller-shaped
  create/update handoff, fake root execution result, and package-root
  root/package/public route compatibility-claim rejection probes, top-level
  create/update/unmount result wrapper claim rejection, lifecycle-only
  update/unmount wrapper rejection, adjacent native/public alias rejection, and
  hidden/non-enumerable/proxy-hidden adjacent alias rejection, including
  `Object.hasOwn === false` in-trap proxies, alias-only update host-output
  evidence rejection, and no-admission create handoff rejection with accepted
  baselines asserted before mutation.
- Error-surface oracle gate: 15 tests passed, including lifecycle diagnostic
  evidence that rejects comment, string, and regex-literal spoofing.
- Private admission 727/728 gate: 24 tests passed, including stale
  lifecycle-free unmount identity source rejection.
- Adjacent private admission 732/733 and 754/766 gates: 31 tests passed.
- React-test-renderer serialization workspace command: 37 tests passed.
- Package surface snapshot guard passed.
- Entrypoint smoke inventory and runtime checks passed.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The package-root repair intentionally adds private diagnostic record plumbing
  only. Public serialization, TestInstance, native execution, package
  compatibility, and route compatibility flags remain fail-closed.
