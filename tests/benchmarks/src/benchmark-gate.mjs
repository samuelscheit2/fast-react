import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const COMPATIBILITY_STATUSES = Object.freeze([
  "blocked-by-conformance",
  "oracle-only",
  "unsupported-placeholder",
  "known-mismatch",
  "matched-but-compatibility-not-claimed",
  "green"
]);

export const TIMING_STATUSES = Object.freeze([
  "not-collected",
  "blocked-by-conformance",
  "diagnostic-only",
  "compared-not-compatible",
  "comparable",
  "noise-bound",
  "regression",
  "improvement"
]);

export const BENCHMARK_READINESS_STATUSES = Object.freeze([
  "blocked-by-conformance",
  "diagnostic-admitted",
  "comparable-admitted"
]);

export const ACCEPTED_GATE_STATUSES = Object.freeze([
  "accepted-blocked",
  "accepted-private-partial",
  "accepted-oracle-only",
  "green-admitted"
]);

export const CLAIM_CAPABLE_TIMING_STATUSES = Object.freeze([
  "comparable",
  "noise-bound",
  "regression",
  "improvement"
]);

export const BLOCKED_BENCHMARK_READINESS_STATUS = "blocked-by-conformance";
export const DIAGNOSTIC_ADMITTED_READINESS_STATUS = "diagnostic-admitted";
export const COMPARABLE_ADMITTED_READINESS_STATUS = "comparable-admitted";
export const GREEN_COMPATIBILITY_STATUS = "green";
export const PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS =
  "matched-but-compatibility-not-claimed";
export const DIAGNOSTIC_TIMING_STATUS = "diagnostic-only";
export const TIMING_DATA_POLICY = "diagnostic-until-compatible";

const RESULT_PROPERTY_NAMES = Object.freeze([
  "schemaVersion",
  "kind",
  "manifestId",
  "generatedTimestampIncluded",
  "scenarioResults"
]);

const SCENARIO_RESULT_PROPERTY_NAMES = Object.freeze([
  "scenarioId",
  "implementation",
  "lane",
  "timingStatus"
]);

const ACCEPTED_GATE_COMMAND_PREFIXES = Object.freeze([
  "cargo test ",
  "node --test ",
  "npm run "
]);

const DEFAULT_BENCHMARK_ROOT = path.resolve(
  fileURLToPath(new URL("..", import.meta.url))
);
const DEFAULT_REPO_ROOT = path.resolve(DEFAULT_BENCHMARK_ROOT, "../..");

export function checkBenchmarkGate(options = {}) {
  const benchmarkRoot = options.benchmarkRoot ?? DEFAULT_BENCHMARK_ROOT;
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const errors = [];

  validateSchemaFiles({ benchmarkRoot }, errors);

  const manifestFiles = listJsonFiles(path.join(benchmarkRoot, "manifests"));
  if (manifestFiles.length === 0) {
    errors.push("No benchmark manifests found under tests/benchmarks/manifests");
  }

  const manifests = manifestFiles.map((filePath) => ({
    filePath,
    manifest: readJsonFile(filePath)
  }));

  const manifestById = new Map();
  for (const { filePath, manifest } of manifests) {
    const manifestErrors = validateBenchmarkManifest(manifest, {
      filePath,
      repoRoot
    });
    errors.push(...manifestErrors);

    if (isPlainObject(manifest) && typeof manifest.manifestId === "string") {
      if (manifestById.has(manifest.manifestId)) {
        errors.push(`Duplicate benchmark manifest id ${manifest.manifestId}`);
      }
      manifestById.set(manifest.manifestId, manifest);
    }
  }

  const resultFiles = listJsonFiles(path.join(benchmarkRoot, "results"), {
    allowMissing: true
  });
  const results = resultFiles.map((filePath) => ({
    filePath,
    result: readJsonFile(filePath)
  }));

  for (const { filePath, result } of results) {
    errors.push(
      ...validateBenchmarkResult(result, {
        filePath,
        manifestById
      })
    );
  }

  return {
    benchmarkRoot,
    repoRoot,
    manifestCount: manifests.length,
    scenarioCount: manifests.reduce(
      (count, entry) =>
        count + (Array.isArray(entry.manifest?.scenarios) ? entry.manifest.scenarios.length : 0),
      0
    ),
    milestoneCount: manifests.reduce(
      (count, entry) =>
        count + (Array.isArray(entry.manifest?.milestones) ? entry.manifest.milestones.length : 0),
      0
    ),
    resultCount: results.length,
    errors,
    manifests: manifests.map((entry) => entry.manifest),
    results: results.map((entry) => entry.result)
  };
}

