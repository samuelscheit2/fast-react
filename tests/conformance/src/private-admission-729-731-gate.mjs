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

const PRIVATE_ADMISSION_729_731_ROW_KEYS = freezeArray([
  "acceptedDiagnosticIds",
  "area",
  "blockedAdmissionClaimIds",
  "blockedAdmissionClaims",
  "blockedPublicClaims",
  "blockedPublicCompatibilitySurfaces",
  "blockerContextDiagnosticIds",
  "blockerContextWorkerIds",
  "compatibilityClaimed",
  "dependencyDiagnosticIds",
  "dependencyWorkerIds",
  "evidence",
  "localGateCoverage",
  "primaryCompatibilityArea",
  "privateAdmission",
  "privateEvidenceOnly",
  "promotion",
  "publicCompatibilityClaims",
  "recognized",
  "runtimeCapabilityAdded",
  "skipReason",
  "sourceQueue",
  "workerId"
]);

const PRIVATE_ADMISSION_729_731_EVIDENCE_KEYS = freezeArray([
  "path",
  "role",
  "tokens"
]);

const PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEYS =
  freezeArray([
    "acceptedDiagnosticIds",
    "area",
    "blockedAdmissionClaimIds",
    "blockedPublicClaims",
    "blockedPublicCompatibilitySurfaces",
    "blockerContextDiagnosticIds",
    "blockerContextWorkerIds",
    "compatibilityClaimed",
    "dependencyDiagnosticIds",
    "dependencyWorkerIds",
    "evidence",
    "localGateCoverage",
    "privateAdmission",
    "privateEvidenceOnly",
    "primaryCompatibilityArea",
    "promotion",
    "publicCompatibilityClaims",
    "blockedAdmissionClaims",
    "recognized",
    "runtimeCapabilityAdded",
    "skipReason",
    "sourceQueue",
    "workerId"
  ]);

const PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEY_SET = new Set(
  PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEYS
);

const PRIVATE_ADMISSION_729_731_STATIC_METADATA_FIELDS = freezeArray([
  "area",
  "localGateCoverage",
  "primaryCompatibilityArea",
  "skipReason",
  "sourceQueue"
]);

const PRIVATE_ADMISSION_729_731_ROW_OVERRIDE_READ_FAILURES = Symbol(
  "privateAdmission729731RowOverrideReadFailures"
);

const PRIVATE_ADMISSION_729_731_COMPATIBILITY_ALIAS_PROBE_STEMS = freezeArray([
  "fastReact",
  "fastReactBehavior",
  "fastReactRuntime",
  "fastReactDom",
  "fastReactDomBehavior",
  "fastReactTestRenderer",
  "react",
  "reactBehavior",
  "reactDom",
  "reactTestRenderer",
  "testRenderer",
  "scheduler",
  "native",
  "nativeExecution",
  "nativePackage",
  "package",
  "packageSurface",
  "public",
  "publicPackage",
  "publicPackageSurface",
  "publicNative",
  "renderer",
  "root"
]);

const PRIVATE_ADMISSION_729_731_COMPATIBILITY_ALIAS_PROBE_SUFFIXES =
  freezeArray(["Claimed", "Compatible", "Compatibility", "CompatibilityClaimed"]);

const PRIVATE_ADMISSION_729_731_HIDDEN_COMPATIBILITY_CLAIM_PROBE_KEYS =
  freezeArray([
    ...new Set([
      ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
      ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
      "compatibilityClaimed",
      "publicCompatibilityClaimed",
      "packageCompatibilityClaimed",
      "nativeCompatibilityClaimed",
      "blockedAdmissionClaimIds",
      "blockedAdmissionClaims",
      "blockedPublicClaims",
      "blockedPublicCompatibilitySurfaces",
      "admissionClaims",
      "claims",
      "compatibilityClaims",
      "evidenceClaims",
      "publicClaims",
      "publicCompatibilityClaims",
      ...[
        ...PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
        ...PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS
      ].flatMap((claimId) =>
        PRIVATE_ADMISSION_729_731_COMPATIBILITY_ALIAS_PROBE_SUFFIXES.map(
          (suffix) => `${compatibilityClaimProbeStem(claimId)}${suffix}`
        )
      ),
      ...PRIVATE_ADMISSION_729_731_COMPATIBILITY_ALIAS_PROBE_STEMS.flatMap(
        (stem) =>
          PRIVATE_ADMISSION_729_731_COMPATIBILITY_ALIAS_PROBE_SUFFIXES.map(
            (suffix) => `${stem}${suffix}`
          )
      )
    ])
  ]);

