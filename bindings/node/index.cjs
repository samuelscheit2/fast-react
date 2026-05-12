'use strict';

const bindingStatus = 'placeholder';
const packageName = '@fast-react/native';
const nativeAddonName = 'fast_react_napi';
const nodeApiVersionFloor = 8;
const supportedNodeEngineRange = '>=22.0.0';
const unavailableErrorCode = 'FAST_REACT_NATIVE_BINDING_UNIMPLEMENTED';
const rustNativeExportsNotBuiltErrorCode = 'FAST_REACT_NAPI_EXPORTS_NOT_BUILT';
const platformArtifactPolicy =
  'future per-platform optional npm packages; no native addon is built or loaded yet';
const optionalPackagePrefix = '@fast-react/native-';
const nativeRootBridgeRequestShapeGateStatus =
  'admitted-native-root-bridge-js-request-shape';
const nativeRootWorkLoopFinishedWorkMetadataFactorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);
const nativeReactDomRenderHandoffAdmissionSymbol = Symbol.for(
  'fast.react_native.private_react_dom_render_handoff_admission'
);
const nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS';
const nativeRootWorkLoopFinishedWorkMetadataFactoryCapabilityClaimErrorCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_CAPABILITY_CLAIM';
const nativeReactDomRenderHandoffAdmissionErrorCode =
  'FAST_REACT_NAPI_REACT_DOM_RENDER_HANDOFF_ADMISSION_INVALID';
const nativeReactDomRenderHandoffAdmissionCapabilityClaimErrorCode =
  'FAST_REACT_NAPI_REACT_DOM_RENDER_HANDOFF_ADMISSION_CAPABILITY_CLAIM';
const nativeReactDomRenderHandoffAdmissionStatus =
  'admitted-private-react-dom-render-native-handoff-without-public-native-or-browser-dom-execution';
const nativeRootWorkLoopFinishedWorkMetadataSource =
  'fast-react-reconciler.root-work-loop.finished-work-handoff';
const nativeRootWorkLoopFinishedWorkMetadataStatus =
  'accepted-private-root-work-loop-finished-work-handoff-metadata';
const nativeRootWorkLoopFinishedWorkMetadataRevision =
  'root-work-loop-finished-work-handoff-2026-05-10';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerSymbol =
  Symbol(
    'fast.react_native.private_root_work_loop_finished_work_metadata_source_currentness_ledger'
  );
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerStatus =
  'blocked-private-root-work-loop-finished-work-metadata-source-currentness-ledger';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessModel =
  'fast-react-napi.RootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessEvaluationMode =
  'static-source-token-ledger-no-native-load-no-package-export';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessEvidenceKind =
  'source-owned-rust-identifier-set-and-js-factory-shape';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus =
  'accepted-private-root-work-loop-finished-work-metadata-source-currentness';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedStatus =
  'rejected-private-root-work-loop-finished-work-metadata-source-currentness';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceFile =
  'crates/fast-react-napi/src/root_work_loop_metadata.rs';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceWorker =
  'worker-1228-native-metadata-no-load-source-ledger';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceWorkerProgress =
  'worker-progress/worker-1228-native-metadata-no-load-source-ledger.md';
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes =
  Object.freeze({
    callerBuilt:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_CALLER_BUILT',
    canonicalSetMismatch:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_CANONICAL_SET_MISMATCH',
    compatibilityClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_COMPATIBILITY_CLAIM',
    nativeAddonLoadClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_NATIVE_ADDON_LOAD_CLAIM',
    packageExportClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_PACKAGE_EXPORT_CLAIM',
    proseEvidence:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_PROSE_EVIDENCE',
    publicNativeExecutionClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_PUBLIC_NATIVE_EXECUTION_CLAIM',
    rendererReconcilerOutputClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_RENDERER_RECONCILER_OUTPUT_CLAIM',
    rustIdentifierMismatch:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_RUST_IDENTIFIER_MISMATCH',
    sourceRoleMismatch:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_SOURCE_ROLE_MISMATCH',
    sourceSyntaxOnly:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_SOURCE_SYNTAX_ONLY',
    staleOrForeign:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_STALE_OR_FOREIGN',
    workerOrNetworkExecutionClaim:
      'FAST_REACT_NAPI_ROOT_WORK_LOOP_METADATA_SOURCE_LEDGER_WORKER_OR_NETWORK_EXECUTION_CLAIM'
  });
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCaseIds =
  Object.freeze([
    'stale-source-path',
    'missing-rust-identifier',
    'fake-js-only-row',
    'public-native-execution-claim',
    'package-export-claim',
    'native-addon-load-claim',
    'worker-network-execution-claim',
    'renderer-reconciler-output-claim',
    'compatibility-claim',
    'prose-evidence',
    'source-syntax-only-evidence',
    'canonical-set-mismatch'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessPublicClaimFields =
  Object.freeze([
    'nativeExecution',
    'publicNativeExecution',
    'publicNativeCompatibility',
    'publicRootExecution',
    'publicRootCompatibilitySurface',
    'publicRootRendering',
    'publicRootRenderingClaimed'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessPackageClaimFields =
  Object.freeze([
    'packageExportCompatibility',
    'packageExportCompatibilityClaimed',
    'packageCompatibilityClaimed',
    'packageExportClaimed',
    'nativePackageExportClaimed',
    'nativePrivateSubpathsExported',
    'nativePackageCompatibilityClaimed',
    'packageExportsOpened'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCompatibilityClaimFields =
  Object.freeze([
    'compatibilityClaimed',
    'nativeCompatibilityClaimed',
    'reactDomCompatibilityClaimed',
    'testRendererCompatibilityClaimed',
    'publicCompatibilityClaimed'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRowFields =
  Object.freeze([
    'id',
    'role',
    'sourceFile',
    'sourceFiles',
    'evidenceKind',
    'rustIdentifiers',
    'jsFactoryFields',
    'jsonFieldPaths',
    'expectedFactoryValues',
    'status',
    'code',
    'sourceOwnedEvidence',
    'blockedPrivateEvidence',
    'publicAdmission',
    'callerShapedEvidence',
    'proseEvidence',
    'testTitleEvidence',
    'errorMessageEvidence',
    'sourceSyntaxOnly',
    'nativeAddonLoaded',
    'nativeExecution',
    'nodeWorkerThreadsExecution',
    'childProcessExecution',
    'httpExecution',
    'httpsExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'packageExportCompatibility',
    'compatibilityClaimed',
    'reactBehaviorError'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows =
  Object.freeze([
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-source-status-revision',
      role: 'source-status-revision-js-rust-constants',
      rustIdentifiers: [
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE',
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS',
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION'
      ],
      jsFactoryFields: ['source', 'status', 'metadataRevision'],
      jsonFieldPaths: ['source', 'status', 'metadataRevision'],
      expectedFactoryValues: {
        source: nativeRootWorkLoopFinishedWorkMetadataSource,
        status: nativeRootWorkLoopFinishedWorkMetadataStatus,
        metadataRevision:
          nativeRootWorkLoopFinishedWorkMetadataRevision
      }
    }),
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-top-level-json-fields',
      role: 'top-level-json-field-set',
      rustIdentifiers: [
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_JSON_FIELDS',
        'root_work_loop_finished_work_metadata_json_value',
        'root_work_loop_finished_work_metadata_from_json_value_for_private_bridge'
      ],
      jsFactoryFields: [
        'facade',
        'completeWork',
        'pending',
        'commit',
        'placement'
      ],
      jsonFieldPaths: [
        'source',
        'status',
        'metadataRevision',
        'facade',
        'completeWork',
        'pending',
        'commit',
        'placement'
      ],
      expectedFactoryValues: {}
    }),
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-facade-canary-values',
      role: 'facade-json-fields-and-canary-values',
      rustIdentifiers: [
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACADE_JSON_FIELDS',
        'HOST_TYPE_DIV',
        'TEXT_CONTENT_TEXT',
        'HOST_OUTPUT_SHAPE_HOST_COMPONENT',
        'EXPECTED_HOST_COMPONENT_COUNT',
        'EXPECTED_HOST_TEXT_COUNT'
      ],
      jsFactoryFields: [
        'facade.rootId',
        'facade.rootTag',
        'facade.renderUpdateId',
        'facade.hostType',
        'facade.hostOutputShape',
        'facade.hostComponentCount',
        'facade.hostTextCount',
        'facade.textContent'
      ],
      jsonFieldPaths: [
        'facade.rootId',
        'facade.rootTag',
        'facade.renderUpdateId',
        'facade.hostType',
        'facade.hostOutputShape',
        'facade.hostComponentCount',
        'facade.hostTextCount',
        'facade.textContent'
      ],
      expectedFactoryValues: {
        'facade.hostType': 'div',
        'facade.hostOutputShape': 'host-component',
        'facade.hostComponentCount': 1,
        'facade.hostTextCount': 1,
        'facade.textContent': 'text'
      }
    }),
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-complete-pending-placement-values',
      role: 'complete-work-pending-placement-json-fields-and-canary-values',
      rustIdentifiers: [
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMPLETE_WORK_JSON_FIELDS',
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PENDING_JSON_FIELDS',
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_PLACEMENT_JSON_FIELDS',
        'HOST_COMPONENT_TAG',
        'HOST_TEXT_TAG',
        'DEFAULT_LANES',
        'NO_LANES',
        'PLACEMENT_APPLY_KIND_APPEND_TO_CONTAINER',
        'SIBLING_STATUS_APPEND'
      ],
      jsFactoryFields: [
        'completeWork.rootChildTag',
        'completeWork.completedChildTag',
        'completeWork.hostTextChildTag',
        'completeWork.childTags',
        'pending.recordsFinishedWork',
        'pending.pendingWorkMatchesFinishedWork',
        'pending.renderLanes',
        'pending.finishedLanes',
        'pending.remainingLanes',
        'placement.tag',
        'placement.applyKind',
        'placement.siblingStatus'
      ],
      jsonFieldPaths: [
        'completeWork.rootChildTag',
        'completeWork.completedChildTag',
        'completeWork.hostTextChildTag',
        'completeWork.childTags',
        'pending.recordsFinishedWork',
        'pending.pendingWorkMatchesFinishedWork',
        'pending.renderLanes',
        'pending.finishedLanes',
        'pending.remainingLanes',
        'placement.tag',
        'placement.applyKind',
        'placement.siblingStatus'
      ],
      expectedFactoryValues: {
        'completeWork.rootChildTag': 'HostComponent',
        'completeWork.completedChildTag': 'HostComponent',
        'completeWork.hostTextChildTag': 'HostText',
        'completeWork.childTags': ['HostComponent', 'HostText'],
        'pending.recordsFinishedWork': true,
        'pending.pendingWorkMatchesFinishedWork': true,
        'pending.renderLanes': 'Default',
        'pending.finishedLanes': 'Default',
        'pending.remainingLanes': 'NoLanes',
        'placement.tag': 'HostComponent',
        'placement.applyKind': 'append-placement-to-container',
        'placement.siblingStatus': 'append'
      }
    }),
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-commit-blocker-booleans',
      role: 'commit-json-fields-and-private-blocker-booleans',
      rustIdentifiers: [
        'ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMMIT_JSON_FIELDS',
        'mutation_execution_blocked',
        'public_root_rendering_blocked',
        'effects_refs_and_hydration_blocked',
        'host_mutation_execution_blocked',
        'public_compatibility_blocked',
        'effects_refs_and_hydration_execution_surfaces_blocked'
      ],
      jsFactoryFields: [
        'commit.commitOrderAfterPendingRecord',
        'commit.consumedFinishedWorkRecord',
        'commit.finishedWorkAfterCommit',
        'commit.finishedLanesAfterCommit',
        'commit.renderPhaseWorkAfterCommit',
        'commit.mutationExecutionBlocked',
        'commit.publicRootRenderingBlocked',
        'commit.effectsRefsAndHydrationBlocked'
      ],
      jsonFieldPaths: [
        'commit.commitOrderAfterPendingRecord',
        'commit.consumedFinishedWorkRecord',
        'commit.finishedWorkAfterCommit',
        'commit.finishedLanesAfterCommit',
        'commit.renderPhaseWorkAfterCommit',
        'commit.mutationExecutionBlocked',
        'commit.publicRootRenderingBlocked',
        'commit.effectsRefsAndHydrationBlocked'
      ],
      expectedFactoryValues: {
        'commit.commitOrderAfterPendingRecord': true,
        'commit.consumedFinishedWorkRecord': true,
        'commit.finishedWorkAfterCommit': null,
        'commit.finishedLanesAfterCommit': 'NoLanes',
        'commit.renderPhaseWorkAfterCommit': null,
        'commit.mutationExecutionBlocked': true,
        'commit.publicRootRenderingBlocked': true,
        'commit.effectsRefsAndHydrationBlocked': true
      }
    }),
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
      id: 'root-work-loop-metadata-private-factory-options',
      role: 'private-factory-options-and-rust-canary-entrypoints',
      rustIdentifiers: [
        'root_work_loop_finished_work_metadata_for_canary',
        'root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary',
        'validate_diagnostic_evidence',
        'DiagnosticPublicCompatibilityClaim'
      ],
      jsFactoryFields: [
        'options.hostType',
        'options.renderUpdateId',
        'options.rootId',
        'options.rootTag',
        'options.textContent'
      ],
      jsonFieldPaths: [
        'facade.hostType',
        'facade.renderUpdateId',
        'facade.rootId',
        'facade.rootTag',
        'facade.textContent'
      ],
      expectedFactoryValues: {
        'facade.hostType': 'div',
        'facade.textContent': 'text'
      }
    })
  ]);
const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger =
  createNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger(
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows
  );
const nativeReactDomRenderHandoffExpectedKind =
  'FastReactDomPrivateRootRenderNativeHandoffRecord';
const nativeReactDomRenderHandoffExpectedType =
  'fast.react_dom.private_root_render_native_handoff_record';
const nativeReactDomRenderHandoffExpectedOperation =
  'private-root-render-native-handoff';
const nativeReactDomRenderHandoffExpectedEntrypoint = 'react-dom/client';
const nativeReactDomRenderHandoffExpectedStatus =
  'accepted-private-root-render-native-handoff-metadata';
const nativeReactDomRenderHandoffAdapterReadyStatus =
  'ready-private-react-dom-client-root-public-facade-adapter';
const nativeReactDomRenderHandoffLifecycleAdmissionStatus =
  'admitted-private-root-bridge-request-record';
const nativeReactDomRenderHandoffLifecycleBoundaryStatus =
  'accepted-private-root-lifecycle-request-boundary';
const nativeReactDomRenderHandoffHostOutputStatus =
  'applied-private-root-initial-host-output';
const nativeReactDomRenderHandoffRootWorkLoopStatus =
  'accepted-private-root-public-facade-root-work-loop-finished-work';
const nativeReactDomRenderHandoffNativeHandoffStatus =
  'mirrored-private-native-root-request-record';
const nativeRootWorkLoopFinishedWorkMetadataFactoryOptionFields =
  Object.freeze([
    'hostType',
    'renderUpdateId',
    'rootId',
    'rootTag',
    'textContent'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFields =
  Object.freeze([
    'addonDomMutation',
    'addonDomMutationClaimed',
    'addon_dom_mutation',
    'addon_dom_mutation_claimed',
    'browserDomExecution',
    'browserDomExecutionClaimed',
    'browserDomMutation',
    'browserDomMutationClaimed',
    'browser_dom_execution',
    'browser_dom_execution_claimed',
    'browser_dom_mutation',
    'browser_dom_mutation_claimed',
    'compatibilityClaimed',
    'compatibility_claimed',
    'domMutation',
    'domMutationClaimed',
    'dom_mutation',
    'dom_mutation_claimed',
    'eventDispatch',
    'eventDispatchClaimed',
    'event_dispatch',
    'event_dispatch_claimed',
    'fakeDomMutation',
    'fakeDomMutationClaimed',
    'fake_dom_mutation',
    'fake_dom_mutation_claimed',
    'hydration',
    'hydrationClaimed',
    'hydration_claimed',
    'listenerInstallation',
    'listenerInstallationClaimed',
    'listener_installation',
    'listener_installation_claimed',
    'markerWrites',
    'markerWritesClaimed',
    'marker_writes',
    'marker_writes_claimed',
    'nativeAddonLoaded',
    'nativeAddonLoadClaimed',
    'native_addon_loaded',
    'native_addon_load_claimed',
    'nativeDomMutation',
    'nativeDomMutationClaimed',
    'nativeExecution',
    'nativeExecutionClaimed',
    'native_dom_mutation',
    'native_dom_mutation_claimed',
    'native_execution',
    'native_execution_claimed',
    'publicCompatibilityClaimed',
    'publicCreateRootEnabled',
    'publicCreateRootEnabledClaimed',
    'publicCreateRootCompatibilityClaimed',
    'publicDomMutationCompatibilityClaimed',
    'publicHydrateRootEnabled',
    'publicHydrateRootEnabledClaimed',
    'publicEventCompatibilityClaimed',
    'publicHydrateRootCompatibilityClaimed',
    'publicHydrationCompatibilityClaimed',
    'publicNativeCompatibility',
    'publicRootCompatibilitySurface',
    'publicRootCreated',
    'publicRootCreatedClaimed',
    'publicRootExecution',
    'publicRootExecutionClaimed',
    'publicRootObjectExposed',
    'publicRootObjectExposedClaimed',
    'publicRootRenderCompatibilityClaimed',
    'publicRootUnmountCompatibilityClaimed',
    'publicRootUpdateCompatibilityClaimed',
    'publicTestRendererCompatibilityClaimed',
    'public_compatibility_claimed',
    'public_create_root_enabled',
    'public_create_root_enabled_claimed',
    'public_create_root_compatibility_claimed',
    'public_dom_mutation_compatibility_claimed',
    'public_hydrate_root_enabled',
    'public_hydrate_root_enabled_claimed',
    'public_event_compatibility_claimed',
    'public_hydrate_root_compatibility_claimed',
    'public_hydration_compatibility_claimed',
    'public_native_compatibility',
    'public_root_compatibility_surface',
    'public_root_created',
    'public_root_created_claimed',
    'public_root_execution',
    'public_root_execution_claimed',
    'public_root_object_exposed',
    'public_root_object_exposed_claimed',
    'public_root_render_compatibility_claimed',
    'public_root_unmount_compatibility_claimed',
    'public_root_update_compatibility_claimed',
    'public_test_renderer_compatibility_claimed',
    'reconcilerExecution',
    'reconcilerExecutionClaimed',
    'reconciler_execution',
    'reconciler_execution_claimed',
    'rendererExecution',
    'rendererExecutionClaimed',
    'renderer_execution',
    'renderer_execution_claimed',
    'refEffects',
    'refEffectsClaimed',
    'ref_effects',
    'ref_effects_claimed',
    'rootScheduled',
    'rootScheduledClaimed',
    'root_scheduled',
    'root_scheduled_claimed'
  ]);
const nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFields =
  Object.freeze([
    ...nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFields,
    'browserDomCompatibility',
    'browserDomCompatibilityClaimed',
    'browser_dom_compatibility',
    'browser_dom_compatibility_claimed',
    'fakeDomCompatibility',
    'fakeDomCompatibilityClaimed',
    'fakeDomMutationPublicCompatibility',
    'fakeDomOutputPublicCompatibility',
    'fake_dom_compatibility',
    'fake_dom_compatibility_claimed',
    'fake_dom_mutation_public_compatibility',
    'fake_dom_output_public_compatibility',
    'nativeAddonLoaded',
    'nativeAddonLoadClaimed',
    'native_addon_loaded',
    'native_addon_load_claimed',
    'packageCompatibilityClaimed',
    'packageExportCompatibility',
    'packageExportCompatibilityClaimed',
    'package_compatibility_claimed',
    'package_export_compatibility',
    'package_export_compatibility_claimed',
    'publicNativeCompatibilityClaimed',
    'publicNativeCompatibilitySurface',
    'public_native_compatibility_claimed',
    'public_native_compatibility_surface'
  ]);
const nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFieldSet =
  new Set(nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFields);
const nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimNormalizedFieldSet =
  new Set(
    nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFields.map(
      normalizeNativeCapabilityClaimFieldName
    )
  );
const nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFieldSet =
  new Set(nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFields);
const nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimNormalizedFieldSet =
  new Set(
    nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFields.map(
      normalizeNativeCapabilityClaimFieldName
    )
  );
const nativeReactDomRenderHandoffAdmissionAllowedTrueClaimPaths =
  Object.freeze(['renderHandoff.domMutation', 'renderHandoff.fakeDomMutation']);
const nativeRootBridgeHandleAdmissionPreflightStatus =
  'preflighted-native-root-bridge-real-handle-admission';
const nativeRootBridgeRustHandleTableAdmissionSmokeStatus =
  'mirrored-native-root-bridge-rust-handle-table-admission-smoke';
const nativeRootBridgeJsonTransportSmokeStatus =
  'smoked-native-root-bridge-js-to-rust-json-transport';
const nativeRootBridgeJsonTransportParserGateStatus =
  'parsed-native-root-bridge-json-transport-schema';
const nativeRootBridgeCrossEnvironmentTeardownGateStatus =
  'diagnosed-native-root-bridge-cross-environment-teardown-isolation';
const nativeRootBridgeBatchedJsonTransportGateStatus =
  'validated-native-root-bridge-batched-json-transport-records';
const nativeRootBridgeTransportWorkerThreadTeardownGateStatus =
  'diagnosed-native-root-bridge-transport-worker-thread-teardown';
const nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus =
  'preflighted-native-root-bridge-worker-thread-teardown-boundary';
const nativeRootBridgeWorkerThreadTeardownExecutablePreflightModel =
  'fast-react-napi.WorkerThreadTeardownPreflight';
const nativeRootBridgeWorkerThreadTeardownExecutablePreflightExecutionScope =
  'rust-only-handle-table-preflight-no-node-worker-thread-no-napi-cleanup-hook';
const nativeRootBridgeWorkerThreadCleanupHookPreflightStatus =
  'preflighted-native-root-bridge-worker-thread-cleanup-hook-order';
const nativeRootBridgeWorkerThreadCleanupHookPreflightModel =
  'fast-react-napi.WorkerThreadCleanupHookOrderPreflight';
const nativeRootBridgeWorkerThreadCleanupHookPreflightExecutionScope =
  'rust-only-cleanup-hook-order-preflight-no-node-worker-thread-no-napi-cleanup-hook-execution';
const nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_STALE_EXECUTABLE_PREFLIGHT';
const nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_FORGED_EVIDENCE';
const nativeRootBridgeWorkerThreadCleanupHookOrderMismatchCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH';
const nativeRootBridgeWorkerThreadCleanupHookIdentityMismatchCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH';
const nativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaimCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM';
const nativeRootBridgeWorkerThreadCleanupHookCanonicalSetMismatchCode =
  'FAST_REACT_NAPI_CLEANUP_HOOK_CANONICAL_SET_MISMATCH';
const nativeRootBridgeWorkerThreadCleanupHookRootSourceRowId =
  'worker-render-root-stale-executable-preflight';
const nativeRootBridgeWorkerThreadCleanupHookValueSourceRowId =
  'worker-render-value-stale-executable-preflight';
const nativeRootBridgeWorkerThreadCleanupHookRootId =
  'worker-root-handle-cleanup-hook';
const nativeRootBridgeWorkerThreadCleanupHookValueId =
  'worker-value-handle-cleanup-hook';
const nativeRootBridgeWorkerThreadCleanupHookRootFunctionIdentityToken =
  'private-cleanup-hook-fn:worker-root-handle-teardown';
const nativeRootBridgeWorkerThreadCleanupHookValueFunctionIdentityToken =
  'private-cleanup-hook-fn:worker-value-handle-teardown';
const nativeRootBridgeWorkerThreadCleanupHookRootArgumentIdentityToken =
  'private-cleanup-hook-arg:worker-764-root-slot-1';
const nativeRootBridgeWorkerThreadCleanupHookValueArgumentIdentityToken =
  'private-cleanup-hook-arg:worker-764-value-slot-3';
const nativeRootBridgeWorkerThreadCleanupHookCount = 2;
const nativeRootBridgeBatchLifecycleConsumerStatus =
  'consumed-native-root-bridge-batch-lifecycle-records';
const nativeRootBridgeBatchLifecycleConsumerModel =
  'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer';
const nativeRootBridgeBatchLifecycleConsumerCleanupHookNotRequiredStatus =
  'not-required';
const nativeRootBridgeBatchLifecycleConsumerCleanupHookAcceptedStatus =
  'accepted';
const nativeRootBridgeBatchLifecycleConsumerCleanupHookRejectedStatus =
  'rejected';
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatus =
  'linked-native-root-bridge-batch-lifecycle-consumer-json-batch-roundtrip';
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkModel =
  'fast-react-napi.NativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink';
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkLinkedStatus =
  'linked';
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectedStatus =
  'rejected';
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes =
  Object.freeze({
    cleanupHookStatusMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_CLEANUP_STATUS_MISMATCH',
    consumerRowIdMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ID_MISMATCH',
    kindTransitionMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_KIND_TRANSITION_MISMATCH',
    publicNativeExecutionClaim:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_PUBLIC_NATIVE_EXECUTION_CLAIM',
    rowOrderMismatch:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_ROW_ORDER_MISMATCH',
    staleOrForeignJsonBatchRow:
      'FAST_REACT_NAPI_BATCH_LIFECYCLE_CONSUMER_STALE_OR_FOREIGN_JSON_BATCH_ROW'
  });
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCaseIds =
  Object.freeze([
    'consumer-row-id-mismatch',
    'consumer-row-order-mismatch',
    'consumer-kind-transition-mismatch',
    'consumer-cleanup-status-mismatch',
    'stale-or-foreign-json-batch-row',
    'public-native-execution-claim'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedgerStatus =
  'blocked-private-native-root-bridge-json-batch-lifecycle-generation-ledger';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedgerModel =
  'fast-react-napi.NativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionEvaluationMode =
  'static-source-token-ledger-no-native-load-no-package-export';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionEvidenceKind =
  'source-owned-rust-identifier-set';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus =
  'accepted-blocked-private-native-json-generation-evidence';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedStatus =
  'rejected-native-json-generation-evidence';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionModuleSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/mod.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/json_transport.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportParserSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/json_transport_parser.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/batch_lifecycle.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleAlgorithmsSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/batch_lifecycle_algorithms.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionErrorsSourceFile =
  'crates/fast-react-napi/src/root_bridge_requests/errors.rs';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceFile =
  nativeRootBridgeJsonBatchLifecycleGenerationAdmissionModuleSourceFile;
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceWorker =
  'worker-873-native-lifecycle-no-stale-execution';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceWorkerProgress =
  'worker-progress/worker-873-native-lifecycle-no-stale-execution.md';
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes =
  Object.freeze({
    callerBuilt:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_CALLER_BUILT',
    canonicalSetMismatch:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_CANONICAL_SET_MISMATCH',
    cleanupHookExecutionClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_CLEANUP_HOOK_EXECUTION_CLAIM',
    compatibilityAliasClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_COMPATIBILITY_ALIAS_CLAIM',
    nativeAddonLoadClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_NATIVE_ADDON_LOAD_CLAIM',
    packageExportClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_PACKAGE_EXPORT_CLAIM',
    proseEvidence:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_PROSE_EVIDENCE',
    publicNativeExecutionClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_PUBLIC_NATIVE_EXECUTION_CLAIM',
    rendererReconcilerOutputClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_RENDERER_RECONCILER_OUTPUT_CLAIM',
    sourceRoleMismatch:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_SOURCE_ROLE_MISMATCH',
    sourceSyntaxOnly:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_SOURCE_SYNTAX_ONLY',
    staleOrForeign:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_STALE_OR_FOREIGN',
    workerThreadExecutionClaim:
      'FAST_REACT_NAPI_JSON_BATCH_LIFECYCLE_GENERATION_LEDGER_WORKER_THREAD_EXECUTION_CLAIM'
  });
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCaseIds =
  Object.freeze([
    'stale-or-foreign-source-evidence',
    'caller-built-row',
    'prose-test-title-error-message-evidence',
    'source-syntax-only-evidence',
    'public-native-execution-claim',
    'package-export-claim',
    'native-addon-load-claim',
    'cleanup-hook-execution-claim',
    'worker-thread-execution-claim',
    'renderer-reconciler-output-claim',
    'compatibility-alias-claim',
    'canonical-set-mismatch'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionPublicClaimFields =
  Object.freeze([
    'nativeExecution',
    'publicNativeExecution',
    'publicNativeCompatibility',
    'nativeCompatibilityClaimed',
    'nativePackageCompatibilityClaimed',
    'compatibilityClaimed'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionPackageClaimFields =
  Object.freeze([
    'packageExportCompatibility',
    'packageCompatibilityClaimed',
    'packageExportClaimed',
    'nativePackageExportClaimed',
    'nativePackageCompatibilityClaimed',
    'packageExportsOpened'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCompatibilityAliasFields =
  Object.freeze([
    'compatibilityAliasClaimed',
    'compatibilityAliasesClaimed',
    'legacyCompatibilityAlias',
    'reactNativeCompatibility',
    'publicCompatibilityAlias'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRowFields =
  Object.freeze([
    'id',
    'role',
    'sourceFile',
    'sourceFiles',
    'evidenceKind',
    'sourceIdentifiers',
    'status',
    'code',
    'sourceOwnedEvidence',
    'blockedPrivateEvidence',
    'publicAdmission',
    'callerShapedEvidence',
    'proseEvidence',
    'testTitleEvidence',
    'errorMessageEvidence',
    'sourceSyntaxOnly',
    'nativeAddonLoaded',
    'nativeExecution',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'packageExportCompatibility',
    'compatibilityAlias',
    'reactBehaviorError'
  ]);
const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows =
  Object.freeze([
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-executor-status',
      role: 'executor-status-and-rejection-codes',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionModuleSourceFile,
      sourceIdentifiers: [
        'NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STATUS',
        'NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_MODEL',
        'NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_STALE_OR_FOREIGN_ROW_CODE',
        'NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_CALLER_BUILT_ROW_CODE',
        'NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_PUBLIC_NATIVE_EXECUTION_CLAIM_CODE'
      ]
    }),
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-source-guard',
      role: 'source-owned-generation-handle-table-guard',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportSourceFile,
      sourceIdentifiers: [
        'NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard',
        'executor_generation',
        'batch_index',
        'table_environment_id',
        'source_root_handle',
        'root_handle_current_generation',
        'source_value_handle',
        'value_handle_current_generation'
      ]
    }),
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-executor-row',
      role: 'accepted-row-carries-source-guard',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportSourceFile,
      sourceFiles: [
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportSourceFile,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleAlgorithmsSourceFile
      ],
      sourceIdentifiers: [
        'NativeRootBridgeJsonBatchLifecycleExecutorRow',
        'NativeRootBridgeJsonBatchLifecycleExecutorRow::applied',
        'source_owned_json_row',
        'rust_state_machine_execution',
        'source_guard'
      ]
    }),
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-generation-allocation',
      role: 'generation-and-json-value-reuse-guard',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleAlgorithmsSourceFile,
      sourceFiles: [
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleAlgorithmsSourceFile,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionModuleSourceFile,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionErrorsSourceFile
      ],
      sourceIdentifiers: [
        'NEXT_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATION',
        'allocate_native_root_bridge_json_batch_lifecycle_executor_generation',
        'validate_executor_value_handle_not_reused',
        'FAST_REACT_NAPI_ROOT_REQUEST_VALUE_HANDLE_REUSE'
      ]
    }),
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-source-row-validator',
      role: 'stale-caller-public-claim-source-row-validator',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportParserSourceFile,
      sourceIdentifiers: [
        'validate_native_root_bridge_json_batch_lifecycle_executor_source_rows',
        'native_root_bridge_json_batch_lifecycle_executor_source_guard_matches',
        'native_root_bridge_json_batch_lifecycle_executor_rows_match_source',
        'has_native_root_bridge_json_batch_lifecycle_executor_public_native_claim'
      ]
    }),
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
      id: 'worker-873-json-batch-lifecycle-replay-consumption',
      role: 'single-consume-generation-replay-guard',
      sourceFile:
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportParserSourceFile,
      sourceFiles: [
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionJsonTransportParserSourceFile,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionModuleSourceFile,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionBatchLifecycleSourceFile
      ],
      sourceIdentifiers: [
        'CONSUMED_NATIVE_ROOT_BRIDGE_JSON_BATCH_LIFECYCLE_EXECUTOR_GENERATIONS',
        'validate_and_consume_native_root_bridge_json_batch_lifecycle_executor',
        'json_batch_lifecycle_executor_replay_guard_consumed',
        'json_batch_lifecycle_executor_source_rows_validated'
      ]
    })
  ]);