export function assertBenchmarkGate(options = {}) {
  const result = checkBenchmarkGate(options);
  if (result.errors.length > 0) {
    throw new Error(formatBenchmarkGateErrors(result.errors));
  }
  return result;
}

export function formatBenchmarkGateErrors(errors) {
  return [
    `Benchmark manifest gate failed with ${errors.length} error${errors.length === 1 ? "" : "s"}:`,
    ...errors.map((error) => `- ${error}`)
  ].join("\n");
}

export function validateBenchmarkManifest(manifest, options = {}) {
  const errors = [];
  const label = options.filePath ?? manifest?.manifestId ?? "benchmark manifest";
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;

  if (!isPlainObject(manifest)) {
    return [`${label}: manifest must be a JSON object`];
  }

  requireEqual(manifest.schemaVersion, 1, `${label}: schemaVersion`, errors);
  requireEqual(
    manifest.kind,
    "fast-react-benchmark-manifest",
    `${label}: kind`,
    errors
  );
  requireString(manifest.manifestId, `${label}: manifestId`, errors);
  requireString(manifest.description, `${label}: description`, errors);
  requireEqual(
    manifest.timingDataPolicy,
    TIMING_DATA_POLICY,
    `${label}: timingDataPolicy`,
    errors
  );

  const requiredScenarioIds = validateStringArray(
    manifest.requiredScenarioIds,
    `${label}: requiredScenarioIds`,
    errors
  );
  const requiredScenarioIdSet = new Set(requiredScenarioIds);

  const gates = validateConformanceGates(manifest, { label, repoRoot }, errors);
  const gateById = new Map(gates.map((gate) => [gate.id, gate]));

  if (!Array.isArray(manifest.scenarios)) {
    errors.push(`${label}: scenarios must be an array`);
    return errors;
  }

  const scenarioIds = [];
  for (const scenario of manifest.scenarios) {
    if (!isPlainObject(scenario)) {
      errors.push(`${label}: every scenario must be an object`);
      continue;
    }
    scenarioIds.push(scenario.id);
    validateScenario(scenario, {
      label,
      requiredScenarioIdSet,
      gateById
    }, errors);
  }

  const scenarioIdSet = new Set();
  for (const scenarioId of scenarioIds) {
    if (typeof scenarioId !== "string") {
      continue;
    }
    if (scenarioIdSet.has(scenarioId)) {
      errors.push(`${label}: duplicate scenario id ${scenarioId}`);
    }
    scenarioIdSet.add(scenarioId);
  }

  for (const requiredScenarioId of requiredScenarioIds) {
    if (!scenarioIdSet.has(requiredScenarioId)) {
      errors.push(`${label}: missing required scenario ${requiredScenarioId}`);
    }
  }

  for (const scenarioId of scenarioIdSet) {
    if (!requiredScenarioIdSet.has(scenarioId)) {
      errors.push(`${label}: unexpected scenario ${scenarioId}`);
    }
  }

  validateMilestones(manifest.milestones, {
    label,
    scenarioIdSet,
    gateById
  }, errors);

  return errors;
}

