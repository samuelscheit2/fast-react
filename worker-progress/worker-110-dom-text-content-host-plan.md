# worker-110-dom-text-content-host-plan

## Objective

Produce a report-only plan for DOM text-content host behavior, including
`shouldSetTextContent`, text node creation/update/reset, element text-content
shortcuts, namespace interactions, `dangerouslySetInnerHTML` exclusions, and
the tests needed before a minimal DOM host can render text reliably.

Write scope:

- `worker-progress/worker-110-dom-text-content-host-plan.md`

No source code, package code, conformance oracle, generated artifact, or test
implementation was changed.

## Goal Tool Status

- `create_goal` was available and was called before research, file reads, or
  implementation.
- `get_goal` was available after setup and again before writing this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: "Produce a report-only plan
  for DOM text-content host behavior, including shouldSetTextContent, text node
  creation/update/reset, element text-content shortcuts, namespace
  interactions, dangerouslySetInnerHTML exclusions, and the tests needed before
  a minimal DOM host can render text reliably. Write only
  worker-progress/worker-110-dom-text-content-host-plan.md, anchor in merged
  worker reports 040, 051, 055, 061, 062, 063, 091, and 106 when present, and
  label dependencies on 064, 088, 089, and 105 as provisional unless their
  reports/oracles are present."

## Summary

DOM text support is not a small helper on top of generic mutations. The root
cause is that React DOM has two different text paths:

- Host text nodes for normal reconciled text children.
- Element-owned text-content shortcuts for host elements whose children are a
  primitive text value, a supported special element, or a valid
  `dangerouslySetInnerHTML` payload.

Fast React should model both paths explicitly. The DOM adapter should own the
`shouldSetTextContent` predicate and DOM writes because the decisions depend on
DOM props, special tag names, namespace context, `innerHTML` validation, and
browser text APIs. The reconciler should own when child reconciliation is
skipped, when HostText fibers are created, and when text reset/update effects
are emitted. The core must stay DOM-neutral.

Before a minimal DOM host claims it can render text reliably, it needs a
dedicated React DOM 19.2.6 text-content oracle. Existing oracles prove useful
pieces, but no checked artifact currently covers the full text matrix:
empty string, number and bigint children, text-to-null, text-to-element,
element-to-text, adjacent text siblings, namespace text, and transitions
between `dangerouslySetInnerHTML` and managed children.

## Prior Worker Anchors

Merged and present in this worktree:

- Worker 040: DOM mutation must be DOM-adapter owned. It identifies
  `should_set_text_content`, text creation, `dangerouslySetInnerHTML`,
  namespace context, properties, node maps, and deletion cleanup as DOM host
  requirements, not core behavior.
- Worker 051: host fiber tokens are the accepted boundary for associating
  DOM nodes with reconciler-owned identity. Creation and key commit hooks are
  token-aware.
- Worker 055: public `createRoot` and `root.render` must enqueue HostRoot
  updates and commit through host operations. DOM text work must not mutate
  from the public facade directly.
- Worker 061: attribute/property oracle is present. It records real React DOM
  19.2.6 client mutations where primitive text children use element
  `textContent` initially and update through text node `nodeValue`.
- Worker 062: style and `dangerouslySetInnerHTML` oracle is present. Worker
  091's older note that 062 was absent is stale in this worktree.
- Worker 063: namespace/SVG/MathML oracle is present. It proves
  `createElementNS`, `foreignObject` HTML boundaries, SVG container child
  context, MathML context, and namespace-sensitive text-content observations.
- Worker 091: minimal DOM mutation host plan is present. It defines the
  owner-document, namespace, creation, mutation, property, and payload
  boundaries this text plan should fit inside.

Worker 106:

- No `worker-progress/worker-106-*.md` report or oracle is present in this
  worktree. Only its task prompt exists under `docs/tasks/`. This plan does
  not anchor on worker 106 as merged evidence.

Provisional dependencies:

- Workers 064, 088, 089, and 105 have task prompts but no reports or oracles
  in this worktree. Controlled inputs, container/root markers, root listener
  installation, and any first DOM mutation host implementation details from
  those workers are therefore provisional.

