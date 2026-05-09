#!/usr/bin/env node

import {
  formatReactDomHydrationMarkerOracleAsMarkdown,
  readCheckedReactDomHydrationMarkerOracle,
  readCheckedReactDomHydrationMarkerOracleText
} from "../src/react-dom-hydration-marker-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-hydration-marker-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 hydration marker and mismatch evidence
oracle artifact. This command does not fetch npm metadata, download tarballs,
execute React DOM, or claim Fast React hydration compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomHydrationMarkerOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomHydrationMarkerOracleAsMarkdown(
      readCheckedReactDomHydrationMarkerOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM hydration marker oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
