import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_727_728_GATE_ID =
  "private-admission-727-728-local-gate-1";
export const PRIVATE_ADMISSION_727_728_GATE_STATUS =
  "recognized-accepted-private-diagnostics-727-728-public-compatibility-blocked";
export const PRIVATE_ADMISSION_727_728_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-727-728-with-violations";

export const PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicTestRendererCompatibilityClaimed",
    "publicTestRendererSerializationCompatibilityClaimed",
    "publicTestRendererToJSONCompatibilityClaimed",
    "publicTestRendererToTreeCompatibilityClaimed",
    "publicTestRendererRootCompatibilityClaimed",
    "publicTestRendererUpdateCompatibilityClaimed",
    "publicTestRendererTestInstanceCompatibilityClaimed",
    "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
    "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
    "publicTestRendererNativeBridgeCompatibilityClaimed",
    "publicTestRendererNativeBridgeExecutionClaimed",
    "publicActCompatibilityClaimed",
    "publicTestRendererRootRoutingCompatibilityClaimed",
    "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
    "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
    "publicTestRendererUnmountIdentityAdmissionClaimed",
    "publicTestRendererMultichildSerializationCompatibilityClaimed",
    "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
    "publicTestRendererMultichildIdentityAdmissionClaimed",
    "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
    "publicReactDomCompatibilityClaimed",
    "publicReactDomRootCompatibilityClaimed",
    "publicSchedulerCompatibilityClaimed",
    "publicHydrationCompatibilityClaimed",
    "publicEventCompatibilityClaimed",
    "publicRefCompatibilityClaimed",
    "publicResourceCompatibilityClaimed",
    "publicFormCompatibilityClaimed",
    "publicControlledInputCompatibilityClaimed"
  ]);

export const PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES = Object.freeze([
  "test-renderer",
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-testinstance",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "test-renderer-root-routing",
  "test-renderer-update-native-serialization",
  "test-renderer-unmount-native-serialization",
  "test-renderer-unmount-identity-admission",
  "test-renderer-multichild-serialization",
  "test-renderer-multichild-sibling-serialization",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "react-dom",
  "react-dom-root",
  "scheduler",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs"
]);

export const PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS = Object.freeze([
  "worker-727-package-private-admission-audit-724-726"
]);

export const PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "test-renderer-unmount-native-identity-argument-guard",
        "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
      ])
  });

export const PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES = freezeRecord({
  "worker-728-test-renderer-unmount-native-identity-argument-guard":
    freezeArray([
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution",
      "worker-639-test-renderer-tojson-after-native-execution",
      "worker-667-test-renderer-totree-native-execution"
    ])
});

export const PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
        "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
        "test-renderer-tojson-native-execution-evidence",
        "test-renderer-totree-native-execution"
      ])
  });

export const PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT = freezeRecord({
  "worker-728-test-renderer-unmount-native-identity-argument-guard":
    freezeArray([
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ])
});

export const PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    "worker-728-test-renderer-unmount-native-identity-argument-guard":
      freezeArray([
        "test-renderer-update-serialization-finished-work-identity",
        "test-renderer-update-native-serialization-identity-admission"
      ])
  });

export const PRIVATE_ADMISSION_727_728_REQUIRED_EVIDENCE_ROLES = freezeRecord({
  "worker-728-test-renderer-unmount-native-identity-argument-guard":
    freezeArray([
      "worker-612-unmount-route-admission-dependency",
      "worker-638-unmount-cleanup-handoff-dependency",
      "worker-639-tojson-unmount-empty-host-output-dependency",
      "worker-667-totree-unmount-native-output-dependency",
      "worker-725-update-identity-blocker-context",
      "worker-726-update-native-identity-blocker-context",
      "worker-728-unmount-identity-argument-guard-report"
    ])
});

export const PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_WORKERS =
  freezeArray([
    "worker-730-test-renderer-unmount-native-cleanup-evidence",
    "worker-733-test-renderer-unmount-finished-work-identity",
    "worker-754-js-cjs-unmount-finished-work-identity",
    "worker-757-react-test-renderer-index-unmount-identity"
  ]);

export const PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_DIAGNOSTICS =
  freezeArray([
    "test-renderer-unmount-native-ref-passive-cleanup-evidence",
    "test-renderer-unmount-finished-work-identity-admission",
    "private-unmount-tojson-native-finished-work-identity-validation",
    "private-unmount-totree-native-finished-work-identity-validation",
    "test-renderer-cjs-unmount-finished-work-identity",
    "test-renderer-package-root-unmount-finished-work-identity"
  ]);

export const PRIVATE_ADMISSION_727_728_REQUIRED_CURRENT_UNMOUNT_IDENTITY_EVIDENCE_ROLES =
  freezeArray([
    "current-worker-730-unmount-ref-passive-cleanup-dependency",
    "current-worker-733-unmount-finished-work-identity-report",
    "current-worker-733-unmount-finished-work-identity-rust-proof",
    "current-worker-754-cjs-unmount-finished-work-identity-report",
    "current-worker-754-cjs-development-tojson-unmount-identity-source",
    "current-worker-754-cjs-development-totree-unmount-identity-source",
    "current-worker-754-cjs-production-tojson-unmount-identity-source",
    "current-worker-754-cjs-production-totree-unmount-identity-source",
    "current-worker-757-package-root-unmount-identity-report",
    "current-worker-757-package-root-tojson-unmount-identity-source",
    "current-worker-757-package-root-totree-unmount-identity-source"
  ]);

const privateAdmission727728SkippedRowData = Object.freeze([
  skippedRowData({
    workerId: "worker-727-package-private-admission-audit-724-726",
    area: "previous private-admission ledger audit for Workers 724-726",
    skipReason: "ledger-audit-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-727-skip-meta-report",
        path: "worker-progress/worker-727-package-private-admission-audit-724-726.md",
        tokens: [
          "# Worker 727: Package Private Admission Audit 724-726",
          "Classified Worker 724 as `skipped-meta` ledger work",
          "No runtime/product code"
        ]
      })
    ]
  })
]);

const unmountIdentitySourceAssertions = freezeArray([
  jsBooleanPropertyAssertion(
    "privateUnmountFinishedWorkIdentityGateAvailable",
    true
  ),
  jsStringPropertyAssertion(
    "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker",
    "worker-733-test-renderer-unmount-finished-work-identity"
  ),
  jsBooleanPropertyAssertion(
    "unmountNativeExecutionRequiresFinishedWorkIdentity",
    true
  ),
  jsBooleanPropertyAssertion("rejectsStaleUnmountFinishedWorkIdentity", true),
  jsBooleanPropertyAssertion("requiresUnmountDeletionCleanupHandoffEvidence", true),
  jsBooleanPropertyAssertion(
    "consumesCommittedHostRootFinishedWorkIdentity",
    true
  ),
  jsBooleanPropertyAssertion("consumesCommittedHostRootFinishedWorkLanes", true),
  jsBooleanPropertyAssertion("publicRouteAvailable", false),
  jsBooleanPropertyAssertion("nativeBridgeAvailable", false),
  jsBooleanPropertyAssertion("nativeExecution", false),
  jsBooleanPropertyAssertion("compatibilityClaimed", false)
]);

const packageRootUnmountIdentitySourceAssertions = freezeArray([
  ...unmountIdentitySourceAssertions,
  jsStringPropertyAssertion(
    "acceptedUnmountFinishedWorkIdentityWorker",
    "worker-733-test-renderer-unmount-finished-work-identity"
  ),
  jsBooleanPropertyAssertion("validatesUnmountRootRequestIdentity", true),
  jsBooleanPropertyAssertion(
    "validatesUnmountDeletionAndCleanupHandoffIdentity",
    true
  )
]);

const toJSONUnmountIdentitySourceAssertions = freezeArray([
  ...unmountIdentitySourceAssertions,
  jsBooleanPropertyAssertion("publicSerializationAvailable", false)
]);

const toTreeUnmountIdentitySourceAssertions = freezeArray([
  ...unmountIdentitySourceAssertions,
  jsBooleanPropertyAssertion("publicTreeAvailable", false)
]);

const packageRootToJSONUnmountIdentitySourceAssertions = freezeArray([
  ...packageRootUnmountIdentitySourceAssertions,
  jsBooleanPropertyAssertion("publicSerializationAvailable", false)
]);

const packageRootToTreeUnmountIdentitySourceAssertions = freezeArray([
  ...packageRootUnmountIdentitySourceAssertions,
  jsBooleanPropertyAssertion("publicTreeAvailable", false)
]);