export function validateBenchmarkResult(result, options = {}) {
  const errors = [];
  const label = options.filePath ?? result?.manifestId ?? "benchmark result";
  const manifestById = options.manifestById ?? new Map();

  if (!isPlainObject(result)) {
    return [`${label}: result must be a JSON object`];
  }

  validateAllowedProperties(result, RESULT_PROPERTY_NAMES, label, errors);
  requireEqual(result.schemaVersion, 1, `${label}: schemaVersion`, errors);
  requireEqual(
    result.kind,
    "fast-react-benchmark-result",
    `${label}: kind`,
    errors
  );
  requireEqual(
    result.generatedTimestampIncluded,
    false,
    `${label}: generatedTimestampIncluded`,
    errors
  );
  requireString(result.manifestId, `${label}: manifestId`, errors);

  const manifest = manifestById.get(result.manifestId);
  if (!manifest) {
    errors.push(`${label}: unknown manifestId ${String(result.manifestId)}`);
  }

  if (!Array.isArray(result.scenarioResults)) {
    errors.push(`${label}: scenarioResults must be an array`);
    return errors;
  }

  const scenarioById = new Map(
    (manifest?.scenarios ?? []).map((scenario) => [scenario.id, scenario])
  );
  const gateById = new Map(
    (manifest?.conformanceGates ?? []).map((gate) => [gate.id, gate])
  );
  const requiredScenarioIds = Array.isArray(manifest?.requiredScenarioIds)
    ? manifest.requiredScenarioIds.filter(
        (scenarioId) => typeof scenarioId === "string"
      )
    : [];
  const requiredScenarioIdSet = new Set(requiredScenarioIds);
  const coveredRequiredScenarioIds = new Set();
  const seenScenarioLaneRows = new Set();

  for (const scenarioResult of result.scenarioResults) {
    if (!isPlainObject(scenarioResult)) {
      errors.push(`${label}: every scenario result must be an object`);
      continue;
    }

    const scenarioResultLabel = `${label}: result scenario ${String(
      scenarioResult.scenarioId
    )}`;
    validateAllowedProperties(
      scenarioResult,
      SCENARIO_RESULT_PROPERTY_NAMES,
      scenarioResultLabel,
      errors
    );
    requireString(
      scenarioResult.scenarioId,
      `${label}: scenarioResult.scenarioId`,
      errors
    );
    requireString(
      scenarioResult.implementation,
      `${label}: scenarioResult.implementation`,
      errors
    );
    requireString(scenarioResult.lane, `${label}: scenarioResult.lane`, errors);

    if (
      typeof scenarioResult.scenarioId === "string" &&
      typeof scenarioResult.lane === "string"
    ) {
      const rowKey = `${scenarioResult.scenarioId}\u0000${scenarioResult.lane}`;
      if (seenScenarioLaneRows.has(rowKey)) {
        errors.push(
          `${label}: duplicate result row for scenario ${scenarioResult.scenarioId} lane ${scenarioResult.lane}`
        );
      }
      seenScenarioLaneRows.add(rowKey);
    }

    if (!TIMING_STATUSES.includes(scenarioResult.timingStatus)) {
      errors.push(
        `${label}: unknown timingStatus ${String(
          scenarioResult.timingStatus
        )} for result scenario ${String(scenarioResult.scenarioId)}`
      );
      continue;
    }

    if (
      typeof scenarioResult.scenarioId === "string" &&
      !requiredScenarioIdSet.has(scenarioResult.scenarioId)
    ) {
      errors.push(
        `${scenarioResultLabel}: scenarioId is not listed in manifest.requiredScenarioIds`
      );
    }

    const scenario = scenarioById.get(scenarioResult.scenarioId);
    if (!scenario) {
      errors.push(
        `${label}: result references unknown scenario ${String(
          scenarioResult.scenarioId
        )}`
      );
      continue;
    }

    if (requiredScenarioIdSet.has(scenarioResult.scenarioId)) {
      coveredRequiredScenarioIds.add(scenarioResult.scenarioId);
    }

    const gates = collectScenarioGates(
      scenario,
      gateById,
      scenarioResultLabel,
      errors
    );
    validateResultTimingAdmission(
      scenario,
      scenarioResult.timingStatus,
      gates,
      scenarioResultLabel,
      errors
    );
  }

  for (const requiredScenarioId of requiredScenarioIds) {
    if (!coveredRequiredScenarioIds.has(requiredScenarioId)) {
      errors.push(
        `${label}: missing required scenario result ${requiredScenarioId}`
      );
    }
  }

  return errors;
}