const nativeRootBridgeJsonTransportBatchResponseSequenceGateStatus =
  'diagnosed-native-root-bridge-json-batch-response-sequence';
const nativeRootBridgeJsonTransportBatchResponseSequenceBatchId =
  'native-root-bridge-json-batch-552';
const nativeRootBridgeJsonTransportStreamBatchRoundtripGateStatus =
  'diagnosed-native-root-bridge-json-stream-batch-roundtrip';
const nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId =
  'native-root-bridge-json-stream-batch-roundtrip-587';
const nativeRootBridgeJsonTransportStreamBatchOutOfOrderChunkCode =
  'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_OUT_OF_ORDER';
const nativeRootBridgeJsonTransportStreamBatchDuplicateChunkCode =
  'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_DUPLICATE_CHUNK';
const nativeRootBridgeJsonTransportStreamBatchMissingChunkCode =
  'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_MISSING_CHUNK';
const nativeRootBridgeJsonTransportStreamBatchPostTeardownChunkCode =
  'FAST_REACT_NAPI_ROOT_RESPONSE_STREAM_CHUNK_AFTER_TEARDOWN';
const nativeRootBridgeJsonTransportFormat = 'json';
const nativeRootBridgeJsonTransportSchemaVersion = 1;
const nativeRootBridgeRequestValidationModel =
  'fast-react-napi.NativeRootBridgeRequestSequenceValidator';
const nativeRootBridgeHandleTableModel = 'fast-react-napi.BridgeHandleTable';
const nativeRootBridgeRequestShapeErrorCode =
  'FAST_REACT_NATIVE_ROOT_BRIDGE_REQUEST_SHAPE_INVALID';
const nativeRootBridgeRequestKindCreate = 'create';
const nativeRootBridgeRequestKindRender = 'render';
const nativeRootBridgeRequestKindUnmount = 'unmount';
const nativeRootBridgeHandleKindRoot = 'root';
const nativeRootBridgeHandleKindValue = 'value';
const nativeRootBridgeRootHandleStateActive = 'active';
const nativeRootBridgeRootHandleStateRetired = 'retired';
const nativeRootBridgeLifecycleTransitionNoneToActive = 'none->active';
const nativeRootBridgeLifecycleTransitionActiveToActive = 'active->active';
const nativeRootBridgeLifecycleTransitionActiveToRetired = 'active->retired';
const nativeRootBridgeJsonTransportBatchLifecycleStateNone = 'none';
const nativeRootBridgeJsonTransportBatchLifecycleStateActive = 'active';
const nativeRootBridgeJsonTransportBatchLifecycleStateRetired = 'retired';
const nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted = 'accepted';
const nativeRootBridgeJsonTransportBatchLifecycleStatusError = 'error';
const nativeRootBridgeRequestKinds = Object.freeze([
  nativeRootBridgeRequestKindCreate,
  nativeRootBridgeRequestKindRender,
  nativeRootBridgeRequestKindUnmount
]);
const nativeRootBridgeHandleKinds = Object.freeze([
  nativeRootBridgeHandleKindRoot,
  nativeRootBridgeHandleKindValue
]);
const nativeRootBridgeRootHandleStates = Object.freeze([
  nativeRootBridgeRootHandleStateActive,
  nativeRootBridgeRootHandleStateRetired
]);
const nativeRootBridgeLifecycleTransitions = Object.freeze([
  nativeRootBridgeLifecycleTransitionNoneToActive,
  nativeRootBridgeLifecycleTransitionActiveToActive,
  nativeRootBridgeLifecycleTransitionActiveToRetired
]);
const nativeRootBridgeJsRequestRecordFields = Object.freeze([
  'requestId',
  'kind',
  'environmentId',
  'rootHandle',
  'rootId',
  'valueHandle',
  'rootHandleState'
]);
const nativeRootBridgeRustRequestRecordFields = Object.freeze([
  'request_id',
  'kind',
  'environment_id',
  'root_handle',
  'root_id',
  'value_handle',
  'root_handle_state'
]);
const nativeRootBridgeRustValidationRecordFields = Object.freeze([
  'request_id',
  'kind',
  'environment_id',
  'root_handle',
  'root_id',
  'value_handle',
  'root_handle_state',
  'lifecycle_transition',
  'root_handle_validated',
  'value_handle_validated'
]);
const nativeRootBridgeJsHandleFields = Object.freeze([
  'environmentId',
  'slot',
  'generation',
  'kind'
]);
const nativeRootBridgeRustHandleFields = Object.freeze([
  'environment_id',
  'slot',
  'generation',
  'kind'
]);
const nativeRootBridgeHandleAdmissionActions = Object.freeze([
  'admit-root-handle',
  'admit-value-handle',
  'validate-active-root-handle',
  'validate-value-handle',
  'retire-root-handle',
  'validate-retired-root-handle'
]);
const nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields = Object.freeze([
  'request_id',
  'kind',
  'lifecycle_transition',
  'root_handle_state_before',
  'root_handle_state_after',
  'root_handle_action',
  'root_handle_current_generation',
  'value_handle_action',
  'value_handle_current_generation',
  'retired_root_source_error_code'
]);
const nativeRootBridgeJsonTransportEnvelopeFields = Object.freeze([
  'transport',
  'schemaVersion',
  'requestRecords'
]);
const nativeRootBridgeJsonTransportBatchLifecycleStates = Object.freeze([
  nativeRootBridgeJsonTransportBatchLifecycleStateNone,
  nativeRootBridgeJsonTransportBatchLifecycleStateActive,
  nativeRootBridgeJsonTransportBatchLifecycleStateRetired
]);
const nativeRootBridgeJsonTransportBatchLifecycleStatuses = Object.freeze([
  nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
  nativeRootBridgeJsonTransportBatchLifecycleStatusError
]);
const nativeRootBridgeJsonTransportBatchLifecycleRowFields = Object.freeze([
  'id',
  'batchIndex',
  'requestId',
  'kind',
  'lifecycleBefore',
  'lifecycleAfter',
  'lifecycleTransition',
  'status',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeJsonTransportBatchResponseErrorRowStatusNotError =
  'not-error-row';
const nativeRootBridgeJsonTransportBatchResponseErrorRowStatusLifecycleError =
  'lifecycle-error-row';
const nativeRootBridgeJsonTransportBatchResponseErrorRowStatusDeterministic =
  'deterministic-error-row';
const nativeRootBridgeJsonTransportBatchResponseErrorRowStatuses =
  Object.freeze([
    nativeRootBridgeJsonTransportBatchResponseErrorRowStatusNotError,
    nativeRootBridgeJsonTransportBatchResponseErrorRowStatusLifecycleError,
    nativeRootBridgeJsonTransportBatchResponseErrorRowStatusDeterministic
  ]);
const nativeRootBridgeJsonTransportBatchResponseTeardownStateRootUninitialized =
  'root-uninitialized';
const nativeRootBridgeJsonTransportBatchResponseTeardownStateRootActive =
  'root-active';
const nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired =
  'root-retired';
const nativeRootBridgeJsonTransportBatchResponseTeardownStates = Object.freeze([
  nativeRootBridgeJsonTransportBatchResponseTeardownStateRootUninitialized,
  nativeRootBridgeJsonTransportBatchResponseTeardownStateRootActive,
  nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
]);
const nativeRootBridgeJsonTransportBatchResponseSequenceRowFields =
  Object.freeze([
    'id',
    'batchId',
    'requestOrder',
    'responseOrder',
    'requestId',
    'kind',
    'responseStatus',
    'errorRowStatus',
    'teardownState',
    'code',
    'sourceErrorCode',
    'boundaryErrorCode',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'reactBehaviorError'
  ]);
const nativeRootBridgeJsonTransportStreamBatchRoundtripChunkKinds =
  Object.freeze(['metadata', 'payload']);
const nativeRootBridgeJsonTransportStreamBatchRoundtripChunkStatuses =
  Object.freeze(['accepted', 'error']);
const nativeRootBridgeJsonTransportStreamBatchRoundtripAssemblyStates =
  Object.freeze(['partial', 'assembled', 'rejected']);
const nativeRootBridgeJsonTransportStreamBatchRoundtripTeardownBlockers =
  Object.freeze([
    'none',
    'root-retired-after-assembly',
    'post-teardown-chunk-blocked'
  ]);
const nativeRootBridgeJsonTransportStreamBatchRoundtripErrorCaseIds =
  Object.freeze([
    'stream-chunk-out-of-order',
    'stream-chunk-duplicate',
    'stream-chunk-missing',
    'stream-chunk-after-teardown'
  ]);
const nativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowFields =
  Object.freeze([
    'id',
    'batchId',
    'streamId',
    'requestId',
    'requestOrder',
    'responseOrder',
    'chunkOrder',
    'batchSequence',
    'chunkKind',
    'chunkStatus',
    'responseStatus',
    'assemblyState',
    'assembledResponse',
    'teardownState',
    'teardownBlocker',
    'code',
    'sourceErrorCode',
    'boundaryErrorCode',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'crossEnvironmentHandleReuseBlocked',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ]);
const nativeRootBridgeEnvironmentTeardownFields = Object.freeze([
  'requestedEnvironmentId',
  'tableEnvironmentId',
  'environmentMatched',
  'rootHandlesInvalidated',
  'valueHandlesInvalidated',
  'totalHandlesInvalidated',
  'toreDownHandles'
]);
const nativeRootBridgeCrossEnvironmentTeardownRowFields = Object.freeze([
  'id',
  'operation',
  'handleKind',
  'tableEnvironmentId',
  'handleEnvironmentId',
  'slot',
  'handleGeneration',
  'currentGeneration',
  'recordId',
  'errorCode',
  'rejectedByHandleTable',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeTransportWorkerThreadTeardownRowFields = Object.freeze([
  'id',
  'operation',
  'workerThreadId',
  'transport',
  'sourceBatchIndex',
  'requestId',
  'handleKind',
  'tableEnvironmentId',
  'handleEnvironmentId',
  'slot',
  'handleGeneration',
  'currentGeneration',
  'recordId',
  'errorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeWorkerThreadTeardownExecutablePreflightRowFields =
  Object.freeze([
    'id',
    'operation',
    'assertion',
    'workerThreadId',
    'handleKind',
    'tableEnvironmentId',
    'handleEnvironmentId',
    'slot',
    'handleGeneration',
    'currentGeneration',
    'recordId',
    'sourceErrorCode',
    'boundaryErrorCode',
    'rejectedByBoundary',
    'peerInvariantPreserved',
    'preflightPassed',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ]);
const nativeRootBridgeWorkerThreadCleanupHookPreflightRowFields =
  Object.freeze([
    'id',
    'operation',
    'cleanupHookId',
    'cleanupHookFunctionIdentityToken',
    'cleanupHookArgumentIdentityToken',
    'registrationOrder',
    'expectedExecutionOrder',
    'observedExecutionOrder',
    'status',
    'code',
    'sourcePreflightStatus',
    'sourceWorkerThreadId',
    'sourceEnvironmentId',
    'sourceRowId',
    'sourceHandleKind',
    'sourceErrorCode',
    'sourceBoundaryErrorCode',
    'canonicalExecutableEvidence',
    'cleanupHookOrderPrivate',
    'cleanupHookIdentityPrivate',
    'staleOrForgedCleanupEvidenceRejected',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ]);
const nativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaimFields =
  Object.freeze([
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'publicNativeCompatibility',
    'compatibilityClaimed',
    'nativeCompatibilityClaimed',
    'nativePackageCompatibilityClaimed',
    'packageCompatibilityClaimed'
  ]);
const nativeRootBridgeBatchLifecycleConsumerCleanupHookStatuses =
  Object.freeze([
    nativeRootBridgeBatchLifecycleConsumerCleanupHookNotRequiredStatus,
    nativeRootBridgeBatchLifecycleConsumerCleanupHookAcceptedStatus,
    nativeRootBridgeBatchLifecycleConsumerCleanupHookRejectedStatus
  ]);
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatuses =
  Object.freeze([
    nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkLinkedStatus,
    nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectedStatus
  ]);
const nativeRootBridgeBatchLifecycleConsumerRowFields = Object.freeze([
  'id',
  'batchIndex',
  'requestId',
  'kind',
  'lifecycleTransition',
  'rootHandleAction',
  'rootHandleStateBefore',
  'rootHandleStateAfter',
  'rootHandleCurrentGeneration',
  'valueHandleAction',
  'valueHandleCurrentGeneration',
  'retiredRootSourceErrorCode',
  'cleanupHookEvidenceRequired',
  'cleanupHookEvidenceStatus',
  'cleanupHookEvidenceRowId',
  'cleanupHookSourceRowId',
  'cleanupHookSourceHandleKind',
  'cleanupHookCanonicalExecutableEvidence',
  'status',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'nodeWorkerThreadsExecution',
  'napiCleanupHookExecution',
  'publicNativeCompatibility',
  'reactBehaviorError'
]);
const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields =
  Object.freeze([
    'id',
    'consumerRowId',
    'lifecycleRowId',
    'responseRowId',
    'streamMetadataRowId',
    'streamPayloadRowId',
    'batchId',
    'streamId',
    'batchIndex',
    'requestId',
    'kind',
    'lifecycleTransition',
    'rootHandleAction',
    'cleanupHookEvidenceStatus',
    'requestOrder',
    'responseOrder',
    'metadataBatchSequence',
    'payloadBatchSequence',
    'metadataChunkKind',
    'payloadChunkKind',
    'responseStatus',
    'payloadAssemblyState',
    'teardownState',
    'status',
    'code',
    'nativeAddonLoaded',
    'nativeExecution',
    'rendererExecution',
    'reconcilerExecution',
    'nodeWorkerThreadsExecution',
    'napiCleanupHookExecution',
    'publicNativeCompatibility',
    'reactBehaviorError'
  ]);
const nativeRootBridgeJsonTransportParseErrorCodes = Object.freeze({
  expectedObject:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_EXPECTED_OBJECT',
  invalidFieldType:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_FIELD_TYPE',
  invalidJson:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_INVALID_JSON',
  missingField:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_MISSING_FIELD',
  unexpectedField:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNEXPECTED_FIELD',
  unsupportedFieldValue:
    'FAST_REACT_NAPI_ROOT_REQUEST_JSON_TRANSPORT_PARSE_UNSUPPORTED_FIELD_VALUE'
});
const nativeRootBridgeJsonTransportErrorDiagnosticRowFields = Object.freeze([
  'id',
  'category',
  'phase',
  'name',
  'code',
  'sourceErrorCode',
  'boundaryErrorCode',
  'nativeAddonLoaded',
  'nativeExecution',
  'rendererExecution',
  'reconcilerExecution',
  'reactBehaviorError'
]);
const nativeRootBridgeJsonTransportErrorDiagnosticCaseIds = Object.freeze([
  'malformed-payload',
  'wrong-environment-root-handle',
  'stale-value-handle-generation',
  'render-before-create-lifecycle-order'
]);
const nativeRootBridgeJsonTransportBatchErrorCaseIds = Object.freeze([
  'batch-render-before-create-lifecycle-order',
  'batch-root-handle-state-mismatch',
  'batch-create-after-create-lifecycle-order',
  'batch-request-after-unmount-lifecycle-order',
  'batch-request-id-out-of-order'
]);
const nativeRootBridgeValidationErrorCodes = Object.freeze({
  createAfterRootCreated:
    'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
  handleMismatch: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_MISMATCH',
  invalidHandle: 'FAST_REACT_NAPI_INVALID_HANDLE',
  recordEnvironmentMismatch:
    'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ENVIRONMENT_MISMATCH',
  requestAfterUnmount: 'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
  rootHandleStateMismatch:
    'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
  rootHandleStillActive:
    'FAST_REACT_NAPI_ROOT_REQUEST_RETIRED_HANDLE_STILL_ACTIVE',
  rootIdMismatch: 'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_ROOT_ID_MISMATCH',
  sequenceMustStartWithCreate:
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
  sequenceOutOfOrder:
    'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER',
  shapeInvalid: nativeRootBridgeRequestShapeErrorCode,
  staleHandle: 'FAST_REACT_NAPI_STALE_HANDLE',
  unexpectedValueHandle:
    'FAST_REACT_NAPI_ROOT_REQUEST_UNEXPECTED_VALUE_HANDLE',
  wrongEnvironment: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
  wrongHandleKind: 'FAST_REACT_NAPI_WRONG_HANDLE_KIND'
});
const nativeRootBridgeHandleAdmissionPreflight = Object.freeze({
  preflightStatus: nativeRootBridgeHandleAdmissionPreflightStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  admissionActions: nativeRootBridgeHandleAdmissionActions
});
const nativeRootBridgeRustHandleTableAdmissionSmoke = Object.freeze({
  smokeStatus: nativeRootBridgeRustHandleTableAdmissionSmokeStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  rustAdmissionSmokeRecordFields:
    nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields,
  stateTransitions: nativeRootBridgeLifecycleTransitions,
  admissionActions: nativeRootBridgeHandleAdmissionActions,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeJsonTransportStreamBatchRoundtripGate = Object.freeze({
  streamRoundtripGateStatus:
    nativeRootBridgeJsonTransportStreamBatchRoundtripGateStatus,
  batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
  streamId: nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId,
  validationModel: nativeRootBridgeRequestValidationModel,
  jsonTransportStreamBatchRoundtripChunkRowFields:
    nativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowFields,
  jsonTransportStreamBatchRoundtripErrorCaseIds:
    nativeRootBridgeJsonTransportStreamBatchRoundtripErrorCaseIds,
  chunkKinds: nativeRootBridgeJsonTransportStreamBatchRoundtripChunkKinds,
  chunkStatuses: nativeRootBridgeJsonTransportStreamBatchRoundtripChunkStatuses,
  assemblyStates: nativeRootBridgeJsonTransportStreamBatchRoundtripAssemblyStates,
  teardownBlockers:
    nativeRootBridgeJsonTransportStreamBatchRoundtripTeardownBlockers,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  crossEnvironmentHandleReuseBlocked: true,
  publicNativeCompatibility: false,
  reactBehaviorError: false
});
const nativeRootBridgeJsonTransportBatchResponseSequenceGate = Object.freeze({
  responseSequenceGateStatus:
    nativeRootBridgeJsonTransportBatchResponseSequenceGateStatus,
  batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
  validationModel: nativeRootBridgeRequestValidationModel,
  jsonTransportBatchResponseSequenceRowFields:
    nativeRootBridgeJsonTransportBatchResponseSequenceRowFields,
  errorRowStatuses:
    nativeRootBridgeJsonTransportBatchResponseErrorRowStatuses,
  teardownStates: nativeRootBridgeJsonTransportBatchResponseTeardownStates,
  streamRoundtripGate: nativeRootBridgeJsonTransportStreamBatchRoundtripGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  reactBehaviorError: false
});
const nativeRootBridgeBatchedJsonTransportGate = Object.freeze({
  batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
  validationModel: nativeRootBridgeRequestValidationModel,
  lifecycleStates: nativeRootBridgeJsonTransportBatchLifecycleStates,
  lifecycleStatuses: nativeRootBridgeJsonTransportBatchLifecycleStatuses,
  jsonTransportBatchLifecycleRowFields:
    nativeRootBridgeJsonTransportBatchLifecycleRowFields,
  jsonTransportBatchErrorCaseIds:
    nativeRootBridgeJsonTransportBatchErrorCaseIds,
  responseSequenceGate: nativeRootBridgeJsonTransportBatchResponseSequenceGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeJsonTransportParserGate = Object.freeze({
  parserGateStatus: nativeRootBridgeJsonTransportParserGateStatus,
  transport: nativeRootBridgeJsonTransportFormat,
  schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
  jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
  jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
  parseErrorCodes: nativeRootBridgeJsonTransportParseErrorCodes,
  jsonTransportErrorDiagnosticRowFields:
    nativeRootBridgeJsonTransportErrorDiagnosticRowFields,
  jsonTransportErrorDiagnosticCaseIds:
    nativeRootBridgeJsonTransportErrorDiagnosticCaseIds,
  batchedRecordGate: nativeRootBridgeBatchedJsonTransportGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeJsonTransportSmoke = Object.freeze({
  smokeStatus: nativeRootBridgeJsonTransportSmokeStatus,
  transport: nativeRootBridgeJsonTransportFormat,
  schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
  handleTableModel: nativeRootBridgeHandleTableModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
  jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
  parserGate: nativeRootBridgeJsonTransportParserGate,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false
});
const nativeRootBridgeCrossEnvironmentTeardownGate = Object.freeze({
  teardownGateStatus: nativeRootBridgeCrossEnvironmentTeardownGateStatus,
  handleTableModel: nativeRootBridgeHandleTableModel,
  environmentTeardownFields: nativeRootBridgeEnvironmentTeardownFields,
  teardownDiagnosticRowFields:
    nativeRootBridgeCrossEnvironmentTeardownRowFields,
  mismatchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 1496,
    tableEnvironmentId: 496,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0
  }),
  matchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 496,
    tableEnvironmentId: 496,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 1
  }),
  rows: Object.freeze([
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-active-after-mismatched-teardown',
      operation: 'mismatched-teardown',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 49601,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-active-after-mismatched-teardown',
      operation: 'mismatched-teardown',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 49602,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-stale-after-own-teardown',
      operation: 'matched-teardown',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-stale-after-own-teardown',
      operation: 'matched-teardown',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-wrong-environment-in-peer-table',
      operation: 'wrong-environment-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: null,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-wrong-environment-in-peer-table',
      operation: 'wrong-environment-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: null,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'peer-root-active-after-first-teardown',
      operation: 'post-teardown-peer-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 1496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 149601,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'peer-value-active-after-first-teardown',
      operation: 'post-teardown-peer-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 1496,
      handleEnvironmentId: 1496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 149602,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-root-stale-after-slot-reuse',
      operation: 'post-reuse-stale-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'first-value-stale-after-slot-reuse',
      operation: 'post-reuse-stale-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'replacement-root-active-after-slot-reuse',
      operation: 'post-reuse-active-validation',
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 1,
      handleGeneration: 2,
      currentGeneration: 2,
      recordId: 49603,
      errorCode: null
    }),
    freezeNativeRootBridgeTeardownDiagnosticRow({
      id: 'replacement-value-active-after-slot-reuse',
      operation: 'post-reuse-active-validation',
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 496,
      handleEnvironmentId: 496,
      slot: 2,
      handleGeneration: 2,
      currentGeneration: 2,
      recordId: 49604,
      errorCode: null
    })
  ]),
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  reactBehaviorError: false
});

function freezeNativeTarget({ target, platform, arch, libc, toolchain }) {
  return Object.freeze({
    target,
    platform,
    arch,
    libc: libc ?? null,
    toolchain: toolchain ?? null,
    optionalPackageName: `${optionalPackagePrefix}${target}`,
    nativeFileName: `${nativeAddonName}.${target}.node`
  });
}

const nativeTargetMatrix = Object.freeze([
  freezeNativeTarget({ target: 'darwin-arm64', platform: 'darwin', arch: 'arm64' }),
  freezeNativeTarget({ target: 'darwin-x64', platform: 'darwin', arch: 'x64' }),
  freezeNativeTarget({
    target: 'linux-arm64-gnu',
    platform: 'linux',
    arch: 'arm64',
    libc: 'gnu'
  }),
  freezeNativeTarget({
    target: 'linux-arm64-musl',
    platform: 'linux',
    arch: 'arm64',
    libc: 'musl'
  }),
  freezeNativeTarget({
    target: 'linux-x64-gnu',
    platform: 'linux',
    arch: 'x64',
    libc: 'gnu'
  }),
  freezeNativeTarget({
    target: 'linux-x64-musl',
    platform: 'linux',
    arch: 'x64',
    libc: 'musl'
  }),
  freezeNativeTarget({
    target: 'win32-arm64-msvc',
    platform: 'win32',
    arch: 'arm64',
    toolchain: 'msvc'
  }),
  freezeNativeTarget({
    target: 'win32-x64-msvc',
    platform: 'win32',
    arch: 'x64',
    toolchain: 'msvc'
  })
]);

const nativeTargetsByName = Object.freeze(
  Object.fromEntries(nativeTargetMatrix.map((target) => [target.target, target]))
);

const platformPackages = Object.freeze(
  Object.fromEntries(
    nativeTargetMatrix.map((target) => [
      target.target,
      target.optionalPackageName
    ])
  )
);

const supportedNativeTargets = Object.freeze(
  nativeTargetMatrix.map((target) => target.target)
);

function freezeNativeRootBridgeEnvironmentTeardown({
  requestedEnvironmentId,
  tableEnvironmentId,
  rootHandlesInvalidated,
  valueHandlesInvalidated
}) {
  const totalHandlesInvalidated =
    rootHandlesInvalidated + valueHandlesInvalidated;

  return Object.freeze({
    requestedEnvironmentId,
    tableEnvironmentId,
    environmentMatched: requestedEnvironmentId === tableEnvironmentId,
    rootHandlesInvalidated,
    valueHandlesInvalidated,
    totalHandlesInvalidated,
    toreDownHandles: totalHandlesInvalidated > 0
  });
}

function freezeNativeRootBridgeTeardownDiagnosticRow({
  id,
  operation,
  handleKind,
  tableEnvironmentId,
  handleEnvironmentId,
  slot,
  handleGeneration,
  currentGeneration,
  recordId,
  errorCode
}) {
  return Object.freeze({
    id,
    operation,
    handleKind,
    tableEnvironmentId,
    handleEnvironmentId,
    slot,
    handleGeneration,
    currentGeneration,
    recordId,
    errorCode,
    rejectedByHandleTable: errorCode !== null,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeTransportWorkerThreadTeardownRow({
  id,
  operation,
  workerThreadId,
  sourceBatchIndex,
  requestId,
  handleKind,
  tableEnvironmentId,
  handleEnvironmentId,
  slot,
  handleGeneration,
  currentGeneration,
  recordId,
  errorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    id,
    operation,
    workerThreadId,
    transport: nativeRootBridgeJsonTransportFormat,
    sourceBatchIndex,
    requestId,
    handleKind,
    tableEnvironmentId,
    handleEnvironmentId,
    slot,
    handleGeneration,
    currentGeneration,
    recordId,
    errorCode,
    boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
  id,
  operation,
  assertion,
  workerThreadId,
  handleKind,
  tableEnvironmentId,
  handleEnvironmentId,
  slot,
  handleGeneration,
  currentGeneration,
  recordId,
  sourceErrorCode,
  boundaryErrorCode,
  rejectedByBoundary,
  peerInvariantPreserved,
  preflightPassed
}) {
  return Object.freeze({
    id,
    operation,
    assertion,
    workerThreadId,
    handleKind,
    tableEnvironmentId,
    handleEnvironmentId,
    slot,
    handleGeneration,
    currentGeneration,
    recordId,
    sourceErrorCode,
    boundaryErrorCode,
    rejectedByBoundary,
    peerInvariantPreserved,
    preflightPassed,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
  id,
  operation,
  cleanupHookId,
  cleanupHookFunctionIdentityToken,
  cleanupHookArgumentIdentityToken,
  registrationOrder,
  expectedExecutionOrder,
  observedExecutionOrder,
  status,
  code,
  sourcePreflightStatus,
  sourceWorkerThreadId,
  sourceEnvironmentId,
  sourceRowId,
  sourceHandleKind,
  sourceErrorCode,
  sourceBoundaryErrorCode,
  canonicalExecutableEvidence,
  cleanupHookOrderPrivate,
  cleanupHookIdentityPrivate,
  staleOrForgedCleanupEvidenceRejected
}) {
  return Object.freeze({
    id,
    operation,
    cleanupHookId,
    cleanupHookFunctionIdentityToken,
    cleanupHookArgumentIdentityToken,
    registrationOrder,
    expectedExecutionOrder,
    observedExecutionOrder,
    status,
    code,
    sourcePreflightStatus,
    sourceWorkerThreadId,
    sourceEnvironmentId,
    sourceRowId,
    sourceHandleKind,
    sourceErrorCode,
    sourceBoundaryErrorCode,
    canonicalExecutableEvidence,
    cleanupHookOrderPrivate,
    cleanupHookIdentityPrivate,
    staleOrForgedCleanupEvidenceRejected,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeWorkerThreadCleanupHookPreflight(rows) {
  const frozenRows = Object.freeze([...rows]);
  const acceptedCleanupEvidenceCount = frozenRows.filter(
    (row) => row.status === 'accepted'
  ).length;
  const rejectedCleanupEvidenceCount = frozenRows.filter(
    (row) => row.status === 'rejected'
  ).length;
  const staleOrForgedCleanupEvidenceRejectionCount = frozenRows.filter(
    (row) => row.staleOrForgedCleanupEvidenceRejected
  ).length;
  const canonicalExecutableEvidenceAccepted =
    hasExactNativeRootBridgeWorkerThreadCleanupHookCanonicalEvidenceSet(
      frozenRows
    );
  const preflight = {
    preflightStatus: nativeRootBridgeWorkerThreadCleanupHookPreflightStatus,
    model: nativeRootBridgeWorkerThreadCleanupHookPreflightModel,
    executionScope:
      nativeRootBridgeWorkerThreadCleanupHookPreflightExecutionScope,
    sourceExecutablePreflightStatus:
      nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus,
    workerThreadId:
      nativeRootBridgeWorkerThreadTeardownExecutablePreflight.workerThreadId,
    workerEnvironmentId:
      nativeRootBridgeWorkerThreadTeardownExecutablePreflight
        .workerEnvironmentId,
    peerEnvironmentId:
      nativeRootBridgeWorkerThreadTeardownExecutablePreflight.peerEnvironmentId,
    canonicalExecutableEvidenceRequired: true,
    canonicalExecutableEvidenceAccepted,
    cleanupHookRegistrationCount: nativeRootBridgeWorkerThreadCleanupHookCount,
    cleanupHookExecutionOrder: 'reverse-registration-order',
    acceptedCleanupEvidenceCount,
    rejectedCleanupEvidenceCount,
    staleOrForgedCleanupEvidenceRejectionCount,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    cleanupHookPreflightRowFields:
      nativeRootBridgeWorkerThreadCleanupHookPreflightRowFields,
    rows: frozenRows,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  };

  Object.defineProperty(preflight, 'validateCleanupHookEvidenceRows', {
    value: validateNativeRootBridgeWorkerThreadCleanupHookPreflightRows,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return Object.freeze(preflight);
}

function createNativeRootBridgeWorkerThreadCleanupHookPreflight(rows) {
  const validatedRows =
    enforceNativeRootBridgeWorkerThreadCleanupHookCanonicalEvidenceSet(
      Array.from(
        rows,
        validateNativeRootBridgeWorkerThreadCleanupHookEvidenceForPreflight
      )
    );

  return freezeNativeRootBridgeWorkerThreadCleanupHookPreflight(validatedRows);
}

function enforceNativeRootBridgeWorkerThreadCleanupHookCanonicalEvidenceSet(
  rows
) {
  if (
    hasExactNativeRootBridgeWorkerThreadCleanupHookCanonicalEvidenceSet(rows)
  ) {
    return rows;
  }

  return rows.map((row) => {
    if (row.status === 'accepted' && row.canonicalExecutableEvidence) {
      return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
        row,
        nativeRootBridgeWorkerThreadCleanupHookCanonicalSetMismatchCode
      );
    }

    return row;
  });
}

function hasExactNativeRootBridgeWorkerThreadCleanupHookCanonicalEvidenceSet(
  rows
) {
  let rootCount = 0;
  let valueCount = 0;

  for (const row of rows) {
    const role =
      getNativeRootBridgeWorkerThreadCleanupHookAcceptedCanonicalRole(row);
    if (role === nativeRootBridgeHandleKindRoot) {
      rootCount += 1;
    } else if (role === nativeRootBridgeHandleKindValue) {
      valueCount += 1;
    }
  }

  return rootCount === 1 && valueCount === 1;
}

function getNativeRootBridgeWorkerThreadCleanupHookAcceptedCanonicalRole(row) {
  if (row.status !== 'accepted' || row.canonicalExecutableEvidence !== true) {
    return null;
  }

  return getNativeRootBridgeWorkerThreadCleanupHookCanonicalRole(
    row.sourceRowId,
    row.sourceHandleKind
  );
}

function validateNativeRootBridgeWorkerThreadCleanupHookPreflightRows(rows) {
  return createNativeRootBridgeWorkerThreadCleanupHookPreflight(rows);
}

function validateNativeRootBridgeWorkerThreadCleanupHookEvidenceForPreflight(
  evidence
) {
  if (evidence.status === 'rejected') {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      evidence.code ?? nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode
    );
  }

  if (evidence.code !== undefined && evidence.code !== null) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode
    );
  }

  if (hasNativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaim(evidence)) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaimCode
    );
  }

  if (
    evidence.sourcePreflightStatus !==
      nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus ||
    evidence.sourceWorkerThreadId !==
      nativeRootBridgeWorkerThreadTeardownExecutablePreflight.workerThreadId ||
    evidence.sourceEnvironmentId !==
      nativeRootBridgeWorkerThreadTeardownExecutablePreflight.workerEnvironmentId
  ) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode
    );
  }

  const sourceRow =
    nativeRootBridgeWorkerThreadTeardownExecutablePreflight.rows.find(
      (row) => row.id === evidence.sourceRowId
    );

  if (sourceRow === undefined) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode
    );
  }

  if (
    sourceRow.preflightPassed !== true ||
    sourceRow.rejectedByBoundary !== true ||
    sourceRow.workerThreadId !== evidence.sourceWorkerThreadId ||
    sourceRow.tableEnvironmentId !== evidence.sourceEnvironmentId ||
    sourceRow.handleKind !== evidence.sourceHandleKind ||
    sourceRow.sourceErrorCode !== evidence.sourceErrorCode ||
    sourceRow.boundaryErrorCode !== evidence.sourceBoundaryErrorCode ||
    sourceRow.sourceErrorCode !== nativeRootBridgeValidationErrorCodes.staleHandle ||
    sourceRow.boundaryErrorCode !== nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
  ) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode
    );
  }

  if (
    !Number.isSafeInteger(evidence.registrationOrder) ||
    evidence.registrationOrder < 1 ||
    evidence.registrationOrder > nativeRootBridgeWorkerThreadCleanupHookCount ||
    evidence.expectedExecutionOrder !==
      nativeRootBridgeWorkerThreadCleanupHookCount +
        1 -
        evidence.registrationOrder
  ) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookOrderMismatchCode
    );
  }

  const expectedIdentity =
    getNativeRootBridgeWorkerThreadCleanupHookExpectedIdentity(sourceRow);
  if (
    expectedIdentity === null ||
    evidence.cleanupHookId !== expectedIdentity.cleanupHookId ||
    evidence.cleanupHookFunctionIdentityToken !==
      expectedIdentity.cleanupHookFunctionIdentityToken ||
    evidence.cleanupHookArgumentIdentityToken !==
      expectedIdentity.cleanupHookArgumentIdentityToken
  ) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookIdentityMismatchCode
    );
  }

  if (
    evidence.registrationOrder !== expectedIdentity.registrationOrder ||
    evidence.expectedExecutionOrder !== expectedIdentity.expectedExecutionOrder
  ) {
    return freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
      evidence,
      nativeRootBridgeWorkerThreadCleanupHookOrderMismatchCode
    );
  }

  return freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
    id: evidence.id,
    operation: evidence.operation,
    cleanupHookId: evidence.cleanupHookId,
    cleanupHookFunctionIdentityToken:
      evidence.cleanupHookFunctionIdentityToken,
    cleanupHookArgumentIdentityToken:
      evidence.cleanupHookArgumentIdentityToken,
    registrationOrder: evidence.registrationOrder,
    expectedExecutionOrder: evidence.expectedExecutionOrder,
    observedExecutionOrder: evidence.expectedExecutionOrder,
    status: 'accepted',
    code: null,
    sourcePreflightStatus: evidence.sourcePreflightStatus,
    sourceWorkerThreadId: evidence.sourceWorkerThreadId,
    sourceEnvironmentId: evidence.sourceEnvironmentId,
    sourceRowId: evidence.sourceRowId,
    sourceHandleKind: evidence.sourceHandleKind,
    sourceErrorCode: evidence.sourceErrorCode,
    sourceBoundaryErrorCode: evidence.sourceBoundaryErrorCode,
    canonicalExecutableEvidence: true,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected: false
  });
}

