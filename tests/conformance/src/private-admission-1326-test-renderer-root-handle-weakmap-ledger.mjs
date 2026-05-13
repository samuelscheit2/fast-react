import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

const testRendererSource = "packages/react-test-renderer/index.js";
const sourceTokenPolicy =
  "implementation-source-tokens-comments-literals-and-regex-ignored";

export const PRIVATE_ADMISSION_1326_LEDGER_ID =
  "private-admission-1326-test-renderer-root-handle-weakmap-ledger-1";
export const PRIVATE_ADMISSION_1326_LEDGER_STATUS =
  "recognized-test-renderer-root-handle-weakmap-identity-ledger";
export const PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS =
  "blocked-test-renderer-root-handle-weakmap-identity-ledger";

export const PRIVATE_ADMISSION_1326_SURFACES = freezeArray([
  "test-renderer-root-handle-weakmap-state",
  "test-renderer-root-handle-private-bridge-reads",
  "test-renderer-root-handle-registration",
  "test-renderer-root-handle-validation"
]);

export const PRIVATE_ADMISSION_1326_BLOCKED_CLAIMS = freezeArray([
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
]);

export const PRIVATE_ADMISSION_1326_ROWS = freezeArray([
  rowData({
    surfaceId: PRIVATE_ADMISSION_1326_SURFACES[0],
    privateAdmission:
      "accepted-private-test-renderer-root-handle-weakmap-state",
    evidence: [
      evidenceData({
        evidenceId: "root-handle-state-weakmap-declarations",
        sliceStart: "function getIdPrefix(value, fallback) {",
        sliceEnd: "function createTestRendererRootRequestBridge(options) {",
        tokens: [
          "const rootRequestPayloads = new WeakMap();",
          "const rootHandleStates = new WeakMap();",
          "const rendererRootHandles = new WeakMap();"
        ],
        forbiddenTokens: [
          "const rootHandleStates = new Map();",
          "const rendererRootHandles = new Map();",
          "const rootHandleStates = {};",
          "const rendererRootHandles = {};"
        ]
      })
    ]
  }),
  rowData({
    surfaceId: PRIVATE_ADMISSION_1326_SURFACES[1],
    privateAdmission:
      "accepted-private-test-renderer-root-handle-bridge-weakmap-reads",
    evidence: [
      evidenceData({
        evidenceId: "root-handle-bridge-weakmap-reads",
        sliceStart: "getRendererRootHandle(renderer) {",
        sliceEnd: "getRequestPayload(record) {",
        tokens: [
          "return rendererRootHandles.get(renderer) || null;",
          "const rootHandle = rendererRootHandles.get(renderer);",
          "getRootRequests(rootHandle) {\n      return getRootRequestsForHandle(rootHandle);",
          ": getRootRequestsForHandle(rootHandle);"
        ],
        forbiddenTokens: [
          "rootHandle.$$typeof",
          "Object.keys(rootHandle)",
          "Reflect.ownKeys(rootHandle)",
          "getRootRequests(rootHandle) {\n      return rootHandle.requests;"
        ]
      })
    ]
  }),
  rowData({
    surfaceId: PRIVATE_ADMISSION_1326_SURFACES[2],
    privateAdmission:
      "accepted-private-test-renderer-root-handle-registration",
    evidence: [
      evidenceData({
        evidenceId: "root-handle-freeze-and-state-registration",
        sliceStart:
          "function createRootRequestRecordWithBridge(bridgeState, element, rootOptions) {",
        sliceEnd: "const request = createRootRequestRecord({",
        tokens: [
          "const rootHandle = freezeRecord({",
          "$$typeof: privateRootHandleType,",
          "compatibilityClaimed: false",
          "const handleState = {",
          "requests: []",
          "rootHandleStates.set(rootHandle, handleState);"
        ],
        forbiddenTokens: [
          "rootHandle.requests =",
          "requests: rootHandle.requests",
          "Object.defineProperty(rootHandle",
          "Reflect.set(rootHandle"
        ]
      })
    ]
  }),
  rowData({
    surfaceId: PRIVATE_ADMISSION_1326_SURFACES[3],
    privateAdmission:
      "accepted-private-test-renderer-root-handle-validation-weakmap-get",
    evidence: [
      evidenceData({
        evidenceId: "root-handle-validation-weakmap-get",
        sliceStart: "function assertPrivateRootHandle(rootHandle) {",
        sliceEnd: "function isRootRequestRecord(record) {",
        tokens: [
          "const handleState = rootHandleStates.get(rootHandle);",
          "if (handleState === undefined) {",
          "return handleState;",
          "const handleState = assertPrivateRootHandle(rootHandle);",
          "return freezeArray(handleState.requests.slice());"
        ],
        forbiddenTokens: [
          "rootHandle.$$typeof",
          "rootHandle.kind",
          "rootHandle.requests",
          "Object.keys(rootHandle)",
          "Reflect.ownKeys(rootHandle)",
          "Object.hasOwn(rootHandle"
        ]
      })
    ]
  })
]);

