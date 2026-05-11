import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

import {
  SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
  SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS,
  SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS,
  createSchedulerVariantSourceCurrentnessReport,
  evaluateSchedulerVariantCurrentnessGate,
  findSchedulerVariantDeepCjsProbe,
  findSchedulerVariantResolution,
  readCheckedSchedulerVariantOracle,
  readCheckedSchedulerVariantOracleText
} from "../src/scheduler-variant-oracle.mjs";
import { inspectSchedulerPostTaskPriorityDiagnostics } from "../src/scheduler-post-task-oracle.mjs";
import {
  SCHEDULER_VARIANT_DEEP_CJS_SPECIFIERS,
  SCHEDULER_VARIANT_GATE_DECISIONS,
  SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
  SCHEDULER_VARIANT_PROBE_MODES,
  SCHEDULER_VARIANT_RESOLUTION_SPECIFIERS,
  SCHEDULER_VARIANT_SCENARIO_IDS,
  SCHEDULER_VARIANT_SCENARIOS,
  SCHEDULER_VARIANT_TARGET
} from "../src/scheduler-variant-targets.mjs";
import {
  evaluatePrivateAdmission886Gate
} from "../src/private-admission-886-scheduler-variant-boundary-ledger.mjs";

const require = createRequire(import.meta.url);
const oracle = readCheckedSchedulerVariantOracle();
const {
  ROOT_CONTINUATION_BLOCKED_STATUS,
  ROOT_CONTINUATION_METADATA_STATUS,
  ROOT_CONTINUATION_REJECTED_STATUS,
  createPrivatePostTaskRootContinuationMetadataRow
} = require("../src/scheduler-post-task-root-continuation.cjs");

const ROOT_EXPORT_KEYS = [
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const MOCK_EXPORT_KEYS = [
  "log",
  "reset",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_advanceTime",
  "unstable_cancelCallback",
  "unstable_clearLog",
  "unstable_flushAll",
  "unstable_flushAllWithoutAsserting",
  "unstable_flushExpired",
  "unstable_flushNumberOfYields",
  "unstable_flushUntilNextPaint",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_hasPendingWork",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_setDisableYieldValue",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const EXPECTED_TARBALL_FILES = [
  "LICENSE",
  "README.md",
  "cjs/scheduler-unstable_mock.development.js",
  "cjs/scheduler-unstable_mock.production.js",
  "cjs/scheduler-unstable_post_task.development.js",
  "cjs/scheduler-unstable_post_task.production.js",
  "cjs/scheduler.development.js",
  "cjs/scheduler.native.development.js",
  "cjs/scheduler.native.production.js",
  "cjs/scheduler.production.js",
  "index.js",
  "index.native.js",
  "package.json",
  "unstable_mock.js",
  "unstable_post_task.js"
];

let cachedVariantCurrentnessGate = null;

test("checked scheduler variant oracle artifact has the expected schema and target", () => {
  assert.equal(
    SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-variant-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-variant-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball extracted into a temporary node_modules tree and probed through isolated Node child processes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scheduler variant scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_VARIANT_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.deepEqual(
    oracle.packages.scheduler.tarball.files,
    EXPECTED_TARBALL_FILES
  );
  assert.deepEqual(oracle.packages.scheduler.packageJson, {
    name: "scheduler",
    version: "0.27.0",
    description: "Cooperative scheduler for the browser environment.",
    main: null,
    type: null,
    exports: null,
    files: [
      "LICENSE",
      "README.md",
      "index.js",
      "index.native.js",
      "unstable_mock.js",
      "unstable_post_task.js",
      "cjs/"
    ],
    dependencies: null,
    peerDependencies: null,
    engines: null,
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/facebook/react.git",
      directory: "packages/scheduler"
    },
    bugs: {
      url: "https://github.com/facebook/react/issues"
    },
    homepage: "https://react.dev/"
  });
});

test("scheduler variant oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballDownloaded: true,
    tarballIntegrityVerified: true,
    packageMetadataProbed: true,
    schedulerVariantBehaviorProbed: true,
    physicalDeepImportsProbed: true,
    fastReactComparedToScheduler: false
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    oracle.compatibilityGateRecommendations,
    SCHEDULER_VARIANT_GATE_DECISIONS
  );
});

