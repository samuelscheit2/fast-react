#!/usr/bin/env node

import {
  formatDomStyleDangerousHtmlOracleAsMarkdown,
  readCheckedDomStyleDangerousHtmlOracle,
  readCheckedDomStyleDangerousHtmlOracleText
} from "../src/dom-style-dangerous-html-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-dom-style-dangerous-html-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 DOM style and dangerouslySetInnerHTML oracle artifact.
This command does not fetch npm metadata, download tarballs, execute React
DOM, or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedDomStyleDangerousHtmlOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatDomStyleDangerousHtmlOracleAsMarkdown(
      readCheckedDomStyleDangerousHtmlOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported DOM style/dangerouslySetInnerHTML oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
