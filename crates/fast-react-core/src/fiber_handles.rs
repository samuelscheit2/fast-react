//! Opaque slots used by core fiber records.
//!
//! These handles deliberately store only typed numeric slots. JS values, host
//! instances, refs, callbacks, wakeables, scheduler handles, and renderer
//! containers belong to binding or reconciler layers.

macro_rules! opaque_handle {
    ($name:ident) => {
        #[repr(transparent)]
        #[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
        pub struct $name(u64);

        impl $name {
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
    };
}

opaque_handle!(ElementTypeHandle);
opaque_handle!(FiberTypeHandle);
opaque_handle!(PropsHandle);
opaque_handle!(StateHandle);
opaque_handle!(StateNodeHandle);
opaque_handle!(RefHandle);
opaque_handle!(DependenciesHandle);
opaque_handle!(UpdateQueueHandle);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fiber_handles_use_zero_as_the_null_slot() {
        assert!(ElementTypeHandle::NONE.is_none());
        assert!(FiberTypeHandle::NONE.is_none());
        assert!(PropsHandle::NONE.is_none());
        assert!(StateHandle::NONE.is_none());
        assert!(StateNodeHandle::NONE.is_none());
        assert!(RefHandle::NONE.is_none());
        assert!(DependenciesHandle::NONE.is_none());
        assert!(UpdateQueueHandle::NONE.is_none());
    }

    #[test]
    fn fiber_handles_preserve_opaque_slot_identity() {
        let props = PropsHandle::from_raw(42);
        let state = StateHandle::from_raw(42);

        assert_eq!(props.raw(), state.raw());
        assert!(props.is_some());
        assert!(state.is_some());
    }
}
