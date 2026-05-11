import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync
} from "node:fs";
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

const ACCEPTED_GATE_PROPERTY_NAMES = Object.freeze([
  "id",
  "status",
  "command",
  "admitted",
  "compatibilityClaimed",
  "notes"
]);

const NPM_RUN_SCRIPT_PATTERN = /^[a-z0-9][a-z0-9:-]*$/;
const NPM_WORKSPACE_NAME_PATTERN =
  /^(?:@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)$/;
const NODE_TEST_PATH_PATTERN =
  /^(?:packages|tests)\/[A-Za-z0-9._/-]+\.(?:js|mjs)$/;
const CARGO_PACKAGE_PATTERN = /^fast-react-[a-z0-9-]+$/;
const JAVASCRIPT_IDENTIFIER_PATTERN = /[A-Za-z0-9_$]/;
const JAVASCRIPT_REGEX_PREFIX_KEYWORDS = Object.freeze(
  new Set([
    "await",
    "case",
    "delete",
    "else",
    "in",
    "instanceof",
    "of",
    "return",
    "throw",
    "typeof",
    "void",
    "yield"
  ])
);
const JAVASCRIPT_REGEX_PREFIX_PUNCTUATORS = Object.freeze(
  new Set(["(", "{", "[", ",", ";", ":", "=", "=>", "!", "?", "&", "|"])
);
const NODE_TEST_REGISTRATION_NAMES = Object.freeze(
  new Set(["describe", "it", "test"])
);
const RUST_TEST_ITEM_PATTERN =
  /((?:\s*#\s*\[[^\]]+\]\s*)+)(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_][A-Za-z0-9_]*)/g;
const RUST_EXTERNAL_MODULE_PATTERN =
  /((?:#\s*\[[^\]]+\]\s*)*)(?:pub(?:\([^)]*\))?\s+)?mod\s+((?:r#)?[A-Za-z_][A-Za-z0-9_]*)\s*;/g;
const RUST_ATTRIBUTE_PATTERN = /#\s*\[([^\]]+)\]/g;
const RUST_HOST_CFG_VALUES = Object.freeze({
  target_arch: rustHostTargetArch(process.arch),
  target_endian: rustHostTargetEndian(process.arch),
  target_env: rustHostTargetEnv(process.platform),
  target_family: rustHostTargetFamily(process.platform),
  target_os: rustHostTargetOs(process.platform),
  target_pointer_width: rustHostTargetPointerWidth(process.arch),
  target_vendor: rustHostTargetVendor(process.platform)
});

const ACCEPTED_NPM_COMMAND_SEGMENTS = Object.freeze(new Set([
  "npm run check --workspace @fast-react/native",
  "npm run check --workspace scheduler",
  "npm run dom-text-content:conformance --workspace @fast-react/conformance",
  "npm run root-public-facade:conformance --workspace @fast-react/conformance",
  "npm run root-render-e2e:conformance --workspace @fast-react/conformance",
  "npm run test:react-test-renderer:serialization --workspace @fast-react/conformance"
]));

const ACCEPTED_NPM_COMMAND_PROVENANCE = Object.freeze(new Map([
  [
    "npm run check --workspace @fast-react/native",
    {
      packageName: "@fast-react/native",
      packageJsonPath: "bindings/node/package.json",
      scriptName: "check",
      scriptCommand:
        "node ./test/native-loader.test.cjs && node ./test/native-no-load-guard.test.cjs && node ./test/native-loader-esm.test.mjs",
      currentTargets: [
        "bindings/node/test/native-loader.test.cjs",
        "bindings/node/test/native-no-load-guard.test.cjs",
        "bindings/node/test/native-loader-esm.test.mjs"
      ]
    }
  ],
  [
    "npm run check --workspace scheduler",
    {
      packageName: "scheduler",
      packageJsonPath: "packages/scheduler/package.json",
      scriptName: "check",
      scriptCommand: "node ../../tests/smoke/import-entrypoints.mjs",
      currentTargets: ["tests/smoke/import-entrypoints.mjs"]
    }
  ],
  [
    "npm run dom-text-content:conformance --workspace @fast-react/conformance",
    {
      packageName: "@fast-react/conformance",
      packageJsonPath: "tests/conformance/package.json",
      scriptName: "dom-text-content:conformance",
      scriptCommand: "node scripts/check-dom-text-content-conformance.mjs",
      currentTargets: [
        "tests/conformance/scripts/check-dom-text-content-conformance.mjs",
        "tests/conformance/src/dom-text-content-conformance-gate.mjs"
      ]
    }
  ],
  [
    "npm run root-public-facade:conformance --workspace @fast-react/conformance",
    {
      packageName: "@fast-react/conformance",
      packageJsonPath: "tests/conformance/package.json",
      scriptName: "root-public-facade:conformance",
      scriptCommand:
        "node scripts/check-react-dom-root-public-facade-blocked-gate.mjs",
      currentTargets: [
        "tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs",
        "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs"
      ]
    }
  ],
  [
    "npm run root-render-e2e:conformance --workspace @fast-react/conformance",
    {
      packageName: "@fast-react/conformance",
      packageJsonPath: "tests/conformance/package.json",
      scriptName: "root-render-e2e:conformance",
      scriptCommand:
        "node scripts/check-react-dom-root-render-e2e-conformance.mjs",
      currentTargets: [
        "tests/conformance/scripts/check-react-dom-root-render-e2e-conformance.mjs",
        "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs"
      ]
    }
  ],
  [
    "npm run test:react-test-renderer:serialization --workspace @fast-react/conformance",
    {
      packageName: "@fast-react/conformance",
      packageJsonPath: "tests/conformance/package.json",
      scriptName: "test:react-test-renderer:serialization",
      scriptCommand:
        "node --test test/react-test-renderer-serialization-oracle.test.mjs src/react-test-renderer-serialization-local-gate.test.mjs",
      currentTargets: [
        "tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs",
        "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs"
      ]
    }
  ]
]));

const ACCEPTED_NODE_TEST_TARGETS = Object.freeze(new Set([
  "packages/react-dom/test/dom-property-operations-private.test.js",
  "packages/react-dom/test/events-private.test.js",
  "packages/react-dom/test/hydration-boundary.test.js",
  "packages/react-dom/test/hydration-private.test.js",
  "packages/react-dom/test/react-dom-private-root-bridge-shell.test.js",
  "packages/react-dom/test/resource-form-unsupported-gates.test.js",
  "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs",
  "tests/conformance/test/act-passive-local-gate.test.mjs",
  "tests/conformance/test/dom-controlled-input-oracle.test.mjs",
  "tests/conformance/test/dom-event-delegation-oracle.test.mjs",
  "tests/conformance/test/dom-property-payload-helper.test.mjs",
  "tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs",
  "tests/conformance/test/element-object-oracle.test.mjs",
  "tests/conformance/test/react-act-oracle.test.mjs",
  "tests/conformance/test/react-dom-client-root-oracle.test.mjs",
  "tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs",
  "tests/conformance/test/react-dom-create-portal-local-gate.test.mjs",
  "tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs",
  "tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs",
  "tests/conformance/test/react-dom-form-actions-oracle.test.mjs",
  "tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs",
  "tests/conformance/test/react-dom-resource-hints-oracle.test.mjs",
  "tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs",
  "tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs",
  "tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs",
  "tests/conformance/test/react-hook-dispatcher-guard.test.mjs",
  "tests/conformance/test/react-hook-dispatcher-oracle.test.mjs",
  "tests/conformance/test/react-test-renderer-act-oracle.test.mjs",
  "tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs",
  "tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs",
  "tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs",
  "tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs",
  "tests/conformance/test/scheduler-mock-oracle.test.mjs",
  "tests/conformance/test/scheduler-native-entry-oracle.test.mjs",
  "tests/conformance/test/scheduler-post-task-oracle.test.mjs",
  "tests/conformance/test/scheduler-post-task-root-continuation.test.mjs"
]));

const ACCEPTED_CARGO_ALL_FEATURES_PACKAGES = Object.freeze(new Set([
  "fast-react-reconciler",
  "fast-react-test-renderer"
]));

const REJECTED_ZERO_TEST_CARGO_FILTERS = Object.freeze(new Map([
  [
    "fast-react-reconciler",
    new Set(["deleted_subtree_passive", "root_commit_finished_host_root"])
  ]
]));

const ACCEPTED_CARGO_TEST_FILTERS = Object.freeze(new Map([
  [
    "fast-react-napi",
    new Set([
      "batch_response_sequence",
      "native_root_bridge",
      "stream_batch_roundtrip",
      "worker_thread_teardown"
    ])
  ],
  [
    "fast-react-reconciler",
    new Set([
      "begin_work",
      "begin_work_fails_closed_with_suspense_list_and_activity_child_shape_diagnostics",
      "complete_work",
      "context",
      "context_provider_update_lane",
      "function_component",
      "lane_priority",
      "layout_effect",
      "offscreen",
      "offscreen_visibility",
      "passive_effects_",
      "passive_effects_deleted_subtree",
      "passive_effects_callback_executor_errors_preserve_cross_phase_order_and_block_root_errors",
      "root_commit_deletion_subtree_traversal_gate",
      "root_commit_effect_list",
      "root_commit_finished_work",
      "root_scheduler",
      "root_updates",
      "root_work_loop_finished_work",
      "root_work_loop_lane_priority",
      "root_work_loop_preflight_and_complete_handoff_report_suspense_list_activity_child_shapes",
      "thenable_ping",
      "unsupported_feature",
      "use_callback"
    ])
  ],
  [
    "fast-react-test-renderer",
    new Set([
      "private_error_boundary",
      "private_test_instance",
      "root_create_preflight",
      "root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics",
      "root_private_tree_committed_fiber_inspection",
      "to_json"
    ])
  ]
]));

const DEFAULT_BENCHMARK_ROOT = path.resolve(
  fileURLToPath(new URL("..", import.meta.url))
);
const DEFAULT_REPO_ROOT = path.resolve(DEFAULT_BENCHMARK_ROOT, "../..");
const cargoTestNameCache = new Map();

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
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;

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
  for (const gate of manifest?.conformanceGates ?? []) {
    validateAcceptedGate(
      gate.acceptedGate,
      `${label}: manifest conformance gate ${String(gate.id)} acceptedGate`,
      errors,
      { repoRoot }
    );
  }
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
      errors,
      { repoRoot }
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

function validateAcceptedGate(
  acceptedGate,
  label,
  errors,
  { repoRoot = DEFAULT_REPO_ROOT } = {}
) {
  if (acceptedGate === undefined) {
    return;
  }
  if (!isPlainObject(acceptedGate)) {
    errors.push(`${label} must be an object`);
    return;
  }

  validateAllowedProperties(
    acceptedGate,
    ACCEPTED_GATE_PROPERTY_NAMES,
    label,
    errors
  );
  requireString(acceptedGate.id, `${label}.id`, errors);
  requireString(acceptedGate.command, `${label}.command`, errors);
  validateAcceptedGateCommandContext(label, errors, { repoRoot });
  validateRunnableAcceptedGateCommand(acceptedGate.command, label, errors, {
    repoRoot
  });
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

function validateAcceptedGateCommandContext(
  label,
  errors,
  { repoRoot = DEFAULT_REPO_ROOT } = {}
) {
  const currentRepoRoot = realPathOrResolve(DEFAULT_REPO_ROOT);
  const commandRepoRoot = realPathOrResolve(repoRoot);
  if (commandRepoRoot !== currentRepoRoot) {
    errors.push(
      `${label}.command provenance must be validated from the current benchmark gate repo root; caller-supplied repoRoot ${JSON.stringify(
        repoRoot
      )} is not current`
    );
  }

  const benchmarkGateModule = path.join(
    repoRoot,
    "tests/benchmarks/src/benchmark-gate.mjs"
  );
  if (
    realPathOrResolve(benchmarkGateModule) !==
    realPathOrResolve(fileURLToPath(import.meta.url))
  ) {
    errors.push(
      `${label}.command provenance must point at the current benchmark gate module`
    );
  }
}

function validateRunnableAcceptedGateCommand(
  command,
  label,
  errors,
  { repoRoot = DEFAULT_REPO_ROOT } = {}
) {
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
    errors.push(
      ...validateAcceptedGateCommandSegment(segment, {
        label,
        repoRoot
      })
    );
  }
}

function validateAcceptedGateCommandSegment(segment, { label, repoRoot }) {
  const tokens = segment.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) {
    return [
      `${label}.command segment ${JSON.stringify(
        segment
      )} must be an npm run, node --test, or cargo test command`
    ];
  }

  if (tokens[0] === "npm" && tokens[1] === "run") {
    return validateNpmRunCommandSegment(segment, tokens, { label, repoRoot });
  }
  if (tokens[0] === "node" && tokens[1] === "--test") {
    return validateNodeTestCommandSegment(segment, tokens, { label, repoRoot });
  }
  if (tokens[0] === "cargo" && tokens[1] === "test") {
    return validateCargoTestCommandSegment(segment, tokens, { label, repoRoot });
  }

  return [
    `${label}.command segment ${JSON.stringify(
      segment
    )} must be an npm run, node --test, or cargo test command`
  ];
}

function validateNpmRunCommandSegment(segment, tokens, { label, repoRoot }) {
  const errors = [];
  const segmentLabel = `${label}.command segment ${JSON.stringify(segment)}`;

  if (tokens.length !== 3 && tokens.length !== 5) {
    errors.push(
      `${segmentLabel} must be \`npm run <script>\` optionally followed by \`--workspace <workspace>\``
    );
    return errors;
  }

  const scriptName = tokens[2];
  if (!NPM_RUN_SCRIPT_PATTERN.test(scriptName)) {
    errors.push(`${segmentLabel} has invalid npm script ${scriptName}`);
    return errors;
  }

  let packageJsonPath = path.join(repoRoot, "package.json");
  if (tokens.length === 5) {
    if (tokens[3] !== "--workspace") {
      errors.push(`${segmentLabel} only supports --workspace after the script`);
      return errors;
    }
    if (!NPM_WORKSPACE_NAME_PATTERN.test(tokens[4])) {
      errors.push(`${segmentLabel} has invalid workspace ${tokens[4]}`);
      return errors;
    }
    packageJsonPath = findWorkspacePackageJson(repoRoot, tokens[4]);
    if (!packageJsonPath) {
      errors.push(`${segmentLabel} references unknown workspace ${tokens[4]}`);
      return errors;
    }
  }

  const packageJson = readJsonFile(packageJsonPath);
  if (packageJson.scripts?.[scriptName] === undefined) {
    errors.push(
      `${segmentLabel} references missing package script ${scriptName}`
    );
  }
  if (!ACCEPTED_NPM_COMMAND_SEGMENTS.has(segment)) {
    errors.push(`${segmentLabel} is not an accepted benchmark gate npm command`);
    return errors;
  }

  const provenance = ACCEPTED_NPM_COMMAND_PROVENANCE.get(segment);
  if (!provenance) {
    errors.push(`${segmentLabel} is missing accepted npm command provenance`);
    return errors;
  }
  validateNpmCommandProvenance(
    segmentLabel,
    {
      packageJson,
      packageJsonPath,
      scriptName
    },
    provenance,
    errors,
    { repoRoot }
  );

  return errors;
}

function validateNpmCommandProvenance(
  segmentLabel,
  { packageJson, packageJsonPath, scriptName },
  provenance,
  errors,
  { repoRoot }
) {
  if (scriptName !== provenance.scriptName) {
    errors.push(
      `${segmentLabel} script ${scriptName} does not match accepted provenance script ${provenance.scriptName}`
    );
  }

  const expectedPackageJsonPath = path.join(repoRoot, provenance.packageJsonPath);
  if (
    realPathOrResolve(packageJsonPath) !==
    realPathOrResolve(expectedPackageJsonPath)
  ) {
    errors.push(
      `${segmentLabel} package context must resolve to ${provenance.packageJsonPath}`
    );
  }

  if (packageJson.name !== provenance.packageName) {
    errors.push(
      `${segmentLabel} package context must be ${provenance.packageName}; saw ${String(
        packageJson.name
      )}`
    );
  }

  const actualScriptCommand = packageJson.scripts?.[scriptName];
  if (actualScriptCommand !== provenance.scriptCommand) {
    errors.push(
      `${segmentLabel} script ${scriptName} is stale; expected ${JSON.stringify(
        provenance.scriptCommand
      )}`
    );
  }

  for (const targetPath of provenance.currentTargets) {
    const resolvedTargetPath = resolveRepoPath(repoRoot, targetPath);
    if (!resolvedTargetPath || !existsSync(resolvedTargetPath)) {
      errors.push(
        `${segmentLabel} accepted npm command target is not current: ${targetPath}`
      );
      continue;
    }
    if (!statSync(resolvedTargetPath).isFile()) {
      errors.push(
        `${segmentLabel} accepted npm command target is not a file: ${targetPath}`
      );
    }
  }
}

function validateNodeTestCommandSegment(segment, tokens, { label, repoRoot }) {
  const errors = [];
  const segmentLabel = `${label}.command segment ${JSON.stringify(segment)}`;

  if (tokens.length < 3) {
    return [`${segmentLabel} must include at least one repo test path`];
  }

  for (const testPath of tokens.slice(2)) {
    if (!NODE_TEST_PATH_PATTERN.test(testPath)) {
      errors.push(
        `${segmentLabel} test target ${JSON.stringify(
          testPath
        )} must be a repo .js or .mjs test path`
      );
      continue;
    }

    const resolvedTestPath = resolveRepoPath(repoRoot, testPath);
    if (!resolvedTestPath || !existsSync(resolvedTestPath)) {
      errors.push(
        `${segmentLabel} test target does not exist: ${testPath}`
      );
      continue;
    }
    if (!statSync(resolvedTestPath).isFile()) {
      errors.push(`${segmentLabel} test target is not a file: ${testPath}`);
      continue;
    }
    const testSource = readFileSync(resolvedTestPath, "utf8");
    if (!hasNodeTestImport(testSource)) {
      errors.push(
        `${segmentLabel} test target ${JSON.stringify(
          testPath
        )} does not import node:test`
      );
    } else if (!hasCurrentNodeTestRegistration(testSource)) {
      errors.push(
        `${segmentLabel} test target ${JSON.stringify(
          testPath
        )} does not register a current node:test test name`
      );
    }
    if (!ACCEPTED_NODE_TEST_TARGETS.has(testPath)) {
      errors.push(
        `${segmentLabel} test target ${JSON.stringify(
          testPath
        )} is not an accepted benchmark gate test target`
      );
    }
  }

  return errors;
}

function validateCargoTestCommandSegment(segment, tokens, { label, repoRoot }) {
  const errors = [];
  const segmentLabel = `${label}.command segment ${JSON.stringify(segment)}`;

  if (tokens.length < 5 || tokens[2] !== "-p") {
    errors.push(`${segmentLabel} must include \`-p <crate>\``);
    return errors;
  }

  const packageName = tokens[3];
  if (!CARGO_PACKAGE_PATTERN.test(packageName)) {
    errors.push(`${segmentLabel} has invalid crate package ${packageName}`);
    return errors;
  }

  const cargoPackagePath = path.join(
    repoRoot,
    "crates",
    packageName,
    "Cargo.toml"
  );
  if (!existsSync(cargoPackagePath)) {
    errors.push(`${segmentLabel} references unknown crate ${packageName}`);
    return errors;
  }

  const args = tokens.slice(4);
  if (!args.includes("--all-features")) {
    errors.push(`${segmentLabel} must include --all-features`);
  }

  const filters = args.filter((arg) => arg !== "--all-features");
  if (filters.length > 1) {
    errors.push(
      `${segmentLabel} must include at most one Cargo TESTNAME filter`
    );
  }
  if (
    filters.length === 0 &&
    !ACCEPTED_CARGO_ALL_FEATURES_PACKAGES.has(packageName)
  ) {
    errors.push(
      `${segmentLabel} all-features cargo command is not accepted for ${packageName}`
    );
  }

  const acceptedFilters =
    ACCEPTED_CARGO_TEST_FILTERS.get(packageName) ?? new Set();
  const rejectedZeroTestFilters =
    REJECTED_ZERO_TEST_CARGO_FILTERS.get(packageName) ?? new Set();
  const currentTestNames = collectCargoTestNames(repoRoot, packageName);
  if (
    filters.length === 0 &&
    ACCEPTED_CARGO_ALL_FEATURES_PACKAGES.has(packageName) &&
    currentTestNames.size === 0
  ) {
    errors.push(
      `${segmentLabel} all-features cargo command selects no current tests for ${packageName}`
    );
  }
  for (const arg of args) {
    if (arg === "--all-features") {
      continue;
    }
    if (arg.startsWith("-")) {
      errors.push(`${segmentLabel} has unsupported cargo flag ${arg}`);
      continue;
    }
    if (rejectedZeroTestFilters.has(arg)) {
      errors.push(
        `${segmentLabel} test filter ${JSON.stringify(
          arg
        )} selects zero tests for ${packageName}`
      );
      continue;
    }
    if (!acceptedFilters.has(arg)) {
      errors.push(
        `${segmentLabel} test filter ${JSON.stringify(
          arg
        )} is not an accepted benchmark gate filter for ${packageName}`
      );
      continue;
    }
    if (!cargoFilterSelectsCurrentTests(arg, currentTestNames)) {
      errors.push(
        `${segmentLabel} test filter ${JSON.stringify(
          arg
        )} selects no current tests for ${packageName}`
      );
    }
  }

  return errors;
}

function collectCargoTestNames(repoRoot, packageName) {
  const cacheKey = `${realPathOrResolve(repoRoot)}\u0000${packageName}`;
  const cached = cargoTestNameCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const packageRoot = path.join(repoRoot, "crates", packageName);
  const testNames = new Set();
  const rustFiles = collectCargoCompiledRustFiles(packageRoot);
  for (const rustFile of rustFiles) {
    const source = maskDisabledRustCfgItems(
      prepareRustSourceForTestDiscovery(readFileSync(rustFile, "utf8"))
    );
    for (const testName of collectEnabledRustTestItemNames(source)) {
      testNames.add(testName);
    }
  }

  cargoTestNameCache.set(cacheKey, testNames);
  return testNames;
}

function collectCargoCompiledRustFiles(packageRoot) {
  const rootFiles = collectCargoTestRootFiles(packageRoot);
  const pending = [...rootFiles];
  const rustFiles = new Set();

  while (pending.length > 0) {
    const rustFile = path.resolve(pending.pop());
    if (rustFiles.has(rustFile) || !isFile(rustFile)) {
      continue;
    }

    rustFiles.add(rustFile);
    const source = maskDisabledRustCfgItems(
      prepareRustSourceForModuleDiscovery(readFileSync(rustFile, "utf8"))
    );
    for (const declaration of findRustExternalModuleDeclarations(source)) {
      if (
        rustAttributeGroupHasDisabledCfg(declaration.attributes) ||
        rustAttributeGroupHasPathAttribute(declaration.attributes)
      ) {
        continue;
      }
      pending.push(
        ...resolveRustExternalModuleFiles(
          rustFile,
          declaration.modulePath,
          declaration.name
        )
      );
    }
  }

  return [...rustFiles].sort();
}

function collectCargoTestRootFiles(packageRoot) {
  const manifestPath = path.join(packageRoot, "Cargo.toml");
  const manifest = existsSync(manifestPath)
    ? readCargoManifestTargetMetadata(readFileSync(manifestPath, "utf8"))
    : { targets: [], packageValues: new Map() };
  const rootFiles = new Set();

  const libTarget = manifest.targets.find((target) => target.kind === "lib");
  const libPath = libTarget?.values.get("path") ?? "src/lib.rs";
  if (libTarget?.values.get("test") !== false) {
    addCargoRootFile(rootFiles, packageRoot, libPath);
  }

  for (const target of manifest.targets) {
    if (
      (target.kind === "bin" || target.kind === "test") &&
      target.values.get("test") !== false
    ) {
      addCargoRootFile(rootFiles, packageRoot, target.values.get("path"));
    }
  }

  if (manifest.packageValues.get("autobins") !== false) {
    for (const binRoot of collectCargoDefaultBinaryRootFiles(packageRoot)) {
      rootFiles.add(binRoot);
    }
  }
  if (manifest.packageValues.get("autotests") !== false) {
    for (const testRoot of collectCargoDefaultIntegrationTestRootFiles(
      packageRoot
    )) {
      rootFiles.add(testRoot);
    }
  }

  return [...rootFiles].sort();
}

function addCargoRootFile(rootFiles, packageRoot, relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    return;
  }
  const rootFile = path.resolve(packageRoot, relativePath);
  if (isFile(rootFile)) {
    rootFiles.add(rootFile);
  }
}

function readCargoManifestTargetMetadata(source) {
  const targets = [];
  let currentSection = null;
  let packageValues = new Map();

  for (const line of source.split(/\r?\n/)) {
    const trimmed = stripTomlComment(line).trim();
    if (trimmed.length === 0) {
      continue;
    }

    const arrayTableMatch = /^\[\[\s*([A-Za-z0-9_-]+)\s*\]\]$/.exec(
      trimmed
    );
    if (arrayTableMatch) {
      currentSection = {
        kind: arrayTableMatch[1],
        values: new Map()
      };
      if (currentSection.kind === "bin" || currentSection.kind === "test") {
        targets.push(currentSection);
      }
      continue;
    }

    const tableMatch = /^\[\s*([A-Za-z0-9_-]+)\s*\]$/.exec(trimmed);
    if (tableMatch) {
      currentSection = {
        kind: tableMatch[1],
        values: new Map()
      };
      if (currentSection.kind === "lib") {
        targets.push(currentSection);
      } else if (currentSection.kind === "package") {
        packageValues = currentSection.values;
      }
      continue;
    }

    const valueMatch = /^([A-Za-z0-9_-]+)\s*=\s*(.+)$/.exec(trimmed);
    if (!valueMatch || !currentSection) {
      continue;
    }

    const value = readTomlScalar(valueMatch[2]);
    if (value !== undefined) {
      currentSection.values.set(valueMatch[1], value);
    }
  }

  return { targets, packageValues };
}

function stripTomlComment(line) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "#") {
      return line.slice(0, index);
    }
  }
  return line;
}

function readTomlScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return undefined;
}

function collectCargoDefaultBinaryRootFiles(packageRoot) {
  const roots = [];
  const mainPath = path.join(packageRoot, "src", "main.rs");
  if (isFile(mainPath)) {
    roots.push(path.resolve(mainPath));
  }
  roots.push(
    ...collectCargoDirectoryTargetRootFiles(path.join(packageRoot, "src", "bin"))
  );
  return roots.sort();
}

function collectCargoDefaultIntegrationTestRootFiles(packageRoot) {
  return collectCargoDirectoryTargetRootFiles(path.join(packageRoot, "tests"));
}

function collectCargoDirectoryTargetRootFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const roots = [];
  for (const entry of readdirSync(directory)) {
    const entryPath = path.join(directory, entry);
    const stat = statSync(entryPath);
    if (stat.isFile() && entry.endsWith(".rs")) {
      roots.push(path.resolve(entryPath));
    } else if (stat.isDirectory()) {
      const mainPath = path.join(entryPath, "main.rs");
      if (isFile(mainPath)) {
        roots.push(path.resolve(mainPath));
      }
    }
  }
  return roots.sort();
}

function prepareRustSourceForModuleDiscovery(source) {
  return maskRustMacroRulesDefinitions(
    stripRustNonCodeTokens(source, {
      preserveCfgAttributeStringLiterals: true
    })
  );
}

