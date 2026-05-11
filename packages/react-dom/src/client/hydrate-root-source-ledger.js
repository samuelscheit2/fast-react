'use strict';

const privateHydrateRootSourceLedgerRegisterSymbol = Symbol.for(
  'fast.react_dom.private_hydrate_root_source_ledger_register'
);
const privateHydrateRootSourceLedgerPayloadReaderSymbol = Symbol.for(
  'fast.react_dom.private_hydrate_root_source_ledger_payload_reader'
);
const privateHydrateRootSourceLedgerPayloads = new WeakMap();

function getPrivateHydrateRootSourceLedgerRecordPayload() {
  return null;
}

function isPrivateHydrateRootSourceLedgerRecord() {
  return false;
}

function registerPrivateHydrateRootSourceLedgerRecord(record, payload) {
  if (
    !record ||
    typeof record !== 'object' ||
    !payload ||
    typeof payload !== 'object' ||
    payload.record !== record ||
    typeof payload.ledgerKind !== 'string'
  ) {
    return null;
  }

  privateHydrateRootSourceLedgerPayloads.set(
    record,
    Object.freeze({...payload})
  );
  return record;
}

function getPrivateHydrateRootSourceLedgerRecordPayloadForHydrationGate(
  record
) {
  return privateHydrateRootSourceLedgerPayloads.get(record) || null;
}

const hydrateRootSourceLedgerExports = {
  getPrivateHydrateRootSourceLedgerRecordPayload,
  isPrivateHydrateRootSourceLedgerRecord
};

Object.defineProperties(hydrateRootSourceLedgerExports, {
  [privateHydrateRootSourceLedgerPayloadReaderSymbol]: {
    enumerable: false,
    value: getPrivateHydrateRootSourceLedgerRecordPayloadForHydrationGate
  },
  [privateHydrateRootSourceLedgerRegisterSymbol]: {
    enumerable: false,
    value: registerPrivateHydrateRootSourceLedgerRecord
  }
});

module.exports = Object.freeze(hydrateRootSourceLedgerExports);
