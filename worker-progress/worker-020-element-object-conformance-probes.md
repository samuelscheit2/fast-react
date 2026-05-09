# worker-020-element-object-conformance-probes

## Objective

Produce an evidence-backed implementation plan for React 19.2.6 element object
conformance before Fast React package behavior changes. The scope is the exact
observable behavior of:

- `React.createElement`
- `React.cloneElement`
- `react/jsx-runtime` `jsx` and `jsxs`
- `react/jsx-dev-runtime` `jsxDEV`

The probes focus on object keys, own property descriptors, symbols,
enumerability, `key`/`ref` behavior, owner/debug fields, development versus
production entrypoints, warnings, freezing, and where each behavior should live
in Fast React.

This worker is research and planning only. No package behavior or source code
was changed.

## Sources and commands used

Read required project sources first:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-001-architecture.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-011-core-element-model.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`

Also inspected current relevant implementation placeholders:

- `crates/fast-react-core/src/element.rs`
- `crates/fast-react-core/src/symbols.rs`
- `crates/fast-react-napi/src/lib.rs`
- `bindings/node/index.cjs`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-dev-runtime.js`
- `tests/conformance/README.md`
- `tests/conformance/src/inventory-targets.mjs`
- `tests/conformance/inventory/react-19.2.6-target-placeholder.json`

I did not read `ORCHESTRATOR.md`.

Environment and target evidence:

```sh
node --version
# v26.0.0

npm --version
# 11.12.1

npm view react@19.2.6 version dist.tarball dist.integrity --json
# version 19.2.6
# tarball https://registry.npmjs.org/react/-/react-19.2.6.tgz
# integrity sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==
```

Temporary probe directory:

- `/tmp/fast-react-element-probe.fsiQUO`

Tarball setup:

```sh
tmp=$(mktemp -d /tmp/fast-react-element-probe.XXXXXX)
mkdir -p "$tmp/node_modules/react"
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz \
  -o "$tmp/react-19.2.6.tgz"
tar -xzf "$tmp/react-19.2.6.tgz" \
  -C "$tmp/node_modules/react" --strip-components=1
```

Representative source and runtime commands:

```sh
rg 'function ReactElement|exports.createElement|exports.cloneElement|jsxProd|jsxDEV|Object.freeze' \
  /tmp/fast-react-element-probe.fsiQUO/node_modules/react/cjs

NODE_ENV=development node <element descriptor probe>
NODE_ENV=production node <element descriptor probe>

NODE_ENV=development node --conditions=react-server <condition probe>
NODE_ENV=production node --conditions=react-server <condition probe>

NODE_ENV=development node <key coercion and warning probe>
NODE_ENV=production node <key coercion and warning probe>

NODE_ENV=development node <defaultProps, props identity, and child-array freeze probe>
NODE_ENV=production node <defaultProps, props identity, and child-array freeze probe>

git status --short
```

The descriptor probes used this core pattern, with different constructors and
configs:

```js
const React = require("react");
const jsxRuntime = require("react/jsx-runtime");
const jsxDevRuntime = require("react/jsx-dev-runtime");

const messages = [];
console.error = (...args) => messages.push({ method: "error", args });
console.warn = (...args) => messages.push({ method: "warn", args });

function shape(el) {
  return {
    objectKeys: Object.keys(el),
    ownKeys: Reflect.ownKeys(el).map(String),
    frozen: Object.isFrozen(el),
    sealed: Object.isSealed(el),
    extensible: Object.isExtensible(el),
    descriptors: Object.getOwnPropertyDescriptors(el),
    propsKeys: Object.keys(el.props),
    propsOwnKeys: Reflect.ownKeys(el.props).map(String),
    propsFrozen: Object.isFrozen(el.props),
    propsDescriptors: Object.getOwnPropertyDescriptors(el.props),
  };
}
```

Nested subagents used:

- `Darwin`: independently probed `react@19.2.6` in `/tmp/react-19-probe-7w3irX`
  with Node `v26.0.0` and npm `11.12.1`. It confirmed the core descriptor,
  key/ref, clone, warning, and production `jsxDEV` findings.
- `Newton`: independently inspected Fast React's current core/package/N-API
  layers and mapped observed behavior to implementation layers. It confirmed
  that Rust should keep normalized records, JS should own final object shape,
  N-API should be deferred for this first slice, and conformance oracle tests
  should compare descriptors before package behavior changes.