export function evaluatePrivateAdmission729731Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  skippedRowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rowInputs = PRIVATE_ADMISSION_729_731_ROWS.map((baseRow) => {
    const override = rowOverrides[baseRow.workerId] ?? {};
    const overrideRecord = readRowOverrideRecord(override);
    return freezeRecord({
      baseRow,
      override,
      overrideRecord,
      row: mergeRowOverride(baseRow, overrideRecord)
    });
  });
  const skippedRowInputs = PRIVATE_ADMISSION_729_731_SKIPPED_ROWS.map(
    (baseRow) => {
      const override = skippedRowOverrides[baseRow.workerId] ?? {};
      const overrideRecord = readRowOverrideRecord(override);
      return freezeRecord({
        baseRow,
        override,
        overrideRecord,
        row: mergeRowOverride(baseRow, overrideRecord)
      });
    }
  );
  const rows = rowInputs.map((input) => input.row);
  const skippedRows = skippedRowInputs.map((input) => input.row);
  const evaluatedRows = rowInputs.map((input) =>
    evaluatePrivateAdmissionRow({
      baseRow: input.baseRow,
      fileCache,
      override: input.override,
      overrideRecord: input.overrideRecord,
      row: input.row,
      workspaceRoot
    })
  );
  const evaluatedSkippedRows = skippedRowInputs.map((input) =>
    evaluatePrivateAdmissionRow({
      baseRow: input.baseRow,
      fileCache,
      override: input.override,
      overrideRecord: input.overrideRecord,
      row: input.row,
      workspaceRoot
    })
  );
  const evaluatedAllRows = [...evaluatedRows, ...evaluatedSkippedRows];
  const acceptedMetadataMismatches = rowInputs.flatMap((input) =>
    staticMetadataMismatchesForInput(input)
  );
  const skippedMetadataMismatches = skippedRowInputs.flatMap((input) =>
    staticMetadataMismatchesForInput(input)
  );
  const metadataMismatches = [
    ...acceptedMetadataMismatches,
    ...skippedMetadataMismatches
  ];
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
  const evidenceTokenMismatches = evaluatedAllRows.flatMap((evaluatedRow) =>
    evaluatedRow.evidence
      .filter(
        (evidenceRow) =>
          evidenceRow.readError != null || evidenceRow.missingTokens.length > 0
      )
      .map((evidenceRow) =>
        freezeRecord({
          workerId: evaluatedRow.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          readError: evidenceRow.readError
        })
      )
  );
  const evaluatedSkippedWorkerIds = new Set(
    evaluatedSkippedRows.map((evaluatedRow) => evaluatedRow.workerId)
  );
  const privateEvidenceOnlyMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      if (evaluatedRow.privateEvidenceOnly === true) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedPrivateEvidenceOnly: true,
          actualPrivateEvidenceOnly: evaluatedRow.privateEvidenceOnly
        })
      ];
    }
  );
  const acceptedPrivateEvidenceOnlyMismatches =
    privateEvidenceOnlyMismatches.filter(
      (mismatch) => !evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const skippedPrivateEvidenceOnlyMismatches =
    privateEvidenceOnlyMismatches.filter((mismatch) =>
      evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const skippedEvidenceTokenMismatches = evidenceTokenMismatches.filter(
    (mismatch) => evaluatedSkippedWorkerIds.has(mismatch.workerId)
  );
  const evidenceShapeMismatches = evaluatedAllRows.flatMap((evaluatedRow) =>
    evaluatedRow.evidenceShapeMismatches.map((mismatch) =>
      freezeRecord({
        workerId: evaluatedRow.workerId,
        ...mismatch
      })
    )
  );
  const skippedEvidenceShapeMismatches = evidenceShapeMismatches.filter(
    (mismatch) => evaluatedSkippedWorkerIds.has(mismatch.workerId)
  );
  const rowOverrideReadFailures = evaluatedAllRows.flatMap((evaluatedRow) =>
    evaluatedRow.rowOverrideReadFailures.map((failure) =>
      freezeRecord({
        workerId: evaluatedRow.workerId,
        ...failure
      })
    )
  );
  const acceptedRowOverrideReadFailures = rowOverrideReadFailures.filter(
    (failure) => !evaluatedSkippedWorkerIds.has(failure.workerId)
  );
  const skippedRowOverrideReadFailures = rowOverrideReadFailures.filter(
    (failure) => evaluatedSkippedWorkerIds.has(failure.workerId)
  );
  const unknownCompatibilityClaimMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.unknownCompatibilityClaimKeys.map((claim) =>
        freezeRecord({
          workerId: evaluatedRow.workerId,
          ...claim
        })
      )
  );
  const skippedUnknownCompatibilityClaimMismatches =
    unknownCompatibilityClaimMismatches.filter((mismatch) =>
      evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const compatibilityClaimWorkerIds = evaluatedAllRows
    .filter((evaluatedRow) => evaluatedRow.compatibilityClaimed !== false)
    .map((evaluatedRow) => evaluatedRow.workerId);
  const skippedCompatibilityClaimWorkerIds = compatibilityClaimWorkerIds.filter(
    (workerId) => evaluatedSkippedWorkerIds.has(workerId)
  );
  const publicCompatibilityViolations = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.publicCompatibilityViolations.map((claimId) =>
        `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const skippedPublicCompatibilityViolations =
    publicCompatibilityViolations.filter((claimId) =>
      evaluatedSkippedWorkerIds.has(claimId.split(".")[0])
    );
  const blockedAdmissionClaimViolations = evaluatedAllRows.flatMap(
    (evaluatedRow) =>
      evaluatedRow.blockedAdmissionClaimViolations.map((claimId) =>
        `${evaluatedRow.workerId}.${claimId}`
      )
  );
  const skippedBlockedAdmissionClaimViolations =
    blockedAdmissionClaimViolations.filter((claimId) =>
      evaluatedSkippedWorkerIds.has(claimId.split(".")[0])
    );
  const promotionLeakWorkerIds = evaluatedAllRows
    .filter((evaluatedRow) => {
      if (evaluatedRow.privateAdmission === "skipped-meta") {
        return evaluatedRow.promotion !== "not-applicable";
      }
      return evaluatedRow.promotion !== "rejected";
    })
    .map((evaluatedRow) => evaluatedRow.workerId);
  const skippedPromotionLeakWorkerIds = promotionLeakWorkerIds.filter(
    (workerId) => evaluatedSkippedWorkerIds.has(workerId)
  );
  const publicCompatibilityClaimKeyMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualClaimIds = claimContainerKeyNames(
        evaluatedRow.publicCompatibilityClaims
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
        actualBlockedPublicCompatibilitySurfaces:
          freezeArrayValue(actualBlockedSurfaces)
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
          actualBlockedPublicClaims: freezeArrayValue(actualBlockedPublicClaims)
        })
      ];
    }
  );
  const blockedAdmissionClaimMismatches = evaluatedAllRows.flatMap(
    (evaluatedRow) => {
      const actualBlockedAdmissionClaimIds =
        evaluatedRow.blockedAdmissionClaimIds ?? [];
      const actualBlockedAdmissionClaimKeys = claimContainerKeyNames(
        evaluatedRow.blockedAdmissionClaims
      );

      if (
        sameStringSet(
          PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds
        ) === true &&
        sameStringSet(
          PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimKeys
        ) === true
      ) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedBlockedAdmissionClaims:
            PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
          actualBlockedAdmissionClaimIds: freezeArrayValue(
            actualBlockedAdmissionClaimIds
          ),
          actualBlockedAdmissionClaims: freezeArray(actualBlockedAdmissionClaimKeys)
        })
      ];
    }
  );
  const skippedPublicCompatibilityClaimKeyMismatches =
    publicCompatibilityClaimKeyMismatches.filter((mismatch) =>
      evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const skippedBlockedSurfaceMismatches = blockedSurfaceMismatches.filter(
    (mismatch) => evaluatedSkippedWorkerIds.has(mismatch.workerId)
  );
  const skippedBlockedPublicClaimMismatches =
    blockedPublicClaimMismatches.filter((mismatch) =>
      evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const skippedBlockedAdmissionClaimMismatches =
    blockedAdmissionClaimMismatches.filter((mismatch) =>
      evaluatedSkippedWorkerIds.has(mismatch.workerId)
    );
  const acceptedRuntimeCapabilityMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (evaluatedRow.runtimeCapabilityAdded === true) {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedRuntimeCapabilityAdded: true,
          actualRuntimeCapabilityAdded: evaluatedRow.runtimeCapabilityAdded
        })
      ];
    }
  );
  const acceptedPrivateAdmissionMismatches = evaluatedRows.flatMap(
    (evaluatedRow) => {
      if (evaluatedRow.privateAdmission === "accepted-private-diagnostic") {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedPrivateAdmission: "accepted-private-diagnostic",
          actualPrivateAdmission: evaluatedRow.privateAdmission
        })
      ];
    }
  );
  const skippedPrivateAdmissionMismatches = evaluatedSkippedRows.flatMap(
    (evaluatedRow) => {
      if (evaluatedRow.privateAdmission === "skipped-meta") {
        return [];
      }

      return [
        freezeRecord({
          workerId: evaluatedRow.workerId,
          expectedPrivateAdmission: "skipped-meta",
          actualPrivateAdmission: evaluatedRow.privateAdmission
        })
      ];
    }
  );
  const privateAdmissionMismatches = [
    ...acceptedPrivateAdmissionMismatches,
    ...skippedPrivateAdmissionMismatches
  ];
  const skippedRuntimeCapabilityWorkerIds = evaluatedSkippedRows
    .filter(
      (evaluatedRow) =>
        evaluatedRow.privateAdmission !== "skipped-meta" ||
        evaluatedRow.runtimeCapabilityAdded !== false ||
        !isEmptyArray(evaluatedRow.acceptedDiagnosticIds)
    )
    .map((evaluatedRow) => evaluatedRow.workerId);
  const skippedDiagnosticContextMismatches = evaluatedSkippedRows.flatMap(
    (evaluatedRow) =>
      [
        "dependencyWorkerIds",
        "dependencyDiagnosticIds",
        "blockerContextWorkerIds",
        "blockerContextDiagnosticIds"
      ].flatMap((field) => {
        const actualValue = evaluatedRow[field];
        if (isEmptyArray(actualValue)) {
          return [];
        }

        return [
          freezeRecord({
            workerId: evaluatedRow.workerId,
            field,
            expected: freezeArray([]),
            actual: freezeArrayValue(actualValue)
          })
        ];
      })
  );
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
          actualAcceptedDiagnosticIds: freezeArrayValue(
            actualAcceptedDiagnosticIds
          )
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
        actualDependencyWorkerIds: freezeArrayValue(actualDependencyWorkerIds)
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
          actualDependencyDiagnosticIds: freezeArrayValue(
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
        actualBlockerContextWorkerIds: freezeArrayValue(
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
          actualBlockerContextDiagnosticIds: freezeArrayValue(
            actualBlockerContextDiagnosticIds
          )
        })
      ];
    }
  );
  const reportedRowResults = evaluatedRows.map((row) =>
    sanitizeEvaluatedRow(row)
  );
  const reportedSkippedRowResults = evaluatedSkippedRows.map((row) =>
    sanitizeEvaluatedRow(row)
  );
  const reportedRows = reportedRowResults.map((result) => result.row);
  const reportedSkippedRows = reportedSkippedRowResults.map(
    (result) => result.row
  );
  const acceptedReportArrayShapeMismatches = reportedRowResults.flatMap(
    (result) => result.arrayShapeMismatches
  );
  const skippedReportArrayShapeMismatches = reportedSkippedRowResults.flatMap(
    (result) => result.arrayShapeMismatches
  );
  const reportArrayShapeMismatches = [
    ...acceptedReportArrayShapeMismatches,
    ...skippedReportArrayShapeMismatches
  ];
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

  if (evidenceTokenMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-evidence-token-missing", {
        rows: freezeArray(evidenceTokenMismatches)
      })
    );
  }

  if (evidenceShapeMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-evidence-context-mismatch", {
        rows: freezeArray(evidenceShapeMismatches)
      })
    );
  }

  if (rowOverrideReadFailures.length > 0) {
    violations.push(
      createViolation("hidden-row-override-field-unreadable", {
        rows: freezeArray(rowOverrideReadFailures)
      })
    );
  }

  if (unknownCompatibilityClaimMismatches.length > 0) {
    violations.push(
      createViolation("unknown-compatibility-claim-detected", {
        rows: freezeArray(unknownCompatibilityClaimMismatches)
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

  if (metadataMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-static-metadata-mismatch", {
        rows: freezeArray(metadataMismatches)
      })
    );
  }

  if (skippedDiagnosticContextMismatches.length > 0) {
    violations.push(
      createViolation("skip-meta-row-diagnostic-context-mismatch", {
        rows: freezeArray(skippedDiagnosticContextMismatches)
      })
    );
  }

  if (acceptedRuntimeCapabilityMismatches.length > 0) {
    violations.push(
      createViolation("accepted-private-runtime-capability-mismatch", {
        rows: freezeArray(acceptedRuntimeCapabilityMismatches)
      })
    );
  }

  if (privateAdmissionMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-kind-mismatch", {
        rows: freezeArray(privateAdmissionMismatches)
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

  if (privateEvidenceOnlyMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-evidence-scope-mismatch", {
        rows: freezeArray(privateEvidenceOnlyMismatches)
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

  // Raw mismatch checks own the normal violation detail. Report-only array
  // failures are promoted when they would otherwise leave the gate green.
  if (violations.length === 0 && reportArrayShapeMismatches.length > 0) {
    violations.push(
      createViolation("private-admission-report-array-shape-mismatch", {
        rows: freezeArray(reportArrayShapeMismatches)
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
    rows: freezeArray(reportedRows),
    skippedRows: freezeArray(reportedSkippedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(
        reportedRows.map((evaluatedRow) => [
          evaluatedRow.workerId,
          evaluatedRow
        ])
      )
    ),
    skippedRowsByWorker: freezeRecord(
      Object.fromEntries(
        reportedSkippedRows.map((evaluatedRow) => [
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
      evidenceTokenMismatches.length === 0 &&
      evidenceShapeMismatches.length === 0 &&
      acceptedRowOverrideReadFailures.length === 0 &&
      acceptedReportArrayShapeMismatches.length === 0 &&
      unknownCompatibilityClaimMismatches.length === 0 &&
      publicCompatibilityClaimKeyMismatches.length === 0 &&
      blockedSurfaceMismatches.length === 0 &&
      blockedPublicClaimMismatches.length === 0 &&
      acceptedMetadataMismatches.length === 0 &&
      acceptedRuntimeCapabilityMismatches.length === 0 &&
      acceptedPrivateAdmissionMismatches.length === 0 &&
      acceptedPrivateEvidenceOnlyMismatches.length === 0 &&
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
      skippedRuntimeCapabilityWorkerIds.length === 0 &&
      skippedMetadataMismatches.length === 0 &&
      skippedDiagnosticContextMismatches.length === 0 &&
      skippedPrivateAdmissionMismatches.length === 0 &&
      skippedEvidenceTokenMismatches.length === 0 &&
      skippedEvidenceShapeMismatches.length === 0 &&
      skippedRowOverrideReadFailures.length === 0 &&
      skippedReportArrayShapeMismatches.length === 0 &&
      skippedPrivateEvidenceOnlyMismatches.length === 0 &&
      skippedUnknownCompatibilityClaimMismatches.length === 0 &&
      skippedCompatibilityClaimWorkerIds.length === 0 &&
      skippedPublicCompatibilityViolations.length === 0 &&
      skippedBlockedAdmissionClaimViolations.length === 0 &&
      skippedPromotionLeakWorkerIds.length === 0 &&
      skippedPublicCompatibilityClaimKeyMismatches.length === 0 &&
      skippedBlockedSurfaceMismatches.length === 0 &&
      skippedBlockedPublicClaimMismatches.length === 0 &&
      skippedBlockedAdmissionClaimMismatches.length === 0,
    acceptedDiagnosticsRecognized: acceptedDiagnosticMismatches.length === 0,
    dependenciesRecognized:
      dependencyMismatches.length === 0 &&
      dependencyDiagnosticMismatches.length === 0,
    blockerContextRecognized:
      blockerContextMismatches.length === 0 &&
      blockerContextDiagnosticMismatches.length === 0,
    evidenceRecognized:
      evidenceTokenMismatches.length === 0 &&
      evidenceShapeMismatches.length === 0,
    blockedPublicSurfacesRecognized: blockedSurfaceMismatches.length === 0,
    blockedPublicClaimsRecognized:
      blockedPublicClaimMismatches.length === 0 &&
      publicCompatibilityClaimKeyMismatches.length === 0,
    blockedAdmissionClaimsRecognized:
      blockedAdmissionClaimMismatches.length === 0 &&
      blockedAdmissionClaimViolations.length === 0,
    compatibilityClaimed:
      compatibilityClaimWorkerIds.length > 0 ||
      unknownCompatibilityClaimMismatches.length > 0 ||
      publicCompatibilityViolations.length > 0 ||
      blockedAdmissionClaimViolations.length > 0 ||
      promotionLeakWorkerIds.length > 0,
    publicCompatibilityClaimed: publicCompatibilityViolations.length > 0,
    publicCompatibilityViolationIds: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolationIds: freezeArray(
      blockedAdmissionClaimViolations
    ),
    rowOverrideReadFailures: freezeArray(rowOverrideReadFailures),
    reportArrayShapeMismatches: freezeArray(reportArrayShapeMismatches),
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

function staticMetadataMismatchesForInput({ baseRow, row }) {
  return PRIVATE_ADMISSION_729_731_STATIC_METADATA_FIELDS.flatMap((field) => {
    if (Object.is(row[field], baseRow[field])) {
      return [];
    }

    return [
      freezeRecord({
        workerId: row.workerId,
        baseWorkerId: baseRow.workerId,
        field,
        expected: baseRow[field],
        actual: row[field]
      })
    ];
  });
}

function mergeRowOverride(baseRow, overrideRecord) {
  return freezeRecord({
    ...baseRow,
    ...overrideRecord,
    publicCompatibilityClaims: mergeClaimContainer({
      allowedKeys: PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
      baseClaims: baseRow.publicCompatibilityClaims,
      location: "row-override.publicCompatibilityClaims",
      overrideClaims: overrideRecord.publicCompatibilityClaims
    }),
    blockedAdmissionClaims: mergeClaimContainer({
      allowedKeys: PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
      baseClaims: baseRow.blockedAdmissionClaims,
      location: "row-override.blockedAdmissionClaims",
      overrideClaims: overrideRecord.blockedAdmissionClaims
    })
  });
}

function readRowOverrideRecord(override) {
  if (
    override == null ||
    (typeof override !== "object" && typeof override !== "function")
  ) {
    return freezeRecord({});
  }

  let keys;
  try {
    keys = Reflect.ownKeys(override);
  } catch {
    keys = [];
  }

  const ownKeyNames = new Set(keys.map((key) => propertyKeyText(key)));
  const entries = [];
  const readFailures = [];

  for (const key of keys) {
    const property = readOwnClaimProperty(override, key);
    if (property.ok === true) {
      entries.push([key, property.value]);
    } else {
      addRowOverrideReadFailure({
        entries,
        key: propertyKeyText(key),
        property,
        readFailures
      });
    }
  }

  for (const [key, property] of readHiddenRowOverrideProperties({
    ownKeyNames,
    value: override
  })) {
    if (property.ok === true) {
      entries.push([key, property.value]);
    } else {
      addRowOverrideReadFailure({
        entries,
        key,
        property,
        readFailures
      });
    }
  }

  const record = Object.fromEntries(entries);
  Object.defineProperty(record, PRIVATE_ADMISSION_729_731_ROW_OVERRIDE_READ_FAILURES, {
    enumerable: false,
    value: freezeArray(readFailures)
  });
  return freezeRecord(record);
}

function addRowOverrideReadFailure({ entries, key, property, readFailures }) {
  if (!PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEY_SET.has(key)) {
    return;
  }

  readFailures.push(
    freezeRecord({
      location: "row-override",
      key,
      reason: property.reason
    })
  );
  entries.push([key, failClosedRowOverrideValue(key)]);
}

function failClosedRowOverrideValue(key) {
  switch (key) {
    case "acceptedDiagnosticIds":
    case "blockedAdmissionClaimIds":
    case "blockedPublicClaims":
    case "blockedPublicCompatibilitySurfaces":
    case "blockerContextDiagnosticIds":
    case "blockerContextWorkerIds":
    case "dependencyDiagnosticIds":
    case "dependencyWorkerIds":
    case "evidence":
      return freezeArray([]);
    case "area":
      return "unreadable-area";
    case "compatibilityClaimed":
      return true;
    case "localGateCoverage":
      return "unreadable-local-gate-coverage";
    case "privateAdmission":
      return "unreadable-private-admission";
    case "privateEvidenceOnly":
      return false;
    case "primaryCompatibilityArea":
      return "unreadable-primary-compatibility-area";
    case "promotion":
      return "accepted-public";
    case "publicCompatibilityClaims":
      return freezeRecord({
        publicPackageCompatibilityClaimed: true
      });
    case "blockedAdmissionClaims":
      return freezeRecord({
        nativeExecutionAdmissionClaimed: true
      });
    case "recognized":
      return false;
    case "runtimeCapabilityAdded":
      return true;
    case "skipReason":
      return "unreadable-skip-reason";
    case "sourceQueue":
      return "unreadable-source-queue";
    case "workerId":
      return "<unreadable-worker-id>";
    default:
      return undefined;
  }
}

function getRowOverrideReadFailures(overrideRecord) {
  return overrideRecord[PRIVATE_ADMISSION_729_731_ROW_OVERRIDE_READ_FAILURES] ?? [];
}

function readHiddenRowOverrideProperties({ ownKeyNames, value }) {
  return PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEYS.flatMap(
    (key) => {
      if (ownKeyNames.has(key)) {
        return [];
      }

      const property = readHiddenRowOverrideProperty(value, key);
      if (property.ok !== true || property.found === true) {
        return [[key, property]];
      }

      return [];
    }
  );
}

function readHiddenRowOverrideProperty(value, key) {
  try {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor != null) {
      return readDescriptorProperty({ descriptor, key, receiver: value });
    }
  } catch (error) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `hidden-compatibility-claim-descriptor-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      found: true
    });
  }

  const property = readClaimProperty(value, key);
  if (property.ok !== true || property.value !== undefined) {
    return freezeRecord({
      ...property,
      found: true
    });
  }

  return freezeRecord({
    ...property,
    found: false
  });
}

