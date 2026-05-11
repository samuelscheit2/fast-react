# Worker 989: Conformance Private Gate False-Green Sweep

## Status

Complete after the stateful report-sanitizer array repair.

## Stateful Report-Sanitizer Array Repair - 2026-05-12

### Summary

- Closed the audited false-green where a stateful proxy array could pass raw
  accepted-diagnostic checks, reveal a hidden next-index value during report
  sanitization, and still leave the gate green because sanitizer failures were
  discarded.
- `sanitizeEvaluatedRow` now returns both sanitized report rows and
  report-array shape/read mismatches. Those report-only mismatches are promoted
  to `private-admission-report-array-shape-mismatch` when the raw checks would
  otherwise produce no violations.
- Raw recognition and mismatch calculations still use the evaluated raw rows:
  the third-read regression keeps `acceptedDiagnosticsRecognized === true` and
  fails only through the report-sanitizer violation.
- Added regressions for the audit's third-read hidden accepted diagnostic value
  and for a sanitizer-discovered next-index read failure on a dependency array.

### Evidence Gathered

- Encoded the blocker class in the focused test by hiding the next index until
  after the raw array-shape reads.
- Confirmed the repaired gate returns violation status with
  `private-admission-report-array-shape-mismatch`, while raw row recognition
  remains true for the sanitizer-only cases.
- Adjacent private-admission ledgers around 724-736 remained green.

### Commands

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 87 tests.
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/private-admission-724-726-gate.test.mjs tests/conformance/test/private-admission-727-728-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-733-736-bridge-ledger.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 71 tests.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.

### Risks Or Blockers

- No blockers. This repair does not claim to prove arbitrary future behavior of
  hostile JavaScript proxies; it ensures any array shape/read failure discovered
  by the report sanitizer cannot be silently converted into a green gate.

## Descriptor/Get Mismatch And Truthy Container Repair - 2026-05-11

### Summary

- Closed the false-green where data descriptors for visible
  `publicCompatibilityClaims` or `blockedAdmissionClaims` could report a benign
  value while `Reflect.get()` exposed a claim container.
- Closed the matching nested-key false-green where visible descriptor values of
  `false` could hide live `true` public compatibility or blocked admission
  claim values.
- Truthy primitive claim containers, such as
  `publicCompatibilityClaims: true` and `blockedAdmissionClaims: true`, now
  synthesize canonical positive claims instead of merging as empty containers.
- Null and `false` claim containers remain intentionally empty.
- Added focused regressions for the top-level descriptor/get mismatch, nested
  public/native claim descriptor/get mismatch, and truthy public/blocked claim
  containers.

### Evidence Gathered

- Reproduced the audited hostile shapes before the repair: benign descriptor
  values for top-level and nested claim properties could keep the 729-731 gate
  recognized with no violations, and truthy primitive containers merged back to
  the all-false base claims.
- After the repair, each audited shape returns the violation status with the
  expected `public-compatibility-claim-detected` or
  `blocked-admission-claim-detected` violation.
- Prior hidden/accessor/throw matrix regressions in the focused 729-731 suite
  remain green.

### Commands

- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 58 tests.
- `node --test tests/conformance/test/private-admission-727-728-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-733-736-bridge-ledger.test.mjs`
  - passed, 51 tests.
- `node tests/smoke/package-surface-guard.mjs` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

### Risks Or Blockers

- No blockers. This is conformance gate hardening only; it does not change
  runtime package source.

## Accessor Descriptor-Hidden Field Repair - 2026-05-11

### Summary

- Closed the false-green where ownKeys-hidden accessor descriptors were dropped
  when a hostile proxy `get()` returned `undefined`.
- Hidden row override probes now distinguish absent keys from descriptor-present
  keys, and accessor descriptors are read directly before falling back to
  `Reflect.get()`.
- Added focused regressions for accessor descriptor-hidden
  `dependencyDiagnosticIds`, `blockerContextDiagnosticIds`,
  `publicCompatibilityClaims.publicPackageCompatibilityClaimed`, and
  `blockedAdmissionClaims.nativeExecutionAdmissionClaimed`.

### Evidence Gathered

- Reproduced the four pre-repair false greens: each hostile accessor descriptor
  case returned the recognized gate status with no violations.