function validateSchemaFiles({ benchmarkRoot }, errors) {
  const vocabulary = readJsonFile(
    path.join(benchmarkRoot, "schema/benchmark-status-vocabulary.json")
  );
  const manifestSchema = readJsonFile(
    path.join(benchmarkRoot, "schema/benchmark-manifest.schema.json")
  );
  const resultSchema = readJsonFile(
    path.join(benchmarkRoot, "schema/benchmark-result.schema.json")
  );

  const compatibilityStatusIds = (vocabulary.compatibilityStatuses ?? []).map(
    (status) => status.id
  );
  const timingStatusIds = (vocabulary.timingStatuses ?? []).map(
    (status) => status.id
  );
  const benchmarkReadinessStatusIds = (
    vocabulary.benchmarkReadinessStatuses ?? []
  ).map((status) => status.id);
  const acceptedGateStatusIds = (vocabulary.acceptedGateStatuses ?? []).map(
    (status) => status.id
  );

  requireExactArray(
    compatibilityStatusIds,
    COMPATIBILITY_STATUSES,
    "benchmark status vocabulary: compatibilityStatuses",
    errors
  );
  requireExactArray(
    timingStatusIds,
    TIMING_STATUSES,
    "benchmark status vocabulary: timingStatuses",
    errors
  );
  requireExactArray(
    manifestSchema.$defs?.compatibilityStatus?.enum,
    COMPATIBILITY_STATUSES,
    "benchmark manifest schema: compatibilityStatus enum",
    errors
  );
  requireExactArray(
    manifestSchema.$defs?.timingStatus?.enum,
    TIMING_STATUSES,
    "benchmark manifest schema: timingStatus enum",
    errors
  );
  requireExactArray(
    resultSchema.$defs?.timingStatus?.enum,
    TIMING_STATUSES,
    "benchmark result schema: timingStatus enum",
    errors
  );
  requireEqual(
    resultSchema.additionalProperties,
    false,
    "benchmark result schema: additionalProperties",
    errors
  );
  requireEqual(
    resultSchema.$defs?.scenarioResult?.additionalProperties,
    false,
    "benchmark result schema: scenarioResult additionalProperties",
    errors
  );
  requireExactArray(
    resultSchema.$defs?.scenarioResult?.required,
    SCENARIO_RESULT_PROPERTY_NAMES,
    "benchmark result schema: scenarioResult required",
    errors
  );
  requireExactArray(
    benchmarkReadinessStatusIds,
    BENCHMARK_READINESS_STATUSES,
    "benchmark status vocabulary: benchmarkReadinessStatuses",
    errors
  );
  requireExactArray(
    manifestSchema.$defs?.benchmarkReadinessStatus?.enum,
    BENCHMARK_READINESS_STATUSES,
    "benchmark manifest schema: benchmarkReadinessStatus enum",
    errors
  );
  requireExactArray(
    acceptedGateStatusIds,
    ACCEPTED_GATE_STATUSES,
    "benchmark status vocabulary: acceptedGateStatuses",
    errors
  );
  requireExactArray(
    manifestSchema.$defs?.acceptedConformanceGate?.properties?.status?.enum,
    ACCEPTED_GATE_STATUSES,
    "benchmark manifest schema: acceptedConformanceGate status enum",
    errors
  );
}

function validateConformanceGates(manifest, { label, repoRoot }, errors) {
  if (!Array.isArray(manifest.conformanceGates)) {
    errors.push(`${label}: conformanceGates must be an array`);
    return [];
  }

  const gates = [];
  const ids = new Set();
  for (const gate of manifest.conformanceGates) {
    if (!isPlainObject(gate)) {
      errors.push(`${label}: every conformance gate must be an object`);
      continue;
    }
    requireString(gate.id, `${label}: conformance gate id`, errors);
    requireString(gate.artifact, `${label}: conformance gate artifact`, errors);
    validateStringArray(
      gate.requiredClaims,
      `${label}: conformance gate ${String(gate.id)} requiredClaims`,
      errors
    );
    validateAcceptedGate(
      gate.acceptedGate,
      `${label}: conformance gate ${String(gate.id)} acceptedGate`,
      errors
    );

    if (typeof gate.id === "string") {
      if (ids.has(gate.id)) {
        errors.push(`${label}: duplicate conformance gate id ${gate.id}`);
      }
      ids.add(gate.id);
    }

    const resolvedArtifact = resolveRepoPath(repoRoot, gate.artifact);
    if (!resolvedArtifact) {
      errors.push(
        `${label}: conformance gate ${String(
          gate.id
        )} artifact must stay under the repository root`
      );
      continue;
    }
    if (!existsSync(resolvedArtifact)) {
      errors.push(
        `${label}: conformance gate ${String(gate.id)} artifact does not exist: ${
          gate.artifact
        }`
      );
      continue;
    }

    const artifact = readJsonFile(resolvedArtifact);
    gates.push({
      ...gate,
      artifactObject: artifact,
      scenarioIds: collectOracleScenarioIds(artifact)
    });
  }

  return gates;
}

