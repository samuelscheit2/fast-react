You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed direct `memo` and `lazy` wrapper-object behavior
for `@fast-react/react`. First add a deterministic React 19.2.6 wrapper oracle
under `tests/conformance/**`, then replace the `memo` and `lazy` placeholders
across default and `react-server` package entrypoints only where the oracle
covers observable direct-call behavior. Keep rendering, Suspense resolution,
memo bailout semantics, hooks, context, and private internals out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-026-memo-lazy-behavior.md`

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Use exact React 19.2.6 package artifacts as the source of truth. Do not infer
  `memo` or `lazy` behavior from API names.
- Keep package-wide compatibility claims false. Exact normalized matches should
  be recorded as matched without a compatibility claim, not as full React
  compatibility.
- Do not implement rendering behavior, `memo` compare invocation, memo bailout,
  component invocation, lazy rendering/Suspense integration, owner stacks,
  hooks, context, `forwardRef`, refs lifecycle, or private internals.
- Treat object properties that are directly observable from `memo(...)` and
  `lazy(...)` results as in scope only when covered by the oracle.
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

- Add a wrapper-object oracle generator/probe module under `tests/conformance`
  or extend existing oracle infrastructure only if that stays simpler.
- Cover default Node and `--conditions=react-server`, each in development and
  production.
- Probe observable export/function descriptors for `memo` and `lazy`.
- Probe `memo(type, compare)` direct behavior for valid function/class/string/
  object types, nullish/invalid types, omitted/null/undefined/function compare
  arguments, extra arguments, `this` handling, return object own keys and order,
  property descriptors, prototype, extensibility/seal/freeze state, `$$typeof`
  tags, `type`, `compare`, and development-only direct properties or warnings.
- Probe `lazy(load)` direct behavior for valid and invalid loader values, extra
  arguments, `this` handling, return object own keys and order, property
  descriptors, prototype, extensibility/seal/freeze state, `$$typeof` tags,
  `_payload`, `_init`, and development-only direct properties or warnings.
- If the oracle shows direct `_init` invocation is necessary to normalize the
  returned lazy object shape, cover it carefully with deterministic fulfilled,
  rejected, and throwing thenables. Do not implement renderer/Suspense behavior
  beyond direct observable object internals unless the evidence is narrow and
  fully covered.
- Implement only direct wrapper-object behavior proven by the oracle. A shared
  `wrapper-object.js` package module is fine if it keeps default and
  `react-server` behavior aligned.
- Update smoke tests so they check implemented `memo` and `lazy` direct behavior
  while preserving exact export keys, package condition routing, blocked
  physical subpaths, and placeholders for APIs outside this slice.
- Regenerate any existing checked oracle artifact whose captured entrypoint
  descriptors change because `memo` and `lazy` stop being placeholders.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Wrapper oracle regeneration byte-compare, for example generating to a temp
  file and comparing with the checked artifact.
- Any existing oracle regeneration byte-compare needed because entrypoint
  descriptors changed.
- Temp/local path leak guard for the wrapper oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-026-memo-lazy-behavior.md`

Handoff requirements:

- Write `worker-progress/worker-026-memo-lazy-behavior.md`.
- Summarize the oracle design and the exact `memo`/`lazy` behavior now covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  lazy resolution, Suspense, memo bailout/compare semantics, rendering,
  owner-related behavior, or private internals.
- Review quality, maintainability, performance, and security implications.
