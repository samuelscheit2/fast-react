import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const PASSIVE_TIMING_CANARY_MANIFEST =
  "tests/benchmarks/manifests/private-root-update-text-event-passive-timing-canaries.json";

export const ACT_PASSIVE_LOCAL_GATE_ID =
  "act-passive-private-diagnostics-local-gate-1";
export const ACT_PASSIVE_LOCAL_GATE_STATUS =
  "recognized-private-act-passive-diagnostics-without-public-compatibility";
export const ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS =
  "blocked-act-passive-private-diagnostics-with-violations";

export const ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS = Object.freeze([
  "worker-473-test-renderer-act-passive-effect-drain",
  "worker-474-passive-effect-mount-unmount-execution-gate",
  "worker-475-passive-effect-error-routing-gate",
  "worker-482-test-renderer-act-scheduler-flush-gate",
  "worker-483-test-renderer-flush-sync-act-routing-gate",
  "worker-498-benchmark-act-passive-timing-canaries"
]);

const TEST_RENDERER_ENTRYPOINTS = Object.freeze([
  Object.freeze({
    entrypoint: "react-test-renderer",
    modulePath: "packages/react-test-renderer/index.js",
    nodeEnv: "development"
  }),
  Object.freeze({
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.development.js"
  }),
  Object.freeze({
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.production.js"
  })
]);

const OPTIONAL_PASSIVE_MOUNT_UNMOUNT_RECORDS = Object.freeze([
  "PassiveEffectMountCreateCallbackExecutionRecord",
  "PassiveEffectMountCreateCallbackErrorRecord"
]);

const OPTIONAL_PASSIVE_ERROR_ROUTING_RECORDS = Object.freeze([
  "PassiveEffectRootErrorRoutingRecord",
  "PassiveEffectRootErrorRoutingStatus",
  "PassiveEffectCallbackExecutionErrorRecord",
  "PassiveEffectCallbackExecutionErrorHandle",
  "PassiveEffectMountCreateCallbackErrorRecord"
]);

export function evaluateActPassiveLocalGate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  diagnosticOverridesByWorker = {},
  compatibilityOverrides = {},
  benchmarkManifest = readPassiveTimingCanaryManifest({ workspaceRoot })
} = {}) {
  const sources = readLocalSources({ workspaceRoot });
  const reactPrivateActGate = loadFreshCjs(
    workspaceRoot,
    "packages/react/private-act-dispatcher-gate.js"
  );
  const reactDomTestUtilsActGate = loadFreshCjs(
    workspaceRoot,
    "packages/react-dom/src/test-utils-act-gate.js"
  ).evaluateReactDomTestUtilsActPrivateRoutingGate();
  const testRendererActSchedulerGates = TEST_RENDERER_ENTRYPOINTS.map(
    (entrypoint) =>
      inspectTestRendererActSchedulerGate({
        workspaceRoot,
        entrypoint
      })
  );
  const passiveTimingCanary = inspectPassiveTimingCanaryManifest(
    benchmarkManifest
  );
  const baseDiagnostics = createWorkerDiagnostics({
    sources,
    reactPrivateActGate,
    reactDomTestUtilsActGate,
    testRendererActSchedulerGates,
    passiveTimingCanary
  });
  const diagnostics = baseDiagnostics.map((diagnostic) =>
    freezeRecord({
      ...diagnostic,
      ...(diagnosticOverridesByWorker[diagnostic.workerId] ?? {})
    })
  );
  const publicCompatibilityChecks = collectPublicCompatibilityChecks({
    reactPrivateActGate,
    reactDomTestUtilsActGate,
    testRendererActSchedulerGates,
    passiveTimingCanary,
    diagnostics,
    compatibilityOverrides
  });
  const publicCompatibilityViolations = publicCompatibilityChecks.filter(
    (check) => check.value !== false
  );
  const missingPrivateDiagnostics = diagnostics
    .filter((diagnostic) => diagnostic.recognized !== true)
    .map((diagnostic) => diagnostic.workerId);
  const diagnosticCompatibilityClaims = diagnostics
    .filter((diagnostic) => diagnostic.compatibilityClaimed !== false)
    .map((diagnostic) => diagnostic.workerId);
  const violations = [];

  if (missingPrivateDiagnostics.length > 0) {
    violations.push(
      createViolation("required-private-diagnostic-not-recognized", {
        workerIds: missingPrivateDiagnostics
      })
    );
  }

  if (diagnosticCompatibilityClaims.length > 0) {
    violations.push(
      createViolation("private-diagnostic-claimed-compatibility", {
        workerIds: diagnosticCompatibilityClaims
      })
    );
  }

  if (publicCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-or-execution-claim-detected", {
        claimIds: publicCompatibilityViolations.map((check) => check.id)
      })
    );
  }

  return freezeRecord({
    id: ACT_PASSIVE_LOCAL_GATE_ID,
    status:
      violations.length === 0
        ? ACT_PASSIVE_LOCAL_GATE_STATUS
        : ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS,
    queueWorkers: ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS,
    recognizedWorkerIds: diagnostics
      .filter((diagnostic) => diagnostic.recognized === true)
      .map((diagnostic) => diagnostic.workerId),
    privateDiagnosticsRecognized:
      missingPrivateDiagnostics.length === 0 &&
      diagnostics.length === ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS.length,
    compatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityChecks,
    publicCompatibilityViolationIds: publicCompatibilityViolations.map(
      (check) => check.id
    ),
    diagnostics,
    diagnosticsByWorker: freezeRecord(
      Object.fromEntries(
        diagnostics.map((diagnostic) => [diagnostic.workerId, diagnostic])
      )
    ),
    reactPrivateActGate: summarizeReactPrivateActGate(reactPrivateActGate),
    reactDomTestUtilsActGate:
      summarizeReactDomTestUtilsActGate(reactDomTestUtilsActGate),
    testRendererActSchedulerGates,
    passiveTimingCanary,
    violations
  });
}