test("scheduler variant currentness gate binds source-owned variant boundaries without public compatibility claims", () => {
  const gate = baselineVariantCurrentnessGate();

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS);
  assert.equal(gate.oracleArtifactPath, SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.rowCurrentnessRecognized, true);
  assert.equal(gate.sourceDiagnosticBindingsRecognized, true);
  assert.equal(gate.packageDeepCjsBoundariesRecognized, true);
  assert.equal(gate.rootEvidenceRejectedForVariants, true);
  assert.equal(gate.variantEvidenceRejectedForRootBehavior, true);
  assert.equal(gate.mockPostTaskAliasesRejected, true);
  assert.equal(gate.cjsDiagnosticCoverageRecognized, true);
  assert.equal(gate.sourceReportSourceProofRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    createSchedulerVariantSourceCurrentnessReport().rows,
    gate.sourceRows
  );
  assert.deepEqual(gate.sourceRows, SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS);
  assert.deepEqual(gate.sourceClassifications, [
    "root",
    "mock",
    "post_task",
    "native"
  ]);
  assert.deepEqual(gate.diagnosticCjsCoverageVariantIds, [
    "scheduler-cjs-unstable-mock-development",
    "scheduler-cjs-unstable-mock-production",
    "scheduler-cjs-unstable-post-task-development",
    "scheduler-cjs-unstable-post-task-production"
  ]);

  assert.equal(
    gate.privateVariantBoundaryContext.role,
    "private-scheduler-variant-boundary-currentness-context-only"
  );
  assert.equal(
    gate.privateVariantBoundaryContext.acceptedAsPrivateContextOnly,
    true
  );
  assert.equal(gate.privateVariantBoundaryContext.behaviorEvidenceUsed, false);
  assert.equal(
    gate.privateVariantBoundaryContext.rootBehaviorEvidenceAllowed,
    false
  );

  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-index-wrapper"],
    {
      classification: "root",
      modeId: "node-env-wrapper",
      entrypoint: "scheduler",
      packagePath: "scheduler",
      deepCjsPath: null,
      directDeepCjsImport: false,
      sourceDiagnosticIds: []
    }
  );
  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-cjs-unstable-mock-development"],
    {
      classification: "mock",
      modeId: "node-development",
      entrypoint: "scheduler/cjs/scheduler-unstable_mock.development.js",
      packagePath: "scheduler/cjs/scheduler-unstable_mock.development.js",
      deepCjsPath: "scheduler/cjs/scheduler-unstable_mock.development.js",
      directDeepCjsImport: true,
      sourceDiagnosticIds: [
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
      ]
    }
  );
  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-cjs-unstable-mock-production"],
    {
      classification: "mock",
      modeId: "node-production",
      entrypoint: "scheduler/cjs/scheduler-unstable_mock.production.js",
      packagePath: "scheduler/cjs/scheduler-unstable_mock.production.js",
      deepCjsPath: "scheduler/cjs/scheduler-unstable_mock.production.js",
      directDeepCjsImport: true,
      sourceDiagnosticIds: [
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
      ]
    }
  );
  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-cjs-unstable-post-task-development"],
    {
      classification: "post_task",
      modeId: "node-development",
      entrypoint: "scheduler/unstable_post_task",
      packagePath:
        "scheduler/cjs/scheduler-unstable_post_task.development.js",
      deepCjsPath:
        "scheduler/cjs/scheduler-unstable_post_task.development.js",
      directDeepCjsImport: true,
      sourceDiagnosticIds: [
        "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
        "fast-react.scheduler.post_task.private-act-root-work-handoff",
        "fast-react.scheduler.unstable_post_task.priority-diagnostics"
      ]
    }
  );
  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-cjs-unstable-post-task-production"],
    {
      classification: "post_task",
      modeId: "node-production",
      entrypoint: "scheduler/unstable_post_task",
      packagePath:
        "scheduler/cjs/scheduler-unstable_post_task.production.js",
      deepCjsPath:
        "scheduler/cjs/scheduler-unstable_post_task.production.js",
      directDeepCjsImport: true,
      sourceDiagnosticIds: [
        "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
        "fast-react.scheduler.post_task.private-act-root-work-handoff",
        "fast-react.scheduler.unstable_post_task.priority-diagnostics"
      ]
    }
  );
  assertVariantCurrentnessRow(
    gate.rowsByVariant["scheduler-native-wrapper"],
    {
      classification: "native",
      modeId: "node-env-wrapper",
      entrypoint: "scheduler/index.native.js",
      packagePath: "scheduler/index.native.js",
      deepCjsPath: null,
      directDeepCjsImport: false,
      sourceDiagnosticIds: []
    }
  );
});

