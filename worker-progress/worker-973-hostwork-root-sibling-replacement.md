# Worker 973 - Host Work Root Sibling Replacement

## Status

Complete.

## Notes

- Read `WORKER_BRIEF.md`.
- Extended the private root child replacement request shape with explicit placement sibling evidence.
- Added a test-only root replacement helper for `[deleted_text, stable_text] -> [replacement_component, stable_text_wip]`.
- Added canaries for insert-before execution, tampered sibling evidence, stale sibling state, cross-root sibling state, and replay.
- Preserved the accepted private blockers: no public DOM/test-renderer/native/root compatibility claims and no broad keyed/fragments/portals/Suspense/ref/effect claims.

## Verification

- `cargo fmt --all`
- `cargo test -p fast-react-reconciler host_work_root_replacement --all-features`
- `cargo test -p fast-react-reconciler host_work::tests --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo check -p fast-react-reconciler --all-features`

## Risks

- This remains a narrow private/test-host canary. It only admits a stable trailing HostText sibling for root replacement insert-before evidence.
- The current deletion marking path detaches the deleted current sibling chain before commit evidence is requested, so the stable sibling topology proof relies on the finished stable work alternate plus commit placement sibling metadata.
