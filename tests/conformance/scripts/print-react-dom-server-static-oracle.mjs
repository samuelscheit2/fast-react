#!/usr/bin/env node

import {
  formatReactDomServerStaticOracleAsMarkdown,
  readCheckedReactDomServerStaticOracle,
  readCheckedReactDomServerStaticOracleText
} from "../src/react-dom-server-static-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-server-static-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 server/static behavior oracle artifact.
This command does not fetch npm metadata, download tarballs, execute React DOM,
or claim Fast React DOM server compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomServerStaticOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomServerStaticOracleAsMarkdown(
      readCheckedReactDomServerStaticOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM server/static oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