test("scheduler variant currentness gate fails closed for stale oracle schema", () => {
  const staleOracle = cloneJson(oracle);
  staleOracle.schemaVersion = 0;

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    oracle: staleOracle
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assertViolation(gate, "scheduler-variant-currentness-stale-oracle-schema");
});

test("scheduler variant currentness gate rejects wrong mode bindings", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) =>
      candidate.variantId === "scheduler-cjs-unstable-mock-production"
  );
  row.modeId = "node-development";
  row.nodeEnv = "development";

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(gate, "scheduler-variant-currentness-wrong-mode").rows.map(
      (candidate) => candidate.variantId
    ),
    ["scheduler-cjs-unstable-mock-production"]
  );
});

test("scheduler variant currentness gate rejects cloned source-currentness reports", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const gate = evaluateSchedulerVariantCurrentnessGate({
    oracle,
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.rowCurrentnessRecognized, true);
  assert.equal(gate.sourceReportSourceProofRecognized, false);
  assertViolation(
    gate,
    "scheduler-variant-currentness-source-report-caller-shaped"
  );
});

test("scheduler variant currentness gate rejects reports minted from caller-provided private gates", () => {
  const report = createSchedulerVariantSourceCurrentnessReport({
    privateVariantBoundaryGate: evaluatePrivateAdmission886Gate()
  });
  const gate = evaluateSchedulerVariantCurrentnessGate({
    oracle,
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.equal(gate.sourceReportSourceProofRecognized, false);
  assertViolation(
    gate,
    "scheduler-variant-currentness-source-report-caller-shaped"
  );
});

test("scheduler variant currentness gate rejects root evidence used as variant evidence", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) =>
      candidate.variantId === "scheduler-cjs-unstable-post-task-development"
  );
  row.entrypoint = "scheduler";
  row.packagePath = "scheduler";
  row.evidenceScope.rootEntryEvidenceAcceptedForVariant = true;

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-variant-currentness-root-evidence-used-as-variant"
    ).rows.map((candidate) => candidate.variantId),
    ["scheduler-cjs-unstable-post-task-development"]
  );
});

test("scheduler variant currentness gate rejects variant evidence used as root behavior", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) => candidate.variantId === "scheduler-index-wrapper"
  );
  row.evidenceScope.variantEvidenceAcceptedForRootBehavior = true;
  row.evidenceScope.rootBehaviorEvidenceClaimed = true;

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-variant-currentness-variant-evidence-used-as-root"
    ).rows.map((candidate) => candidate.variantId),
    ["scheduler-index-wrapper"]
  );
});

test("scheduler variant currentness gate rejects forged diagnostic symbols and ids", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) =>
      candidate.variantId === "scheduler-cjs-unstable-mock-development"
  );
  row.sourceDiagnosticIds.push(
    "fast-react.scheduler.unstable_post_task.priority-diagnostics"
  );
  row.diagnosticSymbolOrSourceIds.push(
    "fast-react.scheduler.unstable_post_task.priority-diagnostics"
  );

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-variant-currentness-forged-diagnostic-symbol"
    ).rows.map((candidate) => candidate.variantId),
    ["scheduler-cjs-unstable-mock-development"]
  );
});

