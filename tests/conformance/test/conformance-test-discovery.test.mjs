import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const conformanceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("workspace conformance test script covers every executable conformance test gate", async () => {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(conformanceRoot, "package.json"), "utf8")
  );
  const requiredEntries = await discoverRequiredConformanceTestEntries(
    conformanceRoot
  );
  const directAnalysis = analyzeConformanceTestScriptCoverage({
    testScript: packageJson.scripts.test,
    requiredEntries
  });
  const importedEntriesByEntry = await discoverStaticImportsForEntries({
    root: conformanceRoot,
    entries: directAnalysis.directCoveredEntries,
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: packageJson.scripts.test,
    requiredEntries,
    importedEntriesByEntry
  });

  assert.equal(
    analysis.directCoveredEntries.includes(
      "test/react-act-public-blocked-gate.mjs"
    ),
    true
  );
  assert.equal(
    analysis.coveredEntries.includes(
      "test/react-dom-root-render-e2e-conformance-gate.mjs"
    ),
    true
  );
  assert.deepEqual(
    analysis.uncoveredEntries,
    [],
    `Conformance executable test gates are not covered by package.json scripts.test: ${analysis.uncoveredEntries.join(
      ", "
    )}`
  );
});

test("discovery helper rejects standalone executable gates missed by a test-only glob", () => {
  const requiredEntries = [
    "test/existing-oracle.test.mjs",
    "test/react-act-public-blocked-gate.mjs",
    "src/react-test-renderer-serialization-local-gate.test.mjs"
  ];
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript:
      "node --test test/*.test.mjs src/react-test-renderer-serialization-local-gate.test.mjs",
    requiredEntries
  });

  assert.deepEqual(analysis.uncoveredEntries, [
    "test/react-act-public-blocked-gate.mjs"
  ]);
});

test("discovery helper rejects newly added executable gates that no script pattern matches", () => {
  const requiredEntries = [
    "test/existing-oracle.test.mjs",
    "test/new-root-render-blocked-gate.mjs",
    "test/react-act-public-blocked-gate.mjs",
    "src/react-test-renderer-serialization-local-gate.test.mjs"
  ];
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript:
      "node --test test/*.test.mjs test/react-act-public-blocked-gate.mjs src/react-test-renderer-serialization-local-gate.test.mjs",
    requiredEntries
  });

  assert.deepEqual(analysis.uncoveredEntries, [
    "test/new-root-render-blocked-gate.mjs"
  ]);
});

test("discovery helper accepts standalone gates imported by covered wrapper tests", () => {
  const requiredEntries = [
    "test/react-dom-root-render-e2e-conformance-gate.mjs",
    "test/react-dom-root-render-e2e-conformance-gate.test.mjs"
  ];
  const wrapperEntry = "test/react-dom-root-render-e2e-conformance-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: 'import "./react-dom-root-render-e2e-conformance-gate.mjs";\n',
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(analysis.uncoveredEntries, []);
  assert.deepEqual(analysis.importCoveredEntries, [
    "test/react-dom-root-render-e2e-conformance-gate.mjs"
  ]);
});

test("discovery helper accepts standalone gates re-exported by covered wrapper tests", () => {
  const requiredEntries = [
    "test/named-reexport-gate.mjs",
    "test/non-relative-gate.mjs",
    "test/reexport-wrapper.test.mjs",
    "test/star-reexport-gate.mjs"
  ];
  const wrapperEntry = "test/reexport-wrapper.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: [
      'export * from "./star-reexport-gate.mjs";',
      'export { value } from "./named-reexport-gate.mjs";',
      'export * from "test/non-relative-gate.mjs";'
    ].join("\n"),
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(importedEntries, [
    "test/named-reexport-gate.mjs",
    "test/star-reexport-gate.mjs"
  ]);
  assert.deepEqual(analysis.importCoveredEntries, [
    "test/named-reexport-gate.mjs",
    "test/star-reexport-gate.mjs"
  ]);
  assert.deepEqual(analysis.uncoveredEntries, [
    "test/non-relative-gate.mjs"
  ]);
});

test("static wrapper import discovery ignores commented-out imports", () => {
  const requiredEntries = [
    "test/commented-gate.mjs",
    "test/root-render-gate.mjs",
    "test/root-render-gate.test.mjs"
  ];
  const wrapperEntry = "test/root-render-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: [
      '// import "./commented-gate.mjs";',
      'import "./root-render-gate.mjs";'
    ].join("\n"),
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(importedEntries, ["test/root-render-gate.mjs"]);
  assert.deepEqual(analysis.uncoveredEntries, ["test/commented-gate.mjs"]);
});

