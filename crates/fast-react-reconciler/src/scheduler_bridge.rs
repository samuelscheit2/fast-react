//! Internal reconciler scheduler bridge records.
//!
//! This is not the public `scheduler` package implementation. It is a narrow
//! deterministic model of the callback identity, priority, cancellation, and
//! root-schedule microtask requests that the reconciler root scheduler owns.

use crate::{FiberRootId, RootCallbackPriority, RootSchedulerCallbackHandle};

pub const FAKE_ACT_CALLBACK_NODE: RootSchedulerCallbackHandle =
    RootSchedulerCallbackHandle::from_raw(u64::MAX);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SchedulerPriority {
    Immediate,
    UserBlocking,
    Normal,
    Low,
    Idle,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SchedulerMicrotaskKind {
    RootSchedule,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SchedulerActQueueTaskKind {
    RootSchedule,
    RenderCallback,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[allow(dead_code)]
pub(crate) enum SchedulerActScopeBoundaryKind {
    Enter,
    Exit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SchedulerActScopeBoundaryRecord {
    kind: SchedulerActScopeBoundaryKind,
    depth_before: usize,
    depth_after: usize,
    nested: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum SchedulerActContinuationStatus {
    NoContinuation,
    PendingContinuation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SchedulerActContinuationRecord {
    root: FiberRootId,
    sync_flush_order: usize,
    flushed_lanes: fast_react_core::Lanes,
    remaining_lanes: fast_react_core::Lanes,
    continuation_lanes: fast_react_core::Lanes,
    act_scope_depth: usize,
    nested_act_scope: bool,
    status: SchedulerActContinuationStatus,
}

#[allow(dead_code)]
impl SchedulerActContinuationRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn sync_flush_order(self) -> usize {
        self.sync_flush_order
    }

    #[must_use]
    pub(crate) const fn flushed_lanes(self) -> fast_react_core::Lanes {
        self.flushed_lanes
    }

    #[must_use]
    pub(crate) const fn remaining_lanes(self) -> fast_react_core::Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub(crate) const fn continuation_lanes(self) -> fast_react_core::Lanes {
        self.continuation_lanes
    }

    #[must_use]
    pub(crate) const fn act_scope_depth(self) -> usize {
        self.act_scope_depth
    }

    #[must_use]
    pub(crate) const fn nested_act_scope(self) -> bool {
        self.nested_act_scope
    }

    #[must_use]
    pub(crate) const fn status(self) -> SchedulerActContinuationStatus {
        self.status
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerActQueueRequest {
    kind: SchedulerActQueueTaskKind,
    node: RootSchedulerCallbackHandle,
    root: Option<FiberRootId>,
    scheduler_priority: Option<SchedulerPriority>,
    callback_priority: RootCallbackPriority,
}

impl SchedulerActQueueRequest {
    #[must_use]
    pub const fn kind(self) -> SchedulerActQueueTaskKind {
        self.kind
    }

    #[must_use]
    pub const fn node(self) -> RootSchedulerCallbackHandle {
        self.node
    }

    #[must_use]
    pub const fn root(self) -> Option<FiberRootId> {
        self.root
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> Option<SchedulerPriority> {
        self.scheduler_priority
    }

    #[must_use]
    pub const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct SchedulerMicrotaskHandle(u64);

impl SchedulerMicrotaskHandle {
    pub const NONE: Self = Self(0);

    #[must_use]
    pub const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub const fn is_none(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_some(self) -> bool {
        self.0 != 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerMicrotaskRequest {
    handle: SchedulerMicrotaskHandle,
    kind: SchedulerMicrotaskKind,
}

impl SchedulerMicrotaskRequest {
    #[must_use]
    pub const fn handle(self) -> SchedulerMicrotaskHandle {
        self.handle
    }

    #[must_use]
    pub const fn kind(self) -> SchedulerMicrotaskKind {
        self.kind
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerCallbackRequest {
    node: RootSchedulerCallbackHandle,
    root: FiberRootId,
    scheduler_priority: SchedulerPriority,
    callback_priority: RootCallbackPriority,
}

impl SchedulerCallbackRequest {
    #[must_use]
    pub const fn node(self) -> RootSchedulerCallbackHandle {
        self.node
    }

    #[must_use]
    pub const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub const fn scheduler_priority(self) -> SchedulerPriority {
        self.scheduler_priority
    }

    #[must_use]
    pub const fn callback_priority(self) -> RootCallbackPriority {
        self.callback_priority
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SchedulerCancellationRecord {
    node: RootSchedulerCallbackHandle,
}

impl SchedulerCancellationRecord {
    #[must_use]
    pub const fn node(self) -> RootSchedulerCallbackHandle {
        self.node
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SchedulerBridge {
    act_queue_active: bool,
    act_scope_depth: usize,
    next_callback_handle: u64,
    next_microtask_handle: u64,
    act_scope_boundary_records: Vec<SchedulerActScopeBoundaryRecord>,
    act_continuation_records: Vec<SchedulerActContinuationRecord>,
    act_queue_requests: Vec<SchedulerActQueueRequest>,
    callback_requests: Vec<SchedulerCallbackRequest>,
    cancellation_records: Vec<SchedulerCancellationRecord>,
    microtask_requests: Vec<SchedulerMicrotaskRequest>,
}

impl SchedulerBridge {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            act_queue_active: false,
            act_scope_depth: 0,
            next_callback_handle: 1,
            next_microtask_handle: 1,
            act_scope_boundary_records: Vec::new(),
            act_continuation_records: Vec::new(),
            act_queue_requests: Vec::new(),
            callback_requests: Vec::new(),
            cancellation_records: Vec::new(),
            microtask_requests: Vec::new(),
        }
    }

    #[must_use]
    pub const fn fake_act_callback_node() -> RootSchedulerCallbackHandle {
        FAKE_ACT_CALLBACK_NODE
    }

    #[must_use]
    pub const fn is_fake_act_callback_node(node: RootSchedulerCallbackHandle) -> bool {
        node.raw() == FAKE_ACT_CALLBACK_NODE.raw()
    }

    #[must_use]
    pub const fn is_act_queue_active(&self) -> bool {
        self.act_queue_active
    }

    pub fn set_act_queue_active(&mut self, active: bool) {
        self.act_queue_active = active;
        self.act_scope_depth = usize::from(active);
    }

    #[allow(dead_code)]
    pub(crate) fn enter_act_scope(&mut self) -> SchedulerActScopeBoundaryRecord {
        let depth_before = self.act_scope_depth;
        let depth_after = depth_before + 1;
        self.act_scope_depth = depth_after;
        self.act_queue_active = true;

        let record = SchedulerActScopeBoundaryRecord {
            kind: SchedulerActScopeBoundaryKind::Enter,
            depth_before,
            depth_after,
            nested: depth_before > 0,
        };
        self.act_scope_boundary_records.push(record);
        record
    }

    #[allow(dead_code)]
    pub(crate) fn exit_act_scope(&mut self) -> SchedulerActScopeBoundaryRecord {
        let depth_before = self.act_scope_depth;
        let depth_after = depth_before.saturating_sub(1);
        self.act_scope_depth = depth_after;
        self.act_queue_active = depth_after > 0;

        let record = SchedulerActScopeBoundaryRecord {
            kind: SchedulerActScopeBoundaryKind::Exit,
            depth_before,
            depth_after,
            nested: depth_before > 1,
        };
        self.act_scope_boundary_records.push(record);
        record
    }

    pub(crate) fn record_sync_flush_act_continuation(
        &mut self,
        root: FiberRootId,
        sync_flush_order: usize,
        flushed_lanes: fast_react_core::Lanes,
        remaining_lanes: fast_react_core::Lanes,
        continuation_lanes: fast_react_core::Lanes,
    ) -> Option<SchedulerActContinuationRecord> {
        if !self.act_queue_active {
            return None;
        }

        let record = SchedulerActContinuationRecord {
            root,
            sync_flush_order,
            flushed_lanes,
            remaining_lanes,
            continuation_lanes,
            act_scope_depth: self.act_scope_depth,
            nested_act_scope: self.act_scope_depth > 1,
            status: if continuation_lanes.is_non_empty() {
                SchedulerActContinuationStatus::PendingContinuation
            } else {
                SchedulerActContinuationStatus::NoContinuation
            },
        };
        self.act_continuation_records.push(record);
        Some(record)
    }

    pub fn request_microtask(&mut self, kind: SchedulerMicrotaskKind) -> SchedulerMicrotaskRequest {
        let request = SchedulerMicrotaskRequest {
            handle: SchedulerMicrotaskHandle::from_raw(self.next_microtask_handle),
            kind,
        };
        self.next_microtask_handle += 1;
        self.microtask_requests.push(request);
        request
    }

    pub fn request_act_root_schedule_task(&mut self) -> SchedulerActQueueRequest {
        let request = SchedulerActQueueRequest {
            kind: SchedulerActQueueTaskKind::RootSchedule,
            node: RootSchedulerCallbackHandle::NONE,
            root: None,
            scheduler_priority: None,
            callback_priority: RootCallbackPriority::NO,
        };
        self.act_queue_requests.push(request);
        request
    }

    pub fn schedule_callback(
        &mut self,
        root: FiberRootId,
        scheduler_priority: SchedulerPriority,
        callback_priority: RootCallbackPriority,
    ) -> SchedulerCallbackRequest {
        let request = SchedulerCallbackRequest {
            node: RootSchedulerCallbackHandle::from_raw(self.next_callback_handle),
            root,
            scheduler_priority,
            callback_priority,
        };
        self.next_callback_handle += 1;
        self.callback_requests.push(request);
        request
    }

    pub fn schedule_act_callback(
        &mut self,
        root: FiberRootId,
        scheduler_priority: SchedulerPriority,
        callback_priority: RootCallbackPriority,
    ) -> SchedulerActQueueRequest {
        let request = SchedulerActQueueRequest {
            kind: SchedulerActQueueTaskKind::RenderCallback,
            node: FAKE_ACT_CALLBACK_NODE,
            root: Some(root),
            scheduler_priority: Some(scheduler_priority),
            callback_priority,
        };
        self.act_queue_requests.push(request);
        request
    }

    pub fn cancel_callback(
        &mut self,
        node: RootSchedulerCallbackHandle,
    ) -> Option<SchedulerCancellationRecord> {
        if node.is_none() || Self::is_fake_act_callback_node(node) {
            return None;
        }

        let record = SchedulerCancellationRecord { node };
        self.cancellation_records.push(record);
        Some(record)
    }

    #[must_use]
    pub fn act_queue_requests(&self) -> &[SchedulerActQueueRequest] {
        &self.act_queue_requests
    }

    #[must_use]
    #[cfg(test)]
    pub(crate) fn act_scope_boundary_records(&self) -> &[SchedulerActScopeBoundaryRecord] {
        &self.act_scope_boundary_records
    }

    #[must_use]
    #[cfg(test)]
    pub(crate) fn act_continuation_records(&self) -> &[SchedulerActContinuationRecord] {
        &self.act_continuation_records
    }

    #[must_use]
    pub fn callback_requests(&self) -> &[SchedulerCallbackRequest] {
        &self.callback_requests
    }

    #[must_use]
    pub fn cancellation_records(&self) -> &[SchedulerCancellationRecord] {
        &self.cancellation_records
    }

    #[must_use]
    pub fn microtask_requests(&self) -> &[SchedulerMicrotaskRequest] {
        &self.microtask_requests
    }
}

impl Default for SchedulerBridge {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::RootCallbackPriority;
    use fast_react_core::{Lane, Lanes};

    fn root_id(raw: u64) -> FiberRootId {
        FiberRootId::new(raw).unwrap()
    }

    #[test]
    fn scheduler_bridge_records_microtask_requests() {
        let mut bridge = SchedulerBridge::new();

        let first = bridge.request_microtask(SchedulerMicrotaskKind::RootSchedule);
        let second = bridge.request_microtask(SchedulerMicrotaskKind::RootSchedule);

        assert_eq!(first.handle().raw(), 1);
        assert_eq!(second.handle().raw(), 2);
        assert_eq!(
            bridge.microtask_requests(),
            &[
                SchedulerMicrotaskRequest {
                    handle: SchedulerMicrotaskHandle::from_raw(1),
                    kind: SchedulerMicrotaskKind::RootSchedule,
                },
                SchedulerMicrotaskRequest {
                    handle: SchedulerMicrotaskHandle::from_raw(2),
                    kind: SchedulerMicrotaskKind::RootSchedule,
                },
            ]
        );
    }

    #[test]
    fn scheduler_bridge_records_act_root_schedule_tasks_without_microtask_handles() {
        let mut bridge = SchedulerBridge::new();

        bridge.set_act_queue_active(true);
        let request = bridge.request_act_root_schedule_task();

        assert!(bridge.is_act_queue_active());
        assert_eq!(bridge.act_scope_depth, 1);
        assert_eq!(request.kind(), SchedulerActQueueTaskKind::RootSchedule);
        assert_eq!(request.node(), RootSchedulerCallbackHandle::NONE);
        assert_eq!(request.root(), None);
        assert_eq!(bridge.act_queue_requests(), &[request]);
        assert!(bridge.microtask_requests().is_empty());
    }

    #[test]
    fn scheduler_bridge_records_callback_identity_and_priority() {
        let mut bridge = SchedulerBridge::new();
        let root = root_id(1);

        let request = bridge.schedule_callback(
            root,
            SchedulerPriority::Normal,
            RootCallbackPriority::new(Lane::DEFAULT),
        );

        assert_eq!(request.node(), RootSchedulerCallbackHandle::from_raw(1));
        assert_eq!(request.root(), root);
        assert_eq!(request.scheduler_priority(), SchedulerPriority::Normal);
        assert_eq!(bridge.callback_requests(), &[request]);
        assert!(bridge.act_queue_requests().is_empty());
    }

    #[test]
    fn scheduler_bridge_records_act_callback_with_fake_node() {
        let mut bridge = SchedulerBridge::new();
        let root = root_id(1);

        bridge.set_act_queue_active(true);
        let request = bridge.schedule_act_callback(
            root,
            SchedulerPriority::Normal,
            RootCallbackPriority::new(Lane::DEFAULT),
        );

        assert_eq!(request.kind(), SchedulerActQueueTaskKind::RenderCallback);
        assert_eq!(request.node(), SchedulerBridge::fake_act_callback_node());
        assert_eq!(request.root(), Some(root));
        assert_eq!(
            request.scheduler_priority(),
            Some(SchedulerPriority::Normal)
        );
        assert_eq!(
            request.callback_priority(),
            RootCallbackPriority::new(Lane::DEFAULT)
        );
        assert_eq!(bridge.act_queue_requests(), &[request]);
        assert!(bridge.callback_requests().is_empty());
    }

    #[test]
    fn scheduler_bridge_records_nested_act_scope_boundaries() {
        let mut bridge = SchedulerBridge::new();

        let enter_outer = bridge.enter_act_scope();
        let enter_nested = bridge.enter_act_scope();
        let exit_nested = bridge.exit_act_scope();
        let exit_outer = bridge.exit_act_scope();

        assert_eq!(enter_outer.kind, SchedulerActScopeBoundaryKind::Enter);
        assert_eq!(enter_outer.depth_before, 0);
        assert_eq!(enter_outer.depth_after, 1);
        assert!(!enter_outer.nested);
        assert_eq!(enter_nested.kind, SchedulerActScopeBoundaryKind::Enter);
        assert_eq!(enter_nested.depth_before, 1);
        assert_eq!(enter_nested.depth_after, 2);
        assert!(enter_nested.nested);
        assert_eq!(exit_nested.kind, SchedulerActScopeBoundaryKind::Exit);
        assert_eq!(exit_nested.depth_before, 2);
        assert_eq!(exit_nested.depth_after, 1);
        assert!(exit_nested.nested);
        assert_eq!(exit_outer.kind, SchedulerActScopeBoundaryKind::Exit);
        assert_eq!(exit_outer.depth_before, 1);
        assert_eq!(exit_outer.depth_after, 0);
        assert!(!exit_outer.nested);
        assert!(!bridge.is_act_queue_active());
        assert_eq!(bridge.act_scope_depth, 0);
        assert_eq!(
            bridge.act_scope_boundary_records(),
            &[enter_outer, enter_nested, exit_nested, exit_outer]
        );
    }

    #[test]
    fn scheduler_bridge_records_act_continuation_only_while_active() {
        let mut bridge = SchedulerBridge::new();
        let root = root_id(1);

        assert_eq!(
            bridge.record_sync_flush_act_continuation(
                root,
                0,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            ),
            None
        );

        bridge.enter_act_scope();
        bridge.enter_act_scope();
        let record = bridge
            .record_sync_flush_act_continuation(
                root,
                2,
                Lanes::SYNC,
                Lanes::DEFAULT,
                Lanes::DEFAULT,
            )
            .unwrap();

        assert_eq!(record.root(), root);
        assert_eq!(record.sync_flush_order(), 2);
        assert_eq!(record.flushed_lanes(), Lanes::SYNC);
        assert_eq!(record.remaining_lanes(), Lanes::DEFAULT);
        assert_eq!(record.continuation_lanes(), Lanes::DEFAULT);
        assert_eq!(record.act_scope_depth(), 2);
        assert!(record.nested_act_scope());
        assert_eq!(
            record.status(),
            SchedulerActContinuationStatus::PendingContinuation
        );
        assert_eq!(bridge.act_continuation_records(), &[record]);
    }

    #[test]
    fn scheduler_bridge_ignores_empty_cancellation_nodes() {
        let mut bridge = SchedulerBridge::new();

        assert_eq!(
            bridge.cancel_callback(RootSchedulerCallbackHandle::NONE),
            None
        );
        assert!(bridge.cancellation_records().is_empty());
    }

    #[test]
    fn scheduler_bridge_ignores_fake_act_callback_cancellation() {
        let mut bridge = SchedulerBridge::new();

        assert_eq!(
            bridge.cancel_callback(SchedulerBridge::fake_act_callback_node()),
            None
        );
        assert!(bridge.cancellation_records().is_empty());
    }

    #[test]
    fn scheduler_bridge_records_callback_cancellation() {
        let mut bridge = SchedulerBridge::new();
        let root = root_id(1);
        let request = bridge.schedule_callback(
            root,
            SchedulerPriority::Idle,
            RootCallbackPriority::new(Lane::IDLE),
        );

        let cancellation = bridge.cancel_callback(request.node()).unwrap();

        assert_eq!(cancellation.node(), request.node());
        assert_eq!(bridge.cancellation_records(), &[cancellation]);
    }
}
