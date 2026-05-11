# Worker 949 Scheduler postTask/mock Variant Currentness

## Status

Complete.

## Summary

- Added a focused Scheduler variant boundary diagnostics currentness gate for
  private `scheduler/unstable_mock` and `scheduler/unstable_post_task`
  diagnostics.
- The gate builds live diagnostic rows from package-root and direct CJS mock
  loads plus postTask priority diagnostics, then binds them to the accepted
  Worker 937 source-currentness report.
- Rows record package/source identity, exact wrapper/CJS entrypoint variant,
  wrapper target, physical source file, source digest/currentness, diagnostic
  object identity, queue/shim identity, and unsupported public behavior status.
- The evaluator derives expected source-currentness from a fresh module-owned
  Worker 937 scheduler variant currentness gate, pins the expected gate id, and
  does not let a caller-supplied `variantCurrentnessGate` define expected rows.
- Audit hardening now requires the submitted report source gate id/status and
  accepted-context flag to match the current expected source-currentness gate.
- Submitted boundary reports are normalized through trap-safe descriptor,
  own-key, array, and row reads before schema checks or row comparisons read
  from them; the original untrusted report is still scanned so ambiguous proxy
  traps become structured violations instead of escaping.
- The exported boundary report factory now validates caller-supplied
  `variantCurrentnessGate` source rows before constructing diagnostics and
  returns a structured rejected report for empty/malformed rows instead of
  throwing raw source-row `TypeError`s.
- Malformed caller-supplied `variantCurrentnessGate` values cannot throw out of
  the evaluator; failed diagnostic report creation is recorded as an
  untrusted-container violation while expected rows remain module-owned.
- Top-level factory and evaluator options are now read through descriptor-based
  guards instead of parameter destructuring or direct option access, so accessor
  traps and null/non-object inputs become deterministic blocked diagnostics
  rather than raw exceptions.
- Caller-supplied `variantCurrentnessGate` objects are still scanned for public
  compatibility claims, so report construction cannot strip public/native/
  package/mock/postTask claim evidence before evaluation.
- Live diagnostic records are bound to module-owned WeakMap identity records, so
  cloned diagnostics cannot self-attest by setting both diagnostic object fields
  to the same clone.
- Public-claim scanning is descriptor-aware with `Reflect.ownKeys`, aligned
  with the upstream Scheduler variant oracle for generic/postTask/mock public
  compatibility names, and fails closed unless present claim descriptors are
  own data properties with value exactly `false`; diagnostic object carriers,
  `liveDiagnosticObject`, and function-valued carriers are no longer skipped
  when they contain public claim evidence.
- Function-valued claim carriers now receive the same frozen/prototype/trap-safe
  trust checks as object carriers, while module-owned diagnostic functions are
  frozen before report capture so accepted baseline diagnostics remain valid.
- Constructor `fn.prototype` objects are no longer skipped as function metadata;
  mutable prototypes are rejected as public-claim surfaces, and module-owned
  function prototypes are frozen during capture.
- The blocked public-claim key set now covers the Scheduler/act/root readiness
  and execution aliases used by adjacent public-act and scheduler diagnostics.
- Public-claim detection also uses a guarded `public*` deny pattern with
  explicit `*Blocked` exclusions, so nearby act/root/effect/Scheduler aliases
  such as `publicActCompatibilityClaimed` and root/effect render claims fail
  closed without relying only on a narrow hand list.
- Hidden public-claim getter probes now cover inferred `public*` compatibility
  and execution aliases as well as explicit blocked keys, including hidden
  source-gate and proxy-row aliases.
- The inferred hidden-probe vocabulary now includes native, postTask,
  mock-scheduler, browser postTask, scheduler, root, act, effect, renderer,
  flush-sync, package, and adjacent public alias stems, including bare
  `*Compatibility` aliases such as `publicNativeCompatibility`.
- Hidden inferred public claim namespaces now fail closed by provenance:
  module-owned reports, rows, arrays, and diagnostic carriers are tagged during
  capture, while non-module-owned claim containers are rejected with
  `[[HiddenInferredPublicClaims]]` instead of relying on an ever-growing finite
  probe list.
- Boundary report creation preserves caller source-gate public-claim rejection
  ids, so a prebuilt report cannot launder public claims that were present on
  the upstream currentness gate.
- Boundary report creation also preserves untrusted caller-shaped source-gate
  rejection ids while still constructing comparable rows when the source rows
  are readable, so mutable or hidden-proxy source-gate clones cannot be
  laundered through a prebuilt report.
