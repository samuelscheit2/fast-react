import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCEPTED_GATE_STATUSES,
  BENCHMARK_READINESS_STATUSES,
  CLAIM_CAPABLE_TIMING_STATUSES,
  COMPATIBILITY_STATUSES,
  TIMING_STATUSES,
  assertBenchmarkGate,
  validateBenchmarkManifest,
  validateBenchmarkResult
} from "../src/benchmark-gate.mjs";

const benchmarkRoot = path.resolve(
  fileURLToPath(new URL("..", import.meta.url))
);
const repoRoot = path.resolve(benchmarkRoot, "../..");

const rootManifest = readManifest("root-render-dual-run-gate-1.json");
const minimalRootMilestoneManifest = readManifest(
  "minimal-root-lifecycle-milestones.json"
);
const privateDiagnosticManifest = readManifest(
  "private-diagnostic-gate-admissions.json"
);
const privateRootHostOutputTimingManifest = readManifest(
  "private-root-host-output-timing-canaries.json"
);
const privateRootCrossRootWarningTimingManifest = readManifest(
  "private-root-cross-root-warning-timing-canaries.json"
);
const privateRootUpdateTextEventPassiveTimingManifest = readManifest(
  "private-root-update-text-event-passive-timing-canaries.json"
);
const privateActPassiveEffectTimingManifest = readManifest(
  "private-act-passive-effect-timing-canaries.json"
);
const privateBatch480492DiagnosticManifest = readManifest(
  "private-480-492-diagnostic-canaries.json"
);
const privateBatch503533DiagnosticManifest = readManifest(
  "private-503-533-diagnostic-canaries.json"
);
const privateBatch534564DiagnosticManifest = readManifest(
  "private-534-564-diagnostic-canaries.json"
);
const privateBatch565594DiagnosticManifest = readManifest(
  "private-565-594-diagnostic-canaries.json"
);
const privateBenchmarkManifestIds = new Set([
  privateDiagnosticManifest.manifestId,
  privateRootHostOutputTimingManifest.manifestId,
  privateRootCrossRootWarningTimingManifest.manifestId,
  privateRootUpdateTextEventPassiveTimingManifest.manifestId,
  privateActPassiveEffectTimingManifest.manifestId,
  privateBatch480492DiagnosticManifest.manifestId,
  privateBatch503533DiagnosticManifest.manifestId,
  privateBatch534564DiagnosticManifest.manifestId,
  privateBatch565594DiagnosticManifest.manifestId
]);
const privateRootHostOutputDiagnosticScenarioIds = [
  "private-root-host-output-create-mark-listen-diagnostics",
  "private-root-host-output-initial-render-diagnostics",
  "private-root-host-output-update-render-diagnostics",
  "private-root-host-output-unmount-cleanup-diagnostics"
];

