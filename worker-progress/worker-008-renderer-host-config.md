# Summary

Fast React should expose a capability-based renderer host boundary, not a DOM-shaped adapter and not a single giant mandatory trait. React 19.2.6 host integration covers instance creation, text handling, mutation, persistence, hydration, portals, event/update priority, commit suspension, resources, singletons, forms, view transitions, DevTools, and test selectors. The Rust core can stay renderer-independent only if host instances and containers remain opaque and renderer capabilities are explicit.

The main breaking recommendation is to avoid promising compatibility with the unstable `react-reconciler` custom renderer ABI as the first public contract. Fast React should first stabilize an internal Rust trait boundary and later layer a JS `react-reconciler` compatibility adapter over it if needed. This is a breaking choice for third-party renderers, but it removes the root cause of renderer leakage: React's current JS host config object mixes multiple platform concerns into one experimental interface.

# Objective

Define the renderer host-config boundary Fast React should expose, with attention to React reconciler host config methods, DOM versus native renderer needs, mutation/persistence/hydration modes, portals, events, and how to keep the Rust core renderer-independent.

Write scope honored: only this file, `worker-progress/worker-008-renderer-host-config.md`, was written.

# Sources and commands used

Local sources read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-008-renderer-host-config.prompt.md`
- `worker-progress/README.md`

Primary upstream sources:

- React reconciler custom host config shim, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-reconciler/src/forks/ReactFiberConfig.custom.js
- React DOM host config, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js
- React Native classic host config, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-native-renderer/src/ReactFiberConfigNative.js
- React Native Fabric host config, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-native-renderer/src/ReactFiberConfigFabric.js
- React test renderer host config, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-test-renderer/src/ReactFiberConfigTestHost.js
- React reconciler README, pinned to React `v19.2.6`: https://github.com/facebook/react/blob/v19.2.6/packages/react-reconciler/README.md
- React hydration context and commit host effects source, pinned to React `v19.2.6`:
  - https://github.com/facebook/react/blob/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js
  - https://github.com/facebook/react/blob/v19.2.6/packages/react-reconciler/src/ReactFiberCommitHostEffects.js
  - https://github.com/facebook/react/blob/v19.2.6/packages/react-reconciler/src/ReactFiberCompleteWork.js

Commands run directly in this worker:

- `pwd && ls`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files -g '!ORCHESTRATOR.md'`
- `find worker-progress -maxdepth 2 -type f | sort`
- `find docs -maxdepth 3 -type f | sort`
- `git status --short`
- `sed -n '1,220p' docs/tasks/worker-008-renderer-host-config.prompt.md`
- `sed -n '1,180p' worker-progress/README.md`
- `find . -maxdepth 2 -type d | sort`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/forks/ReactFiberConfig.custom.js | sed -n '1,260p'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/forks/ReactFiberConfig.custom.js | sed -n '261,520p'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/forks/ReactFiberConfig.custom.js | rg '^export const|^export opaque type|^export type' | sed -E 's/export (const|opaque type|type) ([A-Za-z0-9_]+).*/\2/'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg '^export (const|function|let|var)'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-native-renderer/src/ReactFiberConfigFabric.js | rg '^export (const|function|let|var)'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-native-renderer/src/ReactFiberConfigNative.js | rg '^export (const|function|let|var)'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-test-renderer/src/ReactFiberConfigTestHost.js | rg '^export (const|function|let|var)'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/README.md | sed -n '1,260p'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/README.md | sed -n '260,560p'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCompleteWork.js | rg 'createInstance|appendInitialChild|finalizeInitialChildren|hydrateInstance|prepareToHydrate|shouldSetTextContent|bubbleProperties|markUpdate'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberCommitHostEffects.js | rg 'commitUpdate|commitTextUpdate|appendChild|insertBefore|removeChild|replaceContainerChildren|resetTextContent|hideInstance|unhideInstance|clearContainer|commitMount'`
- `curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberHydrationContext.js | rg 'canHydrate|getFirstHydratable|getNextHydratable|hydrate|Hydratable|clearSuspense|clearActivity|diffHydrated|validateHydratable|flushHydrationEvents'`
- `curl -fsSL https://registry.npmjs.org/react/latest | node -e "..."`
- `curl -fsSL https://registry.npmjs.org/react-dom/latest | node -e "..."`
- `curl -fsSL https://registry.npmjs.org/react-reconciler/latest | node -e "..."`
- `rg '^# ' worker-progress/worker-008-renderer-host-config.md`
- `wc -l worker-progress/worker-008-renderer-host-config.md`
- `sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '261,380p' worker-progress/worker-008-renderer-host-config.md`
- `rg 'Changed files|Commands run|Unresolved risks|Quality review|Maintainability review|Performance review|Security review|Scope review' worker-progress/worker-008-renderer-host-config.md`