function mergeClaimContainer({
  allowedKeys,
  baseClaims,
  location,
  overrideClaims
}) {
  const mergedClaims = { ...baseClaims };
  const inspection = inspectClaimContainer({
    allowedKeys,
    location,
    value: overrideClaims
  });

  for (const [key, value] of inspection.entries) {
    mergedClaims[key] = value;
  }

  return freezeRecord(mergedClaims);
}

function evaluatePrivateAdmissionRow({
  baseRow,
  fileCache,
  override,
  overrideRecord,
  row,
  workspaceRoot
}) {
  const publicCompatibilityClaimInspection = inspectClaimContainer({
    allowedKeys: PRIVATE_ADMISSION_729_731_PUBLIC_COMPATIBILITY_CLAIMS,
    location: "row-override.publicCompatibilityClaims",
    value: overrideRecord.publicCompatibilityClaims
  });
  const blockedAdmissionClaimInspection = inspectClaimContainer({
    allowedKeys: PRIVATE_ADMISSION_729_731_BLOCKED_ADMISSION_CLAIMS,
    location: "row-override.blockedAdmissionClaims",
    value: overrideRecord.blockedAdmissionClaims
  });
  const rowOverrideReadFailures = getRowOverrideReadFailures(overrideRecord);
  const evidenceEvaluation = evaluateEvidenceRows({
    actualEvidence: row.evidence,
    expectedEvidence: baseRow.evidence,
    fileCache,
    workspaceRoot
  });
  const unknownCompatibilityClaimKeys = [
    ...findUnknownCompatibilityClaimKeys({
      allowedKeys: PRIVATE_ADMISSION_729_731_ROW_KEYS,
      location: "row",
      value: row
    }),
    ...findUnknownCompatibilityClaimKeys({
      allowedKeys: PRIVATE_ADMISSION_729_731_ROW_KEYS,
      location: "row-override",
      value: override
    }),
    ...publicCompatibilityClaimInspection.unknownCompatibilityClaimKeys,
    ...blockedAdmissionClaimInspection.unknownCompatibilityClaimKeys,
    ...evidenceEvaluation.unknownCompatibilityClaimKeys
  ];
  const publicCompatibilityViolations = claimContainerEntries(
    row.publicCompatibilityClaims
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);
  const blockedAdmissionClaimViolations = claimContainerEntries(
    row.blockedAdmissionClaims
  )
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidenceEvaluation.evidence),
    evidenceRecognized: evidenceEvaluation.recognized,
    evidenceShapeMismatches: freezeArray(evidenceEvaluation.shapeMismatches),
    rowOverrideReadFailures: freezeArray(rowOverrideReadFailures),
    unknownCompatibilityClaimKeys: freezeArray(unknownCompatibilityClaimKeys),
    recognized:
      evidenceEvaluation.recognized === true &&
      rowOverrideReadFailures.length === 0 &&
      unknownCompatibilityClaimKeys.length === 0 &&
      row.recognized !== false,
    publicCompatibilityViolations: freezeArray(publicCompatibilityViolations),
    blockedAdmissionClaimViolations: freezeArray(
      blockedAdmissionClaimViolations
    )
  });
}

