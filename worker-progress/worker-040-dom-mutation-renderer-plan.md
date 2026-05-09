# worker-040-dom-mutation-renderer-plan

## Objective

Produce a report-only DOM mutation host implementation plan for Fast React.

Write scope honored: only `worker-progress/worker-040-dom-mutation-renderer-plan.md` was changed. No DOM, reconciler, host-config, package, or test implementation was added.

## Summary

Fast React should implement React DOM mutation support as a DOM renderer adapter layered on the existing opaque, capability-grouped host boundary. The root cause to avoid is treating DOM mutation as a few generic append/remove/update calls. React DOM 19.2.6 mutation behavior also requires DOM namespace context, DOM property and style diffing, controlled form wrappers, root container validation and marking, node-to-fiber maps, public DOM node lookup, focus helpers, diagnostics, and event/hydration/resource hooks that must remain renderer-owned.

Recommended architecture:

- Keep `crates/fast-react-core` renderer-agnostic. It may store opaque host handles, host flags, refs, portals, visibility state, and future dehydrated boundary state, but it must not know DOM node types, namespaces, attributes, CSS, custom elements, or event delegation.
- Extend `crates/fast-react-host-config` only where the generic host contract is undersized. The likely breaking change is adding a phase-scoped fiber/instance token to creation, hydration, and commit hooks so DOM can maintain node-to-fiber and props maps without exposing raw fibers.
- Build real mutation traversal in `crates/fast-react-reconciler` against a stricter aggregate such as `MutationReconcilerHost: MutationRenderer + HostScheduling + PortalHost`, while keeping DOM property diffing and container validation out of the reconciler.
- Put DOM-specific creation, property setting, controlled components, root markers, instance maps, focus helpers, and test-selector diagnostics in a future DOM adapter package/crate, not in `fast-react-core`.
- Keep events, hydration, resources/singletons, and server/Fizz as separate implementation tracks. The DOM mutation host must reserve integration points for them, but should not fake support.

## Evidence gathered

Required local reports:

- Worker 008 established the accepted boundary: opaque host handles, capability traits, mutation first, hydration/persistence designed up front, and DOM resources/events/singletons outside core.
- Worker 012 implemented the current `fast-react-host-config` skeleton with `HostTypes`, `HostIdentityAndContext`, `HostCreation`, `HostCommit`, `HostScheduling`, `MutationHost`, optional capability traits, `HostCapabilitySet`, and `MutationRenderer`.
- Worker 018 proved the mutation traits are implementable with a non-DOM in-memory test renderer, including instance/text creation, opaque handles, snapshots, append/insert/remove/clear, hide/unhide, text reset, update payloads, and single-parent move behavior.
- Worker 019 moved the reconciler placeholder to a canonical `MutationRenderer` boundary and documented that real roots still need scheduling/event-priority hooks and host container types.
- Worker 033 inventoried React DOM 19.2.6 and identified DOM-host requirements: element/text creation, HTML/SVG/MathML namespaces, attributes/properties/styles/events, custom elements, controlled inputs/textareas/selects/forms, mutation commits, container validation, root marking, node-to-fiber maps, public instance lookup, focus helpers, fragment refs, and test selectors.

Current code checked:

- `crates/fast-react-host-config/src/lib.rs` already has explicit capabilities for mutation, hydration, portals, microtasks, commit suspension, forms, resources, singletons, view transitions, and diagnostics. It does not yet pass an internal fiber token to host creation or commit hooks.
- `crates/fast-react-reconciler/src/lib.rs` still has no real fiber reconciliation or commit traversal; its mutation entry point validates only the mutation capability and then returns a loud unimplemented error.
- `crates/fast-react-test-renderer/src/lib.rs` owns renderer storage and handles directly, which is the right model for a future DOM adapter: the reconciler should not inspect host storage.
- The workspace currently has `packages/react` and native placeholder packages, but no checked-in `packages/react-dom` implementation in this worktree.

Delegated checks:

- No nested agents were spawned in this retry. The continuation instruction from the orchestrator explicitly said not to spawn, wait on, or close nested agents because previous retries hit nested-agent usage-limit errors. Hypotheses were tested against the required local reports and current source instead.

