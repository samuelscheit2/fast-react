# worker-091-dom-mutation-minimum-plan

## Assigned objective

Produce a report-only plan for minimal DOM mutation host creation, namespace
context, properties, and mutation operations.

Write scope:

- `worker-progress/worker-091-dom-mutation-minimum-plan.md`

Goal tool status:

- `create_goal` was available and was called before research or file reads.
- `get_goal` was available immediately after setup and returned status
  `active`.
- Active goal objective recorded from `get_goal`: "Produce a report-only plan
  for minimal DOM mutation host creation, namespace context, properties, and
  mutation operations."

No source code, conformance oracle, package, or crate implementation was
changed.

## Summary

The minimal DOM mutation host should be a DOM adapter slice that can create
host elements/text in the correct `ownerDocument`, carry DOM namespace context,
apply initial host properties, produce bounded update payloads, and execute
basic mutation commits. It should not attempt to make `createRoot`,
controlled inputs, hydration, resources, singletons, or event dispatch
compatible in the same slice.

The root cause to avoid is treating DOM mutation as generic tree surgery. Even
the minimum useful DOM host needs DOM-specific context and property rules:
`document.createElement` versus `document.createElementNS`, HTML/SVG/MathML
namespace transitions, text node creation from the owner document, attribute
and property routing from the React DOM oracle, `dangerouslySetInnerHTML`
guardrails, and explicit mutation operations that preserve single-parent move
semantics. Those rules belong in `packages/react-dom` DOM-host helpers or a
future DOM-specific helper crate, not in `fast-react-core` or generic
host-config traits.

## Current local state

- `crates/fast-react-host-config/src/lib.rs` already has a token-aware
  renderer-neutral boundary from worker 051. `HostTypes` includes
  `HostFiberToken`, and creation/commit/hydration hooks receive
  `HostFiberTokenRef`.
- `HostCreation` exposes `root_host_context`, `child_host_context`,
  `should_set_text_content`, `create_instance`, `create_text_instance`,
  `append_initial_child`, and `finalize_initial_children`.
- `HostCommit` exposes `prepare_for_commit`, `reset_after_commit`,
  `commit_mount`, `commit_update`, `commit_text_update`,
  `reset_text_content`, hide/unhide hooks, and `detach_deleted_instance`.
- `MutationHost` exposes append, insert, remove, and `clear_container`
  operations for instance and container parents.
- `crates/fast-react-reconciler/src/lib.rs` still validates the mutation
  renderer boundary and then returns a loud unimplemented error. There is no
  real FiberRoot, render work loop, host effect traversal, or commit
  generation yet.
- `packages/react-dom/client.js` still exports unsupported placeholders for
  `createRoot` and `hydrateRoot`; `packages/react-dom/index.js` still exports
  unsupported `createPortal`, `flushSync`, forms, and resource APIs.
- `worker-progress/worker-062-dom-style-dangerous-html-oracle.md` does not
  exist in this worktree. Style and `dangerouslySetInnerHTML` behavior should
  remain a blocker for compatibility claims, even though this minimum plan
  reserves payload boundaries for them.

## Evidence gathered

- Worker 040 established that DOM mutation must stay DOM-adapter owned:
  namespace context, property/style diffing, custom elements, controlled
  forms, node maps, focus helpers, events, hydration, resources, and
  singletons must not leak into the renderer-agnostic core.
- Worker 051 implemented the first host fiber token boundary so DOM nodes can
  later be associated with reconciler-owned identity without exposing raw
  fibers.
- Worker 055 established that client roots are cross-layer reconciler roots.
  `root.render` must enqueue HostRoot updates and commit through host
  operations; public roots must not mutate DOM directly.
- Worker 061 added React DOM 19.2.6 oracle evidence for common attributes,
  aliases such as `className` and `htmlFor`, booleanish attributes, custom
  attributes, custom elements, warning observations, update/removal behavior,
  and fake-DOM client mutation operations.
