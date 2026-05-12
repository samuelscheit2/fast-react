# worker-1228-native-metadata-no-load-source-ledger

## Summary

- Repaired the source audit blocker found after `715cd49e`: the product-side
  source-currentness validator no longer accepts full canonical row sets when
  extra omitted claim fields are `true`.
- The validator now rejects the exact omitted fields
  `workerThreadLoadAttempted`, `childProcessLoadAttempted`,
  `httpLoadAttempted`, `httpsLoadAttempted`,
  `publicRuntimeExecutionClaimed`, `nativeLoadAttempted`,
  `cleanupHookExecutionClaimed`, and `packageExportsChanged`, plus the
  related modeled `runtimeExecutionClaimed` alias.
- Direct native tests now prove a complete canonical row set with each exact
  omitted field set to `true` is rejected before accepted-row freezing can drop
  the extra field.
- Conformance now includes the exact omitted names in the 1228 blocked-claim
  list, source/evidence tokens, claim classification, and hostile negative
  expectations.

## Changed Files

- `bindings/node/index.cjs`
- `bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs`
- `tests/conformance/src/private-admission-1228-native-metadata-no-load-source-ledger.mjs`
- `tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs`
- `worker-progress/worker-1228-native-metadata-no-load-source-ledger.md`

## Evidence Gathered

- Product-side validation checks the omitted public/runtime, native-load,
  worker/child/network-load, cleanup-hook, and package-export claim names before
  canonical source row acceptance.
- Hostile direct native coverage feeds the validator a full canonical row set
  and flips one omitted claim field at a time; every case reports zero accepted
  rows, a rejected canonical set, and the expected rejection code.
- The conformance manifest now treats the exact omitted names as blocked claims
  and verifies they are categorized into native runtime, worker/child/network,
  cleanup-hook, and package-export claim buckets.
- The previous report statement of no blockers was stale; this report records
  the audit blocker and the repair evidence.

## Commands Run

- `git worktree add -b worker/1228-native-metadata-no-load-source-ledger /Users/user/Developer/Developer/fast-react-worktrees/worker-1228-native-metadata-no-load-source-ledger 715cd49e` - passed after the merged 1228 worktree/branch had been pruned.
- `git -C /Users/user/Developer/Developer/fast-react-worktrees/worker-1228-native-metadata-no-load-source-ledger commit --allow-empty -m "Repair native metadata source ledger exact claim blockers"` - passed; later amended with the real repair.
- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs && node --check tests/conformance/src/private-admission-1228-native-metadata-no-load-source-ledger.mjs && node --check tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs` - passed.
- `node bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs` - passed.
- `node --test tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs` - passed, 6 tests.
- `npm --prefix bindings/node run check` - passed; npm emitted the existing `minimum-release-age` warning.
- `node tests/smoke/package-surface-guard.mjs` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `cargo test -p fast-react-napi --lib root_work_loop_finished_work_metadata` - passed, 13 tests.
- `git diff --check` - passed.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- Source audit found a High blocker in `715cd49e`: full canonical row sets with
  omitted true claim fields could be accepted, then accepted-row freezing
  erased those extra fields.
- The audit also found that direct and conformance tests missed the exact names
  `workerThreadLoadAttempted`, `childProcessLoadAttempted`,
  `httpLoadAttempted`, `httpsLoadAttempted`,
  `publicRuntimeExecutionClaimed`, `nativeLoadAttempted`,
  `cleanupHookExecutionClaimed`, and `packageExportsChanged`.
- During this repair, the assigned branch/worktree had already been merged and
  pruned. I recreated the requested worktree at `715cd49e`, then kept all
  source edits inside that assigned checkout.

## Risks Or Blockers

- No remaining blockers found after the required verification set.
- Residual risk is limited to the intended static source-currentness model:
  these checks still do not load native artifacts or claim public native,
  package, worker, network, renderer, cleanup-hook, or React behavior execution.

## Recommended Next Tasks

- Re-run the orchestrator source audit against this repair commit before merge.