export function readPassiveTimingCanaryManifest({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  return JSON.parse(
    readWorkspaceFile(workspaceRoot, PASSIVE_TIMING_CANARY_MANIFEST)
  );
}

function createWorkerDiagnostics({
  sources,
  reactPrivateActGate,
  reactDomTestUtilsActGate,
  testRendererActSchedulerGates,
  passiveTimingCanary
}) {
  const allTestRendererGates = testRendererActSchedulerGates.every(
    (gate) => gate.recognized === true
  );
  const allTestRendererGatesKeepPublicExecutionBlocked =
    testRendererActSchedulerGates.every(
      (gate) =>
        gate.publicActBehaviorAvailable === false &&
        gate.publicSchedulerFlushExecutionAvailable === false &&
        gate.publicRootSyncFlushRouteAvailable === false &&
        gate.publicPassiveEffectFlushExecutionAvailable === false &&
        gate.queuedWorkExecution === false &&
        gate.passiveEffectExecution === false &&
        gate.effectCallbackExecution === false &&
        gate.rootRequestExecution === false &&
        gate.hostOutputMutation === false &&
        gate.compatibilityClaimed === false
    );
  const reactDomPassiveHandles =
    reactDomTestUtilsActGate.passiveEffectCallbackHandles ?? {};
  const optionalPassiveMountUnmountRecords = collectPresentTokens(
    sources.passiveEffectsSource,
    OPTIONAL_PASSIVE_MOUNT_UNMOUNT_RECORDS
  );
  const optionalPassiveErrorRoutingRecords = collectPresentTokens(
    sources.passiveEffectsSource,
    OPTIONAL_PASSIVE_ERROR_ROUTING_RECORDS
  );

  return freezeArray([
    freezeRecord({
      workerId: "worker-473-test-renderer-act-passive-effect-drain",
      area: "react-test-renderer private act passive drain",
      recognized:
        allTestRendererGates &&
        testRendererActSchedulerGates.every(
          (gate) =>
            gate.passiveActFlushMetadataAccepted === true &&
            gate.privateFlushExecutionMetadataAccepted === true &&
            gate.privateFlushExecutionReady === false &&
            gate.recognizedPassiveActFlushRecordIds.includes(
              "passive-effects-flush-record"
            ) &&
            gate.recognizedSyncFlushActRecordIds.includes(
              "passive-effects-flush-with-sync-flush-continuation-result"
            )
        ) &&
        allTestRendererGatesKeepPublicExecutionBlocked,
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "passive-effect-flush-metadata",
        "sync-flush-post-passive-private-execution-metadata",
        "passive-effects-flush-with-sync-flush-continuation-result"
      ]),
      publicActCompatibilityClaimed: false,
      publicPassiveEffectExecution: false
    }),
    freezeRecord({
      workerId: "worker-474-passive-effect-mount-unmount-execution-gate",
      area: "private passive create/destroy callback test gate",
      recognized:
        reactDomPassiveHandles.testControlledInvocationOnly === true &&
        reactDomPassiveHandles.invokesCreateCallbacksUnderTestControl ===
          true &&
        reactDomPassiveHandles.invokesDestroyCallbacksUnderTestControl ===
          true &&
        reactDomPassiveHandles.publicEffectExecutionEnabled === false &&
        reactDomPassiveHandles.schedulerDrivenPassiveExecutionEnabled ===
          false &&
        reactDomPassiveHandles.publicActCompatibilityClaimed === false &&
        reactDomPassiveHandles.effectCallbackExecutionReady === false,
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "PassiveEffectCallbackInvocationGateSnapshot",
        "PassiveEffectCallbackInvocationRecord",
        "PassiveEffectCallbackInvocationRequest",
        "PassiveEffectCallbackInvocationTestControl",
        "invoke_passive_effect_callbacks_under_test_control",
        "PassiveEffectDestroyCallbackExecutionRecord",
        ...optionalPassiveMountUnmountRecords
      ]),
      optionalFutureDiagnosticIds: freezeArray(optionalPassiveMountUnmountRecords),
      publicActCompatibilityClaimed: false,
      publicEffectExecutionEnabled: false,
      schedulerDrivenPassiveExecutionEnabled: false
    }),
    freezeRecord({
      workerId: "worker-475-passive-effect-error-routing-gate",
      area: "private passive effect error diagnostics",
      recognized:
        reactDomPassiveHandles.recordsCallbackErrors === true &&
        Array.isArray(reactDomPassiveHandles.invocationRecords) &&
        reactDomPassiveHandles.invocationRecords.includes(
          "PassiveEffectDestroyCallbackErrorRecord"
        ) &&
        reactDomPassiveHandles.publicEffectExecutionEnabled === false &&
        reactDomPassiveHandles.publicActCompatibilityClaimed === false,
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "PassiveEffectDestroyCallbackErrorRecord",
        ...optionalPassiveErrorRoutingRecords
      ]),
      optionalFutureDiagnosticIds: freezeArray(optionalPassiveErrorRoutingRecords),
      publicRootErrorCallbackCompatibilityClaimed: false,
      publicErrorBoundaryCompatibilityClaimed: false,
      publicActErrorAggregationClaimed: false
    }),
    freezeRecord({
      workerId: "worker-482-test-renderer-act-scheduler-flush-gate",
      area: "react-test-renderer private Scheduler flush metadata",
      recognized:
        allTestRendererGates &&
        testRendererActSchedulerGates.every(
          (gate) =>
            gate.schedulerMockFlushHelperMetadataAccepted === true &&
            gate.privateSchedulerActQueueDiagnosticsConsumed === true &&
            gate.privateActQueueDiagnosticConsumptionReady === true &&
            gate.recognizedSchedulerMockFlushHelperKeys.length === 5 &&
            gate.publicSchedulerFlushExecutionAvailable === false &&
            gate.queuedWorkExecution === false &&
            gate.schedulerMockFlushExecution === false
        ),
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
        "private-react-test-renderer-act-queue-diagnostic-consumer",
        "scheduler-mock-flush-helper-metadata"
      ]),
      publicSchedulerFlushExecutionAvailable: false,
      publicSchedulerTimingCompatibilityClaimed: false
    }),
    freezeRecord({
      workerId: "worker-483-test-renderer-flush-sync-act-routing-gate",
      area: "react-test-renderer private flushSync act metadata routing",
      recognized:
        allTestRendererGates &&
        testRendererActSchedulerGates.every(
          (gate) =>
            gate.flushSyncBlocked === true &&
            gate.flushSyncCallbackInvoked === false &&
            gate.syncFlushActRecordsAccepted === true &&
            gate.postPassiveContinuationExecutionGateAccepted === true &&
            gate.privateSyncFlushExecutionMetadataAccepted === true &&
            gate.publicRootSyncFlushRouteAvailable === false &&
            gate.compatibilityClaimed === false
        ),
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "sync-flush-act-continuation-records",
        "sync-flush-post-passive-continuation-execution-gate",
        "sync-flush-post-passive-private-execution-metadata",
        "create().unstable_flushSync"
      ]),
      publicRootSyncFlushRouteAvailable: false,
      publicActCompatibilityClaimed: false
    }),
    freezeRecord({
      workerId: "worker-498-benchmark-act-passive-timing-canaries",
      area: "diagnostic-only private act/passive timing canary",
      recognized:
        passiveTimingCanary.recognized === true &&
        passiveTimingCanary.privatePassiveFlushGate.compatibilityClaimed ===
          false &&
        passiveTimingCanary.privatePassiveFlushScenario.timingStatus ===
          "diagnostic-only" &&
        passiveTimingCanary.publicActTimingPromotionBlocked === true,
      compatibilityClaimed: false,
      acceptedDiagnosticIds: freezeArray([
        "private-passive-flush-gate-timing-canary",
        "react-dom-test-utils-private-passive-flush-diagnostic-gate-1"
      ]),
      timingStatus: passiveTimingCanary.privatePassiveFlushScenario.timingStatus,
      timingDataPolicy: passiveTimingCanary.timingDataPolicy,
      comparablePublicTimingClaimed: false
    })
  ]);
}

