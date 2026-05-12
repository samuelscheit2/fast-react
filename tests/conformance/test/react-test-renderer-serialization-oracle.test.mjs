import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent,
  findReactTestRendererSerializationObservation,
  readCheckedReactTestRendererSerializationOracle,
  readCheckedReactTestRendererSerializationOracleText
} from "../src/react-test-renderer-serialization-oracle.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS,
  evaluateReactTestRendererSerializationLocalGate
} from "../src/react-test-renderer-serialization-local-gate.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH,
  REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES,
  REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_SERIALIZATION_TARGET
} from "../src/react-test-renderer-serialization-targets.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS,
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS
} from "../src/react-test-renderer-serialization-scenarios.mjs";

const oracle = readCheckedReactTestRendererSerializationOracle();

test("checked react-test-renderer serialization oracle artifact has expected schema and targets", () => {
  assert.equal(
    REACT_TEST_RENDERER_SERIALIZATION_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-test-renderer-serialization-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-test-renderer-serialization-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method: "exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per react-test-renderer scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(
    oracle.reactTestRendererTarget,
    REACT_TEST_RENDERER_SERIALIZATION_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-test-renderer"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["react-is"].version, "19.2.6");
  assert.equal(
    oracle.packages["react-test-renderer"].tarball.integrityDigest,
    REACT_TEST_RENDERER_SERIALIZATION_TARGET.registry.distIntegrity.slice(
      "sha512-".length
    )
  );
});

test("react-test-renderer serialization oracle keeps local Fast React status explicit and false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(
    oracle.evidenceClaims.fastReactComparedToReactTestRenderer,
    false
  );
  assert.deepEqual(
    oracle.localFastReactStatus,
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS
  );
  assert.doesNotThrow(() =>
    assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(oracle)
  );
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-test-renderer-comparison"
    ),
    true
  );
});

test("react-test-renderer serialization oracle rejects stale or unsafe local Fast React status", () => {
  const staleOracle = JSON.parse(JSON.stringify(oracle));
  staleOracle.localFastReactStatus.status = "not-present-in-workspace";
  assert.throws(
    () =>
      assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(
        staleOracle
      ),
    /local-fast-react-status-source-mismatch/u
  );

  const claimedOracle = JSON.parse(JSON.stringify(oracle));
  claimedOracle.localFastReactStatus.comparedToReactTestRenderer = true;
  claimedOracle.localFastReactStatus.fastReactComparedToReactTestRenderer = true;
  claimedOracle.localFastReactStatus.behaviorCompatibilityClaimed = true;
  claimedOracle.localFastReactStatus.compatibilityClaimed = true;
  claimedOracle.localFastReactStatus.packageCompatibilityClaimed = true;
  claimedOracle.localFastReactStatus.publicCompatibilityClaimed = true;
  assert.throws(
    () =>
      assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(
        claimedOracle
      ),
    /local-fast-react-status-claims-fast-react-comparison/u
  );

  const comparisonClaimedOracle = JSON.parse(JSON.stringify(oracle));
  comparisonClaimedOracle.localFastReactStatus.fastReactComparedToReactTestRenderer =
    true;
  assert.throws(
    () =>
      assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(
        comparisonClaimedOracle
      ),
    /local-fast-react-status-claims-fast-react-comparison/u
  );

  const compatibilityClaimedOracle = JSON.parse(JSON.stringify(oracle));
  compatibilityClaimedOracle.localFastReactStatus.packageCompatibilityClaimed =
    true;
  compatibilityClaimedOracle.localFastReactStatus.publicCompatibilityClaimed =
    true;
  assert.throws(
    () =>
      assertReactTestRendererSerializationOracleLocalFastReactStatusCurrent(
        compatibilityClaimedOracle
      ),
    /local-fast-react-status-claims-compatibility/u
  );
});

