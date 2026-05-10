'use strict';

const {
  assertValidContainer,
  describeContainer,
  getOwnerDocument
} = require('./dom-container.js');
const {
  assertMountedHostInstanceToken,
  attachHostInstanceNode,
  commitLatestPropsFromMutationHandoff,
  createEventTargetDispatchPathRecord,
  createEventTargetNormalizationRecord,
  createHostInstanceToken,
  detachHostInstanceSubtree,
  getLatestPropsFromHostInstanceToken,
  getLatestPropsFromNode,
  getRootOwnerFromHostInstanceToken,
  isHostInstanceToken
} = require('./component-tree.js');
const {
  ROOT_MARKER_APPLIED,
  ROOT_MARKER_REVERTED,
  duplicateCreateRootWarning,
  getContainerRoot,
  getCreateRootWarning,
  hasLegacyRootMarker,
  inspectContainerRootMarker,
  isContainerMarkedAsRoot,
  legacyRootWarning,
  markContainerAsRootWithRevertRecord,
  privateRootMarkerMutationRecordType,
  revertContainerRootMarkerMutation
} = require('./root-markers.js');
const {
  HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND,
  UNSUPPORTED_HYDRATION_ROOT_KIND,
  createHydrationBoundaryGate,
  getPrivateHydrationBoundaryRecordPayload,
  isPrivateHydrationBoundaryRecord
} = require('./hydration-boundary-gate.js');
const {
  hasListeningMarker,
  inspectListeningMarker,
  internalEventHandlersKey
} = require('../events/listener-registry.js');
const refCallbackGate = require('./ref-callback-gate.js');
const {
  PORTAL_PREPARE_MOUNT_LISTENER_INTENT_RECORDED,
  ROOT_LISTENERS_REGISTERED,
  ROOT_LISTENERS_REVERTED,
  createPortalPrepareMountListenerIntentRecord:
    createPortalPrepareMountEventListenerIntentRecord,
  describePortalContainerListenerGuard,
  getPrivateRootHostOutputClickDispatchCanaryPayload,
  getPortalPrepareMountListenerIntentPayload,
  isPrivateRootHostOutputClickDispatchCanaryRecord,
  privatePortalPrepareMountListenerIntentRecordType:
    privateEventPortalPrepareMountListenerIntentRecordType,
  privateRootListenerCleanupRecordType,
  privateRootListenerRegistrationRecordType,
  registerRootListenersForPrivateRoot,
  revertRootListenersForPrivateRoot
} = require('../events/root-listeners.js');
const {
  HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND,
  createPortalEventOwnerRootGateRecord:
    createPluginPortalEventOwnerRootGateRecord,
  getDispatchListenerErrorRouteRecordPayload,
  getPortalEventOwnerRootGateRecordPayload:
    getPluginPortalEventOwnerRootGateRecordPayload,
  isDispatchListenerErrorRouteRecord,
  isPortalEventOwnerRootGateRecord:
    isPluginPortalEventOwnerRootGateRecord
} = require('../events/plugin-event-system.js');
const {
  appendChild,
  appendChildToContainer,
  appendInitialChild,
  clearContainerForRootUnmount,
  commitDomPropertyUpdateForLatestProps,
  createDomHostElementInstance,
  createDomHostTextInstance,
  getClearContainerForRootUnmountRecordPayload,
  getDomPropertyUpdateLatestPropsHandoffPayload,
  removeChild,
  removeChildFromContainer,
  commitTextUpdate,
  rollbackDomPropertyUpdateLatestPropsHandoff
} = require('../dom-host/mutation.js');
const {
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_REMOVE_PROPERTY,
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_ATTRIBUTE,
  ENTRY_SET_PROPERTY,
  ENTRY_SET_STYLE
} = require('../dom-host/property-payload.js');
const {
  REACT_PORTAL_TYPE,
  reactDomPortalImplementation
} = require('../shared/create-portal.js');

const CLIENT_ROOT_KIND = 'client';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';

const privateRootOwnerType = 'fast.react_dom.private_root_owner';
const privateRootHandleType = 'fast.react_dom.private_root_handle';
const privateRootCreateRecordType = 'fast.react_dom.private_root_create_record';
const privateRootHydrateRecordType =
  'fast.react_dom.private_root_hydrate_record';
const privateRootUpdateRecordType = 'fast.react_dom.private_root_update_record';
const privateRootAdmissionRecordType =
  'fast.react_dom.private_root_admission_record';
const privateRootCreateRenderAdmissionRecordType =
  'fast.react_dom.private_root_create_render_admission_record';
const privateRootNativeHandoffRecordType =
  'fast.react_dom.private_root_native_handoff_record';
const privateRootNativeBridgeHandleType =
  'fast.react_dom.private_root_native_bridge_handle';
const privateRootCreateSideEffectRecordType =
  'fast.react_dom.private_root_create_side_effect_record';
const privateRootCreateSideEffectCleanupRecordType =
  'fast.react_dom.private_root_create_side_effect_cleanup_record';
const privateRootInitialHostOutputHandoffRecordType =
  'fast.react_dom.private_root_initial_host_output_handoff_record';
const privateRootInitialHostOutputCleanupRecordType =
  'fast.react_dom.private_root_initial_host_output_cleanup_record';
const privateRootPortalBoundaryRecordType =
  'fast.react_dom.private_root_portal_boundary_record';
const privateRootPortalPrepareMountListenerIntentRecordType =
  'fast.react_dom.private_root_portal_prepare_mount_listener_intent_record';
const privateRootPortalCommitHandoffRecordType =
  'fast.react_dom.private_root_portal_commit_handoff_record';
const privateRootUnmountHostOutputCleanupRecordType =
  'fast.react_dom.private_root_unmount_host_output_cleanup_record';
const privateRootPortalFakeDomMountRecordType =
  'fast.react_dom.private_root_portal_fake_dom_mount_record';
const privateRootPortalChildReconciliationDiagnosticRecordType =
  'fast.react_dom.private_root_portal_child_reconciliation_diagnostic_record';
const privateRootPortalEventOwnerRootGateRecordType =
  'fast.react_dom.private_root_portal_event_owner_root_gate_record';
const privateRootHostOutputUpdateHandoffRecordType =
  'fast.react_dom.private_root_host_output_update_handoff_record';
const privateRootCommitHostComponentUpdateHandoffRecordType =
  'fast.react_dom.private_root_commit_host_component_update_handoff_record';
const privateRootCommitRefMetadataRecordType =
  'fast.react_dom.private_root_commit_ref_metadata_record';
const privateRootRefCallbackHostOutputOrderingDiagnosticRecordType =
  'fast.react_dom.private_root_ref_callback_host_output_ordering_diagnostic_record';
const privateRootRefCallbackErrorRoutingRecordType =
  'fast.react_dom.private_root_ref_callback_error_routing_record';
const privateRootEventListenerErrorRoutingRecordType =
  'fast.react_dom.private_root_event_listener_error_routing_record';
const privateRootHydrationReplayErrorMetadataRecordType =
  'fast.react_dom.private_root_hydration_replay_error_metadata_record';
const privateRootPublicFacadeAdapterType =
  'fast.react_dom.private_root_public_facade_adapter';
const privateRootPublicFacadeRootType =
  'fast.react_dom.private_root_public_facade_root';
const privateRootPublicFacadePreflightType =
  'fast.react_dom.private_root_public_facade_preflight';
const privateRootPublicFacadePreflightRootType =
  'fast.react_dom.private_root_public_facade_preflight_root';
const privateRootPublicFacadePreflightRecordType =
  'fast.react_dom.private_root_public_facade_preflight_record';
const privateRootPublicFacadeMarkerListenerPreflightRecordType =
  'fast.react_dom.private_root_public_facade_marker_listener_preflight_record';
const privateRootPublicFacadeHostOutputRenderRecordType =
  'fast.react_dom.private_root_public_facade_host_output_render_record';
const privateRootPublicFacadeHostOutputUpdateRecordType =
  'fast.react_dom.private_root_public_facade_host_output_update_record';
const privateRootPublicFacadeHostOutputUnmountCleanupRecordType =
  'fast.react_dom.private_root_public_facade_host_output_unmount_cleanup_record';
const privateRootPublicFacadeAdapterSymbol = Symbol.for(
  'fast.react_dom.client.private_root_public_facade_adapter'
);
const privateRootPublicFacadePreflightSymbol = Symbol.for(
  'fast.react_dom.client.private_root_public_facade_preflight'
);

const ROOT_LIFECYCLE_CREATED = 'created';
const ROOT_LIFECYCLE_RENDERED = 'rendered';
const ROOT_LIFECYCLE_UNMOUNTED = 'unmounted';
const ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION = 'unsupported-hydration';

const ROOT_BRIDGE_REQUEST_ADMITTED =
  'admitted-private-root-bridge-request-record';
const ROOT_BRIDGE_EXECUTION_BLOCKED = 'blocked-private-root-bridge-execution';
const ROOT_BRIDGE_COMPATIBILITY_BLOCKED =
  'blocked-private-root-bridge-compatibility';
const ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED =
  'mirrored-private-native-root-request-record';
const ROOT_BRIDGE_MARK_LISTEN_APPLIED =
  'applied-private-root-create-mark-listen-gate';
const ROOT_BRIDGE_MARK_LISTEN_REVERTED =
  'reverted-private-root-create-mark-listen-gate';
const ROOT_BRIDGE_CREATE_RENDER_ADMITTED =
  'admitted-private-root-create-render-path';
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED =
  'applied-private-root-initial-host-output';
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED =
  'cleaned-private-root-initial-host-output';
const ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED =
  'admitted-private-root-portal-boundary-record';
const ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED =
  'blocked-private-root-portal-diagnostic';
const ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_INTENT_ADMITTED =
  'admitted-private-root-portal-prepare-mount-listener-intent';
const ROOT_BRIDGE_PORTAL_LISTENER_INSTALLATION_BLOCKED =
  'blocked-private-root-portal-listener-installation';
const ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED =
  'admitted-private-root-portal-fake-dom-commit-handoff';
const ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED =
  'blocked-private-root-portal-fake-dom-commit-apply';
const ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED =
  'validated-private-root-portal-container-ownership';
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED =
  'cleaned-private-root-unmount-host-output';
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED =
  'applied-private-root-portal-fake-dom-mount-diagnostic';
const ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED =
  'blocked-public-root-portal-mounting';
const ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ADMITTED =
  'admitted-private-root-portal-child-reconciliation-diagnostic';
const ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED =
  'recorded-private-root-portal-event-owner-root-gate';
const ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED =
  'blocked-private-root-portal-event-bubbling';
const ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED =
  'applied-private-root-host-output-update';
const ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED =
  'applied-private-root-commit-host-component-update';
const ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED =
  'accepted-private-root-commit-ref-metadata';
const ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED =
  'admitted-private-root-ref-callback-host-output-ordering-diagnostic';
const ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_RECORDED =
  'recorded-private-root-ref-callback-error-routing';
const ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_RECORDED =
  'recorded-private-root-event-listener-error-routing';
const ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_RECORDED =
  'recorded-private-root-hydration-replay-error-metadata';
const ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED =
  'accepted-private-root-error-option-callback-record';
const ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY =
  'ready-private-react-dom-client-root-public-facade-adapter';
const ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY =
  'ready-private-react-dom-client-root-public-facade-preflight';
const ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED =
  'accepted-private-react-dom-client-root-public-facade-preflight';
const ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED =
  'preflighted-private-root-public-facade-marker-listener-gate';
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED =
  'applied-private-root-public-facade-host-output-render-diagnostic';
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED =
  'applied-private-root-public-facade-host-output-update-diagnostic';
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED =
  'cleaned-private-root-public-facade-host-output-unmount-cleanup-diagnostic';
const NATIVE_ROOT_BRIDGE_REQUEST_CREATE = 'create';
const NATIVE_ROOT_BRIDGE_REQUEST_RENDER = 'render';
const NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT = 'unmount';
const NATIVE_ROOT_BRIDGE_HANDLE_ROOT = 'root';
const NATIVE_ROOT_BRIDGE_HANDLE_VALUE = 'value';
const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE = 'active';
const NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED = 'retired';
const NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID = 1;
const ROOT_BRIDGE_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler create/update/unmount execution is admitted.'
  }),
  freezeRecord({
    id: 'dom-mutation',
    blocked: true,
    reason: 'No container children, text, attributes, or HTML may be mutated.'
  }),
  freezeRecord({
    id: 'marker-writes',
    blocked: true,
    reason: 'Root marker writes and clears remain deferred.'
  }),
  freezeRecord({
    id: 'listener-installation',
    blocked: true,
    reason: 'Root listener installation remains deferred.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'private-root-bridge-request-admission',
      accepted: true,
      reason:
        'The public-shaped private facade call produced a bridge-owned request admission record.'
    }),
    freezeRecord({
      id: 'private-native-request-handoff-mirror',
      accepted: true,
      reason:
        'The public-shaped private facade call produced an inert native request handoff mirror.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The preflight is private and does not execute public react-dom/client roots.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason: 'No reconciler render, schedule, or commit execution is admitted.'
    }),
    freezeRecord({
      id: 'dom-mutation',
      blocked: true,
      reason: 'No real or fake DOM mutation is performed by this preflight.'
    }),
    freezeRecord({
      id: 'marker-writes',
      blocked: true,
      reason: 'Root marker writes and clears remain deferred.'
    }),
    freezeRecord({
      id: 'listener-installation',
      blocked: true,
      reason: 'Root listener installation remains deferred.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason: 'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'events',
      blocked: true,
      reason: 'Synthetic event extraction and dispatch are not admitted.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM root lifecycle compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-child-reconciliation',
    blocked: true,
    reason: 'Portal child reconciliation is not admitted.'
  }),
  freezeRecord({
    id: 'portal-container-mounting',
    blocked: true,
    reason: 'Portal container mounting and preparePortalMount are not admitted.'
  }),
  freezeRecord({
    id: 'portal-container-listeners',
    blocked: true,
    reason: 'Portal container listener installation is deferred.'
  }),
  ...ROOT_BRIDGE_BLOCKED_CAPABILITIES
]);
const ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-accepted-boundary',
      accepted: true,
      reason:
        'The listener-intent gate consumed an accepted private portal boundary record.'
    }),
    freezeRecord({
      id: 'portal-prepare-mount-listener-intent',
      accepted: true,
      reason:
        'The gate recorded the preparePortalMount listener intent for the portal container without installing listeners.'
    }),
    freezeRecord({
      id: 'portal-listen-to-all-supported-events-plan',
      accepted: true,
      reason:
        'The event layer derived the listenToAllSupportedEvents registration plan without mutating listener state.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-public-container-mounting',
      blocked: true,
      reason: 'Public React DOM portal mounting remains blocked.'
    }),
    freezeRecord({
      id: 'portal-listener-installation',
      blocked: true,
      reason:
        'The listener-intent gate records listener work but does not call listenToAllSupportedEvents.'
    }),
    freezeRecord({
      id: 'portal-event-dispatch',
      blocked: true,
      reason:
        'Synthetic event extraction, dispatch, and listener invocation remain blocked.'
    }),
    freezeRecord({
      id: 'portal-child-reconciliation',
      blocked: true,
      reason: 'Portal child reconciliation is not admitted by this gate.'
    }),
    freezeRecord({
      id: 'portal-container-replacement',
      blocked: true,
      reason:
        'Replacing portal container children is not admitted by this gate.'
    }),
    freezeRecord({
      id: 'portal-resource-side-effects',
      blocked: true,
      reason:
        'Document resource, form, and controlled input side effects remain blocked.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No reconciler portal complete-work or commit execution is admitted.'
    }),
    freezeRecord({
      id: 'dom-mutation',
      blocked: true,
      reason: 'No portal container children, text, attributes, or HTML may be mutated.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM portal compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler render, schedule, or commit execution is admitted.'
  }),
  freezeRecord({
    id: 'dom-mutation',
    blocked: true,
    reason: 'No container children, text, attributes, or HTML may be mutated.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'create-root-marker-write',
    accepted: true,
    reason:
      'The private createRoot marker mutation record was produced by the explicit mark/listen gate.'
  }),
  freezeRecord({
    id: 'root-listener-installation',
    accepted: true,
    reason:
      'The private root listener registration record was produced by the explicit mark/listen gate.'
  })
]);
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'create-render-admission',
    accepted: true,
    reason:
      'The private create/render admission record validated root marker and listener prerequisites.'
  }),
  freezeRecord({
    id: 'fake-dom-host-component',
    accepted: true,
    reason:
      'A single fake-DOM HostComponent instance was created through the private DOM host adapter.'
  }),
  freezeRecord({
    id: 'fake-dom-host-text',
    accepted: true,
    reason:
      'A single fake-DOM HostText child was created through the private DOM host adapter.'
  }),
  freezeRecord({
    id: 'component-tree-host-instance-map',
    accepted: true,
    reason:
      'HostComponent and HostText fake nodes were attached to private component-tree host instance tokens.'
  }),
  freezeRecord({
    id: 'latest-props-publication',
    accepted: true,
    reason:
      'Latest props were published only after the private mutation handoff was accepted.'
  })
]);
const ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-object',
    blocked: true,
    reason: 'No public React DOM root object is created or exposed.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No reconciler render, schedule, complete-work, or commit traversal is admitted.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root lifecycle compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-fake-dom-commit-apply',
    blocked: true,
    reason:
      'Portal fake-DOM container replacement is not admitted by this handoff.'
  }),
  freezeRecord({
    id: 'portal-prepare-mount-listeners',
    blocked: true,
    reason:
      'preparePortalMount and portal listener installation remain blocked.'
  }),
  freezeRecord({
    id: 'portal-resource-side-effects',
    blocked: true,
    reason:
      'Document resource, form, and controlled input side effects remain blocked.'
  }),
  ...ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES
]);
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'fake-dom-clear-container',
    accepted: true,
    reason: 'The private unmount cleanup cleared fake-DOM root children.'
  }),
  freezeRecord({
    id: 'component-tree-metadata-detach',
    accepted: true,
    reason:
      'The private unmount cleanup detached component-tree host metadata from removed fake-DOM subtrees.'
  }),
  freezeRecord({
    id: 'root-marker-listener-revert',
    accepted: true,
    reason:
      'The private unmount cleanup reused the root marker/listener side-effect reverter.'
  })
]);
const ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-unmount',
    blocked: true,
    reason: 'Public react-dom root unmount behavior remains unimplemented.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust unmount execution is admitted by this cleanup.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler deletion, ref, passive, or effect traversal runs.'
  }),
  freezeRecord({
    id: 'browser-dom-compatibility',
    blocked: true,
    reason: 'Only fake-DOM containers are admitted by this private cleanup.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root unmount compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-explicit-host-component-mount',
    accepted: true,
    reason:
      'A caller-provided HostComponent child was mounted into a fake-DOM portal container for diagnostics only.'
  }),
  freezeRecord({
    id: 'portal-explicit-host-text-mount',
    accepted: true,
    reason:
      'A caller-provided HostText child was mounted under the fake-DOM HostComponent diagnostic child.'
  }),
  freezeRecord({
    id: 'portal-component-tree-host-instance-map',
    accepted: true,
    reason:
      'The fake-DOM portal HostComponent and HostText were attached to private component-tree host instance tokens.'
  })
]);
const ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'portal-public-container-mounting',
    blocked: true,
    reason: 'Public React DOM portal mounting remains blocked.'
  }),
  freezeRecord({
    id: 'portal-child-reconciliation',
    blocked: true,
    reason:
      'Portal child reconciliation is not admitted; only the explicit diagnostic child may be mounted.'
  }),
  freezeRecord({
    id: 'portal-container-replacement',
    blocked: true,
    reason:
      'Replacing portal container children is not admitted by this diagnostic.'
  }),
  freezeRecord({
    id: 'portal-prepare-mount-listeners',
    blocked: true,
    reason:
      'preparePortalMount and portal listener installation remain blocked.'
  }),
  freezeRecord({
    id: 'portal-resource-side-effects',
    blocked: true,
    reason:
      'Document resource, form, and controlled input side effects remain blocked.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No reconciler portal traversal or generic commit execution is admitted.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason:
      'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM portal compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-accepted-boundary',
      accepted: true,
      reason:
        'The diagnostic consumed a later accepted private portal boundary for the same root and portal container.'
    }),
    freezeRecord({
      id: 'portal-fake-dom-host-component-update',
      accepted: true,
      reason:
        'Exactly one mounted fake-DOM portal HostComponent received an admitted private property update.'
    }),
    freezeRecord({
      id: 'portal-fake-dom-host-text-update',
      accepted: true,
      reason:
        'Exactly one mounted fake-DOM portal HostText child received the matching text update.'
    }),
    freezeRecord({
      id: 'portal-latest-props-after-mutation',
      accepted: true,
      reason:
        'Latest props for the portal HostComponent were published only after property and text mutation completed.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-public-container-mounting',
      blocked: true,
      reason: 'Public React DOM portal mounting remains blocked.'
    }),
    freezeRecord({
      id: 'portal-generic-child-reconciliation',
      blocked: true,
      reason:
        'Arrays, replacements, insertions, deletions, nested children, and arbitrary portal reconciliation remain blocked.'
    }),
    freezeRecord({
      id: 'portal-container-replacement',
      blocked: true,
      reason:
        'Replacing portal container children is not admitted by this diagnostic.'
    }),
    freezeRecord({
      id: 'portal-prepare-mount-listeners',
      blocked: true,
      reason:
        'preparePortalMount and portal listener installation remain blocked.'
    }),
    freezeRecord({
      id: 'portal-resource-side-effects',
      blocked: true,
      reason:
        'Document resource, form, and controlled input side effects remain blocked.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No generic reconciler traversal, scheduling, placement, deletion, or commit execution is admitted.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'events',
      blocked: true,
      reason: 'Synthetic event extraction and dispatch are not admitted.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM portal compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-mounted-child-owner-root',
      accepted: true,
      reason:
        'The mounted private portal HostComponent and HostText tokens belong to the owner root.'
    }),
    freezeRecord({
      id: 'portal-event-target-dispatch-path',
      accepted: true,
      reason:
        'The event layer recorded a component-tree dispatch path for the portal child without dispatching an event.'
    }),
    freezeRecord({
      id: 'portal-event-owner-root-diagnostic',
      accepted: true,
      reason:
        'The gate linked the portal event target path to the owner root for diagnostics only.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-portal-event-bubbling',
      blocked: true,
      reason: 'Public React DOM portal event bubbling remains blocked.'
    }),
    freezeRecord({
      id: 'portal-event-dispatch',
      blocked: true,
      reason:
        'Synthetic event extraction, dispatch, and listener invocation remain blocked.'
    }),
    freezeRecord({
      id: 'portal-listener-installation',
      blocked: true,
      reason:
        'The owner-root gate does not install or invoke portal container listeners.'
    }),
    freezeRecord({
      id: 'browser-dom-compatibility',
      blocked: true,
      reason:
        'The diagnostic uses fake-DOM component-tree metadata and makes no browser DOM bubbling claim.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No reconciler portal traversal, scheduling, or commit execution is admitted.'
    }),
    freezeRecord({
      id: 'dom-mutation',
      blocked: true,
      reason: 'The owner-root gate records existing metadata only.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM portal event compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'fake-dom-property-update',
    accepted: true,
    reason:
      'The private DOM property payload helper mutated admitted attribute, property, or style rows on the attached fake HostComponent.'
  }),
  freezeRecord({
    id: 'property-payload-evidence',
    accepted: true,
    reason:
      'The update handoff carries sanitized property-payload row counts without exposing raw props or fake-DOM nodes.'
  }),
  freezeRecord({
    id: 'fake-dom-text-update',
    accepted: true,
    reason:
      'The private DOM HostText update helper mutated the attached text node.'
  }),
  freezeRecord({
    id: 'latest-props-after-mutation',
    accepted: true,
    reason:
      'The component-tree latest-props map was published only after admitted property mutation and any requested text mutation completed.'
  })
]);
const ROOT_BRIDGE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'No generic reconciler render, schedule, or commit traversal is admitted.'
  }),
  freezeRecord({
    id: 'browser-dom-compatibility',
    blocked: true,
    reason:
      'Only deterministic fake-DOM host nodes are admitted by this private handoff.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason: 'Hydration markers and replay are not admitted by this handoff.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction and dispatch are not admitted.'
  }),
  freezeRecord({
    id: 'refs',
    blocked: true,
    reason: 'Ref attach/detach ordering is not admitted by this handoff.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM root update compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'host-text-update',
      blocked: true,
      reason:
        'HostText root commit updates remain outside this HostComponent handoff.'
    }),
    ...ROOT_BRIDGE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES
  ]);
const ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-execution',
    blocked: true,
    reason:
      'The diagnostic consumes private bridge records and does not execute public React DOM roots.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason:
      'The diagnostic validates request metadata without running the reconciler.'
  }),
  freezeRecord({
    id: 'dom-mutation-through-public-root',
    blocked: true,
    reason:
      'Host-output evidence is private fake-DOM canary data, not public root DOM mutation.'
  }),
  freezeRecord({
    id: 'object-ref-mutation',
    blocked: true,
    reason:
      'Object ref writes remain outside this callback-ref ordering diagnostic.'
  }),
  freezeRecord({
    id: 'root-error-propagation',
    blocked: true,
    reason:
      'Ref callback errors are captured by the private gate and are not routed to root error callbacks.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason:
      'React DOM ref compatibility is not claimed by this private diagnostic.'
  })
]);
const ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-execution',
    blocked: true,
    reason:
      'The accepted ref metadata is associated with private root request records only.'
  }),
  freezeRecord({
    id: 'callback-ref-invocation',
    blocked: true,
    reason:
      'Root commit ref metadata admission does not invoke callback refs.'
  }),
  freezeRecord({
    id: 'object-ref-mutation',
    blocked: true,
    reason:
      'Object ref writes remain blocked at the root commit metadata boundary.'
  }),
  freezeRecord({
    id: 'root-error-propagation',
    blocked: true,
    reason:
      'Ref callback errors are not routed by root commit metadata admission.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason:
      'React DOM ref compatibility is not claimed by private metadata admission.'
  })
]);
const ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The routing record consumes private bridge metadata and does not execute public React DOM roots.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'The routing record validates request metadata without running the reconciler.'
    }),
    freezeRecord({
      id: 'root-error-update-scheduling',
      blocked: true,
      reason:
        'Captured ref callback errors are not scheduled as root error updates by this private record.'
    }),
    freezeRecord({
      id: 'public-root-error-callback-invocation',
      blocked: true,
      reason:
        'Root onUncaughtError, onCaughtError, and onRecoverableError callbacks are preserved as metadata only.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason:
        'React DOM ref error propagation compatibility is not claimed by this private record.'
    })
  ]);
const ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'private-listener-error-route',
      accepted: true,
      reason:
        'The diagnostic consumes listener error route records captured by the private dispatch-queue canary.'
    }),
    freezeRecord({
      id: 'root-error-option-callback-metadata',
      accepted: true,
      reason:
        'Root onUncaughtError, onCaughtError, and onRecoverableError options are preserved as metadata-only callback records.'
    })
  ]);
const ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The routing record consumes private bridge metadata and does not execute public React DOM roots.'
    }),
    freezeRecord({
      id: 'browser-dom-event-dispatch',
      blocked: true,
      reason:
        'The listener error came from a private fake-DOM canary, not from browser DOM event dispatch.'
    }),
    freezeRecord({
      id: 'report-global-error',
      blocked: true,
      reason:
        'The diagnostic records reportGlobalError routing metadata without reporting globally.'
    }),
    freezeRecord({
      id: 'root-error-update-scheduling',
      blocked: true,
      reason:
        'Captured event listener errors are not scheduled as root error updates by this private record.'
    }),
    freezeRecord({
      id: 'public-root-error-callback-invocation',
      blocked: true,
      reason:
        'Root onUncaughtError, onCaughtError, and onRecoverableError callbacks are preserved as metadata only.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason:
        'React DOM event error or root error callback compatibility is not claimed by this private record.'
      })
    ]);
const ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'portal-owner-root-event-path-metadata',
      accepted: true,
      reason:
        'The routing record is linked to an accepted private portal owner-root event path gate.'
    }),
    freezeRecord({
      id: 'portal-listener-error-route-correlation',
      accepted: true,
      reason:
        'The listener error route target is validated against the accepted portal event target metadata.'
    })
  ]);
const ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-portal-event-bubbling',
      blocked: true,
      reason:
        'The diagnostic links portal event metadata without enabling public portal event bubbling.'
    }),
    freezeRecord({
      id: 'portal-container-listener-dispatch',
      blocked: true,
      reason:
        'The diagnostic does not install portal container listeners or replay browser dispatch.'
    }),
    freezeRecord({
      id: 'portal-synthetic-event-dispatch',
      blocked: true,
      reason:
        'Portal SyntheticEvent creation, propagation, and listener dispatch remain blocked.'
    })
  ]);
const ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'hydration-replay-ownership-order-metadata',
      accepted: true,
      reason:
        'The diagnostic consumes retained dehydrated root and boundary ownership rows from the private hydration replay drain-order gate.'
    }),
    freezeRecord({
      id: 'root-error-option-callback-metadata',
      accepted: true,
      reason:
        'Hydrate root onUncaughtError, onCaughtError, and onRecoverableError options are preserved as metadata-only callback records.'
    })
  ]);
const ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-hydrate-root-execution',
      blocked: true,
      reason:
        'The metadata record consumes private hydrateRoot bridge records and does not execute public hydration roots.'
    }),
    freezeRecord({
      id: 'browser-dom-event-replay',
      blocked: true,
      reason:
        'The replay targets come from private dispatch records; no browser DOM events are replayed.'
    }),
    freezeRecord({
      id: 'hydration-compatibility',
      blocked: true,
      reason:
        'Hydratable instances, Suspense hydration, and compatibility claims remain blocked.'
    }),
    freezeRecord({
      id: 'root-error-update-scheduling',
      blocked: true,
      reason:
        'Hydration replay error metadata is not scheduled as root error updates by this private record.'
    }),
    freezeRecord({
      id: 'public-root-error-callback-invocation',
      blocked: true,
      reason:
        'Root onUncaughtError, onCaughtError, and onRecoverableError callbacks are preserved as metadata only.'
    }),
    freezeRecord({
      id: 'report-global-error',
      blocked: true,
      reason:
        'The diagnostic records metadata without reporting errors globally.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason:
        'React DOM hydration replay and root error callback compatibility are not claimed by this private record.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHT_ACCEPTED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-facade-create-root-record',
    accepted: true,
    reason:
      'The preflight starts from the symbol-only public-facade adapter createRoot record.'
  }),
  freezeRecord({
    id: 'root-marker-setup-cleanup',
    accepted: true,
    reason:
      'The reversible private root marker gate was applied and then cleaned up.'
  }),
  freezeRecord({
    id: 'root-listener-setup-cleanup',
    accepted: true,
    reason:
      'The reversible private root listener gate was applied and then cleaned up.'
  })
]);
const ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHT_BLOCKED_CAPABILITIES = freezeArray([
  freezeRecord({
    id: 'public-root-execution',
    blocked: true,
    reason:
      'The preflight never calls public React DOM createRoot, render, or unmount behavior.'
  }),
  freezeRecord({
    id: 'native-execution',
    blocked: true,
    reason: 'No native or Rust root bridge execution is admitted.'
  }),
  freezeRecord({
    id: 'reconciler-execution',
    blocked: true,
    reason: 'No reconciler scheduling, render, or commit execution is admitted.'
  }),
  freezeRecord({
    id: 'dom-mutation',
    blocked: true,
    reason:
      'The preflight installs and removes listener shells but does not mutate host children, text, attributes, or HTML.'
  }),
  freezeRecord({
    id: 'hydration',
    blocked: true,
    reason: 'Hydration root creation, marker consumption, and replay are not admitted.'
  }),
  freezeRecord({
    id: 'events',
    blocked: true,
    reason: 'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
  }),
  freezeRecord({
    id: 'compatibility-claims',
    blocked: true,
    reason: 'React DOM public root compatibility remains unclaimed.'
  })
]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-facade-create-root-record',
      accepted: true,
      reason:
        'The diagnostic starts from the symbol-only private public-facade createRoot record.'
    }),
    freezeRecord({
      id: 'public-facade-root-render-record',
      accepted: true,
      reason:
        'The diagnostic routes the public-shaped private root.render call into a bridge-owned render request record.'
    }),
    freezeRecord({
      id: 'root-marker-setup-cleanup',
      accepted: true,
      reason:
        'The reversible private root marker gate was applied for admission and then cleaned up.'
    }),
    freezeRecord({
      id: 'root-listener-setup-cleanup',
      accepted: true,
      reason:
        'The reversible private root listener gate was applied for admission and then cleaned up.'
    }),
    freezeRecord({
      id: 'create-render-admission',
      accepted: true,
      reason:
        'The private create/render admission record validated marker and listener prerequisites before host output.'
    }),
    freezeRecord({
      id: 'fake-dom-host-output-mutation',
      accepted: true,
      reason:
        'The accepted render was applied through the private fake-DOM mutation adapter only.'
    }),
    freezeRecord({
      id: 'component-tree-host-instance-map',
      accepted: true,
      reason:
        'HostComponent and HostText fake nodes were attached to private component-tree host instance tokens.'
    }),
    freezeRecord({
      id: 'latest-props-publication',
      accepted: true,
      reason:
        'Latest props were published only after the private fake-DOM mutation handoff was accepted.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The diagnostic never enables public React DOM createRoot, render, or unmount behavior.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No reconciler scheduling, render, complete-work, or commit traversal is admitted.'
    }),
    freezeRecord({
      id: 'browser-dom-compatibility',
      blocked: true,
      reason:
        'Only deterministic fake-DOM host nodes are admitted by this private diagnostic.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'events',
      blocked: true,
      reason: 'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
    }),
    freezeRecord({
      id: 'refs',
      blocked: true,
      reason: 'Ref attach/detach ordering is not admitted by this diagnostic.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM public root compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-facade-create-root-record',
      accepted: true,
      reason:
        'The diagnostic starts from the symbol-only private public-facade createRoot record.'
    }),
    freezeRecord({
      id: 'public-facade-initial-host-output-render',
      accepted: true,
      reason:
        'An active private public-facade initial host-output diagnostic provides the fake-DOM host instance.'
    }),
    freezeRecord({
      id: 'public-facade-root-render-update-record',
      accepted: true,
      reason:
        'The diagnostic routes the public-shaped private root.render update call into a bridge-owned render request record.'
    }),
    freezeRecord({
      id: 'host-output-update-handoff',
      accepted: true,
      reason:
        'The update request is applied through the accepted fake-DOM host-output update handoff.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The diagnostic never enables public React DOM createRoot, render, or unmount behavior.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No reconciler scheduling, render, complete-work, or commit traversal is admitted.'
    }),
    freezeRecord({
      id: 'browser-dom-compatibility',
      blocked: true,
      reason:
        'Only deterministic fake-DOM host nodes are admitted by this private diagnostic.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'events',
      blocked: true,
      reason:
        'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
    }),
    freezeRecord({
      id: 'refs',
      blocked: true,
      reason: 'Ref attach/detach ordering is not admitted by this diagnostic.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM public root compatibility remains unclaimed.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_ACCEPTED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-facade-create-root-record',
      accepted: true,
      reason:
        'The diagnostic starts from the symbol-only private public-facade createRoot record.'
    }),
    freezeRecord({
      id: 'public-facade-root-render-record',
      accepted: true,
      reason:
        'The diagnostic routes the public-shaped private root.render call into a bridge-owned render request record.'
    }),
    freezeRecord({
      id: 'public-facade-root-unmount-record',
      accepted: true,
      reason:
        'The diagnostic routes the public-shaped private root.unmount call into a bridge-owned unmount request record.'
    }),
    freezeRecord({
      id: 'root-marker-setup-cleanup',
      accepted: true,
      reason:
        'The reversible private root marker gate was applied for admission and cleaned up through the private unmount cleanup.'
    }),
    freezeRecord({
      id: 'root-listener-setup-cleanup',
      accepted: true,
      reason:
        'The reversible private root listener gate was applied for admission and cleaned up through the private unmount cleanup.'
    }),
    freezeRecord({
      id: 'create-render-admission',
      accepted: true,
      reason:
        'The private create/render admission record validated marker and listener prerequisites before host output.'
    }),
    freezeRecord({
      id: 'fake-dom-host-output-mutation',
      accepted: true,
      reason:
        'The accepted render was applied through the private fake-DOM mutation adapter only.'
    }),
    freezeRecord({
      id: 'fake-dom-unmount-cleanup',
      accepted: true,
      reason:
        'The accepted unmount cleanup cleared the private fake-DOM root children through the bridge cleanup path.'
    }),
    freezeRecord({
      id: 'component-tree-metadata-detach',
      accepted: true,
      reason:
        'The private unmount cleanup detached component-tree host metadata from the removed fake-DOM subtree.'
    }),
    freezeRecord({
      id: 'latest-props-publication',
      accepted: true,
      reason:
        'Latest props were published only after the private fake-DOM mutation handoff was accepted.'
    })
  ]);
const ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_BLOCKED_CAPABILITIES =
  freezeArray([
    freezeRecord({
      id: 'public-root-execution',
      blocked: true,
      reason:
        'The diagnostic never enables public React DOM createRoot, render, or unmount behavior.'
    }),
    freezeRecord({
      id: 'public-root-unmount',
      blocked: true,
      reason:
        'Public React DOM root unmount behavior remains unimplemented.'
    }),
    freezeRecord({
      id: 'native-execution',
      blocked: true,
      reason: 'No native or Rust root bridge execution is admitted.'
    }),
    freezeRecord({
      id: 'reconciler-execution',
      blocked: true,
      reason:
        'No reconciler scheduling, render, complete-work, deletion, ref, passive, or commit traversal is admitted.'
    }),
    freezeRecord({
      id: 'browser-dom-compatibility',
      blocked: true,
      reason:
        'Only deterministic fake-DOM host nodes are admitted by this private diagnostic.'
    }),
    freezeRecord({
      id: 'hydration',
      blocked: true,
      reason:
        'Hydration root creation, marker consumption, and replay are not admitted.'
    }),
    freezeRecord({
      id: 'events',
      blocked: true,
      reason: 'Synthetic event extraction, dispatch, and listener invocation are not admitted.'
    }),
    freezeRecord({
      id: 'refs',
      blocked: true,
      reason: 'Ref attach/detach ordering is not admitted by this diagnostic.'
    }),
    freezeRecord({
      id: 'compatibility-claims',
      blocked: true,
      reason: 'React DOM public root compatibility remains unclaimed.'
    })
  ]);

const rootOwnerState = new WeakMap();
const rootHandleState = new WeakMap();
const rootRecordPayloads = new WeakMap();
const rootNativeHandoffPayloads = new WeakMap();
const rootNativeHandoffRecords = new WeakMap();
const rootCreateRenderAdmissionPayloads = new WeakMap();
const rootCreateRenderAdmissionRecords = new WeakMap();
const rootCreateSideEffectPayloads = new WeakMap();
const rootCreateSideEffectRecords = new WeakMap();
const rootCreateSideEffectCleanupRecords = new WeakMap();
const rootInitialHostOutputHandoffPayloads = new WeakMap();
const rootInitialHostOutputHandoffRecords = new WeakMap();
const rootInitialHostOutputCleanupRecords = new WeakMap();
const rootPortalBoundaryPayloads = new WeakMap();
const rootPortalPrepareMountListenerIntentPayloads = new WeakMap();
const rootPortalCommitHandoffPayloads = new WeakMap();
const rootUnmountHostOutputCleanupPayloads = new WeakMap();
const rootUnmountHostOutputCleanupRecords = new WeakMap();
const rootPortalFakeDomMountPayloads = new WeakMap();
const rootPortalChildReconciliationDiagnosticPayloads = new WeakMap();
const rootPortalEventOwnerRootGatePayloads = new WeakMap();
const rootHostOutputUpdateHandoffPayloads = new WeakMap();
const rootHostOutputUpdateHandoffRecords = new WeakMap();
const rootCommitHostComponentUpdateHandoffPayloads = new WeakMap();
const rootCommitHostComponentUpdateHandoffRecords = new WeakMap();
const rootCommitRefMetadataPayloads = new WeakMap();
const rootCommitRefMetadataRecordsByRequest = new WeakMap();
const rootRefCallbackHostOutputOrderingDiagnosticPayloads = new WeakMap();
const rootRefCallbackErrorRoutingPayloads = new WeakMap();
const rootEventListenerErrorRoutingPayloads = new WeakMap();
const rootHydrationReplayErrorMetadataPayloads = new WeakMap();
const rootPublicFacadeAdapterPayloads = new WeakMap();
const rootPublicFacadeRootPayloads = new WeakMap();
const rootPublicFacadePreflightPayloads = new WeakMap();
const rootPublicFacadePreflightRootPayloads = new WeakMap();
const rootPublicFacadePreflightRecordPayloads = new WeakMap();
const rootPublicFacadeMarkerListenerPreflightPayloads = new WeakMap();
const rootPublicFacadeHostOutputRenderPayloads = new WeakMap();
const rootPublicFacadeHostOutputUpdatePayloads = new WeakMap();
const rootPublicFacadeHostOutputUnmountCleanupPayloads = new WeakMap();

function createPrivateRootBridgeShell(options) {
  const bridgeState = createBridgeState(options);

  return Object.freeze({
    createClientRoot(container, rootOptions) {
      return createClientRootRecordWithBridge(
        bridgeState,
        container,
        rootOptions
      );
    },
    createHydrateRoot(container, initialChildren, hydrationOptions) {
      return createHydrateRootRecordWithBridge(
        bridgeState,
        container,
        initialChildren,
        hydrationOptions
      );
    },
    renderContainer(rootHandle, element, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'render',
        false,
        element,
        callback
      );
    },
    updateContainer(rootHandle, element, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'render',
        false,
        element,
        callback
      );
    },
    unmountContainer(rootHandle, callback) {
      assertHandleBelongsToBridge(rootHandle, bridgeState);
      return createRootUpdateRecordWithBridge(
        bridgeState,
        rootHandle,
        'unmount',
        true,
        null,
        callback
      );
    },
    admitRequest(record) {
      return admitRootBridgeRequestWithBridge(bridgeState, record);
    },
    admitCreateRenderPath(createRecord, sideEffectRecord, renderRecord) {
      return admitPrivateCreateRenderPathWithBridge(
        bridgeState,
        createRecord,
        sideEffectRecord,
        renderRecord
      );
    },
    applyInitialRenderHostOutput(admissionRecord) {
      return applyPrivateInitialRenderHostOutputWithBridge(
        bridgeState,
        admissionRecord
      );
    },
    cleanupInitialRenderHostOutput(handoffRecord) {
      return cleanupPrivateInitialRenderHostOutputWithBridge(
        bridgeState,
        handoffRecord
      );
    },
    applyCreateRootSideEffects(record, options) {
      return applyPrivateCreateRootSideEffectsWithBridge(
        bridgeState,
        record,
        options
      );
    },
    createNativeRequestHandoff(record) {
      return createNativeRootBridgeHandoffRecordWithBridge(bridgeState, record);
    },
    revertCreateRootSideEffects(record) {
      return revertPrivateCreateRootSideEffectsWithBridge(bridgeState, record);
    },
    createPortalRootBoundary(record) {
      return createPortalRootBoundaryRecordWithBridge(bridgeState, record);
    },
    createPortalPrepareMountListenerIntent(record, options) {
      return createPortalPrepareMountListenerIntentRecordWithBridge(
        bridgeState,
        record,
        options
      );
    },
    createPortalCommitHandoff(record, options) {
      return createPortalCommitHandoffRecordWithBridge(
        bridgeState,
        record,
        options
      );
    },
    cleanupUnmountHostOutput(admissionRecord, unmountRecord) {
      return cleanupPrivateRootUnmountHostOutputWithBridge(
        bridgeState,
        admissionRecord,
        unmountRecord
      );
    },
    createPortalFakeDomMountDiagnostic(record, options) {
      return createPortalFakeDomMountDiagnosticRecordWithBridge(
        bridgeState,
        record,
        options
      );
    },
    createPortalChildReconciliationDiagnostic(mountRecord, boundaryRecord, options) {
      return createPortalChildReconciliationDiagnosticRecordWithBridge(
        bridgeState,
        mountRecord,
        boundaryRecord,
        options
      );
    },
    createPortalEventOwnerRootGate(mountRecord, options) {
      return createPortalEventOwnerRootGateRecordWithBridge(
        bridgeState,
        mountRecord,
        options
      );
    },
    applyHostOutputUpdate(record, options) {
      return applyPrivateRootHostOutputUpdateWithBridge(
        bridgeState,
        record,
        options
      );
    },
    applyRootCommitHostComponentUpdate(
      record,
      rootCommitHostComponentUpdateMetadata,
      options
    ) {
      return applyPrivateRootCommitHostComponentUpdateWithBridge(
        bridgeState,
        record,
        rootCommitHostComponentUpdateMetadata,
        options
      );
    },
    admitRootCommitRefMetadata(record, rootCommitRefMetadata, options) {
      return admitPrivateRootCommitRefMetadataWithBridge(
        bridgeState,
        record,
        rootCommitRefMetadata,
        options
      );
    },
    createRefCallbackHostOutputOrderingDiagnostic(rootRequestRecords, options) {
      return createRefCallbackHostOutputOrderingDiagnosticRecordWithBridge(
        bridgeState,
        rootRequestRecords,
        options
      );
    },
    createRefCallbackRootErrorRouting(rootRequestRecords, options) {
      return createRefCallbackRootErrorRoutingRecordWithBridge(
        bridgeState,
        rootRequestRecords,
        options
      );
    },
    createEventListenerRootErrorRouting(
      rootRequestRecords,
      eventDispatchCanaryRecord,
      options
    ) {
      return createEventListenerRootErrorRoutingRecordWithBridge(
        bridgeState,
        rootRequestRecords,
        eventDispatchCanaryRecord,
        options
      );
    },
    createHydrationReplayErrorMetadata(
      hydrateRootRecord,
      ownershipDiagnostics,
      options
    ) {
      return createHydrationReplayErrorMetadataRecordWithBridge(
        bridgeState,
        hydrateRootRecord,
        ownershipDiagnostics,
        options
      );
    }
  });
}

const defaultBridgeShell = createPrivateRootBridgeShell();

function createPrivateRootPublicFacadeAdapter(options) {
  const bridge = createPrivateRootBridgeShell(options);
  const adapterState = {
    adapter: null,
    bridge,
    roots: []
  };
  const adapter = freezeRecord({
    $$typeof: privateRootPublicFacadeAdapterType,
    kind: 'FastReactDomPrivateRootPublicFacadeAdapter',
    entrypoint: 'react-dom/client',
    adapterStatus: ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    recordOnlyBridge: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    createRoot(container, rootOptions) {
      return createPrivateRootPublicFacadeRoot(
        adapterState,
        container,
        rootOptions
      );
    },
    getRootCreateRecord(root) {
      return assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
        .createRecord;
    },
    getRootRequestRecords(root) {
      return freezeArray(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
          .requestRecords
      );
    },
    getRootPayload(root) {
      return createPrivateRootPublicFacadeRootPayloadSnapshot(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
      );
    },
    getRootMarkerListenerPreflightRecords(root) {
      return freezeArray(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
          .markerListenerPreflightRecords
      );
    },
    getRootHostOutputRenderDiagnostics(root) {
      return freezeArray(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
          .hostOutputRenderRecords
      );
    },
    getRootHostOutputUpdateDiagnostics(root) {
      return freezeArray(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
          .hostOutputUpdateRecords
      );
    },
    getRootHostOutputUnmountCleanupDiagnostics(root) {
      return freezeArray(
        assertPrivateRootPublicFacadeRootForAdapter(root, adapterState)
          .hostOutputUnmountCleanupRecords
      );
    },
    preflightRootMarkerListenerSetupAndCleanup(root, options) {
      return preflightPrivateRootPublicFacadeMarkerListenerSetupWithAdapter(
        adapterState,
        root,
        options
      );
    },
    renderHostOutput(root, element, options) {
      return renderPrivateRootPublicFacadeHostOutputWithAdapter(
        adapterState,
        root,
        element,
        options
      );
    },
    updateHostOutput(root, element, options) {
      return updatePrivateRootPublicFacadeHostOutputWithAdapter(
        adapterState,
        root,
        element,
        options
      );
    },
    unmountHostOutput(root, element, options) {
      return unmountPrivateRootPublicFacadeHostOutputWithAdapter(
        adapterState,
        root,
        element,
        options
      );
    }
  });

  adapterState.adapter = adapter;
  rootPublicFacadeAdapterPayloads.set(adapter, adapterState);
  return adapter;
}

function createPrivateRootPublicFacadePreflight(options) {
  const bridge = createPrivateRootBridgeShell(options);
  const preflightState = {
    bridge,
    nextPreflightSequence: 1,
    preflight: null,
    preflightIdPrefix: getIdPrefix(
      options && options.publicFacadePreflightIdPrefix,
      'public-facade-preflight'
    ),
    records: [],
    roots: []
  };
  const preflight = freezeRecord({
    $$typeof: privateRootPublicFacadePreflightType,
    kind: 'FastReactDomPrivateRootPublicFacadePreflight',
    entrypoint: 'react-dom/client',
    preflightStatus: ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    acceptedPrivateBridgeDiagnostics: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootObjectExposed: false,
    publicRootCompatibilitySurface: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    createRoot(container, rootOptions) {
      return createPrivateRootPublicFacadePreflightRoot(
        preflightState,
        container,
        rootOptions
      );
    },
    getRootCreatePreflight(root) {
      return assertPrivateRootPublicFacadePreflightRootForPreflight(
        root,
        preflightState
      ).createPreflight;
    },
    getRootPreflightRecords(root) {
      return freezeArray(
        assertPrivateRootPublicFacadePreflightRootForPreflight(
          root,
          preflightState
        ).preflightRecords
      );
    },
    getRootRequestRecords(root) {
      return freezeArray(
        assertPrivateRootPublicFacadePreflightRootForPreflight(
          root,
          preflightState
        ).requestRecords
      );
    },
    getRootPayload(root) {
      return createPrivateRootPublicFacadePreflightRootPayloadSnapshot(
        assertPrivateRootPublicFacadePreflightRootForPreflight(
          root,
          preflightState
        )
      );
    }
  });

  preflightState.preflight = preflight;
  rootPublicFacadePreflightPayloads.set(preflight, preflightState);
  return preflight;
}

function createPrivateRootPublicFacadeRoot(
  adapterState,
  container,
  rootOptions
) {
  const createRecord = adapterState.bridge.createClientRoot(
    container,
    rootOptions
  );
  const payload = {
    adapter: adapterState.adapter,
    bridge: adapterState.bridge,
    container,
    createRecord,
    hostOutputRenderRecords: [],
    hostOutputUpdateRecords: [],
    hostOutputUnmountCleanupRecords: [],
    renderRecords: [],
    markerListenerPreflightRecords: [],
    requestRecords: [createRecord],
    root: null,
    rootHandle: createRecord.handle,
    rootOptions,
    rootType: privateRootPublicFacadeRootType,
    unmountRecords: []
  };
  const root = {};

  Object.defineProperties(root, {
    render: {
      enumerable: true,
      value: function render(element) {
        const callback =
          arguments.length > 1 ? arguments[1] : undefined;
        const record = adapterState.bridge.renderContainer(
          createRecord.handle,
          element,
          callback
        );
        payload.requestRecords.push(record);
        payload.renderRecords.push(record);
        return record;
      }
    },
    unmount: {
      enumerable: true,
      value: function unmount() {
        const callback = arguments.length > 0 ? arguments[0] : undefined;
        const record = adapterState.bridge.unmountContainer(
          createRecord.handle,
          callback
        );
        payload.requestRecords.push(record);
        payload.unmountRecords.push(record);
        return record;
      }
    }
  });

  Object.freeze(root);
  payload.root = root;
  rootPublicFacadeRootPayloads.set(root, payload);
  adapterState.roots.push(root);
  return root;
}

function createPrivateRootPublicFacadePreflightRoot(
  preflightState,
  container,
  rootOptions
) {
  const createRecord = preflightState.bridge.createClientRoot(
    container,
    rootOptions
  );
  const payload = {
    bridge: preflightState.bridge,
    container,
    createPreflight: null,
    createRecord,
    preflight: preflightState.preflight,
    preflightRecords: [],
    renderPreflights: [],
    requestRecords: [],
    root: null,
    rootHandle: createRecord.handle,
    rootOptions,
    rootType: privateRootPublicFacadePreflightRootType,
    unmountPreflights: []
  };
  const root = {};

  Object.defineProperties(root, {
    render: {
      enumerable: true,
      value: function render(element) {
        const callback =
          arguments.length > 1 ? arguments[1] : undefined;
        const record = preflightState.bridge.renderContainer(
          createRecord.handle,
          element,
          callback
        );
        const preflightRecord =
          appendPrivateRootPublicFacadePreflightRecord(
            preflightState,
            payload,
            record,
            'root.render'
          );
        payload.renderPreflights.push(preflightRecord);
        return preflightRecord;
      }
    },
    unmount: {
      enumerable: true,
      value: function unmount() {
        const callback = arguments.length > 0 ? arguments[0] : undefined;
        const record = preflightState.bridge.unmountContainer(
          createRecord.handle,
          callback
        );
        const preflightRecord =
          appendPrivateRootPublicFacadePreflightRecord(
            preflightState,
            payload,
            record,
            'root.unmount'
          );
        payload.unmountPreflights.push(preflightRecord);
        return preflightRecord;
      }
    }
  });

  Object.freeze(root);
  payload.root = root;
  rootPublicFacadePreflightRootPayloads.set(root, payload);
  preflightState.roots.push(root);
  payload.createPreflight = appendPrivateRootPublicFacadePreflightRecord(
    preflightState,
    payload,
    createRecord,
    'createRoot'
  );
  return root;
}

function appendPrivateRootPublicFacadePreflightRecord(
  preflightState,
  rootPayload,
  requestRecord,
  facadeCall
) {
  const preflightRecord = createPrivateRootPublicFacadePreflightRecord(
    preflightState,
    rootPayload,
    requestRecord,
    facadeCall
  );
  rootPayload.requestRecords.push(requestRecord);
  rootPayload.preflightRecords.push(preflightRecord);
  preflightState.records.push(preflightRecord);
  return preflightRecord;
}

function createPrivateRootPublicFacadePreflightRecord(
  preflightState,
  rootPayload,
  requestRecord,
  facadeCall
) {
  const requestAdmission = preflightState.bridge.admitRequest(requestRecord);
  const nativeHandoffRecord =
    preflightState.bridge.createNativeRequestHandoff(requestRecord);
  const preflightSequence = preflightState.nextPreflightSequence++;
  const preflightId =
    `${preflightState.preflightIdPrefix}:${preflightSequence}`;
  const record = freezeRecord({
    $$typeof: privateRootPublicFacadePreflightRecordType,
    kind: 'FastReactDomPrivateRootPublicFacadePreflightRecord',
    operation: requestRecord.operation,
    facadeCall,
    entrypoint: 'react-dom/client',
    preflightId,
    preflightSequence,
    preflightStatus: ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    requestId: requestRecord.requestId,
    requestSequence: requestRecord.requestSequence,
    requestType: requestRecord.requestType,
    updateId: requestRecord.updateId || null,
    rootId: requestRecord.rootId,
    rootKind: requestRecord.rootKind,
    rootTag: requestRecord.rootTag,
    lifecycleStatusBefore: requestRecord.lifecycleStatusBefore,
    lifecycleStatusAfter: requestRecord.lifecycleStatusAfter,
    noOp: requestRecord.noOp === true,
    sync: requestRecord.sync === true,
    requestAdmission,
    nativeHandoffRecord,
    requestAdmissionStatus: requestAdmission.admissionStatus,
    nativeHandoffStatus: nativeHandoffRecord.handoffStatus,
    acceptedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_BLOCKED_CAPABILITIES,
    acceptedPrivateBridgeDiagnostics: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootObjectExposed: false,
    publicRootCompatibilitySurface: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootPublicFacadePreflightRecordPayloads.set(record, {
    bridge: preflightState.bridge,
    nativeHandoffRecord,
    preflight: preflightState.preflight,
    requestAdmission,
    requestRecord,
    root: rootPayload.root
  });
  return record;
}

function preflightPrivateRootPublicFacadeMarkerListenerSetup(root, options) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadeAdapter(
      'Expected a private React DOM root public facade root.'
    );
  }
  return preflightPrivateRootPublicFacadeMarkerListenerSetupFromPayload(
    payload,
    options
  );
}

function preflightPrivateRootPublicFacadeMarkerListenerSetupWithAdapter(
  adapterState,
  root,
  options
) {
  const payload = assertPrivateRootPublicFacadeRootForAdapter(
    root,
    adapterState
  );
  return preflightPrivateRootPublicFacadeMarkerListenerSetupFromPayload(
    payload,
    options
  );
}

function preflightPrivateRootPublicFacadeMarkerListenerSetupFromPayload(
  payload,
  options
) {
  const createRecord = payload.createRecord;
  const createPayload = rootRecordPayloads.get(createRecord);
  if (createPayload === undefined) {
    throwInvalidRootPublicFacadePreflight(
      'Expected a private React DOM createRoot record for public-facade marker/listener preflight.'
    );
  }
  const handleState = rootHandleState.get(payload.rootHandle);
  if (handleState === undefined) {
    throwInvalidRootPublicFacadePreflight(
      'Expected a private React DOM root handle for public-facade marker/listener preflight.'
    );
  }
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    throwInvalidRootPublicFacadePreflight(
      'Cannot preflight root marker/listener setup after the private facade root was unmounted.'
    );
  }
  assertNoActiveCreateRootSideEffectsForPublicFacadePreflight(createRecord);

  const rootBridgeState = handleState.bridgeState;
  const sequence = rootBridgeState.nextPublicFacadePreflightSequence++;
  const preflightId =
    `${rootBridgeState.publicFacadePreflightIdPrefix}:${sequence}`;
  const container = createPayload.container;
  const ownerDocument = getOwnerDocument(container);
  const beforeState =
    inspectPublicFacadeMarkerListenerPreflightState(container);
  const sideEffectRecord = payload.bridge.applyCreateRootSideEffects(
    createRecord,
    options
  );
  const setupState =
    inspectPublicFacadeMarkerListenerPreflightState(container);
  const setupRootMarkerMatchesOwner =
    getContainerRoot(container) === createRecord.owner;
  const cleanupRecord = payload.bridge.revertCreateRootSideEffects(
    sideEffectRecord
  );
  const afterState =
    inspectPublicFacadeMarkerListenerPreflightState(container);
  if (
    sideEffectRecord.listenerRegistration.$$typeof !==
      privateRootListenerRegistrationRecordType ||
    cleanupRecord.listenerCleanup.$$typeof !==
      privateRootListenerCleanupRecordType
  ) {
    throwInvalidRootPublicFacadePreflight(
      'Public-facade marker/listener preflight received unexpected listener gate records.'
    );
  }

  const preflightRecord = freezeRecord({
    $$typeof: privateRootPublicFacadeMarkerListenerPreflightRecordType,
    kind: 'FastReactDomPrivateRootPublicFacadeMarkerListenerPreflightRecord',
    operation: 'public-facade-marker-listener-preflight',
    entrypoint: 'react-dom/client',
    adapterStatus: ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
    preflightId,
    preflightSequence: sequence,
    preflightStatus: ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    sideEffectId: sideEffectRecord.sideEffectId,
    sideEffectSequence: sideEffectRecord.sideEffectSequence,
    setupSideEffectStatus: sideEffectRecord.sideEffectStatus,
    cleanupSideEffectStatus: cleanupRecord.sideEffectStatus,
    markerRecordKind: sideEffectRecord.markerRecord.kind,
    markerRecordType: sideEffectRecord.markerRecord.$$typeof,
    markerStatus: sideEffectRecord.markerRecord.markerStatus,
    markerCleanupKind: cleanupRecord.markerCleanup.kind,
    markerCleanupType: cleanupRecord.markerCleanup.$$typeof,
    markerCleanupStatus: cleanupRecord.markerCleanup.markerStatus,
    listenerRegistrationKind: sideEffectRecord.listenerRegistration.kind,
    listenerRegistrationType:
      sideEffectRecord.listenerRegistration.$$typeof,
    listenerRegistrationStatus:
      sideEffectRecord.listenerRegistration.registrationStatus,
    listenerCleanupKind: cleanupRecord.listenerCleanup.kind,
    listenerCleanupType: cleanupRecord.listenerCleanup.$$typeof,
    listenerCleanupStatus: cleanupRecord.listenerCleanup.registrationStatus,
    beforeState,
    setupState,
    afterState,
    setupPrerequisites: freezeRecord({
      accepted: true,
      markerStatus: ROOT_MARKER_APPLIED,
      listenerRegistrationStatus: ROOT_LISTENERS_REGISTERED,
      rootMarkerMatchesOwner: setupRootMarkerMatchesOwner,
      rootListeningMarkerPresent:
        setupState.rootListeningMarker.trueValueCount > 0,
      ownerDocumentListeningMarkerPresent:
        setupState.ownerDocumentListeningMarker === null
          ? false
          : setupState.ownerDocumentListeningMarker.trueValueCount > 0,
      listenerRegistrationCount:
        sideEffectRecord.listenerRegistration.registrationCount,
      rootRegistrationCount:
        sideEffectRecord.listenerRegistration.rootRegistrationCount,
      ownerDocumentRegistrationCount:
        sideEffectRecord.listenerRegistration.ownerDocumentRegistrationCount
    }),
    cleanupPrerequisites: freezeRecord({
      accepted: true,
      markerCleanupStatus: ROOT_MARKER_REVERTED,
      listenerCleanupStatus: ROOT_LISTENERS_REVERTED,
      listenerRemovalCount: cleanupRecord.listenerCleanup.listenerRemovalCount,
      listenerSetKeyRemovalCount:
        cleanupRecord.listenerCleanup.listenerSetKeyRemovalCount,
      restoredTargetCount: cleanupRecord.listenerCleanup.restoredTargetCount,
      restoredInitialMarkerState: markerListenerStateMatches(
        beforeState,
        afterState
      ),
      finalRootListeningMarkerPresent:
        afterState.rootListeningMarker.trueValueCount > 0,
      finalOwnerDocumentListeningMarkerPresent:
        afterState.ownerDocumentListeningMarker === null
          ? false
          : afterState.ownerDocumentListeningMarker.trueValueCount > 0
    }),
    acceptedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHT_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHT_BLOCKED_CAPABILITIES,
    privateFacadeRoot: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    publicRootExecution: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    setupMarkerWrites: true,
    setupListenerInstallation: true,
    cleanupCompleted: true,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    reversible: false
  });

  rootPublicFacadeMarkerListenerPreflightPayloads.set(preflightRecord, {
    adapter: payload.adapter,
    bridge: payload.bridge,
    cleanupRecord,
    container,
    createRecord,
    ownerDocument,
    root: payload.root,
    rootHandle: payload.rootHandle,
    sideEffectRecord
  });
  payload.markerListenerPreflightRecords.push(preflightRecord);
  return preflightRecord;
}

function renderPrivateRootPublicFacadeHostOutput(root, element, options) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadeAdapter(
      'Expected a private React DOM root public facade root.'
    );
  }
  return renderPrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function renderPrivateRootPublicFacadeHostOutputWithAdapter(
  adapterState,
  root,
  element,
  options
) {
  const payload = assertPrivateRootPublicFacadeRootForAdapter(
    root,
    adapterState
  );
  return renderPrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function renderPrivateRootPublicFacadeHostOutputFromPayload(
  payload,
  element,
  options
) {
  const createRecord = payload.createRecord;
  const createPayload = rootRecordPayloads.get(createRecord);
  if (createPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputRender(
      'Expected a private React DOM createRoot record for public-facade host-output render.'
    );
  }

  const handleState = getPrivateRootHandleState(payload.rootHandle);
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    throwInvalidRootPublicFacadeHostOutputRender(
      'Cannot render private public-facade host output after the private facade root was unmounted.'
    );
  }
  if (hasActivePrivateRootPublicFacadeHostOutputRender(payload)) {
    throwInvalidRootPublicFacadeHostOutputRender(
      'Cannot render private public-facade host output while a previous host-output diagnostic is still active.'
    );
  }
  assertNoActiveCreateRootSideEffectsForPublicFacadeHostOutputRender(
    createRecord
  );
  normalizeInitialHostOutputElement(element);

  let sideEffectRecord = null;
  let renderRecord = null;
  let admissionRecord = null;
  let hostOutputHandoff = null;
  let sideEffectCleanup = null;
  const callback = getPublicFacadeHostOutputRenderCallback(options);
  const sideEffectOptions =
    getPublicFacadeHostOutputRenderSideEffectOptions(options);

  try {
    sideEffectRecord = payload.bridge.applyCreateRootSideEffects(
      createRecord,
      sideEffectOptions
    );
    renderRecord = payload.root.render(element, callback);
    admissionRecord = payload.bridge.admitCreateRenderPath(
      createRecord,
      sideEffectRecord,
      renderRecord
    );
    hostOutputHandoff =
      payload.bridge.applyInitialRenderHostOutput(admissionRecord);
    sideEffectCleanup =
      payload.bridge.revertCreateRootSideEffects(sideEffectRecord);
  } catch (error) {
    cleanupPublicFacadeHostOutputRenderAfterFailure({
      bridge: payload.bridge,
      error,
      hostOutputHandoff,
      sideEffectRecord
    });
    throw error;
  }

  const hostOutputPayload =
    rootInitialHostOutputHandoffPayloads.get(hostOutputHandoff);
  if (hostOutputPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputRender(
      'Public-facade host-output render requires an applied initial host-output handoff.'
    );
  }

  const rootBridgeState = handleState.bridgeState;
  const sequence = rootBridgeState.nextPublicFacadeHostOutputRenderSequence++;
  const diagnosticId =
    `${rootBridgeState.publicFacadeHostOutputRenderIdPrefix}:${sequence}`;
  const diagnosticRecord = freezeRecord({
    $$typeof: privateRootPublicFacadeHostOutputRenderRecordType,
    kind: 'FastReactDomPrivateRootPublicFacadeHostOutputRenderDiagnosticRecord',
    operation: 'public-facade-host-output-render-diagnostic',
    entrypoint: 'react-dom/client',
    adapterStatus: ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
    diagnosticId,
    diagnosticSequence: sequence,
    diagnosticStatus: ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    renderRequestId: renderRecord.requestId,
    renderRequestSequence: renderRecord.requestSequence,
    renderRequestType: renderRecord.requestType,
    renderUpdateId: renderRecord.updateId,
    renderLifecycleStatusBefore: renderRecord.lifecycleStatusBefore,
    renderLifecycleStatusAfter: renderRecord.lifecycleStatusAfter,
    sideEffectId: sideEffectRecord.sideEffectId,
    sideEffectSequence: sideEffectRecord.sideEffectSequence,
    setupSideEffectStatus: sideEffectRecord.sideEffectStatus,
    cleanupSideEffectStatus: sideEffectCleanup.sideEffectStatus,
    markerStatus: sideEffectRecord.markerRecord.markerStatus,
    markerCleanupStatus: sideEffectCleanup.markerCleanup.markerStatus,
    listenerRegistrationStatus:
      sideEffectRecord.listenerRegistration.registrationStatus,
    listenerCleanupStatus:
      sideEffectCleanup.listenerCleanup.registrationStatus,
    admissionId: admissionRecord.admissionId,
    admissionSequence: admissionRecord.admissionSequence,
    admissionStatus: admissionRecord.admissionStatus,
    hostOutputHandoffId: hostOutputHandoff.handoffId,
    hostOutputHandoffSequence: hostOutputHandoff.handoffSequence,
    hostOutputHandoffStatus: hostOutputHandoff.handoffStatus,
    hostType: hostOutputHandoff.hostType,
    hostNodeInfo: hostOutputHandoff.hostNodeInfo,
    textNodeInfo: hostOutputHandoff.textNodeInfo,
    containerChildCount: hostOutputHandoff.containerChildCount,
    hostChildCount: hostOutputHandoff.hostChildCount,
    textContent: hostOutputHandoff.textContent,
    acceptedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_BLOCKED_CAPABILITIES,
    privateFacadeRoot: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    publicRootExecution: false,
    publicRootCompatibilitySurface: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    fakeDomMutation: true,
    domMutation: true,
    browserDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    setupMarkerWrites: true,
    setupListenerInstallation: true,
    cleanupCompleted: true,
    hydration: false,
    eventDispatch: false,
    refEffects: false,
    compatibilityClaimed: false,
    cleanupRequired: true
  });

  rootPublicFacadeHostOutputRenderPayloads.set(diagnosticRecord, {
    adapter: payload.adapter,
    admissionRecord,
    bridge: payload.bridge,
    callback,
    container: createPayload.container,
    createRecord,
    element,
    hostOutputHandoff,
    hostOutputPayload,
    renderRecord,
    root: payload.root,
    rootHandle: payload.rootHandle,
    sideEffectCleanup,
    sideEffectRecord
  });
  payload.hostOutputRenderRecords.push(diagnosticRecord);
  return diagnosticRecord;
}

function updatePrivateRootPublicFacadeHostOutput(root, element, options) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadeAdapter(
      'Expected a private React DOM root public facade root.'
    );
  }
  return updatePrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function updatePrivateRootPublicFacadeHostOutputWithAdapter(
  adapterState,
  root,
  element,
  options
) {
  const payload = assertPrivateRootPublicFacadeRootForAdapter(
    root,
    adapterState
  );
  return updatePrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function updatePrivateRootPublicFacadeHostOutputFromPayload(
  payload,
  element,
  options
) {
  const createRecord = payload.createRecord;
  const createPayload = rootRecordPayloads.get(createRecord);
  if (createPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Expected a private React DOM createRoot record for public-facade host-output update.'
    );
  }

  const handleState = getPrivateRootHandleState(payload.rootHandle);
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Cannot update private public-facade host output after the private facade root was unmounted.'
    );
  }

  const activeRender =
    getActivePrivateRootPublicFacadeHostOutputRender(payload);
  if (activeRender === null) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Public-facade host-output update requires an active initial host-output diagnostic.'
    );
  }

  const normalized = normalizePublicFacadeHostOutputUpdateElement(
    element,
    activeRender.hostOutputPayload,
    activeRender.renderPayload.hostOutputHandoff
  );
  const callback = getPublicFacadeHostOutputUpdateCallback(options);
  const updateRecord = payload.root.render(element, callback);
  const hostOutputUpdateHandoff = payload.bridge.applyHostOutputUpdate(
    updateRecord,
    {
      hostInstanceToken: activeRender.hostOutputPayload.hostToken,
      nextProps: normalized.nextProps,
      tag: normalized.type,
      textUpdate: normalized.textUpdate
    }
  );
  const hostOutputUpdatePayload =
    rootHostOutputUpdateHandoffPayloads.get(hostOutputUpdateHandoff);
  if (hostOutputUpdatePayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Public-facade host-output update requires an applied host-output update handoff.'
    );
  }

  const rootBridgeState = handleState.bridgeState;
  const sequence = rootBridgeState.nextPublicFacadeHostOutputUpdateSequence++;
  const diagnosticId =
    `${rootBridgeState.publicFacadeHostOutputUpdateIdPrefix}:${sequence}`;
  const acceptedCapabilities =
    createPublicFacadeHostOutputUpdateAcceptedCapabilities(
      hostOutputUpdateHandoff
    );
  const diagnosticRecord = freezeRecord({
    $$typeof: privateRootPublicFacadeHostOutputUpdateRecordType,
    kind: 'FastReactDomPrivateRootPublicFacadeHostOutputUpdateDiagnosticRecord',
    operation: 'public-facade-host-output-update-diagnostic',
    entrypoint: 'react-dom/client',
    adapterStatus: ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
    diagnosticId,
    diagnosticSequence: sequence,
    diagnosticStatus: ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    initialDiagnosticId: activeRender.record.diagnosticId,
    initialDiagnosticStatus: activeRender.record.diagnosticStatus,
    initialRenderRequestId: activeRender.record.renderRequestId,
    initialRenderUpdateId: activeRender.record.renderUpdateId,
    initialHostOutputHandoffId:
      activeRender.renderPayload.hostOutputHandoff.handoffId,
    initialHostOutputHandoffStatus:
      activeRender.renderPayload.hostOutputHandoff.handoffStatus,
    updateRequestId: updateRecord.requestId,
    updateRequestSequence: updateRecord.requestSequence,
    updateRequestType: updateRecord.requestType,
    updateUpdateId: updateRecord.updateId,
    updateLifecycleStatusBefore: updateRecord.lifecycleStatusBefore,
    updateLifecycleStatusAfter: updateRecord.lifecycleStatusAfter,
    hostOutputUpdateHandoffId: hostOutputUpdateHandoff.handoffId,
    hostOutputUpdateHandoffSequence:
      hostOutputUpdateHandoff.handoffSequence,
    hostOutputUpdateStatus: hostOutputUpdateHandoff.updateStatus,
    hostType: hostOutputUpdateHandoff.hostTag,
    propertyMutation: hostOutputUpdateHandoff.propertyMutation,
    textMutation: hostOutputUpdateHandoff.textMutation,
    latestPropsPublished: hostOutputUpdateHandoff.latestPropsPublished,
    latestPropsPublishOrder:
      hostOutputUpdateHandoff.latestPropsPublishOrder,
    containerChildCount: getChildNodeCount(createPayload.container),
    hostChildCount: getChildNodeCount(
      activeRender.hostOutputPayload.hostNode
    ),
    textContent: normalized.text,
    acceptedCapabilities,
    blockedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES,
    privateFacadeRoot: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    publicRootExecution: false,
    publicRootCompatibilitySurface: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    fakeDomMutation: true,
    domMutation: true,
    browserDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    refEffects: false,
    compatibilityClaimed: false,
    cleanupRequired: true
  });

  rootPublicFacadeHostOutputUpdatePayloads.set(diagnosticRecord, {
    adapter: payload.adapter,
    bridge: payload.bridge,
    callback,
    container: createPayload.container,
    createRecord,
    element,
    hostOutputRenderDiagnostic: activeRender.record,
    hostOutputRenderPayload: activeRender.renderPayload,
    hostOutputUpdateHandoff,
    hostOutputUpdatePayload,
    initialHostOutputPayload: activeRender.hostOutputPayload,
    normalizedUpdate: normalized,
    renderRecord: activeRender.renderPayload.renderRecord,
    root: payload.root,
    rootHandle: payload.rootHandle,
    updateRecord
  });
  payload.hostOutputUpdateRecords.push(diagnosticRecord);
  return diagnosticRecord;
}

function unmountPrivateRootPublicFacadeHostOutput(root, element, options) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Expected a private React DOM root public facade root.'
    );
  }
  return unmountPrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function unmountPrivateRootPublicFacadeHostOutputWithAdapter(
  adapterState,
  root,
  element,
  options
) {
  const payload = assertPrivateRootPublicFacadeRootForAdapter(
    root,
    adapterState
  );
  return unmountPrivateRootPublicFacadeHostOutputFromPayload(
    payload,
    element,
    options
  );
}

function unmountPrivateRootPublicFacadeHostOutputFromPayload(
  payload,
  element,
  options
) {
  const createRecord = payload.createRecord;
  const createPayload = rootRecordPayloads.get(createRecord);
  if (createPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Expected a private React DOM createRoot record for public-facade host-output unmount cleanup.'
    );
  }

  const handleState = getPrivateRootHandleState(payload.rootHandle);
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Cannot unmount private public-facade host output after the private facade root was unmounted.'
    );
  }
  if (hasActivePrivateRootPublicFacadeHostOutputRender(payload)) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Cannot unmount private public-facade host output while a previous host-output diagnostic is still active.'
    );
  }
  assertNoActiveCreateRootSideEffectsForPublicFacadeHostOutputUnmount(
    createRecord
  );
  normalizeInitialHostOutputElement(element);

  let sideEffectRecord = null;
  let renderRecord = null;
  let admissionRecord = null;
  let hostOutputHandoff = null;
  let unmountRecord = null;
  let unmountCleanupRecord = null;
  const renderCallback =
    getPublicFacadeHostOutputUnmountRenderCallback(options);
  const unmountCallback =
    getPublicFacadeHostOutputUnmountCallback(options);
  const sideEffectOptions =
    getPublicFacadeHostOutputRenderSideEffectOptions(options);

  try {
    sideEffectRecord = payload.bridge.applyCreateRootSideEffects(
      createRecord,
      sideEffectOptions
    );
    renderRecord = payload.root.render(element, renderCallback);
    admissionRecord = payload.bridge.admitCreateRenderPath(
      createRecord,
      sideEffectRecord,
      renderRecord
    );
    hostOutputHandoff =
      payload.bridge.applyInitialRenderHostOutput(admissionRecord);
    unmountRecord = payload.root.unmount(unmountCallback);
    unmountCleanupRecord = payload.bridge.cleanupUnmountHostOutput(
      admissionRecord,
      unmountRecord
    );
  } catch (error) {
    cleanupPublicFacadeHostOutputRenderAfterFailure({
      bridge: payload.bridge,
      error,
      hostOutputHandoff,
      sideEffectRecord
    });
    throw error;
  }

  const hostOutputPayload =
    rootInitialHostOutputHandoffPayloads.get(hostOutputHandoff);
  if (hostOutputPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Public-facade host-output unmount cleanup requires an applied initial host-output handoff.'
    );
  }
  const unmountCleanupPayload =
    rootUnmountHostOutputCleanupPayloads.get(unmountCleanupRecord);
  if (unmountCleanupPayload === undefined) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Public-facade host-output unmount cleanup requires an accepted private unmount cleanup record.'
    );
  }

  const rootBridgeState = handleState.bridgeState;
  const sequence =
    rootBridgeState.nextPublicFacadeHostOutputUnmountCleanupSequence++;
  const diagnosticId =
    `${rootBridgeState.publicFacadeHostOutputUnmountCleanupIdPrefix}:${sequence}`;
  const diagnosticRecord = freezeRecord({
    $$typeof: privateRootPublicFacadeHostOutputUnmountCleanupRecordType,
    kind: 'FastReactDomPrivateRootPublicFacadeHostOutputUnmountCleanupDiagnosticRecord',
    operation: 'public-facade-host-output-unmount-cleanup-diagnostic',
    entrypoint: 'react-dom/client',
    adapterStatus: ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
    diagnosticId,
    diagnosticSequence: sequence,
    diagnosticStatus:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    renderRequestId: renderRecord.requestId,
    renderRequestSequence: renderRecord.requestSequence,
    renderRequestType: renderRecord.requestType,
    renderUpdateId: renderRecord.updateId,
    renderLifecycleStatusBefore: renderRecord.lifecycleStatusBefore,
    renderLifecycleStatusAfter: renderRecord.lifecycleStatusAfter,
    unmountRequestId: unmountRecord.requestId,
    unmountRequestSequence: unmountRecord.requestSequence,
    unmountRequestType: unmountRecord.requestType,
    unmountUpdateId: unmountRecord.updateId,
    unmountLifecycleStatusBefore: unmountRecord.lifecycleStatusBefore,
    unmountLifecycleStatusAfter: unmountRecord.lifecycleStatusAfter,
    unmountNoOp: unmountRecord.noOp === true,
    unmountSync: unmountRecord.sync === true,
    sideEffectId: sideEffectRecord.sideEffectId,
    sideEffectSequence: sideEffectRecord.sideEffectSequence,
    setupSideEffectStatus: sideEffectRecord.sideEffectStatus,
    cleanupSideEffectStatus: unmountCleanupRecord.sideEffectCleanupStatus,
    markerStatus: sideEffectRecord.markerRecord.markerStatus,
    markerCleanupStatus: unmountCleanupRecord.markerCleanup.markerStatus,
    listenerRegistrationStatus:
      sideEffectRecord.listenerRegistration.registrationStatus,
    listenerCleanupStatus:
      unmountCleanupRecord.listenerCleanup.registrationStatus,
    admissionId: admissionRecord.admissionId,
    admissionSequence: admissionRecord.admissionSequence,
    admissionStatus: admissionRecord.admissionStatus,
    hostOutputHandoffId: hostOutputHandoff.handoffId,
    hostOutputHandoffSequence: hostOutputHandoff.handoffSequence,
    hostOutputHandoffStatus: hostOutputHandoff.handoffStatus,
    hostType: hostOutputHandoff.hostType,
    hostNodeInfo: hostOutputHandoff.hostNodeInfo,
    textNodeInfo: hostOutputHandoff.textNodeInfo,
    containerChildCountBeforeUnmount: hostOutputHandoff.containerChildCount,
    hostChildCountBeforeUnmount: hostOutputHandoff.hostChildCount,
    textContent: hostOutputHandoff.textContent,
    unmountCleanupId: unmountCleanupRecord.cleanupId,
    unmountCleanupSequence: unmountCleanupRecord.cleanupSequence,
    unmountCleanupStatus: unmountCleanupRecord.cleanupStatus,
    fakeDomCleanup: unmountCleanupRecord.fakeDomCleanup,
    removedRootChildCount:
      unmountCleanupRecord.fakeDomCleanup.removedRootChildCount,
    detachedHostInstanceCount:
      unmountCleanupRecord.fakeDomCleanup.detachedHostInstanceCount,
    containerChildCountAfterCleanup: getChildNodeCount(
      unmountCleanupPayload.container
    ),
    acceptedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_BLOCKED_CAPABILITIES,
    privateFacadeRoot: true,
    publicCreateRootEnabled: false,
    publicHydrateRootEnabled: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    publicRootExecution: false,
    publicRootCompatibilitySurface: false,
    publicRootUnmounted: false,
    publicRootBehaviorChanged: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    fakeDomMutation: true,
    domMutation: true,
    browserDomMutation: false,
    rootContainerChildrenCleared: true,
    componentTreeMetadataDetached: true,
    rootMarkerReverted: true,
    rootListenersReverted: true,
    markerWrites: false,
    listenerInstallation: false,
    setupMarkerWrites: true,
    setupListenerInstallation: true,
    cleanupCompleted: true,
    hydration: false,
    eventDispatch: false,
    refEffects: false,
    compatibilityClaimed: false,
    cleanupRequired: false
  });

  rootPublicFacadeHostOutputUnmountCleanupPayloads.set(diagnosticRecord, {
    adapter: payload.adapter,
    admissionRecord,
    bridge: payload.bridge,
    container: createPayload.container,
    createRecord,
    element,
    hostOutputHandoff,
    hostOutputPayload,
    renderCallback,
    renderRecord,
    root: payload.root,
    rootHandle: payload.rootHandle,
    sideEffectRecord,
    unmountCallback,
    unmountCleanupPayload,
    unmountCleanupRecord,
    unmountRecord
  });
  payload.hostOutputUnmountCleanupRecords.push(diagnosticRecord);
  return diagnosticRecord;
}

function createClientRootRecord(container, rootOptions) {
  return defaultBridgeShell.createClientRoot(container, rootOptions);
}

function createHydrateRootRecord(container, initialChildren, hydrationOptions) {
  return defaultBridgeShell.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
}

function createRootUpdateRecord(rootHandle, element, callback) {
  const state = assertPrivateRootHandle(rootHandle);
  return createRootUpdateRecordWithBridge(
    state.bridgeState,
    rootHandle,
    'render',
    false,
    element,
    callback
  );
}

function createRootRenderRecord(rootHandle, element, callback) {
  return createRootUpdateRecord(rootHandle, element, callback);
}

function createRootUnmountRecord(rootHandle, callback) {
  const state = assertPrivateRootHandle(rootHandle);
  return createRootUpdateRecordWithBridge(
    state.bridgeState,
    rootHandle,
    'unmount',
    true,
    null,
    callback
  );
}

function admitRootBridgeRequestRecord(record) {
  return admitRootBridgeRequestWithBridge(null, record);
}

function admitPrivateCreateRenderPath(
  createRecord,
  sideEffectRecord,
  renderRecord
) {
  return admitPrivateCreateRenderPathWithBridge(
    null,
    createRecord,
    sideEffectRecord,
    renderRecord
  );
}

function applyPrivateInitialRenderHostOutput(admissionRecord) {
  return applyPrivateInitialRenderHostOutputWithBridge(null, admissionRecord);
}

function cleanupPrivateInitialRenderHostOutput(handoffRecord) {
  return cleanupPrivateInitialRenderHostOutputWithBridge(null, handoffRecord);
}

function createNativeRootBridgeHandoffRecord(record) {
  return createNativeRootBridgeHandoffRecordWithBridge(null, record);
}

function applyPrivateCreateRootSideEffects(record, options) {
  return applyPrivateCreateRootSideEffectsWithBridge(null, record, options);
}

function revertPrivateCreateRootSideEffects(record) {
  return revertPrivateCreateRootSideEffectsWithBridge(null, record);
}

function createPortalRootBoundaryRecord(record) {
  return createPortalRootBoundaryRecordWithBridge(null, record);
}

function createPortalPrepareMountListenerIntentRecord(record, options) {
  return createPortalPrepareMountListenerIntentRecordWithBridge(
    null,
    record,
    options
  );
}

function createPortalCommitHandoffRecord(record, options) {
  return createPortalCommitHandoffRecordWithBridge(null, record, options);
}

function cleanupPrivateRootUnmountHostOutput(admissionRecord, unmountRecord) {
  return cleanupPrivateRootUnmountHostOutputWithBridge(
    null,
    admissionRecord,
    unmountRecord
  );
}

function createPortalFakeDomMountDiagnosticRecord(record, options) {
  return createPortalFakeDomMountDiagnosticRecordWithBridge(
    null,
    record,
    options
  );
}

function createPortalChildReconciliationDiagnosticRecord(
  mountRecord,
  boundaryRecord,
  options
) {
  return createPortalChildReconciliationDiagnosticRecordWithBridge(
    null,
    mountRecord,
    boundaryRecord,
    options
  );
}

function createPortalEventOwnerRootGateRecord(mountRecord, options) {
  return createPortalEventOwnerRootGateRecordWithBridge(
    null,
    mountRecord,
    options
  );
}

function createRefCallbackHostOutputOrderingDiagnosticRecord(
  rootRequestRecords,
  options
) {
  return createRefCallbackHostOutputOrderingDiagnosticRecordWithBridge(
    null,
    rootRequestRecords,
    options
  );
}

function createRefCallbackRootErrorRoutingRecord(rootRequestRecords, options) {
  return createRefCallbackRootErrorRoutingRecordWithBridge(
    null,
    rootRequestRecords,
    options
  );
}

function createEventListenerRootErrorRoutingRecord(
  rootRequestRecords,
  eventDispatchCanaryRecord,
  options
) {
  return createEventListenerRootErrorRoutingRecordWithBridge(
    null,
    rootRequestRecords,
    eventDispatchCanaryRecord,
    options
  );
}

function createHydrationReplayErrorMetadataRecord(
  hydrateRootRecord,
  ownershipDiagnostics,
  options
) {
  return createHydrationReplayErrorMetadataRecordWithBridge(
    null,
    hydrateRootRecord,
    ownershipDiagnostics,
    options
  );
}

function applyPrivateRootHostOutputUpdate(record, options) {
  return applyPrivateRootHostOutputUpdateWithBridge(null, record, options);
}

function applyPrivateRootCommitHostComponentUpdate(
  record,
  rootCommitHostComponentUpdateMetadata,
  options
) {
  return applyPrivateRootCommitHostComponentUpdateWithBridge(
    null,
    record,
    rootCommitHostComponentUpdateMetadata,
    options
  );
}

function admitPrivateRootCommitRefMetadata(
  record,
  rootCommitRefMetadata,
  options
) {
  return admitPrivateRootCommitRefMetadataWithBridge(
    null,
    record,
    rootCommitRefMetadata,
    options
  );
}
function admitRootBridgeRequestWithBridge(bridgeState, record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  return createRootBridgeAdmissionRecord(record, validation);
}

function admitPrivateCreateRenderPathWithBridge(
  bridgeState,
  createRecord,
  sideEffectRecord,
  renderRecord
) {
  const createValidation = validateRootBridgeRequestRecord(createRecord);
  const renderValidation = validateRootBridgeRequestRecord(renderRecord);
  if (createValidation.operation !== 'create') {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM createRoot record for create/render admission.'
    );
  }
  if (renderValidation.operation !== 'render') {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM root.render record for create/render admission.'
    );
  }
  if (bridgeState !== null && createValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (bridgeState !== null && renderValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (createValidation.bridgeState !== renderValidation.bridgeState) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission records must belong to the same root bridge shell.'
    );
  }

  const sideEffectValidation = validateCreateRenderSideEffectRecord(
    sideEffectRecord,
    createRecord,
    createValidation
  );
  if (
    bridgeState !== null &&
    sideEffectValidation.bridgeState !== bridgeState
  ) {
    throwForeignRootBridgeRequest();
  }

  const renderPayload = rootRecordPayloads.get(renderRecord);
  if (renderPayload.rootHandle !== createRecord.handle) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires a render record for the created root handle.'
    );
  }
  if (createRecord.requestSequence >= renderRecord.requestSequence) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires createRoot before root.render.'
    );
  }

  const existing = rootCreateRenderAdmissionRecords.get(renderRecord);
  if (existing !== undefined) {
    const existingPayload = rootCreateRenderAdmissionPayloads.get(existing);
    if (
      existingPayload !== undefined &&
      existingPayload.sideEffectRecord === sideEffectRecord
    ) {
      return existing;
    }
  }

  const rootBridgeState = createValidation.bridgeState;
  const sequence = rootBridgeState.nextCreateRenderAdmissionSequence++;
  const admissionId = `${rootBridgeState.createRenderAdmissionIdPrefix}:${sequence}`;
  const createAdmission = createRootBridgeAdmissionRecord(
    createRecord,
    createValidation
  );
  const renderAdmission = createRootBridgeAdmissionRecord(
    renderRecord,
    renderValidation
  );
  const admissionRecord = freezeRecord({
    $$typeof: privateRootCreateRenderAdmissionRecordType,
    kind: 'FastReactDomPrivateRootCreateRenderAdmissionRecord',
    operation: 'create-render',
    admissionId,
    admissionSequence: sequence,
    admissionStatus: ROOT_BRIDGE_CREATE_RENDER_ADMITTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    rootId: createRecord.rootId,
    rootKind: createRecord.rootKind,
    rootTag: createRecord.rootTag,
    createRequestId: createRecord.requestId,
    createRequestSequence: createRecord.requestSequence,
    createRequestType: createRecord.requestType,
    renderRequestId: renderRecord.requestId,
    renderRequestSequence: renderRecord.requestSequence,
    renderRequestType: renderRecord.requestType,
    renderUpdateId: renderRecord.updateId,
    sideEffectId: sideEffectRecord.sideEffectId,
    sideEffectSequence: sideEffectRecord.sideEffectSequence,
    sideEffectStatus: sideEffectRecord.sideEffectStatus,
    createAdmission,
    renderAdmission,
    markerRecord: sideEffectRecord.markerRecord,
    listenerRegistration: sideEffectRecord.listenerRegistration,
    createRootPrerequisites: freezeRecord({
      accepted: true,
      createRequestAccepted: true,
      markListenAccepted: true,
      markerStatus: sideEffectRecord.markerRecord.markerStatus,
      listenerRegistrationStatus:
        sideEffectRecord.listenerRegistration.registrationStatus,
      rootMarkerMatchesOwner: true,
      rootListeningMarkerPresent:
        sideEffectValidation.rootListeningMarkerPresent,
      ownerDocumentListeningMarkerPresent:
        sideEffectValidation.ownerDocumentListeningMarkerPresent,
      sideEffectActiveAtAdmission: true
    }),
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: createRecord.lifecycleStatusBefore,
      lifecycleStatusAfter: renderRecord.lifecycleStatusAfter,
      lifecycleTransition: 'none->created->rendered',
      operation: 'create-render',
      rootKind: createRecord.rootKind,
      rootTag: createRecord.rootTag
    }),
    acceptedCapabilities: ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: true,
    listenerInstallation: true,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootCreateRenderAdmissionRecords.set(renderRecord, admissionRecord);
  rootCreateRenderAdmissionPayloads.set(admissionRecord, {
    bridgeState: rootBridgeState,
    container: sideEffectValidation.container,
    createRecord,
    element: renderPayload.element,
    renderRecord,
    sideEffectRecord
  });
  renderValidation.rootHandleState.createRenderAdmissionRecord =
    admissionRecord;

  return admissionRecord;
}

function applyPrivateInitialRenderHostOutputWithBridge(
  bridgeState,
  admissionRecord
) {
  const validation = validateInitialHostOutputAdmissionRecord(
    bridgeState,
    admissionRecord
  );
  const existing = rootInitialHostOutputHandoffRecords.get(admissionRecord);
  if (existing !== undefined) {
    const existingPayload = rootInitialHostOutputHandoffPayloads.get(existing);
    if (existingPayload && existingPayload.active) {
      return existing;
    }
  }

  assertInitialHostOutputContainerCanReceiveRootChild(validation.container);

  const rootBridgeState = validation.bridgeState;
  const sequence = rootBridgeState.nextInitialHostOutputSequence++;
  const handoffId = `${rootBridgeState.initialHostOutputIdPrefix}:${sequence}`;
  const hostOutput = normalizeInitialHostOutputElement(validation.element);
  const hostOwner = freezeRecord({
    kind: 'FastReactDomPrivateInitialHostComponentOwner',
    handoffId,
    hostType: hostOutput.type,
    renderUpdateId: validation.renderRecord.updateId
  });
  const textOwner = freezeRecord({
    kind: 'FastReactDomPrivateInitialHostTextOwner',
    handoffId,
    hostType: hostOutput.type,
    renderUpdateId: validation.renderRecord.updateId
  });
  let hostNode = null;
  let textNode = null;
  let hostToken = null;
  let textToken = null;
  let latestPropsMutationHandoff = null;
  let latestPropsMutationPayload = null;
  let latestPropsBeforeCommit = null;
  let latestPropsAfterCommit = null;
  let hostAppendedToContainer = false;
  let textAppendedToHost = false;

  try {
    hostNode = createDomHostElementInstance(
      hostOutput.type,
      validation.container
    );
    hostToken = createHostInstanceToken(hostOwner, validation.rootOwner);
    attachHostInstanceNode(hostNode, hostToken, hostOutput.previousProps);

    latestPropsMutationHandoff = commitDomPropertyUpdateForLatestProps(
      hostNode,
      hostOutput.type,
      hostOutput.previousProps,
      hostOutput.nextProps
    );
    latestPropsMutationPayload =
      getDomPropertyUpdateLatestPropsHandoffPayload(
        latestPropsMutationHandoff
      );
    latestPropsBeforeCommit = getLatestPropsFromNode(hostNode);
    latestPropsAfterCommit = requireLatestPropsCommitResult(
      latestPropsMutationHandoff
    );

    textNode = createDomHostTextInstance(
      hostOutput.text,
      validation.container
    );
    textToken = createHostInstanceToken(textOwner, validation.rootOwner);
    attachHostInstanceNode(textNode, textToken, null);
    appendInitialChild(hostNode, textNode);
    textAppendedToHost = true;
    appendChildToContainer(validation.container, hostNode);
    hostAppendedToContainer = true;
  } catch (error) {
    rollbackPartialInitialHostOutput({
      container: validation.container,
      hostAppendedToContainer,
      hostNode,
      latestPropsMutationHandoff,
      textAppendedToHost,
      textNode
    });
    throw error;
  }

  const handoff = freezeRecord({
    $$typeof: privateRootInitialHostOutputHandoffRecordType,
    kind: 'FastReactDomPrivateRootInitialHostOutputHandoffRecord',
    operation: 'initial-host-output',
    handoffId,
    handoffSequence: sequence,
    handoffStatus: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED,
    sourceAdmissionId: admissionRecord.admissionId,
    sourceAdmissionSequence: admissionRecord.admissionSequence,
    sourceAdmissionStatus: admissionRecord.admissionStatus,
    createRequestId: admissionRecord.createRequestId,
    createRequestSequence: admissionRecord.createRequestSequence,
    renderRequestId: admissionRecord.renderRequestId,
    renderRequestSequence: admissionRecord.renderRequestSequence,
    renderUpdateId: admissionRecord.renderUpdateId,
    sideEffectId: admissionRecord.sideEffectId,
    rootId: admissionRecord.rootId,
    rootKind: admissionRecord.rootKind,
    rootTag: admissionRecord.rootTag,
    hostType: hostOutput.type,
    hostNodeInfo: freezeRecord(describeContainer(hostNode)),
    textNodeInfo: freezeRecord(describeContainer(textNode)),
    containerChildCount: getChildNodeCount(validation.container),
    hostChildCount: getChildNodeCount(hostNode),
    textContent: hostOutput.text,
    acceptedCapabilities: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES,
    cleanupRequired: true,
    cleanupApplied: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: true,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootInitialHostOutputHandoffRecords.set(admissionRecord, handoff);
  rootInitialHostOutputHandoffPayloads.set(handoff, {
    active: true,
    admissionRecord,
    bridgeState: rootBridgeState,
    container: validation.container,
    createRecord: validation.createRecord,
    element: validation.element,
    hostNode,
    hostToken,
    latestPropsAfterCommit,
    latestPropsBeforeCommit,
    latestPropsMutationHandoff,
    latestPropsMutationPayload,
    nextProps: hostOutput.nextProps,
    renderRecord: validation.renderRecord,
    rootOwner: validation.rootOwner,
    sideEffectRecord: validation.sideEffectRecord,
    textNode,
    textToken
  });

  return handoff;
}

function cleanupPrivateInitialRenderHostOutputWithBridge(
  bridgeState,
  handoffRecord
) {
  const payload = rootInitialHostOutputHandoffPayloads.get(handoffRecord);
  if (payload === undefined) {
    throwInvalidInitialHostOutputHandoff(
      'Expected a private React DOM initial host-output handoff record.'
    );
  }
  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const existingCleanup =
    rootInitialHostOutputCleanupRecords.get(handoffRecord);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  const cleanupResult = cleanupInitialHostOutputPayload(payload);
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootInitialHostOutputCleanupRecordType,
    kind: 'FastReactDomPrivateRootInitialHostOutputCleanupRecord',
    operation: 'initial-host-output-cleanup',
    cleanupStatus: ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED,
    sourceHandoffId: handoffRecord.handoffId,
    sourceHandoffSequence: handoffRecord.handoffSequence,
    sourceHandoffStatus: handoffRecord.handoffStatus,
    sourceAdmissionId: handoffRecord.sourceAdmissionId,
    rootId: handoffRecord.rootId,
    rootKind: handoffRecord.rootKind,
    rootTag: handoffRecord.rootTag,
    removedRootChild: cleanupResult.removedRootChild,
    detachedHostInstanceCount: cleanupResult.detachedHostInstanceCount,
    containerChildCountAfterCleanup:
      cleanupResult.containerChildCountAfterCleanup,
    cleanupRequired: false,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: cleanupResult.removedRootChild,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootInitialHostOutputCleanupRecords.set(handoffRecord, cleanupRecord);
  return cleanupRecord;
}

function applyPrivateRootHostOutputUpdateWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validateHostOutputUpdateRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const existing = rootHostOutputUpdateHandoffRecords.get(record);
  if (existing !== undefined) {
    return existing;
  }

  const payload = rootRecordPayloads.get(record);
  const normalized = normalizeHostOutputUpdateOptions(options);
  const hostNode = assertMountedHostInstanceToken(normalized.hostInstanceToken);
  const hostRootOwner = getRootOwnerFromHostInstanceToken(
    normalized.hostInstanceToken
  );
  if (hostRootOwner !== payload.rootHandle.owner) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require a host instance owned by the updated root.'
    );
  }

  const previousProps = getLatestPropsFromHostInstanceToken(
    normalized.hostInstanceToken
  );
  if (normalized.textUpdate === null) {
    assertHostOutputChildrenStableWithoutTextUpdate(
      previousProps,
      normalized.nextProps
    );
  } else {
    assertHostOutputTextInstanceBelongsToHost(
      hostNode,
      normalized.textUpdate.textInstance
    );
    assertHostOutputTextPropsMatch(
      previousProps,
      normalized.textUpdate.oldText,
      'previous'
    );
    assertHostOutputTextPropsMatch(
      normalized.nextProps,
      normalized.textUpdate.newText,
      'next'
    );
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextHostOutputUpdateSequence++;
  const handoffId = `${rootBridgeState.hostOutputUpdateIdPrefix}:${sequence}`;
  let propertyHandoff = null;
  let propertyHandoffPayload = null;
  let propertyMutationEvidence = null;
  let publishedLatestProps = null;

  try {
    propertyHandoff = commitDomPropertyUpdateForLatestProps(
      hostNode,
      normalized.tag,
      previousProps,
      normalized.nextProps
    );
    propertyHandoffPayload =
      getDomPropertyUpdateLatestPropsHandoffPayload(propertyHandoff);
    propertyMutationEvidence =
      createHostOutputPropertyMutationEvidence(propertyHandoffPayload);
    if (
      normalized.textUpdate === null &&
      propertyMutationEvidence.mutatingRowCount === 0
    ) {
      throwInvalidHostOutputUpdateHandoff(
        'Private root host-output updates without a text update require at least one mutating property-payload row.'
      );
    }

    if (normalized.textUpdate !== null) {
      commitTextUpdate(
        normalized.textUpdate.textInstance,
        normalized.textUpdate.oldText,
        normalized.textUpdate.newText
      );
    }

    publishedLatestProps =
      commitLatestPropsFromMutationHandoff(propertyHandoff);
  } catch (error) {
    if (propertyHandoff !== null) {
      try {
        rollbackDomPropertyUpdateLatestPropsHandoff(propertyHandoff);
      } catch (rollbackError) {
        error.rollbackError = {
          code: rollbackError.code || null,
          message: rollbackError.message
        };
      }
    }
    throw error;
  }

  const latestPropsPublished = publishedLatestProps === normalized.nextProps;
  const latestPropsCommitRecord =
    propertyHandoffPayload === null
      ? null
      : propertyHandoffPayload.latestPropsCommitRecord;
  if (propertyMutationEvidence === null) {
    propertyMutationEvidence =
      createHostOutputPropertyMutationEvidence(propertyHandoffPayload);
  }
  const textMutation = createHostOutputTextMutationSummary(
    normalized.textUpdate
  );
  const acceptedCapabilities =
    createHostOutputUpdateAcceptedCapabilities(
      propertyMutationEvidence,
      normalized.textUpdate !== null
    );
  const handoff = freezeRecord({
    $$typeof: privateRootHostOutputUpdateHandoffRecordType,
    kind: 'FastReactDomPrivateRootHostOutputUpdateHandoffRecord',
    operation: 'root-host-output-update',
    handoffId,
    handoffSequence: sequence,
    updateStatus: ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceUpdateId: record.updateId,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    hostTag: normalized.tag,
    propertyMutation: freezeRecord({
      handoffKind: propertyHandoff.kind,
      latestPropsCommitRecordKind:
        latestPropsCommitRecord === null ? null : latestPropsCommitRecord.kind,
      latestPropsCommitRecordStatus:
        latestPropsCommitRecord === null
          ? null
          : latestPropsCommitRecord.status,
      mutationRecordCount:
        propertyHandoffPayload === null
          ? 0
          : propertyHandoffPayload.mutationRecords.length,
      payloadCount: propertyHandoff.payloadCount,
      propertyPayloadEvidence: propertyMutationEvidence,
      status: propertyHandoff.status
    }),
    textMutation,
    latestPropsPublished,
    latestPropsPublishOrder:
      normalized.textUpdate === null
        ? 'after-property-mutation'
        : 'after-property-and-text-mutation',
    acceptedCapabilities,
    blockedCapabilities: ROOT_BRIDGE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    fakeDomMutation: true,
    domMutation: true,
    browserDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    refEffects: false,
    compatibilityClaimed: false
  });

  rootHostOutputUpdateHandoffRecords.set(record, handoff);
  rootHostOutputUpdateHandoffPayloads.set(handoff, {
    bridgeState: rootBridgeState,
    hostInstanceNode: hostNode,
    hostInstanceToken: normalized.hostInstanceToken,
    latestPropsCommitRecord,
    latestPropsPublished,
    nextProps: normalized.nextProps,
    previousProps,
    propertyHandoff,
    propertyHandoffPayload,
    propertyMutationEvidence,
    rootHandle: payload.rootHandle,
    sourceRecord: record,
    textInstance:
      normalized.textUpdate === null
        ? null
        : normalized.textUpdate.textInstance,
    textUpdate:
      normalized.textUpdate === null
        ? null
        : {
            newText: normalized.textUpdate.newText,
            oldText: normalized.textUpdate.oldText
          }
  });

  return handoff;
}

function applyPrivateRootCommitHostComponentUpdateWithBridge(
  bridgeState,
  record,
  rootCommitHostComponentUpdateMetadata,
  options
) {
  const validation = validateHostOutputUpdateRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const existing = rootCommitHostComponentUpdateHandoffRecords.get(record);
  if (existing !== undefined) {
    return existing;
  }

  const normalized = normalizeRootCommitHostComponentUpdateOptions(options);
  const metadata = normalizeRootCommitHostComponentUpdateMetadata(
    rootCommitHostComponentUpdateMetadata,
    normalized
  );
  const hostOutputHandoff = applyPrivateRootHostOutputUpdateWithBridge(
    bridgeState,
    record,
    {
      hostInstanceToken: normalized.hostInstanceToken,
      nextProps: normalized.nextProps,
      tag: normalized.tag,
      textUpdate: null
    }
  );
  const hostOutputPayload =
    rootHostOutputUpdateHandoffPayloads.get(hostOutputHandoff);
  if (hostOutputPayload === undefined) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require an applied host-output update handoff.'
    );
  }
  if (
    hostOutputPayload.hostInstanceToken !== normalized.hostInstanceToken ||
    hostOutputPayload.nextProps !== normalized.nextProps ||
    hostOutputPayload.textUpdate !== null
  ) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require a property-only host-output update for the selected host instance.'
    );
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence =
    rootBridgeState.nextRootCommitHostComponentUpdateSequence++;
  const handoffId =
    `${rootBridgeState.rootCommitHostComponentUpdateIdPrefix}:${sequence}`;
  const acceptedCapabilities =
    createRootCommitHostComponentUpdateAcceptedCapabilities(
      hostOutputHandoff
    );
  const latestPropsPublished =
    hostOutputHandoff.latestPropsPublished === true;
  const handoff = freezeRecord({
    $$typeof: privateRootCommitHostComponentUpdateHandoffRecordType,
    kind: 'FastReactDomPrivateRootCommitHostComponentUpdateHandoffRecord',
    operation: 'root-commit-host-component-update',
    handoffId,
    handoffSequence: sequence,
    updateStatus: ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceUpdateId: record.updateId,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    hostTag: normalized.tag,
    rootCommitMetadataSource: metadata.source,
    rootCommitMetadataRecordCount: metadata.recordCount,
    rootCommitHostComponentUpdateRecordCount:
      metadata.hostComponentUpdateRecordCount,
    rootCommitHostComponentUpdate:
      metadata.selected.publicRecord,
    hostOutputUpdateHandoffId: hostOutputHandoff.handoffId,
    hostOutputUpdateStatus: hostOutputHandoff.updateStatus,
    propertyMutation: hostOutputHandoff.propertyMutation,
    textMutation: hostOutputHandoff.textMutation,
    latestPropsPublished,
    latestPropsPublishOrder: hostOutputHandoff.latestPropsPublishOrder,
    acceptedCapabilities,
    blockedCapabilities:
      ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_BLOCKED_CAPABILITIES,
    publicRootCreated: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    fakeDomMutation: true,
    domMutation: true,
    browserDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    refEffects: false,
    compatibilityClaimed: false
  });

  rootCommitHostComponentUpdateHandoffRecords.set(record, handoff);
  rootCommitHostComponentUpdateHandoffPayloads.set(handoff, {
    bridgeState: rootBridgeState,
    hostInstanceNode: hostOutputPayload.hostInstanceNode,
    hostInstanceToken: normalized.hostInstanceToken,
    hostOutputHandoff,
    hostOutputPayload,
    latestPropsPublished,
    nextProps: normalized.nextProps,
    previousProps: hostOutputPayload.previousProps,
    propertyHandoff: hostOutputPayload.propertyHandoff,
    propertyHandoffPayload: hostOutputPayload.propertyHandoffPayload,
    propertyMutationEvidence: hostOutputPayload.propertyMutationEvidence,
    rootCommitMetadata: rootCommitHostComponentUpdateMetadata,
    rootCommitMetadataSelection: metadata.selected,
    rootHandle: hostOutputPayload.rootHandle,
    selectedRootCommitRecord: metadata.selected.record,
    sourceRecord: record
  });

  return handoff;
}

function createNativeRootBridgeHandoffRecordWithBridge(bridgeState, record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }
  if (validation.operation === 'hydrate') {
    throwInvalidRootBridgeRequest(
      'Private hydrateRoot bridge records are diagnostic-only and cannot be handed to the native root bridge.'
    );
  }

  const existing = rootNativeHandoffRecords.get(record);
  if (existing !== undefined) {
    return existing;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const handoffSequence = record.requestSequence;
  const payload = rootRecordPayloads.get(record) || null;
  const nativeRequestRecord = createNativeRequestRecordMirror(
    record,
    validation.rootHandleState,
    payload
  );
  const handoff = freezeRecord({
    $$typeof: privateRootNativeHandoffRecordType,
    kind: 'FastReactDomPrivateRootNativeRequestHandoffRecord',
    operation: record.operation,
    handoffId: `${rootBridgeState.nativeHandoffIdPrefix}:${handoffSequence}`,
    handoffSequence,
    handoffStatus: ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    nativeRequestRecord,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootNativeHandoffRecords.set(record, handoff);
  rootNativeHandoffPayloads.set(handoff, {
    sourcePayload: payload,
    sourceRecord: record,
    value: getNativeHandoffSourceValue(record, payload)
  });

  return handoff;
}

function applyPrivateCreateRootSideEffectsWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validateCreateRootSideEffectRequest(record);
  const rootBridgeState = validation.rootHandleState.bridgeState;
  if (bridgeState !== null && rootBridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root bridge request with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const existing = rootCreateSideEffectRecords.get(record);
  if (existing !== undefined) {
    const existingPayload = rootCreateSideEffectPayloads.get(existing);
    if (existingPayload && existingPayload.active) {
      return existing;
    }
  }

  const sourcePayload = rootRecordPayloads.get(record);
  const container = sourcePayload.container;
  const sideEffectSequence = rootBridgeState.nextSideEffectSequence++;
  const sideEffectId = `${rootBridgeState.sideEffectIdPrefix}:${sideEffectSequence}`;
  let markerRecord = null;
  let listenerRegistration = null;

  try {
    markerRecord = markContainerAsRootWithRevertRecord(
      record.owner,
      container,
      rootBridgeState.markerOptions
    );
    listenerRegistration = registerRootListenersForPrivateRoot(
      container,
      getCreateRootSideEffectListenerOptions(options)
    );
  } catch (error) {
    if (markerRecord !== null) {
      try {
        revertContainerRootMarkerMutation(markerRecord);
      } catch (cleanupError) {
        error.cleanupError = {
          code: cleanupError.code || null,
          message: cleanupError.message
        };
      }
    }
    throw error;
  }

  const sideEffectRecord = freezeRecord({
    $$typeof: privateRootCreateSideEffectRecordType,
    kind: 'FastReactDomPrivateRootCreateSideEffectRecord',
    operation: 'create',
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    sideEffectId,
    sideEffectSequence,
    sideEffectStatus: ROOT_BRIDGE_MARK_LISTEN_APPLIED,
    markerRecord,
    listenerRegistration,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: true,
    listenerInstallation: true,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    reversible: true
  });

  rootCreateSideEffectRecords.set(record, sideEffectRecord);
  rootCreateSideEffectPayloads.set(sideEffectRecord, {
    active: true,
    bridgeState: rootBridgeState,
    container,
    listenerRegistration,
    markerRecord,
    sourceRecord: record
  });

  return sideEffectRecord;
}

function revertPrivateCreateRootSideEffectsWithBridge(bridgeState, record) {
  const payload = rootCreateSideEffectPayloads.get(record);
  if (payload === undefined) {
    const error = new Error(
      'Expected a private React DOM createRoot side-effect record.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_SIDE_EFFECT_RECORD';
    throw error;
  }

  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot revert a private root bridge side-effect record with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const existingCleanup = rootCreateSideEffectCleanupRecords.get(record);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  const listenerCleanup = revertRootListenersForPrivateRoot(
    payload.listenerRegistration
  );
  const markerCleanup = revertContainerRootMarkerMutation(payload.markerRecord);
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootCreateSideEffectCleanupRecordType,
    kind: 'FastReactDomPrivateRootCreateSideEffectCleanupRecord',
    operation: 'create',
    requestId: payload.sourceRecord.requestId,
    requestSequence: payload.sourceRecord.requestSequence,
    requestType: payload.sourceRecord.requestType,
    rootId: payload.sourceRecord.rootId,
    rootKind: payload.sourceRecord.rootKind,
    rootTag: payload.sourceRecord.rootTag,
    sideEffectId: record.sideEffectId,
    sideEffectSequence: record.sideEffectSequence,
    sideEffectStatus: ROOT_BRIDGE_MARK_LISTEN_REVERTED,
    markerCleanup,
    listenerCleanup,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    reversible: false
  });

  rootCreateSideEffectCleanupRecords.set(record, cleanupRecord);
  return cleanupRecord;
}

function createPrivateRootOwner(rootId, options) {
  if (typeof rootId !== 'string' || rootId.length === 0) {
    const error = new Error(
      'Cannot create a private root owner without a root id.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_ID';
    throw error;
  }

  const owner = Object.freeze({
    $$typeof: privateRootOwnerType,
    kind: 'FastReactDomPrivateRootOwner',
    rootId,
    rootKind: getRootKind(options),
    rootTag: getRootTag(options)
  });
  rootOwnerState.set(owner, {
    rootId: owner.rootId,
    rootKind: owner.rootKind,
    rootTag: owner.rootTag
  });
  return owner;
}

function createPrivateRootHandle(owner, container, rootOptions, bridgeState) {
  const ownerState = assertPrivateRootOwner(owner);
  const rootBridgeState = bridgeState || createBridgeState();
  assertValidContainer(container, rootBridgeState.validationOptions);
  const nativeRootId = rootBridgeState.nextNativeRootId++;
  const nativeRootHandle = createNativeBridgeHandle(
    rootBridgeState,
    NATIVE_ROOT_BRIDGE_HANDLE_ROOT
  );

  const handle = Object.freeze({
    $$typeof: privateRootHandleType,
    kind: 'FastReactDomPrivateRootHandle',
    rootId: ownerState.rootId,
    rootKind: ownerState.rootKind,
    rootTag: ownerState.rootTag,
    owner
  });

  rootHandleState.set(handle, {
    bridgeState: rootBridgeState,
    container,
    containerInfo: freezeRecord(describeContainer(container)),
    createRenderAdmissionRecord: null,
    lifecycleStatus: ROOT_LIFECYCLE_CREATED,
    nativeRootHandle,
    nativeRootId,
    renderCount: 0,
    rootOptions
  });

  return handle;
}

function isPrivateRootOwner(value) {
  return rootOwnerState.has(value);
}

function isPrivateRootHandle(value) {
  return rootHandleState.has(value);
}

function getRootOwnerFromHandle(rootHandle) {
  return assertPrivateRootHandle(rootHandle).owner;
}

function getPrivateRootRecordPayload(record) {
  return rootRecordPayloads.get(record) || null;
}

function getNativeRootBridgeHandoffPayload(record) {
  return rootNativeHandoffPayloads.get(record) || null;
}

function isNativeRootBridgeHandoffRecord(value) {
  return rootNativeHandoffPayloads.has(value);
}

function getPrivateRootCreateRenderAdmissionPayload(record) {
  return rootCreateRenderAdmissionPayloads.get(record) || null;
}

function isPrivateRootCreateRenderAdmissionRecord(value) {
  return rootCreateRenderAdmissionPayloads.has(value);
}

function getPrivateRootInitialHostOutputHandoffPayload(record) {
  return rootInitialHostOutputHandoffPayloads.get(record) || null;
}

function isPrivateRootInitialHostOutputHandoffRecord(value) {
  return rootInitialHostOutputHandoffPayloads.has(value);
}

function getPrivateRootPortalBoundaryPayload(record) {
  return rootPortalBoundaryPayloads.get(record) || null;
}

function isPrivateRootPortalBoundaryRecord(value) {
  return rootPortalBoundaryPayloads.has(value);
}

function getPrivateRootPortalPrepareMountListenerIntentPayload(record) {
  return rootPortalPrepareMountListenerIntentPayloads.get(record) || null;
}

function isPrivateRootPortalPrepareMountListenerIntentRecord(value) {
  return rootPortalPrepareMountListenerIntentPayloads.has(value);
}

function getPrivateRootPortalCommitHandoffPayload(record) {
  return rootPortalCommitHandoffPayloads.get(record) || null;
}

function isPrivateRootPortalCommitHandoffRecord(value) {
  return rootPortalCommitHandoffPayloads.has(value);
}

function getPrivateRootUnmountHostOutputCleanupPayload(record) {
  return rootUnmountHostOutputCleanupPayloads.get(record) || null;
}

function isPrivateRootUnmountHostOutputCleanupRecord(value) {
  return rootUnmountHostOutputCleanupPayloads.has(value);
}

function getPrivateRootPortalFakeDomMountPayload(record) {
  return rootPortalFakeDomMountPayloads.get(record) || null;
}

function isPrivateRootPortalFakeDomMountRecord(value) {
  return rootPortalFakeDomMountPayloads.has(value);
}

function getPrivateRootPortalChildReconciliationDiagnosticPayload(record) {
  return rootPortalChildReconciliationDiagnosticPayloads.get(record) || null;
}

function isPrivateRootPortalChildReconciliationDiagnosticRecord(value) {
  return rootPortalChildReconciliationDiagnosticPayloads.has(value);
}

function getPrivateRootPortalEventOwnerRootGatePayload(record) {
  return rootPortalEventOwnerRootGatePayloads.get(record) || null;
}

function isPrivateRootPortalEventOwnerRootGateRecord(value) {
  return rootPortalEventOwnerRootGatePayloads.has(value);
}

function getPrivateRootHostOutputUpdateHandoffPayload(record) {
  return rootHostOutputUpdateHandoffPayloads.get(record) || null;
}

function isPrivateRootHostOutputUpdateHandoffRecord(value) {
  return rootHostOutputUpdateHandoffPayloads.has(value);
}

function getPrivateRootCommitHostComponentUpdateHandoffPayload(record) {
  return rootCommitHostComponentUpdateHandoffPayloads.get(record) || null;
}

function isPrivateRootCommitHostComponentUpdateHandoffRecord(value) {
  return rootCommitHostComponentUpdateHandoffPayloads.has(value);
}

function getPrivateRootCommitRefMetadataPayload(record) {
  return rootCommitRefMetadataPayloads.get(record) || null;
}

function isPrivateRootCommitRefMetadataRecord(value) {
  return rootCommitRefMetadataPayloads.has(value);
}

function getPrivateRootRefCallbackHostOutputOrderingDiagnosticPayload(record) {
  return (
    rootRefCallbackHostOutputOrderingDiagnosticPayloads.get(record) || null
  );
}

function isPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord(value) {
  return rootRefCallbackHostOutputOrderingDiagnosticPayloads.has(value);
}

function getPrivateRootRefCallbackErrorRoutingPayload(record) {
  return rootRefCallbackErrorRoutingPayloads.get(record) || null;
}

function isPrivateRootRefCallbackErrorRoutingRecord(value) {
  return rootRefCallbackErrorRoutingPayloads.has(value);
}

function getPrivateRootEventListenerErrorRoutingPayload(record) {
  return rootEventListenerErrorRoutingPayloads.get(record) || null;
}

function isPrivateRootEventListenerErrorRoutingRecord(value) {
  return rootEventListenerErrorRoutingPayloads.has(value);
}

function getPrivateRootHydrationReplayErrorMetadataPayload(record) {
  return rootHydrationReplayErrorMetadataPayloads.get(record) || null;
}

function isPrivateRootHydrationReplayErrorMetadataRecord(value) {
  return rootHydrationReplayErrorMetadataPayloads.has(value);
}

function getPrivateRootPublicFacadeAdapterPayload(adapter) {
  const payload = rootPublicFacadeAdapterPayloads.get(adapter);
  if (payload === undefined) {
    return null;
  }

  return freezeRecord({
    adapter: payload.adapter,
    bridge: payload.bridge,
    rootCount: payload.roots.length,
    roots: freezeArray(payload.roots)
  });
}

function isPrivateRootPublicFacadeAdapter(value) {
  return rootPublicFacadeAdapterPayloads.has(value);
}

function getPrivateRootPublicFacadeRootPayload(root) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    return null;
  }

  return createPrivateRootPublicFacadeRootPayloadSnapshot(payload);
}

function isPrivateRootPublicFacadeRoot(value) {
  return rootPublicFacadeRootPayloads.has(value);
}

function getPrivateRootPublicFacadePreflightPayload(preflight) {
  const payload = rootPublicFacadePreflightPayloads.get(preflight);
  if (payload === undefined) {
    return null;
  }

  return freezeRecord({
    bridge: payload.bridge,
    preflight: payload.preflight,
    preflightRecordCount: payload.records.length,
    preflightRecords: freezeArray(payload.records),
    rootCount: payload.roots.length,
    roots: freezeArray(payload.roots)
  });
}

function isPrivateRootPublicFacadePreflight(value) {
  return rootPublicFacadePreflightPayloads.has(value);
}

function getPrivateRootPublicFacadePreflightRootPayload(root) {
  const payload = rootPublicFacadePreflightRootPayloads.get(root);
  if (payload === undefined) {
    return null;
  }

  return createPrivateRootPublicFacadePreflightRootPayloadSnapshot(payload);
}

function isPrivateRootPublicFacadePreflightRoot(value) {
  return rootPublicFacadePreflightRootPayloads.has(value);
}

function getPrivateRootPublicFacadePreflightRecordPayload(record) {
  const payload = rootPublicFacadePreflightRecordPayloads.get(record);
  if (payload === undefined) {
    return null;
  }

  return freezeRecord({
    bridge: payload.bridge,
    nativeHandoffRecord: payload.nativeHandoffRecord,
    preflight: payload.preflight,
    requestAdmission: payload.requestAdmission,
    requestRecord: payload.requestRecord,
    root: payload.root
  });
}

function isPrivateRootPublicFacadePreflightRecord(value) {
  return rootPublicFacadePreflightRecordPayloads.has(value);
}

function getPrivateRootPublicFacadeMarkerListenerPreflightPayload(record) {
  return rootPublicFacadeMarkerListenerPreflightPayloads.get(record) || null;
}

function isPrivateRootPublicFacadeMarkerListenerPreflightRecord(value) {
  return rootPublicFacadeMarkerListenerPreflightPayloads.has(value);
}

function getPrivateRootPublicFacadeHostOutputRenderPayload(record) {
  return rootPublicFacadeHostOutputRenderPayloads.get(record) || null;
}

function isPrivateRootPublicFacadeHostOutputRenderRecord(value) {
  return rootPublicFacadeHostOutputRenderPayloads.has(value);
}

function getPrivateRootPublicFacadeHostOutputUpdatePayload(record) {
  return rootPublicFacadeHostOutputUpdatePayloads.get(record) || null;
}

function isPrivateRootPublicFacadeHostOutputUpdateRecord(value) {
  return rootPublicFacadeHostOutputUpdatePayloads.has(value);
}

function getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(record) {
  return (
    rootPublicFacadeHostOutputUnmountCleanupPayloads.get(record) || null
  );
}

function isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord(value) {
  return rootPublicFacadeHostOutputUnmountCleanupPayloads.has(value);
}

function createClientRootRecordWithBridge(bridgeState, container, rootOptions) {
  assertValidContainer(container, bridgeState.validationOptions);

  const sequence = bridgeState.nextRootSequence++;
  const rootId = `${bridgeState.rootIdPrefix}:${sequence}`;
  const owner = createPrivateRootOwner(rootId);
  const handle = createPrivateRootHandle(
    owner,
    container,
    rootOptions,
    bridgeState
  );
  const handleState = rootHandleState.get(handle);
  const requestInfo = createRequestInfo(bridgeState, 'createRoot');

  const record = freezeRecord({
    $$typeof: privateRootCreateRecordType,
    kind: 'FastReactDomPrivateRootCreateRecord',
    operation: 'create',
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    rootId,
    rootKind: CLIENT_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    lifecycleStatusBefore: null,
    lifecycleStatusAfter: ROOT_LIFECYCLE_CREATED,
    containerInfo: handleState.containerInfo,
    listenerGuard: describeRootListenerGuard(container),
    markerGuard: describeCreateRootMarkerGuard(
      container,
      bridgeState.markerOptions
    ),
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    rootOptionsInfo: describeBridgeValue(rootOptions),
    owner,
    handle
  });

  rootRecordPayloads.set(record, {
    container,
    nativeValueHandle: createNativeBridgeHandle(
      bridgeState,
      NATIVE_ROOT_BRIDGE_HANDLE_VALUE
    ),
    rootOptions
  });

  return record;
}

function createHydrateRootRecordWithBridge(
  bridgeState,
  container,
  initialChildren,
  hydrationOptions
) {
  const hydrationBoundaryRecord =
    bridgeState.hydrationBoundaryGate.recordUnsupportedHydrateRoot(
      container,
      initialChildren,
      hydrationOptions
    );
  const sequence = bridgeState.nextHydrateSequence++;
  const hydrateId = `${bridgeState.hydrateIdPrefix}:${sequence}`;
  const requestInfo = createRequestInfo(bridgeState, 'hydrateRoot');
  const record = freezeRecord({
    $$typeof: privateRootHydrateRecordType,
    kind: 'FastReactDomPrivateRootHydrateRecord',
    operation: 'hydrate',
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    hydrateId,
    rootId: null,
    rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    lifecycleStatusBefore: null,
    lifecycleStatusAfter: ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION,
    status: 'unsupported',
    containerInfo: hydrationBoundaryRecord.containerInfo,
    initialChildrenInfo: hydrationBoundaryRecord.initialChildrenInfo,
    optionsInfo: hydrationBoundaryRecord.optionsInfo,
    oracleInfo: hydrationBoundaryRecord.oracleInfo,
    blockedOn: hydrationBoundaryRecord.blockedOn,
    hydrationBoundaryRecord,
    markerDiagnostics: hydrationBoundaryRecord.markerDiagnostics,
    markerParserEvidence: hydrationBoundaryRecord.markerParserEvidence,
    markerEvidence: hydrationBoundaryRecord.markerEvidence,
    textMismatchDiagnostics:
      hydrationBoundaryRecord.textMismatchDiagnostics,
    recoverableErrorMetadata:
      hydrationBoundaryRecord.recoverableErrorMetadata,
    replayQueueDiagnostics: hydrationBoundaryRecord.replayQueueDiagnostics,
    targetResolutionDiagnostics:
      hydrationBoundaryRecord.targetResolutionDiagnostics,
    eventReplayBlockers: hydrationBoundaryRecord.eventReplayBlockers,
    markerGuard: hydrationBoundaryRecord.markerGuard,
    listenerGuard: hydrationBoundaryRecord.listenerGuard,
    hydrationRequested: true,
    canHydrate: false,
    publicRootCreated: false,
    containerMarked: false,
    listenersAttached: false,
    domMutated: false,
    eventsReplayed: false,
    rootScheduled: false,
    suspenseHydrationScheduled: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootRecordPayloads.set(record, {
    bridgeState,
    container,
    hydrationBoundaryRecord,
    hydrationOptions,
    initialChildren
  });

  return record;
}

function createRootUpdateRecordWithBridge(
  bridgeState,
  rootHandle,
  operation,
  sync,
  element,
  callback
) {
  const handleState = getPrivateRootHandleState(rootHandle);
  if (handleState.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root handle with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const lifecycleStatusBefore = handleState.lifecycleStatus;
  let lifecycleStatusAfter = lifecycleStatusBefore;
  let noOp = false;
  let recordSync = sync;
  let requestType = 'root.render';

  if (operation === 'render') {
    assertRootHandleCanRender(handleState);
    lifecycleStatusAfter = ROOT_LIFECYCLE_RENDERED;
    handleState.renderCount++;
  } else if (operation === 'unmount') {
    requestType = 'root.unmount';
    if (lifecycleStatusBefore === ROOT_LIFECYCLE_UNMOUNTED) {
      noOp = true;
      recordSync = false;
    } else {
      lifecycleStatusAfter = ROOT_LIFECYCLE_UNMOUNTED;
    }
  }

  handleState.lifecycleStatus = lifecycleStatusAfter;

  const sequence = bridgeState.nextUpdateSequence++;
  const updateId = `${bridgeState.updateIdPrefix}:${sequence}`;
  const requestInfo = createRequestInfo(bridgeState, requestType);
  const record = freezeRecord({
    $$typeof: privateRootUpdateRecordType,
    kind: 'FastReactDomPrivateRootUpdateRecord',
    operation,
    requestId: requestInfo.requestId,
    requestSequence: requestInfo.requestSequence,
    requestType: requestInfo.requestType,
    sequence,
    updateId,
    rootId: rootHandle.rootId,
    rootKind: rootHandle.rootKind,
    rootTag: rootHandle.rootTag,
    lifecycleStatusAfter,
    lifecycleStatusBefore,
    markerGuard:
      operation === 'unmount'
        ? describeUnmountMarkerGuard(handleState.container)
        : null,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    noOp,
    renderCount: handleState.renderCount,
    sync: recordSync,
    elementInfo: describeBridgeValue(element),
    callbackInfo: describeBridgeValue(callback)
  });

  rootRecordPayloads.set(record, {
    callback,
    element,
    nativeValueHandle:
      operation === 'render'
        ? createNativeBridgeHandle(bridgeState, NATIVE_ROOT_BRIDGE_HANDLE_VALUE)
        : null,
    rootHandle
  });

  return record;
}

function validateRootBridgeRequestRecord(record) {
  if (!record || typeof record !== 'object') {
    throwInvalidRootBridgeRequest(
      'Expected a private React DOM root bridge request record.'
    );
  }

  if (record.$$typeof === privateRootCreateRecordType) {
    return validateCreateRootBridgeRequestRecord(record);
  }

  if (record.$$typeof === privateRootHydrateRecordType) {
    return validateHydrateRootBridgeRequestRecord(record);
  }

  if (record.$$typeof === privateRootUpdateRecordType) {
    return validateUpdateRootBridgeRequestRecord(record);
  }

  throwInvalidRootBridgeRequest(
    'Expected a private React DOM root bridge create, render, or unmount record.'
  );
}

function validateCreateRootSideEffectRequest(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'create') {
    throwInvalidRootBridgeRequest(
      'Expected a private React DOM root bridge create record for root marker and listener side effects.'
    );
  }
  return validation;
}

function validateCreateRenderSideEffectRecord(
  sideEffectRecord,
  createRecord,
  createValidation
) {
  const payload = rootCreateSideEffectPayloads.get(sideEffectRecord);
  if (payload === undefined) {
    throwInvalidCreateRenderAdmission(
      'Expected a private React DOM createRoot mark/listen side-effect record.'
    );
  }
  if (payload.bridgeState !== createValidation.bridgeState) {
    throwForeignRootBridgeRequest();
  }
  if (payload.sourceRecord !== createRecord) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires side effects for the same createRoot record.'
    );
  }
  if (!payload.active) {
    throwInvalidCreateRenderAdmission(
      'Cannot admit a private create/render path after createRoot side effects were reverted.'
    );
  }

  assertCreateRenderAdmissionField(
    sideEffectRecord,
    '$$typeof',
    privateRootCreateSideEffectRecordType
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'operation', 'create');
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'sideEffectStatus',
    ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestId',
    createRecord.requestId
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestSequence',
    createRecord.requestSequence
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'requestType',
    createRecord.requestType
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootId',
    createRecord.rootId
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootKind',
    createRecord.rootKind
  );
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'rootTag',
    createRecord.rootTag
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'nativeExecution', false);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'reconcilerExecution',
    false
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'domMutation', false);
  assertCreateRenderAdmissionField(sideEffectRecord, 'markerWrites', true);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'listenerInstallation',
    true
  );
  assertCreateRenderAdmissionField(sideEffectRecord, 'hydration', false);
  assertCreateRenderAdmissionField(sideEffectRecord, 'eventDispatch', false);
  assertCreateRenderAdmissionField(
    sideEffectRecord,
    'compatibilityClaimed',
    false
  );

  if (
    sideEffectRecord.markerRecord !== payload.markerRecord ||
    sideEffectRecord.markerRecord?.$$typeof !==
      privateRootMarkerMutationRecordType ||
    sideEffectRecord.markerRecord.markerStatus !== ROOT_MARKER_APPLIED
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the accepted root marker mutation record.'
    );
  }
  if (
    sideEffectRecord.listenerRegistration !== payload.listenerRegistration ||
    sideEffectRecord.listenerRegistration?.$$typeof !==
      privateRootListenerRegistrationRecordType ||
    sideEffectRecord.listenerRegistration.registrationStatus !==
      ROOT_LISTENERS_REGISTERED
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the accepted root listener registration record.'
    );
  }
  if (getContainerRoot(payload.container) !== createRecord.owner) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the container marker to match the created root owner.'
    );
  }

  const ownerDocument = getOwnerDocument(payload.container);
  const rootListeningMarkerPresent = hasListeningMarker(payload.container);
  const ownerDocumentListeningMarkerPresent =
    ownerDocument === null ? false : hasListeningMarker(ownerDocument);
  if (!rootListeningMarkerPresent) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires an installed root listening marker.'
    );
  }
  if (
    sideEffectRecord.listenerRegistration.ownerDocumentRegistrationCount > 0 &&
    !ownerDocumentListeningMarkerPresent
  ) {
    throwInvalidCreateRenderAdmission(
      'Private create/render admission requires the owner document listening marker.'
    );
  }

  return {
    bridgeState: payload.bridgeState,
    container: payload.container,
    ownerDocument,
    ownerDocumentListeningMarkerPresent,
    rootListeningMarkerPresent
  };
}

function validateInitialHostOutputAdmissionRecord(bridgeState, record) {
  const payload = rootCreateRenderAdmissionPayloads.get(record);
  if (payload === undefined) {
    throwInvalidInitialHostOutputHandoff(
      'Expected a private create/render admission record for initial host output.'
    );
  }
  if (bridgeState !== null && payload.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  if (
    record.$$typeof !== privateRootCreateRenderAdmissionRecordType ||
    record.kind !== 'FastReactDomPrivateRootCreateRenderAdmissionRecord' ||
    record.operation !== 'create-render' ||
    record.admissionStatus !== ROOT_BRIDGE_CREATE_RENDER_ADMITTED ||
    record.executionStatus !== ROOT_BRIDGE_EXECUTION_BLOCKED ||
    record.compatibilityStatus !== ROOT_BRIDGE_COMPATIBILITY_BLOCKED ||
    record.domMutation !== false ||
    record.publicRootCreated !== false ||
    record.publicRootObjectExposed !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.rootScheduled !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Expected an intact private create/render admission record before initial host output.'
    );
  }

  const createValidation = validateRootBridgeRequestRecord(payload.createRecord);
  const renderValidation = validateRootBridgeRequestRecord(payload.renderRecord);
  if (
    createValidation.operation !== 'create' ||
    renderValidation.operation !== 'render' ||
    createValidation.bridgeState !== payload.bridgeState ||
    renderValidation.bridgeState !== payload.bridgeState
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires matching create and render root bridge records.'
    );
  }
  if (
    renderValidation.rootHandleState.lifecycleStatus ===
    ROOT_LIFECYCLE_UNMOUNTED
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Cannot apply initial host output after the private root was unmounted.'
    );
  }

  validateCreateRenderSideEffectRecord(
    payload.sideEffectRecord,
    payload.createRecord,
    createValidation
  );
  if (
    record.createRequestId !== payload.createRecord.requestId ||
    record.renderRequestId !== payload.renderRecord.requestId ||
    record.renderUpdateId !== payload.renderRecord.updateId ||
    record.sideEffectId !== payload.sideEffectRecord.sideEffectId
  ) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output payload is inconsistent.'
    );
  }

  return {
    admissionRecord: record,
    bridgeState: payload.bridgeState,
    container: payload.container,
    createRecord: payload.createRecord,
    element: payload.element,
    renderRecord: payload.renderRecord,
    rootOwner: payload.createRecord.owner,
    sideEffectRecord: payload.sideEffectRecord
  };
}

function validateCreateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a root bridge create record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'operation', 'create');
  assertRecordField(record, 'requestType', 'createRoot');
  assertRecordField(record, 'rootKind', CLIENT_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertRecordField(record, 'lifecycleStatusBefore', null);
  assertRecordField(record, 'lifecycleStatusAfter', ROOT_LIFECYCLE_CREATED);
  assertExecutionIsBlockedOnRequestRecord(record);

  const rootHandleState = getPrivateRootHandleState(record.handle);
  const ownerState = assertPrivateRootOwner(record.owner);
  assertRootIdentityMatchesRecord({
    handle: record.handle,
    ownerState,
    record
  });

  return {
    bridgeState: rootHandleState.bridgeState,
    lifecycleTransition: 'none->created',
    operation: 'create',
    rootHandleState
  };
}

function validateHydrateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a hydrateRoot bridge record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'operation', 'hydrate');
  assertRecordField(record, 'requestType', 'hydrateRoot');
  assertRecordField(record, 'rootId', null);
  assertRecordField(record, 'rootKind', UNSUPPORTED_HYDRATION_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertRecordField(record, 'lifecycleStatusBefore', null);
  assertRecordField(
    record,
    'lifecycleStatusAfter',
    ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assertRecordField(record, 'status', 'unsupported');
  assertRecordField(record, 'hydrationRequested', true);
  assertRecordField(record, 'canHydrate', false);
  assertRecordField(record, 'publicRootCreated', false);
  assertRecordField(record, 'containerMarked', false);
  assertRecordField(record, 'listenersAttached', false);
  assertRecordField(record, 'domMutated', false);
  assertRecordField(record, 'eventsReplayed', false);
  assertRecordField(record, 'rootScheduled', false);
  assertRecordField(record, 'suspenseHydrationScheduled', false);
  assertExecutionIsBlockedOnRequestRecord(record);

  const hydrationBoundaryRecord = record.hydrationBoundaryRecord;
  if (!isPrivateHydrationBoundaryRecord(hydrationBoundaryRecord)) {
    throwInvalidRootBridgeRequest(
      'Expected hydrateRoot bridge records to include a private hydration boundary record.'
    );
  }

  const hydrationPayload = getPrivateHydrationBoundaryRecordPayload(
    hydrationBoundaryRecord
  );
  if (
    hydrationPayload === null ||
    hydrationPayload.container !== payload.container ||
    hydrationPayload.initialChildren !== payload.initialChildren ||
    hydrationPayload.hydrationOptions !== payload.hydrationOptions ||
    payload.hydrationBoundaryRecord !== hydrationBoundaryRecord
  ) {
    throwInvalidRootBridgeRequest(
      'Private hydrateRoot bridge payload does not match its hydration boundary record.'
    );
  }

  assertRecordField(
    record,
    'markerDiagnostics',
    hydrationBoundaryRecord.markerDiagnostics
  );
  assertRecordField(
    record,
    'markerParserEvidence',
    hydrationBoundaryRecord.markerParserEvidence
  );
  assertRecordField(
    record,
    'markerEvidence',
    hydrationBoundaryRecord.markerEvidence
  );
  assertRecordField(
    record,
    'textMismatchDiagnostics',
    hydrationBoundaryRecord.textMismatchDiagnostics
  );
  assertRecordField(
    record,
    'recoverableErrorMetadata',
    hydrationBoundaryRecord.recoverableErrorMetadata
  );
  assertRecordField(
    record,
    'replayQueueDiagnostics',
    hydrationBoundaryRecord.replayQueueDiagnostics
  );
  assertRecordField(
    record,
    'targetResolutionDiagnostics',
    hydrationBoundaryRecord.targetResolutionDiagnostics
  );
  assertRecordField(
    record,
    'eventReplayBlockers',
    hydrationBoundaryRecord.eventReplayBlockers
  );
  assertRecordField(record, 'markerGuard', hydrationBoundaryRecord.markerGuard);
  assertRecordField(
    record,
    'listenerGuard',
    hydrationBoundaryRecord.listenerGuard
  );

  return {
    bridgeState: payload.bridgeState,
    lifecycleTransition: `none->${ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION}`,
    operation: 'hydrate',
    rootHandleState: null
  };
}

function validateUpdateRootBridgeRequestRecord(record) {
  const payload = rootRecordPayloads.get(record);
  if (payload === undefined) {
    throwInvalidRootBridgeRequest(
      'Expected a root bridge render or unmount record produced by the private root bridge.'
    );
  }

  assertRecordField(record, 'rootKind', CLIENT_ROOT_KIND);
  assertRecordField(record, 'rootTag', CONCURRENT_ROOT_TAG);
  assertExecutionIsBlockedOnRequestRecord(record);

  const rootHandle = payload.rootHandle;
  const rootHandleState = getPrivateRootHandleState(rootHandle);
  const ownerState = assertPrivateRootOwner(rootHandle.owner);
  assertRootIdentityMatchesRecord({
    handle: rootHandle,
    ownerState,
    record
  });

  if (record.operation === 'render') {
    assertRecordField(record, 'requestType', 'root.render');
    assertRecordField(record, 'lifecycleStatusAfter', ROOT_LIFECYCLE_RENDERED);
    assertRecordField(record, 'markerGuard', null);
    assertRecordField(record, 'noOp', false);
    assertRecordField(record, 'sync', false);
    assertAllowedLifecycleBefore(record, [
      ROOT_LIFECYCLE_CREATED,
      ROOT_LIFECYCLE_RENDERED
    ]);
    return {
      bridgeState: rootHandleState.bridgeState,
      lifecycleTransition: `${record.lifecycleStatusBefore}->${record.lifecycleStatusAfter}`,
      operation: 'render',
      rootHandleState
    };
  }

  if (record.operation === 'unmount') {
    assertRecordField(record, 'requestType', 'root.unmount');
    assertRecordField(record, 'lifecycleStatusAfter', ROOT_LIFECYCLE_UNMOUNTED);
    assertAllowedLifecycleBefore(record, [
      ROOT_LIFECYCLE_CREATED,
      ROOT_LIFECYCLE_RENDERED,
      ROOT_LIFECYCLE_UNMOUNTED
    ]);
    if (record.lifecycleStatusBefore === ROOT_LIFECYCLE_UNMOUNTED) {
      assertRecordField(record, 'noOp', true);
      assertRecordField(record, 'sync', false);
    } else {
      assertRecordField(record, 'noOp', false);
      assertRecordField(record, 'sync', true);
    }
    if (record.markerGuard === null || typeof record.markerGuard !== 'object') {
      throwInvalidRootBridgeRequest(
        'Expected an unmount request to include a deferred marker guard.'
      );
    }
    return {
      bridgeState: rootHandleState.bridgeState,
      lifecycleTransition: `${record.lifecycleStatusBefore}->${record.lifecycleStatusAfter}`,
      operation: 'unmount',
      rootHandleState
    };
  }

  throwInvalidRootBridgeRequest(
    `Unsupported private root bridge request operation: ${String(record.operation)}.`
  );
}

function createRootBridgeAdmissionRecord(record, validation) {
  return freezeRecord({
    $$typeof: privateRootAdmissionRecordType,
    kind: 'FastReactDomPrivateRootAdmissionRecord',
    operation: record.operation,
    requestId: record.requestId,
    requestSequence: record.requestSequence,
    requestType: record.requestType,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    hydrateId: record.hydrateId || null,
    updateId: record.updateId || null,
    sequence: record.sequence,
    admissionStatus: ROOT_BRIDGE_REQUEST_ADMITTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: record.lifecycleStatusBefore,
      lifecycleStatusAfter: record.lifecycleStatusAfter,
      lifecycleTransition: validation.lifecycleTransition,
      operation: validation.operation,
      rootKind: record.rootKind,
      rootTag: record.rootTag
    }),
    markerParserEvidence: record.markerParserEvidence || null,
    markerEvidence: record.markerEvidence || null,
    textMismatchDiagnostics: record.textMismatchDiagnostics || null,
    recoverableErrorMetadata: record.recoverableErrorMetadata || null,
    replayQueueDiagnostics: record.replayQueueDiagnostics || null,
    targetResolutionDiagnostics: record.targetResolutionDiagnostics || null,
    eventReplayBlockers: record.eventReplayBlockers || null,
    blockedCapabilities: ROOT_BRIDGE_BLOCKED_CAPABILITIES,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });
}

function createNativeRequestRecordMirror(record, rootHandleState, payload) {
  let requestKind = null;
  let rootHandleStateAfter = NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE;
  let valueHandle = null;

  if (record.operation === 'create') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_CREATE;
    valueHandle = payload.nativeValueHandle;
  } else if (record.operation === 'render') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_RENDER;
    valueHandle = payload.nativeValueHandle;
  } else if (record.operation === 'unmount') {
    requestKind = NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT;
    rootHandleStateAfter = NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED;
  } else {
    throwInvalidRootBridgeRequest(
      `Unsupported private root bridge request operation: ${String(record.operation)}.`
    );
  }

  return freezeRecord({
    requestId: record.requestSequence,
    kind: requestKind,
    environmentId: rootHandleState.nativeRootHandle.environmentId,
    rootHandle: rootHandleState.nativeRootHandle,
    rootId: rootHandleState.nativeRootId,
    valueHandle,
    rootHandleState: rootHandleStateAfter
  });
}

function createPortalRootBoundaryRecordWithBridge(bridgeState, record) {
  const validation = validatePortalRootBoundaryRequestRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal boundary with a different ' +
        'root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalBoundarySequence++;
  const boundaryId = `${rootBridgeState.portalBoundaryIdPrefix}:${sequence}`;
  const portal = validation.portal;
  const portalContainer = portal.containerInfo;
  const boundaryRecord = freezeRecord({
    $$typeof: privateRootPortalBoundaryRecordType,
    kind: 'FastReactDomPrivateRootPortalBoundaryRecord',
    operation: 'portal-root-boundary',
    boundaryId,
    boundarySequence: sequence,
    boundaryStatus: ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED,
    diagnosticStatus: ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED,
    sourceOperation: record.operation,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceUpdateId: record.updateId || null,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    portalKey: portal.key,
    portalObjectInfo: describeBridgeValue(portal),
    portalChildrenInfo: describeBridgeValue(portal.children),
    portalContainerInfo: freezeRecord(describeContainer(portalContainer)),
    portalImplementationInfo: describeBridgeValue(portal.implementation),
    portalListenerGuard: describePortalContainerListenerGuard(portalContainer, {
      action: 'defer-listen-to-portal-container-events-for-root-boundary'
    }),
    portalContainerOwnership: describePortalContainerOwnership(
      validation.payload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    reconcilerDiagnostic: freezeRecord({
      beginWorkRecord: 'UnsupportedPortalBeginWorkRecord',
      failClosedBeforeChildren: true,
      feature: 'portal',
      rootPreflightError:
        'HostRootChildBeginWorkPreflightError::UnsupportedPortal',
      unsupportedFeature: 'PORTAL_RECONCILER_UNSUPPORTED_FEATURE'
    }),
    blockedCapabilities: ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES,
    acceptedPortalObjectShape: true,
    nativeExecution: false,
    reconcilerExecution: false,
    portalChildReconciliation: false,
    portalMounting: false,
    publicPortalMounting: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    domMutation: false,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalBoundaryPayloads.set(boundaryRecord, {
    portal,
    portalChildren: portal.children,
    portalContainer,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: record
  });

  return boundaryRecord;
}

function createPortalPrepareMountListenerIntentRecordWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validatePortalPrepareMountListenerBoundaryRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal preparePortalMount listener ' +
        'intent with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalPrepareMountListenerSequence++;
  const intentId =
    `${rootBridgeState.portalPrepareMountListenerIdPrefix}:${sequence}`;
  const portal = validation.payload.portal;
  const portalContainer = validation.payload.portalContainer;
  const listenerIntentRecord =
    createPortalPrepareMountEventListenerIntentRecord(
      portalContainer,
      options
    );
  const listenerIntentPayload =
    getPortalPrepareMountListenerIntentPayload(listenerIntentRecord);
  const portalContainerOwnership = describePortalContainerOwnership(
    validation.payload.rootHandle,
    validation.rootHandleState,
    portalContainer
  );

  const intentRecord = freezeRecord({
    $$typeof: privateRootPortalPrepareMountListenerIntentRecordType,
    kind: 'FastReactDomPrivateRootPortalPrepareMountListenerIntentRecord',
    operation: 'portal-prepare-mount-listener-intent',
    intentId,
    intentSequence: sequence,
    intentStatus: ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_INTENT_ADMITTED,
    listenerInstallationStatus:
      ROOT_BRIDGE_PORTAL_LISTENER_INSTALLATION_BLOCKED,
    sourceBoundaryId: record.boundaryId,
    sourceBoundarySequence: record.boundarySequence,
    sourceBoundaryStatus: record.boundaryStatus,
    sourceDiagnosticStatus: record.diagnosticStatus,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    portalKey: portal.key,
    hostFiberPath: freezeArray(['HostRoot', 'HostPortal']),
    portalContainerInfo: record.portalContainerInfo,
    portalContainerOwnership,
    portalListenerGuard: describePortalContainerListenerGuard(
      portalContainer,
      {
        action: 'record-prepare-portal-mount-listener-intent'
      }
    ),
    listenerIntent: summarizePortalPrepareMountListenerIntentRecord(
      listenerIntentRecord
    ),
    acceptedCapabilities:
      ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_BLOCKED_CAPABILITIES,
    preparePortalMountIntent: true,
    preparePortalMount: false,
    listenToAllSupportedEventsIntent:
      listenerIntentRecord.listenToAllSupportedEventsIntent,
    listenToAllSupportedEvents: false,
    portalListenerIntentRecorded: true,
    portalContainerChildrenReplaced: false,
    portalChildReconciliation: false,
    portalMounting: false,
    publicPortalMounting: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalPrepareMountListenerIntentPayloads.set(
    intentRecord,
    freezeRecord({
      boundaryRecord: record,
      listenerIntentPayload,
      listenerIntentRecord,
      portal,
      portalContainer,
      rootContainer: validation.rootHandleState.container,
      rootHandle: validation.payload.rootHandle,
      sourceRecord: validation.payload.sourceRecord
    })
  );

  return intentRecord;
}

function createPortalCommitHandoffRecordWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validatePortalCommitHandoffBoundaryRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal commit handoff with a ' +
        'different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalCommitSequence++;
  const commitHandoffId = `${rootBridgeState.portalCommitIdPrefix}:${sequence}`;
  const portal = validation.payload.portal;
  const portalContainer = validation.payload.portalContainer;
  const pendingChildren = getPortalCommitPendingChildren(portal, options);
  const portalContainerOwnership = describePortalContainerOwnership(
    validation.payload.rootHandle,
    validation.rootHandleState,
    portalContainer
  );
  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    record.portalListenerGuard
  );

  const handoff = freezeRecord({
    $$typeof: privateRootPortalCommitHandoffRecordType,
    kind: 'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord',
    operation: 'portal-fake-dom-commit-handoff',
    commitHandoffId,
    commitHandoffSequence: sequence,
    handoffStatus: ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED,
    commitStatus: ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
    sourceBoundaryId: record.boundaryId,
    sourceBoundarySequence: record.boundarySequence,
    sourceBoundaryStatus: record.boundaryStatus,
    sourceDiagnosticStatus: record.diagnosticStatus,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    fakeDomCommitTarget: freezeRecord({
      canAppendChild: typeof portalContainer.appendChild === 'function',
      canRemoveChild: typeof portalContainer.removeChild === 'function',
      hasTextContent: 'textContent' in portalContainer,
      portalContainerInfo: record.portalContainerInfo
    }),
    pendingChildrenInfo: describeBridgeValue(pendingChildren),
    portalContainerOwnership,
    listenerSideEffects,
    blockedCapabilities: ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES,
    fakeDomCommitHandoff: true,
    fakeDomCommitApplied: false,
    portalContainerChildrenReplaced: false,
    portalChildReconciliation: false,
    portalMounting: false,
    publicPortalMounting: false,
    preparePortalMount: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalCommitHandoffPayloads.set(handoff, {
    boundaryRecord: record,
    pendingChildren,
    portal,
    portalChildren: validation.payload.portalChildren,
    portalContainer,
    rootContainer: validation.rootHandleState.container,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: validation.payload.sourceRecord
  });

  return handoff;
}

function cleanupPrivateRootUnmountHostOutputWithBridge(
  bridgeState,
  admissionRecord,
  unmountRecord
) {
  const cached = getCachedUnmountHostOutputCleanup(
    bridgeState,
    admissionRecord,
    unmountRecord
  );
  if (cached !== null) {
    return cached;
  }

  const validation = validateUnmountHostOutputCleanupRecords(
    admissionRecord,
    unmountRecord
  );
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const rootBridgeState = validation.bridgeState;
  const sequence = rootBridgeState.nextUnmountCleanupSequence++;
  const cleanupId = `${rootBridgeState.unmountCleanupIdPrefix}:${sequence}`;
  const clearContainerRecord = clearContainerForRootUnmount(
    validation.container
  );
  const clearContainerPayload =
    getClearContainerForRootUnmountRecordPayload(clearContainerRecord);
  const componentTreeDetachRecords =
    clearContainerPayload === null
      ? []
      : clearContainerPayload.removedChildren.map((child) =>
          detachHostInstanceSubtree(child, {includeRoot: true})
        );
  const detachedHostInstanceCount = componentTreeDetachRecords.reduce(
    (total, record) => total + record.detachedHostInstanceCount,
    0
  );
  const sideEffectCleanup = revertPrivateCreateRootSideEffectsWithBridge(
    rootBridgeState,
    validation.sideEffectRecord
  );

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootUnmountHostOutputCleanupRecordType,
    kind: 'FastReactDomPrivateRootUnmountHostOutputCleanupRecord',
    operation: 'unmount-host-output-cleanup',
    cleanupId,
    cleanupSequence: sequence,
    cleanupStatus: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED,
    sourceAdmissionId: admissionRecord.admissionId,
    sourceAdmissionSequence: admissionRecord.admissionSequence,
    sourceRenderRequestId: admissionRecord.renderRequestId,
    sourceRenderRequestSequence: admissionRecord.renderRequestSequence,
    sourceUnmountRequestId: unmountRecord.requestId,
    sourceUnmountRequestSequence: unmountRecord.requestSequence,
    sourceUnmountUpdateId: unmountRecord.updateId,
    sideEffectId: validation.sideEffectRecord.sideEffectId,
    sideEffectCleanupStatus: sideEffectCleanup.sideEffectStatus,
    rootId: unmountRecord.rootId,
    rootKind: unmountRecord.rootKind,
    rootTag: unmountRecord.rootTag,
    lifecyclePrerequisites: freezeRecord({
      accepted: true,
      lifecycleStatusBefore: unmountRecord.lifecycleStatusBefore,
      lifecycleStatusAfter: unmountRecord.lifecycleStatusAfter,
      lifecycleTransition: `${unmountRecord.lifecycleStatusBefore}->${unmountRecord.lifecycleStatusAfter}`,
      operation: 'unmount',
      rootKind: unmountRecord.rootKind,
      rootTag: unmountRecord.rootTag
    }),
    fakeDomCleanup: freezeRecord({
      clearContainerStatus: clearContainerRecord.status,
      componentTreeDetachStatus: 'detached-host-instance-subtree',
      removedRootChildCount: clearContainerRecord.removedChildCount,
      detachedHostInstanceCount,
      detachRecordCount: componentTreeDetachRecords.length
    }),
    clearContainerRecord,
    componentTreeDetachRecords: freezeArray(componentTreeDetachRecords),
    sideEffectCleanup,
    markerCleanup: sideEffectCleanup.markerCleanup,
    listenerCleanup: sideEffectCleanup.listenerCleanup,
    acceptedCapabilities: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES,
    fakeDomMutation: true,
    rootContainerChildrenCleared: true,
    componentTreeMetadataDetached: true,
    rootMarkerReverted: true,
    rootListenersReverted: true,
    publicRootUnmounted: false,
    publicRootBehaviorChanged: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: true,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });

  rootUnmountHostOutputCleanupRecords.set(unmountRecord, cleanupRecord);
  rootUnmountHostOutputCleanupPayloads.set(
    cleanupRecord,
    freezeRecord({
      admissionRecord,
      clearContainerPayload,
      clearContainerRecord,
      componentTreeDetachRecords,
      container: validation.container,
      sideEffectCleanup,
      sideEffectRecord: validation.sideEffectRecord,
      unmountRecord
    })
  );

  return cleanupRecord;
}

function createPortalFakeDomMountDiagnosticRecordWithBridge(
  bridgeState,
  record,
  options
) {
  const validation = validatePortalFakeDomMountHandoffRecord(record);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal fake-DOM mount diagnostic ' +
        'with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalMountSequence++;
  const mountDiagnosticId =
    `${rootBridgeState.portalMountIdPrefix}:${sequence}`;
  const portal = validation.payload.portal;
  const portalContainer = validation.payload.portalContainer;
  const explicitChild = getExplicitPortalFakeDomMountChild(
    validation.payload,
    options
  );
  const childDescriptor =
    normalizePortalFakeDomHostChildDescriptor(explicitChild);
  const hostOwner = freezeRecord({
    kind: 'FastReactDomPrivatePortalHostComponentOwner',
    mountDiagnosticId,
    hostType: childDescriptor.hostComponentType,
    sourceUpdateId: record.sourceUpdateId
  });
  const textOwner = freezeRecord({
    kind: 'FastReactDomPrivatePortalHostTextOwner',
    mountDiagnosticId,
    hostType: childDescriptor.hostComponentType,
    sourceUpdateId: record.sourceUpdateId
  });
  const hostInstanceToken = createHostInstanceToken(
    hostOwner,
    validation.payload.rootHandle.owner
  );
  const hostTextToken = createHostInstanceToken(
    textOwner,
    validation.payload.rootHandle.owner
  );
  const childCountBefore = getFakeDomChildCount(portalContainer);
  const hostComponentNode = createPortalFakeDomHostComponentNode(
    portalContainer,
    childDescriptor
  );
  const hostTextNode = createDomHostTextInstance(
    childDescriptor.hostText,
    hostComponentNode
  );

  appendChild(hostComponentNode, hostTextNode);
  appendChildToContainer(portalContainer, hostComponentNode);
  attachHostInstanceNode(
    hostComponentNode,
    hostInstanceToken,
    childDescriptor.props
  );
  attachHostInstanceNode(hostTextNode, hostTextToken, null);

  const childCountAfter = getFakeDomChildCount(portalContainer);
  const hostComponentChildCountAfter =
    getFakeDomChildCount(hostComponentNode);
  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    record.listenerSideEffects.portalListenerGuard
  );

  const mountRecord = freezeRecord({
    $$typeof: privateRootPortalFakeDomMountRecordType,
    kind: 'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord',
    operation: 'portal-fake-dom-mount-diagnostic',
    mountDiagnosticId,
    mountDiagnosticSequence: sequence,
    mountStatus: ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED,
    publicMountStatus: ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED,
    sourceCommitHandoffId: record.commitHandoffId,
    sourceCommitHandoffSequence: record.commitHandoffSequence,
    sourceCommitHandoffStatus: record.handoffStatus,
    sourceCommitStatus: record.commitStatus,
    sourceBoundaryId: record.sourceBoundaryId,
    sourceBoundarySequence: record.sourceBoundarySequence,
    sourceRequestId: record.sourceRequestId,
    sourceRequestSequence: record.sourceRequestSequence,
    sourceRequestType: record.sourceRequestType,
    sourceUpdateId: record.sourceUpdateId,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    portalKey: portal.key,
    hostFiberPath: freezeArray([
      'HostRoot',
      'HostPortal',
      'HostComponent',
      'HostText'
    ]),
    explicitChildSource: 'portal.children',
    hostComponentType: childDescriptor.hostComponentType,
    hostText: childDescriptor.hostText,
    hostComponentInfo: freezeRecord(describeContainer(hostComponentNode)),
    hostTextInfo: freezeRecord(describeContainer(hostTextNode)),
    portalContainerInfo: record.fakeDomCommitTarget.portalContainerInfo,
    portalContainerChildCountBefore: childCountBefore,
    portalContainerChildCountAfter: childCountAfter,
    hostComponentChildCountAfter,
    portalContainerOwnership: describePortalContainerOwnership(
      validation.payload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    listenerSideEffects,
    acceptedCapabilities:
      ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES,
    blockedCapabilities: ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES,
    fakeDomCommitHandoff: true,
    fakeDomCommitApplied: true,
    fakeDomPortalMountDiagnostic: true,
    explicitPortalHostChildMounted: true,
    componentTreeMetadataAttached: true,
    portalContainerChildrenReplaced: false,
    portalChildReconciliation: false,
    portalMounting: false,
    publicPortalMounting: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: true,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalFakeDomMountPayloads.set(mountRecord, {
    commitHandoffRecord: record,
    explicitChild,
    hostComponentNode,
    hostInstanceToken,
    hostTextNode,
    hostTextToken,
    portal,
    portalContainer,
    rootContainer: validation.payload.rootContainer,
    rootHandle: validation.payload.rootHandle,
    sourceRecord: validation.payload.sourceRecord
  });

  return mountRecord;
}

function createPortalChildReconciliationDiagnosticRecordWithBridge(
  bridgeState,
  mountRecord,
  boundaryRecord,
  options
) {
  const validation = validatePortalChildReconciliationDiagnosticRecords(
    mountRecord,
    boundaryRecord
  );
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal child reconciliation ' +
        'diagnostic with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const portal = validation.boundaryPayload.portal;
  const portalContainer = validation.mountPayload.portalContainer;
  const nextChild = getExplicitPortalChildReconciliationChild(
    validation.boundaryPayload,
    options
  );
  const nextDescriptor =
    normalizePortalChildReconciliationDescriptor(nextChild, mountRecord);
  const previousProps = getLatestPropsFromHostInstanceToken(
    validation.mountPayload.hostInstanceToken
  );
  assertPortalChildReconciliationPreviousProps(
    previousProps,
    mountRecord.hostText
  );
  const previousText = String(previousProps.children);
  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalChildReconciliationSequence++;
  const diagnosticId =
    `${rootBridgeState.portalChildReconciliationIdPrefix}:${sequence}`;
  const hostComponentNode = assertMountedHostInstanceToken(
    validation.mountPayload.hostInstanceToken
  );
  const hostTextNode = assertMountedHostInstanceToken(
    validation.mountPayload.hostTextToken
  );
  let latestPropsMutationHandoff = null;
  let latestPropsMutationPayload = null;
  let latestPropsBeforeCommit = null;
  let latestPropsAfterCommit = null;

  try {
    latestPropsMutationHandoff = commitDomPropertyUpdateForLatestProps(
      hostComponentNode,
      nextDescriptor.hostComponentType,
      previousProps,
      nextDescriptor.props
    );
    latestPropsMutationPayload =
      getDomPropertyUpdateLatestPropsHandoffPayload(
        latestPropsMutationHandoff
      );
    latestPropsBeforeCommit = getLatestPropsFromNode(hostComponentNode);
    commitTextUpdate(hostTextNode, previousText, nextDescriptor.hostText);
    latestPropsAfterCommit = requireLatestPropsCommitResult(
      latestPropsMutationHandoff
    );
  } catch (error) {
    if (latestPropsMutationHandoff !== null) {
      try {
        rollbackDomPropertyUpdateLatestPropsHandoff(
          latestPropsMutationHandoff
        );
      } catch (rollbackError) {
        // Preserve the original private portal update failure.
      }
    }
    throw error;
  }

  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    boundaryRecord.portalListenerGuard
  );
  const propertyMutationRecords =
    latestPropsMutationPayload === null
      ? freezeArray([])
      : latestPropsMutationPayload.mutationRecords;
  const latestPropsCommitRecord =
    latestPropsMutationPayload === null
      ? null
      : latestPropsMutationPayload.latestPropsCommitRecord;

  const diagnosticRecord = freezeRecord({
    $$typeof: privateRootPortalChildReconciliationDiagnosticRecordType,
    kind: 'FastReactDomPrivateRootPortalChildReconciliationDiagnosticRecord',
    operation: 'portal-child-reconciliation-diagnostic',
    diagnosticId,
    diagnosticSequence: sequence,
    reconciliationStatus: ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ADMITTED,
    publicMountStatus: ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED,
    sourceMountDiagnosticId: mountRecord.mountDiagnosticId,
    sourceMountDiagnosticSequence: mountRecord.mountDiagnosticSequence,
    sourceMountStatus: mountRecord.mountStatus,
    sourceBoundaryId: boundaryRecord.boundaryId,
    sourceBoundarySequence: boundaryRecord.boundarySequence,
    sourceBoundaryStatus: boundaryRecord.boundaryStatus,
    sourceDiagnosticStatus: boundaryRecord.diagnosticStatus,
    sourceRequestId: boundaryRecord.sourceRequestId,
    sourceRequestSequence: boundaryRecord.sourceRequestSequence,
    sourceRequestType: boundaryRecord.sourceRequestType,
    sourceUpdateId: boundaryRecord.sourceUpdateId,
    rootId: boundaryRecord.rootId,
    rootKind: boundaryRecord.rootKind,
    rootTag: boundaryRecord.rootTag,
    portalKey: portal.key,
    hostFiberPath: freezeArray([
      'HostRoot',
      'HostPortal',
      'HostComponent',
      'HostText'
    ]),
    explicitChildSource: 'portal.children',
    hostComponentType: nextDescriptor.hostComponentType,
    previousHostText: previousText,
    nextHostText: nextDescriptor.hostText,
    hostComponentInfo: freezeRecord(describeContainer(hostComponentNode)),
    hostTextInfo: freezeRecord(describeContainer(hostTextNode)),
    portalContainerInfo: mountRecord.portalContainerInfo,
    portalContainerChildCount: getFakeDomChildCount(portalContainer),
    hostComponentChildCountAfter: getFakeDomChildCount(hostComponentNode),
    propertyMutation: freezeRecord({
      handoffKind: latestPropsMutationHandoff.kind,
      latestPropsCommitRecordKind:
        latestPropsCommitRecord === null ? null : latestPropsCommitRecord.kind,
      latestPropsCommitRecordStatus:
        latestPropsCommitRecord === null
          ? null
          : latestPropsCommitRecord.status,
      mutationRecordCount: propertyMutationRecords.length,
      payloadCount: latestPropsMutationHandoff.payloadCount,
      status: latestPropsMutationHandoff.status
    }),
    textMutation: freezeRecord({
      oldTextLength: previousText.length,
      newTextLength: nextDescriptor.hostText.length,
      status: 'mutated'
    }),
    latestPropsPublished: true,
    latestPropsPublishOrder:
      'after-portal-property-and-text-mutation',
    portalContainerOwnership: describePortalContainerOwnership(
      validation.mountPayload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    listenerSideEffects,
    acceptedCapabilities:
      ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_BLOCKED_CAPABILITIES,
    fakeDomCommitHandoff: true,
    fakeDomCommitApplied: true,
    fakeDomPortalMountDiagnostic: true,
    explicitPortalHostChildMounted: true,
    portalChildReconciliation: true,
    singleHostComponentUpdate: true,
    portalHostComponentUpdated: true,
    portalHostTextUpdated: true,
    latestPropsBeforeCommitInfo: describeBridgeValue(latestPropsBeforeCommit),
    latestPropsAfterCommitInfo: describeBridgeValue(latestPropsAfterCommit),
    portalContainerChildrenReplaced: false,
    portalMounting: false,
    publicPortalMounting: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: true,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalChildReconciliationDiagnosticPayloads.set(diagnosticRecord, {
    boundaryRecord,
    commitHandoffRecord: validation.mountPayload.commitHandoffRecord,
    hostComponentNode,
    hostInstanceToken: validation.mountPayload.hostInstanceToken,
    hostTextNode,
    hostTextToken: validation.mountPayload.hostTextToken,
    latestPropsAfterCommit,
    latestPropsBeforeCommit,
    latestPropsMutationHandoff,
    latestPropsMutationPayload,
    mountRecord,
    nextChild,
    nextProps: nextDescriptor.props,
    portal,
    portalContainer,
    previousChild: validation.mountPayload.explicitChild,
    previousProps,
    rootContainer: validation.mountPayload.rootContainer,
    rootHandle: validation.mountPayload.rootHandle,
    sourceRecord: validation.boundaryPayload.sourceRecord,
    textUpdate: freezeRecord({
      newText: nextDescriptor.hostText,
      oldText: previousText
    })
  });

  return diagnosticRecord;
}

function createPortalEventOwnerRootGateRecordWithBridge(
  bridgeState,
  mountRecord,
  options
) {
  const validation = validatePortalEventOwnerRootGateMountRecord(mountRecord);
  if (
    bridgeState !== null &&
    validation.rootHandleState.bridgeState !== bridgeState
  ) {
    const error = new Error(
      'Cannot use a private root bridge portal event owner-root gate with a ' +
        'different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }

  const rootBridgeState = validation.rootHandleState.bridgeState;
  const sequence = rootBridgeState.nextPortalEventOwnerRootSequence++;
  const gateId = `${rootBridgeState.portalEventOwnerRootIdPrefix}:${sequence}`;
  const mountPayload = validation.mountPayload;
  const portalContainer = mountPayload.portalContainer;
  const hostComponentNode = assertMountedHostInstanceToken(
    mountPayload.hostInstanceToken
  );
  const hostTextNode = assertMountedHostInstanceToken(
    mountPayload.hostTextToken
  );
  const targetNormalizationRecord =
    createEventTargetNormalizationRecord(hostComponentNode);
  const targetDispatchPathRecord = createEventTargetDispatchPathRecord(
    targetNormalizationRecord
  );
  const eventOwnerRootGateRecord =
    createPluginPortalEventOwnerRootGateRecord(targetDispatchPathRecord, {
      domEventName:
        options && typeof options.domEventName === 'string'
          ? options.domEventName
          : 'click',
      hostFiberPath: [
        'HostRoot',
        'HostPortal',
        'HostComponent'
      ],
      ownerRoot: mountPayload.rootHandle.owner,
      portalContainer,
      portalKey: mountRecord.portalKey,
      rootContainer: mountPayload.rootContainer,
      sourceGateId: gateId
    });
  const eventOwnerRootGatePayload =
    getPluginPortalEventOwnerRootGateRecordPayload(
      eventOwnerRootGateRecord
    );
  const eventOwnerRootSummary =
    summarizePortalEventOwnerRootGateRecord(eventOwnerRootGateRecord);
  const listenerSideEffects = describePortalCommitListenerSideEffects(
    portalContainer,
    mountRecord.listenerSideEffects.portalListenerGuard
  );
  const hostComponentRootOwnerMatchesPortalOwner =
    getRootOwnerFromHostInstanceToken(mountPayload.hostInstanceToken) ===
    mountPayload.rootHandle.owner;
  const hostTextRootOwnerMatchesPortalOwner =
    getRootOwnerFromHostInstanceToken(mountPayload.hostTextToken) ===
    mountPayload.rootHandle.owner;

  const gateRecord = freezeRecord({
    $$typeof: privateRootPortalEventOwnerRootGateRecordType,
    kind: 'FastReactDomPrivateRootPortalEventOwnerRootGateRecord',
    operation: 'portal-event-owner-root-gate',
    gateId,
    gateSequence: sequence,
    gateStatus: ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED,
    eventBubblingStatus: ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED,
    sourceMountDiagnosticId: mountRecord.mountDiagnosticId,
    sourceMountDiagnosticSequence: mountRecord.mountDiagnosticSequence,
    sourceMountStatus: mountRecord.mountStatus,
    sourceCommitHandoffId: mountRecord.sourceCommitHandoffId,
    sourceCommitHandoffSequence: mountRecord.sourceCommitHandoffSequence,
    sourceBoundaryId: mountRecord.sourceBoundaryId,
    sourceBoundarySequence: mountRecord.sourceBoundarySequence,
    sourceRequestId: mountRecord.sourceRequestId,
    sourceRequestSequence: mountRecord.sourceRequestSequence,
    sourceRequestType: mountRecord.sourceRequestType,
    sourceUpdateId: mountRecord.sourceUpdateId,
    rootId: mountRecord.rootId,
    rootKind: mountRecord.rootKind,
    rootTag: mountRecord.rootTag,
    portalKey: mountRecord.portalKey,
    hostFiberPath: freezeArray([
      'HostRoot',
      'HostPortal',
      'HostComponent'
    ]),
    hostComponentType: mountRecord.hostComponentType,
    hostComponentInfo: mountRecord.hostComponentInfo,
    hostTextInfo: mountRecord.hostTextInfo,
    portalContainerInfo: mountRecord.portalContainerInfo,
    portalContainerOwnership: describePortalContainerOwnership(
      mountPayload.rootHandle,
      validation.rootHandleState,
      portalContainer
    ),
    listenerSideEffects,
    eventOwnerRootGate: eventOwnerRootSummary,
    targetDispatchPathStatus:
      eventOwnerRootGateRecord.targetDispatchPathStatus,
    targetDispatchPathLength:
      eventOwnerRootGateRecord.targetDispatchPathLength,
    targetInstStatus: eventOwnerRootGateRecord.targetInstStatus,
    targetHostInstanceStatus:
      eventOwnerRootGateRecord.targetHostInstanceStatus,
    dispatchPathRootOwnerMatchCount:
      eventOwnerRootGateRecord.dispatchPathRootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount:
      eventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount,
    portalContainerContainsEventTarget:
      eventOwnerRootGateRecord.portalContainerContainsTarget,
    rootContainerContainsEventTarget:
      eventOwnerRootGateRecord.rootContainerContainsTarget,
    portalContainerIsRootContainer:
      eventOwnerRootGateRecord.portalContainerIsRootContainer,
    ownerRootAttachment: freezeRecord({
      eventTargetRootOwnerMatchesPortalOwner:
        eventOwnerRootGateRecord.ownerRootMatchesTargetRoot,
      hostComponentRootOwnerMatchesPortalOwner,
      hostTextRootOwnerMatchesPortalOwner
    }),
    acceptedCapabilities:
      ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_BLOCKED_CAPABILITIES,
    fakeDomPortalMountDiagnostic: true,
    explicitPortalHostChildMounted: true,
    componentTreeMetadataAttached: true,
    portalOwnerRootAttached: true,
    portalEventPathDiagnostic: true,
    portalEventBubbling: false,
    publicPortalBubbling: false,
    publicPortalMounting: false,
    publicRootCompatibilitySurface: false,
    publicRootRenderCompatibilityClaimed: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    listenerInvocationCount: 0,
    syntheticEventCount: 0,
    browserDomEventCompatibilityClaimed: false,
    fakeDomEventCompatibilityClaimed: false,
    privatePortalMetadataPromotesPublicRootRender: false,
    compatibilityClaimed: false
  });

  rootPortalEventOwnerRootGatePayloads.set(
    gateRecord,
    freezeRecord({
      eventOwnerRootGatePayload,
      eventOwnerRootGateRecord,
      hostComponentNode,
      hostInstanceToken: mountPayload.hostInstanceToken,
      hostTextNode,
      hostTextToken: mountPayload.hostTextToken,
      mountPayload,
      mountRecord,
      portal: mountPayload.portal,
      portalContainer,
      rootContainer: mountPayload.rootContainer,
      rootHandle: mountPayload.rootHandle,
      targetDispatchPathRecord,
      targetNormalizationRecord
    })
  );

  return gateRecord;
}

function normalizeInitialHostOutputElement(element) {
  if (element === null || typeof element !== 'object') {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires a private HostComponent element object.'
    );
  }
  if (typeof element.type !== 'string' || element.type === '') {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output supports only one string HostComponent element.'
    );
  }

  const props =
    element.props !== null && typeof element.props === 'object'
      ? element.props
      : {};
  const text = getInitialHostTextChild(props.children);

  return {
    nextProps: props,
    previousProps: freezeRecord({}),
    text,
    type: element.type
  };
}

function getInitialHostTextChild(children) {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  throwInvalidInitialHostOutputHandoff(
    'Initial host output supports exactly one HostText string or number child.'
  );
}

function requireLatestPropsCommitResult(handoff) {
  return commitLatestPropsFromMutationHandoff(handoff);
}

function rollbackPartialInitialHostOutput({
  container,
  hostAppendedToContainer,
  hostNode,
  latestPropsMutationHandoff,
  textAppendedToHost,
  textNode
}) {
  if (hostAppendedToContainer) {
    try {
      removeChildFromContainer(container, hostNode);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (textAppendedToHost) {
    try {
      removeChild(hostNode, textNode);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (latestPropsMutationHandoff !== null) {
    try {
      rollbackDomPropertyUpdateLatestPropsHandoff(latestPropsMutationHandoff);
    } catch (error) {
      // Preserve the original private initial host-output failure.
    }
  }
  if (hostNode !== null) {
    detachHostInstanceSubtree(hostNode, {includeRoot: true});
  } else if (textNode !== null) {
    detachHostInstanceSubtree(textNode, {includeRoot: true});
  }
}

function cleanupInitialHostOutputPayload(payload) {
  const removedRootChild = removeInitialHostOutputRootChild(
    payload.container,
    payload.hostNode
  );
  const componentTreeDetachRecord = detachHostInstanceSubtree(
    payload.hostNode,
    {includeRoot: true}
  );

  return {
    containerChildCountAfterCleanup: getChildNodeCount(payload.container),
    detachedHostInstanceCount:
      componentTreeDetachRecord.detachedHostInstanceCount,
    removedRootChild
  };
}

function removeInitialHostOutputRootChild(container, hostNode) {
  if (!isCurrentChild(container, hostNode)) {
    return false;
  }

  removeChildFromContainer(container, hostNode);
  return true;
}

function assertInitialHostOutputContainerCanReceiveRootChild(container) {
  if (getChildNodeCount(container) !== 0 || getFirstChild(container) !== null) {
    throwInvalidInitialHostOutputHandoff(
      'Initial host output requires an empty fake-DOM root container.'
    );
  }
}

function isCurrentChild(parent, child) {
  if (child === null || child === undefined) {
    return false;
  }
  if (child.parentNode === parent) {
    return true;
  }
  return Array.isArray(parent.childNodes) && parent.childNodes.includes(child);
}

function getChildNodeCount(parent) {
  return Array.isArray(parent.childNodes) ? parent.childNodes.length : 0;
}

function getFirstChild(parent) {
  if (parent == null || typeof parent !== 'object') {
    return null;
  }
  if (parent.firstChild !== undefined) {
    return parent.firstChild || null;
  }
  return Array.isArray(parent.childNodes) && parent.childNodes.length > 0
    ? parent.childNodes[0]
    : null;
}

function admitPrivateRootCommitRefMetadataWithBridge(
  bridgeState,
  record,
  rootCommitRefMetadata,
  options
) {
  const validation = validateRootCommitRefMetadataRequestRecord(record);
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const existing = rootCommitRefMetadataRecordsByRequest.get(record);
  if (existing !== undefined) {
    return existing;
  }

  const rootCommitRefMetadataSnapshot =
    refCallbackGate.createRefCallbackRootCommitMetadataSnapshot(
      rootCommitRefMetadata
    );
  const rootCommitRefMetadataPayload =
    refCallbackGate.getPrivateRefCallbackRootCommitMetadataSnapshotPayload(
      rootCommitRefMetadataSnapshot
    );
  if (rootCommitRefMetadataPayload === null) {
    throwInvalidRootCommitRefMetadata(
      'Expected accepted private root commit ref metadata.'
    );
  }

  validateRootCommitRefMetadataShapeForRequest(
    record,
    rootCommitRefMetadataSnapshot,
    rootCommitRefMetadataPayload
  );

  const rootBridgeState = validation.bridgeState;
  const sequence = rootBridgeState.nextRootCommitRefMetadataSequence++;
  const metadataId = `${rootBridgeState.rootCommitRefMetadataIdPrefix}:${sequence}`;
  const hostOutputCanary = getRootCommitRefMetadataHostOutputCanary(record);
  const label = getRootCommitRefMetadataLabel(record, options);
  const acceptedRecord = freezeRecord({
    $$typeof: privateRootCommitRefMetadataRecordType,
    kind: 'FastReactDomPrivateRootCommitRefMetadataRecord',
    operation: 'root-commit-ref-metadata',
    metadataId,
    metadataSequence: sequence,
    metadataStatus: ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED,
    sourceRequestId: record.requestId,
    sourceRequestSequence: record.requestSequence,
    sourceRequestType: record.requestType,
    sourceOperation: record.operation,
    sourceUpdateId: record.updateId || null,
    sourceLifecycleStatusBefore: record.lifecycleStatusBefore,
    sourceLifecycleStatusAfter: record.lifecycleStatusAfter,
    rootId: record.rootId,
    rootKind: record.rootKind,
    rootTag: record.rootTag,
    hostOutputCanary,
    label,
    rootCommitRefMetadataStatus: rootCommitRefMetadataSnapshot.status,
    rootCommitRefMetadataRecordCount: rootCommitRefMetadataSnapshot.recordCount,
    detachCount: rootCommitRefMetadataSnapshot.detachCount,
    attachCount: rootCommitRefMetadataSnapshot.attachCount,
    ordering: rootCommitRefMetadataSnapshot.ordering,
    blockedCapabilities:
      ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_BLOCKED_CAPABILITIES,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    callbackRefsInvoked: false,
    objectRefsMutated: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  rootCommitRefMetadataRecordsByRequest.set(record, acceptedRecord);
  rootCommitRefMetadataPayloads.set(
    acceptedRecord,
    freezeRecord({
      bridgeState: rootBridgeState,
      hostOutputCanary,
      label,
      rootCommitRefMetadataPayload,
      rootCommitRefMetadataSnapshot,
      sourceRecord: record
    })
  );

  return acceptedRecord;
}

function createRefCallbackHostOutputOrderingDiagnosticRecordWithBridge(
  bridgeState,
  rootRequestRecords,
  options
) {
  const requestValidation =
    validateRefCallbackHostOutputOrderingDiagnosticRequests(
      bridgeState,
      rootRequestRecords
    );
  const refOrderingInput =
    resolveRefCallbackHostOutputOrderingDiagnosticInput(
      requestValidation,
      options
    );
  const refOrderingSnapshot =
    refCallbackGate.createRefCallbackHostOutputOrderingDiagnosticSnapshot(
      refOrderingInput.snapshotOptions
    );
  const refOrderingPayload =
    refCallbackGate.getPrivateRefCallbackHostOutputOrderingDiagnosticSnapshotPayload(
      refOrderingSnapshot
    );

  if (refOrderingPayload === null) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Expected a private React DOM ref callback host-output ordering diagnostic snapshot.'
    );
  }
  if (
    refOrderingSnapshot.updateCanaryStepCount < 1 ||
    refOrderingSnapshot.unmountCanaryStepCount < 1
  ) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback host-output ordering diagnostics require update and unmount canary steps.'
    );
  }

  const rootBridgeState = requestValidation.bridgeState;
  const updateBeforeUnmount =
    requestValidation.lastUpdateRenderRequest.requestSequence <
    requestValidation.firstUnmountRequest.requestSequence;
  if (!updateBeforeUnmount) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback host-output ordering diagnostics require update render before unmount.'
    );
  }

  const record = freezeRecord({
    $$typeof: privateRootRefCallbackHostOutputOrderingDiagnosticRecordType,
    kind:
      'FastReactDomPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord',
    diagnosticStatus:
      ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    rootId: requestValidation.rootId,
    rootKind: requestValidation.rootKind,
    rootTag: requestValidation.rootTag,
    sourceRequestCount: requestValidation.records.length,
    sourceRequestIds: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.requestId)
    ),
    sourceRequestTypes: freezeArray(
      requestValidation.records.map(
        (requestRecord) => requestRecord.requestType
      )
    ),
    sourceOperations: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.operation)
    ),
    sourceUpdateIds: freezeArray(
      requestValidation.records.map(
        (requestRecord) => requestRecord.updateId || null
      )
    ),
    updateRenderRequestCount: requestValidation.updateRenderRequests.length,
    unmountRequestCount: requestValidation.unmountRequests.length,
    updateBeforeUnmount,
    rootCommitRefMetadataSource: refOrderingInput.metadataSource,
    acceptedRootCommitRefMetadataCount:
      refOrderingInput.acceptedMetadataRecords.length,
    refOrderingStatus: refOrderingSnapshot.status,
    refOrderingStepCount: refOrderingSnapshot.stepCount,
    refOrderingRecordCount: refOrderingSnapshot.recordCount,
    callbackIdentityStableCount:
      refOrderingSnapshot.callbackIdentityStableCount,
    callbackIdentityChangedCount:
      refOrderingSnapshot.callbackIdentityChangedCount,
    callbackIdentityMissingCount:
      refOrderingSnapshot.callbackIdentityMissingCount,
    callbackCleanupReturnCount: refOrderingSnapshot.callbackCleanupReturnCount,
    callbackCleanupReturnHandleCount:
      refOrderingSnapshot.callbackCleanupReturnHandleCount,
    cleanupReturnMatchedCount: refOrderingSnapshot.cleanupReturnMatchedCount,
    cleanupInvocationAttemptCount:
      refOrderingSnapshot.cleanupInvocationAttemptCount,
    cleanupReturnHandleConsumedCount:
      refOrderingSnapshot.cleanupReturnHandleConsumedCount,
    callbackNullDetachAttemptCount:
      refOrderingSnapshot.callbackNullDetachAttemptCount,
    hostIdentityReusedAfterDetachCount:
      refOrderingSnapshot.hostIdentityReusedAfterDetachCount,
    refOrderingSnapshot,
    blockedCapabilities:
      ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_BLOCKED_CAPABILITIES,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    objectRefsMutated: false,
    rootErrorsReported: false,
    compatibilityClaimed: false
  });

  rootRefCallbackHostOutputOrderingDiagnosticPayloads.set(record, {
    acceptedRootCommitRefMetadataRecords:
      refOrderingInput.acceptedMetadataRecords,
    bridgeState: rootBridgeState,
    refOrderingPayload,
    refOrderingSnapshot,
    rootRequestRecords: requestValidation.records
  });

  return record;
}

function createRefCallbackRootErrorRoutingRecordWithBridge(
  bridgeState,
  rootRequestRecords,
  options
) {
  const requestValidation = validateRefCallbackRootErrorRoutingRequests(
    bridgeState,
    rootRequestRecords
  );
  const routingInput = resolveRefCallbackRootErrorRoutingInput(
    requestValidation,
    options
  );
  const rootErrorRoutingSnapshot =
    refCallbackGate.createRefCallbackRootErrorRoutingSnapshot(
      routingInput.snapshotOptions
    );
  const rootErrorRoutingPayload =
    refCallbackGate.getPrivateRefCallbackRootErrorRoutingSnapshotPayload(
      rootErrorRoutingSnapshot
    );

  if (rootErrorRoutingPayload === null) {
    throwInvalidRefCallbackRootErrorRouting(
      'Expected a private React DOM ref callback root error routing snapshot.'
    );
  }
  if (rootErrorRoutingSnapshot.recordCount === 0) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing requires at least one captured callback ref error.'
    );
  }

  const rootBridgeState = requestValidation.bridgeState;
  const rootErrorCallbacks = describeRootErrorCallbacks(
    requestValidation.rootHandleState.rootOptions
  );
  const record = freezeRecord({
    $$typeof: privateRootRefCallbackErrorRoutingRecordType,
    kind: 'FastReactDomPrivateRootRefCallbackErrorRoutingRecord',
    routingStatus: ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_RECORDED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    rootId: requestValidation.rootId,
    rootKind: requestValidation.rootKind,
    rootTag: requestValidation.rootTag,
    sourceRequestCount: requestValidation.records.length,
    sourceRequestIds: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.requestId)
    ),
    sourceRequestTypes: freezeArray(
      requestValidation.records.map(
        (requestRecord) => requestRecord.requestType
      )
    ),
    sourceOperations: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.operation)
    ),
    sourceUpdateIds: freezeArray(
      requestValidation.records.map(
        (requestRecord) => requestRecord.updateId || null
      )
    ),
    rootCommitRefMetadataSource: routingInput.metadataSource,
    acceptedRootCommitRefMetadataCount:
      routingInput.acceptedMetadataRecords.length,
    rootErrorRoutingStatus: rootErrorRoutingSnapshot.status,
    rootErrorRoutingRecordCount: rootErrorRoutingSnapshot.recordCount,
    capturedErrorCount: rootErrorRoutingSnapshot.capturedErrorCount,
    callbackAttachErrorCount:
      rootErrorRoutingSnapshot.callbackAttachErrorCount,
    callbackNullDetachErrorCount:
      rootErrorRoutingSnapshot.callbackNullDetachErrorCount,
    cleanupReturnErrorCount:
      rootErrorRoutingSnapshot.cleanupReturnErrorCount,
    callbackInvocationErrorCount:
      rootErrorRoutingSnapshot.callbackInvocationErrorCount,
    cleanupInvocationErrorCount:
      rootErrorRoutingSnapshot.cleanupInvocationErrorCount,
    rootErrorChannel: rootErrorRoutingSnapshot.rootErrorChannel,
    rootErrorCallbacks,
    onUncaughtErrorConfigured:
      rootErrorCallbacks.onUncaughtError.configured,
    onCaughtErrorConfigured: rootErrorCallbacks.onCaughtError.configured,
    onRecoverableErrorConfigured:
      rootErrorCallbacks.onRecoverableError.configured,
    rootErrorRoutingSnapshot,
    blockedCapabilities:
      ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_BLOCKED_CAPABILITIES,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    rootErrorUpdatesScheduled: false,
    publicRootErrorCallbacksInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    callbackRefsInvoked: rootErrorRoutingSnapshot.callbackRefsInvoked,
    callbackCleanupReturnsInvoked:
      rootErrorRoutingSnapshot.callbackCleanupReturnsInvoked,
    objectRefsMutated: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesLatestProps: false,
    exposesErrorValue: false
  });

  rootRefCallbackErrorRoutingPayloads.set(
    record,
    freezeRecord({
      acceptedRootCommitRefMetadataRecords:
        routingInput.acceptedMetadataRecords,
      bridgeState: rootBridgeState,
      rootErrorCallbacks,
      rootErrorRoutingPayload,
      rootErrorRoutingSnapshot,
      rootOptions: requestValidation.rootHandleState.rootOptions,
      rootRequestRecords: requestValidation.records
    })
  );

  return record;
}

function createEventListenerRootErrorRoutingRecordWithBridge(
  bridgeState,
  rootRequestRecords,
  eventDispatchCanaryRecord,
  options
) {
  const requestValidation = validateEventListenerRootErrorRoutingRequests(
    bridgeState,
    rootRequestRecords
  );
  const eventValidation = validateEventListenerRootErrorRoutingCanary(
    requestValidation,
    eventDispatchCanaryRecord
  );
  const rootErrorCallbacks = describeRootErrorCallbacks(
    requestValidation.rootHandleState.rootOptions
  );
  const routingOptions = normalizeEventListenerRootErrorRoutingOptions(options);
  const portalEventOwnerRootValidation =
    validateEventListenerRootErrorRoutingPortalEventOwnerRootGate(
      requestValidation,
      eventValidation,
      routingOptions
    );
  const rootErrorOptionCallbackRecords = freezeArray(
    eventValidation.listenerErrorRoutes.map((errorRoute, index) =>
      createEventListenerRootErrorOptionCallbackRecord({
        errorRoute,
        errorRoutePayload: eventValidation.listenerErrorRoutePayloads[index],
        index,
        portalEventOwnerRootValidation,
        requestValidation,
        rootErrorCallbacks,
        routingOptions
      })
    )
  );
  const acceptedCapabilities =
    portalEventOwnerRootValidation.enabled === true
      ? freezeArray([
          ...ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES,
          ...ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES
        ])
      : ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES;
  const blockedCapabilities =
    portalEventOwnerRootValidation.enabled === true
      ? freezeArray([
          ...ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES,
          ...ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES
        ])
      : ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES;
  const record = freezeRecord({
    $$typeof: privateRootEventListenerErrorRoutingRecordType,
    kind: 'FastReactDomPrivateRootEventListenerErrorRoutingRecord',
    routingStatus: ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_RECORDED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    rootId: requestValidation.rootId,
    rootKind: requestValidation.rootKind,
    rootTag: requestValidation.rootTag,
    sourceRequestCount: requestValidation.records.length,
    sourceRequestIds: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.requestId)
    ),
    sourceRequestTypes: freezeArray(
      requestValidation.records.map(
        (requestRecord) => requestRecord.requestType
      )
    ),
    sourceOperations: freezeArray(
      requestValidation.records.map((requestRecord) => requestRecord.operation)
    ),
    sourceEventRecordKind: eventValidation.eventDispatchCanaryRecord.kind,
    sourceEventRecordStatus: eventValidation.eventDispatchCanaryRecord.status,
    sourceEventRecordDomEventName:
      eventValidation.eventDispatchCanaryRecord.domEventName,
    eventErrorRouteSource:
      'private-root-host-output-click-dispatch-canary',
    portalEventErrorRoutingDiagnostic:
      portalEventOwnerRootValidation.enabled,
    portalEventOwnerRootGateLinked:
      portalEventOwnerRootValidation.enabled,
    portalEventOwnerRootGateId:
      portalEventOwnerRootValidation.gateId,
    portalEventOwnerRootGateStatus:
      portalEventOwnerRootValidation.gateStatus,
    portalEventOwnerRootGateKind:
      portalEventOwnerRootValidation.gateKind,
    portalEventOwnerRootGate:
      portalEventOwnerRootValidation.gateSummary,
    portalEventOwnerRootMatchesTargetRoot:
      portalEventOwnerRootValidation.ownerRootMatchesTargetRoot,
    portalEventTargetDispatchPathLength:
      portalEventOwnerRootValidation.targetDispatchPathLength,
    portalContainerContainsEventTarget:
      portalEventOwnerRootValidation.portalContainerContainsTarget,
    rootContainerContainsEventTarget:
      portalEventOwnerRootValidation.rootContainerContainsTarget,
    portalEventBubbling: false,
    publicPortalBubbling: false,
    portalEventDispatch: false,
    portalListenerInstallation: false,
    rootErrorOptionCallbackRecordStatus:
      ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED,
    rootErrorOptionCallbackRecordCount:
      rootErrorOptionCallbackRecords.length,
    rootErrorOptionCallbackRecords,
    listenerErrorCount:
      eventValidation.eventDispatchCanaryRecord.listenerErrorCount,
    listenerErrorRouteCount: eventValidation.listenerErrorRoutes.length,
    capturedErrorCount: eventValidation.listenerErrorRoutes.length,
    rootErrorChannel: 'event-listener-reportGlobalError',
    rootErrorCallbacks,
    onUncaughtErrorConfigured:
      rootErrorCallbacks.onUncaughtError.configured,
    onCaughtErrorConfigured: rootErrorCallbacks.onCaughtError.configured,
    onRecoverableErrorConfigured:
      rootErrorCallbacks.onRecoverableError.configured,
    acceptedCapabilities,
    blockedCapabilities,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    rootErrorUpdatesScheduled: false,
    publicRootErrorCallbacksInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    reportGlobalErrorInvoked: false,
    eventListenerErrorsReported: false,
    rootErrorsReported: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    privateCanaryInvocation: true,
    browserDomEventCompatibilityClaimed: false,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    compatibilityClaimed: false,
    exposesErrorValue: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false
  });

  rootEventListenerErrorRoutingPayloads.set(
    record,
    freezeRecord({
      bridgeState: requestValidation.bridgeState,
      eventDispatchCanaryPayload: eventValidation.eventDispatchCanaryPayload,
      eventDispatchCanaryRecord: eventValidation.eventDispatchCanaryRecord,
      listenerErrorRoutePayloads:
        eventValidation.listenerErrorRoutePayloads,
      listenerErrorRoutes: eventValidation.listenerErrorRoutes,
      options: routingOptions.rawOptions,
      portalEventOwnerRootGatePayload:
        portalEventOwnerRootValidation.gatePayload,
      portalEventOwnerRootGateRecord:
        portalEventOwnerRootValidation.gateRecord,
      portalEventOwnerRootPluginGatePayload:
        portalEventOwnerRootValidation.pluginGatePayload,
      portalEventOwnerRootPluginGateRecord:
        portalEventOwnerRootValidation.pluginGateRecord,
      rootErrorCallbacks,
      rootErrorOptionCallbackRecords,
      rootOptions: requestValidation.rootHandleState.rootOptions,
      rootRequestRecords: requestValidation.records
    })
  );

  return record;
}

function createHydrationReplayErrorMetadataRecordWithBridge(
  bridgeState,
  hydrateRootRecord,
  ownershipDiagnostics,
  options
) {
  const requestValidation = validateHydrationReplayErrorMetadataRequest(
    bridgeState,
    hydrateRootRecord
  );
  const ownershipValidation = validateHydrationReplayErrorMetadataOwnership(
    requestValidation,
    ownershipDiagnostics
  );
  const rootErrorCallbacks = describeRootErrorCallbacks(
    requestValidation.hydrationOptions
  );
  const metadataOptions =
    normalizeHydrationReplayErrorMetadataOptions(options);
  const rootErrorOptionCallbackRecords = freezeArray(
    ownershipValidation.ownershipRows.map((ownershipRow, index) =>
      createHydrationReplayErrorOptionCallbackRecord({
        index,
        metadataOptions,
        ownershipRow,
        requestValidation,
        rootErrorCallbacks
      })
    )
  );
  const record = freezeRecord({
    $$typeof: privateRootHydrationReplayErrorMetadataRecordType,
    kind: 'FastReactDomPrivateRootHydrationReplayErrorMetadataRecord',
    metadataStatus: ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_RECORDED,
    executionStatus: ROOT_BRIDGE_EXECUTION_BLOCKED,
    compatibilityStatus: ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
    source:
      typeof metadataOptions.source === 'string'
        ? metadataOptions.source
        : 'private-root-hydration-replay-error-metadata',
    operation: 'hydration-replay-error-metadata',
    sourceRequestId: hydrateRootRecord.requestId,
    sourceRequestSequence: hydrateRootRecord.requestSequence,
    sourceRequestType: hydrateRootRecord.requestType,
    sourceOperation: hydrateRootRecord.operation,
    hydrateId: hydrateRootRecord.hydrateId,
    rootId: hydrateRootRecord.rootId,
    rootKind: hydrateRootRecord.rootKind,
    rootTag: hydrateRootRecord.rootTag,
    rootRecordId: requestValidation.rootRecordId,
    sourceHydrationBoundaryKind:
      requestValidation.hydrationBoundaryRecord.kind,
    sourceHydrationBoundaryStatus:
      requestValidation.hydrationBoundaryRecord.status,
    sourceOwnershipDiagnosticKind: ownershipDiagnostics.kind,
    sourceOwnershipDiagnosticStatus: ownershipDiagnostics.status,
    sourceOwnershipDiagnosticSource: ownershipDiagnostics.source,
    sourceEventReplayQueueDiagnosticKind:
      ownershipDiagnostics.eventReplayQueueDiagnostics.kind,
    sourceEventReplayQueueDiagnosticStatus:
      ownershipDiagnostics.eventReplayQueueDiagnostics.status,
    sourceEventReplayQueueDiagnosticSource:
      ownershipDiagnostics.eventReplayQueueDiagnostics.source,
    ownershipRowCount: ownershipValidation.ownershipRows.length,
    ownershipRetainedCount: ownershipDiagnostics.ownershipRetainedCount,
    ownershipRetainedThroughDrainOrder:
      ownershipDiagnostics.ownershipRetainedThroughDrainOrder,
    rootOwnershipRetainedCount:
      ownershipDiagnostics.rootOwnershipRetainedCount,
    dehydratedBoundaryOwnershipRequiredCount:
      ownershipDiagnostics.dehydratedBoundaryOwnershipRequiredCount,
    dehydratedBoundaryOwnershipRetainedCount:
      ownershipDiagnostics.dehydratedBoundaryOwnershipRetainedCount,
    blockedEventReplayTargetCount:
      ownershipDiagnostics.blockedEventReplayTargetCount,
    drainOrderCount: ownershipDiagnostics.drainOrderCount,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    targetResolutionDiagnosticsAccepted:
      ownershipDiagnostics.targetResolutionDiagnosticsAccepted,
    drainOrderDiagnosticsAccepted:
      ownershipDiagnostics.drainOrderDiagnosticsAccepted,
    eventReplayQueueDiagnosticsAccepted:
      ownershipDiagnostics.eventReplayQueueDiagnosticsAccepted,
    orderSource: ownershipDiagnostics.orderSource,
    rootErrorChannel: 'hydration-replay-root-option-metadata',
    rootErrorCallbacks,
    onUncaughtErrorConfigured:
      rootErrorCallbacks.onUncaughtError.configured,
    onCaughtErrorConfigured: rootErrorCallbacks.onCaughtError.configured,
    onRecoverableErrorConfigured:
      rootErrorCallbacks.onRecoverableError.configured,
    rootErrorOptionCallbackRecordStatus:
      ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED,
    rootErrorOptionCallbackRecordCount:
      rootErrorOptionCallbackRecords.length,
    rootErrorOptionCallbackRecords,
    acceptedCapabilities:
      ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_ACCEPTED_CAPABILITIES,
    blockedCapabilities:
      ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_BLOCKED_CAPABILITIES,
    publicRootExecution: false,
    publicRootObjectExposed: false,
    publicRootCreated: false,
    nativeExecution: false,
    reconcilerExecution: false,
    rootScheduled: false,
    rootErrorUpdatesScheduled: false,
    hydrationRequested: true,
    hydration: false,
    canHydrate: false,
    hydrationCompatibilityClaimed: false,
    hostInstanceHydrationAttempted: false,
    suspenseHydrationScheduled: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    eventDispatch: false,
    eventReplayInstalled: false,
    eventsReplayed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    publicRootErrorCallbacksInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    reportGlobalErrorInvoked: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    exposesErrorValue: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    exposesHydrationTarget: false
  });

  rootHydrationReplayErrorMetadataPayloads.set(
    record,
    freezeRecord({
      bridgeState: requestValidation.bridgeState,
      container: requestValidation.container,
      eventReplayQueueDiagnostics:
        ownershipDiagnostics.eventReplayQueueDiagnostics,
      hydrateRootRecord,
      hydrationBoundaryRecord: requestValidation.hydrationBoundaryRecord,
      hydrationOptions: requestValidation.hydrationOptions,
      initialChildren: requestValidation.initialChildren,
      options: metadataOptions.rawOptions,
      ownershipDiagnostics,
      ownershipRows: ownershipValidation.ownershipRows,
      rootErrorCallbacks,
      rootErrorOptionCallbackRecords
    })
  );

  return record;
}

function createNativeBridgeHandle(bridgeState, kind) {
  return freezeRecord({
    $$typeof: privateRootNativeBridgeHandleType,
    environmentId: bridgeState.nativeEnvironmentId,
    slot: bridgeState.nextNativeHandleSlot++,
    generation: 1,
    kind
  });
}

function getNativeHandoffSourceValue(record, payload) {
  if (payload === null) {
    return null;
  }
  if (record.operation === 'create') {
    return payload.container;
  }
  if (record.operation === 'render') {
    return payload.element;
  }
  return null;
}

function getPrivateRootHandleState(rootHandle) {
  const state = rootHandleState.get(rootHandle);
  if (state === undefined) {
    const error = new Error('Expected a private React DOM root handle.');
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_HANDLE';
    throw error;
  }
  return state;
}

function assertPrivateRootOwner(owner) {
  const state = rootOwnerState.get(owner);
  if (state === undefined) {
    const error = new Error('Expected a private React DOM root owner.');
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_OWNER';
    throw error;
  }
  return state;
}

function assertPrivateRootHandle(rootHandle) {
  const state = getPrivateRootHandleState(rootHandle);
  return {
    ...state,
    owner: rootHandle.owner
  };
}

function assertHandleBelongsToBridge(rootHandle, bridgeState) {
  const state = assertPrivateRootHandle(rootHandle);
  if (state.bridgeState !== bridgeState) {
    const error = new Error(
      'Cannot use a private root handle with a different root bridge shell.'
    );
    error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
    throw error;
  }
  return state;
}

function getIdPrefix(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function createBridgeState(options) {
  const hydrationBoundaryOptions = {
    markerOptions: options && options.markerOptions,
    recordIdPrefix: getIdPrefix(
      options && options.hydrationRecordIdPrefix,
      'hydration'
    ),
    validationOptions: options && options.validationOptions
  };
  if (
    options &&
    Object.prototype.hasOwnProperty.call(options, 'markerOracle')
  ) {
    hydrationBoundaryOptions.markerOracle = options.markerOracle;
  }
  const hydrationBoundaryGate = createHydrationBoundaryGate(
    hydrationBoundaryOptions
  );

  return {
    hydrateIdPrefix: getIdPrefix(options && options.hydrateIdPrefix, 'hydrate'),
    hydrationBoundaryGate,
    markerOptions: options && options.markerOptions,
    createRenderAdmissionIdPrefix: getIdPrefix(
      options && options.createRenderAdmissionIdPrefix,
      'create-render-admission'
    ),
    initialHostOutputIdPrefix: getIdPrefix(
      options && options.initialHostOutputIdPrefix,
      'initial-host-output'
    ),
    nativeEnvironmentId: getPositiveInteger(
      options && options.nativeEnvironmentId,
      NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID
    ),
    nativeHandoffIdPrefix: getIdPrefix(
      options && options.nativeHandoffIdPrefix,
      'native-handoff'
    ),
    hostOutputUpdateIdPrefix: getIdPrefix(
      options && options.hostOutputUpdateIdPrefix,
      'host-output-update'
    ),
    rootCommitHostComponentUpdateIdPrefix: getIdPrefix(
      options && options.rootCommitHostComponentUpdateIdPrefix,
      'root-commit-host-component-update'
    ),
    nextRequestSequence: 1,
    portalBoundaryIdPrefix: getIdPrefix(
      options && options.portalBoundaryIdPrefix,
      'portal-boundary'
    ),
    portalPrepareMountListenerIdPrefix: getIdPrefix(
      options && options.portalPrepareMountListenerIdPrefix,
      'portal-prepare-mount-listener'
    ),
    portalCommitIdPrefix: getIdPrefix(
      options && options.portalCommitIdPrefix,
      'portal-commit'
    ),
    portalMountIdPrefix: getIdPrefix(
      options && options.portalMountIdPrefix,
      'portal-mount'
    ),
    portalChildReconciliationIdPrefix: getIdPrefix(
      options && options.portalChildReconciliationIdPrefix,
      'portal-child-reconciliation'
    ),
    portalEventOwnerRootIdPrefix: getIdPrefix(
      options && options.portalEventOwnerRootIdPrefix,
      'portal-event-owner-root'
    ),
    publicFacadePreflightIdPrefix: getIdPrefix(
      options && options.publicFacadePreflightIdPrefix,
      'public-facade-preflight'
    ),
    publicFacadeHostOutputRenderIdPrefix: getIdPrefix(
      options && options.publicFacadeHostOutputRenderIdPrefix,
      'public-facade-host-output-render'
    ),
    publicFacadeHostOutputUpdateIdPrefix: getIdPrefix(
      options && options.publicFacadeHostOutputUpdateIdPrefix,
      'public-facade-host-output-update'
    ),
    publicFacadeHostOutputUnmountCleanupIdPrefix: getIdPrefix(
      options && options.publicFacadeHostOutputUnmountCleanupIdPrefix,
      'public-facade-host-output-unmount-cleanup'
    ),
    rootIdPrefix: getIdPrefix(options && options.rootIdPrefix, 'root'),
    rootCommitRefMetadataIdPrefix: getIdPrefix(
      options && options.rootCommitRefMetadataIdPrefix,
      'root-commit-ref-metadata'
    ),
    requestIdPrefix: getIdPrefix(options && options.requestIdPrefix, 'request'),
    sideEffectIdPrefix: getIdPrefix(
      options && options.sideEffectIdPrefix,
      'side-effect'
    ),
    unmountCleanupIdPrefix: getIdPrefix(
      options && options.unmountCleanupIdPrefix,
      'unmount-cleanup'
    ),
    updateIdPrefix: getIdPrefix(options && options.updateIdPrefix, 'update'),
    nextNativeHandleSlot: 1,
    nextNativeRootId: 1,
    nextCreateRenderAdmissionSequence: 1,
    nextHydrateSequence: 1,
    nextInitialHostOutputSequence: 1,
    nextHostOutputUpdateSequence: 1,
    nextRootCommitHostComponentUpdateSequence: 1,
    nextPortalBoundarySequence: 1,
    nextPortalPrepareMountListenerSequence: 1,
    nextPortalCommitSequence: 1,
    nextPortalMountSequence: 1,
    nextPortalChildReconciliationSequence: 1,
    nextPortalEventOwnerRootSequence: 1,
    nextPublicFacadePreflightSequence: 1,
    nextPublicFacadeHostOutputRenderSequence: 1,
    nextPublicFacadeHostOutputUpdateSequence: 1,
    nextPublicFacadeHostOutputUnmountCleanupSequence: 1,
    nextRootCommitRefMetadataSequence: 1,
    nextRootSequence: 1,
    nextSideEffectSequence: 1,
    nextUnmountCleanupSequence: 1,
    nextUpdateSequence: 1,
    validationOptions: options && options.validationOptions
  };
}

function getRootKind(options) {
  return (options && options.rootKind) || CLIENT_ROOT_KIND;
}

function getRootTag(options) {
  return (options && options.rootTag) || CONCURRENT_ROOT_TAG;
}

function createRequestInfo(bridgeState, requestType) {
  const requestSequence = bridgeState.nextRequestSequence++;
  return freezeRecord({
    requestId: `${bridgeState.requestIdPrefix}:${requestSequence}`,
    requestSequence,
    requestType
  });
}

function getPositiveInteger(value, fallback) {
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function getCreateRootSideEffectListenerOptions(options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'listenerOptions')
  ) {
    return options.listenerOptions;
  }
  return options;
}

function assertRootHandleCanRender(handleState) {
  if (handleState.lifecycleStatus === ROOT_LIFECYCLE_UNMOUNTED) {
    const error = new Error('Cannot update an unmounted root.');
    error.code = 'FAST_REACT_DOM_UNMOUNTED_ROOT';
    throw error;
  }
}

function assertRootIdentityMatchesRecord({handle, ownerState, record}) {
  if (
    handle.rootId !== record.rootId ||
    ownerState.rootId !== record.rootId ||
    handle.rootKind !== record.rootKind ||
    ownerState.rootKind !== record.rootKind ||
    handle.rootTag !== record.rootTag ||
    ownerState.rootTag !== record.rootTag
  ) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request identity does not match its root handle.'
    );
  }
}

function assertExecutionIsBlockedOnRequestRecord(record) {
  if (record.nativeExecution !== false) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim native execution.'
    );
  }
  if (record.reconcilerExecution === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim reconciler execution.'
    );
  }
  if (record.domMutation === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim DOM mutation.'
    );
  }
  if (record.markerWrites === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim marker writes.'
    );
  }
  if (record.listenerInstallation === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim listener installation.'
    );
  }
  if (record.hydration === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim hydration.'
    );
  }
  if (record.eventDispatch === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim event dispatch.'
    );
  }
  if (record.compatibilityClaimed === true) {
    throwInvalidRootBridgeRequest(
      'Private root bridge request records must not claim compatibility.'
    );
  }
}

function assertAllowedLifecycleBefore(record, allowedStatuses) {
  if (!allowedStatuses.includes(record.lifecycleStatusBefore)) {
    throwInvalidRootBridgeRequest(
      `Unexpected lifecycle state before ${record.operation} request: ${String(
        record.lifecycleStatusBefore
      )}.`
    );
  }
}

function assertRecordField(record, field, expectedValue) {
  if (!Object.is(record[field], expectedValue)) {
    throwInvalidRootBridgeRequest(
      `Invalid private root bridge request field ${field}.`
    );
  }
}

function assertCreateRenderAdmissionField(record, field, expectedValue) {
  if (!Object.is(record[field], expectedValue)) {
    throwInvalidCreateRenderAdmission(
      `Invalid private create/render admission field ${field}.`
    );
  }
}

function validateHostOutputUpdateRequestRecord(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'render') {
    throwInvalidHostOutputUpdateHandoff(
      'Expected a private root.render request record for host-output update.'
    );
  }
  if (record.lifecycleStatusBefore !== ROOT_LIFECYCLE_RENDERED) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require a later root.render after the initial render.'
    );
  }
  if (validation.rootHandleState.createRenderAdmissionRecord === null) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require an accepted create/render admission first.'
    );
  }
  return validation;
}

function validateRootCommitRefMetadataRequestRecord(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'render' && validation.operation !== 'unmount') {
    throwInvalidRootCommitRefMetadata(
      'Private root commit ref metadata requires a render or unmount request record.'
    );
  }
  if (validation.operation === 'unmount' && record.noOp) {
    throwInvalidRootCommitRefMetadata(
      'Private root commit ref metadata cannot be admitted for a no-op unmount request.'
    );
  }
  return validation;
}

function validateRootCommitRefMetadataShapeForRequest(
  record,
  snapshot,
  payload
) {
  if (record.operation === 'render' && record.renderCount === 1) {
    if (snapshot.detachCount !== 0) {
      throwInvalidRootCommitRefMetadata(
        'Initial render ref metadata cannot include detach records.'
      );
    }
    return;
  }

  if (record.operation === 'unmount' && snapshot.attachCount !== 0) {
    throwInvalidRootCommitRefMetadata(
      'Unmount ref metadata cannot include attach records.'
    );
  }

  const requestPayload = rootRecordPayloads.get(record);
  const rootOwner = requestPayload?.rootHandle?.owner;
  if (rootOwner == null) {
    throwInvalidRootCommitRefMetadata(
      'Private root commit ref metadata requires a root handle owner.'
    );
  }

  for (const metadata of [...payload.detach, ...payload.attach]) {
    if (metadata.rootOwner !== rootOwner) {
      throwInvalidRootCommitRefMetadata(
        'Private root commit ref metadata must belong to the source root request.'
      );
    }
  }
}

function getRootCommitRefMetadataHostOutputCanary(record) {
  if (record.operation === 'render') {
    return record.renderCount === 1
      ? 'initial-host-output'
      : 'update-host-output';
  }
  if (record.operation === 'unmount') {
    return 'unmount-host-output';
  }
  throwInvalidRootCommitRefMetadata(
    'Private root commit ref metadata requires a render or unmount request.'
  );
}

function getRootCommitRefMetadataLabel(record, options) {
  if (
    options &&
    typeof options === 'object' &&
    typeof options.label === 'string' &&
    options.label.length > 0
  ) {
    return options.label;
  }

  return `${getRootCommitRefMetadataHostOutputCanary(record)}:${record.requestSequence}`;
}

function normalizeHostOutputUpdateOptions(options) {
  if (options === null || typeof options !== 'object') {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require an options object.'
    );
  }

  const hostInstanceToken = options.hostInstanceToken;
  if (!isHostInstanceToken(hostInstanceToken)) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require a host instance token.'
    );
  }

  const tag = options.tag;
  if (typeof tag !== 'string' || tag === '') {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require a host tag.'
    );
  }

  const nextProps = options.nextProps;
  if (!isObjectOrFunction(nextProps)) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require object next props.'
    );
  }

  const textUpdate = options.textUpdate;

  return {
    hostInstanceToken,
    nextProps,
    tag,
    textUpdate: normalizeHostOutputTextUpdate(textUpdate)
  };
}

function normalizeHostOutputTextUpdate(textUpdate) {
  if (textUpdate == null) {
    return null;
  }
  if (typeof textUpdate !== 'object') {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output update text metadata must be an object when provided.'
    );
  }

  const textInstance = textUpdate.textInstance;
  if (!isObjectOrFunction(textInstance)) {
    throwInvalidHostOutputUpdateHandoff(
      'Private root host-output updates require a text instance when text metadata is provided.'
    );
  }

  return {
    newText: textUpdate.newText,
    oldText: textUpdate.oldText,
    textInstance
  };
}

function normalizeRootCommitHostComponentUpdateOptions(options) {
  if (options === null || typeof options !== 'object') {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require an options object.'
    );
  }

  const hostInstanceToken = options.hostInstanceToken;
  if (!isHostInstanceToken(hostInstanceToken)) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require a host instance token.'
    );
  }

  const tag = options.tag;
  if (typeof tag !== 'string' || tag === '') {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require a host tag.'
    );
  }

  const nextProps = options.nextProps;
  if (!isObjectOrFunction(nextProps)) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require object next props.'
    );
  }

  if (options.textUpdate != null) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates do not accept HostText update metadata.'
    );
  }

  return {
    hostInstanceToken,
    nextProps,
    recordIndex: normalizeRootCommitRecordIndexOption(options),
    stateNodeRaw: normalizeRootCommitStateNodeSelectorOption(options),
    tag
  };
}

function normalizeRootCommitHostComponentUpdateMetadata(
  rootCommitHostComponentUpdateMetadata,
  selector
) {
  const recordEntries = getRootCommitMetadataRecordEntries(
    rootCommitHostComponentUpdateMetadata
  );
  if (recordEntries.records.length === 0) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require root commit mutation records.'
    );
  }

  const hostComponentUpdateRecords = [];
  for (const entry of recordEntries.records) {
    const snapshot = createRootCommitHostComponentUpdateSnapshot(
      entry.record,
      entry.index,
      recordEntries.source
    );
    if (snapshot !== null) {
      hostComponentUpdateRecords.push(snapshot);
    }
  }

  if (hostComponentUpdateRecords.length === 0) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Expected accepted root commit HostComponent update metadata.'
    );
  }

  let selectedRecords = hostComponentUpdateRecords;
  if (selector.recordIndex !== null) {
    selectedRecords = selectedRecords.filter(
      (candidate) => candidate.recordIndex === selector.recordIndex
    );
  }
  if (selector.stateNodeRaw !== null) {
    selectedRecords = selectedRecords.filter((candidate) =>
      rootCommitRawHandlesEqual(candidate.stateNodeRaw, selector.stateNodeRaw)
    );
  }

  if (selectedRecords.length === 0) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'No root commit HostComponent update metadata matched the requested selector.'
    );
  }
  if (selectedRecords.length > 1) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Multiple root commit HostComponent update records require a stateNodeRaw or recordIndex selector.'
    );
  }

  return {
    hostComponentUpdateRecordCount: hostComponentUpdateRecords.length,
    recordCount: recordEntries.records.length,
    selected: selectedRecords[0],
    source: recordEntries.source
  };
}

function getRootCommitMetadataRecordEntries(rootCommitMetadata) {
  if (Array.isArray(rootCommitMetadata)) {
    return {
      records: createRootCommitMetadataRecordEntries(rootCommitMetadata),
      source: 'array'
    };
  }
  if (!isObjectOrFunction(rootCommitMetadata)) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Private root commit HostComponent updates require reconciler-shaped metadata.'
    );
  }

  const recordPaths = [
    ['mutationApplyRecords'],
    ['mutation_apply_records'],
    ['applyRecords'],
    ['apply_records'],
    ['mutationApplyLog', 'records'],
    ['mutation_apply_log', 'records'],
    ['mutationRecords'],
    ['mutation_records'],
    ['mutationLog', 'records'],
    ['mutation_log', 'records'],
    ['records']
  ];
  for (const path of recordPaths) {
    const pathValue = getRootCommitMetadataPathValue(
      rootCommitMetadata,
      path
    );
    if (pathValue.found && Array.isArray(pathValue.value)) {
      return {
        records: createRootCommitMetadataRecordEntries(pathValue.value),
        source: path.join('.')
      };
    }
  }

  if (looksLikeRootCommitMutationRecord(rootCommitMetadata)) {
    return {
      records: [
        {
          index: 0,
          record: rootCommitMetadata
        }
      ],
      source: 'self'
    };
  }

  return {
    records: [],
    source: 'none'
  };
}

function createRootCommitMetadataRecordEntries(records) {
  return records.map((record, index) => ({
    index,
    record
  }));
}

function createRootCommitHostComponentUpdateSnapshot(
  record,
  recordIndex,
  metadataSource
) {
  if (!isObjectOrFunction(record)) {
    return null;
  }

  const tag = normalizeRootCommitFiberTag(
    getFirstRootCommitMetadataValue(record, [
      'tag',
      'fiberTag',
      'fiber_tag',
      'tagName',
      'tag_name'
    ])
  );
  if (tag !== 'HostComponent') {
    return null;
  }

  const rawKind = getFirstRootCommitMetadataValue(record, [
    'kind',
    'recordKind',
    'record_kind'
  ]);
  const rawApplyKind = getFirstRootCommitMetadataValue(record, [
    'applyKind',
    'apply_kind',
    'mutationApplyKind',
    'mutation_apply_kind'
  ]);
  let applyKind = normalizeRootCommitHostComponentApplyKind(rawApplyKind);
  if (applyKind === null) {
    applyKind = normalizeRootCommitHostComponentApplyKind(rawKind);
  }
  const phaseKind = normalizeRootCommitMutationPhaseKind(rawKind);
  if (applyKind === null && phaseKind !== 'Update') {
    return null;
  }

  const stateNodeRaw = getRootCommitRawHandle(record, [
    ['stateNodeRaw'],
    ['state_node_raw'],
    ['stateNode', 'raw'],
    ['state_node', 'raw'],
    ['stateNode'],
    ['state_node']
  ]);
  const pendingPropsRaw = getRootCommitRawHandle(record, [
    ['pendingPropsRaw'],
    ['pending_props_raw'],
    ['pendingProps', 'raw'],
    ['pending_props', 'raw'],
    ['pendingProps'],
    ['pending_props']
  ]);
  const memoizedPropsRaw = getRootCommitRawHandle(record, [
    ['memoizedPropsRaw'],
    ['memoized_props_raw'],
    ['memoizedProps', 'raw'],
    ['memoized_props', 'raw'],
    ['memoizedProps'],
    ['memoized_props']
  ]);
  const alternateMemoizedPropsRaw = getRootCommitRawHandle(record, [
    ['alternateMemoizedPropsRaw'],
    ['alternate_memoized_props_raw'],
    ['alternateMemoizedProps', 'raw'],
    ['alternate_memoized_props', 'raw'],
    ['alternateMemoizedProps'],
    ['alternate_memoized_props']
  ]);

  if (
    stateNodeRaw === null ||
    pendingPropsRaw === null ||
    memoizedPropsRaw === null ||
    alternateMemoizedPropsRaw === null
  ) {
    throwInvalidRootCommitHostComponentUpdateHandoff(
      'Accepted root commit HostComponent update metadata requires state and props handles.'
    );
  }

  const root = getFirstRootCommitMetadataValue(record, ['root']);
  const hostRoot = getFirstRootCommitMetadataValue(record, [
    'hostRoot',
    'host_root'
  ]);
  const parent = getFirstRootCommitMetadataValue(record, ['parent']);
  const parentTag = normalizeRootCommitFiberTag(
    getFirstRootCommitMetadataValue(record, ['parentTag', 'parent_tag'])
  );
  const fiber = getFirstRootCommitMetadataValue(record, ['fiber']);
  const alternateFiber = getFirstRootCommitMetadataValue(record, [
    'alternateFiber',
    'alternate_fiber'
  ]);
  const source = getFirstRootCommitMetadataValue(record, ['source']);
  const recordKind =
    applyKind === null ? 'Update' : 'CommitHostComponentUpdate';
  const publicRecord = freezeRecord({
    metadataSource,
    recordIndex,
    recordKind,
    applyKind,
    phaseKind,
    tag,
    parentTag,
    stateNodeRaw,
    pendingPropsRaw,
    memoizedPropsRaw,
    alternateMemoizedPropsRaw,
    rootInfo: describeBridgeValue(root),
    hostRootInfo: describeBridgeValue(hostRoot),
    parentInfo: describeBridgeValue(parent),
    fiberInfo: describeBridgeValue(fiber),
    alternateFiberInfo: describeBridgeValue(alternateFiber),
    sourceInfo: describeBridgeValue(source)
  });

  return {
    applyKind,
    metadataSource,
    phaseKind,
    publicRecord,
    record,
    recordIndex,
    stateNodeRaw
  };
}

function looksLikeRootCommitMutationRecord(value) {
  return (
    hasOwnBridgeProperty(value, 'tag') ||
    hasOwnBridgeProperty(value, 'fiberTag') ||
    hasOwnBridgeProperty(value, 'fiber_tag') ||
    hasOwnBridgeProperty(value, 'kind') ||
    hasOwnBridgeProperty(value, 'applyKind') ||
    hasOwnBridgeProperty(value, 'apply_kind')
  );
}

function normalizeRootCommitRecordIndexOption(options) {
  const indexOption = getFirstRootCommitMetadataValue(options, [
    'recordIndex',
    'record_index',
    'rootCommitRecordIndex',
    'root_commit_record_index'
  ]);
  if (indexOption === undefined || indexOption === null) {
    return null;
  }
  if (Number.isSafeInteger(indexOption) && indexOption >= 0) {
    return indexOption;
  }
  if (typeof indexOption === 'string' && /^(0|[1-9][0-9]*)$/.test(indexOption)) {
    const parsedIndex = Number(indexOption);
    if (Number.isSafeInteger(parsedIndex)) {
      return parsedIndex;
    }
  }
  throwInvalidRootCommitHostComponentUpdateHandoff(
    'Private root commit HostComponent update recordIndex selectors must be non-negative integers.'
  );
}

function normalizeRootCommitStateNodeSelectorOption(options) {
  const stateNodeOption = getFirstRootCommitMetadataValue(options, [
    'stateNodeRaw',
    'state_node_raw',
    'rootCommitStateNodeRaw',
    'root_commit_state_node_raw'
  ]);
  if (stateNodeOption === undefined || stateNodeOption === null) {
    return null;
  }
  const normalized = normalizeRootCommitRawHandle(stateNodeOption);
  if (normalized !== null) {
    return normalized;
  }
  throwInvalidRootCommitHostComponentUpdateHandoff(
    'Private root commit HostComponent update stateNodeRaw selectors must be positive integers.'
  );
}

function getRootCommitRawHandle(record, paths) {
  for (const path of paths) {
    const pathValue = getRootCommitMetadataPathValue(record, path);
    if (pathValue.found) {
      const normalized = normalizeRootCommitRawHandle(pathValue.value);
      if (normalized !== null) {
        return normalized;
      }
    }
  }
  return null;
}

function normalizeRootCommitRawHandle(value) {
  if (Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'bigint' && value > 0n) {
    return value.toString();
  }
  if (typeof value === 'string' && /^[1-9][0-9]*$/.test(value)) {
    return value;
  }
  if (isObjectOrFunction(value) && hasOwnBridgeProperty(value, 'raw')) {
    return normalizeRootCommitRawHandle(value.raw);
  }
  return null;
}

function rootCommitRawHandlesEqual(left, right) {
  return String(left) === String(right);
}

function getRootCommitMetadataPathValue(record, path) {
  let current = record;
  for (const segment of path) {
    if (!isObjectOrFunction(current) || !hasOwnBridgeProperty(current, segment)) {
      return {
        found: false,
        value: undefined
      };
    }
    current = current[segment];
  }
  return {
    found: true,
    value: current
  };
}

function getFirstRootCommitMetadataValue(record, fields) {
  for (const field of fields) {
    if (hasOwnBridgeProperty(record, field)) {
      return record[field];
    }
  }
  return undefined;
}

function normalizeRootCommitFiberTag(tag) {
  if (tag === 3) {
    return 'HostRoot';
  }
  if (tag === 5) {
    return 'HostComponent';
  }
  if (tag === 6) {
    return 'HostText';
  }

  const normalized = normalizeRootCommitName(tag);
  if (normalized === 'hostroot') {
    return 'HostRoot';
  }
  if (normalized === 'hostcomponent') {
    return 'HostComponent';
  }
  if (normalized === 'hosttext') {
    return 'HostText';
  }
  return null;
}

function normalizeRootCommitHostComponentApplyKind(kind) {
  const normalized = normalizeRootCommitName(kind);
  if (normalized === 'commithostcomponentupdate') {
    return 'commit-host-component-update';
  }
  return null;
}

function normalizeRootCommitMutationPhaseKind(kind) {
  const normalized = normalizeRootCommitName(kind);
  if (normalized === 'update') {
    return 'Update';
  }
  if (normalized === 'placement') {
    return 'Placement';
  }
  return null;
}

function normalizeRootCommitName(value) {
  return typeof value === 'string'
    ? value.replace(/[^a-z0-9]/gi, '').toLowerCase()
    : null;
}

function assertHostOutputTextInstanceBelongsToHost(hostNode, textInstance) {
  if (textInstance.parentNode === hostNode) {
    return;
  }
  if (
    Array.isArray(hostNode.childNodes) &&
    hostNode.childNodes.includes(textInstance)
  ) {
    return;
  }
  throwInvalidHostOutputUpdateHandoff(
    'Private root host-output updates require the text instance to belong to the host node.'
  );
}

function assertHostOutputChildrenStableWithoutTextUpdate(
  previousProps,
  nextProps
) {
  const previousText = getHostOutputPrimitiveTextChild(
    previousProps,
    'previous'
  );
  const nextText = getHostOutputPrimitiveTextChild(nextProps, 'next');
  if (previousText === null && nextText === null) {
    return;
  }
  if (previousText !== null && nextText !== null && previousText === nextText) {
    return;
  }

  throwInvalidHostOutputUpdateHandoff(
    'Private root host-output updates without a text update require stable primitive children.'
  );
}

function assertHostOutputTextPropsMatch(props, text, phase) {
  if (!isObjectOrFunction(props)) {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require ${phase} host props.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(props, 'children')) {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require ${phase} text children props.`
    );
  }

  const children = props.children;
  const childrenType = typeof children;
  if (childrenType !== 'string' && childrenType !== 'number') {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require primitive ${phase} text children.`
    );
  }
  if (String(children) !== String(text)) {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require ${phase} text to match props.children.`
    );
  }
}

function getHostOutputPrimitiveTextChild(props, phase) {
  if (!isObjectOrFunction(props)) {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require ${phase} host props.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(props, 'children')) {
    return null;
  }

  const children = props.children;
  if (children == null) {
    return null;
  }

  const childrenType = typeof children;
  if (childrenType !== 'string' && childrenType !== 'number') {
    throwInvalidHostOutputUpdateHandoff(
      `Private root host-output updates require primitive ${phase} text children.`
    );
  }
  return String(children);
}

function createHostOutputPropertyMutationEvidence(propertyHandoffPayload) {
  const mutationRecords =
    propertyHandoffPayload === null
      ? []
      : propertyHandoffPayload.mutationRecords;
  const rowKinds = [];
  const evidence = {
    propertyPayloadBacked: true,
    rowCount: mutationRecords.length,
    mutatingRowCount: 0,
    updateRowCount: 0,
    removalRowCount: 0,
    setAttributeCount: 0,
    removeAttributeCount: 0,
    setPropertyCount: 0,
    removePropertyCount: 0,
    setStyleCount: 0,
    removeStyleCount: 0,
    nonPayloadRowCount: 0
  };

  for (const record of mutationRecords) {
    const kind = record.kind;
    if (!rowKinds.includes(kind)) {
      rowKinds.push(kind);
    }

    switch (kind) {
      case ENTRY_SET_ATTRIBUTE:
        evidence.setAttributeCount += 1;
        evidence.updateRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_REMOVE_ATTRIBUTE:
        evidence.removeAttributeCount += 1;
        evidence.removalRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_SET_PROPERTY:
        evidence.setPropertyCount += 1;
        evidence.updateRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_REMOVE_PROPERTY:
        evidence.removePropertyCount += 1;
        evidence.removalRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_SET_STYLE:
        evidence.setStyleCount += 1;
        evidence.updateRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_REMOVE_STYLE:
        evidence.removeStyleCount += 1;
        evidence.removalRowCount += 1;
        evidence.mutatingRowCount += 1;
        break;
      case ENTRY_NON_PAYLOAD:
        evidence.nonPayloadRowCount += 1;
        break;
    }
  }

  return freezeRecord({
    ...evidence,
    attributeRowCount:
      evidence.setAttributeCount + evidence.removeAttributeCount,
    propertyRowCount:
      evidence.setPropertyCount + evidence.removePropertyCount,
    styleRowCount: evidence.setStyleCount + evidence.removeStyleCount,
    rowKinds: freezeArray(rowKinds)
  });
}

function createHostOutputTextMutationSummary(textUpdate) {
  if (textUpdate === null) {
    return freezeRecord({
      newTextLength: null,
      oldTextLength: null,
      status: 'not-requested'
    });
  }

  return freezeRecord({
    newTextLength: String(textUpdate.newText).length,
    oldTextLength: String(textUpdate.oldText).length,
    status: 'mutated'
  });
}

function createHostOutputUpdateAcceptedCapabilities(
  propertyMutationEvidence,
  textMutationApplied
) {
  const capabilities = [
    ...ROOT_BRIDGE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES
  ];
  if (propertyMutationEvidence.attributeRowCount > 0) {
    capabilities.push(
      freezeRecord({
        id: 'attribute-payload-rows',
        accepted: true,
        reason:
          'Ordinary attribute update and removal rows were admitted from property-payload evidence.'
      })
    );
  }
  if (propertyMutationEvidence.styleRowCount > 0) {
    capabilities.push(
      freezeRecord({
        id: 'style-payload-rows',
        accepted: true,
        reason:
          'Style update and removal rows were admitted from property-payload evidence.'
      })
    );
  }
  if (!textMutationApplied) {
    return freezeArray(
      capabilities.filter(
        (capability) => capability.id !== 'fake-dom-text-update'
      )
    );
  }

  return freezeArray(capabilities);
}

function createRootCommitHostComponentUpdateAcceptedCapabilities(
  hostOutputHandoff
) {
  return freezeArray([
    freezeRecord({
      id: 'root-commit-host-component-update-metadata',
      accepted: true,
      reason:
        'Accepted root commit HostComponent update metadata selected the fake-DOM host-output mutation handoff.'
    }),
    ...hostOutputHandoff.acceptedCapabilities
  ]);
}

function isObjectOrFunction(value) {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  );
}

function hasOwnBridgeProperty(value, key) {
  return (
    isObjectOrFunction(value) &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

function validatePortalRootBoundaryRequestRecord(record) {
  const validation = validateRootBridgeRequestRecord(record);
  if (validation.operation !== 'render') {
    throwInvalidPortalRootBoundaryRecord(
      'Expected a private root.render request record for a portal root boundary.'
    );
  }

  const payload = rootRecordPayloads.get(record);
  const portal = payload && payload.element;
  assertAcceptedReactDomPortalObject(portal, validation.rootHandleState);

  return {
    ...validation,
    payload,
    portal
  };
}

function validatePortalCommitHandoffBoundaryRecord(record) {
  const payload = rootPortalBoundaryPayloads.get(record);
  if (payload === undefined) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected a private React DOM portal root boundary record.'
    );
  }

  if (
    record.$$typeof !== privateRootPortalBoundaryRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalBoundaryRecord' ||
    record.operation !== 'portal-root-boundary' ||
    record.boundaryStatus !== ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED ||
    record.diagnosticStatus !== ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED ||
    record.acceptedPortalObjectShape !== true
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected an admitted private React DOM portal boundary record.'
    );
  }

  assertPortalBoundaryStillBlocked(record);

  const rootHandleState = getPrivateRootHandleState(payload.rootHandle);
  assertAcceptedReactDomPortalObject(payload.portal, rootHandleState);
  if (
    payload.portal.containerInfo !== payload.portalContainer ||
    payload.portalChildren !== payload.portal.children
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Private portal boundary payload does not match the portal object.'
    );
  }

  assertFakeDomPortalCommitTarget(payload.portalContainer);

  return {
    payload,
    rootHandleState
  };
}

function validatePortalPrepareMountListenerBoundaryRecord(record) {
  const payload = rootPortalBoundaryPayloads.get(record);
  if (payload === undefined) {
    throwInvalidPortalPrepareMountListenerRecord(
      'Expected a private React DOM portal root boundary record.'
    );
  }

  if (
    record.$$typeof !== privateRootPortalBoundaryRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalBoundaryRecord' ||
    record.operation !== 'portal-root-boundary' ||
    record.boundaryStatus !== ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED ||
    record.diagnosticStatus !== ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED ||
    record.acceptedPortalObjectShape !== true
  ) {
    throwInvalidPortalPrepareMountListenerRecord(
      'Expected an admitted private React DOM portal boundary record.'
    );
  }

  assertPortalBoundaryStillBlockedForPrepareMountListener(record);

  const rootHandleState = getPrivateRootHandleState(payload.rootHandle);
  assertAcceptedReactDomPortalObject(payload.portal, rootHandleState);
  if (
    payload.portal.containerInfo !== payload.portalContainer ||
    payload.portalChildren !== payload.portal.children
  ) {
    throwInvalidPortalPrepareMountListenerRecord(
      'Private portal boundary payload does not match the portal object.'
    );
  }

  return {
    payload,
    rootHandleState
  };
}

function getCachedUnmountHostOutputCleanup(
  bridgeState,
  admissionRecord,
  unmountRecord
) {
  if (!isWeakMapKey(unmountRecord)) {
    return null;
  }

  const existing = rootUnmountHostOutputCleanupRecords.get(unmountRecord);
  if (existing === undefined) {
    return null;
  }

  const payload = rootUnmountHostOutputCleanupPayloads.get(existing);
  if (payload === undefined || payload.admissionRecord !== admissionRecord) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must match their source admission.'
    );
  }
  if (bridgeState !== null && payload.unmountRecord !== unmountRecord) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must match their source unmount request.'
    );
  }
  if (bridgeState !== null) {
    const validation = validateRootBridgeRequestRecord(unmountRecord);
    if (validation.bridgeState !== bridgeState) {
      throwForeignRootBridgeRequest();
    }
  }

  return existing;
}

function validateUnmountHostOutputCleanupRecords(
  admissionRecord,
  unmountRecord
) {
  const admissionPayload =
    rootCreateRenderAdmissionPayloads.get(admissionRecord);
  if (admissionPayload === undefined) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected a private create/render admission record for unmount host-output cleanup.'
    );
  }

  validateCreateRenderAdmissionStillIntact(
    admissionRecord,
    admissionPayload
  );

  const unmountValidation = validateRootBridgeRequestRecord(unmountRecord);
  if (unmountValidation.operation !== 'unmount') {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected a private root.unmount request record for host-output cleanup.'
    );
  }
  if (unmountRecord.noOp) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Cannot run host-output cleanup from a no-op private root.unmount request.'
    );
  }
  if (unmountRecord.lifecycleStatusBefore !== ROOT_LIFECYCLE_RENDERED) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires a previously rendered root.'
    );
  }

  const createValidation = validateRootBridgeRequestRecord(
    admissionPayload.createRecord
  );
  const sideEffectValidation = validateCreateRenderSideEffectRecord(
    admissionPayload.sideEffectRecord,
    admissionPayload.createRecord,
    createValidation
  );
  const unmountPayload = rootRecordPayloads.get(unmountRecord);
  if (unmountPayload.rootHandle !== admissionPayload.createRecord.handle) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires an unmount request for the admitted root handle.'
    );
  }
  if (createValidation.bridgeState !== unmountValidation.bridgeState) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup records must belong to the same root bridge shell.'
    );
  }
  if (sideEffectValidation.bridgeState !== unmountValidation.bridgeState) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup side effects must belong to the same root bridge shell.'
    );
  }
  if (
    admissionPayload.renderRecord.rootId !== unmountRecord.rootId ||
    admissionPayload.renderRecord.rootKind !== unmountRecord.rootKind ||
    admissionPayload.renderRecord.rootTag !== unmountRecord.rootTag
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup root identity must match the admitted render.'
    );
  }
  if (
    admissionPayload.renderRecord.requestSequence >=
    unmountRecord.requestSequence
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup requires root.unmount after the admitted render.'
    );
  }

  return {
    bridgeState: unmountValidation.bridgeState,
    container: sideEffectValidation.container,
    sideEffectRecord: admissionPayload.sideEffectRecord
  };
}

function validateCreateRenderAdmissionStillIntact(
  admissionRecord,
  admissionPayload
) {
  if (
    admissionRecord.$$typeof !== privateRootCreateRenderAdmissionRecordType ||
    admissionRecord.kind !==
      'FastReactDomPrivateRootCreateRenderAdmissionRecord' ||
    admissionRecord.operation !== 'create-render' ||
    admissionRecord.admissionStatus !== ROOT_BRIDGE_CREATE_RENDER_ADMITTED ||
    admissionRecord.executionStatus !== ROOT_BRIDGE_EXECUTION_BLOCKED ||
    admissionRecord.compatibilityStatus !== ROOT_BRIDGE_COMPATIBILITY_BLOCKED ||
    admissionRecord.nativeExecution !== false ||
    admissionRecord.reconcilerExecution !== false ||
    admissionRecord.domMutation !== false ||
    admissionRecord.hydration !== false ||
    admissionRecord.eventDispatch !== false ||
    admissionRecord.compatibilityClaimed !== false
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Expected an intact private create/render admission record.'
    );
  }

  if (
    admissionRecord.createAdmission?.operation !== 'create' ||
    admissionRecord.renderAdmission?.operation !== 'render' ||
    admissionRecord.markerRecord !== admissionPayload.sideEffectRecord.markerRecord ||
    admissionRecord.listenerRegistration !==
      admissionPayload.sideEffectRecord.listenerRegistration
  ) {
    throwInvalidUnmountHostOutputCleanupRecord(
      'Private unmount host-output cleanup admission payload does not match the admission record.'
    );
  }
}

function validatePortalFakeDomMountHandoffRecord(record) {
  const payload = rootPortalCommitHandoffPayloads.get(record);
  if (payload === undefined) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a private React DOM portal commit handoff record.'
    );
  }

  if (
    record.$$typeof !== privateRootPortalCommitHandoffRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord' ||
    record.operation !== 'portal-fake-dom-commit-handoff' ||
    record.handoffStatus !== ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED ||
    record.commitStatus !== ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED ||
    record.fakeDomCommitHandoff !== true ||
    record.fakeDomCommitApplied !== false ||
    record.portalContainerChildrenReplaced !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.preparePortalMount !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.domMutation !== false ||
    record.publicDomMutation !== false ||
    record.listenerInstallation !== false ||
    record.resourceSideEffects !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a blocked private React DOM portal commit handoff record.'
    );
  }

  const rootHandleState = getPrivateRootHandleState(payload.rootHandle);
  assertAcceptedReactDomPortalObject(payload.portal, rootHandleState);
  if (
    payload.portal.containerInfo !== payload.portalContainer ||
    payload.portalChildren !== payload.portal.children
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Private portal commit handoff payload does not match the portal object.'
    );
  }

  assertFakeDomPortalMountTarget(payload.portalContainer);

  return {
    payload,
    rootHandleState
  };
}

function resolveRefCallbackHostOutputOrderingDiagnosticInput(
  requestValidation,
  options
) {
  const explicitSteps = getExplicitRefOrderingDiagnosticSteps(options);
  if (explicitSteps !== null && explicitSteps.some(stepHasRefMetadata)) {
    return {
      acceptedMetadataRecords: freezeArray([]),
      metadataSource: 'diagnostic-options',
      snapshotOptions: options
    };
  }

  const accepted = getAcceptedRootCommitRefMetadataSteps(
    requestValidation,
    explicitSteps
  );
  if (accepted.steps.length > 0) {
    return {
      acceptedMetadataRecords: accepted.acceptedMetadataRecords,
      metadataSource: 'accepted-root-commit-ref-metadata',
      snapshotOptions: freezeRecord({
        steps: accepted.steps
      })
    };
  }

  return {
    acceptedMetadataRecords: freezeArray([]),
    metadataSource: 'diagnostic-options',
    snapshotOptions: options
  };
}

function resolveRefCallbackRootErrorRoutingInput(requestValidation, options) {
  const explicitSteps = getExplicitRefCallbackRootErrorRoutingSteps(options);
  if (explicitSteps !== null && explicitSteps.some(stepHasRefMetadata)) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing must consume accepted root commit ref metadata records.'
    );
  }

  const accepted = getAcceptedRootCommitRefMetadataStepsForRootErrorRouting(
    requestValidation,
    explicitSteps
  );
  if (accepted.steps.length === 0) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing requires accepted root commit ref metadata records.'
    );
  }

  return {
    acceptedMetadataRecords: accepted.acceptedMetadataRecords,
    metadataSource: 'accepted-root-commit-ref-metadata',
    snapshotOptions: freezeRecord({
      steps: accepted.steps
    })
  };
}

function getExplicitRefOrderingDiagnosticSteps(options) {
  if (Array.isArray(options)) {
    return options;
  }

  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'steps')
  ) {
    if (!Array.isArray(options.steps)) {
      throwInvalidRefCallbackHostOutputOrderingDiagnostic(
        'Ref callback ordering diagnostic step options must be an array.'
      );
    }
    return options.steps;
  }

  return null;
}

function getExplicitRefCallbackRootErrorRoutingSteps(options) {
  if (Array.isArray(options)) {
    return options;
  }

  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'steps')
  ) {
    if (!Array.isArray(options.steps)) {
      throwInvalidRefCallbackRootErrorRouting(
        'Ref callback root error routing step options must be an array.'
      );
    }
    return options.steps;
  }

  return null;
}

function stepHasRefMetadata(step) {
  return (
    step !== null &&
    typeof step === 'object' &&
    (Object.prototype.hasOwnProperty.call(step, 'rootCommitRefMetadata') ||
      Object.prototype.hasOwnProperty.call(step, 'refMetadata'))
  );
}

function getAcceptedRootCommitRefMetadataStepsForRootErrorRouting(
  requestValidation,
  explicitSteps
) {
  const acceptedMetadataRecords = [];
  const steps = [];

  for (const requestRecord of requestValidation.records) {
    const acceptedRecord =
      rootCommitRefMetadataRecordsByRequest.get(requestRecord);
    if (acceptedRecord === undefined) {
      continue;
    }

    const payload = rootCommitRefMetadataPayloads.get(acceptedRecord);
    if (payload === undefined) {
      throwInvalidRefCallbackRootErrorRouting(
        'Accepted root commit ref metadata is missing its private payload.'
      );
    }

    acceptedMetadataRecords.push(acceptedRecord);
    const stepOptions =
      explicitSteps === null ? null : explicitSteps[steps.length] || null;
    steps.push(
      createAcceptedRootCommitRefMetadataRootErrorRoutingStep(
        payload,
        stepOptions
      )
    );
  }

  if (
    explicitSteps !== null &&
    acceptedMetadataRecords.length > 0 &&
    explicitSteps.length !== acceptedMetadataRecords.length
  ) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing step options must match accepted root commit ref metadata records.'
    );
  }

  return {
    acceptedMetadataRecords: freezeArray(acceptedMetadataRecords),
    steps: freezeArray(steps)
  };
}

function createAcceptedRootCommitRefMetadataRootErrorRoutingStep(
  payload,
  stepOptions
) {
  return freezeRecord({
    hostOutputCanary:
      stepOptions !== null && stepOptions.hostOutputCanary !== undefined
        ? stepOptions.hostOutputCanary
        : payload.hostOutputCanary,
    label:
      stepOptions !== null && stepOptions.label !== undefined
        ? stepOptions.label
        : payload.label,
    rootCommitRefMetadata: payload.rootCommitRefMetadataSnapshot
  });
}

function getAcceptedRootCommitRefMetadataSteps(
  requestValidation,
  explicitSteps
) {
  const acceptedMetadataRecords = [];
  const steps = [];

  for (const requestRecord of requestValidation.records) {
    const acceptedRecord =
      rootCommitRefMetadataRecordsByRequest.get(requestRecord);
    if (acceptedRecord === undefined) {
      continue;
    }

    const payload = rootCommitRefMetadataPayloads.get(acceptedRecord);
    if (payload === undefined) {
      throwInvalidRefCallbackHostOutputOrderingDiagnostic(
        'Accepted root commit ref metadata is missing its private payload.'
      );
    }

    acceptedMetadataRecords.push(acceptedRecord);
    const stepOptions =
      explicitSteps === null ? null : explicitSteps[steps.length] || null;
    steps.push(
      createAcceptedRootCommitRefMetadataStep(
        requestRecord,
        payload,
        stepOptions
      )
    );
  }

  if (
    explicitSteps !== null &&
    acceptedMetadataRecords.length > 0 &&
    explicitSteps.length !== acceptedMetadataRecords.length
  ) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback ordering step options must match accepted root commit ref metadata records.'
    );
  }

  return {
    acceptedMetadataRecords: freezeArray(acceptedMetadataRecords),
    steps: freezeArray(steps)
  };
}

function createAcceptedRootCommitRefMetadataStep(
  requestRecord,
  payload,
  stepOptions
) {
  return freezeRecord({
    hostOutputCanary:
      stepOptions !== null && stepOptions.hostOutputCanary !== undefined
        ? stepOptions.hostOutputCanary
        : payload.hostOutputCanary,
    label:
      stepOptions !== null && stepOptions.label !== undefined
        ? stepOptions.label
        : payload.label,
    latestPropsUpdates: getAcceptedRootCommitRefLatestPropsUpdates(
      requestRecord,
      stepOptions
    ),
    rootCommitRefMetadata: payload.rootCommitRefMetadataSnapshot
  });
}

function getAcceptedRootCommitRefLatestPropsUpdates(
  requestRecord,
  stepOptions
) {
  if (
    stepOptions !== null &&
    Object.prototype.hasOwnProperty.call(stepOptions, 'latestPropsUpdates')
  ) {
    return stepOptions.latestPropsUpdates;
  }

  const handoff = rootHostOutputUpdateHandoffRecords.get(requestRecord);
  if (handoff === undefined) {
    return [];
  }

  const payload = rootHostOutputUpdateHandoffPayloads.get(handoff);
  if (payload === undefined) {
    return [];
  }

  return [
    {
      hostInstanceToken: payload.hostInstanceToken,
      latestProps: payload.nextProps
    }
  ];
}

function validatePortalChildReconciliationDiagnosticRecords(
  mountRecord,
  boundaryRecord
) {
  const mountPayload = rootPortalFakeDomMountPayloads.get(mountRecord);
  if (mountPayload === undefined) {
    throwInvalidPortalChildReconciliationRecord(
      'Expected a private React DOM portal fake-DOM mount diagnostic record.'
    );
  }

  assertPrivatePortalMountDiagnosticStillIntact(mountRecord, mountPayload);

  const boundaryPayload = rootPortalBoundaryPayloads.get(boundaryRecord);
  if (boundaryPayload === undefined) {
    throwInvalidPortalChildReconciliationRecord(
      'Expected an accepted private React DOM portal boundary record.'
    );
  }

  if (
    boundaryRecord.$$typeof !== privateRootPortalBoundaryRecordType ||
    boundaryRecord.kind !== 'FastReactDomPrivateRootPortalBoundaryRecord' ||
    boundaryRecord.operation !== 'portal-root-boundary' ||
    boundaryRecord.boundaryStatus !== ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED ||
    boundaryRecord.diagnosticStatus !== ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED ||
    boundaryRecord.acceptedPortalObjectShape !== true
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Expected an admitted private React DOM portal boundary record.'
    );
  }

  assertPortalBoundaryStillBlockedForChildReconciliation(boundaryRecord);

  if (boundaryPayload.rootHandle !== mountPayload.rootHandle) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires the same private root handle.'
    );
  }
  if (boundaryPayload.portalContainer !== mountPayload.portalContainer) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires the same portal container.'
    );
  }
  if (boundaryPayload.portal.key !== mountPayload.portal.key) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires the same portal key.'
    );
  }
  if (boundaryRecord.sourceRequestSequence <= mountRecord.sourceRequestSequence) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires a later accepted portal boundary.'
    );
  }

  const rootHandleState = getPrivateRootHandleState(mountPayload.rootHandle);
  assertAcceptedReactDomPortalObject(boundaryPayload.portal, rootHandleState);
  assertFakeDomPortalMountTarget(mountPayload.portalContainer);

  const hostNode = assertMountedHostInstanceToken(
    mountPayload.hostInstanceToken
  );
  const textNode = assertMountedHostInstanceToken(mountPayload.hostTextToken);
  if (hostNode !== mountPayload.hostComponentNode) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostComponent token no longer matches the mounted fake-DOM node.'
    );
  }
  if (textNode !== mountPayload.hostTextNode) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostText token no longer matches the mounted fake-DOM node.'
    );
  }
  if (getRootOwnerFromHostInstanceToken(mountPayload.hostInstanceToken) !==
    mountPayload.rootHandle.owner) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostComponent must be owned by the updated private root.'
    );
  }
  if (getRootOwnerFromHostInstanceToken(mountPayload.hostTextToken) !==
    mountPayload.rootHandle.owner) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostText must be owned by the updated private root.'
    );
  }
  if (!isCurrentChild(mountPayload.portalContainer, hostNode)) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostComponent must still be mounted in the portal container.'
    );
  }
  if (!isCurrentChild(hostNode, textNode)) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal HostText must still be mounted under the portal HostComponent.'
    );
  }

  return {
    boundaryPayload,
    mountPayload,
    rootHandleState
  };
}

function validatePortalEventOwnerRootGateMountRecord(mountRecord) {
  const mountPayload = rootPortalFakeDomMountPayloads.get(mountRecord);
  if (mountPayload === undefined) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Expected a private React DOM portal fake-DOM mount diagnostic record.'
    );
  }

  assertPrivatePortalMountDiagnosticStillIntactForEventOwnerRoot(
    mountRecord,
    mountPayload
  );

  const rootHandleState = getPrivateRootHandleState(mountPayload.rootHandle);
  assertAcceptedReactDomPortalObject(mountPayload.portal, rootHandleState);
  assertFakeDomPortalMountTarget(mountPayload.portalContainer);

  const hostNode = assertMountedHostInstanceToken(
    mountPayload.hostInstanceToken
  );
  const textNode = assertMountedHostInstanceToken(mountPayload.hostTextToken);
  if (hostNode !== mountPayload.hostComponentNode) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostComponent token no longer matches the mounted fake-DOM node.'
    );
  }
  if (textNode !== mountPayload.hostTextNode) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostText token no longer matches the mounted fake-DOM node.'
    );
  }
  if (
    getRootOwnerFromHostInstanceToken(mountPayload.hostInstanceToken) !==
    mountPayload.rootHandle.owner
  ) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostComponent must be owned by the private root.'
    );
  }
  if (
    getRootOwnerFromHostInstanceToken(mountPayload.hostTextToken) !==
    mountPayload.rootHandle.owner
  ) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostText must be owned by the private root.'
    );
  }
  if (!isCurrentChild(mountPayload.portalContainer, hostNode)) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostComponent must still be mounted in the portal container.'
    );
  }
  if (!isCurrentChild(hostNode, textNode)) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal HostText must still be mounted under the portal HostComponent.'
    );
  }

  return {
    mountPayload,
    rootHandleState
  };
}

function validateRefCallbackHostOutputOrderingDiagnosticRequests(
  bridgeState,
  rootRequestRecords
) {
  if (!Array.isArray(rootRequestRecords) || rootRequestRecords.length === 0) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback host-output ordering diagnostics require private root request records.'
    );
  }

  const validations = rootRequestRecords.map((record) => ({
    record,
    validation: validateRootBridgeRequestRecord(record)
  }));
  const firstValidation = validations[0].validation;
  if (bridgeState !== null && firstValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const rootId = validations[0].record.rootId;
  const rootKind = validations[0].record.rootKind;
  const rootTag = validations[0].record.rootTag;
  const updateRenderRequests = [];
  const unmountRequests = [];

  for (const {record, validation} of validations) {
    if (bridgeState !== null && validation.bridgeState !== bridgeState) {
      throwForeignRootBridgeRequest();
    }
    if (validation.bridgeState !== firstValidation.bridgeState) {
      throwInvalidRefCallbackHostOutputOrderingDiagnostic(
        'Ref callback host-output ordering diagnostics require one private root bridge shell.'
      );
    }
    if (
      record.rootId !== rootId ||
      record.rootKind !== rootKind ||
      record.rootTag !== rootTag
    ) {
      throwInvalidRefCallbackHostOutputOrderingDiagnostic(
        'Ref callback host-output ordering diagnostics require one root identity.'
      );
    }

    if (record.operation === 'render' && record.renderCount > 1) {
      updateRenderRequests.push(record);
    } else if (record.operation === 'unmount' && record.noOp === false) {
      unmountRequests.push(record);
    }
  }

  if (updateRenderRequests.length === 0) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback host-output ordering diagnostics require a private update render request.'
    );
  }
  if (unmountRequests.length === 0) {
    throwInvalidRefCallbackHostOutputOrderingDiagnostic(
      'Ref callback host-output ordering diagnostics require a private unmount request.'
    );
  }

  return {
    bridgeState: firstValidation.bridgeState,
    firstUnmountRequest: unmountRequests[0],
    lastUpdateRenderRequest:
      updateRenderRequests[updateRenderRequests.length - 1],
    records: validations.map(({record}) => record),
    rootId,
    rootKind,
    rootTag,
    unmountRequests,
    updateRenderRequests
  };
}

function validateRefCallbackRootErrorRoutingRequests(
  bridgeState,
  rootRequestRecords
) {
  if (!Array.isArray(rootRequestRecords) || rootRequestRecords.length === 0) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing requires private root request records.'
    );
  }

  const validations = rootRequestRecords.map((record) => ({
    record,
    validation: validateRootBridgeRequestRecord(record)
  }));
  const firstValidation = validations[0].validation;
  if (firstValidation.operation === 'hydrate') {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing does not support hydration records.'
    );
  }
  if (bridgeState !== null && firstValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const rootId = validations[0].record.rootId;
  const rootKind = validations[0].record.rootKind;
  const rootTag = validations[0].record.rootTag;
  const eligibleRequests = [];

  for (const {record, validation} of validations) {
    if (validation.operation === 'hydrate') {
      throwInvalidRefCallbackRootErrorRouting(
        'Ref callback root error routing does not support hydration records.'
      );
    }
    if (bridgeState !== null && validation.bridgeState !== bridgeState) {
      throwForeignRootBridgeRequest();
    }
    if (validation.bridgeState !== firstValidation.bridgeState) {
      throwInvalidRefCallbackRootErrorRouting(
        'Ref callback root error routing requires one private root bridge shell.'
      );
    }
    if (
      record.rootId !== rootId ||
      record.rootKind !== rootKind ||
      record.rootTag !== rootTag
    ) {
      throwInvalidRefCallbackRootErrorRouting(
        'Ref callback root error routing requires one root identity.'
      );
    }

    if (
      record.operation === 'render' ||
      (record.operation === 'unmount' && record.noOp === false)
    ) {
      eligibleRequests.push(record);
    }
  }

  if (eligibleRequests.length === 0) {
    throwInvalidRefCallbackRootErrorRouting(
      'Ref callback root error routing requires a render or non-noop unmount request.'
    );
  }

  return {
    bridgeState: firstValidation.bridgeState,
    records: validations.map(({record}) => record),
    rootHandleState: firstValidation.rootHandleState,
    rootId,
    rootKind,
    rootTag
  };
}

function validateEventListenerRootErrorRoutingRequests(
  bridgeState,
  rootRequestRecords
) {
  if (!Array.isArray(rootRequestRecords) || rootRequestRecords.length === 0) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires private root request records.'
    );
  }

  const validations = rootRequestRecords.map((record) => ({
    record,
    validation: validateRootBridgeRequestRecord(record)
  }));
  const firstValidation = validations[0].validation;
  if (firstValidation.operation === 'hydrate') {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing does not support hydration records.'
    );
  }
  if (bridgeState !== null && firstValidation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const rootId = validations[0].record.rootId;
  const rootKind = validations[0].record.rootKind;
  const rootTag = validations[0].record.rootTag;
  const eligibleRequests = [];
  let rootOwner = null;

  for (const {record, validation} of validations) {
    if (validation.operation === 'hydrate') {
      throwInvalidEventListenerRootErrorRouting(
        'Event listener root error routing does not support hydration records.'
      );
    }
    if (bridgeState !== null && validation.bridgeState !== bridgeState) {
      throwForeignRootBridgeRequest();
    }
    if (validation.bridgeState !== firstValidation.bridgeState) {
      throwInvalidEventListenerRootErrorRouting(
        'Event listener root error routing requires one private root bridge shell.'
      );
    }
    if (
      record.rootId !== rootId ||
      record.rootKind !== rootKind ||
      record.rootTag !== rootTag
    ) {
      throwInvalidEventListenerRootErrorRouting(
        'Event listener root error routing requires one root identity.'
      );
    }

    const requestRootOwner = getRootOwnerFromRootBridgeRequestRecord(record);
    if (requestRootOwner !== null) {
      if (rootOwner === null) {
        rootOwner = requestRootOwner;
      } else if (rootOwner !== requestRootOwner) {
        throwInvalidEventListenerRootErrorRouting(
          'Event listener root error routing requires one root owner.'
        );
      }
    }

    if (record.operation === 'render') {
      eligibleRequests.push(record);
    }
  }

  if (eligibleRequests.length === 0) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires a private root.render request.'
    );
  }
  if (rootOwner === null) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires a private root owner.'
    );
  }

  return {
    bridgeState: firstValidation.bridgeState,
    records: validations.map(({record}) => record),
    rootHandleState: firstValidation.rootHandleState,
    rootId,
    rootKind,
    rootOwner,
    rootTag
  };
}

function validateEventListenerRootErrorRoutingCanary(
  requestValidation,
  eventDispatchCanaryRecord
) {
  const eventDispatchCanaryPayload =
    getPrivateRootHostOutputClickDispatchCanaryPayload(
      eventDispatchCanaryRecord
    );
  if (
    eventDispatchCanaryPayload === null ||
    !isPrivateRootHostOutputClickDispatchCanaryRecord(
      eventDispatchCanaryRecord
    )
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires a private root host-output click dispatch canary record.'
    );
  }
  if (
    eventDispatchCanaryRecord.listenerErrorRoutingDiagnosticEnabled !== true
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires listener error routing diagnostics to be enabled.'
    );
  }
  if (
    eventDispatchCanaryPayload.targetPayload.targetRootOwner !==
    requestValidation.rootOwner
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires an event target from the same private root owner.'
    );
  }

  const listenerErrorRoutes = Array.isArray(
    eventDispatchCanaryRecord.listenerErrorRoutes
  )
    ? eventDispatchCanaryRecord.listenerErrorRoutes
    : [];
  if (
    listenerErrorRoutes.length === 0 ||
    eventDispatchCanaryRecord.listenerErrorRouteCount !==
      listenerErrorRoutes.length
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Event listener root error routing requires captured listener error route records.'
    );
  }

  const listenerErrorRoutePayloads = [];
  for (const errorRoute of listenerErrorRoutes) {
    const routePayload =
      getDispatchListenerErrorRouteRecordPayload(errorRoute);
    if (
      !isDispatchListenerErrorRouteRecord(errorRoute) ||
      routePayload === null ||
      errorRoute.errorRouteTarget !== 'reportGlobalError' ||
      errorRoute.errorReported !== false
    ) {
      throwInvalidEventListenerRootErrorRouting(
        'Event listener root error routing requires blocked reportGlobalError route records.'
      );
    }
    listenerErrorRoutePayloads.push(routePayload);
  }

  return {
    eventDispatchCanaryPayload,
    eventDispatchCanaryRecord,
    listenerErrorRoutePayloads: freezeArray(listenerErrorRoutePayloads),
    listenerErrorRoutes: freezeArray(listenerErrorRoutes)
  };
}

function validateEventListenerRootErrorRoutingPortalEventOwnerRootGate(
  requestValidation,
  eventValidation,
  routingOptions
) {
  const gateRecord = routingOptions.portalEventOwnerRootGateRecord;
  if (gateRecord === null) {
    return freezeRecord({
      enabled: false,
      gateId: null,
      gateKind: null,
      gatePayload: null,
      gateRecord: null,
      gateStatus: 'not-applicable',
      gateSummary: null,
      ownerRootMatchesTargetRoot: false,
      pluginGatePayload: null,
      pluginGateRecord: null,
      portalContainerContainsTarget: false,
      rootContainerContainsTarget: false,
      targetDispatchPathLength: 0
    });
  }

  const gatePayload = rootPortalEventOwnerRootGatePayloads.get(gateRecord);
  if (
    gatePayload === undefined ||
    !isPrivateRootPortalEventOwnerRootGateRecord(gateRecord)
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires an accepted private portal owner-root gate record.'
    );
  }
  if (
    gateRecord.gateStatus !== ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED ||
    gateRecord.eventBubblingStatus !== ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires a blocked portal owner-root event gate.'
    );
  }

  const portalRootHandleState = getPrivateRootHandleState(
    gatePayload.rootHandle
  );
  if (
    portalRootHandleState !== requestValidation.rootHandleState ||
    gatePayload.rootHandle.owner !== requestValidation.rootOwner
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires the same private root owner.'
    );
  }

  const pluginGateRecord = gatePayload.eventOwnerRootGateRecord;
  const pluginGatePayload = getPluginPortalEventOwnerRootGateRecordPayload(
    pluginGateRecord
  );
  if (
    pluginGatePayload === null ||
    !isPluginPortalEventOwnerRootGateRecord(pluginGateRecord)
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires plugin owner-root path metadata.'
    );
  }
  if (
    pluginGateRecord.domEventName !==
      eventValidation.eventDispatchCanaryRecord.domEventName ||
    pluginGateRecord.targetInst !==
      eventValidation.eventDispatchCanaryRecord.targetInst ||
    pluginGateRecord.targetInst !==
      eventValidation.eventDispatchCanaryPayload.targetRecord.targetInst ||
    pluginGatePayload.targetNode !==
      eventValidation.eventDispatchCanaryPayload.targetPayload.targetNode
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires the listener error route target to match the portal owner-root path.'
    );
  }
  if (
    pluginGatePayload.ownerRoot !== requestValidation.rootOwner ||
    pluginGateRecord.ownerRootMatchesTargetRoot !== true ||
    pluginGateRecord.publicPortalBubblingEnabled !== false ||
    pluginGateRecord.eventDispatch !== false
  ) {
    throwInvalidEventListenerRootErrorRouting(
      'Portal event listener root error routing requires blocked owner-root portal event metadata.'
    );
  }

  return freezeRecord({
    enabled: true,
    gateId: gateRecord.gateId,
    gateKind: gateRecord.kind,
    gatePayload,
    gateRecord,
    gateStatus: gateRecord.gateStatus,
    gateSummary: summarizePortalEventOwnerRootGateRecord(pluginGateRecord),
    ownerRootMatchesTargetRoot: pluginGateRecord.ownerRootMatchesTargetRoot,
    pluginGatePayload,
    pluginGateRecord,
    portalContainerContainsTarget:
      pluginGateRecord.portalContainerContainsTarget,
    rootContainerContainsTarget: pluginGateRecord.rootContainerContainsTarget,
    targetDispatchPathLength: pluginGateRecord.targetDispatchPathLength
  });
}

function createEventListenerRootErrorOptionCallbackRecord({
  errorRoute,
  errorRoutePayload,
  index,
  portalEventOwnerRootValidation,
  requestValidation,
  rootErrorCallbacks,
  routingOptions
}) {
  const errorSummary = describeCapturedErrorForDiagnostics(
    errorRoutePayload.error
  );
  const sourceLabel =
    routingOptions.routeLabels[index] === undefined
      ? null
      : routingOptions.routeLabels[index];

  return freezeRecord({
    kind: 'FastReactDomPrivateRootEventListenerErrorOptionCallbackRecord',
    status: ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED,
    acceptedRootOptionCallbackRecord: true,
    diagnosticOnly: true,
    phase: 'event-listener',
    rootId: requestValidation.rootId,
    rootKind: requestValidation.rootKind,
    rootTag: requestValidation.rootTag,
    errorRouteIndex: index,
    sourceErrorRouteIndex: errorRoute.errorRouteIndex,
    sourceErrorRouteKind: errorRoute.kind,
    sourceErrorRouteTarget: errorRoute.errorRouteTarget,
    sourceLabel,
    dispatchPathIndex: errorRoute.dispatchPathIndex,
    domEventName: errorRoute.domEventName,
    nativeEventType: errorRoute.nativeEventType,
    registrationName: errorRoute.registrationName,
    listenerPhase: errorRoute.phase,
    targetInst: errorRoute.targetInst,
    portalEventErrorRoutingDiagnostic:
      portalEventOwnerRootValidation.enabled,
    portalEventOwnerRootGateId:
      portalEventOwnerRootValidation.gateId,
    portalEventOwnerRootGateStatus:
      portalEventOwnerRootValidation.gateStatus,
    portalEventOwnerRootMatchesTargetRoot:
      portalEventOwnerRootValidation.ownerRootMatchesTargetRoot,
    portalEventTargetDispatchPathLength:
      portalEventOwnerRootValidation.targetDispatchPathLength,
    portalContainerContainsEventTarget:
      portalEventOwnerRootValidation.portalContainerContainsTarget,
    rootContainerContainsEventTarget:
      portalEventOwnerRootValidation.rootContainerContainsTarget,
    portalEventBubbling: false,
    publicPortalBubbling: false,
    portalEventDispatch: false,
    errorName: errorSummary.name,
    errorMessage: errorSummary.message,
    errorCode: errorSummary.code,
    errorType: errorSummary.type,
    errorReported: false,
    reportGlobalErrorInvoked: false,
    rootErrorCallbacks,
    onUncaughtErrorConfigured:
      rootErrorCallbacks.onUncaughtError.configured,
    onCaughtErrorConfigured: rootErrorCallbacks.onCaughtError.configured,
    onRecoverableErrorConfigured:
      rootErrorCallbacks.onRecoverableError.configured,
    rootErrorCallbacksInvoked: false,
    publicRootErrorCallbacksInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    rootErrorUpdatesScheduled: false,
    publicErrorBoundariesEnabled: false,
    recoverableErrorCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    compatibilityClaimed: false,
    exposesErrorValue: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false
  });
}

function validateHydrationReplayErrorMetadataRequest(
  bridgeState,
  hydrateRootRecord
) {
  const validation = validateRootBridgeRequestRecord(hydrateRootRecord);
  if (validation.operation !== 'hydrate') {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires a private hydrateRoot request record.'
    );
  }
  if (bridgeState !== null && validation.bridgeState !== bridgeState) {
    throwForeignRootBridgeRequest();
  }

  const payload = rootRecordPayloads.get(hydrateRootRecord);
  if (payload === undefined) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires a private hydrateRoot payload.'
    );
  }
  const hydrationBoundaryRecord = hydrateRootRecord.hydrationBoundaryRecord;
  if (!isPrivateHydrationBoundaryRecord(hydrationBoundaryRecord)) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires a private hydration boundary record.'
    );
  }

  return {
    bridgeState: validation.bridgeState,
    container: payload.container,
    hydrateRootRecord,
    hydrationBoundaryRecord,
    hydrationOptions: payload.hydrationOptions,
    initialChildren: payload.initialChildren,
    rootRecordId: hydrationBoundaryRecord.recordId
  };
}

function validateHydrationReplayErrorMetadataOwnership(
  requestValidation,
  ownershipDiagnostics
) {
  if (
    !ownershipDiagnostics ||
    typeof ownershipDiagnostics !== 'object' ||
    ownershipDiagnostics.kind !==
      HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires a private replay ownership diagnostic.'
    );
  }
  if (
    ownershipDiagnostics.rootRecordId !== requestValidation.rootRecordId ||
    ownershipDiagnostics.rootKind !==
      requestValidation.hydrationBoundaryRecord.rootKind ||
    ownershipDiagnostics.rootTag !==
      requestValidation.hydrationBoundaryRecord.rootTag
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay ownership metadata must match the hydrateRoot boundary record.'
    );
  }
  if (
    ownershipDiagnostics.eventReplayQueueDiagnosticsAccepted !== true ||
    ownershipDiagnostics.targetResolutionDiagnosticsAccepted !== true ||
    ownershipDiagnostics.drainOrderDiagnosticsAccepted !== true ||
    ownershipDiagnostics.orderSource !== 'dehydrated-target-root-metadata' ||
    !ownershipDiagnostics.eventReplayQueueDiagnostics ||
    typeof ownershipDiagnostics.eventReplayQueueDiagnostics !== 'object' ||
    ownershipDiagnostics.eventReplayQueueDiagnostics.kind !==
      HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires accepted target resolution and drain-order diagnostics.'
    );
  }
  if (
    ownershipDiagnostics.status !==
      'blocked-replay-ownership-retained-through-drain-order' ||
    ownershipDiagnostics.ownershipRetainedThroughDrainOrder !== true
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires retained dehydrated ownership through drain order.'
    );
  }

  const ownershipRows = Array.isArray(ownershipDiagnostics.ownershipRows)
    ? ownershipDiagnostics.ownershipRows
    : [];
  if (
    ownershipRows.length === 0 ||
    ownershipRows.length !== ownershipDiagnostics.ownershipRowCount ||
    ownershipRows.length !== ownershipDiagnostics.drainOrderCount ||
    ownershipRows.length !==
      ownershipDiagnostics.blockedEventReplayTargetCount
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires retained replay target ownership rows.'
    );
  }
  if (
    ownershipDiagnostics.rootOwnershipRetainedCount !== ownershipRows.length ||
    ownershipDiagnostics.ownershipRetainedCount !== ownershipRows.length ||
    ownershipDiagnostics.dehydratedBoundaryOwnershipRetainedCount !==
      ownershipDiagnostics.dehydratedBoundaryOwnershipRequiredCount
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata is fail-closed for missing dehydrated ownership.'
    );
  }

  for (const ownershipRow of ownershipRows) {
    validateHydrationReplayErrorMetadataOwnershipRow(ownershipRow);
  }

  return {
    ownershipRows: freezeArray(ownershipRows)
  };
}

function validateHydrationReplayErrorMetadataOwnershipRow(ownershipRow) {
  if (
    !ownershipRow ||
    typeof ownershipRow !== 'object' ||
    ownershipRow.kind !== HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires private ownership row records.'
    );
  }
  if (
    ownershipRow.ownershipRetainedThroughDrainOrder !== true ||
    ownershipRow.rootOwnershipRetained !== true ||
    ownershipRow.eventQueueRootOwnershipStatus !==
      'owned-by-dehydrated-root' ||
    ownershipRow.drainOrderRootOwnershipStatus !==
      'owned-by-dehydrated-root' ||
    ownershipRow.targetPathRetained !== true ||
    ownershipRow.queueIdentityRetained !== true ||
    ownershipRow.blockedOwnerRetained !== true
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires retained dehydrated root ownership.'
    );
  }
  if (
    ownershipRow.dehydratedBoundaryOwnershipRequired === true &&
    ownershipRow.dehydratedBoundaryOwnershipRetained !== true
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata requires retained dehydrated boundary ownership.'
    );
  }
  if (
    ownershipRow.queued !== false ||
    ownershipRow.replayQueueDrained !== false ||
    ownershipRow.willDrainReplayQueues !== false ||
    ownershipRow.willDispatch !== false ||
    ownershipRow.willHydrate !== false ||
    ownershipRow.willReplay !== false
  ) {
    throwInvalidHydrationReplayErrorMetadata(
      'Hydration replay error metadata must not consume replayed or queued event rows.'
    );
  }
}

function createHydrationReplayErrorOptionCallbackRecord({
  index,
  metadataOptions,
  ownershipRow,
  requestValidation,
  rootErrorCallbacks
}) {
  const sourceLabel =
    metadataOptions.replayTargetLabels[index] === undefined
      ? null
      : metadataOptions.replayTargetLabels[index];

  return freezeRecord({
    kind: 'FastReactDomPrivateRootHydrationReplayErrorOptionCallbackRecord',
    status: ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED,
    acceptedRootOptionCallbackRecord: true,
    diagnosticOnly: true,
    phase: 'hydration-replay',
    hydrateId: requestValidation.hydrateRootRecord.hydrateId,
    rootId: requestValidation.hydrateRootRecord.rootId,
    rootKind: requestValidation.hydrateRootRecord.rootKind,
    rootTag: requestValidation.hydrateRootRecord.rootTag,
    rootRecordId: requestValidation.rootRecordId,
    replayTargetIndex: index,
    sourceLabel,
    inputOrder: ownershipRow.inputOrder,
    replayQueueOrder: ownershipRow.replayQueueOrder,
    drainOrder: ownershipRow.drainOrder,
    prioritySortKey: ownershipRow.prioritySortKey,
    domEventName: ownershipRow.domEventName,
    nativeEventType: ownershipRow.nativeEventType,
    queueCategory: ownershipRow.queueCategory,
    queueName: ownershipRow.queueName,
    queuePolicy: ownershipRow.queuePolicy,
    replayableEvent: ownershipRow.replayableEvent,
    targetPath: ownershipRow.drainOrderTargetPath,
    targetPathStatus: ownershipRow.drainOrderTargetPathStatus,
    rootOwnershipStatus: ownershipRow.drainOrderRootOwnershipStatus,
    dehydratedRootOwnerStatus:
      ownershipRow.drainOrderDehydratedRootOwnerStatus,
    dehydratedBoundaryOwnershipRequired:
      ownershipRow.dehydratedBoundaryOwnershipRequired,
    dehydratedBoundaryOwnerId:
      ownershipRow.drainOrderDehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerIndex:
      ownershipRow.drainOrderDehydratedBoundaryOwnerIndex,
    dehydratedBoundaryOwnerPath:
      ownershipRow.drainOrderDehydratedBoundaryOwnerPath,
    dehydratedBoundaryOwnerStatus:
      ownershipRow.drainOrderDehydratedBoundaryOwnerStatus,
    blockedOnKind: ownershipRow.blockedOnKind,
    blockedOnStatus: ownershipRow.blockedOnStatus,
    blockedOnSortKey: ownershipRow.blockedOnSortKey,
    errorName: 'Error',
    errorMessage: createHydrationReplayErrorMetadataMessage(ownershipRow),
    errorCode: 'FAST_REACT_DOM_HYDRATION_REPLAY_BLOCKED',
    errorType: 'synthetic-diagnostic-metadata',
    errorReported: false,
    reportGlobalErrorInvoked: false,
    rootErrorCallbacks,
    onUncaughtErrorConfigured:
      rootErrorCallbacks.onUncaughtError.configured,
    onCaughtErrorConfigured: rootErrorCallbacks.onCaughtError.configured,
    onRecoverableErrorConfigured:
      rootErrorCallbacks.onRecoverableError.configured,
    rootErrorCallbacksInvoked: false,
    publicRootErrorCallbacksInvoked: false,
    rootErrorCallbackInvocationCount: 0,
    rootErrorUpdatesScheduled: false,
    queuedRecoverableError: false,
    recoverableErrorCompatibilityClaimed: false,
    publicErrorBoundariesEnabled: false,
    publicRootBehaviorChanged: false,
    compatibilityClaimed: false,
    hydration: false,
    eventDispatch: false,
    eventsReplayed: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    exposesErrorValue: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    exposesHydrationTarget: false
  });
}

function createHydrationReplayErrorMetadataMessage(ownershipRow) {
  const domEventName =
    typeof ownershipRow.domEventName === 'string'
      ? ownershipRow.domEventName
      : 'unknown-event';
  const targetPath =
    typeof ownershipRow.drainOrderTargetPath === 'string'
      ? ownershipRow.drainOrderTargetPath
      : 'unknown-target';
  const blockedOnStatus =
    typeof ownershipRow.blockedOnStatus === 'string'
      ? ownershipRow.blockedOnStatus
      : 'blocked';
  return `Hydration replay for ${domEventName} at ${targetPath} remained ${blockedOnStatus}.`;
}

function normalizeHydrationReplayErrorMetadataOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const replayTargetLabels = Array.isArray(
    normalizedOptions.replayTargetLabels
  )
    ? normalizedOptions.replayTargetLabels.map((label) =>
        typeof label === 'string' ? label : null
      )
    : [];

  return freezeRecord({
    rawOptions: options,
    replayTargetLabels: freezeArray(replayTargetLabels),
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-root-hydration-replay-error-metadata'
  });
}

function normalizeEventListenerRootErrorRoutingOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  const routeLabels = Array.isArray(normalizedOptions.routeLabels)
    ? normalizedOptions.routeLabels.map((label) =>
        typeof label === 'string' ? label : null
      )
    : [];

  return freezeRecord({
    portalEventOwnerRootGateRecord:
      normalizedOptions.portalEventOwnerRootGateRecord === null ||
      normalizedOptions.portalEventOwnerRootGateRecord === undefined
        ? null
        : normalizedOptions.portalEventOwnerRootGateRecord,
    rawOptions: options,
    routeLabels: freezeArray(routeLabels)
  });
}

function describeCapturedErrorForDiagnostics(error) {
  if (error !== null && typeof error === 'object') {
    const name =
      typeof error.name === 'string' && error.name.length > 0
        ? error.name
        : 'Object';
    const message =
      typeof error.message === 'string' ? error.message : String(error);
    const code = typeof error.code === 'string' ? error.code : null;

    return freezeRecord({
      code,
      message,
      name,
      type: 'object'
    });
  }

  const type = error === null ? 'null' : typeof error;
  return freezeRecord({
    code: null,
    message: String(error),
    name: type,
    type
  });
}

function getRootOwnerFromRootBridgeRequestRecord(record) {
  if (
    record !== null &&
    typeof record === 'object' &&
    isPrivateRootHandle(record.handle)
  ) {
    return record.handle.owner;
  }

  const payload = rootRecordPayloads.get(record);
  if (
    payload !== undefined &&
    payload.rootHandle !== undefined &&
    isPrivateRootHandle(payload.rootHandle)
  ) {
    return payload.rootHandle.owner;
  }

  return null;
}

function assertPortalBoundaryStillBlocked(record) {
  if (
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.domMutation !== false ||
    record.publicDomMutation !== false ||
    record.markerWrites !== false ||
    record.listenerInstallation !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Private portal boundary records must remain blocked before a commit handoff.'
    );
  }
}

function assertPortalBoundaryStillBlockedForPrepareMountListener(record) {
  if (
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.domMutation !== false ||
    record.publicDomMutation !== false ||
    record.markerWrites !== false ||
    record.listenerInstallation !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalPrepareMountListenerRecord(
      'Private portal boundary records must remain blocked before preparePortalMount listener intent.'
    );
  }
}

function assertPortalBoundaryStillBlockedForChildReconciliation(record) {
  if (
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.domMutation !== false ||
    record.publicDomMutation !== false ||
    record.markerWrites !== false ||
    record.listenerInstallation !== false ||
    record.hydration !== false ||
    record.eventDispatch !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Private portal boundary records must remain blocked before child reconciliation diagnostics.'
    );
  }
}

function assertPrivatePortalMountDiagnosticStillIntact(record, payload) {
  if (
    record.$$typeof !== privateRootPortalFakeDomMountRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord' ||
    record.operation !== 'portal-fake-dom-mount-diagnostic' ||
    record.mountStatus !== ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED ||
    record.publicMountStatus !== ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED ||
    record.fakeDomCommitApplied !== true ||
    record.fakeDomPortalMountDiagnostic !== true ||
    record.explicitPortalHostChildMounted !== true ||
    record.portalContainerChildrenReplaced !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.preparePortalMount !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.domMutation !== true ||
    record.publicDomMutation !== false ||
    record.listenerInstallation !== false ||
    record.resourceSideEffects !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Expected an intact private React DOM portal fake-DOM mount diagnostic record.'
    );
  }

  if (
    payload.hostComponentNode === undefined ||
    payload.hostTextNode === undefined ||
    payload.hostInstanceToken === undefined ||
    payload.hostTextToken === undefined
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal fake-DOM mount diagnostics must include mounted host tokens.'
    );
  }
}

function assertPrivatePortalMountDiagnosticStillIntactForEventOwnerRoot(
  record,
  payload
) {
  if (
    record.$$typeof !== privateRootPortalFakeDomMountRecordType ||
    record.kind !== 'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord' ||
    record.operation !== 'portal-fake-dom-mount-diagnostic' ||
    record.mountStatus !== ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED ||
    record.publicMountStatus !== ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED ||
    record.fakeDomCommitApplied !== true ||
    record.fakeDomPortalMountDiagnostic !== true ||
    record.explicitPortalHostChildMounted !== true ||
    record.portalContainerChildrenReplaced !== false ||
    record.portalChildReconciliation !== false ||
    record.portalMounting !== false ||
    record.publicPortalMounting !== false ||
    record.publicRootCompatibilitySurface !== false ||
    record.publicRootRenderCompatibilityClaimed !== false ||
    record.preparePortalMount !== false ||
    record.nativeExecution !== false ||
    record.reconcilerExecution !== false ||
    record.domMutation !== true ||
    record.publicDomMutation !== false ||
    record.listenerInstallation !== false ||
    record.resourceSideEffects !== false ||
    record.privatePortalMetadataPromotesPublicRootRender !== false ||
    record.compatibilityClaimed !== false
  ) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Expected an intact private React DOM portal fake-DOM mount diagnostic record.'
    );
  }

  if (
    payload.hostComponentNode === undefined ||
    payload.hostTextNode === undefined ||
    payload.hostInstanceToken === undefined ||
    payload.hostTextToken === undefined
  ) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Portal fake-DOM mount diagnostics must include mounted host tokens.'
    );
  }
}

function assertAcceptedReactDomPortalObject(portal, rootHandleState) {
  if (portal === null || typeof portal !== 'object') {
    throwInvalidPortalRootBoundaryRecord(
      'Expected a React DOM portal object for the portal root boundary.'
    );
  }

  const objectKeys = Object.keys(portal);
  if (
    portal.$$typeof !== REACT_PORTAL_TYPE ||
    portal.implementation !== reactDomPortalImplementation ||
    (portal.key !== null && typeof portal.key !== 'string') ||
    objectKeys.length !== 5 ||
    objectKeys[0] !== '$$typeof' ||
    objectKeys[1] !== 'key' ||
    objectKeys[2] !== 'children' ||
    objectKeys[3] !== 'containerInfo' ||
    objectKeys[4] !== 'implementation'
  ) {
    throwInvalidPortalRootBoundaryRecord(
      'Expected an intact React DOM createPortal object shape.'
    );
  }

  assertValidContainer(
    portal.containerInfo,
    rootHandleState.bridgeState.validationOptions
  );
}

function assertFakeDomPortalCommitTarget(portalContainer) {
  if (
    typeof portalContainer.appendChild !== 'function' ||
    typeof portalContainer.removeChild !== 'function' ||
    !('textContent' in portalContainer)
  ) {
    throwInvalidPortalCommitHandoffRecord(
      'Expected a fake-DOM portal container that can model child replacement.'
    );
  }
}

function assertFakeDomPortalMountTarget(portalContainer) {
  assertFakeDomPortalCommitTarget(portalContainer);

  const ownerDocument = getOwnerDocument(portalContainer);
  if (
    ownerDocument === null ||
    typeof ownerDocument.createElement !== 'function' ||
    typeof ownerDocument.createTextNode !== 'function'
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a fake-DOM portal container with element and text factories.'
    );
  }
}

function getPortalCommitPendingChildren(portal, options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'pendingChildren')
  ) {
    return options.pendingChildren;
  }

  return portal.children === undefined ? null : portal.children;
}

function getExplicitPortalFakeDomMountChild(payload, options) {
  if (
    options == null ||
    typeof options !== 'object' ||
    !Object.prototype.hasOwnProperty.call(options, 'explicitChild')
  ) {
    throwInvalidPortalFakeDomMountRecord(
      'Expected an explicit portal HostComponent child for fake-DOM mounting.'
    );
  }

  if (options.explicitChild !== payload.portalChildren) {
    throwInvalidPortalFakeDomMountRecord(
      'The explicit fake-DOM mount child must be the portal children value.'
    );
  }

  return options.explicitChild;
}

function getExplicitPortalChildReconciliationChild(payload, options) {
  if (
    options == null ||
    typeof options !== 'object' ||
    !Object.prototype.hasOwnProperty.call(options, 'explicitChild')
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Expected an explicit portal HostComponent child for child reconciliation.'
    );
  }

  if (options.explicitChild !== payload.portalChildren) {
    throwInvalidPortalChildReconciliationRecord(
      'The explicit portal child reconciliation target must be the portal children value.'
    );
  }

  return options.explicitChild;
}

function normalizePortalFakeDomHostChildDescriptor(
  explicitChild,
  throwInvalid = throwInvalidPortalFakeDomMountRecord
) {
  if (explicitChild === null || typeof explicitChild !== 'object') {
    throwInvalid(
      'Expected an explicit portal HostComponent child object.'
    );
  }

  const hostComponentType = explicitChild.type;
  const props = explicitChild.props;
  const hostText = props && props.children;

  if (
    typeof hostComponentType !== 'string' ||
    hostComponentType.length === 0 ||
    props === null ||
    typeof props !== 'object' ||
    !(
      typeof hostText === 'string' ||
      typeof hostText === 'number' ||
      typeof hostText === 'bigint'
    )
  ) {
    throwInvalid(
      'Expected a HostComponent child with a primitive HostText children prop.'
    );
  }

  return freezeRecord({
    hostComponentType,
    hostText: String(hostText),
    props
  });
}

function normalizePortalChildReconciliationDescriptor(child, mountRecord) {
  const descriptor = normalizePortalFakeDomHostChildDescriptor(
    child,
    throwInvalidPortalChildReconciliationRecord
  );
  if (descriptor.hostComponentType !== mountRecord.hostComponentType) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation admits only same-type HostComponent updates.'
    );
  }
  return descriptor;
}

function assertPortalChildReconciliationPreviousProps(props, expectedText) {
  if (!isObjectOrFunction(props)) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires mounted previous HostComponent props.'
    );
  }
  if (!Object.prototype.hasOwnProperty.call(props, 'children')) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires previous text children props.'
    );
  }

  const children = props.children;
  const childrenType = typeof children;
  if (
    childrenType !== 'string' &&
    childrenType !== 'number' &&
    childrenType !== 'bigint'
  ) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires primitive previous text children.'
    );
  }
  if (String(children) !== String(expectedText)) {
    throwInvalidPortalChildReconciliationRecord(
      'Portal child reconciliation requires previous text to match the mounted HostText.'
    );
  }
}

function createPortalFakeDomHostComponentNode(
  portalContainer,
  childDescriptor
) {
  const ownerDocument = getOwnerDocument(portalContainer);
  const createElement = ownerDocument && ownerDocument.createElement;
  if (typeof createElement !== 'function') {
    throwInvalidPortalFakeDomMountRecord(
      'Expected a fake-DOM document createElement factory.'
    );
  }

  const hostComponentNode = createElement.call(
    ownerDocument,
    childDescriptor.hostComponentType
  );
  if (hostComponentNode === null || typeof hostComponentNode !== 'object') {
    throwInvalidPortalFakeDomMountRecord(
      'Expected fake-DOM createElement to return a HostComponent node.'
    );
  }

  return hostComponentNode;
}

function getFakeDomChildCount(node) {
  return Array.isArray(node.childNodes) ? node.childNodes.length : null;
}

function describePortalContainerOwnership(
  rootHandle,
  rootHandleState,
  portalContainer
) {
  const rootContainer = rootHandleState.container;
  const rootContainerOwner = getContainerRoot(rootContainer);
  const portalContainerOwner = getContainerRoot(portalContainer);
  return freezeRecord({
    ownershipStatus: ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED,
    rootId: rootHandle.rootId,
    rootContainerInfo: rootHandleState.containerInfo,
    portalContainerInfo: freezeRecord(describeContainer(portalContainer)),
    rootContainerMarkedAsRoot: rootContainerOwner !== null,
    rootContainerOwnerMatchesHandle: rootContainerOwner === rootHandle.owner,
    portalContainerMarkedAsRoot: portalContainerOwner !== null,
    portalContainerOwnerMatchesRoot: portalContainerOwner === rootHandle.owner,
    portalContainerOwnedByAnotherRoot:
      portalContainerOwner !== null &&
      portalContainerOwner !== rootHandle.owner,
    portalContainerAvailableForPortal:
      portalContainerOwner === null ||
      portalContainerOwner === rootHandle.owner,
    sameContainerAsRoot: portalContainer === rootContainer,
    sameOwnerDocument:
      getOwnerDocument(portalContainer) === getOwnerDocument(rootContainer),
    containerOwnershipValidated: true
  });
}

function describePortalCommitListenerSideEffects(
  portalContainer,
  portalListenerGuard
) {
  const ownerDocument = getOwnerDocument(portalContainer);
  return freezeRecord({
    gateStatus: ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
    preparePortalMount: false,
    listenToAllSupportedEvents: false,
    listenerInstallation: false,
    portalListenerGuard,
    hasPortalListeningMarker: hasListeningMarker(portalContainer),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    compatibilityClaimed: false
  });
}

function summarizePortalPrepareMountListenerIntentRecord(record) {
  return freezeRecord({
    eventRecordType: privateEventPortalPrepareMountListenerIntentRecordType,
    eventRecordKind: record.kind,
    eventIntentStatus: record.intentStatus,
    eventIntentMatchesPreparePortalMount:
      record.intentStatus === PORTAL_PREPARE_MOUNT_LISTENER_INTENT_RECORDED,
    action: record.action,
    preparePortalMountIntent: record.preparePortalMountIntent,
    listenToAllSupportedEventsIntent: record.listenToAllSupportedEventsIntent,
    listenerInstallation: record.listenerInstallation,
    portalAlreadyListening: record.portalAlreadyListening,
    ownerDocumentAlreadyListening: record.ownerDocumentAlreadyListening,
    portalListenerIntentCount: record.portalListenerIntentCount,
    ownerDocumentListenerIntentCount:
      record.ownerDocumentListenerIntentCount,
    listenerIntentCount: record.listenerIntentCount,
    captureListenerIntentCount: record.captureListenerIntentCount,
    bubbleListenerIntentCount: record.bubbleListenerIntentCount,
    nonDelegatedListenerIntentCount: record.nonDelegatedListenerIntentCount,
    passiveListenerIntentCount: record.passiveListenerIntentCount,
    targetSnapshotsBefore: record.targetSnapshotsBefore,
    portalEventTargetInfo: record.portalEventTargetInfo,
    ownerDocumentInfo: record.ownerDocumentInfo
  });
}

function summarizePortalEventOwnerRootGateRecord(record) {
  if (!isPluginPortalEventOwnerRootGateRecord(record)) {
    throwInvalidPortalEventOwnerRootGateRecord(
      'Expected a private event plugin portal owner-root gate record.'
    );
  }

  return freezeRecord({
    blockedReason: record.blockedReason,
    browserDomEventCompatibilityClaimed:
      record.browserDomEventCompatibilityClaimed,
    dispatchPathRootOwnerMatchCount:
      record.dispatchPathRootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount:
      record.dispatchPathRootOwnerMismatchCount,
    eventDispatch: record.eventDispatch,
    eventRecordKind: record.kind,
    eventRecordStatus: record.status,
    listenerInvocationCount: record.listenerInvocationCount,
    ownerRootMatchesTargetRoot: record.ownerRootMatchesTargetRoot,
    portalContainerContainsTarget: record.portalContainerContainsTarget,
    publicPortalBubblingEnabled: record.publicPortalBubblingEnabled,
    rootContainerContainsTarget: record.rootContainerContainsTarget,
    syntheticEventCount: record.syntheticEventCount,
    targetDispatchPathLength: record.targetDispatchPathLength,
    targetDispatchPathStatus: record.targetDispatchPathStatus,
    targetInstStatus: record.targetInstStatus
  });
}

function inspectPublicFacadeMarkerListenerPreflightState(container) {
  const ownerDocument = getOwnerDocument(container);
  return freezeRecord({
    containerInfo: freezeRecord(describeContainer(container)),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    containerMarker: freezeRecord(inspectContainerRootMarker(container)),
    rootListeningMarker: freezeRecord(inspectListeningMarker(container)),
    ownerDocumentListeningMarker:
      ownerDocument === null
        ? null
        : freezeRecord(inspectListeningMarker(ownerDocument)),
    rootListenerRegistrationCount: getTargetRegistrationCount(container),
    ownerDocumentListenerRegistrationCount:
      getTargetRegistrationCount(ownerDocument),
    rootListenerSetSize: getExistingListenerSetSize(container),
    ownerDocumentListenerSetSize: getExistingListenerSetSize(ownerDocument),
    rootMutationCount: getTargetMutationCount(container),
    ownerDocumentMutationCount: getTargetMutationCount(ownerDocument)
  });
}

function getExistingListenerSetSize(target) {
  const listenerSet =
    target != null &&
    (typeof target === 'object' || typeof target === 'function')
      ? target[internalEventHandlersKey]
      : null;
  return listenerSet instanceof Set ? listenerSet.size : 0;
}

function getTargetRegistrationCount(target) {
  return target && Array.isArray(target.__registrations)
    ? target.__registrations.length
    : 0;
}

function getTargetMutationCount(target) {
  return target && Array.isArray(target.__mutationLog)
    ? target.__mutationLog.length
    : 0;
}

function markerListenerStateMatches(left, right) {
  return (
    markerSnapshotMatches(left.containerMarker, right.containerMarker) &&
    listeningMarkerSnapshotMatches(
      left.rootListeningMarker,
      right.rootListeningMarker
    ) &&
    listeningMarkerSnapshotMatches(
      left.ownerDocumentListeningMarker,
      right.ownerDocumentListeningMarker
    ) &&
    left.rootListenerRegistrationCount ===
      right.rootListenerRegistrationCount &&
    left.ownerDocumentListenerRegistrationCount ===
      right.ownerDocumentListenerRegistrationCount &&
    left.rootListenerSetSize === right.rootListenerSetSize &&
    left.ownerDocumentListenerSetSize ===
      right.ownerDocumentListenerSetSize &&
    left.rootMutationCount === right.rootMutationCount &&
    left.ownerDocumentMutationCount === right.ownerDocumentMutationCount
  );
}

function markerSnapshotMatches(left, right) {
  return (
    left.inspectable === right.inspectable &&
    left.propertyCount === right.propertyCount &&
    left.truthyCount === right.truthyCount &&
    left.nullCount === right.nullCount
  );
}

function listeningMarkerSnapshotMatches(left, right) {
  if (left === null || right === null) {
    return left === right;
  }
  return (
    left.inspectable === right.inspectable &&
    left.propertyCount === right.propertyCount &&
    left.trueValueCount === right.trueValueCount
  );
}

function assertNoActiveCreateRootSideEffectsForPublicFacadePreflight(
  createRecord
) {
  const existing = rootCreateSideEffectRecords.get(createRecord);
  if (existing === undefined) {
    return;
  }
  const existingPayload = rootCreateSideEffectPayloads.get(existing);
  if (existingPayload && existingPayload.active) {
    throwInvalidRootPublicFacadePreflight(
      'Cannot preflight root marker/listener setup while createRoot side effects are already active.'
    );
  }
}

function assertNoActiveCreateRootSideEffectsForPublicFacadeHostOutputRender(
  createRecord
) {
  const existing = rootCreateSideEffectRecords.get(createRecord);
  if (existing === undefined) {
    return;
  }
  const existingPayload = rootCreateSideEffectPayloads.get(existing);
  if (existingPayload && existingPayload.active) {
    throwInvalidRootPublicFacadeHostOutputRender(
      'Cannot render private public-facade host output while createRoot side effects are already active.'
    );
  }
}

function assertNoActiveCreateRootSideEffectsForPublicFacadeHostOutputUnmount(
  createRecord
) {
  const existing = rootCreateSideEffectRecords.get(createRecord);
  if (existing === undefined) {
    return;
  }
  const existingPayload = rootCreateSideEffectPayloads.get(existing);
  if (existingPayload && existingPayload.active) {
    throwInvalidRootPublicFacadeHostOutputUnmount(
      'Cannot unmount private public-facade host output while createRoot side effects are already active.'
    );
  }
}

function hasActivePrivateRootPublicFacadeHostOutputRender(payload) {
  return getActivePrivateRootPublicFacadeHostOutputRender(payload) !== null;
}

function getActivePrivateRootPublicFacadeHostOutputRender(payload) {
  for (const record of payload.hostOutputRenderRecords) {
    const renderPayload = rootPublicFacadeHostOutputRenderPayloads.get(record);
    if (renderPayload === undefined) {
      continue;
    }
    const hostOutputPayload = rootInitialHostOutputHandoffPayloads.get(
      renderPayload.hostOutputHandoff
    );
    if (hostOutputPayload && hostOutputPayload.active) {
      return {
        hostOutputPayload,
        record,
        renderPayload
      };
    }
  }
  return null;
}

function getPublicFacadeHostOutputRenderCallback(options) {
  if (typeof options === 'function') {
    return options;
  }
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'callback')
  ) {
    return options.callback;
  }
  return undefined;
}

function getPublicFacadeHostOutputRenderSideEffectOptions(options) {
  if (!options || typeof options !== 'object') {
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(options, 'sideEffectOptions')) {
    return options.sideEffectOptions;
  }
  return options;
}

function getPublicFacadeHostOutputUpdateCallback(options) {
  if (typeof options === 'function') {
    return options;
  }
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'callback')
  ) {
    return options.callback;
  }
  return undefined;
}

function normalizePublicFacadeHostOutputUpdateElement(
  element,
  hostOutputPayload,
  hostOutputHandoff
) {
  if (element === null || typeof element !== 'object') {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Public-facade host-output update requires a private HostComponent element object.'
    );
  }
  if (typeof element.type !== 'string' || element.type === '') {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Public-facade host-output update supports only one string HostComponent element.'
    );
  }
  if (element.type !== hostOutputHandoff.hostType) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      'Public-facade host-output update requires the same HostComponent type as the active host output.'
    );
  }

  const nextProps =
    element.props !== null && typeof element.props === 'object'
      ? element.props
      : {};
  const previousProps = getLatestPropsFromHostInstanceToken(
    hostOutputPayload.hostToken
  );
  const oldText = getPublicFacadeHostOutputUpdateTextChild(
    previousProps,
    'previous'
  );
  const newText = getPublicFacadeHostOutputUpdateTextChild(
    nextProps,
    'next'
  );

  return {
    nextProps,
    previousProps,
    text: newText,
    textUpdate:
      oldText === newText
        ? null
        : {
            newText,
            oldText,
            textInstance: hostOutputPayload.textNode
          },
    type: element.type
  };
}

function getPublicFacadeHostOutputUpdateTextChild(props, phase) {
  if (!isObjectOrFunction(props)) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      `Public-facade host-output update requires ${phase} host props.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(props, 'children')) {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      `Public-facade host-output update requires ${phase} text children props.`
    );
  }

  const children = props.children;
  const childrenType = typeof children;
  if (childrenType !== 'string' && childrenType !== 'number') {
    throwInvalidRootPublicFacadeHostOutputUpdate(
      `Public-facade host-output update requires primitive ${phase} text children.`
    );
  }
  return String(children);
}

function createPublicFacadeHostOutputUpdateAcceptedCapabilities(handoff) {
  return freezeArray([
    ...ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES,
    ...handoff.acceptedCapabilities
  ]);
}

function getPublicFacadeHostOutputUnmountRenderCallback(options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'renderCallback')
  ) {
    return options.renderCallback;
  }
  return getPublicFacadeHostOutputRenderCallback(options);
}

function getPublicFacadeHostOutputUnmountCallback(options) {
  if (
    options &&
    typeof options === 'object' &&
    Object.prototype.hasOwnProperty.call(options, 'unmountCallback')
  ) {
    return options.unmountCallback;
  }
  return undefined;
}

function cleanupPublicFacadeHostOutputRenderAfterFailure({
  bridge,
  error,
  hostOutputHandoff,
  sideEffectRecord
}) {
  if (hostOutputHandoff !== null) {
    try {
      bridge.cleanupInitialRenderHostOutput(hostOutputHandoff);
    } catch (cleanupError) {
      error.hostOutputCleanupError = {
        code: cleanupError.code || null,
        message: cleanupError.message
      };
    }
  }

  if (sideEffectRecord !== null) {
    try {
      bridge.revertCreateRootSideEffects(sideEffectRecord);
    } catch (cleanupError) {
      error.sideEffectCleanupError = {
        code: cleanupError.code || null,
        message: cleanupError.message
      };
    }
  }
}

function assertPrivateRootPublicFacadeRootForAdapter(root, adapterState) {
  const payload = rootPublicFacadeRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadeAdapter(
      'Expected a private React DOM root public facade root.'
    );
  }
  if (payload.adapter !== adapterState.adapter) {
    throwForeignRootBridgeRequest();
  }
  return payload;
}

function assertPrivateRootPublicFacadePreflightRootForPreflight(
  root,
  preflightState
) {
  const payload = rootPublicFacadePreflightRootPayloads.get(root);
  if (payload === undefined) {
    throwInvalidRootPublicFacadePreflight(
      'Expected a private React DOM root public facade preflight root.'
    );
  }
  if (payload.preflight !== preflightState.preflight) {
    throwForeignRootBridgeRequest();
  }
  return payload;
}

function createPrivateRootPublicFacadeRootPayloadSnapshot(payload) {
  return freezeRecord({
    adapter: payload.adapter,
    bridge: payload.bridge,
    container: payload.container,
    createRecord: payload.createRecord,
    hostOutputRenderRecords: freezeArray(payload.hostOutputRenderRecords),
    hostOutputUpdateRecords: freezeArray(payload.hostOutputUpdateRecords),
    hostOutputUnmountCleanupRecords: freezeArray(
      payload.hostOutputUnmountCleanupRecords
    ),
    markerListenerPreflightRecords: freezeArray(
      payload.markerListenerPreflightRecords
    ),
    renderRecords: freezeArray(payload.renderRecords),
    requestRecords: freezeArray(payload.requestRecords),
    root: payload.root,
    rootHandle: payload.rootHandle,
    rootOptions: payload.rootOptions,
    rootType: payload.rootType,
    unmountRecords: freezeArray(payload.unmountRecords)
  });
}

function createPrivateRootPublicFacadePreflightRootPayloadSnapshot(payload) {
  return freezeRecord({
    bridge: payload.bridge,
    container: payload.container,
    createPreflight: payload.createPreflight,
    createRecord: payload.createRecord,
    preflight: payload.preflight,
    preflightRecords: freezeArray(payload.preflightRecords),
    renderPreflights: freezeArray(payload.renderPreflights),
    requestRecords: freezeArray(payload.requestRecords),
    root: payload.root,
    rootHandle: payload.rootHandle,
    rootOptions: payload.rootOptions,
    rootType: payload.rootType,
    unmountPreflights: freezeArray(payload.unmountPreflights)
  });
}

function throwInvalidRootBridgeRequest(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST';
  throw error;
}

function throwInvalidCreateRenderAdmission(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION';
  throw error;
}

function throwInvalidInitialHostOutputHandoff(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF';
  throw error;
}

function throwForeignRootBridgeRequest() {
  const error = new Error(
    'Cannot use a private root bridge request with a different root bridge shell.'
  );
  error.code = 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE';
  throw error;
}

function throwInvalidPortalRootBoundaryRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_ROOT_BOUNDARY_RECORD';
  throw error;
}

function throwInvalidPortalCommitHandoffRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_COMMIT_HANDOFF_RECORD';
  throw error;
}

function throwInvalidPortalPrepareMountListenerRecord(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_PORTAL_PREPARE_MOUNT_LISTENER_RECORD';
  throw error;
}

function throwInvalidUnmountHostOutputCleanupRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD';
  throw error;
}

function throwInvalidPortalFakeDomMountRecord(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD';
  throw error;
}

function throwInvalidPortalChildReconciliationRecord(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD';
  throw error;
}

function throwInvalidPortalEventOwnerRootGateRecord(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_RECORD';
  throw error;
}

function throwInvalidHostOutputUpdateHandoff(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF';
  throw error;
}

function throwInvalidRootCommitHostComponentUpdateHandoff(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF';
  throw error;
}

function throwInvalidRootCommitRefMetadata(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_ROOT_COMMIT_REF_METADATA';
  throw error;
}

function throwInvalidRefCallbackHostOutputOrderingDiagnostic(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC';
  throw error;
}

function throwInvalidRefCallbackRootErrorRouting(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_REF_CALLBACK_ROOT_ERROR_ROUTING';
  throw error;
}

function throwInvalidEventListenerRootErrorRouting(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_EVENT_LISTENER_ROOT_ERROR_ROUTING';
  throw error;
}

function throwInvalidHydrationReplayErrorMetadata(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA';
  throw error;
}

function throwInvalidRootPublicFacadeAdapter(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER';
  throw error;
}

function throwInvalidRootPublicFacadePreflight(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT';
  throw error;
}

function throwInvalidRootPublicFacadeHostOutputRender(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER';
  throw error;
}

function throwInvalidRootPublicFacadeHostOutputUpdate(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE';
  throw error;
}

function throwInvalidRootPublicFacadeHostOutputUnmount(message) {
  const error = new Error(message);
  error.code =
    'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT';
  throw error;
}

function describeCreateRootMarkerGuard(container, options) {
  const warningMessage = getCreateRootWarning(container, options);
  return freezeRecord({
    action: 'defer-mark-container-as-root',
    hasLegacyRootMarker: hasLegacyRootMarker(container),
    isContainerMarkedAsRoot: isContainerMarkedAsRoot(container),
    warning: describeCreateRootWarning(warningMessage)
  });
}

function describeCreateRootWarning(message) {
  if (message === null) {
    return null;
  }

  let warningType = 'unknown';
  if (message === duplicateCreateRootWarning) {
    warningType = 'duplicate-create-root';
  } else if (message === legacyRootWarning) {
    warningType = 'legacy-root-container';
  }

  return freezeRecord({
    message,
    type: warningType
  });
}

function describeUnmountMarkerGuard(container) {
  return freezeRecord({
    action: 'defer-unmark-container-as-root-after-sync-flush',
    isContainerMarkedAsRoot: isContainerMarkedAsRoot(container)
  });
}

function describeRootListenerGuard(container) {
  const ownerDocument = getOwnerDocument(container);
  return freezeRecord({
    action: 'defer-listen-to-all-supported-events',
    canInstallRootListeners: canInstallListener(container),
    hasRootListeningMarker: hasListeningMarker(container),
    ownerDocumentCanInstallSelectionChange: canInstallListener(ownerDocument),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    rootEventTargetInfo: freezeRecord(describeContainer(container))
  });
}

function canInstallListener(target) {
  return !!(
    target != null &&
    (typeof target === 'object' || typeof target === 'function') &&
    typeof target.addEventListener === 'function'
  );
}

function describeBridgeValue(value) {
  if (value === null) {
    return Object.freeze({
      type: 'null'
    });
  }

  const type = typeof value;
  if (type === 'undefined') {
    return Object.freeze({
      type: 'undefined'
    });
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return Object.freeze({
      type,
      value
    });
  }

  if (type === 'function') {
    return Object.freeze({
      length: value.length,
      name: value.name || '',
      type: 'function'
    });
  }

  if (type === 'symbol') {
    return Object.freeze({
      description: value.description || null,
      type: 'symbol'
    });
  }

  if (Array.isArray(value)) {
    return Object.freeze({
      length: value.length,
      type: 'array'
    });
  }

  return Object.freeze({
    keys: Object.keys(value).sort(),
    type: 'object'
  });
}

function describeRootErrorCallbacks(rootOptions) {
  const options =
    rootOptions !== null && typeof rootOptions === 'object'
      ? rootOptions
      : null;

  return freezeRecord({
    onCaughtError: describeRootErrorCallback(options, 'onCaughtError'),
    onRecoverableError: describeRootErrorCallback(
      options,
      'onRecoverableError'
    ),
    onUncaughtError: describeRootErrorCallback(options, 'onUncaughtError')
  });
}

function describeRootErrorCallback(rootOptions, key) {
  const value =
    rootOptions !== null &&
    Object.prototype.hasOwnProperty.call(rootOptions, key)
      ? rootOptions[key]
      : undefined;

  return freezeRecord({
    configured: typeof value === 'function',
    key,
    valueInfo: describeBridgeValue(value)
  });
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function isWeakMapKey(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

module.exports = {
  CLIENT_ROOT_KIND,
  CONCURRENT_ROOT_TAG,
  ROOT_BRIDGE_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
  ROOT_BRIDGE_EXECUTION_BLOCKED,
  ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_RECORDED,
  ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_RECORDED,
  ROOT_BRIDGE_CREATE_RENDER_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_CREATE_RENDER_ADMITTED,
  ROOT_BRIDGE_CREATE_RENDER_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED,
  ROOT_BRIDGE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED,
  ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED,
  ROOT_BRIDGE_MARK_LISTEN_APPLIED,
  ROOT_BRIDGE_MARK_LISTEN_REVERTED,
  ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED,
  ROOT_BRIDGE_PORTAL_BOUNDARY_ADMITTED,
  ROOT_BRIDGE_PORTAL_BOUNDARY_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED,
  ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED,
  ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED,
  ROOT_BRIDGE_PORTAL_DIAGNOSTIC_BLOCKED,
  ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED,
  ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED,
  ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_EVENT_LISTENER_ERROR_ROUTING_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_LISTENER_INSTALLATION_BLOCKED,
  ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_INTENT_ADMITTED,
  ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ADMITTED,
  ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED,
  ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED,
  ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY,
  ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED,
  ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED,
  ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY,
  ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_RECORDED,
  ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED,
  ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED,
  ROOT_BRIDGE_REQUEST_ADMITTED,
  ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED,
  ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_ACCEPTED_CAPABILITIES,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_BLOCKED_CAPABILITIES,
  ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED,
  ROOT_LIFECYCLE_CREATED,
  ROOT_LIFECYCLE_RENDERED,
  ROOT_LIFECYCLE_UNMOUNTED,
  ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION,
  NATIVE_ROOT_BRIDGE_HANDLE_ROOT,
  NATIVE_ROOT_BRIDGE_HANDLE_VALUE,
  NATIVE_ROOT_BRIDGE_REQUEST_CREATE,
  NATIVE_ROOT_BRIDGE_REQUEST_RENDER,
  NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT,
  NATIVE_ROOT_BRIDGE_ROOT_HANDLE_ACTIVE,
  NATIVE_ROOT_BRIDGE_ROOT_HANDLE_RETIRED,
  NATIVE_ROOT_BRIDGE_SYNTHETIC_ENVIRONMENT_ID,
  admitPrivateCreateRenderPath,
  admitPrivateRootCommitRefMetadata,
  admitRootBridgeRequestRecord,
  applyPrivateRootCommitHostComponentUpdate,
  applyPrivateRootHostOutputUpdate,
  applyPrivateCreateRootSideEffects,
  applyPrivateInitialRenderHostOutput,
  cleanupPrivateInitialRenderHostOutput,
  cleanupPrivateRootUnmountHostOutput,
  createClientRootRecord,
  createHydrateRootRecord,
  createNativeRootBridgeHandoffRecord,
  createPortalChildReconciliationDiagnosticRecord,
  createPortalCommitHandoffRecord,
  createPortalEventOwnerRootGateRecord,
  createPortalFakeDomMountDiagnosticRecord,
  createPortalPrepareMountListenerIntentRecord,
  createPortalRootBoundaryRecord,
  createPrivateRootBridgeShell,
  createPrivateRootPublicFacadeAdapter,
  createPrivateRootPublicFacadePreflight,
  createPrivateRootHandle,
  createPrivateRootOwner,
  createEventListenerRootErrorRoutingRecord,
  createHydrationReplayErrorMetadataRecord,
  createRefCallbackRootErrorRoutingRecord,
  createRefCallbackHostOutputOrderingDiagnosticRecord,
  createRootRenderRecord,
  createRootUnmountRecord,
  createRootUpdateRecord,
  describeCreateRootMarkerGuard,
  describeRootListenerGuard,
  describeUnmountMarkerGuard,
  getNativeRootBridgeHandoffPayload,
  getPrivateRootCreateRenderAdmissionPayload,
  getPrivateRootCommitHostComponentUpdateHandoffPayload,
  getPrivateRootHostOutputUpdateHandoffPayload,
  getPrivateRootInitialHostOutputHandoffPayload,
  getPrivateRootCommitRefMetadataPayload,
  getPrivateRootPortalBoundaryPayload,
  getPrivateRootPortalChildReconciliationDiagnosticPayload,
  getPrivateRootPortalCommitHandoffPayload,
  getPrivateRootPortalEventOwnerRootGatePayload,
  getPrivateRootPortalFakeDomMountPayload,
  getPrivateRootPortalPrepareMountListenerIntentPayload,
  getPrivateRootPublicFacadeMarkerListenerPreflightPayload,
  getPrivateRootPublicFacadeHostOutputRenderPayload,
  getPrivateRootPublicFacadeHostOutputUpdatePayload,
  getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload,
  getPrivateRootPublicFacadeAdapterPayload,
  getPrivateRootPublicFacadePreflightPayload,
  getPrivateRootPublicFacadePreflightRecordPayload,
  getPrivateRootPublicFacadePreflightRootPayload,
  getPrivateRootPublicFacadeRootPayload,
  getPrivateRootEventListenerErrorRoutingPayload,
  getPrivateRootHydrationReplayErrorMetadataPayload,
  getPrivateRootRefCallbackErrorRoutingPayload,
  getPrivateRootRefCallbackHostOutputOrderingDiagnosticPayload,
  getPrivateRootRecordPayload,
  getPrivateRootUnmountHostOutputCleanupPayload,
  getRootOwnerFromHandle,
  isNativeRootBridgeHandoffRecord,
  isPrivateRootCommitHostComponentUpdateHandoffRecord,
  isPrivateRootHostOutputUpdateHandoffRecord,
  isPrivateRootCommitRefMetadataRecord,
  isPrivateRootCreateRenderAdmissionRecord,
  isPrivateRootInitialHostOutputHandoffRecord,
  isPrivateRootPortalChildReconciliationDiagnosticRecord,
  isPrivateRootPortalCommitHandoffRecord,
  isPrivateRootPortalEventOwnerRootGateRecord,
  isPrivateRootPortalFakeDomMountRecord,
  isPrivateRootPortalPrepareMountListenerIntentRecord,
  isPrivateRootPortalBoundaryRecord,
  isPrivateRootPublicFacadeMarkerListenerPreflightRecord,
  isPrivateRootPublicFacadeHostOutputRenderRecord,
  isPrivateRootPublicFacadeHostOutputUpdateRecord,
  isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord,
  isPrivateRootPublicFacadeAdapter,
  isPrivateRootPublicFacadePreflight,
  isPrivateRootPublicFacadePreflightRecord,
  isPrivateRootPublicFacadePreflightRoot,
  isPrivateRootPublicFacadeRoot,
  isPrivateRootUnmountHostOutputCleanupRecord,
  isPrivateRootEventListenerErrorRoutingRecord,
  isPrivateRootHydrationReplayErrorMetadataRecord,
  isPrivateRootRefCallbackErrorRoutingRecord,
  isPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord,
  isPrivateRootHandle,
  isPrivateRootOwner,
  privateRootAdmissionRecordType,
  privateRootCreateRenderAdmissionRecordType,
  privateRootCreateSideEffectCleanupRecordType,
  privateRootCreateSideEffectRecordType,
  privateRootCommitHostComponentUpdateHandoffRecordType,
  privateRootHostOutputUpdateHandoffRecordType,
  privateRootCommitRefMetadataRecordType,
  privateRootInitialHostOutputCleanupRecordType,
  privateRootInitialHostOutputHandoffRecordType,
  privateRootNativeBridgeHandleType,
  privateRootNativeHandoffRecordType,
  privateRootPortalBoundaryRecordType,
  privateRootPortalChildReconciliationDiagnosticRecordType,
  privateRootPortalCommitHandoffRecordType,
  privateRootPortalEventOwnerRootGateRecordType,
  privateRootPortalPrepareMountListenerIntentRecordType,
  privateRootPublicFacadeMarkerListenerPreflightRecordType,
  privateRootPublicFacadeHostOutputRenderRecordType,
  privateRootPublicFacadeHostOutputUpdateRecordType,
  privateRootPublicFacadeHostOutputUnmountCleanupRecordType,
  privateRootPublicFacadeAdapterSymbol,
  privateRootPublicFacadeAdapterType,
  privateRootPublicFacadePreflightRecordType,
  privateRootPublicFacadePreflightRootType,
  privateRootPublicFacadePreflightSymbol,
  privateRootPublicFacadePreflightType,
  privateRootPublicFacadeRootType,
  privateRootUnmountHostOutputCleanupRecordType,
  privateRootPortalFakeDomMountRecordType,
  privateRootEventListenerErrorRoutingRecordType,
  privateRootHydrationReplayErrorMetadataRecordType,
  privateRootRefCallbackHostOutputOrderingDiagnosticRecordType,
  privateRootRefCallbackErrorRoutingRecordType,
  privateRootCreateRecordType,
  privateRootHandleType,
  privateRootHydrateRecordType,
  privateRootOwnerType,
  privateRootUpdateRecordType,
  preflightPrivateRootPublicFacadeMarkerListenerSetup,
  renderPrivateRootPublicFacadeHostOutput,
  updatePrivateRootPublicFacadeHostOutput,
  unmountPrivateRootPublicFacadeHostOutput,
  revertPrivateCreateRootSideEffects
};
