import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  readdirSync,
  readFileSync,
  statSync
} from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_DOM_RESOURCE_HINT_APIS,
  REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS
} from "./react-dom-resource-hints-targets.mjs";

const require = createRequire(import.meta.url);
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const reactDomPackageRoot = join(repoRoot, "packages", "react-dom");
const reactDomSourceRoot = join(reactDomPackageRoot, "src");

export const FAST_REACT_DOM_COMPATIBILITY_TARGET = "react-dom@19.2.6";
export const FAST_REACT_DOM_UNIMPLEMENTED_CODE = "FAST_REACT_UNIMPLEMENTED";
export const FAST_REACT_DOM_PLACEHOLDER_VERSION =
  "0.0.0-fast-react-dom-placeholder";
export const FAST_REACT_DOM_IMPLEMENTED_VERSION = "19.2.6";
export const FAST_REACT_DOM_INTERNALS_EXPORT =
  "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE";

export const FAST_REACT_RESOURCE_FORM_ACTION_INTERNALS_GATE_SOURCE_FILES =
  new Set(["packages/react-dom/src/resource-form-internals-gate.js"]);

export const FAST_REACT_RESOURCE_HINT_PLACEHOLDER_ENTRYPOINTS = [
  {
    entrypoint: "react-dom",
    fileName: "index.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedFunctionName: "",
    expectedLengths: {
      prefetchDNS: 1,
      preconnect: 2,
      preload: 2,
      preloadModule: 2,
      preinit: 2,
      preinitModule: 2
    },
    privateDispatcherShape: "react-dom-export-oracle-shape"
  },
  {
    entrypoint: "react-dom/profiling",
    fileName: "profiling.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedFunctionName: "",
    expectedLengths: {
      prefetchDNS: 1,
      preconnect: 2,
      preload: 2,
      preloadModule: 2,
      preinit: 2,
      preinitModule: 2
    },
    privateDispatcherShape: "react-dom-export-oracle-shape"
  },
  {
    entrypoint: "react-dom",
    fileName: "react-dom.react-server.js",
    version: FAST_REACT_DOM_PLACEHOLDER_VERSION,
    expectedFunctionName: "exportName",
    expectedLengths: {
      prefetchDNS: 0,
      preconnect: 0,
      preload: 0,
      preloadModule: 0,
      preinit: 0,
      preinitModule: 0
    },
    privateDispatcherShape: "opaque"
  }
];

export const FAST_REACT_PRIVATE_DISPATCHER_PLACEHOLDER_KEYS = [
  "f",
  "r",
  "D",
  "C",
  "L",
  "m",
  "X",
  "S",
  "M"
];

assert.deepEqual(
  new Set(FAST_REACT_PRIVATE_DISPATCHER_PLACEHOLDER_KEYS.slice(2)),
  new Set(REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS)
);

export const FAST_REACT_RESOURCE_SINGLETON_UNSUPPORTED_SOURCE_PATTERNS = [
  {
    id: "host-hoistable-tag",
    pattern: /\bHostHoistable\b/u,
    reason:
      "HostHoistable classification requires resource adapter lifecycle gates."
  },
  {
    id: "host-singleton-tag",
    pattern: /\bHostSingleton\b/u,
    reason:
      "HostSingleton classification requires singleton adapter lifecycle gates."
  },
  {
    id: "hoistable-helper",
    pattern: /\b(?:hoistable|Hoistable)\b/u,
    reason:
      "Hoistable DOM helpers must stay absent until resource prerequisites exist."
  },
  {
    id: "singleton-helper",
    pattern: /\b(?:singleton|Singleton)\b/u,
    reason:
      "Singleton DOM helpers must stay absent until singleton prerequisites exist."
  },
  {
    id: "resource-lifecycle-helper",
    pattern:
      /\b(?:getResource|acquireResource|releaseResource|preloadResource|suspendResource)\b/u,
    reason:
      "Resource lifecycle hooks need dedicated DOM-effect and commit-order gates."
  },
  {
    id: "singleton-lifecycle-helper",
    pattern:
      /\b(?:resolveSingletonInstance|acquireSingletonInstance|releaseSingletonInstance)\b/u,
    reason:
      "Singleton lifecycle hooks need dedicated document ownership gates."
  },
  {
    id: "resource-hint-side-effect",
    pattern: /\b(?:prefetchDNS|preconnect|preloadModule|preinitModule)\b/u,
    reason:
      "Public resource hint calls must remain facade placeholders with no DOM side effects."
  }
];

