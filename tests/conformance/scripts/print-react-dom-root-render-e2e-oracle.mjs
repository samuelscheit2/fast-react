#!/usr/bin/env node

import {
  formatReactDomRootRenderE2EOracleAsMarkdown,
  readCheckedReactDomRootRenderE2EOracle,
  readCheckedReactDomRootRenderE2EOracleText
} from "../src/react-dom-root-render-e2e-oracle.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/print-react-dom-root-render-e2e-oracle.mjs [--format=json|markdown]

Print the checked-in React DOM 19.2.6 root render/update/unmount e2e oracle
artifact. This command does not fetch npm metadata, download tarballs, execute
React DOM, or claim Fast React behavior compatibility.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "json";

if (format === "json") {
  process.stdout.write(readCheckedReactDomRootRenderE2EOracleText());
} else if (format === "markdown") {
  process.stdout.write(
    formatReactDomRootRenderE2EOracleAsMarkdown(
      readCheckedReactDomRootRenderE2EOracle()
    )
  );
} else {
  process.stderr.write(
    `Unsupported React DOM root render e2e oracle format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}