test("checked benchmark manifests pass the fail-closed gate", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });

  assert.equal(result.manifestCount, 13);
  assert.equal(result.scenarioCount, 150);
  assert.equal(result.milestoneCount, 34);
  assert.equal(result.resultCount, 0);
  assert.deepEqual(COMPATIBILITY_STATUSES, [
    "blocked-by-conformance",
    "oracle-only",
    "unsupported-placeholder",
    "known-mismatch",
    "matched-but-compatibility-not-claimed",
    "green"
  ]);
  assert.deepEqual(TIMING_STATUSES, [
    "not-collected",
    "blocked-by-conformance",
    "diagnostic-only",
    "compared-not-compatible",
    "comparable",
    "noise-bound",
    "regression",
    "improvement"
  ]);
  assert.deepEqual(BENCHMARK_READINESS_STATUSES, [
    "blocked-by-conformance",
    "diagnostic-admitted",
    "comparable-admitted"
  ]);
  assert.deepEqual(ACCEPTED_GATE_STATUSES, [
    "accepted-blocked",
    "accepted-private-partial",
    "accepted-oracle-only",
    "green-admitted"
  ]);
  assert.deepEqual(CLAIM_CAPABLE_TIMING_STATUSES, [
    "comparable",
    "noise-bound",
    "regression",
    "improvement"
  ]);

  for (const manifest of result.manifests) {
    const acceptedGates = (manifest.conformanceGates ?? [])
      .map((gate) => gate.acceptedGate)
      .filter(Boolean);
    for (const acceptedGate of acceptedGates) {
      assert.notEqual(acceptedGate.status, "green-admitted");
      assert.equal(acceptedGate.compatibilityClaimed, false);
      if (acceptedGate.status !== "accepted-private-partial") {
        assert.equal(acceptedGate.admitted, false);
      }
    }
    for (const scenario of manifest.scenarios) {
      assert.notEqual(scenario.compatibilityStatus, "green");
      assert.ok(!CLAIM_CAPABLE_TIMING_STATUSES.includes(scenario.timingStatus));
      assert.equal(scenario.timingDataPolicy, "diagnostic-until-compatible");
    }
    for (const milestone of manifest.milestones ?? []) {
      assert.notEqual(milestone.compatibilityStatus, "green");
      assert.ok(!CLAIM_CAPABLE_TIMING_STATUSES.includes(milestone.timingStatus));
      assert.notEqual(milestone.benchmarkReadinessStatus, "comparable-admitted");
    }
  }

  const diagnosticScenarios = result.manifests
    .flatMap((manifest) => manifest.scenarios)
    .filter((scenario) => scenario.timingStatus === "diagnostic-only");
  assert.equal(diagnosticScenarios.length, 84);
  for (const scenario of diagnosticScenarios) {
    assert.equal(
      scenario.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
  }
  assert.deepEqual(
    privateDiagnosticManifest.scenarios
      .filter((scenario) =>
        scenario.conformanceGateIds.includes(
          "react-dom-root-private-host-output-gate"
        )
      )
      .map((scenario) => scenario.id),
    privateRootHostOutputDiagnosticScenarioIds
  );

  const diagnosticMilestones = result.manifests
    .flatMap((manifest) => manifest.milestones ?? [])
    .filter(
      (milestone) =>
        milestone.benchmarkReadinessStatus === "diagnostic-admitted"
    );
  assert.equal(diagnosticMilestones.length, 13);
  for (const milestone of diagnosticMilestones) {
    assert.equal(
      milestone.compatibilityStatus,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(milestone.timingStatus, "diagnostic-only");
  }

  const acceptedGateStatusCounts = result.manifests
    .flatMap((manifest) => manifest.conformanceGates ?? [])
    .map((gate) => gate.acceptedGate)
    .filter(Boolean)
    .reduce((counts, acceptedGate) => {
      counts[acceptedGate.status] = (counts[acceptedGate.status] ?? 0) + 1;
      return counts;
    }, {});
  assert.deepEqual(acceptedGateStatusCounts, {
    "accepted-blocked": 79,
    "accepted-private-partial": 83,
    "accepted-oracle-only": 5
  });

  const admittedPrivateGateCount = result.manifests
    .flatMap((manifest) => manifest.conformanceGates ?? [])
    .map((gate) => gate.acceptedGate)
    .filter(
      (acceptedGate) =>
        acceptedGate?.status === "accepted-private-partial" &&
        acceptedGate.admitted === true
    ).length;
  assert.equal(admittedPrivateGateCount, 75);
});

test("public benchmark manifests stay blocked despite private diagnostics", () => {
  const result = assertBenchmarkGate({ benchmarkRoot, repoRoot });
  const publicManifests = result.manifests.filter(
    (manifest) => !privateBenchmarkManifestIds.has(manifest.manifestId)
  );

  assert.equal(publicManifests.length, 4);

  for (const manifest of publicManifests) {
    for (const gate of manifest.conformanceGates ?? []) {
      if (gate.acceptedGate) {
        assert.equal(gate.acceptedGate.admitted, false);
        assert.equal(gate.acceptedGate.compatibilityClaimed, false);
      }
    }
    for (const scenario of manifest.scenarios) {
      assert.equal(scenario.compatibilityStatus, "blocked-by-conformance");
      assert.equal(scenario.timingStatus, "blocked-by-conformance");
    }
    for (const milestone of manifest.milestones ?? []) {
      assert.equal(milestone.compatibilityStatus, "blocked-by-conformance");
      assert.equal(milestone.timingStatus, "blocked-by-conformance");
      assert.equal(
        milestone.benchmarkReadinessStatus,
        "blocked-by-conformance"
      );
    }
  }
});

