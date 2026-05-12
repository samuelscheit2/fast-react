import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);

const React = require("../../../packages/react/index.js");
const ReactCjsDevelopment = require(
  "../../../packages/react/cjs/react.development.js"
);
const ReactCjsProduction = require(
  "../../../packages/react/cjs/react.production.js"
);
const ReactServer = require("../../../packages/react/react.react-server.js");
const childrenHelper = require("../../../packages/react/children-helper.js");

const privateChildrenCurrentnessExports = [
  "childrenTraversalCurrentnessConsumptionStatus",
  "childrenTraversalCurrentnessStatus",
  "consumeChildrenTraversalCurrentnessReport",
  "createChildrenTraversalCurrentnessReport",
  "isChildrenTraversalCurrentnessReport",
  "privateChildrenTraversalCurrentnessMetadata",
  "validateChildrenTraversalCurrentnessReport"
];

test("private Children traversal currentness report records source-owned anchors and blockers", () => {
  const metadata = childrenHelper.privateChildrenTraversalCurrentnessMetadata;

  assert.equal(
    metadata.capability,
    "fast-react.private.children_helper_traversal_currentness"
  );
  assert.equal(metadata.compatibilityTarget, "react@19.2.6");
  assert.equal(
    metadata.currentnessStatus,
    childrenHelper.childrenTraversalCurrentnessStatus
  );
  assert.equal(
    metadata.currentnessConsumptionStatus,
    childrenHelper.childrenTraversalCurrentnessConsumptionStatus
  );
  assert.equal(metadata.compatibilityClaimed, false);
  assert.deepEqual(metadata.sourceReportFieldNames, [
    "kind",
    "version",
    "status",
    "reactSourceTag",
    "reactSourceCommit",
    "reactChildrenSource",
    "reactClientSource",
    "reactSymbolsSource",
    "fastReactSource",
    "fastReactDefaultRoot",
    "fastReactServerRoot",
    "packageOracle",
    "reactSourceAnchorsCurrent",
    "packageOracleCurrent",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(metadata.sourceReport, {
    kind: "fast-react.private.children_helper_traversal_source_report",
    version: 1,
    status: "source-current-for-react-19.2.6-children-helper-traversal",
    reactSourceTag: "v19.2.6",
    reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
    reactChildrenSource: "packages/react/src/ReactChildren.js",
    reactClientSource: "packages/react/src/ReactClient.js",
    reactSymbolsSource: "packages/shared/ReactSymbols.js",
    fastReactSource: "packages/react/children-helper.js",
    fastReactDefaultRoot: "packages/react/index.js",
    fastReactServerRoot: "packages/react/react.react-server.js",
    packageOracle:
      "tests/conformance/oracles/react-19.2.6-children-helper-oracle.json",
    reactSourceAnchorsCurrent: true,
    packageOracleCurrent: true,
    compatibilityClaimed: false
  });

  assert.deepEqual(
    metadata.sourceAnchors.map((row) => [row.source, row.symbols]),
    [
      [
        "packages/react/src/ReactChildren.js",
        [
          "escape",
          "escapeUserProvidedKey",
          "getElementKey",
          "resolveThenable",
          "mapIntoArray",
          "mapChildren",
          "countChildren",
          "forEachChildren",
          "toArray",
          "onlyChild"
        ]
      ],
      ["packages/react/src/ReactClient.js", ["Children"]],
      [
        "packages/shared/ReactSymbols.js",
        [
          "REACT_ELEMENT_TYPE",
          "REACT_PORTAL_TYPE",
          "REACT_LAZY_TYPE",
          "getIteratorFn"
        ]
      ]
    ]
  );
  assert.deepEqual(
    metadata.validChildShapeRows.map((row) => row.id),
    [
      "nullish-and-boolean-children",
      "scalar-leaf-children",
      "element-fragment-and-portal-leaves",
      "arrays-and-nested-arrays",
      "function-and-symbol-children",
      "direct-thenable-children",
      "direct-react-lazy-children"
    ]
  );
  assert.deepEqual(
    metadata.keyPathEscapingRows.map((row) => row.id),
    [
      "explicit-key-escaping",
      "path-separator-synthesis",
      "user-provided-slash-escaping"
    ]
  );
  assert.deepEqual(
    metadata.iterableHandlingRows.map((row) => row.id),
    ["set-and-generator-iterables", "map-entry-iterables"]
  );
  assert.deepEqual(
    metadata.thrownErrorRows.map((row) => row.id),
    [
      "plain-object-child-error",
      "only-child-error",
      "missing-callback-and-user-errors"
    ]
  );
  assert.deepEqual(
    metadata.unsupportedEdgeCaseRows.map((row) => row.id),
    [
      "lazy-rendering-suspense-and-component-execution",
      "renderer-traversal-and-fragment-rendering",
      "real-portal-creation"
    ]
  );
  assert.deepEqual(metadata.lazyEvidence, {
    id: "direct-react-lazy-child-traversal",
    reactSourceAnchor: "ReactChildren.mapIntoArray REACT_LAZY_TYPE branch",
    wrapperSource: "packages/react/wrapper-object.js React.lazy",
    oracleScenario: "children-lazy-values",
    fulfilledCase:
      "React.lazy loader synchronously resolves to a module.default child tree that direct Children helpers traverse",
    pendingCase:
      "pending React.lazy loader thenables are thrown by direct Children helpers",
    rejectedCase:
      "synchronously rejected React.lazy loader thenables throw their rejection reason",
    loaderErrorCase:
      "loader-thrown errors propagate through direct Children helpers and leave the lazy payload uninitialized",
    callerShapedLazyEvidenceAccepted: false,
    rendererOrSuspenseCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(metadata.lazyRendererBlockerSourceRowFieldNames, [
    "id",
    "sourceFiles",
    "symbols",
    "role",
    "compatibilityScope",
    "sourceOwned",
    "current",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(
    metadata.lazyRendererBlockerSourceRows.map((row) => [
      row.id,
      row.sourceFiles,
      row.symbols,
      row.compatibilityScope
    ]),
    [
      [
        "react-children-direct-lazy-traversal",
        ["packages/react/src/ReactChildren.js"],
        ["mapIntoArray", "REACT_LAZY_TYPE"],
        "direct-children-helper-only"
      ],
      [
        "react-reconciler-lazy-component-resolution",
        [
          "packages/react-reconciler/src/ReactFiberBeginWork.js",
          "packages/react-reconciler/src/ReactFiberThenable.js"
        ],
        ["mountLazyComponent", "resolveLazy"],
        "renderer-owned"
      ],
      [
        "react-reconciler-suspense-wakeup",
        [
          "packages/react-reconciler/src/ReactFiberBeginWork.js",
          "packages/react-reconciler/src/ReactFiberThrow.js",
          "packages/react-reconciler/src/ReactFiberWorkLoop.js"
        ],
        [
          "updateSuspenseComponent",
          "throwException",
          "markSuspenseBoundaryShouldCapture",
          "attachPingListener"
        ],
        "renderer-owned"
      ],
      [
        "react-dom-root-lazy-render-entry",
        [
          "packages/react-dom/src/client/ReactDOMRoot.js",
          "packages/react-reconciler/src/ReactFiberRoot.js",
          "packages/react-reconciler/src/ReactFiberBeginWork.js"
        ],
        [
          "createRoot",
          "ReactDOMRoot.render",
          "createFiberRoot",
          "updateHostRoot"
        ],
        "root-and-renderer-owned"
      ]
    ]
  );
  assert.deepEqual(metadata.lazyRendererBlockerRowFieldNames, [
    "id",
    "sourceRowId",
    "directTraversalInput",
    "blockedSurfaces",
    "requiredRendererOwnedEvidence",
    "callerShapedEvidenceAccepted",
    "blocked",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(
    metadata.lazyRendererBlockerRows.map((row) => [
      row.id,
      row.sourceRowId,
      row.blockedSurfaces
    ]),
    [
      [
        "direct-lazy-traversal-not-renderer-lazy-component",
        "react-reconciler-lazy-component-resolution",
        [
          "renderer-lazy-component-execution",
          "component-tag-selection",
          "owner-stack",
          "ref-lifecycle"
        ]
      ],
      [
        "direct-lazy-traversal-not-suspense-wakeup",
        "react-reconciler-suspense-wakeup",
        [
          "Suspense-fallback-capture",
          "Suspense-retry-queue",
          "ping-listener",
          "offscreen-state"
        ]
      ],
      [
        "direct-lazy-traversal-not-root-lazy-render",
        "react-dom-root-lazy-render-entry",
        [
          "createRoot",
          "root.render",
          "HostRoot-update-queue",
          "root-scheduling",
          "DOM-or-native-commit"
        ]
      ],
      [
        "direct-lazy-traversal-not-portal-ref-prerequisites",
        "react-children-direct-lazy-traversal",
        [
          "real-portal-creation",
          "ref-attach-detach-lifecycle",
          "owner-stack-rendering"
        ]
      ]
    ]
  );
  assert.deepEqual(metadata.lazyRendererBlockerEvidence, {
    id: "direct-lazy-children-traversal-renderer-suspense-root-blockers",
    reactSourceTag: "v19.2.6",
    reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
    directTraversalOracleScenario: "children-lazy-values",
    acceptedInputEvidence: "direct-react-lazy-child-traversal",
    blockerSource:
      "source-owned React 19.2.6 renderer, Suspense, and root anchors",
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
  assert.deepEqual(metadata.portalRefOwnerBlockerSourceRowFieldNames, [
    "id",
    "sourceFiles",
    "symbols",
    "role",
    "requiredEvidenceOwner",
    "directChildrenScope",
    "sourceOwned",
    "current",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(
    metadata.portalRefOwnerBlockerSourceRows.map((row) => [
      row.id,
      row.sourceFiles,
      row.symbols,
      row.requiredEvidenceOwner,
      row.directChildrenScope
    ]),
    [
      [
        "react-children-portal-leaf-traversal-only",
        ["packages/react/src/ReactChildren.js", "packages/shared/ReactSymbols.js"],
        ["mapIntoArray", "REACT_PORTAL_TYPE"],
        "react-children-helper-source",
        true
      ],
      [
        "react-dom-create-portal-entry",
        [
          "packages/react-dom/src/shared/ReactDOM.js",
          "packages/react-dom/src/client/ReactDOMClientFB.js",
          "packages/react-reconciler/src/ReactPortal.js"
        ],
        ["createPortal", "createPortalImpl", "REACT_PORTAL_TYPE"],
        "react-dom-and-reconciler",
        false
      ],
      [
        "react-reconciler-host-portal-fiber",
        [
          "packages/react-reconciler/src/ReactChildFiber.js",
          "packages/react-reconciler/src/ReactFiber.js",
          "packages/react-reconciler/src/ReactWorkTags.js"
        ],
        [
          "updatePortal",
          "reconcileSinglePortal",
          "createFiberFromPortal",
          "HostPortal"
        ],
        "react-reconciler-renderer",
        false
      ],
      [
        "react-reconciler-ref-lifecycle",
        [
          "packages/react-reconciler/src/ReactFiberBeginWork.js",
          "packages/react-reconciler/src/ReactFiberCommitEffects.js",
          "packages/react-reconciler/src/ReactFiberCommitWork.js",
          "packages/react-reconciler/src/ReactFiberFlags.js"
        ],
        [
          "markRef",
          "Ref",
          "RefStatic",
          "commitAttachRef",
          "safelyAttachRef",
          "safelyDetachRef"
        ],
        "react-reconciler-commit",
        false
      ],
      [
        "react-owner-stack-integration",
        [
          "packages/react/src/jsx/ReactJSXElement.js",
          "packages/react/src/ReactOwnerStack.js",
          "packages/react-reconciler/src/ReactCurrentFiber.js",
          "packages/shared/ReactComponentInfoStack.js"
        ],
        [
          "getOwner",
          "captureOwnerStack",
          "runWithFiberInDEV",
          "getOwnerStackByComponentInfoInDev"
        ],
        "react-and-reconciler-dev-owner-stack",
        false
      ],
      [
        "renderer-root-dispatcher-prerequisites",
        [
          "packages/react-dom/src/client/ReactDOMRoot.js",
          "packages/react-reconciler/src/ReactFiberReconciler.js",
          "packages/react-reconciler/src/ReactFiberRoot.js",
          "packages/react-reconciler/src/ReactFiberWorkLoop.js",
          "packages/react-reconciler/src/ReactFiberBeginWork.js"
        ],
        [
          "createRoot",
          "ReactDOMRoot.render",
          "updateContainer",
          "createFiberRoot",
          "requestUpdateLane",
          "scheduleUpdateOnFiber",
          "updateHostRoot"
        ],
        "root-scheduler-and-renderer",
        false
      ],
      [
        "suspense-lazy-renderer-separation",
        [
          "packages/react-reconciler/src/ReactFiberBeginWork.js",
          "packages/react-reconciler/src/ReactFiberThenable.js",
          "packages/react-reconciler/src/ReactFiberThrow.js",
          "packages/react-reconciler/src/ReactFiberWorkLoop.js"
        ],
        [
          "mountLazyComponent",
          "resolveLazy",
          "updateSuspenseComponent",
          "throwException",
          "attachPingListener"
        ],
        "react-reconciler-suspense-renderer",
        false
      ]
    ]
  );
  assert.deepEqual(metadata.portalRefOwnerBlockerRowFieldNames, [
    "id",
    "sourceRowId",
    "acceptedDirectChildrenInput",
    "blockedSurfaces",
    "requiredSourceOwnedEvidence",
    "rejectedEvidence",
    "callerShapedEvidenceAccepted",
    "blocked",
    "compatibilityClaimed"
  ]);
  assert.deepEqual(
    metadata.portalRefOwnerBlockerRows.map((row) => [
      row.id,
      row.sourceRowId,
      row.blockedSurfaces,
      row.rejectedEvidence
    ]),
    [
      [
        "portal-leaf-not-portal-renderer-traversal",
        "react-reconciler-host-portal-fiber",
        [
          "ReactDOM.createPortal",
          "HostPortal-fiber",
          "portal-containerInfo",
          "portal-implementation",
          "DOM-or-native-portal-commit"
        ],
        [
          "caller-shaped-portal-object",
          "direct-Children-portal-leaf-only",
          "portal-compatible-public-flag"
        ]
      ],
      [
        "portal-leaf-not-root-renderer-prerequisite",
        "renderer-root-dispatcher-prerequisites",
        [
          "root.createRoot",
          "root.render",
          "updateContainer",
          "requestUpdateLane",
          "scheduleUpdateOnFiber"
        ],
        [
          "root-prerequisite-smuggling",
          "dispatcher-prerequisite-smuggling",
          "scheduler-only-evidence"
        ]
      ],
      [
        "element-ref-prop-not-ref-lifecycle",
        "react-reconciler-ref-lifecycle",
        [
          "markRef",
          "Ref-flags",
          "commitAttachRef",
          "safelyDetachRef",
          "ref-cleanup"
        ],
        [
          "element-ref-descriptor-only",
          "caller-shaped-ref-lifecycle",
          "useRef-currentness-alias"
        ]
      ],
      [
        "element-debug-owner-not-owner-stack",
        "react-owner-stack-integration",
        [
          "current-owner-dispatcher",
          "debugOwner-propagation",
          "captureOwnerStack",
          "runWithFiberInDEV"
        ],
        [
          "element-debug-field-only",
          "caller-shaped-owner-stack",
          "dispatcher-alias"
        ]
      ],
      [
        "direct-lazy-traversal-not-suspense-renderer-behavior",
        "suspense-lazy-renderer-separation",
        [
          "mountLazyComponent",
          "resolveLazy",
          "updateSuspenseComponent",
          "throwException",
          "attachPingListener"
        ],
        [
          "direct-lazy-children-oracle-only",
          "caller-shaped-suspense-renderer",
          "public-suspense-compatibility-flag"
        ]
      ],
      [
        "children-currentness-not-renderer-root-currentness",
        "renderer-root-dispatcher-prerequisites",
        [
          "renderer-root-lifecycle",
          "dispatcher-currentness",
          "root-update-queue",
          "commit-phase-output"
        ],
        [
          "cloned-report",
          "stale-progress-report",
          "proxy-hidden-alias",
          "root-dispatcher-smuggling"
        ]
      ]
    ]
  );
  assert.deepEqual(metadata.portalRefOwnerBlockerEvidence, {
    id: "children-helper-portal-ref-owner-renderer-blockers",
    reactSourceTag: "v19.2.6",
    reactSourceCommit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
    acceptedTraversalEvidence: [
      "element-fragment-and-portal-leaves",
      "direct-react-lazy-child-traversal",
      "children-helper-traversal-currentness"
    ],
    blockerSource:
      "source-owned React 19.2.6 portal, ref, owner, root, and Suspense renderer anchors",
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
  assert.deepEqual(metadata.publicCompatibilityFalseFlags, [
    "compatibilityClaimed",
    "publicCompatibilityClaimed",
    "packageCompatibilityClaimed",
    "fullReactChildrenParityClaimed",
    "fastReactBehaviorCompatible",
    "publicPackageCompatibilityClaimed",
    "publicLazyRendererCompatibilityClaimed",
    "publicLazySuspenseCompatibilityClaimed",
    "publicLazyRootCompatibilityClaimed",
    "publicPortalRendererCompatibilityClaimed",
    "publicRefOwnerCompatibilityClaimed",
    "publicOwnerStackCompatibilityClaimed",
    "publicSuspenseRendererCompatibilityClaimed"
  ]);
  assert.deepEqual(metadata.prerequisiteFalseFlags, [
    "ownerStackCompatibilityClaimed",
    "dispatcherPrerequisitesReady",
    "rootPrerequisitesReady",
    "reactDomRootPrerequisitesReady",
    "schedulerPrerequisitesReady",
    "lazyRendererPrerequisitesReady",
    "lazySuspensePrerequisitesReady",
    "lazyRootPrerequisitesReady",
    "portalPrerequisitesReady",
    "refPrerequisitesReady",
    "rendererRootPrerequisitesReady",
    "portalRootPrerequisitesReady",
    "refOwnerPrerequisitesReady",
    "suspenseRendererPrerequisitesReady",
    "ownerDispatcherPrerequisitesReady",
    "publicRootCompatibilityClaimed",
    "publicRendererCompatibilityClaimed"
  ]);
  assert.deepEqual(metadata.unsupportedClaimFalseFlags, [
    "rendererTraversalClaimed",
    "fragmentRenderTraversalClaimed",
    "portalCreationClaimed",
    "lazyTraversalClaimed",
    "lazyRendererCompatibilityClaimed",
    "lazySuspenseWakeupClaimed",
    "lazyRootRenderingClaimed",
    "ownerTraversalClaimed",
    "refLifecycleClaimed",
    "portalRendererTraversalClaimed",
    "portalRootRenderingClaimed",
    "refOwnerIntegrationClaimed",
    "rendererRootCompatibilityClaimed",
    "suspenseLazyRendererBehaviorClaimed"
  ]);
  assertDeepFrozen(metadata);
});

test("private Children traversal currentness is accepted only from the helper source", () => {
  const report = childrenHelper.createChildrenTraversalCurrentnessReport();

  assert.equal(
    report.kind,
    "fast-react.private.children_helper_traversal_currentness"
  );
  assert.equal(report.version, 1);
  assert.equal(report.status, childrenHelper.childrenTraversalCurrentnessStatus);
  assert.equal(report.compatibilityTarget, "react@19.2.6");
  assert.equal(report.sourceReport, childrenHelper.privateChildrenTraversalCurrentnessMetadata.sourceReport);
  assert.equal(report.validChildShapeRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.validChildShapeRows);
  assert.equal(report.keyPathEscapingRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.keyPathEscapingRows);
  assert.equal(report.iterableHandlingRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.iterableHandlingRows);
  assert.equal(report.thrownErrorRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.thrownErrorRows);
  assert.equal(report.unsupportedEdgeCaseRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.unsupportedEdgeCaseRows);
  assert.equal(report.lazyEvidence, childrenHelper.privateChildrenTraversalCurrentnessMetadata.lazyEvidence);
  assert.equal(report.lazyRendererBlockerSourceRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.lazyRendererBlockerSourceRows);
  assert.equal(report.lazyRendererBlockerRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.lazyRendererBlockerRows);
  assert.equal(report.lazyRendererBlockerEvidence, childrenHelper.privateChildrenTraversalCurrentnessMetadata.lazyRendererBlockerEvidence);
  assert.equal(report.portalRefOwnerBlockerSourceRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.portalRefOwnerBlockerSourceRows);
  assert.equal(report.portalRefOwnerBlockerRows, childrenHelper.privateChildrenTraversalCurrentnessMetadata.portalRefOwnerBlockerRows);
  assert.equal(report.portalRefOwnerBlockerEvidence, childrenHelper.privateChildrenTraversalCurrentnessMetadata.portalRefOwnerBlockerEvidence);
  assert.deepEqual(report.behaviorCurrentness, {
    nullishTopLevelCurrent: true,
    booleanChildrenCoerceToNull: true,
    ignoredFunctionAndSymbolChildren: true,
    scalarLeavesCurrent: true,
    arrayHolesAndNestedTraversalCurrent: true,
    elementAndFragmentLeavesCurrent: true,
    portalShapeLeafCurrent: true,
    keyPathEscapingCurrent: true,
    arrayReturnKeyEscapingCurrent: true,
    setAndGeneratorIterablesCurrent: true,
    mapEntryIterableCurrent: true,
    thenableUnwrapAndThrowCurrent: true,
    invalidObjectErrorShapeCurrent: true,
    onlyErrorShapeCurrent: true,
    missingCallbackTypeErrorCurrent: true,
    callbackAndIteratorErrorPropagationCurrent: true,
    lazyFulfilledTraversalCurrent: true,
    lazyPendingThenableThrowCurrent: true,
    lazyRejectedErrorThrowCurrent: true,
    lazyLoaderErrorPropagationCurrent: true,
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
  assert.equal(report.fullReactChildrenParityClaimed, false);
  assert.equal(report.rendererTraversalClaimed, false);
  assert.equal(report.lazyTraversalClaimed, false);
  assert.equal(report.lazyRendererCompatibilityClaimed, false);
  assert.equal(report.lazySuspenseWakeupClaimed, false);
  assert.equal(report.lazyRootRenderingClaimed, false);
  assert.equal(report.portalRendererTraversalClaimed, false);
  assert.equal(report.refOwnerIntegrationClaimed, false);
  assert.equal(report.rendererRootCompatibilityClaimed, false);
  assert.equal(report.suspenseLazyRendererBehaviorClaimed, false);
  assert.equal(report.dispatcherPrerequisitesReady, false);
  assert.equal(report.rootPrerequisitesReady, false);
  assert.equal(report.lazyRendererPrerequisitesReady, false);
  assert.equal(report.lazySuspensePrerequisitesReady, false);
  assert.equal(report.lazyRootPrerequisitesReady, false);
  assert.equal(report.portalPrerequisitesReady, false);
  assert.equal(report.refPrerequisitesReady, false);
  assert.equal(report.rendererRootPrerequisitesReady, false);
  assert.equal(report.ownerDispatcherPrerequisitesReady, false);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.behaviorCurrentness), true);
  assert.equal(
    childrenHelper.validateChildrenTraversalCurrentnessReport(report),
    null
  );
  assert.equal(childrenHelper.isChildrenTraversalCurrentnessReport(report), true);

  const consumption =
    childrenHelper.consumeChildrenTraversalCurrentnessReport(report);
  assert.equal(
    consumption.status,
    childrenHelper.childrenTraversalCurrentnessConsumptionStatus
  );
  assert.equal(consumption.accepted, true);
  assert.deepEqual(consumption.evidenceAreas, [
    "valid-child-shapes",
    "key-path-escaping",
    "iterable-handling",
    "thrown-error-shapes",
    "lazy-child-traversal",
    "lazy-renderer-suspense-root-blockers",
    "portal-ref-owner-renderer-blockers",
    "unsupported-edge-blockers"
  ]);
  assert.equal(consumption.sourceReport, report.sourceReport);
  assert.equal(consumption.lazyEvidence, report.lazyEvidence);
  assert.equal(
    consumption.lazyRendererBlockerSourceRows,
    report.lazyRendererBlockerSourceRows
  );
  assert.equal(consumption.lazyRendererBlockerRows, report.lazyRendererBlockerRows);
  assert.equal(
    consumption.lazyRendererBlockerEvidence,
    report.lazyRendererBlockerEvidence
  );
  assert.equal(
    consumption.portalRefOwnerBlockerSourceRows,
    report.portalRefOwnerBlockerSourceRows
  );
  assert.equal(
    consumption.portalRefOwnerBlockerRows,
    report.portalRefOwnerBlockerRows
  );
  assert.equal(
    consumption.portalRefOwnerBlockerEvidence,
    report.portalRefOwnerBlockerEvidence
  );
  assert.equal(consumption.behaviorCurrentness, report.behaviorCurrentness);
  assert.equal(consumption.lazyTraversalSupported, true);
  assert.equal(consumption.directLazyTraversalSupported, true);
  assert.equal(consumption.lazyTraversalBlocked, false);
  assert.equal(consumption.rendererTraversalBlocked, true);
  assert.equal(consumption.lazyRendererSuspenseRootBlocked, true);
  assert.equal(consumption.portalRefOwnerRendererBlocked, true);
  assert.equal(consumption.lazyRendererCompatibilityClaimed, false);
  assert.equal(consumption.suspenseWakeupCompatibilityClaimed, false);
  assert.equal(consumption.rootLazyRenderingCompatibilityClaimed, false);
  assert.equal(consumption.portalRendererCompatibilityClaimed, false);
  assert.equal(consumption.refOwnerIntegrationCompatibilityClaimed, false);
  assert.equal(consumption.ownerStackCompatibilityClaimed, false);
  assert.equal(consumption.suspenseLazyRendererCompatibilityClaimed, false);
  assert.equal(consumption.callerShapedLazyRendererEvidenceAccepted, false);
  assert.equal(consumption.callerShapedPortalRefOwnerEvidenceAccepted, false);
  assert.equal(consumption.ownerDispatcherRootPrerequisitesBlocked, true);
  assert.equal(consumption.rootRendererPrerequisitesBlocked, true);
  assert.equal(consumption.publicCompatibilityClaimed, false);
  assert.equal(consumption.packageCompatibilityClaimed, false);
  assert.equal(consumption.compatibilityClaimed, false);
});

test("private Children traversal currentness APIs stay off public React roots", () => {
  for (const ReactRoot of [
    React,
    ReactCjsDevelopment,
    ReactCjsProduction,
    ReactServer
  ]) {
    for (const exportName of privateChildrenCurrentnessExports) {
      assert.equal(ReactRoot[exportName], undefined, exportName);
    }
    for (const exportName of privateChildrenCurrentnessExports) {
      assert.equal(ReactRoot.Children[exportName], undefined, exportName);
    }
  }

  assert.deepEqual(Object.keys(React.Children), [
    "map",
    "forEach",
    "count",
    "toArray",
    "only"
  ]);
});

test("private Children traversal currentness does not consume the public Map warning", () => {
  const { freshChildrenHelper, freshReact } = loadFreshReactChildrenModules();

  freshChildrenHelper.createChildrenTraversalCurrentnessReport();

  const warnings = captureConsoleWarn(() => {
    freshReact.Children.toArray(new Map([["first-key", "map-value"]]));
  });

  assert.deepEqual(warnings, [
    [
      "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
    ]
  ]);
});

test("private Children traversal currentness rejects forged, stale, and overbroad claims", () => {
  const report = childrenHelper.createChildrenTraversalCurrentnessReport();

  assertCurrentnessRejected(
    Object.freeze({
      ...report
    }),
    "children-traversal-currentness-source-proof"
  );
  const mutableReport = createChildrenCurrentnessReportWithFreezeBypass(
    () => true
  );
  assert.equal(Object.isFrozen(mutableReport), false);
  assertCurrentnessRejected(
    mutableReport,
    "children-traversal-currentness-not-frozen"
  );
  const reportWithMutableBehavior =
    createChildrenCurrentnessReportWithFreezeBypass(
      isChildrenTraversalBehaviorCurrentnessRecord
    );
  assert.equal(Object.isFrozen(reportWithMutableBehavior), true);
  assert.equal(
    Object.isFrozen(reportWithMutableBehavior.behaviorCurrentness),
    false
  );
  assertCurrentnessRejected(
    reportWithMutableBehavior,
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      sourceReport: {
        reactSourceCommit: "forged",
        packageOracle: "caller-shaped-oracle.json"
      }
    }),
    "children-traversal-currentness-source-report"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      validChildShapeRows: report.validChildShapeRows.map((row) => ({
        ...row
      }))
    }),
    "children-traversal-currentness-valid-child-shapes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      keyPathEscapingRows: report.keyPathEscapingRows.map((row) => ({
        ...row
      }))
    }),
    "children-traversal-currentness-key-path-escaping"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      iterableHandlingRows: report.iterableHandlingRows.map((row) => ({
        ...row
      }))
    }),
    "children-traversal-currentness-iterable-handling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      thrownErrorRows: report.thrownErrorRows.map((row) => ({
        ...row
      }))
    }),
    "children-traversal-currentness-thrown-error-shapes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      unsupportedEdgeCaseRows: report.unsupportedEdgeCaseRows.map((row) => ({
        ...row,
        blocked: false
      }))
    }),
    "children-traversal-currentness-unsupported-edge-blockers"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyEvidence: {
        ...report.lazyEvidence,
        wrapperSource: "caller-shaped react.lazy-like object",
        callerShapedLazyEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-lazy-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerSourceRows: report.lazyRendererBlockerSourceRows.map(
        (row) => ({
          ...row,
          current: false
        })
      )
    }),
    "children-traversal-currentness-lazy-renderer-source-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerSourceRows: report.lazyRendererBlockerSourceRows.map(
        (row) =>
          row.id === "react-reconciler-suspense-wakeup"
            ? {
                ...row,
                sourceFiles: [
                  "packages/react-reconciler/src/ReactFiberBeginWork.js",
                  "packages/react-reconciler/src/ReactFiberThrow.js"
                ]
              }
            : row
      )
    }),
    "children-traversal-currentness-lazy-renderer-source-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerRows: report.lazyRendererBlockerRows.map((row) => ({
        ...row,
        blocked: false
      }))
    }),
    "children-traversal-currentness-lazy-renderer-blocker-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerEvidence: {
        ...report.lazyRendererBlockerEvidence,
        reactSourceCommit: "stale",
        callerShapedRendererEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-lazy-renderer-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerEvidence: {
        ...report.lazyRendererBlockerEvidence,
        callerShapedSuspenseEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-lazy-renderer-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererBlockerEvidence: {
        ...report.lazyRendererBlockerEvidence,
        callerShapedRootEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-lazy-renderer-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerSourceRows: report.portalRefOwnerBlockerSourceRows.map(
        (row) => ({
          ...row,
          current: false
        })
      )
    }),
    "children-traversal-currentness-portal-ref-owner-source-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerSourceRows: report.portalRefOwnerBlockerSourceRows.map(
        (row) =>
          row.id === "react-reconciler-host-portal-fiber"
            ? {
                ...row,
                sourceFiles: [
                  "packages/react-reconciler/src/ReactChildFiber.js",
                  "packages/react-reconciler/src/ReactFiber.js"
                ]
              }
            : row
      )
    }),
    "children-traversal-currentness-portal-ref-owner-source-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerRows: report.portalRefOwnerBlockerRows.map((row) => ({
        ...row,
        blocked: false
      }))
    }),
    "children-traversal-currentness-portal-ref-owner-blocker-rows"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        reactSourceCommit: "stale",
        clonedOrStaleReportEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        callerShapedRendererEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        callerShapedPortalEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        callerShapedRefEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        callerShapedOwnerEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        hiddenOrProxyAliasEvidenceAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRefOwnerBlockerEvidence: {
        ...report.portalRefOwnerBlockerEvidence,
        rootDispatcherPrerequisiteSmugglingAccepted: true
      }
    }),
    "children-traversal-currentness-portal-ref-owner-evidence"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        keyPathEscapingCurrent: false
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        lazyFulfilledTraversalCurrent: false
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        lazyTraversalBlocked: true
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        lazyRendererCompatibilityBlocked: false
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        portalRendererCompatibilityBlocked: false
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      behaviorCurrentness: {
        [Symbol.for("fast-react.hidden-portal-ref-owner-alias")]: true
      }
    }),
    "children-traversal-currentness-behavior-probes"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      fullReactChildrenParityClaimed: true
    }),
    "children-traversal-currentness-public-compatibility-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      publicLazyRendererCompatibilityClaimed: true
    }),
    "children-traversal-currentness-public-compatibility-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      publicPortalRendererCompatibilityClaimed: true
    }),
    "children-traversal-currentness-public-compatibility-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      publicChildrenTraversalCompatibilityClaimed: true
    }),
    "children-traversal-currentness-report-shape"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalCompatibilityClaimed: true
    }),
    "children-traversal-currentness-report-shape"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      [Symbol.for("fast-react.public-portal-compatibility-alias")]: true
    }),
    "children-traversal-currentness-report-shape"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport(
      new Proxy(
        {},
        {
          ownKeys() {
            return [Symbol.for("fast-react.proxy-renderer-alias")];
          },
          getOwnPropertyDescriptor() {
            return {
              configurable: true,
              enumerable: true
            };
          },
          get() {
            return true;
          }
        }
      )
    ),
    "children-traversal-currentness-report-shape"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      rootPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      dispatcherPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      ownerStackCompatibilityClaimed: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRootPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      refPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      rendererRootPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      ownerDispatcherPrerequisitesReady: true
    }),
    "children-traversal-currentness-prerequisite-smuggling"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyTraversalClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      rendererTraversalClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalCreationClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRendererCompatibilityClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazySuspenseWakeupClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      lazyRootRenderingClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      refLifecycleClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      portalRendererTraversalClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      refOwnerIntegrationClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      rendererRootCompatibilityClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
  assertCurrentnessRejected(
    childrenHelper.createChildrenTraversalCurrentnessReport({
      suspenseLazyRendererBehaviorClaimed: true
    }),
    "children-traversal-currentness-unsupported-edge-claim"
  );
});