No probe was blocked. The repository remained clean before report writing.

## Probe methodology

The probes intentionally used the published `react@19.2.6` package, extracted
from the npm registry tarball into an isolated temporary `node_modules`.

For each relevant entrypoint, I captured:

- package condition and `NODE_ENV`
- `Object.keys(element)`
- `Reflect.ownKeys(element)`
- `Object.getOwnPropertyDescriptors(element)`
- `Object.getOwnPropertyDescriptors(element.props)`
- symbol identity through `Symbol.keyFor(element.$$typeof)`
- `Object.isFrozen`, `Object.isSealed`, and `Object.isExtensible` for element,
  props, `_store`, and child arrays where relevant
- `key` values for `undefined`, `null`, empty string, string, function, object,
  `Symbol`, and throwing `toString`
- `ref` values for omitted, `undefined`, `null`, string, function, and override
  cases
- clone behavior for preserving or replacing `key` and `ref`
- console warnings from `console.error` and `console.warn`
- default `react` condition versus `--conditions=react-server`

The probe normalized descriptor output for readability but retained exact
property order and descriptor flags. In the notes below, `e`, `w`, and `c` mean
enumerable, writable, and configurable.

## Observed React 19.2.6 element object behavior

### Universal element branding

All real elements observed through `createElement`, `cloneElement`, `jsx`,
`jsxs`, and `jsxDEV` use:

```js
Symbol.for("react.transitional.element")
```

`React.isValidElement` is only a brand check:

- a real element returns `true`
- a plain object with `$$typeof: Symbol.for("react.transitional.element")`
  returns `true`
- a plain object with `$$typeof: Symbol.for("react.element")` returns `false`
- `null` and strings return `false`

This means final JS facade behavior cannot rely on hidden Rust identity alone.
The public `$$typeof` own property is the observable compatibility contract.

### Production element shape

Under `NODE_ENV=production`, default and `react-server` conditions produced the
same element object shape for element constructors:

```js
Object.keys(element)
// ["$$typeof", "type", "key", "ref", "props"]

Reflect.ownKeys(element)
// ["$$typeof", "type", "key", "ref", "props"]
```

All element properties are data properties with:

- enumerable: `true`
- writable: `true`
- configurable: `true`

The production element and props objects are ordinary mutable objects:

- `Object.isFrozen(element) === false`
- `Object.isSealed(element) === false`
- `Object.isExtensible(element) === true`
- same for `element.props`

Production elements have no `_owner`, `_store`, `_debugInfo`, `_debugStack`, or
`_debugTask` own properties.

### Development element shape

Under `NODE_ENV=development`, default and `react-server` conditions produced
this element key order:

```js
Object.keys(element)
// ["$$typeof", "type", "key", "props", "_owner", "_store"]

Reflect.ownKeys(element)
// [
//   "$$typeof", "type", "key", "props", "_owner", "ref",
//   "_store", "_debugInfo", "_debugStack", "_debugTask"
// ]
```

Observed descriptor behavior after React freezes the element:

| Property | Enumerable | Writable | Configurable | Value/getter |
| --- | --- | --- | --- | --- |
| `$$typeof` | true | false | false | `Symbol.for("react.transitional.element")` |
| `type` | true | false | false | element type |
| `key` | true | false | false | `null` or coerced string |
| `props` | true | false | false | frozen props object |
| `_owner` | true | false | false | `null` in direct probes |
| `ref` | false | false for data prop | false | getter for non-null refs, otherwise `null` |
| `_store` | true | false | false | mutable store object |
| `_debugInfo` | false | false | false | `null` |
| `_debugStack` | false | false | false | `Error("react-stack-top-frame")` in Node probes |
| `_debugTask` | false | false | false | task object in Node v26, or source fallback can be `null` |

Development element and props objects are frozen, sealed, and non-extensible.
`_store` is not frozen. `_store.validated` is a non-enumerable, writable,
non-configurable data property with initial value `0`.

### Key behavior

`key` is never an enumerable prop. It becomes `element.key` after string
coercion unless it is `undefined`.

Observed cases:

| Input | `element.key` | `props.key` |
| --- | --- | --- |
| omitted | `null` | absent |
| `key: undefined` | `null` | absent |
| `key: null` | `"null"` | absent in production; dev non-enumerable warning getter |
| `key: ""` | `""` | absent; no dev warning getter |
| `key: "k"` | `"k"` | absent in production; dev non-enumerable warning getter |
| `key: function keyFn(){}` | `"function keyFn(){}"` | absent in production; dev warning getter when resulting string is truthy |
| object with `toString()` | returned string | absent in production; dev warning getter when resulting string is truthy |
| `Symbol("sym")` | throws | dev logs unsupported key type before throw; production only throws |
| object whose `toString` throws | throws that error | dev logs unsupported key type before throw; production only throws |

The dev `props.key` warning getter:

- is non-enumerable and non-configurable after props are frozen
- has getter name `warnAboutAccessingKey`
- has `getter.isReactWarning === true`
- returns `undefined`
- logs through `console.error`, not `console.warn`
- is only defined when the final coerced key string is truthy

### Ref behavior

React 19 treats `ref` as a normal prop and keeps it on `props`.

Observed create/JSX behavior:

| Input | `props.ref` | production `element.ref` | development `element.ref` descriptor |
| --- | --- | --- | --- |
| omitted | absent | `null` | non-enumerable data prop `null` |
| `ref: undefined` | present with `undefined` | `null` | non-enumerable data prop `null` |
| `ref: null` | present with `null` | `null` | non-enumerable data prop `null` |
| string/function/other non-null value | same value | same value | non-enumerable deprecation getter |

The dev `element.ref` getter:

- is named `elementRefGetterWithDeprecationWarning`
- is non-enumerable and non-configurable
- returns `this.props.ref` if it is not `undefined`, otherwise `null`
- logs through `console.error`
- warns that accessing `element.ref` was removed in React 19
- is keyed by component/type name inside the module's warning cache

`props.ref` access does not warn.

### `createElement`

`createElement` always creates a new props object. It does not reuse the config
object.

It skips these config props:

- `key`
- `__self`
- `__source`

It preserves `ref` in props, including `ref: undefined`.

Children behavior:

- no child argument: no `props.children`
- one child: `props.children` is that value
- multiple children: `props.children` is a new array
- development freezes that new multiple-children array
- production does not freeze it

`createElement` applies `type.defaultProps`. If a prop is `undefined`, the
default replaces it. This was observed with:

```js
function T() {}
T.defaultProps = { a: "default-a", b: "default-b" };
React.createElement(T, { a: undefined, b: "override" }).props;
// { a: "default-a", b: "override" }
```

Development `createElement` logs an old JSX transform warning through
`console.warn` when config contains `__self`, has no `key`, and the module-level
warning has not already fired. Both `createElement` and `cloneElement` omit
`__self` and `__source` from props.

### `cloneElement`

`cloneElement(null, {})` throws:

```text
The argument must be a React element, but you passed null.
```

Observed `key` and `ref` behavior:

| Clone config | Result key | Result ref |
| --- | --- | --- |
| `null` | preserves old key | preserves old ref |
| `{}` | preserves old key | preserves old ref |
| `{ key: undefined, ref: undefined }` | preserves old key | preserves old ref |
| `{ key: null, ref: null }` | `"null"` | `null` |
| `{ key: "newKey", ref: "newRef" }` | `"newKey"` | `"newRef"` |

`cloneElement` copies only enumerable props from `element.props` with `assign`.
As a result, a dev-only non-enumerable `props.key` warning getter on the
original element is not copied. The clone also does not add a new `props.key`
warning getter even when the cloned element has a key.

When a valid new ref is supplied, React updates the owner with `getOwner()`.
Direct probes outside a renderer observed `null`, but the owner update behavior
is real source behavior and must not be approximated away once owner stacks
exist.

Development clones have the same frozen element shape as development
`createElement`; production clones have the same mutable shape as production
`createElement`.

### `jsx` and `jsxs`

`react/jsx-runtime` production exports:

```js
["Fragment", "jsx", "jsxs"]
```

Development exports the same keys under the default condition.

Under `--conditions=react-server`, both `react/jsx-runtime` and
`react/jsx-dev-runtime` export:

```js
["Fragment", "jsx", "jsxDEV", "jsxs"]
```

In production `react-server`, `jsxDEV` is present but `undefined`.

`jsx`/`jsxs` differ from `createElement` in important ways:

- they do not apply `defaultProps`
- if `config` has no own `key`, `props === config`
- if `config` has an own `key`, React copies props except `key`
- `maybeKey` becomes the key when it is not `undefined`
- `config.key` overrides `maybeKey` when `config.key` is not `undefined`
- development warns through `console.error` when a props object with an own
  `key` is passed to JSX runtime, even though `key` is still honored

Because `props === config` when there is no own `key`, development
`jsx`/`jsxs` can freeze the caller's config object. `createElement` does not.

Child-array freezing differs by constructor:

| Constructor | Development array freeze | Production array freeze |
| --- | --- | --- |
| `createElement(type, null, "a", "b")` | new children array frozen | not frozen |
| `jsx(type, { children: array })` | original child array not frozen | not frozen |
| `jsxs(type, { children: array })` | original child array frozen | not frozen |

### `jsxDEV`

Default `react/jsx-dev-runtime` development exports:

```js
["Fragment", "jsxDEV"]
```

`jsxDEV` creates the same development element shape as `jsx`/`jsxs`. In the
observed direct call, the `source` and `self` arguments did not appear as
`_source` or `_self` fields on the element.

Default `react/jsx-dev-runtime` production exports:

```js
["Fragment", "jsxDEV"]
```

but `typeof jsxDEV === "undefined"`.

Under `--conditions=react-server`, `react/jsx-dev-runtime` exports `jsx`,
`jsxDEV`, and `jsxs` in addition to `Fragment`; in production the `jsxDEV`
binding is still `undefined`.

## Mapping to Fast React implementation layers

### Rust core records

Rust core should keep normalized renderer-agnostic facts only:

- transitional element brand as a known React symbol tag
- normalized key string, after JS coercion has already happened
- explicit ref slot with `Unset`, `Null`, and `Value`
- explicit owner slot
- element type and props handles/values without JS descriptors

Current core already points in the right direction:

- `ReactKey` stores an already-normalized string.
- `ReactRefSlot::{Unset, Null, Value}` can model clone-preserve versus clear
  versus set.
- `ReactOwnerSlot` can carry owner metadata later.
- `ReactElementRecord` stores `ReactSymbolTag::TransitionalElement`.

Do not implement JS coercion, warning getters, property descriptors,
`Object.freeze`, or console warning policy in Rust core. Those are not abstract
React element facts; they are JS object semantics.

### JS facade

The JS facade should own the final public element object shape for the first
implementation slice. This includes:

- constructing object literals in exact property order
- defining non-enumerable `ref`, `_debugInfo`, `_debugStack`, `_debugTask`, and
  dev `props.key`
- applying `Object.freeze` in development only
- preserving or copying config object identity exactly for JSX runtimes
- coercing keys with JavaScript `"" + key` semantics
- letting `Symbol` and throwing `toString` failures propagate
- issuing `console.error` and `console.warn` warnings from the right paths
- preserving React's production `jsxDEV === undefined` behavior
- keeping owner fields `null` for direct calls until real shared internals can
  supply owners

The current `packages/react` entrypoints still throw placeholders for
`createElement`, `cloneElement`, `isValidElement`, `jsx`, `jsxs`, and `jsxDEV`.
The smallest safe behavior change is a shared JS element factory consumed by
those entrypoints, not a native call path.

### N-API boundary

N-API should stay out of the first element object conformance slice.

Root cause: the required behavior is JS property descriptor and object identity
behavior. Passing element construction through a native boundary before the
binding preserves arbitrary JS values, getter identities, thrown JS values,
`Object.freeze`, and warning side effects would add risk without improving
conformance.

Later N-API integration can normalize or store backing data, but the final
object returned from public React APIs should still be materialized by the JS
facade or by native code using exact Node-API descriptor operations verified by
the same oracle.

### Future conformance oracle

The current conformance inventory explicitly marks real React behavior
comparison as not generated. Element object behavior needs a dedicated oracle
before package behavior changes.

The oracle should run each scenario against:

- pinned `react@19.2.6`
- Fast React's package entrypoints
- `NODE_ENV=development`
- `NODE_ENV=production`
- default Node condition
- `--conditions=react-server`

For each scenario, compare normalized JSON for:

- constructor label and entrypoint
- thrown error name/message
- `Object.keys`
- `Reflect.ownKeys`
- descriptor flags and getter names
- `getter.isReactWarning`
- `Symbol.keyFor($$typeof)`
- frozen/sealed/extensible state
- props identity where observable
- child array identity/freeze state
- warning method and formatted arguments
- `isValidElement` results

