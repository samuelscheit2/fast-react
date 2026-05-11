import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_754_766_GATE_STATUS,
  PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_754_766_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_754_766_REQUIRED_GUARDS,
  PRIVATE_ADMISSION_754_766_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_754_766_ROWS,
  PRIVATE_ADMISSION_754_766_VIOLATION_STATUS,
  PRIVATE_ADMISSION_754_766_WORKERS,
  evaluatePrivateAdmission754766Gate
} from "../src/private-admission-754-766-gate.mjs";
import {
  PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-746-753-gate.mjs";

const worker754 = "worker-754-js-cjs-unmount-finished-work-identity";
const worker755 = "worker-755-dom-nested-initial-host-output";
const worker756 = "worker-756-fix-public-facade-act-passive-recognition";
const worker757 = "worker-757-react-test-renderer-index-unmount-identity";
const worker758 = "worker-758-scheduler-posttask-yield-act-consumer";
const worker759 = "worker-759-private-admission-746-753-ledger";
const worker760 = "worker-760-sibling-text-native-totree-identity";
const worker761 = "worker-761-scheduler-posttask-deferred-yield-guard";
const worker762 = "worker-762-hydration-marker-listener-private-gate";
const worker763 = "worker-763-sibling-text-js-cjs-private-admission";
const worker764 =
  "worker-764-native-worker-thread-teardown-executable-preflight";
const worker765 = "worker-765-scheduler-mock-delayed-root-producer-gate";
const worker766 = "worker-766-test-renderer-root-finished-lanes-handoff";

const expectedWorkers = [
  worker754,
  worker755,
  worker756,
  worker757,
  worker758,
  worker759,
  worker760,
  worker761,
  worker762,
  worker763,
  worker764,
  worker765,
  worker766
];

const required754SpecificSurfaces = [
  "react-act-scheduler-yield-consumer",
  "react-dom-nested-root-render-host-output",
  "react-dom-hydrateroot-marker-listener-preflight",
  "react-dom-test-utils-act-passive-recognition",
  "scheduler-post-task-deferred-yield",
  "scheduler-mock-delayed-root-producer",
  "test-renderer-cjs-unmount-finished-work-identity",
  "test-renderer-package-root-unmount-finished-work-identity",
  "test-renderer-sibling-text-js-cjs-private-admission",
  "test-renderer-sibling-text-native-totree-identity",
  "test-renderer-root-finished-lanes-handoff",
  "native-worker-thread-teardown-executable-preflight",
  "native-napi-cleanup-hook-execution",
  "public-package-exports"
];
const required754SpecificPublicClaims = [
  "publicReactActSchedulerYieldCompatibilityClaimed",
  "publicReactDomNestedRootRenderCompatibilityClaimed",
  "publicReactDomHydrateRootMarkerListenerCompatibilityClaimed",
  "publicReactDomTestUtilsActPassiveCompatibilityClaimed",
  "publicSchedulerDeferredYieldCompatibilityClaimed",
  "publicSchedulerMockDelayedRootProducerCompatibilityClaimed",
  "publicTestRendererUnmountIdentityCompatibilityClaimed",
  "publicTestRendererSiblingTextJSCompatibilityClaimed",
  "publicTestRendererSiblingTextNativeToTreeCompatibilityClaimed",
  "publicTestRendererRootFinishedLanesHandoffCompatibilityClaimed",
  "publicNativeWorkerThreadExecutableCompatibilityClaimed",
  "publicNativeNapiCleanupHookCompatibilityClaimed",
  "publicPackageExportsCompatibilityClaimed"
];
const required754SpecificAdmissionClaims = [
  "reactActSchedulerYieldPublicAdmissionClaimed",
  "reactDomNestedRootRenderAdmissionClaimed",
  "reactDomHydrateRootMarkerListenerAdmissionClaimed",
  "reactDomTestUtilsActPassiveAdmissionClaimed",
  "schedulerDeferredYieldPublicAdmissionClaimed",
  "schedulerMockDelayedRootProducerAdmissionClaimed",
  "testRendererUnmountIdentityPublicAdmissionClaimed",
  "testRendererSiblingTextJSCJSAdmissionClaimed",
  "testRendererSiblingTextNativeToTreeAdmissionClaimed",
  "testRendererRootFinishedLanesHandoffPublicAdmissionClaimed",
  "nativeWorkerThreadExecutablePublicAdmissionClaimed",
  "nativeNapiCleanupHookExecutionClaimed",
  "publicPackageExportsAdmissionClaimed"
];

test("private admission 754-766 manifest records accepted private evidence", () => {
  assert.deepEqual(PRIVATE_ADMISSION_754_766_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_754_766_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_754_766_ROWS.length, 13);

  assertSubset(
    PRIVATE_ADMISSION_746_753_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_746_753_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_746_753_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    required754SpecificSurfaces,
    PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES
  );
  assertSubset(
    required754SpecificPublicClaims,
    PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    required754SpecificAdmissionClaims,
    PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 754-766 gate recognizes accepted static evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission754766Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.rowAdmissionRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.requiredGuardsRecognized, true);
  assert.equal(gate.packageSurfaceRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);

  assertPrivateEvidenceRow(gate.rowsByWorker[worker754], {
    privateAdmission: "accepted-private-test-renderer-cjs-unmount-identity",
    primaryCompatibilityArea:
      "test-renderer-cjs-unmount-identity-public-native-package-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-754-progress",
      "worker-754-cjs-dev-gate",
      "worker-754-conformance"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker755], {
    privateAdmission: "accepted-private-react-dom-nested-host-output",
    primaryCompatibilityArea:
      "react-dom-nested-root-render-public-root-hydration-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-755-progress",
      "worker-755-root-bridge",
      "worker-755-e2e-conformance"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker756], {
    privateAdmission: "accepted-private-react-dom-act-passive-recognition",
    primaryCompatibilityArea:
      "react-dom-test-utils-act-passive-private-recognition-public-act-root-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRoles: [
      "worker-756-progress",
      "worker-756-conformance-gate",
      "worker-756-public-facade-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker757], {
    privateAdmission:
      "accepted-private-test-renderer-package-root-unmount-identity",
    primaryCompatibilityArea:
      "test-renderer-package-root-unmount-identity-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-757-progress",
      "worker-757-index-gate",
      "worker-757-create-routing-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker758], {
    privateAdmission: "accepted-private-react-act-scheduler-yield-consumer",
    primaryCompatibilityArea:
      "react-act-scheduler-yield-private-consumer-public-act-scheduler-root-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-758-progress",
      "worker-758-react-gate",
      "worker-758-react-act-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker759], {
    privateAdmission: "accepted-private-ledger-evidence",
    primaryCompatibilityArea:
      "private-admission-static-ledger-746-753-public-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    evidenceRoles: [
      "worker-759-progress",
      "worker-759-ledger-source",
      "worker-759-ledger-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker760], {
    privateAdmission:
      "accepted-private-test-renderer-native-totree-sibling-identity",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-native-totree-public-native-package-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: ["worker-760-progress", "worker-760-rust-source"]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker761], {
    privateAdmission: "accepted-private-scheduler-deferred-yield-guard",
    primaryCompatibilityArea:
      "scheduler-post-task-deferred-yield-public-timing-root-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRoles: [
      "worker-761-progress",
      "worker-761-root-continuation-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker762], {
    privateAdmission:
      "accepted-private-react-dom-hydrateroot-marker-listener-gate",
    primaryCompatibilityArea:
      "react-dom-hydrateroot-marker-listener-public-hydration-blocked",
    runtimeCapabilityAdded: false,
    promotion: "rejected",
    evidenceRoles: [
      "worker-762-progress",
      "worker-762-root-bridge",
      "worker-762-public-facade-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker763], {
    privateAdmission: "accepted-private-test-renderer-sibling-text-js-cjs",
    primaryCompatibilityArea:
      "test-renderer-sibling-text-js-cjs-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-763-progress",
      "worker-763-cjs-dev",
      "worker-763-serialization-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker764], {
    privateAdmission:
      "accepted-private-native-worker-thread-executable-preflight",
    primaryCompatibilityArea:
      "native-worker-thread-teardown-preflight-public-native-addon-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-764-progress",
      "worker-764-rust-source",
      "worker-764-native-loader-source"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker765], {
    privateAdmission: "accepted-private-scheduler-mock-delayed-root-producer",
    primaryCompatibilityArea:
      "scheduler-mock-delayed-root-producer-public-act-root-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-765-progress",
      "worker-765-scheduler-mock",
      "worker-765-delayed-test"
    ]
  });
  assertPrivateEvidenceRow(gate.rowsByWorker[worker766], {
    privateAdmission:
      "accepted-private-test-renderer-root-finished-lanes-handoff",
    primaryCompatibilityArea:
      "test-renderer-root-finished-lanes-public-serialization-native-blocked",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    evidenceRoles: [
      "worker-766-progress",
      "worker-766-index-source",
      "worker-766-alias-test"
    ]
  });

  for (const evaluatedRow of gate.rows) {
    assertNoPublicOrAdmissionClaims(evaluatedRow);
    assert.equal(evaluatedRow.sourceTokenChecksOnly, true);
    assert.equal(evaluatedRow.manifestEvaluationOnly, true);
    assert.equal(evaluatedRow.runtimeExecutionClaimed, false);
    assert.equal(
      evaluatedRow.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only"
    );
  }
});

test("private admission 754-766 gate pins public package surfaces", () => {
  const gate = evaluatePrivateAdmission754766Gate();
  const { react, reactDom, reactTestRenderer, scheduler, native } =
    gate.packageSurface;

  assert.deepEqual(Object.keys(react.packageExports), [
    ".",
    "./jsx-runtime",
    "./jsx-dev-runtime",
    "./compiler-runtime",
    "./package.json"
  ]);
  assert.equal(react.manifest.main, "./index.js");
  assert.equal(react.manifest.type, "commonjs");
  assert.equal(react.runtimeExportKeys.includes("act"), true);
  assert.equal(
    react.runtimeExportKeys.includes("__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__"),
    false
  );
  assert.deepEqual(react.subpathRuntimeExports["packages/react/jsx-runtime.js"], [
    "Fragment",
    "jsx",
    "jsxs"
  ]);
  assert.deepEqual(
    react.subpathRuntimeExports["packages/react/jsx-dev-runtime.js"],
    ["Fragment", "jsxDEV"]
  );
  assert.deepEqual(
    react.subpathRuntimeExports["packages/react/compiler-runtime.js"],
    ["c"]
  );
  assert.equal(
    react.subpathRuntimeExports[
      "packages/react/react.react-server.js"
    ].includes("act"),
    false
  );

  assert.equal(reactDom.manifest.dependencies.scheduler, "^0.27.0");
  assert.equal(
    Object.keys(reactDom.packageExports).includes("./test-utils"),
    true
  );
  assert.equal(
    Object.keys(reactDom.packageExports).includes("./src/client/root-bridge"),
    false
  );
  assert.deepEqual(
    reactDom.subpathRuntimeExports["packages/react-dom/client.js"],
    ["createRoot", "hydrateRoot", "version"]
  );
  assert.deepEqual(
    reactDom.subpathRuntimeExports["packages/react-dom/test-utils.js"],
    ["act"]
  );
  assert.deepEqual(
    reactDom.subpathRuntimeExports["packages/react-dom/profiling.js"],
    [
      "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
      "createPortal",
      "createRoot",
      "flushSync",
      "hydrateRoot",
      "preconnect",
      "prefetchDNS",
      "preinit",
      "preinitModule",
      "preload",
      "preloadModule",
      "requestFormReset",
      "unstable_batchedUpdates",
      "useFormState",
      "useFormStatus",
      "version"
    ]
  );
  assert.deepEqual(
    reactDom.subpathRuntimeExports["packages/react-dom/server.node.js"],
    [
      "renderToPipeableStream",
      "renderToReadableStream",
      "renderToStaticMarkup",
      "renderToString",
      "resume",
      "resumeToPipeableStream",
      "version"
    ]
  );
  assert.deepEqual(
    reactDom.subpathRuntimeExports["packages/react-dom/static.edge.js"],
    ["prerender", "resumeAndPrerender", "version"]
  );
  assert.equal(
    reactDom.runtimeThrowSubpaths[
      "packages/react-dom/client.react-server.js"
    ].errorCode,
    "FAST_REACT_REACT_SERVER_UNSUPPORTED"
  );

  assert.equal(reactTestRenderer.manifest.main, "index.js");
  assert.equal(reactTestRenderer.packageExports, null);
  assert.deepEqual(reactTestRenderer.runtimeExportKeys, [
    "_Scheduler",
    "act",
    "create",
    "unstable_batchedUpdates",
    "version"
  ]);
  assert.equal(
    reactTestRenderer.runtimeExportKeys.includes(
      "createAcceptedSiblingTextDiagnosticResult"
    ),
    false
  );

  assert.equal(scheduler.manifest.license, "MIT");
  assert.equal(scheduler.packageExports, null);
  assert.equal(
    scheduler.runtimeExportKeys.includes(
      "createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics"
    ),
    false
  );
  assert.equal(
    scheduler.subpathRuntimeExports[
      "packages/scheduler/unstable_mock.js"
    ].includes("unstable_flushExpired"),
    true
  );

  assert.equal(native.manifest.type, "module");
  assert.deepEqual(Object.keys(native.packageExports), [".", "./package.json"]);
  assert.equal(native.runtimeExportKeys.includes("loadNativeBinding"), true);
  assert.equal(native.runtimeExportKeys.includes("nativeExecution"), false);
  assert.equal(native.esmRuntimePath, "bindings/node/index.mjs");
  assert.equal(native.esmRuntimeExportKeys.includes("default"), true);
  assert.equal(native.esmRuntimeExportKeys.includes("loadNativeBinding"), true);
  assert.equal(native.esmRuntimeExportKeys.includes("nativeExecution"), false);
});

test("private admission 754-766 gate rejects public compatibility promotion", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    rowOverrides: {
      [worker758]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicReactActSchedulerYieldCompatibilityClaimed: true,
          publicSchedulerDeferredYieldCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          reactActSchedulerYieldPublicAdmissionClaimed: true,
          schedulerDeferredYieldPublicAdmissionClaimed: true
        }
      },
      [worker762]: {
        publicCompatibilityClaims: {
          publicReactDomHydrateRootMarkerListenerCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          reactDomHydrateRootMarkerListenerAdmissionClaimed: true
        }
      },
      [worker766]: {
        publicCompatibilityClaims: {
          publicTestRendererRootFinishedLanesHandoffCompatibilityClaimed: true,
          publicPackageExportsCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          testRendererRootFinishedLanesHandoffPublicAdmissionClaimed: true,
          publicPackageExportsAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected",
    "private-diagnostic-public-promotion-leak"
  ]);
  assertSubset(
    [
      `${worker758}.publicReactActSchedulerYieldCompatibilityClaimed`,
      `${worker762}.publicReactDomHydrateRootMarkerListenerCompatibilityClaimed`,
      `${worker766}.publicTestRendererRootFinishedLanesHandoffCompatibilityClaimed`
    ],
    gate.publicCompatibilityViolationIds
  );
  assertSubset(
    [
      `${worker758}.reactActSchedulerYieldPublicAdmissionClaimed`,
      `${worker762}.reactDomHydrateRootMarkerListenerAdmissionClaimed`,
      `${worker766}.publicPackageExportsAdmissionClaimed`
    ],
    gate.blockedAdmissionClaimViolationIds
  );
});

