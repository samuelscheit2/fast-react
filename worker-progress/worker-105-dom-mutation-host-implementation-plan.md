# worker-105-dom-mutation-host-implementation-plan

## Assigned objective

Produce a report-only implementation plan for the first minimal DOM mutation
host slice, including owner-document handling, namespace context,
instance/text creation, initial property application boundaries, update payload
boundaries, mutation operations, node-token mapping prerequisites, and focused
tests.

Write scope:

- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`

No source code, package code, conformance artifact, or crate implementation was
changed.

## Goal tool status

- `create_goal` was available and was called before research, file reads,
  implementation planning, or verification.
- `get_goal` was available immediately after setup and returned status
  `active`.
- Active goal objective recorded from `get_goal`: "Produce a report-only
  implementation plan for the first minimal DOM mutation host slice, including
  owner-document handling, namespace context, instance/text creation, initial
  property application boundaries, update payload boundaries, mutation
  operations, node-token mapping prerequisites, and focused tests. Write only
  worker-progress/worker-105-dom-mutation-host-implementation-plan.md; anchor
  in merged DOM/host reports and oracles, especially workers 040, 051, 055,
  061, 062, 063, 090, and 091; treat workers 088 and 089 as provisional unless
  merged; keep below public createRoot, hydration, resources, controlled
  inputs, and event dispatch; specify future source files, tests, gates,
  delegated checks, commands, changed files, and unresolved risks."

## Summary

The first minimal DOM mutation host implementation should be a private
`packages/react-dom/src/dom-host/**` slice plus focused tests. It should create
DOM element and text nodes from the correct `ownerDocument`, carry DOM namespace
context across HTML/SVG/MathML boundaries, apply oracle-backed initial
properties, produce ordered DOM-owned update payloads, execute basic mutation
operations, and publish/clean node-to-token maps needed by later events, refs,
hydration, and public instance lookup.

It should not make public `createRoot`, `hydrateRoot`, event dispatch,
resources, singletons, controlled inputs, or full React DOM compatibility
claims. Those need reconciler roots, HostRoot update queues, scheduling,
container/root markers, listener installation, hydration state, form value
tracking, and event/plugin semantics from separate tracks.

The immediate root-cause blocker in the current worktree is that worker 051's
token-aware host-config boundary is merged, but downstream Rust implementors
are not migrated: `cargo test --workspace --all-features` fails because
`crates/fast-react-reconciler/src/lib.rs` and
`crates/fast-react-test-renderer/src/lib.rs` still implement the old
token-less trait signatures. A DOM host implementation must treat that as a
prerequisite, not work around tokens with side channels.

## Evidence gathered

Required project context read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-105-dom-mutation-host-implementation-plan.prompt.md`

Required merged reports and oracles used:

- `worker-progress/worker-040-dom-mutation-renderer-plan.md`: DOM mutation is
  more than generic tree surgery; DOM namespace context, properties, node maps,
  public instances, events, hydration, forms, resources, and diagnostics must
  stay DOM-adapter owned.
- `worker-progress/worker-051-dom-host-token-boundary.md`: the accepted host
  boundary now includes `HostFiberToken`, `HostFiberTokenRef`, token phases,
  token targets, and invalid-token diagnostics. This is a justified breaking
  trait change for node maps and deletion cleanup.
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`:
  public roots must enqueue HostRoot updates and commit through host operations;
  the DOM host should not mutate directly from `root.render`.
- `worker-progress/worker-061-dom-attribute-property-oracle.md` and
  `tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json`:
  common attributes, aliases, boolean/booleanish behavior, data/aria props,
  custom attributes, custom elements, updates/removals, warnings, and fake-DOM
  client mutations are checked.
- `worker-progress/worker-062-dom-style-dangerous-html-oracle.md` and
  `tests/conformance/oracles/react-19.2.6-dom-style-dangerous-html-oracle.json`:
  style units, custom CSS properties, style removals, invalid style diagnostics,
  string-style rejection, `dangerouslySetInnerHTML` assignment, removal, and
  shape/conflict errors are checked.
- `worker-progress/worker-063-dom-namespace-svg-oracle.md` and
  `tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json`:
  SVG/MathML namespace creation, SVG attribute aliases, `xlink`/`xml`
  namespaced attributes, SVG container child context, and `foreignObject`
  HTML boundaries are checked.
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`: node maps
  must be keyed by reconciler-issued opaque tokens, publish latest props only
  after successful commit, and clean synchronously on deletion/unmount.
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`: the minimum host
  slice should cover owner document, namespaces, creation, bounded properties,
  update payloads, and mutations while explicitly excluding roots, hydration,
  resources, forms, and events.

Workers 088 and 089:

- `worker-progress/worker-088-dom-container-root-markers-oracle.md` is absent
  in this worktree.
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md` is
  absent in this worktree.
- Their task prompts exist, but this plan does not depend on their unmerged
  evidence. Container root markers and root listener installation are treated
  as provisional separate tracks.

Current source checked:

- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/package.json`
- `tests/conformance/src/dom-attribute-property-*.mjs`
- `tests/conformance/src/dom-style-dangerous-html-*.mjs`
- `tests/conformance/src/dom-namespace-svg-*.mjs`

Current source reality:

- `packages/react-dom` currently has only top-level placeholder entrypoints and
  no `src/` DOM host implementation.
- `react-dom/client` still exports unsupported `createRoot` and `hydrateRoot`;
  this plan keeps the first DOM host slice below that public facade.
- `HostCreation` already has token-aware `create_instance` and
  `create_text_instance`; `HostCommit` has token-aware `commit_mount`,
  `commit_update`, and `detach_deleted_instance`; `MutationHost` has append,
  insert, remove, and clear operations.
- No generic `prepare_update` hook exists. The first DOM update payload should
  be DOM-owned unless a future reconciler worker proves a renderer-neutral hook
  is required.

## Root-cause plan

The minimal DOM mutation host should not patch around missing public roots by
building a mini renderer in `react-dom/client.js`. The root cause is lower:
React DOM host behavior needs a DOM-specific host adapter that owns DOM nodes,
DOM context, property rules, and node metadata while the reconciler owns fiber
identity, commit order, and root scheduling.

The first future implementation worker should therefore do two things in
order:

1. Restore the token-aware Rust host boundary so the workspace can compile.
   `crates/fast-react-reconciler/src/lib.rs` test hosts and
   `crates/fast-react-test-renderer/src/lib.rs` must add `HostFiberToken`
   associated types and pass `HostFiberTokenRef` values through creation,
   update, mount, and deletion calls. This is not DOM behavior, but it is a
   hard prerequisite because the DOM host must not invent its own fiber
   side-channel.
2. Add private DOM host modules under `packages/react-dom/src/dom-host/**` and
   direct tests that exercise those modules against the checked oracle
   scenarios and a deterministic fake DOM. Keep `packages/react-dom/client.js`
   behavior unsupported unless a separate root facade worker has landed the
   root prerequisites.

## Future source files

Prerequisite token-migration files:

- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`

Adjacent reconciler files likely needed by later commit-integration workers,
but not by the first private DOM host helper slice unless that worker is
explicitly assigned commit traversal:

- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/host_effects.rs`

First DOM mutation host implementation files to add:

- `packages/react-dom/src/dom-host/namespaces.js`
- `packages/react-dom/src/dom-host/owner-document.js`
- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/dom-host/component-tree.js`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/properties.js`
- `packages/react-dom/src/dom-host/style.js`
- `packages/react-dom/src/dom-host/dangerous-html.js`
- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/public-instance.js`
- `packages/react-dom/src/dom-host/index.js`

Do not change these public facade files in the minimum DOM host worker except
for private imports needed by tests:

- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`

If direct test imports from `packages/react-dom/src/**` are awkward under the
package's CommonJS layout, add test-only helpers under `tests/conformance/src/`
rather than exporting private DOM host modules through `package.json`.

Do not add DOM-specific rule tables to `fast-react-core`,
`fast-react-host-config`, or `fast-react-reconciler`. If a later worker proves
that pure namespace/property rule tables should be shared outside JS tests, add
a separate DOM-specific helper crate such as `crates/fast-react-dom-host/**`
with a root `Cargo.toml` workspace entry; do not make that part of the first
minimal DOM host slice by default.

## Owner-document handling

Add `getOwnerDocumentFromContainer(container)` in
`packages/react-dom/src/dom-host/owner-document.js`.

Required behavior:

- Document containers use the container itself.
- Element and supported comment containers use `container.ownerDocument`.
- DocumentFragment containers use `container.ownerDocument`.
- Missing or non-callable document creation APIs must fail loudly with a
  structured internal error, not fall back to global `document`.
- All element and text creation must call methods on this owner document.

Why this is in the first slice:

- The fake DOM oracles record `ownerDocument`, `createElement`,
  `createElementNS`, and `createTextNode` operations.
- Global-document creation would fail for iframe/adopted-document roots and
  would hide root-container bugs until public roots are much harder to debug.

## Namespace context

Add namespace constants and transition helpers in
`packages/react-dom/src/dom-host/namespaces.js`, with `DomHostContext` in
`packages/react-dom/src/dom-host/context.js`.

`DomHostContext` should carry:

- `ownerDocument`
- current namespace: HTML, SVG, or MathML
- current ancestor tag data needed for namespace transitions
- container identity for diagnostics and future root-scoped maps

Minimum namespace rules:

- HTML containers start in the HTML namespace.
- SVG containers derive SVG child context even if the first rendered child is
  not `<svg>`.
- Rendering `<svg>` under HTML switches descendants to SVG.
- Rendering `<math>` under HTML switches descendants to MathML.
- SVG `foreignObject` switches its descendants back to HTML.
- A nested `<svg>` below the `foreignObject` HTML boundary switches back to
  SVG.
- The checked MathML oracle keeps the tested MathML descendants in MathML,
  including the current `annotation-xml` scenario; do not invent broader
  MathML HTML-integration behavior without a new oracle.

`create_instance` should use `ownerDocument.createElement(type)` for HTML
instances and `ownerDocument.createElementNS(namespace, type)` for SVG/MathML
instances.

## Instance and text creation

Add `createInstance`, `createTextInstance`, `finalizeInitialChildren`, and
`shouldSetTextContent` in `packages/react-dom/src/dom-host/creation.js`.

Creation requirements:

- Accept a reconciler-issued opaque host token or an internal test token. Do
  not store raw fibers on DOM nodes.
- Create element nodes through the owner document and namespace context.
- Create text nodes through `ownerDocument.createTextNode(text)`.
- Register node-to-token and token-to-node mappings only after node creation
  succeeds.
- Do not attach event listeners, root listeners, resources, singletons,
  controlled-state trackers, or hydration state.
- `getPublicInstance` for element instances returns the DOM element. Text
  public-instance policy remains deferred to node-map/ref tests and should not
  expose raw text nodes as a public API claim.

`shouldSetTextContent` minimum:

- Return true for string/number primitive `children` on normal host elements.
- Return true for valid `dangerouslySetInnerHTML` inputs once the dangerous
  HTML helper accepts the prop.
- Keep textarea, noscript, Suspense, hydration, controlled input, and Fizz
  special cases out of this slice.

## Node-token mapping prerequisites

Add private map helpers in
`packages/react-dom/src/dom-host/component-tree.js`.

Minimum maps:

- `nodeToToken`: weak node-keyed map from element/text node to opaque host
  token.
- `nodeToLatestProps`: weak node-keyed map from element node to last committed
  props.
- `tokenToNode`: root-scoped reverse map from opaque host token to DOM node.

Rules:

- Creation registers `nodeToToken` and `tokenToNode`.
- `finalizeInitialChildren` publishes `nodeToLatestProps` only after initial
  property application succeeds.
- `commitUpdate` applies the payload first and replaces latest props only after
  the DOM writes succeed.
- Failed property or mutation operations must not publish new latest props.
- Deletion cleanup must remove token and latest-props entries so detached DOM
  nodes do not retain callbacks or user objects.
- Stale, wrong-target, wrong-phase, and wrong-renderer tokens must fail closed.

Boundary gap to consider:

- Current `HostCommit::detach_deleted_instance` handles instance cleanup but
  not text-instance cleanup. If text nodes are tokenized in this slice, future
  host-config/reconciler work must either add a text detach hook or a generic
  token-targeted cleanup hook. That breaking change is justified if direct DOM
  mutation cleanup cannot otherwise guarantee text token invalidation.

## Initial property application boundaries

Add `setInitialProperties` in
`packages/react-dom/src/dom-host/properties.js`, using helper modules for style
and dangerous HTML.

Minimum supported behavior should be limited to checked oracle coverage:

- common host attributes
- React aliases such as `className` and `htmlFor`
- `tabIndex`
- boolean and booleanish attributes
- data and aria attributes
- lowercase custom attributes
- custom element property/attribute routing covered by worker 061
- SVG/MathML aliases and `xlink`/`xml` namespaced attributes covered by worker
  063
- style object application covered by worker 062
- `dangerouslySetInnerHTML` shape validation, children conflict validation,
  `null` `__html`, and `innerHTML` assignment covered by worker 062
- primitive text children when `shouldSetTextContent` selected the fast path

Explicit exclusions:

- no delegated event listener installation
- no plugin dispatch
- no controlled input/select/textarea value wrappers
- no resource or singleton acquisition
- no hydration repair or mismatch diagnostics
- no browser layout/focus/selection behavior

Event-like props may be preserved in `nodeToLatestProps` for future event
extraction, but they must not become DOM attributes and must not dispatch
events in this slice.

## Update payload boundaries

Add DOM-owned payload helpers in:

- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/properties.js`
- `packages/react-dom/src/dom-host/style.js`
- `packages/react-dom/src/dom-host/dangerous-html.js`

Proposed API:

- `diffProperties(type, oldProps, newProps, context) -> DomUpdatePayload`
- `applyUpdatePayload(node, type, payload, oldProps, newProps, context)`

Payload entries should be explicit and ordered:

- `setAttribute(name, value)`
- `removeAttribute(name)`
- `setAttributeNS(namespaceURI, qualifiedName, value)`
- `removeAttributeNS(namespaceURI, localName)`
- `setProperty(name, value)`
- `removeProperty(name)`
- `setTextContent(value)`
- `clearTextContent()`
- `setStyle(name, value)`
- `setStyleProperty(name, value)` for CSS custom properties
- `removeStyle(name)`
- `setInnerHTML(value)`
- `publishLatestProps(newProps)` as a final successful-commit action

Do not add a generic Rust prop diff. DOM attributes, custom elements, CSSOM,
innerHTML, and event-like prop handling are DOM semantics. A generic diff would
move the root cause into the reconciler.

## Mutation operations

Add tree operations in `packages/react-dom/src/dom-host/mutation.js`.

Minimum operations:

- `appendInitialChild(parent, child)`
- `appendChild(parent, child)`
- `appendChildToContainer(container, child)`
- `insertBefore(parent, child, beforeChild)`
- `insertInContainerBefore(container, child, beforeChild)`
- `removeChild(parent, child)`
- `removeChildFromContainer(container, child)`
- `clearContainer(container)`
- `commitTextUpdate(textInstance, oldText, newText)`
- `resetTextContent(instance)`
- `hideInstance(instance)`
- `unhideInstance(instance, props)`
- `hideTextInstance(textInstance)`
- `unhideTextInstance(textInstance, text)`
- `detachDeletedInstance(token, instance)`

Rules:

- Use DOM `appendChild`, `insertBefore`, `removeChild`, `textContent`,
  text-node data/nodeValue, `style`, `setAttribute`, and `setAttributeNS`.
- Preserve single-parent move semantics; appending or inserting an existing
  child moves it rather than cloning it.
- Validate that insertion and removal targets are current children of the
  supplied parent/container.
- Failed insert/remove paths must preserve the existing tree.
- `clearContainer` should clear only root-owned children and must not claim
  behavior for hydration markers, hoistable resources, singleton `html/head/body`
  nodes, or document-level cleanup.
- Hide/unhide can start with a narrow display/text backup model, but must not
  claim Offscreen, Activity, view-transition, or layout compatibility.

## Focused tests to add

Rust prerequisite tests:

- Update token-aware compile/unit tests in
  `crates/fast-react-reconciler/src/lib.rs`.
- Update direct mutation-host tests in
  `crates/fast-react-test-renderer/src/lib.rs`.
- Add checks that creation, update, mount, and deletion receive the expected
  `HostFiberTokenPhase` and `HostFiberTokenTarget`.

New DOM minimum conformance files:

- `tests/conformance/src/dom-mutation-minimum-targets.mjs`
- `tests/conformance/src/dom-mutation-minimum-scenarios.mjs`
- `tests/conformance/src/dom-mutation-minimum-fake-dom.mjs`
- `tests/conformance/src/dom-mutation-minimum-probe-runner.mjs`
- `tests/conformance/src/dom-mutation-minimum-oracle-generator.mjs`
- `tests/conformance/src/dom-mutation-minimum-oracle.mjs`
- `tests/conformance/scripts/generate-dom-mutation-minimum-oracle.mjs`
- `tests/conformance/scripts/print-dom-mutation-minimum-oracle.mjs`
- `tests/conformance/test/dom-mutation-minimum-oracle.test.mjs`
- `tests/conformance/test/dom-mutation-minimum-fast-react.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-mutation-minimum-oracle.json`

Test scenarios:

- owner document from Document, Element, DocumentFragment, and supported
  comment-like containers without using global `document`
- HTML element creation with `createElement`
- SVG and MathML element creation with `createElementNS`
- SVG container child context
- `foreignObject` HTML boundary and nested SVG return
- text node creation with `createTextNode`
- initial `className`, `htmlFor`, boolean, booleanish, data, aria, custom, and
  custom-element props
- initial style object, custom CSS property, unitless/numeric behavior, and
  style string rejection
- initial and update `dangerouslySetInnerHTML`, including shape errors and
  children conflicts
- ordered update payloads for set/remove attribute, style remove, innerHTML
  replacement/removal, text content changes, and latest props publication
- append, insert, remove, clear, failed insert/remove preservation, and
  single-parent moves
- text update and reset text content
- hide/unhide element and text behavior in the narrow minimum model
- node-token map registration, latest props replacement, reverse lookup,
  deletion cleanup, stale token rejection, and no retention of deleted props in
  exposed maps

## Completion gates for a future implementation worker

Required gates:

- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
- `node --test tests/conformance/test/dom-mutation-minimum-oracle.test.mjs`
- `node --test tests/conformance/test/dom-mutation-minimum-fast-react.test.mjs`
- `npm run check:js`
- byte-compare regeneration for the new `dom-mutation-minimum` oracle
- local/temp path leak check over new oracle artifacts and this implementation
  report
- `git diff --check`

Compatibility gates:

- Keep `compatibilityClaimed`, `fastReactBehaviorCompatible`, and
  `fullDualRunOracleExists` false unless Fast React is actually compared
  against the checked React DOM 19.2.6 oracle for the covered slice.
- Do not advertise `Hydration`, `Forms`, `Resources`, `Singletons`,
  `ViewTransitions`, diagnostics/focus, or event compatibility.
- Do not claim public `createRoot` compatibility from private DOM host tests.
  Public roots need container/root markers, listener setup, HostRoot updates,
  lane-backed scheduling, unmount flushing, and root-object behavior.
- Do not claim browser-native layout, parser, focus, selection, accessibility,
  or custom-element lifecycle compatibility from fake-DOM tests.

## Delegated hypothesis checks

Spawned two read-only nested explorer agents:

- DOM/oracle explorer: completed. It confirmed workers 088 and 089 are absent
  in this worktree, confirmed the first slice should stay below public roots,
  summarized oracle facts for attributes/properties, style/dangerous HTML, and
  namespaces, and reran the three targeted DOM oracle tests successfully
  (30/30).
- Rust boundary explorer: completed after the initial draft. It independently
  confirmed the token-aware trait migration blocker in
  `crates/fast-react-reconciler/src/lib.rs` and
  `crates/fast-react-test-renderer/src/lib.rs`, recommended later reconciler
  files for token registry and commit traversal, and identified the same text
  deletion cleanup gap. It ran `cargo test -p fast-react-host-config --no-run`
  successfully, then confirmed `cargo test -p fast-react-test-renderer
  --no-run` and `cargo test -p fast-react-reconciler --no-run` fail on missing
  token migration. It removed the generated root `Cargo.lock` after its cargo
  checks; the final parent status check shows only this report as untracked.

## Quality, maintainability, performance, and security review

Quality:

- The plan maps every minimum host behavior to concrete future files and tests.
- It records the current compile blocker rather than hiding it behind the DOM
  plan.
- It uses merged oracle evidence for attributes/properties, style/innerHTML,
  and namespaces; workers 088 and 089 remain explicitly unmerged here.

Maintainability:

- DOM node, namespace, CSS, custom element, and innerHTML behavior stays under
  `packages/react-dom/src/dom-host/**`.
- Generic crates only need token-boundary migration and possible future cleanup
  hooks; they should not gain DOM property or namespace tables.
- Public `react-dom` facade behavior remains separate from private host
  helpers.

Performance:

- Creation and mutation helpers should be thin wrappers around DOM APIs.
- Ordered update payloads keep commit work bounded and avoid rewalking complete
  props objects during mutation.
- Keeping DOM object operations in JS avoids premature per-node N-API crossings
  before benchmark evidence exists.

Security:

- Text writes should use text nodes, node data, or `textContent`.
- Attributes should use structured `setAttribute` / `setAttributeNS` /
  property assignment according to oracle-backed routing.
- Style should mutate the style object and use `style.setProperty` /
  `style.removeProperty` for custom properties.
- `dangerouslySetInnerHTML` must be guarded by shape/conflict validation and
  use only explicit `innerHTML` assignment, never ad hoc HTML string assembly.
- Node maps must clear latest props on deletion/unmount so detached nodes do
  not retain callbacks, form actions, or large user objects.

## Risks and blockers

- The workspace currently fails `cargo test --workspace --all-features` because
  token-aware host-config traits are not migrated through the reconciler test
  host and test renderer.
- Text-node token cleanup is not fully covered by the current generic
  `detach_deleted_instance` hook.
- The first private DOM host tests can prove DOM host operations, not public
  React DOM root compatibility.
- Fake DOM evidence does not prove browser layout, focus, selection, parser,
  accessibility, CSS cascade, or custom element lifecycle behavior.
- Future workers 088 and 089 may add root marker/listener evidence that should
  be consumed by public root and event workers, but this report cannot depend
  on those unmerged results.

## Commands run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` to record active goal status/objective.
- Spawned two read-only nested explorer agents.
- `wait_agent` for both nested explorers.
- `close_agent` for both nested explorers after their results were consumed.
- `update_plan` for local progress tracking.

Shell commands:

```sh
pwd && rg --files | sort | sed -n '1,160p'
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' docs/tasks/worker-105-dom-mutation-host-implementation-plan.prompt.md
find worker-progress -maxdepth 1 -type f -name 'worker-*.md' | sort | sed -n '1,220p'
git status --short
rg -n "worker-0(40|51|55|61|62|63|88|89|90|91)|dom mutation|DOM mutation|namespace|ownerDocument|node map|NodeMap|public instance|dangerouslySetInnerHTML|style|attribute|property" worker-progress tests crates packages docs/tasks -g '*.md' -g '*.rs' -g '*.js' -g '*.mjs' -g '*.json'
sed -n '1,240p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,260p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '1,260p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '261,520p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,220p' worker-progress/worker-061-dom-attribute-property-oracle.md
sed -n '1,220p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md && sed -n '1,220p' worker-progress/worker-063-dom-namespace-svg-oracle.md
rg -n "pub trait HostTypes|type HostFiberToken|pub struct HostFiberTokenRef|pub trait HostIdentityAndContext|pub trait HostCreation|pub trait HostCommit|pub trait MutationHost|pub trait MutationRenderer|pub enum InitialChildrenFinalization|create_instance\\(|create_text_instance\\(|append_initial_child\\(|finalize_initial_children|prepare_update|commit_update|commit_text_update|reset_text_content|hide_instance|unhide_instance|clear_container|detach_deleted_instance|root_host_context|child_host_context|should_set_text_content" crates/fast-react-host-config/src/lib.rs
sed -n '560,980p' crates/fast-react-host-config/src/lib.rs
sed -n '980,1420p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs && sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs
rg -n "HostFiberToken|HostFiberTokenRef|create_instance\\(|create_text_instance\\(|commit_update\\(|detach_deleted_instance\\(|prepare_for_commit|MutationRenderer|impl HostTypes|type HostFiberToken|UpdatePayload|clear_container|hide_instance|unhide_instance" crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs crates/fast-react-host-config/src/lib.rs packages/react-dom -g '*.rs' -g '*.js'
rg --files packages/react-dom tests/conformance/src tests/conformance/test tests/conformance/scripts tests/conformance/oracles | sort | sed -n '1,260p'
find packages/react-dom -maxdepth 3 -type f -print | sort -V | xargs -I{} sh -c 'printf "--- %s\\n" "$1"; sed -n "1,180p" "$1"' sh {}
find . -maxdepth 2 -type d | sort | sed -n '1,220p'
sed -n '560,870p' crates/fast-react-test-renderer/src/lib.rs
sed -n '180,430p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' Cargo.toml && sed -n '1,220p' package.json
test -f worker-progress/worker-088-dom-container-root-markers-oracle.md && echo present-088 || echo missing-088; test -f worker-progress/worker-089-dom-root-listener-installation-oracle.md && echo present-089 || echo missing-089
cargo test --workspace --all-features
sed -n '1,260p' tests/conformance/src/dom-attribute-property-scenarios.mjs
sed -n '1,280p' tests/conformance/src/dom-style-dangerous-html-scenarios.mjs
sed -n '1,300p' tests/conformance/src/dom-namespace-svg-scenarios.mjs
rg -n "ownerDocument|namespaceURI|createElementNS|createElement\\(|createTextNode|appendChild|insertBefore|removeChild|textContent|innerHTML|style|setProperty|removeProperty|setAttributeNS|removeAttributeNS|setAttribute|removeAttribute|nodeType|DOCUMENT_FRAGMENT_NODE|DocumentFragment|foreignObject|MathML|SVG" tests/conformance/src/dom-attribute-property-probe-runner.mjs tests/conformance/src/dom-style-dangerous-html-probe-runner.mjs tests/conformance/src/dom-namespace-svg-probe-runner.mjs
node tests/conformance/scripts/print-dom-namespace-svg-oracle.mjs | sed -n '1,220p'
sed -n '1,220p' tests/conformance/package.json
node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs tests/conformance/test/dom-namespace-svg-oracle.test.mjs
git status --short --untracked-files=all
rg -n "compatibilityClaimed|fastReactBehaviorCompatible|fullDualRunOracleExists|createElementNS|setAttributeNS|styleSetProperty|styleRemoveProperty|innerHTML|dangerouslySetInnerHTML|className|htmlFor|foreignObject|ownerDocument" tests/conformance/oracles/react-19.2.6-dom-attribute-property-oracle.json tests/conformance/oracles/react-19.2.6-dom-style-dangerous-html-oracle.json tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json | sed -n '1,240p'
git status --short --untracked-files=all
rg -n '/private/v[a]r|/var/f[o]lders|/t[m]p|/Us[e]rs/|file:///Us[e]rs' worker-progress/worker-105-dom-mutation-host-implementation-plan.md || true
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/' worker-progress/worker-105-dom-mutation-host-implementation-plan.md
git diff --check --no-index /dev/null worker-progress/worker-105-dom-mutation-host-implementation-plan.md; rc=$?; if [ "$rc" -eq 0 ] || [ "$rc" -eq 1 ]; then exit 0; else exit "$rc"; fi
rg -n "Goal tool status|worker-040|worker-051|worker-055|worker-061|worker-062|worker-063|worker-090|worker-091|worker-088|worker-089|Owner-document|Namespace context|Instance and text creation|Initial property|Update payload|Mutation operations|Node-token|Focused tests|Completion gates|Delegated hypothesis checks|Quality|Risks|Changed files|Commands run|Completion audit|createRoot|hydrateRoot|Hydration|Resources|controlled|event dispatch" worker-progress/worker-105-dom-mutation-host-implementation-plan.md
```

Notes:

- The `find packages/react-dom ... printf` command printed shell `printf`
  option warnings because the format string began with `---`; the file reads
  still completed. No files were modified by that command.
- `cargo test --workspace --all-features` generated an untracked root
  `Cargo.lock`. It is a regenerable artifact under the worker brief. The Rust
  boundary explorer later removed it during delegated cleanup; no tracked source
  files were modified.
- An initial no-index diff-check wrapper used `status` as a shell variable and
  failed under zsh because that variable name is read-only. The check was
  rerun under bash with `rc` and produced no whitespace warnings.

## Verification results

- Targeted DOM oracle tests passed: 30 tests passed across attribute/property,
  style/dangerous HTML, and namespace/SVG.
- `cargo test --workspace --all-features` failed for the expected current
  source blocker: token-aware host-config trait signatures are not yet migrated
  through `fast-react-reconciler` and `fast-react-test-renderer` implementors.
- Delegated focused Rust checks found `cargo test -p fast-react-host-config
  --no-run` passes, while `cargo test -p fast-react-test-renderer --no-run` and
  `cargo test -p fast-react-reconciler --no-run` fail for the same token
  migration blocker.
- Final `git status --short --untracked-files=all` showed only
  `?? worker-progress/worker-105-dom-mutation-host-implementation-plan.md`.
- Final local/temp/user path leak check over this report produced no matches.
- Final trailing-whitespace check over this report produced no matches.
- Final `git diff --check --no-index /dev/null
  worker-progress/worker-105-dom-mutation-host-implementation-plan.md` produced
  no whitespace warnings.
- Final prompt-to-artifact keyword audit found the required goal, worker
  evidence, DOM host behavior, exclusions, tests, gates, delegated checks,
  commands, risks, changed files, and completion audit sections in this report.
- No source tests were expected to pass for DOM host behavior because this is a
  report-only planning worker and no DOM host implementation exists yet.

## Completion audit

| Requirement | Evidence |
| --- | --- |
| Report-only plan in assigned file | This report is the only intended changed file. |
| Record goal setup and active objective | Goal tool status section records `create_goal`, `get_goal`, status, and objective. |
| Read required worker/master files | Commands run list `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and the worker prompt. |
| Do not read orchestrator-only file | `ORCHESTRATOR.md` was not opened. |
| Anchor in workers 040, 051, 055, 061, 062, 063, 090, 091 | Evidence section names each report/oracle and records how it shapes the plan. |
| Treat workers 088/089 as provisional | File existence check found both reports absent; plan does not depend on them. |
| Cover owner-document handling | Dedicated owner-document section and tests/gates included. |
| Cover namespace context | Dedicated namespace section and tests/gates included. |
| Cover instance/text creation | Dedicated creation section and tests/gates included. |
| Cover initial property boundaries | Initial property section includes supported oracle-backed props and exclusions. |
| Cover update payload boundaries | Update payload section defines DOM-owned diff/apply APIs and ordered payload entries. |
| Cover mutation operations | Mutation section lists append, insert, remove, clear, text, reset, hide/unhide, and detach cleanup. |
| Cover node-token mapping prerequisites | Node-token section defines maps, publication rules, cleanup, and text cleanup gap. |
| Keep below public roots/hydration/resources/forms/events | Summary, exclusions, gates, and future source list keep public facades unsupported. |
| Specify exact future source files | Future source files section lists prerequisite Rust files and DOM host package files. |
| Specify exact tests to add | Focused tests section lists conformance files and scenarios. |
| Specify completion gates | Completion gates section lists commands and compatibility guardrails. |
| Summarize delegated checks | Delegated hypothesis checks section records both nested agents and their completed findings. |
| Review quality/maintainability/performance/security | Dedicated review section included. |
| List commands run | Commands run section included. |
| List changed files and risks | Changed files and risks sections included. |

## Changed files

- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`

## Recommended next tasks

- Migrate the reconciler test host and test renderer to the token-aware
  host-config trait signatures so workspace Rust checks can pass again.
- Add the `dom-mutation-minimum` React DOM oracle and direct Fast React private
  host comparison tests.
- Implement private DOM host modules under `packages/react-dom/src/dom-host/**`
  without changing public `createRoot` behavior.
- Add a text-node deletion cleanup boundary if direct text token registration
  cannot be safely cleaned through existing hooks.
- Consume worker 088 and 089 outputs when they are merged, but only in root
  marker/listener/public-root workers.