test("benchmark manifest gate rejects missing required scenarios", () => {
  const manifest = clone(rootManifest);
  manifest.requiredScenarioIds.push("missing-root-scenario");

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(errors.join("\n"), /missing required scenario missing-root-scenario/);
});

test("benchmark manifest gate rejects claim-capable timing without green compatibility", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].timingStatus = "improvement";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /timingStatus improvement requires compatibilityStatus green/
  );
});

test("benchmark manifest gate rejects unknown scenario statuses", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].compatibilityStatus = "locally-fast";
  manifest.scenarios[0].timingStatus = "headline";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(errors.join("\n"), /unknown compatibilityStatus locally-fast/);
  assert.match(errors.join("\n"), /unknown timingStatus headline/);
});

test("benchmark manifest gate rejects unsupported green compatibility claims", () => {
  const manifest = clone(rootManifest);
  manifest.scenarios[0].compatibilityStatus = "green";
  manifest.scenarios[0].timingStatus = "diagnostic-only";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unsupported green compatibility claim; react-dom-root-render-e2e has conformanceClaims\.compatibilityClaimed=false/
  );
  assert.match(
    errors.join("\n"),
    /unsupported green compatibility claim; react-dom-root-render-e2e acceptedGate\.admitted=false/
  );
});

test("benchmark milestone gate rejects unknown readiness statuses", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "runtime-faster";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unknown benchmarkReadinessStatus runtime-faster/
  );
});

test("benchmark milestone gate rejects comparable admission without green compatibility", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "comparable-admitted";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /benchmarkReadinessStatus comparable-admitted requires compatibilityStatus green/
  );
});

test("benchmark milestone gate rejects diagnostic admission without private gate proof", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].benchmarkReadinessStatus = "diagnostic-admitted";
  manifest.milestones[0].compatibilityStatus =
    "matched-but-compatibility-not-claimed";
  manifest.milestones[0].timingStatus = "diagnostic-only";

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /diagnostic private admission requires react-dom-client-root acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark scenario gate admits proven private diagnostics", () => {
  const manifest = clone(privateDiagnosticManifest);

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.deepEqual(errors, []);
});

test("benchmark scenario gate rejects diagnostic timing without private admission", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.admitted = false;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-bridge-request-records: diagnostic private admission requires react-dom-root-private-bridge-request-gate acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark scenario gate rejects private host-output diagnostics without admitted gate", () => {
  const manifest = clone(privateDiagnosticManifest);
  const hostOutputGate = manifest.conformanceGates.find(
    (gate) => gate.id === "react-dom-root-private-host-output-gate"
  );
  hostOutputGate.acceptedGate.admitted = false;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /scenario private-root-host-output-initial-render-diagnostics: diagnostic private admission requires react-dom-root-private-host-output-gate acceptedGate.status=accepted-private-partial, admitted=true, and compatibilityClaimed=false/
  );
});

test("benchmark accepted gates reject private admission compatibility claims", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.compatibilityClaimed = true;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /accepted-private-partial requires compatibilityClaimed=false/
  );
});

test("benchmark accepted gates reject blocked metadata carrying admission claims", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.conformanceGates[0].acceptedGate.admitted = true;

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /accepted-blocked requires admitted=false and compatibilityClaimed=false/
  );
});

test("benchmark milestone gate rejects unknown covered scenarios", () => {
  const manifest = clone(minimalRootMilestoneManifest);
  manifest.milestones[0].scenarioIds.push("missing-root-milestone-scenario");

  const errors = validateBenchmarkManifest(manifest, { repoRoot });

  assert.match(
    errors.join("\n"),
    /unknown scenario missing-root-milestone-scenario/
  );
});

test("benchmark result gate rejects green timing for blocked scenarios", () => {
  const result = {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: rootManifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: [
      {
        scenarioId: "initial-host-render",
        implementation: "fast-react-js-dev",
        lane: "default-node-development",
        timingStatus: "comparable"
      }
    ]
  };

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /result scenario initial-host-render: timingStatus comparable requires compatibilityStatus green/
  );
});

