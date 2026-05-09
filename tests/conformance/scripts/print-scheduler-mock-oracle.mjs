#!/usr/bin/env node

import {
  formatSchedulerMockOracleAsMarkdown,
  readCheckedSchedulerMockOracle,
  readCheckedSchedulerMockOracleText
} from "../src/scheduler-mock-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-scheduler-mock-oracle.mjs [--format=json|markdown]

Print the checked-in scheduler@0.27.0 scheduler/unstable_mock behavior oracle
artifact. This command does not fetch npm metadata, download tarballs, execute
scheduler code, or claim Fast React scheduler compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedSchedulerMockOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatSchedulerMockOracleAsMarkdown(readCheckedSchedulerMockOracle())
  );
} else {
  process.stderr.write(
    `Unsupported scheduler mock oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
