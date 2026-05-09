import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_HYDRATION_MARKER_CLIENT_COMMENT_CONSTANTS,
  REACT_DOM_HYDRATION_MARKER_CONTRACTS,
  REACT_DOM_HYDRATION_MARKER_INLINE_RUNTIME_SNIPPETS,
  REACT_DOM_HYDRATION_MARKER_MISMATCH_CONTRACTS,
  REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH,
  REACT_DOM_HYDRATION_MARKER_PINNED_SOURCE_EXPECTATIONS,
  REACT_DOM_HYDRATION_MARKER_PUBLISHED_BUNDLE_SNIPPETS,
  REACT_DOM_HYDRATION_MARKER_REACT_SOURCE,
  REACT_DOM_HYDRATION_MARKER_RENDER_STATE_PREFIXES,
  REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH,
  REACT_DOM_HYDRATION_MARKER_SERVER_CHUNKS,
  REACT_DOM_HYDRATION_MARKER_SOURCE_FILES,
  REACT_DOM_HYDRATION_MARKER_TARGET,
  REACT_DOM_HYDRATION_MARKER_WORKER_INPUTS,
  REACT_DOM_HYDRATION_MARKER_WORKER_RECONCILIATION
} from "../src/react-dom-hydration-marker-targets.mjs";
import {
  findReactDomHydrationMarkerContract,
  findReactDomHydrationMismatchContract,
  formatReactDomHydrationMarkerOracleAsMarkdown,
  readCheckedReactDomHydrationMarkerOracle,
  readCheckedReactDomHydrationMarkerOracleText
} from "../src/react-dom-hydration-marker-oracle.mjs";

const oracle = readCheckedReactDomHydrationMarkerOracle();

test("checked React DOM hydration marker oracle artifact has the expected schema and target", () => {
  assert.equal(
    REACT_DOM_HYDRATION_MARKER_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-hydration-marker-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-hydration-marker-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory, exact react-dom npm tarball, accepted worker reports, and React source files pinned to the v19.2.6 commit",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    hydrationOrDomCodeExecuted: false,
    reactDomRuntimeRenderingExecuted: false,
    generatedTimestampIncluded: false,
    tarballTimeoutMs: 10000,
    fetchTimeoutMs: 30000
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_HYDRATION_MARKER_TARGET);
  assert.deepEqual(oracle.reactSource, REACT_DOM_HYDRATION_MARKER_REACT_SOURCE);
  assert.equal(
    oracle.sourceInventory.path,
    REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH
  );
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
  assert.equal(oracle.packageEvidence["react-dom"].version, "19.2.6");
  assert.equal(
    oracle.packageEvidence["react-dom"].tarball.integrityVerified,
    true
  );
});

test("React DOM hydration marker oracle keeps compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomSourceEvidenceCaptured: true,
    realReactDomRuntimeBehaviorProbed: false,
    fastReactComparedToReactDom: false,
    fastReactHydrationCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.worker042And043EvidenceCoRecorded, true);
  assert.equal(
    oracle.evidenceClaims.pinnedReactSourceFingerprintsVerified,
    true
  );
  assert.deepEqual(
    oracle.workerEvidenceReconciliation,
    REACT_DOM_HYDRATION_MARKER_WORKER_RECONCILIATION
  );
  assert.deepEqual(
    oracle.fastReactContracts.map((contract) => contract.id),
    [
      "marker-generation-owned-by-fizz",
      "mismatch-evidence-is-structured",
      "no-hydration-implementation-claimed"
    ]
  );
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "no-dom-fixture-hydration"),
    true
  );
});

test("React DOM hydration marker oracle captures accepted worker inputs and pinned source files", () => {
  assert.deepEqual(
    oracle.workerInputs.map((input) => input.id),
    REACT_DOM_HYDRATION_MARKER_WORKER_INPUTS.map((input) => input.id)
  );
  for (const input of oracle.workerInputs) {
    assert.match(input.sha256, /^[a-f0-9]{64}$/u);
    for (const evidenceLine of input.evidenceLines) {
      assert.equal(typeof evidenceLine.phrase, "string");
      assert.ok(evidenceLine.line > 0);
    }
  }

  assert.deepEqual(
    oracle.pinnedSourceFiles.map((sourceFile) => ({
      id: sourceFile.id,
      path: sourceFile.path,
      role: sourceFile.role
    })),
    REACT_DOM_HYDRATION_MARKER_SOURCE_FILES
  );
  for (const sourceFile of oracle.pinnedSourceFiles) {
    assert.deepEqual(
      {
        sha256: sourceFile.sha256,
        lineCount: sourceFile.lineCount
      },
      REACT_DOM_HYDRATION_MARKER_PINNED_SOURCE_EXPECTATIONS[sourceFile.id]
    );
    for (const evidenceLine of sourceFile.evidenceLines) {
      assert.ok(evidenceLine.line > 0);
    }
  }
});

