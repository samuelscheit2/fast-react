#!/usr/bin/env node

import { readCheckedDomTextContentOracle } from "../src/dom-text-content-oracle.mjs";
import { evaluateDomTextContentLocalGate } from "../src/dom-text-content-local-gate.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.has("-h")) {
  process.stdout.write(`Usage: node scripts/check-dom-text-content-local-gate.mjs [--format=json]

Evaluate the local Fast React DOM text-content gate against the checked React
DOM 19.2.6 text-content oracle. The command succeeds only when the local gate
has no premature compatibility claims or private helper mismatches.
`);
  process.exit(0);
}

const formatArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--format="));
const format = formatArg?.slice("--format=".length) ?? "text";

const gate = evaluateDomTextContentLocalGate({
  oracle: readCheckedDomTextContentOracle()
});

if (format === "json") {
  process.stdout.write(`${JSON.stringify(gate, null, 2)}\n`);
} else if (format === "text") {
  const helperRows = gate.localChecks.privateShouldSetTextContentOracleRows;
  const matchedRows = helperRows.filter(
    (row) => row.status === "matches-react-dom"
  );
  const blockedRows = helperRows.filter(
    (row) => row.status === "blocked-unsupported-local-host-type"
  );

  process.stdout.write(
    [
      `DOM text-content local gate: ${gate.status}`,
      `requiredLocalTargetsReady: ${gate.requiredLocalTargetsReady}`,
      `admittedScenarios: ${gate.admittedScenarios.length}`,
      `privateShouldSetTextContent matched rows: ${matchedRows.length}`,
      `privateShouldSetTextContent blocked rows: ${blockedRows
        .map((row) => row.scenarioId)
        .join(", ")}`
    ].join("\n") + "\n"
  );
} else {
  process.stderr.write(
    `Unsupported DOM text-content local gate format: ${JSON.stringify(format)}\n`
  );
  process.exit(1);
}

if (gate.violations.length > 0) {
  process.stderr.write(`${JSON.stringify(gate.violations, null, 2)}\n`);
  process.exit(1);
}