Delegated checks:

- Nested explorer 1 inventoried React 19-era host config methods from local docs, `react-reconciler@0.33.0` npm metadata, and React host config sources. It confirmed `react-reconciler@0.33.0` is the latest reconciler package for the React 19.2 line and recommended capability traits rather than a monolithic trait.
- Nested explorer 2 inspected local planning files, avoided `ORCHESTRATOR.md`, and tested the renderer-independence hypothesis. It concluded the hypothesis is viable only if renderer instances are opaque and hydration, event priority, resources, and singletons are first-class host capabilities.

Version checks observed:

- `react` latest: `19.2.6`
- `react-dom` latest: `19.2.6`
- `react-reconciler` latest: `0.33.0`

# Host-config method inventory

React's custom host config shim exports opaque host types plus a large method/capability surface. The inventory below is grouped by concern rather than by file order because that maps better to Rust traits.

Associated host-owned types:

- `Type`, `Props`, `Container`, `Instance`, `TextInstance`, `ActivityInstance`, `SuspenseInstance`, `HydratableInstance`, `PublicInstance`, `HostContext`, `UpdatePayload`, `ChildSet`, `TimeoutHandle`, `NoTimeout`, `RendererInspectionConfig`, `TransitionStatus`, `FormInstance`, `SuspendedState`, `RunningViewTransition`, `ViewTransitionInstance`, `InstanceMeasurement`, `EventResponder`, `GestureTimeline`, `FragmentInstanceType`, `HoistableRoot`, `Resource`.

Renderer identity, context, creation, and basic commit:

- `rendererVersion`, `rendererPackageName`, `extraDevToolsConfig`
- `getPublicInstance`
- `getRootHostContext`, `getChildHostContext`
- `prepareForCommit`, `resetAfterCommit`
- `createInstance`, `cloneMutableInstance`
- `appendInitialChild`
- `finalizeInitialChildren`
- `shouldSetTextContent`
- `createTextInstance`, `cloneMutableTextInstance`
- `scheduleTimeout`, `cancelTimeout`, `noTimeout`
- `isPrimaryRenderer`, `warnsIfNotActing`
- `detachDeletedInstance`
- `bindToConsole`
- `resetFormInstance`

Scheduling, event priority, microtasks, and commit suspension:

- `setCurrentUpdatePriority`, `getCurrentUpdatePriority`, `resolveUpdatePriority`
- `trackSchedulerEvent`, `resolveEventType`, `resolveEventTimeStamp`
- `shouldAttemptEagerTransition`
- `supportsMicrotasks`, `scheduleMicrotask`
- `requestPostPaintCallback`
- `maySuspendCommit`, `maySuspendCommitOnUpdate`, `maySuspendCommitInSyncRender`
- `preloadInstance`
- `startSuspendingCommit`, `suspendInstance`, `suspendOnActiveViewTransition`, `waitForCommitToBeReady`, `getSuspendedCommitReason`
- `NotPendingTransition`, `HostTransitionContext`

Portal, scope, and event-system bridging:

- `preparePortalMount`
- `getInstanceFromNode`
- `beforeActiveInstanceBlur`, `afterActiveInstanceBlur`
- `prepareScopeUpdate`, `getInstanceFromScope`

