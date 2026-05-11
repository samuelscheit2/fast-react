import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_TEST_UTILS_ACT_PROBE_MODES,
  REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS,
  REACT_DOM_TEST_UTILS_ACT_TARGET
} from "../src/react-dom-test-utils-act-targets.mjs";
import {
  REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS,
  REACT_DOM_TEST_UTILS_ACT_SCENARIOS
} from "../src/react-dom-test-utils-act-scenarios.mjs";
import {
  findReactDomTestUtilsActObservation,
  readCheckedReactDomTestUtilsActOracle,
  readCheckedReactDomTestUtilsActOracleText
} from "../src/react-dom-test-utils-act-oracle.mjs";

const oracle = readCheckedReactDomTestUtilsActOracle();
const require = createRequire(import.meta.url);
const {
  createReactDomLifecycleBoundaryOptions,
  createSourceOwnedReactDomLifecycleBoundary
} = require(
  fileURLToPath(
    new URL(
      "../src/react-dom-source-owned-lifecycle-boundary.cjs",
      import.meta.url
    )
  )
);
const fastReactDomTestUtilsPath = fileURLToPath(
  new URL("../../../packages/react-dom/test-utils.js", import.meta.url)
);
const fastReactPath = fileURLToPath(
  new URL("../../../packages/react/index.js", import.meta.url)
);
const fastReactPrivateActDispatcherGatePath = fileURLToPath(
  new URL(
    "../../../packages/react/private-act-dispatcher-gate.js",
    import.meta.url
  )
);
const fastReactDomTestUtilsActGatePath = fileURLToPath(
  new URL(
    "../../../packages/react-dom/src/test-utils-act-gate.js",
    import.meta.url
  )
);
const fastSchedulerMockPath = fileURLToPath(
  new URL("../../../packages/scheduler/unstable_mock.js", import.meta.url)
);
const fastSchedulerMockCjsDevelopmentPath = fileURLToPath(
  new URL(
    "../../../packages/scheduler/cjs/scheduler-unstable_mock.development.js",
    import.meta.url
  )
);
const fastSchedulerMockCjsProductionPath = fileURLToPath(
  new URL(
    "../../../packages/scheduler/cjs/scheduler-unstable_mock.production.js",
    import.meta.url
  )
);
const privateActQueueFlushDiagnosticsExport =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";
const privateSchedulerMockDelayedActRootWorkDiagnosticsKind =
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics";
const privateSchedulerMockDelayedActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkDiagnosticsKind
);
const privateSchedulerMockDelayedRendererRootWorkMetadataKind =
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata";
const privateSchedulerMockExpiredActRootWorkMetadataKind =
  "fast-react.scheduler.mock-expired-act-root-work-metadata";
const privateSchedulerMockExpiredActRootWorkMetadataBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkMetadataKind
);
const privateSchedulerMockExpiredActRootWorkDiagnosticsKind =
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics";
const privateSchedulerMockExpiredActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockExpiredActRootWorkDiagnosticsKind
);
const privateSchedulerDrivenPassiveEffectDiagnosticsKind =
  "fast-react.react.private-scheduler-driven-passive-effect-diagnostics";
const privateSchedulerDrivenPassiveEffectDiagnosticsBrand = Symbol.for(
  privateSchedulerDrivenPassiveEffectDiagnosticsKind
);
const oldSchedulerMockExpiredActRootWorkSourceProof = Symbol.for(
  "fast-react.scheduler.mock-expired-act-root-work-source-proof"
);
const oldSchedulerMockExpiredActRootWorkSourceTokenKey = Symbol.for(
  "fast-react.scheduler.mock-expired-act-root-work-source-token"
);
const oldSchedulerMockExpiredActRootWorkSourceSetKey = Symbol.for(
  "fast-react.scheduler.mock-expired-act-root-work-source-set"
);
const acceptedSchedulerMockExpiredActRootWorkRecords = [
  "RootLaneSchedulingSnapshot",
  "UpdateContainerResult",
  "RootScheduleUpdateRecord",
  "RootTaskScheduleRecord",
  "SchedulerCallbackRequest",
  "RootSchedulerCallbackExecutionRecord",
  "HostRootFinishedWorkPendingCommitRecordForCanary",
  "HostRootFinishedWorkCommitHandoffRecordForCanary"
];

test("checked react-dom/test-utils.act oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-test-utils-act-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-test-utils-act-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per act scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_TEST_UTILS_ACT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("react-dom/test-utils.act oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-dom-comparison"
    ),
    true
  );
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "no-renderer-flush-semantics"),
    true
  );
});

test("react-dom/test-utils.act oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_TEST_UTILS_ACT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_TEST_UTILS_ACT_SCENARIOS);

  for (const mode of REACT_DOM_TEST_UTILS_ACT_PROBE_MODES) {
    const observations = oracle.actObservations[mode.id];
    assert.equal(observations.length, REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS.length);

    for (const scenarioId of REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS) {
      const observation = findReactDomTestUtilsActObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.specifier, "react-dom/test-utils");
      assert.equal(observation.subpath, "./test-utils");
      assert.deepEqual(observation.processEvents, []);
    }
  }
});

test("React DOM test-utils act export shape and React.act relationship are recorded", () => {
  const development = resultFor("default-node-development", "module-export-shape");
  assert.deepEqual(development.requireModule.objectKeys, ["act"]);
  assert.deepEqual(keyValues(development.requireModule.ownKeys), ["act"]);
  assert.deepEqual(
    dataDescriptorFields(
      descriptorFor(development.requireModule.descriptors, "act")
    ),
    {
      configurable: true,
      enumerable: true,
      writable: true
    }
  );
  assert.deepEqual(
    descriptorFor(development.requireModule.descriptors, "act").value,
    {
      type: "function",
      name: "",
      length: 1,
      isAsync: false,
      ownPropertyNames: ["length", "name", "prototype"],
      ownKeys: [
        { type: "string", value: "length" },
        { type: "string", value: "name" },
        { type: "string", value: "prototype" }
      ]
    }
  );
  assert.deepEqual(keyValues(development.dynamicImportModule.ownKeys), [
    "act",
    "default",
    "module.exports",
    "Symbol.toStringTag"
  ]);
  assert.equal(development.relationships.testUtilsActEqualsReactAct, false);
  assert.equal(development.relationships.importedActEqualsRequiredAct, true);
  assert.equal(development.relationships.importedDefaultEqualsRequire, true);
  assert.equal(development.relationships.reactActType, "function");

  const production = resultFor("default-node-production", "module-export-shape");
  assert.equal(production.reactActExport.hasOwn, false);
  assert.equal(production.relationships.reactActType, "undefined");

  const server = resultFor("react-server-development", "module-export-shape");
  assert.equal(server.reactActExport.hasOwn, false);
  assert.equal(server.relationships.reactActType, "undefined");
});

test("Fast React test-utils act keeps the oracle-shaped package surface but fails closed", async () => {
  const development = resultFor("default-node-development", "module-export-shape");
  const expectedActDescriptor = descriptorFor(
    development.requireModule.descriptors,
    "act"
  );
  const testUtils = loadFreshCjs(fastReactDomTestUtilsPath);
  const react = loadFreshCjs(fastReactPath);

  assert.deepEqual(
    Object.keys(testUtils),
    development.requireModule.objectKeys
  );
  assert.deepEqual(
    dataDescriptorFieldsForObject(
      Object.getOwnPropertyDescriptor(testUtils, "act")
    ),
    dataDescriptorFields(expectedActDescriptor)
  );
  assert.deepEqual(
    describeFunctionValue(testUtils.act),
    expectedActDescriptor.value
  );
  assert.equal(testUtils.act === react.act, false);

  assert.deepEqual(
    Object.getOwnPropertyDescriptor(testUtils, "__FAST_REACT_PLACEHOLDER__"),
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(testUtils, "__FAST_REACT_ENTRYPOINT__"),
    {
      configurable: false,
      enumerable: false,
      value: "react-dom/test-utils",
      writable: false
    }
  );
  assert.deepEqual(
    Object.getOwnPropertyDescriptor(testUtils, "compatibilityTarget"),
    {
      configurable: false,
      enumerable: false,
      value: "react-dom@19.2.6",
      writable: false
    }
  );

  const imported = await import(pathToFileURL(fastReactDomTestUtilsPath).href);
  assert.equal(imported.act, testUtils.act);
  assert.equal(imported.default, testUtils);
  assert.equal(imported["module.exports"], testUtils);
  assert.deepEqual(
    keyValues(describeOwnKeys(imported)),
    keyValues(development.dynamicImportModule.ownKeys)
  );

  assertFastReactDomActBlocked(testUtils.act);
});

test("Fast React test-utils act currentness stays blocked like public React.act", () => {
  const gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);
  const report =
    gateModule.createPublicReactDomTestUtilsActBlockedCurrentnessReport();
  const consumption =
    gateModule.consumePublicReactDomTestUtilsActBlockedCurrentnessReport(
      report
    );

  assert.equal(
    gateModule.isAcceptedPublicReactDomTestUtilsActBlockedCurrentnessReport(
      report
    ),
    true
  );
  assert.equal(
    consumption.status,
    "accepted-blocked-public-react-dom-test-utils-act-currentness"
  );
  assert.equal(
    report.publicReactActBlockedCurrentnessConsumption.status,
    "accepted-blocked-public-react-act-currentness"
  );
  assert.deepEqual(report.publicTestUtilsActExport, {
    hasOwn: true,
    exportKeysInclude: true,
    value: {
      type: "function",
      name: "",
      length: 1,
      thenable: false
    }
  });
  assert.deepEqual(consumption.scenarioIds, [
    "rootless-sync-callback",
    "rootless-async-callback",
    "rootless-error-callback",
    "rootless-thenable-callback"
  ]);
  assert.deepEqual(consumption.acceptedWorkerIds, [
    "worker-913-react-act-public-blocked-currentness-gate",
    "worker-857-react-dom-act-passive-consumer",
    "worker-885-react-act-lifecycle-boundary-gate"
  ]);
  assert.deepEqual(consumption.excludedWorkerIds, [
    "worker-910-hydration-recoverable-error-boundary-admission"
  ]);
  assert.equal(consumption.publicTestUtilsActUnsupportedPlaceholder, true);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.thenableReturnBlocked, true);
  assert.equal(consumption.publicWarningCompatibilityClaimed, false);
  assert.equal(consumption.publicReactActReady, false);
  assert.equal(consumption.publicTestUtilsActReady, false);
  assert.equal(consumption.drainsPublicSchedulerTaskQueue, false);
  assert.equal(consumption.drainsPublicReactActQueue, false);
  assert.equal(consumption.publicActPassiveDrain, false);
  assert.equal(consumption.publicEffectExecution, false);
  assert.equal(consumption.publicRootExecution, false);
  assert.equal(consumption.packageCompatibilityClaimed, false);
  assert.equal(consumption.packageSurfaceChanged, false);

  for (const scenario of report.scenarios) {
    assert.equal(scenario.callbackInvoked, false, scenario.scenarioId);
    assert.equal(scenario.returnedThenable, false, scenario.scenarioId);
    assert.equal(scenario.consoleCalls.length, 0, scenario.scenarioId);
    assert.equal(scenario.callAttempt.status, "throws", scenario.scenarioId);
    assert.equal(
      scenario.callAttempt.error.name,
      "FastReactDomUnimplementedError",
      scenario.scenarioId
    );
    assert.equal(
      scenario.callAttempt.error.entrypoint,
      "react-dom/test-utils",
      scenario.scenarioId
    );
  }

  assertReactDomTestUtilsCurrentnessRejected(
    gateModule,
    Object.freeze({
      ...report
    }),
    "public-react-dom-test-utils-act-currentness-source-proof",
    "source-clone"
  );
  assertReactDomTestUtilsCurrentnessRejected(
    gateModule,
    gateModule.createPublicReactDomTestUtilsActBlockedCurrentnessReport({
      packageCompatibilityClaimed: true
    }),
    "public-react-dom-test-utils-act-currentness-package-compatibility-claim",
    "package-claim"
  );
  assertReactDomTestUtilsCurrentnessRejected(
    gateModule,
    gateModule.createPublicReactDomTestUtilsActBlockedCurrentnessReport({
      publicRootExecution: true,
      publicActPassiveDrain: true,
      drainsPublicSchedulerTaskQueue: true
    }),
    "public-react-dom-test-utils-act-currentness-prerequisite-smuggling",
    "scheduler-root-passive-smuggling"
  );
  assertReactDomTestUtilsCurrentnessRejected(
    gateModule,
    gateModule.createPublicReactDomTestUtilsActBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        consumesWorker910Evidence: true
      }
    }),
    "public-react-dom-test-utils-act-currentness-private-prerequisite-boundary",
    "worker-910-excluded"
  );
});

