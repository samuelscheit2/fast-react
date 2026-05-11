import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
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
  const analysis = analyzeConformanceTestScriptCoverage({
    testScript: "node --test test/*.test.mjs",
    requiredEntries,
    importedEntriesByEntry: new Map([
      [
        "test/react-dom-root-render-e2e-conformance-gate.test.mjs",
        ["test/react-dom-root-render-e2e-conformance-gate.mjs"]
      ]
    ])
  });

  assert.deepEqual(analysis.uncoveredEntries, []);
  assert.deepEqual(analysis.importCoveredEntries, [
    "test/react-dom-root-render-e2e-conformance-gate.mjs"
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
  const requiredEntrySet = new Set(requiredEntries);
  const importsByEntry = new Map();

  for (const entry of entries) {
    const source = await fs.readFile(path.join(root, entry), "utf8");
    const importedEntries = parseStaticRelativeMjsImports(source)
      .map((specifier) =>
        normalizeEntry(path.posix.join(path.posix.dirname(entry), specifier))
      )
      .filter((importedEntry) => requiredEntrySet.has(importedEntry))
      .sort(compareEntries);
    importsByEntry.set(entry, importedEntries);
  }

  return importsByEntry;
}

function parseStaticRelativeMjsImports(source) {
  const imports = [];
  const importPattern =
    /\bimport\s+(?:[^'";]*?\s+from\s+)?["'](\.{1,2}\/[^"']+\.mjs)["']/gu;

  for (const match of source.matchAll(importPattern)) {
    imports.push(match[1]);
  }

  return imports;
}

async function discoverMjsFiles(directory, { include, relativePrefix }) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && include(entry.name))
    .map((entry) => `${relativePrefix}/${entry.name}`)
    .sort(compareEntries);
}

function analyzeConformanceTestScriptCoverage({
  testScript,
  requiredEntries,
  importedEntriesByEntry = new Map()
}) {
  const patterns = extractNodeTestPatterns(testScript);
  const directCoveredEntries = requiredEntries
    .filter((entry) =>
      patterns.some((pattern) => testPatternMatchesEntry(pattern, entry))
    )
    .sort(compareEntries);
  const covered = new Set(directCoveredEntries);
  const pendingEntries = [...directCoveredEntries];

  while (pendingEntries.length > 0) {
    const entry = pendingEntries.shift();
    for (const importedEntry of importedEntriesByEntry.get(entry) ?? []) {
      if (!covered.has(importedEntry)) {
        covered.add(importedEntry);
        pendingEntries.push(importedEntry);
      }
    }
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
