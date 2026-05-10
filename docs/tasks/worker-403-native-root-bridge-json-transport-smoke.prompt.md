# Worker 403: Native Root Bridge JSON Transport Smoke

Objective: add a narrow JS-to-Rust JSON transport smoke for native root bridge
handoff records that validates create/render/unmount handle-table admissions
without loading a `.node` addon.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 318, 345, and 376 if present.

Write scope: `bindings/node/index.cjs`, `bindings/node/test/*.test.*`,
`crates/fast-react-napi/src/lib.rs`, `crates/fast-react-napi/src/handle_table.rs`,
focused native tests, and
`worker-progress/worker-403-native-root-bridge-json-transport-smoke.md`.

Do not introduce real N-API loading, native renderer execution, or public
native API compatibility.

Verification: run JS syntax checks, `cargo fmt --all --check`,
`cargo test -p fast-react-napi --all-features`,
`npm run check --workspace @fast-react/native`, and `git diff --check`.