## Root-cause plan

The first DOM mutation host should not aim to make `react-dom/client.createRoot` fully compatible in one slice. `createRoot` also needs root scheduling, delegated events, update priority, error callbacks, and root object behavior. The DOM mutation host should instead make the renderer-owned host operations correct, then let client roots, events, hydration, resources, and forms connect to that host through explicit contracts.

The likely breaking host-config change is necessary: React DOM must associate DOM nodes with internal fiber handles and latest props. React's JS implementation uses private node fields for instance and props maps. Fast React should not expose raw fiber structs to the host, but the host must receive an opaque, stable, phase-scoped token during `create_instance`, `create_text_instance`, hydration attachment, and commits. Without this, future event dispatch, public instance lookup, focus helpers, test selectors, and deletion cleanup would patch symptoms with side channels.

Recommended token model:

- Add an opaque `HostFiberToken` or `HostInstanceToken` owned by `fast-react-reconciler`.
- Pass token references to host creation, text creation, commit update, hydrated instance commit, and deletion detach hooks.
- Let the DOM adapter store `Node -> token` and `Node -> latest props` in JS `WeakMap`s or private expandos. The token must be enough for the reconciler to resolve back to the current fiber when events/test selectors ask for an instance.
- Keep token lifetime phase-scoped and validated; stale tokens after deletion should fail closed.

## Boundary map

| Requirement | Recommended owner | Notes |
| --- | --- | --- |
| Lane priorities, update queues, fiber flags, refs, portals, visibility, commit phases | `crates/fast-react-core` and `crates/fast-react-reconciler` | Renderer-agnostic only. Do not add DOM node, CSS, or attribute concepts. |
| Capability catalog and opaque host trait signatures | `crates/fast-react-host-config` | Add only generic hooks needed by any host, such as opaque fiber tokens and diagnostic capability shape. |
| Mutation traversal, host effect ordering, root container bookkeeping | `crates/fast-react-reconciler` | Calls host traits; does not diff DOM props or validate DOM containers. |
| Non-DOM mutation conformance and trait regression coverage | `crates/fast-react-test-renderer` | Keep as canary that DOM changes did not leak into generic host traits. |
| DOM namespace context, element/text creation, prop/style diffing, custom elements, controlled forms, root markers, node maps, focus/test selector hooks | Future DOM adapter, likely `packages/react-dom/src/dom-bindings/**` first, with optional `crates/fast-react-dom-host/**` for pure Rust rule tables | DOM-specific. Must be separable from native/custom renderers. |
| Public `react-dom` package exports and root facade | `packages/react-dom/**` | Worker 033 says package surface is separate from renderer behavior. |
| React DOM event system and priority | Separate events worker track | Mutation host should expose hooks and maps needed by events but not implement event delegation in this slice. |
| Hydration, resources, singletons, Fizz markers | Separate hydration/resources/server tracks | Reserve capability shape; do not claim support until implemented. |

## DOM mutation host requirements

### Element and text instance creation

DOM creation must use a renderer-owned `DomHostContext`, not a core enum. It needs at least owner document, current namespace, ancestor info needed for validation, and root/container identity. `create_instance` should choose `createElement` versus `createElementNS`, handle HTML/SVG/MathML transitions, and preserve special cases such as SVG `foreignObject` returning to HTML context.

`should_set_text_content` belongs to the DOM adapter because React DOM's fast text path depends on DOM-specific props such as `children`, `dangerouslySetInnerHTML`, `textarea`, and `noscript`. `create_text_instance` needs text nesting validation in development, a text node owned by the correct document, and a node-to-fiber token registration just like elements.

`finalize_initial_children` should run DOM initial-property logic and return `CommitMount` only when a later mount hook is required, for example autofocus-like behavior. `commit_mount` should remain the place for post-attachment DOM work that cannot run while the node is detached.

### Namespaces

Namespace switching must be tracked in DOM host context:

- HTML containers start in the HTML namespace.
- SVG and MathML elements switch child context.
- HTML integration points such as SVG `foreignObject` require HTML descendants.
- Document and DocumentFragment containers derive owner document separately from namespace.