test("private admission 754-766 gate rejects unknown false blocked admission claim keys", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    rowOverrides: {
      [worker766]: {
        blockedAdmissionClaims: {
          unknownBlockedAdmissionClaim: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assertViolationIds(gate, ["blocked-admission-claim-mismatch"]);
});

test("private admission 754-766 gate rejects stale alias and clone guard removal", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    rowOverrides: {
      [worker758]: {
        requiredGuards: {
          staleEvidenceRejected: false,
          clonedEvidenceRejected: false
        }
      },
      [worker765]: {
        requiredGuards: {
          clonedEvidenceRejected: false
        }
      },
      [worker766]: {
        requiredGuards: {
          aliasEvidenceRejected: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.requiredGuardsRecognized, false);
  assertViolationIds(gate, ["accepted-private-required-guard-mismatch"]);
});

test("private admission 754-766 gate rejects public package surface changes", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    expectedPackageSurface: {
      ...evaluatePrivateAdmission754766Gate().packageSurface,
      reactDom: {
        ...evaluatePrivateAdmission754766Gate().packageSurface.reactDom,
        packageExports: {
          ...evaluatePrivateAdmission754766Gate().packageSurface.reactDom
            .packageExports,
          "./src/client/root-bridge": "./src/client/root-bridge.js"
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.packageSurfaceRecognized, false);
  assertViolationIds(gate, ["public-package-surface-mismatch"]);
});

test("private admission 754-766 gate rejects public subpath and native ESM drift", () => {
  const baseSurface = evaluatePrivateAdmission754766Gate().packageSurface;
  const gate = evaluatePrivateAdmission754766Gate({
    expectedPackageSurface: {
      ...baseSurface,
      react: {
        ...baseSurface.react,
        subpathRuntimeExports: {
          ...baseSurface.react.subpathRuntimeExports,
          "packages/react/jsx-runtime.js": [
            ...baseSurface.react.subpathRuntimeExports[
              "packages/react/jsx-runtime.js"
            ],
            "__FAST_REACT_PRIVATE_JSX_DIAGNOSTIC__"
          ]
        }
      },
      reactDom: {
        ...baseSurface.reactDom,
        subpathRuntimeExports: {
          ...baseSurface.reactDom.subpathRuntimeExports,
          "packages/react-dom/profiling.js": [
            ...baseSurface.reactDom.subpathRuntimeExports[
              "packages/react-dom/profiling.js"
            ],
            "__FAST_REACT_PRIVATE_ROOT_BRIDGE__"
          ]
        }
      },
      native: {
        ...baseSurface.native,
        esmRuntimeExportKeys: [
          ...baseSurface.native.esmRuntimeExportKeys,
          "nativeExecution"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.packageSurfaceRecognized, false);
  assertViolationIds(gate, ["public-package-surface-mismatch"]);
});

test("private admission 754-766 gate rejects public manifest drift", () => {
  const baseSurface = evaluatePrivateAdmission754766Gate().packageSurface;
  const gate = evaluatePrivateAdmission754766Gate({
    expectedPackageSurface: {
      ...baseSurface,
      react: {
        ...baseSurface.react,
        manifest: {
          ...baseSurface.react.manifest,
          main: "./private-act-dispatcher-gate.js"
        }
      },
      native: {
        ...baseSurface.native,
        manifest: {
          ...baseSurface.native.manifest,
          type: "commonjs"
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.packageSurfaceRecognized, false);
  assertViolationIds(gate, ["public-package-surface-mismatch"]);
});

test("private admission 754-766 gate rejects unknown private admission kinds", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    rowOverrides: {
      [worker754]: {
        privateAdmission: "accepted-private-unregistered-worker-754-kind"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.rowAdmissionRecognized, false);
  assert.equal(gate.rowsByWorker[worker754].recognized, false);
  assert.equal(gate.recognizedWorkerIds.includes(worker754), false);
  assertViolationIds(gate, ["required-private-admission-row-not-recognized"]);
});

test("private admission 754-766 gate rejects runtime execution claims in the static ledger", () => {
  const gate = evaluatePrivateAdmission754766Gate({
    rowOverrides: {
      [worker759]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        ledgerEvaluationMode: "runtime-execution"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_754_766_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assertViolationIds(gate, ["private-ledger-runtime-execution-claim"]);
});

function assertPrivateEvidenceRow(
  row,
  {
    privateAdmission,
    primaryCompatibilityArea,
    runtimeCapabilityAdded,
    promotion,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "754-766");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, runtimeCapabilityAdded);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, promotion);
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(
    row.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_754_766_REQUIRED_ACCEPTED_DIAGNOSTICS[row.workerId]
  );
  assert.deepEqual(
    row.priorLedgerContext,
    PRIVATE_ADMISSION_754_766_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId]
  );
  assert.deepEqual(
    row.requiredGuards,
    PRIVATE_ADMISSION_754_766_REQUIRED_GUARDS[row.workerId]
  );
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_754_766_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_754_766_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.publicCompatibilityClaims),
    Object.values(row.publicCompatibilityClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(
    row.blockedPublicClaims,
    Object.keys(row.publicCompatibilityClaims),
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.blockedAdmissionClaims).sort(),
    [...PRIVATE_ADMISSION_754_766_BLOCKED_ADMISSION_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.blockedAdmissionClaims),
    Object.values(row.blockedAdmissionClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
  assert.deepEqual(row.blockedAdmissionClaimViolations, [], row.workerId);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}
