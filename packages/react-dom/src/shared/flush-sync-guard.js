'use strict';

const {
  compatibilityTarget,
  createUnsupportedError
} = require('../../placeholder-utils.js');

const flushSyncGuardErrorCode = 'FAST_REACT_DOM_FLUSH_SYNC_GUARD';
const flushSyncReentrantWarning =
  'flushSync was called from inside a lifecycle method. React cannot ' +
  'flush when React is already rendering. Consider moving this call to ' +
  'a scheduler task or micro task.';
const privateFlushSyncGuardExport =
  '__FAST_REACT_DOM_PRIVATE_FLUSH_SYNC_GUARD__';
const publicFlushSyncBlockedCurrentnessKind =
  'fast-react.react-dom.public-flush-sync-blocked-currentness';
const publicFlushSyncBlockedCurrentnessVersion = 1;
const publicFlushSyncBlockedCurrentnessStatus =
  'blocked-public-react-dom-flush-sync-unsupported-placeholder-currentness';
const publicFlushSyncBlockedCurrentnessConsumptionStatus =
  'accepted-blocked-public-react-dom-flush-sync-currentness';
const publicFlushSyncBlockedCurrentnessEntrypoints = freezeArray([
  'react-dom',
  'react-dom/profiling'
]);
const publicFlushSyncBlockedCurrentnessSourceRowVersion = 1;
const publicFlushSyncBlockedCurrentnessSourceRowSpecs = freezeRecords([
  {
    rowId: 'react-dom-public-flush-sync-placeholder-source',
    entrypoint: 'react-dom',
    packageSource: 'packages/react-dom/index.js'
  },
  {
    rowId: 'react-dom-profiling-public-flush-sync-placeholder-source',
    entrypoint: 'react-dom/profiling',
    packageSource: 'packages/react-dom/profiling.js'
  }
]);
const publicFlushSyncBlockedCurrentnessScenarios = freezeArray([
  'rootless-sync-callback',
  'rootless-error-callback',
  'rootless-thenable-callback'
]);
const publicFlushSyncBlockedCurrentnessAcceptedWorkerIds = freezeArray([
  'worker-694-sync-flush-nested-act-root-continuation',
  'worker-718-sync-flush-root-scheduler-finished-work-handoff',
  'worker-901-react-dom-render-lifecycle-boundary-consumer'
]);
const publicFlushSyncBlockedCurrentnessExcludedWorkerIds = freezeArray([
  'worker-910-hydration-recoverable-error-boundary-admission'
]);
const publicFlushSyncBlockedCurrentnessPackageClaimFields = freezeArray([
  'publicPackageCompatibilityClaimed',
  'packageCompatibilityClaimed',
  'packageSurfaceChanged',
  'profilingCompatibilityClaimed',
  'profilingPackageCompatibilityClaimed'
]);
const publicFlushSyncBlockedCurrentnessPublicClaimFields = freezeArray([
  'publicCompatibilityClaimed',
  'publicFlushSyncCompatibilityClaimed',
  'publicProfilingFlushSyncCompatibilityClaimed',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicActTimingCompatibilityClaimed',
  'publicActCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicTestUtilsActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRootCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'publicWarningCompatibilityClaimed',
  'compatibilityClaimed'
]);
const publicFlushSyncBlockedCurrentnessExecutionClaimFields = freezeArray([
  'publicFlushSyncReady',
  'privateRoutingReady',
  'privateSyncFlushRowsOpenPublicCallbackExecution',
  'queueFlushingReady',
  'rendererRootsReady',
  'passiveEffectsReady',
  'continuationFlushingReady',
  'publicRootExecution',
  'publicRootLifecycleReady',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'invokesPublicSchedulerFlushHelper',
  'publicSchedulerFlushBehaviorExecuted',
  'publicActPassiveDrain',
  'publicEffectExecution',
  'executesQueuedWork',
  'executesEffects',
  'executesPassiveEffects',
  'executesRendererWork',
  'executesRendererRoots',
  'executesPublicRendererRoots',
  'executesSyncFlush',
  'executesPublicFlushSync',
  'executesPublicDomMutation'
]);
const publicFlushSyncBlockedCurrentnessNativeRustClaimFields = freezeArray([
  'publicNativeCompatibilityClaimed',
  'nativeCompatibilityClaimed',
  'nativeExecution',
  'nativeExecutionClaimed',
  'publicNativeExecutionClaimed',
  'nativeBridgeAvailable',
  'nativeBridgeCompatibilityClaimed',
  'nativeBridgeExecutionClaimed',
  'nativeRuntimeExecution',
  'nativeRuntimeExecutionClaimed',
  'nativeRuntimeCompatibilityClaimed',
  'publicRustCompatibilityClaimed',
  'rustCompatibilityClaimed',
  'rustExecution',
  'rustExecutionClaimed',
  'rustRuntimeExecution',
  'rustRuntimeExecutionClaimed',
  'rustRuntimeCompatibilityClaimed',
  'rustBridgeAvailable',
  'rustBridgeCompatibilityClaimed',
  'rustBridgeExecutionClaimed'
]);
const publicFlushSyncBlockedCurrentnessSourceIdentityClaimFields = freezeArray([
  'invokesCallback',
  'returnsThenable',
  'returnValueCompatibilityClaimed',
  ...publicFlushSyncBlockedCurrentnessPackageClaimFields,
  ...publicFlushSyncBlockedCurrentnessPublicClaimFields,
  ...publicFlushSyncBlockedCurrentnessExecutionClaimFields,
  ...publicFlushSyncBlockedCurrentnessNativeRustClaimFields
]);
const privateNestedActRootContinuationPrerequisiteId =
  'sync-flush-nested-act-root-continuation-evidence';
const privateSyncFlushFinishedWorkHandoffPrerequisiteId =
  'sync-flush-root-scheduler-finished-work-handoff-evidence';
const privateSyncFlushRootHandoffPrerequisiteIds = freezeArray([
  privateNestedActRootContinuationPrerequisiteId,
  privateSyncFlushFinishedWorkHandoffPrerequisiteId
]);
const privateSyncFlushRootHandoffStatus =
  'accepted-private-test-utils-act-sync-flush-root-handoff-diagnostics-without-public-act-routing';
const privateNestedActRootContinuationStatus =
  'accepted-private-sync-flush-nested-act-root-continuation-without-public-act-flushsync';
const privateSyncFlushFinishedWorkHandoffStatus =
  'accepted-private-sync-flush-root-scheduler-finished-work-handoff-without-public-root-execution';
const publicRootBlockedLifecycleWorkerId =
  'worker-901-react-dom-render-lifecycle-boundary-consumer';
const publicRootBlockedLifecycleProgressPath =
  'worker-progress/worker-901-react-dom-render-lifecycle-boundary-consumer.md';
const publicFlushSyncBlockedCurrentnessAcceptedPrivateRows = freezeRecords([
  {
    id: privateNestedActRootContinuationPrerequisiteId,
    workerId: 'worker-694-sync-flush-nested-act-root-continuation',
    status: privateNestedActRootContinuationStatus,
    source:
      'worker-progress/worker-694-sync-flush-nested-act-root-continuation.md',
    sourceOwned: true,
    evidenceFresh: true,
    staleEvidenceRejected: true,
    consumesNestedActContinuationEvidence: true,
    publicCallbackExecution: false,
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    compatibilityClaimed: false
  },
  {
    id: privateSyncFlushFinishedWorkHandoffPrerequisiteId,
    workerId: 'worker-718-sync-flush-root-scheduler-finished-work-handoff',
    status: privateSyncFlushFinishedWorkHandoffStatus,
    source:
      'worker-progress/worker-718-sync-flush-root-scheduler-finished-work-handoff.md',
    sourceOwned: true,
    evidenceFresh: true,
    staleEvidenceRejected: true,
    consumesFinishedWorkHandoffEvidence: true,
    requiresFinishedWork: true,
    requiresFinishedLanes: true,
    publicCallbackExecution: false,
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    compatibilityClaimed: false
  },
  {
    id: 'public-root-blocked-lifecycle-context',
    workerId: publicRootBlockedLifecycleWorkerId,
    status: 'accepted-public-root-blocked-lifecycle-context',
    source: publicRootBlockedLifecycleProgressPath,
    sourceOwned: true,
    lifecycleRequestBoundaryReady: true,
    publicRootStillBlocked: true,
    publicCallbackExecution: false,
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    compatibilityClaimed: false
  }
]);
const publicFlushSyncBlockedCurrentnessReports = new WeakSet();
const publicFlushSyncBlockedCurrentnessReportOverrideKeys = new WeakMap();
const publicFlushSyncBlockedCurrentnessSourceRowsByReport = new WeakMap();

