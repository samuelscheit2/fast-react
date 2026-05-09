#!/usr/bin/env node

import {
  formatSchedulerVariantOracleAsMarkdown,
  readCheckedSchedulerVariantOracle,
  readCheckedSchedulerVariantOracleText
} from "../src/scheduler-variant-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-scheduler-variant-oracle.mjs [--format=json|markdown]

Print the checked-in scheduler@0.27.0 variant and physical deep-import oracle
artifact. This command does not fetch npm metadata, download tarballs, execute
scheduler code, or claim Fast React scheduler behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedSchedulerVariantOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatSchedulerVariantOracleAsMarkdown(
      readCheckedSchedulerVariantOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported scheduler variant oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
