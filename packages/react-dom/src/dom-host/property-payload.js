'use strict';

const resourceFormInternalsGate = require('../resource-form-internals-gate.js');

const ENTRY_SET_ATTRIBUTE = 'setAttribute';
const ENTRY_REMOVE_ATTRIBUTE = 'removeAttribute';
const ENTRY_SET_PROPERTY = 'setProperty';
const ENTRY_REMOVE_PROPERTY = 'removeProperty';
const ENTRY_SET_STYLE = 'setStyle';
const ENTRY_REMOVE_STYLE = 'removeStyle';
const ENTRY_SET_INNER_HTML = 'setInnerHTML';
const ENTRY_NON_PAYLOAD = 'nonPayload';
const ENTRY_UNSUPPORTED = 'unsupported';
const CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS =
  'blocked-controlled-form-property-payload';
const CONTROLLED_VALUE_TRACKER_GATE_STATUS =
  'private-controlled-value-tracker-metadata-only';
const CONTROLLED_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_STATUS =
  resourceFormInternalsGate.controlledInputValueTrackerFakeDomDiagnosticStatus;
const CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS =
  resourceFormInternalsGate.controlledInputPrivateWrapperGateStatus;

const emptyProps = Object.freeze({});

const hasOwn = Object.prototype.hasOwnProperty;

const attributeAliases = Object.freeze({
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex'
});

const knownStringAttributeNames = new Set([
  'dir',
  'id',
  'role',
  'title',
  'translate'
]);

const booleanishStringAttributeNames = new Set([
  'contentEditable',
  'draggable',
  'spellCheck'
]);

const booleanAttributeNames = new Set([
  'allowFullScreen',
  'async',
  'autoPlay',
  'controls',
  'default',
  'defer',
  'disabled',
  'disablePictureInPicture',
  'disableRemotePlayback',
  'formNoValidate',
  'hidden',
  'inert',
  'itemScope',
  'loop',
  'noModule',
  'noValidate',
  'open',
  'playsInline',
  'readOnly',
  'required',
  'reversed',
  'scoped',
  'seamless'
]);

const controlledPropsByTag = Object.freeze({
  input: new Set([
    'checked',
    'defaultChecked',
    'defaultValue',
    'name',
    'type',
    'value'
  ]),
  option: new Set(['selected']),
  select: new Set(['defaultValue', 'multiple', 'value']),
  textarea: new Set(['defaultValue', 'value'])
});

const formActionProps = new Set([
  'action',
  'encType',
  'formAction',
  'formEncType',
  'formMethod',
  'formTarget',
  'method',
  'target'
]);

const documentScopedResourceTags = new Set([
  'base',
  'body',
  'head',
  'html',
  'link',
  'meta',
  'script',
  'style',
  'title'
]);

const reservedNonPayloadProps = Object.freeze({
  children: {
    category: 'children',
    reason: 'children are handled by text-content reconciliation'
  },
  key: {
    category: 'react-reserved-prop',
    reason: 'key is React element metadata and is not a DOM payload'
  },
  ref: {
    category: 'react-reserved-prop',
    reason: 'ref is handled by the ref attachment path'
  },
  suppressContentEditableWarning: {
    category: 'react-reserved-prop',
    reason: 'contentEditable warning suppression does not mutate host props'
  },
  suppressHydrationWarning: {
    category: 'hydration',
    reason: 'hydration warning suppression belongs to hydration diffing'
  }
});

const stylePropShapeValidationMessage =
  'The `style` prop expects a mapping from style properties to values, ' +
  "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
  'using JSX.';

const dangerousHtmlShapeValidationMessage =
  '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
  'Please visit https://react.dev/link/dangerously-set-inner-html ' +
  'for more information.';

const dangerousHtmlChildrenConflictMessage =
  'Can only set one of ' +
  '`children` or `props.dangerouslySetInnerHTML`.';

const supportedStyleNames = new Set([
  'backgroundColor',
  'backgroundImage',
  'borderWidth',
  'color',
  'flex',
  'height',
  'lineHeight',
  'marginTop',
  'msTransition',
  'opacity',
  'paddingLeft',
  'WebkitLineClamp',
  'width',
  'zIndex'
]);

const unitlessStyleNames = new Set([
  'flex',
  'lineHeight',
  'opacity',
  'WebkitLineClamp',
  'zIndex'
]);

