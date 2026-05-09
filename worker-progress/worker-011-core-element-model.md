# worker-011-core-element-model

## Objective

Implement the first Rust core data model primitives needed for React 19.2.6
element compatibility, limited to renderer-agnostic core types:

- compatibility targets
- React symbol tags
- keys, refs, and owners as explicit data
- placeholder React element records
- loud unimplemented behavior for JS semantics that still require conformance

## Sources and commands used

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-001-architecture.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-010-initial-scaffold.md`

I did not read `ORCHESTRATOR.md`.

Representative local commands:

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,240p' worker-progress/worker-001-architecture.md`
- `sed -n '1,980p' worker-progress/worker-004-api-inventory.md`
- `sed -n '1,260p' worker-progress/worker-010-initial-scaffold.md`
- `rg --files crates/fast-react-core worker-progress`
- `rg "fast_react_core|UnimplementedReactBehavior|REACT_COMPATIBILITY_TARGET|create_element_placeholder|unimplemented_behavior" -n crates packages bindings tests worker-progress`
- `git status --short --branch`
- `curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...`
- `curl -fsSL https://registry.npmjs.org/react-is/-/react-is-19.2.6.tgz ...`
- `curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz ...`
- `tar -xzf ... --strip-components=1`
- `rg 'Symbol\.for\("react\.|react\.view_transition|react\.suspense_list|react\.client\.reference' /tmp/...`
- `cargo fmt --all --check`
- `cargo fmt --all`
- `cargo test -p fast-react-core --all-features`
- `cargo test --workspace --all-features`
- `rm Cargo.lock`

Nested subagent checks:

- `Turing` verified React 19.2.6 element and exotic symbol strings, key/ref
  behavior, and JS-only semantics from extracted npm tarballs. Key findings:
  the element brand is `react.transitional.element`; `key` is string-coerced
  and removed from props; `ref` is now a normal prop while `element.ref`
  remains compatibility behavior; `cloneElement(..., { ref: undefined })`
  preserves the old ref; descriptor/freezing/owner-stack behavior must stay
  JS-conformance work.
- `Einstein` reviewed the planned Rust API shape against scaffold constraints.
  I used the findings to add explicit owner metadata, remove broad `From`
  conversions for keys, split public vs conditional/internal symbol tags, and
  make unimplemented behavior machine-classifiable.

## Files changed

- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-core/src/compatibility.rs`
- `crates/fast-react-core/src/element.rs`
- `crates/fast-react-core/src/symbols.rs`
- `worker-progress/worker-011-core-element-model.md`

## Core model implementation summary

- Replaced the single-file scaffold with small renderer-agnostic modules for
  compatibility target records, React symbol tags, and element data records.
- Kept the accepted compatibility target strings:
  `react@19.2.6`, `react-dom@19.2.6`, and `@types/react@19.2.14`.
- Added `PackageCompatibilityTarget` and `COMPATIBILITY_TARGETS` without adding
  `@types/react-dom`; that target still needs an explicit project decision.
- Added `ReactSymbolTag` with React 19.2.6 symbol names. The stable public React
  subset is separate from conditional/internal tags:
  `react.suspense_list`, `react.view_transition`, and
  `react.client.reference`.
- Added `ReactKey` as an already-normalized string wrapper. It intentionally
  does not perform JS coercion and no longer has broad `From<String>` or
  `From<&str>` conversions.
- Added `ReactRefSlot` with `Unset`, `Null`, and `Value` so future clone/create
  code can distinguish "preserve previous ref", "clear ref", and "set ref".
- Added `ReactOwner` and `ReactOwnerSlot` as explicit owner metadata handles
  without implementing owner-stack capture.
- Added `ReactElementRecord` as a normalized placeholder record carrying
  transitional element brand, type, key, ref slot, props, and owner slot.
- Added `UnimplementedReactBehaviorKind` and focused constructors for JS
  conformance, property descriptors, development object freezing, owner stack,
  and children traversal gaps.

The implementation intentionally does not implement `createElement`,
`cloneElement`, JSX runtimes, `Children`, JS descriptors, Object.freeze,
warnings, owner-stack capture, fibers, renderers, hooks, scheduler, DOM, or
native bindings.

## Verification results

- `cargo fmt --all --check`
  - Failed before formatting after the first edit.
  - Ran `cargo fmt --all`.
  - Final run passed.
- `cargo test -p fast-react-core --all-features`
  - Passed.
  - 15 unit tests passed.
  - 0 doc tests.
- `cargo test --workspace --all-features`
  - Passed and was feasible in the current scaffold.
  - 23 unit tests passed across workspace crates.
  - Doc tests passed for all five Rust crates.

Cargo generated a transient root `Cargo.lock` during verification. It is
outside this worker's write scope and was removed after the test runs, matching
worker-010's existing scaffold policy.

## Deviations from accepted reports, if any

- Worker-001 listed the main observable public brands. This worker also models
  `react.suspense_list`, `react.view_transition`, and
  `react.client.reference` as conditional/internal tags because direct
  React 19.2.6 tarball evidence from `react`, `react-is`, and `react-dom`
  showed those `Symbol.for` strings in recognition paths. They are not included
  in the stable public React tag subset.
- I did not add `@types/react-dom` to compatibility targets, because
  worker-004 explicitly left that as an open target decision.
- `ReactKey` stores normalized strings only. JS key coercion is deliberately
  deferred to the JS binding/conformance layer rather than approximated in
  Rust.

## Risks and root causes

- JS object-shape risk. Root cause: React element compatibility depends on
  descriptors, enumerability, warning getters, frozen dev objects, debug fields,
  and prod/dev entrypoint differences. Mitigation: core records stay
  normalized, and descriptor/freezing behavior has typed loud-unimplemented
  errors.
- Key/ref semantic risk. Root cause: JS `key` coercion and `ref` compatibility
  behavior are observable and differ across `createElement`, JSX, and
  `cloneElement`. Mitigation: core separates normalized key data and
  `Unset`/`Null`/`Value` ref slots without implementing JS coercion.
- Owner metadata risk. Root cause: `_owner` is captured from React shared
  internals and changes during clone when refs change. Mitigation: owner is an
  explicit slot, but owner capture remains loud-unimplemented.
- Symbol drift risk. Root cause: React's internal and conditional symbols may
  differ by package condition or sibling package. Mitigation: stable public
  tags are separated from conditional/internal tags and tested by exact string.
- Maintainability: the core has no renderer, Node, DOM, timer, or native
  dependencies and keeps modules small.
- Performance: the added types are lightweight wrappers/enums. No hot-path
  behavior or allocation-heavy algorithms were introduced beyond storing keys
  as owned strings.
- Security: no native or JS execution behavior was added. Security-sensitive
  escaping, descriptors, and host behavior remain outside this crate.

## Proposed follow-up implementation tasks

1. Implement JS-binding-backed `createElement` and JSX runtime construction
   with conformance tests for key coercion, ref preservation, owner capture,
   descriptors, warnings, and dev/prod differences.
2. Add oracle tests comparing React 19.2.6 element objects for
   `createElement`, `cloneElement`, `jsx`, `jsxs`, and `jsxDEV`.
3. Decide whether `@types/react-dom@19.2.3` becomes an official compatibility
   target alongside `@types/react@19.2.14`.
4. Add context, memo, lazy, and forwardRef record types once their JS object
   shapes and conformance scenarios are assigned.
5. Add `Children` traversal only after behavior probes cover null-ish values,
   booleans, bigints, iterables, Maps, lazy values, thenables, key escaping, and
   object errors.
6. Decide whether conditional/internal symbol tags should be generated from a
   pinned inventory rather than hand-maintained.
7. Have a root-manifest owner decide whether to track root `Cargo.lock`.

## Completion checklist

- [x] Read required worker and accepted-report files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Modified only `crates/fast-react-core/**` and
      `worker-progress/worker-011-core-element-model.md`.
- [x] Preserved scaffold imports of `UnimplementedReactBehavior` and
      `unimplemented_behavior`.
- [x] Added compatibility target records for the three accepted targets.
- [x] Added React 19.2.6 symbol tags with public vs conditional/internal
      classification.
- [x] Added explicit key/ref/owner data types.
- [x] Added placeholder element record with React 19 transitional element
      brand.
- [x] Kept JS behavior loud-unimplemented with typed error kinds.
- [x] Did not implement JS bindings, renderer behavior, hooks, fiber,
      scheduler, DOM behavior, or package manifests.
- [x] Used nested subagents to test hypotheses and incorporated their findings.
- [x] Reviewed quality, maintainability, performance, and security
      implications.
- [x] Ran `cargo fmt --all --check`.
- [x] Ran `cargo test -p fast-react-core --all-features`.
- [x] Ran `cargo test --workspace --all-features`.
- [x] Removed generated root `Cargo.lock` because it is outside write scope.

## Handoff summary

The core crate now has first-pass renderer-agnostic element model primitives
for React 19.2.6 compatibility. It records compatibility targets, exact React
symbol tag names, normalized keys, explicit ref and owner slots, and a
placeholder element record branded as `react.transitional.element`.

Real React element construction remains intentionally unimplemented because the
root compatibility causes are JS object semantics and owner/descriptor behavior,
not missing Rust structs. The next worker should wire these records through
JS-binding-backed conformance tests rather than guessing descriptor behavior in
the Rust core.
