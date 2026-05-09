#!/usr/bin/env node

import {
  formatComponentClassOracleAsMarkdown,
  readCheckedComponentClassOracle,
  readCheckedComponentClassOracleText
} from "../src/component-class-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-component-class-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 Component/PureComponent direct-behavior
oracle artifact. This command does not fetch npm metadata, download tarballs,
execute React, or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedComponentClassOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatComponentClassOracleAsMarkdown(readCheckedComponentClassOracle())
  );
} else {
  process.stderr.write(
    `Unsupported component-class oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