const unsupportedPropReasons = Object.freeze({
  innerHTML: {
    category: 'innerHTML',
    reason: 'innerHTML is reserved and is not handled as an ordinary attribute'
  }
});

const validAttributeNamePattern = /^[A-Za-z_:][A-Za-z0-9_.:-]*$/;

function diffDomPropertyPayload(tag, lastProps, nextProps) {
  const previousProps = normalizeProps(lastProps, 'lastProps');
  const currentProps = normalizeProps(nextProps, 'nextProps');
  const payload = [];

  for (const propName of Object.keys(previousProps)) {
    const previousValue = previousProps[propName];
    if (
      previousValue != null &&
      !hasOwn.call(currentProps, propName)
    ) {
      pushPayloadEntries(
        payload,
        createEntries(tag, propName, null, previousValue, currentProps)
      );
    }
  }

  for (const propName of Object.keys(currentProps)) {
    const nextValue = currentProps[propName];
    const previousValue = previousProps[propName];
    if (
      nextValue !== previousValue &&
      (nextValue != null || previousValue != null)
    ) {
      pushPayloadEntries(
        payload,
        createEntries(tag, propName, nextValue, previousValue, currentProps)
      );
    }
  }

  return payload;
}

function normalizeProps(props, argumentName) {
  if (props == null) {
    return emptyProps;
  }

  const propsType = typeof props;
  if (propsType !== 'object' && propsType !== 'function') {
    throw new TypeError(`${argumentName} must be an object or null.`);
  }

  return props;
}

function pushPayloadEntries(payload, entries) {
  if (Array.isArray(entries)) {
    for (const entry of entries) {
      payload.push(entry);
    }
  } else {
    payload.push(entries);
  }
}

function createEntries(tag, propName, value, previousValue, props) {
  const reserved = reservedNonPayloadProps[propName];
  if (reserved !== undefined) {
    return createNonPayloadEntry(propName, reserved.category, reserved.reason);
  }

  if (isEventLikeProp(propName)) {
    return createNonPayloadEntry(
      propName,
      'event',
      'event props are stored by the future event/latest-props path'
    );
  }

  const unsupported = unsupportedPropReasons[propName];
  if (unsupported !== undefined) {
    return createUnsupportedEntry(
      propName,
      unsupported.category,
      unsupported.reason
    );
  }

  if (isDocumentScopedResourceTag(tag)) {
    return createUnsupportedEntry(
      propName,
      'document-resource-host',
      'document-scoped resource host tags require dedicated React DOM handling'
    );
  }

  if (propName === 'style') {
    return createStyleEntries(propName, value, previousValue);
  }

  if (propName === 'dangerouslySetInnerHTML') {
    return createDangerousHtmlEntry(propName, value, props);
  }

  if (isControlledFormProp(tag, propName)) {
    return createControlledFormUnsupportedEntry(tag, propName, props);
  }

  if (formActionProps.has(propName)) {
    return createUnsupportedEntry(
      propName,
      'form-action',
      'form action props are intentionally outside this ordinary attribute helper'
    );
  }

  const attribute = getOrdinaryAttribute(propName);
  if (attribute === null) {
    return createUnsupportedEntry(
      propName,
      'unknown-host-prop',
      'this helper only covers bounded ordinary host attributes'
    );
  }

  if (!isAttributeNameSafe(attribute.name)) {
    return createUnsupportedEntry(
      propName,
      'invalid-attribute-name',
      'attribute name is not safe to include in a DOM payload'
    );
  }

  return createAttributeEntry(attribute, propName, value);
}