function findRustExternalModuleDeclarations(source) {
  const declarations = [];
  const context = {
    braceStack: [],
    bracketDepth: 0,
    parenDepth: 0
  };
  let scannedIndex = 0;

  RUST_EXTERNAL_MODULE_PATTERN.lastIndex = 0;
  for (const match of source.matchAll(RUST_EXTERNAL_MODULE_PATTERN)) {
    updateRustModuleDiscoveryContext(context, source, scannedIndex, match.index);
    if (
      isRustModuleDiscoveryItemContext(context) &&
      isRustDeclarationBoundary(source, match.index)
    ) {
      declarations.push({
        attributes: match[1],
        modulePath: rustModuleDiscoveryPath(context),
        name: match[2].replace(/^r#/, "")
      });
    }
    scannedIndex = match.index + match[0].length;
  }

  return declarations;
}

function updateRustModuleDiscoveryContext(context, source, start, end) {
  for (let index = start; index < end; index += 1) {
    const char = source[index];
    if (char === "{") {
      const moduleName = rustInlineModuleNameBeforeBrace(source, index);
      const kind = moduleName === null ? "block" : "module";
      context.braceStack.push({ kind, name: moduleName });
      if (kind === "block") {
        context.bracketDepth = 0;
        context.parenDepth = 0;
      }
    } else if (char === "}") {
      context.braceStack.pop();
    } else if (!rustModuleDiscoveryContextIsInsideBlock(context)) {
      if (char === "[") {
        context.bracketDepth += 1;
      } else if (char === "]") {
        context.bracketDepth = Math.max(0, context.bracketDepth - 1);
      } else if (char === "(") {
        context.parenDepth += 1;
      } else if (char === ")") {
        context.parenDepth = Math.max(0, context.parenDepth - 1);
      }
    }
  }
}

function rustModuleDiscoveryContextIsInsideBlock(context) {
  return context.braceStack.some((entry) => entry.kind === "block");
}

function isRustModuleDiscoveryItemContext(context) {
  return (
    context.parenDepth === 0 &&
    context.bracketDepth === 0 &&
    context.braceStack.every((entry) => entry.kind === "module")
  );
}

function rustModuleDiscoveryPath(context) {
  return context.braceStack
    .filter((entry) => entry.kind === "module")
    .map((entry) => entry.name);
}

function isRustDeclarationBoundary(source, start) {
  return !/[A-Za-z0-9_]/.test(source[start - 1] ?? "");
}

function rustAttributeGroupHasPathAttribute(attributesSource) {
  RUST_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of attributesSource.matchAll(RUST_ATTRIBUTE_PATTERN)) {
    if (rustAttributePath(match[1].trim()) === "path") {
      return true;
    }
  }
  return false;
}

