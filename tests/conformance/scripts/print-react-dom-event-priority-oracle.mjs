#!/usr/bin/env node

import {
  formatReactDomEventPriorityOracleAsMarkdown,
  readCheckedReactDomEventPriorityOracle,
  readCheckedReactDomEventPriorityOracleText
} from "../src/react-dom-event-priority-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-event-priority-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 event-name and update-priority oracle.
This command does not fetch source, download tarballs, execute React DOM, or
claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomEventPriorityOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomEventPriorityOracleAsMarkdown(
      readCheckedReactDomEventPriorityOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM event priority oracle format: ${JSON.stringify(
      format
    )}\n`
  );
  process.exit(1);
}
