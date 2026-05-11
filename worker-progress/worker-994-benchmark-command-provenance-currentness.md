# Worker 994: Benchmark Command Provenance Currentness

## Summary

Hardened benchmark accepted-gate command validation so benchmark result
admission cannot rely on stale or caller-shaped command evidence. Accepted
commands are now tied to the current benchmark gate repository root, npm
commands are checked against current package script provenance and target
files, Node commands must select accepted `node:test` files, and Cargo filters
must select current Rust tests rather than only matching an allowlist string.
Audit repair replaced the raw text checks with lexical checks so commented-out,
inert-string, regex-literal, arrow-function regex-literal, and member-call
`node:test` spoofs do not prove command currentness. Rust current-test
selection now walks Cargo test roots and enabled external module declarations
instead of scanning every `.rs` under a crate, then masks `macro_rules!`
templates and rejects tests guarded by statically-disabled `#[cfg(FALSE)]`
attributes before treating a Cargo filter as current.

Repair follow-up hardens two additional audit gaps. Accepted `node --test`
targets must now register at least one top-level current `node:test` test name
through the imported/required test binding, so an empty file that only imports
`node:test` cannot satisfy currentness. Rust `cfg` evaluation now fails closed
unless a cfg expression is definitely enabled for the current host and the
all-features test lane; target-gated tests such as
`#[cfg(target_os = "definitely_not_this_os")]` and unknown custom cfg names no
longer count as runnable Cargo tests.

Benchmark result validation also rechecks manifest accepted-gate command
provenance when a caller supplies a manifest map directly, so diagnostic result
rows cannot bypass manifest command validation through stale manifest metadata.
No benchmark result artifacts were added, and public performance claims remain
blocked.

Second repair follow-up closes two additional currentness spoof gaps. Node
`node:test` registration now only trusts bindings declared in the top-level
scope used by the accepted top-level test registration call, so a nested
`require("node:test")` cannot satisfy a top-level `test(...)` call. Rust test
discovery now tracks module item context and ignores `#[test] fn` declarations
inside ordinary function/block bodies while still admitting module and top-level
test items Cargo registers.

## Changed Files

- `tests/benchmarks/src/benchmark-gate.mjs`
  - Rejects unsupported accepted-gate metadata properties such as caller-supplied
    `cwd` and `env`.
  - Requires accepted-gate command validation to use the current benchmark gate
    repo root/module rather than caller-shaped package context.
  - Binds accepted npm commands to current package names, package paths, exact
    script commands, and current script/gate target files.
  - Requires Node accepted-gate targets to be accepted repo test files that
    import `node:test` through real top-level direct import/require tokens
    rather than comments, strings, regex literals, member calls, or inert text.
  - Requires those Node targets to register at least one current top-level
    `node:test` test name through the imported default/named/namespace binding
    or direct `require("node:test")` binding.
  - Keeps `node:test` binding collection scoped to top-level declarations so
    nested imports or requires cannot prove top-level registrations are
    runnable.
  - Scans current Rust crate tests after stripping comments and string/char
    literals, following Cargo roots and enabled external module declarations,
    masking `macro_rules!` definitions, and rejecting disabled cfg test items
    plus disabled inline/external enclosing modules, then rejects accepted Cargo
    filters that select no current tests.
  - Counts only Rust test functions found in module/top-level item context,
    ignoring inner function declarations that `rustc --test` warns about and
    does not register.
  - Evaluates static Rust cfg predicates for the all-features test lane and
    current host target, while failing closed for unknown cfg names or
    unrecognized cfg expressions instead of treating them as enabled.
  - Revalidates manifest accepted-gate command provenance from
    `validateBenchmarkResult`.