function evaluateEvidenceRows({
  actualEvidence,
  expectedEvidence,
  fileCache,
  workspaceRoot
}) {
  const actualEvidenceResult = readArrayShape(actualEvidence, "evidence");
  const actualRows =
    actualEvidenceResult.ok === true ? actualEvidenceResult.values : [];
  const shapeMismatches = [];
  const unknownCompatibilityClaimKeys = [];

  if (actualEvidenceResult.ok !== true) {
    shapeMismatches.push(
      freezeRecord({
        role: null,
        path: null,
        reason: actualEvidenceResult.reason
      })
    );
  }

  const actualRowsByRole = new Map();
  for (const actualRow of actualRows) {
    unknownCompatibilityClaimKeys.push(
      ...findUnknownCompatibilityClaimKeys({
        allowedKeys: PRIVATE_ADMISSION_729_731_EVIDENCE_KEYS,
        location: "evidence",
        value: actualRow
      })
    );
    if (actualRow == null || typeof actualRow !== "object") {
      shapeMismatches.push(
        freezeRecord({
          role: null,
          path: null,
          reason: "evidence-row-not-object"
        })
      );
      continue;
    }
    const roleProperty = readEvidenceRowField(actualRow, "role");
    const pathProperty = readEvidenceRowField(actualRow, "path");
    const tokensProperty = readEvidenceRowField(actualRow, "tokens");
    if (
      roleProperty.ok !== true ||
      pathProperty.ok !== true ||
      tokensProperty.ok !== true
    ) {
      for (const [field, property] of [
        ["role", roleProperty],
        ["path", pathProperty],
        ["tokens", tokensProperty]
      ]) {
        if (property.ok === true) {
          continue;
        }
        shapeMismatches.push(
          freezeRecord({
            role: roleProperty.ok === true ? roleProperty.value : null,
            path: pathProperty.ok === true ? pathProperty.value : null,
            field,
            reason: property.reason
          })
        );
      }
      continue;
    }
    if (typeof roleProperty.value !== "string") {
      shapeMismatches.push(
        freezeRecord({
          role: null,
          path: pathProperty.value ?? null,
          reason: "evidence-row-role-missing"
        })
      );
      continue;
    }
    if (actualRowsByRole.has(roleProperty.value)) {
      shapeMismatches.push(
        freezeRecord({
          role: roleProperty.value,
          path: pathProperty.value ?? null,
          reason: "duplicate-evidence-role"
        })
      );
      continue;
    }
    actualRowsByRole.set(
      roleProperty.value,
      freezeRecord({
        path: pathProperty.value,
        role: roleProperty.value,
        tokens: tokensProperty.value
      })
    );
  }

  const expectedRoles = new Set(expectedEvidence.map((row) => row.role));
  for (const actualRow of actualRowsByRole.values()) {
    if (!expectedRoles.has(actualRow.role)) {
      shapeMismatches.push(
        freezeRecord({
          role: actualRow.role,
          path: actualRow.path ?? null,
          reason: "unexpected-evidence-role"
        })
      );
    }
  }

  const evaluatedEvidence = expectedEvidence.map((expectedRow) => {
    const actualRow = actualRowsByRole.get(expectedRow.role) ?? null;
    return evaluateEvidenceRow({
      actualEvidenceRow: actualRow,
      expectedEvidenceRow: expectedRow,
      fileCache,
      shapeMismatches,
      workspaceRoot
    });
  });
  const recognized =
    shapeMismatches.length === 0 &&
    evaluatedEvidence.every((evidenceRow) => evidenceRow.recognized === true);

  return freezeRecord({
    evidence: freezeArray(evaluatedEvidence),
    recognized,
    shapeMismatches: freezeArray(shapeMismatches),
    unknownCompatibilityClaimKeys: freezeArray(unknownCompatibilityClaimKeys)
  });
}

