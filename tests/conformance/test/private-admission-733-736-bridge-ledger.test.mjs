import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS,
  PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS,
  PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS,
  PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS,
  PRIVATE_ADMISSION_733_736_BRIDGE_ROWS,
  PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS,
  evaluatePrivateAdmission733736BridgeLedger
} from "../src/private-admission-733-736-bridge-ledger.mjs";
import {
  PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-734-736-gate.mjs";

const worker733 = "worker-733-test-renderer-unmount-finished-work-identity";
const worker736 = "worker-736-nested-tojson-source-report-identity";
const expectedWorkers = [worker733, worker736];
const testRendererRustSource = "crates/fast-react-test-renderer/src/lib.rs";
const rustIdentifierTokenPolicy =
  "rust-source-identifiers-statuses-function-and-field-names";

test("private admission 733-736 bridge ledger records Worker 733 and Worker 736 bridge prerequisites", () => {
  assert.deepEqual(PRIVATE_ADMISSION_733_736_BRIDGE_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.length, 2);

  assert.deepEqual(
    PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS
  );

  assertSubset(
    PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS.surfaces,
    PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
      .publicCompatibilityClaims,
    PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_CARRY_FORWARD_BLOCKERS
      .blockedAdmissionClaims,
    PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS
  );

  const unmountRow = PRIVATE_ADMISSION_733_736_BRIDGE_ROWS[0];
  assertBridgeRow(unmountRow, {
    workerId: worker733,
    bridgeScope: "unmount-finished-work-identity-to-native-serialization",
    binding: PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS[worker733],
    evidenceIds: [
      "worker-733-unmount-native-admission-struct",
      "worker-733-unmount-native-status-constants",
      "worker-733-unmount-native-record-validators",
      "worker-733-unmount-handoff-matches-identity",
      "worker-733-unmount-finished-work-identity-builder"
    ]
  });

  const nestedRow = PRIVATE_ADMISSION_733_736_BRIDGE_ROWS[1];
  assertBridgeRow(nestedRow, {
    workerId: worker736,
    bridgeScope: "nested-tojson-source-report-finished-work-identity",
    binding: PRIVATE_ADMISSION_733_736_BRIDGE_REQUIRED_BINDINGS[worker736],
    evidenceIds: [
      "worker-736-update-route-admission-record",
      "worker-736-nested-report-struct",
      "worker-736-nested-current-fibers-variant",
      "worker-736-nested-current-fibers-validator",
      "worker-736-nested-json-report-builder",
      "worker-736-nested-json-source-nodes",
      "worker-736-nested-identity-builder",
      "worker-736-generic-finished-work-source-report-identity",
      "worker-736-reconciler-nested-inspection-report",
      "worker-736-reconciler-nested-inspection-builder"
    ]
  });
});

test("private admission 733-736 bridge ledger recognizes Rust identifiers without public compatibility", () => {
  const ledger = evaluatePrivateAdmission733736BridgeLedger();

  assert.equal(ledger.status, PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_STATUS);
  assert.equal(ledger.privateBridgePrerequisitesRecognized, true);
  assert.equal(ledger.rustEvidenceRecognized, true);
  assert.equal(ledger.bridgeBindingsRecognized, true);
  assert.equal(ledger.blockerCarryForwardRecognized, true);
  assert.equal(ledger.publicCompatibilityClaimed, false);
  assert.deepEqual(ledger.violations, []);
  assert.deepEqual(ledger.queueWorkers, expectedWorkers);
  assert.deepEqual(ledger.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(ledger.publicCompatibilityViolationIds, []);
  assert.deepEqual(ledger.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(ledger.nativeJsPackageLeakClaimIds, []);
  assert.deepEqual(ledger.manifest.missingWorkerIds, []);
  assert.deepEqual(ledger.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(ledger.manifest.duplicateWorkerIds, []);

  for (const row of ledger.rows) {
    assert.equal(row.sourceQueue, "733-736-bridge");
    assert.equal(row.runtimeCapabilityAdded, false);
    assert.equal(row.privateEvidenceOnly, true);
    assertNoPublicOrAdmissionClaims(row);
    for (const evidenceRow of row.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.evidenceId);
      assert.equal(evidenceRow.tokenPolicy, rustIdentifierTokenPolicy);
      assert.match(evidenceRow.path, /^crates\/fast-react-/);
      assert.equal(evidenceRow.path.includes("/test/"), false);
      assert.equal(evidenceRow.path.includes("worker-progress"), false);
      assert.deepEqual(evidenceRow.missingTokens, []);
      assert.deepEqual(evidenceRow.forbiddenTokensPresent, []);
      assert.equal(
        evidenceRow.tokens.some((token) => token.includes("panic!(")),
        false,
        evidenceRow.evidenceId
      );
      assert.equal(
        evidenceRow.tokens.some((token) => token.includes("reason:")),
        false,
        evidenceRow.evidenceId
      );
    }
  }
});

test("private admission 733-736 bridge ledger rejects corrupted Worker 733 cleanup handoff metadata", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSource,
    find: "cleanup_handoff_id: &'static str,",
    replace: "cleanup_route_handoff_id: &'static str,"
  });

  try {
    const ledger = evaluatePrivateAdmission733736BridgeLedger({
      workspaceRoot: workspace.root
    });

    assert.equal(
      ledger.status,
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS
    );
    assert.equal(ledger.privateBridgePrerequisitesRecognized, false);
    assert.equal(ledger.rustEvidenceRecognized, false);
    assertEvidenceRecognized(
      ledger,
      worker733,
      "worker-733-unmount-native-admission-struct",
      false
    );
    assertEvidenceRecognized(
      ledger,
      worker736,
      "worker-736-nested-report-struct",
      true
    );
    assertViolationIds(ledger, ["bridge-rust-source-identifier-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 733-736 bridge ledger rejects corrupted Worker 736 source-report node ownership", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSource,
    find: "fiber: Self::private_json_fiber_diagnostic(host_texts[index]),",
    replace: "fiber: Self::private_json_fiber_diagnostic(host_texts[0]),"
  });

  try {
    const ledger = evaluatePrivateAdmission733736BridgeLedger({
      workspaceRoot: workspace.root
    });

    assert.equal(
      ledger.status,
      PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS
    );
    assert.equal(ledger.privateBridgePrerequisitesRecognized, false);
    assert.equal(ledger.rustEvidenceRecognized, false);
    assertEvidenceRecognized(
      ledger,
      worker736,
      "worker-736-nested-json-source-nodes",
      false
    );
    assertEvidenceRecognized(
      ledger,
      worker733,
      "worker-733-unmount-finished-work-identity-builder",
      true
    );
    assertViolationIds(ledger, ["bridge-rust-source-identifier-missing"]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 733-736 bridge ledger rejects public, native, JS, CJS, and package leaks", () => {
  const ledger = evaluatePrivateAdmission733736BridgeLedger({
    rowOverrides: {
      [worker736]: {
        compatibilityClaimed: true,
        binding: {
          sourceReportOwnershipPinned: false,
          publicCompatibilityBlocked: false
        },
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES.filter(
            (surface) => surface !== "scheduler"
          ),
        publicCompatibilityClaims: {
          publicSchedulerCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          jsFacadeAdmissionClaimed: true,
          cjsFacadeAdmissionClaimed: true,
          nativeBridgeLoadingClaimed: true,
          nativeBridgeExecutionClaimed: true,
          packageCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(
    ledger.status,
    PRIVATE_ADMISSION_733_736_BRIDGE_LEDGER_VIOLATION_STATUS
  );
  assert.equal(ledger.privateBridgePrerequisitesRecognized, false);
  assert.equal(ledger.bridgeBindingsRecognized, false);
  assert.equal(ledger.blockerCarryForwardRecognized, false);
  assert.equal(ledger.publicCompatibilityClaimed, true);
  assertViolationIds(ledger, [
    "bridge-prerequisite-binding-mismatch",
    "bridge-blocked-surface-carry-forward-mismatch",
    "bridge-public-compatibility-claim-detected",
    "bridge-blocked-admission-claim-detected",
    "bridge-native-js-package-compatibility-leak-detected",
    "bridge-claimed-public-compatibility"
  ]);
  assertSubset(
    [
      `${worker736}.jsFacadeAdmissionClaimed`,
      `${worker736}.cjsFacadeAdmissionClaimed`,
      `${worker736}.packageCompatibilityClaimed`,
      `${worker736}.nativeBridgeLoadingClaimed`,
      `${worker736}.nativeBridgeExecutionClaimed`
    ],
    ledger.nativeJsPackageLeakClaimIds
  );
});

function assertBridgeRow(
  row,
  { workerId, bridgeScope, binding, evidenceIds }
) {
  assert.equal(row.workerId, workerId);
  assert.equal(row.bridgeScope, bridgeScope);
  assert.equal(
    row.privateAdmission,
    "accepted-private-diagnostic-bridge-prerequisite"
  );
  assert.equal(row.sourceQueue, "733-736-bridge");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.binding, binding);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.evidenceId),
    evidenceIds
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_733_736_BRIDGE_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.publicCompatibilityClaims),
    Object.values(row.publicCompatibilityClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.blockedAdmissionClaims).sort(),
    [...PRIVATE_ADMISSION_733_736_BRIDGE_BLOCKED_ADMISSION_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.blockedAdmissionClaims),
    Object.values(row.blockedAdmissionClaims).map(() => false),
    row.workerId
  );
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertViolationIds(ledger, expectedIds) {
  const actualIds = ledger.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertEvidenceRecognized(ledger, workerId, evidenceId, expected) {
  const evidenceRow = ledger.rowsByWorker[workerId].evidence.find(
    (row) => row.evidenceId === evidenceId
  );
  assert.notEqual(evidenceRow, undefined, evidenceId);
  assert.equal(evidenceRow.recognized, expected, evidenceId);
}

function createWorkspaceWithMutatedEvidenceFile({ evidencePath, find, replace }) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-733-736-bridge-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    PRIVATE_ADMISSION_733_736_BRIDGE_ROWS.flatMap((row) => row.evidence).map(
      (evidenceRow) => evidenceRow.path
    )
  );

  for (const path of evidencePaths) {
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (path === evidencePath) {
      text = replaceFirst(text, find, replace);
    }
    writeFileSync(targetPath, text);
  }

  return {
    root,
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    }
  };
}

function findWorkspaceRoot() {
  let current = process.cwd();
  while (true) {
    if (existsSync(join(current, "WORKER_BRIEF.md"))) {
      return current;
    }

    const parent = dirname(current);
    assert.notEqual(parent, current, "workspace root not found");
    current = parent;
  }
}

function replaceFirst(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  return text.replace(find, replace);
}