function isDevelopmentMode(options) {
  if (options && typeof options.development === 'boolean') {
    return options.development;
  }
  return process.env.NODE_ENV !== 'production';
}

function createFlushSyncGuardError(message) {
  const error = new Error(message);
  error.name = 'FastReactDomFlushSyncGuardError';
  error.code = flushSyncGuardErrorCode;
  return error;
}

function getDispatcherFlushSyncWork(dispatcher) {
  if (
    dispatcher == null ||
    typeof dispatcher !== 'object' ||
    typeof dispatcher.f !== 'function'
  ) {
    throw createFlushSyncGuardError(
      'React DOM flushSync guard requires a private dispatcher with flushSyncWork.'
    );
  }

  return dispatcher.f;
}

function reportFlushSyncReentrantWarning(options) {
  const logger = (options && options.console) || console;
  if (logger && typeof logger.error === 'function') {
    logger.error(flushSyncReentrantWarning);
    return true;
  }
  return false;
}

function finishFlushSyncGuard(dispatcher, options) {
  const flushSyncWork = getDispatcherFlushSyncWork(dispatcher);
  const wasInRender = flushSyncWork() === true;

  if (wasInRender && isDevelopmentMode(options)) {
    reportFlushSyncReentrantWarning(options);
  }

  return wasInRender;
}

function createPublicReactDomFlushSyncBlockedCurrentnessReport(
  overrides = {}
) {
  const normalizedOptions = captureOwnDataOptions(
    overrides,
    arguments.length > 0
  );
  const optionValues = normalizedOptions.values;
  const hasSourceRowsOverride = Object.prototype.hasOwnProperty.call(
    optionValues,
    'sourceRows'
  );
  const sourceRows = hasSourceRowsOverride
    ? freezePublicFlushSyncBlockedCurrentnessSourceRows(
        optionValues.sourceRows
      )
    : createPublicFlushSyncBlockedCurrentnessSourceRows(
        optionValues.sourceRowOverrides
      );
  const publicFlushSyncExports = freezeArray(
    (
      optionValues.publicFlushSyncExports ??
      publicFlushSyncBlockedCurrentnessEntrypoints.map((entrypoint) =>
        describePublicFlushSyncCurrentnessExport(
          entrypoint,
          loadPublicFlushSyncEntrypoint(entrypoint)
        )
      )
    ).map(freezePublicFlushSyncExportShape)
  );
  const scenarios = freezeArray(
    (
      optionValues.scenarios ??
      createPublicFlushSyncBlockedCurrentnessScenarios()
    ).map(freezePublicFlushSyncBlockedCurrentnessScenario)
  );
  const report = freezeRecord({
    kind:
      optionValues.kind ?? publicFlushSyncBlockedCurrentnessKind,
    version:
      optionValues.version ?? publicFlushSyncBlockedCurrentnessVersion,
    status:
      optionValues.status ?? publicFlushSyncBlockedCurrentnessStatus,
    source:
      optionValues.source ??
      'packages/react-dom/src/shared/flush-sync-guard.js',
    compatibilityTarget:
      optionValues.compatibilityTarget ?? compatibilityTarget,
    entrypoints: freezeStringArray(
      optionValues.entrypoints,
      publicFlushSyncBlockedCurrentnessEntrypoints
    ),
    scenarioIds: freezeStringArray(
      optionValues.scenarioIds,
      publicFlushSyncBlockedCurrentnessScenarios
    ),
    sourceRows,
    scenarios,
    publicFlushSyncExports,
    acceptedWorkerIds: freezeStringArray(
      optionValues.acceptedWorkerIds,
      publicFlushSyncBlockedCurrentnessAcceptedWorkerIds
    ),
    excludedWorkerIds: freezeStringArray(
      optionValues.excludedWorkerIds,
      publicFlushSyncBlockedCurrentnessExcludedWorkerIds
    ),
    privatePrerequisites:
      createPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(
        optionValues.privatePrerequisites
      ),
    callbackInvocationBlocked:
      optionValues.callbackInvocationBlocked ?? true,
    thenableReturnBlocked:
      optionValues.thenableReturnBlocked ?? true,
    returnValueCompatibilityBlocked:
      optionValues.returnValueCompatibilityBlocked ?? true,
    invokesCallback: optionValues.invokesCallback ?? false,
    returnsThenable: optionValues.returnsThenable ?? false,
    returnValueCompatibilityClaimed:
      optionValues.returnValueCompatibilityClaimed ?? false,
    publicFlushSyncReady:
      optionValues.publicFlushSyncReady ?? false,
    privateRoutingReady: optionValues.privateRoutingReady ?? false,
    privateSyncFlushRowsOpenPublicCallbackExecution:
      optionValues.privateSyncFlushRowsOpenPublicCallbackExecution ??
      false,
    queueFlushingReady: optionValues.queueFlushingReady ?? false,
    rendererRootsReady: optionValues.rendererRootsReady ?? false,
    passiveEffectsReady: optionValues.passiveEffectsReady ?? false,
    continuationFlushingReady:
      optionValues.continuationFlushingReady ?? false,
    publicCompatibilityClaimed:
      optionValues.publicCompatibilityClaimed ?? false,
    publicFlushSyncCompatibilityClaimed:
      optionValues.publicFlushSyncCompatibilityClaimed ?? false,
    publicProfilingFlushSyncCompatibilityClaimed:
      optionValues.publicProfilingFlushSyncCompatibilityClaimed ??
      false,
    publicSchedulerTimingCompatibilityClaimed:
      optionValues.publicSchedulerTimingCompatibilityClaimed ?? false,
    publicActTimingCompatibilityClaimed:
      optionValues.publicActTimingCompatibilityClaimed ?? false,
    publicActCompatibilityClaimed:
      optionValues.publicActCompatibilityClaimed ?? false,
    publicReactActCompatibilityClaimed:
      optionValues.publicReactActCompatibilityClaimed ?? false,
    publicTestUtilsActCompatibilityClaimed:
      optionValues.publicTestUtilsActCompatibilityClaimed ?? false,
    publicRootSchedulerCompatibilityClaimed:
      optionValues.publicRootSchedulerCompatibilityClaimed ?? false,
    publicRootCompatibilityClaimed:
      optionValues.publicRootCompatibilityClaimed ?? false,
    publicRendererCompatibilityClaimed:
      optionValues.publicRendererCompatibilityClaimed ?? false,
    publicWarningCompatibilityClaimed:
      optionValues.publicWarningCompatibilityClaimed ?? false,
    publicPackageCompatibilityClaimed:
      optionValues.publicPackageCompatibilityClaimed ?? false,
    packageCompatibilityClaimed:
      optionValues.packageCompatibilityClaimed ?? false,
    packageSurfaceChanged: optionValues.packageSurfaceChanged ?? false,
    profilingCompatibilityClaimed:
      optionValues.profilingCompatibilityClaimed ?? false,
    profilingPackageCompatibilityClaimed:
      optionValues.profilingPackageCompatibilityClaimed ?? false,
    publicRootExecution: optionValues.publicRootExecution ?? false,
    publicRootLifecycleReady:
      optionValues.publicRootLifecycleReady ?? false,
    drainsPublicSchedulerTaskQueue:
      optionValues.drainsPublicSchedulerTaskQueue ?? false,
    drainsPublicReactActQueue:
      optionValues.drainsPublicReactActQueue ?? false,
    invokesPublicSchedulerFlushHelper:
      optionValues.invokesPublicSchedulerFlushHelper ?? false,
    publicSchedulerFlushBehaviorExecuted:
      optionValues.publicSchedulerFlushBehaviorExecuted ?? false,
    publicActPassiveDrain:
      optionValues.publicActPassiveDrain ?? false,
    publicEffectExecution:
      optionValues.publicEffectExecution ?? false,
    executesQueuedWork: optionValues.executesQueuedWork ?? false,
    executesEffects: optionValues.executesEffects ?? false,
    executesPassiveEffects:
      optionValues.executesPassiveEffects ?? false,
    executesRendererWork:
      optionValues.executesRendererWork ?? false,
    executesRendererRoots:
      optionValues.executesRendererRoots ?? false,
    executesPublicRendererRoots:
      optionValues.executesPublicRendererRoots ?? false,
    executesSyncFlush: optionValues.executesSyncFlush ?? false,
    executesPublicFlushSync:
      optionValues.executesPublicFlushSync ?? false,
    executesPublicDomMutation:
      optionValues.executesPublicDomMutation ?? false,
    compatibilityClaimed: optionValues.compatibilityClaimed ?? false
  });

  publicFlushSyncBlockedCurrentnessReports.add(report);
  publicFlushSyncBlockedCurrentnessReportOverrideKeys.set(
    report,
    normalizedOptions.overrideKeys
  );
  if (!hasSourceRowsOverride) {
    publicFlushSyncBlockedCurrentnessSourceRowsByReport.set(
      report,
      sourceRows
    );
  }
  return report;
}

