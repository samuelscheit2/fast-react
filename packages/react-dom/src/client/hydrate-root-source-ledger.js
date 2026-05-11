'use strict';

const {
  getPrivateHydrateRootPublicFacadePreflightRecordPayload:
    getHydrateRootPublicFacadePreflightRecordPayload,
  getPrivateHydrateRootPublicFacadeEventReplayPreflightPayload:
    getHydrateRootPublicFacadeEventReplayPreflightPayload,
  getPrivateHydrateRootPublicFacadeExecutionPreflightPayload:
    getHydrateRootPublicFacadeExecutionPreflightPayload,
  getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload:
    getHydrateRootPublicFacadeLifecycleRequestBoundaryPayload
} = require('./root-bridge.js');

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

module.exports = Object.freeze({
  getPrivateHydrateRootSourceLedgerRecordPayload,
  isPrivateHydrateRootSourceLedgerRecord
});
