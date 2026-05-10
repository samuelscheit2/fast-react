#!/usr/bin/env node

import {
  formatReactDomRootRenderE2EConformanceGateResult,
  runReactDomRootRenderE2EConformanceGate
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/check-react-dom-root-render-e2e-conformance.mjs [--format=text|json]

Run the fail-closed React DOM root render/update/unmount E2E conformance gate.
The command regenerates current local Fast React observations, compares local
output to the checked React DOM 19.2.6 oracle only for admitted scenarios, and
keeps unsupported root E2E scenarios blocked rather than treating placeholders
as passing compatibility evidence.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";

try {
  const result = await runReactDomRootRenderE2EConformanceGate();

  if (format === "text") {
    process.stdout.write(
      formatReactDomRootRenderE2EConformanceGateResult(result)
    );
  } else if (format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stderr.write(
      `Unsupported React DOM root render e2e gate format: ${JSON.stringify(format)}\n`
    );
    process.exit(1);
  }

  if (!result.ok) {
    process.exit(1);
  }
} catch (error) {
  process.stderr.write(
    `React DOM root render e2e conformance gate failed: ${error.stack ?? error.message}\n`
  );
  process.exit(1);
}
