#!/usr/bin/env node

import {
  formatReactTestRendererErrorSurfaceOracleAsMarkdown,
  readCheckedReactTestRendererErrorSurfaceOracle,
  readCheckedReactTestRendererErrorSurfaceOracleText
} from "../src/react-test-renderer-error-surface-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-test-renderer-error-surface-oracle.mjs [--format=json|markdown]

Print the checked-in React 19.2.6 react-test-renderer public error surface
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
  process.stdout.write(readCheckedReactTestRendererErrorSurfaceOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactTestRendererErrorSurfaceOracleAsMarkdown(
      readCheckedReactTestRendererErrorSurfaceOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React test renderer error surface oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
