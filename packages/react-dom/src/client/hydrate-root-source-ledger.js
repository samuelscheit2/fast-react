'use strict';

const privateHydrateRootSourceLedgerPayloads = new WeakMap();

function registerPrivateHydrateRootSourceLedgerRecord(record, payload) {
  if (!isObjectOrFunction(record) || !isObjectOrFunction(payload)) {
    throw new Error(
      'Private hydrateRoot source ledger records require object WeakMap keys and payloads.'
    );
  }

  privateHydrateRootSourceLedgerPayloads.set(
    record,
    Object.freeze({
      ...payload,
      record
    })
  );
  return record;
}

function getPrivateHydrateRootSourceLedgerRecordPayload(record) {
  return privateHydrateRootSourceLedgerPayloads.get(record) || null;
}

function isPrivateHydrateRootSourceLedgerRecord(value) {
  return privateHydrateRootSourceLedgerPayloads.has(value);
}

function isObjectOrFunction(value) {
  return (
    value !== null && (typeof value === 'object' || typeof value === 'function')
  );
}

module.exports = {
  getPrivateHydrateRootSourceLedgerRecordPayload,
  isPrivateHydrateRootSourceLedgerRecord,
  registerPrivateHydrateRootSourceLedgerRecord
};
