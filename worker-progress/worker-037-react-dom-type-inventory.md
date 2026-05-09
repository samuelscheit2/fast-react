# worker-037-react-dom-type-inventory

## Objective

Add deterministic React DOM declaration/runtime type-gap inventory files for `@types/react-dom@19.2.3` against React DOM 19.2.6 runtime subpaths.

## Summary

Implemented a checked, deterministic React DOM type-gap inventory under the conformance workspace. The inventory compares the existing generated React DOM 19.2.6 runtime package inventory with exact npm tarball evidence for `@types/react-dom@19.2.3` and `@types/react@19.2.14`.

The generator keeps runtime package compatibility separate from TypeScript declaration compatibility. It does not execute React DOM package code directly, does not mutate root manifests or lockfiles, does not add dependencies, and keeps all Fast React runtime/type compatibility claims false.

Continuation note: the resumed worker instruction explicitly said not to spawn or wait on nested agents, so no nested-agent results were used for the completion pass.

## Changed Files

- `tests/conformance/src/react-dom-type-targets.mjs`
- `tests/conformance/src/react-dom-type-declaration-parser.mjs`
- `tests/conformance/src/react-dom-type-inventory-generator.mjs`
- `tests/conformance/src/react-dom-type-inventory.mjs`
- `tests/conformance/scripts/generate-react-dom-type-inventory.mjs`
- `tests/conformance/scripts/print-react-dom-type-inventory.mjs`
- `tests/conformance/test/react-dom-type-inventory.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json`
- `worker-progress/worker-037-react-dom-type-inventory.md`

## Evidence Gathered

- Runtime baseline: checked `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json` for `react-dom@19.2.6`.
- Declaration baseline: downloaded exact `@types/react-dom@19.2.3` and `@types/react@19.2.14` tarballs from npm metadata, verified `dist.integrity`, and parsed package `exports` plus `.d.ts` files.
- Declaration parsing is deterministic structured parsing of export maps, direct declaration exports, named re-exports, relative re-export resolution, and React peer declaration references. The TypeScript compiler API is not required.

## Type/Runtime Gaps

- Runtime-only subpath:
  - `./profiling`
- Declaration-only subpaths:
  - `./canary`
  - `./experimental`
- Runtime exports missing from declarations include:
  - root `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
  - `./client` `version`
  - `./server.node` `version`
  - `./server.browser` `version` and `resume`
  - `./server.edge` `version`
  - `./server.bun` `version` and `resume` where `resume` is present as an undefined runtime key
  - `./static.browser` `resumeAndPrerender`
  - every runtime key from `./profiling`, because there is no declaration subpath
- React Server Component condition gaps:
  - Root `react-dom` has a narrower `react-server` runtime surface than the default declarations describe.
  - `./client`, `./server*`, `./static*`, and `./profiling` resolve to throwing `react-server` runtime branches while `@types/react-dom` exposes the default declarations for those subpaths.

## Recommended Declaration Policy

Fast React should not infer runtime compatibility from `@types/react-dom`, and should not infer TypeScript compatibility from runtime exports. React DOM declarations should be treated as a separate compatibility product: either reference `@types/react-dom@19.2.3` with explicit known gaps or ship Fast React-owned declarations with their own checked inventory.

Do not claim declaration parity for profiling, server/static resume APIs, client-root `version`, or `react-server` condition-specific surfaces until those gaps are resolved or intentionally documented.

## Commands Run

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg --files tests/conformance | sort`
- `rg --files worker-progress | sort`
- `sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md`
- `node --test tests/conformance/test/react-dom-type-inventory.test.mjs`
- `node --input-type=module -e "...generateReactDomTypeInventory byte-compare..."`
- `npm test --workspace @fast-react/conformance`
- `node tests/conformance/scripts/generate-react-dom-type-inventory.mjs --write`
- `node --test tests/conformance/test/react-dom-type-inventory.test.mjs`
- `rg -n "<temp/local path leak regex>" ...scoped files...`
- `perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/; close ARGV if eof' ...scoped files...`

## Verification Results

- Focused React DOM type inventory test passed: 7 tests.
- Regenerated React DOM type inventory matched the checked artifact byte-for-byte.
- The direct generate CLI completed successfully with `--write`; the focused test still passed afterward.
- Full conformance workspace passed: 88 tests.
- Temp/local path leak check produced no matches.
- Trailing whitespace check produced no matches.

## Risks Or Blockers

- The parser is intentionally scoped to the declaration export patterns present in the pinned tarballs. If DefinitelyTyped changes to more complex TypeScript syntax, the generator should fail or be extended rather than silently broadening compatibility claims.
- The existing runtime inventory is the source of runtime evidence. This worker did not add a new React DOM export/descriptor oracle and did not compare Fast React behavior.
- Network access is required to regenerate from npm metadata and tarballs.

## Recommended Next Tasks

- Add the separate React DOM runtime export/descriptor oracle before implementing package-surface behavior.
- Decide whether Fast React will reference `@types/react-dom` with documented gaps or publish its own declarations.
- Add condition-specific declaration policy for `react-server` surfaces before claiming React DOM TypeScript compatibility.
