'use strict';

const { createUnimplementedError } = require('./placeholder-utils.js');

let transitionDepth = 0;

const startTransitionRootlessCurrentnessReports = new WeakSet();
const startTransitionRootlessSurfaceCurrentnessRowsByReport = new WeakMap();

const compatibilityTarget = 'react@19.2.6';

const startTransitionRootlessCurrentnessFieldNames = freezeArray([
  'apiName',
  'compatibilityTarget',
  'currentPublicExport',
  'rootlessFacade',
  'transitionScopeExecution',
  'errorChannel',
  'restoresPreviousDepth',
  'restoresPreviousDepthAfterThrow',
  'schedulerIntegration',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'dispatcherRouting',
  'schedulerCallbackExecution',
  'compatibilityClaimed',
  'blocker'
]);
const startTransitionRootlessCurrentness = freezeRecord({
  apiName: 'startTransition',
  compatibilityTarget,
  currentPublicExport: 'react.startTransition facade',
  rootlessFacade: true,
  transitionScopeExecution: 'synchronous',
  errorChannel: 'global-report-error',
  restoresPreviousDepth: true,
  restoresPreviousDepthAfterThrow: true,
  schedulerIntegration: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rootExecution: false,
  dispatcherRouting: false,
  schedulerCallbackExecution: false,
  compatibilityClaimed: false,
  blocker:
    'startTransition remains a rootless facade until scheduler and root-lane integration are admitted'
});
const startTransitionRootlessCurrentnessReportKind =
  'fast-react.private.start_transition_rootless_currentness';
const startTransitionRootlessCurrentnessReportVersion = 1;
const startTransitionRootlessCurrentnessStatus =
  'source-current-for-react-19.2.6-startTransition-rootless-facade';
const startTransitionRootlessCurrentnessConsumptionStatus =
  'accepted-blocked-private-startTransition-rootless-currentness';
const startTransitionBlockedExecutionPaths = freezeArray([
  'dispatcher-routing',
  'scheduler-callback',
  'root-lane-selection',
  'root-scheduling',
  'root-execution'
]);
const startTransitionBlockedCompatibilityClaims = freezeArray([
  'public-transition',
  'public-root',
  'scheduler-package',
  'package-compatibility'
]);
const startTransitionRootlessSurfaceCurrentnessFieldNames = freezeArray([
  'surfaceId',
  'source',
  'entrypoint',
  'moduleShape',
  'hasStartTransitionExport',
  'sameAsRootlessFacade',
  'sameAsRootExport',
  'sameAsCjsDevelopmentExport',
  'sameAsCjsProductionExport',
  'reactServerStartTransitionAbsent',
  'functionName',
  'functionLength',
  'rootlessFacade',
  'blockedExecutionPaths',
  'blockedCompatibilityClaims',
  'compatibilityClaimed'
]);
const startTransitionRootlessSurfaceCurrentnessArrayFieldNames = freezeArray([
  'blockedExecutionPaths',
  'blockedCompatibilityClaims'
]);
const startTransitionRootlessSurfaceCurrentnessRows =
  freezeStartTransitionRootlessSurfaceCurrentnessRows([
    {
      surfaceId: 'react-root',
      source: 'packages/react/index.js',
      entrypoint: 'react',
      moduleShape: 'CommonJS root export',
      hasStartTransitionExport: true,
      sameAsRootlessFacade: true,
      sameAsRootExport: true,
      sameAsCjsDevelopmentExport: true,
      sameAsCjsProductionExport: true,
      reactServerStartTransitionAbsent: true,
      functionName: '',
      functionLength: 1,
      rootlessFacade: true,
      blockedExecutionPaths: startTransitionBlockedExecutionPaths,
      blockedCompatibilityClaims: startTransitionBlockedCompatibilityClaims,
      compatibilityClaimed: false
    },
    {
      surfaceId: 'react-cjs-development',
      source: 'packages/react/cjs/react.development.js',
      entrypoint: 'react/cjs/react.development.js',
      moduleShape: 'CommonJS alias export',
      hasStartTransitionExport: true,
      sameAsRootlessFacade: true,
      sameAsRootExport: true,
      sameAsCjsDevelopmentExport: true,
      sameAsCjsProductionExport: true,
      reactServerStartTransitionAbsent: true,
      functionName: '',
      functionLength: 1,
      rootlessFacade: true,
      blockedExecutionPaths: startTransitionBlockedExecutionPaths,
      blockedCompatibilityClaims: startTransitionBlockedCompatibilityClaims,
      compatibilityClaimed: false
    },
    {
      surfaceId: 'react-cjs-production',
      source: 'packages/react/cjs/react.production.js',
      entrypoint: 'react/cjs/react.production.js',
      moduleShape: 'CommonJS alias export',
      hasStartTransitionExport: true,
      sameAsRootlessFacade: true,
      sameAsRootExport: true,
      sameAsCjsDevelopmentExport: true,
      sameAsCjsProductionExport: true,
      reactServerStartTransitionAbsent: true,
      functionName: '',
      functionLength: 1,
      rootlessFacade: true,
      blockedExecutionPaths: startTransitionBlockedExecutionPaths,
      blockedCompatibilityClaims: startTransitionBlockedCompatibilityClaims,
      compatibilityClaimed: false
    },
    {
      surfaceId: 'react-server',
      source: 'packages/react/react.react-server.js',
      entrypoint: 'react react-server',
      moduleShape: 'React Server CommonJS export',
      hasStartTransitionExport: false,
      sameAsRootlessFacade: false,
      sameAsRootExport: false,
      sameAsCjsDevelopmentExport: false,
      sameAsCjsProductionExport: false,
      reactServerStartTransitionAbsent: true,
      functionName: null,
      functionLength: null,
      rootlessFacade: false,
      blockedExecutionPaths: startTransitionBlockedExecutionPaths,
      blockedCompatibilityClaims: startTransitionBlockedCompatibilityClaims,
      compatibilityClaimed: false
    }
  ]);
