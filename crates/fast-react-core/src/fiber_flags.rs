//! React 19.2.6 fiber flag bitset primitives.
//!
//! These constants are anchored to
//! `packages/react-reconciler/src/ReactFiberFlags.js` from the React `v19.2.6`
//! source tag. React models flags as combinable bitsets and deliberately
//! aliases some bits for mutually exclusive fiber tags.

use std::ops::{BitAnd, BitAndAssign, BitOr, BitOrAssign, BitXor, BitXorAssign, Not, Sub};

pub const VALID_FIBER_FLAG_BITS: u32 = 0x1fff_ffff;

pub const REACT_19_2_6_ENABLE_CREATE_EVENT_HANDLE_API: bool = false;
pub const REACT_19_2_6_ENABLE_USE_EFFECT_EVENT_HOOK: bool = true;

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FiberFlags(u32);

impl FiberFlags {
    pub const NO: Self = Self(0);
    pub const ALL: Self = Self(VALID_FIBER_FLAG_BITS);

    pub const PERFORMED_WORK: Self = Self(1 << 0);
    pub const PLACEMENT: Self = Self(1 << 1);
    pub const UPDATE: Self = Self(1 << 2);
    pub const CLONED: Self = Self(1 << 3);
    pub const CHILD_DELETION: Self = Self(1 << 4);
    pub const CONTENT_RESET: Self = Self(1 << 5);
    pub const CALLBACK: Self = Self(1 << 6);
    pub const DID_CAPTURE: Self = Self(1 << 7);
    pub const FORCE_CLIENT_RENDER: Self = Self(1 << 8);
    pub const REF: Self = Self(1 << 9);
    pub const SNAPSHOT: Self = Self(1 << 10);
    pub const PASSIVE: Self = Self(1 << 11);
    pub const HYDRATING: Self = Self(1 << 12);
    pub const VISIBILITY: Self = Self(1 << 13);
    pub const STORE_CONSISTENCY: Self = Self(1 << 14);

    pub const HYDRATE: Self = Self::CALLBACK;
    pub const SCHEDULE_RETRY: Self = Self::STORE_CONSISTENCY;
    pub const SHOULD_SUSPEND_COMMIT: Self = Self::VISIBILITY;
    pub const VIEW_TRANSITION_NAMED_MOUNT: Self = Self::SHOULD_SUSPEND_COMMIT;
    pub const DID_DEFER: Self = Self::CONTENT_RESET;
    pub const FORM_RESET: Self = Self::SNAPSHOT;
    pub const AFFECTED_PARENT_LAYOUT: Self = Self::CONTENT_RESET;

    pub const LIFECYCLE_EFFECT: Self = Self(
        Self::PASSIVE.0
            | Self::UPDATE.0
            | Self::CALLBACK.0
            | Self::REF.0
            | Self::SNAPSHOT.0
            | Self::STORE_CONSISTENCY.0,
    );
    pub const LIFECYCLE_EFFECT_MASK: Self = Self::LIFECYCLE_EFFECT;
    pub const HOST_EFFECT: Self = Self(0x0000_7fff);
    pub const HOST_EFFECT_MASK: Self = Self::HOST_EFFECT;

    pub const INCOMPLETE: Self = Self(1 << 15);
    pub const SHOULD_CAPTURE: Self = Self(1 << 16);
    pub const FORCE_UPDATE_FOR_LEGACY_SUSPENSE: Self = Self(1 << 17);
    pub const DID_PROPAGATE_CONTEXT: Self = Self(1 << 18);
    pub const NEEDS_PROPAGATION: Self = Self(1 << 19);
    pub const FORKED: Self = Self(1 << 20);

