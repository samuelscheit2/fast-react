'use strict';

const {
  COMMENT_NODE,
  ELEMENT_NODE,
  assertValidContainer,
  describeContainer
} = require('./dom-container.js');

const HYDRATION_MARKER_DIAGNOSTIC_STATUS = 'diagnostic-only';
const HYDRATION_MARKER_DIAGNOSTIC_KIND =
  'FastReactDomHydrationContainerMarkerDiagnostics';

function inspectHydrationContainerMarkers(container, options) {
  assertValidContainer(container, options && options.validationOptions);

  const markerContracts = normalizeAcceptedMarkerContracts(
    options && options.markerContracts
  );
  const state = {
    acceptedMarkerCount: 0,
    commentMarkerCount: 0,
    companionPaths: new Set(),
    markerContracts,
    markerRows: [],
    nodeCount: 0,
    summaryCounts: new Map(),
    templateMarkerCount: 0,
    unrecognizedMarkerRows: [],
    visitedNodes: new Set()
  };

  scanChildNodes(container, 'container', 0, state);

  return freezeRecord({
    kind: HYDRATION_MARKER_DIAGNOSTIC_KIND,
    status: HYDRATION_MARKER_DIAGNOSTIC_STATUS,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    hydrateRootSupported: false,
    rootSchedulingSupported: false,
    eventReplaySupported: false,
    domMutationSupported: false,
    suspenseHydrationSupported: false,
    formMarkerClaimingSupported: false,
    traversal: 'container.childNodes depth-first',
    containerInfo: freezeRecord(describeContainer(container)),
    markerContractCount: markerContracts.length,
    nodeCount: state.nodeCount,
    acceptedMarkerCount: state.acceptedMarkerCount,
    commentMarkerCount: state.commentMarkerCount,
    templateMarkerCount: state.templateMarkerCount,
    unrecognizedMarkerCount: state.unrecognizedMarkerRows.length,
    markers: freezeArray(state.markerRows),
    unrecognizedMarkers: freezeArray(state.unrecognizedMarkerRows),
    summaryByContract: freezeArray(createSummaryByContract(state))
  });
}

function scanChildNodes(parentNode, parentPath, depth, state) {
  const childNodes = readChildNodes(parentNode);
  for (let index = 0; index < childNodes.length; index++) {
    const node = childNodes[index];
    if (node == null || typeof node !== 'object') {
      continue;
    }

    if (state.visitedNodes.has(node)) {
      continue;
    }
    state.visitedNodes.add(node);
    state.nodeCount++;

    const path = `${parentPath}.childNodes[${index}]`;
    if (!state.companionPaths.has(path)) {
      inspectHydrationNode({
        depth,
        index,
        nextNode: childNodes[index + 1] || null,
        nextPath: `${parentPath}.childNodes[${index + 1}]`,
        node,
        path,
        state
      });
    }

    scanChildNodes(node, path, depth + 1, state);
  }
}

function inspectHydrationNode({
  depth,
  index,
  nextNode,
  nextPath,
  node,
  path,
  state
}) {
  const nodeType = readNodeType(node);
  if (nodeType === COMMENT_NODE) {
    inspectCommentMarker({
      depth,
      index,
      nextNode,
      nextPath,
      node,
      path,
      state
    });
    return;
  }

  if (isTemplateElement(node)) {
    inspectTemplateMarker({
      depth,
      index,
      node,
      path,
      state
    });
  }
}