test("Fast React test-utils act private routing gate records accepted prerequisites without opening public act", () => {
  const gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);
  const gate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();
  const acceptedPrivateHostOutputScenarioIds = [
    "create-root-no-render",
    "initial-host-render",
    "update-host-render",
    "replace-host-tree",
    "render-null-clears-container",
    "root-unmount",
    "double-unmount",
    "render-after-unmount",
    "flush-sync-cross-root-render"
  ];
  const unsupportedPrivateHostOutputScenarioIds = [
    "development-warning-boundaries"
  ];
  const acceptedPrivateWarningBoundaryScenarioIds = [
    "development-warning-boundaries"
  ];
  const unsupportedPrivateWarningBoundaryScenarioIds =
    acceptedPrivateHostOutputScenarioIds;
  const blockedPrivateHostOutputPrerequisiteIds =
    acceptedPrivateHostOutputScenarioIds.map(
      (scenarioId) => `accepted-private-root-host-output-${scenarioId}`
    );
  const blockedPrivateWarningBoundaryPrerequisiteIds =
    acceptedPrivateWarningBoundaryScenarioIds.map(
      (scenarioId) => `accepted-private-root-warning-boundary-${scenarioId}`
    );
  const acceptedPrivatePassiveDiagnosticIds = [
    "passive-effects-committed-fiber-traversal",
    "passive-effects-scheduler-flush-diagnostic",
    "passive-effect-mount-unmount-execution-diagnostics",
    "passive-effect-root-error-routing-diagnostics",
    "scheduler-driven-passive-effect-execution-diagnostics"
  ];
  const blockedPrivatePassivePrerequisiteIds =
    acceptedPrivatePassiveDiagnosticIds.map(
      (diagnosticId) => `accepted-private-passive-diagnostic-${diagnosticId}`
    );
  const privateSyncFlushRootHandoffPrerequisiteIds = [
    "sync-flush-nested-act-root-continuation-evidence",
    "sync-flush-root-scheduler-finished-work-handoff-evidence"
  ];
  const privateSchedulerMockExpiredActRootWorkPrerequisiteId =
    "scheduler-mock-expired-act-root-work-diagnostics";
  const privateReactActSchedulerDiagnosticsLedgerPrerequisiteId =
    "react-act-scheduler-private-diagnostics-ledger";
  const privateSchedulerMockDelayedActRootWorkPrerequisiteId =
    "scheduler-mock-delayed-act-root-work-nested-expired-diagnostics";

  assert.equal(
    gate.status,
    "blocked-public-test-utils-act-private-routing"
  );
  assert.equal(
    gate.id,
    "react-dom-test-utils-act-private-routing-gate-5"
  );
  assert.equal(gate.entrypoint, "react-dom/test-utils");
  assert.equal(gate.compatibilityTarget, "react-dom@19.2.6");
  assert.equal(gate.publicActStatus, "unsupported-public-test-utils-act-placeholder");
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.privatePrerequisitesPresent, true);
  assert.equal(gate.privateRoutingReady, false);
  assert.equal(gate.publicReactActReady, false);
  assert.equal(gate.publicTestUtilsActReady, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.stalePrivatePrerequisites, []);
  assert.deepEqual(gate.privatePrerequisitePublicClaims, []);
  assert.deepEqual(gate.acceptedPrivatePrerequisiteIds, [
    "react-act-private-dispatcher-gate",
    privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
    privateSchedulerMockDelayedActRootWorkPrerequisiteId,
    "scheduler-act-queue-routing-records",
    "scheduler-mock-flush-helper-metadata",
    "sync-flush-act-continuation-records",
    "sync-flush-post-passive-continuation-execution-gate",
    ...privateSyncFlushRootHandoffPrerequisiteIds,
    "passive-effects-flush-metadata",
    "passive-effect-callback-handle-metadata",
    "passive-effects-committed-fiber-traversal",
    "passive-effects-scheduler-flush-diagnostic",
    "passive-effect-mount-unmount-execution-diagnostics",
    "passive-effect-root-error-routing-diagnostics",
    "scheduler-driven-passive-effect-execution-diagnostics",
    "react-dom-private-root-bridge-records",
    "react-dom-private-flush-sync-root-output-diagnostic",
    "react-dom-private-root-warning-boundary-diagnostics",
    "react-dom-private-flush-sync-guard"
  ]);
  assert.deepEqual(gate.blockedPublicPrerequisiteIds, [
    "public-react-act-delegation",
    "act-queue-flushing-execution",
    "passive-effect-callback-execution",
    "public-react-dom-root-execution",
    "public-react-dom-flush-sync-execution",
    "public-react-dom-warning-boundary-compatibility"
  ]);
  assert.deepEqual(gate.publicPrerequisitesStillBlocked, [
    "public-react-act-delegation",
    "act-queue-flushing-execution",
    "passive-effect-callback-execution",
    "public-react-dom-root-execution",
    "public-react-dom-flush-sync-execution",
    "public-react-dom-warning-boundary-compatibility"
  ]);
  assert.deepEqual(
    gate.blockedPrivateRootHostOutputPrerequisiteIds,
    blockedPrivateHostOutputPrerequisiteIds
  );
  assert.deepEqual(
    gate.privateRootHostOutputPrerequisitesStillBlocked,
    blockedPrivateHostOutputPrerequisiteIds
  );
  assert.deepEqual(
    gate.blockedPrivateRootWarningBoundaryPrerequisiteIds,
    blockedPrivateWarningBoundaryPrerequisiteIds
  );
  assert.deepEqual(
    gate.privateRootWarningBoundaryPrerequisitesStillBlocked,
    blockedPrivateWarningBoundaryPrerequisiteIds
  );
  assert.deepEqual(
    gate.blockedPrivatePassivePrerequisiteIds,
    blockedPrivatePassivePrerequisiteIds
  );
  assert.deepEqual(
    gate.privatePassivePrerequisitesStillBlocked,
    blockedPrivatePassivePrerequisiteIds
  );
  const publicPassivePrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "passive-effect-callback-execution"
  );
  assert.equal(
    publicPassivePrerequisite.blockedByAcceptedPrivatePassiveDiagnostics,
    true
  );
  const actQueuePrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "act-queue-flushing-execution"
  );
  assert.equal(
    actQueuePrerequisite.blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics,
    true
  );
  assert.deepEqual(
    actQueuePrerequisite.acceptedPrivateSyncFlushRootHandoffPrerequisiteIds,
    privateSyncFlushRootHandoffPrerequisiteIds
  );
  assert.equal(
    actQueuePrerequisite
      .blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    actQueuePrerequisite
      .acceptedPrivateSchedulerMockExpiredActRootWorkPrerequisiteId,
    privateSchedulerMockExpiredActRootWorkPrerequisiteId
  );
  assert.equal(
    actQueuePrerequisite
      .blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    actQueuePrerequisite
      .acceptedPrivateSchedulerMockDelayedActRootWorkPrerequisiteId,
    privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );
  const publicReactActPrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "public-react-act-delegation"
  );
  assert.equal(
    publicReactActPrerequisite
      .blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    publicReactActPrerequisite
      .blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    publicPassivePrerequisite.privatePassiveDiagnosticGateId,
    "react-dom-test-utils-act-private-passive-diagnostic-gate-1"
  );
  assert.equal(
    publicPassivePrerequisite.privatePassiveDiagnosticStatus,
    "accepted-private-passive-effect-diagnostic-without-public-act-passive-drain"
  );
  assert.deepEqual(
    publicPassivePrerequisite.acceptedPrivatePassiveDiagnosticIds,
    acceptedPrivatePassiveDiagnosticIds
  );
  assert.equal(publicPassivePrerequisite.acceptedPrivatePassiveDiagnosticCount, 5);
  assert.equal(publicPassivePrerequisite.publicEffectExecutionEnabled, false);
  assert.equal(
    publicPassivePrerequisite.schedulerDrivenPassiveExecutionEnabled,
    false
  );
  assert.equal(publicPassivePrerequisite.publicRootErrorCallbacksInvoked, false);
  assert.equal(publicPassivePrerequisite.publicActErrorAggregationEnabled, false);
  const publicRootPrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "public-react-dom-root-execution"
  );
  assert.equal(
    publicRootPrerequisite.blockedByAcceptedPrivateRootHostOutputDiagnostics,
    true
  );
  assert.equal(
    publicRootPrerequisite.blockedByAcceptedPrivateRootWarningBoundaryDiagnostics,
    true
  );
  assert.equal(
    publicRootPrerequisite
      .blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics,
    true
  );
  assert.deepEqual(
    publicRootPrerequisite.acceptedPrivateSyncFlushRootHandoffPrerequisiteIds,
    privateSyncFlushRootHandoffPrerequisiteIds
  );
  assert.equal(
    publicRootPrerequisite
      .blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    publicRootPrerequisite
      .acceptedPrivateSchedulerMockExpiredActRootWorkPrerequisiteId,
    privateSchedulerMockExpiredActRootWorkPrerequisiteId
  );
  assert.equal(
    publicRootPrerequisite
      .blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    publicRootPrerequisite
      .acceptedPrivateSchedulerMockDelayedActRootWorkPrerequisiteId,
    privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );
  assert.deepEqual(
    publicRootPrerequisite.acceptedPrivateHostOutputDiagnosticScenarios,
    acceptedPrivateHostOutputScenarioIds
  );
  assert.deepEqual(
    publicRootPrerequisite.unsupportedPrivateHostOutputDiagnosticScenarios,
    unsupportedPrivateHostOutputScenarioIds
  );
  assert.equal(
    publicRootPrerequisite.acceptedPrivateHostOutputScenarioModeRowCount,
    18
  );
  assert.equal(
    publicRootPrerequisite.unsupportedPrivateHostOutputScenarioModeRowCount,
    2
  );
  assert.deepEqual(
    publicRootPrerequisite.acceptedPrivateWarningBoundaryDiagnosticScenarios,
    acceptedPrivateWarningBoundaryScenarioIds
  );
  assert.deepEqual(
    publicRootPrerequisite.unsupportedPrivateWarningBoundaryDiagnosticScenarios,
    unsupportedPrivateWarningBoundaryScenarioIds
  );
  assert.equal(
    publicRootPrerequisite.acceptedPrivateWarningBoundaryScenarioModeRowCount,
    2
  );
  assert.equal(
    publicRootPrerequisite.unsupportedPrivateWarningBoundaryScenarioModeRowCount,
    18
  );
  const publicFlushSyncPrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "public-react-dom-flush-sync-execution"
  );
  assert.equal(
    publicFlushSyncPrerequisite
      .blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics,
    true
  );
  assert.deepEqual(
    publicFlushSyncPrerequisite.acceptedPrivateSyncFlushRootHandoffPrerequisiteIds,
    privateSyncFlushRootHandoffPrerequisiteIds
  );
  assert.deepEqual(gate.sideEffectPolicy, {
    invokesActCallback: false,
    executesQueuedWork: false,
    executesPassiveEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    executesPublicRendererRoots: false,
    executesPublicDomMutation: false,
    executesSyncFlush: false,
    executesPublicFlushSync: false,
    emitsDeprecationWarning: false,
    delegatesToReactAct: false
  });
  assert.equal(
    gate.deprecationWarningBehavior,
    "preserved-no-warning-while-public-test-utils-act-is-placeholder"
  );
  assert.equal(
    gate.publicTestUtilsActBlockedCurrentness.status,
    "blocked-public-react-dom-test-utils-act-unsupported-placeholder-currentness"
  );
  assert.equal(
    gate.publicTestUtilsActBlockedCurrentness
      .consumesPublicReactActBlockedCurrentnessReport,
    true
  );
  assert.equal(
    gate.publicTestUtilsActBlockedCurrentness
      .excludesUnacceptedPrivateRootPrerequisites,
    true
  );
  assert.equal(
    gate.publicTestUtilsActBlockedCurrentness.acceptsFutureWorkerEvidence,
    false
  );
  assert.equal(
    gate.publicTestUtilsActBlockedCurrentness.packageCompatibilityClaimed,
    false
  );

  assert.deepEqual(gate.reactActPrivateDispatcher, {
    status: "blocked-until-renderer-roots-passive-effects-and-act-continuations",
    requiredRecords: [
      "SchedulerActQueueRequest",
      "SchedulerActScopeBoundaryRecord",
      "SyncFlushActContinuationRecord"
    ],
    requiredTaskKinds: ["RootSchedule", "SchedulerCallback"],
    requiredContinuationStatuses: ["NoContinuation", "PendingContinuation"],
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    schedulerMockExpiredActRootWorkDiagnosticsReady: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    acceptedSchedulerMockExpiredActRootWorkRecords:
      acceptedSchedulerMockExpiredActRootWorkRecords,
    schedulerMockDelayedActRootWorkDiagnosticsReady: true,
    preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
    schedulerMockDelayedActRootWorkPreflightStatus:
      "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
    acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
      true,
    acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
    schedulerDrivenPassiveEffectDiagnosticsReady: true,
    consumesSchedulerDrivenPassiveEffectDiagnostics: true,
    schedulerDrivenPassiveEffectConsumptionStatus:
      "consumed-accepted-private-scheduler-driven-passive-effect-execution-diagnostics",
    acceptedSchedulerDrivenPassiveEffectRecords: [
      "SchedulerActQueueRequest",
      "SyncFlushActPrivateExecutionDiagnosticsForCanary",
      "SchedulerPassiveEffectsFlushRequest",
      "PassiveEffectSchedulerFlushGateRecord",
      "PendingPassiveCommitHandoff",
      "PassiveEffectSchedulerFlushExecutionRecord",
      "PassiveEffectsFlushResult",
      "PassiveEffectFlushRecord",
      "PassiveEffectDestroyCallbackExecutionRecord",
      "PassiveEffectMountCreateCallbackExecutionRecord"
    ],
    requiresSourceOwnedActiveLifecycleRequestBoundary: true,
    schedulerDrivenPassiveLifecycleBoundaryStatus:
      "accepted-private-root-public-facade-lifecycle-container-snapshot",
    schedulerDrivenPassiveLifecycleBoundaryKind:
      "FastReactDomPrivateRootPublicFacadeLifecycleContainerSnapshotRecord",
    acceptedSchedulerDrivenPassiveLifecycleBoundaryRecords: [
      "FastReactDomPrivateRootPublicFacadeLifecycleContainerSnapshotRecord",
      "FastReactDomPrivateRootCreateRecord",
      "FastReactDomPrivateRootUpdateRecord"
    ],
    privateSchedulerDrivenPassiveExecution: true,
    schedulerDrivenPassiveExecution: false,
    executesQueuedWork: false,
    executesEffects: false
  });
  assert.deepEqual(gate.schedulerMockFlushHelpers, {
    status: "accepted-scheduler-mock-flush-helper-and-continuation-evidence",
    helpers: [
      "unstable_flushAll",
      "unstable_flushAllWithoutAsserting",
      "unstable_flushExpired",
      "unstable_flushNumberOfYields",
      "unstable_flushUntilNextPaint"
    ],
    evidenceScenarios: [
      "scheduler-mock-export-shape",
      "scheduler-mock-flush-helpers",
      "scheduler-mock-continuations-and-paint"
    ],
    deterministicMockFlushEvidence: true,
    mockContinuationEvidence: true,
    executesActQueueTasks: false,
    executesRendererWork: false,
    executesScheduledCallbacks: false
  });
  assert.deepEqual(gate.syncFlushActContinuation.records, [
    "SchedulerActContinuationRecord",
    "SyncFlushActPostPassiveContinuationGateRecord",
    "SyncFlushRootRecord.act_continuation",
    "SyncFlushRootRecord.act_post_passive_continuation_gate"
  ]);
  assert.deepEqual(gate.syncFlushPostPassiveContinuationExecution, {
    status:
      "private-sync-flush-post-passive-continuation-executes-follow-up-sync-flush",
    records: [
      "SyncFlushPostPassiveContinuationExecutionGateRecord",
      "SyncFlushPostPassiveContinuationExecutionRecord",
      "SyncFlushPostPassiveContinuationRootRecord",
      "sync_flush_post_passive_continuation_execution_gate",
      "SyncFlushPostPassiveContinuationExecutionGateRecord.should_execute_follow_up_sync_flush",
      "flush_sync_post_passive_continuation_after_passive_effects",
      "flush_passive_effects_after_commit_and_sync_flush_continuation",
      "PassiveEffectsFlushWithSyncFlushContinuationResult",
      "SyncFlushPostPassiveContinuationExecutionRecord.did_execute_follow_up_sync_flush",
      "SyncFlushPostPassiveContinuationExecutionRecord.did_flush_follow_up_sync_work",
      "SyncFlushRootRecord::post_passive_continuation_execution_gate"
    ],
    observesPendingPassiveHandoff: true,
    collectsContinuationRoots: true,
    consumesPendingPassive: true,
    privateExecution: true,
    rendersContinuationRoots: true,
    commitsContinuationRoots: true,
    executesSyncFlush: true,
    executesPassiveEffects: false,
    invokesCallbacks: false
  });
  assert.deepEqual(gate.privateSyncFlushRootHandoffDiagnostics, {
    gateId: "react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1",
    status:
      "accepted-private-test-utils-act-sync-flush-root-handoff-diagnostics-without-public-act-routing",
    workerIds: [
      "worker-694-sync-flush-nested-act-root-continuation",
      "worker-718-sync-flush-root-scheduler-finished-work-handoff"
    ],
    prerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
    acceptedPrerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
    evidence: [
      "worker-694-nested-act-continuation-order-and-lane-preservation",
      "worker-718-sync-flush-root-scheduler-finished-work-finished-lanes-handoff",
      "nested-act-continuations-preserve-sync-flush-order",
      "remaining-lanes-survive-nested-act-continuation",
      "finished-work-and-finished-lanes-required-before-private-commit",
      "missing-stale-and-foreign-finished-work-handoffs-rejected",
      "public-act-flushsync-root-execution-remains-blocked"
    ],
    evidenceRequirements: [
      {
        id: "sync-flush-nested-act-root-continuation-evidence",
        workerId: "worker-694-sync-flush-nested-act-root-continuation",
        status:
          "accepted-private-sync-flush-nested-act-root-continuation-without-public-act-flushsync",
        source:
          "worker-progress/worker-694-sync-flush-nested-act-root-continuation.md",
        requiredTrueFields: [
          "evidenceFresh",
          "staleEvidenceRejected",
          "consumesNestedActContinuationEvidence",
          "preservesNestedActContinuationOrder",
          "preservesRemainingLanes",
          "restoresLaneStateAfterContinuation"
        ],
        requiredFalseFields: [
          "staleEvidence",
          "publicActExecution",
          "publicFlushSyncExecution",
          "publicRootExecution",
          "publicEffectExecution",
          "executesRendererWork",
          "publicActCompatibilityClaimed",
          "publicFlushSyncCompatibilityClaimed",
          "compatibilityClaimed"
        ]
      },
      {
        id: "sync-flush-root-scheduler-finished-work-handoff-evidence",
        workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
        status:
          "accepted-private-sync-flush-root-scheduler-finished-work-handoff-without-public-root-execution",
        source:
          "worker-progress/worker-718-sync-flush-root-scheduler-finished-work-handoff.md",
        requiredTrueFields: [
          "evidenceFresh",
          "staleEvidenceRejected",
          "consumesFinishedWorkHandoffEvidence",
          "requiresFinishedWork",
          "requiresFinishedLanes",
          "rejectsMissingFinishedWorkHandoff",
          "rejectsStaleFinishedWorkHandoff",
          "rejectsForeignFinishedWorkHandoff"
        ],
        requiredFalseFields: [
          "staleEvidence",
          "publicActExecution",
          "publicFlushSyncExecution",
          "publicRootExecution",
          "publicEffectExecution",
          "executesRendererWork",
          "publicActCompatibilityClaimed",
          "publicFlushSyncCompatibilityClaimed",
          "publicRootCompatibilityClaimed",
          "compatibilityClaimed"
        ]
      }
    ],
    summary: {
      gateId: "react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1",
      status:
        "accepted-private-test-utils-act-sync-flush-root-handoff-diagnostics-without-public-act-routing",
      workerIds: [
        "worker-694-sync-flush-nested-act-root-continuation",
        "worker-718-sync-flush-root-scheduler-finished-work-handoff"
      ],
      prerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
      consumesNestedActContinuationEvidence: true,
      consumesFinishedWorkHandoffEvidence: true,
      requiresFinishedWork: true,
      requiresFinishedLanes: true,
      rejectsMissingEvidence: true,
      rejectsStaleEvidence: true,
      rejectsForeignFinishedWorkHandoff: true,
      publicActExecution: false,
      publicFlushSyncExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      executesRendererWork: false,
      compatibilityClaimed: false
    },
    nestedActContinuation: {
      id: "sync-flush-nested-act-root-continuation-evidence",
      status:
        "accepted-private-sync-flush-nested-act-root-continuation-without-public-act-flushsync",
      workerId: "worker-694-sync-flush-nested-act-root-continuation",
      records: [
        "SchedulerBridgeActContinuationExecutionRecord.execution_order",
        "SchedulerBridgeActContinuationExecutionRecord.pending_lanes_before_execution",
        "SchedulerBridgeActContinuationExecutionRecord.pending_lanes_after_execution",
        "SyncFlushActPrivateExecutionDiagnosticsForCanary",
        "root_scheduler_nested_act_continuations_preserve_order_and_remaining_lanes",
        "sync_flush_nested_act_root_continuations_preserve_callback_order_and_lanes"
      ],
      evidenceFresh: true,
      staleEvidenceRejected: true,
      consumesNestedActContinuationEvidence: true,
      preservesNestedActContinuationOrder: true,
      preservesRemainingLanes: true,
      restoresLaneStateAfterContinuation: true,
      publicActExecution: false,
      publicFlushSyncExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      executesRendererWork: false,
      compatibilityClaimed: false
    },
    finishedWorkHandoff: {
      id: "sync-flush-root-scheduler-finished-work-handoff-evidence",
      status:
        "accepted-private-sync-flush-root-scheduler-finished-work-handoff-without-public-root-execution",
      workerId: "worker-718-sync-flush-root-scheduler-finished-work-handoff",
      records: [
        "RootSchedulerSyncContinuationFinishedWorkHandoff",
        "SyncFlushRootRecord.finished_work",
        "SyncFlushRootRecord.finished_lanes",
        "FiberRoot.finished_work",
        "FiberRoot.finished_lanes",
        "root_scheduler_finished_work_handoff_rejects_missing_record",
        "root_scheduler_finished_work_handoff_rejects_stale_record",
        "sync_flush_finished_work_handoff_rejects_foreign_record"
      ],
      evidenceFresh: true,
      staleEvidenceRejected: true,
      consumesFinishedWorkHandoffEvidence: true,
      requiresFinishedWork: true,
      requiresFinishedLanes: true,
      rejectsMissingFinishedWorkHandoff: true,
      rejectsStaleFinishedWorkHandoff: true,
      rejectsForeignFinishedWorkHandoff: true,
      publicActExecution: false,
      publicFlushSyncExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      executesRendererWork: false,
      compatibilityClaimed: false
    },
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    compatibilityClaimed: false
  });
  const nestedActPrerequisite = gate.acceptedPrivatePrerequisites.find(
    (prerequisite) =>
      prerequisite.id === "sync-flush-nested-act-root-continuation-evidence"
  );
  assert.equal(
    nestedActPrerequisite.workerId,
    "worker-694-sync-flush-nested-act-root-continuation"
  );
  assert.equal(nestedActPrerequisite.preservesNestedActContinuationOrder, true);
  assert.equal(nestedActPrerequisite.preservesRemainingLanes, true);
  assert.equal(nestedActPrerequisite.publicActCompatibilityClaimed, false);
  assert.equal(nestedActPrerequisite.publicFlushSyncCompatibilityClaimed, false);
  assert.equal(nestedActPrerequisite.executesRendererWork, false);

  const finishedWorkPrerequisite = gate.acceptedPrivatePrerequisites.find(
    (prerequisite) =>
      prerequisite.id ===
      "sync-flush-root-scheduler-finished-work-handoff-evidence"
  );
  assert.equal(
    finishedWorkPrerequisite.workerId,
    "worker-718-sync-flush-root-scheduler-finished-work-handoff"
  );
  assert.equal(finishedWorkPrerequisite.requiresFinishedWork, true);
  assert.equal(finishedWorkPrerequisite.requiresFinishedLanes, true);
  assert.equal(finishedWorkPrerequisite.rejectsStaleFinishedWorkHandoff, true);
  assert.equal(finishedWorkPrerequisite.publicRootExecution, false);
  assert.equal(finishedWorkPrerequisite.executesRendererWork, false);
  const expiredSchedulerPrerequisite = gate.acceptedPrivatePrerequisites.find(
    (prerequisite) =>
      prerequisite.id === privateSchedulerMockExpiredActRootWorkPrerequisiteId
  );
  assert.equal(
    expiredSchedulerPrerequisite.workerId,
    "worker-747-react-private-act-expired-scheduler-consumer"
  );
  assert.equal(
    expiredSchedulerPrerequisite.requiresSchedulerOwnedSourceProof,
    true
  );
  assert.equal(expiredSchedulerPrerequisite.rejectsClonedDiagnostics, true);
  assert.equal(expiredSchedulerPrerequisite.rejectsForgedDiagnostics, true);
  assert.equal(expiredSchedulerPrerequisite.queueFlushingReady, false);
  assert.equal(expiredSchedulerPrerequisite.rendererRootsReady, false);
  assert.equal(expiredSchedulerPrerequisite.passiveEffectsReady, false);
  assert.equal(expiredSchedulerPrerequisite.executesRendererWork, false);
  assert.equal(expiredSchedulerPrerequisite.executesEffects, false);
  assert.deepEqual(
    gate.privateSchedulerMockExpiredActRootWorkDiagnostics.records,
    acceptedSchedulerMockExpiredActRootWorkRecords
  );
  assert.equal(
    gate.privateSchedulerMockExpiredActRootWorkDiagnostics
      .consumesReactActPrivateSchedulerDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockExpiredActRootWorkDiagnostics.publicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.privateSchedulerMockExpiredActRootWorkDiagnostics.executesRendererRoots,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.workerId,
    "worker-835-react-dom-test-utils-act-delayed-scheduler-handoff"
  );
  const delayedSchedulerPrerequisite = gate.acceptedPrivatePrerequisites.find(
    (prerequisite) =>
      prerequisite.id === privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );
  assert.equal(
    delayedSchedulerPrerequisite,
    gate.acceptedPrivatePrerequisites[3]
  );
  assert.equal(
    delayedSchedulerPrerequisite.workerId,
    "worker-835-react-dom-test-utils-act-delayed-scheduler-handoff"
  );
  assert.equal(
    delayedSchedulerPrerequisite.status,
    "accepted-private-test-utils-act-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics-without-public-act-routing"
  );
  assert.equal(
    delayedSchedulerPrerequisite.source,
    "packages/react-dom/src/test-utils-act-gate.js"
  );
  assert.equal(delayedSchedulerPrerequisite.present, true);
  assert.equal(delayedSchedulerPrerequisite.recordOnly, false);
  assert.equal(delayedSchedulerPrerequisite.privateDiagnostic, true);
  assert.equal(
    delayedSchedulerPrerequisite.diagnosticGateId,
    "react-dom-test-utils-act-private-scheduler-mock-delayed-act-root-work-gate-1"
  );
  assert.equal(
    delayedSchedulerPrerequisite.diagnosticStatus,
    delayedSchedulerPrerequisite.status
  );
  assert.equal(
    delayedSchedulerPrerequisite.preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    delayedSchedulerPrerequisite.consumesNestedExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(delayedSchedulerPrerequisite.rejectsStaleDiagnostics, true);
  assert.equal(
    delayedSchedulerPrerequisite.rejectsForeignRendererRootEvidence,
    true
  );
  assert.equal(delayedSchedulerPrerequisite.rejectsTamperedDiagnostics, true);
  assert.equal(delayedSchedulerPrerequisite.rejectsPublicClaims, true);
  assert.equal(
    delayedSchedulerPrerequisite
      .acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
    false
  );
  assert.equal(delayedSchedulerPrerequisite.publicActExecution, false);
  assert.equal(delayedSchedulerPrerequisite.publicRootExecution, false);
  assert.equal(
    delayedSchedulerPrerequisite.publicSchedulerFlushBehaviorExecuted,
    false
  );
  assert.equal(delayedSchedulerPrerequisite.executesRendererRoots, false);
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.prerequisiteId,
    privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .reactActPreflightStatus,
    "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics"
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .consumesNestedExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .rejectsStaleDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .rejectsForeignRendererRootEvidence,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .rejectsTamperedDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.rejectsPublicClaims,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.publicActExecution,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.publicRootExecution,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .publicSchedulerFlushBehaviorExecuted,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.executesRendererRoots,
    false
  );
  assert.deepEqual(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.records,
    [
      "DelayedActRootWorkMetadata",
      "DelayedRendererRootWorkMetadata",
      "DelayedCallbackPromotionEvidence",
      "SchedulerMockDelayedActRootWorkDiagnostics",
      "NestedExpiredActRootWorkDrainReport",
      ...acceptedSchedulerMockExpiredActRootWorkRecords
    ]
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .consumesReactActPrivateDelayedSchedulerDiagnostics,
    true
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .publicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics
      .publicSchedulerFlushBehaviorExecuted,
    false
  );
  assert.equal(
    gate.privateSchedulerMockDelayedActRootWorkDiagnostics.executesRendererRoots,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.gateId,
    "private-admission-810-react-act-scheduler-diagnostics-ledger-1"
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.status,
    "recognized-react-act-scheduler-private-diagnostics-ledger-public-blocked"
  );
  assert.deepEqual(gate.privateReactActSchedulerDiagnosticsLedger.workerIds, [
    "worker-747-react-private-act-expired-scheduler-consumer",
    "worker-772-scheduler-delayed-root-producer",
    "worker-773-test-utils-act-expired-scheduler-handoff",
    "worker-775-react-act-delayed-mock-consumer",
    "worker-791-scheduler-source-proof-private-diagnostics",
    "worker-792-react-delayed-renderer-root-preflight",
    "worker-793-delayed-renderer-root-negative-coverage",
    "worker-798-scheduler-private-diagnostics-integrity"
  ]);
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.staticReadOnlyLedger,
    true
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.sourceTokenChecksOnly,
    true
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.manifestEvaluationOnly,
    true
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.publicTestUtilsActReady,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.publicSchedulerTimingReady,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger
      .publicSchedulerFlushBehaviorExecuted,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.publicActExecution,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.publicRootExecution,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.publicEffectExecution,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.executesRendererRoots,
    false
  );
  assert.equal(
    gate.privateReactActSchedulerDiagnosticsLedger.compatibilityClaimed,
    false
  );
  assert.deepEqual(gate.passiveEffects, {
    status: "metadata-only-passive-flush-without-callback-execution",
    records: [
      "PendingPassiveCommitHandoff",
      "PassiveEffectsFlushResult",
      "PassiveEffectFlushRecord",
      "PassiveEffectsFlushWithSyncFlushContinuationResult",
      "FunctionComponentPendingPassiveCommitHandoff",
      "FunctionComponentPendingPassiveEffectPhaseCommitRecord"
    ],
    consumesPendingPassiveMetadata: true,
    hasSyncFlushContinuationWrapper: true,
    discoversCommittedFiberEffects: false,
    executesPassiveEffects: false,
    invokesCreateCallbacks: false,
    invokesDestroyCallbacks: false
  });
  assert.deepEqual(gate.passiveEffectCallbackHandles, {
    status: "private-passive-effect-callback-invocation-test-control-only",
    records: [
      "FunctionComponentPendingPassiveEffectCommitRecord.create",
      "FunctionComponentPendingPassiveEffectCommitRecord.destroy",
      "FunctionComponentPendingPassiveEffectPhaseCommitRecord.create",
      "FunctionComponentPendingPassiveEffectPhaseCommitRecord.destroy",
      "PassiveEffectFlushEffectRecord.create_callback",
      "PassiveEffectFlushEffectRecord.destroy_callback",
      "PassiveEffectFlushRecord.create_callback",
      "PassiveEffectFlushRecord.destroy_callback",
      "PassiveEffectFlushRecord.create_callback_invoked",
      "PassiveEffectFlushRecord.destroy_callback_invoked"
    ],
    invocationRecords: [
      "PassiveEffectCallbackInvocationGateSnapshot",
      "PassiveEffectCallbackInvocationRecord",
      "PassiveEffectCallbackInvocationRequest",
      "PassiveEffectCallbackInvocationKind",
      "PassiveEffectCallbackInvocationStatus",
      "PassiveEffectCallbackInvocationTestControl",
      "PassiveEffectCallbackInvocationGateBlocker",
      "invoke_passive_effect_callbacks_under_test_control",
      "PassiveEffectDestroyCallbackExecutionRecord",
      "PassiveEffectDestroyCallbackErrorRecord",
      "flush_passive_effects_after_commit_with_destroy_executor"
    ],
    invocationBlockers: [
      "PublicEffectExecution",
      "PublicActCompatibility",
      "SchedulerDrivenPassiveExecution"
    ],
    phaseRules: [
      "unmount-phase-carries-destroy-handle-without-create-handle",
      "mount-phase-carries-create-handle-without-destroy-handle",
      "default-flush-callback-invoked-accessors-return-false",
      "test-controlled-invocation-runs-destroy-before-create",
      "scheduler-driven-passive-execution-remains-disabled"
    ],
    carriesCreateCallbackHandles: true,
    carriesDestroyCallbackHandles: true,
    testControlledInvocationOnly: true,
    invokesCreateCallbacksUnderTestControl: true,
    invokesDestroyCallbacksUnderTestControl: true,
    recordsReturnedDestroyHandles: true,
    recordsCallbackErrors: true,
    invokesCreateCallbacks: false,
    invokesDestroyCallbacks: false,
    publicEffectExecutionEnabled: false,
    schedulerDrivenPassiveExecutionEnabled: false,
    publicActCompatibilityClaimed: false,
    effectCallbackExecutionReady: false
  });
  const passiveDiagnostics = gate.privatePassiveDiagnostics;
  assert.equal(
    passiveDiagnostics.gateId,
    "react-dom-test-utils-act-private-passive-diagnostic-gate-1"
  );
  assert.equal(
    passiveDiagnostics.status,
    "accepted-private-passive-effect-diagnostic-without-public-act-passive-drain"
  );
  assert.deepEqual(
    passiveDiagnostics.acceptedDiagnosticIds,
    acceptedPrivatePassiveDiagnosticIds
  );
  assert.deepEqual(passiveDiagnostics.evidence, [
    "default-flush-remains-metadata-only",
    "committed-fiber-passive-effect-snapshot",
    "scheduler-passive-flush-request-order",
    "scheduler-flush-executes-metadata-only-passive-drain",
    "test-controlled-passive-destroy-callback-execution",
    "test-controlled-passive-mount-create-callback-execution",
    "passive-callback-error-root-capture-metadata",
    "scheduler-driven-passive-effect-private-execution",
    "root-error-callbacks-not-invoked",
    "public-act-passive-drain-blocked"
  ]);
  assert.deepEqual(passiveDiagnostics.summary, {
    acceptedDiagnosticIds: acceptedPrivatePassiveDiagnosticIds,
    acceptedDiagnosticCount: 5,
    acceptedStatus:
      "accepted-private-passive-effect-diagnostic-without-public-act-passive-drain",
    publicActPassiveDrain: false,
    publicEffectExecution: false,
    schedulerDrivenPassiveExecution: false,
    privateSchedulerDrivenPassiveExecution: true,
    publicRootErrorCallbacksInvoked: false,
    publicActErrorAggregation: false,
    compatibilityClaimed: false,
    source: "crates/fast-react-reconciler/src/passive_effects.rs"
  });
  assert.equal(
    passiveDiagnostics.blockedPrerequisiteStatus,
    "blocked-accepted-private-passive-diagnostics-until-public-act-passive-drain"
  );
  assert.deepEqual(
    passiveDiagnostics.blockedPrerequisiteIds,
    blockedPrivatePassivePrerequisiteIds
  );
  assert.equal(passiveDiagnostics.blockedPrerequisites.length, 5);
  assert.deepEqual(passiveDiagnostics.blockedPrerequisites[0], {
    id:
      "accepted-private-passive-diagnostic-passive-effects-committed-fiber-traversal",
    diagnosticId: "passive-effects-committed-fiber-traversal",
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status:
      "blocked-accepted-private-passive-diagnostics-until-public-act-passive-drain",
    diagnosticGateId: "react-dom-test-utils-act-private-passive-diagnostic-gate-1",
    diagnosticStatus:
      "accepted-private-passive-effect-diagnostic-without-public-act-passive-drain",
    publicActExecution: false,
    publicEffectExecution: false,
    schedulerDrivenPassiveExecution: false,
    publicRootErrorCallbacksInvoked: false,
    publicActErrorAggregation: false,
    compatibilityClaimed: false,
    reason:
      "Accepted only as private passive-effect diagnostics; public react-dom/test-utils.act must stay blocked until public act drains passive effects through public roots."
  });
  assert.equal(passiveDiagnostics.publicActPassiveDrain, false);
  assert.equal(passiveDiagnostics.publicEffectExecution, false);
  assert.equal(passiveDiagnostics.schedulerDrivenPassiveExecution, false);
  assert.equal(passiveDiagnostics.summary.privateSchedulerDrivenPassiveExecution, true);
  assert.equal(passiveDiagnostics.publicRootExecution, false);
  assert.equal(passiveDiagnostics.publicRootErrorCallbacksInvoked, false);
  assert.equal(passiveDiagnostics.publicActErrorAggregation, false);
  assert.equal(passiveDiagnostics.compatibilityClaimed, false);
  assert.deepEqual(
    passiveDiagnostics.deletedSubtreeRefPassiveCleanupOrder,
    {
      status:
        "accepted-private-deleted-subtree-ref-passive-cleanup-order-without-public-passive-drain",
      records: [
        "HostRootDeletionCleanupOrderGateSnapshot",
        "HostRootDeletionCleanupOrderPhase::RefCleanupReturn",
        "HostRootDeletionCleanupOrderPhase::PassiveDestroy",
        "HostRootDeletionCleanupOrderPhase::HostCleanup",
        "deletion_cleanup_order_gate_for_canary",
        "deletion_ref_passive_cleanup_execution",
        "host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence"
      ],
      source: "crates/fast-react-reconciler/src/root_commit.rs",
      executionSource:
        "crates/fast-react-reconciler/src/passive_effects.rs",
      consumesDeletionCleanupOrderGate: true,
      consumesRefCleanupExecution: true,
      consumesPassiveDestroyMetadata: true,
      refCleanupBeforePassiveDestroy: true,
      passiveDestroyBeforeHostCleanup: true,
      hostCleanupAfterPassiveDestroy: true,
      publicActPassiveDrain: false,
      publicEffectExecution: false,
      schedulerDrivenPassiveExecution: false,
      publicRootExecution: false,
      compatibilityClaimed: false
    }
  );

  const passiveCommittedFiberDiagnostic =
    passiveDiagnostics.acceptedDiagnostics.find(
      (diagnostic) =>
        diagnostic.id === "passive-effects-committed-fiber-traversal"
    );
  assert.deepEqual(passiveCommittedFiberDiagnostic.records, [
    "FunctionComponentCommittedPassiveEffectsSnapshot",
    "FunctionComponentCommittedPassiveEffectFiberRecord",
    "HostRootCommitRecord.function_component_committed_passive_effects",
    "HostRootCommitRecord::record_function_component_committed_passive_effects_for_canary",
    "flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary",
    "CommittedPassiveEffectRecordCountMismatch",
    "CommittedPassiveEffectDuplicateOrder",
    "CommittedPassiveEffectRecordMismatch"
  ]);
  assert.equal(passiveCommittedFiberDiagnostic.consumesCommittedFiberEffects, true);
  assert.equal(passiveCommittedFiberDiagnostic.executesPassiveEffects, false);

  const passiveSchedulerDiagnostic =
    passiveDiagnostics.acceptedDiagnostics.find(
      (diagnostic) =>
        diagnostic.id === "passive-effects-scheduler-flush-diagnostic"
    );
  assert.deepEqual(passiveSchedulerDiagnostic.records, [
    "SchedulerPassiveEffectsFlushRequest",
    "PassiveEffectSchedulerFlushGateRecord",
    "PassiveEffectSchedulerFlushGateStatus::Scheduled",
    "schedule_passive_effects_flush_after_commit_for_canary",
    "flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary",
    "PassiveEffectSchedulerFlushExecutionRecord",
    "PassiveEffectSchedulerFlushExecutionRecord.did_execute_private_callback_executors",
    "SchedulerPriority::Normal"
  ]);
  assert.equal(passiveSchedulerDiagnostic.schedulerPriority, "Normal");
  assert.equal(passiveSchedulerDiagnostic.executesPublicSchedulerTasks, false);
  assert.equal(passiveSchedulerDiagnostic.executesPublicEffects, false);

  const passiveExecutionDiagnostic =
    passiveDiagnostics.acceptedDiagnostics.find(
      (diagnostic) =>
        diagnostic.id === "passive-effect-mount-unmount-execution-diagnostics"
    );
  assert.deepEqual(passiveExecutionDiagnostic.records, [
    "PassiveEffectDestroyCallbackExecutionRequest",
    "PassiveEffectDestroyCallbackExecutionRecord",
    "PassiveEffectDestroyCallbackErrorRecord",
    "PassiveEffectMountCreateCallbackExecutionRequest",
    "PassiveEffectMountCreateCallbackExecutionRecord",
    "PassiveEffectMountCreateCallbackErrorRecord",
    "PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly",
    "PassiveEffectMountCreateCallbackExecutionGateBlocker",
    "flush_passive_effects_after_commit_with_destroy_executor",
    "flush_passive_effects_after_commit_with_mount_create_executor",
    "flush_passive_effects_after_commit_with_callback_executors"
  ]);
  assert.equal(passiveExecutionDiagnostic.testControlledInvocationOnly, true);
  assert.equal(
    passiveExecutionDiagnostic.schedulerDrivenPassiveExecutionEnabled,
    false
  );
  assert.equal(passiveExecutionDiagnostic.publicEffectExecutionEnabled, false);

  const passiveRootErrorDiagnostic =
    passiveDiagnostics.acceptedDiagnostics.find(
      (diagnostic) =>
        diagnostic.id === "passive-effect-root-error-routing-diagnostics"
    );
  assert.deepEqual(passiveRootErrorDiagnostic.records, [
    "PassiveEffectCallbackExecutionErrorKind",
    "PassiveEffectCallbackExecutionErrorHandle",
    "PassiveEffectCallbackExecutionErrorRecord",
    "PassiveEffectRootErrorCaptureRecord",
    "PassiveEffectRootErrorPropagationRecord",
    "PassiveEffectRootErrorPropagationStatus::CapturedForRootUpdate",
    "PassiveEffectRootErrorPropagationBlocker",
    "RootErrorCaptureScheduleRecord",
    "RootErrorCaptureSource::PassiveEffectDestroy",
    "RootErrorCaptureSource::PassiveEffectMountCreate",
    "capture_passive_effect_root_error"
  ]);
  assert.equal(passiveRootErrorDiagnostic.capturesCommitPhaseErrors, true);
  assert.equal(passiveRootErrorDiagnostic.schedulesRootErrorUpdates, true);
  assert.equal(passiveRootErrorDiagnostic.invokesRootErrorCallbacks, false);
  assert.equal(passiveRootErrorDiagnostic.publicActErrorAggregationEnabled, false);

  const schedulerDrivenPassiveDiagnostic =
    passiveDiagnostics.acceptedDiagnostics.find(
      (diagnostic) =>
        diagnostic.id ===
        "scheduler-driven-passive-effect-execution-diagnostics"
    );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.diagnosticGateId,
    "react-dom-test-utils-act-private-scheduler-driven-passive-effect-gate-1"
  );
  assert.deepEqual(schedulerDrivenPassiveDiagnostic.workerIds, [
    "worker-836-reconciler-private-act-queue-execution-path",
    "worker-837-scheduler-driven-passive-effect-execution"
  ]);
  assert.equal(
    schedulerDrivenPassiveDiagnostic.privateSchedulerDrivenPassiveExecution,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.schedulerDrivenPassiveExecution,
    false
  );
  assert.equal(schedulerDrivenPassiveDiagnostic.publicEffectExecution, false);
  assert.equal(schedulerDrivenPassiveDiagnostic.publicActPassiveDrain, false);
  assert.equal(
    schedulerDrivenPassiveDiagnostic.requiresSchedulerOwnedSourceProof,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.requiresSourceOwnedPassiveEvidence,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.requiresSourceOwnedActiveLifecycleRequestBoundary,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.consumesRootLifecycleRequestBoundary,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.validatesLifecycleRequestEntrypoint,
    true
  );
  assert.equal(
    schedulerDrivenPassiveDiagnostic.lifecycleBoundaryWorkerId,
    "worker-874-react-dom-lifecycle-boundary-hardening"
  );
  assert.deepEqual(schedulerDrivenPassiveDiagnostic.lifecycleBoundaryRecords, [
    "FastReactDomPrivateRootPublicFacadeLifecycleContainerSnapshotRecord",
    "FastReactDomPrivateRootCreateRecord",
    "FastReactDomPrivateRootUpdateRecord"
  ]);
  assert.equal(
    schedulerDrivenPassiveDiagnostic.linksRootCommitPassiveExecutionToActFlushDiagnostics,
    true
  );
  assert.deepEqual(
    schedulerDrivenPassiveDiagnostic.records,
    gate.privateSchedulerDrivenPassiveEffectDiagnostics.records
  );
  assert.deepEqual(
    gate.privateSchedulerDrivenPassiveEffectDiagnostics.summary,
    schedulerDrivenPassiveDiagnostic.summary
  );
  assert.deepEqual(gate.reactDomRootBridge.records, [
    "FastReactDomPrivateRootCreateRecord",
    "FastReactDomPrivateRootUpdateRecord",
    "FastReactDomPrivateRootAdmissionRecord",
    "FastReactDomPrivateRootNativeRequestHandoffRecord"
  ]);
  const hostOutputDiagnostics =
    gate.reactDomRootBridge.privateHostOutputDiagnostics;
  assert.equal(
    hostOutputDiagnostics.gateId,
    "root-render-private-host-output-diagnostic-gate-1"
  );
  assert.equal(
    hostOutputDiagnostics.status,
    "accepted-private-root-host-output-diagnostic-without-public-root-execution"
  );
  assert.deepEqual(
    hostOutputDiagnostics.scenarios,
    acceptedPrivateHostOutputScenarioIds
  );
  assert.equal(
    hostOutputDiagnostics.blockedStatus,
    "blocked-private-root-host-output-diagnostic"
  );
  assert.deepEqual(
    hostOutputDiagnostics.blockedScenarios,
    unsupportedPrivateHostOutputScenarioIds
  );
  assert.deepEqual(hostOutputDiagnostics.evidence, [
    "root-render-private-host-output-diagnostic-gate-1",
    "accepted-private-root-host-output-diagnostic",
    "private-fake-dom-root-host-output",
    "explicit-create-root-marker-listener-apply-revert",
    "fake-dom-host-component-host-text-output",
    "latest-props-mutation-handoff-publication",
    "private-host-tree-replacement-output",
    "private-render-null-clear-container-output",
    "private-unmount-host-output-cleanup",
    "private-double-unmount-noop-host-output",
    "private-render-after-unmount-guard-no-extra-mutation",
    "private-flush-sync-cross-root-host-output",
    "private-flush-sync-guard-hook-call",
    "private-cross-root-sync-flush-diagnostic"
  ]);
  assert.deepEqual(hostOutputDiagnostics.summary, {
    admittedScenarioIds: acceptedPrivateHostOutputScenarioIds,
    blockedScenarioIds: unsupportedPrivateHostOutputScenarioIds,
    admittedScenarioModeRowCount: 18,
    blockedScenarioModeRowCount: 2,
    acceptedStatus:
      "accepted-private-root-host-output-diagnostic-without-public-root-execution",
    blockedStatus: "blocked-private-root-host-output-diagnostic",
    compatibilityClaimed: false,
    source:
      "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs"
  });
  assert.equal(
    hostOutputDiagnostics.blockedPrerequisiteStatus,
    "blocked-accepted-private-root-host-output-until-public-root-execution"
  );
  assert.deepEqual(
    hostOutputDiagnostics.blockedPrerequisiteIds,
    blockedPrivateHostOutputPrerequisiteIds
  );
  assert.equal(hostOutputDiagnostics.blockedPrerequisites.length, 9);
  assert.deepEqual(hostOutputDiagnostics.blockedPrerequisites[0], {
    id: "accepted-private-root-host-output-create-root-no-render",
    scenarioId: "create-root-no-render",
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status:
      "blocked-accepted-private-root-host-output-until-public-root-execution",
    diagnosticGateId: "root-render-private-host-output-diagnostic-gate-1",
    diagnosticStatus:
      "accepted-private-root-host-output-diagnostic-without-public-root-execution",
    publicRootExecution: false,
    publicDomMutation: false,
    publicActExecution: false,
    compatibilityClaimed: false,
    reason:
      "Accepted only as a private fake-DOM host-output diagnostic; public react-dom/test-utils.act must stay blocked until public roots execute this scenario."
  });
  assert.equal(hostOutputDiagnostics.fakeDomHostOutputOnly, true);
  assert.equal(hostOutputDiagnostics.publicRootExecution, false);
  assert.equal(hostOutputDiagnostics.publicDomMutation, false);
  assert.equal(hostOutputDiagnostics.publicActExecution, false);
  assert.equal(hostOutputDiagnostics.compatibilityClaimed, false);

  const warningBoundaryDiagnostics =
    gate.reactDomRootBridge.privateWarningBoundaryDiagnostics;
  assert.equal(
    warningBoundaryDiagnostics.gateId,
    "root-render-private-warning-boundary-diagnostic-gate-1"
  );
  assert.equal(
    warningBoundaryDiagnostics.status,
    "accepted-private-root-warning-boundary-diagnostic-without-public-warning-compatibility"
  );
  assert.deepEqual(
    warningBoundaryDiagnostics.scenarios,
    acceptedPrivateWarningBoundaryScenarioIds
  );
  assert.equal(
    warningBoundaryDiagnostics.blockedStatus,
    "blocked-private-root-warning-boundary-diagnostic"
  );
  assert.deepEqual(
    warningBoundaryDiagnostics.blockedScenarios,
    unsupportedPrivateWarningBoundaryScenarioIds
  );
  assert.deepEqual(warningBoundaryDiagnostics.evidence, [
    "root-render-private-warning-boundary-diagnostic-gate-1",
    "accepted-private-root-warning-boundary-diagnostic",
    "private-root-warning-boundary",
    "root-render-callback-second-argument",
    "root-render-container-second-argument",
    "root-render-generic-second-argument",
    "root-unmount-callback-argument",
    "duplicate-create-root",
    "console-output-not-used-as-evidence",
    "public-development-warning-compatibility-blocked"
  ]);
  assert.deepEqual(warningBoundaryDiagnostics.summary, {
    admittedScenarioIds: acceptedPrivateWarningBoundaryScenarioIds,
    blockedScenarioIds: unsupportedPrivateWarningBoundaryScenarioIds,
    admittedScenarioModeRowCount: 2,
    blockedScenarioModeRowCount: 18,
    acceptedStatus:
      "accepted-private-root-warning-boundary-diagnostic-without-public-warning-compatibility",
    blockedStatus: "blocked-private-root-warning-boundary-diagnostic",
    publicRootCompatibilitySurface: false,
    consoleOutputUsedAsEvidence: false,
    compatibilityClaimed: false,
    source:
      "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs"
  });
  assert.equal(
    warningBoundaryDiagnostics.blockedPrerequisiteStatus,
    "blocked-accepted-private-root-warning-boundary-until-public-warning-compatibility"
  );
  assert.deepEqual(
    warningBoundaryDiagnostics.blockedPrerequisiteIds,
    blockedPrivateWarningBoundaryPrerequisiteIds
  );
  assert.equal(warningBoundaryDiagnostics.blockedPrerequisites.length, 1);
  assert.deepEqual(warningBoundaryDiagnostics.blockedPrerequisites[0], {
    id:
      "accepted-private-root-warning-boundary-development-warning-boundaries",
    scenarioId: "development-warning-boundaries",
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status:
      "blocked-accepted-private-root-warning-boundary-until-public-warning-compatibility",
    diagnosticGateId:
      "root-render-private-warning-boundary-diagnostic-gate-1",
    diagnosticStatus:
      "accepted-private-root-warning-boundary-diagnostic-without-public-warning-compatibility",
    publicRootExecution: false,
    publicWarningCompatibility: false,
    consoleOutputUsedAsEvidence: false,
    publicActExecution: false,
    compatibilityClaimed: false,
    reason:
      "Accepted only as private warning-boundary metadata; public react-dom/test-utils.act must stay blocked until public roots produce compatible warning behavior."
  });
  assert.equal(warningBoundaryDiagnostics.publicRootCompatibilitySurface, false);
  assert.equal(warningBoundaryDiagnostics.publicRootExecution, false);
  assert.equal(warningBoundaryDiagnostics.publicWarningCompatibility, false);
  assert.equal(warningBoundaryDiagnostics.publicActExecution, false);
  assert.equal(warningBoundaryDiagnostics.consoleOutputUsedAsEvidence, false);
  assert.equal(warningBoundaryDiagnostics.compatibilityClaimed, false);
  assert.equal(gate.reactDomRootBridge.nativeExecution, false);
  assert.equal(gate.reactDomRootBridge.reconcilerExecution, false);
  assert.equal(gate.reactDomRootBridge.domMutation, false);
  assert.equal(gate.reactDomRootBridge.publicWarningCompatibility, false);
  assert.equal(gate.reactDomRootBridge.consoleOutputUsedAsEvidence, false);
  assert.equal(gate.reactDomRootBridge.compatibilityClaimed, false);

  const flushSyncRootOutputPrerequisite =
    gate.acceptedPrivatePrerequisites.find(
      (prerequisite) =>
        prerequisite.id ===
        "react-dom-private-flush-sync-root-output-diagnostic"
    );
  assert.deepEqual(flushSyncRootOutputPrerequisite, {
    id: "react-dom-private-flush-sync-root-output-diagnostic",
    present: true,
    status:
      "accepted-private-root-host-output-diagnostic-without-public-root-execution",
    source:
      "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs",
    recordOnly: false,
    privateDiagnostic: true,
    scenarioId: "flush-sync-cross-root-render",
    diagnosticGateId: "root-render-private-host-output-diagnostic-gate-1",
    crossRootHostOutputDiagnostic: true,
    requiresPrivateFlushSyncGuard: true,
    requiresCrossRootSyncFlushEvidence: true,
    publicRootExecution: false,
    publicDomMutation: false,
    publicFlushSyncCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    records: [
      "private-flush-sync-cross-root-host-output",
      "private-flush-sync-guard-hook-call",
      "private-cross-root-sync-flush-diagnostic"
    ]
  });

  const warningBoundaryPrerequisite =
    gate.acceptedPrivatePrerequisites.find(
      (prerequisite) =>
        prerequisite.id ===
        "react-dom-private-root-warning-boundary-diagnostics"
    );
  assert.deepEqual(warningBoundaryPrerequisite, {
    id: "react-dom-private-root-warning-boundary-diagnostics",
    present: true,
    status:
      "accepted-private-root-warning-boundary-diagnostic-without-public-warning-compatibility",
    source:
      "tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs",
    recordOnly: false,
    privateDiagnostic: true,
    scenarioId: "development-warning-boundaries",
    diagnosticGateId:
      "root-render-private-warning-boundary-diagnostic-gate-1",
    publicRootCompatibilitySurface: false,
    publicWarningCompatibility: false,
    consoleOutputUsedAsEvidence: false,
    publicActCompatibilityClaimed: false,
    records: [
      "root-render-private-warning-boundary-diagnostic-gate-1",
      "accepted-private-root-warning-boundary-diagnostic",
      "private-root-warning-boundary",
      "root-render-callback-second-argument",
      "root-render-container-second-argument",
      "root-render-generic-second-argument",
      "root-unmount-callback-argument",
      "duplicate-create-root",
      "console-output-not-used-as-evidence",
      "public-development-warning-compatibility-blocked"
    ]
  });

  const placeholder = gateModule.createReactDomTestUtilsActPlaceholder();
  assert.deepEqual(describeFunctionValue(placeholder), {
    type: "function",
    name: "",
    length: 1,
    isAsync: false,
    ownPropertyNames: ["length", "name", "prototype"],
    ownKeys: [
      { type: "string", value: "length" },
      { type: "string", value: "name" },
      { type: "string", value: "prototype" }
    ]
  });
  assertFastReactDomActBlocked(placeholder);

  const blockedError = gateModule.createReactDomTestUtilsActBlockedError();
  assert.equal(blockedError.name, "FastReactDomUnimplementedError");
  assert.equal(blockedError.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(blockedError.entrypoint, "react-dom/test-utils");
  assert.equal(blockedError.exportName, "act");

  const claimGate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
    publicCompatibilityClaimed: true
  });
  assert.equal(
    claimGate.status,
    "blocked-public-test-utils-act-private-routing-with-violations"
  );
  assert.deepEqual(
    claimGate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-public-act-routing"]
  );

  const openedGate = gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
    publicReactActReady: true
  });
  assert.deepEqual(
    openedGate.violations.map((violation) => violation.id),
    ["public-act-routing-opened-before-prerequisites"]
  );

  const missingPrivateGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.map(
        (prerequisite, index) =>
          index === 0 ? { ...prerequisite, present: false } : prerequisite
      )
    });
  assert.deepEqual(missingPrivateGate.violations, [
    {
      id: "accepted-private-prerequisite-missing",
      prerequisiteIds: ["react-act-private-dispatcher-gate"]
    }
  ]);

  const removedPrivatePrerequisiteGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.filter(
        (prerequisite) =>
          prerequisite.id !==
          "sync-flush-root-scheduler-finished-work-handoff-evidence"
      )
    });
  assert.deepEqual(removedPrivatePrerequisiteGate.violations, [
    {
      id: "accepted-private-prerequisite-manifest-mismatch",
      missingPrerequisiteIds: [
        "sync-flush-root-scheduler-finished-work-handoff-evidence"
      ],
      unexpectedPrerequisiteIds: [],
      duplicatePrerequisiteIds: []
    }
  ]);

  const removedDelayedSchedulerPrerequisiteGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.filter(
        (prerequisite) =>
          prerequisite.id !==
          privateSchedulerMockDelayedActRootWorkPrerequisiteId
      )
    });
  assert.deepEqual(removedDelayedSchedulerPrerequisiteGate.violations, [
    {
      id: "accepted-private-prerequisite-manifest-mismatch",
      missingPrerequisiteIds: [
        privateSchedulerMockDelayedActRootWorkPrerequisiteId
      ],
      unexpectedPrerequisiteIds: [],
      duplicatePrerequisiteIds: []
    }
  ]);

  const stalePrivatePrerequisiteGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.map(
        (prerequisite) =>
          prerequisite.id ===
          "sync-flush-nested-act-root-continuation-evidence"
            ? {
                ...prerequisite,
                workerId: "worker-694-stale-nested-act-root-continuation",
                evidenceFresh: false
              }
            : prerequisite
      )
    });
  assert.deepEqual(stalePrivatePrerequisiteGate.violations, [
    {
      id: "accepted-private-prerequisite-stale-evidence",
      prerequisites: [
        {
          prerequisiteId: "sync-flush-nested-act-root-continuation-evidence",
          reasons: ["worker-id-mismatch", "evidenceFresh-not-true"]
        }
      ]
    }
  ]);

  const staleDelayedSchedulerPrerequisiteGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.map(
        (prerequisite) =>
          prerequisite.id === privateSchedulerMockDelayedActRootWorkPrerequisiteId
            ? {
                ...prerequisite,
                workerId:
                  "worker-835-foreign-react-dom-test-utils-delayed-scheduler",
                preflightsSchedulerMockDelayedActRootWorkDiagnostics: false,
                evidence: prerequisite.evidence.slice(1)
              }
            : prerequisite
      )
    });
  assert.deepEqual(staleDelayedSchedulerPrerequisiteGate.violations, [
    {
      id: "accepted-private-prerequisite-stale-evidence",
      prerequisites: [
        {
          prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          reasons: [
            "worker-id-mismatch",
            "evidence-mismatch",
            "preflightsSchedulerMockDelayedActRootWorkDiagnostics-not-true"
          ]
        }
      ]
    }
  ]);

  const privatePublicClaimGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.map(
        (prerequisite) =>
          prerequisite.id === "react-act-private-dispatcher-gate"
            ? { ...prerequisite, publicCompatibilityClaimed: true }
            : prerequisite
      )
    });
  assert.deepEqual(privatePublicClaimGate.violations, [
    {
      id: "accepted-private-prerequisite-public-claim-detected",
      claims: [
        {
          prerequisiteId: "react-act-private-dispatcher-gate",
          field: "publicCompatibilityClaimed"
        }
      ]
    }
  ]);

  const delayedSchedulerPublicClaimGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      acceptedPrivatePrerequisites: gate.acceptedPrivatePrerequisites.map(
        (prerequisite) =>
          prerequisite.id === privateSchedulerMockDelayedActRootWorkPrerequisiteId
            ? {
                ...prerequisite,
                publicReactActCompatibilityClaimed: true,
                summary: {
                  ...prerequisite.summary,
                  publicSchedulerFlushBehaviorExecuted: true
                }
              }
            : prerequisite
      )
    });
  assert.deepEqual(delayedSchedulerPublicClaimGate.violations, [
    {
      id: "accepted-private-prerequisite-stale-evidence",
      prerequisites: [
        {
          prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          reasons: [
            "publicReactActCompatibilityClaimed-not-false",
            "summary.publicSchedulerFlushBehaviorExecuted-not-false"
          ]
        }
      ]
    },
    {
      id: "accepted-private-prerequisite-public-claim-detected",
      claims: [
        {
          prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          field: "publicReactActCompatibilityClaimed"
        },
        {
          prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          field: "summary.publicSchedulerFlushBehaviorExecuted"
        }
      ]
    }
  ]);

  const unblockedHostOutputGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      blockedPrivateRootHostOutputPrerequisites:
        gate.blockedPrivateRootHostOutputPrerequisites.map((prerequisite) => ({
          ...prerequisite,
          present: true
        }))
    });
  assert.deepEqual(
    unblockedHostOutputGate.privateRootHostOutputPrerequisitesStillBlocked,
    []
  );
  assert.deepEqual(unblockedHostOutputGate.violations, [
    {
      id:
        "private-root-host-output-prerequisites-unblocked-without-new-gate"
    }
  ]);

  const unblockedWarningBoundaryGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      blockedPrivateRootWarningBoundaryPrerequisites:
        gate.blockedPrivateRootWarningBoundaryPrerequisites.map(
          (prerequisite) => ({
            ...prerequisite,
            present: true
          })
        )
    });
  assert.deepEqual(
    unblockedWarningBoundaryGate
      .privateRootWarningBoundaryPrerequisitesStillBlocked,
    []
  );
  assert.deepEqual(unblockedWarningBoundaryGate.violations, [
    {
      id:
        "private-root-warning-boundary-prerequisites-unblocked-without-new-gate"
    }
  ]);

  const unblockedPassiveGate =
    gateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      blockedPrivatePassivePrerequisites:
        gate.blockedPrivatePassivePrerequisites.map((prerequisite) => ({
          ...prerequisite,
          present: true
        }))
    });
  assert.deepEqual(
    unblockedPassiveGate.privatePassivePrerequisitesStillBlocked,
    []
  );
  assert.deepEqual(unblockedPassiveGate.violations, [
    {
      id: "private-passive-diagnostic-prerequisites-unblocked-without-new-gate"
    }
  ]);
});