function freezeNativeRootBridgeWorkerThreadCleanupHookRejectedRow(
  evidence,
  code
) {
  return freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
    id: evidence.id,
    operation: evidence.operation,
    cleanupHookId: evidence.cleanupHookId,
    cleanupHookFunctionIdentityToken:
      evidence.cleanupHookFunctionIdentityToken,
    cleanupHookArgumentIdentityToken:
      evidence.cleanupHookArgumentIdentityToken,
    registrationOrder: evidence.registrationOrder,
    expectedExecutionOrder: evidence.expectedExecutionOrder,
    observedExecutionOrder: null,
    status: 'rejected',
    code,
    sourcePreflightStatus: evidence.sourcePreflightStatus,
    sourceWorkerThreadId: evidence.sourceWorkerThreadId,
    sourceEnvironmentId: evidence.sourceEnvironmentId,
    sourceRowId: evidence.sourceRowId,
    sourceHandleKind: evidence.sourceHandleKind,
    sourceErrorCode: evidence.sourceErrorCode,
    sourceBoundaryErrorCode: evidence.sourceBoundaryErrorCode,
    canonicalExecutableEvidence: false,
    cleanupHookOrderPrivate: true,
    cleanupHookIdentityPrivate: true,
    staleOrForgedCleanupEvidenceRejected:
      code === nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode ||
      code === nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode
  });
}

function getNativeRootBridgeWorkerThreadCleanupHookExpectedIdentity(sourceRow) {
  const role = getNativeRootBridgeWorkerThreadCleanupHookCanonicalRole(
    sourceRow.id,
    sourceRow.handleKind
  );

  if (role === nativeRootBridgeHandleKindRoot) {
    return {
      cleanupHookId: nativeRootBridgeWorkerThreadCleanupHookRootId,
      cleanupHookFunctionIdentityToken:
        nativeRootBridgeWorkerThreadCleanupHookRootFunctionIdentityToken,
      cleanupHookArgumentIdentityToken:
        nativeRootBridgeWorkerThreadCleanupHookRootArgumentIdentityToken,
      registrationOrder: 2,
      expectedExecutionOrder: 1
    };
  }

  if (role === nativeRootBridgeHandleKindValue) {
    return {
      cleanupHookId: nativeRootBridgeWorkerThreadCleanupHookValueId,
      cleanupHookFunctionIdentityToken:
        nativeRootBridgeWorkerThreadCleanupHookValueFunctionIdentityToken,
      cleanupHookArgumentIdentityToken:
        nativeRootBridgeWorkerThreadCleanupHookValueArgumentIdentityToken,
      registrationOrder: 1,
      expectedExecutionOrder: 2
    };
  }

  return null;
}

function getNativeRootBridgeWorkerThreadCleanupHookCanonicalRole(
  sourceRowId,
  sourceHandleKind
) {
  if (
    sourceRowId === nativeRootBridgeWorkerThreadCleanupHookRootSourceRowId &&
    sourceHandleKind === nativeRootBridgeHandleKindRoot
  ) {
    return nativeRootBridgeHandleKindRoot;
  }

  if (
    sourceRowId === nativeRootBridgeWorkerThreadCleanupHookValueSourceRowId &&
    sourceHandleKind === nativeRootBridgeHandleKindValue
  ) {
    return nativeRootBridgeHandleKindValue;
  }

  return null;
}

function hasNativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaim(
  evidence
) {
  return nativeRootBridgeWorkerThreadCleanupHookPublicNativePackageClaimFields.some(
    (field) => evidence[field] === true
  );
}

function freezeNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink(
  link
) {
  Object.defineProperty(link, 'validateJsonBatchRoundtripLinkRows', {
    value:
      validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return Object.freeze(link);
}

function validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows(
  evidence
) {
  const linkEvidence = evidence ?? {};
  return createNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink({
    consumerRows: linkEvidence.consumerRows,
    lifecycleRows: linkEvidence.lifecycleRows,
    responseRows: linkEvidence.responseRows,
    streamRows: linkEvidence.streamRows,
    smokeRecords: linkEvidence.smokeRecords
  });
}

function createNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink({
  consumerRows,
  lifecycleRows,
  responseSequenceGate,
  rustHandleTableAdmissionSmoke,
  responseRows,
  streamRows,
  smokeRecords
}) {
  const normalizedConsumerRows = Array.from(consumerRows ?? []);
  const normalizedLifecycleRows = Array.from(lifecycleRows ?? []);
  const normalizedResponseRows = Array.from(
    responseRows ?? responseSequenceGate?.rows ?? []
  );
  const normalizedStreamRows = Array.from(
    streamRows ?? responseSequenceGate?.streamRoundtripGate?.rows ?? []
  );
  const normalizedSmokeRecords = Array.from(
    smokeRecords ?? rustHandleTableAdmissionSmoke?.smokeRecords ?? []
  );
  const batchId = nativeRootBridgeJsonTransportBatchResponseSequenceBatchId;
  const streamId =
    nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId;
  const rowCount = Math.max(
    normalizedConsumerRows.length,
    normalizedLifecycleRows.length,
    normalizedResponseRows.length,
    Math.ceil(normalizedStreamRows.length / 2),
    normalizedSmokeRecords.length
  );
  const rows = Object.freeze(
    Array.from({ length: rowCount }, (_, index) =>
      freezeNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow({
        index,
        batchId,
        streamId,
        consumerRow: normalizedConsumerRows[index],
        lifecycleRow: normalizedLifecycleRows[index],
        responseRow: normalizedResponseRows[index],
        streamMetadataRow: normalizedStreamRows[index * 2],
        streamPayloadRow: normalizedStreamRows[index * 2 + 1],
        smokeRecord: normalizedSmokeRecords[index]
      })
    )
  );
  const rejectedRows = Object.freeze(
    rows.filter(
      (row) =>
        row.status ===
        nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectedStatus
    )
  );

  return freezeNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink({
    linkStatus:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatus,
    model: nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    consumerStatus: nativeRootBridgeBatchLifecycleConsumerStatus,
    batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
    responseSequenceGateStatus:
      nativeRootBridgeJsonTransportBatchResponseSequenceGateStatus,
    streamRoundtripGateStatus:
      nativeRootBridgeJsonTransportStreamBatchRoundtripGateStatus,
    batchId,
    streamId,
    validateJsonBatchRoundtripLinkRowsName:
      'validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows',
    rowStatuses:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatuses,
    rejectionCaseIds:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCaseIds,
    rejectionCodes:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes,
    jsonBatchRoundtripLinkRowFields:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields,
    requestCount: normalizedConsumerRows.length,
    linkedRowCount: rows.length - rejectedRows.length,
    rejectedRowCount: rejectedRows.length,
    rows,
    rejectedRows,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRow({
  index,
  batchId,
  streamId,
  consumerRow,
  lifecycleRow,
  responseRow,
  streamMetadataRow,
  streamPayloadRow,
  smokeRecord
}) {
  const code =
    getNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCode({
      index,
      batchId,
      streamId,
      consumerRow,
      lifecycleRow,
      responseRow,
      streamMetadataRow,
      streamPayloadRow,
      smokeRecord
    });
  const kind =
    consumerRow?.kind ??
    lifecycleRow?.kind ??
    responseRow?.kind ??
    smokeRecord?.kind ??
    'missing';
  const status =
    code === null
      ? nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkLinkedStatus
      : nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectedStatus;

  return Object.freeze({
    id: `batch-lifecycle-consumer-json-roundtrip-link-${index}-${kind}`,
    consumerRowId: consumerRow?.id ?? null,
    lifecycleRowId: lifecycleRow?.id ?? null,
    responseRowId: responseRow?.id ?? null,
    streamMetadataRowId: streamMetadataRow?.id ?? null,
    streamPayloadRowId: streamPayloadRow?.id ?? null,
    batchId: responseRow?.batchId ?? streamMetadataRow?.batchId ?? batchId,
    streamId: streamMetadataRow?.streamId ?? streamPayloadRow?.streamId ?? streamId,
    batchIndex: consumerRow?.batchIndex ?? lifecycleRow?.batchIndex ?? null,
    requestId:
      consumerRow?.requestId ??
      lifecycleRow?.requestId ??
      responseRow?.requestId ??
      null,
    kind,
    lifecycleTransition:
      consumerRow?.lifecycleTransition ?? lifecycleRow?.lifecycleTransition ?? null,
    rootHandleAction: consumerRow?.rootHandleAction ?? smokeRecord?.rootHandleAction ?? null,
    cleanupHookEvidenceStatus: consumerRow?.cleanupHookEvidenceStatus ?? null,
    requestOrder: responseRow?.requestOrder ?? null,
    responseOrder: responseRow?.responseOrder ?? null,
    metadataBatchSequence: streamMetadataRow?.batchSequence ?? null,
    payloadBatchSequence: streamPayloadRow?.batchSequence ?? null,
    metadataChunkKind: streamMetadataRow?.chunkKind ?? null,
    payloadChunkKind: streamPayloadRow?.chunkKind ?? null,
    responseStatus: responseRow?.responseStatus ?? null,
    payloadAssemblyState: streamPayloadRow?.assemblyState ?? null,
    teardownState: responseRow?.teardownState ?? streamPayloadRow?.teardownState ?? null,
    status,
    code,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function getNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCode({
  index,
  batchId,
  streamId,
  consumerRow,
  lifecycleRow,
  responseRow,
  streamMetadataRow,
  streamPayloadRow,
  smokeRecord
}) {
  const rows = [
    consumerRow,
    lifecycleRow,
    responseRow,
    streamMetadataRow,
    streamPayloadRow,
    smokeRecord
  ];

  if (
    rows.some((row) =>
      hasNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripPublicOrNativeClaim(
        row
      )
    )
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .publicNativeExecutionClaim;
  }

  if (
    consumerRow === undefined ||
    lifecycleRow === undefined ||
    responseRow === undefined ||
    streamMetadataRow === undefined ||
    streamPayloadRow === undefined ||
    smokeRecord === undefined
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow;
  }

  if (
    consumerRow.batchIndex !== index ||
    lifecycleRow.batchIndex !== index ||
    responseRow.requestOrder !== index ||
    responseRow.responseOrder !== index ||
    streamMetadataRow.requestOrder !== index ||
    streamMetadataRow.responseOrder !== index ||
    streamMetadataRow.chunkOrder !== 0 ||
    streamMetadataRow.batchSequence !== index * 2 ||
    streamPayloadRow.requestOrder !== index ||
    streamPayloadRow.responseOrder !== index ||
    streamPayloadRow.chunkOrder !== 1 ||
    streamPayloadRow.batchSequence !== index * 2 + 1 ||
    smokeRecord.requestId !== consumerRow.requestId
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .rowOrderMismatch;
  }

  const expectedKind = consumerRow.kind;
  const expectedConsumerRowId = `batch-lifecycle-consumer-${index}-${expectedKind}`;
  const expectedLifecycleRowId = `batch-record-${index}-${expectedKind}`;
  const expectedResponseRowId = `batch-response-${index}-${expectedKind}`;
  const expectedMetadataRowId = `stream-batch-chunk-${index * 2}-request-${consumerRow.requestId}-metadata`;
  const expectedPayloadRowId = `stream-batch-chunk-${index * 2 + 1}-request-${consumerRow.requestId}-payload`;

  if (
    consumerRow.id !== expectedConsumerRowId ||
    lifecycleRow.id !== expectedLifecycleRowId ||
    responseRow.id !== expectedResponseRowId ||
    streamMetadataRow.id !== expectedMetadataRowId ||
    streamPayloadRow.id !== expectedPayloadRowId
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .consumerRowIdMismatch;
  }

  if (
    responseRow.batchId !== batchId ||
    streamMetadataRow.batchId !== batchId ||
    streamPayloadRow.batchId !== batchId ||
    streamMetadataRow.streamId !== streamId ||
    streamPayloadRow.streamId !== streamId ||
    responseRow.errorRowStatus !==
      nativeRootBridgeJsonTransportBatchResponseErrorRowStatusNotError ||
    responseRow.responseStatus !==
      nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted ||
    streamMetadataRow.chunkKind !== 'metadata' ||
    streamPayloadRow.chunkKind !== 'payload' ||
    streamMetadataRow.chunkStatus !== 'accepted' ||
    streamPayloadRow.chunkStatus !== 'accepted' ||
    streamPayloadRow.assembledResponse !== true ||
    streamPayloadRow.assemblyState !== 'assembled'
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .staleOrForeignJsonBatchRow;
  }

  const expectedLifecycleTransition =
    getNativeRootBridgeLifecycleTransition(expectedKind);
  const expectedRootHandleAction =
    getNativeRootBridgeBatchLifecycleConsumerExpectedRootHandleAction(
      expectedKind
    );
  const expectedHandleAdmissionEvidence =
    getNativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmissionEvidence(
      expectedKind
    );

  if (
    !nativeRootBridgeRequestKinds.includes(expectedKind) ||
    expectedHandleAdmissionEvidence === null ||
    lifecycleRow.kind !== expectedKind ||
    responseRow.kind !== expectedKind ||
    smokeRecord.kind !== expectedKind ||
    lifecycleRow.requestId !== consumerRow.requestId ||
    responseRow.requestId !== consumerRow.requestId ||
    streamMetadataRow.requestId !== consumerRow.requestId ||
    streamPayloadRow.requestId !== consumerRow.requestId ||
    lifecycleRow.status !== consumerRow.status ||
    responseRow.responseStatus !== consumerRow.status ||
    streamMetadataRow.responseStatus !== consumerRow.status ||
    streamPayloadRow.responseStatus !== consumerRow.status ||
    lifecycleRow.lifecycleTransition !== consumerRow.lifecycleTransition ||
    consumerRow.lifecycleTransition !== expectedLifecycleTransition ||
    smokeRecord.lifecycleTransition !== expectedLifecycleTransition ||
    consumerRow.rootHandleAction !== smokeRecord.rootHandleAction ||
    consumerRow.rootHandleAction !== expectedRootHandleAction ||
    smokeRecord.rootHandleAction !== expectedRootHandleAction ||
    consumerRow.rootHandleStateBefore !==
      expectedHandleAdmissionEvidence.rootHandleStateBefore ||
    smokeRecord.rootHandleStateBefore !==
      expectedHandleAdmissionEvidence.rootHandleStateBefore ||
    consumerRow.rootHandleStateAfter !==
      expectedHandleAdmissionEvidence.rootHandleStateAfter ||
    smokeRecord.rootHandleStateAfter !==
      expectedHandleAdmissionEvidence.rootHandleStateAfter ||
    consumerRow.rootHandleCurrentGeneration !==
      expectedHandleAdmissionEvidence.rootHandleCurrentGeneration ||
    smokeRecord.rootHandleCurrentGeneration !==
      expectedHandleAdmissionEvidence.rootHandleCurrentGeneration ||
    consumerRow.valueHandleAction !==
      expectedHandleAdmissionEvidence.valueHandleAction ||
    smokeRecord.valueHandleAction !==
      expectedHandleAdmissionEvidence.valueHandleAction ||
    consumerRow.valueHandleCurrentGeneration !==
      expectedHandleAdmissionEvidence.valueHandleCurrentGeneration ||
    smokeRecord.valueHandleCurrentGeneration !==
      expectedHandleAdmissionEvidence.valueHandleCurrentGeneration ||
    consumerRow.retiredRootSourceErrorCode !==
      expectedHandleAdmissionEvidence.retiredRootSourceErrorCode ||
    smokeRecord.retiredRootSourceErrorCode !==
      expectedHandleAdmissionEvidence.retiredRootSourceErrorCode
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .kindTransitionMismatch;
  }

  const expectedCleanupEvidence =
    getNativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence(
      expectedKind
    );
  if (
    expectedCleanupEvidence === null ||
    consumerRow.cleanupHookEvidenceStatus !==
      expectedCleanupEvidence.cleanupHookEvidenceStatus ||
    consumerRow.cleanupHookEvidenceRequired !==
      expectedCleanupEvidence.cleanupHookEvidenceRequired ||
    consumerRow.cleanupHookEvidenceRowId !==
      expectedCleanupEvidence.cleanupHookEvidenceRowId ||
    consumerRow.cleanupHookSourceRowId !==
      expectedCleanupEvidence.cleanupHookSourceRowId ||
    consumerRow.cleanupHookSourceHandleKind !==
      expectedCleanupEvidence.cleanupHookSourceHandleKind ||
    consumerRow.cleanupHookCanonicalExecutableEvidence !==
      expectedCleanupEvidence.cleanupHookCanonicalExecutableEvidence
  ) {
    return nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes
      .cleanupHookStatusMismatch;
  }

  return null;
}

function hasNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripPublicOrNativeClaim(
  row
) {
  if (row === undefined || row === null) {
    return false;
  }

  return (
    row.nativeAddonLoaded === true ||
    row.nativeExecution === true ||
    row.rendererExecution === true ||
    row.reconcilerExecution === true ||
    row.nodeWorkerThreadsExecution === true ||
    row.napiCleanupHookExecution === true ||
    row.publicNativeCompatibility === true ||
    row.reactBehaviorError === true
  );
}

function getNativeRootBridgeBatchLifecycleConsumerExpectedRootHandleAction(
  kind
) {
  if (kind === nativeRootBridgeRequestKindCreate) {
    return 'admit-root-handle';
  }
  if (kind === nativeRootBridgeRequestKindRender) {
    return 'validate-active-root-handle';
  }
  return 'retire-root-handle';
}

function getNativeRootBridgeBatchLifecycleConsumerExpectedHandleAdmissionEvidence(
  kind
) {
  if (kind === nativeRootBridgeRequestKindCreate) {
    return {
      rootHandleAction: 'admit-root-handle',
      rootHandleStateBefore: null,
      rootHandleStateAfter: nativeRootBridgeRootHandleStateActive,
      rootHandleCurrentGeneration: 1,
      valueHandleAction: 'admit-value-handle',
      valueHandleCurrentGeneration: 1,
      retiredRootSourceErrorCode: null
    };
  }

  if (kind === nativeRootBridgeRequestKindRender) {
    return {
      rootHandleAction: 'validate-active-root-handle',
      rootHandleStateBefore: nativeRootBridgeRootHandleStateActive,
      rootHandleStateAfter: nativeRootBridgeRootHandleStateActive,
      rootHandleCurrentGeneration: 1,
      valueHandleAction: 'admit-value-handle',
      valueHandleCurrentGeneration: 1,
      retiredRootSourceErrorCode: null
    };
  }

  if (kind === nativeRootBridgeRequestKindUnmount) {
    return {
      rootHandleAction: 'retire-root-handle',
      rootHandleStateBefore: nativeRootBridgeRootHandleStateActive,
      rootHandleStateAfter: nativeRootBridgeRootHandleStateRetired,
      rootHandleCurrentGeneration: 2,
      valueHandleAction: null,
      valueHandleCurrentGeneration: null,
      retiredRootSourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle
    };
  }

  return null;
}

function getNativeRootBridgeBatchLifecycleConsumerExpectedCleanupHookEvidence(
  kind
) {
  if (kind === nativeRootBridgeRequestKindCreate) {
    return {
      cleanupHookEvidenceRequired: false,
      cleanupHookEvidenceStatus:
        nativeRootBridgeBatchLifecycleConsumerCleanupHookNotRequiredStatus,
      cleanupHookEvidenceRowId: null,
      cleanupHookSourceRowId: null,
      cleanupHookSourceHandleKind: null,
      cleanupHookCanonicalExecutableEvidence: null
    };
  }

  if (kind === nativeRootBridgeRequestKindRender) {
    return {
      cleanupHookEvidenceRequired: true,
      cleanupHookEvidenceStatus:
        nativeRootBridgeBatchLifecycleConsumerCleanupHookAcceptedStatus,
      cleanupHookEvidenceRowId:
        'cleanup-hook-worker-value-after-root-release',
      cleanupHookSourceRowId:
        nativeRootBridgeWorkerThreadCleanupHookValueSourceRowId,
      cleanupHookSourceHandleKind: nativeRootBridgeHandleKindValue,
      cleanupHookCanonicalExecutableEvidence: true
    };
  }

  if (kind === nativeRootBridgeRequestKindUnmount) {
    return {
      cleanupHookEvidenceRequired: true,
      cleanupHookEvidenceStatus:
        nativeRootBridgeBatchLifecycleConsumerCleanupHookAcceptedStatus,
      cleanupHookEvidenceRowId:
        'cleanup-hook-worker-root-before-value-release',
      cleanupHookSourceRowId:
        nativeRootBridgeWorkerThreadCleanupHookRootSourceRowId,
      cleanupHookSourceHandleKind: nativeRootBridgeHandleKindRoot,
      cleanupHookCanonicalExecutableEvidence: true
    };
  }

  return null;
}

function createNativeRootBridgeBatchLifecycleConsumer({
  handleAdmissionPreflight,
  jsonTransportSmoke,
  rustHandleTableAdmissionSmoke
}) {
  const batchGate = jsonTransportSmoke.parserGate.batchedRecordGate;
  const cleanupHookCallable =
    nativeRootBridgeWorkerThreadCleanupHookPreflight
      .validateCleanupHookEvidenceRows;
  const cleanupHookPreflight = cleanupHookCallable(
    nativeRootBridgeWorkerThreadCleanupHookPreflight.rows
  );
  const rows = Object.freeze(
    batchGate.lifecycleRows.map((lifecycleRow, index) =>
      freezeNativeRootBridgeBatchLifecycleConsumerRow({
        lifecycleRow,
        smokeRecord: rustHandleTableAdmissionSmoke.smokeRecords[index],
        cleanupHookPreflight
      })
    )
  );
  const jsonBatchRoundtripLink =
    createNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink({
      consumerRows: rows,
      lifecycleRows: batchGate.lifecycleRows,
      responseSequenceGate: batchGate.responseSequenceGate,
      rustHandleTableAdmissionSmoke
    });

  return Object.freeze({
    consumerStatus: nativeRootBridgeBatchLifecycleConsumerStatus,
    model: nativeRootBridgeBatchLifecycleConsumerModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    batchGateStatus: batchGate.batchGateStatus,
    cleanupHookPreflightStatus: cleanupHookPreflight.preflightStatus,
    cleanupHookCallableName: 'validateCleanupHookEvidenceRows',
    requestCount: handleAdmissionPreflight.requestCount,
    consumedBatchRecordCount: rows.length,
    acceptedBatchRecordCount: rows.filter(
      (row) =>
        row.status === nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted
    ).length,
    cleanupHookCallablePreflightAccepted:
      cleanupHookPreflight.canonicalExecutableEvidenceAccepted,
    acceptedCleanupEvidenceCount:
      cleanupHookPreflight.acceptedCleanupEvidenceCount,
    rejectedCleanupEvidenceCount:
      cleanupHookPreflight.rejectedCleanupEvidenceCount,
    cleanupHookEvidenceStatuses:
      nativeRootBridgeBatchLifecycleConsumerCleanupHookStatuses,
    batchLifecycleConsumerRowFields:
      nativeRootBridgeBatchLifecycleConsumerRowFields,
    jsonBatchRoundtripLink,
    rows,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeBatchLifecycleConsumerRow({
  lifecycleRow,
  smokeRecord,
  cleanupHookPreflight
}) {
  const cleanupHookRow =
    getNativeRootBridgeBatchLifecycleConsumerCleanupHookRow(
      lifecycleRow.kind,
      cleanupHookPreflight
    );
  const cleanupHookEvidenceStatus =
    cleanupHookRow === null
      ? nativeRootBridgeBatchLifecycleConsumerCleanupHookNotRequiredStatus
      : cleanupHookRow.status;

  return Object.freeze({
    id: `batch-lifecycle-consumer-${lifecycleRow.batchIndex}-${lifecycleRow.kind}`,
    batchIndex: lifecycleRow.batchIndex,
    requestId: lifecycleRow.requestId,
    kind: lifecycleRow.kind,
    lifecycleTransition: lifecycleRow.lifecycleTransition,
    rootHandleAction: smokeRecord.rootHandleAction,
    rootHandleStateBefore: smokeRecord.rootHandleStateBefore,
    rootHandleStateAfter: smokeRecord.rootHandleStateAfter,
    rootHandleCurrentGeneration: smokeRecord.rootHandleCurrentGeneration,
    valueHandleAction: smokeRecord.valueHandleAction,
    valueHandleCurrentGeneration: smokeRecord.valueHandleCurrentGeneration,
    retiredRootSourceErrorCode: smokeRecord.retiredRootSourceErrorCode,
    cleanupHookEvidenceRequired: cleanupHookRow !== null,
    cleanupHookEvidenceStatus,
    cleanupHookEvidenceRowId: cleanupHookRow?.id ?? null,
    cleanupHookSourceRowId: cleanupHookRow?.sourceRowId ?? null,
    cleanupHookSourceHandleKind: cleanupHookRow?.sourceHandleKind ?? null,
    cleanupHookCanonicalExecutableEvidence:
      cleanupHookRow?.canonicalExecutableEvidence ?? null,
    status: lifecycleRow.status,
    code: lifecycleRow.code,
    sourceErrorCode: lifecycleRow.sourceErrorCode,
    boundaryErrorCode: lifecycleRow.boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function getNativeRootBridgeBatchLifecycleConsumerCleanupHookRow(
  kind,
  cleanupHookPreflight
) {
  const expectedHandleKind =
    kind === nativeRootBridgeRequestKindRender
      ? nativeRootBridgeHandleKindValue
      : kind === nativeRootBridgeRequestKindUnmount
        ? nativeRootBridgeHandleKindRoot
        : null;

  if (expectedHandleKind === null) {
    return null;
  }

  return (
    cleanupHookPreflight.rows.find(
      (row) =>
        row.status ===
          nativeRootBridgeBatchLifecycleConsumerCleanupHookAcceptedStatus &&
        row.canonicalExecutableEvidence === true &&
        row.sourceHandleKind === expectedHandleKind
    ) ?? null
  );
}

const nativeBoundaryErrorCodeMap = Object.freeze({
  unsupportedNativeExecution: unavailableErrorCode,
  rustNativeExportsNotBuilt: rustNativeExportsNotBuiltErrorCode,
  rootBridgeWrongEnvironment:
    'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
  rootBridgeStaleHandle: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
  rootBridgeWrongLifecycleOrder:
    'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
});

function freezeNativeRootBridgeValidationEvidence({
  scenario,
  sourceErrorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    scenario,
    sourceErrorCode,
    boundaryErrorCode,
    nativeExecution: false,
    reactBehaviorError: false
  });
}

const nativeRootBridgeValidationEvidence = Object.freeze([
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'wrong-environment-root-handle',
    sourceErrorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment
  }),
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'stale-root-or-value-handle',
    sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
  }),
  freezeNativeRootBridgeValidationEvidence({
    scenario: 'wrong-root-lifecycle-order',
    sourceErrorCode:
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder
  })
]);

const nativeRootBridgeTransportWorkerThreadTeardownGate = Object.freeze({
  workerThreadTeardownGateStatus:
    nativeRootBridgeTransportWorkerThreadTeardownGateStatus,
  transport: nativeRootBridgeJsonTransportFormat,
  workerThreadId: 524,
  workerEnvironmentId: 524,
  peerEnvironmentId: 1524,
  validationModel: nativeRootBridgeRequestValidationModel,
  handleTableModel: nativeRootBridgeHandleTableModel,
  batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
  crossEnvironmentTeardownGateStatus:
    nativeRootBridgeCrossEnvironmentTeardownGateStatus,
  environmentTeardownFields: nativeRootBridgeEnvironmentTeardownFields,
  workerThreadTeardownDiagnosticRowFields:
    nativeRootBridgeTransportWorkerThreadTeardownRowFields,
  mismatchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 524,
    tableEnvironmentId: 1524,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0
  }),
  matchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 524,
    tableEnvironmentId: 524,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2
  }),
  rows: Object.freeze([
    freezeNativeRootBridgeTransportWorkerThreadTeardownRow({
      id: 'worker-root-stale-after-thread-teardown',
      operation: 'worker-thread-teardown',
      workerThreadId: 524,
      sourceBatchIndex: 0,
      requestId: 1,
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 524,
      handleEnvironmentId: 524,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
    }),
    freezeNativeRootBridgeTransportWorkerThreadTeardownRow({
      id: 'worker-create-value-stale-after-thread-teardown',
      operation: 'worker-thread-teardown',
      workerThreadId: 524,
      sourceBatchIndex: 0,
      requestId: 1,
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 524,
      handleEnvironmentId: 524,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
    }),
    freezeNativeRootBridgeTransportWorkerThreadTeardownRow({
      id: 'worker-render-value-stale-after-thread-teardown',
      operation: 'worker-thread-teardown',
      workerThreadId: 524,
      sourceBatchIndex: 1,
      requestId: 2,
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 524,
      handleEnvironmentId: 524,
      slot: 3,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      errorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle
    }),
    freezeNativeRootBridgeTransportWorkerThreadTeardownRow({
      id: 'peer-root-active-after-worker-thread-teardown',
      operation: 'peer-environment-isolation',
      workerThreadId: 524,
      sourceBatchIndex: null,
      requestId: null,
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1524,
      handleEnvironmentId: 1524,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 152401,
      errorCode: null,
      boundaryErrorCode: null
    })
  ]),
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
});

const nativeRootBridgeWorkerThreadTeardownExecutablePreflight = Object.freeze({
  preflightStatus: nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus,
  model: nativeRootBridgeWorkerThreadTeardownExecutablePreflightModel,
  executionScope:
    nativeRootBridgeWorkerThreadTeardownExecutablePreflightExecutionScope,
  transport: nativeRootBridgeJsonTransportFormat,
  workerThreadId: 764,
  workerEnvironmentId: 764,
  peerEnvironmentId: 1764,
  validationModel: nativeRootBridgeRequestValidationModel,
  handleTableModel: nativeRootBridgeHandleTableModel,
  transportWorkerThreadTeardownGateStatus:
    nativeRootBridgeTransportWorkerThreadTeardownGateStatus,
  batchedRecordGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
  crossEnvironmentTeardownGateStatus:
    nativeRootBridgeCrossEnvironmentTeardownGateStatus,
  acceptedBatchRecordCount: 2,
  crossEnvironmentTeardownRowCount:
    nativeRootBridgeCrossEnvironmentTeardownGate.rows.length,
  environmentTeardownFields: nativeRootBridgeEnvironmentTeardownFields,
  executablePreflightRowFields:
    nativeRootBridgeWorkerThreadTeardownExecutablePreflightRowFields,
  mismatchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 764,
    tableEnvironmentId: 1764,
    rootHandlesInvalidated: 0,
    valueHandlesInvalidated: 0
  }),
  matchedTeardown: freezeNativeRootBridgeEnvironmentTeardown({
    requestedEnvironmentId: 764,
    tableEnvironmentId: 764,
    rootHandlesInvalidated: 1,
    valueHandlesInvalidated: 2
  }),
  staleWorkerHandleRejectionCount: 3,
  activePeerHandleCount: 2,
  rootValidatorStatePreserved: true,
  rows: Object.freeze([
    freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
      id: 'worker-render-root-stale-executable-preflight',
      operation: 'post-teardown-render-boundary-validation',
      assertion: 'stale-worker-root-rejected-without-mutating-validator',
      workerThreadId: 764,
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 764,
      handleEnvironmentId: 764,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      rejectedByBoundary: true,
      peerInvariantPreserved: false,
      preflightPassed: true
    }),
    freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
      id: 'worker-create-value-stale-executable-preflight',
      operation: 'post-teardown-value-boundary-validation',
      assertion: 'stale-worker-value-rejected-after-worker-teardown',
      workerThreadId: 764,
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 764,
      handleEnvironmentId: 764,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      rejectedByBoundary: true,
      peerInvariantPreserved: false,
      preflightPassed: true
    }),
    freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
      id: 'worker-render-value-stale-executable-preflight',
      operation: 'post-teardown-value-boundary-validation',
      assertion: 'stale-worker-value-rejected-after-worker-teardown',
      workerThreadId: 764,
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 764,
      handleEnvironmentId: 764,
      slot: 3,
      handleGeneration: 1,
      currentGeneration: 2,
      recordId: null,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      rejectedByBoundary: true,
      peerInvariantPreserved: false,
      preflightPassed: true
    }),
    freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
      id: 'peer-root-active-executable-preflight',
      operation: 'post-teardown-peer-root-validation',
      assertion: 'peer-handle-remains-active-after-worker-teardown',
      workerThreadId: 764,
      handleKind: nativeRootBridgeHandleKindRoot,
      tableEnvironmentId: 1764,
      handleEnvironmentId: 1764,
      slot: 1,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 176401,
      sourceErrorCode: null,
      boundaryErrorCode: null,
      rejectedByBoundary: false,
      peerInvariantPreserved: true,
      preflightPassed: true
    }),
    freezeNativeRootBridgeWorkerThreadTeardownExecutablePreflightRow({
      id: 'peer-value-active-executable-preflight',
      operation: 'post-teardown-peer-value-validation',
      assertion: 'peer-handle-remains-active-after-worker-teardown',
      workerThreadId: 764,
      handleKind: nativeRootBridgeHandleKindValue,
      tableEnvironmentId: 1764,
      handleEnvironmentId: 1764,
      slot: 2,
      handleGeneration: 1,
      currentGeneration: 1,
      recordId: 176402,
      sourceErrorCode: null,
      boundaryErrorCode: null,
      rejectedByBoundary: false,
      peerInvariantPreserved: true,
      preflightPassed: true
    })
  ]),
  preflightEvaluated: true,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
});

const nativeRootBridgeWorkerThreadCleanupHookPreflight =
  createNativeRootBridgeWorkerThreadCleanupHookPreflight([
    freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
      id: 'cleanup-hook-worker-root-before-value-release',
      operation: 'cleanup-hook-order-preflight',
      cleanupHookId: 'worker-root-handle-cleanup-hook',
      cleanupHookFunctionIdentityToken:
        'private-cleanup-hook-fn:worker-root-handle-teardown',
      cleanupHookArgumentIdentityToken:
        'private-cleanup-hook-arg:worker-764-root-slot-1',
      registrationOrder: 2,
      expectedExecutionOrder: 1,
      observedExecutionOrder: 1,
      status: 'accepted',
      code: null,
      sourcePreflightStatus:
        nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus,
      sourceWorkerThreadId: 764,
      sourceEnvironmentId: 764,
      sourceRowId: 'worker-render-root-stale-executable-preflight',
      sourceHandleKind: nativeRootBridgeHandleKindRoot,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      sourceBoundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      canonicalExecutableEvidence: true,
      cleanupHookOrderPrivate: true,
      cleanupHookIdentityPrivate: true,
      staleOrForgedCleanupEvidenceRejected: false
    }),
    freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
      id: 'cleanup-hook-worker-value-after-root-release',
      operation: 'cleanup-hook-order-preflight',
      cleanupHookId: 'worker-value-handle-cleanup-hook',
      cleanupHookFunctionIdentityToken:
        'private-cleanup-hook-fn:worker-value-handle-teardown',
      cleanupHookArgumentIdentityToken:
        'private-cleanup-hook-arg:worker-764-value-slot-3',
      registrationOrder: 1,
      expectedExecutionOrder: 2,
      observedExecutionOrder: 2,
      status: 'accepted',
      code: null,
      sourcePreflightStatus:
        nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus,
      sourceWorkerThreadId: 764,
      sourceEnvironmentId: 764,
      sourceRowId: 'worker-render-value-stale-executable-preflight',
      sourceHandleKind: nativeRootBridgeHandleKindValue,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      sourceBoundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      canonicalExecutableEvidence: true,
      cleanupHookOrderPrivate: true,
      cleanupHookIdentityPrivate: true,
      staleOrForgedCleanupEvidenceRejected: false
    }),
    freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
      id: 'cleanup-hook-stale-worker-transport-evidence-rejected',
      operation: 'cleanup-hook-evidence-preflight-rejection',
      cleanupHookId: 'stale-worker-transport-cleanup-hook',
      cleanupHookFunctionIdentityToken:
        'private-cleanup-hook-fn:stale-worker-teardown',
      cleanupHookArgumentIdentityToken:
        'private-cleanup-hook-arg:worker-524-root-slot-1',
      registrationOrder: 2,
      expectedExecutionOrder: 1,
      observedExecutionOrder: null,
      status: 'rejected',
      code: nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode,
      sourcePreflightStatus:
        nativeRootBridgeTransportWorkerThreadTeardownGateStatus,
      sourceWorkerThreadId: 524,
      sourceEnvironmentId: 524,
      sourceRowId: 'worker-root-stale-after-thread-teardown',
      sourceHandleKind: nativeRootBridgeHandleKindRoot,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      sourceBoundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      canonicalExecutableEvidence: false,
      cleanupHookOrderPrivate: true,
      cleanupHookIdentityPrivate: true,
      staleOrForgedCleanupEvidenceRejected: true
    }),
    freezeNativeRootBridgeWorkerThreadCleanupHookPreflightRow({
      id: 'cleanup-hook-forged-peer-active-evidence-rejected',
      operation: 'cleanup-hook-evidence-preflight-rejection',
      cleanupHookId: 'forged-peer-active-cleanup-hook',
      cleanupHookFunctionIdentityToken:
        'private-cleanup-hook-fn:forged-peer-active',
      cleanupHookArgumentIdentityToken:
        'private-cleanup-hook-arg:worker-1764-peer-root',
      registrationOrder: 1,
      expectedExecutionOrder: 2,
      observedExecutionOrder: null,
      status: 'rejected',
      code: nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode,
      sourcePreflightStatus:
        nativeRootBridgeWorkerThreadTeardownExecutablePreflightStatus,
      sourceWorkerThreadId: 764,
      sourceEnvironmentId: 764,
      sourceRowId: 'peer-root-active-executable-preflight',
      sourceHandleKind: nativeRootBridgeHandleKindRoot,
      sourceErrorCode: null,
      sourceBoundaryErrorCode: null,
      canonicalExecutableEvidence: false,
      cleanupHookOrderPrivate: true,
      cleanupHookIdentityPrivate: true,
      staleOrForgedCleanupEvidenceRejected: true
    })
  ]);

const nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink =
  freezeNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink({
    linkStatus:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatus,
    model: nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    consumerStatus: nativeRootBridgeBatchLifecycleConsumerStatus,
    batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
    responseSequenceGateStatus:
      nativeRootBridgeJsonTransportBatchResponseSequenceGateStatus,
    streamRoundtripGateStatus:
      nativeRootBridgeJsonTransportStreamBatchRoundtripGateStatus,
    batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
    streamId: nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId,
    validateJsonBatchRoundtripLinkRowsName:
      'validateNativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRows',
    rowStatuses:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkStatuses,
    rejectionCaseIds:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCaseIds,
    rejectionCodes:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRejectionCodes,
    jsonBatchRoundtripLinkRowFields:
      nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLinkRowFields,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });

const nativeRootBridgeBatchLifecycleConsumer = Object.freeze({
  consumerStatus: nativeRootBridgeBatchLifecycleConsumerStatus,
  model: nativeRootBridgeBatchLifecycleConsumerModel,
  validationModel: nativeRootBridgeRequestValidationModel,
  handleTableModel: nativeRootBridgeHandleTableModel,
  batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
  cleanupHookPreflightStatus:
    nativeRootBridgeWorkerThreadCleanupHookPreflightStatus,
  cleanupHookCallableName: 'validateCleanupHookEvidenceRows',
  cleanupHookEvidenceStatuses:
    nativeRootBridgeBatchLifecycleConsumerCleanupHookStatuses,
  batchLifecycleConsumerRowFields:
    nativeRootBridgeBatchLifecycleConsumerRowFields,
  jsonBatchRoundtripLink:
    nativeRootBridgeBatchLifecycleConsumerJsonBatchRoundtripLink,
  nativeAddonLoaded: false,
  nativeExecution: false,
  rendererExecution: false,
  reconcilerExecution: false,
  nodeWorkerThreadsExecution: false,
  napiCleanupHookExecution: false,
  publicNativeCompatibility: false,
  reactBehaviorError: false
});

const nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger =
  createNativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger(
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows
  );

const nativeRootBridgeRequestShape = freezeNativeRootBridgeRequestShape({
  gateStatus: nativeRootBridgeRequestShapeGateStatus,
  validationModel: nativeRootBridgeRequestValidationModel,
  handleTableModel: nativeRootBridgeHandleTableModel,
  jsRequestRecordFields: nativeRootBridgeJsRequestRecordFields,
  rustRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
  rustValidationRecordFields: nativeRootBridgeRustValidationRecordFields,
  jsHandleFields: nativeRootBridgeJsHandleFields,
  rustHandleFields: nativeRootBridgeRustHandleFields,
  requestKinds: nativeRootBridgeRequestKinds,
  handleKinds: nativeRootBridgeHandleKinds,
  rootHandleStates: nativeRootBridgeRootHandleStates,
  lifecycleTransitions: nativeRootBridgeLifecycleTransitions,
  handleAdmissionPreflight: nativeRootBridgeHandleAdmissionPreflight,
  rustHandleTableAdmissionSmoke:
    nativeRootBridgeRustHandleTableAdmissionSmoke,
  jsonTransportSmoke: nativeRootBridgeJsonTransportSmoke,
  crossEnvironmentTeardownGate: nativeRootBridgeCrossEnvironmentTeardownGate,
  transportWorkerThreadTeardownGate:
    nativeRootBridgeTransportWorkerThreadTeardownGate,
  workerThreadTeardownExecutablePreflight:
    nativeRootBridgeWorkerThreadTeardownExecutablePreflight,
  workerThreadCleanupHookPreflight:
    nativeRootBridgeWorkerThreadCleanupHookPreflight,
  batchLifecycleConsumer: nativeRootBridgeBatchLifecycleConsumer,
  validationErrorCodes: nativeRootBridgeValidationErrorCodes
});

const nativeBindingManifest = Object.freeze({
  status: bindingStatus,
  packageName,
  nativeAddonName,
  nodeApiVersionFloor,
  supportedNodeEngineRange,
  platformArtifactPolicy,
  optionalPackagePrefix,
  nativeTargetMatrix,
  nativeRootBridgeRequestShape,
  platformPackages,
  supportedNativeTargets,
  nativeBoundaryErrorCodeMap,
  nativeRootBridgeValidationEvidence
});

function freezeNativeRootBridgeRequestShape(shape) {
  Object.defineProperty(shape, 'jsonBatchLifecycleGenerationAdmissionLedger', {
    value: nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return Object.freeze(shape);
}

function freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow({
  id,
  role,
  sourceFile = nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceFile,
  sourceFiles = [sourceFile],
  sourceIdentifiers
}) {
  const normalizedSourceFiles =
    freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceFiles(
      sourceFile,
      sourceFiles
    );

  return Object.freeze({
    id,
    role,
    sourceFile: normalizedSourceFiles[0],
    sourceFiles: normalizedSourceFiles,
    evidenceKind:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionEvidenceKind,
    sourceIdentifiers: Object.freeze([...sourceIdentifiers]),
    sourceOwnedEvidence: true,
    blockedPrivateEvidence: true,
    publicAdmission: false,
    callerShapedEvidence: false,
    proseEvidence: false,
    testTitleEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxOnly: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityAlias: null,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceFiles(
  sourceFile,
  sourceFiles
) {
  const normalizedSourceFiles = [];
  for (const candidate of [sourceFile, ...arrayFromMaybe(sourceFiles)]) {
    if (
      typeof candidate === 'string' &&
      !normalizedSourceFiles.includes(candidate)
    ) {
      normalizedSourceFiles.push(candidate);
    }
  }

  return Object.freeze(normalizedSourceFiles);
}

function freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger(
  ledger
) {
  Object.defineProperty(ledger, 'validateGenerationAdmissionRows', {
    value:
      validateNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRows,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return Object.freeze(ledger);
}

function createNativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger(
  rows
) {
  const normalizedRows =
    enforceNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalSet(
      Array.from(
        rows ?? [],
        validateNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRow
      )
    );
  const frozenRows = Object.freeze(normalizedRows);
  const acceptedRows = Object.freeze(
    frozenRows.filter(
      (row) =>
        row.status ===
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus
    )
  );
  const rejectedRows = Object.freeze(
    frozenRows.filter(
      (row) =>
        row.status ===
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedStatus
    )
  );
  const canonicalSourceEvidenceAccepted =
    rejectedRows.length === 0 &&
    hasExactNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalSet(
      acceptedRows
    );

  return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger({
    ledgerStatus:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedgerStatus,
    model: nativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedgerModel,
    evaluationMode:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionEvaluationMode,
    sourceWorker:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceWorker,
    sourceWorkerProgress:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceWorkerProgress,
    sourceFile:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionSourceFile,
    sourceFiles:
      sourceFilesFromNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRows(
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows
      ),
    evidenceKind:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionEvidenceKind,
    acceptedStatus:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus,
    rejectedStatus:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedStatus,
    rejectionCodes:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes,
    rejectionCaseIds:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCaseIds,
    generationAdmissionRowFields:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRowFields,
    requiredEvidenceIds: Object.freeze(
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows.map(
        (row) => row.id
      )
    ),
    requiredEvidenceRoles: Object.freeze(
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows.map(
        (row) => row.role
      )
    ),
    sourceOwnedEvidenceRequired: true,
    blockedPrivateEvidenceOnly: true,
    publicAdmission: false,
    canonicalSourceEvidenceAccepted,
    acceptedEvidenceCount: acceptedRows.length,
    rejectedEvidenceCount: rejectedRows.length,
    rows: frozenRows,
    rejectedRows,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    reactBehaviorError: false
  });
}

function validateNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRows(
  rows
) {
  return createNativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger(
    rows
  );
}

function validateNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRow(
  row
) {
  if (row?.status === nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedStatus) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      row.code ??
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
          .staleOrForeign
    );
  }

  const publicOrNativeClaimCode =
    getNativeRootBridgeJsonBatchLifecycleGenerationAdmissionClaimCode(row);
  if (publicOrNativeClaimCode !== null) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      publicOrNativeClaimCode
    );
  }

  if (
    row?.proseEvidence === true ||
    row?.testTitleEvidence === true ||
    row?.errorMessageEvidence === true ||
    row?.evidenceKind === 'prose' ||
    row?.evidenceKind === 'test-title' ||
    row?.evidenceKind === 'error-message'
  ) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .proseEvidence
    );
  }

  if (
    row?.sourceSyntaxOnly === true ||
    row?.evidenceKind === 'source-syntax'
  ) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .sourceSyntaxOnly
    );
  }

  if (
    row?.sourceOwnedEvidence !== true ||
    row?.blockedPrivateEvidence !== true ||
    row?.publicAdmission !== false ||
    row?.callerShapedEvidence === true
  ) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .callerBuilt
    );
  }

  const canonicalRow =
    getNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow(row);
  if (canonicalRow === null) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .staleOrForeign
    );
  }

  if (canonicalRow.role !== row.role) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .sourceRoleMismatch
    );
  }

  if (
    row.id !== canonicalRow.id ||
    row.sourceFile !== canonicalRow.sourceFile ||
    !arrayEquals(row.sourceFiles, canonicalRow.sourceFiles) ||
    row.evidenceKind !== canonicalRow.evidenceKind ||
    row.code != null ||
    !arrayEquals(row.sourceIdentifiers, canonicalRow.sourceIdentifiers)
  ) {
    return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
      row,
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
        .staleOrForeign
    );
  }

  return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedRow(
    row
  );
}

