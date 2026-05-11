'use strict';

let getHydrateRootPublicFacadePreflightRecordPayload = returnNullPayload;
let getHydrateRootPublicFacadeEventReplayPreflightPayload =
  returnNullPayload;
let getHydrateRootPublicFacadeExecutionPreflightPayload =
  returnNullPayload;
let getHydrateRootPublicFacadeLifecycleRequestBoundaryPayload =
  returnNullPayload;

function getPrivateHydrateRootSourceLedgerRecordPayload(record) {
  return (
    getHydrateRootPreflightRecordPayload(record) ||
    getHydrateRootEventReplayPreflightPayload(record) ||
    getHydrateRootExecutionPreflightPayload(record) ||
    getHydrateRootLifecycleRequestBoundaryPayload(record)
  );
}

function isPrivateHydrateRootSourceLedgerRecord(value) {
  return getPrivateHydrateRootSourceLedgerRecordPayload(value) !== null;
}

function installPrivateHydrateRootSourceLedgerPayloadReaders(readers) {
  assertRootBridgeInstaller();
  getHydrateRootPublicFacadePreflightRecordPayload = assertReader(
    readers,
    'getPrivateHydrateRootPublicFacadePreflightRecordPayload'
  );
  getHydrateRootPublicFacadeEventReplayPreflightPayload = assertReader(
    readers,
    'getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload'
  );
  getHydrateRootPublicFacadeExecutionPreflightPayload = assertReader(
    readers,
    'getPrivateHydrateRootPublicFacadeExecutionPreflightPayload'
  );
  getHydrateRootPublicFacadeLifecycleRequestBoundaryPayload = assertReader(
    readers,
    'getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload'
  );
}

function getHydrateRootPreflightRecordPayload(record) {
  const payload = getHydrateRootPublicFacadePreflightRecordPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-preflight-record'
  );
}

function getHydrateRootEventReplayPreflightPayload(record) {
  const payload =
    getHydrateRootPublicFacadeEventReplayPreflightPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-event-replay-preflight-record'
  );
}

function getHydrateRootExecutionPreflightPayload(record) {
  const payload =
    getHydrateRootPublicFacadeExecutionPreflightPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-execution-preflight-record'
  );
}

function getHydrateRootLifecycleRequestBoundaryPayload(record) {
  const payload =
    getHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-lifecycle-request-boundary'
  );
}

function createSourceLedgerPayload(record, payload, ledgerKind) {
  const requestRecord = payload.requestRecord;
  return Object.freeze({
    ...payload,
    hydrationBoundaryRecord:
      requestRecord == null ? null : requestRecord.hydrationBoundaryRecord,
    ledgerKind,
    record
  });
}

function assertReader(readers, name) {
  if (
    readers === null ||
    typeof readers !== 'object' ||
    typeof readers[name] !== 'function'
  ) {
    throwInvalidHydrateRootSourceLedgerInstall(
      'HydrateRoot source-ledger reader installation requires root-bridge payload readers.'
    );
  }
  return readers[name];
}

function assertRootBridgeInstaller() {
  const stack = getNativeErrorStack();
  if (
    typeof stack !== 'string' ||
    !/[\\/]root-bridge\.js:\d+:\d+/.test(stack)
  ) {
    throwInvalidHydrateRootSourceLedgerInstall(
      'HydrateRoot source-ledger readers can only be installed by root-bridge initialization.'
    );
  }
}

function getNativeErrorStack() {
  const prepareStackTrace = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = undefined;
    return new Error().stack;
  } finally {
    Error.prepareStackTrace = prepareStackTrace;
  }
}

function throwInvalidHydrateRootSourceLedgerInstall(message) {
  const error = new Error(message);
  error.code = 'FAST_REACT_DOM_INVALID_HYDRATE_ROOT_SOURCE_LEDGER_INSTALL';
  throw error;
}

function returnNullPayload() {
  return null;
}

const exported = {
  getPrivateHydrateRootSourceLedgerRecordPayload,
  isPrivateHydrateRootSourceLedgerRecord
};

Object.defineProperty(
  exported,
  'installPrivateHydrateRootSourceLedgerPayloadReaders',
  {
    configurable: false,
    enumerable: false,
    value: installPrivateHydrateRootSourceLedgerPayloadReaders,
    writable: false
  }
);

module.exports = Object.freeze(exported);
