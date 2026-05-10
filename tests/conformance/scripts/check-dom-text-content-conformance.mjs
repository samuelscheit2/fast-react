#!/usr/bin/env node

import {
  formatDomTextContentConformanceGateResult,
  runDomTextContentConformanceGate
} from "../src/dom-text-content-conformance-gate.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/check-dom-text-content-conformance.mjs [--format=text|json]

Run the fail-closed DOM text-content conformance gate.
The command compares only the implemented local private shouldSetTextContent
helper against the checked React DOM 19.2.6 oracle and explicitly skips
unsupported public root, server rendering, and DOM mutation output paths.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";

try {
  const result = runDomTextContentConformanceGate();

  if (format === "text") {
    process.stdout.write(formatDomTextContentConformanceGateResult(result));
  } else if (format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stderr.write(
      `Unsupported DOM text-content gate format: ${JSON.stringify(format)}\n`
    );
    process.exit(1);
  }

  if (!result.ok) {
    process.exit(1);
  }
} catch (error) {
  process.stderr.write(
    `DOM text-content conformance gate failed: ${error.stack ?? error.message}\n`
  );
  process.exit(1);
}
