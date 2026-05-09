#!/usr/bin/env node

import {
  formatReactTestRendererExportOracleAsMarkdown,
  readCheckedReactTestRendererExportOracle,
  readCheckedReactTestRendererExportOracleText
} from "../src/react-test-renderer-export-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-test-renderer-export-oracle.mjs [--format=json|markdown]

Print the checked-in react-test-renderer 19.2.6 runtime export oracle
artifact. This command does not fetch npm metadata, download tarballs, execute
React, or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactTestRendererExportOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactTestRendererExportOracleAsMarkdown(
      readCheckedReactTestRendererExportOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported react-test-renderer export oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
