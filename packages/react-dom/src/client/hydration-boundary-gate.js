'use strict';

const {assertValidContainer, describeContainer} = require('./dom-container.js');

const HYDRATION_MARKER_ORACLE_KIND =
  'react-19.2.6-react-dom-hydration-marker-oracle';
const HYDRATION_MARKER_ORACLE_SCHEMA_VERSION = 1;
const UNSUPPORTED_HYDRATION_ROOT_KIND = 'unsupported-hydration';
const CONCURRENT_ROOT_TAG = 'ConcurrentRoot';

const privateHydrationBoundaryRecordType =
  'fast.react_dom.unsupported_hydration_boundary_record';

const acceptedHydrationMarkerContracts = freezeArray([
  markerContract(
    'activity-start',
    'Activity boundary',
    '<!--&-->',
    '&',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'activity-end',
    'Activity boundary',
    '<!--/&-->',
    '/&',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'suspense-completed-start',
    'Suspense boundary',
    '<!--$-->',
    '$',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'suspense-pending-start',
    'Suspense boundary',
    '<!--$?--><template id="{identifierPrefix}B:{hex}"></template>',
    '$?',
    'template placeholder with boundary id',
    'server-emitted-client-consumed-runtime-mutable'
  ),
  markerContract(
    'suspense-queued-start',
    'Suspense boundary',
    null,
    '$~',
    'existing pending boundary template',
    'runtime-mutated-client-consumed'
  ),
  markerContract(
    'suspense-client-rendered-start',
    'Suspense boundary',
    '<!--$!--><template data-dgst="..." data-msg="..." data-stck="..." data-cstck="..."></template>',
    '$!',
    'template carrying optional error digest/message/stack/component-stack attributes',
    'server-emitted-or-runtime-mutated-client-consumed'
  ),
  markerContract(
    'suspense-end',
    'Suspense boundary',
    '<!--/$-->',
    '/$',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'form-state-matching',
    'Form state',
    '<!--F!-->',
    'F!',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'form-state-not-matching',
    'Form state',
    '<!--F-->',
    'F',
    null,
    'server-emitted-client-consumed'
  ),
  markerContract(
    'preamble-html-contribution',
    'Preamble cleanup',
    '<!--html-->',
    'html',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'preamble-head-contribution',
    'Preamble cleanup',
    '<!--head-->',
    'head',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'preamble-body-contribution',
    'Preamble cleanup',
    '<!--body-->',
    'body',
    null,
    'server-emitted-client-boundary-clear-consumed'
  ),
  markerContract(
    'segment-placeholder',
    'Fizz segment movement',
    '<template id="{identifierPrefix}P:{hex}"></template>',
    null,
    'template placeholder',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-segment',
    'Fizz external runtime',
    '<template data-rsi="" data-sid="{identifierPrefix}S:{hex}" data-pid="{identifierPrefix}P:{hex}"></template>',
    null,
    'template carrying segment and placeholder ids',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-boundary',
    'Fizz external runtime',
    '<template data-rci="" data-bid="{identifierPrefix}B:{hex}" data-sid="{identifierPrefix}S:{hex}"></template>',
    null,
    'template carrying boundary and segment ids',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-complete-boundary-with-styles',
    'Fizz external runtime',
    '<template data-rri="" data-bid="{identifierPrefix}B:{hex}" data-sid="{identifierPrefix}S:{hex}" data-sty="..."></template>',
    null,
    'template carrying boundary id, segment id, and serialized style/resource precedence data',
    'server-emitted-runtime-consumed'
  ),
  markerContract(
    'external-runtime-client-render-boundary',
    'Fizz external runtime',
    '<template data-rxi="" data-bid="{identifierPrefix}B:{hex}" data-dgst="..." data-msg="..." data-stck="..." data-cstck="..."></template>',
    null,
    'template carrying boundary id and optional error evidence',
    'server-emitted-runtime-consumed'
  )
]);