Mutation-mode methods:

- `supportsMutation`
- `appendChild`, `appendChildToContainer`
- `insertBefore`, `insertInContainerBefore`
- `removeChild`, `removeChildFromContainer`
- `commitMount`, `commitUpdate`, `commitTextUpdate`
- `resetTextContent`, `clearContainer`
- `hideInstance`, `hideTextInstance`, `unhideInstance`, `unhideTextInstance`

Persistence-mode methods:

- `supportsPersistence`
- `cloneInstance`
- `createContainerChildSet`
- `appendChildToContainerChildSet`
- `finalizeContainerChildren`
- `replaceContainerChildren`
- `cloneHiddenInstance`, `cloneHiddenTextInstance`

Hydration methods:

- `supportsHydration`
- `getNextHydratableSibling`, `getNextHydratableSiblingAfterSingleton`
- `getFirstHydratableChild`, `getFirstHydratableChildWithinContainer`
- `getFirstHydratableChildWithinActivityInstance`
- `getFirstHydratableChildWithinSuspenseInstance`
- `getFirstHydratableChildWithinSingleton`
- `canHydrateInstance`, `canHydrateTextInstance`, `canHydrateActivityInstance`, `canHydrateSuspenseInstance`
- `hydrateInstance`, `hydrateTextInstance`, `hydrateActivityInstance`, `hydrateSuspenseInstance`
- `getNextHydratableInstanceAfterActivityInstance`
- `getNextHydratableInstanceAfterSuspenseInstance`
- `commitHydratedInstance`, `commitHydratedContainer`, `commitHydratedActivityInstance`, `commitHydratedSuspenseInstance`
- `finalizeHydratedChildren`
- `flushHydrationEvents`
- `isSuspenseInstancePending`, `isSuspenseInstanceFallback`
- `getSuspenseInstanceFallbackErrorDetails`
- `registerSuspenseInstanceRetry`
- `canHydrateFormStateMarker`, `isFormStateMarkerMatching`
- `clearActivityBoundary`, `clearSuspenseBoundary`
- `clearActivityBoundaryFromContainer`, `clearSuspenseBoundaryFromContainer`
- `hideDehydratedBoundary`, `unhideDehydratedBoundary`
- `shouldDeleteUnhydratedTailInstances`
- `diffHydratedPropsForDevWarnings`, `diffHydratedTextForDevWarnings`
- `describeHydratableInstanceForDevWarnings`
- `validateHydratableInstance`, `validateHydratableTextInstance`

Resources and singletons, mostly DOM-driven:

- `supportsResources`
- `isHostHoistableType`
- `getHoistableRoot`
- `getResource`, `acquireResource`, `releaseResource`
- `hydrateHoistable`, `mountHoistable`, `unmountHoistable`
- `createHoistableInstance`
- `prepareToCommitHoistables`
- `mayResourceSuspendCommit`, `preloadResource`, `suspendResource`
- `supportsSingletons`
- `resolveSingletonInstance`, `acquireSingletonInstance`, `releaseSingletonInstance`
- `isHostSingletonType`, `isSingletonScope`

View transitions and fragment-instance support:

- `applyViewTransitionName`, `restoreViewTransitionName`, `cancelViewTransitionName`
- `cancelRootViewTransitionName`, `restoreRootViewTransitionName`
- `cloneRootViewTransitionContainer`, `removeRootViewTransitionClone`
- `measureInstance`, `measureClonedInstance`
- `wasInstanceInViewport`, `hasInstanceChanged`, `hasInstanceAffectedParent`
- `startViewTransition`, `startGestureTransition`, `stopViewTransition`
- `getCurrentGestureOffset`
- `createViewTransitionInstance`
- `createFragmentInstance`
- `updateFragmentInstanceFiber`
- `commitNewChildToFragmentInstance`
- `deleteChildFromFragmentInstance`

Test selectors and diagnostics:

- `supportsTestSelectors`
- `findFiberRoot`
- `getBoundingRect`
- `getTextContent`
- `isHiddenSubtree`
- `matchAccessibilityRole`
- `setFocusIfFocusable`
- `setupIntersectionObserver`
- Hydration warning methods listed above are also diagnostic hooks.

# Mutation, persistence, and hydration implications

Mutation mode is the DOM-shaped path. The reconciler creates detached host instances during render, appends initial children while detached, and later mutates the mounted tree during commit with append, insert, remove, update, text update, hide/unhide, and clear-container calls. This mode should be the first Fast React implementation target because it supports a minimal test renderer and a DOM proof renderer with the smallest set of host semantics.

Persistence mode is not a cosmetic variation of mutation mode. Fabric-style persistent rendering clones host nodes or child sets and replaces root/container children rather than mutating the visible tree in place. A Rust boundary that treats persistence as "mutation with different method names" will leak implementation assumptions into the core. It needs an explicit `PersistenceHost` capability with clone and child-set operations, and the core commit path must branch by capability before it calculates host side effects.

Hydration is the largest compatibility trap. It is not just "find existing DOM node." It affects claiming nodes, matching text and element types, Suspense and Activity dehydrated boundaries, form state markers, singleton traversal, tail deletion decisions, recoverable errors, warning diffs, event replay, and boundary clearing. If Fast React postpones hydration without reserving the capability shape, later DOM support will require invasive fiber and commit changes.

Recommended mode policy:

- Exactly one of mutation or persistence should be selected for a root/renderer at initialization. Do not allow both by accidental default methods.
- Hydration should be an optional capability layered on top of mutation/persistence, but the core fiber state model must reserve dehydrated boundary state from the start.
- Capability absence should be explicit and fail early when a feature requires it. Fake no-op host methods hide incompatibilities.

# DOM renderer implications

React DOM uses mutation mode plus hydration, microtasks, resources, singletons, form reset, event priority, portal event setup, test selectors, and modern view-transition hooks.

DOM-specific requirements that must stay outside the Rust core:

- Element creation rules: namespace switching for HTML/SVG/MathML, owner document selection, custom elements, special cases for script/select/input/textarea/img, and DOM property setting.
- Event system: DOM event delegation, `listenToAllSupportedEvents` for roots and portals, mapping current browser events to React event/update priority, focus/blur active instance handling, and event timestamps.
- Hydration details: traversing existing DOM nodes/comments, matching Suspense markers, clearing dehydrated boundaries, warning about mismatches, and flushing hydration events.
- Resources and singletons: hoistable scripts/styles, `html`/`head`/`body` singletons, resource acquisition/release, and commit suspension while fonts/images/resources load.
- Form reset and controlled element behavior.
- Layout measurement and view transitions: bounding rects, viewport checks, CSS `view-transition-name`, cloned root containers, gesture transitions.

DOM root cause risk: if the Rust core knows about DOM nodes, tag namespaces, document resources, or event delegation, `react-native` and custom renderers become second-class. The core should only know that the host can create, compare, hide, hydrate, measure, or schedule through opaque handles.

# React Native or custom renderer implications

React Native has two relevant patterns:

- Classic React Native uses mutation mode and sends imperative operations through `UIManager`, including child insertion/removal/reordering and prop updates.
- Fabric uses persistence mode, clone operations, child sets, and replacement of mounted children.

Native/custom renderer requirements:

- Host instances may be numeric tags, native shadow-tree handles, JS objects, Rust arena IDs, or FFI handles. The core must treat them as opaque.
- Text support is renderer-specific. Native renderers usually restrict raw text under non-text parents; `shouldSetTextContent` and `createTextInstance` need host context validation.
- Event priority cannot be derived from `window.event`. Native renderers need host-provided current/update priority based on their event dispatcher.
- Portals may target non-DOM containers and should not imply DOM event listener installation. `preparePortalMount` must be a host hook, not a DOM call.
- Persistence support should not require DOM hydration/resource methods.
- Custom renderers need a small viable surface: identity/context/creation/scheduling plus either mutation or persistence. Hydration, resources, singletons, test selectors, and view transitions should be optional capabilities.

