#!/usr/bin/env node

import {
  formatRuntimeInventoryAsMarkdown,
  readCheckedRuntimeInventory,
  readCheckedRuntimeInventoryText
} from "../src/runtime-inventory.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-inventory.mjs [--format=json|markdown]

Print the checked-in Fast React runtime/package inventory artifact.
This command does not fetch npm metadata, download tarballs, execute React, or
compare Fast React against React.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedRuntimeInventoryText());
} else if (format === "markdown") {
  process.stdout.write(formatRuntimeInventoryAsMarkdown(readCheckedRuntimeInventory()));
} else {
  process.stderr.write(
    `Unsupported runtime inventory format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