function getNativeRootBridgeJsonBatchLifecycleGenerationAdmissionClaimCode(
  row
) {
  if (row === undefined || row === null) {
    return null;
  }

  if (row.nativeAddonLoaded === true) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .nativeAddonLoadClaim;
  }

  if (
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionPublicClaimFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .publicNativeExecutionClaim;
  }

  if (
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionPackageClaimFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .packageExportClaim;
  }

  if (row.nodeWorkerThreadsExecution === true) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .workerThreadExecutionClaim;
  }

  if (row.napiCleanupHookExecution === true) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .cleanupHookExecutionClaim;
  }

  if (
    row.rendererExecution === true ||
    row.reconcilerExecution === true ||
    row.reactBehaviorError === true
  ) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .rendererReconcilerOutputClaim;
  }

  if (
    row.compatibilityAlias !== undefined && row.compatibilityAlias !== null
  ) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .compatibilityAliasClaim;
  }

  if (
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCompatibilityAliasFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
      .compatibilityAliasClaim;
  }

  return null;
}

function freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedRow(
  row
) {
  return Object.freeze({
    id: row.id,
    role: row.role,
    sourceFile: row.sourceFile,
    sourceFiles: Object.freeze([...row.sourceFiles]),
    evidenceKind: row.evidenceKind,
    sourceIdentifiers: Object.freeze([...row.sourceIdentifiers]),
    status:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus,
    code: null,
    sourceOwnedEvidence: true,
    blockedPrivateEvidence: true,
    publicAdmission: false,
    callerShapedEvidence: false,
    proseEvidence: false,
    testTitleEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxOnly: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityAlias: null,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
  row,
  code
) {
  return Object.freeze({
    id: row?.id ?? null,
    role: row?.role ?? null,
    sourceFile: row?.sourceFile ?? null,
    sourceFiles: Object.freeze([...arrayFromMaybe(row?.sourceFiles)]),
    evidenceKind: row?.evidenceKind ?? null,
    sourceIdentifiers: Object.freeze([...arrayFromMaybe(row?.sourceIdentifiers)]),
    status:
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedStatus,
    code,
    sourceOwnedEvidence: row?.sourceOwnedEvidence === true,
    blockedPrivateEvidence: row?.blockedPrivateEvidence === true,
    publicAdmission: false,
    callerShapedEvidence: row?.callerShapedEvidence === true,
    proseEvidence: row?.proseEvidence === true,
    testTitleEvidence: row?.testTitleEvidence === true,
    errorMessageEvidence: row?.errorMessageEvidence === true,
    sourceSyntaxOnly: row?.sourceSyntaxOnly === true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    napiCleanupHookExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityAlias: null,
    reactBehaviorError: false
  });
}

function enforceNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalSet(
  rows
) {
  if (
    hasExactNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalSet(
      rows
    )
  ) {
    return rows;
  }

  return rows.map((row) => {
    if (
      row.status ===
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus
    ) {
      return freezeNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectedRow(
        row,
        nativeRootBridgeJsonBatchLifecycleGenerationAdmissionRejectionCodes
          .canonicalSetMismatch
      );
    }

    return row;
  });
}

function hasExactNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalSet(
  rows
) {
  if (
    rows.length !==
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows.length
  ) {
    return false;
  }

  for (const canonicalRow of nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows) {
    const matchingRows = rows.filter(
      (row) =>
        row.id === canonicalRow.id &&
        row.role === canonicalRow.role &&
        row.status ===
          nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus
    );

    if (matchingRows.length !== 1) {
      return false;
    }
  }

  return rows.every(
    (row) =>
      row.status ===
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionAcceptedStatus
  );
}

function getNativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRow(
  row
) {
  const byId =
    nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows.find(
      (canonicalRow) => canonicalRow.id === row?.id
    ) ?? null;

  if (byId === null) {
    return (
      nativeRootBridgeJsonBatchLifecycleGenerationAdmissionCanonicalRows.find(
        (canonicalRow) =>
          row?.sourceFile === canonicalRow.sourceFile &&
          arrayEquals(row?.sourceFiles, canonicalRow.sourceFiles) &&
          row?.evidenceKind === canonicalRow.evidenceKind &&
          arrayEquals(row?.sourceIdentifiers, canonicalRow.sourceIdentifiers)
      ) ?? null
    );
  }

  return byId;
}

function sourceFilesFromNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRows(
  rows
) {
  const sourceFiles = [];
  for (const row of rows) {
    for (const sourceFile of row.sourceFiles) {
      if (!sourceFiles.includes(sourceFile)) {
        sourceFiles.push(sourceFile);
      }
    }
  }

  return Object.freeze(sourceFiles);
}

function arrayFromMaybe(value) {
  return Array.isArray(value) ? value : [];
}

function arrayEquals(actual, expected) {
  const actualArray = arrayFromMaybe(actual);
  if (actualArray.length !== expected.length) {
    return false;
  }

  return actualArray.every((value, index) => value === expected[index]);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function normalizeNativeCapabilityClaimFieldName(field) {
  return String(field).replace(/[^a-z0-9]/giu, '').toLowerCase();
}

function getNativeCapabilityClaimKeyText(key) {
  if (typeof key === 'symbol') {
    return Symbol.keyFor(key) ?? key.description ?? '';
  }

  return String(key);
}

function getNativeCapabilityClaimFieldForKey(
  key,
  blockedFieldSet,
  blockedNormalizedFieldSet
) {
  const keyText = getNativeCapabilityClaimKeyText(key);
  if (keyText === '') {
    return null;
  }

  if (blockedFieldSet.has(keyText)) {
    return keyText;
  }

  return blockedNormalizedFieldSet.has(
    normalizeNativeCapabilityClaimFieldName(keyText)
  )
    ? keyText
    : null;
}

function isNativeCapabilityClaimDescriptorClaimed(descriptor) {
  return !hasOwn(descriptor, 'value') || Boolean(descriptor.value);
}

function formatNativeCapabilityClaimPath(path, key) {
  if (typeof key !== 'symbol') {
    return `${path}.${key}`;
  }

  const registryKey = Symbol.keyFor(key);
  if (registryKey !== undefined) {
    return `${path}[Symbol.for(${JSON.stringify(registryKey)})]`;
  }

  const description = key.description;
  return description === undefined
    ? `${path}[Symbol()]`
    : `${path}[Symbol(${JSON.stringify(description)})]`;
}

function getNativeCapabilityClaimKeyMetadata(key) {
  if (typeof key !== 'symbol') {
    return {
      keyType: 'string',
      symbolDescription: null,
      symbolRegistryKey: null
    };
  }

  return {
    keyType: 'symbol',
    symbolDescription: key.description ?? null,
    symbolRegistryKey: Symbol.keyFor(key) ?? null
  };
}

function createNativeRootBridgeRequestShapeGate(requests) {
  const requestList = Array.isArray(requests) ? requests : [requests];
  const sequenceState = {
    lastRequestId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false
  };
  const validationRecords = requestList.map((request, index) =>
    validateNativeRootBridgeRequestShapeRecord(request, sequenceState, index)
  );
  const handleAdmissionPreflight =
    createNativeRootBridgeHandleAdmissionPreflight(validationRecords);
  const rustHandleTableAdmissionSmoke =
    createNativeRootBridgeRustHandleTableAdmissionSmoke(
      handleAdmissionPreflight
    );
  const jsonTransportSmoke =
    createNativeRootBridgeJsonTransportSmoke(validationRecords);
  const batchLifecycleConsumer =
    createNativeRootBridgeBatchLifecycleConsumer({
      handleAdmissionPreflight,
      jsonTransportSmoke,
      rustHandleTableAdmissionSmoke
    });

  return Object.freeze({
    gateStatus: nativeRootBridgeRequestShapeGateStatus,
    validationModel: nativeRootBridgeRequestValidationModel,
    handleTableModel: nativeRootBridgeHandleTableModel,
    requestCount: validationRecords.length,
    validationRecords: Object.freeze(validationRecords),
    handleAdmissionPreflight,
    rustHandleTableAdmissionSmoke,
    jsonTransportSmoke,
    batchLifecycleConsumer,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function validateNativeRootBridgeRequestShapeRecord(input, sequenceState, index) {
  assertBlockedNativeRootBridgeHandoff(input);
  const record = getNativeRootBridgeRequestRecord(input);
  assertPlainObject(record, 'Expected a native root bridge request record.');

  const requestId = assertPositiveSafeInteger(
    record.requestId,
    'requestId'
  );
  validateRequestSequenceOrder(sequenceState, requestId);

  if (sequenceState.rootRetired) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request ${requestId} was recorded after root unmount.`,
      nativeRootBridgeValidationErrorCodes.requestAfterUnmount,
      { index, requestId }
    );
  }

  const kind = assertNativeRootBridgeRequestKind(record.kind, index);
  const environmentId = assertPositiveSafeInteger(
    record.environmentId,
    'environmentId'
  );
  const rootHandle = normalizeNativeRootBridgeHandle(
    record.rootHandle,
    nativeRootBridgeHandleKindRoot,
    environmentId,
    'rootHandle'
  );
  const rootId = assertPositiveSafeInteger(record.rootId, 'rootId');
  const expectedRootHandleState =
    kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;

  if (record.rootHandleState !== expectedRootHandleState) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${kind} request has root handle state ${String(
        record.rootHandleState
      )}, expected ${expectedRootHandleState}.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch,
      {
        actual: record.rootHandleState,
        expected: expectedRootHandleState,
        index,
        requestId
      }
    );
  }

  const valueHandle =
    record.valueHandle == null
      ? null
      : normalizeNativeRootBridgeHandle(
          record.valueHandle,
          nativeRootBridgeHandleKindValue,
          environmentId,
          'valueHandle'
        );

  if (sequenceState.rootHandle === null) {
    if (kind !== nativeRootBridgeRequestKindCreate) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request sequence must start with create, got ${kind}.`,
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
        { actual: kind, index, requestId }
      );
    }
  } else {
    if (kind === nativeRootBridgeRequestKindCreate) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request ${requestId} attempted to create another root in an active sequence.`,
        nativeRootBridgeValidationErrorCodes.createAfterRootCreated,
        { index, requestId }
      );
    }

    validateSameNativeRootBridgeHandle(
      sequenceState.rootHandle,
      rootHandle,
      index,
      requestId
    );
    if (rootId !== sequenceState.rootId) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge request record has root id ${rootId}, expected ${sequenceState.rootId}.`,
        nativeRootBridgeValidationErrorCodes.rootIdMismatch,
        {
          actual: rootId,
          expected: sequenceState.rootId,
          index,
          requestId
        }
      );
    }
  }

  if (kind === nativeRootBridgeRequestKindUnmount && valueHandle !== null) {
    throwNativeRootBridgeRequestShapeError(
      'Native root bridge unmount record cannot carry a value handle.',
      nativeRootBridgeValidationErrorCodes.unexpectedValueHandle,
      { index, requestId }
    );
  }

  const lifecycleTransition = getNativeRootBridgeLifecycleTransition(kind);
  const valueHandleValidated = valueHandle !== null;
  const rustValidationRecord = Object.freeze({
    request_id: requestId,
    kind,
    environment_id: environmentId,
    root_handle: toRustNativeRootBridgeHandle(rootHandle),
    root_id: rootId,
    value_handle:
      valueHandle === null ? null : toRustNativeRootBridgeHandle(valueHandle),
    root_handle_state: expectedRootHandleState,
    lifecycle_transition: lifecycleTransition,
    root_handle_validated: true,
    value_handle_validated: valueHandleValidated
  });
  const validationRecord = Object.freeze({
    requestId,
    kind,
    environmentId,
    rootHandle,
    rootId,
    valueHandle,
    rootHandleState: expectedRootHandleState,
    lifecycleTransition,
    rootHandleValidated: true,
    valueHandleValidated,
    rustValidationRecord
  });

  sequenceState.lastRequestId = requestId;
  if (sequenceState.rootHandle === null) {
    sequenceState.rootHandle = rootHandle;
    sequenceState.rootId = rootId;
  }
  if (kind === nativeRootBridgeRequestKindUnmount) {
    sequenceState.rootRetired = true;
  }

  return validationRecord;
}

function getNativeRootBridgeRequestRecord(input) {
  if (
    input &&
    typeof input === 'object' &&
    input.nativeRequestRecord &&
    typeof input.nativeRequestRecord === 'object'
  ) {
    return input.nativeRequestRecord;
  }

  return input;
}

function assertBlockedNativeRootBridgeHandoff(input) {
  if (!input || typeof input !== 'object') {
    return;
  }

  assertBlockedNativeRootBridgeHandoffClaims(input);
  if (
    input.nativeRequestRecord &&
    typeof input.nativeRequestRecord === 'object'
  ) {
    assertBlockedNativeRootBridgeHandoffClaims(input.nativeRequestRecord);
  }
}

function assertBlockedNativeRootBridgeHandoffClaims(input) {
  for (const key of Reflect.ownKeys(input)) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor) {
      continue;
    }

    const flag = getNativeCapabilityClaimFieldForKey(
      key,
      nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFieldSet,
      nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimNormalizedFieldSet
    );
    if (flag !== null && isNativeCapabilityClaimDescriptorClaimed(descriptor)) {
      throwNativeRootBridgeRequestShapeError(
        `Native root bridge handoff must not claim ${flag}.`,
        nativeRootBridgeRequestShapeErrorCode,
        { flag }
      );
    }
  }
}

function validateRequestSequenceOrder(sequenceState, requestId) {
  const previousRequestId = sequenceState.lastRequestId;
  if (previousRequestId === null || requestId > previousRequestId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request id ${requestId} must be greater than previous request id ${previousRequestId}.`,
    nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder,
    { previousRequestId, requestId }
  );
}

function assertNativeRootBridgeRequestKind(kind, index) {
  if (nativeRootBridgeRequestKinds.includes(kind)) {
    return kind;
  }

  throwNativeRootBridgeRequestShapeError(
    `Unsupported native root bridge request kind: ${String(kind)}.`,
    nativeRootBridgeRequestShapeErrorCode,
    { index, kind }
  );
}

function normalizeNativeRootBridgeHandle(
  handle,
  expectedKind,
  expectedEnvironmentId,
  field
) {
  assertPlainObject(handle, `Expected ${field} to be a native bridge handle.`);

  const environmentId = assertPositiveSafeInteger(
    handle.environmentId,
    `${field}.environmentId`
  );
  if (environmentId !== expectedEnvironmentId) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} belongs to environment ${environmentId}, expected ${expectedEnvironmentId}.`,
      nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      { environmentId, expectedEnvironmentId, field }
    );
  }

  if (handle.kind !== expectedKind) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} has kind ${String(
        handle.kind
      )}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      { actual: handle.kind, expected: expectedKind, field }
    );
  }

  return Object.freeze({
    environmentId,
    slot: assertPositiveSafeInteger(handle.slot, `${field}.slot`),
    generation: assertPositiveSafeInteger(
      handle.generation,
      `${field}.generation`
    ),
    kind: expectedKind
  });
}

