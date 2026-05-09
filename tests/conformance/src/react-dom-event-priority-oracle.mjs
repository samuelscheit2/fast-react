import { readFileSync } from "node:fs";

import {
  REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH
} from "./react-dom-event-priority-targets.mjs";

export function stringifyReactDomEventPriorityOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactDomEventPriorityOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedReactDomEventPriorityOracleText(baseUrl));
}

export function readCheckedReactDomEventPriorityOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${REACT_DOM_EVENT_PRIORITY_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatReactDomEventPriorityOracleAsMarkdown(oracle) {
  const eventBucketLines = Object.entries(oracle.eventPriorityTable.buckets).map(
    ([bucket, events]) => `- ${bucket}: ${events.length} event names`
  );

  const messageLines = oracle.messageSchedulerPriorityMapping.map(
    (entry) =>
      `- ${entry.schedulerPriorityName}: ${entry.eventPriorityName} (${entry.eventPriorityValue})`
  );

  const comparisonLines = oracle.fastReactComparisonBoundaries.map(
    (entry) => `- ${entry.id}: ${entry.status}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React DOM Event Priority Oracle",
    "",
    "Generated from pinned React 19.2.6 source, checked React DOM npm package evidence, and local Fast React placeholder comparisons. This artifact does not claim Fast React React DOM event compatibility.",
    "",
    "## Event Buckets",
    "",
    ...eventBucketLines,
    "",
    "## Message Scheduler Priority Bridge",
    "",
    ...messageLines,
    "",
    "## Fast React Boundaries",
    "",
    ...comparisonLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findReactDomEventPriorityBucketEntry(oracle, bucket, eventName) {
  const entry = oracle.eventPriorityTable.buckets[bucket]?.find(
    (candidate) => candidate.eventName === eventName
  );
  if (!entry) {
    throw new Error(
      `Missing React DOM event priority bucket entry: ${bucket}:${eventName}`
    );
  }
  return entry;
}

export function findReactDomMessagePriorityMapping(
  oracle,
  schedulerPriorityName
) {
  const entry = oracle.messageSchedulerPriorityMapping.find(
    (candidate) => candidate.schedulerPriorityName === schedulerPriorityName
  );
  if (!entry) {
    throw new Error(
      `Missing React DOM message priority mapping: ${schedulerPriorityName}`
    );
  }
  return entry;
}

export function findReactDomResolveUpdatePriorityCase(oracle, caseId) {
  const entry = oracle.resolveUpdatePriority.cases.find(
    (candidate) => candidate.id === caseId
  );
  if (!entry) {
    throw new Error(`Missing resolveUpdatePriority case: ${caseId}`);
  }
  return entry;
}

export function findReactDomFastReactBoundary(oracle, boundaryId) {
  const entry = oracle.fastReactComparisonBoundaries.find(
    (candidate) => candidate.id === boundaryId
  );
  if (!entry) {
    throw new Error(`Missing Fast React comparison boundary: ${boundaryId}`);
  }
  return entry;
}