export function evaluatePrivateAdmission1326TestRendererRootHandleWeakMapLedger({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  sourceOverrides = {},
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_1326_ROWS.map((row) =>
    mergeRowOverride(row, rowOverrides[row.surfaceId] ?? {})
  );
  const evaluatedRows = rows.map((row) =>
    evaluateRow({ fileCache, row, sourceOverrides, workspaceRoot })
  );
  const manifestSurfaceIds = rows.map((row) => row.surfaceId);
  const evidenceFailures = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          surfaceId: row.surfaceId,
          evidenceId: evidenceRow.evidenceId,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const publicClaimIds = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicClaims)
      .filter(([, value]) => value === true)
      .map(([claim]) => `${row.surfaceId}:${claim}`)
  );
  const manifestFailures = [
    ...PRIVATE_ADMISSION_1326_SURFACES.filter(
      (surfaceId) => !manifestSurfaceIds.includes(surfaceId)
    ).map((surfaceId) => `missing:${surfaceId}`),
    ...manifestSurfaceIds
      .filter((surfaceId) => !PRIVATE_ADMISSION_1326_SURFACES.includes(surfaceId))
      .map((surfaceId) => `unexpected:${surfaceId}`),
    ...manifestSurfaceIds
      .filter((surfaceId, index) => manifestSurfaceIds.indexOf(surfaceId) !== index)
      .map((surfaceId) => `duplicate:${surfaceId}`)
  ];
  const staticReadOnlyFailures = evaluatedRows
    .filter((row) => row.staticReadOnlyLedger !== true)
    .map((row) => row.surfaceId);
  const violations = freezeArray([
    ...evidenceFailures.map(
      (failure) => `source-evidence-not-recognized:${failure.evidenceId}`
    ),
    ...publicClaimIds.map((claimId) => `public-claim-present:${claimId}`),
    ...manifestFailures.map((failure) => `manifest:${failure}`),
    ...staticReadOnlyFailures.map(
      (surfaceId) => `not-static-read-only:${surfaceId}`
    )
  ]);

  return freezeRecord({
    ledgerId: PRIVATE_ADMISSION_1326_LEDGER_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_1326_LEDGER_STATUS
        : PRIVATE_ADMISSION_1326_LEDGER_VIOLATION_STATUS,
    rows: freezeArray(evaluatedRows),
    rowsBySurface: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.surfaceId, row]))
    ),
    queueSurfaces: freezeArray(manifestSurfaceIds),
    recognizedSurfaceIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.surfaceId)
    ),
    manifestRecognized: manifestFailures.length === 0,
    sourceEvidenceRecognized: evidenceFailures.length === 0,
    blockedPublicClaimsRecognized: publicClaimIds.length === 0,
    staticReadOnlyRecognized: staticReadOnlyFailures.length === 0,
    compatibilityClaimed: publicClaimIds.length > 0,
    evidenceFailures: freezeArray(evidenceFailures),
    publicClaimIds: freezeArray(publicClaimIds),
    manifestFailures: freezeArray(manifestFailures),
    staticReadOnlyFailures: freezeArray(staticReadOnlyFailures),
    violations
  });
}

function rowData(data) {
  return freezeRecord({
    implementationPaths: freezeArray([testRendererSource]),
    privateEvidenceOnly: true,
    sourceIdentifierChecksOnly: true,
    manifestEvaluationOnly: true,
    staticReadOnlyLedger: true,
    runtimeExecutionClaimed: false,
    publicClaims: freezeRecord(
      Object.fromEntries(
        PRIVATE_ADMISSION_1326_BLOCKED_CLAIMS.map((claim) => [claim, false])
      )
    ),
    ...data,
    evidence: freezeArray(data.evidence)
  });
}

function evidenceData(data) {
  return freezeRecord({
    path: testRendererSource,
    tokenPolicy: sourceTokenPolicy,
    forbiddenTokens: freezeArray([]),
    ...data,
    tokens: freezeArray(data.tokens),
    forbiddenTokens: freezeArray(data.forbiddenTokens ?? [])
  });
}

function evaluateRow({ fileCache, row, sourceOverrides, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidence({ evidenceRow, fileCache, sourceOverrides, workspaceRoot })
  );

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    recognized:
      row.privateEvidenceOnly === true &&
      row.sourceIdentifierChecksOnly === true &&
      row.manifestEvaluationOnly === true &&
      row.staticReadOnlyLedger === true &&
      evidence.length > 0 &&
      evidence.every((evidenceRow) => evidenceRow.recognized === true) &&
      Object.values(row.publicClaims).every((value) => value === false)
  });
}