function validateSameNativeRootBridgeHandle(expected, actual, index, requestId) {
  if (isSameNativeRootBridgeHandle(expected, actual)) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request record uses root handle slot ${actual.slot}, expected slot ${expected.slot}.`,
    nativeRootBridgeValidationErrorCodes.handleMismatch,
    { actual, expected, index, requestId }
  );
}

function isSameNativeRootBridgeHandle(expected, actual) {
  return (
    expected.environmentId === actual.environmentId &&
    expected.slot === actual.slot &&
    expected.generation === actual.generation &&
    expected.kind === actual.kind
  );
}

function getNativeRootBridgeLifecycleTransition(kind) {
  if (kind === nativeRootBridgeRequestKindCreate) {
    return nativeRootBridgeLifecycleTransitionNoneToActive;
  }
  if (kind === nativeRootBridgeRequestKindRender) {
    return nativeRootBridgeLifecycleTransitionActiveToActive;
  }
  return nativeRootBridgeLifecycleTransitionActiveToRetired;
}

function toRustNativeRootBridgeHandle(handle) {
  return Object.freeze({
    environment_id: handle.environmentId,
    slot: handle.slot,
    generation: handle.generation,
    kind: handle.kind
  });
}

function createNativeRootBridgeHandleAdmissionPreflight(validationRecords) {
  const table = createNativeRootBridgeHandleAdmissionTable();
  const admissionRecords = validationRecords.map((record, index) =>
    preflightNativeRootBridgeHandleAdmissionRecord(record, table, index)
  );

  return Object.freeze({
    preflightStatus: nativeRootBridgeHandleAdmissionPreflightStatus,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: admissionRecords.length,
    tableEnvironmentId: table.environmentId,
    rootId: table.rootId,
    rootHandle: table.rootHandle,
    rootRetired: table.rootRetired,
    admissionRecords: Object.freeze(admissionRecords),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeRustHandleTableAdmissionSmoke(preflight) {
  const smokeRecords = preflight.admissionRecords.map((record) =>
    freezeNativeRootBridgeRustHandleTableAdmissionSmokeRecord(record)
  );

  return Object.freeze({
    smokeStatus: nativeRootBridgeRustHandleTableAdmissionSmokeStatus,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: smokeRecords.length,
    tableEnvironmentId: preflight.tableEnvironmentId,
    rootId: preflight.rootId,
    rootHandle: preflight.rootHandle,
    rootRetired: preflight.rootRetired,
    rustAdmissionSmokeRecordFields:
      nativeRootBridgeRustHandleTableAdmissionSmokeRecordFields,
    smokeRecords: Object.freeze(smokeRecords),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function freezeNativeRootBridgeRustHandleTableAdmissionSmokeRecord(record) {
  const rootHandleStateBefore =
    record.kind === nativeRootBridgeRequestKindCreate
      ? null
      : nativeRootBridgeRootHandleStateActive;
  const rootHandleStateAfter =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;
  const valueHandleAction = record.valueHandleAdmission?.action ?? null;
  const valueHandleCurrentGeneration =
    record.valueHandleAdmission?.currentGeneration ?? null;
  const retiredRootSourceErrorCode =
    record.retiredRootHandleValidation?.sourceErrorCode ?? null;

  return Object.freeze({
    requestId: record.requestId,
    kind: record.kind,
    lifecycleTransition: record.lifecycleTransition,
    rootHandleStateBefore,
    rootHandleStateAfter,
    rootHandleAction: record.rootHandleAdmission.action,
    rootHandleCurrentGeneration:
      record.rootHandleAdmission.currentGeneration,
    valueHandleAction,
    valueHandleCurrentGeneration,
    retiredRootSourceErrorCode,
    rustAdmissionSmokeRecord: Object.freeze({
      request_id: record.requestId,
      kind: record.kind,
      lifecycle_transition: record.lifecycleTransition,
      root_handle_state_before: rootHandleStateBefore,
      root_handle_state_after: rootHandleStateAfter,
      root_handle_action: record.rootHandleAdmission.action,
      root_handle_current_generation:
        record.rootHandleAdmission.currentGeneration,
      value_handle_action: valueHandleAction,
      value_handle_current_generation: valueHandleCurrentGeneration,
      retired_root_source_error_code: retiredRootSourceErrorCode
    })
  });
}

function createNativeRootBridgeJsonTransportSmoke(validationRecords) {
  const requestRecords = Object.freeze(
    validationRecords.map((record) =>
      freezeNativeRootBridgeJsonTransportRequestRecord(record)
    )
  );
  const envelope = Object.freeze({
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    requestRecords
  });
  const json = JSON.stringify(envelope);
  const parserGate = createNativeRootBridgeJsonTransportParserGate(json);
  const decodedRequestRecords = parserGate.decodedRequestRecords;
  const decodedValidationRecords =
    validateNativeRootBridgeJsonTransportRecords(decodedRequestRecords);
  const handleAdmissionPreflight =
    createNativeRootBridgeHandleAdmissionPreflight(decodedValidationRecords);
  const rustHandleTableAdmissionSmoke =
    createNativeRootBridgeRustHandleTableAdmissionSmoke(
      handleAdmissionPreflight
    );

  return Object.freeze({
    smokeStatus: nativeRootBridgeJsonTransportSmokeStatus,
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    handleTableModel: nativeRootBridgeHandleTableModel,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: decodedRequestRecords.length,
    json,
    byteLength: json.length,
    jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
    jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
    jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
    decodedRequestRecords: Object.freeze(decodedRequestRecords),
    parserGate,
    rustHandleTableAdmissionSmoke,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function freezeNativeRootBridgeJsonTransportRequestRecord(record) {
  const rustRecord = record.rustValidationRecord;

  return Object.freeze({
    request_id: rustRecord.request_id,
    kind: rustRecord.kind,
    environment_id: rustRecord.environment_id,
    root_handle: freezeNativeRootBridgeJsonTransportHandle(
      rustRecord.root_handle
    ),
    root_id: rustRecord.root_id,
    value_handle:
      rustRecord.value_handle === null
        ? null
        : freezeNativeRootBridgeJsonTransportHandle(rustRecord.value_handle),
    root_handle_state: rustRecord.root_handle_state
  });
}

function freezeNativeRootBridgeJsonTransportHandle(handle) {
  return Object.freeze({
    environment_id: handle.environment_id,
    slot: handle.slot,
    generation: handle.generation,
    kind: handle.kind
  });
}

function createNativeRootBridgeJsonTransportParserGate(json) {
  const decodedRequestRecords =
    parseNativeRootBridgeJsonTransportRequestRecords(json);
  const batchedRecordGate =
    createNativeRootBridgeBatchedJsonTransportGate(decodedRequestRecords);

  return Object.freeze({
    parserGateStatus: nativeRootBridgeJsonTransportParserGateStatus,
    transport: nativeRootBridgeJsonTransportFormat,
    schemaVersion: nativeRootBridgeJsonTransportSchemaVersion,
    requestCount: decodedRequestRecords.length,
    byteLength: json.length,
    jsonTransportEnvelopeFields: nativeRootBridgeJsonTransportEnvelopeFields,
    jsonTransportRequestRecordFields: nativeRootBridgeRustRequestRecordFields,
    jsonTransportHandleFields: nativeRootBridgeRustHandleFields,
    parseErrorCodes: nativeRootBridgeJsonTransportParseErrorCodes,
    jsonTransportErrorDiagnosticRowFields:
      nativeRootBridgeJsonTransportErrorDiagnosticRowFields,
    jsonTransportErrorDiagnosticCaseIds:
      nativeRootBridgeJsonTransportErrorDiagnosticCaseIds,
    decodedRequestRecords,
    deterministicParseErrors:
      createNativeRootBridgeJsonTransportParseErrorEvidence(),
    deterministicErrorRows:
      createNativeRootBridgeJsonTransportErrorDiagnosticRows(),
    batchedRecordGate,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeJsonTransportParseErrorEvidence() {
  const cases = [
    {
      id: 'invalid-json',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      json: '{'
    },
    {
      id: 'non-object-envelope',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.expectedObject,
      json: '[]'
    },
    {
      id: 'missing-request-records',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.missingField,
      json: '{"transport":"json","schemaVersion":1}'
    },
    {
      id: 'unexpected-envelope-field',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.unexpectedField,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[],"extra":true}'
    },
    {
      id: 'request-records-not-array',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      json: '{"transport":"json","schemaVersion":1,"requestRecords":{}}'
    },
    {
      id: 'unsupported-transport',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      json: '{"transport":"binary","schemaVersion":1,"requestRecords":[]}'
    },
    {
      id: 'unknown-request-kind',
      expectedCode:
        nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"hydrate","environment_id":435,"root_handle":{"environment_id":435,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map(({ expectedCode, id, json }) => {
      try {
        parseNativeRootBridgeJsonTransportRequestRecords(json);
      } catch (error) {
        assertNativeRootBridgeJsonTransportParserEvidenceError(
          error,
          expectedCode,
          id
        );
        return Object.freeze({
          id,
          code: error.code,
          name: error.name,
          details: error.details,
          nativeAddonLoaded: error.nativeAddonLoaded,
          nativeExecution: error.nativeExecution,
          rendererExecution: error.rendererExecution,
          reconcilerExecution: error.reconcilerExecution
        });
      }

      throw new Error(
        `Expected native root bridge JSON transport parser case ${id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeJsonTransportErrorDiagnosticRows() {
  const cases = [
    {
      id: 'malformed-payload',
      category: 'malformed-payload',
      phase: 'parse',
      expectedCode: nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      sourceErrorCode: null,
      boundaryErrorCode: null,
      json: '{'
    },
    {
      id: 'wrong-environment-root-handle',
      category: 'wrong-environment',
      phase: 'validation',
      expectedCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      boundaryErrorCode:
        nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":468,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'stale-value-handle-generation',
      category: 'stale-handle',
      phase: 'validation',
      expectedCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle,
      boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeStaleHandle,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":1,"kind":"value"},"root_handle_state":"active"},{"request_id":2,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":{"environment_id":467,"slot":2,"generation":2,"kind":"value"},"root_handle_state":"active"}]}'
    },
    {
      id: 'render-before-create-lifecycle-order',
      category: 'lifecycle-order',
      phase: 'validation',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      sourceErrorCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      boundaryErrorCode:
        nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":467,"root_handle":{"environment_id":467,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map((diagnosticCase) => {
      try {
        validateNativeRootBridgeJsonTransportDiagnosticPayload(
          diagnosticCase.json
        );
      } catch (error) {
        assertNativeRootBridgeJsonTransportDiagnosticRowError(
          error,
          diagnosticCase.expectedCode,
          diagnosticCase.id
        );
        return Object.freeze({
          id: diagnosticCase.id,
          category: diagnosticCase.category,
          phase: diagnosticCase.phase,
          name: error.name,
          code: error.code,
          sourceErrorCode: diagnosticCase.sourceErrorCode,
          boundaryErrorCode: diagnosticCase.boundaryErrorCode,
          nativeAddonLoaded: error.nativeAddonLoaded,
          nativeExecution: error.nativeExecution,
          rendererExecution: error.rendererExecution,
          reconcilerExecution: error.reconcilerExecution,
          reactBehaviorError: false
        });
      }

      throw new Error(
        `Expected native root bridge JSON transport diagnostic case ${diagnosticCase.id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeBatchedJsonTransportGate(decodedRequestRecords) {
  const lifecycleRows =
    createNativeRootBridgeBatchedJsonTransportLifecycleRows(
      decodedRequestRecords
    );
  const errorRows = createNativeRootBridgeBatchedJsonTransportErrorRows();

  return Object.freeze({
    batchGateStatus: nativeRootBridgeBatchedJsonTransportGateStatus,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: decodedRequestRecords.length,
    lifecycleStates: nativeRootBridgeJsonTransportBatchLifecycleStates,
    lifecycleStatuses: nativeRootBridgeJsonTransportBatchLifecycleStatuses,
    jsonTransportBatchLifecycleRowFields:
      nativeRootBridgeJsonTransportBatchLifecycleRowFields,
    jsonTransportBatchErrorCaseIds:
      nativeRootBridgeJsonTransportBatchErrorCaseIds,
    lifecycleRows,
    errorRows,
    responseSequenceGate:
      createNativeRootBridgeJsonTransportBatchResponseSequenceGate(
        lifecycleRows,
        errorRows
      ),
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false
  });
}

function createNativeRootBridgeBatchedJsonTransportErrorRows() {
  const cases = [
    {
      id: 'batch-render-before-create-lifecycle-order',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-root-handle-state-mismatch',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"}]}'
    },
    {
      id: 'batch-create-after-create-lifecycle-order',
      expectedCode:
        nativeRootBridgeValidationErrorCodes.createAfterRootCreated,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-request-after-unmount-lifecycle-order',
      expectedCode: nativeRootBridgeValidationErrorCodes.requestAfterUnmount,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":1,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":2,"kind":"unmount","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"retired"},{"request_id":3,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    },
    {
      id: 'batch-request-id-out-of-order',
      expectedCode: nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder,
      json:
        '{"transport":"json","schemaVersion":1,"requestRecords":[{"request_id":2,"kind":"create","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"},{"request_id":1,"kind":"render","environment_id":495,"root_handle":{"environment_id":495,"slot":1,"generation":1,"kind":"root"},"root_id":1,"value_handle":null,"root_handle_state":"active"}]}'
    }
  ];

  return Object.freeze(
    cases.map((diagnosticCase) => {
      const records = parseNativeRootBridgeJsonTransportRequestRecords(
        diagnosticCase.json
      );
      const row = createNativeRootBridgeBatchedJsonTransportLifecycleRows(
        records
      ).find(
        (lifecycleRow) =>
          lifecycleRow.status ===
          nativeRootBridgeJsonTransportBatchLifecycleStatusError
      );

      if (row?.code === diagnosticCase.expectedCode) {
        return Object.freeze({
          ...row,
          id: diagnosticCase.id
        });
      }

      throw new Error(
        `Expected native root bridge batched JSON transport diagnostic case ${diagnosticCase.id} to fail.`
      );
    })
  );
}

function createNativeRootBridgeJsonTransportBatchResponseSequenceGate(
  lifecycleRows,
  errorRows
) {
  const rows = Object.freeze(
    lifecycleRows.map((row, responseOrder) =>
      freezeNativeRootBridgeJsonTransportBatchResponseSequenceRow({
        id:
          row.status === nativeRootBridgeJsonTransportBatchLifecycleStatusError
            ? `batch-response-${responseOrder}-error`
            : `batch-response-${responseOrder}-${row.kind}`,
        row,
        responseOrder,
        errorRowStatus:
          row.status === nativeRootBridgeJsonTransportBatchLifecycleStatusError
            ? nativeRootBridgeJsonTransportBatchResponseErrorRowStatusLifecycleError
            : nativeRootBridgeJsonTransportBatchResponseErrorRowStatusNotError
      })
    )
  );
  const deterministicErrorRows = Object.freeze(
    errorRows.map((row, responseOrder) =>
      freezeNativeRootBridgeJsonTransportBatchResponseSequenceRow({
        id: row.id,
        row,
        responseOrder,
        errorRowStatus:
          nativeRootBridgeJsonTransportBatchResponseErrorRowStatusDeterministic
      })
    )
  );
  const streamRoundtripGate =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripGate(rows);

  return Object.freeze({
    responseSequenceGateStatus:
      nativeRootBridgeJsonTransportBatchResponseSequenceGateStatus,
    batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: lifecycleRows.length,
    responseCount: rows.length,
    errorRowCount: deterministicErrorRows.length,
    jsonTransportBatchResponseSequenceRowFields:
      nativeRootBridgeJsonTransportBatchResponseSequenceRowFields,
    errorRowStatuses:
      nativeRootBridgeJsonTransportBatchResponseErrorRowStatuses,
    teardownStates: nativeRootBridgeJsonTransportBatchResponseTeardownStates,
    rows,
    errorRows: deterministicErrorRows,
    streamRoundtripGate,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootBridgeJsonTransportBatchResponseSequenceRow({
  id,
  row,
  responseOrder,
  errorRowStatus
}) {
  return Object.freeze({
    id,
    batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
    requestOrder: row.batchIndex,
    responseOrder,
    requestId: row.requestId,
    kind: row.kind,
    responseStatus: row.status,
    errorRowStatus,
    teardownState:
      getNativeRootBridgeJsonTransportBatchResponseTeardownState(row),
    code: row.code,
    sourceErrorCode: row.sourceErrorCode,
    boundaryErrorCode: row.boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function getNativeRootBridgeJsonTransportBatchResponseTeardownState(row) {
  const lifecycle =
    row.status === nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted
      ? row.lifecycleAfter
      : row.lifecycleBefore;

  if (lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateRetired) {
    return nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired;
  }
  if (lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateActive) {
    return nativeRootBridgeJsonTransportBatchResponseTeardownStateRootActive;
  }
  return nativeRootBridgeJsonTransportBatchResponseTeardownStateRootUninitialized;
}

function createNativeRootBridgeJsonTransportStreamBatchRoundtripGate(
  responseRows
) {
  const chunks =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(responseRows);
  const validation =
    validateNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(chunks);

  if (validation.error !== null) {
    throw new Error(
      `Expected native root bridge JSON stream batch roundtrip fixture to pass; got ${validation.error.code}.`
    );
  }

  const rows = Object.freeze(validation.rows);
  const errorRows =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripErrorRows(
      responseRows
    );

  return Object.freeze({
    streamRoundtripGateStatus:
      nativeRootBridgeJsonTransportStreamBatchRoundtripGateStatus,
    batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
    streamId: nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId,
    validationModel: nativeRootBridgeRequestValidationModel,
    requestCount: responseRows.length,
    chunkCount: rows.length,
    assembledResponseCount: rows.filter((row) => row.assembledResponse).length,
    errorRowCount: errorRows.length,
    jsonTransportStreamBatchRoundtripChunkRowFields:
      nativeRootBridgeJsonTransportStreamBatchRoundtripChunkRowFields,
    jsonTransportStreamBatchRoundtripErrorCaseIds:
      nativeRootBridgeJsonTransportStreamBatchRoundtripErrorCaseIds,
    chunkKinds: nativeRootBridgeJsonTransportStreamBatchRoundtripChunkKinds,
    chunkStatuses: nativeRootBridgeJsonTransportStreamBatchRoundtripChunkStatuses,
    assemblyStates:
      nativeRootBridgeJsonTransportStreamBatchRoundtripAssemblyStates,
    teardownBlockers:
      nativeRootBridgeJsonTransportStreamBatchRoundtripTeardownBlockers,
    rows,
    errorRows,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    crossEnvironmentHandleReuseBlocked: true,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function createNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(
  responseRows
) {
  return responseRows.flatMap((row, responseIndex) => [
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunk(
      row,
      0,
      responseIndex * 2
    ),
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunk(
      row,
      1,
      responseIndex * 2 + 1
    )
  ]);
}

function createNativeRootBridgeJsonTransportStreamBatchRoundtripChunk(
  row,
  chunkOrder,
  batchSequence
) {
  const chunkKind = chunkOrder === 0 ? 'metadata' : 'payload';
  const teardownState =
    row.kind === nativeRootBridgeRequestKindUnmount && chunkKind === 'metadata'
      ? nativeRootBridgeJsonTransportBatchResponseTeardownStateRootActive
      : row.teardownState;

  return {
    requestId: row.requestId,
    requestOrder: row.requestOrder,
    responseOrder: row.responseOrder,
    chunkOrder,
    batchSequence,
    chunkKind,
    responseStatus: row.responseStatus,
    teardownState
  };
}

function validateNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(
  chunks
) {
  const rows = [];
  const seenChunks = new Set();
  let expectedBatchSequence = 0;
  let expectedResponseOrder = 0;
  let expectedChunkOrder = 0;
  let teardownSeen = false;

  for (const chunk of chunks) {
    if (chunk.batchSequence !== expectedBatchSequence) {
      return {
        rows,
        error:
          freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
            id: 'stream-chunk-out-of-order',
            chunk,
            code: nativeRootBridgeJsonTransportStreamBatchOutOfOrderChunkCode,
            teardownBlocker: 'none'
          })
      };
    }

    if (teardownSeen) {
      return {
        rows,
        error:
          freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
            id: 'stream-chunk-after-teardown',
            chunk,
            code:
              nativeRootBridgeJsonTransportStreamBatchPostTeardownChunkCode,
            teardownBlocker: 'post-teardown-chunk-blocked'
          })
      };
    }

    const chunkKey = `${chunk.responseOrder}:${chunk.chunkOrder}`;
    if (seenChunks.has(chunkKey)) {
      return {
        rows,
        error:
          freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
            id: 'stream-chunk-duplicate',
            chunk,
            code: nativeRootBridgeJsonTransportStreamBatchDuplicateChunkCode,
            teardownBlocker: 'none'
          })
      };
    }
    seenChunks.add(chunkKey);

    if (
      chunk.responseOrder !== expectedResponseOrder ||
      chunk.chunkOrder !== expectedChunkOrder
    ) {
      return {
        rows,
        error:
          freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
            id: 'stream-chunk-out-of-order',
            chunk,
            code: nativeRootBridgeJsonTransportStreamBatchOutOfOrderChunkCode,
            teardownBlocker: 'none'
          })
      };
    }

    rows.push(
      freezeNativeRootBridgeJsonTransportStreamBatchRoundtripAcceptedRow(chunk)
    );
    expectedBatchSequence += 1;

    if (chunk.chunkKind === 'payload') {
      expectedResponseOrder += 1;
      expectedChunkOrder = 0;

      if (
        chunk.teardownState ===
        nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
      ) {
        teardownSeen = true;
      }
    } else {
      expectedChunkOrder = 1;
    }
  }

  if (expectedChunkOrder !== 0) {
    const previousChunk = chunks[chunks.length - 1];
    return {
      rows,
      error:
        freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
          id: 'stream-chunk-missing',
          chunk: {
            ...previousChunk,
            chunkOrder: expectedChunkOrder,
            batchSequence: expectedBatchSequence,
            chunkKind: 'payload'
          },
          code: nativeRootBridgeJsonTransportStreamBatchMissingChunkCode,
          teardownBlocker: 'none'
        })
    };
  }

  return {rows, error: null};
}

function createNativeRootBridgeJsonTransportStreamBatchRoundtripErrorRows(
  responseRows
) {
  if (responseRows.length === 0) {
    return Object.freeze([]);
  }

  const firstMetadata =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunk(
      responseRows[0],
      0,
      0
    );
  const firstPayload =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunk(
      responseRows[0],
      1,
      0
    );
  const duplicateMetadata = {
    ...firstMetadata,
    batchSequence: 1
  };
  const acceptedChunks =
    createNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(responseRows);
  const lastResponseRow = responseRows[responseRows.length - 1];

  if (
    acceptedChunks.every(
      (chunk) =>
        chunk.chunkKind !== 'payload' ||
        chunk.teardownState !==
          nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
    )
  ) {
    const syntheticRequestId = lastResponseRow.requestId + 1;
    const syntheticRequestOrder = lastResponseRow.requestOrder + 1;
    const syntheticResponseOrder = lastResponseRow.responseOrder + 1;
    acceptedChunks.push({
      requestId: syntheticRequestId,
      requestOrder: syntheticRequestOrder,
      responseOrder: syntheticResponseOrder,
      chunkOrder: 0,
      batchSequence: acceptedChunks.length,
      chunkKind: 'metadata',
      responseStatus: nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
      teardownState:
        nativeRootBridgeJsonTransportBatchResponseTeardownStateRootActive
    });
    acceptedChunks.push({
      requestId: syntheticRequestId,
      requestOrder: syntheticRequestOrder,
      responseOrder: syntheticResponseOrder,
      chunkOrder: 1,
      batchSequence: acceptedChunks.length,
      chunkKind: 'payload',
      responseStatus: nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
      teardownState:
        nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
    });
  }

  const lastAcceptedChunk = acceptedChunks[acceptedChunks.length - 1];
  const postTeardownChunk = {
    requestId: lastResponseRow.requestId + 1,
    requestOrder: lastResponseRow.requestOrder + 1,
    responseOrder: lastAcceptedChunk.responseOrder + 1,
    chunkOrder: 0,
    batchSequence: acceptedChunks.length,
    chunkKind: 'metadata',
    responseStatus: nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
    teardownState:
      nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
  };
  acceptedChunks.push(postTeardownChunk);

  const cases = [
    {
      id: 'stream-chunk-out-of-order',
      chunks: [firstPayload],
      code: nativeRootBridgeJsonTransportStreamBatchOutOfOrderChunkCode
    },
    {
      id: 'stream-chunk-duplicate',
      chunks: [firstMetadata, duplicateMetadata],
      code: nativeRootBridgeJsonTransportStreamBatchDuplicateChunkCode
    },
    {
      id: 'stream-chunk-missing',
      chunks: [firstMetadata],
      code: nativeRootBridgeJsonTransportStreamBatchMissingChunkCode
    },
    {
      id: 'stream-chunk-after-teardown',
      chunks: acceptedChunks,
      code: nativeRootBridgeJsonTransportStreamBatchPostTeardownChunkCode
    }
  ];

  return Object.freeze(
    cases.map((diagnosticCase) => {
      const validation =
        validateNativeRootBridgeJsonTransportStreamBatchRoundtripChunks(
          diagnosticCase.chunks
        );

      if (
        validation.error?.id === diagnosticCase.id &&
        validation.error.code === diagnosticCase.code
      ) {
        return validation.error;
      }

      throw new Error(
        `Expected native root bridge JSON stream batch diagnostic case ${diagnosticCase.id} to reject.`
      );
    })
  );
}

function freezeNativeRootBridgeJsonTransportStreamBatchRoundtripAcceptedRow(
  chunk
) {
  const assembledResponse = chunk.chunkKind === 'payload';
  return freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRow({
    id: `stream-batch-chunk-${chunk.batchSequence}-request-${chunk.requestId}-${chunk.chunkKind}`,
    chunk,
    chunkStatus: 'accepted',
    assemblyState: assembledResponse ? 'assembled' : 'partial',
    assembledResponse,
    teardownBlocker:
      assembledResponse &&
      chunk.teardownState ===
        nativeRootBridgeJsonTransportBatchResponseTeardownStateRootRetired
        ? 'root-retired-after-assembly'
        : 'none',
    code: null,
    sourceErrorCode: null,
    boundaryErrorCode: null
  });
}

function freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRejectedRow({
  id,
  chunk,
  code,
  teardownBlocker
}) {
  return freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRow({
    id,
    chunk,
    chunkStatus: 'error',
    assemblyState: 'rejected',
    assembledResponse: false,
    teardownBlocker,
    code,
    sourceErrorCode: code,
    boundaryErrorCode: nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder
  });
}

function freezeNativeRootBridgeJsonTransportStreamBatchRoundtripRow({
  id,
  chunk,
  chunkStatus,
  assemblyState,
  assembledResponse,
  teardownBlocker,
  code,
  sourceErrorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    id,
    batchId: nativeRootBridgeJsonTransportBatchResponseSequenceBatchId,
    streamId: nativeRootBridgeJsonTransportStreamBatchRoundtripStreamId,
    requestId: chunk.requestId,
    requestOrder: chunk.requestOrder,
    responseOrder: chunk.responseOrder,
    chunkOrder: chunk.chunkOrder,
    batchSequence: chunk.batchSequence,
    chunkKind: chunk.chunkKind,
    chunkStatus,
    responseStatus: chunk.responseStatus,
    assemblyState,
    assembledResponse,
    teardownState: chunk.teardownState,
    teardownBlocker,
    code,
    sourceErrorCode,
    boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    crossEnvironmentHandleReuseBlocked: true,
    publicNativeCompatibility: false,
    reactBehaviorError: false
  });
}

function createNativeRootBridgeBatchedJsonTransportLifecycleRows(records) {
  const state = {
    lastRequestId: null,
    lifecycle: nativeRootBridgeJsonTransportBatchLifecycleStateNone,
    rootHandle: null,
    rootId: null
  };
  const rows = [];

  for (const [batchIndex, record] of records.entries()) {
    rows.push(
      createNativeRootBridgeBatchedJsonTransportLifecycleRow(
        record,
        batchIndex,
        state
      )
    );

    if (
      rows[rows.length - 1].status ===
      nativeRootBridgeJsonTransportBatchLifecycleStatusError
    ) {
      break;
    }
  }

  return Object.freeze(rows);
}

function createNativeRootBridgeBatchedJsonTransportLifecycleRow(
  record,
  batchIndex,
  state
) {
  const lifecycleBefore = state.lifecycle;
  const errorCode = getNativeRootBridgeBatchedJsonTransportLifecycleErrorCode(
    record,
    state
  );

  if (errorCode !== null) {
    return freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
      id: `batch-record-${batchIndex}-error`,
      batchIndex,
      requestId: record.requestId,
      kind: record.kind,
      lifecycleBefore,
      lifecycleAfter: lifecycleBefore,
      lifecycleTransition: null,
      status: nativeRootBridgeJsonTransportBatchLifecycleStatusError,
      code: errorCode,
      sourceErrorCode: errorCode,
      boundaryErrorCode:
        getNativeRootBridgeBatchedJsonTransportBoundaryErrorCode(errorCode)
    });
  }

  const lifecycleTransition = getNativeRootBridgeLifecycleTransition(
    record.kind
  );
  const lifecycleAfter =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeJsonTransportBatchLifecycleStateRetired
      : nativeRootBridgeJsonTransportBatchLifecycleStateActive;

  state.lastRequestId = record.requestId;
  if (state.rootHandle === null) {
    state.rootHandle = record.rootHandle;
    state.rootId = record.rootId;
  }
  state.lifecycle = lifecycleAfter;

  return freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
    id: `batch-record-${batchIndex}-${record.kind}`,
    batchIndex,
    requestId: record.requestId,
    kind: record.kind,
    lifecycleBefore,
    lifecycleAfter,
    lifecycleTransition,
    status: nativeRootBridgeJsonTransportBatchLifecycleStatusAccepted,
    code: null,
    sourceErrorCode: null,
    boundaryErrorCode: null
  });
}

function getNativeRootBridgeBatchedJsonTransportLifecycleErrorCode(
  record,
  state
) {
  if (
    state.lastRequestId !== null &&
    record.requestId <= state.lastRequestId
  ) {
    return nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder;
  }

  if (state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateRetired) {
    return nativeRootBridgeValidationErrorCodes.requestAfterUnmount;
  }

  if (
    state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateNone &&
    record.kind !== nativeRootBridgeRequestKindCreate
  ) {
    return nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate;
  }

  if (
    state.lifecycle === nativeRootBridgeJsonTransportBatchLifecycleStateActive &&
    record.kind === nativeRootBridgeRequestKindCreate
  ) {
    return nativeRootBridgeValidationErrorCodes.createAfterRootCreated;
  }

  if (
    state.rootHandle !== null &&
    !isSameNativeRootBridgeHandle(state.rootHandle, record.rootHandle)
  ) {
    return nativeRootBridgeValidationErrorCodes.handleMismatch;
  }

  if (state.rootId !== null && record.rootId !== state.rootId) {
    return nativeRootBridgeValidationErrorCodes.rootIdMismatch;
  }

  const expectedRootHandleState =
    record.kind === nativeRootBridgeRequestKindUnmount
      ? nativeRootBridgeRootHandleStateRetired
      : nativeRootBridgeRootHandleStateActive;
  if (record.rootHandleState !== expectedRootHandleState) {
    return nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch;
  }

  if (
    record.kind === nativeRootBridgeRequestKindUnmount &&
    record.valueHandle !== null
  ) {
    return nativeRootBridgeValidationErrorCodes.unexpectedValueHandle;
  }

  return null;
}

function getNativeRootBridgeBatchedJsonTransportBoundaryErrorCode(code) {
  if (
    code === nativeRootBridgeValidationErrorCodes.sequenceMustStartWithCreate ||
    code === nativeRootBridgeValidationErrorCodes.createAfterRootCreated ||
    code === nativeRootBridgeValidationErrorCodes.requestAfterUnmount ||
    code === nativeRootBridgeValidationErrorCodes.sequenceOutOfOrder ||
    code === nativeRootBridgeValidationErrorCodes.rootHandleStateMismatch ||
    code === nativeRootBridgeValidationErrorCodes.rootHandleStillActive
  ) {
    return nativeBoundaryErrorCodeMap.rootBridgeWrongLifecycleOrder;
  }

  if (code === nativeRootBridgeValidationErrorCodes.wrongEnvironment) {
    return nativeBoundaryErrorCodeMap.rootBridgeWrongEnvironment;
  }

  if (code === nativeRootBridgeValidationErrorCodes.staleHandle) {
    return nativeBoundaryErrorCodeMap.rootBridgeStaleHandle;
  }

  return null;
}

function freezeNativeRootBridgeBatchedJsonTransportLifecycleRow({
  id,
  batchIndex,
  requestId,
  kind,
  lifecycleBefore,
  lifecycleAfter,
  lifecycleTransition,
  status,
  code,
  sourceErrorCode,
  boundaryErrorCode
}) {
  return Object.freeze({
    id,
    batchIndex,
    requestId,
    kind,
    lifecycleBefore,
    lifecycleAfter,
    lifecycleTransition,
    status,
    code,
    sourceErrorCode,
    boundaryErrorCode,
    nativeAddonLoaded: false,
    nativeExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    reactBehaviorError: false
  });
}

function validateNativeRootBridgeJsonTransportDiagnosticPayload(json) {
  const decodedRecords = parseNativeRootBridgeJsonTransportRequestRecords(json);
  const validationRecords =
    validateNativeRootBridgeJsonTransportRecords(decodedRecords);
  createNativeRootBridgeHandleAdmissionPreflight(validationRecords);
}

function assertNativeRootBridgeJsonTransportDiagnosticRowError(
  error,
  expectedCode,
  id
) {
  if (
    (error?.name === 'FastReactNativeJsonTransportParserError' ||
      error?.name === 'FastReactNativeRequestShapeError') &&
    error.code === expectedCode &&
    error.nativeAddonLoaded === false &&
    error.nativeExecution === false &&
    error.rendererExecution === false &&
    error.reconcilerExecution === false
  ) {
    return;
  }

  throw new Error(
    `Unexpected native root bridge JSON transport diagnostic error for ${id}.`
  );
}

function assertNativeRootBridgeJsonTransportParserEvidenceError(
  error,
  expectedCode,
  id
) {
  if (
    error?.name === 'FastReactNativeJsonTransportParserError' &&
    error.code === expectedCode &&
    error.nativeExecution === false &&
    error.rendererExecution === false &&
    error.reconcilerExecution === false
  ) {
    return;
  }

  throw new Error(
    `Unexpected native root bridge JSON transport parser error for ${id}.`
  );
}

function parseNativeRootBridgeJsonTransportRequestRecords(json) {
  let envelope;
  try {
    envelope = JSON.parse(json);
  } catch (cause) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport payload is invalid JSON.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidJson,
      { parser: 'JSON.parse' }
    );
  }

  assertExactPlainObject(
    envelope,
    '$',
    nativeRootBridgeJsonTransportEnvelopeFields
  );
  const transport = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'transport'
  );
  if (typeof transport !== 'string') {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport field $.transport must be a string.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(transport),
        expected: 'string',
        path: '$.transport'
      }
    );
  }
  if (transport !== nativeRootBridgeJsonTransportFormat) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge JSON transport must use ${nativeRootBridgeJsonTransportFormat} transport.`,
      nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      {
        actual: transport,
        expected: nativeRootBridgeJsonTransportFormat
      }
    );
  }
  const schemaVersion = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'schemaVersion'
  );
  if (!Number.isSafeInteger(schemaVersion)) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport field $.schemaVersion must be an integer.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(schemaVersion),
        expected: 'integer',
        path: '$.schemaVersion'
      }
    );
  }
  if (schemaVersion !== nativeRootBridgeJsonTransportSchemaVersion) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge JSON transport schema version ${String(
        schemaVersion
      )} is unsupported.`,
      nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
      {
        actual: schemaVersion,
        expected: nativeRootBridgeJsonTransportSchemaVersion
      }
    );
  }
  const requestRecords = readNativeRootBridgeJsonTransportField(
    envelope,
    '$',
    'requestRecords'
  );
  if (!Array.isArray(requestRecords)) {
    throwNativeRootBridgeJsonTransportParserError(
      'Native root bridge JSON transport requestRecords must be an array.',
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(requestRecords),
        expected: 'array',
        path: '$.requestRecords'
      }
    );
  }

  return Object.freeze(
    requestRecords.map((record, index) =>
      normalizeNativeRootBridgeJsonTransportRequestRecord(record, index)
    )
  );
}

function normalizeNativeRootBridgeJsonTransportRequestRecord(record, index) {
  const path = `$.requestRecords[${index}]`;
  assertExactPlainObject(
    record,
    path,
    nativeRootBridgeRustRequestRecordFields
  );

  const environmentId = assertNativeRootBridgeJsonTransportPositiveSafeInteger(
    readNativeRootBridgeJsonTransportField(record, path, 'environment_id'),
    `${path}.environment_id`
  );
  const kind = assertNativeRootBridgeJsonTransportCode(
    readNativeRootBridgeJsonTransportField(record, path, 'kind'),
    `${path}.kind`,
    nativeRootBridgeRequestKinds
  );
  const rootHandle = normalizeNativeRootBridgeJsonTransportHandle(
    readNativeRootBridgeJsonTransportField(record, path, 'root_handle'),
    nativeRootBridgeHandleKindRoot,
    environmentId,
    `${path}.root_handle`
  );
  const valueHandleValue = readNativeRootBridgeJsonTransportField(
    record,
    path,
    'value_handle'
  );
  const valueHandle =
    valueHandleValue === null
      ? null
      : normalizeNativeRootBridgeJsonTransportHandle(
          valueHandleValue,
          nativeRootBridgeHandleKindValue,
          environmentId,
          `${path}.value_handle`
        );

  return Object.freeze({
    requestId: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(record, path, 'request_id'),
      `${path}.request_id`
    ),
    kind,
    environmentId,
    rootHandle,
    rootId: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(record, path, 'root_id'),
      `${path}.root_id`
    ),
    valueHandle,
    rootHandleState: assertNativeRootBridgeJsonTransportCode(
      readNativeRootBridgeJsonTransportField(
        record,
        path,
        'root_handle_state'
      ),
      `${path}.root_handle_state`,
      nativeRootBridgeRootHandleStates
    )
  });
}

function normalizeNativeRootBridgeJsonTransportHandle(
  handle,
  expectedKind,
  expectedEnvironmentId,
  field
) {
  assertExactPlainObject(
    handle,
    field,
    nativeRootBridgeRustHandleFields
  );

  const environmentId = assertNativeRootBridgeJsonTransportPositiveSafeInteger(
    readNativeRootBridgeJsonTransportField(handle, field, 'environment_id'),
    `${field}.environment_id`
  );
  if (environmentId !== expectedEnvironmentId) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge ${field} belongs to environment ${environmentId}, expected ${expectedEnvironmentId}.`,
      nativeRootBridgeValidationErrorCodes.wrongEnvironment,
      { environmentId, expectedEnvironmentId, field }
    );
  }

  const actualKind = assertNativeRootBridgeJsonTransportCode(
    readNativeRootBridgeJsonTransportField(handle, field, 'kind'),
    `${field}.kind`,
    nativeRootBridgeHandleKinds
  );
  if (actualKind !== expectedKind) {
    throwNativeRootBridgeJsonTransportParserError(
      `Native root bridge ${field} has kind ${String(
        actualKind
      )}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      { actual: actualKind, expected: expectedKind, field }
    );
  }

  return Object.freeze({
    environmentId,
    slot: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(handle, field, 'slot'),
      `${field}.slot`
    ),
    generation: assertNativeRootBridgeJsonTransportPositiveSafeInteger(
      readNativeRootBridgeJsonTransportField(handle, field, 'generation'),
      `${field}.generation`
    ),
    kind: expectedKind
  });
}

function assertExactPlainObject(value, path, expectedFields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throwNativeRootBridgeJsonTransportParserError(
      `Expected native root bridge JSON transport object at ${path}.`,
      nativeRootBridgeJsonTransportParseErrorCodes.expectedObject,
      {
        actual: getJsonTransportValueKind(value),
        path
      }
    );
  }

  for (const field of expectedFields) {
    if (!hasOwn(value, field)) {
      throwNativeRootBridgeJsonTransportParserError(
        `Native root bridge JSON transport object at ${path} is missing required field ${field}.`,
        nativeRootBridgeJsonTransportParseErrorCodes.missingField,
        { field, path }
      );
    }
  }

  for (const field of Object.keys(value).sort()) {
    if (!expectedFields.includes(field)) {
      throwNativeRootBridgeJsonTransportParserError(
        `Native root bridge JSON transport object at ${path} has unexpected field ${field}.`,
        nativeRootBridgeJsonTransportParseErrorCodes.unexpectedField,
        { field, path }
      );
    }
  }
}

function readNativeRootBridgeJsonTransportField(object, path, field) {
  if (hasOwn(object, field)) {
    return object[field];
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Native root bridge JSON transport object at ${path} is missing required field ${field}.`,
    nativeRootBridgeJsonTransportParseErrorCodes.missingField,
    { field, path }
  );
}