- Hidden public claim key probes reject carriers whose `ownKeys` omit
  compatibility claim names while `get` returns public evidence, so frozen
  proxies cannot hide `publicCompatibilityClaimed` behind a trap.
- Hidden public claim key probes also reject non-`undefined` hidden getter
  results when the current value is `false`, because proxy results can vary
  after evaluation.
- Report, row, and nested claim containers are recursively rejected when they
  are unfrozen, prototype-bearing, or proxy-ambiguous; inherited claim
  descriptors and throwing claim-scan traps become structured violations
  instead of escaping or passing.
- Unsafe entrypoint coercion and diagnostic `Object.isFrozen` checks now use
  safe predicates, so non-coercible entrypoints and diagnostic-object proxy
  traps become structured violations instead of raw exceptions.
- Deep boundary comparisons are trap-safe, so nested `ownKeys` or `get`
  throwing proxies in source currentness, queue identity, or unsupported status
  produce violation status instead of uncaught exceptions.
- Source-gate rejection-id arrays are read with trap-safe array checks and
  index reads, so malformed `filter` proxies become structured violations.
- Present `sourceGateReportRejectionIds` fields must now be real arrays with
  only string entries; object-like arrays, invalid entries, and index accessors
  are rejected instead of being ignored.
- Rejection-id arrays are also probed beyond the reported length, so proxy
  arrays that claim `length: 0` while exposing hidden indexed values are
  rejected.
- Any present `sourceGateReportRejectionIds` field is itself treated as
  rejection evidence, so proxy arrays cannot pass by hiding indexed values at
  unsampled positions.
- Negative coverage rejects stale source rows, wrong entrypoints, root/native
  variant reuse, stale source gate context, caller-forged upstream source gates,
  prebuilt reports from claimed upstream source gates,
  prebuilt reports from mutable caller-shaped source gates,
  cloned diagnostics, fake queue state, enumerable and non-enumerable public
  postTask/mock compatibility claims, generic public compatibility claims,
  Scheduler/act/root execution claim aliases,
  hidden inferred public-claim aliases on rows and source gates, hidden native
  public execution/compatibility aliases, hidden postTask/mock/browser postTask
  readiness and compatibility aliases, hidden browser task-ordering inferred
  public claim namespaces,
  inherited/proxy-hidden compatibility claims, nested proxy-hidden claim
  containers, nested throwing claim containers, mutable nested claim containers,
  top-level option accessors and null options, top-level and row-level `get`
  traps, malformed caller source gates, row-level
  source row descriptors, caller source-gate public claims, live diagnostic
  object claims, function-valued claim carriers, function claim-carrier traps,
  mutable function claim carriers that can be flipped after acceptance,
  mutable function prototype claim surfaces, source rejection-id `filter` traps,
  source rejection-id object-like arrays, non-string entries, and accessors,
  source rejection-id hidden index and high hidden index proxies,
  `ownKeys`-hidden public claim getters, hidden false-then-true object and
  function public claim getter proxies,
  diagnostic-object frozen traps, non-coercible entrypoints, row-level
  true/non-false compatibility claims, and public Scheduler timing claims.
- Public Scheduler exports and package surfaces were not changed.

## Changed Files

- `tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`
- `tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `worker-progress/worker-949-scheduler-posttask-mock-variant-currentness.md`

## Evidence Path

- Gate source:
  `tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`
- Gate test:
  `tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- Source-currentness input:
  `tests/conformance/src/scheduler-variant-oracle.mjs`
- Accepted variant ledger input:
  `tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs`

## Commands Run

- `node --check tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`
- `node --check tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --cached --check`
- `git diff --check`

All commands above passed. The npm commands emitted the existing
`minimum-release-age` npm config warning only.

## Risks Or Blockers

- No implementation blocker remains.
- The new gate is intentionally private/conformance-only. It does not claim
  callback timing compatibility, public root or act draining, browser postTask
  compatibility, native runtime execution, or Scheduler package compatibility.
- The gate depends on Worker 937 currentness rows. Future Scheduler source
  edits that change source digests must refresh the accepted currentness rows
  and rerun this boundary diagnostics gate.

## Recommended Next Tasks

- When any Scheduler mock/postTask source boundary changes, rerun this gate
  with the Worker 886/937 scheduler variant gates before admitting private
  diagnostics.
- Keep public Scheduler timing/root/act/postTask/mock compatibility blocked
  until separate public behavior gates are accepted.