function validateScenario(scenario, { label, requiredScenarioIdSet, gateById }, errors) {
  const scenarioLabel = `${label}: scenario ${String(scenario.id)}`;
  requireString(scenario.id, `${scenarioLabel} id`, errors);
  requireString(scenario.area, `${scenarioLabel} area`, errors);
  validateStringArray(scenario.entrypoints, `${scenarioLabel} entrypoints`, errors);
  const gateIds = validateStringArray(
    scenario.conformanceGateIds,
    `${scenarioLabel} conformanceGateIds`,
    errors
  );
  requireString(scenario.blockedReason, `${scenarioLabel} blockedReason`, errors);
  requireEqual(
    scenario.timingDataPolicy,
    TIMING_DATA_POLICY,
    `${scenarioLabel} timingDataPolicy`,
    errors
  );

  if (typeof scenario.id === "string" && !requiredScenarioIdSet.has(scenario.id)) {
    errors.push(`${scenarioLabel}: id is not listed in requiredScenarioIds`);
  }

  if (!COMPATIBILITY_STATUSES.includes(scenario.compatibilityStatus)) {
    errors.push(
      `${scenarioLabel}: unknown compatibilityStatus ${String(
        scenario.compatibilityStatus
      )}`
    );
  }
  if (!TIMING_STATUSES.includes(scenario.timingStatus)) {
    errors.push(
      `${scenarioLabel}: unknown timingStatus ${String(scenario.timingStatus)}`
    );
  } else {
    validateTimingCompatibilityPair(
      scenario.compatibilityStatus,
      scenario.timingStatus,
      scenarioLabel,
      errors
    );
  }

  const gates = [];
  for (const gateId of gateIds) {
    const gate = gateById.get(gateId);
    if (!gate) {
      errors.push(`${scenarioLabel}: unknown conformance gate ${gateId}`);
      continue;
    }
    gates.push(gate);
    if (
      typeof scenario.id === "string" &&
      gate.scenarioIds.size > 0 &&
      !gate.scenarioIds.has(scenario.id)
    ) {
      if (
        !isPrivateDiagnosticScenario(scenario) ||
        !isDiagnosticPrivateAcceptedGate(gate)
      ) {
        errors.push(
          `${scenarioLabel}: conformance gate ${gateId} does not include scenario ${scenario.id}`
        );
      }
    }
  }

  if (scenario.compatibilityStatus === GREEN_COMPATIBILITY_STATUS) {
    validateGateCompatibilityClaims(gates, scenarioLabel, errors);
  }

  if (
    scenario.timingStatus === DIAGNOSTIC_TIMING_STATUS &&
    scenario.compatibilityStatus !== GREEN_COMPATIBILITY_STATUS
  ) {
    if (scenario.compatibilityStatus !== PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS) {
      errors.push(
        `${scenarioLabel}: timingStatus ${DIAGNOSTIC_TIMING_STATUS} requires compatibilityStatus ${PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS} or ${GREEN_COMPATIBILITY_STATUS}`
      );
    } else {
      validateDiagnosticPrivateGateAdmission(gates, scenarioLabel, errors);
    }
  }
}

