# Worker 346 - Package Surface New Private Gates Audit

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective:
  `audit the package-surface and import-entrypoint guards against the new private gates from workers 323-345, adding exact blocklist/allowlist tests only where new private files or accepted diagnostic exports require them`

## Summary

Audited the current package-surface and import-entrypoint guards for new
private package files and diagnostic exports.

No worker 323-345 progress reports or uncommitted sibling-worktree outputs were
present in this checkout, and the shared queue commit only added planning
prompts for workers 323-352. The only current accepted private package file not
covered by the exact React DOM direct-file lists was worker 322's
`packages/react-dom/src/test-utils-act-gate.js`, so the smoke guards now block
that file explicitly as a private direct-file fixture.

No package metadata or package export maps were changed. The broad private
diagnostic deny patterns were not loosened.

## Changed Files

- `tests/smoke/package-surface-guard.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-346-package-surface-new-private-gates-audit.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required prior package-surface reports: workers 165, 231, 258, 290, and
  321.
- Checked for worker 323-345 reports in this branch and sibling worktrees; none
  were present.
- Checked sibling worktree status for workers 323-345; all were clean at the
  shared queue commit.
- Compared `0536f56..HEAD`; the queue commit only changed `MASTER_PLAN.md` and
  worker prompt files, not package code.
- Inspected the current private-looking package file set and package export
  maps. `packages/react-dom/src/test-utils-act-gate.js` was package-private but
  missing from the exact React DOM guard lists.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress
sed -n '<ranges>' worker-progress/worker-165-package-surface-guard.md
sed -n '<ranges>' worker-progress/worker-231-package-surface-react-dom-subpath-tightening.md
sed -n '<ranges>' worker-progress/worker-258-react-test-renderer-package-surface-tightening.md
sed -n '<ranges>' worker-progress/worker-290-package-surface-private-diagnostics-guard.md
sed -n '<ranges>' worker-progress/worker-321-package-surface-private-file-blocklist-hardening.md
sed -n '<ranges>' worker-progress/worker-322-react-dom-test-utils-act-private-routing-gate.md
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs
git status --short --untracked-files=all
git log --oneline --decorate --max-count=60
git worktree list --porcelain
for dir in /Users/user/Developer/Developer/fast-react-worker-{323..345}-*; do git -C "$dir" status --short --untracked-files=all; done
find /Users/user/Developer/Developer -maxdepth 3 -path '*/worker-progress/worker-32[3-9]-*.md' -o -path '*/worker-progress/worker-33[0-9]-*.md' -o -path '*/worker-progress/worker-34[0-5]-*.md'
git diff --stat 0536f56..HEAD
rg --files packages/react packages/react-dom packages/react-test-renderer packages/scheduler bindings/node | rg '(private|diagnostic|diagnostics|gate|bridge|dispatcher|metadata|route|routes|secret|source|src/)' | sort
node -e "<print package exports maps>"
node --check tests/smoke/package-surface-guard.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
git add -N worker-progress/worker-346-package-surface-new-private-gates-audit.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-346-package-surface-new-private-gates-audit.md; exit $rc
```

## Verification Results

- `node --check tests/smoke/package-surface-guard.mjs`: passed.
- `node --check tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package-surface, import smoke,
  benchmark gates, workspace package checks, native loader checks, and 579
  conformance tests.
- `git diff --check`: passed, including the new report through
  intent-to-add.

npm printed the existing `minimum-release-age` config warning during npm
commands; it did not affect results.

## Risks Or Blockers

- No worker 323-345 implementation outputs were available to audit in this
  checkout. If those workers later add package-private files or accepted
  diagnostic exports, this audit should be rerun after their changes land.
- `@fast-react/react-test-renderer` and `scheduler` remain no-exports packages,
  so adding physical JS private files there would still be a public subpath risk
  and should be guarded in the same change.

## Recommended Next Tasks

1. Re-run this package-surface audit when worker 323-345 code changes or final
   reports are actually present.
2. Keep new private package files in exact direct-file blocklists when they are
   introduced, without broadening the diagnostic deny patterns.

## Delegated Checks

No nested agents or explorer subagents were used.
