#!/usr/bin/env node

import {
  formatRefObjectOracleAsMarkdown,
  readCheckedRefObjectOracle,
  readCheckedRefObjectOracleText
} from "../src/ref-object-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-ref-object-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 createRef ref-object oracle artifact.
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
  process.stdout.write(readCheckedRefObjectOracleText());
} else if (format === "markdown") {
  process.stdout.write(formatRefObjectOracleAsMarkdown(readCheckedRefObjectOracle()));
} else {
  process.stderr.write(
    `Unsupported ref-object oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