test("react-test-renderer serialization oracle remains public-compatibility blocked after private diagnostics are ready", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
  assert.equal(gate.privateToJSONFacadeGateReady, true);
  assert.deepEqual(gate.privateToJSONFacadeBlockers, []);
  assert.equal(gate.privateToTreeMetadataGateReady, true);
  assert.deepEqual(gate.privateToTreeMetadataBlockers, []);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.publicCompatibilityBlockers, [
    "public-to-json-api",
    "public-to-tree-api",
    "public-test-instance-wrappers",
    "public-js-react-test-renderer-routing"
  ]);
  assert.deepEqual(gate.admittedScenarios, []);
  assert.deepEqual(gate.violations, []);

  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
});

test("react-test-renderer serialization oracle covers every scenario in each mode", () => {
  assert.deepEqual(
    oracle.probeModes,
    REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES
  );
  assert.deepEqual(
    oracle.scenarios,
    REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS
  );

  for (const mode of REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES) {
    const observations = oracle.observations[mode.id];
    assert.equal(
      observations.length,
      REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS) {
      const observation = findReactTestRendererSerializationObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.packageName, "react-test-renderer");
      assert.equal(observation.nodeEnv, mode.nodeEnv);
      assert.equal(observation.condition, mode.condition);
      assert.equal(observation.mountStrategy, mode.mountStrategy);

      if (mode.nodeEnv === "development") {
        assert.equal(observation.consoleCalls.length >= 1, true);
        assert.equal(
          observation.consoleCalls[0].args[0],
          "react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer"
        );
      } else {
        assert.deepEqual(observation.consoleCalls, []);
      }
    }
  }
});

test("toJSON captures host nodes, text nodes, props without children, and test JSON branding", () => {
  const result = observation(
    "default-node-development",
    "host-tree-json-and-tree"
  ).result;

  assert.equal(result.serialization.toJSON.status, "ok");
  assert.deepEqual(result.serialization.toJSON.value, {
    type: "div",
    props: {
      id: "host-root",
      foo: "bar"
    },
    children: [
      "hello",
      {
        type: "span",
        props: {
          className: "nested"
        },
        children: ["world"]
      }
    ]
  });
  assert.deepEqual(result.jsonPropsOwnKeys, ["id", "foo"]);
  assert.equal(result.jsonPropsHasChildren, false);
  assert.equal(result.jsonBrand.key, "react.test.json");

  const textRoot = observation(
    "default-node-production",
    "text-root-json-and-tree"
  ).result;
  assert.equal(textRoot.serialization.toJSON.value, "hello text root");
  assert.equal(textRoot.serialization.toTree.value, "hello text root");
  assert.equal(textRoot.rootValue.value, "hello text root");
});

test("empty roots and multiple root outputs serialize deterministically", () => {
  const empty = observation(
    "default-node-development",
    "empty-root-nullish-output"
  ).result;
  assert.equal(empty.nullRoot.serialization.toJSON.value, null);
  assert.equal(empty.nullRoot.serialization.toTree.value, null);
  assert.equal(empty.nullRoot.rootAccess.status, "throws");
  assert.equal(
    empty.nullRoot.rootAccess.error.message,
    "Can't access .root on unmounted test renderer"
  );
  assert.equal(empty.falseRoot.serialization.toJSON.value, null);
  assert.equal(empty.falseRoot.serialization.toTree.value, null);

  const arrayRoot = observation(
    "default-node-production",
    "array-root-json-and-tree"
  ).result;
  assert.deepEqual(arrayRoot.serialization.toJSON.value, [
    {
      type: "a",
      props: {
        href: "#a"
      },
      children: ["A"]
    },
    "plain text",
    {
      type: "b",
      props: {},
      children: ["B"]
    }
  ]);
  assert.deepEqual(arrayRoot.rootSummary.value, {
    kind: "ReactTestInstance",
    type: null,
    props: null,
    parent: null,
    children: [
      {
        kind: "ReactTestInstance",
        type: "a",
        props: {
          href: "#a",
          children: "A"
        }
      },
      "plain text",
      {
        kind: "ReactTestInstance",
        type: "b",
        props: {
          children: "B"
        }
      }
    ]
  });
});

