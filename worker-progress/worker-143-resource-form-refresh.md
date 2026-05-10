# Worker 143: Resource/Form Boundary Refresh

## Goal Evidence

- `create_goal` created active goal `019e0f9f-4851-7ae2-ad6a-41026200e7a3`.
- Objective: Produce a report-only refresh for DOM resources, form actions, controlled inputs, singletons, and related boundaries so they do not leak into the first root render milestone.
- `get_goal` confirmed status `active` for the same objective.
- `WORKER_BRIEF.md` was read after goal setup. `ORCHESTRATOR.md` was not read.

## Status

- Complete after final verification and `update_goal(status: "complete")`.

## Summary

The first real root-render milestone must stay limited to non-hydration client
roots, HostRoot update enqueueing, scheduler flush, minimal host/text complete
work, mutation commit, `root.current` switch, update, and unmount cleanup.
Resource hints, render-time hoistables, singletons, client form actions,
controlled form controls, form reset, and event-driven controlled restore must
remain out of scope for that milestone.

The current repository already has the right boundary vocabulary:
`HostCapability::Forms`, `HostCapability::Resources`,
`HostCapability::Singletons`, `ResourceHost`, `SingletonHost`,
`reset_form_instance`, `HostHoistable`, `HostSingleton`, root `form_state`
handles, and React DOM private dispatcher placeholders. Those should be
reserved as adapter hooks, not wired into first root render.

## Current Evidence

Required context read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-059-react-dom-resource-hints-oracle.md`
- `worker-progress/worker-060-react-dom-form-actions-oracle.md`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`

Additional anchoring context read:

- `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-121-root-render-e2e-oracle.md`
- `worker-progress/worker-122-dom-container-listener-shell.md`
- Current `packages/react-dom` placeholders and private container/listener
  shell modules.
- React 19.2.6 reference source under the local clone for
  `ReactDOMFloat.js`, `ReactDOMFormActions.js`,
  `ReactDOMSharedInternals.js`, controlled input/select/textarea helpers,
  `inputValueTracking.js`, `ReactDOMControlledComponent.js`, and
  `ReactFiberConfigDOM.js` resource/singleton/form hooks.

Important facts:

- `packages/react-dom/index.js` and `packages/react-dom/profiling.js` still
  expose resource/form APIs as loud unsupported placeholders; the private
  internals object exposes placeholder dispatcher methods `D`, `C`, `L`, `m`,
  `X`, `S`, `M`, and `r`.
- `packages/react-dom/client.js` still exports unsupported `createRoot` and
  `hydrateRoot`.
- `packages/react-dom/src/client/**` and `src/events/**` currently contain
  private container validation, root-marker, and listener shell helpers only.
  They do not dispatch events, restore controls, submit forms, mutate root
  children, hydrate, or manage resources.
- The checked oracles all keep Fast React compatibility claims false:
  resource hints cover five scenarios and no DOM/server rendering effects;
  form actions cover six rootless/server scenarios and no client-owned success
  path; controlled input covers 25 fake-DOM scenarios and no browser/user
  input, native reset, hydration, or event replay behavior.
- The local root e2e oracle for React DOM 19.2.6 covers the minimal root
  render/update/unmount path and explicitly keeps hydration, events, forms,
  Suspense, hooks, and broader browser behavior separate.

## Out Of Scope For Minimal Root Render

These surfaces must not be enabled by the first root-render implementation:

| Surface | Keep Out Of First Milestone |
| --- | --- |
| Public resource hint APIs | `prefetchDNS`, `preconnect`, `preload`, `preloadModule`, `preinit`, and `preinitModule` should remain unsupported/no-claim until DOM insertion, dedupe, global-document fallback, and dispatcher behavior are gated. |
| Render-time resources and hoistables | Do not classify `link`, `meta`, `title`, qualifying `style`, or async `script` as `HostHoistable`; do not create/acquire/release/preload resources; do not suspend commit on stylesheets or images. |
| Singletons | Do not classify `html`, `head`, or `body` as `HostSingleton`; do not resolve/acquire/release document singletons, clear singleton attributes, or manage singleton scope. |
| Form actions and status | Do not enable React-owned form action submission, `requestFormReset` success, `useFormStatus` pending state, `useFormState` client transitions, `FormData` mutation, or pending host transition context. |
| Controlled inputs | Do not claim input/select/textarea controlled semantics, value tracking, read-only warning parity, radio group repair, default-value reset behavior, or post-event controlled restore. |
| Native form reset and browser behavior | Do not claim browser validation, autofill, focus, selection, input type sanitization, composition, or native reset behavior from the first fake/minimal DOM host path. |
| Event-coupled restore | Do not wire `enqueueStateRestore`, `restoreStateIfNeeded`, `ChangeEventPlugin`, or event replay as part of root render. Listener shell installation is not event behavior. |
| Hydration-coupled forms/resources | Do not wire hydration form state, queued change events during hydration, hydratable hoistables, server resource preambles, or Fizz/static resource emission. |

First root render tests should avoid `<html>`, `<head>`, `<body>`, hoistable
resource tags, forms with action functions, and controlled
`input`/`select`/`textarea` scenarios. If a minimal DOM property slice can set
ordinary attributes on those tag names as raw host elements, it still must not
make a React DOM compatibility claim for their special React 19 behavior.

## Reserved Adapter Hooks

Keep these seams present and explicit so later workers can enable each surface
without changing the first milestone's root contract:

- Host capabilities: `Forms`, `Resources`, `Singletons`, and
  `CommitSuspension` must stay opt-in. A DOM adapter should report them false
  until the matching oracle and implementation gates pass.
- Fiber tags: `HostHoistable` and `HostSingleton` are valid core tags, but
  complete-work classification should stay disabled for the minimal DOM root
  canary.
- Resource adapter: reserve DOM-owned hooks matching React's
  `isHostHoistableType`, `getHoistableRoot`, `getResource`,
  `acquireResource`, `releaseResource`, `hydrateHoistable`,
  `mountHoistable`, `unmountHoistable`, `createHoistableInstance`,
  `prepareToCommitHoistables`, `preloadResource`, and future suspend-resource
  behavior.
- Public resource dispatcher: keep `ReactDOMSharedInternals.d` methods
  `D/C/L/m/X/S/M` as the only bridge for root `ReactDOM.pre*` APIs. Do not
  implement resource DOM side effects in public facade files.
- Singleton adapter: reserve `is_host_singleton_type`,
  `is_singleton_scope`, `resolve_singleton_instance`,
  `acquire_singleton_instance`, and `release_singleton_instance`, with DOM
  document ownership and node-map cleanup owned by the DOM adapter.
- Form adapter: keep `reset_form_instance`, `FormInstance`, root
  `form_state`, and the private dispatcher `r` for `requestFormReset`. Client
  form action success should require a React-owned form lookup, not a public
  facade shortcut.
- Controlled control adapter: reserve DOM component helpers for
  `initInput`, `updateInput`, `restoreControlledInputState`, select/textarea
  equivalents, input value tracking, latest props maps, and event restore
  queues. These belong with DOM component/event integration, not generic
  reconciler root render.
- Node metadata: latest props, node-to-token, token-to-node, root marker, and
  listener marker maps must remain DOM-owned and keyed by reconciler-issued
  opaque host tokens. Forms and controls must not store raw fibers on nodes.

## Conformance Gates Before Enabling

### Resource Hint APIs

Required before exposing behavior:

- Existing `react-dom-resource-hints` oracle remains green and regenerated
  deterministically.
- A new DOM-effect oracle covers global `document` fallback, inserted
  `<link>`/`<script>` nodes, head insertion, dedupe keys, preload-to-resource
  prop adoption, invalid argument diagnostics, production warning absence, and
  private dispatcher normalization.
- Fast React dual-run comparison proves public return values, warnings,
  private dispatcher call shapes, DOM mutations, and unsupported RSC branches.
- Gates include `node --test` for resource hint tests, deterministic
  byte-compare, `npm run check:js`, path-leak checks, and `git diff --check`.

