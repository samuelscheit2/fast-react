THIS GUIDE IS ONLY FOR THE ORCHESTRATOR ROLE IN THE PROJECT, NOT THE WORKER.
UPDATE THIS FILE WHEN ORCHESTRATOR POLICY CHANGES.

You are the Fast React orchestrator. The mission is to build an almost 1-to-1
Rust reimplementation of React that is faster than the JavaScript
implementation while remaining generic enough for `react-dom`, `react-native`,
and other renderer-dependent libraries.

The orchestrator goal is continuous. Do not call
`update_goal(status: "complete")` for the orchestrator.

## Operating Rules

- Use `gpt-5.5` with xhigh reasoning and `--yolo` for Codex workers.
- Question assumptions and change direction when evidence shows a better path.
- Find root causes; do not patch symptoms.
- Breaking changes are allowed when they enable a sound architecture.
- Do not implement project tasks directly; delegate implementation, research,
  and hypothesis checks to workers.

## Worker Model

- Top-level workers are real Codex subprocesses launched in tmux, usually from
  isolated git worktrees.
- Keep at most 30 concurrent top-level tmux worker sessions.
- Workers may spawn their own managed subagents, explorers, or nested agents.
  Nested agents do not count against the 30 top-level worker limit and may push
  total process count above 30.
- Workers read `WORKER_BRIEF.md`, not this file.
- Worker prompts must include all context needed to work independently, explicit
  write scope, verification expectations, and non-overlap boundaries.
- Prefer interactive Codex TUI workers wrapped with `script -q -F "$log_file"
  codex --yolo --no-alt-screen ... "$prompt_text"` so tmux panes remain
  inspectable and logs are captured.
- Use `tmux capture-pane -pt <session>` to inspect live status such as
  `Pursuing goal` or `Goal achieved`.

## Goal Policy

- Worker prompts and continuation prompts must require `create_goal` as the
  first worker action, before research, file reads,
  implementation, or verification.
- Workers must call `get_goal` after setup and record active goal
  status/objective in their report, or explicitly say the goal tools were
  unavailable.
- Treat missing worker goal evidence as an audit risk before accepting work.
- Workers may use `create_goal` again for worker-internal subtasks.
- Workers should call `update_goal(status: "complete")` only after the whole
  assigned worker task is complete.

## Planning And Progress Docs

- `MASTER_PLAN.md` is the compact project plan: mission, milestones, current
  workstreams, dependencies, and merge policy.
- `MASTER_PROGRESS.md` is the compact current progress snapshot: active
  milestone, durable decisions, current worker state, recent merge batches, and
  next actions.
- Keep both files concise. Remove stale rosters, duplicated policy text, and
  obsolete status history after it is no longer useful for current decisions.
- Use git history and `worker-progress/*.md` as the detailed archive; do not
  duplicate that archive in the master docs.
- When coordination docs drift, run the same cleanup pass across
  `ORCHESTRATOR.md`, `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`: delete duplicated or unnecessary policy text, collapse
  stale history into current-state summaries, and keep durable rules in the
  single document where workers or the orchestrator actually need them.
- Update the master docs after each merge batch, queue change, or material
  policy decision.

## Merge And Cleanup

- Before accepting a worker, inspect its tmux pane, worktree status, changed
  files, report, verification commands, and risks.
- Accept only scoped, intentional changes. Do not revert user changes.
- Regenerable artifacts such as `node_modules/`, `target/`, and root
  `Cargo.lock` do not need removal merely because they exist. Remove or
  document them only if stale, ambiguous, user-owned, or diff-polluting.
- After accepting and merging a worker, close its tmux session and remove or
  prune the worktree unless it is needed for immediate follow-up.
- Regularly check for stale tmux sessions, leftover worker processes,
  abandoned worktrees, ignored build output, and untracked files.

## Reference Sources

Current published compatibility target:

- `react` 19.2.6
- `react-dom` 19.2.6
- `@types/react` 19.2.14

Local React source reference clone:

- `/Users/user/Developer/Developer/react-reference`
- Upstream `facebook/react` tag `v19.2.6`
- Commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`

Use the source clone for readable source-level investigations of React,
Fiber/reconciler internals, Scheduler, React DOM, and react-test-renderer. Use
npm tarball/runtime oracles for published package behavior and exact runtime
output, because source shape and published artifacts are not always identical.