const privateAdmission727728RowData = Object.freeze([
  rowData({
    workerId: "worker-728-test-renderer-unmount-native-identity-argument-guard",
    area: "react-test-renderer historical unmount native identity argument guard diagnostics",
    primaryCompatibilityArea:
      "test-renderer-unmount-native-identity-argument-guard",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-native-identity-argument-guard",
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
    ],
    dependencyWorkerIds: [
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution",
      "worker-639-test-renderer-tojson-after-native-execution",
      "worker-667-test-renderer-totree-native-execution"
    ],
    dependencyDiagnosticIds: [
      "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
      "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
      "test-renderer-tojson-native-execution-evidence",
      "test-renderer-totree-native-execution"
    ],
    blockerContextWorkerIds: [
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ],
    blockerContextDiagnosticIds: [
      "test-renderer-update-serialization-finished-work-identity",
      "test-renderer-update-native-serialization-identity-admission"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-612-unmount-route-admission-dependency",
        path: "worker-progress/worker-612-test-renderer-unmount-native-bridge-admission.md",
        tokens: [
          "# Worker 612: Test Renderer Unmount Native Bridge Admission",
          "accepted unmount route outcome plus deletion commit handoff evidence",
          "public unmount compatibility",
          "native bridge availability"
        ]
      }),
      evidenceData({
        role: "worker-638-unmount-cleanup-handoff-dependency",
        path: "worker-progress/worker-638-test-renderer-unmount-native-execution.md",
        tokens: [
          "# Worker 638: Test Renderer Unmount Native Execution",
          "TestRendererUnmountNativeBridgeCleanupHandoff",
          "execute_private_unmount_native_bridge_cleanup_handoff_for_canary",
          "Kept public unmount compatibility"
        ]
      }),
      evidenceData({
        role: "worker-639-tojson-unmount-empty-host-output-dependency",
        path: "worker-progress/worker-639-test-renderer-tojson-after-native-execution.md",
        tokens: [
          "# Worker 639: Test Renderer toJSON After Native Execution",
          "create, update, and unmount",
          "minimal private `toJSON` output evidence",
          "Public serialization"
        ]
      }),
      evidenceData({
        role: "worker-667-totree-unmount-native-output-dependency",
        path: "worker-progress/worker-667-test-renderer-totree-native-execution.md",
        tokens: [
          "# Worker 667: Test Renderer toTree Native Execution",
          "native create/update/unmount execution records",
          "public `toTree()` compatibility stays blocked"
        ]
      }),
      evidenceData({
        role: "worker-725-update-identity-blocker-context",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Kept update, unmount, multichild, and native execution admission unchanged.",
          "This is private evidence only."
        ]
      }),
      evidenceData({
        role: "worker-726-update-native-identity-blocker-context",
        path: "worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md",
        tokens: [
          "# Worker 726 - test renderer update native serialization identity admission",
          "Kept unmount identity admission out of scope",
          "Unmount and broader multichild/sibling identity admission remain intentionally"
        ]
      }),
      evidenceData({
        role: "worker-728-unmount-identity-argument-guard-report",
        path: "worker-progress/worker-728-test-renderer-unmount-native-identity-argument-guard.md",
        tokens: [
          "# Worker 728: Test Renderer Unmount Native Identity Argument Guard",
          "rejects any non-`undefined` `finishedWorkIdentityEvidence` argument",
          "finishedWorkIdentity: null",
          "consumesAcceptedFinishedWorkIdentityGate: false",
          "Did not add a Rust unmount identity adapter."
        ]
      })
    ]
  })
]);