- Worker 063 added React DOM 19.2.6 namespace evidence for SVG, MathML,
  namespaced attributes, `foreignObject` HTML boundaries, SVG container child
  context, and observed `createElementNS` / `setAttributeNS` calls.
- Current conformance fake DOMs record `ownerDocument`, `namespaceURI`,
  `createElement`, `createElementNS`, `createTextNode`, `appendChild`,
  `insertBefore`, `removeChild`, `textContent`, `setAttribute`,
  `setAttributeNS`, `removeAttribute`, and `removeAttributeNS` operations,
  which are the right first oracle-backed operations for a minimal host plan.

## Minimum host contract

The first DOM mutation host should advertise only the capabilities it actually
implements:

- Required: `Mutation`.
- Likely required for usable roots later: `Portals` and `Microtasks`, but only
  when the corresponding root/listener/scheduler paths are real.
- Not claimed by this slice: `Hydration`, `Forms`, `Resources`, `Singletons`,
  `ViewTransitions`, event dispatch, or diagnostics.

The minimum host data model should include:

- `DomContainer`: wraps a validated Element, Document, DocumentFragment, or
  supported comment container from the separate container/root-marker track.
- `DomHostContext`: carries `ownerDocument`, current namespace, ancestor
  validation state, and root/container identity. This is DOM-specific and must
  not become a core enum.
- `DomInstance`: wraps an Element-like host node plus enough adapter metadata
  to apply update payloads and clear node maps during deletion.
- `DomTextInstance`: wraps a Text node created from the same owner document.
- `DomProps`: the JS props object or normalized host props view used by the
  DOM adapter. Public React values should remain JS-owned.
- `DomUpdatePayload`: a compact ordered payload produced by the DOM property
  diff layer and consumed only by `commit_update`.

## Creation plan

### ownerDocument

`root_host_context(container)` should derive `ownerDocument` from the validated
container:

- Document containers use the document itself.
- Element and comment containers use `container.ownerDocument`.
- DocumentFragment containers use `container.ownerDocument` when present and
  must be explicitly tested because fragment behavior differs across fake DOMs
  and browsers.

`create_instance` and `create_text_instance` must create nodes from this
document. Creating nodes through the global `document` would break roots in
iframes, adopted documents, and deterministic fake DOM probes.

### Namespace selection

`DomHostContext` should track namespace separately from owner document:

- HTML containers start in the HTML namespace.
- SVG roots and descendants use the SVG namespace.
- MathML roots and descendants use the MathML namespace.
- SVG `foreignObject` descendants switch back to HTML context.
- Nested `svg` below an HTML boundary switches back to SVG.
- SVG containers derive child context from the container namespace even when
  the first rendered child is not `<svg>`.

`create_instance` should call `ownerDocument.createElement(type)` for HTML
nodes and `ownerDocument.createElementNS(namespace, type)` for SVG/MathML
nodes. Namespaced attributes remain property-layer work, not creation work.

### Element and text creation

`create_instance(token, type, props, container, context)` should:

- Validate the host type enough to select the DOM creation path.
- Create the element in the `ownerDocument` and namespace from context.
- Register the host fiber token with the DOM node-map layer when that layer is
  available.
- Avoid setting children, attributes, styles, event listeners, controlled
  state, or resources directly except through the initial-property helper.

`create_text_instance(token, text, container, context)` should:

- Call `ownerDocument.createTextNode(text)`.
- Register the text token with the node-map layer.
- Leave public instance lookup policy to the separate node-map/public-instance
  plan; text nodes should not become a new public API surface.

`should_set_text_content` belongs to the DOM adapter and should initially cover
only oracle-backed text fast paths: string/number children and
`dangerouslySetInnerHTML` guardrails. Textarea, noscript, Suspense, hydration,
and controlled-form special cases should remain excluded until their oracles
and implementation slices land.

## Initial properties