test("hidden Activity output is omitted from toJSON while TestInstance queries still see it", () => {
  const result = observation(
    "default-node-development",
    "activity-hidden-json-and-tree"
  ).result;

  assert.deepEqual(result.serialization.toJSON.value, {
    type: "main",
    props: {},
    children: [
      {
        type: "span",
        props: {
          id: "visible-child"
        },
        children: ["visible"]
      }
    ]
  });
  assert.equal(result.serialization.toTree.status, "throws");
  assert.equal(
    result.serialization.toTree.error.message,
    "toTree() does not yet know how to handle nodes with tag=31"
  );
  assert.equal(result.hiddenMatches.length, 1);
  assert.equal(result.hiddenMatches[0].props.id, "hidden-child");
  assert.equal(result.visibleMatches.length, 1);
  assert.equal(result.visibleMatches[0].props.id, "visible-child");
  assert.deepEqual(
    result.rootChildren.map((child) => child.props.id),
    ["hidden-child", "visible-child"]
  );
});

test("toTree captures composite nodes above rendered host output", () => {
  const result = observation(
    "default-node-development",
    "composite-to-tree"
  ).result;
  const tree = result.serialization.toTree.value;

  assert.equal(result.serialization.toTree.status, "ok");
  assert.equal(tree.nodeType, "component");
  assert.equal(tree.type.kind, "function");
  assert.equal(tree.type.name, "FunctionComposite");
  assert.equal(tree.props.label, "composite-label");
  assert.equal(tree.rendered.nodeType, "host");
  assert.equal(tree.rendered.type, "section");
  assert.equal(tree.rendered.rendered[0].type, "strong");
  assert.equal(tree.rendered.rendered[0].rendered[0], "child");

  assert.equal(result.rootSummary.value.type.name, "FunctionComposite");
  assert.equal(result.sectionMatches.length, 1);
  assert.equal(result.sectionMatches[0].children[0].type, "strong");
});

test("TestInstance find, findAll, findByType, and findByProps basics match React 19.2.6", () => {
  const result = observation(
    "default-node-production",
    "test-instance-find-basics"
  ).result;

  assert.equal(result.rootSummary.type, "ul");
  assert.equal(result.findTarget.status, "ok");
  assert.equal(result.findTarget.value.type.name, "Item");
  assert.deepEqual(result.findAllLiKinds, ["target", "other", "other"]);
  assert.deepEqual(result.findAllLiDeepFalseKinds, [
    "target",
    "other",
    "other"
  ]);
  assert.equal(result.findByTypeItem.value.type.name, "Item");
  assert.equal(result.findAllByTypeLiCount, 3);
  assert.equal(result.findByPropsRoot.value.type, "ul");
  assert.equal(result.findAllByPropsOtherCount, 2);
  assert.equal(result.findZero.status, "throws");
  assert.equal(
    result.findZero.error.message,
    'No instances found matching custom predicate: (node) => node.props.kind === "missing"'
  );
  assert.equal(result.findMultiple.status, "throws");
  assert.equal(
    result.findMultiple.error.message,
    'Expected 1 but found 3 instances matching custom predicate: (node) => node.type === "li"'
  );
  assert.equal(result.findByPropsOtherMultiple.status, "throws");
  assert.equal(
    result.findByPropsOtherMultiple.error.message,
    'Expected 1 but found 2 instances with props: {"kind":"other"}'
  );
});

test("react-test-renderer serialization oracle artifact does not leak temporary or local paths", () => {
  const oracleText = readCheckedReactTestRendererSerializationOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\/fast-react-/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-test-renderer-serialization-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/[^/\s]+\/Developer\/Developer/u);
});

test("print react-test-renderer serialization oracle CLI emits the checked-in artifact", () => {
  const printed = execFileSync(
    process.execPath,
    ["scripts/print-react-test-renderer-serialization-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(printed, readCheckedReactTestRendererSerializationOracleText());
});

function observation(modeId, scenarioId) {
  return findReactTestRendererSerializationObservation(
    oracle,
    modeId,
    scenarioId
  );
}