function createStyleEntries(propName, value, previousValue) {
  if (!isNullishStyleValue(value) && !isObjectLike(value)) {
    return createUnsupportedEntry(
      propName,
      'style-shape-validation',
      stylePropShapeValidationMessage
    );
  }

  if (!isNullishStyleValue(previousValue) && !isObjectLike(previousValue)) {
    return createUnsupportedEntry(
      propName,
      'style-previous-shape',
      'previous style props must be an object or null before this data-only helper can diff them'
    );
  }

  const previousStyles = isObjectLike(previousValue) ? previousValue : null;
  const currentStyles = isObjectLike(value) ? value : null;
  const entries = [];

  if (previousStyles !== null) {
    for (const styleName of Object.keys(previousStyles)) {
      if (currentStyles === null || !hasOwn.call(currentStyles, styleName)) {
        entries.push(createRemoveStyleEntryOrUnsupported(propName, styleName));
      }
    }
  }

  if (currentStyles !== null) {
    const previousStyleValues =
      previousStyles === null ? emptyProps : previousStyles;
    for (const styleName of Object.keys(currentStyles)) {
      const nextStyleValue = currentStyles[styleName];
      if (previousStyleValues[styleName] !== nextStyleValue) {
        entries.push(
          createStyleValueEntryOrUnsupported(
            propName,
            styleName,
            nextStyleValue
          )
        );
      }
    }
  }

  return entries;
}

function createStyleValueEntryOrUnsupported(propName, styleName, value) {
  if (!isSupportedStyleName(styleName)) {
    return createUnsupportedEntry(
      propName,
      'unsupported-style-name',
      'this data-only style slice only covers oracle-backed style names and CSS custom properties',
      {styleName}
    );
  }

  if (shouldRemoveStyleValue(value)) {
    return createRemoveStyleEntry(propName, styleName);
  }

  const coercedValue = coerceStyleValue(propName, styleName, value);
  if (coercedValue.kind === ENTRY_UNSUPPORTED) {
    return coercedValue;
  }

  return createSetStyleEntry(propName, styleName, coercedValue.value);
}

function createRemoveStyleEntryOrUnsupported(propName, styleName) {
  if (!isSupportedStyleName(styleName)) {
    return createUnsupportedEntry(
      propName,
      'unsupported-style-name',
      'this data-only style slice only covers oracle-backed style names and CSS custom properties',
      {styleName}
    );
  }

  return createRemoveStyleEntry(propName, styleName);
}

function createDangerousHtmlEntry(propName, value, props) {
  if (value == null) {
    return createNonPayloadEntry(
      propName,
      'dangerouslySetInnerHTML-nullish',
      'nullish dangerouslySetInnerHTML does not assign innerHTML; managed children and text-content paths own clearing'
    );
  }

  if (typeof value !== 'object' || !hasOwn.call(value, '__html')) {
    return createUnsupportedEntry(
      propName,
      'dangerouslySetInnerHTML-shape-validation',
      dangerousHtmlShapeValidationMessage
    );
  }

  const html = value.__html;
  if (html == null) {
    return createNonPayloadEntry(
      propName,
      'dangerouslySetInnerHTML-nullish-html',
      'nullish dangerouslySetInnerHTML.__html is accepted but does not assign innerHTML'
    );
  }

  if (props.children != null) {
    return createUnsupportedEntry(
      propName,
      'dangerouslySetInnerHTML-children-conflict',
      dangerousHtmlChildrenConflictMessage
    );
  }

  if (typeof html !== 'string') {
    return createUnsupportedEntry(
      propName,
      'dangerouslySetInnerHTML-value-type',
      'this data-only dangerouslySetInnerHTML slice only admits string __html values'
    );
  }

  return createSetInnerHtmlEntry(propName, html);
}

function getOrdinaryAttribute(propName) {
  if (hasOwn.call(attributeAliases, propName)) {
    return {
      name: attributeAliases[propName],
      valueKind: 'known'
    };
  }

  if (knownStringAttributeNames.has(propName)) {
    return {
      name: propName,
      valueKind: 'known'
    };
  }

  if (booleanishStringAttributeNames.has(propName)) {
    return {
      name: propName,
      valueKind: 'booleanish-string'
    };
  }

  if (booleanAttributeNames.has(propName)) {
    return {
      name: propName,
      valueKind: 'boolean'
    };
  }

  if (isDataOrAriaAttribute(propName)) {
    return {
      name: propName,
      valueKind: 'data-or-aria'
    };
  }

  if (isLowercaseCustomAttribute(propName)) {
    return {
      name: propName,
      valueKind: 'custom-lowercase'
    };
  }

  return null;
}

