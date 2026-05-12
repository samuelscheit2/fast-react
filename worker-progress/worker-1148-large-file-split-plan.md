# Worker 1148 Large File Split Plan

## Status

- Complete.

## Assigned Objective

- Produce a pragmatic large-file split/cleanup plan.
- Identify the largest project-owned source/test files while excluding generated
  oracle JSON and vendored/published artifacts.
- Distinguish files worth splitting from files that should not be split now.
- Recommend whether any split should happen before React DOM HTML/root render.
- Write scope: this progress file and, if clearly useful, `MASTER_PLAN.md`.

## Inventory Scope

- Included project-owned Rust/JS/MJS/CJS/TS/JSX/TSX source and tests.
- Excluded `target/`, `node_modules/`, `dist/`, `coverage/`, `Cargo.lock`,
  generated JSON oracle/manifest/schema files, and package CJS published
  artifacts under `packages/**/cjs/**`.
- Package-root source/facade files such as `packages/react-test-renderer/index.js`
  and `bindings/node/index.cjs` are included because they are edited
  project-owned behavior gates, not generated snapshots.

## Filtered Large-File Baseline

`rg --files ... | xargs wc -l | sort -nr` with the scope above currently reports:

| Lines | File |
| ---: | --- |
| 29,521 | `packages/react-dom/src/client/root-bridge.js` |
| 18,216 | `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` |
| 15,407 | `packages/react-test-renderer/index.js` |
| 14,641 | `packages/react-dom/src/resource-form-internals-gate.js` |
| 10,949 | `packages/react-dom/src/client/controlled-restore-queue.js` |
| 10,258 | `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs` |
| 9,533 | `packages/react-dom/src/events/plugin-event-system.js` |
| 8,553 | `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` |
| 8,343 | `crates/fast-react-reconciler/src/function_component.rs` |
| 8,265 | `packages/react-dom/test/resource-form-unsupported-gates/resource-hints.js` |
| 8,208 | `crates/fast-react-reconciler/src/root_commit.rs` |
| 7,968 | `crates/fast-react-reconciler/src/function_component/tests.rs` |
| 7,524 | `packages/react-dom/src/client/hydration-boundary-gate.js` |
| 7,436 | `crates/fast-react-napi/src/tests.rs` |
| 7,353 | `packages/react-dom/src/shared/form-actions.js` |
| 6,959 | `crates/fast-react-reconciler/src/root_scheduler/tests.rs` |
| 6,573 | `crates/fast-react-reconciler/src/begin_work.rs` |
| 6,572 | `crates/fast-react-reconciler/src/passive_effects/tests.rs` |
| 6,218 | `bindings/node/index.cjs` |
| 6,209 | `packages/react/hook-dispatcher.js` |

Excluded artifacts that would otherwise dominate review noise:

- Generated oracle JSON: largest files are
  `tests/conformance/oracles/react-19.2.6-wrapper-object-oracle.json`
  at 120,516 lines and
  `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
  at 118,153 lines.
- Package CJS artifacts: largest files are
  `packages/react-test-renderer/cjs/react-test-renderer.development.js`
  at 23,803 lines and
  `packages/react-test-renderer/cjs/react-test-renderer.production.js`
  at 20,750 lines.

## Split Recommendation

Do not run a broad large-file cleanup lane before React DOM HTML/root render.
The next render work needs small behavior proofs more than a repository-wide
shuffle, and every split creates merge conflicts with active evidence workers.

Do one targeted split before render only if the orchestrator can reserve the
file: split `packages/react-dom/src/client/root-bridge.js`. It is the largest
source file, it sits directly on `createRoot`/`root.render`/`hydrateRoot`
handoff work, and upcoming React DOM behavior workers will keep colliding there.

Recommended `root-bridge.js` boundaries:

- `root-bridge/hydration.js`: hydration boundary/replay/text mismatch helpers
  now occupying the opening hydration section and later recovery callbacks.
- `root-bridge/public-facade.js`: public facade adapter, preflight root records,
  public render/update/unmount/hydrate facade records, and capability blockers.
- `root-bridge/native-handoff.js`: native handle/request mirrors, root work-loop
  finished-work metadata, and diagnostic handoff rows.
- `root-bridge/portal.js`: portal boundary, prepare-mount listener intent,
  fake-DOM mount, child reconciliation, and portal owner-root gate records.
- `root-bridge/host-output.js`: initial host output, host-output updates,
  HostComponent update metadata, dangerous HTML/text reset, and rollback helpers.
- Keep a small `root-bridge.js` facade that owns exported names and any shared
  `WeakMap`/symbol state that must remain identity-stable.

Risk: moderate. The file uses many shared private payload maps and symbols, so
the first split should preserve object identity and existing export names. The
safe shape is a behavior-preserving facade extraction with package-surface and
React DOM private tests, not a semantic refactor.

Parallelizability: low while active render workers touch `root-bridge.js`;
high after the facade is merged because later workers can own individual child
modules.

## Files To Defer

- `packages/react-test-renderer/cjs/*.js`: published artifacts. Do not split by
  hand; update from source only if a generator/source-of-truth exists.
- `tests/conformance/oracles/*.json`: generated data. Do not split for
  readability; regenerate or compress only as a separate oracle-storage task.
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` and
  `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  large and review-hostile, but test-renderer-only. Split after the current
  React DOM render lane or when a test-renderer worker owns the surface.
- `packages/react-test-renderer/index.js`: large behavior facade, but not on the
  React DOM HTML render critical path. Split later by route/facade
  boundaries: create/update/unmount, act/scheduler, serialization, TestInstance,
  error boundary, native bridge.
- `packages/react-dom/src/resource-form-internals-gate.js`,
  `packages/react-dom/src/client/controlled-restore-queue.js`,
  `packages/react-dom/src/events/plugin-event-system.js`,
  `packages/react-dom/src/client/hydration-boundary-gate.js`, and
  `packages/react-dom/src/shared/form-actions.js`: real friction files, but each
  is a blocked-gate domain. Split only when that behavior lane is active, not as
  a prerequisite to root render.
- `crates/fast-react-reconciler/src/function_component.rs`,
  `root_commit.rs`, `begin_work.rs`, `host_work.rs`, and large Rust test files:
  already have partial module splits. Prefer focused follow-ups that extract
  one stable subdomain at a time with `pub(crate) use` facades and targeted
  Rust tests.
- `bindings/node/index.cjs` and `crates/fast-react-napi/src/tests.rs`: defer
  until native/N-API JSON handoff work resumes; split by request metadata,
  JSON adapter, lifecycle, cleanup/currentness, and negative matrices.
- `tests/smoke/import-entrypoints.mjs`: broad package-surface matrix. Keep whole
  unless package-surface churn makes per-package fixture extraction valuable.

## Candidate Follow-Up Tasks

1. `root-bridge` facade split, behavior-preserving only, with
   `npm test --workspace @fast-react/react-dom` and package-surface/import smoke.
2. React DOM root render E2E conformance helper split:
   `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs` into
   bridge, warning/cross-root/act, metadata, portal, and formatting helpers.
   This is safer than changing runtime code and can run parallel to non-test
   workers if test-file conflicts are acceptable.
3. Resource/form gate split after root render sequencing stabilizes:
   resource hints, root map storage, form action/reset, controlled input
   wrapper/value tracker.
4. Test-renderer create-routing test split after the current React DOM lane:
   create/update/unmount, act/scheduler, serialization, TestInstance,
   error-boundary, and native bridge test modules.

## Changed Files

- `MASTER_PLAN.md`
- `worker-progress/worker-1148-large-file-split-plan.md`

## Commands Run

- `pwd && git status --short --branch`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `rg --files -g 'MASTER_PLAN.md' -g 'ORCHESTRATOR.md' -g 'worker-progress/**'`
- `find . -maxdepth 3 -type d | sort | sed -n '1,220p'`
- `rg --files -g '!target/**' -g '!node_modules/**' -g '!dist/**' -g '!coverage/**' -g '!*.json' | sed -n '1,260p'`
- `sed -n '1,260p' MASTER_PLAN.md`
- `rg --files -g '*.{rs,js,mjs,cjs,ts,tsx,jsx}' -g '!target/**' -g '!node_modules/**' -g '!dist/**' -g '!coverage/**' -g '!**/*.json' -g '!Cargo.lock' -g '!packages/**/cjs/**' | xargs wc -l | sort -nr | sed -n '1,80p'`
- `wc -l tests/conformance/oracles/*.json tests/benchmarks/manifests/*.json tests/benchmarks/schema/*.json | sort -nr | sed -n '1,40p'`
- `find packages -path '*/cjs/*' -type f \( -name '*.js' -o -name '*.cjs' -o -name '*.mjs' \) -print0 | xargs -0 wc -l | sort -nr`
- `rg -n "^(function|const|class|module\\.exports|exports\\.|async function) " <large-js-file>`
- `rg -n "^(pub mod|mod |pub use|pub struct|pub enum|pub fn|fn |impl|#\[cfg|#\[test)" <large-rust-file>`
- `rg -n "^(test|function|const |import |export )" <large-test-file>`
- `find packages -maxdepth 2 -name package.json -print -exec sed -n '1,220p' {} \;`
- `git log --oneline --decorate -12`
- `git merge-base --is-ancestor 15432066 HEAD; echo $?`
- `git rev-parse --short HEAD`
- `git diff -- MASTER_PLAN.md worker-progress/worker-1148-large-file-split-plan.md`
- `git diff --check`
- `git diff --no-index --check /dev/null worker-progress/worker-1148-large-file-split-plan.md`
- `sh -c 'git diff --no-index --check /dev/null worker-progress/worker-1148-large-file-split-plan.md; rc=$?; test "$rc" -eq 0 -o "$rc" -eq 1'`
- `git diff --stat`

## Evidence Gathered

- The worktree started clean on branch `worker/1148-large-file-split-plan`.
- `HEAD` is `4d9b7712`, and `15432066` is an ancestor, so the
  `MASTER_PLAN.md` large-file baseline label was stale relative to current
  main even though most listed line counts still matched.
- The filtered source/test inventory shows `root-bridge.js` is still the largest
  project-owned source file after excluding generated JSON and package CJS
  artifacts.
- Function scans show `root-bridge.js`, resource/form internals,
  controlled-restore, plugin-event-system, and the large test-renderer tests are
  domain-aggregator files rather than single cohesive algorithms.
- Rust scans show several large Rust modules already have child modules and
  facade re-exports; additional cleanup should continue that pattern one
  subdomain at a time.
- `git diff --check` passed for the tracked `MASTER_PLAN.md` edit.
- The new progress file passed the no-index whitespace check; raw
  `git diff --no-index --check` returned `1` only because `/dev/null` and the
  new file differ, so the normalized wrapper confirmed that `0` or `1` was the
  acceptable no-whitespace-error outcome.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.

## Risks Or Blockers

- No blocker for the docs-only update.
- Any runtime split of `root-bridge.js` should be scheduled as an exclusive
  file-ownership worker; concurrent render workers would otherwise see heavy
  merge conflicts.
- This plan makes no runtime behavior or public compatibility claim.

## Recommended Next Tasks

- Prefer the `root-bridge` facade split before public React DOM HTML/root render
  only if file ownership can be reserved.
- Otherwise keep implementation momentum on render behavior and defer all other
  large-file splits until their behavior lanes need the files.