`finalize_initial_children(instance, type, props, container, context)` should
call a DOM-specific `setInitialProperties` helper and return
`InitialChildrenFinalization::CommitMount` only for post-attachment work that
cannot happen on a detached node. The first minimum should treat autofocus,
selection, controlled restoration, resource acquisition, and custom element
lifecycle effects as out of scope unless covered by a dedicated oracle.

The initial-property helper should handle only bounded, testable behavior:

- text content from primitive `children` when the reconciler selected the text
  fast path
- `dangerouslySetInnerHTML` shape validation and initial `innerHTML` write
  once the style/dangerous-html oracle exists
- common attributes and property aliases covered by worker 061
- `data-*` and `aria-*`
- custom attributes and custom element routing covered by worker 061
- SVG/MathML and namespaced attributes covered by worker 063

It should not attach event listeners. Event-like props should be routed into a
future event extraction payload or latest-props map, but dispatch and delegated
listener installation are separate tracks.

## Update payload boundaries

`prepare_update` is not present in the current generic host-config trait, but
the DOM adapter still needs an explicit payload boundary before
`commit_update`. A future worker should add or localize one of these shapes:

- a DOM-owned `diffProperties(oldProps, newProps, type, context)` helper called
  before commit and stored as `DomUpdatePayload`, or
- a renderer-neutral `prepare_update` hook added to `HostCreation` /
  `HostCommit` only if other renderers also need the same boundary.

The payload must be DOM-owned. A generic Rust prop diff would smuggle DOM
semantics into the reconciler and would fail on custom elements, namespaced
attributes, style removals, `dangerouslySetInnerHTML`, and event-like props.

Minimum payload entries should be ordered and explicit:

- `SetAttribute`, `RemoveAttribute`, `SetAttributeNS`, `RemoveAttributeNS`
- `SetProperty` and property removals for oracle-backed DOM properties
- `SetTextContent` and `ClearTextContent`
- `SetInnerHTML` only after the style/dangerous-html oracle lands
- `StyleDiff` only after style diffing is covered
- `UpdateLatestPropsMap` as data for events, without dispatch behavior

The first update payload must deliberately exclude controlled value restore,
selection preservation, hydration mismatch repair, resources, singleton
acquisition, and event dispatch.

## Mutation operations

The reconciler should own effect ordering and invoke host operations. The DOM
host should implement operations as thin DOM node operations with handle and
parent validation:

- `append_initial_child(parent, child)`: append child nodes while the parent is
  detached. This should use the same single-parent move semantics as DOM
  `appendChild`.
- `append_child(parent, child)` and `append_child_to_container(container,
  child)`: append during mutation commit, moving existing children rather than
  cloning.
- `insert_before(parent, child, before_child)` and
  `insert_in_container_before(container, child, before_child)`: call
  `insertBefore` and fail closed if the target is not a current child of the
  parent/container.
- `remove_child(parent, child)` and `remove_child_from_container(container,
  child)`: call `removeChild`, then trigger deletion cleanup through
  `detach_deleted_instance` for instance nodes and the node-map cleanup path
  for text nodes.
- `clear_container(container)`: clear only root-owned children. It should not
  remove unrelated document-level nodes, hoistable resources, singleton nodes,
  or hydration markers in this minimal slice.
- `commit_text_update(text_instance, old_text, new_text)`: update text node
  data/nodeValue through the DOM text API and keep text maps current.
- `reset_text_content(instance)`: clear `textContent` when child reconciliation
  takes over from a text fast path.
- `hide_instance` / `unhide_instance`: preserve and restore display-related
  state according to DOM host rules; the minimum can use a narrow display
  backup model but must not claim Offscreen/Activity compatibility.
- `hide_text_instance` / `unhide_text_instance`: hide by setting text data to
  an empty string and restore from the supplied text, matching the existing
  host-config shape.

Mutation operations should return structured host errors for invalid handles,
missing insertion/removal targets, and impossible self/ancestor mutations.
They should preserve the existing tree on failed insert/remove paths.