function evaluateEvidenceRow({
  actualEvidenceRow,
  expectedEvidenceRow,
  fileCache,
  shapeMismatches,
  workspaceRoot
}) {
  const actualPath = actualEvidenceRow?.path ?? null;
  if (actualEvidenceRow == null) {
    shapeMismatches.push(
      freezeRecord({
        role: expectedEvidenceRow.role,
        path: expectedEvidenceRow.path,
        reason: "required-evidence-role-missing"
      })
    );
  } else if (actualPath !== expectedEvidenceRow.path) {
    shapeMismatches.push(
      freezeRecord({
        role: expectedEvidenceRow.role,
        expectedPath: expectedEvidenceRow.path,
        actualPath,
        reason: "evidence-path-mismatch"
      })
    );
  }

  const actualTokenResult =
    actualEvidenceRow == null
      ? freezeRecord({
          ok: false,
          values: freezeArray([]),
          reason: "required-evidence-role-missing"
        })
      : readArrayShape(actualEvidenceRow.tokens, "tokens");
  const actualTokens =
    actualTokenResult.ok === true ? actualTokenResult.values : [];
  const expectedTokens = expectedEvidenceRow.tokens;
  if (actualTokenResult.ok !== true) {
    shapeMismatches.push(
      freezeRecord({
        role: expectedEvidenceRow.role,
        path: expectedEvidenceRow.path,
        reason: actualTokenResult.reason
      })
    );
  } else if (actualTokens.length === 0) {
    shapeMismatches.push(
      freezeRecord({
        role: expectedEvidenceRow.role,
        path: expectedEvidenceRow.path,
        reason: "evidence-token-array-empty"
      })
    );
  }
  if (
    actualTokenResult.ok === true &&
    sameStringSet(expectedTokens, actualTokens) !== true
  ) {
    shapeMismatches.push(
      freezeRecord({
        role: expectedEvidenceRow.role,
        path: expectedEvidenceRow.path,
        reason: "evidence-token-list-mismatch",
        expectedTokens,
        actualTokens: freezeArray(actualTokens)
      })
    );
  }

  const tokensToCheck = freezeArray(
    new Set([...expectedTokens, ...actualTokens])
  );
  const source = readWorkspaceFile({
    fileCache,
    workspaceRoot,
    path: expectedEvidenceRow.path
  });
  const tokenResults = tokensToCheck.map((token) =>
    freezeRecord({
      token,
      present: source.text.includes(token)
    })
  );
  const missingTokens = tokenResults
    .filter((tokenResult) => tokenResult.present !== true)
    .map((tokenResult) => tokenResult.token);

  return freezeRecord({
    ...expectedEvidenceRow,
    tokenResults: freezeArray(tokenResults),
    missingTokens: freezeArray(missingTokens),
    recognized:
      source.ok === true &&
      actualEvidenceRow != null &&
      actualPath === expectedEvidenceRow.path &&
      actualTokenResult.ok === true &&
      actualTokens.length > 0 &&
      sameStringSet(expectedTokens, actualTokens) === true &&
      missingTokens.length === 0,
    readError: source.error
  });
}