    pub const SNAPSHOT_STATIC: Self = Self(1 << 21);
    pub const LAYOUT_STATIC: Self = Self(1 << 22);
    pub const REF_STATIC: Self = Self::LAYOUT_STATIC;
    pub const PASSIVE_STATIC: Self = Self(1 << 23);
    pub const MAY_SUSPEND_COMMIT: Self = Self(1 << 24);
    pub const VIEW_TRANSITION_NAMED_STATIC: Self =
        Self(Self::SNAPSHOT_STATIC.0 | Self::MAY_SUSPEND_COMMIT.0);
    pub const VIEW_TRANSITION_STATIC: Self = Self(1 << 25);

    pub const PLACEMENT_DEV: Self = Self(1 << 26);
    pub const MOUNT_LAYOUT_DEV: Self = Self(1 << 27);
    pub const MOUNT_PASSIVE_DEV: Self = Self(1 << 28);

    pub const BEFORE_MUTATION_EVENT_HANDLE: Self =
        Self(Self::SNAPSHOT.0 | Self::UPDATE.0 | Self::CHILD_DELETION.0 | Self::VISIBILITY.0);
    pub const BEFORE_MUTATION_EFFECT_EVENT: Self = Self(Self::SNAPSHOT.0 | Self::UPDATE.0);
    pub const BEFORE_MUTATION_MINIMAL: Self = Self::SNAPSHOT;
    pub const BEFORE_MUTATION: Self = Self::BEFORE_MUTATION_EFFECT_EVENT;
    pub const BEFORE_MUTATION_MASK_CREATE_EVENT_HANDLE: Self = Self::BEFORE_MUTATION_EVENT_HANDLE;
    pub const BEFORE_MUTATION_MASK_EFFECT_EVENT: Self = Self::BEFORE_MUTATION_EFFECT_EVENT;
    pub const BEFORE_MUTATION_MASK_MINIMAL: Self = Self::BEFORE_MUTATION_MINIMAL;
    pub const BEFORE_MUTATION_MASK: Self = Self::BEFORE_MUTATION;

    pub const BEFORE_AND_AFTER_MUTATION_TRANSITION: Self = Self(
        Self::SNAPSHOT.0
            | Self::UPDATE.0
            | Self::PLACEMENT.0
            | Self::CHILD_DELETION.0
            | Self::VISIBILITY.0
            | Self::CONTENT_RESET.0,
    );
    pub const BEFORE_AND_AFTER_MUTATION_TRANSITION_MASK: Self =
        Self::BEFORE_AND_AFTER_MUTATION_TRANSITION;
    pub const MUTATION: Self = Self(
        Self::PLACEMENT.0
            | Self::UPDATE.0
            | Self::CHILD_DELETION.0
            | Self::CONTENT_RESET.0
            | Self::REF.0
            | Self::HYDRATING.0
            | Self::VISIBILITY.0
            | Self::FORM_RESET.0,
    );
    pub const MUTATION_MASK: Self = Self::MUTATION;
    pub const LAYOUT: Self =
        Self(Self::UPDATE.0 | Self::CALLBACK.0 | Self::REF.0 | Self::VISIBILITY.0);
    pub const LAYOUT_MASK: Self = Self::LAYOUT;
    pub const PASSIVE_MASK: Self =
        Self(Self::PASSIVE.0 | Self::VISIBILITY.0 | Self::CHILD_DELETION.0);
    pub const PASSIVE_TRANSITION: Self =
        Self(Self::PASSIVE_MASK.0 | Self::UPDATE.0 | Self::PLACEMENT.0);
    pub const PASSIVE_TRANSITION_MASK: Self = Self::PASSIVE_TRANSITION;
    pub const STATIC: Self = Self(
        Self::LAYOUT_STATIC.0
            | Self::PASSIVE_STATIC.0
            | Self::REF_STATIC.0
            | Self::MAY_SUSPEND_COMMIT.0
            | Self::VIEW_TRANSITION_STATIC.0
            | Self::VIEW_TRANSITION_NAMED_STATIC.0,
    );
    pub const STATIC_MASK: Self = Self::STATIC;