## Explicitly separate tracks

The minimal DOM mutation host should reserve integration points, but not
implement or claim these behaviors:

- Controlled inputs/selects/textareas/forms: blocked on value tracking,
  controlled/uncontrolled warnings, post-commit restore, radio groups,
  selection preservation, form reset, and event/change integration.
- Hydration: blocked on hydratable traversal, Fizz markers, mismatch
  diagnostics, Suspense/Activity boundaries, form markers, and replay hooks.
- Resources: blocked on hoistable preload/preinit/preconnect ownership,
  reference counting, document/head insertion order, and server marker
  compatibility.
- Singletons: blocked on `html`, `head`, and `body` acquisition/release and
  scope rules.
- Event dispatch: blocked on root listener installation, plugin extraction,
  event priority, batching, portal bubbling, latest props maps, and hydration
  replay. Initial/update property code may maintain latest props maps, but it
  must not dispatch events.
- Public client roots: blocked on reconciler roots, HostRoot updates, root
  scheduling, root markers, and listener setup from worker 055.

## Future write scopes and tests

The scopes below are intentionally separable. If active workers land first,
future workers should consume them rather than duplicate them.

| Slice | Write scope | Tests/checks |
| --- | --- | --- |
| DOM host context and owner document | `packages/react-dom/src/dom-host/context.js`, `packages/react-dom/src/dom-host/namespaces.js`, `tests/conformance/src/dom-mutation-minimum-*.mjs`, `worker-progress/worker-dom-host-context-owner-document.md` | Fake-DOM and browser-like probes for Document, Element, DocumentFragment, iframe-style owner documents, HTML/SVG/MathML root contexts, `foreignObject`, and SVG container child context. |
| DOM element/text creation | `packages/react-dom/src/dom-host/creation.js`, `packages/react-dom/src/dom-host/context.js`, `packages/react-dom/src/client/dom-component-tree.js`, `tests/conformance/src/dom-mutation-minimum-*.mjs`, `worker-progress/worker-dom-element-text-creation.md` | Tests for `createElement`, `createElementNS`, `createTextNode`, token registration, public instance return for elements, and no global-document use. |
| DOM initial properties | `packages/react-dom/src/dom-host/properties.js`, `packages/react-dom/src/dom-host/set-initial-properties.js`, `tests/conformance/src/dom-attribute-property-*.mjs`, `tests/conformance/src/dom-namespace-svg-*.mjs`, `worker-progress/worker-dom-initial-properties.md` | Use worker 061 and 063 oracle scenarios for aliases, booleanish attributes, data/aria, custom elements, SVG/MathML attributes, and initial text content. Keep style and dangerous HTML tests pending if worker 062 is still unavailable. |
| Style and dangerous HTML payloads | `packages/react-dom/src/dom-host/style.js`, `packages/react-dom/src/dom-host/dangerous-html.js`, `tests/conformance/src/dom-style-dangerous-html-*.mjs`, `worker-progress/worker-dom-style-dangerous-html-implementation.md` | Consume worker 062 when available; tests for style set/remove, custom CSS properties, unitless numbers, invalid values, `dangerouslySetInnerHTML` shape, ordering against children, and no HTML string concatenation outside structured `innerHTML` writes. |
| DOM update payload diff | `packages/react-dom/src/dom-host/diff-properties.js`, `packages/react-dom/src/dom-host/update-payload.js`, `tests/conformance/src/dom-mutation-minimum-*.mjs`, `worker-progress/worker-dom-update-payload-boundary.md` | Tests that old/new props produce compact ordered payloads, event-like props are not attached as attributes, latest-props map updates are data-only, and unsupported controlled/hydration/resource payload entries are rejected. |
| DOM mutation operations | `packages/react-dom/src/dom-host/mutation.js`, `tests/conformance/src/dom-mutation-minimum-*.mjs`, `worker-progress/worker-dom-mutation-operations.md` | Tests for append, insert, remove, clear, single-parent moves, invalid insertion/removal targets, failed mutation tree preservation, text update, reset text content, hide/unhide elements, and hide/unhide text. |
| Reconciler commit integration | `crates/fast-react-reconciler/src/commit.rs`, `crates/fast-react-reconciler/src/host_tokens.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-dom-mutation-commit-integration.md` | Rust fake-host tests for effect ordering, token creation/versioning, `prepare_for_commit` / mutation / `reset_after_commit`, `commit_update` payload delivery, deletion cleanup, and `root.current` switch timing. |
| Minimal DOM host integration oracle | `tests/conformance/src/dom-mutation-minimum-*.mjs`, `tests/conformance/scripts/*dom-mutation-minimum*.mjs`, `tests/conformance/test/dom-mutation-minimum-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-dom-mutation-minimum-oracle.json`, `worker-progress/worker-dom-mutation-minimum-oracle.md` | Deterministic React DOM 19.2.6 comparison for owner document, namespace selection, element/text creation, initial attributes, updates/removals, append/insert/remove/clear, text updates, hide/unhide where observable, and explicit exclusions. |

