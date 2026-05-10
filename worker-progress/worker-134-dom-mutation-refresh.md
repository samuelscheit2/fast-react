# worker-134-dom-mutation-refresh

## Objective

Produce a report-only refresh for the minimal DOM mutation adapter canary that
should follow generic reconciler commit and host component/text completion.

Write scope:

- `worker-progress/worker-134-dom-mutation-refresh.md`

No source code, tests, package files, prompts, master docs, or lockfiles were
modified.

## Goal Tool Evidence

- `create_goal` was called as the first tool action for this worker objective.
- `get_goal` was called immediately after setup and returned status `active`.
- Active goal objective recorded from `get_goal`: "Produce a report-only
  refresh for the minimal DOM mutation adapter canary in
  worker-progress/worker-134-dom-mutation-refresh.md, following generic
  reconciler commit and host component/text completion, without modifying other
  files."
- `ORCHESTRATOR.md` was not read.

## Summary

The first DOM mutation adapter canary should be a private
`packages/react-dom/src/dom-host/**` source slice that implements DOM host
creation, text, property payload, node-map, and mutation helpers behind the
existing renderer boundary. It should be queued only after generic reconciler
work can produce a finished HostComponent/HostText tree, run complete-work host
creation, and commit through shared mutation host calls.

The canary must consume reconciler output as phase-scoped host calls and
opaque handles. It must not implement its own scheduler, HostRoot update
queue, `root.current` switch, public root facade, or mini render loop inside
`react-dom/client`.

## Evidence Gathered

Required context read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-134-dom-mutation-refresh.prompt.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`

Additional local evidence used:

- `worker-progress/worker-061-dom-attribute-property-oracle.md`
- `worker-progress/worker-062-dom-style-dangerous-html-oracle.md`
- `worker-progress/worker-063-dom-namespace-svg-oracle.md`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`
- `worker-progress/worker-088-dom-container-root-markers-oracle.md`
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-082-reconciler-commit-ordering-plan.md`
- `worker-progress/worker-106-root-render-e2e-test-plan.md`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/event-names.js`

Current source state:

- `fast-react-host-config` has token-aware `HostCreation`, `HostCommit`,
  `MutationHost`, `MutationRenderer`, `HostFiberTokenRef`, and explicit
  capabilities.
- `fast-react-reconciler` has root records, HostRoot update enqueueing, root
  scheduling scaffolding, and host token storage, but no real complete-work or
  commit traversal yet.
- `packages/react-dom/client.js` still exports unsupported `createRoot` and
  `hydrateRoot`.
- `packages/react-dom/index.js` still exports unsupported `createPortal`,
  `flushSync`, resource APIs, and form APIs.
- Current React DOM internals under `packages/react-dom/src/**` cover only
  container validation/root markers and root-listener shell helpers. There is
  no checked `packages/react-dom/src/dom-host/**` tree yet.

Oracle evidence:

- Worker 061 covers bounded attribute/property behavior, aliases, boolean and
  booleanish props, data/aria props, custom attributes/elements, warning
  observations, updates, removals, and fake-DOM mutation calls.
- Worker 062 covers style serialization/update/removal, CSS custom properties,
  invalid style diagnostics, style shape errors, and
  `dangerouslySetInnerHTML` validation/update/removal.
- Worker 063 covers SVG/MathML namespace creation, SVG attribute aliases,
  `xlink`/`xml` attributes, SVG container child context, and `foreignObject`
  HTML boundaries.
- Worker 064 covers controlled input/select/textarea behavior. That evidence
  is an exclusion guard for this slice, not permission to claim forms support.
- Workers 088 and 089 cover root markers and listener installation, but those
  should be consumed by root/event workers rather than the DOM mutation
  adapter canary.

## Required Sequencing

This DOM adapter canary should follow these generic slices:

1. Host component/text complete work creates detached host instances and host
   text nodes, calls `should_set_text_content`, appends initial children, and
   stores a DOM-owned `UpdatePayload` for updates.
2. Generic commit traversal consumes `flags`, `subtreeFlags`, and deletion
   arrays, calls `prepare_for_commit`, mutation host operations,
   `reset_after_commit`, switches `root.current`, then runs later layout work.
3. The test renderer or another fake mutation host proves generic ordering
   before the DOM adapter adds platform-specific DOM rules.

Starting DOM mutation before those pieces would force `react-dom` to invent a
parallel root render path. That would duplicate the scheduler, bypass HostRoot
updates, and make later conformance failures harder to isolate.

