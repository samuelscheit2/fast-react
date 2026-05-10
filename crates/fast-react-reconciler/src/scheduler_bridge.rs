//! Internal reconciler scheduler bridge records.
//!
//! This is not the public `scheduler` package implementation. It is a narrow
//! deterministic model of the callback identity, priority, cancellation, and
//! root-schedule microtask requests that the reconciler root scheduler owns.

use crate::{FiberRootId, RootCallbackPriority, RootSchedulerCallbackHandle};

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
    next_callback_handle: u64,
    next_microtask_handle: u64,
    callback_requests: Vec<SchedulerCallbackRequest>,
    cancellation_records: Vec<SchedulerCancellationRecord>,
    microtask_requests: Vec<SchedulerMicrotaskRequest>,
}

impl SchedulerBridge {
    #[must_use]
    pub const fn new() -> Self {
        Self {
            next_callback_handle: 1,
            next_microtask_handle: 1,
            callback_requests: Vec::new(),
            cancellation_records: Vec::new(),
            microtask_requests: Vec::new(),
        }
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

    pub fn cancel_callback(
        &mut self,
        node: RootSchedulerCallbackHandle,
    ) -> Option<SchedulerCancellationRecord> {
        if node.is_none() {
            return None;
        }

        let record = SchedulerCancellationRecord { node };
        self.cancellation_records.push(record);
        Some(record)
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
    use fast_react_core::Lane;

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