test("static wrapper import discovery ignores import-looking string literals", () => {
  const requiredEntries = [
    "test/root-render-gate.mjs",
    "test/root-render-gate.test.mjs",
    "test/string-literal-gate.mjs"
  ];
  const wrapperEntry = "test/root-render-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: [
      'const text = "import \\"./string-literal-gate.mjs\\"";',
      "const template = `import \"./string-literal-gate.mjs\"`;",
      'import "./root-render-gate.mjs";'
    ].join("\n"),
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(importedEntries, ["test/root-render-gate.mjs"]);
  assert.deepEqual(analysis.uncoveredEntries, [
    "test/string-literal-gate.mjs"
  ]);
});

test("static wrapper re-export discovery ignores comments and literals", () => {
  const requiredEntries = [
    "test/commented-gate.mjs",
    "test/literal-gate.mjs",
    "test/root-render-gate.mjs",
    "test/root-render-gate.test.mjs",
    "test/template-gate.mjs"
  ];
  const wrapperEntry = "test/root-render-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: [
      '// export * from "./commented-gate.mjs";',
      '/* export { value } from "./commented-gate.mjs"; */',
      'const text = "export * from \\"./literal-gate.mjs\\"";',
      "const template = `export { value } from \"./template-gate.mjs\"`;",
      "const nested = `${`",
      'export * from "./template-gate.mjs";',
      "`}`;",
      'export { value } from "./root-render-gate.mjs";'
    ].join("\n"),
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(importedEntries, ["test/root-render-gate.mjs"]);
  assert.deepEqual(analysis.uncoveredEntries, [
    "test/commented-gate.mjs",
    "test/literal-gate.mjs",
    "test/template-gate.mjs"
  ]);
});

test("static wrapper import discovery skips nested template literal imports", () => {
  const requiredEntries = [
    "test/real-gate.mjs",
    "test/root-render-gate.test.mjs",
    "test/template-false-green-gate.mjs"
  ];
  const wrapperEntry = "test/root-render-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: [
      "const hostile = `${`",
      'import "./template-false-green-gate.mjs";',
      "`}`;",
      'import "./real-gate.mjs";'
    ].join("\n"),
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(importedEntries, ["test/real-gate.mjs"]);
  assert.deepEqual(analysis.importCoveredEntries, ["test/real-gate.mjs"]);
  assert.deepEqual(analysis.uncoveredEntries, [
    "test/template-false-green-gate.mjs"
  ]);
});

test("discovery helper accepts deterministic broad patterns when they cover every required entry", () => {
  const requiredEntries = [
    "test/existing-oracle.test.mjs",
    "test/react-act-public-blocked-gate.mjs",
    "src/react-test-renderer-serialization-local-gate.test.mjs"
  ];
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.mjs src/*.test.mjs",
    requiredEntries
  });

  assert.deepEqual(analysis.uncoveredEntries, []);
  assert.deepEqual(
    analysis.coveredEntries,
    [...requiredEntries].sort(compareEntries)
  );
});

test("recursive discovery reports nested test and source gates missed by top-level globs", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFiles(root, [
      "fixtures/outside-test-src-gate.test.mjs",
      "scripts/outside-test-src-gate.mjs",
      "src/deep/missed-source-gate.test.mjs",
      "src/deep/source-helper.mjs",
      "src/top-level-source-gate.test.mjs",
      "test/existing-oracle.test.mjs",
      "test/nested/missed-conformance-gate.mjs",
      "test/top-level-conformance-gate.mjs"
    ]);

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.mjs src/*.test.mjs",
      requiredEntries
    });

    assert.deepEqual(
      requiredEntries,
      [
        "src/deep/missed-source-gate.test.mjs",
        "src/top-level-source-gate.test.mjs",
        "test/existing-oracle.test.mjs",
        "test/nested/missed-conformance-gate.mjs",
        "test/top-level-conformance-gate.mjs"
      ].sort(compareEntries)
    );
    assert.deepEqual(
      analysis.directCoveredEntries,
      [
        "src/top-level-source-gate.test.mjs",
        "test/existing-oracle.test.mjs",
        "test/top-level-conformance-gate.mjs"
      ].sort(compareEntries)
    );
    assert.deepEqual(analysis.uncoveredEntries, [
      "src/deep/missed-source-gate.test.mjs",
      "test/nested/missed-conformance-gate.mjs"
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("static wrapper import discovery accepts nested gates imported by covered nested wrappers", () => {
  const requiredEntries = [
    "test/nested/root-render-gate.mjs",
    "test/nested/root-render-gate.test.mjs"
  ];
  const wrapperEntry = "test/nested/root-render-gate.test.mjs";
  const importedEntries = discoverRequiredStaticImportsFromSource({
    entry: wrapperEntry,
    source: 'import "./root-render-gate.mjs";\n',
    requiredEntries
  });
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/**/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([[wrapperEntry, importedEntries]])
  });

  assert.deepEqual(analysis.uncoveredEntries, []);
  assert.deepEqual(analysis.importCoveredEntries, [
    "test/nested/root-render-gate.mjs"
  ]);
});