function isAcceptedPublicReactDomFlushSyncBlockedCurrentnessReport(report) {
  return (
    validatePublicReactDomFlushSyncBlockedCurrentnessReport(report) === null
  );
}

function consumePublicReactDomFlushSyncBlockedCurrentnessReport(report) {
  const rejectionReason =
    validatePublicReactDomFlushSyncBlockedCurrentnessReport(report);
  if (rejectionReason !== null) {
    throw createPublicReactDomFlushSyncBlockedCurrentnessGateError(
      rejectionReason
    );
  }

  return freezeRecord({
    status: publicFlushSyncBlockedCurrentnessConsumptionStatus,
    accepted: true,
    currentnessStatus: report.status,
    source: report.source,
    compatibilityTarget,
    entrypoints: report.entrypoints,
    scenarioIds: report.scenarioIds,
    scenarioCount: report.scenarios.length,
    publicReactDomFlushSyncUnsupportedPlaceholder: true,
    publicProfilingFlushSyncUnsupportedPlaceholder: true,
    callbackInvocationBlocked: true,
    thenableReturnBlocked: true,
    returnValueCompatibilityBlocked: true,
    invokesCallback: false,
    returnsThenable: false,
    returnValueCompatibilityClaimed: false,
    acceptedWorkerIds: report.acceptedWorkerIds,
    excludedWorkerIds: report.excludedWorkerIds,
    sourceRows: report.sourceRows,
    privatePrerequisites:
      createPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(),
    publicFlushSyncReady: false,
    privateRoutingReady: false,
    privateSyncFlushRowsOpenPublicCallbackExecution: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicCompatibilityClaimed: false,
    publicFlushSyncCompatibilityClaimed: false,
    publicProfilingFlushSyncCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicActTimingCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicTestUtilsActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRootCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    publicWarningCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    packageSurfaceChanged: false,
    profilingCompatibilityClaimed: false,
    profilingPackageCompatibilityClaimed: false,
    publicRootExecution: false,
    publicRootLifecycleReady: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    publicActPassiveDrain: false,
    publicEffectExecution: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    executesPublicRendererRoots: false,
    executesSyncFlush: false,
    executesPublicFlushSync: false,
    executesPublicDomMutation: false,
    compatibilityClaimed: false
  });
}

