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
const CommonJsModule = require("node:module");
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
const {
  createReactDomLifecycleBoundaryOptions,
  createSourceOwnedReactDomLifecycleBoundary
} = require(
  path.join(
    repoRoot,
    "tests/conformance/src/react-dom-source-owned-lifecycle-boundary.cjs"
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
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind =
  "fast-react.scheduler.mock-expired-act-root-work-source-validator-module-record";
const privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey =
  Symbol.for(
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind
  );
const privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKind =
  "fast-react.scheduler.mock-expired-act-root-work-source-validator-global-record";
const privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKey =
  Symbol.for(
    privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKind
  );
const privateSchedulerMockDelayedActRootWorkDiagnosticsKind =
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics";
const privateSchedulerMockDelayedActRootWorkDiagnosticsBrand = Symbol.for(
  privateSchedulerMockDelayedActRootWorkDiagnosticsKind
);
const privateSchedulerMockDelayedRendererRootWorkMetadataKind =
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata";
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

installPreinstalledFakeSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecord();

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
  assert.equal(gate.localChecks.reactDomClientRootPlaceholder, false);
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

test("public React.act currentness gate stays fail-closed for rootless behavior", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  const report = gate.createPublicReactActBlockedCurrentnessReport();

  assert.equal(
    gate.isAcceptedPublicReactActBlockedCurrentnessReport(report),
    true
  );
  assert.equal(
    report.status,
    gate.publicReactActBlockedCurrentnessStatus
  );
  assert.deepEqual(report.scenarioIds, [
    "rootless-sync-callback",
    "rootless-async-callback",
    "rootless-error-callback",
    "rootless-thenable-callback"
  ]);
  assert.deepEqual(report.acceptedBackgroundWorkerIds, [
    "worker-857-react-dom-act-passive-consumer",
    "worker-885-react-act-lifecycle-boundary-gate"
  ]);
  assert.deepEqual(report.excludedWorkerIds, [
    "worker-902-react-test-renderer-private-act-lifecycle"
  ]);
  assert.deepEqual(report.reactServerAct, {
    hasOwn: false,
    exportKeysInclude: false,
    value: {
      type: "undefined"
    }
  });

  const consumption =
    gate.consumePublicReactActBlockedCurrentnessReport(report);
  assert.equal(
    consumption.status,
    gate.publicReactActBlockedCurrentnessConsumptionStatus
  );
  assert.equal(consumption.publicActUnsupportedPlaceholder, true);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.thenableReturnBlocked, true);
  assert.equal(consumption.reactServerActExportBlocked, true);
  assert.equal(consumption.publicWarningCompatibilityClaimed, false);
  assert.equal(consumption.publicActWarningCompatibilityClaimed, false);
  assert.equal(consumption.queueFlushingReady, false);
  assert.equal(consumption.rendererRootsReady, false);
  assert.equal(consumption.passiveEffectsReady, false);
  assert.equal(consumption.continuationFlushingReady, false);
  assert.equal(consumption.drainsPublicReactActQueue, false);
  assert.equal(consumption.publicActPassiveDrain, false);
  assert.equal(consumption.publicEffectExecution, false);
  assert.equal(consumption.publicRootExecution, false);
  assert.equal(consumption.executesRendererRoots, false);
  assert.equal(
    consumption.privatePrerequisites
      .schedulerDrivenPassiveEffectDiagnosticsReady,
    true
  );
  assert.equal(
    consumption.privatePrerequisites
      .requiresSourceOwnedActiveLifecycleRequestBoundary,
    true
  );
  assert.equal(
    consumption.privatePrerequisites.consumesWorker902Evidence,
    false
  );

  for (const scenario of report.scenarios) {
    assert.equal(scenario.rootless, true, scenario.scenarioId);
    assert.equal(scenario.callbackInvoked, false, scenario.scenarioId);
    assert.equal(scenario.returnedThenable, false, scenario.scenarioId);
    assert.deepEqual(scenario.consoleCalls, [], scenario.scenarioId);
    assert.equal(
      scenario.publicWarningCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(scenario.callAttempt.status, "throws", scenario.scenarioId);
    assert.deepEqual(scenario.callAttempt.error, {
      name: "FastReactUnimplementedError",
      code: "FAST_REACT_UNIMPLEMENTED",
      entrypoint: "react",
      exportName: "act",
      compatibilityTarget: "react@19.2.6"
    });
  }

  assertPublicReactActCurrentnessRejected(
    gate,
    Object.freeze({
      ...report
    }),
    "public-react-act-currentness-source-proof"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    {
      ...report
    },
    "public-react-act-currentness-source-proof"
  );
  const hostileForgedCurrentnessReport =
    createHostilePublicReactActCurrentnessProxy();
  assertPublicReactActCurrentnessRejected(
    gate,
    hostileForgedCurrentnessReport.proxy,
    "public-react-act-currentness-source-proof"
  );
  assert.equal(hostileForgedCurrentnessReport.getTrapCount(), 0);
  const mutableReport =
    createPublicReactActCurrentnessReportWithFreezeBypass(gate);
  assert.equal(Object.isFrozen(mutableReport), false);
  assertPublicReactActCurrentnessRejected(
    gate,
    mutableReport,
    "public-react-act-currentness-not-frozen"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      publicReactActCompatibilityClaimed: true
    }),
    "public-react-act-currentness-public-claim"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      scenarios: replacePublicReactActCurrentnessScenario(report, 0, {
        callbackInvoked: true
      })
    }),
    "public-react-act-currentness-callback-invoked"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      scenarios: replacePublicReactActCurrentnessScenario(report, 3, {
        callAttempt: {
          status: "ok",
          value: {
            type: "object",
            thenable: true
          }
        },
        returnedThenable: true
      })
    }),
    "public-react-act-currentness-thenable-returned"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      queueFlushingReady: true
    }),
    "public-react-act-currentness-prerequisite-smuggling"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        consumesWorker902Evidence: true
      }
    }),
    "public-react-act-currentness-private-prerequisite-boundary"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      publicWarningCompatibilityClaimed: true
    }),
    "public-react-act-currentness-warning-compatibility-claim"
  );
  assertPublicReactActCurrentnessRejected(
    gate,
    gate.createPublicReactActBlockedCurrentnessReport({
      reactServerAct: {
        hasOwn: true,
        exportKeysInclude: true,
        value: {
          type: "function",
          name: "act",
          length: 1,
          thenable: false
        }
      }
    }),
    "public-react-act-currentness-react-server-act-export"
  );
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
  assert.equal(
    gate.schedulerMockExpiredActRootWorkDiagnosticsStatus,
    "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics"
  );
  assert.equal(
    gate.schedulerMockExpiredActRootWorkConsumptionStatus,
    "consumed-accepted-scheduler-mock-expired-act-root-work-diagnostics"
  );
  assert.equal(
    gate.schedulerMockDelayedActRootWorkDiagnosticsStatus,
    "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics"
  );
  assert.equal(
    gate.schedulerMockDelayedActRootWorkPreflightStatus,
    "preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics"
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
  assert.equal(gate.schedulerMockExpiredActRootWorkDiagnosticsReady, true);
  assert.equal(
    gate.consumesSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    gate.schedulerMockExpiredActRootWorkDiagnosticKind,
    privateSchedulerMockExpiredActRootWorkDiagnosticsKind
  );
  assert.equal(gate.schedulerMockExpiredActRootWorkDiagnosticVersion, 1);
  assert.equal(
    gate.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(gate.schedulerMockDelayedActRootWorkDiagnosticsReady, true);
  assert.equal(
    gate.preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    gate.schedulerMockDelayedActRootWorkDiagnosticKind,
    privateSchedulerMockDelayedActRootWorkDiagnosticsKind
  );
  assert.equal(gate.schedulerMockDelayedActRootWorkDiagnosticVersion, 1);
  assert.equal(
    gate.acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics,
    true
  );
  assert.deepEqual(
    gate.acceptedSchedulerMockExpiredActRootWorkRecords,
    acceptedSchedulerMockExpiredActRootWorkRecords
  );
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
  assert.equal(metadata.schedulerMockExpiredActRootWorkDiagnosticsReady, true);
  assert.equal(
    metadata.consumesSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(
    metadata.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics,
    true
  );
  assert.equal(metadata.schedulerMockDelayedActRootWorkDiagnosticsReady, true);
  assert.equal(
    metadata.preflightsSchedulerMockDelayedActRootWorkDiagnostics,
    true
  );
  assert.equal(
    metadata.acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics,
    true
  );
  assert.equal(metadata.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(metadata.publicReactActCompatibilityClaimed, false);
  assert.equal(metadata.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(metadata.publicRendererCompatibilityClaimed, false);
  assert.equal(metadata.executesRendererWork, false);
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
      schedulerMockExpiredActRootWorkDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      consumesSchedulerMockExpiredActRootWorkDiagnostics: false
    }),
    gate.createActQueueMetadata({
      drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: false
    }),
    gate.createActQueueMetadata({
      schedulerMockDelayedActRootWorkDiagnosticsReady: false
    }),
    gate.createActQueueMetadata({
      preflightsSchedulerMockDelayedActRootWorkDiagnostics: false
    }),
    gate.createActQueueMetadata({
      schedulerMockDelayedActRootWorkDiagnosticKind:
        "forged-delayed-act-root-work-diagnostics"
    }),
    gate.createActQueueMetadata({
      schedulerMockDelayedActRootWorkDiagnosticVersion: 2
    }),
    gate.createActQueueMetadata({
      acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
        false
    }),
    gate.createActQueueMetadata({
      publicSchedulerTimingCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      publicSchedulerFlushHelperCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      packageCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      publicRootSchedulerCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      publicRendererCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      executesRendererWork: true
    }),
    gate.createActQueueMetadata({
      executesRendererRoots: true
    }),
    gate.createActQueueMetadata({
      invokesPublicSchedulerFlushHelper: true
    }),
    gate.createActQueueMetadata({
      publicSchedulerFlushBehaviorExecuted: true
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

test("package-private React act gate consumes Scheduler mock expired act/root diagnostics only", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics =
      Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];

    Scheduler.reset();
    const events = [];
    const createCallback = (label, continuation = null) =>
      gate.createInternalActQueueTestCallback(
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
    const actQueue = gate.createInternalActQueueTestQueue([
      gate.createInternalActQueueTestTask({
        label: "act-root-schedule",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "RootSchedule",
        continuationStatus: "NoContinuation",
        callback: createCallback("act-root-schedule")
      }),
      gate.createInternalActQueueTestTask({
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
        rootWorkRecords: acceptedSchedulerMockExpiredActRootWorkRecords.map(
          (recordKind) => createAcceptedExpiredActRootWorkRecord(recordKind)
        )
      }
    );

    Scheduler.unstable_advanceTime(251);
    const report = Scheduler.unstable_flushExpired(metadata);

    assert.equal(
      report[privateSchedulerMockExpiredActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(report), true, nodeEnv);
    assert.equal(report.kind, privateSchedulerMockExpiredActRootWorkDiagnosticsKind);
    assert.equal(report.version, 1, nodeEnv);

    const assertRejectedDiagnostics = (
      rejectedDiagnostics,
      reason,
      label = reason
    ) => {
      assert.equal(
        gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
          rejectedDiagnostics
        ),
        false,
        `${nodeEnv}:${label}`
      );
      assert.throws(
        () =>
          gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(
            rejectedDiagnostics
          ),
        (error) => {
          assert.equal(error.name, "FastReactUnimplementedError");
          assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
          assert.equal(error.entrypoint, "react");
          assert.equal(
            error.exportName,
            `${privateActDispatcherGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`
          );
          assert.equal(error.compatibilityTarget, "react@19.2.6");
          assert.equal(error.reason, reason);
          assert.equal(error.publicCompatibilityClaimed, false);
          assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
          assert.equal(error.publicReactActCompatibilityClaimed, false);
          assert.equal(error.publicRootSchedulerCompatibilityClaimed, false);
          assert.equal(error.publicRendererCompatibilityClaimed, false);
          assert.equal(error.drainsPublicSchedulerTaskQueue, false);
          assert.equal(error.drainsPublicReactActQueue, false);
          assert.equal(error.executesQueuedWork, false);
          assert.equal(error.executesEffects, false);
          assert.equal(error.executesRendererWork, false);
          assert.equal(error.executesRendererRoots, false);
          return true;
        },
        `${nodeEnv}:${label}`
      );
    };

    for (const helperName of [
      "unstable_flushAll",
      "unstable_flushAllWithoutAsserting",
      "unstable_flushExpired",
      "unstable_flushNumberOfYields",
      "unstable_flushUntilNextPaint"
    ]) {
      assertSchedulerFlushHelperRejectsFakeValidatorMutation(
        Scheduler,
        gate,
        report,
        helperName,
        `${nodeEnv}:${helperName}`
      );
    }

    for (const { diagnostics: rejectedDiagnostics, reason, label } of [
      {
        label: "fake-validator-mutated-flush-expired-top-level-clone",
        diagnostics: cloneExpiredActRootWorkReport(report),
        reason: "scheduler-expired-act-root-diagnostics-source-proof"
      },
      {
        label: "old-global-forged-top-level-clone",
        diagnostics: cloneExpiredActRootWorkReport(report, {}, {
          withOldGlobalSourceProof: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-source-proof"
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
        label: "clone-first-consumed-records-array",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            {
              consumedRecords: Object.freeze([
                ...report.rootWorkRecordConsumptionReport.consumedRecords
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        label: "clone-first-consumed-record-object",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            {
              consumedRecords: Object.freeze([
                cloneFrozenObject(
                  report.rootWorkRecordConsumptionReport.consumedRecords[0]
                ),
                ...report.rootWorkRecordConsumptionReport.consumedRecords.slice(
                  1
                )
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        label: "clone-first-drained-records-array",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(
            report.actQueueDrainReport,
            {
              drainedRecords: Object.freeze([
                ...report.actQueueDrainReport.drainedRecords
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        label: "clone-first-drained-record-object",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(
            report.actQueueDrainReport,
            {
              drainedRecords: Object.freeze([
                cloneFrozenObject(report.actQueueDrainReport.drainedRecords[0]),
                ...report.actQueueDrainReport.drainedRecords.slice(1)
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        label: "clone-first-source-drain-report",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          sourceDrainReport: cloneFrozenObject(report.sourceDrainReport)
        }),
        reason: "scheduler-expired-act-root-diagnostics-source-drain"
      },
      {
        label: "shortened-drained-records",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(
            report.actQueueDrainReport,
            {
              drainedRecords: Object.freeze(
                report.actQueueDrainReport.drainedRecords.slice(0, 1)
              )
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        label: "prefix-drain-counts",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(
            report.actQueueDrainReport,
            {
              drainedCount: 1,
              executedCallbackCount: 1,
              recordedContinuationCount: 0,
              executedContinuationCount: 0,
              drainedRecords: Object.freeze(
                report.actQueueDrainReport.drainedRecords.slice(0, 1)
              ),
              recordedContinuations: Object.freeze([]),
              executedContinuations: Object.freeze([])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        label: "malformed-nested-drained-record",
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(
            report.actQueueDrainReport,
            {
              drainedRecords: Object.freeze([
                null,
                ...report.actQueueDrainReport.drainedRecords.slice(1)
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      }
    ]) {
      assertRejectedDiagnostics(rejectedDiagnostics, reason, label);
    }

    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report),
      true,
      nodeEnv
    );

    const consumeReport =
      gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(report);
    assert.equal(
      consumeReport.status,
      gate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumeReport.accepted, true, nodeEnv);
    assert.equal(
      consumeReport.schedulerMockExpiredActRootWorkDiagnosticsStatus,
      gate.schedulerMockExpiredActRootWorkDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      consumeReport.schedulerMockExpiredActRootWorkDiagnosticKind,
      privateSchedulerMockExpiredActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(consumeReport.schedulerMockExpiredActRootWorkDiagnosticVersion, 1);
    assert.equal(consumeReport.schedulerDiagnosticStatus, gate.schedulerDiagnosticsStatus);
    assert.equal(consumeReport.expiredCallbackPriorityLevel, 2, nodeEnv);
    assert.equal(
      consumeReport.expiredCallbackPriorityLabel,
      "UserBlockingPriority",
      nodeEnv
    );
    assert.equal(
      consumeReport.expiredCallbackSchedulerPriority,
      "UserBlocking",
      nodeEnv
    );
    assert.equal(consumeReport.expiredCallbackVirtualTime, 251, nodeEnv);
    assert.equal(consumeReport.expiredCallbackLaneLabel, "SyncLane", nodeEnv);
    assert.equal(consumeReport.selectedFlushHelper, "unstable_flushExpired");
    assert.deepEqual(
      consumeReport.rootWorkRecordSummary.records.map(
        (record) => record.recordKind
      ),
      acceptedSchedulerMockExpiredActRootWorkRecords,
      nodeEnv
    );
    assert.deepEqual(
      {
        recordCount: consumeReport.rootWorkRecordSummary.recordCount,
        pendingBefore: consumeReport.rootWorkRecordSummary.pendingBefore,
        consumedCount: consumeReport.rootWorkRecordSummary.consumedCount,
        remainingCount: consumeReport.rootWorkRecordSummary.remainingCount
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
        pendingBefore: consumeReport.actQueueDrainSummary.pendingBefore,
        drainedCount: consumeReport.actQueueDrainSummary.drainedCount,
        executedCallbackCount:
          consumeReport.actQueueDrainSummary.executedCallbackCount,
        recordedContinuationCount:
          consumeReport.actQueueDrainSummary.recordedContinuationCount,
        executedContinuationCount:
          consumeReport.actQueueDrainSummary.executedContinuationCount,
        remainingCount: consumeReport.actQueueDrainSummary.remainingCount
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
    assert.equal(
      consumeReport.consumesSchedulerMockExpiredActRootWorkDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(
      consumeReport.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(
      consumeReport.consumesAcceptedExpiredActRootWorkRecords,
      true,
      nodeEnv
    );
    assert.equal(consumeReport.drainsAcceptedInternalTestQueues, true, nodeEnv);
    assert.equal(consumeReport.queueFlushingReady, false, nodeEnv);
    assert.equal(consumeReport.rendererRootsReady, false, nodeEnv);
    assert.equal(consumeReport.passiveEffectsReady, false, nodeEnv);
    assert.equal(consumeReport.continuationFlushingReady, false, nodeEnv);
    assert.equal(consumeReport.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      consumeReport.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(consumeReport.publicReactActCompatibilityClaimed, false);
    assert.equal(
      consumeReport.publicRootSchedulerCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(
      consumeReport.publicRendererCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(consumeReport.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(consumeReport.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(consumeReport.invokesPublicSchedulerFlushHelper, false);
    assert.equal(consumeReport.publicSchedulerFlushBehaviorExecuted, false);
    assert.equal(consumeReport.executesQueuedWork, false, nodeEnv);
    assert.equal(consumeReport.executesEffects, false, nodeEnv);
    assert.equal(consumeReport.executesRendererWork, false, nodeEnv);
    assert.equal(consumeReport.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(
      events,
      [
        [
          "expired-act-root-callback",
          true,
          Scheduler.unstable_UserBlockingPriority,
          251
        ],
        [
          "expired-act-root-continuation",
          true,
          Scheduler.unstable_UserBlockingPriority,
          251
        ],
        ["act-root-schedule", false, Scheduler.unstable_NormalPriority, 251],
        ["act-root-callback", false, Scheduler.unstable_NormalPriority, 251],
        [
          "act-root-continuation",
          false,
          Scheduler.unstable_NormalPriority,
          251
        ]
      ],
      nodeEnv
    );
    assert.equal(publicSchedulerCallbackRan, false, nodeEnv);
    assert.equal(metadata.rootWorkRecords.length, 0, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    for (const { diagnostics: rejectedDiagnostics, reason } of [
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {}, {
          withBrand: false
        }),
        reason: "scheduler-expired-act-root-diagnostics-brand"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, { version: 2 }),
        reason: "scheduler-expired-act-root-diagnostics-version"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordsPendingAfter: 1
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecords: [...report.rootWorkRecords]
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            { remainingCount: 1 }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            {
              consumedRecords: Object.freeze([
                ...report.rootWorkRecordConsumptionReport.consumedRecords
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            {
              consumedRecords: Object.freeze([
                cloneFrozenObject(
                  report.rootWorkRecordConsumptionReport.consumedRecords[0]
                ),
                ...report.rootWorkRecordConsumptionReport.consumedRecords.slice(
                  1
                )
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          rootWorkRecordConsumptionReport: cloneFrozenObject(
            report.rootWorkRecordConsumptionReport,
            {
              consumedRecords: Object.freeze([
                cloneFrozenObject(
                  report.rootWorkRecordConsumptionReport.consumedRecords[0],
                  { accepted: false }
                ),
                ...report.rootWorkRecordConsumptionReport.consumedRecords.slice(
                  1
                )
              ])
            }
          )
        }),
        reason: "scheduler-expired-act-root-diagnostics-root-work-consumption"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: { ...report.actQueueDrainReport }
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport, {
            remainingCount: 1
          })
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport, {
            drainedRecords: Object.freeze([
              ...report.actQueueDrainReport.drainedRecords
            ])
          })
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport, {
            drainedRecords: Object.freeze([
              cloneFrozenObject(report.actQueueDrainReport.drainedRecords[0]),
              ...report.actQueueDrainReport.drainedRecords.slice(1)
            ])
          })
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport, {
            drainedRecords: Object.freeze([
              report.actQueueDrainReport.drainedRecords[0],
              cloneFrozenObject(report.actQueueDrainReport.drainedRecords[1], {
                callback: cloneFrozenObject(
                  report.actQueueDrainReport.drainedRecords[1].callback,
                  { label: "altered-act-root-callback" }
                )
              })
            ])
          })
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport:
            cloneActQueueDrainReportWithAlteredContinuationSource(report)
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          actQueueDrainReport: cloneFrozenObject(report.actQueueDrainReport, {
            recordedContinuations: Object.freeze([])
          })
        }),
        reason: "scheduler-expired-act-root-diagnostics-act-queue-drain"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          publicReactActCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          drainsPublicReactActQueue: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        diagnostics: cloneExpiredActRootWorkReport(report, {
          status: "ambiguous-expired-work-report"
        }),
        reason: "scheduler-expired-act-root-diagnostics-shape"
      }
    ]) {
      assert.equal(
        gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
          rejectedDiagnostics
        ),
        false,
        `${nodeEnv}:${reason}`
      );
      assert.throws(
        () =>
          gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(
            rejectedDiagnostics
          ),
        (error) => {
          assert.equal(error.name, "FastReactUnimplementedError");
          assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
          assert.equal(error.entrypoint, "react");
          assert.equal(
            error.exportName,
            `${privateActDispatcherGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`
          );
          assert.equal(error.compatibilityTarget, "react@19.2.6");
          assert.equal(error.reason, reason);
          assert.equal(error.publicCompatibilityClaimed, false);
          assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
          assert.equal(error.publicReactActCompatibilityClaimed, false);
          assert.equal(error.publicRootSchedulerCompatibilityClaimed, false);
          assert.equal(error.publicRendererCompatibilityClaimed, false);
          assert.equal(error.drainsPublicSchedulerTaskQueue, false);
          assert.equal(error.drainsPublicReactActQueue, false);
          assert.equal(error.executesQueuedWork, false);
          assert.equal(error.executesEffects, false);
          assert.equal(error.executesRendererWork, false);
          assert.equal(error.executesRendererRoots, false);
          return true;
        },
        `${nodeEnv}:${reason}`
      );
    }

    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(diagnostics),
      false,
      nodeEnv
    );
    Scheduler.reset();
  }
});

test("React act gate consumes source-owned scheduler-driven passive effect diagnostics only", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  const assertRejected = (diagnostics, reason, label) => {
    assert.equal(
      gate.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      false,
      label
    );
    assert.throws(
      () => gate.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react");
        assert.equal(
          error.exportName,
          `${privateActDispatcherGateExport}.consumeSchedulerDrivenPassiveEffectDiagnostics`
        );
        assert.equal(error.compatibilityTarget, "react@19.2.6");
        assert.equal(error.reason, reason);
        assert.equal(error.publicCompatibilityClaimed, false);
        assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
        assert.equal(error.publicReactActCompatibilityClaimed, false);
        assert.equal(error.publicRootSchedulerCompatibilityClaimed, false);
        assert.equal(error.publicRendererCompatibilityClaimed, false);
        assert.equal(error.drainsPublicSchedulerTaskQueue, false);
        assert.equal(error.drainsPublicReactActQueue, false);
        assert.equal(error.publicActPassiveDrain, false);
        assert.equal(error.publicEffectExecution, false);
        assert.equal(error.publicRootExecution, false);
        assert.equal(error.executesQueuedWork, false);
        assert.equal(error.executesEffects, false);
        assert.equal(error.executesPassiveEffects, false);
        assert.equal(error.executesRendererWork, false);
        assert.equal(error.executesRendererRoots, false);
        return true;
      },
      label
    );
  };

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const lifecycle =
      createSourceOwnedReactDomLifecycleBoundary(`react-act-${nodeEnv}`);
    const { report } = createPrivateExpiredActRootWorkReportWithCommit(
      gate,
      Scheduler,
      {
        rootId: lifecycle.rootId,
        rootLabel: lifecycle.rootLabel
      }
    );
    const diagnostics =
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        finishedWorkId: `finished-passive-${nodeEnv}`
      });

    assert.equal(
      diagnostics[privateSchedulerDrivenPassiveEffectDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(diagnostics), true, nodeEnv);
    assert.equal(
      gate.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      true,
      nodeEnv
    );

    const consumption =
      gate.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics);
    assert.equal(
      consumption.status,
      gate.schedulerDrivenPassiveEffectConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumption.accepted, true, nodeEnv);
    assert.equal(
      consumption.schedulerDrivenPassiveEffectDiagnosticsStatus,
      gate.schedulerDrivenPassiveEffectDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      consumption.schedulerMockExpiredActRootWorkConsumptionStatus,
      gate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumption.rootId, lifecycle.rootId, nodeEnv);
    assert.equal(consumption.rootLabel, lifecycle.rootLabel, nodeEnv);
    assert.equal(
      consumption.finishedWorkId,
      `finished-passive-${nodeEnv}`,
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
      gate.schedulerDrivenPassiveLifecycleBoundaryStatus,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.kind,
      gate.schedulerDrivenPassiveLifecycleBoundaryKind,
      nodeEnv
    );
    assert.equal(
      consumption.lifecycleRequestBoundary.sourceRequestId,
      lifecycle.boundary.sourceRequestId,
      nodeEnv
    );
    assert.equal(consumption.privateSchedulerDrivenPassiveExecution, true, nodeEnv);
    assert.equal(consumption.didExecutePrivateCallbackExecutors, true, nodeEnv);
    assert.equal(consumption.schedulerDrivenPassiveExecution, false, nodeEnv);
    assert.equal(consumption.queueFlushingReady, false, nodeEnv);
    assert.equal(consumption.rendererRootsReady, false, nodeEnv);
    assert.equal(consumption.passiveEffectsReady, false, nodeEnv);
    assert.equal(consumption.continuationFlushingReady, false, nodeEnv);
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
    assert.equal(consumption.publicActPassiveDrain, false, nodeEnv);
    assert.equal(consumption.publicEffectExecution, false, nodeEnv);
    assert.equal(consumption.publicRootExecution, false, nodeEnv);
    assert.equal(consumption.executesQueuedWork, false, nodeEnv);
    assert.equal(consumption.executesEffects, false, nodeEnv);
    assert.equal(consumption.executesPassiveEffects, false, nodeEnv);
    assert.equal(consumption.executesRendererWork, false, nodeEnv);
    assert.equal(consumption.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(consumption.workerIds, [
      "worker-836-reconciler-private-act-queue-execution-path",
      "worker-837-scheduler-driven-passive-effect-execution"
    ]);
    assert.deepEqual(consumption.records, [
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
    ]);
    assert.equal(
      consumption.schedulerExecution.passiveEffects,
      consumption.passiveEffects,
      nodeEnv
    );
    assert.equal(
      consumption.schedulerGate.schedulerRequest,
      consumption.schedulerRequest,
      nodeEnv
    );
    assert.equal(
      consumption.schedulerMockExpiredActRootWorkConsumption
        .rootWorkRecordSummary.records.some(
          (record) =>
            record.recordKind ===
            "HostRootFinishedWorkCommitHandoffRecordForCanary"
        ),
      true,
      nodeEnv
    );

    const clonedScheduler = cloneExpiredActRootWorkReport(report);
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(
        clonedScheduler,
        lifecycle.boundaryOptions
      ),
      "scheduler-driven-passive-diagnostics-scheduler-source-proof",
      `${nodeEnv}:missing-scheduler-source-proof`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        pendingPassiveHandoffOverrides: {
          finishedWorkId: `stale-finished-passive-${nodeEnv}`
        }
      }),
      "scheduler-driven-passive-diagnostics-pending-passive",
      `${nodeEnv}:stale-pending-passive-handoff`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        rootCommitPassiveExecutionOverrides: {
          rootId: 1837,
          rootLabel: `foreign-passive-root-${nodeEnv}`
        }
      }),
      "scheduler-driven-passive-diagnostics-root-commit",
      `${nodeEnv}:cross-root-passive-commit`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        diagnosticsOverrides: {
          lifecycleRequestBoundary: {
            ...diagnostics.lifecycleRequestBoundary
          }
        }
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:caller-built-lifecycle-boundary`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        lifecycleRequestId: `${lifecycle.rootId}:foreign-request`
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:stale-lifecycle-request-id`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...lifecycle.boundaryOptions,
        lifecycleRequestSequence:
          lifecycle.boundary.sourceRequestSequence + 1000
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:replayed-lifecycle-request-sequence`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...createReactDomLifecycleBoundaryOptions(
          lifecycle.initialDiagnostic.sourceContainerSnapshot
        )
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary",
      `${nodeEnv}:stale-same-root-render-lifecycle-boundary`
    );
    const crossRootLifecycle =
      createSourceOwnedReactDomLifecycleBoundary(
        `react-act-cross-root-${nodeEnv}`
      );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        ...crossRootLifecycle.boundaryOptions
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary",
      `${nodeEnv}:cross-root-lifecycle-boundary`
    );
    assertRejected(
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
        finishedWorkId: diagnostics.finishedWorkId
      }),
      "scheduler-driven-passive-diagnostics-lifecycle-boundary-ownership",
      `${nodeEnv}:missing-lifecycle-boundary`
    );
    assertRejected(
      cloneSchedulerDrivenPassiveEffectDiagnostics(diagnostics),
      "scheduler-driven-passive-diagnostics-passive-ownership",
      `${nodeEnv}:missing-passive-ownership`
    );
    assertRejected(
      cloneSchedulerDrivenPassiveEffectDiagnostics(diagnostics, {
        publicReactActCompatibilityClaimed: true
      }),
      "scheduler-driven-passive-diagnostics-passive-ownership",
      `${nodeEnv}:caller-built-public-alias`
    );
    const callerBuiltNestedDiagnostics =
      gate.createSchedulerDrivenPassiveEffectDiagnosticsForCanary(report, {
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
    assertRejected(
      callerBuiltNestedDiagnostics,
      "scheduler-driven-passive-diagnostics-nested-passive-ownership",
      `${nodeEnv}:caller-built-nested-passive-records`
    );
    assertRejected(
      Object.freeze({
        kind: privateSchedulerDrivenPassiveEffectDiagnosticsKind,
        status:
          "test title says scheduler-driven passive effect execution passed",
        source: "function PassiveEffectSchedulerFlushExecutionRecord() {}"
      }),
      "scheduler-driven-passive-diagnostics-brand",
      `${nodeEnv}:prose-test-title-source-syntax`
    );
    assertRejected(
      new Error(
        "PassiveEffectSchedulerFlushExecutionRecord.did_execute_private_callback_executors"
      ),
      "scheduler-driven-passive-diagnostics-not-frozen",
      `${nodeEnv}:error-message-not-evidence`
    );
  }
});

test("React act gate preflights delayed Scheduler renderer-root handoff as nested expired evidence only", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  const React = loadFreshWorkspaceModule("packages/react/index.js");

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics =
      Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];

    Scheduler.reset();
    const events = [];
    const createCallback = (label) =>
      gate.createInternalActQueueTestCallback(
        (didTimeout) => {
          events.push([
            label,
            didTimeout,
            Scheduler.unstable_getCurrentPriorityLevel(),
            Scheduler.unstable_now()
          ]);
          Scheduler.log(label);
        },
        { label }
      );
    const delayedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createCallback("delayed-renderer-root-callback"),
      { delay: 10 }
    );
    let publicSchedulerCallbackRan = false;
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        publicSchedulerCallbackRan = true;
        Scheduler.log("public-scheduler-work");
      }
    );
    let publicReactActCallbackRan = false;
    assert.throws(
      () => React.act(() => {
        publicReactActCallbackRan = true;
      }),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react");
        assert.equal(error.exportName, "act");
        assert.equal(error.compatibilityTarget, "react@19.2.6");
        return true;
      },
      nodeEnv
    );

    const actQueue = gate.createInternalActQueueTestQueue([
      gate.createInternalActQueueTestTask({
        label: "renderer-root-act-schedule",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "RootSchedule",
        continuationStatus: "NoContinuation",
        callback: createCallback("renderer-root-act-schedule")
      })
    ]);
    const rendererRootMetadata =
      diagnostics.createDelayedRendererRootWorkMetadataForDiagnostics({
        callbackHandle: delayedHandle,
        actQueue,
        rootWorkRecords: [
          createAcceptedExpiredActRootWorkRecord(
            "RootLaneSchedulingSnapshot"
          ),
          createAcceptedExpiredActRootWorkRecord(
            "HostRootFinishedWorkPendingCommitRecordForCanary"
          )
        ],
        rootId: 772,
        rootLabel: "react-delayed-renderer-root-772",
        scheduledVirtualTime: 0,
        delayMs: 10,
        schedulerPriority: "UserBlocking"
      });
    const delayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics(
        rendererRootMetadata
      );
    const delayedReport = Scheduler.unstable_flushExpired(delayedMetadata);
    assert.equal(
      delayedReport[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(
      delayedReport.producedByPrivateDelayedRendererRootProducer,
      true,
      nodeEnv
    );
    assert.equal(
      delayedReport.delayedRendererRootMetadata.kind,
      privateSchedulerMockDelayedRendererRootWorkMetadataKind,
      nodeEnv
    );
    assert.equal(
      delayedReport.delayedRendererRootMetadata.accepted,
      true,
      nodeEnv
    );
    assert.equal(
      delayedReport.delayedRendererRootMetadata.sourceEvidenceMatches,
      true,
      nodeEnv
    );

    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
        delayedReport
      ),
      false,
      nodeEnv
    );
    assert.throws(
      () =>
        gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(
          delayedReport
        ),
      (error) => {
        assert.equal(
          error.reason,
          "scheduler-expired-act-root-diagnostics-brand"
        );
        assert.equal(error.drainsPublicReactActQueue, false);
        assert.equal(error.executesRendererRoots, false);
        return true;
      },
      nodeEnv
    );

    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport),
      "scheduler-delayed-act-root-diagnostics-source-proof",
      `${nodeEnv}:renderer-root-top-level-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {}, {
        withOldGlobalSourceProof: true
      }),
      "scheduler-delayed-act-root-diagnostics-source-proof",
      `${nodeEnv}:renderer-root-old-global-forged-top-level-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      deepCloneDelayedActRootWorkDiagnosticsWithOldGlobalSourceProof(
        delayedReport
      ),
      "scheduler-delayed-act-root-diagnostics-metadata",
      `${nodeEnv}:renderer-root-old-global-forged-deep-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        delayedRendererRootMetadata: null
      }),
      "scheduler-delayed-act-root-diagnostics-renderer-root-source",
      `${nodeEnv}:renderer-root-missing-top-level-source`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        delayedActRootWorkMetadata: cloneFrozenObject(
          delayedReport.delayedActRootWorkMetadata,
          {
            rendererRootMetadata: cloneFrozenObject(
              delayedReport.delayedActRootWorkMetadata.rendererRootMetadata,
              {
                sourceEvidenceMatches: false
              }
            )
          }
        )
      }),
      "scheduler-delayed-act-root-diagnostics-metadata",
      `${nodeEnv}:renderer-root-mutated-source-evidence`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        publicReactActCompatibilityClaimed: true
      }),
      "scheduler-delayed-act-root-diagnostics-public-claim",
      `${nodeEnv}:renderer-root-public-react-act-claim`
    );

    assert.equal(
      gate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(delayedReport),
      true,
      nodeEnv
    );
    const preflight =
      gate.preflightSchedulerMockDelayedActRootWorkDiagnostics(delayedReport);
    assert.equal(
      preflight.status,
      gate.schedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(preflight.accepted, true, nodeEnv);
    assert.equal(
      preflight.delayedActRootWorkProducerKind,
      "accepted-renderer-root-metadata",
      nodeEnv
    );
    assert.equal(
      preflight.delayedActRootWorkProducerStatus,
      "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
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
      delayedReport.delayedRendererRootMetadata,
      nodeEnv
    );
    assert.equal(
      preflight.delayedRendererRootMetadata.sourceEvidenceMatches,
      true,
      nodeEnv
    );
    assert.equal(
      preflight.nestedExpiredActRootWorkConsumption.status,
      gate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(
      preflight.rootWorkRecordSummary.recordCount,
      2,
      nodeEnv
    );
    assert.equal(preflight.rootWorkRecordSummary.remainingCount, 0, nodeEnv);
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
    assert.equal(
      preflight.consumesSchedulerMockExpiredActRootWorkDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(preflight.queueFlushingReady, false, nodeEnv);
    assert.equal(preflight.rendererRootsReady, false, nodeEnv);
    assert.equal(preflight.passiveEffectsReady, false, nodeEnv);
    assert.equal(preflight.continuationFlushingReady, false, nodeEnv);
    assert.equal(preflight.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      preflight.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(preflight.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      preflight.publicRootSchedulerCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(preflight.publicRendererCompatibilityClaimed, false, nodeEnv);
    assert.equal(preflight.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(preflight.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(preflight.executesQueuedWork, false, nodeEnv);
    assert.equal(preflight.executesEffects, false, nodeEnv);
    assert.equal(preflight.executesRendererWork, false, nodeEnv);
    assert.equal(preflight.executesRendererRoots, false, nodeEnv);

    const nestedExpiredReport = delayedReport.expiredActRootWorkDrainReport;
    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
        nestedExpiredReport
      ),
      true,
      nodeEnv
    );
    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(
        cloneExpiredActRootWorkReport(nestedExpiredReport)
      ),
      false,
      nodeEnv
    );
    assert.throws(
      () =>
        gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(
          cloneExpiredActRootWorkReport(nestedExpiredReport)
        ),
      (error) => {
        assert.equal(
          error.reason,
          "scheduler-expired-act-root-diagnostics-source-proof"
        );
        return true;
      },
      nodeEnv
    );

    const consumeReport =
      gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(
        nestedExpiredReport
      );
    assert.equal(
      consumeReport.status,
      gate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
    assert.equal(consumeReport.accepted, true, nodeEnv);
    assert.equal(
      consumeReport.drainsPublicSchedulerTaskQueue,
      false,
      nodeEnv
    );
    assert.equal(consumeReport.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(consumeReport.publicReactActCompatibilityClaimed, false);
    assert.equal(consumeReport.executesRendererWork, false, nodeEnv);
    assert.equal(consumeReport.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(events, [
      [
        "delayed-renderer-root-callback",
        true,
        Scheduler.unstable_UserBlockingPriority,
        260
      ],
      [
        "renderer-root-act-schedule",
        false,
        Scheduler.unstable_NormalPriority,
        260
      ]
    ]);
    assert.equal(publicSchedulerCallbackRan, false, nodeEnv);
    assert.equal(publicReactActCallbackRan, false, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.reset();
  }
});

test("package-private React act gate preflights delayed Scheduler mock diagnostics through nested expired evidence only", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics =
      Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];

    Scheduler.reset();
    const events = [];
    const createCallback = (label, continuation = null) =>
      gate.createInternalActQueueTestCallback(
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
      "delayed-act-root-continuation"
    );
    const delayedCallback = createCallback(
      "delayed-act-root-callback",
      delayedContinuation
    );
    const delayedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      delayedCallback,
      { delay: 10 }
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
    const actQueue = gate.createInternalActQueueTestQueue([
      gate.createInternalActQueueTestTask({
        label: "act-root-schedule",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "RootSchedule",
        continuationStatus: "NoContinuation",
        callback: createCallback("act-root-schedule")
      }),
      gate.createInternalActQueueTestTask({
        label: "act-root-callback",
        recordKind: "SyncFlushActContinuationRecord",
        taskKind: "SchedulerCallback",
        continuationStatus: "PendingContinuation",
        callback: createCallback("act-root-callback", actRootContinuation)
      })
    ]);
    const expiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      delayedHandle,
      actQueue,
      {
        rootId: 775,
        rootLabel: "mock-root-775",
        rootWorkRecords: acceptedSchedulerMockExpiredActRootWorkRecords.map(
          (recordKind) =>
            createAcceptedExpiredActRootWorkRecord(recordKind, {
              rootId: 775,
              rootLabel: "mock-root-775"
            })
        )
      }
    );
    const delayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        expiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10,
          startTime: delayedHandle.startTime,
          expirationTime: delayedHandle.expirationTime,
          priorityTimeoutMs:
            delayedHandle.expirationTime - delayedHandle.startTime
        }
      );
    const delayedReport = Scheduler.unstable_flushExpired(delayedMetadata);

    assert.equal(
      delayedReport[privateSchedulerMockDelayedActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(Object.isFrozen(delayedReport), true, nodeEnv);
    assert.equal(
      delayedReport.kind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(delayedReport.version, 1, nodeEnv);
    assert.equal(
      delayedReport.expiredActRootWorkDrainReport[
        privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
      ],
      true,
      nodeEnv
    );

    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(delayedReport),
      false,
      nodeEnv
    );
    assert.throws(
      () =>
        gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(delayedReport),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(
          error.exportName,
          `${privateActDispatcherGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`
        );
        assert.equal(
          error.reason,
          "scheduler-expired-act-root-diagnostics-brand"
        );
        assert.equal(error.publicReactActCompatibilityClaimed, false);
        assert.equal(error.drainsPublicReactActQueue, false);
        return true;
      },
      nodeEnv
    );

    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport),
      "scheduler-delayed-act-root-diagnostics-source-proof",
      `${nodeEnv}:top-level-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {}, {
        withOldGlobalSourceProof: true
      }),
      "scheduler-delayed-act-root-diagnostics-source-proof",
      `${nodeEnv}:old-global-forged-top-level-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      deepCloneDelayedActRootWorkDiagnosticsWithOldGlobalSourceProof(
        delayedReport
      ),
      "scheduler-delayed-act-root-diagnostics-metadata",
      `${nodeEnv}:old-global-forged-deep-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        expiredActRootWorkDrainReport: cloneExpiredActRootWorkReport(
          delayedReport.expiredActRootWorkDrainReport
        )
      }),
      "scheduler-delayed-act-root-diagnostics-nested-expired",
      `${nodeEnv}:nested-expired-clone`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        publicReactActCompatibilityClaimed: true
      }),
      "scheduler-delayed-act-root-diagnostics-public-claim",
      `${nodeEnv}:public-react-act-claim`
    );
    assertSchedulerMockDelayedPreflightRejected(
      gate,
      cloneDelayedActRootWorkReport(delayedReport, {
        drainsPublicReactActQueue: true
      }),
      "scheduler-delayed-act-root-diagnostics-public-claim",
      `${nodeEnv}:public-act-drain-claim`
    );

    assert.equal(
      gate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(delayedReport),
      true,
      nodeEnv
    );
    const preflight =
      gate.preflightSchedulerMockDelayedActRootWorkDiagnostics(delayedReport);
    assert.equal(
      preflight.status,
      gate.schedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(preflight.accepted, true, nodeEnv);
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      gate.schedulerMockDelayedActRootWorkDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      preflight.schedulerMockDelayedActRootWorkDiagnosticKind,
      privateSchedulerMockDelayedActRootWorkDiagnosticsKind,
      nodeEnv
    );
    assert.equal(preflight.schedulerMockDelayedActRootWorkDiagnosticVersion, 1);
    assert.equal(
      preflight.schedulerMockExpiredActRootWorkDiagnosticsStatus,
      gate.schedulerMockExpiredActRootWorkDiagnosticsStatus,
      nodeEnv
    );
    assert.equal(
      preflight.nestedExpiredActRootWorkConsumption.status,
      gate.schedulerMockExpiredActRootWorkConsumptionStatus,
      nodeEnv
    );
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
    assert.equal(
      preflight.consumesSchedulerMockExpiredActRootWorkDiagnostics,
      true,
      nodeEnv
    );
    assert.equal(
      preflight.delayedActRootWorkProducerKind,
      "accepted-root-metadata",
      nodeEnv
    );
    assert.equal(
      preflight.delayedActRootWorkProducerStatus,
      "produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata",
      nodeEnv
    );
    assert.equal(
      preflight.producedByPrivateDelayedRendererRootProducer,
      false,
      nodeEnv
    );
    assert.equal(preflight.rendererRootSourceEvidencePresent, false, nodeEnv);
    assert.equal(preflight.rendererRootSourceEvidenceOwned, false, nodeEnv);
    assert.equal(preflight.delayedRendererRootMetadata, null, nodeEnv);
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
    assert.deepEqual(
      preflight.rootWorkRecordSummary.records.map(
        (record) => record.recordKind
      ),
      acceptedSchedulerMockExpiredActRootWorkRecords,
      nodeEnv
    );
    assert.equal(preflight.rootWorkRecordSummary.remainingCount, 0, nodeEnv);
    assert.equal(preflight.actQueueDrainSummary.remainingCount, 0, nodeEnv);
    assert.equal(preflight.queueFlushingReady, false, nodeEnv);
    assert.equal(preflight.rendererRootsReady, false, nodeEnv);
    assert.equal(preflight.passiveEffectsReady, false, nodeEnv);
    assert.equal(preflight.continuationFlushingReady, false, nodeEnv);
    assert.equal(preflight.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      preflight.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(preflight.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      preflight.publicRootSchedulerCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(preflight.publicRendererCompatibilityClaimed, false, nodeEnv);
    assert.equal(preflight.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(preflight.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(preflight.invokesPublicSchedulerFlushHelper, false, nodeEnv);
    assert.equal(
      preflight.publicSchedulerFlushBehaviorExecuted,
      false,
      nodeEnv
    );
    assert.equal(preflight.executesQueuedWork, false, nodeEnv);
    assert.equal(preflight.executesEffects, false, nodeEnv);
    assert.equal(preflight.executesRendererWork, false, nodeEnv);
    assert.equal(preflight.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(
      events,
      [
        [
          "delayed-act-root-callback",
          true,
          Scheduler.unstable_UserBlockingPriority,
          260
        ],
        [
          "delayed-act-root-continuation",
          true,
          Scheduler.unstable_UserBlockingPriority,
          260
        ],
        ["act-root-schedule", false, Scheduler.unstable_NormalPriority, 260],
        ["act-root-callback", false, Scheduler.unstable_NormalPriority, 260],
        [
          "act-root-continuation",
          false,
          Scheduler.unstable_NormalPriority,
          260
        ]
      ],
      nodeEnv
    );
    assert.equal(publicSchedulerCallbackRan, false, nodeEnv);
    assert.equal(expiredMetadata.rootWorkRecords.length, 0, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    const React = loadFreshWorkspaceModule(publicReactEntrypoints[0]);
    let publicActCallbackInvoked = false;
    const publicActError = captureThrown(() =>
      React.act(() => {
        publicActCallbackInvoked = true;
      })
    );
    assertReactActPlaceholderError(publicActError);
    assert.equal(publicActCallbackInvoked, false, nodeEnv);

    Scheduler.reset();
  }
});

test("React act private Scheduler mock consumers reject stale and forged expired/delayed evidence", () => {
  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  const React = loadFreshWorkspaceModule(publicReactEntrypoints[0]);

  for (const nodeEnv of ["development", "production"]) {
    let Scheduler = loadFreshSchedulerMock(nodeEnv);
    const staleExpiredReport = createPrivateExpiredActRootWorkReport(
      gate,
      Scheduler,
      {
        rootId: 814,
        rootLabel: "stale-scheduler-root-814"
      }
    ).report;

    Scheduler = loadFreshSchedulerMock(nodeEnv);
    assertSchedulerMockExpiredConsumerRejected(
      gate,
      staleExpiredReport,
      "scheduler-expired-act-root-diagnostics-metadata",
      `${nodeEnv}:stale-expired-report-from-previous-scheduler`
    );

    const { report: expiredReport } = createPrivateExpiredActRootWorkReport(
      gate,
      Scheduler,
      {
        rootId: 815,
        rootLabel: "current-expired-root-815"
      }
    );
    assert.equal(
      gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(expiredReport),
      true,
      nodeEnv
    );
    assertSchedulerMockExpiredConsumerRejected(
      gate,
      cloneExpiredActRootWorkReport(expiredReport),
      "scheduler-expired-act-root-diagnostics-source-proof",
      `${nodeEnv}:expired-clone-rejected-with-preinstalled-global-source-proof-record`
    );

    const diagnostics =
      Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
    const sourceValidator =
      diagnostics.schedulerMockExpiredActRootWorkSourceValidator;
    const clonedValidator = Object.freeze({ ...sourceValidator });
    assert.notEqual(clonedValidator, sourceValidator, nodeEnv);
    assert.equal(
      sourceValidator.isSchedulerMockExpiredActRootWorkSource(expiredReport),
      true,
      nodeEnv
    );
    assert.equal(
      clonedValidator.isSchedulerMockExpiredActRootWorkSource(expiredReport),
      true,
      nodeEnv
    );
    assertSchedulerMockExpiredConsumerRejected(
      gate,
      cloneExpiredActRootWorkReport(expiredReport, {
        schedulerMockExpiredActRootWorkSourceValidator: clonedValidator
      }),
      "scheduler-expired-act-root-diagnostics-source-proof",
      `${nodeEnv}:expired-cloned-validator-does-not-confer-source-proof`
    );

    assert.equal(
      createInheritedDiagnosticsAlias(expiredReport)[
        privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
      ],
      true,
      nodeEnv
    );
    assert.equal(
      Object.hasOwn(
        createInheritedDiagnosticsAlias(expiredReport),
        privateSchedulerMockExpiredActRootWorkDiagnosticsBrand
      ),
      false,
      nodeEnv
    );

    for (const { label, diagnostics: rejectedDiagnostics, reason } of [
      {
        label: "expired-inherited-private-symbol-alias",
        diagnostics: createInheritedDiagnosticsAlias(expiredReport),
        reason: "scheduler-expired-act-root-diagnostics-brand"
      },
      {
        label: "expired-private-symbol-lookalike",
        diagnostics:
          cloneExpiredActRootWorkReportWithPrivateSymbolAlias(expiredReport),
        reason: "scheduler-expired-act-root-diagnostics-brand"
      },
      {
        label: "expired-package-compatibility-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          packageCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-package-compatibility-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          publicPackageCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-scheduler-flush-helper-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          publicSchedulerFlushHelperCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-root-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          publicRootSchedulerCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-renderer-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          publicRendererCompatibilityClaimed: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-effect-execution-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          executesEffects: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-renderer-root-execution-claim",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          executesRendererRoots: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-scheduler-flush-helper-execution",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          invokesPublicSchedulerFlushHelper: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      },
      {
        label: "expired-public-scheduler-flush-behavior",
        diagnostics: cloneExpiredActRootWorkReport(expiredReport, {
          publicSchedulerFlushBehaviorExecuted: true
        }),
        reason: "scheduler-expired-act-root-diagnostics-public-claim"
      }
    ]) {
      assertSchedulerMockExpiredConsumerRejected(
        gate,
        rejectedDiagnostics,
        reason,
        `${nodeEnv}:${label}`
      );
    }

    const delayedCurrent = createPrivateDelayedRendererRootWorkReport(
      gate,
      Scheduler,
      {
        rootId: 816,
        rootLabel: "current-delayed-renderer-root-816",
        rootRequestId: "current-delayed-renderer-root-request-816",
        rootRequestSequence: 1
      }
    );
    const delayedReport = delayedCurrent.report;
    assert.equal(delayedCurrent.publicSchedulerCallbackRan(), false, nodeEnv);
    assert.equal(
      gate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(delayedReport),
      true,
      nodeEnv
    );
    const delayedPreflight =
      gate.preflightSchedulerMockDelayedActRootWorkDiagnostics(delayedReport);
    assert.equal(
      delayedPreflight.status,
      gate.schedulerMockDelayedActRootWorkPreflightStatus,
      nodeEnv
    );
    assert.equal(delayedPreflight.publicCompatibilityClaimed, false, nodeEnv);
    assert.equal(
      delayedPreflight.publicSchedulerFlushBehaviorExecuted,
      false,
      nodeEnv
    );
    assert.equal(delayedPreflight.executesEffects, false, nodeEnv);
    assert.equal(delayedPreflight.executesRendererRoots, false, nodeEnv);

    const staleRequestRendererRoot = cloneFrozenObject(
      delayedReport.delayedRendererRootMetadata,
      {
        rootRequestId: "stale-delayed-renderer-root-request"
      }
    );
    const staleSequenceRendererRoot = cloneFrozenObject(
      delayedReport.delayedRendererRootMetadata,
      {
        rootRequestSequence: 99
      }
    );
    const staleRootRendererRoot = cloneFrozenObject(
      delayedReport.delayedRendererRootMetadata,
      {
        rootId: 999,
        rootLabel: "stale-delayed-renderer-root-999"
      }
    );
    const foreignRendererRoot = cloneFrozenObject(
      delayedReport.delayedRendererRootMetadata,
      {
        rootId: 817,
        rootLabel: "foreign-delayed-renderer-root-817",
        rootRequestId: "foreign-delayed-renderer-root-request-817",
        rootRequestSequence: 2
      }
    );

    for (const { label, diagnostics: rejectedDiagnostics, reason } of [
      {
        label: "delayed-inherited-private-symbol-alias",
        diagnostics: createInheritedDiagnosticsAlias(delayedReport),
        reason: "scheduler-delayed-act-root-diagnostics-brand"
      },
      {
        label: "delayed-private-symbol-lookalike",
        diagnostics:
          cloneDelayedActRootWorkReportWithPrivateSymbolAlias(delayedReport),
        reason: "scheduler-delayed-act-root-diagnostics-brand"
      },
      {
        label: "delayed-stale-renderer-root-request-id",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          delayedRendererRootMetadata: staleRequestRendererRoot,
          delayedActRootWorkMetadata: cloneFrozenObject(
            delayedReport.delayedActRootWorkMetadata,
            {
              rendererRootMetadata: staleRequestRendererRoot
            }
          )
        }),
        reason: "scheduler-delayed-act-root-diagnostics-source-proof"
      },
      {
        label: "delayed-stale-renderer-root-request-sequence",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          delayedRendererRootMetadata: staleSequenceRendererRoot,
          delayedActRootWorkMetadata: cloneFrozenObject(
            delayedReport.delayedActRootWorkMetadata,
            {
              rendererRootMetadata: staleSequenceRendererRoot
            }
          )
        }),
        reason: "scheduler-delayed-act-root-diagnostics-source-proof"
      },
      {
        label: "delayed-stale-renderer-root-id",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          delayedRendererRootMetadata: staleRootRendererRoot,
          delayedActRootWorkMetadata: cloneFrozenObject(
            delayedReport.delayedActRootWorkMetadata,
            {
              rootId: staleRootRendererRoot.rootId,
              rootLabel: staleRootRendererRoot.rootLabel,
              rendererRootMetadata: staleRootRendererRoot
            }
          )
        }),
        reason: "scheduler-delayed-act-root-diagnostics-metadata"
      },
      {
        label: "delayed-foreign-renderer-root-row",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          delayedRendererRootMetadata: foreignRendererRoot
        }),
        reason: "scheduler-delayed-act-root-diagnostics-renderer-root-source"
      },
      {
        label: "delayed-mixed-expired-report",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          expiredActRootWorkDrainReport: expiredReport
        }),
        reason: "scheduler-delayed-act-root-diagnostics-nested-expired"
      },
      {
        label: "delayed-package-compatibility-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          packageCompatibilityClaimed: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-public-scheduler-flush-helper-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          publicSchedulerFlushHelperCompatibilityClaimed: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-public-root-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          publicRootSchedulerCompatibilityClaimed: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-public-renderer-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          publicRendererCompatibilityClaimed: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-effect-execution-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          executesEffects: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-renderer-root-execution-claim",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          executesRendererRoots: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-public-scheduler-flush-helper-execution",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          invokesPublicSchedulerFlushHelper: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      },
      {
        label: "delayed-public-scheduler-flush-behavior",
        diagnostics: cloneDelayedActRootWorkReport(delayedReport, {
          publicSchedulerFlushBehaviorExecuted: true
        }),
        reason: "scheduler-delayed-act-root-diagnostics-public-claim"
      }
    ]) {
      assertSchedulerMockDelayedPreflightRejected(
        gate,
        rejectedDiagnostics,
        reason,
        `${nodeEnv}:${label}`
      );
    }

    let publicActCallbackInvoked = false;
    assertReactActPlaceholderError(
      captureThrown(() =>
        React.act(() => {
          publicActCallbackInvoked = true;
        })
      )
    );
    assert.equal(publicActCallbackInvoked, false, nodeEnv);
    assert.equal(delayedCurrent.publicSchedulerCallbackRan(), false, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.reset();
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
    "scheduler-mock-expired-act-root-work-diagnostics",
    "react-act-scheduler-private-diagnostics-ledger",
    "scheduler-mock-delayed-act-root-work-nested-expired-diagnostics",
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
    "scheduler-driven-passive-effect-execution-diagnostics",
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
  assert.equal(
    domGate.privateReactActSchedulerDiagnosticsLedger.gateId,
    "private-admission-810-react-act-scheduler-diagnostics-ledger-1"
  );
  assert.equal(
    domGate.privateReactActSchedulerDiagnosticsLedger.publicTestUtilsActReady,
    false
  );
  assert.equal(
    domGate.privateReactActSchedulerDiagnosticsLedger
      .publicSchedulerFlushBehaviorExecuted,
    false
  );
  assert.equal(
    domGate.privateReactActSchedulerDiagnosticsLedger.executesRendererRoots,
    false
  );
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

function assertSchedulerMockDelayedPreflightRejected(
  gate,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => gate.preflightSchedulerMockDelayedActRootWorkDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react", label);
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.preflightSchedulerMockDelayedActRootWorkDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", label);
      assert.equal(error.reason, reason, label);
      assert.equal(error.publicCompatibilityClaimed, false, label);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false, label);
      assert.equal(error.publicReactActCompatibilityClaimed, false, label);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false, label);
      assert.equal(error.publicRendererCompatibilityClaimed, false, label);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false, label);
      assert.equal(error.drainsPublicReactActQueue, false, label);
      assert.equal(
        error.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence,
        false,
        label
      );
      assert.equal(error.executesQueuedWork, false, label);
      assert.equal(error.executesEffects, false, label);
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertSchedulerMockExpiredConsumerRejected(
  gate,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.entrypoint, "react", label);
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`,
        label
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", label);
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
      assert.equal(error.executesRendererWork, false, label);
      assert.equal(error.executesRendererRoots, false, label);
      return true;
    },
    label
  );
}

function assertPublicReactActCurrentnessRejected(gate, report, reason) {
  assert.equal(
    gate.isAcceptedPublicReactActBlockedCurrentnessReport(report),
    false,
    reason
  );
  assert.throws(
    () => gate.consumePublicReactActBlockedCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", reason);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", reason);
      assert.equal(error.entrypoint, "react", reason);
      assert.equal(
        error.exportName,
        `${privateActDispatcherGateExport}.consumePublicReactActBlockedCurrentnessReport`,
        reason
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6", reason);
      assert.equal(error.reason, reason);
      assert.equal(error.publicReactActCompatibilityClaimed, false, reason);
      assert.equal(error.publicWarningCompatibilityClaimed, false, reason);
      assert.equal(error.drainsPublicReactActQueue, false, reason);
      assert.equal(error.invokesCallback, false, reason);
      assert.equal(error.returnsThenable, false, reason);
      assert.equal(error.executesRendererRoots, false, reason);
      return true;
    },
    reason
  );
}

function replacePublicReactActCurrentnessScenario(report, index, overrides) {
  return report.scenarios.map((scenario, scenarioIndex) =>
    scenarioIndex === index
      ? {
          ...scenario,
          ...overrides
        }
      : scenario
  );
}

function createHostilePublicReactActCurrentnessProxy() {
  let trapCount = 0;
  const throwTrap = (trapName) => {
    trapCount += 1;
    throw new Error(`forged proxy ${trapName} trap should not be reached`);
  };

  return {
    proxy: new Proxy(
      {},
      {
        get() {
          throwTrap("get");
        },
        getOwnPropertyDescriptor() {
          throwTrap("getOwnPropertyDescriptor");
        },
        isExtensible() {
          throwTrap("isExtensible");
        },
        ownKeys() {
          throwTrap("ownKeys");
        }
      }
    ),
    getTrapCount: () => trapCount
  };
}

function createPublicReactActCurrentnessReportWithFreezeBypass(gate) {
  const originalFreeze = Object.freeze;

  Object.freeze = (value) => value;
  try {
    return gate.createPublicReactActBlockedCurrentnessReport();
  } finally {
    Object.freeze = originalFreeze;
  }
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

function createPrivateExpiredActRootWorkReport(
  gate,
  Scheduler,
  { rootId, rootLabel }
) {
  Scheduler.reset();
  const events = [];
  const createCallback = (label) =>
    gate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
      },
      { label }
    );
  const expiredHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    createCallback(`${rootLabel}:expired-callback`)
  );
  const actQueue = gate.createInternalActQueueTestQueue([
    gate.createInternalActQueueTestTask({
      label: `${rootLabel}:act-task`,
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: createCallback(`${rootLabel}:act-task`)
    })
  ]);
  const rootWorkRecords = [
    createAcceptedExpiredActRootWorkRecord("RootLaneSchedulingSnapshot", {
      rootId,
      rootLabel
    }),
    createAcceptedExpiredActRootWorkRecord("RootTaskScheduleRecord", {
      rootId,
      rootLabel
    })
  ];
  const metadata = createExpiredActRootWorkMetadata(
    Scheduler,
    expiredHandle,
    actQueue,
    {
      rootId,
      rootLabel,
      rootWorkRecords
    }
  );

  Scheduler.unstable_advanceTime(251);
  return {
    report: Scheduler.unstable_flushExpired(metadata),
    events,
    metadata,
    actQueue
  };
}

function createPrivateExpiredActRootWorkReportWithCommit(
  gate,
  Scheduler,
  { rootId, rootLabel }
) {
  Scheduler.reset();
  const events = [];
  const createCallback = (label) =>
    gate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
      },
      { label }
    );
  const expiredHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    createCallback(`${rootLabel}:expired-callback`)
  );
  const actQueue = gate.createInternalActQueueTestQueue([
    gate.createInternalActQueueTestTask({
      label: `${rootLabel}:act-task`,
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: createCallback(`${rootLabel}:act-task`)
    })
  ]);
  const rootWorkRecords = acceptedSchedulerMockExpiredActRootWorkRecords.map(
    (recordKind) =>
      createAcceptedExpiredActRootWorkRecord(recordKind, {
        rootId,
        rootLabel
      })
  );
  const metadata = createExpiredActRootWorkMetadata(
    Scheduler,
    expiredHandle,
    actQueue,
    {
      rootId,
      rootLabel,
      rootWorkRecords
    }
  );

  Scheduler.unstable_advanceTime(251);
  return {
    report: Scheduler.unstable_flushExpired(metadata),
    events,
    metadata,
    actQueue,
    rootWorkRecords
  };
}

function createPrivateDelayedRendererRootWorkReport(
  gate,
  Scheduler,
  { rootId, rootLabel, rootRequestId, rootRequestSequence }
) {
  Scheduler.reset();
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
  const events = [];
  let publicSchedulerCallbackRan = false;
  const createCallback = (label) =>
    gate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          label,
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log(label);
      },
      { label }
    );
  const delayedHandle = Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_UserBlockingPriority,
    createCallback(`${rootLabel}:delayed-callback`),
    { delay: 10 }
  );
  const scheduledVirtualTime = Scheduler.unstable_now();
  Scheduler.unstable_scheduleCallback(
    Scheduler.unstable_NormalPriority,
    () => {
      publicSchedulerCallbackRan = true;
      Scheduler.log(`${rootLabel}:public-scheduler-work`);
    }
  );
  const actQueue = gate.createInternalActQueueTestQueue([
    gate.createInternalActQueueTestTask({
      label: `${rootLabel}:act-task`,
      recordKind: "SchedulerActQueueRequest",
      taskKind: "RootSchedule",
      continuationStatus: "NoContinuation",
      callback: createCallback(`${rootLabel}:act-task`)
    })
  ]);
  const rootWorkRecords = [
    createAcceptedExpiredActRootWorkRecord("RootLaneSchedulingSnapshot", {
      rootId,
      rootLabel
    }),
    createAcceptedExpiredActRootWorkRecord(
      "HostRootFinishedWorkPendingCommitRecordForCanary",
      {
        rootId,
        rootLabel
      }
    )
  ];
  const rendererRootMetadata =
    diagnostics.createDelayedRendererRootWorkMetadataForDiagnostics({
      callbackHandle: delayedHandle,
      actQueue,
      rootWorkRecords,
      rootId,
      rootLabel,
      rootRequestId,
      rootRequestSequence,
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
    report: Scheduler.unstable_flushExpired(delayedMetadata),
    events,
    rendererRootMetadata,
    delayedMetadata,
    actQueue,
    rootWorkRecords,
    publicSchedulerCallbackRan: () => publicSchedulerCallbackRan
  };
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

function cloneExpiredActRootWorkReportWithPrivateSymbolAlias(report) {
  const cloned = { ...report };
  Object.defineProperty(
    cloned,
    Symbol(privateSchedulerMockExpiredActRootWorkDiagnosticsKind),
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
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

function cloneDelayedActRootWorkReportWithPrivateSymbolAlias(report) {
  const cloned = { ...report };
  Object.defineProperty(
    cloned,
    Symbol(privateSchedulerMockDelayedActRootWorkDiagnosticsKind),
    {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    }
  );
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

function createInheritedDiagnosticsAlias(report) {
  return Object.freeze(Object.create(report));
}

function cloneFrozenObject(value, overrides = {}) {
  const cloned = {
    ...value,
    ...overrides
  };

  return Object.freeze(cloned);
}

function assertSchedulerFlushHelperRejectsFakeValidatorMutation(
  Scheduler,
  gate,
  report,
  helperName,
  label
) {
  const originalHelper = Scheduler[helperName];
  const originalDiagnostics =
    originalHelper[privateActQueueFlushDiagnosticsExport];
  const fakeHelper =
    createFakeSchedulerFlushHelperWithPrivateDiagnostics(
      originalDiagnostics
    );
  const helperDescriptor = Object.getOwnPropertyDescriptor(
    Scheduler,
    helperName
  );

  assert.equal(typeof originalHelper, "function", label);
  assert.deepEqual(
    {
      configurable: helperDescriptor.configurable,
      enumerable: helperDescriptor.enumerable,
      writable: helperDescriptor.writable,
      value: helperDescriptor.value
    },
    {
      configurable: true,
      enumerable: true,
      writable: true,
      value: originalHelper
    },
    label
  );
  assert.equal(Object.isFrozen(originalHelper), true, label);
  assert.deepEqual(
    Reflect.ownKeys(originalHelper)
      .filter((key) => typeof key === "symbol")
      .map((key) => key.description),
    [],
    label
  );

  try {
    try {
      Scheduler[helperName] = fakeHelper;
    } catch (error) {
      assert.equal(error instanceof TypeError, true, label);
    }
    assert.equal(Scheduler[helperName], fakeHelper, label);

    if (helperName === "unstable_flushExpired") {
      assert.equal(
        gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report),
        true,
        `${label}:original-report-with-replaced-helper`
      );
      assertSchedulerMockExpiredDiagnosticsRejected(
        gate,
        cloneExpiredActRootWorkReport(report),
        "scheduler-expired-act-root-diagnostics-source-proof",
        `${label}:cloned-report-with-replaced-helper`
      );
      assertSchedulerMockExpiredDiagnosticsRejectedWithFakeCacheModuleRecord(
        gate,
        report,
        originalDiagnostics,
        `${label}:cloned-report-with-fake-cache-module-record`
      );
    }
  } finally {
    Object.defineProperty(Scheduler, helperName, {
      configurable: true,
      enumerable: true,
      value: originalHelper,
      writable: true
    });
  }
  assert.equal(Scheduler[helperName], originalHelper, label);
  assert.equal(
    Reflect.defineProperty(
      originalHelper,
      Symbol("fast-react.scheduler.mock-expired-act-root-work-source-validator"),
      {
        configurable: false,
        enumerable: false,
        value: createFakeSchedulerSourceValidator(),
        writable: false
      }
    ),
    false,
    label
  );

  const diagnosticsDescriptor = Object.getOwnPropertyDescriptor(
    originalHelper,
    privateActQueueFlushDiagnosticsExport
  );
  assert.equal(diagnosticsDescriptor.configurable, false, label);
  assert.equal(diagnosticsDescriptor.enumerable, false, label);
  assert.equal(diagnosticsDescriptor.writable, false, label);
  assert.equal(Object.isFrozen(diagnosticsDescriptor.value), true, label);
  assert.equal(
    Reflect.defineProperty(
      originalHelper,
      privateActQueueFlushDiagnosticsExport,
      {
        configurable: false,
        enumerable: false,
        value: createFakeSchedulerPrivateDiagnostics(),
        writable: false
      }
    ),
    false,
    label
  );
  assert.equal(
    Reflect.defineProperty(
      diagnosticsDescriptor.value,
      "schedulerMockExpiredActRootWorkSourceValidator",
      {
        configurable: false,
        enumerable: true,
        value: createFakeSchedulerSourceValidator(),
        writable: false
      }
    ),
    false,
    label
  );
}

function installPreinstalledFakeSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecord() {
  const existingDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKey
  );
  if (existingDescriptor !== undefined) {
    return;
  }

  let fakeSourceValidatorRecord = null;
  const fakeGlobalRecord = Object.freeze({
    status:
      privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKind,
    getSchedulerMockExpiredActRootWorkSourceValidatorRecord() {
      return fakeSourceValidatorRecord;
    },
    setSchedulerMockExpiredActRootWorkSourceValidatorRecord(nextRecord) {
      const fakeDiagnostics = createFakeSchedulerPrivateDiagnostics(
        nextRecord?.diagnostics
      );
      fakeSourceValidatorRecord = Object.freeze({
        status:
          privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind,
        diagnostics: fakeDiagnostics,
        schedulerMockExpiredActRootWorkSourceValidator:
          fakeDiagnostics.schedulerMockExpiredActRootWorkSourceValidator
      });
    }
  });

  Object.defineProperty(
    globalThis,
    privateSchedulerMockExpiredActRootWorkSourceValidatorGlobalRecordKey,
    {
      configurable: false,
      enumerable: false,
      value: fakeGlobalRecord,
      writable: false
    }
  );
}

function assertSchedulerMockExpiredDiagnosticsRejectedWithFakeCacheModuleRecord(
  gate,
  report,
  originalDiagnostics,
  label
) {
  const resolvedSchedulerMockEntrypoint = require.resolve(
    path.join(repoRoot, schedulerMockWorkspaceEntrypoint)
  );
  const originalModuleRecord = require.cache[resolvedSchedulerMockEntrypoint];
  const fakeDiagnostics =
    createFakeSchedulerPrivateDiagnostics(originalDiagnostics);
  const fakeModuleRecord = new CommonJsModule(
    resolvedSchedulerMockEntrypoint
  );
  fakeModuleRecord.filename = resolvedSchedulerMockEntrypoint;
  fakeModuleRecord.loaded = true;
  fakeModuleRecord.paths = CommonJsModule._nodeModulePaths(
    path.dirname(resolvedSchedulerMockEntrypoint)
  );
  fakeModuleRecord.exports = {
    unstable_flushExpired:
      createFakeSchedulerFlushHelperWithPrivateDiagnostics(
        originalDiagnostics
      )
  };
  const fakeCjsChildModule = new CommonJsModule(
    path.join(
      repoRoot,
      "packages/scheduler/cjs/scheduler-unstable_mock.development.js"
    ),
    fakeModuleRecord
  );
  fakeCjsChildModule.filename = fakeCjsChildModule.id;
  fakeCjsChildModule.loaded = true;
  fakeCjsChildModule.paths = CommonJsModule._nodeModulePaths(
    path.dirname(fakeCjsChildModule.filename)
  );
  fakeCjsChildModule.exports = {
    unstable_flushExpired: fakeModuleRecord.exports.unstable_flushExpired
  };
  fakeModuleRecord.children.push(fakeCjsChildModule);

  Object.defineProperty(
    fakeModuleRecord,
    privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKey,
    {
      configurable: false,
      enumerable: false,
      value: Object.freeze({
        status:
          privateSchedulerMockExpiredActRootWorkSourceValidatorModuleRecordKind,
        diagnostics: fakeDiagnostics,
        schedulerMockExpiredActRootWorkSourceValidator:
          fakeDiagnostics.schedulerMockExpiredActRootWorkSourceValidator
      }),
      writable: false
    }
  );

  require.cache[resolvedSchedulerMockEntrypoint] = fakeModuleRecord;
  try {
    assertSchedulerMockExpiredDiagnosticsRejected(
      gate,
      cloneExpiredActRootWorkReport(report),
      "scheduler-expired-act-root-diagnostics-source-proof",
      label
    );
  } finally {
    if (originalModuleRecord === undefined) {
      delete require.cache[resolvedSchedulerMockEntrypoint];
    } else {
      require.cache[resolvedSchedulerMockEntrypoint] = originalModuleRecord;
    }
  }
}

function assertSchedulerMockExpiredDiagnosticsRejected(
  gate,
  diagnostics,
  reason,
  label
) {
  assert.equal(
    gate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(diagnostics),
    false,
    label
  );
  assert.throws(
    () => gate.consumeSchedulerMockExpiredActRootWorkDiagnostics(diagnostics),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError", label);
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", label);
      assert.equal(error.reason, reason, label);
      return true;
    },
    label
  );
}

function createFakeSchedulerFlushHelperWithPrivateDiagnostics(
  originalDiagnostics
) {
  const fakeHelper = function () {};
  Object.defineProperty(
    fakeHelper,
    privateActQueueFlushDiagnosticsExport,
    {
      configurable: false,
      enumerable: false,
      value: createFakeSchedulerPrivateDiagnostics(originalDiagnostics),
      writable: false
    }
  );
  return Object.freeze(fakeHelper);
}

function createFakeSchedulerPrivateDiagnostics(originalDiagnostics = {}) {
  return Object.freeze({
    ...originalDiagnostics,
    status: "private-scheduler-act-queue-flush-diagnostics",
    exportName: privateActQueueFlushDiagnosticsExport,
    providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics: true,
    schedulerMockExpiredActRootWorkSourceValidator:
      createFakeSchedulerSourceValidator()
  });
}

function createFakeSchedulerSourceValidator() {
  return Object.freeze({
    status: "fast-react.scheduler.mock-expired-act-root-work-source-validator",
    isSchedulerMockExpiredActRootWorkSource() {
      return true;
    }
  });
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

function deepCloneDelayedActRootWorkDiagnosticsWithOldGlobalSourceProof(
  value
) {
  return deepCloneExpiredActRootWorkDiagnosticsWithOldGlobalSourceProof(value);
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

function cloneActQueueDrainReportWithAlteredContinuationSource(report) {
  const alteredContinuation = cloneFrozenObject(
    report.actQueueDrainReport.drainedRecords[1].returnedContinuation,
    {
      sourceIndex: 0,
      sourceLabel: "act-root-schedule"
    }
  );

  return cloneFrozenObject(report.actQueueDrainReport, {
    drainedRecords: Object.freeze([
      report.actQueueDrainReport.drainedRecords[0],
      cloneFrozenObject(report.actQueueDrainReport.drainedRecords[1], {
        returnedContinuation: alteredContinuation
      })
    ]),
    recordedContinuations: Object.freeze([alteredContinuation]),
    executedContinuations: Object.freeze([alteredContinuation])
  });
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