test("static import graph discovery follows transitive wrapper coverage", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFile(
      root,
      "test/root-wrapper.test.mjs",
      'import "./intermediate-wrapper.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "test/intermediate-wrapper.mjs",
      'import "./final-gate.mjs";\n'
    );
    await writeConformanceFixtureFile(root, "test/final-gate.mjs");
    await writeConformanceFixtureFile(root, "src/source-helper.mjs");

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const directAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries
    });
    const importedEntriesByEntry = await discoverStaticImportsForEntries({
      root,
      entries: directAnalysis.directCoveredEntries,
      requiredEntries
    });
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry
    });

    assert.deepEqual(requiredEntries, [
      "test/final-gate.mjs",
      "test/intermediate-wrapper.mjs",
      "test/root-wrapper.test.mjs"
    ]);
    assert.deepEqual(importedEntriesByEntry, new Map([
      ["test/final-gate.mjs", []],
      ["test/intermediate-wrapper.mjs", ["test/final-gate.mjs"]],
      ["test/root-wrapper.test.mjs", ["test/intermediate-wrapper.mjs"]]
    ]));
    assert.deepEqual(analysis.uncoveredEntries, []);
    assert.deepEqual(analysis.importCoveredEntries, [
      "test/final-gate.mjs",
      "test/intermediate-wrapper.mjs"
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("static re-export graph discovery follows transitive wrapper coverage", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFile(
      root,
      "test/root-wrapper.test.mjs",
      'export { value } from "./intermediate-wrapper.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "test/intermediate-wrapper.mjs",
      'export * from "./final-gate.mjs";\n'
    );
    await writeConformanceFixtureFile(root, "test/final-gate.mjs");
    await writeConformanceFixtureFile(root, "src/source-helper.mjs");

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const directAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries
    });
    const importedEntriesByEntry = await discoverStaticImportsForEntries({
      root,
      entries: directAnalysis.directCoveredEntries,
      requiredEntries
    });
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry
    });

    assert.deepEqual(requiredEntries, [
      "test/final-gate.mjs",
      "test/intermediate-wrapper.mjs",
      "test/root-wrapper.test.mjs"
    ]);
    assert.deepEqual(importedEntriesByEntry, new Map([
      ["test/final-gate.mjs", []],
      ["test/intermediate-wrapper.mjs", ["test/final-gate.mjs"]],
      ["test/root-wrapper.test.mjs", ["test/intermediate-wrapper.mjs"]]
    ]));
    assert.deepEqual(analysis.uncoveredEntries, []);
    assert.deepEqual(analysis.importCoveredEntries, [
      "test/final-gate.mjs",
      "test/intermediate-wrapper.mjs"
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("static import graph discovery does not bridge through nested template imports", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFile(
      root,
      "test/root-wrapper.test.mjs",
      'import "./template-wrapper.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "test/template-wrapper.mjs",
      [
        "const hostile = `${`",
        'import "./bridge-wrapper.mjs";',
        'export * from "./bridge-wrapper.mjs";',
        "`}`;",
        'export { value } from "./real-leaf.mjs";',
        ""
      ].join("\n")
    );
    await writeConformanceFixtureFile(
      root,
      "test/bridge-wrapper.mjs",
      'import "./missed-gate.mjs";\n'
    );
    await writeConformanceFixtureFile(root, "test/missed-gate.mjs");
    await writeConformanceFixtureFile(root, "test/real-leaf.mjs");
    await writeConformanceFixtureFile(root, "src/source-helper.mjs");

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const directAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries
    });
    const importedEntriesByEntry = await discoverStaticImportsForEntries({
      root,
      entries: directAnalysis.directCoveredEntries,
      requiredEntries
    });
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry
    });

    assert.deepEqual(requiredEntries, [
      "test/bridge-wrapper.mjs",
      "test/missed-gate.mjs",
      "test/real-leaf.mjs",
      "test/root-wrapper.test.mjs",
      "test/template-wrapper.mjs"
    ]);
    assert.deepEqual(importedEntriesByEntry, new Map([
      ["test/real-leaf.mjs", []],
      ["test/root-wrapper.test.mjs", ["test/template-wrapper.mjs"]],
      ["test/template-wrapper.mjs", ["test/real-leaf.mjs"]]
    ]));
    assert.deepEqual(analysis.coveredEntries, [
      "test/real-leaf.mjs",
      "test/root-wrapper.test.mjs",
      "test/template-wrapper.mjs"
    ]);
    assert.deepEqual(analysis.uncoveredEntries, [
      "test/bridge-wrapper.mjs",
      "test/missed-gate.mjs"
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("static module edge coverage does not bridge through non-required fixtures", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFile(
      root,
      "test/root-wrapper.test.mjs",
      'export * from "../fixtures/sidecar.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "fixtures/sidecar.mjs",
      'export * from "../test/missed-gate.mjs";\n'
    );
    await writeConformanceFixtureFile(root, "test/missed-gate.mjs");
    await writeConformanceFixtureFile(root, "src/source-helper.mjs");

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const directAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries
    });
    const importedEntriesByEntry = await discoverStaticImportsForEntries({
      root,
      entries: directAnalysis.directCoveredEntries,
      requiredEntries
    });
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry
    });
    const sidecarBridgeAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry: new Map([
        ["fixtures/sidecar.mjs", ["test/missed-gate.mjs"]],
        ["test/root-wrapper.test.mjs", ["fixtures/sidecar.mjs"]]
      ])
    });

    assert.deepEqual(requiredEntries, [
      "test/missed-gate.mjs",
      "test/root-wrapper.test.mjs"
    ]);
    assert.deepEqual(importedEntriesByEntry, new Map([
      ["test/root-wrapper.test.mjs", []]
    ]));
    assert.deepEqual(analysis.coveredEntries, ["test/root-wrapper.test.mjs"]);
    assert.deepEqual(analysis.uncoveredEntries, ["test/missed-gate.mjs"]);
    assert.deepEqual(sidecarBridgeAnalysis.coveredEntries, [
      "test/root-wrapper.test.mjs"
    ]);
    assert.deepEqual(sidecarBridgeAnalysis.uncoveredEntries, [
      "test/missed-gate.mjs"
    ]);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("recursive static module edge coverage is cycle-safe and ignores false-green edges", async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "fast-react-conformance-discovery-")
  );

  try {
    await writeConformanceFixtureFile(
      root,
      "test/root-wrapper.test.mjs",
      [
        'import "./cycle-a.mjs";',
        'import "./nonstatic-wrapper.mjs";',
        'import "../fixtures/unrelated-sidecar.mjs";',
        'import "react";',
        'export * from "external-cycle.mjs";',
        ""
      ].join("\n")
    );
    await writeConformanceFixtureFile(
      root,
      "test/cycle-a.mjs",
      'export * from "./cycle-b.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "test/cycle-b.mjs",
      'export { value } from "./cycle-a.mjs";\n'
    );
    await writeConformanceFixtureFile(
      root,
      "test/nonstatic-wrapper.mjs",
      [
        '// import "./missed-gate.mjs";',
        '// export * from "./missed-gate.mjs";',
        'const text = "import \\"./missed-gate.mjs\\"";',
        'const exportText = "export * from \\"./missed-gate.mjs\\"";',
        "const template = `import \"./missed-gate.mjs\"`;",
        "const exportTemplate = `export { value } from \"./missed-gate.mjs\"`;",
        'const load = () => import("./missed-gate.mjs");',
        "export { load };",
        ""
      ].join("\n")
    );
    await writeConformanceFixtureFile(
      root,
      "fixtures/unrelated-sidecar.mjs",
      "export {};\n"
    );
    await writeConformanceFixtureFile(root, "test/missed-gate.mjs");
    await writeConformanceFixtureFile(root, "src/source-helper.mjs");

    const requiredEntries = await discoverRequiredConformanceTestEntries(root);
    const directAnalysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries
    });
    const importedEntriesByEntry = await discoverStaticImportsForEntries({
      root,
      entries: directAnalysis.directCoveredEntries,
      requiredEntries
    });
    const analysis = analyzeConformanceTestScriptCoverage({
      testScript: "node --test test/*.test.mjs",
      requiredEntries,
      importedEntriesByEntry
    });

    assert.deepEqual(importedEntriesByEntry, new Map([
      ["test/cycle-a.mjs", ["test/cycle-b.mjs"]],
      ["test/cycle-b.mjs", ["test/cycle-a.mjs"]],
      ["test/nonstatic-wrapper.mjs", []],
      [
        "test/root-wrapper.test.mjs",
        ["test/cycle-a.mjs", "test/nonstatic-wrapper.mjs"]
      ]
    ]));
    assert.deepEqual(analysis.coveredEntries, [
      "test/cycle-a.mjs",
      "test/cycle-b.mjs",
      "test/nonstatic-wrapper.mjs",
      "test/root-wrapper.test.mjs"
    ]);
    assert.deepEqual(analysis.uncoveredEntries, ["test/missed-gate.mjs"]);
    assert.equal(
      analysis.coveredEntries.includes("fixtures/unrelated-sidecar.mjs"),
      false
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

async function discoverRequiredConformanceTestEntries(root) {
  const testEntries = await discoverMjsFiles(path.join(root, "test"), {
    include: (name) => name.endsWith(".mjs"),
    relativePrefix: "test"
  });
  const sourceTestEntries = await discoverMjsFiles(path.join(root, "src"), {
    include: (name) => name.endsWith(".test.mjs"),
    relativePrefix: "src"
  });

  return [...testEntries, ...sourceTestEntries].sort(compareEntries);
}

async function discoverStaticImportsForEntries({
  root,
  entries,
  requiredEntries
}) {
  const importsByEntry = new Map();
  const pendingEntries = [...entries].sort(compareEntries);
  const requiredEntrySet = new Set(requiredEntries);
  const visitedEntries = new Set();

  while (pendingEntries.length > 0) {
    const entry = pendingEntries.shift();
    if (visitedEntries.has(entry)) {
      continue;
    }
    visitedEntries.add(entry);

    const source = await fs.readFile(path.join(root, entry), "utf8");
    const importedEntries = discoverStaticRelativeMjsImportsFromSource({
      entry,
      source
    }).filter(
      (importedEntry) =>
        isConformanceRelativeEntry(importedEntry) &&
        requiredEntrySet.has(importedEntry)
    );
    importsByEntry.set(entry, importedEntries);

    for (const importedEntry of importedEntries) {
      if (!visitedEntries.has(importedEntry)) {
        pendingEntries.push(importedEntry);
      }
    }

    pendingEntries.sort(compareEntries);
  }

  return importsByEntry;
}

function discoverRequiredStaticImportsFromSource({
  entry,
  source,
  requiredEntries,
  requiredEntrySet = new Set(requiredEntries)
}) {
  return discoverStaticRelativeMjsImportsFromSource({ entry, source })
    .filter((importedEntry) => requiredEntrySet.has(importedEntry))
    .sort(compareEntries);
}

function discoverStaticRelativeMjsImportsFromSource({ entry, source }) {
  return parseStaticRelativeMjsModuleSpecifiers(source)
    .map((specifier) =>
      normalizeEntry(path.posix.join(path.posix.dirname(entry), specifier))
    )
    .filter((importedEntry) => importedEntry.endsWith(".mjs"))
    .sort(compareEntries);
}

function isConformanceRelativeEntry(entry) {
  return (
    !path.posix.isAbsolute(entry) &&
    entry !== ".." &&
    !entry.startsWith("../")
  );
}

function parseStaticRelativeMjsModuleSpecifiers(source) {
  const moduleSpecifiers = [];
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(source, index);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(source, index);
      continue;
    }

    if (character === "'" || character === "\"") {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index);
      continue;
    }

    if (parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
      const result = readStaticModuleDeclaration(source, index);
      if (result) {
        if (
          result.specifier.startsWith("./") ||
          result.specifier.startsWith("../")
        ) {
          moduleSpecifiers.push(result.specifier);
        }
        index = result.endIndex;
        continue;
      }
    }

    if (character === "(") {
      parenDepth += 1;
    } else if (character === ")" && parenDepth > 0) {
      parenDepth -= 1;
    } else if (character === "{") {
      braceDepth += 1;
    } else if (character === "}" && braceDepth > 0) {
      braceDepth -= 1;
    } else if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]" && bracketDepth > 0) {
      bracketDepth -= 1;
    }
  }

  return moduleSpecifiers;
}

