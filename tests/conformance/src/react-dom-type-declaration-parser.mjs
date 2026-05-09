import { posix as pathPosix } from "node:path";

export function createReactDomDeclarationRows({
  filesByPath,
  packageJson,
  externalDeclarationPackages = {}
}) {
  const exportMapRows = createDeclarationExportMapRows(packageJson.exports);
  const parsedByFile = createParsedFileMap({
    filesByPath,
    packageJson
  });
  const externalPackageResolvers = createExternalPackageResolvers(
    externalDeclarationPackages
  );

  const resolvedByFile = new Map();
  const rowsByFile = new Map(
    exportMapRows
      .filter((row) => row.targetKind === "declaration-file")
      .map((row) => [row.declarationFile, row])
  );

  function resolveFile(file, stack = []) {
    if (resolvedByFile.has(file)) {
      return resolvedByFile.get(file);
    }

    const parsed = parsedByFile.get(file);
    if (!parsed) {
      throw new Error(`Cannot resolve declaration exports for ${file}`);
    }

    if (stack.includes(file)) {
      throw new Error(`Declaration re-export cycle: ${[...stack, file].join(" -> ")}`);
    }

    const valueNames = new Set(parsed.directValueExportNames);
    const typeNames = new Set(parsed.directTypeExportNames);
    const unknownNames = new Set();

    for (const reexport of parsed.namedReexports) {
      const target = resolveReexportTarget({
        currentFile: file,
        parsed,
        reexport,
        externalPackageResolvers,
        resolveFile,
        stack
      });

      if (reexport.kind === "type" || target.kind === "type") {
        typeNames.add(reexport.exportedName);
      } else if (target.kind === "value") {
        valueNames.add(reexport.exportedName);
      } else {
        unknownNames.add(reexport.exportedName);
      }
    }

    const resolved = {
      declarationFile: file,
      sourceSubpath: rowsByFile.get(file)?.subpath ?? null,
      allExportNames: sortNames([
        ...new Set([...valueNames, ...typeNames, ...unknownNames])
      ]),
      valueExportNames: sortNames([...valueNames]),
      typeExportNames: sortNames([...typeNames]),
      unknownExportNames: sortNames([...unknownNames])
    };

    resolvedByFile.set(file, resolved);
    return resolved;
  }

  return exportMapRows.map((row) => {
    if (row.targetKind !== "declaration-file") {
      return row;
    }

    const parsed = parsedByFile.get(row.declarationFile);
    return {
      ...row,
      parsed: {
        directValueExportNames: parsed.directValueExportNames,
        directTypeExportNames: parsed.directTypeExportNames,
        globalNamespaceExports: parsed.globalNamespaceExports,
        importSources: parsed.importSources,
        namedReexports: parsed.namedReexports
      },
      resolved: resolveFile(row.declarationFile)
    };
  });
}

export function sortSubpaths(subpaths) {
  return [...subpaths].sort((left, right) => {
    if (left === right) {
      return 0;
    }
    if (left === ".") {
      return -1;
    }
    if (right === ".") {
      return 1;
    }
    if (left === "./package.json") {
      return 1;
    }
    if (right === "./package.json") {
      return -1;
    }
    return left.localeCompare(right);
  });
}

function createDeclarationExportMapRows(exportsValue) {
  if (!exportsValue || typeof exportsValue !== "object") {
    return [];
  }

  return sortSubpaths(Object.keys(exportsValue).filter((key) => key.startsWith("."))).map(
    (subpath) => {
      const target = selectDeclarationTarget(exportsValue[subpath]);
      const conditions = flattenExportTarget(exportsValue[subpath]);

      if (!target) {
        return {
          subpath,
          target: exportsValue[subpath],
          targetKind: "unknown",
          declarationFile: null,
          conditions
        };
      }

      if (target === "./package.json") {
        return {
          subpath,
          target,
          targetKind: "package-json",
          declarationFile: null,
          conditions
        };
      }

      return {
        subpath,
        target,
        targetKind: "declaration-file",
        declarationFile: normalizeDeclarationFile(target),
        conditions
      };
    }
  );
}

