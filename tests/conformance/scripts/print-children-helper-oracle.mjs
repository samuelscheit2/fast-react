#!/usr/bin/env node

import {
  formatChildrenHelperOracleAsMarkdown,
  readCheckedChildrenHelperOracle,
  readCheckedChildrenHelperOracleText
} from "../src/children-helper-oracle.mjs";

const formatArg = process.argv.find((arg) => arg.startsWith("--format="));
const format = formatArg ? formatArg.slice("--format=".length) : "json";

if (format === "json") {
  process.stdout.write(readCheckedChildrenHelperOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatChildrenHelperOracleAsMarkdown(readCheckedChildrenHelperOracle())
  );
} else {
  throw new Error(`Unsupported format: ${format}`);
}