## Current Local State

- `crates/fast-react-host-config/src/lib.rs` already exposes
  `HostCreation::should_set_text_content`, `create_text_instance`,
  `append_initial_child`, `finalize_initial_children`, and
  `HostCommit::commit_text_update`, `reset_text_content`,
  `hide_text_instance`, and `unhide_text_instance`.
- `HostTypes` includes opaque `TextInstance`, `HostContext`, `UpdatePayload`,
  and `HostFiberToken` associated types. `HostChild` can carry either an
  instance or text instance.
- `HostCommit::detach_deleted_instance` is instance-only. Text deletion cleanup
  is currently underspecified for a DOM node map that stores text-node tokens.
- `crates/fast-react-reconciler/src/lib.rs` still has no real complete work,
  HostText fiber creation, update diffing, host effect traversal, or commit
  implementation.
- `packages/react-dom/client.js`, `packages/react-dom/index.js`, and
  `packages/react-dom/profiling.js` are still loud placeholders.
- There is no concrete DOM host source tree under `packages/react-dom/src/**`
  yet.
- Existing conformance oracles are React DOM evidence only. Fast React DOM
  behavior is not compared and compatibility remains unclaimed.

## React DOM 19.2.6 Behavior Evidence

A temporary inspection of the pinned `react-dom@19.2.6` client bundle confirms
the high-level behavior shape:

- `shouldSetTextContent` returns true for `textarea`, `noscript`, primitive
  string/number/bigint children, and an object
  `dangerouslySetInnerHTML` payload whose `__html` is not nullish.
- The DOM text setter prefers updating the single existing text child by
  `nodeValue`; otherwise it assigns the element's `textContent`.
- Standalone HostText completion creates text through the root container's
  owner document.
- `resetTextContent` clears element text content by setting it to an empty
  string.
- `commitTextUpdate` updates the text node value directly.
- Valid `dangerouslySetInnerHTML` assigns `innerHTML`; invalid shape and
  children conflicts throw through the root error path.

Checked project oracles support parts of this:

- Worker 061's oracle records element creation, attribute writes, initial
  `setTextContent`, fake-DOM `createTextNode`, append of the created text
  node, and later `setNodeValue` for primitive text updates.
- Worker 062's oracle records valid `innerHTML` assignment, replacement,
  switching from `dangerouslySetInnerHTML` back to managed text, null
  `__html`, invalid shape errors, and children-conflict errors.
- Worker 063's oracle records namespace-sensitive element creation and
  text-content observations under SVG and MathML. Its fake DOM records
  `setTextContent`, but unlike the attribute/style fake DOMs, it does not
  expand that into a created text node, so a dedicated text oracle still needs
  to cover namespace text nodes directly.

## Root-Cause Design

The implementation should not treat all text as HostText children. React DOM
intentionally skips child reconciliation for text-content elements. That is
observable in mutation order, update behavior, `dangerouslySetInnerHTML`
conflicts, and root/portal warning behavior.

The implementation should also not treat `dangerouslySetInnerHTML` as text.
It is a leaf shortcut that excludes managed children and writes `innerHTML`
only after shape validation. Text children and raw HTML must be mutually
exclusive at the DOM property layer.

The reconciler/host split should be:

- DOM adapter owns `shouldSetTextContent(type, props, context)`,
  `setTextContent`, `createTextNode`, `innerHTML` validation/writes, namespace
  context, owner document selection, and node-map registration/cleanup.
- Reconciler owns whether child reconciliation is skipped, whether a HostText
  fiber is created, update effect flags, `commit_text_update`,
  `reset_text_content`, deletion ordering, and token generation.
- Host-config owns only renderer-neutral trait shape. It should change only if
  text deletion cleanup or update payload preparation cannot be expressed with
  the current hooks.

## `shouldSetTextContent` Plan

The DOM adapter should implement a DOM-specific predicate in a future file:

- `packages/react-dom/src/dom-host/text-content.js`

Inputs:

- Host type/tag name.
- Current props.
- `DomHostContext`, only for development validation and future special cases;
  namespace should not change the primitive predicate for normal text.

React 19.2.6-compatible truth table to verify by oracle:

- True for string children, including empty string.
- True for number children, including zero.
- True for bigint children if the target React build accepts them as children.
- True for `dangerouslySetInnerHTML` objects with non-nullish `__html`.
- True for `textarea` and `noscript` according to React DOM source shape, but
  these should not be claimed in the first minimal host slice because
  textarea belongs to controlled form behavior and noscript needs its own
  browser/server evidence.
- False for arrays, elements, fragments, portals, null, undefined, booleans,
  functions, symbols, and `dangerouslySetInnerHTML` with nullish `__html`.

The first minimal implementation should only claim ordinary host elements with
primitive children and valid `dangerouslySetInnerHTML`. It may include the full
predicate internally, but completion gates must mark textarea and noscript as
excluded until separate oracles cover them.

## Text Node Creation, Update, Reset

HostText creation belongs to the reconciler complete-work path and the DOM
adapter creation hook:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/client/dom-component-tree.js`

Required behavior:

- Create HostText fibers only when the parent did not take the element
  text-content shortcut.
- Create text nodes through `ownerDocument.createTextNode(text)`, not the
  global `document`.
- Register text nodes with the host fiber token map just like element nodes.
- Preserve text nesting diagnostics as a later development-mode slice; do not
  block the minimal host on full warning parity.
- Keep text nodes out of public DOM refs unless a later public-instance oracle
  proves a public API needs direct text exposure.

Updates and resets belong to commit:

- `crates/fast-react-reconciler/src/commit.rs`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/text-content.js`

Required behavior:

- HostText update calls `commit_text_update(text_instance, old_text, new_text)`
  and writes the text node's value.
- Element text-content update uses the element text setter. If the element has
  a single text child, that setter should update `nodeValue`; otherwise it
  should assign `textContent`.
- Switching from a text-content shortcut to managed child reconciliation must
  emit `reset_text_content(instance)` before appending the new child set.
- Switching from managed children to a text-content shortcut must remove or
  replace the managed children through the normal commit ordering and then
  set element text content.
- Switching from `dangerouslySetInnerHTML` to managed text should use
  `textContent`, not parse or concatenate HTML.
- Hide/unhide text should use the existing host hooks and restore from the
  reconciler's current text value.

Breaking-change candidate:

- Add a renderer-neutral text deletion cleanup hook to
  `crates/fast-react-host-config/src/lib.rs`, such as
  `detach_deleted_text_instance(token, text_instance)` or a generic
  `detach_deleted_host_child(token, HostChildOwned)`. Without this, a DOM
  adapter can remove a text node from the tree but cannot reliably invalidate a
  reconciler-issued text token during deletion cleanup. Relying on incidental
  `remove_child` map cleanup would patch one removal path while leaving stale
  tokens possible for unmount, hidden subtree disposal, future hydration
  replacement, or failed commit recovery.

## Element Text-Content Shortcuts

Future source files:

- `packages/react-dom/src/dom-host/set-initial-properties.js`
- `packages/react-dom/src/dom-host/diff-properties.js`
- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/text-content.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/commit.rs`

Initial mount:

- If `shouldSetTextContent` is true for primitive children, the reconciler
  should not create HostText child fibers for that element.
- `finalize_initial_children` should call a DOM `setInitialProperties` helper
  that applies attributes/styles and then sets text content in React-compatible
  order.
- Empty string must clear content and should not necessarily create a text
  node. The oracle should record exact fake-DOM operations.

Update:

- Old text shortcut to new text shortcut: update the existing text content
  without remounting children.
- Old text shortcut to element child: reset text content before child append.
- Element child to text shortcut: remove old child nodes and set text content.
- Text shortcut to nullish/boolean child: clear text content.
- Adjacent string/number children in arrays must not be collapsed through
  `shouldSetTextContent` unless React DOM proves such a shortcut. Treat them as
  child reconciliation until a text oracle says otherwise.

The update payload should keep text entries explicit:

- `SetTextContent(value)`
- `ClearTextContent`
- `SetInnerHTML(html)`
- `ClearInnerHTML` only if React DOM evidence requires a distinct operation
- `UpdateLatestPropsMap(newProps)` for future events, without dispatch

## Namespace Interactions

Future source files:

- `packages/react-dom/src/dom-host/namespaces.js`
- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/text-content.js`