function readStaticModuleDeclaration(source, startIndex) {
  if (
    source.startsWith("import", startIndex) &&
    isLineStartBefore(source, startIndex) &&
    isIdentifierBoundary(source[startIndex - 1]) &&
    isIdentifierBoundary(source[startIndex + "import".length])
  ) {
    return readStaticImportDeclaration(source, startIndex);
  }

  if (
    source.startsWith("export", startIndex) &&
    isLineStartBefore(source, startIndex) &&
    isIdentifierBoundary(source[startIndex - 1]) &&
    isIdentifierBoundary(source[startIndex + "export".length])
  ) {
    return readStaticExportDeclaration(source, startIndex);
  }

  return null;
}

function readStaticImportDeclaration(source, startIndex) {
  let index = startIndex + "import".length;
  index = skipWhitespaceAndComments(source, index);

  if (source[index] === "(" || source[index] === ".") {
    return null;
  }

  if (source[index] === "'" || source[index] === "\"") {
    const literal = readStringLiteral(source, index);
    return {
      specifier: literal.value,
      endIndex: skipStaticDeclarationTail(source, literal.endIndex)
    };
  }

  let localParenDepth = 0;
  let localBraceDepth = 0;
  let localBracketDepth = 0;

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (
      localParenDepth === 0 &&
      localBraceDepth === 0 &&
      localBracketDepth === 0 &&
      source.startsWith("from", index) &&
      isIdentifierBoundary(source[index - 1]) &&
      isIdentifierBoundary(source[index + "from".length])
    ) {
      return readModuleSpecifierAfterFrom(source, index);
    }

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(source, index) + 1;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(source, index) + 1;
      continue;
    }

    if (character === "'" || character === "\"") {
      index = skipStringLiteral(source, index) + 1;
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index) + 1;
      continue;
    }

    if (character === ";") {
      return null;
    }

    if (character === "(") {
      localParenDepth += 1;
    } else if (character === ")" && localParenDepth > 0) {
      localParenDepth -= 1;
    } else if (character === "{") {
      localBraceDepth += 1;
    } else if (character === "}" && localBraceDepth > 0) {
      localBraceDepth -= 1;
    } else if (character === "[") {
      localBracketDepth += 1;
    } else if (character === "]" && localBracketDepth > 0) {
      localBracketDepth -= 1;
    }

    index += 1;
  }

  return null;
}

