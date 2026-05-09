#!/usr/bin/env node

import {
  formatReactDomFormActionsOracleAsMarkdown,
  readCheckedReactDomFormActionsOracle,
  readCheckedReactDomFormActionsOracleText
} from "../src/react-dom-form-actions-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-form-actions-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 form-actions oracle artifact. This
command does not fetch npm metadata, download tarballs, execute React DOM, or
claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomFormActionsOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomFormActionsOracleAsMarkdown(
      readCheckedReactDomFormActionsOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM form-actions oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
