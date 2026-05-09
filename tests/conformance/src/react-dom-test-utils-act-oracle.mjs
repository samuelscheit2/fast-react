import { readFileSync } from "node:fs";

import { REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH } from "./react-dom-test-utils-act-targets.mjs";

export function stringifyReactDomTestUtilsActOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomTestUtilsActOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedReactDomTestUtilsActOracleText(baseUrl));
}

export function readCheckedReactDomTestUtilsActOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomTestUtilsActOracleAsMarkdown(oracle) {
  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.actObservations[mode.id] ?? [];
    const okCalls = observations.filter(
      (observation) => observation.result?.call?.status === "ok"
    ).length;
    const throwCalls = observations.filter(
      (observation) => observation.result?.call?.status === "throws"
    ).length;
    return `- ${mode.id}: ${observations.length} scenarios, ${okCalls} top-level ok calls, ${throwCalls} top-level throwing calls`;
  });

  const scenarioLines = oracle.scenarios.map(
    (scenario) => `- ${scenario.id}: ${scenario.area}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Test Utils Act Oracle",
    "",
    "Generated from pinned React DOM 19.2.6, React 19.2.6, and Scheduler 0.27.0 package artifacts. This artifact captures observable `react-dom/test-utils.act` wrapper behavior and does not claim Fast React compatibility.",
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomTestUtilsActObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.actObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing react-dom/test-utils.act observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