function validateMilestones(milestones, { label, scenarioIdSet, gateById }, errors) {
  if (milestones === undefined) {
    return;
  }
  if (!Array.isArray(milestones)) {
    errors.push(`${label}: milestones must be an array`);
    return;
  }

  const milestoneIds = new Set();
  for (const milestone of milestones) {
    if (!isPlainObject(milestone)) {
      errors.push(`${label}: every milestone must be an object`);
      continue;
    }

    const milestoneLabel = `${label}: milestone ${String(milestone.id)}`;
    requireString(milestone.id, `${milestoneLabel} id`, errors);
    requireString(milestone.description, `${milestoneLabel} description`, errors);
    requireString(milestone.blockedReason, `${milestoneLabel} blockedReason`, errors);

    if (typeof milestone.id === "string") {
      if (milestoneIds.has(milestone.id)) {
        errors.push(`${label}: duplicate milestone id ${milestone.id}`);
      }
      milestoneIds.add(milestone.id);
    }

    const scenarioIds = validateStringArray(
      milestone.scenarioIds,
      `${milestoneLabel} scenarioIds`,
      errors
    );
    const gateIds = validateStringArray(
      milestone.conformanceGateIds,
      `${milestoneLabel} conformanceGateIds`,
      errors
    );

    for (const scenarioId of scenarioIds) {
      if (!scenarioIdSet.has(scenarioId)) {
        errors.push(`${milestoneLabel}: unknown scenario ${String(scenarioId)}`);
      }
    }

    const gates = [];
    for (const gateId of gateIds) {
      const gate = gateById.get(gateId);
      if (!gate) {
        errors.push(`${milestoneLabel}: unknown conformance gate ${gateId}`);
        continue;
      }
      gates.push(gate);
    }

    if (!COMPATIBILITY_STATUSES.includes(milestone.compatibilityStatus)) {
      errors.push(
        `${milestoneLabel}: unknown compatibilityStatus ${String(
          milestone.compatibilityStatus
        )}`
      );
    }
    if (!TIMING_STATUSES.includes(milestone.timingStatus)) {
      errors.push(
        `${milestoneLabel}: unknown timingStatus ${String(milestone.timingStatus)}`
      );
    } else {
      validateTimingCompatibilityPair(
        milestone.compatibilityStatus,
        milestone.timingStatus,
        milestoneLabel,
        errors
      );
    }

    if (
      !BENCHMARK_READINESS_STATUSES.includes(
        milestone.benchmarkReadinessStatus
      )
    ) {
      errors.push(
        `${milestoneLabel}: unknown benchmarkReadinessStatus ${String(
          milestone.benchmarkReadinessStatus
        )}`
      );
    } else if (
      milestone.benchmarkReadinessStatus === COMPARABLE_ADMITTED_READINESS_STATUS &&
      milestone.compatibilityStatus !== GREEN_COMPATIBILITY_STATUS
    ) {
      errors.push(
        `${milestoneLabel}: benchmarkReadinessStatus ${milestone.benchmarkReadinessStatus} requires compatibilityStatus ${GREEN_COMPATIBILITY_STATUS}`
      );
    } else if (
      milestone.benchmarkReadinessStatus === DIAGNOSTIC_ADMITTED_READINESS_STATUS
    ) {
      if (milestone.timingStatus !== DIAGNOSTIC_TIMING_STATUS) {
        errors.push(
          `${milestoneLabel}: benchmarkReadinessStatus ${DIAGNOSTIC_ADMITTED_READINESS_STATUS} requires timingStatus ${DIAGNOSTIC_TIMING_STATUS}`
        );
      }
      if (
        milestone.compatibilityStatus !== GREEN_COMPATIBILITY_STATUS &&
        milestone.compatibilityStatus !== PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS
      ) {
        errors.push(
          `${milestoneLabel}: benchmarkReadinessStatus ${DIAGNOSTIC_ADMITTED_READINESS_STATUS} requires compatibilityStatus ${PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS} or ${GREEN_COMPATIBILITY_STATUS}`
        );
      }
      if (milestone.compatibilityStatus !== GREEN_COMPATIBILITY_STATUS) {
        validateDiagnosticPrivateGateAdmission(gates, milestoneLabel, errors);
      }
    }

    if (milestone.compatibilityStatus === GREEN_COMPATIBILITY_STATUS) {
      validateGateCompatibilityClaims(gates, milestoneLabel, errors);
    }
  }
}

function validateTimingCompatibilityPair(
  compatibilityStatus,
  timingStatus,
  label,
  errors
) {
  if (
    CLAIM_CAPABLE_TIMING_STATUSES.includes(timingStatus) &&
    compatibilityStatus !== GREEN_COMPATIBILITY_STATUS
  ) {
    errors.push(
      `${label}: timingStatus ${timingStatus} requires compatibilityStatus ${GREEN_COMPATIBILITY_STATUS}`
    );
  }
}

function collectScenarioGates(scenario, gateById, label, errors) {
  if (!Array.isArray(scenario.conformanceGateIds)) {
    errors.push(
      `${label}: manifest scenario conformanceGateIds must be an array`
    );
    return [];
  }

  const gates = [];
  for (const gateId of scenario.conformanceGateIds) {
    const gate = gateById.get(gateId);
    if (!gate) {
      errors.push(`${label}: unknown conformance gate ${String(gateId)}`);
      continue;
    }
    gates.push(gate);
  }
  return gates;
}

