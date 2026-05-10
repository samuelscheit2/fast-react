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

    fn callback_handles(records: &[RootUpdateCallbackRecord]) -> Vec<RootUpdateCallbackHandle> {
        records.iter().map(|record| record.callback()).collect()
    }
}