- After the repair, direct hostile probes for those four shapes plus prior
  descriptor-hidden top-level `compatibilityClaimed`, proxy-hidden `evidence`,
  function proxy hidden aliases, and descriptor-hidden nested data claims all
  returned violation status.
- Focused and adjacent private-admission tests pass with 46 focused 729-731
  tests and 93 adjacent 729-745 tests.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 46 tests.
- `node --input-type=module <direct hostile accessor descriptor and prior blocker probes>`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs tests/conformance/test/private-admission-737-738-gate.test.mjs tests/conformance/test/private-admission-739-745-gate.test.mjs`
  - passed, 93 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.

### Risks Or Blockers

- No blockers. Proxy-hidden keys remain finite-probed; this repair changes only
  descriptor-present hidden probe handling so accessor descriptors are captured
  or fail closed instead of being mistaken for absent keys.

## Function And ownKeys-Hidden Descriptor Container Repair - 2026-05-11

### Summary

- Closed the false-green where function-valued row override proxies could hide
  `fastReactBehaviorCompatible: true` because compatibility scanning skipped
  functions.
- Added finite descriptor-aware row override probes for
  `publicCompatibilityClaims` and `blockedAdmissionClaims`, so descriptor
  exposed containers are captured even when omitted from `ownKeys()`.
- Preserved the previous hidden top-level `compatibilityClaimed` and
  descriptor/get-undefined nested container repairs while adding focused
  regressions for the newly audited hostile shapes.

### Evidence Gathered

- Reproduced the three pre-repair false greens: a function proxy hiding
  `fastReactBehaviorCompatible`, an ownKeys-hidden descriptor
  `publicCompatibilityClaims.publicPackageCompatibilityClaimed`, and an
  ownKeys-hidden descriptor
  `blockedAdmissionClaims.nativeExecutionAdmissionClaimed`.
- After the repair, direct hostile probes for those three shapes, the previous
  descriptor/get-undefined nested containers, and proxy-hidden top-level
  `compatibilityClaimed` all returned violation status.
- Focused and adjacent private-admission tests pass with 37 focused 729-731
  tests and 68 adjacent 729-736 tests.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 37 tests.
- `node --input-type=module <direct hostile function proxy, ownKeys-hidden
  descriptor container, descriptor/get-undefined container, and hidden
  top-level compatibilityClaimed probes>` - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 68 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.

### Risks Or Blockers

- No blockers. Hidden proxy keys remain finite-probed; this repair adds only
  the audited row override container keys and makes existing compatibility
  claim scanning treat functions as scanable override surfaces.

## Descriptor-Aware Nested Override Repair - 2026-05-11

### Summary

- Closed the false-green where a row override proxy exposed
  `publicCompatibilityClaims` or `blockedAdmissionClaims` through own property
  descriptors while returning `undefined` from `get()`.
- Threaded the descriptor-aware `overrideRecord` through row merging and nested
  claim-container inspection so captured nested containers are not re-read
  through hostile raw proxy getters.
- Added focused regressions for descriptor-exposed/get-undefined nested public
  package compatibility and native execution admission claims.

### Evidence Gathered

- Direct hostile probes for descriptor-exposed/get-undefined
  `publicCompatibilityClaims.publicPackageCompatibilityClaimed` and
  `blockedAdmissionClaims.nativeExecutionAdmissionClaimed` now return violation
  status and preserve the captured nested claim values in the evaluated row.
- Direct hostile probe for proxy-hidden top-level `compatibilityClaimed` still
  fails closed through `private-diagnostic-claimed-compatibility`.
- Focused and adjacent private-admission tests pass with the new regressions.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 34 tests.
- `node --input-type=module <direct hostile descriptor/get-undefined nested claim-container and hidden top-level compatibilityClaimed probes>`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 65 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.

### Risks Or Blockers

- No blockers. The repair changes only descriptor-safe row override plumbing
  for the 729-731 conformance gate and preserves the finite proxy-hidden key
  probes from the prior repairs.

## Hidden Top-Level compatibilityClaimed Repair - 2026-05-11

### Summary

- Closed the remaining false-green where row overrides could hide a top-level
  `compatibilityClaimed: true` behind a non-enumerable descriptor or proxy
  `ownKeys` filter.
- Replaced lossy top-level row override spreading with descriptor-aware row
  override materialization before merge, preserving non-enumerable own row
  fields.
- Added a finite hidden row override probe for `compatibilityClaimed`, so
  proxy-hidden compatibility claims fail closed through the existing
  `private-diagnostic-claimed-compatibility` violation path.
- Added focused regressions for non-enumerable and proxy-hidden top-level
  `compatibilityClaimed: true` row overrides.

### Evidence Gathered

- Reproduced the pre-repair false green: non-enumerable and proxy-hidden
  top-level `compatibilityClaimed: true` row overrides returned the recognized
  gate status with `privateDiagnosticsRecognized: true`,
  `compatibilityClaimed: false`, and no violations.
- After the repair, both hostile top-level shapes return violation status with
  `compatibilityClaimed: true` and
  `private-diagnostic-claimed-compatibility`.
- Re-ran direct hostile probes covering the repaired top-level
  `compatibilityClaimed` shapes plus the prior nested hidden/proxy
  `publicCompatibilityClaims` and `blockedAdmissionClaims` claim-container
  shapes.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 32 tests.
- `node --input-type=module <direct hostile hidden top-level and nested claim-container probes>`
  - passed, 4 probes.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 63 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.

### Risks Or Blockers

- No blockers. Proxy-hidden row override names remain necessarily finite-probed;
  this repair adds the audited top-level `compatibilityClaimed` gate key while
  preserving the prior hidden compatibility alias probes.

## Nested Claim Container Repair - 2026-05-11

### Summary

- Closed the remaining false-green where nested `publicCompatibilityClaims` and
  `blockedAdmissionClaims` overrides could hide compatibility/admission aliases
  behind non-enumerable descriptors or proxy-hidden keys before object spread.
- Replaced direct nested claim-container spreading with descriptor/probe-aware
  merging, preserving hidden probed keys for the later `Object.entries` leak
  checks.
- Expanded finite hidden alias probes to cover `publicPackageCompatible`,
  `publicPackageCompatibility`, `nativeExecutionCompatible`, and related
  package/native variants alongside the existing Fast React behavior aliases.
- Added regressions for row/evidence proxy-hidden public/package/native
  aliases and nested non-enumerable/proxy-hidden public/admission claim
  containers.

### Evidence Gathered

- Reproduced the pre-repair false greens: proxy-hidden nested
  `publicCompatibilityClaims.fastReactBehaviorCompatible`, proxy-hidden nested
  `blockedAdmissionClaims.nativeExecutionAdmissionClaimed`, and non-enumerable
  nested `publicCompatibilityClaims.publicPackageCompatible` returned the
  recognized gate status with no violations.
- After the repair, direct hostile probes for top-level/evidence
  `publicPackageCompatible`, `publicPackageCompatibility`, and
  `nativeExecutionCompatible`, nested public claim aliases, and nested blocked
  admission aliases all returned violation status.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 30 tests.
- `node --input-type=module <direct hostile nested/proxy claim-container probes>`
  - passed; every audited hostile shape returned violation status.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 61 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.

### Risks Or Blockers

- No blockers. Hidden proxy keys remain necessarily finite-probed; the probe
  set now covers the audited public/package/native variants in addition to the
  prior Fast React behavior aliases.

## Repair Update - 2026-05-11

### Summary

- Closed the remaining false-green where broad `*Compatible` aliases such as
  `fastReactBehaviorCompatible` were not treated as compatibility-like claim
  keys.
- Added hidden compatibility alias probes for common public/package/native/Fast
  React compatibility stems, so proxy-hidden aliases cannot bypass `ownKeys`.
- Added regressions for enumerable, non-enumerable, and proxy-hidden
  top-level/evidence-row `fastReactBehaviorCompatible`,
  `fastReactBehaviorCompatibility`, and
  `fastReactBehaviorCompatibilityClaimed` aliases.

### Evidence Gathered

- Reproduced the pre-repair false green: a row override containing
  `fastReactBehaviorCompatible: true` returned the recognized gate status,
  `privateDiagnosticsRecognized: true`, `compatibilityClaimed: false`, and no
  violations.
- After the repair, direct hostile probes for top-level, evidence-row, and
  proxy-hidden broad aliases all returned the violation status with
  `unknown-compatibility-claim-detected`.

### Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 27 tests.
- `node --input-type=module <direct hostile *Compatible alias probe>` - passed;
  top-level, evidence-row, and proxy-hidden alias cases failed closed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 58 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git diff --cached --check` - passed.

