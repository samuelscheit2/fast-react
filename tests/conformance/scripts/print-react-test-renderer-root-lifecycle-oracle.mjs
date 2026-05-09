#!/usr/bin/env node

import {
  formatReactTestRendererRootLifecycleOracleAsMarkdown,
  readCheckedReactTestRendererRootLifecycleOracle,
  readCheckedReactTestRendererRootLifecycleOracleText
} from "../src/react-test-renderer-root-lifecycle-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-test-renderer-root-lifecycle-oracle.mjs [--format=json|markdown]

Print the checked-in React Test Renderer 19.2.6 root lifecycle oracle artifact.
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
  process.stdout.write(readCheckedReactTestRendererRootLifecycleOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactTestRendererRootLifecycleOracleAsMarkdown(
      readCheckedReactTestRendererRootLifecycleOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React Test Renderer root lifecycle oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
