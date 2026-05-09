# worker-053-react-dom-types-policy

## Objective

Produce a report-only React DOM TypeScript declaration shipping policy for Fast React.

Write scope honored: only `worker-progress/worker-053-react-dom-types-policy.md` was changed. No package files or declaration files were implemented.

## Summary

The next React DOM implementation should deliberately defer TypeScript compatibility. It should not add a `types` field, should not add declaration files, and should not claim that `@fast-react/react-dom` is TypeScript-compatible yet.

The eventual TypeScript policy should be Fast React-owned declaration shims, generated or copied with provenance from `@types/react-dom@19.2.3` and then overlaid for Fast React package naming and known React DOM 19.2.6 gaps. A raw dependency on `@types/react-dom` is not enough for the current scoped package because TypeScript will not automatically apply `@types/react-dom` to imports from `@fast-react/react-dom`, and the DefinitelyTyped package also misses or overstates parts of the runtime surface.

The root cause is not a missing package metadata field. Runtime compatibility, TypeScript declaration compatibility, and React Server Component condition compatibility are separate products with separate evidence. Worker 037's checked inventory explicitly keeps `fastReactRuntimeCompatible`, `fastReactTypeDeclarationsCompatible`, and `compatibilityClaimed` false.

## Policy Recommendation

Immediate policy:

- Keep `@fast-react/react-dom` without `types`, `typings`, or declaration export conditions until an assigned type worker owns declaration files and a TypeScript resolution check.
- Do not reference `@types/react-dom` as the public type story for `@fast-react/react-dom`. It can remain the pinned upstream declaration evidence and source material.
- Do not add declaration-only `./canary` or `./experimental` subpaths to `@fast-react/react-dom` unless matching runtime or explicitly documented augmentation-only behavior is implemented.
- Do not ship a `react-dom/profiling` type as a thin alias to the normal root until the runtime profiling surface and client-root APIs are intentionally covered.
- Treat `react-server` types as unresolved. Default declarations are wrong for `react-server` branches that throw or narrow the export set.

Eventual shipping policy:

- Ship owned declaration shims under `packages/react-dom/*.d.ts` and connect them through the package `exports` map with `types` conditions.
- Use `@types/react-dom@19.2.3` and `@types/react@19.2.14` as pinned source evidence, not as an unqualified compatibility claim.
- Add Fast React-specific overlays for the scoped package name, `./profiling`, missing runtime declarations, and `react-server` condition branches.
- Keep compatibility claims false until TypeScript resolution tests prove imports for every public subpath under the chosen package name.

## Evidence From Required Workers

Worker 033 established the published React DOM runtime surface:

- `react-dom@19.2.6` ships no declarations.
- The public runtime includes root, client, server variants, static variants, `profiling`, `test-utils`, and `package.json`.
- `react-server` condition branches narrow root exports and make client, server, static, and profiling modules throw.
- Physical `.js` and CJS subpaths are blocked by the package `exports` map.
- TypeScript support needed a separate policy: reuse `@types/react-dom`, generate shims, or ship owned declarations.

Worker 035 established the current Fast React package state:

- `packages/react-dom/package.json` is named `@fast-react/react-dom`.
- It has no `types`, `typings`, or `typesVersions`.
- It mirrors the runtime export map with loud unsupported placeholders.
- `react-dom/profiling` exists as a runtime placeholder and exports client-root keys such as `createRoot` and `hydrateRoot`.
- The placeholder `version` is intentionally not `19.2.6`, so adding declarations now would create a stronger compatibility signal than the runtime package is prepared to make.

Worker 036 established the runtime oracle:

- The runtime oracle covers 13 runtime subpaths, including `./profiling`.
- It records `react-server` throwing behavior for `./client`, `./server*`, `./static*`, and `./profiling`.
- It records root and client export descriptors, server/static variants, the Bun `resume` undefined export caveat, and blocked physical subpaths.
- It intentionally does not compare Fast React React DOM behavior yet, and keeps Fast React compatibility claims false.

Worker 037 established the declaration/runtime type-gap inventory:

- Runtime-only subpath: `./profiling`.
- Declaration-only subpaths: `./canary` and `./experimental`.
- Missing runtime declarations include root internals, `./client` `version`, `./server.node` `version`, `./server.browser` `version` and `resume`, `./server.edge` `version`, `./server.bun` `version` and `resume`, `./static.browser` `resumeAndPrerender`, and every runtime key from `./profiling`.
- React Server Component gaps include the root surface being narrower than default declarations and client/server/static/profiling subpaths throwing while declarations expose default APIs.
- The checked artifact separates runtime compatibility from TypeScript declaration compatibility and keeps all Fast React declaration claims false.

## Runtime And Type Gaps

The highest-risk gaps are not cosmetic:

- `./profiling` is public at runtime but absent from `@types/react-dom@19.2.3`. It exports root, portal, client-root, resource, form, batching, and version keys.
- `./canary` and `./experimental` exist only in declarations. Shipping them blindly would make TypeScript accept imports that runtime resolution does not support.
- Several server/static declarations omit runtime exports. Some are likely DefinitelyTyped lag; some, such as Bun `resume`, are runtime quirks that need intentional documentation.
- The `react-server` condition cannot be modeled by default declarations. The runtime root drops behaviorful exports such as `createPortal` and `flushSync`, while most non-root branches throw.
- Current Fast React placeholders throw for behaviorful APIs. Strong declarations would encourage user code to compile against APIs that are intentionally unsupported.

## Package Naming Implications

The current package is scoped as `@fast-react/react-dom`, while DefinitelyTyped declarations target the unscoped module name `react-dom`.

Implications:

- Installing or referencing `@types/react-dom` does not automatically type `import "@fast-react/react-dom"`.
- The DefinitelyTyped declarations also depend on the unscoped React type ecosystem. Fast React currently uses `@fast-react/react`, so React and React DOM type policies need an alias or owned-module plan before public TypeScript support is credible.
- If a later distribution strategy provides an unscoped `react-dom` replacement or npm alias, `@types/react-dom` may become useful as a compatibility baseline for that mode. It still does not solve `./profiling`, `react-server`, or scoped-package imports.
- Owned shims can preserve Fast React's scoped package name now and still be generated from upstream declarations where they are accurate.

## Rejected Options

Reference `@types/react-dom` directly:

- Rejected for the next implementation. It would not type the scoped package by default and would import known upstream gaps into Fast React without a compatibility boundary.
- It remains useful as pinned evidence and a source for generated declarations.

Ship owned declaration shims immediately:

- Rejected for the next implementation. There is no TypeScript smoke harness, no Fast React declaration oracle, no React package type policy, and no condition-specific declaration design.
- This is the right eventual direction once those prerequisites exist.

Deliberately defer TypeScript compatibility:

- Accepted for the next implementation. It matches the current placeholder runtime, avoids false compatibility claims, and preserves room for owned shims with checked gaps.

## Delegated Hypothesis Checks

I used three nested read-only explorer agents to challenge the policy:

- One checked whether `@types/react-dom` can be the shipping policy. I used its findings to confirm that `./profiling`, `./canary`, `./experimental`, missing runtime exports, and `react-server` gaps make a raw reference unsafe.
- One checked package naming and current scaffold state. I used its findings to confirm that `@fast-react/react-dom` has no type metadata and that scoped package imports need owned declarations or an explicit alias strategy.
- One challenged the defer-now, owned-shims-later policy. Its result supported deferring immediate TypeScript claims and recommended separate follow-up workers for type resolution evidence and shim implementation.

All delegated checks were read-only and did not require changes outside this report.

## Recommended Follow-Up Workers

1. React package type naming policy
   - Write scope: `worker-progress/worker-0xx-react-package-types-policy.md`.
   - Task: decide how `@fast-react/react`, unscoped `react`, `@types/react`, JSX runtime declarations, and npm alias modes interact before React DOM declarations depend on React types.

2. TypeScript resolution harness
   - Write scope: `tests/types/harness/**`, root `package.json`, root `package-lock.json`, `worker-progress/worker-0xx-typescript-resolution-harness.md`.
   - Task: add a minimal TypeScript compiler smoke harness without React DOM declarations. It should prove package/subpath resolution, custom conditions, and path-leak-free diagnostics.

3. Fast React React DOM type-resolution oracle
   - Write scope: `tests/conformance/src/react-dom-fast-type-resolution-*.mjs`, `tests/conformance/scripts/*react-dom-fast-type-resolution*.mjs`, `tests/conformance/test/react-dom-fast-type-resolution.test.mjs`, `tests/conformance/oracles/fast-react-react-dom-type-resolution.json`, `worker-progress/worker-0xx-react-dom-fast-type-resolution-oracle.md`.
   - Task: record the current absence of Fast React React DOM declarations and define the expected resolution matrix for root, client, server/static variants, profiling, test-utils, canary/experimental, and `react-server`.

4. Owned React DOM declaration shims
   - Write scope: `packages/react-dom/*.d.ts`, `packages/react-dom/package.json`, `tests/types/react-dom/**`, `worker-progress/worker-0xx-react-dom-owned-declaration-shims.md`.
   - Task: ship scoped-package declaration files and `exports` `types` conditions derived from `@types/react-dom@19.2.3`, with Fast React overlays for `./profiling`, missing runtime declarations, blocked canary/experimental runtime imports, and `react-server` condition branches.

5. React DOM declaration parity audit
   - Write scope: `worker-progress/worker-0xx-react-dom-declaration-parity-audit.md`.
   - Task: after shims exist, audit the gap between shipped Fast React declarations, the worker 037 inventory, and the worker 036 runtime oracle. Recommend whether any gaps should remain intentionally documented.