function readStaticExportDeclaration(source, startIndex) {
  let index = startIndex + "export".length;
  index = skipWhitespaceAndComments(source, index);

  if (source[index] === "*") {
    return readStaticDeclarationFromClause(source, index + 1);
  }

  if (source[index] === "{") {
    const closingBraceIndex = findMatchingBrace(source, index);
    if (closingBraceIndex === null) {
      return null;
    }

    const fromIndex = skipWhitespaceAndComments(source, closingBraceIndex + 1);
    if (!isFromKeyword(source, fromIndex)) {
      return null;
    }

    return readModuleSpecifierAfterFrom(source, fromIndex);
  }

  return null;
}

function readStaticDeclarationFromClause(source, startIndex) {
  let index = startIndex;
  let localParenDepth = 0;
  let localBraceDepth = 0;
  let localBracketDepth = 0;

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (
      localParenDepth === 0 &&
      localBraceDepth === 0 &&
      localBracketDepth === 0 &&
      isFromKeyword(source, index)
    ) {
      return readModuleSpecifierAfterFrom(source, index);
    }

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(source, index) + 1;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(source, index) + 1;
      continue;
    }

    if (character === "'" || character === "\"") {
      index = skipStringLiteral(source, index) + 1;
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index) + 1;
      continue;
    }

    if (character === ";") {
      return null;
    }

    if (character === "(") {
      localParenDepth += 1;
    } else if (character === ")" && localParenDepth > 0) {
      localParenDepth -= 1;
    } else if (character === "{") {
      localBraceDepth += 1;
    } else if (character === "}" && localBraceDepth > 0) {
      localBraceDepth -= 1;
    } else if (character === "[") {
      localBracketDepth += 1;
    } else if (character === "]" && localBracketDepth > 0) {
      localBracketDepth -= 1;
    }

    index += 1;
  }

  return null;
}