function collectPublicCompatibilityChecks({
  reactPrivateActGate,
  reactDomTestUtilsActGate,
  testRendererActSchedulerGates,
  passiveTimingCanary,
  diagnostics,
  compatibilityOverrides
}) {
  const checks = [
    ...expectedFalseFields("react-private-act", reactPrivateActGate, [
      "publicCompatibilityClaimed",
      "queueFlushingReady",
      "rendererRootsReady",
      "passiveEffectsReady",
      "continuationFlushingReady",
      "drainsPublicReactActQueue",
      "executesQueuedWork",
      "executesEffects",
      "executesRendererRoots",
      "publicSchedulerTimingCompatibilityClaimed",
      "publicReactActCompatibilityClaimed"
    ]),
    ...expectedFalseFields("react-dom-test-utils-act", reactDomTestUtilsActGate, [
      "publicCompatibilityClaimed",
      "publicReactActReady",
      "publicTestUtilsActReady",
      "privateRoutingReady"
    ]),
    ...expectedFalseFields(
      "react-dom-test-utils-act.sideEffectPolicy",
      reactDomTestUtilsActGate.sideEffectPolicy ?? {},
      [
        "invokesActCallback",
        "executesQueuedWork",
        "executesPassiveEffects",
        "executesRendererWork",
        "executesRendererRoots",
        "executesPublicRendererRoots",
        "executesPublicDomMutation",
        "executesSyncFlush",
        "executesPublicFlushSync",
        "emitsDeprecationWarning",
        "delegatesToReactAct"
      ]
    ),
    ...expectedFalseFields(
      "react-dom-test-utils-act.passiveEffectCallbackHandles",
      reactDomTestUtilsActGate.passiveEffectCallbackHandles ?? {},
      [
        "invokesCreateCallbacks",
        "invokesDestroyCallbacks",
        "publicEffectExecutionEnabled",
        "schedulerDrivenPassiveExecutionEnabled",
        "publicActCompatibilityClaimed",
        "effectCallbackExecutionReady"
      ]
    ),
    ...expectedFalseFields(
      "benchmark.private-passive-flush-gate",
      passiveTimingCanary.privatePassiveFlushGate,
      ["compatibilityClaimed"]
    ),
    freezeRecord({
      id: "benchmark.public-act-timing-promotion-admitted",
      value: passiveTimingCanary.publicActTimingPromotionAdmitted
    }),
    freezeRecord({
      id: "benchmark.public-act-timing-compatibility-claimed",
      value: passiveTimingCanary.publicActTimingCompatibilityClaimed
    })
  ];

  for (const gate of testRendererActSchedulerGates) {
    checks.push(
      ...expectedFalseFields(
        `react-test-renderer-act-scheduler:${gate.entrypoint}`,
        gate,
        [
          "publicActBehaviorAvailable",
          "publicSchedulerFlushExecutionAvailable",
          "publicRootSyncFlushRouteAvailable",
          "publicPassiveEffectFlushExecutionAvailable",
          "privateRootRequestExecutionAvailable",
          "schedulerFlushCompatibilityClaimed",
          "schedulerMockFlushExecution",
          "queuedWorkExecution",
          "passiveEffectExecution",
          "effectCallbackExecution",
          "rootRequestExecution",
          "hostOutputMutation",
          "rendererRootsCompatibilityClaimed",
          "compatibilityClaimed"
        ]
      ),
      ...expectedFalseFields(
        `react-test-renderer-act-scheduler:${gate.entrypoint}.sideEffectPolicy`,
        gate.sideEffectPolicy,
        [
          "invokesActCallback",
          "executesQueuedWork",
          "executesScheduledCallbacks",
          "executesSyncFlush",
          "executesPassiveEffects",
          "executesRootRequests",
          "mutatesHostOutput",
          "drainsPublicSchedulerTaskQueue",
          "drainsPublicReactActQueue",
          "executesPublicSchedulerTasks",
          "publicSchedulerTimingCompatibilityClaimed",
          "publicReactActCompatibilityClaimed",
          "compatibilityClaimed"
        ]
      )
    );
  }

  for (const diagnostic of diagnostics) {
    checks.push(
      freezeRecord({
        id: `${diagnostic.workerId}.compatibilityClaimed`,
        value: diagnostic.compatibilityClaimed
      })
    );
  }

  for (const [id, value] of Object.entries(compatibilityOverrides)) {
    checks.push(
      freezeRecord({
        id: `override.${id}`,
        value
      })
    );
  }

  return freezeArray(checks);
}

