# Worker 990 - React DOM Controlled Input/Event Blocker

## Summary

- Hardened private input/change extraction admission so public/live behavior
  claims and resource/form, hydration replay, caller-shaped event payload, and
  fake-target aliases are detected through own descriptors, non-enumerable
  keys, symbols, accessors, and proxy-hidden direct reads before preflight
  evidence is consumed.
- Repaired the follow-up currentTarget bypass by rejecting top-level
  `currentTarget` in input/change preflight options and by no longer skipping
  `currentTarget` during public/source-claim recursion.
- Hardened controlled restore queue admissions and source-alias scans with the
  same descriptor-aware fail-closed checks while preserving direct fake-DOM and
  live-DOM target admissions only for their existing explicit private gates.
- Repaired nested controlled restore source-alias scanning so proxy-hidden
  `targetKind` values inside source evidence reject resource/form and hydration
  replay aliases before a bridge record can be accepted, while preserving the
  top-level direct fake/live target admission special case.
- Repaired unsafe restore admission reads by verifying `explicitAdmission` and
  `targetKind` from own data descriptors before direct fake/live target
  allowances can be considered.
- Repaired audit gaps by admitting `currentTarget` as a blocked caller-shaped
  alias, failing closed on accessor-hidden source containers, scanning admitted
  direct fake/live targets for public and resource/form claims, and applying the
  same descriptor-aware source-evidence checks to root listener currentness.
- Repaired the follow-up root-listener source-alias parity gap by blocking
  form-reset aliases, including nested proxy-hidden `targetKind` strings such as
  `form-reset-controlled-restore-source` and `requestFormResetOnFiber`.
- Repaired the nested root-listener source-record gap by making source-alias and
  public-claim recursion scan `sourceRecord` containers once validation is
  already inside user-supplied root-listener source evidence.
- Added private events regressions for hidden public controlled-input flags,
  caller-shaped native event payloads, fake DOM target smuggling, symbol
  resource/form aliases, proxy-hidden public/resource aliases, root-currentness
  source getters, direct fake-target claims, top-level `currentTarget` preflight
  and restore admissions, getter/proxy `targetKind` side effects, root-listener
  form-reset alias smuggling, nested `sourceRecord` alias/public-claim
  smuggling, and accepted source-owned evidence reuse after forged rejections.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/events-private.test.js`
- `worker-progress/worker-990-react-dom-controlled-input-event-blocker.md`

## Verification

- `node --check packages/react-dom/src/events/plugin-event-system.js` - passed
- `node --check packages/react-dom/src/client/controlled-restore-queue.js` - passed
- `node --check packages/react-dom/src/events/root-listeners.js` - passed
- `node --check packages/react-dom/test/events-private.test.js` - passed
- `node --test packages/react-dom/test/events-private.test.js` - passed, 31 tests
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs` - passed, 23 tests
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs` - passed, 27 tests
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs` - passed, 17 tests
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js` - passed, 61 tests
- `npm run check --workspace @fast-react/react-dom` - passed, 229 package tests plus import smoke
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `git diff --check` - passed
- `git diff --cached --check` - passed

## Evidence Gathered

- Rejected stale/cross-root/currentness-drift paths from the accepted Worker
  958 tests still pass after the broader descriptor-aware scans.
- Rejected caller-shaped native event/target source payloads, source-record fake
  DOM target smuggling, currentTarget aliases, nested, accessor-hidden, and
  symbol resource/form aliases, and proxy-hidden public/resource aliases before
  input/change preflight evidence is consumed.
- Rejected top-level preflight `currentTarget` options before root listener
  currentness evidence can be consumed, and rejected `currentTarget` objects
  carrying public behavior claims during recursive scanning.
- Rejected non-enumerable, symbol, and accessor public controlled-input claims
  in extraction options and controlled restore admissions, including public and
  resource/form claims placed directly on admitted fake DOM targets, without
  mutating the fake target.
- Rejected restore admissions whose `explicitAdmission` or `targetKind` is
  hidden behind accessors/proxies without invoking those traps or mutating the
  fake target.
- Rejected controlled restore bridge admissions with nested `sourceRecord`
  proxies that hide resource/form or hydration replay aliases behind
  descriptor-missing `targetKind` reads before bridge acceptance.
- Rejected root listener currentness source records that hide form-reset
  aliases behind nested proxy-hidden `targetKind` values before currentness
  evidence can be accepted.
- Rejected root listener currentness source records that hide form-reset
  aliases or public controlled-behavior claims inside nested `sourceRecord`
  containers before currentness evidence can be accepted.
- Rejected root listener currentness source records that hide resource/form
  evidence behind accessors or claim public controlled behavior.
- Proved source-owned preflight, bridge, and fake-DOM execution evidence remain
  consumable after forged rejection attempts.

## Risks Or Blockers

- No blockers found.
- The new source-alias scanners are intentionally fail-closed for descriptor or
  own-key inspection failures; this is stricter than the prior enumerable-only
  scan but remains confined to private/test-only admission surfaces.

## Recommended Next Tasks

- Keep future private input/change and controlled restore consumers using these
  descriptor-aware helpers rather than adding local enumerable-only scans.