function readEvidenceRowField(row, key) {
  let descriptor;
  try {
    descriptor = Reflect.getOwnPropertyDescriptor(row, key);
  } catch (error) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `evidence-${key}-descriptor-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }

  if (descriptor == null) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `evidence-${key}-descriptor-missing`
    });
  }

  let descriptorValue;
  try {
    if (Object.hasOwn(descriptor, "value")) {
      descriptorValue = descriptor.value;
    } else if (typeof descriptor.get === "function") {
      descriptorValue = descriptor.get.call(row);
    } else {
      return freezeRecord({
        ok: false,
        value: undefined,
        reason: `evidence-${key}-accessor-missing`
      });
    }
  } catch (error) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `evidence-${key}-accessor-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }

  const liveProperty = readClaimProperty(row, key);
  if (liveProperty.ok !== true) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `evidence-${key}-${liveProperty.reason}`
    });
  }

  if (!Object.is(descriptorValue, liveProperty.value)) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `evidence-${key}-descriptor-get-mismatch`
    });
  }

  return freezeRecord({
    ok: true,
    value: liveProperty.value,
    reason: null
  });
}

function sanitizeEvaluatedRow(row) {
  const arrayFields = [
    "acceptedDiagnosticIds",
    "blockedAdmissionClaimIds",
    "blockedPublicClaims",
    "blockedPublicCompatibilitySurfaces",
    "blockerContextDiagnosticIds",
    "blockerContextWorkerIds",
    "dependencyDiagnosticIds",
    "dependencyWorkerIds"
  ].map((fieldName) => sanitizeArrayField(row, fieldName));
  const sanitizedFields = Object.fromEntries(
    arrayFields.map((field) => [field.name, field.value])
  );

  return freezeRecord({
    row: freezeRecord({
      ...row,
      ...sanitizedFields
    }),
    arrayShapeMismatches: freezeArray(
      arrayFields.flatMap((field) =>
        field.shapeMismatch == null ? [] : [field.shapeMismatch]
      )
    )
  });
}

function sanitizeArrayField(row, fieldName) {
  const value = row[fieldName];
  const result = readArrayShape(value, fieldName);
  if (result.ok === true) {
    return freezeRecord({
      name: fieldName,
      value: result.values,
      shapeMismatch: null
    });
  }

  return freezeRecord({
    name: fieldName,
    value: freezeArrayValue(value),
    shapeMismatch: freezeRecord({
      workerId: row.workerId,
      field: fieldName,
      reason: result.reason
    })
  });
}