test("Fast React test-utils private act route consumes Scheduler mock expired act/root diagnostics only", () => {
  for (const nodeEnv of ["development", "production"]) {
    const {
      Scheduler,
      actQueue,
      events,
      getPublicSchedulerCallbackRan,
      metadata,
      reactGate,
      report
    } = createSchedulerMockExpiredActRootWorkDiagnostics(nodeEnv);
    const gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);

    assert.equal(
      report[privateSchedulerMockExpiredActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(report), true, nodeEnv);
    assert.equal(report.kind, privateSchedulerMockExpiredActRootWorkDiagnosticsKind);
    assert.equal(report.version, 1, nodeEnv);
    assert.equal(
      gateModule.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report),
      true,
      nodeEnv
    );

    const consumption =
      gateModule.consumeSchedulerMockExpiredActRootWorkDiagnostics(report);
    assert.equal(
      consumption.status,
      gateModule.privateSchedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumption.accepted, true, nodeEnv);
    assert.equal(
      consumption.gateId,
      gateModule.privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
      nodeEnv
    );
    assert.equal(
      consumption.reactActConsumptionStatus,
      reactGate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      consumption.schedulerMockExpiredActRootWorkDiagnosticKind,
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(consumption.selectedFlushHelper, "unstable_flushExpired");
    assert.deepEqual(
      consumption.rootWorkRecordSummary.records.map(
        (record) => record.recordKind
      ),
      acceptedSchedulerMockExpiredActRootWorkRecords,
      nodeEnv
    );
    assert.deepEqual(
      {
        recordCount: consumption.rootWorkRecordSummary.recordCount,
        pendingBefore: consumption.rootWorkRecordSummary.pendingBefore,
        consumedCount: consumption.rootWorkRecordSummary.consumedCount,
        remainingCount: consumption.rootWorkRecordSummary.remainingCount
      },
      {
        recordCount: acceptedSchedulerMockExpiredActRootWorkRecords.length,
        pendingBefore: acceptedSchedulerMockExpiredActRootWorkRecords.length,
        consumedCount: acceptedSchedulerMockExpiredActRootWorkRecords.length,
        remainingCount: 0
      },
      nodeEnv
    );
    assert.deepEqual(
      {
        pendingBefore: consumption.actQueueDrainSummary.pendingBefore,
        drainedCount: consumption.actQueueDrainSummary.drainedCount,
        executedCallbackCount:
          consumption.actQueueDrainSummary.executedCallbackCount,
        recordedContinuationCount:
          consumption.actQueueDrainSummary.recordedContinuationCount,
        executedContinuationCount:
          consumption.actQueueDrainSummary.executedContinuationCount,
        remainingCount: consumption.actQueueDrainSummary.remainingCount
      },
      {
        pendingBefore: 2,
        drainedCount: 2,
        executedCallbackCount: 2,
        recordedContinuationCount: 1,
        executedContinuationCount: 1,
        remainingCount: 0
      },
      nodeEnv
    );
    assert.equal(consumption.privateRoutingReady, false, nodeEnv);
    assert.equal(consumption.publicReactActReady, false, nodeEnv);
    assert.equal(consumption.publicTestUtilsActReady, false, nodeEnv);
    assert.equal(consumption.queueFlushingReady, false, nodeEnv);
    assert.equal(consumption.rendererRootsReady, false, nodeEnv);
    assert.equal(consumption.passiveEffectsReady, false, nodeEnv);
    assert.equal(consumption.continuationFlushingReady, false, nodeEnv);
    assert.equal(consumption.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      consumption.publicReactActCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(
      consumption.publicRootSchedulerCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(consumption.publicRendererCompatibilityClaimed, false, nodeEnv);
    assert.equal(consumption.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(consumption.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(consumption.publicActExecution, false, nodeEnv);
    assert.equal(consumption.publicRootExecution, false, nodeEnv);
    assert.equal(consumption.publicEffectExecution, false, nodeEnv);
    assert.equal(consumption.publicActPassiveDrain, false, nodeEnv);
    assert.equal(consumption.schedulerDrivenPassiveExecution, false, nodeEnv);
    assert.equal(consumption.executesQueuedWork, false, nodeEnv);
    assert.equal(consumption.executesEffects, false, nodeEnv);
    assert.equal(consumption.executesPassiveEffects, false, nodeEnv);
    assert.equal(consumption.executesRendererWork, false, nodeEnv);
    assert.equal(consumption.executesRendererRoots, false, nodeEnv);
    assert.equal(
      consumption.reactActConsumptionReport.status,
      reactGate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(metadata.rootWorkRecords.length, 0, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);
    assert.equal(getPublicSchedulerCallbackRan(), false, nodeEnv);
    assert.deepEqual(
      events.map((event) => event[0]),
      [
        "expired-act-root-callback",
        "expired-act-root-continuation",
        "act-root-schedule",
        "act-root-callback",
        "act-root-continuation"
      ],
      nodeEnv
    );

    const testUtils = loadFreshCjs(fastReactDomTestUtilsPath);
    let publicActCallbackInvoked = false;
    assert.throws(
      () =>
        testUtils.act(() => {
          publicActCallbackInvoked = true;
          return gateModule.consumeSchedulerMockExpiredActRootWorkDiagnostics(
            report
          );
        }),
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react-dom/test-utils");
        assert.equal(error.exportName, "act");
        return true;
      },
      nodeEnv
    );
    assert.equal(publicActCallbackInvoked, false, nodeEnv);

    for (const { diagnostics, reason, label } of [
      {
        label: "top-level-clone",
        diagnostics: cloneExpiredActRootWorkReport(report),
        reason: "scheduler-expired-act-root-diagnostics-source-proof"
      },
      {
        label: "missing-brand",
        diagnostics: cloneExpiredActRootWorkReport(report, {}, {
          withBrand: false
        }),
        reason: "scheduler-expired-act-root-diagnostics-brand"
      },
      {
        label: "old-global-forged-deep-clone",
        diagnostics:
          deepCloneExpiredActRootWorkDiagnosticsWithOldGlobalSourceProof(
            report
          ),
        reason: "scheduler-expired-act-root-diagnostics-metadata"
      },
      {
        label: "cloned-drain-report",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport)
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        label: "public-act-claim",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          publicReactActCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      }
    ]) {
      assertReactDomExpiredSchedulerDiagnosticsRejected(
        gateModule,
        diagnostics,
        reason,
        `${nodeEnv}:${label}`
      );
    }

    Scheduler.reset();
  }
});

test("Fast React test-utils private act route consumes source-owned scheduler-driven passive diagnostics only", () => {
  for (const nodeEnv of ["development", "production"]) {
    const lifecycle =
      createSourceOwnedReactDomLifecycleBoundary(
        `dom-test-utils-act-${nodeEnv}`
      );
    const { reactGate, report } =
      createSchedulerMockExpiredActRootWorkDiagnostics(nodeEnv, {
        rootId: lifecycle.rootId,
        rootLabel: lifecycle.rootLabel
      });
    const gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);
    const diagnostics =
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          finishedWorkId: `dom-test-utils-passive-${nodeEnv}`
        }
      );

    assert.equal(
      diagnostics[privateSchedulerDrivenPassiveEffectDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      true,
      nodeEnv
    );

    const consumption =
      gateModule.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics);
    assert.equal(
      consumption.status,
      gateModule.privateSchedulerDrivenPassiveEffectConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      consumption.gateId,
      gateModule.privateSchedulerDrivenPassiveEffectDiagnosticGateId,
      nodeEnv
    );
    assert.equal(
      consumption.diagnosticStatus,
      gateModule.privateSchedulerDrivenPassiveEffectDiagnosticStatus,
      nodeEnv
    );
    assert.equal(
      consumption.prerequisiteId,
      gateModule.privateSchedulerDrivenPassiveEffectPrerequisiteId,
      nodeEnv
    );
    assert.equal(
      consumption.reactActConsumptionStatus,
      reactGate.schedulerDrivenPassiveEffectConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumption.rootLabel, lifecycle.rootLabel, nodeEnv);
    assert.equal(
      consumption.finishedWorkId,
      `dom-test-utils-passive-${nodeEnv}`,
      nodeEnv
    );
    assert.equal(
      consumption.consumesReactActPrivateSchedulerDrivenPassiveDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(
      consumption.consumesSchedulerMockExpiredActRootWorkDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(consumption.requiresSchedulerOwnedSourceProof, true, nodeEnv);
    assert.equal(consumption.requiresSourceOwnedPassiveEvidence, true, nodeEnv);
    assert.equal(
      consumption.requiresSourceOwnedActiveLifecycleRequestBoundary,
      true,
      nodeEnv
    );
    assert.equal(
      consumption.consumesRootLifecycleRequestBoundary,
      true,
      nodeEnv
    );
    assert.equal(consumption.validatesLifecycleRequestRootIdentity, true, nodeEnv);
    assert.equal(consumption.validatesLifecycleRequestOrdering, true, nodeEnv);
    assert.equal(consumption.validatesLifecycleRequestEntrypoint, true, nodeEnv);
    assert.equal(consumption.currentRootBoundWork, true, nodeEnv);
    assert.equal(Object.isFrozen(consumption.lifecycleRequestBoundary), true, nodeEnv);
    assert.equal(
      consumption.lifecycleRequestBoundary.snapshotStatus,
      gateModule.privateSchedulerDrivenPassiveLifecycleBoundaryStatus,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.kind,
      gateModule.privateSchedulerDrivenPassiveLifecycleBoundaryKind,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.sourceRequestId,
      lifecycle.boundary.sourceRequestId,
      nodeEnv
    );
    assert.equal(
      consumption.linksRootCommitPassiveExecutionToActFlushDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(consumption.consumesRootCommitPassiveExecution, true, nodeEnv);
    assert.equal(consumption.consumesSchedulerPassiveFlushRequest, true, nodeEnv);
    assert.equal(consumption.consumesPendingPassiveHandoff, true, nodeEnv);
    assert.equal(consumption.privateSchedulerDrivenPassiveExecution, true, nodeEnv);
    assert.equal(consumption.didExecutePrivateCallbackExecutors, true, nodeEnv);
    assert.equal(consumption.rejectsStaleDiagnostics, true, nodeEnv);
    assert.equal(consumption.rejectsCrossRootDiagnostics, true, nodeEnv);
    assert.equal(consumption.rejectsMissingSchedulerSourceProof, true, nodeEnv);
    assert.equal(consumption.rejectsMissingPassiveOwnership, true, nodeEnv);
    assert.equal(consumption.schedulerDrivenPassiveExecution, false, nodeEnv);
    assert.equal(consumption.privateRoutingReady, false, nodeEnv);
    assert.equal(consumption.publicReactActReady, false, nodeEnv);
    assert.equal(consumption.publicTestUtilsActReady, false, nodeEnv);
    assert.equal(consumption.queueFlushingReady, false, nodeEnv);
    assert.equal(consumption.rendererRootsReady, false, nodeEnv);
    assert.equal(consumption.passiveEffectsReady, false, nodeEnv);
    assert.equal(consumption.continuationFlushingReady, false, nodeEnv);
    assert.equal(consumption.publicActExecution, false, nodeEnv);
    assert.equal(consumption.publicRootExecution, false, nodeEnv);
    assert.equal(consumption.publicEffectExecution, false, nodeEnv);
    assert.equal(consumption.publicActPassiveDrain, false, nodeEnv);
    assert.equal(consumption.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      consumption.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(consumption.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      consumption.publicRootSchedulerCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(consumption.publicRendererCompatibilityClaimed, false, nodeEnv);
    assert.equal(consumption.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(consumption.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(consumption.executesQueuedWork, false, nodeEnv);
    assert.equal(consumption.executesEffects, false, nodeEnv);
    assert.equal(consumption.executesPassiveEffects, false, nodeEnv);
    assert.equal(consumption.executesRendererWork, false, nodeEnv);
    assert.equal(consumption.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(consumption.workerIds, [
      "worker-836-reconciler-private-act-queue-execution-path",
      "worker-837-scheduler-driven-passive-effect-execution"
    ]);

    const clonedScheduler = cloneExpiredActRootWorkReport(report);
    const missingSchedulerSource =
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        clonedScheduler,
        lifecycle.boundaryOptions
      );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      missingSchedulerSource,
      "scheduler-driven-passive-diagnostics-scheduler-source-proof",
      `${nodeEnv}:missing-scheduler-source-proof`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          schedulerGateOverrides: {
            rootId: 999,
            rootLabel: "foreign-passive-root"
          }
        }
      ),
      "scheduler-driven-passive-diagnostics-scheduler-gate",
      `${nodeEnv}:cross-root-scheduler-gate`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          pendingPassiveHandoffOverrides: {
            finishedWorkId: "stale-dom-test-utils-passive"
          }
        }
      ),
      "scheduler-driven-passive-diagnostics-pending-passive",
      `${nodeEnv}:stale-pending-passive`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          diagnosticsOverrides: {
            lifecycleRequestBoundary: {
              ...diagnostics.lifecycleRequestBoundary
            }
          }
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:caller-built-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          lifecycleRequestId: `${lifecycle.rootId}:foreign-request`
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:stale-lifecycle-request-id`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...lifecycle.boundaryOptions,
          lifecycleRequestSequence:
            lifecycle.boundary.sourceRequestSequence + 1000
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:replayed-lifecycle-request-sequence`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...createReactDomLifecycleBoundaryOptions(
            lifecycle.initialDiagnostic.sourceContainerSnapshot
          )
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary",
      `${nodeEnv}:stale-same-root-render-lifecycle-boundary`
    );
    const crossRootLifecycle =
      createSourceOwnedReactDomLifecycleBoundary(
        `dom-test-utils-act-cross-root-${nodeEnv}`
      );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          ...crossRootLifecycle.boundaryOptions
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary",
      `${nodeEnv}:cross-root-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        report,
        {
          finishedWorkId: diagnostics.finishedWorkId
        }
      ),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:missing-lifecycle-boundary`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      cloneSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      "scheduler-driven-passive-diagnostics-passive-ownership",
      `${nodeEnv}:missing-passive-ownership`
    );
    const callerBuiltNestedDiagnostics =
      reactGate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        finishedWorkId: diagnostics.finishedWorkId,
        diagnosticsOverrides:
          createCallerBuiltSchedulerDrivenPassiveEffectNestedRecords(diagnostics)
      });
    assert.equal(
      callerBuiltNestedDiagnostics[
        privateSchedulerDrivenPassiveEffectDiagnosticsBrand
      ],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(callerBuiltNestedDiagnostics), true, nodeEnv);
    assert.equal(
      Object.isFrozen(callerBuiltNestedDiagnostics.schedulerRequest),
      false,
      nodeEnv
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      callerBuiltNestedDiagnostics,
      "scheduler-driven-passive-diagnostics-nested-passive-ownership",
      `${nodeEnv}:caller-built-nested-passive-records`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      Object.freeze({
        kind: privateSchedulerDrivenPassiveEffectDiagnosticsKind,
        status:
          "test title says scheduler-driven passive effect execution passed",
        source: "PassiveEffectSchedulerFlushExecutionRecord { }"
      }),
      "scheduler-driven-passive-diagnostics-brand",
      `${nodeEnv}:prose-source-syntax`
    );
    assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
      gateModule,
      new Error(
        "PassiveEffectSchedulerFlushExecutionRecord.did_execute_private_callback_executors"
      ),
      "scheduler-driven-passive-diagnostics-not-frozen",
      `${nodeEnv}:error-message-not-evidence`
    );
  }
});

