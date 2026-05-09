# worker-017-runtime-inventory-generation

## Objective

Replace the placeholder-only conformance inventory with deterministic
runtime/package inventory generation for the pinned React 19.2.6 runtime
targets:

- `react@19.2.6`
- `react-dom@19.2.6`

The implementation generates evidence from real npm package metadata and exact
package tarballs while keeping Fast React behavior compatibility claims
explicitly false until a future dual-run oracle exists.

Write scope honored: only `tests/conformance/**` and this worker progress file
were changed. `ORCHESTRATOR.md` was not read.

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-013-conformance-inventory-tooling.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`

Implementation and inspection commands:

```sh
rg --files tests/conformance | sort
sed -n '1,260p' tests/conformance/package.json
sed -n '1,280p' tests/conformance/src/inventory-targets.mjs
sed -n '1,260p' tests/conformance/scripts/print-inventory.mjs
sed -n '1,320p' tests/conformance/test/inventory-placeholder.test.mjs
node tests/conformance/scripts/generate-runtime-inventory.mjs --write
npm run inventory:generate --workspace @fast-react/conformance
npm run inventory:print:markdown --workspace @fast-react/conformance
tmp=$(mktemp) && node tests/conformance/scripts/generate-runtime-inventory.mjs > "$tmp" && cmp -s tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json "$tmp" && rm "$tmp"
rg '/private/var|/var/folders|fast-react-runtime-inventory-[A-Za-z0-9]|/tmp/' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json
git diff --check -- tests/conformance worker-progress/worker-017-runtime-inventory-generation.md
git status --short
```

Required verification commands:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
```

Delegated checks:

- Nested read-only audit subagent `019e0dd4-5d44-77e0-b8f4-67da4faa4ab1`
  checked the planned generator against worker-002/004/013/014 constraints. It
  confirmed the package-evidence-only direction and caught the expected
  mid-edit broken placeholder imports before the tests were replaced.
- Nested read-only verification subagent `019e0dd4-7d86-7882-aafa-756e5e0f1853`
  independently fetched and extracted `react@19.2.6` and `react-dom@19.2.6`
  tarballs in temp directories. It confirmed runtime/export facts, the
  production `react` root key difference, `react-server` throws, condition
  caveats, browser bundle active-handle risk, and a macOS temp-path leak. The
  path leak was fixed with `realpathSync` normalization and an artifact guard
  test.

## Files changed

- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`
- `tests/conformance/inventory/react-19.2.6-target-placeholder.json`
  removed
- `tests/conformance/scripts/generate-runtime-inventory.mjs`
- `tests/conformance/scripts/print-inventory.mjs`
- `tests/conformance/src/inventory-targets.mjs`
- `tests/conformance/src/runtime-inventory-generator.mjs`
- `tests/conformance/src/runtime-inventory.mjs`
- `tests/conformance/test/runtime-inventory.test.mjs`
- `tests/conformance/test/inventory-placeholder.test.mjs` removed
- `worker-progress/worker-017-runtime-inventory-generation.md`

## Inventory generation implementation summary

- Replaced the static placeholder artifact with a checked-in generated runtime
  package inventory at
  `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`.
- Added `scripts/generate-runtime-inventory.mjs`, which uses Node built-ins plus
  system `tar` to:
  - resolve exact npm registry metadata;
  - download exact package tarballs;
  - verify `dist.integrity`;
  - extract packages into a temporary `node_modules` tree;
  - parse package `exports` into stable subpath and condition rows;
  - record tarball file lists;
  - run isolated Node child-process probes per entrypoint and mode.
- Added explicit HTTPS fetch timeouts so registry metadata or tarball download
  stalls fail the generator instead of hanging indefinitely.
- Added runtime probe modes for default Node and `react-server`, each in
  development and production. This records the production `react` root key
  difference where `act` and `captureOwnerStack` are absent.
- Added condition-resolution evidence for default Node, `react-server`,
  `browser`, `worker`, `edge-light`, `workerd`, `bun`, and `deno` as Node
  resolver evidence only.
- Added blocked physical subpath evidence for root `.js` files not exported by
  package `exports`, such as `react/index.js` and `react-dom/server.js`.
- Added `scripts/print-inventory.mjs` to read the checked artifact and print
  JSON or Markdown without network or package execution.
- Added a conformance workspace `check` script so root `npm run check:js`
  exercises the inventory tests.

## Generated inventory evidence and remaining manual fields

Generated package evidence:

- `react@19.2.6`
  - Tarball: `https://registry.npmjs.org/react/-/react-19.2.6.tgz`
  - Integrity:
    `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`
  - File count: 27
  - Public subpaths: `.`, `./package.json`, `./jsx-runtime`,
    `./jsx-dev-runtime`, `./compiler-runtime`