## Verification plan for implementation workers

Implementation workers should gate compatibility claims on evidence, not smoke
tests alone:

- `node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs`
  and focused Fast React comparisons once DOM rendering exists.
- `node --test tests/conformance/test/dom-namespace-svg-oracle.test.mjs` and
  focused namespace comparisons.
- A future `dom-mutation-minimum` oracle regeneration byte-compare and
  temp/local path leak guard.
- Rust tests for any reconciler or host-config trait changes:
  `cargo fmt --all --check`, focused `cargo test`, and focused `cargo clippy`.
- JS checks for package slices: `npm run check:js` when source changes touch
  package entrypoints or conformance helpers.
- Scoped checks before handoff: `git status --short`,
  concrete local path leak check, trailing whitespace check, and
  `git diff --check` or no-index equivalent.

## Delegated hypothesis checks

Nested read-only explorers were spawned for this report:

- one checked whether the plan covers required minimum DOM mutation semantics
  and avoids boundary leaks;
- one checked future write scopes, source-scope risks, and report-only
  verification expectations.

Their findings are reflected in this report's emphasis on owner-document
creation, namespace context, token/node-map prerequisites, explicit update
payload boundaries, and separate tracks for events, hydration, forms,
resources, and singletons.

## Quality, maintainability, performance, and security review

Quality:

- The plan maps each required minimum behavior to an owner and to existing
  oracle evidence where available.
- It keeps worker 062 absence explicit so style and dangerous HTML do not
  become unbacked compatibility claims.

Maintainability:

- DOM context, properties, and mutation helpers stay under DOM-specific
  package paths. Generic crates only receive changes if a future worker proves
  the current boundary is undersized.
- Future scopes are split so property diffing, mutation operations, and
  reconciler commit traversal can be reviewed independently.

Performance:

- Creation and mutation paths should stay thin wrappers over DOM APIs.
- Property diffing should produce compact payloads so commit does bounded work
  and avoids rewalking whole props objects during mutation.
- Cross-boundary JS/Rust DOM calls should be benchmarked before tiny DOM
  operations move across N-API or WASM boundaries.

Security:

- DOM writes should use structured DOM APIs: text node data, `textContent`,
  `setAttribute`, `setAttributeNS`, property assignment, style object
  mutation, and narrowly validated `innerHTML`.
- `dangerouslySetInnerHTML` must remain guarded by oracle-backed validation and
  must not be implemented through ad hoc string concatenation.
- Node maps and token maps should use weak or expando-style storage and clear
  on deletion/unmount so detached nodes and user props do not stay alive.

## Risks or blockers

- Real DOM mutation rendering is blocked on reconciler roots, host effect
  traversal, HostRoot updates, and root scheduling.
