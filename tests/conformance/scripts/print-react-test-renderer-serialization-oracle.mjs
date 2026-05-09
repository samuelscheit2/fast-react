#!/usr/bin/env node

import {
  formatReactTestRendererSerializationOracleAsMarkdown,
  readCheckedReactTestRendererSerializationOracle,
  readCheckedReactTestRendererSerializationOracleText
} from "../src/react-test-renderer-serialization-oracle.mjs";

if (
  process.argv.length > 3 ||
  (process.argv[2] && !process.argv[2].startsWith("--format="))
) {
  process.stderr.write(`Usage: node scripts/print-react-test-renderer-serialization-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 react-test-renderer serialization oracle
artifact. This command does not fetch npm metadata, download tarballs, or run
React package code.
`);
  process.exit(1);
}

const format = process.argv[2]?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactTestRendererSerializationOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactTestRendererSerializationOracleAsMarkdown(
      readCheckedReactTestRendererSerializationOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported react-test-renderer serialization oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