test("scheduler variant currentness gate rejects package and deep-CJS alias smuggling", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) =>
      candidate.variantId === "scheduler-cjs-unstable-mock-development"
  );
  row.packagePath = "scheduler/unstable_mock";
  row.deepCjsPath = null;
  row.directDeepCjsImport = false;
  row.boundaryKind = "package-entrypoint";

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-variant-currentness-package-deep-cjs-alias"
    ).rows.map((candidate) => candidate.variantId),
    ["scheduler-cjs-unstable-mock-development"]
  );
});

test("scheduler variant currentness gate rejects mock and postTask cross-variant aliases", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  const row = report.rows.find(
    (candidate) =>
      candidate.variantId === "scheduler-cjs-unstable-post-task-production"
  );
  row.classification = "mock";
  row.rootNativeMockPostTaskClassification = "mock";
  row.sourceDiagnosticIds.push(
    "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
  );
  row.diagnosticExportNames.push(
    "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
  );

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assert.deepEqual(
    violationById(
      gate,
      "scheduler-variant-currentness-mock-post-task-cross-alias"
    ).rows.map((candidate) => candidate.variantId),
    ["scheduler-cjs-unstable-post-task-production"]
  );
});

test("scheduler variant currentness gate keeps public timing, root, act, and package compatibility blocked", () => {
  const report = cloneJson(baselineVariantCurrentnessGate().sourceCurrentnessReport);
  report.compatibilityClaimed = true;
  report.blockedPublicClaims.publicSchedulerTimingCompatibilityClaimed = true;
  report.blockedPublicClaims.publicRootSchedulerCompatibilityClaimed = true;
  report.blockedPublicClaims.publicReactActCompatibilityClaimed = true;
  report.blockedPublicClaims.publicPackageCompatibilityClaimed = true;

  const gate = evaluateVariantCurrentnessWithBaselineReport({
    sourceCurrentnessReport: report
  });

  assert.equal(gate.status, SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS);
  assertSubset(
    [
      "sourceCurrentnessReport.compatibilityClaimed",
      "sourceCurrentnessReport.blockedPublicClaims.publicSchedulerTimingCompatibilityClaimed",
      "sourceCurrentnessReport.blockedPublicClaims.publicRootSchedulerCompatibilityClaimed",
      "sourceCurrentnessReport.blockedPublicClaims.publicReactActCompatibilityClaimed",
      "sourceCurrentnessReport.blockedPublicClaims.publicPackageCompatibilityClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-currentness-public-compatibility-claim-detected"
  );
});

test("scheduler variant oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_VARIANT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_VARIANT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "package metadata and physical subpath exposure",
    "scheduler/unstable_mock deterministic test scheduler helpers",
    "scheduler/unstable_post_task Task Scheduling API behavior",
    "scheduler/index.native.js fallback behavior",
    "direct physical CJS import behavior"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const observations = oracle.observations[mode.id];
    assert.ok(observations, `${mode.id} observations should exist`);

    for (const scenarioId of SCHEDULER_VARIANT_SCENARIO_IDS) {
      const observation = observations[scenarioObservationKey(scenarioId)];
      assert.ok(observation, `${mode.id}:${scenarioId} should exist`);
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.status, "ok");
    }
  }
});

