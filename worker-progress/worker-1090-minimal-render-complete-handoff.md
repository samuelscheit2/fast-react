Worker 1090 progress:

- Added a production-compiled, crate-private minimal render-to-complete handoff in `root_work_loop::complete_handoff`.
- Kept legacy test-host handoffs behind `#[cfg(test)]`.
- Added focused root work-loop tests for successful detached completion, adapter failures, stale render records, and mismatched WIP shapes.
- Public DOM mutation and compatibility remain blocked; no root current/finished-work commit path is wired.
- Follow-up: added live WIP child/text identity validation before adapter or host creation to reject stale same-shape tree replacement.
