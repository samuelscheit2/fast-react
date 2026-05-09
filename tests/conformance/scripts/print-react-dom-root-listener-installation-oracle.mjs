#!/usr/bin/env node

import {
  formatReactDomRootListenerInstallationOracleAsMarkdown,
  readCheckedReactDomRootListenerInstallationOracle,
  readCheckedReactDomRootListenerInstallationOracleText
} from "../src/react-dom-root-listener-installation-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-root-listener-installation-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 root and portal listener installation
oracle artifact. This command does not fetch npm metadata, download tarballs,
execute React DOM, dispatch events, or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomRootListenerInstallationOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomRootListenerInstallationOracleAsMarkdown(
      readCheckedReactDomRootListenerInstallationOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM root listener installation oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