function inspectCommentMarker({
  depth,
  index,
  nextNode,
  nextPath,
  node,
  path,
  state
}) {
  const commentData = readCommentData(node);
  const contract = findCommentContract(state.markerContracts, commentData);
  const nodeInfo = createNodeInfo(node);

  if (!contract) {
    if (looksLikeHydrationCommentData(commentData)) {
      state.unrecognizedMarkerRows.push(
        freezeRecord({
          kind: 'comment',
          path,
          nodeInfo,
          commentData,
          status: 'unrecognized-hydration-comment-marker'
        })
      );
    }
    return;
  }

  const companion = inspectCommentCompanion({
    contract,
    nextNode,
    nextPath
  });
  if (companion && companion.path) {
    state.companionPaths.add(companion.path);
  }

  pushMarkerRow(
    state,
    freezeRecord({
      kind: 'comment',
      markerId: createMarkerRowId(contract.id, path),
      path,
      depth,
      index,
      contractId: contract.id,
      area: contract.area,
      lifecycle: contract.lifecycle,
      commentData,
      serializedMarker: contract.serializedMarker,
      companion,
      nodeInfo
    })
  );
  state.commentMarkerCount++;
}

function inspectTemplateMarker({depth, index, node, path, state}) {
  const templateInfo = createTemplateInfo(node);
  const contract = classifyTemplateContract(
    state.markerContracts,
    templateInfo
  );

  if (!contract) {
    if (looksLikeHydrationTemplate(templateInfo)) {
      state.unrecognizedMarkerRows.push(
        freezeRecord({
          kind: 'template',
          path,
          nodeInfo: createNodeInfo(node),
          templateInfo,
          status: 'unrecognized-hydration-template-marker'
        })
      );
    }
    return;
  }

  pushMarkerRow(
    state,
    freezeRecord({
      kind: 'template',
      markerId: createMarkerRowId(contract.id, path),
      path,
      depth,
      index,
      contractId: contract.id,
      area: contract.area,
      lifecycle: contract.lifecycle,
      serializedMarker: contract.serializedMarker,
      companionNode: contract.companionNode,
      templateInfo,
      nodeInfo: createNodeInfo(node)
    })
  );
  state.templateMarkerCount++;
}

function inspectCommentCompanion({contract, nextNode, nextPath}) {
  if (contract.companionNode === null) {
    return null;
  }

  const companion = classifyCommentCompanion(contract, nextNode);
  return freezeRecord({
    path: nextPath,
    required: true,
    status: companion.status,
    expected: contract.companionNode,
    contractId: contract.id,
    templateInfo: companion.templateInfo,
    nodeInfo:
      nextNode != null && typeof nextNode === 'object'
        ? createNodeInfo(nextNode)
        : null,
    acceptedEvidence: companion.status === 'matched'
  });
}

function classifyCommentCompanion(contract, nextNode) {
  if (!isTemplateElement(nextNode)) {
    return {
      status: 'missing-template-companion',
      templateInfo: null
    };
  }

  const templateInfo = createTemplateInfo(nextNode);
  if (
    contract.id === 'suspense-pending-start' ||
    contract.id === 'suspense-queued-start'
  ) {
    return {
      status:
        templateInfo.idParts && templateInfo.idParts.kind === 'B'
          ? 'matched'
          : 'template-companion-without-boundary-id',
      templateInfo
    };
  }

  if (contract.id === 'suspense-client-rendered-start') {
    return {
      status: 'matched',
      templateInfo
    };
  }

  return {
    status: 'unsupported-companion-contract',
    templateInfo
  };
}

