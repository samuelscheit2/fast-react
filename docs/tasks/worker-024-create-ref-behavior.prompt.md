You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement conformance-backed `createRef` behavior for `@fast-react/react`.
First add a deterministic React 19.2.6 ref-object oracle under
`tests/conformance/**`, then replace the `createRef` placeholder across default
and `react-server` package entrypoints only where the oracle covers observable
behavior. Keep all broader refs, owners, render-time ref attachment, `forwardRef`,
and `useRef` behavior explicitly out of scope.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-024-create-ref-behavior.md`

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-020-element-object-conformance-probes.md`
- `worker-progress/worker-021-element-object-oracle.md`
- `worker-progress/worker-023-js-element-factory.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve the accepted runtime export keys, package condition routing, and
  explicit placeholders for APIs outside this slice.
- Keep `forwardRef`, callback ref invocation, owner stacks, renderer ref
  attachment/detachment, `useRef`, and private internals unimplemented unless
  the oracle proves a direct `createRef` observable surface needs a tiny helper.
- Use exact React 19.2.6 package artifacts or the checked runtime inventory
  pipeline as the source of truth. Do not infer behavior from API names.
- The new oracle must keep all package-wide compatibility claims false. If Fast
  React `createRef` matches the normalized React observations, record that as
  "matched but compatibility not claimed" or an equivalent explicit status.
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

- Add a ref-object oracle generator/probe module under `tests/conformance` or
  extend the existing oracle infrastructure if that keeps the design simpler.
- Cover default Node and `--conditions=react-server`, each in development and
  production.
- Capture React 19.2.6 observable `createRef` behavior, including export
  presence, function descriptors if relevant, call result keys and own-key
  order, property descriptors, prototype, extensibility/seal/freeze state,
  initial `current` value, per-call object identity, mutability of `current`,
  ability to add/delete extra properties, argument handling, `this` handling,
  and any development/production or `react-server` differences.
- Compare current Fast React behavior before and after the implementation in
  the checked oracle artifact.
- Implement only the JS facade behavior needed for covered direct `createRef`
  calls. A small shared helper module is fine if it keeps default and
  `react-server` behavior aligned.
- Update smoke tests so they check implemented `createRef` behavior while still
  preserving exact export keys, package condition routing, blocked physical
  subpaths, and placeholders for unimplemented ref-related APIs.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Ref oracle regeneration byte-compare, for example generating to a temp file
  and comparing with the checked artifact.
- Temp/local path leak guard for the ref-object oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-024-create-ref-behavior.md`

Handoff requirements:

- Write `worker-progress/worker-024-create-ref-behavior.md`.
- Summarize the oracle design and the exact `createRef` behavior now covered.
- List changed files and commands run.
- Include regenerated Fast React comparison status counts.
- Explicitly state what remains unsupported or intentionally mismatching in
  refs-related behavior.
- Review quality, maintainability, performance, and security implications.
