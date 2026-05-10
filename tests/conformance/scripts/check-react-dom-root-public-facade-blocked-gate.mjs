#!/usr/bin/env node

import {
  formatReactDomRootPublicFacadeBlockedGateResult,
  runReactDomRootPublicFacadeBlockedGate
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/check-react-dom-root-public-facade-blocked-gate.mjs [--format=text|json]

Run the fail-closed React DOM public root facade gate. The command compares the
accepted client-root and root-render E2E oracle prerequisites with the current
Fast React public placeholder and private root-bridge record-only boundaries.
It keeps createRoot, hydrateRoot, root.render, root.unmount, DOM mutation,
listener setup, and compatibility claims blocked.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";

try {
  const result = await runReactDomRootPublicFacadeBlockedGate();

  if (format === "text") {
    process.stdout.write(
      formatReactDomRootPublicFacadeBlockedGateResult(result)
    );
  } else if (format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stderr.write(
      `Unsupported React DOM root public facade gate format: ${JSON.stringify(format)}\n`
    );
    process.exit(1);
  }

  if (!result.ok) {
    process.exit(1);
  }
} catch (error) {
  process.stderr.write(
    `React DOM root public facade blocked gate failed: ${error.stack ?? error.message}\n`
  );
  process.exit(1);
}