function assertNativeRootBridgeJsonTransportPositiveSafeInteger(value, path) {
  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Expected native root bridge JSON transport field ${path} to be a positive safe integer.`,
    nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
    {
      actual: getJsonTransportValueKind(value),
      expected: 'positive safe integer',
      path,
      value
    }
  );
}

function assertNativeRootBridgeJsonTransportCode(value, path, codes) {
  if (typeof value !== 'string') {
    throwNativeRootBridgeJsonTransportParserError(
      `Expected native root bridge JSON transport field ${path} to be a string.`,
      nativeRootBridgeJsonTransportParseErrorCodes.invalidFieldType,
      {
        actual: getJsonTransportValueKind(value),
        expected: 'string',
        path
      }
    );
  }

  if (codes.includes(value)) {
    return value;
  }

  throwNativeRootBridgeJsonTransportParserError(
    `Native root bridge JSON transport field ${path} has unsupported value ${value}.`,
    nativeRootBridgeJsonTransportParseErrorCodes.unsupportedFieldValue,
    {
      actual: value,
      expected: 'known code',
      path
    }
  );
}

function getJsonTransportValueKind(value) {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function validateNativeRootBridgeJsonTransportRecords(records) {
  const sequenceState = {
    lastRequestId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false
  };

  return Object.freeze(
    records.map((record, index) =>
      validateNativeRootBridgeRequestShapeRecord(record, sequenceState, index)
    )
  );
}

function createNativeRootBridgeHandleAdmissionTable() {
  return {
    environmentId: null,
    rootHandle: null,
    rootId: null,
    rootRetired: false,
    slots: new Map()
  };
}

function preflightNativeRootBridgeHandleAdmissionRecord(record, table, index) {
  ensureNativeRootBridgeHandleTableEnvironment(
    table,
    record.environmentId,
    index,
    record.requestId
  );

  let rootHandleAdmission = null;
  let valueHandleAdmission = null;
  let retiredRootHandleValidation = null;

  if (record.kind === nativeRootBridgeRequestKindCreate) {
    rootHandleAdmission = admitNativeRootBridgeHandleTableRecord({
      action: 'admit-root-handle',
      expectedKind: nativeRootBridgeHandleKindRoot,
      field: 'rootHandle',
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    if (record.valueHandle !== null) {
      valueHandleAdmission = admitNativeRootBridgeHandleTableRecord({
        action: 'admit-value-handle',
        expectedKind: nativeRootBridgeHandleKindValue,
        field: 'valueHandle',
        handle: record.valueHandle,
        index,
        requestId: record.requestId,
        rootId: null,
        table
      });
    }
  } else if (record.kind === nativeRootBridgeRequestKindRender) {
    rootHandleAdmission = validateActiveNativeRootBridgeHandleTableRecord({
      action: 'validate-active-root-handle',
      expectedKind: nativeRootBridgeHandleKindRoot,
      field: 'rootHandle',
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    if (record.valueHandle !== null) {
      valueHandleAdmission = admitNativeRootBridgeHandleTableRecord({
        action: 'admit-value-handle',
        expectedKind: nativeRootBridgeHandleKindValue,
        field: 'valueHandle',
        handle: record.valueHandle,
        index,
        requestId: record.requestId,
        rootId: null,
        table
      });
    }
  } else {
    rootHandleAdmission = retireNativeRootBridgeRootHandle({
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      rootId: record.rootId,
      table
    });
    retiredRootHandleValidation = validateRetiredNativeRootBridgeRootHandle({
      handle: record.rootHandle,
      index,
      requestId: record.requestId,
      table
    });
  }

  return Object.freeze({
    requestId: record.requestId,
    kind: record.kind,
    environmentId: record.environmentId,
    rootId: record.rootId,
    lifecycleTransition: record.lifecycleTransition,
    rootHandleAdmission,
    valueHandleAdmission,
    retiredRootHandleValidation,
    rustValidationRecord: record.rustValidationRecord
  });
}

function ensureNativeRootBridgeHandleTableEnvironment(
  table,
  environmentId,
  index,
  requestId
) {
  if (table.environmentId === null) {
    table.environmentId = environmentId;
    return;
  }

  if (table.environmentId === environmentId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge request record belongs to environment ${environmentId}, expected environment ${table.environmentId}.`,
    nativeRootBridgeValidationErrorCodes.recordEnvironmentMismatch,
    {
      expectedEnvironmentId: table.environmentId,
      index,
      recordEnvironmentId: environmentId,
      requestId
    }
  );
}

function admitNativeRootBridgeHandleTableRecord({
  action,
  expectedKind,
  field,
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  validateNativeRootBridgeHandleEnvironment(table, handle, field, index, requestId);
  const existing = getNativeRootBridgeHandleTableSlot(table, handle);

  if (existing === null) {
    table.slots.set(handle.slot, {
      generation: handle.generation,
      handle,
      kind: expectedKind,
      rootId,
      state: 'occupied'
    });
    if (expectedKind === nativeRootBridgeHandleKindRoot) {
      table.rootHandle = handle;
      table.rootId = rootId;
    }
    return freezeNativeRootBridgeHandleAdmissionRecord({
      action,
      currentGeneration: handle.generation,
      handle,
      rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
      rootId,
      sourceErrorCode: null
    });
  }

  validateNativeRootBridgeHandleTableSlot({
    expectedKind,
    field,
    handle,
    index,
    requestId,
    slot: existing
  });

  if (
    expectedKind === nativeRootBridgeHandleKindRoot &&
    existing.rootId !== rootId
  ) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request record has root id ${rootId}, expected ${existing.rootId}.`,
      nativeRootBridgeValidationErrorCodes.rootIdMismatch,
      {
        actual: rootId,
        expected: existing.rootId,
        index,
        requestId
      }
    );
  }
  if (
    expectedKind === nativeRootBridgeHandleKindRoot &&
    table.rootHandle === null
  ) {
    table.rootHandle = handle;
    table.rootId = rootId;
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action: action === 'admit-value-handle' ? 'validate-value-handle' : action,
    currentGeneration: existing.generation,
    handle,
    rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
    rootId: existing.rootId,
    sourceErrorCode: null
  });
}

function validateActiveNativeRootBridgeHandleTableRecord({
  action,
  expectedKind,
  field,
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  validateNativeRootBridgeHandleEnvironment(table, handle, field, index, requestId);
  const slot = getNativeRootBridgeHandleTableSlot(table, handle);
  if (slot === null) {
    throwNativeRootBridgeInvalidHandleError(handle, field, index, requestId);
  }

  validateNativeRootBridgeHandleTableSlot({
    expectedKind,
    field,
    handle,
    index,
    requestId,
    slot
  });

  if (expectedKind === nativeRootBridgeHandleKindRoot && slot.rootId !== rootId) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge request record has root id ${rootId}, expected ${slot.rootId}.`,
      nativeRootBridgeValidationErrorCodes.rootIdMismatch,
      {
        actual: rootId,
        expected: slot.rootId,
        index,
        requestId
      }
    );
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action,
    currentGeneration: slot.generation,
    handle,
    rootHandleState: expectedKind === nativeRootBridgeHandleKindRoot ? 'active' : null,
    rootId: slot.rootId,
    sourceErrorCode: null
  });
}

function retireNativeRootBridgeRootHandle({
  handle,
  index,
  requestId,
  rootId,
  table
}) {
  const activeAdmission = validateActiveNativeRootBridgeHandleTableRecord({
    action: 'retire-root-handle',
    expectedKind: nativeRootBridgeHandleKindRoot,
    field: 'rootHandle',
    handle,
    index,
    requestId,
    rootId,
    table
  });
  const nextGeneration = handle.generation + 1;
  if (!Number.isSafeInteger(nextGeneration)) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge root handle slot ${handle.slot} cannot allocate another generation.`,
      nativeRootBridgeRequestShapeErrorCode,
      { index, requestId, slot: handle.slot }
    );
  }

  table.slots.set(handle.slot, {
    kind: nativeRootBridgeHandleKindRoot,
    nextGeneration,
    previousGeneration: handle.generation,
    rootId,
    state: 'vacant'
  });
  table.rootRetired = true;

  return Object.freeze({
    ...activeAdmission,
    currentGeneration: nextGeneration,
    rootHandleState: nativeRootBridgeRootHandleStateRetired
  });
}

function validateRetiredNativeRootBridgeRootHandle({
  handle,
  index,
  requestId,
  table
}) {
  const slot = getNativeRootBridgeHandleTableSlot(table, handle);
  if (slot === null) {
    throwNativeRootBridgeInvalidHandleError(handle, 'rootHandle', index, requestId);
  }

  if (slot.state !== 'vacant') {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge unmount record did not retire root handle slot ${handle.slot}.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStillActive,
      { index, requestId, slot: handle.slot }
    );
  }

  if (slot.nextGeneration === handle.generation) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge retired root handle slot ${handle.slot} still matches the active generation.`,
      nativeRootBridgeValidationErrorCodes.rootHandleStillActive,
      { index, requestId, slot: handle.slot }
    );
  }

  return freezeNativeRootBridgeHandleAdmissionRecord({
    action: 'validate-retired-root-handle',
    currentGeneration: slot.nextGeneration,
    handle,
    rootHandleState: nativeRootBridgeRootHandleStateRetired,
    rootId: slot.rootId,
    sourceErrorCode: nativeRootBridgeValidationErrorCodes.staleHandle
  });
}

function validateNativeRootBridgeHandleEnvironment(
  table,
  handle,
  field,
  index,
  requestId
) {
  if (handle.environmentId === table.environmentId) {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} belongs to environment ${handle.environmentId}, expected ${table.environmentId}.`,
    nativeRootBridgeValidationErrorCodes.wrongEnvironment,
    {
      environmentId: handle.environmentId,
      expectedEnvironmentId: table.environmentId,
      field,
      index,
      requestId
    }
  );
}

function getNativeRootBridgeHandleTableSlot(table, handle) {
  return table.slots.get(handle.slot) ?? null;
}

function validateNativeRootBridgeHandleTableSlot({
  expectedKind,
  field,
  handle,
  index,
  requestId,
  slot
}) {
  if (slot.state === 'vacant') {
    throwNativeRootBridgeStaleHandleError(
      handle,
      slot.nextGeneration,
      field,
      index,
      requestId
    );
  }

  if (handle.generation !== slot.generation) {
    throwNativeRootBridgeStaleHandleError(
      handle,
      slot.generation,
      field,
      index,
      requestId
    );
  }

  if (slot.kind !== expectedKind) {
    throwNativeRootBridgeRequestShapeError(
      `Native root bridge ${field} has kind ${slot.kind}, expected ${expectedKind}.`,
      nativeRootBridgeValidationErrorCodes.wrongHandleKind,
      {
        actual: slot.kind,
        expected: expectedKind,
        field,
        index,
        requestId
      }
    );
  }
}

function throwNativeRootBridgeInvalidHandleError(handle, field, index, requestId) {
  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} slot ${handle.slot} is invalid.`,
    nativeRootBridgeValidationErrorCodes.invalidHandle,
    { field, handle, index, requestId }
  );
}

function throwNativeRootBridgeStaleHandleError(
  handle,
  currentGeneration,
  field,
  index,
  requestId
) {
  throwNativeRootBridgeRequestShapeError(
    `Native root bridge ${field} slot ${handle.slot} generation ${handle.generation} is stale; current generation is ${currentGeneration}.`,
    nativeRootBridgeValidationErrorCodes.staleHandle,
    {
      currentGeneration,
      field,
      handle,
      index,
      requestId
    }
  );
}

function freezeNativeRootBridgeHandleAdmissionRecord({
  action,
  currentGeneration,
  handle,
  rootHandleState,
  rootId,
  sourceErrorCode
}) {
  return Object.freeze({
    action,
    currentGeneration,
    handle,
    rustHandle: toRustNativeRootBridgeHandle(handle),
    rootHandleState,
    rootId,
    sourceErrorCode
  });
}

function assertPlainObject(value, message) {
  if (value && typeof value === 'object') {
    return;
  }

  throwNativeRootBridgeRequestShapeError(
    message,
    nativeRootBridgeRequestShapeErrorCode
  );
}

function assertPositiveSafeInteger(value, field) {
  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }

  throwNativeRootBridgeRequestShapeError(
    `Expected ${field} to be a positive safe integer.`,
    nativeRootBridgeRequestShapeErrorCode,
    { field, value }
  );
}

const admitNativeReactDomRenderHandoffForCanary = Object.freeze(
  function admitNativeReactDomRenderHandoffForCanary(
    createRecord,
    renderHandoff,
    rootWorkLoopFinishedWorkMetadata
  ) {
    assertNativeReactDomRenderHandoffAdmissionHasNoCapabilityClaims(
      createRecord,
      'createRecord'
    );
    const renderNativeRequestRecord =
      getNativeReactDomRenderHandoffNativeRequestRecord(renderHandoff);
    assertNativeReactDomRenderHandoffAdmissionHasNoCapabilityClaims(
      renderNativeRequestRecord,
      'renderHandoff.nativeRequestRecord'
    );
    const requestShapeGate =
      createNativeReactDomRenderHandoffAdmissionShapeGate([
        createRecord,
        renderNativeRequestRecord
      ]);
    const [createValidation, renderValidation] =
      requestShapeGate.validationRecords;

    assertNativeReactDomRenderHandoffRequestKinds(
      createValidation,
      renderValidation
    );
    const metadataSummary =
      validateNativeReactDomRootWorkLoopFinishedWorkMetadata(
        rootWorkLoopFinishedWorkMetadata
      );
    const handoffSummary = validateNativeReactDomRenderHandoffRecord({
      createValidation,
      metadataSummary,
      renderHandoff,
      renderValidation
    });

    return Object.freeze({
      admissionStatus: nativeReactDomRenderHandoffAdmissionStatus,
      operation: 'private-react-dom-render-native-handoff-addon-admission',
      entrypoint: nativeReactDomRenderHandoffExpectedEntrypoint,
      requestShapeGateStatus: requestShapeGate.gateStatus,
      requestCount: requestShapeGate.requestCount,
      requestShapeGate,
      createNativeRequestId: createValidation.requestId,
      createNativeRequestKind: createValidation.kind,
      renderNativeRequestId: renderValidation.requestId,
      renderNativeRequestKind: renderValidation.kind,
      nativeRootId: createValidation.rootId,
      rootId: handoffSummary.rootId,
      rootKind: handoffSummary.rootKind,
      rootTag: handoffSummary.rootTag,
      renderUpdateId: handoffSummary.renderUpdateId,
      handoffId: handoffSummary.handoffId,
      handoffStatus: handoffSummary.handoffStatus,
      nativeHandoffId: handoffSummary.nativeHandoffId,
      nativeHandoffStatus: handoffSummary.nativeHandoffStatus,
      rootWorkLoopFinishedWorkHandoffId:
        handoffSummary.rootWorkLoopFinishedWorkHandoffId,
      rootWorkLoopFinishedWorkStatus:
        handoffSummary.rootWorkLoopFinishedWorkStatus,
      rootWorkLoopFinishedWorkConsumed:
        handoffSummary.rootWorkLoopFinishedWorkConsumed,
      rootWorkLoopPublicRootRenderingBlocked:
        handoffSummary.rootWorkLoopPublicRootRenderingBlocked,
      metadataSource: metadataSummary.source,
      metadataStatus: metadataSummary.status,
      metadataRevision: metadataSummary.metadataRevision,
      metadataRootId: metadataSummary.rootId,
      metadataRenderUpdateId: metadataSummary.renderUpdateId,
      fakeDomMutationObserved: handoffSummary.fakeDomMutationObserved,
      fakeDomOutputPublicCompatibility: false,
      nativeAddonLoaded: false,
      nativeExecution: false,
      rendererExecution: false,
      reconcilerExecution: false,
      publicRootExecution: false,
      browserDomMutation: false,
      addonDomMutation: false,
      publicNativeCompatibility: false,
      publicRootCompatibilitySurface: false,
      publicRootRenderCompatibilityClaimed: false,
      compatibilityClaimed: false,
      compatibilityStatus: 'blocked'
    });
  }
);

function getNativeReactDomRenderHandoffNativeRequestRecord(renderHandoff) {
  assertNativeReactDomAdmissionObject(
    renderHandoff,
    'renderHandoff',
    'Expected a private React DOM render native handoff record.'
  );
  const nativeRequestRecord = getOwnNativeReactDomAdmissionDataField(
    renderHandoff,
    'nativeRequestRecord',
    'renderHandoff.nativeRequestRecord'
  );
  assertNativeReactDomAdmissionObject(
    nativeRequestRecord,
    'renderHandoff.nativeRequestRecord',
    'Private React DOM render native handoff requires a native request record.'
  );
  return nativeRequestRecord;
}

function createNativeReactDomRenderHandoffAdmissionShapeGate(records) {
  try {
    return createNativeRootBridgeRequestShapeGate(records);
  } catch (sourceError) {
    throwNativeReactDomRenderHandoffAdmissionError(
      'Private React DOM render handoff admission rejected the native root bridge request sequence.',
      sourceError?.code || nativeReactDomRenderHandoffAdmissionErrorCode,
      {
        phase: 'native-root-bridge-request-shape',
        sourceCode: sourceError?.code || null,
        sourceName: sourceError?.name || null
      }
    );
  }
}

function assertNativeReactDomRenderHandoffRequestKinds(
  createValidation,
  renderValidation
) {
  if (
    createValidation?.kind === nativeRootBridgeRequestKindCreate &&
    renderValidation?.kind === nativeRootBridgeRequestKindRender
  ) {
    return;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    'Private React DOM render handoff admission requires a create request followed by a render request.',
    nativeReactDomRenderHandoffAdmissionErrorCode,
    {
      createKind: createValidation?.kind ?? null,
      renderKind: renderValidation?.kind ?? null
    }
  );
}

function validateNativeReactDomRootWorkLoopFinishedWorkMetadata(metadata) {
  assertNativeReactDomRenderHandoffAdmissionHasNoCapabilityClaims(
    metadata,
    'rootWorkLoopFinishedWorkMetadata'
  );

  const metadataObject = assertNativeReactDomAdmissionObject(
    metadata,
    'metadata'
  );
  const facade = assertNativeReactDomAdmissionObject(
    getOwnNativeReactDomAdmissionDataField(
      metadataObject,
      'facade',
      'metadata.facade'
    ),
    'metadata.facade'
  );
  const rootId = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      facade,
      'rootId',
      'metadata.facade.rootId'
    ),
    'metadata.facade.rootId'
  );
  const rootTag = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      facade,
      'rootTag',
      'metadata.facade.rootTag'
    ),
    'metadata.facade.rootTag'
  );
  const renderUpdateId = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      facade,
      'renderUpdateId',
      'metadata.facade.renderUpdateId'
    ),
    'metadata.facade.renderUpdateId'
  );

  assertNativeReactDomAdmissionJsonShape(
    metadataObject,
    {
      source: nativeRootWorkLoopFinishedWorkMetadataSource,
      status: nativeRootWorkLoopFinishedWorkMetadataStatus,
      metadataRevision: nativeRootWorkLoopFinishedWorkMetadataRevision,
      facade: {
        rootId,
        rootTag,
        renderUpdateId,
        hostType: 'div',
        hostOutputShape: 'host-component',
        hostComponentCount: 1,
        hostTextCount: 1,
        textContent: 'text'
      },
      completeWork: {
        rootChildTag: 'HostComponent',
        completedChildTag: 'HostComponent',
        hostTextChildTag: 'HostText',
        childTags: ['HostComponent', 'HostText']
      },
      pending: {
        recordsFinishedWork: true,
        pendingWorkMatchesFinishedWork: true,
        renderLanes: 'Default',
        finishedLanes: 'Default',
        remainingLanes: 'NoLanes'
      },
      commit: {
        commitOrderAfterPendingRecord: true,
        consumedFinishedWorkRecord: true,
        finishedWorkAfterCommit: null,
        finishedLanesAfterCommit: 'NoLanes',
        renderPhaseWorkAfterCommit: null,
        mutationExecutionBlocked: true,
        publicRootRenderingBlocked: true,
        effectsRefsAndHydrationBlocked: true
      },
      placement: {
        tag: 'HostComponent',
        applyKind: 'append-placement-to-container',
        siblingStatus: 'append'
      }
    },
    'metadata'
  );

  return Object.freeze({
    source: nativeRootWorkLoopFinishedWorkMetadataSource,
    status: nativeRootWorkLoopFinishedWorkMetadataStatus,
    metadataRevision: nativeRootWorkLoopFinishedWorkMetadataRevision,
    rootId,
    rootTag,
    renderUpdateId
  });
}

function validateNativeReactDomRenderHandoffRecord({
  createValidation,
  metadataSummary,
  renderHandoff,
  renderValidation
}) {
  assertNativeReactDomRenderHandoffAdmissionHasNoCapabilityClaims(
    renderHandoff,
    'renderHandoff',
    nativeReactDomRenderHandoffAdmissionAllowedTrueClaimPaths
  );

  assertNativeReactDomAdmissionStaticFields(renderHandoff, 'renderHandoff', [
    ['$$typeof', nativeReactDomRenderHandoffExpectedType],
    ['kind', nativeReactDomRenderHandoffExpectedKind],
    ['operation', nativeReactDomRenderHandoffExpectedOperation],
    ['entrypoint', nativeReactDomRenderHandoffExpectedEntrypoint],
    ['handoffStatus', nativeReactDomRenderHandoffExpectedStatus],
    ['adapterStatus', nativeReactDomRenderHandoffAdapterReadyStatus],
    [
      'lifecycleRequestAdmissionStatus',
      nativeReactDomRenderHandoffLifecycleAdmissionStatus
    ],
    [
      'lifecycleRequestBoundaryStatus',
      nativeReactDomRenderHandoffLifecycleBoundaryStatus
    ],
    ['lifecycleRequestBoundaryAccepted', true],
    ['lifecycleRequestBoundarySourceOwned', true],
    ['lifecycleRequestBoundaryCurrent', true],
    ['hostOutputHandoffStatus', nativeReactDomRenderHandoffHostOutputStatus],
    [
      'rootWorkLoopFinishedWorkStatus',
      nativeReactDomRenderHandoffRootWorkLoopStatus
    ],
    ['rootWorkLoopFinishedWorkConsumed', true],
    ['rootWorkLoopPublicRootRenderingBlocked', true],
    ['nativeHandoffStatus', nativeReactDomRenderHandoffNativeHandoffStatus],
    ['nativeRequestKind', nativeRootBridgeRequestKindRender],
    ['privateFacadeRoot', true],
    ['facadeOwnershipValidated', true],
    ['rootWorkLoopEvidenceAccepted', true],
    ['fakeDomAdmissionAccepted', true],
    ['nativeRenderRequestMirrored', true],
    ['fakeDomMutation', true],
    ['domMutation', true]
  ]);

  for (const field of [
    'publicCreateRootEnabled',
    'publicHydrateRootEnabled',
    'publicRootCreated',
    'publicRootObjectExposed',
    'publicRootExecution',
    'publicRootCompatibilitySurface',
    'publicRootRenderCompatibilityClaimed',
    'nativeExecution',
    'reconcilerExecution',
    'rootScheduled',
    'browserDomMutation',
    'markerWrites',
    'listenerInstallation',
    'hydration',
    'eventDispatch',
    'refEffects',
    'compatibilityClaimed'
  ]) {
    assertNativeReactDomAdmissionField(
      renderHandoff,
      field,
      false,
      `renderHandoff.${field}`
    );
  }

  assertNativeReactDomAdmissionField(
    renderHandoff.nativeRequestRecord,
    'requestId',
    renderValidation.requestId,
    'renderHandoff.nativeRequestRecord.requestId'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff.nativeRequestRecord,
    'kind',
    nativeRootBridgeRequestKindRender,
    'renderHandoff.nativeRequestRecord.kind'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff,
    'createRequestSequence',
    createValidation.requestId,
    'renderHandoff.createRequestSequence'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff,
    'renderRequestSequence',
    renderValidation.requestId,
    'renderHandoff.renderRequestSequence'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff,
    'rootId',
    metadataSummary.rootId,
    'renderHandoff.rootId'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff,
    'rootTag',
    metadataSummary.rootTag,
    'renderHandoff.rootTag'
  );
  assertNativeReactDomAdmissionField(
    renderHandoff,
    'renderUpdateId',
    metadataSummary.renderUpdateId,
    'renderHandoff.renderUpdateId'
  );

  const rootKind = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      renderHandoff,
      'rootKind',
      'renderHandoff.rootKind'
    ),
    'renderHandoff.rootKind'
  );
  const handoffId = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      renderHandoff,
      'handoffId',
      'renderHandoff.handoffId'
    ),
    'renderHandoff.handoffId'
  );
  const nativeHandoffId = assertNativeReactDomAdmissionNonEmptyString(
    getOwnNativeReactDomAdmissionDataField(
      renderHandoff,
      'nativeHandoffId',
      'renderHandoff.nativeHandoffId'
    ),
    'renderHandoff.nativeHandoffId'
  );
  const rootWorkLoopFinishedWorkHandoffId =
    assertNativeReactDomAdmissionNonEmptyString(
      getOwnNativeReactDomAdmissionDataField(
        renderHandoff,
        'rootWorkLoopFinishedWorkHandoffId',
        'renderHandoff.rootWorkLoopFinishedWorkHandoffId'
      ),
      'renderHandoff.rootWorkLoopFinishedWorkHandoffId'
    );

  return Object.freeze({
    rootId: metadataSummary.rootId,
    rootKind,
    rootTag: metadataSummary.rootTag,
    renderUpdateId: metadataSummary.renderUpdateId,
    handoffId,
    handoffStatus: nativeReactDomRenderHandoffExpectedStatus,
    nativeHandoffId,
    nativeHandoffStatus: nativeReactDomRenderHandoffNativeHandoffStatus,
    rootWorkLoopFinishedWorkHandoffId,
    rootWorkLoopFinishedWorkStatus:
      nativeReactDomRenderHandoffRootWorkLoopStatus,
    rootWorkLoopFinishedWorkConsumed: true,
    rootWorkLoopPublicRootRenderingBlocked: true,
    fakeDomMutationObserved: true
  });
}

function assertNativeReactDomAdmissionObject(value, path, message) {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    message || `Expected ${path} to be an object.`,
    nativeReactDomRenderHandoffAdmissionErrorCode,
    { path, actual: nativeReactDomAdmissionActual(value) }
  );
}

function getOwnNativeReactDomAdmissionDataField(object, field, path) {
  const descriptor = Object.getOwnPropertyDescriptor(object, field);
  if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
    return descriptor.value;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    `Private React DOM render handoff admission requires data field ${path}.`,
    nativeReactDomRenderHandoffAdmissionErrorCode,
    { field, path }
  );
}