### Render-Time Resources And Hoistables

Required before `HostCapability::Resources` is true:

- DOM host tests for `HostHoistable` classification and non-classification,
  `getHoistableRoot`, `getResource`, resource reference counts,
  `acquireResource`, `releaseResource`, preload adoption, stylesheet
  precedence insertion, async script handling, `meta`/`title` hoisting, and
  cleanup.
- Commit tests prove `prepareToCommitHoistables`, mount, update, delete, and
  interrupted/suspended resource commits are ordered relative to ordinary
  mutation effects.
- Separate gates for commit suspension: `preloadResource`,
  `mayResourceSuspendCommit`, `suspendResource`, timeouts, and image/style
  readiness must not be bundled into the first resource enablement unless the
  oracle requires it.
- Compatibility claims remain false until React DOM 19.2.6 dual-run
  observations match for render-time resources.

### Singletons

Required before `HostCapability::Singletons` is true:

- Oracle-backed tests for `html`, `head`, and `body` classification;
  `resolveSingletonInstance` document lookup; acquire warnings for duplicate
  singleton ownership; attribute clearing; `setInitialProperties`; node-map
  publication; and release cleanup without removing document singleton nodes.
- Root and hydration boundaries prove singleton scope, deletion ordering,
  nested singleton diagnostics, and interaction with container root markers.
- Public root tests include document-root and element-root cases before any
  singleton compatibility claim.

### Form Actions And Form Status

Required before form behavior is enabled:

- Existing `react-dom-form-actions` oracle stays green for descriptors,
  invalid rootless reset, hook boundary errors, server render status/state
  shapes, and RSC branches.
- A new client DOM form-action oracle covers React-owned
  `requestFormReset` success, invalid non-owned forms, submit/reset event
  dispatch, `FormData` argument and mutation behavior, pending
  `useFormStatus`, `useFormState` dispatch/return shapes, action success/error
  timing, and interaction with `flushSync`/transitions.
- Reconciler gates cover host transition status context, root `form_state`,
  `resetFormInstance`, scheduler lanes for form actions, and cleanup after
  unmount.
- Event gates cover `submit` and `reset` plugin extraction before form action
  behavior is exposed through public React DOM.

### Controlled Inputs, Selects, And Textareas

Required before controlled behavior is claimed:

- Existing `dom-controlled-input` oracle stays green and deterministic.
- DOM adapter implementation covers `initInput`, `updateInput`,
  `hydrateInput`, `restoreControlledInputState`, select/textarea equivalents,
  warning parity, and ordered property writes.
- Event integration covers `ChangeEventPlugin`, `BeforeInputEventPlugin` where
  relevant, `inputValueTracking`, `enqueueStateRestore`,
  `restoreStateIfNeeded`, latest-props lookup, and controlled restore after
  batched event updates.
- Browser/jsdom-backed oracles cover user input, focus/selection preservation,
  radio group cross-node behavior, native form reset, autofill, input type
  sanitization, composition, hydration replay, and browser validation before
  full browser DOM compatibility is claimed.

## Sequencing Recommendation

1. Finish the minimal HostRoot render/update/unmount path with resources,
   forms, singletons, and controlled controls disabled at capability and
   classification boundaries.
2. Land private DOM mutation/text/property behavior with node-token and
   latest-props publication, but avoid form-control special wrappers and
   resource/singleton tags in root canaries.
3. Wire public `createRoot` only after the internal root, HostRoot queue,
   scheduler, commit, DOM mutation, root marker, and listener shell gates pass.
4. Add events and latest-props lookup before controlled restore or form
   actions.
5. Enable resources/singletons after dedicated hoistable/singleton oracles and
   commit ordering tests exist.
6. Enable form actions after event dispatch, host transition status, and
   client-owned form oracles exist.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The report keeps behavior claims aligned with checked oracles. Existing
  resource/form/control artifacts are target evidence only and do not prove
  Fast React compatibility.
- The first root milestone remains testable without importing the most
  browser-sensitive React DOM surfaces.