export function assertFastReactResourceHintUnsupportedGate() {
  for (const entrypoint of FAST_REACT_RESOURCE_HINT_PLACEHOLDER_ENTRYPOINTS) {
    const moduleExports = requireReactDomPackageFile(entrypoint.fileName);
    assertFastReactDomPlaceholderMetadata(
      moduleExports,
      entrypoint.entrypoint
    );
    assert.equal(
      moduleExports.version,
      entrypoint.version,
      `${entrypoint.entrypoint} version`
    );

    for (const apiName of REACT_DOM_RESOURCE_HINT_APIS) {
      assertFastReactDomUnsupportedExport(moduleExports, {
        entrypoint: entrypoint.entrypoint,
        expectedLength: entrypoint.expectedLengths[apiName],
        expectedName:
          entrypoint.expectedFunctionName === "exportName" ? apiName : "",
        exportName: apiName
      });
    }

    if (entrypoint.privateDispatcherShape === "react-dom-export-oracle-shape") {
      assertReactDomInternalsDispatcherPlaceholder(moduleExports, {
        entrypoint: entrypoint.entrypoint,
        requiredMethods: FAST_REACT_PRIVATE_DISPATCHER_PLACEHOLDER_KEYS
      });
    } else {
      assertOpaqueReactServerInternalsPlaceholder(moduleExports, {
        entrypoint: entrypoint.entrypoint
      });
    }
  }
}

export function assertFastReactResourceAndSingletonPrerequisiteGate() {
  const matches = findDisallowedReactDomSourceMatches(
    FAST_REACT_RESOURCE_SINGLETON_UNSUPPORTED_SOURCE_PATTERNS
  );
  assert.deepEqual(
    matches,
    [],
    formatDisallowedSourceMessage(matches)
  );
}

export function assertFastReactDomUnsupportedExport(
  moduleExports,
  { entrypoint, expectedLength, expectedName, exportName }
) {
  const descriptor = Object.getOwnPropertyDescriptor(moduleExports, exportName);
  assert.ok(descriptor, `${entrypoint}.${exportName} descriptor`);
  assert.deepEqual(dataDescriptorFields(descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });

  const fn = descriptor.value;
  assert.equal(typeof fn, "function", `${entrypoint}.${exportName} type`);
  assert.equal(fn.length, expectedLength, `${entrypoint}.${exportName} length`);
  assert.equal(fn.name, expectedName, `${entrypoint}.${exportName} name`);
  assertFastReactDomUnsupportedThrow(
    () => fn("fast-react-placeholder-gate"),
    {
      entrypoint,
      exportName
    }
  );
}

export function assertFastReactDomUnsupportedThrow(
  callback,
  { entrypoint, exportName }
) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, "FastReactDomUnimplementedError", exportName);
      assert.equal(error.code, FAST_REACT_DOM_UNIMPLEMENTED_CODE, exportName);
      assert.equal(error.entrypoint, entrypoint, exportName);
      assert.equal(error.exportName, exportName, exportName);
      assert.equal(
        error.compatibilityTarget,
        FAST_REACT_DOM_COMPATIBILITY_TARGET,
        exportName
      );
      assert.match(
        error.message,
        /placeholder has no React DOM behavior implementation yet/u,
        exportName
      );
      return true;
    },
    `${entrypoint}.${exportName}`
  );
}

export function assertFastReactDomPlaceholderMetadata(
  moduleExports,
  entrypoint
) {
  assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, entrypoint);
  assert.equal(moduleExports.__FAST_REACT_ENTRYPOINT__, entrypoint, entrypoint);
  assert.equal(
    moduleExports.compatibilityTarget,
    FAST_REACT_DOM_COMPATIBILITY_TARGET,
    entrypoint
  );
  assert.equal(
    Object.keys(moduleExports).includes("__FAST_REACT_PLACEHOLDER__"),
    false,
    `${entrypoint} placeholder marker must be non-enumerable`
  );
  assert.equal(
    Object.keys(moduleExports).includes("__FAST_REACT_ENTRYPOINT__"),
    false,
    `${entrypoint} entrypoint metadata must be non-enumerable`
  );
  assert.equal(
    Object.keys(moduleExports).includes("compatibilityTarget"),
    false,
    `${entrypoint} compatibility metadata must be non-enumerable`
  );
}

