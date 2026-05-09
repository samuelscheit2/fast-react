# worker-089-dom-root-listener-installation-oracle

## Objective

Add deterministic React DOM root and portal listener installation oracle files.

Active goal evidence: `get_goal` reported status `active` with objective `Add deterministic React DOM root and portal listener installation oracle files.` before final verification.

## Summary

Added a deterministic React DOM 19.2.6 oracle for root and portal listener installation side effects. The generator reads the checked runtime inventory, verifies exact `react`, `react-dom`, and `scheduler` npm tarball integrity and file lists, extracts them into an isolated temporary `node_modules` project, and probes each scenario in a separate Node child process for default development and production modes.

Covered behavior:

- `createRoot` installs the all-supported-event listener set on the root container and installs `selectionchange` on the owner document.
- `hydrateRoot` installs the same root-container listener set and owner-document `selectionchange` listener without claiming hydration behavior compatibility.
- `selectionchange` is not installed on root or portal containers.
- Delegated examples `click`, `mousemove`, `wheel`, `touchstart`, and `touchmove` install capture and bubble listeners, including passive option evidence for wheel/touch events.
- The oracle asserts 32 observed non-delegated capture-only root/portal listener events, including `scroll`, `scrollend`, `cancel`, `close`, media events, `invalid`, `load`, `toggle`, `resize`, and `volumechange`.
- Repeated `createRoot` calls on the same container dedupe listener installation through React listening markers.
- Repeated `hydrateRoot` calls and mixed `createRoot` then `hydrateRoot` calls on the same container also dedupe listener installation.
- Multiple roots in one document each receive container listeners while owner-document `selectionchange` remains deduped.
- Same-document and cross-document portals install listener sets on portal containers; cross-document portals install `selectionchange` on the portal owner document.

Intentional gaps:

- No Fast React DOM comparison is claimed.
- Plugin dispatch, synthetic event extraction, bubbling order, batching, `preventDefault`, and `stopPropagation` behavior remain in worker 065's event delegation oracle surface.
- Event priority lane behavior remains in worker 048's oracle surface.
- The deterministic DOM host is not a browser matrix.

## Changed Files

