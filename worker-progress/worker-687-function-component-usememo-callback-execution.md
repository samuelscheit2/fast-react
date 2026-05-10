# Worker 687: Function Component useMemo/useCallback Execution

## Goal Evidence

- `create_goal` was called as the first action for this worker objective before
  research, file reads, implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private Rust execution evidence
  for function-component useMemo and useCallback dependency reuse across update
  renders, keeping hook behavior private and blocked from public compatibility
  claims.

## Summary

- Added private Rust canaries proving `useMemo` and `useCallback` reuse across
  consecutive update renders.
- Each canary first performs a changed update render, binds that update hook
  list as the next current list, then performs a second update with matching
  dependencies and verifies the prior update value/callback is reused.
- Kept the behavior private: no public JS package, conformance, passive/layout
  effect, context propagation, or begin-work changes were made. Unsupported
  public hook propagation remains covered by the existing
  `function_component_render_propagates_unsupported_hooks_context_and_thrown_values`
  canary.
- Intentionally unsupported edge cases remain unchanged: public hook dispatch
  facades, hook execution from JS packages, broad hook-order recovery, and
  commit/root integration for these memo/callback paths are still blocked.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `worker-progress/worker-687-function-component-usememo-callback-execution.md`

## Evidence Gathered

- `private_use_memo_reuses_recomputed_value_across_update_renders_when_deps_match`
  verifies a changed `useMemo` update stores value `901`, then a later update
  with matching deps reuses `901` instead of requested value `902`.
- `private_use_callback_reuses_replaced_callback_across_update_renders_when_deps_match`
  verifies a changed `useCallback` update stores callback `911`, then a later
  update with matching deps reuses `911` instead of requested callback `912`.
- Both tests assert update-phase hook state, hook-list traversal, diagnostic
  current-list handoff, opaque hook payload, and actual function-component
  invocation records for both renders.

## Risks Or Blockers

- No blocker found.
- The canaries still use private hook stores and manual current-list binding;
  they do not claim public React hook compatibility or root commit integration.

## Recommended Next Tasks

- Add root-work-loop or commit handoff evidence only after function-component
  memo/callback ownership is admitted beyond private hook-store execution.
- Keep package-surface/private-admission checks blocking public `useMemo` and
  `useCallback` compatibility until JS facade execution exists.

## Commands Run And Results

```sh
cargo test -p fast-react-reconciler --all-features across_update_renders -- --nocapture
```

Passed: 2 tests, 0 failed.

```sh
cargo fmt --all
```

Passed.

```sh
cargo test -p fast-react-reconciler --all-features function_component -- --nocapture
```

Passed: 104 tests, 0 failed.

```sh
cargo fmt --all --check
```

Passed.

```sh
git diff --check
```

Passed.

```sh
rg -n "<<<<<<<|=======|>>>>>>>" --glob '!target' --glob '!node_modules' --glob '!*.codex.log'
```

Returned historical command examples in older `worker-progress` reports because
the scan was intentionally broad and unanchored. A scoped anchored marker check
was run after this report was written.

```sh
found=0; while IFS= read -r file; do [ -z "$file" ] && continue; if rg -n '^(<<<<<<<|=======|>>>>>>>)($| )' "$file"; then found=1; fi; done < <({ git diff --name-only; git ls-files --others --exclude-standard; }); if [ "$found" -eq 1 ]; then echo 'conflict markers found'; exit 1; else echo 'no conflict markers in changed files'; fi
```

Passed: no conflict markers in changed files.

```sh
git diff --check
```

Passed after writing this report.

## Delegation

- No nested agents were spawned for this worker.
