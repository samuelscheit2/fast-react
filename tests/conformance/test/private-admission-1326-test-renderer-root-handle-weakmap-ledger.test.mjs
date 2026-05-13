import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_1326_BLOCKED_CLAIMS,
  PRIVATE_ADMISSION_1326_LEDGER_STATUS,
  PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS,
  PRIVATE_ADMISSION_1326_ROWS,
  PRIVATE_ADMISSION_1326_SURFACES,
  evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger,
  stripCommentsStringsTemplatesAndRegex
} from "../src/private-admission-1326-test-renderer-root-handle-weakmap-ledger.mjs";

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const testRendererSourcePath = "packages/react-test-renderer/index.js";
const testRendererSource = readFileSync(
  new URL("../../../packages/react-test-renderer/index.js", import.meta.url),
  "utf8"
);

test("private admission 1326 manifest pins root-handle WeakMap source surfaces", () => {
  assert.deepEqual(PRIVATE_ADMISSION_1326_SURFACES, [
    "test-renderer-root-handle-weakmap-state",
    "test-renderer-root-handle-private-bridge-reads",
    "test-renderer-root-handle-registration",
    "test-renderer-root-handle-validation"
  ]);
  assert.deepEqual(
    PRIVATE_ADMISSION_1326_ROWS.map((row) => row.surfaceId),
    PRIVATE_ADMISSION_1326_SURFACES
  );
  assert.equal(PRIVATE_ADMISSION_1326_ROWS.length, 4);
  assert.equal(new Set(PRIVATE_ADMISSION_1326_SURFACES).size, 4);
  assertSubset(
    [
      "publicRootAvailable",
      "publicTestInstanceAvailable",
      "publicActCompatibilityClaimed",
      "publicSchedulerCompatibilityClaimed",
      "nativeBridgeCompatibilityClaimed",
      "serializationCompatibilityClaimed",
      "packageExportCompatibilityClaimed",
      "structuralRootHandleAccepted",
      "ownKeyRootHandleAccepted",
      "prototypeRootHandleAccepted",
      "copiedSymbolRootHandleAccepted",
      "compatibilityClaimed"
    ],
    PRIVATE_ADMISSION_1326_BLOCKED_CLAIMS
  );

  for (const row of PRIVATE_ADMISSION_1326_ROWS) {
    assert.deepEqual(row.implementationPaths, [testRendererSourcePath]);
    assert.equal(row.privateEvidenceOnly, true, row.surfaceId);
    assert.equal(row.sourceIdentifierChecksOnly, true, row.surfaceId);
    assert.equal(row.manifestEvaluationOnly, true, row.surfaceId);
    assert.equal(row.staticReadOnlyLedger, true, row.surfaceId);
    assert.equal(row.runtimeExecutionClaimed, false, row.surfaceId);
    assertAllFalse(row.publicClaims, row.surfaceId);

    for (const evidence of row.evidence) {
      assert.equal(evidence.path, testRendererSourcePath);
      assert.equal(
        evidence.tokenPolicy,
        "implementation-source-tokens-comments-literals-and-regex-ignored"
      );
      assert.ok(evidence.tokens.length > 0, evidence.evidenceId);
    }
  }
});

test("private admission 1326 recognizes current WeakMap identity source proof", () => {
  const ledger = evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger({
    workspaceRoot
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_STATUS);
  assert.equal(ledger.manifestRecognized, true);
  assert.equal(ledger.sourceEvidenceRecognized, true);
  assert.equal(ledger.blockedPublicClaimsRecognized, true);
  assert.equal(ledger.staticReadOnlyRecognized, true);
  assert.equal(ledger.compatibilityClaimed, false);
  assert.deepEqual(ledger.queueSurfaces, PRIVATE_ADMISSION_1326_SURFACES);
  assert.deepEqual(ledger.recognizedSurfaceIds, PRIVATE_ADMISSION_1326_SURFACES);
  assert.deepEqual(ledger.violations, []);
  assert.deepEqual(ledger.evidenceFailures, []);
  assert.deepEqual(ledger.publicClaimIds, []);

  for (const row of ledger.rows) {
    assert.equal(row.recognized, true, row.surfaceId);
    for (const evidence of row.evidence) {
      assert.equal(evidence.recognized, true, evidence.evidenceId);
      assert.deepEqual(evidence.missingTokens, [], evidence.evidenceId);
      assert.deepEqual(evidence.forbiddenTokensPresent, [], evidence.evidenceId);
      assert.equal(evidence.readError, null, evidence.evidenceId);
      assert.equal(evidence.sliceError, null, evidence.evidenceId);
    }
  }
});

test("private admission 1326 rejects Map-backed root handle ownership", () => {
  const ledger = evaluateMutatedSource(
    testRendererSource
      .replace("const rootHandleStates = new WeakMap();", "const rootHandleStates = new Map();")
      .replace("const rendererRootHandles = new WeakMap();", "const rendererRootHandles = new Map();")
  );

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS);
  assertViolationIncludes(ledger, [
    "source-evidence-not-recognized:root-handle-state-weakmap-declarations"
  ]);
  assertEvidenceFailure(ledger, "root-handle-state-weakmap-declarations", {
    missingTokens: [
      "const rootHandleStates = new WeakMap();",
      "const rendererRootHandles = new WeakMap();"
    ],
    forbiddenTokensPresent: [
      "const rootHandleStates = new Map();",
      "const rendererRootHandles = new Map();"
    ]
  });
});