export function assertReactDomInternalsDispatcherPlaceholder(
  moduleExports,
  { entrypoint, requiredMethods }
) {
  const internals = moduleExports[FAST_REACT_DOM_INTERNALS_EXPORT];
  assert.equal(typeof internals, "object", `${entrypoint} internals`);
  assert.notEqual(internals, null, `${entrypoint} internals`);
  assert.deepEqual(Object.keys(internals), ["d", "p", "findDOMNode"]);
  assert.equal(internals.p, 0, `${entrypoint} internals.p`);
  assert.equal(internals.findDOMNode, null, `${entrypoint} findDOMNode`);
  assert.deepEqual(Object.keys(internals.d), requiredMethods);

  for (const method of requiredMethods) {
    const descriptor = Object.getOwnPropertyDescriptor(internals.d, method);
    assert.ok(descriptor, `${entrypoint}.d.${method} descriptor`);
    assert.deepEqual(dataDescriptorFields(descriptor), {
      configurable: true,
      enumerable: true,
      writable: true
    });
    assert.equal(
      descriptor.value.length,
      0,
      `${entrypoint}.d.${method} length`
    );
    assert.equal(
      descriptor.value.name,
      `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.${method}`,
      `${entrypoint}.d.${method} name`
    );
    assertFastReactDomUnsupportedThrow(
      () => internals.d[method]("fast-react-placeholder-gate"),
      {
        entrypoint,
        exportName: `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.${method}`
      }
    );
  }
}

export function assertOpaqueReactServerInternalsPlaceholder(
  moduleExports,
  { entrypoint }
) {
  const internals = moduleExports[FAST_REACT_DOM_INTERNALS_EXPORT];
  assert.equal(
    Object.prototype.toString.call(internals),
    "[object FastReactDomUnimplementedInternals]"
  );
  assert.deepEqual(Reflect.ownKeys(internals), []);
  assertFastReactDomUnsupportedThrow(
    () => internals.d,
    {
      entrypoint,
      exportName: `${FAST_REACT_DOM_INTERNALS_EXPORT}.d`
    }
  );
}

export function findDisallowedReactDomSourceMatches(patterns) {
  const matches = [];
  for (const filePath of listSourceFiles(reactDomSourceRoot)) {
    const relativeFile = relative(repoRoot, filePath).split(sep).join("/");
    if (
      FAST_REACT_RESOURCE_FORM_ACTION_INTERNALS_GATE_SOURCE_FILES.has(
        relativeFile
      )
    ) {
      continue;
    }

    const contents = readFileSync(filePath, "utf8");
    for (const { id, pattern, reason } of patterns) {
      const match = pattern.exec(contents);
      if (match !== null) {
        matches.push({
          file: relativeFile,
          id,
          match: match[0],
          reason
        });
      }
    }
  }
  return matches;
}

export function formatDisallowedSourceMessage(matches) {
  if (matches.length === 0) {
    return "React DOM unsupported source gates passed.";
  }

  return [
    "React DOM unsupported source gates found implementation tokens before prerequisites exist:",
    ...matches.map(
      (match) =>
        `${match.file}: ${match.id} matched ${JSON.stringify(match.match)} (${match.reason})`
    )
  ].join("\n");
}

export function requireReactDomPackageFile(fileName) {
  const absolutePath = join(reactDomPackageRoot, fileName);
  delete require.cache[require.resolve(absolutePath)];
  return require(absolutePath);
}

function listSourceFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];
  for (const entry of entries) {
    const entryPath = join(directory, entry);
    const stat = statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(entryPath));
    } else if (stat.isFile() && entryPath.endsWith(".js")) {
      files.push(entryPath);
    }
  }
  return files;
}

function dataDescriptorFields(descriptor) {
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}