function inspectTestRendererActSchedulerGate({ workspaceRoot, entrypoint }) {
  const moduleExports = loadFreshCjsWithNodeEnv(
    workspaceRoot,
    entrypoint.modulePath,
    entrypoint.nodeEnv
  );
  let flushSyncCallbackInvoked = false;
  let renderer = null;
  let createError = null;
  try {
    renderer = moduleExports.create(null);
  } catch (error) {
    createError = error;
  }

  const flushSyncError =
    renderer && typeof renderer.unstable_flushSync === "function"
      ? captureThrown(() =>
          renderer.unstable_flushSync(() => {
            flushSyncCallbackInvoked = true;
          })
        )
      : null;
  const gate =
    flushSyncError?.actSchedulerGate ??
    flushSyncError?.routingGate?.actSchedulerGate ??
    null;
  const privateDiagnostics =
    moduleExports._Scheduler?.unstable_flushAllWithoutAsserting?.[
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
    ];

  return freezeRecord({
    entrypoint: entrypoint.entrypoint,
    modulePath: entrypoint.modulePath,
    recognized:
      gate?.id === "react-test-renderer-act-scheduler-private-gate" &&
      gate?.status ===
        "blocked-private-react-test-renderer-act-scheduler-metadata-only",
    createError: createError ? describeThrown(createError) : null,
    flushSyncBlocked:
      flushSyncError?.code === "FAST_REACT_UNIMPLEMENTED" &&
      flushSyncError?.exportName === "create().unstable_flushSync",
    flushSyncCallbackInvoked,
    flushSyncError: flushSyncError ? describeThrown(flushSyncError) : null,
    schedulerDiagnostics: privateDiagnostics
      ? summarizePrivateActQueueDiagnostics(privateDiagnostics)
      : null,
    ...summarizeTestRendererActSchedulerGate(gate)
  });
}