function readModuleSpecifierAfterFrom(source, fromIndex) {
  const specifierStart = skipWhitespaceAndComments(
    source,
    fromIndex + "from".length
  );
  if (source[specifierStart] !== "'" && source[specifierStart] !== "\"") {
    return null;
  }
  const literal = readStringLiteral(source, specifierStart);
  return {
    specifier: literal.value,
    endIndex: skipStaticDeclarationTail(source, literal.endIndex)
  };
}

function skipWhitespaceAndComments(source, startIndex) {
  let index = startIndex;

  while (index < source.length) {
    if (/\s/u.test(source[index])) {
      index += 1;
    } else if (source[index] === "/" && source[index + 1] === "/") {
      index = skipLineComment(source, index) + 1;
    } else if (source[index] === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) + 1;
    } else {
      return index;
    }
  }

  return index;
}

function skipStaticDeclarationTail(source, startIndex) {
  let index = startIndex;

  while (index < source.length) {
    if (source[index] === ";") {
      return index;
    }

    if (source[index] === "/" && source[index + 1] === "//") {
      return skipLineComment(source, index);
    }

    if (source[index] === "/" && source[index + 1] === "*") {
      index = skipBlockComment(source, index) + 1;
    } else {
      index += 1;
    }
  }

  return source.length - 1;
}

