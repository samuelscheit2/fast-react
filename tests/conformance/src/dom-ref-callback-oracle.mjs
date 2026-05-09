import { readFileSync } from "node:fs";

import { DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH } from "./dom-ref-callback-targets.mjs";

export function stringifyDomRefCallbackOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomRefCallbackOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedDomRefCallbackOracleText(baseUrl));
}

export function readCheckedDomRefCallbackOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomRefCallbackOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; captures: ${scenario.captures.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? [];
    const rootErrorCount = observations.reduce(
      (count, observation) =>
        count + (observation.result.result.value?.rootErrors?.length ?? 0),
      0
    );
    return `- ${mode.id}: ${observations.length} observations, ${rootErrorCount} root error reports`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Ref Callback Oracle",
    "",
    "Generated from exact React DOM 19.2.6 artifacts with synchronous createRoot probes against a deterministic DOM shim. This artifact does not claim Fast React behavior compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findDomRefCallbackObservation(oracle, modeId, scenarioId) {
  const observation = oracle.observations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM ref callback observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