- `tests/conformance/src/react-dom-root-listener-installation-targets.mjs`
- `tests/conformance/src/react-dom-root-listener-installation-scenarios.mjs`
- `tests/conformance/src/react-dom-root-listener-installation-probe-runner.mjs`
- `tests/conformance/src/react-dom-root-listener-installation-oracle-generator.mjs`
- `tests/conformance/src/react-dom-root-listener-installation-oracle.mjs`
- `tests/conformance/scripts/generate-react-dom-root-listener-installation-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-root-listener-installation-oracle.mjs`
- `tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json`
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md`

Write scope honored: all changed files are inside the worker-089 write scope.

## Completion Audit

Prompt-to-artifact checklist:

- Required setup: called `create_goal` before file reads; `get_goal` succeeded and reported the active objective/status. Evidence: tool results in this worker session and this report.
- Required reading: read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 041, worker 044, worker 055, and worker 065 reports. Evidence: commands listed below. `ORCHESTRATOR.md` was not read.
- Oracle source files: added `tests/conformance/src/react-dom-root-listener-installation-*.mjs` target/scenario/probe/generator/helper files. Evidence: `rg --files ... | rg 'react-dom-root-listener-installation|worker-089'`.
- Oracle scripts: added generate and print CLIs under `tests/conformance/scripts/*react-dom-root-listener-installation*.mjs`. Evidence: focused tests verify markdown print and JSON print equality.
- Oracle test: added `tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`. Evidence: `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs` passed 15 tests.
- Checked artifact: added `tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json`. Evidence: generator `--write` refreshed it, then a fresh generation byte-compared equal to the checked artifact.
- Root listener registration: covered by `create-root-root-container` and `hydrate-root-root-container`, listener counts, 85 root event names, delegated capture/bubble examples, passive wheel/touch examples, and root listening marker assertions.
- `selectionchange` owner document registration: covered by owner-document listener assertions, root/portal exclusion checks, and cross-document portal owner-document checks.
- Non-delegated events: covered by 32 observed capture-only non-delegated events in `nonDelegatedEventExamples` and tested against root and portal containers.
- Dedupe behavior: covered by same-container duplicate `createRoot`, duplicate `hydrateRoot`, mixed `createRoot` then `hydrateRoot`, and same-document multi-root scenarios.
- Portal listener installation: covered by same-document and cross-document portal scenarios, including second-render dedupe.
- Dispatch/plugin behavior out of scope: generator and tests assert `pluginDispatchBehaviorProbed`, `syntheticEventDispatchProbed`, and `eventPriorityLaneClaimsIncluded` are false. `flushSync(root.render(createPortal(...)))` is used only to trigger portal mount/listener installation.
- No overlap with worker 065 or active worker 046: file prefix is `react-dom-root-listener-installation-*`, not `dom-event-delegation-*` or `react-dom-client-root-*`.
- Local path leak check: scoped `rg` over changed files found no concrete temp/workspace path leaks.
- Trailing whitespace check: scoped `rg -n "[ \t]$"` over changed files found no matches.
- Diff whitespace checks: `git diff --check` passed after adding the untracked scoped files with `git add --intent-to-add` for the check, then resetting the index.

No missing or weakly verified prompt requirement remains after this audit.

## Evidence Gathered

- The generated artifact records 138 root or portal container listener registrations, 85 event names, 1 owner-document `selectionchange` listener, and 1 passive-support test window listener for `createRoot` and `hydrateRoot` root scenarios in both development and production modes.
- The generated artifact records 32 non-delegated capture-only event names.
- The oracle records development-only duplicate `createRoot` warning evidence without asserting client-root public behavior beyond listener installation side effects.
- The targeted `node --test` suite passed 15 tests covering schema, targets, conformance claims, createRoot/hydrateRoot root registration, non-delegated capture-only events, dedupe, same-document portals, cross-document portals, print CLI behavior, and artifact path leak guards.
- A fresh generator run byte-compared equal to the checked artifact.
- The full conformance workspace test passed 256 tests after adding the new oracle.

## Nested Agent Checks

Two read-only explorer subagents were spawned for hypothesis checks. One confirmed the conformance file structure, JSON metadata conventions, CLI/test conventions, write-scope boundaries, and the need to include untracked files in diff checks. The other independently identified deterministic hydrateRoot, full non-delegated event, and mixed root dedupe behavior. I used those findings to harden this oracle, then verified the final files directly with local commands.

## Commands Run

- `create_goal` for this worker objective.
- `get_goal`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,220p' MASTER_PLAN.md`
- `sed -n '1,220p' MASTER_PROGRESS.md`
- `sed -n '1,220p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,220p' worker-progress/worker-044-react-dom-client-roots-plan.md`
- `sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `sed -n '1,260p' worker-progress/worker-065-dom-event-delegation-oracle.md`
- `git status --short`
- `rg --files tests/conformance worker-progress | rg 'react-dom|dom-event|container|root|oracle|export|type'`
- `sed -n '1,260p' tests/conformance/src/dom-event-delegation-oracle.mjs`
- `sed -n '1,260p' tests/conformance/src/dom-event-delegation-oracle-generator.mjs`
- `sed -n '1,320p' tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle.mjs`
- `sed -n '1,300p' tests/conformance/test/react-dom-portal-oracle.test.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-root-listener-installation-targets.mjs`
- `sed -n '1,320p' tests/conformance/src/react-dom-root-listener-installation-scenarios.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-root-listener-installation-oracle.mjs`
- `sed -n '1,360p' tests/conformance/src/react-dom-root-listener-installation-oracle-generator.mjs`
- `sed -n '1,420p' tests/conformance/src/react-dom-root-listener-installation-probe-runner.mjs`
- `sed -n '421,760p' tests/conformance/src/react-dom-root-listener-installation-probe-runner.mjs`
- `sed -n '761,1080p' tests/conformance/src/react-dom-root-listener-installation-probe-runner.mjs`
- `sed -n '1,280p' tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `sed -n '281,460p' tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-react-dom-root-listener-installation-oracle.mjs`
- `sed -n '1,240p' tests/conformance/scripts/print-react-dom-root-listener-installation-oracle.mjs`
- `node tests/conformance/scripts/generate-react-dom-root-listener-installation-oracle.mjs --write`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node --input-type=module -e "<regenerate React DOM root listener installation oracle and byte-compare checked artifact>"`
- `npm test --workspace @fast-react/conformance`
- `rg -n "<local-and-temp-path-leak-patterns>" tests/conformance/src/react-dom-root-listener-installation-*.mjs tests/conformance/scripts/*react-dom-root-listener-installation*.mjs tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `rg -n "[ \t]$" tests/conformance/src/react-dom-root-listener-installation-*.mjs tests/conformance/scripts/*react-dom-root-listener-installation*.mjs tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `git add --intent-to-add <scoped new files> && git diff --check && git reset -- <scoped new files>`
- `node -e "<print nonDelegatedEventExamples count and names>"`
- `node --input-type=module -e "<print checked oracle scenario IDs, coverage booleans, and observation counts>"`

## Quality Review

Maintainability: the oracle follows the established conformance structure: target constants, scenario list, probe runner, generator, print CLI, checked artifact, and focused `node:test` assertions. Listener-installation scenarios are separated from event dispatch scenarios to keep the behavioral surface narrow.

Performance: generation is bounded by child-process and fetch timeouts. Checked tests read the artifact and do not run network or package extraction unless the generator is explicitly invoked.

Security: package lifecycle scripts are not run. Tarball integrity and file lists are verified before probing. Temporary extraction paths, randomized React listening marker names, and concrete local paths are not serialized.

## Risks Or Blockers

- The minimal DOM host is not a browser-backed event target implementation, so later browser or jsdom probes may still be needed for browser-specific listener option behavior.
- Listener counts are exact for React DOM 19.2.6 and should be regenerated, not hand-edited, if the pinned React DOM version changes.
- Fast React compatibility remains unclaimed until a DOM listener registry and portal mount path exist.

## Recommended Next Tasks

- Use this oracle to guide the first React DOM root and portal listener registry implementation.
- Keep event dispatch/plugin extraction and event-priority lane behavior in their existing oracle surfaces.
- Add browser-backed listener probes later if root listener option behavior becomes sensitive to browser event-target differences.
