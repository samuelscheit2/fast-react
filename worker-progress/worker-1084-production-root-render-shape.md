# Worker 1084 - Production Root Render Shape

## Scope

- Added a crate-internal production render helper that routes through `RootElementSource` and `resolve_root_element`.
- The helper only admits the narrow `HostRoot -> HostComponent -> HostText` work-in-progress shape.
- Public DOM mutation and compatibility remain blocked; the helper records `public_compatibility_claimed = false` and does not commit or mutate host containers.

## Follow-Up Contract

- Next complete-work integration can consume `render_host_root_for_lanes_with_minimal_root_element` from `root_work_loop`.
- The returned record proves a fresh HostRoot WIP with one HostComponent child and one HostText child, with HostComponent `PLACEMENT` bubbled to HostRoot.
- The returned record preserves `RootHostTextChild::text()` via `text_child_text()` while the WIP fiber carries the text props handle, matching the existing test-host fiber shape.