function selectDeclarationTarget(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (typeof value.default === "string") {
    return value.default;
  }

  if (value.types) {
    return selectDeclarationTarget(value.types);
  }

  for (const nested of Object.values(value)) {
    const selected = selectDeclarationTarget(nested);
    if (selected) {
      return selected;
    }
  }

  return null;
}

function parseDeclarationFile(sourceText) {
  const source = stripComments(sourceText);
  const directValueExportNames = new Set();
  const directTypeExportNames = new Set();
  const importMap = new Map();
  const importSources = new Set();
  const namedReexports = [];
  const globalNamespaceExports = new Set();

  for (const match of source.matchAll(
    /\bimport\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["']\s*;/gu
  )) {
    const [, body, sourceSpecifier] = match;
    importSources.add(sourceSpecifier);
    for (const specifier of parseNamedSpecifiers(body)) {
      importMap.set(specifier.exportedName, {
        importedName: specifier.importedName,
        source: sourceSpecifier
      });
    }
  }

  for (const match of source.matchAll(
    /\bexport\s+(?:declare\s+)?(function|const|let|var|class|enum|interface|type)\s+([A-Za-z_$][\w$]*)/gu
  )) {
    const [, declarationKind, name] = match;
    if (["interface", "type"].includes(declarationKind)) {
      directTypeExportNames.add(name);
    } else {
      directValueExportNames.add(name);
    }
  }

  for (const match of source.matchAll(
    /\bexport\s+(type\s+)?\{([\s\S]*?)\}\s*(?:from\s*["']([^"']+)["'])?\s*;/gu
  )) {
    const [, typeOnly, body, sourceSpecifier = null] = match;
    for (const specifier of parseNamedSpecifiers(body)) {
      namedReexports.push({
        importedName: specifier.importedName,
        exportedName: specifier.exportedName,
        source: sourceSpecifier,
        kind: typeOnly ? "type" : "unknown"
      });
    }
  }

  for (const match of source.matchAll(/\bexport\s+as\s+namespace\s+([A-Za-z_$][\w$]*)\s*;/gu)) {
    globalNamespaceExports.add(match[1]);
  }

  return {
    directValueExportNames: sortNames([...directValueExportNames]),
    directTypeExportNames: sortNames([...directTypeExportNames]),
    globalNamespaceExports: sortNames([...globalNamespaceExports]),
    importMap,
    importSources: sortNames([...importSources]),
    namedReexports: namedReexports.sort(compareReexports)
  };
}

function resolveReexportTarget({
  currentFile,
  parsed,
  reexport,
  externalPackageResolvers,
  resolveFile,
  stack
}) {
  if (reexport.source) {
    if (!isRelativeSpecifier(reexport.source)) {
      const externalPackage = externalPackageResolvers.get(reexport.source);
      if (!externalPackage) {
        return { kind: "unknown" };
      }
      return classifyResolvedName(
        externalPackage.resolveModule(reexport.source),
        reexport.importedName
      );
    }

    const targetFile = resolveDeclarationSpecifier(currentFile, reexport.source);
    const target = resolveFile(targetFile, [...stack, currentFile]);
    return classifyResolvedName(target, reexport.importedName);
  }

  if (parsed.directValueExportNames.includes(reexport.importedName)) {
    return { kind: "value" };
  }
  if (parsed.directTypeExportNames.includes(reexport.importedName)) {
    return { kind: "type" };
  }

  const imported = parsed.importMap.get(reexport.importedName);
  if (imported?.source?.startsWith(".")) {
    const targetFile = resolveDeclarationSpecifier(currentFile, imported.source);
    const target = resolveFile(targetFile, [...stack, currentFile]);
    return classifyResolvedName(target, imported.importedName);
  }

  return { kind: "unknown" };
}

function createParsedFileMap({ filesByPath, packageJson }) {
  const parsedByFile = new Map();

  for (const [file, sourceText] of Object.entries(filesByPath)) {
    if (!file.endsWith(".d.ts")) {
      continue;
    }
    parsedByFile.set(file, parseDeclarationFile(sourceText));
  }

  for (const row of createDeclarationExportMapRows(packageJson.exports)) {
    if (
      row.targetKind === "declaration-file" &&
      !parsedByFile.has(row.declarationFile)
    ) {
      throw new Error(
        `${packageJson.name}@${packageJson.version} is missing ${row.declarationFile}`
      );
    }
  }

  return parsedByFile;
}

function createExternalPackageResolvers(externalDeclarationPackages) {
  return new Map(
    Object.entries(externalDeclarationPackages).map(([moduleName, packageData]) => [
      moduleName,
      createExternalPackageResolver(packageData)
    ])
  );
}

function createExternalPackageResolver({ filesByPath, packageJson }) {
  const parsedByFile = createParsedFileMap({
    filesByPath,
    packageJson
  });
  const resolvedByModule = new Map();
  const exportRowsBySubpath = new Map(
    createDeclarationExportMapRows(packageJson.exports).map((row) => [
      row.subpath,
      row
    ])
  );

  return {
    resolveModule(moduleName) {
      if (resolvedByModule.has(moduleName)) {
        return resolvedByModule.get(moduleName);
      }

      const row = exportRowsBySubpath.get(".") ?? {
        declarationFile: packageJson.types ?? packageJson.typings ?? "index.d.ts",
        targetKind: "declaration-file"
      };
      if (row.targetKind !== "declaration-file") {
        return emptyResolvedDeclaration(moduleName);
      }

      const parsed = parsedByFile.get(row.declarationFile);
      if (!parsed) {
        throw new Error(
          `${packageJson.name}@${packageJson.version} is missing ${row.declarationFile}`
        );
      }

      const resolved = {
        declarationFile: row.declarationFile,
        sourceSubpath: ".",
        allExportNames: sortNames([
          ...new Set([
            ...parsed.directValueExportNames,
            ...parsed.directTypeExportNames
          ])
        ]),
        valueExportNames: parsed.directValueExportNames,
        typeExportNames: parsed.directTypeExportNames,
        unknownExportNames: []
      };
      resolvedByModule.set(moduleName, resolved);
      return resolved;
    }
  };
}

function emptyResolvedDeclaration(moduleName) {
  return {
    declarationFile: null,
    sourceSubpath: moduleName,
    allExportNames: [],
    valueExportNames: [],
    typeExportNames: [],
    unknownExportNames: []
  };
}

function classifyResolvedName(target, importedName) {
  if (target.valueExportNames.includes(importedName)) {
    return { kind: "value" };
  }
  if (target.typeExportNames.includes(importedName)) {
    return { kind: "type" };
  }
  return { kind: "unknown" };
}

function resolveDeclarationSpecifier(currentFile, sourceSpecifier) {
  const baseDirectory = pathPosix.dirname(currentFile);
  const normalized = pathPosix.normalize(pathPosix.join(baseDirectory, sourceSpecifier));
  if (normalized.endsWith(".d.ts")) {
    return normalized;
  }
  return `${normalized}.d.ts`;
}

function isRelativeSpecifier(sourceSpecifier) {
  return sourceSpecifier.startsWith("./") || sourceSpecifier.startsWith("../");
}

function parseNamedSpecifiers(body) {
  return body
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [importedName, exportedName = importedName] = part
        .split(/\s+as\s+/u)
        .map((name) => name.trim())
        .filter(Boolean);
      return {
        importedName,
        exportedName
      };
    })
    .filter(
      (specifier) =>
        /^[A-Za-z_$][\w$]*$/u.test(specifier.importedName) &&
        /^[A-Za-z_$][\w$]*$/u.test(specifier.exportedName)
    );
}

function stripComments(sourceText) {
  return sourceText
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/(^|[^:])\/\/.*$/gmu, "$1");
}

function normalizeDeclarationFile(target) {
  return target.replace(/^\.\//u, "");
}

function flattenExportTarget(value, conditionPath = []) {
  if (typeof value === "string" || value === null) {
    return [
      {
        conditionPath,
        target: value
      }
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenExportTarget(item, [...conditionPath, `[${index}]`])
    );
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([condition, nested]) =>
      flattenExportTarget(nested, [...conditionPath, condition])
    );
  }

  return [
    {
      conditionPath,
      target: String(value)
    }
  ];
}

function compareReexports(left, right) {
  return (
    left.exportedName.localeCompare(right.exportedName) ||
    left.importedName.localeCompare(right.importedName) ||
    String(left.source).localeCompare(String(right.source))
  );
}

function sortNames(names) {
  return [...names].sort((left, right) => left.localeCompare(right));
}
