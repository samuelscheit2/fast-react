import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_729_731_GATE_ID =
  "private-admission-729-731-local-gate-1";
export const PRIVATE_ADMISSION_729_731_GATE_STATUS =
  "recognized-accepted-private-diagnostics-729-731-public-compatibility-blocked";
export const PRIVATE_ADMISSION_729_731_VIOLATION_STATUS =
  "blocked-accepted-private-diagnostics-729-731-with-violations";

export const PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS =
  Object.freeze([
    "publicPackageCompatibilityClaimed",
    "publicPackageSurfaceCompatibilityClaimed",
    "publicTestRendererCompatibilityClaimed",
    "publicTestRendererSerializationCompatibilityClaimed",
    "publicTestRendererToJSONCompatibilityClaimed",
    "publicTestRendererToTreeCompatibilityClaimed",
    "publicTestRendererRootCompatibilityClaimed",
    "publicTestRendererUpdateCompatibilityClaimed",
    "publicTestRendererUnmountCompatibilityClaimed",
    "publicTestRendererTestInstanceCompatibilityClaimed",
    "publicTestRendererJSFacadeAdmissionClaimed",
    "publicTestRendererCJSFacadeAdmissionClaimed",
    "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
    "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
    "publicTestRendererNativeBridgeCompatibilityClaimed",
    "publicTestRendererNativeBridgeExecutionClaimed",
    "publicActCompatibilityClaimed",
    "publicTestRendererRootRoutingCompatibilityClaimed",
    "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
    "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
    "publicTestRendererUnmountIdentityAdmissionClaimed",
    "publicTestRendererFullUnmountIdentityAdmissionClaimed",
    "publicTestRendererMultichildSerializationCompatibilityClaimed",
    "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
    "publicTestRendererSiblingSnapshotSerializationCompatibilityClaimed",
    "publicTestRendererMultichildIdentityAdmissionClaimed",
    "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
    "publicTestRendererSiblingSnapshotIdentityAdmissionClaimed",
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

export const PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES = Object.freeze([
  "package",
  "package-surface",
  "test-renderer",
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-unmount",
  "test-renderer-testinstance",
  "test-renderer-js-facade",
  "test-renderer-cjs-facade",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "test-renderer-root-routing",
  "test-renderer-update-native-serialization",
  "test-renderer-unmount-native-serialization",
  "test-renderer-unmount-identity-admission",
  "test-renderer-full-unmount-identity-admission",
  "test-renderer-multichild-serialization",
  "test-renderer-multichild-sibling-serialization",
  "test-renderer-sibling-snapshot-serialization",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "test-renderer-sibling-snapshot-identity-admission",
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

export const PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS =
  Object.freeze([
    "nativeExecutionAdmissionClaimed",
    "publicUnmountAdmissionClaimed",
    "unmountIdentityAdmissionClaimed",
    "jsFacadeAdmissionClaimed",
    "cjsFacadeAdmissionClaimed",
    "siblingSnapshotAdmissionClaimed",
    "toTreePromotionClaimed",
    "publicCompatibilityPromotionClaimed"
  ]);

export const PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS = Object.freeze([
  "worker-729-package-private-admission-audit-727-728"
]);

export const PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    "worker-730-test-renderer-unmount-native-cleanup-evidence": freezeArray([
      "test-renderer-unmount-native-ref-passive-cleanup-evidence",
      "private-unmount-native-cleanup-handoff-ref-passive-host-proof"
    ]),
    "worker-731-tojson-nested-update-native-identity": freezeArray([
      "test-renderer-tojson-nested-update-native-identity-admission",
      "private-nested-tojson-update-native-finished-work-identity-validation"
    ])
  });

export const PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES = freezeRecord({
  "worker-730-test-renderer-unmount-native-cleanup-evidence": freezeArray([
    "worker-575-test-renderer-unmount-deletion-commit-link",
    "worker-612-test-renderer-unmount-native-bridge-admission",
    "worker-638-test-renderer-unmount-native-execution"
  ]),
  "worker-731-tojson-nested-update-native-identity": freezeArray([
    "worker-577-test-renderer-nested-tojson-update-refresh",
    "worker-720-test-renderer-serialization-finished-work-identity",
    "worker-725-test-renderer-update-serialization-finished-work-identity",
    "worker-726-test-renderer-update-native-serialization-identity-admission"
  ])
});

export const PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS =
  freezeRecord({
    "worker-730-test-renderer-unmount-native-cleanup-evidence": freezeArray([
      "test-renderer-unmount-deletion-commit-handoff",
      "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
      "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic"
    ]),
    "worker-731-tojson-nested-update-native-identity": freezeArray([
      "test-renderer-tojson-nested-row",
      "test-renderer-serialization-finished-work-identity",
      "private-tojson-totree-finished-work-identity-validation",
      "test-renderer-update-serialization-finished-work-identity",
      "private-update-tojson-totree-finished-work-identity-validation",
      "test-renderer-update-native-serialization-identity-admission",
      "private-update-tojson-totree-native-diagnostic-admission"
    ])
  });

export const PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT =
  freezeRecord({
    "worker-730-test-renderer-unmount-native-cleanup-evidence": freezeArray([
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission",
      "worker-728-test-renderer-unmount-native-identity-argument-guard"
    ]),
    "worker-731-tojson-nested-update-native-identity": freezeArray([
      "worker-577-test-renderer-nested-tojson-update-refresh",
      "worker-726-test-renderer-update-native-serialization-identity-admission",
      "worker-728-test-renderer-unmount-native-identity-argument-guard"
    ])
  });

export const PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS =
  freezeRecord({
    "worker-730-test-renderer-unmount-native-cleanup-evidence": freezeArray([
      "test-renderer-update-serialization-finished-work-identity",
      "test-renderer-update-native-serialization-identity-admission",
      "test-renderer-unmount-native-identity-argument-guard",
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
    ]),
    "worker-731-tojson-nested-update-native-identity": freezeArray([
      "test-renderer-tojson-sibling-text-row",
      "test-renderer-update-native-serialization-identity-admission",
      "private-update-tojson-totree-native-diagnostic-admission",
      "test-renderer-unmount-native-identity-argument-guard"
    ])
  });

const privateAdmission729731SkippedRowData = Object.freeze([
  skippedRowData({
    workerId: "worker-729-package-private-admission-audit-727-728",
    area: "previous private-admission ledger audit for Workers 727-728",
    skipReason: "ledger-audit-no-new-runtime-capability",
    evidenceRows: [
      evidenceData({
        role: "worker-729-skip-meta-report",
        path: "worker-progress/worker-729-package-private-admission-audit-727-728.md",
        tokens: [
          "# Worker 729: Package Private Admission Audit 727-728",
          "Added the static private-admission ledger for queue 727-728.",
          "Classified Worker 727 as `skipped-meta` ledger work",
          "No runtime/product code, package exports, package manifests, public"
        ]
      })
    ]
  })
]);

const privateAdmission729731RowData = Object.freeze([
  rowData({
    workerId: "worker-730-test-renderer-unmount-native-cleanup-evidence",
    area: "react-test-renderer Rust unmount native cleanup evidence with ref/passive/host proof",
    primaryCompatibilityArea:
      "test-renderer-unmount-native-cleanup-ref-passive-host-evidence",
    acceptedDiagnosticIds: [
      "test-renderer-unmount-native-ref-passive-cleanup-evidence",
      "private-unmount-native-cleanup-handoff-ref-passive-host-proof"
    ],
    dependencyWorkerIds: [
      "worker-575-test-renderer-unmount-deletion-commit-link",
      "worker-612-test-renderer-unmount-native-bridge-admission",
      "worker-638-test-renderer-unmount-native-execution"
    ],
    dependencyDiagnosticIds: [
      "test-renderer-unmount-deletion-commit-handoff",
      "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
      "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic"
    ],
    blockerContextWorkerIds: [
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission",
      "worker-728-test-renderer-unmount-native-identity-argument-guard"
    ],
    blockerContextDiagnosticIds: [
      "test-renderer-update-serialization-finished-work-identity",
      "test-renderer-update-native-serialization-identity-admission",
      "test-renderer-unmount-native-identity-argument-guard",
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-575-unmount-deletion-commit-dependency",
        path: "worker-progress/worker-575-test-renderer-unmount-deletion-commit-link.md",
        tokens: [
          "# Worker 575: Test Renderer Unmount Deletion Commit Link",
          "private unmount deletion-commit handoff diagnostic",
          "public root unmount compatibility",
          "native execution"
        ]
      }),
      evidenceData({
        role: "worker-612-unmount-native-bridge-admission-dependency",
        path: "worker-progress/worker-612-test-renderer-unmount-native-bridge-admission.md",
        tokens: [
          "# Worker 612: Test Renderer Unmount Native Bridge Admission",
          "accepted unmount route outcome plus deletion commit handoff evidence",
          "native bridge availability",
          "execute Rust from public JS"
        ]
      }),
      evidenceData({
        role: "worker-638-unmount-cleanup-handoff-dependency",
        path: "worker-progress/worker-638-test-renderer-unmount-native-execution.md",
        tokens: [
          "# Worker 638: Test Renderer Unmount Native Execution",
          "execute_private_unmount_native_bridge_cleanup_handoff_for_canary",
          "cleanup-order records",
          "native execution"
        ]
      }),
      evidenceData({
        role: "worker-725-update-identity-blocker-context",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Kept update, unmount, multichild, and native execution admission unchanged.",
          "Keep unmount identity out of admission"
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
        role: "worker-728-unmount-identity-guard-blocker-context",
        path: "worker-progress/worker-728-test-renderer-unmount-native-identity-argument-guard.md",
        tokens: [
          "# Worker 728: Test Renderer Unmount Native Identity Argument Guard",
          "rejects non-`undefined` identity evidence",
          "Did not add a Rust unmount identity adapter."
        ]
      }),
      evidenceData({
        role: "worker-730-unmount-cleanup-report",
        path: "worker-progress/worker-730-test-renderer-unmount-native-cleanup-evidence.md",
        tokens: [
          "# Worker 730 - Test Renderer Unmount Native Cleanup Evidence",
          "unmount native cleanup evidence with nonzero deleted ref cleanup and deleted",
          "`ref_cleanup_return_count == 1`, `passive_destroy_count == 1`,",
          "public `unmount`, public serialization, native execution, JS bridge behavior,",
          "This worker did not add or consume that"
        ]
      }),
      evidenceData({
        role: "worker-730-unmount-cleanup-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        tokens: [
          "fn root_private_unmount_native_bridge_cleanup_handoff_carries_ref_passive_cleanup_evidence()",
          "execute_private_unmount_native_bridge_cleanup_handoff_with_ref_passive_cleanup_for_canary",
          "assert_eq!(cleanup_handoff.host_node_cleanup_count(), 2);",
          "assert_eq!(cleanup_handoff.ref_cleanup_return_count(), 1);",
          "assert_eq!(cleanup_handoff.passive_destroy_count(), 1);",
          "assert_eq!(cleanup_handoff.cleanup_order_record_count(), 4);",
          "assert!(passive_ref_order.ref_cleanup_return_precedes_passive_destroy());",
          "assert!(passive_ref_order.host_cleanup_follows_ref_cleanup_return());",
          "assert!(passive_ref_order.host_cleanup_follows_passive_destroy());",
          "assert!(!cleanup_handoff.native_execution());",
          "reason: \"cleanup-order-count-mismatch\""
        ]
      })
    ]
  }),
  rowData({
    workerId: "worker-731-tojson-nested-update-native-identity",
    area: "react-test-renderer Rust nested toJSON update native identity evidence",
    primaryCompatibilityArea:
      "test-renderer-tojson-nested-update-native-identity-admission",
    acceptedDiagnosticIds: [
      "test-renderer-tojson-nested-update-native-identity-admission",
      "private-nested-tojson-update-native-finished-work-identity-validation"
    ],
    dependencyWorkerIds: [
      "worker-577-test-renderer-nested-tojson-update-refresh",
      "worker-720-test-renderer-serialization-finished-work-identity",
      "worker-725-test-renderer-update-serialization-finished-work-identity",
      "worker-726-test-renderer-update-native-serialization-identity-admission"
    ],
    dependencyDiagnosticIds: [
      "test-renderer-tojson-nested-row",
      "test-renderer-serialization-finished-work-identity",
      "private-tojson-totree-finished-work-identity-validation",
      "test-renderer-update-serialization-finished-work-identity",
      "private-update-tojson-totree-finished-work-identity-validation",
      "test-renderer-update-native-serialization-identity-admission",
      "private-update-tojson-totree-native-diagnostic-admission"
    ],
    blockerContextWorkerIds: [
      "worker-577-test-renderer-nested-tojson-update-refresh",
      "worker-726-test-renderer-update-native-serialization-identity-admission",
      "worker-728-test-renderer-unmount-native-identity-argument-guard"
    ],
    blockerContextDiagnosticIds: [
      "test-renderer-tojson-sibling-text-row",
      "test-renderer-update-native-serialization-identity-admission",
      "private-update-tojson-totree-native-diagnostic-admission",
      "test-renderer-unmount-native-identity-argument-guard"
    ],
    evidenceRows: [
      evidenceData({
        role: "worker-577-nested-tojson-row-dependency",
        path: "worker-progress/worker-577-test-renderer-nested-tojson-update-refresh.md",
        tokens: [
          "# Worker 577: Test Renderer Nested toJSON Update Refresh",
          "private toJSON host-output row shape diagnostics",
          "sibling text rows",
          "does not execute the native bridge or expose public `toJSON` compatibility"
        ]
      }),
      evidenceData({
        role: "worker-720-base-finished-work-identity-dependency",
        path: "worker-progress/worker-720-test-renderer-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 720 - test renderer serialization finished-work identity",
          "TestRendererPrivateSerializationFinishedWorkIdentityGate",
          "Public `create().toJSON`, `create().toTree`, `.root`, `TestInstance`, native bridge execution, and compatibility claims must stay blocked."
        ]
      }),
      evidenceData({
        role: "worker-725-update-finished-work-identity-dependency",
        path: "worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md",
        tokens: [
          "# Worker 725 - test renderer update serialization finished-work identity",
          "Added private update-path finished-work identity evidence",
          "react-test-renderer `toJSON` and `toTree` serialization diagnostics.",
          "Keep unmount identity out of admission"
        ]
      }),
      evidenceData({
        role: "worker-726-update-native-identity-dependency-and-blocker",
        path: "worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md",
        tokens: [
          "# Worker 726 - test renderer update native serialization identity admission",
          "Extended private update-path `toJSON` and `toTree` native serialization",
          "reject multichild/sibling update evidence from the identity admission path.",
          "Kept unmount identity admission out of scope"
        ]
      }),
      evidenceData({
        role: "worker-728-unmount-identity-guard-blocker-context",
        path: "worker-progress/worker-728-test-renderer-unmount-native-identity-argument-guard.md",
        tokens: [
          "# Worker 728: Test Renderer Unmount Native Identity Argument Guard",
          "toJSON unmount native serialization rejects non-`undefined` identity evidence",
          "Did not add a Rust unmount identity adapter."
        ]
      }),
      evidenceData({
        role: "worker-731-nested-tojson-identity-report",
        path: "worker-progress/worker-731-tojson-nested-update-native-identity.md",
        tokens: [
          "# Worker 731 - toJSON nested update native identity",
          "Added finished-work identity admission to the private nested update `toJSON`",
          "Kept the path Rust-only and private canary/diagnostic only; no JS/CJS",
          "facades, package manifests, public exports, conformance, sibling snapshot",
          "serialization, unmount, or `toTree` paths were changed.",
          "Public `toJSON`, native bridge execution, and compatibility claims remain"
        ]
      }),
      evidenceData({
        role: "worker-731-nested-tojson-identity-rust-proof",
        path: "crates/fast-react-test-renderer/src/lib.rs",
        tokens: [
          "fn root_private_to_json_nested_update_native_execution_requires_finished_work_identity_gate()",
          "describe_private_to_json_after_nested_update_native_execution_for_canary",
          "reason: \"finished-work-identity-missing\"",
          "reason: \"update-admission-finished-work-identity-mismatch\"",
          "reason: \"update-admission-finished-work-identity-lane-mismatch\"",
          "fn root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row()",
          "assert!(evidence.consumes_accepted_native_update_execution_record());",
          "assert!(evidence.consumes_accepted_host_output_row());",
          "assert!(!evidence.native_execution_available());",
          "assert!(!evidence.compatibility_claimed());"
        ]
      })
    ]
  })
]);

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

