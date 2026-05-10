# Worker 552: Native JSON Batch Response Sequence

## Objective

Add private native JSON transport batch response sequence diagnostics for
request/response ordering and deterministic error rows without loading a native
addon.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted native transport, batched JSON, worker-thread teardown, and package
surface guards.

## Write Scope

- `bindings/`
- `crates/fast-react-napi/src/`
- Focused native transport tests
- `worker-progress/worker-552-native-json-batch-response-sequence.md`

## Requirements

- Record batch id, request order, response order, error row status, teardown
  state, and blocked native execution flags.
- Do not require a compiled native addon for JS smoke tests.

## Verification

- Focused `fast-react-napi` Rust tests
- Native workspace smoke/import checks
- `cargo fmt --all --check`
- `git diff --check`