## First DOM Adapter Source Slice

Future implementation write scope should stay private and DOM-owned:

- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/dom-host/namespaces.js`
- `packages/react-dom/src/dom-host/text-content.js`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/set-initial-properties.js`
- `packages/react-dom/src/dom-host/diff-properties.js`
- `packages/react-dom/src/dom-host/properties.js`
- `packages/react-dom/src/dom-host/style.js`
- `packages/react-dom/src/dom-host/dangerous-html.js`
- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/public-instance.js`
- `packages/react-dom/src/dom-host/index.js`
- `packages/react-dom/src/client/dom-component-tree.js`
- `packages/react-dom/src/client/node-maps.js`

The source slice should not edit public entrypoints by default:

- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`

If tests need direct access, import private modules by path from conformance
tests rather than exporting them through `package.json`.

Minimum source responsibilities:

- Derive `ownerDocument` from an already validated container; never fall back
  to the global `document`.
- Carry `DomHostContext` with owner document, current HTML/SVG/MathML
  namespace, namespace transition state, and root/container identity.
- Implement `shouldSetTextContent` for oracle-backed primitive text children
  and valid `dangerouslySetInnerHTML` only; keep textarea and noscript as
  unclaimed.
- Create elements with `ownerDocument.createElement` or
  `ownerDocument.createElementNS`; create text with
  `ownerDocument.createTextNode`.
- Register node-to-token and token-to-node maps after successful creation.
- Publish latest props only after successful initial property application or
  successful `commit_update`.
- Compute DOM-owned update payloads during host completion; commit should
  apply payloads, not re-diff props.
- Implement append, insert, remove, clear, text update, text reset, hide,
  unhide, and deletion cleanup as thin structured DOM operations.
- Return DOM elements from `getPublicInstance` for host components; keep text
  public-instance behavior unclaimed until an oracle locks it.

## Commit Output Consumption

The DOM adapter should consume generic reconciler output through host-config
shape, not through a custom operation queue.

Input from generic complete work:

- `root_host_context(container)` and `child_host_context(parent, type, props)`
  provide DOM context.
- `should_set_text_content(type, props, context)` decides whether child
  reconciliation is skipped for text-content leaves.
- `create_instance(token, type, props, container, context)` receives a
  creation-phase instance token.
- `create_text_instance(token, text, container, context)` receives a
  creation-phase text token.
- `append_initial_child(parent, child)` builds detached subtrees only.
- `finalize_initial_children(instance, type, props, container, context)`
  applies initial properties and returns whether `commit_mount` is needed.
- `diffProperties(type, oldProps, newProps, context)` remains DOM-owned and
  produces `DomUpdatePayload`; if the generic host boundary grows a
  renderer-neutral `prepare_update` hook, that hook should delegate to this DOM
  helper.

Input from generic commit:

- `prepare_for_commit(container)` and `reset_after_commit(container, state)`
  bracket all mounted DOM mutations.
- Placement calls arrive as `append_child`, `append_child_to_container`,
  `insert_before`, or `insert_in_container_before`.
- Deletion calls arrive as `remove_child`, `remove_child_from_container`, and
  deletion-phase cleanup hooks.
- Updates arrive as `commit_update(token, instance, payload, type, oldProps,
  newProps)`.
- Text updates arrive as `commit_text_update(textInstance, oldText, newText)`.
- Text reset and visibility arrive as `reset_text_content`, hide, and unhide
  host calls.

The DOM adapter must not select lanes, flush sync work, schedule microtasks,
switch `root.current`, process HostRoot update queues, or call public
`root.render`. It should be impossible for the adapter canary to pass by
mutating the container directly from `createRoot`.

## What The Canary Must Not Claim

The first DOM mutation adapter canary must not claim:

- public `createRoot`, `root.render`, `root.unmount`, `hydrateRoot`, or
  `flushSync` compatibility;
- event dispatch, plugin extraction, batching, event priority, or listener
  installation beyond existing listener-shell evidence;
- controlled `input`, `select`, `textarea`, or form reset behavior;
- hydration, Fizz markers, Suspense/Activity hydration, mismatch repair, or
  event replay;
- resources, singletons, hoistables, `html`/`head`/`body` acquisition, or
  view transitions;