function summarizeTestRendererActSchedulerGate(gate) {
  if (!gate) {
    return {
      id: null,
      status: null,
      acceptedWorkers: freezeArray([]),
      recognizedSchedulerMockFlushHelperKeys: freezeArray([]),
      recognizedSyncFlushActRecordIds: freezeArray([]),
      recognizedPassiveActFlushRecordIds: freezeArray([]),
      sideEffectPolicy: freezeRecord({})
    };
  }

  return {
    id: gate.id,
    status: gate.status,
    deterministic: gate.deterministic,
    acceptedWorkers: freezeArray(gate.acceptedWorkers ?? []),
    publicActBehaviorAvailable: gate.publicActBehaviorAvailable,
    publicSchedulerFlushExecutionAvailable:
      gate.publicSchedulerFlushExecutionAvailable,
    publicRootSyncFlushRouteAvailable: gate.publicRootSyncFlushRouteAvailable,
    publicPassiveEffectFlushExecutionAvailable:
      gate.publicPassiveEffectFlushExecutionAvailable,
    privateRootRequestExecutionAvailable:
      gate.privateRootRequestExecutionAvailable,
    schedulerFlushCompatibilityClaimed:
      gate.schedulerFlushCompatibilityClaimed,
    schedulerMockFlushExecution: gate.schedulerMockFlushExecution,
    queuedWorkExecution: gate.queuedWorkExecution,
    passiveEffectExecution: gate.passiveEffectExecution,
    effectCallbackExecution: gate.effectCallbackExecution,
    rootRequestExecution: gate.rootRequestExecution,
    hostOutputMutation: gate.hostOutputMutation,
    rendererRootsCompatibilityClaimed: gate.rendererRootsCompatibilityClaimed,
    compatibilityClaimed: gate.compatibilityClaimed,
    reactActPrivateDispatcherGateAccepted:
      gate.reactActPrivateDispatcherGateAccepted,
    schedulerReactActQueueDiagnosticsAccepted:
      gate.schedulerReactActQueueDiagnosticsAccepted,
    privateSchedulerActQueueDiagnosticsConsumed:
      gate.privateSchedulerActQueueDiagnosticsConsumed,
    privateActQueueDiagnosticConsumptionReady:
      gate.privateActQueueDiagnosticConsumptionReady,
    schedulerMockFlushHelperMetadataAccepted:
      gate.schedulerMockFlushHelperMetadataAccepted,
    rootActRecordsAccepted: gate.rootActRecordsAccepted,
    syncFlushActRecordsAccepted: gate.syncFlushActRecordsAccepted,
    postPassiveContinuationExecutionGateAccepted:
      gate.postPassiveContinuationExecutionGateAccepted,
    passiveActFlushMetadataAccepted: gate.passiveActFlushMetadataAccepted,
    rootRequestRecordsAccepted: gate.rootRequestRecordsAccepted,
    privateFlushExecutionMetadataAccepted:
      gate.privateFlushExecutionMetadataAccepted,
    privateSyncFlushExecutionMetadataAccepted:
      gate.privateSyncFlushExecutionMetadataAccepted,
    privatePassiveCallbackExecutionMetadataAccepted:
      gate.privatePassiveCallbackExecutionMetadataAccepted,
    privateRootOutputDiagnosticsAccepted:
      gate.privateRootOutputDiagnosticsAccepted,
    privateFlushPrerequisitesPresent: gate.privateFlushPrerequisitesPresent,
    privateFlushExecutionReady: gate.privateFlushExecutionReady,
    acceptedPrivateFlushPrerequisiteIds: freezeArray(
      gate.acceptedPrivateFlushPrerequisiteIds ?? []
    ),
    blockedPrivateFlushPrerequisiteIds: freezeArray(
      gate.blockedPrivateFlushPrerequisiteIds ?? []
    ),
    recognizedSchedulerMockFlushHelperKeys: freezeArray(
      (gate.recognizedSchedulerMockFlushHelpers ?? []).map(
        (record) => record.key
      )
    ),
    recognizedSyncFlushActRecordIds: freezeArray(
      (gate.recognizedSyncFlushActRecords ?? []).map((record) => record.id)
    ),
    recognizedPassiveActFlushRecordIds: freezeArray(
      (gate.recognizedPassiveActFlushRecords ?? []).map((record) => record.id)
    ),
    recognizedRootActFlushRecordIds: freezeArray(
      (gate.recognizedRootActFlushRecords ?? []).map((record) => record.id)
    ),
    sideEffectPolicy: freezeRecord({ ...(gate.sideEffectPolicy ?? {}) })
  };
}

