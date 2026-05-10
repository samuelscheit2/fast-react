import assert from "node:assert/strict";

import { REACT_DOM_FORM_ACTIONS_API_NAMES } from "./react-dom-form-actions-targets.mjs";
import {
  FAST_REACT_DOM_IMPLEMENTED_VERSION,
  FAST_REACT_DOM_INTERNALS_EXPORT,
  FAST_REACT_DOM_PLACEHOLDER_VERSION,
  assertFastReactDomPlaceholderMetadata,
  assertFastReactDomUnsupportedExport,
  assertFastReactDomUnsupportedThrow,
  findDisallowedReactDomSourceMatches,
  formatDisallowedSourceMessage,
  requireReactDomPackageFile
} from "./react-dom-resource-hints-unsupported-gates.mjs";

export const FAST_REACT_FORM_ACTION_PLACEHOLDER_ENTRYPOINTS = [
  {
    entrypoint: "react-dom",
    fileName: "index.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedLengths: {
      requestFormReset: 1,
      useFormState: 3,
      useFormStatus: 0
    }
  },
  {
    entrypoint: "react-dom/profiling",
    fileName: "profiling.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedLengths: {
      requestFormReset: 1,
      useFormState: 3,
      useFormStatus: 0
    }
  }
];

export const FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT = {
  entrypoint: "react-dom",
  fileName: "react-dom.react-server.js",
  version: FAST_REACT_DOM_PLACEHOLDER_VERSION
};

export const FAST_REACT_FORM_ACTION_UNSUPPORTED_SOURCE_PATTERNS = [
  {
    id: "public-form-action-forwarder",
    pattern: /\b(?:requestFormReset|useFormStatus|useFormState)\b/u,
    reason:
      "Public form-action APIs must remain package-facade placeholders until client form gates exist."
  },
  {
    id: "form-reset-adapter",
    pattern: /\b(?:resetFormInstance|reset_form_instance)\b/u,
    reason:
      "React-owned form reset needs a host form adapter and client ownership lookup."
  },
  {
    id: "host-transition-status",
    pattern: /\b(?:HostTransition|hostTransition|startHostTransition)\b/u,
    reason:
      "Pending form status requires host transition context and scheduler lane gates."
  },
  {
    id: "form-data-mutation",
    pattern: /\b(?:FormData|submitter|createFormDataWithSubmitter)\b/u,
    reason:
      "Client action submission needs DOM FormData mutation and submitter gates."
  },
  {
    id: "root-form-state",
    pattern: /\b(?:formState|form_state)\b/u,
    reason:
      "Root form state must stay reserved until hydration/client action prerequisites exist."
  }
];

export function assertFastReactFormActionsUnsupportedGate() {
  for (const entrypoint of FAST_REACT_FORM_ACTION_PLACEHOLDER_ENTRYPOINTS) {
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

    for (const apiName of REACT_DOM_FORM_ACTIONS_API_NAMES) {
      assertFastReactDomUnsupportedExport(moduleExports, {
        entrypoint: entrypoint.entrypoint,
        expectedLength: entrypoint.expectedLengths[apiName],
        expectedName: "",
        exportName: apiName
      });
    }

    assertPrivateFormResetDispatcherPlaceholder(moduleExports, {
      entrypoint: entrypoint.entrypoint
    });
  }

  const reactServerExports = requireReactDomPackageFile(
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.fileName
  );
  assertFastReactDomPlaceholderMetadata(
    reactServerExports,
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.entrypoint
  );
  assert.equal(
    reactServerExports.version,
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.version,
    "react-server version"
  );
  for (const apiName of REACT_DOM_FORM_ACTIONS_API_NAMES) {
    assert.equal(
      Object.hasOwn(reactServerExports, apiName),
      false,
      `react-server must not expose ${apiName}`
    );
  }
}

export function assertFastReactFormActionPrerequisiteGate() {
  const matches = findDisallowedReactDomSourceMatches(
    FAST_REACT_FORM_ACTION_UNSUPPORTED_SOURCE_PATTERNS
  );
  assert.deepEqual(
    matches,
    [],
    formatDisallowedSourceMessage(matches)
  );
}

function assertPrivateFormResetDispatcherPlaceholder(
  moduleExports,
  { entrypoint }
) {
  const dispatcher = moduleExports[FAST_REACT_DOM_INTERNALS_EXPORT].d;
  const descriptor = Object.getOwnPropertyDescriptor(dispatcher, "r");
  assert.ok(descriptor, `${entrypoint} private form reset dispatcher`);
  assert.equal(descriptor.value.length, 0, `${entrypoint}.d.r length`);
  assert.equal(
    descriptor.value.name,
    `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.r`,
    `${entrypoint}.d.r name`
  );
  assertFastReactDomUnsupportedThrow(
    () => dispatcher.r("fast-react-placeholder-gate"),
    {
      entrypoint,
      exportName: `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.r`
    }
  );
}
