# Worker 345: Native Root Bridge Real Handle Admission Preflight

Objective: add a private preflight that maps JS root bridge request-shape
records to the Rust native handle validation model more directly, while still
not loading a native addon or executing renderer work.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 190, 232, 256, 269, 281, 318,
and 319.

Write scope: `bindings/node/index.cjs`, `bindings/node/index.mjs`,
`bindings/node/test/native-loader.test.cjs`,
`bindings/node/test/native-loader-esm.test.mjs`,
`crates/fast-react-napi/src/lib.rs` only if metadata alignment is required,
and `worker-progress/worker-345-native-root-bridge-real-handle-admission-preflight.md`.

Do not add `.node` loading, N-API registration, or platform package behavior.

Verification: run JS syntax checks, native loader tests, `npm run check
--workspace @fast-react/native`, `cargo test -p fast-react-napi
--all-features` if Rust changes, and `git diff --check`.
