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

use fast_react_core::{FiberId, StateNodeHandle};
use fast_react_host_config::{HostFiberTokenPhase, HostFiberTokenTarget, HostTypes};

use crate::{FiberRootId, HostFiberTokenId};

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
pub(crate) enum HostNodeViolation {
    InvalidHandle,
    Stale,
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
}

impl<H: HostTypes> HostNodeRecord<H> {
    const fn metadata(&self) -> &HostNodeMetadata {
        &self.metadata
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

        assert_violation(
            store.invalidate_instance(handle, scope),
            HostNodeViolation::WrongTarget,
        );
        assert!(store.text_metadata(handle, scope).unwrap().is_active());

        store.invalidate_text(handle, scope).unwrap();
        assert!(!store.text_metadata(handle, scope).unwrap().is_active());
        assert_violation(store.text(handle, scope), HostNodeViolation::Stale);
    }
}