Rules:

- Owner document controls text node creation. Namespace does not change the
  `createTextNode` API.
- Parent namespace controls element creation and attributes. SVG and MathML
  elements still use the same text-content shortcut for primitive text
  children.
- SVG `foreignObject` switches descendants back to HTML context; nested `svg`
  below that switches back to SVG.
- SVG containers derive SVG child context even when the rendered child is not
  `<svg>`.
- MathML descendants remain MathML in the checked worker 063 oracle, including
  HTML-looking children under `annotation-xml`; do not infer HTML integration
  behavior without a new oracle.

Tests must prove text under namespace contexts:

- `<svg><text>label</text></svg>` uses SVG element creation plus text content.
- SVG root containers render text descendants in SVG context.
- `foreignObject` renders HTML text descendants using HTML element creation.
- MathML `<mi>x</mi>` uses MathML element creation plus text content.
- Standalone HostText under namespaced parents uses owner-document text nodes
  and appends to the namespaced parent.

## `dangerouslySetInnerHTML` Exclusions

Future source files:

- `packages/react-dom/src/dom-host/dangerous-html.js`
- `packages/react-dom/src/dom-host/set-initial-properties.js`
- `packages/react-dom/src/dom-host/diff-properties.js`
- `packages/react-dom/src/dom-host/text-content.js`
- `packages/react-dom/src/dom-host/mutation.js`

Rules:

- Valid `dangerouslySetInnerHTML` is a leaf shortcut. It must exclude HostText
  creation and managed child reconciliation under that element.
- Non-object values and objects without `__html` must produce the
  React-compatible root error shape. The DOM host should not partially install
  text children after this error.
- `__html: null` and `__html: undefined` produce an empty host element and
  should not be treated as a text-content shortcut.
- Providing both `children` and `dangerouslySetInnerHTML` is an error.
- Removing `dangerouslySetInnerHTML` and adding managed text should set
  `textContent` to the managed text.
- Switching from managed text to `dangerouslySetInnerHTML` should remove or
  clear the managed text path before assigning `innerHTML`.
- No implementation should build raw HTML with string concatenation. The only
  raw HTML write in this slice is the structured `innerHTML` assignment after
  validation.

## Exact Future Source Work

Generic host/reconciler:

- `crates/fast-react-host-config/src/lib.rs`: add a text deletion cleanup hook
  if DOM node maps cannot be made sound with existing mutation hooks.
- `crates/fast-react-reconciler/src/fiber.rs`: add HostText and HostComponent
  state needed by complete/commit.
- `crates/fast-react-reconciler/src/complete_work.rs`: call
  `should_set_text_content`, create DOM instances/text instances, skip text
  children for shortcut elements, append initial children, and mark text reset
  work.
- `crates/fast-react-reconciler/src/commit.rs`: call `commit_text_update`,
  `reset_text_content`, hide/unhide text, and deletion cleanup in React order.
- `crates/fast-react-reconciler/src/host_tokens.rs`: generate/version
  instance and text tokens and invalidate them after deletion.
- `crates/fast-react-reconciler/src/lib.rs`: expose the new modules without
  leaking DOM types.

DOM adapter:

- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/dom-host/namespaces.js`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/text-content.js`
- `packages/react-dom/src/dom-host/dangerous-html.js`
- `packages/react-dom/src/dom-host/set-initial-properties.js`
- `packages/react-dom/src/dom-host/diff-properties.js`
- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/dom-component-tree.js`
- `packages/react-dom/src/client/node-maps.js`

Package/root files should remain mostly out of this slice:

- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`

Those entrypoints should not claim public root rendering until root facade,
container validation, listener installation, scheduling, and commit integration
are ready.

## Required Tests And Oracle Gaps

