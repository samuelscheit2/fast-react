You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Implement the first deterministic element-object conformance oracle in
`tests/conformance/**`, using the evidence from worker-020 and the inventory
infrastructure from worker-017. The oracle should capture React 19.2.6 element
object behavior for `createElement`, `cloneElement`, `jsx`, `jsxs`, and
`jsxDEV` across development/production and default/`react-server` conditions,
then compare Fast React package entrypoints without claiming compatibility yet.

Write scope:

- `tests/conformance/**`
- `worker-progress/worker-021-element-object-oracle.md`

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-020-element-object-conformance-probes.md`
- Current files under `tests/conformance/**`

Constraints:

- Do not modify `packages/react/**`, `tests/smoke/**`, Rust crates, root
  manifests, or root lockfiles.
- Use exact React 19.2.6 package artifacts or the checked runtime inventory
  pipeline as the source of React truth. Do not infer behavior from names alone.
- Use Node built-ins where possible. Do not add dependencies unless you can
  justify why a standard API cannot cover the requirement.
- Keep all Fast React behavior compatibility claims explicitly false unless a
  future full dual-run oracle proves otherwise.
- If Fast React currently throws placeholders, record that as an expected
  mismatch/status, not as passing compatibility.
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

- Add an element-object oracle generator/probe module under `tests/conformance`
  or extend the existing runtime inventory tooling if that is cleaner.
- Capture normalized JSON for observable element-object behavior, including
  object keys, own key order, descriptors, getter names, `isReactWarning`,
  key/ref behavior, freeze/seal/extensible state, child-array identity/freeze
  behavior, warnings, thrown errors, and `isValidElement` brand checks.
- Cover default Node and `--conditions=react-server`, each in development and
  production.
- Add tests that verify the React oracle artifact/schema and verify Fast React
  comparison status remains an explicit mismatch/unsupported state until package
  behavior changes.
- Keep normal tests network-free if you check in generated artifacts; provide a
  separate generation command if network/package execution is required.

Verification to run:

- `npm test --workspace @fast-react/conformance`
- `npm run test:conformance`
- `npm run check:js`
- Any generator determinism check you add, such as generating to a temp file and
  byte-comparing against the checked artifact.
- `git diff --check -- tests/conformance worker-progress/worker-021-element-object-oracle.md`

Handoff requirements:

- Write `worker-progress/worker-021-element-object-oracle.md`.
- Summarize the oracle design and what behavior is captured.
- List changed files and commands run.
- Explicitly state what remains unsupported or mismatching in Fast React.
- Review quality, maintainability, performance, and security implications.