function validatePublicReactDomFlushSyncBlockedCurrentnessReport(report) {
  if (!isObjectLike(report)) {
    return 'public-react-dom-flush-sync-currentness-not-frozen';
  }
  if (!publicFlushSyncBlockedCurrentnessReports.has(report)) {
    return 'public-react-dom-flush-sync-currentness-source-proof';
  }
  if (!Object.isFrozen(report)) {
    return 'public-react-dom-flush-sync-currentness-not-frozen';
  }
  if (
    report.kind !== publicFlushSyncBlockedCurrentnessKind ||
    report.version !== publicFlushSyncBlockedCurrentnessVersion ||
    report.status !== publicFlushSyncBlockedCurrentnessStatus ||
    report.source !== 'packages/react-dom/src/shared/flush-sync-guard.js' ||
    report.compatibilityTarget !== compatibilityTarget ||
    !sameStringArray(
      report.entrypoints,
      publicFlushSyncBlockedCurrentnessEntrypoints
    ) ||
    !sameStringArray(
      report.scenarioIds,
      publicFlushSyncBlockedCurrentnessScenarios
    ) ||
    !sameStringArray(
      report.acceptedWorkerIds,
      publicFlushSyncBlockedCurrentnessAcceptedWorkerIds
    ) ||
    !sameStringArray(
      report.excludedWorkerIds,
      publicFlushSyncBlockedCurrentnessExcludedWorkerIds
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-shape';
  }
  const sourceRowsRejection =
    validatePublicFlushSyncBlockedCurrentnessSourceRows(report);
  if (sourceRowsRejection !== null) {
    return sourceRowsRejection;
  }
  if (!isAcceptedPublicFlushSyncExportShapes(report.publicFlushSyncExports)) {
    return 'public-react-dom-flush-sync-currentness-public-export-shape';
  }
  if (
    hasAnyNonFalseField(
      report,
      publicFlushSyncBlockedCurrentnessPackageClaimFields
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-package-compatibility-claim';
  }
  if (
    hasAnyNonFalseField(
      report,
      publicFlushSyncBlockedCurrentnessPublicClaimFields
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-public-claim';
  }
  if (
    report.callbackInvocationBlocked !== true ||
    report.invokesCallback !== false
  ) {
    return 'public-react-dom-flush-sync-currentness-callback-invoked';
  }
  if (
    report.thenableReturnBlocked !== true ||
    report.returnsThenable !== false
  ) {
    return 'public-react-dom-flush-sync-currentness-thenable-returned';
  }
  if (
    report.returnValueCompatibilityBlocked !== true ||
    report.returnValueCompatibilityClaimed !== false
  ) {
    return 'public-react-dom-flush-sync-currentness-return-compatibility-claim';
  }
  if (
    report.publicFlushSyncReady !== false ||
    report.privateRoutingReady !== false ||
    report.privateSyncFlushRowsOpenPublicCallbackExecution !== false ||
    hasAnyNonFalseField(
      report,
      publicFlushSyncBlockedCurrentnessExecutionClaimFields
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-prerequisite-smuggling';
  }
  if (
    !isAcceptedPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(
      report.privatePrerequisites
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-private-prerequisite-boundary';
  }

  const scenarioRejection =
    validatePublicFlushSyncBlockedCurrentnessScenarios(report.scenarios);
  if (scenarioRejection !== null) {
    return scenarioRejection;
  }

  const overrideKeys =
    publicFlushSyncBlockedCurrentnessReportOverrideKeys.get(report) ||
    freezeArray([]);
  if (overrideKeys.length > 0) {
    return 'public-react-dom-flush-sync-currentness-caller-overrides';
  }

  return null;
}

function createPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(
  overrides = {}
) {
  const normalizedOptions = overrides ?? {};
  return freezeRecord({
    acceptedPrivateSyncFlushRootHandoffDiagnosticsReady:
      normalizedOptions.acceptedPrivateSyncFlushRootHandoffDiagnosticsReady ??
      true,
    privateSyncFlushRootHandoffStatus:
      normalizedOptions.privateSyncFlushRootHandoffStatus ??
      privateSyncFlushRootHandoffStatus,
    acceptedPrivateSyncFlushRootHandoffPrerequisiteIds: freezeStringArray(
      normalizedOptions.acceptedPrivateSyncFlushRootHandoffPrerequisiteIds,
      privateSyncFlushRootHandoffPrerequisiteIds
    ),
    acceptedPrivateSyncFlushWorkerIds: freezeStringArray(
      normalizedOptions.acceptedPrivateSyncFlushWorkerIds,
      publicFlushSyncBlockedCurrentnessAcceptedWorkerIds
    ),
    acceptedPrivateSyncFlushRows: freezeRecords(
      normalizedOptions.acceptedPrivateSyncFlushRows ??
        publicFlushSyncBlockedCurrentnessAcceptedPrivateRows
    ),
    consumesAcceptedPrivateSyncFlushRows:
      normalizedOptions.consumesAcceptedPrivateSyncFlushRows ?? true,
    publicRootBlockedLifecycleContextReady:
      normalizedOptions.publicRootBlockedLifecycleContextReady ?? true,
    publicRootBlockedLifecycleWorkerId:
      normalizedOptions.publicRootBlockedLifecycleWorkerId ??
      publicRootBlockedLifecycleWorkerId,
    publicRootBlockedLifecycleProgressPath:
      normalizedOptions.publicRootBlockedLifecycleProgressPath ??
      publicRootBlockedLifecycleProgressPath,
    excludesUnacceptedPrivateRootPrerequisites:
      normalizedOptions.excludesUnacceptedPrivateRootPrerequisites ?? true,
    consumesWorker910Evidence:
      normalizedOptions.consumesWorker910Evidence ?? false,
    acceptsFutureWorkerEvidence:
      normalizedOptions.acceptsFutureWorkerEvidence ?? false,
    publicFlushSyncReady:
      normalizedOptions.publicFlushSyncReady ?? false,
    privateRoutingReady: normalizedOptions.privateRoutingReady ?? false,
    privateSyncFlushRowsOpenPublicCallbackExecution:
      normalizedOptions.privateSyncFlushRowsOpenPublicCallbackExecution ??
      false,
    queueFlushingReady: normalizedOptions.queueFlushingReady ?? false,
    rendererRootsReady: normalizedOptions.rendererRootsReady ?? false,
    passiveEffectsReady: normalizedOptions.passiveEffectsReady ?? false,
    continuationFlushingReady:
      normalizedOptions.continuationFlushingReady ?? false,
    publicCompatibilityClaimed:
      normalizedOptions.publicCompatibilityClaimed ?? false,
    publicFlushSyncCompatibilityClaimed:
      normalizedOptions.publicFlushSyncCompatibilityClaimed ?? false,
    publicProfilingFlushSyncCompatibilityClaimed:
      normalizedOptions.publicProfilingFlushSyncCompatibilityClaimed ??
      false,
    publicSchedulerTimingCompatibilityClaimed:
      normalizedOptions.publicSchedulerTimingCompatibilityClaimed ?? false,
    publicActTimingCompatibilityClaimed:
      normalizedOptions.publicActTimingCompatibilityClaimed ?? false,
    publicActCompatibilityClaimed:
      normalizedOptions.publicActCompatibilityClaimed ?? false,
    publicReactActCompatibilityClaimed:
      normalizedOptions.publicReactActCompatibilityClaimed ?? false,
    publicTestUtilsActCompatibilityClaimed:
      normalizedOptions.publicTestUtilsActCompatibilityClaimed ?? false,
    publicRootSchedulerCompatibilityClaimed:
      normalizedOptions.publicRootSchedulerCompatibilityClaimed ?? false,
    publicRootCompatibilityClaimed:
      normalizedOptions.publicRootCompatibilityClaimed ?? false,
    publicRendererCompatibilityClaimed:
      normalizedOptions.publicRendererCompatibilityClaimed ?? false,
    publicWarningCompatibilityClaimed:
      normalizedOptions.publicWarningCompatibilityClaimed ?? false,
    publicPackageCompatibilityClaimed:
      normalizedOptions.publicPackageCompatibilityClaimed ?? false,
    packageCompatibilityClaimed:
      normalizedOptions.packageCompatibilityClaimed ?? false,
    packageSurfaceChanged: normalizedOptions.packageSurfaceChanged ?? false,
    profilingCompatibilityClaimed:
      normalizedOptions.profilingCompatibilityClaimed ?? false,
    profilingPackageCompatibilityClaimed:
      normalizedOptions.profilingPackageCompatibilityClaimed ?? false,
    publicRootExecution: normalizedOptions.publicRootExecution ?? false,
    publicRootLifecycleReady:
      normalizedOptions.publicRootLifecycleReady ?? false,
    drainsPublicSchedulerTaskQueue:
      normalizedOptions.drainsPublicSchedulerTaskQueue ?? false,
    drainsPublicReactActQueue:
      normalizedOptions.drainsPublicReactActQueue ?? false,
    invokesPublicSchedulerFlushHelper:
      normalizedOptions.invokesPublicSchedulerFlushHelper ?? false,
    publicSchedulerFlushBehaviorExecuted:
      normalizedOptions.publicSchedulerFlushBehaviorExecuted ?? false,
    publicActPassiveDrain:
      normalizedOptions.publicActPassiveDrain ?? false,
    publicEffectExecution:
      normalizedOptions.publicEffectExecution ?? false,
    executesQueuedWork: normalizedOptions.executesQueuedWork ?? false,
    executesEffects: normalizedOptions.executesEffects ?? false,
    executesPassiveEffects:
      normalizedOptions.executesPassiveEffects ?? false,
    executesRendererWork:
      normalizedOptions.executesRendererWork ?? false,
    executesRendererRoots:
      normalizedOptions.executesRendererRoots ?? false,
    executesPublicRendererRoots:
      normalizedOptions.executesPublicRendererRoots ?? false,
    executesSyncFlush: normalizedOptions.executesSyncFlush ?? false,
    executesPublicFlushSync:
      normalizedOptions.executesPublicFlushSync ?? false,
    executesPublicDomMutation:
      normalizedOptions.executesPublicDomMutation ?? false,
    compatibilityClaimed: normalizedOptions.compatibilityClaimed ?? false
  });
}

function isAcceptedPublicFlushSyncBlockedCurrentnessPrivatePrerequisites(
  prerequisites
) {
  return sameFrozenValue(
    prerequisites,
    createPublicFlushSyncBlockedCurrentnessPrivatePrerequisites()
  );
}

function validatePublicFlushSyncBlockedCurrentnessSourceRows(report) {
  if (
    publicFlushSyncBlockedCurrentnessSourceRowsByReport.get(report) !==
    report.sourceRows
  ) {
    return 'public-react-dom-flush-sync-currentness-source-rows-source-proof';
  }

  if (
    !Array.isArray(report.sourceRows) ||
    !Object.isFrozen(report.sourceRows) ||
    report.sourceRows.length !==
      publicFlushSyncBlockedCurrentnessSourceRowSpecs.length
  ) {
    return 'public-react-dom-flush-sync-currentness-source-rows';
  }

  for (const row of report.sourceRows) {
    if (!isAcceptedPublicFlushSyncBlockedCurrentnessSourceRow(row)) {
      return 'public-react-dom-flush-sync-currentness-source-rows';
    }
  }

  if (
    !sameFrozenValue(
      report.sourceRows,
      createPublicFlushSyncBlockedCurrentnessSourceRows()
    )
  ) {
    return 'public-react-dom-flush-sync-currentness-source-rows';
  }

  return null;
}

function isAcceptedPublicFlushSyncBlockedCurrentnessSourceRow(row) {
  return (
    isObjectLike(row) &&
    Object.isFrozen(row) &&
    row.sourceRowVersion ===
      publicFlushSyncBlockedCurrentnessSourceRowVersion &&
    row.guardSource === 'packages/react-dom/src/shared/flush-sync-guard.js' &&
    row.placeholderFactorySource === 'packages/react-dom/placeholder-utils.js' &&
    row.placeholderFactory === 'createUnsupportedFunction' &&
    row.exportName === 'flushSync' &&
    row.sourceOwned === true &&
    row.sourceCurrent === true &&
    row.descriptorSnapshotReadable === true &&
    row.descriptorOwn === true &&
    row.descriptorData === true &&
    row.descriptorEnumerable === true &&
    row.descriptorConfigurable === true &&
    row.descriptorWritable === true &&
    row.exportKeysInclude === true &&
    row.reflectOwnKeysInclude === true &&
    row.functionType === 'function' &&
    row.functionName === '' &&
    row.functionLength === 1 &&
    row.functionThenable === false &&
    row.placeholderMetadataOwn === true &&
    row.placeholderMetadataEnumerable === false &&
    row.placeholderMetadataValue === true &&
    row.entrypointMetadataOwn === true &&
    row.entrypointMetadataEnumerable === false &&
    row.entrypointMetadataValue === row.entrypoint &&
    row.compatibilityTargetMetadataOwn === true &&
    row.compatibilityTargetMetadataEnumerable === false &&
    row.compatibilityTargetMetadataValue === compatibilityTarget &&
    sameStringArray(
      row.acceptedPrivateBlockerWorkerIds,
      publicFlushSyncBlockedCurrentnessAcceptedWorkerIds
    ) &&
    sameStringArray(
      row.acceptedPrivateBlockerPrerequisiteIds,
      privateSyncFlushRootHandoffPrerequisiteIds
    ) &&
    row.publicRootBlockedLifecycleWorkerId ===
      publicRootBlockedLifecycleWorkerId &&
    row.publicRootBlockedLifecycleProgressPath ===
      publicRootBlockedLifecycleProgressPath &&
    sameStringArray(
      row.excludedPrivateBlockerWorkerIds,
      publicFlushSyncBlockedCurrentnessExcludedWorkerIds
    ) &&
    row.ownPublicCompatibilityClaimKeys.length === 0 &&
    row.hiddenPublicCompatibilityAliasKeys.length === 0 &&
    row.symbolPublicCompatibilityClaimKeys.length === 0 &&
    row.nonEnumerablePublicCompatibilityClaimKeys.length === 0 &&
    row.accessorPublicCompatibilityClaimKeys.length === 0 &&
    row.inheritedPublicCompatibilityClaimKeys.length === 0 &&
    row.functionPublicCompatibilityClaimKeys.length === 0 &&
    row.publicFlushSyncCompatibilityClaimed === false &&
    row.publicSchedulerTimingCompatibilityClaimed === false &&
    row.publicActTimingCompatibilityClaimed === false &&
    row.publicRootCompatibilityClaimed === false &&
    row.publicPackageCompatibilityClaimed === false &&
    row.packageCompatibilityClaimed === false &&
    row.profilingCompatibilityClaimed === false &&
    row.drainsPublicSchedulerTaskQueue === false &&
    row.drainsPublicReactActQueue === false &&
    row.publicRootExecution === false &&
    row.executesPublicFlushSync === false &&
    row.executesPublicDomMutation === false &&
    row.compatibilityClaimed === false
  );
}

function createPublicFlushSyncBlockedCurrentnessSourceRows(
  sourceRowOverrides
) {
  return freezeArray(
    publicFlushSyncBlockedCurrentnessSourceRowSpecs.map((sourceSpec) =>
      freezePublicFlushSyncBlockedCurrentnessSourceRow({
        ...describePublicFlushSyncBlockedCurrentnessSourceRow(sourceSpec),
        ...getOwnDataOverride(sourceRowOverrides, sourceSpec.rowId)
      })
    )
  );
}

function describePublicFlushSyncBlockedCurrentnessSourceRow(sourceSpec) {
  const ReactDOM = loadPublicFlushSyncEntrypoint(sourceSpec.entrypoint);
  const moduleSnapshot = snapshotOwnPropertyDescriptors(ReactDOM);
  const moduleDescriptors = moduleSnapshot.descriptors;
  const flushSyncDescriptor = moduleDescriptors.flushSync;
  const flushSyncValue = dataDescriptorValue(flushSyncDescriptor);
  const placeholderMetadata = describePublicFlushSyncPlaceholderMetadata(
    moduleDescriptors,
    sourceSpec.entrypoint
  );
  const sourceClaims = describePublicFlushSyncSourceClaims(
    ReactDOM,
    moduleDescriptors,
    flushSyncValue
  );

  return freezePublicFlushSyncBlockedCurrentnessSourceRow({
    rowId: sourceSpec.rowId,
    sourceRowVersion: publicFlushSyncBlockedCurrentnessSourceRowVersion,
    entrypoint: sourceSpec.entrypoint,
    packageSource: sourceSpec.packageSource,
    guardSource: 'packages/react-dom/src/shared/flush-sync-guard.js',
    placeholderFactorySource: 'packages/react-dom/placeholder-utils.js',
    placeholderFactory: 'createUnsupportedFunction',
    exportName: 'flushSync',
    sourceOwned: true,
    sourceCurrent: true,
    descriptorSnapshotReadable: moduleSnapshot.readable,
    descriptorOwn: flushSyncDescriptor !== undefined,
    descriptorData: isDataDescriptor(flushSyncDescriptor),
    descriptorEnumerable: flushSyncDescriptor?.enumerable === true,
    descriptorConfigurable: flushSyncDescriptor?.configurable === true,
    descriptorWritable: flushSyncDescriptor?.writable === true,
    exportKeysInclude: objectKeysInclude(ReactDOM, 'flushSync'),
    reflectOwnKeysInclude: Reflect.ownKeys(moduleDescriptors).includes(
      'flushSync'
    ),
    functionType: typeof flushSyncValue,
    functionName:
      typeof flushSyncValue === 'function' ? flushSyncValue.name : undefined,
    functionLength:
      typeof flushSyncValue === 'function' ? flushSyncValue.length : undefined,
    functionThenable: isThenable(flushSyncValue),
    ...placeholderMetadata,
    acceptedPrivateBlockerWorkerIds:
      publicFlushSyncBlockedCurrentnessAcceptedWorkerIds,
    acceptedPrivateBlockerPrerequisiteIds:
      privateSyncFlushRootHandoffPrerequisiteIds,
    publicRootBlockedLifecycleWorkerId,
    publicRootBlockedLifecycleProgressPath,
    excludedPrivateBlockerWorkerIds:
      publicFlushSyncBlockedCurrentnessExcludedWorkerIds,
    ...sourceClaims,
    publicFlushSyncCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicActTimingCompatibilityClaimed: false,
    publicRootCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    profilingCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicRootExecution: false,
    executesPublicFlushSync: false,
    executesPublicDomMutation: false,
    compatibilityClaimed: false
  });
}

function describePublicFlushSyncPlaceholderMetadata(
  descriptors,
  entrypoint
) {
  const placeholder = descriptors.__FAST_REACT_PLACEHOLDER__;
  const entrypointDescriptor = descriptors.__FAST_REACT_ENTRYPOINT__;
  const compatibility = descriptors.compatibilityTarget;

  return freezeRecord({
    placeholderMetadataOwn: placeholder !== undefined,
    placeholderMetadataEnumerable: placeholder?.enumerable === true,
    placeholderMetadataValue: dataDescriptorValue(placeholder),
    entrypointMetadataOwn: entrypointDescriptor !== undefined,
    entrypointMetadataEnumerable: entrypointDescriptor?.enumerable === true,
    entrypointMetadataValue: dataDescriptorValue(entrypointDescriptor),
    compatibilityTargetMetadataOwn: compatibility !== undefined,
    compatibilityTargetMetadataEnumerable: compatibility?.enumerable === true,
    compatibilityTargetMetadataValue: dataDescriptorValue(compatibility)
  });
}

function describePublicFlushSyncSourceClaims(
  ReactDOM,
  moduleDescriptors,
  flushSyncValue
) {
  const ownPublicCompatibilityClaimKeys = [];
  const hiddenPublicCompatibilityAliasKeys = [];
  const symbolPublicCompatibilityClaimKeys = [];
  const nonEnumerablePublicCompatibilityClaimKeys = [];
  const accessorPublicCompatibilityClaimKeys = [];

  for (const key of Reflect.ownKeys(moduleDescriptors)) {
    if (key === 'flushSync') {
      continue;
    }

    const descriptor = moduleDescriptors[key];
    if (isPublicFlushSyncAliasDescriptor(key, descriptor, flushSyncValue)) {
      hiddenPublicCompatibilityAliasKeys.push(describePropertyKey(key));
    }

    if (isPublicFlushSyncCompatibilityClaimKey(key)) {
      ownPublicCompatibilityClaimKeys.push(describePropertyKey(key));
      if (typeof key === 'symbol') {
        symbolPublicCompatibilityClaimKeys.push(describePropertyKey(key));
      }
      if (descriptor?.enumerable !== true) {
        nonEnumerablePublicCompatibilityClaimKeys.push(
          describePropertyKey(key)
        );
      }
      if (!isDataDescriptor(descriptor)) {
        accessorPublicCompatibilityClaimKeys.push(describePropertyKey(key));
      }
    }
  }

  const hiddenProxyPublicCompatibilityClaimKeys =
    describeProxyHiddenPublicCompatibilityClaimKeys(
      ReactDOM,
      moduleDescriptors
    );

  return freezeRecord({
    ownPublicCompatibilityClaimKeys: freezeArray(
      ownPublicCompatibilityClaimKeys
    ),
    hiddenPublicCompatibilityAliasKeys: freezeArray(
      uniqueStringArray([
        ...hiddenPublicCompatibilityAliasKeys,
        ...hiddenProxyPublicCompatibilityClaimKeys
      ])
    ),
    symbolPublicCompatibilityClaimKeys: freezeArray(
      symbolPublicCompatibilityClaimKeys
    ),
    nonEnumerablePublicCompatibilityClaimKeys: freezeArray(
      nonEnumerablePublicCompatibilityClaimKeys
    ),
    accessorPublicCompatibilityClaimKeys: freezeArray(
      accessorPublicCompatibilityClaimKeys
    ),
    inheritedPublicCompatibilityClaimKeys:
      describeInheritedPublicCompatibilityClaimKeys(ReactDOM, flushSyncValue),
    functionPublicCompatibilityClaimKeys:
      describeFunctionPublicCompatibilityClaimKeys(flushSyncValue)
  });
}

function describeProxyHiddenPublicCompatibilityClaimKeys(
  target,
  moduleDescriptors
) {
  const hiddenClaimKeys = [];
  const claimFields = publicFlushSyncBlockedCurrentnessSourceIdentityClaimFields;

  for (const field of claimFields) {
    if (Object.prototype.hasOwnProperty.call(moduleDescriptors, field)) {
      continue;
    }

    const exposure = describeProxyHiddenPublicCompatibilityClaimKey(
      target,
      field
    );
    if (exposure !== null) {
      hiddenClaimKeys.push(exposure);
    }
  }

  return uniqueStringArray(hiddenClaimKeys);
}

function describeProxyHiddenPublicCompatibilityClaimKey(target, field) {
  try {
    if (field in Object(target)) {
      return field;
    }
  } catch {
    return `${field}:unreadable-in`;
  }

  try {
    const value = target[field];
    if (value === undefined) {
      return null;
    }
    if (
      value === false &&
      !isPresenceBasedPublicFlushSyncSourceClaimField(field)
    ) {
      return null;
    }
    return field;
  } catch {
    return `${field}:unreadable-get`;
  }
}

function isPresenceBasedPublicFlushSyncSourceClaimField(field) {
  return publicFlushSyncBlockedCurrentnessNativeRustClaimFields.includes(field);
}

function freezePublicFlushSyncBlockedCurrentnessSourceRows(rows) {
  return freezeArray(
    (Array.isArray(rows) ? rows : []).map(
      freezePublicFlushSyncBlockedCurrentnessSourceRow
    )
  );
}

function freezePublicFlushSyncBlockedCurrentnessSourceRow(row) {
  const normalizedRow = row ?? {};
  return freezeRecord({
    rowId: normalizedRow.rowId,
    sourceRowVersion: normalizedRow.sourceRowVersion,
    entrypoint: normalizedRow.entrypoint,
    packageSource: normalizedRow.packageSource,
    guardSource: normalizedRow.guardSource,
    placeholderFactorySource: normalizedRow.placeholderFactorySource,
    placeholderFactory: normalizedRow.placeholderFactory,
    exportName: normalizedRow.exportName,
    sourceOwned: normalizedRow.sourceOwned === true,
    sourceCurrent: normalizedRow.sourceCurrent === true,
    descriptorSnapshotReadable:
      normalizedRow.descriptorSnapshotReadable === true,
    descriptorOwn: normalizedRow.descriptorOwn === true,
    descriptorData: normalizedRow.descriptorData === true,
    descriptorEnumerable: normalizedRow.descriptorEnumerable === true,
    descriptorConfigurable: normalizedRow.descriptorConfigurable === true,
    descriptorWritable: normalizedRow.descriptorWritable === true,
    exportKeysInclude: normalizedRow.exportKeysInclude === true,
    reflectOwnKeysInclude: normalizedRow.reflectOwnKeysInclude === true,
    functionType: normalizedRow.functionType,
    functionName: normalizedRow.functionName,
    functionLength: normalizedRow.functionLength,
    functionThenable: normalizedRow.functionThenable === true,
    placeholderMetadataOwn: normalizedRow.placeholderMetadataOwn === true,
    placeholderMetadataEnumerable:
      normalizedRow.placeholderMetadataEnumerable === true,
    placeholderMetadataValue: normalizedRow.placeholderMetadataValue,
    entrypointMetadataOwn: normalizedRow.entrypointMetadataOwn === true,
    entrypointMetadataEnumerable:
      normalizedRow.entrypointMetadataEnumerable === true,
    entrypointMetadataValue: normalizedRow.entrypointMetadataValue,
    compatibilityTargetMetadataOwn:
      normalizedRow.compatibilityTargetMetadataOwn === true,
    compatibilityTargetMetadataEnumerable:
      normalizedRow.compatibilityTargetMetadataEnumerable === true,
    compatibilityTargetMetadataValue:
      normalizedRow.compatibilityTargetMetadataValue,
    acceptedPrivateBlockerWorkerIds: freezeStringArray(
      normalizedRow.acceptedPrivateBlockerWorkerIds,
      []
    ),
    acceptedPrivateBlockerPrerequisiteIds: freezeStringArray(
      normalizedRow.acceptedPrivateBlockerPrerequisiteIds,
      []
    ),
    publicRootBlockedLifecycleWorkerId:
      normalizedRow.publicRootBlockedLifecycleWorkerId,
    publicRootBlockedLifecycleProgressPath:
      normalizedRow.publicRootBlockedLifecycleProgressPath,
    excludedPrivateBlockerWorkerIds: freezeStringArray(
      normalizedRow.excludedPrivateBlockerWorkerIds,
      []
    ),
    ownPublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.ownPublicCompatibilityClaimKeys,
      []
    ),
    hiddenPublicCompatibilityAliasKeys: freezeStringArray(
      normalizedRow.hiddenPublicCompatibilityAliasKeys,
      []
    ),
    symbolPublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.symbolPublicCompatibilityClaimKeys,
      []
    ),
    nonEnumerablePublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.nonEnumerablePublicCompatibilityClaimKeys,
      []
    ),
    accessorPublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.accessorPublicCompatibilityClaimKeys,
      []
    ),
    inheritedPublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.inheritedPublicCompatibilityClaimKeys,
      []
    ),
    functionPublicCompatibilityClaimKeys: freezeStringArray(
      normalizedRow.functionPublicCompatibilityClaimKeys,
      []
    ),
    publicFlushSyncCompatibilityClaimed:
      normalizedRow.publicFlushSyncCompatibilityClaimed ?? false,
    publicSchedulerTimingCompatibilityClaimed:
      normalizedRow.publicSchedulerTimingCompatibilityClaimed ?? false,
    publicActTimingCompatibilityClaimed:
      normalizedRow.publicActTimingCompatibilityClaimed ?? false,
    publicRootCompatibilityClaimed:
      normalizedRow.publicRootCompatibilityClaimed ?? false,
    publicPackageCompatibilityClaimed:
      normalizedRow.publicPackageCompatibilityClaimed ?? false,
    packageCompatibilityClaimed:
      normalizedRow.packageCompatibilityClaimed ?? false,
    profilingCompatibilityClaimed:
      normalizedRow.profilingCompatibilityClaimed ?? false,
    drainsPublicSchedulerTaskQueue:
      normalizedRow.drainsPublicSchedulerTaskQueue ?? false,
    drainsPublicReactActQueue:
      normalizedRow.drainsPublicReactActQueue ?? false,
    publicRootExecution: normalizedRow.publicRootExecution ?? false,
    executesPublicFlushSync:
      normalizedRow.executesPublicFlushSync ?? false,
    executesPublicDomMutation:
      normalizedRow.executesPublicDomMutation ?? false,
    compatibilityClaimed: normalizedRow.compatibilityClaimed ?? false
  });
}

