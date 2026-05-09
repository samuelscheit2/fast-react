import { readFileSync } from "node:fs";

import { DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH } from "./dom-event-delegation-targets.mjs";

export function stringifyDomEventDelegationOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedDomEventDelegationOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedDomEventDelegationOracleText(baseUrl));
}

export function readCheckedDomEventDelegationOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${DOM_EVENT_DELEGATION_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatDomEventDelegationOracleAsMarkdown(oracle) {
  const listenerLines = oracle.probeModes.map((mode) => {
    const observation = oracle.listenerInstallationObservations[mode.id];
    const rootCount = observation.rootContainer.listenerCount;
    const documentCount = observation.ownerDocument.listenerCount;
    return `- ${mode.id}: ${rootCount} root-container listeners, ${documentCount} owner-document listeners`;
  });

  const scenarioLines = oracle.probeModes.map((mode) => {
    const observations = oracle.dispatchObservations[mode.id] ?? [];
    return `- ${mode.id}: ${observations.length} delegated dispatch scenarios`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );
  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React DOM Event Delegation Oracle",
    "",
    "Generated from pinned React DOM 19.2.6 package artifacts. This artifact captures delegated listener installation and synthetic dispatch behavior only; it does not claim Fast React behavior compatibility.",
    "",
    "## Listener Installation",
    "",
    ...listenerLines,
    "",
    "## Dispatch Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Coverage",
    "",
    ...coverageLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findDomEventDelegationInstallation(oracle, modeId) {
  const observation = oracle.listenerInstallationObservations[modeId];
  if (!observation) {
    throw new Error(`Missing DOM event delegation installation probe: ${modeId}`);
  }
  return observation;
}

export function findDomEventDelegationDispatch(oracle, modeId, scenarioId) {
  const observation = oracle.dispatchObservations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing DOM event delegation dispatch probe: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findRegisteredEvent(targetSummary, eventName) {
  const registration = targetSummary.byEvent.find(
    (candidate) => candidate.eventName === eventName
  );
  if (!registration) {
    throw new Error(`Missing listener registration for ${eventName}`);
  }
  return registration;
}