function createAttributeEntry(attribute, propName, value) {
  if (attribute.valueKind === 'boolean') {
    if (value && typeof value !== 'function' && typeof value !== 'symbol') {
      return createSetAttributeEntry(propName, attribute.name, '');
    }
    return createRemoveAttributeEntry(propName, attribute.name);
  }

  if (
    attribute.valueKind === 'data-or-aria' ||
    attribute.valueKind === 'booleanish-string'
  ) {
    if (shouldRemoveAttributeValue(value, false)) {
      return createRemoveAttributeEntry(propName, attribute.name);
    }
    return coerceSetAttributeEntry(propName, attribute.name, value);
  }

  if (shouldRemoveAttributeValue(value, true)) {
    return createRemoveAttributeEntry(propName, attribute.name);
  }

  return coerceSetAttributeEntry(propName, attribute.name, value);
}

function shouldRemoveAttributeValue(value, removeBooleans) {
  if (value == null) {
    return true;
  }

  switch (typeof value) {
    case 'function':
    case 'symbol':
      return true;
    case 'boolean':
      return removeBooleans;
    default:
      return false;
  }
}

function coerceSetAttributeEntry(propName, attributeName, value) {
  try {
    return createSetAttributeEntry(propName, attributeName, String(value));
  } catch (error) {
    return createUnsupportedEntry(
      propName,
      'attribute-string-coercion',
      'attribute value could not be coerced to a string'
    );
  }
}

function coerceStyleValue(propName, styleName, value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return createUnsupportedEntry(
        propName,
        'style-non-finite-number',
        'non-finite numeric style values require warning diagnostics outside this data-only helper',
        {styleName}
      );
    }

    if (
      value !== 0 &&
      !isCustomStyleProperty(styleName) &&
      !unitlessStyleNames.has(styleName)
    ) {
      return {
        value: `${value}px`
      };
    }

    return {
      value: String(value)
    };
  }

  if (typeof value === 'string') {
    return {
      value: isCustomStyleProperty(styleName) ? value : value.trim()
    };
  }

  return createUnsupportedEntry(
    propName,
    'style-value-type',
    'this data-only style slice only admits string, finite number, nullish, empty string, or boolean style values',
    {styleName}
  );
}

function createSetAttributeEntry(propName, attributeName, value) {
  return {
    kind: ENTRY_SET_ATTRIBUTE,
    propName,
    attributeName,
    value
  };
}

function createRemoveAttributeEntry(propName, attributeName) {
  return {
    kind: ENTRY_REMOVE_ATTRIBUTE,
    propName,
    attributeName
  };
}

function createSetStyleEntry(propName, styleName, value) {
  return {
    kind: ENTRY_SET_STYLE,
    propName,
    styleName,
    mutation: getStyleMutationTarget(styleName),
    value
  };
}

function createRemoveStyleEntry(propName, styleName) {
  return {
    kind: ENTRY_REMOVE_STYLE,
    propName,
    styleName,
    mutation: getStyleMutationTarget(styleName),
    value: ''
  };
}

function createSetInnerHtmlEntry(propName, value) {
  return {
    kind: ENTRY_SET_INNER_HTML,
    propName,
    propertyName: 'innerHTML',
    value
  };
}

function createNonPayloadEntry(propName, category, reason) {
  return {
    kind: ENTRY_NON_PAYLOAD,
    propName,
    category,
    reason
  };
}

function createUnsupportedEntry(propName, category, reason, details) {
  const entry = {
    kind: ENTRY_UNSUPPORTED,
    propName,
    category,
    reason
  };
  if (details !== undefined) {
    return {
      ...entry,
      ...details
    };
  }
  return entry;
}

function createControlledFormUnsupportedEntry(tag, propName, props) {
  const privateWrapperGateRecord =
    createControlledPrivateWrapperPropertyPayloadRecordOrNull(
      tag,
      propName,
      props
    );

  return createUnsupportedEntry(
    propName,
    `controlled-${tag}`,
    `controlled ${tag} props are handled by the controlled form wrapper path`,
    {
      controlledFormBoundary: {
        propertyPayloadStatus: CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
        privateWrapperGateStatus:
          privateWrapperGateRecord === null
            ? null
            : CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS,
        privateWrapperGateRecord,
        valueTrackerGateStatus: CONTROLLED_VALUE_TRACKER_GATE_STATUS,
        fakeDomTrackerDiagnosticStatus:
          CONTROLLED_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_STATUS,
        hostTag: tag,
        ordinaryPayloadAccepted: false,
        sourceAdapterInvoked: false,
        fakeDomTrackerDiagnosticAvailable: true,
        fakeDomTrackerDiagnosticInstalled: false,
        fakeDomTrackerDiagnosticObserved: false,
        fakeDomTrackerDiagnosticDetached: false,
        liveTrackingStarted: false,
        postEventRestoreQueued: false,
        publicControlledBehaviorEnabled: false,
        compatibilityClaimed: false
      }
    }
  );
}