function isAcceptedPublicFlushSyncExportShapes(exportShapes) {
  if (
    !Array.isArray(exportShapes) ||
    !Object.isFrozen(exportShapes) ||
    exportShapes.length !== publicFlushSyncBlockedCurrentnessEntrypoints.length
  ) {
    return false;
  }

  return exportShapes.every((exportShape, index) =>
    isAcceptedPublicFlushSyncExportShape(
      exportShape,
      publicFlushSyncBlockedCurrentnessEntrypoints[index]
    )
  );
}

function isAcceptedPublicFlushSyncExportShape(exportShape, entrypoint) {
  return (
    isObjectLike(exportShape) &&
    Object.isFrozen(exportShape) &&
    exportShape.entrypoint === entrypoint &&
    exportShape.hasOwn === true &&
    exportShape.exportKeysInclude === true &&
    isObjectLike(exportShape.value) &&
    Object.isFrozen(exportShape.value) &&
    exportShape.value.type === 'function' &&
    exportShape.value.name === '' &&
    exportShape.value.length === 1 &&
    exportShape.value.thenable === false
  );
}

function validatePublicFlushSyncBlockedCurrentnessScenarios(scenarios) {
  if (
    !Array.isArray(scenarios) ||
    !Object.isFrozen(scenarios) ||
    scenarios.length !==
      publicFlushSyncBlockedCurrentnessEntrypoints.length *
        publicFlushSyncBlockedCurrentnessScenarios.length
  ) {
    return 'public-react-dom-flush-sync-currentness-scenario-shape';
  }

  let scenarioIndex = 0;
  for (const entrypoint of publicFlushSyncBlockedCurrentnessEntrypoints) {
    for (const scenarioId of publicFlushSyncBlockedCurrentnessScenarios) {
      const scenario = scenarios[scenarioIndex];
      scenarioIndex++;
      if (
        !isObjectLike(scenario) ||
        !Object.isFrozen(scenario) ||
        scenario.entrypoint !== entrypoint ||
        scenario.scenarioId !== scenarioId ||
        scenario.rootless !== true ||
        !isObjectLike(scenario.callAttempt) ||
        !Object.isFrozen(scenario.callAttempt) ||
        !Array.isArray(scenario.consoleCalls) ||
        !Object.isFrozen(scenario.consoleCalls)
      ) {
        return 'public-react-dom-flush-sync-currentness-scenario-shape';
      }
      if (
        scenario.packageCompatibilityClaimed !== false ||
        scenario.profilingCompatibilityClaimed !== false
      ) {
        return 'public-react-dom-flush-sync-currentness-package-compatibility-claim';
      }
      if (
        scenario.publicCompatibilityClaimed !== false ||
        scenario.publicFlushSyncCompatibilityClaimed !== false ||
        scenario.publicProfilingFlushSyncCompatibilityClaimed !== false ||
        scenario.publicSchedulerTimingCompatibilityClaimed !== false ||
        scenario.publicActTimingCompatibilityClaimed !== false ||
        scenario.publicRootCompatibilityClaimed !== false ||
        scenario.compatibilityClaimed !== false
      ) {
        return 'public-react-dom-flush-sync-currentness-public-claim';
      }
      if (scenario.callbackInvoked !== false) {
        return 'public-react-dom-flush-sync-currentness-callback-invoked';
      }
      if (
        scenario.returnedThenable !== false ||
        isDescribedThenable(scenario.callAttempt.value)
      ) {
        return 'public-react-dom-flush-sync-currentness-thenable-returned';
      }
      if (scenario.returnValueCompatibilityClaimed !== false) {
        return 'public-react-dom-flush-sync-currentness-return-compatibility-claim';
      }
      if (
        scenario.callAttempt.status !== 'throws' ||
        !isPublicFlushSyncBlockedCurrentnessPlaceholderError(
          scenario.callAttempt.error,
          entrypoint
        )
      ) {
        return 'public-react-dom-flush-sync-currentness-placeholder-behavior';
      }
      if (scenario.consoleCalls.length !== 0) {
        return 'public-react-dom-flush-sync-currentness-warning-compatibility-claim';
      }
    }
  }

  return null;
}

