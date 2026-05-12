# worker-1156-native-react-dom-render-handoff-admission

## Progress

- Added a symbol-private CommonJS admission canary for React DOM render native handoff metadata.
- The canary validates create/render native request rows through the existing native root bridge request shape gate using only `[createRecord, renderHandoff.nativeRequestRecord]`.
- Added separate fail-closed checks for private React DOM render handoff status, blocked public root rendering, exact Worker 1147 root work-loop metadata JSON keys, and public/native/browser-DOM compatibility claim smuggling.
- Added the focused addon test to `bindings/node` check coverage.
- Repaired claim-smuggling admission to scan string and symbol keys with `Reflect.ownKeys`, including the audited public root, addon DOM, native DOM, and browser DOM execution claim fields.
- Moved the admission canary from implicit `precheck` execution into the explicit native `check` script and aligned package/script guards.

## Verification

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix bindings/node run check` passed. npm emitted the existing `minimum-release-age` config warning.
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node tests/smoke/package-surface-guard.mjs` passed.
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` passed: 77 passed.
- `git diff --check` passed.