- portals as a public API, even if container mutation helpers exist;
- browser layout, CSS cascade, parser fidelity, focus, selection,
  accessibility tree behavior, custom-element upgrade lifecycle, or native
  form validation;
- full React DOM property coverage outside checked oracle scenarios;
- text public-instance behavior for host text nodes.

Capability policy:

- Claim `Mutation` only for the private adapter canary.
- Do not advertise `Hydration`, `Forms`, `Resources`, `Singletons`,
  `ViewTransitions`, or `Diagnostics`.
- Add `Portals` and `Microtasks` only when root, scheduler, and portal mount
  paths are wired through the shared reconciler.

## Exact Tests For The Future Slice

Prerequisite generic tests before the DOM adapter canary:

- `cargo test -p fast-react-reconciler --all-features complete_work`
- `cargo test -p fast-react-reconciler --all-features commit`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`

Existing oracle tests that must stay green:

- `node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --test tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`

The controlled-input oracle should be run as an exclusion guard. Passing it
must not turn on `Forms`.

New DOM adapter canary files:

- `tests/conformance/src/dom-mutation-adapter-canary-fake-dom.mjs`
- `tests/conformance/src/dom-mutation-adapter-canary-scenarios.mjs`
- `tests/conformance/src/dom-mutation-adapter-canary-commit-trace.mjs`
- `tests/conformance/test/dom-mutation-adapter-canary.test.mjs`

Canary command:

- `node --test tests/conformance/test/dom-mutation-adapter-canary.test.mjs`

Canary scenarios:

- owner document from Document, Element, and DocumentFragment containers;
- no global `document` use;
- HTML `createElement`, SVG/MathML `createElementNS`, SVG container child
  context, `foreignObject` HTML boundary, and nested SVG return;
- `createTextNode` through the owner document;
- primitive text-content shortcut, text-to-text update, text-to-child reset,
  child-to-text replacement, and text node update;
- initial and update `className`, `htmlFor`, `tabIndex`, boolean/booleanish,
  data/aria, custom attributes, and custom element routing from worker 061;
- style set/update/remove, custom CSS properties, unitless numbers, and style
  string rejection from worker 062;
- valid/null/invalid `dangerouslySetInnerHTML` and children-conflict behavior
  from worker 062;
- SVG/MathML aliases and `setAttributeNS` / `removeAttributeNS` behavior from
  worker 063;
- event-like props are stored as latest-props data only, never installed or
  dispatched;
- append/insert/remove/clear preserve DOM single-parent move semantics;
- failed insertion/removal target checks preserve the existing tree;
- `commit_update` publishes latest props only after payload application
  succeeds;
- deletion cleanup removes `nodeToToken`, `nodeToLatestProps`, and reverse
  token-to-node entries;
- stale, wrong-phase, and wrong-target tokens fail closed;
- canary import graph does not import `packages/react-dom/client.js`,
  `root.render`, Scheduler public APIs, or root scheduler helpers.

Package checks for future source work:

- `npm run check:js`
- `git diff --check`
- scoped changed-path check for the future worker's explicit write scope

## Text Cleanup Boundary Gap

Current `HostCommit::detach_deleted_instance` is instance-only, while DOM node
maps may also register text nodes. The DOM adapter canary should either:

- wait for a generic text deletion cleanup hook, or
- prove that every text deletion/unmount path calls a generic cleanup helper
  that invalidates text tokens and clears text-node maps.

It should not rely on incidental `remove_child` cleanup alone, because that
would miss replacement, unmount, failed commit recovery, or future hydration
replacement paths.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The recommended slice is anchored to checked oracle evidence and current
  source shape.
- It makes the sequencing dependency on generic complete/commit explicit.

Maintainability:

- DOM namespace, property, CSS, innerHTML, and node-map rules stay in
  `packages/react-dom/src/**`.
- Generic crates continue to own fibers, lanes, root scheduling, token
  generation, complete work, and commit order.

Performance:

- DOM mutation helpers should be thin wrappers over DOM APIs.
- Update payloads should be compact and ordered so commit does not rewalk full
  props objects.
- Keeping DOM object operations in JS avoids premature per-node native
  crossings until benchmark evidence exists.

Security:

- Managed text must use text nodes, node data, or `textContent`.
- Attributes should use structured `setAttribute`, `setAttributeNS`, and
  property assignment according to oracle-backed routing.
- Styles should mutate the style object, with `style.setProperty` and
  `style.removeProperty` for custom properties.
- `dangerouslySetInnerHTML` must validate shape and children conflicts before
  the single structured `innerHTML` assignment.
- Node maps must clear latest props on deletion/unmount so detached nodes do
  not retain callbacks, form actions, or large user objects.

## Risks Or Blockers

- Generic host component/text complete work and commit traversal do not exist
  yet in this worktree.
- The update-payload preparation boundary is still implicit in host-config;
  DOM diffing must remain DOM-owned when generic complete work starts using it.
- Text-node token cleanup is not soundly covered by the current
  instance-only deletion hook.
- Existing fake-DOM oracles do not prove browser layout, focus, selection,
  parser, CSS cascade, accessibility, custom element lifecycle, or native form
  behavior.
- Public root facade work can accidentally bypass the shared reconciler if DOM
  canary tests are written through `createRoot` too early.

## Recommended Next Tasks

- Finish generic HostComponent/HostText complete work with DOM-owned payload
  hooks but no DOM source dependency in core.
- Finish generic mutation commit ordering with the test renderer canary before
  DOM adapter tests are enabled.
- Add or prove a text deletion cleanup hook before text node maps become
  persistent.
- Implement the private DOM adapter source slice above and test it through a
  synthetic generic commit trace, not public `createRoot`.
- After that, wire public root facade work to HostRoot updates, root
  scheduler, container markers, listener installation, and the already-tested
  DOM adapter.

## Commands Run

Tool actions:

- `create_goal`
- `get_goal`

Shell commands:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' docs/tasks/worker-134-dom-mutation-refresh.prompt.md
sed -n '1,260p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,520p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '1,620p' worker-progress/worker-105-dom-mutation-host-implementation-plan.md
sed -n '1,620p' worker-progress/worker-110-dom-text-content-host-plan.md
sed -n '1,260p' worker-progress/worker-061-dom-attribute-property-oracle.md
sed -n '1,300p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md
sed -n '1,280p' worker-progress/worker-063-dom-namespace-svg-oracle.md
sed -n '1,260p' worker-progress/worker-064-dom-controlled-input-oracle.md
sed -n '1,260p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,260p' worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,300p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,520p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '1,280p' worker-progress/worker-106-root-render-e2e-test-plan.md
rg --files worker-progress | rg 'dom-(attribute|style|namespace|control|controlled|input|select|textarea|form|container|root|node-map|text-content|mutation|listener|event)' | sort
rg --files packages/react-dom crates | sort
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '840,1460p' crates/fast-react-host-config/src/lib.rs
sed -n '1,300p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,280p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,300p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,240p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,260p' packages/react-dom/src/client/dom-container.js
sed -n '1,260p' packages/react-dom/src/client/root-markers.js
sed -n '1,260p' packages/react-dom/src/events/root-listeners.js
sed -n '1,260p' packages/react-dom/src/events/listener-registry.js
sed -n '1,220p' packages/react-dom/src/events/event-names.js
sed -n '1,220p' packages/react-dom/package.json
git status --short --untracked-files=all
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-134-dom-mutation-refresh.md || true
git status --short --untracked-files=all -- worker-progress/worker-134-dom-mutation-refresh.md
git status --short --untracked-files=all -- worker-progress crates packages tests docs MASTER_PLAN.md MASTER_PROGRESS.md WORKER_BRIEF.md Cargo.toml package.json package-lock.json pnpm-lock.yaml yarn.lock Cargo.lock
perl -ne 'print "$ARGV:$.: trailing whitespace\n" if /[ \t]$/' worker-progress/worker-134-dom-mutation-refresh.md
```

## Verification Results

- `git diff --check` produced no whitespace warnings.
- `git diff --check --no-index /dev/null
  worker-progress/worker-134-dom-mutation-refresh.md` produced no whitespace
  warnings for the new untracked report file.
- `git status --short --untracked-files=all --
  worker-progress/worker-134-dom-mutation-refresh.md` returned only
  `?? worker-progress/worker-134-dom-mutation-refresh.md`.
- Scoped changed-path check over `worker-progress`, source, test, docs,
  master docs, package files, and lockfile paths returned only the allowed
  report file.
- Trailing whitespace scan over this report produced no matches.
- Full unscoped status had already shown an untracked generated
  `.worker-logs/worker-134-dom-mutation-refresh.log` file before report
  writing. It was outside the assigned write scope and was left untouched.

## Changed Files

- `worker-progress/worker-134-dom-mutation-refresh.md`
