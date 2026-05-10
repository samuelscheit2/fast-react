import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  REACT_ACT_FAST_REACT_TARGET,
  REACT_ACT_ORACLE_ARTIFACT_PATH,
  REACT_ACT_PROBE_MODES,
  REACT_ACT_REACT_TARGET
} from "../src/react-act-targets.mjs";
import {
  REACT_ACT_SCENARIO_IDS,
  REACT_ACT_SCENARIOS
} from "../src/react-act-scenarios.mjs";
import {
  findReactActObservation,
  readCheckedReactActOracle,
  readCheckedReactActOracleText
} from "../src/react-act-oracle.mjs";
import {
  inspectSchedulerPostTaskPriorityDiagnostics
} from "../src/scheduler-post-task-oracle.mjs";
import {
  REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS,
  REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS,
  REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS,
  evaluateReactActPublicBlockedGate
} from "../src/react-act-public-blocked-gate.mjs";

const oracle = readCheckedReactActOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const {
  ROOT_CONTINUATION_REJECTED_STATUS,
  createPrivatePostTaskRootContinuationMetadataRow
} = require(
  path.join(
    repoRoot,
    "tests/conformance/src/scheduler-post-task-root-continuation.cjs"
  )
);
const privateActDispatcherGateExport =
  "__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__";
const privateActDispatcherGateStatus =
  "blocked-until-renderer-roots-passive-effects-and-act-continuations";
const publicReactEntrypoints = [
  "packages/react/index.js",
  "packages/react/cjs/react.development.js",
  "packages/react/cjs/react.production.js"
];
const privateActDispatcherGateModule =
  "packages/react/private-act-dispatcher-gate.js";
const reactDomTestUtilsActPrivateRoutingGateModule =
  "packages/react-dom/src/test-utils-act-gate.js";
const privateActQueueFlushDiagnosticsExport =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";
const schedulerMockWorkspaceEntrypoint = "packages/scheduler/unstable_mock.js";
const schedulerMockWorkspaceEntrypoints = [
  schedulerMockWorkspaceEntrypoint,
  "packages/scheduler/cjs/scheduler-unstable_mock.development.js",
  "packages/scheduler/cjs/scheduler-unstable_mock.production.js"
];

test("checked React.act oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_ACT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-act-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-react-act-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact react npm tarball plus local Fast React package copied into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(oracle.reactTarget, REACT_ACT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, REACT_ACT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("React.act oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactBehaviorCompared: true,
    fastReactComparedToReact: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.reactPublicActBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.rendererBackedFlushingProbed, false);
  assert.equal(oracle.evidenceClaims.fastReactComparedToReact, true);
  assert.equal(oracle.evidenceClaims.fastReactBehaviorCompatible, false);
  assert.equal(
    oracle.packages["@fast-react/react"].behaviorCompatibilityClaimed,
    false
  );
  assert.deepEqual(oracle.implementationComparison, {
    worker097Checked: {
      source:
        "generated fastReactComparisons in this oracle artifact; default Fast React act is still a placeholder and react-server act is absent",
      generatedProbe: true,
      statusCounts: {
        "known-mismatch": 2,
        "unsupported-placeholder": 10,
        "matched-but-compatibility-not-claimed": 12
      },
      compatibilityClaimed: false
    }
  });
});

test("public React.act gate stays blocked until act queue flushing, effects, and renderer roots are ready", () => {
  const gate = evaluateReactActPublicBlockedGate({ oracle });

  assert.equal(gate.status, REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS);
  assert.equal(gate.requiredPrerequisitesReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);

  assert.equal(gate.localChecks.publicActUnsupportedPlaceholder, true);
  assert.equal(gate.localChecks.defaultAct.hasOwn, true);
  assert.equal(gate.localChecks.defaultAct.exportKeysInclude, true);
  assert.deepEqual(gate.localChecks.defaultAct.value, {
    type: "function",
    name: "act",
    length: 0
  });
  assert.equal(gate.localChecks.defaultAct.callAttempt.status, "throws");
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.name,
    "FastReactUnimplementedError"
  );
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(gate.localChecks.defaultAct.callAttempt.error.entrypoint, "react");
  assert.equal(gate.localChecks.defaultAct.callAttempt.error.exportName, "act");
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.compatibilityTarget,
    "react@19.2.6"
  );
  assert.equal(gate.localChecks.defaultAct.callbackInvoked, false);
  assert.deepEqual(gate.localChecks.reactServerAct, {
    hasOwn: false,
    exportKeysInclude: false,
    value: {
      type: "undefined"
    }
  });

  assert.equal(
    gate.localChecks.actQueueStatus,
    "private-records-without-flushing"
  );
  assert.equal(gate.localChecks.actQueueFlushingReady, false);
  assert.equal(
    gate.localChecks.effectExecutionStatus,
    "metadata-only-no-callback-execution"
  );
  assert.equal(gate.localChecks.effectExecutionReady, false);
  assert.equal(
    gate.localChecks.rendererRootStatus,
    "public-renderer-roots-placeholder-blocked"
  );
  assert.equal(gate.localChecks.rendererRootsReady, false);
  assert.equal(gate.localChecks.reactDomClientRootPlaceholder, true);
  assert.equal(gate.localChecks.testRendererRootPlaceholder, true);
});

test("public React.act scenario admission stays explicit and closed", () => {
  assert.deepEqual(
    REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "reconciler-act-queue-flushing",
      "effect-execution",
      "renderer-roots"
    ]
  );
  assert.deepEqual(
    REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS.map((scenario) => scenario.scenarioId),
    REACT_ACT_SCENARIO_IDS
  );

  for (const scenario of REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS) {
    assert.equal(scenario.status, REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS);
    assert.equal(scenario.admittedForFastReactComparison, false);
    assert.equal(scenario.compatibilityClaimed, false);
    assert.deepEqual(
      scenario.unblockRequires,
      REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
    );
  }

  const gate = evaluateReactActPublicBlockedGate({ oracle });
  assert.deepEqual(gate.admittedScenarios, []);
  assert.equal(gate.defaultActBehaviorRows.length, 10);
  assert.equal(gate.unsupportedDefaultBehaviorRows.length, 10);
});