function classifyTemplateContract(markerContracts, templateInfo) {
  const attributePresence = templateInfo.attributePresence;
  if (
    templateInfo.idParts &&
    templateInfo.idParts.kind === 'P' &&
    !hasAnyAttribute(attributePresence, [
      'data-rsi',
      'data-rci',
      'data-rri',
      'data-rxi'
    ])
  ) {
    return findContract(markerContracts, 'segment-placeholder');
  }

  if (
    attributePresence['data-rsi'] === true &&
    templateInfo.dataSidParts &&
    templateInfo.dataSidParts.kind === 'S' &&
    templateInfo.dataPidParts &&
    templateInfo.dataPidParts.kind === 'P'
  ) {
    return findContract(markerContracts, 'external-runtime-complete-segment');
  }

  if (
    attributePresence['data-rci'] === true &&
    templateInfo.dataBidParts &&
    templateInfo.dataBidParts.kind === 'B' &&
    templateInfo.dataSidParts &&
    templateInfo.dataSidParts.kind === 'S'
  ) {
    return findContract(markerContracts, 'external-runtime-complete-boundary');
  }

  if (
    attributePresence['data-rri'] === true &&
    attributePresence['data-sty'] === true &&
    templateInfo.dataBidParts &&
    templateInfo.dataBidParts.kind === 'B' &&
    templateInfo.dataSidParts &&
    templateInfo.dataSidParts.kind === 'S'
  ) {
    return findContract(
      markerContracts,
      'external-runtime-complete-boundary-with-styles'
    );
  }

  if (
    attributePresence['data-rxi'] === true &&
    templateInfo.dataBidParts &&
    templateInfo.dataBidParts.kind === 'B'
  ) {
    return findContract(
      markerContracts,
      'external-runtime-client-render-boundary'
    );
  }

  return null;
}

function pushMarkerRow(state, markerRow) {
  state.markerRows.push(markerRow);
  state.acceptedMarkerCount++;
  state.summaryCounts.set(
    markerRow.contractId,
    (state.summaryCounts.get(markerRow.contractId) || 0) + 1
  );
}

function createMarkerRowId(contractId, path) {
  return `${contractId}@${path}`;
}

function createSummaryByContract(state) {
  return state.markerContracts.map((contract) =>
    freezeRecord({
      id: contract.id,
      count: state.summaryCounts.get(contract.id) || 0
    })
  );
}

function normalizeAcceptedMarkerContracts(markerContracts) {
  if (!Array.isArray(markerContracts)) {
    const error = new Error(
      'Hydration marker parser requires accepted marker contracts.'
    );
    error.code = 'FAST_REACT_DOM_HYDRATION_MARKER_CONTRACTS_REQUIRED';
    throw error;
  }

  return freezeArray(
    markerContracts.map((contract) =>
      freezeRecord({
        id: contract && contract.id,
        area: contract && contract.area,
        serializedMarker: contract && contract.serializedMarker,
        commentData: contract && contract.commentData,
        companionNode: contract && contract.companionNode,
        lifecycle: contract && contract.lifecycle
      })
    )
  );
}

function findCommentContract(markerContracts, commentData) {
  return (
    markerContracts.find(
      (contract) =>
        contract.commentData !== null && contract.commentData === commentData
    ) || null
  );
}

function findContract(markerContracts, id) {
  return markerContracts.find((contract) => contract.id === id) || null;
}

function readChildNodes(node) {
  const childNodes = node && node.childNodes;
  if (childNodes == null || typeof childNodes !== 'object') {
    return [];
  }

  if (Array.isArray(childNodes)) {
    return childNodes.slice();
  }

  const length =
    typeof childNodes.length === 'number' && childNodes.length >= 0
      ? childNodes.length
      : 0;
  const nodes = [];
  for (let index = 0; index < length; index++) {
    nodes.push(childNodes[index]);
  }
  return nodes;
}

function isTemplateElement(node) {
  if (node == null || typeof node !== 'object') {
    return false;
  }

  if (readNodeType(node) !== ELEMENT_NODE) {
    return false;
  }

  const nodeName = String(node.nodeName || node.tagName || '').toUpperCase();
  const localName = String(node.localName || '').toLowerCase();
  return nodeName === 'TEMPLATE' || localName === 'template';
}

function createNodeInfo(node) {
  return freezeRecord({
    nodeName: node && node.nodeName ? String(node.nodeName) : null,
    nodeType: readNodeType(node)
  });
}