test("React DOM hydration marker oracle records exact marker constants and server chunks", () => {
  assert.deepEqual(
    oracle.markerContracts,
    REACT_DOM_HYDRATION_MARKER_CONTRACTS
  );
  assert.equal(
    findReactDomHydrationMarkerContract(oracle, "suspense-pending-start")
      .commentData,
    "$?"
  );
  assert.equal(
    findReactDomHydrationMarkerContract(oracle, "form-state-matching")
      .serializedMarker,
    "<!--F!-->"
  );

  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_CLIENT_COMMENT_CONSTANTS
  )) {
    const evidence = oracle.extractedEvidence.clientCommentConstants[name];
    assert.equal(evidence.value, expected, name);
    assert.ok(evidence.sourceLine > 0, name);
  }

  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_SERVER_CHUNKS
  )) {
    const evidence = oracle.extractedEvidence.serverFizzChunks[name];
    assert.equal(evidence.value, expected, name);
    assert.ok(evidence.sourceLine > 0, name);
  }

  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_RENDER_STATE_PREFIXES
  )) {
    const evidence = oracle.extractedEvidence.renderStatePrefixes[name];
    assert.equal(evidence.suffix, expected, name);
    assert.ok(evidence.sourceLine > 0, name);
  }
});

test("React DOM hydration marker oracle validates inline runtime and published bundle evidence", () => {
  for (const [exportName, snippets] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_INLINE_RUNTIME_SNIPPETS
  )) {
    const evidence = oracle.extractedEvidence.inlineRuntimeMutations[exportName];
    assert.ok(evidence.sourceLine > 0, exportName);
    assert.deepEqual(
      evidence.snippets.map((snippet) => ({
        snippet: snippet.snippet,
        present: snippet.present
      })),
      snippets.map((snippet) => ({ snippet, present: true }))
    );
    assert.equal(
      evidence.snippets.every((snippet) => snippet.line > 0),
      true,
      exportName
    );
  }

  for (const [file, snippets] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_PUBLISHED_BUNDLE_SNIPPETS
  )) {
    const evidence = oracle.publishedBundleEvidence[file];
    assert.match(evidence.sha256, /^[a-f0-9]{64}$/u);
    assert.deepEqual(
      evidence.snippets.map((snippet) => ({
        snippet: snippet.snippet,
        present: snippet.present
      })),
      snippets.map((snippet) => ({ snippet, present: true }))
    );
  }
});

test("React DOM hydration marker oracle records structured mismatch contracts", () => {
  assert.deepEqual(
    oracle.mismatchContracts,
    REACT_DOM_HYDRATION_MARKER_MISMATCH_CONTRACTS
  );
  assert.equal(
    findReactDomHydrationMismatchContract(oracle, "fatal-html-mismatch")
      .sourceFunction,
    "throwOnHydrationMismatch"
  );
  assert.equal(
    findReactDomHydrationMismatchContract(
      oracle,
      "internal-hydration-mismatch-exception"
    ).delivery,
    "internal throw only"
  );

  const evidence = oracle.extractedEvidence.mismatchEvidence;
  assert.equal(evidence.hydrationMismatchException.present, true);
  assert.equal(evidence.fatalMismatchMessageTemplate.queuesBeforeThrow, true);
  assert.equal(
    evidence.fatalMismatchMessageTemplate.throwsInternalSentinel,
    true
  );
  assert.equal(evidence.recoverableQueue.queuesRecoverableErrors, true);
  assert.equal(evidence.devSuccessfulHydrationWarning.consoleError, true);
  assert.equal(
    evidence.suppressHydrationWarningTextDiff.returnsNullWhenSuppressed,
    true
  );
  assert.equal(
    evidence.formMarkerMismatchPath.fallsThroughToThrowOnHydrationMismatch,
    true
  );
});

test("React DOM hydration marker oracle artifact does not leak local generation paths", () => {
  const oracleText = readCheckedReactDomHydrationMarkerOracleText();
  assert.doesNotMatch(oracleText, /\/Users\/user/u);
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-hydration-marker-oracle-[A-Za-z0-9]/u
  );
});

test("print React DOM hydration marker oracle CLI emits checked JSON and markdown", () => {
  const jsonOutput = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-hydration-marker-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(jsonOutput, readCheckedReactDomHydrationMarkerOracleText());

  const markdownOutput = execFileSync(
    process.execPath,
    [
      "scripts/print-react-dom-hydration-marker-oracle.mjs",
      "--format=markdown"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(
    markdownOutput,
    formatReactDomHydrationMarkerOracleAsMarkdown(oracle)
  );
  assert.match(markdownOutput, /## Marker Contracts/u);
  assert.match(markdownOutput, /## Mismatch Contracts/u);
});