test("public React.act gate rejects premature compatibility claims and scenario admissions", () => {
  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;

  const claimGate = evaluateReactActPublicBlockedGate({
    oracle: prematureClaimOracle
  });
  assert.equal(claimGate.status, "blocked-with-violations");
  assert.deepEqual(
    claimGate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-act-prerequisites"]
  );

  const admittedScenarios = REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS.map(
    (scenario, index) =>
      index === 0
        ? {
            ...scenario,
            admittedForFastReactComparison: true
          }
        : scenario
  );
  const admissionGate = evaluateReactActPublicBlockedGate({
    oracle,
    scenarioAdmissions: admittedScenarios
  });
  assert.equal(admissionGate.status, "blocked-with-violations");
  assert.deepEqual(
    admissionGate.violations.map((violation) => violation.id),
    ["scenario-admitted-before-act-prerequisites"]
  );
  assert.deepEqual(admissionGate.violations[0].scenarioIds, [
    "react-act-export-shape"
  ]);
});

test("package-private React act dispatcher gate recognizes accepted metadata without flushing", () => {
  for (const relativeModulePath of publicReactEntrypoints) {
    const React = loadFreshWorkspaceModule(relativeModulePath);
    const descriptor = Object.getOwnPropertyDescriptor(
      React,
      privateActDispatcherGateExport
    );

    assert.equal(
      Object.keys(React).includes(privateActDispatcherGateExport),
      false,
      relativeModulePath
    );
    assert.equal(descriptor, undefined, relativeModulePath);

    let publicActCallbackInvoked = false;
    const publicActError = captureThrown(() =>
      React.act(() => {
        publicActCallbackInvoked = true;
      })
    );
    assertReactActPlaceholderError(publicActError);
    assert.equal(publicActCallbackInvoked, false, relativeModulePath);

    assertReactHookDispatcherGuardUnchanged(React, relativeModulePath);
  }

  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  assert.equal(gate.status, privateActDispatcherGateStatus);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.queueFlushingReady, false);
  assert.equal(gate.rendererRootsReady, false);
  assert.equal(gate.passiveEffectsReady, false);
  assert.equal(gate.continuationFlushingReady, false);
  assert.equal(gate.privateTestQueueFlushDiagnosticsReady, true);
  assert.equal(gate.drainsAcceptedInternalTestQueues, true);
  assert.equal(gate.privateSyncFlushActExecutionDiagnosticsReady, true);
  assert.equal(
    gate.privateSyncFlushActExecutionDiagnosticKind,
    "fast-react.react.private-sync-flush-act-execution-diagnostic"
  );
  assert.equal(gate.privateSyncFlushActExecutionDiagnosticVersion, 1);
  assert.equal(gate.committedHostOutputCanaryRequired, true);
  assert.equal(gate.drainsAcceptedInternalActContinuationRecords, true);
  assert.equal(gate.drainsPublicReactActQueue, false);
  assert.equal(gate.schedulerPrivateContinuationDiagnosticsReady, true);
  assert.equal(gate.consumesSchedulerPrivateContinuationDiagnostics, true);
  assert.equal(gate.rendererBackedActDrainDiagnosticsReady, true);
  assert.equal(gate.consumesRendererBackedActDrainDiagnostics, true);
  assert.equal(
    gate.rendererBackedActDrainDiagnosticKind,
    "fast-react.react.private-renderer-backed-act-drain-diagnostic"
  );
  assert.equal(gate.rendererBackedActDrainDiagnosticVersion, 1);
  assert.equal(gate.drainsAcceptedRendererBackedActDiagnostics, true);
  assert.equal(
    gate.schedulerPostTaskYieldActRootHandoffDiagnosticsReady,
    true
  );
  assert.equal(
    gate.consumesSchedulerPostTaskYieldActRootHandoffDiagnostics,
    true
  );
  assert.equal(
    gate.schedulerPostTaskYieldActRootHandoffConsumptionStatus,
    "consumed-accepted-scheduler-post-task-yield-act-root-handoff-diagnostics"
  );
  assert.equal(
    gate.schedulerPostTaskPriorityDiagnosticsExportName,
    "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__"
  );
  assert.equal(
    gate.schedulerPostTaskPriorityDiagnosticsSymbolDescription,
    "fast-react.scheduler.unstable_post_task.priority-diagnostics"
  );
  assert.equal(
    gate.schedulerPostTaskActRootWorkHandoffKind,
    "fast-react.scheduler.post_task.private-act-root-work-handoff"
  );
  assert.equal(gate.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(gate.publicReactActCompatibilityClaimed, false);
  assert.equal(gate.executesQueuedWork, false);
  assert.equal(gate.executesEffects, false);
  assert.equal(gate.executesRendererRoots, false);
  assert.equal(
    gate.schedulerDiagnosticsExportName,
    privateActQueueFlushDiagnosticsExport
  );
  assert.equal(
    gate.schedulerDiagnosticsStatus,
    "private-scheduler-act-queue-flush-diagnostics"
  );
  assert.equal(
    gate.schedulerContinuationConsumptionStatus,
    "consumed-accepted-scheduler-private-continuation-diagnostics"
  );
  assert.equal(
    gate.rendererBackedActDrainDiagnosticsStatus,
    "private-renderer-backed-act-drain-diagnostics"
  );
  assert.equal(
    gate.rendererBackedActDrainConsumptionStatus,
    "consumed-accepted-renderer-backed-act-drain-diagnostics"
  );
  assert.deepEqual(gate.requiredRecords, [
    "SchedulerActQueueRequest",
    "SchedulerActScopeBoundaryRecord",
    "SyncFlushActContinuationRecord"
  ]);
  assert.deepEqual(gate.requiredTaskKinds, [
    "RootSchedule",
    "SchedulerCallback"
  ]);
  assert.deepEqual(gate.requiredContinuationStatuses, [
    "NoContinuation",
    "PendingContinuation"
  ]);
  assert.deepEqual(gate.acceptedPrivateActContinuationDrainRecords, [
    "SyncFlushActContinuationDrainRecord",
    "SyncFlushActPrivateExecutionDiagnosticsForCanary"
  ]);
  assert.deepEqual(gate.acceptedPrivateActContinuationDrainStatuses, [
    "PendingContinuation"
  ]);
  assert.deepEqual(gate.acceptedRendererBackedActDrainRenderers, [
    "fast-react-test-renderer"
  ]);
  assert.deepEqual(gate.acceptedRendererBackedActDrainSchedulerRecords, [
    "SchedulerActQueueRequest",
    "SchedulerActScopeBoundaryRecord",
    "SchedulerActContinuationRecord"
  ]);
  assert.deepEqual(gate.acceptedRendererBackedActDrainReconcilerRecords, [
    "SyncFlushActContinuationDrainRecord",
    "SyncFlushActPrivateExecutionDiagnosticsForCanary",
    "SyncFlushPostPassiveContinuationExecutionRecord",
    "PassiveEffectsFlushWithSyncFlushContinuationResult"
  ]);
  assert.deepEqual(gate.acceptedRendererBackedActDrainRendererRecords, [
    "FastReactTestRendererCurrentRustCanaryMetadata",
    "TestRendererHostOutputDiagnostics",
    "TestRendererCommittedFiberTreeInspection"
  ]);
  assert.deepEqual(gate.acceptedSchedulerPostTaskRootWorkRecordKinds, [
    "RootLaneSchedulingSnapshot",
    "RootTaskScheduleRecord"
  ]);
  assert.equal(
    gate.internalTestQueueKind,
    "fast-react.react.private-act-queue-test-queue"
  );
  assert.equal(
    gate.internalTestTaskKind,
    "fast-react.react.private-act-queue-test-task"
  );
  assert.equal(gate.internalTestQueueVersion, 1);

  let queuedTaskInvoked = false;
  const metadata = gate.createActQueueMetadata({
    queuedTasks: [
      function queuedActTaskMustNotRun() {
        queuedTaskInvoked = true;
      }
    ]
  });
  const dispatcher = {
    [gate.metadataSymbol]: metadata
  };

  assert.equal(gate.isAcceptedActQueueMetadata(metadata), true);
  assert.equal(gate.isPrivateActDispatcher(dispatcher), false);
  assert.equal(gate.getPrivateActQueueMetadata(dispatcher), null);
  assert.equal(gate.markPrivateActDispatcher(dispatcher), dispatcher);
  assert.equal(gate.isPrivateActDispatcher(dispatcher), true);
  assert.equal(gate.getPrivateActQueueMetadata(dispatcher), metadata);
  assert.equal(queuedTaskInvoked, false);
  assert.equal(metadata.privateTestQueueFlushDiagnosticsReady, true);
  assert.equal(metadata.drainsAcceptedInternalTestQueues, true);
  assert.equal(metadata.privateSyncFlushActExecutionDiagnosticsReady, true);
  assert.equal(metadata.committedHostOutputCanaryRequired, true);
  assert.equal(metadata.drainsAcceptedInternalActContinuationRecords, true);
  assert.equal(metadata.drainsPublicReactActQueue, false);
  assert.equal(metadata.schedulerPrivateContinuationDiagnosticsReady, true);
  assert.equal(metadata.consumesSchedulerPrivateContinuationDiagnostics, true);
  assert.equal(metadata.rendererBackedActDrainDiagnosticsReady, true);
  assert.equal(metadata.consumesRendererBackedActDrainDiagnostics, true);
  assert.equal(metadata.drainsAcceptedRendererBackedActDiagnostics, true);
  assert.equal(
    metadata.schedulerPostTaskYieldActRootHandoffDiagnosticsReady,
    true
  );
  assert.equal(
    metadata.consumesSchedulerPostTaskYieldActRootHandoffDiagnostics,
    true
  );
  assert.equal(metadata.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(metadata.publicReactActCompatibilityClaimed, false);
  assert.equal(metadata.executesRendererRoots, false);

  const testTask = gate.createInternalActQueueTestTask({
    label: "react-private-act-test-task",
    recordKind: "SchedulerActQueueRequest",
    taskKind: "SchedulerCallback",
    continuationStatus: "PendingContinuation"
  });
  assert.equal(gate.isAcceptedInternalActQueueTestTask(testTask), true);
  assert.deepEqual(
    {
      kind: testTask.kind,
      version: testTask.version,
      label: testTask.label,
      recordKind: testTask.recordKind,
      taskKind: testTask.taskKind,
      continuationStatus: testTask.continuationStatus,
      publicCompatibilityClaimed: testTask.publicCompatibilityClaimed,
      publicSchedulerTimingCompatibilityClaimed:
        testTask.publicSchedulerTimingCompatibilityClaimed,
      publicReactActCompatibilityClaimed:
        testTask.publicReactActCompatibilityClaimed,
      executesQueuedWork: testTask.executesQueuedWork,
      executesEffects: testTask.executesEffects
    },
    {
      kind: gate.internalTestTaskKind,
      version: 1,
      label: "react-private-act-test-task",
      recordKind: "SchedulerActQueueRequest",
      taskKind: "SchedulerCallback",
      continuationStatus: "PendingContinuation",
      publicCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      executesQueuedWork: false,
      executesEffects: false
    }
  );

  const testQueue = gate.createInternalActQueueTestQueue([
    testTask,
    "string-normalized-task"
  ]);
  assert.equal(gate.isAcceptedInternalActQueueTestQueue(testQueue), true);
  assert.equal(testQueue.kind, gate.internalTestQueueKind);
  assert.equal(testQueue.version, gate.internalTestQueueVersion);
  assert.equal(testQueue.queueFlushingReady, false);
  assert.equal(testQueue.privateTestQueueFlushDiagnosticsReady, true);
  assert.equal(testQueue.drainsAcceptedInternalTestQueues, true);
  assert.equal(testQueue.publicCompatibilityClaimed, false);
  assert.equal(testQueue.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(testQueue.publicReactActCompatibilityClaimed, false);
  assert.equal(testQueue.executesQueuedWork, false);
  assert.equal(testQueue.executesEffects, false);
  assert.deepEqual(
    testQueue.records.map((record) => record.label),
    ["react-private-act-test-task", "string-normalized-task"]
  );

  const Scheduler = loadFreshSchedulerMock("development");
  const diagnostics =
    Scheduler.unstable_flushAllWithoutAsserting[
      privateActQueueFlushDiagnosticsExport
    ];
  assert.equal(
    gate.isAcceptedSchedulerPrivateActQueueFlushDiagnostics(diagnostics),
    true
  );
  const consumeReport =
    gate.consumeSchedulerPrivateActContinuationDiagnostics(
      diagnostics,
      testQueue
    );
  assert.equal(
    consumeReport.status,
    gate.schedulerContinuationConsumptionStatus
  );
  assert.equal(consumeReport.accepted, true);
  assert.equal(
    consumeReport.schedulerDiagnosticsStatus,
    gate.schedulerDiagnosticsStatus
  );
  assert.equal(
    consumeReport.schedulerDiagnosticsExportName,
    privateActQueueFlushDiagnosticsExport
  );
  assert.equal(
    consumeReport.consumesSchedulerPrivateContinuationDiagnostics,
    true
  );
  assert.equal(consumeReport.drainsAcceptedInternalTestQueues, true);
  assert.equal(consumeReport.queueFlushingReady, false);
  assert.equal(consumeReport.continuationFlushingReady, false);
  assert.equal(consumeReport.publicCompatibilityClaimed, false);
  assert.equal(
    consumeReport.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(consumeReport.publicReactActCompatibilityClaimed, false);
  assert.equal(consumeReport.drainsPublicSchedulerTaskQueue, false);
  assert.equal(consumeReport.drainsPublicReactActQueue, false);
  assert.equal(consumeReport.executesQueuedWork, false);
  assert.equal(consumeReport.executesEffects, false);
  assert.equal(consumeReport.executesRendererRoots, false);
  assert.deepEqual(consumeReport.continuationSummary, {
    recordCount: 2,
    noContinuationCount: 1,
    pendingContinuationCount: 1,
    hasPendingContinuation: true,
    records: [
      {
        index: 0,
        label: "react-private-act-test-task",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "SchedulerCallback",
        continuationStatus: "PendingContinuation",
        executesQueuedWork: false,
        executesEffects: false
      },
      {
        index: 1,
        label: "string-normalized-task",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "SchedulerCallback",
        continuationStatus: "NoContinuation",
        executesQueuedWork: false,
        executesEffects: false
      }
    ]
  });
  assert.equal(consumeReport.schedulerDescription.accepted, true);
  assert.equal(consumeReport.schedulerDescription.pendingCount, 2);

  const drainReport = consumeReport.schedulerDrainReport;
  assert.equal(drainReport.status, "drained-accepted-internal-test-queue");
  assert.equal(drainReport.drainedCount, 2);
  assert.equal(drainReport.remainingCount, 0);
  assert.equal(drainReport.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(drainReport.publicReactActCompatibilityClaimed, false);
  assert.equal(drainReport.drainsPublicSchedulerTaskQueue, false);
  assert.equal(drainReport.drainsPublicReactActQueue, false);
  assert.equal(drainReport.executesQueuedWork, false);
  assert.equal(drainReport.executesEffects, false);
  assert.equal(testQueue.records.length, 0);

  const rendererBackedDiagnostics =
    gate.createRendererBackedActDrainDiagnostics();
  assert.equal(Object.isFrozen(rendererBackedDiagnostics), true);
  assert.equal(
    gate.isAcceptedRendererBackedActDrainDiagnostics(
      rendererBackedDiagnostics
    ),
    true
  );
  const rendererBackedReport =
    gate.consumeRendererBackedActDrainDiagnostics(
      rendererBackedDiagnostics
    );
  assert.equal(
    rendererBackedReport.status,
    gate.rendererBackedActDrainConsumptionStatus
  );
  assert.equal(rendererBackedReport.accepted, true);
  assert.equal(
    rendererBackedReport.rendererBackedActDrainDiagnosticsStatus,
    gate.rendererBackedActDrainDiagnosticsStatus
  );
  assert.equal(
    rendererBackedReport.rendererBackedActDrainDiagnosticKind,
    gate.rendererBackedActDrainDiagnosticKind
  );
  assert.equal(rendererBackedReport.renderer, "fast-react-test-renderer");
  assert.equal(
    rendererBackedReport.schedulerMetadataSource,
    "SchedulerBridge"
  );
  assert.equal(
    rendererBackedReport.reconcilerMetadataSource,
    "fast-react-reconciler"
  );
  assert.deepEqual(
    rendererBackedReport.acceptedSchedulerRecords,
    gate.acceptedRendererBackedActDrainSchedulerRecords
  );
  assert.deepEqual(
    rendererBackedReport.acceptedReconcilerRecords,
    gate.acceptedRendererBackedActDrainReconcilerRecords
  );
  assert.deepEqual(
    rendererBackedReport.acceptedRendererRecords,
    gate.acceptedRendererBackedActDrainRendererRecords
  );
  assert.deepEqual(rendererBackedReport.drainSummary, {
    pendingBefore: 1,
    drainedCount: 1,
    remainingCount: 0,
    drainedContinuationCount: 1,
    hostOutputCanaryCommitted: true,
    blockedByPendingPostPassiveGate: false
  });
  assert.equal(
    rendererBackedReport.consumesRendererBackedActDrainDiagnostics,
    true
  );
  assert.equal(
    rendererBackedReport.consumesSchedulerPrivateContinuationDiagnostics,
    true
  );
  assert.equal(
    rendererBackedReport.consumesReconcilerActDrainMetadata,
    true
  );
  assert.equal(
    rendererBackedReport.drainsAcceptedRendererBackedActDiagnostics,
    true
  );
  assert.equal(rendererBackedReport.queueFlushingReady, false);
  assert.equal(rendererBackedReport.rendererRootsReady, false);
  assert.equal(rendererBackedReport.passiveEffectsReady, false);
  assert.equal(rendererBackedReport.continuationFlushingReady, false);
  assert.equal(rendererBackedReport.publicCompatibilityClaimed, false);
  assert.equal(
    rendererBackedReport.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(rendererBackedReport.publicReactActCompatibilityClaimed, false);
  assert.equal(rendererBackedReport.drainsPublicSchedulerTaskQueue, false);
  assert.equal(rendererBackedReport.drainsPublicReactActQueue, false);
  assert.equal(rendererBackedReport.executesQueuedWork, false);
  assert.equal(rendererBackedReport.executesEffects, false);
  assert.equal(rendererBackedReport.executesRendererRoots, false);

  for (const rejectedRendererDiagnostics of [
    {
      diagnostics: {
        ...rendererBackedDiagnostics
      },
      reason: "renderer-backed-diagnostics"
    },
    {
      diagnostics: gate.createRendererBackedActDrainDiagnostics({
        acceptedReconcilerRecords: ["SyncFlushActContinuationDrainRecord"]
      }),
      reason: "renderer-backed-diagnostics"
    },
    {
      diagnostics: gate.createRendererBackedActDrainDiagnostics({
        publicReactActCompatibilityClaimed: true
      }),
      reason: "renderer-backed-diagnostics"
    },
    {
      diagnostics: gate.createRendererBackedActDrainDiagnostics({
        drainsPublicReactActQueue: true
      }),
      reason: "renderer-backed-diagnostics"
    },
    {
      diagnostics: gate.createRendererBackedActDrainDiagnostics({
        executesRendererRoots: true
      }),
      reason: "renderer-backed-diagnostics"
    }
  ]) {
    assert.equal(
      gate.isAcceptedRendererBackedActDrainDiagnostics(
        rejectedRendererDiagnostics.diagnostics
      ),
      false
    );
    assert.throws(
      () =>
        gate.consumeRendererBackedActDrainDiagnostics(
          rejectedRendererDiagnostics.diagnostics
        ),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react");
        assert.equal(
          error.exportName,
          `${privateActDispatcherGateExport}.consumeRendererBackedActDrainDiagnostics`
        );
        assert.equal(error.compatibilityTarget, "react@19.2.6");
        assert.equal(error.reason, rejectedRendererDiagnostics.reason);
        assert.equal(error.publicCompatibilityClaimed, false);
        assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
        assert.equal(error.publicReactActCompatibilityClaimed, false);
        return true;
      }
    );
  }

  const rejectedDiagnosticsQueue = gate.createInternalActQueueTestQueue([
    gate.createInternalActQueueTestTask("must-not-drain")
  ]);
  assert.equal(
    gate.isAcceptedSchedulerPrivateActQueueFlushDiagnostics({
      ...diagnostics
    }),
    false
  );
  assert.throws(
    () =>
      gate.consumeSchedulerPrivateActContinuationDiagnostics(
        {
          ...diagnostics
        },
        rejectedDiagnosticsQueue
      ),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, "react");
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.consumeSchedulerPrivateActContinuationDiagnostics`
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6");
      assert.equal(error.reason, "scheduler-diagnostics");
      assert.equal(error.publicCompatibilityClaimed, false);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      return true;
    }
  );
  assert.equal(rejectedDiagnosticsQueue.records.length, 1);

  const rejectedQueue = gate.createInternalActQueueTestQueue([
    gate.createInternalActQueueTestTask("accepted-before-tamper")
  ]);
  rejectedQueue.records.push({
    kind: gate.internalTestTaskKind,
    version: gate.internalTestQueueVersion,
    label: "unbranded-task",
    recordKind: "SchedulerActQueueRequest",
    taskKind: "SchedulerCallback",
    continuationStatus: "NoContinuation",
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  });
  assert.equal(gate.isAcceptedInternalActQueueTestQueue(rejectedQueue), false);
  assert.throws(
    () =>
      gate.consumeSchedulerPrivateActContinuationDiagnostics(
        diagnostics,
        rejectedQueue
      ),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, "react");
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.consumeSchedulerPrivateActContinuationDiagnostics`
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6");
      assert.equal(error.reason, "internal-act-queue");
      assert.equal(error.publicCompatibilityClaimed, false);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      return true;
    }
  );

  for (const rejectedMetadata of [
    gate.createActQueueMetadata({
      publicCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      queueFlushingReady: true
    }),
    gate.createActQueueMetadata({
      privateTestQueueFlushDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      privateSyncFlushActExecutionDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      drainsAcceptedInternalActContinuationRecords: false
    }),
    gate.createActQueueMetadata({
      drainsPublicReactActQueue: true
    }),
    gate.createActQueueMetadata({
      schedulerPrivateContinuationDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      consumesSchedulerPrivateContinuationDiagnostics: false
    }),
    gate.createActQueueMetadata({
      rendererBackedActDrainDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      consumesRendererBackedActDrainDiagnostics: false
    }),
    gate.createActQueueMetadata({
      drainsAcceptedRendererBackedActDiagnostics: false
    }),
    gate.createActQueueMetadata({
      schedulerPostTaskYieldActRootHandoffDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      consumesSchedulerPostTaskYieldActRootHandoffDiagnostics: false
    }),
    gate.createActQueueMetadata({
      publicSchedulerTimingCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      executesRendererRoots: true
    }),
    gate.createActQueueMetadata({
      passiveEffectsReady: true
    }),
    gate.createActQueueMetadata({
      continuationFlushingReady: true
    }),
    gate.createActQueueMetadata({
      acceptedRecords: ["SchedulerActQueueRequest"]
    })
  ]) {
    const rejectedDispatcher = {
      [gate.metadataSymbol]: rejectedMetadata
    };
    assert.equal(gate.isAcceptedActQueueMetadata(rejectedMetadata), false);
    assert.throws(
      () => gate.markPrivateActDispatcher(rejectedDispatcher),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react");
        assert.equal(
          error.exportName,
          `${privateActDispatcherGateExport}.markPrivateActDispatcher`
        );
        assert.equal(error.compatibilityTarget, "react@19.2.6");
        return true;
      }
    );
    assert.equal(gate.isPrivateActDispatcher(rejectedDispatcher), false);
  }
});

test("package-private React act dispatcher gate consumes Scheduler postTask scheduler.yield handoff diagnostics without root admission", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: "development",
    withYield: true
  });
  const diagnostics =
    report.delayedContinuationActRootHandoff.diagnosticsAfterFallback;
  const rootContinuationRow =
    createPrivatePostTaskRootContinuationMetadataRow(diagnostics);

  assert.equal(
    rootContinuationRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(rootContinuationRow.rejectionReason, "stale-continuation");
  assert.equal(rootContinuationRow.compatibilityClaimed, false);
  assert.equal(
    rootContinuationRow.blockedRootExecution.publicRootExecution,
    false
  );

  assert.equal(
    gate.isAcceptedSchedulerPostTaskYieldActRootHandoffDiagnostics(
      diagnostics
    ),
    true
  );

  const bridgeReport =
    gate.consumeSchedulerPostTaskYieldActRootHandoffDiagnostics(diagnostics);
  assert.equal(
    bridgeReport.status,
    gate.schedulerPostTaskYieldActRootHandoffConsumptionStatus
  );
  assert.equal(bridgeReport.accepted, true);
  assert.equal(
    bridgeReport.schedulerDiagnosticsExportName,
    "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__"
  );
  assert.equal(
    bridgeReport.schedulerDiagnosticsSymbolDescription,
    "fast-react.scheduler.unstable_post_task.priority-diagnostics"
  );
  assert.equal(bridgeReport.selectedFallback, "scheduler.yield");
  assert.equal(bridgeReport.schedulerYieldAvailable, true);
  assert.equal(bridgeReport.controlledTaskSchedulingApiShim, true);
  assert.equal(bridgeReport.callbackRunCountAtSchedule, 1);
  assert.equal(bridgeReport.currentCallbackRunCount, 2);
  assert.equal(bridgeReport.controlledYieldThenContinuationAlreadyRan, true);
  assert.equal(bridgeReport.staleContinuationEvidenceRejected, true);
  assert.equal(
    bridgeReport.staleContinuationRejectionReason,
    "stale-continuation"
  );
  assert.equal(bridgeReport.rootContinuationExecutionAdmitted, false);
  assert.equal(bridgeReport.rootSchedulingAdmitted, false);
  assert.equal(bridgeReport.rootWorkMetadataOnly, true);
  assert.equal(bridgeReport.actQueueHandoffOnly, true);
  assert.equal(bridgeReport.rendererWorkExecutionBlocked, true);
  assert.deepEqual(bridgeReport.rootWorkRecordKinds, [
    "RootLaneSchedulingSnapshot",
    "RootTaskScheduleRecord"
  ]);
  assert.equal(bridgeReport.priorityLevel, 4);
  assert.equal(bridgeReport.schedulerPriorityName, "unstable_LowPriority");
  assert.equal(bridgeReport.postTaskPriority, "user-visible");
  assert.equal(bridgeReport.timeoutMs, 10000);
  assert.equal(bridgeReport.timeoutReason, "low-priority-timeout");
  assert.equal(bridgeReport.sourceCallbackDidTimeout, false);
  assert.equal(bridgeReport.queueFlushingReady, false);
  assert.equal(bridgeReport.rendererRootsReady, false);
  assert.equal(bridgeReport.passiveEffectsReady, false);
  assert.equal(bridgeReport.continuationFlushingReady, false);
  assert.equal(bridgeReport.publicCompatibilityClaimed, false);
  assert.equal(bridgeReport.browserPostTaskCompatibilityClaimed, false);
  assert.equal(bridgeReport.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(
    bridgeReport.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(bridgeReport.publicReactActCompatibilityClaimed, false);
  assert.equal(bridgeReport.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(bridgeReport.publicRendererCompatibilityClaimed, false);
  assert.equal(bridgeReport.drainsPublicSchedulerTaskQueue, false);
  assert.equal(bridgeReport.drainsPublicReactActQueue, false);
  assert.equal(bridgeReport.executesQueuedWork, false);
  assert.equal(bridgeReport.executesEffects, false);
  assert.equal(bridgeReport.executesRendererWork, false);
  assert.equal(bridgeReport.executesRendererRoots, false);
  assert.equal(bridgeReport.packageCompatibilityClaimed, false);

  const postTaskFallbackDiagnostics =
    inspectSchedulerPostTaskPriorityDiagnostics({
      nodeEnv: "development",
      withYield: false
    }).delayedContinuationActRootHandoff.diagnosticsAfterFallback;

  for (const mutablePath of [
    ["priorityMapping"],
    ["priorityTimeout"],
    ["schedule", "delay"],
    ["callbackRuns"],
    ["callbackRuns", "0"],
    ["continuationFallbacks", "0", "continuationMetadata"],
    [
      "rootContinuationExecutionRoute",
      "privateRootContinuationExecution"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "priorityTimeout"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "actQueueHandoff"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "actQueueHandoff",
      "priorityTimeout"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "rootWorkRecords"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "rootWorkRecords",
      "0"
    ],
    [
      "rootContinuationExecutionRoute",
      "actRootWorkHandoff",
      "rootWorkRecords",
      "0",
      "priorityTimeout"
    ]
  ]) {
    assertSchedulerPostTaskYieldHandoffRejected(
      gate,
      deepFreezeDiagnosticCloneExcept(diagnostics, mutablePath),
      "mutable-private-post-task-diagnostics"
    );
  }

  for (const rejected of [
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.version = 2;
      }),
      reason: "private-post-task-diagnostics-shape"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        delete clone.rootContinuationExecutionRoute.actRootWorkHandoff
          .handoffKind;
      }),
      reason: "private-post-task-handoff-shape"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.actRootWorkHandoff.priorityTimeout.timeoutMs =
          1;
      }),
      reason: "private-post-task-handoff-shape"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.actRootWorkHandoff.actQueueHandoff.priorityTimeout.timeoutMs =
          1;
      }),
      reason: "private-post-task-handoff-shape"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.actRootWorkHandoff.rootWorkRecords[0].priorityTimeout.timeoutMs =
          1;
      }),
      reason: "private-post-task-handoff-shape"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.callbackRuns[0].returnedContinuationType = "undefined";
      }),
      reason: "ambiguous-post-task-report"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.publicSchedulerTimingCompatibilityClaimed = true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.packageCompatibilityClaimed = true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.environmentCapabilities.browserPostTaskCompatibilityClaimed =
          true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.actRootWorkHandoff.publicReactActCompatibilityClaimed =
          true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.privateRootContinuationExecution.publicRootExecution =
          true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.actRootWorkHandoff.rootWorkRecords[0].executesRendererWork =
          true;
      }),
      reason: "public-or-execution-claim"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.rootContinuationExecutionRoute.continuationIndex = 1;
      }),
      reason: "stale-continuation-evidence"
    },
    {
      diagnostics: deepFreezeDiagnosticClone(diagnostics, (clone) => {
        clone.continuationFallbacks.push({
          ...clone.continuationFallbacks[0]
        });
      }),
      reason: "ambiguous-post-task-report"
    },
    {
      diagnostics: postTaskFallbackDiagnostics,
      reason: "scheduler-yield-not-selected"
    }
  ]) {
    assertSchedulerPostTaskYieldHandoffRejected(
      gate,
      rejected.diagnostics,
      rejected.reason
    );
  }
});

