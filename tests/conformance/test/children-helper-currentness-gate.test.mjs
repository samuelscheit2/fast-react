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
  assert.deepEqual(metadata.publicCompatibilityFalseFlags, [
    "compatibilityClaimed",
    "publicCompatibilityClaimed",
    "packageCompatibilityClaimed",
    "fullReactChildrenParityClaimed",
    "fastReactBehaviorCompatible",
    "publicPackageCompatibilityClaimed"
  ]);
  assert.deepEqual(metadata.prerequisiteFalseFlags, [
    "ownerStackCompatibilityClaimed",
    "dispatcherPrerequisitesReady",
    "rootPrerequisitesReady",
    "reactDomRootPrerequisitesReady",
    "schedulerPrerequisitesReady",
    "publicRootCompatibilityClaimed",
    "publicRendererCompatibilityClaimed"
  ]);
  assert.deepEqual(metadata.unsupportedClaimFalseFlags, [
    "rendererTraversalClaimed",
    "fragmentRenderTraversalClaimed",
    "portalCreationClaimed",
    "lazyTraversalClaimed",
    "ownerTraversalClaimed",
    "refLifecycleClaimed"
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
    ownerDispatcherRootPrerequisitesBlocked: true,
    compatibilityClaimed: false
  });
  assert.equal(report.fullReactChildrenParityClaimed, false);
  assert.equal(report.rendererTraversalClaimed, false);
  assert.equal(report.lazyTraversalClaimed, false);
  assert.equal(report.dispatcherPrerequisitesReady, false);
  assert.equal(report.rootPrerequisitesReady, false);
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
    "unsupported-edge-blockers"
  ]);
  assert.equal(consumption.sourceReport, report.sourceReport);
  assert.equal(consumption.lazyEvidence, report.lazyEvidence);
  assert.equal(consumption.behaviorCurrentness, report.behaviorCurrentness);
  assert.equal(consumption.lazyTraversalSupported, true);
  assert.equal(consumption.directLazyTraversalSupported, true);
  assert.equal(consumption.lazyTraversalBlocked, false);
  assert.equal(consumption.rendererTraversalBlocked, true);
  assert.equal(consumption.ownerDispatcherRootPrerequisitesBlocked, true);
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
      fullReactChildrenParityClaimed: true
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
      refLifecycleClaimed: true
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
      assert.equal(error.dispatcherPrerequisitesReady, false);
      assert.equal(error.rootPrerequisitesReady, false);
      return true;
    },
    reason
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
