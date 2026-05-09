#!/usr/bin/env node

import {
  formatElementObjectOracleAsMarkdown,
  readCheckedElementObjectOracle,
  readCheckedElementObjectOracleText
} from "../src/element-object-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-element-object-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 element-object oracle artifact.
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
  process.stdout.write(readCheckedElementObjectOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatElementObjectOracleAsMarkdown(readCheckedElementObjectOracle())
  );
} else {
  process.stderr.write(
    `Unsupported element-object oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