const startTransitionRootlessCurrentnessReportOptionNames = freezeArray([
  'rootlessCurrentness',
  'surfaceCurrentnessFieldNames',
  'publicTransitionCompatibilityBlocked',
  'publicRootCompatibilityBlocked',
  'schedulerCompatibilityBlocked',
  'schedulerPackageCompatibilityBlocked',
  'packageCompatibilityBlocked',
  'dispatcherRoutingBlocked',
  'schedulerExecutionBlocked',
  'rootLaneIntegrationBlocked',
  'rootSchedulingBlocked',
  'rootExecutionBlocked',
  'callbackExecutionBlocked',
  'publicTransitionCompatibility',
  'publicRootCompatibility',
  'publicSchedulerCompatibility',
  'schedulerIntegration',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'schedulerCallbackExecution',
  'packageCompatibility',
  'compatibilityClaimed'
]);
const startTransitionRootlessCurrentnessBlockedFlags = freezeArray([
  'publicTransitionCompatibilityBlocked',
  'publicRootCompatibilityBlocked',
  'schedulerCompatibilityBlocked',
  'schedulerPackageCompatibilityBlocked',
  'packageCompatibilityBlocked',
  'dispatcherRoutingBlocked',
  'schedulerExecutionBlocked',
  'rootLaneIntegrationBlocked',
  'rootSchedulingBlocked',
  'rootExecutionBlocked',
  'callbackExecutionBlocked'
]);
const startTransitionRootlessCurrentnessCompatibilityFalseFlags = freezeArray([
  'publicTransitionCompatibility',
  'publicRootCompatibility',
  'publicSchedulerCompatibility',
  'schedulerIntegration',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'schedulerCallbackExecution',
  'packageCompatibility',
  'compatibilityClaimed'
]);
const startTransitionRootlessCurrentnessReportFieldNames = freezeArray([
  'kind',
  'version',
  'status',
  'compatibilityTarget',
  'apiName',
  'rootlessCurrentnessFieldNames',
  'rootlessCurrentness',
  'surfaceCurrentnessFieldNames',
  'surfaceCurrentnessRows',
  'publicTransitionCompatibilityBlocked',
  'publicRootCompatibilityBlocked',
  'schedulerCompatibilityBlocked',
  'schedulerPackageCompatibilityBlocked',
  'packageCompatibilityBlocked',
  'dispatcherRoutingBlocked',
  'schedulerExecutionBlocked',
  'rootLaneIntegrationBlocked',
  'rootSchedulingBlocked',
  'rootExecutionBlocked',
  'callbackExecutionBlocked',
  'publicTransitionCompatibility',
  'publicRootCompatibility',
  'publicSchedulerCompatibility',
  'schedulerIntegration',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'schedulerCallbackExecution',
  'packageCompatibility',
  'compatibilityClaimed'
]);