- Worker 062's style and dangerous HTML report is absent in this worktree, so
  style and `dangerouslySetInnerHTML` compatibility must remain provisional.
- Node maps and public instance lookup are likely prerequisites for a safe DOM
  implementation because creation and deletion need token registration and
  cleanup.
- Controlled forms, hydration, resources, singletons, and event dispatch all
  share DOM property or node-map surfaces with this minimum host; keeping their
  payload entries inert until their tracks land is essential.
- Fake-DOM oracle evidence does not prove browser layout, focus, CSS cascade,
  parser, custom element lifecycle, or selection behavior.

## Commands run

```sh
pwd && git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,260p' worker-progress/worker-061-dom-attribute-property-oracle.md
if [ -f worker-progress/worker-062-dom-style-dangerous-html-oracle.md ]; then sed -n '1,260p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md; else printf 'MISSING worker-progress/worker-062-dom-style-dangerous-html-oracle.md\n'; fi
sed -n '1,260p' worker-progress/worker-063-dom-namespace-svg-oracle.md
wc -l MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-055-react-dom-client-roots-implementation-plan.md worker-progress/worker-091-dom-mutation-minimum-plan.md 2>/dev/null || true
sed -n '261,620p' MASTER_PLAN.md
sed -n '261,620p' MASTER_PROGRESS.md
sed -n '261,620p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '261,620p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
if [ -f worker-progress/worker-091-dom-mutation-minimum-plan.md ]; then sed -n '1,260p' worker-progress/worker-091-dom-mutation-minimum-plan.md; else printf 'MISSING worker-progress/worker-091-dom-mutation-minimum-plan.md\n'; fi
rg -n "standard report|report checks|path leak|local/temp|diff --check|worker-progress|Commands run|Evidence gathered|Recommended next" -S . --glob '!node_modules/**' --glob '!target/**'
rg --files --glob '!node_modules/**' --glob '!target/**' | sed -n '1,260p'
sed -n '1,220p' docs/tasks/worker-091-dom-mutation-minimum-plan.prompt.md
sed -n '1,220p' worker-progress/README.md
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '260,620p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
rg -n "dom-attribute-property|dom-namespace-svg|dangerously|style|namespace|createElementNS|createElement|setAttribute|appendChild|insertBefore|removeChild|clear|hide|unhide|textContent|HostFiberToken|create_instance|commit_update|UpdatePayload|MutationHost|HostCreation|HostCommit|HydrationHost|PortalHost|Microtasks" crates packages tests/conformance worker-progress/worker-061-dom-attribute-property-oracle.md worker-progress/worker-063-dom-namespace-svg-oracle.md --glob '!node_modules/**' --glob '!target/**'
rg -n "pub trait HostTypes|type HostFiberToken|pub struct HostFiberTokenRef|pub trait HostIdentityAndContext|pub trait HostCreation|pub trait HostCommit|pub trait MutationHost|pub trait MutationRenderer|pub enum InitialChildrenFinalization|create_instance\(|create_text_instance\(|finalize_initial_children|prepare_update|commit_update|commit_text_update|reset_text_content|hide_instance|unhide_instance|clear_container" crates/fast-react-host-config/src/lib.rs
sed -n '620,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1040,1480p' crates/fast-react-host-config/src/lib.rs
sed -n '1,240p' tests/conformance/src/dom-attribute-property-scenarios.mjs
sed -n '1,260p' tests/conformance/src/dom-namespace-svg-scenarios.mjs
rg -n "ownerDocument|namespaceURI|createElementNS|createElement\(|createTextNode|appendChild|insertBefore|removeChild|textContent|innerHTML|style|dangerouslySetInnerHTML|clear|removeAttribute|setAttributeNS|setAttribute|hide|unhide|display|children|custom" tests/conformance/src/dom-attribute-property-probe-runner.mjs tests/conformance/src/dom-namespace-svg-probe-runner.mjs tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json --glob '!node_modules/**' --glob '!target/**'
git status --short --untracked-files=all
rg -n "/private/v[a]r|/var/f[o]lders|/t[m]p|/Us[e]rs/" worker-progress/worker-091-dom-mutation-minimum-plan.md
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/' worker-progress/worker-091-dom-mutation-minimum-plan.md
git diff --check --no-index /dev/null worker-progress/worker-091-dom-mutation-minimum-plan.md
```