test("benchmark result gate accepts complete blocked rows without timing metrics", () => {
  const result = buildResultForManifest(rootManifest);

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.deepEqual(errors, []);
});

test("benchmark result gate accepts complete private diagnostic rows only as diagnostics", () => {
  const result = buildResultForManifest(privateDiagnosticManifest, {
    implementation: "fast-react-private-diagnostic",
    lane: "default-node-development-private-diagnostic"
  });

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([
      [privateDiagnosticManifest.manifestId, privateDiagnosticManifest]
    ])
  });

  assert.deepEqual(errors, []);
});

test("benchmark result gate rejects omitted required scenarios", () => {
  const result = buildResultForManifest(rootManifest);
  result.scenarioResults = result.scenarioResults.filter(
    (scenarioResult) => scenarioResult.scenarioId !== "initial-host-render"
  );

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /missing required scenario result initial-host-render/
  );
});

test("benchmark result gate rejects duplicate scenario and lane rows", () => {
  const result = buildResultForManifest(rootManifest);
  result.scenarioResults.push({
    ...result.scenarioResults[0],
    implementation: "fast-react-js-dev-duplicate"
  });

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /duplicate result row for scenario create-root-no-render lane default-node-development/
  );
});

test("benchmark result gate rejects timing-shaped extra properties", () => {
  const result = buildResultForManifest(rootManifest);
  result.summary = { status: "blocked" };
  result.scenarioResults[0].meanMs = 1.23;

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  const joined = errors.join("\n");
  assert.match(joined, /unsupported property summary/);
  assert.match(joined, /unsupported property meanMs/);
});

test("benchmark result gate rejects unsupported non-comparable timing claims", () => {
  const result = buildResultForManifest(rootManifest);
  result.scenarioResults[0].timingStatus = "compared-not-compatible";

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /timingStatus compared-not-compatible is not admitted by manifest scenario timingStatus blocked-by-conformance/
  );
});

test("benchmark result gate rejects public diagnostic timing proof", () => {
  const result = buildResultForManifest(rootManifest);
  result.scenarioResults[0].timingStatus = "diagnostic-only";

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[rootManifest.manifestId, rootManifest]])
  });

  assert.match(
    errors.join("\n"),
    /diagnostic-only result timing requires a private diagnostic scenario.*public performance proof is blocked/
  );
});

test("benchmark result gate rechecks manifest command provenance", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.command =
    "Worker 994 says this stale command passed";
  const result = buildResultForManifest(manifest, {
    implementation: "fast-react-private-diagnostic",
    lane: "default-node-development-private-diagnostic"
  });

  const errors = validateBenchmarkResult(result, {
    manifestById: new Map([[manifest.manifestId, manifest]]),
    repoRoot
  });

  assert.match(
    errors.join("\n"),
    /command segment "Worker 994 says this stale command passed" must be an npm run, node --test, or cargo test command/
  );
});

