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
    const importedEntries = discoverRequiredStaticImportsFromSource({
      entry,
      source,
      requiredEntrySet
    });
    importsByEntry.set(entry, importedEntries);
  }

  return importsByEntry;
}

function discoverRequiredStaticImportsFromSource({
  entry,
  source,
  requiredEntries,
  requiredEntrySet = new Set(requiredEntries)
}) {
  return parseStaticRelativeMjsImports(source)
    .map((specifier) =>
      normalizeEntry(path.posix.join(path.posix.dirname(entry), specifier))
    )
    .filter((importedEntry) => requiredEntrySet.has(importedEntry))
    .sort(compareEntries);
}

function parseStaticRelativeMjsImports(source) {
  const imports = [];
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

    if (
      parenDepth === 0 &&
      braceDepth === 0 &&
      bracketDepth === 0 &&
      source.startsWith("import", index) &&
      isLineStartBefore(source, index) &&
      isIdentifierBoundary(source[index - 1]) &&
      isIdentifierBoundary(source[index + "import".length])
    ) {
      const result = readStaticImportDeclaration(source, index);
      if (result) {
        if (
          result.specifier.startsWith("./") ||
          result.specifier.startsWith("../")
        ) {
          imports.push(result.specifier);
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

  return imports;
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
      endIndex: skipImportDeclarationTail(source, literal.endIndex)
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
      const specifierStart = skipWhitespaceAndComments(
        source,
        index + "from".length
      );
      if (source[specifierStart] !== "'" && source[specifierStart] !== "\"") {
        return null;
      }
      const literal = readStringLiteral(source, specifierStart);
      return {
        specifier: literal.value,
        endIndex: skipImportDeclarationTail(source, literal.endIndex)
      };
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

function skipImportDeclarationTail(source, startIndex) {
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
  for (let index = startIndex + 1; index < source.length; index += 1) {
    const character = source[index];

    if (character === "\\") {
      index += 1;
    } else if (character === "`") {
      return index;
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
