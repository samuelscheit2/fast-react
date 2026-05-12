# Worker 1060 React DOM Resource/Form Test Split

Status: complete

## Summary

- Split `packages/react-dom/test/resource-form-unsupported-gates.test.js` into a benchmark-compatible shim plus non-test shard modules under `packages/react-dom/test/resource-form-unsupported-gates/`.
- Moved the shared setup, oracle loading, source paths, fake DOM helpers, summarizers, and assertion helpers into `helpers.js`.
- Kept the original target file as the accepted benchmark path with a direct top-level `node:test` registration for the first oracle evidence test.
- Required shard modules in original registration order: internals, form actions, controlled input, resource hints, root bridge/public entry.
- No production source or package surface files were changed.

## Changed Files

- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates/helpers.js`
- `packages/react-dom/test/resource-form-unsupported-gates/internals.js`
- `packages/react-dom/test/resource-form-unsupported-gates/form-actions.js`
- `packages/react-dom/test/resource-form-unsupported-gates/controlled-input.js`
- `packages/react-dom/test/resource-form-unsupported-gates/resource-hints.js`
- `packages/react-dom/test/resource-form-unsupported-gates/root-bridge-public-entry.js`
- `worker-progress/worker-1060-react-dom-resource-form-test-split.md`

## Commands Run

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && for f in packages/react-dom/test/resource-form-unsupported-gates.test.js packages/react-dom/test/resource-form-unsupported-gates/*.js; do node --check "$f" || exit 1; done`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm run check:benchmarks`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm test --workspace @fast-react/react-dom`
- `git diff --check`
- `git diff --cached --check`
- Ordered registration comparison against `HEAD:packages/react-dom/test/resource-form-unsupported-gates.test.js` with `rg`/`diff`.

## Evidence Gathered

- Focused target passed: `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js` reported 61 tests, 61 pass, 0 fail.
- React DOM workspace passed: `npm test --workspace @fast-react/react-dom` reported 232 tests, 232 pass, 0 fail, plus smoke entrypoint checks.
- Benchmark gate passed: 13 manifests, 150 scenarios, 34 milestones, 0 result artifacts; benchmark tests reported 74 pass, 0 fail.
- `git diff --check` and `git diff --cached --check` passed with no whitespace errors.
- Ordered test-name comparison confirmed the split still registers the same 61 test names in the original order.

## Audit And Findings

- No nested agents were used.
- Initial focused run found `pathToFileURL` missing from the generated helper exports after the split. Added it to `helpers.js` and shard destructuring, then reran syntax and focused tests successfully.

## Risks Or Blockers

- No blockers.
- The shards are deliberately non-`.test.js`; they are only registered through the benchmark target shim to avoid duplicate discovery.
- Shard files share a broad destructured helper prelude to keep the moved test bodies behavior-preserving and mechanically close to the original file.

## Recommended Next Tasks

- Orchestrator should reconcile with any parallel edits from workers 1061/1062 before merging, especially if they also touch React DOM tests.