function loadFreshReactChildrenModules() {
  for (const specifier of [
    "../../../packages/react/index.js",
    "../../../packages/react/react.react-server.js",
    "../../../packages/react/cjs/react.development.js",
    "../../../packages/react/cjs/react.production.js",
    "../../../packages/react/children-helper.js"
  ]) {
    delete require.cache[require.resolve(specifier)];
  }

  const freshChildrenHelper = require(
    "../../../packages/react/children-helper.js"
  );
  const freshReact = require("../../../packages/react/index.js");

  return {
    freshChildrenHelper,
    freshReact
  };
}

function captureConsoleWarn(fn) {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args);
  };

  try {
    fn();
  } finally {
    console.warn = originalWarn;
  }

  return warnings;
}

function assertCurrentnessRejected(report, reason) {
  assert.equal(
    childrenHelper.validateChildrenTraversalCurrentnessReport(report),
    reason
  );
  assert.equal(childrenHelper.isChildrenTraversalCurrentnessReport(report), false);
  assert.throws(
    () => childrenHelper.consumeChildrenTraversalCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, "react");
      assert.equal(
        error.exportName,
        "__FAST_REACT_PRIVATE_CHILDREN_TRAVERSAL_CURRENTNESS__.consumeChildrenTraversalCurrentnessReport"
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6");
      assert.equal(error.reason, reason);
      assert.equal(error.publicCompatibilityClaimed, false);
      assert.equal(error.packageCompatibilityClaimed, false);
      assert.equal(error.fullReactChildrenParityClaimed, false);
      assert.equal(error.rendererTraversalClaimed, false);
      assert.equal(error.lazyTraversalClaimed, false);
      assert.equal(error.lazyRendererCompatibilityClaimed, false);
      assert.equal(error.lazySuspenseWakeupClaimed, false);
      assert.equal(error.lazyRootRenderingClaimed, false);
      assert.equal(error.portalRendererTraversalClaimed, false);
      assert.equal(error.portalRootRenderingClaimed, false);
      assert.equal(error.refOwnerIntegrationClaimed, false);
      assert.equal(error.rendererRootCompatibilityClaimed, false);
      assert.equal(error.suspenseLazyRendererBehaviorClaimed, false);
      assert.equal(error.publicPortalRendererCompatibilityClaimed, false);
      assert.equal(error.publicRefOwnerCompatibilityClaimed, false);
      assert.equal(error.publicOwnerStackCompatibilityClaimed, false);
      assert.equal(error.publicSuspenseRendererCompatibilityClaimed, false);
      assert.equal(error.dispatcherPrerequisitesReady, false);
      assert.equal(error.rootPrerequisitesReady, false);
      assert.equal(error.lazyRendererPrerequisitesReady, false);
      assert.equal(error.lazySuspensePrerequisitesReady, false);
      assert.equal(error.lazyRootPrerequisitesReady, false);
      assert.equal(error.portalPrerequisitesReady, false);
      assert.equal(error.refPrerequisitesReady, false);
      assert.equal(error.rendererRootPrerequisitesReady, false);
      assert.equal(error.portalRootPrerequisitesReady, false);
      assert.equal(error.refOwnerPrerequisitesReady, false);
      assert.equal(error.suspenseRendererPrerequisitesReady, false);
      assert.equal(error.ownerDispatcherPrerequisitesReady, false);
      return true;
    },
    reason
  );
}

function createChildrenCurrentnessReportWithFreezeBypass(shouldBypassFreeze) {
  const originalFreeze = Object.freeze;
  Object.freeze = (value) => {
    if (shouldBypassFreeze(value)) {
      return value;
    }

    return originalFreeze(value);
  };

  try {
    return childrenHelper.createChildrenTraversalCurrentnessReport();
  } finally {
    Object.freeze = originalFreeze;
  }
}

function isChildrenTraversalBehaviorCurrentnessRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.hasOwn(value, "nullishTopLevelCurrent") &&
    Object.hasOwn(value, "ownerDispatcherRootPrerequisitesBlocked") &&
    Object.hasOwn(value, "compatibilityClaimed")
  );
}

function assertDeepFrozen(value) {
  if (value === null || typeof value !== "object") {
    return;
  }

  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) {
    assertDeepFrozen(child);
  }
}
