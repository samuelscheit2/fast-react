# Worker 807: Native No-Load Admission Ledger

## Summary

Added a static/read-only private-admission ledger for the accepted native
no-load and worker-thread guard evidence from Workers 788 and 801, with
context rows for Worker 789 package export blockers and Worker 790 cleanup-hook
identity/stale-evidence blockers.

The ledger pins source/test identifiers for CJS and ESM `worker_threads` /
`node:worker_threads` guards, transitive CJS/ESM and dynamic import attempts,
`.node` extension and dynamic import attempts, and teardown of `Module._load`,
the `.node` loader, and registered module hooks. It also keeps native addon
loading, worker creation, renderer/reconciler execution, public native
execution, package/export compatibility, and stale cleanup-hook acceptance
claims false.

## Changed Files

- `tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
  - New source-token and manifest-only ledger/evaluator for Workers 788, 801,
    789, and 790.
  - Reads durable source/test/package identifiers only; it does not import the
    native placeholder or execute native/worker paths.
- `tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
  - New focused tests for manifest shape, recognized evidence, missing fixture
    evidence, missing teardown guard ids/static ledger drift, and blocked
    native/public/package/stale cleanup-hook claims.
- `worker-progress/worker-807-native-no-load-admission-ledger.md`
  - This handoff report.

## Commands Run

- `get_goal`
- `pwd && git status --short --branch`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `rg --files tests/conformance worker-progress | sort`
- `sed -n ... tests/conformance/src/private-admission-799-sibling-text-js-cjs-ledger.mjs`
- `sed -n ... tests/conformance/test/private-admission-799-sibling-text-js-cjs-ledger.test.mjs`
- `sed -n ... tests/conformance/src/private-admission-778-779-gate.mjs`
- `sed -n ... tests/conformance/test/private-admission-778-779-gate.test.mjs`
- `sed -n ... worker-progress/worker-788-native-no-worker-threads-load-guard.md`
- `sed -n ... worker-progress/worker-801-native-no-load-transitive-matrix.md`
- `sed -n ... worker-progress/worker-789-native-private-subpath-blocklist-refresh.md`
- `sed -n ... worker-progress/worker-790-native-cleanup-hook-identity-tamper-gate.md`
- `sed -n ... bindings/node/test/native-no-load-guard.test.cjs`
- `sed -n ... bindings/node/index.cjs`
- `sed -n ... bindings/node/package.json`
- `sed -n ... tests/smoke/import-entrypoints.mjs`
- `rg -n "CLEANUP_HOOK_IDENTITY|cleanup_hook_identity|private-cleanup-hook-fn|worker-root-handle-cleanup-hook|stale_worker|forged_peer|worker_thread|napi_cleanup" crates/fast-react-napi/src/lib.rs`
- `node --check tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
- `node --check tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
- `node bindings/node/test/native-no-load-guard.test.cjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git status --short`
- `git add tests/conformance/src/private-admission-807-native-no-load-ledger.mjs tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs worker-progress/worker-807-native-no-load-admission-ledger.md`
- `git diff --cached --check`
- `git diff --cached --stat`
- `git commit -m "Add native no-load admission ledger"`
- `git commit --amend --no-edit`
- `git log --oneline -1`
- `git status --short --branch`
- `git diff --check HEAD~1..HEAD`
- Audit follow-up:
  - `sed -n '1,240p' /root/audit_807_native_no_load_ledger` (audit file
    path was unavailable in this worker filesystem)
  - `list_agents` for `/root/audit_807_native_no_load_ledger`
  - `nl -ba tests/conformance/src/private-admission-807-native-no-load-ledger.mjs | sed -n '120,350p'`
  - `node --check tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
  - `node --check tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
  - `node --test tests/conformance/test/private-admission-807-native-no-load-ledger.test.mjs`
  - `rg -n "must |transitive CommonJS|transitive ESM|dynamic ESM|placeholder imports|ERR_PACKAGE_PATH_NOT_EXPORTED|Some\\(\\\"FAST|\\.code ===|must not|requires Module.registerHooks|caught by|surface the blocked|throw before" tests/conformance/src/private-admission-807-native-no-load-ledger.mjs`
  - `npm run check:package-surface`
  - `node tests/smoke/import-entrypoints.mjs`
  - `git diff --check`

## Evidence Gathered

- Focused ledger test passed 5 tests and recognized all source evidence rows.
- Native no-load guard printed
  `Fast React native no-load guard checks passed.`
- Package surface guard printed `package surface snapshot guard passed`.
- Import smoke printed the accepted-entrypoint success line and exited 0.
- `git diff --check` and `git diff --cached --check` passed.
- Source evidence is anchored to:
  - `bindings/node/test/native-no-load-guard.test.cjs` for direct,
    transitive, dynamic, `.node`, and teardown guard identifiers.
  - `bindings/node/index.cjs` for inert native worker-thread and cleanup-hook
    mirror fields with native/renderer/reconciler/public compatibility flags
    false.
  - `tests/smoke/import-entrypoints.mjs` and `bindings/node/package.json` for
    public-only native export map and blocked private subpaths.
  - `crates/fast-react-napi/src/lib.rs` for cleanup-hook identity mismatch and
    tamper rejection identifiers.
- Audit follow-up replaced prose/assertion/error-predicate evidence tokens with
  source-owned function names, fixture filenames/specifiers, fixture field
  names, package export variables/fields, Rust constants, tamper-case field
  names, and blocker field names. The focused ledger test still passes 5 tests.

## Risks Or Blockers

- No blockers.
- Overlap risk is low but present around native no-load/package smoke coverage.
  This change is isolated to a new conformance ledger/test pair and does not
  edit the shared native guard, smoke, package, Rust, renderer, or reconciler
  sources.
- The ledger is intentionally read-only. It proves accepted private evidence
  and blockers are still identifiable; it does not admit public native
  execution or package compatibility.

## Recommended Next Tasks

- Keep this ledger source-only until real native addon loading and worker-thread
  execution are deliberately admitted with separate runtime evidence.
- If future workers rename native guard identifiers, update this ledger in the
  same patch so private evidence remains durable and non-prose.