function summarizePrivateActQueueDiagnostics(diagnostics) {
  return freezeRecord({
    status: diagnostics.status,
    schedulerDiagnosticStatus: diagnostics.schedulerDiagnosticStatus,
    exportName: diagnostics.exportName,
    consumer: diagnostics.consumer,
    gateStatus: diagnostics.gateStatus,
    drainsAcceptedInternalTestQueues:
      diagnostics.drainsAcceptedInternalTestQueues,
    drainsPublicSchedulerTaskQueue: diagnostics.drainsPublicSchedulerTaskQueue,
    drainsPublicReactActQueue: diagnostics.drainsPublicReactActQueue,
    publicSchedulerTimingCompatibilityClaimed:
      diagnostics.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed:
      diagnostics.publicReactActCompatibilityClaimed,
    compatibilityClaimed: diagnostics.compatibilityClaimed,
    executesQueuedWork: diagnostics.executesQueuedWork,
    executesEffects: diagnostics.executesEffects,
    invokesActCallback: diagnostics.invokesActCallback
  });
}

function inspectPassiveTimingCanaryManifest(manifest) {
  const privatePassiveFlushGate =
    findConformanceGate(
      manifest,
      "react-dom-test-utils-private-passive-flush-gate"
    )?.acceptedGate ?? {};
  const publicActCompatibilityGate =
    findConformanceGate(
      manifest,
      "react-dom-test-utils-act-public-compatibility"
    )?.acceptedGate ?? {};
  const privatePassiveFlushScenario =
    findScenario(manifest, "private-passive-flush-gate-timing-canary") ?? {};
  const publicPromotionMilestone =
    findMilestone(
      manifest,
      "private-root-update-text-event-passive-public-timing-promotion-blocked"
    ) ?? {};

  return freezeRecord({
    manifestId: manifest?.manifestId ?? null,
    kind: manifest?.kind ?? null,
    timingDataPolicy: manifest?.timingDataPolicy ?? null,
    recognized:
      manifest?.kind === "fast-react-benchmark-manifest" &&
      manifest?.manifestId ===
        "private-root-update-text-event-passive-timing-canaries" &&
      manifest?.timingDataPolicy === "diagnostic-until-compatible" &&
      privatePassiveFlushGate.id ===
        "react-dom-test-utils-private-passive-flush-diagnostic-gate-1" &&
      privatePassiveFlushGate.status === "accepted-private-partial" &&
      privatePassiveFlushGate.admitted === true &&
      privatePassiveFlushGate.compatibilityClaimed === false &&
      privatePassiveFlushScenario.timingStatus === "diagnostic-only" &&
      privatePassiveFlushScenario.timingDataPolicy ===
        "diagnostic-until-compatible" &&
      publicActCompatibilityGate.status === "accepted-blocked" &&
      publicActCompatibilityGate.admitted === false &&
      publicActCompatibilityGate.compatibilityClaimed === false &&
      publicPromotionMilestone.timingStatus === "blocked-by-conformance",
    privatePassiveFlushGate: freezeRecord({
      id: privatePassiveFlushGate.id ?? null,
      status: privatePassiveFlushGate.status ?? null,
      admitted: privatePassiveFlushGate.admitted,
      compatibilityClaimed: privatePassiveFlushGate.compatibilityClaimed,
      notes: privatePassiveFlushGate.notes ?? null
    }),
    publicActCompatibilityGate: freezeRecord({
      id: publicActCompatibilityGate.id ?? null,
      status: publicActCompatibilityGate.status ?? null,
      admitted: publicActCompatibilityGate.admitted,
      compatibilityClaimed: publicActCompatibilityGate.compatibilityClaimed,
      notes: publicActCompatibilityGate.notes ?? null
    }),
    privatePassiveFlushScenario: freezeRecord({
      id: privatePassiveFlushScenario.id ?? null,
      timingStatus: privatePassiveFlushScenario.timingStatus ?? null,
      timingDataPolicy: privatePassiveFlushScenario.timingDataPolicy ?? null,
      compatibilityStatus:
        privatePassiveFlushScenario.compatibilityStatus ?? null,
      blockedReason: privatePassiveFlushScenario.blockedReason ?? null
    }),
    publicPromotionMilestone: freezeRecord({
      id: publicPromotionMilestone.id ?? null,
      compatibilityStatus: publicPromotionMilestone.compatibilityStatus ?? null,
      timingStatus: publicPromotionMilestone.timingStatus ?? null,
      benchmarkReadinessStatus:
        publicPromotionMilestone.benchmarkReadinessStatus ?? null
    }),
    publicActTimingPromotionAdmitted:
      publicActCompatibilityGate.admitted === true ||
      publicPromotionMilestone.timingStatus !== "blocked-by-conformance",
    publicActTimingPromotionBlocked:
      publicActCompatibilityGate.admitted === false &&
      publicPromotionMilestone.timingStatus === "blocked-by-conformance",
    publicActTimingCompatibilityClaimed:
      publicActCompatibilityGate.compatibilityClaimed === true
  });
}