Putting these rules in core would make native/custom renderers inherit meaningless DOM state. If a pure Rust helper crate is added, keep it named and scoped as DOM-specific.

### Attributes, properties, and styles

DOM update payload calculation must be host-owned. A generic Rust prop diff would become DOM code in disguise.

The DOM adapter needs a property operation model covering:

- Attribute name validation and canonicalization.
- Boolean, overloaded boolean, numeric, positive numeric, string, URL-like, ARIA, `data-*`, XML, and namespaced attributes.
- Property aliases such as `className` and `htmlFor`.
- Event-like prop names as event-system inputs, not generic attributes.
- `dangerouslySetInnerHTML` validation and update ordering.
- `textContent` updates versus child reconciliation.
- Style object diffing, removals, custom CSS properties, unitless numeric properties, vendor prefixes, and security-sensitive value handling.

Security-sensitive DOM writes should use structured DOM APIs (`textContent`, `setAttribute`, property assignment, style object mutation) rather than HTML string concatenation.

### Custom elements

Custom element behavior needs a dedicated DOM helper and oracle. Custom elements differ from built-in elements in property/attribute routing, case sensitivity, unknown prop handling, `is` support, and event-like attributes. Treating custom elements as normal HTML elements would hide incompatibilities in web-component users; treating all unknown built-in props as custom-element props would break normal DOM behavior.

### Controlled inputs, selects, textareas, and forms

Controlled form behavior is not just prop setting. It spans initial mount, post-mount normalization, commit update ordering, value tracking, event/change handling, selection preservation, form reset, and hydration markers.

Plan the slices separately:

- `input`: `value`, `defaultValue`, `checked`, `defaultChecked`, `name`, `type`, radio group behavior, value tracking, and post-commit controlled state restoration.
- `select`: `multiple`, `value`, `defaultValue`, option selection after children are mounted, and controlled/uncontrolled transitions.
- `textarea`: initial value from `value`, `defaultValue`, or children; text node handling must not fight the normal child path.
- `form`: `requestFormReset`, React-owned form detection, action/formAction behavior, and future server-action integration.

The base DOM mutation host may include form capability plumbing, but should not claim `HostCapability::Forms` until controlled state and reset semantics are covered by oracles.

### Mutation commits

The reconciler should own effect ordering and call DOM host operations:

- `append_initial_child` while instances are detached.
- `append_child`, `append_child_to_container`, `insert_before`, `insert_in_container_before`, `remove_child`, `remove_child_from_container`, and `clear_container` in the mutation phase.
- `commit_update` with a DOM update payload built by the DOM adapter.
- `commit_text_update`, `reset_text_content`, `hide_instance`, `hide_text_instance`, `unhide_instance`, and `unhide_text_instance`.
- `detach_deleted_instance` to clear node maps and controlled/event bookkeeping.

The DOM adapter should preserve the single-parent move invariant already proven by worker 018 in the test renderer. Container mutation must handle Element, Document, DocumentFragment, and special comment containers according to React DOM's validation oracle.

`prepare_for_commit` and `reset_after_commit` must eventually coordinate selection preservation, active-instance blur/focus hooks, and event enablement. The mutation host should expose the hooks, while the detailed event/update-priority behavior remains in the events track.

### Container validation and root markers

`react-dom/client` cannot call into the reconciler until DOM containers are validated. The DOM package should own:

- `isValidContainer` parity for Element, Document, DocumentFragment, and React-supported comment mount points.
- Root marker storage on containers.
- Duplicate root warnings and unmount cleanup policy.
- Container-to-root lookup for `createRoot`, `hydrateRoot`, `flushSync`, and future scheduling helpers.
- Portal container validation and `prepare_portal_mount`.

The reconciler should receive an opaque host container handle after validation. It should not inspect DOM `nodeType`.

### Instance-to-fiber maps

DOM node maps are required for events, hydration, public lookup, focus helpers, and test selectors. The DOM adapter should own:

- Node to closest host fiber token.
- Node to current props.
- Container to root token.
- Cleanup on deletion and unmount.
- A reverse lookup from host instance token to DOM node for public instance resolution.

