# Worker 1221: Public Fake-DOM Id Update Hardening

## Summary

Repaired the branch onto current `main` (`7d775144`) and resolved the public
fake-DOM lifecycle merge by preserving both accepted evidence streams:

- Worker 1220 recreate-after-unmount evidence, including stale old-root
  fail-closed attempts, distinct fresh root, fresh render/unmount snapshots,
  and the accepted repeat-render snapshot with the original id.
- Worker 1221 id/text update and id-removal hardening, including raw
  `getAttribute("id")` checks, escaped serialized `innerHTML`, component-tree
  latest-props children/id checks, and latest-props object identity.

Compatibility remains explicitly blocked (`compatibilityClaimed: false`). The
change does not broaden browser DOM/root compatibility claims, hydration,
events, refs, Scheduler, `act`, `flushSync`, profiling createRoot, arrays,
fragments, nested/component children, className, object id, or createRoot
options.

## Changed Files

- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `worker-progress/worker-1221-public-fakedom-id-update-hardening.md`

Accepted main merge-parent content also brought in:

- `MASTER_PLAN.md`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_scheduler/tests.rs`
- `worker-progress/worker-1220-public-root-recreate-after-unmount.md`
- `worker-progress/worker-1221-entangled-transition-queue-lane-continuation.md`

## Commands Run

- `git status --short --branch --untracked-files=all` - clean on
  `worker/1221-public-fakedom-id-update-hardening`
- `rg -n "<<<<<<<|=======|>>>>>>>" tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - pass, no conflict markers
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
  - pass, 4/4
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - pass, 43/43
- `npm --prefix tests/conformance run root-public-facade:conformance`
  - pass, 24 blocked public facade rows, failures 0
- `npm --prefix tests/conformance run root-render-e2e:conformance`
  - pass, 20 blocked unsupported rows, failures 0
- `npm --prefix packages/react-dom run check` - pass, 236/236 plus
  `tests/smoke/import-entrypoints.mjs`
- `npm run check:package-surface` - pass
- `node tests/smoke/import-entrypoints.mjs` - pass
- `git diff --check` - pass after final report update
- `git diff --cached --check` - pass before the repair merge commit

## Evidence Gathered

- Lifecycle order is now `renderInitial`, `renderDivText`, `renderUpdate`,
  `renderIdRemoval`, `unmount`, and `recreateAfterUnmount`; the recreate row
  is validated against `lifecycleRowSource[5]`.
- Initial render records raw id as `app&<>"` through both `getAttribute("id")`
  and stored latest props, while serialized output remains
  `app&amp;&lt;&gt;&quot;`.
- Same-root id/text update reuses the host node and records raw id as
  `next&<>"` in `getAttribute("id")` and stored latest props, while `innerHTML`
  serializes the updated id and text.
- Id removal update reuses the same host node, records no raw id attribute or
  stored id prop, and serializes `<div>id removed &amp; &lt; &gt;</div>`.
- Recreate-after-unmount keeps the accepted repeat-render snapshot with the
  original id, then verifies stale old-root render/unmount attempts fail
  closed, a fresh root is distinct, fresh render/unmount complete, and the final
  mutation log includes append/remove/append/remove.
- False-green cases reject escaped raw ids, stale updated ids, missing raw id
  fields, stale stored props ids, dropped stored-props identity, retained ids
  after removal, old-root reuse, old render/unmount success after unmount,
  missing fresh render attr evidence, hostile fresh-render HTML escaping,
  incomplete fresh unmount mutation logs, listener/root marker leaks, stale
  lifecycle labels, and compatibility claims.
- `MASTER_PLAN.md` matches the `main` merge parent (`7d775144`) exactly, so the
  worker branch did not reintroduce stale plan text while preserving the
  accepted Worker 1220 and entangled-transition reports from main.

## Audit / Review Notes

- No nested agents were used.
- The read-only scout guidance was applied: the conflicted files were staged
  after combining accepted lifecycle rows, the recreate row uses index `[5]`,
  `componentTree` is passed through recreate snapshots, and
  `MINIMAL_PUBLIC_DIV_TEXT_REPEAT_RENDER_SNAPSHOT` remains the recreate
  same-root update expectation.
- Manual edits stayed within the assigned public fake-DOM files and this
  report. Non-scope files present in the repair merge are accepted main content
  from the merge parent and were not refactored or dropped.

## Non-Claims

- No broad React DOM public root compatibility is claimed.
- No browser DOM parity, hydration, events, refs, Scheduler, `act`,
  `flushSync`, profiling root, resource, form, controlled input, array,
  fragment, nested host-child, or component-child support is claimed.
- Private bridge and private host-output diagnostics remain evidence only and
  stay separated from public compatibility promotion.

## Risks / Overlap

- Remaining audit risk is merge-review only: the merge commit intentionally
  contains accepted current-main files outside this worker's manual write scope.
  Those files were preserved as merge-parent content.
- The gate now depends on component-tree latest-props identity in the public
  fake-DOM inspection path; this is intentional evidence hardening for the
  existing fake-DOM facade only.

## Recommended Next Tasks

- Keep any future public fake-DOM facade expansion behind explicit
  `compatibilityClaimed: false` rows until a separate browser DOM/root
  compatibility gate exists.
- If additional props are admitted later, add the same raw-vs-serialized and
  stored-props identity split for each prop before broadening the facade.

## Commit Info

- Original implementation commit: `8618da92847fb9527434485631c865d724a08b07`
- Original report commit: `28c474dbdf98bf05b442ffcca3e8ff6af89f4031`
- Repair merge commit: `fec9b390733a8681772afb6192afdb2996dd450b`
- Final verification report update: this commit
