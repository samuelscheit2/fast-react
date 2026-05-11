# Worker 814 React Act Expired/Delayed Negative Matrix

## Status

- Implemented focused React private act consumer negative coverage for expired and delayed Scheduler mock diagnostics.
- Hardened the React private gate so package/public Scheduler flush helper claims are rejected by the shared private-claim predicates.
- Required own top-level Scheduler diagnostics brand symbols, rejecting inherited/private-symbol lookalikes before source-proof fallback.
- Added delayed act/root summary checks tying delayed root id/label/lane fields back to the nested expired metadata.
- Added React act consumer matrix coverage for stale Scheduler diagnostics, cloned validators, inherited and private-symbol aliases, stale request id/sequence/root id clones, foreign delayed renderer-root rows, mixed expired/delayed evidence, package/public claims, renderer/effect execution claims, public act/root claims, and public Scheduler timing/flush helper claims.
- Public `React.act`, renderer root execution, effects execution, public Scheduler task flushing, and public Scheduler flush-helper behavior remain blocked.

## Verification

- `node --check packages/react/private-act-dispatcher-gate.js`
- `node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs`
- `npm run check --workspace @fast-react/react`
- `git diff --check`

Note: the literal `npm pkg get scripts --workspace react` lookup failed because this repo's workspace is named `@fast-react/react`; the actual React workspace check passed.

## Risks

- React act and Scheduler mock diagnostics are active overlap areas; merge conflicts are possible around `packages/react/private-act-dispatcher-gate.js` and `tests/conformance/test/react-act-oracle.test.mjs`.
- The new stale request id/sequence clone cases intentionally reject by Scheduler source-proof because those request fields are only authoritative while Scheduler owns the report; stale root id clones additionally fail the delayed/nested expired metadata consistency check.