- `tests/benchmarks/test/benchmark-gate.test.mjs`
  - Adds negative coverage for direct result validation with stale manifest
    command provenance.
  - Adds negative coverage for npm aliases, env-prefixed commands, prefix-only
    command tails, source-module Node targets, caller-shaped `cwd`/`env`
    evidence, fake package command context, and Cargo filters that select no
    current tests.
  - Adds audit regressions for commented-out/inert-string `node:test` imports
    plus regex-only, arrow-function regex-only, and member-call `node:test`
    spoofs.
  - Adds hostile empty-import, require-only, hook-only, and non-top-level
    registration probes for accepted Node test targets.
  - Adds a nested `node:test` require binding spoof where a top-level
    registration call is not actually runnable.
  - Adds audit regressions for commented-out/inert-string Rust test functions,
    disabled `#[cfg(FALSE)]` tests, disabled `#[cfg(FALSE)]` inline modules,
    disabled `#[cfg(FALSE)] mod disabled;` external module files, and uninvoked
    `macro_rules!` test templates.
  - Adds an inner Rust `#[test] fn` spoof that `rustc --test` warns about and
    does not register.
  - Adds hostile Rust `target_os = "definitely_not_this_os"` and unknown custom
    cfg probes for accepted Cargo filters.
  - Adds a focused orphan-file regression where an empty `src/lib.rs` plus an
    undeclared `src/orphan.rs` test no longer proves Cargo command currentness.

## Commands Run

- `node --check tests/benchmarks/src/benchmark-gate.mjs`
- `node --check tests/benchmarks/test/benchmark-gate.test.mjs`
- `node --test tests/benchmarks/test/benchmark-gate.test.mjs`
- `node tests/benchmarks/scripts/check-benchmark-manifests.mjs`
- `npm run check:benchmarks`
- Hostile Node probe: a copied current test target containing only
  `import test from "node:test";` now returns `does not register a current
  node:test test name` through the focused benchmark gate regression.
- Hostile Cargo probe: empty temporary `src/lib.rs` plus undeclared
  `src/orphan.rs` test returned `0 tests, 0 benchmarks` for the accepted
  filter.
- Hostile Cargo cfg probes: accepted `root_commit_finished_work` filters with
  `#[cfg(target_os = "definitely_not_this_os")]` and unknown custom cfg
  attributes now select no current tests.
- Hostile Node scope probe: `node --test` against a temp file with
  `import "node:test"`, nested `const { test } = require("node:test")`, and a
  top-level `test(...)` failed with `ReferenceError: test is not defined`.
- Hostile Rust inner-test probe: `rustc --test` warned `cannot test inner
  items` for `fn inert() { #[test] fn root_commit_finished_work_inner_only() {}
  }`, and the compiled test binary reported `running 0 tests`.
- `git diff --check`
- `git diff --cached --check`

## Evidence Gathered

- Focused benchmark gate test passes with 31/31 tests.
- Full benchmark check passes with 71/71 benchmark tests.
- Manifest checker still reports 13 manifests, 150 scenarios, 34 milestones,
  and 0 result artifacts.
- Public benchmark manifests still stay blocked, diagnostic-only remains
  private, required scenario coverage is still enforced, and duplicate result
  rows remain rejected.
- The new spoof regressions prove regex-only `node:test`, arrow-function
  regex-only `node:test`, `obj.require`, empty `node:test` imports, hook-only
  Node files, disabled cfg Rust tests, disabled target/unknown cfg Rust tests,
  disabled cfg inline/external module tests, and macro-template Rust tests are
  rejected as non-current evidence.
- The latest regressions additionally reject nested `node:test` require
  bindings that are not in scope for a top-level registration call and inner
  Rust `#[test] fn` declarations that Cargo/rustc do not register.
- The orphan Rust probe confirms Cargo does not run a matching `#[test]` in an
  undeclared `src/orphan.rs`, and the validator now rejects the same shape.

## Risks Or Blockers

- Future accepted npm commands must be added to the command provenance table
  with exact package script and target-file currentness metadata.
- The Cargo currentness check is intentionally static and follows ordinary Cargo
  roots plus enabled external `mod name;` files. Unusual `#[path]` modules,
  nested external declarations inside inline modules, or test-generating macros
  would need an explicit validator update before they can serve as benchmark
  command evidence.
- Rust cfg currentness intentionally recognizes only common host/test-lane
  predicates and treats unrecognized cfg as disabled until the validator learns
  a precise current-host interpretation.

## Recommended Next Tasks

- If benchmark result artifacts are introduced later, add runner-owned command
  execution provenance to the result schema rather than widening result rows
  with ad hoc timing or command fields.