function evaluateEvidence({
  evidenceRow,
  fileCache,
  sourceOverrides,
  workspaceRoot
}) {
  const fileText =
    Object.hasOwn(sourceOverrides, evidenceRow.path)
      ? freezeRecord({ ok: true, value: sourceOverrides[evidenceRow.path] })
      : readWorkspaceFile({ fileCache, path: evidenceRow.path, workspaceRoot });
  const sourceText =
    fileText.ok === true
      ? extractSlice({
          text: fileText.value,
          sliceStart: evidenceRow.sliceStart,
          sliceEnd: evidenceRow.sliceEnd
        })
      : fileText;
  const searchableSource =
    sourceText.ok === true ? stripCommentsStringsTemplatesAndRegex(sourceText.value) : "";
  const missingTokens =
    sourceText.ok === true
      ? evidenceRow.tokens.filter((token) => !searchableSource.includes(token))
      : evidenceRow.tokens;
  const forbiddenTokensPresent =
    sourceText.ok === true
      ? evidenceRow.forbiddenTokens.filter((token) =>
          searchableSource.includes(token)
        )
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      sourceText.ok === true &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: fileText.ok === true ? null : fileText.error,
    sliceError: sourceText.ok === true ? null : sourceText.error
  });
}

function readWorkspaceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }

  let result;
  try {
    result = freezeRecord({
      ok: true,
      value: readFileSync(join(workspaceRoot, path), "utf8")
    });
  } catch (error) {
    result = freezeRecord({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function extractSlice({ text, sliceStart, sliceEnd }) {
  const startIndex = text.indexOf(sliceStart);
  if (startIndex < 0) {
    return freezeRecord({ ok: false, error: `slice-start-not-found:${sliceStart}` });
  }
  const endIndex = text.indexOf(sliceEnd, startIndex + sliceStart.length);
  if (endIndex < 0) {
    return freezeRecord({ ok: false, error: `slice-end-not-found:${sliceEnd}` });
  }
  return freezeRecord({ ok: true, value: text.slice(startIndex, endIndex) });
}

export function stripCommentsStringsTemplatesAndRegex(text) {
  const output = [];
  let index = 0;
  let previousSignificant = "";

  while (index < text.length) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(text, index, output);
      continue;
    }
    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(text, index, output);
      continue;
    }
    if (character === "'" || character === '"') {
      index = skipQuotedLiteral(text, index, output, character);
      previousSignificant = "literal";
      continue;
    }
    if (character === "`") {
      index = skipTemplateLiteral(text, index, output);
      previousSignificant = "literal";
      continue;
    }
    if (
      character === "/" &&
      nextCharacter !== "/" &&
      nextCharacter !== "*" &&
      isRegexAllowedAfter(previousSignificant)
    ) {
      index = skipRegexLiteral(text, index, output);
      previousSignificant = "literal";
      continue;
    }

    output.push(character);
    if (!/\s/u.test(character)) {
      previousSignificant = character;
    }
    index += 1;
  }

  return output.join("");
}

function skipLineComment(text, index, output) {
  while (index < text.length && text[index] !== "\n") {
    output.push(" ");
    index += 1;
  }
  return index;
}

function skipBlockComment(text, index, output) {
  output.push(" ", " ");
  index += 2;
  while (index < text.length) {
    if (text[index] === "*" && text[index + 1] === "/") {
      output.push(" ", " ");
      return index + 2;
    }
    output.push(text[index] === "\n" ? "\n" : " ");
    index += 1;
  }
  return index;
}

function skipQuotedLiteral(text, index, output, quote) {
  output.push(" ");
  index += 1;
  while (index < text.length) {
    const character = text[index];
    output.push(character === "\n" ? "\n" : " ");
    index += character === "\\" ? 2 : 1;
    if (character === quote) {
      break;
    }
  }
  return index;
}

function skipTemplateLiteral(text, index, output) {
  output.push(" ");
  index += 1;
  while (index < text.length) {
    const character = text[index];
    output.push(character === "\n" ? "\n" : " ");
    index += character === "\\" ? 2 : 1;
    if (character === "`") {
      break;
    }
  }
  return index;
}

function skipRegexLiteral(text, index, output) {
  output.push(" ");
  index += 1;
  let inCharacterClass = false;
  while (index < text.length) {
    const character = text[index];
    output.push(character === "\n" ? "\n" : " ");
    if (character === "\\") {
      index += 2;
      output.push(" ");
      continue;
    }
    if (character === "[") {
      inCharacterClass = true;
    } else if (character === "]") {
      inCharacterClass = false;
    } else if (character === "/" && !inCharacterClass) {
      index += 1;
      while (/[a-z]/iu.test(text[index] ?? "")) {
        output.push(" ");
        index += 1;
      }
      return index;
    }
    index += 1;
  }
  return index;
}

function isRegexAllowedAfter(previousSignificant) {
  return (
    previousSignificant === "" ||
    "([{:;,=!?&|+-*%^~<>".includes(previousSignificant)
  );
}

function mergeRowOverride(row, override) {
  const merged = {
    ...row,
    ...override
  };
  if (override.publicClaims !== undefined) {
    merged.publicClaims = freezeRecord({
      ...row.publicClaims,
      ...override.publicClaims
    });
  }
  if (override.evidence !== undefined) {
    merged.evidence = freezeArray(override.evidence);
  }
  return freezeRecord(merged);
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
