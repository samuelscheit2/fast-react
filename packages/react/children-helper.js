'use strict';

const {
  REACT_ELEMENT_TYPE,
  cloneAndReplaceKey,
  createElement,
  isValidElement
} = require('./element-factory.js');
const { createUnimplementedError } = require('./placeholder-utils.js');
const { lazy } = require('./wrapper-object.js');

const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;

const isArray = Array.isArray;
const isDevelopment = process.env.NODE_ENV !== 'production';
const userProvidedKeyEscapeRegex = /\/+/g;

let didWarnAboutMaps = false;

const childrenTraversalCurrentnessReports = new WeakSet();

const childrenTraversalCurrentnessStatus =
  'source-current-for-react-19.2.6-children-helper-traversal-private-blockers';
const childrenTraversalCurrentnessConsumptionStatus =
  'accepted-private-children-helper-traversal-currentness-public-blocked';

const childrenTraversalSourceReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'reactSourceTag',
  'reactSourceCommit',
  'reactChildrenSource',
  'reactClientSource',
  'reactSymbolsSource',
  'fastReactSource',
  'fastReactDefaultRoot',
  'fastReactServerRoot',
  'packageOracle',
  'reactSourceAnchorsCurrent',
  'packageOracleCurrent',
  'compatibilityClaimed'
]);

const childrenTraversalSourceReport = freezeRecord({
  kind: 'fast-react.private.children_helper_traversal_source_report',
  version: 1,
  status: 'source-current-for-react-19.2.6-children-helper-traversal',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  reactChildrenSource: 'packages/react/src/ReactChildren.js',
  reactClientSource: 'packages/react/src/ReactClient.js',
  reactSymbolsSource: 'packages/shared/ReactSymbols.js',
  fastReactSource: 'packages/react/children-helper.js',
  fastReactDefaultRoot: 'packages/react/index.js',
  fastReactServerRoot: 'packages/react/react.react-server.js',
  packageOracle:
    'tests/conformance/oracles/react-19.2.6-children-helper-oracle.json',
  reactSourceAnchorsCurrent: true,
  packageOracleCurrent: true,
  compatibilityClaimed: false
});

const childrenTraversalSourceAnchors = freezeRecordArray([
  {
    source: 'packages/react/src/ReactChildren.js',
    symbols: freezeArray([
      'escape',
      'escapeUserProvidedKey',
      'getElementKey',
      'resolveThenable',
      'mapIntoArray',
      'mapChildren',
      'countChildren',
      'forEachChildren',
      'toArray',
      'onlyChild'
    ]),
    role: 'React 19.2.6 source anchors for direct Children traversal helpers',
    current: true
  },
  {
    source: 'packages/react/src/ReactClient.js',
    symbols: freezeArray(['Children']),
    role: 'React 19.2.6 root Children export object assembly',
    current: true
  },
  {
    source: 'packages/shared/ReactSymbols.js',
    symbols: freezeArray([
      'REACT_ELEMENT_TYPE',
      'REACT_PORTAL_TYPE',
      'REACT_LAZY_TYPE',
      'getIteratorFn'
    ]),
    role: 'React 19.2.6 child object and iterable type tags',
    current: true
  }
]);

const childrenTraversalValidChildShapeFieldNames = freezeArray([
  'id',
  'reactSourceAnchor',
  'oracleScenario',
  'behavior',
  'fastReactImplemented',
  'compatibilityClaimed'
]);