function resolveRustExternalModuleFiles(sourceFile, modulePath, moduleName) {
  const parentDirectory = rustExternalModuleParentDirectory(
    sourceFile,
    modulePath
  );
  const moduleDirectory = path.join(parentDirectory, moduleName);
  const candidates = [
    path.resolve(parentDirectory, `${moduleName}.rs`),
    path.resolve(moduleDirectory, "mod.rs")
  ].filter((candidate) => isFile(candidate));
  return candidates.length === 1 ? candidates : [];
}

function prepareRustSourceForTestDiscovery(source) {
  return maskRustMacroRulesDefinitions(
    stripRustNonCodeTokens(source, {
      preserveCfgAttributeStringLiterals: true
    })
  );
}

function collectEnabledRustTestItemNames(source) {
  const testNames = [];
  const context = {
    braceStack: [],
    bracketDepth: 0,
    parenDepth: 0
  };
  let scannedIndex = 0;

  RUST_TEST_ITEM_PATTERN.lastIndex = 0;
  for (const match of source.matchAll(RUST_TEST_ITEM_PATTERN)) {
    updateRustItemContext(context, source, scannedIndex, match.index);
    if (
      isRustModuleItemContext(context) &&
      rustAttributesDeclareEnabledTest(match[1])
    ) {
      testNames.push(match[2]);
    }
    scannedIndex = match.index + match[0].length;
  }

  return testNames;
}

function updateRustItemContext(context, source, start, end) {
  for (let index = start; index < end; index += 1) {
    const char = source[index];
    if (char === "{") {
      const kind = rustBraceOpensInlineModule(source, index)
        ? "module"
        : "block";
      context.braceStack.push(kind);
      if (kind === "block") {
        context.bracketDepth = 0;
        context.parenDepth = 0;
      }
    } else if (char === "}") {
      context.braceStack.pop();
    } else if (!rustItemContextIsInsideBlock(context) && char === "[") {
      context.bracketDepth += 1;
    } else if (!rustItemContextIsInsideBlock(context) && char === "]") {
      context.bracketDepth = Math.max(0, context.bracketDepth - 1);
    } else if (!rustItemContextIsInsideBlock(context) && char === "(") {
      context.parenDepth += 1;
    } else if (!rustItemContextIsInsideBlock(context) && char === ")") {
      context.parenDepth = Math.max(0, context.parenDepth - 1);
    }
  }
}

function rustItemContextIsInsideBlock(context) {
  return context.braceStack.includes("block");
}

function isRustModuleItemContext(context) {
  return (
    context.parenDepth === 0 &&
    context.bracketDepth === 0 &&
    context.braceStack.every((kind) => kind === "module")
  );
}