test("package metadata and resolution prove physical subpath exposure", () => {
  assert.equal(oracle.packageResolution.packageJson.exports, null);
  assert.equal(oracle.packageResolution.packageJson.main, null);
  assert.equal(oracle.packageResolution.packageJson.type, null);
  assert.equal(oracle.packageResolution.packageJsonRequire.require.status, "ok");

  for (const specifier of SCHEDULER_VARIANT_RESOLUTION_SPECIFIERS) {
    const resolution = findSchedulerVariantResolution(oracle, specifier);
    assert.equal(resolution.status, "ok", specifier);
    assert.match(resolution.path, /^node_modules\/scheduler\//u, specifier);
  }

  for (const specifier of [
    "scheduler/index.js",
    "scheduler/index.native.js",
    "scheduler/unstable_mock.js",
    "scheduler/unstable_post_task.js"
  ]) {
    assert.equal(
      findSchedulerVariantResolution(oracle, specifier).status,
      "ok",
      `${specifier} should be physically resolvable without an exports map`
    );
  }
});

test("unstable_mock oracle captures deterministic helper behavior", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const mock = oracle.observations[mode.id].unstableMock;
    assert.deepEqual(mock.exportKeys, MOCK_EXPORT_KEYS);
    assert.deepEqual(mock.expectedRootExportKeysSubset, ROOT_EXPORT_KEYS);
    assert.deepEqual(mock.priorityConstants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.deepEqual(mock.timeAndLog, {
      initialNow: 0,
      nowAfterAdvance: 7,
      manualLog: ["manual"],
      emptyLog: [],
      disabledLog: []
    });
    assert.deepEqual(mock.priorityContext, {
      defaultPriority: 3,
      runWithPriorityInvalid: 3,
      nextInsideUserBlocking: 3,
      nextInsideLow: 4,
      wrapCallbackCapturedPriority: 2
    });
    assert.deepEqual(mock.priorityScheduling.order, [
      ["immediate", true, 1],
      ["user-blocking", false, 2],
      ["normal", false, 3],
      ["low", false, 4]
    ]);
    assert.deepEqual(mock.priorityScheduling.log, [
      "immediate",
      "user-blocking",
      "normal",
      "low"
    ]);
    assert.deepEqual(mock.delayedScheduling.afterSecondFlush.events, [
      ["ready", 0],
      ["delay10", 10]
    ]);
    assert.deepEqual(
      mock.continuationScheduling.afterFlushAll.events,
      ["normal-start", "normal-continuation", "low"]
    );
    assert.deepEqual(mock.paintYielding.afterFlushAll.events, [
      "paint-start",
      "paint-continuation",
      "after-paint"
    ]);
    assert.deepEqual(mock.expiredScheduling, [["user-blocking", true, 251]]);
    assert.equal(mock.cancellation.taskCallbackAfterCancel.type, "null");
    assert.equal(mock.flushAllWithUnassertedLog.status, "throws");
    assert.equal(mock.resetState.hasPendingWork, false);
  }
});

test("unstable_post_task oracle captures plain Node failure and shimmed behavior", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const plain = oracle.observations[mode.id].unstablePostTaskPlainNode;
    assert.equal(plain.require.requireResolve.status, "ok");
    assert.equal(plain.require.require.status, "throws");
    assert.equal(plain.require.require.name, "ReferenceError");
    assert.equal(plain.require.require.message, "window is not defined");

    const shimmed = oracle.observations[mode.id].unstablePostTaskShimmed;
    assert.deepEqual(shimmed.exportKeys, ROOT_EXPORT_KEYS);
    assert.deepEqual(
      shimmed.priorityMapping.map((entry) => [
        entry.label,
        entry.returnedNode.signal.priority,
        entry.events[1].delay
      ]),
      [
        ["immediate", "user-blocking", 0],
        ["user-blocking", "user-blocking", 0],
        ["normal", "user-visible", 0],
        ["low", "user-visible", 7],
        ["idle", "background", 0],
        ["invalid", "user-visible", 0]
      ]
    );
    assert.deepEqual(shimmed.cancellation.flush, [
      {
        type: "skip-aborted",
        signalId: 7
      }
    ]);
    assert.equal(shimmed.cancellation.callbackRan, false);
    assert.deepEqual(shimmed.callbackObservation.events, [
      ["immediate", false, 1, false],
      ["after-deadline", true]
    ]);
    assert.deepEqual(shimmed.continuationWithYield.events, [
      ["idle-start", 5],
      ["idle-continuation", 5]
    ]);
    assert.deepEqual(
      shimmed.continuationWithYield.shimEvents.map((event) => event.type),
      ["yield", "yield.then"]
    );
    assert.equal(shimmed.noops.requestPaint.type, "undefined");
    assert.equal(shimmed.noops.forceFrameRate.type, "undefined");

    const withoutYield =
      oracle.observations[mode.id].unstablePostTaskWithoutYield;
    assert.deepEqual(withoutYield.events, [
      ["normal-start", 3],
      ["normal-continuation", 3]
    ]);
    assert.deepEqual(withoutYield.postContinuationEvents, [
      {
        type: "postTask",
        delay: null,
        signalId: 1,
        signalAborted: false
      }
    ]);
  }
});

