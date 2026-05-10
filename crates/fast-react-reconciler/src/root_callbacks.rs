//! Deterministic HostRoot update callback records.
//!
//! These records are a data-only handoff for a future commit layout phase.
//! They never invoke callback handles and do not model root error callbacks.

use fast_react_core::UpdateQueueHandle;

use crate::{RootUpdateCallbackHandle, UpdateId};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RootUpdateCallbackVisibility {
    Visible,
    Hidden,
    DeferredHidden,
}

impl RootUpdateCallbackVisibility {
    #[must_use]
    pub const fn is_visible(self) -> bool {
        matches!(self, Self::Visible)
    }

    #[must_use]
    pub const fn is_hidden(self) -> bool {
        matches!(self, Self::Hidden | Self::DeferredHidden)
    }

    #[must_use]
    pub const fn is_deferred(self) -> bool {
        matches!(self, Self::DeferredHidden)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RootUpdateCallbackRecord {
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    sequence: usize,
    visibility: RootUpdateCallbackVisibility,
}

impl RootUpdateCallbackRecord {
    #[must_use]
    pub(crate) const fn new(
        queue: UpdateQueueHandle,
        update: UpdateId,
        callback: RootUpdateCallbackHandle,
        sequence: usize,
        visibility: RootUpdateCallbackVisibility,
    ) -> Self {
        Self {
            queue,
            update,
            callback,
            sequence,
            visibility,
        }
    }

    #[must_use]
    pub const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn sequence(self) -> usize {
        self.sequence
    }

    #[must_use]
    pub const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.visibility
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootUpdateCallbackSnapshot {
    queue: UpdateQueueHandle,
    visible: Vec<RootUpdateCallbackRecord>,
    hidden: Vec<RootUpdateCallbackRecord>,
    deferred_hidden: Vec<RootUpdateCallbackRecord>,
}

impl RootUpdateCallbackSnapshot {
    #[must_use]
    pub(crate) fn from_parts(
        queue: UpdateQueueHandle,
        visible: Vec<RootUpdateCallbackRecord>,
        hidden: Vec<RootUpdateCallbackRecord>,
        deferred_hidden: Vec<RootUpdateCallbackRecord>,
    ) -> Self {
        Self {
            queue,
            visible,
            hidden,
            deferred_hidden,
        }
    }

    #[must_use]
    pub const fn queue(&self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub fn visible(&self) -> &[RootUpdateCallbackRecord] {
        &self.visible
    }

    #[must_use]
    pub fn hidden(&self) -> &[RootUpdateCallbackRecord] {
        &self.hidden
    }

    #[must_use]
    pub fn deferred_hidden(&self) -> &[RootUpdateCallbackRecord] {
        &self.deferred_hidden
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.visible.is_empty() && self.hidden.is_empty() && self.deferred_hidden.is_empty()
    }
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub(crate) struct RootUpdateCallbackInvocationGateSnapshot {
    records: Vec<RootUpdateCallbackInvocationGateRecord>,
    hidden_record_count: usize,
    deferred_hidden_record_count: usize,
}

#[allow(
    dead_code,
    reason = "crate-private root callback invocation metadata is reserved for future commit workers"
)]
impl RootUpdateCallbackInvocationGateSnapshot {
    #[must_use]
    pub(crate) fn records(&self) -> &[RootUpdateCallbackInvocationGateRecord] {
        &self.records
    }

    #[must_use]
    pub(crate) fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    #[must_use]
    pub(crate) fn len(&self) -> usize {
        self.records.len()
    }

    #[must_use]
    pub(crate) const fn hidden_record_count(&self) -> usize {
        self.hidden_record_count
    }

    #[must_use]
    pub(crate) const fn deferred_hidden_record_count(&self) -> usize {
        self.deferred_hidden_record_count
    }

    #[must_use]
    pub(crate) const fn user_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn hidden_callbacks_invoked(&self) -> bool {
        false
    }

    #[must_use]
    pub(crate) const fn public_root_callback_behavior_exposed(&self) -> bool {
        false
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct RootUpdateCallbackInvocationGateRecord {
    invocation_order: usize,
    queue: UpdateQueueHandle,
    update: UpdateId,
    callback: RootUpdateCallbackHandle,
    accepted_sequence: usize,
    visibility: RootUpdateCallbackVisibility,
    status: RootUpdateCallbackInvocationGateStatus,
    blockers: [RootUpdateCallbackInvocationGateBlocker; 2],
}

#[allow(
    dead_code,
    reason = "crate-private root callback invocation metadata is reserved for future commit workers"
)]
impl RootUpdateCallbackInvocationGateRecord {
    #[must_use]
    pub(crate) const fn invocation_order(self) -> usize {
        self.invocation_order
    }

    #[must_use]
    pub(crate) const fn queue(self) -> UpdateQueueHandle {
        self.queue
    }

    #[must_use]
    pub(crate) const fn update(self) -> UpdateId {
        self.update
    }

    #[must_use]
    pub(crate) const fn callback(self) -> RootUpdateCallbackHandle {
        self.callback
    }

    #[must_use]
    pub(crate) const fn accepted_sequence(self) -> usize {
        self.accepted_sequence
    }

    #[must_use]
    pub(crate) const fn visibility(self) -> RootUpdateCallbackVisibility {
        self.visibility
    }

    #[must_use]
    pub(crate) const fn status(self) -> RootUpdateCallbackInvocationGateStatus {
        self.status
    }

    #[must_use]
    pub(crate) const fn blockers(&self) -> &[RootUpdateCallbackInvocationGateBlocker; 2] {
        &self.blockers
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootUpdateCallbackInvocationGateStatus {
    Blocked,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RootUpdateCallbackInvocationGateBlocker {
    UserCallbackInvocation,
    PublicRootCallbackBehavior,
}

pub(crate) const ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS:
    [RootUpdateCallbackInvocationGateBlocker; 2] = [
    RootUpdateCallbackInvocationGateBlocker::UserCallbackInvocation,
    RootUpdateCallbackInvocationGateBlocker::PublicRootCallbackBehavior,
];

#[must_use]
pub(crate) fn materialize_root_update_callback_invocation_gate(
    snapshot: &RootUpdateCallbackSnapshot,
) -> RootUpdateCallbackInvocationGateSnapshot {
    let records = snapshot
        .visible()
        .iter()
        .copied()
        .enumerate()
        .map(
            |(invocation_order, record)| RootUpdateCallbackInvocationGateRecord {
                invocation_order,
                queue: record.queue(),
                update: record.update(),
                callback: record.callback(),
                accepted_sequence: record.sequence(),
                visibility: RootUpdateCallbackVisibility::Visible,
                status: RootUpdateCallbackInvocationGateStatus::Blocked,
                blockers: ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS,
            },
        )
        .collect();

    RootUpdateCallbackInvocationGateSnapshot {
        records,
        hidden_record_count: snapshot.hidden().len(),
        deferred_hidden_record_count: snapshot.deferred_hidden().len(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{HostRootState, RootElementHandle, RootFormStateHandle, RootUpdatePayload};
    use crate::{UpdateQueueStore, UpdateTag};
    use fast_react_core::{Lane, Lanes};

    fn state(element: u64) -> HostRootState {
        HostRootState::client(
            RootElementHandle::from_raw(element),
            RootFormStateHandle::NONE,
        )
    }

    fn update_with_callback(
        store: &mut UpdateQueueStore,
        lane: Lane,
        element: u64,
        callback: u64,
    ) -> UpdateId {
        let update = store.create_update(lane);
        let update_record = store.update_mut(update).unwrap();
        update_record.set_payload(RootUpdatePayload::new(RootElementHandle::from_raw(element)));
        update_record.set_callback(RootUpdateCallbackHandle::from_raw(callback));
        update
    }

    #[test]
    fn root_callbacks_take_preserves_processed_order_across_skipped_updates() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let skipped = update_with_callback(&mut store, Lane::DEFAULT, 1, 10);
        let applied = update_with_callback(&mut store, Lane::SYNC, 2, 11);
        store.append_pending_update(queue, skipped).unwrap();
        store.append_pending_update(queue, applied).unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::SYNC, Lanes::SYNC)
            .unwrap();
        let first_take = store.take_root_update_callback_records(queue).unwrap();

        assert_eq!(
            callback_handles(first_take.visible()),
            vec![RootUpdateCallbackHandle::from_raw(11)]
        );
        assert_eq!(first_take.visible()[0].update(), applied);
        assert_eq!(first_take.visible()[0].sequence(), 0);
        assert_eq!(
            first_take.visible()[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert!(first_take.hidden().is_empty());
        assert!(first_take.deferred_hidden().is_empty());

        let rebased = store.base_updates(queue).unwrap();
        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();
        let second_take = store.take_root_update_callback_records(queue).unwrap();

        assert_eq!(
            callback_handles(second_take.visible()),
            vec![RootUpdateCallbackHandle::from_raw(10)]
        );
        assert_eq!(second_take.visible()[0].update(), rebased[0]);
    }

    #[test]
    fn root_callbacks_no_lane_clones_do_not_produce_duplicate_records() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let skipped = update_with_callback(&mut store, Lane::DEFAULT, 1, 10);
        let applied_after_skip = update_with_callback(&mut store, Lane::SYNC, 2, 11);
        store.append_pending_update(queue, skipped).unwrap();
        store
            .append_pending_update(queue, applied_after_skip)
            .unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::SYNC, Lanes::SYNC)
            .unwrap();
        let sync_take = store.take_root_update_callback_records(queue).unwrap();
        assert_eq!(
            callback_handles(sync_take.visible()),
            vec![RootUpdateCallbackHandle::from_raw(11)]
        );

        let rebased = store.base_updates(queue).unwrap();
        assert_eq!(rebased.len(), 2);
        assert_eq!(
            store.update(rebased[0]).unwrap().tag(),
            UpdateTag::UpdateState
        );
        assert_eq!(store.update(rebased[0]).unwrap().callback().raw(), 10);
        assert_eq!(
            store.update(rebased[1]).unwrap().callback(),
            RootUpdateCallbackHandle::NONE
        );

        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();
        let default_take = store.take_root_update_callback_records(queue).unwrap();

        assert_eq!(
            callback_handles(default_take.visible()),
            vec![RootUpdateCallbackHandle::from_raw(10)]
        );
        assert_eq!(
            store
                .take_root_update_callback_records(queue)
                .unwrap()
                .visible(),
            &[]
        );
    }

    #[test]
    fn root_callbacks_peek_and_take_distinguish_hidden_and_deferred_records() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let hidden = update_with_callback(&mut store, Lane::DEFAULT, 1, 99);
        store.mark_update_hidden(hidden).unwrap();
        store.append_pending_update(queue, hidden).unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();

        let peeked = store.peek_root_update_callback_records(queue).unwrap();
        assert!(peeked.visible().is_empty());
        assert_eq!(
            callback_handles(peeked.hidden()),
            vec![RootUpdateCallbackHandle::from_raw(99)]
        );
        assert_eq!(peeked.hidden()[0].update(), hidden);
        assert_eq!(
            peeked.hidden()[0].visibility(),
            RootUpdateCallbackVisibility::Hidden
        );
        assert!(peeked.deferred_hidden().is_empty());

        let taken = store.take_root_update_callback_records(queue).unwrap();
        assert!(taken.visible().is_empty());
        assert!(taken.hidden().is_empty());
        assert_eq!(
            callback_handles(taken.deferred_hidden()),
            vec![RootUpdateCallbackHandle::from_raw(99)]
        );
        assert_eq!(
            taken.deferred_hidden()[0].visibility(),
            RootUpdateCallbackVisibility::DeferredHidden
        );

        let after_take = store.peek_root_update_callback_records(queue).unwrap();
        assert!(after_take.visible().is_empty());
        assert!(after_take.hidden().is_empty());
        assert_eq!(
            callback_handles(after_take.deferred_hidden()),
            vec![RootUpdateCallbackHandle::from_raw(99)]
        );
    }

    #[test]
    fn root_callbacks_take_visible_records_only_once_after_peek() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let first = update_with_callback(&mut store, Lane::DEFAULT, 1, 10);
        let second = update_with_callback(&mut store, Lane::DEFAULT, 2, 11);
        store.append_pending_update(queue, first).unwrap();
        store.append_pending_update(queue, second).unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();

        let peeked = store.peek_root_update_callback_records(queue).unwrap();
        assert_eq!(
            callback_handles(peeked.visible()),
            vec![
                RootUpdateCallbackHandle::from_raw(10),
                RootUpdateCallbackHandle::from_raw(11)
            ]
        );

        let first_take = store.take_root_update_callback_records(queue).unwrap();
        assert_eq!(first_take.visible(), peeked.visible());
        assert!(first_take.hidden().is_empty());
        assert!(first_take.deferred_hidden().is_empty());

        let second_take = store.take_root_update_callback_records(queue).unwrap();
        assert!(second_take.is_empty());
        assert!(
            store
                .peek_root_update_callback_records(queue)
                .unwrap()
                .is_empty()
        );
    }

    #[test]
    fn root_callbacks_invocation_gate_records_visible_callbacks_in_drained_order() {
        let mut store = UpdateQueueStore::new();
        let queue = store.initialize_host_root_queue(state(0));
        let first = update_with_callback(&mut store, Lane::DEFAULT, 1, 10);
        let hidden = update_with_callback(&mut store, Lane::DEFAULT, 2, 11);
        let second = update_with_callback(&mut store, Lane::DEFAULT, 3, 12);
        store.mark_update_hidden(hidden).unwrap();
        store.append_pending_update(queue, first).unwrap();
        store.append_pending_update(queue, hidden).unwrap();
        store.append_pending_update(queue, second).unwrap();

        store
            .process_host_root_update_queue(queue, None, Lanes::DEFAULT, Lanes::DEFAULT)
            .unwrap();

        let taken = store.take_root_update_callback_records(queue).unwrap();
        let gate = materialize_root_update_callback_invocation_gate(&taken);

        assert_eq!(
            callback_handles(taken.visible()),
            vec![
                RootUpdateCallbackHandle::from_raw(10),
                RootUpdateCallbackHandle::from_raw(12)
            ]
        );
        assert_eq!(
            callback_handles(taken.deferred_hidden()),
            vec![RootUpdateCallbackHandle::from_raw(11)]
        );
        assert_eq!(gate.len(), 2);
        assert_eq!(gate.hidden_record_count(), 0);
        assert_eq!(gate.deferred_hidden_record_count(), 1);
        assert!(!gate.user_callbacks_invoked());
        assert!(!gate.hidden_callbacks_invoked());
        assert!(!gate.public_root_callback_behavior_exposed());

        let records = gate.records();
        assert_eq!(records[0].invocation_order(), 0);
        assert_eq!(records[0].accepted_sequence(), 0);
        assert_eq!(records[0].queue(), queue);
        assert_eq!(records[0].update(), first);
        assert_eq!(
            records[0].callback(),
            RootUpdateCallbackHandle::from_raw(10)
        );
        assert_eq!(
            records[0].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(
            records[0].status(),
            RootUpdateCallbackInvocationGateStatus::Blocked
        );
        assert_eq!(
            records[0].blockers(),
            &ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS
        );
        assert_eq!(records[1].invocation_order(), 1);
        assert_eq!(records[1].accepted_sequence(), 2);
        assert_eq!(records[1].queue(), queue);
        assert_eq!(records[1].update(), second);
        assert_eq!(
            records[1].callback(),
            RootUpdateCallbackHandle::from_raw(12)
        );
        assert_eq!(
            records[1].visibility(),
            RootUpdateCallbackVisibility::Visible
        );
        assert_eq!(
            records[1].status(),
            RootUpdateCallbackInvocationGateStatus::Blocked
        );
        assert_eq!(
            records[1].blockers(),
            &ROOT_UPDATE_CALLBACK_INVOCATION_GATE_BLOCKERS
        );

        let after_take = store.peek_root_update_callback_records(queue).unwrap();
        assert!(after_take.visible().is_empty());
        assert_eq!(
            callback_handles(after_take.deferred_hidden()),
            vec![RootUpdateCallbackHandle::from_raw(11)]
        );
    }

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }
}