function readArrayShape(value, fieldName) {
  if (!Array.isArray(value)) {
    return freezeRecord({
      ok: false,
      values: freezeArray([]),
      reason: `${fieldName}-not-array`
    });
  }

  let isFrozen;
  let lengthDescriptor;
  let liveLength;
  let ownKeys;
  let values;
  try {
    isFrozen = Object.isFrozen(value);
    lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    liveLength = Reflect.get(value, "length");
    ownKeys = Reflect.ownKeys(value);
    values = Array.from(value);
  } catch (error) {
    return freezeRecord({
      ok: false,
      values: freezeArray([]),
      reason: `${fieldName}-array-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }

  let shapeMismatch;
  try {
    shapeMismatch = arrayShapeMismatch({
      array: value,
      isFrozen,
      lengthDescriptor,
      liveLength,
      ownKeys,
      values
    });
  } catch (error) {
    return freezeRecord({
      ok: false,
      values: freezeArray([]),
      reason: `${fieldName}-array-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }
  if (shapeMismatch != null) {
    return freezeRecord({
      ok: false,
      values: freezeArray([]),
      reason: `${fieldName}-${shapeMismatch}`
    });
  }

  if (
    fieldName === "tokens" &&
    values.some((value) => typeof value !== "string")
  ) {
    return freezeRecord({
      ok: false,
      values: freezeArray([]),
      reason: "tokens-array-contains-non-string"
    });
  }

  return freezeRecord({
    ok: true,
    values: freezeArray(values),
    reason: null
  });
}

function arrayShapeMismatch({
  array,
  isFrozen,
  lengthDescriptor,
  liveLength,
  ownKeys,
  values
}) {
  if (isFrozen !== true) {
    return "array-not-frozen";
  }

  if (
    lengthDescriptor == null ||
    !Object.hasOwn(lengthDescriptor, "value") ||
    !Number.isSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0
  ) {
    return "array-length-descriptor-invalid";
  }

  const expectedKeys = new Set([
    ...values.map((_, index) => String(index)),
    "length"
  ]);
  if (
    ownKeys.length !== expectedKeys.size ||
    ownKeys.some((key) => typeof key !== "string" || !expectedKeys.has(key))
  ) {
    return "array-own-key-mismatch";
  }

  if (liveLength !== values.length || lengthDescriptor.value !== values.length) {
    return "array-length-mismatch";
  }

  const nextIndex = String(values.length);
  if (
    Reflect.getOwnPropertyDescriptor(array, nextIndex) != null ||
    Reflect.get(array, nextIndex) !== undefined ||
    Reflect.get(array, nextIndex) !== undefined
  ) {
    return "array-next-index-visible";
  }

  for (const [index, value] of values.entries()) {
    const key = String(index);
    const descriptor = Reflect.getOwnPropertyDescriptor(array, key);
    if (descriptor == null || !Object.hasOwn(descriptor, "value")) {
      return "array-index-descriptor-invalid";
    }
    const liveValue = Reflect.get(array, key);
    if (!Object.is(descriptor.value, liveValue)) {
      return "array-index-descriptor-get-mismatch";
    }
    if (!Object.is(liveValue, value)) {
      return "array-index-iteration-mismatch";
    }
  }

  return null;
}

function inspectClaimContainer({ allowedKeys, location, value }) {
  if (value == null || value === false) {
    return freezeRecord({
      entries: freezeArray([]),
      unknownCompatibilityClaimKeys: freezeArray([])
    });
  }

  if (typeof value !== "object" && typeof value !== "function") {
    return freezeRecord({
      entries: freezeArray(value ? [[allowedKeys[0], true]] : []),
      unknownCompatibilityClaimKeys: freezeArray([])
    });
  }

  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch (error) {
    keys = [];
    return freezeRecord({
      entries: freezeArray(readHiddenClaimContainerEntries(value)),
      unknownCompatibilityClaimKeys: freezeArray([
        freezeRecord({
          location,
          key: "<ownKeys>",
          reason: `own-keys-unreadable: ${
            error instanceof Error ? error.message : String(error)
          }`
        })
      ])
    });
  }

  const allowedKeySet = new Set(allowedKeys);
  const ownKeyNames = new Set(keys.map((key) => propertyKeyText(key)));
  const entries = [];
  const unknownCompatibilityClaimKeys = [];

  for (const key of keys) {
    const keyText = propertyKeyText(key);
    const property = readOwnClaimProperty(value, key);

    if (property.ok === true) {
      entries.push([key, property.value]);
    }

    if (property.ok !== true) {
      if (allowedKeySet.has(keyText)) {
        entries.push([key, true]);
      }
      if (allowedKeySet.has(keyText) || isCompatibilityClaimLikeKey(keyText)) {
        unknownCompatibilityClaimKeys.push(
          freezeRecord({
            location,
            key: keyText,
            reason: property.reason
          })
        );
      }
      continue;
    }

    if (
      allowedKeySet.has(keyText) ||
      !isCompatibilityClaimLikeKey(keyText) ||
      property.value === false
    ) {
      continue;
    }

    unknownCompatibilityClaimKeys.push(
      freezeRecord({
        location,
        key: keyText,
        reason: "unknown-compatibility-claim-key"
      })
    );
  }

  for (const [key, property] of readHiddenClaimContainerProperties({
    ownKeyNames,
    value
  })) {
    if (property.ok === true) {
      entries.push([key, property.value]);
    }

    if (property.ok !== true) {
      unknownCompatibilityClaimKeys.push(
        freezeRecord({
          location,
          key,
          reason: property.reason
        })
      );
      continue;
    }

    if (allowedKeySet.has(key) || property.value === false) {
      continue;
    }

    unknownCompatibilityClaimKeys.push(
      freezeRecord({
        location,
        key,
        reason: "hidden-compatibility-claim-key"
      })
    );
  }

  return freezeRecord({
    entries: freezeArray(entries),
    unknownCompatibilityClaimKeys: freezeArray(unknownCompatibilityClaimKeys)
  });
}

function readHiddenClaimContainerEntries(value) {
  return readHiddenClaimContainerProperties({
    ownKeyNames: new Set(),
    value
  })
    .filter(([, property]) => property.ok === true)
    .map(([key, property]) => [key, property.value]);
}

function readHiddenClaimContainerProperties({ ownKeyNames, value }) {
  return PRIVATE_ADMISSION_729_731_HIDDEN_COMPATIBILITY_CLAIM_PROBE_KEYS.flatMap(
    (key) => {
      if (ownKeyNames.has(key)) {
        return [];
      }

      const property = readHiddenRowOverrideProperty(value, key);
      if (property.ok !== true || property.found === true) {
        return [[key, property]];
      }

      return [];
    }
  );
}

function readOwnClaimProperty(value, key) {
  try {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor != null) {
      return readDescriptorProperty({ descriptor, key, receiver: value });
    }
  } catch (error) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `hidden-compatibility-claim-descriptor-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`,
      found: true
    });
  }

  return readClaimProperty(value, key);
}

function readDescriptorProperty({ descriptor, key, receiver }) {
  if (Object.hasOwn(descriptor, "value")) {
    return reconcileDescriptorPropertyValue({
      descriptorValue: descriptor.value,
      key,
      receiver
    });
  }

  if (typeof descriptor.get === "function") {
    try {
      return reconcileDescriptorPropertyValue({
        descriptorValue: descriptor.get.call(receiver),
        key,
        receiver
      });
    } catch (error) {
      return freezeRecord({
        ok: false,
        value: undefined,
        reason: `hidden-compatibility-claim-accessor-unreadable: ${
          error instanceof Error ? error.message : String(error)
        }`,
        found: true
      });
    }
  }

  return freezeRecord({
    ok: false,
    value: undefined,
    reason: "hidden-compatibility-claim-accessor-missing",
    found: true
  });
}

