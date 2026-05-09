//! Stable arena-scoped fiber identity.
//!
//! A `FiberId` is an opaque handle into a `FiberArena`. It carries the arena
//! owner, slot index, and slot generation so stale handles fail before they can
//! observe a reused fiber slot.

use std::error::Error;
use std::fmt::{self, Display, Formatter};
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_ARENA_ID: AtomicU64 = AtomicU64::new(1);

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FiberArenaId(u64);

impl FiberArenaId {
    #[must_use]
    pub const fn new(raw: u64) -> Option<Self> {
        if raw == 0 { None } else { Some(Self(raw)) }
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }

    #[must_use]
    pub(crate) fn allocate() -> Self {
        let raw = NEXT_ARENA_ID.fetch_add(1, Ordering::Relaxed);
        assert_ne!(raw, 0, "fiber arena id counter wrapped");
        Self(raw)
    }
}

#[repr(transparent)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FiberSlot(usize);

impl FiberSlot {
    #[must_use]
    pub const fn new(index: usize) -> Self {
        Self(index)
    }

    #[must_use]
    pub const fn get(self) -> usize {
        self.0
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct FiberGeneration(u64);

impl FiberGeneration {
    pub const INITIAL: Self = Self(0);

    #[must_use]
    pub const fn new(raw: u64) -> Self {
        Self(raw)
    }

    #[must_use]
    pub const fn get(self) -> u64 {
        self.0
    }

    #[must_use]
    pub(crate) const fn next(self) -> Option<Self> {
        match self.0.checked_add(1) {
            Some(next) => Some(Self(next)),
            None => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FiberId {
    arena_id: FiberArenaId,
    slot: FiberSlot,
    generation: FiberGeneration,
}

impl FiberId {
    #[must_use]
    pub const fn new(arena_id: FiberArenaId, slot: FiberSlot, generation: FiberGeneration) -> Self {
        Self {
            arena_id,
            slot,
            generation,
        }
    }

    #[must_use]
    pub const fn arena_id(self) -> FiberArenaId {
        self.arena_id
    }

    #[must_use]
    pub const fn slot(self) -> FiberSlot {
        self.slot
    }

    #[must_use]
    pub const fn generation(self) -> FiberGeneration {
        self.generation
    }

    pub fn validate_arena(self, expected: FiberArenaId) -> Result<(), FiberIdError> {
        if self.arena_id == expected {
            Ok(())
        } else {
            Err(FiberIdError::WrongArena {
                expected,
                actual: self.arena_id,
            })
        }
    }

    pub fn reject_self_link(self, target: Self, field: &'static str) -> Result<(), FiberIdError> {
        if self == target {
            Err(FiberIdError::SelfLink { id: self, field })
        } else {
            Ok(())
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FiberIdError {
    WrongArena {
        expected: FiberArenaId,
        actual: FiberArenaId,
    },
    InvalidSlot {
        arena_id: FiberArenaId,
        slot: FiberSlot,
    },
    StaleGeneration {
        id: FiberId,
        current_generation: FiberGeneration,
    },
    VacantSlot {
        id: FiberId,
    },
    SelfLink {
        id: FiberId,
        field: &'static str,
    },
}

impl Display for FiberIdError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::WrongArena { expected, actual } => write!(
                formatter,
                "fiber id belongs to arena {}, expected arena {}",
                actual.get(),
                expected.get()
            ),
            Self::InvalidSlot { arena_id, slot } => write!(
                formatter,
                "fiber slot {} is outside arena {}",
                slot.get(),
                arena_id.get()
            ),
            Self::StaleGeneration {
                id,
                current_generation,
            } => write!(
                formatter,
                "fiber slot {} has stale generation {}, current generation is {}",
                id.slot().get(),
                id.generation().get(),
                current_generation.get()
            ),
            Self::VacantSlot { id } => write!(
                formatter,
                "fiber slot {} in arena {} is vacant",
                id.slot().get(),
                id.arena_id().get()
            ),
            Self::SelfLink { id, field } => write!(
                formatter,
                "fiber slot {} cannot link {} to itself",
                id.slot().get(),
                field
            ),
        }
    }
}

impl Error for FiberIdError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fiber_id_arena_ids_are_non_zero_and_unique() {
        assert_eq!(FiberArenaId::new(0), None);

        let first = FiberArenaId::allocate();
        let second = FiberArenaId::allocate();

        assert_ne!(first, second);
        assert!(first.get() > 0);
        assert!(second.get() > 0);
    }

    #[test]
    fn fiber_id_rejects_wrong_arena_and_self_links() {
        let expected = FiberArenaId::allocate();
        let actual = FiberArenaId::allocate();
        let id = FiberId::new(actual, FiberSlot::new(0), FiberGeneration::INITIAL);

        assert_eq!(
            id.validate_arena(expected),
            Err(FiberIdError::WrongArena { expected, actual })
        );
        assert_eq!(
            id.reject_self_link(id, "child"),
            Err(FiberIdError::SelfLink { id, field: "child" })
        );
    }

    #[test]
    fn fiber_id_generation_next_fails_closed_on_overflow() {
        assert_eq!(
            FiberGeneration::new(u64::MAX).next(),
            None,
            "generation wrap would make stale fiber ids valid again"
        );
    }
}