function rustBraceOpensInlineModule(source, braceIndex) {
  return rustInlineModuleNameBeforeBrace(source, braceIndex) !== null;
}

function rustInlineModuleNameBeforeBrace(source, braceIndex) {
  const prefix = source.slice(Math.max(0, braceIndex - 512), braceIndex);
  const match =
    /(?:^|[^A-Za-z0-9_])(?:pub(?:\([^)]*\))?\s+)?mod\s+((?:r#)?[A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(
      prefix
    );
  return match ? match[1].replace(/^r#/, "") : null;
}

function rustExternalModuleParentDirectory(sourceFile, modulePath) {
  const sourceDirectory = path.dirname(sourceFile);
  const sourceBaseName = path.basename(sourceFile, ".rs");
  if (
    sourceBaseName === "lib" ||
    sourceBaseName === "main" ||
    sourceBaseName === "mod"
  ) {
    return path.join(sourceDirectory, ...modulePath);
  }
  return path.join(sourceDirectory, sourceBaseName, ...modulePath);
}

function hasNodeTestImport(source) {
  const tokens = tokenizeJavaScriptSource(source);
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (token.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (token.value === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    const isTopLevel =
      parenDepth === 0 && braceDepth === 0 && bracketDepth === 0;
    if (
      isTopLevel &&
      token.type === "identifier" &&
      token.value === "require"
    ) {
      if (
        isDirectJavaScriptIdentifierUse(tokens, index) &&
        tokens[index + 1]?.value === "(" &&
        tokens[index + 2]?.type === "string" &&
        tokens[index + 2].value === "node:test"
      ) {
        return true;
      }
    }

    if (
      !isTopLevel ||
      token.type !== "identifier" ||
      token.value !== "import"
    ) {
      if (token.value === "(") {
        parenDepth += 1;
      } else if (token.value === "{") {
        braceDepth += 1;
      } else if (token.value === "[") {
        bracketDepth += 1;
      }
      continue;
    }

    if (!isDirectJavaScriptIdentifierUse(tokens, index)) {
      continue;
    }
    const nextToken = tokens[index + 1];
    if (nextToken?.value === ".") {
      continue;
    }
    if (nextToken?.type === "string" && nextToken.value === "node:test") {
      return true;
    }
    if (
      nextToken?.value === "(" &&
      tokens[index + 2]?.type === "string" &&
      tokens[index + 2].value === "node:test"
    ) {
      return true;
    }
    if (nextToken?.type === "string" || nextToken?.value === "(") {
      continue;
    }

    for (
      let importTokenIndex = index + 1;
      importTokenIndex < tokens.length;
      importTokenIndex += 1
    ) {
      const importToken = tokens[importTokenIndex];
      if (importToken.value === ";") {
        break;
      }
      if (
        importToken.type === "identifier" &&
        importToken.value === "from" &&
        tokens[importTokenIndex + 1]?.type === "string"
      ) {
        if (tokens[importTokenIndex + 1].value === "node:test") {
          return true;
        }
        break;
      }
    }

    if (token.value === "(") {
      parenDepth += 1;
    } else if (token.value === "{") {
      braceDepth += 1;
    } else if (token.value === "[") {
      bracketDepth += 1;
    }
  }
  return false;
}

function hasCurrentNodeTestRegistration(source) {
  const tokens = tokenizeJavaScriptSource(source);
  const nodeTestBindings = collectNodeTestBindings(tokens);
  if (
    nodeTestBindings.callable.size === 0 &&
    nodeTestBindings.namespace.size === 0
  ) {
    return false;
  }

  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (token.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (token.value === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    const isTopLevel =
      parenDepth === 0 && braceDepth === 0 && bracketDepth === 0;
    if (
      isTopLevel &&
      token.type === "identifier" &&
      isDirectJavaScriptIdentifierUse(tokens, index)
    ) {
      if (
        nodeTestBindings.callable.has(token.value) &&
        tokens[index + 1]?.value === "(" &&
        nodeTestCallHasCurrentName(tokens, index + 1)
      ) {
        return true;
      }
      if (
        nodeTestBindings.namespace.has(token.value) &&
        tokens[index + 1]?.value === "." &&
        tokens[index + 2]?.type === "identifier" &&
        NODE_TEST_REGISTRATION_NAMES.has(tokens[index + 2].value) &&
        tokens[index + 3]?.value === "(" &&
        nodeTestCallHasCurrentName(tokens, index + 3)
      ) {
        return true;
      }
    }

    if (token.value === "(") {
      parenDepth += 1;
    } else if (token.value === "{") {
      braceDepth += 1;
    } else if (token.value === "[") {
      bracketDepth += 1;
    }
  }
  return false;
}

function collectNodeTestBindings(tokens) {
  const bindings = {
    callable: new Set(),
    namespace: new Set()
  };
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (token.value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (token.value === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    const isTopLevel =
      parenDepth === 0 && braceDepth === 0 && bracketDepth === 0;
    if (
      isTopLevel &&
      token.type === "identifier" &&
      token.value === "import" &&
      isDirectJavaScriptIdentifierUse(tokens, index)
    ) {
      collectNodeTestImportBindings(tokens, index, bindings);
    }
    if (
      isTopLevel &&
      token.type === "identifier" &&
      (token.value === "const" ||
        token.value === "let" ||
        token.value === "var")
    ) {
      collectNodeTestRequireBindings(tokens, index, bindings);
    }

    if (token.value === "(") {
      parenDepth += 1;
    } else if (token.value === "{") {
      braceDepth += 1;
    } else if (token.value === "[") {
      bracketDepth += 1;
    }
  }

  return bindings;
}

function collectNodeTestImportBindings(tokens, importIndex, bindings) {
  if (
    tokens[importIndex + 1]?.type === "string" &&
    tokens[importIndex + 1].value === "node:test"
  ) {
    return;
  }

  const fromIndex = findJavaScriptStatementToken(
    tokens,
    importIndex + 1,
    (token) => token.type === "identifier" && token.value === "from"
  );
  if (
    fromIndex === -1 ||
    tokens[fromIndex + 1]?.type !== "string" ||
    tokens[fromIndex + 1].value !== "node:test"
  ) {
    return;
  }

  const firstSpecifier = tokens[importIndex + 1];
  if (firstSpecifier?.type === "identifier") {
    bindings.callable.add(firstSpecifier.value);
  } else if (
    firstSpecifier?.value === "*" &&
    tokens[importIndex + 2]?.type === "identifier" &&
    tokens[importIndex + 2].value === "as" &&
    tokens[importIndex + 3]?.type === "identifier"
  ) {
    bindings.namespace.add(tokens[importIndex + 3].value);
  }

  const namedStart = findTokenValueBetween(
    tokens,
    "{",
    importIndex + 1,
    fromIndex
  );
  if (namedStart === -1) {
    return;
  }
  const namedEnd = findMatchingJavaScriptToken(tokens, namedStart, "{", "}");
  if (namedEnd === -1 || namedEnd > fromIndex) {
    return;
  }
  collectNamedNodeTestBindings(tokens, namedStart + 1, namedEnd, "as", bindings);
}

function collectNodeTestRequireBindings(tokens, declarationIndex, bindings) {
  let cursor = declarationIndex + 1;
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  while (cursor < tokens.length && tokens[cursor].value !== ";") {
    if (tokens[cursor].value === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      cursor += 1;
      continue;
    }
    if (tokens[cursor].value === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      cursor += 1;
      continue;
    }
    if (tokens[cursor].value === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      cursor += 1;
      continue;
    }

    const isDeclarationDepth =
      parenDepth === 0 && braceDepth === 0 && bracketDepth === 0;
    if (
      isDeclarationDepth &&
      tokens[cursor]?.type === "identifier" &&
      tokens[cursor + 1]?.value === "=" &&
      isNodeTestRequireCallAt(tokens, cursor + 2)
    ) {
      bindings.callable.add(tokens[cursor].value);
      cursor += 6;
      continue;
    }

    if (isDeclarationDepth && tokens[cursor]?.value === "{") {
      const closeIndex = findMatchingJavaScriptToken(tokens, cursor, "{", "}");
      if (
        closeIndex !== -1 &&
        tokens[closeIndex + 1]?.value === "=" &&
        isNodeTestRequireCallAt(tokens, closeIndex + 2)
      ) {
        collectNamedNodeTestBindings(
          tokens,
          cursor + 1,
          closeIndex,
          ":",
          bindings
        );
        cursor = closeIndex + 6;
        continue;
      }
    }

    if (tokens[cursor].value === "(") {
      parenDepth += 1;
    } else if (tokens[cursor].value === "{") {
      braceDepth += 1;
    } else if (tokens[cursor].value === "[") {
      bracketDepth += 1;
    }
    cursor += 1;
  }
}

function collectNamedNodeTestBindings(
  tokens,
  start,
  end,
  aliasPunctuator,
  bindings
) {
  for (let index = start; index < end; index += 1) {
    const token = tokens[index];
    if (
      token.type !== "identifier" ||
      !NODE_TEST_REGISTRATION_NAMES.has(token.value)
    ) {
      continue;
    }

    let localName = token.value;
    if (
      tokens[index + 1]?.value === aliasPunctuator &&
      tokens[index + 2]?.type === "identifier"
    ) {
      localName = tokens[index + 2].value;
      index += 2;
    }
    bindings.callable.add(localName);
  }
}

function isNodeTestRequireCallAt(tokens, index) {
  return (
    tokens[index]?.type === "identifier" &&
    tokens[index].value === "require" &&
    isDirectJavaScriptIdentifierUse(tokens, index) &&
    tokens[index + 1]?.value === "(" &&
    tokens[index + 2]?.type === "string" &&
    tokens[index + 2].value === "node:test" &&
    tokens[index + 3]?.value === ")"
  );
}

function nodeTestCallHasCurrentName(tokens, openParenIndex) {
  const firstArgument = tokens[openParenIndex + 1];
  return firstArgument?.type === "string" && firstArgument.value.trim() !== "";
}

function findJavaScriptStatementToken(tokens, start, predicate) {
  for (let index = start; index < tokens.length; index += 1) {
    if (tokens[index].value === ";") {
      return -1;
    }
    if (predicate(tokens[index], index)) {
      return index;
    }
  }
  return -1;
}

function findTokenValueBetween(tokens, value, start, end) {
  for (let index = start; index < end; index += 1) {
    if (tokens[index].value === value) {
      return index;
    }
  }
  return -1;
}

function findMatchingJavaScriptToken(tokens, start, opener, closer) {
  let depth = 1;
  for (let index = start + 1; index < tokens.length; index += 1) {
    if (tokens[index].value === opener) {
      depth += 1;
    } else if (tokens[index].value === closer) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function tokenizeJavaScriptSource(source) {
  const tokens = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (isWhitespace(char)) {
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      index = skipLineComment(source, index + 2);
      continue;
    }
    if (char === "/" && next === "*") {
      index = skipBlockComment(source, index + 2);
      continue;
    }
    if (char === "/" && canStartJavaScriptRegexLiteral(tokens)) {
      index = skipJavaScriptRegexLiteral(source, index);
      continue;
    }
    if (char === "\"" || char === "'") {
      const string = readQuotedJavaScriptString(source, index);
      tokens.push({ type: "string", value: string.value });
      index = string.end;
      continue;
    }
    if (char === "`") {
      index = skipJavaScriptTemplate(source, index + 1);
      continue;
    }
    if (isJavaScriptIdentifierStart(char)) {
      let end = index + 1;
      while (
        end < source.length &&
        JAVASCRIPT_IDENTIFIER_PATTERN.test(source[end])
      ) {
        end += 1;
      }
      tokens.push({ type: "identifier", value: source.slice(index, end) });
      index = end;
      continue;
    }
    if (char === "=" && next === ">") {
      tokens.push({ type: "punctuator", value: "=>" });
      index += 2;
      continue;
    }

    tokens.push({ type: "punctuator", value: char });
    index += 1;
  }
  return tokens;
}

function isDirectJavaScriptIdentifierUse(tokens, index) {
  return tokens[index - 1]?.value !== ".";
}

function canStartJavaScriptRegexLiteral(tokens) {
  const previousToken = tokens[tokens.length - 1];
  if (!previousToken) {
    return true;
  }
  if (previousToken.type === "identifier") {
    return JAVASCRIPT_REGEX_PREFIX_KEYWORDS.has(previousToken.value);
  }
  return JAVASCRIPT_REGEX_PREFIX_PUNCTUATORS.has(previousToken.value);
}

function skipJavaScriptRegexLiteral(source, start) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "[") {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (char === "]") {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if (char === "/" && !inCharacterClass) {
      index += 1;
      while (
        index < source.length &&
        JAVASCRIPT_IDENTIFIER_PATTERN.test(source[index])
      ) {
        index += 1;
      }
      return index;
    }
    if (char === "\n") {
      return index;
    }
    index += 1;
  }
  return index;
}

function readQuotedJavaScriptString(source, start) {
  const quote = source[start];
  let value = "";
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      if (index + 1 < source.length) {
        value += source[index + 1];
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }
    if (char === quote) {
      return { value, end: index + 1 };
    }
    value += char;
    index += 1;
  }
  return { value, end: index };
}

function skipJavaScriptTemplate(source, start) {
  let index = start;
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      index += 2;
      continue;
    }
    if (char === "`") {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function stripRustNonCodeTokens(source, options = {}) {
  const preservedQuotedRanges =
    options.preserveCfgAttributeStringLiterals === true
      ? collectRustCfgAttributeStringLiteralRanges(source)
      : new Map();
  let stripped = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      const end = skipLineComment(source, index + 2);
      stripped += preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = skipNestedRustBlockComment(source, index + 2);
      stripped += preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }

    const rawStringLength = rustRawStringPrefixLength(source, index);
    if (rawStringLength > 0) {
      const end = skipRustRawString(source, index, rawStringLength);
      stripped += preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }
    if (
      (char === "b" && next === "\"") ||
      (char === "c" && next === "\"")
    ) {
      const end = skipEscapedQuotedToken(source, index + 1);
      stripped += preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }
    if (char === "\"") {
      const end = skipEscapedQuotedToken(source, index);
      stripped += preservedQuotedRanges.get(index) === end
        ? source.slice(index, end)
        : preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }
    if (
      char === "'" &&
      (preservedQuotedRanges.has(index) ||
        looksLikeRustCharacterLiteral(source, index))
    ) {
      const end = skipEscapedQuotedToken(source, index);
      stripped += preservedQuotedRanges.get(index) === end
        ? source.slice(index, end)
        : preserveNewlinesAsSpaces(source.slice(index, end));
      index = end;
      continue;
    }

    stripped += char;
    index += 1;
  }
  return stripped;
}

function collectRustCfgAttributeStringLiteralRanges(source) {
  const ranges = new Map();
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      index = skipLineComment(source, index + 2);
      continue;
    }
    if (char === "/" && next === "*") {
      index = skipNestedRustBlockComment(source, index + 2);
      continue;
    }

    const rawStringLength = rustRawStringPrefixLength(source, index);
    if (rawStringLength > 0) {
      index = skipRustRawString(source, index, rawStringLength);
      continue;
    }
    if (
      (char === "b" && next === "\"") ||
      (char === "c" && next === "\"")
    ) {
      index = skipEscapedQuotedToken(source, index + 1);
      continue;
    }
    if (char === "\"") {
      index = skipEscapedQuotedToken(source, index);
      continue;
    }
    if (char === "'" && looksLikeRustCharacterLiteral(source, index)) {
      index = skipEscapedQuotedToken(source, index);
      continue;
    }

    if (char !== "#") {
      index += 1;
      continue;
    }

    const bracketStart = skipWhitespace(source, index + 1);
    if (source[bracketStart] !== "[") {
      index += 1;
      continue;
    }

    const attributeEnd = findRustAttributeEnd(source, bracketStart);
    if (attributeEnd === null) {
      index += 1;
      continue;
    }

    const attributeSource = source.slice(bracketStart + 1, attributeEnd - 1);
    if (rustAttributePath(attributeSource.trim()) === "cfg") {
      collectQuotedRustTokenRanges(
        source,
        bracketStart + 1,
        attributeEnd - 1,
        ranges
      );
    }
    index = attributeEnd;
  }
  return ranges;
}

