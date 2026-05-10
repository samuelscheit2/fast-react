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
const fastReactDomTestUtilsPath = fileURLToPath(
  new URL("../../../packages/react-dom/test-utils.js", import.meta.url)
);
const fastReactPath = fileURLToPath(
  new URL("../../../packages/react/index.js", import.meta.url)
);
const fastReactDomTestUtilsActGatePath = fileURLToPath(
  new URL(
    "../../../packages/react-dom/src/test-utils-act-gate.js",
    import.meta.url
  )
);

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
    "render-after-unmount"
  ];
  const unsupportedPrivateHostOutputScenarioIds = [
    "flush-sync-cross-root-render",
    "development-warning-boundaries"
  ];
  const blockedPrivateHostOutputPrerequisiteIds =
    acceptedPrivateHostOutputScenarioIds.map(
      (scenarioId) => `accepted-private-root-host-output-${scenarioId}`
    );

  assert.equal(
    gate.status,
    "blocked-public-test-utils-act-private-routing"
  );
  assert.equal(
    gate.id,
    "react-dom-test-utils-act-private-routing-gate-3"
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
  assert.deepEqual(gate.acceptedPrivatePrerequisiteIds, [
    "react-act-private-dispatcher-gate",
    "scheduler-act-queue-routing-records",
    "scheduler-mock-flush-helper-metadata",
    "sync-flush-act-continuation-records",
    "sync-flush-post-passive-continuation-execution-gate",
    "passive-effects-flush-metadata",
    "passive-effect-callback-handle-metadata",
    "react-dom-private-root-bridge-records",
    "react-dom-private-flush-sync-guard"
  ]);
  assert.deepEqual(gate.blockedPublicPrerequisiteIds, [
    "public-react-act-delegation",
    "act-queue-flushing-execution",
    "passive-effect-callback-execution",
    "public-react-dom-root-execution",
    "public-react-dom-flush-sync-execution"
  ]);
  assert.deepEqual(gate.publicPrerequisitesStillBlocked, [
    "public-react-act-delegation",
    "act-queue-flushing-execution",
    "passive-effect-callback-execution",
    "public-react-dom-root-execution",
    "public-react-dom-flush-sync-execution"
  ]);
  assert.deepEqual(
    gate.blockedPrivateRootHostOutputPrerequisiteIds,
    blockedPrivateHostOutputPrerequisiteIds
  );
  assert.deepEqual(
    gate.privateRootHostOutputPrerequisitesStillBlocked,
    blockedPrivateHostOutputPrerequisiteIds
  );
  const publicRootPrerequisite = gate.blockedPublicPrerequisites.find(
    (prerequisite) => prerequisite.id === "public-react-dom-root-execution"
  );
  assert.equal(
    publicRootPrerequisite.blockedByAcceptedPrivateRootHostOutputDiagnostics,
    true
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
    16
  );
  assert.equal(
    publicRootPrerequisite.unsupportedPrivateHostOutputScenarioModeRowCount,
    4
  );
  assert.deepEqual(gate.sideEffectPolicy, {
    invokesActCallback: false,
    executesQueuedWork: false,
    executesPassiveEffects: false,
    executesRendererRoots: false,
    executesPublicRendererRoots: false,
    executesPublicDomMutation: false,
    executesSyncFlush: false,
    emitsDeprecationWarning: false,
    delegatesToReactAct: false
  });
  assert.equal(
    gate.deprecationWarningBehavior,
    "preserved-no-warning-while-public-test-utils-act-is-placeholder"
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
    "private-render-after-unmount-guard-no-extra-mutation"
  ]);
  assert.deepEqual(hostOutputDiagnostics.summary, {
    admittedScenarioIds: acceptedPrivateHostOutputScenarioIds,
    blockedScenarioIds: unsupportedPrivateHostOutputScenarioIds,
    admittedScenarioModeRowCount: 16,
    blockedScenarioModeRowCount: 4,
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
  assert.equal(hostOutputDiagnostics.blockedPrerequisites.length, 8);
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
  assert.equal(gate.reactDomRootBridge.nativeExecution, false);
  assert.equal(gate.reactDomRootBridge.reconcilerExecution, false);
  assert.equal(gate.reactDomRootBridge.domMutation, false);
  assert.equal(gate.reactDomRootBridge.compatibilityClaimed, false);

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