function validateResultTimingAdmission(
  scenario,
  timingStatus,
  gates,
  label,
  errors
) {
  validateTimingCompatibilityPair(
    scenario.compatibilityStatus,
    timingStatus,
    label,
    errors
  );

  if (timingStatus === "not-collected") {
    return;
  }

  if (timingStatus === DIAGNOSTIC_TIMING_STATUS) {
    if (!isPrivateDiagnosticScenario(scenario)) {
      errors.push(
        `${label}: diagnostic-only result timing requires a private diagnostic scenario with compatibilityStatus ${PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS} and timingStatus ${DIAGNOSTIC_TIMING_STATUS}; public performance proof is blocked`
      );
      return;
    }
    validateDiagnosticPrivateGateAdmission(gates, label, errors);
    return;
  }

  if (CLAIM_CAPABLE_TIMING_STATUSES.includes(timingStatus)) {
    if (!CLAIM_CAPABLE_TIMING_STATUSES.includes(scenario.timingStatus)) {
      errors.push(
        `${label}: timingStatus ${timingStatus} requires a claim-capable manifest scenario timingStatus`
      );
    }
    if (scenario.compatibilityStatus === GREEN_COMPATIBILITY_STATUS) {
      validateResultGreenGateAdmission(gates, label, errors);
    }
    return;
  }

  if (timingStatus !== scenario.timingStatus) {
    errors.push(
      `${label}: timingStatus ${timingStatus} is not admitted by manifest scenario timingStatus ${String(
        scenario.timingStatus
      )}`
    );
  }
}

function validateResultGreenGateAdmission(gates, label, errors) {
  if (gates.length === 0) {
    errors.push(`${label}: claim-capable timing requires conformance gates`);
    return;
  }

  for (const gate of gates) {
    if (
      gate.acceptedGate?.status !== "green-admitted" ||
      gate.acceptedGate?.admitted !== true ||
      gate.acceptedGate?.compatibilityClaimed !== true
    ) {
      errors.push(
        `${label}: claim-capable timing requires ${gate.id} acceptedGate.status=green-admitted, admitted=true, and compatibilityClaimed=true`
      );
    }
  }
}

function validateAcceptedGate(acceptedGate, label, errors) {
  if (acceptedGate === undefined) {
    return;
  }
  if (!isPlainObject(acceptedGate)) {
    errors.push(`${label} must be an object`);
    return;
  }

  requireString(acceptedGate.id, `${label}.id`, errors);
  requireString(acceptedGate.command, `${label}.command`, errors);
  validateRunnableAcceptedGateCommand(acceptedGate.command, label, errors);
  if (!ACCEPTED_GATE_STATUSES.includes(acceptedGate.status)) {
    errors.push(`${label}: unknown status ${String(acceptedGate.status)}`);
  }
  if (typeof acceptedGate.admitted !== "boolean") {
    errors.push(`${label}.admitted must be a boolean`);
  }
  if (typeof acceptedGate.compatibilityClaimed !== "boolean") {
    errors.push(`${label}.compatibilityClaimed must be a boolean`);
  }
  if (
    acceptedGate.status === "green-admitted" &&
    (acceptedGate.admitted !== true ||
      acceptedGate.compatibilityClaimed !== true)
  ) {
    errors.push(
      `${label}: green-admitted requires admitted=true and compatibilityClaimed=true`
    );
  }
  if (
    acceptedGate.status === "accepted-private-partial" &&
    acceptedGate.compatibilityClaimed !== false
  ) {
    errors.push(
      `${label}: accepted-private-partial requires compatibilityClaimed=false`
    );
  }
  if (
    acceptedGate.status !== "green-admitted" &&
    acceptedGate.status !== "accepted-private-partial" &&
    (acceptedGate.admitted !== false ||
      acceptedGate.compatibilityClaimed !== false)
  ) {
    errors.push(
      `${label}: ${String(
        acceptedGate.status
      )} requires admitted=false and compatibilityClaimed=false`
    );
  }
}

