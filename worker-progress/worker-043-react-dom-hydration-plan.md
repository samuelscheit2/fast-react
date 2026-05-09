# worker-043-react-dom-hydration-plan

## Objective

Produce a report-only hydration model and marker compatibility plan for React DOM 19.2.6.

Write scope honored: only `worker-progress/worker-043-react-dom-hydration-plan.md` was changed. No React DOM, reconciler, host-config, Fizz, or test code was implemented.

## Summary

React DOM hydration is a distinct root mode, not a flag on generic `createRoot` rendering. `hydrateRoot` validates a DOM container, collects hydration-specific callbacks and `formState`, calls the reconciler's hydration container path, marks the container as a root, installs delegated DOM events, and returns a hydration root object with `unstable_scheduleHydration`. The reconciler creates a FiberRoot whose root state has `isDehydrated: true`, schedules an initial hydration update without a normal element payload, and enters a hydration state machine that claims existing DOM nodes instead of creating new host instances.

Fast React should model hydration as three cooperating contracts:

1. A renderer-agnostic reconciler hydration state machine: root `is_dehydrated`, current hydratable cursor, hydration parent, root-or-singleton matching context, queued hydration errors, dehydrated Suspense/Activity state, and selective hydration retry lanes.
2. A DOM-owned `HydrationHost` capability: hydratable traversal, element/text/boundary/form marker matching, DOM prop/text hydration, mismatch diffing, boundary hide/unhide/clear, hydration callbacks, and event-replay unblocking.
3. A server/Fizz marker compatibility contract: client hydration must parse the exact comment/template markers emitted by React DOM Fizz, but marker generation belongs to server/Fizz work, not the client hydration implementation.

The root cause to avoid is treating hydration as "render over existing DOM." React DOM 19.2.6 hydration is distributed across `react-dom/client`, `ReactFiberRoot`, `ReactFiberHydrationContext`, DOM host config, commit effects, event replay, form action replay, resources/singletons, and Fizz marker output.

## Prior worker inputs

- Worker 008 established the host boundary direction: opaque host handles and capability traits, including a first-class `HydrationHost`. This report follows that boundary and keeps DOM details out of renderer-agnostic core.
- Worker 033 established the React DOM package and behavior inventory: `hydrateRoot` is blocked on reconciler roots, DOM mutation host operations, event priority/replay, Suspense/Activity/form markers, and server output compatibility. This report expands the hydration-specific slice.
- Worker 042 was not available in this checkout or sibling worker directory at the time of this report. Server/Fizz evidence below is therefore taken directly from React DOM 19.2.6 source/tarball and should be reconciled with worker 042 before implementation if that report lands later.
- No nested subagents were spawned in this continuation because the continuation instruction explicitly said not to spawn or wait on nested agents. Hypothesis checks were performed locally with direct package/source probes.

## Evidence gathered

Published package evidence:

- `react-dom@19.2.6` npm tarball package metadata has `exports["./client"].default = "./client.js"` and `peerDependencies.react = "^19.2.6"`.
- The published tarball includes `cjs/react-dom-client.development.js`, where `exports.hydrateRoot` creates a hydration FiberRoot, stores the root on the DOM container, calls `listenToAllSupportedEvents(container)`, and returns `ReactDOMHydrationRoot`.
- The same published client bundle contains hydration mismatch text, form marker constants `F!`/`F`, boundary clear/hide/unhide functions, `retryIfBlockedOn`, and `ReactDOMHydrationRoot.prototype.unstable_scheduleHydration`.
- The published server bundle contains Suspense marker/error attributes such as `<!--$...`, `<!--/$-->`, `data-dgst`, `data-msg`, `data-stck`, `data-cstck`, and runtime instructions such as `$RC`, `$RX`, and `$RB`.

Pinned source evidence from React tag `v19.2.6`:

- `packages/react-dom/src/client/ReactDOMRoot.js`: `hydrateRoot` parses `onUncaughtError`, `onCaughtError`, `onRecoverableError`, `identifierPrefix`, transition callbacks, and `formState`; calls `createHydrationContainer`; marks the root; installs delegated events; and exposes `unstable_scheduleHydration`.
- `packages/react-reconciler/src/ReactFiberRoot.js`: `createFiberRoot(..., hydrate, initialChildren, hydrationCallbacks, ..., formState, onRecoverableError, ...)` stores root `formState`, hydration callbacks, error callbacks, and initial root state `{ element, isDehydrated: hydrate, cache }`.
- `packages/react-reconciler/src/ReactFiberReconciler.js`: `createHydrationContainer` schedules an initial hydration update and calls `scheduleInitialHydrationOnRoot`; selective hydration uses `attemptSynchronousHydration`, `attemptContinuousHydration`, and `attemptHydrationAtCurrentPriority`.
- `packages/react-reconciler/src/ReactFiberHydrationContext.js`: the reconciler owns the hydratable cursor, matching attempts, mismatch exceptions, queued hydration errors, form marker claiming, dehydrated Activity/Suspense reentry, tail checks, and dev-only mismatch warnings.
- `packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js`: DOM host config declares `supportsHydration = true` and implements hydratable element/text/Activity/Suspense/form marker matching, DOM hydration, diagnostics, boundary clear/hide/unhide, and event replay flushing/unblocking.
- `packages/react-dom-bindings/src/events/ReactDOMEventListener.js` and `ReactDOMEventReplaying.js`: delegated events detect blocked dehydrated roots/boundaries, queue continuous events, synchronously try to hydrate replayable discrete events, sort explicit hydration targets by event priority, and unblock replay queues from commit/clear hooks.
- `packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js` and generated inline Fizz runtime source define the client-visible marker grammar the hydration host must parse.

## `hydrateRoot` model

`hydrateRoot(container, initialChildren, options)` must remain separate from `createRoot(container, options)`:

- `createRoot` creates a non-hydrating container and rejects old `options.hydrate` usage in dev with a warning.
- `hydrateRoot` requires the initial children argument, accepts hydration callbacks (`onHydrated`, `onDeleted` when the feature flag is enabled), root error callbacks, identifier prefix, transition callbacks, and `formState`.
- `hydrateRoot` calls the reconciler hydration path. The hydration root's first scheduled update is special: it exists to schedule work over server-rendered DOM and must match server output.
- The hydration root object has `unstable_scheduleHydration(target)`, which forwards to explicit hydration target queuing. A normal `ReactDOMRoot` does not expose this method.
- Delegated DOM listeners are installed on the hydration container immediately, before all dehydrated boundaries are necessarily hydrated. This is required because events can trigger selective hydration.

Fast React implication: root creation should have an explicit `RootKind::Hydration` or equivalent. The public facade may share option parsing with client roots, but the core root state, scheduling entrypoint, and root object shape must be different.

## Reconciler hydration state

React's hydration state machine is renderer-agnostic in shape but host-specific in operations:

- `enterHydrationState` initializes the first hydratable child within the root container, sets the hydration parent to the root fiber, clears queued hydration errors/diffs, and marks root-or-singleton context.
- `tryToClaimNextHydratableInstance` validates host nesting before mismatch reporting, then asks the host to match the next DOM element to the fiber type and props.
- `tryToClaimNextHydratableTextInstance` treats empty string text as unmatchable, validates text nesting in dev, and asks the host to match the next text node.
- `claimNextHydratableActivityInstance` and `claimNextHydratableSuspenseInstance` store dehydrated boundary state and create a dehydrated fragment child. Initial hydration does not immediately walk boundary children; the reconciler reenters later.
- `tryToClaimNextHydratableFormMarkerInstance` consumes a Fizz form marker and returns whether the marker matches the `formState` passed to `hydrateRoot`.
- `popHydrationState` checks unclaimed hydratable tail nodes, accounts for HostRoot/HostSingleton exceptions, skips past dehydrated Activity/Suspense boundaries, and advances to siblings.
- `upgradeHydrationErrorsToRecoverable` moves queued hydration mismatch errors into the root's recoverable error queue after a forced client render recovers.

Fast React implication: hydration needs reserved fiber state before DOM implementation starts: root dehydrated state, boundary dehydrated handles, boundary retry lanes, queued hydration errors, and flags for Hydrate/Visibility/Deletion interactions. Adding these after a mutation-only reconciler would be invasive.