Root cause risk: a single required `HostConfig` trait would force native renderers to provide bogus DOM-only methods. Those stubs would become latent bugs when Suspense, transitions, hydration, or tests start calling them.

# Rust trait/interface recommendation

Use a small base trait plus capability traits. Keep host types associated and opaque.

Recommended shape:

- `HostTypes`: associated types for `Type`, `Props`, `Container`, `Instance`, `TextInstance`, `PublicInstance`, `HostContext`, `UpdatePayload`, `TimeoutHandle`, `ActivityInstance`, `SuspenseInstance`, `HydratableInstance`, `ChildSet`, `Resource`, `HoistableRoot`, `TransitionStatus`, `SuspendedState`, and diagnostic measurement types.
- `HostIdentityAndContext`: renderer name/version, primary renderer flag, public instance mapping, root and child host context.
- `HostCreation`: create instance/text, append initial child, clone mutable instance/text, finalize initial children, text-content optimization.
- `HostCommitCommon`: prepare/reset commit, commit mount/update/text update, reset text, hide/unhide, detach deleted instance, form reset.
- `HostScheduling`: timers, optional microtasks, post-paint callback, current/update priority, event type/time, eager transition decision, commit suspension lifecycle.
- `MutationHost`: append/insert/remove/clear container operations.
- `PersistenceHost`: clone instance, hidden clone, child-set creation, append to child set, finalize child set, replace container children.
- `HydrationHost`: hydratable traversal, can-hydrate checks, hydrate/commit hydrated instances, Suspense/Activity boundary operations, form markers, warning diffs, validation, hydration event flushing.
- `PortalHost`: prepare portal mount and any container-specific portal setup.
- `ResourceHost`: hoistable roots/resources, mount/hydrate/unmount hoistables, resource preloading and suspension.
- `SingletonHost`: singleton type checks and acquire/release lifecycle.
- `ViewTransitionHost`: view-transition naming, measurement, root clones, gesture/view transition lifecycle.
- `DiagnosticsHost`: DevTools config, test selector hooks, accessibility role matching, focus testing, text content extraction.

Implementation guidance:

- Prefer compile-time generic hosts for the Rust core's hot reconciliation paths. A thin dynamic dispatch layer can be added at JS/FFI boundaries if needed.
- Store host values as renderer-owned handles in fibers. Avoid making DOM/native object layout visible to the core.
- Represent capabilities as explicit root configuration. The core should select mutation, persistence, and hydration paths from capabilities rather than probing for optional methods at arbitrary call sites.
- Do not expose raw fiber internals to host renderers. React passes internal handles to host configs, but the Rust API should expose only stable opaque handles or callback tokens.
- Keep update payload calculation host-owned. DOM prop diffing, native prop diffing, and custom renderer prop diffing differ enough that a generic core diff would become renderer code in disguise.
- Reserve fiber state for dehydrated Suspense/Activity boundaries, portals, refs, visibility, and host effect flags even before all capabilities are implemented.

# Major risks and root causes

