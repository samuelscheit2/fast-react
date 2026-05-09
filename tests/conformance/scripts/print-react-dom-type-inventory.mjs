#!/usr/bin/env node

import {
  formatReactDomTypeInventoryAsMarkdown,
  readCheckedReactDomTypeInventory,
  readCheckedReactDomTypeInventoryText
} from "../src/react-dom-type-inventory.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-type-inventory.mjs [--format=json|markdown]

Print the checked-in React DOM declaration/runtime type-gap inventory artifact.
This command does not fetch npm metadata, download tarballs, execute React DOM,
or compare Fast React against React.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomTypeInventoryText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomTypeInventoryAsMarkdown(readCheckedReactDomTypeInventory())
  );
} else {
  process.stderr.write(
    `Unsupported React DOM type inventory format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