    #[must_use]
    pub const fn from_bits(bits: u32) -> Option<Self> {
        if bits & !VALID_FIBER_FLAG_BITS == 0 {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn from_bits_truncate(bits: u32) -> Self {
        Self(bits & VALID_FIBER_FLAG_BITS)
    }

    #[must_use]
    pub const fn bits(self) -> u32 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_non_empty(self) -> bool {
        self.0 != 0
    }

    #[must_use]
    pub const fn merge(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    #[must_use]
    pub const fn remove(self, subset: Self) -> Self {
        Self(self.0 & !subset.0)
    }

    #[must_use]
    pub const fn intersect(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }

    #[must_use]
    pub const fn contains_any(self, other: Self) -> bool {
        self.intersect(other).is_non_empty()
    }

    #[must_use]
    pub const fn contains_all(self, subset: Self) -> bool {
        self.0 & subset.0 == subset.0
    }

    #[must_use]
    pub const fn is_subset_of(self, set: Self) -> bool {
        set.contains_all(self)
    }

    #[must_use]
    pub const fn host_effects(self) -> Self {
        self.intersect(Self::HOST_EFFECT)
    }

    #[must_use]
    pub const fn static_flags(self) -> Self {
        self.intersect(Self::STATIC)
    }

    #[must_use]
    pub const fn before_mutation_effects(self) -> Self {
        self.intersect(Self::BEFORE_MUTATION_MASK)
    }

    #[must_use]
    pub const fn mutation_effects(self) -> Self {
        self.intersect(Self::MUTATION_MASK)
    }

    #[must_use]
    pub const fn layout_effects(self) -> Self {
        self.intersect(Self::LAYOUT_MASK)
    }

    #[must_use]
    pub const fn passive_effects(self) -> Self {
        self.intersect(Self::PASSIVE_MASK)
    }

    #[must_use]
    pub const fn has_host_effects(self) -> bool {
        self.contains_any(Self::HOST_EFFECT)
    }

    #[must_use]
    pub const fn has_static_flags(self) -> bool {
        self.contains_any(Self::STATIC)
    }

    #[must_use]
    pub const fn has_before_mutation_effects(self) -> bool {
        self.contains_any(Self::BEFORE_MUTATION_MASK)
    }

    #[must_use]
    pub const fn has_mutation_effects(self) -> bool {
        self.contains_any(Self::MUTATION_MASK)
    }

    #[must_use]
    pub const fn has_layout_effects(self) -> bool {
        self.contains_any(Self::LAYOUT_MASK)
    }

    #[must_use]
    pub const fn has_passive_effects(self) -> bool {
        self.contains_any(Self::PASSIVE_MASK)
    }
}

impl BitOr for FiberFlags {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self::Output {
        self.merge(rhs)
    }
}

impl BitOrAssign for FiberFlags {
    fn bitor_assign(&mut self, rhs: Self) {
        *self = self.merge(rhs);
    }
}

impl BitAnd for FiberFlags {
    type Output = Self;

    fn bitand(self, rhs: Self) -> Self::Output {
        self.intersect(rhs)
    }
}

impl BitAndAssign for FiberFlags {
    fn bitand_assign(&mut self, rhs: Self) {
        *self = self.intersect(rhs);
    }
}

impl BitXor for FiberFlags {
    type Output = Self;

    fn bitxor(self, rhs: Self) -> Self::Output {
        Self(self.0 ^ rhs.0)
    }
}

impl BitXorAssign for FiberFlags {
    fn bitxor_assign(&mut self, rhs: Self) {
        *self = Self(self.0 ^ rhs.0);
    }
}

impl Sub for FiberFlags {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self.remove(rhs)
    }
}

impl Not for FiberFlags {
    type Output = Self;

    fn not(self) -> Self::Output {
        Self::from_bits_truncate(!self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fiber_flag_constants_match_react_19_2_6_source() {
        let expected = [
            ("NoFlags", FiberFlags::NO, 0x0000_0000),
            ("PerformedWork", FiberFlags::PERFORMED_WORK, 0x0000_0001),
            ("Placement", FiberFlags::PLACEMENT, 0x0000_0002),
            ("Update", FiberFlags::UPDATE, 0x0000_0004),
            ("Cloned", FiberFlags::CLONED, 0x0000_0008),
            ("ChildDeletion", FiberFlags::CHILD_DELETION, 0x0000_0010),
            ("ContentReset", FiberFlags::CONTENT_RESET, 0x0000_0020),
            ("Callback", FiberFlags::CALLBACK, 0x0000_0040),
            ("DidCapture", FiberFlags::DID_CAPTURE, 0x0000_0080),
            (
                "ForceClientRender",
                FiberFlags::FORCE_CLIENT_RENDER,
                0x0000_0100,
            ),
            ("Ref", FiberFlags::REF, 0x0000_0200),
            ("Snapshot", FiberFlags::SNAPSHOT, 0x0000_0400),
            ("Passive", FiberFlags::PASSIVE, 0x0000_0800),
            ("Hydrating", FiberFlags::HYDRATING, 0x0000_1000),
            ("Visibility", FiberFlags::VISIBILITY, 0x0000_2000),
            (
                "StoreConsistency",
                FiberFlags::STORE_CONSISTENCY,
                0x0000_4000,
            ),
            ("Incomplete", FiberFlags::INCOMPLETE, 0x0000_8000),
            ("ShouldCapture", FiberFlags::SHOULD_CAPTURE, 0x0001_0000),
            (
                "ForceUpdateForLegacySuspense",
                FiberFlags::FORCE_UPDATE_FOR_LEGACY_SUSPENSE,
                0x0002_0000,
            ),
            (
                "DidPropagateContext",
                FiberFlags::DID_PROPAGATE_CONTEXT,
                0x0004_0000,
            ),
            (
                "NeedsPropagation",
                FiberFlags::NEEDS_PROPAGATION,
                0x0008_0000,
            ),
            ("Forked", FiberFlags::FORKED, 0x0010_0000),
            ("SnapshotStatic", FiberFlags::SNAPSHOT_STATIC, 0x0020_0000),
            ("LayoutStatic", FiberFlags::LAYOUT_STATIC, 0x0040_0000),
            ("PassiveStatic", FiberFlags::PASSIVE_STATIC, 0x0080_0000),
            (
                "MaySuspendCommit",
                FiberFlags::MAY_SUSPEND_COMMIT,
                0x0100_0000,
            ),
            (
                "ViewTransitionStatic",
                FiberFlags::VIEW_TRANSITION_STATIC,
                0x0200_0000,
            ),
            ("PlacementDEV", FiberFlags::PLACEMENT_DEV, 0x0400_0000),
            ("MountLayoutDev", FiberFlags::MOUNT_LAYOUT_DEV, 0x0800_0000),
            (
                "MountPassiveDev",
                FiberFlags::MOUNT_PASSIVE_DEV,
                0x1000_0000,
            ),
        ];

        for (name, flag, bits) in expected {
            assert_eq!(flag.bits(), bits, "{name}");
            assert_eq!(FiberFlags::from_bits(bits), Some(flag), "{name}");
        }

        assert_eq!(VALID_FIBER_FLAG_BITS, 0x1fff_ffff);
        assert_eq!(FiberFlags::ALL.bits(), VALID_FIBER_FLAG_BITS);
    }

    #[test]
    fn fiber_flag_aliases_reuse_react_bits() {
        assert_eq!(FiberFlags::HYDRATE, FiberFlags::CALLBACK);
        assert_eq!(FiberFlags::SCHEDULE_RETRY, FiberFlags::STORE_CONSISTENCY);
        assert_eq!(FiberFlags::SHOULD_SUSPEND_COMMIT, FiberFlags::VISIBILITY);
        assert_eq!(
            FiberFlags::VIEW_TRANSITION_NAMED_MOUNT,
            FiberFlags::SHOULD_SUSPEND_COMMIT
        );
        assert_eq!(FiberFlags::DID_DEFER, FiberFlags::CONTENT_RESET);
        assert_eq!(FiberFlags::FORM_RESET, FiberFlags::SNAPSHOT);
        assert_eq!(
            FiberFlags::AFFECTED_PARENT_LAYOUT,
            FiberFlags::CONTENT_RESET
        );
        assert_eq!(FiberFlags::REF_STATIC, FiberFlags::LAYOUT_STATIC);
        assert_eq!(
            FiberFlags::VIEW_TRANSITION_NAMED_STATIC,
            FiberFlags::SNAPSHOT_STATIC | FiberFlags::MAY_SUSPEND_COMMIT
        );
    }

    #[test]
    fn fiber_flag_masks_match_react_19_2_6_source() {
        let feature_policy = (
            REACT_19_2_6_ENABLE_CREATE_EVENT_HANDLE_API,
            REACT_19_2_6_ENABLE_USE_EFFECT_EVENT_HOOK,
        );
        assert_eq!(feature_policy, (false, true));
        assert_eq!(FiberFlags::LIFECYCLE_EFFECT.bits(), 0x0000_4e44);
        assert_eq!(
            FiberFlags::LIFECYCLE_EFFECT_MASK,
            FiberFlags::LIFECYCLE_EFFECT
        );
        assert_eq!(FiberFlags::HOST_EFFECT.bits(), 0x0000_7fff);
        assert_eq!(FiberFlags::HOST_EFFECT_MASK, FiberFlags::HOST_EFFECT);
        assert_eq!(FiberFlags::BEFORE_MUTATION_EVENT_HANDLE.bits(), 0x0000_2414);
        assert_eq!(FiberFlags::BEFORE_MUTATION_EFFECT_EVENT.bits(), 0x0000_0404);
        assert_eq!(FiberFlags::BEFORE_MUTATION_MINIMAL.bits(), 0x0000_0400);
        assert_eq!(
            FiberFlags::BEFORE_MUTATION,
            FiberFlags::BEFORE_MUTATION_EFFECT_EVENT
        );
        assert_eq!(
            FiberFlags::BEFORE_MUTATION_MASK_CREATE_EVENT_HANDLE,
            FiberFlags::BEFORE_MUTATION_EVENT_HANDLE
        );
        assert_eq!(
            FiberFlags::BEFORE_MUTATION_MASK_EFFECT_EVENT,
            FiberFlags::BEFORE_MUTATION_EFFECT_EVENT
        );
        assert_eq!(
            FiberFlags::BEFORE_MUTATION_MASK_MINIMAL,
            FiberFlags::BEFORE_MUTATION_MINIMAL
        );
        assert_eq!(
            FiberFlags::BEFORE_MUTATION_MASK,
            FiberFlags::BEFORE_MUTATION
        );
        assert_eq!(
            FiberFlags::BEFORE_AND_AFTER_MUTATION_TRANSITION.bits(),
            0x0000_2436
        );
        assert_eq!(
            FiberFlags::BEFORE_AND_AFTER_MUTATION_TRANSITION_MASK,
            FiberFlags::BEFORE_AND_AFTER_MUTATION_TRANSITION
        );
        assert_eq!(FiberFlags::MUTATION.bits(), 0x0000_3636);
        assert_eq!(FiberFlags::MUTATION_MASK, FiberFlags::MUTATION);
        assert_eq!(FiberFlags::LAYOUT.bits(), 0x0000_2244);
        assert_eq!(FiberFlags::LAYOUT_MASK, FiberFlags::LAYOUT);
        assert_eq!(FiberFlags::PASSIVE_MASK.bits(), 0x0000_2810);
        assert_eq!(FiberFlags::PASSIVE_TRANSITION.bits(), 0x0000_2816);
        assert_eq!(
            FiberFlags::PASSIVE_TRANSITION_MASK,
            FiberFlags::PASSIVE_TRANSITION
        );
        assert_eq!(FiberFlags::STATIC.bits(), 0x03e0_0000);
        assert_eq!(FiberFlags::STATIC_MASK, FiberFlags::STATIC);
    }

    #[test]
    fn fiber_flags_support_empty_and_bitwise_operations() {
        let mut flags = FiberFlags::NO;
        assert!(flags.is_empty());
        assert!(!flags.has_host_effects());

        flags |= FiberFlags::PLACEMENT | FiberFlags::UPDATE;
        assert!(flags.is_non_empty());
        assert!(flags.contains_all(FiberFlags::PLACEMENT));
        assert!(flags.contains_any(FiberFlags::MUTATION));
        assert_eq!((flags & FiberFlags::MUTATION).bits(), 0x0000_0006);
        assert_eq!((flags - FiberFlags::PLACEMENT), FiberFlags::UPDATE);

        flags ^= FiberFlags::UPDATE;
        assert_eq!(flags, FiberFlags::PLACEMENT);
        assert_eq!((!FiberFlags::NO).bits(), VALID_FIBER_FLAG_BITS);
    }

    #[test]
    fn fiber_flags_filter_host_and_static_membership() {
        let flags = FiberFlags::PLACEMENT
            | FiberFlags::LAYOUT_STATIC
            | FiberFlags::PASSIVE_STATIC
            | FiberFlags::MOUNT_PASSIVE_DEV;

        assert_eq!(flags.host_effects(), FiberFlags::PLACEMENT);
        assert_eq!(
            flags.static_flags(),
            FiberFlags::LAYOUT_STATIC | FiberFlags::PASSIVE_STATIC
        );
        assert!(FiberFlags::PLACEMENT.is_subset_of(FiberFlags::MUTATION));
        assert!(FiberFlags::PASSIVE_STATIC.is_subset_of(FiberFlags::STATIC));
        assert!(!FiberFlags::MOUNT_PASSIVE_DEV.has_static_flags());
    }

    #[test]
    fn fiber_phase_masks_filter_membership_for_commit_traversal() {
        let flags = FiberFlags::SNAPSHOT
            | FiberFlags::UPDATE
            | FiberFlags::PLACEMENT
            | FiberFlags::CHILD_DELETION
            | FiberFlags::CALLBACK
            | FiberFlags::PASSIVE
            | FiberFlags::MOUNT_LAYOUT_DEV;

        assert_eq!(
            flags.before_mutation_effects(),
            FiberFlags::SNAPSHOT | FiberFlags::UPDATE
        );
        assert_eq!(
            flags.mutation_effects(),
            FiberFlags::UPDATE
                | FiberFlags::PLACEMENT
                | FiberFlags::CHILD_DELETION
                | FiberFlags::SNAPSHOT
        );
        assert_eq!(
            flags.layout_effects(),
            FiberFlags::UPDATE | FiberFlags::CALLBACK
        );
        assert_eq!(
            flags.passive_effects(),
            FiberFlags::PASSIVE | FiberFlags::CHILD_DELETION
        );

        assert!(flags.has_before_mutation_effects());
        assert!(flags.has_mutation_effects());
        assert!(flags.has_layout_effects());
        assert!(flags.has_passive_effects());
        assert!(!FiberFlags::MOUNT_LAYOUT_DEV.has_layout_effects());
    }

    #[test]
    fn fiber_flags_constructors_reject_unknown_bits() {
        assert_eq!(FiberFlags::from_bits(0x2000_0000), None);
        assert_eq!(FiberFlags::from_bits(u32::MAX), None);
        assert_eq!(FiberFlags::from_bits_truncate(u32::MAX), FiberFlags::ALL);
    }
}
