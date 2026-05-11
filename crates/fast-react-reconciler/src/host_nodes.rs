//! Private reconciler-owned detached host node storage.
//!
//! Host nodes created during complete work are renderer-owned values, but the
//! reconciler needs an opaque state-node boundary to carry them until a later
//! commit traversal consumes them. This store owns only detached host
//! instance/text records and validates typed root/fiber/token metadata before
//! returning a value.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicUsize, Ordering};

use fast_react_core::{FiberId, PropsHandle, StateNodeHandle};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::{FiberRootId, HostFiberTokenId};

static HOST_NODE_UPDATE_SOURCE_SEQUENCE: AtomicUsize = AtomicUsize::new(1);

fn claim_host_node_update_source_sequence() -> usize {
    HOST_NODE_UPDATE_SOURCE_SEQUENCE.fetch_add(1, Ordering::Relaxed)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeScope {
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
}

impl HostNodeScope {
    #[must_use]
    pub(crate) const fn new(
        root_id: FiberRootId,
        fiber_id: FiberId,
        token_id: HostFiberTokenId,
        phase: HostFiberTokenPhase,
    ) -> Self {
        Self {
            root_id,
            fiber_id,
            token_id,
            phase,
        }
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeUpdateCurrentness {
    source_sequence: usize,
    handle: Option<StateNodeHandle>,
    root_id: Option<FiberRootId>,
    fiber_id: Option<FiberId>,
    token_id: Option<HostFiberTokenId>,
    phase: Option<HostFiberTokenPhase>,
    target: Option<HostFiberTokenTarget>,
}

impl HostNodeUpdateCurrentness {
    #[must_use]
    pub(crate) fn new() -> Self {
        Self {
            source_sequence: claim_host_node_update_source_sequence(),
            handle: None,
            root_id: None,
            fiber_id: None,
            token_id: None,
            phase: None,
            target: None,
        }
    }

    #[must_use]
    pub(crate) fn for_scope(
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
    ) -> Self {
        Self::new()
            .with_handle(handle)
            .with_root_id(scope.root_id())
            .with_fiber_id(scope.fiber_id())
            .with_token_id(scope.token_id())
            .with_phase(scope.phase())
            .with_target(target)
    }

    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_sequence
    }

    #[must_use]
    pub(crate) const fn handle(self) -> Option<StateNodeHandle> {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> Option<FiberRootId> {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> Option<FiberId> {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> Option<HostFiberTokenId> {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> Option<HostFiberTokenPhase> {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(self) -> Option<HostFiberTokenTarget> {
        self.target
    }

    #[must_use]
    pub(crate) const fn with_handle(self, handle: StateNodeHandle) -> Self {
        Self {
            handle: Some(handle),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_root_id(self, root_id: FiberRootId) -> Self {
        Self {
            root_id: Some(root_id),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_fiber_id(self, fiber_id: FiberId) -> Self {
        Self {
            fiber_id: Some(fiber_id),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_token_id(self, token_id: HostFiberTokenId) -> Self {
        Self {
            token_id: Some(token_id),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_phase(self, phase: HostFiberTokenPhase) -> Self {
        Self {
            phase: Some(phase),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_target(self, target: HostFiberTokenTarget) -> Self {
        Self {
            target: Some(target),
            ..self
        }
    }
}

impl Default for HostNodeUpdateCurrentness {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeAppliedUpdateCurrentness {
    source_sequence: usize,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
}

impl HostNodeAppliedUpdateCurrentness {
    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_sequence
    }

    #[must_use]
    pub(crate) const fn handle(self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeMetadata {
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    active: bool,
}

impl HostNodeMetadata {
    #[must_use]
    pub(crate) const fn handle(self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) const fn is_active(self) -> bool {
        self.active
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodePropertyUpdate {
    payload_kind: &'static str,
    prop_name: &'static str,
    property_name: &'static str,
    old_props: PropsHandle,
    new_props: PropsHandle,
    execution: HostNodePropertyUpdateExecution,
    currentness: Option<HostNodeUpdateCurrentness>,
}

impl HostNodePropertyUpdate {
    #[must_use]
    pub(crate) fn new(
        prop_name: &'static str,
        property_name: &'static str,
        old_props: PropsHandle,
        new_props: PropsHandle,
    ) -> Self {
        Self {
            payload_kind: "property",
            prop_name,
            property_name,
            old_props,
            new_props,
            execution: HostNodePropertyUpdateExecution::CommitUpdate,
            currentness: Some(HostNodeUpdateCurrentness::new()),
        }
    }

    #[must_use]
    pub(crate) const fn with_payload_kind(self, payload_kind: &'static str) -> Self {
        Self {
            payload_kind,
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn with_execution(self, execution: HostNodePropertyUpdateExecution) -> Self {
        Self { execution, ..self }
    }

    #[must_use]
    pub(crate) const fn with_currentness(self, currentness: HostNodeUpdateCurrentness) -> Self {
        Self {
            currentness: Some(currentness),
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn without_currentness_for_canary(self) -> Self {
        Self {
            currentness: None,
            ..self
        }
    }

    #[must_use]
    pub(crate) const fn payload_kind(self) -> &'static str {
        self.payload_kind
    }

    #[must_use]
    pub(crate) const fn prop_name(self) -> &'static str {
        self.prop_name
    }

    #[must_use]
    pub(crate) const fn property_name(self) -> &'static str {
        self.property_name
    }

    #[must_use]
    pub(crate) const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(crate) const fn new_props(self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    pub(crate) const fn execution(self) -> HostNodePropertyUpdateExecution {
        self.execution
    }

    #[must_use]
    pub(crate) const fn currentness(self) -> Option<HostNodeUpdateCurrentness> {
        self.currentness
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostNodePropertyUpdateExecution {
    CommitUpdate,
    ResetTextContent,
}

impl HostNodePropertyUpdateExecution {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::CommitUpdate => "commit-update",
            Self::ResetTextContent => "reset-text-content",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeAppliedPropertyUpdate {
    sequence: usize,
    store_order: usize,
    source_currentness: HostNodeAppliedUpdateCurrentness,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    payload_kind: &'static str,
    prop_name: &'static str,
    property_name: &'static str,
    old_props: PropsHandle,
    new_props: PropsHandle,
    execution: HostNodePropertyUpdateExecution,
}

impl HostNodeAppliedPropertyUpdate {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn store_order(self) -> usize {
        self.store_order
    }

    #[must_use]
    pub(crate) const fn source_currentness(self) -> HostNodeAppliedUpdateCurrentness {
        self.source_currentness
    }

    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_currentness.source_sequence()
    }

    #[must_use]
    pub(crate) const fn handle(self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) const fn payload_kind(self) -> &'static str {
        self.payload_kind
    }

    #[must_use]
    pub(crate) const fn prop_name(self) -> &'static str {
        self.prop_name
    }

    #[must_use]
    pub(crate) const fn property_name(self) -> &'static str {
        self.property_name
    }

    #[must_use]
    pub(crate) const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(crate) const fn new_props(self) -> PropsHandle {
        self.new_props
    }

    #[must_use]
    pub(crate) const fn execution(self) -> HostNodePropertyUpdateExecution {
        self.execution
    }

    #[must_use]
    pub(crate) const fn execution_name(self) -> &'static str {
        self.execution.as_str()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostNodeTextUpdate {
    old_text: String,
    new_text: String,
    currentness: Option<HostNodeUpdateCurrentness>,
}

impl HostNodeTextUpdate {
    #[must_use]
    pub(crate) fn new(old_text: impl Into<String>, new_text: impl Into<String>) -> Self {
        Self {
            old_text: old_text.into(),
            new_text: new_text.into(),
            currentness: Some(HostNodeUpdateCurrentness::new()),
        }
    }

    #[must_use]
    pub(crate) fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    pub(crate) fn new_text(&self) -> &str {
        &self.new_text
    }

    #[must_use]
    pub(crate) fn with_currentness(mut self, currentness: HostNodeUpdateCurrentness) -> Self {
        self.currentness = Some(currentness);
        self
    }

    #[must_use]
    pub(crate) fn without_currentness_for_canary(mut self) -> Self {
        self.currentness = None;
        self
    }

    #[must_use]
    pub(crate) const fn currentness(&self) -> Option<HostNodeUpdateCurrentness> {
        self.currentness
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostNodeAppliedTextUpdate {
    sequence: usize,
    source_currentness: HostNodeAppliedUpdateCurrentness,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    old_text: String,
    new_text: String,
}

impl HostNodeAppliedTextUpdate {
    #[must_use]
    pub(crate) const fn sequence(&self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn source_currentness(&self) -> HostNodeAppliedUpdateCurrentness {
        self.source_currentness
    }

    #[must_use]
    pub(crate) const fn source_sequence(&self) -> usize {
        self.source_currentness.source_sequence()
    }

    #[must_use]
    pub(crate) const fn handle(&self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(&self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(&self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(&self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(&self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(&self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) fn old_text(&self) -> &str {
        &self.old_text
    }

    #[must_use]
    pub(crate) fn new_text(&self) -> &str {
        &self.new_text
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodeLatestPropsUpdate {
    sequence: usize,
    store_order: usize,
    source_currentness: HostNodeAppliedUpdateCurrentness,
    handle: StateNodeHandle,
    root_id: FiberRootId,
    fiber_id: FiberId,
    token_id: HostFiberTokenId,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    payload_kind: &'static str,
    prop_name: &'static str,
    property_update_sequence: usize,
    property_update_store_order: usize,
    old_props: PropsHandle,
    previous_latest_props: Option<PropsHandle>,
    latest_props: PropsHandle,
}

impl HostNodeLatestPropsUpdate {
    #[must_use]
    pub(crate) const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub(crate) const fn store_order(self) -> usize {
        self.store_order
    }

    #[must_use]
    pub(crate) const fn source_currentness(self) -> HostNodeAppliedUpdateCurrentness {
        self.source_currentness
    }

    #[must_use]
    pub(crate) const fn source_sequence(self) -> usize {
        self.source_currentness.source_sequence()
    }

    #[must_use]
    pub(crate) const fn handle(self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn root_id(self) -> FiberRootId {
        self.root_id
    }

    #[must_use]
    pub(crate) const fn fiber_id(self) -> FiberId {
        self.fiber_id
    }

    #[must_use]
    pub(crate) const fn token_id(self) -> HostFiberTokenId {
        self.token_id
    }

    #[must_use]
    pub(crate) const fn phase(self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) const fn payload_kind(self) -> &'static str {
        self.payload_kind
    }

    #[must_use]
    pub(crate) const fn prop_name(self) -> &'static str {
        self.prop_name
    }

    #[must_use]
    pub(crate) const fn property_update_sequence(self) -> usize {
        self.property_update_sequence
    }

    #[must_use]
    pub(crate) const fn property_update_store_order(self) -> usize {
        self.property_update_store_order
    }

    #[must_use]
    pub(crate) const fn old_props(self) -> PropsHandle {
        self.old_props
    }

    #[must_use]
    pub(crate) const fn previous_latest_props(self) -> Option<PropsHandle> {
        self.previous_latest_props
    }

    #[must_use]
    pub(crate) const fn latest_props(self) -> PropsHandle {
        self.latest_props
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostNodePrivatePropertyCommit {
    property_update: HostNodeAppliedPropertyUpdate,
    latest_props_update: HostNodeLatestPropsUpdate,
}

impl HostNodePrivatePropertyCommit {
    #[must_use]
    pub(crate) const fn property_update(self) -> HostNodeAppliedPropertyUpdate {
        self.property_update
    }

    #[must_use]
    pub(crate) const fn latest_props_update(self) -> HostNodeLatestPropsUpdate {
        self.latest_props_update
    }

    #[must_use]
    pub(crate) const fn private_host_store_only(self) -> bool {
        true
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostNodeViolation {
    InvalidHandle,
    Stale,
    MissingCurrentness,
    StaleCurrentness,
    WrongRoot,
    WrongFiber,
    WrongToken,
    WrongPhase,
    WrongTarget,
}

impl HostNodeViolation {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::InvalidHandle => "invalid handle",
            Self::Stale => "stale host node",
            Self::MissingCurrentness => "host node update payload is missing source currentness",
            Self::StaleCurrentness => "stale host node update payload currentness",
            Self::WrongRoot => "host node belongs to another root",
            Self::WrongFiber => "host node belongs to another fiber",
            Self::WrongToken => "host node belongs to another host fiber token",
            Self::WrongPhase => "host node used in the wrong phase",
            Self::WrongTarget => "host node used for the wrong host target",
        }
    }
}

impl Display for HostNodeViolation {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostNodeValidationError {
    handle: StateNodeHandle,
    phase: HostFiberTokenPhase,
    target: HostFiberTokenTarget,
    violation: HostNodeViolation,
}

impl HostNodeValidationError {
    #[must_use]
    pub(crate) const fn new(
        handle: StateNodeHandle,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
        violation: HostNodeViolation,
    ) -> Self {
        Self {
            handle,
            phase,
            target,
            violation,
        }
    }

    #[must_use]
    pub(crate) const fn handle(&self) -> StateNodeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn phase(&self) -> HostFiberTokenPhase {
        self.phase
    }

    #[must_use]
    pub(crate) const fn target(&self) -> HostFiberTokenTarget {
        self.target
    }

    #[must_use]
    pub(crate) const fn violation(&self) -> HostNodeViolation {
        self.violation
    }
}

impl Display for HostNodeValidationError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "{} {} host node handle {} is invalid: {}",
            self.phase,
            self.target,
            self.handle.raw(),
            self.violation
        )
    }
}

impl Error for HostNodeValidationError {}

pub(crate) struct HostNodeStore<H: HostTypes> {
    records: Vec<Option<HostNodeRecord<H>>>,
}

impl<H: HostTypes> HostNodeStore<H> {
    #[must_use]
    pub(crate) const fn new() -> Self {
        Self {
            records: Vec::new(),
        }
    }

    pub(crate) fn insert_instance(
        &mut self,
        scope: HostNodeScope,
        instance: H::Instance,
    ) -> StateNodeHandle {
        self.insert(
            scope,
            HostFiberTokenTarget::Instance,
            HostNodeValue::Instance(instance),
        )
    }

    pub(crate) fn insert_text(
        &mut self,
        scope: HostNodeScope,
        text: H::TextInstance,
    ) -> StateNodeHandle {
        self.insert(
            scope,
            HostFiberTokenTarget::TextInstance,
            HostNodeValue::Text(text),
        )
    }

    pub(crate) fn instance(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&H::Instance, HostNodeValidationError> {
        let record = self.record(handle, scope, HostFiberTokenTarget::Instance, true)?;
        match &record.value {
            HostNodeValue::Instance(instance) => Ok(instance),
            HostNodeValue::Text(_) => unreachable!("record target validated as instance"),
        }
    }

    pub(crate) fn instance_mut(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&mut H::Instance, HostNodeValidationError> {
        let record = self.record_mut(handle, scope, HostFiberTokenTarget::Instance, true)?;
        match &mut record.value {
            HostNodeValue::Instance(instance) => Ok(instance),
            HostNodeValue::Text(_) => unreachable!("record target validated as instance"),
        }
    }

    pub(crate) fn text(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&H::TextInstance, HostNodeValidationError> {
        let record = self.record(handle, scope, HostFiberTokenTarget::TextInstance, true)?;
        match &record.value {
            HostNodeValue::Text(text) => Ok(text),
            HostNodeValue::Instance(_) => unreachable!("record target validated as text instance"),
        }
    }

    pub(crate) fn text_mut(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&mut H::TextInstance, HostNodeValidationError> {
        let record = self.record_mut(handle, scope, HostFiberTokenTarget::TextInstance, true)?;
        match &mut record.value {
            HostNodeValue::Text(text) => Ok(text),
            HostNodeValue::Instance(_) => unreachable!("record target validated as text instance"),
        }
    }

    pub(crate) fn instance_metadata(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<HostNodeMetadata, HostNodeValidationError> {
        Ok(*self
            .record(handle, scope, HostFiberTokenTarget::Instance, false)?
            .metadata())
    }

    pub(crate) fn text_metadata(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<HostNodeMetadata, HostNodeValidationError> {
        Ok(*self
            .record(handle, scope, HostFiberTokenTarget::TextInstance, false)?
            .metadata())
    }

    pub(crate) fn apply_instance_property_update(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        update: HostNodePropertyUpdate,
    ) -> Result<HostNodeAppliedPropertyUpdate, HostNodeValidationError> {
        let record = self.record_mut(handle, scope, HostFiberTokenTarget::Instance, true)?;
        let currentness =
            record.validate_property_update_currentness(handle, update.currentness(), update)?;
        let applied = record.push_property_update(handle, update, currentness);
        record.mark_update_currentness_consumed(currentness);
        Ok(applied)
    }

    pub(crate) fn commit_instance_property_update_to_private_store(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        update: HostNodePropertyUpdate,
    ) -> Result<HostNodePrivatePropertyCommit, HostNodeValidationError> {
        let record = self.record_mut(handle, scope, HostFiberTokenTarget::Instance, true)?;
        let currentness =
            record.validate_property_update_currentness(handle, update.currentness(), update)?;
        let property_update = record.push_property_update(handle, update, currentness);
        let latest_props_update =
            record.publish_latest_props_after_property_update(handle, property_update);
        record.mark_update_currentness_consumed(currentness);
        Ok(HostNodePrivatePropertyCommit {
            property_update,
            latest_props_update,
        })
    }

    pub(crate) fn instance_property_updates(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&[HostNodeAppliedPropertyUpdate], HostNodeValidationError> {
        Ok(&self
            .record(handle, scope, HostFiberTokenTarget::Instance, true)?
            .property_updates)
    }

    pub(crate) fn apply_text_update(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        update: HostNodeTextUpdate,
    ) -> Result<HostNodeAppliedTextUpdate, HostNodeValidationError> {
        let record = self.record_mut(handle, scope, HostFiberTokenTarget::TextInstance, true)?;
        let currentness = record.validate_text_update_currentness(handle, &update)?;
        let applied = HostNodeAppliedTextUpdate {
            sequence: record.text_updates.len(),
            source_currentness: currentness,
            handle,
            root_id: record.metadata.root_id,
            fiber_id: record.metadata.fiber_id,
            token_id: record.metadata.token_id,
            phase: record.metadata.phase,
            target: record.metadata.target,
            old_text: update.old_text,
            new_text: update.new_text,
        };
        record.latest_text = Some(applied.new_text.clone());
        record.text_updates.push(applied.clone());
        record.mark_update_currentness_consumed(currentness);
        Ok(applied)
    }

    pub(crate) fn text_updates(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&[HostNodeAppliedTextUpdate], HostNodeValidationError> {
        Ok(&self
            .record(handle, scope, HostFiberTokenTarget::TextInstance, true)?
            .text_updates)
    }

    pub(crate) fn instance_latest_props(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<Option<PropsHandle>, HostNodeValidationError> {
        Ok(self
            .record(handle, scope, HostFiberTokenTarget::Instance, true)?
            .latest_props)
    }

    pub(crate) fn instance_latest_props_updates(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<&[HostNodeLatestPropsUpdate], HostNodeValidationError> {
        Ok(&self
            .record(handle, scope, HostFiberTokenTarget::Instance, true)?
            .latest_props_updates)
    }

    pub(crate) fn invalidate_instance(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<(), HostNodeValidationError> {
        self.invalidate(handle, scope, HostFiberTokenTarget::Instance)
    }

    pub(crate) fn invalidate_text(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<(), HostNodeValidationError> {
        self.invalidate(handle, scope, HostFiberTokenTarget::TextInstance)
    }

    pub(crate) fn invalidate_deleted_instance(
        &mut self,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
    ) -> Result<HostNodeMetadata, HostNodeValidationError> {
        self.invalidate_deleted(handle, root_id, fiber_id, HostFiberTokenTarget::Instance)
    }

    pub(crate) fn invalidate_deleted_text(
        &mut self,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
    ) -> Result<HostNodeMetadata, HostNodeValidationError> {
        self.invalidate_deleted(
            handle,
            root_id,
            fiber_id,
            HostFiberTokenTarget::TextInstance,
        )
    }

    pub(crate) fn remove_instance(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<H::Instance, HostNodeValidationError> {
        match self.remove(handle, scope, HostFiberTokenTarget::Instance)? {
            HostNodeValue::Instance(instance) => Ok(instance),
            HostNodeValue::Text(_) => unreachable!("record target validated as instance"),
        }
    }

    pub(crate) fn remove_text(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
    ) -> Result<H::TextInstance, HostNodeValidationError> {
        match self.remove(handle, scope, HostFiberTokenTarget::TextInstance)? {
            HostNodeValue::Text(text) => Ok(text),
            HostNodeValue::Instance(_) => unreachable!("record target validated as text instance"),
        }
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.iter().flatten().count()
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.len() == 0
    }

    #[must_use]
    pub(crate) fn instance_count(&self) -> usize {
        self.records
            .iter()
            .flatten()
            .filter(|record| record.metadata.target == HostFiberTokenTarget::Instance)
            .count()
    }

    #[must_use]
    pub(crate) fn text_count(&self) -> usize {
        self.records
            .iter()
            .flatten()
            .filter(|record| record.metadata.target == HostFiberTokenTarget::TextInstance)
            .count()
    }

    #[must_use]
    pub(crate) fn active_len(&self) -> usize {
        self.records
            .iter()
            .flatten()
            .filter(|record| record.metadata.active)
            .count()
    }

    #[must_use]
    pub(crate) fn active_instance_count(&self) -> usize {
        self.records
            .iter()
            .flatten()
            .filter(|record| {
                record.metadata.active && record.metadata.target == HostFiberTokenTarget::Instance
            })
            .count()
    }

    #[must_use]
    pub(crate) fn active_text_count(&self) -> usize {
        self.records
            .iter()
            .flatten()
            .filter(|record| {
                record.metadata.active
                    && record.metadata.target == HostFiberTokenTarget::TextInstance
            })
            .count()
    }

    fn insert(
        &mut self,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
        value: HostNodeValue<H>,
    ) -> StateNodeHandle {
        let handle = StateNodeHandle::from_raw(self.records.len() as u64 + 1);
        self.records.push(Some(HostNodeRecord {
            metadata: HostNodeMetadata {
                handle,
                root_id: scope.root_id(),
                fiber_id: scope.fiber_id(),
                token_id: scope.token_id(),
                phase: scope.phase(),
                target,
                active: true,
            },
            value,
            property_updates: Vec::new(),
            text_updates: Vec::new(),
            latest_text: None,
            latest_props: None,
            latest_props_updates: Vec::new(),
            next_private_store_order: 0,
            last_update_source_sequence: None,
        }));
        handle
    }

    fn invalidate(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
    ) -> Result<(), HostNodeValidationError> {
        let record = self.record_mut(handle, scope, target, false)?;
        record.metadata.active = false;
        Ok(())
    }

    fn invalidate_deleted(
        &mut self,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeMetadata, HostNodeValidationError> {
        let index = self.record_index_for_deleted_fiber(handle, root_id, fiber_id, target)?;
        let record = self.records[index]
            .as_mut()
            .ok_or_else(|| Self::invalid_handle(handle, HostFiberTokenPhase::Deletion, target))?;
        let metadata = record.metadata;
        record.metadata.active = false;
        Ok(metadata)
    }

    fn remove(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
    ) -> Result<HostNodeValue<H>, HostNodeValidationError> {
        let index = self.record_index(handle, scope, target, true)?;
        let record = self.records[index]
            .take()
            .ok_or_else(|| Self::invalid_handle(handle, scope.phase(), target))?;
        Ok(record.value)
    }

    fn record(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
        require_active: bool,
    ) -> Result<&HostNodeRecord<H>, HostNodeValidationError> {
        let index = self.record_index(handle, scope, target, require_active)?;
        self.records[index]
            .as_ref()
            .ok_or_else(|| Self::invalid_handle(handle, scope.phase(), target))
    }

    fn record_mut(
        &mut self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
        require_active: bool,
    ) -> Result<&mut HostNodeRecord<H>, HostNodeValidationError> {
        let index = self.record_index(handle, scope, target, require_active)?;
        self.records[index]
            .as_mut()
            .ok_or_else(|| Self::invalid_handle(handle, scope.phase(), target))
    }

    fn record_index(
        &self,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
        require_active: bool,
    ) -> Result<usize, HostNodeValidationError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(handle, scope.phase(), target));
        }

        let index = (handle.raw() - 1) as usize;
        let record = self
            .records
            .get(index)
            .and_then(Option::as_ref)
            .ok_or_else(|| Self::invalid_handle(handle, scope.phase(), target))?;

        Self::validate_metadata(record.metadata, scope, target, require_active)?;
        Ok(index)
    }

    fn record_index_for_deleted_fiber(
        &self,
        handle: StateNodeHandle,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<usize, HostNodeValidationError> {
        if handle.is_none() {
            return Err(Self::invalid_handle(
                handle,
                HostFiberTokenPhase::Deletion,
                target,
            ));
        }

        let index = (handle.raw() - 1) as usize;
        let record = self
            .records
            .get(index)
            .and_then(Option::as_ref)
            .ok_or_else(|| Self::invalid_handle(handle, HostFiberTokenPhase::Deletion, target))?;

        Self::validate_deleted_metadata(record.metadata, root_id, fiber_id, target)?;
        Ok(index)
    }

    fn validate_metadata(
        metadata: HostNodeMetadata,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
        require_active: bool,
    ) -> Result<(), HostNodeValidationError> {
        if metadata.target != target {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::WrongTarget,
            ));
        }
        if metadata.phase != scope.phase() {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::WrongPhase,
            ));
        }
        if metadata.root_id != scope.root_id() {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::WrongRoot,
            ));
        }
        if metadata.fiber_id != scope.fiber_id() {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::WrongFiber,
            ));
        }
        if metadata.token_id != scope.token_id() {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::WrongToken,
            ));
        }
        if require_active && !metadata.active {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                scope.phase(),
                target,
                HostNodeViolation::Stale,
            ));
        }

        Ok(())
    }

    fn validate_deleted_metadata(
        metadata: HostNodeMetadata,
        root_id: FiberRootId,
        fiber_id: FiberId,
        target: HostFiberTokenTarget,
    ) -> Result<(), HostNodeValidationError> {
        if metadata.target != target {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                HostFiberTokenPhase::Deletion,
                target,
                HostNodeViolation::WrongTarget,
            ));
        }
        if metadata.root_id != root_id {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                HostFiberTokenPhase::Deletion,
                target,
                HostNodeViolation::WrongRoot,
            ));
        }
        if metadata.fiber_id != fiber_id {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                HostFiberTokenPhase::Deletion,
                target,
                HostNodeViolation::WrongFiber,
            ));
        }
        if !metadata.active {
            return Err(HostNodeValidationError::new(
                metadata.handle,
                HostFiberTokenPhase::Deletion,
                target,
                HostNodeViolation::Stale,
            ));
        }

        Ok(())
    }

    fn invalid_handle(
        handle: StateNodeHandle,
        phase: HostFiberTokenPhase,
        target: HostFiberTokenTarget,
    ) -> HostNodeValidationError {
        HostNodeValidationError::new(handle, phase, target, HostNodeViolation::InvalidHandle)
    }
}

impl<H: HostTypes> Default for HostNodeStore<H> {
    fn default() -> Self {
        Self::new()
    }
}

struct HostNodeRecord<H: HostTypes> {
    metadata: HostNodeMetadata,
    value: HostNodeValue<H>,
    property_updates: Vec<HostNodeAppliedPropertyUpdate>,
    text_updates: Vec<HostNodeAppliedTextUpdate>,
    latest_text: Option<String>,
    latest_props: Option<PropsHandle>,
    latest_props_updates: Vec<HostNodeLatestPropsUpdate>,
    next_private_store_order: usize,
    last_update_source_sequence: Option<usize>,
}

impl<H: HostTypes> HostNodeRecord<H> {
    const fn metadata(&self) -> &HostNodeMetadata {
        &self.metadata
    }

    fn push_property_update(
        &mut self,
        handle: StateNodeHandle,
        update: HostNodePropertyUpdate,
        currentness: HostNodeAppliedUpdateCurrentness,
    ) -> HostNodeAppliedPropertyUpdate {
        let applied = HostNodeAppliedPropertyUpdate {
            sequence: self.property_updates.len(),
            store_order: self.claim_private_store_order(),
            source_currentness: currentness,
            handle,
            root_id: self.metadata.root_id,
            fiber_id: self.metadata.fiber_id,
            token_id: self.metadata.token_id,
            phase: self.metadata.phase,
            target: self.metadata.target,
            payload_kind: update.payload_kind(),
            prop_name: update.prop_name(),
            property_name: update.property_name(),
            old_props: update.old_props(),
            new_props: update.new_props(),
            execution: update.execution(),
        };
        self.property_updates.push(applied);
        applied
    }

    fn publish_latest_props_after_property_update(
        &mut self,
        handle: StateNodeHandle,
        property_update: HostNodeAppliedPropertyUpdate,
    ) -> HostNodeLatestPropsUpdate {
        let latest_props_update = HostNodeLatestPropsUpdate {
            sequence: self.latest_props_updates.len(),
            store_order: self.claim_private_store_order(),
            source_currentness: property_update.source_currentness(),
            handle,
            root_id: self.metadata.root_id,
            fiber_id: self.metadata.fiber_id,
            token_id: self.metadata.token_id,
            phase: self.metadata.phase,
            target: self.metadata.target,
            payload_kind: property_update.payload_kind(),
            prop_name: property_update.prop_name(),
            property_update_sequence: property_update.sequence(),
            property_update_store_order: property_update.store_order(),
            old_props: property_update.old_props(),
            previous_latest_props: self.latest_props,
            latest_props: property_update.new_props(),
        };
        self.latest_props = Some(property_update.new_props());
        self.latest_props_updates.push(latest_props_update);
        latest_props_update
    }

    fn validate_property_update_currentness(
        &self,
        handle: StateNodeHandle,
        currentness: Option<HostNodeUpdateCurrentness>,
        update: HostNodePropertyUpdate,
    ) -> Result<HostNodeAppliedUpdateCurrentness, HostNodeValidationError> {
        let currentness =
            self.bind_update_currentness(handle, HostFiberTokenTarget::Instance, currentness)?;
        if let Some(latest_props) = self.latest_props {
            if update.old_props() != latest_props {
                return Err(self.currentness_error(
                    handle,
                    HostFiberTokenTarget::Instance,
                    HostNodeViolation::StaleCurrentness,
                ));
            }
        }
        Ok(currentness)
    }

    fn validate_text_update_currentness(
        &self,
        handle: StateNodeHandle,
        update: &HostNodeTextUpdate,
    ) -> Result<HostNodeAppliedUpdateCurrentness, HostNodeValidationError> {
        let currentness = self.bind_update_currentness(
            handle,
            HostFiberTokenTarget::TextInstance,
            update.currentness(),
        )?;
        if let Some(latest_text) = &self.latest_text {
            if update.old_text() != latest_text {
                return Err(self.currentness_error(
                    handle,
                    HostFiberTokenTarget::TextInstance,
                    HostNodeViolation::StaleCurrentness,
                ));
            }
        }
        Ok(currentness)
    }

    fn bind_update_currentness(
        &self,
        handle: StateNodeHandle,
        target: HostFiberTokenTarget,
        currentness: Option<HostNodeUpdateCurrentness>,
    ) -> Result<HostNodeAppliedUpdateCurrentness, HostNodeValidationError> {
        let currentness = currentness.ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        let current_handle = currentness.handle().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_handle != handle {
            return Err(self.currentness_error(handle, target, HostNodeViolation::InvalidHandle));
        }
        let current_target = currentness.target().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_target != target {
            return Err(self.currentness_error(handle, target, HostNodeViolation::WrongTarget));
        }
        let current_phase = currentness.phase().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_phase != self.metadata.phase {
            return Err(self.currentness_error(handle, target, HostNodeViolation::WrongPhase));
        }
        let current_root = currentness.root_id().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_root != self.metadata.root_id {
            return Err(self.currentness_error(handle, target, HostNodeViolation::WrongRoot));
        }
        let current_fiber = currentness.fiber_id().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_fiber != self.metadata.fiber_id {
            return Err(self.currentness_error(handle, target, HostNodeViolation::WrongFiber));
        }
        let current_token = currentness.token_id().ok_or_else(|| {
            self.currentness_error(handle, target, HostNodeViolation::MissingCurrentness)
        })?;
        if current_token != self.metadata.token_id {
            return Err(self.currentness_error(handle, target, HostNodeViolation::WrongToken));
        }
        if self
            .last_update_source_sequence
            .is_some_and(|last_sequence| currentness.source_sequence() <= last_sequence)
        {
            return Err(self.currentness_error(
                handle,
                target,
                HostNodeViolation::StaleCurrentness,
            ));
        }

        Ok(HostNodeAppliedUpdateCurrentness {
            source_sequence: currentness.source_sequence(),
            handle,
            root_id: self.metadata.root_id,
            fiber_id: self.metadata.fiber_id,
            token_id: self.metadata.token_id,
            phase: self.metadata.phase,
            target,
        })
    }

    fn mark_update_currentness_consumed(&mut self, currentness: HostNodeAppliedUpdateCurrentness) {
        self.last_update_source_sequence = Some(currentness.source_sequence());
    }

    fn currentness_error(
        &self,
        handle: StateNodeHandle,
        target: HostFiberTokenTarget,
        violation: HostNodeViolation,
    ) -> HostNodeValidationError {
        HostNodeValidationError::new(handle, self.metadata.phase, target, violation)
    }

    fn claim_private_store_order(&mut self) -> usize {
        let order = self.next_private_store_order;
        self.next_private_store_order += 1;
        order
    }
}

enum HostNodeValue<H: HostTypes> {
    Instance(H::Instance),
    Text(H::TextInstance),
}

#[cfg(test)]
mod tests {
    use super::*;
    use fast_react_core::{FiberArena, FiberMode, FiberTag, PropsHandle};

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct TestInstance {
        id: u64,
        label: &'static str,
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    struct TestTextInstance {
        id: u64,
        text: String,
    }

    struct TestHost;

    impl HostTypes for TestHost {
        type HostFiberToken = ();
        type Type = ();
        type Props = ();
        type Container = ();
        type Instance = TestInstance;
        type TextInstance = TestTextInstance;
        type PublicInstance = ();
        type HostContext = ();
        type UpdatePayload = ();
        type TimeoutHandle = ();
        type NoTimeout = ();
        type CommitState = ();
        type EventPriority = ();
        type EventType = ();
        type EventTimestamp = ();
        type ActivityInstance = ();
        type SuspenseInstance = ();
        type HydratableInstance = ();
        type FormInstance = ();
        type ChildSet = ();
        type Resource = ();
        type HoistableRoot = ();
        type TransitionStatus = ();
        type SuspendedState = ();
        type RunningViewTransition = ();
        type ViewTransitionInstance = ();
        type InstanceMeasurement = ();
        type EventResponder = ();
        type GestureTimeline = ();
        type FragmentInstance = ();
        type RendererInspectionConfig = ();
    }

    fn root_id(raw: u64) -> FiberRootId {
        FiberRootId::new(raw).unwrap()
    }

    fn token_id(raw: u64) -> HostFiberTokenId {
        HostFiberTokenId::new(raw).unwrap()
    }

    fn create_fiber_id(tag: FiberTag) -> FiberId {
        let mut arena = FiberArena::new();
        arena.create_fiber(tag, None, PropsHandle::NONE, FiberMode::NO)
    }

    fn instance_scope() -> HostNodeScope {
        HostNodeScope::new(
            root_id(1),
            create_fiber_id(FiberTag::HostComponent),
            token_id(1),
            HostFiberTokenPhase::Creation,
        )
    }

    fn text_scope() -> HostNodeScope {
        HostNodeScope::new(
            root_id(1),
            create_fiber_id(FiberTag::HostText),
            token_id(2),
            HostFiberTokenPhase::Creation,
        )
    }

    fn assert_violation<T: std::fmt::Debug>(
        result: Result<T, HostNodeValidationError>,
        violation: HostNodeViolation,
    ) {
        assert_eq!(result.unwrap_err().violation(), violation);
    }

    fn assert_update_currentness(
        currentness: HostNodeAppliedUpdateCurrentness,
        handle: StateNodeHandle,
        scope: HostNodeScope,
        target: HostFiberTokenTarget,
    ) {
        assert!(currentness.source_sequence() > 0);
        assert_eq!(currentness.handle(), handle);
        assert_eq!(currentness.root_id(), scope.root_id());
        assert_eq!(currentness.fiber_id(), scope.fiber_id());
        assert_eq!(currentness.token_id(), scope.token_id());
        assert_eq!(currentness.phase(), scope.phase());
        assert_eq!(currentness.target(), target);
        assert!(!currentness.public_dom_compatibility_claimed());
    }

    #[test]
    fn host_nodes_store_instances_behind_state_node_handles() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "section",
            },
        );

        assert!(handle.is_some());
        assert_eq!(store.len(), 1);
        assert!(!store.is_empty());
        assert_eq!(store.instance_count(), 1);
        assert_eq!(store.text_count(), 0);

        let metadata = store.instance_metadata(handle, scope).unwrap();
        assert_eq!(metadata.handle(), handle);
        assert_eq!(metadata.root_id(), scope.root_id());
        assert_eq!(metadata.fiber_id(), scope.fiber_id());
        assert_eq!(metadata.token_id(), scope.token_id());
        assert_eq!(metadata.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(metadata.target(), HostFiberTokenTarget::Instance);
        assert!(metadata.is_active());

        assert_eq!(store.instance(handle, scope).unwrap().label, "section");
        store.instance_mut(handle, scope).unwrap().label = "article";

        let removed = store.remove_instance(handle, scope).unwrap();
        assert_eq!(
            removed,
            TestInstance {
                id: 1,
                label: "article"
            }
        );
        assert!(store.is_empty());
        assert_violation(
            store.instance(handle, scope),
            HostNodeViolation::InvalidHandle,
        );
    }

    #[test]
    fn host_nodes_store_text_instances_behind_state_node_handles() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = text_scope();
        let handle = store.insert_text(
            scope,
            TestTextInstance {
                id: 1,
                text: "hello".to_owned(),
            },
        );

        assert_eq!(store.len(), 1);
        assert_eq!(store.instance_count(), 0);
        assert_eq!(store.text_count(), 1);

        let metadata = store.text_metadata(handle, scope).unwrap();
        assert_eq!(metadata.target(), HostFiberTokenTarget::TextInstance);
        assert!(metadata.is_active());

        store
            .text_mut(handle, scope)
            .unwrap()
            .text
            .push_str(" world");
        let removed = store.remove_text(handle, scope).unwrap();
        assert_eq!(
            removed,
            TestTextInstance {
                id: 1,
                text: "hello world".to_owned()
            }
        );
        assert!(store.is_empty());
    }

    #[test]
    fn host_nodes_apply_instance_property_updates_behind_validated_handles() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "button",
            },
        );
        let update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(10),
            PropsHandle::from_raw(11),
        )
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));

        let applied = store
            .apply_instance_property_update(handle, scope, update)
            .unwrap();

        assert_eq!(applied.sequence(), 0);
        assert_eq!(applied.store_order(), 0);
        assert_eq!(applied.handle(), handle);
        assert_eq!(applied.root_id(), scope.root_id());
        assert_eq!(applied.fiber_id(), scope.fiber_id());
        assert_eq!(applied.token_id(), scope.token_id());
        assert_eq!(applied.phase(), scope.phase());
        assert_eq!(applied.target(), HostFiberTokenTarget::Instance);
        assert_eq!(
            applied.source_sequence(),
            applied.source_currentness().source_sequence()
        );
        assert_update_currentness(
            applied.source_currentness(),
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        );
        assert_eq!(applied.payload_kind(), "property");
        assert_eq!(applied.prop_name(), "testHostProperty");
        assert_eq!(applied.property_name(), "testHostProperty");
        assert_eq!(applied.old_props(), PropsHandle::from_raw(10));
        assert_eq!(applied.new_props(), PropsHandle::from_raw(11));
        assert_eq!(
            applied.execution(),
            HostNodePropertyUpdateExecution::CommitUpdate
        );
        assert_eq!(applied.execution_name(), "commit-update");

        let updates = store.instance_property_updates(handle, scope).unwrap();
        assert_eq!(updates, &[applied]);
        assert_eq!(store.instance_latest_props(handle, scope).unwrap(), None);
        assert_eq!(
            store.instance_latest_props_updates(handle, scope).unwrap(),
            &[]
        );
        assert_eq!(store.instance(handle, scope).unwrap().label, "button");
    }

    #[test]
    fn host_nodes_commit_style_property_update_to_private_store_then_publish_latest_props() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );
        let update = HostNodePropertyUpdate::new(
            "style",
            "style",
            PropsHandle::from_raw(40),
            PropsHandle::from_raw(41),
        )
        .with_payload_kind("style")
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));

        let commit = store
            .commit_instance_property_update_to_private_store(handle, scope, update)
            .unwrap();

        assert!(commit.private_host_store_only());
        assert!(!commit.public_dom_compatibility_claimed());
        let property_update = commit.property_update();
        let latest_props_update = commit.latest_props_update();
        assert_eq!(property_update.sequence(), 0);
        assert_eq!(property_update.store_order(), 0);
        assert_eq!(property_update.payload_kind(), "style");
        assert_eq!(property_update.prop_name(), "style");
        assert_eq!(property_update.old_props(), PropsHandle::from_raw(40));
        assert_eq!(property_update.new_props(), PropsHandle::from_raw(41));
        assert_update_currentness(
            property_update.source_currentness(),
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        );
        assert_eq!(latest_props_update.sequence(), 0);
        assert_eq!(latest_props_update.store_order(), 1);
        assert!(latest_props_update.store_order() > property_update.store_order());
        assert_eq!(
            latest_props_update.source_currentness(),
            property_update.source_currentness()
        );
        assert_eq!(
            latest_props_update.source_sequence(),
            property_update.source_sequence()
        );
        assert_eq!(
            latest_props_update.property_update_sequence(),
            property_update.sequence()
        );
        assert_eq!(
            latest_props_update.property_update_store_order(),
            property_update.store_order()
        );
        assert_eq!(latest_props_update.handle(), handle);
        assert_eq!(latest_props_update.root_id(), scope.root_id());
        assert_eq!(latest_props_update.fiber_id(), scope.fiber_id());
        assert_eq!(latest_props_update.token_id(), scope.token_id());
        assert_eq!(latest_props_update.phase(), scope.phase());
        assert_eq!(latest_props_update.target(), HostFiberTokenTarget::Instance);
        assert_update_currentness(
            latest_props_update.source_currentness(),
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        );
        assert_eq!(latest_props_update.payload_kind(), "style");
        assert_eq!(latest_props_update.prop_name(), "style");
        assert_eq!(latest_props_update.old_props(), PropsHandle::from_raw(40));
        assert_eq!(latest_props_update.previous_latest_props(), None);
        assert_eq!(
            latest_props_update.latest_props(),
            PropsHandle::from_raw(41)
        );
        assert!(!latest_props_update.public_dom_compatibility_claimed());
        assert_eq!(
            store.instance_property_updates(handle, scope).unwrap(),
            &[property_update]
        );
        assert_eq!(
            store.instance_latest_props(handle, scope).unwrap(),
            Some(PropsHandle::from_raw(41))
        );
        assert_eq!(
            store.instance_latest_props_updates(handle, scope).unwrap(),
            &[latest_props_update]
        );
        assert_eq!(store.instance(handle, scope).unwrap().label, "div");
    }

    #[test]
    fn host_nodes_preserve_private_payload_kind_and_reset_execution_evidence() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );
        let update = HostNodePropertyUpdate::new(
            "children",
            "textContent",
            PropsHandle::from_raw(30),
            PropsHandle::from_raw(31),
        )
        .with_payload_kind("text-content")
        .with_execution(HostNodePropertyUpdateExecution::ResetTextContent)
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));

        let applied = store
            .apply_instance_property_update(handle, scope, update)
            .unwrap();

        assert_eq!(applied.sequence(), 0);
        assert_update_currentness(
            applied.source_currentness(),
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        );
        assert_eq!(applied.payload_kind(), "text-content");
        assert_eq!(applied.prop_name(), "children");
        assert_eq!(applied.property_name(), "textContent");
        assert_eq!(
            applied.execution(),
            HostNodePropertyUpdateExecution::ResetTextContent
        );
        assert_eq!(applied.execution_name(), "reset-text-content");
    }

    #[test]
    fn host_nodes_apply_text_updates_behind_validated_handles() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = text_scope();
        let handle = store.insert_text(
            scope,
            TestTextInstance {
                id: 1,
                text: "before".to_owned(),
            },
        );
        let update = HostNodeTextUpdate::new("before", "after").with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::TextInstance),
        );
        assert_eq!(update.old_text(), "before");
        assert_eq!(update.new_text(), "after");

        let applied = store.apply_text_update(handle, scope, update).unwrap();

        assert_eq!(applied.sequence(), 0);
        assert_eq!(applied.handle(), handle);
        assert_eq!(applied.root_id(), scope.root_id());
        assert_eq!(applied.fiber_id(), scope.fiber_id());
        assert_eq!(applied.token_id(), scope.token_id());
        assert_eq!(applied.phase(), scope.phase());
        assert_eq!(applied.target(), HostFiberTokenTarget::TextInstance);
        assert_eq!(
            applied.source_sequence(),
            applied.source_currentness().source_sequence()
        );
        assert_update_currentness(
            applied.source_currentness(),
            handle,
            scope,
            HostFiberTokenTarget::TextInstance,
        );
        assert_eq!(applied.old_text(), "before");
        assert_eq!(applied.new_text(), "after");

        let updates = store.text_updates(handle, scope).unwrap();
        assert_eq!(updates, &[applied]);
        assert_eq!(store.text(handle, scope).unwrap().text, "before");
    }

    #[test]
    fn host_nodes_reject_property_updates_for_stale_or_wrong_targets() {
        let mut store = HostNodeStore::<TestHost>::new();
        let instance_scope = instance_scope();
        let text_scope = text_scope();
        let instance_handle = store.insert_instance(
            instance_scope,
            TestInstance {
                id: 1,
                label: "section",
            },
        );
        let text_handle = store.insert_text(
            text_scope,
            TestTextInstance {
                id: 1,
                text: "child".to_owned(),
            },
        );
        let update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(20),
            PropsHandle::from_raw(21),
        );

        assert_violation(
            store.apply_instance_property_update(text_handle, text_scope, update),
            HostNodeViolation::WrongTarget,
        );
        assert_violation(
            store.apply_text_update(
                instance_handle,
                instance_scope,
                HostNodeTextUpdate::new("before", "after"),
            ),
            HostNodeViolation::WrongTarget,
        );
        store
            .invalidate_instance(instance_handle, instance_scope)
            .unwrap();
        assert_violation(
            store.apply_instance_property_update(instance_handle, instance_scope, update),
            HostNodeViolation::Stale,
        );
    }

    #[test]
    fn host_nodes_reject_update_payloads_after_invalidation_or_removal() {
        let mut store = HostNodeStore::<TestHost>::new();
        let stale_scope = instance_scope();
        let stale_handle = store.insert_instance(
            stale_scope,
            TestInstance {
                id: 1,
                label: "stale",
            },
        );
        let stale_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(50),
            PropsHandle::from_raw(51),
        )
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            stale_handle,
            stale_scope,
            HostFiberTokenTarget::Instance,
        ));

        store
            .invalidate_instance(stale_handle, stale_scope)
            .unwrap();
        assert_violation(
            store.apply_instance_property_update(stale_handle, stale_scope, stale_update),
            HostNodeViolation::Stale,
        );

        let removed_scope = instance_scope();
        let removed_handle = store.insert_instance(
            removed_scope,
            TestInstance {
                id: 2,
                label: "removed",
            },
        );
        let removed_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(52),
            PropsHandle::from_raw(53),
        )
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            removed_handle,
            removed_scope,
            HostFiberTokenTarget::Instance,
        ));

        store
            .remove_instance(removed_handle, removed_scope)
            .unwrap();
        assert_violation(
            store.apply_instance_property_update(removed_handle, removed_scope, removed_update),
            HostNodeViolation::InvalidHandle,
        );
    }

    #[test]
    fn host_nodes_reject_update_payload_currentness_identity_mismatches() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );

        let wrong_handle_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_handle(StateNodeHandle::from_raw(handle.raw() + 1)),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_handle_update),
            HostNodeViolation::InvalidHandle,
        );

        let wrong_target_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_target(HostFiberTokenTarget::TextInstance),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_target_update),
            HostNodeViolation::WrongTarget,
        );

        let wrong_token_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_token_id(token_id(99)),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_token_update),
            HostNodeViolation::WrongToken,
        );

        let wrong_root_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_root_id(root_id(99)),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_root_update),
            HostNodeViolation::WrongRoot,
        );

        let wrong_fiber_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_fiber_id(create_fiber_id(FiberTag::HostComponent)),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_fiber_update),
            HostNodeViolation::WrongFiber,
        );

        let wrong_phase_update = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(60),
            PropsHandle::from_raw(61),
        )
        .with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::Instance)
                .with_phase(HostFiberTokenPhase::Commit),
        );
        assert_violation(
            store.apply_instance_property_update(handle, scope, wrong_phase_update),
            HostNodeViolation::WrongPhase,
        );
        assert_eq!(store.instance_property_updates(handle, scope).unwrap(), &[]);
    }

    #[test]
    fn host_nodes_reject_missing_update_payload_currentness() {
        let mut store = HostNodeStore::<TestHost>::new();
        let instance_scope = instance_scope();
        let instance_handle = store.insert_instance(
            instance_scope,
            TestInstance {
                id: 1,
                label: "section",
            },
        );
        let missing_property_currentness = HostNodePropertyUpdate::new(
            "testHostProperty",
            "testHostProperty",
            PropsHandle::from_raw(70),
            PropsHandle::from_raw(71),
        )
        .without_currentness_for_canary();

        assert_violation(
            store.apply_instance_property_update(
                instance_handle,
                instance_scope,
                missing_property_currentness,
            ),
            HostNodeViolation::MissingCurrentness,
        );

        let text_scope = text_scope();
        let text_handle = store.insert_text(
            text_scope,
            TestTextInstance {
                id: 1,
                text: "before".to_owned(),
            },
        );
        assert_violation(
            store.apply_text_update(
                text_handle,
                text_scope,
                HostNodeTextUpdate::new("before", "after").without_currentness_for_canary(),
            ),
            HostNodeViolation::MissingCurrentness,
        );
    }

    #[test]
    fn host_nodes_reject_sequence_only_update_payload_currentness() {
        let mut store = HostNodeStore::<TestHost>::new();
        let instance_scope = instance_scope();
        let instance_handle = store.insert_instance(
            instance_scope,
            TestInstance {
                id: 1,
                label: "section",
            },
        );

        assert_violation(
            store.apply_instance_property_update(
                instance_handle,
                instance_scope,
                HostNodePropertyUpdate::new(
                    "testHostProperty",
                    "testHostProperty",
                    PropsHandle::from_raw(72),
                    PropsHandle::from_raw(73),
                ),
            ),
            HostNodeViolation::MissingCurrentness,
        );
        assert_eq!(
            store
                .instance_property_updates(instance_handle, instance_scope)
                .unwrap(),
            &[]
        );

        let text_scope = text_scope();
        let text_handle = store.insert_text(
            text_scope,
            TestTextInstance {
                id: 1,
                text: "before".to_owned(),
            },
        );
        assert_violation(
            store.apply_text_update(
                text_handle,
                text_scope,
                HostNodeTextUpdate::new("before", "after"),
            ),
            HostNodeViolation::MissingCurrentness,
        );
        assert_eq!(store.text_updates(text_handle, text_scope).unwrap(), &[]);
    }

    #[test]
    fn host_nodes_reject_replayed_property_update_after_latest_props_advanced() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );
        let update = HostNodePropertyUpdate::new(
            "style",
            "style",
            PropsHandle::from_raw(80),
            PropsHandle::from_raw(81),
        )
        .with_payload_kind("style")
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));

        store
            .commit_instance_property_update_to_private_store(handle, scope, update)
            .unwrap();

        assert_violation(
            store.commit_instance_property_update_to_private_store(handle, scope, update),
            HostNodeViolation::StaleCurrentness,
        );

        let stale_latest_props_update = HostNodePropertyUpdate::new(
            "style",
            "style",
            PropsHandle::from_raw(80),
            PropsHandle::from_raw(82),
        )
        .with_payload_kind("style")
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));
        assert_violation(
            store.commit_instance_property_update_to_private_store(
                handle,
                scope,
                stale_latest_props_update,
            ),
            HostNodeViolation::StaleCurrentness,
        );

        let current_update = HostNodePropertyUpdate::new(
            "style",
            "style",
            PropsHandle::from_raw(81),
            PropsHandle::from_raw(82),
        )
        .with_payload_kind("style")
        .with_currentness(HostNodeUpdateCurrentness::for_scope(
            handle,
            scope,
            HostFiberTokenTarget::Instance,
        ));
        let current_commit = store
            .commit_instance_property_update_to_private_store(handle, scope, current_update)
            .unwrap();
        assert_eq!(
            current_commit.latest_props_update().previous_latest_props(),
            Some(PropsHandle::from_raw(81))
        );
        assert_eq!(
            current_commit.latest_props_update().latest_props(),
            PropsHandle::from_raw(82)
        );
    }

    #[test]
    fn host_nodes_reject_replayed_text_update_after_text_currentness_advanced() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = text_scope();
        let handle = store.insert_text(
            scope,
            TestTextInstance {
                id: 1,
                text: "before".to_owned(),
            },
        );
        let update = HostNodeTextUpdate::new("before", "after").with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::TextInstance),
        );

        store
            .apply_text_update(handle, scope, update.clone())
            .unwrap();

        assert_violation(
            store.apply_text_update(handle, scope, update),
            HostNodeViolation::StaleCurrentness,
        );

        let stale_text_update = HostNodeTextUpdate::new("before", "final").with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::TextInstance),
        );
        assert_violation(
            store.apply_text_update(handle, scope, stale_text_update),
            HostNodeViolation::StaleCurrentness,
        );

        let current_text_update = HostNodeTextUpdate::new("after", "final").with_currentness(
            HostNodeUpdateCurrentness::for_scope(handle, scope, HostFiberTokenTarget::TextInstance),
        );
        let applied = store
            .apply_text_update(handle, scope, current_text_update)
            .unwrap();
        assert_eq!(applied.sequence(), 1);
        assert_eq!(applied.old_text(), "after");
        assert_eq!(applied.new_text(), "final");
    }

    #[test]
    fn host_nodes_private_update_currentness_never_claims_public_dom_compatibility() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );
        let commit = store
            .commit_instance_property_update_to_private_store(
                handle,
                scope,
                HostNodePropertyUpdate::new(
                    "style",
                    "style",
                    PropsHandle::from_raw(90),
                    PropsHandle::from_raw(91),
                )
                .with_payload_kind("style")
                .with_currentness(HostNodeUpdateCurrentness::for_scope(
                    handle,
                    scope,
                    HostFiberTokenTarget::Instance,
                )),
            )
            .unwrap();

        assert!(!commit.public_dom_compatibility_claimed());
        assert!(
            !commit
                .latest_props_update()
                .public_dom_compatibility_claimed()
        );
        assert!(
            !commit
                .property_update()
                .source_currentness()
                .public_dom_compatibility_claimed()
        );
        assert!(
            !commit
                .latest_props_update()
                .source_currentness()
                .public_dom_compatibility_claimed()
        );
    }

    #[test]
    fn host_nodes_reject_missing_and_none_handles() {
        let store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();

        assert_violation(
            store.instance(StateNodeHandle::NONE, scope),
            HostNodeViolation::InvalidHandle,
        );
        assert_violation(
            store.instance(StateNodeHandle::from_raw(99), scope),
            HostNodeViolation::InvalidHandle,
        );
    }

    #[test]
    fn host_nodes_validate_root_fiber_and_token_before_lookup() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "div",
            },
        );
        let wrong_root = HostNodeScope::new(
            root_id(2),
            scope.fiber_id(),
            scope.token_id(),
            HostFiberTokenPhase::Creation,
        );
        let wrong_fiber = HostNodeScope::new(
            scope.root_id(),
            create_fiber_id(FiberTag::HostComponent),
            scope.token_id(),
            HostFiberTokenPhase::Creation,
        );
        let wrong_token = HostNodeScope::new(
            scope.root_id(),
            scope.fiber_id(),
            token_id(99),
            HostFiberTokenPhase::Creation,
        );

        assert_violation(
            store.instance(handle, wrong_root),
            HostNodeViolation::WrongRoot,
        );
        assert_violation(
            store.instance(handle, wrong_fiber),
            HostNodeViolation::WrongFiber,
        );
        assert_violation(
            store.instance(handle, wrong_token),
            HostNodeViolation::WrongToken,
        );
        assert_eq!(store.instance(handle, scope).unwrap().label, "div");
    }

    #[test]
    fn host_nodes_validate_phase_and_target_before_lookup() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "button",
            },
        );
        let wrong_phase = HostNodeScope::new(
            scope.root_id(),
            scope.fiber_id(),
            scope.token_id(),
            HostFiberTokenPhase::Commit,
        );

        assert_violation(
            store.instance(handle, wrong_phase),
            HostNodeViolation::WrongPhase,
        );
        assert_violation(store.text(handle, scope), HostNodeViolation::WrongTarget);
        assert_eq!(store.instance(handle, scope).unwrap().label, "button");
    }

    #[test]
    fn host_nodes_invalidate_instance_records_without_returning_values() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = instance_scope();
        let handle = store.insert_instance(
            scope,
            TestInstance {
                id: 1,
                label: "main",
            },
        );
        assert_eq!(store.len(), 1);
        assert_eq!(store.active_len(), 1);
        assert_eq!(store.active_instance_count(), 1);
        assert_eq!(store.active_text_count(), 0);
        let wrong_phase = HostNodeScope::new(
            scope.root_id(),
            scope.fiber_id(),
            scope.token_id(),
            HostFiberTokenPhase::Deletion,
        );

        assert_violation(
            store.invalidate_instance(handle, wrong_phase),
            HostNodeViolation::WrongPhase,
        );
        assert!(store.instance_metadata(handle, scope).unwrap().is_active());

        store.invalidate_instance(handle, scope).unwrap();
        let metadata = store.instance_metadata(handle, scope).unwrap();
        assert!(!metadata.is_active());
        assert_eq!(store.len(), 1);
        assert_eq!(store.instance_count(), 1);
        assert_eq!(store.active_len(), 0);
        assert_eq!(store.active_instance_count(), 0);
        assert_eq!(store.active_text_count(), 0);
        assert_violation(store.instance(handle, scope), HostNodeViolation::Stale);
    }

    #[test]
    fn host_nodes_invalidate_text_records_with_target_validation() {
        let mut store = HostNodeStore::<TestHost>::new();
        let scope = text_scope();
        let handle = store.insert_text(
            scope,
            TestTextInstance {
                id: 1,
                text: "pending".to_owned(),
            },
        );
        assert_eq!(store.len(), 1);
        assert_eq!(store.active_len(), 1);
        assert_eq!(store.active_instance_count(), 0);
        assert_eq!(store.active_text_count(), 1);

        assert_violation(
            store.invalidate_instance(handle, scope),
            HostNodeViolation::WrongTarget,
        );
        assert!(store.text_metadata(handle, scope).unwrap().is_active());

        store.invalidate_text(handle, scope).unwrap();
        assert!(!store.text_metadata(handle, scope).unwrap().is_active());
        assert_eq!(store.len(), 1);
        assert_eq!(store.text_count(), 1);
        assert_eq!(store.active_len(), 0);
        assert_eq!(store.active_instance_count(), 0);
        assert_eq!(store.active_text_count(), 0);
        assert_violation(store.text(handle, scope), HostNodeViolation::Stale);
    }

    #[test]
    fn host_nodes_invalidate_deleted_records_by_root_and_fiber_identity() {
        let mut store = HostNodeStore::<TestHost>::new();
        let instance_scope = instance_scope();
        let text_scope = text_scope();
        let instance_handle = store.insert_instance(
            instance_scope,
            TestInstance {
                id: 1,
                label: "article",
            },
        );
        let text_handle = store.insert_text(
            text_scope,
            TestTextInstance {
                id: 2,
                text: "deleted".to_owned(),
            },
        );

        assert_violation(
            store.invalidate_deleted_instance(
                instance_handle,
                root_id(2),
                instance_scope.fiber_id(),
            ),
            HostNodeViolation::WrongRoot,
        );
        assert_violation(
            store.invalidate_deleted_instance(
                instance_handle,
                instance_scope.root_id(),
                text_scope.fiber_id(),
            ),
            HostNodeViolation::WrongFiber,
        );
        assert_violation(
            store.invalidate_deleted_text(
                instance_handle,
                instance_scope.root_id(),
                instance_scope.fiber_id(),
            ),
            HostNodeViolation::WrongTarget,
        );

        let previous_instance = store
            .invalidate_deleted_instance(
                instance_handle,
                instance_scope.root_id(),
                instance_scope.fiber_id(),
            )
            .unwrap();
        assert_eq!(previous_instance.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(previous_instance.token_id(), instance_scope.token_id());
        assert!(previous_instance.is_active());
        assert!(
            !store
                .instance_metadata(instance_handle, instance_scope)
                .unwrap()
                .is_active()
        );
        assert_violation(
            store.instance(instance_handle, instance_scope),
            HostNodeViolation::Stale,
        );
        assert_violation(
            store.invalidate_deleted_instance(
                instance_handle,
                instance_scope.root_id(),
                instance_scope.fiber_id(),
            ),
            HostNodeViolation::Stale,
        );

        let previous_text = store
            .invalidate_deleted_text(text_handle, text_scope.root_id(), text_scope.fiber_id())
            .unwrap();
        assert_eq!(previous_text.phase(), HostFiberTokenPhase::Creation);
        assert_eq!(previous_text.token_id(), text_scope.token_id());
        assert!(previous_text.is_active());
        assert!(
            !store
                .text_metadata(text_handle, text_scope)
                .unwrap()
                .is_active()
        );
        assert_violation(
            store.text(text_handle, text_scope),
            HostNodeViolation::Stale,
        );
        assert_eq!(store.active_len(), 0);
    }
}