function findMatchingBrace(source, startIndex) {
  let braceDepth = 1;

  for (let index = startIndex + 1; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(source, index);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(source, index);
      continue;
    }

    if (character === "'" || character === "\"") {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index);
      continue;
    }

    if (character === "{") {
      braceDepth += 1;
    } else if (character === "}") {
      braceDepth -= 1;
      if (braceDepth === 0) {
        return index;
      }
    }
  }

  return null;
}

function readStringLiteral(source, startIndex) {
  const quote = source[startIndex];
  let value = "";

  for (let index = startIndex + 1; index < source.length; index += 1) {
    const character = source[index];

    if (character === "\\") {
      if (index + 1 < source.length) {
        index += 1;
        value += source[index];
      }
    } else if (character === quote) {
      return {
        value,
        endIndex: index
      };
    } else {
      value += character;
    }
  }

  return {
    value,
    endIndex: source.length - 1
  };
}

function skipStringLiteral(source, startIndex) {
  return readStringLiteral(source, startIndex).endIndex;
}

function skipTemplateLiteral(source, startIndex) {
  let index = startIndex + 1;

  while (index < source.length) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "\\") {
      index += 2;
    } else if (character === "$" && nextCharacter === "{") {
      index = skipTemplateExpression(source, index + 2) + 1;
    } else if (character === "`") {
      return index;
    } else {
      index += 1;
    }
  }

  return source.length - 1;
}

function skipTemplateExpression(source, startIndex) {
  let braceDepth = 1;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "/" && nextCharacter === "/") {
      index = skipLineComment(source, index);
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      index = skipBlockComment(source, index);
      continue;
    }

    if (character === "'" || character === "\"") {
      index = skipStringLiteral(source, index);
      continue;
    }

    if (character === "`") {
      index = skipTemplateLiteral(source, index);
      continue;
    }

    if (character === "{") {
      braceDepth += 1;
    } else if (character === "}") {
      braceDepth -= 1;
      if (braceDepth === 0) {
        return index;
      }
    }
  }

  return source.length - 1;
}

function skipLineComment(source, startIndex) {
  const endIndex = source.indexOf("\n", startIndex + 2);
  return endIndex === -1 ? source.length - 1 : endIndex;
}

function skipBlockComment(source, startIndex) {
  const endIndex = source.indexOf("*/", startIndex + 2);
  return endIndex === -1 ? source.length - 1 : endIndex + 1;
}

function isIdentifierBoundary(character) {
  return character === undefined || !/[A-Za-z0-9_$]/u.test(character);
}

function isFromKeyword(source, index) {
  return (
    source.startsWith("from", index) &&
    isIdentifierBoundary(source[index - 1]) &&
    isIdentifierBoundary(source[index + "from".length])
  );
}

function isLineStartBefore(source, index) {
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    if (source[cursor] === "\n" || source[cursor] === "\r") {
      return true;
    }

    if (!/\s/u.test(source[cursor])) {
      return false;
    }
  }

  return true;
}

async function discoverMjsFiles(directory, { include, relativePrefix }) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const discovered = [];

  for (const entry of entries.sort((left, right) =>
    compareEntries(left.name, right.name)
  )) {
    const entryPath = path.join(directory, entry.name);
    const relativeEntry = `${relativePrefix}/${entry.name}`;

    if (entry.isDirectory()) {
      discovered.push(
        ...(await discoverMjsFiles(entryPath, {
          include,
          relativePrefix: relativeEntry
        }))
      );
    } else if (entry.isFile() && include(entry.name)) {
      discovered.push(relativeEntry);
    }
  }

  return discovered.sort(compareEntries);
}

async function writeConformanceFixtureFiles(root, entries) {
  for (const entry of entries) {
    await writeConformanceFixtureFile(root, entry);
  }
}

async function writeConformanceFixtureFile(root, entry, source = "export {};\n") {
  const filePath = path.join(root, entry);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, source, "utf8");
}

function analyzeConformanceTestScriptCoverage({
  testScript,
  requiredEntries,
  importedEntriesByEntry = new Map()
}) {
  const patterns = extractNodeTestPatterns(testScript);
  const requiredEntrySet = new Set(requiredEntries);
  const directCoveredEntries = requiredEntries
    .filter((entry) =>
      patterns.some((pattern) => testPatternMatchesEntry(pattern, entry))
    )
    .sort(compareEntries);
  const covered = new Set(directCoveredEntries);
  const pendingEntries = [...directCoveredEntries];
  const visitedEntries = new Set();

  while (pendingEntries.length > 0) {
    const entry = pendingEntries.shift();
    if (visitedEntries.has(entry)) {
      continue;
    }
    visitedEntries.add(entry);

    for (const importedEntry of importedEntriesByEntry.get(entry) ?? []) {
      if (!requiredEntrySet.has(importedEntry)) {
        continue;
      }

      if (!covered.has(importedEntry)) {
        covered.add(importedEntry);
      }

      if (!visitedEntries.has(importedEntry)) {
        pendingEntries.push(importedEntry);
      }
    }

    pendingEntries.sort(compareEntries);
  }

  const coveredEntries = [...covered].sort(compareEntries);
  const importCoveredEntries = coveredEntries.filter(
    (entry) => !directCoveredEntries.includes(entry)
  );
  const uncoveredEntries = requiredEntries
    .filter((entry) => !covered.has(entry))
    .sort(compareEntries);

  return {
    nodeTestPatterns: patterns,
    directCoveredEntries,
    importCoveredEntries,
    coveredEntries,
    uncoveredEntries
  };
}