function assertNativeReactDomAdmissionJsonShape(actual, expected, path) {
  if (Array.isArray(expected)) {
    assertNativeReactDomAdmissionExactArray(actual, expected, path);
    return;
  }

  if (expected !== null && typeof expected === 'object') {
    const object = assertNativeReactDomAdmissionObject(actual, path);
    const expectedFields = Object.keys(expected).sort();
    const actualFields = Object.getOwnPropertyNames(object).sort();
    const symbolFields = Object.getOwnPropertySymbols(object);
    if (symbolFields.length !== 0 || !arrayEquals(actualFields, expectedFields)) {
      throwNativeReactDomRenderHandoffAdmissionError(
        `Private React DOM render handoff admission expected exact ${path} metadata fields.`,
        nativeReactDomRenderHandoffAdmissionErrorCode,
        {
          path,
          expected: expectedFields,
          actual: actualFields,
          symbolCount: symbolFields.length
        }
      );
    }

    for (const field of expectedFields) {
      assertNativeReactDomAdmissionJsonShape(
        getOwnNativeReactDomAdmissionDataField(
          object,
          field,
          `${path}.${field}`
        ),
        expected[field],
        `${path}.${field}`
      );
    }
    return;
  }

  assertNativeReactDomAdmissionExactValue(actual, expected, path);
}

function assertNativeReactDomAdmissionStaticFields(object, path, expectedPairs) {
  for (const [field, expected] of expectedPairs) {
    const fieldPath = `${path}.${field}`;
    const actual = getOwnNativeReactDomAdmissionDataField(
      object,
      field,
      fieldPath
    );
    if (Array.isArray(expected)) {
      assertNativeReactDomAdmissionExactArray(actual, expected, fieldPath);
    } else {
      assertNativeReactDomAdmissionExactValue(actual, expected, fieldPath);
    }
  }
}

function assertNativeReactDomAdmissionField(object, field, expected, path) {
  const actual = getOwnNativeReactDomAdmissionDataField(object, field, path);
  assertNativeReactDomAdmissionExactValue(actual, expected, path);
  return actual;
}

function assertNativeReactDomAdmissionExactValue(actual, expected, path) {
  if (Object.is(actual, expected)) {
    return actual;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    `Private React DOM render handoff admission expected ${path} to match.`,
    nativeReactDomRenderHandoffAdmissionErrorCode,
    {
      path,
      expected,
      actual: nativeReactDomAdmissionActual(actual)
    }
  );
}

function assertNativeReactDomAdmissionNonEmptyString(value, path) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    `Private React DOM render handoff admission requires ${path}.`,
    nativeReactDomRenderHandoffAdmissionErrorCode,
    { path, actual: nativeReactDomAdmissionActual(value) }
  );
}

function assertNativeReactDomAdmissionExactArray(actual, expected, path) {
  if (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    actual.every((value, index) => Object.is(value, expected[index]))
  ) {
    return actual;
  }

  throwNativeReactDomRenderHandoffAdmissionError(
    `Private React DOM render handoff admission expected ${path} to match.`,
    nativeReactDomRenderHandoffAdmissionErrorCode,
    {
      path,
      expected,
      actual: Array.isArray(actual)
        ? actual.map(nativeReactDomAdmissionActual)
        : nativeReactDomAdmissionActual(actual)
    }
  );
}

function assertNativeReactDomRenderHandoffAdmissionHasNoCapabilityClaims(
  value,
  label,
  allowedTruePaths = Object.freeze([])
) {
  const seen = new WeakSet();

  function visit(candidate, path) {
    if (
      candidate === null ||
      (typeof candidate !== 'object' && typeof candidate !== 'function') ||
      seen.has(candidate)
    ) {
      return;
    }
    seen.add(candidate);

    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (!descriptor) {
        continue;
      }

      const childPath = formatNativeCapabilityClaimPath(path, key);
      const claimField = getNativeCapabilityClaimFieldForKey(
        key,
        nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimFieldSet,
        nativeReactDomRenderHandoffAdmissionBlockedCapabilityClaimNormalizedFieldSet
      );
      if (
        claimField !== null &&
        !allowedTruePaths.includes(childPath) &&
        isNativeCapabilityClaimDescriptorClaimed(descriptor)
      ) {
        const keyMetadata = getNativeCapabilityClaimKeyMetadata(key);
        throwNativeReactDomRenderHandoffAdmissionError(
          'Private React DOM render handoff admission cannot accept public, native, browser DOM, or compatibility claims.',
          nativeReactDomRenderHandoffAdmissionCapabilityClaimErrorCode,
          {
            field: claimField,
            path: childPath,
            label,
            ...keyMetadata
          }
        );
      }

      if (hasOwn(descriptor, 'value')) {
        visit(descriptor.value, childPath);
      }
    }
  }

  visit(value, label);
}

function nativeReactDomAdmissionActual(value) {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value === 'object' || typeof value === 'function'
    ? typeof value
    : value;
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow({
  id,
  role,
  sourceFile =
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceFile,
  sourceFiles = [sourceFile],
  rustIdentifiers,
  jsFactoryFields,
  jsonFieldPaths,
  expectedFactoryValues
}) {
  const normalizedSourceFiles =
    freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceFiles(
      sourceFile,
      sourceFiles
    );

  return Object.freeze({
    id,
    role,
    sourceFile: normalizedSourceFiles[0],
    sourceFiles: normalizedSourceFiles,
    evidenceKind:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessEvidenceKind,
    rustIdentifiers: Object.freeze([...rustIdentifiers]),
    jsFactoryFields: Object.freeze([...jsFactoryFields]),
    jsonFieldPaths: Object.freeze([...jsonFieldPaths]),
    expectedFactoryValues:
      freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(
        expectedFactoryValues
      ),
    sourceOwnedEvidence: true,
    blockedPrivateEvidence: true,
    publicAdmission: false,
    callerShapedEvidence: false,
    proseEvidence: false,
    testTitleEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxOnly: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    childProcessExecution: false,
    httpExecution: false,
    httpsExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityClaimed: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceFiles(
  sourceFile,
  sourceFiles
) {
  const normalizedSourceFiles = [];
  for (const candidate of [sourceFile, ...arrayFromMaybe(sourceFiles)]) {
    if (
      typeof candidate === 'string' &&
      !normalizedSourceFiles.includes(candidate)
    ) {
      normalizedSourceFiles.push(candidate);
    }
  }

  return Object.freeze(normalizedSourceFiles);
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(
  value
) {
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item) =>
        freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(item)
      )
    );
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [
      key,
      freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(item)
    ]);
    return Object.freeze(Object.fromEntries(entries));
  }

  return value;
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger(
  ledger
) {
  Object.defineProperty(ledger, 'validateSourceCurrentnessRows', {
    value:
      validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows,
    enumerable: false,
    configurable: false,
    writable: false
  });

  return Object.freeze(ledger);
}

function createNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger(
  rows
) {
  const normalizedRows =
    enforceNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalSet(
      Array.from(
        rows ?? [],
        validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRow
      )
    );
  const frozenRows = Object.freeze(normalizedRows);
  const acceptedRows = Object.freeze(
    frozenRows.filter(
      (row) =>
        row.status ===
        nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus
    )
  );
  const rejectedRows = Object.freeze(
    frozenRows.filter(
      (row) =>
        row.status ===
        nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedStatus
    )
  );
  const canonicalSourceEvidenceAccepted =
    rejectedRows.length === 0 &&
    hasExactNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalSet(
      acceptedRows
    );

  return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger({
    ledgerStatus:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerStatus,
    model: nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessModel,
    evaluationMode:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessEvaluationMode,
    sourceWorker:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceWorker,
    sourceWorkerProgress:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceWorkerProgress,
    sourceFile:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessSourceFile,
    sourceFiles:
      sourceFilesFromNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows(
        nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows
      ),
    evidenceKind:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessEvidenceKind,
    acceptedStatus:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus,
    rejectedStatus:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedStatus,
    rejectionCodes:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes,
    rejectionCaseIds:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCaseIds,
    sourceCurrentnessRowFields:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRowFields,
    requiredEvidenceIds: Object.freeze(
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows.map(
        (row) => row.id
      )
    ),
    requiredEvidenceRoles: Object.freeze(
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows.map(
        (row) => row.role
      )
    ),
    sourceOwnedEvidenceRequired: true,
    blockedPrivateEvidenceOnly: true,
    publicAdmission: false,
    canonicalSourceEvidenceAccepted,
    acceptedEvidenceCount: acceptedRows.length,
    rejectedEvidenceCount: rejectedRows.length,
    rows: frozenRows,
    rejectedRows,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    childProcessExecution: false,
    httpExecution: false,
    httpsExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityClaimed: false,
    reactBehaviorError: false
  });
}

function validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows(
  rows
) {
  return createNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger(
    rows
  );
}

function validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRow(
  row
) {
  if (
    row?.status ===
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedStatus
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      row.code ??
        nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
          .staleOrForeign
    );
  }

  const claimCode =
    getNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessClaimCode(row);
  if (claimCode !== null) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      claimCode
    );
  }

  if (
    row?.proseEvidence === true ||
    row?.testTitleEvidence === true ||
    row?.errorMessageEvidence === true ||
    row?.evidenceKind === 'prose' ||
    row?.evidenceKind === 'test-title' ||
    row?.evidenceKind === 'error-message'
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .proseEvidence
    );
  }

  if (
    row?.sourceSyntaxOnly === true ||
    row?.evidenceKind === 'source-syntax'
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .sourceSyntaxOnly
    );
  }

  if (
    row?.sourceOwnedEvidence !== true ||
    row?.blockedPrivateEvidence !== true ||
    row?.publicAdmission !== false ||
    row?.callerShapedEvidence === true
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .callerBuilt
    );
  }

  if (
    !Array.isArray(row?.rustIdentifiers) ||
    row.rustIdentifiers.length === 0
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .rustIdentifierMismatch
    );
  }

  const canonicalRow =
    getNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow(row);
  if (canonicalRow === null) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .staleOrForeign
    );
  }

  if (canonicalRow.role !== row.role) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .sourceRoleMismatch
    );
  }

  if (!arrayEquals(row.rustIdentifiers, canonicalRow.rustIdentifiers)) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .rustIdentifierMismatch
    );
  }

  if (
    row.id !== canonicalRow.id ||
    row.sourceFile !== canonicalRow.sourceFile ||
    !arrayEquals(row.sourceFiles, canonicalRow.sourceFiles) ||
    row.evidenceKind !== canonicalRow.evidenceKind ||
    row.code != null ||
    !arrayEquals(row.jsFactoryFields, canonicalRow.jsFactoryFields) ||
    !arrayEquals(row.jsonFieldPaths, canonicalRow.jsonFieldPaths) ||
    !nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValueEquals(
      row.expectedFactoryValues,
      canonicalRow.expectedFactoryValues
    )
  ) {
    return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
      row,
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
        .staleOrForeign
    );
  }

  return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedRow(
    row
  );
}

function getNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessClaimCode(
  row
) {
  if (row === undefined || row === null) {
    return null;
  }

  if (
    row.nativeAddonLoaded === true ||
    row.nativeAddonLoadAttempted === true ||
    row.napiCleanupHookExecution === true ||
    row.cleanupHookPublicExecutionClaimed === true
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .nativeAddonLoadClaim;
  }

  if (
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessPublicClaimFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .publicNativeExecutionClaim;
  }

  if (
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessPackageClaimFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .packageExportClaim;
  }

  if (
    row.nodeWorkerThreadsExecution === true ||
    row.workerThreadCreationAttempted === true ||
    row.childProcessExecution === true ||
    row.httpExecution === true ||
    row.httpsExecution === true ||
    row.networkExecution === true
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .workerOrNetworkExecutionClaim;
  }

  if (
    row.rendererExecution === true ||
    row.reconcilerExecution === true ||
    row.reactBehaviorError === true
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .rendererReconcilerOutputClaim;
  }

  if (
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCompatibilityClaimFields.some(
      (field) => row[field] === true
    )
  ) {
    return nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
      .compatibilityClaim;
  }

  return null;
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedRow(
  row
) {
  return Object.freeze({
    id: row.id,
    role: row.role,
    sourceFile: row.sourceFile,
    sourceFiles: Object.freeze([...row.sourceFiles]),
    evidenceKind: row.evidenceKind,
    rustIdentifiers: Object.freeze([...row.rustIdentifiers]),
    jsFactoryFields: Object.freeze([...row.jsFactoryFields]),
    jsonFieldPaths: Object.freeze([...row.jsonFieldPaths]),
    expectedFactoryValues:
      freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(
        row.expectedFactoryValues
      ),
    status:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus,
    code: null,
    sourceOwnedEvidence: true,
    blockedPrivateEvidence: true,
    publicAdmission: false,
    callerShapedEvidence: false,
    proseEvidence: false,
    testTitleEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxOnly: false,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    childProcessExecution: false,
    httpExecution: false,
    httpsExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityClaimed: false,
    reactBehaviorError: false
  });
}

function freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
  row,
  code
) {
  return Object.freeze({
    id: row?.id ?? null,
    role: row?.role ?? null,
    sourceFile: row?.sourceFile ?? null,
    sourceFiles: Object.freeze([...arrayFromMaybe(row?.sourceFiles)]),
    evidenceKind: row?.evidenceKind ?? null,
    rustIdentifiers: Object.freeze([...arrayFromMaybe(row?.rustIdentifiers)]),
    jsFactoryFields: Object.freeze([...arrayFromMaybe(row?.jsFactoryFields)]),
    jsonFieldPaths: Object.freeze([...arrayFromMaybe(row?.jsonFieldPaths)]),
    expectedFactoryValues:
      freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValue(
        row?.expectedFactoryValues ?? {}
      ),
    status:
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedStatus,
    code,
    sourceOwnedEvidence: row?.sourceOwnedEvidence === true,
    blockedPrivateEvidence: row?.blockedPrivateEvidence === true,
    publicAdmission: false,
    callerShapedEvidence: row?.callerShapedEvidence === true,
    proseEvidence: row?.proseEvidence === true,
    testTitleEvidence: row?.testTitleEvidence === true,
    errorMessageEvidence: row?.errorMessageEvidence === true,
    sourceSyntaxOnly: row?.sourceSyntaxOnly === true,
    nativeAddonLoaded: false,
    nativeExecution: false,
    nodeWorkerThreadsExecution: false,
    childProcessExecution: false,
    httpExecution: false,
    httpsExecution: false,
    rendererExecution: false,
    reconcilerExecution: false,
    publicNativeCompatibility: false,
    packageExportCompatibility: false,
    compatibilityClaimed: false,
    reactBehaviorError: false
  });
}

function enforceNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalSet(
  rows
) {
  if (
    hasExactNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalSet(
      rows
    )
  ) {
    return rows;
  }

  return rows.map((row) => {
    if (
      row.status ===
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus
    ) {
      return freezeNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectedRow(
        row,
        nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRejectionCodes
          .canonicalSetMismatch
      );
    }

    return row;
  });
}

function hasExactNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalSet(
  rows
) {
  if (
    rows.length !==
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows.length
  ) {
    return false;
  }

  for (const canonicalRow of nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows) {
    const matchingRows = rows.filter(
      (row) =>
        row.id === canonicalRow.id &&
        row.role === canonicalRow.role &&
        row.status ===
          nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus
    );

    if (matchingRows.length !== 1) {
      return false;
    }
  }

  return rows.every(
    (row) =>
      row.status ===
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessAcceptedStatus
  );
}

function getNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRow(
  row
) {
  const byId =
    nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows.find(
      (canonicalRow) => canonicalRow.id === row?.id
    ) ?? null;

  if (byId === null) {
    return (
      nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows.find(
        (canonicalRow) =>
          row?.sourceFile === canonicalRow.sourceFile &&
          arrayEquals(row?.sourceFiles, canonicalRow.sourceFiles) &&
          row?.evidenceKind === canonicalRow.evidenceKind &&
          arrayEquals(row?.rustIdentifiers, canonicalRow.rustIdentifiers) &&
          arrayEquals(row?.jsFactoryFields, canonicalRow.jsFactoryFields) &&
          arrayEquals(row?.jsonFieldPaths, canonicalRow.jsonFieldPaths)
      ) ?? null
    );
  }

  return byId;
}

function sourceFilesFromNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows(
  rows
) {
  const sourceFiles = [];
  for (const row of rows) {
    for (const sourceFile of row.sourceFiles) {
      if (!sourceFiles.includes(sourceFile)) {
        sourceFiles.push(sourceFile);
      }
    }
  }

  return Object.freeze(sourceFiles);
}

function nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessValueEquals(
  actual,
  expected
) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function createNativeRootWorkLoopFinishedWorkMetadataForCanary(options) {
  assertNativeRootWorkLoopFinishedWorkMetadataCanaryOptions(options);

  const childTags = Object.freeze(['HostComponent', 'HostText']);
  return Object.freeze({
    source: nativeRootWorkLoopFinishedWorkMetadataSource,
    status: nativeRootWorkLoopFinishedWorkMetadataStatus,
    metadataRevision: nativeRootWorkLoopFinishedWorkMetadataRevision,
    facade: Object.freeze({
      rootId: options.rootId,
      rootTag: options.rootTag,
      renderUpdateId: options.renderUpdateId,
      hostType: 'div',
      hostOutputShape: 'host-component',
      hostComponentCount: 1,
      hostTextCount: 1,
      textContent: 'text'
    }),
    completeWork: Object.freeze({
      rootChildTag: 'HostComponent',
      completedChildTag: 'HostComponent',
      hostTextChildTag: 'HostText',
      childTags
    }),
    pending: Object.freeze({
      recordsFinishedWork: true,
      pendingWorkMatchesFinishedWork: true,
      renderLanes: 'Default',
      finishedLanes: 'Default',
      remainingLanes: 'NoLanes'
    }),
    commit: Object.freeze({
      commitOrderAfterPendingRecord: true,
      consumedFinishedWorkRecord: true,
      finishedWorkAfterCommit: null,
      finishedLanesAfterCommit: 'NoLanes',
      renderPhaseWorkAfterCommit: null,
      mutationExecutionBlocked: true,
      publicRootRenderingBlocked: true,
      effectsRefsAndHydrationBlocked: true
    }),
    placement: Object.freeze({
      tag: 'HostComponent',
      applyKind: 'append-placement-to-container',
      siblingStatus: 'append'
    })
  });
}

Object.defineProperty(
  createNativeRootWorkLoopFinishedWorkMetadataForCanary,
  nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerSymbol,
  {
    value: nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger,
    enumerable: false,
    configurable: false,
    writable: false
  }
);
Object.freeze(createNativeRootWorkLoopFinishedWorkMetadataForCanary);

function assertNativeRootWorkLoopFinishedWorkMetadataCanaryOptions(options) {
  if (!isNativeRootWorkLoopMetadataObjectLike(options)) {
    throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
      'Native root work-loop finished-work metadata factory requires an options object.',
      nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode
    );
  }

  assertNativeRootWorkLoopFinishedWorkMetadataHasNoCapabilityClaims(options);

  for (const field of Object.getOwnPropertyNames(options)) {
    if (
      !nativeRootWorkLoopFinishedWorkMetadataFactoryOptionFields.includes(
        field
      )
    ) {
      throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
        `Native root work-loop finished-work metadata factory does not accept option ${field}.`,
        nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode,
        { field }
      );
    }
  }

  assertNativeRootWorkLoopFinishedWorkMetadataStringOption(
    options.rootId,
    'rootId'
  );
  assertNativeRootWorkLoopFinishedWorkMetadataStringOption(
    options.rootTag,
    'rootTag'
  );
  assertNativeRootWorkLoopFinishedWorkMetadataStringOption(
    options.renderUpdateId,
    'renderUpdateId'
  );

  if (options.hostType !== 'div') {
    throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
      'Native root work-loop finished-work metadata canary only supports hostType "div".',
      nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode,
      { field: 'hostType', value: options.hostType }
    );
  }

  if (options.textContent !== 'text') {
    throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
      'Native root work-loop finished-work metadata canary only supports textContent "text".',
      nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode,
      { field: 'textContent', value: options.textContent }
    );
  }
}

function assertNativeRootWorkLoopFinishedWorkMetadataStringOption(
  value,
  field
) {
  if (typeof value === 'string' && value !== '') {
    return;
  }

  throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
    `Native root work-loop finished-work metadata factory requires ${field}.`,
    nativeRootWorkLoopFinishedWorkMetadataFactoryErrorCode,
    { field, value }
  );
}

function assertNativeRootWorkLoopFinishedWorkMetadataHasNoCapabilityClaims(
  value
) {
  const seen = new WeakSet();

  function visit(candidate, path) {
    if (
      !isNativeRootWorkLoopMetadataObjectLike(candidate) ||
      seen.has(candidate)
    ) {
      return;
    }
    seen.add(candidate);

    for (const key of Reflect.ownKeys(candidate)) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (!descriptor) {
        continue;
      }
      const childPath = formatNativeCapabilityClaimPath(path, key);
      const claimField = getNativeCapabilityClaimFieldForKey(
        key,
        nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimFieldSet,
        nativeRootWorkLoopFinishedWorkMetadataBlockedCapabilityClaimNormalizedFieldSet
      );
      if (
        claimField !== null &&
        isNativeCapabilityClaimDescriptorClaimed(descriptor)
      ) {
        const keyMetadata = getNativeCapabilityClaimKeyMetadata(key);
        throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
          'Native root work-loop finished-work metadata factory cannot accept public, native, DOM, hydration, event, ref, marker, listener, scheduler, Rust, or compatibility capability claims.',
          nativeRootWorkLoopFinishedWorkMetadataFactoryCapabilityClaimErrorCode,
          {
            field: claimField,
            path: childPath,
            ...keyMetadata
          }
        );
      }
      if (hasOwn(descriptor, 'value')) {
        visit(descriptor.value, childPath);
      }
    }
  }

  visit(value, 'options');
}

function isNativeRootWorkLoopMetadataObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function throwNativeRootWorkLoopFinishedWorkMetadataFactoryError(
  message,
  code,
  details = {}
) {
  const error = new Error(message);
  error.name = 'FastReactNativeRootWorkLoopFinishedWorkMetadataFactoryError';
  error.code = code;
  error.details = Object.freeze({ ...details });
  error.nativeAddonLoaded = false;
  error.nativeExecution = false;
  error.rendererExecution = false;
  error.reconcilerExecution = false;
  error.publicNativeCompatibility = false;
  error.compatibilityClaimed = false;
  throw error;
}

function throwNativeReactDomRenderHandoffAdmissionError(
  message,
  code,
  details = {}
) {
  const error = new Error(message);
  error.name = 'FastReactNativeReactDomRenderHandoffAdmissionError';
  error.code = code;
  error.details = Object.freeze({ ...details });
  error.nativeAddonLoaded = false;
  error.nativeExecution = false;
  error.rendererExecution = false;
  error.reconcilerExecution = false;
  error.publicRootExecution = false;
  error.browserDomMutation = false;
  error.publicNativeCompatibility = false;
  error.publicRootCompatibilitySurface = false;
  error.publicRootRenderCompatibilityClaimed = false;
  error.compatibilityClaimed = false;
  throw error;
}

function throwNativeRootBridgeRequestShapeError(message, code, details = {}) {
  const error = new Error(message);
  error.name = 'FastReactNativeRequestShapeError';
  error.code = code;
  error.details = Object.freeze({ ...details });
  error.nativeAddonLoaded = false;
  error.nativeExecution = false;
  error.rendererExecution = false;
  error.reconcilerExecution = false;
  throw error;
}

function throwNativeRootBridgeJsonTransportParserError(
  message,
  code,
  details = {}
) {
  const error = new Error(message);
  error.name = 'FastReactNativeJsonTransportParserError';
  error.code = code;
  error.details = Object.freeze({ ...details });
  error.nativeAddonLoaded = false;
  error.nativeExecution = false;
  error.rendererExecution = false;
  error.reconcilerExecution = false;
  throw error;
}

function detectLinuxLibc() {
  try {
    const report = process.report?.getReport?.();
    return report?.header?.glibcVersionRuntime ? 'gnu' : 'musl';
  } catch {
    return 'musl';
  }
}

function normalizeLinuxLibc(libc) {
  return libc === 'musl' ? 'musl' : 'gnu';
}

function resolveNativeTarget(platform, arch, libc) {
  if (platform === 'darwin' && (arch === 'arm64' || arch === 'x64')) {
    return `darwin-${arch}`;
  }

  if (platform === 'linux' && (arch === 'arm64' || arch === 'x64')) {
    return `linux-${arch}-${normalizeLinuxLibc(libc)}`;
  }

  if (platform === 'win32' && (arch === 'arm64' || arch === 'x64')) {
    return `win32-${arch}-msvc`;
  }

  return null;
}

function getNativeTargetMetadata(nativeTarget) {
  return nativeTarget && hasOwn(nativeTargetsByName, nativeTarget)
    ? nativeTargetsByName[nativeTarget]
    : null;
}

function getNativeBindingLoadPlan(options = {}) {
  const loadOptions = options ?? {};
  const platform = loadOptions.platform ?? process.platform;
  const arch = loadOptions.arch ?? process.arch;
  const libc =
    loadOptions.libc ?? (platform === 'linux' ? detectLinuxLibc() : null);
  const nativeTarget = resolveNativeTarget(platform, arch, libc);
  const nativeTargetMetadata = getNativeTargetMetadata(nativeTarget);
  const platformPackageName =
    nativeTargetMetadata?.optionalPackageName ?? null;
  const nativeFileName = nativeTargetMetadata?.nativeFileName ?? null;
  const candidateSpecifiers = platformPackageName
    ? Object.freeze([
        platformPackageName,
        `${platformPackageName}/${nativeFileName}`
      ])
    : Object.freeze([]);

  return Object.freeze({
    status: bindingStatus,
    packageName,
    nativeAddonName,
    nativeTarget,
    platform,
    arch,
    libc,
    nativeTargetMetadata,
    platformPackageName,
    nativeFileName,
    candidateSpecifiers,
    supportedNativeTargets,
    nodeApiVersionFloor,
    supportedNodeEngineRange,
    platformArtifactPolicy,
    nativeExecution: false,
    unsupportedNativeExecutionCode:
      nativeBoundaryErrorCodeMap.unsupportedNativeExecution,
    reason: 'Fast React native artifacts are intentionally not built or loaded yet.'
  });
}

function formatUnavailableMessage(loadPlan) {
  if (!loadPlan.nativeTarget || !loadPlan.platformPackageName) {
    return [
      '[fast-react] Native binding is not implemented for this platform yet.',
      `package=${packageName}`,
      `platform=${loadPlan.platform}`,
      `arch=${loadPlan.arch}`,
      `supportedTargets=${supportedNativeTargets.join(',')}`
    ].join(' ');
  }

  return [
    '[fast-react] Native binding is not implemented yet.',
    `package=${packageName}`,
    `target=${loadPlan.nativeTarget}`,
    `optionalPackage=${loadPlan.platformPackageName}`,
    `artifact=${loadPlan.nativeFileName}`,
    `napi>=${nodeApiVersionFloor}`
  ].join(' ');
}

class FastReactNativeBindingUnavailableError extends Error {
  constructor(loadPlan = getNativeBindingLoadPlan()) {
    super(formatUnavailableMessage(loadPlan));
    this.name = 'FastReactNativeBindingUnavailableError';
    this.code = unavailableErrorCode;
    this.packageName = packageName;
    this.nativeTarget = loadPlan.nativeTarget;
    this.platformPackageName = loadPlan.platformPackageName;
    this.nativeFileName = loadPlan.nativeFileName;
    this.bindingStatus = bindingStatus;
    this.nodeApiVersionFloor = nodeApiVersionFloor;
    this.supportedNodeEngineRange = supportedNodeEngineRange;
    this.reason = loadPlan.reason;
    this.nativeExecution = loadPlan.nativeExecution;
    this.nativeBoundaryErrorCode = loadPlan.unsupportedNativeExecutionCode;
    this.loadPlan = loadPlan;
  }
}

function loadNativeBinding(options) {
  const loadPlan = getNativeBindingLoadPlan(options);
  throw new FastReactNativeBindingUnavailableError(loadPlan);
}

module.exports = {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  createNativeRootBridgeRequestShapeGate,
  getNativeBindingLoadPlan,
  loadNativeBinding,
  nativeAddonName,
  nativeBindingManifest,
  nativeRootBridgeRequestShape,
  nativeTargetMatrix,
  nodeApiVersionFloor,
  optionalPackagePrefix,
  packageName,
  platformArtifactPolicy,
  platformPackages,
  supportedNativeTargets,
  supportedNodeEngineRange,
  unavailableErrorCode
};

Object.defineProperty(
  module.exports,
  nativeRootWorkLoopFinishedWorkMetadataFactorySymbol,
  {
    value: createNativeRootWorkLoopFinishedWorkMetadataForCanary,
    enumerable: false,
    configurable: false,
    writable: false
  }
);

Object.defineProperty(
  module.exports,
  nativeReactDomRenderHandoffAdmissionSymbol,
  {
    value: admitNativeReactDomRenderHandoffForCanary,
    enumerable: false,
    configurable: false,
    writable: false
  }
);