function createTemplateInfo(node) {
  const attributes = createTemplateAttributeSnapshot(node);
  return freezeRecord({
    attributes,
    attributePresence: freezeRecord(
      Object.fromEntries(
        Object.keys(attributes).map((name) => [name, true])
      )
    ),
    id: attributes.id || null,
    idParts: parseHydrationMarkerId(attributes.id || null),
    dataBid: attributes['data-bid'] || null,
    dataBidParts: parseHydrationMarkerId(attributes['data-bid'] || null),
    dataPid: attributes['data-pid'] || null,
    dataPidParts: parseHydrationMarkerId(attributes['data-pid'] || null),
    dataSid: attributes['data-sid'] || null,
    dataSidParts: parseHydrationMarkerId(attributes['data-sid'] || null),
    errorEvidence: freezeRecord({
      digest: attributes['data-dgst'] || null,
      message: attributes['data-msg'] || null,
      stack: attributes['data-stck'] || null,
      componentStack: attributes['data-cstck'] || null
    })
  });
}

function createTemplateAttributeSnapshot(node) {
  const names = [
    'id',
    'data-rsi',
    'data-rci',
    'data-rri',
    'data-rxi',
    'data-bid',
    'data-sid',
    'data-pid',
    'data-sty',
    'data-dgst',
    'data-msg',
    'data-stck',
    'data-cstck'
  ];
  const attributes = {};

  for (const name of names) {
    const value = readAttribute(node, name);
    if (value !== null) {
      attributes[name] = value;
    }
  }

  return freezeRecord(attributes);
}

function readAttribute(node, name) {
  if (node == null || typeof node !== 'object') {
    return null;
  }

  if (typeof node.getAttribute === 'function') {
    const value = node.getAttribute(name);
    return value == null ? null : String(value);
  }

  const attributes = node.attributes;
  if (attributes && typeof attributes === 'object') {
    if (Object.prototype.hasOwnProperty.call(attributes, name)) {
      const attribute = attributes[name];
      if (attribute == null) {
        return '';
      }
      if (typeof attribute === 'object' && 'value' in attribute) {
        return attribute.value == null ? '' : String(attribute.value);
      }
      return String(attribute);
    }

    if (typeof attributes.length === 'number') {
      for (let index = 0; index < attributes.length; index++) {
        const attribute = attributes[index];
        if (attribute && attribute.name === name) {
          return attribute.value == null ? '' : String(attribute.value);
        }
      }
    }
  }

  return Object.prototype.hasOwnProperty.call(node, name)
    ? String(node[name])
    : null;
}

function parseHydrationMarkerId(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  const match = /^(.*)([BPS]):([0-9a-fA-F]+)$/u.exec(value);
  if (!match) {
    return null;
  }

  return freezeRecord({
    full: value,
    identifierPrefix: match[1],
    kind: match[2],
    hex: match[3]
  });
}

function hasAnyAttribute(attributePresence, names) {
  return names.some((name) => attributePresence[name] === true);
}

function readCommentData(node) {
  if (typeof node.data === 'string') {
    return node.data;
  }
  if (typeof node.nodeValue === 'string') {
    return node.nodeValue;
  }
  return null;
}

function readNodeType(node) {
  return node && typeof node.nodeType === 'number' ? node.nodeType : null;
}

function looksLikeHydrationCommentData(commentData) {
  return (
    typeof commentData === 'string' &&
    (commentData.startsWith('$') ||
      commentData.startsWith('/') ||
      commentData === '&' ||
      commentData === '/&' ||
      commentData === 'F' ||
      commentData === 'F!' ||
      commentData === 'html' ||
      commentData === 'head' ||
      commentData === 'body')
  );
}

function looksLikeHydrationTemplate(templateInfo) {
  return Boolean(
    templateInfo.idParts ||
      templateInfo.dataBidParts ||
      templateInfo.dataPidParts ||
      templateInfo.dataSidParts ||
      hasAnyAttribute(templateInfo.attributePresence, [
        'data-rsi',
        'data-rci',
        'data-rri',
        'data-rxi'
      ])
  );
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

module.exports = {
  HYDRATION_MARKER_DIAGNOSTIC_KIND,
  HYDRATION_MARKER_DIAGNOSTIC_STATUS,
  inspectHydrationContainerMarkers
};