## DOM hydratable matching

The DOM adapter must own matching because React DOM uses browser-specific rules:

- Hydratable handles are `Element`, `Text`, Activity comment, Suspense comment, and form marker comment.
- `getNextHydratable` skips non-hydratable nodes, returns element/text nodes, returns known start/marker comments, and stops at Activity/Suspense end comments.
- Element matching is case-insensitive by tag name. Outside root/singleton context, a mismatched tag usually fails immediately.
- Hidden `<input type="hidden">` nodes are special. Extra hidden inputs can be skipped to support embedded form data, and hidden input matching checks the expected `type` and `name`.
- In root or singleton context, React DOM can skip mismatched elements and applies hoistable/resource heuristics for `meta`, `link`, `style`, and `script` so injected or hoisted nodes are not claimed incorrectly.
- Text matching rejects empty client text because HTML does not parse empty text nodes. It skips extra hidden inputs and otherwise requires a text node unless matching in root/singleton context.
- Activity matching requires comment data `&`.
- Suspense matching accepts a hydratable boundary comment that is not Activity. Because form markers are also comments in the hydratable stream, Fast React should add explicit oracles around Suspense-vs-form marker adjacency rather than assuming comments are self-describing by type alone.
- Form state marker matching consumes only `F!` and `F` comments, and `F!` means the marker should use the `formState` passed to `hydrateRoot`.

Fast React implication: a future `HydrationHost` trait should not return generic booleans. It needs typed match results like `MatchedElement`, `MatchedText`, `MatchedSuspenseBoundary`, `MatchedActivityBoundary`, `MatchedFormStateMarker`, and mismatch/skip diagnostics.

## Mismatch diagnostics and recoverable errors

React DOM has two mismatch classes:

- Fatal hydration mismatches: the reconciler creates a hydration mismatch error, queues it through `queueHydrationError`, throws an internal `HydrationMismatchException`, and falls back to client rendering for that tree.
- Dev-only successful-hydration warnings: DOM props/text can differ even when hydration succeeds. React records diffs and later logs that attributes did not match and "won't be patched up."

Important details:

- `hydrateInstance` precaches the fiber on the DOM element, stores current props, and delegates prop hydration to DOM component logic. Returning false triggers hydration mismatch.
- `hydrateTextInstance` precaches the fiber on the text node and delegates text hydration. Returning false triggers a text hydration mismatch.
- `diffHydratedPropsForDevWarnings` and `diffHydratedTextForDevWarnings` feed a dev diff tree. `suppressHydrationWarning` suppresses text diff warnings for children of that host component.
- `validateHydratableInstance` and `validateHydratableTextInstance` use DOM nesting validation before mismatch reporting.
- Recoverable errors are ultimately reported during commit via the root's `onRecoverableError(error, { componentStack })`. The old `errorInfo.digest` accessor warns; digest now belongs on the Error instance.
- If a Suspense or Activity boundary abandons hydration and client-renders after queued hydration errors, those errors are attached to prior boundary state and logged through commit/profiling paths.

Fast React implication: mismatch handling should be structured data, not string-only diagnostics. The implementation needs an internal mismatch exception path, a recoverable error queue, dev diff data, and root callback delivery.

## Dehydrated boundaries

Suspense and Activity boundaries are not ordinary comments:

- Initial claim stores a dehydrated boundary handle in `memoizedState` with tree context and a retry lane.
- The reconciler creates a dehydrated fragment fiber so deletion and host sibling logic can reason about the boundary as a single child.
- Pending Suspense boundaries can delay hydration and register retry callbacks; fallback/client-rendered states change scheduling behavior.
- `commitHydratedContainer`, `commitHydratedActivityInstance`, and `commitHydratedSuspenseInstance` call `retryIfBlockedOn` so queued events, explicit hydration targets, and form replays can continue.
- `onHydrated` callbacks are fired for Activity/Suspense once a previously dehydrated boundary reaches `memoizedState === null`, when the feature flag is enabled.
- `onDeleted` callbacks are fired before clearing a dehydrated boundary, when enabled.

Boundary operations owned by the DOM host:

- `clearSuspenseBoundary` and `clearActivityBoundary` remove the start comment, all enclosed nodes, and the matching end comment while tracking nested Activity/Suspense depth.
- Container variants resolve the correct parent for `Document`, `HTML`, comment containers, and normal element/document-fragment containers.
- Clearing a boundary also reacts to Fizz preamble contribution markers (`html`, `head`, `body`) by releasing singleton instances, and clears `<head>` when necessary.
- `hideDehydratedBoundary` hides a Suspense boundary by stashing element `display` styles and clearing text node values until the matching end marker.
- `unhideDehydratedBoundary` restores stashed display/text. The source type accepts Suspense or Activity, but the traversal is Suspense-marker-oriented; Fast React should validate Activity visibility behavior against React before implementing.

Fast React implication: boundary clear/hide/unhide should be host operations with opaque boundary handles. The core should request these operations from commit effects; it should not know DOM comments, styles, or text node mutation details.

## Event replay and explicit hydration targets

Hydration events are part of correctness, not an optional event-system layer:

- `hydrateRoot` installs all supported delegated events immediately.
- `findInstanceBlockingEvent` maps a native event target to the closest React fiber. It can return a dehydrated Suspense boundary, Activity boundary, or dehydrated root container as the blocker.
- Continuous events such as focus, drag, mouse, and pointer over/out are queued. Queueing attempts continuous hydration for the blocking boundary and replays a cloned native event after the blocker is unblocked.
- Capture-phase discrete events requiring hydration, including click, key, input, change, reset, pointer, touch, composition, copy/cut/paste, and similar events, synchronously attempt hydration before dispatch. If still blocked, propagation is stopped to avoid double dispatch.
- Non-replayable blocked events are dispatched without a target so tracing/plugin paths can still observe them.
- `queueExplicitHydrationTarget(target)` records `{ target, priority, blockedOn }`, sorted by current event priority, and attempts hydration at that priority for the nearest Suspense or Activity boundary.
- `retryIfBlockedOn(unblocked)` clears matching blockers, reattempts explicit hydration targets in priority order, schedules replay callbacks, and handles document-level form action replay queues.
- `flushHydrationEvents` synchronously flushes event replay when hydration-change replay is enabled.

Fast React implication: worker 041's event-priority plan should own the general DOM event system, but hydration implementation must reserve the replay queue and blocked-target hooks. A hydration implementation that attaches events only after full hydration will miss selective hydration semantics.

## Fizz marker compatibility contract

Client hydration must parse React DOM Fizz 19.2.6 markers exactly. Server/Fizz work owns generating these markers; hydration owns recognizing and acting on them.

| Meaning | Serialized marker | DOM comment data / companion node | Hydration behavior |
| --- | --- | --- | --- |
| Activity start | `<!--&-->` | `&` | Claims Activity dehydrated boundary. |
| Activity end | `<!--/&-->` | `/&` | Ends Activity boundary traversal/clear depth. |
| Completed Suspense start | `<!--$-->` | `$` | Claims Suspense boundary with available content. |
| Pending Suspense start | `<!--$?--><template id="..."></template>` | `$?` plus placeholder template | Pending boundary; Fizz runtime may complete later. |
| Queued Suspense start | set by runtime to `$~` | `$~` | Boundary completion queued for reveal; retry waits on runtime. |
| Client-rendered Suspense start | `<!--$!--><template ...>` | `$!` plus error detail template | Client-rendered/fallback boundary; error details can include digest/message/stack/component stack. |
| Suspense end | `<!--/$-->` | `/$` | Ends Suspense boundary traversal/clear depth. |
| Matching form state marker | `<!--F!-->` | `F!` | `useActionState` should use root `formState`. |
| Non-matching form state marker | `<!--F-->` | `F` | Root `formState` does not match this marker. |
| Preamble head contribution | `<!--head-->` | `head` | Clearing boundary releases/clears affected singleton head state. |
| Preamble body contribution | `<!--body-->` | `body` | Clearing boundary releases body singleton state. |
| Preamble html contribution | `<!--html-->` | `html` | Clearing boundary releases document element singleton state. |

Fizz runtime compatibility notes:

- `$RC` schedules completed boundary replacement and mutates the previous boundary comment to `$~` while queued.
- `$RV` replaces the old boundary contents with completed segment children, sets the start marker back to `$`, and calls `_reactRetry` on the comment when present.
- `$RX` marks a boundary `$!`, writes digest/message/stack/component-stack data attributes on the adjacent template, and invokes `_reactRetry`.
- Form replay runtime queues form submissions on `ownerDocument.$$reactFormReplay`; hydration `retryIfBlockedOn` drains that queue when relevant targets hydrate.
- Segment placeholders use `<template id="..."></template>` and completed segment instructions move template children into the placeholder location. Hydration should not generate these, but must tolerate the DOM shape they produce.

Fast React implication: add marker oracles before implementing hydration. Marker compatibility should be byte/DOM-node exact, including comment `data`, adjacent template attributes, nested depth behavior, and runtime-mutated `$~`/`$!` states.

## Separation from related systems

Keep hydration separate from these systems while documenting contracts:

- Generic `createRoot`: shares container validation, root error callbacks, delegated event setup, and root object `render`/`unmount`, but it does not create a dehydrated root, claim hydratable nodes, expose `unstable_scheduleHydration`, or consume Fizz markers.
- DOM mutation rendering: hydration eventually falls back to normal placement/update/delete when a subtree client-renders, but initial matching and boundary operations are separate host capability methods.
- DOM events: event priority and plugin dispatch are general DOM renderer work; hydration requires blocked-target detection, replay queues, and explicit target scheduling hooks into that event system.
- Server/Fizz output generation: Fizz emits the markers, scripts, resource hints, form replay runtime, and preamble/singleton markers. Client hydration only consumes that output and must not duplicate the server renderer.
- Resources/singletons/forms: hydration touches all three through matching heuristics, tail deletion exceptions, preamble contribution cleanup, and form markers. Their full behavior still belongs to dedicated DOM/Fizz/resource work.

## Recommended implementation slices

These are future non-overlapping scopes. They deliberately avoid mixing facade, core, DOM host, event, and Fizz work.

1. Hydration source/oracle inventory
   - Write scope: `tests/conformance/**`, `worker-progress/worker-hydration-oracle.md`.
   - Task: build deterministic React DOM 19.2.6 hydration marker/matching oracles using the published tarball and small DOM fixtures. Cover marker comment data, text/element matching, hidden inputs, form markers, Suspense/Activity markers, mismatch warnings, and `hydrateRoot` export shape. No Fast React implementation.

2. Host-config hydration capability traits
   - Write scope: `crates/fast-react-host-config/**`, `worker-progress/worker-host-hydration-traits.md`.
   - Task: add typed `HydrationHost` capability interfaces and error/result types only. Include traversal, match, hydrate, diff, validate, clear, hide/unhide, commit-hydrated, flush-events, and form marker methods. Do not touch reconciler logic.

3. Reconciler hydration state skeleton
   - Write scope: `crates/fast-react-core/**`, `crates/fast-react-reconciler/**`, `worker-progress/worker-reconciler-hydration-state.md`.
   - Task: add root dehydrated state, boundary dehydrated state, hydration cursor scaffolding, retry-lane storage, mismatch/recoverable error queues, and flags. Compile-only or unit-test with a fake hydration host; no DOM package code.

4. DOM marker parser and boundary operations
   - Write scope: future DOM adapter package paths such as `packages/react-dom/**` or `crates/fast-react-dom/**`, plus `tests/conformance/**`, `worker-progress/worker-dom-hydration-markers.md`.
   - Task: implement DOM marker recognition and boundary clear/hide/unhide over a DOM abstraction. Cover nested boundary depth and preamble contribution cleanup. Do not implement root facade or event replay.

5. `hydrateRoot` facade and root object behavior
   - Write scope: `packages/react-dom/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-react-dom-hydrate-root-facade.md`.
   - Task: after package scaffolding and client-root model exist, implement option parsing, root object shape, unsupported/partial errors as needed, `unstable_scheduleHydration` plumbing, and root callback storage. Do not implement DOM matching in the facade.

6. Hydration event replay integration
   - Write scope: future DOM event adapter paths, `tests/conformance/**`, `worker-progress/worker-dom-hydration-event-replay.md`.
   - Task: after worker 041/event infrastructure, add blocked-target detection, continuous/discrete replay queues, explicit hydration target priority sorting, and `retryIfBlockedOn` integration. Do not modify generic scheduler lanes beyond agreed hooks.

