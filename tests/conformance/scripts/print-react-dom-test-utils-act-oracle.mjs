#!/usr/bin/env node

import {
  formatReactDomTestUtilsActOracleAsMarkdown,
  readCheckedReactDomTestUtilsActOracle,
  readCheckedReactDomTestUtilsActOracleText
} from "../src/react-dom-test-utils-act-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-test-utils-act-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 react-dom/test-utils.act oracle artifact.
This command does not fetch npm metadata, download tarballs, execute React DOM,
or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomTestUtilsActOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomTestUtilsActOracleAsMarkdown(
      readCheckedReactDomTestUtilsActOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM test-utils act oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