function validateRunnableAcceptedGateCommand(command, label, errors) {
  if (typeof command !== "string" || command.length === 0) {
    return;
  }

  if (/[`$<>;|]/.test(command) || command.includes("||")) {
    errors.push(
      `${label}.command must be runnable command segments joined only with &&`
    );
  }

  const segments = command.split("&&").map((segment) => segment.trim());
  if (
    segments.length === 0 ||
    segments.some((segment) => segment.length === 0)
  ) {
    errors.push(`${label}.command must contain non-empty command segments`);
    return;
  }

  for (const segment of segments) {
    if (
      !ACCEPTED_GATE_COMMAND_PREFIXES.some((prefix) =>
        segment.startsWith(prefix)
      )
    ) {
      errors.push(
        `${label}.command segment ${JSON.stringify(
          segment
        )} must start with npm run, node --test, or cargo test`
      );
    }
  }
}

function validateGateCompatibilityClaims(gates, label, errors) {
  for (const gate of gates) {
    for (const claim of gate.requiredClaims) {
      if (gate.artifactObject?.conformanceClaims?.[claim] !== true) {
        errors.push(
          `${label}: unsupported green compatibility claim; ${gate.id} has conformanceClaims.${claim}=${String(
            gate.artifactObject?.conformanceClaims?.[claim]
          )}`
        );
      }
    }

    if (gate.acceptedGate) {
      if (gate.acceptedGate.admitted !== true) {
        errors.push(
          `${label}: unsupported green compatibility claim; ${gate.id} acceptedGate.admitted=${String(
            gate.acceptedGate.admitted
          )}`
        );
      }
      if (gate.acceptedGate.compatibilityClaimed !== true) {
        errors.push(
          `${label}: unsupported green compatibility claim; ${gate.id} acceptedGate.compatibilityClaimed=${String(
            gate.acceptedGate.compatibilityClaimed
          )}`
        );
      }
    }
  }
}

function validateDiagnosticPrivateGateAdmission(gates, label, errors) {
  if (gates.length === 0) {
    errors.push(`${label}: diagnostic private admission requires conformance gates`);
    return;
  }

  for (const gate of gates) {
    if (!isDiagnosticPrivateAcceptedGate(gate)) {
      errors.push(
        `${label}: diagnostic private admission requires ${gate.id} acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false`
      );
    }
  }
}

function isPrivateDiagnosticScenario(scenario) {
  return (
    scenario.compatibilityStatus === PRIVATE_DIAGNOSTIC_COMPATIBILITY_STATUS &&
    scenario.timingStatus === DIAGNOSTIC_TIMING_STATUS
  );
}

function isDiagnosticPrivateAcceptedGate(gate) {
  return (
    gate.acceptedGate?.status === "accepted-private-partial" &&
    gate.acceptedGate?.admitted === true &&
    gate.acceptedGate?.compatibilityClaimed === false
  );
}

function collectOracleScenarioIds(artifact) {
  const scenarioIds = new Set();
  for (const key of ["scenarios", "serverScenarios", "clientScenarios"]) {
    const scenarios = artifact?.[key];
    if (!Array.isArray(scenarios)) {
      continue;
    }
    for (const scenario of scenarios) {
      if (typeof scenario?.id === "string") {
        scenarioIds.add(scenario.id);
      }
    }
  }
  return scenarioIds;
}

function listJsonFiles(directory, options = {}) {
  if (!existsSync(directory)) {
    if (options.allowMissing) {
      return [];
    }
    return [];
  }
  return readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => path.join(directory, entry))
    .filter((filePath) => statSync(filePath).isFile())
    .sort();
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function resolveRepoPath(repoRoot, candidatePath) {
  if (typeof candidatePath !== "string") {
    return null;
  }
  const resolved = path.resolve(repoRoot, candidatePath);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

function validateStringArray(value, label, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }

  const seen = new Set();
  const strings = [];
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0) {
      errors.push(`${label} must contain non-empty strings`);
      continue;
    }
    if (seen.has(item)) {
      errors.push(`${label} contains duplicate value ${item}`);
    }
    seen.add(item);
    strings.push(item);
  }
  return strings;
}

function requireString(value, label, errors) {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function requireEqual(actual, expected, label, errors) {
  if (actual !== expected) {
    errors.push(`${label} must equal ${JSON.stringify(expected)}`);
  }
}

function requireExactArray(actual, expected, label, errors) {
  if (!Array.isArray(actual)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    errors.push(
      `${label} must equal ${JSON.stringify(expected)}; saw ${JSON.stringify(actual)}`
    );
  }
}

function validateAllowedProperties(value, allowedProperties, label, errors) {
  const allowedPropertySet = new Set(allowedProperties);
  for (const propertyName of Object.keys(value)) {
    if (!allowedPropertySet.has(propertyName)) {
      errors.push(`${label}: unsupported property ${propertyName}`);
    }
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