Tool actions:

- `create_goal` for this worker objective.
- Spawned two read-only nested explorer agents for hypothesis checks.
- `wait_agent` for both nested explorers.
- `update_plan` to track progress inside this worker turn.

## Verification results

Final report-only checks:

- `git status --short --untracked-files=all` showed
  `?? worker-progress/worker-091-dom-mutation-minimum-plan.md` plus an
  untracked root `Cargo.lock`. The `Cargo.lock` was already outside this
  worker's report scope and is treated as a regenerable root artifact under
  the worker brief; it was left untouched.
- Concrete local temp/user path leak check over this report produced no
  matches.
- Trailing whitespace check over this report produced no matches.
- `git diff --check --no-index /dev/null
  worker-progress/worker-091-dom-mutation-minimum-plan.md` produced no
  whitespace warnings.

No source tests were run because this is a report-only planning task.

## Completion audit

| Requirement | Evidence |
| --- | --- |
| Report-only plan in assigned file | This file is the only scoped changed worker artifact; source code was not modified. |
| Goal setup recorded | Goal tool status records `create_goal` and `get_goal` availability and active objective near the top of this report. |
| Required context read | Commands run list `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 040, worker 051, worker 055, worker 061, worker 063, and the missing worker 062 check. |
| ownerDocument and namespace context | Creation plan covers `ownerDocument`, namespace selection, `createElement`, and `createElementNS`. |
| Element/text creation | Creation plan covers `create_instance`, `create_text_instance`, and token/node-map registration boundaries. |
| Append/insert/remove/clear and text/hide operations | Mutation operations cover append, insert, remove, clear, text update, reset text content, hide/unhide instance, and hide/unhide text. |
| Initial properties and update payload boundaries | Initial properties and update payload sections define bounded property support and explicit payload entries/exclusions. |
| Separate excluded tracks | Minimum host contract and explicit tracks exclude controlled inputs, hydration, resources, singletons, event dispatch, and public client roots. |
| Future write scopes and tests | Future write scopes table and verification plan list concrete package/crate paths and checks for follow-up workers. |
| Standard report checks | Verification results record git status, path leak check, trailing whitespace check, and no-index diff check outcomes. |

## Changed files

- `worker-progress/worker-091-dom-mutation-minimum-plan.md`

## Recommended next tasks

- Add or merge the style/`dangerouslySetInnerHTML` oracle before claiming full
  initial/update property coverage.
- Land DOM node-map/public-instance cleanup before the DOM host creation
  implementation stores fiber tokens on nodes.
- Add the `dom-mutation-minimum` oracle so future implementation workers can
  compare owner document, namespaces, creation, properties, updates, and
  mutation operations against React DOM 19.2.6.
- Implement minimal DOM host context/creation, initial properties, update
  payload diffing, and mutation operations as separate slices with explicit
  exclusions for forms, hydration, resources, singletons, and event dispatch.

## Completion checklist

- [x] Called `create_goal` for this worker task before research.
- [x] Read required worker context and did not open orchestrator-only
  instructions.
- [x] Noted that worker 062's report is absent in this worktree.
- [x] Modified only the assigned worker report.
- [x] Covered ownerDocument, namespace selection, element/text creation,
  append/insert/remove/clear, text update, hide/unhide, initial properties, and
  update payload boundaries.
- [x] Separated minimal mutation from controlled inputs, hydration, resources,
  singletons, and event dispatch.
- [x] Included future write scopes and tests.
- [x] Ran final report-only verification checks.
