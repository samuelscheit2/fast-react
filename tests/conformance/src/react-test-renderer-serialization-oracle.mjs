import { readFileSync } from "node:fs";

import {
  REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
  REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH
} from "./react-test-renderer-serialization-targets.mjs";

export function stringifyReactTestRendererSerializationOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedReactTestRendererSerializationOracle(
  baseUrl = import.meta.url
) {
  const oracle = JSON.parse(
    readCheckedReactTestRendererSerializationOracleText(baseUrl)
  );
  assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(oracle);
  return oracle;
}

export function assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(
  oracle
) {
  const violations =
    validateReactTestRendererSerializationOracleLocalFastReactStatus(oracle);
  if (violations.length > 0) {
    throw new Error(
      [
        "Checked react-test-renderer serialization oracle has stale or unsafe local Fast React status.",
        `violations=${violations.map((violation) => violation.id).join(",")}`
      ].join(" ")
    );
  }
}

export function validateReactTestRendererSerializationOracleLocalFastReactStatus(
  oracle
) {
  const violations = [];
  const actual = oracle?.localFastReactStatus;
  const expected = REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS;

  if (!actual || typeof actual !== "object") {
    return [
      {
        id: "local-fast-react-status-missing",
        reason: "The oracle must record the source-owned local Fast React status."
      }
    ];
  }

  for (const key of Object.keys(expected)) {
    if (actual[key] !== expected[key]) {
      violations.push({
        id: "local-fast-react-status-source-mismatch",
        field: key,
        expected: expected[key],
        actual: actual[key]
      });
    }
  }

  appendLocalFastReactStatusClaimViolations({
    status: actual,
    fields: REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
    id: "local-fast-react-status-claims-fast-react-comparison",
    reason:
      "The React-only serialization oracle must not claim a Fast React comparison.",
    violations
  });
  appendLocalFastReactStatusClaimViolations({
    status: actual,
    fields:
      REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS,
    id: "local-fast-react-status-claims-compatibility",
    reason:
      "The React-only serialization oracle must not claim Fast React react-test-renderer compatibility.",
    violations
  });
  appendOracleClaimViolations({
    status: oracle?.conformanceClaims,
    source: "oracle.conformanceClaims",
    comparisonViolationId:
      "oracle-conformance-claims-fast-react-comparison",
    compatibilityViolationId:
      "oracle-conformance-claims-compatibility",
    violations
  });
  appendOracleClaimViolations({
    status: oracle?.evidenceClaims,
    source: "oracle.evidenceClaims",
    comparisonViolationId: "oracle-evidence-claims-fast-react-comparison",
    compatibilityViolationId: "oracle-evidence-claims-compatibility",
    violations
  });

  return violations;
}

function appendOracleClaimViolations({
  status,
  source,
  comparisonViolationId,
  compatibilityViolationId,
  violations
}) {
  appendLocalFastReactStatusClaimViolations({
    status,
    fields: REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPARISON_CLAIM_FIELDS,
    id: comparisonViolationId,
    reason:
      "The React-only serialization oracle must not claim a Fast React comparison.",
    source,
    violations
  });
  appendLocalFastReactStatusClaimViolations({
    status,
    fields:
      REACT_TEST_RENDERER_SERIALIZATION_FAST_REACT_COMPATIBILITY_CLAIM_FIELDS,
    id: compatibilityViolationId,
    reason:
      "The React-only serialization oracle must not claim Fast React react-test-renderer compatibility.",
    source,
    violations
  });
}

function appendLocalFastReactStatusClaimViolations({
  status,
  fields,
  id,
  reason,
  source,
  violations
}) {
  if (!status || typeof status !== "object") {
    return;
  }

  for (const field of fields) {
    if (Object.hasOwn(status, field) && status[field] !== false) {
      const violation = {
        id,
        field,
        reason
      };
      if (source) {
        violation.source = source;
      }
      violations.push(violation);
    }
  }
}

export function readCheckedReactTestRendererSerializationOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(
      `../${REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH}`,
      baseUrl
    ),
    "utf8"
  );
}

export function formatReactTestRendererSerializationOracleAsMarkdown(oracle) {
  const observationLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? [];
    return `- ${mode.id}: ${observations.length} observations using ${mode.mountStrategy}`;
  });

  const coverageLines = Object.entries(oracle.coverage).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React React Test Renderer Serialization Oracle",
    "",
    "Generated from pinned React 19.2.6, react-test-renderer 19.2.6, and scheduler 0.27.0 package tarballs. This artifact captures public toJSON, toTree, and TestInstance serialization/query behavior without claiming Fast React compatibility.",
    "",
    "## Observations",
    "",
    ...observationLines,
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

export function findReactTestRendererSerializationObservation(
  oracle,
  modeId,
  scenarioId
) {
  const observation = oracle.observations[modeId]?.find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  if (!observation) {
    throw new Error(
      `Missing react-test-renderer serialization observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}
