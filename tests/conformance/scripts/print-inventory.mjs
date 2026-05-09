#!/usr/bin/env node

import {
  createInventoryPlaceholder,
  formatInventoryPlaceholderAsMarkdown,
  stringifyInventoryPlaceholder
} from "../src/inventory-targets.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-inventory.mjs [--format=json|markdown]

Print the deterministic Fast React conformance inventory placeholder.
This command does not fetch npm metadata, download tarballs, execute React, or
compare Fast React against React.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";
const inventory = createInventoryPlaceholder();

if (format === "json") {
  process.stdout.write(stringifyInventoryPlaceholder(inventory));
} else if (format === "markdown") {
  process.stdout.write(formatInventoryPlaceholderAsMarkdown(inventory));
} else {
  process.stderr.write(
    `Unsupported inventory placeholder format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