const unsupportedHydrationPrerequisites = freezeArray([
  prerequisite(
    'no-hydration-root-constructor',
    'reconciler',
    'Hydration roots need a dedicated constructor and initial hydration scheduling path.'
  ),
  prerequisite(
    'no-hydration-context',
    'reconciler',
    'Hydratable cursor state, mismatch queues, and dehydrated boundary records are not wired.'
  ),
  prerequisite(
    'no-dom-marker-parser',
    'react-dom-client',
    'Fizz marker matching is not implemented in the DOM client helper layer.'
  ),
  prerequisite(
    'no-boundary-dom-operations',
    'react-dom-host',
    'Boundary clear, hide, unhide, and hydrated commit operations are not implemented.'
  ),
  prerequisite(
    'no-event-replay',
    'react-dom-events',
    'Blocked event replay and explicit hydration target queues are not implemented.'
  ),
  prerequisite(
    'no-form-marker-claiming',
    'react-dom-client',
    'F!/F form marker claiming is not wired to a hydration root path.'
  )
]);

const hydrationBoundaryRecordPayloads = new WeakMap();
const defaultHydrationBoundaryGate = createHydrationBoundaryGate();

function createHydrationBoundaryGate(options) {
  const gateState = createGateState(options);

  return Object.freeze({
    recordUnsupportedHydrateRoot(container, initialChildren, hydrationOptions) {
      return createUnsupportedHydrateRootRecordWithGate(
        gateState,
        container,
        initialChildren,
        hydrationOptions
      );
    }
  });
}

function createUnsupportedHydrateRootRecord(
  container,
  initialChildren,
  hydrationOptions
) {
  return defaultHydrationBoundaryGate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
}

function getPrivateHydrationBoundaryRecordPayload(record) {
  return hydrationBoundaryRecordPayloads.get(record) || null;
}

function isPrivateHydrationBoundaryRecord(value) {
  return hydrationBoundaryRecordPayloads.has(value);
}

function assertAcceptedHydrationMarkerOracle(oracle) {
  assertOracleObject(oracle);
  assertOracleField(
    oracle.oracleKind === HYDRATION_MARKER_ORACLE_KIND,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle kind does not match the accepted React DOM target.'
  );
  assertOracleField(
    oracle.schemaVersion === HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle schema version does not match the accepted contract.'
  );
  assertOracleField(
    oracle.generatedArtifacts === true && oracle.deterministic === true,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must be deterministic checked evidence.'
  );

  const claims = oracle.conformanceClaims;
  assertOracleField(
    claims != null && typeof claims === 'object',
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle is missing conformance claims.'
  );
  assertOracleField(
    claims.compatibilityClaimed === false &&
      claims.fastReactHydrationCompatible === false &&
      claims.fullDualRunOracleExists === false,
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must keep Fast React hydration compatibility claims false.'
  );

  const actualContracts = normalizeMarkerContracts(oracle.markerContracts);
  assertOracleField(
    JSON.stringify(actualContracts) ===
      JSON.stringify(acceptedHydrationMarkerContracts),
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle contracts do not match the accepted marker snapshot.'
  );

  return createMarkerOracleInfo('checked-oracle');
}

function createUnsupportedHydrateRootRecordWithGate(
  gateState,
  container,
  initialChildren,
  hydrationOptions
) {
  assertValidContainer(container, gateState.validationOptions);

  const sequence = gateState.nextRecordSequence++;
  const recordId = `${gateState.recordIdPrefix}:${sequence}`;
  const record = freezeRecord({
    $$typeof: privateHydrationBoundaryRecordType,
    kind: 'FastReactDomUnsupportedHydrationBoundaryRecord',
    operation: 'hydrateRoot',
    status: 'unsupported',
    sequence,
    recordId,
    rootKind: UNSUPPORTED_HYDRATION_ROOT_KIND,
    rootTag: CONCURRENT_ROOT_TAG,
    containerInfo: freezeRecord(describeContainer(container)),
    initialChildrenInfo: describeHydrationValue(initialChildren),
    optionsInfo: describeHydrationValue(hydrationOptions),
    oracleInfo: gateState.markerOracleInfo,
    blockedOn: unsupportedHydrationPrerequisites,
    canHydrate: false,
    publicRootCreated: false,
    containerMarked: false,
    listenersAttached: false,
    domMutated: false,
    eventsReplayed: false
  });

  hydrationBoundaryRecordPayloads.set(record, {
    container,
    hydrationOptions,
    initialChildren
  });

  return record;
}