test("Fast React test-utils private act route preflights Scheduler mock delayed act/root diagnostics only", () => {
  for (const nodeEnv of ["development", "production"]) {
    const {
      Scheduler,
      actQueue,
      events,
      getPublicSchedulerCallbackRan,
      reactGate,
      report,
      rootWorkRecords
    } = createSchedulerMockDelayedRendererRootWorkDiagnostics(nodeEnv);
    const gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);

    assert.equal(
      report[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(report), true, nodeEnv);
    assert.equal(
      report.kind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(report.version, 1, nodeEnv);
    assert.equal(
      report.producedByPrivateDelayedRendererRootProducer,
      true,
      nodeEnv
    );
    assert.equal(
      report.delayedRendererRootMetadata.kind,
      privateSchedulerMockDelayedRendererRootWorkMetadataKind,
      nodeEnv
    );
    assert.equal(
      report.delayedRendererRootMetadata.sourceEvidenceMatches,
      true,
      nodeEnv
    );
    assert.equal(
      report.expiredActRootWorkDrainReport[
        privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
      ],
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(report),
      true,
      nodeEnv
    );
    assert.equal(
      gateModule.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report),
      false,
      nodeEnv
    );
    assertReactDomExpiredSchedulerDiagnosticsRejected(
      gateModule,
      report,
      "scheduler-expired-act-root-diagnostics-brand",
      `${nodeEnv}:delayed-report-not-expired-route`
    );

    const preflight =
      gateModule.preflightSchedulerMockDelayedActRootWorkDiagnostics(report);
    assert.equal(
      preflight.status,
      gateModule.privateSchedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(
      preflight.gateId,
      gateModule.privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
      nodeEnv
    );
    assert.equal(
      preflight.reactActPreflightStatus,
      reactGate.schedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      reactGate.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticKind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockExpiredActRootWorkDiagnosticKind,
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(preflight.selectedFlushHelper, "unstable_flushExpired");
    assert.equal(preflight.delayedCallbackDelayMs, 10, nodeEnv);
    assert.equal(preflight.delayedCallbackStartTime, 10, nodeEnv);
    assert.equal(preflight.delayedCallbackExpirationTime, 260, nodeEnv);
    assert.equal(preflight.delayedCallbackVirtualTimeBefore, 0, nodeEnv);
    assert.equal(
      preflight.delayedCallbackVirtualTimeAfterPromotion,
      260,
      nodeEnv
    );
    assert.equal(preflight.delayedCallbackAdvanceTimeBy, 260, nodeEnv);
    assert.equal(
      preflight.delayedActRootWorkProducerKind,
      "accepted-renderer-root-metadata",
      nodeEnv
    );
    assert.equal(
      preflight.producedByPrivateDelayedRendererRootProducer,
      true,
      nodeEnv
    );
    assert.equal(preflight.rendererRootSourceEvidencePresent, true, nodeEnv);
    assert.equal(preflight.rendererRootSourceEvidenceOwned, true, nodeEnv);
    assert.equal(
      preflight.delayedRendererRootMetadata,
      report.delayedRendererRootMetadata,
      nodeEnv
    );
    assert.equal(
      preflight.nestedExpiredActRootWorkConsumption.status,
      gateModule.privateSchedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      preflight.reactActNestedExpiredActRootWorkConsumption.status,
      reactGate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.deepEqual(
      preflight.rootWorkRecordSummary.records.map(
        (record) => record.recordKind
      ),
      [
        "RootLaneSchedulingSnapshot",
        "HostRootFinishedWorkPendingCommitRecordForCanary",
        "HostRootFinishedWorkCommitHandoffRecordForCanary"
      ],
      nodeEnv
    );
    assert.equal(preflight.rootWorkRecordSummary.remainingCount, 0, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.pendingBefore, 2, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.drainedCount, 2, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.remainingCount, 0, nodeEnv);
    assert.equal(
      preflight.acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(
      preflight.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
      false,
      nodeEnv
    );
    assert.equal(preflight.privateRoutingReady, false, nodeEnv);
    assert.equal(preflight.publicReactActReady, false, nodeEnv);
    assert.equal(preflight.publicTestUtilsActReady, false, nodeEnv);
    assert.equal(preflight.publicSchedulerFlushBehaviorExecuted, false, nodeEnv);
    assert.equal(preflight.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(preflight.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(preflight.publicActExecution, false, nodeEnv);
    assert.equal(preflight.publicRootExecution, false, nodeEnv);
    assert.equal(preflight.publicEffectExecution, false, nodeEnv);
    assert.equal(preflight.executesEffects, false, nodeEnv);
    assert.equal(preflight.executesPassiveEffects, false, nodeEnv);
    assert.equal(preflight.executesRendererWork, false, nodeEnv);
    assert.equal(preflight.executesRendererRoots, false, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(rootWorkRecords.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);
    assert.equal(getPublicSchedulerCallbackRan(), false, nodeEnv);
    assert.deepEqual(
      events.map((event) => event[0]),
      [
        "renderer-root-delayed-callback",
        "renderer-root-delayed-continuation",
        "renderer-root-act-schedule",
        "renderer-root-act-callback",
        "renderer-root-act-continuation"
      ],
      nodeEnv
    );

    const staleRendererRoot = cloneFrozenObject(
      report.delayedRendererRootMetadata,
      {
        rootRequestId: "stale-renderer-root-request-835"
      }
    );
    const foreignRendererRoot = cloneFrozenObject(
      report.delayedRendererRootMetadata,
      {
        rootId: 836,
        rootLabel: "foreign-renderer-root-836",
        rootRequestId: "foreign-renderer-root-request-836",
        rootRequestSequence: 2
      }
    );

    for (const { diagnostics, reason, label } of [
      {
        label: "top-level-clone",
        diagnostics: cloneDelayedActRootWorkReport(report),
        reason: "scheduler-delayed-act-root-diagnostics-source-proof"
      },
      {
        label: "missing-brand",
        diagnostics: cloneDelayedActRootWorkReport(report, {}, {
          withBrand: false
        }),
        reason: "scheduler-delayed-act-root-diagnostics-brand"
      },
      {
        label: "stale-renderer-root-source",
        diagnostics: cloneDelayedActRootWorkReport(report, {
          delayedRendererRootMetadata: staleRendererRoot,
          delayedActRootWorkMetadata: cloneFrozenObject(
            report.delayedActRootWorkMetadata,
            {
              rendererRootMetadata: staleRendererRoot
            }
          )
        }),
        reason: "scheduler-delayed-act-root-diagnostics-source-proof"
      },
      {
        label: "foreign-renderer-root-source",
        diagnostics: cloneDelayedActRootWorkReport(report, {
          delayedRendererRootMetadata: foreignRendererRoot
        }),
        reason: "scheduler-delayed-act-root-diagnostics-renderer-root-source"
      },
      {
        label: "nested-expired-clone",
        diagnostics: cloneDelayedActRootWorkReport(report, {
          expiredActRootWorkDrainReport: cloneExpiredActRootWorkReport(
            report.expiredActRootWorkDrainReport
          )
        }),
        reason: "scheduler-delayed-act-root-diagnostics-nested-expired"
      },
      {
        label: "public-scheduler-flush-behavior",
        diagnostics: cloneDelayedActRootWorkReport(report, {
          publicSchedulerFlushBehaviorExecuted: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "public-renderer-root-execution",
        diagnostics: cloneDelayedActRootWorkReport(report, {
          executesRendererRoots: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      }
    ]) {
      assertReactDomDelayedSchedulerDiagnosticsRejected(
        gateModule,
        diagnostics,
        reason,
        `${nodeEnv}:${label}`
      );
    }

    const testUtils = loadFreshCjs(fastReactDomTestUtilsPath);
    let publicActCallbackInvoked = false;
    assert.throws(
      () =>
        testUtils.act(() => {
          publicActCallbackInvoked = true;
          return gateModule.preflightSchedulerMockDelayedActRootWorkDiagnostics(
            report
          );
        }),
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react-dom/test-utils");
        assert.equal(error.exportName, "act");
        return true;
      },
      nodeEnv
    );
    assert.equal(publicActCallbackInvoked, false, nodeEnv);

    Scheduler.reset();
  }
});

test("Fast React test-utils private act route rejects Scheduler-first source-proof cache hits", () => {
  for (const nodeEnv of ["development", "production"]) {
    const {
      Scheduler: expiredScheduler,
      report: expiredReport
    } = createSchedulerMockExpiredActRootWorkDiagnostics(nodeEnv, {
      schedulerFirstCacheHit: true
    });
    let gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);

    assert.equal(
      expiredReport[privateSchedulerMockExpiredActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assertReactDomExpiredSchedulerDiagnosticsRejected(
      gateModule,
      expiredReport,
      "scheduler-expired-act-root-diagnostics-metadata",
      `${nodeEnv}:expired-scheduler-first-cache-hit`
    );
    expiredScheduler.reset();

    const {
      Scheduler: delayedScheduler,
      report: delayedReport
    } = createSchedulerMockDelayedRendererRootWorkDiagnostics(nodeEnv, {
      schedulerFirstCacheHit: true
    });
    gateModule = loadFreshCjs(fastReactDomTestUtilsActGatePath);

    assert.equal(
      delayedReport[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assertReactDomDelayedSchedulerDiagnosticsRejected(
      gateModule,
      delayedReport,
      "scheduler-delayed-act-root-diagnostics-metadata",
      `${nodeEnv}:delayed-scheduler-first-cache-hit`
    );
    delayedScheduler.reset();
  }
});

test("CommonJS descriptors are mutable while dynamic import namespace bindings reject writes", () => {
  const result = resultFor("default-node-development", "descriptor-mutability");
  assert.deepEqual(dataDescriptorFields(result.requireBefore.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(dataDescriptorFields(result.importBefore.descriptor), {
    configurable: false,
    enumerable: true,
    writable: true
  });
  assert.equal(result.importAssignment.status, "throws");
  assert.equal(result.importAssignment.error.name, "TypeError");
  assert.match(result.importAssignment.error.message, /Cannot assign/u);
  assert.equal(result.importDelete.status, "throws");
  assert.equal(result.importDelete.error.name, "TypeError");
  assert.match(result.importDelete.error.message, /Cannot delete/u);
  assert.equal(result.requireAssignment.status, "ok");
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "actEqualsReplacement"
    ).value,
    true
  );
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "importedNamedActEqualsReplacement"
    ).value,
    false
  );
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "importedDefaultActEqualsReplacement"
    ).value,
    true
  );
  assert.equal(result.requireDelete.status, "ok");
  assert.equal(result.requireDelete.value.value, true);
  assert.deepEqual(result.requireAfterDelete.objectKeys, []);
  assert.equal(
    result.relationshipsAfterMutation.importedNamedActEqualsOriginal,
    true
  );
  assert.equal(result.relationshipsAfterMutation.importedDefaultHasAct, false);
});

test("deprecation and async no-await warnings are deterministic", () => {
  const warningText =
    "`ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.";

  const dedup = observationFor(
    "default-node-development",
    "deprecation-warning-dedup"
  );
  assert.deepEqual(consoleMessages(dedup), [warningText]);
  assert.equal(dedup.result.first.callbackCallCount, 1);
  assert.equal(dedup.result.second.callbackCallCount, 1);

  const productionDedup = observationFor(
    "default-node-production",
    "deprecation-warning-dedup"
  );
  assert.deepEqual(consoleMessages(productionDedup), [warningText]);
  assert.equal(productionDedup.result.first.callbackCallCount, 0);
  assert.equal(productionDedup.result.first.call.status, "throws");
  assert.equal(
    productionDedup.result.first.call.error.message,
    "React.act is not a function"
  );

  const unawaited = observationFor(
    "default-node-development",
    "async-not-awaited-warning"
  );
  assert.deepEqual(consoleMessages(unawaited), [
    warningText,
    "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
  ]);
  assert.equal(unawaited.result.callbackEvents.length, 1);
  assert.equal(unawaited.result.call.status, "ok");
});

test("sync and async callback returns settle through act thenables in default development", () => {
  const sync = resultFor("default-node-development", "sync-callback-return");
  assertActResolved(sync.testUtils, "sync-return-value");
  assertActResolved(sync.reactAct, "sync-return-value");
  assert.equal(sync.comparison.callStatusesEqual, true);
  assert.equal(sync.comparison.callbackCallCountsEqual, true);
  assert.equal(sync.comparison.settlementStatusesEqual, true);

  const asyncReturn = resultFor(
    "default-node-development",
    "async-callback-return"
  );
  assertActResolved(asyncReturn.testUtils, "async-return-value");
  assertActResolved(asyncReturn.reactAct, "async-return-value");
  assert.equal(asyncReturn.comparison.callStatusesEqual, true);
  assert.equal(asyncReturn.comparison.settlementStatusesEqual, true);

  const production = resultFor("default-node-production", "sync-callback-return");
  assert.equal(production.testUtils.call.status, "throws");
  assert.equal(production.testUtils.callbackCallCount, 0);
  assert.equal(production.testUtils.call.error.message, "React.act is not a function");

  const server = resultFor("react-server-development", "sync-callback-return");
  assert.equal(server.testUtils.call.status, "throws");
  assert.equal(server.testUtils.callbackCallCount, 0);
  assert.equal(server.testUtils.call.error.message, "React.act is not a function");
});

test("synchronous throws and async rejections are captured", () => {
  const syncThrow = resultFor("default-node-development", "callback-throws");
  assert.equal(syncThrow.testUtils.call.status, "throws");
  assert.equal(syncThrow.testUtils.call.error.name, "ProbeSyncError");
  assert.equal(syncThrow.testUtils.call.error.message, "sync callback boom");
  assert.equal(syncThrow.testUtils.callbackCallCount, 1);
  assert.equal(syncThrow.reactAct.call.status, "throws");
  assert.equal(syncThrow.reactAct.call.error.name, "ProbeSyncError");
  assert.equal(syncThrow.comparison.callStatusesEqual, true);

  const asyncReject = resultFor(
    "default-node-development",
    "async-callback-rejects"
  );
  assert.equal(asyncReject.testUtils.call.status, "ok");
  assert.equal(asyncReject.testUtils.settlement.status, "rejected");
  assert.equal(asyncReject.testUtils.settlement.error.name, "ProbeAsyncError");
  assert.equal(
    asyncReject.testUtils.settlement.error.message,
    "async callback boom"
  );
  assert.equal(asyncReject.reactAct.settlement.status, "rejected");

  const production = resultFor("default-node-production", "callback-throws");
  assert.equal(production.testUtils.call.status, "throws");
  assert.equal(production.testUtils.call.error.name, "TypeError");
  assert.equal(production.testUtils.callbackCallCount, 0);
});

test("thenable classification records object thenables and sync fallback returns", () => {
  const result = resultFor("default-node-development", "thenable-classification");
  assert.deepEqual(result.testUtils.events, ["object-then-called"]);
  assertActResolved(result.testUtils.objectThenable, "object-then-value");
  assert.equal(result.testUtils.functionThenable.settlement.status, "resolved");
  assert.equal(
    result.testUtils.functionThenable.settlement.value.name,
    "functionThenableValue"
  );
  assert.equal(
    result.testUtils.functionThenable.settlement.value.type,
    "function"
  );
  assert.equal(result.testUtils.nonFunctionThen.settlement.status, "resolved");
  assert.equal(
    result.testUtils.nonFunctionThen.settlement.value.objectTag,
    "[object Object]"
  );
  assert.equal(result.testUtils.nullReturn.settlement.status, "resolved");
  assert.deepEqual(result.testUtils.nullReturn.settlement.value, {
    type: "null"
  });

  const production = resultFor("default-node-production", "thenable-classification");
  assert.equal(production.testUtils.objectThenable.call.status, "throws");
  assert.equal(production.testUtils.objectThenable.callbackCallCount, 0);
  assert.deepEqual(production.testUtils.events, []);
});

test("react-dom/test-utils.act oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomTestUtilsActOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-test-utils-act-oracle-[A-Za-z0-9]/u
  );
});

test("print react-dom/test-utils.act oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-test-utils-act-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomTestUtilsActOracleText());
});

function observationFor(modeId, scenarioId) {
  return findReactDomTestUtilsActObservation(oracle, modeId, scenarioId);
}

function resultFor(modeId, scenarioId) {
  return observationFor(modeId, scenarioId).result;
}

function createSchedulerMockExpiredActRootWorkDiagnostics(
  nodeEnv,
  options = {}
) {
  const { Scheduler, reactGate } =
    loadSchedulerMockAndReactGateForSourceProof(nodeEnv, options);
  const rootId = options.rootId ?? 747;
  const rootLabel = options.rootLabel ?? "mock-root-747";

  Scheduler.reset();
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
  assert.equal(diagnostics.mockSchedulerExpiredActRootWorkDiagnosticsReady, true);

  const events = [];
  const createCallback = (label, continuation = null) =>
    reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
        return continuation;
      },
      { label }
    );
  const expiredContinuation = createCallback(
    "expired-act-root-continuation"
  );
  const expiredCallback = createCallback(
    "expired-act-root-callback",
    expiredContinuation
  );
  const expiredHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    expiredCallback
  );
  let publicSchedulerCallbackRan = false;
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      publicSchedulerCallbackRan = true;
      Scheduler.log("public-scheduler-work");
    }
  );
  const actRootContinuation = createCallback("act-root-continuation");
  const actQueue = reactGate.createInternalActQueueTestQueue([
    reactGate.createInternalActQueueTestTask({
      label: "act-root-schedule",
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: createCallback("act-root-schedule")
    }),
    reactGate.createInternalActQueueTestTask({
      label: "act-root-callback",
      recordKind: "SyncFlushActContinuationRecord",
      taskKind: "SchedulerCallback",
      continuationStatus: "PendingContinuation",
      callback: createCallback("act-root-callback", actRootContinuation)
    })
  ]);
  const metadata = createExpiredActRootWorkMetadata(
    Scheduler,
    expiredHandle,
    actQueue,
    {
      rootId,
      rootLabel,
      rootWorkRecords: acceptedSchedulerMockExpiredActRootWorkRecords.map(
        (recordKind) =>
          createAcceptedExpiredActRootWorkRecord(recordKind, {
            rootId,
            rootLabel
          })
      )
    }
  );

  Scheduler.unstable_advanceTime(251);

  return {
    Scheduler,
    actQueue,
    events,
    getPublicSchedulerCallbackRan() {
      return publicSchedulerCallbackRan;
    },
    metadata,
    reactGate,
    report: Scheduler.unstable_flushExpired(metadata)
  };
}

function createSchedulerMockDelayedRendererRootWorkDiagnostics(
  nodeEnv,
  options = {}
) {
  const { Scheduler, reactGate } =
    loadSchedulerMockAndReactGateForSourceProof(nodeEnv, options);
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];

  Scheduler.reset();
  const events = [];
  const createCallback = (label, continuation = null) =>
    reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
        return continuation;
      },
      { label }
    );
  const delayedContinuation = createCallback(
    "renderer-root-delayed-continuation"
  );
  const delayedCallback = createCallback(
    "renderer-root-delayed-callback",
    delayedContinuation
  );
  const delayedHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    delayedCallback,
    { delay: 10 }
  );
  const scheduledVirtualTime = Scheduler.unstable_now();
  let publicSchedulerCallbackRan = false;
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      publicSchedulerCallbackRan = true;
      Scheduler.log("public-renderer-root-work");
    }
  );
  const actRootContinuation = createCallback(
    "renderer-root-act-continuation"
  );
  const actQueue = reactGate.createInternalActQueueTestQueue([
    reactGate.createInternalActQueueTestTask({
      label: "renderer-root-act-schedule",
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: createCallback("renderer-root-act-schedule")
    }),
    reactGate.createInternalActQueueTestTask({
      label: "renderer-root-act-callback",
      recordKind: "SyncFlushActContinuationRecord",
      taskKind: "SchedulerCallback",
      continuationStatus: "PendingContinuation",
      callback: createCallback(
        "renderer-root-act-callback",
        actRootContinuation
      )
    })
  ]);
  const rootWorkRecords = [
    createAcceptedExpiredActRootWorkRecord("RootLaneSchedulingSnapshot", {
      rootId: 835,
      rootLabel: "renderer-root-835"
    }),
    createAcceptedExpiredActRootWorkRecord(
      "HostRootFinishedWorkPendingCommitRecordForCanary",
      {
        rootId: 835,
        rootLabel: "renderer-root-835"
      }
    ),
    createAcceptedExpiredActRootWorkRecord(
      "HostRootFinishedWorkCommitHandoffRecordForCanary",
      {
        rootId: 835,
        rootLabel: "renderer-root-835"
      }
    )
  ];
  const rendererRootMetadata =
    diagnostics.createDelayedRendererRootWorkMetadataForDiagnostics({
      callbackHandle: delayedHandle,
      actQueue,
      rootWorkRecords,
      rootId: 835,
      rootLabel: "renderer-root-835",
      rootRequestId: "renderer-root-request-835",
      rootRequestSequence: 1,
      rootOperation: "create",
      scheduledVirtualTime,
      delayMs: delayedHandle.startTime - scheduledVirtualTime,
      schedulerPriority: "UserBlocking"
    });
  const delayedMetadata =
    diagnostics.createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics(
      rendererRootMetadata
    );

  return {
    Scheduler,
    actQueue,
    events,
    getPublicSchedulerCallbackRan() {
      return publicSchedulerCallbackRan;
    },
    reactGate,
    rendererRootMetadata,
    delayedMetadata,
    rootWorkRecords,
    report: Scheduler.unstable_flushExpired(delayedMetadata)
  };
}