test("benchmark accepted gates reject decorative non-runnable commands", () => {
  const cases = [
    {
      command: "Worker 957 says this benchmark passed",
      pattern:
        /command segment "Worker 957 says this benchmark passed" must be an npm run, node --test, or cargo test command/
    },
    {
      command: "npm run Worker 957 says this benchmark passed",
      pattern:
        /command segment "npm run Worker 957 says this benchmark passed" must be `npm run <script>` optionally followed by `--workspace <workspace>`/
    },
    {
      command: "npm test --workspace @fast-react/conformance",
      pattern:
        /command segment "npm test --workspace @fast-react\/conformance" must be an npm run, node --test, or cargo test command/
    },
    {
      command: "npm run test:conformance --workspace @fast-react/conformance",
      pattern: /is not an accepted benchmark gate npm command/
    },
    {
      command:
        "npm run root-render-e2e:conformance --workspace @fast-react/conformance -- --format=json",
      pattern:
        /must be `npm run <script>` optionally followed by `--workspace <workspace>`/
    },
    {
      command:
        "NODE_OPTIONS=--test-reporter=spec node --test tests/conformance/test/react-act-oracle.test.mjs",
      pattern:
        /must be an npm run, node --test, or cargo test command/
    },
    {
      command: "node --test this benchmark passed",
      pattern:
        /command segment "node --test this benchmark passed" test target "this" must be a repo \.js or \.mjs test path/
    },
    {
      command:
        "node --test tests/conformance/test/react-act-oracle.test.mjs --test-name-pattern never",
      pattern:
        /test target "--test-name-pattern" must be a repo \.js or \.mjs test path/
    },
    {
      command: "node --test packages/react-dom/src/client/root-bridge.js",
      pattern:
        /test target "packages\/react-dom\/src\/client\/root-bridge\.js" is not an accepted benchmark gate test target/
    },
    {
      command: "cargo test it passed",
      pattern:
        /command segment "cargo test it passed" must include `-p <crate>`/
    },
    {
      command:
        "cargo t -p fast-react-reconciler --all-features root_commit_finished_work",
      pattern:
        /must be an npm run, node --test, or cargo test command/
    },
    {
      command: "node --test tests/benchmarks/src/benchmark-gate.mjs",
      pattern:
        /test target "tests\/benchmarks\/src\/benchmark-gate\.mjs" is not an accepted benchmark gate test target/
    },
    {
      command:
        "cargo test -p fast-react-reconciler --all-features this_benchmark_passed",
      pattern:
        /test filter "this_benchmark_passed" is not an accepted benchmark gate filter for fast-react-reconciler/
    },
    {
      command:
        "cargo test -p fast-react-reconciler --all-features root_commit_finished_work root_scheduler root_updates",
      pattern: /must include at most one Cargo TESTNAME filter/
    },
    {
      command:
        "cargo test -p fast-react-reconciler --all-features root_commit_finished_host_root",
      pattern:
        /test filter "root_commit_finished_host_root" selects zero tests for fast-react-reconciler/
    }
  ];

  for (const { command, pattern } of cases) {
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command = command;

    const errors = validateBenchmarkManifest(manifest, { repoRoot });

    assert.match(errors.join("\n"), pattern);
  }
});

test("benchmark accepted gates reject caller-shaped cwd and env evidence", () => {
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.cwd = "tests/conformance";
  manifest.conformanceGates[0].acceptedGate.env = {
    NODE_ENV: "test"
  };

  const errors = validateBenchmarkManifest(manifest, { repoRoot });
  const joined = errors.join("\n");

  assert.match(joined, /unsupported property cwd/);
  assert.match(joined, /unsupported property env/);
});

test("benchmark accepted gates reject stale package command provenance", () => {
  const fakeRepoRoot = makeFakeCommandRepoRoot({
    conformanceScript: "echo caller-shaped benchmark pass"
  });

  try {
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command =
      "npm run root-render-e2e:conformance --workspace @fast-react/conformance";

    const errors = validateBenchmarkManifest(manifest, {
      repoRoot: fakeRepoRoot
    });
    const joined = errors.join("\n");

    assert.match(
      joined,
      /command provenance must be validated from the current benchmark gate repo root/
    );
    assert.match(
      joined,
      /script root-render-e2e:conformance is stale; expected "node scripts\/check-react-dom-root-render-e2e-conformance\.mjs"/
    );
  } finally {
    rmSync(fakeRepoRoot, { recursive: true, force: true });
  }
});

test("benchmark accepted gates reject inert node:test import spoofs", () => {
  const cases = [
    {
      name: "comment and string",
      nodeTestSource:
        '// import test from "node:test";\nconst inert = "require(\\"node:test\\")";\n'
    },
    {
      name: "regular expression",
      nodeTestSource: '/import test from "node:test"/;\n'
    },
    {
      name: "arrow function regular expression",
      nodeTestSource:
        'const inert = () => /import test from "node:test"/;\n'
    },
    {
      name: "member require call",
      nodeTestSource:
        'const obj = { require(value) { return value; } };\nobj.require("node:test");\n'
    }
  ];

  for (const { name, nodeTestSource } of cases) {
    const fakeRepoRoot = makeFakeCommandRepoRoot({ nodeTestSource });
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command =
      "node --test tests/conformance/test/react-act-oracle.test.mjs";

    try {
      const errors = validateBenchmarkManifest(manifest, {
        repoRoot: fakeRepoRoot
      });

      assert.match(
        errors.join("\n"),
        /test target "tests\/conformance\/test\/react-act-oracle\.test\.mjs" does not import node:test/,
        name
      );
    } finally {
      rmSync(fakeRepoRoot, { recursive: true, force: true });
    }
  }
});