Use weak references or private expandos through the JS DOM adapter so deleted nodes do not keep fibers alive accidentally. Rust should not store raw JS DOM object pointers across turns without the binding lifetime rules from the native boundary.

### Public instance lookup

For DOM host components, `get_public_instance` should return the DOM node. For text nodes, React public APIs generally expose the parent/public host instance through fibers rather than raw text nodes. The exact policy should be verified by a public React DOM oracle once roots exist.

This lookup also feeds refs. Ref attachment/detachment should be reconciler-owned in timing, but DOM node identity is host-owned.

### Focus helpers and test selectors

React DOM's host config reports diagnostics/test-selector support. Fast React should keep those hooks optional through `DiagnosticsHost`.

DOM diagnostics should implement:

- Bounding rect measurement.
- Text content extraction.
- Hidden subtree checks that account for host visibility operations.
- Accessibility role matching.
- `set_focus_if_focusable`.
- Intersection observer setup for selector tests.

These helpers are not public `react-dom` exports, but they matter for upstream test compatibility and event/focus behavior. They should live in the DOM adapter and only be enabled when real DOM APIs are present.

## Capability policy

Initial DOM mutation work should advertise only capabilities that actually work.

- Minimum root-rendering capability set: `Mutation`, `Portals`, `Microtasks`, and eventually `Diagnostics` when focus/test selector helpers are real.
- Do not enable `Hydration` for `createRoot`; reserve it for `hydrateRoot` once hydratable traversal, markers, mismatch diagnostics, and event replay exist.
- Do not enable `Forms` until controlled inputs/selects/textareas and `requestFormReset` are covered.
- Do not enable `Resources` or `Singletons` until hoistable resources and `html`/`head`/`body` acquisition are implemented.
- Do not enable `ViewTransitions` until measurement, names, clones, and transition lifecycle are implemented.

This is intentionally stricter than React DOM's full host config. Fast React should fail closed instead of shipping no-op capabilities that make incompatible paths appear to work.

## Recommended implementation slices

The scopes below are concrete and intentionally non-overlapping. Some are sequential because earlier trait changes affect later implementers.

1. `worker-dom-host-token-boundary`
   - Write scope: `crates/fast-react-host-config/**`, `worker-progress/worker-dom-host-token-boundary.md`.
   - Task: add opaque host fiber/instance token plumbing to creation, text creation, commit update, hydration attachment stubs, and deletion hooks. Keep token type renderer-agnostic and update tests without DOM behavior.

2. `worker-reconciler-mutation-commit-skeleton`
   - Write scope: `crates/fast-react-reconciler/**`, `worker-progress/worker-reconciler-mutation-commit-skeleton.md`.
   - Task: add root/container placeholders, host effect ordering, mutation commit traversal shape, and token production against canonical host traits. No DOM props, events, or hydration.

3. `worker-test-renderer-token-migration`
   - Write scope: `crates/fast-react-test-renderer/**`, `worker-progress/worker-test-renderer-token-migration.md`.
   - Task: migrate the in-memory renderer to the token-aware trait shape and add regression tests proving tokens do not require DOM concepts.

4. `worker-dom-rule-crate-scaffold`
   - Write scope: `crates/fast-react-dom-host/**`, root `Cargo.toml`, `worker-progress/worker-dom-rule-crate-scaffold.md`.
   - Task: add a DOM-specific helper crate for namespace transitions, property metadata, style diff planning, and custom-element classification. No DOM node mutation and no reconciler dependency.

5. `worker-react-dom-container-root-markers`
   - Write scope: `packages/react-dom/src/client-roots/**`, `tests/conformance/dom-containers/**`, `worker-progress/worker-react-dom-container-root-markers.md`.
   - Task: implement container validation, root marker storage, root cleanup, and portal container validation in the package layer after the package scaffold exists. No event delegation and no rendering behavior beyond loud unsupported handoff.

6. `worker-react-dom-node-maps`
   - Write scope: `packages/react-dom/src/node-maps/**`, `tests/conformance/dom-node-maps/**`, `worker-progress/worker-react-dom-node-maps.md`.
   - Task: implement DOM node to fiber-token/current-props/root maps and deletion cleanup helpers behind private APIs. No event plugin behavior.