test("scheduler variant oracle keeps postTask root-continuation metadata private and blocked", () => {
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: "development",
    withYield: false
  });
  const diagnostics =
    report.continuationAbortAfterFallback.diagnosticsAfterCancel;
  const row = createPrivatePostTaskRootContinuationMetadataRow(diagnostics);

  assert.equal(row.status, ROOT_CONTINUATION_METADATA_STATUS);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.browserPostTaskCompatibilityClaimed, false);
  assert.equal(row.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(row.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(
    row.blockedRootExecution.status,
    ROOT_CONTINUATION_BLOCKED_STATUS
  );
  assert.equal(row.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.reconcilerWorkExecuted, false);
  assert.equal(row.blockedRootExecution.publicRootExecution, false);
  assert.deepEqual(
    {
      fastReactComparedToScheduler:
        oracle.conformanceClaims.fastReactComparedToScheduler,
      fastReactBehaviorCompatible:
        oracle.conformanceClaims.fastReactBehaviorCompatible,
      compatibilityClaimed: oracle.conformanceClaims.compatibilityClaimed
    },
    {
      fastReactComparedToScheduler: false,
      fastReactBehaviorCompatible: false,
      compatibilityClaimed: false
    }
  );

  const staleRow = createPrivatePostTaskRootContinuationMetadataRow(
    diagnostics,
    { continuationId: "stale-root-continuation" }
  );
  assert.equal(staleRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(staleRow.rejectionReason, "stale-continuation");
  assert.equal(staleRow.compatibilityClaimed, false);
});

test("native variant oracle captures fallback and nativeRuntimeScheduler delegation", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const fallback = oracle.observations[mode.id].nativeFallback;
    assert.deepEqual(fallback.exportKeys, ROOT_EXPORT_KEYS);
    assert.deepEqual(fallback.priorityConstants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.deepEqual(fallback.shouldYield, {
      beforePaint: false,
      afterPaint: true
    });
    assert.deepEqual(fallback.scheduledTask.ownKeys, [
      "id",
      "callback",
      "priorityLevel",
      "startTime",
      "expirationTime",
      "sortIndex"
    ]);
    assert.equal(fallback.scheduledTask.expirationTime, 5000);
    assert.equal(fallback.taskCallbackAfterCancel.type, "null");
    assert.deepEqual(fallback.hostEvents, [["setImmediate"]]);
    assertNativeThrowers(fallback.throwers);

    const delegated = oracle.observations[mode.id].nativeRuntimeDelegation;
    assert.deepEqual(delegated.priorityConstants, {
      unstable_ImmediatePriority: 11,
      unstable_UserBlockingPriority: 12,
      unstable_NormalPriority: 13,
      unstable_LowPriority: 14,
      unstable_IdlePriority: 15,
      unstable_Profiling: null
    });
    assert.equal(delegated.currentPriority, 13);
    assert.equal(delegated.shouldYield, "native-should-yield");
    assert.equal(delegated.now, 123);
    assert.deepEqual(delegated.events, [
      ["schedule", 12, 4],
      ["cancel", true, 12],
      ["getCurrentPriorityLevel"],
      ["shouldYield"],
      ["now"],
      ["requestPaint"]
    ]);
    assertNativeThrowers(delegated.throwers);
  }
});

