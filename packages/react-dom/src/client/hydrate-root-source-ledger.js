'use strict';

let rootBridgeModule = null;

function getPrivateHydrateRootSourceLedgerRecordPayload(record) {
  const rootBridge = getRootBridgeModule();
  return (
    getHydrateRootPreflightRecordPayload(rootBridge, record) ||
    getHydrateRootEventReplayPreflightPayload(rootBridge, record) ||
    getHydrateRootExecutionPreflightPayload(rootBridge, record) ||
    getHydrateRootLifecycleRequestBoundaryPayload(rootBridge, record)
  );
}

function isPrivateHydrateRootSourceLedgerRecord(value) {
  return getPrivateHydrateRootSourceLedgerRecordPayload(value) !== null;
}

function getHydrateRootPreflightRecordPayload(rootBridge, record) {
  const getPayload =
    rootBridge.getPrivateHydrateRootPublicFacadePreflightRecordPayload;
  if (typeof getPayload !== 'function') {
    return null;
  }
  const payload = getPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-preflight-record'
  );
}

function getHydrateRootEventReplayPreflightPayload(rootBridge, record) {
  const getPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload;
  if (typeof getPayload !== 'function') {
    return null;
  }
  const payload = getPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-event-replay-preflight-record'
  );
}

function getHydrateRootExecutionPreflightPayload(rootBridge, record) {
  const getPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload;
  if (typeof getPayload !== 'function') {
    return null;
  }
  const payload = getPayload(record);
  if (payload === null) {
    return null;
  }

  return createSourceLedgerPayload(
    record,
    payload,
    'hydrate-root-public-facade-execution-preflight-record'
  );
}

function getHydrateRootLifecycleRequestBoundaryPayload(rootBridge, record) {
  const getPayload =
    rootBridge.getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload;
  if (typeof getPayload !== 'function') {
    return null;
  }
  const payload = getPayload(record);
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

function getRootBridgeModule() {
  if (rootBridgeModule === null) {
    rootBridgeModule = require('./root-bridge.js');
  }
  return rootBridgeModule;
}

module.exports = {
  getPrivateHydrateRootSourceLedgerRecordPayload,
  isPrivateHydrateRootSourceLedgerRecord
};