Function source text and stack frames should not be compared directly except
where React exposes a function name or error message as an intentional
observable.

## Recommended implementation sequence

1. Add an element-object oracle in `tests/conformance` that runs the probe
   scenarios above against exact `react@19.2.6` and records normalized expected
   behavior. Keep it isolated from repository `node_modules`.
2. Add Fast React comparison mode to that oracle while existing package
   behavior still fails loudly. The first checked-in status should show expected
   mismatches rather than silently passing placeholders.
3. Implement a shared JS element factory under `packages/react` with explicit
   development and production branches.
4. Implement `isValidElement`, `createElement`, and direct default-entrypoint
   element construction first. Match production object order before adding dev
   warning/freeze behavior.
5. Implement development-only object descriptors, warning getters, `_store`,
   `_debugInfo`, `_debugStack`, `_debugTask`, and freeze behavior.
6. Implement `jsx` and `jsxs`, including config identity reuse, config-key
   copying, key-spread warnings, no `defaultProps`, `jsxs` child-array freezing,
   and condition-specific `react-server` export shape.
7. Implement `jsxDEV`, including default production `undefined` and
   `react-server` conditional exports.
8. Implement `cloneElement`, with exact `key`/`ref` preservation, child
   replacement, prop copying, `__self`/`__source` omission, no dev `props.key`
   getter on clones, and future owner update hooks.
9. Integrate owner capture only when React shared internals and renderer owner
   stack state exist. Until then, direct factory calls may produce `_owner:
   null`, but conformance should mark owner-in-render scenarios unsupported.
10. Only after JS conformance is green, decide whether Rust core should receive
    normalized element records from the JS facade for future reconciler work.

## Risks and root causes

- JS descriptor risk. Root cause: userland can observe exact own keys,
  enumerability, descriptors, getters, frozen state, and object identity.
  Mitigation: implement final objects in JS first and gate with descriptor
  oracle tests.
- Key coercion risk. Root cause: React relies on JavaScript coercion side
  effects, including function source strings, object `toString`, `Symbol`
  `TypeError`, and throwing `toString`. Mitigation: do key normalization in the
  JS facade and do not catch errors unless React does.
- Ref compatibility risk. Root cause: React 19 made `ref` a normal prop while
  keeping `element.ref` as a dev deprecation getter and production data prop.
  Mitigation: keep `props.ref` authoritative and model `element.ref` as facade
  compatibility behavior.
- Clone risk. Root cause: `cloneElement` preserves old `key`/`ref` when config
  values are `undefined`, but `null` overrides; it also does not recreate dev
  `props.key` warning getters. Mitigation: test clone cases separately from
  create cases.
- JSX runtime risk. Root cause: `jsx`/`jsxs` differ from `createElement` on
  defaultProps, props identity, key-spread warnings, and child-array freezing.
  Mitigation: do not share a single unchecked `createElement` implementation
  without runtime-mode options.
- Entrypoint condition risk. Root cause: default and `react-server` JSX runtime
  export keys differ, and production `jsxDEV` is an own export with value
  `undefined` in some branches. Mitigation: test package condition and value
  behavior together.
- Owner risk. Root cause: `_owner` comes from React shared internals and changes
  on clone when a valid new ref is supplied. Mitigation: mark owner stack
  integration as a later explicit task rather than faking a stable owner.
- Performance risk. Root cause: descriptor-heavy and freezing behavior is
  development-only in React. Mitigation: keep production element creation as a
  simple object path and guard against accidentally freezing or defining getters
  in production.
- Security/robustness risk. Root cause: key coercion executes user code through
  `toString`; warnings and error paths must not evaluate values more often than
  React does. Mitigation: preserve React's order of checks and coercions in the
  JS facade and cover throwing coercion cases.
- Maintainability risk. Root cause: hand-coded variants can drift between
  `createElement`, `cloneElement`, `jsx`, `jsxs`, `jsxDEV`, and `react-server`
  branches. Mitigation: use one small shared factory with explicit mode flags
  and a generated oracle snapshot.

## Proposed follow-up implementation tasks

1. Implement `tests/conformance/element-object` probes for the observed
   scenarios and snapshot React 19.2.6 normalized output.
2. Add Fast React comparison for the same element-object scenarios and make
   current placeholders fail as known mismatches.
