#!/usr/bin/env node

import {
  formatSchedulerRootOracleAsMarkdown,
  readCheckedSchedulerRootOracle,
  readCheckedSchedulerRootOracleText
} from "../src/scheduler-root-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-scheduler-root-oracle.mjs [--format=json|markdown]

Print the checked-in scheduler 0.27.0 public root behavior oracle artifact. The
artifact includes local Fast React behavior comparisons, but this command does
not fetch npm metadata, download tarballs, execute scheduler, or claim broad
Fast React scheduler compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedSchedulerRootOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatSchedulerRootOracleAsMarkdown(readCheckedSchedulerRootOracle())
  );
} else {
  process.stderr.write(
    `Unsupported scheduler-root oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