function collectQuotedRustTokenRanges(source, start, end, ranges) {
  let index = start;
  while (index < end) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      index = Math.min(skipLineComment(source, index + 2), end);
      continue;
    }
    if (char === "/" && next === "*") {
      index = Math.min(skipNestedRustBlockComment(source, index + 2), end);
      continue;
    }

    const rawStringLength = rustRawStringPrefixLength(source, index);
    if (rawStringLength > 0) {
      index = Math.min(skipRustRawString(source, index, rawStringLength), end);
      continue;
    }
    if (
      (char === "b" && next === "\"") ||
      (char === "c" && next === "\"")
    ) {
      index = Math.min(skipEscapedQuotedToken(source, index + 1), end);
      continue;
    }
    if (char === "\"" || char === "'") {
      const tokenEnd = Math.min(skipEscapedQuotedToken(source, index), end);
      ranges.set(index, tokenEnd);
      index = tokenEnd;
      continue;
    }

    index += 1;
  }
}

function maskRustMacroRulesDefinitions(source) {
  const masked = [...source];
  let index = 0;
  while (index < source.length) {
    const macroIndex = source.indexOf("macro_rules", index);
    if (macroIndex === -1) {
      break;
    }
    if (!isIdentifierBoundary(source, macroIndex, "macro_rules".length)) {
      index = macroIndex + "macro_rules".length;
      continue;
    }

    let cursor = skipWhitespace(source, macroIndex + "macro_rules".length);
    if (source[cursor] !== "!") {
      index = cursor;
      continue;
    }
    cursor = skipWhitespace(source, cursor + 1);
    if (!isRustIdentifierStart(source[cursor])) {
      index = cursor;
      continue;
    }
    cursor = skipRustIdentifier(source, cursor);
    cursor = skipWhitespace(source, cursor);

    const opener = source[cursor];
    const closer = rustDelimiterCloser(opener);
    if (!closer) {
      index = cursor + 1;
      continue;
    }
    const end = skipBalancedRustDelimiter(source, cursor, opener, closer);
    const maskEnd = source[end] === ";" ? end + 1 : end;
    for (let maskIndex = macroIndex; maskIndex < maskEnd; maskIndex += 1) {
      masked[maskIndex] = source[maskIndex] === "\n" ? "\n" : " ";
    }
    index = maskEnd;
  }
  return masked.join("");
}