3. Add a shared JS element factory in `packages/react` for production element
   objects and `isValidElement`.
4. Add development descriptor, warning, `_store`, debug field, and freeze
   behavior in the JS facade.
5. Implement `createElement` and `cloneElement` against the oracle, including
   key/ref/defaultProps/children behavior.
6. Implement `jsx`, `jsxs`, and `jsxDEV` against the oracle, including
   condition-specific `react-server` exports and production `jsxDEV`
   `undefined` behavior.
7. Add owner-stack conformance probes once a renderer/shared-internals worker
   can create elements during render.
8. Decide when JS facade element construction should create or pass normalized
   `ReactElementRecord` values into Rust core for reconciler work.
9. Keep N-API out of public element object creation until native descriptor and
   JS value identity behavior can be proven by the same oracle.

## Completion checklist

- [x] Read required worker and progress files first.
- [x] Avoided reading `ORCHESTRATOR.md`.
- [x] Modified only `worker-progress/worker-020-element-object-conformance-probes.md`.
- [x] Probed real `react@19.2.6` from the npm registry tarball.
- [x] Recorded Node and npm versions.
- [x] Captured exact object keys and own key order.
- [x] Captured own property descriptor flags and getter names.
- [x] Captured symbol branding.
- [x] Captured frozen, sealed, and extensible state.
- [x] Captured `key` and `ref` behavior, including `undefined`, `null`, string,
      function, object, `Symbol`, and clone preservation cases.
- [x] Captured owner/debug/store field behavior for direct calls.
- [x] Captured development and production differences.
- [x] Captured relevant default and `react-server` JSX runtime differences.
- [x] Captured warning behavior for key access, key spread, element ref access,
      old JSX transform, and unsupported key coercion.
- [x] Identified Rust core, JS facade, N-API, and conformance oracle ownership.
- [x] Proposed the smallest safe implementation sequence before package
      behavior changes.
- [x] Used nested subagents to test hypotheses and summarized their results.
- [x] Reviewed quality, maintainability, performance, and security implications.
- [x] Checked repository status before report writing.

## Handoff summary

Summary:

React 19.2.6 element compatibility is primarily a JS facade problem. The Rust
core should keep normalized element facts, but final public element objects must
match JavaScript descriptors, warning getters, object identity, and dev/prod
entrypoint behavior exactly. N-API should not sit on this first public path
until descriptor and JS value identity behavior can be proven.

Changed files:

- `worker-progress/worker-020-element-object-conformance-probes.md`

Commands run:

- Required `sed`/`rg` reads of project and worker files.
- `node --version`
- `npm --version`
- `npm view react@19.2.6 version dist.tarball dist.integrity --json`
- `curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...`
- `tar -xzf ... --strip-components=1`
- `rg` over extracted React CJS files for `ReactElement`, `createElement`,
  `cloneElement`, `jsxProd`, `jsxDEV`, and `Object.freeze`.
- `NODE_ENV=development node <element descriptor probe>`
- `NODE_ENV=production node <element descriptor probe>`
- `NODE_ENV=development node --conditions=react-server <condition probe>`
- `NODE_ENV=production node --conditions=react-server <condition probe>`
- `NODE_ENV=development node <key coercion probe>`
- `NODE_ENV=production node <key coercion probe>`
- `NODE_ENV=development node <defaultProps and freeze probe>`
- `NODE_ENV=production node <defaultProps and freeze probe>`
- `git status --short`

Evidence gathered:

- The real element brand is `react.transitional.element`.
- Production element objects have only `$$typeof`, `type`, `key`, `ref`, and
  `props` as enumerable writable configurable properties.
- Development element objects add `_owner`, non-enumerable `ref`,
  enumerable `_store`, and non-enumerable debug fields, then freeze element and
  props.
- `ref` remains a normal prop; `element.ref` is compatibility behavior.
- `key` is string-coerced and removed from props; dev warning getters are
  non-enumerable and only present for truthy key strings.
- `cloneElement` preserves `undefined` key/ref but `null` overrides.
- JSX runtimes do not apply `defaultProps`, can reuse and freeze config objects
  in development, and have condition-specific export/value behavior.

Recommended next task:

Build the element-object conformance oracle first, then implement a JS-only
element factory in `packages/react` behind that oracle. Keep owner-in-render and
N-API-backed element construction as later explicit tasks.