7. `worker-react-dom-element-text-creation`
   - Write scope: `packages/react-dom/src/dom-creation/**`, `tests/conformance/dom-creation/**`, `worker-progress/worker-react-dom-element-text-creation.md`.
   - Task: implement DOM owner document, namespace-aware element creation, text creation, initial child finalization decisions, and public instance lookup helpers.

8. `worker-react-dom-properties-styles`
   - Write scope: `packages/react-dom/src/dom-properties/**`, `tests/conformance/dom-properties/**`, `worker-progress/worker-react-dom-properties-styles.md`.
   - Task: implement attribute/property/style diff and commit payload application, including `dangerouslySetInnerHTML` and custom-element routing. Keep event prop extraction as data for the events track.

9. `worker-react-dom-mutation-operations`
   - Write scope: `packages/react-dom/src/dom-mutations/**`, `tests/conformance/dom-mutations/**`, `worker-progress/worker-react-dom-mutation-operations.md`.
   - Task: implement append/insert/remove/clear/reset/hide/unhide/text update operations against real DOM nodes and verify single-parent moves.

10. `worker-react-dom-controlled-forms`
    - Write scope: `packages/react-dom/src/dom-forms/**`, `tests/conformance/dom-forms/**`, `worker-progress/worker-react-dom-controlled-forms.md`.
    - Task: implement input/select/textarea/form controlled state plumbing and reset helpers. Coordinate with the events worker before claiming full controlled input compatibility.

11. `worker-react-dom-diagnostics-focus`
    - Write scope: `packages/react-dom/src/dom-diagnostics/**`, `tests/conformance/dom-diagnostics/**`, `worker-progress/worker-react-dom-diagnostics-focus.md`.
    - Task: implement `DiagnosticsHost` equivalents for focusability, bounding rects, text content, hidden subtree, accessibility role matching, and intersection observer setup.

12. `worker-react-dom-mutation-integration-oracle`
    - Write scope: `tests/conformance/react-dom-mutation-integration/**`, `worker-progress/worker-react-dom-mutation-integration-oracle.md`.
    - Task: add public React DOM 19.2.6 comparison scenarios for element/text creation, attributes/styles, custom elements, basic mutations, root markers, public refs, and deletion cleanup. This should run only after the package and reconciler paths can exercise DOM behavior.

## Quality, maintainability, performance, and security review

Quality:

- The plan ties each DOM requirement to a current project boundary and required evidence from prior workers.
- It explicitly separates DOM mutation from public package scaffolding, events, hydration, resources, and server rendering.

Maintainability:

- The proposed host token change is breaking but removes the root cause of future side-channel maps.
- DOM-specific helpers are scoped to DOM paths so the test renderer and future native renderers remain useful boundary checks.

Performance:

- Hot reconciler paths should stay monomorphized over host traits.
- DOM property diffing should produce compact update payloads and batch actual DOM writes in commit phases.
- Cross-boundary JS/Rust DOM calls need microbenchmarks before moving tiny DOM operations into Rust; a JS DOM adapter may be the correct first implementation for browser and jsdom compatibility.

Security:

- DOM writes must use structured APIs and React-compatible validation for URLs, HTML, styles, custom attributes, and custom elements.
- Node-to-fiber maps must not keep deleted DOM nodes or JS values alive indefinitely.
- `dangerouslySetInnerHTML`, script/style/resource handling, hydration mismatch recovery, and event replay need dedicated security-oriented tests before compatibility claims.

## Verification results

- Scoped status shows only `worker-progress/worker-040-dom-mutation-renderer-plan.md` as untracked.
- No concrete local temp or user-directory paths were found in this report.
- No trailing whitespace was reported by a no-index whitespace check that covers the untracked report file.
- Required sections and follow-up worker scopes are present.
- No source tests were run because this is a report-only task.

## Risks and blockers