function createPublicFlushSyncBlockedCurrentnessScenarios() {
  const scenarios = [];
  for (const entrypoint of publicFlushSyncBlockedCurrentnessEntrypoints) {
    const ReactDOM = loadPublicFlushSyncEntrypoint(entrypoint);
    for (const scenarioId of publicFlushSyncBlockedCurrentnessScenarios) {
      scenarios.push(
        capturePublicFlushSyncBlockedCurrentnessScenario(
          ReactDOM,
          entrypoint,
          scenarioId
        )
      );
    }
  }
  return scenarios;
}

function capturePublicFlushSyncBlockedCurrentnessScenario(
  ReactDOM,
  entrypoint,
  scenarioId
) {
  const consoleCalls = [];
  let callbackInvoked = false;
  const callback = createPublicFlushSyncCurrentnessCallback(
    scenarioId,
    () => {
      callbackInvoked = true;
    }
  );
  const callAttempt = capturePublicFlushSyncCallAttempt(
    ReactDOM.flushSync,
    callback,
    consoleCalls
  );

  return freezePublicFlushSyncBlockedCurrentnessScenario({
    entrypoint,
    scenarioId,
    rootless: true,
    callbackInvoked,
    returnedThenable: isDescribedThenable(callAttempt.value),
    callAttempt,
    consoleCalls
  });
}