test("benchmark accepted gates reject node:test targets with no current test registrations", () => {
  const cases = [
    {
      name: "empty import",
      nodeTestSource: 'import test from "node:test";\n'
    },
    {
      name: "require without tests",
      nodeTestSource: 'const test = require("node:test");\n'
    },
    {
      name: "hook without tests",
      nodeTestSource:
        'import test from "node:test";\ntest.afterEach(() => {});\n'
    },
    {
      name: "non-top-level registration",
      nodeTestSource:
        'import test from "node:test";\nfunction registerLater() { test("root_commit_finished_work", () => {}); }\n'
    },
    {
      name: "nested require binding with top-level call",
      nodeTestSource:
        'import "node:test";\nfunction install() { const { test } = require("node:test"); }\ntest("root_commit_finished_work", () => {});\n'
    }
  ];

  for (const { name, nodeTestSource } of cases) {
    const fakeRepoRoot = makeFakeCommandRepoRoot({ nodeTestSource });
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command =
      "node --test tests/conformance/test/react-act-oracle.test.mjs";

    try {
      const errors = validateBenchmarkManifest(manifest, {
        repoRoot: fakeRepoRoot
      });

      assert.match(
        errors.join("\n"),
        /test target "tests\/conformance\/test\/react-act-oracle\.test\.mjs" does not register a current node:test test name/,
        name
      );
    } finally {
      rmSync(fakeRepoRoot, { recursive: true, force: true });
    }
  }
});

test("benchmark accepted gates reject accepted cargo filters that select no current tests", () => {
  const cases = [
    {
      name: "comment and string",
      cargoTestSource:
        "// #[test]\n// fn root_commit_finished_work_commented_out() {}\nconst INERT: &str = r#\"#[test] fn root_commit_finished_work_string() {}\"#;\n"
    },
    {
      name: "disabled cfg",
      cargoTestSource:
        "#[cfg(FALSE)]\n#[test]\nfn root_commit_finished_work_cfg_disabled() {}\n"
    },
    {
      name: "disabled target cfg",
      cargoTestSource:
        '#[cfg(target_os = "definitely_not_this_os")]\n#[test]\nfn root_commit_finished_work_disabled_by_target() {}\n'
    },
    {
      name: "unknown cfg",
      cargoTestSource:
        "#[cfg(root_commit_finished_work_unknown_cfg_probe)]\n#[test]\nfn root_commit_finished_work_disabled_by_unknown_cfg() {}\n"
    },
    {
      name: "disabled cfg module",
      cargoTestSource:
        "#[cfg(FALSE)]\nmod disabled {\n  #[test]\n  fn root_commit_finished_work_disabled_module() {}\n}\n"
    },
    {
      name: "disabled cfg external module",
      cargoTestSource: "#[cfg(FALSE)]\nmod disabled;\n",
      cargoExtraFiles: {
        "crates/fast-react-reconciler/src/disabled.rs":
          "#[test]\nfn root_commit_finished_work_disabled_external_module() {}\n"
      }
    },
    {
      name: "disabled cfg nested external module",
      cargoTestSource: "#[cfg(FALSE)]\nmod disabled {\n  mod nested;\n}\n",
      cargoExtraFiles: {
        "crates/fast-react-reconciler/src/disabled/nested.rs":
          "#[test]\nfn root_commit_finished_work_disabled_nested_external_module() {}\n"
      }
    },
    {
      name: "macro template",
      cargoTestSource:
        "macro_rules! inert_test_template { () => { #[test] fn root_commit_finished_work_macro_template() {} }; }\n"
    },
    {
      name: "inner function test",
      cargoTestSource:
        "fn inert() { #[test] fn root_commit_finished_work_inner_only() {} }\n"
    }
  ];

  for (const { name, cargoTestSource, cargoExtraFiles } of cases) {
    const fakeRepoRoot = makeFakeCommandRepoRoot({
      cargoExtraFiles,
      cargoTestSource
    });
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command =
      "cargo test -p fast-react-reconciler --all-features root_commit_finished_work";

    try {
      const errors = validateBenchmarkManifest(manifest, {
        repoRoot: fakeRepoRoot
      });

      assert.match(
        errors.join("\n"),
        /test filter "root_commit_finished_work" selects no current tests for fast-react-reconciler/,
        name
      );
    } finally {
      rmSync(fakeRepoRoot, { recursive: true, force: true });
    }
  }
});