### Risks Or Blockers

- No blockers. The hidden alias probe is intentionally finite for proxy-hidden
  keys, because JavaScript cannot enumerate names that a proxy chooses not to
  expose. It covers the known broad Fast React behavior alias family and common
  public/package/native compatibility stems.

## Scope

- `tests/conformance/src/private-admission-729-731-gate.mjs`
- `tests/conformance/test/private-admission-729-731-gate.test.mjs`

## Summary

- Hardened the private admission 729-731 gate so evidence recognition is
  authoritative. A caller-provided `recognized: true` override can no longer
  mask missing, empty, removed, or proxy-hidden evidence.
- Bound evidence evaluation to canonical required roles and token lists, so a
  caller-shaped evidence array cannot remove required rows or empty required
  token arrays and still pass through `every([])`.
- Added first-class `private-admission-evidence-token-missing` violations for
  729-731 source-token misses and `private-admission-evidence-context-mismatch`
  violations for evidence shape drift.
- Rejects unknown top-level compatibility-looking claim keys on row overrides
  and evidence objects, including public/native/package aliases outside the
  supported claim containers.
- Added a regression proving a forged post-assertion override with a missing
  Worker 730 Rust evidence token fails closed and keeps the worker
  unrecognized.
- No runtime package source was changed.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PROGRESS.md`, and the requested Worker 964,
  965, and 966 progress reports.
- Confirmed this worktree has no `worker-progress/worker-978*` report, so the
  active 727-728 overlap was treated as external.
- Reproduced the false green before the fix: overriding Worker 730 with both
  `recognized: true` and a missing evidence token made
  `privateDiagnosticsRecognized` remain `true` with no violations.
- After the fix, the same forged override produces
  `private-admission-evidence-token-missing` and
  `required-private-diagnostic-not-recognized`.
- Reproduced the audit probes for `evidence: []`, removed Worker 730 Rust
  evidence, proxy-hidden evidence, empty/proxy-hidden Worker 731 token arrays,
  and top-level public/native/package compatibility aliases. All now return the
  violation status with `privateDiagnosticsRecognized: false`.

## Commands

- `node --check tests/conformance/src/private-admission-729-731-gate.mjs` -
  passed.
- `node --check tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 25 tests.
- `node --input-type=module <audit probe script for empty/removed/hidden evidence, empty/hidden tokens, and public/native/package aliases>`
  - passed; every audited false-green shape returned violation status.
- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 56 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- This is conformance gate hardening only. It does not claim public
  react-test-renderer serialization, native execution, package, or broader
  renderer compatibility.
- The 727-728 overlap remains external to this branch; this change avoids that
  source file.

## Recommended Next Tasks

- Continue sweeping older private admission gates for raw source-token matching
  that can be spoofed outside the intended source slice or by unsupported
  source constructs.

## Repair: Blocked Admission False-Key Drift

### Summary

- Repaired the 729-731 blocked admission claim shape check to compare the
  actual merged `blockedAdmissionClaims` keys instead of the static
  `blockedAdmissionClaimIds` list.
- Added regressions proving both false-valued and true-valued unexpected blocked
  admission claim keys keep the gate blocked.

### Commands

- `node --test tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 60 tests.
- `node --input-type=module <hostile blocked false-extra-key probe>` - passed.
- `node --test --test-name-pattern 'descriptor|truthy|hidden|ownKeys|function proxy|null and false claim containers' tests/conformance/test/private-admission-729-731-gate.test.mjs`
  - passed, 33 tests.
- `node --test tests/conformance/test/private-admission-732-733-gate.test.mjs tests/conformance/test/private-admission-733-736-bridge-ledger.test.mjs tests/conformance/test/private-admission-734-736-gate.test.mjs tests/conformance/test/private-admission-737-738-gate.test.mjs tests/conformance/test/private-admission-739-745-gate.test.mjs tests/conformance/test/private-admission-746-753-gate.test.mjs tests/conformance/test/private-admission-754-766-gate.test.mjs`
  - passed, 74 tests.
- `npm run check:package-surface` - passed. NPM emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
