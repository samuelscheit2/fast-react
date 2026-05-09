#!/usr/bin/env node

import {
  formatWrapperObjectOracleAsMarkdown,
  readCheckedWrapperObjectOracle,
  readCheckedWrapperObjectOracleText
} from "../src/wrapper-object-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-wrapper-object-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 memo/lazy wrapper-object oracle artifact.
This command does not fetch npm metadata, download tarballs, execute React, or
claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedWrapperObjectOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatWrapperObjectOracleAsMarkdown(readCheckedWrapperObjectOracle())
  );
} else {
  process.stderr.write(
    `Unsupported wrapper-object oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