7. Fizz marker compatibility handoff
   - Write scope: `worker-progress/worker-fizz-hydration-contract.md` or server/Fizz implementation paths once assigned.
   - Task: reconcile this marker table with worker 042 and any server/static implementation plan. Add tests that server output can be consumed by client hydration without marker translation.

## Quality, maintainability, performance, and security review

Quality:

- The plan ties every hydration requirement to React DOM 19.2.6 source or published tarball evidence.
- Hydration, generic client roots, DOM mutation rendering, events, and Fizz output are separated by ownership and write scope.

Maintainability:

- Typed hydration match results and capability traits avoid fake no-op host methods.
- The recommended slices give future workers concrete non-overlapping scopes and clear dependencies.

Performance:

- Selective hydration, event replay, and boundary retry lanes are called out early because a full-root synchronous hydration fallback would be simpler but would miss React DOM behavior and harm interactivity.
- DOM matching heuristics for root/singleton/hoistable nodes should stay host-owned so the reconciler hot path can remain handle-based and renderer-generic.

Security:

- Hydration must not parse or generate HTML strings in the client path. It should inspect DOM nodes and structured attributes.
- Fizz error detail attributes, form replay queues, resource/singleton markers, and preamble cleanup are security-sensitive because they interact with serialized server content, forms, scripts/styles, and document singletons.
- Future tests should include injected third-party/extension DOM nodes, hidden form fields, script/style/link heuristics, and malicious-looking but already-escaped Fizz attributes.

## Risks and blockers

- Worker 042 was unavailable, so this report's Fizz/server contract must be reconciled with that worker before implementation.
- `hydrateRoot` implementation is blocked on client-root infrastructure, reconciler scheduling, DOM mutation host operations, and event priority infrastructure.
- Event replay depends on worker 041 or equivalent DOM event infrastructure.
- DOM hydration matching depends on resources/singletons/forms semantics; implementing only element/text matching would create false confidence.
- Activity boundary visibility behavior needs a dedicated oracle because source types and traversal details are less obvious than Suspense.
- Published tarball code is bundled and source tag code is clearer; future conformance should keep both as evidence but treat npm tarball behavior as the public artifact.