test("physical CJS deep imports are resolved and their require behavior is explicit", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    for (const specifier of SCHEDULER_VARIANT_DEEP_CJS_SPECIFIERS) {
      const probe = findSchedulerVariantDeepCjsProbe(
        oracle,
        mode.id,
        specifier
      );
      assert.equal(probe.requireResolve.status, "ok", specifier);
      assert.match(probe.requireResolve.path, /^node_modules\/scheduler\//u);

      const postTaskThrows =
        specifier.endsWith("scheduler-unstable_post_task.production.js") ||
        (mode.id === "node-development" &&
          specifier.endsWith("scheduler-unstable_post_task.development.js"));

      if (postTaskThrows) {
        assert.equal(probe.require.status, "throws", specifier);
        assert.equal(probe.require.name, "ReferenceError");
        assert.equal(probe.require.message, "window is not defined");
      } else {
        assert.equal(probe.require.status, "ok", specifier);
        assert.ok(Array.isArray(probe.require.exportKeys), specifier);
      }
    }
  }
});

test("scheduler variant oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedSchedulerVariantOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|fast-react-scheduler-variant-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print-scheduler-variant-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-variant-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerVariantOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerVariantOracleText());
});

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

function assertNativeThrowers(throwers) {
  for (const key of [
    "unstable_runWithPriority",
    "unstable_next",
    "unstable_wrapCallback",
    "unstable_forceFrameRate"
  ]) {
    assert.deepEqual(throwers[key], {
      status: "throws",
      name: "Error",
      code: null,
      message: "Not implemented."
    });
  }
}

function baselineVariantCurrentnessGate() {
  cachedVariantCurrentnessGate ??= evaluateSchedulerVariantCurrentnessGate({
    oracle
  });
  return cachedVariantCurrentnessGate;
}

function evaluateVariantCurrentnessWithBaselineReport({
  sourceCurrentnessReport = cloneJson(
    baselineVariantCurrentnessGate().sourceCurrentnessReport
  ),
  oracle: effectiveOracle = oracle
} = {}) {
  return evaluateSchedulerVariantCurrentnessGate({
    oracle: effectiveOracle,
    sourceCurrentnessReport
  });
}

function assertVariantCurrentnessRow(
  row,
  {
    classification,
    modeId,
    entrypoint,
    packagePath,
    deepCjsPath,
    directDeepCjsImport,
    sourceDiagnosticIds
  }
) {
  assert.equal(row.classification, classification, row.variantId);
  assert.equal(
    row.rootNativeMockPostTaskClassification,
    classification,
    row.variantId
  );
  assert.equal(row.modeId, modeId, row.variantId);
  assert.equal(row.entrypoint, entrypoint, row.variantId);
  assert.equal(row.packagePath, packagePath, row.variantId);
  assert.equal(row.deepCjsPath, deepCjsPath, row.variantId);
  assert.equal(row.directDeepCjsImport, directDeepCjsImport, row.variantId);
  assert.deepEqual(
    row.sourceDiagnosticIds,
    sourceDiagnosticIds,
    row.variantId
  );
  assert.equal(row.evidenceScope.sourceOwnedCurrentnessReport, true);
  assert.equal(row.evidenceScope.rootEntryEvidenceAcceptedForVariant, false);
  assert.equal(row.evidenceScope.variantEvidenceAcceptedForRootBehavior, false);
  assert.equal(row.evidenceScope.behaviorEvidenceClaimed, false);
  assert.equal(row.evidenceScope.rootBehaviorEvidenceClaimed, false);
  assert.equal(row.evidenceScope.variantBehaviorEvidenceClaimed, false);
  assert.equal(row.evidenceScope.directDeepCjsBehaviorEvidenceClaimed, false);
  assert.equal(row.compatibilityClaimed, false);
}

function assertViolation(gate, id) {
  assert.ok(
    gate.violations.some((violation) => violation.id === id),
    `missing violation ${id}`
  );
}

function violationById(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.ok(violation, `missing violation ${id}`);
  return violation;
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