Maintainability:

- Adapter hooks are reserved at existing capability and trait boundaries
  instead of moving DOM resource/form/control logic into core or root facade
  code.
- Later workers can enable one capability at a time with targeted gates and
  without changing public root semantics.

Performance:

- Keeping resource preloading, stylesheet suspension, controlled restore, and
  form transitions out of the first commit path avoids premature global
  document queries, event replay queues, property descriptor patching, and
  commit suspension timers.

Security:

- Deferring form actions avoids premature execution of user action callbacks
  and `FormData` mutation paths.
- Deferring resources avoids premature global-document resource insertion and
  nonce/integrity/referrer-policy handling before conformance gates exist.
- DOM node metadata cleanup remains a prerequisite before storing latest props
  that may retain callbacks or large user objects.

## Risks Or Blockers

- If a future root canary accidentally renders hoistable tags or controlled
  controls, it can appear to pass while silently skipping React 19 special
  behavior. Keep fixtures narrow and explicit.
- `HostHoistable` and `HostSingleton` tags already exist in core; the risk is
  classification leaking into complete work before DOM adapter capabilities are
  ready.
- Current public React DOM placeholders are intentionally unsupported. Removing
  placeholders for resource/form APIs before dual-run gates would create a
  false compatibility claim.
- `.worker-logs/worker-143-resource-form-refresh.log` is present as an
  untracked worker-session artifact and was left untouched.

## Changed Files

- `worker-progress/worker-143-resource-form-refresh.md`

## Commands Run

- Goal tools: `create_goal`, `get_goal`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,280p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-059-react-dom-resource-hints-oracle.md`
- `sed -n '1,300p' worker-progress/worker-060-react-dom-form-actions-oracle.md`
- `sed -n '1,300p' worker-progress/worker-064-dom-controlled-input-oracle.md`
- `sed -n '1,760p' worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- `find packages/react-dom -maxdepth 4 -type f | sort`
- `rg` scans over `packages/react-dom`, `crates`, and the local React 19.2.6
  reference source for resource, singleton, form, and controlled-input hooks.
- `sed` reads of current React DOM placeholders and private shell modules.
- `sed` reads of React 19.2.6 reference source files for
  `ReactDOMFloat.js`, form actions/shared internals, input/select/textarea,
  input value tracking, controlled restore, and DOM host resource/singleton
  hooks.
- `rg --files tests/conformance | rg '(react-dom-resource-hints|react-dom-form-actions|dom-controlled-input)' | sort`
- Node summary of checked resource/form/control oracle metadata.
- `git status --short --untracked-files=all`
- `git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-143-resource-form-refresh.md`
- `rg -n '[[:blank:]]+$' worker-progress/worker-143-resource-form-refresh.md`
- `rg -n '^(<<<<<<<|=======|>>>>>>>)($| )' worker-progress/worker-143-resource-form-refresh.md`
- `git status --short --untracked-files=all -- worker-progress/worker-143-resource-form-refresh.md`
- Scoped changed-path check over `git status --short --untracked-files=all`,
  allowing only this report and documenting the worker-session log artifact.

## Verification Results

- `git diff --check` passed with no output.
- No-index `git diff --check` for the untracked report passed with no
  whitespace warnings.
- Report trailing-whitespace scan passed.
- Report conflict-marker scan passed.
- Scoped report status showed only
  `?? worker-progress/worker-143-resource-form-refresh.md`.
- Scoped changed-path check passed for report-only worker scope while
  documenting the untracked `.worker-logs/worker-143-resource-form-refresh.log`
  session artifact as ignored/untouched.

## Recommended Next Tasks

- Keep worker 129/root-render implementation fixtures free of hoistable tags,
  singletons, forms, and controlled controls.
- Add a dedicated DOM-effect resource oracle before implementing public
  resource hint side effects.
- Add client-owned form action and browser-backed controlled-control oracles
  before enabling `Forms` or controlled restore.
- Add render-time hoistable/singleton implementation plans after minimal DOM
  mutation commit and root facade gates pass.