- Under-sized boundary: the root cause is treating host config as append/remove/update only. React 19.2.6 host config also owns scheduling hooks, hydration, event priority, resources, singletons, view transitions, and diagnostics.
- Hydration late-add risk: hydration changes fiber state, begin/complete work, commit behavior, Suspense/Activity semantics, and recoverable error reporting. It cannot be patched onto a mutation-only core cleanly.
- DOM leakage: DOM namespaces, event delegation, resource hoisting, CSS view transitions, and form behavior are tempting to encode in core because DOM is the first likely public renderer. That would break native/custom renderers.
- Persistence mismatch: Fabric's persistent tree model requires clone and child-set semantics. Forcing it through mutation mode would measure a different architecture than React Native Fabric actually uses.
- Event priority leakage: lane scheduling is core-owned, but current event/update priority is host-observed. The boundary must let the host report priority without giving it lane internals.
- Experimental ABI instability: React's `react-reconciler` README explicitly warns the custom renderer API is unstable and outside the normal React versioning guarantees. Fast React should not freeze that exact JS object as its internal Rust contract.
- Rust ownership cycles: fibers, alternates, refs, portals, host back-pointers, deletions, and effects create cyclic mutable graphs. Host handles should be arena IDs or renderer-managed references, with phase-scoped mutation.
- Security risk at the DOM adapter: HTML insertion, script/style resources, custom elements, and event replay must preserve React DOM escaping and property-setting semantics. The core should not accept raw HTML policies as generic behavior.
- Performance risk: excessive dynamic dispatch or JS callbacks in hot host operations could erase Rust speedups. Keep hot paths monomorphized where possible and batch FFI operations at renderer adapters.
- Maintainability risk: fake no-op optional methods make unsupported modes appear to work until a feature path calls them. Capability negotiation should be explicit and tested.

# Proposed follow-up implementation tasks

1. Generate a pinned host-config manifest from React `v19.2.6` source and `react-reconciler@0.33.0`, then check it into the future conformance docs so drift is reviewable.
2. Define `HostTypes` and base host traits in the scaffold plan, but keep them internal until a minimal test renderer proves the shape.
3. Implement a minimal mutation-mode test renderer first, with no DOM assumptions, to exercise create/update/delete/text/portal/visibility paths.
4. Add a capability-negotiation test matrix: mutation-only, persistence-only, mutation+hydration, DOM resources/singletons enabled, and unsupported-feature failure cases.
5. Reserve fiber state and flags for hydration, Suspense/Activity dehydrated boundaries, portals, visibility, refs, and host effect flags before DOM hydration work starts.
6. Design DOM prop diffing and native prop diffing as renderer-owned update payload builders.
7. Specify event priority handoff between renderer adapters and the core scheduler, including discrete, continuous, default, and transition-triggered work.
8. Prototype a Fabric-like persistence renderer separately from DOM so persistence does not regress into mutation assumptions.
9. Defer public third-party `react-reconciler` JS compatibility until after the Rust trait boundary has a test renderer and DOM/native proofs.
10. Add security-focused DOM adapter tests for `dangerouslySetInnerHTML`, script/style resource handling, custom elements, hydration mismatch recovery, and event replay.

# Completion checklist

- Objective covered: host-config boundary recommendation is documented above.
- Required section `Objective`: present.
- Required section `Sources and commands used`: present, including local files, upstream sources, commands, version checks, and delegated checks.
- Required section `Host-config method inventory`: present and grouped by concern.
- Required section `Mutation, persistence, and hydration implications`: present.
- Required section `DOM renderer implications`: present.
- Required section `React Native or custom renderer implications`: present.
- Required section `Rust trait/interface recommendation`: present.
- Required section `Major risks and root causes`: present.
- Required section `Proposed follow-up implementation tasks`: present.
- Required section `Completion checklist`: present.
- Handoff summary: Fast React should use opaque host handles and explicit capability traits; mutation mode should be first, persistence and hydration must be designed up front, and DOM-specific resources/events/singletons must stay out of core.
- Changed files: `worker-progress/worker-008-renderer-host-config.md`.
- Commands run: listed in `Sources and commands used`.
- Delegated subagent results: two nested explorers were used; both results are summarized in `Sources and commands used` and reflected in the recommendations.
- Unresolved risks/follow-up tasks: listed in `Major risks and root causes` and `Proposed follow-up implementation tasks`.
- Quality review: recommendation avoids a monolithic trait, separates optional capabilities, and documents the breaking API choice.
- Maintainability review: capability traits make unsupported renderer features explicit and reduce fake no-op host methods.
- Performance review: recommendation preserves generic monomorphized hot paths and warns against excessive JS/FFI callbacks.
- Security review: DOM security-sensitive behavior is isolated to the DOM adapter and called out for dedicated tests.
- Scope review: no project code was implemented, and no files outside this worker progress report were modified.
