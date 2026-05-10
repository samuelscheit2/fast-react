# Fast React

Fast React is an experimental Rust-first implementation of React runtime
semantics with JavaScript package facades for the React ecosystem. The project
is building toward React-compatible behavior from the inside out: lanes,
fibers, update queues, hooks, effects, host boundaries, schedulers, test
renderers, and DOM integration are modeled behind conformance-backed gates
before any public compatibility claim is made.

The current compatibility target is React 19.2.6, including the published
`react`, `react-dom`, and related package surfaces.

## Project Status

Fast React is under active development and is not a drop-in replacement for
React today. Some direct package surfaces already expose React-shaped behavior,
while larger renderer paths remain deliberately private, diagnostic, or
fail-closed until they are proven by tests.

The project favors correctness evidence over broad claims:

- Published behavior is checked against React 19.2.6 runtime oracles.
- Internal Rust and JavaScript paths grow behind explicit private diagnostics.
- Public compatibility is only promoted when the relevant conformance gates are
  ready.
- Unsupported behavior should fail loudly instead of silently approximating
  React.

## What Is In This Repository

- `crates/fast-react-core` - renderer-agnostic React data structures such as
  lanes, fibers, flags, hook queues, effect rings, and context state.
- `crates/fast-react-reconciler` - root scheduling, begin/complete work,
  update queues, commit handoff diagnostics, hooks, context, and sync flushing.
- `crates/fast-react-host-config` - typed host capability boundaries and opaque
  host tokens.
- `crates/fast-react-test-renderer` - mutation host support and private
  test-renderer integration evidence.
- `crates/fast-react-napi` and `bindings/node` - placeholder native binding
  surfaces and transport diagnostics for future Node integration.
- `packages/react`, `packages/react-dom`, `packages/react-test-renderer`, and
  `packages/scheduler` - JavaScript package facades and compatibility gates.
- `tests/conformance` and `tests/benchmarks` - oracle, smoke, conformance, and
  benchmark admission tests.

Planning and accepted history live in `MASTER_PLAN.md` and
`MASTER_PROGRESS.md`.

## Getting Started

Requirements:

- Rust 1.95.0
- Node.js 26 or newer
- npm 11 or newer

Install dependencies:

```sh
npm ci --ignore-scripts
```

Run a quick package-surface smoke check:

```sh
npm run test:smoke
```

Run the JavaScript and conformance checks:

```sh
npm run check:js
```

Run the Rust test suite:

```sh
cargo test --workspace --all-features
```

Run the full workspace check:

```sh
npm run check
```

## Development Approach

Fast React uses React 19.2.6 as the behavioral reference. Source inspection is
used for internal model research, while public behavior is validated with
black-box runtime probes and checked-in oracle artifacts.

The implementation is intentionally incremental. A feature usually starts as a
private diagnostic that records the exact boundary shape, ordering, metadata,
or failure mode needed by a future public path. Only after the supporting
runtime, renderer, and conformance coverage are in place should that behavior
be treated as public compatibility.

This keeps the project honest: incomplete renderer behavior stays blocked, but
the underlying architecture can still advance with precise evidence.

## Current Direction

The main objective is a minimal real root render, update, and unmount path. The
active development themes are:

- lane-backed priorities and root lane bookkeeping
- FiberRoot and HostRoot update flow
- function component rendering, hooks, context, and effects
- sync flush and act routing
- host config boundaries and mutation handoff
- test renderer serialization, query, act, and error surfaces
- React DOM root, hydration, event, form, resource, and controlled input
  behavior
- conformance and benchmark coverage before compatibility promotion

## Useful Commands

```sh
npm run test:smoke
npm run check:package-surface
npm run check:benchmarks
npm run test:conformance
npm run check:js
npm run check:rust
npm run check
cargo test --workspace --all-features
```

## Package Notes

The React package facade has its own notes in `packages/react/README.md`.
The native binding placeholder is documented in `bindings/node/README.md`.

## License

This workspace is currently `UNLICENSED`.