test("React DOM test-utils act private routing gate tracks React act metadata without opening public act", () => {
  const reactGate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  const domGateModule = loadFreshWorkspaceModule(
    reactDomTestUtilsActPrivateRoutingGateModule
  );
  const domGate =
    domGateModule.evaluateReactDomTestUtilsActPrivateRoutingGate();

  assert.equal(domGate.reactActPrivateDispatcher.status, reactGate.status);
  assert.deepEqual(
    domGate.reactActPrivateDispatcher.requiredRecords,
    reactGate.requiredRecords
  );
  assert.deepEqual(
    domGate.reactActPrivateDispatcher.requiredTaskKinds,
    reactGate.requiredTaskKinds
  );
  assert.deepEqual(
    domGate.reactActPrivateDispatcher.requiredContinuationStatuses,
    reactGate.requiredContinuationStatuses
  );
  assert.equal(
    domGate.reactActPrivateDispatcher.queueFlushingReady,
    reactGate.queueFlushingReady
  );
  assert.equal(
    domGate.reactActPrivateDispatcher.rendererRootsReady,
    reactGate.rendererRootsReady
  );
  assert.equal(
    domGate.reactActPrivateDispatcher.passiveEffectsReady,
    reactGate.passiveEffectsReady
  );
  assert.equal(
    domGate.reactActPrivateDispatcher.continuationFlushingReady,
    reactGate.continuationFlushingReady
  );
  assert.equal(domGate.reactActPrivateDispatcher.executesQueuedWork, false);
  assert.equal(domGate.reactActPrivateDispatcher.executesEffects, false);
  assert.deepEqual(domGate.acceptedPrivatePrerequisiteIds, [
    "react-act-private-dispatcher-gate",
    "scheduler-act-queue-routing-records",
    "scheduler-mock-flush-helper-metadata",
    "sync-flush-act-continuation-records",
    "sync-flush-post-passive-continuation-execution-gate",
    "sync-flush-nested-act-root-continuation-evidence",
    "sync-flush-root-scheduler-finished-work-handoff-evidence",
    "passive-effects-flush-metadata",
    "passive-effect-callback-handle-metadata",
    "passive-effects-committed-fiber-traversal",
    "passive-effects-scheduler-flush-diagnostic",
    "passive-effect-mount-unmount-execution-diagnostics",
    "passive-effect-root-error-routing-diagnostics",
    "react-dom-private-root-bridge-records",
    "react-dom-private-flush-sync-root-output-diagnostic",
    "react-dom-private-root-warning-boundary-diagnostics",
    "react-dom-private-flush-sync-guard"
  ]);
  assert.deepEqual(domGate.blockedPublicPrerequisiteIds, [
    "public-react-act-delegation",
    "act-queue-flushing-execution",
    "passive-effect-callback-execution",
    "public-react-dom-root-execution",
    "public-react-dom-flush-sync-execution",
    "public-react-dom-warning-boundary-compatibility"
  ]);
  assert.equal(domGate.privatePrerequisitesPresent, true);
  assert.equal(domGate.privateRoutingReady, false);
  assert.equal(domGate.publicReactActReady, false);
  assert.equal(domGate.publicTestUtilsActReady, false);
  assert.equal(domGate.publicCompatibilityClaimed, false);
  assert.deepEqual(domGate.violations, []);

  const React = loadFreshWorkspaceModule(publicReactEntrypoints[0]);
  let publicActCallbackInvoked = false;
  const publicActError = captureThrown(() =>
    React.act(() => {
      publicActCallbackInvoked = true;
    })
  );
  assertReactActPlaceholderError(publicActError);
  assert.equal(publicActCallbackInvoked, false);

  const openedGate =
    domGateModule.evaluateReactDomTestUtilsActPrivateRoutingGate({
      publicReactActReady: true,
      publicTestUtilsActReady: true
    });
  assert.deepEqual(
    openedGate.violations.map((violation) => violation.id),
    ["public-act-routing-opened-before-prerequisites"]
  );
});