function createPublicFlushSyncCurrentnessCallback(scenarioId, markInvoked) {
  if (scenarioId === 'rootless-error-callback') {
    return function publicFlushSyncErrorCallback() {
      markInvoked();
      throw new Error('unexpected-public-flush-sync-callback-error');
    };
  }
  if (scenarioId === 'rootless-thenable-callback') {
    return function publicFlushSyncThenableCallback() {
      markInvoked();
      return {
        then(resolve) {
          resolve('unexpected-public-flush-sync-thenable-result');
        }
      };
    };
  }

  return function publicFlushSyncSyncCallback() {
    markInvoked();
    return 'unexpected-public-flush-sync-result';
  };
}

function capturePublicFlushSyncCallAttempt(flushSync, callback, consoleCalls) {
  const previousConsoleError = console.error;
  console.error = function publicFlushSyncCurrentnessConsoleError(...args) {
    consoleCalls.push(freezeArray(args.map(describeValueShape)));
  };

  try {
    return freezePublicFlushSyncCallAttempt({
      status: 'ok',
      value: flushSync(callback)
    });
  } catch (error) {
    return freezePublicFlushSyncCallAttempt({
      status: 'throws',
      error
    });
  } finally {
    console.error = previousConsoleError;
  }
}

function describePublicFlushSyncCurrentnessExport(entrypoint, ReactDOM) {
  const descriptor = Object.getOwnPropertyDescriptor(ReactDOM, 'flushSync');
  const value = descriptor ? descriptor.value : undefined;
  return freezePublicFlushSyncExportShape({
    entrypoint,
    hasOwn: descriptor !== undefined,
    exportKeysInclude: Object.keys(ReactDOM).includes('flushSync'),
    value: describeValueShape(value)
  });
}

function freezePublicFlushSyncExportShape(exportShape) {
  const normalizedExportShape = exportShape ?? {};
  return freezeRecord({
    entrypoint: normalizedExportShape.entrypoint,
    hasOwn: normalizedExportShape.hasOwn === true,
    exportKeysInclude: normalizedExportShape.exportKeysInclude === true,
    value: freezePublicFlushSyncValueShape(normalizedExportShape.value)
  });
}

function freezePublicFlushSyncBlockedCurrentnessScenario(scenario) {
  const normalizedScenario = scenario ?? {};
  return freezeRecord({
    entrypoint: normalizedScenario.entrypoint,
    scenarioId: normalizedScenario.scenarioId,
    rootless: normalizedScenario.rootless === true,
    callbackInvoked: normalizedScenario.callbackInvoked ?? false,
    returnedThenable: normalizedScenario.returnedThenable ?? false,
    returnValueCompatibilityClaimed:
      normalizedScenario.returnValueCompatibilityClaimed ?? false,
    callAttempt: freezePublicFlushSyncCallAttempt(
      normalizedScenario.callAttempt
    ),
    consoleCalls: freezeArray(normalizedScenario.consoleCalls ?? []),
    publicCompatibilityClaimed:
      normalizedScenario.publicCompatibilityClaimed ?? false,
    publicFlushSyncCompatibilityClaimed:
      normalizedScenario.publicFlushSyncCompatibilityClaimed ?? false,
    publicProfilingFlushSyncCompatibilityClaimed:
      normalizedScenario.publicProfilingFlushSyncCompatibilityClaimed ??
      false,
    publicSchedulerTimingCompatibilityClaimed:
      normalizedScenario.publicSchedulerTimingCompatibilityClaimed ?? false,
    publicActTimingCompatibilityClaimed:
      normalizedScenario.publicActTimingCompatibilityClaimed ?? false,
    publicRootCompatibilityClaimed:
      normalizedScenario.publicRootCompatibilityClaimed ?? false,
    packageCompatibilityClaimed:
      normalizedScenario.packageCompatibilityClaimed ?? false,
    profilingCompatibilityClaimed:
      normalizedScenario.profilingCompatibilityClaimed ?? false,
    compatibilityClaimed:
      normalizedScenario.compatibilityClaimed ?? false
  });
}

function freezePublicFlushSyncCallAttempt(callAttempt) {
  const normalizedAttempt = callAttempt ?? {};
  if (normalizedAttempt.status === 'throws') {
    return freezeRecord({
      status: 'throws',
      error: describePublicFlushSyncCurrentnessError(
        normalizedAttempt.error
      )
    });
  }

  return freezeRecord({
    status: normalizedAttempt.status ?? 'unknown',
    value: freezePublicFlushSyncValueShape(normalizedAttempt.value)
  });
}

function freezePublicFlushSyncValueShape(value) {
  if (isPublicFlushSyncValueShape(value)) {
    return Object.isFrozen(value) ? value : freezeRecord(value);
  }
  return freezeRecord(describeValueShape(value));
}

function isPublicFlushSyncValueShape(value) {
  return isObjectLike(value) && typeof value.type === 'string';
}

function describePublicFlushSyncCurrentnessError(error) {
  if (!isObjectLike(error)) {
    return freezeRecord({
      name: typeof error,
      message: String(error)
    });
  }

  return freezeRecord({
    name: error.name,
    code: error.code,
    entrypoint: error.entrypoint,
    exportName: error.exportName,
    compatibilityTarget: error.compatibilityTarget,
    message: error.message
  });
}

function describeValueShape(value) {
  if (value === undefined) {
    return {
      type: 'undefined'
    };
  }
  if (value === null) {
    return {
      type: 'null'
    };
  }
  const valueType = typeof value;
  if (
    valueType === 'string' ||
    valueType === 'number' ||
    valueType === 'boolean'
  ) {
    return {
      type: valueType,
      value
    };
  }
  if (valueType === 'function') {
    return {
      type: 'function',
      name: value.name,
      length: value.length,
      thenable: isThenable(value)
    };
  }
  return {
    type: valueType,
    thenable: isThenable(value)
  };
}

function isPublicFlushSyncBlockedCurrentnessPlaceholderError(
  error,
  entrypoint
) {
  return (
    isObjectLike(error) &&
    Object.isFrozen(error) &&
    error.name === 'FastReactDomUnimplementedError' &&
    error.code === 'FAST_REACT_UNIMPLEMENTED' &&
    error.entrypoint === entrypoint &&
    error.exportName === 'flushSync' &&
    error.compatibilityTarget === compatibilityTarget
  );
}