- Real DOM mutation rendering is blocked on real reconciler roots and mutation commit traversal.
- `createRoot` is blocked on client root object behavior, lane scheduling, event setup, and root update queues, not just DOM host operations.
- `hydrateRoot` remains blocked on hydratable traversal, server/Fizz markers, event replay, mismatch diagnostics, and form state markers.
- Controlled input compatibility is blocked on event/change tracking and post-commit restore semantics.
- The current host-config trait shape likely needs breaking token-aware signatures.
- Browser deployment strategy remains unresolved; N-API can support Node/jsdom, but browser DOM support probably needs a JS adapter or future WASM boundary.
- Exact React DOM behavior for container validation, custom elements, and form edge cases needs deterministic oracles before implementation claims.

## Commands run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress
sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md
sed -n '260,560p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,280p' worker-progress/worker-012-host-config-traits.md
sed -n '1,300p' worker-progress/worker-018-test-renderer-mutation-host.md
sed -n '1,300p' worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '1,360p' worker-progress/worker-033-react-dom-inventory.md
sed -n '360,760p' worker-progress/worker-033-react-dom-inventory.md
rg -n "DOM|mutation|createInstance|controlled|select|textarea|input|form|root|marker|namespace|custom|instance|fiber|focus|selector|hydration|event|dangerous|style|property|attribute|container|portal|resource|singleton" worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-008-renderer-host-config.md worker-progress/worker-012-host-config-traits.md worker-progress/worker-018-test-renderer-mutation-host.md worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '260,620p' crates/fast-react-host-config/src/lib.rs
sed -n '620,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1040,1500p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,300p' crates/fast-react-test-renderer/src/lib.rs
sed -n '300,720p' crates/fast-react-test-renderer/src/lib.rs
sed -n '720,1160p' crates/fast-react-test-renderer/src/lib.rs
rg --files -g 'Cargo.toml' -g 'package.json' -g '*.rs' -g '*.mjs' -g '*.js' crates packages bindings tests
find . -maxdepth 3 -type d
test -d node_modules/react-dom && echo node_modules-react-dom-present || echo node_modules-react-dom-absent
rg -n "react-dom|dom|mutation|host" Cargo.toml package.json crates packages tests worker-progress/worker-035* docs -g '!ORCHESTRATOR.md'
rg -n "react-dom|dom|mutation|host" Cargo.toml package.json crates packages tests worker-progress docs -g '!ORCHESTRATOR.md'
rg -n "N-API|WASM|browser|DOM|renderer|boundary|JS" worker-progress/worker-006-binding-strategy.md
sed -n '1,220p' docs/tasks/worker-040-dom-mutation-renderer-plan.prompt.md
git status --short --untracked-files=all
rg -n '/private/v[a]r|/var/f[o]lders|/t[m]p|/Us[e]rs/' worker-progress/worker-040-dom-mutation-renderer-plan.md
git diff --check --no-index /dev/null worker-progress/worker-040-dom-mutation-renderer-plan.md
rg -n 'Summary|Evidence gathered|Boundary map|DOM mutation host requirements|Recommended implementation slices|Quality, maintainability, performance, and security review|Risks and blockers|Commands run|Changed files|Completion checklist|Write scope:|Task:' worker-progress/worker-040-dom-mutation-renderer-plan.md
```

One exploratory `rg` command with an unquoted unmatched glob failed before returning useful evidence; it did not modify files and is not used as support for this report.

## Changed files

- `worker-progress/worker-040-dom-mutation-renderer-plan.md`

## Completion checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Modified only `worker-progress/worker-040-dom-mutation-renderer-plan.md`.
- [x] Used worker 008, worker 012, worker 018, worker 019, and worker 033 reports as local evidence.
- [x] Mapped React DOM 19.2.6 mutation host requirements to likely Fast React crate/package boundaries.
- [x] Kept DOM specifics out of renderer-agnostic core.
- [x] Covered element/text creation, namespaces, props/styles, custom elements, controlled forms, mutation commits, container validation, root markers, instance maps, public lookup, focus helpers, and test selectors.
- [x] Recommended concrete non-overlapping future worker scopes.
- [x] Documented why no nested agents were used in this retry.
- [x] Reviewed quality, maintainability, performance, and security implications.