function maskDisabledRustCfgItems(source) {
  const masked = [...source];
  let index = 0;
  while (index < source.length) {
    const attributeStart = findNextRustAttributeStart(source, index);
    if (attributeStart === -1) {
      break;
    }

    const attributeGroup = readRustAttributeGroup(source, attributeStart);
    if (!attributeGroup) {
      index = attributeStart + 1;
      continue;
    }
    if (!rustAttributeGroupHasDisabledCfg(attributeGroup.source)) {
      index = attributeGroup.end;
      continue;
    }

    const itemEnd = findRustItemEndAfterAttributes(source, attributeGroup.end);
    if (itemEnd === null) {
      index = attributeGroup.end;
      continue;
    }
    maskSourceRangePreservingNewlines(masked, source, attributeStart, itemEnd);
    index = itemEnd;
  }
  return masked.join("");
}

function findNextRustAttributeStart(source, start) {
  let index = start;
  while (index < source.length) {
    const attributeStart = source.indexOf("#", index);
    if (attributeStart === -1) {
      return -1;
    }
    const bracketStart = skipWhitespace(source, attributeStart + 1);
    if (source[bracketStart] === "[") {
      return attributeStart;
    }
    index = attributeStart + 1;
  }
  return -1;
}

function readRustAttributeGroup(source, start) {
  let cursor = start;
  let end = start;
  const attributes = [];

  while (cursor < source.length) {
    const attributeStart = skipWhitespace(source, cursor);
    if (source[attributeStart] !== "#") {
      break;
    }
    const bracketStart = skipWhitespace(source, attributeStart + 1);
    if (source[bracketStart] !== "[") {
      break;
    }
    const attributeEnd = findRustAttributeEnd(source, bracketStart);
    if (attributeEnd === null) {
      break;
    }

    attributes.push(source.slice(attributeStart, attributeEnd));
    cursor = attributeEnd;
    end = attributeEnd;
  }

  if (attributes.length === 0) {
    return null;
  }
  return { source: attributes.join("\n"), end };
}

function findRustAttributeEnd(source, bracketStart) {
  let depth = 1;
  let index = bracketStart + 1;
  while (index < source.length && depth > 0) {
    const char = source[index];
    const next = source[index + 1];

    if (char === "/" && next === "/") {
      index = skipLineComment(source, index + 2);
      continue;
    }
    if (char === "/" && next === "*") {
      index = skipNestedRustBlockComment(source, index + 2);
      continue;
    }

    const rawStringLength = rustRawStringPrefixLength(source, index);
    if (rawStringLength > 0) {
      index = skipRustRawString(source, index, rawStringLength);
      continue;
    }
    if (
      (char === "b" && next === "\"") ||
      (char === "c" && next === "\"")
    ) {
      index = skipEscapedQuotedToken(source, index + 1);
      continue;
    }
    if (char === "\"") {
      index = skipEscapedQuotedToken(source, index);
      continue;
    }
    if (char === "'" && looksLikeRustCharacterLiteral(source, index)) {
      index = skipEscapedQuotedToken(source, index);
      continue;
    }

    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return index + 1;
      }
    }
    index += 1;
  }
  return null;
}

function rustAttributeGroupHasDisabledCfg(attributesSource) {
  RUST_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of attributesSource.matchAll(RUST_ATTRIBUTE_PATTERN)) {
    if (isDisabledRustCfgAttribute(match[1].trim())) {
      return true;
    }
  }
  return false;
}

function findRustItemEndAfterAttributes(source, start) {
  let index = skipWhitespace(source, start);
  while (index < source.length) {
    if (source[index] === "{") {
      return skipBalancedRustDelimiter(source, index, "{", "}");
    }
    if (source[index] === ";") {
      return index + 1;
    }
    index += 1;
  }
  return null;
}

function maskSourceRangePreservingNewlines(masked, source, start, end) {
  for (let index = start; index < end; index += 1) {
    masked[index] = source[index] === "\n" ? "\n" : " ";
  }
}

function rustAttributesDeclareEnabledTest(attributesSource) {
  let declaresTest = false;
  RUST_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of attributesSource.matchAll(RUST_ATTRIBUTE_PATTERN)) {
    const attribute = match[1].trim();
    if (isDisabledRustCfgAttribute(attribute)) {
      return false;
    }
    if (isRustTestAttribute(attribute)) {
      declaresTest = true;
    }
  }
  return declaresTest;
}

function isRustTestAttribute(attribute) {
  const path = rustAttributePath(attribute);
  return path.split("::").at(-1) === "test";
}

function isDisabledRustCfgAttribute(attribute) {
  const path = rustAttributePath(attribute);
  if (path !== "cfg") {
    return false;
  }
  const args = rustAttributeArguments(attribute);
  return args === null || evaluateRustCfgExpression(args) !== true;
}

function rustAttributePath(attribute) {
  const parenIndex = attribute.indexOf("(");
  const equalsIndex = attribute.indexOf("=");
  const endIndex = [parenIndex, equalsIndex]
    .filter((index) => index !== -1)
    .sort((left, right) => left - right)[0];
  return (
    endIndex === undefined ? attribute : attribute.slice(0, endIndex)
  ).trim();
}

function rustAttributeArguments(attribute) {
  const openIndex = attribute.indexOf("(");
  if (openIndex === -1 || !attribute.endsWith(")")) {
    return null;
  }
  return attribute.slice(openIndex + 1, -1).trim();
}

function evaluateRustCfgExpression(expression) {
  const normalized = expression.trim();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "test") {
    return true;
  }
  if (/^feature\s*=/.test(normalized)) {
    return true;
  }
  if (normalized === "FALSE" || normalized === "false") {
    return false;
  }

  const keyValue = readRustCfgKeyValue(normalized);
  if (keyValue) {
    return evaluateRustCfgKeyValue(keyValue.key, keyValue.value);
  }
  const bareValue = evaluateRustCfgBareValue(normalized);
  if (bareValue !== undefined) {
    return bareValue;
  }

  const call = readRustCfgCall(normalized);
  if (!call) {
    return undefined;
  }
  if (call.name === "not") {
    const nested = evaluateRustCfgExpression(call.args.trim());
    return nested === undefined ? undefined : !nested;
  }

  const args = splitRustCfgArgs(call.args);
  if (call.name === "all") {
    let sawUnknown = false;
    for (const arg of args) {
      const value = evaluateRustCfgExpression(arg);
      if (value === false) {
        return false;
      }
      if (value === undefined) {
        sawUnknown = true;
      }
    }
    return sawUnknown ? undefined : true;
  }
  if (call.name === "any") {
    let sawUnknown = false;
    for (const arg of args) {
      const value = evaluateRustCfgExpression(arg);
      if (value === true) {
        return true;
      }
      if (value === undefined) {
        sawUnknown = true;
      }
    }
    return sawUnknown ? undefined : false;
  }
  return undefined;
}