function reportGlobalError(error) {
  if (typeof reportError === 'function') {
    reportError(error);
    return;
  }

  if (
    typeof window === 'object' &&
    typeof window.ErrorEvent === 'function'
  ) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      typeof error.message === 'string'
        ? String(error.message)
        : String(error);
    const event = new window.ErrorEvent('error', {
      bubbles: true,
      cancelable: true,
      error,
      message
    });
    const shouldLog = window.dispatchEvent(event);
    if (!shouldLog) {
      return;
    }
  } else if (
    typeof process === 'object' &&
    typeof process.emit === 'function'
  ) {
    process.emit('uncaughtException', error);
    return;
  }

  console.error(error);
}

function isTransitionBatchActive() {
  return transitionDepth > 0;
}

function noop() {}

function sanitizeStartTransitionRootlessCurrentnessReportOptions(overrides) {
  if (overrides == null) {
    return {
      options: {},
      sourceOwnedOptions: true
    };
  }

  if (!isObjectLike(overrides) || typeof overrides === 'function') {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  let prototype;
  let ownKeys;

  try {
    prototype = Object.getPrototypeOf(overrides);
    ownKeys = Reflect.ownKeys(overrides);
  } catch {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  if (prototype !== Object.prototype && prototype !== null) {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  const ownStringKeys = new Set();
  const options = {};

  for (const key of ownKeys) {
    if (
      typeof key !== 'string' ||
      !startTransitionRootlessCurrentnessReportOptionNames.includes(key)
    ) {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    let descriptor;

    try {
      descriptor = Object.getOwnPropertyDescriptor(overrides, key);
    } catch {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    if (
      descriptor == null ||
      !Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ) {
      return {
        options: {},
        sourceOwnedOptions: false
      };
    }

    ownStringKeys.add(key);
    options[key] = descriptor.value;
  }

  try {
    for (const key in overrides) {
      if (!ownStringKeys.has(key)) {
        return {
          options: {},
          sourceOwnedOptions: false
        };
      }
    }
  } catch {
    return {
      options: {},
      sourceOwnedOptions: false
    };
  }

  return {
    options,
    sourceOwnedOptions: true
  };
}

function createStartTransitionRootlessCurrentnessReport(overrides = {}) {
  const { options, sourceOwnedOptions } =
    sanitizeStartTransitionRootlessCurrentnessReportOptions(overrides);
  const surfaceCurrentnessRows =
    createStartTransitionRootlessSurfaceCurrentnessRows();
  const report = freezeRecord({
    kind: startTransitionRootlessCurrentnessReportKind,
    version: startTransitionRootlessCurrentnessReportVersion,
    status: startTransitionRootlessCurrentnessStatus,
    compatibilityTarget,
    apiName: 'startTransition',
    rootlessCurrentnessFieldNames: freezeArray(
      startTransitionRootlessCurrentnessFieldNames
    ),
    rootlessCurrentness: freezeRecord({
      ...startTransitionRootlessCurrentness,
      ...(options.rootlessCurrentness ?? {})
    }),
    surfaceCurrentnessFieldNames: freezeArray(
      options.surfaceCurrentnessFieldNames ??
        startTransitionRootlessSurfaceCurrentnessFieldNames
    ),
    surfaceCurrentnessRows,
    publicTransitionCompatibilityBlocked:
      options.publicTransitionCompatibilityBlocked ?? true,
    publicRootCompatibilityBlocked:
      options.publicRootCompatibilityBlocked ?? true,
    schedulerCompatibilityBlocked:
      options.schedulerCompatibilityBlocked ?? true,
    schedulerPackageCompatibilityBlocked:
      options.schedulerPackageCompatibilityBlocked ?? true,
    packageCompatibilityBlocked: options.packageCompatibilityBlocked ?? true,
    dispatcherRoutingBlocked: options.dispatcherRoutingBlocked ?? true,
    schedulerExecutionBlocked: options.schedulerExecutionBlocked ?? true,
    rootLaneIntegrationBlocked: options.rootLaneIntegrationBlocked ?? true,
    rootSchedulingBlocked: options.rootSchedulingBlocked ?? true,
    rootExecutionBlocked: options.rootExecutionBlocked ?? true,
    callbackExecutionBlocked: options.callbackExecutionBlocked ?? true,
    publicTransitionCompatibility:
      options.publicTransitionCompatibility ?? false,
    publicRootCompatibility: options.publicRootCompatibility ?? false,
    publicSchedulerCompatibility:
      options.publicSchedulerCompatibility ?? false,
    schedulerIntegration: options.schedulerIntegration ?? false,
    rootLaneIntegration: options.rootLaneIntegration ?? false,
    rootScheduling: options.rootScheduling ?? false,
    rootExecution: options.rootExecution ?? false,
    schedulerCallbackExecution:
      options.schedulerCallbackExecution ?? false,
    packageCompatibility: options.packageCompatibility ?? false,
    compatibilityClaimed: options.compatibilityClaimed ?? false
  });

  if (sourceOwnedOptions) {
    startTransitionRootlessSurfaceCurrentnessRowsByReport.set(
      report,
      surfaceCurrentnessRows
    );
    startTransitionRootlessCurrentnessReports.add(report);
  }

  return report;
}

function consumeStartTransitionRootlessCurrentnessReport(report) {
  const rejectionReason =
    validateStartTransitionRootlessCurrentnessReport(report);

  if (rejectionReason !== null) {
    throw createStartTransitionRootlessCurrentnessGateError(rejectionReason);
  }

  return freezeRecord({
    status: startTransitionRootlessCurrentnessConsumptionStatus,
    accepted: true,
    currentnessStatus: report.status,
    compatibilityTarget,
    apiName: 'startTransition',
    rootlessFacade: true,
    rootlessCurrentness: report.rootlessCurrentness,
    surfaceCurrentnessRows: report.surfaceCurrentnessRows,
    publicTransitionCompatibilityBlocked: true,
    publicRootCompatibilityBlocked: true,
    schedulerCompatibilityBlocked: true,
    schedulerPackageCompatibilityBlocked: true,
    packageCompatibilityBlocked: true,
    dispatcherRoutingBlocked: true,
    schedulerExecutionBlocked: true,
    rootLaneIntegrationBlocked: true,
    rootSchedulingBlocked: true,
    rootExecutionBlocked: true,
    callbackExecutionBlocked: true,
    publicTransitionCompatibility: false,
    publicRootCompatibility: false,
    publicSchedulerCompatibility: false,
    schedulerIntegration: false,
    rootLaneIntegration: false,
    rootScheduling: false,
    rootExecution: false,
    schedulerCallbackExecution: false,
    packageCompatibility: false,
    compatibilityClaimed: false
  });
}

function isStartTransitionRootlessCurrentnessReport(report) {
  return validateStartTransitionRootlessCurrentnessReport(report) === null;
}

function validateStartTransitionRootlessCurrentnessReport(report) {
  if (!isObjectLike(report)) {
    return 'startTransition-rootless-currentness-not-frozen';
  }

  if (!startTransitionRootlessCurrentnessReports.has(report)) {
    return 'startTransition-rootless-currentness-source-proof';
  }

  if (!Object.isFrozen(report)) {
    return 'startTransition-rootless-currentness-not-frozen';
  }

  if (
    !hasExactOwnKeys(
      report,
      startTransitionRootlessCurrentnessReportFieldNames
    ) ||
    report.kind !== startTransitionRootlessCurrentnessReportKind ||
    report.version !== startTransitionRootlessCurrentnessReportVersion ||
    report.status !== startTransitionRootlessCurrentnessStatus ||
    report.compatibilityTarget !== compatibilityTarget ||
    report.apiName !== 'startTransition' ||
    !hasSameFrozenStringArray(
      report.rootlessCurrentnessFieldNames,
      startTransitionRootlessCurrentnessFieldNames
    ) ||
    !hasSameFrozenStringArray(
      report.surfaceCurrentnessFieldNames,
      startTransitionRootlessSurfaceCurrentnessFieldNames
    )
  ) {
    return 'startTransition-rootless-currentness-shape';
  }

  if (
    !hasSameFrozenRecordFields(
      report.rootlessCurrentness,
      startTransitionRootlessCurrentness,
      startTransitionRootlessCurrentnessFieldNames
    )
  ) {
    return 'startTransition-rootless-currentness-rootless-metadata';
  }

  if (
    startTransitionRootlessSurfaceCurrentnessRowsByReport.get(report) !==
    report.surfaceCurrentnessRows
  ) {
    return 'startTransition-rootless-currentness-surface-source-proof';
  }

  if (
    !hasSameStartTransitionRootlessSurfaceCurrentnessRows(
      report.surfaceCurrentnessRows,
      startTransitionRootlessSurfaceCurrentnessRows
    )
  ) {
    return 'startTransition-rootless-currentness-surface-currentness';
  }

  for (const flagName of startTransitionRootlessCurrentnessBlockedFlags) {
    if (report[flagName] !== true) {
      return 'startTransition-rootless-currentness-blocker-claim';
    }
  }

  for (const flagName of startTransitionRootlessCurrentnessCompatibilityFalseFlags) {
    if (report[flagName] !== false) {
      return 'startTransition-rootless-currentness-compatibility-claim';
    }
  }

  return null;
}

function createStartTransitionRootlessSurfaceCurrentnessRows() {
  const rootReact = require('./index.js');
  const reactCjsDevelopment = require('./cjs/react.development.js');
  const reactCjsProduction = require('./cjs/react.production.js');
  const reactServer = require('./react.react-server.js');
  const rootExport = Object.hasOwn(rootReact, 'startTransition')
    ? rootReact.startTransition
    : undefined;
  const cjsDevelopmentExport = Object.hasOwn(
    reactCjsDevelopment,
    'startTransition'
  )
    ? reactCjsDevelopment.startTransition
    : undefined;
  const cjsProductionExport = Object.hasOwn(
    reactCjsProduction,
    'startTransition'
  )
    ? reactCjsProduction.startTransition
    : undefined;
  const reactServerStartTransitionAbsent =
    !Object.hasOwn(reactServer, 'startTransition');

  return freezeStartTransitionRootlessSurfaceCurrentnessRows([
    describeStartTransitionRootlessSurfaceCurrentness({
      surfaceId: 'react-root',
      source: 'packages/react/index.js',
      entrypoint: 'react',
      moduleShape: 'CommonJS root export',
      surfaceExports: rootReact,
      rootExport,
      cjsDevelopmentExport,
      cjsProductionExport,
      reactServerStartTransitionAbsent
    }),
    describeStartTransitionRootlessSurfaceCurrentness({
      surfaceId: 'react-cjs-development',
      source: 'packages/react/cjs/react.development.js',
      entrypoint: 'react/cjs/react.development.js',
      moduleShape: 'CommonJS alias export',
      surfaceExports: reactCjsDevelopment,
      rootExport,
      cjsDevelopmentExport,
      cjsProductionExport,
      reactServerStartTransitionAbsent
    }),
    describeStartTransitionRootlessSurfaceCurrentness({
      surfaceId: 'react-cjs-production',
      source: 'packages/react/cjs/react.production.js',
      entrypoint: 'react/cjs/react.production.js',
      moduleShape: 'CommonJS alias export',
      surfaceExports: reactCjsProduction,
      rootExport,
      cjsDevelopmentExport,
      cjsProductionExport,
      reactServerStartTransitionAbsent
    }),
    describeStartTransitionRootlessSurfaceCurrentness({
      surfaceId: 'react-server',
      source: 'packages/react/react.react-server.js',
      entrypoint: 'react react-server',
      moduleShape: 'React Server CommonJS export',
      surfaceExports: reactServer,
      rootExport,
      cjsDevelopmentExport,
      cjsProductionExport,
      reactServerStartTransitionAbsent
    })
  ]);
}

function describeStartTransitionRootlessSurfaceCurrentness({
  surfaceId,
  source,
  entrypoint,
  moduleShape,
  surfaceExports,
  rootExport,
  cjsDevelopmentExport,
  cjsProductionExport,
  reactServerStartTransitionAbsent
}) {
  const hasStartTransitionExport = Object.hasOwn(
    surfaceExports,
    'startTransition'
  );
  const surfaceStartTransition = hasStartTransitionExport
    ? surfaceExports.startTransition
    : undefined;
  const isFunction = typeof surfaceStartTransition === 'function';

  return {
    surfaceId,
    source,
    entrypoint,
    moduleShape,
    hasStartTransitionExport,
    sameAsRootlessFacade:
      hasStartTransitionExport && surfaceStartTransition === startTransition,
    sameAsRootExport:
      hasStartTransitionExport && surfaceStartTransition === rootExport,
    sameAsCjsDevelopmentExport:
      hasStartTransitionExport &&
      surfaceStartTransition === cjsDevelopmentExport,
    sameAsCjsProductionExport:
      hasStartTransitionExport &&
      surfaceStartTransition === cjsProductionExport,
    reactServerStartTransitionAbsent,
    functionName: isFunction ? surfaceStartTransition.name : null,
    functionLength: isFunction ? surfaceStartTransition.length : null,
    rootlessFacade:
      hasStartTransitionExport && surfaceStartTransition === startTransition,
    blockedExecutionPaths: startTransitionBlockedExecutionPaths,
    blockedCompatibilityClaims: startTransitionBlockedCompatibilityClaims,
    compatibilityClaimed: false
  };
}

function createStartTransitionRootlessCurrentnessGateError(reason) {
  const error = createUnimplementedError(
    'react',
    'startTransitionRootlessCurrentness',
    'rejected source/currentness report',
    'Only current source-owned startTransition rootless reports can pass this package-private gate.'
  );

  error.reason = reason;
  error.apiName = 'startTransition';
  error.publicTransitionCompatibilityBlocked = true;
  error.publicRootCompatibilityBlocked = true;
  error.schedulerCompatibilityBlocked = true;
  error.schedulerPackageCompatibilityBlocked = true;
  error.packageCompatibilityBlocked = true;
  error.dispatcherRoutingBlocked = true;
  error.schedulerExecutionBlocked = true;
  error.rootLaneIntegrationBlocked = true;
  error.rootSchedulingBlocked = true;
  error.rootExecutionBlocked = true;
  error.callbackExecutionBlocked = true;
  error.publicTransitionCompatibility = false;
  error.publicRootCompatibility = false;
  error.publicSchedulerCompatibility = false;
  error.schedulerIntegration = false;
  error.rootLaneIntegration = false;
  error.rootScheduling = false;
  error.rootExecution = false;
  error.schedulerCallbackExecution = false;
  error.packageCompatibility = false;
  error.compatibilityClaimed = false;

  return error;
}

const startTransition = function (scope) {
  const previousTransitionDepth = transitionDepth;
  transitionDepth = previousTransitionDepth + 1;

  try {
    const returnValue = scope();
    if (
      typeof returnValue === 'object' &&
      returnValue !== null &&
      typeof returnValue.then === 'function'
    ) {
      returnValue.then(noop, reportGlobalError);
    }
  } catch (error) {
    reportGlobalError(error);
  } finally {
    transitionDepth = previousTransitionDepth;
  }
};

Object.defineProperty(startTransition, 'name', {
  configurable: true,
  value: ''
});

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeStartTransitionRootlessSurfaceCurrentnessRow(row) {
  const surfaceRow = {};

  for (const fieldName of startTransitionRootlessSurfaceCurrentnessFieldNames) {
    if (
      startTransitionRootlessSurfaceCurrentnessArrayFieldNames.includes(
        fieldName
      )
    ) {
      surfaceRow[fieldName] = freezeArray(row[fieldName] ?? []);
    } else {
      surfaceRow[fieldName] = row[fieldName];
    }
  }

  return freezeRecord(surfaceRow);
}

function freezeStartTransitionRootlessSurfaceCurrentnessRows(rows) {
  return freezeArray(
    (rows ?? []).map(freezeStartTransitionRootlessSurfaceCurrentnessRow)
  );
}

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function hasSameFrozenStringArray(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    !hasExactOwnKeys(actual, Reflect.ownKeys(expected)) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      return false;
    }
  }

  return true;
}

function hasSameFrozenRecordFields(actual, expected, fieldNames) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  if (!hasExactOwnKeys(actual, fieldNames)) {
    return false;
  }

  for (const fieldName of fieldNames) {
    if (
      !Object.prototype.hasOwnProperty.call(actual, fieldName) ||
      actual[fieldName] !== expected[fieldName]
    ) {
      return false;
    }
  }

  return true;
}

function hasSameStartTransitionRootlessSurfaceCurrentnessRows(actual, expected) {
  if (
    !Array.isArray(actual) ||
    !Object.isFrozen(actual) ||
    !hasExactOwnKeys(actual, Reflect.ownKeys(expected)) ||
    actual.length !== expected.length
  ) {
    return false;
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (
      !hasSameStartTransitionRootlessSurfaceCurrentnessRow(
        actual[index],
        expected[index]
      )
    ) {
      return false;
    }
  }

  return true;
}

function hasSameStartTransitionRootlessSurfaceCurrentnessRow(actual, expected) {
  if (!isObjectLike(actual) || !Object.isFrozen(actual)) {
    return false;
  }

  if (
    !hasExactOwnKeys(
      actual,
      startTransitionRootlessSurfaceCurrentnessFieldNames
    )
  ) {
    return false;
  }

  for (const fieldName of startTransitionRootlessSurfaceCurrentnessFieldNames) {
    if (
      !Object.prototype.hasOwnProperty.call(actual, fieldName)
    ) {
      return false;
    }

    if (
      startTransitionRootlessSurfaceCurrentnessArrayFieldNames.includes(
        fieldName
      )
    ) {
      if (!hasSameFrozenStringArray(actual[fieldName], expected[fieldName])) {
        return false;
      }
      continue;
    }

    if (actual[fieldName] !== expected[fieldName]) {
      return false;
    }
  }

  return true;
}

function hasExactOwnKeys(actual, expectedKeys) {
  const actualKeys = Reflect.ownKeys(actual);

  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  for (const expectedKey of expectedKeys) {
    if (!actualKeys.includes(expectedKey)) {
      return false;
    }
  }

  return true;
}

module.exports = {
  consumeStartTransitionRootlessCurrentnessReport,
  createStartTransitionRootlessCurrentnessReport,
  isTransitionBatchActive,
  isStartTransitionRootlessCurrentnessReport,
  startTransition,
  startTransitionRootlessCurrentness,
  startTransitionRootlessCurrentnessConsumptionStatus,
  startTransitionRootlessCurrentnessFieldNames,
  startTransitionRootlessCurrentnessStatus,
  startTransitionRootlessSurfaceCurrentnessFieldNames,
  startTransitionRootlessSurfaceCurrentnessRows,
  validateStartTransitionRootlessCurrentnessReport
};