- `react-dom@19.2.6`
  - Tarball: `https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz`
  - Integrity:
    `sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==`
  - File count: 43
  - Public subpaths include `./client`, all server/static variants,
    `./profiling`, `./test-utils`, and `./package.json`
- `scheduler@0.27.0`
  - Tracked as a supporting runtime dependency because React DOM probes need it.
  - File count: 15

Generated runtime evidence:

- Default development `react` root probe records 44 enumerable keys.
- Default production `react` root probe records 42 enumerable keys.
- `react-server` React root probe records the narrower server-safe key set.
- `react-dom/client`, `react-dom/server`, all explicit server variants,
  `react-dom/static`, all explicit static variants, and `react-dom/profiling`
  throw unsupported-in-React-Server-Components errors under the
  `react-server` condition.
- Runtime probes also record `require.resolve`, `require()` export keys and
  descriptors, and dynamic `import()` namespace keys.

Remaining manual fields:

- Type declaration inventory is still manual target metadata only for
  `@types/react@19.2.14` and `@types/react-dom@19.2.3`. This worker did not add
  TypeScript compiler API parsing.
- Fast React behavior compatibility remains explicitly false:
  `realReactBehaviorCompared`, `fastReactComparedToReact`,
  `fastReactBehaviorCompatible`, and `fullDualRunOracleExists` are all `false`.

## Verification results

- `npm run inventory:generate --workspace @fast-react/conformance`: passed.
  Generated the checked artifact from real npm metadata and tarballs.
- Regeneration determinism check:
  `node tests/conformance/scripts/generate-runtime-inventory.mjs > "$tmp"` then
  `cmp -s` against the checked artifact passed.
- Temp-path leak check:
  `rg '/private/var|/var/folders|fast-react-runtime-inventory-[A-Za-z0-9]|/tmp/' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`
  returned no matches.
- `npm test --workspace @fast-react/conformance`: passed.
  - 8 Node tests passed.
  - Tests directly assert generation guardrails:
    `lifecycleScriptsExecuted: false`,
    `rootManifestsOrLockfilesMutated: false`, and
    `generatedTimestampIncluded: false`.
- `npm run test:conformance`: passed.
  - Delegated to the conformance workspace test and passed the same 8 tests.
- `npm run check:js`: passed.
  - React smoke checks passed.
  - Native loader checks passed.
  - Conformance workspace `check` ran `npm test` and passed.
- `git diff --check -- tests/conformance worker-progress/worker-017-runtime-inventory-generation.md`:
  passed.

Notes:

- npm printed local config warnings for `minimum-release-age`; these are
  existing local npm configuration warnings and did not affect command success.

## Deviations from worker-002, worker-004, worker-013, or worker-014 recommendations, if any

- No deviation from worker-002's core recommendation: the implementation uses
  generated package evidence, isolated runtime probes, and keeps behavior
  conformance separate from inventory.
- No deviation from worker-004's package and runtime inventory direction. One
  additional precision point is now captured: `NODE_ENV=production` omits
  `act` and `captureOwnerStack` from the root `react` export keys.
- No deviation from worker-013's guardrail that all real Fast React conformance
  claims must remain false until generated inventory and a later oracle exist.
  This worker replaces the placeholder with generated runtime/package evidence,
  but still does not compare Fast React behavior.
- No deviation from worker-014's React placeholder boundary. The generated
  inventory is not consumed by `packages/react` in this worker because that path
  is outside the write scope.

## Risks and root causes

Quality and maintainability:

- Root cause addressed: manual placeholder arrays could drift from React
  artifacts. The generated artifact now comes from npm metadata, verified
  tarballs, package `exports`, and runtime probes.
- Root cause addressed: `npm run check:js` previously did not exercise
  conformance inventory code. The conformance workspace now has a `check`
  script.
- Residual risk: the checked JSON is large. This is acceptable because it is the
  concrete evidence artifact, but future inventory versions may need per-package
  split files if diffs become hard to review.

Performance:

- Runtime probes are intentionally isolated per entrypoint and mode with a
  timeout. This avoids hangs from browser/static React DOM bundles that can
  leave active handles under Node.
- Registry metadata and tarball fetches now have explicit request timeouts so
  network stalls fail generation rather than leaving workers blocked.
- Normal tests read the checked artifact and do not hit the network.

Security:

- Tarball contents are treated as untrusted package artifacts. Generation does
  not run package lifecycle scripts or mutate root manifests/lockfiles.
- Runtime probes do execute React package code from exact tarballs, but only in
  short-lived child processes inside temporary directories.
- No DOM, SSR, resource injection, or Fast React behavior compatibility claim is
  made from this inventory.

Root-cause caveats:

- Runtime and type surfaces are split between React packages and DefinitelyTyped
  packages, so type compatibility cannot be inferred from runtime keys.
- Node custom condition probes are resolver evidence, not proof of true browser,
  edge, worker, Bun, or Deno environment behavior.
- Inventory cannot prove Fast React behavior compatibility. The missing root
  capability remains the future dual-run oracle harness.

## Proposed follow-up implementation tasks

1. Add TypeScript compiler API declaration inventory for `@types/react@19.2.14`
   and the eventual `@types/react-dom` target decision.
2. Split the large generated artifact by package or probe class if review noise
   becomes a problem.
3. Add explicit dynamic-import namespace policy tests if Node CJS interop keys
   become part of compatibility gates.
4. Build package-resolution conformance scenarios that compare React oracle
   outputs against Fast React aliased as `react` and `react-dom`.
5. Implement the future dual-run oracle harness with explicit expected
   divergences before any Fast React behavior compatibility claim.
6. Add browser/edge runtime probes in real target environments if those
   branches become compatibility gates rather than Node resolver evidence.

## Completion checklist

- [x] Read all required source and progress files first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Changed only `tests/conformance/**` and this worker progress file.
- [x] Did not modify root manifests or lockfiles.
- [x] Added no dependencies.
- [x] Did not implement the full dual-run oracle harness.
- [x] Generated package metadata evidence from real artifacts.
- [x] Generated tarball file-list evidence from exact tarballs.
- [x] Verified tarball integrity from `dist.integrity`.
- [x] Parsed package export maps for `react@19.2.6` and `react-dom@19.2.6`.
- [x] Generated runtime keys for relevant React and React DOM entrypoints.
- [x] Generated default Node and `react-server` condition probes.
- [x] Generated development and production runtime probes.
- [x] Generated condition-resolution evidence where feasible.
- [x] Kept type declaration fields manual and documented why.
- [x] Kept all Fast React behavior conformance claims false.
- [x] Added tests that fail if generated inventory claims Fast React
      conformance before an oracle exists.
- [x] Used nested subagents to test hypotheses and verification; results are
      summarized above.
- [x] Reviewed quality, maintainability, performance, and security
      implications.
- [x] Ran `npm test --workspace @fast-react/conformance`.
- [x] Ran `npm run test:conformance`.
- [x] Ran `npm run check:js`.

## Handoff summary

The conformance workspace now has a deterministic runtime/package inventory
generator and a checked React 19.2.6 evidence artifact. The placeholder-only
artifact and placeholder tests were removed.

The generated inventory covers package metadata, integrity-verified tarball
file lists, package export maps, runtime export keys and descriptors for
default Node and `react-server` development/production modes,
condition-resolution evidence, dynamic-import namespace keys, and blocked
physical subpaths.

The implementation deliberately does not parse type declarations and does not
compare Fast React against React. Those fields remain explicit and false in the
artifact and are guarded by tests.