These scopes are non-overlapping with each other. The declaration-shim worker should not run concurrently with runtime workers that modify `packages/react-dom/package.json`.

## Commands Run

Project orientation:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
```

Required worker evidence:

```sh
sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md
sed -n '261,620p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,280p' worker-progress/worker-035-package-surface-scaffolds.md
sed -n '1,300p' worker-progress/worker-036-react-dom-export-oracle.md
sed -n '1,320p' worker-progress/worker-037-react-dom-type-inventory.md
```

Local package and artifact inspection:

```sh
sed -n '1,220p' packages/react-dom/package.json
sed -n '1,220p' packages/react-dom/index.js
sed -n '1,220p' packages/react-dom/profiling.js
sed -n '1,220p' packages/react/package.json
sed -n '1,280p' tests/conformance/src/react-dom-type-targets.mjs
sed -n '1,260p' tests/conformance/src/react-dom-type-inventory.mjs
sed -n '1,180p' tests/conformance/test/react-dom-type-inventory.test.mjs
sed -n '80,180p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '250,360p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '1,220p' tests/conformance/package.json
rg -n '(@types/react-dom|react-dom.*types|"types"|"typings"|typesVersions|canary|experimental|profiling)' packages tests/conformance worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-037-react-dom-type-inventory.md package.json package-lock.json
rg -n 'typescript|tsc|\.d\.ts|typesVersions|"types"' package.json package-lock.json packages tests -g '!tests/conformance/oracles/*.json'
git status --short
```

Structured oracle summaries:

```sh
node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json','utf8')); console.log(Object.keys(j)); console.log(JSON.stringify(j.targets, null, 2));"
node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync('tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json','utf8')); function walk(o,p=[]){ if(o&&typeof o==='object'){ for(const [k,v] of Object.entries(o)){ if(/gap|missing|extra|subpath|claim|compat/i.test(k)) console.log([...p,k].join('.'), Array.isArray(v)?'array('+v.length+')':typeof v); if(p.length<2) walk(v,[...p,k]); }}} walk(j);"
node - <<'NODE'
const fs = require('fs');
const j = JSON.parse(fs.readFileSync('tests/conformance/oracles/react-19.2.6-react-dom-type-inventory.json','utf8'));
console.log('conformanceClaims', JSON.stringify(j.conformanceClaims, null, 2));
console.log('compatibilityPolicy', JSON.stringify(j.compatibilityPolicy, null, 2));
console.log('runtimeOnlySubpaths', j.gaps.runtimeOnlySubpaths.join(', '));
console.log('declarationOnlySubpaths', j.gaps.declarationOnlySubpaths.join(', '));
console.log('missingRuntimeDeclarations');
for (const g of j.gaps.missingRuntimeDeclarations) console.log(`- ${g.subpath}: ${g.exportName}${g.note ? ' ('+g.note+')' : ''}`);
console.log('reactServerConditionGaps');
for (const g of j.gaps.reactServerConditionGaps) console.log(`- ${g.subpath}: ${g.status}`);
NODE
node - <<'NODE'
const fs=require('fs');
const j=JSON.parse(fs.readFileSync('tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json','utf8'));
console.log(Object.keys(j));
console.log('claims', JSON.stringify(j.conformanceClaims||{}, null, 2));
console.log('runtimeSubpaths', j.runtimeSubpaths);
NODE
```

## Verification

Verification commands are recorded after the report was written:

```sh
rg -n '<local-and-temp-path-leak-patterns>' worker-progress/worker-053-react-dom-types-policy.md
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/; close ARGV if eof' worker-progress/worker-053-react-dom-types-policy.md
git diff --check --no-index /dev/null worker-progress/worker-053-react-dom-types-policy.md
git status --short
```

Expected result: no local path leaks, no trailing whitespace, no diff whitespace errors, and only this report changed.

## Risks Or Blockers

- TypeScript support depends on a React type naming decision because React DOM declarations refer to React types.
- `react-server` type conditions need a design before Fast React can claim server-component-safe TypeScript behavior.
- `@types/react-dom` can drift independently of React DOM runtime. Future workers should keep versioned inventories rather than relying on package names alone.
- `./profiling` declarations will be Fast React-owned because the upstream declaration package lacks the runtime subpath.
- `./canary` and `./experimental` require a deliberate augmentation policy so TypeScript does not advertise nonexistent runtime modules.

## Changed Files

- `worker-progress/worker-053-react-dom-types-policy.md`

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Used worker 033, worker 035, worker 036, and worker 037 evidence.
- [x] Used nested agents to test the policy hypothesis.
- [x] Chose a concrete policy for the next implementation.
- [x] Included runtime/type gaps, `react-server` condition gaps, `profiling`, `canary`/`experimental`, and package naming implications.
- [x] Recommended non-overlapping follow-up workers with concrete write scopes.
- [x] Changed only the assigned report file.
