# Worker 376: Native Root Bridge Rust Handle Table Handoff

Objective: connect the JS native root bridge handoff records to a narrow Rust
`fast-react-napi` handle-table admission smoke path, proving create/render/
unmount handle state transitions remain aligned.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 318, 319, 345, and 352 if present.

Write scope: `bindings/node/index.cjs`, `bindings/node/test/native-loader.test.cjs`,
`bindings/node/test/native-loader-esm.test.mjs`,
`crates/fast-react-napi/src/lib.rs`, `crates/fast-react-napi/src/handle_table.rs`,
focused tests, and
`worker-progress/worker-376-native-root-bridge-rust-handle-table-handoff.md`.

Do not require a built `.node` addon or claim native renderer execution.

Verification: run JS syntax checks, native loader tests,
`cargo fmt --all --check`, `cargo test -p fast-react-napi --all-features`,
`npm run check --workspace @fast-react/native`, and `git diff --check`.