function summarizeReactPrivateActGate(gate) {
  return freezeRecord({
    status: gate.status,
    schedulerDiagnosticsStatus: gate.schedulerDiagnosticsStatus,
    rendererBackedActDrainDiagnosticsStatus:
      gate.rendererBackedActDrainDiagnosticsStatus,
    rendererBackedActDrainConsumptionStatus:
      gate.rendererBackedActDrainConsumptionStatus,
    requiredRecords: freezeArray(gate.requiredRecords ?? []),
    acceptedPrivateActContinuationDrainRecords: freezeArray(
      gate.acceptedPrivateActContinuationDrainRecords ?? []
    ),
    acceptedRendererBackedActDrainReconcilerRecords: freezeArray(
      gate.acceptedRendererBackedActDrainReconcilerRecords ?? []
    ),
    acceptedRendererBackedActDrainRendererRecords: freezeArray(
      gate.acceptedRendererBackedActDrainRendererRecords ?? []
    ),
    publicCompatibilityClaimed: gate.publicCompatibilityClaimed,
    queueFlushingReady: gate.queueFlushingReady,
    rendererRootsReady: gate.rendererRootsReady,
    passiveEffectsReady: gate.passiveEffectsReady,
    continuationFlushingReady: gate.continuationFlushingReady,
    drainsPublicReactActQueue: gate.drainsPublicReactActQueue,
    executesQueuedWork: gate.executesQueuedWork,
    executesEffects: gate.executesEffects,
    executesRendererRoots: gate.executesRendererRoots,
    publicSchedulerTimingCompatibilityClaimed:
      gate.publicSchedulerTimingCompatibilityClaimed,
    publicReactActCompatibilityClaimed:
      gate.publicReactActCompatibilityClaimed
  });
}

