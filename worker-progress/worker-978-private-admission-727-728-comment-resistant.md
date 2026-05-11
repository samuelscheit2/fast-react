# Worker 978: Private Admission 727-728 Comment-Resistant Evidence

## Summary

- Hardened the 727-728 private admission source evidence checks so JS anchors
  are found only in source code, not comments, strings, templates, regex
  literals, or nested caller-shaped shells.
- Repaired the escaped quoted hidden-carrier bypass by decoding JS string
  literal escapes before property-name analysis in asserted gate object slices.
  Escaped quoted `__proto__`, `constructor`, and `prototype` spellings now fail
  closed as hidden compatibility carriers.
- Removed the failing serialization-local strict identity test from accepted
  current evidence until Worker 967 repairs that executable behavior. Source
  token presence in that test file is no longer admission authority.
- Hardened the JS object-literal assertion parser so spreads, computed keys,
  accessors, and method members in asserted gate object slices fail closed
  instead of being skipped. Shorthand properties are parsed as identifier
  values, so asserted compatibility keys still fail if broadened that way.
- Added a fail-closed check for unasserted public/native/package/root/toJSON/
  toTree compatibility-looking alias fields in asserted gate object slices,
  including shorthand aliases.
- Added a fail-closed check for hidden compatibility carriers (`__proto__`,
  `constructor`, and `prototype`) in asserted gate object slices.
- Repaired the nested hidden-carrier bypass by recursively scanning asserted
  object literal values. Benign wrappers such as `metadataCarrier` now fail
  closed when they contain nested `__proto__`, escaped quoted `__proto__`,
  `constructor.prototype`, or `prototype` carrier shapes.
- Kept Worker 727 classified as skipped/meta and Worker 728 as private
  diagnostic evidence only. Public/root/native/test-renderer/package
  compatibility blockers remain false and fail closed.

## Changed Files

- `tests/conformance/src/private-admission-727-728-gate.mjs`
- `tests/conformance/test/private-admission-727-728-gate.test.mjs`
- `worker-progress/worker-978-private-admission-727-728-comment-resistant.md`

## Regressions Added

- Block-comment forged package-root canonical gate anchors fail closed.
- Template forged package-root canonical gate anchors fail closed.
- Caller-shaped nested canonical-shell gate objects fail closed.
- Comment-only, string-only, template-only, and regex-literal-only copies of
  source identity tokens fail closed.
- The gate does not recognize
  `current-unmount-native-strict-identity-conformance` when the referenced
  serialization-local strict identity behavior is failing or unavailable.
- Post-assertion object spread, computed property, accessor, and method members
  that can broaden `publicSerializationAvailable`, `nativeExecution`, or
  `compatibilityClaimed` fail closed.
- Unasserted compatibility-looking aliases such as
  `packageCompatibilityClaimed`, `nativeExecutionAvailable`,
  `publicToJSONAvailable`, `publicRootAvailable`, shorthand
  `packageCompatibilityClaimed`, and adjacent root/toJSON/toTree/native bridge
  availability aliases fail closed.
- Hidden carrier fields such as `__proto__`, `constructor`, and `prototype`
  carrying package/native/public/root compatibility aliases fail closed.
- Escaped quoted hidden carrier fields such as
  `"\\u005f\\u005fproto\\u005f\\u005f"`, `"\\u0063onstructor"`, and
  `"\\u0070rototype"` in the asserted package-root
  `toJSONPrivateSerializationFacadeGate` slice fail closed, including the
  escaped nested `constructor.prototype` carrier shape.
- Nested hidden carrier fields under a benign `metadataCarrier` key fail
  closed, including direct nested `__proto__`, escaped quoted nested
  `"\\u005f\\u005fproto\\u005f\\u005f"`, nested `constructor.prototype`, and
  nested `prototype` carrier shapes.

## Public Blockers

- Public test-renderer serialization, `toJSON`, `toTree`, root, update,
  `TestInstance`, native addon/bridge loading and execution, `act`, React DOM,
  Scheduler, hydration, events, refs, resources, forms, controlled inputs, and
  package compatibility remain blocked.

## Verification

- `node --check tests/conformance/src/private-admission-727-728-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs`
  - passed, 30 tests after the nested hidden-carrier regressions were added.
- `node --test --test-name-pattern "strict finished-work identity" tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  - failed with the known Worker 967 serialization-local strict identity
  blocker at line 4612 (`false !== true`). This row is no longer accepted
  current evidence in the 727-728 gate.
- `node --test tests/conformance/test/private-admission-724-726-gate.test.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 57 tests after the nested hidden-carrier repair.
- `node --test tests/conformance/test/private-admission-724-726-gate.test.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  - failed in the pre-existing Worker 967 serialization-local lane. The
  private-admission 724-726, 727-728, and 729-731 tests in the same run passed;
  failures were serialization-local assertions blocked on private serialization
  diagnostics/currentness.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed after staging.
