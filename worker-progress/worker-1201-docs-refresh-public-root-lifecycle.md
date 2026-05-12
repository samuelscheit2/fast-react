# Worker 1201 - Docs Refresh Public Root Lifecycle

## Summary

- Refreshed coordination docs from the stale Worker 1176 / `5043c3bd` live
  baseline to current main `8a84a8dc` (`Merge worker 1200 public unmount smoke
  repair`).
- Recorded accepted Worker 1194 public minimal repeat div/text fake-DOM update
  and rendered-root unmount lifecycle evidence in `MASTER_PROGRESS.md`.
- Recorded accepted Worker 1200 smoke repair alignment with Worker 1194 update
  and unmount expectations in `MASTER_PROGRESS.md`.
- Kept `MASTER_PLAN.md` limited to current/future planning language and
  preserved broad blocker wording for browser DOM, native `.node` loading,
  Scheduler/act/flushSync, hydration, refs/listeners/events, resources/forms,
  controlled inputs, broad public root compatibility, and package/renderer
  compatibility.

## Changed Files

- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-1201-docs-refresh-public-root-lifecycle.md`

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `git status --short --branch`
- `git log --oneline --decorate -n 30 --first-parent`
- `rg --files worker-progress`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,320p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-1194-public-root-update-unmount-minimal.md`
- `sed -n '1,260p' worker-progress/worker-1200-repair-unmount-smoke-minimal.md`
- `rg -n "5043c3bd|8a84a8dc|1194|1200|large|baseline|public root|createRoot|unmount|broad public" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-1194-public-root-update-unmount-minimal.md worker-progress/worker-1200-repair-unmount-smoke-minimal.md`
- `sed -n '260,460p' MASTER_PLAN.md`
- `sed -n '320,620p' MASTER_PROGRESS.md`
- `git show --stat --oneline --decorate eeb25b09 --`
- `git show --stat --oneline --decorate 8a84a8dc --`
- `git show --no-patch --format=fuller eeb25b09 8a84a8dc`
- `rg --files | rg '^(packages|tests|crates|bindings|benchmarks|scripts)/' | rg -v '(^|/)(node_modules|target|dist|coverage|__generated__|fixtures/generated)/|(^|/)cjs/|\\.json$|\\.snap$' | xargs wc -l | sort -nr | sed -n '2,11p'`
- `git diff --stat 5043c3bd..8a84a8dc -- MASTER_PLAN.md MASTER_PROGRESS.md packages/react-dom/client.js tests/smoke/react-dom-private-root-bridge-shell.mjs tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs worker-progress/worker-1194-public-root-update-unmount-minimal.md worker-progress/worker-1200-repair-unmount-smoke-minimal.md`
- `git diff --name-status 5043c3bd..8a84a8dc`
- `git log --oneline 5043c3bd..8a84a8dc --reverse`
- `nl -ba MASTER_PLAN.md | sed -n '45,135p'; nl -ba MASTER_PLAN.md | sed -n '330,390p'; nl -ba MASTER_PROGRESS.md | sed -n '25,75p'`
- `git diff --check`
- `rg -n "5043c3bd|8a84a8dc|Worker 1194|Worker 1200|1194|1200|current main|Current accepted branch baseline" MASTER_PLAN.md`
- `sed -n '46,130p' MASTER_PLAN.md`
- `sed -n '336,382p' MASTER_PLAN.md`
- `sed -n '30,95p' MASTER_PROGRESS.md`
- `rg -n "5043c3bd" MASTER_PLAN.md`
- `rg -n "8a84a8dc|Worker 1194|Worker 1200|1194|1200" MASTER_PLAN.md`
- `sed -n '126,142p' MASTER_PLAN.md`
- `sed -n '370,382p' MASTER_PLAN.md`
- `git diff --stat && git diff -- MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-1201-docs-refresh-public-root-lifecycle.md`
- `sed -n '382,392p' MASTER_PLAN.md`

## Evidence Gathered

- `git log --first-parent` shows current main/HEAD at `8a84a8dc` after
  `eeb25b09` and `6c440daa`.
- Worker 1194 report records the accepted repeat public fake-DOM div/text update
  and rendered-root public unmount slice, plus unsupported/broad compatibility
  blockers.
- Worker 1200 report records smoke repair alignment with Worker 1194 update and
  unmount expectations, with render-after-unmount and repeated unmount still
  fail-closed.
- Regenerated large-file baseline with:
  `rg --files | rg '^(packages|tests|crates|bindings|benchmarks|scripts)/' | rg -v '(^|/)(node_modules|target|dist|coverage|__generated__|fixtures/generated)/|(^|/)cjs/|\\.json$|\\.snap$' | xargs wc -l | sort -nr | sed -n '2,11p'`.
  The top-ten counts match the prior listed files, so only the baseline hash
  label changed from `5043c3bd` to `8a84a8dc`.

## Verification Results

- `git diff --check` passed.
- `rg -n "5043c3bd" MASTER_PLAN.md` returned no matches, confirming the stale
  hash is no longer used in the live plan.
- Targeted `rg` checks show `MASTER_PLAN.md` names `8a84a8dc`, Worker 1194, and
  Worker 1200 in the live baseline, accepted evidence, and future sequencing
  sections.
- Read-back of `MASTER_PLAN.md` Active Queue, Near-Term Sequencing, root-render
  conformance follow-up, and premature/broad blocker sections matched the
  intended current/future scope.
- Read-back of `MASTER_PROGRESS.md` confirmed the accepted Worker 1194/1200
  history section records update/unmount facts and keeps broad blockers.

## Risks Or Blockers

- No runtime/source/test files were intentionally changed.
- Documentation claims remain intentionally narrow: only the accepted minimal
  fake-DOM div/text lifecycle slice is recorded as public root compatibility.
  Browser DOM, native `.node` loading, Scheduler/act/flushSync, hydration,
  refs/listeners/events, resources/forms, controlled inputs, broad public root,
  and package/renderer compatibility remain blocked.

## Recommended Next Tasks

- Continue with focused public root lifecycle workers only after each accepted
  slice has dual-run or source-owned gate evidence and explicit negative
  coverage for unsupported compatibility claims.
