#!/usr/bin/env node

import {
  formatSchedulerPostTaskOracleAsMarkdown,
  readCheckedSchedulerPostTaskOracle,
  readCheckedSchedulerPostTaskOracleText
} from "../src/scheduler-post-task-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-scheduler-post-task-oracle.mjs [--format=json|markdown]

Print the checked-in scheduler 0.27.0 scheduler/unstable_post_task behavior
oracle artifact. This command does not fetch npm metadata, download tarballs,
execute scheduler, or claim Fast React scheduler compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedSchedulerPostTaskOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatSchedulerPostTaskOracleAsMarkdown(
      readCheckedSchedulerPostTaskOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported scheduler-post-task oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