function createControlledPrivateWrapperPropertyPayloadRecordOrNull(
  tag,
  propName,
  props
) {
  if (tag !== 'input' && tag !== 'select' && tag !== 'textarea') {
    return null;
  }

  return resourceFormInternalsGate
    .createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: tag,
      propName,
      props
    });
}

function isControlledFormProp(tag, propName) {
  const controlledProps =
    typeof tag === 'string' ? controlledPropsByTag[tag] : undefined;
  return controlledProps !== undefined && controlledProps.has(propName);
}

function isDocumentScopedResourceTag(tag) {
  return typeof tag === 'string' && documentScopedResourceTags.has(tag);
}

function isEventLikeProp(propName) {
  return (
    propName.length > 2 &&
    (propName[0] === 'o' || propName[0] === 'O') &&
    (propName[1] === 'n' || propName[1] === 'N')
  );
}

function isDataOrAriaAttribute(propName) {
  return propName.startsWith('data-') || propName.startsWith('aria-');
}

function isLowercaseCustomAttribute(propName) {
  return propName === propName.toLowerCase();
}

function isAttributeNameSafe(attributeName) {
  return validAttributeNamePattern.test(attributeName);
}

function isOrdinaryPropertyPayloadEntry(entry) {
  return (
    isObjectLike(entry) &&
    (entry.kind === ENTRY_SET_ATTRIBUTE ||
      entry.kind === ENTRY_REMOVE_ATTRIBUTE ||
      entry.kind === ENTRY_SET_PROPERTY ||
      entry.kind === ENTRY_REMOVE_PROPERTY)
  );
}

function isStyleDangerousHtmlPayloadEntry(entry) {
  return (
    isObjectLike(entry) &&
    (entry.kind === ENTRY_SET_STYLE ||
      entry.kind === ENTRY_REMOVE_STYLE ||
      entry.kind === ENTRY_SET_INNER_HTML)
  );
}

function isStylePropertyPayloadEntry(entry) {
  return (
    isObjectLike(entry) &&
    (entry.kind === ENTRY_SET_STYLE || entry.kind === ENTRY_REMOVE_STYLE)
  );
}

function isNonPayloadPropertyPayloadEntry(entry) {
  return isObjectLike(entry) && entry.kind === ENTRY_NON_PAYLOAD;
}

function isNullishStyleValue(value) {
  return value == null;
}

function isObjectLike(value) {
  return typeof value === 'object' && value !== null;
}

function isSupportedStyleName(styleName) {
  return (
    supportedStyleNames.has(styleName) ||
    isCustomStyleProperty(styleName)
  );
}

function isCustomStyleProperty(styleName) {
  return styleName.startsWith('--');
}

function shouldRemoveStyleValue(value) {
  return value == null || typeof value === 'boolean' || value === '';
}

function getStyleMutationTarget(styleName) {
  return isCustomStyleProperty(styleName)
    ? 'setProperty'
    : 'propertyAssignment';
}

module.exports = {
  CONTROLLED_FORM_PROPERTY_PAYLOAD_STATUS,
  CONTROLLED_PRIVATE_WRAPPER_PROPERTY_PAYLOAD_STATUS,
  CONTROLLED_VALUE_TRACKER_FAKE_DOM_DIAGNOSTIC_STATUS,
  CONTROLLED_VALUE_TRACKER_GATE_STATUS,
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_REMOVE_PROPERTY,
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_ATTRIBUTE,
  ENTRY_SET_INNER_HTML,
  ENTRY_SET_PROPERTY,
  ENTRY_SET_STYLE,
  ENTRY_UNSUPPORTED,
  diffDomPropertyPayload,
  isAttributeNameSafe,
  isEventLikeProp,
  isNonPayloadPropertyPayloadEntry,
  isOrdinaryPropertyPayloadEntry,
  isStylePropertyPayloadEntry,
  isStyleDangerousHtmlPayloadEntry
};
