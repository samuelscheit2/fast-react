Worker 866 - function component update host execution

Status: complete

Implemented:
- Added private canary evidence for source-owned useReducer dispatch/render ownership before accepting a single-host update handoff.
- Added a host_work canary path that completes a FunctionComponent-owned HostText/HostComponent update from the test source tree, records the detached host payload, commits the finished work handoff, and executes the host mutation.
- Updated the root_work_loop useReducer single-host update canary to execute through host_work for HostText and HostComponent updates.
- Added negative canaries for stale hook queue/render evidence and missing detached host payload records.

Verification:
- `cargo test -p fast-react-reconciler --all-features use_reducer_single_host_update`
- `cargo test -p fast-react-reconciler --all-features root_work_loop_function_component`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo check`
- `cargo fmt --all --check`
- `git diff --check`
