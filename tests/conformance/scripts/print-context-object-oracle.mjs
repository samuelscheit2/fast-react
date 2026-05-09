#!/usr/bin/env node

import {
  formatContextObjectOracleAsMarkdown,
  readCheckedContextObjectOracle,
  readCheckedContextObjectOracleText
} from "../src/context-object-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-context-object-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 createContext direct-object oracle artifact.
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
  process.stdout.write(readCheckedContextObjectOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatContextObjectOracleAsMarkdown(readCheckedContextObjectOracle())
  );
} else {
  process.stderr.write(
    `Unsupported context-object oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