const privateAdmission727728CurrentUnmountIdentityEvidenceData = Object.freeze([
  evidenceData({
    role: "current-worker-730-unmount-ref-passive-cleanup-dependency",
    path: "worker-progress/worker-730-test-renderer-unmount-native-cleanup-evidence.md",
    tokens: [
      "# Worker 730 - Test Renderer Unmount Native Cleanup Evidence",
      "unmount native cleanup evidence with nonzero deleted ref cleanup and deleted",
      "`ref_cleanup_return_count == 1`, `passive_destroy_count == 1`,",
      "finished-work identity for unmount. This worker did not add or consume that"
    ]
  }),
  evidenceData({
    role: "current-worker-733-unmount-finished-work-identity-report",
    path: "worker-progress/worker-733-test-renderer-unmount-finished-work-identity.md",
    tokens: [
      "# Worker 733 Progress",
      "Added dedicated unmount finished-work identity gates for private `toJSON` and `toTree` diagnostics",
      "deletion/cleanup handoff validation",
      "reject stale `cleanup_handoff_id` values",
      "Public, native, JS, and package compatibility remain blocked by diagnostics flags"
    ]
  }),
  evidenceData({
    role: "current-worker-733-unmount-finished-work-identity-rust-proof",
    path: "crates/fast-react-test-renderer/src/lib.rs",
    sliceStart:
      "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
    sliceEnd:
      "fn root_private_to_json_nested_host_output_update_row_records_nested_text_rows()",
    tokens: [
      "fn root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate()",
      "fn root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate()",
      "reason: \"finished-work-identity-missing\"",
      "reason: \"unmount-admission-finished-work-identity-mismatch\"",
      "reason: \"finished-work-identity-source-report-mismatch\"",
      "reason: \"public-or-native-compatibility-claim\""
    ]
  }),
  evidenceData({
    role: "current-worker-754-cjs-unmount-finished-work-identity-report",
    path: "worker-progress/worker-754-js-cjs-unmount-finished-work-identity.md",
    tokens: [
      "# Worker 754 - JS/CJS unmount finished-work identity",
      "Replaced the old JS/CJS hidden-facade behavior that rejected unmount finished-work identity evidence with strict private admission",
      "unmount without identity fails, strict identity succeeds",
      "public/native compatibility claims remain rejected"
    ]
  }),
  evidenceData({
    role: "current-worker-754-cjs-development-tojson-unmount-identity-source",
    path: "packages/react-test-renderer/cjs/react-test-renderer.development.js",
    sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
    sliceEnd: "const privateGetInstanceDiagnosticsSymbol = Symbol.for(",
    tokens: [
      "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
      "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: toJSONUnmountIdentitySourceAssertions
  }),
  evidenceData({
    role: "current-worker-754-cjs-development-totree-unmount-identity-source",
    path: "packages/react-test-renderer/cjs/react-test-renderer.development.js",
    sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
    sliceEnd: "const privateTestInstanceWrapperRecordSymbol = Symbol.for(",
    tokens: [
      "const toTreePrivateFacadeGate = Object.freeze({",
      "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: toTreeUnmountIdentitySourceAssertions
  }),
  evidenceData({
    role: "current-worker-754-cjs-production-tojson-unmount-identity-source",
    path: "packages/react-test-renderer/cjs/react-test-renderer.production.js",
    sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
    sliceEnd: "const privateGetInstanceDiagnosticsSymbol = Symbol.for(",
    tokens: [
      "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
      "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: toJSONUnmountIdentitySourceAssertions
  }),
  evidenceData({
    role: "current-worker-754-cjs-production-totree-unmount-identity-source",
    path: "packages/react-test-renderer/cjs/react-test-renderer.production.js",
    sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
    sliceEnd: "const privateTestInstanceWrapperRecordSymbol = Symbol.for(",
    tokens: [
      "const toTreePrivateFacadeGate = Object.freeze({",
      "unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: toTreeUnmountIdentitySourceAssertions
  }),
  evidenceData({
    role: "current-worker-757-package-root-unmount-identity-report",
    path: "worker-progress/worker-757-react-test-renderer-index-unmount-identity.md",
    tokens: [
      "# Worker 757 Progress",
      "Added package-root private unmount finished-work identity admission",
      "rejects omitted deletion/cleanup handoff\n  evidence",
      "Public serialization and tree availability remain false"
    ]
  }),
  evidenceData({
    role: "current-worker-757-package-root-tojson-unmount-identity-source",
    path: "packages/react-test-renderer/index.js",
    sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
    sliceEnd: "const privateToTreeHostOutputMetadataSymbol = Symbol.for(",
    tokens: [
      "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
      "acceptedUnmountFinishedWorkIdentityWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: packageRootToJSONUnmountIdentitySourceAssertions
  }),
  evidenceData({
    role: "current-worker-757-package-root-totree-unmount-identity-source",
    path: "packages/react-test-renderer/index.js",
    sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
    sliceEnd: "const privateTestInstanceWrapperRecordSymbol = Symbol.for(",
    tokens: [
      "const toTreePrivateFacadeGate = Object.freeze({",
      "acceptedUnmountFinishedWorkIdentityWorker:\n    'worker-733-test-renderer-unmount-finished-work-identity'"
    ],
    sourceAssertions: packageRootToTreeUnmountIdentitySourceAssertions
  })
]);

export const PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE =
  freezeArray(privateAdmission727728CurrentUnmountIdentityEvidenceData);

function rowData(data) {
  return freezeRecord({
    ...data,
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(data.dependencyWorkerIds ?? []),
    dependencyDiagnosticIds: freezeArray(data.dependencyDiagnosticIds ?? []),
    blockerContextWorkerIds: freezeArray(data.blockerContextWorkerIds ?? []),
    blockerContextDiagnosticIds: freezeArray(
      data.blockerContextDiagnosticIds ?? []
    ),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function skippedRowData(data) {
  return freezeRecord({
    ...data,
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({
  role,
  path,
  tokens,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null,
  sourceAssertions = []
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd,
    sourceAssertions: freezeArray(sourceAssertions)
  });
}

function jsBooleanPropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-boolean-property",
    property,
    value
  });
}

function jsStringPropertyAssertion(property, value) {
  return freezeRecord({
    kind: "js-string-property",
    property,
    value
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  area,
  primaryCompatibilityArea,
  acceptedDiagnosticIds,
  dependencyWorkerIds,
  dependencyDiagnosticIds,
  blockerContextWorkerIds,
  blockerContextDiagnosticIds,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "727-728",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-727-728-local-gate",
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    dependencyWorkerIds: freezeArray(dependencyWorkerIds),
    dependencyDiagnosticIds: freezeArray(dependencyDiagnosticIds),
    blockerContextWorkerIds: freezeArray(blockerContextWorkerIds),
    blockerContextDiagnosticIds: freezeArray(blockerContextDiagnosticIds),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: true,
    compatibilityClaimed: false,
    promotion: "rejected",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

function skippedRow({
  workerId,
  area,
  skipReason,
  evidence: evidenceRows,
  publicCompatibilityClaims
}) {
  return freezeRecord({
    workerId,
    area,
    skipReason,
    sourceQueue: "727-728",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-727-728-local-gate",
    acceptedDiagnosticIds: freezeArray([]),
    dependencyWorkerIds: freezeArray([]),
    dependencyDiagnosticIds: freezeArray([]),
    blockerContextWorkerIds: freezeArray([]),
    blockerContextDiagnosticIds: freezeArray([]),
    evidence: freezeArray(evidenceRows),
    runtimeCapabilityAdded: false,
    compatibilityClaimed: false,
    promotion: "not-applicable",
    privateEvidenceOnly: true,
    blockedPublicCompatibilitySurfaces:
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims))
  });
}

export const PRIVATE_ADMISSION_727_728_SKIPPED_ROWS = freezeArray(
  privateAdmission727728SkippedRowData.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_727_728_ROWS = freezeArray(
  privateAdmission727728RowData.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      primaryCompatibilityArea: sourceRow.primaryCompatibilityArea,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      dependencyWorkerIds: sourceRow.dependencyWorkerIds,
      dependencyDiagnosticIds: sourceRow.dependencyDiagnosticIds,
      blockerContextWorkerIds: sourceRow.blockerContextWorkerIds,
      blockerContextDiagnosticIds: sourceRow.blockerContextDiagnosticIds,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_727_728_WORKERS = freezeArray(
  PRIVATE_ADMISSION_727_728_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission727728Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_727_728_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const skippedRows = PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.map((baseRow) => {
    const override = skippedRowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedSkippedRows = skippedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedCurrentUnmountIdentityEvidence =
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE.map(
      (evidenceRow) =>
        evaluateEvidenceRow({
          evidenceRow,
          fileCache,
          workspaceRoot
        })
    );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const skippedManifestWorkerIds = skippedRows.map(
    (baseRow) => baseRow.workerId
  );
  const missingWorkerIds = PRIVATE_ADMISSION_727_728_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_727_728_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const missingSkippedWorkerIds =
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS.filter(
      (workerId) => !skippedManifestWorkerIds.includes(workerId)
    );
  const unexpectedSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS.includes(workerId)
  );
  const duplicateSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId, index) => skippedManifestWorkerIds.indexOf(workerId) !== index
  );
  const unrecognizedWorkerIds = evaluatedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const unrecognizedSkippedWorkerIds = evaluatedSkippedRows
    .filter((evaluatedRow) => evaluatedRow.recognized !== true)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const unrecognizedCurrentUnmountIdentityEvidenceRoles =
    evaluatedCurrentUnmountIdentityEvidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) => evidenceRow.role);
  const currentUnmountIdentityEvidenceRecognized =
    unrecognizedCurrentUnmountIdentityEvidenceRoles.length === 0;
  const evaluatedAllRows = [...evaluatedRows, ...evaluatedSkippedRows];
  const compatibilityClaimWorkerIds = evaluatedAllRows
    .filter((evaluatedRow) => evaluatedRow.compatibilityClaimed !== false)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const publicCompatibilityViolations = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.publicCompatibilityViolations.map((claimId) =>
        `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const blockedSurfaceMismatches = evaluatedAllRows.flatMap((evaluatedRow) => {
    const actualBlockedSurfaces =
      evaluatedRow.blockedPublicCompatibilitySurfaces ?? [];

    if (
      sameStringSet(
        PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
        actualBlockedSurfaces
      ) === true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
        actualBlockedPublicCompatibilitySurfaces: freezeArray(
          actualBlockedSurfaces
        )
      })
    ];
  });
  const blockedPublicClaimMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualBlockedPublicClaims = evaluatedRow.blockedPublicClaims ?? [];

      if (
        sameStringSet(
          PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: freezeArray(actualBlockedPublicClaims)
        })
      ];
    }
  );
  const skippedRuntimeCapabilityWorkerIds = evaluatedSkippedRows
    .filter(
      (evaluatedRow) =>
        evaluatedRow.privateAdmission !== "skipped-meta" ||
        evaluatedRow.runtimeCapabilityAdded !== false ||
        (evaluatedRow.acceptedDiagnosticIds ?? []).length !== 0
    )
    .map((evaluatedRow) => evaluatedRow.workerId);
  const acceptedDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedAcceptedDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualAcceptedDiagnosticIds =
        evaluatedRow.acceptedDiagnosticIds ?? [];

      if (
        evaluatedRow.privateAdmission === "accepted-private-diagnostic" &&
        sameStringSet(
          expectedAcceptedDiagnosticIds,
          actualAcceptedDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedAcceptedDiagnosticIds,
          actualAcceptedDiagnosticIds: freezeArray(actualAcceptedDiagnosticIds)
        })
      ];
    }
  );
  const dependencyMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedDependencyWorkerIds =
      PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES[evaluatedRow.workerId];
    const actualDependencyWorkerIds = evaluatedRow.dependencyWorkerIds ?? [];

    if (
      sameStringSet(expectedDependencyWorkerIds, actualDependencyWorkerIds) ===
      true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedDependencyWorkerIds,
        actualDependencyWorkerIds: freezeArray(actualDependencyWorkerIds)
      })
    ];
  });
  const dependencyDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedDependencyDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualDependencyDiagnosticIds =
        evaluatedRow.dependencyDiagnosticIds ?? [];

      if (
        sameStringSet(
          expectedDependencyDiagnosticIds,
          actualDependencyDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedDependencyDiagnosticIds,
          actualDependencyDiagnosticIds: freezeArray(
            actualDependencyDiagnosticIds
          )
        })
      ];
    }
  );
  const blockerContextMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedBlockerContextWorkerIds =
      PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT[evaluatedRow.workerId];
    const actualBlockerContextWorkerIds =
      evaluatedRow.blockerContextWorkerIds ?? [];

    if (
      sameStringSet(
        expectedBlockerContextWorkerIds,
        actualBlockerContextWorkerIds
      ) === true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedBlockerContextWorkerIds,
        actualBlockerContextWorkerIds: freezeArray(
          actualBlockerContextWorkerIds
        )
      })
    ];
  });
  const blockerContextDiagnosticMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (
        !Object.hasOwn(
          PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedBlockerContextDiagnosticIds =
        PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
          evaluatedRow.workerId
        ];
      const actualBlockerContextDiagnosticIds =
        evaluatedRow.blockerContextDiagnosticIds ?? [];

      if (
        sameStringSet(
          expectedBlockerContextDiagnosticIds,
          actualBlockerContextDiagnosticIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockerContextDiagnosticIds,
          actualBlockerContextDiagnosticIds: freezeArray(
            actualBlockerContextDiagnosticIds
          )
        })
      ];
    }
  );
  const evidenceContractMismatches = evaluatedRows.flatMap((evaluatedRow) => {
    if (
      !Object.hasOwn(
        PRIVATE_ADMISSION_727_728_REQUIRED_EVIDENCE_ROLES,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedEvidenceRoles =
      PRIVATE_ADMISSION_727_728_REQUIRED_EVIDENCE_ROLES[evaluatedRow.workerId];
    const actualEvidenceRoles = evaluatedRow.evidence.map(
      (evidenceRow) => evidenceRow.role
    );
    const missingEvidenceRoles = expectedEvidenceRoles.filter(
      (role) => !actualEvidenceRoles.includes(role)
    );
    const unexpectedEvidenceRoles = actualEvidenceRoles.filter(
      (role) => !expectedEvidenceRoles.includes(role)
    );
    const duplicateEvidenceRoles = actualEvidenceRoles.filter(
      (role, index) => actualEvidenceRoles.indexOf(role) !== index
    );
    const canonicalRow = PRIVATE_ADMISSION_727_728_ROWS.find(
      (row) => row.workerId === evaluatedRow.workerId
    );
    const canonicalEvidenceByRole = new Map(
      (canonicalRow?.evidence ?? []).map((evidenceRow) => [
        evidenceRow.role,
        evidenceRow
      ])
    );
    const evidenceLocationMismatches = evaluatedRow.evidence.flatMap(
      (evidenceRow) => {
        const expectedEvidence = canonicalEvidenceByRole.get(evidenceRow.role);

        if (expectedEvidence === undefined) {
          return [];
        }

        if (evidenceRowsMatchContract(evidenceRow, expectedEvidence)) {
          return [];
        }

        return [
          createEvidenceLocationMismatch(evidenceRow, expectedEvidence)
        ];
      }
    );

    if (
      missingEvidenceRoles.length === 0 &&
      unexpectedEvidenceRoles.length === 0 &&
      duplicateEvidenceRoles.length === 0 &&
      evidenceLocationMismatches.length === 0
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedEvidenceRoles,
        actualEvidenceRoles: freezeArray(actualEvidenceRoles),
        missingEvidenceRoles: freezeArray(missingEvidenceRoles),
        unexpectedEvidenceRoles: freezeArray(unexpectedEvidenceRoles),
        duplicateEvidenceRoles: freezeArray(duplicateEvidenceRoles),
        evidenceLocationMismatches: freezeArray(evidenceLocationMismatches)
      })
    ];
  });
  const currentUnmountIdentityEvidenceContractMismatches = (() => {
    const expectedEvidenceRoles =
      PRIVATE_ADMISSION_727_728_REQUIRED_CURRENT_UNMOUNT_IDENTITY_EVIDENCE_ROLES;
    const actualEvidenceRoles = evaluatedCurrentUnmountIdentityEvidence.map(
      (evidenceRow) => evidenceRow.role
    );
    const missingEvidenceRoles = expectedEvidenceRoles.filter(
      (role) => !actualEvidenceRoles.includes(role)
    );
    const unexpectedEvidenceRoles = actualEvidenceRoles.filter(
      (role) => !expectedEvidenceRoles.includes(role)
    );
    const duplicateEvidenceRoles = actualEvidenceRoles.filter(
      (role, index) => actualEvidenceRoles.indexOf(role) !== index
    );
    const canonicalEvidenceByRole = new Map(
      PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE.map(
        (evidenceRow) => [evidenceRow.role, evidenceRow]
      )
    );
    const evidenceLocationMismatches =
      evaluatedCurrentUnmountIdentityEvidence.flatMap((evidenceRow) => {
        const expectedEvidence = canonicalEvidenceByRole.get(evidenceRow.role);

        if (expectedEvidence === undefined) {
          return [];
        }

        if (evidenceRowsMatchContract(evidenceRow, expectedEvidence)) {
          return [];
        }

        return [
          createEvidenceLocationMismatch(evidenceRow, expectedEvidence)
        ];
      });

    if (
      missingEvidenceRoles.length === 0 &&
      unexpectedEvidenceRoles.length === 0 &&
      duplicateEvidenceRoles.length === 0 &&
      evidenceLocationMismatches.length === 0
    ) {
      return [];
    }

    return [
      freezeRecord({
        expectedEvidenceRoles,
        actualEvidenceRoles: freezeArray(actualEvidenceRoles),
        missingEvidenceRoles: freezeArray(missingEvidenceRoles),
        unexpectedEvidenceRoles: freezeArray(unexpectedEvidenceRoles),
        duplicateEvidenceRoles: freezeArray(duplicateEvidenceRoles),
        evidenceLocationMismatches: freezeArray(evidenceLocationMismatches)
      })
    ];
  })();
  const currentUnmountIdentityEvidenceContractRecognized =
    currentUnmountIdentityEvidenceContractMismatches.length === 0;
  const violations = [];

  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("accepted-private-worker-manifest-mismatch", {
        missingWorkerIds,
        unexpectedWorkerIds,
        duplicateWorkerIds
      })
    );
  }

  if (
    missingSkippedWorkerIds.length > 0 ||
    unexpectedSkippedWorkerIds.length > 0 ||
    duplicateSkippedWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("skipped-meta-worker-manifest-mismatch", {
        missingWorkerIds: missingSkippedWorkerIds,
        unexpectedWorkerIds: unexpectedSkippedWorkerIds,
        duplicateWorkerIds: duplicateSkippedWorkerIds
      })
    );
  }

  if (unrecognizedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-private-diagnostic-not-recognized", {
        workerIds: unrecognizedWorkerIds
      })
    );
  }

  if (unrecognizedSkippedWorkerIds.length > 0) {
    violations.push(
      createViolation("required-skip-meta-row-not-recognized", {
        workerIds: unrecognizedSkippedWorkerIds
      })
    );
  }

  if (skippedRuntimeCapabilityWorkerIds.length > 0) {
    violations.push(
      createViolation("skip-meta-row-claimed-runtime-capability", {
        workerIds: skippedRuntimeCapabilityWorkerIds
      })
    );
  }

  if (acceptedDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-id-mismatch", {
        rows: freezeArray(acceptedDiagnosticMismatches)
      })
    );
  }

  if (dependencyMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-dependency-mismatch", {
        rows: freezeArray(dependencyMismatches)
      })
    );
  }

  if (dependencyDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation(
        "accepted-private-diagnostic-dependency-diagnostic-mismatch",
        {
          rows: freezeArray(dependencyDiagnosticMismatches)
        }
      )
    );
  }

  if (blockerContextMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-blocker-context-mismatch", {
        rows: freezeArray(blockerContextMismatches)
      })
    );
  }

  if (blockerContextDiagnosticMismatches.length > 0) {
    violations.push(
      createViolation(
        "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
        {
          rows: freezeArray(blockerContextDiagnosticMismatches)
        }
      )
    );
  }

  if (evidenceContractMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-diagnostic-evidence-contract-mismatch", {
        rows: freezeArray(evidenceContractMismatches)
      })
    );
  }

  if (unrecognizedCurrentUnmountIdentityEvidenceRoles.length > 0) {
    violations.push(
      createViolation("current-unmount-identity-evidence-not-recognized", {
        roles: freezeArray(unrecognizedCurrentUnmountIdentityEvidenceRoles)
      })
    );
  }

  if (currentUnmountIdentityEvidenceContractMismatches.length > 0) {
    violations.push(
      createViolation("current-unmount-identity-evidence-contract-mismatch", {
        evidence: freezeArray(currentUnmountIdentityEvidenceContractMismatches)
      })
    );
  }

  if (compatibilityClaimWorkerIds.length > 0) {
    violations.push(
      createViolation("private-diagnostic-claimed-compatibility", {
        workerIds: compatibilityClaimWorkerIds
      })
    );
  }

  if (publicCompatibilityViolations.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-detected", {
        claimIds: publicCompatibilityViolations
      })
    );
  }

  if (blockedSurfaceMismatches.length > 0) {
    violations.push(
      createViolation("blocked-public-compatibility-surface-mismatch", {
        rows: freezeArray(blockedSurfaceMismatches)
      })
    );
  }

  if (blockedPublicClaimMismatches.length > 0) {
    violations.push(
      createViolation("blocked-public-claim-mismatch", {
        rows: freezeArray(blockedPublicClaimMismatches)
      })
    );
  }

  return freezeRecord({
    id: PRIVATE_ADMISSION_727_728_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_727_728_GATE_STATUS
        : PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_727_728_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
    currentUnmountIdentityWorkers:
      PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_WORKERS,
    currentUnmountIdentityDiagnostics:
      PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_DIAGNOSTICS,
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
    currentUnmountIdentityEvidence: freezeArray(
      evaluatedCurrentUnmountIdentityEvidence
    ),
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    skippedRowsByWorker: freezeRecord(
      Object.fromEntries(
        evaluatedSkippedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    currentUnmountIdentityEvidenceByRole: freezeRecord(
      Object.fromEntries(
        evaluatedCurrentUnmountIdentityEvidence.map((evidenceRow) => [
          evidenceRow.role,
          evidenceRow
        ])
      )
    ),
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((evaluatedRow) => evaluatedRow.recognized === true)
        .map((evaluatedRow) => evaluatedRow.workerId)
    ),
    recognizedSkippedWorkerIds: freezeArray(
      evaluatedSkippedRows
        .filter((evaluatedRow) => evaluatedRow.recognized === true)
        .map((evaluatedRow) => evaluatedRow.workerId)
    ),
    privateDiagnosticsRecognized:
      unrecognizedWorkerIds.length === 0 &&
      missingWorkerIds.length === 0 &&
      unexpectedWorkerIds.length === 0 &&
      duplicateWorkerIds.length === 0 &&
      acceptedDiagnosticMismatches.length === 0 &&
      dependencyMismatches.length === 0 &&
      dependencyDiagnosticMismatches.length === 0 &&
      blockerContextMismatches.length === 0 &&
      blockerContextDiagnosticMismatches.length === 0 &&
      evidenceContractMismatches.length === 0 &&
      currentUnmountIdentityEvidenceRecognized === true &&
      currentUnmountIdentityEvidenceContractRecognized === true &&
      blockedSurfaceMismatches.length === 0 &&
      blockedPublicClaimMismatches.length === 0,
    skipMetaRecognized:
      unrecognizedSkippedWorkerIds.length === 0 &&
      missingSkippedWorkerIds.length === 0 &&
      unexpectedSkippedWorkerIds.length === 0 &&
      duplicateSkippedWorkerIds.length === 0 &&
      skippedRuntimeCapabilityWorkerIds.length === 0,
    acceptedDiagnosticsRecognized: acceptedDiagnosticMismatches.length === 0,
    dependenciesRecognized:
      dependencyMismatches.length === 0 &&
      dependencyDiagnosticMismatches.length === 0,
    blockerContextRecognized:
      blockerContextMismatches.length === 0 &&
      blockerContextDiagnosticMismatches.length === 0,
    evidenceContractRecognized: evidenceContractMismatches.length === 0,
    currentUnmountIdentityEvidenceRecognized,
    currentUnmountIdentityEvidenceContractRecognized,
    blockedPublicSurfacesRecognized: blockedSurfaceMismatches.length === 0,
    blockedPublicClaimsRecognized: blockedPublicClaimMismatches.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_727_728_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
      expectedSkippedWorkerIds: PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
      actualSkippedWorkerIds: freezeArray(skippedManifestWorkerIds),
      missingSkippedWorkerIds: freezeArray(missingSkippedWorkerIds),
      unexpectedSkippedWorkerIds: freezeArray(unexpectedSkippedWorkerIds),
      duplicateSkippedWorkerIds: freezeArray(duplicateSkippedWorkerIds)
    }),
    violations: freezeArray(violations)
  });
}

function mergeRowOverride(baseRow, override) {
  return freezeRecord({
    ...baseRow,
    ...override,
    publicCompatibilityClaims: freezeRecord({
      ...baseRow.publicCompatibilityClaims,
      ...(override.publicCompatibilityClaims ?? {})
    })
  });
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evaluatedEvidence = (row.evidence ?? []).map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );
  const evidenceRecognized = evaluatedEvidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const publicCompatibilityViolations = Object.entries(
    row.publicCompatibilityClaims ?? {}
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    recognized: evidenceRecognized === true && row.recognized !== false,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations)
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: evidenceRow.path
  });
  const slicedSource =
    source.ok === true
      ? extractEvidenceSourceSlice({
          path: evidenceRow.path,
          text: source.text,
          sliceStart: evidenceRow.sliceStart,
          sliceEnd: evidenceRow.sliceEnd
        })
      : source;
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: slicedSource.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);
  const forbiddenTokens = evidenceRow.forbiddenTokens ?? [];
  const forbiddenTokensPresent =
    slicedSource.ok === true
      ? forbiddenTokens.filter((token) => slicedSource.text.includes(token))
      : [];
  const sourceAssertionEvaluation =
    slicedSource.ok === true
      ? evaluateSourceAssertions({
          text: slicedSource.text,
          sourceAssertions: evidenceRow.sourceAssertions ?? []
        })
      : evaluateSourceAssertionsForUnavailableSource(
          evidenceRow.sourceAssertions ?? []
        );

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    sourceAssertionResults: freezeArray(sourceAssertionEvaluation.results),
    failedSourceAssertions: freezeArray(sourceAssertionEvaluation.failed),
    sourceAssertionError: sourceAssertionEvaluation.error,
    recognized:
      slicedSource.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      sourceAssertionEvaluation.failed.length === 0,
    readError: source.error,
    sliceError: slicedSource.ok === true ? null : slicedSource.error
  });
}

function evidenceRowsMatchContract(evidenceRow, expectedEvidence) {
  return (
    evidenceRow.path === expectedEvidence.path &&
    (evidenceRow.sliceStart ?? null) === (expectedEvidence.sliceStart ?? null) &&
    (evidenceRow.sliceEnd ?? null) === (expectedEvidence.sliceEnd ?? null) &&
    sameStringSet(evidenceRow.tokens ?? [], expectedEvidence.tokens) === true &&
    sameStringSet(
      evidenceRow.forbiddenTokens ?? [],
      expectedEvidence.forbiddenTokens ?? []
    ) === true &&
    sameSourceAssertionSet(
      evidenceRow.sourceAssertions ?? [],
      expectedEvidence.sourceAssertions ?? []
    ) === true
  );
}

function createEvidenceLocationMismatch(evidenceRow, expectedEvidence) {
  return freezeRecord({
    role: evidenceRow.role,
    expectedPath: expectedEvidence.path,
    actualPath: evidenceRow.path,
    expectedSliceStart: expectedEvidence.sliceStart ?? null,
    actualSliceStart: evidenceRow.sliceStart ?? null,
    expectedSliceEnd: expectedEvidence.sliceEnd ?? null,
    actualSliceEnd: evidenceRow.sliceEnd ?? null,
    expectedTokens: expectedEvidence.tokens,
    actualTokens: freezeArray(evidenceRow.tokens ?? []),
    expectedForbiddenTokens: expectedEvidence.forbiddenTokens ?? [],
    actualForbiddenTokens: freezeArray(evidenceRow.forbiddenTokens ?? []),
    expectedSourceAssertions: expectedEvidence.sourceAssertions ?? [],
    actualSourceAssertions: freezeArray(evidenceRow.sourceAssertions ?? [])
  });
}

function evaluateSourceAssertions({ text, sourceAssertions }) {
  if (sourceAssertions.length === 0) {
    return freezeRecord({
      results: freezeArray([]),
      failed: freezeArray([]),
      error: null
    });
  }

  const extractedProperties = extractTopLevelJsObjectProperties(text);
  if (extractedProperties.ok !== true) {
    const results = sourceAssertions.map((assertion) =>
      freezeRecord({
        ...assertion,
        expectedValue: assertion.value,
        actualSource: null,
        actualValue: null,
        passed: false,
        error: extractedProperties.error
      })
    );

    return freezeRecord({
      results: freezeArray(results),
      failed: freezeArray(results),
      error: extractedProperties.error
    });
  }

  const unassertedCompatibilityProperties =
    findUnassertedCompatibilityLookingProperties({
      properties: extractedProperties.properties,
      sourceAssertions
    });
  if (unassertedCompatibilityProperties.length > 0) {
    const error = `unasserted-compatibility-looking-properties:${unassertedCompatibilityProperties.join(
      ","
    )}`;
    const results = sourceAssertions.map((assertion) =>
      freezeRecord({
        ...assertion,
        expectedValue: assertion.value,
        actualSource: null,
        actualValue: null,
        passed: false,
        error
      })
    );

    return freezeRecord({
      results: freezeArray(results),
      failed: freezeArray(results),
      error
    });
  }

  const results = sourceAssertions.map((assertion) =>
    evaluateSourceAssertion({
      assertion,
      properties: extractedProperties.properties
    })
  );

  return freezeRecord({
    results: freezeArray(results),
    failed: freezeArray(
      results.filter((sourceAssertionResult) => {
        return sourceAssertionResult.passed !== true;
      })
    ),
    error: null
  });
}

function findUnassertedCompatibilityLookingProperties({
  properties,
  sourceAssertions
}) {
  const assertedProperties = new Set(
    sourceAssertions.map((assertion) => assertion.property)
  );

  return freezeArray(
    [...properties.keys()].filter(
      (property) =>
        assertedProperties.has(property) !== true &&
        isCompatibilityLookingProperty(property) === true
    )
  );
}

function isCompatibilityLookingProperty(property) {
  return (
    /^(public|native|package|root|toJSON|toJson|toTree|compatibility)/.test(
      property
    ) && /(Compatibility|Compatible|Available|Enabled|Ready|Claimed)/.test(property)
  );
}

function evaluateSourceAssertionsForUnavailableSource(sourceAssertions) {
  const results = sourceAssertions.map((assertion) =>
    freezeRecord({
      ...assertion,
      expectedValue: assertion.value,
      actualSource: null,
      actualValue: null,
      passed: false,
      error: "source-unavailable"
    })
  );

  return freezeRecord({
    results: freezeArray(results),
    failed: freezeArray(results),
    error: sourceAssertions.length === 0 ? null : "source-unavailable"
  });
}

function evaluateSourceAssertion({ assertion, properties }) {
  const actualSource = properties.get(assertion.property);
  if (actualSource === undefined) {
    return freezeRecord({
      ...assertion,
      expectedValue: assertion.value,
      actualSource: null,
      actualValue: null,
      passed: false,
      error: "property-missing"
    });
  }

  if (assertion.kind === "js-boolean-property") {
    const actualValue =
      actualSource === "true" ? true : actualSource === "false" ? false : null;
    return freezeRecord({
      ...assertion,
      expectedValue: assertion.value,
      actualSource,
      actualValue,
      passed: actualSource === String(assertion.value),
      error: actualValue === null ? "not-boolean-literal" : null
    });
  }

  if (assertion.kind === "js-string-property") {
    const actualValue = parseSimpleQuotedJsString(actualSource);
    return freezeRecord({
      ...assertion,
      expectedValue: assertion.value,
      actualSource,
      actualValue: actualValue.ok === true ? actualValue.value : null,
      passed:
        actualValue.ok === true && actualValue.value === assertion.value,
      error: actualValue.ok === true ? null : actualValue.error
    });
  }

  return freezeRecord({
    ...assertion,
    expectedValue: assertion.value,
    actualSource,
    actualValue: null,
    passed: false,
    error: `unknown-source-assertion-kind: ${assertion.kind}`
  });
}

function extractTopLevelJsObjectProperties(text) {
  const codeMask = createJsCodeMask(text);
  const freezeIndex = findJsSourceOutsideCommentsAndStrings(
    text,
    "Object.freeze"
  );
  const openIndex = findNextJsPunctuator(
    text,
    freezeIndex < 0 ? 0 : freezeIndex,
    "{",
    codeMask
  );

  if (openIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-freeze-literal-not-found"
    });
  }

  const closeIndex = findMatchingJsBrace(text, openIndex, codeMask);
  if (closeIndex < 0) {
    return freezeRecord({
      ok: false,
      properties: new Map(),
      error: "object-freeze-literal-not-closed"
    });
  }

  return readJsObjectLiteralProperties({
    text,
    openIndex,
    closeIndex,
    codeMask,
    collectProperties: true
  });
}

function readJsObjectLiteralProperties({
  text,
  openIndex,
  closeIndex,
  codeMask,
  collectProperties
}) {
  const properties = new Map();
  let index = openIndex + 1;
  while (index < closeIndex) {
    index = skipJsTrivia(text, index, closeIndex);

    while (text[index] === "," && index < closeIndex) {
      index = skipJsTrivia(text, index + 1, closeIndex);
    }

    if (index >= closeIndex) {
      break;
    }

    if (text.startsWith("...", index)) {
      return createUnsupportedObjectMemberResult("spread", text, index);
    }

    if (text[index] === "[") {
      return createUnsupportedObjectMemberResult(
        "computed-property",
        text,
        index
      );
    }

    if (text[index] === "*") {
      return createUnsupportedObjectMemberResult("method", text, index);
    }

    const propertyKey = readJsObjectPropertyKey(text, index, closeIndex);
    if (propertyKey.ok !== true) {
      return createUnsupportedObjectMemberResult(
        propertyKey.error,
        text,
        index
      );
    }

    if (isHiddenCompatibilityCarrierProperty(propertyKey.key) === true) {
      return createUnsupportedObjectMemberResult(
        "hidden-claim-carrier",
        text,
        propertyKey.start
      );
    }

    index = skipJsTrivia(text, propertyKey.end, closeIndex);
    if (text[index] !== ":") {
      if (text[index] === "," || index >= closeIndex) {
        properties.set(propertyKey.key, propertyKey.key);
        continue;
      }

      return createUnsupportedObjectMemberResult(
        unsupportedPropertyMemberKind({ propertyKey, text, index }),
        text,
        propertyKey.start
      );
    }

    const valueStart = skipJsTrivia(text, index + 1, closeIndex);
    const valueEnd = findNextTopLevelPropertySeparator(
      text,
      valueStart,
      closeIndex,
      codeMask
    );
    const nestedHiddenCarrierScan = findNestedHiddenCompatibilityCarrier({
      text,
      startIndex: valueStart,
      endIndex: valueEnd,
      codeMask
    });
    if (nestedHiddenCarrierScan.ok !== true) {
      return nestedHiddenCarrierScan;
    }

    if (collectProperties === true) {
      properties.set(propertyKey.key, text.slice(valueStart, valueEnd).trim());
    }
    index = valueEnd < closeIndex ? valueEnd + 1 : closeIndex;
  }

  return freezeRecord({
    ok: true,
    properties,
    error: null
  });
}

function findNestedHiddenCompatibilityCarrier({
  text,
  startIndex,
  endIndex,
  codeMask
}) {
  let index = startIndex;

  while (index < endIndex) {
    if (codeMask[index] !== 1) {
      index += 1;
      continue;
    }

    if (text[index] !== "{") {
      index += 1;
      continue;
    }

    const closeIndex = findMatchingJsBrace(text, index, codeMask);
    if (closeIndex < 0 || closeIndex > endIndex) {
      return createUnsupportedObjectMemberResult(
        "nested-object-literal-not-closed",
        text,
        index
      );
    }

    const nestedProperties = readJsObjectLiteralProperties({
      text,
      openIndex: index,
      closeIndex,
      codeMask,
      collectProperties: false
    });
    if (nestedProperties.ok !== true) {
      return nestedProperties;
    }

    index = closeIndex + 1;
  }

  return freezeRecord({
    ok: true,
    properties: new Map(),
    error: null
  });
}

function isHiddenCompatibilityCarrierProperty(property) {
  return (
    property === "__proto__" ||
    property === "constructor" ||
    property === "prototype"
  );
}

function createUnsupportedObjectMemberResult(kind, text, startIndex) {
  return freezeRecord({
    ok: false,
    properties: new Map(),
    error: `unsupported-object-member:${kind}:${sourcePreview(text, startIndex)}`
  });
}

function unsupportedPropertyMemberKind({ propertyKey, text, index }) {
  if (propertyKey.key === "get" || propertyKey.key === "set") {
    return "accessor";
  }

  if (text[index] === "(") {
    return "method";
  }

  return "shorthand-or-method";
}

function sourcePreview(text, startIndex) {
  return text
    .slice(startIndex, startIndex + 48)
    .replace(/\s+/g, " ")
    .trim();
}

function findNextJsPunctuator(
  text,
  startIndex,
  punctuator,
  codeMask = createJsCodeMask(text)
) {
  let index = startIndex;

  while (index < text.length) {
    if (codeMask[index] === 1 && text[index] === punctuator) {
      return index;
    }

    index += 1;
  }

  return -1;
}

function findJsSourceOutsideCommentsAndStrings(text, needle, fromIndex = 0) {
  const codeMask = createJsCodeMask(text);
  return findJsSourceWithMask({
    text,
    needle,
    fromIndex,
    codeMask,
    startMask: codeMask
  });
}

function findTopLevelJsSourceOutsideCommentsAndStrings(
  text,
  needle,
  fromIndex = 0
) {
  const codeMask = createJsCodeMask(text);
  return findJsSourceWithMask({
    text,
    needle,
    fromIndex,
    codeMask,
    startMask: createJsTopLevelStartMask(text, codeMask)
  });
}

function findJsSourceWithMask({ text, needle, fromIndex, codeMask, startMask }) {
  const lastStartIndex = text.length - needle.length;
  for (
    let index = Math.max(0, fromIndex);
    index <= lastStartIndex;
    index += 1
  ) {
    if (
      startMask[index] === 1 &&
      text.startsWith(needle, index) &&
      sourceRangeIsCode(codeMask, index, index + needle.length)
    ) {
      return index;
    }
  }
  return -1;
}

function findMatchingJsBrace(
  text,
  openIndex,
  codeMask = createJsCodeMask(text)
) {
  let depth = 0;
  let index = openIndex;

  while (index < text.length) {
    if (codeMask[index] !== 1) {
      index += 1;
      continue;
    }

    if (text[index] === "{") {
      depth += 1;
    } else if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }

    index += 1;
  }

  return -1;
}

function findNextTopLevelPropertySeparator(
  text,
  startIndex,
  endIndex,
  codeMask = createJsCodeMask(text)
) {
  let index = startIndex;
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  while (index < endIndex) {
    if (codeMask[index] !== 1) {
      index += 1;
      continue;
    }

    const character = text[index];
    if (character === "{" && bracketDepth === 0 && parenDepth === 0) {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[" && braceDepth === 0 && parenDepth === 0) {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (character === "(" && braceDepth === 0 && bracketDepth === 0) {
      parenDepth += 1;
    } else if (character === ")" && parenDepth > 0) {
      parenDepth -= 1;
    } else if (
      character === "," &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      parenDepth === 0
    ) {
      return index;
    }

    index += 1;
  }

  return endIndex;
}

function skipJsTrivia(text, startIndex, endIndex) {
  let index = startIndex;

  while (index < endIndex) {
    const character = text[index];
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (text.startsWith("//", index)) {
      const lineEnd = text.indexOf("\n", index + 2);
      index = lineEnd < 0 ? endIndex : lineEnd + 1;
      continue;
    }

    if (text.startsWith("/*", index)) {
      const blockEnd = text.indexOf("*/", index + 2);
      index = blockEnd < 0 ? endIndex : blockEnd + 2;
      continue;
    }

    break;
  }

  return index;
}

function readJsObjectPropertyKey(text, startIndex, endIndex) {
  const character = text[startIndex];
  if (character === "'" || character === '"') {
    const parsed = readQuotedJsLiteral(text, startIndex, endIndex);
    return freezeRecord({
      ok: parsed.ok,
      key: parsed.ok === true ? parsed.value : null,
      start: startIndex,
      end: parsed.end,
      error: parsed.error
    });
  }

  if (!/[A-Za-z_$]/.test(character)) {
    return freezeRecord({
      ok: false,
      key: null,
      start: startIndex,
      end: startIndex,
      error: "property-key-not-supported"
    });
  }

  let index = startIndex + 1;
  while (index < endIndex && /[A-Za-z0-9_$]/.test(text[index])) {
    index += 1;
  }

  return freezeRecord({
    ok: true,
    key: text.slice(startIndex, index),
    start: startIndex,
    end: index,
    error: null
  });
}

function parseSimpleQuotedJsString(source) {
  const trimmed = source.trim();
  const parsed = readQuotedJsLiteral(trimmed, 0, trimmed.length);

  if (parsed.ok !== true) {
    return parsed;
  }

  if (parsed.end !== trimmed.length) {
    return freezeRecord({
      ok: false,
      value: null,
      end: parsed.end,
      error: "string-literal-has-trailing-source"
    });
  }

  return parsed;
}

function readQuotedJsLiteral(text, startIndex, endIndex) {
  const quote = text[startIndex];
  if (quote !== "'" && quote !== '"' && quote !== "`") {
    return freezeRecord({
      ok: false,
      value: null,
      end: startIndex,
      error: "not-quoted-string-literal"
    });
  }

  let value = "";
  let index = startIndex + 1;
  while (index < endIndex) {
    const character = text[index];

    if (character === "\\") {
      const escape = readJsStringEscape(text, index, endIndex);
      if (escape.ok !== true) {
        return freezeRecord({
          ok: false,
          value: null,
          end: escape.end,
          error: escape.error
        });
      }

      value += escape.value;
      index = escape.end;
      continue;
    }

    if (character === quote) {
      return freezeRecord({
        ok: true,
        value,
        end: index + 1,
        error: null
      });
    }

    if (quote !== "`" && isJsLineTerminatorAt(text, index) === true) {
      return freezeRecord({
        ok: false,
        value: null,
        end: index,
        error: "unterminated-string-literal"
      });
    }

    value += character;
    index += 1;
  }

  return freezeRecord({
    ok: false,
    value: null,
    end: index,
    error: "unterminated-string-literal"
  });
}

function readJsStringEscape(text, escapeIndex, endIndex) {
  const escapedIndex = escapeIndex + 1;
  if (escapedIndex >= endIndex) {
    return freezeRecord({
      ok: false,
      value: null,
      end: escapeIndex,
      error: "unterminated-string-escape"
    });
  }

  if (isJsLineTerminatorAt(text, escapedIndex) === true) {
    return freezeRecord({
      ok: true,
      value: "",
      end: skipJsLineTerminator(text, escapedIndex),
      error: null
    });
  }

  const escaped = text[escapedIndex];
  switch (escaped) {
    case "b":
      return createJsStringEscapeResult("\b", escapedIndex + 1);
    case "f":
      return createJsStringEscapeResult("\f", escapedIndex + 1);
    case "n":
      return createJsStringEscapeResult("\n", escapedIndex + 1);
    case "r":
      return createJsStringEscapeResult("\r", escapedIndex + 1);
    case "t":
      return createJsStringEscapeResult("\t", escapedIndex + 1);
    case "v":
      return createJsStringEscapeResult("\v", escapedIndex + 1);
    case "0": {
      const next = text[escapedIndex + 1];
      if (next !== undefined && /[0-9]/.test(next)) {
        return createInvalidJsStringEscapeResult(
          "legacy-numeric-string-escape",
          escapedIndex + 1
        );
      }
      return createJsStringEscapeResult("\0", escapedIndex + 1);
    }
    case "x":
      return readHexJsStringEscape(text, escapedIndex + 1, endIndex);
    case "u":
      return readUnicodeJsStringEscape(text, escapedIndex + 1, endIndex);
    default:
      if (/[1-9]/.test(escaped)) {
        return createInvalidJsStringEscapeResult(
          "legacy-numeric-string-escape",
          escapedIndex + 1
        );
      }

      return createJsStringEscapeResult(escaped, escapedIndex + 1);
  }
}

function readHexJsStringEscape(text, hexStartIndex, endIndex) {
  const hexEndIndex = hexStartIndex + 2;
  if (
    hexEndIndex > endIndex ||
    isHexJsStringEscape(text, hexStartIndex, hexEndIndex) !== true
  ) {
    return createInvalidJsStringEscapeResult(
      "invalid-hex-string-escape",
      hexStartIndex
    );
  }

  return createJsStringEscapeResult(
    String.fromCharCode(parseInt(text.slice(hexStartIndex, hexEndIndex), 16)),
    hexEndIndex
  );
}

function readUnicodeJsStringEscape(text, unicodeStartIndex, endIndex) {
  if (text[unicodeStartIndex] === "{") {
    const closeIndex = text.indexOf("}", unicodeStartIndex + 1);
    if (closeIndex < 0 || closeIndex >= endIndex) {
      return createInvalidJsStringEscapeResult(
        "unterminated-unicode-code-point-escape",
        unicodeStartIndex
      );
    }

    const codePointSource = text.slice(unicodeStartIndex + 1, closeIndex);
    if (
      /^[0-9A-Fa-f]{1,6}$/.test(codePointSource) !== true ||
      parseInt(codePointSource, 16) > 0x10ffff
    ) {
      return createInvalidJsStringEscapeResult(
        "invalid-unicode-code-point-escape",
        unicodeStartIndex
      );
    }

    return createJsStringEscapeResult(
      String.fromCodePoint(parseInt(codePointSource, 16)),
      closeIndex + 1
    );
  }

  const unicodeEndIndex = unicodeStartIndex + 4;
  if (
    unicodeEndIndex > endIndex ||
    isHexJsStringEscape(text, unicodeStartIndex, unicodeEndIndex) !== true
  ) {
    return createInvalidJsStringEscapeResult(
      "invalid-unicode-string-escape",
      unicodeStartIndex
    );
  }

  return createJsStringEscapeResult(
    String.fromCharCode(
      parseInt(text.slice(unicodeStartIndex, unicodeEndIndex), 16)
    ),
    unicodeEndIndex
  );
}

function isHexJsStringEscape(text, startIndex, endIndex) {
  let index = startIndex;
  while (index < endIndex) {
    if (/[0-9A-Fa-f]/.test(text[index]) !== true) {
      return false;
    }
    index += 1;
  }
  return true;
}

function createJsStringEscapeResult(value, end) {
  return freezeRecord({
    ok: true,
    value,
    end,
    error: null
  });
}

function createInvalidJsStringEscapeResult(error, end) {
  return freezeRecord({
    ok: false,
    value: null,
    end,
    error
  });
}

function isJsLineTerminatorAt(text, index) {
  return (
    text[index] === "\n" ||
    text[index] === "\r" ||
    text[index] === "\u2028" ||
    text[index] === "\u2029"
  );
}

function skipJsLineTerminator(text, index) {
  return text[index] === "\r" && text[index + 1] === "\n"
    ? index + 2
    : index + 1;
}

function skipQuotedJsLiteral(text, startIndex) {
  const quote = text[startIndex];
  let index = startIndex + 1;

  while (index < text.length) {
    if (text[index] === "\\") {
      index += 2;
      continue;
    }

    if (text[index] === quote) {
      return index + 1;
    }

    index += 1;
  }

  return text.length;
}

function extractEvidenceSourceSlice({ path, text, sliceStart, sliceEnd }) {
  if (sliceStart == null && sliceEnd == null) {
    return freezeRecord({ ok: true, text, error: null });
  }

  const findMarker = isJavaScriptSourcePath(path)
    ? findTopLevelJsSourceOutsideCommentsAndStrings
    : findRawSource;
  const startIndex =
    sliceStart == null
      ? 0
      : findMarker(text, sliceStart);
  if (startIndex < 0) {
    return freezeRecord({
      ok: false,
      text: "",
      error: `slice-start-not-found: ${sliceStart}`
    });
  }

  const endSearchIndex =
    sliceStart == null ? startIndex : startIndex + sliceStart.length;
  const endIndex =
    sliceEnd == null
      ? text.length
      : findMarker(text, sliceEnd, endSearchIndex);
  if (endIndex < 0) {
    return freezeRecord({
      ok: false,
      text: "",
      error: `slice-end-not-found: ${sliceEnd}`
    });
  }

  return freezeRecord({
    ok: true,
    text: text.slice(startIndex, endIndex),
    error: null
  });
}

function isJavaScriptSourcePath(path) {
  return path.endsWith(".js") || path.endsWith(".mjs");
}

function createJsCodeMask(text) {
  const mask = new Uint8Array(text.length);
  mask.fill(1);

  let index = 0;
  let previousSignificantToken = null;
  while (index < text.length) {
    if (text.startsWith("//", index)) {
      const lineEnd = text.indexOf("\n", index + 2);
      const endIndex = lineEnd < 0 ? text.length : lineEnd + 1;
      maskSourceRange(mask, index, endIndex, 0);
      index = endIndex;
      continue;
    }

    if (text.startsWith("/*", index)) {
      const blockEnd = text.indexOf("*/", index + 2);
      const endIndex = blockEnd < 0 ? text.length : blockEnd + 2;
      maskSourceRange(mask, index, endIndex, 0);
      index = endIndex;
      continue;
    }

    const character = text[index];
    if (character === "'" || character === '"' || character === "`") {
      const endIndex = skipQuotedJsLiteral(text, index);
      maskSourceRange(mask, index, endIndex, 0);
      previousSignificantToken = freezeRecord({
        type: "literal",
        value: "string"
      });
      index = endIndex;
      continue;
    }

    if (
      character === "/" &&
      canStartJsRegexLiteral(previousSignificantToken) === true
    ) {
      const endIndex = readJsRegexLiteralEnd(text, index);
      if (endIndex > index) {
        maskSourceRange(mask, index, endIndex, 0);
        previousSignificantToken = freezeRecord({
          type: "literal",
          value: "regex"
        });
        index = endIndex;
        continue;
      }
    }

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    const token = readJsSignificantToken(text, index);
    if (token !== null) {
      previousSignificantToken = token;
      index = token.end;
      continue;
    }

    index += 1;
  }

  return mask;
}

function createJsTopLevelStartMask(text, codeMask) {
  const mask = new Uint8Array(text.length);
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (codeMask[index] !== 1) {
      continue;
    }

    if (braceDepth === 0 && bracketDepth === 0 && parenDepth === 0) {
      mask[index] = 1;
    }

    const character = text[index];
    if (character === "{") {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (character === "(") {
      parenDepth += 1;
    } else if (character === ")" && parenDepth > 0) {
      parenDepth -= 1;
    }
  }

  return mask;
}

function sourceRangeIsCode(codeMask, startIndex, endIndex) {
  for (let index = startIndex; index < endIndex; index += 1) {
    if (codeMask[index] !== 1) {
      return false;
    }
  }

  return true;
}

function maskSourceRange(mask, startIndex, endIndex, value) {
  for (let index = startIndex; index < endIndex; index += 1) {
    mask[index] = value;
  }
}

function readJsSignificantToken(text, startIndex) {
  const character = text[startIndex];

  if (/[A-Za-z_$]/.test(character)) {
    let index = startIndex + 1;
    while (index < text.length && /[A-Za-z0-9_$]/.test(text[index])) {
      index += 1;
    }

    return freezeRecord({
      type: "identifier",
      value: text.slice(startIndex, index),
      end: index
    });
  }

  if (/[0-9]/.test(character)) {
    let index = startIndex + 1;
    while (index < text.length && /[A-Za-z0-9_.$]/.test(text[index])) {
      index += 1;
    }

    return freezeRecord({
      type: "literal",
      value: "number",
      end: index
    });
  }

  const twoCharacterPunctuator = text.slice(startIndex, startIndex + 2);
  if (
    twoCharacterPunctuator === "=>" ||
    twoCharacterPunctuator === "++" ||
    twoCharacterPunctuator === "--" ||
    twoCharacterPunctuator === "&&" ||
    twoCharacterPunctuator === "||" ||
    twoCharacterPunctuator === "??"
  ) {
    return freezeRecord({
      type: "punctuator",
      value: twoCharacterPunctuator,
      end: startIndex + 2
    });
  }

  return freezeRecord({
    type: "punctuator",
    value: character,
    end: startIndex + 1
  });
}

function canStartJsRegexLiteral(previousSignificantToken) {
  if (previousSignificantToken === null) {
    return true;
  }

  if (previousSignificantToken.type === "literal") {
    return false;
  }

  if (previousSignificantToken.type === "identifier") {
    return new Set([
      "await",
      "case",
      "delete",
      "do",
      "else",
      "in",
      "instanceof",
      "of",
      "return",
      "throw",
      "typeof",
      "void",
      "yield"
    ]).has(previousSignificantToken.value);
  }

  return !new Set([")", "]", "++", "--"]).has(
    previousSignificantToken.value
  );
}

function readJsRegexLiteralEnd(text, startIndex) {
  let index = startIndex + 1;
  let inCharacterClass = false;

  while (index < text.length) {
    const character = text[index];

    if (character === "\\" && index + 1 < text.length) {
      index += 2;
      continue;
    }

    if (character === "\n" || character === "\r") {
      return startIndex;
    }

    if (character === "[" && inCharacterClass === false) {
      inCharacterClass = true;
      index += 1;
      continue;
    }

    if (character === "]" && inCharacterClass === true) {
      inCharacterClass = false;
      index += 1;
      continue;
    }

    if (character === "/" && inCharacterClass === false) {
      index += 1;
      while (index < text.length && /[A-Za-z]/.test(text[index])) {
        index += 1;
      }
      return index;
    }

    index += 1;
  }

  return text.length;
}

function findRawSource(text, needle, fromIndex = 0) {
  return text.indexOf(needle, fromIndex);
}

function readWorkspaceFile({ fileCache, workspaceRoot, path }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let source;
  try {
    source = freezeRecord({
      ok: true,
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      error: null
    });
  } catch (error) {
    source = freezeRecord({
      ok: false,
      text: "",
      error: `${error.name}: ${error.message}`
    });
  }
  fileCache.set(path, source);
  return source;
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return (
    left.every((value) => rightSet.has(value)) &&
    right.every((value) => leftSet.has(value))
  );
}

function sameSourceAssertionSet(left, right) {
  return sameStringSet(
    left.map((assertion) => sourceAssertionKey(assertion)),
    right.map((assertion) => sourceAssertionKey(assertion))
  );
}

function sourceAssertionKey(assertion) {
  return `${assertion.kind}:${assertion.property}:${JSON.stringify(
    assertion.value
  )}`;
}

function createViolation(id, fields) {
  return freezeRecord({
    id,
    ...fields
  });
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