function readRustCfgKeyValue(expression) {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(["'])(.*)\2$/.exec(
    expression
  );
  if (!match) {
    return null;
  }
  return {
    key: match[1],
    value: match[3]
  };
}

function evaluateRustCfgKeyValue(key, value) {
  if (key === "feature") {
    return true;
  }
  if (key === "panic") {
    return value === "unwind";
  }

  const hostValue = RUST_HOST_CFG_VALUES[key];
  if (hostValue === undefined) {
    return undefined;
  }
  if (Array.isArray(hostValue)) {
    return hostValue.includes(value);
  }
  return hostValue === value;
}

function evaluateRustCfgBareValue(value) {
  if (value === "unix") {
    return RUST_HOST_CFG_VALUES.target_family === "unix";
  }
  if (value === "windows") {
    return RUST_HOST_CFG_VALUES.target_family === "windows";
  }
  if (value === "debug_assertions") {
    return true;
  }
  if (value === "proc_macro") {
    return false;
  }
  return undefined;
}

function readRustCfgCall(expression) {
  const openIndex = expression.indexOf("(");
  if (openIndex === -1 || !expression.endsWith(")")) {
    return null;
  }
  return {
    name: expression.slice(0, openIndex).trim(),
    args: expression.slice(openIndex + 1, -1)
  };
}

function splitRustCfgArgs(args) {
  const parts = [];
  let start = 0;
  let depth = 0;
  for (let index = 0; index < args.length; index += 1) {
    const char = args[index];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (char === "," && depth === 0) {
      parts.push(args.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = args.slice(start).trim();
  if (tail.length > 0) {
    parts.push(tail);
  }
  return parts;
}

function rustHostTargetOs(platform) {
  const values = {
    aix: "aix",
    android: "android",
    darwin: "macos",
    freebsd: "freebsd",
    linux: "linux",
    openbsd: "openbsd",
    sunos: "solaris",
    win32: "windows"
  };
  return values[platform];
}

function rustHostTargetArch(arch) {
  const values = {
    arm: "arm",
    arm64: "aarch64",
    ia32: "x86",
    loong64: "loongarch64",
    ppc64: "powerpc64",
    riscv64: "riscv64",
    s390x: "s390x",
    x64: "x86_64"
  };
  return values[arch];
}

function rustHostTargetFamily(platform) {
  return platform === "win32" ? "windows" : "unix";
}

function rustHostTargetEnv(platform) {
  if (platform === "win32") {
    return "msvc";
  }
  if (platform === "linux" || platform === "android") {
    return "gnu";
  }
  return "";
}

function rustHostTargetVendor(platform) {
  if (platform === "darwin") {
    return "apple";
  }
  if (platform === "win32") {
    return "pc";
  }
  return "unknown";
}

function rustHostTargetPointerWidth(arch) {
  return arch === "arm" || arch === "ia32" ? "32" : "64";
}

function rustHostTargetEndian(arch) {
  return arch === "s390x" ? "big" : "little";
}

function isWhitespace(char) {
  return /\s/.test(char);
}

function skipWhitespace(source, start) {
  let index = start;
  while (index < source.length && isWhitespace(source[index])) {
    index += 1;
  }
  return index;
}

function isIdentifierBoundary(source, start, length) {
  return (
    !JAVASCRIPT_IDENTIFIER_PATTERN.test(source[start - 1] ?? "") &&
    !JAVASCRIPT_IDENTIFIER_PATTERN.test(source[start + length] ?? "")
  );
}

function isRustIdentifierStart(char) {
  return /[A-Za-z_]/.test(char ?? "");
}

function skipRustIdentifier(source, start) {
  let index = start + 1;
  while (index < source.length && /[A-Za-z0-9_]/.test(source[index])) {
    index += 1;
  }
  return index;
}

function rustDelimiterCloser(opener) {
  if (opener === "{") {
    return "}";
  }
  if (opener === "(") {
    return ")";
  }
  if (opener === "[") {
    return "]";
  }
  return null;
}

function skipBalancedRustDelimiter(source, start, opener, closer) {
  let depth = 1;
  let index = start + 1;
  while (index < source.length && depth > 0) {
    if (source[index] === opener) {
      depth += 1;
    } else if (source[index] === closer) {
      depth -= 1;
    }
    index += 1;
  }
  return index;
}

function isJavaScriptIdentifierStart(char) {
  return /[A-Za-z_$]/.test(char);
}

function skipLineComment(source, start) {
  let index = start;
  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }
  return index;
}

function skipBlockComment(source, start) {
  let index = start;
  while (index < source.length) {
    if (source[index] === "*" && source[index + 1] === "/") {
      return index + 2;
    }
    index += 1;
  }
  return index;
}

function skipNestedRustBlockComment(source, start) {
  let index = start;
  let depth = 1;
  while (index < source.length && depth > 0) {
    if (source[index] === "/" && source[index + 1] === "*") {
      depth += 1;
      index += 2;
      continue;
    }
    if (source[index] === "*" && source[index + 1] === "/") {
      depth -= 1;
      index += 2;
      continue;
    }
    index += 1;
  }
  return index;
}

function preserveNewlinesAsSpaces(value) {
  return value.replace(/[^\n]/g, " ");
}

function rustRawStringPrefixLength(source, start) {
  let index = start;
  if (
    (source[index] === "b" || source[index] === "c") &&
    source[index + 1] === "r"
  ) {
    index += 1;
  }
  if (source[index] !== "r") {
    return 0;
  }
  index += 1;
  while (source[index] === "#") {
    index += 1;
  }
  if (source[index] !== "\"") {
    return 0;
  }
  return index - start + 1;
}

function skipRustRawString(source, start, prefixLength) {
  const prefix = source.slice(start, start + prefixLength);
  const hashCount = [...prefix].filter((char) => char === "#").length;
  const terminator = `"${"#".repeat(hashCount)}`;
  const contentStart = start + prefixLength;
  const end = source.indexOf(terminator, contentStart);
  return end === -1 ? source.length : end + terminator.length;
}

function skipEscapedQuotedToken(source, start) {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}

function looksLikeRustCharacterLiteral(source, start) {
  let index = start + 1;
  let contentLength = 0;
  while (index < source.length && source[index] !== "\n") {
    if (source[index] === "\\") {
      index += 2;
      contentLength += 2;
      continue;
    }
    if (source[index] === "'") {
      return contentLength > 0 && contentLength <= 16;
    }
    index += 1;
    contentLength += 1;
  }
  return false;
}

function cargoFilterSelectsCurrentTests(filter, currentTestNames) {
  for (const testName of currentTestNames) {
    if (testName.includes(filter)) {
      return true;
    }
  }
  return false;
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

function isFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile();
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function findWorkspacePackageJson(repoRoot, workspaceName) {
  const rootPackageJson = readJsonFile(path.join(repoRoot, "package.json"));
  for (const workspacePattern of rootPackageJson.workspaces ?? []) {
    if (
      typeof workspacePattern !== "string" ||
      !workspacePattern.endsWith("/*")
    ) {
      continue;
    }

    const workspaceRoot = resolveRepoPath(
      repoRoot,
      workspacePattern.slice(0, -2)
    );
    if (!workspaceRoot || !existsSync(workspaceRoot)) {
      continue;
    }

    for (const workspaceEntry of readdirSync(workspaceRoot)) {
      const packageJsonPath = path.join(
        workspaceRoot,
        workspaceEntry,
        "package.json"
      );
      if (!existsSync(packageJsonPath)) {
        continue;
      }
      const packageJson = readJsonFile(packageJsonPath);
      if (packageJson.name === workspaceName) {
        return packageJsonPath;
      }
    }
  }
  return null;
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

function realPathOrResolve(candidatePath) {
  try {
    return realpathSync(candidatePath);
  } catch {
    return path.resolve(candidatePath);
  }
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