test("private admission 1326 rejects structural root handle validation", () => {
  const ledger = evaluateMutatedSource(
    testRendererSource.replace(
      "const handleState = rootHandleStates.get(rootHandle);",
      "const handleState = rootHandle && rootHandle.$$typeof === privateRootHandleType ? { requests: rootHandle.requests || [] } : undefined;"
    )
  );

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS);
  assertViolationIncludes(ledger, [
    "source-evidence-not-recognized:root-handle-validation-weakmap-get"
  ]);
  assertEvidenceFailure(ledger, "root-handle-validation-weakmap-get", {
    missingTokens: ["const handleState = rootHandleStates.get(rootHandle);"],
    forbiddenTokensPresent: ["rootHandle.requests"]
  });
});

test("private admission 1326 rejects request history copied from handle fields", () => {
  const ledger = evaluateMutatedSource(
    testRendererSource.replace(
      "return freezeArray(handleState.requests.slice());",
      "return freezeArray(rootHandle.requests.slice());"
    )
  );

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS);
  assertViolationIncludes(ledger, [
    "source-evidence-not-recognized:root-handle-validation-weakmap-get"
  ]);
  assertEvidenceFailure(ledger, "root-handle-validation-weakmap-get", {
    missingTokens: ["return freezeArray(handleState.requests.slice());"],
    forbiddenTokensPresent: ["rootHandle.requests"]
  });
});

test("private admission 1326 rejects public compatibility claims in ledger rows", () => {
  const ledger = evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger({
    workspaceRoot,
    rowOverrides: {
      [PRIVATE_ADMISSION_1326_SURFACES[0]]: {
        publicClaims: {
          publicRootAvailable: true,
          structuralRootHandleAccepted: true
        }
      }
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.blockedPublicClaimsRecognized, false);
  assert.equal(ledger.compatibilityClaimed, true);
  assert.deepEqual(ledger.publicClaimIds, [
    "test-renderer-root-handle-weakmap-state:publicRootAvailable",
    "test-renderer-root-handle-weakmap-state:structuralRootHandleAccepted"
  ]);
});

test("private admission 1326 source proof ignores comments, strings, templates, and regex literals", () => {
  const hiddenSource = [
    "/* const rootHandleStates = new WeakMap(); */",
    "'const rootHandleStates = new WeakMap();'",
    "`const rootHandleStates = new WeakMap();`",
    "/const rootHandleStates = new WeakMap\\(\\);/"
  ].join("\n");

  assert.equal(
    stripCommentsStringsTemplatesAndRegex(hiddenSource).includes(
      "const rootHandleStates = new WeakMap();"
    ),
    false
  );

  const ledger = evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger({
    sourceOverrides: {
      [testRendererSourcePath]: hiddenSource
    }
  });

  assert.equal(ledger.status, PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS);
  assert.equal(ledger.sourceEvidenceRecognized, false);
});

function evaluateMutatedSource(source) {
  return evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger({
    sourceOverrides: {
      [testRendererSourcePath]: source
    }
  });
}

function assertEvidenceFailure(ledger, evidenceId, expected) {
  const failure = ledger.evidenceFailures.find(
    (candidate) => candidate.evidenceId === evidenceId
  );
  assert.ok(failure, evidenceId);
  assertSubset(expected.missingTokens, failure.missingTokens);
  assertSubset(expected.forbiddenTokensPresent, failure.forbiddenTokensPresent);
}

function assertViolationIncludes(ledger, expectedViolations) {
  assertSubset(expectedViolations, ledger.violations);
}

function assertSubset(expectedSubset, actualValues) {
  for (const value of expectedSubset) {
    assert.ok(actualValues.includes(value), value);
  }
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}:${key}`);
  }
}
