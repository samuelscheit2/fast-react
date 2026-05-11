# Worker 953: Private Admission 932-944 Ledger Hardening

## Summary

- Audited accepted Workers 932-944 private-admission/currentness coverage and tightened the ledger/oracle gaps that could admit caller-shaped evidence without changing public compatibility claims.
- Hardened Scheduler variant currentness to require a factory-owned source report and to reject cloned reports or reports minted from caller-provided Worker 886 gates.
- Hardened native cleanup and resource/form admission ledgers so evidence identities remain bound to their expected path/slice or path/token context, including Worker 940 and Worker 942 currentness evidence.
- Hardened public-blocked currentness factories for React DOM `flushSync` and unsupported React placeholder hooks so otherwise-valid caller override reports are rejected.
- Audit repair: caller override proof now uses all own option keys, including non-enumerable properties and symbols, so non-enumerable `scenarios` and `publicExportsPlaceholderBlocked` overrides cannot be accepted.
- Second audit repair: report builders now snapshot only own data descriptors before reading option values, reject caller option objects even when inherited/proxy/accessor tricks hide keys, and avoid getter/prototype authority for the top-level options that shape currentness reports.
- Scheduler variant currentness now also pins Worker 886 boundary gates to module-owned provenance and scans public compatibility claims through descriptor/own-key enumeration, including non-enumerable claims.
- Public roots, public Scheduler timing, public DOM mutation, public form/resource execution, public hook execution, public `flushSync`, native execution, and package compatibility claims remain blocked.

## Changed Files

- `tests/conformance/src/scheduler-variant-oracle.mjs`
- `tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs`
- `tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs`
- `tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs`
- `tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `packages/react-dom/src/shared/flush-sync-guard.js`
- `packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-953-private-admission-932-944-ledger-hardening.md`

## Commands Run

- `node --check packages/react-dom/src/shared/flush-sync-guard.js packages/react-dom/test/react-dom-flush-sync-guard.test.js packages/react/hook-dispatcher.js tests/conformance/src/private-admission-821-native-cleanup-stale-ledger.mjs tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs tests/conformance/src/scheduler-variant-oracle.mjs tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs`
- `node --test packages/react-dom/test/react-dom-flush-sync-guard.test.js`
- `node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-821-native-cleanup-stale-ledger.test.mjs tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs tests/conformance/test/react-hook-dispatcher-oracle.test.mjs tests/conformance/test/react-dom-flush-sync-private-guard.test.mjs tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs tests/conformance/test/react-hook-dispatcher-guard.test.mjs tests/conformance/test/react-transition-facade.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Scheduler Worker 937 currentness now records WeakSet source proof for source reports, exposes `sourceReportSourceProofRecognized`, and fails closed with `scheduler-variant-currentness-source-report-caller-shaped` for cloned reports and caller-provided Worker 886 gate inputs.
- Private admission 821 now pins evidence role to exact `{ path, sliceStart, sliceEnd }` context and rejects Worker 940 role spoofing, test-slice aliasing, and cross-worker context reuse with `native-cleanup-stale-evidence-context-mismatch`.
- Private admission 850 now tracks Worker 942 as currentness evidence, exposes a currentness manifest, pins implementation paths, and binds evidence ids to `{ path, tokenPolicy }`; missing Worker 942 evidence and evidence-path replacement fail closed.
- React DOM `flushSync` blocked-currentness and unsupported React placeholder hook currentness reports now record caller override keys and reject no-op override reports after canonical shape validation.
- The caller override regressions include non-enumerable own data-property overrides, hidden self-deleting accessors, inherited option fields, and proxy `get` values hidden from `ownKeys` for React DOM `flushSync` scenarios and unsupported React placeholder hook export blocking.
- Scheduler regressions now reject caller-provided fake Worker 886 gates and non-enumerable `oracle.conformanceClaims.compatibilityClaimed`.
- Final focused conformance pass reported 125 passing tests; `@fast-react/react-dom` workspace check reported 222 passing package tests plus import smoke.

## Risks / Blockers

- No blocker remains. The audit-discovered non-enumerable data-property, accessor, inherited option, proxy option, fake Scheduler gate, and non-enumerable compatibility-claim bypasses are covered by focused negatives.
- The changes are intentionally private and source-proof focused; they do not open any public compatibility, DOM, root, Scheduler, form/resource, hook, or native execution path.
- Merge overlap risk is moderate because nearby active workers may touch the same private-admission ledgers or currentness tests. Preserve the new context/source-proof checks when resolving conflicts.
- npm emitted the existing unsupported `minimum-release-age` config warning during workspace checks; it did not affect the checks.

## Recommended Next Tasks

- When future workers add accepted private-admission evidence, require path/slice or path/token context in the ledger at the same time as the evidence id.
- Re-run the focused admission/currentness conformance command after merging nearby Workers 932-944 follow-up branches.