test("benchmark accepted cargo filters discover nested inline external modules", () => {
  const cases = [
    {
      name: "nested module file",
      cargoExtraFiles: {
        "crates/fast-react-reconciler/src/outer/inner.rs":
          "#[test]\nfn root_commit_finished_work_nested_inline_external_module() {}\n"
      }
    },
    {
      name: "nested module mod file",
      cargoExtraFiles: {
        "crates/fast-react-reconciler/src/outer/inner/mod.rs":
          "#[test]\nfn root_commit_finished_work_nested_inline_external_mod_file() {}\n"
      }
    }
  ];

  for (const { name, cargoExtraFiles } of cases) {
    const fakeRepoRoot = makeFakeCommandRepoRoot({
      cargoExtraFiles,
      cargoTestSource: "mod outer {\n  mod inner;\n}\n"
    });
    const manifest = clone(privateDiagnosticManifest);
    manifest.conformanceGates[0].acceptedGate.command =
      "cargo test -p fast-react-reconciler --all-features root_commit_finished_work";

    try {
      const errors = validateBenchmarkManifest(manifest, {
        repoRoot: fakeRepoRoot
      });

      assert.doesNotMatch(
        errors.join("\n"),
        /test filter "root_commit_finished_work" selects no current tests for fast-react-reconciler/,
        name
      );
    } finally {
      rmSync(fakeRepoRoot, { recursive: true, force: true });
    }
  }
});

test("benchmark accepted cargo filters discover host-true cfg nested external modules", () => {
  const fakeRepoRoot = makeFakeCommandRepoRoot({
    cargoExtraFiles: {
      "crates/fast-react-reconciler/src/outer/inner.rs":
        "#[test]\nfn root_commit_finished_work_host_true_cfg_nested_external_module() {}\n"
    },
    cargoTestSource: `#[cfg(target_os = "${rustHostTargetOsForTest()}")]
mod outer {
  mod inner;
}
`
  });
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.command =
    "cargo test -p fast-react-reconciler --all-features root_commit_finished_work";

  try {
    const errors = validateBenchmarkManifest(manifest, {
      repoRoot: fakeRepoRoot
    });

    assert.doesNotMatch(
      errors.join("\n"),
      /test filter "root_commit_finished_work" selects no current tests for fast-react-reconciler/
    );
  } finally {
    rmSync(fakeRepoRoot, { recursive: true, force: true });
  }
});

test("benchmark accepted cargo filters keep rejecting inner-function Rust test spoofs", () => {
  const fakeRepoRoot = makeFakeCommandRepoRoot({
    cargoTestSource: `
      mod outer {
        fn register_later() {
          #[test]
          fn root_commit_finished_work_inner_spoof() {}
        }
      }
    `
  });
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.command =
    "cargo test -p fast-react-reconciler --all-features root_commit_finished_work";

  try {
    const errors = validateBenchmarkManifest(manifest, {
      repoRoot: fakeRepoRoot
    });

    assert.match(
      errors.join("\n"),
      /test filter "root_commit_finished_work" selects no current tests for fast-react-reconciler/
    );
  } finally {
    rmSync(fakeRepoRoot, { recursive: true, force: true });
  }
});

