# Worker 1221: Public Fake-DOM Id Update Hardening

## Summary

Hardened the narrow public fake-DOM `createRoot().render(<div id>text</div>)`
facade evidence around hostile id/text serialization and same-root id updates.
The lifecycle gate now records raw `getAttribute("id")`, raw component-tree
stored latest-props id/children, and stored-props identity separately from
escaped `innerHTML`/serialized container output for initial render, id/text
update, id removal update, and rendered-root unmount cleanup.

Compatibility remains explicitly blocked (`compatibilityClaimed: false`). The
change does not broaden browser DOM/root compatibility claims, hydration,
events, refs, Scheduler, `act`, `flushSync`, profiling createRoot, arrays,
fragments, nested/component children, className, object id, or createRoot
options.

## Changed Files

- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`

## Commands Run

- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass, 42/42
- `npm --prefix tests/conformance run root-public-facade:conformance` - pass
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass, 4/4
- `git diff --check` - pass

## Evidence Gathered

- Initial render records raw id as `app&<>"` through both `getAttribute("id")`
  and stored latest props, while serialized output remains
  `app&amp;&lt;&gt;&quot;`.
- Same-root update reuses the host node and records raw id as `next&<>"` in
  `getAttribute("id")` and stored latest props, while `innerHTML` serializes the
  updated id and text.
- Id removal update reuses the same host node, records no raw id attribute or
  stored id prop, and serializes `<div>id removed &amp; &lt; &gt;</div>`.
- False-green cases now reject escaped raw ids, stale updated ids, missing raw
  id fields, stale stored props ids, dropped stored-props identity, retained ids
  after removal, listener side effects, and compatibility claims.

## Audit / Review Notes

- No nested agents were used.
- The implementation stayed in fake-DOM/public-facade conformance and package
  smoke tests; no production source changes were needed.

## Non-Claims

- No broad React DOM public root compatibility is claimed.
- No browser DOM parity, hydration, events, refs, Scheduler, `act`,
  `flushSync`, profiling root, resource, form, controlled input, array,
  fragment, nested host-child, or component-child support is claimed.
- Private bridge and private host-output diagnostics remain evidence only and
  stay separated from public compatibility promotion.

## Risks / Overlap

- Adjacent public fake-DOM conformance files may overlap with another public
  React DOM fake-DOM worker. The changes are self-contained to id update/raw
  serialization evidence and should merge cleanly if similar lifecycle rows are
  preserved.
- The gate now depends on component-tree latest-props identity in the public
  fake-DOM inspection path; this is intentional evidence hardening for the
  existing fake-DOM facade only.

## Recommended Next Tasks

- Keep any future public fake-DOM facade expansion behind explicit
  `compatibilityClaimed: false` rows until a separate browser DOM/root
  compatibility gate exists.
- If additional props are admitted later, add the same raw-vs-serialized and
  stored-props identity split for each prop before broadening the facade.

## Commit Info

- Implementation commit: `8618da92847fb9527434485631c865d724a08b07`
- Report commit: records the implementation hash above.