function createExpiredActRootWorkMetadata(
  Scheduler,
  callbackHandle,
  actQueue,
  overrides = {}
) {
  const metadata = {
    kind: privateSchedulerMockExpiredActRootWorkMetadataKind,
    version: 1,
    compatibilityTarget: "scheduler@0.27.0",
    reactCompatibilityTarget: "react@19.2.6",
    rootId: 747,
    rootLabel: "mock-root-747",
    lane: "SyncLane",
    laneLabel: "SyncLane",
    priorityLevel: Scheduler.unstable_UserBlockingPriority,
    schedulerPriority: "UserBlocking",
    callbackHandle,
    actQueue,
    expectedActQueuePendingCount: Array.isArray(actQueue?.records)
      ? actQueue.records.length
      : 0,
    rootWorkRecords: [
      createAcceptedExpiredActRootWorkRecord("RootLaneSchedulingSnapshot"),
      createAcceptedExpiredActRootWorkRecord("RootTaskScheduleRecord")
    ],
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    ...overrides
  };

  Object.defineProperty(
    metadata,
    privateSchedulerMockExpiredActRootWorkMetadataBrand,
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
  return Object.freeze(metadata);
}

function createAcceptedExpiredActRootWorkRecord(recordKind, overrides = {}) {
  return Object.freeze({
    recordKind,
    accepted: true,
    rootId: 747,
    rootLabel: "mock-root-747",
    lane: "SyncLane",
    laneLabel: "SyncLane",
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    ...overrides
  });
}

function cloneExpiredActRootWorkReport(
  report,
  overrides = {},
  options = {}
) {
  const cloned = {
    ...report,
    ...overrides
  };

  if (options.withBrand !== false) {
    Object.defineProperty(
      cloned,
      privateSchedulerMockExpiredActRootWorkDiagnosticsBrand,
      {
        configurable: false,
        enumerable: false,
        value: true,
        writable: false
      }
    );
  }

  if (options.withOldGlobalSourceProof === true) {
    return freezeWithOldGlobalSchedulerSourceProof(cloned);
  }

  return Object.freeze(cloned);
}

function cloneDelayedActRootWorkReport(
  report,
  overrides = {},
  options = {}
) {
  const cloned = {
    ...report,
    ...overrides
  };

  if (options.withBrand !== false) {
    Object.defineProperty(
      cloned,
      privateSchedulerMockDelayedActRootWorkDiagnosticsBrand,
      {
        configurable: false,
        enumerable: false,
        value: true,
        writable: false
      }
    );
  }

  if (options.withOldGlobalSourceProof === true) {
    return freezeWithOldGlobalSchedulerSourceProof(cloned);
  }

  return Object.freeze(cloned);
}

function cloneSchedulerDrivenPassiveEffectDiagnostics(
  diagnostics,
  overrides = {},
  { withBrand = true } = {}
) {
  const cloned = {
    ...diagnostics,
    ...overrides
  };

  if (withBrand) {
    Object.defineProperty(
      cloned,
      privateSchedulerDrivenPassiveEffectDiagnosticsBrand,
      {
        configurable: false,
        enumerable: false,
        value: true,
        writable: false
      }
    );
  }

  return Object.freeze(cloned);
}

function createCallerBuiltSchedulerDrivenPassiveEffectNestedRecords(
  diagnostics
) {
  const schedulerRequest = { ...diagnostics.schedulerRequest };
  const schedulerGate = {
    ...diagnostics.schedulerGate,
    schedulerRequest
  };
  const passiveEffects = { ...diagnostics.passiveEffects };
  const schedulerExecution = {
    ...diagnostics.schedulerExecution,
    schedulerGate,
    schedulerRequest,
    passiveEffects
  };

  return {
    rootCommitPassiveExecution: {
      ...diagnostics.rootCommitPassiveExecution
    },
    pendingPassiveHandoff: {
      ...diagnostics.pendingPassiveHandoff
    },
    schedulerRequest,
    schedulerGate,
    passiveEffects,
    schedulerExecution
  };
}

function cloneFrozenObject(value, overrides = {}) {
  return Object.freeze({
    ...value,
    ...overrides
  });
}

function assertReactDomTestUtilsCurrentnessRejected(
  gateModule,
  report,
  reason,
  label
) {
  assert.equal(
    gateModule.isAcceptedPublicReactDomTestUtilsActBlockedCurrentnessReport(
      report
    ),
    false,
    label
  );
  assert.throws(
    () =>
      gateModule.consumePublicReactDomTestUtilsActBlockedCurrentnessReport(
        report
      ),
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react-dom/test-utils", label);
      assert.equal(
        error.exportName,
        `${gateModule.privateTestUtilsActGateExport}.consumePublicReactDomTestUtilsActBlockedCurrentnessReport`,
        label
      );
      assert.equal(error.compatibilityTarget, "react-dom@19.2.6", label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicTestUtilsActCompatibilityClaimed, false, label);
      assert.equal(error.publicWarningCompatibilityClaimed, false, label);
      assert.equal(error.publicPackageCompatibilityClaimed, false, label);
      assert.equal(error.packageCompatibilityClaimed, false, label);
      assert.equal(error.packageSurfaceChanged, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.publicActPassiveDrain, false, label);
      assert.equal(error.publicEffectExecution, false, label);
      assert.equal(error.publicRootExecution, false, label);
      assert.equal(error.invokesCallback, false, label);
      assert.equal(error.returnsThenable, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertReactDomExpiredSchedulerDiagnosticsRejected(
  gateModule,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gateModule.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
      diagnostics
    ),
    false,
    label
  );
  assert.throws(
    () =>
      gateModule.consumeSchedulerMockExpiredActRootWorkDiagnostics(
        diagnostics
      ),
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react-dom/test-utils", label);
      assert.equal(
        error.exportName,
        `${gateModule.privateTestUtilsActGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, "react-dom@19.2.6", label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertReactDomSchedulerDrivenPassiveDiagnosticsRejected(
  gateModule,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gateModule.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => gateModule.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react-dom/test-utils", label);
      assert.equal(
        error.exportName,
        `${gateModule.privateTestUtilsActGateExport}.consumeSchedulerDrivenPassiveEffectDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, "react-dom@19.2.6", label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.publicActPassiveDrain, false, label);
      assert.equal(error.publicEffectExecution, false, label);
      assert.equal(error.publicRootExecution, false, label);
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertReactDomDelayedSchedulerDiagnosticsRejected(
  gateModule,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gateModule.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(
      diagnostics
    ),
    false,
    label
  );
  assert.throws(
    () =>
      gateModule.preflightSchedulerMockDelayedActRootWorkDiagnostics(
        diagnostics
      ),
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react-dom/test-utils", label);
      assert.equal(
        error.exportName,
        `${gateModule.privateTestUtilsActGateExport}.preflightSchedulerMockDelayedActRootWorkDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, "react-dom@19.2.6", label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(error.invokesPublicSchedulerFlushHelper, false, label);
      assert.equal(error.publicSchedulerFlushBehaviorExecuted, false, label);
      assert.equal(
        error.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
        false,
        label
      );
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesPassiveEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function deepCloneExpiredActRootWorkDiagnosticsWithOldGlobalSourceProof(
  value
) {
  if (!isObjectLikeForTest(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return freezeWithOldGlobalSchedulerSourceProof(
      value.map(deepCloneExpiredActRootWorkDiagnosticsWithOldGlobalSourceProof)
    );
  }

  const cloned = {};
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined) {
      continue;
    }
    if (Object.hasOwn(descriptor, "value")) {
      descriptor.value =
        deepCloneExpiredActRootWorkDiagnosticsWithOldGlobalSourceProof(
          descriptor.value
        );
    }
    Object.defineProperty(cloned, key, descriptor);
  }
  return freezeWithOldGlobalSchedulerSourceProof(cloned);
}

function freezeWithOldGlobalSchedulerSourceProof(value) {
  getOldSchedulerMockExpiredActRootWorkSourceSet().add(value);
  Object.defineProperty(value, oldSchedulerMockExpiredActRootWorkSourceProof, {
    configurable: false,
    enumerable: false,
    value: getOldSchedulerMockExpiredActRootWorkSourceToken(),
    writable: false
  });
  return Object.freeze(value);
}

function getOldSchedulerMockExpiredActRootWorkSourceToken() {
  const existingToken =
    globalThis[oldSchedulerMockExpiredActRootWorkSourceTokenKey];
  if (existingToken !== undefined) {
    return existingToken;
  }

  const token = Object.freeze({
    kind: "fast-react.scheduler.mock-expired-act-root-work-source-token",
    version: 1,
    compatibilityTarget: "scheduler@0.27.0",
    reactCompatibilityTarget: "react@19.2.6"
  });
  Object.defineProperty(
    globalThis,
    oldSchedulerMockExpiredActRootWorkSourceTokenKey,
    {
      configurable: false,
      enumerable: false,
      value: token,
      writable: false
    }
  );
  return token;
}

function getOldSchedulerMockExpiredActRootWorkSourceSet() {
  const existingSet =
    globalThis[oldSchedulerMockExpiredActRootWorkSourceSetKey];
  if (existingSet !== undefined) {
    return existingSet;
  }

  const sourceSet = new WeakSet();
  Object.defineProperty(
    globalThis,
    oldSchedulerMockExpiredActRootWorkSourceSetKey,
    {
      configurable: false,
      enumerable: false,
      value: sourceSet,
      writable: false
    }
  );
  return sourceSet;
}

function isObjectLikeForTest(value) {
  return (
    (typeof value === "object" && value !== null) ||
    typeof value === "function"
  );
}

function loadSchedulerMockAndReactGateForSourceProof(
  nodeEnv,
  { schedulerFirstCacheHit = false } = {}
) {
  if (schedulerFirstCacheHit) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const reactGate = loadFreshCjs(fastReactPrivateActDispatcherGatePath);
    return { Scheduler, reactGate };
  }

  const reactGate = loadFreshCjs(fastReactPrivateActDispatcherGatePath);
  const Scheduler = loadFreshSchedulerMock(nodeEnv);
  return { Scheduler, reactGate };
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;

  for (const filePath of [
    fastSchedulerMockPath,
    fastSchedulerMockCjsDevelopmentPath,
    fastSchedulerMockCjsProductionPath
  ]) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
  }

  process.env.NODE_ENV = nodeEnv;
  try {
    return require(fastSchedulerMockPath);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function loadFreshCjs(filePath) {
  const resolved = require.resolve(filePath);
  delete require.cache[resolved];
  return require(resolved);
}

function descriptorFor(descriptors, key) {
  const match = descriptors.find(
    (entry) =>
      (entry.key.type === "string" && entry.key.value === key) ||
      (entry.key.type === "symbol" && entry.key.description === key)
  );
  assert.ok(match, `missing descriptor for ${key}`);
  return match.descriptor;
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function dataDescriptorFieldsForObject(descriptor) {
  assert.notEqual(descriptor, undefined);
  assert.equal(Object.hasOwn(descriptor, "value"), true);
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function describeFunctionValue(value) {
  assert.equal(typeof value, "function");
  return {
    type: "function",
    name: value.name,
    length: value.length,
    isAsync: value.constructor.name === "AsyncFunction",
    ownPropertyNames: Object.getOwnPropertyNames(value),
    ownKeys: describeOwnKeys(value)
  };
}

function describeOwnKeys(value) {
  return Reflect.ownKeys(value).map((key) => {
    if (typeof key === "symbol") {
      return { type: "symbol", description: key.description };
    }

    return { type: "string", value: key };
  });
}

function describedObjectPropertyValue(objectDescription, key) {
  return descriptorFor(objectDescription.descriptors, key).value;
}

function keyValues(keys) {
  return keys.map((key) =>
    key.type === "symbol" ? key.description : key.value
  );
}

function consoleMessages(observation) {
  return observation.consoleCalls.map((call) => call.args[0].value);
}

function assertFastReactDomActBlocked(act) {
  const consoleCalls = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  let callbackCalls = 0;

  console.error = (...args) => {
    consoleCalls.push(["error", ...args]);
  };
  console.warn = (...args) => {
    consoleCalls.push(["warn", ...args]);
  };

  try {
    assert.throws(
      () =>
        act(() => {
          callbackCalls += 1;
          return "unexpected-act-callback-result";
        }),
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react-dom/test-utils");
        assert.equal(error.exportName, "act");
        assert.equal(error.compatibilityTarget, "react-dom@19.2.6");
        assert.match(error.message, /react-dom\/test-utils\.act was called/u);
        assert.match(error.message, /no React DOM behavior implementation yet/u);
        assert.match(error.message, /do not treat it as React DOM-compatible/u);
        return true;
      }
    );
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }

  assert.equal(callbackCalls, 0);
  assert.deepEqual(consoleCalls, []);
}

function assertActResolved(actObservation, expectedValue) {
  assert.equal(actObservation.call.status, "ok");
  assert.equal(actObservation.callbackCallCount, 1);
  assert.deepEqual(actObservation.call.value, {
    type: "object",
    objectTag: "[object Object]",
    isArray: false,
    isExtensible: true,
    objectKeys: ["then"],
    ownPropertyNames: ["then"],
    ownSymbolKeys: [],
    ownKeys: [{ type: "string", value: "then" }],
    descriptors: [
      {
        key: { type: "string", value: "then" },
        descriptor: {
          kind: "data",
          enumerable: true,
          configurable: true,
          writable: true,
          value: {
            type: "function",
            name: "then",
            length: 2,
            isAsync: false,
            ownPropertyNames: ["length", "name", "prototype"],
            ownKeys: [
              { type: "string", value: "length" },
              { type: "string", value: "name" },
              { type: "string", value: "prototype" }
            ]
          }
        }
      }
    ]
  });
  assert.equal(actObservation.settlement.status, "resolved");
  assert.deepEqual(actObservation.settlement.value, {
    type: "string",
    value: expectedValue
  });
}
