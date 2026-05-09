You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed direct `createContext` object behavior for
`@fast-react/react`. First add a deterministic React 19.2.6 `createContext`
oracle under `tests/conformance/**`, then replace the default root
`createContext` placeholder only where the oracle covers observable direct-call
behavior. Keep `react-server` export absence, `useContext`, provider/consumer
rendering, propagation, subscriptions, owner stacks, hooks, and renderer
behavior out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-028-create-context-behavior.md`

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Use exact React 19.2.6 package artifacts as the source of truth. Do not infer
  `createContext` behavior from API names or source memory.
- Keep package-wide compatibility claims false. Exact normalized matches should
  be recorded as matched without a compatibility claim, not as full React
  compatibility.
- Do not add `createContext` to the `react-server` root entrypoint unless exact
  React 19.2.6 probes prove it exists there. Current inventory says it is a
  default-root API.
- Do not implement `useContext`, context propagation through a renderer,
  provider/consumer render semantics, subscriptions, owner stacks, hooks,
  private internals, or renderer integration.
- Treat object properties that are directly observable from
  `createContext(...)` results as in scope only when covered by the oracle.
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

- Add a dedicated context oracle generator/probe module under
  `tests/conformance` unless extending an existing oracle is demonstrably
  simpler and keeps scenario ownership clear.
- Cover default Node development and production direct behavior. Include
  `--conditions=react-server` only to prove `createContext` absence or package
  surface preservation; do not implement behavior on that condition.
- Probe observable export/function descriptors for `createContext`.
- Probe `createContext(defaultValue)` direct behavior for representative
  default values, including nullish values, scalars, objects, and symbols when
  observable.
- Probe extra arguments, `this` handling, constructor calls, return object
  own-key order, property descriptors, prototype, extensibility/seal/freeze
  state, React symbol tags, provider/consumer object identity and shape,
  default value identity, thread count fields, renderer slots, displayName
  assignment behavior, and any development-only direct warnings or accessors.
- Implement only direct context object behavior proven by the oracle. A small
  dedicated module such as `packages/react/context-object.js` is fine if it
  keeps entrypoint wiring simple.
- Update smoke tests so they check implemented default-root `createContext`
  direct behavior while preserving exact export keys, package condition
  routing, blocked physical subpaths, and placeholders for APIs outside this
  slice.
- Regenerate any existing checked oracle artifact whose captured entrypoint
  descriptors change because `createContext` stops being a placeholder.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Context oracle regeneration byte-compare, for example generating to a temp
  file and comparing with the checked artifact.
- Any existing oracle regeneration byte-compare needed because entrypoint
  descriptors changed.
- Temp/local path leak guard for the context oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-028-create-context-behavior.md`

Handoff requirements:

- Write `worker-progress/worker-028-create-context-behavior.md`.
- Summarize the oracle design and the exact `createContext` behavior now
  covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  `react-server`, `useContext`, provider/consumer rendering, context
  propagation, owner-related behavior, hooks, renderer integration, or private
  internals.
- Review quality, maintainability, performance, and security implications.