const childrenTraversalValidChildShapeRows = freezeRecordArray([
  {
    id: 'nullish-and-boolean-children',
    reactSourceAnchor: 'ReactChildren.mapIntoArray null/boolean branch',
    oracleScenario: 'children-nullish-and-empty-values',
    behavior:
      'top-level null and undefined return unchanged from map, while booleans and holes are visited as null during traversal',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'scalar-leaf-children',
    reactSourceAnchor: 'ReactChildren.mapIntoArray scalar switch',
    oracleScenario: 'children-scalar-values',
    behavior: 'string, number, and bigint values are traversed as leaves',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'element-fragment-and-portal-leaves',
    reactSourceAnchor: 'ReactChildren.mapIntoArray element/portal switch',
    oracleScenario: 'children-element-and-fragment-leaves',
    behavior:
      'React elements, fragment elements, and portal-shaped objects are direct leaf values for helper traversal',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'arrays-and-nested-arrays',
    reactSourceAnchor: 'ReactChildren.mapIntoArray array branch',
    oracleScenario: 'children-array-and-nested-traversal',
    behavior:
      'arrays, sparse slots, and nested arrays are traversed depth-first with React callback indexes',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'function-and-symbol-children',
    reactSourceAnchor: 'ReactChildren.mapIntoArray ignored default branch',
    oracleScenario: 'children-nullish-and-empty-values',
    behavior: 'function and symbol children are ignored by direct helpers',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-thenable-children',
    reactSourceAnchor: 'ReactChildren.resolveThenable',
    oracleScenario: 'children-thenable-values',
    behavior:
      'fulfilled thenables unwrap, synchronously fulfilled thenables mutate status, rejected thenables throw, and pending thenables are thrown',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-react-lazy-children',
    reactSourceAnchor: 'ReactChildren.mapIntoArray REACT_LAZY_TYPE branch',
    oracleScenario: 'children-lazy-values',
    behavior:
      'React.lazy child wrappers resolve through _init(_payload) during direct helper traversal; fulfilled defaults are traversed, and pending, rejected, or loader-thrown cases throw',
    fastReactImplemented: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalKeyPathEscapingRows = freezeRecordArray([
  {
    id: 'explicit-key-escaping',
    reactSourceAnchor: 'ReactChildren.escape',
    sourceTokens: freezeArray(['= -> =0', ': -> =2']),
    oracleScenario: 'children-to-array-key-synthesis',
    oracleExampleKeys: freezeArray(['.$a=2b=0c']),
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'path-separator-synthesis',
    reactSourceAnchor: 'ReactChildren SEPARATOR/SUBSEPARATOR',
    sourceTokens: freezeArray(['.', ':']),
    oracleScenario: 'children-to-array-key-synthesis',
    oracleExampleKeys: freezeArray(['.1:0', '.3:0:$slash/key']),
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'user-provided-slash-escaping',
    reactSourceAnchor: 'ReactChildren.escapeUserProvidedKey',
    sourceTokens: freezeArray(['/+ -> $&/']),
    oracleScenario: 'children-map-return-handling-and-keys',
    oracleExampleKeys: freezeArray([
      'mapped//key0/.$orig',
      '.$orig/.$inner/key'
    ]),
    fastReactImplemented: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalIterableHandlingRows = freezeRecordArray([
  {
    id: 'set-and-generator-iterables',
    reactSourceAnchor: 'ReactChildren.getIteratorFn traversal branch',
    oracleScenario: 'children-iterable-values',
    behavior: 'Set and generator children traverse in iterator order',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'map-entry-iterables',
    reactSourceAnchor: 'ReactChildren iterableChildren.entries warning branch',
    oracleScenario: 'children-iterable-values',
    behavior:
      'Map entries traverse as entry arrays and development warns once per helper module',
    fastReactImplemented: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalThrownErrorRows = freezeRecordArray([
  {
    id: 'plain-object-child-error',
    reactSourceAnchor: 'ReactChildren invalid object error branch',
    oracleScenario: 'children-error-behavior',
    behavior:
      'plain object children throw the React invalid object child message, with react-server production minified as #31',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'only-child-error',
    reactSourceAnchor: 'ReactChildren.onlyChild',
    oracleScenario: 'children-error-behavior',
    behavior:
      'Children.only rejects non-elements, with react-server production minified as #143',
    fastReactImplemented: true,
    compatibilityClaimed: false
  },
  {
    id: 'missing-callback-and-user-errors',
    reactSourceAnchor: 'ReactChildren.mapChildren callback invocation',
    oracleScenario: 'children-error-behavior',
    behavior:
      'missing map callbacks throw TypeError, and callback or iterator errors propagate without remapping',
    fastReactImplemented: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalUnsupportedEdgeCaseRows = freezeRecordArray([
  {
    id: 'lazy-rendering-suspense-and-component-execution',
    reactSourceAnchor: 'ReactChildren direct helper traversal only',
    oracleScenario: null,
    behavior:
      'direct React.lazy child traversal does not prove renderer lazy component rendering, Suspense wakeups, component execution, owner stacks, refs, or root scheduling',
    fastReactImplemented: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'renderer-traversal-and-fragment-rendering',
    reactSourceAnchor: 'ReactChildren direct helper traversal only',
    oracleScenario: null,
    behavior:
      'direct Children helpers do not prove renderer traversal, fragment rendering into children, owner stacks, refs, or root scheduling',
    fastReactImplemented: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'real-portal-creation',
    reactSourceAnchor: 'ReactChildren REACT_PORTAL_TYPE leaf recognition',
    oracleScenario: null,
    behavior:
      'portal-shaped objects are leaves, but real renderer portal creation and DOM/native behavior remain blocked',
    fastReactImplemented: false,
    blocked: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalLazyEvidence = freezeRecord({
  id: 'direct-react-lazy-child-traversal',
  reactSourceAnchor: 'ReactChildren.mapIntoArray REACT_LAZY_TYPE branch',
  wrapperSource: 'packages/react/wrapper-object.js React.lazy',
  oracleScenario: 'children-lazy-values',
  fulfilledCase:
    'React.lazy loader synchronously resolves to a module.default child tree that direct Children helpers traverse',
  pendingCase:
    'pending React.lazy loader thenables are thrown by direct Children helpers',
  rejectedCase:
    'synchronously rejected React.lazy loader thenables throw their rejection reason',
  loaderErrorCase:
    'loader-thrown errors propagate through direct Children helpers and leave the lazy payload uninitialized',
  callerShapedLazyEvidenceAccepted: false,
  rendererOrSuspenseCompatibilityClaimed: false,
  compatibilityClaimed: false
});

const childrenTraversalLazyRendererBlockerSourceRowFieldNames = freezeArray([
  'id',
  'sourceFiles',
  'symbols',
  'role',
  'compatibilityScope',
  'sourceOwned',
  'current',
  'compatibilityClaimed'
]);

const childrenTraversalLazyRendererBlockerSourceRows = freezeRecordArray([
  {
    id: 'react-children-direct-lazy-traversal',
    sourceFiles: freezeArray(['packages/react/src/ReactChildren.js']),
    symbols: freezeArray(['mapIntoArray', 'REACT_LAZY_TYPE']),
    role: 'direct Children helper lazy wrapper traversal evidence',
    compatibilityScope: 'direct-children-helper-only',
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-reconciler-lazy-component-resolution',
    sourceFiles: freezeArray([
      'packages/react-reconciler/src/ReactFiberBeginWork.js',
      'packages/react-reconciler/src/ReactFiberThenable.js'
    ]),
    symbols: freezeArray(['mountLazyComponent', 'resolveLazy']),
    role: 'renderer lazy component resolution and component tag selection',
    compatibilityScope: 'renderer-owned',
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-reconciler-suspense-wakeup',
    sourceFiles: freezeArray([
      'packages/react-reconciler/src/ReactFiberBeginWork.js',
      'packages/react-reconciler/src/ReactFiberThrow.js',
      'packages/react-reconciler/src/ReactFiberWorkLoop.js'
    ]),
    symbols: freezeArray([
      'updateSuspenseComponent',
      'throwException',
      'markSuspenseBoundaryShouldCapture',
      'attachPingListener'
    ]),
    role: 'Suspense capture, retry queue, and wakeup scheduling behavior',
    compatibilityScope: 'renderer-owned',
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-dom-root-lazy-render-entry',
    sourceFiles: freezeArray([
      'packages/react-dom/src/client/ReactDOMRoot.js',
      'packages/react-reconciler/src/ReactFiberRoot.js',
      'packages/react-reconciler/src/ReactFiberBeginWork.js'
    ]),
    symbols: freezeArray([
      'createRoot',
      'ReactDOMRoot.render',
      'createFiberRoot',
      'updateHostRoot'
    ]),
    role: 'root creation, root render entry, and HostRoot begin-work behavior',
    compatibilityScope: 'root-and-renderer-owned',
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalLazyRendererBlockerRowFieldNames = freezeArray([
  'id',
  'sourceRowId',
  'directTraversalInput',
  'blockedSurfaces',
  'requiredRendererOwnedEvidence',
  'callerShapedEvidenceAccepted',
  'blocked',
  'compatibilityClaimed'
]);

const childrenTraversalLazyRendererBlockerRows = freezeRecordArray([
  {
    id: 'direct-lazy-traversal-not-renderer-lazy-component',
    sourceRowId: 'react-reconciler-lazy-component-resolution',
    directTraversalInput: 'direct-react-lazy-child-traversal',
    blockedSurfaces: freezeArray([
      'renderer-lazy-component-execution',
      'component-tag-selection',
      'owner-stack',
      'ref-lifecycle'
    ]),
    requiredRendererOwnedEvidence:
      'renderer begin-work evidence for mountLazyComponent and resolveLazy',
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-lazy-traversal-not-suspense-wakeup',
    sourceRowId: 'react-reconciler-suspense-wakeup',
    directTraversalInput: 'direct-react-lazy-child-traversal',
    blockedSurfaces: freezeArray([
      'Suspense-fallback-capture',
      'Suspense-retry-queue',
      'ping-listener',
      'offscreen-state'
    ]),
    requiredRendererOwnedEvidence:
      'renderer Suspense evidence for throwException capture and retry wakeups',
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-lazy-traversal-not-root-lazy-render',
    sourceRowId: 'react-dom-root-lazy-render-entry',
    directTraversalInput: 'direct-react-lazy-child-traversal',
    blockedSurfaces: freezeArray([
      'createRoot',
      'root.render',
      'HostRoot-update-queue',
      'root-scheduling',
      'DOM-or-native-commit'
    ]),
    requiredRendererOwnedEvidence:
      'root/render evidence for createRoot, root.render, HostRoot work, and commit',
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-lazy-traversal-not-portal-ref-prerequisites',
    sourceRowId: 'react-children-direct-lazy-traversal',
    directTraversalInput: 'direct-react-lazy-child-traversal',
    blockedSurfaces: freezeArray([
      'real-portal-creation',
      'ref-attach-detach-lifecycle',
      'owner-stack-rendering'
    ]),
    requiredRendererOwnedEvidence:
      'renderer-owned portal, ref, and owner evidence before public promotion',
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalLazyRendererBlockerEvidence = freezeRecord({
  id: 'direct-lazy-children-traversal-renderer-suspense-root-blockers',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  directTraversalOracleScenario: 'children-lazy-values',
  acceptedInputEvidence: 'direct-react-lazy-child-traversal',
  blockerSource:
    'source-owned React 19.2.6 renderer, Suspense, and root anchors',
  rendererOwnedEvidenceRequired: true,
  directLazyTraversalImpliesRendererCompatibility: false,
  callerShapedRendererEvidenceAccepted: false,
  callerShapedSuspenseEvidenceAccepted: false,
  callerShapedRootEvidenceAccepted: false,
  rendererLazyCompatibilityClaimed: false,
  suspenseWakeupCompatibilityClaimed: false,
  rootLazyRenderingCompatibilityClaimed: false,
  portalOrRefPrerequisiteClaimed: false,
  publicCompatibilityClaimed: false,
  compatibilityClaimed: false
});

const childrenTraversalPortalRefOwnerBlockerSourceRowFieldNames = freezeArray([
  'id',
  'sourceFiles',
  'symbols',
  'role',
  'requiredEvidenceOwner',
  'directChildrenScope',
  'sourceOwned',
  'current',
  'compatibilityClaimed'
]);

const childrenTraversalPortalRefOwnerBlockerSourceRows = freezeRecordArray([
  {
    id: 'react-children-portal-leaf-traversal-only',
    sourceFiles: freezeArray([
      'packages/react/src/ReactChildren.js',
      'packages/shared/ReactSymbols.js'
    ]),
    symbols: freezeArray(['mapIntoArray', 'REACT_PORTAL_TYPE']),
    role: 'direct Children helper recognizes portal objects as traversal leaves',
    requiredEvidenceOwner: 'react-children-helper-source',
    directChildrenScope: true,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-dom-create-portal-entry',
    sourceFiles: freezeArray([
      'packages/react-dom/src/shared/ReactDOM.js',
      'packages/react-dom/src/client/ReactDOMClientFB.js',
      'packages/react-reconciler/src/ReactPortal.js'
    ]),
    symbols: freezeArray(['createPortal', 'createPortalImpl', 'REACT_PORTAL_TYPE']),
    role: 'public DOM portal creation and portal object construction',
    requiredEvidenceOwner: 'react-dom-and-reconciler',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-reconciler-host-portal-fiber',
    sourceFiles: freezeArray([
      'packages/react-reconciler/src/ReactChildFiber.js',
      'packages/react-reconciler/src/ReactFiber.js',
      'packages/react-reconciler/src/ReactWorkTags.js'
    ]),
    symbols: freezeArray([
      'updatePortal',
      'reconcileSinglePortal',
      'createFiberFromPortal',
      'HostPortal'
    ]),
    role: 'HostPortal fiber reconciliation, container identity, and placement',
    requiredEvidenceOwner: 'react-reconciler-renderer',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-reconciler-ref-lifecycle',
    sourceFiles: freezeArray([
      'packages/react-reconciler/src/ReactFiberBeginWork.js',
      'packages/react-reconciler/src/ReactFiberCommitEffects.js',
      'packages/react-reconciler/src/ReactFiberCommitWork.js',
      'packages/react-reconciler/src/ReactFiberFlags.js'
    ]),
    symbols: freezeArray([
      'markRef',
      'Ref',
      'RefStatic',
      'commitAttachRef',
      'safelyAttachRef',
      'safelyDetachRef'
    ]),
    role: 'ref effect marking and commit attach/detach lifecycle',
    requiredEvidenceOwner: 'react-reconciler-commit',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'react-owner-stack-integration',
    sourceFiles: freezeArray([
      'packages/react/src/jsx/ReactJSXElement.js',
      'packages/react/src/ReactOwnerStack.js',
      'packages/react-reconciler/src/ReactCurrentFiber.js',
      'packages/shared/ReactComponentInfoStack.js'
    ]),
    symbols: freezeArray([
      'getOwner',
      'captureOwnerStack',
      'runWithFiberInDEV',
      'getOwnerStackByComponentInfoInDev'
    ]),
    role: 'current owner capture, debug owner propagation, and owner stack formatting',
    requiredEvidenceOwner: 'react-and-reconciler-dev-owner-stack',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'renderer-root-dispatcher-prerequisites',
    sourceFiles: freezeArray([
      'packages/react-dom/src/client/ReactDOMRoot.js',
      'packages/react-reconciler/src/ReactFiberReconciler.js',
      'packages/react-reconciler/src/ReactFiberRoot.js',
      'packages/react-reconciler/src/ReactFiberWorkLoop.js',
      'packages/react-reconciler/src/ReactFiberBeginWork.js'
    ]),
    symbols: freezeArray([
      'createRoot',
      'ReactDOMRoot.render',
      'updateContainer',
      'createFiberRoot',
      'requestUpdateLane',
      'scheduleUpdateOnFiber',
      'updateHostRoot'
    ]),
    role: 'root creation, update lanes, dispatcher/root handoff, and HostRoot work',
    requiredEvidenceOwner: 'root-scheduler-and-renderer',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  },
  {
    id: 'suspense-lazy-renderer-separation',
    sourceFiles: freezeArray([
      'packages/react-reconciler/src/ReactFiberBeginWork.js',
      'packages/react-reconciler/src/ReactFiberThenable.js',
      'packages/react-reconciler/src/ReactFiberThrow.js',
      'packages/react-reconciler/src/ReactFiberWorkLoop.js'
    ]),
    symbols: freezeArray([
      'mountLazyComponent',
      'resolveLazy',
      'updateSuspenseComponent',
      'throwException',
      'attachPingListener'
    ]),
    role: 'renderer lazy component execution and Suspense capture/wakeup behavior',
    requiredEvidenceOwner: 'react-reconciler-suspense-renderer',
    directChildrenScope: false,
    sourceOwned: true,
    current: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalPortalRefOwnerBlockerRowFieldNames = freezeArray([
  'id',
  'sourceRowId',
  'acceptedDirectChildrenInput',
  'blockedSurfaces',
  'requiredSourceOwnedEvidence',
  'rejectedEvidence',
  'callerShapedEvidenceAccepted',
  'blocked',
  'compatibilityClaimed'
]);

const childrenTraversalPortalRefOwnerBlockerRows = freezeRecordArray([
  {
    id: 'portal-leaf-not-portal-renderer-traversal',
    sourceRowId: 'react-reconciler-host-portal-fiber',
    acceptedDirectChildrenInput: 'element-fragment-and-portal-leaves',
    blockedSurfaces: freezeArray([
      'ReactDOM.createPortal',
      'HostPortal-fiber',
      'portal-containerInfo',
      'portal-implementation',
      'DOM-or-native-portal-commit'
    ]),
    requiredSourceOwnedEvidence:
      'react-dom portal construction plus reconciler HostPortal fiber evidence',
    rejectedEvidence: freezeArray([
      'caller-shaped-portal-object',
      'direct-Children-portal-leaf-only',
      'portal-compatible-public-flag'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'portal-leaf-not-root-renderer-prerequisite',
    sourceRowId: 'renderer-root-dispatcher-prerequisites',
    acceptedDirectChildrenInput: 'element-fragment-and-portal-leaves',
    blockedSurfaces: freezeArray([
      'root.createRoot',
      'root.render',
      'updateContainer',
      'requestUpdateLane',
      'scheduleUpdateOnFiber'
    ]),
    requiredSourceOwnedEvidence:
      'root scheduler and renderer handoff evidence before portal rendering',
    rejectedEvidence: freezeArray([
      'root-prerequisite-smuggling',
      'dispatcher-prerequisite-smuggling',
      'scheduler-only-evidence'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'element-ref-prop-not-ref-lifecycle',
    sourceRowId: 'react-reconciler-ref-lifecycle',
    acceptedDirectChildrenInput: 'children-element-and-fragment-leaves',
    blockedSurfaces: freezeArray([
      'markRef',
      'Ref-flags',
      'commitAttachRef',
      'safelyDetachRef',
      'ref-cleanup'
    ]),
    requiredSourceOwnedEvidence:
      'reconciler begin-work and commit-phase ref lifecycle evidence',
    rejectedEvidence: freezeArray([
      'element-ref-descriptor-only',
      'caller-shaped-ref-lifecycle',
      'useRef-currentness-alias'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'element-debug-owner-not-owner-stack',
    sourceRowId: 'react-owner-stack-integration',
    acceptedDirectChildrenInput: 'children-element-and-fragment-leaves',
    blockedSurfaces: freezeArray([
      'current-owner-dispatcher',
      'debugOwner-propagation',
      'captureOwnerStack',
      'runWithFiberInDEV'
    ]),
    requiredSourceOwnedEvidence:
      'React JSX owner capture plus reconciler current-fiber stack evidence',
    rejectedEvidence: freezeArray([
      'element-debug-field-only',
      'caller-shaped-owner-stack',
      'dispatcher-alias'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'direct-lazy-traversal-not-suspense-renderer-behavior',
    sourceRowId: 'suspense-lazy-renderer-separation',
    acceptedDirectChildrenInput: 'direct-react-lazy-child-traversal',
    blockedSurfaces: freezeArray([
      'mountLazyComponent',
      'resolveLazy',
      'updateSuspenseComponent',
      'throwException',
      'attachPingListener'
    ]),
    requiredSourceOwnedEvidence:
      'renderer-owned lazy begin-work and Suspense wakeup evidence',
    rejectedEvidence: freezeArray([
      'direct-lazy-children-oracle-only',
      'caller-shaped-suspense-renderer',
      'public-suspense-compatibility-flag'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  },
  {
    id: 'children-currentness-not-renderer-root-currentness',
    sourceRowId: 'renderer-root-dispatcher-prerequisites',
    acceptedDirectChildrenInput: 'children-helper-traversal-currentness',
    blockedSurfaces: freezeArray([
      'renderer-root-lifecycle',
      'dispatcher-currentness',
      'root-update-queue',
      'commit-phase-output'
    ]),
    requiredSourceOwnedEvidence:
      'separate root/dispatcher/renderer currentness consumer',
    rejectedEvidence: freezeArray([
      'cloned-report',
      'stale-progress-report',
      'proxy-hidden-alias',
      'root-dispatcher-smuggling'
    ]),
    callerShapedEvidenceAccepted: false,
    blocked: true,
    compatibilityClaimed: false
  }
]);

const childrenTraversalPortalRefOwnerBlockerEvidence = freezeRecord({
  id: 'children-helper-portal-ref-owner-renderer-blockers',
  reactSourceTag: 'v19.2.6',
  reactSourceCommit: 'eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401',
  acceptedTraversalEvidence: freezeArray([
    'element-fragment-and-portal-leaves',
    'direct-react-lazy-child-traversal',
    'children-helper-traversal-currentness'
  ]),
  blockerSource:
    'source-owned React 19.2.6 portal, ref, owner, root, and Suspense renderer anchors',
  sourceOwnedRowsRequired: true,
  acceptedDirectPortalLeafTraversal: true,
  directPortalLeafImpliesPortalRendererCompatibility: false,
  directElementRefObservationImpliesRefLifecycleCompatibility: false,
  directOwnerDebugObservationImpliesOwnerStackCompatibility: false,
  directLazyTraversalImpliesSuspenseRendererCompatibility: false,
  rendererRootPrerequisitesRequired: true,
  callerShapedRendererEvidenceAccepted: false,
  callerShapedPortalEvidenceAccepted: false,
  callerShapedRefEvidenceAccepted: false,
  callerShapedOwnerEvidenceAccepted: false,
  clonedOrStaleReportEvidenceAccepted: false,
  hiddenOrProxyAliasEvidenceAccepted: false,
  rootDispatcherPrerequisiteSmugglingAccepted: false,
  portalRendererCompatibilityClaimed: false,
  refOwnerIntegrationCompatibilityClaimed: false,
  ownerStackCompatibilityClaimed: false,
  suspenseLazyRendererCompatibilityClaimed: false,
  publicCompatibilityClaimed: false,
  compatibilityClaimed: false
});

const childrenTraversalBehaviorCurrentnessFieldNames = freezeArray([
  'nullishTopLevelCurrent',
  'booleanChildrenCoerceToNull',
  'ignoredFunctionAndSymbolChildren',
  'scalarLeavesCurrent',
  'arrayHolesAndNestedTraversalCurrent',
  'elementAndFragmentLeavesCurrent',
  'portalShapeLeafCurrent',
  'keyPathEscapingCurrent',
  'arrayReturnKeyEscapingCurrent',
  'setAndGeneratorIterablesCurrent',
  'mapEntryIterableCurrent',
  'thenableUnwrapAndThrowCurrent',
  'invalidObjectErrorShapeCurrent',
  'onlyErrorShapeCurrent',
  'missingCallbackTypeErrorCurrent',
  'callbackAndIteratorErrorPropagationCurrent',
  'lazyFulfilledTraversalCurrent',
  'lazyPendingThenableThrowCurrent',
  'lazyRejectedErrorThrowCurrent',
  'lazyLoaderErrorPropagationCurrent',
  'lazyTraversalSupported',
  'lazyTraversalBlocked',
  'rendererTraversalBlocked',
  'lazyRendererSuspenseRootBlockerCurrent',
  'lazyRendererCompatibilityBlocked',
  'lazySuspenseCompatibilityBlocked',
  'lazyRootCompatibilityBlocked',
  'callerShapedLazyRendererEvidenceBlocked',
  'portalRefOwnerRendererBlockerCurrent',
  'portalRendererCompatibilityBlocked',
  'refOwnerIntegrationCompatibilityBlocked',
  'rootRendererPrerequisitesBlocked',
  'suspenseLazyRendererBehaviorBlocked',
  'callerShapedPortalRefOwnerEvidenceBlocked',
  'ownerDispatcherRootPrerequisitesBlocked',
  'compatibilityClaimed'
]);

const childrenTraversalPublicCompatibilityFalseFlags = freezeArray([
  'compatibilityClaimed',
  'publicCompatibilityClaimed',
  'packageCompatibilityClaimed',
  'fullReactChildrenParityClaimed',
  'fastReactBehaviorCompatible',
  'publicPackageCompatibilityClaimed',
  'publicLazyRendererCompatibilityClaimed',
  'publicLazySuspenseCompatibilityClaimed',
  'publicLazyRootCompatibilityClaimed',
  'publicPortalRendererCompatibilityClaimed',
  'publicRefOwnerCompatibilityClaimed',
  'publicOwnerStackCompatibilityClaimed',
  'publicSuspenseRendererCompatibilityClaimed'
]);

const childrenTraversalPrerequisiteFalseFlags = freezeArray([
  'ownerStackCompatibilityClaimed',
  'dispatcherPrerequisitesReady',
  'rootPrerequisitesReady',
  'reactDomRootPrerequisitesReady',
  'schedulerPrerequisitesReady',
  'lazyRendererPrerequisitesReady',
  'lazySuspensePrerequisitesReady',
  'lazyRootPrerequisitesReady',
  'portalPrerequisitesReady',
  'refPrerequisitesReady',
  'rendererRootPrerequisitesReady',
  'portalRootPrerequisitesReady',
  'refOwnerPrerequisitesReady',
  'suspenseRendererPrerequisitesReady',
  'ownerDispatcherPrerequisitesReady',
  'publicRootCompatibilityClaimed',
  'publicRendererCompatibilityClaimed'
]);

const childrenTraversalUnsupportedClaimFalseFlags = freezeArray([
  'rendererTraversalClaimed',
  'fragmentRenderTraversalClaimed',
  'portalCreationClaimed',
  'lazyTraversalClaimed',
  'lazyRendererCompatibilityClaimed',
  'lazySuspenseWakeupClaimed',
  'lazyRootRenderingClaimed',
  'ownerTraversalClaimed',
  'refLifecycleClaimed',
  'portalRendererTraversalClaimed',
  'portalRootRenderingClaimed',
  'refOwnerIntegrationClaimed',
  'rendererRootCompatibilityClaimed',
  'suspenseLazyRendererBehaviorClaimed'
]);

const childrenTraversalCurrentnessReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'compatibilityTarget',
  'sourceReport',
  'sourceAnchors',
  'validChildShapeRows',
  'keyPathEscapingRows',
  'iterableHandlingRows',
  'thrownErrorRows',
  'unsupportedEdgeCaseRows',
  'lazyEvidence',
  'lazyRendererBlockerSourceRows',
  'lazyRendererBlockerRows',
  'lazyRendererBlockerEvidence',
  'portalRefOwnerBlockerSourceRows',
  'portalRefOwnerBlockerRows',
  'portalRefOwnerBlockerEvidence',
  'behaviorCurrentness',
  ...childrenTraversalPublicCompatibilityFalseFlags,
  ...childrenTraversalPrerequisiteFalseFlags,
  ...childrenTraversalUnsupportedClaimFalseFlags
]);

const privateChildrenTraversalCurrentnessMetadata = freezeRecord({
  capability: 'fast-react.private.children_helper_traversal_currentness',
  compatibilityTarget: 'react@19.2.6',
  currentnessStatus: childrenTraversalCurrentnessStatus,
  currentnessConsumptionStatus: childrenTraversalCurrentnessConsumptionStatus,
  sourceReportFieldNames: childrenTraversalSourceReportFieldNames,
  sourceReport: childrenTraversalSourceReport,
  sourceAnchors: childrenTraversalSourceAnchors,
  validChildShapeFieldNames: childrenTraversalValidChildShapeFieldNames,
  validChildShapeRows: childrenTraversalValidChildShapeRows,
  keyPathEscapingRows: childrenTraversalKeyPathEscapingRows,
  iterableHandlingRows: childrenTraversalIterableHandlingRows,
  thrownErrorRows: childrenTraversalThrownErrorRows,
  unsupportedEdgeCaseRows: childrenTraversalUnsupportedEdgeCaseRows,
  lazyEvidence: childrenTraversalLazyEvidence,
  lazyRendererBlockerSourceRowFieldNames:
    childrenTraversalLazyRendererBlockerSourceRowFieldNames,
  lazyRendererBlockerSourceRows: childrenTraversalLazyRendererBlockerSourceRows,
  lazyRendererBlockerRowFieldNames:
    childrenTraversalLazyRendererBlockerRowFieldNames,
  lazyRendererBlockerRows: childrenTraversalLazyRendererBlockerRows,
  lazyRendererBlockerEvidence: childrenTraversalLazyRendererBlockerEvidence,
  portalRefOwnerBlockerSourceRowFieldNames:
    childrenTraversalPortalRefOwnerBlockerSourceRowFieldNames,
  portalRefOwnerBlockerSourceRows:
    childrenTraversalPortalRefOwnerBlockerSourceRows,
  portalRefOwnerBlockerRowFieldNames:
    childrenTraversalPortalRefOwnerBlockerRowFieldNames,
  portalRefOwnerBlockerRows: childrenTraversalPortalRefOwnerBlockerRows,
  portalRefOwnerBlockerEvidence: childrenTraversalPortalRefOwnerBlockerEvidence,
  behaviorCurrentnessFieldNames: childrenTraversalBehaviorCurrentnessFieldNames,
  publicCompatibilityFalseFlags: childrenTraversalPublicCompatibilityFalseFlags,
  prerequisiteFalseFlags: childrenTraversalPrerequisiteFalseFlags,
  unsupportedClaimFalseFlags: childrenTraversalUnsupportedClaimFalseFlags,
  compatibilityClaimed: false
});

function createChildrenHelpers(options = {}) {
  const reactServer = options.reactServer === true;
  const traversalOptions = { reactServer };
  function mapChildren(children, func, context) {
    return mapChildrenImpl(children, func, context, traversalOptions);
  }

  return {
    map: mapChildren,
    forEach: function forEach(children, forEachFunc, forEachContext) {
      mapChildren(
        children,
        function () {
          forEachFunc.apply(this, arguments);
        },
        forEachContext
      );
    },
    count: function count(children) {
      let count = 0;
      mapChildren(children, function () {
        count += 1;
      });
      return count;
    },
    toArray: function toArray(children) {
      return (
        mapChildren(children, function (child) {
          return child;
        }) || []
      );
    },
    only: function only(children) {
      if (!isValidElement(children)) {
        throwInvalidOnlyChildError({ reactServer });
      }

      return children;
    }
  };
}

function mapChildrenImpl(children, func, context, options) {
  if (children === null || children === undefined) {
    return children;
  }

  const result = [];
  let count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  }, options);
  return result;
}

function mapIntoArray(
  children,
  array,
  escapedPrefix,
  nameSoFar,
  callback,
  options
) {
  let type = typeof children;
  if (type === 'undefined' || type === 'boolean') {
    children = null;
  }

  let invokeCallback = false;
  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'bigint':
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;
          case REACT_LAZY_TYPE:
            return mapIntoArray(
              children._init(children._payload),
              array,
              escapedPrefix,
              nameSoFar,
              callback,
              options
            );
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  if (invokeCallback) {
    const child = children;
    let mappedChild = callback(child);
    const childKey =
      nameSoFar === '' ? `.${getElementKey(child, 0)}` : nameSoFar;

    if (isArray(mappedChild)) {
      let escapedChildKey = '';
      if (childKey !== null) {
        escapedChildKey =
          childKey.replace(userProvidedKeyEscapeRegex, '$&/') + '/';
      }
      mapIntoArray(
        mappedChild,
        array,
        escapedChildKey,
        '',
        function (c) {
          return c;
        },
        options
      );
    } else if (mappedChild !== null && mappedChild !== undefined) {
      if (isValidElement(mappedChild)) {
        if (
          mappedChild.key != null &&
          (!child || child.key !== mappedChild.key)
        ) {
          checkKeyStringCoercion(mappedChild.key);
        }

        let newKey =
          escapedPrefix +
          (mappedChild.key == null || (child && child.key === mappedChild.key)
            ? ''
            : `${String(mappedChild.key).replace(
                userProvidedKeyEscapeRegex,
                '$&/'
              )}/`) +
          childKey;
        mappedChild = cloneAndReplaceKey(mappedChild, newKey);

        if (
          isDevelopment &&
          nameSoFar !== '' &&
          child !== null &&
          isValidElement(child) &&
          child.key === null &&
          child._store &&
          !child._store.validated
        ) {
          mappedChild._store.validated = 2;
        }
      }
      array.push(mappedChild);
    }

    return 1;
  }

  let subtreeCount = 0;
  const nextNamePrefix = nameSoFar === '' ? '.' : `${nameSoFar}:`;

  if (isArray(children)) {
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      const nextName = nextNamePrefix + getElementKey(child, index);
      subtreeCount += mapIntoArray(
        child,
        array,
        escapedPrefix,
        nextName,
        callback,
        options
      );
    }
  } else {
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      if (isDevelopment && iteratorFn === children.entries) {
        if (!didWarnAboutMaps) {
          console.warn(
            'Using Maps as children is not supported. Use an array of keyed ReactElements instead.'
          );
        }
        didWarnAboutMaps = true;
      }

      const iterator = iteratorFn.call(children);
      let index = 0;
      let step;
      while (!(step = iterator.next()).done) {
        const child = step.value;
        const nextName = nextNamePrefix + getElementKey(child, index++);
        subtreeCount += mapIntoArray(
          child,
          array,
          escapedPrefix,
          nextName,
          callback,
          options
        );
      }
    } else if (type === 'object') {
      if (typeof children.then === 'function') {
        return mapIntoArray(
          resolveThenable(children),
          array,
          escapedPrefix,
          nameSoFar,
          callback,
          options
        );
      }

      const childrenString = String(children);
      throwInvalidObjectChildError(children, childrenString, options);
    }
  }

  return subtreeCount;
}

function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable['@@iterator'];
  return typeof maybeIterator === 'function' ? maybeIterator : null;
}

function getElementKey(element, index) {
  if (typeof element === 'object' && element !== null && element.key != null) {
    checkKeyStringCoercion(element.key);
    return escapeKey(String(element.key));
  }

  return index.toString(36);
}

function escapeKey(key) {
  const escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  return (
    '$' +
    key.replace(/[=:]/g, function (match) {
      return escaperLookup[match];
    })
  );
}

function resolveThenable(thenable) {
  switch (thenable.status) {
    case 'fulfilled':
      return thenable.value;
    case 'rejected':
      throw thenable.reason;
    default:
      if (typeof thenable.status === 'string') {
        thenable.then(noop, noop);
      } else {
        thenable.status = 'pending';
        thenable.then(
          function (fulfilledValue) {
            if (thenable.status === 'pending') {
              thenable.status = 'fulfilled';
              thenable.value = fulfilledValue;
            }
          },
          function (error) {
            if (thenable.status === 'pending') {
              thenable.status = 'rejected';
              thenable.reason = error;
            }
          }
        );
      }

      switch (thenable.status) {
        case 'fulfilled':
          return thenable.value;
        case 'rejected':
          throw thenable.reason;
        default:
          throw thenable;
      }
  }
}

function noop() {}

function throwInvalidObjectChildError(children, childrenString, options) {
  const childDescription =
    childrenString === '[object Object]'
      ? `object with keys {${Object.keys(children).join(', ')}}`
      : childrenString;

  if (isReactServerProduction(options)) {
    throw new Error(formatProdErrorMessage(31, childDescription));
  }

  throw new Error(
    'Objects are not valid as a React child (found: ' +
      childDescription +
      '). If you meant to render a collection of children, use an array instead.'
  );
}

function throwInvalidOnlyChildError(options) {
  if (options.reactServer && !isDevelopment) {
    throw new Error(formatProdErrorMessage(143));
  }

  throw new Error(
    'React.Children.only expected to receive a single React element child.'
  );
}

function isReactServerProduction(options) {
  return options?.reactServer === true && !isDevelopment;
}

function formatProdErrorMessage(code, ...args) {
  let url = `https://react.dev/errors/${code}`;
  if (args.length > 0) {
    url += `?args[]=${encodeURIComponent(args[0])}`;
    for (let index = 1; index < args.length; index += 1) {
      url += `&args[]=${encodeURIComponent(args[index])}`;
    }
  }

  return (
    `Minified React error #${code}; visit ${url} for the full message or ` +
    'use the non-minified dev environment for full errors and additional helpful warnings.'
  );
}

function checkKeyStringCoercion(value) {
  try {
    testStringCoercion(value);
  } catch (_error) {
    if (isDevelopment) {
      console.error(
        'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.',
        getUnsupportedKeyTypeName(value)
      );
    }
    return testStringCoercion(value);
  }

  return undefined;
}

function testStringCoercion(value) {
  return '' + value;
}

function getUnsupportedKeyTypeName(value) {
  return (
    (typeof Symbol === 'function' &&
      Symbol.toStringTag &&
      value &&
      value[Symbol.toStringTag]) ||
    value?.constructor?.name ||
    'Object'
  );
}

function createChildrenTraversalCurrentnessReport(overrides = {}) {
  const defaults = {
    kind: 'fast-react.private.children_helper_traversal_currentness',
    version: 1,
    status: childrenTraversalCurrentnessStatus,
    compatibilityTarget: 'react@19.2.6',
    sourceReport: childrenTraversalSourceReport,
    sourceAnchors: childrenTraversalSourceAnchors,
    validChildShapeRows: childrenTraversalValidChildShapeRows,
    keyPathEscapingRows: childrenTraversalKeyPathEscapingRows,
    iterableHandlingRows: childrenTraversalIterableHandlingRows,
    thrownErrorRows: childrenTraversalThrownErrorRows,
    unsupportedEdgeCaseRows: childrenTraversalUnsupportedEdgeCaseRows,
    lazyEvidence: childrenTraversalLazyEvidence,
    lazyRendererBlockerSourceRows:
      childrenTraversalLazyRendererBlockerSourceRows,
    lazyRendererBlockerRows: childrenTraversalLazyRendererBlockerRows,
    lazyRendererBlockerEvidence: childrenTraversalLazyRendererBlockerEvidence,
    portalRefOwnerBlockerSourceRows:
      childrenTraversalPortalRefOwnerBlockerSourceRows,
    portalRefOwnerBlockerRows: childrenTraversalPortalRefOwnerBlockerRows,
    portalRefOwnerBlockerEvidence: childrenTraversalPortalRefOwnerBlockerEvidence,
    behaviorCurrentness: createChildrenTraversalBehaviorCurrentness()
  };

  for (const flagName of childrenTraversalPublicCompatibilityFalseFlags) {
    defaults[flagName] = false;
  }
  for (const flagName of childrenTraversalPrerequisiteFalseFlags) {
    defaults[flagName] = false;
  }
  for (const flagName of childrenTraversalUnsupportedClaimFalseFlags) {
    defaults[flagName] = false;
  }

  const report = {
    ...defaults,
    ...overrides
  };

  if (
    Object.hasOwn(overrides, 'sourceReport') &&
    overrides.sourceReport !== childrenTraversalSourceReport
  ) {
    report.sourceReport = freezeRecord({
      ...childrenTraversalSourceReport,
      ...overrides.sourceReport
    });
  }

  if (
    Object.hasOwn(overrides, 'behaviorCurrentness') &&
    overrides.behaviorCurrentness !== defaults.behaviorCurrentness
  ) {
    report.behaviorCurrentness = freezeRecord({
      ...defaults.behaviorCurrentness,
      ...overrides.behaviorCurrentness
    });
  }

  const frozenReport = freezeRecord(report);
  childrenTraversalCurrentnessReports.add(frozenReport);
  return frozenReport;
}

function consumeChildrenTraversalCurrentnessReport(report) {
  const rejectionReason = validateChildrenTraversalCurrentnessReport(report);
  if (rejectionReason !== null) {
    throw createChildrenTraversalCurrentnessGateError(rejectionReason);
  }

  return freezeRecord({
    status: childrenTraversalCurrentnessConsumptionStatus,
    accepted: true,
    compatibilityTarget: 'react@19.2.6',
    evidenceAreas: freezeArray([
      'valid-child-shapes',
      'key-path-escaping',
      'iterable-handling',
      'thrown-error-shapes',
      'lazy-child-traversal',
      'lazy-renderer-suspense-root-blockers',
      'portal-ref-owner-renderer-blockers',
      'unsupported-edge-blockers'
    ]),
    sourceReport: report.sourceReport,
    lazyEvidence: report.lazyEvidence,
    lazyRendererBlockerSourceRows: report.lazyRendererBlockerSourceRows,
    lazyRendererBlockerRows: report.lazyRendererBlockerRows,
    lazyRendererBlockerEvidence: report.lazyRendererBlockerEvidence,
    portalRefOwnerBlockerSourceRows: report.portalRefOwnerBlockerSourceRows,
    portalRefOwnerBlockerRows: report.portalRefOwnerBlockerRows,
    portalRefOwnerBlockerEvidence: report.portalRefOwnerBlockerEvidence,
    behaviorCurrentness: report.behaviorCurrentness,
    lazyTraversalSupported: true,
    directLazyTraversalSupported: true,
    lazyTraversalBlocked: false,
    rendererTraversalBlocked: true,
    lazyRendererSuspenseRootBlocked: true,
    portalRefOwnerRendererBlocked: true,
    lazyRendererCompatibilityClaimed: false,
    suspenseWakeupCompatibilityClaimed: false,
    rootLazyRenderingCompatibilityClaimed: false,
    portalRendererCompatibilityClaimed: false,
    refOwnerIntegrationCompatibilityClaimed: false,
    ownerStackCompatibilityClaimed: false,
    suspenseLazyRendererCompatibilityClaimed: false,
    callerShapedLazyRendererEvidenceAccepted: false,
    callerShapedPortalRefOwnerEvidenceAccepted: false,
    ownerDispatcherRootPrerequisitesBlocked: true,
    rootRendererPrerequisitesBlocked: true,
    publicCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function isChildrenTraversalCurrentnessReport(report) {
  return validateChildrenTraversalCurrentnessReport(report) === null;
}

function validateChildrenTraversalCurrentnessReport(report) {
  if (report === null || typeof report !== 'object') {
    return 'children-traversal-currentness-source-proof';
  }

  if (!childrenTraversalCurrentnessReports.has(report)) {
    return 'children-traversal-currentness-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'children-traversal-currentness-not-frozen';
  }

  if (
    report.kind !==
      'fast-react.private.children_helper_traversal_currentness' ||
    report.version !== 1 ||
    report.status !== childrenTraversalCurrentnessStatus ||
    report.compatibilityTarget !== 'react@19.2.6'
  ) {
    return 'children-traversal-currentness-source-proof';
  }

  if (!isChildrenTraversalCurrentnessSourceEvidenceFrozen()) {
    return 'children-traversal-currentness-nested-source-evidence-not-frozen';
  }

  if (
    !ownDataPropertyKeysEqual(
      report,
      childrenTraversalCurrentnessReportFieldNames
    )
  ) {
    return 'children-traversal-currentness-report-shape';
  }

  if (report.sourceReport !== childrenTraversalSourceReport) {
    return 'children-traversal-currentness-source-report';
  }

  if (report.sourceAnchors !== childrenTraversalSourceAnchors) {
    return 'children-traversal-currentness-source-anchors';
  }

  if (report.validChildShapeRows !== childrenTraversalValidChildShapeRows) {
    return 'children-traversal-currentness-valid-child-shapes';
  }

  if (report.keyPathEscapingRows !== childrenTraversalKeyPathEscapingRows) {
    return 'children-traversal-currentness-key-path-escaping';
  }

  if (report.iterableHandlingRows !== childrenTraversalIterableHandlingRows) {
    return 'children-traversal-currentness-iterable-handling';
  }

  if (report.thrownErrorRows !== childrenTraversalThrownErrorRows) {
    return 'children-traversal-currentness-thrown-error-shapes';
  }

  if (
    report.unsupportedEdgeCaseRows !== childrenTraversalUnsupportedEdgeCaseRows
  ) {
    return 'children-traversal-currentness-unsupported-edge-blockers';
  }

  if (report.lazyEvidence !== childrenTraversalLazyEvidence) {
    return 'children-traversal-currentness-lazy-evidence';
  }

  if (
    report.lazyRendererBlockerSourceRows !==
    childrenTraversalLazyRendererBlockerSourceRows
  ) {
    return 'children-traversal-currentness-lazy-renderer-source-rows';
  }

  if (
    report.lazyRendererBlockerRows !== childrenTraversalLazyRendererBlockerRows
  ) {
    return 'children-traversal-currentness-lazy-renderer-blocker-rows';
  }

  if (
    report.lazyRendererBlockerEvidence !==
    childrenTraversalLazyRendererBlockerEvidence
  ) {
    return 'children-traversal-currentness-lazy-renderer-evidence';
  }

  if (
    report.portalRefOwnerBlockerSourceRows !==
    childrenTraversalPortalRefOwnerBlockerSourceRows
  ) {
    return 'children-traversal-currentness-portal-ref-owner-source-rows';
  }

  if (
    report.portalRefOwnerBlockerRows !==
    childrenTraversalPortalRefOwnerBlockerRows
  ) {
    return 'children-traversal-currentness-portal-ref-owner-blocker-rows';
  }

  if (
    report.portalRefOwnerBlockerEvidence !==
    childrenTraversalPortalRefOwnerBlockerEvidence
  ) {
    return 'children-traversal-currentness-portal-ref-owner-evidence';
  }

  if (
    !isAcceptedChildrenTraversalBehaviorCurrentness(
      report.behaviorCurrentness
    )
  ) {
    return 'children-traversal-currentness-behavior-probes';
  }

  for (const flagName of childrenTraversalPublicCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return 'children-traversal-currentness-public-compatibility-claim';
    }
  }

  for (const flagName of childrenTraversalPrerequisiteFalseFlags) {
    if (report[flagName] !== false) {
      return 'children-traversal-currentness-prerequisite-smuggling';
    }
  }

  for (const flagName of childrenTraversalUnsupportedClaimFalseFlags) {
    if (report[flagName] !== false) {
      return 'children-traversal-currentness-unsupported-edge-claim';
    }
  }

  return null;
}

function isChildrenTraversalCurrentnessSourceEvidenceFrozen() {
  return (
    isDeepFrozenDataGraph(privateChildrenTraversalCurrentnessMetadata) &&
    isDeepFrozenDataGraph(childrenTraversalCurrentnessReportFieldNames)
  );
}

function isDeepFrozenDataGraph(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') {
    return true;
  }

  if (seen.has(value)) {
    return true;
  }
  seen.add(value);

  if (!Object.isFrozen(value)) {
    return false;
  }

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !Object.hasOwn(descriptor, 'value')) {
      return false;
    }

    if (!isDeepFrozenDataGraph(descriptor.value, seen)) {
      return false;
    }
  }

  return true;
}

function isAcceptedChildrenTraversalBehaviorCurrentness(currentness) {
  if (
    currentness === null ||
    typeof currentness !== 'object' ||
    !Object.isFrozen(currentness)
  ) {
    return false;
  }

  if (
    !ownDataPropertyKeysEqual(
      currentness,
      childrenTraversalBehaviorCurrentnessFieldNames
    )
  ) {
    return false;
  }

  for (const fieldName of childrenTraversalBehaviorCurrentnessFieldNames) {
    const expected =
      fieldName === 'lazyTraversalBlocked' ||
      fieldName === 'compatibilityClaimed'
        ? false
        : true;
    if (currentness[fieldName] !== expected) {
      return false;
    }
  }

  return true;
}

function createChildrenTraversalBehaviorCurrentness() {
  const previousDidWarnAboutMaps = didWarnAboutMaps;
  const helpers = createChildrenHelpers();

  try {
    let falseChildValue = 'not-called';
    helpers.map(false, function (child) {
      falseChildValue = child;
      return child;
    });

    const scalarMap = helpers.map(
      ['text-child', 42, 9007199254740993n],
      function (child) {
        return child;
      }
    );

    const nested = ['first', [false, , 'last'], null, [['deep']]];
    const element = createElement('span', { key: 'leaf' });
    const fragment = createElement(
      Symbol.for('react.fragment'),
      null,
      createElement('i', null, 'inside-fragment')
    );
    const portal = {
      $$typeof: REACT_PORTAL_TYPE,
      key: 'portal-key',
      children: 'portal-child'
    };

    const keyPathChildren = [
      createElement('span', { key: 'a:b=c' }),
      [createElement('span', null), 'text'],
      false,
      [[createElement('span', { key: 'slash/key' })]]
    ];
    const keyPathKeys = childKeys(helpers.toArray(keyPathChildren));
    const arrayReturnKeys = childKeys(
      helpers.map([createElement('span', { key: 'orig' })], function () {
        return [
          createElement('i', { key: 'inner/key' }),
          createElement('i', null)
        ];
      })
    );

    const setKeys = childKeys(
      helpers.toArray(
        new Set([createElement('span', { key: 'set-key' }), 'plain', false])
      )
    );
    const generatorKeys = childKeys(
      helpers.toArray(
        (function* childrenGenerator() {
          yield createElement('strong', null);
          yield ['nested-generator'];
        })()
      )
    );
    const mapKeys = childKeys(
      withoutConsoleWarn(function () {
        return helpers.toArray(
          new Map([
            ['first-key', createElement('span', { key: 'map-key' })],
            ['second-key', 'map-value']
          ])
        );
      })
    );

    const fulfilled = {
      status: 'fulfilled',
      value: [createElement('span', { key: 'fulfilled' }), 'ready'],
      then: noop
    };
    const syncFulfilled = {
      then: function then(resolve) {
        resolve([createElement('span', { key: 'sync' }), 'sync-ready']);
      }
    };
    const rejected = {
      status: 'rejected',
      reason: new Error('rejected child'),
      then: noop
    };
    const pending = {
      then: noop
    };
    const fulfilledKeys = childKeys(helpers.toArray(fulfilled));
    helpers.toArray(syncFulfilled);
    const rejectedAttempt = captureOperation(function () {
      return helpers.toArray(rejected);
    });
    const pendingAttempt = captureOperation(function () {
      return helpers.toArray(pending);
    });

    let lazyFulfilledLoaderCalls = 0;
    const lazyFulfilledChild = lazy(function loadLazyFulfilledChild() {
      lazyFulfilledLoaderCalls += 1;
      return createSynchronousThenable({
        default: [
          createElement('span', { key: 'lazy-fulfilled' }),
          'lazy-ready',
          false
        ]
      });
    });
    const lazyFulfilledToArray = helpers.toArray(lazyFulfilledChild);
    const lazyFulfilledCount = helpers.count(lazyFulfilledChild);
    const lazyFulfilledMapCalls = [];
    const lazyFulfilledMap = helpers.map(lazyFulfilledChild, function (
      child,
      index
    ) {
      lazyFulfilledMapCalls.push({
        kind: childKind(child),
        index
      });
      return child;
    });

    let lazyPendingLoaderCalls = 0;
    const lazyPendingThenable = { then: noop };
    const lazyPendingChild = lazy(function loadLazyPendingChild() {
      lazyPendingLoaderCalls += 1;
      return lazyPendingThenable;
    });
    const lazyPendingAttempt = captureOperation(function () {
      return helpers.toArray(lazyPendingChild);
    });

    let lazyRejectedLoaderCalls = 0;
    const lazyRejectedReason = new Error('lazy child rejected');
    const lazyRejectedChild = lazy(function loadLazyRejectedChild() {
      lazyRejectedLoaderCalls += 1;
      return createRejectedThenable(lazyRejectedReason);
    });
    const lazyRejectedAttempt = captureOperation(function () {
      return helpers.toArray(lazyRejectedChild);
    });

    let lazyLoaderErrorCalls = 0;
    const lazyLoaderError = new Error('lazy child loader exploded');
    const lazyThrowingChild = lazy(function loadLazyThrowingChild() {
      lazyLoaderErrorCalls += 1;
      throw lazyLoaderError;
    });
    const lazyLoaderErrorAttempt = captureOperation(function () {
      return helpers.toArray(lazyThrowingChild);
    });

    const invalidObjectAttempt = captureOperation(function () {
      return helpers.count({ a: 1, b: 2 });
    });
    const onlyStringAttempt = captureOperation(function () {
      return helpers.only('x');
    });
    const missingCallbackAttempt = captureOperation(function () {
      return helpers.map(['x'], undefined);
    });
    const callbackThrowsAttempt = captureOperation(function () {
      return helpers.map(['x'], function () {
        throw new Error('callback exploded');
      });
    });
    const iteratorThrowsAttempt = captureOperation(function () {
      return helpers.toArray({
        [MAYBE_ITERATOR_SYMBOL]: function iterator() {
          return {
            next: function next() {
              throw new Error('iterator exploded');
            }
          };
        }
      });
    });

    return freezeRecord({
      nullishTopLevelCurrent:
        helpers.map(null, noop) === null &&
        helpers.map(undefined, noop) === undefined &&
        helpers.count(null) === 0 &&
        helpers.toArray(undefined).length === 0,
      booleanChildrenCoerceToNull:
        falseChildValue === null && helpers.count(false) === 1,
      ignoredFunctionAndSymbolChildren:
        helpers.count(Symbol('child-symbol')) === 0 &&
        helpers.count(function childFunction() {}) === 0,
      scalarLeavesCurrent:
        scalarMap.length === 3 &&
        scalarMap[0] === 'text-child' &&
        scalarMap[1] === 42 &&
        scalarMap[2] === 9007199254740993n,
      arrayHolesAndNestedTraversalCurrent: helpers.count(nested) === 6,
      elementAndFragmentLeavesCurrent:
        helpers.count([element, fragment]) === 2 &&
        helpers.only(fragment) === fragment,
      portalShapeLeafCurrent:
        helpers.count([portal]) === 1 &&
        helpers.toArray([portal])[0] === portal,
      keyPathEscapingCurrent: arraysEqual(keyPathKeys, [
        '.$a=2b=0c',
        '.1:0',
        null,
        '.3:0:$slash/key'
      ]),
      arrayReturnKeyEscapingCurrent: arraysEqual(arrayReturnKeys, [
        '.$orig/.$inner/key',
        '.$orig/.1'
      ]),
      setAndGeneratorIterablesCurrent:
        arraysEqual(setKeys, ['.$set-key', null]) &&
        arraysEqual(generatorKeys, ['.0', null]),
      mapEntryIterableCurrent: arraysEqual(mapKeys, [
        null,
        '.0:$map-key',
        null,
        null
      ]),
      thenableUnwrapAndThrowCurrent:
        arraysEqual(fulfilledKeys, ['.$fulfilled', null]) &&
        syncFulfilled.status === 'fulfilled' &&
        rejectedAttempt.status === 'throws' &&
        rejectedAttempt.errorMessage === 'rejected child' &&
        pendingAttempt.status === 'throws' &&
        pendingAttempt.thrownValue === pending &&
        pending.status === 'pending',
      invalidObjectErrorShapeCurrent:
        invalidObjectAttempt.status === 'throws' &&
        invalidObjectAttempt.errorMessage.includes(
          'Objects are not valid as a React child'
        ) &&
        invalidObjectAttempt.errorMessage.includes('object with keys {a, b}'),
      onlyErrorShapeCurrent:
        onlyStringAttempt.status === 'throws' &&
        onlyStringAttempt.errorMessage ===
          'React.Children.only expected to receive a single React element child.',
      missingCallbackTypeErrorCurrent:
        missingCallbackAttempt.status === 'throws' &&
        missingCallbackAttempt.errorName === 'TypeError',
      callbackAndIteratorErrorPropagationCurrent:
        callbackThrowsAttempt.status === 'throws' &&
        callbackThrowsAttempt.errorMessage === 'callback exploded' &&
        iteratorThrowsAttempt.status === 'throws' &&
        iteratorThrowsAttempt.errorMessage === 'iterator exploded',
      lazyFulfilledTraversalCurrent:
        lazyFulfilledLoaderCalls === 1 &&
        lazyFulfilledChild._payload._status === 1 &&
        lazyFulfilledCount === 3 &&
        arraysEqual(childKeys(lazyFulfilledToArray), [
          '.$lazy-fulfilled',
          null
        ]) &&
        arraysEqual(childKeys(lazyFulfilledMap), [
          '.$lazy-fulfilled',
          null
        ]) &&
        arraysEqual(
          lazyFulfilledMapCalls.map(function (call) {
            return `${call.kind}:${call.index}`;
          }),
          ['element:0', 'string:1', 'null:2']
        ),
      lazyPendingThenableThrowCurrent:
        lazyPendingLoaderCalls === 1 &&
        lazyPendingAttempt.status === 'throws' &&
        lazyPendingAttempt.thrownValue === lazyPendingThenable &&
        lazyPendingChild._payload._status === 0 &&
        lazyPendingChild._payload._result === lazyPendingThenable,
      lazyRejectedErrorThrowCurrent:
        lazyRejectedLoaderCalls === 1 &&
        lazyRejectedAttempt.status === 'throws' &&
        lazyRejectedAttempt.thrownValue === lazyRejectedReason &&
        lazyRejectedAttempt.errorMessage === 'lazy child rejected' &&
        lazyRejectedChild._payload._status === 2 &&
        lazyRejectedChild._payload._result === lazyRejectedReason,
      lazyLoaderErrorPropagationCurrent:
        lazyLoaderErrorCalls === 1 &&
        lazyLoaderErrorAttempt.status === 'throws' &&
        lazyLoaderErrorAttempt.thrownValue === lazyLoaderError &&
        lazyLoaderErrorAttempt.errorMessage === 'lazy child loader exploded' &&
        lazyThrowingChild._payload._status === -1,
      lazyTraversalSupported: true,
      lazyTraversalBlocked: false,
      rendererTraversalBlocked: true,
      lazyRendererSuspenseRootBlockerCurrent: true,
      lazyRendererCompatibilityBlocked: true,
      lazySuspenseCompatibilityBlocked: true,
      lazyRootCompatibilityBlocked: true,
      callerShapedLazyRendererEvidenceBlocked: true,
      portalRefOwnerRendererBlockerCurrent: true,
      portalRendererCompatibilityBlocked: true,
      refOwnerIntegrationCompatibilityBlocked: true,
      rootRendererPrerequisitesBlocked: true,
      suspenseLazyRendererBehaviorBlocked: true,
      callerShapedPortalRefOwnerEvidenceBlocked: true,
      ownerDispatcherRootPrerequisitesBlocked: true,
      compatibilityClaimed: false
    });
  } finally {
    didWarnAboutMaps = previousDidWarnAboutMaps;
  }
}

function createChildrenTraversalCurrentnessGateError(reason) {
  const error = createUnimplementedError(
    'react',
    '__FAST_REACT_PRIVATE_CHILDREN_TRAVERSAL_CURRENTNESS__.consumeChildrenTraversalCurrentnessReport',
    'rejected private Children traversal currentness evidence',
    `Reason: ${reason}.`
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.packageCompatibilityClaimed = false;
  error.fullReactChildrenParityClaimed = false;
  error.rendererTraversalClaimed = false;
  error.lazyTraversalClaimed = false;
  error.lazyRendererCompatibilityClaimed = false;
  error.lazySuspenseWakeupClaimed = false;
  error.lazyRootRenderingClaimed = false;
  error.portalRendererTraversalClaimed = false;
  error.portalRootRenderingClaimed = false;
  error.refOwnerIntegrationClaimed = false;
  error.rendererRootCompatibilityClaimed = false;
  error.suspenseLazyRendererBehaviorClaimed = false;
  error.publicPortalRendererCompatibilityClaimed = false;
  error.publicRefOwnerCompatibilityClaimed = false;
  error.publicOwnerStackCompatibilityClaimed = false;
  error.publicSuspenseRendererCompatibilityClaimed = false;
  error.dispatcherPrerequisitesReady = false;
  error.rootPrerequisitesReady = false;
  error.lazyRendererPrerequisitesReady = false;
  error.lazySuspensePrerequisitesReady = false;
  error.lazyRootPrerequisitesReady = false;
  error.portalPrerequisitesReady = false;
  error.refPrerequisitesReady = false;
  error.rendererRootPrerequisitesReady = false;
  error.portalRootPrerequisitesReady = false;
  error.refOwnerPrerequisitesReady = false;
  error.suspenseRendererPrerequisitesReady = false;
  error.ownerDispatcherPrerequisitesReady = false;
  return error;
}

function captureOperation(fn) {
  try {
    return {
      status: 'ok',
      value: fn()
    };
  } catch (error) {
    return {
      status: 'throws',
      thrownValue: error,
      errorName:
        error && typeof error === 'object' ? error.name : typeof error,
      errorMessage:
        error && typeof error === 'object' && 'message' in error
          ? error.message
          : String(error)
    };
  }
}

function childKeys(children) {
  return children.map(function (child) {
    return isValidElement(child) ? child.key : null;
  });
}

function childKind(child) {
  if (child === null) {
    return 'null';
  }
  if (isValidElement(child)) {
    return 'element';
  }
  return typeof child;
}

function createSynchronousThenable(value) {
  return {
    then: function then(resolve) {
      resolve(value);
    }
  };
}

function createRejectedThenable(reason) {
  return {
    then: function then(_resolve, reject) {
      reject(reason);
    }
  };
}

function withoutConsoleWarn(fn) {
  const originalConsoleWarn = console.warn;
  console.warn = noop;
  try {
    return fn();
  } finally {
    console.warn = originalConsoleWarn;
  }
}

function arraysEqual(left, right) {
  if (!isArray(left) || !isArray(right) || left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

function ownDataPropertyKeysEqual(value, expectedKeys) {
  const actualKeys = Reflect.ownKeys(value);
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (let index = 0; index < expectedKeys.length; index += 1) {
    const expectedKey = expectedKeys[index];
    if (actualKeys[index] !== expectedKey) {
      return false;
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, expectedKey);
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !Object.hasOwn(descriptor, 'value')
    ) {
      return false;
    }
  }

  return true;
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeRecordArray(records) {
  return freezeArray(
    records.map(function (record) {
      return freezeRecord(record);
    })
  );
}

module.exports = {
  childrenTraversalCurrentnessConsumptionStatus,
  childrenTraversalCurrentnessStatus,
  consumeChildrenTraversalCurrentnessReport,
  createChildrenHelpers,
  createChildrenTraversalCurrentnessReport,
  isChildrenTraversalCurrentnessReport,
  privateChildrenTraversalCurrentnessMetadata,
  validateChildrenTraversalCurrentnessReport
};