function reconcileDescriptorPropertyValue({ descriptorValue, key, receiver }) {
  const liveProperty = readClaimProperty(receiver, key);
  const descriptorClaims = isCompatibilityClaimingValue(descriptorValue);
  const keyText = propertyKeyText(key);

  if (liveProperty.ok !== true) {
    if (PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEY_SET.has(keyText)) {
      return freezeRecord({
        ...liveProperty,
        found: true
      });
    }

    if (descriptorClaims) {
      return freezeRecord({
        ok: true,
        value: descriptorValue,
        reason: null,
        found: true
      });
    }

    return freezeRecord({
      ...liveProperty,
      found: true
    });
  }

  const liveClaims = isCompatibilityClaimingValue(liveProperty.value);
  if (
    !Object.is(liveProperty.value, descriptorValue) &&
    PRIVATE_ADMISSION_729_731_HIDDEN_ROW_OVERRIDE_PROBE_KEY_SET.has(keyText)
  ) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: "hidden-compatibility-claim-descriptor-get-mismatch",
      found: true
    });
  }

  if (
    !Object.is(liveProperty.value, descriptorValue) &&
    liveClaims === descriptorClaims
  ) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: "hidden-compatibility-claim-descriptor-get-mismatch",
      found: true
    });
  }

  if (liveClaims && !descriptorClaims) {
    return freezeRecord({
      ok: true,
      value: liveProperty.value,
      reason: null,
      found: true
    });
  }

  return freezeRecord({
    ok: true,
    value: descriptorValue,
    reason: null,
    found: true
  });
}

function isCompatibilityClaimingValue(value) {
  return value != null && value !== false;
}

function readClaimProperty(value, key) {
  try {
    return freezeRecord({
      ok: true,
      value: Reflect.get(value, key),
      reason: null
    });
  } catch (error) {
    return freezeRecord({
      ok: false,
      value: undefined,
      reason: `hidden-compatibility-claim-unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    });
  }
}

function findUnknownCompatibilityClaimKeys({ allowedKeys, location, value }) {
  if (
    value == null ||
    (typeof value !== "object" && typeof value !== "function")
  ) {
    return [];
  }

  let keys;
  try {
    keys = Reflect.ownKeys(value);
  } catch (error) {
    return [
      freezeRecord({
        location,
        key: "<ownKeys>",
        reason: `own-keys-unreadable: ${
          error instanceof Error ? error.message : String(error)
        }`
      })
    ];
  }

  const allowedKeySet = new Set(allowedKeys);
  const ownKeyNames = new Set(keys.map((key) => propertyKeyText(key)));
  const ownKeyClaimKeys = keys.flatMap((key) => {
    const keyText = propertyKeyText(key);
    if (allowedKeySet.has(keyText) || !isCompatibilityClaimLikeKey(keyText)) {
      return [];
    }
    return [
      freezeRecord({
        location,
        key: keyText,
        reason: "unknown-compatibility-claim-key"
      })
    ];
  });

  return [
    ...ownKeyClaimKeys,
    ...findHiddenCompatibilityClaimKeys({
      allowedKeySet,
      location,
      ownKeyNames,
      value
    })
  ];
}

function findHiddenCompatibilityClaimKeys({
  allowedKeySet,
  location,
  ownKeyNames,
  value
}) {
  return PRIVATE_ADMISSION_729_731_HIDDEN_COMPATIBILITY_CLAIM_PROBE_KEYS.flatMap(
    (key) => {
      if (allowedKeySet.has(key) || ownKeyNames.has(key)) {
        return [];
      }

      const property = readHiddenRowOverrideProperty(value, key);
      if (property.ok !== true) {
        return [
          freezeRecord({
            location,
            key,
            reason: property.reason
          })
        ];
      }

      if (property.found !== true) {
        return [];
      }

      return [
        freezeRecord({
          location,
          key,
          reason: "hidden-compatibility-claim-key"
        })
      ];
    }
  );
}

function isCompatibilityClaimLikeKey(key) {
  return /(?:admission|claim|compatib(?:le|ility)|native|package|public|root)/i.test(
    key
  );
}

function compatibilityClaimProbeStem(claimId) {
  return claimId.replace(
    /(?:CompatibilityClaimed|AdmissionClaimed|Claimed)$/,
    ""
  );
}

function propertyKeyText(key) {
  return typeof key === "symbol" ? `Symbol(${key.description ?? ""})` : key;
}

function claimContainerKeyNames(value) {
  if (value == null || (typeof value !== "object" && typeof value !== "function")) {
    return freezeArray([]);
  }
  return freezeArray(
    Reflect.ownKeys(value).map((key) => propertyKeyText(key))
  );
}

function claimContainerEntries(value) {
  if (value == null || (typeof value !== "object" && typeof value !== "function")) {
    return [];
  }
  return Reflect.ownKeys(value).map((key) => [propertyKeyText(key), value[key]]);
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
  const leftShape = readArrayShape(left, "string-set-left");
  const rightShape = readArrayShape(right, "string-set-right");
  if (leftShape.ok !== true || rightShape.ok !== true) {
    return false;
  }

  const leftValues = leftShape.values;
  const rightValues = rightShape.values;
  if (
    leftValues.some((value) => typeof value !== "string") ||
    rightValues.some((value) => typeof value !== "string")
  ) {
    return false;
  }

  if (leftValues.length !== rightValues.length) {
    return false;
  }

  const leftSet = new Set(leftValues);
  const rightSet = new Set(rightValues);
  if (
    leftSet.size !== leftValues.length ||
    rightSet.size !== rightValues.length
  ) {
    return false;
  }

  return leftValues.every((value) => rightSet.has(value));
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

function freezeArrayValue(value) {
  if (!Array.isArray(value)) {
    return value;
  }

  try {
    return freezeArray(value);
  } catch (error) {
    return freezeRecord({
      unreadableArray: error instanceof Error ? error.message : String(error)
    });
  }
}

function isEmptyArray(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  try {
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    if (lengthDescriptor == null || lengthDescriptor.value !== 0) {
      return false;
    }
    if (Reflect.get(value, "length") !== 0) {
      return false;
    }
    if (Reflect.ownKeys(value).some((key) => key !== "length")) {
      return false;
    }
    if (Reflect.get(value, "0") !== undefined) {
      return false;
    }
    return Array.from(value).length === 0;
  } catch {
    return false;
  }
}

function freezeRecord(value) {
  return Object.freeze(value);
}
