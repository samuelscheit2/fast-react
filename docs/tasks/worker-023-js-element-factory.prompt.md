You are a worker for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task. If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement the first conformance-backed JavaScript element factory for
`@fast-react/react`, using the checked React 19.2.6 element-object oracle from
worker-021 as the source of truth. Replace placeholder behavior for
`createElement`, `cloneElement`, `isValidElement`, `jsx`, `jsxs`, and `jsxDEV`
where the oracle covers behavior, across default and `react-server`
entrypoints, without claiming full React compatibility yet.

Write scope:

- `packages/react/**`
- `tests/smoke/**`
- `tests/conformance/**`
- `worker-progress/worker-023-js-element-factory.md`

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-020-element-object-conformance-probes.md`
- `worker-progress/worker-021-element-object-oracle.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Constraints:

- Do not modify Rust crates, root manifests, root lockfiles, or orchestration
  files.
- Preserve the accepted runtime export keys and package condition routing.
- Keep unimplemented exports as explicit placeholders with structured
  `FastReactUnimplementedError`; do not silently no-op future React APIs.
- Use the oracle as evidence. Do not infer React behavior from names alone.
- Regenerate the element-object oracle after behavior changes and inspect
  Fast React comparison statuses. It is acceptable for covered scenarios to
  become exact normalized matches, but all top-level compatibility claims must
  remain false until a broader dual-run harness and complete scenario coverage
  exist.
- If comparison status naming or tests need to distinguish "matched but not
  compatibility-claimed" from mismatches/placeholders, update them explicitly
  and document why.
- Workers may spawn nested managed subagents or explorers to test hypotheses;
  summarize useful delegated checks in the report.
- Find root causes; do not patch symptoms.
- Regenerable artifacts such as `node_modules/`, `target/`, and root
  `Cargo.lock` do not need cleanup merely because they exist. Remove or
  document them only if they are stale, ambiguous, or would pollute your scoped
  final diff/status.

Expected implementation shape:

- Add a shared JS element implementation module if that keeps default,
  `react-server`, JSX runtime, and JSX dev runtime behavior consistent.
- Implement covered element object construction details from the oracle:
  element brand, keys, refs, props copying, defaultProps, children handling,
  descriptor order, dev/prod object freezing, key/ref warning getters, JSX
  runtime key behavior, `jsxDEV` production absence, and `isValidElement`.
- Keep owner-in-render behavior and private internals explicitly out of scope
  unless the existing package surface can support them cleanly without a
  reconciler.
- Update smoke tests so they check implemented element behavior instead of
  expecting placeholders for the implemented APIs.
- Regenerate `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
  and update conformance tests to assert the new comparison status policy.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Element oracle regeneration byte-compare, for example generating to a temp
  file and comparing with the checked artifact.
- Temp/local path leak guard for the element-object oracle.
- `git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-023-js-element-factory.md`

Handoff requirements:

- Write `worker-progress/worker-023-js-element-factory.md`.
- Summarize what element behavior now matches the oracle and what still
  mismatches or remains unsupported.
- List changed files and commands run.
- Include the regenerated Fast React comparison status counts.
- Review quality, maintainability, performance, and security implications.
