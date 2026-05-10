import assert from "node:assert/strict";

import {
  findDisallowedReactDomSourceMatches,
  formatDisallowedSourceMessage
} from "./react-dom-resource-hints-unsupported-gates.mjs";

export const FAST_REACT_CONTROLLED_FORM_UNSUPPORTED_SOURCE_PATTERNS = [
  {
    id: "input-value-tracking",
    pattern:
      /\b(?:inputValueTracking|trackValueOnNode|updateValueIfChanged|getTracker|_valueTracker)\b/u,
    reason:
      "Controlled inputs require value tracking and event restore gates before implementation."
  },
  {
    id: "controlled-restore-queue",
    pattern:
      /\b(?:enqueueStateRestore|restoreStateIfNeeded|restoreControlledState|restoreControlledInputState|restoreControlledSelectState|restoreControlledTextareaState)\b/u,
    reason:
      "Actual post-event controlled restore queue writes, flushes, and wrapper invocations must stay unsupported."
  },
  {
    id: "input-wrapper",
    pattern: /\b(?:initInput|updateInput|hydrateInput|validateInputProps)\b/u,
    reason:
      "Input wrapper behavior must stay unsupported until ordered property-write gates exist."
  },
  {
    id: "select-wrapper",
    pattern: /\b(?:initSelect|updateSelect|postUpdateSelect|validateSelectProps)\b/u,
    reason:
      "Select wrapper behavior must stay unsupported until option state gates exist."
  },
  {
    id: "textarea-wrapper",
    pattern:
      /\b(?:initTextarea|updateTextarea|hydrateTextarea|validateTextareaProps)\b/u,
    reason:
      "Textarea wrapper behavior must stay unsupported until value/defaultValue gates exist."
  },
  {
    id: "latest-props-node-map",
    pattern:
      /\b(?:internalPropsKey|getFiberCurrentPropsFromNode|updateFiberProps|getInstanceFromNode)\b/u,
    reason:
      "Controlled restore and event plugins need DOM-owned latest-props metadata first."
  },
  {
    id: "controlled-event-plugin",
    pattern: /\b(?:ChangeEventPlugin|BeforeInputEventPlugin|SelectEventPlugin)\b/u,
    reason:
      "Controlled form behavior must wait for event plugin extraction and dispatch gates."
  }
];

export const DOM_CONTROLLED_INPUT_UNSUPPORTED_ORACLE_GAP_IDS = [
  "no-fast-react-react-dom-comparison",
  "fake-dom-client-substrate",
  "synchronous-flushsync-only",
  "forms-submit-and-radio-groups-out-of-scope"
];

export function assertFastReactControlledFormUnsupportedGate(oracle) {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.browserNativeDomUsed, false);
  assert.equal(
    oracle.evidenceClaims.deterministicFakeDomSubstrateUsed,
    true
  );
  assert.deepEqual(
    oracle.intentionalGaps.map((gap) => gap.id),
    DOM_CONTROLLED_INPUT_UNSUPPORTED_ORACLE_GAP_IDS
  );

  const matches = findDisallowedReactDomSourceMatches(
    FAST_REACT_CONTROLLED_FORM_UNSUPPORTED_SOURCE_PATTERNS
  );
  assert.deepEqual(
    matches,
    [],
    formatDisallowedSourceMessage(matches)
  );
}