test("benchmark accepted cargo filters ignore undeclared orphan Rust source files", () => {
  const fakeRepoRoot = makeFakeCommandRepoRoot({
    cargoExtraFiles: {
      "crates/fast-react-reconciler/src/orphan.rs":
        "#[test]\nfn root_commit_finished_work_orphan_probe() {}\n"
    },
    cargoTestSource: ""
  });
  const manifest = clone(privateDiagnosticManifest);
  manifest.conformanceGates[0].acceptedGate.command =
    "cargo test -p fast-react-reconciler --all-features root_commit_finished_work";

  try {
    const errors = validateBenchmarkManifest(manifest, {
      repoRoot: fakeRepoRoot
    });

    assert.match(
      errors.join("\n"),
      /test filter "root_commit_finished_work" selects no current tests for fast-react-reconciler/
    );
  } finally {
    rmSync(fakeRepoRoot, { recursive: true, force: true });
  }
});

function readManifest(fileName) {
  return JSON.parse(
    readFileSync(path.join(benchmarkRoot, "manifests", fileName), "utf8")
  );
}

function buildResultForManifest(manifest, options = {}) {
  return {
    schemaVersion: 1,
    kind: "fast-react-benchmark-result",
    manifestId: manifest.manifestId,
    generatedTimestampIncluded: false,
    scenarioResults: manifest.requiredScenarioIds.map((scenarioId) => {
      const scenario = manifest.scenarios.find(
        (entry) => entry.id === scenarioId
      );
      return {
        scenarioId,
        implementation: options.implementation ?? "fast-react-js-dev",
        lane: options.lane ?? "default-node-development",
        timingStatus: options.timingStatus ?? scenario.timingStatus
      };
    })
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rustHostTargetOsForTest() {
  const values = {
    aix: "aix",
    android: "android",
    darwin: "macos",
    freebsd: "freebsd",
    linux: "linux",
    openbsd: "openbsd",
    sunos: "solaris",
    win32: "windows"
  };
  return values[process.platform];
}

function makeFakeCommandRepoRoot({
  conformanceScript =
    "node scripts/check-react-dom-root-render-e2e-conformance.mjs",
  nodeTestSource = 'import test from "node:test";\n',
  cargoExtraFiles = {},
  cargoTestSource = `
    #[cfg(test)]
    mod tests {
      #[test]
      fn root_commit_finished_work_current_fake_test() {}
    }
  `
} = {}) {
  const fakeRepoRoot = mkdtempSync(
    path.join(tmpdir(), "fast-react-benchmark-command-")
  );

  writeJson(path.join(fakeRepoRoot, "package.json"), {
    workspaces: ["tests/*", "packages/*", "bindings/*"]
  });

  mkdirSync(path.join(fakeRepoRoot, "tests/conformance/scripts"), {
    recursive: true
  });
  writeJson(path.join(fakeRepoRoot, "tests/conformance/package.json"), {
    name: "@fast-react/conformance",
    scripts: {
      "root-render-e2e:conformance": conformanceScript
    }
  });
  writeFileSync(
    path.join(
      fakeRepoRoot,
      "tests/conformance/scripts/check-react-dom-root-render-e2e-conformance.mjs"
    ),
    "process.exit(0);\n"
  );
  mkdirSync(path.join(fakeRepoRoot, "tests/conformance/test"), {
    recursive: true
  });
  writeFileSync(
    path.join(fakeRepoRoot, "tests/conformance/test/react-act-oracle.test.mjs"),
    nodeTestSource
  );

  mkdirSync(path.join(fakeRepoRoot, "crates/fast-react-reconciler/src"), {
    recursive: true
  });
  writeFileSync(
    path.join(fakeRepoRoot, "crates/fast-react-reconciler/Cargo.toml"),
    [
      "[package]",
      'name = "fast-react-reconciler"',
      'version = "0.0.0"',
      'edition = "2021"',
      ""
    ].join("\n")
  );
  writeFileSync(
    path.join(fakeRepoRoot, "crates/fast-react-reconciler/src/lib.rs"),
    cargoTestSource
  );
  for (const [relativePath, source] of Object.entries(cargoExtraFiles)) {
    const filePath = path.join(fakeRepoRoot, relativePath);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, source);
  }

  return fakeRepoRoot;
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