function extractNodeTestPatterns(script) {
  const tokens = tokenizePackageScript(script);
  const patterns = [];
  let nodeCommandSeen = false;
  let nodeTestCommand = false;
  let skipNextToken = false;

  for (const token of tokens) {
    if (isCommandSeparator(token)) {
      nodeCommandSeen = false;
      nodeTestCommand = false;
      skipNextToken = false;
      continue;
    }

    if (skipNextToken) {
      skipNextToken = false;
      continue;
    }

    if (!nodeCommandSeen && !nodeTestCommand) {
      nodeCommandSeen = isNodeCommand(token);
      continue;
    }

    if (nodeCommandSeen && !nodeTestCommand) {
      if (token === "--test") {
        nodeCommandSeen = false;
        nodeTestCommand = true;
        continue;
      }

      nodeCommandSeen = token.startsWith("-");
      continue;
    }

    if (nodeTestCommand) {
      if (NODE_TEST_FLAGS_WITH_VALUE.has(token)) {
        skipNextToken = true;
        continue;
      }

      if (token.startsWith("-")) {
        continue;
      }

      patterns.push(normalizeEntry(token));
    }
  }

  return patterns;
}

const NODE_TEST_FLAGS_WITH_VALUE = new Set([
  "--test-name-pattern",
  "--test-reporter",
  "--test-reporter-destination"
]);

function tokenizePackageScript(script) {
  const tokens = [];
  let current = "";
  let quote = null;

  for (let index = 0; index < script.length; index += 1) {
    const character = script[index];

    if (quote) {
      if (character === quote) {
        quote = null;
      } else if (
        character === "\\" &&
        quote !== "'" &&
        index + 1 < script.length
      ) {
        index += 1;
        current += script[index];
      } else {
        current += character;
      }
      continue;
    }

    if (character === "'" || character === "\"") {
      quote = character;
    } else if (/\s/u.test(character)) {
      pushToken(tokens, current);
      current = "";
    } else if (character === ";") {
      pushToken(tokens, current);
      current = "";
      tokens.push(character);
    } else if (
      (character === "&" || character === "|") &&
      script[index + 1] === character
    ) {
      pushToken(tokens, current);
      current = "";
      tokens.push(`${character}${character}`);
      index += 1;
    } else if (character === "\\" && index + 1 < script.length) {
      index += 1;
      current += script[index];
    } else {
      current += character;
    }
  }

  assert.equal(quote, null, "package script contains an unterminated quote");
  pushToken(tokens, current);
  return tokens;
}

function pushToken(tokens, token) {
  if (token.length > 0) {
    tokens.push(token);
  }
}

function testPatternMatchesEntry(pattern, entry) {
  if (!hasGlob(pattern)) {
    const directoryPattern = pattern.endsWith("/") ? pattern : `${pattern}/`;
    return entry === pattern || entry.startsWith(directoryPattern);
  }

  return globPatternToRegExp(pattern).test(entry);
}

function globPatternToRegExp(pattern) {
  let regexp = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (character === "*") {
      if (pattern[index + 1] === "*") {
        regexp += ".*";
        index += 1;
      } else {
        regexp += "[^/]*";
      }
    } else if (character === "?") {
      regexp += "[^/]";
    } else {
      regexp += escapeRegExp(character);
    }
  }

  return new RegExp(`${regexp}$`, "u");
}

function escapeRegExp(character) {
  return character.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

function hasGlob(pattern) {
  return /[*?[\]]/u.test(pattern);
}

function normalizeEntry(entry) {
  let normalized = entry.replaceAll("\\", "/");
  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }
  return path.posix.normalize(normalized);
}

function isNodeCommand(token) {
  return token === "node" || token === "node.exe" || token.endsWith("/node");
}

function isCommandSeparator(token) {
  return token === "&&" || token === "||" || token === ";";
}

function compareEntries(left, right) {
  return left.localeCompare(right);
}