## Commands run

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/**' -g 'package.json' -g 'pnpm-lock.yaml' -g 'yarn.lock' -g 'package-lock.json'
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md
sed -n '260,520p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,320p' worker-progress/worker-033-react-dom-inventory.md
sed -n '320,760p' worker-progress/worker-033-react-dom-inventory.md
test -f worker-progress/worker-042-react-dom-server-fizz-plan.md && sed -n '1,260p' worker-progress/worker-042-react-dom-server-fizz-plan.md || true
for p in worker-progress/worker-042-react-dom-server-fizz-plan.md ../fast-react-worker-042-react-dom-server-fizz-plan/worker-progress/worker-042-react-dom-server-fizz-plan.md; do if test -f "$p"; then printf '%s\n' "$p"; fi; done
node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name, workspaces:p.workspaces, scripts:p.scripts}, null, 2))"
node -e "const inv=require('./tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json'); console.log(JSON.stringify({reactDom: inv.packages && inv.packages['react-dom']}, null, 2).slice(0,4000))"
node -p "JSON.stringify({react:require('./node_modules/react/package.json').version, reactDom:require('./node_modules/react-dom/package.json').version, reactDomPath:require.resolve('react-dom/package.json')}, null, 2)"
git status --short
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/package.json | node -e "let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{const p=JSON.parse(s); console.log(JSON.stringify({name:p.name, version:p.version, main:p.main, exports:p.exports, dependencies:p.dependencies, peerDependencies:p.peerDependencies}, null, 2));})"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | rg -n "exports.hydrateRoot|hydrateRoot = function|createHydrationContainer|unstable_scheduleHydration|queueExplicitHydrationTarget|onRecoverableError|formState|listenToAllSupportedEvents" -C 2
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | rg -n "\\$\\?|\\$~|\\$!|F!|Hydration failed|queueExplicitHydrationTarget|retryIfBlockedOn|isDiscreteEventThatRequiresHydration|clearSuspenseBoundary|clearActivityBoundary|hideDehydratedBoundary|unhideDehydratedBoundary" -C 1
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-server.node.development.js | rg -n "<!--\\$|<!--/\\$|<!--&|<!--/&|<!--F|data-dgst|data-msg|data-stck|data-cstck|\\$RC|\\$RX|\\$RB" -C 1
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | rg -n "hydrateRoot|createHydrationContainer|options|onRecoverableError|formState|unstable_scheduleHydration|listenToAllSupportedEvents|markContainerAsRoot" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '260,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRoot.js | sed -n '150,330p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '320,575p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | sed -n '1,230p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | sed -n '230,540p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | sed -n '540,910p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCompleteWork.js | rg -n "prepareToHydrateHostInstance|prepareToHydrateHostTextInstance|prepareToHydrateHostActivityInstance|prepareToHydrateHostSuspenseInstance|popHydrationState|upgradeHydrationErrorsToRecoverable|commitHydrated|Hydrating|DidCapture" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCommitHostEffects.js | rg -n "commitHydrated|hideDehydratedBoundary|unhideDehydratedBoundary|clearSuspenseBoundary|clearActivityBoundary|clearContainer|commitHostHydrated|commitHostRemoveChild|retryIfBlockedOn|Hydrating" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '1780,1865p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCommitWork.js | sed -n '1550,1590p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | rg -n "recoverableErrors|onRecoverableError|queueRecoverableErrors|RootDidRecoverFromError|makeErrorInfo" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberShellHydration.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '1,140p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '140,230p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg -n "SUSPENSE_START_DATA|SUSPENSE_END_DATA|SUSPENSE_PENDING_START_DATA|SUSPENSE_FALLBACK_START_DATA|SUSPENSE_QUEUED_START_DATA|ACTIVITY_START_DATA|ACTIVITY_END_DATA|FORM_STATE_IS_MATCHING|PREAMBLE_CONTRIBUTION" -C 2
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '1150,1345p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '3520,4225p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '120,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | sed -n '260,620p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | sed -n '620,820p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMUpdateBatching.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '60,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '2268,2290p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '4550,4698p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '4850,5015p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | rg -n "htmlPreambleContributionChunk|headPreambleContributionChunk|bodyPreambleContributionChunk|PREAMBLE_CONTRIBUTION|<!--html-->|<!--head-->|<!--body-->" -C 2
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings.js | sed -n '1,260p'
rg -n '/private/v[a]r|/var/f[o]lders|/t[m]p/' worker-progress/worker-043-react-dom-hydration-plan.md || true
git diff --check -- worker-progress/worker-043-react-dom-hydration-plan.md
git diff --check --no-index /dev/null worker-progress/worker-043-react-dom-hydration-plan.md; rc=$?; if [ "$rc" -gt 1 ]; then exit "$rc"; fi; exit 0
rg -n 'hydrateRoot|Hydratable|Suspense|Activity|form marker|mismatch|recoverable|hideDehydrated|unhideDehydrated|clearSuspense|event replay|explicit hydration|Fizz|createRoot|Commands run|Changed files|Risks|Quality|Security|worker 042|subagents' worker-progress/worker-043-react-dom-hydration-plan.md
```

Notes:

- The `node_modules` version check failed because this worktree does not have local `node_modules`; package evidence came from checked-in inventory and read-only npm tarball/source fetches.
- No source tests were run because this worker changed only a report.

## Verification

Verification performed before handoff:

- Report checked for concrete evidence and required hydration topics.
- No concrete local temporary paths were recorded.
- No files outside the assigned write scope were intentionally modified.
- Follow-up worker scopes are concrete and non-overlapping.

## Changed files

- `worker-progress/worker-043-react-dom-hydration-plan.md`

## Unresolved follow-up tasks

- Reconcile this report with worker 042 when that server/Fizz plan becomes available.
- Add deterministic hydration marker and matching oracles before implementing code.
- Align with worker 040 for DOM mutation host operations, worker 041 for event priority/replay infrastructure, worker 044 for client roots, and worker 035/036/037 for package/export/type scaffolding.