function createGateState(options) {
  return {
    markerOracleInfo:
      options && Object.prototype.hasOwnProperty.call(options, 'markerOracle')
        ? assertAcceptedHydrationMarkerOracle(options.markerOracle)
        : createMarkerOracleInfo('built-in-accepted-marker-snapshot'),
    nextRecordSequence: 1,
    recordIdPrefix: getIdPrefix(
      options && options.recordIdPrefix,
      'hydration'
    ),
    validationOptions: options && options.validationOptions
  };
}

function createMarkerOracleInfo(source) {
  const markerContractIds = freezeArray(
    acceptedHydrationMarkerContracts.map((contract) => contract.id)
  );
  const commentMarkers = freezeArray(
    acceptedHydrationMarkerContracts
      .filter((contract) => contract.commentData !== null)
      .map((contract) =>
        freezeRecord({
          commentData: contract.commentData,
          id: contract.id
        })
      )
  );
  const templateMarkers = freezeArray(
    acceptedHydrationMarkerContracts
      .filter((contract) => contract.commentData === null)
      .map((contract) =>
        freezeRecord({
          companionNode: contract.companionNode,
          id: contract.id,
          serializedMarker: contract.serializedMarker
        })
      )
  );

  return freezeRecord({
    oracleKind: HYDRATION_MARKER_ORACLE_KIND,
    schemaVersion: HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
    source,
    deterministic: true,
    compatibilityClaimed: false,
    fastReactHydrationCompatible: false,
    fullDualRunOracleExists: false,
    markerContractCount: acceptedHydrationMarkerContracts.length,
    markerContractIds,
    commentMarkers,
    templateMarkers
  });
}

function markerContract(
  id,
  area,
  serializedMarker,
  commentData,
  companionNode,
  lifecycle
) {
  return freezeRecord({
    id,
    area,
    serializedMarker,
    commentData,
    companionNode,
    lifecycle
  });
}

function prerequisite(id, owner, reason) {
  return freezeRecord({
    id,
    owner,
    reason
  });
}

function normalizeMarkerContracts(markerContracts) {
  assertOracleField(
    Array.isArray(markerContracts),
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must expose a markerContracts array.'
  );
  return markerContracts.map((contract) =>
    markerContract(
      contract && contract.id,
      contract && contract.area,
      contract && contract.serializedMarker,
      contract && contract.commentData,
      contract && contract.companionNode,
      contract && contract.lifecycle
    )
  );
}

function assertOracleObject(oracle) {
  assertOracleField(
    oracle != null && typeof oracle === 'object',
    'FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH',
    'Hydration marker oracle must be an object.'
  );
}

function assertOracleField(condition, code, message) {
  if (condition) {
    return;
  }

  const error = new Error(message);
  error.code = code;
  throw error;
}

function getIdPrefix(value, fallback) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function describeHydrationValue(value) {
  if (value === null) {
    return freezeRecord({
      type: 'null'
    });
  }

  const type = typeof value;
  if (type === 'undefined') {
    return freezeRecord({
      type: 'undefined'
    });
  }

  if (type === 'string' || type === 'number' || type === 'boolean') {
    return freezeRecord({
      type,
      value
    });
  }

  if (type === 'bigint') {
    return freezeRecord({
      type,
      value: value.toString()
    });
  }

  if (type === 'function') {
    return freezeRecord({
      length: value.length,
      name: value.name || '',
      type: 'function'
    });
  }

  if (type === 'symbol') {
    return freezeRecord({
      description: value.description || null,
      type: 'symbol'
    });
  }

  if (Array.isArray(value)) {
    return freezeRecord({
      length: value.length,
      type: 'array'
    });
  }

  return freezeRecord({
    keys: Object.keys(value).sort(),
    type: 'object'
  });
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  CONCURRENT_ROOT_TAG,
  HYDRATION_MARKER_ORACLE_KIND,
  HYDRATION_MARKER_ORACLE_SCHEMA_VERSION,
  UNSUPPORTED_HYDRATION_ROOT_KIND,
  acceptedHydrationMarkerContracts,
  assertAcceptedHydrationMarkerOracle,
  createHydrationBoundaryGate,
  createUnsupportedHydrateRootRecord,
  getPrivateHydrationBoundaryRecordPayload,
  isPrivateHydrationBoundaryRecord,
  privateHydrationBoundaryRecordType,
  unsupportedHydrationPrerequisites
};
