import { readFileSync } from "node:fs";

import { DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH } from "./dom-namespace-svg-targets.mjs";

export function stringifyDomNamespaceSvgOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomNamespaceSvgOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedDomNamespaceSvgOracleText(baseUrl));
}

export function readCheckedDomNamespaceSvgOracleText(baseUrl = import.meta.url) {
  return readFileSync(
    new URL(`../${DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomNamespaceSvgOracleAsMarkdown(oracle) {
  const serverLines = oracle.probeModes.map((mode) => {
    const observations = oracle.serverObservations[mode.id] ?? [];
    const okCount = observations.filter(
      (observation) => observation.status === "ok"
    ).length;
    return `- ${mode.id}: ${okCount} server scenarios rendered`;
  });

  const clientLines = oracle.probeModes.map((mode) => {
    const observations = oracle.clientObservations[mode.id] ?? [];
    const okCount = observations.filter(
      (observation) => observation.status === "ok"
    ).length;
    return `- ${mode.id}: ${okCount} fake-DOM client scenarios rendered`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Namespace/SVG Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures server markup and deterministic fake-DOM client host output for namespace, SVG, and MathML behavior; it does not claim Fast React behavior compatibility.",
    "",
    "## Server Output",
    "",
    ...serverLines,
    "",
    "## Client Host Output",
    "",
    ...clientLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findDomNamespaceSvgServerObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.serverObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing dom-namespace-svg server observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findDomNamespaceSvgClientObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.clientObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing dom-namespace-svg client observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
