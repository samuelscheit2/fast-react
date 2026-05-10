# Worker 363 - Test Renderer Update toJSON Private Host Output

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Extend the private
  react-test-renderer toJSON diagnostics from the single initial host-output
  canary to a narrow update-after-commit canary with stale snapshot rejection.
- `ORCHESTRATOR.md` was not read.
- No nested managed agents, explorers, or subagents were spawned.

## Summary

Extended the private react-test-renderer JSON diagnostic from the initial
HostComponent plus HostText create canary to the matching update-after-commit
canary.

The Rust test renderer now records committed-fiber inspection for host-output
updates, exposes
`describe_private_json_serialization_after_update_for_canary`, and tags private
JSON reports with the host-output update kind plus a current-snapshot flag. The
update report validates the current commit, current fiber inspection, the
updated HostComponent/HostText canary handles, and the live container snapshot
before producing the same two-node private JSON diagnostic shape.

The hidden JS `toJSON` facade now recognizes create and update diagnostics and
requires `hostOutputSnapshotCurrent: true` before privately serializing. Public
`create().toJSON()` remains blocked and still throws.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-363-test-renderer-update-tojson-private-host-output.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read required prior worker reports that were present: 153, 234, 265, 310,
  332, and 333.
- Worker reports 353 and 356 were requested but not present in this worktree.
- Worker 153 established the Rust-only test-renderer root canary.
- Worker 234 added fixture-specific host-output update/unmount commit
  diagnostics.
- Worker 265 added the private JSON diagnostic over committed host output and
  committed-fiber inspection.
- Worker 332 connected JS private root request records to record-only Rust
  canary metadata.
- Worker 333 added the hidden JS toJSON private host-output serializer while
  keeping public `toJSON()` blocked.
- Current code inspection showed the Rust private JSON report only accepted
  `TestRendererCommittedHostOutput`; the update commit output had no
  corresponding report path.
- Current JS inspection showed the hidden serializer already accepted the
  two-node shape, so this worker added explicit create/update and current
  snapshot diagnostics rather than widening public serialization.

## Commands Run

```sh
find worker-progress -maxdepth 1 \( -name 'worker-353-*' -o -name 'worker-356-*' \) -print
cargo test -p fast-react-test-renderer --all-features root_private_json
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-test-renderer --all-features root_private_json
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-363-test-renderer-update-tojson-private-host-output.md
git diff --check
```

## Verification Results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features root_private_json`:
  passed, 6 focused tests.
- JS syntax checks passed for all touched package and focused conformance JS
  files.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  passed, 6 tests.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`:
  passed, 9 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`:
  passed, 17 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed.
- npm printed the existing `minimum-release-age` warning during workspace npm
  scripts; it did not affect results.

## Risks Or Blockers

- This remains a private, fixture-specific diagnostic for one HostComponent
  with one HostText child. It is not general react-test-renderer serialization.
- JS still has no native/Rust execution bridge; the private facade consumes
  diagnostic records only.
- Public `create().toJSON()`, `toTree`, TestInstance wrappers, public act, and
  compatibility admissions remain blocked.

## Recommended Next Tasks

1. Keep the public serializer blocked until a real JS/native/Rust root handoff
   can provide live private JSON reports.
2. Extend private serialization only after broader committed host-output
   traversal and committed-fiber inspection are accepted.
3. Add public dual-run serialization admissions only after the public
   `create/update/unmount` route executes the Rust test renderer.
