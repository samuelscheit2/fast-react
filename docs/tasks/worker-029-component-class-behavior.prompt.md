You are a worker for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task. If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed direct `Component` and `PureComponent` behavior
for the default-root `@fast-react/react` entrypoint. First add a deterministic
React 19.2.6 component-class oracle under `tests/conformance/**`, then replace
the default-root placeholder classes only where the oracle covers observable
direct constructor/prototype/instance/no-op updater behavior. Keep
`react-server` export absence, rendering, lifecycle methods, reconciliation,
state updates through a real renderer, refs lifecycle, hooks, context
propagation, owner stacks, and renderer behavior out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-029-component-class-behavior.md`

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-021-element-object-oracle.md`
- `worker-progress/worker-023-js-element-factory.md`
- `worker-progress/worker-024-create-ref-behavior.md`
- `worker-progress/worker-025-children-helpers.md`
- `worker-progress/worker-026-memo-lazy-behavior.md`
- `worker-progress/worker-027-forward-ref-behavior.md`
- `worker-progress/worker-028-create-context-behavior.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Use exact React 19.2.6 package artifacts as the source of truth. Do not infer
  class behavior from API names or source memory.
- Keep package-wide compatibility claims false. Exact normalized matches should
  be recorded as matched without a compatibility claim, not as full React
  compatibility.
- Do not add `Component` or `PureComponent` to the `react-server` root
  entrypoint unless exact React 19.2.6 probes prove they exist there. Current
  inventory says they are default-root APIs.
- Do not implement renderer-driven updates, lifecycle invocation, render
  scheduling, refs lifecycle, context propagation, owner stacks, hooks, private
  internals, or DOM/native/SSR integration.
- Treat object properties, prototype descriptors, constructor behavior, and
  default no-op updater behavior as in scope only when covered by the oracle.
- Generated artifacts must be deterministic and must not include temp paths,
  timestamps, local absolute paths, or transient environment details.
- Workers may spawn nested managed subagents or explorers to test hypotheses;
  summarize useful delegated checks in the report.
- Find root causes; do not patch symptoms.
- Regenerable artifacts such as `node_modules/`, `target/`, and root
  `Cargo.lock` do not need cleanup merely because they exist. Remove or
  document them only if they are stale, ambiguous, or would pollute your scoped
  final diff/status.

Expected implementation shape:

- Add a dedicated component-class oracle generator/probe module under
  `tests/conformance` unless extending an existing oracle is demonstrably
  simpler and keeps scenario ownership clear.
- Cover default Node development and production direct behavior. Include
  `--conditions=react-server` only to prove `Component`/`PureComponent` absence
  or package surface preservation; do not implement behavior on that condition.
- Probe observable export/function descriptors for `Component` and
  `PureComponent`.
- Probe construction with representative props/context/updater values, extra
  arguments, `this` handling, direct calls if observable, `new`, `call`,
  `apply`, and `bind` behavior.
- Probe instance own keys, descriptors, prototype chain, `props`, `context`,
  `refs`, `updater`, default ref object behavior, mutability, and identity.
- Probe `Component.prototype` and `PureComponent.prototype` own-key order,
  descriptors, markers such as `isReactComponent` or pure-component markers,
  method names/lengths, constructor descriptors, and inheritance
  relationships.
- Probe direct `setState` and `forceUpdate` behavior with the default updater,
  including return values, argument validation, callbacks, console warnings,
  deduplication, and dev/prod differences. Do not implement real renderer
  updates.
- Implement only direct class/instance/no-op updater behavior proven by the
  oracle. A small dedicated module such as `packages/react/component-class.js`
  is fine if it keeps entrypoint wiring simple.
- Update smoke tests so they check implemented default-root
  `Component`/`PureComponent` direct behavior while preserving exact export
  keys, package condition routing, blocked physical subpaths, and placeholders
  for APIs outside this slice.
- Regenerate any existing checked oracle artifact whose captured entrypoint
  descriptors change because `Component`/`PureComponent` stop being
  placeholders.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Component-class oracle regeneration byte-compare, for example generating to a
  temp file and comparing with the checked artifact.
- Any existing oracle regeneration byte-compare needed because entrypoint
  descriptors changed.
- Temp/local path leak guard for the component-class oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-029-component-class-behavior.md`

Handoff requirements:

- Write `worker-progress/worker-029-component-class-behavior.md`.
- Summarize the oracle design and the exact `Component`/`PureComponent`
  behavior now covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  `react-server`, renderer updates, lifecycle methods, refs lifecycle, context
  propagation, owner-related behavior, hooks, renderer integration, or private
  internals.
- Review quality, maintainability, performance, and security implications.
