//! Private bridge handle table for future Node-API rooted values.
//!
//! This module deliberately models only deterministic environment-local handle
//! behavior. It does not retain Node-API values, call JS, or connect to the
//! reconciler root store.

#![allow(dead_code)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub(crate) struct BridgeEnvironmentId(u64);

impl BridgeEnvironmentId {
    pub(crate) const NONE: Self = Self(0);

    #[must_use]
    pub(crate) const fn from_raw(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub(crate) const fn raw(self) -> u64 {
        self.0
    }

    #[must_use]
    pub(crate) const fn is_none(self) -> bool {
        self.0 == 0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) enum BridgeHandleKind {
    Root,
    Value,
}

impl Display for BridgeHandleKind {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::Root => formatter.write_str("root"),
            Self::Value => formatter.write_str("value"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub(crate) struct BridgeHandle {
    environment_id: BridgeEnvironmentId,
    slot: u64,
    generation: u64,
    kind: BridgeHandleKind,
}

impl BridgeHandle {
    #[must_use]
    pub(crate) const fn new(
        environment_id: BridgeEnvironmentId,
        slot: u64,
        generation: u64,
        kind: BridgeHandleKind,
    ) -> Self {
        Self {
            environment_id,
            slot,
            generation,
            kind,
        }
    }

    #[must_use]
    pub(crate) const fn environment_id(self) -> BridgeEnvironmentId {
        self.environment_id
    }

    #[must_use]
    pub(crate) const fn slot(self) -> u64 {
        self.slot
    }

    #[must_use]
    pub(crate) const fn generation(self) -> u64 {
        self.generation
    }

    #[must_use]
    pub(crate) const fn kind(self) -> BridgeHandleKind {
        self.kind
    }

    #[must_use]
    pub(crate) const fn is_empty(self) -> bool {
        self.environment_id.is_none() || self.slot == 0 || self.generation == 0
    }

    #[must_use]
    pub(crate) const fn with_environment_id(self, environment_id: BridgeEnvironmentId) -> Self {
        Self {
            environment_id,
            ..self
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PlaceholderRootRecord {
    root_id: u64,
}

impl PlaceholderRootRecord {
    #[must_use]
    pub(crate) const fn new(root_id: u64) -> Self {
        Self { root_id }
    }

    #[must_use]
    pub(crate) const fn root_id(&self) -> u64 {
        self.root_id
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct PlaceholderValueRecord {
    value_id: u64,
}

impl PlaceholderValueRecord {
    #[must_use]
    pub(crate) const fn new(value_id: u64) -> Self {
        Self { value_id }
    }

    #[must_use]
    pub(crate) const fn value_id(&self) -> u64 {
        self.value_id
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum BridgeRecord {
    Root(PlaceholderRootRecord),
    Value(PlaceholderValueRecord),
}

impl BridgeRecord {
    const fn kind(&self) -> BridgeHandleKind {
        match self {
            Self::Root(_) => BridgeHandleKind::Root,
            Self::Value(_) => BridgeHandleKind::Value,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct BridgeHandleEntry {
    generation: u64,
    record: BridgeRecord,
    disposed: bool,
}

impl BridgeHandleEntry {
    const fn new(generation: u64, record: BridgeRecord) -> Self {
        Self {
            generation,
            record,
            disposed: false,
        }
    }

    const fn handle(
        &self,
        environment_id: BridgeEnvironmentId,
        slot: u64,
        kind: BridgeHandleKind,
    ) -> BridgeHandle {
        BridgeHandle::new(environment_id, slot, self.generation, kind)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BridgeHandleAdmissionOutcome {
    Admitted,
    Validated,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct BridgeHandleAdmission {
    handle: BridgeHandle,
    current_generation: u64,
    outcome: BridgeHandleAdmissionOutcome,
}

impl BridgeHandleAdmission {
    const fn admitted(handle: BridgeHandle) -> Self {
        Self {
            handle,
            current_generation: handle.generation(),
            outcome: BridgeHandleAdmissionOutcome::Admitted,
        }
    }

    const fn validated(handle: BridgeHandle, current_generation: u64) -> Self {
        Self {
            handle,
            current_generation,
            outcome: BridgeHandleAdmissionOutcome::Validated,
        }
    }

    #[must_use]
    pub(crate) const fn handle(self) -> BridgeHandle {
        self.handle
    }

    #[must_use]
    pub(crate) const fn current_generation(self) -> u64 {
        self.current_generation
    }

    #[must_use]
    pub(crate) const fn outcome(self) -> BridgeHandleAdmissionOutcome {
        self.outcome
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct BridgeEnvironmentTeardown {
    requested_environment_id: BridgeEnvironmentId,
    table_environment_id: BridgeEnvironmentId,
    root_handles_invalidated: usize,
    value_handles_invalidated: usize,
}

impl BridgeEnvironmentTeardown {
    const fn new(
        requested_environment_id: BridgeEnvironmentId,
        table_environment_id: BridgeEnvironmentId,
    ) -> Self {
        Self {
            requested_environment_id,
            table_environment_id,
            root_handles_invalidated: 0,
            value_handles_invalidated: 0,
        }
    }

    #[must_use]
    pub(crate) const fn requested_environment_id(self) -> BridgeEnvironmentId {
        self.requested_environment_id
    }

    #[must_use]
    pub(crate) const fn table_environment_id(self) -> BridgeEnvironmentId {
        self.table_environment_id
    }

    #[must_use]
    pub(crate) const fn environment_matched(self) -> bool {
        self.requested_environment_id.raw() == self.table_environment_id.raw()
    }

    #[must_use]
    pub(crate) const fn root_handles_invalidated(self) -> usize {
        self.root_handles_invalidated
    }

    #[must_use]
    pub(crate) const fn value_handles_invalidated(self) -> usize {
        self.value_handles_invalidated
    }

    #[must_use]
    pub(crate) const fn total_handles_invalidated(self) -> usize {
        self.root_handles_invalidated + self.value_handles_invalidated
    }

    #[must_use]
    pub(crate) const fn tore_down_handles(self) -> bool {
        self.total_handles_invalidated() > 0
    }

    fn record_invalidated(&mut self, kind: BridgeHandleKind) {
        match kind {
            BridgeHandleKind::Root => self.root_handles_invalidated += 1,
            BridgeHandleKind::Value => self.value_handles_invalidated += 1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum BridgeHandleSlot {
    Vacant { next_generation: u64 },
    Occupied(BridgeHandleEntry),
}

impl Default for BridgeHandleSlot {
    fn default() -> Self {
        Self::Vacant { next_generation: 1 }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum BridgeHandleTableError {
    EmptyHandle {
        handle: BridgeHandle,
    },
    WrongEnvironment {
        handle: BridgeHandle,
        expected: BridgeEnvironmentId,
    },
    InvalidHandle {
        handle: BridgeHandle,
    },
    StaleHandle {
        handle: BridgeHandle,
        current_generation: u64,
    },
    DisposedHandle {
        handle: BridgeHandle,
    },
    DuplicateDispose {
        handle: BridgeHandle,
    },
    WrongKind {
        handle: BridgeHandle,
        expected: BridgeHandleKind,
        actual: BridgeHandleKind,
    },
    GenerationExhausted {
        slot: u64,
    },
}

impl BridgeHandleTableError {
    #[must_use]
    pub(crate) const fn code(&self) -> &'static str {
        match self {
            Self::EmptyHandle { .. } => "FAST_REACT_NAPI_EMPTY_HANDLE",
            Self::WrongEnvironment { .. } => "FAST_REACT_NAPI_WRONG_ENVIRONMENT",
            Self::InvalidHandle { .. } => "FAST_REACT_NAPI_INVALID_HANDLE",
            Self::StaleHandle { .. } => "FAST_REACT_NAPI_STALE_HANDLE",
            Self::DisposedHandle { .. } => "FAST_REACT_NAPI_DISPOSED_HANDLE",
            Self::DuplicateDispose { .. } => "FAST_REACT_NAPI_DUPLICATE_DISPOSE",
            Self::WrongKind { .. } => "FAST_REACT_NAPI_WRONG_HANDLE_KIND",
            Self::GenerationExhausted { .. } => "FAST_REACT_NAPI_HANDLE_GENERATION_EXHAUSTED",
        }
    }
}

impl Display for BridgeHandleTableError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyHandle { .. } => formatter.write_str("bridge handle is empty"),
            Self::WrongEnvironment { handle, expected } => write!(
                formatter,
                "bridge handle belongs to environment {}, expected environment {}",
                handle.environment_id().raw(),
                expected.raw()
            ),
            Self::InvalidHandle { handle } => {
                write!(formatter, "bridge handle slot {} is invalid", handle.slot())
            }
            Self::StaleHandle {
                handle,
                current_generation,
            } => write!(
                formatter,
                "bridge handle slot {} generation {} is stale; current generation is {}",
                handle.slot(),
                handle.generation(),
                current_generation
            ),
            Self::DisposedHandle { handle } => {
                write!(
                    formatter,
                    "bridge handle slot {} is disposed",
                    handle.slot()
                )
            }
            Self::DuplicateDispose { handle } => write!(
                formatter,
                "bridge handle slot {} has already been disposed",
                handle.slot()
            ),
            Self::WrongKind {
                handle,
                expected,
                actual,
            } => write!(
                formatter,
                "bridge handle slot {} has kind {}, expected {}",
                handle.slot(),
                actual,
                expected
            ),
            Self::GenerationExhausted { slot } => write!(
                formatter,
                "bridge handle slot {slot} cannot allocate another generation"
            ),
        }
    }
}

impl Error for BridgeHandleTableError {}

#[derive(Debug, Clone)]
pub(crate) struct BridgeHandleTable {
    environment_id: BridgeEnvironmentId,
    slots: Vec<BridgeHandleSlot>,
}

impl BridgeHandleTable {
    #[must_use]
    pub(crate) const fn new(environment_id: BridgeEnvironmentId) -> Self {
        Self {
            environment_id,
            slots: Vec::new(),
        }
    }

    #[must_use]
    pub(crate) const fn environment_id(&self) -> BridgeEnvironmentId {
        self.environment_id
    }

    pub(crate) fn insert_root(&mut self, record: PlaceholderRootRecord) -> BridgeHandle {
        self.insert_record(BridgeRecord::Root(record))
    }

    pub(crate) fn insert_value(&mut self, record: PlaceholderValueRecord) -> BridgeHandle {
        self.insert_record(BridgeRecord::Value(record))
    }

    pub(crate) fn admit_root_handoff_handle(
        &mut self,
        handle: BridgeHandle,
        record: PlaceholderRootRecord,
    ) -> Result<BridgeHandleAdmission, BridgeHandleTableError> {
        self.admit_handoff_record(handle, BridgeRecord::Root(record), BridgeHandleKind::Root)
    }

    pub(crate) fn admit_value_handoff_handle(
        &mut self,
        handle: BridgeHandle,
        record: PlaceholderValueRecord,
    ) -> Result<BridgeHandleAdmission, BridgeHandleTableError> {
        self.admit_handoff_record(handle, BridgeRecord::Value(record), BridgeHandleKind::Value)
    }

    pub(crate) fn get_root(
        &self,
        handle: BridgeHandle,
    ) -> Result<&PlaceholderRootRecord, BridgeHandleTableError> {
        match self.active_record(handle, BridgeHandleKind::Root)? {
            BridgeRecord::Root(record) => Ok(record),
            BridgeRecord::Value(_) => unreachable!("active_record validates bridge handle kind"),
        }
    }

    pub(crate) fn get_value(
        &self,
        handle: BridgeHandle,
    ) -> Result<&PlaceholderValueRecord, BridgeHandleTableError> {
        match self.active_record(handle, BridgeHandleKind::Value)? {
            BridgeRecord::Value(record) => Ok(record),
            BridgeRecord::Root(_) => unreachable!("active_record validates bridge handle kind"),
        }
    }

    pub(crate) fn remove_root(
        &mut self,
        handle: BridgeHandle,
    ) -> Result<PlaceholderRootRecord, BridgeHandleTableError> {
        match self.remove_record(handle, BridgeHandleKind::Root)? {
            BridgeRecord::Root(record) => Ok(record),
            BridgeRecord::Value(_) => unreachable!("remove_record validates bridge handle kind"),
        }
    }

    pub(crate) fn remove_value(
        &mut self,
        handle: BridgeHandle,
    ) -> Result<PlaceholderValueRecord, BridgeHandleTableError> {
        match self.remove_record(handle, BridgeHandleKind::Value)? {
            BridgeRecord::Value(record) => Ok(record),
            BridgeRecord::Root(_) => unreachable!("remove_record validates bridge handle kind"),
        }
    }

    pub(crate) fn dispose(&mut self, handle: BridgeHandle) -> Result<(), BridgeHandleTableError> {
        self.validate_handle_identity(handle)?;

        let expected = handle.kind();
        let slot = self.occupied_slot_mut(handle)?;
        let entry = match slot {
            BridgeHandleSlot::Occupied(entry) => entry,
            BridgeHandleSlot::Vacant { .. } => unreachable!("occupied_slot_mut rejects vacancies"),
        };

        validate_entry_generation(handle, entry.generation)?;
        validate_entry_kind(handle, expected, entry.record.kind())?;

        if entry.disposed {
            return Err(BridgeHandleTableError::DuplicateDispose { handle });
        }

        entry.disposed = true;
        Ok(())
    }

    pub(crate) fn teardown_environment(
        &mut self,
        environment_id: BridgeEnvironmentId,
    ) -> BridgeEnvironmentTeardown {
        let mut teardown = BridgeEnvironmentTeardown::new(environment_id, self.environment_id);

        if environment_id != self.environment_id {
            return teardown;
        }

        for slot in &mut self.slots {
            let BridgeHandleSlot::Occupied(entry) = slot else {
                continue;
            };

            teardown.record_invalidated(entry.record.kind());

            if let Some(next_generation) = entry.generation.checked_add(1) {
                *slot = BridgeHandleSlot::Vacant { next_generation };
            } else {
                entry.disposed = true;
            }
        }

        teardown
    }

    fn insert_record(&mut self, record: BridgeRecord) -> BridgeHandle {
        let kind = record.kind();

        for (index, slot) in self.slots.iter_mut().enumerate() {
            if let BridgeHandleSlot::Vacant { next_generation } = slot {
                let generation = *next_generation;
                let entry = BridgeHandleEntry::new(generation, record);
                let handle = entry.handle(self.environment_id, index as u64 + 1, kind);
                *slot = BridgeHandleSlot::Occupied(entry);
                return handle;
            }
        }

        let entry = BridgeHandleEntry::new(1, record);
        let handle = entry.handle(self.environment_id, self.slots.len() as u64 + 1, kind);
        self.slots.push(BridgeHandleSlot::Occupied(entry));
        handle
    }

    fn admit_handoff_record(
        &mut self,
        handle: BridgeHandle,
        record: BridgeRecord,
        expected: BridgeHandleKind,
    ) -> Result<BridgeHandleAdmission, BridgeHandleTableError> {
        self.validate_handle_identity(handle)?;

        let slot = self.slot_for_handoff_admission_mut(handle);
        match slot {
            BridgeHandleSlot::Vacant { next_generation } => {
                validate_entry_generation(handle, *next_generation)?;
                *slot =
                    BridgeHandleSlot::Occupied(BridgeHandleEntry::new(handle.generation(), record));
                Ok(BridgeHandleAdmission::admitted(handle))
            }
            BridgeHandleSlot::Occupied(entry) => {
                validate_entry_generation(handle, entry.generation)?;
                validate_entry_kind(handle, expected, entry.record.kind())?;

                if entry.disposed {
                    return Err(BridgeHandleTableError::DisposedHandle { handle });
                }

                Ok(BridgeHandleAdmission::validated(handle, entry.generation))
            }
        }
    }

    fn active_record(
        &self,
        handle: BridgeHandle,
        expected: BridgeHandleKind,
    ) -> Result<&BridgeRecord, BridgeHandleTableError> {
        self.validate_handle_identity(handle)?;

        let entry = self.occupied_entry(handle)?;
        validate_entry_generation(handle, entry.generation)?;
        validate_entry_kind(handle, expected, entry.record.kind())?;

        if entry.disposed {
            return Err(BridgeHandleTableError::DisposedHandle { handle });
        }

        Ok(&entry.record)
    }

    fn remove_record(
        &mut self,
        handle: BridgeHandle,
        expected: BridgeHandleKind,
    ) -> Result<BridgeRecord, BridgeHandleTableError> {
        self.validate_handle_identity(handle)?;

        let slot = self.occupied_slot_mut(handle)?;
        let entry = match slot {
            BridgeHandleSlot::Occupied(entry) => entry,
            BridgeHandleSlot::Vacant { .. } => unreachable!("occupied_slot_mut rejects vacancies"),
        };

        validate_entry_generation(handle, entry.generation)?;
        validate_entry_kind(handle, expected, entry.record.kind())?;

        if entry.disposed {
            return Err(BridgeHandleTableError::DisposedHandle { handle });
        }

        let next_generation =
            entry
                .generation
                .checked_add(1)
                .ok_or(BridgeHandleTableError::GenerationExhausted {
                    slot: handle.slot(),
                })?;
        let old_slot = std::mem::replace(slot, BridgeHandleSlot::Vacant { next_generation });

        match old_slot {
            BridgeHandleSlot::Occupied(entry) => Ok(entry.record),
            BridgeHandleSlot::Vacant { .. } => unreachable!("occupied slot was just replaced"),
        }
    }

    fn validate_handle_identity(&self, handle: BridgeHandle) -> Result<(), BridgeHandleTableError> {
        if handle.is_empty() {
            return Err(BridgeHandleTableError::EmptyHandle { handle });
        }

        if handle.environment_id() != self.environment_id {
            return Err(BridgeHandleTableError::WrongEnvironment {
                handle,
                expected: self.environment_id,
            });
        }

        Ok(())
    }

    fn occupied_entry(
        &self,
        handle: BridgeHandle,
    ) -> Result<&BridgeHandleEntry, BridgeHandleTableError> {
        match self.slot(handle)? {
            BridgeHandleSlot::Occupied(entry) => Ok(entry),
            BridgeHandleSlot::Vacant { next_generation } => {
                Err(BridgeHandleTableError::StaleHandle {
                    handle,
                    current_generation: *next_generation,
                })
            }
        }
    }

    fn occupied_slot_mut(
        &mut self,
        handle: BridgeHandle,
    ) -> Result<&mut BridgeHandleSlot, BridgeHandleTableError> {
        let slot = self.slot_mut(handle)?;

        match slot {
            BridgeHandleSlot::Occupied(_) => Ok(slot),
            BridgeHandleSlot::Vacant { next_generation } => {
                Err(BridgeHandleTableError::StaleHandle {
                    handle,
                    current_generation: *next_generation,
                })
            }
        }
    }

    fn slot(&self, handle: BridgeHandle) -> Result<&BridgeHandleSlot, BridgeHandleTableError> {
        self.slots
            .get((handle.slot() - 1) as usize)
            .ok_or(BridgeHandleTableError::InvalidHandle { handle })
    }

    fn slot_mut(
        &mut self,
        handle: BridgeHandle,
    ) -> Result<&mut BridgeHandleSlot, BridgeHandleTableError> {
        self.slots
            .get_mut((handle.slot() - 1) as usize)
            .ok_or(BridgeHandleTableError::InvalidHandle { handle })
    }

    fn slot_for_handoff_admission_mut(&mut self, handle: BridgeHandle) -> &mut BridgeHandleSlot {
        let requested_len = handle.slot() as usize;
        if requested_len > self.slots.len() {
            self.slots
                .resize(requested_len, BridgeHandleSlot::default());
        }

        &mut self.slots[(handle.slot() - 1) as usize]
    }
}

fn validate_entry_generation(
    handle: BridgeHandle,
    current_generation: u64,
) -> Result<(), BridgeHandleTableError> {
    if handle.generation() == current_generation {
        return Ok(());
    }

    Err(BridgeHandleTableError::StaleHandle {
        handle,
        current_generation,
    })
}

fn validate_entry_kind(
    handle: BridgeHandle,
    expected: BridgeHandleKind,
    actual: BridgeHandleKind,
) -> Result<(), BridgeHandleTableError> {
    if actual == expected {
        return Ok(());
    }

    Err(BridgeHandleTableError::WrongKind {
        handle,
        expected,
        actual,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn environment(raw: u64) -> BridgeHandleTable {
        BridgeHandleTable::new(BridgeEnvironmentId::from_raw(raw))
    }

    #[test]
    fn inserts_and_reads_root_and_value_records() {
        let mut table = environment(1);

        let root_handle = table.insert_root(PlaceholderRootRecord::new(101));
        let value_handle = table.insert_value(PlaceholderValueRecord::new(202));

        assert_eq!(root_handle.environment_id(), table.environment_id());
        assert_eq!(root_handle.slot(), 1);
        assert_eq!(root_handle.generation(), 1);
        assert_eq!(root_handle.kind(), BridgeHandleKind::Root);
        assert_eq!(value_handle.slot(), 2);
        assert_eq!(value_handle.kind(), BridgeHandleKind::Value);
        assert_eq!(table.get_root(root_handle).unwrap().root_id(), 101);
        assert_eq!(table.get_value(value_handle).unwrap().value_id(), 202);
    }

    #[test]
    fn rejects_handles_from_the_wrong_environment() {
        let mut first = environment(1);
        let second = environment(2);
        let handle = first.insert_root(PlaceholderRootRecord::new(1));

        let error = second.get_root(handle).unwrap_err();

        assert_eq!(
            error,
            BridgeHandleTableError::WrongEnvironment {
                handle,
                expected: second.environment_id()
            }
        );
        assert_eq!(error.code(), "FAST_REACT_NAPI_WRONG_ENVIRONMENT");
    }

    #[test]
    fn removed_handles_become_stale_and_slots_are_reused_with_new_generation() {
        let mut table = environment(1);
        let old_handle = table.insert_value(PlaceholderValueRecord::new(7));

        let removed = table.remove_value(old_handle).unwrap();
        let new_handle = table.insert_value(PlaceholderValueRecord::new(8));

        assert_eq!(removed.value_id(), 7);
        assert_eq!(new_handle.slot(), old_handle.slot());
        assert_eq!(new_handle.generation(), old_handle.generation() + 1);
        assert_eq!(
            table.get_value(old_handle).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: old_handle,
                current_generation: new_handle.generation()
            }
        );
        assert_eq!(table.get_value(new_handle).unwrap().value_id(), 8);
    }

    #[test]
    fn disposed_handles_are_rejected_before_record_access() {
        let mut table = environment(1);
        let handle = table.insert_root(PlaceholderRootRecord::new(9));

        table.dispose(handle).unwrap();

        let error = table.get_root(handle).unwrap_err();
        assert_eq!(error, BridgeHandleTableError::DisposedHandle { handle });
        assert_eq!(error.code(), "FAST_REACT_NAPI_DISPOSED_HANDLE");
    }

    #[test]
    fn duplicate_dispose_is_reported_without_changing_handle_generation() {
        let mut table = environment(1);
        let handle = table.insert_root(PlaceholderRootRecord::new(9));

        table.dispose(handle).unwrap();
        let error = table.dispose(handle).unwrap_err();

        assert_eq!(error, BridgeHandleTableError::DuplicateDispose { handle });
        assert_eq!(error.code(), "FAST_REACT_NAPI_DUPLICATE_DISPOSE");
        assert_eq!(
            error.to_string(),
            "bridge handle slot 1 has already been disposed"
        );
    }

    #[test]
    fn wrong_kind_handles_are_rejected() {
        let mut table = environment(1);
        let handle = table.insert_root(PlaceholderRootRecord::new(11));

        let error = table.get_value(handle).unwrap_err();

        assert_eq!(
            error,
            BridgeHandleTableError::WrongKind {
                handle,
                expected: BridgeHandleKind::Value,
                actual: BridgeHandleKind::Root
            }
        );
        assert_eq!(error.code(), "FAST_REACT_NAPI_WRONG_HANDLE_KIND");
    }

    #[test]
    fn remove_returns_root_records_and_invalidates_old_handles() {
        let mut table = environment(1);
        let handle = table.insert_root(PlaceholderRootRecord::new(44));

        let removed = table.remove_root(handle).unwrap();

        assert_eq!(removed.root_id(), 44);
        assert_eq!(
            table.get_root(handle).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle,
                current_generation: 2
            }
        );
    }

    #[test]
    fn root_lifecycle_canary_isolates_retirement_and_environment_teardown() {
        let mut first = environment(232);
        let mut second = environment(233);
        let retired_root = first.insert_root(PlaceholderRootRecord::new(7001));
        let teardown_root = first.insert_root(PlaceholderRootRecord::new(7002));
        let peer_root = second.insert_root(PlaceholderRootRecord::new(8001));

        assert_eq!(retired_root.environment_id(), first.environment_id());
        assert_eq!(retired_root.kind(), BridgeHandleKind::Root);
        assert_eq!(retired_root.generation(), 1);
        assert_eq!(first.get_root(retired_root).unwrap().root_id(), 7001);
        assert_eq!(first.get_root(teardown_root).unwrap().root_id(), 7002);
        assert_eq!(second.get_root(peer_root).unwrap().root_id(), 8001);
        assert_eq!(
            first.get_root(peer_root).unwrap_err(),
            BridgeHandleTableError::WrongEnvironment {
                handle: peer_root,
                expected: first.environment_id()
            }
        );

        let removed = first.remove_root(retired_root).unwrap();
        let replacement_root = first.insert_root(PlaceholderRootRecord::new(7003));

        assert_eq!(removed.root_id(), 7001);
        assert_eq!(replacement_root.slot(), retired_root.slot());
        assert_eq!(replacement_root.generation(), retired_root.generation() + 1);
        assert_eq!(first.get_root(replacement_root).unwrap().root_id(), 7003);
        assert_eq!(
            first.get_root(retired_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: retired_root,
                current_generation: replacement_root.generation()
            }
        );
        assert_eq!(second.get_root(peer_root).unwrap().root_id(), 8001);

        let wrong_teardown = first.teardown_environment(second.environment_id());

        assert!(!wrong_teardown.environment_matched());
        assert_eq!(wrong_teardown.total_handles_invalidated(), 0);
        assert_eq!(first.get_root(replacement_root).unwrap().root_id(), 7003);
        assert_eq!(first.get_root(teardown_root).unwrap().root_id(), 7002);

        let teardown = first.teardown_environment(first.environment_id());

        assert!(teardown.environment_matched());
        assert_eq!(teardown.root_handles_invalidated(), 2);
        assert_eq!(teardown.value_handles_invalidated(), 0);
        assert_eq!(teardown.total_handles_invalidated(), 2);
        assert_eq!(
            first.get_root(replacement_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: replacement_root,
                current_generation: replacement_root.generation() + 1
            }
        );
        assert_eq!(
            first.get_root(teardown_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: teardown_root,
                current_generation: teardown_root.generation() + 1
            }
        );
        assert_eq!(second.get_root(peer_root).unwrap().root_id(), 8001);

        let post_teardown_root = first.insert_root(PlaceholderRootRecord::new(7004));

        assert_eq!(post_teardown_root.slot(), replacement_root.slot());
        assert_eq!(
            post_teardown_root.generation(),
            replacement_root.generation() + 1
        );
        assert_eq!(
            first.get_root(replacement_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: replacement_root,
                current_generation: post_teardown_root.generation()
            }
        );
        assert_eq!(first.get_root(post_teardown_root).unwrap().root_id(), 7004);
        assert_eq!(second.get_root(peer_root).unwrap().root_id(), 8001);
    }

    #[test]
    fn teardown_invalidates_multiple_root_and_value_handles() {
        let mut table = environment(1);
        let first_root = table.insert_root(PlaceholderRootRecord::new(11));
        let value = table.insert_value(PlaceholderValueRecord::new(22));
        let second_root = table.insert_root(PlaceholderRootRecord::new(33));

        let teardown = table.teardown_environment(table.environment_id());

        assert_eq!(teardown.requested_environment_id(), table.environment_id());
        assert_eq!(teardown.table_environment_id(), table.environment_id());
        assert!(teardown.environment_matched());
        assert_eq!(teardown.root_handles_invalidated(), 2);
        assert_eq!(teardown.value_handles_invalidated(), 1);
        assert_eq!(teardown.total_handles_invalidated(), 3);
        assert!(teardown.tore_down_handles());
        assert_eq!(
            table.get_root(first_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: first_root,
                current_generation: first_root.generation() + 1
            }
        );
        assert_eq!(
            table.get_value(value).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: value,
                current_generation: value.generation() + 1
            }
        );
        assert_eq!(
            table.get_root(second_root).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: second_root,
                current_generation: second_root.generation() + 1
            }
        );

        let empty_teardown = table.teardown_environment(table.environment_id());

        assert!(empty_teardown.environment_matched());
        assert!(!empty_teardown.tore_down_handles());
        assert_eq!(empty_teardown.total_handles_invalidated(), 0);
    }

    #[test]
    fn teardown_is_idempotent_when_environment_is_empty() {
        let mut table = environment(1);

        let first_teardown = table.teardown_environment(table.environment_id());
        let second_teardown = table.teardown_environment(table.environment_id());

        assert!(first_teardown.environment_matched());
        assert!(!first_teardown.tore_down_handles());
        assert_eq!(first_teardown.total_handles_invalidated(), 0);
        assert_eq!(second_teardown, first_teardown);
    }

    #[test]
    fn teardown_does_not_cross_environment_tables() {
        let mut first = environment(1);
        let mut second = environment(2);
        let first_root = first.insert_root(PlaceholderRootRecord::new(10));
        let second_root = second.insert_root(PlaceholderRootRecord::new(20));
        let second_disposed = second.insert_value(PlaceholderValueRecord::new(30));
        let second_removed = second.insert_value(PlaceholderValueRecord::new(40));
        second.dispose(second_disposed).unwrap();
        second.remove_value(second_removed).unwrap();

        let mismatched_teardown = first.teardown_environment(second.environment_id());

        assert!(!mismatched_teardown.environment_matched());
        assert!(!mismatched_teardown.tore_down_handles());
        assert_eq!(first.get_root(first_root).unwrap().root_id(), 10);

        let first_teardown = first.teardown_environment(first.environment_id());

        assert!(first_teardown.tore_down_handles());
        assert_eq!(second.get_root(second_root).unwrap().root_id(), 20);
        assert_eq!(
            first.get_root(second_root).unwrap_err(),
            BridgeHandleTableError::WrongEnvironment {
                handle: second_root,
                expected: first.environment_id()
            }
        );
        assert_eq!(
            second.get_value(second_root).unwrap_err(),
            BridgeHandleTableError::WrongKind {
                handle: second_root,
                expected: BridgeHandleKind::Value,
                actual: BridgeHandleKind::Root
            }
        );
        assert_eq!(
            second.dispose(second_disposed).unwrap_err(),
            BridgeHandleTableError::DuplicateDispose {
                handle: second_disposed
            }
        );
        assert_eq!(
            second.get_value(second_removed).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: second_removed,
                current_generation: second_removed.generation() + 1
            }
        );
    }

    #[test]
    fn post_teardown_lookup_removal_and_dispose_use_stale_handle_errors() {
        let mut table = environment(1);
        let handle = table.insert_root(PlaceholderRootRecord::new(51));

        table.teardown_environment(table.environment_id());

        let expected = BridgeHandleTableError::StaleHandle {
            handle,
            current_generation: handle.generation() + 1,
        };
        assert_eq!(table.get_root(handle).unwrap_err(), expected);
        assert_eq!(table.remove_root(handle).unwrap_err(), expected);
        assert_eq!(table.dispose(handle).unwrap_err(), expected);
    }

    #[test]
    fn insertion_after_teardown_reuses_slots_without_reviving_old_handles() {
        let mut table = environment(1);
        let old_handle = table.insert_root(PlaceholderRootRecord::new(61));

        table.teardown_environment(table.environment_id());
        let new_handle = table.insert_root(PlaceholderRootRecord::new(62));

        assert_eq!(new_handle.slot(), old_handle.slot());
        assert_eq!(new_handle.generation(), old_handle.generation() + 1);
        assert_eq!(table.get_root(new_handle).unwrap().root_id(), 62);
        assert_eq!(
            table.get_root(old_handle).unwrap_err(),
            BridgeHandleTableError::StaleHandle {
                handle: old_handle,
                current_generation: new_handle.generation()
            }
        );
    }

    #[test]
    fn admits_js_handoff_handles_at_explicit_slots() {
        let mut table = environment(376);
        let root = BridgeHandle::new(table.environment_id(), 1, 1, BridgeHandleKind::Root);
        let container = BridgeHandle::new(table.environment_id(), 2, 1, BridgeHandleKind::Value);
        let element = BridgeHandle::new(table.environment_id(), 3, 1, BridgeHandleKind::Value);

        let root_admission = table
            .admit_root_handoff_handle(root, PlaceholderRootRecord::new(7001))
            .unwrap();
        let container_admission = table
            .admit_value_handoff_handle(container, PlaceholderValueRecord::new(1))
            .unwrap();
        let repeated_container = table
            .admit_value_handoff_handle(container, PlaceholderValueRecord::new(2))
            .unwrap();
        let element_admission = table
            .admit_value_handoff_handle(element, PlaceholderValueRecord::new(3))
            .unwrap();

        assert_eq!(root_admission.handle(), root);
        assert_eq!(root_admission.current_generation(), 1);
        assert_eq!(
            root_admission.outcome(),
            BridgeHandleAdmissionOutcome::Admitted
        );
        assert_eq!(
            container_admission.outcome(),
            BridgeHandleAdmissionOutcome::Admitted
        );
        assert_eq!(
            repeated_container.outcome(),
            BridgeHandleAdmissionOutcome::Validated
        );
        assert_eq!(
            element_admission.outcome(),
            BridgeHandleAdmissionOutcome::Admitted
        );
        assert_eq!(table.get_root(root).unwrap().root_id(), 7001);
        assert_eq!(table.get_value(container).unwrap().value_id(), 1);
        assert_eq!(table.get_value(element).unwrap().value_id(), 3);
    }
}