Add a dedicated oracle:

- `tests/conformance/src/dom-text-content-targets.mjs`
- `tests/conformance/src/dom-text-content-scenarios.mjs`
- `tests/conformance/src/dom-text-content-probe-runner.mjs`
- `tests/conformance/src/dom-text-content-oracle-generator.mjs`
- `tests/conformance/src/dom-text-content-oracle.mjs`
- `tests/conformance/scripts/generate-dom-text-content-oracle.mjs`
- `tests/conformance/scripts/print-dom-text-content-oracle.mjs`
- `tests/conformance/test/dom-text-content-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-text-content-oracle.json`

Oracle scenarios:

- Primitive children: string, empty string, number, zero, bigint, null,
  undefined, false, true, symbol/function rejection if observable, and arrays
  of primitive children.
- Text transitions: text to text, text to empty string, text to null, text to
  element, element to text, text to array children, array children to text.
- HostText path: text child under a non-shortcut parent, update of a HostText
  node, deletion of a HostText node, adjacent text siblings, and text
  insertion before/after element siblings.
- Element text-content shortcut path: initial `setTextContent`, update through
  existing single text node where React does that, reset before managed child
  append, and no HostText child fiber for shortcut elements.
- Namespace text: SVG text element, SVG container child context,
  `foreignObject` HTML boundary, nested SVG inside `foreignObject`, MathML
  text, and HostText appended to namespaced parents.
- `dangerouslySetInnerHTML`: valid HTML, empty string HTML, nullish `__html`,
  invalid shape, missing `__html`, children conflict, valid HTML to managed
  text, managed text to valid HTML, and valid HTML to element children if React
  has distinct behavior.
- Reset/clear operations: ensure text clearing is observable separately from
  removeChild where React exposes that distinction in fake DOM operations.
- Token cleanup: future Fast React comparison should prove text node map
  cleanup after deletion and unmount once node maps exist.

Existing oracle tests to keep green while implementing:

- `node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `node --test tests/conformance/test/dom-namespace-svg-oracle.test.mjs`

Future Rust tests:

- Host-config compile tests for any text deletion hook.
- Reconciler complete-work tests proving `should_set_text_content` skips
  child reconciliation for text-content elements.
- Reconciler commit tests proving `commit_text_update` and
  `reset_text_content` ordering.
- Host token tests proving text tokens are generated, rejected when stale, and
  invalidated after deletion.
- Test-renderer regression tests proving DOM-specific text rules did not leak
  into the generic in-memory renderer.

Future package/DOM tests:

- Fake-DOM unit tests for `setTextContent`, `createTextNode`, `nodeValue`,
  `textContent`, `innerHTML`, and owner-document use.
- DOM adapter tests for namespace context and text operations.
- A later smoke or integration test may render text through `createRoot`, but
  only after public root facade and scheduler work lands. This worker keeps
  that below scope.

## Completion Gates For Minimal Reliable Text Rendering

Do not claim minimal DOM text rendering until all gates below are met:

1. Dedicated `dom-text-content` React DOM 19.2.6 oracle exists, regenerates
   byte-for-byte, has no local path leaks, and covers the scenarios above.
2. Existing worker 061, 062, and 063 oracle tests still pass.
3. Host-config supports sound text token cleanup, either through an added text
   deletion hook or a documented proof that existing mutation hooks cover every
   deletion/unmount path.
4. Reconciler complete-work tests prove the two text paths are distinct:
   HostText fibers for normal text children, no HostText child fibers for
   text-content shortcut elements.
5. Reconciler commit tests prove text update, text reset, hide/unhide text,
   deletion cleanup, and operation ordering.
6. DOM adapter tests prove owner-document text creation, namespace text,
   `dangerouslySetInnerHTML` exclusion, and structured DOM writes.
7. No controlled input, event dispatch, hydration, resources, public root
   facade, or root listener compatibility is claimed from these tests.

## Explicitly Out Of Scope

This plan stays below:

- Controlled inputs/selects/textareas/forms. `textarea` appears in the
  upstream `shouldSetTextContent` shape, but reliable textarea behavior needs
  worker 064-style controlled value tracking and remains provisional.
- Event dispatch, event priority, batching, and controlled state restore.
- Hydration, Fizz markers, mismatch repair, and event replay.
- Resources, singletons, hoistables, and document/head/body acquisition.
- Public `createRoot`, `hydrateRoot`, `root.render`, `root.unmount`, and
  `flushSync` compatibility.
- Browser layout, CSS cascade, selection, focus, accessibility, and custom
  element lifecycle behavior.

## Delegated Hypothesis Checks

Two nested read-only explorer agents were used as allowed by the worker brief:

- Source-shape explorer: confirmed no concrete DOM host exists, the current
  host-config has the relevant text hooks, the reconciler and `react-dom`
  package are placeholders, and future text work must touch reconciler
  complete/commit paths plus new DOM adapter files.
- Oracle/report explorer: confirmed workers 061, 062, and 063 provide partial
  text evidence; no dedicated text-content oracle exists; worker 091's note
  about worker 062 absence is stale; workers 064, 088, 089, and 105 are absent
  in this worktree and must be treated as provisional.

Both explorers reported that they did not modify files and did not read
`ORCHESTRATOR.md`.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is anchored to present merged reports and distinguishes direct
  evidence from oracle gaps.
- It names exact future files and tests instead of relying on broad DOM
  renderer labels.
- It keeps stale evidence from worker 091 corrected by current worktree state.

Maintainability:

- DOM text rules stay in DOM adapter paths.
- Generic host-config changes are limited to the likely root-cause gap for
  text deletion cleanup.
- Reconciler ownership is limited to fiber/effect decisions and host hook
  ordering.

Performance:

- The element text-content shortcut should avoid unnecessary HostText fibers
  and child reconciliation for primitive text leaves.
- Updates should prefer single text-node `nodeValue` writes where React DOM
  does, while falling back to `textContent` for replacement.
- DOM update payloads should carry explicit text entries so commit does not
  re-diff props.

Security:

- Managed text must use `textContent`, text node data, or `nodeValue`, never
  HTML string construction.
- `dangerouslySetInnerHTML` must be validated before assigning `innerHTML`.
- Invalid dangerous HTML props must not leave managed text children installed
  under the same element.
- Node maps should use weak/expando-style storage and clear text tokens on
  deletion/unmount to avoid retaining detached nodes or stale user props.

## Risks Or Blockers

- No dedicated `dom-text-content` oracle exists yet.
- No worker 106 report is present, so no merged end-to-end root render test
  plan can be consumed here.
- Workers 064, 088, 089, and 105 are absent in this worktree; dependencies on
  controlled inputs, root markers, root listeners, and first DOM host
  implementation remain provisional.
- The current host-config has no explicit text deletion cleanup hook.
- Fake-DOM evidence does not prove native browser parser, layout, selection,
  focus, accessibility, or custom-element lifecycle behavior.
- Public root rendering is still blocked on reconciler root/update/scheduler
  and DOM container work.

## Verification Results

- `git status --short --untracked-files=all` shows only this report as an
  untracked scoped change.
- Local/temp path leak check over this report produced no matches.
- Trailing whitespace check over this report produced no matches.
- `git diff --check --no-index /dev/null
  worker-progress/worker-110-dom-text-content-host-plan.md` produced no
  whitespace warnings.
- Focused existing oracle tests passed: 30 tests across the DOM
  attribute/property, DOM style/`dangerouslySetInnerHTML`, and DOM
  namespace/SVG oracle suites.

No implementation tests were run because this worker is report-only and did
not modify source code.

## Completion Audit

Concrete success criteria:

- Produce a report-only DOM text-content host plan.
- Write only `worker-progress/worker-110-dom-text-content-host-plan.md`.
- Cover `shouldSetTextContent`, text node creation/update/reset, element
  text-content shortcuts, namespace interactions,
  `dangerouslySetInnerHTML` exclusions, and tests needed before reliable
  minimal DOM text rendering.
- Anchor in workers 040, 051, 055, 061, 062, 063, 091, and 106 when present.
- Treat workers 064, 088, 089, and 105 as provisional unless reports/oracles
  are present.
- Keep the plan below controlled inputs, event dispatch, hydration, resources,
  and public root facade work.
- Include exact future source files, edge-case tests, oracle gaps, completion
  gates, delegated checks, quality review, changed files, commands, and risks.

| Requirement | Evidence in this report / checks |
| --- | --- |
| Report-only plan | This file is a planning report and states no source, package, oracle, generated artifact, or test implementation was changed. |
| Write only assigned file | `git status --short --untracked-files=all` showed only `worker-progress/worker-110-dom-text-content-host-plan.md`. |
| Goal setup recorded | "Goal Tool Status" records `create_goal`, `get_goal`, active status, and objective. |
| Required docs read and orchestrator avoided | Commands list includes `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; subagents reported they did not read `ORCHESTRATOR.md`. |
| Worker 040 anchor | "Prior Worker Anchors" and design sections cite DOM-owned mutation/text behavior from worker 040. |
| Worker 051 anchor | "Prior Worker Anchors" and text cleanup sections cite token-aware host boundary from worker 051. |
| Worker 055 anchor | "Prior Worker Anchors" and source scope sections keep public root facade below scope. |
| Worker 061 anchor | "Prior Worker Anchors" and evidence sections use attribute/property oracle text observations; focused oracle test passed. |
| Worker 062 anchor | "Prior Worker Anchors" and dangerous HTML sections use the present style/dangerous HTML oracle; focused oracle test passed. |
| Worker 063 anchor | "Prior Worker Anchors" and namespace sections use namespace/SVG/MathML oracle evidence; focused oracle test passed. |
| Worker 091 anchor | "Prior Worker Anchors" and root-cause design consume the minimal DOM mutation plan and correct its stale 062 absence note. |
| Worker 106 when present | Report states no worker 106 report/oracle is present; only the task prompt exists, so no merged evidence was used. |
| Workers 064, 088, 089, 105 provisional | Report states only task prompts are present and labels controlled inputs/root markers/root listeners/DOM host implementation dependencies provisional. |
| `shouldSetTextContent` | Dedicated section gives predicate ownership, truth table to verify, and minimal-slice exclusions. |
| Text node create/update/reset | Dedicated section covers HostText creation, owner document, token registration, `commit_text_update`, `reset_text_content`, hide/unhide, and deletion cleanup gap. |
| Element text-content shortcuts | Dedicated section covers mount, update transitions, reset, payload entries, and no HostText child fiber for shortcut elements. |
| Namespace interactions | Dedicated section covers owner document, SVG, MathML, `foreignObject`, SVG container context, and namespace text tests. |
| `dangerouslySetInnerHTML` exclusions | Dedicated section covers valid raw HTML, nullish `__html`, invalid shape, children conflict, transitions to/from managed text, and structured writes. |
| Tests needed | "Required Tests And Oracle Gaps" lists exact future oracle files, edge cases, existing oracle tests, Rust tests, and DOM/package tests. |
| Exact future source files | "Exact Future Source Work" lists host-config, reconciler, and DOM adapter file paths. |
| Completion gates | "Completion Gates For Minimal Reliable Text Rendering" lists seven gates before compatibility claims. |
| Keep below excluded tracks | "Explicitly Out Of Scope" excludes controlled forms, events, hydration, resources, and public roots. |
| Subagents used | "Delegated Hypothesis Checks" summarizes both explorer checks and results. |
| Quality/maintainability/performance/security review | Dedicated review section covers all four. |
| Commands run | "Commands Run" lists tool actions and shell commands, with final checks added below. |
| Verification | "Verification Results" records status, path leak, whitespace, diff-check, and focused oracle test results. |

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` after setup and before report writing.
- `update_plan` to track worker progress.
- `spawn_agent` for two read-only explorer checks.
- `wait_agent` for both explorers.

Shell commands:

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/**' -g '!ORCHESTRATOR.md'
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,280p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,280p' worker-progress/worker-061-dom-attribute-property-oracle.md
sed -n '1,320p' worker-progress/worker-062-dom-style-dangerous-html-oracle.md
sed -n '1,320p' worker-progress/worker-063-dom-namespace-svg-oracle.md
sed -n '1,760p' worker-progress/worker-091-dom-mutation-minimum-plan.md
rg --files worker-progress tests/conformance/oracles tests/conformance/src tests/conformance/test tests/conformance/scripts docs | rg 'worker-064|worker-088|worker-089|worker-105|worker-106|dom-controlled-input|dom-container-root|dom-root-listener|dom-mutation-host|root-render-e2e'
rg --files worker-progress | rg 'worker-(040|051|055|061|062|063|091|106)-'
rg -n "should_set_text_content|create_text_instance|commit_text_update|reset_text_content|InitialChildrenFinalization|HostFiberToken|dangerouslySetInnerHTML|textContent|children|createTextNode|createElementNS|foreignObject|textarea|noscript" crates packages tests/conformance/src tests/conformance/oracles worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-061-dom-attribute-property-oracle.md worker-progress/worker-062-dom-style-dangerous-html-oracle.md worker-progress/worker-063-dom-namespace-svg-oracle.md worker-progress/worker-091-dom-mutation-minimum-plan.md --glob '!node_modules/**' --glob '!target/**'
sed -n '520,1260p' crates/fast-react-host-config/src/lib.rs
sed -n '640,840p' crates/fast-react-test-renderer/src/lib.rs
rg --files packages/react-dom crates/fast-react-reconciler/src crates/fast-react-host-config/src crates/fast-react-test-renderer/src tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,320p' tests/conformance/src/dom-style-dangerous-html-scenarios.mjs
sed -n '320,460p' tests/conformance/src/dom-style-dangerous-html-probe-runner.mjs
sed -n '1,220p' tests/conformance/src/dom-namespace-svg-scenarios.mjs
sed -n '1,180p' tests/conformance/src/dom-attribute-property-scenarios.mjs
node --input-type=module - <<'NODE' ... inspect DOM oracle JSON shapes ... NODE
node --input-type=module - <<'NODE' ... summarize text-related oracle operations ... NODE
node --input-type=module - <<'NODE' ... inspect dangerous HTML root errors ... NODE
npm view react-dom@19.2.6 version dist.tarball --json
npm pack react-dom@19.2.6 --pack-destination <temp>
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xz -O package/cjs/react-dom-client.development.js | rg -n "function shouldSetTextContent|shouldSetTextContent|function resetTextContent|function commitTextUpdate|function createTextInstance|function setTextContent|dangerouslySetInnerHTML"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xz -O package/cjs/react-dom-client.development.js | sed -n '2648,2675p;22110,22180p;20148,20178p;20400,20426p;20632,20650p;22184,22200p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xz -O package/cjs/react-dom-client.development.js | sed -n '12540,12780p;22060,22135p'
git status --short --untracked-files=all
rg -n '(/Us[e]rs/user|/private/v[a]r|/var/f[o]lders|/t[m]p/|file:///Us[e]rs)' worker-progress/worker-110-dom-text-content-host-plan.md
perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/' worker-progress/worker-110-dom-text-content-host-plan.md
git diff --check --no-index /dev/null worker-progress/worker-110-dom-text-content-host-plan.md
node --test tests/conformance/test/dom-attribute-property-oracle.test.mjs tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs tests/conformance/test/dom-namespace-svg-oracle.test.mjs
```

## Changed Files

- `worker-progress/worker-110-dom-text-content-host-plan.md`

## Recommended Next Tasks

1. Add the dedicated `dom-text-content` React DOM 19.2.6 oracle before any
   implementation claims text compatibility.
2. Decide and implement the host-config text deletion cleanup hook if the
   node-map worker cannot prove existing mutation hooks are sufficient.
3. Implement reconciler complete/commit text behavior against a fake host
   before wiring the DOM adapter.
4. Implement DOM adapter text helpers and validate them against workers 061,
   062, 063, and the new text oracle.
5. Consume workers 064, 088, 089, 105, and 106 only after their reports or
   oracles are present in the worktree.