function summarizeReactDomTestUtilsActGate(gate) {
  return freezeRecord({
    id: gate.id,
    status: gate.status,
    publicCompatibilityClaimed: gate.publicCompatibilityClaimed,
    publicReactActReady: gate.publicReactActReady,
    publicTestUtilsActReady: gate.publicTestUtilsActReady,
    privateRoutingReady: gate.privateRoutingReady,
    privatePrerequisitesPresent: gate.privatePrerequisitesPresent,
    acceptedPrivatePrerequisiteIds: freezeArray(
      gate.acceptedPrivatePrerequisiteIds ?? []
    ),
    blockedPublicPrerequisiteIds: freezeArray(
      gate.blockedPublicPrerequisiteIds ?? []
    ),
    passiveEffectCallbackHandles: freezeRecord({
      ...(gate.passiveEffectCallbackHandles ?? {}),
      records: freezeArray(gate.passiveEffectCallbackHandles?.records ?? []),
      invocationRecords: freezeArray(
        gate.passiveEffectCallbackHandles?.invocationRecords ?? []
      ),
      invocationBlockers: freezeArray(
        gate.passiveEffectCallbackHandles?.invocationBlockers ?? []
      ),
      phaseRules: freezeArray(gate.passiveEffectCallbackHandles?.phaseRules ?? [])
    }),
    sideEffectPolicy: freezeRecord({ ...(gate.sideEffectPolicy ?? {}) })
  });
}

function expectedFalseFields(prefix, record, fields) {
  return fields.map((field) =>
    freezeRecord({
      id: `${prefix}.${field}`,
      value: record?.[field]
    })
  );
}

function collectPresentTokens(sourceText, tokens) {
  return tokens.filter((token) => sourceText.includes(token));
}

function findConformanceGate(manifest, id) {
  return manifest?.conformanceGates?.find((gate) => gate.id === id) ?? null;
}

function findScenario(manifest, id) {
  return manifest?.scenarios?.find((scenario) => scenario.id === id) ?? null;
}

function findMilestone(manifest, id) {
  return manifest?.milestones?.find((milestone) => milestone.id === id) ?? null;
}

function readLocalSources({ workspaceRoot }) {
  return freezeRecord({
    passiveEffectsSource: readWorkspaceFile(
      workspaceRoot,
      "crates/fast-react-reconciler/src/passive_effects.rs"
    )
  });
}

function captureThrown(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  return null;
}

function describeThrown(error) {
  return freezeRecord({
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    entrypoint: error?.entrypoint ?? null,
    exportName: error?.exportName ?? null,
    compatibilityTarget: error?.compatibilityTarget ?? null,
    actSchedulerGateStatus: error?.actSchedulerGateStatus ?? null
  });
}

function loadFreshCjsWithNodeEnv(workspaceRoot, relativePath, nodeEnv) {
  if (!nodeEnv) {
    return loadFreshCjs(workspaceRoot, relativePath);
  }

  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    return loadFreshCjs(workspaceRoot, relativePath);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function loadFreshCjs(workspaceRoot, relativePath) {
  const absolutePath = join(workspaceRoot, relativePath);
  const resolved = require.resolve(absolutePath);
  delete require.cache[resolved];

  try {
    return require(resolved);
  } finally {
    delete require.cache[resolved];
  }
}

function readWorkspaceFile(workspaceRoot, relativePath) {
  const path = join(workspaceRoot, relativePath);
  if (!existsSync(path)) {
    return "";
  }

  return readFileSync(path, "utf8");
}

function createViolation(id, extra = {}) {
  return freezeRecord({
    id,
    ...extra
  });
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}