test("React.act oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_ACT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_ACT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "React.act export",
    "Synchronous callback behavior",
    "Asynchronous callback behavior",
    "Unawaited async act warning",
    "Thrown and rejected errors",
    "Thenable handling"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_ACT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_ACT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures public act availability by condition and mode", () => {
  const developmentExport = operationValue(
    "default-node-development",
    "react-act-export-shape"
  );
  assert.equal(developmentExport.availability.status, "available");
  assert.equal(developmentExport.availability.hasOwn, true);
  assert.equal(developmentExport.availability.exportKeysInclude, true);
  assert.deepEqual(dataDescriptorFields(developmentExport.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(developmentExport.descriptor.value, {
    type: "function",
    name: "",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(developmentExport.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);

  for (const modeId of [
    "default-node-production",
    "react-server-development",
    "react-server-production"
  ]) {
    const exportShape = operationValue(modeId, "react-act-export-shape");
    assert.equal(exportShape.availability.status, "unavailable", modeId);
    assert.equal(exportShape.availability.hasOwn, false, modeId);
    assert.equal(exportShape.availability.exportKeysInclude, false, modeId);
    assert.equal(exportShape.descriptor, null, modeId);

    const syncCall = operationValue(modeId, "react-act-sync-callback-behavior");
    assert.equal(syncCall.callAttempt.status, "throws", modeId);
    assert.equal(syncCall.callAttempt.error.name, "TypeError", modeId);
    assert.equal(
      syncCall.callAttempt.error.message,
      "React.act is not a function",
      modeId
    );
  }
});

test("React oracle captures rootless sync and async act callback behavior", () => {
  const sync = operationValue(
    "default-node-development",
    "react-act-sync-callback-behavior"
  );
  assert.deepEqual(
    sync.events.map((event) => event.phase),
    ["callback", "after-act-call", "after-await"]
  );
  assert.deepEqual(sync.events[0].thisValue, { type: "undefined" });
  assert.equal(sync.events[0].argCount, 0);
  assert.deepEqual(sync.awaitedValue, {
    type: "string",
    value: "sync-return"
  });
  assertActReturnThenableShape(sync.returnShape);
  assertActReturnThenableShape(sync.unawaitedSyncReturnShape);
  assert.deepEqual(sync.unawaitedSyncConsoleCalls, []);

  const asyncAct = operationValue(
    "default-node-development",
    "react-act-async-callback-behavior"
  );
  assert.deepEqual(
    asyncAct.events.map((event) => event.phase),
    [
      "callback-start",
      "after-act-call",
      "callback-after-microtask",
      "after-await"
    ]
  );
  assert.deepEqual(asyncAct.awaitedValue, {
    type: "string",
    value: "async-return"
  });
  assertActReturnThenableShape(asyncAct.returnShape);
  assert.deepEqual(asyncAct.consoleCallsDuringScenario, []);
});

test("React oracle captures unawaited async act warning and error propagation", () => {
  const unawaited = operationValue(
    "default-node-development",
    "react-act-unawaited-async-warning"
  );
  assertActReturnThenableShape(unawaited.firstReturnShape);
  assertActReturnThenableShape(unawaited.secondReturnShape);
  assert.equal(unawaited.consoleCallsAfterFirst.length, 1);
  assert.equal(unawaited.consoleCallsAfterSecond.length, 1);
  assert.match(
    unawaited.consoleCallsAfterFirst[0].args[0].value,
    /without await/u
  );

  const errors = operationValue(
    "default-node-development",
    "react-act-error-propagation"
  );
  assert.equal(errors.syncThrow.status, "throws");
  assert.equal(errors.syncThrow.error.name, "Error");
  assert.equal(errors.syncThrow.error.message, "sync act failure");
  assert.equal(errors.afterSyncThrow.status, "ok");
  assert.deepEqual(errors.afterSyncThrow.value, {
    type: "string",
    value: "after-sync-throw"
  });
  assert.equal(errors.asyncReject.status, "throws");
  assert.equal(errors.asyncReject.error.name, "TypeError");
  assert.equal(errors.asyncReject.error.message, "async act rejection");
  assert.equal(errors.customThenableReject.status, "throws");
  assert.equal(errors.customThenableReject.error.name, "RangeError");
  assert.equal(
    errors.customThenableReject.error.message,
    "custom act thenable rejection"
  );
});

test("React oracle captures deterministic thenable handling", () => {
  const thenables = operationValue(
    "default-node-development",
    "react-act-thenable-handling"
  );

  assertActReturnThenableShape(thenables.customThenable.actReturnShape);
  assert.deepEqual(thenables.customThenable.thenCalls, [
    {
      thisMatchesThenable: true,
      resolveType: "function",
      rejectType: "function"
    }
  ]);
  assert.deepEqual(thenables.customThenable.resolution.settlement, {
    status: "fulfilled",
    value: {
      type: "string",
      value: "custom-thenable-resolution"
    }
  });

  assertActReturnThenableShape(thenables.nonCallableThenObject.actReturnShape);
  assert.equal(
    thenables.nonCallableThenObject.resolution.settlement.status,
    "fulfilled"
  );
  assert.equal(
    thenables.nonCallableThenObject.resolution.settlement.value.sameObject,
    true
  );
  assert.deepEqual(
    thenables.nonCallableThenObject.resolution.settlement.value.value.properties,
    {
      label: {
        type: "string",
        value: "non-callable-then"
      },
      then: {
        type: "string",
        value: "not-a-function"
      }
    }
  );

  assertActReturnThenableShape(thenables.functionWithThenProperty.actReturnShape);
  assert.equal(
    thenables.functionWithThenProperty.resolution.settlement.status,
    "fulfilled"
  );
  assert.deepEqual(thenables.functionWithThenProperty.resolution.settlement.value, {
    value: {
      type: "function",
      name: "functionWithThenProperty",
      length: 0,
      isReactWarning: false
    },
    sameFunction: true
  });
});

test("Fast React public act observations are unsupported or known mismatch evidence only", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 2,
    "matched-but-compatibility-not-claimed": 12,
    "unsupported-placeholder": 10
  });

  assert.deepEqual(
    countFastReactComparisonStatuses(
      oracle.fastReactComparisons["default-node-development"]
    ),
    {
      "known-mismatch": 1,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 5
    }
  );
  assert.deepEqual(
    countFastReactComparisonStatuses(
      oracle.fastReactComparisons["default-node-production"]
    ),
    {
      "known-mismatch": 1,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 5
    }
  );

  for (const modeId of ["react-server-development", "react-server-production"]) {
    assert.deepEqual(
      countFastReactComparisonStatuses(oracle.fastReactComparisons[modeId]),
      {
        "known-mismatch": 0,
        "matched-but-compatibility-not-claimed": 6,
        "unsupported-placeholder": 0
      },
      modeId
    );
  }

  for (const comparison of Object.values(oracle.fastReactComparisons).flat()) {
    assert.equal(comparison.compatibilityClaimed, false);
  }
});

