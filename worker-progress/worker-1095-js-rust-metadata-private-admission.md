## Worker 1095 - JS Rust Metadata Private Admission

Status: implemented and verified locally.

Changes:
- Added private facade root work-loop metadata option admission for `rustRootWorkLoopFinishedWorkMetadata`.
- Added package coverage for `<div>text</div>` through the private facade render/native handoff path, with public root, native execution, reconciler execution, hydration, event, ref, marker, listener, and compatibility claims kept false.
- Added a private root work-loop commit handoff conformance admission row for the JS/package-side Rust metadata consumption evidence.
- Follow-up audit fix rejects Rust-shaped root work-loop metadata before payload storage when caller-provided public/native/DOM capability claim fields are truthy.
- Follow-up alias fix rejects snake_case capability claim aliases such as `compatibility_claimed`, `public_root_execution`, and `native_execution` before raw metadata payload storage.

Verification:
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-render-e2e:conformance`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-public-facade:conformance`
- `git diff --check`