function evidenceData({ role, path, tokens }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens)
  });
}

function admissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function blockedAdmissionClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS.map((claimId) => [
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
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    primaryCompatibilityArea,
    sourceQueue: "729-731",
    privateAdmission: "accepted-private-diagnostic",
    localGateCoverage: "private-admission-729-731-local-gate",
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
      PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

function skippedRow({
  workerId,
  area,
  skipReason,
  evidence: evidenceRows,
  publicCompatibilityClaims,
  privateAdmissionClaims
}) {
  return freezeRecord({
    workerId,
    area,
    skipReason,
    sourceQueue: "729-731",
    privateAdmission: "skipped-meta",
    localGateCoverage: "private-admission-729-731-local-gate",
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
      PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
    publicCompatibilityClaims: freezeRecord(publicCompatibilityClaims),
    blockedPublicClaims: freezeArray(Object.keys(publicCompatibilityClaims)),
    blockedAdmissionClaims: freezeRecord(privateAdmissionClaims),
    blockedAdmissionClaimIds: freezeArray(Object.keys(privateAdmissionClaims))
  });
}

export const PRIVATE_ADMISSION_729_731_SKIPPED_ROWS = freezeArray(
  privateAdmission729731SkippedRowData.map((sourceRow) =>
    skippedRow({
      workerId: sourceRow.workerId,
      area: sourceRow.area,
      skipReason: sourceRow.skipReason,
      evidence: sourceRow.evidenceRows,
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_729_731_ROWS = freezeArray(
  privateAdmission729731RowData.map((sourceRow) =>
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
      publicCompatibilityClaims: admissionClaims(),
      privateAdmissionClaims: blockedAdmissionClaims()
    })
  )
);

export const PRIVATE_ADMISSION_729_731_WORKERS = freezeArray(
  PRIVATE_ADMISSION_729_731_ROWS.map((row) => row.workerId)
);

export function evaluatePrivateAdmission729731Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_729_731_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const skippedRows = PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.map((baseRow) => {
    const override = skippedRowOverrides[baseRow.workerId] ?? {};
    return mergeRowOverride(baseRow, override);
  });
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const evaluatedSkippedRows = skippedRows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const skippedManifestWorkerIds = skippedRows.map(
    (baseRow) => baseRow.workerId
  );
  const missingWorkerIds = PRIVATE_ADMISSION_729_731_WORKERS.filter(
    (workerId) => !manifestWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = manifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_729_731_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = manifestWorkerIds.filter(
    (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
  );
  const missingSkippedWorkerIds =
    PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS.filter(
      (workerId) => !skippedManifestWorkerIds.includes(workerId)
    );
  const unexpectedSkippedWorkerIds = skippedManifestWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS.includes(workerId)
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
  const blockedAdmissionClaimViolations = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.blockedAdmissionClaimViolations.map((claimId) =>
        `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const promotionLeakWorkerIds = evaluatedAllRows
    .filter((evaluatedRow) => {
      if (evaluatedRow.privateAdmission === "skipped-meta") {
        return evaluatedRow.promotion !== "not-applicable";
      }
      return evaluatedRow.promotion !== "rejected";
    })
    .map((evaluatedRow) => evaluatedRow.workerId);
  const publicCompatibilityClaimKeyMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualClaimIds = Object.keys(
        evaluatedRow.publicCompatibilityClaims ?? {}
      );

      if (
        sameStringSet(
          PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualClaimIds
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedPublicCompatibilityClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualPublicCompatibilityClaims: freezeArray(actualClaimIds)
        })
      ];
    }
  );
  const blockedSurfaceMismatches = evaluatedAllRows.flatMap((evaluatedRow) => {
    const actualBlockedSurfaces =
      evaluatedRow.blockedPublicCompatibilitySurfaces ?? [];

    if (
      sameStringSet(
        PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
        actualBlockedSurfaces
      ) === true
    ) {
      return [];
    }

    return [
      freezeRecord({
        workerId: evaluatedRow.workerId,
        expectedBlockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_729_731_BLOCKED_SURFACES,
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
          PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockedPublicClaims:
            PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
          actualBlockedPublicClaims: freezeArray(actualBlockedPublicClaims)
        })
      ];
    }
  );
  const blockedAdmissionClaimMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualBlockedAdmissionClaims =
        evaluatedRow.blockedAdmissionClaimIds ?? [];

      if (
        sameStringSet(
          PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaims
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaims)
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
          PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedAcceptedDiagnosticIds =
        PRIVATE_ADMISSION_729_731_REQUIRED_ACCEPTED_DIAGNOSTICS[
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
        PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedDependencyWorkerIds =
      PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCIES[evaluatedRow.workerId];
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
          PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedDependencyDiagnosticIds =
        PRIVATE_ADMISSION_729_731_REQUIRED_DEPENDENCY_DIAGNOSTICS[
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
        PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT,
        evaluatedRow.workerId
      )
    ) {
      return [];
    }

    const expectedBlockerContextWorkerIds =
      PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT[evaluatedRow.workerId];
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
          PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
          evaluatedRow.workerId
        )
      ) {
        return [];
      }

      const expectedBlockerContextDiagnosticIds =
        PRIVATE_ADMISSION_729_731_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
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

  if (blockedAdmissionClaimViolations.length > 0) {
    violations.push(
      createViolation("blocked-admission-claim-detected", {
        claimIds: blockedAdmissionClaimViolations
      })
    );
  }

  if (promotionLeakWorkerIds.length > 0) {
    violations.push(
      createViolation("private-diagnostic-public-promotion-leak", {
        workerIds: promotionLeakWorkerIds
      })
    );
  }

  if (publicCompatibilityClaimKeyMismatches.length > 0) {
    violations.push(
      createViolation("public-compatibility-claim-key-mismatch", {
        rows: freezeArray(publicCompatibilityClaimKeyMismatches)
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

  if (blockedAdmissionClaimMismatches.length > 0) {
    violations.push(
      createViolation("blocked-admission-claim-mismatch", {
        rows: freezeArray(blockedAdmissionClaimMismatches)
      })
    );
  }

  return freezeRecord({
    id: PRIVATE_ADMISSION_729_731_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_729_731_GATE_STATUS
        : PRIVATE_ADMISSION_729_731_VIOLATION_STATUS,
    queueWorkers: PRIVATE_ADMISSION_729_731_WORKERS,
    skippedWorkers: PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
    rows: freezeArray(evaluatedRows),
    skippedRows: freezeArray(evaluatedSkippedRows),
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
      publicCompatibilityClaimKeyMismatches.length === 0 &&
      blockedSurfaceMismatches.length === 0 &&
      blockedPublicClaimMismatches.length === 0 &&
      compatibilityClaimWorkerIds.length === 0 &&
      publicCompatibilityViolations.length === 0 &&
      blockedAdmissionClaimMismatches.length === 0 &&
      blockedAdmissionClaimViolations.length === 0 &&
      promotionLeakWorkerIds.length === 0,
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
    blockedPublicSurfacesRecognized: blockedSurfaceMismatches.length === 0,
    blockedPublicClaimsRecognized:
      blockedPublicClaimMismatches.length === 0 &&
      publicCompatibilityClaimKeyMismatches.length === 0,
    blockedAdmissionClaimsRecognized:
      blockedAdmissionClaimMismatches.length === 0 &&
      blockedAdmissionClaimViolations.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      publicCompatibilityViolations.length > 0 ||
      blockedAdmissionClaimViolations.length > 0 ||
      promotionLeakWorkerIds.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_729_731_WORKERS,
      actualWorkerIds: freezeArray(manifestWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      skippedWorkerIds: PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
      expectedSkippedWorkerIds: PRIVATE_ADMISSION_729_731_SKIPPED_WORKERS,
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
    }),
    blockedAdmissionClaims: freezeRecord({
      ...baseRow.blockedAdmissionClaims,
      ...(override.blockedAdmissionClaims ?? {})
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
  const blockedAdmissionClaimViolations = Object.entries(
    row.blockedAdmissionClaims ?? {}
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evaluatedEvidence),
    evidenceRecognized,
    recognized:
      typeof row.recognized === "boolean" ? row.recognized : evidenceRecognized,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolations: freezeArray(
      blockedAdmissionClaimViolations
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: evidenceRow.path
  });
  const tokenResults = evidenceRow.tokens.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    ...evidenceRow,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    recognized: source.ok === true && missingTokens.length === 0,
    readError: source.error
  });
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

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
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
