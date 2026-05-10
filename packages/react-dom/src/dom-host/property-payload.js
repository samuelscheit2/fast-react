'use strict';

const ENTRY_SET_ATTRIBUTE = 'setAttribute';
const ENTRY_REMOVE_ATTRIBUTE = 'removeAttribute';
const ENTRY_NON_PAYLOAD = 'nonPayload';
const ENTRY_UNSUPPORTED = 'unsupported';

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

const unsupportedPropReasons = Object.freeze({
  dangerouslySetInnerHTML: {
    category: 'dangerouslySetInnerHTML',
    reason: 'dangerouslySetInnerHTML diffing is intentionally outside this helper'
  },
  innerHTML: {
    category: 'innerHTML',
    reason: 'innerHTML is reserved and is not handled as an ordinary attribute'
  },
  style: {
    category: 'style',
    reason: 'style diffing is intentionally outside this helper'
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
      payload.push(createEntry(tag, propName, null));
    }
  }

  for (const propName of Object.keys(currentProps)) {
    const nextValue = currentProps[propName];
    const previousValue = previousProps[propName];
    if (
      nextValue !== previousValue &&
      (nextValue != null || previousValue != null)
    ) {
      payload.push(createEntry(tag, propName, nextValue));
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

function createEntry(tag, propName, value) {
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

  if (isControlledFormProp(tag, propName)) {
    return createUnsupportedEntry(
      propName,
      `controlled-${tag}`,
      `controlled ${tag} props are handled by the controlled form wrapper path`
    );
  }

  if (formActionProps.has(propName)) {
    return createUnsupportedEntry(
      propName,
      'form-action',
      'form action props are intentionally outside this ordinary attribute helper'
    );
  }

  if (isDocumentScopedResourceTag(tag)) {
    return createUnsupportedEntry(
      propName,
      'document-resource-host',
      'document-scoped resource host tags require dedicated React DOM handling'
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

function createNonPayloadEntry(propName, category, reason) {
  return {
    kind: ENTRY_NON_PAYLOAD,
    propName,
    category,
    reason
  };
}

function createUnsupportedEntry(propName, category, reason) {
  return {
    kind: ENTRY_UNSUPPORTED,
    propName,
    category,
    reason
  };
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

module.exports = {
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_ATTRIBUTE,
  ENTRY_SET_ATTRIBUTE,
  ENTRY_UNSUPPORTED,
  diffDomPropertyPayload,
  isAttributeNameSafe,
  isEventLikeProp
};
