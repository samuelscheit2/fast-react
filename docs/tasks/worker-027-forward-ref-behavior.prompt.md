You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed direct `forwardRef` wrapper-object behavior for
`@fast-react/react`. First add a deterministic React 19.2.6 `forwardRef` oracle
under `tests/conformance/**`, then replace the `forwardRef` placeholder across
default and `react-server` package entrypoints only where the oracle covers
observable direct-call behavior. Keep render-time ref attachment, component
invocation, owner stacks, hooks, context, and renderer behavior out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-027-forward-ref-behavior.md`

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Use exact React 19.2.6 package artifacts as the source of truth. Do not infer
  `forwardRef` behavior from API names.
- Keep package-wide compatibility claims false. Exact normalized matches should
  be recorded as matched without a compatibility claim, not as full React
  compatibility.
- Do not implement render-time ref attachment/detachment, callback ref
  invocation, owner stacks, renderer invocation, hooks, context, `useRef`, refs
  lifecycle, memo/lazy renderer semantics, or private internals.
- Treat object properties that are directly observable from `forwardRef(...)`
  results as in scope only when covered by the oracle.
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

- Add a forward-ref oracle generator/probe module under `tests/conformance` or
  extend the wrapper-object oracle only if that stays simpler and keeps
  scenario ownership clear.
- Cover default Node and `--conditions=react-server`, each in development and
  production.
- Probe observable export/function descriptors for `forwardRef`.
- Probe `forwardRef(render)` direct behavior for function render values,
  nullish/non-function/object/string render values, memo/lazy-like wrapper
  values if directly observable, extra arguments, `this` handling, constructor
  calls, return object own keys and order, property descriptors, prototype,
  extensibility/seal/freeze state, `$$typeof` tags, `render`, development-only
  direct properties such as `displayName`, and console warnings/errors.
- If React development behavior warns for render arity, memo-wrapped inputs, or
  invalid values, capture the exact observable conditions and arguments.
- Implement only direct wrapper-object behavior proven by the oracle. Extending
  `packages/react/wrapper-object.js` is fine if it keeps default and
  `react-server` behavior aligned.
- Update smoke tests so they check implemented `forwardRef` direct behavior
  while preserving exact export keys, package condition routing, blocked
  physical subpaths, and placeholders for APIs outside this slice.
- Regenerate any existing checked oracle artifact whose captured entrypoint
  descriptors change because `forwardRef` stops being a placeholder.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Forward-ref oracle regeneration byte-compare, for example generating to a temp
  file and comparing with the checked artifact.
- Any existing oracle regeneration byte-compare needed because entrypoint
  descriptors changed.
- Temp/local path leak guard for the forward-ref oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-027-forward-ref-behavior.md`

Handoff requirements:

- Write `worker-progress/worker-027-forward-ref-behavior.md`.
- Summarize the oracle design and the exact `forwardRef` behavior now covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  refs lifecycle, render invocation, owner-related behavior, hooks/context,
  renderer integration, or private internals.
- Review quality, maintainability, performance, and security implications.
