You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed `React.Children` helper behavior for
`@fast-react/react`. First add a deterministic React 19.2.6 children-helper
oracle under `tests/conformance/**`, then replace the `Children.count`,
`Children.forEach`, `Children.map`, `Children.only`, and `Children.toArray`
placeholders across default and `react-server` package entrypoints only where
the oracle covers observable behavior. Keep renderer traversal, owner stacks,
and hooks out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-025-children-helpers.md`

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Use exact React 19.2.6 package artifacts as the source of truth. Do not infer
  traversal, key, or error behavior from API names.
- Keep package-wide compatibility claims false. Exact normalized matches should
  be recorded as matched without a compatibility claim, not as full React
  compatibility.
- Do not introduce renderer lifecycle behavior, owner stack behavior, hooks,
  context, `forwardRef`, `useRef`, or private internals.
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

- Add a children-helper oracle generator/probe module under `tests/conformance`
  or extend existing oracle infrastructure only if that stays simpler.
- Cover default Node and `--conditions=react-server`, each in development and
  production.
- Probe observable `React.Children` behavior for nullish/scalar/boolean/array
  children, nested arrays, existing Fast React elements, fragments if directly
  observable without rendering, iterable children, callback argument values,
  callback `thisArg`, callback return handling, key synthesis/escaping where
  observable through `map` and `toArray`, thrown errors, and helper object
  descriptors.
- Implement only direct helper behavior proven by the oracle. A shared
  `children-helpers.js` package module is fine if it keeps default and
  `react-server` entrypoints aligned.
- Keep unsupported behavior loud and explicit if the oracle exposes a behavior
  that should not be implemented before renderer or owner state exists.
- Update smoke tests so they check implemented `Children` behavior while still
  preserving exact export keys, package condition routing, blocked physical
  subpaths, and placeholders for APIs outside this slice.
- Regenerate any existing checked oracle artifact whose captured entrypoint
  descriptors change because `Children` helper functions stop being
  placeholders.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Children oracle regeneration byte-compare, for example generating to a temp
  file and comparing with the checked artifact.
- Any existing oracle regeneration byte-compare needed because entrypoint
  descriptors changed.
- Temp/local path leak guard for the children-helper oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-025-children-helpers.md`

Handoff requirements:

- Write `worker-progress/worker-025-children-helpers.md`.
- Summarize the oracle design and the exact `Children` behavior now covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  children traversal, keys, fragments, iterables, or renderer-related behavior.
- Review quality, maintainability, performance, and security implications.