test("React.act oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactActOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-act-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-react-act-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-act-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedReactActOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactActOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findReactActObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findReactActObservation(
    oracle,
    modeId,
    oracle.fastReactTarget.packageName,
    scenarioId
  );
}

function operationValue(modeId, scenarioId) {
  const operation = reactObservation(modeId, scenarioId).result.result;
  assert.equal(operation.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return operation.value;
}

function assertActReturnThenableShape(thenableShape) {
  assert.equal(thenableShape.summary.type, "object");
  assert.deepEqual(thenableShape.object.objectKeys, ["then"]);
  assert.deepEqual(keyValues(thenableShape.object.ownKeys), ["then"]);
  assert.deepEqual(dataDescriptorFields(thenableShape.thenDescriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(thenableShape.thenDescriptor.value, {
    type: "function",
    name: "then",
    length: 2,
    isReactWarning: false
  });
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function keyValues(keys) {
  return keys.map((key) =>
    key.type === "symbol" ? key.stringValue : key.value
  );
}

function countFastReactComparisonStatuses(comparisons) {
  return comparisons.reduce(
    (counts, comparison) => {
      counts[comparison.status] += 1;
      return counts;
    },
    {
      "known-mismatch": 0,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 0
    }
  );
}

function deepFreezeDiagnosticClone(value, mutate) {
  const clone = JSON.parse(JSON.stringify(value));
  if (typeof mutate === "function") {
    mutate(clone);
  }
  return deepFreeze(clone);
}

function deepFreezeDiagnosticCloneExcept(value, mutablePath) {
  const clone = JSON.parse(JSON.stringify(value));
  return deepFreezeExceptPath(clone, mutablePath.map(String));
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }

  return Object.freeze(value);
}

function deepFreezeExceptPath(value, mutablePath, currentPath = []) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  for (const key of Object.keys(value)) {
    deepFreezeExceptPath(value[key], mutablePath, currentPath.concat(key));
  }

  if (!isSamePath(currentPath, mutablePath)) {
    Object.freeze(value);
  }

  return value;
}

function isSamePath(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((segment, index) => segment === right[index]);
}

function assertSchedulerPostTaskYieldHandoffRejected(
  gate,
  diagnostics,
  reason
) {
  assert.equal(
    gate.isAcceptedSchedulerPostTaskYieldActRootHandoffDiagnostics(
      diagnostics
    ),
    false
  );
  assert.throws(
    () =>
      gate.consumeSchedulerPostTaskYieldActRootHandoffDiagnostics(
        diagnostics
      ),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, "react");
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.consumeSchedulerPostTaskYieldActRootHandoffDiagnostics`
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6");
      assert.equal(error.reason, reason);
      assert.equal(error.publicCompatibilityClaimed, false);
      assert.equal(error.browserPostTaskCompatibilityClaimed, false);
      assert.equal(error.browserTaskOrderingCompatibilityClaimed, false);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false);
      assert.equal(error.publicRendererCompatibilityClaimed, false);
      return true;
    }
  );
}

function loadFreshWorkspaceModule(relativeModulePath) {
  const modulePath = path.join(repoRoot, relativeModulePath);
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;

  for (const relativeModulePath of schedulerMockWorkspaceEntrypoints) {
    const resolved = require.resolve(path.join(repoRoot, relativeModulePath));
    delete require.cache[resolved];
  }

  process.env.NODE_ENV = nodeEnv;
  try {
    return require(path.join(repoRoot, schedulerMockWorkspaceEntrypoint));
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function captureThrown(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  assert.fail("Expected operation to throw");
}

function assertReactActPlaceholderError(error) {
  assert.equal(error.name, "FastReactUnimplementedError");
  assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(error.entrypoint, "react");
  assert.equal(error.exportName, "act");
  assert.equal(error.compatibilityTarget, "react@19.2.6");
}

function assertReactHookDispatcherGuardUnchanged(React, label) {
  const useRefError = captureThrown(() => React.useRef(null));
  assert.equal(useRefError.name, "Error", `${label}.useRef error name`);
  assert.equal(
    useRefError.code,
    "FAST_REACT_INVALID_HOOK_CALL",
    `${label}.useRef code`
  );

  const useStateError = captureThrown(() => React.useState(null));
  assert.equal(
    useStateError.name,
    "Error",
    `${label}.useState error name`
  );
  assert.equal(
    useStateError.code,
    "FAST_REACT_INVALID_HOOK_CALL",
    `${label}.useState code`
  );
}