function createPublicReactDomFlushSyncBlockedCurrentnessGateError(reason) {
  const error = createUnsupportedError(
    'react-dom',
    `${privateFlushSyncGuardExport}.consumePublicReactDomFlushSyncBlockedCurrentnessReport`,
    'rejected public ReactDOM.flushSync blocked currentness report',
    'Only the current source-owned unsupported public ReactDOM.flushSync placeholder report can pass this package-private gate.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicFlushSyncCompatibilityClaimed = false;
  error.publicProfilingFlushSyncCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicActTimingCompatibilityClaimed = false;
  error.publicActCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicTestUtilsActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRootCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.publicWarningCompatibilityClaimed = false;
  error.publicPackageCompatibilityClaimed = false;
  error.packageCompatibilityClaimed = false;
  error.packageSurfaceChanged = false;
  error.profilingCompatibilityClaimed = false;
  error.profilingPackageCompatibilityClaimed = false;
  error.invokesCallback = false;
  error.returnsThenable = false;
  error.returnValueCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.invokesPublicSchedulerFlushHelper = false;
  error.publicSchedulerFlushBehaviorExecuted = false;
  error.publicRootExecution = false;
  error.publicRootLifecycleReady = false;
  error.publicActPassiveDrain = false;
  error.publicEffectExecution = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesPassiveEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  error.executesPublicRendererRoots = false;
  error.executesSyncFlush = false;
  error.executesPublicFlushSync = false;
  error.executesPublicDomMutation = false;
  error.compatibilityClaimed = false;
  return error;
}

function loadPublicFlushSyncEntrypoint(entrypoint) {
  if (entrypoint === 'react-dom/profiling') {
    return require('../../profiling.js');
  }
  if (entrypoint === 'react-dom') {
    return require('../../index.js');
  }

  throw createPublicReactDomFlushSyncBlockedCurrentnessGateError(
    'public-react-dom-flush-sync-currentness-entrypoint'
  );
}

function isDescribedThenable(value) {
  return isObjectLike(value) && value.thenable === true;
}

function isThenable(value) {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof value.then === 'function'
  );
}

function isObjectLike(value) {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  );
}

function freezeRecord(record) {
  return Object.freeze({
    ...record
  });
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function captureOwnDataOptions(options, callerProvided) {
  const values = Object.create(null);
  const callerProvidedObject =
    callerProvided && options !== null && options !== undefined;
  const ownKeys = [];

  if (callerProvidedObject) {
    try {
      const descriptors = Object.getOwnPropertyDescriptors(Object(options));
      for (const key of Reflect.ownKeys(descriptors)) {
        ownKeys.push(key);
        const descriptor = descriptors[key];
        if (Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
          values[key] = descriptor.value;
        }
      }
    } catch {
      ownKeys.push('unreadable-caller-options');
    }
  }

  return freezeRecord({
    values,
    overrideKeys: callerProvidedObject
      ? freezeArray(['caller-options-object', ...ownKeys])
      : freezeArray([])
  });
}

function getOwnDataOverride(overrides, key) {
  if (!isObjectLike(overrides)) {
    return undefined;
  }

  try {
    const descriptor = Object.getOwnPropertyDescriptor(overrides, key);
    if (descriptor && isDataDescriptor(descriptor)) {
      return descriptor.value;
    }
  } catch {
    return {
      descriptorSnapshotReadable: false
    };
  }

  return undefined;
}

function snapshotOwnPropertyDescriptors(value) {
  try {
    return {
      readable: true,
      descriptors: Object.getOwnPropertyDescriptors(Object(value))
    };
  } catch {
    return {
      readable: false,
      descriptors: Object.create(null)
    };
  }
}

function dataDescriptorValue(descriptor) {
  return isDataDescriptor(descriptor) ? descriptor.value : undefined;
}

function isDataDescriptor(descriptor) {
  return (
    descriptor !== undefined &&
    Object.prototype.hasOwnProperty.call(descriptor, 'value')
  );
}

function objectKeysInclude(value, key) {
  try {
    return Object.keys(value).includes(key);
  } catch {
    return false;
  }
}

function isPublicFlushSyncAliasDescriptor(key, descriptor, flushSyncValue) {
  return (
    (isDataDescriptor(descriptor) && descriptor.value === flushSyncValue) ||
    normalizedPropertyKeyText(key).includes('flushsync')
  );
}

function isPublicFlushSyncCompatibilityClaimKey(key) {
  return publicFlushSyncBlockedCurrentnessSourceIdentityClaimFields.includes(
    propertyKeyText(key)
  );
}

function describeInheritedPublicCompatibilityClaimKeys(
  target,
  flushSyncValue
) {
  const claimKeys = [];
  let prototype;

  try {
    prototype = Object.getPrototypeOf(target);
  } catch {
    return freezeArray(['unreadable-prototype']);
  }

  let depth = 0;
  while (prototype !== null && depth < 8) {
    let descriptors;
    try {
      descriptors = Object.getOwnPropertyDescriptors(prototype);
    } catch {
      claimKeys.push(`prototype-${depth}:unreadable-descriptors`);
      break;
    }

    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor = descriptors[key];
      if (
        key === 'flushSync' ||
        isPublicFlushSyncCompatibilityClaimKey(key) ||
        isPublicFlushSyncAliasDescriptor(key, descriptor, flushSyncValue)
      ) {
        claimKeys.push(`prototype-${depth}:${describePropertyKey(key)}`);
      }
    }

    try {
      prototype = Object.getPrototypeOf(prototype);
    } catch {
      claimKeys.push(`prototype-${depth}:unreadable-parent`);
      break;
    }
    depth++;
  }

  return freezeArray(uniqueStringArray(claimKeys));
}

function describeFunctionPublicCompatibilityClaimKeys(value) {
  if (typeof value !== 'function') {
    return freezeArray([]);
  }

  const snapshot = snapshotOwnPropertyDescriptors(value);
  if (!snapshot.readable) {
    return freezeArray(['unreadable-function-descriptors']);
  }

  return freezeArray(
    uniqueStringArray(
      Reflect.ownKeys(snapshot.descriptors)
        .filter(isPublicFlushSyncCompatibilityClaimKey)
        .map(describePropertyKey)
    )
  );
}

function propertyKeyText(key) {
  if (typeof key === 'symbol') {
    return key.description ?? '';
  }
  return String(key);
}

function normalizedPropertyKeyText(key) {
  return propertyKeyText(key)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function describePropertyKey(key) {
  if (typeof key === 'symbol') {
    return `Symbol(${key.description ?? ''})`;
  }
  return String(key);
}

function uniqueStringArray(values) {
  return [...new Set(values)];
}

function freezeStringArray(value, fallback) {
  return freezeArray(Array.isArray(value) ? value : fallback);
}

function freezeRecords(records) {
  return freezeArray(records.map((record) => freezeRecord(record)));
}

function hasAnyNonFalseField(record, fields) {
  return fields.some((field) => record[field] !== false);
}

function sameStringArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sameFrozenValue(actual, expected) {
  if (!isObjectLike(actual) || !isObjectLike(expected)) {
    return actual === expected;
  }
  if (!Object.isFrozen(actual) || !Object.isFrozen(expected)) {
    return false;
  }
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      Array.isArray(expected) &&
      actual.length === expected.length &&
      actual.every((value, index) => sameFrozenValue(value, expected[index]))
    );
  }

  const actualKeys = Reflect.ownKeys(actual);
  const expectedKeys = Reflect.ownKeys(expected);
  return (
    samePropertyKeyArray(actualKeys, expectedKeys) &&
    actualKeys.every((key) => sameFrozenValue(actual[key], expected[key]))
  );
}

function samePropertyKeyArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

module.exports = {
  consumePublicReactDomFlushSyncBlockedCurrentnessReport,
  createFlushSyncGuardError,
  createPublicReactDomFlushSyncBlockedCurrentnessReport,
  finishFlushSyncGuard,
  flushSyncGuardErrorCode,
  flushSyncReentrantWarning,
  getDispatcherFlushSyncWork,
  isAcceptedPublicReactDomFlushSyncBlockedCurrentnessReport,
  isDevelopmentMode,
  privateFlushSyncGuardExport,
  privateSyncFlushRootHandoffPrerequisiteIds,
  publicFlushSyncBlockedCurrentnessAcceptedWorkerIds,
  publicFlushSyncBlockedCurrentnessConsumptionStatus,
  publicFlushSyncBlockedCurrentnessEntrypoints,
  publicFlushSyncBlockedCurrentnessExcludedWorkerIds,
  publicFlushSyncBlockedCurrentnessKind,
  publicFlushSyncBlockedCurrentnessScenarios,
  publicFlushSyncBlockedCurrentnessStatus,
  publicFlushSyncBlockedCurrentnessVersion,
  reportFlushSyncReentrantWarning
};
